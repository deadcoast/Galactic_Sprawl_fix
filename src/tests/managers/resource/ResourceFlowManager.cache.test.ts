import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceFlowManager } from '../../../managers/resource/ResourceFlowManager';
import {
  ResourcePriority,
  ResourceState,
  ResourceType,
} from '../../../types/resources/ResourceTypes';

// Import FlowNode and FlowConnection types
import type { FlowNodeType } from '../../../managers/resource/ResourceFlowManager';

// Mock the resourceValidation module
vi.mock('../../../utils/resources/resourceValidation', () => ({
  validateResourceFlow: vi.fn().mockImplementation(() => true),
  validateResourceTransfer: vi.fn().mockImplementation(() => true),
}));

describe('ResourceFlowManager Cache System', () => {
  let flowManager: ResourceFlowManager;
  const defaultPriority: ResourcePriority = { type: 'energy', priority: 1, consumers: [] };

  // Mock Date.now for testing cache expiration
  let currentTime = 0;
  const originalDateNow = Date.now;

  beforeEach(() => {
    vi.clearAllMocks();
    currentTime = 1000;

    // Mock Date.now to control time in tests
    Date.now = vi.fn(() => currentTime);

    // Create with specific cache TTL for testing (500ms)
    flowManager = new ResourceFlowManager(100, 500, 10);
  });

  afterEach(() => {
    flowManager.cleanup();
    // Restore original Date.now
    Date.now = originalDateNow;
  });

  describe('Cache Retrieval and Updating', () => {
    it('should cache resource state on first retrieval', () => {
      // Prepare a resource state
      const resourceState: ResourceState = {
        current: 100,
        max: 1000,
        min: 0,
        production: 10,
        consumption: 5,
      };

      // Update the resource state
      flowManager.updateResourceState('energy', resourceState);

      // First retrieval should get from network and cache it
      const getResourceStateSpy = vi.spyOn(flowManager['network'].resourceStates, 'get');
      const firstResult = flowManager.getResourceState('energy');

      expect(getResourceStateSpy).toHaveBeenCalledTimes(1);
      expect(firstResult).toEqual(resourceState);

      // Second retrieval should get from cache (no additional calls to network.resourceStates.get)
      getResourceStateSpy.mockClear();
      const secondResult = flowManager.getResourceState('energy');

      expect(getResourceStateSpy).toHaveBeenCalledTimes(0); // Should not be called again
      expect(secondResult).toEqual(resourceState);
    });

    it('should return new state after cache invalidation', () => {
      // Initial state
      const initialState: ResourceState = {
        current: 100,
        max: 1000,
        min: 0,
        production: 10,
        consumption: 5,
      };

      // Updated state
      const updatedState: ResourceState = {
        current: 200,
        max: 1000,
        min: 0,
        production: 20,
        consumption: 10,
      };

      // Set initial state and retrieve to cache it
      flowManager.updateResourceState('energy', initialState);
      const firstResult = flowManager.getResourceState('energy');
      expect(firstResult).toEqual(initialState);

      // Update state (which should invalidate cache)
      flowManager.updateResourceState('energy', updatedState);

      // Should get updated state
      const secondResult = flowManager.getResourceState('energy');
      expect(secondResult).toEqual(updatedState);
    });
  });

  describe('Cache Expiration', () => {
    it('should expire cache entries based on TTL', () => {
      // Set initial state
      const resourceState: ResourceState = {
        current: 100,
        max: 1000,
        min: 0,
        production: 10,
        consumption: 5,
      };

      flowManager.updateResourceState('energy', resourceState);

      // First retrieval - caches the result
      const getResourceStateSpy = vi.spyOn(flowManager['network'].resourceStates, 'get');
      flowManager.getResourceState('energy');
      expect(getResourceStateSpy).toHaveBeenCalledTimes(1);
      getResourceStateSpy.mockClear();

      // Retrieval within TTL - should use cache
      currentTime += 300; // Advance time, but still within TTL (500ms)
      flowManager.getResourceState('energy');
      expect(getResourceStateSpy).toHaveBeenCalledTimes(0);
      getResourceStateSpy.mockClear();

      // Retrieval after TTL - should fetch from network again
      currentTime += 300; // Advance time beyond TTL (total 600ms > 500ms TTL)
      flowManager.getResourceState('energy');
      expect(getResourceStateSpy).toHaveBeenCalledTimes(1);
    });

    it('should automatically invalidate cache when registering a node with affected resource type', () => {
      // Set initial state
      const resourceState: ResourceState = {
        current: 100,
        max: 1000,
        min: 0,
        production: 10,
        consumption: 5,
      };

      flowManager.updateResourceState('energy', resourceState);

      // Cache the state
      flowManager.getResourceState('energy');

      // Register a node with the same resource type
      const getResourceStateSpy = vi.spyOn(flowManager['network'].resourceStates, 'get');
      flowManager.registerNode({
        id: 'new-producer',
        type: 'producer' as FlowNodeType,
        resources: ['energy' as ResourceType],
        priority: defaultPriority,
        active: true,
      });

      // Should access network directly after cache invalidation
      getResourceStateSpy.mockClear();
      flowManager.getResourceState('energy');
      expect(getResourceStateSpy).toHaveBeenCalledTimes(1);
    });

    it('should not invalidate cache for unrelated resource types', () => {
      // Set initial states for two different resources
      const energyState: ResourceState = {
        current: 100,
        max: 1000,
        min: 0,
        production: 10,
        consumption: 5,
      };

      const mineralsState: ResourceState = {
        current: 50,
        max: 500,
        min: 0,
        production: 5,
        consumption: 2,
      };

      flowManager.updateResourceState('energy', energyState);
      flowManager.updateResourceState('minerals', mineralsState);

      // Cache both states
      flowManager.getResourceState('energy');
      flowManager.getResourceState('minerals');

      // Register a node that affects only minerals
      const getResourceStateSpy = vi.spyOn(flowManager['network'].resourceStates, 'get');
      flowManager.registerNode({
        id: 'minerals-producer',
        type: 'producer' as FlowNodeType,
        resources: ['minerals' as ResourceType],
        priority: { type: 'minerals', priority: 1, consumers: [] },
        active: true,
      });

      // Energy cache should still be valid
      getResourceStateSpy.mockClear();
      flowManager.getResourceState('energy');
      expect(getResourceStateSpy).toHaveBeenCalledTimes(0);

      // Minerals cache should be invalidated
      getResourceStateSpy.mockClear();
      flowManager.getResourceState('minerals');
      expect(getResourceStateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Isolation', () => {
    it('should clone state objects to prevent reference modification issues', () => {
      // Initial state
      const initialState: ResourceState = {
        current: 100,
        max: 1000,
        min: 0,
        production: 10,
        consumption: 5,
      };

      flowManager.updateResourceState('energy', initialState);

      // Get the resource state (which will be cached)
      const state = flowManager.getResourceState('energy');

      // Modify the returned state object
      if (state) {
        state.current = 200;
      }

      // Get the state again - should not be affected by the modification
      const retrievedState = flowManager.getResourceState('energy');
      expect(retrievedState?.current).toBe(100); // Original value, not 200
    });
  });
});

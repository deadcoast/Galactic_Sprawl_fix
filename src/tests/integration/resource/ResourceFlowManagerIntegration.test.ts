import { ResourceType } from "./../../../types/resources/ResourceTypes";
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceFlowManager } from '../../../managers/resource/ResourceFlowManager';
import { ResourceRegistry } from '../../../registry/ResourceRegistry';
import { ResourceRegistryIntegration } from '../../../registry/ResourceRegistryIntegration';
import {
  FlowNodeType,
  ResourceStateClass,
  ResourceType as StandardizedResourceType,
} from '../../../types/resources/StandardizedResourceTypes';
import {
  toEnumResourceType,
  toStringResourceType,
} from '../../../utils/resources/ResourceTypeConverter';

// Mock the dependencies
vi.mock('../../../registry/ResourceRegistry', () => ({
  ResourceRegistry: {
    getInstance: vi.fn(() => ({
      subscribe: vi.fn(() => () => {}),
      unsubscribe: vi.fn(),
      publish: vi.fn(),
      registerResource: vi.fn(),
      getResourceMetadata: vi.fn(),
      getAllResources: vi.fn(() => new Map()),
      setConversionRate: vi.fn(),
      getConversionRate: vi.fn(() => 1.0),
    })),
  },
}));

vi.mock('../../../registry/ResourceRegistryIntegration', () => ({
  ResourceRegistryIntegration: {
    getInstance: vi.fn(() => ({
      syncResourceAvailability: vi.fn(),
      syncConversionRecipes: vi.fn(),
      updateResourceAvailability: vi.fn(),
      updateConversionRecipes: vi.fn(),
    })),
  },
}));

describe('ResourceFlowManager Integration Tests', () => {
  let resourceFlowManager: ResourceFlowManager;
  let resourceRegistry: ResourceRegistry;
  let registryIntegration: ResourceRegistryIntegration;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Get instances
    resourceFlowManager = ResourceFlowManager.getInstance();
    resourceRegistry = ResourceRegistry.getInstance();
    registryIntegration = ResourceRegistryIntegration.getInstance();

    // Initialize the manager
    resourceFlowManager.initialize();
  });

  afterEach(() => {
    // Clean up
    resourceFlowManager.dispose();
  });

  describe('ResourceRegistry Integration', () => {
    it('should sync with ResourceRegistry during initialization', () => {
      // Verify that syncResourceAvailability was called with the resourceFlowManager
      expect(registryIntegration.syncResourceAvailability).toHaveBeenCalledWith(
        expect.objectContaining({
          getAllResourceStates: expect.any(Function),
          getAllConversionRecipes: expect.any(Function),
          setConversionRate: expect.any(Function),
        })
      );

      // Verify that syncConversionRecipes was called with the resourceFlowManager
      expect(registryIntegration.syncConversionRecipes).toHaveBeenCalledWith(
        expect.objectContaining({
          getAllResourceStates: expect.any(Function),
          getAllConversionRecipes: expect.any(Function),
          setConversionRate: expect.any(Function),
        })
      );
    });

    it('should provide resource states to the registry', () => {
      // Setup: Add a resource state
      const resourceState = new ResourceStateClass({
        type: StandardizedResourceType.MINERALS,
        current: 100,
        max: 1000,
        min: 0,
        production: 10,
        consumption: 5,
      }).asObject();

      resourceFlowManager.updateResourceState(ResourceType.MINERALS, resourceState);

      // Get all resource states
      const resourceStates = resourceFlowManager.getAllResourceStates();

      // Verify the resource state is included
      expect(resourceStates.get(ResourceType.MINERALS)).toEqual({ available: 100 });
    });

    it('should provide conversion recipes to the registry', () => {
      // Setup: Set a conversion rate
      resourceFlowManager.setConversionRate(ResourceType.MINERALS, ResourceType.ENERGY, 2.5);

      // Get all conversion recipes
      const recipes = resourceFlowManager.getAllConversionRecipes();

      // Verify the recipe is included
      expect(recipes).toContainEqual({
        input: { type: ResourceType.MINERALS, amount: 1 },
        output: { type: ResourceType.ENERGY, amount: 2.5 },
      });
    });

    it('should update conversion rates when requested', () => {
      // Setup: Set an initial conversion rate
      resourceFlowManager.setConversionRate(ResourceType.MINERALS, ResourceType.ENERGY, 1.0);

      // Update the conversion rate
      resourceFlowManager.setConversionRate(ResourceType.MINERALS, ResourceType.ENERGY, 3.0);

      // Get all conversion recipes
      const recipes = resourceFlowManager.getAllConversionRecipes();

      // Verify the recipe was updated
      expect(recipes).toContainEqual({
        input: { type: ResourceType.MINERALS, amount: 1 },
        output: { type: ResourceType.ENERGY, amount: 3.0 },
      });
    });
  });

  describe('Resource Type Conversion', () => {
    it('should correctly convert between string and enum resource types', () => {
      // Test string to enum conversion
      const mineralEnum = toEnumResourceType(ResourceType.MINERALS);
      expect(mineralEnum).toBe(StandardizedResourceType.MINERALS);

      // Test enum to string conversion
      const mineralString = toStringResourceType(StandardizedResourceType.MINERALS);
      expect(mineralString).toBe(ResourceType.MINERALS);
    });

    it('should handle resource transfers with different resource type formats', async () => {
      // Setup: Create nodes and connections
      const producerId = 'producer-1';
      const consumerId = 'consumer-1';

      resourceFlowManager.registerNode({
        id: producerId,
        type: FlowNodeType.PRODUCER,
        resourceType: ResourceType.MINERALS,
        capacity: 1000,
        rate: 10,
        active: true,
      });

      resourceFlowManager.registerNode({
        id: consumerId,
        type: FlowNodeType.CONSUMER,
        resourceType: ResourceType.MINERALS,
        capacity: 1000,
        rate: 5,
        active: true,
      });

      resourceFlowManager.registerConnection({
        id: 'connection-1',
        source: producerId,
        target: consumerId,
        resourceType: StandardizedResourceType.MINERALS,
        maxFlow: 10,
        active: true,
      });

      // Update resource state
      const resourceState = new ResourceStateClass({
        type: StandardizedResourceType.MINERALS,
        current: 100,
        max: 1000,
        min: 0,
        production: 10,
        consumption: 5,
      }).asObject();

      resourceFlowManager.updateResourceState(ResourceType.MINERALS, resourceState);

      // Optimize flows
      const result = await resourceFlowManager.optimizeFlows();

      // Verify that transfers were generated
      expect(result.transfers.length).toBeGreaterThan(0);

      // Verify that the transfers have the correct resource type
      const transfer = result.transfers[0];
      expect(transfer.type).toBe(StandardizedResourceType.MINERALS);
    });
  });

  describe('Resource Flow Optimization', () => {
    it('should optimize resource flows between nodes', async () => {
      // Setup: Create nodes and connections
      const producerId = 'producer-1';
      const consumerId = 'consumer-1';

      resourceFlowManager.registerNode({
        id: producerId,
        type: FlowNodeType.PRODUCER,
        resourceType: ResourceType.MINERALS,
        capacity: 1000,
        rate: 10,
        active: true,
      });

      resourceFlowManager.registerNode({
        id: consumerId,
        type: FlowNodeType.CONSUMER,
        resourceType: ResourceType.MINERALS,
        capacity: 1000,
        rate: 5,
        active: true,
      });

      resourceFlowManager.registerConnection({
        id: 'connection-1',
        source: producerId,
        target: consumerId,
        resourceType: StandardizedResourceType.MINERALS,
        maxFlow: 10,
        active: true,
      });

      // Update resource state
      const resourceState = new ResourceStateClass({
        type: StandardizedResourceType.MINERALS,
        current: 100,
        max: 1000,
        min: 0,
        production: 10,
        consumption: 5,
      }).asObject();

      resourceFlowManager.updateResourceState(ResourceType.MINERALS, resourceState);

      // Optimize flows
      const result = await resourceFlowManager.optimizeFlows();

      // Verify that transfers were generated
      expect(result.transfers.length).toBeGreaterThan(0);

      // Verify that the transfers have the correct properties
      const transfer = result.transfers[0];
      expect(transfer.source).toBe(producerId);
      expect(transfer.target).toBe(consumerId);
      expect(transfer.amount).toBeGreaterThan(0);
    });

    it('should handle resource conversion during flow optimization', async () => {
      // Setup: Create converter node and connections
      const producerId = 'producer-1';
      const converterId = 'converter-1';
      const consumerId = 'consumer-1';

      resourceFlowManager.registerNode({
        id: producerId,
        type: FlowNodeType.PRODUCER,
        resourceType: ResourceType.MINERALS,
        capacity: 1000,
        rate: 10,
        active: true,
      });

      resourceFlowManager.registerNode({
        id: converterId,
        type: FlowNodeType.CONVERTER,
        resourceType: ResourceType.MINERALS,
        capacity: 1000,
        rate: 5,
        active: true,
      });

      resourceFlowManager.registerNode({
        id: consumerId,
        type: FlowNodeType.CONSUMER,
        resourceType: ResourceType.ENERGY,
        capacity: 1000,
        rate: 5,
        active: true,
      });

      resourceFlowManager.registerConnection({
        id: 'connection-1',
        source: producerId,
        target: converterId,
        resourceType: StandardizedResourceType.MINERALS,
        maxFlow: 10,
        active: true,
      });

      resourceFlowManager.registerConnection({
        id: 'connection-2',
        source: converterId,
        target: consumerId,
        resourceType: StandardizedResourceType.ENERGY,
        maxFlow: 10,
        active: true,
      });

      // Set conversion rate
      resourceFlowManager.setConversionRate(ResourceType.MINERALS, ResourceType.ENERGY, 2.0);

      // Update resource states
      const mineralState = new ResourceStateClass({
        type: StandardizedResourceType.MINERALS,
        current: 100,
        max: 1000,
        min: 0,
        production: 10,
        consumption: 5,
      }).asObject();

      const energyState = new ResourceStateClass({
        type: StandardizedResourceType.ENERGY,
        current: 50,
        max: 1000,
        min: 0,
        production: 5,
        consumption: 10,
      }).asObject();

      resourceFlowManager.updateResourceState(ResourceType.MINERALS, mineralState);
      resourceFlowManager.updateResourceState(ResourceType.ENERGY, energyState);

      // Optimize flows
      const result = await resourceFlowManager.optimizeFlows();

      // Verify that transfers were generated
      expect(result.transfers.length).toBeGreaterThan(0);
    });
  });
});

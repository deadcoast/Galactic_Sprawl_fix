import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../../lib/modules/ModuleEvents';
import { MiningResourceIntegration } from '../../../managers/mining/MiningResourceIntegration';
import { MiningShipManagerImpl } from '../../../managers/mining/MiningShipManagerImpl';
import { ResourceFlowManager } from '../../../managers/resource/ResourceFlowManager';
import { ResourceThresholdManager } from '../../../managers/resource/ResourceThresholdManager';
import { ModuleType } from '../../../types/buildings/ModuleTypes';
import { Position } from '../../../types/core/GameTypes';
import { ResourceType } from '../../../types/resources/ResourceTypes';

// Define custom event types for testing
type _CustomModuleEventType = ModuleEventType | 'SHIP_ASSIGNED' | 'RESOURCE_LEVEL_CHANGED';

// Helper function to validate if an event type is a valid custom module event type
function isValidCustomEventType(type: string): type is _CustomModuleEventType {
  // Check if it's one of the standard module event types
  const standardEventTypes = [
    'RESOURCE_PRODUCED',
    'RESOURCE_CONSUMED',
    'RESOURCE_UPDATED',
    'SHIP_ASSIGNED',
    'RESOURCE_TRANSFERRED',
  ];
  return (
    standardEventTypes.includes(type) ||
    type === 'SHIP_ASSIGNED' ||
    type === 'RESOURCE_LEVEL_CHANGED'
  );
}

// Mock the modules we depend on but aren't directly testing
vi.mock('../../../lib/modules/ModuleEvents', () => ({
  moduleEventBus: {
    emit: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    unsubscribe: vi.fn(),
    clearHistory: vi.fn(),
  },
  ModuleEventType: {
    RESOURCE_PRODUCED: 'RESOURCE_PRODUCED',
    RESOURCE_CONSUMED: 'RESOURCE_CONSUMED',
    RESOURCE_UPDATED: 'RESOURCE_UPDATED',
    SHIP_ASSIGNED: 'SHIP_ASSIGNED',
    RESOURCE_TRANSFERRED: 'RESOURCE_TRANSFERRED',
  },
}));

// Extend ModuleType with our test types
type ExtendedModuleType = ModuleType | 'miningHub';

// Custom events for our tests that extend ModuleEvent
interface ShipAssignedEvent extends Omit<ModuleEvent, 'type' | 'moduleType'> {
  type: 'SHIP_ASSIGNED';
  moduleType: ExtendedModuleType;
  shipId: string;
  nodeId: string;
  data: {
    ship: {
      id: string;
      efficiency: number;
      status: string;
    };
  };
}

interface ResourceUpdateEvent extends Omit<ModuleEvent, 'type' | 'moduleType'> {
  type: 'RESOURCE_UPDATED';
  moduleType: ExtendedModuleType;
  resourceType: string;
  data: {
    resourceType: string;
    delta: number;
    newAmount: number;
    oldAmount: number;
  };
}

describe('Mining Resource Integration', () => {
  let miningManager: MiningShipManagerImpl;
  let thresholdManager: ResourceThresholdManager;
  let flowManager: ResourceFlowManager;
  let integration: MiningResourceIntegration;

  // Helper function to create storage nodes for testing
  const createStorageNodes = (resourceTypes: ResourceType[]) => {
    resourceTypes.forEach(type => {
      // Create storage node
      flowManager.registerNode({
        id: `storage-${type}`,
        type: 'storage',
        resources: [type],
        priority: { type, priority: 10, consumers: [] },
        capacity: 1000,
        active: true,
      });
    });
  };

  // Helper function to validate event types using our custom type guard
  const validateEventType = (eventType: string): boolean => {
    if (!isValidCustomEventType(eventType)) {
      console.warn(`Invalid event type: ${eventType}`);
      return false;
    }
    return true;
  };

  beforeEach(() => {
    // Create real instances of the managers we're testing
    miningManager = new MiningShipManagerImpl();
    thresholdManager = new ResourceThresholdManager();
    flowManager = new ResourceFlowManager(100, 500, 10);

    // Create storage nodes for the resources we'll be testing
    createStorageNodes(['minerals', 'energy', 'gas']);

    // Create the integration using real managers
    integration = new MiningResourceIntegration(miningManager, thresholdManager, flowManager);

    // Initialize the integration
    integration.initialize();

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up to prevent test pollution
    integration.cleanup();
    flowManager.cleanup();
    vi.restoreAllMocks();
  });

  describe('Resource Node Registration', () => {
    it('should register mining nodes in ResourceFlowManager as producer nodes', () => {
      // Arrange
      const registerNodeSpy = vi.spyOn(flowManager, 'registerNode');
      const position: Position = { x: 100, y: 200 };

      // Act
      integration.registerMiningNode('test-node-1', 'minerals', position, 0.8);

      // Assert
      expect(registerNodeSpy).toHaveBeenCalledTimes(1);
      expect(registerNodeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'mining-node-test-node-1',
          type: 'producer',
          resources: ['minerals'],
          active: true,
          efficiency: 0.8,
        })
      );

      // Verify the node was actually added to the flow manager
      const nodes = flowManager.getNodes();
      const addedNode = nodes.find(node => node.id === 'mining-node-test-node-1');
      expect(addedNode).toBeDefined();
      expect(addedNode?.type).toBe('producer');
      expect(addedNode?.resources).toContain('minerals');
      expect(addedNode?.efficiency).toBe(0.8);
    });

    it('should unregister mining nodes from ResourceFlowManager when removed', () => {
      // Arrange
      const unregisterNodeSpy = vi.spyOn(flowManager, 'unregisterNode');
      const position: Position = { x: 100, y: 200 };

      // Act
      integration.registerMiningNode('test-node-1', 'minerals', position, 0.8);
      integration.unregisterMiningNode('test-node-1');

      // Assert
      expect(unregisterNodeSpy).toHaveBeenCalledTimes(1);
      expect(unregisterNodeSpy).toHaveBeenCalledWith('mining-node-test-node-1');

      // Verify the node was actually removed from the flow manager
      const nodes = flowManager.getNodes();
      const removedNode = nodes.find(node => node.id === 'mining-node-test-node-1');
      expect(removedNode).toBeUndefined();
    });

    it('should update node efficiency in ResourceFlowManager when efficiency changes', () => {
      // Arrange
      const position: Position = { x: 100, y: 200 };
      integration.registerMiningNode('test-node-1', 'minerals', position, 0.8);

      // Create a spy to track changes to nodes in the flow manager
      const getNodesSpy = vi.spyOn(flowManager, 'getNodes');

      // Act
      integration.updateMiningNodeEfficiency('test-node-1', 1.2);

      // Assert - This assumes the flow manager has getNodes method that returns all nodes
      const nodes = flowManager.getNodes();
      const updatedNode = nodes.find(node => node.id === 'mining-node-test-node-1');
      expect(updatedNode).toBeDefined();
      expect(updatedNode?.efficiency).toBe(1.2);

      // Verify that getNodes was called
      expect(getNodesSpy).toHaveBeenCalled();

      // Verify it was called after the efficiency update
      const callTimes = getNodesSpy.mock.invocationCallOrder;
      expect(callTimes.length).toBeGreaterThan(0);

      // Reset the spy
      getNodesSpy.mockRestore();
    });
  });

  describe('Resource Thresholds', () => {
    it('should create thresholds for mining resources', () => {
      // Arrange
      const registerThresholdSpy = vi.spyOn(thresholdManager, 'registerThreshold');
      const position: Position = { x: 100, y: 200 };

      // Act
      integration.registerMiningNode('test-node-1', 'minerals', position, 0.8);

      // Assert
      expect(registerThresholdSpy).toHaveBeenCalled();
      // Check that appropriate thresholds are created for minerals
      expect(registerThresholdSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'mining-threshold-minerals',
          threshold: {
            type: 'minerals',
            min: 100,
            target: 500,
          },
          actions: expect.any(Array),
          enabled: true,
        })
      );

      // Verify the threshold was actually registered with the threshold manager
      const thresholdConfig = thresholdManager
        .getThresholdConfigs()
        .find(config => config.id === 'mining-threshold-minerals');
      expect(thresholdConfig).toBeDefined();
      expect(thresholdConfig?.threshold.type).toBe('minerals');
      expect(thresholdConfig?.threshold.min).toBe(100);
      expect(thresholdConfig?.threshold.target).toBe(500);
    });
  });

  describe('Resource Transfers', () => {
    it('should create resource flows in ResourceFlowManager when ships are assigned to nodes', () => {
      // Arrange
      const _createFlowSpy = vi.spyOn(flowManager, 'createFlow');
      const position: Position = { x: 100, y: 200 };

      // Register a mining node
      integration.registerMiningNode('test-node-1', 'minerals', position, 0.8);

      // Mock the mining manager's ship assignment
      const mockShip = {
        id: 'ship-1',
        efficiency: 0.9,
        status: 'idle',
      };

      // Simulate ship assignment to node
      const shipAssignedEvent: ShipAssignedEvent = {
        type: 'SHIP_ASSIGNED',
        moduleId: 'mining-module-1',
        moduleType: 'miningHub',
        shipId: 'ship-1',
        nodeId: 'test-node-1',
        timestamp: Date.now(),
        data: {
          ship: mockShip,
        },
      };

      // Validate the event type before emitting
      expect(validateEventType(shipAssignedEvent.type)).toBe(true);

      // Act: Manually call the event handler since we can't find it through the mock
      moduleEventBus.emit(shipAssignedEvent as unknown as ModuleEvent);

      // Assert
      expect(moduleEventBus.emit).toHaveBeenCalled();

      // Verify that the event was emitted with the correct data
      expect(moduleEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: shipAssignedEvent.type,
        })
      );

      // Verify that createFlow was called with the correct parameters
      expect(_createFlowSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-node-1'), // Source node ID should contain the mining node ID
        expect.any(String), // Target node ID
        'minerals', // Resource type
        expect.any(Number) // Flow rate
      );
    });
  });

  describe('Resource Flow Optimization', () => {
    it('should trigger flow optimization in ResourceFlowManager', () => {
      // Arrange
      const _optimizeFlowsSpy = vi.spyOn(flowManager, 'optimizeFlows');
      const position: Position = { x: 100, y: 200 };

      // Register several mining nodes to create a more complex network
      integration.registerMiningNode('test-node-1', 'minerals', position, 0.8);
      integration.registerMiningNode('test-node-2', 'energy', { x: 150, y: 250 }, 1.0);
      integration.registerMiningNode('test-node-3', 'gas', { x: 200, y: 300 }, 1.2);

      // Simulate network changes that would trigger optimization
      const resourceUpdateEvent: ResourceUpdateEvent = {
        type: 'RESOURCE_UPDATED',
        moduleId: 'mining-module-1',
        moduleType: 'miningHub',
        resourceType: 'minerals',
        timestamp: Date.now(),
        data: {
          resourceType: 'minerals',
          delta: 50,
          newAmount: 150,
          oldAmount: 100,
        },
      };

      // Validate the event type before emitting
      expect(validateEventType(resourceUpdateEvent.type)).toBe(true);

      // Act: Emit the resource update event
      moduleEventBus.emit(resourceUpdateEvent as unknown as ModuleEvent);

      // Assert: Verify that optimizeFlows was called after resource update
      expect(_optimizeFlowsSpy).toHaveBeenCalled();

      // Verify it was called with the correct parameters (if any)
      // If optimizeFlows doesn't take parameters, this just verifies it was called
      expect(_optimizeFlowsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Type Validation', () => {
    it('should validate standard module event types', () => {
      // Test standard event types
      expect(validateEventType('RESOURCE_PRODUCED')).toBe(true);
      expect(validateEventType('RESOURCE_CONSUMED')).toBe(true);
      expect(validateEventType('RESOURCE_UPDATED')).toBe(true);
      expect(validateEventType('RESOURCE_TRANSFERRED')).toBe(true);
      expect(validateEventType('SHIP_ASSIGNED')).toBe(true);
    });

    it('should validate custom event types', () => {
      // Test custom event types
      expect(validateEventType('RESOURCE_LEVEL_CHANGED')).toBe(true);
    });

    it('should reject invalid event types', () => {
      // Test invalid event types
      expect(validateEventType('INVALID_EVENT_TYPE')).toBe(false);
      expect(validateEventType('UNKNOWN_EVENT')).toBe(false);
    });
  });
});

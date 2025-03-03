import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../../lib/modules/ModuleEvents';
import { MiningResourceIntegration } from '../../../managers/mining/MiningResourceIntegration';
import { MiningShipManagerImpl } from '../../../managers/mining/MiningShipManagerImpl';
import { ResourceFlowManager } from '../../../managers/resource/ResourceFlowManager';
import { ResourceThresholdManager } from '../../../managers/resource/ResourceThresholdManager';
import { ModuleType } from '../../../types/buildings/ModuleTypes';
import { Position } from '../../../types/core/GameTypes';

// Define custom event types for testing
type CustomModuleEventType = ModuleEventType | 'SHIP_ASSIGNED' | 'RESOURCE_LEVEL_CHANGED';

// Mock the modules we depend on but aren't directly testing
vi.mock('../../../lib/modules/ModuleEvents', () => ({
  moduleEventBus: {
    emit: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    unsubscribe: vi.fn(),
  },
  ModuleEventType: {
    RESOURCE_PRODUCED: 'RESOURCE_PRODUCED',
    RESOURCE_CONSUMED: 'RESOURCE_CONSUMED',
    RESOURCE_UPDATED: 'RESOURCE_UPDATED',
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

  beforeEach(() => {
    // Create real instances of the managers we're testing
    miningManager = new MiningShipManagerImpl();
    thresholdManager = new ResourceThresholdManager();
    flowManager = new ResourceFlowManager(100, 500, 10);

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
          id: 'test-node-1',
          type: 'producer',
          resources: ['minerals'],
          active: true,
          efficiency: 0.8,
        })
      );
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
      expect(unregisterNodeSpy).toHaveBeenCalledWith('test-node-1');
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
      const updatedNode = nodes.find(node => node.id === 'test-node-1');
      expect(updatedNode).toBeDefined();
      expect(updatedNode?.efficiency).toBe(1.2);
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
        'minerals',
        expect.objectContaining({
          min: expect.any(Number),
          max: expect.any(Number),
        })
      );
    });
  });

  describe('Resource Transfers', () => {
    it('should create resource flows in ResourceFlowManager when ships are assigned to nodes', () => {
      // Arrange
      const createFlowSpy = vi.spyOn(flowManager, 'createFlow');
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

      // Get the ship assignment handler and call it directly
      const shipAssignedHandlers = vi
        .mocked(moduleEventBus.subscribe)
        .mock.calls.find(call => call[0] === ('SHIP_ASSIGNED' as CustomModuleEventType));

      if (shipAssignedHandlers && shipAssignedHandlers[1]) {
        const handler = shipAssignedHandlers[1];

        // Act - using type assertion to convert to ModuleEvent
        handler(shipAssignedEvent as unknown as ModuleEvent);

        // Assert
        expect(createFlowSpy).toHaveBeenCalled();
        expect(createFlowSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            source: 'test-node-1',
            target: expect.stringContaining('storage'),
            resources: [
              expect.objectContaining({
                type: 'minerals',
                amount: expect.any(Number),
              }),
            ],
          })
        );
      } else {
        throw new Error('Ship assignment event handler not found');
      }
    });
  });

  describe('Resource Flow Optimization', () => {
    it('should trigger flow optimization in ResourceFlowManager', () => {
      // Arrange
      const optimizeFlowsSpy = vi.spyOn(flowManager, 'optimizeFlows');
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
          delta: 100,
          newAmount: 500,
          oldAmount: 400,
        },
      };

      // Get the resource update handler and call it directly
      const resourceUpdateHandlers = vi
        .mocked(moduleEventBus.subscribe)
        .mock.calls.find(call => call[0] === 'RESOURCE_UPDATED');

      if (resourceUpdateHandlers && resourceUpdateHandlers[1]) {
        const handler = resourceUpdateHandlers[1];

        // Act - using type assertion to convert to ModuleEvent
        handler(resourceUpdateEvent as unknown as ModuleEvent);

        // Assert
        expect(optimizeFlowsSpy).toHaveBeenCalled();
        // Check that optimization produces the expected results
        const result = optimizeFlowsSpy.mock.results[0]?.value;
        expect(result).toBeDefined();
        expect(result.performanceMetrics).toBeDefined();
      } else {
        throw new Error('Resource update event handler not found');
      }
    });
  });
});

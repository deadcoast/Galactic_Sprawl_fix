import { EventEmitter } from '../../lib/events/EventEmitter';
import { ModuleEvent, moduleEventBus } from '../../lib/modules/ModuleEvents';
import { Position } from '../../types/core/GameTypes';
import {
  FlowNode,
  FlowNodeType,
  ResourceType,
} from '../../types/resources/StandardizedResourceTypes';
import { ResourceFlowManager } from '../resource/ResourceFlowManager';
import { ResourceThresholdManager, ThresholdConfig } from '../resource/ResourceThresholdManager';
import { MiningShipManagerImpl } from './MiningShipManagerImpl';

// Define interfaces for the types we need
interface MiningShip {
  id: string;
  efficiency: number;
  status: string;
}

interface ResourceNode {
  id: string;
  type: ResourceType;
  position: Position;
  efficiency: number;
}

interface ResourceTransfer {
  type: ResourceType;
  source: string;
  target: string;
  amount: number;
  timestamp: number;
}

// Define event types
interface MiningEvents {
  shipRegistered: { shipId: string };
  shipUnregistered: { shipId: string };
  shipStatusUpdated: { shipId: string; status: string };
  resourceTransferred: ResourceTransfer;
}

// Helper function to create a flow node
function createFlowNode(
  id: string,
  type: FlowNodeType,
  resourceTypes: ResourceType[],
  efficiency: number = 1.0,
  isActive: boolean = true
): FlowNode {
  return {
    id,
    type,
    name: `Mining Node ${id}`,
    capacity: 1000,
    currentLoad: 0,
    efficiency,
    status: isActive ? 'active' : 'inactive',
    inputs: [],
    outputs: resourceTypes.map(type => ({
      type,
      rate: 1.0,
      maxCapacity: 1000,
    })),
  };
}

/**
 * MiningResourceIntegration
 *
 * Integrates the MiningShipManager with the resource management system.
 * Connects mining operations with resource thresholds and flow optimization.
 */
export class MiningResourceIntegration {
  private miningManager: MiningShipManagerImpl & EventEmitter<MiningEvents>;
  private thresholdManager: ResourceThresholdManager;
  private flowManager: ResourceFlowManager;
  private initialized: boolean = false;
  private miningNodes: Map<
    string,
    {
      id: string;
      type: ResourceType;
      position: Position;
      efficiency: number;
    }
  > = new Map();
  private transferHistory: ResourceTransfer[] = [];

  constructor(
    miningManager: MiningShipManagerImpl,
    thresholdManager: ResourceThresholdManager,
    flowManager: ResourceFlowManager
  ) {
    this.miningManager = miningManager as MiningShipManagerImpl & EventEmitter<MiningEvents>;
    this.thresholdManager = thresholdManager;
    this.flowManager = flowManager;
  }

  /**
   * Initialize the integration
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }

    // Subscribe to mining events using EventEmitter methods
    this.subscribeToMiningEvents();

    // Register existing mining nodes
    this.registerMiningNodes();

    // Create thresholds for mining operations
    this.createMiningThresholds();

    this.initialized = true;
    console.warn('[MiningResourceIntegration] Mining resource integration initialized');
  }

  /**
   * Subscribe to mining events
   */
  private subscribeToMiningEvents(): void {
    // Listen for mining ship registration
    this.miningManager.on('shipRegistered', (event: MiningEvents['shipRegistered']) => {
      console.warn(`[MiningResourceIntegration] Mining ship registered: ${event.shipId}`);

      // Get the ship from the mining manager
      const ship = this.getShipFromManager(event.shipId);
      if (!ship) {
        return;
      }

      // Register the ship as a producer node in the flow manager
      this.flowManager.registerNode(
        createFlowNode(
          `mining-ship-${event.shipId}`,
          FlowNodeType.PRODUCER,
          [ResourceType.MINERALS, ResourceType.GAS, ResourceType.PLASMA, ResourceType.EXOTIC],
          ship.efficiency || 1.0,
          ship.status === 'mining'
        )
      );
    });

    // Listen for mining ship unregistration
    this.miningManager.on('shipUnregistered', (event: MiningEvents['shipUnregistered']) => {
      console.warn(`[MiningResourceIntegration] Mining ship unregistered: ${event.shipId}`);

      // Unregister the ship from the flow manager
      this.flowManager.unregisterNode(`mining-ship-${event.shipId}`);
    });

    // Listen for mining ship status changes
    this.miningManager.on('shipStatusUpdated', (event: MiningEvents['shipStatusUpdated']) => {
      // Get the node and update its active status
      const node = this.flowManager.getNode(`mining-ship-${event.shipId}`);
      if (node) {
        // Create a new node with updated active status
        this.flowManager.registerNode(
          createFlowNode(
            node.id,
            node.type,
            node.outputs?.map(output => output.type) || [],
            node.efficiency,
            event.status === 'mining'
          )
        );
      }
    });

    // Listen for resource events from the module event bus
    moduleEventBus.subscribe('RESOURCE_PRODUCED', (event: ModuleEvent) => {
      // Check if this is a mining ship module
      if (!event.moduleId || !event.moduleId.startsWith('mining-ship-')) {
        return;
      }

      // Type guard for resource event data
      if (!event.data || !isResourceEventData(event.data)) {
        return;
      }

      // Extract resource type and amount
      const { resourceType, delta } = event.data;
      if (!resourceType || !delta) {
        return;
      }

      // Create a transfer record
      const shipId = event.moduleId.replace('mining-ship-', '');
      const transfer: ResourceTransfer = {
        type: resourceType,
        source: `mining-ship-${shipId}`,
        target: `storage-${resourceType}`,
        amount: delta,
        timestamp: Date.now(),
      };

      // Add to transfer history
      this.addTransferToHistory(transfer);
    });
  }

  /**
   * Add a transfer to the history
   */
  private addTransferToHistory(transfer: ResourceTransfer): void {
    this.transferHistory.push(transfer);

    // Limit history size
    if (this.transferHistory.length > 100) {
      this.transferHistory.shift();
    }

    // Emit event
    this.miningManager.emit('resourceTransferred', transfer);
  }

  /**
   * Register mining nodes in the flow manager
   */
  private registerMiningNodes(): void {
    // Get all mining nodes from the mining manager
    const nodes = this.getMiningNodesFromManager();

    // Register each node
    nodes.forEach(node => {
      if (!node || !node.id || !node.type || !node.position) {
        return;
      }

      // Store the node
      this.miningNodes.set(node.id, {
        id: node.id,
        type: node.type,
        position: node.position,
        efficiency: 1.0,
      });

      // Register the node in the flow manager
      this.flowManager.registerNode(
        createFlowNode(`mining-node-${node.id}`, FlowNodeType.PRODUCER, [node.type], 1.0, true)
      );
    });
  }

  /**
   * Create thresholds for mining operations
   */
  private createMiningThresholds(): void {
    // Get all resource nodes
    const resourceNodes = Array.from(this.miningNodes.values());
    if (!resourceNodes.length) {
      return;
    }

    // Get unique resource types
    const resourceTypes = new Set<ResourceType>();
    resourceNodes.forEach((node: ResourceNode) => {
      resourceTypes.add(node.type);
    });

    // Create thresholds for each resource type
    resourceTypes.forEach(type => {
      // Create a threshold configuration
      const config: ThresholdConfig = {
        id: `mining-threshold-${type}`,
        threshold: {
          resourceId: type,
          min: 100,
          target: 500,
          max: 1000,
        },
        actions: [
          {
            type: 'notification',
            target: 'mining-manager',
            message: `Low ${type} levels, prioritizing mining`,
          },
        ],
        enabled: true,
      };

      // Register the threshold
      this.thresholdManager.registerThreshold(config);
    });
  }

  /**
   * Register a new mining node
   */
  public registerMiningNode(
    id: string,
    type: ResourceType,
    position: Position,
    efficiency: number = 1.0
  ): void {
    // Store the node
    this.miningNodes.set(id, {
      id,
      type,
      position,
      efficiency,
    });

    // Register the node in the flow manager
    this.flowManager.registerNode(
      createFlowNode(`mining-node-${id}`, FlowNodeType.PRODUCER, [type], efficiency, true)
    );
  }

  /**
   * Helper method to get a ship from the mining manager
   */
  private getShipFromManager(shipId: string): MiningShip | undefined {
    // Access the ships map directly since getShip method might not exist
    const miningManagerWithShips = this.miningManager as unknown as {
      ships: Map<string, MiningShip>;
    };
    return miningManagerWithShips.ships.get(shipId);
  }

  /**
   * Helper method to get mining nodes from the mining manager
   */
  private getMiningNodesFromManager(): Array<{
    id: string;
    type: ResourceType;
    position: Position;
    thresholds: { min: number; max: number };
  }> {
    // Access the resourceNodes map directly or use getResourceNodes if available
    if (typeof this.miningManager.getResourceNodes === 'function') {
      return this.miningManager.getResourceNodes();
    }

    const miningManagerWithNodes = this.miningManager as unknown as {
      resourceNodes: Map<
        string,
        {
          id: string;
          type: ResourceType;
          position: Position;
          thresholds: { min: number; max: number };
        }
      >;
    };

    if (miningManagerWithNodes.resourceNodes) {
      return Array.from(miningManagerWithNodes.resourceNodes.values());
    }

    return [];
  }
}

/**
 * Type guard for resource event data
 */
function isResourceEventData(data: unknown): data is {
  resourceType: ResourceType;
  delta: number;
  _newAmount?: number;
  _oldAmount?: number;
} {
  return (
    data !== null &&
    typeof data === 'object' &&
    'resourceType' in data &&
    typeof data.resourceType === 'string' &&
    'delta' in data &&
    typeof data.delta === 'number'
  );
}

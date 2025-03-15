import { ModuleEvent, moduleEventBus } from '../../lib/modules/ModuleEvents';
import { Position } from '../../types/core/GameTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";
import {
  FlowConnection,
  FlowNode,
  FlowNodeType,
  ResourcePriority,
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
  type: OldResourceType;
  position: Position;
  efficiency: number;
}

interface ResourceTransfer {
  type: OldResourceType;
  source: string;
  target: string;
  amount: number;
  timestamp: number;
}

// Helper function to convert old ResourceType to new ResourceType enum
function convertResourceType(oldType: OldResourceType): ResourceType {
  switch (oldType) {
    case ResourceType.MINERALS:
      return ResourceType.MINERALS;
    case ResourceType.ENERGY:
      return ResourceType.ENERGY;
    case ResourceType.POPULATION:
      return ResourceType.POPULATION;
    case ResourceType.RESEARCH:
      return ResourceType.RESEARCH;
    case ResourceType.PLASMA:
      return ResourceType.PLASMA;
    case ResourceType.GAS:
      return ResourceType.GAS;
    case ResourceType.EXOTIC:
      return ResourceType.EXOTIC;
    default:
      return ResourceType.MINERALS; // Default fallback
  }
}

// Helper function to convert array of old ResourceTypes to new ResourceType enum array
function convertResourceTypeArray(oldTypes: OldResourceType[]): ResourceType[] {
  return oldTypes.map(convertResourceType);
}

// Helper function to create a ResourcePriority object
function createResourcePriority(
  oldType: OldResourceType,
  priority: number,
  consumers: string[] = []
): ResourcePriority {
  return {
    type: convertResourceType(oldType),
    priority,
    consumers,
  };
}

/**
 * MiningResourceIntegration
 *
 * Integrates the MiningShipManager with the resource management system.
 * Connects mining operations with resource thresholds and flow optimization.
 */
export class MiningResourceIntegration {
  private miningManager: MiningShipManagerImpl;
  private thresholdManager: ResourceThresholdManager;
  private flowManager: ResourceFlowManager;
  private initialized: boolean = false;
  private miningNodes: Map<
    string,
    {
      id: string;
      type: OldResourceType;
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
    this.miningManager = miningManager;
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

    // Subscribe to mining events
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
    this.miningManager.on('shipRegistered', (data: unknown) => {
      // Type guard for ship registration data
      if (!isShipRegistrationData(data)) {
        return;
      }

      console.warn(`[MiningResourceIntegration] Mining ship registered: ${data.shipId}`);

      // Get the ship from the mining manager
      const ship = this.getShipFromManager(data.shipId);
      if (!ship) {
        return;
      }

      // Register the ship as a producer node in the flow manager
      this.flowManager.registerNode({
        id: `mining-ship-${data.shipId}`,
        type: FlowNodeType.PRODUCER,
        resources: convertResourceTypeArray([ResourceType.MINERALS, ResourceType.GAS, ResourceType.PLASMA, ResourceType.EXOTIC]),
        priority: createResourcePriority(ResourceType.MINERALS, 5),
        efficiency: ship.efficiency || 1.0,
        active: ship.status === 'mining',
      });
    });

    // Listen for mining ship unregistration
    this.miningManager.on('shipUnregistered', (data: unknown) => {
      // Type guard for ship registration data
      if (!isShipRegistrationData(data)) {
        return;
      }

      console.warn(`[MiningResourceIntegration] Mining ship unregistered: ${data.shipId}`);

      // Unregister the ship from the flow manager
      this.flowManager.unregisterNode(`mining-ship-${data.shipId}`);
    });

    // Listen for mining ship status changes
    this.miningManager.on('shipStatusChanged', (data: unknown) => {
      // Type guard for ship object
      if (!isShipObject(data)) {
        return;
      }

      // Get the node and update its active status
      const node = this.flowManager.getNode(`mining-ship-${data.id}`);
      if (node) {
        // Create a new node with updated active status
        const updatedNode: FlowNode = {
          ...node,
          active: data.status === 'mining',
        };

        // Re-register the node with updated properties
        this.flowManager.registerNode(updatedNode);
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
        type: resourceType as OldResourceType,
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
      this.flowManager.registerNode({
        id: `mining-node-${node.id}`,
        type: FlowNodeType.PRODUCER,
        resources: [convertResourceType(node.type)],
        priority: createResourcePriority(node.type, 3),
        efficiency: 1.0,
        active: true,
      });

      // Create a connection to the storage
      this.flowManager.registerConnection({
        id: `mining-connection-${node.id}`,
        source: `mining-node-${node.id}`,
        target: `storage-${node.type}`,
        resourceType: convertResourceType(node.type),
        maxRate: 10, // Default extraction rate
        currentRate: 0,
        priority: createResourcePriority(node.type, 3),
        active: true,
      });
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
      resourceTypes.add(convertResourceType(node.type));
    });

    // Create thresholds for each resource type
    resourceTypes.forEach(type => {
      // Create a threshold configuration
      const config: ThresholdConfig = {
        id: `mining-threshold-${type}`,
        threshold: {
          // Use type assertion to resolve type compatibility issue
          type: type as unknown as OldResourceType,
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
    type: OldResourceType,
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
    this.flowManager.registerNode({
      id: `mining-node-${id}`,
      type: FlowNodeType.PRODUCER,
      resources: [convertResourceType(type)],
      priority: createResourcePriority(type, 3),
      efficiency,
      active: true,
    });

    // Create a connection to the storage
    this.flowManager.registerConnection({
      id: `mining-connection-${id}`,
      source: `mining-node-${id}`,
      target: `storage-${type}`,
      resourceType: convertResourceType(type),
      maxRate: 10 * efficiency, // Extraction rate based on efficiency
      currentRate: 0,
      priority: createResourcePriority(type, 3),
      active: true,
    });

    // Update thresholds if needed
    const existingThreshold = this.thresholdManager.getThresholdConfigs().find(config => {
      // Convert the threshold type to string for comparison
      const thresholdTypeStr = String(config.threshold.type);
      const convertedTypeStr = String(convertResourceType(type));
      return thresholdTypeStr === convertedTypeStr;
    });

    if (!existingThreshold) {
      // Create a new threshold
      const config: ThresholdConfig = {
        id: `mining-threshold-${String(convertResourceType(type))}`,
        threshold: {
          // Use type assertion to resolve type compatibility issue
          type: convertResourceType(type) as unknown as OldResourceType,
          min: 100,
          target: 500,
          max: 1000,
        },
        actions: [
          {
            type: 'notification',
            target: 'mining-manager',
            message: `Low ${String(convertResourceType(type))} levels, prioritizing mining`,
          },
        ],
        enabled: true,
      };

      // Register the threshold
      this.thresholdManager.registerThreshold(config);
    }
  }

  /**
   * Unregister a mining node
   */
  public unregisterMiningNode(id: string): void {
    // Remove from local storage
    this.miningNodes.delete(id);

    // Unregister from flow manager
    this.flowManager.unregisterNode(`mining-node-${id}`);
    this.flowManager.unregisterConnection(`mining-connection-${id}`);
  }

  /**
   * Update mining node efficiency
   */
  public updateMiningNodeEfficiency(id: string, efficiency: number): void {
    // Update local storage
    const node = this.miningNodes.get(id);
    if (node) {
      node.efficiency = efficiency;
    }

    // Update flow manager - get the node first
    const flowNode = this.flowManager.getNode(`mining-node-${id}`);
    if (flowNode) {
      // Create updated node with new efficiency
      const updatedNode: FlowNode = {
        ...flowNode,
        efficiency,
      };

      // Re-register the node with updated properties
      this.flowManager.registerNode(updatedNode);
    }

    // Update connection - get the connection first
    const connection = this.flowManager.getConnection(`mining-connection-${id}`);
    if (connection) {
      // Create updated connection with new max rate
      const updatedConnection: FlowConnection = {
        ...connection,
        maxRate: 10 * efficiency,
      };

      // Re-register the connection with updated properties
      this.flowManager.registerConnection(updatedConnection);
    }
  }

  /**
   * Cleanup the integration
   */
  public cleanup(): void {
    if (!this.initialized) {
      return;
    }

    // Unregister all mining nodes
    this.miningNodes.forEach((node, id) => {
      // Use the node parameter to log more detailed information about the node being unregistered
      console.warn(
        `[MiningResourceIntegration] Unregistering mining node ${id} (type: ${node.type}, efficiency: ${node.efficiency.toFixed(2)})`
      );
      this.flowManager.unregisterNode(`mining-node-${id}`);
      this.flowManager.unregisterConnection(`mining-connection-${id}`);
    });

    // Unregister all thresholds
    this.miningNodes.forEach((node, _id) => {
      const typeStr = String(convertResourceType(node.type));
      this.thresholdManager.unregisterThreshold(`mining-threshold-${typeStr}`);
    });

    // Unregister all mining ships
    const miningManagerWithShips = this.miningManager as unknown as {
      ships: Map<string, MiningShip>;
    };
    const { ships } = miningManagerWithShips;
    if (ships) {
      ships.forEach((_ship: MiningShip, shipId: string) => {
        this.flowManager.unregisterNode(`mining-ship-${shipId}`);
      });
    }

    this.initialized = false;
    console.warn('[MiningResourceIntegration] Mining resource integration cleaned up');
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
    type: OldResourceType;
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
          type: OldResourceType;
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
 * Factory function to create and initialize the mining resource integration
 */
export function createMiningResourceIntegration(
  miningManager: MiningShipManagerImpl,
  thresholdManager: ResourceThresholdManager,
  flowManager: ResourceFlowManager
): MiningResourceIntegration {
  // Create the integration
  const integration = new MiningResourceIntegration(miningManager, thresholdManager, flowManager);

  // Initialize the integration
  integration.initialize();

  return integration;
}

/**
 * Type guard for ship object
 */
function isShipObject(obj: unknown): obj is { id: string; status: string } {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'id' in obj &&
    typeof obj.id === 'string' &&
    'status' in obj &&
    typeof obj.status === 'string'
  );
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

/**
 * Type guard for ship registration data
 */
function isShipRegistrationData(data: unknown): data is { shipId: string } {
  return (
    data !== null && typeof data === 'object' && 'shipId' in data && typeof data.shipId === 'string'
  );
}

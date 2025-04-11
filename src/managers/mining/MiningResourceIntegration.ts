import { BaseEvent, eventSystem } from '../../lib/events/UnifiedEventSystem';
import { Position } from '../../types/core/GameTypes';
import {
  EventType,
  // Re-import necessary event data types
  MiningShipRegisteredEventData,
  MiningShipStatusChangedEventData,
  MiningShipUnregisteredEventData,
} from '../../types/events/EventTypes';
import {
  FlowNode,
  FlowNodeType,
  ResourceState,
  ResourceType,
} from '../../types/resources/ResourceTypes';
import { ResourceFlowManager } from '../resource/ResourceFlowManager';
import { ResourceThresholdManager, ThresholdConfig } from '../resource/ResourceThresholdManager';
// Fix import path for ShipStatus
import { MiningShip, MiningShipManagerImpl, ShipStatus } from './MiningShipManagerImpl'; // Import ShipStatus here

// Define interfaces for the types we need
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

// Define createFlowNode helper internal to this class
function createFlowNodeInternal(
  id: string,
  type: FlowNodeType,
  resourceTypes: ResourceType[], // Keep for potential future use, though FlowNode doesn't directly use it
  efficiency: number = 1.0,
  isActive: boolean = true,
  capacity: number = 1000
  // currentLoad: number = 0, // Not in FlowNode
): FlowNode {
  return {
    id,
    type,
    name: `${type} Node ${id}`,
    resources: {} as Record<ResourceType, ResourceState>, // Needs proper init later
    capacity,
    x: 0, // Default position
    y: 0, // Default position
    active: isActive,
    metadata: { efficiency }, // Store efficiency in metadata
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
  private miningNodes: Map<string, ResourceNode> = new Map();
  private transferHistory: ResourceTransfer[] = [];
  private unsubscribeFunctions: (() => void)[] = [];

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

    // Subscribe to mining events using the global eventSystem
    this.subscribeToMiningEvents();

    // Register existing mining nodes
    this.registerMiningNodes();

    // Create thresholds for mining operations
    this.createMiningThresholds();

    this.initialized = true;
    console.warn('[MiningResourceIntegration] Mining resource integration initialized');
  }

  /**
   * Dispose of subscriptions
   */
  public dispose(): void {
    this.unsubscribeFunctions.forEach(unsub => unsub());
    this.unsubscribeFunctions = [];
    this.initialized = false;
    console.warn('[MiningResourceIntegration] Mining resource integration disposed');
  }

  /**
   * Subscribe to mining events via global eventSystem
   */
  private subscribeToMiningEvents(): void {
    // Listen for mining ship registration
    this.unsubscribeFunctions.push(
      eventSystem.subscribe(EventType.MINING_SHIP_REGISTERED, (event: BaseEvent) => {
        const data = event.data as MiningShipRegisteredEventData;
        if (!data || !data.ship) return;

        const ship = data.ship;
        console.warn(`[MiningResourceIntegration] Mining ship registered: ${ship.id}`);

        // Register the ship as a producer node in the flow manager
        this.flowManager.registerNode(
          createFlowNodeInternal(
            `mining-ship-${ship.id}`,
            FlowNodeType.PRODUCER,
            [],
            ship.efficiency || 1.0,
            ship.status === ShipStatus.MINING
          )
        );
      })
    );

    // Listen for mining ship unregistration
    this.unsubscribeFunctions.push(
      eventSystem.subscribe(EventType.MINING_SHIP_UNREGISTERED, (event: BaseEvent) => {
        const data = event.data as MiningShipUnregisteredEventData;
        if (!data || !data.shipId) return;

        console.warn(`[MiningResourceIntegration] Mining ship unregistered: ${data.shipId}`);
        // Unregister the ship from the flow manager
        this.flowManager.unregisterNode(`mining-ship-${data.shipId}`);
      })
    );

    // Listen for mining ship status changes
    this.unsubscribeFunctions.push(
      eventSystem.subscribe(EventType.MINING_SHIP_STATUS_CHANGED, (event: BaseEvent) => {
        const data = event.data as MiningShipStatusChangedEventData;
        if (!data || !data.shipId) return;

        // Get the node and update its active status
        const nodeId = `mining-ship-${data.shipId}`;
        const node = this.flowManager.getNode(nodeId);
        if (node) {
          // Create a new node with updated active status
          const updatedNode = createFlowNodeInternal(
            node.id,
            node.type,
            [],
            (node.metadata?.efficiency as number) || 1.0,
            data.newStatus === ShipStatus.MINING,
            node.capacity
          );
          this.flowManager.registerNode(updatedNode);
        }
      })
    );

    // Listen for resource produced events (assuming this comes from mining manager now)
    this.unsubscribeFunctions.push(
      eventSystem.subscribe(EventType.MINING_RESOURCE_COLLECTED, (event: BaseEvent) => {
        const data = event.data as {
          shipId: string;
          resourceType: ResourceType;
          amount: number;
        };
        if (!data || !data.shipId || !data.resourceType || !data.amount) return;

        // Create a transfer record
        const transfer: ResourceTransfer = {
          type: data.resourceType,
          source: `mining-ship-${data.shipId}`,
          target: `storage-${data.resourceType}`,
          amount: data.amount,
          timestamp: Date.now(),
        };

        // Add to transfer history
        this.addTransferToHistory(transfer);
      })
    );
  }

  /**
   * Add a transfer to the history
   */
  private addTransferToHistory(transfer: ResourceTransfer): void {
    this.transferHistory.push(transfer);
    if (this.transferHistory.length > 100) {
      this.transferHistory.shift();
    }
    eventSystem.publish({
      type: EventType.RESOURCE_TRANSFERRED,
      managerId: 'MiningResourceIntegration',
      timestamp: Date.now(),
      data: { ...transfer },
    });
  }

  /**
   * Register mining nodes in the flow manager
   */
  private registerMiningNodes(): void {
    const nodes = this.getMiningNodesFromManager();
    nodes.forEach(node => {
      if (!node || !node.id || !node.type || !node.position) return;
      this.miningNodes.set(node.id, {
        id: node.id,
        type: node.type,
        position: node.position,
        efficiency: 1.0,
      });
      this.flowManager.registerNode(
        createFlowNodeInternal(
          `mining-node-${node.id}`,
          FlowNodeType.PRODUCER,
          [node.type],
          1.0,
          true
        )
      );
    });
  }

  /**
   * Create thresholds for mining operations
   */
  private createMiningThresholds(): void {
    const resourceNodes = Array.from(this.miningNodes.values());
    if (!resourceNodes.length) {
      return;
    }
    const resourceTypes = new Set<ResourceType>();
    resourceNodes.forEach((node: ResourceNode) => {
      resourceTypes.add(node.type);
    });
    resourceTypes.forEach(type => {
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
    this.miningNodes.set(id, {
      id,
      type,
      position,
      efficiency,
    });
    this.flowManager.registerNode(
      createFlowNodeInternal(`mining-node-${id}`, FlowNodeType.PRODUCER, [type], efficiency, true)
    );
  }

  /**
   * Helper method to get a ship from the mining manager
   */
  private getShipFromManager(shipId: string): MiningShip | undefined {
    return this.miningManager.getShipData(shipId);
  }

  /**
   * Stubbed: Helper method to get mining nodes.
   * TODO: Implement logic to query the actual source of mining nodes (e.g., AsteroidFieldManager).
   */
  private getMiningNodesFromManager(): Array<{
    id: string;
    type: ResourceType;
    position: Position;
    thresholds: { min: number; max: number }; // Keep signature, though we return []
  }> {
    // Call the public method - This method doesn't exist on the manager!
    // return this.miningManager.getResourceNodes();
    console.warn(
      '[MiningResourceIntegration] getMiningNodesFromManager is not implemented. Returning empty array.'
    );
    return []; // Return empty array for now
  }
}

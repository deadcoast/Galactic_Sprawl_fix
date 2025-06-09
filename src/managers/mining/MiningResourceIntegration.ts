import { Position } from '../../types/core/GameTypes';
import
  {
    BaseEvent,
    EventType,
    // Re-import necessary event data types
    MiningShipRegisteredEventData,
    MiningShipStatusChangedEventData,
    MiningShipUnregisteredEventData,
  } from '../../types/events/EventTypes';
import
  {
    FlowNode,
    FlowNodeType,
    ResourceState,
    ResourceType,
  } from '../../types/resources/ResourceTypes';
import { MiningShip, UnifiedShipStatus } from '../../types/ships/ShipTypes'; // Use this MiningShip
import { ResourceFlowManager } from '../resource/ResourceFlowManager';
import { ResourceThresholdManager, ThresholdConfig } from '../resource/ResourceThresholdManager';
// Fix import path for ShipStatus
import { moduleEventBus } from '../../lib/events/ModuleEventBus';
import { errorLoggingService } from '../../services/logging/ErrorLoggingService';
import { ResourceManager } from '../game/ResourceManager';
import { MiningShipManager } from './MiningShipManager';

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
  efficiency = 1.0,
  isActive = true,
  capacity = 1000
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
  private resourceManager: ResourceManager;
  private thresholdManager: ResourceThresholdManager;
  private flowManager: ResourceFlowManager;
  private miningManager: MiningShipManager;
  private initialized = false;
  private miningNodes = new Map<string, ResourceNode>();
  private transferHistory: ResourceTransfer[] = [];
  private unsubscribeFunctions: (() => void)[] = [];

  constructor(
    resourceManager: ResourceManager,
    miningManager: MiningShipManager,
    thresholdManager: ResourceThresholdManager,
    flowManager: ResourceFlowManager
  ) {
    this.resourceManager = resourceManager;
    this.miningManager = miningManager;
    this.thresholdManager = thresholdManager;
    this.flowManager = flowManager;

    this.initializeEventListeners();
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
   * Subscribe to mining events via global moduleEventBus
   */
  private subscribeToMiningEvents(): void {
    // Listen for mining ship registration
    this.unsubscribeFunctions.push(
      moduleEventBus.subscribe(EventType.MINING_SHIP_REGISTERED, (event: BaseEvent) => {
        // Use type guard
        if (isMiningShipRegisteredData(event.data)) {
          const {ship} = event.data; // Type is now known
          console.warn(`[MiningResourceIntegration] Mining ship registered: ${ship.id}`);

          // Use UnifiedShipStatus
          const isActive = ship.status === UnifiedShipStatus.MINING;

          this.flowManager.registerNode(
            createFlowNodeInternal(
              `mining-ship-${ship.id}`,
              FlowNodeType.PRODUCER,
              [],
              ship.efficiency || 1.0,
              isActive
            )
          );
        } else {
          console.warn(
            '[MiningResourceIntegration] Received MINING_SHIP_REGISTERED event with invalid data.'
          );
        }
      })
    );

    // Listen for mining ship unregistration
    this.unsubscribeFunctions.push(
      moduleEventBus.subscribe(EventType.MINING_SHIP_UNREGISTERED, (event: BaseEvent) => {
        // Use type guard
        if (isMiningShipUnregisteredData(event.data)) {
          console.warn(
            `[MiningResourceIntegration] Mining ship unregistered: ${event.data.shipId}`
          );
          this.flowManager.unregisterNode(`mining-ship-${event.data.shipId}`);
        } else {
          console.warn(
            '[MiningResourceIntegration] Received MINING_SHIP_UNREGISTERED event with invalid data.'
          );
        }
      })
    );

    // Listen for mining ship status changes
    this.unsubscribeFunctions.push(
      moduleEventBus.subscribe(EventType.MINING_SHIP_STATUS_CHANGED, (event: BaseEvent) => {
        // Use type guard
        if (isMiningShipStatusChangedData(event.data)) {
          const nodeId = `mining-ship-${event.data.shipId}`;
          const node = this.flowManager.getNode(nodeId);
          if (node) {
            // Use UnifiedShipStatus
            const isActive = event.data.newStatus === UnifiedShipStatus.MINING;
            const updatedNode = createFlowNodeInternal(
              node.id,
              node.type,
              [],
              (node.metadata?.efficiency as number) || 1.0,
              isActive,
              node.capacity
            );
            this.flowManager.registerNode(updatedNode);
          }
        } else {
          console.warn(
            '[MiningResourceIntegration] Received MINING_SHIP_STATUS_CHANGED event with invalid data.'
          );
        }
      })
    );

    // Listen for resource produced events (assuming this comes from mining manager now)
    this.unsubscribeFunctions.push(
      moduleEventBus.subscribe(EventType.MINING_RESOURCE_COLLECTED, (event: BaseEvent) => {
        // Use type guard
        if (isMiningResourceCollectedData(event.data)) {
          const transfer: ResourceTransfer = {
            type: event.data.resourceType,
            source: `mining-ship-${event.data.shipId}`,
            target: `storage-${event.data.resourceType}`, // Example target
            amount: event.data.amount,
            timestamp: Date.now(),
          };
          this.addTransferToHistory(transfer);
        } else {
          console.warn(
            '[MiningResourceIntegration] Received MINING_RESOURCE_COLLECTED event with invalid data.'
          );
        }
      })
    );
  }

  /**
   * Add a transfer to the history and emit event
   */
  private addTransferToHistory(transfer: ResourceTransfer): void {
    this.transferHistory.push(transfer);
    if (this.transferHistory.length > 100) {
      this.transferHistory.shift();
    }
    moduleEventBus.emit({
      type: EventType.RESOURCE_TRANSFERRED,
      moduleId: 'MiningResourceIntegration',
      moduleType: 'resource-manager',
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
      if (!node?.id || !node.type || !node.position) return;
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
    efficiency = 1.0
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
  private getMiningNodesFromManager(): {
    id: string;
    type: ResourceType;
    position: Position;
    thresholds: { min: number; max: number }; // Keep signature, though we return []
  }[] {
    // Call the public method - This method doesn't exist on the manager!
    // return this.miningManager.getResourceNodes();
    console.warn(
      '[MiningResourceIntegration] getMiningNodesFromManager is not implemented. Returning empty array.'
    );
    return []; // Return empty array for now
  }

  private handleMiningTaskCompleted(event: BaseEvent): void {
    if (!event.data || typeof event.data !== 'object' || !('task' in event.data)) {
      errorLoggingService.logWarn(
        '[MiningResourceIntegration] Received MiningTaskCompleted event without valid task data',
        {
          service: 'MiningResourceIntegration',
          method: 'handleMiningTaskCompleted',
        }
      );
      return;
    }

    interface TaskData {
      shipId: string;
      resourceType: ResourceType;
    }

    function isTaskData(data: unknown): data is TaskData {
      return (
        typeof data === 'object' && data !== null && 'shipId' in data && 'resourceType' in data
      );
    }

    if (!isTaskData(event.data.task)) {
      errorLoggingService.logWarn(
        '[MiningResourceIntegration] Received MiningTaskCompleted event with invalid task structure in data',
        {
          service: 'MiningResourceIntegration',
          method: 'handleMiningTaskCompleted',
        }
      );
      return;
    }

    const {task} = event.data;
    const ship: MiningShip | undefined = this.miningManager.getShipData(task.shipId);

    if (ship && ship.status === UnifiedShipStatus.RETURNING) {
      let cargoCapacity = 0;
      if (typeof ship.stats?.cargo === 'number') {
        cargoCapacity = ship.stats.cargo;
      } else if (
        typeof ship.stats?.cargo === 'object' &&
        ship.stats.cargo !== null &&
        'capacity' in ship.stats.cargo
      ) {
        cargoCapacity = (ship.stats.cargo as { capacity: number }).capacity;
      }

      // Safely extract currentLoad and ensure it's a number
      const rawCurrentLoad = ship.currentLoad;
      const amountToDeposit: number = typeof rawCurrentLoad === 'number' ? rawCurrentLoad : 0;
      
      if (amountToDeposit > 0 && cargoCapacity > 0) {
        this.resourceManager.addResource(task.resourceType, amountToDeposit);
        errorLoggingService.logInfo(
          `[MiningResourceIntegration] Ship ${ship.id} deposited ${amountToDeposit.toFixed(2)} ${task.resourceType}`,
          {
            service: 'MiningResourceIntegration',
            method: 'handleMiningTaskCompleted',
            shipId: ship.id,
            resourceType: task.resourceType,
            amount: amountToDeposit,
          }
        );
      } else {
        errorLoggingService.logInfo(
          `[MiningResourceIntegration] Ship ${ship.id} returned with empty cargo`,
          {
            service: 'MiningResourceIntegration',
            method: 'handleMiningTaskCompleted',
            shipId: ship.id,
          }
        );
      }
    } else if (ship) {
      errorLoggingService.logInfo(
        `[MiningResourceIntegration] Task completed for ship ${ship.id}, but status was ${ship.status}, not RETURNING`,
        {
          service: 'MiningResourceIntegration',
          method: 'handleMiningTaskCompleted',
          shipId: ship.id,
          status: ship.status,
        }
      );
    } else {
      errorLoggingService.logWarn(
        `[MiningResourceIntegration] Task completed for unknown ship ${task.shipId}`,
        {
          service: 'MiningResourceIntegration',
          method: 'handleMiningTaskCompleted',
          shipId: task.shipId,
        }
      );
    }
  }

  private initializeEventListeners(): void {
    // TODO: Add event listener subscriptions here if needed
    console.log('[MiningResourceIntegration] Event listeners initialized (placeholder).');
    // Subscribe using moduleEventBus
    this.subscribeToMiningEvents();
  }
}

// --- Type Guards for Event Data ---
function isMiningShipRegisteredData(data: unknown): data is MiningShipRegisteredEventData {
  // Note: This assumes MiningShipRegisteredEventData has a 'ship' property
  // Need to adjust based on the actual definition in EventTypes.ts
  // A more robust check would validate the ship object's properties
  return (
    typeof data === 'object' &&
    data !== null &&
    'ship' in data &&
    typeof (data as { ship: unknown }).ship === 'object'
  );
}

function isMiningShipUnregisteredData(data: unknown): data is MiningShipUnregisteredEventData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'shipId' in data &&
    typeof (data as { shipId: unknown }).shipId === 'string'
  );
}

function isMiningShipStatusChangedData(data: unknown): data is MiningShipStatusChangedEventData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'shipId' in data &&
    typeof (data as { shipId: unknown }).shipId === 'string' &&
    'oldStatus' in data &&
    typeof (data as { oldStatus: unknown }).oldStatus === 'string' && // Basic check
    'newStatus' in data &&
    typeof (data as { newStatus: unknown }).newStatus === 'string'
  ); // Basic check
}

function isMiningResourceCollectedData(
  data: unknown
): data is { shipId: string; resourceType: ResourceType; amount: number } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'shipId' in data &&
    typeof (data as { shipId: unknown }).shipId === 'string' &&
    'resourceType' in data &&
    typeof (data as { resourceType: unknown }).resourceType === 'string' && // Basic check for ResourceType
    'amount' in data &&
    typeof (data as { amount: unknown }).amount === 'number'
  );
}
// --------------------------------

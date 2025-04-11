import { v4 as uuidv4 } from 'uuid';
import { shipBehaviorManager } from '../../lib/ai/shipBehavior';
import { shipMovementManager } from '../../lib/ai/shipMovement';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import {
  BaseEvent,
  EventType,
  MiningResourceCollectedEventData,
  MiningShipRegisteredEventData,
  MiningShipStatusChangedEventData,
  MiningShipUnregisteredEventData,
  MiningTaskAssignedEventData,
  MiningTaskCompletedEventData,
} from '../../types/events/EventTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { getAsteroidFieldManager } from '../ManagerRegistry'; // Import the registry function

interface ThresholdAutomateEventData {
  threshold: {
    id: string;
    resourceType: ResourceType | string;
    thresholdType: string;
    comparison: string;
    value: number;
    action: string;
    actionData?: Record<string, unknown>;
    enabled: boolean;
    cooldownMs?: number;
    lastTriggered?: number;
    repeat?: boolean;
    entityId?: string;
  };
  resourceState: {
    current: number;
    max: number;
    min: number;
    production: number;
    consumption: number;
    rate?: number;
    value?: number;
  };
  automationAction: string;
  parameters: Record<string, unknown>;
}

function isThresholdAutomateEventData(data: unknown): data is ThresholdAutomateEventData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as ThresholdAutomateEventData).automationAction === 'string' &&
    typeof (data as ThresholdAutomateEventData).threshold === 'object' &&
    typeof (data as ThresholdAutomateEventData).threshold.resourceType === 'string'
  );
}

export enum ShipStatus {
  IDLE = 'idle',
  MINING = 'mining',
  RETURNING = 'returning',
  MAINTENANCE = 'maintenance',
}

enum TaskStatus {
  QUEUED = 'queued',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface MiningShip {
  id: string;
  name: string;
  type: 'rockBreaker' | 'voidDredger';
  status: ShipStatus;
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
}

interface MiningTask {
  id: string;
  shipId: string;
  nodeId: string;
  resourceType: ResourceType;
  priority: number;
  status: TaskStatus;
  startTime?: number;
  endTime?: number;
}

// Define the expected structure for event data passed to publish
interface PublishEventData {
  type: EventType;
  moduleId: string;
  moduleType: ModuleType | string; // Allow string for flexibility if needed
  timestamp: number;
  data: Record<string, unknown>; // Keep data flexible
}

// --- Restore local interface definition ---
interface IAsteroidFieldManager {
  // Finds node IDs (e.g., "minerals-cluster-1") for a given resource type
  findAvailableNodesByType(resourceType: ResourceType): string[];
  // Optional: Could also include getPosition, etc., if needed
}
// -----------------------------------------------------------------------------

export class MiningShipManagerImpl /* extends AbstractBaseManager<BaseEvent> */ {
  private static _instance: MiningShipManagerImpl | null = null;

  private ships: Map<string, MiningShip> = new Map();
  private tasks: Map<string, MiningTask> = new Map();
  private nodeAssignments: Map<string, string> = new Map();

  // Use the local interface and definite assignment assertion
  private asteroidFieldManager!: IAsteroidFieldManager;

  // Remove constructor if not needed, or make it public
  // public constructor() {
  //   // Initialization logic if needed
  // }

  // Revert to the previous getInstance implementation
  public static getInstance(): MiningShipManagerImpl {
    if (!MiningShipManagerImpl._instance) {
      MiningShipManagerImpl._instance = new MiningShipManagerImpl();
    }
    return MiningShipManagerImpl._instance;
  }

  // Placeholder for initialization logic (was onInitialize)
  public async initialize(dependencies?: {
    asteroidFieldManager?: IAsteroidFieldManager;
  }): Promise<void> {
    // Attempt to get dependency if provided
    if (dependencies?.asteroidFieldManager) {
      this.asteroidFieldManager = dependencies.asteroidFieldManager;
    } else {
      // Retrieve from ManagerRegistry
      try {
        // Explicitly cast the result from the registry
        this.asteroidFieldManager = getAsteroidFieldManager() as unknown as IAsteroidFieldManager;
        if (!this.asteroidFieldManager) {
          throw new Error('AsteroidFieldManager instance not found in registry.');
        }
      } catch (error) {
        console.error(
          '[MiningShipManager] Failed to retrieve AsteroidFieldManager from registry:',
          error
        );
        // Handle the error appropriately - maybe throw, or use a safe default
        throw new Error('AsteroidFieldManager dependency is required and could not be obtained.');
      }
    }

    this.subscribe('RESOURCE_THRESHOLD_AUTOMATE', (event: BaseEvent) => {
      if (event.data && isThresholdAutomateEventData(event.data)) {
        const { threshold, resourceState } = event.data;
        let violationType: 'below_minimum' | 'above_maximum' | undefined;

        if (threshold.comparison.includes('LESS_THAN')) {
          if (resourceState.current < threshold.value) {
            violationType = 'below_minimum';
          }
        } else if (threshold.comparison.includes('GREATER_THAN')) {
          if (resourceState.current > threshold.value) {
            violationType = 'above_maximum';
          }
        }

        if (violationType) {
          const resourceTypeStr = threshold.resourceType as string;
          this.handleThresholdViolation(resourceTypeStr, {
            type: violationType,
            current: resourceState.current,
          });
        }
      }
    });
    console.log('MiningShipManager initialized');
    await Promise.resolve();
  }

  // Placeholder for update logic (was onUpdate)
  public update(deltaTime: number): void {
    this.ships.forEach(ship => {
      if (ship.status === ShipStatus.MINING && ship.targetNode) {
        const task = Array.from(this.tasks.values()).find(
          t => t.shipId === ship.id && t.status === TaskStatus.IN_PROGRESS
        );

        if (task) {
          const collectedAmount = ship.efficiency * deltaTime;
          ship.currentLoad += collectedAmount;

          const eventData: MiningResourceCollectedEventData = {
            shipId: ship.id,
            resourceType: task.resourceType,
            amount: collectedAmount,
          };
          this.publish({
            type: EventType.MINING_RESOURCE_COLLECTED,
            moduleId: ship.id,
            moduleType: 'mining_ship' as ModuleType,
            timestamp: Date.now(),
            data: eventData as unknown as Record<string, unknown>,
          });

          if (ship.currentLoad >= ship.capacity) {
            this.recallShip(ship.id);
          }
        }
      }
    });
  }

  protected async onDispose(): Promise<void> {
    this.ships.clear();
    this.tasks.clear();
    this.nodeAssignments.clear();
    console.log('MiningShipManager disposed');
    await Promise.resolve();
  }

  // Add placeholder publish method (needed after removing inheritance)
  private publish(event: PublishEventData): void {
    // TODO: Implement actual event publishing logic (e.g., using moduleEventBus or similar)
    console.log('[MiningShipManager] Publishing Event:', event.type, event.data);
  }

  // Add placeholder subscribe method (needed after removing inheritance)
  private subscribe(
    eventType: EventType | string,
    callback: (event: BaseEvent) => void
  ): () => void {
    // TODO: Implement actual event subscription logic
    console.log('[MiningShipManager] Subscribing to Event:', eventType);
    // Return a dummy unsubscribe function
    return () => {
      console.log('[MiningShipManager] Unsubscribing from Event:', eventType);
    };
  }

  private updateShipStatus(ship: MiningShip, newStatus: ShipStatus): void {
    const oldStatus = ship.status;
    if (oldStatus === newStatus) return;

    ship.status = newStatus;
    const eventData: MiningShipStatusChangedEventData = { shipId: ship.id, oldStatus, newStatus };
    this.publish({
      type: EventType.MINING_SHIP_STATUS_CHANGED,
      moduleId: ship.id,
      moduleType: 'mining_ship' as ModuleType,
      timestamp: Date.now(),
      data: eventData as unknown as Record<string, unknown>,
    });
  }

  registerShip(shipData: Omit<MiningShip, 'status' | 'currentLoad' | 'targetNode'>): void {
    const newShip: MiningShip = {
      ...shipData,
      status: ShipStatus.IDLE,
      currentLoad: 0,
      targetNode: undefined,
    };
    this.ships.set(newShip.id, newShip);

    shipBehaviorManager.registerShip({
      id: newShip.id,
      type: newShip.type as ResourceType,
      category: 'mining',
      capabilities: {
        canMine: true,
        canSalvage: false,
        canScan: false,
        canJump: false,
      },
      position: { x: 0, y: 0 },
      stats: {
        health: 100,
        shield: 100,
        speed: 100,
        maneuverability: 1,
        cargo: newShip.capacity,
      },
    });

    const eventData: MiningShipRegisteredEventData = { ship: newShip };
    this.publish({
      type: EventType.MINING_SHIP_REGISTERED,
      moduleId: newShip.id,
      moduleType: 'mining_ship' as ModuleType,
      timestamp: Date.now(),
      data: eventData as unknown as Record<string, unknown>,
    });
  }

  unregisterShip(shipId: string): void {
    const ship = this.ships.get(shipId);
    if (!ship) return;

    this.ships.delete(shipId);
    shipBehaviorManager.unregisterShip(shipId);

    Array.from(this.tasks.values())
      .filter(task => task.shipId === shipId)
      .forEach(task => {
        this.tasks.delete(task.id);
        // Make sure to remove the assignment when a ship is unregistered
        if (this.nodeAssignments.get(task.nodeId) === shipId) {
          this.nodeAssignments.delete(task.nodeId);
        }
        const eventData: MiningTaskCompletedEventData = {
          task: { ...task, status: TaskStatus.FAILED },
        };
        this.publish({
          type: EventType.MINING_TASK_COMPLETED,
          moduleId: shipId,
          moduleType: 'mining_ship' as ModuleType,
          timestamp: Date.now(),
          data: eventData as unknown as Record<string, unknown>,
        });
      });

    const eventData: MiningShipUnregisteredEventData = { shipId };
    this.publish({
      type: EventType.MINING_SHIP_UNREGISTERED,
      moduleId: shipId,
      moduleType: 'mining_ship' as ModuleType,
      timestamp: Date.now(),
      data: eventData as unknown as Record<string, unknown>,
    });
  }

  private handleThresholdViolation(
    resourceIdString: string, // This is ResourceType as string
    details: { type: 'below_minimum' | 'above_maximum'; current: number }
  ): void {
    if (details.type === 'below_minimum') {
      const availableShip = Array.from(this.ships.values()).find(
        ship => ship.status === ShipStatus.IDLE && ship.currentLoad === 0
      );

      if (availableShip) {
        const resourceTypeEnum = this.stringToResourceType(resourceIdString);
        if (!resourceTypeEnum) {
          console.error(
            `[MiningShipManager] Invalid resource type string received: ${resourceIdString}`
          );
          return;
        }

        const availableNodes = this.asteroidFieldManager.findAvailableNodesByType(resourceTypeEnum);
        const targetNodeId = availableNodes.find(nodeId => !this.nodeAssignments.has(nodeId));

        if (targetNodeId) {
          console.log(
            `[MiningShipManager] Dispatching ship ${availableShip.id} to node ${targetNodeId} for resource ${resourceIdString}`
          );
          this.dispatchShipToResource(availableShip.id, targetNodeId);
        } else {
          console.warn(
            `[MiningShipManager] No unassigned mining nodes found for resource ${resourceIdString}.`
          );
        }
      } else {
        console.warn(
          `[MiningShipManager] No idle mining ship available for resource ${resourceIdString}`
        );
      }
    } else if (details.type === 'above_maximum') {
      // Filter only by nodeId and resource type, remove unused shipId from filter
      const nodesToRecall = Array.from(this.nodeAssignments.entries()).filter(
        // Only destructure the needed nodeId
        ([nodeId]: [string, string]) =>
          this.getResourceTypeFromNodeId(nodeId).toString() === resourceIdString
      );

      if (nodesToRecall.length > 0) {
        console.log(
          `[MiningShipManager] Recalling ships for resource ${resourceIdString} due to above_maximum threshold.`
        );
        // Use only shipId in forEach, remove unused nodeId
        nodesToRecall.forEach(([, shipId]) => this.recallShip(shipId));
      } else {
        console.log(
          `[MiningShipManager] Received above_maximum for ${resourceIdString}, but no ships currently assigned to nodes of this type.`
        );
      }
    }
  }

  private stringToResourceType(resourceStr: string): ResourceType | undefined {
    const upperStr = resourceStr.toUpperCase();
    if (Object.values(ResourceType).includes(upperStr as ResourceType)) {
      return upperStr as ResourceType;
    }
    console.warn(
      `[MiningShipManager] Could not convert string '${resourceStr}' to ResourceType enum.`
    );
    return undefined;
  }

  private getResourceTypeFromNodeId(nodeId: string): ResourceType {
    // Example: "minerals-cluster-1" -> "MINERALS"
    const resourceStr = nodeId.split('-')[0]?.toUpperCase();
    if (!resourceStr) {
      console.warn(
        `[MiningShipManager] Could not determine resource type from nodeId: ${nodeId}. Defaulting to MINERALS.`
      );
      return ResourceType.MINERALS;
    }

    const resourceTypeEnum = this.stringToResourceType(resourceStr);
    return resourceTypeEnum ?? ResourceType.MINERALS; // Fallback if conversion fails
  }

  private dispatchShipToResource(shipId: string, resourceNodeId: string): void {
    // Renamed resourceId to resourceNodeId for clarity
    const ship = this.ships.get(shipId);
    if (!ship) {
      console.warn(`[MiningShipManager] Ship ${shipId} not found for dispatch`);
      return;
    }
    if (ship.status !== ShipStatus.IDLE) {
      console.warn(`[MiningShipManager] Ship ${shipId} is not IDLE, cannot dispatch.`);
      return;
    }
    if (this.nodeAssignments.has(resourceNodeId)) {
      console.warn(
        `[MiningShipManager] Resource node ${resourceNodeId} already has ship ${this.nodeAssignments.get(resourceNodeId)} assigned.`
      );
      return;
    }

    const task: MiningTask = {
      id: `mining-${uuidv4()}`,
      shipId,
      nodeId: resourceNodeId,
      resourceType: this.getResourceTypeFromNodeId(resourceNodeId),
      priority: 1, // Consider making priority dynamic
      status: TaskStatus.QUEUED,
      startTime: Date.now(),
    };

    this.tasks.set(task.id, task);
    this.nodeAssignments.set(resourceNodeId, shipId); // Assign ship to node

    this.updateShipStatus(ship, ShipStatus.MINING);
    ship.targetNode = resourceNodeId;

    const eventData: MiningTaskAssignedEventData = { task };
    this.publish({
      type: EventType.MINING_TASK_ASSIGNED,
      moduleId: shipId,
      moduleType: 'mining_ship' as ModuleType,
      timestamp: Date.now(),
      data: eventData as unknown as Record<string, unknown>,
    });

    task.status = TaskStatus.IN_PROGRESS; // Update task status after publishing QUEUED event

    shipBehaviorManager.assignTask({
      id: task.id,
      type: 'mine',
      target: {
        id: resourceNodeId,
        position: this.getResourcePosition(resourceNodeId), // Assuming this returns a valid Position
      },
      priority: task.priority,
      assignedAt: Date.now(),
    });
  }

  private recallShip(shipId: string): void {
    const ship = this.ships.get(shipId);
    // Allow recalling if MINING or RETURNING (might be recalled again if needed)
    if (!ship || ship.status === ShipStatus.IDLE || ship.status === ShipStatus.MAINTENANCE) {
      console.log(
        `[MiningShipManager] Ship ${shipId} is ${ship?.status ?? 'not found'}, recall skipped.`
      );
      return;
    }

    const activeTask = Array.from(this.tasks.values()).find(
      task => task.shipId === shipId && task.status === TaskStatus.IN_PROGRESS
    );

    if (activeTask) {
      activeTask.status = TaskStatus.COMPLETED; // Mark as completed when recalled
      activeTask.endTime = Date.now();
      this.nodeAssignments.delete(activeTask.nodeId); // Free up the node

      const eventData: MiningTaskCompletedEventData = { task: activeTask };
      this.publish({
        type: EventType.MINING_TASK_COMPLETED,
        moduleId: shipId,
        moduleType: 'mining_ship' as ModuleType,
        timestamp: Date.now(),
        data: eventData as unknown as Record<string, unknown>,
      });
    } else if (ship.status === ShipStatus.MINING) {
      // Only warn if it was supposed to be mining but had no task
      console.warn(
        `[MiningShipManager] No active mining task found for ship ${shipId} (status: ${ship.status}) during recall.`
      );
    }

    // Update status only if it wasn't already RETURNING
    if (ship.status !== ShipStatus.RETURNING) {
      this.updateShipStatus(ship, ShipStatus.RETURNING);
    }
    ship.targetNode = undefined; // Clear target node regardless

    // Optionally, tell the ship to return to base/hangar
    // Assuming {x: 0, y: 0} is the base position
    shipMovementManager.moveToPosition(shipId, { x: 0, y: 0 });
    console.log(`[MiningShipManager] Ship ${shipId} recalled.`);
  }

  private getResourcePosition(resourceNodeId: string): Position {
    // Simple pseudo-random position based on node ID suffix
    // Replace with actual lookup if node positions are stored elsewhere
    const seedPart = resourceNodeId.split('-').pop() || '0';
    const seed = parseInt(seedPart.replace(/[^0-9]/g, ''), 10) || 0; // Extract numbers only
    return {
      x: ((seed * 173 + 89) % 2000) - 1000, // Example pseudo-random coords
      y: ((seed * 251 + 137) % 2000) - 1000,
    };
  }

  public getShipData(shipId: string): MiningShip | undefined {
    return this.ships.get(shipId);
  }

  public getAllShips(): MiningShip[] {
    return Array.from(this.ships.values());
  }

  public getShipTask(shipId: string): MiningTask | undefined {
    return Array.from(this.tasks.values()).find(
      t => t.shipId === shipId && t.status === TaskStatus.IN_PROGRESS
    );
  }
}

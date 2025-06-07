import { v4 as uuidv4 } from 'uuid';
import { shipFactory } from '../../factories/ships/ShipFactory'; // Import factory
import { shipBehaviorManager } from '../../lib/ai/shipBehavior';
import { shipMovementManager } from '../../lib/ai/shipMovement';
import { moduleEventBus } from '../../lib/events/ModuleEventBus'; // Import the event bus
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/logging/ErrorLoggingService';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import
  {
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
import { PlayerShipClass } from '../../types/ships/PlayerShipTypes'; // Import PlayerShipClass for factory
import
  {
    ShipCategory,
    MiningShip as UnifiedMiningShip, // Keep the alias for clarity within this file
    UnifiedShipStatus,
  } from '../../types/ships/ShipTypes';
import { getAsteroidFieldManager } from '../ManagerRegistry'; // Import the registry function

// Define the expected structure for event data passed to publish
interface PublishEventData {
  type: EventType;
  moduleId: string;
  moduleType: ModuleType; // Use only ModuleType enum, remove string union
  timestamp: number;
  data: Record<string, unknown>; // Keep data flexible
}

// --- Restore local interface definition ---
interface IAsteroidFieldManager {
  // Finds node IDs (e.g., "minerals-cluster-1") for a given resource type
  findAvailableNodesByType(resourceType: ResourceType): string[];
  // Optional: Could also include getPosition, etc., if needed
  getResourcePosition?(nodeId: string): Position | undefined;
}
// -----------------------------------------------------------------------------

// Remove ONLY the ThresholdAutomateEventData interface
// interface ThresholdAutomateEventData { ... }

// Restore TaskStatus definition
enum TaskStatus {
  QUEUED = 'queued',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Restore MiningTask definition
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

// Temporary interface instead of type for better type consistency
// TODO: Remove this once EventTypes.ts is updated to use UnifiedShipStatus
type OldShipStatus = 'idle' | 'mining' | 'returning' | 'maintenance';
// TODO: Remove this once EventTypes.ts is updated to use UnifiedMiningShip
interface OldMiningShip {
  id: string;
  name: string;
  type: string;
  status: OldShipStatus;
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
}

// Keep the local ShipStatus enum but EXPORT it
export enum ShipStatus {
  IDLE = 'idle',
  MINING = 'mining',
  RETURNING = 'returning',
  MAINTENANCE = 'maintenance',
}

// Keep the local MiningShip interface but EXPORT it
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

export class MiningShipManager /* extends AbstractBaseManager<BaseEvent> */ {
  private static _instance: MiningShipManager | null = null;

  // Use the imported UnifiedMiningShip type with generic constructors
  private ships = new Map<string, UnifiedMiningShip>();
  private tasks = new Map<string, MiningTask>();
  private nodeAssignments = new Map<string, string>();

  // Use the local interface and definite assignment assertion
  private asteroidFieldManager!: IAsteroidFieldManager;

  // Remove constructor if not needed, or make it public
  // public constructor() {
  //   // Initialization logic if needed
  // }

  // Revert to the previous getInstance implementation
  public static getInstance(): MiningShipManager {
    MiningShipManager._instance ??= new MiningShipManager();
    return MiningShipManager._instance;
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
        // Cast via unknown as suggested by linter
        this.asteroidFieldManager = getAsteroidFieldManager() as unknown as IAsteroidFieldManager;
        if (!this.asteroidFieldManager) {
          throw new Error('AsteroidFieldManager instance not found in registry.');
        }
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorType.INITIALIZATION,
          ErrorSeverity.HIGH,
          {
            manager: 'MiningShipManager',
            method: 'initialize',
          }
        );
        // Handle the error appropriately - maybe throw, or use a safe default
        throw new Error('AsteroidFieldManager dependency is required and could not be obtained.');
      }
    }

    // TODO: Add 'RESOURCE_THRESHOLD_AUTOMATE' to EventType enum and uncomment this subscription
    // Also requires restoring ThresholdAutomateEventData and isThresholdAutomateEventData if uncommented
    // this.subscribe(EventType.RESOURCE_THRESHOLD_AUTOMATE, (event: BaseEvent) => {
    //   if (event.data && isThresholdAutomateEventData(event.data)) {
    //     const { threshold, resourceState } = event.data;
    //     let violationType: 'below_minimum' | 'above_maximum' | undefined;
    //
    //     if (threshold.comparison.includes('LESS_THAN')) {
    //       if (resourceState.current < threshold.value) {
    //         violationType = 'below_minimum';
    //       }
    //     } else if (threshold.comparison.includes('GREATER_THAN')) {
    //       if (resourceState.current > threshold.value) {
    //         violationType = 'above_maximum';
    //       }
    //     }
    //
    //     if (violationType) {
    //       const resourceTypeStr = threshold.resourceType as string;
    //       this.handleThresholdViolation(resourceTypeStr, {
    //         type: violationType,
    //         current: resourceState.current,
    //       });
    //     }
    //   }
    // });
    errorLoggingService.logInfo('MiningShipManager initialized');
    await Promise.resolve();
  }

  // Placeholder for update logic (was onUpdate)
  public update(deltaTime: number): void {
    this.ships.forEach(ship => {
      // Use UnifiedShipStatus for comparison
      if (ship.status === UnifiedShipStatus.MINING && ship.targetNode) {
        const task = Array.from(this.tasks.values()).find(
          t => t.shipId === ship.id && t.status === TaskStatus.IN_PROGRESS
        );

        if (task) {
          // Safe arithmetic operations with proper type guards
          const efficiency = typeof ship.efficiency === 'number' ? ship.efficiency : 1;
          const collectedAmount = efficiency * deltaTime;
          
          // Safe arithmetic operations for currentLoad
          const currentLoad = typeof ship.currentLoad === 'number' ? ship.currentLoad : 0;
          ship.currentLoad = currentLoad + collectedAmount;

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

          // Extract capacity number explicitly
          let cargoCapacity = 0;
          if (typeof ship.stats?.cargo === 'number') {
            cargoCapacity = ship.stats.cargo;
          } else if (
            typeof ship.stats?.cargo === 'object' &&
            ship.stats.cargo !== null &&
            'capacity' in ship.stats.cargo
          ) {
            cargoCapacity = (ship.stats.cargo).capacity;
          }

          // Safe comparison with proper type guards
          const shipCurrentLoad = typeof ship.currentLoad === 'number' ? ship.currentLoad : 0;
          if (shipCurrentLoad >= cargoCapacity) {
            this.recallShip(ship.id);
          }
        }
      }
    });
  }

  // Placeholder for dispose logic (was onDispose)
  public async dispose(): Promise<void> {
    this.ships.clear();
    this.tasks.clear();
    this.nodeAssignments.clear();
    errorLoggingService.logInfo('MiningShipManager disposed');
    await Promise.resolve();
  }

  // Add placeholder publish method (needed after removing inheritance)
  private publish(event: PublishEventData): void {
    // Ensure the event conforms to BaseEvent/ModuleEvent structure
    const moduleEvent: BaseEvent = {
      ...event,
      // Ensure moduleType is always a ModuleType enum
      moduleType: event.moduleType,
    };
    moduleEventBus.emit(moduleEvent);
  }

  // Add placeholder subscribe method (needed after removing inheritance)
  private subscribe(eventType: EventType | '*', callback: (event: BaseEvent) => void): () => void {
    // Subscribe using the global moduleEventBus
    return moduleEventBus.subscribe(eventType, callback);
  }

  // Update method signature to use UnifiedMiningShip and UnifiedShipStatus
  private updateShipStatus(ship: UnifiedMiningShip, newStatus: UnifiedShipStatus): void {
    const oldStatus = ship.status;
    if (oldStatus === newStatus) return;

    ship.status = newStatus;
    // TODO: Update EventTypes.ts to use UnifiedShipStatus, then remove this cast.
    const eventData: MiningShipStatusChangedEventData = {
      shipId: ship.id,
      oldStatus: oldStatus as unknown as OldShipStatus,
      newStatus: newStatus as unknown as OldShipStatus,
    };
    this.publish({
      type: EventType.MINING_SHIP_STATUS_CHANGED,
      moduleId: ship.id,
      moduleType: 'mining_ship' as ModuleType,
      timestamp: Date.now(),
      data: eventData as unknown as Record<string, unknown>,
    });
  }

  // Refactor registerShip to use the factory
  public registerShip(shipClass: PlayerShipClass, name: string, initialPosition: Position): void {
    const newShip = shipFactory.createShip(shipClass, {
      position: initialPosition,
      name: name,
      status: UnifiedShipStatus.IDLE,
    });

    if (newShip.category !== ShipCategory.MINING) {
      errorLoggingService.logWarn(
        `Factory created a non-mining ship (${newShip.category}) for class ${shipClass}`,
        {
          manager: 'MiningShipManager',
          method: 'registerShip',
          shipClass,
          actualCategory: newShip.category,
        }
      );
      return;
    }

    const miningShip = newShip as UnifiedMiningShip;
    miningShip.currentLoad = 0;
    miningShip.targetNode = undefined;
    miningShip.efficiency = miningShip.efficiency ?? 1.0;

    this.ships.set(miningShip.id, miningShip);

    const defaultMiningCapabilities = {
      canMine: true,
      canSalvage: false,
      canScan: false,
      canJump: false,
    };

    let cargoCapacityForBehavior = 0;
    if (typeof miningShip.stats?.cargo === 'number') {
      cargoCapacityForBehavior = miningShip.stats.cargo;
    } else if (
      typeof miningShip.stats?.cargo === 'object' &&
      miningShip.stats.cargo !== null &&
      'capacity' in miningShip.stats.cargo
    ) {
      cargoCapacityForBehavior = (miningShip.stats.cargo).capacity;
    }

    // Correct the object passed to registerShip with proper type handling
    shipBehaviorManager.registerShip({
      id: miningShip.id,
      position: miningShip.position,
      category: miningShip.category,
      // Use ResourceType enum instead of string literal
      type: ResourceType.MINERALS,
      capabilities: miningShip.capabilities ? {
        canMine: miningShip.capabilities.canMine ?? true,
        canSalvage: miningShip.capabilities.canSalvage ?? false,
        canScan: miningShip.capabilities.canScan ?? false,
        canJump: miningShip.capabilities.canJump ?? false,
      } : defaultMiningCapabilities,
      stats: {
        health: miningShip.stats?.health ?? 100,
        shield: miningShip.stats?.shield ?? 100,
        speed: miningShip.stats?.speed ?? 100,
        maneuverability: miningShip.stats?.mobility?.turnRate ?? 1,
        cargo: cargoCapacityForBehavior,
      },
    });

    const eventData: MiningShipRegisteredEventData = {
      ship: miningShip as unknown as OldMiningShip, // Keep cast for now
    };
    this.publish({
      type: EventType.MINING_SHIP_REGISTERED,
      moduleId: miningShip.id,
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
      // Find idle ships using UnifiedShipStatus
      const availableShip = Array.from(this.ships.values()).find(
        ship => {
          const currentLoad = typeof ship.currentLoad === 'number' ? ship.currentLoad : 0;
          return ship.status === UnifiedShipStatus.IDLE && currentLoad === 0;
        }
      );

      if (availableShip) {
        const resourceTypeEnum = this.stringToResourceType(resourceIdString);
        if (!resourceTypeEnum) {
          errorLoggingService.logWarn(
            `Invalid resource type string received: ${resourceIdString}`,
            {
              manager: 'MiningShipManager',
              method: 'handleThresholdViolation',
              resourceIdString,
            }
          );
          return;
        }

        const availableNodes = this.asteroidFieldManager.findAvailableNodesByType(resourceTypeEnum);
        const targetNodeId = availableNodes.find(nodeId => !this.nodeAssignments.has(nodeId));

        if (targetNodeId) {
          errorLoggingService.logInfo(
            `Dispatching ship ${availableShip.id} to node ${targetNodeId} for resource ${resourceIdString}`
          );
          this.dispatchShipToResource(availableShip.id, targetNodeId);
        } else {
          errorLoggingService.logWarn(
            `No unassigned mining nodes found for resource ${resourceIdString}`,
            {
              manager: 'MiningShipManager',
              resourceIdString,
            }
          );
        }
      } else {
        errorLoggingService.logWarn(
          `No idle mining ship available for resource ${resourceIdString}`,
          {
            manager: 'MiningShipManager',
            resourceIdString,
          }
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
        errorLoggingService.logInfo(
          `Recalling ships for resource ${resourceIdString} due to above_maximum threshold`
        );
        // Use only shipId in forEach, remove unused nodeId
        nodesToRecall.forEach(([, shipId]) => this.recallShip(shipId));
      } else {
        errorLoggingService.logInfo(
          `Received above_maximum for ${resourceIdString}, but no ships currently assigned to nodes of this type`
        );
      }
    }
  }

  private stringToResourceType(resourceStr: string): ResourceType | undefined {
    const upperStr = resourceStr.toUpperCase();
    if (Object.values(ResourceType).includes(upperStr as ResourceType)) {
      return upperStr as ResourceType;
    }
    errorLoggingService.logWarn(
      `Could not convert string '${resourceStr}' to ResourceType enum`,
      {
        manager: 'MiningShipManager',
        resourceStr,
      }
    );
    return undefined;
  }

  private getResourceTypeFromNodeId(nodeId: string): ResourceType {
    // Example: "minerals-cluster-1" -> "MINERALS"
    const resourceStr = nodeId.split('-')[0]?.toUpperCase();
    if (!resourceStr) {
      errorLoggingService.logWarn(
        `Could not determine resource type from nodeId: ${nodeId}. Defaulting to MINERALS`,
        {
          manager: 'MiningShipManager',
          nodeId,
        }
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
      errorLoggingService.logWarn(`Ship ${shipId} not found for dispatch`, {
        manager: 'MiningShipManager',
        shipId,
      });
      return;
    }
    // Use UnifiedShipStatus
    if (ship.status !== UnifiedShipStatus.IDLE) {
      errorLoggingService.logWarn(`Ship ${shipId} is not IDLE, cannot dispatch`, {
        manager: 'MiningShipManager',
        shipId,
        currentStatus: ship.status,
      });
      return;
    }
    if (this.nodeAssignments.has(resourceNodeId)) {
      errorLoggingService.logWarn(
        `Resource node ${resourceNodeId} already has ship ${this.nodeAssignments.get(resourceNodeId)} assigned`,
        {
          manager: 'MiningShipManager',
          resourceNodeId,
          assignedShipId: this.nodeAssignments.get(resourceNodeId),
        }
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

    this.updateShipStatus(ship, UnifiedShipStatus.MINING);
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
    if (
      !ship ||
      ship.status === UnifiedShipStatus.IDLE ||
      ship.status === UnifiedShipStatus.MAINTENANCE
    ) {
      errorLoggingService.logInfo(
        `Ship ${shipId} is ${ship?.status ?? 'not found'}, recall skipped`,
        {
          manager: 'MiningShipManager',
          shipId,
          status: ship?.status,
        }
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
    } else if (ship.status === UnifiedShipStatus.MINING) {
      // Only warn if it was supposed to be mining but had no task
      errorLoggingService.logWarn(
        `No active mining task found for ship ${shipId} (status: ${ship.status}) during recall`,
        {
          manager: 'MiningShipManager',
          shipId,
          status: ship.status,
        }
      );
    }

    // Update status only if it wasn't already RETURNING
    if (ship.status !== UnifiedShipStatus.RETURNING) {
      this.updateShipStatus(ship, UnifiedShipStatus.RETURNING);
    }
    ship.targetNode = undefined; // Clear target node regardless

    // Optionally, tell the ship to return to base/hangar
    // Assuming {x: 0, y: 0} is the base position
    shipMovementManager.moveToPosition(shipId, { x: 0, y: 0 });
    errorLoggingService.logInfo(`Ship ${shipId} recalled`);
  }

  private getResourcePosition(resourceNodeId: string): Position {
    // Try getting position from AsteroidFieldManager first
    if (this.asteroidFieldManager?.getResourcePosition) {
      const pos = this.asteroidFieldManager.getResourcePosition(resourceNodeId);
      if (pos) return pos;
    }
    // Fallback to pseudo-random generation if manager or method doesn't exist
    errorLoggingService.logWarn(
      `Could not get position for node ${resourceNodeId} from AsteroidFieldManager. Using fallback`,
      {
        manager: 'MiningShipManager',
        resourceNodeId,
      }
    );
    const seedPart = resourceNodeId.split('-').pop() ?? '0';
    const seed = parseInt(seedPart.replace(/[^0-9]/g, ''), 10) ?? 0;
    return {
      x: ((seed * 173 + 89) % 2000) - 1000,
      y: ((seed * 251 + 137) % 2000) - 1000,
    };
  }

  public getShipData(shipId: string): UnifiedMiningShip | undefined {
    return this.ships.get(shipId);
  }

  public getAllShips(): UnifiedMiningShip[] {
    return Array.from(this.ships.values());
  }

  public getShipTask(shipId: string): MiningTask | undefined {
    return Array.from(this.tasks.values()).find(
      t => t.shipId === shipId && t.status === TaskStatus.IN_PROGRESS
    );
  }
}

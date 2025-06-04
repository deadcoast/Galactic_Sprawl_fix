// import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents'; // Remove legacy bus
import { BaseEvent } from '../../lib/events/UnifiedEventSystem'; // Keep BaseEvent
import { AbstractBaseManager } from '../../lib/managers/BaseManager'; // Add Base Manager
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../services/logging/ErrorLoggingService';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { EventType } from '../../types/events/EventTypes'; // Add Standard EventType Enum
import { ResourceType } from '../../types/resources/ResourceTypes';
import {
  getSystemCommunication,
  MessagePriority,
  SystemId,
} from '../../utils/events/EventCommunication'; // Keep for now
import { EventPriorityQueue } from '../../utils/events/EventFiltering';
import {
  AutomationAction,
  AutomationCondition,
  AutomationManager, // Keep for type usage, but remove from constructor
  AutomationRule,
  ResourceConditionValue,
} from '../game/AutomationManager';
import { gameLoopManager, UpdatePriority } from '../game/GameLoopManager';

// Interfaces for specific event data payloads
interface ResourceShortageEventData {
  resourceType: ResourceType;
}

interface StatusChangedEventData {
  status: string; // TODO: Use a specific status enum/type if available
}

// Type Guards for event data
function isResourceShortageData(data: unknown): data is ResourceShortageEventData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'resourceType' in data &&
    typeof (data as Record<string, unknown>).resourceType === 'string' &&
    Object.values(ResourceType).includes((data as ResourceShortageEventData).resourceType)
  );
}

function isStatusChangedData(data: unknown): data is StatusChangedEventData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'status' in data &&
    typeof (data as Record<string, unknown>).status === 'string'
  );
}

/**
 * Global routine type
 */
export type GlobalRoutineType =
  | 'system-maintenance'
  | 'resource-balancing'
  | 'performance-optimization'
  | 'emergency-response'
  | 'scheduled-task'
  | 'custom';

/**
 * Global routine interface
 */
export interface GlobalRoutine {
  id: string;
  name: string;
  type: GlobalRoutineType;
  description: string;
  enabled: boolean;
  priority: MessagePriority;
  interval: number;
  lastRun?: number;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  systems: SystemId[];
  tags: string[];
}

/**
 * Global automation manager
 * Extends the module-specific automation with system-wide routines
 */
// Extend AbstractBaseManager
export class GlobalAutomationManager extends AbstractBaseManager<BaseEvent> {
  // Restore manual singleton instance property
  private static _instance: GlobalAutomationManager | null = null;

  // Remove _automationManager instance field if no longer needed after removing from constructor
  private routines: Map<string, GlobalRoutine>;
  private activeRoutines: Map<string, boolean>;
  private routineQueue: EventPriorityQueue<GlobalRoutine & { executionTime: number }>;
  private systemCommunications: Map<SystemId, ReturnType<typeof getSystemCommunication>>; // Keep for now

  // Add protected constructor
  protected constructor() {
    super('GlobalAutomationManager'); // Call super
    this.routines = new Map();
    this.activeRoutines = new Map();
    this.systemCommunications = new Map();

    this.routineQueue = new EventPriorityQueue(routine => {
      return this.executeRoutine(routine);
    });
  }

  // Restore manual static getInstance method
  public static getInstance(): GlobalAutomationManager {
    if (!GlobalAutomationManager._instance) {
      // Note: This bypasses the protected constructor. Consider if this is intended.
      GlobalAutomationManager._instance = new GlobalAutomationManager();
    }
    return GlobalAutomationManager._instance;
  }

  /**
   * Initialize the global automation manager - RENAME to onInitialize
   */
  protected async onInitialize(): Promise<void> {
    this.initializeSystemCommunications(); // Keep for now

    gameLoopManager.registerUpdate(
      this.managerName, // Use inherited managerName
      this.update.bind(this),
      UpdatePriority.NORMAL
    );

    // Subscribe using this.subscribe
    this.subscribe(EventType.ERROR_OCCURRED as string, this.handleErrorEvent);
    this.subscribe(EventType.RESOURCE_SHORTAGE as string, this.handleResourceShortage);
    this.subscribe(EventType.STATUS_CHANGED as string, this.handleStatusChanged);

    await Promise.resolve(); // Placeholder
  }

  // Add onDispose method
  protected async onDispose(): Promise<void> {
    gameLoopManager.unregisterUpdate(this.managerName);
    // Unsubscribe handled by base class via this.unsubscribeFunctions
    this.routines.clear();
    this.activeRoutines.clear();
    this.routineQueue.clear(); // Assuming queue has a clear method
    this.systemCommunications.clear(); // Assuming map clear is sufficient
    await Promise.resolve(); // Placeholder
  }

  // Add onUpdate method (used by gameLoopManager)
  protected onUpdate(_deltaTime: number): void {
    // Process routines via queue if needed
    // The queue seems to handle execution itself? Verify EventPriorityQueue logic.
  }

  /**
   * Initialize system communications - Keep for now
   */
  private initializeSystemCommunications(): void {
    const systems: SystemId[] = [
      'resource-system',
      'module-system',
      'combat-system',
      'exploration-system',
      'mining-system',
      'tech-system',
      'ui-system',
      'game-loop',
      'event-system',
    ];

    systems.forEach(systemId => {
      const communication = getSystemCommunication(systemId);
      this.systemCommunications.set(systemId, communication);

      communication.registerHandler('automation-request', message => {
        // Replace console.warn with logger
        errorLoggingService.logInfo('Received automation request', {
          systemId,
          payload: message.payload,
          manager: this.managerName,
        });

        // Keep payload handling logic for now, but note type assertions
        const { payload } = message;
        if (payload && typeof payload === 'object') {
          const routineId = 'routineId' in payload ? String(payload.routineId) : undefined;
          const createRoutine =
            'createRoutine' in payload &&
            payload.createRoutine &&
            typeof payload.createRoutine === 'object'
              ? (payload.createRoutine as GlobalRoutine)
              : undefined;

          if (routineId) {
            const routine = this.routines.get(routineId);
            if (routine && routine.enabled) {
              this.scheduleRoutine(routine);
              return;
            }
          }

          if (createRoutine) {
            this.registerRoutine(createRoutine);
          }
        }
      });
    });
  }

  /**
   * Register a global routine
   */
  public registerRoutine(routine: GlobalRoutine): string {
    // Generate ID if not provided
    if (!routine.id) {
      routine.id = `routine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    this.routines.set(routine.id, routine);
    this.activeRoutines.set(routine.id, routine.enabled);

    // If routine is enabled, schedule it
    if (routine.enabled) {
      this.scheduleRoutine(routine);
    }

    // Notify systems about the new routine
    routine.systems.forEach(systemId => {
      const communication = this.systemCommunications.get(systemId);
      if (communication) {
        communication.sendMessage('broadcast', 'routine-registered', {
          routineId: routine.id,
          name: routine.name,
          type: routine.type,
        });
      }
    });

    return routine.id;
  }

  /**
   * Unregister a global routine
   */
  public unregisterRoutine(routineId: string): boolean {
    const routine = this.routines.get(routineId);
    if (!routine) {
      return false;
    }

    // Notify systems about routine removal
    routine.systems.forEach(systemId => {
      const communication = this.systemCommunications.get(systemId);
      if (communication) {
        communication.sendMessage(systemId, 'routine-unregistered', {
          routineId: routine.id,
        });
      }
    });

    this.routines.delete(routineId);
    this.activeRoutines.delete(routineId);
    return true;
  }

  /**
   * Enable a global routine
   */
  public enableRoutine(routineId: string): boolean {
    const routine = this.routines.get(routineId);
    if (!routine) {
      return false;
    }

    routine.enabled = true;
    this.activeRoutines.set(routineId, true);

    // Schedule the routine
    this.scheduleRoutine(routine);

    return true;
  }

  /**
   * Disable a global routine
   */
  public disableRoutine(routineId: string): boolean {
    const routine = this.routines.get(routineId);
    if (!routine) {
      return false;
    }

    routine.enabled = false;
    this.activeRoutines.set(routineId, false);
    return true;
  }

  /**
   * Schedule a routine for execution
   */
  private scheduleRoutine(routine: GlobalRoutine): void {
    // Add to the priority queue
    this.routineQueue.enqueue({
      ...routine,
      executionTime: Date.now() + (routine.interval ?? 0),
    });
  }

  /**
   * Execute a routine
   */
  private async executeRoutine(routine: GlobalRoutine & { executionTime: number }): Promise<void> {
    try {
      // Skip if routine is disabled
      if (!routine.enabled) {
        return;
      }

      // Skip if it's not time to run yet
      if (Date.now() < routine.executionTime) {
        // Re-queue for later execution
        this.scheduleRoutine(routine);
        return;
      }

      errorLoggingService.logInfo(`Executing routine: ${routine.name}`, {
        routineId: routine.id,
        manager: this.managerName,
      });

      // Check conditions
      let conditionsMet = true;
      try {
        // Try to check conditions, but handle if the method is private
        // We'll implement our own simple condition checking if needed
        for (const condition of routine.conditions) {
          if (condition.type === 'RESOURCE_BELOW') {
            // Simple implementation for resource below condition
            const { target, value } = condition;
            if (target && value !== undefined) {
              const resourceAmount = this.getResourceAmount(target as ResourceType);
              // Extract numeric value for comparison
              const threshold =
                typeof value === 'number' ? value : (value as ResourceConditionValue).amount;
              if (resourceAmount > threshold) {
                conditionsMet = false;
                break;
              }
            }
          } else if (condition.type === 'RESOURCE_ABOVE') {
            // Simple implementation for resource above condition
            const { target, value } = condition;
            if (target && value !== undefined) {
              const resourceAmount = this.getResourceAmount(target as ResourceType);
              // Extract numeric value for comparison
              const threshold =
                typeof value === 'number' ? value : (value as ResourceConditionValue).amount;
              if (resourceAmount < threshold) {
                conditionsMet = false;
                break;
              }
            }
          }
          // Add more condition types as needed
        }
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorType.RUNTIME,
          undefined,
          {
            context: 'executeRoutine - checkConditions',
            routineId: routine.id,
            manager: this.managerName,
          }
        );
      }

      if (!conditionsMet) {
        errorLoggingService.logInfo(`Conditions not met for routine: ${routine.name}`, {
          routineId: routine.id,
          manager: this.managerName,
        });

        // Re-schedule for next interval
        this.scheduleRoutine({
          ...routine,
          lastRun: Date.now(),
        });
        return;
      }

      // Execute actions
      try {
        // Try to execute actions through the automation manager
        // If that fails, implement our own simple action execution
        for (const action of routine.actions) {
          await this.executeAction(action);
        }
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorType.RUNTIME,
          undefined,
          {
            context: 'executeRoutine - executeActions',
            routineId: routine.id,
            manager: this.managerName,
          }
        );
      }

      // Update last run time
      const updatedRoutine = {
        ...routine,
        lastRun: Date.now(),
      };
      this.routines.set(routine.id, updatedRoutine);

      // Emit routine completion event
      this.publish({
        type: EventType.AUTOMATION_CYCLE_COMPLETE as string,
        managerId: this.managerName,
        timestamp: Date.now(),
        data: {
          routineId: routine.id,
          routineName: routine.name,
          routineType: routine.type,
        },
      });

      // Notify relevant systems
      routine.systems.forEach(systemId => {
        const communication = this.systemCommunications.get(systemId);
        if (communication) {
          communication.sendMessage(systemId, 'routine-executed', {
            routineId: routine.id,
            success: true,
            timestamp: Date.now(),
          });
        }
      });

      // Re-schedule for next interval
      this.scheduleRoutine(updatedRoutine);
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorType.RUNTIME,
        undefined,
        {
          context: 'executeRoutine',
          routineId: routine.id,
          manager: this.managerName,
        }
      );

      // Emit error event
      this.publish({
        type: EventType.ERROR_OCCURRED as string,
        managerId: this.managerName,
        timestamp: Date.now(),
        data: {
          routineId: routine.id,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      // Re-schedule for next interval
      this.scheduleRoutine({
        ...routine,
        lastRun: Date.now(),
      });
    }
  }

  /**
   * Get the current amount of a resource
   * @param resourceType The type of resource to check
   * @returns The current amount of the resource
   */
  private getResourceAmount(resourceType: ResourceType): number {
    // Implementation would get the actual resource amount from the game state
    // For now, return a mock value
    return 100;
  }

  /**
   * Helper method to execute a single action
   */
  private async executeAction(action: AutomationAction): Promise<void> {
    switch (action.type) {
      case 'ACTIVATE_MODULE':
        if (!action.target) {
          return;
        }
        // Emit an event to activate the module
        this.publish({
          type: EventType.MODULE_ACTIVATED as string,
          managerId: this.managerName,
          moduleId: action.target,
          timestamp: Date.now(),
          data: { source: 'automation', targetModuleId: action.target },
        });
        break;

      case 'DEACTIVATE_MODULE':
        if (!action.target) {
          return;
        }
        // Emit an event to deactivate the module
        this.publish({
          type: EventType.MODULE_DEACTIVATED as string,
          managerId: this.managerName,
          moduleId: action.target,
          timestamp: Date.now(),
          data: { source: 'automation', targetModuleId: action.target },
        });
        break;

      case 'TRANSFER_RESOURCES':
        if (!action.target || !action.value) {
          return;
        }
        // Emit an event to transfer resources
        this.publish({
          type: EventType.RESOURCE_TRANSFERRED as string,
          managerId: this.managerName,
          timestamp: Date.now(),
          data: {
            source: 'automation',
            ...this.convertActionValueToRecord(action.value),
          },
        });
        break;

      case 'EMIT_EVENT': {
        if (!action.target || !action.value) {
          return;
        }

        // Define interface for EmitEventValue
        interface EmitEventValue {
          moduleId?: string;
          moduleType?: string;
          data?: Record<string, unknown>;
          [key: string]: unknown; // Add index signature to satisfy Record<string, unknown>
        }

        // Use type guard instead of type assertion
        const emitValue: EmitEventValue = {};

        if (typeof action.value === 'object' && action.value !== null) {
          // First cast to unknown to avoid type errors
          const value = action.value as unknown as Record<string, unknown>;

          if ('moduleId' in value && typeof value.moduleId === 'string') {
            emitValue.moduleId = value.moduleId;
          }

          if ('moduleType' in value && typeof value.moduleType === 'string') {
            emitValue.moduleType = value.moduleType as ModuleType;
          }

          if ('data' in value && typeof value.data === 'object' && value.data !== null) {
            emitValue.data = value.data as Record<string, unknown>;
          }
        }

        // Use EventType enum check (basic check)
        if (action.target && Object.values(EventType).includes(action.target as EventType)) {
          // Replace moduleEventBus.emit with this.publish
          this.publish({
            type: action.target as string, // Use the target string directly (cast needed)
            managerId: this.managerName,
            timestamp: Date.now(),
            data: {
              source: 'automation',
              originalModuleId: emitValue.moduleId,
              originalModuleType: emitValue.moduleType,
              ...(emitValue.data ?? {}),
            },
          });
        } else {
          errorLoggingService.logwarn(
            `Invalid event type specified in EMIT_EVENT action: ${action.target}`,
            {
              action: action,
              manager: this.managerName,
            }
          );
        }
        break;
      }

      default:
        errorLoggingService.logwarn(`Unsupported action type in executeAction: ${action.type}`, {
          action: action,
          manager: this.managerName,
        });
    }
  }

  // Add a helper method to convert action values to Record<string, unknown>
  private convertActionValueToRecord(value: unknown): Record<string, unknown> {
    if (value === null || value === undefined) {
      return {};
    }

    if (typeof value === 'object') {
      // If it's already an object, convert it to a Record<string, unknown>
      // First cast to unknown, then to Record<string, unknown> to avoid type errors
      return Object.entries(value as unknown as Record<string, unknown>).reduce(
        (acc, [key, val]) => {
          acc[key] = val;
          return acc;
        },
        {} as Record<string, unknown>
      );
    }

    // If it's a primitive value, wrap it in an object
    return { value };
  }

  /**
   * Handle error events
   */
  private handleErrorEvent = (_event: BaseEvent): void => {
    // Find emergency response routines
    const emergencyRoutines = Array.from(this.routines.values()).filter(
      routine =>
        routine.enabled &&
        routine.type === 'emergency-response' &&
        routine.tags.includes('error-handling')
    );

    // Schedule emergency routines immediately
    emergencyRoutines.forEach(routine => {
      this.routineQueue.enqueue({
        ...routine,
        executionTime: Date.now(), // Execute immediately
      });
    });
  };

  /**
   * Handle resource shortage events
   */
  private handleResourceShortage = (event: BaseEvent): void => {
    let tag = 'general';
    if (event.data && isResourceShortageData(event.data)) {
      tag = event.data.resourceType;
    }

    // Find resource balancing routines
    const resourceRoutines = Array.from(this.routines.values()).filter(
      routine =>
        routine.enabled && routine.type === 'resource-balancing' && routine.tags.includes(tag)
    );

    // Schedule resource routines with high priority
    resourceRoutines.forEach(routine => {
      this.routineQueue.enqueue({
        ...routine,
        executionTime: Date.now(), // Execute immediately
        priority: MessagePriority.HIGH, // Override with high priority
      });
    });
  };

  /**
   * Handle status changed events
   */
  private handleStatusChanged = (event: BaseEvent): void => {
    let tag = 'general';
    if (event.data && isStatusChangedData(event.data)) {
      tag = event.data.status;
    }

    // Find relevant routines based on status
    const statusRoutines = Array.from(this.routines.values()).filter(
      routine =>
        routine.enabled &&
        (routine.type === 'system-maintenance' || routine.type === 'performance-optimization') &&
        routine.tags.includes(tag)
    );

    // Schedule status routines
    statusRoutines.forEach(routine => {
      this.routineQueue.enqueue({
        ...routine,
        executionTime: Date.now() + 1000, // Small delay to allow system to stabilize
      });
    });
  };

  /**
   * Get all routines
   */
  public getAllRoutines(): GlobalRoutine[] {
    return Array.from(this.routines.values());
  }

  /**
   * Get routines by type
   */
  public getRoutinesByType(type: GlobalRoutineType): GlobalRoutine[] {
    return Array.from(this.routines.values()).filter(routine => routine.type === type);
  }

  /**
   * Get routines by system
   */
  public getRoutinesBySystem(systemId: SystemId): GlobalRoutine[] {
    return Array.from(this.routines.values()).filter(routine => routine.systems.includes(systemId));
  }

  /**
   * Get routines by tag
   */
  public getRoutinesByTag(tag: string): GlobalRoutine[] {
    return Array.from(this.routines.values()).filter(routine => routine.tags.includes(tag));
  }

  /**
   * Get active routines
   */
  public getActiveRoutines(): GlobalRoutine[] {
    return Array.from(this.routines.values()).filter(routine => routine.enabled);
  }

  /**
   * Get the automation manager instance
   * This method is used for testing and debugging purposes
   */
  public getAutomationManager(): AutomationManager | null {
    // TODO: Retrieve from registry if this manager needs access
    return null; // Placeholder
  }

  /**
   * Get a rule by ID
   */
  public getRule(ruleId: string): AutomationRule | undefined {
    // Delegate to AutomationManager
    return undefined; // Placeholder
  }

  /**
   * Update an existing rule
   */
  public updateRule(ruleId: string, rule: AutomationRule): void {
    // Delegate to AutomationManager
    // this._automationManager.updateRule(ruleId, rule);
  }

  /**
   * Register a new rule
   */
  public registerRule(rule: AutomationRule): void {
    // Delegate to AutomationManager
    // this._automationManager.registerRule(rule);
  }

  /**
   * Set the automation manager instance
   * This method is used for testing and debugging purposes
   */
  public setAutomationManager(manager: AutomationManager): void {
    // this._automationManager = manager;
  }
}

// Remove singleton export, Registry will handle instantiation
// export const globalAutomationManager = new GlobalAutomationManager(automationManagerInstance);

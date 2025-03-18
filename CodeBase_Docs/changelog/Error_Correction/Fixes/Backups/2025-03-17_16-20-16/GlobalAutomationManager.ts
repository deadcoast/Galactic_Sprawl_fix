import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import {
  getSystemCommunication,
  MessagePriority,
  SystemId,
} from '../../utils/events/EventCommunication';
import { EventPriorityQueue } from '../../utils/events/EventFiltering';
import {
  AutomationAction,
  AutomationCondition,
  AutomationManager,
  AutomationRule,
  ResourceConditionValue,
} from '../game/AutomationManager';
import { gameLoopManager, UpdatePriority } from '../game/GameLoopManager';
import { ResourceType } from './../../types/resources/ResourceTypes';

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
export class GlobalAutomationManager {
  private _automationManager: AutomationManager;
  private routines: Map<string, GlobalRoutine>;
  private activeRoutines: Map<string, boolean>;
  private routineQueue: EventPriorityQueue<GlobalRoutine & { executionTime: number }>;
  private systemCommunications: Map<SystemId, ReturnType<typeof getSystemCommunication>>;
  private isInitialized: boolean = false;

  constructor(_automationManager: AutomationManager) {
    this._automationManager = _automationManager;
    this.routines = new Map();
    this.activeRoutines = new Map();
    this.systemCommunications = new Map();

    // Create a priority queue for routine execution
    this.routineQueue = new EventPriorityQueue(routine => {
      return this.executeRoutine(routine);
    });
  }

  /**
   * Initialize the global automation manager
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    console.warn('Initializing Global Automation Manager...');

    // Log the automation manager status
    if (this._automationManager) {
      console.warn(
        `[GlobalAutomationManager] Using automation manager for condition checking and rule management`
      );
    } else {
      console.warn(
        '[GlobalAutomationManager] No automation manager provided, some features may be limited'
      );
    }

    // Initialize system communications
    this.initializeSystemCommunications();

    // Register with game loop for regular updates
    gameLoopManager.registerUpdate(
      'global-automation-manager',
      this.update.bind(this),
      UpdatePriority.NORMAL
    );

    // Subscribe to relevant events
    moduleEventBus.subscribe('ERROR_OCCURRED' as ModuleEventType, this.handleErrorEvent);
    moduleEventBus.subscribe('RESOURCE_SHORTAGE' as ModuleEventType, this.handleResourceShortage);
    moduleEventBus.subscribe('STATUS_CHANGED' as ModuleEventType, this.handleStatusChanged);

    this.isInitialized = true;

    // Emit initialization event
    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED' as ModuleEventType,
      moduleId: 'global-automation',
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: {
        routineCount: this.routines.size,
        systems: Array.from(this.systemCommunications.keys()),
      },
    });
  }

  /**
   * Initialize system communications
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

      // Register message handler for automation requests
      communication.registerHandler('automation-request', message => {
        console.warn(`Received automation request from ${systemId}:`, message.payload);

        // Use type guard instead of type assertion
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
      executionTime: Date.now() + (routine.interval || 0),
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

      console.warn(`Executing routine: ${routine.name} (${routine.id})`);

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
        console.warn('Error checking conditions, using simple implementation:', error);
      }

      if (!conditionsMet) {
        console.warn(`Conditions not met for routine: ${routine.name}`);

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
        console.warn('Error executing actions, using simple implementation:', error);
      }

      // Update last run time
      const updatedRoutine = {
        ...routine,
        lastRun: Date.now(),
      };
      this.routines.set(routine.id, updatedRoutine);

      // Emit routine completion event
      moduleEventBus.emit({
        type: 'AUTOMATION_CYCLE_COMPLETE' as ModuleEventType,
        moduleId: 'global-automation',
        moduleType: 'resource-manager',
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
      console.error(`Error executing routine ${routine.id}:`, error);

      // Emit error event
      moduleEventBus.emit({
        type: 'ERROR_OCCURRED' as ModuleEventType,
        moduleId: 'global-automation',
        moduleType: 'resource-manager',
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
        moduleEventBus.emit({
          type: 'MODULE_ACTIVATED' as ModuleEventType,
          moduleId: action.target,
          moduleType: 'resource-manager',
          timestamp: Date.now(),
          data: { source: 'automation' },
        });
        break;

      case 'DEACTIVATE_MODULE':
        if (!action.target) {
          return;
        }
        // Emit an event to deactivate the module
        moduleEventBus.emit({
          type: 'MODULE_DEACTIVATED' as ModuleEventType,
          moduleId: action.target,
          moduleType: 'resource-manager',
          timestamp: Date.now(),
          data: { source: 'automation' },
        });
        break;

      case 'TRANSFER_RESOURCES':
        if (!action.target || !action.value) {
          return;
        }
        // Emit an event to transfer resources
        moduleEventBus.emit({
          type: 'RESOURCE_TRANSFERRED' as ModuleEventType,
          moduleId: 'automation',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
          data: this.convertActionValueToRecord(action.value),
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

        // Validate that action.target is a valid ModuleEventType
        const isValidEventType = (type: string): type is ModuleEventType => {
          return [
            'MODULE_CREATED',
            'MODULE_ATTACHED',
            'MODULE_DETACHED',
            'MODULE_UPGRADED',
            'MODULE_ACTIVATED',
            'MODULE_DEACTIVATED',
            'MODULE_UPDATED',
            'ATTACHMENT_STARTED',
            'ATTACHMENT_CANCELLED',
            'ATTACHMENT_COMPLETED',
            'ATTACHMENT_PREVIEW_SHOWN',
            'RESOURCE_PRODUCED',
            'RESOURCE_CONSUMED',
            'RESOURCE_TRANSFERRED',
            'RESOURCE_PRODUCTION_REGISTERED',
            'RESOURCE_PRODUCTION_UNREGISTERED',
            'RESOURCE_CONSUMPTION_REGISTERED',
            'RESOURCE_CONSUMPTION_UNREGISTERED',
            'RESOURCE_FLOW_REGISTERED',
            'RESOURCE_FLOW_UNREGISTERED',
            'RESOURCE_SHORTAGE',
            'RESOURCE_UPDATED',
            'AUTOMATION_STARTED',
            'AUTOMATION_STOPPED',
            'AUTOMATION_CYCLE_COMPLETE',
            'STATUS_CHANGED',
            'ERROR_OCCURRED',
            'MISSION_STARTED',
            'MISSION_COMPLETED',
            'MISSION_FAILED',
            'MISSION_PROGRESS_UPDATED',
            'MISSION_REWARD_CLAIMED',
            'SUB_MODULE_CREATED',
            'SUB_MODULE_ATTACHED',
            'SUB_MODULE_DETACHED',
            'SUB_MODULE_UPGRADED',
            'SUB_MODULE_ACTIVATED',
            'SUB_MODULE_DEACTIVATED',
            'SUB_MODULE_EFFECT_APPLIED',
            'SUB_MODULE_EFFECT_REMOVED',
            'COMBAT_UPDATED',
            'TECH_UNLOCKED',
            'TECH_UPDATED',
          ].includes(type as ModuleEventType);
        };

        if (isValidEventType(action.target)) {
          // Emit the specified event
          moduleEventBus.emit({
            type: action.target,
            moduleId: emitValue.moduleId || 'automation',
            moduleType: (emitValue.moduleType || 'resource-manager') as ModuleType,
            timestamp: Date.now(),
            data: emitValue.data || {},
          });
        } else {
          console.warn(`Invalid event type: ${action.target}`);
        }
        break;
      }

      default:
        console.warn(`Unsupported action type: ${action.type}`);
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
   * Update method called by the game loop
   */
  private update(_deltaTime: number, _elapsedTime: number): void {
    // Process any pending routines
    // The queue itself handles the execution
  }

  /**
   * Handle error events
   */
  private handleErrorEvent = (_event: ModuleEvent): void => {
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
  private handleResourceShortage = (event: ModuleEvent): void => {
    // Find resource balancing routines
    const resourceRoutines = Array.from(this.routines.values()).filter(
      routine =>
        routine.enabled &&
        routine.type === 'resource-balancing' &&
        routine.tags.includes(
          event.data && typeof event.data === 'object' && 'resourceType' in event.data
            ? String(event.data.resourceType)
            : 'general'
        )
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
  private handleStatusChanged = (event: ModuleEvent): void => {
    // Find relevant routines based on status
    const statusRoutines = Array.from(this.routines.values()).filter(
      routine =>
        routine.enabled &&
        (routine.type === 'system-maintenance' || routine.type === 'performance-optimization') &&
        routine.tags.includes(
          event.data && typeof event.data === 'object' && 'status' in event.data
            ? String(event.data.status)
            : 'general'
        )
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
   * Clean up resources
   */
  public cleanup(): void {
    // Unregister from game loop
    gameLoopManager.unregisterUpdate('global-automation-manager');

    // Unsubscribe from events
    const unsubscribeError = moduleEventBus.subscribe(
      'ERROR_OCCURRED' as ModuleEventType,
      this.handleErrorEvent
    );
    const unsubscribeShortage = moduleEventBus.subscribe(
      'RESOURCE_SHORTAGE' as ModuleEventType,
      this.handleResourceShortage
    );
    const unsubscribeStatus = moduleEventBus.subscribe(
      'STATUS_CHANGED' as ModuleEventType,
      this.handleStatusChanged
    );

    if (typeof unsubscribeError === 'function') {
      unsubscribeError();
    }
    if (typeof unsubscribeShortage === 'function') {
      unsubscribeShortage();
    }
    if (typeof unsubscribeStatus === 'function') {
      unsubscribeStatus();
    }

    // Clear routines
    this.routines.clear();
    this.activeRoutines.clear();

    // Clear system communications
    this.systemCommunications.clear();

    this.isInitialized = false;
  }

  /**
   * Get the automation manager instance
   * This method is used for testing and debugging purposes
   */
  public getAutomationManager(): AutomationManager | null {
    return this._automationManager || null;
  }

  /**
   * Get a rule by ID
   */
  public getRule(ruleId: string): AutomationRule | undefined {
    // Delegate to AutomationManager
    return this._automationManager.getRule(ruleId);
  }

  /**
   * Update an existing rule
   */
  public updateRule(ruleId: string, rule: AutomationRule): void {
    // Delegate to AutomationManager
    this._automationManager.updateRule(ruleId, rule);

    // Emit event
    moduleEventBus.emit({
      type: 'STATUS_CHANGED', // Use a valid ModuleEventType
      moduleId: rule.moduleId,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: { ruleId, rule, status: 'updated' },
    });
  }

  /**
   * Register a new rule
   */
  public registerRule(rule: AutomationRule): void {
    // Delegate to AutomationManager
    this._automationManager.registerRule(rule);

    // Emit event
    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED', // Use a valid ModuleEventType
      moduleId: rule.moduleId,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: { ruleId: rule.id, rule },
    });
  }
}

// Export singleton instance
export const globalAutomationManager = new GlobalAutomationManager(
  // We'll need to import the actual instance in the initialization file
  null as unknown as AutomationManager
);

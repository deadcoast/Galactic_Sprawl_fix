import { Subject } from 'rxjs';
import { thresholdEvents } from '../../contexts/ThresholdTypes';
import {
  AutomationCondition,
  EventConditionValue,
  StatusConditionValue,
  TimeConditionValue,
} from '../../managers/game/AutomationManager';
import { ResourceManager } from '../../managers/game/ResourceManager';
import { MiningShipManagerImpl } from '../../managers/mining/MiningShipManagerImpl';
import { moduleManager } from '../../managers/module/ModuleManager';
import { ResourceType } from './../../types/resources/ResourceTypes';

// Create a resourceManager instance
const resourceManager = new ResourceManager();

// Create a subject to handle condition state
const conditionState = new Subject<{
  resourceId: string;
  currentAmount: number;
  thresholds: { min: number; max: number };
}>();

/**
 * Extended condition type with runtime state
 * This interface will be used in future implementations to:
 * 1. Track when conditions were last evaluated to optimize performance
 * 2. Store intermediate calculation results for complex conditions
 * 3. Maintain history of condition state changes for analytics
 * 4. Support condition debouncing to prevent rapid oscillation
 * 5. Enable condition-specific timeout and expiration logic
 */
interface __RuntimeCondition extends AutomationCondition {
  lastChecked?: number;
}

/**
 * Extended condition type with additional properties for time-based conditions
 */
interface TimeCondition extends AutomationCondition {
  value?: TimeConditionValue;
}

/**
 * Extended condition type with additional properties for status-based conditions
 */
interface StatusCondition extends AutomationCondition {
  value?: StatusConditionValue;
}

/**
 * Type guard for TimeCondition
 */
function isTimeCondition(condition: AutomationCondition): condition is TimeCondition {
  return condition.type === 'TIME_ELAPSED';
}

/**
 * Type guard for StatusCondition
 */
function isStatusCondition(condition: AutomationCondition): condition is StatusCondition {
  return condition.type === 'STATUS_EQUALS';
}

/**
 * Helper function to get time value from condition
 */
function getTimeValue(condition: AutomationCondition): number {
  if (
    condition.value &&
    typeof condition.value === 'object' &&
    'milliseconds' in condition.value &&
    typeof condition.value.milliseconds === 'number'
  ) {
    return condition.value.milliseconds;
  }
  return 0;
}

/**
 * Helper function to get status value from condition
 */
function getStatusValue(condition: AutomationCondition): string {
  if (
    condition.value &&
    typeof condition.value === 'object' &&
    'status' in condition.value &&
    typeof condition.value.status === 'string'
  ) {
    return condition.value.status;
  }
  return '';
}

/**
 * Interface for mining events
 */
interface MiningEvent {
  type: string;
  data?: Record<string, unknown>;
}

export class ConditionChecker {
  private lastCheckedTimes: Map<string, number> = new Map();

  /**
   * Mining manager reference for checking mining-related conditions
   * This will be used in future implementations to:
   * 1. Check resource extraction rates for mining ships
   * 2. Verify mining ship assignments to resource nodes
   * 3. Optimize mining operations based on automation rules
   * 4. Trigger mining ship reassignments when conditions are met
   * 5. Monitor mining efficiency and adjust strategies
   */
  private _miningManager?: MiningShipManagerImpl;

  constructor(_miningManager?: MiningShipManagerImpl) {
    this._miningManager = _miningManager;

    // Subscribe to threshold events
    thresholdEvents.subscribe(event => {
      if (event.type === 'THRESHOLD_VIOLATED' || event.type === 'STORAGE_FULL') {
        conditionState.next({
          resourceId: event.resourceId,
          currentAmount: event.details?.current || 0,
          thresholds: {
            min: event.details?.min || 0,
            max: event.details?.max || Infinity,
          },
        });
      }
    });
  }

  /**
   * Get a unique key for a condition to track its state
   */
  private getConditionKey(condition: AutomationCondition): string {
    return `${condition.type}-${condition.target || 'global'}-${JSON.stringify(condition.value)}`;
  }

  /**
   * Check if a condition is met
   */
  public async checkCondition(condition: AutomationCondition): Promise<boolean> {
    const now = Date.now();
    const key = this.getConditionKey(condition);
    const lastChecked = this.lastCheckedTimes.get(key) || 0;

    // Implement debounce mechanism to prevent checking conditions too frequently
    const debounceTime = 100; // 100ms debounce
    if (now - lastChecked < debounceTime) {
      console.warn(`Condition ${key} checked too recently, skipping`);
      // Return the last result for debounced conditions
      return false;
    }

    // Update last checked time
    this.lastCheckedTimes.set(key, now);

    // Check condition based on type
    let result = false;

    switch (condition.type) {
      case 'MODULE_ACTIVE':
      case 'MODULE_INACTIVE':
        result = this.checkModuleCondition(condition);
        break;
      case 'TIME_ELAPSED':
        // Use the isTimeCondition type guard to ensure type safety
        if (isTimeCondition(condition)) {
          result = this.checkTimeCondition(condition);
        }
        break;
      case 'EVENT_OCCURRED':
        result = this.checkEventCondition(condition);
        break;
      case 'STATUS_EQUALS':
        // Use the isStatusCondition type guard to ensure type safety
        if (isStatusCondition(condition)) {
          result = this.checkStatusCondition(condition);
        }
        break;
      case 'RESOURCE_ABOVE':
      case 'RESOURCE_BELOW':
        result = this.checkResourceCondition(condition);
        break;
      default:
        console.warn(`Unknown condition type: ${condition.type as string}`);
    }

    return result;
  }

  /**
   * Check if a module condition is met
   */
  private checkModuleCondition(condition: AutomationCondition): boolean {
    if (!condition.target) {
      return false;
    }

    const module = moduleManager.getModule(condition.target);
    if (!module) {
      return false;
    }

    const isActive = module.status === 'active';
    return condition.type === 'MODULE_ACTIVE' ? isActive : !isActive;
  }

  /**
   * Check if a time condition is met
   */
  private checkTimeCondition(condition: AutomationCondition): boolean {
    const timeValue = getTimeValue(condition);
    if (timeValue <= 0) {
      return false;
    }

    // For time conditions, we check if enough time has passed since the last check
    const now = Date.now();
    const key = this.getConditionKey(condition);
    const lastChecked = this.lastCheckedTimes.get(key) || 0;
    const elapsed = now - lastChecked;

    return elapsed >= timeValue;
  }

  /**
   * Check if an event condition is met
   */
  private checkEventCondition(condition: AutomationCondition): boolean {
    // Use the condition parameter to check if the event matches the condition
    if (!condition.value) {
      return false;
    }

    // Extract event type and data from condition value
    // Cast to unknown first to avoid type errors
    const conditionValue = condition.value as unknown;
    const eventValue = conditionValue as EventConditionValue;
    const { eventType, eventData } = eventValue;

    // Check if this is a mining-related event and use _miningManager if available
    if (this._miningManager && typeof eventType === 'string' && eventType.includes('mining')) {
      // Check mining-specific events using the mining manager
      // Use type assertion to access potential getRecentEvents method
      const miningManagerWithEvents = this._miningManager as unknown as {
        getRecentEvents?: () => MiningEvent[];
      };

      // If getRecentEvents exists, use it; otherwise, return an empty array
      const miningEvents = miningManagerWithEvents.getRecentEvents?.() || [];

      return miningEvents.some(
        (event: MiningEvent) =>
          event.type === eventType &&
          (!eventData || this.matchEventData(event.data || {}, eventData))
      );
    }

    // For non-mining events, check the general event log
    // This is a placeholder for future implementation
    return false;
  }

  /**
   * Helper method to match event data with condition data
   */
  private matchEventData(
    eventData: Record<string, unknown>,
    conditionData: Record<string, unknown>
  ): boolean {
    // Check if all condition data properties match the event data
    return Object.entries(conditionData).every(([key, value]) => eventData[key] === value);
  }

  /**
   * Check if a status condition is met
   */
  private checkStatusCondition(condition: AutomationCondition): boolean {
    if (!condition.target) {
      return false;
    }

    const statusValue = getStatusValue(condition);
    if (!statusValue) {
      return false;
    }

    // Get the current status of the target
    const module = moduleManager.getModule(condition.target);
    if (!module) {
      return false;
    }

    return module.status === statusValue;
  }

  /**
   * Check if a resource condition is met
   */
  private checkResourceCondition(condition: AutomationCondition): boolean {
    if (!condition.target) {
      return false;
    }

    // Get the current amount of the resource
    const resourceType = condition.target as ResourceType;
    const currentAmount = resourceManager.getResourceAmount(resourceType);

    // Get the threshold value
    const thresholdValue =
      typeof condition.value === 'number'
        ? condition.value
        : typeof condition.value === 'object' && 'amount' in condition.value
          ? (condition.value as { amount: number }).amount
          : 0;

    // Check if the condition is met
    return condition.type === 'RESOURCE_ABOVE'
      ? currentAmount > thresholdValue
      : currentAmount < thresholdValue;
  }

  /**
   * Check if all conditions are met
   */
  public async checkConditions(conditions: AutomationCondition[]): Promise<boolean> {
    if (!conditions.length) {
      return true;
    }

    // Check each condition
    for (const condition of conditions) {
      const result = await this.checkCondition(condition);
      if (!result) {
        return false;
      }
    }

    return true;
  }

  /**
   * Reset a condition's state
   */
  public resetCondition(condition: AutomationCondition): void {
    const key = this.getConditionKey(condition);
    this.lastCheckedTimes.delete(key);
  }
}

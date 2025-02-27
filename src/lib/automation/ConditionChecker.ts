import { AutomationCondition } from '../../managers/game/AutomationManager';
import { moduleManager } from '../../managers/module/ModuleManager';
import { thresholdEvents } from '../../contexts/ThresholdTypes';
import { Subject } from 'rxjs';
import { MiningShipManagerImpl } from '../../managers/mining/MiningShipManagerImpl';

// Create a subject to handle condition state
const conditionState = new Subject<{
  resourceId: string;
  currentAmount: number;
  thresholds: { min: number; max: number };
}>();

/**
 * Extended condition type with runtime state
 */
interface RuntimeCondition extends AutomationCondition {
  lastChecked?: number;
}

export class ConditionChecker {
  private lastCheckedTimes: Map<string, number> = new Map();
  private miningManager?: MiningShipManagerImpl;

  constructor(miningManager?: MiningShipManagerImpl) {
    this.miningManager = miningManager;

    // Subscribe to threshold events
    thresholdEvents.subscribe(event => {
      if (event.type === 'THRESHOLD_VIOLATED' || event.type === 'STORAGE_FULL') {
        conditionState.next({
          resourceId: event.resourceId,
          currentAmount: event.details.current,
          thresholds: {
            min: event.details.min || 0,
            max: event.details.max || Infinity,
          },
        });
      }
    });
  }

  private getConditionKey(condition: AutomationCondition): string {
    return `${condition.type}-${condition.target || ''}-${condition.value || ''}-${condition.operator || ''}`;
  }

  /**
   * Checks if a condition is met
   */
  public async checkCondition(condition: AutomationCondition): Promise<boolean> {
    switch (condition.type) {
      case 'RESOURCE_ABOVE':
      case 'RESOURCE_BELOW':
        return new Promise(resolve => {
          const subscription = conditionState.subscribe(state => {
            if (state.resourceId === condition.target) {
              const threshold = Number(condition.value);
              const result =
                condition.type === 'RESOURCE_ABOVE'
                  ? state.currentAmount > threshold
                  : state.currentAmount < threshold;
              subscription.unsubscribe();
              resolve(result);
            }
          });

          // Timeout after 1 second
          setTimeout(() => {
            subscription.unsubscribe();
            resolve(false);
          }, 1000);
        });

      case 'MODULE_ACTIVE':
      case 'MODULE_INACTIVE':
        return this.checkModuleCondition(condition);

      case 'TIME_ELAPSED':
        return this.checkTimeCondition(condition);

      case 'EVENT_OCCURRED':
        return this.checkEventCondition(condition);

      case 'STATUS_EQUALS':
        return this.checkStatusCondition(condition);

      default:
        console.warn(`Unknown condition type: ${condition.type}`);
        return false;
    }
  }

  /**
   * Checks a module-based condition
   */
  private checkModuleCondition(condition: AutomationCondition): boolean {
    if (!condition.target) {
      return false;
    }

    const module = moduleManager.getModule(condition.target);
    if (!module) {
      return false;
    }

    if (condition.type === 'MODULE_ACTIVE') {
      return module.isActive;
    } else {
      return !module.isActive;
    }
  }

  /**
   * Checks a time-based condition
   */
  private checkTimeCondition(condition: AutomationCondition): boolean {
    if (!condition.value) {
      return false;
    }

    const now = Date.now();
    const key = this.getConditionKey(condition);
    const lastChecked = this.lastCheckedTimes.get(key) || 0;
    const elapsed = now - lastChecked;

    // Update last checked time
    this.lastCheckedTimes.set(key, now);

    if (condition.operator === 'greater') {
      return elapsed > condition.value;
    } else if (condition.operator === 'less') {
      return elapsed < condition.value;
    }

    return elapsed >= Number(condition.value);
  }

  /**
   * Checks an event-based condition
   */
  private checkEventCondition(condition: AutomationCondition): boolean {
    // TODO: Implement event checking using moduleEventBus
    return false;
  }

  /**
   * Checks a status-based condition
   */
  private checkStatusCondition(condition: AutomationCondition): boolean {
    if (!condition.target || !condition.value) {
      return false;
    }

    const module = moduleManager.getModule(condition.target);
    if (!module) {
      return false;
    }

    // Get module status from metadata
    const status = (module as any).metadata?.status;
    if (!status) {
      return false;
    }

    switch (condition.operator) {
      case 'equals':
        return status === condition.value;
      case 'not_equals':
        return status !== condition.value;
      case 'contains':
        return status.includes(String(condition.value));
      default:
        return false;
    }
  }

  /**
   * Checks if all conditions in a set are met
   */
  public async checkConditions(conditions: AutomationCondition[]): Promise<boolean> {
    try {
      const results = await Promise.all(conditions.map(condition => this.checkCondition(condition)));
      return results.every(result => result);
    } catch (error) {
      console.error('Error checking conditions:', error);
      return false;
    }
  }

  /**
   * Resets a condition's last checked time
   */
  public resetCondition(condition: AutomationCondition): void {
    const key = this.getConditionKey(condition);
    this.lastCheckedTimes.delete(key);
  }
}


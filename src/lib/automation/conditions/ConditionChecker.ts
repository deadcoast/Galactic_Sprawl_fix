import { AutomationCondition } from '../AutomationManager';
import { moduleManager } from '../../modules/ModuleManager';
import { thresholdEvents } from '../../../contexts/ThresholdTypes';
import { Subject } from 'rxjs';

// Create a subject to handle condition state
const conditionState = new Subject<{
  resourceId: string;
  currentAmount: number;
  thresholds: { min: number; max: number };
}>();

// Store last checked times for time-based conditions
const lastCheckedTimes = new Map<string, number>();

// Helper to generate a unique key for a condition
function getConditionKey(condition: AutomationCondition): string {
  return `${condition.type}:${condition.target || ''}:${condition.value || ''}`;
}

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

/**
 * Extended condition type with runtime state
 */
interface RuntimeCondition extends AutomationCondition {
  lastChecked?: number;
}

/**
 * Checks if a condition is met
 */
export async function checkCondition(condition: AutomationCondition): Promise<boolean> {
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
      return checkModuleCondition(condition);

    case 'TIME_ELAPSED':
      return checkTimeCondition(condition);

    case 'EVENT_OCCURRED':
      return checkEventCondition(condition);

    case 'STATUS_EQUALS':
      return checkStatusCondition(condition);

    default:
      console.warn(`Unknown condition type: ${condition.type}`);
      return false;
  }
}

/**
 * Checks a module-based condition
 */
function checkModuleCondition(condition: AutomationCondition): boolean {
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
function checkTimeCondition(condition: AutomationCondition): boolean {
  if (!condition.value) {
    return false;
  }

  const now = Date.now();
  const conditionKey = getConditionKey(condition);
  const lastRun = lastCheckedTimes.get(conditionKey) || 0;
  const elapsed = now - lastRun;

  // Update last checked time
  lastCheckedTimes.set(conditionKey, now);

  return elapsed >= Number(condition.value);
}

/**
 * Checks an event-based condition
 */
function checkEventCondition(condition: AutomationCondition): boolean {
  // TODO: Implement event checking using moduleEventBus
  return false;
}

/**
 * Checks a status-based condition
 */
function checkStatusCondition(condition: AutomationCondition): boolean {
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
export async function checkConditions(conditions: AutomationCondition[]): Promise<boolean> {
  try {
    const results = await Promise.all(conditions.map(checkCondition));
    return results.every(result => result);
  } catch (error) {
    console.error('Error checking conditions:', error);
    return false;
  }
}

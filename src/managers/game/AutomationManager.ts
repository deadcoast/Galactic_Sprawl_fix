import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { moduleManager } from '../module/ModuleManager';
import { ResourceType } from './../../types/resources/ResourceTypes';
import { ResourceManager } from './ResourceManager';

// Create an instance of ResourceManager
const resourceManager = new ResourceManager();

/**
 * Automation condition types
 */
export type AutomationConditionType =
  | 'RESOURCE_ABOVE'
  | 'RESOURCE_BELOW'
  | 'MODULE_ACTIVE'
  | 'MODULE_INACTIVE'
  | 'TIME_ELAPSED'
  | 'EVENT_OCCURRED'
  | 'STATUS_EQUALS'
  // New complex condition types
  | 'RESOURCE_RATIO'
  | 'MULTIPLE_RESOURCES'
  | 'COMPLEX_EVENT'
  | 'PERIODIC'
  | 'COMPOUND';

/**
 * Logical operators for compound conditions
 */
export type LogicalOperator = 'AND' | 'OR' | 'NOT';

/**
 * Automation action types
 */
export type AutomationActionType =
  | 'ACTIVATE_MODULE'
  | 'DEACTIVATE_MODULE'
  | 'TRANSFER_RESOURCES'
  | 'PRODUCE_RESOURCES'
  | 'CONSUME_RESOURCES'
  | 'UPGRADE_MODULE'
  | 'EMIT_EVENT';

/**
 * Resource threshold configuration
 */
export interface ResourceThreshold {
  type: ResourceType;
  min?: number;
  max?: number;
  target?: number;
}

// Define interfaces for condition value types
export interface ResourceConditionValue {
  amount: number;
}

export interface TimeConditionValue {
  milliseconds: number;
}

export interface EventConditionValue {
  eventType: string;
  eventData?: Record<string, unknown>;
}

export interface StatusConditionValue {
  status: string;
}

// New complex condition value types
export interface ResourceRatioConditionValue {
  resourceA: ResourceType;
  resourceB: ResourceType;
  ratio: number;
}

export interface MultipleResourcesConditionValue {
  resources: Array<{
    resourceType: ResourceType;
    amount: number;
    operator: 'greater' | 'less' | 'equals';
  }>;
  combinationType: LogicalOperator;
}

export interface ComplexEventConditionValue {
  eventSequence: Array<{
    eventType: string;
    eventData?: Record<string, unknown>;
  }>;
  timeWindow: number; // milliseconds
  inOrder: boolean;
}

export interface PeriodicConditionValue {
  intervalType: 'hourly' | 'daily' | 'weekly';
  dayOfWeek?: number; // 0-6, Sunday to Saturday
  hour?: number; // 0-23
  minute?: number; // 0-59
}

export interface CompoundConditionValue {
  conditions: AutomationCondition[];
  operator: LogicalOperator;
}

// Define interfaces for action value types
export interface TransferResourcesValue {
  from: string;
  to: string;
  amount: number;
  type: ResourceType;
}

export interface ResourceActionValue {
  amount: number;
}

export interface EmitEventValue {
  moduleId: string;
  moduleType: string;
  eventType: ModuleEventType;
  data?: Record<string, unknown>;
}

/**
 * Automation condition configuration
 */
export interface AutomationCondition {
  type: AutomationConditionType;
  target?: string;
  value?:
    | ResourceConditionValue
    | TimeConditionValue
    | EventConditionValue
    | StatusConditionValue
    // New complex condition value types
    | ResourceRatioConditionValue
    | MultipleResourcesConditionValue
    | ComplexEventConditionValue
    | PeriodicConditionValue
    | CompoundConditionValue
    | number;
  operator?: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains';
  id?: string; // Unique identifier for referencing in action chains
}

/**
 * Automation action configuration
 */
export interface AutomationAction {
  type: AutomationActionType;
  target?: string;
  value?: TransferResourcesValue | ResourceActionValue | EmitEventValue | number | string;
  delay?: number;
  id?: string; // Unique identifier for the action
  // Action chaining properties
  nextActions?: AutomationAction[]; // Actions to execute after this one completes
  conditionId?: string; // Optional condition ID to check before executing next actions
  onSuccess?: AutomationAction[]; // Actions to execute if this action succeeds
  onFailure?: AutomationAction[]; // Actions to execute if this action fails
}

/**
 * Automation rule configuration
 */
export interface AutomationRule {
  id: string;
  moduleId: string;
  name: string;
  enabled: boolean;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  interval: number;
  lastRun?: number;
}

/**
 * Manages module automation
 */
export class AutomationManager {
  private rules: Map<string, AutomationRule>;
  private intervals: Map<string, NodeJS.Timeout>;

  constructor() {
    this.rules = new Map();
    this.intervals = new Map();

    // Listen for module events
    moduleEventBus.subscribe('MODULE_ACTIVATED', this.handleModuleActivation);
    moduleEventBus.subscribe('MODULE_DEACTIVATED', this.handleModuleDeactivation);
  }

  /**
   * Registers a new automation rule
   */
  registerRule(rule: AutomationRule): void {
    this.rules.set(rule.id, rule);
    if (rule.enabled) {
      this.startRule(rule.id);
    }
  }

  /**
   * Starts an automation rule
   */
  startRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) {
      return;
    }

    // Clear existing interval
    this.stopRule(ruleId);

    // Create new interval
    const interval = setInterval(() => {
      this.executeRule(rule);
    }, rule.interval);

    this.intervals.set(ruleId, interval);

    // Get module type
    const module = moduleManager.getModule(rule.moduleId);

    // Emit automation started event
    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED',
      moduleId: rule.moduleId,
      moduleType: module?.type || 'radar', // Default to radar as it's a valid type
      timestamp: Date.now(),
      data: { ruleId, rule },
    });
  }

  /**
   * Stops an automation rule
   */
  stopRule(ruleId: string): void {
    const interval = this.intervals.get(ruleId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(ruleId);

      const rule = this.rules.get(ruleId);
      if (rule) {
        const module = moduleManager.getModule(rule.moduleId);
        moduleEventBus.emit({
          type: 'AUTOMATION_STOPPED',
          moduleId: rule.moduleId,
          moduleType: module?.type || 'radar',
          timestamp: Date.now(),
          data: { ruleId, rule },
        });
      }
    }
  }

  /**
   * Executes an automation rule
   */
  private async executeRule(rule: AutomationRule): Promise<void> {
    try {
      // Check conditions
      const conditionsMet = await this.checkConditions(rule.conditions);
      if (!conditionsMet) {
        return;
      }

      // Execute actions
      await this.executeActions(rule.actions);

      // Update last run time
      rule.lastRun = Date.now();

      // Get module type
      const module = moduleManager.getModule(rule.moduleId);

      // Emit cycle complete event
      moduleEventBus.emit({
        type: 'AUTOMATION_CYCLE_COMPLETE',
        moduleId: rule.moduleId,
        moduleType: module?.type || 'radar',
        timestamp: Date.now(),
        data: { ruleId: rule.id, rule },
      });
    } catch (error) {
      console.error('Error executing automation rule:', error);
      const module = moduleManager.getModule(rule.moduleId);
      moduleEventBus.emit({
        type: 'ERROR_OCCURRED',
        moduleId: rule.moduleId,
        moduleType: module?.type || 'radar',
        timestamp: Date.now(),
        data: { ruleId: rule.id, error },
      });
    }
  }

  /**
   * Executes a series of automation actions
   */
  private async executeActions(actions: AutomationAction[]): Promise<void> {
    for (const action of actions) {
      try {
        // Execute the current action
        const success = await this.executeSingleAction(action);

        // Handle chaining based on success/failure
        if (success) {
          // Execute onSuccess actions if they exist
          if (action.onSuccess && action.onSuccess.length > 0) {
            await this.executeActions(action.onSuccess);
          }
        } else if (action.onFailure && action.onFailure.length > 0) {
          await this.executeActions(action.onFailure);
        }

        // Handle conditional next actions
        if (action.nextActions && action.nextActions.length > 0) {
          // If conditionId is specified, check that condition first
          if (action.conditionId) {
            // Find the condition with matching ID
            const condition = this.findConditionById(action.conditionId);
            if (condition && (await this.checkCondition(condition))) {
              await this.executeActions(action.nextActions);
            }
          } else {
            // No condition check needed, execute next actions
            await this.executeActions(action.nextActions);
          }
        }

        // Apply delay if specified
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }
      } catch (error) {
        console.warn(`Error executing action ${action.type}:`, error);

        // Execute onFailure actions if they exist
        if (action.onFailure && action.onFailure.length > 0) {
          await this.executeActions(action.onFailure);
        }
      }
    }
  }

  /**
   * Executes a single automation action
   */
  private async executeSingleAction(action: AutomationAction): Promise<boolean> {
    try {
      switch (action.type) {
        case 'ACTIVATE_MODULE':
          if (!action.target) {
            return false;
          }
          moduleManager.setModuleActive(action.target, true);
          return true;

        case 'DEACTIVATE_MODULE':
          if (!action.target) {
            return false;
          }
          moduleManager.setModuleActive(action.target, false);
          return true;

        case 'TRANSFER_RESOURCES': {
          if (!action.target || !action.value) {
            return false;
          }
          const transferValue = action.value as TransferResourcesValue;
          const result = resourceManager.transferResources(
            transferValue.type,
            transferValue.amount,
            transferValue.from,
            transferValue.to
          );

          // Handle both boolean and object with success property return types
          if (typeof result === 'object' && result !== null) {
            // Use type assertion to tell TypeScript this object has a success property
            const resultObj = result as { success: boolean };
            return Boolean(resultObj.success);
          }
          // Default to the boolean result
          return Boolean(result);
        }

        case 'PRODUCE_RESOURCES': {
          if (!action.target || !action.value) {
            return false;
          }
          const produceAmount =
            typeof action.value === 'number'
              ? action.value
              : (action.value as ResourceActionValue).amount;
          resourceManager.addResource(action.target as ResourceType, produceAmount);
          return true;
        }

        case 'CONSUME_RESOURCES': {
          if (!action.target || !action.value) {
            return false;
          }
          const consumeAmount =
            typeof action.value === 'number'
              ? action.value
              : (action.value as ResourceActionValue).amount;
          try {
            resourceManager.removeResource(action.target as ResourceType, consumeAmount);
            return true;
          } catch (error) {
            console.warn(`Failed to consume resource: ${error}`);
            return false;
          }
        }

        case 'UPGRADE_MODULE':
          if (!action.target) {
            return false;
          }
          try {
            moduleManager.upgradeModule(action.target);
            return true;
          } catch (error) {
            console.warn(`Failed to upgrade module: ${error}`);
            return false;
          }

        case 'EMIT_EVENT': {
          if (!action.target || !action.value) {
            return false;
          }
          const emitValue = action.value as EmitEventValue;
          moduleEventBus.emit({
            type: action.target as ModuleEventType,
            moduleId: emitValue.moduleId,
            moduleType: emitValue.moduleType as ModuleType,
            timestamp: Date.now(),
            data: emitValue.data,
          });
          return true;
        }

        default:
          return false;
      }
    } catch (error) {
      console.warn(`Error in executeSingleAction (${action.type}):`, error);
      return false;
    }
  }

  /**
   * Find a condition by its ID
   */
  private findConditionById(conditionId: string): AutomationCondition | undefined {
    for (const rule of this.rules.values()) {
      for (const condition of rule.conditions) {
        if (condition.id === conditionId) {
          return condition;
        }
      }
    }
    return undefined;
  }

  /**
   * Check a single condition
   */
  private async checkCondition(condition: AutomationCondition): Promise<boolean> {
    try {
      switch (condition.type) {
        case 'RESOURCE_ABOVE': {
          if (!condition.target || !condition.value) {
            return false;
          }
          const currentAmount = resourceManager.getResourceAmount(condition.target as ResourceType);
          const threshold =
            typeof condition.value === 'number'
              ? condition.value
              : (condition.value as ResourceConditionValue).amount;
          if (currentAmount <= threshold) {
            return false;
          }
          return true;
        }

        case 'RESOURCE_BELOW': {
          if (!condition.target || !condition.value) {
            return false;
          }
          const amount = resourceManager.getResourceAmount(condition.target as ResourceType);
          const threshold =
            typeof condition.value === 'number'
              ? condition.value
              : (condition.value as ResourceConditionValue).amount;
          if (amount >= threshold) {
            return false;
          }
          return true;
        }

        case 'MODULE_ACTIVE': {
          if (!condition.target) {
            return false;
          }
          const module = moduleManager.getModule(condition.target);
          if (!module?.isActive) {
            return false;
          }
          return true;
        }

        case 'MODULE_INACTIVE': {
          if (!condition.target) {
            return false;
          }
          const inactiveModule = moduleManager.getModule(condition.target);
          if (inactiveModule?.isActive) {
            return false;
          }
          return true;
        }

        case 'TIME_ELAPSED': {
          if (!condition.value) {
            return false;
          }
          const now = Date.now();
          const elapsed =
            typeof condition.value === 'number'
              ? condition.value
              : (condition.value as TimeConditionValue).milliseconds;
          if (now - (condition.target ? parseInt(condition.target) : 0) < elapsed) {
            return false;
          }
          return true;
        }

        case 'EVENT_OCCURRED':
          if (!condition.target || !condition.value) {
            return false;
          }
          // Check event history (assuming we have an eventManager)
          // Since we don't have eventManager yet, we'll skip this check
          return true;

        case 'STATUS_EQUALS': {
          if (!condition.target || !condition.value) {
            return false;
          }
          const targetModule = moduleManager.getModule(condition.target);

          // Extract the status string from the condition value
          const statusValue =
            typeof condition.value === 'string'
              ? condition.value
              : (condition.value as StatusConditionValue).status;

          if (!targetModule || targetModule.status !== statusValue) {
            return false;
          }
          return true;
        }

        // New cases for complex condition types
        case 'RESOURCE_RATIO': {
          if (!condition.value) {
            return false;
          }
          const ratioValue = condition.value as ResourceRatioConditionValue;
          const resourceAAmount = resourceManager.getResourceAmount(ratioValue.resourceA);
          const resourceBAmount = resourceManager.getResourceAmount(ratioValue.resourceB);

          // Avoid division by zero
          if (resourceBAmount === 0) {
            return false;
          }

          const actualRatio = resourceAAmount / resourceBAmount;

          if (condition.operator === 'greater') {
            return actualRatio > ratioValue.ratio;
          } else if (condition.operator === 'less') {
            return actualRatio < ratioValue.ratio;
          } else {
            // Default to equals
            return Math.abs(actualRatio - ratioValue.ratio) < 0.01; // With small epsilon for float comparison
          }
        }

        case 'MULTIPLE_RESOURCES': {
          if (!condition.value) {
            return false;
          }
          const multipleResourcesValue = condition.value as MultipleResourcesConditionValue;
          const results: boolean[] = [];

          for (const resource of multipleResourcesValue.resources) {
            const amount = resourceManager.getResourceAmount(resource.resourceType);
            let result = false;

            if (resource.operator === 'greater') {
              result = amount > resource.amount;
            } else if (resource.operator === 'less') {
              result = amount < resource.amount;
            } else {
              result = amount === resource.amount;
            }

            results.push(result);
          }

          if (multipleResourcesValue.combinationType === 'AND') {
            return results.every(result => result);
          } else if (multipleResourcesValue.combinationType === 'OR') {
            return results.some(result => result);
          } else {
            // NOT
            return !results.some(result => result);
          }
        }

        case 'COMPLEX_EVENT': {
          // This would require event history tracking
          // For now, return false as a placeholder
          console.warn('COMPLEX_EVENT condition type not fully implemented');
          return false;
        }

        case 'PERIODIC': {
          if (!condition.value) {
            return false;
          }
          const periodicValue = condition.value as PeriodicConditionValue;
          const now = new Date();

          // Check if current time matches the periodic condition
          switch (periodicValue.intervalType) {
            case 'hourly':
              return (
                periodicValue.minute === undefined || now.getMinutes() === periodicValue.minute
              );

            case 'daily':
              return (
                (periodicValue.hour === undefined || now.getHours() === periodicValue.hour) &&
                (periodicValue.minute === undefined || now.getMinutes() === periodicValue.minute)
              );

            case 'weekly':
              return (
                (periodicValue.dayOfWeek === undefined ||
                  now.getDay() === periodicValue.dayOfWeek) &&
                (periodicValue.hour === undefined || now.getHours() === periodicValue.hour) &&
                (periodicValue.minute === undefined || now.getMinutes() === periodicValue.minute)
              );

            default:
              return false;
          }
        }

        case 'COMPOUND': {
          if (!condition.value) {
            return false;
          }
          const compoundValue = condition.value as CompoundConditionValue;
          const results = await Promise.all(
            compoundValue.conditions.map(c => this.checkCondition(c))
          );

          if (compoundValue.operator === 'AND') {
            return results.every(result => result);
          } else if (compoundValue.operator === 'OR') {
            return results.some(result => result);
          } else {
            // NOT
            return !results.some(result => result);
          }
        }

        default:
          return false;
      }
    } catch (error) {
      console.warn(`Error checking condition (${condition.type}):`, error);
      return false;
    }
  }

  /**
   * Checks if all conditions are met
   */
  private async checkConditions(conditions: AutomationCondition[]): Promise<boolean> {
    if (!conditions.length) {
      return true;
    }

    for (const condition of conditions) {
      const result = await this.checkCondition(condition);
      if (!result) {
        return false;
      }
    }

    return true;
  }

  /**
   * Handles module activation
   */
  private handleModuleActivation = (event: ModuleEvent): void => {
    const rules = Array.from(this.rules.values()).filter(rule => rule.moduleId === event?.moduleId);

    rules.forEach(rule => {
      if (rule.enabled) {
        this.startRule(rule.id);
      }
    });
  };

  /**
   * Handles module deactivation
   */
  private handleModuleDeactivation = (event: ModuleEvent): void => {
    const rules = Array.from(this.rules.values()).filter(rule => rule.moduleId === event?.moduleId);

    rules.forEach(rule => {
      this.stopRule(rule.id);
    });
  };

  /**
   * Gets all rules for a module
   */
  getRulesForModule(moduleId: string): AutomationRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.moduleId === moduleId);
  }

  /**
   * Gets a rule by ID
   */
  getRule(ruleId: string): AutomationRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Updates a rule's configuration
   */
  updateRule(ruleId: string, updates: Partial<AutomationRule>): void {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return;
    }

    const wasEnabled = rule.enabled;
    Object.assign(rule, updates);

    // Handle enable/disable changes
    if (wasEnabled !== rule.enabled) {
      if (rule.enabled) {
        this.startRule(ruleId);
      } else {
        this.stopRule(ruleId);
      }
    }
  }

  /**
   * Removes a rule
   */
  removeRule(ruleId: string): void {
    this.stopRule(ruleId);
    this.rules.delete(ruleId);
  }
}

// Export singleton instance
export const automationManager = new AutomationManager();

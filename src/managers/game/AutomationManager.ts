import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { BaseModule, ModuleType } from '../../types/buildings/ModuleTypes';
import { moduleManager } from '../module/ModuleManager';
import { resourceManager } from './ResourceManager';
import { ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ResourceType } from '../../types/resources/ResourceTypes';

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
  | 'STATUS_EQUALS';

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
  type: string;
  min?: number;
  max?: number;
  target?: number;
}

/**
 * Automation condition configuration
 */
export interface AutomationCondition {
  type: AutomationConditionType;
  target?: string;
  value?: any;
  operator?: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains';
}

/**
 * Automation action configuration
 */
export interface AutomationAction {
  type: AutomationActionType;
  target?: string;
  value?: any;
  delay?: number;
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
   * Checks if all conditions are met
   */
  private async checkConditions(conditions: AutomationCondition[]): Promise<boolean> {
    if (!conditions.length) {
      return true;
    }

    for (const condition of conditions) {
      switch (condition.type) {
        case 'RESOURCE_ABOVE':
          if (!condition.target || !condition.value) {
            continue;
          }
          const currentAmount = resourceManager.getResourceAmount(condition.target as ResourceType);
          if (currentAmount <= condition.value) {
            return false;
          }
          break;

        case 'RESOURCE_BELOW':
          if (!condition.target || !condition.value) {
            continue;
          }
          const amount = resourceManager.getResourceAmount(condition.target as ResourceType);
          if (amount >= condition.value) {
            return false;
          }
          break;

        case 'MODULE_ACTIVE':
          if (!condition.target) {
            continue;
          }
          const module = moduleManager.getModule(condition.target);
          if (!module?.isActive) {
            return false;
          }
          break;

        case 'MODULE_INACTIVE':
          if (!condition.target) {
            continue;
          }
          const inactiveModule = moduleManager.getModule(condition.target);
          if (inactiveModule?.isActive) {
            return false;
          }
          break;

        case 'TIME_ELAPSED':
          if (!condition.value) {
            continue;
          }
          const now = Date.now();
          if (now - (condition.target ? parseInt(condition.target) : 0) < condition.value) {
            return false;
          }
          break;

        case 'EVENT_OCCURRED':
          if (!condition.target || !condition.value) {
            continue;
          }
          // Check event history (assuming we have an eventManager)
          // Since we don't have eventManager yet, we'll skip this check
          break;

        case 'STATUS_EQUALS':
          if (!condition.target || !condition.value) {
            continue;
          }
          const targetModule = moduleManager.getModule(condition.target);
          if (!targetModule || targetModule.status !== condition.value) {
            return false;
          }
          break;
      }
    }

    return true;
  }

  /**
   * Executes automation actions
   */
  private async executeActions(actions: AutomationAction[]): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'ACTIVATE_MODULE':
            if (!action.target) {
              continue;
            }
            moduleManager.setModuleActive(action.target, true);
            break;

          case 'DEACTIVATE_MODULE':
            if (!action.target) {
              continue;
            }
            moduleManager.setModuleActive(action.target, false);
            break;

          case 'TRANSFER_RESOURCES':
            if (!action.target || !action.value) {
              continue;
            }
            const { from, to, amount, type } = action.value;
            resourceManager.transferResources(type as ResourceType, amount, from, to);
            break;

          case 'PRODUCE_RESOURCES':
            if (!action.target || !action.value) {
              continue;
            }
            resourceManager.addResource(action.target as ResourceType, action.value);
            break;

          case 'CONSUME_RESOURCES':
            if (!action.target || !action.value) {
              continue;
            }
            resourceManager.removeResource(action.target as ResourceType, action.value);
            break;

          case 'UPGRADE_MODULE':
            if (!action.target) {
              continue;
            }
            moduleManager.upgradeModule(action.target);
            break;

          case 'EMIT_EVENT':
            if (!action.target || !action.value) {
              continue;
            }
            moduleEventBus.emit({
              type: action.target as ModuleEventType,
              moduleId: action.value.moduleId,
              moduleType: action.value.moduleType,
              timestamp: Date.now(),
              data: action.value.data,
            });
            break;
        }

        // Apply delay if specified
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
        // Continue with next action even if one fails
      }
    }
  }

  /**
   * Handles module activation
   */
  private handleModuleActivation = (event: any): void => {
    const rules = Array.from(this.rules.values()).filter(rule => rule.moduleId === event.moduleId);

    rules.forEach(rule => {
      if (rule.enabled) {
        this.startRule(rule.id);
      }
    });
  };

  /**
   * Handles module deactivation
   */
  private handleModuleDeactivation = (event: any): void => {
    const rules = Array.from(this.rules.values()).filter(rule => rule.moduleId === event.moduleId);

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

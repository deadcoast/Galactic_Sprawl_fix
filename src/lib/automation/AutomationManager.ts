import { moduleEventBus } from '../modules/ModuleEvents';
import { BaseModule, ModuleType } from '../../types/buildings/ModuleTypes';
import { moduleManager } from '../modules/ModuleManager';

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
    // TODO: Implement condition checking
    return true;
  }

  /**
   * Executes automation actions
   */
  private async executeActions(actions: AutomationAction[]): Promise<void> {
    // TODO: Implement action execution
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

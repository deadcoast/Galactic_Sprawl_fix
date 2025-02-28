import { useState, useEffect, useCallback } from 'react';
import { BaseModule, ModuleType } from '../../types/buildings/ModuleTypes';
import { moduleManager } from '../../managers/module/ModuleManager';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { resourceManager } from '../../managers/game/ResourceManager';
import { ResourceType } from '../../types/resources/ResourceTypes';

/**
 * Automation rule types
 */
export type AutomationRuleType = 
  | 'resource-threshold'
  | 'time-based'
  | 'status-based'
  | 'event-based'
  | 'custom';

/**
 * Base automation rule interface
 */
export interface AutomationRule {
  id: string;
  name: string;
  type: AutomationRuleType;
  moduleId: string;
  enabled: boolean;
  action: 'activate' | 'deactivate' | 'upgrade' | 'custom';
  customAction?: (moduleId: string) => void;
  cooldown?: number;
  lastTriggered?: number;
}

/**
 * Resource threshold rule
 */
export interface ResourceThresholdRule extends AutomationRule {
  type: 'resource-threshold';
  resourceType: ResourceType;
  threshold: number;
  comparison: 'above' | 'below' | 'equal';
}

/**
 * Time-based rule
 */
export interface TimeBasedRule extends AutomationRule {
  type: 'time-based';
  interval: number;
  startTime?: number;
  endTime?: number;
}

/**
 * Status-based rule
 */
export interface StatusBasedRule extends AutomationRule {
  type: 'status-based';
  targetStatus: 'active' | 'inactive' | 'constructing';
  triggerStatus: 'active' | 'inactive' | 'constructing';
  targetModuleId?: string;
}

/**
 * Event-based rule
 */
export interface EventBasedRule extends AutomationRule {
  type: 'event-based';
  eventType: ModuleEventType;
  eventFilter?: (event: any) => boolean;
}

/**
 * Custom rule
 */
export interface CustomRule extends AutomationRule {
  type: 'custom';
  condition: (moduleId: string) => boolean;
}

/**
 * Automation rule union type
 */
export type AutomationRuleUnion = 
  | ResourceThresholdRule
  | TimeBasedRule
  | StatusBasedRule
  | EventBasedRule
  | CustomRule;

/**
 * Automation state
 */
export interface AutomationState {
  enabled: boolean;
  rules: AutomationRuleUnion[];
  activeTimers: Map<string, NodeJS.Timeout>;
  lastCheck: number;
  checkInterval: number;
}

/**
 * Hook for module automation
 * Allows modules to be automated based on rules and conditions
 */
export function useModuleAutomation(
  initialRules: AutomationRuleUnion[] = [],
  checkInterval = 1000
) {
  const [state, setState] = useState<AutomationState>({
    enabled: false,
    rules: initialRules,
    activeTimers: new Map(),
    lastCheck: Date.now(),
    checkInterval
  });

  /**
   * Add a rule
   */
  const addRule = useCallback((rule: AutomationRuleUnion) => {
    setState(prevState => ({
      ...prevState,
      rules: [...prevState.rules, rule]
    }));
  }, []);

  /**
   * Remove a rule
   */
  const removeRule = useCallback((ruleId: string) => {
    setState(prevState => ({
      ...prevState,
      rules: prevState.rules.filter(rule => rule.id !== ruleId)
    }));
  }, []);

  /**
   * Enable a rule
   */
  const enableRule = useCallback((ruleId: string) => {
    setState(prevState => ({
      ...prevState,
      rules: prevState.rules.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: true } : rule
      )
    }));
  }, []);

  /**
   * Disable a rule
   */
  const disableRule = useCallback((ruleId: string) => {
    setState(prevState => ({
      ...prevState,
      rules: prevState.rules.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: false } : rule
      )
    }));
  }, []);

  /**
   * Enable automation
   */
  const enableAutomation = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      enabled: true
    }));

    // Emit event
    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED' as ModuleEventType,
      moduleId: 'automation',
      moduleType: 'resource-manager' as ModuleType,
      timestamp: Date.now(),
      data: { ruleCount: state.rules.length }
    });
  }, [state.rules.length]);

  /**
   * Disable automation
   */
  const disableAutomation = useCallback(() => {
    setState(prevState => {
      // Clear all active timers
      prevState.activeTimers.forEach(timer => clearTimeout(timer));
      
      return {
        ...prevState,
        enabled: false,
        activeTimers: new Map()
      };
    });

    // Emit event
    moduleEventBus.emit({
      type: 'AUTOMATION_STOPPED' as ModuleEventType,
      moduleId: 'automation',
      moduleType: 'resource-manager' as ModuleType,
      timestamp: Date.now(),
      data: { ruleCount: state.rules.length }
    });
  }, [state.rules.length]);

  /**
   * Check if a rule is on cooldown
   */
  const isRuleOnCooldown = useCallback((rule: AutomationRuleUnion): boolean => {
    if (!rule.cooldown || !rule.lastTriggered) {
      return false;
    }

    const now = Date.now();
    return now - rule.lastTriggered < rule.cooldown;
  }, []);

  /**
   * Execute a rule's action
   */
  const executeRuleAction = useCallback((rule: AutomationRuleUnion) => {
    // Skip if rule is on cooldown
    if (isRuleOnCooldown(rule)) {
      return;
    }

    // Get the module
    const module = moduleManager.getModule(rule.moduleId);
    if (!module) {
      console.error(`[ModuleAutomation] Module ${rule.moduleId} not found`);
      return;
    }

    // Execute the action
    switch (rule.action) {
      case 'activate':
        if (!module.isActive) {
          moduleManager.setModuleActive(rule.moduleId, true);
        }
        break;
      case 'deactivate':
        if (module.isActive) {
          moduleManager.setModuleActive(rule.moduleId, false);
        }
        break;
      case 'upgrade':
        moduleManager.upgradeModule(rule.moduleId);
        break;
      case 'custom':
        if (rule.customAction) {
          rule.customAction(rule.moduleId);
        }
        break;
    }

    // Update last triggered time
    setState(prevState => ({
      ...prevState,
      rules: prevState.rules.map(r => 
        r.id === rule.id ? { ...r, lastTriggered: Date.now() } : r
      )
    }));
  }, [isRuleOnCooldown]);

  /**
   * Check a resource threshold rule
   */
  const checkResourceThresholdRule = useCallback((rule: ResourceThresholdRule): boolean => {
    const { resourceType, threshold, comparison } = rule;
    const currentAmount = resourceManager.getResourceAmount(resourceType);

    switch (comparison) {
      case 'above':
        return currentAmount > threshold;
      case 'below':
        return currentAmount < threshold;
      case 'equal':
        return currentAmount === threshold;
      default:
        return false;
    }
  }, []);

  /**
   * Check a time-based rule
   */
  const checkTimeBasedRule = useCallback((rule: TimeBasedRule): boolean => {
    const now = Date.now();
    
    // Check if within time window
    if (rule.startTime && rule.endTime) {
      const currentTime = new Date();
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const currentMinutes = hours * 60 + minutes;
      
      // Convert start and end times to minutes
      const startMinutes = Math.floor(rule.startTime / 60);
      const endMinutes = Math.floor(rule.endTime / 60);
      
      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return false;
      }
    }
    
    // Check if interval has passed since last trigger
    if (!rule.lastTriggered) {
      return true;
    }
    
    return now - rule.lastTriggered >= rule.interval;
  }, []);

  /**
   * Check a status-based rule
   */
  const checkStatusBasedRule = useCallback((rule: StatusBasedRule): boolean => {
    const { targetStatus, triggerStatus, targetModuleId } = rule;
    
    // If target module is specified, check its status
    if (targetModuleId) {
      const targetModule = moduleManager.getModule(targetModuleId);
      if (!targetModule) {
        return false;
      }
      
      return targetModule.status === triggerStatus;
    }
    
    // Otherwise, check all modules of the same type
    const module = moduleManager.getModule(rule.moduleId);
    if (!module) {
      return false;
    }
    
    const modulesOfSameType = moduleManager.getModulesByType(module.type);
    return modulesOfSameType.some(m => m.status === triggerStatus);
  }, []);

  /**
   * Check a custom rule
   */
  const checkCustomRule = useCallback((rule: CustomRule): boolean => {
    return rule.condition(rule.moduleId);
  }, []);

  /**
   * Check if a rule's condition is met
   */
  const isRuleConditionMet = useCallback((rule: AutomationRuleUnion): boolean => {
    switch (rule.type) {
      case 'resource-threshold':
        return checkResourceThresholdRule(rule as ResourceThresholdRule);
      case 'time-based':
        return checkTimeBasedRule(rule as TimeBasedRule);
      case 'status-based':
        return checkStatusBasedRule(rule as StatusBasedRule);
      case 'custom':
        return checkCustomRule(rule as CustomRule);
      default:
        return false;
    }
  }, [
    checkResourceThresholdRule,
    checkTimeBasedRule,
    checkStatusBasedRule,
    checkCustomRule
  ]);

  /**
   * Check all rules
   */
  const checkRules = useCallback(() => {
    if (!state.enabled) {
      return;
    }

    const now = Date.now();
    const enabledRules = state.rules.filter(rule => rule.enabled);

    for (const rule of enabledRules) {
      // Skip event-based rules (they're handled separately)
      if (rule.type === 'event-based') {
        continue;
      }

      // Check if rule condition is met
      if (isRuleConditionMet(rule)) {
        executeRuleAction(rule);
      }
    }

    // Update last check time
    setState(prevState => ({
      ...prevState,
      lastCheck: now
    }));

    // Emit cycle complete event
    moduleEventBus.emit({
      type: 'AUTOMATION_CYCLE_COMPLETE' as ModuleEventType,
      moduleId: 'automation',
      moduleType: 'resource-manager' as ModuleType,
      timestamp: now,
      data: { 
        ruleCount: enabledRules.length,
        checkDuration: Date.now() - now
      }
    });
  }, [state.enabled, state.rules, isRuleConditionMet, executeRuleAction]);

  /**
   * Set up event-based rules
   */
  useEffect(() => {
    if (!state.enabled) {
      return;
    }

    const eventHandlers = new Map<string, (event: any) => void>();

    // Set up event handlers for each event-based rule
    state.rules
      .filter(rule => rule.type === 'event-based' && rule.enabled)
      .forEach(rule => {
        const eventRule = rule as EventBasedRule;
        
        const handler = (event: any) => {
          // Skip if rule is on cooldown
          if (isRuleOnCooldown(rule)) {
            return;
          }
          
          // Apply event filter if provided
          if (eventRule.eventFilter && !eventRule.eventFilter(event)) {
            return;
          }
          
          // Execute the rule's action
          executeRuleAction(rule);
        };
        
        // Subscribe to the event
        moduleEventBus.subscribe(eventRule.eventType, handler);
        
        // Store the handler for cleanup
        eventHandlers.set(rule.id, handler);
      });

    // Cleanup function
    return () => {
      // Unsubscribe from all events
      eventHandlers.forEach((handler, ruleId) => {
        const rule = state.rules.find(r => r.id === ruleId) as EventBasedRule;
        if (rule) {
          const unsubscribe = moduleEventBus.subscribe(rule.eventType, handler);
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        }
      });
    };
  }, [state.enabled, state.rules, isRuleOnCooldown, executeRuleAction]);

  /**
   * Set up interval for checking rules
   */
  useEffect(() => {
    if (!state.enabled) {
      return;
    }

    // Set up interval for checking rules
    const intervalId = setInterval(checkRules, state.checkInterval);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }, [state.enabled, state.checkInterval, checkRules]);

  /**
   * Create a resource threshold rule
   */
  const createResourceThresholdRule = useCallback((
    moduleId: string,
    resourceType: ResourceType,
    threshold: number,
    comparison: 'above' | 'below' | 'equal',
    action: 'activate' | 'deactivate' | 'upgrade' | 'custom',
    options?: {
      name?: string;
      enabled?: boolean;
      cooldown?: number;
      customAction?: (moduleId: string) => void;
    }
  ): ResourceThresholdRule => {
    return {
      id: `resource-${moduleId}-${resourceType}-${Date.now()}`,
      name: options?.name || `${resourceType} ${comparison} ${threshold}`,
      type: 'resource-threshold',
      moduleId,
      resourceType,
      threshold,
      comparison,
      action,
      enabled: options?.enabled !== undefined ? options.enabled : true,
      cooldown: options?.cooldown,
      customAction: options?.customAction
    };
  }, []);

  /**
   * Create a time-based rule
   */
  const createTimeBasedRule = useCallback((
    moduleId: string,
    interval: number,
    action: 'activate' | 'deactivate' | 'upgrade' | 'custom',
    options?: {
      name?: string;
      enabled?: boolean;
      cooldown?: number;
      startTime?: number;
      endTime?: number;
      customAction?: (moduleId: string) => void;
    }
  ): TimeBasedRule => {
    return {
      id: `time-${moduleId}-${interval}-${Date.now()}`,
      name: options?.name || `Every ${interval / 1000} seconds`,
      type: 'time-based',
      moduleId,
      interval,
      action,
      enabled: options?.enabled !== undefined ? options.enabled : true,
      cooldown: options?.cooldown,
      startTime: options?.startTime,
      endTime: options?.endTime,
      customAction: options?.customAction
    };
  }, []);

  /**
   * Create a status-based rule
   */
  const createStatusBasedRule = useCallback((
    moduleId: string,
    targetStatus: 'active' | 'inactive' | 'constructing',
    triggerStatus: 'active' | 'inactive' | 'constructing',
    action: 'activate' | 'deactivate' | 'upgrade' | 'custom',
    options?: {
      name?: string;
      enabled?: boolean;
      cooldown?: number;
      targetModuleId?: string;
      customAction?: (moduleId: string) => void;
    }
  ): StatusBasedRule => {
    return {
      id: `status-${moduleId}-${targetStatus}-${Date.now()}`,
      name: options?.name || `When ${triggerStatus}, set to ${targetStatus}`,
      type: 'status-based',
      moduleId,
      targetStatus,
      triggerStatus,
      action,
      enabled: options?.enabled !== undefined ? options.enabled : true,
      cooldown: options?.cooldown,
      targetModuleId: options?.targetModuleId,
      customAction: options?.customAction
    };
  }, []);

  /**
   * Create an event-based rule
   */
  const createEventBasedRule = useCallback((
    moduleId: string,
    eventType: ModuleEventType,
    action: 'activate' | 'deactivate' | 'upgrade' | 'custom',
    options?: {
      name?: string;
      enabled?: boolean;
      cooldown?: number;
      eventFilter?: (event: any) => boolean;
      customAction?: (moduleId: string) => void;
    }
  ): EventBasedRule => {
    return {
      id: `event-${moduleId}-${eventType}-${Date.now()}`,
      name: options?.name || `On ${eventType}`,
      type: 'event-based',
      moduleId,
      eventType,
      action,
      enabled: options?.enabled !== undefined ? options.enabled : true,
      cooldown: options?.cooldown,
      eventFilter: options?.eventFilter,
      customAction: options?.customAction
    };
  }, []);

  /**
   * Create a custom rule
   */
  const createCustomRule = useCallback((
    moduleId: string,
    condition: (moduleId: string) => boolean,
    action: 'activate' | 'deactivate' | 'upgrade' | 'custom',
    options?: {
      name?: string;
      enabled?: boolean;
      cooldown?: number;
      customAction?: (moduleId: string) => void;
    }
  ): CustomRule => {
    return {
      id: `custom-${moduleId}-${Date.now()}`,
      name: options?.name || 'Custom rule',
      type: 'custom',
      moduleId,
      condition,
      action,
      enabled: options?.enabled !== undefined ? options.enabled : true,
      cooldown: options?.cooldown,
      customAction: options?.customAction
    };
  }, []);

  /**
   * Get rules for a specific module
   */
  const getRulesForModule = useCallback((moduleId: string): AutomationRuleUnion[] => {
    return state.rules.filter(rule => rule.moduleId === moduleId);
  }, [state.rules]);

  /**
   * Get rules by type
   */
  const getRulesByType = useCallback((type: AutomationRuleType): AutomationRuleUnion[] => {
    return state.rules.filter(rule => rule.type === type);
  }, [state.rules]);

  /**
   * Get all rules
   */
  const getAllRules = useCallback((): AutomationRuleUnion[] => {
    return [...state.rules];
  }, [state.rules]);

  /**
   * Clean up resources
   */
  const cleanup = useCallback(() => {
    // Disable automation (which clears timers)
    disableAutomation();
    
    // Clear rules
    setState(prevState => ({
      ...prevState,
      rules: []
    }));
  }, [disableAutomation]);

  return {
    // State
    enabled: state.enabled,
    rules: state.rules,
    
    // Rule management
    addRule,
    removeRule,
    enableRule,
    disableRule,
    
    // Automation control
    enableAutomation,
    disableAutomation,
    
    // Rule creation
    createResourceThresholdRule,
    createTimeBasedRule,
    createStatusBasedRule,
    createEventBasedRule,
    createCustomRule,
    
    // Rule queries
    getRulesForModule,
    getRulesByType,
    getAllRules,
    
    // Cleanup
    cleanup
  };
} 
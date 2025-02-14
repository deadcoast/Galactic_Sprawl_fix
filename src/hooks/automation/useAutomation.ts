import { useState, useEffect } from 'react';
import {
  automationManager,
  AutomationRule,
  AutomationCondition,
  AutomationAction,
} from '../../lib/automation/AutomationManager';
import { useModuleEvents } from '../modules/useModuleEvents';

/**
 * Hook to manage automation rules for a module
 */
export function useAutomation(moduleId: string) {
  const [rules, setRules] = useState<AutomationRule[]>([]);

  // Listen for automation events
  const events = useModuleEvents(
    ['AUTOMATION_STARTED', 'AUTOMATION_STOPPED', 'AUTOMATION_CYCLE_COMPLETE', 'ERROR_OCCURRED'],
    moduleId
  );

  // Update rules when events occur
  useEffect(() => {
    setRules(automationManager.getRulesForModule(moduleId));
  }, [moduleId, events]);

  /**
   * Creates a new automation rule
   */
  const createRule = (
    name: string,
    conditions: AutomationCondition[],
    actions: AutomationAction[],
    interval: number = 5000
  ): string => {
    const rule: AutomationRule = {
      id: `${moduleId}-${Date.now()}`,
      moduleId,
      name,
      enabled: true,
      conditions,
      actions,
      interval,
    };

    automationManager.registerRule(rule);
    setRules(automationManager.getRulesForModule(moduleId));
    return rule.id;
  };

  /**
   * Updates an existing rule
   */
  const updateRule = (ruleId: string, updates: Partial<AutomationRule>): void => {
    automationManager.updateRule(ruleId, updates);
    setRules(automationManager.getRulesForModule(moduleId));
  };

  /**
   * Removes a rule
   */
  const removeRule = (ruleId: string): void => {
    automationManager.removeRule(ruleId);
    setRules(automationManager.getRulesForModule(moduleId));
  };

  /**
   * Enables or disables a rule
   */
  const setRuleEnabled = (ruleId: string, enabled: boolean): void => {
    automationManager.updateRule(ruleId, { enabled });
    setRules(automationManager.getRulesForModule(moduleId));
  };

  /**
   * Gets a specific rule
   */
  const getRule = (ruleId: string): AutomationRule | undefined => {
    return automationManager.getRule(ruleId);
  };

  return {
    rules,
    createRule,
    updateRule,
    removeRule,
    setRuleEnabled,
    getRule,
    lastEvent: events[events.length - 1],
  };
}

/**
 * Hook to create common automation rules
 */
export function useCommonAutomationRules(moduleId: string) {
  const { createRule, updateRule, removeRule } = useAutomation(moduleId);

  /**
   * Creates a resource threshold rule
   */
  const createResourceThresholdRule = (
    resourceType: string,
    minThreshold: number,
    maxThreshold: number,
    produceAction: AutomationAction,
    consumeAction: AutomationAction,
    interval: number = 5000
  ): string => {
    return createRule(
      `${resourceType} Threshold`,
      [
        {
          type: 'RESOURCE_BELOW',
          target: resourceType,
          value: minThreshold,
          operator: 'less',
        },
        {
          type: 'RESOURCE_ABOVE',
          target: resourceType,
          value: maxThreshold,
          operator: 'greater',
        },
      ],
      [produceAction, consumeAction],
      interval
    );
  };

  /**
   * Creates a cyclic production rule
   */
  const createCyclicProductionRule = (
    resourceType: string,
    amount: number,
    interval: number = 5000
  ): string => {
    return createRule(
      `${resourceType} Production`,
      [
        {
          type: 'TIME_ELAPSED',
          value: interval,
        },
      ],
      [
        {
          type: 'PRODUCE_RESOURCES',
          target: resourceType,
          value: amount,
        },
      ],
      interval
    );
  };

  /**
   * Creates a module activation rule
   */
  const createModuleActivationRule = (triggerModuleId: string, interval: number = 5000): string => {
    return createRule(
      'Module Activation',
      [
        {
          type: 'MODULE_ACTIVE',
          target: triggerModuleId,
        },
      ],
      [
        {
          type: 'ACTIVATE_MODULE',
          target: moduleId,
        },
      ],
      interval
    );
  };

  return {
    createResourceThresholdRule,
    createCyclicProductionRule,
    createModuleActivationRule,
  };
}

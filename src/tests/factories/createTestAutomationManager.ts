import {
  AutomationAction,
  AutomationActionType,
  AutomationCondition,
  AutomationConditionType,
  AutomationManager,
  AutomationRule,
  ComplexEventConditionValue,
  CompoundConditionValue,
  EmitEventValue,
  EventConditionValue,
  LogicalOperator,
  MultipleResourcesConditionValue,
  PeriodicConditionValue,
  ResourceActionValue,
  ResourceConditionValue,
  ResourceRatioConditionValue,
  StatusConditionValue,
  TimeConditionValue,
  TransferResourcesValue,
} from '../../managers/game/AutomationManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { createTestModuleEvents } from './createTestModuleEvents';
import { createTestModuleManager } from './createTestModuleManager';

/**
 * TestAutomationManager extends the real AutomationManager class
 * with additional test-specific methods for verification and setup.
 * It doesn't mock any behavior but adds helpful test utilities.
 */
export interface TestAutomationManager extends AutomationManager {
  // Additional test helpers
  getRegisteredRules(): Map<string, AutomationRule>;
  getActiveIntervals(): Map<string, NodeJS.Timeout>;
  getModuleEventBus(): ReturnType<typeof createTestModuleEvents>;
  getModuleManager(): ReturnType<typeof createTestModuleManager>;

  // Methods for test setup/teardown
  reset(): void;
  clearAllRules(): void;
  stopAllRules(): void;

  // Test factory for creating rules
  createTestRule(options?: Partial<AutomationRule>): AutomationRule;
  createTestCondition(
    type: AutomationConditionType,
    options?: Partial<AutomationCondition>
  ): AutomationCondition;
  createTestAction(
    type: AutomationActionType,
    options?: Partial<AutomationAction>
  ): AutomationAction;
}

/**
 * Creates a test implementation of the AutomationManager.
 *
 * This implementation uses real ModuleEvents and ModuleManager test factories
 * to create a fully functional AutomationManager that can be used in tests.
 *
 * @returns A TestAutomationManager instance that extends the real AutomationManager
 */
export function createTestAutomationManager(): TestAutomationManager {
  // Create module events and module manager test instances
  const testModuleEvents = createTestModuleEvents();
  const testModuleManager = createTestModuleManager();

  // Create a new real AutomationManager
  const automationManager = new AutomationManager() as TestAutomationManager;

  // Generate a unique ID for test rules
  const generateUniqueId = () => `rule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Replace the rules and intervals maps with ones we can access for testing
  const rules: Map<string, AutomationRule> = new Map();
  const intervals: Map<string, NodeJS.Timeout> = new Map();

  // Add test-specific properties and methods
  automationManager.getRegisteredRules = () => rules;
  automationManager.getActiveIntervals = () => intervals;
  automationManager.getModuleEventBus = () => testModuleEvents;
  automationManager.getModuleManager = () => testModuleManager;

  // Reset the automation manager to a clean state
  automationManager.reset = () => {
    automationManager.clearAllRules();
    // Clear all event subscriptions and event history
    testModuleEvents.clearEvents();
  };

  // Stop all active rules and clear their intervals
  automationManager.stopAllRules = () => {
    intervals.forEach(interval => {
      clearInterval(interval);
    });
    intervals.clear();
  };

  // Clear all registered rules
  automationManager.clearAllRules = () => {
    automationManager.stopAllRules();
    rules.clear();
  };

  /**
   * Create a test rule with reasonable defaults
   */
  automationManager.createTestRule = (options?: Partial<AutomationRule>): AutomationRule => {
    const moduleId = options?.moduleId || 'test-module';
    // If not provided in options, register a test module
    if (!options?.moduleId) {
      // Create a test module in the module manager
      const position: Position = { x: 0, y: 0 };
      const moduleType: ModuleType = 'radar';

      // Create the module and immediately use the returned ID without storing the unused module reference
      testModuleManager.createTestModule(moduleType, position, {
        id: moduleId,
        level: 1,
        status: 'active',
      });

      // We don't need to store the module since we only need its ID
    }

    return {
      id: options?.id || generateUniqueId(),
      moduleId: moduleId,
      name: options?.name || 'Test Rule',
      enabled: options?.enabled !== undefined ? options.enabled : true,
      conditions: options?.conditions || [
        automationManager.createTestCondition('RESOURCE_ABOVE', {
          target: 'energy',
          value: { amount: 100 } as ResourceConditionValue,
        }),
      ],
      actions: options?.actions || [
        automationManager.createTestAction('TRANSFER_RESOURCES', {
          target: 'target-module',
          value: {
            from: moduleId,
            to: 'target-module',
            amount: 50,
            type: 'energy' as ResourceType,
          } as TransferResourcesValue,
        }),
      ],
      interval: options?.interval || 5000,
      lastRun: options?.lastRun,
    };
  };

  /**
   * Create a test condition with reasonable defaults
   */
  automationManager.createTestCondition = (
    type: AutomationConditionType,
    options?: Partial<AutomationCondition>
  ): AutomationCondition => {
    const condition: AutomationCondition = {
      type,
      target: options?.target,
      value: options?.value,
      operator: options?.operator,
      id: options?.id || `condition-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };

    // Apply default values based on condition type
    if (!options?.value) {
      switch (type) {
        case 'RESOURCE_ABOVE':
        case 'RESOURCE_BELOW':
          condition.value = { amount: 100 } as ResourceConditionValue;
          condition.target = options?.target || 'energy';
          break;
        case 'TIME_ELAPSED':
          condition.value = { milliseconds: 5000 } as TimeConditionValue;
          break;
        case 'EVENT_OCCURRED':
          condition.value = {
            eventType: 'RESOURCE_PRODUCED',
            eventData: { resourceType: 'energy' },
          } as EventConditionValue;
          break;
        case 'STATUS_EQUALS':
          condition.value = { status: 'active' } as StatusConditionValue;
          condition.target = options?.target || 'test-module';
          break;
        case 'MODULE_ACTIVE':
        case 'MODULE_INACTIVE':
          condition.target = options?.target || 'test-module';
          break;
        case 'RESOURCE_RATIO':
          condition.value = {
            resourceA: 'energy' as ResourceType,
            resourceB: 'minerals' as ResourceType,
            ratio: 2.0,
          } as ResourceRatioConditionValue;
          break;
        case 'MULTIPLE_RESOURCES':
          condition.value = {
            resources: [
              { resourceType: 'energy' as ResourceType, amount: 100, operator: 'greater' },
              { resourceType: 'minerals' as ResourceType, amount: 50, operator: 'greater' },
            ],
            combinationType: 'AND' as LogicalOperator,
          } as MultipleResourcesConditionValue;
          break;
        case 'COMPLEX_EVENT':
          condition.value = {
            eventSequence: [
              { eventType: 'RESOURCE_PRODUCED', eventData: { resourceType: 'energy' } },
              { eventType: 'RESOURCE_TRANSFERRED' },
            ],
            timeWindow: 10000,
            inOrder: true,
          } as ComplexEventConditionValue;
          break;
        case 'PERIODIC':
          condition.value = {
            intervalType: 'hourly',
            minute: 0,
          } as PeriodicConditionValue;
          break;
        case 'COMPOUND':
          condition.value = {
            conditions: [
              {
                type: 'RESOURCE_ABOVE',
                target: 'energy',
                value: { amount: 100 } as ResourceConditionValue,
              },
              {
                type: 'RESOURCE_BELOW',
                target: 'minerals',
                value: { amount: 50 } as ResourceConditionValue,
              },
            ],
            operator: 'AND' as LogicalOperator,
          } as CompoundConditionValue;
          break;
      }
    }

    if (
      !condition.operator &&
      ['RESOURCE_ABOVE', 'RESOURCE_BELOW', 'STATUS_EQUALS'].includes(type)
    ) {
      condition.operator =
        type === 'RESOURCE_ABOVE' ? 'greater' : type === 'RESOURCE_BELOW' ? 'less' : 'equals';
    }

    return condition;
  };

  /**
   * Create a test action with reasonable defaults
   */
  automationManager.createTestAction = (
    type: AutomationActionType,
    options?: Partial<AutomationAction>
  ): AutomationAction => {
    const action: AutomationAction = {
      type,
      target: options?.target,
      value: options?.value,
      delay: options?.delay,
      id: options?.id || `action-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      nextActions: options?.nextActions,
      conditionId: options?.conditionId,
      onSuccess: options?.onSuccess,
      onFailure: options?.onFailure,
    };

    // Apply default values based on action type
    if (!options?.value) {
      switch (type) {
        case 'TRANSFER_RESOURCES':
          action.value = {
            from: 'source-module',
            to: 'target-module',
            amount: 50,
            type: 'energy' as ResourceType,
          } as TransferResourcesValue;
          break;
        case 'PRODUCE_RESOURCES':
        case 'CONSUME_RESOURCES':
          action.value = { amount: 50 } as ResourceActionValue;
          action.target = options?.target || 'energy';
          break;
        case 'ACTIVATE_MODULE':
        case 'DEACTIVATE_MODULE':
        case 'UPGRADE_MODULE':
          action.target = options?.target || 'test-module';
          break;
        case 'EMIT_EVENT':
          action.value = {
            moduleId: options?.target || 'test-module',
            moduleType: 'radar',
            eventType: 'RESOURCE_PRODUCED',
            data: { resourceType: 'energy', amount: 50 },
          } as EmitEventValue;
          break;
      }
    }

    return action;
  };

  return automationManager;
}

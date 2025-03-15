import { ResourceType } from "./../../types/resources/ResourceTypes";
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ModuleEventType } from '../../lib/modules/ModuleEvents';
import { createTestAutomationManager } from './createTestAutomationManager';

describe('createTestAutomationManager', () => {
  let testAutomationManager: ReturnType<typeof createTestAutomationManager>;

  beforeEach(() => {
    testAutomationManager = createTestAutomationManager();
  });

  afterEach(() => {
    // Clean up after each test
    testAutomationManager.reset();
  });

  it('should create a valid AutomationManager instance', () => {
    expect(testAutomationManager).toBeDefined();
    expect(typeof testAutomationManager.registerRule).toBe('function');
    expect(typeof testAutomationManager.startRule).toBe('function');
    expect(typeof testAutomationManager.stopRule).toBe('function');

    // Test helper methods
    expect(typeof testAutomationManager.getRegisteredRules).toBe('function');
    expect(typeof testAutomationManager.getActiveIntervals).toBe('function');
    expect(typeof testAutomationManager.getModuleEventBus).toBe('function');
    expect(typeof testAutomationManager.getModuleManager).toBe('function');
    expect(typeof testAutomationManager.reset).toBe('function');
    expect(typeof testAutomationManager.clearAllRules).toBe('function');
    expect(typeof testAutomationManager.stopAllRules).toBe('function');
    expect(typeof testAutomationManager.createTestRule).toBe('function');
    expect(typeof testAutomationManager.createTestCondition).toBe('function');
    expect(typeof testAutomationManager.createTestAction).toBe('function');
  });

  describe('rule management', () => {
    it('should register a rule and retrieve it', () => {
      // Create a test rule
      const rule = testAutomationManager.createTestRule();

      // Register the rule
      testAutomationManager.registerRule(rule);

      // Get all rules
      const rules = testAutomationManager.getRegisteredRules();

      // Verify rule was registered
      expect(rules.size).toBe(1);
      expect(rules.get(rule.id)).toEqual(rule);
    });

    it('should start and stop a rule', () => {
      // Create and register a test rule
      const rule = testAutomationManager.createTestRule();
      testAutomationManager.registerRule(rule);

      // Start the rule
      testAutomationManager.startRule(rule.id);

      // Verify the rule has an active interval
      const intervals = testAutomationManager.getActiveIntervals();
      expect(intervals.has(rule.id)).toBe(true);

      // Stop the rule
      testAutomationManager.stopRule(rule.id);

      // Verify the interval was cleared
      expect(intervals.has(rule.id)).toBe(false);
    });

    it('should update a rule', () => {
      // Create and register a test rule
      const rule = testAutomationManager.createTestRule();
      testAutomationManager.registerRule(rule);

      // Update rule properties
      const updatedName = 'Updated Rule Name';
      testAutomationManager.updateRule(rule.id, { ...rule, name: updatedName });

      // Get the updated rule
      const updatedRule = testAutomationManager.getRule(rule.id);

      // Verify the rule was updated
      expect(updatedRule).toBeDefined();
      expect(updatedRule?.name).toBe(updatedName);
    });

    it('should remove a rule', () => {
      // Create and register a test rule
      const rule = testAutomationManager.createTestRule();
      testAutomationManager.registerRule(rule);

      // Remove the rule
      testAutomationManager.removeRule(rule.id);

      // Verify the rule was removed
      const rules = testAutomationManager.getRegisteredRules();
      expect(rules.size).toBe(0);
      expect(rules.has(rule.id)).toBe(false);
    });
  });

  describe('condition creation', () => {
    it('should create resource condition with default values', () => {
      const resourceAboveCondition = testAutomationManager.createTestCondition('RESOURCE_ABOVE');

      expect(resourceAboveCondition.type).toBe('RESOURCE_ABOVE');
      expect(resourceAboveCondition.target).toBe(ResourceType.ENERGY);
      expect(resourceAboveCondition.operator).toBe('greater');
      expect(resourceAboveCondition.value).toEqual({ amount: 100 });

      const resourceBelowCondition = testAutomationManager.createTestCondition('RESOURCE_BELOW');

      expect(resourceBelowCondition.type).toBe('RESOURCE_BELOW');
      expect(resourceBelowCondition.target).toBe(ResourceType.ENERGY);
      expect(resourceBelowCondition.operator).toBe('less');
      expect(resourceBelowCondition.value).toEqual({ amount: 100 });
    });

    it('should create time condition with default values', () => {
      const timeCondition = testAutomationManager.createTestCondition('TIME_ELAPSED');

      expect(timeCondition.type).toBe('TIME_ELAPSED');
      expect(timeCondition.value).toEqual({ milliseconds: 5000 });
    });

    it('should create event condition with default values', () => {
      const eventCondition = testAutomationManager.createTestCondition('EVENT_OCCURRED');

      expect(eventCondition.type).toBe('EVENT_OCCURRED');
      expect(eventCondition.value).toEqual({
        eventType: 'RESOURCE_PRODUCED',
        eventData: { resourceType: ResourceType.ENERGY },
      });
    });

    it('should create module status condition with default values', () => {
      const statusCondition = testAutomationManager.createTestCondition('STATUS_EQUALS');

      expect(statusCondition.type).toBe('STATUS_EQUALS');
      expect(statusCondition.target).toBe('test-module');
      expect(statusCondition.value).toEqual({ status: 'active' });
      expect(statusCondition.operator).toBe('equals');
    });

    it('should override default values with provided options', () => {
      const customCondition = testAutomationManager.createTestCondition('RESOURCE_ABOVE', {
        target: ResourceType.MINERALS,
        value: { amount: 200 },
        operator: 'greater',
        id: 'custom-condition-id',
      });

      expect(customCondition.type).toBe('RESOURCE_ABOVE');
      expect(customCondition.target).toBe(ResourceType.MINERALS);
      expect(customCondition.value).toEqual({ amount: 200 });
      expect(customCondition.operator).toBe('greater');
      expect(customCondition.id).toBe('custom-condition-id');
    });
  });

  describe('action creation', () => {
    it('should create transfer resources action with default values', () => {
      const transferAction = testAutomationManager.createTestAction('TRANSFER_RESOURCES');

      expect(transferAction.type).toBe('TRANSFER_RESOURCES');
      expect(transferAction.value).toEqual({
        from: 'source-module',
        to: 'target-module',
        amount: 50,
        type: ResourceType.ENERGY,
      });
    });

    it('should create produce resources action with default values', () => {
      const produceAction = testAutomationManager.createTestAction('PRODUCE_RESOURCES');

      expect(produceAction.type).toBe('PRODUCE_RESOURCES');
      expect(produceAction.target).toBe(ResourceType.ENERGY);
      expect(produceAction.value).toEqual({ amount: 50 });
    });

    it('should create module activation action with default values', () => {
      const activateAction = testAutomationManager.createTestAction('ACTIVATE_MODULE');

      expect(activateAction.type).toBe('ACTIVATE_MODULE');
      expect(activateAction.target).toBe('test-module');
    });

    it('should create event emission action with default values', () => {
      const emitAction = testAutomationManager.createTestAction('EMIT_EVENT');

      expect(emitAction.type).toBe('EMIT_EVENT');
      expect(emitAction.value).toEqual({
        moduleId: 'test-module',
        moduleType: 'radar',
        eventType: 'RESOURCE_PRODUCED',
        data: { resourceType: ResourceType.ENERGY, amount: 50 },
      });
    });

    it('should override default values with provided options', () => {
      const customAction = testAutomationManager.createTestAction('CONSUME_RESOURCES', {
        target: ResourceType.MINERALS,
        value: { amount: 75 },
        delay: 1000,
        id: 'custom-action-id',
      });

      expect(customAction.type).toBe('CONSUME_RESOURCES');
      expect(customAction.target).toBe(ResourceType.MINERALS);
      expect(customAction.value).toEqual({ amount: 75 });
      expect(customAction.delay).toBe(1000);
      expect(customAction.id).toBe('custom-action-id');
    });
  });

  describe('integration with ModuleEvents', () => {
    it('should emit events when rules are started', () => {
      // Create the rule
      const rule = testAutomationManager.createTestRule();
      testAutomationManager.registerRule(rule);

      // Get the module events bus
      const moduleEvents = testAutomationManager.getModuleEventBus();

      // Start the rule
      testAutomationManager.startRule(rule.id);

      // Check for emitted events
      const events = moduleEvents.getEmittedEvents('AUTOMATION_STARTED' as ModuleEventType);

      // Verify an event was emitted
      expect(events.length).toBeGreaterThan(0);

      // Find the event for our rule
      const ruleEvent = events.find(
        event =>
          event.data &&
          typeof event.data === 'object' &&
          'ruleId' in event.data &&
          event.data.ruleId === rule.id
      );

      expect(ruleEvent).toBeDefined();
      expect(ruleEvent?.type).toBe('AUTOMATION_STARTED');
    });
  });

  describe('integration with ModuleManager', () => {
    it('should create and use modules through the module manager', () => {
      // Get the module manager
      const moduleManager = testAutomationManager.getModuleManager();

      // Create a test rule which automatically creates a module
      const rule = testAutomationManager.createTestRule();

      // Get the module
      const module = moduleManager.getModule(rule.moduleId);

      // Verify the module was created
      expect(module).toBeDefined();
      expect(module?.id).toBe(rule.moduleId);
      expect(module?.type).toBe('radar');
      expect(module?.status).toBe('active');
    });
  });
});

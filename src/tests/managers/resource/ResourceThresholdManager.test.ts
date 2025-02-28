import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ResourceThresholdManager,
  ThresholdConfig,
} from '../../../managers/resource/ResourceThresholdManager';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { moduleEventBusMock } from '../../setup';

// Mock the moduleEventBus
vi.mock('../../../lib/modules/ModuleEvents', () => ({
  moduleEventBus: moduleEventBusMock,
}));

describe('ResourceThresholdManager', () => {
  let thresholdManager: ResourceThresholdManager;

  beforeEach(() => {
    vi.clearAllMocks();
    thresholdManager = new ResourceThresholdManager(100); // 100ms check interval for tests
  });

  afterEach(() => {
    thresholdManager.cleanup();
  });

  it('should create a new instance', () => {
    expect(thresholdManager).toBeInstanceOf(ResourceThresholdManager);
  });

  it('should register a threshold configuration', () => {
    const config: ThresholdConfig = {
      id: 'test-threshold',
      threshold: {
        type: 'energy' as ResourceType,
        min: 10,
        max: 100,
        target: 50,
      },
      actions: [
        {
          type: 'notification',
          target: 'system',
          message: 'Energy threshold triggered',
        },
      ],
      enabled: true,
    };

    const result = thresholdManager.registerThreshold(config);
    expect(result).toBe(true);

    const states = thresholdManager.getThresholdStates();
    expect(states.length).toBe(1);
    expect(states[0].config.id).toBe('test-threshold');
  });

  it('should not register an invalid threshold configuration', () => {
    const invalidConfig = {
      id: '',
      threshold: {
        type: 'energy' as ResourceType,
        min: 10,
        max: 100,
      },
      actions: [],
      enabled: true,
    } as ThresholdConfig;

    const result = thresholdManager.registerThreshold(invalidConfig);
    expect(result).toBe(false);

    const states = thresholdManager.getThresholdStates();
    expect(states.length).toBe(0);
  });

  it('should unregister a threshold configuration', () => {
    const config: ThresholdConfig = {
      id: 'test-threshold',
      threshold: {
        type: 'energy' as ResourceType,
        min: 10,
        max: 100,
        target: 50,
      },
      actions: [],
      enabled: true,
    };

    thresholdManager.registerThreshold(config);
    const result = thresholdManager.unregisterThreshold('test-threshold');
    expect(result).toBe(true);

    const states = thresholdManager.getThresholdStates();
    expect(states.length).toBe(0);
  });

  it('should enable and disable a threshold', () => {
    const config: ThresholdConfig = {
      id: 'test-threshold',
      threshold: {
        type: 'energy' as ResourceType,
        min: 10,
        max: 100,
        target: 50,
      },
      actions: [],
      enabled: false,
    };

    thresholdManager.registerThreshold(config);

    // Enable
    const enableResult = thresholdManager.enableThreshold('test-threshold');
    expect(enableResult).toBe(true);

    const configs = thresholdManager.getThresholdConfigs();
    expect(configs[0].enabled).toBe(true);

    // Disable
    const disableResult = thresholdManager.disableThreshold('test-threshold');
    expect(disableResult).toBe(true);

    const updatedConfigs = thresholdManager.getThresholdConfigs();
    expect(updatedConfigs[0].enabled).toBe(false);
  });

  it('should start and stop threshold monitoring', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    thresholdManager.start();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    thresholdManager.stop();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle resource updates', () => {
    // Create a private method accessor for testing
    const handleResourceUpdate = vi.spyOn(thresholdManager as any, 'handleResourceUpdate');

    // Simulate resource update event
    const resourceUpdate = {
      type: 'resource:update',
      data: {
        type: 'energy' as ResourceType,
        current: 20,
        min: 0,
        max: 100,
        production: 5,
        consumption: 2,
      },
    };

    // Manually call the event handler
    (thresholdManager as any).handleResourceUpdate(resourceUpdate);

    expect(handleResourceUpdate).toHaveBeenCalledWith(resourceUpdate);
  });

  it('should create and clear alerts', () => {
    // Register a threshold
    const config: ThresholdConfig = {
      id: 'test-threshold',
      threshold: {
        type: 'energy' as ResourceType,
        min: 10,
        max: 100,
        target: 50,
      },
      actions: [
        {
          type: 'notification',
          target: 'system',
          message: 'Energy threshold triggered',
        },
      ],
      enabled: true,
      autoResolve: true,
    };

    thresholdManager.registerThreshold(config);

    // Simulate resource update that triggers threshold
    const resourceUpdate = {
      type: 'resource:update',
      data: {
        type: 'energy' as ResourceType,
        current: 5, // Below min threshold
        min: 0,
        max: 100,
        production: 5,
        consumption: 2,
      },
    };

    // Manually call the event handler
    (thresholdManager as any).handleResourceUpdate(resourceUpdate);

    // Manually trigger check
    (thresholdManager as any).checkThresholds();

    // Check if alert was created
    const alerts = thresholdManager.getActiveAlerts();
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('energy');
    expect(alerts[0].severity).toBe('critical');

    // Simulate resource update that resolves threshold
    const resolveUpdate = {
      type: 'resource:update',
      data: {
        type: 'energy' as ResourceType,
        current: 20, // Above min threshold
        min: 0,
        max: 100,
        production: 5,
        consumption: 2,
      },
    };

    // Manually call the event handler
    (thresholdManager as any).handleResourceUpdate(resolveUpdate);

    // Manually trigger check
    (thresholdManager as any).checkThresholds();

    // Check if alert was cleared (due to autoResolve)
    const updatedAlerts = thresholdManager.getActiveAlerts();
    expect(updatedAlerts.length).toBe(0);
  });
});

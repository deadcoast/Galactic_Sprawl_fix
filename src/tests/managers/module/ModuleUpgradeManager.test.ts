import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { moduleEventBus } from '../../../lib/modules/ModuleEvents';
import { resourceManager } from '../../../managers/game/ResourceManager';
import { moduleManager } from '../../../managers/module/ModuleManager';
import { moduleStatusManager } from '../../../managers/module/ModuleStatusManager';
import { moduleUpgradeManager } from '../../../managers/module/ModuleUpgradeManager';

// Mock dependencies
vi.mock('../../../managers/module/ModuleManager', () => ({
  moduleManager: {
    getModule: vi.fn(),
    getModulesByType: vi.fn(),
    getBuildings: vi.fn(),
  },
}));

vi.mock('../../../lib/modules/ModuleEvents', () => ({
  moduleEventBus: {
    emit: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
  },
}));

vi.mock('../../../managers/game/ResourceManager', () => ({
  resourceManager: {
    getResourceAmount: vi.fn(),
    removeResource: vi.fn(),
  },
}));

vi.mock('../../../managers/module/ModuleStatusManager', () => ({
  moduleStatusManager: {
    updateModuleStatus: vi.fn(),
  },
}));

describe('ModuleUpgradeManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the module upgrade manager
    moduleUpgradeManager.cleanup();

    // Mock module
    vi.mocked(moduleManager.getModule).mockReturnValue({
      id: 'test-module-1',
      name: 'Test Module',
      type: 'radar',
      position: { x: 0, y: 0 },
      isActive: true,
      level: 1,
      status: 'active',
      progress: 0,
    });

    // Mock resource amounts
    vi.mocked(resourceManager.getResourceAmount).mockReturnValue(1000);

    // Mock buildings
    vi.mocked(moduleManager.getBuildings).mockReturnValue([
      {
        id: 'test-building-1',
        name: 'Test Building',
        level: 3,
        modules: [
          {
            id: 'test-module-1',
            name: 'Test Module',
            type: 'radar',
            position: { x: 0, y: 0 },
            isActive: true,
            level: 1,
            status: 'active',
            progress: 0,
          },
        ],
        attachmentPoints: [],
      },
    ]);

    // Register a test upgrade path
    moduleUpgradeManager.registerUpgradePath({
      moduleType: 'radar',
      levels: [
        {
          level: 2,
          name: 'Enhanced Radar',
          description: 'Improved radar capabilities',
          requirements: {
            minLevel: 1,
            resourceCosts: [
              { type: 'minerals', amount: 100 },
              { type: 'energy', amount: 50 },
            ],
            buildingLevel: 2,
          },
          effects: [
            {
              type: 'stat',
              target: 'range',
              value: 20,
              isPercentage: true,
              description: 'Increases radar range',
            },
          ],
        },
        {
          level: 3,
          name: 'Advanced Radar',
          description: 'Advanced radar capabilities',
          requirements: {
            minLevel: 2,
            resourceCosts: [
              { type: 'minerals', amount: 200 },
              { type: 'energy', amount: 100 },
            ],
            buildingLevel: 3,
          },
          effects: [
            {
              type: 'stat',
              target: 'range',
              value: 50,
              isPercentage: true,
              description: 'Greatly increases radar range',
            },
          ],
        },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should register and retrieve upgrade paths', () => {
    // Get the upgrade path
    const path = moduleUpgradeManager.getUpgradePath('radar');

    // Verify the path
    expect(path).toBeDefined();
    expect(path?.moduleType).toBe('radar');
    expect(path?.levels.length).toBe(2);
    expect(path?.levels[0].level).toBe(2);
    expect(path?.levels[1].level).toBe(3);
  });

  it('should get the next upgrade level for a module', () => {
    // Get the next upgrade level
    const nextLevel = moduleUpgradeManager.getNextUpgradeLevel('test-module-1');

    // Verify the next level
    expect(nextLevel).toBeDefined();
    expect(nextLevel?.level).toBe(2);
    expect(nextLevel?.name).toBe('Enhanced Radar');
  });

  it('should check if a module can be upgraded', () => {
    // Check if the module can be upgraded
    const canUpgrade = moduleUpgradeManager.canUpgrade('test-module-1');

    // Verify the result
    expect(canUpgrade).toBe(true);
  });

  it('should not allow upgrade if module is not active', () => {
    // Mock inactive module
    vi.mocked(moduleManager.getModule).mockReturnValue({
      id: 'test-module-1',
      name: 'Test Module',
      type: 'radar',
      position: { x: 0, y: 0 },
      isActive: false,
      level: 1,
      status: 'inactive',
      progress: 0,
    });

    // Check if the module can be upgraded
    const canUpgrade = moduleUpgradeManager.canUpgrade('test-module-1');

    // Verify the result
    expect(canUpgrade).toBe(false);
  });

  it('should not allow upgrade if requirements are not met', () => {
    // Mock insufficient resources
    vi.mocked(resourceManager.getResourceAmount).mockReturnValue(10);

    // Check if the module can be upgraded
    const canUpgrade = moduleUpgradeManager.canUpgrade('test-module-1');

    // Verify the result
    expect(canUpgrade).toBe(false);
  });

  it('should get missing requirements for a module upgrade', () => {
    // Mock insufficient resources
    vi.mocked(resourceManager.getResourceAmount).mockReturnValue(10);

    // Get missing requirements
    const missingRequirements = moduleUpgradeManager.getMissingRequirements('test-module-1');

    // Verify the result
    expect(missingRequirements.length).toBeGreaterThan(0);
    expect(missingRequirements[0]).toContain('Insufficient');
  });

  it('should start a module upgrade', () => {
    // Mock timers
    vi.useFakeTimers();

    // Start the upgrade
    const result = moduleUpgradeManager.startUpgrade('test-module-1');

    // Verify the result
    expect(result).toBe(true);

    // Verify resource consumption
    expect(resourceManager.removeResource).toHaveBeenCalledTimes(2);

    // Verify status update
    expect(moduleStatusManager.updateModuleStatus).toHaveBeenCalledWith(
      'test-module-1',
      'upgrading',
      expect.any(String)
    );

    // Verify event emission
    expect(moduleEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MODULE_UPGRADE_STARTED',
        moduleId: 'test-module-1',
      })
    );

    // Verify upgrade status
    const status = moduleUpgradeManager.getUpgradeStatus('test-module-1');
    expect(status?.upgradeProgress).toBeDefined();
    expect(status?.estimatedTimeRemaining).toBeDefined();
  });

  it('should complete a module upgrade after the timer expires', () => {
    // Mock timers
    vi.useFakeTimers();

    // Start the upgrade
    moduleUpgradeManager.startUpgrade('test-module-1');

    // Mock module with updated level after upgrade
    vi.mocked(moduleManager.getModule).mockReturnValue({
      id: 'test-module-1',
      name: 'Test Module',
      type: 'radar',
      position: { x: 0, y: 0 },
      isActive: true,
      level: 2,
      status: 'active',
      progress: 0,
    });

    // Fast-forward time to complete the upgrade
    vi.advanceTimersByTime(120000); // 2 minutes

    // Verify status update
    expect(moduleStatusManager.updateModuleStatus).toHaveBeenCalledWith(
      'test-module-1',
      'active',
      expect.any(String)
    );

    // Verify event emission
    expect(moduleEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MODULE_UPGRADED',
        moduleId: 'test-module-1',
      })
    );

    // Verify upgrade status
    const status = moduleUpgradeManager.getUpgradeStatus('test-module-1');
    expect(status?.upgradeProgress).toBeUndefined();
    expect(status?.currentLevel).toBe(2);
  });

  it('should cancel an active module upgrade', () => {
    // Mock timers
    vi.useFakeTimers();

    // Start the upgrade
    moduleUpgradeManager.startUpgrade('test-module-1');

    // Cancel the upgrade
    const result = moduleUpgradeManager.cancelUpgrade('test-module-1');

    // Verify the result
    expect(result).toBe(true);

    // Verify status update
    expect(moduleStatusManager.updateModuleStatus).toHaveBeenCalledWith(
      'test-module-1',
      'active',
      'Upgrade cancelled'
    );

    // Verify event emission
    expect(moduleEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MODULE_UPGRADE_CANCELLED',
        moduleId: 'test-module-1',
      })
    );

    // Verify upgrade status
    const status = moduleUpgradeManager.getUpgradeStatus('test-module-1');
    expect(status?.upgradeProgress).toBeUndefined();
  });

  it('should clean up resources properly', () => {
    // Mock timers
    vi.useFakeTimers();

    // Start the upgrade
    moduleUpgradeManager.startUpgrade('test-module-1');

    // Clean up
    moduleUpgradeManager.cleanup();

    // Verify status update
    expect(moduleStatusManager.updateModuleStatus).toHaveBeenCalledWith(
      'test-module-1',
      'active',
      'Upgrade cancelled due to cleanup'
    );

    // Verify event unsubscription
    expect(moduleEventBus.subscribe).toHaveBeenCalledTimes(4); // 2 in constructor, 2 in cleanup
  });
});

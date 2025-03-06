import { afterEach, beforeEach, describe, expect, it, SpyInstance, vi } from 'vitest';
import { ModuleEvent, ModuleEventType } from '../../../lib/modules/ModuleEvents';
import {
  GlobalAutomationManager,
  GlobalRoutine,
  GlobalRoutineType,
} from '../../../managers/automation/GlobalAutomationManager';
import { AutomationManager } from '../../../managers/game/AutomationManager';
import { UpdatePriority } from '../../../managers/game/GameLoopManager';
import { MessagePriority } from '../../../utils/events/EventCommunication';
import { createTestModuleEvents } from '../../factories/createTestModuleEvents';

// Create test event system to avoid using mock
const testModuleEvents = createTestModuleEvents();

// Type definition for an update callback function
type UpdateCallbackFunction = (deltaTime: number, elapsedTime: number) => void;

// Create a real GameLoopManager replacement for testing
class TestGameLoopManager {
  private updateCallbacks: Map<string, UpdateCallbackFunction> = new Map();

  registerUpdate(
    id: string,
    callback: UpdateCallbackFunction,
    _priority: number = UpdatePriority.NORMAL
  ): void {
    this.updateCallbacks.set(id, callback);
  }

  unregisterUpdate(id: string): void {
    this.updateCallbacks.delete(id);
  }

  // Method to manually trigger updates for testing
  triggerUpdate(deltaTime: number = 16, elapsedTime: number = 1000): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(deltaTime, elapsedTime);
      } catch (error) {
        console.error('Error in update callback:', error);
      }
    });
  }

  // Get all registered update IDs
  getRegisteredUpdateIds(): string[] {
    return Array.from(this.updateCallbacks.keys());
  }

  // Check if a specific update is registered
  hasUpdate(id: string): boolean {
    return this.updateCallbacks.has(id);
  }
}

// Create the test game loop manager
const testGameLoopManager = new TestGameLoopManager();

// Type definition for the ModuleEventBus spy
interface ModuleEventBusSpy {
  subscribe: SpyInstance<
    [type: ModuleEventType, listener: (event: ModuleEvent) => void],
    () => void
  >;
  emit: SpyInstance<[event: ModuleEvent], void>;
}

// Type definition for the GameLoopManager spy
interface GameLoopManagerSpy {
  registerUpdate: SpyInstance<
    [id: string, callback: UpdateCallbackFunction, priority?: number],
    void
  >;
  unregisterUpdate: SpyInstance<[id: string], void>;
}

describe('GlobalAutomationManager', () => {
  let automationManager: AutomationManager;
  let globalAutomationManager: GlobalAutomationManager;

  // Use vi.spyOn to create spies without mocking
  let moduleEventBusSpy: ModuleEventBusSpy;
  let gameLoopManagerSpy: GameLoopManagerSpy;

  beforeEach(() => {
    // Create spies on real objects instead of mocks
    moduleEventBusSpy = {
      subscribe: vi.spyOn(testModuleEvents.moduleEventBus, 'subscribe'),
      emit: vi.spyOn(testModuleEvents.moduleEventBus, 'emit'),
    };

    gameLoopManagerSpy = {
      registerUpdate: vi.spyOn(testGameLoopManager, 'registerUpdate'),
      unregisterUpdate: vi.spyOn(testGameLoopManager, 'unregisterUpdate'),
    };

    // Create a new instance of real AutomationManager for each test
    automationManager = new AutomationManager();

    // Create a new instance of GlobalAutomationManager for each test
    globalAutomationManager = new GlobalAutomationManager(automationManager);

    // Replace dependencies with test versions using a specific type assertion
    // to avoid "any" but still allow private property access
    const manager = globalAutomationManager as unknown as {
      moduleEventBus: typeof testModuleEvents.moduleEventBus;
      gameLoopManager: TestGameLoopManager;
    };

    manager.moduleEventBus = testModuleEvents.moduleEventBus;
    manager.gameLoopManager = testGameLoopManager;

    // Initialize the global automation manager
    globalAutomationManager.initialize();
  });

  afterEach(() => {
    // Clean up
    globalAutomationManager.cleanup();

    // Clear event history
    testModuleEvents.clearEvents();

    // Clear all spies
    vi.restoreAllMocks();
  });

  it('should create a new instance', () => {
    expect(globalAutomationManager).toBeInstanceOf(GlobalAutomationManager);
  });

  it('should initialize properly', () => {
    // Verify that the game loop update was registered
    expect(gameLoopManagerSpy.registerUpdate).toHaveBeenCalled();

    // Verify that a game loop update was registered with the expected ID
    expect(testGameLoopManager.hasUpdate('global-automation-manager')).toBe(true);

    // Verify that event subscriptions were set up
    expect(moduleEventBusSpy.subscribe).toHaveBeenCalledTimes(3);

    // Verify specific event types were subscribed to
    expect(moduleEventBusSpy.subscribe).toHaveBeenCalledWith(
      'ERROR_OCCURRED',
      expect.any(Function)
    );
    expect(moduleEventBusSpy.subscribe).toHaveBeenCalledWith(
      'RESOURCE_SHORTAGE',
      expect.any(Function)
    );
    expect(moduleEventBusSpy.subscribe).toHaveBeenCalledWith(
      'STATUS_CHANGED',
      expect.any(Function)
    );
  });

  it('should register a routine', () => {
    // Create a test routine
    const routine: GlobalRoutine = {
      id: 'test-routine',
      name: 'Test Routine',
      type: 'resource-balancing' as GlobalRoutineType,
      description: 'A test routine',
      enabled: true,
      priority: MessagePriority.NORMAL,
      interval: 5000,
      conditions: [
        {
          type: 'RESOURCE_BELOW',
          target: 'energy',
          value: 100,
          operator: 'less',
        },
      ],
      actions: [
        {
          type: 'PRODUCE_RESOURCES',
          target: 'energy',
          value: 50,
        },
      ],
      systems: ['resource-system'],
      tags: ['test', 'energy'],
    };

    // Register the routine
    const routineId = globalAutomationManager.registerRoutine(routine);

    // Verify that the routine was registered
    expect(routineId).toBe('test-routine');

    // Get all routines
    const routines = globalAutomationManager.getAllRoutines();

    // Verify that the routine is in the list
    expect(routines.length).toBe(1);
    expect(routines[0].id).toBe('test-routine');

    // Verify an event was emitted
    const broadcastEvents = testModuleEvents.getEmittedEvents();
    expect(broadcastEvents.length).toBeGreaterThan(0);
  });

  it('should unregister a routine', () => {
    // Create and register a test routine
    const routine: GlobalRoutine = {
      id: 'test-routine',
      name: 'Test Routine',
      type: 'resource-balancing' as GlobalRoutineType,
      description: 'A test routine',
      enabled: true,
      priority: MessagePriority.NORMAL,
      interval: 5000,
      conditions: [],
      actions: [],
      systems: ['resource-system'],
      tags: ['test'],
    };

    globalAutomationManager.registerRoutine(routine);

    // Unregister the routine
    const result = globalAutomationManager.unregisterRoutine('test-routine');

    // Verify that the routine was unregistered
    expect(result).toBe(true);

    // Get all routines
    const routines = globalAutomationManager.getAllRoutines();

    // Verify that the routine is no longer in the list
    expect(routines.length).toBe(0);
  });

  it('should enable and disable a routine', () => {
    // Create and register a test routine (initially disabled)
    const routine: GlobalRoutine = {
      id: 'test-routine',
      name: 'Test Routine',
      type: 'resource-balancing' as GlobalRoutineType,
      description: 'A test routine',
      enabled: false,
      priority: MessagePriority.NORMAL,
      interval: 5000,
      conditions: [],
      actions: [],
      systems: ['resource-system'],
      tags: ['test'],
    };

    globalAutomationManager.registerRoutine(routine);

    // Enable the routine
    const enableResult = globalAutomationManager.enableRoutine('test-routine');

    // Verify that the routine was enabled
    expect(enableResult).toBe(true);

    // Get all routines
    let routines = globalAutomationManager.getAllRoutines();

    // Verify that the routine is enabled
    expect(routines[0].enabled).toBe(true);

    // Disable the routine
    const disableResult = globalAutomationManager.disableRoutine('test-routine');

    // Verify that the routine was disabled
    expect(disableResult).toBe(true);

    // Get all routines again
    routines = globalAutomationManager.getAllRoutines();

    // Verify that the routine is disabled
    expect(routines[0].enabled).toBe(false);
  });

  it('should get routines by type', () => {
    // Create and register multiple routines of different types
    const routine1: GlobalRoutine = {
      id: 'routine-1',
      name: 'Routine 1',
      type: 'resource-balancing' as GlobalRoutineType,
      description: 'A resource balancing routine',
      enabled: true,
      priority: MessagePriority.NORMAL,
      interval: 5000,
      conditions: [],
      actions: [],
      systems: ['resource-system'],
      tags: ['test'],
    };

    const routine2: GlobalRoutine = {
      id: 'routine-2',
      name: 'Routine 2',
      type: 'performance-optimization' as GlobalRoutineType,
      description: 'A performance optimization routine',
      enabled: true,
      priority: MessagePriority.NORMAL,
      interval: 5000,
      conditions: [],
      actions: [],
      systems: ['resource-system'],
      tags: ['test'],
    };

    globalAutomationManager.registerRoutine(routine1);
    globalAutomationManager.registerRoutine(routine2);

    // Get routines by type
    const resourceRoutines = globalAutomationManager.getRoutinesByType(
      'resource-balancing' as GlobalRoutineType
    );
    const performanceRoutines = globalAutomationManager.getRoutinesByType(
      'performance-optimization' as GlobalRoutineType
    );

    // Verify the results
    expect(resourceRoutines.length).toBe(1);
    expect(resourceRoutines[0].id).toBe('routine-1');

    expect(performanceRoutines.length).toBe(1);
    expect(performanceRoutines[0].id).toBe('routine-2');
  });

  it('should get routines by system', () => {
    // Create and register multiple routines for different systems
    const routine1: GlobalRoutine = {
      id: 'routine-1',
      name: 'Routine 1',
      type: 'resource-balancing' as GlobalRoutineType,
      description: 'A resource system routine',
      enabled: true,
      priority: MessagePriority.NORMAL,
      interval: 5000,
      conditions: [],
      actions: [],
      systems: ['resource-system'],
      tags: ['test'],
    };

    const routine2: GlobalRoutine = {
      id: 'routine-2',
      name: 'Routine 2',
      type: 'performance-optimization' as GlobalRoutineType,
      description: 'A module system routine',
      enabled: true,
      priority: MessagePriority.NORMAL,
      interval: 5000,
      conditions: [],
      actions: [],
      systems: ['module-system'],
      tags: ['test'],
    };

    globalAutomationManager.registerRoutine(routine1);
    globalAutomationManager.registerRoutine(routine2);

    // Get routines by system
    const resourceSystemRoutines = globalAutomationManager.getRoutinesBySystem('resource-system');
    const moduleSystemRoutines = globalAutomationManager.getRoutinesBySystem('module-system');

    // Verify the results
    expect(resourceSystemRoutines.length).toBe(1);
    expect(resourceSystemRoutines[0].id).toBe('routine-1');

    expect(moduleSystemRoutines.length).toBe(1);
    expect(moduleSystemRoutines[0].id).toBe('routine-2');
  });

  it('should get routines by tag', () => {
    // Create and register multiple routines with different tags
    const routine1: GlobalRoutine = {
      id: 'routine-1',
      name: 'Routine 1',
      type: 'resource-balancing' as GlobalRoutineType,
      description: 'A routine with tag1',
      enabled: true,
      priority: MessagePriority.NORMAL,
      interval: 5000,
      conditions: [],
      actions: [],
      systems: ['resource-system'],
      tags: ['tag1', 'common'],
    };

    const routine2: GlobalRoutine = {
      id: 'routine-2',
      name: 'Routine 2',
      type: 'performance-optimization' as GlobalRoutineType,
      description: 'A routine with tag2',
      enabled: true,
      priority: MessagePriority.NORMAL,
      interval: 5000,
      conditions: [],
      actions: [],
      systems: ['module-system'],
      tags: ['tag2', 'common'],
    };

    globalAutomationManager.registerRoutine(routine1);
    globalAutomationManager.registerRoutine(routine2);

    // Get routines by tag
    const tag1Routines = globalAutomationManager.getRoutinesByTag('tag1');
    const tag2Routines = globalAutomationManager.getRoutinesByTag('tag2');
    const commonRoutines = globalAutomationManager.getRoutinesByTag('common');

    // Verify the results
    expect(tag1Routines.length).toBe(1);
    expect(tag1Routines[0].id).toBe('routine-1');

    expect(tag2Routines.length).toBe(1);
    expect(tag2Routines[0].id).toBe('routine-2');

    expect(commonRoutines.length).toBe(2);
  });

  it('should get active routines', () => {
    // Create and register multiple routines with different enabled states
    const routine1: GlobalRoutine = {
      id: 'routine-1',
      name: 'Routine 1',
      type: 'resource-balancing' as GlobalRoutineType,
      description: 'An enabled routine',
      enabled: true,
      priority: MessagePriority.NORMAL,
      interval: 5000,
      conditions: [],
      actions: [],
      systems: ['resource-system'],
      tags: ['test'],
    };

    const routine2: GlobalRoutine = {
      id: 'routine-2',
      name: 'Routine 2',
      type: 'performance-optimization' as GlobalRoutineType,
      description: 'A disabled routine',
      enabled: false,
      priority: MessagePriority.NORMAL,
      interval: 5000,
      conditions: [],
      actions: [],
      systems: ['module-system'],
      tags: ['test'],
    };

    globalAutomationManager.registerRoutine(routine1);
    globalAutomationManager.registerRoutine(routine2);

    // Get active routines
    const activeRoutines = globalAutomationManager.getActiveRoutines();

    // Verify the results
    expect(activeRoutines.length).toBe(1);
    expect(activeRoutines[0].id).toBe('routine-1');
  });

  it('should clean up properly', () => {
    // Create and register a test routine
    const routine: GlobalRoutine = {
      id: 'test-routine',
      name: 'Test Routine',
      type: 'resource-balancing' as GlobalRoutineType,
      description: 'A test routine',
      enabled: true,
      priority: MessagePriority.NORMAL,
      interval: 5000,
      conditions: [],
      actions: [],
      systems: ['resource-system'],
      tags: ['test'],
    };

    globalAutomationManager.registerRoutine(routine);

    // Clean up
    globalAutomationManager.cleanup();

    // Verify that the game loop update was unregistered
    expect(gameLoopManagerSpy.unregisterUpdate).toHaveBeenCalled();

    // Get all routines (should be empty after cleanup)
    const routines = globalAutomationManager.getAllRoutines();

    // Verify that all routines were removed
    expect(routines.length).toBe(0);
  });
});

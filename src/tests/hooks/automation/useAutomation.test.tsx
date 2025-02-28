import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutomation } from '../../../hooks/automation/useAutomation';
import { GlobalRoutine } from '../../../managers/automation/GlobalAutomationManager';
import { MessagePriority, SystemId } from '../../../utils/events/EventCommunication';

// Mock the GlobalAutomationManager
vi.mock('../../../managers/automation/GlobalAutomationManager', () => {
  const mockRoutines: GlobalRoutine[] = [];

  return {
    GlobalRoutineType: {
      'resource-balancing': 'resource-balancing',
      'performance-optimization': 'performance-optimization',
      'emergency-response': 'emergency-response',
      'system-maintenance': 'system-maintenance',
      'scheduled-task': 'scheduled-task',
      custom: 'custom',
    },
    GlobalAutomationManager: vi.fn().mockImplementation(() => ({
      initialize: vi.fn(),
      getAllRoutines: vi.fn().mockImplementation(() => mockRoutines),
      registerRoutine: vi.fn().mockImplementation((routine: GlobalRoutine) => {
        mockRoutines.push(routine);
        return routine.id;
      }),
      unregisterRoutine: vi.fn().mockImplementation((id: string) => {
        const index = mockRoutines.findIndex(r => r.id === id);
        if (index >= 0) {
          mockRoutines.splice(index, 1);
          return true;
        }
        return false;
      }),
      enableRoutine: vi.fn().mockImplementation((id: string) => {
        const routine = mockRoutines.find(r => r.id === id);
        if (routine) {
          routine.enabled = true;
          return true;
        }
        return false;
      }),
      disableRoutine: vi.fn().mockImplementation((id: string) => {
        const routine = mockRoutines.find(r => r.id === id);
        if (routine) {
          routine.enabled = false;
          return true;
        }
        return false;
      }),
      getRoutinesByType: vi.fn().mockImplementation((type: string) => {
        return mockRoutines.filter(r => r.type === type);
      }),
      getRoutinesByTag: vi.fn().mockImplementation((tag: string) => {
        return mockRoutines.filter(r => r.tags.includes(tag));
      }),
      getRoutinesBySystem: vi.fn().mockImplementation((system: SystemId) => {
        return mockRoutines.filter(r => r.systems.includes(system));
      }),
      getActiveRoutines: vi.fn().mockImplementation(() => {
        return mockRoutines.filter(r => r.enabled);
      }),
      cleanup: vi.fn(),
    })),
  };
});

// Mock the AutomationManager
vi.mock('../../../managers/game/AutomationManager', () => ({
  AutomationManager: vi.fn().mockImplementation(() => ({
    registerRule: vi.fn(),
    updateRule: vi.fn(),
    removeRule: vi.fn(),
    getRule: vi.fn(),
    getRulesForModule: vi.fn().mockReturnValue([]),
  })),
}));

// Mock the SystemId values
vi.mock('../../../utils/events/EventCommunication', () => ({
  MessagePriority: {
    CRITICAL: 0,
    HIGH: 1,
    NORMAL: 2,
    LOW: 3,
    BACKGROUND: 4,
  },
  SystemId: {
    'resource-system': 'resource-system',
    'module-system': 'module-system',
    'combat-system': 'combat-system',
    'exploration-system': 'exploration-system',
    'mining-system': 'mining-system',
    'tech-system': 'tech-system',
    'ui-system': 'ui-system',
    'game-loop': 'game-loop',
    'event-system': 'event-system',
  },
}));

describe('useAutomation', () => {
  // Define system IDs for tests
  const resourceSystem = 'resource-system' as SystemId;
  const moduleSystem = 'module-system' as SystemId;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the singleton instances
    (useAutomation as any).globalAutomationManager = null;
    (useAutomation as any).automationManagerInstance = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize the automation manager', () => {
    const { result } = renderHook(() => useAutomation());

    // Verify that the hook initialized properly
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.routines).toEqual([]);
    expect(result.current.activeRoutines).toEqual([]);
    expect(result.current.automationManager).toBeDefined();
  });

  it('should create a routine', () => {
    const { result } = renderHook(() => useAutomation());

    // Create a new routine
    act(() => {
      const newRoutine = result.current.createRoutine({
        name: 'Test Routine',
        type: 'resource-balancing',
        description: 'A test routine',
        enabled: true,
        priority: MessagePriority.NORMAL,
        interval: 5000,
        conditions: [],
        actions: [],
        systems: [resourceSystem],
        tags: ['test'],
      });

      // Verify that the routine was created
      expect(newRoutine).toBeDefined();
      expect(newRoutine?.name).toBe('Test Routine');
    });

    // Verify that the routines list was updated
    expect(result.current.routines.length).toBe(1);
    expect(result.current.routines[0].name).toBe('Test Routine');
  });

  it('should enable and disable a routine', () => {
    const { result } = renderHook(() => useAutomation());

    // Create a new routine (initially disabled)
    act(() => {
      result.current.createRoutine({
        name: 'Test Routine',
        type: 'resource-balancing',
        description: 'A test routine',
        enabled: false,
        priority: MessagePriority.NORMAL,
        interval: 5000,
        conditions: [],
        actions: [],
        systems: [resourceSystem],
        tags: ['test'],
      });
    });

    // Get the routine ID
    const routineId = result.current.routines[0].id;

    // Enable the routine
    act(() => {
      result.current.enableRoutine(routineId);
    });

    // Verify that the routine is enabled
    expect(result.current.routines[0].enabled).toBe(true);
    expect(result.current.activeRoutines.length).toBe(1);

    // Disable the routine
    act(() => {
      result.current.disableRoutine(routineId);
    });

    // Verify that the routine is disabled
    expect(result.current.routines[0].enabled).toBe(false);
    expect(result.current.activeRoutines.length).toBe(0);
  });

  it('should remove a routine', () => {
    const { result } = renderHook(() => useAutomation());

    // Create a new routine
    act(() => {
      result.current.createRoutine({
        name: 'Test Routine',
        type: 'resource-balancing',
        description: 'A test routine',
        enabled: true,
        priority: MessagePriority.NORMAL,
        interval: 5000,
        conditions: [],
        actions: [],
        systems: [resourceSystem],
        tags: ['test'],
      });
    });

    // Get the routine ID
    const routineId = result.current.routines[0].id;

    // Remove the routine
    act(() => {
      result.current.removeRoutine(routineId);
    });

    // Verify that the routine was removed
    expect(result.current.routines.length).toBe(0);
  });

  it('should filter routines by type', () => {
    const { result } = renderHook(() => useAutomation());

    // Create routines of different types
    act(() => {
      result.current.createRoutine({
        name: 'Resource Routine',
        type: 'resource-balancing',
        description: 'A resource routine',
        enabled: true,
        priority: MessagePriority.NORMAL,
        interval: 5000,
        conditions: [],
        actions: [],
        systems: [resourceSystem],
        tags: ['test'],
      });

      result.current.createRoutine({
        name: 'Performance Routine',
        type: 'performance-optimization',
        description: 'A performance routine',
        enabled: true,
        priority: MessagePriority.NORMAL,
        interval: 5000,
        conditions: [],
        actions: [],
        systems: [resourceSystem],
        tags: ['test'],
      });
    });

    // Get routines by type
    const resourceRoutines = result.current.getRoutinesByType('resource-balancing');
    const performanceRoutines = result.current.getRoutinesByType('performance-optimization');

    // Verify the results
    expect(resourceRoutines.length).toBe(1);
    expect(resourceRoutines[0].name).toBe('Resource Routine');

    expect(performanceRoutines.length).toBe(1);
    expect(performanceRoutines[0].name).toBe('Performance Routine');
  });

  it('should filter routines by tag', () => {
    const { result } = renderHook(() => useAutomation());

    // Create routines with different tags
    act(() => {
      result.current.createRoutine({
        name: 'Routine 1',
        type: 'resource-balancing',
        description: 'A routine with tag1',
        enabled: true,
        priority: MessagePriority.NORMAL,
        interval: 5000,
        conditions: [],
        actions: [],
        systems: [resourceSystem],
        tags: ['tag1', 'common'],
      });

      result.current.createRoutine({
        name: 'Routine 2',
        type: 'performance-optimization',
        description: 'A routine with tag2',
        enabled: true,
        priority: MessagePriority.NORMAL,
        interval: 5000,
        conditions: [],
        actions: [],
        systems: [resourceSystem],
        tags: ['tag2', 'common'],
      });
    });

    // Get routines by tag
    const tag1Routines = result.current.getRoutinesByTag('tag1');
    const tag2Routines = result.current.getRoutinesByTag('tag2');
    const commonRoutines = result.current.getRoutinesByTag('common');

    // Verify the results
    expect(tag1Routines.length).toBe(1);
    expect(tag1Routines[0].name).toBe('Routine 1');

    expect(tag2Routines.length).toBe(1);
    expect(tag2Routines[0].name).toBe('Routine 2');

    expect(commonRoutines.length).toBe(2);
  });

  it('should filter routines by system', () => {
    const { result } = renderHook(() => useAutomation());

    // Create routines for different systems
    act(() => {
      result.current.createRoutine({
        name: 'Resource System Routine',
        type: 'resource-balancing',
        description: 'A resource system routine',
        enabled: true,
        priority: MessagePriority.NORMAL,
        interval: 5000,
        conditions: [],
        actions: [],
        systems: [resourceSystem],
        tags: ['test'],
      });

      result.current.createRoutine({
        name: 'Module System Routine',
        type: 'performance-optimization',
        description: 'A module system routine',
        enabled: true,
        priority: MessagePriority.NORMAL,
        interval: 5000,
        conditions: [],
        actions: [],
        systems: [moduleSystem],
        tags: ['test'],
      });
    });

    // Get routines by system
    const resourceSystemRoutines = result.current.getRoutinesBySystem(resourceSystem);
    const moduleSystemRoutines = result.current.getRoutinesBySystem(moduleSystem);

    // Verify the results
    expect(resourceSystemRoutines.length).toBe(1);
    expect(resourceSystemRoutines[0].name).toBe('Resource System Routine');

    expect(moduleSystemRoutines.length).toBe(1);
    expect(moduleSystemRoutines[0].name).toBe('Module System Routine');
  });
});

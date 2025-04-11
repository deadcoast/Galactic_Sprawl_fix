import { useCallback, useEffect, useState } from 'react';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import {
  GlobalRoutine,
  GlobalRoutineType,
} from '../../managers/automation/GlobalAutomationManager';
import {
  AutomationAction,
  AutomationCondition,
  AutomationRule,
} from '../../managers/game/AutomationManager';
import { getGlobalAutomationManager } from '../../managers/ManagerRegistry';
import { MessagePriority, SystemId } from '../../utils/events/EventCommunication';

/**
 * Hook for using the global automation system
 */
export function useGlobalAutomation() {
  const manager = getGlobalAutomationManager();
  const [routines, setRoutines] = useState<GlobalRoutine[]>(() => manager.getAllRoutines());
  const [activeRoutines, setActiveRoutines] = useState<GlobalRoutine[]>(() =>
    manager.getActiveRoutines()
  );
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize and load routines
  useEffect(() => {
    // Initialize the global automation manager if not already initialized
    if (!isInitialized) {
      manager.initialize();
      setIsInitialized(true);
    }

    // Load all routines
    const allRoutines = manager.getAllRoutines();
    setRoutines(allRoutines);

    // Load active routines
    const active = manager.getActiveRoutines();
    setActiveRoutines(active);
  }, [manager, isInitialized]);

  // Subscribe to automation events
  useEffect(() => {
    // Define a proper type for automation events
    interface AutomationEvent {
      type: 'AUTOMATION_STARTED' | 'AUTOMATION_STOPPED' | 'AUTOMATION_CYCLE_COMPLETE' | string;
      routineId?: string;
      timestamp?: number;
      data?: Record<string, unknown>;
    }

    const handleAutomationEvent = (event: AutomationEvent) => {
      if (
        event?.type === 'AUTOMATION_STARTED' ||
        event?.type === 'AUTOMATION_STOPPED' ||
        event?.type === 'AUTOMATION_CYCLE_COMPLETE'
      ) {
        // Refresh routines
        const allRoutines = manager.getAllRoutines();
        setRoutines(allRoutines);

        // Refresh active routines
        const active = manager.getActiveRoutines();
        setActiveRoutines(active);

        // Update timestamp
        setLastUpdate(Date.now());
      }
    };

    // Subscribe to automation events
    const unsubscribeStarted = moduleEventBus.subscribe(
      'AUTOMATION_STARTED' as ModuleEventType,
      handleAutomationEvent
    );
    const unsubscribeStopped = moduleEventBus.subscribe(
      'AUTOMATION_STOPPED' as ModuleEventType,
      handleAutomationEvent
    );
    const unsubscribeComplete = moduleEventBus.subscribe(
      'AUTOMATION_CYCLE_COMPLETE' as ModuleEventType,
      handleAutomationEvent
    );

    // Cleanup subscriptions
    return () => {
      if (typeof unsubscribeStarted === 'function') {
        unsubscribeStarted();
      }
      if (typeof unsubscribeStopped === 'function') {
        unsubscribeStopped();
      }
      if (typeof unsubscribeComplete === 'function') {
        unsubscribeComplete();
      }
    };
  }, [manager]);

  const refreshRoutines = useCallback(() => {
    try {
      setRoutines(manager.getAllRoutines());
      setActiveRoutines(manager.getActiveRoutines());
      setError(null);
    } catch (err) {
      console.error('Error refreshing routines:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh routines'));
    }
  }, [manager]);

  /**
   * Create a new global routine
   */
  const createRoutine = useCallback(
    (
      name: string,
      type: GlobalRoutineType,
      description: string,
      conditions: AutomationCondition[],
      actions: AutomationAction[],
      systems: SystemId[],
      options?: {
        priority?: MessagePriority;
        interval?: number;
        enabled?: boolean;
        tags?: string[];
      }
    ): string => {
      const routine: GlobalRoutine = {
        id: `routine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        type,
        description,
        conditions,
        actions,
        systems,
        priority: options?.priority || MessagePriority.NORMAL,
        interval: options?.interval || 60000, // Default to 1 minute
        enabled: options?.enabled !== undefined ? options?.enabled : true,
        tags: options?.tags ?? [],
      };

      const routineId = manager.registerRoutine(routine);

      // Refresh routines
      refreshRoutines();

      return routineId;
    },
    [manager, refreshRoutines]
  );

  /**
   * Enable a routine
   */
  const enableRoutine = useCallback(
    async (routineId: string) => {
      setLoading(true);
      setError(null);
      try {
        const success = manager.enableRoutine(routineId);
        if (!success) {
          throw new Error(`Failed to enable routine with ID ${routineId}, it might not exist.`);
        }
        refreshRoutines();
      } catch (err) {
        console.error('Error enabling routine:', err);
        setError(err instanceof Error ? err : new Error('Failed to enable routine'));
      } finally {
        setLoading(false);
      }
    },
    [manager, refreshRoutines]
  );

  /**
   * Disable a routine
   */
  const disableRoutine = useCallback(
    async (routineId: string) => {
      setLoading(true);
      setError(null);
      try {
        const success = manager.disableRoutine(routineId);
        if (!success) {
          throw new Error(`Failed to disable routine with ID ${routineId}, it might not exist.`);
        }
        refreshRoutines();
      } catch (err) {
        console.error('Error disabling routine:', err);
        setError(err instanceof Error ? err : new Error('Failed to disable routine'));
      } finally {
        setLoading(false);
      }
    },
    [manager, refreshRoutines]
  );

  /**
   * Remove a routine
   */
  const removeRoutine = useCallback(
    async (routineId: string) => {
      setLoading(true);
      setError(null);
      try {
        const success = manager.unregisterRoutine(routineId);
        if (!success) {
          throw new Error(`Failed to remove routine with ID ${routineId}, it might not exist.`);
        }
        refreshRoutines();
      } catch (err) {
        console.error('Error removing routine:', err);
        setError(err instanceof Error ? err : new Error('Failed to remove routine'));
      } finally {
        setLoading(false);
      }
    },
    [manager, refreshRoutines]
  );

  /**
   * Get routines by type
   */
  const getRoutinesByType = useCallback(
    (type: GlobalRoutineType) => {
      try {
        return manager.getRoutinesByType(type);
      } catch (err) {
        console.error('Error getting routines by type:', err);
        setError(err instanceof Error ? err : new Error('Failed to get routines by type'));
        return [];
      }
    },
    [manager]
  );

  /**
   * Get routines by system
   */
  const getRoutinesBySystem = useCallback(
    (systemId: SystemId) => {
      try {
        return manager.getRoutinesBySystem(systemId);
      } catch (err) {
        console.error('Error getting routines by system:', err);
        setError(err instanceof Error ? err : new Error('Failed to get routines by system'));
        return [];
      }
    },
    [manager]
  );

  /**
   * Get routines by tag
   */
  const getRoutinesByTag = useCallback(
    (tag: string) => {
      try {
        return manager.getRoutinesByTag(tag);
      } catch (err) {
        console.error('Error getting routines by tag:', err);
        setError(err instanceof Error ? err : new Error('Failed to get routines by tag'));
        return [];
      }
    },
    [manager]
  );

  /**
   * Create a system maintenance routine
   */
  const createMaintenanceRoutine = useCallback(
    (
      name: string,
      description: string,
      systems: SystemId[],
      actions: AutomationAction[],
      options?: {
        conditions?: AutomationCondition[];
        interval?: number;
        priority?: MessagePriority;
        enabled?: boolean;
        tags?: string[];
      }
    ): string => {
      return createRoutine(
        name,
        'system-maintenance',
        description,
        options?.conditions ?? [],
        actions,
        systems,
        {
          interval: options?.interval || 3600000, // Default to 1 hour
          priority: options?.priority || MessagePriority.LOW,
          enabled: options?.enabled,
          tags: options?.tags || ['maintenance'],
        }
      );
    },
    [createRoutine]
  );

  /**
   * Create a resource balancing routine
   */
  const createResourceBalancingRoutine = useCallback(
    (
      name: string,
      description: string,
      systems: SystemId[],
      conditions: AutomationCondition[],
      actions: AutomationAction[],
      options?: {
        interval?: number;
        priority?: MessagePriority;
        enabled?: boolean;
        tags?: string[];
      }
    ): string => {
      return createRoutine(name, 'resource-balancing', description, conditions, actions, systems, {
        interval: options?.interval || 300000, // Default to 5 minutes
        priority: options?.priority || MessagePriority.NORMAL,
        enabled: options?.enabled,
        tags: options?.tags || ['resource'],
      });
    },
    [createRoutine]
  );

  /**
   * Create a performance optimization routine
   */
  const createPerformanceOptimizationRoutine = useCallback(
    (
      name: string,
      description: string,
      systems: SystemId[],
      actions: AutomationAction[],
      options?: {
        conditions?: AutomationCondition[];
        interval?: number;
        priority?: MessagePriority;
        enabled?: boolean;
        tags?: string[];
      }
    ): string => {
      return createRoutine(
        name,
        'performance-optimization',
        description,
        options?.conditions ?? [],
        actions,
        systems,
        {
          interval: options?.interval || 1800000, // Default to 30 minutes
          priority: options?.priority || MessagePriority.LOW,
          enabled: options?.enabled,
          tags: options?.tags || ['performance'],
        }
      );
    },
    [createRoutine]
  );

  /**
   * Create an emergency response routine
   */
  const createEmergencyResponseRoutine = useCallback(
    (
      name: string,
      description: string,
      systems: SystemId[],
      conditions: AutomationCondition[],
      actions: AutomationAction[],
      options?: {
        priority?: MessagePriority;
        enabled?: boolean;
        tags?: string[];
      }
    ): string => {
      return createRoutine(name, 'emergency-response', description, conditions, actions, systems, {
        interval: 0, // Emergency routines are triggered by events, not time
        priority: options?.priority || MessagePriority.CRITICAL,
        enabled: options?.enabled !== undefined ? options?.enabled : true,
        tags: options?.tags || ['emergency'],
      });
    },
    [createRoutine]
  );

  /**
   * Create a scheduled task routine
   */
  const createScheduledTaskRoutine = useCallback(
    (
      name: string,
      description: string,
      systems: SystemId[],
      actions: AutomationAction[],
      interval: number,
      options?: {
        conditions?: AutomationCondition[];
        priority?: MessagePriority;
        enabled?: boolean;
        tags?: string[];
      }
    ): string => {
      return createRoutine(
        name,
        'scheduled-task',
        description,
        options?.conditions ?? [],
        actions,
        systems,
        {
          interval,
          priority: options?.priority || MessagePriority.NORMAL,
          enabled: options?.enabled,
          tags: options?.tags || ['scheduled'],
        }
      );
    },
    [createRoutine]
  );

  return {
    // State
    routines,
    activeRoutines,
    isInitialized,
    lastUpdate,
    loading,
    error,

    // Basic operations
    createRoutine,
    enableRoutine,
    disableRoutine,
    removeRoutine,

    // Queries
    getRoutinesByType,
    getRoutinesBySystem,
    getRoutinesByTag,

    // Specialized routine creators
    createMaintenanceRoutine,
    createResourceBalancingRoutine,
    createPerformanceOptimizationRoutine,
    createEmergencyResponseRoutine,
    createScheduledTaskRoutine,

    // New operations
    refreshRoutines,
  };
}

/**
 * Custom hook to manage global automation rules.
 * Registers and unregisters rules with the GlobalAutomationManager.
 *
 * @param rules An array of AutomationRule instances to manage.
 */
export function useGlobalAutomationRules(rules: AutomationRule[]): void {
  const manager = getGlobalAutomationManager();

  useEffect(() => {
    // Register rules on mount
    rules.forEach(rule => manager.registerRule(rule));

    // Cleanup function to remove rules on unmount
    return () => {
      // TODO: Implement removeRule/unregisterRule method on GlobalAutomationManager
      // rules.forEach(rule => manager.removeRule(rule.id));
    };
  }, [rules, manager]);
}

import { useCallback, useEffect, useState } from 'react';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import {
  globalAutomationManager,
  GlobalRoutine,
  GlobalRoutineType,
} from '../../managers/automation/GlobalAutomationManager';
import { AutomationAction, AutomationCondition } from '../../managers/game/AutomationManager';
import { MessagePriority, SystemId } from '../../utils/events/EventCommunication';

/**
 * Hook for using the global automation system
 */
export function useGlobalAutomation() {
  const [routines, setRoutines] = useState<GlobalRoutine[]>([]);
  const [activeRoutines, setActiveRoutines] = useState<GlobalRoutine[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Initialize and load routines
  useEffect(() => {
    // Initialize the global automation manager if not already initialized
    if (!isInitialized) {
      globalAutomationManager.initialize();
      setIsInitialized(true);
    }

    // Load all routines
    const allRoutines = globalAutomationManager.getAllRoutines();
    setRoutines(allRoutines);

    // Load active routines
    const active = globalAutomationManager.getActiveRoutines();
    setActiveRoutines(active);
  }, [isInitialized]);

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
        event.type === 'AUTOMATION_STARTED' ||
        event.type === 'AUTOMATION_STOPPED' ||
        event.type === 'AUTOMATION_CYCLE_COMPLETE'
      ) {
        // Refresh routines
        const allRoutines = globalAutomationManager.getAllRoutines();
        setRoutines(allRoutines);

        // Refresh active routines
        const active = globalAutomationManager.getActiveRoutines();
        setActiveRoutines(active);

        // Update timestamp
        setLastUpdate(Date.now());
      }
    };

    // Subscribe to automation events
    const unsubscribeStarted = moduleEventBus.subscribe(
      'AUTOMATION_STARTED' as ModuleEventType,
      handleAutomationEvent,
    );
    const unsubscribeStopped = moduleEventBus.subscribe(
      'AUTOMATION_STOPPED' as ModuleEventType,
      handleAutomationEvent,
    );
    const unsubscribeComplete = moduleEventBus.subscribe(
      'AUTOMATION_CYCLE_COMPLETE' as ModuleEventType,
      handleAutomationEvent,
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
  }, []);

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
      },
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
        enabled: options?.enabled !== undefined ? options.enabled : true,
        tags: options?.tags || [],
      };

      const routineId = globalAutomationManager.registerRoutine(routine);

      // Refresh routines
      const allRoutines = globalAutomationManager.getAllRoutines();
      setRoutines(allRoutines);

      // Refresh active routines
      const active = globalAutomationManager.getActiveRoutines();
      setActiveRoutines(active);

      return routineId;
    },
    [],
  );

  /**
   * Enable a routine
   */
  const enableRoutine = useCallback((routineId: string): boolean => {
    const result = globalAutomationManager.enableRoutine(routineId);

    if (result) {
      // Refresh routines
      const allRoutines = globalAutomationManager.getAllRoutines();
      setRoutines(allRoutines);

      // Refresh active routines
      const active = globalAutomationManager.getActiveRoutines();
      setActiveRoutines(active);
    }

    return result;
  }, []);

  /**
   * Disable a routine
   */
  const disableRoutine = useCallback((routineId: string): boolean => {
    const result = globalAutomationManager.disableRoutine(routineId);

    if (result) {
      // Refresh routines
      const allRoutines = globalAutomationManager.getAllRoutines();
      setRoutines(allRoutines);

      // Refresh active routines
      const active = globalAutomationManager.getActiveRoutines();
      setActiveRoutines(active);
    }

    return result;
  }, []);

  /**
   * Remove a routine
   */
  const removeRoutine = useCallback((routineId: string): boolean => {
    const result = globalAutomationManager.unregisterRoutine(routineId);

    if (result) {
      // Refresh routines
      const allRoutines = globalAutomationManager.getAllRoutines();
      setRoutines(allRoutines);

      // Refresh active routines
      const active = globalAutomationManager.getActiveRoutines();
      setActiveRoutines(active);
    }

    return result;
  }, []);

  /**
   * Get routines by type
   */
  const getRoutinesByType = useCallback((type: GlobalRoutineType): GlobalRoutine[] => {
    return globalAutomationManager.getRoutinesByType(type);
  }, []);

  /**
   * Get routines by system
   */
  const getRoutinesBySystem = useCallback((systemId: SystemId): GlobalRoutine[] => {
    return globalAutomationManager.getRoutinesBySystem(systemId);
  }, []);

  /**
   * Get routines by tag
   */
  const getRoutinesByTag = useCallback((tag: string): GlobalRoutine[] => {
    return globalAutomationManager.getRoutinesByTag(tag);
  }, []);

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
      },
    ): string => {
      return createRoutine(
        name,
        'system-maintenance',
        description,
        options?.conditions || [],
        actions,
        systems,
        {
          interval: options?.interval || 3600000, // Default to 1 hour
          priority: options?.priority || MessagePriority.LOW,
          enabled: options?.enabled,
          tags: options?.tags || ['maintenance'],
        },
      );
    },
    [createRoutine],
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
      },
    ): string => {
      return createRoutine(name, 'resource-balancing', description, conditions, actions, systems, {
        interval: options?.interval || 300000, // Default to 5 minutes
        priority: options?.priority || MessagePriority.NORMAL,
        enabled: options?.enabled,
        tags: options?.tags || ['resource'],
      });
    },
    [createRoutine],
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
      },
    ): string => {
      return createRoutine(
        name,
        'performance-optimization',
        description,
        options?.conditions || [],
        actions,
        systems,
        {
          interval: options?.interval || 1800000, // Default to 30 minutes
          priority: options?.priority || MessagePriority.LOW,
          enabled: options?.enabled,
          tags: options?.tags || ['performance'],
        },
      );
    },
    [createRoutine],
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
      },
    ): string => {
      return createRoutine(name, 'emergency-response', description, conditions, actions, systems, {
        interval: 0, // Emergency routines are triggered by events, not time
        priority: options?.priority || MessagePriority.CRITICAL,
        enabled: options?.enabled !== undefined ? options.enabled : true,
        tags: options?.tags || ['emergency'],
      });
    },
    [createRoutine],
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
      },
    ): string => {
      return createRoutine(
        name,
        'scheduled-task',
        description,
        options?.conditions || [],
        actions,
        systems,
        {
          interval,
          priority: options?.priority || MessagePriority.NORMAL,
          enabled: options?.enabled,
          tags: options?.tags || ['scheduled'],
        },
      );
    },
    [createRoutine],
  );

  return {
    // State
    routines,
    activeRoutines,
    isInitialized,
    lastUpdate,

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
  };
}

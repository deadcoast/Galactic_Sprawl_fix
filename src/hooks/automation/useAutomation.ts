import { useCallback, useEffect, useMemo, useState } from 'react';
import { GlobalRoutine } from '../../managers/automation/GlobalAutomationManager';
import { AutomationRule } from '../../managers/game/AutomationManager';
import { getAutomationManager, getGlobalAutomationManager } from '../../managers/ManagerRegistry'; // Import registry accessors
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../services/logging/ErrorLoggingService';

// Define SystemId type to match what's expected
type SystemId = string;

// Singleton instance of the automation manager
// let globalAutomationManager: GlobalAutomationManager | null = null; // Old way
// We need an instance of AutomationManager to pass to GlobalAutomationManager
// let automationManagerInstance: AutomationManager | null = null; // Old way

/**
 * Hook to access the global automation system
 */
export const useAutomation = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [routines, setRoutines] = useState<GlobalRoutine[]>([]);
  const [activeRoutines, setActiveRoutines] = useState<GlobalRoutine[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Get managers from registry
  const globalAutomationManager = getGlobalAutomationManager();
  const automationManager = getAutomationManager(); // Get this too if needed directly

  // Initialize the automation manager if it doesn't exist
  useEffect(() => {
    // Initialization is handled by automationSystemInit.ts, which calls
    // globalAutomationManager.initialize(). The registry ensures we get the
    // initialized instance.

    // Set initial state - assume initialized by the time hook runs
    setIsInitialized(true); // Or potentially check a status if manager provides one
    updateRoutines();

    // Subscribe to automation events (if event system is integrated)
    // const unsubscribe = subscribeToEvents();
    const unsubscribe = () => {}; // Placeholder

    return () => {
      unsubscribe();
    };
    // Dependencies: ensure effect runs if manager instances change (though they shouldn't)
  }, [globalAutomationManager]);

  // Update routines state
  const updateRoutines = useCallback(() => {
    if (!globalAutomationManager) {
      return;
    }

    try {
      const allRoutines = globalAutomationManager.getAllRoutines() ?? [];
      setRoutines(allRoutines);
      setActiveRoutines(allRoutines.filter(r => r.enabled));
      setLastUpdate(Date.now());
    } catch (error) {
      // Use error logging service
      errorLoggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorType.RUNTIME,
        ErrorSeverity.MEDIUM,
        { hook: 'useAutomation', action: 'updateRoutines' }
      );
      // console.error('Failed to update automation routines:', error); // Keep commented out or remove
    }
  }, [globalAutomationManager]);

  // Subscribe to automation events
  const subscribeToEvents = () => {
    if (!globalAutomationManager) {
      return () => {};
    }

    // Placeholder: This should use the event bus provided by the manager or a global one
    // e.g., globalAutomationManager.eventBus.subscribe('routineUpdated', updateRoutines);
    return () => {};
  };

  // Memoized actions to interact with the managers
  const actions = useMemo(
    () => ({
      enableRoutine: (id: string) => globalAutomationManager?.enableRoutine(id),
      disableRoutine: (id: string) => globalAutomationManager?.disableRoutine(id),
      registerRoutine: (routine: GlobalRoutine) =>
        globalAutomationManager?.registerRoutine(routine),
      // Add more actions for AutomationManager if needed
      getRule: (id: string) => automationManager?.getRule(id),
      registerRule: (rule: AutomationRule) => automationManager?.registerRule(rule),
    }),
    [globalAutomationManager, automationManager]
  );

  return {
    isInitialized,
    routines,
    activeRoutines,
    lastUpdate,
    actions,
    updateRoutines, // Expose manual update if needed
  };
};

export default useAutomation;

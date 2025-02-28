import { useState, useEffect } from 'react';
import { GlobalAutomationManager, GlobalRoutine } from '../../managers/automation/GlobalAutomationManager';
import { AutomationManager } from '../../managers/game/AutomationManager';

// Define SystemId type to match what's expected
type SystemId = string;

// Singleton instance of the automation manager
let globalAutomationManager: GlobalAutomationManager | null = null;
// We need an instance of AutomationManager to pass to GlobalAutomationManager
let automationManagerInstance: AutomationManager | null = null;

/**
 * Hook to access the global automation system
 */
export const useAutomation = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [routines, setRoutines] = useState<GlobalRoutine[]>([]);
  const [activeRoutines, setActiveRoutines] = useState<GlobalRoutine[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Initialize the automation manager if it doesn't exist
  useEffect(() => {
    if (!globalAutomationManager) {
      // Create AutomationManager instance if needed
      if (!automationManagerInstance) {
        automationManagerInstance = new AutomationManager();
      }
      
      // Create GlobalAutomationManager with the AutomationManager instance
      globalAutomationManager = new GlobalAutomationManager(automationManagerInstance);
      globalAutomationManager.initialize();
    }

    // Set initial state
    setIsInitialized(true);
    updateRoutines();

    // Subscribe to automation events
    const unsubscribe = subscribeToEvents();

    return () => {
      unsubscribe();
    };
  }, []);

  // Update routines state
  const updateRoutines = () => {
    if (!globalAutomationManager) {
      return;
    }

    try {
      const allRoutines = globalAutomationManager.getAllRoutines() || [];
      setRoutines(allRoutines);
      setActiveRoutines(allRoutines.filter(r => r.enabled));
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Failed to update automation routines:', error);
    }
  };

  // Subscribe to automation events
  const subscribeToEvents = () => {
    if (!globalAutomationManager) {
      return () => {};
    }

    // This would be implemented with the event system
    // For now, we'll just return an empty function
    return () => {};
  };

  // Enable a routine
  const enableRoutine = (routineId: string) => {
    if (!globalAutomationManager) {
      return;
    }

    try {
      globalAutomationManager.enableRoutine(routineId);
      updateRoutines();
    } catch (error) {
      console.error(`Failed to enable routine ${routineId}:`, error);
    }
  };

  // Disable a routine
  const disableRoutine = (routineId: string) => {
    if (!globalAutomationManager) {
      return;
    }

    try {
      globalAutomationManager.disableRoutine(routineId);
      updateRoutines();
    } catch (error) {
      console.error(`Failed to disable routine ${routineId}:`, error);
    }
  };

  // Remove a routine
  const removeRoutine = (routineId: string) => {
    if (!globalAutomationManager) {
      return;
    }

    try {
      globalAutomationManager.unregisterRoutine(routineId);
      updateRoutines();
    } catch (error) {
      console.error(`Failed to remove routine ${routineId}:`, error);
    }
  };

  // Get routines by type
  const getRoutinesByType = (type: string) => {
    return routines.filter(routine => routine.type === type);
  };

  // Get routines by tag
  const getRoutinesByTag = (tag: string) => {
    return routines.filter(routine => 
      Array.isArray(routine.tags) && routine.tags.includes(tag)
    );
  };

  // Get routines by system
  const getRoutinesBySystem = (system: string) => {
    return routines.filter(routine => 
      Array.isArray(routine.systems) && 
      routine.systems.some(sys => sys === system as unknown as SystemId)
    );
  };

  // Create a new routine
  const createRoutine = (routine: Omit<GlobalRoutine, 'id'>) => {
    if (!globalAutomationManager) {
      return;
    }

    try {
      // Generate a unique ID
      const id = `routine-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newRoutine = { ...routine, id } as GlobalRoutine;
      
      globalAutomationManager.registerRoutine(newRoutine);
      updateRoutines();
      
      return newRoutine;
    } catch (error) {
      console.error('Failed to create routine:', error);
      return null;
    }
  };

  return {
    isInitialized,
    routines,
    activeRoutines,
    lastUpdate,
    enableRoutine,
    disableRoutine,
    removeRoutine,
    getRoutinesByType,
    getRoutinesByTag,
    getRoutinesBySystem,
    createRoutine,
    automationManager: globalAutomationManager
  };
};

export default useAutomation;

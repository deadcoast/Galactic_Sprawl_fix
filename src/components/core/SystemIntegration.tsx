import { ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GameContext } from '../../contexts/GameContext';
import { ModuleContext } from '../../contexts/ModuleContext';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { GameLoopManager, UpdatePriority } from '../../managers/game/GameLoopManager';
import { ResourceManager } from '../../managers/game/ResourceManager';
import { moduleManager } from '../../managers/module/ModuleManager';
import { BaseEvent, EventType } from '../../types/events/EventTypes';

// Get the contexts directly instead of via hooks that might not be exported
const useGame = () => useContext(GameContext);
const useModules = () => useContext(ModuleContext);

// Types of resource events to listen for
const RESOURCE_EVENT_TYPES = [
  EventType.RESOURCE_PRODUCED,
  EventType.RESOURCE_CONSUMED,
  EventType.RESOURCE_TRANSFERRED,
  EventType.RESOURCE_SHORTAGE,
  EventType.RESOURCE_PRODUCTION_REGISTERED,
  EventType.RESOURCE_CONSUMPTION_REGISTERED,
];

// Types of module events to listen for
const MODULE_EVENT_TYPES = [
  EventType.MODULE_CREATED,
  EventType.MODULE_ATTACHED,
  EventType.MODULE_DETACHED,
  EventType.MODULE_UPGRADED,
  EventType.MODULE_ACTIVATED,
  EventType.MODULE_DEACTIVATED,
];

interface SystemIntegrationProps {
  children: ReactNode;
  resourceManager: ResourceManager;
  gameLoopManager?: GameLoopManager;
  updateInterval?: number;
}

/**
 * SystemIntegration component
 *
 * This component serves as a bridge between the frontend React contexts and
 * the backend manager classes. It synchronizes state between them and ensures
 * that updates from managers are propagated to the UI.
 */
export function SystemIntegration({
  children,
  resourceManager,
  gameLoopManager,
  updateInterval = 1000,
}: SystemIntegrationProps) {
  const game = useGame();
  const modules = useModules();
  const gameDispatch = game?.dispatch;
  const moduleDispatch = modules?.dispatch;

  const lastResourceState = useRef<Record<string, number>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize managers
  useEffect(() => {
    const initializeManagers = async () => {
      try {
        // Initialize the resource manager
        await resourceManager.initialize();

        // Connect resource manager to game loop if provided
        if (gameLoopManager) {
          gameLoopManager.registerUpdate(
            resourceManager.id,
            deltaTime => resourceManager.update(deltaTime),
            UpdatePriority.NORMAL
          );
        }

        setIsInitialized(true);
        console.log('Managers initialized successfully');
      } catch (err) {
        console.error('Failed to initialize managers:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    initializeManagers();

    // Cleanup on unmount
    return () => {
      if (gameLoopManager) {
        gameLoopManager.unregisterUpdate(resourceManager.id);
      }
      resourceManager.dispose();
    };
  }, [resourceManager, gameLoopManager]);

  // Sync resource state from ResourceManager to GameContext
  const syncResourceState = useCallback(() => {
    if (!gameDispatch) return;

    // Get current resources from manager
    const currentResources = resourceManager.getAllResources();
    const lastResourceStateValue = lastResourceState.current;

    // Check if resources have changed
    const hasChanges =
      !lastResourceStateValue ||
      Object.entries(currentResources).some(
        ([key, value]) => lastResourceStateValue[key] !== value
      );

    // Only update if there are changes
    if (hasChanges) {
      console.log('Syncing resource state:', currentResources);

      // Add resource rates to the update if we can calculate them
      let resourceRates = {};
      let production = {};
      let consumption = {};

      if (resourceManager.getAllResourceStates) {
        const states = resourceManager.getAllResourceStates();

        // Store detailed production and consumption data
        production = {
          mineralProduction: states.minerals?.production || 0,
          energyProduction: states.energy?.production || 0,
          populationProduction: states.population?.production || 0,
          researchProduction: states.research?.production || 0,
        };

        consumption = {
          mineralConsumption: states.minerals?.consumption || 0,
          energyConsumption: states.energy?.consumption || 0,
          populationConsumption: states.population?.consumption || 0,
          researchConsumption: states.research?.consumption || 0,
        };

        // Calculate rates from production and consumption
        resourceRates = {
          mineralRate: (states.minerals?.production || 0) - (states.minerals?.consumption || 0),
          energyRate: (states.energy?.production || 0) - (states.energy?.consumption || 0),
          populationRate:
            (states.population?.production || 0) - (states.population?.consumption || 0),
          researchRate: (states.research?.production || 0) - (states.research?.consumption || 0),
        };
      }

      // Update resources with the calculated values
      gameDispatch({
        type: 'UPDATE_RESOURCES',
        resources: {
          minerals: currentResources.minerals || 0,
          energy: currentResources.energy || 0,
          population: currentResources.population || 0,
          research: currentResources.research || 0,
          ...resourceRates, // Add rates if available
        },
      });

      lastResourceState.current = { ...currentResources };
    }
  }, [gameDispatch, resourceManager]);

  // Sync module state from ModuleManager to ModuleContext
  const syncModuleState = useCallback(() => {
    if (!moduleDispatch) return;

    const moduleBuildings = moduleManager.getBuildings();
    const modules = moduleManager.getActiveModules();

    // Only update if there are modules available
    if (modules.length > 0) {
      moduleDispatch({
        type: 'UPDATE_ACTIVE_MODULES',
        modules,
      });
    }

    // Update buildings if available
    if (moduleBuildings.length > 0) {
      // Register each building individually
      moduleBuildings.forEach(building => {
        moduleDispatch({
          type: 'REGISTER_BUILDING',
          building,
        });
      });
    }
  }, [moduleDispatch]);

  // Set up event listeners and sync intervals
  useEffect(() => {
    if (!isInitialized || !gameDispatch || !moduleDispatch) return;

    const unsubscribes: Array<() => void> = [];

    // Subscribe to resource events from the resource manager
    RESOURCE_EVENT_TYPES.forEach(eventType => {
      const unsubscribe = resourceManager.subscribeToEvent(eventType, (event: BaseEvent) => {
        syncResourceState();
      });
      unsubscribes.push(unsubscribe);
    });

    // Listen for module events (still using moduleEventBus for backward compatibility)
    MODULE_EVENT_TYPES.forEach(eventType => {
      // Use string type for backward compatibility
      const unsubscribe = moduleEventBus.subscribe(String(eventType), () => {
        syncModuleState();
      });
      unsubscribes.push(unsubscribe);
    });

    // Only set up interval if we don't have a game loop manager
    if (!gameLoopManager) {
      // Set up interval for periodic updates
      intervalRef.current = setInterval(() => {
        syncResourceState();
        syncModuleState();

        // Manually call update on resource manager since we don't have a game loop
        resourceManager.update(updateInterval);
      }, updateInterval);
    }

    // Initial sync
    syncResourceState();
    syncModuleState();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [
    syncResourceState,
    syncModuleState,
    updateInterval,
    isInitialized,
    resourceManager,
    gameLoopManager,
    gameDispatch,
    moduleDispatch,
  ]);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex h-20 items-center justify-center rounded bg-gray-100 p-4 shadow-sm">
        <span className="text-gray-700">Initializing game systems...</span>
      </div>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="flex h-20 items-center justify-center rounded bg-red-100 p-4 shadow-sm">
        <span className="text-red-700">Error initializing systems: {error.message}</span>
      </div>
    );
  }

  // Return children since this component doesn't render anything itself when initialized
  return <>{children}</>;
}

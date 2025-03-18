import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { GameActionType, useGameDispatch } from '../../contexts/GameContext';
import { ModuleActionType, useModuleContext } from '../../contexts/ModuleContext';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { GameLoopManager, UpdatePriority } from '../../managers/game/GameLoopManager';
import { ResourceManager } from '../../managers/game/ResourceManager';
import { moduleManager } from '../../managers/module/ModuleManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { Module } from '../../types/modules/ModuleTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";

interface SystemIntegrationProps {
  children: ReactNode;
  resourceManager: ResourceManager;
  gameLoopManager?: GameLoopManager;
  updateInterval?: number;
}

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
  'MODULE_CREATED',
  'MODULE_UPDATED',
  'STATUS_CHANGED',
  'MODULE_ACTIVATED',
  'MODULE_DEACTIVATED',
] as const;

type ModuleEventType = (typeof MODULE_EVENT_TYPES)[number];

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
  const gameDispatch = useGameDispatch();
  const { dispatch: moduleDispatch } = useModuleContext();

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
        console.warn('Managers initialized successfully');
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
      console.warn('Syncing resource state:', currentResources);

      // Add resource rates to the update if we can calculate them
      let resourceRates = {};

      if (resourceManager.getAllResourceStates) {
        const states = resourceManager.getAllResourceStates();

        // Calculate rates from production and consumption
        resourceRates = {
          mineralRate:
            (states[ResourceType.MINERALS]?.production || 0) -
            (states[ResourceType.MINERALS]?.consumption || 0),
          energyRate:
            (states[ResourceType.ENERGY]?.production || 0) -
            (states[ResourceType.ENERGY]?.consumption || 0),
          populationRate:
            (states[ResourceType.POPULATION]?.production || 0) -
            (states[ResourceType.POPULATION]?.consumption || 0),
          researchRate:
            (states[ResourceType.RESEARCH]?.production || 0) -
            (states[ResourceType.RESEARCH]?.consumption || 0),
        };
      }

      // Update resources with the calculated values
      gameDispatch({
        type: GameActionType.UPDATE_RESOURCES,
        payload: {
          minerals: currentResources[ResourceType.MINERALS] || 0,
          energy: currentResources[ResourceType.ENERGY] || 0,
          population: currentResources[ResourceType.POPULATION] || 0,
          research: currentResources[ResourceType.RESEARCH] || 0,
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
        type: ModuleActionType.SET_ACTIVE_MODULES,
        payload: { activeModuleIds: modules.map(m => m.id) },
      });
    }

    // Update buildings if available
    if (moduleBuildings.length > 0) {
      // Register each building individually
      moduleBuildings.forEach(building => {
        // Convert building to Module type
        const moduleData: Module = {
          id: building.id,
          name: building.id, // Use ID as name if not available
          type: 'resource-manager' as ModuleType, // Default to resource-manager type
          status: 'active', // Default to active
          position: { x: 0, y: 0 }, // Default position
          isActive: true, // Default to active
          level: 1, // Default level
        };

        moduleDispatch({
          type: ModuleActionType.ADD_MODULE,
          payload: { module: moduleData },
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
      const unsubscribe = resourceManager.subscribeToEvent(eventType, (_event: BaseEvent) => {
        syncResourceState();
      });
      unsubscribes.push(unsubscribe);
    });

    // Listen for module events
    MODULE_EVENT_TYPES.forEach(eventType => {
      const unsubscribe = moduleEventBus.subscribe(eventType, () => {
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

import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useModules } from '../../contexts/ModuleContext';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ResourceManager } from '../../managers/game/ResourceManager';
import { moduleManager } from '../../managers/module/ModuleManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';

// Types of resource events to listen for
const RESOURCE_EVENT_TYPES = [
  'RESOURCE_PRODUCED',
  'RESOURCE_CONSUMED',
  'RESOURCE_TRANSFERRED',
  'RESOURCE_SHORTAGE',
  'RESOURCE_PRODUCTION_REGISTERED',
  'RESOURCE_CONSUMPTION_REGISTERED',
];

// Types of module events to listen for
const MODULE_EVENT_TYPES = [
  'MODULE_CREATED',
  'MODULE_ATTACHED',
  'MODULE_DETACHED',
  'MODULE_UPGRADED',
  'MODULE_ACTIVATED',
  'MODULE_DEACTIVATED',
];

type ResourceEventType = (typeof RESOURCE_EVENT_TYPES)[number];
type ModuleEventTypeList = (typeof MODULE_EVENT_TYPES)[number];

interface SystemIntegrationProps {
  children: ReactNode;
  resourceManager: ResourceManager;
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
  updateInterval = 1000,
}: SystemIntegrationProps) {
  const { dispatch: gameDispatch } = useGame();
  const { dispatch: moduleDispatch } = useModules();
  const lastResourceState = useRef<Record<string, number>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync resource state from ResourceManager to GameContext
  const syncResourceState = useCallback(() => {
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

      // Emit an event to notify other systems of the resource update
      moduleEventBus.emit({
        type: 'RESOURCE_UPDATED' as ModuleEventType,
        moduleId: 'resource-manager',
        moduleType: 'resource' as ModuleType,
        timestamp: Date.now(),
        data: {
          resources: {
            ...currentResources,
            ...resourceRates,
            ...production, // Add detailed production data
            ...consumption, // Add detailed consumption data
          },
        },
      });
    }
  }, [gameDispatch, resourceManager]);

  // Sync module state from ModuleManager to ModuleContext
  const syncModuleState = useCallback(() => {
    const moduleBuildings = moduleManager.getBuildings();
    const modules = moduleManager.getActiveModules();

    // Only update if there are modules available
    if (modules.length > 0) {
      moduleDispatch({
        type: 'UPDATE_MODULES',
        modules,
      });
    }

    // Update buildings if available
    if (moduleBuildings.length > 0) {
      moduleDispatch({
        type: 'UPDATE_BUILDINGS',
        buildings: moduleBuildings,
      });
    }
  }, [moduleDispatch]);

  // Set up event listeners and sync intervals
  useEffect(() => {
    const unsubscribes = [];

    // Listen for resource events
    RESOURCE_EVENT_TYPES.forEach(eventType => {
      const unsubscribe = moduleEventBus.subscribe(eventType as ModuleEventType, () => {
        syncResourceState();
      });
      unsubscribes.push(unsubscribe);
    });

    // Listen for module events
    MODULE_EVENT_TYPES.forEach(eventType => {
      const unsubscribe = moduleEventBus.subscribe(eventType as ModuleEventType, () => {
        syncModuleState();
      });
      unsubscribes.push(unsubscribe);
    });

    // Set up interval for periodic updates
    intervalRef.current = setInterval(() => {
      syncResourceState();
      syncModuleState();
    }, updateInterval);

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
  }, [syncResourceState, syncModuleState, updateInterval]);

  // Return children since this component doesn't render anything itself
  return <>{children}</>;
}

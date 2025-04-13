import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { GameActionType, useGameDispatch } from '../../contexts/GameContext';
import { useModuleContext } from '../../contexts/ModuleContext';
import { useErrorHandler } from '../../hooks/errors/useErrorHandler';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { getResourceManager } from '../../managers/ManagerRegistry';
import { errorLoggingService } from '../../services/ErrorLoggingService';
import { EventType } from '../../types/events/EventTypes';
import { ResourceState, ResourceType } from './../../types/resources/ResourceTypes';

interface SystemIntegrationProps {
  children: ReactNode;
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

/**
 * SystemIntegration component
 *
 * This component serves as a bridge between the frontend React contexts and
 * the backend manager classes. It synchronizes state between them and ensures
 * that updates from managers are propagated to the UI.
 */
export function SystemIntegration({ children }: SystemIntegrationProps) {
  const resourceManager = getResourceManager();
  const { logError } = useErrorHandler({ componentName: 'SystemIntegration' });
  const gameDispatch = useGameDispatch();
  const { dispatch: moduleDispatch } = useModuleContext();
  const [isInitialized, setIsInitialized] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await resourceManager.initialize();
        setIsInitialized(true);
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: 'Initialization',
        });
      }
    };
    initialize();
    return () => {
      resourceManager.dispose();
    };
  }, [resourceManager, logError]);

  const syncResourceState = useCallback(() => {
    const state = resourceManager.getAllResourceStates();
    const resourcesPayload: Partial<{
      minerals: number;
      energy: number;
      population: number;
      research: number;
    }> = {};

    Object.entries(state).forEach(([resTypeKey, resState]: [string, ResourceState]) => {
      const resType = ResourceType[resTypeKey as keyof typeof ResourceType];
      if (resType !== undefined) {
        switch (resType) {
          case ResourceType.MINERALS:
            resourcesPayload.minerals = resState.current;
            break;
          case ResourceType.ENERGY:
            resourcesPayload.energy = resState.current;
            break;
          case ResourceType.POPULATION:
            resourcesPayload.population = resState.current;
            break;
          case ResourceType.RESEARCH:
            resourcesPayload.research = resState.current;
            break;
        }
      }
    });
    gameDispatch({ type: GameActionType.UPDATE_RESOURCES, payload: resourcesPayload });
  }, [resourceManager, gameDispatch]);

  const syncModuleState = () => {
    errorLoggingService.logInfo('syncModuleState called - needs review', {
      component: 'SystemIntegration',
      method: 'syncModuleState',
      comment: 'This function appears incomplete or redundant. Review required.',
    });
    // TODO: Review if this function is still necessary or correctly implemented.
    // It seems like it might be duplicating state synchronization handled elsewhere.
  };

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    syncResourceState();
    syncModuleState();

    const unsubResources = moduleEventBus.subscribe(EventType.RESOURCE_UPDATED, syncResourceState);
    const unsubModules = moduleEventBus.subscribe('MODULE_UPDATED', syncModuleState);

    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        resourceManager.update(1000);
      }
    }, 1000);

    return () => {
      unsubResources();
      unsubModules();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isInitialized, syncResourceState, resourceManager]);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex h-20 items-center justify-center rounded bg-gray-100 p-4 shadow-sm">
        <span className="text-gray-700">Initializing game systems...</span>
      </div>
    );
  }

  // Return children since this component doesn't render unknownthing itself when initialized
  return <>{children}</>;
}

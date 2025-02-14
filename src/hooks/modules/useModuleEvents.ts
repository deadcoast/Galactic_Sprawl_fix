import { useEffect, useState } from 'react';
import { moduleEventBus, ModuleEvent, ModuleEventType } from '../../lib/modules/ModuleEvents';

/**
 * Hook to subscribe to module events
 */
export function useModuleEvents(types: ModuleEventType[] = [], moduleId?: string) {
  const [events, setEvents] = useState<ModuleEvent[]>([]);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Subscribe to each event type
    types.forEach(type => {
      const unsubscribe = moduleEventBus.subscribe(type, event => {
        // Filter by moduleId if provided
        if (!moduleId || event.moduleId === moduleId) {
          setEvents(prev => [...prev, event]);
        }
      });
      unsubscribers.push(unsubscribe);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [types, moduleId]);

  return events;
}

/**
 * Hook to subscribe to the last event of specific types
 */
export function useLastModuleEvent(types: ModuleEventType[], moduleId?: string) {
  const events = useModuleEvents(types, moduleId);
  return events[events.length - 1];
}

/**
 * Hook to subscribe to module lifecycle events
 */
export function useModuleLifecycle(moduleId: string) {
  return useModuleEvents(
    [
      'MODULE_CREATED',
      'MODULE_ATTACHED',
      'MODULE_DETACHED',
      'MODULE_UPGRADED',
      'MODULE_ACTIVATED',
      'MODULE_DEACTIVATED',
    ],
    moduleId
  );
}

/**
 * Hook to subscribe to module resource events
 */
export function useModuleResources(moduleId: string) {
  return useModuleEvents(
    ['RESOURCE_PRODUCED', 'RESOURCE_CONSUMED', 'RESOURCE_TRANSFERRED'],
    moduleId
  );
}

/**
 * Hook to subscribe to module automation events
 */
export function useModuleAutomation(moduleId: string) {
  return useModuleEvents(
    ['AUTOMATION_STARTED', 'AUTOMATION_STOPPED', 'AUTOMATION_CYCLE_COMPLETE'],
    moduleId
  );
}

/**
 * Hook to subscribe to module status events
 */
export function useModuleStatus(moduleId: string) {
  return useModuleEvents(['STATUS_CHANGED', 'ERROR_OCCURRED'], moduleId);
}

/**
 * Hook to get module event history
 */
export function useModuleHistory(moduleId?: string) {
  const [history, setHistory] = useState<ModuleEvent[]>([]);

  useEffect(() => {
    if (moduleId) {
      setHistory(moduleEventBus.getModuleHistory(moduleId));
    } else {
      setHistory(moduleEventBus.getHistory());
    }
  }, [moduleId]);

  return history;
}

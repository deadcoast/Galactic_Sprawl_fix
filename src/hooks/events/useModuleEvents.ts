import { useCallback } from 'react';
import { ModuleEvent, moduleEventBus } from '../../lib/events/ModuleEventBus';
import { EventType } from '../../types/events/EventTypes';

/**
 * Hook for subscribing to module events
 */
export function useModuleEvents() {
  const subscribe = useCallback(
    (eventType: EventType | '*', handler: (event: ModuleEvent) => void) => {
      return moduleEventBus.subscribe(eventType, handler);
    },
    []
  );

  const unsubscribe = useCallback(
    (eventType: EventType | '*', handler: (event: ModuleEvent) => void) => {
      console.warn(
        '[useModuleEvents] unsubscribe is deprecated. Use the function returned by subscribe instead.'
      );
      // Get a new subscription and immediately unsubscribe it to maintain backcombatd compatibility
      const unsubscribeFn = moduleEventBus.subscribe(eventType, handler);
      unsubscribeFn();
    },
    []
  );

  return { subscribe, unsubscribe };
}

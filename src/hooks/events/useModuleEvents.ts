/**
 * @file useModuleEvents.ts (hooks/events)
 *
 * Simple module event subscription hook using the canonical ModuleEventBus.
 *
 * NOTE: For more comprehensive module event handling, use the enhanced version in:
 * - hooks/modules/useModuleEvents.ts - Provides specialized hooks for lifecycle,
 *   resource, automation, and status events with proper cleanup.
 *
 * This file is maintained for backward compatibility with existing code that expects
 * the simpler { subscribe, unsubscribe } API.
 *
 * @see ../modules/useModuleEvents.ts - Enhanced implementation (recommended for new code)
 */

import { useCallback } from 'react';
import { ModuleEvent, moduleEventBus } from '../../lib/events/ModuleEventBus';
import { EventType } from '../../types/events/EventTypes';

// Re-export enhanced hooks for convenience
export {
  useModuleEvents as useEnhancedModuleEvents,
  useMultipleModuleEvents,
  useModuleLifecycle,
  useModuleResources,
  useModuleAutomation,
  useModuleStatus,
  MODULE_EVENTS,
} from '../modules/useModuleEvents';

/**
 * Hook for subscribing to module events (simple API)
 *
 * @deprecated Consider using useEnhancedModuleEvents from hooks/modules/useModuleEvents
 * for better automatic cleanup and specialized event subscription.
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

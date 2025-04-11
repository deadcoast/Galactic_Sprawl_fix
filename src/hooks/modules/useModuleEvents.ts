import { useEffect, useRef } from 'react';
// import { EventBus } from '../../lib/events/EventBus'; // Remove local EventBus import
import { BaseEvent, eventSystem } from '../../lib/events/UnifiedEventSystem'; // Import global eventSystem and BaseEvent
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { EventType } from '../../types/events/EventTypes'; // Keep legacy EventType for now
import { ResourceType } from '../../types/resources/ResourceTypes';

// Constants for module event types
export const MODULE_EVENTS = {
  MODULE_CREATED: EventType.MODULE_CREATED,
  MODULE_ATTACHED: EventType.MODULE_ATTACHED,
  MODULE_DETACHED: EventType.MODULE_DETACHED,
  MODULE_UPGRADED: EventType.MODULE_UPGRADED,
  MODULE_ACTIVATED: EventType.MODULE_ACTIVATED,
  MODULE_DEACTIVATED: EventType.MODULE_DEACTIVATED,
  RESOURCE_PRODUCED: EventType.RESOURCE_PRODUCED,
  RESOURCE_CONSUMED: EventType.RESOURCE_CONSUMED,
  RESOURCE_TRANSFERRED: EventType.RESOURCE_TRANSFERRED,
  AUTOMATION_STARTED: EventType.AUTOMATION_STARTED,
  AUTOMATION_STOPPED: EventType.AUTOMATION_STOPPED,
  AUTOMATION_CYCLE_COMPLETE: EventType.AUTOMATION_CYCLE_COMPLETE,
  STATUS_CHANGED: EventType.STATUS_CHANGED,
  ERROR_OCCURRED: EventType.ERROR_OCCURRED,
} as const;

// Update interface to extend correct BaseEvent
// Keep specific fields, assuming ModuleManager publishes them via global eventSystem
interface ModuleManagerEvent extends BaseEvent {
  moduleId: string;
  moduleType: ModuleType;
  buildingId?: string;
  resourceType?: ResourceType;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

// Type guard implementation
function isModuleManagerEvent(event: BaseEvent): event is ModuleManagerEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    typeof (event as ModuleManagerEvent).moduleId === 'string' &&
    typeof (event as ModuleManagerEvent).moduleType === 'string'
    // Add more specific checks if ModuleManagerEvent has unique required fields
  );
}

// Remove local eventBus instance
// const eventBus = new EventBus<ModuleManagerEvent>();

// Remove eventHistory and its population logic
// const eventHistory: ModuleManagerEvent[] = [];
// Object.values(MODULE_EVENTS).forEach(eventType => {
//   eventBus.on(eventType, (event: ModuleManagerEvent) => {
//     eventHistory.push(event);
//     if (eventHistory.length > 1000) {
//       eventHistory.shift();
//     }
//   });
// });

/**
 * Hook for subscribing to module events with automatic cleanup
 */
export function useModuleEvents(
  eventType: EventType | string, // Allow string for flexibility, though enum is standard
  handler: (event: ModuleManagerEvent) => void, // Revert handler type to ModuleManagerEvent
  options: { enabled?: boolean; deps?: React.DependencyList } = {}
): void {
  const { enabled = true, deps = [] } = options;
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler, ...deps]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Subscribe to the global eventSystem
    const unsubscribe = eventSystem.subscribe(eventType as string, (event: BaseEvent) => {
      // Use the type guard
      if (isModuleManagerEvent(event)) {
        handlerRef.current(event);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [eventType, enabled]);
}

/**
 * Hook for subscribing to multiple module events with automatic cleanup
 */
export function useMultipleModuleEvents(
  eventTypes: (EventType | string)[], // Allow string array
  handler: (event: ModuleManagerEvent) => void, // Revert handler type to ModuleManagerEvent
  options: { enabled?: boolean; deps?: React.DependencyList } = {}
): void {
  const { enabled = true, deps = [] } = options;
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler, ...deps]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unsubscribers = eventTypes.map(eventType =>
      // Subscribe to the global eventSystem
      eventSystem.subscribe(eventType as string, (event: BaseEvent) => {
        // Use the type guard
        if (isModuleManagerEvent(event)) {
          handlerRef.current(event);
        }
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [JSON.stringify(eventTypes), enabled]); // Stringify array for dependency check
}

/**
 * Hook for subscribing to module lifecycle events
 */
export function useModuleLifecycle(
  moduleId: string,
  handler: (event: ModuleManagerEvent) => void
): void {
  useMultipleModuleEvents(
    [
      MODULE_EVENTS.MODULE_CREATED,
      MODULE_EVENTS.MODULE_ATTACHED,
      MODULE_EVENTS.MODULE_DETACHED,
      MODULE_EVENTS.MODULE_UPGRADED,
      MODULE_EVENTS.MODULE_ACTIVATED,
      MODULE_EVENTS.MODULE_DEACTIVATED,
    ],
    handler,
    { deps: [moduleId] }
  );
}

/**
 * Hook for subscribing to module resource events
 */
export function useModuleResources(
  moduleId: string,
  handler: (event: ModuleManagerEvent) => void
): void {
  useMultipleModuleEvents(
    [
      MODULE_EVENTS.RESOURCE_PRODUCED,
      MODULE_EVENTS.RESOURCE_CONSUMED,
      MODULE_EVENTS.RESOURCE_TRANSFERRED,
    ],
    handler,
    { deps: [moduleId] }
  );
}

/**
 * Hook for subscribing to module automation events
 */
export function useModuleAutomation(
  moduleId: string,
  handler: (event: ModuleManagerEvent) => void
): void {
  useMultipleModuleEvents(
    [
      MODULE_EVENTS.AUTOMATION_STARTED,
      MODULE_EVENTS.AUTOMATION_STOPPED,
      MODULE_EVENTS.AUTOMATION_CYCLE_COMPLETE,
    ],
    handler,
    { deps: [moduleId] }
  );
}

/**
 * Hook for subscribing to module status events
 */
export function useModuleStatus(
  moduleId: string,
  handler: (event: ModuleManagerEvent) => void
): void {
  useMultipleModuleEvents([MODULE_EVENTS.STATUS_CHANGED, MODULE_EVENTS.ERROR_OCCURRED], handler, {
    deps: [moduleId],
  });
}

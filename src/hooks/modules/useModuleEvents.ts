import { useEffect, useRef, useState } from 'react';
import { EventBus } from '../../lib/events/EventBus';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
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

interface ModuleManagerEvent extends BaseEvent {
  moduleId: string;
  moduleType: ModuleType;
  buildingId?: string;
  resourceType?: ResourceType;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

// Get the global event bus instance
const eventBus = new EventBus<ModuleManagerEvent>();

// Keep track of event history
const eventHistory: ModuleManagerEvent[] = [];

// Subscribe to all event types to maintain history
Object.values(MODULE_EVENTS).forEach(eventType => {
  eventBus.on(eventType, (event: ModuleManagerEvent) => {
    eventHistory.push(event);
    // Keep history size manageable
    if (eventHistory.length > 1000) {
      eventHistory.shift();
    }
  });
});

/**
 * Hook for subscribing to module events with automatic cleanup
 */
export function useModuleEvents(
  eventType: EventType,
  handler: (event: ModuleManagerEvent) => void,
  options: { enabled?: boolean; deps?: React.DependencyList } = {}
): void {
  const { enabled = true, deps = [] } = options;
  const handlerRef = useRef(handler);

  // Update handler ref when dependencies change
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler, ...deps]);

  // Subscribe to events with cleanup
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = eventBus.on(eventType, (event: ModuleManagerEvent) => {
      handlerRef.current(event);
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
  eventTypes: EventType[],
  handler: (event: ModuleManagerEvent) => void,
  options: { enabled?: boolean; deps?: React.DependencyList } = {}
): void {
  const { enabled = true, deps = [] } = options;
  const handlerRef = useRef(handler);

  // Update handler ref when dependencies change
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler, ...deps]);

  // Subscribe to events with cleanup
  useEffect(() => {
    if (!enabled) return;

    const unsubscribers = eventTypes.map(eventType =>
      eventBus.on(eventType, (event: ModuleManagerEvent) => {
        handlerRef.current(event);
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [eventTypes, enabled]);
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

/**
 * Hook to get module event history
 */
export function useModuleHistory(moduleId?: string): ModuleManagerEvent[] {
  const [history, setHistory] = useState<ModuleManagerEvent[]>([]);

  useEffect(() => {
    if (moduleId) {
      setHistory(eventHistory.filter((event: ModuleManagerEvent) => event.moduleId === moduleId));
    } else {
      setHistory([...eventHistory]);
    }
  }, [moduleId]);

  return history;
}

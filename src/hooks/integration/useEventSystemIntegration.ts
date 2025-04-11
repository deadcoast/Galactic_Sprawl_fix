/**
 * @context: ui-system, event-system, hooks-library
 *
 * Hook for integrating UI components with the Event System
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { moduleEventBus } from '../../lib/events/ModuleEventBus';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';
import { BaseEvent, EventType } from '../../types/events/EventTypes';

/**
 * Hook for subscribing to a single event type
 * Automatically handles unsubscribing when the component unmounts
 *
 * @param eventType The event type to subscribe to
 * @param handler The event handler function
 * @param deps Optional dependency array for the handler
 */
export function useEventSubscription(
  eventType: EventType,
  handler: (event: BaseEvent) => void,
  deps: unknown[] = []
) {
  // Use ref to store the handler to prevent unnecessary re-subscriptions
  const handlerRef = useRef(handler);

  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Subscribe to the event and return cleanup function
  useEffect(() => {
    const wrappedHandler = (event: BaseEvent) => {
      handlerRef.current(event);
    };

    return moduleEventBus.subscribe(eventType, wrappedHandler);
  }, [eventType, ...deps]); // Include deps in the dependency array
}

/**
 * Hook for subscribing to multiple event types
 * Automatically handles unsubscribing when the component unmounts
 *
 * @param eventTypes Array of event types to subscribe to
 * @param handler The event handler function
 * @param deps Optional dependency array for the handler
 */
export function useMultiEventSubscription(
  eventTypes: EventType[],
  handler: (event: BaseEvent) => void,
  deps: unknown[] = []
) {
  // Use ref to store the handler to prevent unnecessary re-subscriptions
  const handlerRef = useRef(handler);

  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Set up subscriptions
  useEffect(() => {
    if (!eventTypes.length) return;

    const unsubscribes: Array<() => void> = [];

    try {
      // Subscribe to each event type
      eventTypes.forEach(eventType => {
        const unsubscribe = moduleEventBus.subscribe(eventType, event => {
          try {
            handlerRef.current(event);
          } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));

            // Log error
            errorLoggingService.logError(error, ErrorType.EVENT_HANDLING, ErrorSeverity.MEDIUM, {
              component: 'useMultiEventSubscription',
              eventType,
              eventData: JSON.stringify(event),
            });
          }
        });

        unsubscribes.push(unsubscribe);
      });

      // Return cleanup function that calls all unsubscribe functions
      return () => {
        unsubscribes.forEach(unsubscribe => unsubscribe());
      };
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));

      // Log error
      errorLoggingService.logError(error, ErrorType.EVENT_HANDLING, ErrorSeverity.HIGH, {
        component: 'useMultiEventSubscription',
        eventTypes: JSON.stringify(eventTypes),
        message: 'Failed to set up event subscriptions',
      });

      // Clean up unknown successful subscriptions
      unsubscribes.forEach(unsubscribe => unsubscribe());

      // Return empty cleanup function
      return () => {};
    }
  }, [JSON.stringify(eventTypes), ...deps]);
}

/**
 * Hook for monitoring recent events
 *
 * @param options Configuration options for event monitoring
 * @returns Object containing recent events and event-related functions
 */
export function useEventMonitor(
  options: {
    maxEvents?: number;
    eventTypes?: EventType[];
    filter?: (event: BaseEvent) => boolean;
  } = {}
) {
  const { maxEvents = 10, eventTypes, filter } = options;
  const [events, setEvents] = useState<BaseEvent[]>([]);

  // Set up event subscription
  useEffect(() => {
    // Determine which event types to subscribe to
    const typesToMonitor = eventTypes || Object.values(EventType);

    // Subscribe to events
    const unsubscribe = moduleEventBus.subscribeToMunknown(typesToMonitor, (event: BaseEvent) => {
      // Apply filter if provided
      if (filter && !filter(event)) {
        return;
      }

      // Update events state
      setEvents(prev => {
        // Add new event to beginning of array
        const newEvents = [event, ...prev];

        // Limit to maxEvents
        if (newEvents.length > maxEvents) {
          return newEvents.slice(0, maxEvents);
        }

        return newEvents;
      });
    });

    // Return cleanup function
    return unsubscribe;
  }, [maxEvents, JSON.stringify(eventTypes), filter]);

  // Function to clear events
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Function to emit an event
  const emitEvent = useCallback((event: BaseEvent) => {
    try {
      moduleEventBus.emit(event);
      return true;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));

      // Log error
      errorLoggingService.logError(error, ErrorType.EVENT_HANDLING, ErrorSeverity.MEDIUM, {
        component: 'useEventMonitor.emitEvent',
        eventType: event.type,
        eventData: JSON.stringify(event),
      });

      return false;
    }
  }, []);

  return {
    events,
    clearEvents,
    emitEvent,
  };
}

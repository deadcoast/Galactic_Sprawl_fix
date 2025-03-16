/**
 * @file useEventSubscription.ts
 * React hook for subscribing to events with automatic cleanup on component unmount.
 *
 * This hook provides:
 * 1. Type-safe event subscription
 * 2. Automatic cleanup on component unmount
 * 3. Optional filtering of events based on provided criteria
 * 4. Performance tracking of event handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { EventBus, EventListener, SubscriptionOptions } from '../../lib/events/EventBus';
import {
  BaseEvent,
  EventCategory,
  EventType,
  getEventTypesByCategory,
} from '../../types/events/EventTypes';

/**
 * Options for useEventSubscription hook
 */
export interface EventSubscriptionOptions<T extends BaseEvent = BaseEvent>
  extends SubscriptionOptions {
  /**
   * (...args: unknown[]) => unknown to filter events before handling
   */
  filter?: (event: T) => boolean;

  /**
   * Whether to track the latest received event
   */
  trackLatest?: boolean;

  /**
   * Whether the subscription is enabled
   * Can be used to conditionally enable/disable the subscription
   */
  enabled?: boolean;

  /**
   * Dependency array that will trigger resubscription when changed
   */
  deps?: React.DependencyList;
}

/**
 * Hook for subscribing to events with automatic cleanup
 * @param eventBus The event bus to subscribe to
 * @param eventType The type of event to subscribe to
 * @param handler (...args: unknown[]) => unknown to handle the event
 * @param options Additional subscription options
 * @returns Object containing information about the subscription
 */
export function useEventSubscription<T extends BaseEvent = BaseEvent>(
  eventBus: EventBus<T>,
  eventType: EventType | '*',
  handler: EventListener<T>,
  options: EventSubscriptionOptions<T> = {}
): {
  latestEvent: T | null;
  subscribed: boolean;
  receivedCount: number;
} {
  const {
    filter,
    trackLatest = false,
    enabled = true,
    deps = [],
    ...subscriptionOptions
  } = options;

  // Track the latest event if requested
  const [latestEvent, setLatestEvent] = useState<T | null>(null);

  // Track whether we're subscribed and how many events we've received
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const receivedCountRef = useRef<number>(0);

  // Track the unsubscribe function
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Memoize the handler function to include filtering
  const eventHandler = useCallback(
    (event: T) => {
      // Apply filter if provided
      if (filter && !filter(event)) {
        return;
      }

      // Update latest event if tracking
      if (trackLatest) {
        setLatestEvent(event);
      }

      // Increment received count
      receivedCountRef.current += 1;

      // Call handler
      handler(event);
    },
    [filter, trackLatest, handler]
  );

  // Subscribe to the event and handle cleanup
  useEffect(() => {
    // Clean up previous subscription if exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setSubscribed(false);
    }

    // Only subscribe if enabled
    if (!enabled) {
      return;
    }

    // Subscribe to the event
    const unsubscribe = eventBus.subscribe(eventType, eventHandler, {
      ...subscriptionOptions,
      source: 'useEventSubscription',
    });

    // Store the unsubscribe function and update status
    unsubscribeRef.current = unsubscribe;
    setSubscribed(true);

    // Clean up on unmount or when dependencies change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        setSubscribed(false);
      }
    };
  }, [eventBus, eventType, eventHandler, enabled, ...deps]);

  return {
    latestEvent,
    subscribed,
    receivedCount: receivedCountRef.current,
  };
}

/**
 * Hook for subscribing to events in a specific category
 * @param eventBus The event bus to subscribe to
 * @param category The category of events to subscribe to
 * @param handler (...args: unknown[]) => unknown to handle the events
 * @param options Additional subscription options
 * @returns Object containing information about the subscription
 */
export function useEventCategorySubscription<T extends BaseEvent = BaseEvent>(
  eventBus: EventBus<T>,
  category: EventCategory,
  handler: EventListener<T>,
  options: EventSubscriptionOptions<T> = {}
): {
  latestEvents: Record<EventType, T | null>;
  subscribed: boolean;
  receivedCount: number;
} {
  const {
    filter,
    trackLatest = false,
    enabled = true,
    deps = [],
    ...subscriptionOptions
  } = options;

  // Get all event types in this category
  const eventTypes = getEventTypesByCategory(category);

  // Track latest events if requested
  const [latestEvents, setLatestEvents] = useState<Record<EventType, T | null>>(
    {} as Record<EventType, T | null>
  );

  // Track whether we're subscribed and how many events we've received
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const receivedCountRef = useRef<number>(0);

  // Track the unsubscribe function
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Memoize the handler function to include filtering
  const eventHandler = useCallback(
    (event: T) => {
      // Apply filter if provided
      if (filter && !filter(event)) {
        return;
      }

      // Update latest events if tracking
      if (trackLatest) {
        setLatestEvents(prev => ({
          ...prev,
          [event.type]: event,
        }));
      }

      // Increment received count
      receivedCountRef.current += 1;

      // Call handler
      handler(event);
    },
    [filter, trackLatest, handler]
  );

  // Subscribe to the events and handle cleanup
  useEffect(() => {
    // Clean up previous subscription if exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setSubscribed(false);
    }

    // Only subscribe if enabled
    if (!enabled) {
      return;
    }

    // Subscribe to all event types in the category
    const unsubscribe = eventBus.subscribeToCategory(category, eventHandler, {
      ...subscriptionOptions,
      source: 'useEventCategorySubscription',
    });

    // Store the unsubscribe function and update status
    unsubscribeRef.current = unsubscribe;
    setSubscribed(true);

    // Initialize latestEvents with null for each event type if tracking
    if (trackLatest) {
      const initialLatestEvents = {} as Record<EventType, T | null>;
      eventTypes.forEach(type => {
        initialLatestEvents[type] = null;
      });
      setLatestEvents(initialLatestEvents);
    }

    // Clean up on unmount or when dependencies change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        setSubscribed(false);
      }
    };
  }, [eventBus, category, eventHandler, enabled, trackLatest, ...deps]);

  return {
    latestEvents,
    subscribed,
    receivedCount: receivedCountRef.current,
  };
}

/**
 * Hook for accessing the latest event of a specific type without subscribing to updates
 * @param eventBus The event bus to get the latest event from
 * @param eventType The type of event to get
 * @returns The latest event of the specified type, or null if none exists
 */
export function useLatestEvent<T extends BaseEvent = BaseEvent>(
  eventBus: EventBus<T>,
  eventType: EventType
): T | null {
  const [latestEvent, setLatestEvent] = useState<T | null>(null);

  useEffect(() => {
    // Get the latest event from the event bus
    const latest = eventBus.getLatestEvent(eventType);
    if (latest) {
      setLatestEvent(latest);
    }
  }, [eventBus, eventType]);

  return latestEvent;
}

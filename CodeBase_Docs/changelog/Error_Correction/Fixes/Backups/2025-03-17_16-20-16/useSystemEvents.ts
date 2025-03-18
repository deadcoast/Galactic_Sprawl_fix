import { useEffect, useRef } from 'react';
import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { EventPayload, useGlobalEvents } from '../game/useGlobalEvents';

type ModuleEventHandler = (event: ModuleEvent) => void;
type GlobalEventHandler = (payload: EventPayload) => void;

/**
 * Custom hook for subscribing to module events with automatic cleanup.
 * This hook makes it easy for UI components to register for relevant events
 * and have their subscriptions cleaned up when they unmount.
 *
 * @param eventType The type of module event to subscribe to
 * @param handler The function to call when the event occurs
 * @param dependencies Optional array of dependencies for the handler
 */
export function useModuleEvents(
  eventType: ModuleEventType,
  handler: ModuleEventHandler,
  dependencies: React.DependencyList = []
): void {
  // Use a ref to store the handler to prevent unnecessary re-subscriptions
  const handlerRef = useRef<ModuleEventHandler>(handler);

  // Update the handler ref when dependencies change
  useEffect(() => {
    handlerRef.current = handler;
  }, [...dependencies, handler]);

  // Subscribe to the event and clean up on unmount
  useEffect(() => {
    const unsubscribe = moduleEventBus.subscribe(eventType, (event: ModuleEvent) => {
      handlerRef.current(event);
    });

    return () => {
      unsubscribe();
    };
  }, [eventType]);
}

/**
 * Custom hook for subscribing to global game events with automatic cleanup.
 *
 * @param eventName The name of the global event to subscribe to
 * @param handler The function to call when the event occurs
 * @param dependencies Optional array of dependencies for the handler
 */
export function useGlobalSystemEvents(
  eventName: string,
  handler: GlobalEventHandler,
  dependencies: React.DependencyList = []
): void {
  const { subscribeToEvent } = useGlobalEvents();

  // Use a ref to store the handler to prevent unnecessary re-subscriptions
  const handlerRef = useRef<GlobalEventHandler>(handler);

  // Update the handler ref when dependencies change
  useEffect(() => {
    handlerRef.current = handler;
  }, [...dependencies, handler]);

  // Subscribe to the event and clean up on unmount
  useEffect(() => {
    const unsubscribe = subscribeToEvent(eventName, (payload: EventPayload) => {
      handlerRef.current(payload);
    });

    return () => {
      unsubscribe();
    };
  }, [eventName, subscribeToEvent]);
}

/**
 * Helper hook to subscribe to multiple module events at once.
 *
 * @param subscriptions Array of module event subscriptions
 */
export function useMultipleModuleEvents(
  subscriptions: Array<{
    eventType: ModuleEventType;
    handler: ModuleEventHandler;
    dependencies?: React.DependencyList;
  }>
): void {
  subscriptions.forEach(({ eventType, handler, dependencies = [] }) => {
    useModuleEvents(eventType, handler, dependencies);
  });
}

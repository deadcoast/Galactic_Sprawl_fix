/**
 * @file MockManagerFactory.ts
 * Factory functions for creating mock managers for testing
 *
 * This file provides utility functions to create specialized mock managers
 * that implement the interfaces defined in SharedManagerTypes.ts
 */

import { EventType } from '../events/EventTypes';
import { BaseEvent, EventBus } from '../events/SharedEventTypes';
import
  {
    EventCapableManager,
    MockEventManager,
    MockStateManager,
    StateManager,
    createMockManager,
  } from './SharedManagerTypes';

/**
 * Creates a mock event manager for testing
 * @param partialImplementation Partial implementation of an event manager
 * @param type Manager type
 * @param id Manager ID
 * @returns Mock event manager
 */
export function createMockEventManager<E extends BaseEvent = BaseEvent>(
  partialImplementation: Partial<EventCapableManager<E>> = {},
  type = 'mockEventManager',
  id?: string
): EventCapableManager<E> & MockEventManager<E> {
  // Track emitted events and subscriptions
  const emittedEvents: E[] = [];
  const subscriptions = new Map<string, ((data: E) => void)[]>();
  const subscriptionIdCounter = { value: 0 };

  // Create a simple event bus implementation  
  const eventBus: Partial<EventBus<E>> & {
    emit: (event: E) => boolean;
    on: <TEventData = unknown>(eventName: string, handler: (data: TEventData) => void) => () => void;
    off: <TEventData = unknown>(eventName: string, handler: (data: TEventData) => void) => void;
    subscribe: (eventType: EventType | '*', handler: (event: E) => void) => () => void;
    unsubscribe: (subscriptionId: string) => void;
    subscribeMultiple: (eventTypes: string[], handler: (event: E) => void) => () => void;
  } = {
    // Basic EventEmitter methods
    emit: (event: E) => {
      emittedEvents.push(event);
      const handlers = subscriptions.get(event?.type) ?? [];
      handlers.forEach(handler => handler(event));
      return true;
    },

    on: <TEventData = unknown>(eventName: string, handler: (data: TEventData) => void) => {
      const handlers = subscriptions.get(eventName) ?? [];
      handlers.push(handler as unknown as (data: E) => void);
      subscriptions.set(eventName, handlers);
      return () => {
        const currentHandlers = subscriptions.get(eventName) ?? [];
        const index = currentHandlers.indexOf(handler as unknown as (data: E) => void);
        if (index !== -1) {
          currentHandlers.splice(index, 1);
          subscriptions.set(eventName, currentHandlers);
        }
      };
    },

    off: <TEventData = unknown>(eventName: string, handler: (data: TEventData) => void) => {
      const handlers = subscriptions.get(eventName) ?? [];
      const index = handlers.indexOf(handler as unknown as (data: E) => void);
      if (index !== -1) {
        handlers.splice(index, 1);
        subscriptions.set(eventName, handlers);
      }
    },

    // Extended EventBus methods
    subscribe: (eventType: EventType | '*', handler: (event: E) => void) => {
      return eventBus.on(eventType as string, handler);
    },

    unsubscribe: (subscriptionId: string) => {
      // For simplicity, we'll clear all subscriptions for this mock implementation
      // In a real implementation, you'd track subscription IDs and remove specific ones
      console.warn(`Mock unsubscribe called with ID ${subscriptionId}, but not fully implemented`);
    },

    subscribeMultiple: (eventTypes: string[], handler: (event: E) => void) => {
      const unsubscribers: (() => void)[] = eventTypes.map(type =>
        eventBus.on(type, handler)
      );

      // Return combined unsubscribe function
      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    },


  };

  // Create the mock event manager
  return createMockManager<EventCapableManager<E> & MockEventManager<E>>(
    {
      // Event manager methods
      subscribeToEvent: (type: string, handler: (event: E) => void) => {
        return eventBus.on(type, handler) ?? (() => {});
      },

      unsubscribeFromEvent: (type: string, handler: (event: E) => void) => {
        eventBus.off(type, handler);
      },

      emitEvent: (event: E) => {
        eventBus.emit(event);
      },

      getEventBus: () => eventBus as unknown as EventBus<E>,

      // Mock event manager methods
      getEmittedEvents: () => [...emittedEvents],

      getEventSubscriptions: () => new Map(subscriptions),

      mockEmitEvent: (event: E) => {
        emittedEvents.push(event);
        const handlers = subscriptions.get(event?.type) ?? [];
        handlers.forEach(handler => handler(event));
      },

      ...partialImplementation,
    },
    type,
    id
  );
}

/**
 * Creates a mock state manager for testing
 * @param initialState Initial state
 * @param partialImplementation Partial implementation of a state manager
 * @param type Manager type
 * @param id Manager ID
 * @returns Mock state manager
 */
export function createMockStateManager<T>(
  initialState: T,
  partialImplementation: Partial<StateManager<T>> = {},
  type = 'mockStateManager',
  id?: string
): StateManager<T> & MockStateManager<T> {
  // Track state history
  const stateHistory: T[] = [initialState];
  let currentState = { ...initialState };

  // Create the mock state manager
  return createMockManager<StateManager<T> & MockStateManager<T>>(
    {
      // State manager methods
      getState: () => ({ ...currentState }) as T,

      setState: (state: Partial<T>) => {
        currentState = { ...currentState, ...state };
        stateHistory.push({ ...currentState });
      },

      resetState: () => {
        currentState = { ...initialState };
        stateHistory.push({ ...currentState });
      },

      // Mock state manager methods
      getStateHistory: () => [...stateHistory],

      simulateStateChange: (state: Partial<T>) => {
        currentState = { ...currentState, ...state };
        stateHistory.push({ ...currentState });
      },

      ...partialImplementation,
    },
    type,
    id
  );
}

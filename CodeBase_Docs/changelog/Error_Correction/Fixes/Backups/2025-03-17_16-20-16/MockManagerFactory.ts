/**
 * @file MockManagerFactory.ts
 * Factory functions for creating mock managers for testing
 *
 * This file provides utility functions to create specialized mock managers
 * that implement the interfaces defined in SharedManagerTypes.ts
 */

import { BaseEvent, EventBus } from '../events/SharedEventTypes';
import {
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
  type: string = 'mockEventManager',
  id?: string
): EventCapableManager<E> & MockEventManager<E> {
  // Track emitted events and subscriptions
  const emittedEvents: E[] = [];
  const subscriptions = new Map<string, Array<(event: E) => void>>();

  // Create a simple event bus implementation
  const eventBus: EventBus<E> = {
    // Basic EventEmitter methods
    emit: (event: E) => {
      emittedEvents.push(event);
      const handlers = subscriptions.get(event.type) || [];
      handlers.forEach(handler => handler(event));
      return true;
    },

    on: (eventType: string, handler: (event: E) => void) => {
      const handlers = subscriptions.get(eventType) || [];
      handlers.push(handler);
      subscriptions.set(eventType, handlers);
      return () => {
        const currentHandlers = subscriptions.get(eventType) || [];
        const index = currentHandlers.indexOf(handler);
        if (index !== -1) {
          currentHandlers.splice(index, 1);
          subscriptions.set(eventType, currentHandlers);
        }
      };
    },

    off: (eventType: string, handler: (event: E) => void) => {
      const handlers = subscriptions.get(eventType) || [];
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        subscriptions.set(eventType, handlers);
      }
    },

    // Extended EventBus methods
    subscribe: (eventType: string, handler: (event: E) => void) => {
      return eventBus.on(eventType, handler);
    },

    unsubscribe: (eventType: string, handler: (event: E) => void) => {
      eventBus.off(eventType, handler);
    },

    subscribeToMultiple: (eventTypes: string[], handler: (event: E) => void) => {
      const unsubscribers: Array<() => void> = eventTypes.map(type =>
        eventBus.subscribe(type, handler)
      );

      // Return combined unsubscribe function
      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    },

    clear: () => {
      subscriptions.clear();
    },
  };

  // Create the mock event manager
  return createMockManager<EventCapableManager<E> & MockEventManager<E>>(
    {
      // Event manager methods
      subscribeToEvent: (type: string, handler: (event: E) => void) => {
        return eventBus.on(type, handler);
      },

      unsubscribeFromEvent: (type: string, handler: (event: E) => void) => {
        eventBus.off(type, handler);
      },

      emitEvent: (event: E) => {
        eventBus.emit(event);
      },

      getEventBus: () => eventBus,

      // Mock event manager methods
      getEmittedEvents: () => [...emittedEvents],

      getEventSubscriptions: () => new Map(subscriptions),

      mockEmitEvent: (event: E) => {
        emittedEvents.push(event);
        const handlers = subscriptions.get(event.type) || [];
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
  type: string = 'mockStateManager',
  id?: string
): StateManager<T> & MockStateManager<T> {
  // Track state history
  const stateHistory: T[] = [initialState];
  let currentState = { ...initialState };

  // Create the mock state manager
  return createMockManager<StateManager<T> & MockStateManager<T>>(
    {
      // State manager methods
      getState: () => ({ ...currentState }),

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

/**
 * @file MockManagerFactory.ts
 * Factory functions for creating mock managers for testing
 *
 * This file provides utility functions to create specialized mock managers
 * that implement the interfaces defined in SharedManagerTypes.ts
 */

import { BaseEvent } from '../events/SharedEventTypes';
import
  {
    EventCapableManager,
    MockEventManager, MockStateManager,
    StateManager
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
  id = `mock-${type}-${Math.random().toString(36).substr(2, 9)}`
): EventCapableManager<E> & MockEventManager<E> {
  // Track emitted events and subscriptions
  const emittedEvents: E[] = [];
  const subscriptions = new Map<string, ((event: E) => void)[]>();

  // Create minimal event bus mock that satisfies the interface
  const createMockEventBus = () => {
    const mockBus = {
      // Add minimal required properties to satisfy EventBus interface
      subscriptions: new Map(),
      history: [],
      latestEvents: new Map(),
      maxHistorySize: 100,
      
      // Core methods that are actually used
      emit: (event: E) => {
        emittedEvents.push(event);
        const handlers = subscriptions.get(event?.type) ?? [];
        handlers.forEach(handler => handler(event));
        return true;
      },
      
      on: (eventName: string, handler: (event: E) => void) => {
        const handlers = subscriptions.get(eventName) ?? [];
        handlers.push(handler);
        subscriptions.set(eventName, handlers);
        return () => {
          const currentHandlers = subscriptions.get(eventName) ?? [];
          const index = currentHandlers.indexOf(handler);
          if (index !== -1) {
            currentHandlers.splice(index, 1);
            subscriptions.set(eventName, currentHandlers);
          }
        };
      },
      
      off: (eventName: string, handler: (event: E) => void) => {
        const handlers = subscriptions.get(eventName) ?? [];
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
          subscriptions.set(eventName, handlers);
        }
      },
    };
    
    // Add all other required properties with default implementations
    return new Proxy(mockBus, {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop as keyof typeof target];
        }
        // Return a no-op function for any missing methods
        return () => undefined;
      }
    });
  };

  // Create complete implementation
  const completeImplementation: EventCapableManager<E> & MockEventManager<E> = {
    // Base manager properties
    id,
    type,
    isInitialized: false,

    // Base manager methods
    initialize: () => Promise.resolve(),
    dispose: () => {
      // Clean up subscriptions and events
      subscriptions.clear();
      emittedEvents.length = 0;
    },

    // Event manager methods
    subscribeToEvent: (eventType: string, handler: (event: E) => void) => {
      const handlers = subscriptions.get(eventType) ?? [];
      handlers.push(handler);
      subscriptions.set(eventType, handlers);
      return () => {
        const currentHandlers = subscriptions.get(eventType) ?? [];
        const index = currentHandlers.indexOf(handler);
        if (index !== -1) {
          currentHandlers.splice(index, 1);
          subscriptions.set(eventType, currentHandlers);
        }
      };
    },

    unsubscribeFromEvent: (eventType: string, handler: (event: E) => void) => {
      const handlers = subscriptions.get(eventType) ?? [];
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        subscriptions.set(eventType, handlers);
      }
    },

    emitEvent: (event: E) => {
      emittedEvents.push(event);
      const handlers = subscriptions.get(event?.type) ?? [];
      handlers.forEach(handler => handler(event));
    },

    getEventBus: () => {
      // Return a mock event bus that implements the minimum required interface
      const mockEventBus = createMockEventBus();
      // Type assertion is necessary here for mock implementations in testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
      return mockEventBus as any;
    },

    // Mock event manager methods
    getEmittedEvents: () => [...emittedEvents],

    getEventSubscriptions: () => new Map(subscriptions),

    mockEmitEvent: (event: E) => {
      emittedEvents.push(event);
      const handlers = subscriptions.get(event?.type) ?? [];
      handlers.forEach(handler => handler(event));
    },

    // Mock manager methods
    mockClear: () => {
      emittedEvents.length = 0;
      subscriptions.clear();
    },

    mockReset: () => {
      emittedEvents.length = 0;
      subscriptions.clear();
    },

    getMockCalls: () => ({}),

    // Apply partial implementation overrides
    ...partialImplementation,
  };

  return completeImplementation;
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
  id = `mock-${type}-${Math.random().toString(36).substr(2, 9)}`
): StateManager<T> & MockStateManager<T> {
  // Track state history
  const stateHistory: T[] = [initialState];
  let currentState = { ...initialState };

  // Create complete implementation
  const completeImplementation: StateManager<T> & MockStateManager<T> = {
    // Base manager properties
    id,
    type,
    isInitialized: false,

    // Base manager methods
    initialize: () => Promise.resolve(),
    dispose: () => {
      // Reset to initial state on disposal
      currentState = { ...initialState };
      stateHistory.length = 0;
      stateHistory.push(initialState);
    },

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

    // Mock manager methods
    mockClear: () => {
      stateHistory.length = 0;
      stateHistory.push({ ...currentState });
    },

    mockReset: () => {
      currentState = { ...initialState };
      stateHistory.length = 0;
      stateHistory.push(initialState);
    },

    getMockCalls: () => ({}),

    // Apply partial implementation overrides
    ...partialImplementation,
  };

  return completeImplementation;
}

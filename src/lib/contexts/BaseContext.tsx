/**
 * @file BaseContext.tsx
 * Provides a standardized template for context providers in the application.
 *
 * This file implements:
 * 1. A consistent pattern for context creation and usage
 * 2. Built-in error handling and loading states
 * 3. Performance optimization through memoization and context selectors
 * 4. Standard connection pattern to manager services
 * 5. Standardized state update mechanisms
 */

import * as React from 'react';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { EventBus } from '../events/EventBus';

/**
 * Base state interface with common properties for all contexts
 */
export interface BaseState {
  /**
   * Whether the context is currently loading data
   */
  isLoading: boolean;

  /**
   * Error message if an error occurred
   */
  error: string | null;

  /**
   * Last time the state was updated
   */
  lastUpdated: number;
}

/**
 * Base action interface for all context actions
 */
export interface BaseAction<T extends string = string> {
  /**
   * The type of action being performed
   */
  type: T;

  /**
   * The payload for the action
   */
  payload?: unknown;
}

/**
 * Special action type for internal event-based updates
 */
export interface UpdateFromEventAction<TState extends BaseState>
  extends BaseAction<'UPDATE_FROM_EVENT'> {
  payload: TState;
}

/**
 * Selector function signature for extracting specific parts of state
 */
export type Selector<TState extends BaseState, TSelected> = (state: TState) => TSelected;

/**
 * Type for manager method
 */
export type ManagerMethod<TManager, TArgs extends unknown[] = unknown[], TReturn = unknown> = (
  manager: TManager,
  ...args: TArgs
) => TReturn;

/**
 * Manager interaction configuration
 */
export interface ManagerConfig<TManager> {
  /**
   * The manager instance to interact with
   */
  manager: TManager;

  /**
   * Methods to call on the manager from the context
   */
  methods: Record<string, ManagerMethod<TManager>>;

  /**
   * Events to subscribe to from the manager (if it uses an event bus)
   */
  events?: {
    /**
     * The event bus to subscribe to
     */
    eventBus: EventBus<BaseEvent>;

    /**
     * Map of event types to state update handlers
     */
    subscriptions: Record<EventType, (event: BaseEvent, draft: unknown) => void>;
  };
}

/**
 * Event handler function type
 */
export type EventHandler<TAction extends BaseAction> = (
  event: BaseEvent,
  dispatch: React.Dispatch<TAction>
) => void;

/**
 * Options for creating a context
 */
export interface ContextOptions<TState extends BaseState, TAction extends BaseAction> {
  /**
   * The name of the context (used for debugging)
   */
  name: string;

  /**
   * The initial state of the context
   */
  initialState: TState;

  /**
   * The reducer function for the context
   */
  reducer: (state: TState, action: TAction) => TState;

  /**
   * Event subscription options
   */
  eventSubscriptions?: {
    /**
     * Event bus to subscribe to
     */
    eventBus: EventBus<BaseEvent>;

    /**
     * Event types to subscribe to and their handlers
     */
    subscriptions: Record<EventType, EventHandler<TAction>>;
  };

  /**
   * Performance monitoring configuration
   */
  performanceMonitoring?: {
    /**
     * Whether to enable performance monitoring
     */
    enabled: boolean;

    /**
     * Threshold in milliseconds for slow reducer warnings
     */
    reducerThreshold?: number;

    /**
     * Threshold in milliseconds for slow selector warnings
     */
    selectorThreshold?: number;
  };

  /**
   * Debug mode options
   */
  debug?: {
    /**
     * Whether to log state changes
     */
    logStateChanges?: boolean;

    /**
     * Whether to log actions
     */
    logActions?: boolean;

    /**
     * Whether to log rendering
     */
    logRendering?: boolean;
  };
}

/**
 * Context result with provider, hooks, and utilities
 */
export interface ContextResult<
  TState extends BaseState,
  TAction extends BaseAction,
  TManager = unknown,
> {
  /**
   * The name of the context
   */
  contextName: string;

  /**
   * The React context object
   */
  Context: React.Context<
    | {
        state: TState;
        dispatch: React.Dispatch<TAction>;
      }
    | undefined
  >;

  /**
   * The provider component for the context
   */
  Provider: React.FC<{
    children: React.ReactNode;
    manager?: TManager;
    initialState?: Partial<TState>;
  }>;

  /**
   * Hook to use the entire context state
   */
  useContextState: () => TState;

  /**
   * Hook to use the context dispatch function
   */
  useContextDispatch: () => React.Dispatch<TAction>;

  /**
   * Hook to select a specific part of the context state
   */
  useContextSelector: <TSelected>(selector: Selector<TState, TSelected>) => TSelected;

  /**
   * Connect the context to a manager
   */
  connectToManager: (config: ManagerConfig<TManager>) => void;
}

/**
 * Creates a standardized context with the given options
 */
export function createStandardContext<
  TState extends BaseState,
  TAction extends BaseAction,
  TManager = unknown,
>(options: ContextOptions<TState, TAction>): ContextResult<TState, TAction, TManager> {
  type ContextType =
    | {
        state: TState;
        dispatch: React.Dispatch<TAction>;
      }
    | undefined;

  // Create a special action creator for internal event-based updates
  const createUpdateFromEventAction = (payload: TState): TAction => {
    return {
      type: 'UPDATE_FROM_EVENT',
      payload,
    } as unknown as TAction;
  };

  // Create the context
  const Context = createContext<ContextType>(undefined);
  Context.displayName = `${options?.name}Context`;

  // Reference to the manager connection config
  const managerConfigRef = { current: null as ManagerConfig<TManager> | null };

  // Provider component
  const Provider: React.FC<{
    children: React.ReactNode;
    manager?: TManager;
    initialState?: Partial<TState>;
  }> = ({ children, manager, initialState }) => {
    // Combine default initial state with override props
    const combinedInitialState = {
      ...options?.initialState,
      ...initialState,
    } as TState;

    // State and reducer
    const [state, dispatch] = React.useReducer((state: TState, action: TAction): TState => {
      if (options?.debug?.logActions) {
        console.warn(`[${options?.name}] Action:`, action);
      }

      const startTime = options?.performanceMonitoring?.enabled ? performance.now() : 0;

      // Apply the reducer
      const newState = options?.reducer(state, action);

      // Update lastUpdated timestamp
      newState.lastUpdated = Date.now();

      if (options?.performanceMonitoring?.enabled) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (duration > (options?.performanceMonitoring.reducerThreshold || 5)) {
          console.warn(
            `[${options?.name}] Slow reducer for action ${action.type}: ${duration.toFixed(2)}ms`
          );
        }
      }

      if (options?.debug?.logStateChanges) {
        console.warn(`[${options?.name}] New state:`, newState);
      }

      return newState;
    }, combinedInitialState);

    // Manager connection effect
    useEffect(() => {
      if (manager && managerConfigRef.current) {
        const config = managerConfigRef.current;

        // Set up event subscriptions if provided
        if (config.events) {
          const { eventBus, subscriptions } = config.events;

          // Subscribe to events
          const unsubscribers = Object.entries(subscriptions).map(([eventType, handler]) => {
            return eventBus.subscribe(eventType as EventType, event => {
              // Use Immer-like pattern with a draft
              const draft = { ...state };
              handler(event, draft);

              // Dispatch an action to update the state
              dispatch(createUpdateFromEventAction(draft));
            });
          });

          // Clean up subscriptions
          return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
          };
        }
      }

      return undefined;
    }, [manager, state]);

    // Event subscriptions effect
    useEffect(() => {
      if (options?.eventSubscriptions) {
        const { eventBus, subscriptions } = options?.eventSubscriptions;

        // Subscribe to events
        const unsubscribers = Object.entries(subscriptions).map(([eventType, handler]) => {
          return eventBus.subscribe(eventType as EventType, event => {
            handler(event, dispatch);
          });
        });

        // Clean up subscriptions
        return () => {
          unsubscribers.forEach(unsubscribe => unsubscribe());
        };
      }

      return undefined;
    }, []);

    // Memoize context value to prevent unnecessary renders
    const contextValue = useMemo(() => {
      if (options?.debug?.logRendering) {
        console.warn(`[${options?.name}] Rendering provider`);
      }
      return { state, dispatch };
    }, [state]);

    return <Context.Provider value={contextValue}>{children}</Context.Provider>;
  };

  // Hook to use the context
  const useContextState = (): TState => {
    const context = useContext(Context);
    if (!context) {
      throw new Error(`use${options?.name} must be used within a ${options?.name}Provider`);
    }
    return context.state;
  };

  // Hook to use the dispatch function
  const useContextDispatch = (): React.Dispatch<TAction> => {
    const context = useContext(Context);
    if (!context) {
      throw new Error(`use${options?.name}Dispatch must be used within a ${options?.name}Provider`);
    }
    return context.dispatch;
  };

  // Hook to select a specific part of the context state
  const useContextSelector = <TSelected,>(selector: Selector<TState, TSelected>): TSelected => {
    const context = useContext(Context);
    if (!context) {
      throw new Error(`use${options?.name}Selector must be used within a ${options?.name}Provider`);
    }

    // Ref for the previous selected value
    const prevSelectedRef = useRef<TSelected | undefined>(undefined);

    // Performance monitoring
    const startTime = options?.performanceMonitoring?.enabled ? performance.now() : 0;

    // Apply the selector
    const selected = selector(context.state);

    // Performance monitoring
    if (options?.performanceMonitoring?.enabled) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > (options?.performanceMonitoring.selectorThreshold || 2)) {
        console.warn(`[${options?.name}] Slow selector: ${duration.toFixed(2)}ms`);
      }
    }

    // Memoize the selected value
    const memoizedSelected = useMemo(() => {
      const prevSelected = prevSelectedRef.current;

      // If we have a previous value and it's equal to the current value, return the previous value
      if (prevSelected !== undefined && Object.is(prevSelected, selected)) {
        return prevSelected;
      }

      // Otherwise, update the ref and return the new value
      prevSelectedRef.current = selected;
      return selected;
    }, [selected]);

    return memoizedSelected;
  };

  // Function to connect the context to a manager
  const connectToManager = (config: ManagerConfig<TManager>): void => {
    managerConfigRef.current = config;
  };

  return {
    contextName: options?.name,
    Context,
    Provider,
    useContextState,
    useContextDispatch,
    useContextSelector,
    connectToManager,
  };
}

/**
 * Creates action creators for a context
 */
export function createActions<
  TActionMap extends Record<string, (...args: unknown[]) => BaseAction>,
>(actions: TActionMap): TActionMap {
  return actions;
}

/**
 * Creates a selector for a specific part of the context state
 */
export function createSelector<TState extends BaseState, TSelected>(
  selector: Selector<TState, TSelected>
): Selector<TState, TSelected> {
  return selector;
}

/**
 * Creates a selector for a specific property of the context state
 */
export function createPropertySelector<TState extends BaseState, K extends keyof TState>(
  property: K
): Selector<TState, TState[K]> {
  return state => state[property];
}

/**
 * @context: type - definitions, state - management
 * @description: Type-safe state management utilities for React applications
 * @file: src/types/state/TypeSafeStateManagement.ts
 * This module provides utilities for creating strongly typed reducers, actions,
 * and state transitions to enhance the type safety of application state management
 */

import * as React from 'react';
import { Reducer, useCallback, useContext, useMemo, useReducer, useState } from 'react';

/**
 * Base Action interface that all action types should extend
 * Enforces inclusion of a type property for action discrimination
 */
export interface Action<T extends string = string> {
  type: T;
}

/**
 * Action with payload interface that extends the base Action
 * Provides proper typing for actions that include data
 */
export interface PayloadAction<T extends string, P> extends Action<T> {
  payload: P;
}

/**
 * Helper type to define a discriminated union of action types based on a record
 * Makes it easy to define all the possible action types for a reducer
 */
export type ActionUnion<T extends Record<string, (...args: unknown[]) => Action<string>>> =
  ReturnType<T[keyof T]>;

/**
 * Type for a function that creates a PayloadAction
 */
export type ActionCreator<T extends string, P> = (payload: P) => PayloadAction<T, P>;

/**
 * Type for a function that creates an Action without payload
 */
export type SimpleActionCreator<T extends string> = () => Action<T>;

/**
 * Creates an action creator for actions with payloads
 *
 * @param type The action type string
 * @returns An action creator function that takes a payload and returns a properly typed action
 */
export function createAction<T extends string, P>(type: T): ActionCreator<T, P> {
  return (payload: P): PayloadAction<T, P> => ({
    type,
    payload,
  });
}

/**
 * Creates an action creator for actions without payloads
 *
 * @param type The action type string
 * @returns An action creator function that returns a properly typed action
 */
export function createSimpleAction<T extends string>(type: T): SimpleActionCreator<T> {
  return (): Action<T> => ({ type });
}

/**
 * Helper to create a record of action creators from a record of action types
 *
 * @param actionMap Record of action types mapped to their payload types
 * @returns Record of action creators
 */
export function createActionCreators<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T,
>(actionMap: { [P in K]: T[P] extends undefined ? string : [string, T[P]] }) {
  const creators: Record<string, ActionCreator<string, unknown> | SimpleActionCreator<string>> = {};

  for (const key in actionMap) {
    const value = actionMap[key];
    if (typeof value === 'string') {
      creators[key] = createSimpleAction(value);
    } else {
      creators[key] = createAction<string, unknown>(value[0]);
    }
  }

  return creators as {
    [P in K]: T[P] extends undefined ? SimpleActionCreator<string> : ActionCreator<string, T[P]>;
  };
}

/**
 * Type-safe reducer builder that enforces action type discrimination
 * Ensures that action types are properly typed and matched in the reducer
 */
export class ReducerBuilder<S, A extends Action = Action> {
  private handlers: Partial<Record<A['type'] | 'DEFAULT', (state: S, action: unknown) => S>> = {};

  /**
   * Add a handler for a specific action type
   *
   * @param type The action type to handle
   * @param handler The handler function for this action type
   * @returns The builder for chaining
   */
  addCase<T extends A['type'], AC extends Extract<A, { type: T }>>(
    type: T,
    handler: (state: S, action: AC) => S
  ): ReducerBuilder<S, A> {
    this.handlers[type] = (state: S, action: unknown) => handler(state, action as AC);
    return this;
  }

  /**
   * Add a default handler for unmatched action types
   *
   * @param handler The default handler function
   * @returns The builder for chaining
   */
  addDefaultCase(handler: (state: S) => S): ReducerBuilder<S, A> {
    this.handlers.DEFAULT = (state: S) => handler(state);
    return this;
  }

  /**
   * Build the reducer function
   *
   * @returns A properly typed reducer function
   */
  build(): Reducer<S, A> {
    return (state: S, action: A) => {
      const actionType = action.type as A['type'] | 'DEFAULT';
      const handler = this.handlers[actionType] ?? this.handlers.DEFAULT;
      return handler ? handler(state, action) : state;
    };
  }
}

/**
 * Creates a reducer builder for a specific state and action type
 *
 * @returns A reducer builder instance
 */
export function createReducer<S, A extends Action = Action>(): ReducerBuilder<S, A> {
  return new ReducerBuilder<S, A>();
}

/**
 * Hook to create a state slice with type-safe actions and reducer
 *
 * @param reducer The reducer function
 * @param initialState The initial state
 * @param actions Object of action creators
 * @returns Tuple of [state, actions with dispatch bound]
 */
export function useTypedReducer<
  S,
  A extends Action,
  AC extends Record<string, (...args: unknown[]) => A>,
>(
  reducer: Reducer<S, A>,
  initialState: S,
  actions: AC
): [S, { [K in keyof AC]: (...args: Parameters<AC[K]>) => void }] {
  const [state, dispatch] = useReducer(reducer, initialState);

  const boundActions = useMemo(() => {
    const result: Record<string, unknown> = {};
    for (const key in actions) {
      const actionCreator = actions[key];
      result[key] = (...args: unknown[]) => dispatch(actionCreator(...args));
    }
    return result as { [K in keyof AC]: (...args: Parameters<AC[K]>) => void };
  }, [actions, dispatch]);

  return [state, boundActions];
}

/**
 * Creates a type-safe state slice
 * Combines reducer creation and action binding in one utility
 *
 * @param initialState The initial state
 * @param reducerMap Map of action type to reducer handlers
 * @param actionMap Map of action creators
 * @returns A hook to use this state slice
 */
export function createTypedStateSlice<
  S,
  AM extends Record<string, (...args: unknown[]) => Action>,
  A extends ReturnType<AM[keyof AM]>,
>(initialState: S, reducerMap: Record<string, (state: S, action: A) => S>, actionMap: AM) {
  // Create the reducer
  const reducer: Reducer<S, A> = (state = initialState, action) => {
    const handler = reducerMap[action.type];
    return handler ? handler(state, action) : state;
  };

  // Return a hook that provides the state and bound actions
  return () => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const boundActions = useMemo(() => {
      const result: Record<string, unknown> = {};
      for (const key in actionMap) {
        const actionCreator = actionMap[key];
        result[key] = (...args: unknown[]) => dispatch(actionCreator(...args) as A);
      }
      return result as { [K in keyof AM]: (...args: Parameters<AM[K]>) => void };
    }, [dispatch]);

    return [state, boundActions] as const;
  };
}

/**
 * Type for a complex state transition function
 * Used for multi-step state transitions that involve side effects
 */
export type StateTransitionFn<S, R = void> = (
  getState: () => S,
  setState: (update: Partial<S> | ((prevState: S) => Partial<S>)) => void
) => Promise<R> | R;

/**
 * Hook to manage complex state transitions in a type-safe way
 *
 * @param initialState The initial state
 * @returns A tuple of [state, setState, runTransition]
 */
export function useTypedTransitions<S>(initialState: S) {
  const [state, setState] = useState<S>(initialState);

  /**
   * Set state with type checking
   */
  const setTypedState = useCallback((update: Partial<S> | ((prevState: S) => Partial<S>)) => {
    setState(prev => {
      const newParts = typeof update === 'function' ? update(prev) : update;
      return { ...prev, ...newParts };
    });
  }, []);

  /**
   * Run a complex state transition with proper typing
   */
  const runTransition = useCallback(
    <R = void>(transitionFn: StateTransitionFn<S, R>): Promise<R> => {
      const getState = () => state;
      return Promise.resolve(transitionFn(getState, setTypedState));
    },
    [state, setTypedState]
  );

  return [state, setTypedState, runTransition] as const;
}

/**
 * Type-safe selector hook
 *
 * @param state The state object
 * @param selector (...args: unknown[]) => unknown to select a portion of state
 * @returns The selected state portion
 */
export function useTypedSelector<S, R>(state: S, selector: (state: S) => R): R {
  return useMemo(() => selector(state), [state, selector]);
}

/**
 * Creates a type-safe async reducer
 * Handles loading, error, and success states for async operations
 *
 * @param actionType Base action type for the async action
 * @param handler (...args: unknown[]) => unknown that processes the action payload
 * @returns An object with action creators and a reducer
 */
export function createAsyncReducer<S, P, R>(
  actionType: string,
  handler: (payload: P) => Promise<R>
) {
  // Define action types
  const PENDING = `${actionType}/pending`;
  const FULFILLED = `${actionType}/fulfilled`;
  const REJECTED = `${actionType}/rejected`;

  // Create action creators
  const actionCreators = {
    pending: createSimpleAction(PENDING),
    fulfilled: createAction<typeof FULFILLED, R>(FULFILLED),
    rejected: createAction<typeof REJECTED, Error>(REJECTED),
    trigger: (payload: P) => async (dispatch: (action: Action<string>) => void) => {
      dispatch(actionCreators.pending());
      try {
        const result = await handler(payload);
        dispatch(actionCreators.fulfilled(result));
        return result;
      } catch (error) {
        dispatch(
          actionCreators.rejected(error instanceof Error ? error : new Error(String(error)))
        );
        throw error;
      }
    },
  };

  // Create reducer
  interface AsyncState {
    loading: boolean;
    error: Error | null;
    data: R | null;
  }

  type AsyncReducerState = S & AsyncState;

  const reducer = createReducer<AsyncReducerState, PayloadAction<string, unknown>>()
    .addCase(PENDING, state => ({
      ...state,
      loading: true,
      error: null,
    }))
    .addCase(FULFILLED, (state, action: PayloadAction<typeof FULFILLED, R>) => ({
      ...state,
      loading: false,
      data: action.payload,
      error: null,
    }))
    .addCase(REJECTED, (state, action: PayloadAction<typeof REJECTED, Error>) => ({
      ...state,
      loading: false,
      error: action.payload,
    }))
    .build();

  return {
    actions: actionCreators,
    reducer,
  };
}

/**
 * Type-safe context state utility
 * Combines the createReducer and useReducer patterns specifically for React contexts
 *
 * @param reducer The reducer function
 * @param initialState The initial state
 * @returns A context provider and hooks to use the state
 */
export function createTypedContext<S, A extends Action = Action>(
  reducer: Reducer<S, A>,
  initialState: S
) {
  const StateContext = React.createContext<S | undefined>(undefined);
  const DispatchContext = React.createContext<React.Dispatch<A> | undefined>(undefined);

  const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    return React.createElement(
      StateContext.Provider,
      { value: state },
      React.createElement(DispatchContext.Provider, { value: dispatch }, children)
    );
  };

  const useStateContext = () => {
    const context = useContext(StateContext);
    if (context === undefined) {
      throw new Error('useStateContext must be used within a Provider');
    }
    return context;
  };

  const useDispatchContext = () => {
    const context = useContext(DispatchContext);
    if (context === undefined) {
      throw new Error('useDispatchContext must be used within a Provider');
    }
    return context;
  };

  return {
    Provider,
    useStateContext,
    useDispatchContext,
  };
}

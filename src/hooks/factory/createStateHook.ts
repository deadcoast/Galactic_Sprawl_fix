import { useCallback, useEffect, useMemo, useState } from 'react';
import
  {
    errorLoggingService,
    ErrorSeverity,
    ErrorType,
  } from '../../services/logging/ErrorLoggingService';

/**
 * Action creator type
 */
export type ActionCreator<TState, TPayload = unknown> = (
  state: TState,
  payload: TPayload
) => Partial<TState>;

/**
 * Bound action type
 */
export type BoundAction<TPayload = unknown> = (payload: TPayload) => void;

/**
 * State hook options
 */
export interface StateHookOptions<TState> {
  /** (...args: unknown[]) => unknown to run on state initialization */
  onInit?: (state: TState) => void;
  /** (...args: unknown[]) => unknown to run on state cleanup */
  onCleanup?: (state: TState) => void;
  /** Whether to persist state in localStorage */
  persist?: boolean;
  /** Key to use for localStorage persistence */
  persistKey?: string;
  /** Custom state equality function */
  areEqual?: (prev: TState, next: TState) => boolean;
  /** Initial state override */
  initialStateOverride?: TState | (() => TState);
}

/**
 * Creates a reusable state management hook with actions
 * @param initialState The initial state or a function that returns the initial state
 * @param actions An object of action creators
 * @param options Options for the hook
 * @returns A hook that provides state and bound actions
 */
export function createStateHook<
  TState extends Record<string, unknown>,
  TActions extends Record<string, ActionCreator<TState, unknown>>,
>(
  initialState: TState | (() => TState),
  actions: TActions,
  options: StateHookOptions<TState> = {}
) {
  // Type for the returned actions object
  type BoundActions = {
    [K in keyof TActions]: BoundAction<Parameters<TActions[K]>[1]>;
  };

  return () => {
    // Initialize state, handling both function and object initial states
    const getInitialState = useCallback(() => {
      // Check if we should use override
      if (options?.initialStateOverride !== undefined) {
        return typeof options?.initialStateOverride === 'function'
          ? (options?.initialStateOverride as () => TState)()
          : options?.initialStateOverride;
      }

      // Otherwise use the default initial state
      const defaultState =
        typeof initialState === 'function' ? (initialState as () => TState)() : initialState;

      // If persistence is enabled, try to load from localStorage
      if (options?.persist && options?.persistKey) {
        try {
          const savedState = localStorage.getItem(options?.persistKey);
          if (savedState) {
            return { ...defaultState, ...JSON.parse(savedState) } as TState;
          }
        } catch (error) {
          errorLoggingService.logError(
            error instanceof Error ? error : new Error('Failed to load persisted state'),
            ErrorType.INITIALIZATION,
            ErrorSeverity.MEDIUM,
            {
              componentName: 'createStateHook',
              action: 'getInitialState',
              persistKey: options?.persistKey,
            }
          );
        }
      }

      return defaultState;
    }, []);

    // Initialize state
    const [state, setState] = useState<TState>(getInitialState);

    // Create memoized bound actions
    const boundActions = useMemo(() => {
      const result = {} as BoundActions;

      for (const [key, actionCreator] of Object.entries(actions)) {
        result[key as keyof TActions] = payload => {
          setState(currentState => {
            const updates = actionCreator(currentState, payload);

            // If updates is empty, return the current state
            if (!updates || Object.keys(updates).length === 0) {
              return currentState;
            }

            const newState = { ...currentState, ...updates };

            // If custom equality function is provided, check if state actually changed
            if (options?.areEqual?.(currentState, newState)) {
              return currentState;
            }

            // Persist state if enabled
            if (options?.persist && options?.persistKey) {
              try {
                localStorage.setItem(options?.persistKey, JSON.stringify(newState));
              } catch (error) {
                errorLoggingService.logError(
                  error instanceof Error ? error : new Error('Failed to persist state'),
                  ErrorType.INITIALIZATION,
                  ErrorSeverity.MEDIUM,
                  {
                    componentName: 'createStateHook',
                    action: 'setState',
                    persistKey: options?.persistKey,
                  }
                );
              }
            }

            return newState;
          });
        };
      }

      return result;
    }, []);

    // Reset action
    const reset = useCallback(() => {
      setState(getInitialState());

      // Clear persisted state if applicable
      if (options?.persist && options?.persistKey) {
        try {
          localStorage.removeItem(options?.persistKey);
        } catch (error) {
          errorLoggingService.logError(
            error instanceof Error ? error : new Error('Failed to clear persisted state'),
            ErrorType.INITIALIZATION,
            ErrorSeverity.MEDIUM,
            {
              componentName: 'createStateHook',
              action: 'reset',
              persistKey: options?.persistKey,
            }
          );
        }
      }
    }, [getInitialState]);

    // Add reset to bound actions
    const actionsWithReset = useMemo(
      () => ({
        ...boundActions,
        reset,
      }),
      [boundActions, reset]
    );

    // Run initialization and cleanup
    useEffect(() => {
      if (options?.onInit) {
        options?.onInit(state);
      }

      return () => {
        if (options?.onCleanup) {
          options?.onCleanup(state);
        }
      };
    }, []);

    return [state, actionsWithReset] as const;
  };
}

/**
 * Example usage:
 *
 * ```typescript
 * // Define the state type
 * interface CounterState {
 *   count: number;
 *   lastUpdated: number | null;
 * }
 *
 * // Define action creators
 * const counterActions = {
 *   increment: (state: CounterState, step: number = 1) => ({
 *     count: state.count + step,
 *     lastUpdated: Date.now()
 *   }),
 *   decrement: (state: CounterState, step: number = 1) => ({
 *     count: state.count - step,
 *     lastUpdated: Date.now()
 *   }),
 *   reset: (state: CounterState) => ({
 *     count: 0,
 *     lastUpdated: Date.now()
 *   })
 * };
 *
 * // Create the hook
 * const useCounter = createStateHook<CounterState, typeof counterActions>(
 *   { count: 0, lastUpdated: null },
 *   counterActions,
 *   { persist: true, persistKey: 'app-counter' }
 * );
 *
 * // Use in component
 * function Counter() {
 *   const [state, actions] = useCounter();
 *
 *   return (
 *     <div>
 *       <p>Count: {state.count}</p>
 *       <button onClick={() => actions.increment()}>Increment</button>
 *       <button onClick={() => actions.decrement()}>Decrement</button>
 *       <button onClick={actions.reset}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 */

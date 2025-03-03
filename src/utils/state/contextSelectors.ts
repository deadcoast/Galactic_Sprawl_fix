import { isEqual } from 'lodash';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';

/**
 * Creates a selector function that memoizes the result and only triggers
 * re-renders when the selected value changes.
 *
 * @param selector Function that selects a portion of the state
 * @returns A memoized selector function
 */
export function createSelector<State, Selected>(
  selector: (state: State) => Selected
): (state: State) => Selected {
  const cache = new Map<unknown, { state: State; selected: Selected }>();

  return (state: State): Selected => {
    const key = typeof state === 'object' && state !== null ? state : JSON.stringify(state);

    const cached = cache.get(key);
    if (cached && cached.state === state) {
      return cached.selected;
    }

    const selected = selector(state);
    cache.set(key, { state, selected });

    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return selected;
  };
}

/**
 * A hook that selects a portion of the context state and only triggers
 * re-renders when the selected value changes.
 *
 * @param context The React context to use
 * @param selector Function that selects a portion of the state
 * @param equalityFn Optional function to determine if the selected value has changed
 * @returns The selected portion of the state
 */
export function useContextSelector<ContextType, Selected>(
  context: React.Context<ContextType>,
  selector: (value: NonNullable<ContextType>) => Selected,
  equalityFn: (a: Selected, b: Selected) => boolean = isEqual
): Selected {
  const contextValue = useContext(context);

  if (contextValue === null || contextValue === undefined) {
    throw new Error(
      `useContextSelector must be used within a Provider for ${context.displayName || 'unknown context'}`
    );
  }

  const [, forceRender] = useState({});
  const latestSelectedRef = useRef<Selected>();
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(equalityFn);

  // Update refs when selector or equalityFn changes
  useEffect(() => {
    selectorRef.current = selector;
    equalityFnRef.current = equalityFn;
  }, [selector, equalityFn]);

  // Calculate the selected value
  const selectedValue = selector(contextValue as NonNullable<ContextType>);

  // Check if the selected value has changed
  const checkIfUpdated = useCallback(() => {
    if (!latestSelectedRef.current) {
      latestSelectedRef.current = selectedValue;
      return;
    }

    if (!equalityFnRef.current(latestSelectedRef.current, selectedValue)) {
      latestSelectedRef.current = selectedValue;
      forceRender({});
    }
  }, [selectedValue]);

  // Check for updates when the context value changes
  useEffect(() => {
    checkIfUpdated();
  }, [contextValue, checkIfUpdated]);

  return selectedValue;
}

/**
 * Creates a hook that selects a portion of the context state.
 *
 * @param context The React context to use
 * @returns A hook that selects a portion of the context state
 */
export function createContextSelector<ContextType>(context: React.Context<ContextType>) {
  return function useSelector<Selected>(
    selector: (value: NonNullable<ContextType>) => Selected,
    equalityFn?: (a: Selected, b: Selected) => boolean
  ): Selected {
    return useContextSelector(context, selector, equalityFn);
  };
}

/**
 * Creates a hook that selects a specific property from the context state.
 *
 * @param context The React context to use
 * @param property The property to select
 * @returns A hook that selects the specified property
 */
export function createPropertySelector<ContextType, K extends keyof NonNullable<ContextType>>(
  context: React.Context<ContextType>,
  property: K
) {
  return function usePropertySelector(): NonNullable<ContextType>[K] {
    return useContextSelector(context, value => (value as NonNullable<ContextType>)[property]);
  };
}

/**
 * Creates a hook that selects a nested property from the context state.
 *
 * @param context The React context to use
 * @param path Array of property keys to access the nested property
 * @returns A hook that selects the nested property
 */
export function createNestedPropertySelector<
  ContextType,
  K1 extends keyof NonNullable<ContextType>,
  K2 extends keyof NonNullable<NonNullable<ContextType>[K1]>,
>(context: React.Context<ContextType>, path: [K1, K2]) {
  return function useNestedPropertySelector(): NonNullable<NonNullable<ContextType>[K1]>[K2] {
    return useContextSelector(context, value => {
      const [key1, key2] = path;
      const value1 = (value as NonNullable<ContextType>)[key1];
      if (value1 === undefined || value1 === null) {
        throw new Error(
          `Property ${String(key1)} is ${value1 === undefined ? 'undefined' : 'null'}`
        );
      }
      return (value1 as NonNullable<NonNullable<ContextType>[K1]>)[key2];
    });
  };
}

/**
 * Creates a hook that selects multiple properties from the context state.
 *
 * @param context The React context to use
 * @param properties Array of properties to select
 * @returns A hook that selects the specified properties
 */
export function createMultiPropertySelector<ContextType, K extends keyof NonNullable<ContextType>>(
  context: React.Context<ContextType>,
  properties: K[]
) {
  return function useMultiPropertySelector(): Pick<NonNullable<ContextType>, K> {
    return useContextSelector(context, value => {
      const result = {} as Pick<NonNullable<ContextType>, K>;
      properties.forEach(prop => {
        result[prop] = (value as NonNullable<ContextType>)[prop];
      });
      return result;
    });
  };
}

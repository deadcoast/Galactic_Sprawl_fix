/**
 * @context: ui-system, performance-optimization
 *
 * useMemoWithDeepCompare - A hook for memoizing values with deep equality checking
 */

import { useRef, useState } from 'react';
import { deepEqual } from '../../utils/performance/ComponentOptimizer';

/**
 * A hook that works like useMemo but performs deep equality checking on dependencies
 * rather than reference equality. This is useful for memoizing values based on complex
 * objects or arrays that might have the same content but different references.
 *
 * @param factory Function that returns the value to be memoized
 * @param dependencies Array of dependencies that the memoized value depends on
 * @returns Memoized value that only changes when dependencies deeply change
 *
 * @example
 * ```tsx
 * // This will only recalculate when the items array contents actually change
 * const processedItems = useMemoWithDeepCompare(() => {
 *   return items.map(item => processItem(item));
 * }, [items]);
 * ```
 */
export function useMemoWithDeepCompare<T>(
  factory: () => T,
  dependencies: readonly unknown[]
): T {
  // Ref to store the memoized value
  const valueRef = useRef<T | undefined>(undefined);

  // Ref to store the previous dependencies
  const depsRef = useRef<readonly unknown[]>([]);

  // Check if dependencies have deeply changed
  const depsChanged =
    depsRef.current.length !== dependencies.length ||
    dependencies.some((dep, i) => !deepEqual(dep, depsRef.current[i]));

  // If this is the first run or dependencies changed, calculate the new value
  if (valueRef.current === undefined || depsChanged) {
    valueRef.current = factory();
    depsRef.current = dependencies;
  }

  return valueRef.current;
}

/**
 * A hook that provides a state value with deep equality checking before updates
 *
 * Only updates the state when the new value is deeply different from the current state,
 * which helps prevent unnecessary re-renders when dealing with complex objects
 *
 * @param initialValue Initial state value
 * @returns [state, setState] tuple like useState but with deep equality checking
 *
 * @example
 * ```tsx
 * const [filters, setFilters] = useStateWithDeepCompare({ category: 'all', sort: 'name' });
 *
 * // This won't cause a re-render if the new object is deeply equal to the current state
 * const updateCategory = (category) => {
 *   setFilters({ ...filters, category });
 * };
 * ```
 */
export function useStateWithDeepCompare<T>(initialValue: T): [T, (newValue: T) => void] {
  // Use standard useState
  const [state, setState] = useState<T>(initialValue);

  // Create a setter that only updates state if the value actually changes
  const setStateWithDeepCompare = (newValue: T) => {
    setState(currentState => {
      // Only update if there's a deep difference
      return deepEqual(currentState, newValue) ? currentState : newValue;
    });
  };

  return [state, setStateWithDeepCompare];
}

export default useMemoWithDeepCompare;

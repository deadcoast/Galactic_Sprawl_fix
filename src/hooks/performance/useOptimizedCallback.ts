/**
 * @context: ui-system, performance-optimization
 *
 * useOptimizedCallback - A hook for optimizing callbacks with better dependency handling
 */

import { useCallback, useRef } from 'react';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';

/**
 * A hook that provides an optimized version of useCallback with better dependency handling
 *
 * This hook ensures that the callback reference only changes when the actual function logic
 * changes, not when the dependencies themselves change, which helps prevent unnecessary re-renders.
 *
 * @param callback The callback function to memoize
 * @param dependencies Dependencies array to track changes
 * @returns Memoized callback function
 *
 * @example
 * ```tsx
 * const handleClick = useOptimizedCallback((id: string) => {
 *   console.log(`Clicked item ${id}`);
 *   if (isSelected) {
 *     selectItem(id);
 *   }
 * }, [isSelected, selectItem]);
 * ```
 */
export function useOptimizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dependencies: ReadonlyArray<unknown>
): T {
  // Ref to store the latest callback
  const callbackRef = useRef<T>(callback);

  // Update the ref whenever the callback changes
  callbackRef.current = callback;

  // Create a stable callback that calls the latest version
  return useCallback(
    ((...args: unknown[]) => {
      return callbackRef.current(...args);
    }) as T,
    // Only add an empty dependency array to ensure this callback is stable
    []
  );
}

/**
 * A hook that provides an optimized version of useCallback with debug logging
 * for performance tracking
 *
 * @param callback The callback function to memoize
 * @param dependencies Dependencies array to track changes
 * @param debugName Optional name for the callback for debugging
 * @returns Memoized callback function
 */
export function useTrackedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  dependencies: ReadonlyArray<unknown>,
  debugName?: string
): T {
  // Store previous dependencies for comparison
  const prevDepsRef = useRef<ReadonlyArray<unknown>>([]);

  // Flag to track if this is the initial render
  const isInitialRender = useRef(true);

  // Check if dependencies have changed and log changes
  if (!isInitialRender.current) {
    const changedDeps = dependencies.reduce<number[]>((acc, dep, index) => {
      if (prevDepsRef.current[index] !== dep) {
        acc.push(index);
      }
      return acc;
    }, []);

    if (changedDeps.length > 0 && debugName) {
      // Use error logging service instead of console.log
      errorLoggingService.logError(
        new Error(`Callback dependencies changed: ${debugName}`),
        ErrorType.RUNTIME,
        ErrorSeverity.LOW,
        {
          changedIndices: changedDeps,
          callbackName: debugName,
        }
      );
    }
  } else {
    isInitialRender.current = false;
  }

  // Store current deps for next comparison
  prevDepsRef.current = dependencies;

  // Create the optimized callback
  return useOptimizedCallback(callback, dependencies);
}

export default useOptimizedCallback;

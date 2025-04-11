/**
 * @context: ui-system, performance-optimization, component-library
 *
 * ComponentOptimizer - Utilities for optimizing React component performance
 *
 * This module provides specialized utilities for optimizing UI component performance:
 * 1. Enhanced memoization with dependency tracking
 * 2. Virtualization helpers for large lists
 * 3. Performance monitoring utilities
 * 4. Object equality comparison functions for React.memo and useMemo
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorSeverity, ErrorType, errorLoggingService } from '../../services/ErrorLoggingService';

/**
 * Configuration for component memoization
 */
export interface MemoizationConfig {
  /** Name of the component for tracking */
  componentName: string;

  /** Whether to track render counts */
  trackRenders?: boolean;

  /** Whether to log render performance */
  logPerformance?: boolean;

  /** Custom comparison function for props */
  propsAreEqual?: <T extends Record<string, unknown>>(prevProps: T, nextProps: T) => boolean;

  /** Threshold in ms for logging slow renders */
  renderTimeThreshold?: number;
}

/**
 * Creates an optimized comparison function for React.memo
 *
 * @param config Memoization configuration
 * @returns A function to determine if component should update
 */
export function createPropsComparison<T extends Record<string, unknown>>(
  config: MemoizationConfig
) {
  const {
    componentName,
    trackRenders = false,
    logPerformance = false,
    renderTimeThreshold = 16, // Default to 16ms (60fps frame budget)
    propsAreEqual,
  } = config;

  // Counters for tracking
  let renderCount = 0;
  let memoizedRenderCount = 0;

  return function (prevProps: T, nextProps: T): boolean {
    const startTime = logPerformance ? performance.now() : 0;
    renderCount++;

    // Use custom comparison if provided, otherwise do shallow comparison
    const areEqual = propsAreEqual
      ? propsAreEqual(prevProps, nextProps)
      : Object.keys(nextProps).every(key => {
          return (
            Object.prototype.hasOwnProperty.call(prevProps, key) &&
            prevProps[key] === nextProps[key]
          );
        });

    if (areEqual) {
      memoizedRenderCount++;
    }

    // Log performance info if enabled
    if (logPerformance) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > renderTimeThreshold) {
        console.warn(
          `[ComponentOptimizer] ${componentName} props comparison took ${duration.toFixed(2)}ms, which exceeds the threshold of ${renderTimeThreshold}ms`
        );
      }

      if (trackRenders && renderCount % 10 === 0) {
        console.warn(
          `[ComponentOptimizer] ${componentName} - Render count: ${renderCount}, Memoized: ${memoizedRenderCount} (${((memoizedRenderCount / renderCount) * 100).toFixed(1)}%)`
        );
      }
    }

    return areEqual;
  };
}

/**
 * Hook to track and log component render performance
 *
 * @param componentName Name of the component for tracking
 * @param threshold Threshold in ms to log warning for slow renders
 */
export function useRenderPerformance(componentName: string, threshold: number = 16) {
  const renderCount = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const renderTime = performance.now() - startTimeRef.current;
    renderCount.current++;

    if (renderTime > threshold) {
      console.warn(
        `[ComponentOptimizer] ${componentName} render #${renderCount.current} took ${renderTime.toFixed(2)}ms, which exceeds the threshold of ${threshold}ms`
      );

      // Log to error service for significant performance issues
      if (renderTime > threshold * 2) {
        errorLoggingService.logError(
          new Error(`Slow render detected in ${componentName}`),
          ErrorType.RUNTIME, // Using RUNTIME since PERFORMANCE is not available in ErrorType
          ErrorSeverity.LOW,
          {
            component: componentName,
            renderTime,
            renderCount: renderCount.current,
            performanceIssue: true, // Flag to indicate this is a performance issue
          }
        );
      }
    }
  });

  // Set start time before render
  startTimeRef.current = performance.now();

  return renderCount.current;
}

/**
 * A deep comparison function for React's useMemo and useCallback
 *
 * @param objA First object to compare
 * @param objB Second object to compare
 * @returns Boolean indicating if objects are deeply equal
 */
export function deepEqual<T>(objA: T, objB: T): boolean {
  if (objA === objB) {
    return true;
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA as object);
  const keysB = Object.keys(objB as object);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) {
      return false;
    }

    if (
      !deepEqual((objA as Record<string, unknown>)[key], (objB as Record<string, unknown>)[key])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * A memoized selector hook similar to reselect but for React components
 *
 * @param dependencies Array of dependencies for the selector
 * @param selector Function that computes a new value from dependencies
 * @param equalityFn Optional custom equality function for comparing results
 * @returns The memoized value
 */
export function useMemoizedSelector<T, R>(
  dependencies: readonly T[],
  selector: (deps: readonly T[]) => R,
  equalityFn: (prev: R, next: R) => boolean = (a, b) => a === b
): R {
  const prevResultRef = useRef<R | undefined>(undefined);
  const prevDepsRef = useRef<readonly T[]>([]);

  // Check if dependencies have changed
  const depsChanged =
    dependencies.length !== prevDepsRef.current.length ||
    dependencies.some((dep, i) => dep !== prevDepsRef.current[i]);

  if (depsChanged) {
    // Compute new result
    const newResult = selector(dependencies);

    // Only update if result is different
    if (prevResultRef.current === undefined || !equalityFn(prevResultRef.current, newResult)) {
      prevResultRef.current = newResult;
    }

    // Update dependencies
    prevDepsRef.current = dependencies;
  }

  return prevResultRef.current as R;
}

/**
 * Virtualization configuration for list rendering
 */
export interface VirtualizationConfig {
  /** Total number of items */
  itemCount: number;

  /** Height of each item in pixels */
  itemHeight: number;

  /** Height of the visible container in pixels */
  containerHeight: number;

  /** Additional items to render above and below visible area */
  overscan?: number;
}

/**
 * Hook for virtualizing long lists
 *
 * @param config Virtualization configuration
 * @returns Object with start/end indices and scroll handlers
 */
export function useVirtualization(config: VirtualizationConfig) {
  const { itemCount, itemHeight, containerHeight, overscan = 3 } = config;

  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible item indices
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.floor(scrollTop / itemHeight) + visibleItemCount + overscan
  );

  // Calculate total height to maintain proper scrollbar
  const totalHeight = itemCount * itemHeight;

  // Calculate offset for the visible items
  const offsetY = startIndex * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    startIndex,
    endIndex,
    visibleItemCount,
    totalHeight,
    offsetY,
    handleScroll,
  };
}

/**
 * Hook for lazy loading heavy components
 *
 * @param factory Factory function that returns the component
 * @param dependencies Dependencies array to control when to reload
 * @returns The lazily loaded component
 */
export function useLazyComponent<T>(
  factory: () => Promise<{ default: React.ComponentType<T> }>,
  dependencies: readonly unknown[] = []
) {
  const [Component, setComponent] = useState<React.ComponentType<T> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    factory()
      .then(module => {
        if (isMounted) {
          setComponent(() => module.default);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);

          errorLoggingService.logError(
            err instanceof Error ? err : new Error(String(err)),
            ErrorType.RESOURCE,
            ErrorSeverity.MEDIUM,
            {
              component: 'useLazyComponent',
              factory: factory.toString().substring(0, 100),
            }
          );
        }
      });

    return () => {
      isMounted = false;
    };
    // We're intentionally only rerunning this effect when the dependencies array changes
  }, dependencies);

  return { Component, loading, error };
}

/**
 * Creates a memoized component with enhanced optimizations
 *
 * @param Component The component to optimize
 * @param options Optimization options
 * @returns A memoized component with enhanced optimizations
 */
export function createOptimizedComponent<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  options: MemoizationConfig
): React.ComponentType<P> {
  const { componentName } = options;

  // Create an enhanced component that uses useMemo for expensive calculations
  // Using standard functional component to avoid ref forwarding type issues
  const EnhancedComponent = (props: P): React.ReactElement => {
    // Track render time
    const renderStart = performance.now();

    // Use memoization for expensive calculations within the component
    const memoizedProps = useMemo(() => {
      // Filter props that should be memoized (e.g., large arrays, objects)
      const propsToMemoize: Partial<P> = {};

      // Identify potentially expensive props to memoize
      Object.entries(props).forEach(([key, value]) => {
        if (
          Array.isArray(value) ||
          (typeof value === 'object' && value !== null) ||
          typeof value === 'function'
        ) {
          // These are types that benefit from memoization
          (propsToMemoize as Record<string, unknown>)[key] = value;
        }
      });

      return propsToMemoize;
    }, [props]);

    // Apply optimizations based on memoizedProps
    const optimizedRenderProps = useMemo(() => {
      // Create optimized rendering props by combining the original props with optimized handlers
      return {
        ...props,
        // Enhance with performance optimization wrappers for event handlers
        ...Object.entries(memoizedProps).reduce(
          (acc, [key, value]) => {
            // If the prop is a function (like an event handler), wrap it with performance tracking
            if (typeof value === 'function') {
              acc[key] = (...args: unknown[]) => {
                const startTime = performance.now();
                // Use a properly typed function call instead of the generic Function type
                const result = (value as (...fnArgs: unknown[]) => unknown)(...args);
                const endTime = performance.now();

                // Log slow handler executions
                if (
                  options.logPerformance &&
                  endTime - startTime > (options.renderTimeThreshold || 16)
                ) {
                  console.warn(
                    `[ComponentOptimizer] Slow handler execution for ${componentName}.${key}: ${(endTime - startTime).toFixed(2)}ms`
                  );
                }

                return result;
              };
            }
            return acc;
          },
          {} as Record<string, unknown>
        ),
      } as P;
    }, [props, memoizedProps]);

    // Render the component - using React.createElement for cleaner typing
    // Now using the optimized props that include performance monitoring
    const result = React.createElement(Component, optimizedRenderProps);

    // Log render time if needed
    if (options.logPerformance) {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;

      if (renderTime > (options.renderTimeThreshold || 16)) {
        console.warn(
          `[ComponentOptimizer] Slow render detected for ${componentName}: ${renderTime.toFixed(2)}ms`
        );
      }
    }

    return result;
  };

  // Set display name for dev tools
  EnhancedComponent.displayName = `Optimized(${componentName})`;

  // Return memoized version - use type assertion after casting to unknown
  // This approach is safer than direct casting between incompatible types
  return React.memo(EnhancedComponent) as unknown as React.ComponentType<P>;
}

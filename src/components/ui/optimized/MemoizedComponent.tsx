/**
 * @context: ui-system, performance-optimization, component-library
 *
 * MemoizedComponent - A higher-order component for optimizing React component rendering
 * with enhanced memoization capabilities and performance monitoring.
 */

import * as React from 'react';
import {
  ComponentType,
  forwardRef,
  ForwardRefExoticComponent,
  memo,
  MemoExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from 'react';
import {
  createPropsComparison,
  MemoizationConfig,
} from '../../../utils/performance/ComponentOptimizer';

/**
 * Options for the withMemoization HOC
 */
export interface MemoizationOptions<P extends object> extends MemoizationConfig {
  /**
   * Optional displayName for the wrapped component
   */
  displayName?: string;

  /**
   * Function to determine if component update should be skipped
   */
  arePropsEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean;
}

/**
 * Higher-order component that enhances React.memo with advanced memoization features
 *
 * @param Component Component to memoize
 * @param options Memoization options
 * @returns Memoized component with performance tracking
 */
export function withMemoization<P extends object>(
  Component: ComponentType<P>,
  options: MemoizationOptions<P>
): MemoExoticComponent<ComponentType<P>> {
  const {
    componentName = Component.displayName ?? Component.name ?? 'UnnamedComponent',
    displayName = `Memoized(${componentName})`,
    trackRenders = process.env.NODE_ENV === 'development',
    logPerformance = process.env.NODE_ENV === 'development',
    renderTimeThreshold = 16, // Default to one frame (60 fps)
    arePropsEqual,
  } = options;

  // Create optimized props comparison function
  const propsAreEqual =
    arePropsEqual ??
    createPropsComparison({
      componentName,
      trackRenders,
      logPerformance,
      renderTimeThreshold,
      propsAreEqual: arePropsEqual,
    });

  // Apply memo HOC
  const MemoizedComponent = memo(Component, propsAreEqual);

  // Set display name for dev tools
  MemoizedComponent.displayName = displayName;

  return MemoizedComponent;
}

/**
 * HOC that adds memoization with forcombatded refs
 *
 * @param Component Component to memoize with ref forcombatding
 * @param options Memoization options
 * @returns Memoized component with ref forcombatding
 */
export function withMemoizationForcombatdRef<P extends object, T = unknown>(
  Component: ComponentType<P & { ref?: React.ForwardedRef<T> }>,
  options: MemoizationOptions<P>
): MemoExoticComponent<ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>>> {
  const {
    componentName = Component.displayName ?? Component.name ?? 'UnnamedComponent',
    displayName = `MemoizedForcombatdRef(${componentName})`,
    trackRenders = process.env.NODE_ENV === 'development',
    logPerformance = process.env.NODE_ENV === 'development',
    renderTimeThreshold = 16,
    arePropsEqual,
  } = options;

  // Create optimized props comparison function
  const propsAreEqual =
    arePropsEqual ??
    createPropsComparison({
      componentName,
      trackRenders,
      logPerformance,
      renderTimeThreshold,
      propsAreEqual: arePropsEqual,
    });

  // Create forwardRef component
  const ForwardRefComponent = forwardRef<T, P>((props, ref) => {
    return <Component {...(props as P)} ref={ref} />;
  });

  // Apply memo with proper type casting for the equals function
  const MemoizedComponent = memo(
    ForwardRefComponent,
    propsAreEqual as (
      prevProps: Readonly<PropsWithoutRef<P> & RefAttributes<T>>,
      nextProps: Readonly<PropsWithoutRef<P> & RefAttributes<T>>
    ) => boolean
  );

  // Set display name
  MemoizedComponent.displayName = displayName;

  return MemoizedComponent as MemoExoticComponent<
    ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>>
  >;
}

/**
 * Create a memoized version of a component with default reasonable settings
 * Shorthand for withMemoization for common use cases
 *
 * @param Component Component to memoize
 * @param componentName Optional component name for tracking
 * @returns Memoized component
 */
export function createMemoizedComponent<P extends object>(
  Component: ComponentType<P>,
  componentName?: string
): MemoExoticComponent<ComponentType<P>> {
  return withMemoization(Component, {
    componentName: componentName ?? Component.displayName ?? Component.name ?? 'Component',
    trackRenders: process.env.NODE_ENV === 'development',
    logPerformance: process.env.NODE_ENV === 'development',
    renderTimeThreshold: 16,
  });
}

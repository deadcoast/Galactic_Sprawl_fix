import { isEqual } from 'lodash';
import * as React from 'react';
import { ComponentType, ReactElement, useEffect, useRef } from 'react';
import
  {
    ComponentProfilingOptions,
    ComponentProfilingResult,
    ComponentRenderMetrics
  } from '../../types/ui/UITypes';

/**
 * Default profiling options
 */
const DEFAULT_PROFILING_OPTIONS: ComponentProfilingOptions = {
  enabled: true,
  logToConsole: false,
  slowRenderThreshold: 16, // 1 frame at 60fps
  maxRenderHistory: 100,
  trackPropChanges: true,
  trackRenderPath: false,
};

/**
 * Creates a component profiler for measuring render performance
 *
 * @param componentName The name of the component to profile
 * @param options Profiling options
 * @returns A component profiling result
 */
export function createComponentProfiler(
  componentName: string,
  options: Partial<ComponentProfilingOptions> = {}
): ComponentProfilingResult {
  // Merge options with defaults
  const profilingOptions: ComponentProfilingOptions = {
    ...DEFAULT_PROFILING_OPTIONS,
    ...options,
  };

  // Initialize metrics
  const metrics: ComponentRenderMetrics = {
    componentName,
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    maxRenderTime: 0,
    totalRenderTime: 0,
    lastRenderTimestamp: 0,
    wastedRenders: 0,
    lastChangedProps: [],
    renderPath: profilingOptions.trackRenderPath ? [] : undefined,
  };

  // Initialize render history
  const renderHistory: ComponentProfilingResult['renderHistory'] = [];

  /**
   * Resets the profiling metrics
   */
  const reset = () => {
    metrics.renderCount = 0;
    metrics.lastRenderTime = 0;
    metrics.averageRenderTime = 0;
    metrics.maxRenderTime = 0;
    metrics.totalRenderTime = 0;
    metrics.lastRenderTimestamp = 0;
    metrics.wastedRenders = 0;
    metrics.lastChangedProps = [];
    metrics.renderPath = profilingOptions.trackRenderPath ? [] : undefined;
    renderHistory.length = 0;
  };

  /**
   * Updates the profiling options
   *
   * @param newOptions New profiling options
   */
  const updateOptions = (newOptions: Partial<ComponentProfilingOptions>) => {
    Object.assign(profilingOptions, newOptions);

    // Update render path tracking
    if (newOptions.trackRenderPath !== undefined) {
      if (newOptions.trackRenderPath && !metrics.renderPath) {
        metrics.renderPath = [];
      } else if (!newOptions.trackRenderPath && metrics.renderPath) {
        metrics.renderPath = undefined;
      }
    }
  };

  return {
    metrics,
    renderHistory,
    reset,
    updateOptions,
    profileRender,
  };
}

// Extended interface for internal profiler properties
interface InternalProfilerOptions {
  enabled: boolean;
  logToConsole: boolean;
  slowRenderThreshold: number;
  trackPropChanges: boolean;
  maxRenderHistory: number;
}

/**
 * Higher-order function that wraps a component render function with profiling
 *
 * @param renderFn The component render function
 * @param profiler The component profiler
 * @param prevProps The previous props
 * @param nextProps The next props
 * @returns The result of the render function
 */
export function profileRender<Props, Result>(
  renderFn: (props: Props) => Result,
  profiler: ComponentProfilingResult,
  prevProps: Props | null,
  nextProps: Props
): Result {
  const { metrics, renderHistory } = profiler;
  const { enabled, logToConsole, slowRenderThreshold, trackPropChanges, maxRenderHistory } =
    profiler as unknown as InternalProfilerOptions;

  if (!enabled) {
    return renderFn(nextProps);
  }

  // Check if this is a wasted render
  let isWastedRender = false;
  let changedProps: string[] = [];

  if (prevProps && trackPropChanges) {
    isWastedRender = true;
    changedProps = [];

    // Compare props to find changes
    const prevEntries = Object.entries(prevProps);
    const nextEntries = Object.entries(nextProps as Record<string, unknown>);

    // Check if unknown props were added or removed
    if (prevEntries.length !== nextEntries.length) {
      isWastedRender = false;
    } else {
      // Check each prop for changes
      for (const [key, value] of nextEntries) {
        const prevValue = (prevProps as Record<string, unknown>)[key];
        if (!isEqual(value, prevValue)) {
          isWastedRender = false;
          changedProps.push(key);
        }
      }
    }
  }

  // Start timing the render
  const startTime = performance.now();

  // Call the render function
  let result;
  try {
    result = renderFn(nextProps);
  } catch (error) {
    console.error(`Error rendering ${metrics.componentName}:`, error);
    throw error;
  }

  // Calculate render time
  const endTime = performance.now();
  const renderTime = endTime - startTime;

  // Update metrics
  metrics.renderCount++;
  metrics.lastRenderTime = renderTime;
  metrics.totalRenderTime += renderTime;
  metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;
  metrics.maxRenderTime = Math.max(metrics.maxRenderTime, renderTime);
  metrics.lastRenderTimestamp = Date.now();

  if (isWastedRender) {
    metrics.wastedRenders++;
  }

  if (trackPropChanges) {
    metrics.lastChangedProps = changedProps;
  }

  // Add to render history
  if (renderHistory.length >= maxRenderHistory) {
    renderHistory.shift();
  }

  renderHistory.push({
    timestamp: Date.now(),
    renderTime,
    wasted: isWastedRender,
    changedProps: trackPropChanges ? changedProps : undefined,
  });

  // Log slow renders
  if (logToConsole && renderTime > slowRenderThreshold) {
    console.warn(
      `Slow render detected in ${metrics.componentName}: ${renderTime.toFixed(2)}ms ` +
        `(threshold: ${slowRenderThreshold}ms)`
    );
  }

  return result;
}

/**
 * Creates a profiled version of a component
 *
 * @param Component The component to profile
 * @param options Profiling options
 * @returns A profiled version of the component
 */
export function withProfiling<Props>(
  Component: ComponentType<Props>,
  options: Partial<ComponentProfilingOptions> = {}
): ComponentType<Props> & { profiler: ComponentProfilingResult } {
  const componentName = Component.displayName ?? Component.name ?? 'UnnamedComponent';
  const profiler = createComponentProfiler(componentName, options);

  // Create a profiled component
  const ProfiledComponent = React.memo(
    (props: Props): ReactElement => {
      // Store previous props for comparison
      const prevPropsRef = useRef<Props | null>(null);

              // Profile the render
        const result = profileRender<Props, ReactElement>(
          p => React.createElement(Component as React.ComponentType<unknown>, p as unknown as React.Attributes),
        profiler,
        prevPropsRef.current,
        props
      );

      // Update previous props
      useEffect(() => {
        prevPropsRef.current = props;
      });

      return result;
    },
    () => {
      // Always return false to let the profileRender function handle the comparison
      return false;
    }
  );

  // Add profiler to the component
  const EnhancedComponent = ProfiledComponent as unknown as ComponentType<Props> & {
    profiler: ComponentProfilingResult;
  };
  EnhancedComponent.profiler = profiler;
  EnhancedComponent.displayName = `Profiled(${componentName})`;

  return EnhancedComponent;
}

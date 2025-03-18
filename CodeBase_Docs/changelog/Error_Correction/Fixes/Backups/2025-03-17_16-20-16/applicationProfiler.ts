import {
  ApplicationProfilingMetrics,
  ApplicationProfilingOptions,
  ApplicationProfilingResult,
  ComponentProfilingResult,
  ComponentRenderMetrics,
} from '../../types/ui/UITypes';
import { createComponentProfiler } from './componentProfiler';

/**
 * Default application profiling options
 */
const DEFAULT_APPLICATION_PROFILING_OPTIONS: ApplicationProfilingOptions = {
  enabled: true,
  logToConsole: false,
  slowRenderThreshold: 16, // 1 frame at 60fps
  maxRenderHistory: 100,
  trackPropChanges: true,
  trackRenderPath: false,
  autoProfileAll: false,
  includePatterns: [],
  excludePatterns: [],
};

/**
 * Creates an application profiler for measuring application-wide performance
 *
 * @param options Application profiling options
 * @returns An application profiling result
 */
export function createApplicationProfiler(
  options: Partial<ApplicationProfilingOptions> = {}
): ApplicationProfilingResult {
  // Merge options with defaults
  const profilingOptions: ApplicationProfilingOptions = {
    ...DEFAULT_APPLICATION_PROFILING_OPTIONS,
    ...options,
  };

  // Store component profilers
  const componentProfilers = new Map<string, ComponentProfilingResult>();

  // Track profiling state
  let isProfilingActive = false;
  let profilingStartTime = 0;

  /**
   * Gets or creates a component profiler
   *
   * @param componentName The name of the component to profile
   * @returns A component profiling result
   */
  const getOrCreateProfiler = (componentName: string): ComponentProfilingResult => {
    if (!componentProfilers.has(componentName)) {
      const profiler = createComponentProfiler(componentName, profilingOptions);
      componentProfilers.set(componentName, profiler);
    }
    return componentProfilers.get(componentName)!;
  };

  /**
   * Checks if a component should be profiled based on include/exclude patterns
   *
   * @param componentName The name of the component to check
   * @returns Whether the component should be profiled
   */
  const shouldProfileComponent = (componentName: string): boolean => {
    if (!isProfilingActive) {
      return false;
    }

    if (profilingOptions.autoProfileAll) {
      // Check exclude patterns first
      if (profilingOptions.excludePatterns && profilingOptions.excludePatterns.length > 0) {
        for (const pattern of profilingOptions.excludePatterns) {
          if (new RegExp(pattern).test(componentName)) {
            return false;
          }
        }
      }
      return true;
    }

    // Check include patterns
    if (profilingOptions.includePatterns && profilingOptions.includePatterns.length > 0) {
      for (const pattern of profilingOptions.includePatterns) {
        if (new RegExp(pattern).test(componentName)) {
          return true;
        }
      }
    }

    return false;
  };

  /**
   * Gets application metrics
   *
   * @returns Application profiling metrics
   */
  const getMetrics = (): ApplicationProfilingMetrics => {
    const componentMetrics: ComponentRenderMetrics[] = Array.from(componentProfilers.values()).map(
      profiler => profiler.metrics
    );

    // Calculate total renders and wasted renders
    const totalRenders = componentMetrics.reduce(
      (total, metrics) => total + metrics.renderCount,
      0
    );
    const totalWastedRenders = componentMetrics.reduce(
      (total, metrics) => total + metrics.wastedRenders,
      0
    );

    // Calculate average render time
    const totalRenderTime = componentMetrics.reduce(
      (total, metrics) => total + metrics.totalRenderTime,
      0
    );
    const averageRenderTime = componentMetrics.length > 0 ? totalRenderTime / totalRenders : 0;

    // Sort components by render count, render time, and wasted renders
    const componentsByRenderCount = [...componentMetrics].sort(
      (a, b) => b.renderCount - a.renderCount
    );
    const componentsByRenderTime = [...componentMetrics].sort(
      (a, b) => b.averageRenderTime - a.averageRenderTime
    );
    const componentsByWastedRenders = [...componentMetrics].sort(
      (a, b) => b.wastedRenders - a.wastedRenders
    );

    return {
      totalRenders,
      totalWastedRenders,
      averageRenderTime,
      componentsByRenderCount,
      componentsByRenderTime,
      componentsByWastedRenders,
      profilingStartTime,
      profilingDuration: isProfilingActive ? Date.now() - profilingStartTime : 0,
    };
  };

  /**
   * Gets component metrics
   *
   * @param componentName The name of the component to get metrics for
   * @returns Component render metrics or null if the component is not being profiled
   */
  const getComponentMetrics = (componentName: string): ComponentRenderMetrics | null => {
    // Use getOrCreateProfiler to ensure the component is being profiled
    if (shouldProfileComponent(componentName)) {
      const profiler = getOrCreateProfiler(componentName);
      return profiler.metrics;
    }

    const profiler = componentProfilers.get(componentName);
    return profiler ? profiler.metrics : null;
  };

  /**
   * Resets all metrics
   */
  const resetAll = (): void => {
    for (const profiler of componentProfilers.values()) {
      profiler.reset();
    }
    profilingStartTime = Date.now();
  };

  /**
   * Resets metrics for a specific component
   *
   * @param componentName The name of the component to reset metrics for
   */
  const resetComponent = (componentName: string): void => {
    // Use getOrCreateProfiler to ensure the component exists before resetting
    if (shouldProfileComponent(componentName)) {
      const profiler = getOrCreateProfiler(componentName);
      profiler.reset();
      return;
    }

    const profiler = componentProfilers.get(componentName);
    if (profiler) {
      profiler.reset();
    }
  };

  /**
   * Updates profiling options
   *
   * @param newOptions New profiling options
   */
  const updateOptions = (newOptions: Partial<ApplicationProfilingOptions>): void => {
    Object.assign(profilingOptions, newOptions);

    // Update options for all component profilers
    for (const profiler of componentProfilers.values()) {
      profiler.updateOptions(newOptions);
    }
  };

  /**
   * Starts profiling
   */
  const start = (): void => {
    isProfilingActive = true;
    profilingStartTime = Date.now();
    console.warn('[ApplicationProfiler] Started profiling');
  };

  /**
   * Stops profiling
   */
  const stop = (): void => {
    isProfilingActive = false;
    console.warn('[ApplicationProfiler] Stopped profiling');
  };

  /**
   * Checks if profiling is active
   *
   * @returns Whether profiling is active
   */
  const isActive = (): boolean => {
    return isProfilingActive;
  };

  // Start profiling if enabled
  if (profilingOptions.enabled) {
    start();
  }

  return {
    getMetrics,
    getComponentMetrics,
    resetAll,
    resetComponent,
    updateOptions,
    start,
    stop,
    isActive,
    // Export these functions for external use
    getOrCreateProfiler,
    shouldProfileComponent,
  };
}

/**
 * Global application profiler instance
 */
export const applicationProfiler = createApplicationProfiler();

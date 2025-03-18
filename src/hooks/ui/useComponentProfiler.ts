import { useEffect, useRef, useState } from 'react';
import { ComponentProfilingOptions, ComponentProfilingResult } from '../../types/ui/UITypes';
import { createComponentProfiler } from '../../utils/profiling/componentProfiler';

/**
 * Hook for profiling component renders
 *
 * @param componentName The name of the component to profile
 * @param options Profiling options
 * @returns A component profiling result
 */
export function useComponentProfiler(
  componentName: string,
  options: Partial<ComponentProfilingOptions> = {}
): ComponentProfilingResult {
  // Create a ref to store the profiler
  const profilerRef = useRef<ComponentProfilingResult | null>(null);

  // Initialize the profiler if it doesn't exist
  if (!profilerRef.current) {
    profilerRef.current = createComponentProfiler(componentName, options);
  }

  // Get the profiler
  const profiler = profilerRef.current;

  // Update options when they change
  useEffect(() => {
    profiler.updateOptions(options);
  }, [profiler, options]);

  // Record render time
  const renderStartTime = useRef(performance.now());

  // Use layout effect to measure render time
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;

    // Update metrics
    profiler.metrics.renderCount++;
    profiler.metrics.lastRenderTime = renderTime;
    profiler.metrics.totalRenderTime += renderTime;
    profiler.metrics.averageRenderTime =
      profiler.metrics.totalRenderTime / profiler.metrics.renderCount;
    profiler.metrics.maxRenderTime = Math.max(profiler.metrics.maxRenderTime, renderTime);
    profiler.metrics.lastRenderTimestamp = Date.now();

    // Add to render history
    if (profiler.renderHistory.length >= (options?.maxRenderHistory || 100)) {
      profiler.renderHistory.shift();
    }

    profiler.renderHistory.push({
      timestamp: Date.now(),
      renderTime,
      wasted: false,
      changedProps: [],
    });

    // Log slow renders
    if (options?.logToConsole && renderTime > (options?.slowRenderThreshold || 16)) {
      console.warn(
        `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms ` +
          `(threshold: ${options?.slowRenderThreshold || 16}ms)`
      );
    }

    // Reset render start time for next render
    renderStartTime.current = performance.now();
  });

  return profiler;
}

/**
 * Hook for profiling component renders with state updates
 *
 * @param componentName The name of the component to profile
 * @param options Profiling options
 * @returns A tuple containing the component profiling result and a function to force a metrics update
 */
export function useComponentProfilerWithUpdates(
  componentName: string,
  options: Partial<ComponentProfilingOptions> = {}
): [ComponentProfilingResult, () => void] {
  const [, forceUpdate] = useState({});
  const profiler = useComponentProfiler(componentName, options);

  // Function to force a metrics update
  const updateMetrics = () => {
    forceUpdate({});
  };

  return [profiler, updateMetrics];
}

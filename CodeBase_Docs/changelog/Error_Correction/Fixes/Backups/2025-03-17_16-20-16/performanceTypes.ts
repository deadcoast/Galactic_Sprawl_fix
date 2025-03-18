/**
 * Performance Types
 *
 * Shared types for the performance components.
 */

/**
 * A single data point for metrics
 */
export interface MetricPoint {
  timestamp: number;
  value: number;
}

/**
 * Performance metrics for comparison
 */
export interface PerformanceMetrics {
  fps: MetricPoint[];
  renderTime: MetricPoint[];
  cpuTime: MetricPoint[];
  domOperations: MetricPoint[];
  memoryUsage: MetricPoint[];
  animationSmoothness: MetricPoint[];
}

/**
 * Statistical comparison between optimized and unoptimized metrics
 */
export interface PerformanceComparison {
  metric: string;
  optimized: number;
  unoptimized: number;
  difference: number;
  percentImprovement: number;
}

/**
 * Configuration for optimization features
 */
export interface OptimizationConfig {
  useMemoizedAccessors: boolean;
  useOptimizedSimulation: boolean;
  useBatchedDOMUpdates: boolean;
  useThrottledRendering: boolean;
  minFrameTimeMs: number;
  useWorkerSimulation: boolean;
}

/**
 * Comparison mode options
 */
export type ComparisonMode = 'side-by-side' | 'overlay';

/**
 * Active visualization mode
 */
export type ActiveMode = 'optimized' | 'unoptimized' | 'both';

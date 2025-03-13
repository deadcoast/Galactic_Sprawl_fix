/**
 * Unified Performance Testing Utilities
 * 
 * This module provides standardized utilities for:
 * - Measuring execution time and memory usage
 * - Running benchmarks and collecting statistics
 * - Performance reporting and analysis
 * - Optimizing test performance through caching and parallel execution
 */

import { performance } from 'perf_hooks';

// Re-export specific utilities from existing files
export { 
  executeTestsInParallel,
  parallelDescribe,
  optimizeResourceIntensiveOperation,
  clearOperationCache,
  createLazyTestValue,
  parallelSetup,
  conditionalSetup 
} from './testPerformanceUtils';

/**
 * Performance Environment Detection
 */

/**
 * Detects if the code is running in a Node.js environment
 */
export const isNodeEnvironment = typeof process !== 'undefined' && 
  process.versions != null && process.versions.node != null;

/**
 * Detects if the code is running in a browser environment
 */
export const isBrowserEnvironment = typeof window !== 'undefined';

/**
 * Time Measurement Utilities
 */

/**
 * Measures the execution time of a function
 * 
 * @param fn Function to measure
 * @param args Arguments to pass to the function
 * @returns Object containing the result and execution time in milliseconds
 * 
 * @example
 * const { result, executionTime } = measureExecutionTime(myFunction, arg1, arg2);
 * console.log(`Function took ${executionTime}ms to execute`);
 */
export function measureExecutionTime<T, Args extends unknown[]>(
  fn: (...args: Args) => T,
  ...args: Args
): { result: T; executionTime: number } {
  const start = performance.now();
  const result = fn(...args);
  const end = performance.now();

  return {
    result,
    executionTime: end - start,
  };
}

/**
 * Measures the execution time of an async function
 * 
 * @param fn Async function to measure
 * @param args Arguments to pass to the function
 * @returns Promise resolving to an object containing the result and execution time in milliseconds
 * 
 * @example
 * const { result, executionTime } = await measureAsyncExecutionTime(fetchData, 'userId');
 * console.log(`Data fetching took ${executionTime}ms`);
 */
export async function measureAsyncExecutionTime<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  ...args: Args
): Promise<{ result: T; executionTime: number }> {
  const start = performance.now();
  const result = await fn(...args);
  const end = performance.now();

  return {
    result,
    executionTime: end - start,
  };
}

/**
 * Benchmark Utilities
 */

/**
 * Statistical results from benchmark runs
 */
export interface BenchmarkResults {
  /** Average execution time in ms */
  average: number;
  /** Minimum execution time in ms */
  min: number;
  /** Maximum execution time in ms */
  max: number;
  /** Median execution time in ms */
  median: number;
  /** Standard deviation of execution times */
  stdDev: number;
  /** Total execution time in ms */
  total: number;
  /** Number of iterations run */
  iterations: number;
  /** Percentile data (p50, p90, p95, p99) */
  percentiles: Record<string, number>;
}

/**
 * Runs a benchmark for a function
 * 
 * @param fn Function to benchmark
 * @param iterations Number of iterations to run
 * @param args Arguments to pass to the function
 * @returns Benchmark results including various statistics
 * 
 * @example
 * const results = runBenchmark(sortArray, 100, largeArray);
 * console.log(`Average sort time: ${results.average}ms`);
 */
export function runBenchmark<T, Args extends unknown[]>(
  fn: (...args: Args) => T,
  iterations = 100,
  ...args: Args
): BenchmarkResults {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const { executionTime } = measureExecutionTime(fn, ...args);
    times.push(executionTime);
  }

  return calculateStatistics(times);
}

/**
 * Runs a benchmark for an async function
 * 
 * @param fn Async function to benchmark
 * @param iterations Number of iterations to run
 * @param args Arguments to pass to the function
 * @returns Promise resolving to benchmark results
 * 
 * @example
 * const results = await runAsyncBenchmark(fetchData, 20, 'userId');
 * console.log(`95th percentile: ${results.percentiles.p95}ms`);
 */
export async function runAsyncBenchmark<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  iterations = 50,
  ...args: Args
): Promise<BenchmarkResults> {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const { executionTime } = await measureAsyncExecutionTime(fn, ...args);
    times.push(executionTime);
  }

  return calculateStatistics(times);
}

/**
 * Calculates statistical metrics from a set of timing measurements
 * 
 * @param times Array of execution times in milliseconds
 * @returns Object containing calculated statistics
 */
function calculateStatistics(times: number[]): BenchmarkResults {
  // Sort times for calculations
  const sortedTimes = [...times].sort((a, b) => a - b);
  const count = sortedTimes.length;
  
  // Basic statistics
  const total = sortedTimes.reduce((sum, time) => sum + time, 0);
  const average = total / count;
  const min = sortedTimes[0];
  const max = sortedTimes[count - 1];
  const median = count % 2 === 0
    ? (sortedTimes[count / 2 - 1] + sortedTimes[count / 2]) / 2
    : sortedTimes[Math.floor(count / 2)];
  
  // Calculate standard deviation
  const variance = sortedTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / count;
  const stdDev = Math.sqrt(variance);
  
  // Calculate percentiles
  const percentiles = {
    p50: median,
    p90: sortedTimes[Math.floor(count * 0.9)],
    p95: sortedTimes[Math.floor(count * 0.95)],
    p99: sortedTimes[Math.floor(count * 0.99)],
  };
  
  return {
    average,
    min,
    max,
    median,
    stdDev,
    total,
    iterations: count,
    percentiles,
  };
}

/**
 * Memory Measurement Utilities
 */

/**
 * Memory usage measurement results
 */
export interface MemoryUsageResults<T> {
  /** Result of the measured function */
  result: T;
  /** Memory usage before execution (if available) */
  memoryBefore?: NodeJS.MemoryUsage;
  /** Memory usage after execution (if available) */
  memoryAfter?: NodeJS.MemoryUsage;
  /** Memory usage difference in MB (negative values indicate memory was freed) */
  memoryDiffMB: {
    /** Resident set size difference in MB */
    rss?: number;
    /** Total heap size difference in MB */
    heapTotal?: number;
    /** Used heap size difference in MB */
    heapUsed?: number;
    /** External memory difference in MB */
    external?: number;
  };
}

/**
 * Converts bytes to megabytes
 */
function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

/**
 * Measures memory usage during function execution
 * 
 * @param fn Function to measure
 * @param args Arguments to pass to the function
 * @returns Object containing the result and memory usage information
 * 
 * @example
 * const { result, memoryDiffMB } = measureMemoryUsage(processLargeData, data);
 * console.log(`Memory used: ${memoryDiffMB.heapUsed}MB`);
 */
export function measureMemoryUsage<T, Args extends unknown[]>(
  fn: (...args: Args) => T,
  ...args: Args
): MemoryUsageResults<T> {
  let memoryBefore: NodeJS.MemoryUsage | undefined;
  let memoryAfter: NodeJS.MemoryUsage | undefined;
  
  // Only measure detailed memory if in Node environment
  if (isNodeEnvironment && typeof process.memoryUsage === 'function') {
    memoryBefore = process.memoryUsage();
  }
  
  // Run the function
  const result = fn(...args);
  
  // Get memory usage after
  if (isNodeEnvironment && typeof process.memoryUsage === 'function') {
    memoryAfter = process.memoryUsage();
  }
  
  // Calculate memory differences
  const memoryDiffMB: MemoryUsageResults<T>['memoryDiffMB'] = {};
  
  if (memoryBefore && memoryAfter) {
    memoryDiffMB.rss = bytesToMB(memoryAfter.rss - memoryBefore.rss);
    memoryDiffMB.heapTotal = bytesToMB(memoryAfter.heapTotal - memoryBefore.heapTotal);
    memoryDiffMB.heapUsed = bytesToMB(memoryAfter.heapUsed - memoryBefore.heapUsed);
    memoryDiffMB.external = bytesToMB(memoryAfter.external - memoryBefore.external);
  } else {
    // Simplified memory tracking for browser environments using performance.memory if available
    const performanceMemory = (performance as any).memory;
    if (performanceMemory) {
      memoryDiffMB.heapUsed = bytesToMB(performanceMemory.usedJSHeapSize);
    }
  }
  
  return {
    result,
    memoryBefore,
    memoryAfter,
    memoryDiffMB,
  };
}

/**
 * Measures memory usage during async function execution
 * 
 * @param fn Async function to measure
 * @param args Arguments to pass to the function
 * @returns Promise resolving to an object containing the result and memory usage information
 * 
 * @example
 * const { result, memoryDiffMB } = await measureAsyncMemoryUsage(fetchAndProcessData, userId);
 * console.log(`Heap memory used: ${memoryDiffMB.heapUsed}MB`);
 */
export async function measureAsyncMemoryUsage<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  ...args: Args
): Promise<MemoryUsageResults<T>> {
  let memoryBefore: NodeJS.MemoryUsage | undefined;
  let memoryAfter: NodeJS.MemoryUsage | undefined;
  
  // Only measure detailed memory if in Node environment
  if (isNodeEnvironment && typeof process.memoryUsage === 'function') {
    memoryBefore = process.memoryUsage();
  }
  
  // Run the function
  const result = await fn(...args);
  
  // Get memory usage after
  if (isNodeEnvironment && typeof process.memoryUsage === 'function') {
    memoryAfter = process.memoryUsage();
  }
  
  // Calculate memory differences
  const memoryDiffMB: MemoryUsageResults<T>['memoryDiffMB'] = {};
  
  if (memoryBefore && memoryAfter) {
    memoryDiffMB.rss = bytesToMB(memoryAfter.rss - memoryBefore.rss);
    memoryDiffMB.heapTotal = bytesToMB(memoryAfter.heapTotal - memoryBefore.heapTotal);
    memoryDiffMB.heapUsed = bytesToMB(memoryAfter.heapUsed - memoryBefore.heapUsed);
    memoryDiffMB.external = bytesToMB(memoryAfter.external - memoryBefore.external);
  } else {
    // Simplified memory tracking for browser environments using performance.memory if available
    const performanceMemory = (performance as any).memory;
    if (performanceMemory) {
      memoryDiffMB.heapUsed = bytesToMB(performanceMemory.usedJSHeapSize);
    }
  }
  
  return {
    result,
    memoryBefore,
    memoryAfter,
    memoryDiffMB,
  };
}

/**
 * Performance Reporting System
 */

/**
 * Interface for performance metrics
 */
export interface PerformanceMetric {
  name: string;
  samples: number[];
  threshold?: number;
}

/**
 * Interface for performance metric statistics
 */
export interface PerformanceMetricStats {
  name: string;
  count: number;
  average: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  threshold?: number;
  exceedsThreshold: boolean;
  percentiles: Record<string, number>;
}

/**
 * Creates a performance reporter for tracking and analyzing performance metrics
 * 
 * @returns A performance reporter object with methods for recording and analyzing metrics
 * 
 * @example
 * const reporter = createPerformanceReporter();
 * reporter.record('dataProcessing', 150, 200); // Record with threshold
 * reporter.measure('sorting', sortFunction, [largeArray]);
 * const stats = reporter.getStats('dataProcessing');
 * console.log(`Average: ${stats.average}ms, Exceeds threshold: ${stats.exceedsThreshold}`);
 */
export function createPerformanceReporter() {
  const metrics = new Map<string, PerformanceMetric>();
  
  return {
    /**
     * Records a performance metric
     * @param name Name of the metric
     * @param value Value to record (usually time in ms)
     * @param threshold Optional threshold for warnings
     */
    record(name: string, value: number, threshold?: number): void {
      let metric = metrics.get(name);
      
      if (!metric) {
        metric = { name, samples: [], threshold };
        metrics.set(name, metric);
      }
      
      metric.samples.push(value);
      
      if (threshold !== undefined && metric.threshold === undefined) {
        metric.threshold = threshold;
      }
    },
    
    /**
     * Gets statistics for a specific metric
     * @param name Name of the metric
     * @returns Statistics for the metric or undefined if not found
     */
    getStats(name: string): PerformanceMetricStats | undefined {
      const metric = metrics.get(name);
      
      if (!metric || metric.samples.length === 0) {
        return undefined;
      }
      
      const stats = calculateStatistics(metric.samples);
      const exceedsThreshold = metric.threshold !== undefined && stats.average > metric.threshold;
      
      return {
        name,
        count: stats.iterations,
        average: stats.average,
        median: stats.median,
        min: stats.min,
        max: stats.max,
        stdDev: stats.stdDev,
        threshold: metric.threshold,
        exceedsThreshold,
        percentiles: stats.percentiles,
      };
    },
    
    /**
     * Gets statistics for all metrics
     * @returns Array of statistics for all metrics
     */
    getAllStats(): PerformanceMetricStats[] {
      return Array.from(metrics.keys())
        .map(name => this.getStats(name))
        .filter((stats): stats is PerformanceMetricStats => stats !== undefined);
    },
    
    /**
     * Clears all recorded metrics
     */
    clear(): void {
      metrics.clear();
    },
    
    /**
     * Measures the execution time of a function and records it
     * @param name Name of the metric
     * @param fn Function to measure
     * @param args Arguments to pass to the function
     * @param threshold Optional threshold for warnings
     * @returns Result of the function
     */
    measure<T, Args extends unknown[]>(
      name: string,
      fn: (...args: Args) => T,
      args: Args,
      threshold?: number
    ): T {
      const { result, executionTime } = measureExecutionTime(fn, ...args);
      this.record(name, executionTime, threshold);
      return result;
    },
    
    /**
     * Measures the execution time of an async function and records it
     * @param name Name of the metric
     * @param fn Async function to measure
     * @param args Arguments to pass to the function
     * @param threshold Optional threshold for warnings
     * @returns Promise resolving to the result of the function
     */
    async measureAsync<T, Args extends unknown[]>(
      name: string,
      fn: (...args: Args) => Promise<T>,
      args: Args,
      threshold?: number
    ): Promise<T> {
      const { result, executionTime } = await measureAsyncExecutionTime(fn, ...args);
      this.record(name, executionTime, threshold);
      return result;
    },
    
    /**
     * Generates a performance report in a human-readable format
     * @returns String containing the performance report
     */
    generateReport(): string {
      const stats = this.getAllStats();
      if (stats.length === 0) {
        return 'No performance metrics recorded';
      }
      
      let report = 'Performance Report\n-----------------\n\n';
      
      stats.forEach(stat => {
        report += `Metric: ${stat.name}\n`;
        report += `Samples: ${stat.count}\n`;
        report += `Average: ${stat.average.toFixed(2)}ms\n`;
        report += `Min/Max: ${stat.min.toFixed(2)}ms / ${stat.max.toFixed(2)}ms\n`;
        report += `Median: ${stat.median.toFixed(2)}ms\n`;
        report += `StdDev: ${stat.stdDev.toFixed(2)}ms\n`;
        report += `Percentiles: p50=${stat.percentiles.p50.toFixed(2)}ms, p95=${stat.percentiles.p95.toFixed(2)}ms, p99=${stat.percentiles.p99.toFixed(2)}ms\n`;
        
        if (stat.threshold !== undefined) {
          report += `Threshold: ${stat.threshold.toFixed(2)}ms (${stat.exceedsThreshold ? 'EXCEEDED' : 'OK'})\n`;
        }
        
        report += '\n';
      });
      
      return report;
    }
  };
}
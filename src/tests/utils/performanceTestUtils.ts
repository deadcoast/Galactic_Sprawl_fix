/**
 * Measures the execution time of a function
 * @param fn Function to measure
 * @param args Arguments to pass to the function
 * @returns Object containing the result and execution time in milliseconds
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
 * @param fn Async function to measure
 * @param args Arguments to pass to the function
 * @returns Promise resolving to an object containing the result and execution time in milliseconds
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
 * Runs a benchmark for a function
 * @param fn Function to benchmark
 * @param iterations Number of iterations to run
 * @param args Arguments to pass to the function
 * @returns Benchmark results including average, min, max, and median execution times
 */
export function runBenchmark<T, Args extends unknown[]>(
  fn: (...args: Args) => T,
  iterations = 100,
  ...args: Args
): {
  average: number;
  min: number;
  max: number;
  median: number;
  total: number;
  iterations: number;
} {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const { executionTime } = measureExecutionTime(fn, ...args);
    times.push(executionTime);
  }

  // Sort times for min, max, and median calculations
  times.sort((a, b) => a - b);

  const total = times.reduce((sum, time) => sum + time, 0);
  const average = total / iterations;
  const min = times[0];
  const max = times[iterations - 1];
  const median =
    iterations % 2 === 0
      ? (times[iterations / 2 - 1] + times[iterations / 2]) / 2
      : times[Math.floor(iterations / 2)];

  return {
    average,
    min,
    max,
    median,
    total,
    iterations,
  };
}

/**
 * Runs a benchmark for an async function
 * @param fn Async function to benchmark
 * @param iterations Number of iterations to run
 * @param args Arguments to pass to the function
 * @returns Promise resolving to benchmark results
 */
export async function runAsyncBenchmark<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  iterations = 100,
  ...args: Args
): Promise<{
  average: number;
  min: number;
  max: number;
  median: number;
  total: number;
  iterations: number;
}> {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const { executionTime } = await measureAsyncExecutionTime(fn, ...args);
    times.push(executionTime);
  }

  // Sort times for min, max, and median calculations
  times.sort((a, b) => a - b);

  const total = times.reduce((sum, time) => sum + time, 0);
  const average = total / iterations;
  const min = times[0];
  const max = times[iterations - 1];
  const median =
    iterations % 2 === 0
      ? (times[iterations / 2 - 1] + times[iterations / 2]) / 2
      : times[Math.floor(iterations / 2)];

  return {
    average,
    min,
    max,
    median,
    total,
    iterations,
  };
}

/**
 * Creates a performance reporter for tracking and reporting performance metrics
 * @returns A performance reporter object
 */
export function createPerformanceReporter() {
  const metrics: Record<
    string,
    {
      samples: number[];
      threshold?: number;
    }
  > = {};

  return {
    /**
     * Records a performance metric
     * @param name Name of the metric
     * @param value Value to record
     * @param threshold Optional threshold for warnings
     */
    record: (name: string, value: number, threshold?: number) => {
      if (!metrics[name]) {
        metrics[name] = { samples: [], threshold };
      }

      metrics[name].samples.push(value);

      if (threshold !== undefined) {
        metrics[name].threshold = threshold;
      }
    },

    /**
     * Gets statistics for a specific metric
     * @param name Name of the metric
     * @returns Statistics for the metric or undefined if not found
     */
    getStats: (name: string) => {
      const metric = metrics[name];

      if (!metric || metric.samples.length === 0) {
        return undefined;
      }

      const samples = [...metric.samples].sort((a, b) => a - b);
      const count = samples.length;
      const sum = samples.reduce((acc, val) => acc + val, 0);
      const average = sum / count;
      const min = samples[0];
      const max = samples[count - 1];
      const median =
        count % 2 === 0
          ? (samples[count / 2 - 1] + samples[count / 2]) / 2
          : samples[Math.floor(count / 2)];

      // Calculate standard deviation
      const squaredDiffs = samples.map(s => Math.pow(s - average, 2));
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / count;
      const stdDev = Math.sqrt(variance);

      // Check if exceeds threshold
      const exceedsThreshold = metric.threshold !== undefined && average > metric.threshold;

      return {
        name,
        count,
        average,
        median,
        min,
        max,
        stdDev,
        threshold: metric.threshold,
        exceedsThreshold,
      };
    },

    /**
     * Gets statistics for all metrics
     * @returns Array of statistics for all metrics
     */
    getAllStats: () => {
      return Object.keys(metrics)
        .map(name => {
          return {
            name,
            ...createPerformanceReporter().getStats(name),
          };
        })
        .filter(Boolean);
    },

    /**
     * Clears all recorded metrics
     */
    clear: () => {
      Object.keys(metrics).forEach(key => {
        delete metrics[key];
      });
    },

    /**
     * Measures the execution time of a function and records it
     * @param name Name of the metric
     * @param fn Function to measure
     * @param args Arguments to pass to the function
     * @param threshold Optional threshold for warnings
     * @returns Result of the function
     */
    measure: <T, Args extends unknown[]>(
      name: string,
      fn: (...args: Args) => T,
      args: Args,
      threshold?: number
    ): T => {
      const { result, executionTime } = measureExecutionTime(fn, ...args);
      createPerformanceReporter().record(name, executionTime, threshold);
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
    measureAsync: async <T, Args extends unknown[]>(
      name: string,
      fn: (...args: Args) => Promise<T>,
      args: Args,
      threshold?: number
    ): Promise<T> => {
      const { result, executionTime } = await measureAsyncExecutionTime(fn, ...args);
      createPerformanceReporter().record(name, executionTime, threshold);
      return result;
    },
  };
}

/**
 * Measures memory usage before and after a function execution
 * @param fn Function to measure
 * @param args Arguments to pass to the function
 * @returns Object containing the result, memory usage before and after, and the difference
 */
export function measureMemoryUsage<T, Args extends unknown[]>(
  fn: (...args: Args) => T,
  ...args: Args
): {
  result: T;
  memoryBefore: NodeJS.MemoryUsage;
  memoryAfter: NodeJS.MemoryUsage;
  diff: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
} {
  // Get memory usage before
  const memoryBefore = process.memoryUsage();

  // Run the function
  const result = fn(...args);

  // Get memory usage after
  const memoryAfter = process.memoryUsage();

  // Calculate difference
  const diff = {
    rss: memoryAfter.rss - memoryBefore.rss,
    heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
    heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
    external: memoryAfter.external - memoryBefore.external,
    arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers,
  };

  return {
    result,
    memoryBefore,
    memoryAfter,
    diff,
  };
}

/**
 * Measures memory usage before and after an async function execution
 * @param fn Async function to measure
 * @param args Arguments to pass to the function
 * @returns Promise resolving to an object containing the result and memory usage information
 */
export async function measureAsyncMemoryUsage<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  ...args: Args
): Promise<{
  result: T;
  memoryBefore: NodeJS.MemoryUsage;
  memoryAfter: NodeJS.MemoryUsage;
  diff: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
}> {
  // Get memory usage before
  const memoryBefore = process.memoryUsage();

  // Run the function
  const result = await fn(...args);

  // Get memory usage after
  const memoryAfter = process.memoryUsage();

  // Calculate difference
  const diff = {
    rss: memoryAfter.rss - memoryBefore.rss,
    heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
    heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
    external: memoryAfter.external - memoryBefore.external,
    arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers,
  };

  return {
    result,
    memoryBefore,
    memoryAfter,
    diff,
  };
}

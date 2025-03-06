/**
 * Test Performance Optimization Utilities
 *
 * This file contains utilities for optimizing test performance, including:
 * - Parallel test execution
 * - Test execution time reduction
 * - Resource-intensive operation optimization
 */

/**
 * Interface for a test task that can be run in parallel
 */
export interface ParallelTestTask<T> {
  name: string;
  task: () => Promise<T>;
}

/**
 * Interface for parallel test execution options
 */
export interface ParallelExecutionOptions {
  /**
   * Maximum number of concurrent tasks
   * @default 4
   */
  concurrency?: number;

  /**
   * Whether to continue execution if a task fails
   * @default false
   */
  continueOnError?: boolean;

  /**
   * Timeout for each task in milliseconds
   * @default 5000
   */
  taskTimeout?: number;

  /**
   * Whether to log progress
   * @default false
   */
  logProgress?: boolean;
}

/**
 * Interface for parallel test execution results
 */
export interface ParallelExecutionResults<T> {
  /**
   * Results of successful tasks
   */
  results: Record<string, T>;

  /**
   * Errors from failed tasks
   */
  errors: Record<string, Error>;

  /**
   * Total execution time in milliseconds
   */
  totalExecutionTimeMs: number;

  /**
   * Number of successful tasks
   */
  successCount: number;

  /**
   * Number of failed tasks
   */
  failureCount: number;
}

/**
 * Executes test tasks in parallel with controlled concurrency
 *
 * @param tasks Array of tasks to execute
 * @param options Execution options
 * @returns Results of parallel execution
 */
export async function executeTestsInParallel<T>(
  tasks: ParallelTestTask<T>[],
  options: ParallelExecutionOptions = {}
): Promise<ParallelExecutionResults<T>> {
  const {
    concurrency = 4,
    continueOnError = false,
    taskTimeout = 5000,
    logProgress = false,
  } = options;

  const results: Record<string, T> = {};
  const errors: Record<string, Error> = {};
  const startTime = performance.now();

  // Create a queue of tasks
  const queue = [...tasks];
  const inProgress = new Set<string>();
  let successCount = 0;
  let failureCount = 0;

  // Process the queue with controlled concurrency
  const processQueue = async (): Promise<void> => {
    if (queue.length === 0 || inProgress.size >= concurrency) {
      return;
    }

    const { name, task } = queue.shift()!;
    inProgress.add(name);

    if (logProgress) {
      console.log(`Starting task: ${name}`);
    }

    try {
      // Execute the task with a timeout
      const result = await Promise.race([
        task(),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error(`Task ${name} timed out after ${taskTimeout}ms`)),
            taskTimeout
          );
        }),
      ]);

      results[name] = result;
      successCount++;

      if (logProgress) {
        console.log(`Completed task: ${name}`);
      }
    } catch (error) {
      errors[name] = error as Error;
      failureCount++;

      if (logProgress) {
        console.error(`Failed task: ${name}`, error);
      }

      if (!continueOnError) {
        // Clear the queue to stop processing
        queue.length = 0;
      }
    } finally {
      inProgress.delete(name);

      // Process the next task
      await processQueue();
    }
  };

  // Start processing tasks up to the concurrency limit
  const initialProcessors = Math.min(concurrency, tasks.length);
  await Promise.all(Array.from({ length: initialProcessors }, () => processQueue()));

  const endTime = performance.now();

  return {
    results,
    errors,
    totalExecutionTimeMs: endTime - startTime,
    successCount,
    failureCount,
  };
}

/**
 * Creates a test suite that runs tests in parallel
 *
 * @param suiteName Name of the test suite
 * @param tests Object containing test functions
 * @param options Parallel execution options
 */
export function parallelDescribe(
  suiteName: string,
  tests: Record<string, () => Promise<void>>,
  options: ParallelExecutionOptions = {}
): void {
  describe(suiteName, () => {
    it('runs tests in parallel', async () => {
      const tasks = Object.entries(tests).map(([name, task]) => ({
        name,
        task,
      }));

      const results = await executeTestsInParallel(tasks, options);

      // Report any failures
      if (results.failureCount > 0) {
        const errorMessages = Object.entries(results.errors)
          .map(([name, error]) => `${name}: ${error.message}`)
          .join('\n');

        throw new Error(`${results.failureCount} parallel tests failed:\n${errorMessages}`);
      }
    });
  });
}

/**
 * Options for optimizing resource-intensive operations
 */
export interface ResourceOptimizationOptions {
  /**
   * Whether to use a worker thread for the operation
   * @default false
   */
  useWorker?: boolean;

  /**
   * Whether to cache the result
   * @default true
   */
  cacheResult?: boolean;

  /**
   * Time-to-live for cached results in milliseconds
   * @default 60000 (1 minute)
   */
  cacheTTL?: number;
}

// Type for cached operation results
interface CachedOperation<T> {
  result: T;
  timestamp: number;
}

// Cache for optimized operations
const operationCache = new Map<string, CachedOperation<unknown>>();

/**
 * Optimizes a resource-intensive operation by using caching and/or worker threads
 *
 * @param operationId Unique identifier for the operation
 * @param operation Function that performs the operation
 * @param options Optimization options
 * @returns Result of the operation
 */
export async function optimizeResourceIntensiveOperation<T>(
  operationId: string,
  operation: () => Promise<T> | T,
  options: ResourceOptimizationOptions = {}
): Promise<T> {
  const { cacheResult = true, cacheTTL = 60000 } = options;

  // Check cache first if enabled
  if (cacheResult) {
    const cached = operationCache.get(operationId);
    if (cached && performance.now() - cached.timestamp < cacheTTL) {
      return cached.result as T;
    }
  }

  // Execute the operation
  const result = await operation();

  // Cache the result if enabled
  if (cacheResult) {
    operationCache.set(operationId, {
      result,
      timestamp: performance.now(),
    });
  }

  return result;
}

/**
 * Clears the operation cache
 *
 * @param operationId Optional operation ID to clear specific cache entry
 */
export function clearOperationCache(operationId?: string): void {
  if (operationId) {
    operationCache.delete(operationId);
  } else {
    operationCache.clear();
  }
}

/**
 * Options for lazy initialization in tests
 */
export interface LazyInitOptions {
  /**
   * Whether to initialize immediately or on first use
   * @default false (lazy initialization)
   */
  immediate?: boolean;
}

/**
 * Creates a lazily initialized value for tests
 *
 * @param factory Factory function that creates the value
 * @param options Initialization options
 * @returns Object with get method to access the value
 */
export function createLazyTestValue<T>(
  factory: () => T,
  options: LazyInitOptions = {}
): { get: () => T; reset: () => void } {
  const { immediate = false } = options;

  let instance: T | undefined;
  let initialized = false;

  if (immediate) {
    instance = factory();
    initialized = true;
  }

  return {
    get: () => {
      if (!initialized) {
        instance = factory();
        initialized = true;
      }
      return instance as T;
    },
    reset: () => {
      instance = undefined;
      initialized = false;
    },
  };
}

/**
 * Runs setup operations in parallel to reduce test initialization time
 *
 * @param setupOperations Object containing setup operations
 * @returns Object containing the results of setup operations
 */
export async function parallelSetup<T extends Record<string, unknown>>(setupOperations: {
  [K in keyof T]: () => Promise<T[K]>;
}): Promise<T> {
  const keys = Object.keys(setupOperations) as Array<keyof T>;
  const tasks = keys.map(key => ({
    name: key as string,
    task: setupOperations[key],
  }));

  const { results } = await executeTestsInParallel(tasks);

  return results as unknown as T;
}

// Type for module implementation
type ModuleImplementation = Record<string, (...args: unknown[]) => unknown>;

/**
 * Mocks expensive operations to improve test performance
 *
 * Note: This function uses dynamic imports which may not work in all environments.
 * It's primarily intended for use in Node.js test environments.
 *
 * @param mockImplementations Object containing mock implementations
 * @returns Function to restore original implementations
 */
export function mockExpensiveOperations(mockImplementations: ModuleImplementation): () => void {
  const originalImplementations: Record<string, unknown> = {};

  // Apply mock implementations
  Object.entries(mockImplementations).forEach(async ([path, implementation]) => {
    const [modulePath, exportName] = path.split('#');

    // Store original implementation
    try {
      // Use dynamic import instead of require
      const module = await import(modulePath);
      originalImplementations[path] = module[exportName];

      // Apply mock
      module[exportName] = implementation;
    } catch (error) {
      console.error(`Failed to mock ${path}:`, error);
    }
  });

  // Return function to restore original implementations
  return () => {
    Object.entries(originalImplementations).forEach(async ([path, implementation]) => {
      const [modulePath, exportName] = path.split('#');

      try {
        // Use dynamic import instead of require
        const module = await import(modulePath);
        module[exportName] = implementation;
      } catch (error) {
        console.error(`Failed to restore ${path}:`, error);
      }
    });
  };
}

/**
 * Skips expensive setup operations in tests when they're not needed
 *
 * @param setupFn Function that performs the setup
 * @param condition Function that determines if setup is needed
 * @returns Result of the setup function or undefined if skipped
 */
export function conditionalSetup<T>(setupFn: () => T, condition: () => boolean): T | undefined {
  if (condition()) {
    return setupFn();
  }
  return undefined;
}

/**
 * Measures memory usage during test execution
 *
 * @param testFn Function that performs the test
 * @returns Object containing the test result and memory usage information
 */
export async function measureMemoryUsage<T>(
  testFn: () => Promise<T> | T
): Promise<{ result: T; memoryUsageMB: number }> {
  // Capture memory usage before the test
  const memoryBefore = process.memoryUsage?.() || { heapUsed: 0 };

  // Run the test
  const result = await testFn();

  // Capture memory usage after the test
  const memoryAfter = process.memoryUsage?.() || { heapUsed: 0 };

  // Calculate memory usage difference in MB
  const memoryUsageMB = (memoryAfter.heapUsed - memoryBefore.heapUsed) / (1024 * 1024);

  return {
    result,
    memoryUsageMB,
  };
}

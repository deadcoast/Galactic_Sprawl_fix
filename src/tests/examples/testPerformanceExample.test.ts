import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  conditionalSetup,
  createLazyTestValue,
  executeTestsInParallel,
  measureMemoryUsage,
  optimizeResourceIntensiveOperation,
  parallelDescribe,
  parallelSetup,
} from '../utils/testPerformanceUtils';

/**
 * Example test file demonstrating the usage of test performance utilities
 */

describe('Test Performance Utilities Example', () => {
  // Clean up after each test
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Parallel Test Execution', () => {
    it('should execute tasks in parallel', async () => {
      // Create some test tasks
      const tasks = [
        {
          name: 'task1',
          task: async () => {
            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, 50));
            return 'result1';
          },
        },
        {
          name: 'task2',
          task: async () => {
            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, 50));
            return 'result2';
          },
        },
        {
          name: 'task3',
          task: async () => {
            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, 50));
            return 'result3';
          },
        },
      ];

      // Execute tasks in parallel
      const results = await executeTestsInParallel(tasks, {
        concurrency: 3,
        logProgress: false,
      });

      // Verify results
      expect(results.successCount).toBe(3);
      expect(results.failureCount).toBe(0);
      expect(results.results).toEqual({
        task1: 'result1',
        task2: 'result2',
        task3: 'result3',
      });

      // Verify execution time (should be less than running sequentially)
      // Sequential would be ~150ms, parallel should be ~50ms
      expect(results.totalExecutionTimeMs).toBeLessThan(150);
    });

    it('should handle task failures', async () => {
      // Create some test tasks with a failure
      const tasks = [
        {
          name: 'successTask',
          task: async () => 'success',
        },
        {
          name: 'failureTask',
          task: async () => {
            throw new Error('Task failed');
          },
        },
      ];

      // Execute tasks in parallel with continueOnError
      const results = await executeTestsInParallel(tasks, {
        continueOnError: true,
      });

      // Verify results
      expect(results.successCount).toBe(1);
      expect(results.failureCount).toBe(1);
      expect(results.results.successTask).toBe('success');
      expect(results.errors.failureTask).toBeInstanceOf(Error);
      expect(results.errors.failureTask.message).toBe('Task failed');
    });
  });

  describe('Resource Optimization', () => {
    it('should cache resource-intensive operations', async () => {
      // Create a mock resource-intensive operation
      const expensiveOperation = vi.fn().mockResolvedValue('expensive result');

      // First call should execute the operation
      const result1 = await optimizeResourceIntensiveOperation(
        'test-operation',
        expensiveOperation,
        { cacheTTL: 1000 }
      );

      // Second call should use the cached result
      const result2 = await optimizeResourceIntensiveOperation(
        'test-operation',
        expensiveOperation,
        { cacheTTL: 1000 }
      );

      // Verify results
      expect(result1).toBe('expensive result');
      expect(result2).toBe('expensive result');

      // Verify the operation was only called once
      expect(expensiveOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Lazy Initialization', () => {
    it('should lazily initialize values', () => {
      // Create a mock factory
      const factory = vi.fn().mockReturnValue('initialized value');

      // Create a lazy value
      const lazyValue = createLazyTestValue(factory);

      // Factory should not be called yet
      expect(factory).not.toHaveBeenCalled();

      // Access the value
      const value = lazyValue.get();

      // Factory should be called now
      expect(factory).toHaveBeenCalledTimes(1);
      expect(value).toBe('initialized value');

      // Access the value again
      const value2 = lazyValue.get();

      // Factory should not be called again
      expect(factory).toHaveBeenCalledTimes(1);
      expect(value2).toBe('initialized value');

      // Reset the value
      lazyValue.reset();

      // Access the value after reset
      const value3 = lazyValue.get();

      // Factory should be called again
      expect(factory).toHaveBeenCalledTimes(2);
      expect(value3).toBe('initialized value');
    });

    it('should support immediate initialization', () => {
      // Create a mock factory
      const factory = vi.fn().mockReturnValue('immediate value');

      // Create an immediate value
      const immediateValue = createLazyTestValue(factory, { immediate: true });

      // Factory should be called immediately
      expect(factory).toHaveBeenCalledTimes(1);

      // Access the value
      const value = immediateValue.get();

      // Factory should not be called again
      expect(factory).toHaveBeenCalledTimes(1);
      expect(value).toBe('immediate value');
    });
  });

  describe('Parallel Setup', () => {
    it('should run setup operations in parallel', async () => {
      // Create mock setup operations
      const setupDatabase = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { connected: true };
      });

      const setupCache = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { initialized: true };
      });

      const setupAuth = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { authenticated: true };
      });

      // Measure the time to run setup operations in parallel
      const startTime = performance.now();

      const setup = await parallelSetup({
        database: setupDatabase,
        cache: setupCache,
        auth: setupAuth,
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Verify results
      expect(setup.database).toEqual({ connected: true });
      expect(setup.cache).toEqual({ initialized: true });
      expect(setup.auth).toEqual({ authenticated: true });

      // Verify all setup operations were called
      expect(setupDatabase).toHaveBeenCalledTimes(1);
      expect(setupCache).toHaveBeenCalledTimes(1);
      expect(setupAuth).toHaveBeenCalledTimes(1);

      // Verify execution time (should be less than running sequentially)
      // Sequential would be ~150ms, parallel should be ~50ms
      expect(executionTime).toBeLessThan(150);
    });
  });

  describe('Conditional Setup', () => {
    it('should skip setup when condition is false', () => {
      // Create a mock setup function
      const setupFn = vi.fn().mockReturnValue('setup complete');

      // Run conditional setup with false condition
      const result = conditionalSetup(setupFn, () => false);

      // Verify setup was skipped
      expect(setupFn).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should run setup when condition is true', () => {
      // Create a mock setup function
      const setupFn = vi.fn().mockReturnValue('setup complete');

      // Run conditional setup with true condition
      const result = conditionalSetup(setupFn, () => true);

      // Verify setup was run
      expect(setupFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('setup complete');
    });
  });

  describe('Memory Usage Measurement', () => {
    it('should measure memory usage of a function', async () => {
      // Create a function that allocates memory
      const memoryIntensiveFunction = async () => {
        // Allocate some memory
        const array = new Array(1000000).fill(0);
        return array.length;
      };

      // Measure memory usage
      const { result, memoryUsageMB } = await measureMemoryUsage(memoryIntensiveFunction);

      // Verify result
      expect(result).toBe(1000000);

      // Memory usage should be positive
      // Note: This is not always reliable in test environments
      expect(memoryUsageMB).toBeGreaterThanOrEqual(0);
    });
  });
});

// Example of using parallelDescribe
parallelDescribe(
  'Parallel Test Suite',
  {
    'test 1': async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(1 + 1).toBe(2);
    },
    'test 2': async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(2 + 2).toBe(4);
    },
    'test 3': async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(3 + 3).toBe(6);
    },
  },
  {
    concurrency: 3,
    logProgress: false,
  }
);

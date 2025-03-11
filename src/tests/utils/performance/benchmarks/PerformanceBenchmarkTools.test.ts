import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  benchmarkManager,
  BenchmarkResult,
  detectPerformanceRegressions,
  loadBenchmarkResults,
  measureMemoryUsage,
  runAsyncBenchmark,
  runBenchmark,
  saveBenchmarkResults,
} from '../../../../utils/performance/benchmarks/PerformanceBenchmarkTools';

// Mock localStorage
beforeEach(() => {
  // @ts-ignore - Mock localStorage
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  // Mock for process.memoryUsage
  global.process = {
    ...global.process,
    memoryUsage: vi.fn().mockReturnValue({
      rss: 1024 * 1024 * 100,
      heapTotal: 1024 * 1024 * 50,
      heapUsed: 1024 * 1024 * 25,
      external: 1024 * 1024 * 10,
      arrayBuffers: 1024 * 1024 * 5,
    }),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('PerformanceBenchmarkTools', () => {
  describe('runBenchmark', () => {
    it('should run a benchmark and return results', () => {
      // Test function that simulates work
      const testFn = () => {
        let sum = 0;
        for (let i = 0; i < 10000; i++) {
          sum += i;
        }
        return sum;
      };

      const result = runBenchmark(testFn, {
        iterations: 5,
        warmupIterations: 1,
      });

      expect(result).toBeDefined();
      expect(result.executionTimeMs).toBeGreaterThan(0);
      expect(result.operationsCount).toBe(5);
      expect(result.operationsPerSecond).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.additionalMetrics).toBeDefined();
      expect(result.additionalMetrics?.medianTimeMs).toBeGreaterThan(0);
    });

    it('should respect warmup iterations', () => {
      const mockFn = vi.fn();

      runBenchmark(mockFn, {
        iterations: 3,
        warmupIterations: 2,
      });

      // Function should be called for warmup iterations + actual iterations
      expect(mockFn).toHaveBeenCalledTimes(2 + 3);
    });

    it('should handle setup and teardown functions', () => {
      const setupFn = vi.fn();
      const teardownFn = vi.fn();
      const benchmarkFn = vi.fn();

      runBenchmark(benchmarkFn, {
        iterations: 3,
        warmupIterations: 1,
        setupFn,
        teardownFn,
      });

      // Setup and teardown should be called for each iteration (warmup + actual)
      expect(setupFn).toHaveBeenCalledTimes(4);
      expect(teardownFn).toHaveBeenCalledTimes(4);
      expect(benchmarkFn).toHaveBeenCalledTimes(4);
    });
  });

  describe('runAsyncBenchmark', () => {
    it('should run an async benchmark and return results', async () => {
      // Test async function
      const testAsyncFn = async () => {
        return new Promise<number>(resolve => {
          setTimeout(() => {
            let sum = 0;
            for (let i = 0; i < 1000; i++) {
              sum += i;
            }
            resolve(sum);
          }, 1);
        });
      };

      const result = await runAsyncBenchmark(testAsyncFn, {
        iterations: 3,
        warmupIterations: 1,
      });

      expect(result).toBeDefined();
      expect(result.executionTimeMs).toBeGreaterThan(0);
      expect(result.operationsCount).toBe(3);
      expect(result.operationsPerSecond).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle timeouts', async () => {
      // Function that never resolves
      const neverResolve = async () => {
        return new Promise<void>(resolve => {
          // This would normally never resolve, but we use a short timeout in the test
        });
      };

      await expect(
        runAsyncBenchmark(neverResolve, {
          iterations: 1,
          warmupIterations: 0,
          timeout: 10, // Very short timeout for testing
        })
      ).rejects.toThrow('Benchmark timed out');
    });
  });

  describe('measureMemoryUsage', () => {
    it('should measure memory usage before and after function execution', () => {
      const testFn = () => {
        const array = new Array(1000).fill(0);
        return array;
      };

      const memoryMeasurement = measureMemoryUsage(testFn);

      expect(memoryMeasurement).toBeDefined();
      expect(memoryMeasurement.before).toBeDefined();
      expect(memoryMeasurement.after).toBeDefined();
      expect(memoryMeasurement.diffHeapUsed).toBeDefined();
      expect(memoryMeasurement.diffHeapTotal).toBeDefined();
      expect(memoryMeasurement.diffExternal).toBeDefined();
      expect(memoryMeasurement.diffRss).toBeDefined();
    });
  });

  describe('detectPerformanceRegressions', () => {
    it('should detect performance regressions', () => {
      const baselineResults: BenchmarkResult[] = [
        {
          name: 'Test 1',
          executionTimeMs: 100,
          timestamp: new Date(),
        },
        {
          name: 'Test 2',
          executionTimeMs: 200,
          timestamp: new Date(),
        },
      ];

      const newResults: BenchmarkResult[] = [
        {
          name: 'Test 1',
          executionTimeMs: 120, // 20% regression
          timestamp: new Date(),
        },
        {
          name: 'Test 2',
          executionTimeMs: 160, // 20% improvement
          timestamp: new Date(),
        },
      ];

      const analysis = detectPerformanceRegressions(newResults, baselineResults, 10);

      expect(analysis.regressions.length).toBe(1);
      expect(analysis.improvements.length).toBe(1);
      expect(analysis.regressions[0].name).toBe('Test 1');
      expect(analysis.improvements[0].name).toBe('Test 2');
      expect(analysis.regressions[0].percentChange).toBeCloseTo(20, 0);
      expect(analysis.improvements[0].percentChange).toBeCloseTo(-20, 0);

      expect(analysis.summary.totalTests).toBe(2);
      expect(analysis.summary.regressionCount).toBe(1);
      expect(analysis.summary.improvementCount).toBe(1);
      expect(analysis.summary.unchangedCount).toBe(0);
    });

    it('should respect the threshold for regressions', () => {
      const baselineResults: BenchmarkResult[] = [
        {
          name: 'Test 1',
          executionTimeMs: 100,
          timestamp: new Date(),
        },
        {
          name: 'Test 2',
          executionTimeMs: 200,
          timestamp: new Date(),
        },
      ];

      const newResults: BenchmarkResult[] = [
        {
          name: 'Test 1',
          executionTimeMs: 104, // 4% regression (below threshold)
          timestamp: new Date(),
        },
        {
          name: 'Test 2',
          executionTimeMs: 190, // 5% improvement (at threshold)
          timestamp: new Date(),
        },
      ];

      const analysis = detectPerformanceRegressions(newResults, baselineResults, 5);

      expect(analysis.regressions.length).toBe(0);
      expect(analysis.improvements.length).toBe(1);
      expect(analysis.summary.unchangedCount).toBe(1);
    });
  });

  describe('saveBenchmarkResults and loadBenchmarkResults', () => {
    it('should save and load benchmark results', () => {
      const results: BenchmarkResult[] = [
        {
          name: 'Test 1',
          executionTimeMs: 100,
          timestamp: new Date(),
        },
        {
          name: 'Test 2',
          executionTimeMs: 200,
          timestamp: new Date(),
        },
      ];

      // Setup localStorage mock return values
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(JSON.stringify(results)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      };

      // @ts-ignore - Mock localStorage
      global.localStorage = mockLocalStorage;

      // Save results
      saveBenchmarkResults(results, 'test-key');

      // Verify localStorage.setItem was called with the right arguments
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(results));

      // Load results
      const loadedResults = loadBenchmarkResults('test-key');

      // Verify localStorage.getItem was called with the right key
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');

      // Verify loaded results match expected results
      expect(loadedResults).toEqual(results);
    });

    it('should handle JSON parse errors', () => {
      // Setup localStorage mock to return invalid JSON
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('invalid-json'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      };

      // @ts-ignore - Mock localStorage
      global.localStorage = mockLocalStorage;

      // Mock console.error to suppress error output
      const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Load results (should return empty array due to parse error)
      const loadedResults = loadBenchmarkResults('test-key');

      // Verify localStorage.getItem was called
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');

      // Verify console.error was called
      expect(consoleErrorMock).toHaveBeenCalled();

      // Verify empty array is returned
      expect(loadedResults).toEqual([]);

      // Restore console.error
      consoleErrorMock.mockRestore();
    });
  });

  describe('benchmarkManager', () => {
    it('should register and run benchmark jobs', async () => {
      // Create a benchmark job
      const job = {
        id: 'test-job',
        name: 'Test Job',
        schedule: 'onDemand' as const,
        benchmarks: [
          {
            name: 'Test Benchmark 1',
            run: () => ({
              name: 'Test Benchmark 1',
              executionTimeMs: 100,
              timestamp: new Date(),
            }),
          },
          {
            name: 'Test Benchmark 2',
            run: () => ({
              name: 'Test Benchmark 2',
              executionTimeMs: 200,
              timestamp: new Date(),
            }),
          },
        ],
      };

      // Register job
      benchmarkManager.registerJob(job);

      // Verify job is registered
      const jobs = benchmarkManager.getJobs();
      expect(jobs).toContainEqual(job);

      // Run job
      const results = await benchmarkManager.runJob('test-job');

      // Verify results
      expect(results.length).toBe(2);
      expect(results[0].name).toBe('Test Benchmark 1');
      expect(results[1].name).toBe('Test Benchmark 2');

      // Verify lastRun was updated
      expect(job.lastRun).toBeInstanceOf(Date);

      // Verify results can be retrieved
      const jobResults = benchmarkManager.getJobResults('test-job');
      expect(jobResults).toEqual(results);

      // Unregister job
      benchmarkManager.unregisterJob('test-job');

      // Verify job was unregistered
      const jobsAfterUnregister = benchmarkManager.getJobs();
      expect(jobsAfterUnregister).not.toContainEqual(job);
    });

    it('should handle job not found error', async () => {
      await expect(benchmarkManager.runJob('non-existent-job')).rejects.toThrow(
        'Job with ID non-existent-job not found'
      );
    });

    it('should handle errors in benchmarks', async () => {
      // Create a benchmark job with a failing benchmark
      const job = {
        id: 'error-job',
        name: 'Error Job',
        schedule: 'onDemand' as const,
        benchmarks: [
          {
            name: 'Failing Benchmark',
            run: () => {
              throw new Error('Benchmark failure');
            },
          },
          {
            name: 'Successful Benchmark',
            run: () => ({
              name: 'Successful Benchmark',
              executionTimeMs: 100,
              timestamp: new Date(),
            }),
          },
        ],
      };

      // Register job
      benchmarkManager.registerJob(job);

      // Mock console.error to suppress error output
      const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Run job
      const results = await benchmarkManager.runJob('error-job');

      // Verify console.error was called
      expect(consoleErrorMock).toHaveBeenCalled();

      // Verify only successful benchmark results are returned
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Successful Benchmark');

      // Restore console.error
      consoleErrorMock.mockRestore();

      // Unregister job
      benchmarkManager.unregisterJob('error-job');
    });

    it('should handle regression detection', async () => {
      // Create a benchmark job with regression detection
      const baselineJob = {
        id: 'baseline-job',
        name: 'Baseline Job',
        schedule: 'onDemand' as const,
        benchmarks: [
          {
            name: 'Benchmark 1',
            run: () => ({
              name: 'Benchmark 1',
              executionTimeMs: 100,
              timestamp: new Date(),
            }),
          },
        ],
      };

      const regressionJob = {
        id: 'regression-job',
        name: 'Regression Job',
        schedule: 'onDemand' as const,
        benchmarks: [
          {
            name: 'Benchmark 1',
            run: () => ({
              name: 'Benchmark 1',
              executionTimeMs: 150, // 50% regression
              timestamp: new Date(),
            }),
          },
        ],
        notifyOnRegression: true,
        regressionThreshold: 20,
        baselineKey: 'baseline-job',
      };

      // Register jobs
      benchmarkManager.registerJob(baselineJob);
      benchmarkManager.registerJob(regressionJob);

      // Run baseline job
      await benchmarkManager.runJob('baseline-job');

      // Mock console.warn to check for regression notifications
      const consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'table').mockImplementation(() => {});

      // Run regression job
      await benchmarkManager.runJob('regression-job');

      // Verify console.warn was called with regression message
      expect(consoleWarnMock).toHaveBeenCalledWith(
        expect.stringContaining('Performance regression detected')
      );

      // Restore mocks
      consoleWarnMock.mockRestore();

      // Unregister jobs
      benchmarkManager.unregisterJob('baseline-job');
      benchmarkManager.unregisterJob('regression-job');
    });
  });
});

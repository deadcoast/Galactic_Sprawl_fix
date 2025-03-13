// src/tests/utils/index.ts
/**
 * Unified Test Utilities
 * 
 * This file provides a centralized export for all test utilities.
 * It standardizes test rendering, mocking, and performance measurement
 * to ensure consistent testing patterns across the codebase.
 */

// Export standardized utilities
export * from './renderUtils';
export * from './mockUtils';
export * from './performanceUtils';

// Export existing utilities
export * from './fixtureUtils';
export * from './asyncTestUtils';

// Export from testUtils (legacy exports will be gradually migrated)
export * from './testUtils';

// Re-export fixtures for convenience
export * from '../fixtures';

// Add deprecation warnings for older utility functions that have been standardized
import { 
  createPerformanceReporter,
  measureExecutionTime,
  measureMemoryUsage,
  runBenchmark,
  measureAsyncExecutionTime,
  measureAsyncMemoryUsage,
  runAsyncBenchmark
} from './performanceUtils';

/**
 * @deprecated Use createPerformanceReporter from performanceUtils instead
 */
export const createPerfReporter = (message = 'createPerfReporter is deprecated. Use createPerformanceReporter instead.') => {
  console.warn(message);
  return createPerformanceReporter();
};

/**
 * @deprecated Use measureExecutionTime from performanceUtils instead
 */
export const measureExecTime = <T, Args extends unknown[]>(
  fn: (...args: Args) => T,
  ...args: Args
) => {
  console.warn('measureExecTime is deprecated. Use measureExecutionTime instead.');
  return measureExecutionTime(fn, ...args);
};

/**
 * @deprecated Use measureMemoryUsage from performanceUtils instead
 */
export const measureMemory = <T, Args extends unknown[]>(
  fn: (...args: Args) => T,
  ...args: Args
) => {
  console.warn('measureMemory is deprecated. Use measureMemoryUsage instead.');
  return measureMemoryUsage(fn, ...args);
};

/**
 * @deprecated Use measureMemoryUsage from performanceUtils instead
 */
export const measureTestMemoryUsage = <T, Args extends unknown[]>(
  fn: (...args: Args) => T,
  ...args: Args
) => {
  console.warn('measureTestMemoryUsage is deprecated. Use measureMemoryUsage instead.');
  return measureMemoryUsage(fn, ...args);
};

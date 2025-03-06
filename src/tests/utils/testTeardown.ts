import { afterEach, beforeEach } from 'vitest';
import { registerCleanup, setupTestEnvironment, teardownTestEnvironment } from './testStateReset';

/**
 * Apply test isolation to a test suite
 * This function adds beforeEach and afterEach hooks to ensure proper test isolation
 * It should be called at the top level of a test file
 */
export function applyTestIsolation(): void {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });
}

/**
 * Interface for objects that can be torn down
 */
export interface TeardownAble {
  teardown: () => void | Promise<void>;
}

/**
 * Register a teardown function to be called after each test
 * @param teardownFn Function to call during teardown
 */
export function registerTeardown(teardownFn: () => void | Promise<void>): void {
  // Use afterEach to register the teardown function
  afterEach(async () => {
    try {
      await teardownFn();
    } catch (error) {
      console.warn('Error during teardown function execution:', error);
    }
  });

  // Also register with the global cleanup system
  registerCleanup(async () => {
    try {
      await teardownFn();
    } catch (_error) {
      // Errors are already logged in the afterEach hook
    }
  });
}

/**
 * Create a teardown wrapper for an object
 * This ensures that the object is properly torn down after each test
 * @param factory Factory function that creates the object
 * @returns The created object with teardown registered
 */
export function createWithTeardown<T extends TeardownAble>(factory: () => T): T {
  const object = factory();
  registerTeardown(() => object.teardown());
  return object;
}

/**
 * Higher-order function that wraps a test function with setup and teardown
 * @param setupFn Function to call before the test
 * @param teardownFn Function to call after the test
 * @returns A function that wraps the test function
 */
export function withSetupAndTeardown<T>(
  setupFn: () => T,
  teardownFn: (setupResult: T) => void | Promise<void>
): (testFn: (setupResult: T) => void | Promise<void>) => () => Promise<void> {
  return testFn => async () => {
    const setupResult = setupFn();
    try {
      await testFn(setupResult);
    } finally {
      await teardownFn(setupResult);
    }
  };
}

/**
 * Create a test context with automatic teardown
 * @param setupFn Function to call before each test
 * @param teardownFn Function to call after each test
 * @returns The test context
 */
export function createTestContext<T>(
  setupFn: () => T,
  teardownFn: (context: T) => void | Promise<void>
): () => T {
  let context: T | null = null;

  beforeEach(() => {
    context = setupFn();
  });

  afterEach(async () => {
    if (context !== null) {
      await teardownFn(context);
      context = null;
    }
  });

  return () => {
    if (context === null) {
      throw new Error('Test context accessed outside of test');
    }
    return context;
  };
}

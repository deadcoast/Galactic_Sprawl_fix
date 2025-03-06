import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { ReactElement } from 'react';
import { expect, vi } from 'vitest';
import { GameProvider } from '../../contexts/GameContext';

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * Default providers wrapper for testing
 * If you need to add more providers, extend this function
 */
export const AllProviders: React.FC<WrapperProps> = ({ children }) => {
  return (
    <>
      <GameProvider>
        {/* Add context providers here if needed */}
        {children}
      </GameProvider>
    </>
  );
};

/**
 * Custom render function that includes global providers
 * @param ui Component to render
 * @param options Additional render options
 * @returns The rendered component with useful test utilities
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
}

/**
 * Creates a mock element that simulates a DOM element reference
 * Useful for testing components that require refs
 */
export function createMockElement() {
  return {
    getBoundingClientRect: () => ({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
    offsetWidth: 100,
    offsetHeight: 100,
    style: {},
    focus: vi.fn(),
    blur: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

/**
 * A helper function to create a mock ref object
 * @param element The element to use as the current value (defaults to a mock element)
 * @returns A mock ref object with the element as the current value
 */
export function createMockRef<T = Element>(element?: T) {
  return {
    current: element || createMockElement(),
  };
}

/**
 * Helper for testing async components
 * This is a wrapper around act() that returns a promise
 * @param callback The callback to execute
 * @returns A promise that resolves when the callback is complete
 */
export async function asyncAct(callback: () => Promise<void> | void): Promise<void> {
  await callback();
}

/**
 * Wait for a condition to be true
 * @param condition The condition to check
 * @param timeout The maximum time to wait (ms)
 * @param interval The interval between checks (ms)
 * @returns A promise that resolves when the condition is true
 */
export function waitForCondition(
  condition: () => boolean,
  timeout = 1000,
  interval = 50
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkCondition = () => {
      if (condition()) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
        return;
      }

      setTimeout(checkCondition, interval);
    };

    checkCondition();
  });
}

/**
 * Generate a random string for test IDs
 * @param prefix Optional prefix for the ID
 * @returns A random string that can be used as an ID
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a mock for resource types
 * @param overrides Optional overrides for specific properties
 * @returns A mock resource object
 */
export function createMockResource(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: generateTestId('resource'),
    name: 'Test Resource',
    type: 'primary',
    category: 'minerals',
    amount: 100,
    max: 1000,
    rate: 10,
    visible: true,
    ...overrides,
  };
}

/**
 * Creates a mock for a resource node
 * @param overrides Optional overrides for specific properties
 * @returns A mock resource node object
 */
export function createMockResourceNode(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: generateTestId('node'),
    type: 'producer',
    resources: ['energy'],
    priority: { type: 'energy', priority: 1, consumers: [] },
    active: true,
    ...overrides,
  };
}

/**
 * Creates a mock for a resource connection
 * @param overrides Optional overrides for specific properties
 * @returns A mock resource connection object
 */
export function createMockResourceConnection(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: generateTestId('connection'),
    source: 'source-node',
    target: 'target-node',
    resourceType: 'energy',
    maxRate: 10,
    currentRate: 5,
    priority: { type: 'energy', priority: 1, consumers: [] },
    active: true,
    ...overrides,
  };
}

/**
 * Creates a collection of mock resources
 * @param count Number of resources to create
 * @param template Base template for all resources
 * @returns An array of mock resources
 */
export function createMockResources(
  count: number,
  template: Partial<Record<string, unknown>> = {}
) {
  return Array.from({ length: count }, (_, index) =>
    createMockResource({
      id: `${template.id || 'resource'}-${index}`,
      ...template,
    })
  );
}

/**
 * Creates a mock for a game event
 * @param overrides Optional overrides for specific properties
 * @returns A mock event object
 */
export function createMockEvent(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: generateTestId('event'),
    type: 'resource.change',
    timestamp: Date.now(),
    source: 'test',
    data: {},
    ...overrides,
  };
}

/**
 * Helper to test loading states in components
 * @param ui Component to render
 * @param loadingProp Name of the loading prop
 * @param finishLoading Function to call to finish loading
 */
export async function testLoadingState(
  ui: React.ReactElement,
  loadingProp: string = 'isLoading',
  finishLoading: () => void
) {
  // Render with loading state
  const props = { [loadingProp]: true };
  const { rerender } = render(React.cloneElement(ui, props));

  // Verify loading indicator is shown
  expect(screen.getByRole('progressbar')).toBeInTheDocument();

  // Call the finishLoading callback
  finishLoading();

  // Rerender with loading complete
  rerender(React.cloneElement(ui, { [loadingProp]: false }));

  // Verify loading indicator is removed
  await waitFor(
    () => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    },
    { timeout: 1000 }
  );
}

/**
 * Helper to test error states in components
 * @param ui Component to render
 * @param errorProp Name of the error prop
 * @param errorMessage The error message to display
 */
export function testErrorState(
  ui: React.ReactElement,
  errorProp: string = 'error',
  errorMessage: string = 'An error occurred'
) {
  // Render with error state
  const props = { [errorProp]: errorMessage };
  render(React.cloneElement(ui, props));

  // Verify error message is shown
  expect(screen.getByText(errorMessage)).toBeInTheDocument();
}

/**
 * Helper to test form submission
 * @param formElement The form element to submit
 * @param inputSelectors Selectors for form inputs
 * @param inputValues Values to enter into form inputs
 * @param onSubmit Mock function for form submission
 */
export async function testFormSubmission(
  formElement: HTMLElement,
  inputSelectors: Record<string, string>,
  inputValues: Record<string, string>,
  onSubmit: ReturnType<typeof vi.fn>
) {
  const user = userEvent.setup();

  // Fill the form
  for (const [field, selector] of Object.entries(inputSelectors)) {
    const input = formElement.querySelector(selector) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, inputValues[field]);
  }

  // Submit the form
  const submitButton = screen.getByRole('button', { name: /submit|save/i });
  await user.click(submitButton);

  // Check that the form was submitted with the correct values
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining(inputValues));
}

/**
 * Measures the execution time of a function
 * @param fn The function to measure
 * @param args Arguments to pass to the function
 * @returns The result of the function and the execution time in ms
 */
export async function measureExecutionTime<T, A extends unknown[]>(
  fn: (...args: A) => T | Promise<T>,
  ...args: A
): Promise<{ result: T; executionTimeMs: number }> {
  const startTime = performance.now();
  const result = await fn(...args);
  const endTime = performance.now();

  return {
    result,
    executionTimeMs: endTime - startTime,
  };
}

/**
 * Measures the memory usage of a function
 * @param fn The function to measure
 * @param args Arguments to pass to the function
 * @returns The result of the function and the memory change in MB (if available)
 */
export async function measureMemoryUsage<T, A extends unknown[]>(
  fn: (...args: A) => T | Promise<T>,
  ...args: A
): Promise<{ result: T; memoryChangeMB?: number }> {
  // Check if we have access to memory usage API
  const hasMemoryAPI = typeof process !== 'undefined' && typeof process.memoryUsage === 'function';
  const memoryBefore = hasMemoryAPI ? process.memoryUsage().heapUsed : undefined;

  // Run the function
  const result = await fn(...args);

  // Check memory again
  const memoryAfter =
    hasMemoryAPI && memoryBefore !== undefined ? process.memoryUsage().heapUsed : undefined;

  // Calculate difference
  const memoryChangeMB =
    memoryBefore !== undefined && memoryAfter !== undefined
      ? (memoryAfter - memoryBefore) / (1024 * 1024)
      : undefined;

  return {
    result,
    memoryChangeMB,
  };
}

/**
 * Creates a performance metric reporter for tests
 * @returns An object with methods to report and retrieve performance metrics
 */
export function createPerformanceReporter() {
  const metrics: Record<
    string,
    {
      executionTimeMs: number[];
      memoryChangeMB?: number[];
      iterations: number;
    }
  > = {};

  return {
    /**
     * Records a performance metric
     * @param name Name of the metric
     * @param executionTimeMs Execution time in ms
     * @param memoryChangeMB Memory change in MB (optional)
     */
    record: (name: string, executionTimeMs: number, memoryChangeMB?: number) => {
      if (!metrics[name]) {
        metrics[name] = { executionTimeMs: [], memoryChangeMB: [], iterations: 0 };
      }

      metrics[name].executionTimeMs.push(executionTimeMs);
      if (memoryChangeMB !== undefined) {
        metrics[name].memoryChangeMB?.push(memoryChangeMB);
      }
      metrics[name].iterations++;
    },

    /**
     * Gets performance metrics for a specific operation
     * @param name Name of the metric
     * @returns Summary statistics for the metric
     */
    getMetrics: (name: string) => {
      const metric = metrics[name];
      if (!metric) return null;

      const executionTimesMs = metric.executionTimeMs;
      const memoryChangesMB = metric.memoryChangeMB;

      return {
        name,
        iterations: metric.iterations,
        executionTime: {
          min: Math.min(...executionTimesMs),
          max: Math.max(...executionTimesMs),
          avg: executionTimesMs.reduce((a, b) => a + b, 0) / executionTimesMs.length,
          total: executionTimesMs.reduce((a, b) => a + b, 0),
        },
        memoryChange:
          memoryChangesMB && memoryChangesMB.length > 0
            ? {
                min: Math.min(...memoryChangesMB),
                max: Math.max(...memoryChangesMB),
                avg: memoryChangesMB.reduce((a, b) => a + b, 0) / memoryChangesMB.length,
              }
            : undefined,
      };
    },

    /**
     * Gets all performance metrics
     * @returns Summary statistics for all metrics
     */
    getAllMetrics: () => {
      return Object.keys(metrics).map(name => {
        const metric = metrics[name];
        const executionTimesMs = metric.executionTimeMs;
        const memoryChangesMB = metric.memoryChangeMB;

        return {
          name,
          iterations: metric.iterations,
          executionTime: {
            min: Math.min(...executionTimesMs),
            max: Math.max(...executionTimesMs),
            avg: executionTimesMs.reduce((a, b) => a + b, 0) / executionTimesMs.length,
            total: executionTimesMs.reduce((a, b) => a + b, 0),
          },
          memoryChange:
            memoryChangesMB && memoryChangesMB.length > 0
              ? {
                  min: Math.min(...memoryChangesMB),
                  max: Math.max(...memoryChangesMB),
                  avg: memoryChangesMB.reduce((a, b) => a + b, 0) / memoryChangesMB.length,
                }
              : undefined,
        };
      });
    },

    /**
     * Prints performance metrics to the console
     */
    printReport: () => {
      console.warn('\nPerformance Test Results:');
      console.warn('-------------------------------------------------------------');
      console.warn(
        '| Metric                      | Avg Time (ms) | Min Time | Max Time | Iterations |'
      );
      console.warn(
        '|------------------------------|---------------|----------|----------|------------|'
      );

      for (const name of Object.keys(metrics)) {
        const metric = metrics[name];
        const executionTimesMs = metric.executionTimeMs;
        const avg = executionTimesMs.reduce((a, b) => a + b, 0) / executionTimesMs.length;
        const min = Math.min(...executionTimesMs);
        const max = Math.max(...executionTimesMs);

        console.warn(
          `| ${name.padEnd(28)} | ${avg.toFixed(2).padStart(13)} | ${min.toFixed(2).padStart(8)} | ${max.toFixed(2).padStart(8)} | ${metric.iterations.toString().padStart(10)} |`
        );
      }

      console.warn('-------------------------------------------------------------');
    },
  };
}

import { vi } from 'vitest';

/**
 * Waits for a specified number of milliseconds
 * @param ms Milliseconds to wait
 * @returns A promise that resolves after the specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Waits for a condition to be true
 * @param condition Function that returns a boolean
 * @param timeout Maximum time to wait in milliseconds
 * @param interval Interval between checks in milliseconds
 * @returns A promise that resolves when the condition is true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Condition not met within ${timeout}ms timeout`);
    }

    await wait(interval);
  }
}

/**
 * Creates a promise that can be resolved or rejected externally
 * @returns An object with the promise and functions to resolve or reject it
 */
export function createDeferredPromise<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Creates a mock event emitter
 * @returns A mock event emitter with emit, on, and off methods
 */
export function createMockEventEmitter() {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};

  return {
    emit: vi.fn((event: string, ...args: unknown[]) => {
      if (listeners[event]) {
        listeners[event].forEach(listener => listener(...args));
      }
      return true;
    }),

    on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(listener);
      return () => {
        listeners[event] = listeners[event].filter(l => l !== listener);
      };
    }),

    off: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(l => l !== listener);
      }
      return true;
    }),

    // Helper for testing
    getListenerCount: (event: string) => listeners[event]?.length || 0,

    // Clear all listeners
    clearAllListeners: () => {
      Object.keys(listeners).forEach(event => {
        listeners[event] = [];
      });
    },
  };
}

/**
 * Creates a mock timer that can be used to test time-based functionality
 * @returns A mock timer with methods to advance time and run callbacks
 */
export function createMockTimer() {
  const callbacks: Array<{
    id: number;
    callback: () => void;
    delay: number;
    nextRunTime: number;
    interval: boolean;
  }> = [];

  let currentTime = 0;
  let nextId = 1;

  return {
    setTimeout: vi.fn((callback: () => void, delay: number) => {
      const id = nextId++;
      callbacks.push({
        id,
        callback,
        delay,
        nextRunTime: currentTime + delay,
        interval: false,
      });
      return id;
    }),

    setInterval: vi.fn((callback: () => void, delay: number) => {
      const id = nextId++;
      callbacks.push({
        id,
        callback,
        delay,
        nextRunTime: currentTime + delay,
        interval: true,
      });
      return id;
    }),

    clearTimeout: vi.fn((id: number) => {
      const index = callbacks.findIndex(c => c.id === id);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }),

    clearInterval: vi.fn((id: number) => {
      const index = callbacks.findIndex(c => c.id === id);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }),

    // Advance time by a specified amount and run due callbacks
    advanceTime: (ms: number) => {
      currentTime += ms;

      // Find callbacks that are due
      const dueCallbacks = callbacks.filter(c => c.nextRunTime <= currentTime);

      // Run callbacks and update or remove them
      dueCallbacks.forEach(c => {
        c.callback();

        if (c.interval) {
          // Update next run time for interval callbacks
          c.nextRunTime = currentTime + c.delay;
        } else {
          // Remove timeout callbacks after they run
          const index = callbacks.findIndex(cb => cb.id === c.id);
          if (index !== -1) {
            callbacks.splice(index, 1);
          }
        }
      });

      return dueCallbacks.length;
    },

    // Run all pending callbacks
    runAllPending: () => {
      const pendingCount = callbacks.length;
      callbacks.sort((a, b) => a.nextRunTime - b.nextRunTime);

      while (callbacks.length > 0) {
        const c = callbacks[0];
        currentTime = c.nextRunTime;
        c.callback();

        if (c.interval) {
          c.nextRunTime = currentTime + c.delay;
          // Re-sort the array
          callbacks.sort((a, b) => a.nextRunTime - b.nextRunTime);
        } else {
          callbacks.shift();
        }
      }

      return pendingCount;
    },

    // Get current time
    getCurrentTime: () => currentTime,

    // Get pending callback count
    getPendingCount: () => callbacks.length,
  };
}

/**
 * Creates a mock for the requestAnimationFrame API
 * @returns A mock requestAnimationFrame implementation
 */
export function createMockRAF() {
  const callbacks: Array<{
    id: number;
    callback: (timestamp: number) => void;
  }> = [];

  let currentId = 1;
  let currentTimestamp = 0;

  return {
    requestAnimationFrame: vi.fn((callback: (timestamp: number) => void) => {
      const id = currentId++;
      callbacks.push({ id, callback });
      return id;
    }),

    cancelAnimationFrame: vi.fn((id: number) => {
      const index = callbacks.findIndex(c => c.id === id);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }),

    // Trigger the next animation frame
    triggerNextFrame: (timestampIncrement = 16.67) => {
      if (callbacks.length === 0) {
        return false;
      }

      currentTimestamp += timestampIncrement;
      const { callback } = callbacks.shift()!;
      callback(currentTimestamp);
      return true;
    },

    // Trigger all pending animation frames
    triggerAllFrames: (timestampIncrement = 16.67) => {
      const count = callbacks.length;

      while (callbacks.length > 0) {
        currentTimestamp += timestampIncrement;
        const { callback } = callbacks.shift()!;
        callback(currentTimestamp);
      }

      return count;
    },

    // Get current timestamp
    getCurrentTimestamp: () => currentTimestamp,

    // Get pending frame count
    getPendingCount: () => callbacks.length,
  };
}

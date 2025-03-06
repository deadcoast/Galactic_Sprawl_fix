import { vi } from 'vitest';
import { PortManager } from './portManager';

// Track registered cleanup functions
const cleanupFunctions: Array<() => void> = [];

/**
 * Register a cleanup function to be called during global state reset
 * @param cleanupFn Function to call during cleanup
 * @returns Function to unregister the cleanup
 */
export function registerCleanup(cleanupFn: () => void): () => void {
  cleanupFunctions.push(cleanupFn);
  return () => {
    const index = cleanupFunctions.indexOf(cleanupFn);
    if (index !== -1) {
      cleanupFunctions.splice(index, 1);
    }
  };
}

/**
 * Reset global state for tests
 * This function should be called in afterEach hooks to ensure clean test state
 */
export function resetGlobalTestState(): void {
  // Call all registered cleanup functions
  cleanupFunctions.forEach(fn => {
    try {
      fn();
    } catch (error) {
      console.warn('Error during cleanup function execution:', error);
    }
  });

  // Reset port manager
  PortManager.reset();

  // Reset all mocks
  vi.resetAllMocks();

  // Clear all timers
  vi.clearAllTimers();

  // Reset modules (careful with this as it can cause issues with some tests)
  // vi.resetModules();

  // Clear any global event listeners
  if (typeof window !== 'undefined') {
    // Browser environment
    window.removeEventListener = window.removeEventListener || function () {};
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;

    // Store all added event listeners
    const listeners: Array<{
      target: EventTarget;
      type: string;
      listener: EventListenerOrEventListenerObject;
      options?: boolean | AddEventListenerOptions;
    }> = [];

    // Override addEventListener to track listeners
    window.addEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) {
      listeners.push({ target: this, type, listener, options });
      return originalAddEventListener.call(this, type, listener, options);
    };

    // Remove all tracked listeners
    listeners.forEach(({ target, type, listener, options }) => {
      originalRemoveEventListener.call(target, type, listener, options);
    });

    // Restore original methods
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
  }

  // Clear any global variables that might be set by tests
  if (typeof global !== 'undefined') {
    // Node environment
    if ('testWebSocketPort' in global) {
      // Use type assertion with Record to avoid using 'any'
      const globalWithPort = global as Record<string, unknown>;
      delete globalWithPort.testWebSocketPort;
    }
  }
}

/**
 * Register a WebSocket server for cleanup
 * @param port The port the server is running on
 * @param closeFunction Function to close the server
 */
export function registerWebSocketServer(port: number, closeFunction: () => void): void {
  registerCleanup(() => {
    try {
      closeFunction();
    } catch (error) {
      console.warn(`Error closing WebSocket server on port ${port}:`, error);
    }
    PortManager.releasePort(port);
  });
}

/**
 * Register a resource manager for cleanup
 * @param manager The manager to clean up
 */
export function registerResourceManager(manager: {
  cleanup?: () => void;
  reset?: () => void;
}): void {
  registerCleanup(() => {
    if (typeof manager.cleanup === 'function') {
      manager.cleanup();
    } else if (typeof manager.reset === 'function') {
      manager.reset();
    }
  });
}

/**
 * Setup function to be called in beforeEach hooks
 * This ensures that each test starts with a clean state
 */
export function setupTestEnvironment(): void {
  // Reset global state before each test
  resetGlobalTestState();
}

/**
 * Teardown function to be called in afterEach hooks
 * This ensures that each test cleans up after itself
 */
export function teardownTestEnvironment(): void {
  // Reset global state after each test
  resetGlobalTestState();
}

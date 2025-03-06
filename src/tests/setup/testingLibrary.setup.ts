// src/tests/setup/testingLibrary.setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock ResizeObserver which isn't available in testing environment but often used in UI components
class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

// Set up global mocks
global.ResizeObserver = ResizeObserverMock;

// Type for MediaQueryList listeners
type MediaQueryListener = (this: MediaQueryList, ev: MediaQueryListEvent) => void;

// Mock window.matchMedia - Enhanced for framer-motion compatibility
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => {
    const mediaQueryList = {
      matches: false,
      media: query,
      onchange: null,
      // These methods are specifically needed for framer-motion
      addListener: vi.fn((listener: MediaQueryListener) => {
        mediaQueryList.listeners.push(listener);
      }),
      removeListener: vi.fn((listener: MediaQueryListener) => {
        mediaQueryList.listeners = mediaQueryList.listeners.filter(l => l !== listener);
      }),
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        if (event === 'change') {
          mediaQueryList.listeners.push(listener as unknown as MediaQueryListener);
        }
      }),
      removeEventListener: vi.fn((event: string, listener: EventListener) => {
        if (event === 'change') {
          mediaQueryList.listeners = mediaQueryList.listeners.filter(l => l !== listener);
        }
      }),
      dispatchEvent: vi.fn(),
      // Track listeners for proper cleanup
      listeners: [] as MediaQueryListener[],
    };
    return mediaQueryList;
  }),
});

// Helper to silence React 18 hydration warnings
// This is useful for components that might have different rendering between server and client
const originalConsoleError = console.error;
console.error = (...args: unknown[]): void => {
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    (/Warning:.*ReactDOM.render is no longer supported in React 18./.test(args[0]) ||
      /Warning: Text content did not match./.test(args[0]) ||
      /Warning: An update to .* inside a test was not wrapped in act/.test(args[0]))
  ) {
    return;
  }
  originalConsoleError(...args);
};

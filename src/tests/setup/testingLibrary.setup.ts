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

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
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

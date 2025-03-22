/**
 * @context: ui-system, component-library, testing
 * 
 * Vitest setup file
 * 
 * This file sets up the testing environment for Vitest tests,
 * including mocks and global configuration needed across all tests.
 */

import { expect, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Jest DOM matchers
expect.extend(matchers);

// Ensure that tests clean up DOM between test runs
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

// Mock ResizeObserver which is used in various UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock console.error during tests to catch unexpected errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Fail tests on prop type errors
  if (
    typeof args[0] === 'string' && 
    args[0].includes('Warning: Failed prop type')
  ) {
    throw new Error(args[0]);
  }
  originalConsoleError(...args);
};

// Clean up console mock after all tests
afterAll(() => {
  console.error = originalConsoleError;
});

// Export a test-only object that contains commonly used test utilities
export const testUtils = {
  mockErrorLoggingService: {
    logError: vi.fn(),
    clearErrors: vi.fn(),
    getErrors: vi.fn().mockReturnValue([]),
  },
  
  // Add more test utilities as needed
}; 
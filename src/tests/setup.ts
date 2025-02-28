// src/tests/setup.ts
import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock moduleEventBus
const moduleEventBusMock = {
  emit: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
};

// Assign mocks to global object
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllTimers();
});

// Export mocks for use in tests
export { moduleEventBusMock }; 
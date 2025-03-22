/// <reference types="vitest" />
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare global {
  namespace Vi {
    // @ts-expect-error - interface is used to extend Vitest matchers
    interface Assertion<T> extends TestingLibraryMatchers<T, void> {}
    // @ts-expect-error - interface is used to extend Vitest matchers
    interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
  }
} 
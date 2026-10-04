/**
 * @context: type-definitions, testing-library
 *
 * Test utility type definitions for extending Jest and testing-library
 * This provides TypeScript declarations for custom matchers without requiring additional dependencies
 */

// Add Jest types if they are missing
declare namespace jest {
  interface Matchers<R> {
    // Testing-library matchers
    toBeInTheDocument(): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveAttribute(attr: string, value?: string | RegExp): R;
    toHaveClass(...classNames: string[]): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toBeVisible(): R;
    toBeChecked(): R;
    toHaveStyle(css: Record<string, string | number>): R;
    toContainElement(element: HTMLElement | null): R;
    toContainHTML(htmlText: string): R;
    toHaveFocus(): R;
    toHaveFormValues(expectedValues: Record<string, string | number | boolean>): R;
    toHaveValue(value: string | string[] | number | null): R;
    toBeEmpty(): R;
    toBeRequired(): R;
    toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
  }
}

// Add missing Jest globals
declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function test(name: string, fn: () => void): void;
  function expect<T>(actual: T): jest.Matchers<void>;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function beforeAll(fn: () => void): void;
  function afterAll(fn: () => void): void;
}

// Export an empty object to make this a module
export {};

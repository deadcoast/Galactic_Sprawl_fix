/// <reference types="vitest" />
import '@testing-library/jest-dom';

declare global {
  namespace Vi {
    interface JestAssertion<T = unknown> {
      /**
       * @description Check if element is in the document
       */
      toBeInTheDocument(): T;
      
      /**
       * @description Check if element has the specified classes
       */
      toHaveClass(...classNames: string[]): T;
      
      /**
       * @description Check if element is disabled
       */
      toBeDisabled(): T;
      
      /**
       * @description Check if element has the specified attribute with optional value
       */
      toHaveAttribute(attr: string, value?: unknown): T;
      
      /**
       * @description Check if element has the specified style
       */
      toHaveStyle(css: string | Record<string, unknown>): T;
    }
  }
} 
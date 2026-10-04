/**
 * @context: testing
 *
 * Setup file for tests that extends Vitest with Testing Library matchers
 */

import "@testing-library/jest-dom";
import { expect } from "vitest";

// Try to extend Vitest's expect with Testing Library matchers if available
try {
  const matchers = await import("@testing-library/jest-dom/matchers");
  if (matchers && matchers.default) {
    expect.extend(matchers.default);
  }
} catch (error) {
  // Matchers not available, continue without them
  console.warn("Testing Library matchers not available:", error);
}

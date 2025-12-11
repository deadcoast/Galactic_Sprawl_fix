// Setup file for Jest to make Vitest tests compatible
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";

// Map Vitest's vi to Jest's jest global
globalThis.vi = jest;

// Add compatibility layer for Vitest functions
globalThis.describe = describe;
globalThis.it = test;
globalThis.expect = expect;
globalThis.beforeEach = beforeEach;
globalThis.afterEach = afterEach;

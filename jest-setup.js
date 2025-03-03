// Setup file for Jest to make Vitest tests compatible
import { jest } from '@jest/globals';

// Map Vitest's vi to Jest's jest global
global.vi = jest;

// Add compatibility layer for Vitest functions
global.describe = describe;
global.it = test;
global.expect = expect;
global.beforeEach = beforeEach;
global.afterEach = afterEach;

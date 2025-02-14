/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with testing-library matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

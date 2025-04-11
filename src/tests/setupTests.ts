/**
 * @context: testing
 *
 * Setup file for tests that extends Vitest with Testing Library matchers
 */

import '@testing-library/jest-dom';
import matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// Extend Vitest's expect with all of Testing Library's matchers
expect.extend(matchers);

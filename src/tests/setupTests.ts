/**
 * @context: testing
 * 
 * Setup file for tests that extends Vitest with Testing Library matchers
 */

import '@testing-library/jest-dom';
import { expect } from 'vitest';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with all of Testing Library's matchers
expect.extend(matchers); 
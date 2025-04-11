/**
 * @context: ui-system, component-library, testing
 *
 * Testing Library setup file
 *
 * This file contains additional configuration for testing-library,
 * including custom queries and utilities specific to our component tests.
 */

import * as matchers from '@testing-library/jest-dom/matchers';
import { configure } from '@testing-library/react';
import { expect } from 'vitest';

// Set up Testing Library configuration
configure({
  // Wait a reasonable time for async events to resolve
  asyncUtilTimeout: 1000,

  // Add data-testid to testIdAttribute to ensure we're capturing all selectors
  testIdAttribute: 'data-testid',
});

// Extend Vitest's expect with all Testing Library matchers
expect.extend(matchers);

// Simple mock for window.getComputedStyle (for accessibility testing)
if (typeof window !== 'undefined') {
  window.getComputedStyle =
    window.getComputedStyle ||
    ((): CSSStyleDeclaration => {
      return {
        getPropertyValue: (): string => '',
      } as unknown as CSSStyleDeclaration;
    });
}

// Ensure inputs are focused when they receive an onChange event
const originalOnChange = HTMLInputElement.prototype.onchange;
if (originalOnChange) {
  HTMLInputElement.prototype.onchange = function (event: Event) {
    (this as HTMLInputElement).focus();
    return originalOnChange.call(this, event);
  };
}

// Add custom queries for our component library (example)
// import { queryHelpers, buildQueries } from '@testing-library/react';
//
// const queryAllByResourceType = (container: HTMLElement, resourceType: string) =>
//   queryHelpers.queryAllByAttribute('data-resource-type', container, resourceType);
//
// const getMultipleError = (c: HTMLElement, resourceType: string) =>
//   `Found multiple elements with data-resource-type="${resourceType}"`;
//
// const getMissingError = (c: HTMLElement, resourceType: string) =>
//   `Unable to find an element with data-resource-type="${resourceType}"`;
//
// const [
//   queryByResourceType,
//   getAllByResourceType,
//   getByResourceType,
//   findAllByResourceType,
//   findByResourceType,
// ] = buildQueries(
//   queryAllByResourceType,
//   getMultipleError,
//   getMissingError
// );

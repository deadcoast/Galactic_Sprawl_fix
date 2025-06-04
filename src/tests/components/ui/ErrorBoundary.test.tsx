/**
 * @context: ui-system, component-library, testing, ui-error-handling
 *
 * ErrorBoundary component tests
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../../../components/ui/errors/ErrorBoundary';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../../services/logging/ErrorLoggingService';import { renderWithProviders, screen } from '../../utils/test-utils';

// Mock error logging service
vi.mock('../../../services/ErrorLoggingService', () => ({
  ErrorType: {
    RUNTIME: 'RUNTIME',
    NETWORK: 'NETWORK',
    RESOURCE: 'RESOURCE',
  },
  ErrorSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
  errorLoggingService: {
    logError: vi.fn(),
    clearErrors: vi.fn(),
    getErrors: vi.fn(),
  },
}));

// Component that throws an error
const BuggyComponent = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error from BuggyComponent');
  }
  return <div>BuggyComponent rendered successfully</div>;
};

describe('ErrorBoundary Component', () => {
  // Clear mocks after each test
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when no errors occur', () => {
    renderWithProviders(
      <ErrorBoundary>
        <div>No error content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('No error content')).toBeInTheDocument();
  });

  it('renders fallback UI when an error occurs', () => {
    // Suppress console.error for this test to avoid noise
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Render with component that will throw
    renderWithProviders(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <BuggyComponent />
      </ErrorBoundary>
    );

    // Check that fallback is rendered
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Restore console.error
    console.error = originalConsoleError;
  });

  it('logs errors to the error service', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Render with component that will throw
    renderWithProviders(
      <ErrorBoundary
        componentName="TestComponent"
        errorType={ErrorType.RUNTIME}
        errorSeverity={ErrorSeverity.MEDIUM}
        fallback={<div>Error logged</div>}
      >
        <BuggyComponent />
      </ErrorBoundary>
    );

    // Check that error was logged
    expect(errorLoggingService.logError).toHaveBeenCalledTimes(1);
    expect(errorLoggingService.logError).toHaveBeenCalledWith(
      expect.unknown(Error),
      ErrorType.RUNTIME,
      ErrorSeverity.MEDIUM,
      expect.objectContaining({
        componentName: 'TestComponent',
      })
    );

    // Restore console.error
    console.error = originalConsoleError;
  });

  it('calls onError callback when provided', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = vi.fn();

    const handleError = vi.fn();

    // Render with component that will throw
    renderWithProviders(
      <ErrorBoundary onError={handleError} fallback={<div>Error with callback</div>}>
        <BuggyComponent />
      </ErrorBoundary>
    );

    // Check that onError was called
    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleError).toHaveBeenCalledWith(
      expect.unknown(Error),
      expect.objectContaining({
        componentStack: expect.unknown(String),
      })
    );

    // Restore console.error
    console.error = originalConsoleError;
  });

  it('resets when resetKeys change', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Use a function component to test state changes
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <div>
          <button onClick={() => setShouldThrow(false)}>Fix component</button>
          <ErrorBoundary fallback={<div>Error state</div>} resetKeys={[shouldThrow]}>
            <BuggyComponent shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>
      );
    };

    const { user } = renderWithProviders(<TestComponent />);

    // Initially shows the error UI
    expect(screen.getByText('Error state')).toBeInTheDocument();

    // Click the button to change the resetKey
    user.click(screen.getByText('Fix component')).then(() => {
      // Now should show the success message
      expect(screen.getByText('BuggyComponent rendered successfully')).toBeInTheDocument();
    });

    // Restore console.error
    console.error = originalConsoleError;
  });
});

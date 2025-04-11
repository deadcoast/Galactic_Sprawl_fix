/**
 * @context: ui-system, component-library, testing
 *
 * Test utilities for rendering components with proper context and setup
 */

import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { ReactElement } from 'react';
import { vi } from 'vitest';
import { ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';

/**
 * Mock for ErrorLoggingService
 */
export const mockErrorLoggingService = {
  logError: vi.fn(),
  clearErrors: vi.fn(),
  getErrors: vi.fn().mockReturnValue([]),
};

// Create custom render methods with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add unknown custom options here
  initialTheme?: 'light' | 'dark';
  initialWidth?: number;
}

/**
 * Custom render function that wraps the component with necessary providers
 */
export function renderWithProviders(ui: ReactElement, options: CustomRenderOptions = {}) {
  const { initialTheme = 'light', initialWidth = 1024, ...renderOptions } = options;

  // Mock window size for responsive design testing
  if (initialWidth) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: initialWidth,
    });

    // Trigger resize event if needed
    window.dispatchEvent(new Event('resize'));
  }

  // Create wrapper with all required providers
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      // Add unknown providers here (ThemeProvider, etc.)
      <>{children}</>
    );
  };

  // Return the rendered component with userEvent for testing interactions
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Create a mock for ResizeObserver which is used in various UI components
 */
export function mockResizeObserver() {
  const resizeObserverMock = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Replace global ResizeObserver
  window.ResizeObserver = resizeObserverMock;

  return resizeObserverMock;
}

/**
 * Helper function to wait for animations and transitions to complete
 */
export async function waitForAnimations() {
  // Wait for unknown CSS transitions to finish
  // Default value is a reasonable time for most transitions
  return new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * Creates a mock error event for testing error handling
 */
export function createMockErrorEvent(
  message = 'Test error',
  errorType: ErrorType = ErrorType.RUNTIME,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
) {
  return {
    error: new Error(message),
    errorType,
    severity,
    componentName: 'TestComponent',
    metadata: { test: true },
  };
}

// Re-export everything from testing-library for convenience
export * from '@testing-library/react';
export { userEvent };

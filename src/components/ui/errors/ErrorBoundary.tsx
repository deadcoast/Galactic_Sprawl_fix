/**
 * @context: ui-system, ui-error-handling, component-library
 * 
 * ErrorBoundary component for UI components
 * 
 * This component provides error boundary functionality specifically for UI components,
 * with integration to the error logging system and support for fallback UI components.
 */

import * as React from 'react';
import { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorType, ErrorSeverity, errorLoggingService } from '../../../services/ErrorLoggingService';
import { FallbackProps, ErrorFallback } from './ErrorFallback';

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  
  /** Custom fallback component */
  fallback?: ReactNode | ((props: FallbackProps) => ReactNode);
  
  /** Name of the component being wrapped (for logging) */
  componentName?: string;
  
  /** Function to call when an error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /** Additional metadata to include with error logs */
  metadata?: Record<string, unknown>;
  
  /** Values that will reset the error boundary when they change */
  resetKeys?: unknown[];
  
  /** Whether to show the error details in the fallback UI */
  showErrorDetails?: boolean;
  
  /** CSS class to apply to the fallback component */
  fallbackClassName?: string;
  
  /** Whether error logging should be suppressed */
  suppressLogging?: boolean;
  
  /** Error type for categorization in the logging service */
  errorType?: ErrorType;
  
  /** Error severity for the logging service */
  errorSeverity?: ErrorSeverity;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  
  /** The error that was caught */
  error: Error | null;
  
  /** Information about the error */
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component
 * 
 * Catches errors in child components and renders a fallback UI when an error occurs.
 * Integrates with the error logging system to report errors for monitoring.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Update state when an error occurs
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Log the error and call the onError callback if provided
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { 
      componentName = 'UnknownComponent', 
      onError, 
      metadata, 
      suppressLogging = false,
      errorType = ErrorType.RUNTIME,
      errorSeverity = ErrorSeverity.MEDIUM
    } = this.props;

    // Update the state with error information
    this.setState({ errorInfo });

    // Log the error if logging is not suppressed
    if (!suppressLogging) {
      console.error(`Error in component ${componentName}:`, error);
      console.error('Component stack:', errorInfo.componentStack);
      
      // Log to error logging service
      errorLoggingService.logError(
        error,
        errorType,
        errorSeverity,
        {
          componentName,
          componentStack: errorInfo.componentStack,
          ...metadata
        }
      );
    }

    // Call the onError callback if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  /**
   * Reset the error boundary when reset keys change
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.hasError && 
      this.props.resetKeys && 
      prevProps.resetKeys &&
      this.didResetKeysChange(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.resetErrorBoundary();
    }
  }

  /**
   * Check if reset keys have changed
   */
  private didResetKeysChange(prevResetKeys: unknown[], nextResetKeys: unknown[]): boolean {
    return (
      prevResetKeys.length !== nextResetKeys.length ||
      prevResetKeys.some((value, index) => value !== nextResetKeys[index])
    );
  }

  /**
   * Reset the error boundary state
   */
  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { 
      children, 
      fallback, 
      componentName = 'Component', 
      showErrorDetails = process.env.NODE_ENV !== 'production',
      fallbackClassName
    } = this.props;

    // If there's no error, render the children
    if (!hasError || !error) {
      return children;
    }

    // If a custom fallback is provided as a function, call it with error information
    if (typeof fallback === 'function') {
      return fallback({
        error,
        resetErrorBoundary: this.resetErrorBoundary,
        componentName
      });
    }

    // If a custom fallback is provided as a ReactNode, render it
    if (fallback) {
      return fallback;
    }

    // Otherwise, render the default fallback
    return (
      <ErrorFallback
        error={error}
        resetErrorBoundary={this.resetErrorBoundary}
        componentName={componentName}
        showErrorDetails={showErrorDetails}
        className={fallbackClassName}
      />
    );
  }
}

/**
 * Higher-order component to wrap a component with an error boundary
 * 
 * @param Component The component to wrap
 * @param errorBoundaryProps Props for the error boundary
 * @returns A component wrapped with an error boundary
 * 
 * @example
 * ```tsx
 * const SafeResourceChart = withErrorBoundary(ResourceChart, {
 *   componentName: 'ResourceChart',
 *   fallback: <ResourceChartFallback />,
 *   errorSeverity: ErrorSeverity.HIGH
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const WrappedComponent = (props: P): JSX.Element => (
    <ErrorBoundary {...errorBoundaryProps} componentName={errorBoundaryProps.componentName || displayName}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}

/**
 * Hook for creating error boundary protected components
 * 
 * @param errorBoundaryProps Props for the error boundary
 * @returns Object with the ErrorBoundary component
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ErrorBoundary } = useErrorBoundary({
 *     componentName: 'MyComponent',
 *     fallback: <div>Something went wrong</div>
 *   });
 *   
 *   return (
 *     <ErrorBoundary>
 *       <div>Protected content</div>
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 */
export function useErrorBoundary(
  errorBoundaryProps: Omit<ErrorBoundaryProps, 'children'>
): { ErrorBoundary: React.ComponentType<{ children: ReactNode }> } {
  const ErrorBoundaryComponent = React.useCallback(
    ({ children }: { children: ReactNode }) => (
      <ErrorBoundary {...errorBoundaryProps}>
        {children}
      </ErrorBoundary>
    ),
    [errorBoundaryProps]
  );
  
  return { ErrorBoundary: ErrorBoundaryComponent };
} 
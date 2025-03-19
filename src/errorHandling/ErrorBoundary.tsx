import { Component, ErrorInfo, ReactNode } from 'react';
import { errorLoggingService, ErrorType } from '../services/ErrorLoggingService';
import { ErrorFallback } from './ErrorFallback';

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  /** The components to render */
  children: ReactNode;
  /** Custom fallback component or render function */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Custom context name for error reporting */
  context?: string;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to suppress logging errors to the service */
  suppressErrorLogging?: boolean;
  /** Additional metadata to include in error reports */
  metadata?: Record<string, unknown>;
  /** Array of values that will trigger a reset when they change */
  resetKeys?: unknown[];
  /** Callback when error boundary resets due to resetKeys change */
  onResetKeysChange?: (
    prevResetKeys: unknown[] | undefined,
    resetKeys: unknown[] | undefined
  ) => void;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
}

/**
 * Error Boundary component
 *
 * This component catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Update state when an error occurs
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Log the error and notify error services
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Only log to error service if not suppressed
    if (!this.props?.suppressErrorLogging) {
      errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
        componentStack: errorInfo.componentStack,
        context: this.props?.context || 'ErrorBoundary',
        ...this.props?.metadata,
      });
    }

    // Call the onError callback if provided
    if (this.props?.onError) {
      this.props?.onError(error, errorInfo);
    }
  }

  /**
   * Check if resetKeys have changed and reset error state if they have
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys, onResetKeysChange } = this.props;

    // If we have an error and resetKeys have changed, reset the error state
    if (
      this.state.hasError &&
      resetKeys &&
      prevProps.resetKeys !== resetKeys &&
      this.didResetKeysChange(prevProps.resetKeys, resetKeys)
    ) {
      // Call the onResetKeysChange callback if provided
      if (onResetKeysChange) {
        onResetKeysChange(prevProps.resetKeys, resetKeys);
      }

      // Reset the error state
      this.resetErrorBoundary();
    }
  }

  /**
   * Compare two resetKeys arrays to see if they've changed
   */
  didResetKeysChange(
    prevResetKeys: unknown[] | undefined,
    nextResetKeys: unknown[] | undefined
  ): boolean {
    // If either one is not an array, consider them changed
    if (!Array.isArray(prevResetKeys) || !Array.isArray(nextResetKeys)) {
      return true;
    }

    // If they have different lengths, they've changed
    if (prevResetKeys.length !== nextResetKeys.length) {
      return true;
    }

    // Check if any of the values have changed
    return prevResetKeys.some((value, index) => value !== nextResetKeys[index]);
  }

  /**
   * Reset the error state
   */
  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    // If there's no error, render children normally
    if (!hasError) {
      return children;
    }

    // If there's an error, render the fallback
    if (fallback) {
      // If fallback is a function, call it with the error and reset function
      if (typeof fallback === 'function') {
        return fallback(error!, this.resetErrorBoundary);
      }
      // Otherwise, render the fallback component
      return fallback;
    }

    // If no fallback is provided, use the default ErrorFallback
    return <ErrorFallback error={error!} resetErrorBoundary={this.resetErrorBoundary} />;
  }
}

export default ErrorBoundary;

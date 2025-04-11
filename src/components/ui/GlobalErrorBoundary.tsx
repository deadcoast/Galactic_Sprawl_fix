import { AlertCircle, RefreshCw } from 'lucide-react';
import * as React from 'react';
import { Component, ErrorInfo } from 'react';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global error boundary to catch and handle unhandled errors throughout the application.
 * Provides error logging, a user-friendly fallback UI, and recovery options?.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console - REMOVED as it's handled by onError or default logging service
    // console.error('Global error caught by GlobalErrorBoundary:', error, errorInfo);

    // Send the error to unknownnown error logging service
    if (this.props?.onError) {
      this.props?.onError(error, errorInfo);
    } else {
      // Default logging if no onError prop is provided
      errorLoggingService.logError(error, ErrorType.UI, ErrorSeverity.CRITICAL, {
        componentName: 'GlobalErrorBoundary',
        componentStack: errorInfo?.componentStack,
      });
    }

    // Update state with error details
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    // Reset the error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call the onReset callback if provided
    if (this.props?.onReset) {
      this.props?.onReset();
    } else {
      // Default behavior: reload the page
      window.location.reload();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use that
      if (this.props?.fallback) {
        return this.props?.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 p-6">
          <div className="mx-auto w-full max-w-md rounded-lg border border-red-700/30 bg-red-900/20 p-6 text-white shadow-xl">
            <div className="mb-4 flex items-center space-x-3">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <h2 className="text-xl font-bold text-red-400">Application Error</h2>
            </div>

            <p className="mb-4">
              An unexpected error has occurred. The application may be in an unstable state.
            </p>

            <div className="mb-4 rounded bg-gray-900/50 p-4">
              <p className="text-sm font-medium text-red-300">Error: {this.state.error?.message}</p>
              {this.state.error?.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-400">Stack Trace</summary>
                  <pre className="mt-2 max-h-60 overflow-auto text-xs break-all whitespace-pre-wrap text-gray-400">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center space-x-2 rounded-md bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If no error occurred, render children normally
    return this.props?.children;
  }
}

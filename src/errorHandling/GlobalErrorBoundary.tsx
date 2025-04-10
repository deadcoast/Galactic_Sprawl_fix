import * as React from 'react';
import { ErrorBoundary, ErrorBoundaryProps } from './ErrorBoundary';

/**
 * Global error boundary props
 */
export interface GlobalErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'context' | 'fallback'> {
  /** Whether this is the root boundary (changes styling) */
  isRoot?: boolean;
}

/**
 * Global application error boundary
 *
 * This component is designed to be used at the application root level
 * to catch unknown unhandled errors that bubble up through the component tree.
 */
export const GlobalErrorBoundary: React.FC<GlobalErrorBoundaryProps> = ({
  children,
  isRoot = false,
  onError,
  suppressErrorLogging,
  metadata,
  ...props
}) => {
  const handleReset = () => {
    // For a root-level error, we might want to refresh the page
    if (isRoot) {
      window.location.reload();
      return;
    }

    // Otherwise, just clear unknown application state as needed
    // This could include resetting global state, clearing caches, etc.
  };

  // Custom fallback UI for global error
  const globalFallback = (error: Error, reset: () => void) => {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center">
            <div className="mr-4 rounded-full bg-red-100 p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Something went wrong</h1>
          </div>

          <p className="mb-6 text-gray-600">
            We're sorry, but something went wrong. Our team has been notified and is working to fix
            the issue.
          </p>

          {process.env.NODE_ENV !== 'production' && (
            <div className="mb-6 rounded border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-2 font-medium text-gray-800">Error Details:</h3>
              <pre className="whitespace-pre-wrap break-all text-sm text-red-600">
                {error.message}
              </pre>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600">
                    Stack trace
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-all text-xs text-gray-600">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => reset()}
              className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              {isRoot ? 'Reload Application' : 'Try Again'}
            </button>

            <button
              onClick={() => {
                // Navigate to a safe page, like the home page
                window.location.href = '/';
              }}
              className="rounded bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary
      fallback={globalFallback}
      context="Global"
      onError={(error, errorInfo) => {
        // For root errors, we might want to log analytics events or notify monitoring services
        if (isRoot) {
          // Example: Log to analytics
          try {
            if (window.gtag) {
              window.gtag('event', 'error', {
                event_category: 'Error',
                event_label: error.message,
                value: 1,
              });
            }
          } catch (e) {
            console.error('Failed to log error to analytics:', e);
          }
        }

        // Call original onError handler
        if (onError) {
          onError(error, errorInfo);
        }
      }}
      suppressErrorLogging={suppressErrorLogging}
      metadata={{
        isRoot,
        ...metadata,
      }}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
};

// Add this to global.d.ts if needed
declare global {
  interface Window {
    gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
  }
}

export default GlobalErrorBoundary;

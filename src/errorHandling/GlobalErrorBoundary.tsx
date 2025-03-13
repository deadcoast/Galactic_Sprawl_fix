import React from 'react';
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
 * to catch any unhandled errors that bubble up through the component tree.
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
    
    // Otherwise, just clear any application state as needed
    // This could include resetting global state, clearing caches, etc.
  };

  // Custom fallback UI for global error
  const globalFallback = (error: Error, reset: () => void) => {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <div className="bg-red-100 p-3 rounded-full mr-4">
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
            <h1 className="text-xl font-bold text-gray-800">
              Something went wrong
            </h1>
          </div>
          
          <p className="text-gray-600 mb-6">
            We're sorry, but something went wrong. Our team has been notified and is working to fix the issue.
          </p>
          
          {process.env.NODE_ENV !== 'production' && (
            <div className="mb-6 bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-2">Error Details:</h3>
              <pre className="text-sm text-red-600 whitespace-pre-wrap break-all">
                {error.message}
              </pre>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600">
                    Stack trace
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-all">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              {isRoot ? 'Reload Application' : 'Try Again'}
            </button>
            
            <button
              onClick={() => {
                // Navigate to a safe page, like the home page
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
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
                'event_category': 'Error',
                'event_label': error.message,
                'value': 1
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
    gtag?: (command: string, action: string, params: Record<string, any>) => void;
  }
}

export default GlobalErrorBoundary;
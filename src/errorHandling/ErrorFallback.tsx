import * as React from 'react';
import { cn } from '../utils/cn';

/**
 * Error fallback props
 */
export interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error;
  /** Function to reset the error boundary */
  resetErrorBoundary: () => void;
  /** Title to display in the error message */
  title?: string;
  /** Whether to show the error details */
  showDetails?: boolean;
  /** CSS class name to apply to the container */
  className?: string;
  /** Additional action button text */
  actionText?: string;
  /** Additional action button handler */
  onAction?: () => void;
}

/**
 * Default error fallback component
 *
 * This component renders a user-friendly error message with optional details
 * and a button to reset the error boundary.
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  title = 'Something went wrong',
  showDetails = process.env.NODE_ENV !== 'production',
  className,
  actionText,
  onAction,
}) => {
  return (
    <div
      className={cn('rounded-lg border border-red-200 bg-red-50 p-6 text-red-800', className)}
      role="alert"
    >
      <div className="mb-3 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2 h-6 w-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <p className="mb-4">
        An error occurred while rendering this component.
        {process.env.NODE_ENV !== 'production'
          ? " You're seeing this because you're in development mode."
          : ' Our team has been notified.'}
      </p>

      {showDetails && (
        <div className="mb-4">
          <p className="mb-1 font-medium">Error message:</p>
          <pre className="overflow-auto rounded bg-red-100 p-2 text-sm whitespace-pre-wrap">
            {error.message || 'Unknown error'}
          </pre>
          {error.stack && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">Stack trace</summary>
              <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={resetErrorBoundary}
          className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
        >
          Try again
        </button>

        {actionText && onAction && (
          <button
            onClick={onAction}
            className="rounded bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;

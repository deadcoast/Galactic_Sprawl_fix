/**
 * @context: ui-system, ui-error-handling, component-library
 * 
 * ErrorFallback component for displaying error information to users
 * 
 * This component provides a user-friendly error message when components
 * fail, with options to show technical details and reset the error state.
 */

import * as React from 'react';
import { useCallback } from 'react';

/**
 * Props for the ErrorFallback component
 */
export interface FallbackProps {
  /** The error that was caught */
  error: Error;
  
  /** Function to reset the error boundary */
  resetErrorBoundary: () => void;
  
  /** Name of the component that failed */
  componentName?: string;
  
  /** Whether to show the technical error details */
  showErrorDetails?: boolean;
  
  /** CSS class to apply to the container */
  className?: string;
  
  /** Additional action text */
  actionText?: string;
  
  /** Function to call for the additional action */
  onAction?: () => void;
  
  /** Title for the error message */
  title?: string;
  
  /** Custom message to display */
  message?: string;
  
  /** Whether to show the reset button */
  showResetButton?: boolean;
}

/**
 * ErrorFallback component
 * 
 * Displays a user-friendly error message with options to show technical details
 * and reset the error state.
 */
export const ErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
  componentName = 'Component',
  showErrorDetails = process.env.NODE_ENV !== 'production',
  className = '',
  actionText,
  onAction,
  title = 'An error occurred',
  message = 'We encountered a problem while rendering this component.',
  showResetButton = true,
}) => {
  
  const handleReset = useCallback(() => {
    resetErrorBoundary();
  }, [resetErrorBoundary]);
  
  const handleAction = useCallback(() => {
    if (onAction) {
      onAction();
    }
  }, [onAction]);
  
  return (
    <div
      className={`ui-error-fallback rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 shadow-sm dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2">
        {/* Error icon */}
        <div className="flex-shrink-0 text-red-500 dark:text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-medium">
          {title}
          {componentName && <span className="ml-1 text-sm font-normal opacity-80">({componentName})</span>}
        </h3>
      </div>
      
      {/* Message */}
      <div className="mt-2">
        <p className="text-sm">{message}</p>
        
        {/* Error details */}
        {showErrorDetails && (
          <details className="mt-2 rounded border border-red-200 bg-red-100 p-2 text-xs dark:border-red-800 dark:bg-red-900/50">
            <summary className="cursor-pointer font-medium">Technical Details</summary>
            <div className="mt-1 overflow-auto p-1">
              <p className="font-medium">{error.name}</p>
              <p>{error.message}</p>
              {error.stack && (
                <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs opacity-80">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
      
      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {showResetButton && (
          <button
            onClick={handleReset}
            className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700"
            aria-label="Try again"
          >
            Try Again
          </button>
        )}
        
        {actionText && onAction && (
          <button
            onClick={handleAction}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Error fallback for visualization components
 */
export const VisualizationErrorFallback: React.FC<FallbackProps> = (props) => {
  return (
    <ErrorFallback
      {...props}
      title="Visualization Error"
      message="We couldn't render this visualization. The data might be in an unexpected format."
      className="visualization-error-fallback"
    />
  );
};

/**
 * Error fallback for data fetching components
 */
export const DataFetchingErrorFallback: React.FC<FallbackProps & { refetch?: () => void }> = ({ 
  refetch,
  ...props
}) => {
  return (
    <ErrorFallback
      {...props}
      title="Data Loading Error"
      message="We couldn't load the data for this component."
      actionText={refetch ? "Retry" : undefined}
      onAction={refetch}
    />
  );
};

/**
 * Error fallback for form components
 */
export const FormErrorFallback: React.FC<FallbackProps> = (props) => {
  return (
    <ErrorFallback
      {...props}
      title="Form Error"
      message="There was a problem with this form. Please try again."
    />
  );
}; 
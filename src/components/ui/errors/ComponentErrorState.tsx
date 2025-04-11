/**
 * @context: ui-system, ui-error-handling, component-library
 *
 * ComponentErrorState - Reusable component-specific error states
 *
 * This module provides specialized error state components for different
 * UI element types, offering appropriate fallback UI and error messages.
 */

import { AlertCircle, AlertTriangle, FileX, RefreshCw } from 'lucide-react';
import * as React from 'react';
import { forwardRef, useCallback } from 'react';
import {
  ErrorSeverity,
  ErrorType,
  errorLoggingService,
} from '../../../services/ErrorLoggingService';

/**
 * Base props for all error state components
 */
export interface ErrorStateProps {
  /** Message explaining the error */
  message?: string;

  /** Detailed technical error information */
  details?: string;

  /** Function to retry the operation */
  onRetry?: () => void;

  /** Additional CSS class for styling */
  className?: string;

  /** Whether to show the retry button */
  showRetry?: boolean;

  /** Text for the retry button */
  retryText?: string;

  /** Whether to show an icon */
  showIcon?: boolean;

  /** Whether error details should be displayed */
  showDetails?: boolean;
}

/**
 * Base error state component that other specialized error states extend
 */
export const BaseErrorState: React.FC<ErrorStateProps> = ({
  message = 'An error occurred',
  details,
  onRetry,
  className = '',
  showRetry = true,
  retryText = 'Try Again',
  showIcon = true,
  showDetails = process.env.NODE_ENV !== 'production',
}) => {
  return (
    <div
      className={`rounded-md border border-red-300 bg-red-50 p-4 text-red-800 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        {showIcon && (
          <div className="mr-3 flex-shrink-0 pt-0.5 text-red-500">
            <AlertTriangle size={20} />
          </div>
        )}

        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>

          {showDetails && details && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <p className="mt-1 rounded bg-red-100 p-2 whitespace-pre-wrap dark:bg-red-900/40">
                {details}
              </p>
            </details>
          )}

          {showRetry && onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-200 focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:outline-none dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
              >
                <RefreshCw size={14} className="mr-1.5" />
                {retryText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Error state for data fetching operations
 */
export const DataFetchErrorState: React.FC<ErrorStateProps> = props => {
  return (
    <BaseErrorState
      message={props.message || 'Failed to load data'}
      retryText="Reload Data"
      className={`data-fetch-error ${props.className || ''}`}
      {...props}
      showIcon={props.showIcon !== undefined ? props.showIcon : true}
    />
  );
};

/**
 * Error state for form validation errors
 */
export const FormErrorState: React.FC<ErrorStateProps> = props => {
  return (
    <BaseErrorState
      message={props.message || 'There was a problem with your submission'}
      retryText="Try Again"
      className={`form-error ${props.className || ''}`}
      {...props}
      showIcon={props.showIcon !== undefined ? props.showIcon : true}
    />
  );
};

/**
 * Error state for chart and visualization components
 */
export const VisualizationErrorState: React.FC<ErrorStateProps & { height?: number | string }> = ({
  height = '200px',
  ...props
}) => {
  return (
    <div style={{ height }} className="flex items-center justify-center">
      <BaseErrorState
        message={props.message || 'Failed to render visualization'}
        retryText="Reload Chart"
        className={`visualization-error w-full max-w-md ${props.className || ''}`}
        {...props}
        showIcon={props.showIcon !== undefined ? props.showIcon : true}
      />
    </div>
  );
};

/**
 * Error state for image loading failures
 */
export const ImageErrorState: React.FC<
  ErrorStateProps & { width?: number | string; height?: number | string }
> = ({ width = '100%', height = '150px', ...props }) => {
  return (
    <div
      style={{ width, height }}
      className="flex flex-col items-center justify-center rounded border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
    >
      <FileX size={32} className="mb-2 text-gray-400" />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {props.message || 'Failed to load image'}
      </p>
      {props.onRetry && (
        <button
          onClick={props.onRetry}
          className="mt-2 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {props.retryText || 'Reload'}
        </button>
      )}
    </div>
  );
};

/**
 * Inline error state for form fields
 */
export const FieldErrorState: React.FC<{ error?: string }> = ({ error }) => {
  if (!error) {
    return null;
  }

  return (
    <p className="mt-1 flex items-center text-xs text-red-600 dark:text-red-400">
      <AlertCircle size={12} className="mr-1" />
      {error}
    </p>
  );
};

/**
 * Error state for empty search results
 */
export const EmptyResultsState: React.FC<{
  message?: string;
  resetSearch?: () => void;
  resetText?: string;
  className?: string;
}> = ({
  message = 'No results found',
  resetSearch,
  resetText = 'Clear Search',
  className = '',
}) => {
  return (
    <div className={`my-8 flex flex-col items-center justify-center text-center ${className}`}>
      <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
        <AlertCircle size={24} className="text-gray-500 dark:text-gray-400" />
      </div>
      <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">{message}</p>
      {resetSearch && (
        <button
          onClick={resetSearch}
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {resetText}
        </button>
      )}
    </div>
  );
};

/**
 * Error severity levels for visual indication
 */
export type ErrorStateLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * ComponentErrorState props
 */
export interface ComponentErrorStateProps {
  /**
   * Error message to display
   */
  message: string;

  /**
   * Detailed technical error (only shown in dev mode)
   */
  error?: Error | string;

  /**
   * Visual severity level of the error
   * @default 'medium'
   */
  level?: ErrorStateLevel;

  /**
   * Function to retry the operation that failed
   */
  onRetry?: () => void;

  /**
   * Function to dismiss the error
   */
  onDismiss?: () => void;

  /**
   * Name of the component that failed (for error reporting)
   */
  componentName?: string;

  /**
   * Whether to automatically log the error to error service
   * @default true
   */
  logError?: boolean;

  /**
   * Error type for error logging service
   */
  errorType?: ErrorType;

  /**
   * Error severity for error logging service
   */
  errorSeverity?: ErrorSeverity;

  /**
   * Additional context data for error report
   */
  metadata?: Record<string, unknown>;

  /**
   * Whether to show a compact version
   * @default false
   */
  compact?: boolean;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Additional CSS styles
   */
  style?: React.CSSProperties;

  /**
   * Element ID
   */
  id?: string;

  /**
   * Icon to display next to the error message
   */
  icon?: React.ReactNode;

  /**
   * Whether to show the stack trace (only in dev mode)
   * @default false
   */
  showStack?: boolean;

  /**
   * ID for testing
   */
  'data-testid'?: string;
}

/**
 * Maps error level to corresponding CSS class
 */
const getLevelClass = (level: ErrorStateLevel): string => {
  switch (level) {
    case 'low':
      return 'gs-error-state--low';
    case 'medium':
      return 'gs-error-state--medium';
    case 'high':
      return 'gs-error-state--high';
    case 'critical':
      return 'gs-error-state--critical';
  }
};

/**
 * Maps ErrorStateLevel to ErrorSeverity
 */
const mapLevelToSeverity = (level: ErrorStateLevel): ErrorSeverity => {
  switch (level) {
    case 'low':
      return ErrorSeverity.LOW;
    case 'medium':
      return ErrorSeverity.MEDIUM;
    case 'high':
      return ErrorSeverity.HIGH;
    case 'critical':
      return ErrorSeverity.CRITICAL;
    default:
      return ErrorSeverity.MEDIUM;
  }
};

/**
 * Component that displays a consistent error state UI for failed components
 */
export const ComponentErrorState = forwardRef<HTMLDivElement, ComponentErrorStateProps>(
  (
    {
      message,
      error,
      level = 'medium',
      onRetry,
      onDismiss,
      componentName = 'unknown',
      logError = true,
      errorType = ErrorType.RUNTIME,
      errorSeverity,
      metadata = {},
      compact = false,
      className = '',
      style,
      id,
      icon,
      showStack = false,
      'data-testid': dataTestId = 'component-error-state',
    },
    ref
  ) => {
    // Log error to error service on mount if enabled
    React.useEffect(() => {
      if (logError && error) {
        const errorObj = typeof error === 'string' ? new Error(error) : error;
        const severity = errorSeverity || mapLevelToSeverity(level);

        errorLoggingService.logError(errorObj, errorType, severity, {
          componentName,
          message,
          ...metadata,
        });
      }
    }, [logError, error, errorType, errorSeverity, level, message, componentName, metadata]);

    // Event handlers
    const handleRetry = useCallback(() => {
      // Log retry attempt
      try {
        if (onRetry) {
          onRetry();
        }
      } catch (retryError) {
        console.error('[ComponentErrorState] Error in retry handler:', retryError);

        errorLoggingService.logError(
          retryError instanceof Error ? retryError : new Error(String(retryError)),
          ErrorType.RUNTIME,
          ErrorSeverity.MEDIUM,
          {
            componentName,
            action: 'retry',
            ...metadata,
          }
        );
      }
    }, [onRetry, componentName, metadata]);

    const handleDismiss = useCallback(() => {
      if (onDismiss) {
        onDismiss();
      }
    }, [onDismiss]);

    // Build CSS classes
    const rootClasses = [
      'gs-error-state',
      getLevelClass(level),
      compact ? 'gs-error-state--compact' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Parse error details
    const errorMessage = error instanceof Error ? error.message : String(error || '');
    const errorStack = error instanceof Error ? error.stack : '';
    const isDev = process.env.NODE_ENV === 'development';

    return (
      <div
        ref={ref}
        id={id}
        className={rootClasses}
        style={style}
        data-testid={dataTestId}
        role="alert"
        aria-live="assertive"
      >
        <div className="gs-error-state__content">
          {icon && <div className="gs-error-state__icon">{icon}</div>}

          <div className="gs-error-state__message">
            <div className="gs-error-state__title">{message}</div>

            {isDev && errorMessage && !compact && (
              <div className="gs-error-state__details">{errorMessage}</div>
            )}

            {isDev && showStack && errorStack && !compact && (
              <pre className="gs-error-state__stack">{errorStack}</pre>
            )}
          </div>
        </div>

        <div className="gs-error-state__actions">
          {onRetry && (
            <button className="gs-error-state__retry-button" onClick={handleRetry} type="button">
              Retry
            </button>
          )}

          {onDismiss && (
            <button
              className="gs-error-state__dismiss-button"
              onClick={handleDismiss}
              type="button"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    );
  }
);

ComponentErrorState.displayName = 'ComponentErrorState';

export default ComponentErrorState;

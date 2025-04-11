/**
 * @context: ui-system, ui-error-handling, component-library
 *
 * NetworkErrorFallback - A fallback component for network-related errors
 */

import { Globe, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import React from 'react';
import {
  ErrorSeverity,
  ErrorType,
  errorLoggingService,
} from '../../../services/ErrorLoggingService';
import { ComponentErrorState } from './ComponentErrorState';

export interface NetworkErrorFallbackProps {
  /** Error message or object */
  error?: Error | string;

  /** Function to retry the failed operation */
  onRetry?: () => void;

  /** Additional CSS class */
  className?: string;

  /** Custom message to display */
  message?: string;

  /** Show a more compact version */
  compact?: boolean;

  /** Type of network operation that failed */
  operationType?: 'fetch' | 'api' | 'connection' | 'websocket';

  /** URL that was being accessed when the error occurred */
  url?: string;

  /** HTTP status code if available */
  statusCode?: number;

  /** Additional metadata for error logging */
  metadata?: Record<string, unknown>;
}

/**
 * Helper function to determine if an error is likely a network error
 */
export function isNetworkError(error: Error | unknown): boolean {
  if (!error) {
    return false;
  }

  // Check for specific network error patterns
  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();
    return (
      errorMsg.includes('network') ||
      errorMsg.includes('offline') ||
      errorMsg.includes('connection') ||
      errorMsg.includes('internet') ||
      errorMsg.includes('timeout') ||
      errorMsg.includes('abort') ||
      error.name === 'NetworkError' ||
      error.name === 'AbortError' ||
      error.name === 'TimeoutError'
    );
  }

  return false;
}

/**
 * Get appropriate message based on network error and operation type
 */
function getDefaultMessage(operationType?: string, statusCode?: number): string {
  // Handle based on status code if available
  if (statusCode) {
    if (statusCode === 401 || statusCode === 403) {
      return 'Authentication failed. Please log in again.';
    }
    if (statusCode === 404) {
      return 'The requested resource could not be found.';
    }
    if (statusCode >= 500) {
      return 'The server encountered an error. Please try again later.';
    }
  }

  // Handle based on operation type
  switch (operationType) {
    case 'fetch':
      return 'Failed to fetch data. Please check your connection.';
    case 'api':
      return 'API request failed. Please try again later.';
    case 'connection':
      return 'Connection lost. Please check your internet connection.';
    case 'websocket':
      return 'WebSocket connection failed. Real-time updates unavailable.';
    default:
      return 'Network error occurred. Please check your connection.';
  }
}

/**
 * Component for displaying network-related errors with appropriate messaging and retry option
 */
export function NetworkErrorFallback({
  error,
  onRetry,
  className = '',
  message,
  compact = false,
  operationType,
  url,
  statusCode,
  metadata = {},
}: NetworkErrorFallbackProps) {
  // Generate appropriate message
  const errorMessage = message || getDefaultMessage(operationType, statusCode);

  // Determine icon based on the error type
  const getIcon = () => {
    if (statusCode === 401 || statusCode === 403) {
      return <Wifi size={18} className="network-error-icon--auth" />;
    }
    if (operationType === 'connection' || isNetworkError(error)) {
      return <WifiOff size={18} className="network-error-icon--connection" />;
    }
    return <Globe size={18} className="network-error-icon--general" />;
  };

  // Log error when component mounts
  React.useEffect(() => {
    if (error) {
      const errorObj = typeof error === 'string' ? new Error(error) : error;

      errorLoggingService.logError(errorObj, ErrorType.NETWORK, ErrorSeverity.MEDIUM, {
        component: 'NetworkErrorFallback',
        operationType,
        url,
        statusCode,
        ...metadata,
      });
    }
  }, [error, operationType, url, statusCode, metadata]);

  return (
    <ComponentErrorState
      message={errorMessage}
      error={error}
      level="medium"
      onRetry={onRetry}
      componentName="NetworkError"
      errorType={ErrorType.NETWORK}
      logError={false} // Already logged in useEffect
      compact={compact}
      className={`network-error-fallback ${className}`}
      icon={getIcon()}
      metadata={{
        operationType,
        url,
        statusCode,
        ...metadata,
      }}
    />
  );
}

/**
 * Compact inline version of the network error component
 */
export function InlineNetworkError({
  message,
  onRetry,
  compact = true,
}: {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <div className="inline-network-error">
      <div className="inline-network-error__content">
        <WifiOff size={14} className="inline-network-error__icon" />
        <span className="inline-network-error__message">{message || 'Network error'}</span>

        {onRetry && (
          <button
            className="inline-network-error__retry"
            onClick={onRetry}
            type="button"
            aria-label="Retry connection"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export default NetworkErrorFallback;

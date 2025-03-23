/**
 * @context: ui-system, ui-error-handling, ui-hook-system
 * 
 * useErrorHandler - Hook for handling errors in functional components
 */

import { useState, useCallback } from 'react';
import { ErrorType, ErrorSeverity, errorLoggingService } from '../../services/ErrorLoggingService';

export interface ErrorHandlerConfig {
  /** Component name for error reporting */
  componentName: string;
  
  /** Error type category */
  errorType?: ErrorType;
  
  /** Error severity level */
  errorSeverity?: ErrorSeverity;
  
  /** Additional metadata to include with error logs */
  metadata?: Record<string, unknown>;
  
  /** Whether to automatically log errors */
  autoLog?: boolean;
}

export interface ErrorHandlerState<E extends Error = Error> {
  /** Whether there is an active error */
  hasError: boolean;
  
  /** The error object or message */
  error: E | null;
  
  /** Function to set an error */
  setError: (error: E | null) => void;
  
  /** Function to clear the error */
  clearError: () => void;
  
  /** Function to log an error to the error service */
  logError: (error: E, additionalMetadata?: Record<string, unknown>) => void;
  
  /** Higher-order function that wraps callbacks with error handling */
  withErrorHandling: <T extends (...args: unknown[]) => unknown>(
    fn: T,
    options?: {
      onError?: (error: Error) => void;
      rethrow?: boolean;
    }
  ) => (...args: Parameters<T>) => ReturnType<T> | undefined;
}

/**
 * Hook for managing errors in functional components
 * 
 * Provides consistent error handling, logging, and utility functions
 * for dealing with errors in React components.
 * 
 * @param config Error handler configuration
 * @returns Error handler state and utilities
 * 
 * @example
 * ```tsx
 * const { error, setError, clearError, withErrorHandling } = useErrorHandler({
 *   componentName: 'ResourceList',
 *   errorType: ErrorType.RUNTIME,
 * });
 * 
 * const fetchResources = withErrorHandling(async () => {
 *   const data = await api.getResources();
 *   setResources(data);
 * });
 * 
 * if (error) {
 *   return <ResourceLoadingError error={error} onRetry={clearError} />;
 * }
 * ```
 */
export function useErrorHandler<E extends Error = Error>(config: ErrorHandlerConfig): ErrorHandlerState<E> {
  const {
    componentName,
    errorType = ErrorType.RUNTIME,
    errorSeverity = ErrorSeverity.MEDIUM,
    metadata = {},
    autoLog = true
  } = config;
  
  // Error state
  const [error, setErrorState] = useState<E | null>(null);
  
  // Log error to error logging service
  const logError = useCallback((err: E, additionalMetadata: Record<string, unknown> = {}) => {
    // Create an Error object if not already one
    const errorObj = err instanceof Error ? err : new Error(String(err));
    
    // Log to error service
    errorLoggingService.logError(
      errorObj,
      errorType,
      errorSeverity,
      {
        componentName,
        ...metadata,
        ...additionalMetadata
      }
    );
  }, [componentName, errorType, errorSeverity, metadata]);
  
  // Set error with optional logging
  const setError = useCallback((err: E | null) => {
    setErrorState(err);
    
    // Log error if autoLog is enabled and error exists
    if (autoLog && err) {
      logError(err);
    }
  }, [autoLog, logError]);
  
  // Clear error
  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);
  
  // Wrap a function with error handling
  const withErrorHandling = useCallback(<T extends (...args: unknown[]) => unknown>(
    fn: T,
    options: {
      onError?: (error: Error) => void;
      rethrow?: boolean;
    } = {}
  ) => {
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      try {
        return fn(...args) as ReturnType<T>;
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        
        // Call error handler first
        if (options.onError) {
          options.onError(error);
        }
        
        // Then log error
        if (autoLog !== false) {
          // Cast error to type E since we've constrained E to extend Error
          logError(error as unknown as E);
        }
        
        if (options.rethrow) {
          throw error;
        }
        
        return undefined;
      }
    };
  }, [logError, autoLog]);
  
  return {
    hasError: error !== null,
    error,
    setError,
    clearError,
    logError,
    withErrorHandling
  };
}

/**
 * Specialized version of useErrorHandler for API requests
 */
export function useApiErrorHandler(componentName: string, metadata: Record<string, unknown> = {}) {
  return useErrorHandler({
    componentName,
    errorType: ErrorType.NETWORK,
    errorSeverity: ErrorSeverity.MEDIUM,
    metadata: {
      source: 'api',
      ...metadata
    }
  });
}

/**
 * Specialized version of useErrorHandler for resource operations
 */
export function useResourceErrorHandler(componentName: string, metadata: Record<string, unknown> = {}) {
  return useErrorHandler({
    componentName,
    errorType: ErrorType.RESOURCE,
    errorSeverity: ErrorSeverity.MEDIUM,
    metadata: {
      source: 'resource',
      ...metadata
    }
  });
}

export default useErrorHandler; 
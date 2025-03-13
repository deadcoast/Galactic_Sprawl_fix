import React from 'react';
import { ErrorBoundary, ErrorBoundaryProps } from '../ErrorBoundary';
import { ErrorFallback } from '../ErrorFallback';

/**
 * Props for the data fetching error boundary
 */
export interface DataFetchingErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'context'> {
  /** Whether we should try to automatically refetch on error */
  retryOnError?: boolean;
  /** Function to call to fetch the data */
  fetchData?: () => Promise<void>;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Data source or API endpoint for better error reporting */
  dataSource?: string;
  /** Additional fetching metadata */
  fetchMetadata?: Record<string, unknown>;
}

/**
 * Specialized error boundary for data fetching components
 * 
 * This error boundary is designed specifically for components that fetch data,
 * with specialized handling for network errors, API errors, etc.
 */
export const DataFetchingErrorBoundary: React.FC<DataFetchingErrorBoundaryProps> = ({
  children,
  fallback,
  retryOnError = false,
  fetchData,
  maxRetries = 3,
  dataSource,
  fetchMetadata,
  onError,
  suppressErrorLogging,
  metadata,
  ...props
}) => {
  // Track retry attempts
  const retryAttemptsRef = React.useRef(0);
  
  // Combine data-fetching-specific metadata with general metadata
  const combinedMetadata = {
    ...(dataSource && { dataSource }),
    retryAttempts: retryAttemptsRef.current,
    ...fetchMetadata,
    ...metadata,
  };

  // Custom error handler that can trigger retry
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Update retry information
    combinedMetadata.retryAttempts = retryAttemptsRef.current;
    
    // Call the original onError callback if provided
    if (onError) {
      onError(error, errorInfo);
    }
    
    // Automatically retry fetching if option is enabled
    if (retryOnError && fetchData && retryAttemptsRef.current < maxRetries) {
      retryAttemptsRef.current += 1;
      
      // Add exponential backoff
      const backoffDelay = Math.min(1000 * Math.pow(2, retryAttemptsRef.current), 30000);
      
      setTimeout(() => {
        fetchData().catch(e => {
          console.error('Error retrying data fetch:', e);
        });
      }, backoffDelay);
    }
  };

  // Reset retry counter when boundary resets
  const handleReset = () => {
    retryAttemptsRef.current = 0;
    
    // Immediately refetch if function is provided
    if (fetchData) {
      fetchData().catch(e => {
        console.error('Error fetching data after reset:', e);
      });
    }
  };

  // Custom fallback UI specific to data fetching
  const dataFetchingFallback = (error: Error, reset: () => void) => {
    // If a custom fallback is provided, use that
    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback(error, reset);
      }
      return fallback;
    }
    
    // Determine if this is a network error
    const isNetworkError = error.message.includes('network') || 
                           error.message.includes('fetch') ||
                           error.message.includes('Failed to fetch') ||
                           error.message.includes('Network request failed');
                           
    // Determine if this is an API error (4xx/5xx)
    const isApiError = error.message.includes('API') ||
                       error.message.includes('status code') ||
                       /[45]\d\d/.test(error.message);
    
    // Create a more specific error title based on the error type
    let errorTitle = 'Data Loading Error';
    if (isNetworkError) {
      errorTitle = 'Network Error';
    } else if (isApiError) {
      errorTitle = 'API Error';
    }
    
    // Create action text for the retry button
    const actionText = retryAttemptsRef.current > 0 
      ? `Retry Again (${retryAttemptsRef.current}/${maxRetries})` 
      : 'Retry';
    
    return (
      <ErrorFallback
        error={error}
        resetErrorBoundary={() => {
          handleReset();
          reset();
        }}
        title={errorTitle}
        showDetails={process.env.NODE_ENV !== 'production'}
        actionText={fetchData ? actionText : undefined}
        onAction={fetchData ? () => {
          fetchData().catch(e => {
            console.error('Error fetching data from action button:', e);
          });
        } : undefined}
      />
    );
  };

  return (
    <ErrorBoundary
      fallback={dataFetchingFallback}
      context="DataFetching"
      onError={handleError}
      suppressErrorLogging={suppressErrorLogging}
      metadata={combinedMetadata}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
};

export default DataFetchingErrorBoundary;
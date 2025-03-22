/**
 * @context: ui-system, ui-error-handling, component-library
 * 
 * ErrorHandlingExamples - Examples of how to use error handling components
 * 
 * This file serves as documentation and examples of how to properly use the error
 * handling components throughout the application.
 */

import React, { useState, useCallback } from 'react';
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
import { ComponentErrorState } from './ComponentErrorState';
import { ResourceLoadingError, InlineResourceLoadingError } from './ResourceLoadingError';
import { NetworkErrorFallback, InlineNetworkError } from './NetworkErrorFallback';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { ErrorType, ErrorSeverity } from '../../../services/ErrorLoggingService';

// Mock component that triggers an error
const BuggyComponent = () => {
  React.useEffect(() => {
    throw new Error('This is a test error from BuggyComponent');
  }, []);
  
  return <div>This should not render</div>;
};

/**
 * Example 1: Using ErrorBoundary to catch render errors
 */
export const ErrorBoundaryExample = () => {
  return (
    <div className="error-example">
      <h3>Error Boundary Example</h3>
      <ErrorBoundary
        componentName="ExampleComponent"
        errorType={ErrorType.RUNTIME}
        errorSeverity={ErrorSeverity.MEDIUM}
        metadata={{ section: 'dashboard' }}
        fallback={
          <ComponentErrorState
            message="An error occurred while rendering this component"
            level="medium"
            onRetry={() => window.location.reload()}
          />
        }
      >
        <BuggyComponent />
      </ErrorBoundary>
    </div>
  );
};

/**
 * Example 2: Resource loading error handling with retry
 */
export const ResourceErrorExample = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      // Simulate error for demonstration
      setError(new Error('Failed to load resource data'));
      setLoading(false);
    }, 1000);
  }, []);
  
  // Initial "load"
  React.useEffect(() => {
    handleRetry();
  }, [handleRetry]);
  
  if (loading) {
    return <div>Loading resource data...</div>;
  }
  
  if (error) {
    return (
      <ResourceLoadingError
        resourceType={ResourceType.ENERGY}
        error={error}
        onRetry={handleRetry}
      />
    );
  }
  
  return <div>Resource loaded successfully</div>;
};

/**
 * Example 3: Network error handling with status code
 */
export const NetworkErrorExample = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  
  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      // Simulate error for demonstration
      setError(new Error('API request failed'));
      setStatusCode(500);
      setLoading(false);
    }, 1000);
  }, []);
  
  // Initial "load"
  React.useEffect(() => {
    handleRetry();
  }, [handleRetry]);
  
  if (loading) {
    return <div>Loading data from API...</div>;
  }
  
  if (error) {
    return (
      <NetworkErrorFallback
        error={error}
        statusCode={statusCode}
        operationType="api"
        url="https://api.example.com/data"
        onRetry={handleRetry}
      />
    );
  }
  
  return <div>API data loaded successfully</div>;
};

/**
 * Example 4: Inline error states for less disruptive UI
 */
export const InlineErrorsExample = () => {
  return (
    <div className="inline-errors-example">
      <h3>Inline Error Examples</h3>
      
      <div className="example-grid">
        <div className="example-item">
          <h4>Inline Resource Error</h4>
          <div className="card p-4">
            <div className="card-content">
              <InlineResourceLoadingError 
                resourceType={ResourceType.MINERALS}
                onRetry={() => alert('Retry loading minerals')}
              />
            </div>
          </div>
        </div>
        
        <div className="example-item">
          <h4>Inline Network Error</h4>
          <div className="card p-4">
            <div className="card-content">
              <InlineNetworkError 
                message="Connection lost"
                onRetry={() => alert('Retry connection')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Example 5: Using withErrorBoundary HOC to wrap components
 */
export const WithErrorBoundaryExample = () => {
  // Create a safe version of the buggy component
  const SafeBuggyComponent = withErrorBoundary(BuggyComponent, {
    componentName: 'SafeBuggyComponent',
    errorType: ErrorType.RUNTIME,
    errorSeverity: ErrorSeverity.MEDIUM,
    fallback: (
      <ComponentErrorState
        message="Component error caught by HOC"
        level="medium"
      />
    )
  });
  
  return (
    <div className="error-hoc-example">
      <h3>withErrorBoundary HOC Example</h3>
      <SafeBuggyComponent />
    </div>
  );
};

/**
 * Combined examples component
 */
export const ErrorHandlingExamples = () => {
  return (
    <div className="error-handling-examples">
      <h2>Error Handling Examples</h2>
      
      <div className="example-section">
        <ErrorBoundaryExample />
      </div>
      
      <div className="example-section">
        <h3>Resource Error Example</h3>
        <ResourceErrorExample />
      </div>
      
      <div className="example-section">
        <h3>Network Error Example</h3>
        <NetworkErrorExample />
      </div>
      
      <div className="example-section">
        <InlineErrorsExample />
      </div>
      
      <div className="example-section">
        <WithErrorBoundaryExample />
      </div>
    </div>
  );
};

export default ErrorHandlingExamples; 
# Error Handling System

This directory contains a comprehensive error handling system for UI components in the Galactic Sprawl project. The error handling system provides standardized ways to handle, display, and recover from errors in the application.

## Core Components

### ErrorBoundary

The `ErrorBoundary` component is a class component that catches JavaScript errors in its child component tree, logs those errors, and displays a fallback UI instead of crashing the application.

```tsx
import { ErrorBoundary } from '../errors';

function App() {
  return (
    <ErrorBoundary
      componentName="ResourceDisplay"
      fallback={<div>Something went wrong!</div>}
      onError={(error, errorInfo) => {
        // Log error to monitoring service
        console.error('Error caught by boundary:', error, errorInfo);
      }}
    >
      <ResourceDisplay />
    </ErrorBoundary>
  );
}
```

### Component Error States

A collection of reusable error state components for different UI contexts:

- `BaseErrorState`: Generic error display
- `DataFetchErrorState`: For data loading failures
- `FormErrorState`: For form submission errors
- `VisualizationErrorState`: For visualization rendering failures
- `ImageErrorState`: For image loading failures
- `FieldErrorState`: For form field validation errors
- `EmptyResultsState`: For empty data sets

### Component-Specific Error States

Specialized error states tailored to specific UI components:

- `ChartErrorState`: Error display for chart/graph components
- `ResourceDisplayErrorState`: Error display for resource data components
- `ModuleCardErrorState`: Error display for module card components

## Integration Guidelines

### 1. Using ErrorBoundary

Wrap components that may throw errors with an ErrorBoundary:

```tsx
import { ErrorBoundary } from '../errors';
import { ErrorType, ErrorSeverity } from '../../services/ErrorLoggingService';

function ModuleSection() {
  return (
    <ErrorBoundary
      componentName="ModuleSection"
      errorType={ErrorType.RUNTIME}
      errorSeverity={ErrorSeverity.MEDIUM}
      fallback={({ error, resetErrorBoundary }) => (
        <ComponentErrorState
          message="Failed to render module section"
          error={error}
          level="medium"
          onRetry={resetErrorBoundary}
        />
      )}
    >
      <ModuleList />
    </ErrorBoundary>
  );
}
```

### 2. Using withErrorBoundary HOC

For functional components that need error boundaries:

```tsx
import { withErrorBoundary } from '../errors';

function ResourceChart({ data }) {
  // Component implementation
}

export default withErrorBoundary(ResourceChart, {
  componentName: 'ResourceChart',
  fallback: ({ error, resetErrorBoundary }) => (
    <ChartErrorState title="Resource Chart" error={error} onRetry={resetErrorBoundary} />
  ),
});
```

### 3. Component-Level Error Handling

For components that load data:

```tsx
function ResourceList() {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadResources() {
      try {
        setIsLoading(true);
        const data = await getResourceManager().fetchResources();
        setResources(data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadResources();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ResourceDisplayErrorState
        resourceType="Resources"
        error={error}
        onRetry={() => setIsLoading(true)}
      />
    );
  }

  return (
    // Render resource list
  );
}
```

### 4. Form Error Handling

For form components:

```tsx
function ResourceForm() {
  const [formState, setFormState] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await submitResource(formState);
    } catch (error) {
      setSubmitError(error);
    }
  };

  if (submitError) {
    return (
      <FormErrorState
        message="Failed to save resource"
        details={submitError.message}
        onRetry={() => setSubmitError(null)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {formErrors.name && <FieldErrorState error={formErrors.name} />}
      {/* Submit button */}
    </form>
  );
}
```

## Error Logging Integration

Error components automatically integrate with the ErrorLoggingService:

```tsx
import { ErrorType, ErrorSeverity, errorLoggingService } from '../../services/ErrorLoggingService';

// Manual error logging
try {
  // Risky operation
} catch (error) {
  // Log error
  errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.MEDIUM, {
    component: 'ResourceManager',
    action: 'fetchResources',
    additionalContext: { resourceId: '123' },
  });

  // Show error UI
  return <ResourceDisplayErrorState error={error} />;
}
```

## Best Practices

1. **Use ErrorBoundaries strategically**: Place them at important UI boundaries rather than wrapping every component
2. **Provide retry mechanisms**: Always give users a way to retry operations when appropriate
3. **Be specific with error messages**: Use clear, user-friendly messages explaining what went wrong
4. **Include technical details in dev mode**: Show developers additional information in non-production environments
5. **Log errors for monitoring**: Ensure errors are properly logged for debugging and monitoring
6. **Handle all async errors**: Always use try/catch for async operations
7. **Show appropriate fallback UI**: Select the right error component for each context
8. **Use type-safety**: Leverage TypeScript to ensure proper error component usage

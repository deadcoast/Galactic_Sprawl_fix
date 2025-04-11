# Error Boundary System

This directory contains a comprehensive error handling system for the application, built around React Error Boundaries.

## Core Components

- **ErrorBoundary**: Base error boundary component that catches and handles errors
- **ErrorFallback**: Default fallback UI for displaying errors to users
- **GlobalErrorBoundary**: Application-level error boundary for catching unhandled errors

## Specialized Boundaries

- **VisualizationErrorBoundary**: For charts, graphs, maps, etc.
- **DataFetchingErrorBoundary**: For components that fetch data from APIs

## Higher-Order Components and Utilities

- **withErrorBoundary**: HOC to wrap unknown component with an error boundary
- **createTypedErrorBoundary**: Creates a typed error boundary for a specific component
- **createSafeComponents**: Utility to create safer versions of multiple components
- **createSpecializedErrorBoundary**: Creates a specialized error boundary for specific use cases

## Migration Utilities

- **D3VisualizationErrorBoundaryAdapter**: Adapter for legacy D3 visualization error boundaries
- **IntegrationErrorHandlerAdapter**: Adapter for legacy integration error handlers
- **migrateComponentWithErrorBoundary**: Utility to migrate a component to the new error boundary system

## Usage Examples

### Root Level Error Handling

```tsx
// In your app root
<GlobalErrorBoundary isRoot>
  <App />
</GlobalErrorBoundary>
```

### Data Fetching Components

```tsx
// For components that fetch data
<DataFetchingErrorBoundary fetchData={refetch} retryOnError maxRetries={3}>
  <UserProfile userId={userId} />
</DataFetchingErrorBoundary>
```

### Visualization Components

```tsx
// For visualization components
<VisualizationErrorBoundary visualizationType="chart" dataSize={data.length}>
  <LineChart data={data} />
</VisualizationErrorBoundary>
```

### Using Higher-Order Components

```tsx
// Create a safe version of a component
const SafeComponent = withErrorBoundary(DangerousComponent, {
  context: 'CustomContext',
  fallback: <CustomErrorUI />,
});

// Usage
<SafeComponent {...props} />;
```

### Creating Typed Error Boundaries

```tsx
// Create a typed error boundary for a specific component
const SafeChart = createTypedErrorBoundary(LineChart, 'LineChart');

// Usage
<SafeChart data={data} errorContext={{ chartType: 'line' }} />;
```

### Migration from Legacy Error Boundaries

```tsx
// For legacy D3 visualization error boundaries
<D3VisualizationErrorBoundaryAdapter
  componentName="CustomChart"
>
  <LegacyVisualization />
</D3VisualizationErrorBoundaryAdapter>

// For legacy integration error handlers
<IntegrationErrorHandlerAdapter
  componentName="IntegrationComponent"
>
  <LegacyComponent />
</IntegrationErrorHandlerAdapter>
```

## Best Practices

1. Use the GlobalErrorBoundary at the application root level
2. Use specialized error boundaries for specific contexts closer to where errors might occur
3. Provide custom fallback UIs tailored to specific error scenarios
4. Always include reset functionality to allow users to recover from errors
5. For component libraries, use the HOC utilities to create pre-wrapped safe components
6. Include meaningful metadata when reporting errors to aid in debugging
7. Use resetKeys for automatic recovery when props change

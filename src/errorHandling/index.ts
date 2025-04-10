// Export core error handling components
export * from './ErrorBoundary';
export * from './ErrorFallback';
export * from './GlobalErrorBoundary';

// Export specialized error boundaries
export * from './specialized/DataFetchingErrorBoundary';
export * from './specialized/VisualizationErrorBoundary';

// Export utilities
export * from './utils/errorBoundaryHOC';
export * from './utils/migration';

// Re-export default exports
import ErrorBoundary from './ErrorBoundary';
import ErrorFallback from './ErrorFallback';
import GlobalErrorBoundary from './GlobalErrorBoundary';
import DataFetchingErrorBoundary from './specialized/DataFetchingErrorBoundary';
import VisualizationErrorBoundary from './specialized/VisualizationErrorBoundary';
import {
  createSafeComponents,
  createSpecializedErrorBoundary,
  createTypedErrorBoundary,
  withErrorBoundary,
} from './utils/errorBoundaryHOC';
import {
  D3VisualizationErrorBoundaryAdapter,
  IntegrationErrorHandlerAdapter,
  migrateComponentWithErrorBoundary,
} from './utils/migration';

export {
  createSafeComponents,
  createSpecializedErrorBoundary,
  createTypedErrorBoundary,
  // Migration utilities
  D3VisualizationErrorBoundaryAdapter,
  DataFetchingErrorBoundary,
  ErrorBoundary,
  ErrorFallback,
  GlobalErrorBoundary,
  IntegrationErrorHandlerAdapter,
  migrateComponentWithErrorBoundary,
  VisualizationErrorBoundary,
  withErrorBoundary,
};

/**
 * Error Handling System
 *
 * This module provides a comprehensive error handling system for the application,
 * built around React Error Boundaries. It includes specialized error boundaries
 * for different contexts and a consistent approach to error reporting and recovery.
 *
 * Key Components:
 *
 * - ErrorBoundary: Base error boundary component that catches and handles errors
 * - ErrorFallback: Default fallback UI for displaying errors to users
 * - GlobalErrorBoundary: Application-level error boundary for catching unhandled errors
 * - Specialized boundaries for specific contexts:
 *   - VisualizationErrorBoundary: For charts, graphs, maps, etc.
 *   - DataFetchingErrorBoundary: For components that fetch data from APIs
 *
 * Higher-Order Components and Utilities:
 *
 * - withErrorBoundary: HOC to wrap unknown component with an error boundary
 * - createTypedErrorBoundary: Creates a typed error boundary for a specific component
 *
 * Usage Guidelines:
 *
 * 1. Use the GlobalErrorBoundary at the application root level to catch unknown unhandled errors
 * 2. Use specialized error boundaries for specific contexts closer to where errors might occur
 * 3. Provide custom fallback UIs when appropriate for your component
 * 4. Always include reset functionality to allow users to recover from errors
 * 5. For component libraries, use the HOC utilities to create pre-wrapped safe components
 *
 * Example:
 * ```tsx
 * // Root level
 * <GlobalErrorBoundary isRoot>
 *   <App />
 * </GlobalErrorBoundary>
 *
 * // Data fetching component
 * <DataFetchingErrorBoundary fetchData={refetch} retryOnError>
 *   <UserProfile userId={userId} />
 * </DataFetchingErrorBoundary>
 *
 * // Visualization component
 * <VisualizationErrorBoundary visualizationType="chart" dataSize={data?.length}>
 *   <LineChart data={data} />
 * </VisualizationErrorBoundary>
 *
 * // Using HOC
 * const SafeComponent = withErrorBoundary(DangerousComponent, {
 *   context: 'CustomContext',
 *   fallback: <CustomErrorUI />
 * });
 *
 * // Creating a typed error boundary
 * const SafeChart = createTypedErrorBoundary(
 *   LineChart,
 *   'LineChart'
 * );
 * ```
 */

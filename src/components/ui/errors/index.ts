/**
 * @context: ui-system, ui-error-handling, component-library
 *
 * Error handling component exports
 */

// Core error components
export {
  BaseErrorState,
  ComponentErrorState,
  DataFetchErrorState,
  EmptyResultsState,
  FieldErrorState,
  FormErrorState,
  ImageErrorState,
  VisualizationErrorState,
} from './ComponentErrorState';
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';

// Resource-specific error components
export { InlineResourceLoadingError, ResourceLoadingError } from './ResourceLoadingError';

// Network error components
export { InlineNetworkError, NetworkErrorFallback, isNetworkError } from './NetworkErrorFallback';

// Component-specific error states
export {
  ChartErrorState,
  ModuleCardErrorState,
  ResourceDisplayErrorState,
  ResourceGraph,
  ResourceGraphWithErrorBoundary,
  ResourcePanel,
} from './ComponentSpecificErrorStates';

// Examples and documentation
export {
  ErrorBoundaryExample,
  ErrorHandlingExamples,
  InlineErrorsExample,
  NetworkErrorExample,
  ResourceErrorExample,
  WithErrorBoundaryExample,
} from './ErrorHandlingExamples';

// Type exports
export type {
  ComponentErrorStateProps,
  ErrorStateLevel,
  ErrorStateProps,
} from './ComponentErrorState';
export type {
  ChartErrorProps,
  ModuleCardErrorProps,
  ResourceDisplayErrorProps,
  ResourceGraphProps,
} from './ComponentSpecificErrorStates';
export type { ErrorBoundaryProps } from './ErrorBoundary';
export type { NetworkErrorFallbackProps } from './NetworkErrorFallback';
export type { ResourceLoadingErrorProps } from './ResourceLoadingError';

/**
 * @context: ui-system, ui-error-handling, component-library
 * 
 * Error handling component exports
 */

// Core error components
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
export { 
  ComponentErrorState, 
  BaseErrorState,
  DataFetchErrorState,
  FormErrorState,
  VisualizationErrorState,
  ImageErrorState,
  FieldErrorState,
  EmptyResultsState 
} from './ComponentErrorState';

// Resource-specific error components
export { 
  ResourceLoadingError, 
  InlineResourceLoadingError 
} from './ResourceLoadingError';

// Network error components
export { 
  NetworkErrorFallback, 
  InlineNetworkError,
  isNetworkError
} from './NetworkErrorFallback';

// Component-specific error states
export {
  ChartErrorState,
  ResourceDisplayErrorState,
  ModuleCardErrorState,
  ResourceGraph,
  ResourceGraphWithErrorBoundary,
  ResourcePanel
} from './ComponentSpecificErrorStates';

// Examples and documentation
export { 
  ErrorHandlingExamples,
  ErrorBoundaryExample,
  ResourceErrorExample,
  NetworkErrorExample,
  InlineErrorsExample,
  WithErrorBoundaryExample
} from './ErrorHandlingExamples';

// Type exports
export type { ErrorBoundaryProps } from './ErrorBoundary';
export type { ComponentErrorStateProps, ErrorStateProps, ErrorStateLevel } from './ComponentErrorState';
export type { ResourceLoadingErrorProps } from './ResourceLoadingError';
export type { NetworkErrorFallbackProps } from './NetworkErrorFallback';
export type { 
  ChartErrorProps, 
  ResourceDisplayErrorProps,
  ModuleCardErrorProps,
  ResourceGraphProps
} from './ComponentSpecificErrorStates'; 
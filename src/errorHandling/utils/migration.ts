import React, { ComponentType } from 'react';
import
  {
    ErrorType
  } from '../../services/logging/ErrorLoggingService';
import { ErrorBoundary, ErrorBoundaryProps } from '../ErrorBoundary';
import { withErrorBoundary } from './errorBoundaryHOC';

/**
 * Interface for the legacy D3VisualizationErrorBoundary props
 */
interface LegacyD3ErrorBoundaryProps {
  /** Child components */
  children: React.ReactNode;
  /** Name of the visualization component (for error reporting) */
  componentName: string;
  /** Custom error fallback component */
  FallbackComponent?: React.ComponentType<{
    error: Error;
    componentName: string;
    resetError: () => void;
    errorContext?: Record<string, unknown>;
  }>;
  /** Function to handle errors */
  onError?: (error: Error, errorInfo: React.ErrorInfo, componentName: string) => void;
  /** Optional error context to include in error reporting */
  errorContext?: Record<string, unknown>;
  /** Reset keys that will cause the error boundary to reset when they change */
  resetKeys?: unknown[];
}

/**
 * A component that adapts from the legacy UI D3VisualizationErrorBoundary to the new unified error boundary system
 */
export const D3VisualizationErrorBoundaryAdapter: React.FC<LegacyD3ErrorBoundaryProps> = props => {
  const { children, componentName, FallbackComponent, onError, errorContext, resetKeys } = props;

  // Create fallback function if FallbackComponent is provided
  let fallback: ((error: Error, reset: () => void) => React.ReactNode) | undefined = undefined;
  if (FallbackComponent) {
    fallback = (error: Error, reset: () => void) => {
      return React.createElement(FallbackComponent, {
        error,
        componentName,
        resetError: reset,
        errorContext,
      });
    };
  }

  // Create error handler if onError is provided
  const handleError = onError
    ? (error: Error, errorInfo: React.ErrorInfo) => {
        onError(error, errorInfo, componentName);
      }
    : undefined;

  return React.createElement(ErrorBoundary, {
    context: `D3Visualization:${componentName}`,
    fallback: fallback,
    onError: handleError,
    resetKeys: resetKeys,
    metadata: {
      visualizationType: 'D3',
      componentName,
      ...(errorContext ?? {}),
    },
    children,
  });
};

/**
 * Props for the legacy IntegrationErrorHandler
 */
export interface LegacyIntegrationErrorHandlerProps {
  /** Child components */
  children: React.ReactNode;
  /** Component name for error reporting */
  componentName: string;
  /** Function to handle errors */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /** Custom fallback component */
  FallbackComponent?: React.ComponentType<{
    error: Error;
    resetErrorBoundary: () => void;
  }>;
}

/**
 * Adapter for legacy IntegrationErrorHandler components
 */
export const IntegrationErrorHandlerAdapter: React.FC<
  LegacyIntegrationErrorHandlerProps
> = props => {
  const { children, componentName, onError, FallbackComponent } = props;

  // Create fallback function if FallbackComponent is provided
  let fallback: ((error: Error, reset: () => void) => React.ReactNode) | undefined = undefined;
  if (FallbackComponent) {
    fallback = (error: Error, reset: () => void) => {
      return React.createElement(FallbackComponent, {
        error,
        resetErrorBoundary: reset,
      });
    };
  }

  return React.createElement(ErrorBoundary, {
    context: `Integration:${componentName}`,
    fallback: fallback,
    onError: onError,
    metadata: {
      type: ErrorType.EXTERNAL_SERVICE,
      componentName,
    },
    children,
  });
};

/**
 * Options for migrating a component with a specific error boundary to the unified system
 */
export interface MigrateComponentOptions {
  /** What type of error boundary to use */
  boundaryType: 'visualization' | 'integration' | 'data' | 'standard';
  /** Component name for error reporting */
  componentName: string;
  /** Additional props to pass to the error boundary */
  boundaryProps?: Partial<ErrorBoundaryProps>;
}

/**
 * Migrate a component that uses a legacy error boundary to the new system
 */
export function migrateComponentWithErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: MigrateComponentOptions
): React.FC<P> {
  const { boundaryType, componentName, boundaryProps = {} } = options;

  // Base options for the error boundary
  const baseOptions: Partial<ErrorBoundaryProps> = {
    context: componentName,
    ...boundaryProps,
  };

  // Create specialized options based on boundary type
  switch (boundaryType) {
    case 'visualization':
      return withErrorBoundary(Component, {
        ...baseOptions,
        context: `Visualization:${componentName}`,
        metadata: {
          visualizationType: 'component',
          ...baseOptions.metadata,
        },
      });

    case 'integration':
      return withErrorBoundary(Component, {
        ...baseOptions,
        context: `Integration:${componentName}`,
        metadata: {
          type: ErrorType.EXTERNAL_SERVICE,
          ...baseOptions.metadata,
        },
      });

    case 'data':
      return withErrorBoundary(Component, {
        ...baseOptions,
        context: `DataFetching:${componentName}`,
        metadata: {
          type: ErrorType.NETWORK,
          ...baseOptions.metadata,
        },
      });

    case 'standard':
    default:
      return withErrorBoundary(Component, baseOptions);
  }
}

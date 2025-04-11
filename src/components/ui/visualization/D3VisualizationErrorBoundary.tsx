import * as React from 'react';
import { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Props for the error fallback component
 */
export interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error;
  /** The component that failed */
  componentName: string;
  /** Function to reset the error state */
  resetError: () => void;
  /** Additional context information about the error */
  errorContext?: Record<string, unknown>;
}

/**
 * Default simple error fallback component
 */
export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  componentName,
  resetError,
  errorContext,
}) => (
  <div className="d3-visualization-error rounded border border-red-500 bg-red-50 p-4 text-red-900">
    <h3 className="mb-2 text-lg font-semibold">Visualization Error</h3>
    <p className="mb-2">An error occurred while rendering the {componentName} visualization:</p>
    <pre className="mb-3 overflow-auto rounded bg-red-100 p-2 text-sm">{error.message}</pre>
    {errorContext && (
      <div className="mb-3">
        <h4 className="mb-1 font-medium">Error Context:</h4>
        <pre className="overflow-auto rounded bg-red-100 p-2 text-sm">
          {JSON.stringify(errorContext, null, 2)}
        </pre>
      </div>
    )}
    <button
      onClick={resetError}
      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
    >
      Retry
    </button>
  </div>
);

/**
 * Props for the D3VisualizationErrorBoundary component
 */
export interface D3VisualizationErrorBoundaryProps {
  /** Child components */
  children: ReactNode;
  /** Name of the visualization component (for error reporting) */
  componentName: string;
  /** Custom error fallback component */
  FallbackComponent?: React.ComponentType<ErrorFallbackProps>;
  /** Function to handle errors */
  onError?: (error: Error, errorInfo: ErrorInfo, componentName: string) => void;
  /** Optional error context to include in error reporting */
  errorContext?: Record<string, unknown>;
  /** Reset keys that will cause the error boundary to reset when they change */
  resetKeys?: unknown[];
}

/**
 * State for the D3VisualizationErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for D3 visualizations
 *
 * This component catches errors in D3 visualizations and displays a fallback UI
 * instead of crashing the entire application.
 */
export class D3VisualizationErrorBoundary extends Component<
  D3VisualizationErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: D3VisualizationErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Update state when an error occurs
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Handle errors with custom logging
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error(
      `D3 Visualization Error (${this.props?.componentName}):`,
      error,
      errorInfo,
      this.props?.errorContext
    );

    // Call custom error handler if provided
    if (this.props?.onError) {
      this.props?.onError(error, errorInfo, this.props?.componentName);
    }
  }

  /**
   * Reset error state when reset keys change
   */
  componentDidUpdate(prevProps: D3VisualizationErrorBoundaryProps): void {
    if (
      this.state.hasError &&
      this.props?.resetKeys &&
      Array.isArray(this.props?.resetKeys) &&
      prevProps.resetKeys !== this.props?.resetKeys &&
      this.haveDifferentValues(prevProps.resetKeys, this.props?.resetKeys)
    ) {
      this.resetErrorState();
    }
  }

  /**
   * Reset the error state
   */
  resetErrorState = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  /**
   * Check if two arrays have different values
   */
  haveDifferentValues(a?: unknown[], b?: unknown[]): boolean {
    if (!a || !b || a.length !== b.length) return true;

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return true;
    }

    return false;
  }

  render(): ReactNode {
    const { hasError, error } = this.state;
    const {
      children,
      componentName,
      FallbackComponent = DefaultErrorFallback,
      errorContext,
    } = this.props;

    if (hasError && error) {
      return (
        <FallbackComponent
          error={error}
          componentName={componentName}
          resetError={this.resetErrorState}
          errorContext={errorContext}
        />
      );
    }

    return children;
  }
}

/**
 * Create a typed error boundary for a specific visualization component
 *
 * @param Component The React component to wrap with an error boundary
 * @param componentName Name of the visualization component for error reporting
 * @param FallbackComponent Custom fallback component
 * @param onError Custom error handler
 * @returns A typed error boundary component
 */
export function createTypedErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  FallbackComponent?: React.ComponentType<ErrorFallbackProps>,
  onError?: (error: Error, errorInfo: ErrorInfo, componentName: string) => void
): React.FC<P & { errorContext?: Record<string, unknown>; resetKeys?: unknown[] }> {
  return (props: P & { errorContext?: Record<string, unknown>; resetKeys?: unknown[] }) => {
    const { errorContext, resetKeys, ...componentProps } = props;

    return (
      <D3VisualizationErrorBoundary
        componentName={componentName}
        FallbackComponent={FallbackComponent}
        onError={onError}
        errorContext={errorContext}
        resetKeys={resetKeys}
      >
        <Component {...(componentProps as P)} />
      </D3VisualizationErrorBoundary>
    );
  };
}

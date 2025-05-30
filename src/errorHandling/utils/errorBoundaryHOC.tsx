import * as React from 'react';
import { ComponentType, ErrorInfo } from 'react';
import { ErrorBoundary, ErrorBoundaryProps } from '../ErrorBoundary';

/**
 * Props for the fallback component created by createTypedErrorBoundary
 */
export interface TypedErrorFallbackProps {
  /** The error that occurred */
  error: Error;
  /** Component name for error reporting */
  componentName: string;
  /** (...args: unknown[]) => unknown to reset the error boundary */
  resetError: () => void;
  /** Additional error context information */
  errorContext?: Record<string, unknown>;
}

/**
 * Default fallback component for typed error boundaries
 */
export const TypedErrorFallback: React.FC<TypedErrorFallbackProps> = ({
  error,
  componentName,
  resetError,
  errorContext,
}) => (
  <div className="rounded border border-red-300 bg-red-50 p-4 text-red-800">
    <h3 className="mb-2 font-semibold">Error in {componentName}</h3>
    <p className="mb-2">An error occurred while rendering the {componentName} component:</p>
    <pre className="mb-3 overflow-auto rounded bg-red-100 p-2 text-sm">{error.message}</pre>
    {errorContext && (
      <div className="mb-3">
        <h4 className="mb-1 font-medium">Error Context:</h4>
        <pre className="overflow-auto rounded bg-red-100 p-2 text-xs">
          {JSON.stringify(errorContext, null, 2)}
        </pre>
      </div>
    )}
    <button
      onClick={resetError}
      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      Reset Component
    </button>
  </div>
);

/**
 * Create a typed error boundary for a specific component type
 *
 * This function wraps a component with an error boundary that is specifically
 * typed for that component's props, providing a clean way to create "safe"
 * versions of components.
 *
 * @param Component The React component to wrap with an error boundary
 * @param componentName Name of the component for error reporting
 * @param FallbackComponent Custom fallback component
 * @param onError Custom error handler function
 * @returns A wrapped component with an error boundary
 */
export function createTypedErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  componentName: string,
  FallbackComponent?: React.ComponentType<TypedErrorFallbackProps>,
  onError?: (error: Error, errorInfo: ErrorInfo, componentName: string) => void
): React.FC<P & { errorContext?: Record<string, unknown>; resetKeys?: unknown[] }> {
  return (props: P & { errorContext?: Record<string, unknown>; resetKeys?: unknown[] }) => {
    const { errorContext, resetKeys, ...componentProps } = props;

    // Custom error handler that includes the component name
    const handleError = (error: Error, errorInfo: ErrorInfo) => {
      console.error(`Error in ${componentName}:`, error);
      console.error('Component Stack:', errorInfo.componentStack);

      if (onError) {
        onError(error, errorInfo, componentName);
      }
    };

    // Custom fallback UI that includes the component name
    const fallback = (error: Error, reset: () => void) => {
      const FallbackUI = FallbackComponent || TypedErrorFallback;

      return (
        <FallbackUI
          error={error}
          componentName={componentName}
          resetError={reset}
          errorContext={errorContext}
        />
      );
    };

    return (
      <ErrorBoundary
        fallback={fallback}
        onError={handleError}
        context={componentName}
        resetKeys={resetKeys}
        metadata={{
          componentName,
          ...errorContext,
        }}
      >
        <Component {...(componentProps as P)} />
      </ErrorBoundary>
    );
  };
}

/**
 * Options for the withErrorBoundary HOC
 */
export interface WithErrorBoundaryOptions extends Omit<ErrorBoundaryProps, 'children'> {
  /** Component name for error reporting */
  componentName?: string;
}

/**
 * Higher-order component that wraps a component with an error boundary
 *
 * This is a more flexible alternative to createTypedErrorBoundary that allows
 * passing unknown ErrorBoundary props?.
 *
 * @param Component The component to wrap
 * @param options Options for the error boundary
 * @returns A wrapped component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): React.FC<P> {
  const {
    componentName = Component.displayName || Component.name || 'UnknownComponent',
    ...errorBoundaryProps
  } = options;

  // Set a display name for the wrapped component
  const wrappedComponentName = `WithErrorBoundary(${componentName})`;

  const WrappedComponent: React.FC<P> = props => {
    return (
      <ErrorBoundary context={componentName} {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  // Set display name for better debugging
  WrappedComponent.displayName = wrappedComponentName;

  return WrappedComponent;
}

/**
 * Creates a record of "safe" components by wrapping each component in
 * an error boundary, creating a new record of "safe" components.
 *
 * @param components Record of components to wrap
 * @param getOptions Function to generate options for each component
 * @returns Record of wrapped components
 */
export function createSafeComponents<T extends Record<string, ComponentType<object>>>(
  components: T,
  getOptions?: (key: string, Component: ComponentType<object>) => WithErrorBoundaryOptions
): { [K in keyof T]: React.FC<React.ComponentProps<T[K]>> } {
  const safeComponents = {} as { [K in keyof T]: React.FC<React.ComponentProps<T[K]>> };

  for (const key in components) {
    const Component = components[key];
    const options = getOptions ? getOptions(key, Component) : { componentName: key as string };

    safeComponents[key] = withErrorBoundary(Component, options);
  }

  return safeComponents;
}

/**
 * Create specialized versions of error boundaries
 *
 * This utility function creates a specialized error boundary component
 * for specific contexts or use cases.
 *
 * @param defaultProps Default props to apply to the error boundary
 * @returns A specialized error boundary component
 */
export function createSpecializedErrorBoundary(
  defaultProps: Omit<ErrorBoundaryProps, 'children'>
): React.FC<ErrorBoundaryProps> {
  const SpecializedErrorBoundary: React.FC<ErrorBoundaryProps> = props => {
    return (
      <ErrorBoundary
        {...defaultProps}
        {...props}
        metadata={{
          ...defaultProps.metadata,
          ...props?.metadata,
        }}
      />
    );
  };

  return SpecializedErrorBoundary;
}

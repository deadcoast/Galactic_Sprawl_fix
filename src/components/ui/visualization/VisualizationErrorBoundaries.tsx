import * as React from 'react';
import { ErrorInfo } from 'react';
import ResourceDistributionChart from '../../exploration/visualizations/ResourceDistributionChart';
import {
  createTypedErrorBoundary,
  D3VisualizationErrorBoundary,
  ErrorFallbackProps,
} from './D3VisualizationErrorBoundary';
import FlowDiagram from './FlowDiagram';
import TemporalAnalysisView from './TemporalAnalysisView';

/**
 * Custom error fallback for flow diagram
 */
const FlowDiagramErrorFallback: React.FC<ErrorFallbackProps> = props => (
  <div className="error-container rounded border border-orange-500 bg-orange-50 p-4">
    <h3 className="mb-2 text-lg font-semibold">Flow Diagram Error</h3>
    <p className="mb-2">
      An error occurred while rendering the flow diagram. This is likely due to invalid data or a
      rendering issue.
    </p>
    <pre className="mb-3 overflow-auto rounded bg-orange-100 p-2 text-sm">
      {props?.error.message}
    </pre>
    <div className="flex flex-row gap-3">
      <button
        onClick={props?.resetError}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Reset Diagram
      </button>
      <button
        onClick={() => window.location.reload()}
        className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
      >
        Reload Page
      </button>
    </div>
  </div>
);

/**
 * Custom error logging for visualizations
 */
const handleVisualizationError = (
  error: Error,
  errorInfo: ErrorInfo,
  componentName: string
): void => {
  // You could log to your error monitoring service here
  console.error(`Visualization Error in ${componentName}:`, error);
  console.error('Component Stack:', errorInfo.componentStack);

  // Example of sending to a monitoring service (commented out)
  /*
  if (window.errorMonitor) {
    window.errorMonitor.captureError(error, {
      tags: { component: componentName },
      extra: { componentStack: errorInfo.componentStack }
    });
  }
  */
};

/**
 * Safe FlowDiagram component with error boundary
 */
export const SafeFlowDiagram = createTypedErrorBoundary(
  FlowDiagram,
  'FlowDiagram',
  FlowDiagramErrorFallback,
  handleVisualizationError
);

/**
 * Safe ResourceDistributionChart component with error boundary
 */
export const SafeResourceDistributionChart = createTypedErrorBoundary(
  ResourceDistributionChart,
  'ResourceDistributionChart',
  undefined, // Use default fallback
  handleVisualizationError
);

/**
 * Safe TemporalAnalysisView component with error boundary
 */
export const SafeTemporalAnalysisView = createTypedErrorBoundary(
  TemporalAnalysisView,
  'TemporalAnalysisView',
  undefined, // Use default fallback
  handleVisualizationError
);

/**
 * Wraps unknown D3 visualization component with an error boundary
 *
 * @param Component The component to wrap
 * @param componentName Name of the component for error reporting
 * @returns The component wrapped with an error boundary
 */
export function withVisualizationErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.FC<P & { errorContext?: Record<string, unknown>; resetKeys?: unknown[] }> {
  return (props: P & { errorContext?: Record<string, unknown>; resetKeys?: unknown[] }) => {
    return (
      <D3VisualizationErrorBoundary
        componentName={componentName}
        onError={handleVisualizationError}
        errorContext={props?.errorContext}
        resetKeys={props?.resetKeys}
      >
        <Component {...(props as P)} />
      </D3VisualizationErrorBoundary>
    );
  };
}

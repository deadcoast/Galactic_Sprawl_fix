import React from 'react';
import { ErrorBoundary, ErrorBoundaryProps } from '../ErrorBoundary';
import { ErrorFallback } from '../ErrorFallback';

/**
 * Props for the visualization error boundary
 */
export interface VisualizationErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'context'> {
  /** Whether to show a compact error UI */
  compact?: boolean;
  /** The visualization type for better error reporting */
  visualizationType?: 'chart' | 'graph' | 'map' | 'diagram' | 'table' | 'other';
  /** Data size, useful for debugging performance issues */
  dataSize?: number;
  /** Additional visualization metadata */
  visualizationMetadata?: Record<string, unknown>;
}

/**
 * Specialized error boundary for visualization components
 * 
 * This error boundary is designed specifically for visualization components
 * like charts, graphs, maps, etc. It provides specialized error handling and
 * fallback UIs for visualization-specific errors.
 */
export const VisualizationErrorBoundary: React.FC<VisualizationErrorBoundaryProps> = ({
  children,
  fallback,
  compact = false,
  visualizationType = 'other',
  dataSize,
  visualizationMetadata,
  onError,
  suppressErrorLogging,
  metadata,
  ...props
}) => {
  // Combine visualization-specific metadata with general metadata
  const combinedMetadata = {
    visualizationType,
    ...(dataSize !== undefined && { dataSize }),
    ...visualizationMetadata,
    ...metadata,
  };

  // Custom fallback UI specific to visualizations
  const visualizationFallback = (error: Error, reset: () => void) => {
    // If a custom fallback is provided, use that
    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback(error, reset);
      }
      return fallback;
    }
    
    // Otherwise, use a specialized fallback for visualizations
    if (compact) {
      return (
        <div className="p-3 bg-gray-100 border border-gray-300 rounded text-sm text-gray-700 flex flex-col items-center justify-center h-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-500 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
          <p className="mb-2 text-center">Visualization Error</p>
          <button
            onClick={reset}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reset
          </button>
        </div>
      );
    }
    
    return (
      <ErrorFallback
        error={error}
        resetErrorBoundary={reset}
        title="Visualization Error"
        showDetails={process.env.NODE_ENV !== 'production'}
        actionText="Show Default View"
        onAction={() => {
          // This could switch to a simpler view or load simplified data
          console.log('Switching to default view');
          reset();
        }}
      />
    );
  };

  return (
    <ErrorBoundary
      fallback={visualizationFallback}
      context="Visualization"
      onError={onError}
      suppressErrorLogging={suppressErrorLogging}
      metadata={combinedMetadata}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
};

export default VisualizationErrorBoundary;
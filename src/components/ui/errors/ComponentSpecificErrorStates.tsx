/**
 * @context: ui-system, ui-error-handling, component-library
 *
 * ComponentSpecificErrorStates - Implementation of error states for specific UI components
 * These can be used as fallback UI for specific component types
 */

import * as React from 'react';
import { useCallback, useState } from 'react';
import
  {
    ErrorSeverity,
    ErrorType
  } from '../../../services/logging/ErrorLoggingService';
import
  {
    ComponentErrorState,
    DataFetchErrorState,
    VisualizationErrorState,
  } from './ComponentErrorState';
import { ErrorBoundary } from './ErrorBoundary';

// Error state for the Chart component
export interface ChartErrorProps {
  /** Width of the chart area */
  width?: number | string;

  /** Height of the chart area */
  height?: number | string;

  /** Chart title or label */
  title?: string;

  /** Function to retry loading chart data */
  onRetry?: () => void;

  /** Original error that caused the failure */
  error?: Error;

  /** Additional class name */
  className?: string;
}

export const ChartErrorState: React.FC<ChartErrorProps> = ({
  width = '100%',
  height = '300px',
  title = 'Chart',
  onRetry,
  error,
  className = '',
}) => {
  return (
    <VisualizationErrorState
      message={`Unable to display ${title}`}
      details={error?.message}
      onRetry={onRetry}
      height={height}
      className={`chart-error ${className}`}
    />
  );
};

// Error state for the ResourceDisplay component
export interface ResourceDisplayErrorProps {
  /** Resource type that failed to load */
  resourceType?: string;

  /** Function to retry loading resource data */
  onRetry?: () => void;

  /** Original error that caused the failure */
  error?: Error;

  /** Whether to show in compact mode */
  compact?: boolean;

  /** Additional class name */
  className?: string;
}

export const ResourceDisplayErrorState: React.FC<ResourceDisplayErrorProps> = ({
  resourceType = 'Resource',
  onRetry,
  error,
  compact = false,
  className = '',
}) => {
  return (
    <DataFetchErrorState
      message={`Unable to load ${resourceType} data`}
      details={error?.message}
      onRetry={onRetry}
      className={`resource-display-error ${compact ? 'compact' : ''} ${className}`}
    />
  );
};

// Error state for the ModuleCard component
export interface ModuleCardErrorProps {
  /** Module name or ID */
  moduleName?: string;

  /** Function to retry loading module data */
  onRetry?: () => void;

  /** Original error */
  error?: Error;

  /** Additional class name */
  className?: string;
}

export const ModuleCardErrorState: React.FC<ModuleCardErrorProps> = ({
  moduleName = 'Module',
  onRetry,
  error,
  className = '',
}) => {
  return (
    <ComponentErrorState
      message={`Unable to display ${moduleName}`}
      error={error}
      level="medium"
      onRetry={onRetry}
      compact={true}
      className={`module-card-error ${className}`}
    />
  );
};

// Example of a component that handles its own error states
export interface ResourceGraphProps {
  /** Resource data to display */
  data: { timestamp: number; value: number }[];

  /** Whether data is loading */
  isLoading?: boolean;

  /** Error, if unknownnown */
  error?: Error | null;

  /** Width of the graph */
  width?: number | string;

  /** Height of the graph */
  height?: number | string;

  /** Resource name */
  resourceName?: string;

  /** Function to retry data loading */
  onRetry?: () => void;

  /** Additional class name */
  className?: string;
}

export const ResourceGraph: React.FC<ResourceGraphProps> = ({
  data,
  isLoading = false,
  error = null,
  width = '100%',
  height = '250px',
  resourceName = 'Resource',
  onRetry,
  className = '',
}) => {
  // Handle different states with appropriate UI
  if (isLoading) {
    return (
      <div className={`resource-graph-loading ${className}`} style={{ width, height }}>
        <div className="loading-spinner"></div>
        <p>Loading {resourceName} graph...</p>
      </div>
    );
  }

  if (error) {
    return (
      <ChartErrorState
        width={width}
        height={height}
        title={`${resourceName} Graph`}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`resource-graph-empty ${className}`} style={{ width, height }}>
        <p>No {resourceName} data available</p>
      </div>
    );
  }

  // Render the actual graph (simplified for example)
  return (
    <div className={`resource-graph ${className}`} style={{ width, height }}>
      {/* Graph implementation would go here */}
      <div className="graph-container">
        {data.map((point, index) => (
          <div
            key={index}
            className="graph-point"
            style={{
              left: `${(index / (data.length - 1)) * 100}%`,
              bottom: `${(point.value / Math.max(...data.map(d => d.value))) * 80}%`,
            }}
          />
        ))}
      </div>
      <div className="graph-legend">
        <span>{resourceName} Trend</span>
        <span>
          Last updated: {new Date(data[data.length - 1]?.timestamp || 0).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

// Example of a component wrapped with an ErrorBoundary
export const ResourceGraphWithErrorBoundary: React.FC<ResourceGraphProps> = props => {
  return (
    <ErrorBoundary
      componentName="ResourceGraph"
      errorType={ErrorType.RUNTIME}
      errorSeverity={ErrorSeverity.MEDIUM}
      fallback={({ error, resetErrorBoundary }) => (
        <ChartErrorState
          width={props.width}
          height={props.height}
          title={`${props.resourceName} Graph`}
          error={error}
          onRetry={resetErrorBoundary}
        />
      )}
    >
      <ResourceGraph {...props} />
    </ErrorBoundary>
  );
};

// Example usage with a multi-component UI
export const ResourcePanel: React.FC<{
  resourceId: string;
  resourceName: string;
}> = ({ resourceId, resourceName }) => {
  // Simulated data and states
  const [data, setData] = useState<{ timestamp: number; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(() => {
    setIsLoading(true);
    setError(null);

    // Simulated API call
    setTimeout(() => {
      try {
        // Randomly succeed or fail for demonstration
        if (Math.random() > 0.7) {
          throw new Error('Failed to fetch resource data');
        }

        // Generate mock data on success
        const mockData = Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (23 - i) * 3600000,
          value: Math.floor(Math.random() * 100),
        }));

        setData(mockData);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }, 1000);
  }, []);

  // Load data on mount
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="resource-panel">
      <h3>{resourceName} Usage</h3>

      <ResourceGraphWithErrorBoundary
        data={data}
        isLoading={isLoading}
        error={error}
        resourceName={resourceName}
        onRetry={loadData}
      />

      <div className="resource-stats">
        {error ? (
          <ResourceDisplayErrorState
            resourceType={resourceName}
            error={error}
            onRetry={loadData}
            compact={true}
          />
        ) : isLoading ? (
          <p>Loading stats...</p>
        ) : (
          <>
            <div className="stat-item">
              <span className="stat-label">Current</span>
              <span className="stat-value">{data[data.length - 1]?.value || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average</span>
              <span className="stat-value">
                {data.length
                  ? Math.round(data.reduce((sum, point) => sum + point.value, 0) / data.length)
                  : 0}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Peak</span>
              <span className="stat-value">
                {data.length ? Math.max(...data.map(d => d.value)) : 0}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

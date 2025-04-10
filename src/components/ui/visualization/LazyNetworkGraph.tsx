/**
 * @context: ui-system, visualization-system, performance-optimization
 * 
 * LazyNetworkGraph - A lazy-loaded version of the NetworkGraph component
 * This component only loads the actual visualization when needed, reducing the initial bundle size
 */

import React from 'react';
import { ErrorSeverity, ErrorType } from '../../../services/ErrorLoggingService';
import { useLazyComponent } from '../../../utils/performance/ComponentOptimizer';
import { ErrorBoundary } from '../errors/ErrorBoundary';
import { NetworkGraphProps } from './NetworkGraph';

// Loading placeholder component
const LoadingPlaceholder = () => (
  <div className="network-graph-loading">
    <div className="loading-spinner"></div>
    <p>Loading network visualization...</p>
  </div>
);

// Error component
const ErrorDisplay = () => (
  <div className="network-graph-error">
    <p>Failed to load network visualization.</p>
    <button className="retry-button">Retry</button>
  </div>
);

/**
 * LazyNetworkGraph component
 * Lazily loads the actual NetworkGraph component only when needed
 */
export function LazyNetworkGraph(props: NetworkGraphProps) {
  // Use the useLazyComponent hook to dynamically import the component
  const { Component, loading, error } = useLazyComponent<NetworkGraphProps>(
    () => import('./NetworkGraph').then(module => ({ default: module.NetworkGraph })),
    []
  );
  
  // Show loading state
  if (loading) {
    return <LoadingPlaceholder />;
  }
  
  // Show error state
  if (error || !Component) {
    return <ErrorDisplay />;
  }
  
  // Render the actual component within an error boundary
  return (
    <ErrorBoundary
      componentName="NetworkGraph"
      errorType={ErrorType.RUNTIME}
      errorSeverity={ErrorSeverity.MEDIUM}
      metadata={{ nodeCount: props.nodes.length, edgeCount: props.edges.length }}
    >
      <Component {...props} />
    </ErrorBoundary>
  );
}

// Export a memoized version of the component
export default React.memo(LazyNetworkGraph); 
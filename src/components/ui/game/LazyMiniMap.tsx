/**
 * @context: ui-system, game-system, performance-optimization
 *
 * LazyMiniMap - A lazy-loaded version of the MiniMap component
 * This component only loads the actual map when needed, reducing the initial bundle size
 */

import React from 'react';
import { ErrorSeverity, ErrorType } from '../../../services/ErrorLoggingService';
import { useLazyComponent } from '../../../utils/performance/ComponentOptimizer';
import { ErrorBoundary } from '../errors/ErrorBoundary';
import { MiniMapStar, ViewportConfig } from './MiniMap';

// Interface for MiniMapProps
export interface MiniMapProps {
  stars: MiniMapStar[];
  viewport: ViewportConfig;
  interactive?: boolean;
  width?: number;
  height?: number;
  onViewportChange?: (viewport: ViewportConfig) => void;
  onStarSelected?: (starId: string) => void;
  playerPosition?: { x: number; y: number };
  className?: string;
}

// Loading placeholder component
const LoadingPlaceholder = () => (
  <div className="mini-map-loading">
    <div className="loading-spinner"></div>
    <p>Loading map...</p>
  </div>
);

// Error component
const ErrorDisplay = () => (
  <div className="mini-map-error">
    <p>Failed to load map.</p>
    <button className="retry-button">Retry</button>
  </div>
);

/**
 * LazyMiniMap component
 * Lazily loads the actual MiniMap component only when needed
 */
export function LazyMiniMap(props: MiniMapProps) {
  // Use the useLazyComponent hook to dynamically import the component
  const { Component, loading, error } = useLazyComponent<MiniMapProps>(
    () => import('./MiniMap').then(module => ({ default: module.MiniMap })),
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
      componentName="MiniMap"
      errorType={ErrorType.RUNTIME}
      errorSeverity={ErrorSeverity.MEDIUM}
      metadata={{ starCount: props.stars?.length }}
    >
      <Component {...props} />
    </ErrorBoundary>
  );
}

// Export a memoized version of the component
export default React.memo(LazyMiniMap);

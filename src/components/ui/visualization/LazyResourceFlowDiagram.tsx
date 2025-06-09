/**
 * @context: ui-system, visualization-system, performance-optimization
 *
 * LazyResourceFlowDiagram - A lazy-loaded version of the ResourceFlowDiagram component
 * This component only loads the actual visualization when needed, reducing the initial bundle size
 */

import React from 'react';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../../services/logging/ErrorLoggingService';
import { FlowNodeType } from '../../../types/resources/FlowNodeTypes';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { useLazyComponent } from '../../../utils/performance/ComponentOptimizer';
import { ErrorBoundary } from '../errors/ErrorBoundary';

// Define ResourceFlowNode type to match the actual component
export interface ResourceFlowNode {
  id: string;
  name: string;
  type: FlowNodeType;
  resources?: ResourceType[];
  capacity?: number;
  currentLoad?: number;
  efficiency?: number;
  status?: 'active' | 'inactive' | 'maintenance' | 'error';
  position?: { x: number; y: number };
  metadata?: Record<string, string | number | boolean>;
}

// Define ResourceFlowConnection type
export interface ResourceFlowConnection {
  id: string;
  source: string;
  target: string;
  resourceTypes: ResourceType[];
  maxFlow?: number;
  currentFlow?: number;
  priority?: number;
  active?: boolean;
  metadata?: Record<string, string | number | boolean>;
}

// Loading placeholder component
const LoadingPlaceholder = () => (
  <div className="resource-flow-diagram-loading">
    <div className="loading-spinner"></div>
    <p>Loading resource flow visualization...</p>
  </div>
);

// Error component
const ErrorDisplay = () => (
  <div className="resource-flow-diagram-error">
    <p>Failed to load resource flow visualization.</p>
    <button className="retry-button">Retry</button>
  </div>
);

// Props interface shared with the real component
export interface ResourceFlowDiagramProps {
  /**
   * Resource flow nodes
   */
  nodes: ResourceFlowNode[];

  /**
   * Resource flow connections
   */
  connections: ResourceFlowConnection[];

  /**
   * Width of the diagram in pixels
   * @default 800
   */
  width?: number;

  /**
   * Height of the diagram in pixels
   * @default 600
   */
  height?: number;

  /**
   * Whether to show detailed tooltips on nodes
   * @default true
   */
  showTooltips?: boolean;

  /**
   * Whether to animate state transitions
   * @default true
   */
  animated?: boolean;

  /**
   * ID of the module to focus on (if unknownnown)
   */
  focusModuleId?: string;

  /**
   * Whether to show the legend
   * @default true
   */
  showLegend?: boolean;

  /**
   * Callback when a node is clicked
   */
  onNodeClick?: (node: ResourceFlowNode) => void;

  /**
   * Additional class name
   */
  className?: string;
}

/**
 * LazyResourceFlowDiagram component
 * Lazily loads the actual ResourceFlowDiagram component only when needed
 */
export function LazyResourceFlowDiagram(props: ResourceFlowDiagramProps) {
  // Use the useLazyComponent hook to dynamically import the component
  const { Component, loading, error } = useLazyComponent<ResourceFlowDiagramProps>(
    () =>
      import('./ResourceFlowDiagram').then(module => ({
        default: (componentProps: ResourceFlowDiagramProps) => (
          <module.ResourceFlowDiagram {...componentProps} />
        ),
      })),
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
      componentName="ResourceFlowDiagram"
      errorType={ErrorType.RUNTIME}
      errorSeverity={ErrorSeverity.MEDIUM}
      metadata={{ resourceCount: props.nodes.length }}
    >
      <Component {...props} />
    </ErrorBoundary>
  );
}

// Export a memoized version of the component
export default React.memo(LazyResourceFlowDiagram);

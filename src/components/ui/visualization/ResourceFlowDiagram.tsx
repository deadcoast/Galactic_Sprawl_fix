/**
 * @context: ui-system, component-library, visualization-system, resource-system, performance-optimization
 * 
 * ResourceFlowDiagram component for visualizing resource flow between nodes
 */
import { memo, useCallback, useMemo, useState } from 'react';
import { FlowNodeType } from '../../../types/resources/FlowNodeTypes';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { createPropsComparison, useRenderPerformance } from '../../../utils/performance/ComponentOptimizer';
import { NetworkEdge, NetworkGraph, NetworkNode } from './NetworkGraph';

// Resource flow node interface
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

// Resource flow connection interface
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

// ResourceFlowDiagram props
export interface ResourceFlowDiagramProps extends Record<string, unknown> {
  /**
   * Resource flow nodes
   */
  nodes: ResourceFlowNode[];
  
  /**
   * Resource flow connections
   */
  connections: ResourceFlowConnection[];
  
  /**
   * Width of the diagram
   * @default 800
   */
  width?: number;
  
  /**
   * Height of the diagram
   * @default 600
   */
  height?: number;
  
  /**
   * Whether the diagram is interactive
   * @default true
   */
  interactive?: boolean;
  
  /**
   * Selected resource types to highlight
   */
  selectedResourceTypes?: ResourceType[];
  
  /**
   * Node click handler
   */
  onNodeClick?: (node: ResourceFlowNode) => void;
  
  /**
   * Connection click handler
   */
  onConnectionClick?: (connection: ResourceFlowConnection) => void;
  
  /**
   * Whether to show node details
   * @default true
   */
  showNodeDetails?: boolean;
  
  /**
   * Whether to show resource icons on connections
   * @default true
   */
  showResourceIcons?: boolean;
  
  /**
   * Whether to animate the flow
   * @default true
   */
  animateFlow?: boolean;
  
  /**
   * Custom class name
   */
  className?: string;
}

/**
 * ResourceFlowDiagram component for visualizing the flow of resources between nodes
 * 
 * This component is optimized for performance with:
 * - Memoized internal data transformations
 * - Optimized render cycles using React.memo
 * - Performance tracking for large diagrams
 */
export const ResourceFlowDiagram = memo(function ResourceFlowDiagram({
  nodes,
  connections,
  width = 800,
  height = 600,
  interactive = true,
  selectedResourceTypes,
  onNodeClick,
  onConnectionClick,
  showNodeDetails = true,
  showResourceIcons = true,
  animateFlow = true,
  className = ''
}: ResourceFlowDiagramProps) {
  // Track render performance for large diagrams
  useRenderPerformance('ResourceFlowDiagram', 10);
  
  // Component state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  
  // Find the selected node
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) {
      return null;
    }
    return nodes.find(node => node.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);
  
  // Memoize network nodes to prevent unnecessary recalculations
  const networkNodes = useMemo(() => {
    return nodes.map(node => {
      // Apply highlighting based on selection
      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNodeId;
      
      // Apply filtering based on selected resource types
      const isFiltered = selectedResourceTypes && selectedResourceTypes.length > 0 && 
        (!node.resources || !node.resources.some(r => selectedResourceTypes.includes(r)));
      
      // Calculate node size based on capacity and current load
      const size = node.capacity ? Math.max(30, Math.min(60, 30 + (node.capacity / 100) * 30)) : 40;
      
      // Determine node color based on type and status
      let color = '#999999';
      switch (node.type) {
        case FlowNodeType.PRODUCER:
          color = '#4CAF50'; // Green
          break;
        case FlowNodeType.CONSUMER:
          color = '#F44336'; // Red
          break;
        case FlowNodeType.STORAGE:
          color = '#2196F3'; // Blue
          break;
        case FlowNodeType.CONVERTER:
          color = '#FF9800'; // Orange
          break;
        case FlowNodeType.MULTIPLEXER:
          color = '#9C27B0'; // Purple
          break;
      }
      
      // Adjust color based on status if available
      if (node.status === 'inactive') {
        color = '#9E9E9E'; // Grey
      } else if (node.status === 'error') {
        color = '#F44336'; // Red
      } else if (node.status === 'maintenance') {
        color = '#FFC107'; // Amber
      }
      
      // Create node with data as Record<string, unknown> to match NetworkNode type
      return {
        id: node.id,
        label: node.name,
        size,
        color,
        highlighted: isSelected || isHovered,
        faded: isFiltered,
        // Convert ResourceFlowNode to Record<string, unknown> to satisfy NetworkNode type
        data: node as unknown as Record<string, unknown>
      };
    });
  }, [nodes, selectedNodeId, hoveredNodeId, selectedResourceTypes]);
  
  // Memoize network edges to prevent unnecessary recalculations
  const networkEdges = useMemo(() => {
    return connections.map(connection => {
      // Apply highlighting based on selection
      const isHovered = connection.id === hoveredConnectionId;
      
      // Apply filtering based on selected resource types
      const isFiltered = selectedResourceTypes && selectedResourceTypes.length > 0 && 
        !connection.resourceTypes.some(r => selectedResourceTypes.includes(r));
      
      // Determine line width based on flow amount
      const width = connection.maxFlow 
        ? Math.max(1, Math.min(5, 1 + (connection.currentFlow || 0) / connection.maxFlow * 4))
        : 2;
      
      // Determine color based on resource types
      let color = '#999999';
      if (connection.resourceTypes.length === 1) {
        switch (connection.resourceTypes[0]) {
          case ResourceType.ENERGY:
            color = '#FFC107'; // Amber
            break;
          case ResourceType.MINERALS:
            color = '#8BC34A'; // Light green
            break;
          case ResourceType.WATER:
            color = '#03A9F4'; // Light blue
            break;
          case ResourceType.FOOD:
            color = '#4CAF50'; // Green
            break;
          case ResourceType.PLASMA:
            color = '#E91E63'; // Pink
            break;
          case ResourceType.GAS:
            color = '#00BCD4'; // Cyan
            break;
          default:
            color = '#9E9E9E'; // Grey
        }
      } else if (connection.resourceTypes.length > 1) {
        color = '#673AB7'; // Deep purple for mixed resources
      }
      
      // Adjust color if connection is inactive
      if (connection.active === false) {
        color = '#9E9E9E'; // Grey for inactive connections
      }
      
      // Add resource icons when showResourceIcons is enabled
      const label = showResourceIcons && connection.resourceTypes.length > 0
        ? connection.resourceTypes
            .slice(0, 3) // Limit to 3 icons to avoid clutter
            .map(type => getResourceEmoji(type))
            .join(' ')
        : '';
      
      // Create edge with data as Record<string, unknown> to match NetworkEdge type
      return {
        id: connection.id,
        source: connection.source,
        target: connection.target,
        width,
        color,
        highlighted: isHovered,
        faded: isFiltered,
        animated: animateFlow,
        label,
        // Convert ResourceFlowConnection to Record<string, unknown> to satisfy NetworkEdge type
        data: connection as unknown as Record<string, unknown>
      };
    });
  }, [connections, hoveredConnectionId, selectedResourceTypes, animateFlow, showResourceIcons]);
  
  // Get emoji representation for resource types
  const getResourceEmoji = useCallback((resourceType: ResourceType): string => {
    switch (resourceType) {
      case ResourceType.ENERGY:
        return '⚡'; // Energy emoji
      case ResourceType.MINERALS:
        return '⛏️'; // Mining emoji
      case ResourceType.WATER:
        return '💧'; // Water emoji
      case ResourceType.FOOD:
        return '🍲'; // Food emoji
      case ResourceType.PLASMA:
        return '🔆'; // Plasma emoji
      case ResourceType.GAS:
        return '☁️'; // Gas emoji
      default:
        return '📦'; // Default resource emoji
    }
  }, []);
  
  // Handle node click
  const handleNodeClick = useCallback((node: NetworkNode) => {
    setSelectedNodeId(prev => prev === node.id ? null : node.id);
    
    if (onNodeClick && node.data) {
      // Cast the data back to ResourceFlowNode
      onNodeClick(node.data as unknown as ResourceFlowNode);
    }
  }, [onNodeClick]);
  
  // Handle edge click
  const handleEdgeClick = useCallback((edge: NetworkEdge) => {
    if (onConnectionClick && edge.data) {
      // Cast the data back to ResourceFlowConnection
      onConnectionClick(edge.data as unknown as ResourceFlowConnection);
    }
  }, [onConnectionClick]);
  
  // Handle node hover
  const handleNodeHover = useCallback((node: NetworkNode | null) => {
    setHoveredNodeId(node ? node.id : null);
  }, []);
  
  // Handle edge hover
  const handleEdgeHover = useCallback((edge: NetworkEdge | null) => {
    setHoveredConnectionId(edge ? edge.id : null);
  }, []);
  
  // Handle node detail close
  const handleCloseDetails = useCallback(() => {
    setSelectedNodeId(null);
  }, []);
  
  return (
    <div className={`resource-flow-diagram ${className}`} style={{ position: 'relative' }}>
      <NetworkGraph
        nodes={networkNodes}
        edges={networkEdges}
        width={width}
        height={height}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeHover={handleNodeHover}
        onEdgeHover={handleEdgeHover}
        interactive={interactive}
      />
      
      {selectedNode && showNodeDetails && (
        <NodeDetailsPanel node={selectedNode} onClose={handleCloseDetails} />
      )}
    </div>
  );
}, createPropsComparison<ResourceFlowDiagramProps>({
  componentName: 'ResourceFlowDiagram',
  trackRenders: true,
  logPerformance: true,
  propsAreEqual: (prevProps, nextProps) => {
    // Compare basic properties
    if (
      prevProps.width !== nextProps.width ||
      prevProps.height !== nextProps.height ||
      prevProps.interactive !== nextProps.interactive ||
      prevProps.showNodeDetails !== nextProps.showNodeDetails ||
      prevProps.animateFlow !== nextProps.animateFlow
    ) {
      return false;
    }
    
    // Compare node arrays
    if (!prevProps.nodes || !nextProps.nodes) {
      return prevProps.nodes === nextProps.nodes;
    }
    
    if (Array.isArray(prevProps.nodes) && Array.isArray(nextProps.nodes) && prevProps.nodes.length !== nextProps.nodes.length) {
          return false;
    }
    
    // Compare connection arrays
    if (!prevProps.connections || !nextProps.connections) {
      return prevProps.connections === nextProps.connections;
    }
    
    if (Array.isArray(prevProps.connections) && Array.isArray(nextProps.connections) && prevProps.connections.length !== nextProps.connections.length) {
          return false;
    }
    
    // Compare selectedResourceTypes
    if (
      (prevProps.selectedResourceTypes && !nextProps.selectedResourceTypes) ||
      (!prevProps.selectedResourceTypes && nextProps.selectedResourceTypes)
    ) {
      return false;
    }
    
    if (
      Array.isArray(prevProps.selectedResourceTypes) && 
      Array.isArray(nextProps.selectedResourceTypes) &&
      prevProps.selectedResourceTypes.length !== nextProps.selectedResourceTypes.length
    ) {
      return false;
    }
    
    if (
      Array.isArray(prevProps.selectedResourceTypes) && 
      Array.isArray(nextProps.selectedResourceTypes)
    ) {
      for (let i = 0; i < prevProps.selectedResourceTypes.length; i++) {
        if (prevProps.selectedResourceTypes[i] !== nextProps.selectedResourceTypes[i]) {
          return false;
        }
      }
    }
    
    // Objects are equal if we made it this far
    return true;
  }
}));

interface NodeDetailsPanelProps {
  node: ResourceFlowNode;
  onClose: () => void;
}

const NodeDetailsPanel = memo(function NodeDetailsPanel({ node, onClose }: NodeDetailsPanelProps) {
  // Track render performance
  useRenderPerformance('NodeDetailsPanel');
  
  return (
    <div className="resource-flow-node-details">
      <div className="resource-flow-node-details-header">
        <h3>{node.name}</h3>
        <button className="resource-flow-node-details-close" onClick={onClose}>×</button>
      </div>
      
      <div className="resource-flow-node-details-content">
        <div className="resource-flow-node-details-section">
          <div className="resource-flow-node-details-row">
            <span className="resource-flow-node-details-label">Type:</span>
            <span className="resource-flow-node-details-value">{node.type}</span>
          </div>
          
          <div className="resource-flow-node-details-row">
            <span className="resource-flow-node-details-label">Status:</span>
            <span className="resource-flow-node-details-value">{node.status || 'Active'}</span>
          </div>
          
          {node.capacity !== undefined && (
            <div className="resource-flow-node-details-row">
              <span className="resource-flow-node-details-label">Capacity:</span>
              <span className="resource-flow-node-details-value">{node.capacity}</span>
            </div>
          )}
          
          {node.currentLoad !== undefined && (
            <div className="resource-flow-node-details-row">
              <span className="resource-flow-node-details-label">Current Load:</span>
              <span className="resource-flow-node-details-value">{node.currentLoad}</span>
            </div>
          )}
          
          {node.efficiency !== undefined && (
            <div className="resource-flow-node-details-row">
              <span className="resource-flow-node-details-label">Efficiency:</span>
              <span className="resource-flow-node-details-value">{node.efficiency}%</span>
            </div>
          )}
        </div>
        
        {node.resources && node.resources.length > 0 && (
          <div className="resource-flow-node-details-section">
            <h4>Resources</h4>
            <ul className="resource-flow-node-details-resources">
              {node.resources.map(resource => (
                <li key={resource} className="resource-flow-node-details-resource">
                  {resource}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {node.metadata && Object.keys(node.metadata).length > 0 && (
          <div className="resource-flow-node-details-section">
            <h4>Metadata</h4>
            {Object.entries(node.metadata).map(([key, value]) => (
              <div key={key} className="resource-flow-node-details-row">
                <span className="resource-flow-node-details-label">{key}:</span>
                <span className="resource-flow-node-details-value">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Create resource flow data from raw nodes and connections
 * 
 * This utility function adds default values and formats the data for the visualization component.
 * It's exported for use in other components that need to prepare data for this visualization.
 */
export function createResourceFlowData(
  nodes: ResourceFlowNode[],
  connections: ResourceFlowConnection[]
): { nodes: ResourceFlowNode[]; connections: ResourceFlowConnection[] } {
  // Process nodes to add default values where needed
  const processedNodes = nodes.map(node => ({
    ...node,
    status: node.status || 'active',
    capacity: node.capacity !== undefined ? node.capacity : 100,
    currentLoad: node.currentLoad !== undefined ? node.currentLoad : 0,
    efficiency: node.efficiency !== undefined ? node.efficiency : 100,
  }));
  
  // Process connections to ensure they reference valid nodes and have default values
  const processedConnections = connections.filter(conn => {
    // Ensure source and target nodes exist
    const sourceExists = nodes.some(node => node.id === conn.source);
    const targetExists = nodes.some(node => node.id === conn.target);
    return sourceExists && targetExists;
  }).map(conn => ({
    ...conn,
    maxFlow: conn.maxFlow !== undefined ? conn.maxFlow : 100,
    currentFlow: conn.currentFlow !== undefined ? conn.currentFlow : 50,
    active: conn.active !== undefined ? conn.active : true,
  }));
  
  return {
    nodes: processedNodes,
    connections: processedConnections,
  };
} 
/**
 * @context: ui-system, component-library, visualization-system
 *
 * NetworkGraph component for visualizing network relationships and connections
 */
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

// Network node interface
export interface NetworkNode {
  id: string;
  label: string;
  size?: number;
  color?: string;
  group?: string;
  position?: { x: number; y: number };
  fixed?: boolean;
  metadata?: Record<string, string | number | boolean>;
  data?: Record<string, unknown>; // Replace unknownnown with Record<string, unknown>
}

// Network edge/link interface
export interface NetworkEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  label?: string;
  width?: number;
  color?: string;
  bidirectional?: boolean;
  weight?: number;
  metadata?: Record<string, string | number | boolean>;
  data?: Record<string, unknown>; // Replace unknown with Record<string, unknown>
}

// NetworkGraph props
export interface NetworkGraphProps {
  /**
   * Nodes in the network
   */
  nodes: NetworkNode[];

  /**
   * Edges connecting nodes
   */
  edges: NetworkEdge[];

  /**
   * Width of the graph
   * @default 600
   */
  width?: number;

  /**
   * Height of the graph
   * @default 400
   */
  height?: number;

  /**
   * Whether the graph is interactive
   * @default true
   */
  interactive?: boolean;

  /**
   * Whether to apply physics simulation
   * @default true
   */
  physics?: boolean;

  /**
   * Strength of the physics simulation
   * @default 0.1
   */
  physicsStrength?: number;

  /**
   * Node click handler
   */
  onNodeClick?: (node: NetworkNode) => void;

  /**
   * Edge click handler
   */
  onEdgeClick?: (edge: NetworkEdge) => void;

  /**
   * Node hover handler
   */
  onNodeHover?: (node: NetworkNode | null) => void;

  /**
   * Edge hover handler
   */
  onEdgeHover?: (edge: NetworkEdge | null) => void;

  /**
   * Default node size
   * @default 10
   */
  defaultNodeSize?: number;

  /**
   * Default edge width
   * @default 1
   */
  defaultEdgeWidth?: number;

  /**
   * Node color mapping by group
   */
  nodeColorMap?: Record<string, string>;

  /**
   * Edge color mapping by type
   */
  edgeColorMap?: Record<string, string>;

  /**
   * Whether to show node labels
   * @default true
   */
  showNodeLabels?: boolean;

  /**
   * Whether to show edge labels
   * @default false
   */
  showEdgeLabels?: boolean;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Whether the graph is directed
   * @default false
   */
  directed?: boolean;
}

/**
 * NetworkGraph component for visualizing network relationships
 */
export function NetworkGraph({
  nodes,
  edges,
  width = 600,
  height = 400,
  interactive = true,
  physics = true,
  physicsStrength = 0.1,
  onNodeClick,
  onEdgeClick,
  onNodeHover,
  onEdgeHover,
  defaultNodeSize = 10,
  defaultEdgeWidth = 1,
  nodeColorMap = {
    default: '#4287f5',
    highlighted: '#f44336',
    muted: '#9e9e9e',
  },
  edgeColorMap = {
    default: '#9e9e9e',
    highlighted: '#f44336',
    bidirectional: '#4caf50',
  },
  showNodeLabels = true,
  showEdgeLabels = false,
  className = '',
  directed = false,
}: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State for simulation
  const [simulationNodes, setSimulationNodes] = useState<NetworkNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<NetworkEdge | null>(null);
  const [dragNode, setDragNode] = useState<NetworkNode | null>(null);
  const [simulationRunning, setSimulationRunning] = useState(physics);

  // Map node IDs to nodes for faster access
  const nodeMap = useMemo(() => {
    const map = new Map<string, NetworkNode>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Process nodes with initial positions
  useEffect(() => {
    // Copy nodes and assign positions if not provided
    const processed = nodes.map(node => {
      if (node.position) {
        return node;
      }

      return {
        ...node,
        position: {
          x: Math.random() * width * 0.8 + width * 0.1,
          y: Math.random() * height * 0.8 + height * 0.1,
        },
      };
    });

    setSimulationNodes(processed);
  }, [nodes, width, height]);

  // Run physics simulation
  useEffect(() => {
    if (!physics || !simulationNodes.length || !simulationRunning) return;

    let frameId: number;

    const runSimulation = () => {
      if (!canvasRef.current?.getContext('2d')) {
        return;
      }

      if (dragNode && !simulationRunning) {
        return;
      }

      // Simple force-directed layout
      const forces = simulationNodes.map(() => ({ x: 0, y: 0 }));

      // Repulsive force between nodes
      for (let i = 0; i < simulationNodes.length; i++) {
        if (simulationNodes[i].fixed) continue;

        for (let j = i + 1; j < simulationNodes.length; j++) {
          if (simulationNodes[j].fixed) continue;

          const nodeA = simulationNodes[i];
          const nodeB = simulationNodes[j];

          if (!nodeA.position || !nodeB.position) continue;

          const dx = nodeB.position.x - nodeA.position.x;
          const dy = nodeB.position.y - nodeA.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance === 0) continue;

          // Repulsive force inversely proportional to distance
          const force = 500 / (distance * distance);
          const forceX = (dx / distance) * force;
          const forceY = (dy / distance) * force;

          forces[i].x -= forceX;
          forces[i].y -= forceY;
          forces[j].x += forceX;
          forces[j].y += forceY;
        }
      }

      // Attractive force along edges
      for (const edge of edges) {
        const source = simulationNodes.find(n => n.id === edge.source);
        const target = simulationNodes.find(n => n.id === edge.target);

        if (!source || !target || !source.position || !target.position) continue;
        if (source.fixed && target.fixed) continue;

        const dx = target.position.x - source.position.x;
        const dy = target.position.y - source.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) continue;

        // Attractive force proportional to distance
        const force = (distance - 100) * 0.05 * (edge.weight ?? 1);
        const forceX = (dx / distance) * force;
        const forceY = (dy / distance) * force;

        if (!source.fixed) {
          forces[simulationNodes.indexOf(source)].x += forceX;
          forces[simulationNodes.indexOf(source)].y += forceY;
        }

        if (!target.fixed) {
          forces[simulationNodes.indexOf(target)].x -= forceX;
          forces[simulationNodes.indexOf(target)].y -= forceY;
        }
      }

      // Apply forces
      const updatedNodes = simulationNodes.map((node, i) => {
        if (node.fixed || !node.position) {
          return node;
        }

        if (node.id === dragNode?.id) {
          return node;
        }

        const updatedPosition = {
          x: node.position.x + forces[i].x * physicsStrength,
          y: node.position.y + forces[i].y * physicsStrength,
        };

        // Keep nodes within bounds
        updatedPosition.x = Math.max(20, Math.min(width - 20, updatedPosition.x));
        updatedPosition.y = Math.max(20, Math.min(height - 20, updatedPosition.y));

        // Calculate distance for damping effect
        const dx = updatedPosition.x - node.position.x;
        const dy = updatedPosition.y - node.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5 || !physics) {
          return { ...node, position: { ...node.position } };
        }

        if (!node.position) {
          return node;
        }

        return {
          ...node,
          position: updatedPosition,
        };
      });

      setSimulationNodes(updatedNodes);

      // Continue simulation
      frameId = requestAnimationFrame(runSimulation);
    };

    frameId = requestAnimationFrame(runSimulation);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    simulationNodes,
    edges,
    physics,
    physicsStrength,
    width,
    height,
    simulationRunning,
    dragNode,
  ]);

  // Draw the network graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    edges.forEach(edge => {
      const source = simulationNodes.find(n => n.id === edge.source);
      const target = simulationNodes.find(n => n.id === edge.target);

      if (!source || !target || !source.position || !target.position) return;

      ctx.beginPath();
      ctx.moveTo(source.position.x, source.position.y);
      ctx.lineTo(target.position.x, target.position.y);

      // Set edge color
      if (edge.id === hoveredEdge?.id) {
        ctx.strokeStyle = edgeColorMap.highlighted;
      } else if (edge.bidirectional) {
        ctx.strokeStyle = edge.color ?? edgeColorMap.bidirectional;
      } else {
        ctx.strokeStyle = edge.color ?? edgeColorMap.default;
      }

      ctx.lineWidth = edge.width ?? defaultEdgeWidth;
      ctx.stroke();

      // Draw arrow if directed
      if (directed && !edge.bidirectional) {
        const arrowSize = 8;
        const angle = Math.atan2(
          target.position.y - source.position.y,
          target.position.x - source.position.x
        );

        // Draw arrow at 3/4 of the way to the target
        const x = source.position.x + (target.position.x - source.position.x) * 0.75;
        const y = source.position.y + (target.position.y - source.position.y) * 0.75;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x - arrowSize * Math.cos(angle - Math.PI / 6),
          y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          x - arrowSize * Math.cos(angle + Math.PI / 6),
          y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = edge.color ?? edgeColorMap.default;
        ctx.fill();
      }

      // Draw edge label
      if (showEdgeLabels && edge.label && typeof edge.label === 'string') {
        const midX = (source.position.x + target.position.x) / 2;
        const midY = (source.position.y + target.position.y) / 2;

        ctx.font = '10px Arial';
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // Draw text with background for readability
        const textWidth = ctx.measureText(edge.label).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(midX - textWidth / 2 - 2, midY - 12, textWidth + 4, 14);

        ctx.fillStyle = '#333333';
        ctx.fillText(edge.label, midX, midY - 5);
      }
    });

    // Draw nodes
    simulationNodes.forEach(node => {
      if (!node.position) return;

      const x = node.position.x;
      const y = node.position.y;
      const size = node.size ?? defaultNodeSize;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);

      // Set node color
      if (node.id === hoveredNode?.id) {
        ctx.fillStyle = nodeColorMap.highlighted;
      } else if (node.color) {
        ctx.fillStyle = node.color;
      } else if (node.group && nodeColorMap[node.group]) {
        ctx.fillStyle = nodeColorMap[node.group];
      } else {
        ctx.fillStyle = nodeColorMap.default;
      }

      ctx.fill();

      // Add border to nodes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw node label
      if (showNodeLabels && node.label && typeof node.label === 'string') {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Draw text with background for readability
        const textWidth = ctx.measureText(node.label).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(x - textWidth / 2 - 2, y + size + 2, textWidth + 4, 16);

        ctx.fillStyle = '#333333';
        ctx.fillText(node.label, x, y + size + 4);
      }
    });
  }, [
    simulationNodes,
    edges,
    width,
    height,
    hoveredNode,
    hoveredEdge,
    nodeColorMap,
    edgeColorMap,
    defaultNodeSize,
    defaultEdgeWidth,
    showNodeLabels,
    showEdgeLabels,
    directed,
  ]);

  // Handle mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if mouse is over a node
    let foundNode = false;
    let foundEdge = false;

    // Check nodes first (they should be on top)
    for (const node of simulationNodes) {
      if (!node.position) continue;

      const size = node.size ?? defaultNodeSize;
      const dx = node.position.x - x;
      const dy = node.position.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= size) {
        setHoveredNode(node);
        setHoveredEdge(null);
        foundNode = true;

        // If dragging, update node position
        if (dragNode?.id === node.id) {
          const updatedNodes = simulationNodes.map(n => {
            if (n.id === node.id) {
              return {
                ...n,
                position: { x, y },
              };
            }
            return n;
          });

          setSimulationNodes(updatedNodes);
        }

        // Set cursor
        canvas.style.cursor = 'pointer';
        break;
      }
    }

    // If not over a node, check edges
    if (!foundNode && !dragNode) {
      for (const edge of edges) {
        const source = simulationNodes.find(n => n.id === edge.source);
        const target = simulationNodes.find(n => n.id === edge.target);

        if (!source || !target || !source.position || !target.position) continue;

        // Check if cursor is near the edge line
        const edgeDist = distanceToLine(
          x,
          y,
          source.position.x,
          source.position.y,
          target.position.x,
          target.position.y
        );

        if (edgeDist < 5) {
          setHoveredEdge(edge);
          setHoveredNode(null);
          foundEdge = true;
          canvas.style.cursor = 'pointer';
          break;
        }
      }
    }

    // Reset if not hovering over unknownthing
    if (!foundNode && !foundEdge && !dragNode) {
      setHoveredNode(null);
      setHoveredEdge(null);
      canvas.style.cursor = 'default';
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) {
      return;
    }

    // Check which mouse button was pressed (0 = left, 1 = middle, 2 = right)
    if (e.button !== 0) return; // Only handle left-click

    // Start dragging if hovering over a node
    if (hoveredNode) {
      setDragNode(hoveredNode);
      setSimulationRunning(false);
    } else {
      setDragNode(null);
    }
  };

  const handleMouseUp = () => {
    if (!interactive) {
      return;
    }

    setDragNode(null);

    // Resume simulation if physics is enabled
    if (physics) {
      setSimulationRunning(true);
    }
  };

  const handleClick = () => {
    if (!interactive) {
      return;
    }

    // Handle node click
    if (hoveredNode && onNodeClick) {
      const node = nodeMap.get(hoveredNode.id);
      if (node) {
        onNodeClick(node);
      }
    }

    // Handle edge click
    if (hoveredEdge && onEdgeClick) {
      const edge = edges.find(e => e.id === hoveredEdge.id);
      if (edge) {
        onEdgeClick(edge);
      }
    }
  };

  // Update the hover handlers for nodes
  useEffect(() => {
    if (onNodeHover) {
      onNodeHover(hoveredNode);
    }
  }, [hoveredNode, onNodeHover]);

  // Update the hover handlers for edges
  useEffect(() => {
    if (onEdgeHover) {
      onEdgeHover(hoveredEdge);
    }
  }, [hoveredEdge, onEdgeHover]);

  return (
    <div
      ref={containerRef}
      className={`network-graph-container ${className}`}
      data-testid="network-graph"
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        className="network-graph-canvas"
      />
    </div>
  );
}

// Helper to calculate distance from point to line segment
function distanceToLine(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Helper to create a network graph data structure from nodes and edges lists
 */
export function createNetworkData(
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  return { nodes, edges };
}

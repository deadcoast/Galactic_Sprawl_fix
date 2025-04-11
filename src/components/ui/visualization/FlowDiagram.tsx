import * as d3 from 'd3';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  d3Accessors,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from '../../../types/visualizations/D3Types';
import {
  createD3ForceValidation,
  ValidationTransformResult,
} from '../../../types/visualizations/D3ValidationHooks';

/**
 * Represents a node in the flow diagram
 */
interface FlowDataNode {
  id: string;
  name: string;
  type: 'source' | 'process' | 'destination';
  value: number;
  capacity?: number;
  efficiency?: number;
  description?: string;
}

/**
 * Represents a connection between two nodes in the flow diagram
 */
interface FlowDataLink {
  id: string;
  source: string;
  target: string;
  value: number;
  maxCapacity?: number;
  utilization?: number;
  flowType?: string;
  active: boolean;
}

/**
 * Represents the entire flow data structure
 */
interface FlowData {
  nodes: FlowDataNode[];
  links: FlowDataLink[];
}

/**
 * Node type for D3 force simulation with proper typing
 * Extends SimulationNodeDatum to ensure D3 compatibility
 */
interface FlowNode extends SimulationNodeDatum<FlowDataNode> {
  id: string;
  name: string;
  type: 'source' | 'process' | 'destination';
  value: number;
  capacity?: number;
  efficiency?: number;
  description?: string;
  color?: string;
  radius?: number;
  // Original data reference
  data?: FlowDataNode;
}

/**
 * Link type for D3 force simulation with proper typing
 * Extends SimulationLinkDatum for D3 compatibility
 */
interface FlowLink extends SimulationLinkDatum<FlowNode> {
  id: string;
  source: string | FlowNode;
  target: string | FlowNode;
  value: number;
  maxCapacity?: number;
  utilization?: number;
  flowType?: string;
  active: boolean;
  width?: number;
  color?: string;
}

/**
 * Props for FlowDiagram component
 */
interface FlowDiagramProps {
  /**
   * Flow data to visualize
   */
  data: FlowData;

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
   * Whether the diagram supports interaction (dragging, zooming)
   * @default true
   */
  interactive?: boolean;

  /**
   * Whether to animate transitions in the diagram
   * @default true
   */
  animated?: boolean;

  /**
   * Callback when a node is clicked
   */
  onNodeClick?: (nodeId: string, nodeData: FlowDataNode) => void;

  /**
   * Callback when a link is clicked
   */
  onLinkClick?: (linkId: string, linkData: FlowDataLink) => void;

  /**
   * CSS class name for additional styling
   */
  className?: string;
}

/**
 * Convert data nodes to D3-compatible nodes with proper typing
 */
const convertNodesToD3Format = (nodes: FlowDataNode[]): FlowNode[] => {
  return nodes.map(node => {
    // Determine radius based on node value
    const radius = Math.max(15, Math.min(40, 15 + (node.value / 100) * 25));

    // Determine color based on node type
    let color: string;
    switch (node.type) {
      case 'source':
        color = '#06b6d4'; // cyan
        break;
      case 'process':
        color = '#a855f7'; // purple
        break;
      case 'destination':
        color = '#10b981'; // green
        break;
      default:
        color = '#94a3b8'; // slate
    }

    // Create a properly typed node with no type assertions
    const d3Node: FlowNode = {
      id: node.id,
      name: node.name,
      type: node.type,
      value: node.value,
      capacity: node.capacity,
      efficiency: node.efficiency,
      description: node.description,
      radius,
      color,
      // Store original data for reference
      data: node,
    };

    return d3Node;
  });
};

/**
 * Convert data links to D3-compatible links with proper typing
 */
const convertLinksToD3Format = (
  links: FlowDataLink[],
  nodeMap: Map<string, FlowNode>
): FlowLink[] => {
  return (
    links
      .map(link => {
        // Find source and target nodes using the map
        const sourceNode = nodeMap.get(link.source);
        const targetNode = nodeMap.get(link.target);

        // If source or target node doesn't exist, skip this link
        if (!sourceNode || !targetNode) {
          console.warn(`Skipping link ${link.id}: Source or target node not found.`);
          return null;
        }

        // Determine line width based on value and maxCapacity
        const width = Math.max(1, Math.min(8, 1 + (link.value / 100) * 7));

        // Determine color based on active state and utilization
        let color: string;
        if (!link.active) {
          color = '#94a3b8'; // slate (inactive)
        } else if (link.utilization && link.utilization > 0.8) {
          color = '#ef4444'; // red (high utilization)
        } else if (link.utilization && link.utilization > 0.5) {
          color = '#f59e0b'; // amber (medium utilization)
        } else {
          color = '#3b82f6'; // blue (low utilization)
        }

        // Create a properly typed link with node objects
        const d3Link: FlowLink = {
          id: link.id,
          // Assign the resolved node objects
          source: sourceNode,
          target: targetNode,
          value: link.value,
          maxCapacity: link.maxCapacity,
          utilization: link.utilization,
          flowType: link.flowType,
          active: link.active,
          width,
          color,
        };

        return d3Link;
      })
      // Filter out null links where nodes weren't found
      .filter((link): link is FlowLink => link !== null)
  );
};

/**
 * Find a node by ID in an array of nodes
 * Type-safe helper function
 */
const findNodeById = (nodes: FlowNode[], id: string): FlowNode | undefined => {
  return nodes.find(node => node.id === id);
};

/**
 * Check if a node/link is a string or an object
 * Type guard function
 */
const isNodeReference = (obj: string | FlowNode): obj is FlowNode => {
  return typeof obj !== 'string' && obj.id !== undefined;
};

/**
 * Component for visualizing flow data with type-safe D3 integration
 */
const FlowDiagram: React.FC<FlowDiagramProps> = ({
  data,
  width = 800,
  height = 600,
  interactive = true,
  animated = true,
  onNodeClick,
  onLinkClick,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<d3.Simulation<FlowNode, FlowLink> | null>(null);

  // State for tracking hover and selected nodes/links
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  /**
   * Prepare visualization data with type safety
   */
  const prepareVisualizationData = useCallback(() => {
    try {
      // Create validation functions
      const validation = createD3ForceValidation<FlowData, FlowNode, FlowLink>(
        // Node transform function
        inputData => convertNodesToD3Format(inputData.nodes),
        // Link transform function
        inputData =>
          convertLinksToD3Format(
            inputData.links,
            new Map(convertNodesToD3Format(inputData.nodes).map(node => [node.id, node]))
          ),
        // Custom node schema properties
        {
          properties: {
            id: {
              type: 'string',
              required: true,
              validate: value => (value as string).length > 0 || 'Node ID cannot be empty',
            },
            type: {
              type: 'string',
              required: true,
              enum: ['source', 'process', 'destination'],
            },
          },
        },
        // Custom link schema properties
        {
          properties: {
            id: {
              type: 'string',
              required: true,
            },
            active: {
              type: 'boolean',
              required: true,
            },
          },
        },
        // Validation options
        {
          throwOnError: false,
          logErrors: true,
          errorPrefix: 'FlowDiagram Validation Error',
        }
      );

      // Validate and transform data
      const nodeResult: ValidationTransformResult<FlowNode[]> = validation.validateNodes(data);
      const linkResult: ValidationTransformResult<FlowLink[]> = validation.validateLinks(data);

      // Handle validation errors
      if (!nodeResult.valid || !linkResult.valid) {
        console.warn(
          'Flow data validation failed:',
          [...nodeResult.errors, ...linkResult.errors].join('\n')
        );
      }

      return {
        nodes: nodeResult.data,
        links: linkResult.data,
        valid: nodeResult.valid && linkResult.valid,
        errors: [...nodeResult.errors, ...linkResult.errors],
      };
    } catch (error) {
      console.error('Error preparing visualization data:', error);
      return {
        nodes: [],
        links: [],
        valid: false,
        errors: ['Error preparing visualization data'],
      };
    }
  }, [data]);

  /**
   * Handle node click events with proper typing
   */
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      setSelectedNodeId(prevId => (prevId === node.id ? null : node.id));

      if (onNodeClick && node.data) {
        onNodeClick(node.id, node.data);
      }
    },
    [onNodeClick]
  );

  /**
   * Handle link click events with proper typing
   */
  const handleLinkClick = useCallback(
    (event: React.MouseEvent, link: FlowLink) => {
      if (typeof link.source === 'string' || typeof link.target === 'string') {
        return; // Ignore links that don't have resolved nodes
      }

      setSelectedLinkId(prevId => (prevId === link.id ? null : link.id));

      // Find the original link data for the callback
      const linkData = data?.links.find(l => l.id === link.id);
      if (onLinkClick && linkData) {
        onLinkClick(link.id, linkData);
      }
    },
    [data?.links, onLinkClick]
  );

  /**
   * Create and update the visualization
   */
  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Clean up previous simulation if it exists
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Get SVG element with proper typing
    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);

    // Clear previous content
    svg.selectAll('*').remove();

    // Prepare data with type safety
    const { nodes, links, valid, errors } = prepareVisualizationData();

    // Handle validation errors if necessary (already logged in prepareVisualizationData)
    if (!valid) {
      console.error('Flow diagram rendering aborted due to invalid data:', errors.join('\n'));
      // Optionally display an error message in the SVG
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'red')
        .text('Error: Invalid flow data provided.');
      return; // Stop rendering if data is invalid
    }

    // Create container group for zooming
    const container = svg.append('g').attr('class', 'container');

    // Add zoom behavior if interactive
    if (interactive) {
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', event => {
          container.attr('transform', event?.transform);
        });

      svg.call(zoom);
    }

    // Create arrow markers for links
    const defs = container.append('defs');

    // Create a basic arrow marker
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-10 -5 10 10')
      .attr('refX', 0)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M-10,-5L0,0L-10,5')
      .attr('fill', '#777');

    // Create colored arrow markers
    ['active', 'inactive', 'high', 'medium', 'low'].forEach(type => {
      let color: string;
      switch (type) {
        case 'active':
          color = '#3b82f6';
          break;
        case 'inactive':
          color = '#94a3b8';
          break;
        case 'high':
          color = '#ef4444';
          break;
        case 'medium':
          color = '#f59e0b';
          break;
        case 'low':
          color = '#10b981';
          break;
        default:
          color = '#777';
      }

      defs
        .append('marker')
        .attr('id', `arrowhead-${type}`)
        .attr('viewBox', '-10 -5 10 10')
        .attr('refX', 0)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .append('path')
        .attr('d', 'M-10,-5L0,0L-10,5')
        .attr('fill', color);
    });

    // Create D3 force simulation with proper typing
    const simulation = d3
      .forceSimulation<FlowNode, FlowLink>(nodes)
      .force(
        'link',
        d3
          .forceLink<FlowNode, FlowLink>(links)
          .id(d => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide<FlowNode>().radius(d => (d.radius || 20) + 10)
      );

    // Store simulation reference for cleanup
    simulationRef.current = simulation;

    // Create links with proper typing
    const link = container
      .append('g')
      .attr('class', 'links')
      .selectAll<SVGLineElement, FlowLink>('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', d => `link ${d.active ? 'active' : 'inactive'}`)
      .attr('stroke', d => d.color || '#999')
      .attr('stroke-width', d => d.width || 1)
      .attr('marker-end', d => {
        // Determine marker based on link properties
        if (!d.active) return 'url(#arrowhead-inactive)';
        if (d.utilization && d.utilization > 0.8) return 'url(#arrowhead-high)';
        if (d.utilization && d.utilization > 0.5) return 'url(#arrowhead-medium)';
        return 'url(#arrowhead-active)';
      })
      .style('cursor', onLinkClick ? 'pointer' : 'default')
      .on('click', function (event, d) {
        if (onLinkClick) {
          handleLinkClick(event, d);
        }
      });

    // Create nodes with proper typing
    const node = container
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, FlowNode>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', onNodeClick ? 'pointer' : 'default')
      .call(
        d3
          .drag<SVGGElement, FlowNode>()
          .on('start', dragStarted)
          .on('drag', dragged)
          .on('end', dragEnded)
      )
      .on('click', function (event, d) {
        if (onNodeClick) {
          handleNodeClick(event, d);
        }
      });

    // Add circles to nodes
    node
      .append('circle')
      .attr('r', d => d.radius || 20)
      .attr('fill', d => d.color || '#999')
      .attr('stroke', d => (selectedNodeId === d.id ? '#1f2937' : '#fff'))
      .attr('stroke-width', d => (selectedNodeId === d.id ? 3 : 1.5));

    // Add node labels
    node
      .append('text')
      .attr('dy', '.3em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#fff')
      .text(d => d.name);

    // Add node value labels
    node
      .append('text')
      .attr('dy', '1.6em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#fff')
      .text(d => `${d.value}${d.capacity ? `/${d.capacity}` : ''}`);

    // Add hover effects with type-safe accessors
    node
      .on('mouseover', function (event, d) {
        d3.select(this)
          .select('circle')
          .transition()
          .duration(200)
          .attr('r', (d.radius || 20) * 1.1);
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .select('circle')
          .transition()
          .duration(200)
          .attr('r', d.radius || 20);
      });

    // Add flow effects to links
    if (animated) {
      link
        .filter(d => d.active)
        .each(function (d) {
          const element = d3.select(this);

          // Add animated dash array for active links
          element
            .attr('stroke-dasharray', '5,5')
            .style('animation', `flowAnimation ${5000 / (d.value || 1)}ms linear infinite`);
        });
    }

    // Update positions on simulation tick with proper typing
    simulation.on('tick', () => {
      // Update links with safe accessors to prevent type errors
      link
        .attr('x1', d => {
          const source = d.source as FlowNode;
          return source ? d3Accessors.getX(source) : 0;
        })
        .attr('y1', d => {
          const source = d.source as FlowNode;
          return source ? d3Accessors.getY(source) : 0;
        })
        .attr('x2', d => {
          const target = d.target as FlowNode;
          return target ? d3Accessors.getX(target) : 0;
        })
        .attr('y2', d => {
          const target = d.target as FlowNode;
          return target ? d3Accessors.getY(target) : 0;
        })
        // Apply selected style conditionally
        .attr('stroke', d => (selectedLinkId === d.id ? '#1f2937' : d.color || '#999'))
        .attr('stroke-width', d =>
          selectedLinkId === d.id ? Math.max(2, (d.width || 1) * 1.5) : d.width || 1
        );

      // Update nodes with safe transforms
      node.attr('transform', d => {
        const x = d3Accessors.getX(d);
        const y = d3Accessors.getY(d);
        return `translate(${x}, ${y})`;
      });
    });

    // Type-safe drag functions
    function dragStarted(event: d3.D3DragEvent<SVGGElement, FlowNode, FlowNode>, d: FlowNode) {
      if (!event?.active) simulation.alphaTarget(0.3).restart();
      d.fx = d3Accessors.getX(d);
      d.fy = d3Accessors.getY(d);
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, FlowNode, FlowNode>, d: FlowNode) {
      d.fx = event?.x;
      d.fy = event?.y;
    }

    function dragEnded(event: d3.D3DragEvent<SVGGElement, FlowNode, FlowNode>, d: FlowNode) {
      if (!event?.active) simulation.alphaTarget(0);
      if (!interactive) {
        d.fx = null;
        d.fy = null;
      }
    }

    // Cleanup function
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [
    data,
    width,
    height,
    interactive,
    animated,
    prepareVisualizationData,
    handleNodeClick,
    handleLinkClick,
    onNodeClick,
    onLinkClick,
    selectedNodeId,
    selectedLinkId,
  ]);

  return (
    <div className={`flow-diagram-container ${className}`}>
      {/* Add CSS for animation */}
      {animated && (
        <style>
          {`
            @keyframes flowAnimation {
              from {
                stroke-dashoffset: 20;
              }
              to {
                stroke-dashoffset: 0;
              }
            }
          `}
        </style>
      )}
      <svg ref={svgRef} width={width} height={height} className="flow-diagram-svg" />
    </div>
  );
};

export default FlowDiagram;

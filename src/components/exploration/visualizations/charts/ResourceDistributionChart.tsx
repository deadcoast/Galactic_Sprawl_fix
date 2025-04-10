import * as d3 from 'd3';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { ResourceType, ResourceTypeHelpers } from '../../../../types/resources/ResourceTypes';
import { SimulationNodeDatum, d3Accessors } from '../../../../types/visualizations/D3Types';

/**
 * Interface for resource distribution data
 */
interface ResourceDistributionData {
  resourceType: ResourceType;
  amount: number;
  location: string;
  efficiency: number;
}

/**
 * Chart configuration options
 */
interface ChartConfig {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showLabels: boolean;
}

/**
 * Strongly typed node for resource distribution visualization
 * Extends SimulationNodeDatum to ensure D3 type compatibility
 */
interface ResourceNode extends SimulationNodeDatum<ResourceDistributionData> {
  resourceType: ResourceType;
  amount: number;
  location: string;
  efficiency: number;
  radius: number;
  color: string;
}

/**
 * Props for ResourceDistributionChart component
 */
interface ResourceDistributionChartProps {
  /**
   * Distribution data for resources to visualize
   */
  data: ResourceDistributionData[];

  /**
   * Width of the chart in pixels
   * @default 600
   */
  width?: number;

  /**
   * Height of the chart in pixels
   * @default 400
   */
  height?: number;

  /**
   * Whether to show labels for resources
   * @default true
   */
  showLabels?: boolean;

  /**
   * Whether the chart is interactive (supports dragging)
   * @default true
   */
  interactive?: boolean;

  /**
   * CSS class name for additional styling
   */
  className?: string;
}

/**
 * Utility to convert resource data to D3-compatible nodes with proper typing
 */
const convertToNodes = (data: ResourceDistributionData[]): ResourceNode[] => {
  return data?.map((item, index) => {
    // Get color based on resource type
    const color = getResourceColor(item?.resourceType);

    // Calculate radius based on amount (normalized between 10-50)
    const radius = Math.max(10, Math.min(50, 10 + (item?.amount / 100) * 40));

    return {
      id: `resource-${index}`,
      resourceType: item?.resourceType,
      amount: item?.amount,
      location: item?.location,
      efficiency: item?.efficiency,
      radius,
      color,
      // The data field provides access to the original data
      data: item,
    };
  });
};

/**
 * Get color for a specific resource type
 */
const getResourceColor = (resourceType: ResourceType): string => {
  switch (resourceType) {
    case ResourceType.MINERALS:
      return '#f59e0b'; // amber
    case ResourceType.ENERGY:
      return '#06b6d4'; // cyan
    case ResourceType.POPULATION:
      return '#10b981'; // green
    case ResourceType.RESEARCH:
      return '#a855f7'; // purple
    case ResourceType.PLASMA:
      return '#ef4444'; // red
    case ResourceType.GAS:
      return '#3b82f6'; // blue
    case ResourceType.EXOTIC:
      return '#ec4899'; // pink
    default:
      return '#94a3b8'; // slate
  }
};

/**
 * Component that visualizes resource distribution using D3 force simulation
 */
const ResourceDistributionChart: React.FC<ResourceDistributionChartProps> = ({
  data,
  width = 600,
  height = 400,
  showLabels = true,
  interactive = true,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<ResourceNode, undefined> | null>(null);

  // Default chart configuration
  const config: ChartConfig = {
    width,
    height,
    margin: {
      top: 30,
      right: 30,
      bottom: 50,
      left: 50,
    },
    showLabels,
  };

  // Clean up function to stop simulation when component unmounts
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  // Main effect to create/update the visualization
  useEffect(() => {
    if (!svgRef.current || !data?.length) {
      return;
    }

    // Convert data to D3-compatible format with proper typing
    const nodes = convertToNodes(data);

    // Clear unknownnown existing visualization
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Add container group for zooming
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

    // Create D3 force simulation with proper typing
    const simulation = d3
      .forceSimulation<ResourceNode>()
      .nodes(nodes)
      .force('charge', d3.forceMunknownnownBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide<ResourceNode>().radius(d => d.radius + 2)
      )
      .on('tick', ticked);

    // Store reference for cleanup
    simulationRef.current = simulation;

    // Create node elements
    const node = container
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(
        d3
          .drag<SVGGElement, ResourceNode>()
          .on('start', dragStarted)
          .on('drag', dragging)
          .on('end', dragEnded)
      );

    // Add circles for nodes
    node
      .append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.7)
      .attr('stroke', d => d3.color(d.color)?.darker().toString() || '#000')
      .attr('stroke-width', 1.5);

    // Add labels if enabled
    if (showLabels) {
      node
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.3em')
        .attr('font-size', '10px')
        .attr('pointer-events', 'none')
        .text(d => ResourceTypeHelpers.getDisplayName(d.resourceType));

      // Add amount labels below
      node
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.3em')
        .attr('font-size', '8px')
        .attr('pointer-events', 'none')
        .text(d => `${d.amount}`);
    }

    // (...args: unknown[]) => unknown called on each tick of the simulation
    function ticked() {
      node.attr('transform', d => {
        // Use safe accessors instead of direct property access
        const x = d3Accessors.getX(d);
        const y = d3Accessors.getY(d);

        // Constrain the nodes to be within the chart area
        const r = d.radius ?? 0;
        const constrainedX = Math.max(r, Math.min(width - r, x));
        const constrainedY = Math.max(r, Math.min(height - r, y));

        return `translate(${constrainedX}, ${constrainedY})`;
      });
    }

    // Drag functions with proper typing
    function dragStarted(
      event: d3.D3DragEvent<SVGGElement, ResourceNode, ResourceNode>,
      d: ResourceNode
    ) {
      if (!event?.active) {
        simulation.alphaTarget(0.3).restart();
      }
      d.fx = d3Accessors.getX(d);
      d.fy = d3Accessors.getY(d);
    }

    function dragging(
      event: d3.D3DragEvent<SVGGElement, ResourceNode, ResourceNode>,
      d: ResourceNode
    ) {
      d.fx = event?.x;
      d.fy = event?.y;
    }

    function dragEnded(
      event: d3.D3DragEvent<SVGGElement, ResourceNode, ResourceNode>,
      d: ResourceNode
    ) {
      if (!event?.active) {
        simulation.alphaTarget(0);
      }
      d.fx = null;
      d.fy = null;
    }
  }, [data, width, height, interactive, showLabels, config]);

  return (
    <div className={`resource-distribution-chart ${className}`}>
      <svg ref={svgRef} width={width} height={height} className="resource-distribution-svg" />
    </div>
  );
};

export default ResourceDistributionChart;

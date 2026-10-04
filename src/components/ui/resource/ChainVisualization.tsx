import * as d3 from 'd3';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ProcessStatus,
  ProductionChainStatus,
} from '../../../types/resources/ProductionChainTypes';
import { FlowNode, ResourceConversionRecipe } from '../../../types/resources/ResourceTypes';
import { d3Accessors } from '../../../types/visualizations/D3Types';

// Define Node and Link data structures expected by D3 simulation forces
interface ChainNodeData extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'converter' | 'recipe' | 'input' | 'output'; // Input/output might be future types
  level: number;
  status?: ProcessStatus;
  icon?: React.ReactNode; // Optional icon
  // x, y, fx, fy are implicitly added by d3.SimulationNodeDatum
}

interface ChainLinkData extends d3.SimulationLinkDatum<ChainNodeData> {
  source: string | ChainNodeData;
  target: string | ChainNodeData;
  status?: ProcessStatus;
}

// Types for the component props
interface ChainVisualizationProps {
  chain: ProductionChainStatus;
  converters: Record<string, FlowNode>;
  recipes: Record<string, ResourceConversionRecipe>;
  width?: number;
  height?: number;
  interactive?: boolean;
  onNodeClick?: (nodeId: string, type: 'converter' | 'recipe') => void;
}

/**
 * ChainVisualization - React component for visualizing production chains
 *
 * This component uses D3 to create an interactive visualization of production chains,
 * showing converters, recipes, and the flow between them.
 */
const ChainVisualization: React.FC<ChainVisualizationProps> = ({
  chain,
  converters,
  recipes,
  width = 600,
  height = 400,
  interactive = true,
  onNodeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // State uses the simulation data types directly
  const [nodes, setNodes] = useState<ChainNodeData[]>([]);
  const [links, setLinks] = useState<ChainLinkData[]>([]);

  // Generate graph data (nodes and links) from chain status
  const generateGraphData = useCallback(() => {
    if (!chain) {
      return;
    }

    const newNodes: ChainNodeData[] = []; // Use ChainNodeData
    const newLinks: ChainLinkData[] = []; // Use ChainLinkData

    chain.stepStatus.forEach((step, index) => {
      const converter = converters[step.converterId];
      const recipe = recipes[step.recipeId];

      if (!converter || !recipe) {
        return;
      }

      const converterLevel = index * 2;
      const recipeLevel = index * 2 + 1;

      // Add converter node (conforming to ChainNodeData)
      newNodes.push({
        id: step.converterId,
        type: 'converter',
        label: converter.id, // Use label
        level: converterLevel,
        status: step.status,
        // Initialize simulation properties if needed, though D3 usually handles this
        x: undefined,
        y: undefined,
        fx: null,
        fy: null,
      });

      // Add recipe node (conforming to ChainNodeData)
      const recipeNodeId = `recipe-${step.recipeId}-${index}`;
      newNodes.push({
        id: recipeNodeId,
        type: 'recipe',
        label: recipe.name, // Use label
        level: recipeLevel,
        status: step.status,
        x: undefined,
        y: undefined,
        fx: null,
        fy: null,
      });

      // Add link from converter to recipe (conforming to ChainLinkData)
      newLinks.push({
        source: step.converterId,
        target: recipeNodeId,
        status: step.status,
      });

      // Add link to next step's converter if not the last step
      if (index < chain.stepStatus.length - 1) {
        const nextStep = chain.stepStatus[index + 1];
        newLinks.push({
          source: recipeNodeId,
          target: nextStep.converterId,
          status: ProcessStatus.PENDING,
        });
      }
    });

    setNodes(newNodes);
    setLinks(newLinks);
  }, [chain, converters, recipes]);

  // Set up the D3 visualization
  const renderVisualization = useCallback(() => {
    if (!svgRef.current || nodes.length === 0 || links.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Define the simulation - Use types directly, no assertions needed
    const simulation = d3
      .forceSimulation<ChainNodeData>(nodes)
      .force(
        'link',
        d3.forceLink<ChainNodeData, ChainLinkData>(links).id(d => d.id)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX((d: ChainNodeData) => d.level * 150).strength(0.5))
      .force('y', d3.forceY());

    // Create links - Use types directly
    const link = svg
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke-width', 1.5) // Simplified stroke width
      .attr('stroke', d => getStatusColor(d.status ?? ProcessStatus.PENDING))
      .attr('marker-end', 'url(#arrowhead)');

    // Add arrow marker definition
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Create nodes - Use types directly
    const node = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .on('click', function (event, d: ChainNodeData) {
        // Use ChainNodeData
        if (interactive && onNodeClick) {
          // Use event to provide visual feedback on click
          d3.select(this).classed('node-clicked', true);
          // Use event coordinates for potential tooltips or context menus
          console.warn(`Node clicked at x: ${event?.x}, y: ${event?.y}`);
          // After a short delay, remove the visual feedback
          setTimeout(() => {
            d3.select(this).classed('node-clicked', false);
          }, 300);

          onNodeClick(d.id, d.type as 'converter' | 'recipe'); // Assert type for handler
        }
      })
      .call(
        d3
          .drag<SVGGElement, ChainNodeData>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    // Add node shapes
    node
      .append('circle')
      .attr('r', d => (d.type === 'converter' ? 15 : 10))
      .attr('fill', d => (d.type === 'converter' ? '#4299e1' : '#ed8936'))
      .attr('stroke', d => getStatusColor(d.status ?? ProcessStatus.PENDING))
      .attr('stroke-width', 2);

    // Add text labels using the label property
    node
      .append('text')
      .attr('dy', -20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e0')
      .text(d => d.label); // Use label property

    // Add status indicators
    node
      .append('text')
      .attr('dy', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e0')
      .text(d => capitalizeFirstLetter((d.status ?? ProcessStatus.PENDING).replace('_', ' ')));

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d3Accessors.getX(d.source))
        .attr('y1', d => d3Accessors.getY(d.source))
        .attr('x2', d => d3Accessors.getX(d.target))
        .attr('y2', d => d3Accessors.getY(d.target));

      node.attr('transform', (d: ChainNodeData) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Drag event handlers - use ChainNodeData
    function dragstarted(
      event: d3.D3DragEvent<SVGGElement, ChainNodeData, ChainNodeData>,
      d: ChainNodeData
    ) {
      if (!event?.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(
      event: d3.D3DragEvent<SVGGElement, ChainNodeData, ChainNodeData>,
      d: ChainNodeData
    ) {
      d.fx = event?.x;
      d.fy = event?.y;
    }
    function dragended(
      event: d3.D3DragEvent<SVGGElement, ChainNodeData, ChainNodeData>,
      d: ChainNodeData
    ) {
      if (!event?.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }, [nodes, links, width, height, interactive, onNodeClick]);

  // Helper function to get color based on status
  const getStatusColor = (status: ProcessStatus) => {
    switch (status) {
      case ProcessStatus.COMPLETED:
        return '#48bb78'; // Green
      case ProcessStatus.IN_PROGRESS:
        return '#f6ad55'; // Orange
      case ProcessStatus.FAILED:
        return '#f56565'; // Red
      case ProcessStatus.PENDING:
      case ProcessStatus.PAUSED: // Treat paused same as pending visually for now
      default:
        return '#a0aec0'; // Gray
    }
  };

  // Utility function to capitalize the first letter of a string
  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Generate graph data on component initialization or when dependencies change
  useEffect(() => {
    generateGraphData();
  }, [generateGraphData]);

  // Render visualization when nodes or links change
  useEffect(() => {
    renderVisualization();
  }, [renderVisualization, nodes, links]);

  // If no chain is provided, render an empty placeholder
  if (!chain) {
    return <div>No chain data available</div>;
  }

  return (
    <div className="chain-visualization">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="chain-visualization-svg"
        style={{ overflow: 'visible' }}
      />
    </div>
  );
};

export default ChainVisualization;

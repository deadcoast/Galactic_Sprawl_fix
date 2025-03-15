import { ResourceType } from "./../../../types/resources/ResourceTypes";
import * as d3 from 'd3';
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from 'react';
import { ResourceConversionRecipe } from '../../../types/resources/ResourceTypes';
import { FlowNode } from '../../../types/resources/StandardizedResourceTypes';
import { d3Accessors } from '../../../types/visualizations/D3Types';

// Define the ChainStatus interface since it's missing from ResourceTypes
interface ChainStatus {
  chainId: string;
  currentStepIndex: number;
  recipeIds: string[];
  startTime: number;
  estimatedEndTime: number;
  progress: number;
  stepStatus: Array<{
    recipeId: string;
    converterId: string;
    processId?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
  }>;
  resourceTransfers: Array<{
    type: string;
    amount: number;
    fromStep: number;
    toStep: number;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  active: boolean;
  paused: boolean;
  completed: boolean;
  failed: boolean;
  errorMessage?: string;
}

// Types for the component props
interface ChainVisualizationProps {
  chain: ChainStatus;
  converters: Record<string, FlowNode>;
  recipes: Record<string, ResourceConversionRecipe>;
  width?: number;
  height?: number;
  interactive?: boolean;
  onNodeClick?: (nodeId: string, type: 'converter' | 'recipe') => void;
}

// Node type for D3 visualization
interface ChainNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'converter' | 'recipe';
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  x?: number;
  y?: number;
  // Add fx and fy properties for D3 force simulation
  fx?: number | null;
  fy?: number | null;
}

// Link type for D3 visualization
interface ChainLink extends d3.SimulationLinkDatum<ChainNode> {
  source: string | ChainNode;
  target: string | ChainNode;
  value: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
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
  const [nodes, setNodes] = useState<ChainNode[]>([]);
  const [links, setLinks] = useState<ChainLink[]>([]);

  // Generate graph data (nodes and links) from chain status
  const generateGraphData = useCallback(() => {
    if (!chain) {
      return;
    }

    const newNodes: ChainNode[] = [];
    const newLinks: ChainLink[] = [];

    // Add converter nodes
    chain.stepStatus.forEach((step, index) => {
      const converter = converters[step.converterId];
      const recipe = recipes[step.recipeId];

      if (!converter || !recipe) {
        return;
      }

      // Add converter node
      newNodes.push({
        id: step.converterId,
        type: 'converter',
        name: converter.id,
        status: step.status,
      });

      // Add recipe node
      const recipeNodeId = `recipe-${step.recipeId}-${index}`;
      newNodes.push({
        id: recipeNodeId,
        type: 'recipe',
        name: recipe.name,
        status: step.status,
      });

      // Add link from converter to recipe
      newLinks.push({
        source: step.converterId,
        target: recipeNodeId,
        value: 1,
        status: step.status,
      });

      // Add link to next step's converter if not the last step
      if (index < chain.stepStatus.length - 1) {
        const nextStep = chain.stepStatus[index + 1];
        newLinks.push({
          source: recipeNodeId,
          target: nextStep.converterId,
          value: 1,
          status: 'pending', // Default to pending until the step is active
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
    svg.selectAll('*').remove(); // Clear previous render

    // Define the simulation
    const simulation = d3
      .forceSimulation<ChainNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<ChainNode, d3.SimulationLinkDatum<ChainNode>>(links)
          .id(d => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX())
      .force('y', d3.forceY());

    // Create a group for links
    const link = svg
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke-width', d => Math.sqrt(d.value) * 2)
      .attr('stroke', d => getStatusColor(d.status))
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

    // Create a group for nodes
    const node = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .on('click', function (event, d: ChainNode) {
        if (interactive && onNodeClick) {
          // Use event to provide visual feedback on click
          d3.select(this).classed('node-clicked', true);
          // Use event coordinates for potential tooltips or context menus
          console.warn(`Node clicked at x: ${event.x}, y: ${event.y}`);
          // After a short delay, remove the visual feedback
          setTimeout(() => {
            d3.select(this).classed('node-clicked', false);
          }, 300);

          onNodeClick(d.id, d.type);
        }
      })
      .call(
        d3
          .drag<SVGGElement, ChainNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    // Add node shapes (different shapes for converters and recipes)
    node
      .append('circle')
      .attr('r', d => (d.type === 'converter' ? 15 : 10))
      .attr('fill', d => (d.type === 'converter' ? '#4299e1' : '#ed8936'))
      .attr('stroke', d => getStatusColor(d.status))
      .attr('stroke-width', 2);

    // Add text labels
    node
      .append('text')
      .attr('dy', -20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e0')
      .text(d => d.name);

    // Add status indicators
    node
      .append('text')
      .attr('dy', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e0')
      .text(d => capitalizeFirstLetter(d.status.replace('_', ' ')));

    // Update node and link positions on simulation tick
    simulation.on('tick', () => {
      // Use safe accessors for link elements with source and target properties
      link
        .attr('x1', function (d) {
          return d3Accessors.getX(d.source);
        })
        .attr('y1', function (d) {
          return d3Accessors.getY(d.source);
        })
        .attr('x2', function (d) {
          return d3Accessors.getX(d.target);
        })
        .attr('y2', function (d) {
          return d3Accessors.getY(d.target);
        });

      node.attr('transform', (d: ChainNode) => `translate(${d.x},${d.y})`);
    });

    // Drag event handlers
    function dragstarted(event: d3.D3DragEvent<SVGGElement, ChainNode, ChainNode>, d: ChainNode) {
      if (!event.active) {
        simulation.alphaTarget(0.3).restart();
      }
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, ChainNode, ChainNode>, d: ChainNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, ChainNode, ChainNode>, d: ChainNode) {
      if (!event.active) {
        simulation.alphaTarget(0);
      }
      d.fx = null;
      d.fy = null;
    }
  }, [nodes, links, width, height, interactive, onNodeClick]);

  // Helper function to get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#48bb78'; // Green
      case 'in_progress':
        return '#f6ad55'; // Orange
      case 'failed':
        return '#f56565'; // Red
      case 'pending':
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

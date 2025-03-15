import * as d3 from 'd3';
import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import { createSimulationDragBehavior } from '../../../types/visualizations/D3DragTypes';
import { appendElement, createSvg } from '../../../types/visualizations/D3SelectionTypes';
import { SimulationNodeDatum } from '../../../types/visualizations/D3Types';
import {
  createSvgZoomBehavior,
  getFitToViewportTransform,
} from '../../../types/visualizations/D3ZoomTypes';

// Define the node interface with proper typing
interface Node extends SimulationNodeDatum {
  id: string;
  label: string;
  radius: number;
  color: string;
}

// Define the link interface with proper typing
interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
}

// Define the graph data structure
interface GraphData {
  nodes: Node[];
  links: Link[];
}

// Define component props
interface TypeSafeVisualizationDemoProps {
  width?: number;
  height?: number;
}

/**
 * TypeSafeVisualizationDemo Component
 *
 * This component demonstrates the use of type-safe D3 utilities
 * to create an interactive force-directed graph visualization.
 */
const TypeSafeVisualizationDemo: React.FC<TypeSafeVisualizationDemoProps> = ({
  width = 800,
  height = 600,
}) => {
  // Create a ref for the container element
  const containerRef = useRef<HTMLDivElement>(null);

  // Create a ref to store the container ID
  const containerIdRef = useRef<string>(`viz-container-${Math.random().toString(36).substr(2, 9)}`);

  // State for the graph data
  const [data, setData] = useState<GraphData>({
    nodes: [
      { id: '1', label: 'Node 1', radius: 20, color: '#ff7f0e', x: 100, y: 100 },
      { id: '2', label: 'Node 2', radius: 15, color: '#1f77b4', x: 200, y: 200 },
      { id: '3', label: 'Node 3', radius: 25, color: '#2ca02c', x: 300, y: 150 },
      { id: '4', label: 'Node 4', radius: 18, color: '#d62728', x: 250, y: 300 },
      { id: '5', label: 'Node 5', radius: 22, color: '#9467bd', x: 150, y: 250 },
    ],
    links: [
      { source: '1', target: '2', value: 1 },
      { source: '1', target: '3', value: 2 },
      { source: '2', target: '3', value: 1 },
      { source: '3', target: '4', value: 3 },
      { source: '4', target: '5', value: 1 },
      { source: '5', target: '1', value: 2 },
    ],
  });

  // Reference to the simulation
  const simulationRef = useRef<d3.Simulation<Node, undefined> | null>(null);

  // Effect to create and update the visualization
  useEffect(() => {
    // Skip if container or data is not available
    if (!containerRef.current || !data.nodes.length) return;

    // Clear existing SVG elements
    d3.select(containerRef.current).selectAll('svg').remove();

    // Set the container ID
    if (containerRef.current) {
      containerRef.current.setAttribute('id', containerIdRef.current);
    }

    // Create a new SVG with type-safe builder using a string selector
    const svg = createSvg(`#${containerIdRef.current}`, width, height);

    // Create a group for the graph elements
    const g = appendElement<SVGSVGElement, unknown, HTMLElement, unknown, SVGGElement>(
      svg.selection,
      'g'
    );

    // Create a simulation with type safety
    const simulation = d3
      .forceSimulation<Node>()
      .force(
        'link',
        d3.forceLink<Node, Link>().id((d: Node) => d.id)
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide<Node>().radius((d: Node) => d.radius + 5)
      );

    // Store the simulation in the ref
    simulationRef.current = simulation;

    // Create links with type-safe builder
    const links = appendElement<SVGGElement, unknown, HTMLElement, unknown, SVGLineElement>(
      g,
      'line'
    )
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: Link) => Math.sqrt(d.value));

    // Create a merged selection for nodes
    const nodes = g
      .selectAll<SVGCircleElement, Node>('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', (d: Node) => d.radius)
      .attr('fill', (d: Node) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Create labels for nodes
    const labels = g
      .selectAll<SVGTextElement, Node>('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .text((d: Node) => d.label);

    // Create type-safe drag behavior for nodes
    const dragBehavior = createSimulationDragBehavior<Node>(simulation);

    // Apply drag behavior to nodes

    nodes.call(dragBehavior as unknown as d3.DragBehavior<SVGCircleElement, Node, unknown>);

    // Create zoom behavior
    const zoomBehavior = createSvgZoomBehavior({
      targetElement: g,
      scaleExtentMin: 0.1,
      scaleExtentMax: 4,
      initialTransform: d3.zoomIdentity,
    });

    // Apply zoom behavior to SVG
    svg.selection.call(zoomBehavior);

    // Update function for the simulation
    simulation.nodes(data.nodes).on('tick', () => {
      links
        .attr('x1', (d: Link) => {
          const source = d.source as Node;
          return source.x || 0;
        })
        .attr('y1', (d: Link) => {
          const source = d.source as Node;
          return source.y || 0;
        })
        .attr('x2', (d: Link) => {
          const target = d.target as Node;
          return target.x || 0;
        })
        .attr('y2', (d: Link) => {
          const target = d.target as Node;
          return target.y || 0;
        });

      nodes.attr('cx', (d: Node) => d.x || 0).attr('cy', (d: Node) => d.y || 0);

      labels.attr('x', (d: Node) => d.x || 0).attr('y', (d: Node) => d.y || 0);
    });

    // Set up the link force with the links data
    const linkForce = simulation.force('link') as d3.ForceLink<Node, Link>;
    linkForce.links(data.links);

    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [data, width, height]);

  // Function to add a new node
  const addNode = () => {
    const newId = (data.nodes.length + 1).toString();
    const colors = ['#ff7f0e', '#1f77b4', '#2ca02c', '#d62728', '#9467bd'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    setData(prevData => {
      const newNode: Node = {
        id: newId,
        label: `Node ${newId}`,
        radius: 15 + Math.random() * 10,
        color: randomColor,
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 2 + (Math.random() - 0.5) * 100,
      };

      const newLink: Link = {
        source: newId,
        target: data.nodes[Math.floor(Math.random() * data.nodes.length)].id,
        value: 1 + Math.floor(Math.random() * 3),
      };

      return {
        nodes: [...prevData.nodes, newNode],
        links: [...prevData.links, newLink],
      };
    });
  };

  // Function to remove a random node
  const removeNode = () => {
    if (data.nodes.length <= 1) return;

    setData(prevData => {
      const indexToRemove = Math.floor(Math.random() * prevData.nodes.length);
      const nodeIdToRemove = prevData.nodes[indexToRemove].id;

      return {
        nodes: prevData.nodes.filter(node => node.id !== nodeIdToRemove),
        links: prevData.links.filter(link => {
          const sourceId = typeof link.source === 'string' ? link.source : (link.source as Node).id;
          const targetId = typeof link.target === 'string' ? link.target : (link.target as Node).id;
          return sourceId !== nodeIdToRemove && targetId !== nodeIdToRemove;
        }),
      };
    });
  };

  // Function to reset the view
  const resetView = () => {
    if (!containerRef.current) return;

    const svg = d3.select(containerRef.current).select('svg');
    // Prefix with underscore to indicate intentionally unused variable
    const _g = svg.select('g');

    // Get the fit transform
    const fitTransform = getFitToViewportTransform(width, height, width, height, 50);

    // Apply a smooth transition
    const zoom = d3.zoom<SVGSVGElement, unknown>();

    // D3's zoom.transform expects a selection but we're calling it on a transition
    // This is a known limitation in D3's TypeScript definitions where the types
    // don't properly support calling transform on a transition
    svg
      .transition()
      .duration(750)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(zoom.transform as any, fitTransform);
  };

  return (
    <div className="type-safe-visualization-demo">
      <div className="controls">
        <button onClick={addNode}>Add Node</button>
        <button onClick={removeNode}>Remove Node</button>
        <button onClick={resetView}>Reset View</button>
      </div>
      <div
        ref={containerRef}
        id={containerIdRef.current}
        className="visualization-container"
        style={{ width: `${width}px`, height: `${height}px`, border: '1px solid #ccc' }}
      />
    </div>
  );
};

export default TypeSafeVisualizationDemo;

/**
 * Type-Safe Visualization Demo
 *
 * This component demonstrates the use of type-safe D3 utilities for drag, zoom,
 * and selection operations. It provides an interactive visualization to showcase
 * how these type-safe wrappers improve development experience and code quality.
 */

import * as d3 from 'd3';
import React, { useEffect, useRef, useState } from 'react';
import { createSimulationDragBehavior } from '../../../types/visualizations/D3DragTypes';
import {
  createDefs,
  createMarker,
  createSvg,
} from '../../../types/visualizations/D3SelectionTypes';
import { SimulationNodeDatum } from '../../../types/visualizations/D3Types';
import {
  createSvgZoomBehavior,
  getFitToViewportTransform,
} from '../../../types/visualizations/D3ZoomTypes';

// Define the node data structure
interface Node extends SimulationNodeDatum {
  id: string;
  name: string;
  group: number;
  radius: number;
  color: string;
}

// Define the link data structure
interface Link {
  id: string;
  source: string | Node;
  target: string | Node;
  value: number;
}

// Define the graph data structure
interface GraphData {
  nodes: Node[];
  links: Link[];
}

// Props for the visualization demo
interface TypeSafeVisualizationDemoProps {
  width?: number;
  height?: number;
}

/**
 * A demonstration component that showcases type-safe D3 utilities
 */
const TypeSafeVisualizationDemo: React.FC<TypeSafeVisualizationDemoProps> = ({
  width = 800,
  height = 600,
}) => {
  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<d3.Simulation<Node, undefined> | null>(null);

  // State
  const [data, setData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Generate sample data on component mount
  useEffect(() => {
    const sampleData = generateSampleData();
    setData(sampleData);
  }, []);

  // Initialize the visualization when data is available
  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return;

    // Clear any existing SVG
    d3.select(containerRef.current).selectAll('svg').remove();

    // Create SVG with type-safe builder
    const parentSelection = d3.select(containerRef.current) as unknown as d3.Selection<
      HTMLElement,
      unknown,
      HTMLElement,
      unknown
    >;
    const svgBuilder = createSvg(parentSelection, width, height);

    const svg = svgBuilder.selection;
    // Store the SVG element in the ref
    svgRef.current = svg.node();

    // Create defs and marker for arrows
    const defs = createDefs(svg);
    createMarker(defs, 'arrow', {
      refX: 15,
      refY: 5,
      path: 'M0,0L10,5L0,10z',
      color: '#666',
    });

    // Create the main container group that will be transformed during zoom
    const container = svg.append<SVGGElement>('g').attr('class', 'container');

    // Create groups for links and nodes
    const linksGroup = container.append<SVGGElement>('g').attr('class', 'links');

    const nodesGroup = container.append<SVGGElement>('g').attr('class', 'nodes');

    // Create node map for lookup
    const nodeMap = new Map<string, Node>();
    data.nodes.forEach(node => nodeMap.set(node.id, node));

    // Process link references
    const links = data.links.map(link => {
      return {
        ...link,
        source:
          typeof link.source === 'string' ? nodeMap.get(link.source) || link.source : link.source,
        target:
          typeof link.target === 'string' ? nodeMap.get(link.target) || link.target : link.target,
      };
    });

    // Create the simulation
    const simulation = d3
      .forceSimulation<Node>(data.nodes)
      .force(
        'link',
        d3
          .forceLink<Node, d3.SimulationLinkDatum<Node>>(links)
          .id(d => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody<Node>().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide<Node>().radius(d => d.radius + 5)
      )
      .alpha(1)
      .alphaDecay(0.02);

    // Store the simulation reference
    simulationRef.current = simulation;

    // Create links with type-safe utilities
    const linkElements = linksGroup.selectAll<SVGLineElement, Link>('line').data(links, d => d.id);

    const linkEnter = linkElements
      .enter()
      .append<SVGLineElement>('line')
      .attr('stroke', '#666')
      .attr('stroke-width', d => Math.sqrt(d.value))
      .attr('marker-end', 'url(#arrow)');

    // Create nodes with type-safe utilities
    const nodeElements = nodesGroup
      .selectAll<SVGGElement, Node>('g.node')
      .data(data.nodes, d => d.id);

    const nodeEnter = nodeElements.enter().append<SVGGElement>('g').attr('class', 'node');

    // Add circles to nodes
    nodeEnter
      .append<SVGCircleElement>('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add text labels to nodes
    nodeEnter
      .append<SVGTextElement>('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .text(d => d.name)
      .attr('fill', '#fff')
      .attr('font-size', 12)
      .attr('pointer-events', 'none');

    // Create the merged selections
    const link = linkEnter;
    const node = nodeEnter;

    // Create type-safe drag behavior for nodes
    const dragBehavior = createSimulationDragBehavior<Node, SVGGElement>(simulation, {
      onDragStart: event => {
        // Select node on drag start
        setSelectedNodeId((event.subject as Node).id);
      },
    });

    // Apply drag behavior to nodes
    node.call(dragBehavior as d3.DragBehavior<SVGGElement, Node, object>);

    // Create type-safe zoom behavior
    const zoomBehavior = createSvgZoomBehavior<SVGSVGElement>({
      scaleExtentMin: 0.1,
      scaleExtentMax: 4,
      targetElement: container,
      onZoom: event => {
        setZoomLevel(event.transform.k);
      },
    });

    // Apply zoom behavior to SVG
    svg.call(zoomBehavior);

    // Fit the graph to the viewport initially
    svg.call(zoomBehavior.transform, getFitToViewportTransform(width, height, width, height, 50));

    // Add click handler to select nodes
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNodeId(d.id);
    });

    // Add click handler to SVG to deselect
    svg.on('click', () => {
      setSelectedNodeId(null);
    });

    // Update function for simulation ticks
    simulation.on('tick', () => {
      // Update link positions with type-safe attribute setting
      link
        .attr('x1', d => (d.source as Node).x || 0)
        .attr('y1', d => (d.source as Node).y || 0)
        .attr('x2', d => (d.target as Node).x || 0)
        .attr('y2', d => (d.target as Node).y || 0);

      // Update node positions with type-safe attribute setting
      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [data, width, height]);

  // Update node highlighting when selection changes
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Highlight selected node
    svg.selectAll<SVGGElement, Node>('g.node').each(function (d) {
      const element = d3.select(this);
      const isSelected = d.id === selectedNodeId;

      element
        .select('circle')
        .transition()
        .duration(200)
        .attr('stroke', isSelected ? '#ff0' : '#fff')
        .attr('stroke-width', isSelected ? 4 : 2);

      element
        .select('text')
        .transition()
        .duration(200)
        .attr('font-weight', isSelected ? 'bold' : 'normal')
        .attr('font-size', isSelected ? 14 : 12);
    });
  }, [selectedNodeId]);

  // Generate sample graph data
  const generateSampleData = (): GraphData => {
    const nodeCount = 20;
    const linkCount = 30;

    // Create nodes
    const nodes: Node[] = Array.from({ length: nodeCount }, (_, i) => {
      const group = Math.floor(Math.random() * 5);
      const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];

      return {
        id: `node-${i}`,
        name: `N${i}`,
        group,
        radius: 10 + Math.random() * 10,
        color: colors[group],
        x: Math.random() * width,
        y: Math.random() * height,
      };
    });

    // Create links
    const links: Link[] = Array.from({ length: linkCount }, (_, i) => {
      const source = `node-${Math.floor(Math.random() * nodeCount)}`;
      let target = `node-${Math.floor(Math.random() * nodeCount)}`;

      // Ensure source and target are different
      while (target === source) {
        target = `node-${Math.floor(Math.random() * nodeCount)}`;
      }

      return {
        id: `link-${i}`,
        source,
        target,
        value: 1 + Math.random() * 5,
      };
    });

    return { nodes, links };
  };

  // Add a new node at a random position
  const handleAddNode = () => {
    if (!data.nodes.length) return;

    const newNode: Node = {
      id: `node-${data.nodes.length}`,
      name: `N${data.nodes.length}`,
      group: Math.floor(Math.random() * 5),
      radius: 10 + Math.random() * 10,
      color: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'][Math.floor(Math.random() * 5)],
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
    };

    // Add links to random existing nodes
    const newLinks: Link[] = Array.from({ length: 2 }, (_, i) => {
      const targetIndex = Math.floor(Math.random() * data.nodes.length);

      return {
        id: `link-${data.links.length + i}`,
        source: newNode.id,
        target: data.nodes[targetIndex].id,
        value: 1 + Math.random() * 5,
      };
    });

    // Update data with new node and links
    setData(prevData => ({
      nodes: [...prevData.nodes, newNode],
      links: [...prevData.links, ...newLinks],
    }));
  };

  // Reset zoom to fit the entire graph
  const handleResetZoom = () => {
    if (!svgRef.current || !simulationRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', null);

    // Get the fit transform
    const transform = getFitToViewportTransform(width, height, width, height, 50);

    // Apply the transform smoothly
    svg
      .transition()
      .duration(750)
      .call(
        // Use a type assertion that matches what d3 expects for transitions
        zoom.transform as unknown as (
          selection: d3.Transition<SVGSVGElement, unknown, null, undefined>,
          transform: d3.ZoomTransform
        ) => void,
        transform
      );
  };

  return (
    <div className="type-safe-visualization-demo">
      <div className="controls">
        <div className="info">
          <h3>Type-Safe D3 Interaction Demo</h3>
          <p>Current zoom level: {zoomLevel.toFixed(2)}x</p>
          {selectedNodeId && <p>Selected node: {selectedNodeId}</p>}
        </div>
        <div className="buttons">
          <button onClick={handleAddNode}>Add Node</button>
          <button onClick={handleResetZoom}>Reset Zoom</button>
        </div>
      </div>

      <div className="visualization-container" ref={containerRef}></div>

      <div className="instructions">
        <h4>Interactions:</h4>
        <ul>
          <li>
            <strong>Drag Nodes:</strong> Click and drag nodes to reposition them
          </li>
          <li>
            <strong>Zoom:</strong> Use mouse wheel or pinch gestures to zoom in/out
          </li>
          <li>
            <strong>Pan:</strong> Click and drag the background to pan the view
          </li>
          <li>
            <strong>Select:</strong> Click on a node to select it
          </li>
        </ul>
      </div>

      <style jsx>{`
        .type-safe-visualization-demo {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          padding: 20px;
          box-sizing: border-box;
        }

        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .info h3 {
          margin: 0 0 5px 0;
        }

        .info p {
          margin: 5px 0;
        }

        .buttons {
          display: flex;
          gap: 10px;
        }

        .buttons button {
          padding: 8px 16px;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .buttons button:hover {
          background-color: #3367d6;
        }

        .visualization-container {
          flex: 1;
          min-height: ${height}px;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
          background-color: #f9f9f9;
        }

        .visualization-container svg {
          width: 100%;
          height: 100%;
        }

        .instructions {
          margin-top: 15px;
          padding: 10px;
          background-color: #f0f0f0;
          border-radius: 4px;
        }

        .instructions h4 {
          margin: 0 0 10px 0;
        }

        .instructions ul {
          margin: 0;
          padding-left: 20px;
        }

        .instructions li {
          margin-bottom: 5px;
        }
      `}</style>
    </div>
  );
};

export default TypeSafeVisualizationDemo;

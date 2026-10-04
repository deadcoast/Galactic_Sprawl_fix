/**
 * Optimized Flow Diagram
 *
 * This component implements the FlowDiagram with performance optimizations
 * identified by our profiling tools. It serves as a demonstration of how
 * to apply performance improvements to D3 visualizations.
 */

import * as d3 from 'd3';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SimulationNodeDatum } from '../../../types/visualizations/D3Types';
import {
  optimizeVisualization,
  PerformanceOptimizationConfig,
} from '../../../utils/performance/D3PerformanceOptimizations';
import { memoizedD3Accessors } from '../../../utils/performance/D3PerformanceProfiler';

// Interface for flow diagram nodes
export interface FlowNode extends SimulationNodeDatum {
  id: string;
  name: string;
  type: 'source' | 'processor' | 'sink';
  value: number;
  description?: string;
}

// Interface for flow diagram links
export interface FlowLink {
  id: string;
  source: string;
  target: string;
  value: number;
  flowType?: string;
}

// Flow data structure
export interface FlowData {
  nodes: FlowNode[];
  links: FlowLink[];
}

// Flow diagram props
interface OptimizedFlowDiagramProps {
  data: FlowData;
  width: number;
  height: number;
  onSimulationCreated?: (simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) => void;
  optimizationConfig?: Partial<PerformanceOptimizationConfig>;
  showPerformanceStats?: boolean;
}

/**
 * A performance-optimized version of the FlowDiagram component
 */
const OptimizedFlowDiagram: React.FC<OptimizedFlowDiagramProps> = ({
  data,
  width,
  height,
  onSimulationCreated,
  optimizationConfig = {},
  showPerformanceStats = false,
}) => {
  // References
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
  const optimizedTickerRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  // Performance metrics state
  const [frameRate, setFrameRate] = useState<number>(0);
  const [tickTime, setTickTime] = useState<number>(0);
  const [lastFrameTime, setLastFrameTime] = useState<number>(0);
  const fpsCounterRef = useRef<number[]>([]);
  const tickCounterRef = useRef<number[]>([]);

  // Cache for D3 nodes that include both node data and simulation properties
  const [d3Nodes, setD3Nodes] = useState<(FlowNode & d3.SimulationNodeDatum)[]>([]);
  const [d3Links, setD3Links] = useState<d3.SimulationLinkDatum<d3.SimulationNodeDatum>[]>([]);

  // Prepare data and initialize simulation
  useEffect(() => {
    if (!svgRef.current) return;

    // Clean up previous simulation if it exists
    if (optimizedTickerRef.current) {
      optimizedTickerRef.current.stop();
      optimizedTickerRef.current = null;
    }

    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }

    // Clear the SVG
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG elements
    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);

    // Create container for links and nodes
    const g = svg.append('g').attr('class', 'flow-diagram-container');

    // Create arrow marker definition
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Prepare node data with D3 simulation properties
    const nodes = data?.nodes.map(node => ({
      ...node,
      x: node.x ?? Math.random() * width,
      y: node.y ?? Math.random() * height,
      fx: node.type === 'source' ? 50 : undefined,
      fy: node.type === 'source' ? height / 2 : undefined,
    }));

    // Set sink nodes to right side
    nodes.forEach(node => {
      if (node.type === 'sink') {
        node.fx = width - 50;
        node.fy = height / 2;
      }
    });

    // Create node index for efficient lookup
    const nodeMap = new Map<string, FlowNode & d3.SimulationNodeDatum>();
    nodes.forEach(node => nodeMap.set(node.id, node));

    // Prepare links with correct references
    const links = data?.links.map(link => {
      const sourceNode = nodeMap.get(link.source);
      const targetNode = nodeMap.get(link.target);

      return {
        ...link,
        source: sourceNode ?? link.source,
        target: targetNode ?? link.target,
      };
    });

    // Update state with prepared data
    setD3Nodes(nodes);
    setD3Links(links);

    // Create force simulation
    const simulation = d3
      .forceSimulation<d3.SimulationNodeDatum>(nodes)
      .force(
        'link',
        d3
          .forceLink<d3.SimulationNodeDatum, d3.SimulationLinkDatum<d3.SimulationNodeDatum>>(links)
          .id(d => (d as FlowNode).id)
          .distance(50)
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Save the simulation reference
    simulationRef.current = simulation;

    // Notify parent if needed
    if (onSimulationCreated) {
      onSimulationCreated(simulation);
    }

    // Create link elements
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke-width', d => Math.sqrt((d as FlowLink).value) || 1)
      .attr('stroke', '#999')
      .attr('marker-end', 'url(#arrowhead)');

    // Create node elements
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g');

    // Apply drag behavior with type assertion to avoid type errors
    const dragBehavior = d3
      .drag<SVGGElement, d3.SimulationNodeDatum>()
      .on('start', dragStarted)
      .on('drag', dragging)
      .on('end', dragEnded);

    // Use a more specific type assertion to bypass the complex type checking
    (node as d3.Selection<SVGGElement, FlowNode, SVGGElement, unknown>).call(
      dragBehavior as unknown as d3.DragBehavior<SVGGElement, FlowNode, unknown>
    );

    // Add circles to nodes
    node
      .append('circle')
      .attr('r', d => Math.sqrt((d as FlowNode).value) + 5)
      .attr('fill', d => {
        const node = d as FlowNode;
        switch (node.type) {
          case 'source':
            return '#4CAF50';
          case 'processor':
            return '#2196F3';
          case 'sink':
            return '#F44336';
          default:
            return '#9E9E9E';
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add text labels to nodes
    node
      .append('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text(d => (d as FlowNode).name)
      .attr('font-size', '10px')
      .attr('fill', '#333');

    // Optimize the simulation and create performance-optimized ticker
    const updatePositions = () => {
      // Measure tick time for performance stats
      const startTime = performance.now();

      // Update link positions
      link
        .attr('x1', d => memoizedD3Accessors.getX(d.source as unknown as object))
        .attr('y1', d => memoizedD3Accessors.getY(d.source as unknown as object))
        .attr('x2', d => memoizedD3Accessors.getX(d.target as unknown as object))
        .attr('y2', d => memoizedD3Accessors.getY(d.target as unknown as object));

      // Update node positions
      node.attr(
        'transform',
        d => `translate(${memoizedD3Accessors.getX(d)},${memoizedD3Accessors.getY(d)})`
      );

      // Measure and record performance metrics
      if (showPerformanceStats) {
        const endTime = performance.now();
        const frameDuration = endTime - startTime;

        // Record tick time
        tickCounterRef.current.push(frameDuration);
        if (tickCounterRef.current.length > 30) {
          tickCounterRef.current.shift();
        }

        // Calculate average tick time
        const avgTickTime =
          tickCounterRef.current.reduce((sum, time) => sum + time, 0) /
          tickCounterRef.current.length;
        setTickTime(avgTickTime);

        // Calculate FPS
        const now = performance.now();
        const frameInterval = now - lastFrameTime;
        setLastFrameTime(now);

        if (frameInterval > 0) {
          const currentFps = 1000 / frameInterval;
          fpsCounterRef.current.push(currentFps);
          if (fpsCounterRef.current.length > 30) {
            fpsCounterRef.current.shift();
          }

          const avgFps =
            fpsCounterRef.current.reduce((sum, fps) => sum + fps, 0) / fpsCounterRef.current.length;
          setFrameRate(avgFps);
        }
      }
    };

    // Create the optimized ticker for performance
    optimizedTickerRef.current = optimizeVisualization(
      simulation,
      updatePositions,
      optimizationConfig
    );

    // Start the simulation with optimizations
    optimizedTickerRef.current.start();

    // Drag functions
    function dragStarted(
      event: d3.D3DragEvent<SVGGElement, d3.SimulationNodeDatum, d3.SimulationNodeDatum>
    ) {
      if (!event?.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart();
      const d = event?.subject;
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragging(
      event: d3.D3DragEvent<SVGGElement, d3.SimulationNodeDatum, d3.SimulationNodeDatum>
    ) {
      const d = event?.subject;
      d.fx = event?.x;
      d.fy = event?.y;
    }

    function dragEnded(
      event: d3.D3DragEvent<SVGGElement, d3.SimulationNodeDatum, d3.SimulationNodeDatum>
    ) {
      if (!event?.active && simulationRef.current) simulationRef.current.alphaTarget(0);
      const d = event?.subject;
      // Don't release fixed positions for source and sink nodes
      if ((d as FlowNode).type !== 'source' && (d as FlowNode).type !== 'sink') {
        d.fx = null;
        d.fy = null;
      }
    }

    // Cleanup function
    return () => {
      if (optimizedTickerRef.current) {
        optimizedTickerRef.current.stop();
      }
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [data, width, height, onSimulationCreated, optimizationConfig]);

  // (...args: unknown[]) => unknown to manually restart the simulation (e.g., after configuration changes)
  const restartSimulation = useCallback(() => {
    if (simulationRef.current && optimizedTickerRef.current) {
      simulationRef.current.alpha(1).restart();
      optimizedTickerRef.current.start();
    }
  }, []);

  return (
    <div className="optimized-flow-diagram">
      <svg ref={svgRef}></svg>

      {showPerformanceStats && (
        <div className="performance-stats">
          <div className="stat-row">
            <span className="stat-label">FPS:</span>
            <span className="stat-value">{frameRate.toFixed(1)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Render Time:</span>
            <span className="stat-value">{tickTime.toFixed(2)} ms</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Nodes:</span>
            <span className="stat-value">{d3Nodes.length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Links:</span>
            <span className="stat-value">{d3Links.length}</span>
          </div>
          <button className="restart-btn" onClick={restartSimulation}>
            Restart Simulation
          </button>
        </div>
      )}

      <style>
        {`
        .optimized-flow-diagram {
          position: relative;
          border: 1px solid var(--gs-border);
          border-radius: 4px;
          overflow: hidden;
          background: var(--gs-surface-1);
        }

        .optimized-flow-diagram svg {
          display: block;
        }

        .optimized-flow-diagram .performance-stats {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(14, 29, 51, 0.9);
          border: 1px solid var(--gs-border);
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 12px;
          font-family: monospace;
          color: var(--gs-text-1);
          box-shadow: 0 8px 20px rgba(3, 12, 27, 0.35);
        }

        .optimized-flow-diagram .stat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .optimized-flow-diagram .stat-label {
          font-weight: bold;
          margin-right: 8px;
          color: var(--gs-text-2);
        }

        .optimized-flow-diagram .stat-value {
          color: #60a5fa;
        }

        .optimized-flow-diagram .restart-btn {
          margin-top: 8px;
          padding: 4px 8px;
          background: linear-gradient(180deg, #3578ef, #2b63ca);
          border: 1px solid #2f63cc;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          cursor: pointer;
          width: 100%;
        }

        .optimized-flow-diagram .restart-btn:hover {
          background: linear-gradient(180deg, #3b82f6, #2f6ed8);
        }
        `}
      </style>
    </div>
  );
};

export default OptimizedFlowDiagram;

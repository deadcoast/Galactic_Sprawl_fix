/**
 * D3 Performance Profiler View
 *
 * This component provides an interface for profiling D3 visualizations
 * and identifying performance bottlenecks.
 */

import * as d3 from 'd3';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { FlowData } from '../../../types/visualizations/FlowTypes';
import {
  ForceSimulationProfiler,
  memoizedD3Accessors,
  PerformanceProfile,
  profileCoordinateAccess,
  profileDOMOperations,
} from '../../../utils/performance/D3PerformanceProfiler';
import FlowDiagram from '../visualization/FlowDiagram';
// Add import for error logging service
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../../services/ErrorLoggingService';

// Sample flow data for testing
const generateTestFlowData = (nodeCount: number, linkCount: number): FlowData => {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    name: `Node ${i}`,
    type: (['source', 'process', 'destination'] as const)[Math.floor(Math.random() * 3)],
    value: Math.random() * 100,
  }));

  const links = Array.from({ length: linkCount }, (_, i) => {
    const source = `node-${Math.floor(Math.random() * nodeCount)}`;
    let target = `node-${Math.floor(Math.random() * nodeCount)}`;
    // Ensure target is different from source
    while (target === source) {
      target = `node-${Math.floor(Math.random() * nodeCount)}`;
    }
    return {
      id: `link-${i}`,
      source,
      target,
      value: Math.random() * 50,
      active: true,
    };
  });

  return { nodes, links };
};

// Performance Profiler View component
const D3PerformanceProfilerView: React.FC = () => {
  // State for test configuration
  const [nodeCount, setNodeCount] = useState<number>(50);
  const [linkCount, setLinkCount] = useState<number>(75);
  const [iterations, setIterations] = useState<number>(1000);
  const [profileData, setProfileData] = useState<PerformanceProfile | null>(null);
  const [testDataset, setTestDataset] = useState<FlowData>(generateTestFlowData(50, 75));
  const [profilingMethod, setProfilingMethod] = useState<string>('dom');
  const [isProfileRunning, setIsProfileRunning] = useState<boolean>(false);
  const [useMemoizedAccessors, setUseMemoizedAccessors] = useState<boolean>(false);

  // References
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
  const profilerRef = useRef<ForceSimulationProfiler | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset test dataset when node or link count changes
  useEffect(() => {
    setTestDataset(generateTestFlowData(nodeCount, linkCount));
  }, [nodeCount, linkCount]);

  // Clean up simulation profiler when component unmounts
  useEffect(() => {
    return () => {
      if (profilerRef.current && simulationRef.current) {
        profilerRef.current.detachFromSimulation();
      }
    };
  }, []);

  // Run profiling based on selected method
  const runProfiling = async () => {
    setIsProfileRunning(true);
    setProfileData(null);

    // Use setTimeout to allow UI to update before starting potentially heavy profiling
    setTimeout(() => {
      try {
        let profileResult: PerformanceProfile | null = null;

        if (profilingMethod === 'simulation') {
          // For simulation profiling, we'll use a mock simulation since we can't access the real one
          const mockSimulation = d3
            .forceSimulation<d3.SimulationNodeDatum>()
            .force('link', d3.forceLink())
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter());

          // Profile force simulation
          const simProfiler = new ForceSimulationProfiler();
          profilerRef.current = simProfiler;

          simProfiler.attachToSimulation(mockSimulation);

          // Run some iterations to profile performance
          for (let i = 0; i < Math.min(iterations, 300); i++) {
            mockSimulation.tick();
          }

          profileResult = simProfiler.getProfile();
          simProfiler.detachFromSimulation();
        } else if (profilingMethod === 'accessor') {
          // Generate test nodes
          const testNodes = Array.from({ length: nodeCount }, (_, i) => ({
            id: `node-${i}`,
            x: Math.random() * 800,
            y: Math.random() * 600,
            vx: Math.random() * 5 - 2.5,
            vy: Math.random() * 5 - 2.5,
          }));

          // Profile accessor methods
          profileResult = profileCoordinateAccess(testNodes, iterations);
        } else if (profilingMethod === 'dom' && containerRef.current) {
          // Profile DOM operations
          profileResult = profileDOMOperations('#viz-profile-container', nodeCount);
        }

        setProfileData(profileResult);
        setIsProfileRunning(false);
      } catch (error) {
        // Replace console.error with errorLoggingService.logError
        errorLoggingService.logError(
          error instanceof Error ? error : new Error('Error during profiling'),
          ErrorType.RUNTIME,
          ErrorSeverity.HIGH,
          {
            componentName: 'D3PerformanceProfilerView',
            action: 'runProfiling',
            profilingMethod,
            nodeCount,
            linkCount,
            iterations,
          }
        );
        setIsProfileRunning(false);
      }
    }, 100);
  };

  // Apply optimizations based on profiling results
  const applyOptimizations = () => {
    if (!profileData) {
      return;
    }

    // Implementation will vary based on optimization strategy selected
    // For now, we'll just toggle memoized accessors as an example
    setUseMemoizedAccessors(!useMemoizedAccessors);

    // Clear existing memoization cache if turning it off
    if (useMemoizedAccessors) {
      memoizedD3Accessors.clearAllCache();
    }
  };

  // Render bar chart for measurement durations
  const renderMeasurementChart = () => {
    if (!profileData || profileData.measurements.length === 0) {
      return null;
    }

    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const xScale = d3
      .scaleBand()
      .domain(profileData.measurements.map(m => m.name))
      .range([0, width])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(profileData.measurements, m => m.durationMs) ?? 0])
      .nice()
      .range([height, 0]);

    // Use useEffect to create the chart
    useEffect(() => {
      if (!profileData) {
        return;
      }

      // Clear previous chart
      d3.select('#measurement-chart').selectAll('*').remove();

      const svg = d3
        .select('#measurement-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Add X axis
      svg
        .append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em');

      // Add Y axis
      svg.append('g').call(d3.axisLeft(yScale));

      // Add X axis label
      svg
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height + margin.top + 40)
        .text('Measurement');

      // Add Y axis label
      svg
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 20)
        .attr('x', -height / 2)
        .text('Duration (ms)');

      // Add bars
      svg
        .selectAll('.bar')
        .data(profileData.measurements)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.name) ?? 0)
        .attr('width', xScale.bandwidth())
        .attr('y', d => yScale(d.durationMs))
        .attr('height', d => height - yScale(d.durationMs))
        .attr('fill', d => (d.isBottleneck ? '#ff4d4d' : '#4da6ff'));

      // Add value labels
      svg
        .selectAll('.label')
        .data(profileData.measurements)
        .enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', d => (xScale(d.name) ?? 0) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.durationMs) - 5)
        .attr('text-anchor', 'middle')
        .text(d => `${d.durationMs.toFixed(2)}ms`);
    }, [profileData]);

    return <div id="measurement-chart"></div>;
  };

  return (
    <div className="d3-performance-profiler">
      <h2>D3 Visualization Performance Profiler</h2>

      <div className="profiler-controls">
        <div className="control-group">
          <h3>Test Configuration</h3>

          <div className="control-row">
            <label htmlFor="profilingMethod">Profiling Method:</label>
            <select
              id="profilingMethod"
              value={profilingMethod}
              onChange={e => setProfilingMethod(e.target.value)}
            >
              <option value="simulation">Force Simulation</option>
              <option value="accessor">Coordinate Accessor</option>
              <option value="dom">DOM Operations</option>
            </select>
          </div>

          <div className="control-row">
            <label htmlFor="nodeCount">Node Count:</label>
            <input
              id="nodeCount"
              type="number"
              min="10"
              max="1000"
              value={nodeCount}
              onChange={e => setNodeCount(Number(e.target.value))}
            />
          </div>

          <div className="control-row">
            <label htmlFor="linkCount">Link Count:</label>
            <input
              id="linkCount"
              type="number"
              min="10"
              max="2000"
              value={linkCount}
              onChange={e => setLinkCount(Number(e.target.value))}
            />
          </div>

          <div className="control-row">
            <label htmlFor="iterations">Iterations:</label>
            <input
              id="iterations"
              type="number"
              min="100"
              max="10000"
              value={iterations}
              onChange={e => setIterations(Number(e.target.value))}
            />
          </div>

          <div className="control-row">
            <button onClick={runProfiling} disabled={isProfileRunning}>
              {isProfileRunning ? 'Profiling...' : 'Run Profiling'}
            </button>

            <button onClick={applyOptimizations} disabled={!profileData || isProfileRunning}>
              {useMemoizedAccessors ? 'Use Standard Accessors' : 'Use Memoized Accessors'}
            </button>
          </div>
        </div>
      </div>

      {/* Visualization container for profiling */}
      <div className="visualization-container">
        <h3>Visualization Preview</h3>
        <div id="viz-profile-container" ref={containerRef}>
          {profilingMethod === 'simulation' && (
            <FlowDiagram
              data={testDataset}
              width={800}
              height={600}
              interactive={true}
              animated={true}
            />
          )}
        </div>
      </div>

      {/* Profiling results */}
      {profileData && (
        <div className="profiling-results">
          <h3>Profiling Results</h3>

          <div className="results-summary">
            <p>
              <strong>Total Duration:</strong> {profileData.totalDurationMs.toFixed(2)}ms
            </p>
            <p>
              <strong>Bottlenecks Found:</strong> {profileData.bottlenecks.length}
            </p>
          </div>

          {renderMeasurementChart()}

          <div className="recommendations">
            <h4>Optimization Recommendations</h4>
            <ul>
              {profileData.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

          <div className="detailed-measurements">
            <h4>Detailed Measurements</h4>
            <table>
              <thead>
                <tr>
                  <th>Operation</th>
                  <th>Type</th>
                  <th>Duration (ms)</th>
                  <th>Operations</th>
                  <th>Bottleneck</th>
                </tr>
              </thead>
              <tbody>
                {profileData.measurements.map((measurement, index) => (
                  <tr key={index} className={measurement.isBottleneck ? 'bottleneck-row' : ''}>
                    <td>{measurement.name}</td>
                    <td>{measurement.type}</td>
                    <td>{measurement.durationMs.toFixed(2)}</td>
                    <td>{measurement.operationCount}</td>
                    <td>{measurement.isBottleneck ? '⚠️ Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>
        {`
        .d3-performance-profiler {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .profiler-controls {
          margin-bottom: 20px;
          display: flex;
          gap: 20px;
        }

        .control-group {
          padding: 15px;
          border: 1px solid #ccc;
          border-radius: 5px;
          background-color: #f9f9f9;
        }

        .control-row {
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }

        .control-row label {
          width: 150px;
          display: inline-block;
        }

        .control-row input,
        .control-row select {
          padding: 5px;
          width: 150px;
        }

        .control-row button {
          margin-right: 10px;
          padding: 8px 16px;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .control-row button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .visualization-container {
          margin-bottom: 20px;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }

        .profiling-results {
          padding: 15px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }

        .results-summary {
          display: flex;
          gap: 20px;
        }

        .recommendations {
          margin-top: 20px;
        }

        .detailed-measurements {
          margin-top: 20px;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }

        th {
          background-color: #f2f2f2;
        }

        .bottleneck-row {
          background-color: #ffe6e6;
        }
        `}
      </style>
    </div>
  );
};

export default D3PerformanceProfilerView;

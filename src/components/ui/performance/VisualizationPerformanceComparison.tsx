/**
 * Visualization Performance Comparison
 *
 * This component demonstrates the performance improvements achieved
 * through the optimizations we've implemented. It allows side-by-side
 * comparison of the original and optimized flow diagram components.
 */

import * as React from 'react';
import { useCallback, useState } from 'react';
import { PerformanceOptimizationConfig } from '../../../utils/performance/D3PerformanceOptimizations';
import OptimizedFlowDiagram, { FlowData, FlowNode } from './OptimizedFlowDiagram';

// Generate test data with configurable size
const generateTestData = (nodeCount: number, linkCount: number): FlowData => {
  // Create nodes
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    name: `Node ${i}`,
    type: i % 3 === 0 ? 'source' : i % 3 === 1 ? 'processor' : 'sink',
    value: Math.random() * 100,
    description: `Description for node ${i}`,
  })) as FlowNode[]; // Cast to the correct type

  // Create links
  const links = Array.from({ length: linkCount }, (_, i) => {
    const source = Math.floor(Math.random() * nodeCount);
    let target = Math.floor(Math.random() * nodeCount);

    // Ensure source and target are different
    while (target === source) {
      target = Math.floor(Math.random() * nodeCount);
    }

    return {
      id: `link-${i}`,
      source: `node-${source}`,
      target: `node-${target}`,
      value: Math.random() * 50,
      flowType: i % 2 === 0 ? 'bidirectional' : 'unidirectional',
    };
  });

  return { nodes, links };
};

// Component props
interface VisualizationPerformanceComparisonProps {
  initialNodeCount?: number;
  initialLinkCount?: number;
  width?: number;
  height?: number;
}

/**
 * A component that demonstrates performance optimizations by comparing
 * the original and optimized flow diagram implementations
 */
const VisualizationPerformanceComparison: React.FC<VisualizationPerformanceComparisonProps> = ({
  initialNodeCount = 100,
  initialLinkCount = 150,
  width = 600,
  height = 500,
}) => {
  // State for controlling test data size
  const [nodeCount, setNodeCount] = useState(initialNodeCount);
  const [linkCount, setLinkCount] = useState(initialLinkCount);
  const [testData, setTestData] = useState(generateTestData(initialNodeCount, initialLinkCount));

  // State for optimization configurations
  const [optimizationConfig, setOptimizationConfig] = useState<PerformanceOptimizationConfig>({
    useMemoizedAccessors: true,
    useOptimizedSimulation: true,
    useBatchedDOMUpdates: true,
    useThrottledRendering: false,
    minFrameTimeMs: 16,
    useWorkerSimulation: false,
  });

  // Regenerate test data when node or link count changes
  const regenerateData = useCallback(() => {
    setTestData(generateTestData(nodeCount, linkCount));
  }, [nodeCount, linkCount]);

  // Toggle optimization features
  const toggleOptimization = (key: keyof PerformanceOptimizationConfig) => {
    setOptimizationConfig(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="visualization-performance-comparison">
      <h2>D3 Visualization Performance Comparison</h2>

      <div className="controls">
        <div className="control-section">
          <h3>Test Data Configuration</h3>

          <div className="control-row">
            <label htmlFor="nodeCount">Node Count:</label>
            <input
              id="nodeCount"
              type="range"
              min="10"
              max="500"
              value={nodeCount}
              onChange={e => setNodeCount(Number(e.target.value))}
            />
            <span className="value">{nodeCount}</span>
          </div>

          <div className="control-row">
            <label htmlFor="linkCount">Link Count:</label>
            <input
              id="linkCount"
              type="range"
              min="20"
              max="1000"
              value={linkCount}
              onChange={e => setLinkCount(Number(e.target.value))}
            />
            <span className="value">{linkCount}</span>
          </div>

          <button onClick={regenerateData} className="action-button">
            Regenerate Test Data
          </button>
        </div>

        <div className="control-section">
          <h3>Optimization Controls</h3>

          <div className="optimization-toggles">
            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={optimizationConfig.useMemoizedAccessors}
                  onChange={() => toggleOptimization('useMemoizedAccessors')}
                />
                Use Memoized Accessors
              </label>
            </div>

            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={optimizationConfig.useOptimizedSimulation}
                  onChange={() => toggleOptimization('useOptimizedSimulation')}
                />
                Use Optimized Simulation
              </label>
            </div>

            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={optimizationConfig.useBatchedDOMUpdates}
                  onChange={() => toggleOptimization('useBatchedDOMUpdates')}
                />
                Use Batched DOM Updates
              </label>
            </div>

            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={optimizationConfig.useThrottledRendering}
                  onChange={() => toggleOptimization('useThrottledRendering')}
                />
                Use Throttled Rendering
              </label>
            </div>
          </div>

          {optimizationConfig.useThrottledRendering && (
            <div className="control-row">
              <label htmlFor="minFrameTime">Min Frame Time (ms):</label>
              <input
                id="minFrameTime"
                type="range"
                min="5"
                max="50"
                value={optimizationConfig.minFrameTimeMs}
                onChange={e =>
                  setOptimizationConfig(prev => ({
                    ...prev,
                    minFrameTimeMs: Number(e.target.value),
                  }))
                }
              />
              <span className="value">{optimizationConfig.minFrameTimeMs} ms</span>
            </div>
          )}
        </div>
      </div>

      <div className="visualizations">
        <div className="visualization-container">
          <h3>Performance-Optimized Visualization</h3>
          <div className="visualization-wrapper">
            <OptimizedFlowDiagram
              data={testData}
              width={width}
              height={height}
              optimizationConfig={optimizationConfig}
              showPerformanceStats={true}
            />
          </div>
          <div className="visualization-description">
            <ul>
              <li>Uses performance optimizations according to settings</li>
              <li>Includes real-time performance monitoring</li>
              <li>Implements optimized simulation strategies</li>
              <li>Adapts rendering approach based on data size</li>
            </ul>
          </div>
        </div>

        <div className="visualization-container">
          <h3>Standard Visualization (Without Optimizations)</h3>
          <div className="visualization-wrapper">
            <OptimizedFlowDiagram
              data={testData}
              width={width}
              height={height}
              optimizationConfig={{
                useMemoizedAccessors: false,
                useOptimizedSimulation: false,
                useBatchedDOMUpdates: false,
                useThrottledRendering: false,
                minFrameTimeMs: 0,
                useWorkerSimulation: false,
              }}
              showPerformanceStats={true}
            />
          </div>
          <div className="visualization-description">
            <ul>
              <li>Standard D3 implementation</li>
              <li>No performance optimizations</li>
              <li>Standard simulation parameters</li>
              <li>Direct property access</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="optimization-insights">
        <h3>Performance Optimization Insights</h3>

        <div className="insights-content">
          <p>
            This comparison demonstrates the impact of various performance optimizations on D3
            visualizations, especially when dealing with larger datasets or complex interaction
            patterns.
          </p>

          <div className="optimization-explanation">
            <h4>Key Optimizations:</h4>
            <ul>
              <li>
                <strong>Memoized Accessors:</strong> Caches coordinate lookups to reduce repetitive
                calculations, particularly valuable during intensive operations like simulation
                ticks.
              </li>
              <li>
                <strong>Optimized Simulation:</strong> Adjusts simulation parameters based on
                dataset size, providing faster convergence and more efficient force calculations.
              </li>
              <li>
                <strong>Batched DOM Updates:</strong> Minimizes browser reflows by grouping DOM
                manipulations, reducing layout thrashing during rendering.
              </li>
              <li>
                <strong>Throttled Rendering:</strong> Limits the frequency of visual updates while
                maintaining full-speed physics calculations, balancing visual smoothness with
                performance.
              </li>
            </ul>
          </div>

          <div className="performance-tips">
            <h4>Performance Tips:</h4>
            <ul>
              <li>For large networks (200+ nodes), enable all optimizations</li>
              <li>For complex simulations, throttled rendering provides the biggest benefit</li>
              <li>Memoized accessors help most with frequent DOM updates</li>
              <li>
                Batched DOM updates are most effective when many attributes change simultaneously
              </li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .visualization-performance-comparison {
          padding: 20px;
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            sans-serif;
        }

        h2 {
          color: #333;
          border-bottom: 2px solid #4285f4;
          padding-bottom: 10px;
        }

        .controls {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 30px;
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
        }

        .control-section {
          flex: 1;
          min-width: 300px;
        }

        h3 {
          color: #4285f4;
          margin-top: 0;
        }

        .control-row {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        label {
          width: 150px;
          font-weight: 500;
        }

        input[type='range'] {
          flex: 1;
          margin: 0 10px;
        }

        .value {
          width: 50px;
          text-align: right;
          font-weight: 500;
        }

        .action-button {
          padding: 8px 16px;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .action-button:hover {
          background: #3367d6;
        }

        .toggle-row {
          margin-bottom: 12px;
        }

        .toggle-row label {
          display: flex;
          align-items: center;
          cursor: pointer;
          width: 100%;
        }

        .toggle-row input[type='checkbox'] {
          margin-right: 10px;
        }

        .visualizations {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 30px;
        }

        .visualization-container {
          flex: 1;
          min-width: 300px;
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .visualization-container h3 {
          padding: 15px;
          margin: 0;
          background: #f5f5f5;
          border-bottom: 1px solid #ddd;
        }

        .visualization-wrapper {
          padding: 10px;
          height: ${height}px;
        }

        .visualization-description {
          padding: 0 15px 15px;
          font-size: 14px;
          color: #555;
        }

        .visualization-description ul {
          padding-left: 20px;
        }

        .optimization-insights {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }

        .insights-content {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .optimization-explanation,
        .performance-tips {
          flex: 1;
          min-width: 300px;
        }

        .optimization-explanation h4,
        .performance-tips h4 {
          color: #4285f4;
          margin-top: 0;
        }
      `}</style>
    </div>
  );
};

export default VisualizationPerformanceComparison;

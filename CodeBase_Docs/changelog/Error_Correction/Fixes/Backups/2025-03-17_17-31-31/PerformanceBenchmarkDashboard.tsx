import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import {
  BenchmarkResult,
  createPerformanceVisualization,
  detectPerformanceRegressions,
  loadBenchmarkResults,
  ResourceFlowBenchmarkResult,
  runResourceFlowBenchmark,
  saveBenchmarkResults,
} from '../../../utils/performance/benchmarks/PerformanceBenchmarkTools';

interface BenchmarkConfigOption {
  id: string;
  name: string;
  nodeCount: number;
  connectionCount: number;
  description: string;
}

interface PerformanceBenchmarkDashboardProps {
  width?: number;
  height?: number;
}

/**
 * Performance Benchmark Dashboard
 *
 * A comprehensive dashboard for running, visualizing, and analyzing
 * performance benchmarks across different systems, with a focus on
 * ResourceFlowManager, event system, and React rendering performance.
 */
const PerformanceBenchmarkDashboard: React.FC<PerformanceBenchmarkDashboardProps> = ({
  width = 1200,
  height = 800,
}) => {
  // Visualization refs
  const chartRef = useRef<HTMLDivElement>(null);

  // State for benchmark configuration
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('resourceFlow-medium');
  const [customNodeCount, setCustomNodeCount] = useState<number>(200);
  const [customConnectionCount, setCustomConnectionCount] = useState<number>(300);
  const [batchSize, setBatchSize] = useState<number>(50);
  const [cacheTTL, setCacheTTL] = useState<number>(1000);
  const [iterations, setIterations] = useState<number>(10);

  // State for benchmark results
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [showRegressionAnalysis, setShowRegressionAnalysis] = useState<boolean>(false);
  const [regressionAnalysis, setRegressionAnalysis] = useState<ReturnType<
    typeof detectPerformanceRegressions
  > | null>(null);

  // Predefined benchmark configurations
  const benchmarkConfigs: BenchmarkConfigOption[] = [
    {
      id: 'resourceFlow-small',
      name: 'ResourceFlow (Small)',
      nodeCount: 50,
      connectionCount: 75,
      description: 'Small resource network (50 nodes, 75 connections)',
    },
    {
      id: 'resourceFlow-medium',
      name: 'ResourceFlow (Medium)',
      nodeCount: 200,
      connectionCount: 300,
      description: 'Medium resource network (200 nodes, 300 connections)',
    },
    {
      id: 'resourceFlow-large',
      name: 'ResourceFlow (Large)',
      nodeCount: 500,
      connectionCount: 750,
      description: 'Large resource network (500 nodes, 750 connections)',
    },
    {
      id: 'resourceFlow-custom',
      name: 'ResourceFlow (Custom)',
      nodeCount: 0, // Will be set by user
      connectionCount: 0, // Will be set by user
      description: 'Custom resource network configuration',
    },
  ];

  // Load saved benchmark results on mount
  useEffect(() => {
    const savedResults = loadBenchmarkResults('performance-benchmark-results');
    if (savedResults.length > 0) {
      setBenchmarkResults(savedResults);
    }
  }, []);

  // Update visualization when results change
  useEffect(() => {
    if (benchmarkResults.length > 0 && chartRef.current) {
      // Clear previous visualization
      chartRef.current.innerHTML = '';

      // Create new visualization
      createPerformanceVisualization(benchmarkResults, chartRef.current);
    }
  }, [benchmarkResults]);

  // Run the selected benchmark
  const runBenchmark = async () => {
    setIsRunning(true);
    setCurrentProgress(0);

    try {
      // Get configuration for selected benchmark
      const config = benchmarkConfigs.find(c => c.id === selectedBenchmark);
      if (!config) {
        throw new Error(`Benchmark configuration not found: ${selectedBenchmark}`);
      }

      // Set up node and connection counts
      const nodeCount = config.id === 'resourceFlow-custom' ? customNodeCount : config.nodeCount;
      const connectionCount =
        config.id === 'resourceFlow-custom' ? customConnectionCount : config.connectionCount;

      // Run the benchmark
      const result = await runResourceFlowBenchmark(config.name, nodeCount, connectionCount, {
        batchSize,
        cacheTTL,
        iterations,
      });

      // Update state with results
      setBenchmarkResults(prevResults => {
        const newResults = [...prevResults, result];

        // Save results to localStorage
        saveBenchmarkResults(newResults, 'performance-benchmark-results');

        return newResults;
      });

      // Compare with previous results if available
      if (benchmarkResults.length > 0) {
        const analysis = detectPerformanceRegressions(
          [result],
          benchmarkResults,
          5 // 5% threshold for regression detection
        );

        setRegressionAnalysis(analysis);
        setShowRegressionAnalysis(
          analysis.regressions.length > 0 || analysis.improvements.length > 0
        );
      }
    } catch (error) {
      console.error('Error running benchmark:', error);
    } finally {
      setIsRunning(false);
      setCurrentProgress(100);
    }
  };

  // Clear all benchmark results
  const clearResults = () => {
    setBenchmarkResults([]);
    setRegressionAnalysis(null);
    setShowRegressionAnalysis(false);

    // Clear saved results
    saveBenchmarkResults([], 'performance-benchmark-results');

    // Clear visualization
    if (chartRef.current) {
      chartRef.current.innerHTML = '';
    }
  };

  // Filter results by benchmark type
  const filterResults = (type: string) => {
    if (type === 'all') {
      // Load all saved results
      const savedResults = loadBenchmarkResults('performance-benchmark-results');
      setBenchmarkResults(savedResults);
    } else {
      // Filter by benchmark type
      const savedResults = loadBenchmarkResults('performance-benchmark-results');
      const filtered = savedResults.filter(result => result.name.includes(type));
      setBenchmarkResults(filtered);
    }
  };

  return (
    <div className="performance-benchmark-dashboard" style={{ width, height, overflow: 'auto' }}>
      <h1>Performance Benchmark Dashboard</h1>
      <p>
        Run and analyze performance benchmarks for critical systems. Compare results over time to
        detect improvements or regressions.
      </p>

      <div className="benchmark-controls">
        <div className="control-section">
          <h2>Benchmark Configuration</h2>

          <div className="form-group">
            <label htmlFor="benchmark-select">Select Benchmark:</label>
            <select
              id="benchmark-select"
              value={selectedBenchmark}
              onChange={e => setSelectedBenchmark(e.target.value)}
              disabled={isRunning}
            >
              {benchmarkConfigs.map(config => (
                <option key={config.id} value={config.id}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>

          {selectedBenchmark === 'resourceFlow-custom' && (
            <div className="custom-config">
              <div className="form-group">
                <label htmlFor="node-count">Node Count:</label>
                <input
                  id="node-count"
                  type="number"
                  min="10"
                  max="1000"
                  value={customNodeCount}
                  onChange={e => setCustomNodeCount(Number(e.target.value))}
                  disabled={isRunning}
                />
              </div>

              <div className="form-group">
                <label htmlFor="connection-count">Connection Count:</label>
                <input
                  id="connection-count"
                  type="number"
                  min="10"
                  max="2000"
                  value={customConnectionCount}
                  onChange={e => setCustomConnectionCount(Number(e.target.value))}
                  disabled={isRunning}
                />
              </div>
            </div>
          )}

          <div className="advanced-options">
            <h3>Advanced Options</h3>

            <div className="form-group">
              <label htmlFor="batch-size">Batch Size:</label>
              <input
                id="batch-size"
                type="number"
                min="10"
                max="200"
                value={batchSize}
                onChange={e => setBatchSize(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cache-ttl">Cache TTL (ms):</label>
              <input
                id="cache-ttl"
                type="number"
                min="100"
                max="5000"
                step="100"
                value={cacheTTL}
                onChange={e => setCacheTTL(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>

            <div className="form-group">
              <label htmlFor="iterations">Iterations:</label>
              <input
                id="iterations"
                type="number"
                min="1"
                max="50"
                value={iterations}
                onChange={e => setIterations(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="actions">
            <button onClick={runBenchmark} disabled={isRunning} className="primary-button">
              {isRunning ? 'Running...' : 'Run Benchmark'}
            </button>

            <button
              onClick={clearResults}
              disabled={isRunning || benchmarkResults.length === 0}
              className="secondary-button"
            >
              Clear Results
            </button>
          </div>

          {isRunning && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${currentProgress}%` }}></div>
            </div>
          )}
        </div>

        <div className="results-section">
          <h2>Results</h2>

          <div className="filter-controls">
            <button onClick={() => filterResults('all')}>All</button>
            <button onClick={() => filterResults('ResourceFlow')}>ResourceFlow</button>
          </div>

          {benchmarkResults.length > 0 ? (
            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Execution Time (ms)</th>
                    <th>Nodes</th>
                    <th>Connections</th>
                    <th>Memory (MB)</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkResults.map((result, index) => {
                    const resourceResult = result as ResourceFlowBenchmarkResult;
                    return (
                      <tr key={`${result.name}-${index}`}>
                        <td>{result.name}</td>
                        <td>{result.executionTimeMs.toFixed(2)}</td>
                        <td>{resourceResult.nodeCount || 'N/A'}</td>
                        <td>{resourceResult.connectionCount || 'N/A'}</td>
                        <td>{result.memoryUsageMB?.toFixed(2) || 'N/A'}</td>
                        <td>{result.timestamp?.toLocaleString() || 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-results">No benchmark results available</div>
          )}
        </div>
      </div>

      {/* Visualization */}
      <div className="visualization-section">
        <h2>Visualization</h2>
        <div ref={chartRef} className="chart-container"></div>
      </div>

      {/* Regression Analysis */}
      {showRegressionAnalysis && regressionAnalysis && (
        <div className="regression-analysis">
          <h2>Performance Analysis</h2>

          <div className="analysis-summary">
            <div className="summary-item">
              <div className="summary-label">Total Benchmarks</div>
              <div className="summary-value">{regressionAnalysis.summary.totalTests}</div>
            </div>

            <div className="summary-item">
              <div className="summary-label">Regressions</div>
              <div className="summary-value regression">
                {regressionAnalysis.summary.regressionCount}
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-label">Improvements</div>
              <div className="summary-value improvement">
                {regressionAnalysis.summary.improvementCount}
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-label">Unchanged</div>
              <div className="summary-value">{regressionAnalysis.summary.unchangedCount}</div>
            </div>
          </div>

          {regressionAnalysis.regressions.length > 0 && (
            <>
              <h3>Regressions</h3>
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Baseline (ms)</th>
                    <th>New (ms)</th>
                    <th>Change (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {regressionAnalysis.regressions.map((regression, index) => (
                    <tr key={`regression-${index}`}>
                      <td>{regression.name}</td>
                      <td>{regression.baselineTime.toFixed(2)}</td>
                      <td>{regression.newTime.toFixed(2)}</td>
                      <td className="regression">+{regression.percentChange.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {regressionAnalysis.improvements.length > 0 && (
            <>
              <h3>Improvements</h3>
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Baseline (ms)</th>
                    <th>New (ms)</th>
                    <th>Change (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {regressionAnalysis.improvements.map((improvement, index) => (
                    <tr key={`improvement-${index}`}>
                      <td>{improvement.name}</td>
                      <td>{improvement.baselineTime.toFixed(2)}</td>
                      <td>{improvement.newTime.toFixed(2)}</td>
                      <td className="improvement">{improvement.percentChange.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .performance-benchmark-dashboard {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
            'Open Sans', 'Helvetica Neue', sans-serif;
          color: #333;
          padding: 20px;
          background-color: #f5f7fa;
          border-radius: 8px;
        }

        h1,
        h2,
        h3 {
          color: #2c3e50;
        }

        .benchmark-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 20px;
        }

        .control-section,
        .results-section {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          flex: 1;
          min-width: 300px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }

        select,
        input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .custom-config {
          margin-top: 15px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }

        .advanced-options {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }

        .advanced-options h3 {
          margin-top: 0;
          font-size: 16px;
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .primary-button {
          background-color: #3498db;
          color: white;
        }

        .primary-button:hover:not(:disabled) {
          background-color: #2980b9;
        }

        .secondary-button {
          background-color: #e74c3c;
          color: white;
        }

        .secondary-button:hover:not(:disabled) {
          background-color: #c0392b;
        }

        .progress-bar {
          margin-top: 20px;
          height: 8px;
          width: 100%;
          background-color: #eee;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background-color: #3498db;
          transition: width 0.3s ease;
        }

        .filter-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .filter-controls button {
          background-color: #ecf0f1;
          color: #333;
        }

        .filter-controls button:hover {
          background-color: #d5dbdb;
        }

        .results-table {
          max-height: 300px;
          overflow-y: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        th {
          font-weight: 600;
          color: #2c3e50;
          background-color: #f8f9fa;
        }

        .no-results {
          padding: 20px;
          text-align: center;
          color: #7f8c8d;
          font-style: italic;
        }

        .visualization-section {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          margin-bottom: 20px;
        }

        .chart-container {
          width: 100%;
          height: 400px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }

        .regression-analysis {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .analysis-summary {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .summary-item {
          flex: 1;
          padding: 15px;
          border-radius: 4px;
          background-color: #f8f9fa;
          text-align: center;
        }

        .summary-label {
          font-weight: 500;
          margin-bottom: 5px;
        }

        .summary-value {
          font-size: 24px;
          font-weight: 600;
        }

        .regression {
          color: #e74c3c;
        }

        .improvement {
          color: #2ecc71;
        }

        .analysis-table {
          width: 100%;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
};

export default PerformanceBenchmarkDashboard;

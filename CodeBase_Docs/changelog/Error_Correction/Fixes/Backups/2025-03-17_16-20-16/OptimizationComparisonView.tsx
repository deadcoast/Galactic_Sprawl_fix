import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import { animationFrameManager } from '../../../utils/performance/animationFrameManagerInstance';
import { FrameInfo } from '../../../utils/performance/D3AnimationFrameManager';
import { AnimationPerformanceReport } from '../../../utils/performance/D3AnimationProfiler';
import {
  ActiveMode,
  ComparisonMode,
  PerformanceComparison,
  PerformanceMetrics,
} from './performanceTypes';

// Declare the metricInterval property on window for TypeScript
declare global {
  interface Window {
    metricInterval?: ReturnType<typeof setInterval>;
  }
}

interface OptimizationComparisonViewProps {
  width?: number;
  height?: number;
  animationId?: string;
}

/**
 * A component that provides side-by-side comparison between optimized and unoptimized
 * performance modes with real-time metrics visualization.
 */
const OptimizationComparisonView: React.FC<OptimizationComparisonViewProps> = ({
  width = 1200,
  height = 800,
  animationId = 'test-animation',
}) => {
  // References for chart containers
  const optimizedChartRef = useRef<HTMLDivElement>(null);
  const unoptimizedChartRef = useRef<HTMLDivElement>(null);

  // State for tracking metrics
  const [optimizedMetrics, setOptimizedMetrics] = useState<PerformanceMetrics>({
    fps: [],
    renderTime: [],
    cpuTime: [],
    domOperations: [],
    memoryUsage: [],
    animationSmoothness: [],
  });

  const [unoptimizedMetrics, setUnoptimizedMetrics] = useState<PerformanceMetrics>({
    fps: [],
    renderTime: [],
    cpuTime: [],
    domOperations: [],
    memoryUsage: [],
    animationSmoothness: [],
  });

  // State for comparison mode
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('side-by-side');
  const [isRunning, setIsRunning] = useState(false);
  const [activeMode, setActiveMode] = useState<ActiveMode>('both');
  const [comparisons, setComparisons] = useState<PerformanceComparison[]>([]);

  // State for animation performance reports
  const [optimizedReport, setOptimizedReport] = useState<AnimationPerformanceReport | null>(null);
  const [unoptimizedReport, setUnoptimizedReport] = useState<AnimationPerformanceReport | null>(
    null
  );

  // Initialize comparison
  useEffect(() => {
    // Setup chart visualization (would implement with D3 in a real component)
    setupCharts();

    return () => {
      // Cleanup any running animations
      if (isRunning) {
        stopComparison();
      }
    };
  }, []);

  // Update charts when metrics change
  useEffect(() => {
    if (optimizedMetrics.fps.length > 0 || unoptimizedMetrics.fps.length > 0) {
      updateCharts();
    }
  }, [optimizedMetrics, unoptimizedMetrics]);

  // Update statistical comparison when reports change
  useEffect(() => {
    if (optimizedReport && unoptimizedReport) {
      generateComparisons();
    }
  }, [optimizedReport, unoptimizedReport]);

  // Setup chart visualization
  const setupCharts = () => {
    // In a real implementation, this would initialize D3 charts
    console.warn('Setting up performance comparison charts');
  };

  // Update chart visualization
  const updateCharts = () => {
    // In a real implementation, this would update D3 charts with new data
    console.warn('Updating performance comparison charts');
  };

  // Start the comparison
  const startComparison = () => {
    setIsRunning(true);

    // Clear previous metrics
    setOptimizedMetrics({
      fps: [],
      renderTime: [],
      cpuTime: [],
      domOperations: [],
      memoryUsage: [],
      animationSmoothness: [],
    });

    setUnoptimizedMetrics({
      fps: [],
      renderTime: [],
      cpuTime: [],
      domOperations: [],
      memoryUsage: [],
      animationSmoothness: [],
    });

    // Run optimized animation if mode is optimized or both
    if (activeMode === 'optimized' || activeMode === 'both') {
      runOptimizedAnimation();
    }

    // Run unoptimized animation if mode is unoptimized or both
    if (activeMode === 'unoptimized' || activeMode === 'both') {
      runUnoptimizedAnimation();
    }

    // Start metric collection
    startMetricCollection();
  };

  // Stop the comparison
  const stopComparison = () => {
    setIsRunning(false);

    // Stop animations
    animationFrameManager.pauseAnimation(`${animationId}-optimized`);
    animationFrameManager.pauseAnimation(`${animationId}-unoptimized`);

    // Stop metric collection
    stopMetricCollection();
  };

  // Run the optimized animation
  const runOptimizedAnimation = () => {
    // In a real implementation, this would set up and run the optimized animation
    console.warn('Running optimized animation');

    // Example of registering an animation with the animation frame manager
    animationFrameManager.registerAnimation(
      {
        id: `${animationId}-optimized`,
        name: 'Optimized Animation',
        priority: 'high',
        type: 'custom',
        duration: 0, // Run indefinitely
        loop: true,
        enableProfiling: true,
      },
      (_elapsed: number, _deltaTime: number, _frameInfo: FrameInfo) => {
        // Animation logic here
        return false; // Continue running
      }
    );

    // Start the animation
    animationFrameManager.startAnimation(`${animationId}-optimized`);
  };

  // Run the unoptimized animation
  const runUnoptimizedAnimation = () => {
    // In a real implementation, this would set up and run the unoptimized animation
    console.warn('Running unoptimized animation');

    // Example of registering an animation with the animation frame manager
    animationFrameManager.registerAnimation(
      {
        id: `${animationId}-unoptimized`,
        name: 'Unoptimized Animation',
        priority: 'high',
        type: 'custom',
        duration: 0, // Run indefinitely
        loop: true,
        enableProfiling: true,
      },
      (_elapsed: number, _deltaTime: number, _frameInfo: FrameInfo) => {
        // Animation logic here - with deliberate inefficiencies to demonstrate difference
        return false; // Continue running
      }
    );

    // Start the animation
    animationFrameManager.startAnimation(`${animationId}-unoptimized`);
  };

  // Start collecting metrics
  const startMetricCollection = () => {
    const metricInterval = setInterval(() => {
      const now = Date.now();

      // In a real implementation, these would be actual metrics from the animations
      if (activeMode === 'optimized' || activeMode === 'both') {
        setOptimizedMetrics(prev => ({
          fps: [...prev.fps, { timestamp: now, value: 55 + Math.random() * 5 }], // 55-60 FPS
          renderTime: [...prev.renderTime, { timestamp: now, value: 8 + Math.random() * 3 }], // 8-11ms
          cpuTime: [...prev.cpuTime, { timestamp: now, value: 5 + Math.random() * 2 }], // 5-7ms
          domOperations: [...prev.domOperations, { timestamp: now, value: 10 + Math.random() * 5 }], // 10-15 ops
          memoryUsage: [...prev.memoryUsage, { timestamp: now, value: 20 + Math.random() * 10 }], // 20-30MB
          animationSmoothness: [
            ...prev.animationSmoothness,
            { timestamp: now, value: 90 + Math.random() * 10 },
          ], // 90-100%
        }));
      }

      if (activeMode === 'unoptimized' || activeMode === 'both') {
        setUnoptimizedMetrics(prev => ({
          fps: [...prev.fps, { timestamp: now, value: 30 + Math.random() * 15 }], // 30-45 FPS
          renderTime: [...prev.renderTime, { timestamp: now, value: 16 + Math.random() * 10 }], // 16-26ms
          cpuTime: [...prev.cpuTime, { timestamp: now, value: 12 + Math.random() * 8 }], // 12-20ms
          domOperations: [
            ...prev.domOperations,
            { timestamp: now, value: 30 + Math.random() * 20 },
          ], // 30-50 ops
          memoryUsage: [...prev.memoryUsage, { timestamp: now, value: 40 + Math.random() * 20 }], // 40-60MB
          animationSmoothness: [
            ...prev.animationSmoothness,
            { timestamp: now, value: 60 + Math.random() * 20 },
          ], // 60-80%
        }));
      }
    }, 1000); // Collect metrics every second

    // Store interval ID for cleanup
    window.metricInterval = metricInterval;
  };

  // Stop collecting metrics
  const stopMetricCollection = () => {
    if (window.metricInterval) {
      clearInterval(window.metricInterval);
      window.metricInterval = undefined;
    }

    // Generate final performance reports
    if (activeMode === 'optimized' || activeMode === 'both') {
      const report = animationFrameManager.getPerformanceReport(`${animationId}-optimized`);
      if (report) {
        setOptimizedReport(report);
      }
    }

    if (activeMode === 'unoptimized' || activeMode === 'both') {
      const report = animationFrameManager.getPerformanceReport(`${animationId}-unoptimized`);
      if (report) {
        setUnoptimizedReport(report);
      }
    }
  };

  // Generate statistical comparisons between optimized and unoptimized
  const generateComparisons = () => {
    // In a real implementation, this would compare actual metrics
    const newComparisons: PerformanceComparison[] = [
      {
        metric: 'FPS',
        optimized: calculateAverage(optimizedMetrics.fps.map(point => point.value)),
        unoptimized: calculateAverage(unoptimizedMetrics.fps.map(point => point.value)),
        difference: 0, // Will be calculated
        percentImprovement: 0, // Will be calculated
      },
      {
        metric: 'Render Time (ms)',
        optimized: calculateAverage(optimizedMetrics.renderTime.map(point => point.value)),
        unoptimized: calculateAverage(unoptimizedMetrics.renderTime.map(point => point.value)),
        difference: 0, // Will be calculated
        percentImprovement: 0, // Will be calculated
      },
      {
        metric: 'CPU Time (ms)',
        optimized: calculateAverage(optimizedMetrics.cpuTime.map(point => point.value)),
        unoptimized: calculateAverage(unoptimizedMetrics.cpuTime.map(point => point.value)),
        difference: 0, // Will be calculated
        percentImprovement: 0, // Will be calculated
      },
      {
        metric: 'DOM Operations',
        optimized: calculateAverage(optimizedMetrics.domOperations.map(point => point.value)),
        unoptimized: calculateAverage(unoptimizedMetrics.domOperations.map(point => point.value)),
        difference: 0, // Will be calculated
        percentImprovement: 0, // Will be calculated
      },
      {
        metric: 'Memory Usage (MB)',
        optimized: calculateAverage(optimizedMetrics.memoryUsage.map(point => point.value)),
        unoptimized: calculateAverage(unoptimizedMetrics.memoryUsage.map(point => point.value)),
        difference: 0, // Will be calculated
        percentImprovement: 0, // Will be calculated
      },
      {
        metric: 'Animation Smoothness (%)',
        optimized: calculateAverage(optimizedMetrics.animationSmoothness.map(point => point.value)),
        unoptimized: calculateAverage(
          unoptimizedMetrics.animationSmoothness.map(point => point.value)
        ),
        difference: 0, // Will be calculated
        percentImprovement: 0, // Will be calculated
      },
    ];

    // Calculate difference and percentage improvement
    newComparisons.forEach(comparison => {
      comparison.difference = comparison.optimized - comparison.unoptimized;

      // For metrics where higher is better (FPS, smoothness)
      if (comparison.metric === 'FPS' || comparison.metric === 'Animation Smoothness (%)') {
        comparison.percentImprovement =
          (comparison.difference / Math.max(0.1, comparison.unoptimized)) * 100;
      }
      // For metrics where lower is better (render time, CPU time, DOM ops, memory)
      else {
        comparison.percentImprovement =
          ((comparison.unoptimized - comparison.optimized) /
            Math.max(0.1, comparison.unoptimized)) *
          100;
      }
    });

    setComparisons(newComparisons);
  };

  // Helper to calculate average of an array of numbers
  const calculateAverage = (values: number[]): number => {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  // Toggle the comparison mode
  const toggleComparisonMode = () => {
    setComparisonMode(prev => (prev === 'side-by-side' ? 'overlay' : 'side-by-side'));
  };

  // Change the active mode
  const changeActiveMode = (mode: ActiveMode) => {
    if (isRunning) {
      stopComparison();
    }

    setActiveMode(mode);

    if (isRunning) {
      startComparison();
    }
  };

  // Render the comparison view
  return (
    <div className="optimization-comparison-view">
      <h2>Performance Optimization Comparison</h2>

      <div className="controls">
        <div className="control-section">
          <h3>Comparison Mode</h3>
          <div className="control-row">
            <button
              className={`mode-button ${activeMode === 'optimized' ? 'active' : ''}`}
              onClick={() => changeActiveMode('optimized')}
            >
              Optimized Only
            </button>
            <button
              className={`mode-button ${activeMode === 'unoptimized' ? 'active' : ''}`}
              onClick={() => changeActiveMode('unoptimized')}
            >
              Unoptimized Only
            </button>
            <button
              className={`mode-button ${activeMode === 'both' ? 'active' : ''}`}
              onClick={() => changeActiveMode('both')}
            >
              Side-by-Side Comparison
            </button>
          </div>

          <div className="control-row">
            <button
              className="action-button"
              onClick={isRunning ? stopComparison : startComparison}
            >
              {isRunning ? 'Stop Comparison' : 'Start Comparison'}
            </button>

            {activeMode === 'both' && (
              <button className="action-button" onClick={toggleComparisonMode}>
                {comparisonMode === 'side-by-side' ? 'Switch to Overlay' : 'Switch to Side-by-Side'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`visualizations ${comparisonMode}`}>
        {(activeMode === 'optimized' || activeMode === 'both') && (
          <div className="visualization-container optimized">
            <h3>Optimized Performance</h3>
            <div className="visualization-wrapper" ref={optimizedChartRef}>
              {/* In a real implementation, this would be a D3 chart */}
              <div className="placeholder-chart">
                <div className="chart-bar" style={{ height: '80%' }}></div>
                <div className="chart-label">Chart Placeholder - Optimized</div>
              </div>
            </div>
          </div>
        )}

        {(activeMode === 'unoptimized' || activeMode === 'both') && (
          <div className="visualization-container unoptimized">
            <h3>Unoptimized Performance</h3>
            <div className="visualization-wrapper" ref={unoptimizedChartRef}>
              {/* In a real implementation, this would be a D3 chart */}
              <div className="placeholder-chart">
                <div className="chart-bar" style={{ height: '40%' }}></div>
                <div className="chart-label">Chart Placeholder - Unoptimized</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {comparisons.length > 0 && (
        <div className="statistical-analysis">
          <h3>Statistical Comparison</h3>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Optimized</th>
                <th>Unoptimized</th>
                <th>Difference</th>
                <th>Improvement</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((comparison, index) => (
                <tr key={index}>
                  <td>{comparison.metric}</td>
                  <td>{comparison.optimized.toFixed(2)}</td>
                  <td>{comparison.unoptimized.toFixed(2)}</td>
                  <td className={comparison.percentImprovement > 0 ? 'positive' : 'negative'}>
                    {comparison.difference.toFixed(2)}
                  </td>
                  <td className={comparison.percentImprovement > 0 ? 'positive' : 'negative'}>
                    {comparison.percentImprovement.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .optimization-comparison-view {
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
          gap: 10px;
        }

        .mode-button,
        .action-button {
          padding: 8px 16px;
          background: #f1f1f1;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .mode-button.active {
          background: #4285f4;
          color: white;
          border-color: #3367d6;
        }

        .action-button {
          background: #4285f4;
          color: white;
          border: none;
        }

        .action-button:hover {
          background: #3367d6;
        }

        .visualizations {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 30px;
        }

        .visualizations.side-by-side {
          flex-direction: row;
        }

        .visualizations.overlay {
          position: relative;
          height: 500px;
        }

        .visualization-container {
          flex: 1;
          min-width: 300px;
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .visualizations.overlay .visualization-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.7;
        }

        .visualizations.overlay .optimized {
          z-index: 2;
        }

        .visualization-container h3 {
          padding: 15px;
          margin: 0;
          background: #f5f5f5;
          border-bottom: 1px solid #ddd;
        }

        .visualization-wrapper {
          height: 400px;
          padding: 10px;
        }

        .placeholder-chart {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          background: #f9f9f9;
          border-radius: 4px;
          padding: 10px;
        }

        .chart-bar {
          width: 80px;
          background: linear-gradient(to top, #4285f4, #34a853);
          border-radius: 4px 4px 0 0;
        }

        .unoptimized .chart-bar {
          background: linear-gradient(to top, #ea4335, #fbbc05);
        }

        .chart-label {
          margin-top: 10px;
          font-size: 14px;
          color: #666;
        }

        .statistical-analysis {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .statistical-analysis h3 {
          padding: 15px;
          margin: 0;
          background: #f5f5f5;
          border-bottom: 1px solid #ddd;
        }

        .comparison-table {
          width: 100%;
          border-collapse: collapse;
        }

        .comparison-table th,
        .comparison-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .comparison-table th {
          background: #f9f9f9;
          font-weight: 500;
        }

        .comparison-table td.positive {
          color: #34a853;
        }

        .comparison-table td.negative {
          color: #ea4335;
        }
      `}</style>
    </div>
  );
};

export default OptimizationComparisonView;

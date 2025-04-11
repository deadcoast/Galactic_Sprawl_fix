import * as React from 'react';
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
      // Cleanup unknownnown running animations
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

    // Use width and height to set up chart dimensions
    if (optimizedChartRef.current) {
      optimizedChartRef.current.style.width = `${width / 2 - 20}px`;
      optimizedChartRef.current.style.height = `${height - 100}px`;
    }

    if (unoptimizedChartRef.current) {
      unoptimizedChartRef.current.style.width = `${width / 2 - 20}px`;
      unoptimizedChartRef.current.style.height = `${height - 100}px`;
    }
  };

  // Update chart visualization
  const updateCharts = () => {
    // In a real implementation, this would update D3 charts with new data
    console.warn('Updating performance comparison charts');

    // Adjust chart dimensions when data updates if needed
    if (optimizedChartRef.current && unoptimizedChartRef.current) {
      // Calculate potential scaling based on data size and dimensions
      const dataSize = Math.max(optimizedMetrics.fps.length, unoptimizedMetrics.fps.length);

      // Adjust chart width based on data points and view width
      const chartWidth = Math.min(width - 40, dataSize * 10);

      optimizedChartRef.current.style.width = `${chartWidth}px`;
      unoptimizedChartRef.current.style.width = `${chartWidth}px`;
    }
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
      (elapsed: number, deltaTime: number, frameInfo: FrameInfo) => {
        // Animation logic here

        // Use the frame timing information to adjust animation speed
        const speedFactor = deltaTime / 16.7; // Normalize against 60fps

        // Track performance based on frame info
        if (frameInfo.isFrameOverBudget) {
          console.warn(`Optimized animation frame budget exceeded: ${elapsed}ms elapsed`);
        }

        // Update animation state based on elapsed time
        const animationProgress = (elapsed % 5000) / 5000; // 5 second cycle

        // Use frame information for adaptive quality adjustment
        if (frameInfo.currentFps < 30) {
          // Would reduce visual quality or complexity in a real implementation
          console.warn(
            `Reducing optimized animation quality (${frameInfo.currentFps.toFixed(1)} FPS)`
          );
        }

        // Update visualization with current animation time
        if (optimizedChartRef.current) {
          // Apply the animation progress and speed factor to the visualization
          const transformValue = `translateX(${animationProgress * 100}px) scale(${0.8 + speedFactor * 0.2})`;
          optimizedChartRef.current.style.transform = transformValue;

          // In a real implementation, this would update more complex visualization
          // elements based on animation progress and frame metrics
        }

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
      (elapsed: number, deltaTime: number, frameInfo: FrameInfo) => {
        // Animation logic here - with deliberate inefficiencies to demonstrate difference

        // Simulate inefficient operations based on elapsed time
        const heavyCalculations = [];
        for (let i = 0; i < Math.min(100, (elapsed / 1000) * 10); i++) {
          heavyCalculations.push(Math.sin(i * deltaTime));
        }

        // Track performance issues
        if (frameInfo.currentFps < 30) {
          console.warn(
            `Unoptimized animation running at ${frameInfo.currentFps.toFixed(1)} FPS after ${elapsed.toFixed(0)}ms`
          );
        }

        // Simulate layout thrashing based on animation progress
        if (elapsed % 1000 < 20) {
          // Force layout recalculation by accessing properties that trigger reflow
          if (unoptimizedChartRef.current) {
            // This is a real calculation that forces layout recalculation
            // causing performance issues deliberately to demonstrate differences
            const dummyCalculation = unoptimizedChartRef.current.offsetWidth * Math.random();

            // Apply the calculation result to element style to ensure it's not optimized away
            unoptimizedChartRef.current.style.paddingLeft = `${Math.min(20, dummyCalculation % 5)}px`;

            // In a real implementation, this might update dimensions, positions, or other
            // properties that trigger multiple DOM reflows
          }
        }

        // Update visualization with current animation time and performance
        if (unoptimizedChartRef.current) {
          // Apply inefficient rendering approach with multiple style changes
          // that could be batched in the optimized version
          unoptimizedChartRef.current.style.opacity = `${0.5 + 0.5 * Math.sin(elapsed / 500)}`;
          unoptimizedChartRef.current.style.filter = `blur(${Math.sin(elapsed / 1000) * 2}px)`;

          // Force multiple individual style updates instead of using CSS transforms
          // which would be more efficient
          const left = 50 + Math.sin(elapsed / 1000) * 50;
          const top = 20 + Math.cos(elapsed / 800) * 20;
          unoptimizedChartRef.current.style.marginLeft = `${left}px`;
          unoptimizedChartRef.current.style.marginTop = `${top}px`;
        }

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

  // Generate performance comparisons between optimized and unoptimized versions
  const generateComparisons = () => {
    if (!optimizedReport || !unoptimizedReport) return;

    const newComparisons: PerformanceComparison[] = [
      {
        metric: 'FPS',
        optimized: optimizedReport.performanceData.actualFps,
        unoptimized: unoptimizedReport.performanceData.actualFps,
        difference:
          optimizedReport.performanceData.actualFps - unoptimizedReport.performanceData.actualFps,
        percentImprovement:
          ((optimizedReport.performanceData.actualFps -
            unoptimizedReport.performanceData.actualFps) /
            unoptimizedReport.performanceData.actualFps) *
          100,
      },
      {
        metric: 'Frame Time',
        optimized: optimizedReport.performanceData.averageFrameDuration,
        unoptimized: unoptimizedReport.performanceData.averageFrameDuration,
        difference:
          unoptimizedReport.performanceData.averageFrameDuration -
          optimizedReport.performanceData.averageFrameDuration,
        percentImprovement:
          ((unoptimizedReport.performanceData.averageFrameDuration -
            optimizedReport.performanceData.averageFrameDuration) /
            unoptimizedReport.performanceData.averageFrameDuration) *
          100,
      },
      {
        metric: 'Frame Success Rate',
        optimized: optimizedReport.performanceData.frameSuccessRate * 100,
        unoptimized: unoptimizedReport.performanceData.frameSuccessRate * 100,
        difference:
          (optimizedReport.performanceData.frameSuccessRate -
            unoptimizedReport.performanceData.frameSuccessRate) *
          100,
        percentImprovement:
          ((optimizedReport.performanceData.frameSuccessRate -
            unoptimizedReport.performanceData.frameSuccessRate) /
            unoptimizedReport.performanceData.frameSuccessRate) *
          100,
      },
    ];

    setComparisons(newComparisons);
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
    <div className="optimization-comparison-view" style={{ width, height, overflow: 'auto' }}>
      <div className="comparison-header">
        <h2>Performance Optimization Comparison</h2>
        <div className="comparison-controls">
          <button
            className={`mode-button ${comparisonMode === 'side-by-side' ? 'active' : ''}`}
            onClick={toggleComparisonMode}
          >
            {comparisonMode === 'side-by-side' ? 'Side by Side' : 'Overlay'}
          </button>
          <div className="active-mode-selector">
            <button
              className={`mode-option ${activeMode === 'optimized' ? 'active' : ''}`}
              onClick={() => changeActiveMode('optimized')}
            >
              Optimized
            </button>
            <button
              className={`mode-option ${activeMode === 'both' ? 'active' : ''}`}
              onClick={() => changeActiveMode('both')}
            >
              Both
            </button>
            <button
              className={`mode-option ${activeMode === 'unoptimized' ? 'active' : ''}`}
              onClick={() => changeActiveMode('unoptimized')}
            >
              Unoptimized
            </button>
          </div>
          <button
            className={`action-button ${isRunning ? 'stop' : 'start'}`}
            onClick={isRunning ? stopComparison : startComparison}
          >
            {isRunning ? 'Stop Comparison' : 'Start Comparison'}
          </button>
        </div>
      </div>

      <div
        className={`comparison-container ${comparisonMode === 'side-by-side' ? 'side-by-side' : 'overlay'}`}
        style={{
          height: height - 180,
          width: width - 40,
        }}
      >
        <div className="optimized-view" ref={optimizedChartRef}>
          <h3>Optimized</h3>
          {optimizedReport && (
            <div className="performance-summary">
              <div className="metric">
                <span className="label">FPS:</span>
                <span className="value">
                  {optimizedReport.performanceData.actualFps.toFixed(1)}
                </span>
              </div>
              <div className="metric">
                <span className="label">Frame Time:</span>
                <span className="value">
                  {optimizedReport.performanceData.averageFrameDuration.toFixed(2)}ms
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="unoptimized-view" ref={unoptimizedChartRef}>
          <h3>Unoptimized</h3>
          {unoptimizedReport && (
            <div className="performance-summary">
              <div className="metric">
                <span className="label">FPS:</span>
                <span className="value">
                  {unoptimizedReport.performanceData.actualFps.toFixed(1)}
                </span>
              </div>
              <div className="metric">
                <span className="label">Frame Time:</span>
                <span className="value">
                  {unoptimizedReport.performanceData.averageFrameDuration.toFixed(2)}ms
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistical comparisons */}
      {comparisons.length > 0 && (
        <div className="statistical-comparison" style={{ width: width - 40 }}>
          <h3>Performance Comparison</h3>
          <div className="comparison-metrics">
            {comparisons.map((comparison, index) => (
              <div key={index} className="comparison-metric">
                <h4>{comparison.metric}</h4>
                <div className="improvement">
                  <span className="value">{comparison.percentImprovement.toFixed(1)}%</span>
                  <span className="label">Improvement</span>
                </div>
                <div className="values">
                  <div className="optimized">
                    <span className="label">Optimized:</span>
                    <span className="value">{comparison.optimized.toFixed(2)}</span>
                  </div>
                  <div className="unoptimized">
                    <span className="label">Unoptimized:</span>
                    <span className="value">{comparison.unoptimized.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizationComparisonView;

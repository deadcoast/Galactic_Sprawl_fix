import * as d3 from 'd3';
import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import {
  AnimationConfig,
  createTypedTimer,
  typedInterpolators,
} from '../../../types/visualizations/D3AnimationTypes';
import {
  AnimationPerformanceReport,
  createAnimationProfiler,
  formatPerformanceReport,
} from '../../../utils/performance/D3AnimationProfiler';

interface AnimationPerformanceProfilerDemoProps {
  width?: number;
  height?: number;
}

/**
 * Demo component showcasing the animation performance profiler
 *
 * This component:
 * 1. Creates different types of animations of varying complexity
 * 2. Profiles each animation to measure performance
 * 3. Visualizes the performance metrics and bottlenecks
 * 4. Provides controls to adjust animation parameters
 */
const AnimationPerformanceProfilerDemo: React.FC<AnimationPerformanceProfilerDemoProps> = ({
  width = 900,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [animationConfig, setAnimationConfig] = useState<AnimationConfig>({
    duration: 2000,
    easing: d3.easeCubicInOut,
    loop: true,
    loopDelay: 500,
  });
  const [animationComplexity, setAnimationComplexity] = useState('medium');
  const [profilerEnabled, setProfilerEnabled] = useState(true);
  const [currentReport, setCurrentReport] = useState<AnimationPerformanceReport | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [profilerView, setProfilerView] = useState<'summary' | 'frames' | 'recommendations'>(
    'summary'
  );

  // Animation data based on complexity
  const getAnimationData = () => {
    const baseCount =
      animationComplexity === 'low'
        ? 20
        : animationComplexity === 'medium'
          ? 50
          : animationComplexity === 'high'
            ? 200
            : 500;

    return Array.from({ length: baseCount }, (_, i) => ({
      id: `element-${i}`,
      x: Math.random() * (width - 40),
      y: Math.random() * (height - 40),
      size: Math.random() * 20 + 5,
      color: d3.interpolateSpectral(i / baseCount),
      targetX: Math.random() * (width - 40),
      targetY: Math.random() * (height - 40),
      targetSize: Math.random() * 20 + 5,
      targetColor: d3.interpolateSpectral((i + baseCount / 2) / baseCount),
    }));
  };

  // Run animation with performance profiling
  useEffect(() => {
    if (!svgRef.current || !isAnimating) return;

    // Clear any existing content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create profiler if enabled
    const profiler = profilerEnabled
      ? createAnimationProfiler({
          targetFps: 60,
          detailedMetrics: true,
          onComplete: report => {
            setCurrentReport(report);
          },
        })
      : null;

    // Start profiling if enabled
    if (profiler) {
      profiler.start(
        'circles-animation',
        `Circles Animation (${animationComplexity} complexity)`,
        animationConfig
      );
    }

    // Get animation data based on complexity
    const data = getAnimationData();

    // Create the SVG and elements
    const svg = d3.select(svgRef.current);

    // Add circles for each data point
    const circles = svg
      .selectAll<SVGCircleElement, any>('circle')
      .data(data, d => d.id)
      .join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.size)
      .attr('fill', d => d.color);

    // Create object interpolators for each data point
    const interpolators = data.map(item => {
      return {
        position: typedInterpolators.object(
          {
            x: item.x,
            y: item.y,
          },
          {
            x: item.targetX,
            y: item.targetY,
          }
        ),
        size: typedInterpolators.number(item.size, item.targetSize),
        color: typedInterpolators.color(item.color, item.targetColor),
      };
    });

    // Wrap interpolators for profiling if enabled
    const profiledInterpolators = profiler
      ? interpolators.map(interp => ({
          position: profiler.wrapInterpolator(interp.position),
          size: profiler.wrapInterpolator(interp.size),
          color: profiler.wrapInterpolator(interp.color),
        }))
      : interpolators;

    // Create selection wrapper for profiling if enabled
    const wrappedCircles = profiler ? profiler.wrapSelection(circles) : circles;

    // Animation timer
    const timer = createTypedTimer({
      callback: elapsed => {
        // Calculate progress based on elapsed time (ping-pong effect)
        const totalDuration = animationConfig.duration * 2;
        const normalizedTime = (elapsed % totalDuration) / animationConfig.duration;
        const t = normalizedTime <= 1 ? normalizedTime : 2 - normalizedTime;

        // Record frame metrics if profiling
        if (profiler) {
          profiler.recordFrame({
            interpolationCount: data.length * 3, // position, size, color
            domUpdateCount: data.length, // One DOM update per circle
          });
        }

        // Update circles with interpolated values
        wrappedCircles.each(function (d, i) {
          const interp = profiledInterpolators[i];
          const pos = interp.position(t);
          const size = interp.size(t);
          const color = interp.color(t);

          d3.select(this).attr('cx', pos.x).attr('cy', pos.y).attr('r', size).attr('fill', color);
        });

        // Stop after one cycle if not looping
        if (!animationConfig.loop && elapsed >= totalDuration) {
          if (profiler) {
            profiler.stop();
          }
          setIsAnimating(false);
          return true;
        }

        return false;
      },
    });

    // Clean up
    return () => {
      timer.stop();
      if (profiler && profiler.getStatus().isRunning) {
        profiler.stop();
      }
    };
  }, [isAnimating, animationConfig, animationComplexity, profilerEnabled, width, height]);

  // Start animation
  const handleStartAnimation = () => {
    setIsAnimating(true);
    setCurrentReport(null);
  };

  // Stop animation
  const handleStopAnimation = () => {
    setIsAnimating(false);
  };

  // Render performance metrics visualization
  const renderPerformanceMetrics = () => {
    if (!currentReport)
      return <div className="text-gray-400">No performance data yet. Run an animation first.</div>;

    const { performanceData, performanceScore, bottlenecks } = currentReport;

    switch (profilerView) {
      case 'summary':
        return (
          <div className="performance-summary">
            <div className="metrics-card">
              <div className="metrics-header">
                <h3>Performance Score</h3>
                <div
                  className={`score-badge ${performanceScore >= 80 ? 'good' : performanceScore >= 60 ? 'medium' : 'poor'}`}
                >
                  {performanceScore}/100
                </div>
              </div>
              <div className="metrics-row">
                <div className="metric-item">
                  <div className="metric-label">FPS</div>
                  <div className="metric-value">
                    {performanceData.actualFps.toFixed(1)}/{performanceData.targetFps}
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Dropped Frames</div>
                  <div className="metric-value">
                    {performanceData.droppedFrames}/{performanceData.frames.length}
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Avg Frame Time</div>
                  <div className="metric-value">
                    {performanceData.averageFrameDuration.toFixed(2)} ms
                  </div>
                </div>
              </div>
            </div>

            {bottlenecks.length > 0 && (
              <div className="bottlenecks-card">
                <h3>Bottlenecks Detected</h3>
                {bottlenecks.map((bottleneck, i) => (
                  <div key={i} className="bottleneck-item">
                    <div className="bottleneck-header">
                      <span className="bottleneck-type">{bottleneck.type.replace('_', ' ')}</span>
                      <span
                        className={`severity-badge ${bottleneck.severity > 0.7 ? 'high' : bottleneck.severity > 0.3 ? 'medium' : 'low'}`}
                      >
                        {(bottleneck.severity * 100).toFixed(0)}% severity
                      </span>
                    </div>
                    <p className="bottleneck-description">{bottleneck.description}</p>
                    <p className="bottleneck-suggestion">{bottleneck.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'frames':
        return (
          <div className="frames-analysis">
            <h3>Frame Analysis</h3>
            <div className="frame-chart">
              <svg width={width - 40} height={200}>
                {performanceData.frames.map((frame, i) => {
                  const x = (i / performanceData.frames.length) * (width - 40);
                  const frameHeight = (frame.frameDuration / (1000 / 30)) * 150;
                  const targetHeight = (1000 / performanceData.targetFps / (1000 / 30)) * 150;

                  return (
                    <g key={i}>
                      <rect
                        x={x}
                        y={150 - Math.min(frameHeight, 150)}
                        width={Math.max(1, (width - 40) / performanceData.frames.length - 1)}
                        height={Math.min(frameHeight, 150)}
                        fill={
                          frame.frameDuration > 1000 / performanceData.targetFps
                            ? '#e74c3c'
                            : '#2ecc71'
                        }
                        opacity={0.7}
                      />
                      {i % Math.floor(performanceData.frames.length / 5) === 0 && (
                        <text x={x} y={175} fontSize="10" textAnchor="middle">
                          {i}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Target frame duration line */}
                <line
                  x1={0}
                  y1={150 - (1000 / performanceData.targetFps / (1000 / 30)) * 150}
                  x2={width - 40}
                  y2={150 - (1000 / performanceData.targetFps / (1000 / 30)) * 150}
                  stroke="#3498db"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
                <text
                  x={width - 45}
                  y={150 - (1000 / performanceData.targetFps / (1000 / 30)) * 150 - 5}
                  fontSize="10"
                  fill="#3498db"
                  textAnchor="end"
                >
                  Target ({(1000 / performanceData.targetFps).toFixed(1)}ms)
                </text>
              </svg>
            </div>

            <div className="frame-metrics">
              <div className="frame-metric-item">
                <div className="metric-label">Min Frame Time</div>
                <div className="metric-value">{performanceData.minFrameDuration.toFixed(2)} ms</div>
              </div>
              <div className="frame-metric-item">
                <div className="metric-label">Max Frame Time</div>
                <div className="metric-value">{performanceData.maxFrameDuration.toFixed(2)} ms</div>
              </div>
              <div className="frame-metric-item">
                <div className="metric-label">Frame Success Rate</div>
                <div className="metric-value">
                  {(performanceData.frameSuccessRate * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        );

      case 'recommendations':
        return (
          <div className="recommendations">
            <h3>Optimization Recommendations</h3>
            <div className="recommendations-list">
              {currentReport.recommendations.map((rec, i) => (
                <div key={i} className="recommendation-item">
                  <div className="recommendation-number">{i + 1}</div>
                  <div className="recommendation-text">{rec}</div>
                </div>
              ))}

              {currentReport.recommendations.length === 0 && (
                <div className="text-gray-400">No specific recommendations.</div>
              )}
            </div>

            <div className="report-text">
              <h4>Full Report</h4>
              <pre className="report-content">{formatPerformanceReport(currentReport)}</pre>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="animation-performance-profiler-demo">
      <h2>Animation Performance Profiler Demo</h2>

      <div className="controls">
        <div className="control-section">
          <h3>Animation Settings</h3>
          <div className="control-row">
            <label>
              Duration:
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={animationConfig.duration}
                onChange={e =>
                  setAnimationConfig({
                    ...animationConfig,
                    duration: parseInt(e.target.value),
                  })
                }
                disabled={isAnimating}
              />
              <span>{animationConfig.duration}ms</span>
            </label>
          </div>

          <div className="control-row">
            <label>
              Complexity:
              <select
                value={animationComplexity}
                onChange={e => setAnimationComplexity(e.target.value)}
                disabled={isAnimating}
              >
                <option value="low">Low (20 elements)</option>
                <option value="medium">Medium (50 elements)</option>
                <option value="high">High (200 elements)</option>
                <option value="extreme">Extreme (500 elements)</option>
              </select>
            </label>
          </div>

          <div className="control-row">
            <label>
              <input
                type="checkbox"
                checked={animationConfig.loop}
                onChange={e =>
                  setAnimationConfig({
                    ...animationConfig,
                    loop: e.target.checked,
                  })
                }
                disabled={isAnimating}
              />
              Loop Animation
            </label>
          </div>

          <div className="control-row">
            <label>
              <input
                type="checkbox"
                checked={profilerEnabled}
                onChange={e => setProfilerEnabled(e.target.checked)}
                disabled={isAnimating}
              />
              Enable Profiling
            </label>
          </div>
        </div>

        <div className="button-group">
          {!isAnimating ? (
            <button className="start-button" onClick={handleStartAnimation}>
              Start Animation
            </button>
          ) : (
            <button className="stop-button" onClick={handleStopAnimation}>
              Stop Animation
            </button>
          )}
        </div>
      </div>

      <div className="visualization">
        <svg ref={svgRef} width={width} height={height} className="animation-svg"></svg>
      </div>

      {profilerEnabled && (
        <div className="performance-metrics">
          <div className="metrics-tabs">
            <button
              className={profilerView === 'summary' ? 'active' : ''}
              onClick={() => setProfilerView('summary')}
            >
              Summary
            </button>
            <button
              className={profilerView === 'frames' ? 'active' : ''}
              onClick={() => setProfilerView('frames')}
            >
              Frame Analysis
            </button>
            <button
              className={profilerView === 'recommendations' ? 'active' : ''}
              onClick={() => setProfilerView('recommendations')}
            >
              Recommendations
            </button>
          </div>

          <div className="metrics-content">{renderPerformanceMetrics()}</div>
        </div>
      )}

      <style jsx>{`
        .animation-performance-profiler-demo {
          width: 100%;
          max-width: ${width}px;
          margin: 0 auto;
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            sans-serif;
        }

        h2 {
          text-align: center;
          margin-bottom: 20px;
        }

        .controls {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .control-section {
          flex: 1;
        }

        .control-section h3 {
          margin-top: 0;
          margin-bottom: 10px;
        }

        .control-row {
          margin-bottom: 10px;
        }

        label {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        input[type='range'] {
          flex: 1;
        }

        select {
          padding: 5px;
          border-radius: 4px;
          border: 1px solid #ccc;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          justify-content: center;
          margin-left: 20px;
        }

        button {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .start-button {
          background: #27ae60;
          color: white;
        }

        .stop-button {
          background: #e74c3c;
          color: white;
        }

        .visualization {
          margin-bottom: 20px;
        }

        .animation-svg {
          width: 100%;
          height: ${height}px;
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .performance-metrics {
          background: #f5f5f5;
          border-radius: 8px;
          padding: 15px;
        }

        .metrics-tabs {
          display: flex;
          margin-bottom: 15px;
          border-bottom: 1px solid #ddd;
        }

        .metrics-tabs button {
          background: transparent;
          border: none;
          padding: 10px 15px;
          margin-right: 5px;
          border-radius: 4px 4px 0 0;
          cursor: pointer;
        }

        .metrics-tabs button.active {
          background: #3498db;
          color: white;
        }

        .metrics-content {
          padding: 10px;
        }

        .performance-summary {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .metrics-card {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .metrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .metrics-header h3 {
          margin: 0;
        }

        .score-badge {
          padding: 5px 10px;
          border-radius: 20px;
          font-weight: bold;
        }

        .score-badge.good {
          background: #27ae60;
          color: white;
        }

        .score-badge.medium {
          background: #f39c12;
          color: white;
        }

        .score-badge.poor {
          background: #e74c3c;
          color: white;
        }

        .metrics-row {
          display: flex;
          justify-content: space-between;
        }

        .metric-item {
          text-align: center;
          flex: 1;
        }

        .metric-label {
          font-size: 0.9em;
          color: #7f8c8d;
          margin-bottom: 5px;
        }

        .metric-value {
          font-size: 1.2em;
          font-weight: bold;
        }

        .bottlenecks-card {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .bottlenecks-card h3 {
          margin-top: 0;
          margin-bottom: 15px;
        }

        .bottleneck-item {
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }

        .bottleneck-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .bottleneck-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .bottleneck-type {
          font-weight: bold;
          text-transform: uppercase;
        }

        .severity-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8em;
        }

        .severity-badge.high {
          background: #e74c3c;
          color: white;
        }

        .severity-badge.medium {
          background: #f39c12;
          color: white;
        }

        .severity-badge.low {
          background: #27ae60;
          color: white;
        }

        .bottleneck-description {
          margin: 5px 0;
        }

        .bottleneck-suggestion {
          font-style: italic;
          color: #2980b9;
        }

        .frames-analysis h3 {
          margin-top: 0;
          margin-bottom: 15px;
        }

        .frame-chart {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .frame-metrics {
          display: flex;
          justify-content: space-between;
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .frame-metric-item {
          text-align: center;
          flex: 1;
        }

        .recommendations h3 {
          margin-top: 0;
          margin-bottom: 15px;
        }

        .recommendations-list {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .recommendation-item {
          display: flex;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }

        .recommendation-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .recommendation-number {
          background: #3498db;
          color: white;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .recommendation-text {
          flex: 1;
        }

        .report-text {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .report-text h4 {
          margin-top: 0;
          margin-bottom: 10px;
        }

        .report-content {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          font-size: 0.85em;
          white-space: pre-wrap;
          overflow-x: auto;
          max-height: 300px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default AnimationPerformanceProfilerDemo;

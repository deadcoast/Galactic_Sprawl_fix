/**
 * LongSessionMemoryVisualizer Component
 *
 * A React component for visualizing long session memory tracking data.
 * Displays memory usage over time, detects potential memory leaks,
 * and provides insights for performance optimization.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  LongSessionMemoryTracker,
  MemorySnapshot,
  MemoryTrendAnalysis,
} from '../../utils/performance/longsession/LongSessionMemoryTracker';

interface LongSessionMemoryVisualizerProps {
  /** Instance of the memory tracker to visualize */
  memoryTracker?: LongSessionMemoryTracker;

  /** Memory snapshots to visualize (alternative to providing a tracker) */
  snapshots?: MemorySnapshot[];

  /** Memory trend analysis to display (alternative to providing a tracker) */
  analysis?: MemoryTrendAnalysis;

  /** Whether to auto-update the visualization */
  autoUpdate?: boolean;

  /** Update interval in milliseconds (if autoUpdate is true) */
  updateIntervalMs?: number;

  /** Width of the visualization */
  width?: number;

  /** Height of the visualization */
  height?: number;

  /** Whether to show detailed metrics */
  showDetailedMetrics?: boolean;

  /** Whether to show the memory chart */
  showMemoryChart?: boolean;

  /** Whether to show leak detection information */
  showLeakDetection?: boolean;

  /** Whether to display session markers */
  showSessionMarkers?: boolean;

  /** Callback when a leak is detected */
  onLeakDetected?: (analysis: MemoryTrendAnalysis) => void;
}

/**
 * Component for visualizing long session memory tracking data
 */
const LongSessionMemoryVisualizer: React.FC<LongSessionMemoryVisualizerProps> = ({
  memoryTracker,
  snapshots: propSnapshots,
  analysis: propAnalysis,
  autoUpdate = true,
  updateIntervalMs = 5000,
  width = 800,
  height = 400,
  showDetailedMetrics = true,
  showMemoryChart = true,
  showLeakDetection = true,
  showSessionMarkers = true,
  onLeakDetected,
}) => {
  // State for snapshots and analysis
  const [snapshots, setSnapshots] = useState<MemorySnapshot[]>([]);
  const [analysis, setAnalysis] = useState<MemoryTrendAnalysis | null>(null);
  const [sessionMarkers, setSessionMarkers] = useState<
    Array<{ timestamp: number; name: string; metadata?: Record<string, unknown> }>
  >([]);
  const [updateInterval, setUpdateInterval] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<MemorySnapshot | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | 'hour' | 'day'>('all');

  // Set up auto-updating if enabled
  useEffect(() => {
    if (autoUpdate && memoryTracker) {
      const intervalId = window.setInterval(() => {
        updateVisualization();
      }, updateIntervalMs);

      setUpdateInterval(intervalId);

      return () => {
        if (updateInterval !== null) {
          clearInterval(updateInterval);
        }
      };
    }
  }, [autoUpdate, memoryTracker, updateIntervalMs]);

  // Initialize with data from props or tracker
  useEffect(() => {
    updateVisualization();
  }, [memoryTracker, propSnapshots, propAnalysis]);

  // Render chart whenever snapshots or canvas changes
  useEffect(() => {
    if (showMemoryChart) {
      renderMemoryChart();
    }
  }, [snapshots, canvasRef.current, showMemoryChart, timeRange, sessionMarkers]);

  // Check for leak detection
  useEffect(() => {
    if (analysis && analysis.suspectedLeak && onLeakDetected) {
      onLeakDetected(analysis);
    }
  }, [analysis, onLeakDetected]);

  /**
   * Update the visualization with current data
   */
  const updateVisualization = () => {
    if (memoryTracker) {
      // Get data from the tracker
      setSnapshots(memoryTracker.getSnapshots());
      setAnalysis(memoryTracker.getLatestAnalysis());
      setSessionMarkers(memoryTracker.getSessionMarkers());
    } else if (propSnapshots) {
      // Use data from props
      setSnapshots(propSnapshots);
      setAnalysis(propAnalysis || null);
      setSessionMarkers([]);
    }
  };

  /**
   * Render the memory usage chart
   */
  const renderMemoryChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || snapshots.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter snapshots based on time range
    let filteredSnapshots = [...snapshots];
    if (timeRange !== 'all') {
      const now = Date.now();
      const timeRangeMs = timeRange === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      filteredSnapshots = snapshots.filter(s => now - s.timestamp < timeRangeMs);
    }

    if (filteredSnapshots.length < 2) {
      drawNoDataMessage(ctx);
      return;
    }

    // Calculate min/max values
    const memoryValues = filteredSnapshots.map(s => s.usedHeapSizeMB);
    const minMemory = Math.max(0, Math.min(...memoryValues) * 0.9);
    const maxMemory = Math.max(...memoryValues) * 1.1;

    // Calculate time range
    const startTime = filteredSnapshots[0].timestamp;
    const endTime = filteredSnapshots[filteredSnapshots.length - 1].timestamp;

    // Set up chart dimensions
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;

    // Draw axes
    drawAxes(ctx, padding, chartWidth, chartHeight, minMemory, maxMemory, startTime, endTime);

    // Draw data points
    drawDataPoints(
      ctx,
      filteredSnapshots,
      padding,
      chartWidth,
      chartHeight,
      minMemory,
      maxMemory,
      startTime,
      endTime
    );

    // Draw trend line if we have analysis
    if (analysis) {
      drawTrendLine(
        ctx,
        padding,
        chartWidth,
        chartHeight,
        minMemory,
        maxMemory,
        startTime,
        endTime,
        analysis
      );
    }

    // Draw session markers if enabled
    if (showSessionMarkers && sessionMarkers.length > 0) {
      drawSessionMarkers(ctx, sessionMarkers, padding, chartWidth, chartHeight, startTime, endTime);
    }
  };

  /**
   * Draw chart axes
   */
  const drawAxes = (
    ctx: CanvasRenderingContext2D,
    padding: { top: number; right: number; bottom: number; left: number },
    chartWidth: number,
    chartHeight: number,
    minMemory: number,
    maxMemory: number,
    startTime: number,
    endTime: number
  ) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Y-axis
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);

    // X-axis
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);

    ctx.stroke();

    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';

    const yTickCount = 5;
    for (let i = 0; i <= yTickCount; i++) {
      const value = minMemory + ((maxMemory - minMemory) * (yTickCount - i)) / yTickCount;
      const y = padding.top + (i * chartHeight) / yTickCount;

      ctx.beginPath();
      ctx.moveTo(padding.left - 5, y);
      ctx.lineTo(padding.left, y);
      ctx.stroke();

      ctx.fillText(`${value.toFixed(1)} MB`, padding.left - 10, y);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const xTickCount = 6;
    for (let i = 0; i <= xTickCount; i++) {
      const timestamp = startTime + ((endTime - startTime) * i) / xTickCount;
      const x = padding.left + (i * chartWidth) / xTickCount;

      ctx.beginPath();
      ctx.moveTo(x, padding.top + chartHeight);
      ctx.lineTo(x, padding.top + chartHeight + 5);
      ctx.stroke();

      // Format time label based on range
      let timeLabel;
      if (endTime - startTime > 24 * 60 * 60 * 1000) {
        // More than a day - show date
        timeLabel = new Date(timestamp).toLocaleDateString();
      } else if (endTime - startTime > 60 * 60 * 1000) {
        // More than an hour - show hours
        timeLabel = new Date(timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      } else {
        // Less than an hour - show minutes:seconds
        const date = new Date(timestamp);
        timeLabel = `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, '0')}`;
      }

      ctx.fillText(timeLabel, x, padding.top + chartHeight + 10);
    }

    // Chart title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Memory Usage Over Time', padding.left + chartWidth / 2, 10);

    // Y-axis title
    ctx.save();
    ctx.translate(20, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Memory Usage (MB)', 0, 0);
    ctx.restore();

    // X-axis title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Time', padding.left + chartWidth / 2, canvas.height - 15);
  };

  /**
   * Draw memory data points
   */
  const drawDataPoints = (
    ctx: CanvasRenderingContext2D,
    snapshots: MemorySnapshot[],
    padding: { top: number; right: number; bottom: number; left: number },
    chartWidth: number,
    chartHeight: number,
    minMemory: number,
    maxMemory: number,
    startTime: number,
    endTime: number
  ) => {
    if (snapshots.length < 2) return;

    // Draw line connecting points
    ctx.beginPath();
    ctx.strokeStyle = '#4285f4';
    ctx.lineWidth = 2;

    snapshots.forEach((snapshot, index) => {
      const x =
        padding.left + ((snapshot.timestamp - startTime) / (endTime - startTime)) * chartWidth;
      const y =
        padding.top +
        chartHeight -
        ((snapshot.usedHeapSizeMB - minMemory) / (maxMemory - minMemory)) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw individual points
    snapshots.forEach(snapshot => {
      const x =
        padding.left + ((snapshot.timestamp - startTime) / (endTime - startTime)) * chartWidth;
      const y =
        padding.top +
        chartHeight -
        ((snapshot.usedHeapSizeMB - minMemory) / (maxMemory - minMemory)) * chartHeight;

      ctx.beginPath();
      ctx.fillStyle = '#4285f4';
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  /**
   * Draw the trend line based on analysis
   */
  const drawTrendLine = (
    ctx: CanvasRenderingContext2D,
    padding: { top: number; right: number; bottom: number; left: number },
    chartWidth: number,
    chartHeight: number,
    minMemory: number,
    maxMemory: number,
    startTime: number,
    endTime: number,
    analysis: MemoryTrendAnalysis
  ) => {
    // Get first and last snapshot values based on analysis
    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];

    if (!firstSnapshot || !lastSnapshot) return;

    // Calculate trend line start and end points
    const x1 = padding.left;
    const y1 =
      padding.top +
      chartHeight -
      ((firstSnapshot.usedHeapSizeMB - minMemory) / (maxMemory - minMemory)) * chartHeight;

    // Use the trend slope to calculate the end point
    const timeSpanMs = lastSnapshot.timestamp - firstSnapshot.timestamp;
    const projectedGrowth = analysis.overallTrend * timeSpanMs;
    const projectedEndValue = firstSnapshot.usedHeapSizeMB + projectedGrowth;

    const x2 = padding.left + chartWidth;
    const y2 =
      padding.top +
      chartHeight -
      ((projectedEndValue - minMemory) / (maxMemory - minMemory)) * chartHeight;

    // Draw trend line
    ctx.beginPath();
    ctx.strokeStyle = analysis.suspectedLeak ? '#d93025' : '#fbbc04';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Add trend label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = analysis.suspectedLeak ? '#d93025' : '#fbbc04';
    ctx.font = 'bold 12px Arial';

    let trendLabel = `Trend: ${analysis.growthRatePerMinute.toFixed(2)} MB/min`;
    if (analysis.suspectedLeak) {
      trendLabel += ` (Leak Severity: ${analysis.leakSeverity}/5)`;
    }

    ctx.fillText(trendLabel, padding.left + chartWidth - 10, padding.top + 15);
  };

  /**
   * Draw session markers on the chart
   */
  const drawSessionMarkers = (
    ctx: CanvasRenderingContext2D,
    markers: Array<{ timestamp: number; name: string; metadata?: Record<string, unknown> }>,
    padding: { top: number; right: number; bottom: number; left: number },
    chartWidth: number,
    chartHeight: number,
    startTime: number,
    endTime: number
  ) => {
    markers.forEach(marker => {
      // Only draw markers within the visible time range
      if (marker.timestamp < startTime || marker.timestamp > endTime) return;

      const x =
        padding.left + ((marker.timestamp - startTime) / (endTime - startTime)) * chartWidth;

      // Draw marker line
      ctx.beginPath();
      ctx.strokeStyle = getMarkerColor(marker.name);
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw marker label
      ctx.save();
      ctx.translate(x, padding.top + 5);
      ctx.rotate(Math.PI / 4);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = getMarkerColor(marker.name);
      ctx.font = '10px Arial';
      ctx.fillText(formatMarkerName(marker.name), 0, 0);
      ctx.restore();
    });
  };

  /**
   * Get color for a marker based on its name
   */
  const getMarkerColor = (markerName: string): string => {
    switch (markerName) {
      case 'tracking_started':
        return '#34a853'; // Green
      case 'tracking_stopped':
        return '#fbbc04'; // Yellow
      case 'leak_detected':
        return '#d93025'; // Red
      default:
        return '#4285f4'; // Blue
    }
  };

  /**
   * Format marker name for display
   */
  const formatMarkerName = (markerName: string): string => {
    return markerName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  /**
   * Draw a message when no data is available
   */
  const drawNoDataMessage = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.fillText('Not enough data to display chart', canvas.width / 2, canvas.height / 2);
  };

  /**
   * Format a duration in milliseconds to a human-readable string
   */
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  /**
   * Handle canvas click to select a data point
   */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || snapshots.length < 2) return;

    // Get click coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Calculate chart dimensions
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };
    const chartWidth = canvas.width - padding.left - padding.right;

    // Only handle clicks within the chart area
    if (x < padding.left || x > padding.left + chartWidth) return;

    // Get time range
    const startTime = snapshots[0].timestamp;
    const endTime = snapshots[snapshots.length - 1].timestamp;

    // Convert x position to timestamp
    const clickTime = startTime + ((x - padding.left) / chartWidth) * (endTime - startTime);

    // Find closest snapshot
    let closestSnapshot = snapshots[0];
    let minTimeDiff = Math.abs(clickTime - closestSnapshot.timestamp);

    for (const snapshot of snapshots) {
      const timeDiff = Math.abs(clickTime - snapshot.timestamp);
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestSnapshot = snapshot;
      }
    }

    setSelectedSnapshot(closestSnapshot);
  };

  return (
    <div className="long-session-memory-visualizer" style={{ width, maxWidth: '100%' }}>
      <div className="memory-visualizer-header">
        <h3>Long Session Memory Tracking</h3>

        {/* Time range selector */}
        <div className="time-range-selector">
          <span>Time Range:</span>
          <button
            className={timeRange === 'all' ? 'active' : ''}
            onClick={() => setTimeRange('all')}
          >
            All
          </button>
          <button
            className={timeRange === 'day' ? 'active' : ''}
            onClick={() => setTimeRange('day')}
          >
            Day
          </button>
          <button
            className={timeRange === 'hour' ? 'active' : ''}
            onClick={() => setTimeRange('hour')}
          >
            Hour
          </button>
        </div>
      </div>

      {/* Memory usage chart */}
      {showMemoryChart && (
        <div className="memory-chart">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onClick={handleCanvasClick}
            style={{ cursor: 'pointer' }}
          ></canvas>
        </div>
      )}

      {/* Selected snapshot details */}
      {selectedSnapshot && (
        <div className="snapshot-details">
          <h4>Snapshot Details</h4>
          <p>Time: {new Date(selectedSnapshot.timestamp).toLocaleString()}</p>
          <p>Memory Usage: {selectedSnapshot.usedHeapSizeMB.toFixed(2)} MB</p>
          <p>Heap Size: {selectedSnapshot.totalHeapSizeMB.toFixed(2)} MB</p>
          {selectedSnapshot.domNodeCount && <p>DOM Nodes: {selectedSnapshot.domNodeCount}</p>}
        </div>
      )}

      {/* Memory analysis */}
      {showLeakDetection && analysis && (
        <div className={`memory-analysis ${analysis.suspectedLeak ? 'leak-detected' : ''}`}>
          <h4>Memory Analysis</h4>

          <div className="analysis-metrics">
            <div className="metric">
              <div className="metric-label">Growth Rate</div>
              <div className="metric-value">{analysis.growthRatePerMinute.toFixed(2)} MB/min</div>
            </div>

            <div className="metric">
              <div className="metric-label">Hourly Growth</div>
              <div className="metric-value">{analysis.growthRatePerHour.toFixed(2)} MB/hour</div>
            </div>

            <div className="metric">
              <div className="metric-label">Confidence</div>
              <div className="metric-value">{(analysis.confidence * 100).toFixed(0)}%</div>
            </div>

            {analysis.estimatedTimeToLimit < Number.POSITIVE_INFINITY && (
              <div className="metric">
                <div className="metric-label">Time to Limit</div>
                <div className="metric-value">{formatDuration(analysis.estimatedTimeToLimit)}</div>
              </div>
            )}
          </div>

          {analysis.suspectedLeak && (
            <div className="leak-warning">
              <h5>Memory Leak Detected!</h5>
              <p>Severity: {analysis.leakSeverity} / 5</p>
              <p>Memory is growing at a rate that indicates a probable leak.</p>
              {analysis.isAccelerating && (
                <p>
                  <strong>Warning:</strong> Growth rate is accelerating!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detailed metrics */}
      {showDetailedMetrics && snapshots.length > 0 && (
        <div className="detailed-metrics">
          <h4>Detailed Metrics</h4>

          <div className="metrics-summary">
            <div className="metric">
              <div className="metric-label">Session Duration</div>
              <div className="metric-value">
                {formatDuration(snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp)}
              </div>
            </div>

            <div className="metric">
              <div className="metric-label">Snapshots</div>
              <div className="metric-value">{snapshots.length}</div>
            </div>

            <div className="metric">
              <div className="metric-label">Current Memory</div>
              <div className="metric-value">
                {snapshots[snapshots.length - 1].usedHeapSizeMB.toFixed(2)} MB
              </div>
            </div>

            <div className="metric">
              <div className="metric-label">Memory Change</div>
              <div className="metric-value">
                {(
                  snapshots[snapshots.length - 1].usedHeapSizeMB - snapshots[0].usedHeapSizeMB
                ).toFixed(2)}{' '}
                MB
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session markers list */}
      {showSessionMarkers && sessionMarkers.length > 0 && (
        <div className="session-markers">
          <h4>Session Events</h4>
          <ul>
            {sessionMarkers.map((marker, index) => (
              <li key={index} className={`marker-${marker.name}`}>
                <span className="marker-time">
                  {new Date(marker.timestamp).toLocaleTimeString()}
                </span>
                <span className="marker-name">{formatMarkerName(marker.name)}</span>
                {marker.name === 'leak_detected' && marker.metadata && (
                  <span className="marker-details">
                    (Growth: {(marker.metadata.growthRatePerMinute as number).toFixed(2)} MB/min,
                    Severity: {marker.metadata.severity})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .long-session-memory-visualizer {
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            Arial,
            sans-serif;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .memory-visualizer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .memory-visualizer-header h3 {
          margin: 0;
          color: #202124;
        }

        .time-range-selector {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .time-range-selector span {
          font-size: 14px;
          color: #5f6368;
        }

        .time-range-selector button {
          background: #e8eaed;
          border: none;
          border-radius: 4px;
          padding: 5px 10px;
          font-size: 14px;
          cursor: pointer;
          color: #5f6368;
        }

        .time-range-selector button.active {
          background: #4285f4;
          color: white;
        }

        .memory-chart {
          background: white;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .snapshot-details {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #4285f4;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .snapshot-details h4 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #202124;
        }

        .snapshot-details p {
          margin: 5px 0;
          color: #5f6368;
        }

        .memory-analysis {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #4285f4;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .memory-analysis.leak-detected {
          border-left: 4px solid #d93025;
        }

        .memory-analysis h4 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #202124;
        }

        .analysis-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }

        .metric {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          text-align: center;
        }

        .metric-label {
          font-size: 12px;
          color: #5f6368;
          margin-bottom: 5px;
        }

        .metric-value {
          font-size: 16px;
          font-weight: 500;
          color: #202124;
        }

        .leak-warning {
          background: #fef7f6;
          border-radius: 4px;
          padding: 15px;
          margin-top: 10px;
          border-left: 4px solid #d93025;
        }

        .leak-warning h5 {
          color: #d93025;
          margin-top: 0;
          margin-bottom: 10px;
        }

        .leak-warning p {
          margin: 5px 0;
          color: #5f6368;
        }

        .detailed-metrics {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .detailed-metrics h4 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #202124;
        }

        .metrics-summary {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
        }

        .session-markers {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .session-markers h4 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #202124;
        }

        .session-markers ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .session-markers li {
          padding: 8px 0;
          border-bottom: 1px solid #e8eaed;
          color: #5f6368;
        }

        .session-markers li:last-child {
          border-bottom: none;
        }

        .marker-time {
          margin-right: 10px;
          font-size: 12px;
          color: #5f6368;
        }

        .marker-name {
          font-weight: 500;
          color: #202124;
        }

        .marker-details {
          margin-left: 10px;
          font-size: 12px;
          color: #5f6368;
        }

        .marker-tracking_started .marker-name {
          color: #34a853;
        }

        .marker-tracking_stopped .marker-name {
          color: #fbbc04;
        }

        .marker-leak_detected .marker-name {
          color: #d93025;
        }
      `}</style>
    </div>
  );
};

export default LongSessionMemoryVisualizer;

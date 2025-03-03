import React, { useEffect, useState } from 'react';
import { ApplicationProfilingMetrics, ComponentRenderMetrics } from '../../../types/ui/UITypes';
import { applicationProfiler } from '../../../utils/profiling/applicationProfiler';

interface ProfilingOverlayProps {
  /**
   * Whether the overlay is visible
   * @default false
   */
  visible?: boolean;

  /**
   * Update interval in milliseconds
   * @default 1000
   */
  updateInterval?: number;

  /**
   * Maximum number of components to display
   * @default 10
   */
  maxComponents?: number;

  /**
   * Whether to show wasted renders
   * @default true
   */
  showWastedRenders?: boolean;

  /**
   * Whether to show render times
   * @default true
   */
  showRenderTimes?: boolean;

  /**
   * Whether to show render counts
   * @default true
   */
  showRenderCounts?: boolean;

  /**
   * Whether to auto-start profiling
   * @default true
   */
  autoStart?: boolean;

  /**
   * Callback when profiling is started
   */
  onStart?: () => void;

  /**
   * Callback when profiling is stopped
   */
  onStop?: () => void;

  /**
   * Callback when metrics are reset
   */
  onReset?: () => void;
}

/**
 * Component for displaying profiling metrics
 */
export const ProfilingOverlay: React.FC<ProfilingOverlayProps> = ({
  visible = false,
  updateInterval = 1000,
  maxComponents = 10,
  showWastedRenders = true,
  showRenderTimes = true,
  showRenderCounts = true,
  autoStart = true,
  onStart,
  onStop,
  onReset,
}) => {
  const [metrics, setMetrics] = useState<ApplicationProfilingMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'renderCount' | 'renderTime' | 'wastedRenders'>(
    'renderTime'
  );
  const [isExpanded, setIsExpanded] = useState(false);

  // Start/stop profiling based on visibility
  useEffect(() => {
    if (visible) {
      if (autoStart && !applicationProfiler.isActive()) {
        applicationProfiler.start();
        onStart?.();
      }
    } else if (applicationProfiler.isActive()) {
      applicationProfiler.stop();
      onStop?.();
    }
  }, [visible, autoStart, onStart, onStop]);

  // Update metrics at regular intervals
  useEffect(() => {
    if (!visible) {
      return;
    }

    const updateMetrics = () => {
      setMetrics(applicationProfiler.getMetrics());
    };

    // Initial update
    updateMetrics();

    // Set up interval
    const intervalId = setInterval(updateMetrics, updateInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [visible, updateInterval]);

  if (!visible || !metrics) {
    return null;
  }

  // Get components based on active tab
  const getComponentsToDisplay = (): ComponentRenderMetrics[] => {
    switch (activeTab) {
      case 'renderCount':
        return metrics.componentsByRenderCount.slice(0, maxComponents);
      case 'renderTime':
        return metrics.componentsByRenderTime.slice(0, maxComponents);
      case 'wastedRenders':
        return metrics.componentsByWastedRenders.slice(0, maxComponents);
      default:
        return metrics.componentsByRenderTime.slice(0, maxComponents);
    }
  };

  // Format time in ms
  const formatTime = (ms: number): string => {
    return ms < 1 ? `${(ms * 1000).toFixed(2)}μs` : `${ms.toFixed(2)}ms`;
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Handle reset
  const handleReset = () => {
    applicationProfiler.resetAll();
    onReset?.();
  };

  // Handle start/stop
  const handleStartStop = () => {
    if (applicationProfiler.isActive()) {
      applicationProfiler.stop();
      onStop?.();
    } else {
      applicationProfiler.start();
      onStart?.();
    }
  };

  return (
    <div className="profiling-overlay">
      <div className="profiling-overlay__header">
        <h3 className="profiling-overlay__title">Performance Profiler</h3>
        <div className="profiling-overlay__controls">
          <button className="profiling-overlay__button" onClick={handleStartStop}>
            {applicationProfiler.isActive() ? 'Stop' : 'Start'}
          </button>
          <button className="profiling-overlay__button" onClick={handleReset}>
            Reset
          </button>
          <button className="profiling-overlay__button" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      <div className="profiling-overlay__summary">
        <div className="profiling-overlay__metric">
          <span className="profiling-overlay__metric-label">Total Renders:</span>
          <span className="profiling-overlay__metric-value">{metrics.totalRenders}</span>
        </div>
        <div className="profiling-overlay__metric">
          <span className="profiling-overlay__metric-label">Wasted Renders:</span>
          <span className="profiling-overlay__metric-value">{metrics.totalWastedRenders}</span>
        </div>
        <div className="profiling-overlay__metric">
          <span className="profiling-overlay__metric-label">Avg Render Time:</span>
          <span className="profiling-overlay__metric-value">
            {formatTime(metrics.averageRenderTime)}
          </span>
        </div>
        <div className="profiling-overlay__metric">
          <span className="profiling-overlay__metric-label">Duration:</span>
          <span className="profiling-overlay__metric-value">
            {formatDuration(metrics.profilingDuration)}
          </span>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="profiling-overlay__tabs">
            <button
              className={`profiling-overlay__tab ${activeTab === 'renderTime' ? 'profiling-overlay__tab--active' : ''}`}
              onClick={() => setActiveTab('renderTime')}
            >
              By Render Time
            </button>
            <button
              className={`profiling-overlay__tab ${activeTab === 'renderCount' ? 'profiling-overlay__tab--active' : ''}`}
              onClick={() => setActiveTab('renderCount')}
            >
              By Render Count
            </button>
            <button
              className={`profiling-overlay__tab ${activeTab === 'wastedRenders' ? 'profiling-overlay__tab--active' : ''}`}
              onClick={() => setActiveTab('wastedRenders')}
            >
              By Wasted Renders
            </button>
          </div>

          <div className="profiling-overlay__table-container">
            <table className="profiling-overlay__table">
              <thead>
                <tr>
                  <th>Component</th>
                  {showRenderCounts && <th>Renders</th>}
                  {showRenderTimes && <th>Avg Time</th>}
                  {showRenderTimes && <th>Max Time</th>}
                  {showWastedRenders && <th>Wasted</th>}
                </tr>
              </thead>
              <tbody>
                {getComponentsToDisplay().map(component => (
                  <tr key={component.componentName}>
                    <td className="profiling-overlay__component-name">{component.componentName}</td>
                    {showRenderCounts && (
                      <td className="profiling-overlay__render-count">{component.renderCount}</td>
                    )}
                    {showRenderTimes && (
                      <td
                        className={`profiling-overlay__render-time ${
                          component.averageRenderTime > 16
                            ? 'profiling-overlay__render-time--slow'
                            : ''
                        }`}
                      >
                        {formatTime(component.averageRenderTime)}
                      </td>
                    )}
                    {showRenderTimes && (
                      <td
                        className={`profiling-overlay__render-time ${
                          component.maxRenderTime > 16 ? 'profiling-overlay__render-time--slow' : ''
                        }`}
                      >
                        {formatTime(component.maxRenderTime)}
                      </td>
                    )}
                    {showWastedRenders && (
                      <td
                        className={`profiling-overlay__wasted-renders ${
                          component.wastedRenders > 0
                            ? 'profiling-overlay__wasted-renders--warning'
                            : ''
                        }`}
                      >
                        {component.wastedRenders}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilingOverlay;

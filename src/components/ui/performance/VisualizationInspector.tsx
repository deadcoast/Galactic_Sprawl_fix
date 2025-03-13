import * as d3 from 'd3';
import React, { useEffect, useRef, useState } from 'react';

/**
 * Interface for component performance metrics
 */
interface ComponentPerformanceMetrics {
  // Component identifier
  id: string;
  // Component name
  name: string;
  // Render time in milliseconds
  renderTime: number[];
  // Number of DOM updates
  domUpdates: number[];
  // Update frequency (updates per second)
  updateFrequency: number;
  // Memory usage estimate
  memoryUsage: number;
  // Whether the component is currently visible
  isVisible: boolean;
  // DOM element count within component
  elementCount: number;
  // Parent component identifier (if any)
  parentId: string | null | undefined;
}

/**
 * Interface for DOM mutation record
 */
interface DomMutationRecord {
  // Timestamp of the mutation
  timestamp: number;
  // Type of mutation (attributes, childList, characterData)
  type: 'added' | 'removed' | 'modified';
  // Target element
  element: string; // Element description (like 'div.classname')
  // Component name where this mutation occurred
  component?: string;
  // Details about the mutation
  details?: Record<string, unknown>;
}

/**
 * Interface for performance issue
 */
interface PerformanceIssue {
  // Timestamp when the issue was detected
  timestamp: number;
  // Type of issue
  type: string;
  // Severity level
  severity: 'low' | 'medium' | 'high' | 'critical';
  // Description of the issue
  description: string;
  // Components involved in the issue
  components: string[];
  // Stack trace (if available)
  stackTrace: string;
  // Duration of the issue (if applicable)
  duration?: number;
  // Additional details about the issue
  details: Record<string, unknown>;
}

// Interface for rendering performance data
interface RenderingPerformanceData {
  timestamp: number;
  fps: number;
  frameTime: number;
  gpuTime?: number;
  cpuTime?: number;
  jsHeapSize?: number;
}

/**
 * Interface for the visualization inspector props
 */
interface VisualizationInspectorProps {
  // Whether the inspector is active
  active: boolean;
  // Dimensions for the visualization container
  dimensions: { width: number; height: number };
  // Target component or element to inspect (optional)
  target?: string;
  // Callback when issues are detected
  onIssueDetected?: (issue: PerformanceIssue) => void;
}

// Define TypeScript interfaces for browser APIs that might not have type definitions
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  // Add additional properties to match PerformanceMetrics
  networkLatency?: number;
  frameDrops?: number;
  gcTime?: number;
}

// Define additional types for performance entries
interface ExtendedPerformanceEntry extends PerformanceEntry {
  attribution?: Record<string, unknown>;
}

// Extend the Performance interface to include the memory property
// Use a different name to avoid conflict with the global declaration in useDebugOverlay.ts
declare global {
  interface PerformanceWithMemory extends Performance {
    memory?: PerformanceMemory;
  }
}

// Improve type safety around window access
interface WindowWithPerformance extends Window {
  componentTrackingInterval?: number | NodeJS.Timeout;
  memoryLeakInterval?: number | NodeJS.Timeout;
  frameRateTrackingId?: number;
  performance: PerformanceWithMemory;
}

/**
 * A comprehensive visualization inspector tool for deep performance analysis
 * including rendering performance, component breakdowns, DOM mutations, and
 * stack trace collection for performance issues.
 */
export const VisualizationInspector: React.FC<VisualizationInspectorProps> = ({
  active,
  dimensions: { width, height },
  target,
  onIssueDetected,
}) => {
  // State for component metrics
  const [componentMetrics, setComponentMetrics] = useState<ComponentPerformanceMetrics[]>([]);

  // State for DOM mutations
  const [domMutations, setDomMutations] = useState<DomMutationRecord[]>([]);

  // State for performance issues
  const [performanceIssues, setPerformanceIssues] = useState<PerformanceIssue[]>([]);

  // State for selected tab
  const [activeTab, setActiveTab] = useState<'rendering' | 'components' | 'dom' | 'issues'>(
    'rendering'
  );

  // State for recording status
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // State for rendering performance data
  const [renderingPerformanceData, setRenderingPerformanceData] = useState<
    RenderingPerformanceData[]
  >([]);

  // State for frame times
  const [frameTimes, setFrameTimes] = useState<number[]>([]);

  // State for FPS history
  const [_fpsHistory, setFpsHistory] = useState<number[]>([]);

  // Refs for chart containers
  const renderingChartRef = useRef<HTMLDivElement>(null);
  const componentBreakdownRef = useRef<HTMLDivElement>(null);
  const domMutationsRef = useRef<HTMLDivElement>(null);
  const issuesListRef = useRef<HTMLDivElement>(null);

  // Ref for performance observer
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  // Ref for mutation observer
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  // Ref for last frame timestamp
  const lastFrameTimestampRef = useRef<number>(0);

  // Ref for animation frame ID
  const animationFrameIdRef = useRef<number>(0);

  // Initialize the inspector when component mounts or active state changes
  useEffect(() => {
    if (active) {
      initializeInspector();
    }

    return () => {
      cleanupInspector();
    };
  }, [active, target]);

  // Initialize the visualization inspector
  const initializeInspector = () => {
    console.warn('Initializing visualization inspector');

    // Set up various inspection features
    setupRenderingAnalysis();
    setupComponentBreakdown();
    setupDomMutationTracking();
    setupStackTraceCollection();

    // Start recording
    setIsRecording(true);
  };

  // Clean up resources when component unmounts or becomes inactive
  const cleanupInspector = () => {
    console.warn('Cleaning up visualization inspector');

    // Stop recording
    setIsRecording(false);

    // Cancel animation frame
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = 0;
    }

    // Disconnect performance observer
    if (performanceObserverRef.current) {
      performanceObserverRef.current.disconnect();
      performanceObserverRef.current = null;
    }

    // Disconnect mutation observer
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
      mutationObserverRef.current = null;
    }

    // Clear any intervals
    if (typeof window !== 'undefined') {
      const win = window as unknown as WindowWithPerformance;

      if (win.componentTrackingInterval) {
        clearInterval(win.componentTrackingInterval);
        delete win.componentTrackingInterval;
      }

      if (win.memoryLeakInterval) {
        clearInterval(win.memoryLeakInterval);
        delete win.memoryLeakInterval;
      }

      if (win.frameRateTrackingId) {
        cancelAnimationFrame(win.frameRateTrackingId);
        delete win.frameRateTrackingId;
      }
    }

    console.warn('Visualization inspector cleaned up');
  };

  // Setup deep rendering performance analysis
  const setupRenderingAnalysis = () => {
    console.warn('Setting up rendering analysis');

    // Use PerformanceObserver to track long tasks
    try {
      if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
        const observer = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            // Check if this is a long task (> 50ms)
            if (entry.entryType === 'longtask' && entry.duration > 50) {
              const now = performance.now();

              // Create performance issue for long task
              const newIssue: PerformanceIssue = {
                timestamp: now,
                type: 'long-task',
                severity: entry.duration > 100 ? 'critical' : 'high',
                description: `Long task detected (${entry.duration.toFixed(2)}ms)`,
                components: [],
                stackTrace: getStackTrace(),
                duration: entry.duration,
                details: {
                  taskDuration: entry.duration,
                  taskName: entry.name,
                  taskAttribution: (entry as ExtendedPerformanceEntry).attribution
                    ? JSON.stringify((entry as ExtendedPerformanceEntry).attribution)
                    : 'Unknown',
                },
              };

              setPerformanceIssues(prev => [...prev, newIssue]);

              // Trigger callback if provided
              if (onIssueDetected) {
                onIssueDetected(newIssue);
              }
            }
          });
        });

        observer.observe({ entryTypes: ['longtask'] });
        performanceObserverRef.current = observer;
      }
    } catch (error) {
      console.error('Error setting up PerformanceObserver:', error);
    }

    // Start frame rate tracking
    if (isRecording) {
      startFrameRateTracking();
    }
  };

  // Start frame rate tracking
  const startFrameRateTracking = () => {
    // Function to update frame data
    const updateFrame = (timestamp: number): void => {
      // Calculate time since last animation frame
      const currentFrameTime = timestamp - lastFrameTimestampRef.current;
      lastFrameTimestampRef.current = timestamp;

      // Store frame time
      setFrameTimes(prev => {
        const newFrameTimes = [...prev, currentFrameTime];

        // Keep only the last 60 frame times
        return newFrameTimes.slice(-60);
      });

      // Calculate current FPS
      if (frameTimes.length > 0) {
        const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
        const currentFps = 1000 / avgFrameTime;

        // Store FPS data point
        setFpsHistory(prev => {
          const newFpsHistory = [...prev, currentFps];

          // Keep only the last 120 FPS values (60 seconds at 0.5s updates)
          return newFpsHistory.slice(-120);
        });

        // Get JS heap size if available
        let jsHeapSize = undefined;
        const windowWithPerformance = window as WindowWithPerformance;
        if (
          windowWithPerformance.performance.memory &&
          windowWithPerformance.performance.memory.usedJSHeapSize
        ) {
          jsHeapSize = windowWithPerformance.performance.memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
        }

        // Add new rendering performance data point
        setRenderingPerformanceData(prev => {
          const newData = [
            ...prev,
            {
              timestamp,
              fps: currentFps,
              frameTime: avgFrameTime,
              jsHeapSize,
            },
          ];

          // Keep only the last 120 data points
          return newData.slice(-120);
        });

        // Detect performance issues
        if (currentFps < 30 && isRecording) {
          const now = performance.now();

          // Create a performance issue for low FPS
          const newIssue: PerformanceIssue = {
            timestamp: now,
            type: 'fps-drop',
            severity: currentFps < 15 ? 'critical' : currentFps < 24 ? 'high' : 'medium',
            description: `Low FPS detected (${currentFps.toFixed(1)} FPS)`,
            components: [],
            stackTrace: getStackTrace(),
            details: {
              currentFps,
              avgFrameTime,
              jsHeapSize,
            },
          };

          setPerformanceIssues(prev => [...prev, newIssue]);

          // Trigger callback if provided
          if (onIssueDetected) {
            onIssueDetected(newIssue);
          }
        }

        // Update chart if recording
        if (isRecording && renderingChartRef.current) {
          updateRenderingPerformanceChart();
        }
      }

      // Continue frame rate tracking
      if (isRecording) {
        animationFrameIdRef.current = requestAnimationFrame(updateFrame);
      }
    };

    // Start tracking
    animationFrameIdRef.current = requestAnimationFrame(updateFrame);
  };

  // Update rendering performance chart
  const updateRenderingPerformanceChart = () => {
    if (!renderingChartRef.current || renderingPerformanceData.length === 0) return;

    // Clear previous chart
    const container = d3.select(renderingChartRef.current);
    container.selectAll('*').remove();

    // Set up chart dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const chartWidth = width - margin.left - margin.right - 40;
    const chartHeight = (height - margin.top - margin.bottom - 100) / 2; // Divide vertically for 2 charts

    // Create SVG for FPS chart
    const fpsSvg = container
      .append('svg')
      .attr('width', chartWidth + margin.left + margin.right)
      .attr('height', chartHeight + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales for FPS chart
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(renderingPerformanceData, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, Math.max(60, d3.max(renderingPerformanceData, d => d.fps) as number)])
      .range([chartHeight, 0]);

    // Create axes for FPS chart
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    // Add axes to FPS chart
    fpsSvg.append('g').attr('transform', `translate(0,${chartHeight})`).call(xAxis);

    fpsSvg.append('g').call(yAxis);

    // Add chart title
    fpsSvg
      .append('text')
      .attr('x', chartWidth / 2)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Frames Per Second (FPS)');

    // Create line generator for FPS
    const fpsLine = d3
      .line<RenderingPerformanceData>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.fps))
      .curve(d3.curveMonotoneX);

    // Add FPS line to chart
    fpsSvg
      .append('path')
      .datum(renderingPerformanceData)
      .attr('fill', 'none')
      .attr('stroke', '#4285F4')
      .attr('stroke-width', 2)
      .attr('d', fpsLine);

    // Create a 60 FPS reference line
    fpsSvg
      .append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', yScale(60))
      .attr('y2', yScale(60))
      .attr('stroke', 'rgba(66, 133, 244, 0.3)')
      .attr('stroke-dasharray', '4');

    fpsSvg
      .append('text')
      .attr('x', chartWidth)
      .attr('y', yScale(60) - 5)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', 'rgba(66, 133, 244, 0.7)')
      .text('Target: 60 FPS');

    // Create SVG for frame time chart
    const frameTimeSvg = container
      .append('svg')
      .attr('width', chartWidth + margin.left + margin.right)
      .attr('height', chartHeight + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales for frame time chart
    const yScaleFrameTime = d3
      .scaleLinear()
      .domain([0, Math.max(33, d3.max(renderingPerformanceData, d => d.frameTime) as number)])
      .range([chartHeight, 0]);

    // Create axes for frame time chart
    const yAxisFrameTime = d3.axisLeft(yScaleFrameTime).ticks(5);

    // Add axes to frame time chart
    frameTimeSvg.append('g').attr('transform', `translate(0,${chartHeight})`).call(xAxis);

    frameTimeSvg.append('g').call(yAxisFrameTime);

    // Add chart title
    frameTimeSvg
      .append('text')
      .attr('x', chartWidth / 2)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Frame Time (ms)');

    // Create line generator for frame time
    const frameTimeLine = d3
      .line<RenderingPerformanceData>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScaleFrameTime(d.frameTime))
      .curve(d3.curveMonotoneX);

    // Add frame time line to chart
    frameTimeSvg
      .append('path')
      .datum(renderingPerformanceData)
      .attr('fill', 'none')
      .attr('stroke', '#EA4335')
      .attr('stroke-width', 2)
      .attr('d', frameTimeLine);

    // Create a 16.67ms reference line (60 FPS)
    frameTimeSvg
      .append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', yScaleFrameTime(16.67))
      .attr('y2', yScaleFrameTime(16.67))
      .attr('stroke', 'rgba(234, 67, 53, 0.3)')
      .attr('stroke-dasharray', '4');

    frameTimeSvg
      .append('text')
      .attr('x', chartWidth)
      .attr('y', yScaleFrameTime(16.67) - 5)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', 'rgba(234, 67, 53, 0.7)')
      .text('Target: 16.67ms');

    // Add current statistics
    const statsDiv = container
      .append('div')
      .attr('class', 'performance-stats')
      .style('margin-top', '20px')
      .style('padding', '15px')
      .style('background', '#f5f5f5')
      .style('border-radius', '4px');

    // Calculate current stats
    const currentFps =
      renderingPerformanceData.length > 0
        ? renderingPerformanceData[renderingPerformanceData.length - 1].fps
        : 0;

    const averageFrameTime =
      renderingPerformanceData.length > 0
        ? renderingPerformanceData[renderingPerformanceData.length - 1].frameTime
        : 0;

    const currentJsHeapSize =
      renderingPerformanceData.length > 0 &&
      renderingPerformanceData[renderingPerformanceData.length - 1].jsHeapSize
        ? renderingPerformanceData[renderingPerformanceData.length - 1].jsHeapSize
        : 'N/A';

    // Display stats
    statsDiv.html(`
      <div style="display: flex; justify-content: space-around; text-align: center;">
        <div>
          <div style="font-size: 24px; font-weight: 500; color: ${currentFps < 30 ? '#EA4335' : currentFps < 55 ? '#FBBC05' : '#34A853'};">
            ${currentFps}
          </div>
          <div style="font-size: 14px; color: #666;">Current FPS</div>
        </div>
        
        <div>
          <div style="font-size: 24px; font-weight: 500; color: ${averageFrameTime > 33 ? '#EA4335' : averageFrameTime > 20 ? '#FBBC05' : '#34A853'};">
            ${averageFrameTime.toFixed(2)}
          </div>
          <div style="font-size: 14px; color: #666;">Frame Time (ms)</div>
        </div>
        
        <div>
          <div style="font-size: 24px; font-weight: 500;">
            ${typeof currentJsHeapSize === 'number' ? currentJsHeapSize.toFixed(1) + ' MB' : currentJsHeapSize}
          </div>
          <div style="font-size: 14px; color: #666;">JS Heap</div>
        </div>
        
        <div>
          <div style="font-size: 24px; font-weight: 500;">
            ${performance.now().toFixed(0)}
          </div>
          <div style="font-size: 14px; color: #666;">Time (ms)</div>
        </div>
      </div>
    `);
  };

  // Get stack trace for debugging
  const getStackTrace = (): string => {
    try {
      throw new Error('Performance issue detected');
    } catch (err: unknown) {
      if (err instanceof Error && err.stack) {
        return err.stack;
      }
      return 'Stack trace unavailable';
    }
  };

  // Setup component performance breakdown
  const setupComponentBreakdown = () => {
    console.warn('Setting up component performance breakdown');

    // This would typically be done through patching React's reconciler or using a profiler API
    // For this example, we'll simulate component performance data

    // Sample components to track
    const sampleComponents = [
      { id: 'comp-1', name: 'App', parentId: null },
      { id: 'comp-2', name: 'PerformanceMonitor', parentId: 'comp-1' },
      { id: 'comp-3', name: 'VisualizationContainer', parentId: 'comp-1' },
      { id: 'comp-4', name: 'ResourceDisplay', parentId: 'comp-3' },
      { id: 'comp-5', name: 'StatisticsPanel', parentId: 'comp-3' },
      { id: 'comp-6', name: 'NavigationBar', parentId: 'comp-1' },
    ];

    // Initialize metrics for each component
    const initialMetrics: ComponentPerformanceMetrics[] = sampleComponents.map(comp => ({
      id: comp.id,
      name: comp.name,
      renderTime: [],
      domUpdates: [],
      updateFrequency: 0,
      memoryUsage: 0,
      isVisible: true,
      elementCount: Math.floor(Math.random() * 50) + 5, // Random element count between 5 and 54
      parentId: comp.parentId,
    }));

    // Set initial component metrics
    setComponentMetrics(initialMetrics);

    // Set up interval to simulate component performance updates
    if (isRecording) {
      startComponentPerformanceTracking();
    }
  };

  // Start component performance tracking
  const startComponentPerformanceTracking = () => {
    // Clear any previous interval
    const windowWithPerformance = window as WindowWithPerformance;
    if (windowWithPerformance.componentTrackingInterval) {
      clearInterval(windowWithPerformance.componentTrackingInterval);
    }

    // Set up interval to update component metrics
    const trackingInterval = setInterval(() => {
      if (!isRecording) {
        clearInterval(trackingInterval);
        return;
      }

      // Update component metrics
      setComponentMetrics(prev => {
        const now = performance.now();

        return prev.map(comp => {
          // Simulate render time (1-20ms, weighted towards lower values)
          const renderTime = Math.pow(Math.random(), 2) * 19 + 1;

          // Simulate DOM updates (0-10, integer)
          const domUpdates = Math.floor(Math.random() * 11);

          // Simulate update frequency based on component type
          let updateFrequency = 0;
          if (comp.name.includes('Display') || comp.name.includes('Monitor')) {
            // High update frequency components
            updateFrequency = 10 + Math.random() * 20; // 10-30 updates/sec
          } else if (comp.name.includes('Container') || comp.name.includes('Panel')) {
            // Medium update frequency components
            updateFrequency = 5 + Math.random() * 10; // 5-15 updates/sec
          } else {
            // Low update frequency components
            updateFrequency = 1 + Math.random() * 5; // 1-6 updates/sec
          }

          // Simulate memory usage based on element count
          const memoryUsage = comp.elementCount * (0.1 + Math.random() * 0.1); // 0.1-0.2 MB per element

          // Look for potential performance issues
          if (renderTime > 16) {
            // Create a performance issue for slow rendering
            const newIssue: PerformanceIssue = {
              timestamp: now,
              type: 'excessive-render',
              severity: renderTime > 50 ? 'critical' : renderTime > 30 ? 'high' : 'medium',
              description: `Slow render detected in component '${comp.name}' (${renderTime.toFixed(2)}ms)`,
              components: [comp.name],
              stackTrace: getStackTrace(),
              details: {
                componentId: comp.id,
                renderTime,
                updateFrequency,
                elementCount: comp.elementCount,
              },
            };

            setPerformanceIssues(prev => [...prev, newIssue]);

            // Trigger callback if provided
            if (onIssueDetected) {
              onIssueDetected(newIssue);
            }
          }

          if (domUpdates > 5) {
            // Create a performance issue for DOM churn
            const newIssue: PerformanceIssue = {
              timestamp: now,
              type: 'dom-churn',
              severity: domUpdates > 8 ? 'high' : 'medium',
              description: `High DOM update frequency in component '${comp.name}' (${domUpdates} updates)`,
              components: [comp.name],
              stackTrace: getStackTrace(),
              details: {
                componentId: comp.id,
                domUpdates,
                renderTime,
                elementCount: comp.elementCount,
              },
            };

            setPerformanceIssues(prev => [...prev, newIssue]);

            // Trigger callback if provided
            if (onIssueDetected) {
              onIssueDetected(newIssue);
            }
          }

          // Add new data point to the component metrics
          return {
            ...comp,
            renderTime: [...comp.renderTime, renderTime],
            domUpdates: [...comp.domUpdates, domUpdates],
            updateFrequency,
            memoryUsage,
            isVisible: Math.random() > 0.1, // 90% chance of being visible
          };
        });
      });

      // Update component breakdown visualization if visible
      if (componentBreakdownRef.current && activeTab === 'components') {
        updateComponentBreakdownChart();
      }
    }, 1000); // Update every second

    // Store interval reference for cleanup
    windowWithPerformance.componentTrackingInterval = trackingInterval;
  };

  // Update component breakdown chart
  const updateComponentBreakdownChart = () => {
    if (!componentBreakdownRef.current || componentMetrics.length === 0) return;

    // Clear previous chart
    const container = d3.select(componentBreakdownRef.current);
    container.selectAll('*').remove();

    // Create tabs for different visualizations
    const tabContainer = container
      .append('div')
      .attr('class', 'component-tabs')
      .style('margin-bottom', '15px');

    const tabs = ['Render Time', 'DOM Updates', 'Memory Usage', 'Update Frequency'];

    // Add tab buttons
    tabContainer
      .selectAll('.component-tab-button')
      .data(tabs)
      .enter()
      .append('button')
      .attr('class', (_d: string, i: number) => `component-tab-button ${i === 0 ? 'active' : ''}`)
      .text((d: string) => d)
      .style('padding', '8px 12px')
      .style('margin-right', '5px')
      .style('background', (_d: string, i: number) => (i === 0 ? '#4285f4' : '#f1f1f1'))
      .style('color', (_d: string, i: number) => (i === 0 ? 'white' : '#333'))
      .style('border', 'none')
      .style('border-radius', '4px')
      .style('cursor', 'pointer')
      .on('click', function (_event: MouseEvent, d: string) {
        // Update active tab
        tabContainer
          .selectAll('.component-tab-button')
          .style('background', '#f1f1f1')
          .style('color', '#333');

        d3.select(this).style('background', '#4285f4').style('color', 'white');

        // Update chart based on selected tab
        updateComponentVisualization(d);
      });

    // Create container for the visualization
    const chartContainer = container
      .append('div')
      .attr('class', 'component-chart-container')
      .style('height', `${height - 200}px`);

    // Initially show render time visualization
    updateComponentVisualization('Render Time');

    // Nested function to update visualization based on selected tab
    function updateComponentVisualization(tab: string) {
      // Clear chart container
      chartContainer.selectAll('*').remove();

      // Sort components by metric
      const sortedComponents = [...componentMetrics];

      if (tab === 'Render Time') {
        sortedComponents.sort((a, b) => {
          const aAvg = a.renderTime.length
            ? a.renderTime.reduce((sum, time) => sum + time, 0) / a.renderTime.length
            : 0;
          const bAvg = b.renderTime.length
            ? b.renderTime.reduce((sum, time) => sum + time, 0) / b.renderTime.length
            : 0;
          return bAvg - aAvg;
        });

        // Create bar chart for render time
        createBarChart(
          sortedComponents,
          comp =>
            comp.renderTime.length
              ? comp.renderTime.reduce((sum, time) => sum + time, 0) / comp.renderTime.length
              : 0,
          'Average Render Time (ms)',
          comp => {
            const avg = comp.renderTime.length
              ? comp.renderTime.reduce((sum, time) => sum + time, 0) / comp.renderTime.length
              : 0;
            return avg > 16 ? '#EA4335' : avg > 8 ? '#FBBC05' : '#34A853';
          }
        );
      } else if (tab === 'DOM Updates') {
        sortedComponents.sort((a, b) => {
          const aAvg = a.domUpdates.length
            ? a.domUpdates.reduce((sum, updates) => sum + updates, 0) / a.domUpdates.length
            : 0;
          const bAvg = b.domUpdates.length
            ? b.domUpdates.reduce((sum, updates) => sum + updates, 0) / b.domUpdates.length
            : 0;
          return bAvg - aAvg;
        });

        // Create bar chart for DOM updates
        createBarChart(
          sortedComponents,
          comp =>
            comp.domUpdates.length
              ? comp.domUpdates.reduce((sum, updates) => sum + updates, 0) / comp.domUpdates.length
              : 0,
          'Average DOM Updates (per render)',
          comp => {
            const avg = comp.domUpdates.length
              ? comp.domUpdates.reduce((sum, updates) => sum + updates, 0) / comp.domUpdates.length
              : 0;
            return avg > 5 ? '#EA4335' : avg > 3 ? '#FBBC05' : '#34A853';
          }
        );
      } else if (tab === 'Memory Usage') {
        sortedComponents.sort((a, b) => b.memoryUsage - a.memoryUsage);

        // Create bar chart for memory usage
        createBarChart(
          sortedComponents,
          comp => comp.memoryUsage,
          'Memory Usage (MB)',
          comp => (comp.memoryUsage > 5 ? '#EA4335' : comp.memoryUsage > 2 ? '#FBBC05' : '#34A853')
        );
      } else if (tab === 'Update Frequency') {
        sortedComponents.sort((a, b) => b.updateFrequency - a.updateFrequency);

        // Create bar chart for update frequency
        createBarChart(
          sortedComponents,
          comp => comp.updateFrequency,
          'Update Frequency (per second)',
          comp =>
            comp.updateFrequency > 20
              ? '#EA4335'
              : comp.updateFrequency > 10
                ? '#FBBC05'
                : '#34A853'
        );
      }
    }

    // Helper function to create a bar chart
    function createBarChart(
      data: ComponentPerformanceMetrics[],
      valueAccessor: (comp: ComponentPerformanceMetrics) => number,
      yAxisLabel: string,
      colorAccessor: (comp: ComponentPerformanceMetrics) => string
    ) {
      // Set up chart dimensions
      const margin = { top: 20, right: 80, bottom: 50, left: 150 };
      const chartWidth = width - margin.left - margin.right - 40;
      const chartHeight = height - margin.top - margin.bottom - 250;
      const barHeight = Math.max(Math.min(30, chartHeight / data.length - 5), 10);

      // Create SVG
      const svg = chartContainer
        .append('svg')
        .attr('width', chartWidth + margin.left + margin.right)
        .attr(
          'height',
          Math.max(chartHeight, data.length * (barHeight + 5)) + margin.top + margin.bottom
        )
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Set up scales
      const xScale = d3
        .scaleLinear()
        .domain([0, (d3.max(data, valueAccessor) as number) * 1.1])
        .range([0, chartWidth]);

      const yScale = d3
        .scaleBand()
        .domain(data.map(d => d.name))
        .range([0, Math.max(chartHeight, data.length * (barHeight + 5))])
        .padding(0.2);

      // Create axes
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);

      // Add axes
      svg
        .append('g')
        .attr('transform', `translate(0,${Math.max(chartHeight, data.length * (barHeight + 5))})`)
        .call(xAxis)
        .append('text')
        .attr('x', chartWidth / 2)
        .attr('y', 35)
        .attr('fill', '#333')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text(yAxisLabel);

      svg.append('g').call(yAxis);

      // Add bars
      svg
        .selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', (_d, i) => {
          const yPos = yScale(i.toString());
          return yPos !== undefined ? yPos + barHeight / 2 : 0;
        })
        .attr('width', (d: ComponentPerformanceMetrics) => xScale(valueAccessor(d)))
        .attr('height', barHeight)
        .attr('fill', (d: ComponentPerformanceMetrics) => colorAccessor(d))
        .attr('opacity', (d: ComponentPerformanceMetrics) => (d.isVisible ? 1 : 0.5))
        .on('mouseover', function (_event: MouseEvent, d: ComponentPerformanceMetrics) {
          // Show tooltip
          const _tooltip = d3
            .select('body')
            .append('div')
            .attr('class', 'component-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.7)')
            .style('color', 'white')
            .style('padding', '5px')
            .style('border-radius', '3px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .html(
              `
              <div><strong>${d.name}</strong></div>
              <div>${yAxisLabel}: ${valueAccessor(d).toFixed(2)}</div>
              <div>Elements: ${d.elementCount}</div>
              <div>Memory: ${d.memoryUsage.toFixed(2)} MB</div>
            `
            )
            .style('left', `${_event.pageX + 10}px`)
            .style('top', `${_event.pageY - 28}px`);

          // Highlight bar
          d3.select(this).attr('fill', '#4285F4');
        })
        .on('mouseout', function () {
          // Remove tooltip
          d3.select('.component-tooltip').remove();

          // Restore bar color
          d3.select(this).attr('fill', function (_d) {
            return colorAccessor(_d as ComponentPerformanceMetrics);
          });
        });
    }
  };

  // Setup DOM mutation tracking
  const setupDomMutationTracking = () => {
    console.warn('Setting up DOM mutation tracking');

    // Create a mutation observer to track DOM changes
    if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(mutations => {
        if (!isRecording) return;

        mutations.forEach(mutation => {
          // Process the mutation
          const now = performance.now();
          let mutationType: 'added' | 'removed' | 'modified';

          if (mutation.type === 'childList') {
            if (mutation.addedNodes.length > 0) {
              mutationType = 'added';
            } else if (mutation.removedNodes.length > 0) {
              mutationType = 'removed';
            } else {
              // Skip if no nodes were actually added or removed
              return;
            }
          } else if (mutation.type === 'attributes' || mutation.type === 'characterData') {
            mutationType = 'modified';
          } else {
            // Skip unknown mutation types
            return;
          }

          // Create a DOM mutation record
          const newMutation: DomMutationRecord = {
            timestamp: now,
            type: mutationType,
            element: getElementDescription(mutation.target as Element),
            details: {
              mutationType: mutation.type,
              attributeName: mutation.attributeName || undefined,
              oldValue: mutation.oldValue || undefined,
              addedNodes: mutation.addedNodes.length,
              removedNodes: mutation.removedNodes.length,
            },
          };

          // Store the mutation
          setDomMutations(prev => {
            const newMutations = [...prev, newMutation];

            // Keep only the last 1000 mutations
            return newMutations.slice(-1000);
          });

          // Check for potential performance issues
          if (
            mutation.type === 'childList' &&
            (mutation.addedNodes.length > 10 || mutation.removedNodes.length > 10)
          ) {
            // Create a performance issue for large DOM mutation
            const newIssue: PerformanceIssue = {
              timestamp: now,
              type: 'large-dom-mutation',
              severity:
                mutation.addedNodes.length + mutation.removedNodes.length > 50
                  ? 'high'
                  : mutation.addedNodes.length + mutation.removedNodes.length > 20
                    ? 'medium'
                    : 'low',
              description: `Large DOM mutation detected (${mutation.addedNodes.length} nodes added, ${mutation.removedNodes.length} nodes removed)`,
              components: [],
              stackTrace: getStackTrace(),
              details: {
                targetElement: getElementDescription(mutation.target as Element),
                addedNodes: mutation.addedNodes.length,
                removedNodes: mutation.removedNodes.length,
                parentElement: mutation.target.parentElement
                  ? getElementDescription(mutation.target.parentElement)
                  : 'none',
              },
            };

            setPerformanceIssues(prev => [...prev, newIssue]);

            // Trigger callback if provided
            if (onIssueDetected) {
              onIssueDetected(newIssue);
            }
          }
        });

        // Update DOM mutation visualization if visible
        if (domMutationsRef.current && activeTab === 'dom') {
          updateDomMutationChart();
        }
      });

      // Configure the observer to track all mutation types
      observer.observe(document.documentElement, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true,
        attributeOldValue: true,
        characterDataOldValue: true,
      });

      // Store the observer for cleanup
      mutationObserverRef.current = observer;
    }
  };

  // Update DOM mutation chart
  const updateDomMutationChart = () => {
    if (!domMutationsRef.current || domMutations.length === 0) return;

    // Clear previous chart
    const container = d3.select(domMutationsRef.current);
    container.selectAll('*').remove();

    // Create a container for the mutation history
    const mutationHistoryContainer = container
      .append('div')
      .attr('class', 'mutation-history-container')
      .style('height', `${height - 200}px`)
      .style('overflow-y', 'auto')
      .style('font-family', 'monospace');

    // Create a header row
    mutationHistoryContainer
      .append('div')
      .attr('class', 'mutation-header')
      .style('display', 'grid')
      .style('grid-template-columns', '120px 100px 1fr 120px')
      .style('gap', '10px')
      .style('padding', '10px')
      .style('background', '#f0f0f0')
      .style('font-weight', 'bold')
      .style('border-bottom', '1px solid #ddd').html(`
        <div>Time</div>
        <div>Type</div>
        <div>Element</div>
        <div>Details</div>
      `);

    // Get recent mutations (last 100)
    const recentMutations = domMutations.slice(-100).reverse();

    // Create rows for each mutation
    recentMutations.forEach(mutation => {
      const date = new Date(mutation.timestamp);
      const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;

      const row = mutationHistoryContainer
        .append('div')
        .attr('class', `mutation-row ${mutation.type}`)
        .style('display', 'grid')
        .style('grid-template-columns', '120px 100px 1fr 120px')
        .style('gap', '10px')
        .style('padding', '10px')
        .style('border-bottom', '1px solid #ddd')
        .style(
          'background',
          mutation.type === 'added'
            ? 'rgba(52, 168, 83, 0.1)'
            : mutation.type === 'removed'
              ? 'rgba(234, 67, 53, 0.1)'
              : 'rgba(251, 188, 5, 0.1)'
        );

      // Add time
      row.append('div').text(timeString);

      // Add type
      row
        .append('div')
        .text(mutation.type)
        .style(
          'color',
          mutation.type === 'added'
            ? '#34A853'
            : mutation.type === 'removed'
              ? '#EA4335'
              : '#FBBC05'
        );

      // Add element
      row
        .append('div')
        .text(mutation.element)
        .style('white-space', 'nowrap')
        .style('overflow', 'hidden')
        .style('text-overflow', 'ellipsis');

      // Add details button
      row
        .append('div')
        .append('button')
        .text('View Details')
        .style('background', '#f1f1f1')
        .style('border', 'none')
        .style('padding', '3px 8px')
        .style('border-radius', '4px')
        .style('cursor', 'pointer')
        .on('click', function () {
          // Show details in a modal-like overlay
          const detailsOverlay = container
            .append('div')
            .attr('class', 'details-overlay')
            .style('position', 'absolute')
            .style('top', '50%')
            .style('left', '50%')
            .style('transform', 'translate(-50%, -50%)')
            .style('background', 'white')
            .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.15)')
            .style('padding', '20px')
            .style('border-radius', '8px')
            .style('z-index', '1000')
            .style('max-width', '80%')
            .style('max-height', '80%')
            .style('overflow', 'auto');

          // Add title
          detailsOverlay
            .append('h3')
            .text(`Mutation Details: ${mutation.type}`)
            .style('margin-top', '0')
            .style('border-bottom', '1px solid #eee')
            .style('padding-bottom', '10px');

          // Add content
          const detailsContent = detailsOverlay.append('div').style('margin-bottom', '20px');

          // Basic info
          detailsContent.append('p').html(`<strong>Time:</strong> ${timeString}`);

          detailsContent.append('p').html(`<strong>Type:</strong> ${mutation.type}`);

          detailsContent.append('p').html(`<strong>Element:</strong> ${mutation.element}`);

          // Details based on mutation details
          const details = mutation.details as {
            mutationType: string;
            attributeName?: string;
            oldValue?: string;
            addedNodes: number;
            removedNodes: number;
          };

          if (details) {
            detailsContent
              .append('p')
              .html(`<strong>Mutation Type:</strong> ${details.mutationType}`);

            if (details.attributeName) {
              detailsContent
                .append('p')
                .html(`<strong>Attribute:</strong> ${details.attributeName}`);
            }

            if (details.oldValue) {
              detailsContent.append('p').html(`<strong>Old Value:</strong> ${details.oldValue}`);
            }

            if (details.addedNodes > 0) {
              detailsContent
                .append('p')
                .html(`<strong>Added Nodes:</strong> ${details.addedNodes}`);
            }

            if (details.removedNodes > 0) {
              detailsContent
                .append('p')
                .html(`<strong>Removed Nodes:</strong> ${details.removedNodes}`);
            }
          }

          // Add close button
          detailsOverlay
            .append('button')
            .text('Close')
            .style('background', '#4285F4')
            .style('color', 'white')
            .style('border', 'none')
            .style('padding', '8px 16px')
            .style('border-radius', '4px')
            .style('cursor', 'pointer')
            .on('click', function () {
              detailsOverlay.remove();
            });
        });
    });

    // Add summary information
    const summaryContainer = container
      .append('div')
      .attr('class', 'mutation-summary')
      .style('margin-top', '20px')
      .style('display', 'grid')
      .style('grid-template-columns', 'repeat(4, 1fr)')
      .style('gap', '10px');

    // Added nodes count
    const addedCount = domMutations.filter(m => m.type === 'added').length;
    summaryContainer
      .append('div')
      .attr('class', 'summary-card')
      .style('background', 'rgba(52, 168, 83, 0.1)')
      .style('padding', '15px')
      .style('border-radius', '8px')
      .style('text-align', 'center').html(`
        <div style="font-size: 24px; font-weight: bold; color: #34A853">${addedCount}</div>
        <div>Added Elements</div>
      `);

    // Removed nodes count
    const removedCount = domMutations.filter(m => m.type === 'removed').length;
    summaryContainer
      .append('div')
      .attr('class', 'summary-card')
      .style('background', 'rgba(234, 67, 53, 0.1)')
      .style('padding', '15px')
      .style('border-radius', '8px')
      .style('text-align', 'center').html(`
        <div style="font-size: 24px; font-weight: bold; color: #EA4335">${removedCount}</div>
        <div>Removed Elements</div>
      `);

    // Modified nodes count
    const modifiedCount = domMutations.filter(m => m.type === 'modified').length;
    summaryContainer
      .append('div')
      .attr('class', 'summary-card')
      .style('background', 'rgba(251, 188, 5, 0.1)')
      .style('padding', '15px')
      .style('border-radius', '8px')
      .style('text-align', 'center').html(`
        <div style="font-size: 24px; font-weight: bold; color: #FBBC05">${modifiedCount}</div>
        <div>Modified Elements</div>
      `);

    // Total mutations
    summaryContainer
      .append('div')
      .attr('class', 'summary-card')
      .style('background', 'rgba(66, 133, 244, 0.1)')
      .style('padding', '15px')
      .style('border-radius', '8px')
      .style('text-align', 'center').html(`
        <div style="font-size: 24px; font-weight: bold; color: #4285F4">${domMutations.length}</div>
        <div>Total Mutations</div>
      `);
  };

  // Helper function to get a readable description of an element
  const getElementDescription = (element: Element): string => {
    if (!element || !element.tagName) return 'Unknown Element';

    let description = element.tagName.toLowerCase();

    if (element.id) {
      description += `#${element.id}`;
    }

    if (element.className && typeof element.className === 'string') {
      description += `.${element.className.split(' ').join('.')}`;
    }

    return description;
  };

  // Setup stack trace collection
  const setupStackTraceCollection = () => {
    console.warn('Setting up stack trace collection');

    // No direct setup needed - stack traces are collected when performance issues are detected

    // Set up a periodic check for memory leaks
    const memoryLeakInterval = setInterval(() => {
      if (!isRecording) {
        clearInterval(memoryLeakInterval);
        return;
      }

      // Check for memory growth if the memory API is available
      const windowWithPerformance = window as WindowWithPerformance;
      if (windowWithPerformance.performance.memory) {
        const _jsHeapSize = windowWithPerformance.performance.memory.usedJSHeapSize / (1024 * 1024); // Convert to MB

        // If we have enough data points, check for consistent memory growth
        if (renderingPerformanceData.length > 10) {
          const recentMemoryData = renderingPerformanceData
            .slice(-10)
            .map(d => d.jsHeapSize)
            .filter((size): size is number => size !== undefined);

          if (recentMemoryData.length > 5) {
            // Check if memory has been consistently growing
            let consistentGrowth = true;
            for (let i = 1; i < recentMemoryData.length; i++) {
              if (recentMemoryData[i] <= recentMemoryData[i - 1]) {
                consistentGrowth = false;
                break;
              }
            }

            // Calculate growth rate
            const growthRate =
              (recentMemoryData[recentMemoryData.length - 1] - recentMemoryData[0]) /
              recentMemoryData[0];

            // If memory is consistently growing at a significant rate, create a performance issue
            if (consistentGrowth && growthRate > 0.1) {
              const now = performance.now();

              // Create a performance issue for memory leak
              const newIssue: PerformanceIssue = {
                timestamp: now,
                type: 'memory-leak',
                severity: growthRate > 0.5 ? 'critical' : growthRate > 0.25 ? 'high' : 'medium',
                description: `Potential memory leak detected: ${(growthRate * 100).toFixed(1)}% growth over ${recentMemoryData.length} samples`,
                components: [],
                stackTrace: getStackTrace(),
                details: {
                  initialMemory: recentMemoryData[0],
                  currentMemory: recentMemoryData[recentMemoryData.length - 1],
                  growthRate: growthRate,
                  growthRatePercent: growthRate * 100,
                  samples: recentMemoryData.length,
                },
              };

              setPerformanceIssues(prev => [...prev, newIssue]);

              // Trigger callback if provided
              if (onIssueDetected) {
                onIssueDetected(newIssue);
              }
            }
          }
        }
      }
    }, 5000); // Check every 5 seconds

    // Store interval ID in window for cleanup
    const windowWithPerformance = window as WindowWithPerformance;
    if (typeof window !== 'undefined') {
      windowWithPerformance.memoryLeakInterval = memoryLeakInterval;
    }

    // Update issues list if visible
    if (issuesListRef.current && activeTab === 'issues') {
      updateIssuesList();
    }
  };

  // Update the issues list display
  const updateIssuesList = () => {
    if (!issuesListRef.current || performanceIssues.length === 0) return;

    // Clear previous content
    const container = d3.select(issuesListRef.current);
    container.selectAll('*').remove();

    // Create a container for the issues list
    const issuesContainer = container
      .append('div')
      .attr('class', 'issues-container')
      .style('height', `${height - 200}px`)
      .style('overflow-y', 'auto')
      .style('font-family', 'system-ui, -apple-system, sans-serif');

    // Create a header row
    issuesContainer
      .append('div')
      .attr('class', 'issues-header')
      .style('display', 'grid')
      .style('grid-template-columns', '120px 100px 1fr 120px')
      .style('gap', '10px')
      .style('padding', '10px')
      .style('background', '#f0f0f0')
      .style('font-weight', 'bold')
      .style('border-bottom', '1px solid #ddd').html(`
        <div>Time</div>
        <div>Severity</div>
        <div>Description</div>
        <div>Actions</div>
      `);

    // Group issues by type
    const issuesByType: Record<string, PerformanceIssue[]> = {};
    performanceIssues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });

    // Process each type of issue
    Object.entries(issuesByType).forEach(([type, issues]) => {
      // Add a group header for the issue type
      issuesContainer
        .append('div')
        .attr('class', 'issue-type-header')
        .style('padding', '12px 10px')
        .style('background', '#e9e9e9')
        .style('font-weight', 'bold')
        .style('border-bottom', '1px solid #ddd')
        .style('position', 'sticky')
        .style('top', '0')
        .style('z-index', '1').html(`
          <div>${formatIssueType(type)} (${issues.length})</div>
        `);

      // Sort issues by severity and recency
      const sortedIssues = [...issues].sort((a, b) => {
        // First by severity
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const severityDiff =
          severityOrder[a.severity as keyof typeof severityOrder] -
          severityOrder[b.severity as keyof typeof severityOrder];

        if (severityDiff !== 0) return severityDiff;

        // Then by timestamp (most recent first)
        return b.timestamp - a.timestamp;
      });

      // Create rows for each issue
      sortedIssues.forEach(issue => {
        const date = new Date(issue.timestamp);
        const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

        const row = issuesContainer
          .append('div')
          .attr('class', `issue-row ${issue.severity}`)
          .style('display', 'grid')
          .style('grid-template-columns', '120px 100px 1fr 120px')
          .style('gap', '10px')
          .style('padding', '10px')
          .style('border-bottom', '1px solid #ddd')
          .style(
            'background',
            issue.severity === 'critical'
              ? 'rgba(234, 67, 53, 0.1)'
              : issue.severity === 'high'
                ? 'rgba(251, 188, 5, 0.1)'
                : issue.severity === 'medium'
                  ? 'rgba(66, 133, 244, 0.1)'
                  : 'rgba(52, 168, 83, 0.1)'
          );

        // Add time
        row.append('div').text(timeString);

        // Add severity
        row
          .append('div')
          .text(issue.severity)
          .style(
            'color',
            issue.severity === 'critical'
              ? '#EA4335'
              : issue.severity === 'high'
                ? '#FBBC05'
                : issue.severity === 'medium'
                  ? '#4285F4'
                  : '#34A853'
          )
          .style('font-weight', 'bold');

        // Add description
        row
          .append('div')
          .text(issue.description)
          .style('white-space', 'nowrap')
          .style('overflow', 'hidden')
          .style('text-overflow', 'ellipsis');

        // Add details button
        row
          .append('div')
          .append('button')
          .text('View Details')
          .style('background', '#f1f1f1')
          .style('border', 'none')
          .style('padding', '3px 8px')
          .style('border-radius', '4px')
          .style('cursor', 'pointer')
          .on('click', function () {
            // Show details in a modal-like overlay
            const detailsOverlay = container
              .append('div')
              .attr('class', 'details-overlay')
              .style('position', 'absolute')
              .style('top', '50%')
              .style('left', '50%')
              .style('transform', 'translate(-50%, -50%)')
              .style('background', 'white')
              .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.15)')
              .style('padding', '20px')
              .style('border-radius', '8px')
              .style('z-index', '1000')
              .style('max-width', '80%')
              .style('max-height', '80%')
              .style('overflow', 'auto');

            // Add title
            detailsOverlay
              .append('h3')
              .text(`Issue Details: ${formatIssueType(type)}`)
              .style('margin-top', '0')
              .style('border-bottom', '1px solid #eee')
              .style('padding-bottom', '10px');

            // Add content
            const detailsContent = detailsOverlay.append('div').style('margin-bottom', '20px');

            // Basic info
            detailsContent.append('p').html(`<strong>Time:</strong> ${timeString}`);

            detailsContent
              .append('p')
              .html(
                `<strong>Severity:</strong> <span style="color: ${
                  issue.severity === 'critical'
                    ? '#EA4335'
                    : issue.severity === 'high'
                      ? '#FBBC05'
                      : issue.severity === 'medium'
                        ? '#4285F4'
                        : '#34A853'
                }; font-weight: bold;">${issue.severity}</span>`
              );

            detailsContent.append('p').html(`<strong>Description:</strong> ${issue.description}`);

            // Add affected components if available
            if (issue.components && issue.components.length > 0) {
              detailsContent
                .append('p')
                .html(`<strong>Affected Components:</strong> ${issue.components.join(', ')}`);
            }

            // Add issue details
            detailsContent
              .append('h4')
              .text('Details')
              .style('margin-top', '15px')
              .style('margin-bottom', '10px');

            // Format details as a list
            const detailsList = detailsContent
              .append('ul')
              .style('margin-top', '10px')
              .style('padding-left', '20px');

            Object.entries(issue.details).forEach(([key, value]) => {
              detailsList
                .append('li')
                .html(`<strong>${formatPropertyName(key)}:</strong> ${formatPropertyValue(value)}`);
            });

            // Add stack trace
            detailsContent
              .append('h4')
              .text('Stack Trace')
              .style('margin-top', '15px')
              .style('margin-bottom', '10px');

            // Format stack trace
            const stackTraceContainer = detailsContent
              .append('div')
              .style('background', '#f5f5f5')
              .style('padding', '10px')
              .style('border-radius', '4px')
              .style('font-family', 'monospace')
              .style('white-space', 'pre-wrap')
              .style('font-size', '12px')
              .style('max-height', '200px')
              .style('overflow-y', 'auto');

            stackTraceContainer.text(issue.stackTrace);

            // Add close button
            detailsOverlay
              .append('button')
              .text('Close')
              .style('background', '#4285F4')
              .style('color', 'white')
              .style('border', 'none')
              .style('padding', '8px 16px')
              .style('border-radius', '4px')
              .style('cursor', 'pointer')
              .on('click', function () {
                detailsOverlay.remove();
              });
          });
      });
    });

    // Add summary information
    const summaryContainer = container
      .append('div')
      .attr('class', 'issues-summary')
      .style('margin-top', '20px')
      .style('display', 'grid')
      .style('grid-template-columns', 'repeat(4, 1fr)')
      .style('gap', '10px');

    // Critical issues count
    const criticalCount = performanceIssues.filter(issue => issue.severity === 'critical').length;
    summaryContainer
      .append('div')
      .attr('class', 'summary-card')
      .style('background', 'rgba(234, 67, 53, 0.1)')
      .style('padding', '15px')
      .style('border-radius', '8px')
      .style('text-align', 'center').html(`
        <div style="font-size: 24px; font-weight: bold; color: #EA4335">${criticalCount}</div>
        <div>Critical Issues</div>
      `);

    // High severity issues count
    const highCount = performanceIssues.filter(issue => issue.severity === 'high').length;
    summaryContainer
      .append('div')
      .attr('class', 'summary-card')
      .style('background', 'rgba(251, 188, 5, 0.1)')
      .style('padding', '15px')
      .style('border-radius', '8px')
      .style('text-align', 'center').html(`
        <div style="font-size: 24px; font-weight: bold; color: #FBBC05">${highCount}</div>
        <div>High Severity Issues</div>
      `);

    // Medium severity issues count
    const mediumCount = performanceIssues.filter(issue => issue.severity === 'medium').length;
    summaryContainer
      .append('div')
      .attr('class', 'summary-card')
      .style('background', 'rgba(66, 133, 244, 0.1)')
      .style('padding', '15px')
      .style('border-radius', '8px')
      .style('text-align', 'center').html(`
        <div style="font-size: 24px; font-weight: bold; color: #4285F4">${mediumCount}</div>
        <div>Medium Severity Issues</div>
      `);

    // Total issues count
    summaryContainer
      .append('div')
      .attr('class', 'summary-card')
      .style('background', 'rgba(52, 168, 83, 0.1)')
      .style('padding', '15px')
      .style('border-radius', '8px')
      .style('text-align', 'center').html(`
        <div style="font-size: 24px; font-weight: bold; color: #34A853">${performanceIssues.length}</div>
        <div>Total Issues</div>
      `);
  };

  // Helper function to format issue type
  const formatIssueType = (type: string): string => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to format property name
  const formatPropertyName = (name: string): string => {
    return name
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to format property value
  const formatPropertyValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return 'None';
    } else if (typeof value === 'number') {
      return value % 1 === 0 ? value.toString() : value.toFixed(2);
    } else if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    } else {
      return String(value);
    }
  };

  // Handle tab change
  const _handleTabChange = (tab: 'rendering' | 'components' | 'dom' | 'issues') => {
    setActiveTab(tab);
  };

  // Start recording performance data
  const _startRecording = () => {
    setIsRecording(true);

    // TODO: Implement recording start logic
  };

  // Stop recording performance data
  const _stopRecording = () => {
    setIsRecording(false);

    // TODO: Implement recording stop logic
  };

  // Get JS heap size if available
  const _getJsHeapSize = (): number | undefined => {
    const windowWithPerformance = window as WindowWithPerformance;
    if (typeof performance !== 'undefined' && windowWithPerformance.performance.memory) {
      return windowWithPerformance.performance.memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return undefined;
  };

  // Return the component UI
  return (
    <div className="visualization-inspector" style={{ width, height }}>
      {active ? (
        <div className="inspector-content">
          <h3>Visualization Inspector</h3>
          <p>Monitoring visualization performance...</p>
          {/* Inspector UI would go here */}
        </div>
      ) : null}
    </div>
  );
};

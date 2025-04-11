import * as d3 from 'd3';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

// Import optimization utilities
import {
  animationFrameManager,
  FrameInfo,
} from '../../../utils/performance/D3AnimationFrameManager';

// Type definitions
interface PerformanceMonitoringDashboardProps {
  width?: number;
  height?: number;
}

interface MetricPoint {
  timestamp: number;
  value: number;
}

interface PerformanceMetrics {
  fps: MetricPoint[];
  cpuTime: MetricPoint[];
  memoryUsage: MetricPoint[];
  domOperations: MetricPoint[];
  renderTime: MetricPoint[];
  layoutThrashing: MetricPoint[];
  cacheHitRate: MetricPoint[];
  animationSmoothness: MetricPoint[];
}

interface PerformanceIssue {
  id: string;
  timestamp: number;
  type: 'frame_drop' | 'layout_thrashing' | 'high_cpu' | 'memory_leak' | 'jank';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  relatedMetrics: string[];
}

/**
 * PerformanceMonitoringDashboard
 *
 * A comprehensive dashboard for monitoring and visualizing performance metrics
 * of D3 visualizations. It provides real-time insights into performance characteristics
 * and helps identify optimization opportunities.
 *
 * Features:
 * - Real-time performance metrics
 * - Historical data visualization
 * - Issue detection and recommendations
 * - Comparative performance analysis
 * - Integration with all optimization systems
 */
const PerformanceMonitoringDashboard: React.FC<PerformanceMonitoringDashboardProps> = ({
  width = 1200,
  height = 900,
}) => {
  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const fpsChartRef = useRef<SVGSVGElement>(null);
  const cpuChartRef = useRef<SVGSVGElement>(null);
  const memoryChartRef = useRef<SVGSVGElement>(null);
  const timelineChartRef = useRef<SVGSVGElement>(null);

  // State
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoredAnimation, setMonitoredAnimation] = useState<string>('');
  const [timeWindow, setTimeWindow] = useState<number>(60000); // 1 minute in ms
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: [],
    cpuTime: [],
    memoryUsage: [],
    domOperations: [],
    renderTime: [],
    layoutThrashing: [],
    cacheHitRate: [],
    animationSmoothness: [],
  });
  const [detectedIssues, setDetectedIssues] = useState<PerformanceIssue[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<keyof PerformanceMetrics>('fps');
  const [activeAnimations, setActiveAnimations] = useState<string[]>([]);
  const [frameBudget, setFrameBudget] = useState<number>(16.67); // 60fps by default

  // Initialize monitoring
  useEffect(() => {
    // Get the list of active animations from the animation frame manager
    updateActiveAnimations();

    // Set up periodic polling for active animations
    const animationPoller = setInterval(() => {
      updateActiveAnimations();
    }, 5000);

    return () => {
      clearInterval(animationPoller);
      stopMonitoring();
    };
  }, []);

  // Set up performance monitoring when an animation is selected
  useEffect(() => {
    if (isMonitoring && monitoredAnimation) {
      startMonitoring(monitoredAnimation);
    } else {
      stopMonitoring();
    }
  }, [isMonitoring, monitoredAnimation]);

  // Update charts when metrics or selected metric changes
  useEffect(() => {
    if (performanceMetrics[selectedMetric].length > 0) {
      updateCharts();
    }
  }, [performanceMetrics, selectedMetric]);

  // Get the list of active animations
  const updateActiveAnimations = () => {
    // In a real implementation, we would get this from the animation frame manager
    // For now, we'll create a mock list
    setActiveAnimations([
      'network-visualization',
      'time-series-chart',
      'hierarchy-visualization',
      'geo-visualization',
      'unified-demo',
      'batch-update-demo',
    ]);
  };

  // Start monitoring a specific animation
  const startMonitoring = (animationId: string) => {
    if (!animationId) return;

    console.warn(`Starting monitoring for animation: ${animationId}`);

    // Reset metrics
    setPerformanceMetrics({
      fps: [],
      cpuTime: [],
      memoryUsage: [],
      domOperations: [],
      renderTime: [],
      layoutThrashing: [],
      cacheHitRate: [],
      animationSmoothness: [],
    });

    setDetectedIssues([]);

    // Register a special monitor animation that will collect performance data
    animationFrameManager.registerAnimation(
      {
        id: 'performance-monitor',
        name: 'Performance Monitor',
        priority: 'low', // Low priority to avoid affecting the monitored animation
        type: 'custom',
        duration: 0, // Run indefinitely
        loop: true,
      },
      (_elapsed, deltaTime, frameInfo) => {
        collectPerformanceMetrics(deltaTime, frameInfo);
        return false; // Never complete
      }
    );

    // Start the monitoring animation
    animationFrameManager.startAnimation('performance-monitor');
  };

  // Stop monitoring
  const stopMonitoring = () => {
    // Stop the monitoring animation
    try {
      animationFrameManager.pauseAnimation('performance-monitor');
    } catch (e) {
      // Animation might not exist yet
    }
  };

  // Collect performance metrics on each frame
  const collectPerformanceMetrics = (deltaTime: number, frameInfo: FrameInfo) => {
    const now = Date.now();

    // Update FPS metric
    setPerformanceMetrics(prev => {
      const newFps = [...prev.fps, { timestamp: now, value: frameInfo.currentFps }];

      // Simulate other metrics for now
      // In a real implementation, we would get these from the various systems
      const newCpuTime = [
        ...prev.cpuTime,
        {
          timestamp: now,
          value: 10 + Math.random() * 10, // Random value between 10-20ms
        },
      ];

      const newMemoryUsage = [
        ...prev.memoryUsage,
        {
          timestamp: now,
          value: 50 + Math.sin(now * 0.001) * 10, // Oscillating value to simulate GC
        },
      ];

      const newDomOperations = [
        ...prev.domOperations,
        {
          timestamp: now,
          value: Math.floor(Math.random() * 50), // Random number of DOM operations
        },
      ];

      const newRenderTime = [
        ...prev.renderTime,
        {
          timestamp: now,
          value: 5 + Math.random() * 10, // Random render time between 5-15ms
        },
      ];

      const newLayoutThrashing = [
        ...prev.layoutThrashing,
        {
          timestamp: now,
          value: Math.random() > 0.9 ? Math.floor(Math.random() * 5) : 0, // Occasional layout thrashing
        },
      ];

      const newCacheHitRate = [
        ...prev.cacheHitRate,
        {
          timestamp: now,
          value: 70 + Math.random() * 30, // Cache hit rate between 70-100%
        },
      ];

      const newAnimationSmoothness = [
        ...prev.animationSmoothness,
        {
          timestamp: now,
          value: frameInfo.currentFps > 30 ? 100 : (frameInfo.currentFps / 30) * 100, // Smoothness score
        },
      ];

      // Limit the number of data points based on time window
      const cutoff = now - timeWindow;
      const trimMetrics = (metrics: MetricPoint[]) =>
        metrics.filter(point => point.timestamp >= cutoff);

      // Detect potential performance issues
      detectPerformanceIssues(
        newFps[newFps.length - 1],
        newCpuTime[newCpuTime.length - 1],
        newLayoutThrashing[newLayoutThrashing.length - 1]
      );

      return {
        fps: trimMetrics(newFps),
        cpuTime: trimMetrics(newCpuTime),
        memoryUsage: trimMetrics(newMemoryUsage),
        domOperations: trimMetrics(newDomOperations),
        renderTime: trimMetrics(newRenderTime),
        layoutThrashing: trimMetrics(newLayoutThrashing),
        cacheHitRate: trimMetrics(newCacheHitRate),
        animationSmoothness: trimMetrics(newAnimationSmoothness),
      };
    });
  };

  // Detect performance issues based on metrics
  const detectPerformanceIssues = (
    fpsPoint: MetricPoint,
    cpuPoint: MetricPoint,
    layoutPoint: MetricPoint
  ) => {
    const now = Date.now();

    // Check for frame drop
    if (fpsPoint.value < 30) {
      const severity =
        fpsPoint.value < 10
          ? 'critical'
          : fpsPoint.value < 20
            ? 'high'
            : fpsPoint.value < 25
              ? 'medium'
              : 'low';

      const newIssue: PerformanceIssue = {
        id: `frame-drop-${now}`,
        timestamp: now,
        type: 'frame_drop',
        severity,
        description: `Low frame rate detected: ${Math.round(fpsPoint.value)} FPS`,
        recommendation: 'Consider reducing animation complexity or enabling optimizations',
        relatedMetrics: ['fps', 'cpuTime', 'renderTime'],
      };

      setDetectedIssues(prev => {
        // Don't add too munknownnown similar issues
        const recentSimilarIssue = prev.find(
          issue => issue.type === newIssue.type && now - issue.timestamp < 5000
        );

        if (recentSimilarIssue) {
          return prev;
        }

        return [...prev.slice(-19), newIssue]; // Keep most recent 20 issues
      });
    }

    // Check for high CPU usage
    if (cpuPoint.value > frameBudget) {
      const overtime = cpuPoint.value - frameBudget;
      const severity =
        overtime > 10 ? 'critical' : overtime > 5 ? 'high' : overtime > 2 ? 'medium' : 'low';

      const newIssue: PerformanceIssue = {
        id: `high-cpu-${now}`,
        timestamp: now,
        type: 'high_cpu',
        severity,
        description: `High CPU time detected: ${Math.round(cpuPoint.value)}ms (budget: ${frameBudget}ms)`,
        recommendation: 'Consider using memoization or reducing calculation complexity',
        relatedMetrics: ['cpuTime', 'fps'],
      };

      setDetectedIssues(prev => {
        // Don't add too munknownnown similar issues
        const recentSimilarIssue = prev.find(
          issue => issue.type === newIssue.type && now - issue.timestamp < 5000
        );

        if (recentSimilarIssue) {
          return prev;
        }

        return [...prev.slice(-19), newIssue]; // Keep most recent 20 issues
      });
    }

    // Check for layout thrashing
    if (layoutPoint.value > 0) {
      const severity =
        layoutPoint.value > 3
          ? 'critical'
          : layoutPoint.value > 2
            ? 'high'
            : layoutPoint.value > 1
              ? 'medium'
              : 'low';

      const newIssue: PerformanceIssue = {
        id: `layout-thrashing-${now}`,
        timestamp: now,
        type: 'layout_thrashing',
        severity,
        description: `Layout thrashing detected: ${layoutPoint.value} reflows in a single frame`,
        recommendation: 'Use batched updates to separate read and write operations',
        relatedMetrics: ['layoutThrashing', 'renderTime', 'fps'],
      };

      setDetectedIssues(prev => {
        // Don't add too munknownnown similar issues
        const recentSimilarIssue = prev.find(
          issue => issue.type === newIssue.type && now - issue.timestamp < 5000
        );

        if (recentSimilarIssue) {
          return prev;
        }

        return [...prev.slice(-19), newIssue]; // Keep most recent 20 issues
      });
    }
  };

  // Update the charts based on current metrics
  const updateCharts = () => {
    // These will be implemented with actual D3 visualizations
    updateFpsChart();
    updateCpuChart();
    updateMemoryChart();
    updateTimelineChart();
  };

  // Update the FPS chart
  const updateFpsChart = () => {
    if (!fpsChartRef.current) return;

    const svg = d3.select(fpsChartRef.current);
    const data = performanceMetrics.fps;
    if (data?.length === 0) return;

    // Clear previous chart
    svg.selectAll('*').remove();

    // Determine dimensions
    const margin = { top: 10, right: 20, bottom: 30, left: 40 };
    const chartWidth = svg.node()?.getBoundingClientRect().width ?? 300;
    const chartHeight = svg.node()?.getBoundingClientRect().height ?? 200;
    const width = chartWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    // Create chart group
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Determine time domain
    const now = Date.now();
    const xDomain = [now - timeWindow, now];

    // Create scales
    const x = d3.scaleTime().domain(xDomain).range([0, width]);

    // Set y-domain based on FPS (0 to max, or at least 60)
    const maxFps = Math.max(60, d3.max(data, d => d.value) ?? 60);
    const y = d3
      .scaleLinear()
      .domain([0, maxFps * 1.1])
      .range([height, 0]);

    // Create line generator
    const line = d3
      .line<MetricPoint>()
      .x(d => x(d.timestamp))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Add reference line for target FPS (60)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(60))
      .attr('y2', y(60))
      .attr('stroke', '#aaa')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1);

    g.append('text')
      .attr('x', width)
      .attr('y', y(60) - 5)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', '#aaa')
      .text('60 FPS');

    // Add reference line for acceptable FPS (30)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(30))
      .attr('y2', y(30))
      .attr('stroke', '#ffa000')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1);

    g.append('text')
      .attr('x', width)
      .attr('y', y(30) - 5)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', '#ffa000')
      .text('30 FPS');

    // Add problem area (< 30 FPS)
    g.append('rect')
      .attr('x', 0)
      .attr('y', y(0))
      .attr('width', width)
      .attr('height', y(30) - y(0))
      .attr('fill', 'rgba(244, 67, 54, 0.1)');

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat(d => {
            const date = new Date(d as number);
            return date.getSeconds().toString();
          })
      )
      .call(g => g.select('.domain').remove());

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove());

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => '')
      );

    // Add the line path
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#2196F3')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add points for the most recent data
    const recentData = data?.slice(-5); // Last 5 points

    g.selectAll('.data-point')
      .data(recentData)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => x(d.timestamp))
      .attr('cy', d => y(d.value))
      .attr('r', (d, i) => (i === recentData.length - 1 ? 4 : 2)) // Larger circle for most recent point
      .attr('fill', d => {
        if (d.value < 30) return '#f44336'; // Red
        if (d.value < 60) return '#ffa000'; // Orange
        return '#4CAF50'; // Green
      });

    // Add line for current FPS value
    if (data?.length > 0) {
      const lastPoint = data[data?.length - 1];

      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y(lastPoint.value))
        .attr('y2', y(lastPoint.value))
        .attr('stroke', '#2196F3')
        .attr('stroke-dasharray', '2,2')
        .attr('stroke-width', 1);
    }
  };

  // Update the CPU usage chart
  const updateCpuChart = () => {
    if (!cpuChartRef.current) return;

    const svg = d3.select(cpuChartRef.current);
    const data = performanceMetrics.cpuTime;
    if (data?.length === 0) return;

    // Clear previous chart
    svg.selectAll('*').remove();

    // Determine dimensions
    const margin = { top: 10, right: 20, bottom: 30, left: 40 };
    const chartWidth = svg.node()?.getBoundingClientRect().width ?? 300;
    const chartHeight = svg.node()?.getBoundingClientRect().height ?? 200;
    const width = chartWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    // Create chart group
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Determine time domain
    const now = Date.now();
    const xDomain = [now - timeWindow, now];

    // Create scales
    const x = d3.scaleTime().domain(xDomain).range([0, width]);

    // Set y-domain based on data (0 to max, or at least frameBudget*2)
    const maxCpuTime = Math.max(frameBudget * 2, d3.max(data, d => d.value) ?? frameBudget * 2);
    const y = d3
      .scaleLinear()
      .domain([0, maxCpuTime * 1.1])
      .range([height, 0]);

    // Create line generator
    const line = d3
      .line<MetricPoint>()
      .x(d => x(d.timestamp))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Add budget reference line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(frameBudget))
      .attr('y2', y(frameBudget))
      .attr('stroke', '#ff9800')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1);

    g.append('text')
      .attr('x', width)
      .attr('y', y(frameBudget) - 5)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', '#ff9800')
      .text(`${frameBudget.toFixed(1)}ms`);

    // Add problem area (> frameBudget)
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', y(frameBudget))
      .attr('fill', 'rgba(244, 67, 54, 0.1)');

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat(d => {
            const date = new Date(d as number);
            return date.getSeconds().toString();
          })
      )
      .call(g => g.select('.domain').remove());

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove());

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => '')
      );

    // Add the line path
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#ff5722')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add points for the most recent data
    const recentData = data?.slice(-5); // Last 5 points

    g.selectAll('.data-point')
      .data(recentData)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => x(d.timestamp))
      .attr('cy', d => y(d.value))
      .attr('r', (d, i) => (i === recentData.length - 1 ? 4 : 2)) // Larger circle for most recent point
      .attr('fill', d => {
        if (d.value > frameBudget * 1.5) return '#f44336'; // Red
        if (d.value > frameBudget) return '#ffa000'; // Orange
        return '#4CAF50'; // Green
      });

    // Add line for current CPU value
    if (data?.length > 0) {
      const lastPoint = data[data?.length - 1];

      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y(lastPoint.value))
        .attr('y2', y(lastPoint.value))
        .attr('stroke', '#ff5722')
        .attr('stroke-dasharray', '2,2')
        .attr('stroke-width', 1);
    }
  };

  // Update the memory usage chart
  const updateMemoryChart = () => {
    if (!memoryChartRef.current) return;

    const svg = d3.select(memoryChartRef.current);
    const data = performanceMetrics.memoryUsage;
    if (data?.length === 0) return;

    // Clear previous chart
    svg.selectAll('*').remove();

    // Determine dimensions
    const margin = { top: 10, right: 20, bottom: 30, left: 40 };
    const chartWidth = svg.node()?.getBoundingClientRect().width ?? 300;
    const chartHeight = svg.node()?.getBoundingClientRect().height ?? 200;
    const width = chartWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    // Create chart group
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Determine time domain
    const now = Date.now();
    const xDomain = [now - timeWindow, now];

    // Create scales
    const x = d3.scaleTime().domain(xDomain).range([0, width]);

    // Find min and max values for better visualization
    const maxMemory = d3.max(data, d => d.value) ?? 100;
    const minMemory = d3.min(data, d => d.value) ?? 0;
    const padding = (maxMemory - minMemory) * 0.1; // 10% padding

    // Use a more precise domain for better visualization
    const y = d3
      .scaleLinear()
      .domain([Math.max(0, minMemory - padding), maxMemory + padding])
      .range([height, 0]);

    // Create line generator
    const line = d3
      .line<MetricPoint>()
      .x(d => x(d.timestamp))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Create area generator for filled area under the line
    const area = d3
      .area<MetricPoint>()
      .x(d => x(d.timestamp))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat(d => {
            const date = new Date(d as number);
            return date.getSeconds().toString();
          })
      )
      .call(g => g.select('.domain').remove());

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove());

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => '')
      );

    // Add the area
    g.append('path').datum(data).attr('fill', 'rgba(76, 175, 80, 0.2)').attr('d', area);

    // Add the line path
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#4CAF50')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add points for the most recent data
    const recentData = data?.slice(-5); // Last 5 points

    g.selectAll('.data-point')
      .data(recentData)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => x(d.timestamp))
      .attr('cy', d => y(d.value))
      .attr('r', (d, i) => (i === recentData.length - 1 ? 4 : 2)) // Larger circle for most recent point
      .attr('fill', '#4CAF50');

    // Add line for current memory value
    if (data?.length > 0) {
      const lastPoint = data[data?.length - 1];

      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y(lastPoint.value))
        .attr('y2', y(lastPoint.value))
        .attr('stroke', '#4CAF50')
        .attr('stroke-dasharray', '2,2')
        .attr('stroke-width', 1);
    }
  };

  // Update the timeline chart
  const updateTimelineChart = () => {
    if (!timelineChartRef.current) return;

    const svg = d3.select(timelineChartRef.current);

    // Clear previous chart
    svg.selectAll('*').remove();

    // Get data for the selected metric
    const data = performanceMetrics[selectedMetric];
    if (data?.length === 0) return;

    // Determine dimensions
    const margin = { top: 10, right: 20, bottom: 30, left: 40 };
    const chartWidth = svg.node()?.getBoundingClientRect().width ?? 600;
    const chartHeight = svg.node()?.getBoundingClientRect().height ?? 100;
    const width = chartWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    // Create chart group
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Determine time domain
    const now = Date.now();
    const xDomain = [now - timeWindow, now];

    // Create scales
    const x = d3.scaleTime().domain(xDomain).range([0, width]);

    // Set y-domain based on the selected metric
    let yDomain: [number, number];
    let colorScale: d3.ScaleOrdinal<string, string>;

    // Configure scales and thresholds based on metric type
    let maxValue: number;
    let minValue: number;
    let padding: number;

    switch (selectedMetric) {
      case 'fps':
        yDomain = [0, Math.max(60, d3.max(data, d => d.value) ?? 60) * 1.1];
        colorScale = d3
          .scaleOrdinal<string>()
          .domain(['low', 'medium', 'high'])
          .range(['#f44336', '#ffa000', '#4CAF50']);
        break;

      case 'cpuTime':
        yDomain = [
          0,
          Math.max(frameBudget * 2, d3.max(data, d => d.value) ?? frameBudget * 2) * 1.1,
        ];
        colorScale = d3
          .scaleOrdinal<string>()
          .domain(['low', 'medium', 'high'])
          .range(['#4CAF50', '#ffa000', '#f44336']);
        break;

      case 'layoutThrashing':
        yDomain = [0, Math.max(5, d3.max(data, d => d.value) ?? 5) * 1.1];
        colorScale = d3
          .scaleOrdinal<string>()
          .domain(['low', 'medium', 'high'])
          .range(['#4CAF50', '#ffa000', '#f44336']);
        break;

      case 'cacheHitRate':
        yDomain = [0, 100];
        colorScale = d3
          .scaleOrdinal<string>()
          .domain(['low', 'medium', 'high'])
          .range(['#f44336', '#ffa000', '#4CAF50']);
        break;

      case 'animationSmoothness':
        yDomain = [0, 100];
        colorScale = d3
          .scaleOrdinal<string>()
          .domain(['low', 'medium', 'high'])
          .range(['#f44336', '#ffa000', '#4CAF50']);
        break;

      default:
        // For other metrics, use the min/max of data with padding
        maxValue = d3.max(data, d => d.value) ?? 100;
        minValue = d3.min(data, d => d.value) ?? 0;
        padding = (maxValue - minValue) * 0.1;
        yDomain = [Math.max(0, minValue - padding), maxValue + padding];
        colorScale = d3
          .scaleOrdinal<string>()
          .domain(['low', 'medium', 'high'])
          .range(['#f44336', '#ffa000', '#4CAF50']);
    }

    const y = d3.scaleLinear().domain(yDomain).range([height, 0]);

    // Create line generator
    const line = d3
      .line<MetricPoint>()
      .x(d => x(d.timestamp))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Create area generator for filled area under the line
    const area = d3
      .area<MetricPoint>()
      .x(d => x(d.timestamp))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Add reference lines based on metric type
    if (selectedMetric === 'fps') {
      // FPS reference lines
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y(60))
        .attr('y2', y(60))
        .attr('stroke', '#aaa')
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', 5)
        .attr('y', y(60) - 5)
        .attr('font-size', '10px')
        .attr('fill', '#aaa')
        .text('60 FPS');

      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y(30))
        .attr('y2', y(30))
        .attr('stroke', '#ffa000')
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', 5)
        .attr('y', y(30) - 5)
        .attr('font-size', '10px')
        .attr('fill', '#ffa000')
        .text('30 FPS');
    } else if (selectedMetric === 'cpuTime') {
      // CPU time reference line
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y(frameBudget))
        .attr('y2', y(frameBudget))
        .attr('stroke', '#ff9800')
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', 5)
        .attr('y', y(frameBudget) - 5)
        .attr('font-size', '10px')
        .attr('fill', '#ff9800')
        .text(`${frameBudget.toFixed(1)}ms`);
    }

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(10)
          .tickFormat(d => {
            const date = new Date(d as number);
            return `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, '0')}`;
          })
      )
      .call(g => g.select('.domain').remove());

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove());

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => '')
      );

    // Add problem areas with colored backgrounds based on metric type
    if (selectedMetric === 'fps') {
      // Red area for FPS < 30
      g.append('rect')
        .attr('x', 0)
        .attr('y', y(0))
        .attr('width', width)
        .attr('height', y(30) - y(0))
        .attr('fill', 'rgba(244, 67, 54, 0.1)');

      // Yellow area for 30 <= FPS < 60
      g.append('rect')
        .attr('x', 0)
        .attr('y', y(30))
        .attr('width', width)
        .attr('height', y(60) - y(30))
        .attr('fill', 'rgba(255, 160, 0, 0.1)');
    } else if (selectedMetric === 'cpuTime') {
      // Red area for CPU > frameBudget
      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', y(frameBudget))
        .attr('fill', 'rgba(244, 67, 54, 0.1)');
    }

    // Plot detected issues on the timeline
    const relatedIssues = detectedIssues.filter(issue =>
      issue.relatedMetrics.includes(selectedMetric)
    );

    g.selectAll('.issue-marker')
      .data(relatedIssues)
      .enter()
      .append('circle')
      .attr('class', 'issue-marker')
      .attr('cx', d => x(d.timestamp))
      .attr('cy', 10) // Fixed position at the top
      .attr('r', 5)
      .attr('fill', d => getSeverityColor(d.severity))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .append('title')
      .text(d => `${d.description} (${formatTimestamp(d.timestamp)})`);

    // Add the area under the line
    const areaColor =
      selectedMetric === 'fps'
        ? 'rgba(33, 150, 243, 0.2)'
        : selectedMetric === 'cpuTime'
          ? 'rgba(255, 87, 34, 0.2)'
          : 'rgba(76, 175, 80, 0.2)';

    g.append('path').datum(data).attr('fill', areaColor).attr('d', area);

    // Add the line path with appropriate color
    const lineColor =
      selectedMetric === 'fps' ? '#2196F3' : selectedMetric === 'cpuTime' ? '#ff5722' : '#4CAF50';

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', lineColor)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add points for the recent data
    const recentData = data?.slice(-10); // Last 10 points

    g.selectAll('.data-point')
      .data(recentData)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => x(d.timestamp))
      .attr('cy', d => y(d.value))
      .attr('r', (d, i) => (i === recentData.length - 1 ? 4 : 2)) // Larger circle for most recent point
      .attr('fill', d => {
        // Color based on metric type and value
        if (selectedMetric === 'fps') {
          if (d.value < 30) return '#f44336'; // Red
          if (d.value < 60) return '#ffa000'; // Orange
          return '#4CAF50'; // Green
        } else if (selectedMetric === 'cpuTime') {
          if (d.value > frameBudget * 1.5) return '#f44336'; // Red
          if (d.value > frameBudget) return '#ffa000'; // Orange
          return '#4CAF50'; // Green
        } else if (selectedMetric === 'cacheHitRate' || selectedMetric === 'animationSmoothness') {
          if (d.value < 50) return '#f44336'; // Red
          if (d.value < 80) return '#ffa000'; // Orange
          return '#4CAF50'; // Green
        }
        return lineColor;
      });

    // Add a vertical line for the current time
    g.append('line')
      .attr('x1', x(now))
      .attr('x2', x(now))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#757575')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,3');

    // Add tooltip interaction
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'performance-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '5px 10px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    g.selectAll('.data-point')
      .on('mouseover', function (event: MouseEvent, d: unknown) {
        const dataPoint = d as MetricPoint;
        tooltip.style('visibility', 'visible').html(`
            <div>Time: ${formatTimestamp(dataPoint.timestamp)}</div>
            <div>Value: ${dataPoint.value.toFixed(1)}</div>
          `);
      })
      .on('mousemove', function (event: MouseEvent) {
        tooltip.style('top', event?.pageY - 10 + 'px').style('left', event?.pageX + 10 + 'px');
      })
      .on('mouseout', function () {
        tooltip.style('visibility', 'hidden');
      });
  };

  // Handle animation selection
  const handleAnimationSelect = (animationId: string) => {
    setMonitoredAnimation(animationId);
    setIsMonitoring(true);
  };

  // Handle time window change
  const handleTimeWindowChange = (windowMs: number) => {
    setTimeWindow(windowMs);
  };

  // Handle metric selection
  const handleMetricSelect = (metric: keyof PerformanceMetrics) => {
    setSelectedMetric(metric);
  };

  // Export performance data
  const exportPerformanceData = () => {
    const dataStr = JSON.stringify(performanceMetrics, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileName = `performance-data-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Get severity color
  const getSeverityColor = (severity: PerformanceIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#ffa000';
      case 'low':
        return '#7cb342';
      default:
        return '#999';
    }
  };

  return (
    <div
      className="performance-monitoring-dashboard"
      ref={containerRef}
      style={{
        width,
        height,
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="dashboard-header"
        style={{
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Performance Monitoring Dashboard</h1>
        <p>Real-time visualization performance metrics and analysis</p>

        <div
          className="dashboard-controls"
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <label htmlFor="animation-select" style={{ marginRight: '0.5rem' }}>
              Monitor Animation:
            </label>
            <select
              id="animation-select"
              value={monitoredAnimation}
              onChange={e => handleAnimationSelect(e.target.value)}
              style={{ padding: '0.25rem' }}
            >
              <option value="">Select Animation</option>
              {activeAnimations.map(id => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="time-window" style={{ marginRight: '0.5rem' }}>
              Time Window:
            </label>
            <select
              id="time-window"
              value={timeWindow}
              onChange={e => handleTimeWindowChange(parseInt(e.target.value))}
              style={{ padding: '0.25rem' }}
            >
              <option value="10000">10 seconds</option>
              <option value="30000">30 seconds</option>
              <option value="60000">1 minute</option>
              <option value="300000">5 minutes</option>
            </select>
          </div>

          <div>
            <label htmlFor="metric-select" style={{ marginRight: '0.5rem' }}>
              Primary Metric:
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={e => handleMetricSelect(e.target.value as keyof PerformanceMetrics)}
              style={{ padding: '0.25rem' }}
            >
              <option value="fps">FPS</option>
              <option value="cpuTime">CPU Time</option>
              <option value="memoryUsage">Memory Usage</option>
              <option value="domOperations">DOM Operations</option>
              <option value="renderTime">Render Time</option>
              <option value="layoutThrashing">Layout Thrashing</option>
              <option value="cacheHitRate">Cache Hit Rate</option>
              <option value="animationSmoothness">Animation Smoothness</option>
            </select>
          </div>

          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isMonitoring ? '#f44336' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>

          <button
            onClick={exportPerformanceData}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            disabled={performanceMetrics.fps.length === 0}
          >
            Export Data
          </button>

          {/* Frame Budget Control */}
          <div style={{ display: 'inline-block', marginLeft: '15px' }}>
            <label>
              Frame Budget (ms):
              <input
                type="number"
                min="1"
                step="0.1"
                value={frameBudget.toFixed(1)}
                onChange={e => setFrameBudget(parseFloat(e.target.value) || 16.67)}
                style={{ width: '60px', marginLeft: '5px' }}
              />
            </label>
          </div>
        </div>
      </div>

      <div
        className="dashboard-main"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '1rem',
          padding: '1rem',
          overflow: 'hidden',
        }}
      >
        <div
          className="metric-panel fps-panel"
          style={{
            gridColumn: '1',
            gridRow: '1',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            borderRadius: '4px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>FPS</h2>
          <div className="current-value" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {performanceMetrics.fps.length > 0
              ? Math.round(performanceMetrics.fps[performanceMetrics.fps.length - 1].value)
              : '-'}
          </div>
          <div className="chart-container" style={{ flex: 1, minHeight: 0 }}>
            <svg ref={fpsChartRef} width="100%" height="100%"></svg>
          </div>
        </div>

        <div
          className="metric-panel cpu-panel"
          style={{
            gridColumn: '2',
            gridRow: '1',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            borderRadius: '4px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>CPU Time (ms)</h2>
          <div className="current-value" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {performanceMetrics.cpuTime.length > 0
              ? performanceMetrics.cpuTime[performanceMetrics.cpuTime.length - 1].value.toFixed(1)
              : '-'}
          </div>
          <div className="chart-container" style={{ flex: 1, minHeight: 0 }}>
            <svg ref={cpuChartRef} width="100%" height="100%"></svg>
          </div>
        </div>

        <div
          className="metric-panel memory-panel"
          style={{
            gridColumn: '1',
            gridRow: '2',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            borderRadius: '4px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Memory Usage (MB)</h2>
          <div className="current-value" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {performanceMetrics.memoryUsage.length > 0
              ? performanceMetrics.memoryUsage[
                  performanceMetrics.memoryUsage.length - 1
                ].value.toFixed(1)
              : '-'}
          </div>
          <div className="chart-container" style={{ flex: 1, minHeight: 0 }}>
            <svg ref={memoryChartRef} width="100%" height="100%"></svg>
          </div>
        </div>

        <div
          className="issues-panel"
          style={{
            gridColumn: '2',
            gridRow: '2',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            borderRadius: '4px',
            padding: '1rem',
            overflow: 'auto',
          }}
        >
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Detected Issues</h2>

          {detectedIssues.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {detectedIssues
                .slice()
                .reverse()
                .map(issue => (
                  <li
                    key={issue.id}
                    style={{
                      padding: '0.5rem',
                      borderLeft: `4px solid ${getSeverityColor(issue.severity)}`,
                      marginBottom: '0.5rem',
                      backgroundColor: '#f9f9f9',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <strong>
                        {issue.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </strong>
                      <span style={{ color: '#666', fontSize: '0.8rem' }}>
                        {formatTimestamp(issue.timestamp)}
                      </span>
                    </div>
                    <div>{issue.description}</div>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#333' }}>
                      Recommendation: {issue.recommendation}
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              {isMonitoring ? 'No issues detected yet' : 'Start monitoring to detect issues'}
            </div>
          )}
        </div>
      </div>

      <div
        className="timeline-container"
        style={{
          height: '150px',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          borderRadius: '4px',
          margin: '0 1rem 1rem',
          padding: '1rem',
          overflow: 'hidden',
        }}
      >
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Performance Timeline</h2>
        <div style={{ height: 'calc(100% - 2rem)' }}>
          <svg ref={timelineChartRef} width="100%" height="100%"></svg>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitoringDashboard;

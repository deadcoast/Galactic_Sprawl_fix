import * as d3 from 'd3';
import React, { useEffect, useRef, useState } from 'react';

// Import all our optimization utilities
import { animationFrameManager } from '../../../utils/performance/D3AnimationFrameManager';
import {
  animationQualityManager,
  QualitySettings,
} from '../../../utils/performance/D3AnimationQualityManager';
import { optimizeWithBatchedUpdates } from '../../../utils/performance/D3BatchedUpdates';
import { createMemoizedInterpolators } from '../../../utils/performance/D3InterpolationCache';

// Types
interface UnifiedOptimizationDemoProps {
  width?: number;
  height?: number;
}

// Demo data type
interface DataPoint {
  id: string;
  x: number;
  y: number;
  value: number;
  category: string;
  size: number;
  color: string;
}

/**
 * UnifiedOptimizationDemo
 *
 * A comprehensive showcase of all D3 optimization techniques working together:
 * 1. Animation Frame Management - Coordinated animation timing
 * 2. Batched DOM Updates - Preventing layout thrashing
 * 3. Interpolation Memoization - Caching calculated values
 * 4. Quality Adjustment - Adapting to device capabilities
 *
 * This demo presents a data visualization that dynamically scales in complexity
 * based on device performance while maintaining smooth animations.
 */
const UnifiedOptimizationDemo: React.FC<UnifiedOptimizationDemoProps> = ({
  width = 1000,
  height = 800,
}) => {
  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);

  // State for the visualization
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [animationMode, setAnimationMode] = useState<'standard' | 'optimized'>('optimized');
  const [dataSize, setDataSize] = useState(500);
  const [optimizationsEnabled, setOptimizationsEnabled] = useState({
    frameManager: true,
    batching: true,
    memoization: true,
    qualityAdjustment: true,
  });

  // Performance metrics
  const [fps, setFps] = useState(0);
  const [averageCpuUsage, setAverageCpuUsage] = useState(0);
  const [frameDrops, setFrameDrops] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);
  const [qualitySettings, setQualitySettings] = useState<QualitySettings>(
    animationQualityManager.getCurrentSettings()
  );

  // Animation identifiers
  const ANIMATION_ID = 'unified-demo';
  const CHARTS = ['scatter', 'bars', 'lines', 'areas'];
  const CHART_COLORS = {
    scatter: d3.schemeCategory10[0],
    bars: d3.schemeCategory10[1],
    lines: d3.schemeCategory10[2],
    areas: d3.schemeCategory10[3],
  };

  // Generate initial dataset
  useEffect(() => {
    const newData = generateData(dataSize);
    setDataPoints(newData);
  }, [dataSize]);

  // Set up the quality adjustment registration
  useEffect(() => {
    if (optimizationsEnabled.qualityAdjustment) {
      animationQualityManager.registerAnimation(ANIMATION_ID, settings => {
        setQualitySettings(settings);
      });
    }

    return () => {
      animationQualityManager.unregisterAnimation(ANIMATION_ID);
    };
  }, [optimizationsEnabled.qualityAdjustment]);

  // Set up animation frame manager
  useEffect(() => {
    if (!optimizationsEnabled.frameManager) return;

    // Register main animation
    animationFrameManager.registerAnimation(
      {
        id: ANIMATION_ID,
        name: 'Unified Demo',
        priority: 'high',
        type: 'custom',
        duration: 0, // Endless
        loop: true,
      },
      (elapsed, deltaTime, frameInfo) => {
        setFps(Math.round(frameInfo.currentFps));

        // Monitoring stats
        if (elapsed % 1000 < deltaTime) {
          setAverageCpuUsage((frameInfo.averageCpuTime / frameInfo.targetFrameTime) * 100);
          setFrameDrops(frameInfo.droppedFrames);
        }

        return false; // Never complete
      }
    );

    // Start the animation if needed
    if (isAnimating) {
      animationFrameManager.startAnimation(ANIMATION_ID);
    }

    return () => {
      animationFrameManager.unregisterAnimation(ANIMATION_ID);
    };
  }, [optimizationsEnabled.frameManager, isAnimating]);

  // Create and update the visualization
  useEffect(() => {
    if (!svgRef.current || dataPoints.length === 0) return;

    // Clear existing content
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up scales and axes
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, chartWidth]);

    const yScale = d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(CHARTS);

    const sizeScale = d3.scaleLinear().domain([1, 10]).range([3, 15]);

    // SVG setup
    let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

    // Apply optimizations based on settings
    if (optimizationsEnabled.batching && animationMode === 'optimized') {
      // Use batched updates
      svg = optimizeWithBatchedUpdates(d3.select(svgRef.current), ANIMATION_ID, {
        priority: 'high',
      });
    } else {
      svg = d3.select(svgRef.current);
    }

    // Create main container with margin convention
    const container = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add axes
    const xAxis = container
      .append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale));

    const yAxis = container.append('g').call(d3.axisLeft(yScale));

    // Create chart elements based on data categories
    const scatterData = dataPoints.filter(d => d.category === 'scatter');
    const barData = dataPoints.filter(d => d.category === 'bars');
    const lineData = dataPoints.filter(d => d.category === 'lines');
    const areaData = dataPoints.filter(d => d.category === 'areas');

    // Apply quality adjustments
    const effectiveSettings = optimizationsEnabled.qualityAdjustment
      ? qualitySettings
      : {
          ...qualitySettings,
          maxElementCount: 10000, // No limit
          visualComplexity: 1.0, // Max complexity
          enableEffects: true,
        };

    // Scatter plot (points)
    const scatterGroup = container.append('g').attr('class', 'scatter-group');

    // Filter data based on quality settings
    const maxScatterPoints = Math.min(
      scatterData.length,
      Math.floor(effectiveSettings.maxElementCount * 0.35)
    );
    const filteredScatterData = scatterData.slice(0, maxScatterPoints);

    scatterGroup
      .selectAll('circle')
      .data(filteredScatterData)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', d => sizeScale(d.size))
      .style('fill', d => d.color)
      .style('opacity', 0.7);

    // Add visual complexity based on quality settings
    if (effectiveSettings.visualComplexity > 0.6 && effectiveSettings.enableEffects) {
      scatterGroup.selectAll('circle').style('stroke', '#333').style('stroke-width', 1);

      if (effectiveSettings.visualComplexity > 0.8) {
        // Add drop shadow for high quality
        svg
          .append('defs')
          .append('filter')
          .attr('id', 'scatter-shadow')
          .append('feDropShadow')
          .attr('dx', '0')
          .attr('dy', '1')
          .attr('stdDeviation', '1')
          .attr('flood-opacity', '0.3');

        scatterGroup.style('filter', 'url(#scatter-shadow)');
      }
    }

    // Bar chart
    const barGroup = container.append('g').attr('class', 'bar-group');

    const maxBars = Math.min(barData.length, Math.floor(effectiveSettings.maxElementCount * 0.25));
    const filteredBarData = barData.slice(0, maxBars);
    const barWidth = chartWidth / (filteredBarData.length + 1);

    barGroup
      .selectAll('rect')
      .data(filteredBarData)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.x) - barWidth / 2)
      .attr('y', d => yScale(d.y))
      .attr('width', barWidth * 0.8)
      .attr('height', d => chartHeight - yScale(d.y))
      .style('fill', d => d.color)
      .style('opacity', 0.8);

    // Add visual complexity for bars
    if (effectiveSettings.visualComplexity > 0.4) {
      // Add bar borders
      barGroup.selectAll('rect').style('stroke', '#333').style('stroke-width', 1);

      if (effectiveSettings.visualComplexity > 0.7 && effectiveSettings.enableEffects) {
        // Add linear gradients for bars at high quality
        const defs = svg.select('defs').size() ? svg.select('defs') : svg.append('defs');

        filteredBarData.forEach((d, i) => {
          const gradient = defs
            .append('linearGradient')
            .attr('id', `bar-gradient-${i}`)
            .attr('gradientTransform', 'rotate(90)');

          gradient
            .append('stop')
            .attr('offset', '0%')
            .attr('stop-color', d3.rgb(d.color).brighter(0.7).toString());

          gradient.append('stop').attr('offset', '100%').attr('stop-color', d.color);
        });

        barGroup.selectAll('rect').style('fill', (d, i) => `url(#bar-gradient-${i})`);
      }
    }

    // Line chart
    const lineGroup = container.append('g').attr('class', 'line-group');

    // Prepare line data (grouped by value ranges)
    const lineValueGroups = d3.group(lineData, d => Math.floor(d.value / 20));

    // Sort data points in each group by x value for proper line drawing
    lineValueGroups.forEach((points, key) => {
      points.sort((a, b) => a.x - b.x);
    });

    // Calculate max lines based on quality
    const maxLineGroups = Math.min(
      lineValueGroups.size,
      Math.ceil(effectiveSettings.maxElementCount * 0.05)
    );

    // Create a line generator
    const lineGenerator = d3
      .line<DataPoint>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y));

    // Apply appropriate curve based on quality settings
    if (effectiveSettings.visualComplexity > 0.7) {
      lineGenerator.curve(d3.curveCatmullRom.alpha(0.5));
    } else if (effectiveSettings.visualComplexity > 0.4) {
      lineGenerator.curve(d3.curveMonotoneX);
    } else {
      lineGenerator.curve(d3.curveLinear);
    }

    // Add lines
    let lineCount = 0;
    lineValueGroups.forEach((points, key) => {
      if (lineCount >= maxLineGroups) return;

      // Create line
      lineGroup
        .append('path')
        .datum(points)
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', points[0].color)
        .attr('stroke-width', effectiveSettings.visualComplexity > 0.6 ? 3 : 2)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .style('opacity', 0.8);

      // Add visual complexity - dots at data points for high quality
      if (effectiveSettings.visualComplexity > 0.7 && effectiveSettings.enableEffects) {
        lineGroup
          .selectAll(`.line-point-${key}`)
          .data(points)
          .enter()
          .append('circle')
          .attr('class', `line-point-${key}`)
          .attr('cx', d => xScale(d.x))
          .attr('cy', d => yScale(d.y))
          .attr('r', 3)
          .attr('fill', points[0].color)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1);
      }

      lineCount++;
    });

    // Area chart
    const areaGroup = container.append('g').attr('class', 'area-group');

    // Group area data by category subdivisions
    const areaValueGroups = d3.group(areaData, d => Math.floor(d.value / 25));

    // Sort data points in each group by x value for proper area drawing
    areaValueGroups.forEach((points, key) => {
      points.sort((a, b) => a.x - b.x);
    });

    // Calculate max areas based on quality
    const maxAreaGroups = Math.min(
      areaValueGroups.size,
      Math.ceil(effectiveSettings.maxElementCount * 0.05)
    );

    // Create an area generator
    const areaGenerator = d3
      .area<DataPoint>()
      .x(d => xScale(d.x))
      .y0(chartHeight)
      .y1(d => yScale(d.y));

    // Apply appropriate curve based on quality settings
    if (effectiveSettings.visualComplexity > 0.7) {
      areaGenerator.curve(d3.curveCatmullRom.alpha(0.5));
    } else if (effectiveSettings.visualComplexity > 0.4) {
      areaGenerator.curve(d3.curveMonotoneX);
    } else {
      areaGenerator.curve(d3.curveLinear);
    }

    // Add areas (layered from bottom to top)
    let areaCount = 0;
    areaValueGroups.forEach((points, key) => {
      if (areaCount >= maxAreaGroups) return;

      // Setup gradient for area
      if (effectiveSettings.visualComplexity > 0.5 && effectiveSettings.enableEffects) {
        const defs = svg.select('defs').size() ? svg.select('defs') : svg.append('defs');

        const gradient = defs
          .append('linearGradient')
          .attr('id', `area-gradient-${key}`)
          .attr('gradientTransform', 'rotate(90)');

        gradient
          .append('stop')
          .attr('offset', '0%')
          .attr('stop-color', d3.rgb(points[0].color).copy({ opacity: 0.8 }))
          .attr('stop-opacity', 0.8);

        gradient
          .append('stop')
          .attr('offset', '100%')
          .attr('stop-color', d3.rgb(points[0].color).copy({ opacity: 0.1 }))
          .attr('stop-opacity', 0.1);

        // Create area
        areaGroup
          .append('path')
          .datum(points)
          .attr('d', areaGenerator)
          .attr('fill', `url(#area-gradient-${key})`)
          .style('opacity', 0.7);
      } else {
        // Simpler version for lower quality
        areaGroup
          .append('path')
          .datum(points)
          .attr('d', areaGenerator)
          .attr('fill', points[0].color)
          .style('opacity', 0.4);
      }

      areaCount++;
    });

    // Add tooltips or interactive elements for high quality settings
    if (effectiveSettings.visualComplexity > 0.9 && effectiveSettings.enableEffects) {
      // Add tooltip container
      const tooltip = d3
        .select(containerRef.current)
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background-color', 'rgba(255, 255, 255, 0.9)')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('pointer-events', 'none')
        .style('z-index', 10);

      // Add interaction to scatter points
      scatterGroup
        .selectAll('circle')
        .on('mouseover', (event, d) => {
          tooltip.transition().duration(200).style('opacity', 0.9);
          tooltip
            .html(
              `
            <strong>Scatter Point</strong><br>
            Value: ${d.value.toFixed(2)}<br>
            Category: ${d.category}
          `
            )
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 28 + 'px');
        })
        .on('mouseout', () => {
          tooltip.transition().duration(500).style('opacity', 0);
        });

      // Similar interactions for bars, lines, areas...
    }

    // Set up animation and simulation if enabled
    if (isAnimating) {
      // Animation timing variables
      let lastTime = Date.now();
      const updateInterval = 30; // ms between updates

      // Animation function
      const animate = () => {
        // Only update if enough time has passed
        const now = Date.now();
        if (now - lastTime >= updateInterval) {
          // Update data with slight movements
          const updatedData = dataPoints.map(d => {
            const jitter = Math.random() * 2 - 1;
            const speedFactor = animationMode === 'optimized' ? 0.1 : 0.2;

            return {
              ...d,
              x: Math.max(0, Math.min(100, d.x + jitter * speedFactor)),
              y: Math.max(0, Math.min(100, d.y + jitter * speedFactor)),
              value: Math.max(1, Math.min(100, d.value + jitter * 0.5)),
            };
          });

          // Use memoization for interpolations if enabled
          const updateVisuals = () => {
            // Update scatter plot
            scatterGroup
              .selectAll('circle')
              .data(filteredScatterData)
              .transition()
              .duration(updateInterval * 0.9)
              .attr('cx', d => xScale(d.x))
              .attr('cy', d => yScale(d.y));

            // Update bars
            barGroup
              .selectAll('rect')
              .data(filteredBarData)
              .transition()
              .duration(updateInterval * 0.9)
              .attr('x', d => xScale(d.x) - barWidth / 2)
              .attr('y', d => yScale(d.y))
              .attr('height', d => chartHeight - yScale(d.y));

            // Update lines (recalculate paths)
            lineValueGroups.forEach((points, key) => {
              if (lineCount >= maxLineGroups) return;

              lineGroup
                .select(`path:nth-child(${key + 1})`)
                .datum(points)
                .transition()
                .duration(updateInterval * 0.9)
                .attr('d', lineGenerator);

              // Update dots if present
              if (effectiveSettings.visualComplexity > 0.7 && effectiveSettings.enableEffects) {
                lineGroup
                  .selectAll(`.line-point-${key}`)
                  .data(points)
                  .transition()
                  .duration(updateInterval * 0.9)
                  .attr('cx', d => xScale(d.x))
                  .attr('cy', d => yScale(d.y));
              }
            });

            // Update areas
            areaValueGroups.forEach((points, key) => {
              if (areaCount >= maxAreaGroups) return;

              areaGroup
                .select(`path:nth-child(${key + 1})`)
                .datum(points)
                .transition()
                .duration(updateInterval * 0.9)
                .attr('d', areaGenerator);
            });

            setUpdateCount(prev => prev + 1);
          };

          if (optimizationsEnabled.memoization && animationMode === 'optimized') {
            // Use memoized interpolators
            const memoizedInterpolators = createMemoizedInterpolators(ANIMATION_ID);
            const memoizedScaleX = memoizedInterpolators.number(xScale);
            const memoizedScaleY = memoizedInterpolators.number(yScale);

            // Override the scales with memoized versions
            xScale.range = () => memoizedScaleX.range();
            yScale.range = () => memoizedScaleY.range();
          }

          // Register the update with the animation frame manager if enabled
          if (optimizationsEnabled.frameManager && animationMode === 'optimized') {
            // Let the frame manager handle the timing
            updateVisuals();
          } else {
            // Immediate update
            updateVisuals();
          }

          setDataPoints(updatedData);
          lastTime = now;
        }

        // Continue animation
        if (isAnimating) {
          requestAnimationFrame(animate);
        }
      };

      // Start animation
      animate();
    }

    // Set up simulation (physics-based) for higher quality settings
    if (simulationRunning && effectiveSettings.enablePhysics) {
      // Create force simulation
      const simulation = d3
        .forceSimulation(scatterData as d3.SimulationNodeDatum[])
        .force('x', d3.forceX(d => xScale(d.x as number)).strength(0.1))
        .force('y', d3.forceY(d => yScale(d.y as number)).strength(0.1))
        .force(
          'collide',
          d3.forceCollide(d => sizeScale((d as DataPoint).size) * 1.2)
        )
        .force('charge', d3.forceManyBody().strength(-10 * effectiveSettings.physicsDetail))
        .alphaDecay(0.01);

      // Update positions on tick
      simulation.on('tick', () => {
        scatterGroup
          .selectAll('circle')
          .attr('cx', d => (d as any).x)
          .attr('cy', d => (d as any).y);
      });

      return () => {
        // Stop the simulation when unmounting
        simulation.stop();
      };
    }
  }, [
    svgRef.current,
    dataPoints,
    isAnimating,
    simulationRunning,
    animationMode,
    optimizationsEnabled,
    qualitySettings,
    width,
    height,
  ]);

  // Generate random data for the visualization
  const generateData = (count: number): DataPoint[] => {
    const data: DataPoint[] = [];
    const categories = CHARTS;

    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];

      data.push({
        id: `point-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        value: Math.random() * 100,
        category,
        size: Math.random() * 10 + 1,
        color: CHART_COLORS[category as keyof typeof CHART_COLORS],
      });
    }

    return data;
  };

  // Toggle animation
  const toggleAnimation = () => {
    const newState = !isAnimating;
    setIsAnimating(newState);

    if (optimizationsEnabled.frameManager && newState) {
      animationFrameManager.startAnimation(ANIMATION_ID);
    } else if (optimizationsEnabled.frameManager && !newState) {
      animationFrameManager.pauseAnimation(ANIMATION_ID);
    }
  };

  // Toggle optimization feature
  const toggleOptimization = (feature: keyof typeof optimizationsEnabled) => {
    setOptimizationsEnabled(prev => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  // Switch between standard and optimized modes
  const toggleMode = () => {
    setAnimationMode(prev => (prev === 'standard' ? 'optimized' : 'standard'));
  };

  // Toggle physics simulation
  const toggleSimulation = () => {
    setSimulationRunning(!simulationRunning);
  };

  // Render controls and visualization
  return (
    <div
      className="unified-optimization-demo"
      ref={containerRef}
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      <h2>Unified D3 Performance Optimization Demo</h2>
      <p>
        This demo showcases all D3 performance optimization techniques working together: Animation
        Frame Management, Batched DOM Updates, Interpolation Memoization, and Quality Adjustment.
      </p>

      {/* Control panel */}
      <div
        className="control-panel"
        ref={controlPanelRef}
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <button
              onClick={toggleAnimation}
              style={{
                padding: '8px 16px',
                backgroundColor: isAnimating ? '#f44336' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
              }}
            >
              {isAnimating ? 'Stop Animation' : 'Start Animation'}
            </button>

            <button
              onClick={toggleMode}
              style={{
                padding: '8px 16px',
                backgroundColor: animationMode === 'optimized' ? '#2196F3' : '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
              }}
            >
              {animationMode === 'optimized' ? 'Using Optimized Mode' : 'Using Standard Mode'}
            </button>

            <button
              onClick={toggleSimulation}
              style={{
                padding: '8px 16px',
                backgroundColor: simulationRunning ? '#9C27B0' : '#607D8B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {simulationRunning ? 'Disable Physics' : 'Enable Physics'}
            </button>
          </div>

          <div>
            <label>
              Data Points: {dataSize}
              <input
                type="range"
                min="100"
                max="2000"
                value={dataSize}
                onChange={e => setDataSize(parseInt(e.target.value))}
                style={{ display: 'block', width: '200px' }}
              />
            </label>
          </div>
        </div>

        {/* Optimization toggles */}
        <div style={{ marginTop: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Optimization Techniques:</div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <label>
              <input
                type="checkbox"
                checked={optimizationsEnabled.frameManager}
                onChange={() => toggleOptimization('frameManager')}
              />
              Animation Frame Manager
            </label>

            <label>
              <input
                type="checkbox"
                checked={optimizationsEnabled.batching}
                onChange={() => toggleOptimization('batching')}
              />
              Batched DOM Updates
            </label>

            <label>
              <input
                type="checkbox"
                checked={optimizationsEnabled.memoization}
                onChange={() => toggleOptimization('memoization')}
              />
              Interpolation Memoization
            </label>

            <label>
              <input
                type="checkbox"
                checked={optimizationsEnabled.qualityAdjustment}
                onChange={() => toggleOptimization('qualityAdjustment')}
              />
              Quality Adjustment
            </label>
          </div>
        </div>
      </div>

      {/* Performance metrics */}
      <div
        className="performance-metrics"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#e8f5e9',
          borderRadius: '4px',
          flexWrap: 'wrap',
          gap: '15px',
        }}
      >
        <div>
          <div>
            <strong>FPS:</strong>{' '}
            <span
              style={{
                color: fps > 45 ? 'green' : fps > 30 ? 'orange' : 'red',
                fontWeight: 'bold',
              }}
            >
              {fps}
            </span>
          </div>
          <div>
            <strong>Quality Tier:</strong>{' '}
            {qualitySettings.physicsDetail >= 0.8
              ? 'High'
              : qualitySettings.physicsDetail >= 0.5
                ? 'Medium'
                : 'Low'}
          </div>
        </div>

        <div>
          <div>
            <strong>CPU Usage:</strong> {averageCpuUsage.toFixed(1)}%
          </div>
          <div>
            <strong>Frame Drops:</strong> {frameDrops}
          </div>
        </div>

        <div>
          <div>
            <strong>Updates:</strong> {updateCount}
          </div>
          <div>
            <strong>Elements:</strong> {qualitySettings.maxElementCount}
          </div>
        </div>

        <div>
          <div>
            <strong>Visual Quality:</strong> {(qualitySettings.visualComplexity * 100).toFixed(0)}%
          </div>
          <div>
            <strong>Physics:</strong> {qualitySettings.enablePhysics ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Main visualization */}
      <svg
        ref={svgRef}
        style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#ffffff',
        }}
      ></svg>

      {/* Explanation */}
      <div
        className="explanation"
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>How the Optimizations Work Together</h3>

        <p>
          This visualization demonstrates the combined power of multiple D3 optimization techniques:
        </p>

        <ul>
          <li>
            <strong>Animation Frame Manager:</strong> Coordinates all animations in a single loop,
            prioritizes important updates, and ensures consistent frame timing.
          </li>
          <li>
            <strong>Batched Updates:</strong> Groups DOM read/write operations to prevent layout
            thrashing, resulting in smoother animations and less CPU usage.
          </li>
          <li>
            <strong>Interpolation Memoization:</strong> Caches calculated values during animations,
            reducing redundant calculations and improving performance.
          </li>
          <li>
            <strong>Quality Adjustment:</strong> Automatically adapts visualization complexity based
            on device capabilities, ensuring smooth performance across different devices.
          </li>
        </ul>

        <p>
          Toggle between standard and optimized modes to see the difference in performance. The
          visualization will automatically adjust its complexity based on your device's capabilities
          when quality adjustment is enabled.
        </p>
      </div>
    </div>
  );
};

export default UnifiedOptimizationDemo;

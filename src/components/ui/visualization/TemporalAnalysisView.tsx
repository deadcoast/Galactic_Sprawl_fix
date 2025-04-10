import * as d3 from 'd3';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { SimulationNodeDatum } from '../../../types/visualizations/D3Types';

/**
 * Represents a data point in time series
 */
interface TimeDataPoint {
  timestamp: Date;
  value: number;
  category: string;
  id: string;
}

/**
 * Node type for time-based animations
 * Extends SimulationNodeDatum to ensure D3 type compatibility
 */
interface TimeNode extends SimulationNodeDatum<TimeDataPoint> {
  timestamp: Date;
  value: number;
  category: string;
  x?: number;
  y?: number;
  radius?: number;
  color?: string;
}

/**
 * Configuration options for the animation and transition settings
 */
interface AnimationConfig {
  /** Duration of transitions in milliseconds */
  transitionDuration: number;
  /** Easing function for transitions */
  easing: (t: number) => number;
  /** Delay between animations in milliseconds */
  staggerDelay: number;
  /** Whether to loop animations */
  loop: boolean;
}

/**
 * Props for the TemporalAnalysisView component
 */
interface TemporalAnalysisViewProps {
  /**
   * Time series data to visualize
   */
  data: TimeDataPoint[];

  /**
   * Width of the visualization in pixels
   * @default 800
   */
  width?: number;

  /**
   * Height of the visualization in pixels
   * @default 500
   */
  height?: number;

  /**
   * Margin for the visualization
   */
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /**
   * Whether to show time labels
   * @default true
   */
  showLabels?: boolean;

  /**
   * Animation configuration
   */
  animationConfig?: Partial<AnimationConfig>;

  /**
   * CSS class name for additional styling
   */
  className?: string;
}

/**
 * Safely converts time data to D3-compatible format
 */
const convertToTimeNodes = (data: TimeDataPoint[]): TimeNode[] => {
  return data?.map(point => {
    // Properly typed conversion with no type assertions
    const node: TimeNode = {
      id: point.id,
      timestamp: point.timestamp,
      value: point.value,
      category: point.category,
      // The original data field keeps the reference to the source data
      data: point,
    };

    return node;
  });
};

/**
 * Get color for a specific category
 */
const getCategoryColor = (category: string): string => {
  // Color scale for different categories
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  return colorScale(category);
};

/**
 * Component for visualizing temporal data with smooth transitions
 */
const TemporalAnalysisView: React.FC<TemporalAnalysisViewProps> = ({
  data,
  width = 800,
  height = 500,
  margin = { top: 40, right: 40, bottom: 60, left: 60 },
  showLabels = true,
  animationConfig = {},
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Default animation config with sensible defaults
  const defaultAnimationConfig: AnimationConfig = {
    transitionDuration: 750,
    easing: d3.easeCubicInOut,
    staggerDelay: 50,
    loop: false,
  };

  // Merge default config with provided config
  const finalAnimationConfig: AnimationConfig = {
    ...defaultAnimationConfig,
    ...animationConfig,
  };

  // Chart dimensions
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Track animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState<Date | null>(null);

  // Extract unique categories from data
  const categories = Array.from(new Set(data?.map(d => d.category)));

  // Convert data to time nodes for visualization
  const timeNodes = convertToTimeNodes(data);

  // Extract time range from data
  const timeExtent = d3.extent(data, d => d.timestamp) as [Date, Date];
  const valueExtent = d3.extent(data, d => d.value) as [number, number];

  // Set up time scale with proper typing
  const timeScale = d3.scaleTime<number, number>().domain(timeExtent).range([0, chartWidth]);

  // Set up value scale with proper typing
  const valueScale = d3
    .scaleLinear<number, number>()
    .domain([Math.min(0, valueExtent[0]), valueExtent[1]])
    .range([chartHeight, 0]);

  // Set up category scale with proper typing
  const categoryScale = d3
    .scaleBand<string>()
    .domain(categories)
    .range([0, chartHeight])
    .padding(0.1);

  /**
   * Initialize chart
   */
  useEffect(() => {
    if (!svgRef.current || !data?.length) return;

    // Select SVG element with proper typing
    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);

    // Clear unknown existing elements
    svg.selectAll('*').remove();

    // Add chart group with margins
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Add X axis with proper typing
    const xAxis = chart
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(timeScale));

    // Add X axis label
    chart
      .append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 40)
      .text('Time');

    // Add Y axis with proper typing
    const yAxis = chart.append('g').attr('class', 'y-axis').call(d3.axisLeft(valueScale));

    // Add Y axis label
    chart
      .append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -40)
      .text('Value');

    // Draw vertical gridlines
    chart
      .append('g')
      .attr('class', 'grid x-grid')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(
        d3
          .axisBottom(timeScale)
          .tickSize(-chartHeight)
          .tickFormat(() => '')
      );

    // Draw horizontal gridlines
    chart
      .append('g')
      .attr('class', 'grid y-grid')
      .call(
        d3
          .axisLeft(valueScale)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
      );

    // Add clip path to ensure points don't overflow
    chart
      .append('clipPath')
      .attr('id', 'chart-area')
      .append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight);

    // Create container for data points with clipping
    const pointsContainer = chart
      .append('g')
      .attr('class', 'points-container')
      .attr('clip-path', 'url(#chart-area)');

    // Group data by category for visualization
    const dataByCategory = d3.group(timeNodes, d => d.category);

    // Add a line for each category with proper typing
    dataByCategory.forEach((points, category) => {
      // Sort points by timestamp for proper line drawing
      const sortedPoints = [...points].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      // Line generator with type-safe accessors
      const lineGenerator = d3
        .line<TimeNode>()
        .x(d => timeScale(d.timestamp))
        .y(d => valueScale(d.value))
        .curve(d3.curveMonotoneX);

      // Add the line path with proper typing
      pointsContainer
        .append('path')
        .attr('class', `line-${category}`)
        .attr('fill', 'none')
        .attr('stroke', getCategoryColor(category))
        .attr('stroke-width', 2)
        .attr('d', lineGenerator(sortedPoints));

      // Add circles for each data point with proper typing
      const circles = pointsContainer
        .selectAll<SVGCircleElement, TimeNode>(`.point-${category}`)
        .data(sortedPoints)
        .enter()
        .append('circle')
        .attr('class', `point-${category}`)
        .attr('cx', d => timeScale(d.timestamp))
        .attr('cy', d => valueScale(d.value))
        .attr('r', 0) // Start with radius 0 for entrance animation
        .attr('fill', getCategoryColor(category))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

      // Add entrance animation with proper typing
      circles
        .transition()
        .duration(finalAnimationConfig.transitionDuration)
        .delay((_, i) => i * finalAnimationConfig.staggerDelay)
        .ease(finalAnimationConfig.easing)
        .attr('r', 5);

      // Add labels if enabled
      if (showLabels) {
        pointsContainer
          .selectAll<SVGTextElement, TimeNode>(`.label-${category}`)
          .data(sortedPoints)
          .enter()
          .append('text')
          .attr('class', `label-${category}`)
          .attr('x', d => timeScale(d.timestamp))
          .attr('y', d => valueScale(d.value) - 10)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('opacity', 0) // Start transparent for animation
          .text(d => d.value.toFixed(1))
          .transition()
          .duration(finalAnimationConfig.transitionDuration)
          .delay((_, i) => i * finalAnimationConfig.staggerDelay + 200)
          .ease(finalAnimationConfig.easing)
          .attr('opacity', 1);
      }
    });

    // Add category legend with proper typing
    const legend = chart
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${chartWidth - 100}, 0)`);

    categories.forEach((category, i) => {
      const legendItem = legend
        .append('g')
        .attr('class', `legend-item-${category}`)
        .attr('transform', `translate(0, ${i * 20})`);

      legendItem
        .append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', getCategoryColor(category));

      legendItem
        .append('text')
        .attr('x', 20)
        .attr('y', 12)
        .attr('font-size', '12px')
        .text(category);
    });

    // Add time cursor for animation
    const timeCursor = chart
      .append('line')
      .attr('class', 'time-cursor')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0);

    // Add cursor timestamp label
    const cursorLabel = chart
      .append('text')
      .attr('class', 'cursor-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('y', -10)
      .attr('opacity', 0);

    // Setup animation controls if needed
    if (finalAnimationConfig.loop) {
      setupAnimationLoop(chart, timeScale, timeCursor, cursorLabel);
    }
  }, [data, width, height, margin, showLabels, categories]);

  /**
   * Set up animation loop with type-safe transitions
   */
  const setupAnimationLoop = (
    chart: d3.Selection<SVGGElement, unknown, null, undefined>,
    timeScale: d3.ScaleTime<number, number>,
    timeCursor: d3.Selection<SVGLineElement, unknown, null, undefined>,
    cursorLabel: d3.Selection<SVGTextElement, unknown, null, undefined>
  ) => {
    setIsAnimating(true);

    // Start and end timestamps
    const startTime = timeExtent[0];
    const endTime = timeExtent[1];
    const duration = finalAnimationConfig.transitionDuration * 5;

    // Animation function with proper typing
    const animateTimeCursor = () => {
      // Type-safe transition
      timeCursor
        .attr('opacity', 1)
        .attr('x1', timeScale(startTime))
        .attr('x2', timeScale(startTime));

      // Create a custom timer for smoother animation with proper type safety
      const startTimestamp = Date.now();
      const timerDuration = duration;

      // Use d3.timer for precise animation control with proper typing
      const timer = d3.timer(elapsed => {
        // Calculate progress (0 to 1)
        const progress = Math.min(elapsed / timerDuration, 1);

        // Interpolate the current timestamp
        const currentTime = new Date(
          startTime.getTime() + progress * (endTime.getTime() - startTime.getTime())
        );

        // Update cursor position with type-safe accessors
        timeCursor.attr('x1', timeScale(currentTime)).attr('x2', timeScale(currentTime));

        // Update cursor label with safe string formatting
        cursorLabel
          .attr('opacity', 1)
          .attr('x', timeScale(currentTime))
          .text(d3.timeFormat('%b %d, %Y')(currentTime));

        // Update React state with proper typing
        setCurrentTimestamp(currentTime);

        // Stop timer when complete
        if (progress === 1) {
          timer.stop();

          // If looping is enabled, restart after delay
          if (finalAnimationConfig.loop) {
            setTimeout(animateTimeCursor, 1000);
          } else {
            setIsAnimating(false);
          }
        }
      });
    };

    // Start the animation
    animateTimeCursor();
  };

  /**
   * Creates a type-safe function to handle hover effects on nodes
   */
  const createNodeHoverHandler = () => {
    return (event: React.MouseEvent<SVGCircleElement, MouseEvent>, node: TimeNode) => {
      // Type-safe accessing of node data
      const value = node.value;
      const timestamp = node.timestamp;
      const category = node.category;

      // Safe D3 selection
      const circle = d3.select<SVGCircleElement, TimeNode>(event?.currentTarget);

      // Type-safe transition
      circle.transition().duration(200).attr('r', 8).attr('stroke-width', 2);
    };
  };

  return (
    <div className={`temporal-analysis-container ${className}`}>
      <svg ref={svgRef} width={width} height={height} className="temporal-analysis-svg" />

      {currentTimestamp && (
        <div className="current-time-display">
          Current Time: {currentTimestamp.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default TemporalAnalysisView;

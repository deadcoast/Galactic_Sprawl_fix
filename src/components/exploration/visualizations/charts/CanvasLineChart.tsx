import { Box, Typography, useTheme } from '@mui/material';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BaseChartProps } from './BaseChart';

// LTTB (Largest Triangle Three Buckets) algorithm for downsampling time series data
// This preserves visual characteristics better than naive approaches
function downsampleLTTB(
  data: Array<Record<string, unknown>>,
  xKey: string,
  yKey: string,
  threshold: number
): Array<Record<string, unknown>> {
  if (data.length <= threshold) {
    return data;
  }

  const sampled: Array<Record<string, unknown>> = [];

  // Always add the first point
  sampled.push(data[0]);

  const bucketSize = (data.length - 2) / (threshold - 2);

  let a = 0; // Last sampled point index
  let nextA = 0;

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate bucket boundaries
    const bucketStart = Math.floor((i + 0) * bucketSize) + 1;
    const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;

    // Find the point with the largest triangle area in this bucket
    let maxArea = -1;
    let maxAreaIndex = bucketStart;

    const pointA = {
      x: Number(data[a][xKey] || 0),
      y: Number(data[a][yKey] || 0),
    };

    // For each point in the current bucket
    for (let j = bucketStart; j < bucketEnd; j++) {
      // Look ahead to next bucket to get point C
      const nextBucketStart = Math.floor((i + 1) * bucketSize) + 1;
      const nextBucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length);

      const avgX =
        data
          .slice(nextBucketStart, nextBucketEnd)
          .reduce((sum, p) => sum + Number(p[xKey] || 0), 0) /
        (nextBucketEnd - nextBucketStart);

      const avgY =
        data
          .slice(nextBucketStart, nextBucketEnd)
          .reduce((sum, p) => sum + Number(p[yKey] || 0), 0) /
        (nextBucketEnd - nextBucketStart);

      const pointC = { x: avgX, y: avgY };
      const pointB = {
        x: Number(data[j][xKey] || 0),
        y: Number(data[j][yKey] || 0),
      };

      // Calculate triangle area
      const area =
        Math.abs(
          (pointA.x - pointC.x) * (pointB.y - pointA.y) -
            (pointA.x - pointB.x) * (pointC.y - pointA.y)
        ) / 2;

      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
        nextA = j;
      }
    }

    // Add the point with the largest triangle area
    sampled.push(data[maxAreaIndex]);
    a = nextA;
  }

  // Always add the last point
  sampled.push(data[data.length - 1]);

  return sampled;
}

export interface CanvasLineChartProps extends BaseChartProps {
  /** Data to visualize */
  data: Array<Record<string, unknown>>;

  /** Key for X-axis values (usually time or date) */
  xAxisKey: string;

  /** Array of keys for Y-axis series to display */
  yAxisKeys: string[];

  /** Label for X-axis */
  xAxisLabel?: string;

  /** Label for Y-axis */
  yAxisLabel?: string;

  /** Optional min/max values for X-axis (if not provided, calculated from data) */
  xDomain?: [number, number];

  /** Optional min/max values for Y-axis (if not provided, calculated from data) */
  yDomain?: [number, number];

  /** Colors for each series */
  seriesColors?: string[];

  /** Whether to show grid lines */
  showGrid?: boolean;

  /** Whether to show axes */
  showAxes?: boolean;

  /** Whether to show area fill under lines */
  showAreaFill?: boolean;

  /** Transparency level for area fill (0-1) */
  areaFillOpacity?: number;

  /** Whether to show data points */
  showDataPoints?: boolean;

  /** Radius of data points in pixels */
  dataPointRadius?: number;

  /** Line width in pixels */
  lineWidth?: number;

  /** Whether to animate on initial render */
  animate?: boolean;

  /** Animation duration in milliseconds */
  animationDuration?: number;

  /** Maximum number of points to render before downsampling */
  maxPointsBeforeDownsampling?: number;

  /** Whether to allow zooming and panning */
  interactive?: boolean;

  /** Whether to show axis labels and ticks */
  showAxisLabels?: boolean;

  /** Legend position */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';

  /** Date format function for X-axis if it contains date values */
  formatXAxisDate?: (value: number) => string;
}

interface HoveredPoint {
  data: Record<string, unknown>;
  x: number;
  y: number;
  seriesIndex: number;
}

/**
 * CanvasLineChart is a high-performance line chart using Canvas rendering
 * instead of SVG, optimized for time series with many data points.
 */
export const CanvasLineChart: React.FC<CanvasLineChartProps> = ({
  data,
  xAxisKey,
  yAxisKeys,
  width = '100%',
  height = 400,
  title,
  subtitle,
  xAxisLabel,
  yAxisLabel,
  xDomain,
  yDomain,
  seriesColors,
  showGrid = true,
  showAxes = true,
  showAreaFill = false,
  areaFillOpacity = 0.1,
  showDataPoints = false,
  dataPointRadius = 3,
  lineWidth = 2,
  animate = true,
  animationDuration = 1000,
  maxPointsBeforeDownsampling = 1000,
  interactive = true,
  showAxisLabels = true,
  legendPosition = 'top',
  formatXAxisDate,
  className = '',
  errorMessage,
  onElementClick,
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [animationProgress, setAnimationProgress] = useState(animate ? 0 : 1);
  const [animationFrame, setAnimationFrame] = useState<number | null>(null);
  const [downsampledData, setDownsampledData] = useState<Array<Record<string, unknown>>>(data);

  // Default series colors
  const defaultColors = [
    '#4361ee', // Blue
    '#3a86ff', // Light blue
    '#4cc9f0', // Cyan
    '#4895ef', // Sky blue
    '#560bad', // Purple
    '#7209b7', // Dark purple
    '#f72585', // Pink
    '#b5179e', // Magenta
  ];

  // Use provided colors or defaults
  const colors = useMemo(() => {
    if (seriesColors && seriesColors.length >= yAxisKeys.length) {
      return seriesColors;
    }

    // If not enough colors provided, cycle through defaults
    return yAxisKeys.map((_, i) => defaultColors[i % defaultColors.length]);
  }, [seriesColors, yAxisKeys, defaultColors]);

  // Downsample data if needed for performance
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Sort data by x-axis value
    const sortedData = [...data].sort((a, b) => {
      const aVal = Number(a[xAxisKey] || 0);
      const bVal = Number(b[xAxisKey] || 0);
      return aVal - bVal;
    });

    if (sortedData.length > maxPointsBeforeDownsampling) {
      // Apply LTTB for first series (assume all series have same x values)
      const downsampled = downsampleLTTB(
        sortedData,
        xAxisKey,
        yAxisKeys[0],
        maxPointsBeforeDownsampling
      );
      setDownsampledData(downsampled);
    } else {
      setDownsampledData(sortedData);
    }
  }, [data, xAxisKey, yAxisKeys, maxPointsBeforeDownsampling]);

  // Calculate domains from data if not provided
  const calculatedDomains = useMemo(() => {
    if (!downsampledData || downsampledData.length === 0) {
      return {
        x: [0, 1] as [number, number],
        y: [0, 1] as [number, number],
      };
    }

    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    // Find min/max values for all series
    downsampledData.forEach(item => {
      // X values
      const x = Number(item[xAxisKey] || 0);
      xMin = Math.min(xMin, x);
      xMax = Math.max(xMax, x);

      // Y values for all series
      yAxisKeys.forEach(key => {
        const y = Number(item[key] || 0);
        yMin = Math.min(yMin, y);
        yMax = Math.max(yMax, y);
      });
    });

    // Add padding to Y domain (5%)
    const yRange = yMax - yMin;
    const yPadding = yRange * 0.05;

    return {
      x: [xMin, xMax] as [number, number],
      y: [yMin - yPadding, yMax + yPadding] as [number, number],
    };
  }, [downsampledData, xAxisKey, yAxisKeys]);

  // Use provided domains or fall back to calculated ones
  const domains = {
    x: xDomain || calculatedDomains.x,
    y: yDomain || calculatedDomains.y,
  };

  // Layout measurements
  const layout = useMemo(() => {
    const legendHeight = legendPosition === 'top' || legendPosition === 'bottom' ? 30 : 0;
    const legendWidth = legendPosition === 'left' || legendPosition === 'right' ? 100 : 0;

    return {
      padding: {
        left: 50,
        right: 20,
        top: legendPosition === 'top' ? legendHeight + 10 : 20,
        bottom: legendPosition === 'bottom' ? legendHeight + 40 : 40,
      },
      legendHeight,
      legendWidth,
    };
  }, [legendPosition]);

  // Create scales for mapping data values to pixel coordinates
  const scales = useMemo(() => {
    return {
      x: (value: number) => {
        const canvasWidth = dimensions.width - layout.padding.left - layout.padding.right;
        const normalizedValue = (value - domains.x[0]) / (domains.x[1] - domains.x[0]);
        return layout.padding.left + normalizedValue * canvasWidth * zoom + pan.x;
      },
      y: (value: number) => {
        const canvasHeight = dimensions.height - layout.padding.top - layout.padding.bottom;
        // Note: Y is inverted in canvas coordinates (0 is top)
        const normalizedValue = 1 - (value - domains.y[0]) / (domains.y[1] - domains.y[0]);
        return layout.padding.top + normalizedValue * canvasHeight * zoom + pan.y;
      },
    };
  }, [dimensions, domains, zoom, pan, layout]);

  // Inverse scales for converting canvas coordinates to data values
  const inverseScales = useMemo(() => {
    return {
      x: (pixelX: number) => {
        const canvasWidth = dimensions.width - layout.padding.left - layout.padding.right;
        const normalizedValue = (pixelX - layout.padding.left - pan.x) / (canvasWidth * zoom);
        return domains.x[0] + normalizedValue * (domains.x[1] - domains.x[0]);
      },
      y: (pixelY: number) => {
        const canvasHeight = dimensions.height - layout.padding.top - layout.padding.bottom;
        // Note: Y is inverted in canvas coordinates (0 is top)
        const normalizedValue = 1 - (pixelY - layout.padding.top - pan.y) / (canvasHeight * zoom);
        return domains.y[0] + normalizedValue * (domains.y[1] - domains.y[0]);
      },
    };
  }, [dimensions, domains, zoom, pan, layout]);

  // Update canvas dimensions when container size changes
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    setDimensions({ width, height });

    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
  }, []);

  // Debounced version of updateDimensions
  const debouncedUpdateDimensions = useMemo(
    () => debounce(updateDimensions, 100),
    [updateDimensions]
  );

  // Set up ResizeObserver
  useEffect(() => {
    updateDimensions();

    const observer = new ResizeObserver(debouncedUpdateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', debouncedUpdateDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', debouncedUpdateDimensions);
      debouncedUpdateDimensions.cancel();
    };
  }, [debouncedUpdateDimensions]);

  // Animation effect
  useEffect(() => {
    if (!animate) {
      setAnimationProgress(1);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = animationDuration;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;

      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        const frame = requestAnimationFrame(step);
        setAnimationFrame(frame);
      }
    };

    const frame = requestAnimationFrame(step);
    setAnimationFrame(frame);

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [animate, animationDuration]);

  // Render the chart
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !downsampledData || downsampledData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;

      // X grid lines (10 vertical lines)
      for (let i = 0; i <= 10; i++) {
        const x = domains.x[0] + (i / 10) * (domains.x[1] - domains.x[0]);
        const xPixel = scales.x(x);

        ctx.beginPath();
        ctx.moveTo(xPixel, scales.y(domains.y[0]));
        ctx.lineTo(xPixel, scales.y(domains.y[1]));
        ctx.stroke();
      }

      // Y grid lines (5 horizontal lines)
      for (let i = 0; i <= 5; i++) {
        const y = domains.y[0] + (i / 5) * (domains.y[1] - domains.y[0]);
        const yPixel = scales.y(y);

        ctx.beginPath();
        ctx.moveTo(scales.x(domains.x[0]), yPixel);
        ctx.lineTo(scales.x(domains.x[1]), yPixel);
        ctx.stroke();
      }
    }

    // Draw axes
    if (showAxes) {
      ctx.strokeStyle = theme.palette.mode === 'dark' ? '#fff' : '#000';
      ctx.lineWidth = 2;

      // X-axis
      ctx.beginPath();
      ctx.moveTo(scales.x(domains.x[0]), scales.y(0));
      ctx.lineTo(scales.x(domains.x[1]), scales.y(0));
      ctx.stroke();

      // Y-axis
      ctx.beginPath();
      ctx.moveTo(scales.x(0), scales.y(domains.y[0]));
      ctx.lineTo(scales.x(0), scales.y(domains.y[1]));
      ctx.stroke();
    }

    // Draw axis labels if enabled
    if (showAxisLabels) {
      ctx.fillStyle = theme.palette.mode === 'dark' ? '#fff' : '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';

      // X-axis labels (5 evenly spaced labels)
      for (let i = 0; i <= 5; i++) {
        const x = domains.x[0] + (i / 5) * (domains.x[1] - domains.x[0]);
        const xPixel = scales.x(x);

        let labelText = x.toFixed(1);
        if (formatXAxisDate) {
          labelText = formatXAxisDate(x);
        }

        ctx.fillText(labelText, xPixel, scales.y(domains.y[0]) + 20);
      }

      // Y-axis labels (5 evenly spaced labels)
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const y = domains.y[0] + (i / 5) * (domains.y[1] - domains.y[0]);
        const yPixel = scales.y(y);

        ctx.fillText(y.toFixed(1), scales.x(domains.x[0]) - 10, yPixel + 4);
      }

      // Axis titles
      if (xAxisLabel) {
        ctx.textAlign = 'center';
        ctx.fillText(
          xAxisLabel,
          scales.x(domains.x[0] + (domains.x[1] - domains.x[0]) / 2),
          canvas.height - 10
        );
      }

      if (yAxisLabel) {
        ctx.save();
        ctx.translate(15, scales.y(domains.y[0] + (domains.y[1] - domains.y[0]) / 2));
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(yAxisLabel, 0, 0);
        ctx.restore();
      }
    }

    // Draw legend
    if (legendPosition !== 'none') {
      ctx.font = '12px Arial';

      const legendItems = yAxisKeys.map((key, i) => ({
        label: key,
        color: colors[i],
      }));

      if (legendPosition === 'top') {
        let x = 10;
        const y = 15;

        legendItems.forEach(item => {
          // Draw color box
          ctx.fillStyle = item.color;
          ctx.fillRect(x, y - 9, 12, 9);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.strokeRect(x, y - 9, 12, 9);

          // Draw label
          ctx.fillStyle = theme.palette.mode === 'dark' ? '#fff' : '#000';
          ctx.textAlign = 'left';
          ctx.fillText(item.label, x + 16, y);

          x += ctx.measureText(item.label).width + 30;
        });
      } else if (legendPosition === 'bottom') {
        let x = 10;
        const y = canvas.height - 10;

        legendItems.forEach(item => {
          // Draw color box
          ctx.fillStyle = item.color;
          ctx.fillRect(x, y - 9, 12, 9);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.strokeRect(x, y - 9, 12, 9);

          // Draw label
          ctx.fillStyle = theme.palette.mode === 'dark' ? '#fff' : '#000';
          ctx.textAlign = 'left';
          ctx.fillText(item.label, x + 16, y);

          x += ctx.measureText(item.label).width + 30;
        });
      } else if (legendPosition === 'right') {
        let y = 20;
        const x = canvas.width - 90;

        legendItems.forEach(item => {
          // Draw color box
          ctx.fillStyle = item.color;
          ctx.fillRect(x, y - 9, 12, 9);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.strokeRect(x, y - 9, 12, 9);

          // Draw label
          ctx.fillStyle = theme.palette.mode === 'dark' ? '#fff' : '#000';
          ctx.textAlign = 'left';
          ctx.fillText(item.label, x + 16, y);

          y += 20;
        });
      } else if (legendPosition === 'left') {
        let y = 20;
        const x = 10;

        legendItems.forEach(item => {
          // Draw color box
          ctx.fillStyle = item.color;
          ctx.fillRect(x, y - 9, 12, 9);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.strokeRect(x, y - 9, 12, 9);

          // Draw label
          ctx.fillStyle = theme.palette.mode === 'dark' ? '#fff' : '#000';
          ctx.textAlign = 'left';
          ctx.fillText(item.label, x + 16, y);

          y += 20;
        });
      }
    }

    // For animation, limit the number of points
    const animationPointCount = Math.ceil(downsampledData.length * animationProgress);
    const visibleData = animate ? downsampledData.slice(0, animationPointCount) : downsampledData;

    // Draw each series
    yAxisKeys.forEach((key, seriesIndex) => {
      const color = colors[seriesIndex];
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.fillStyle = color;

      // First draw the area fill if enabled
      if (showAreaFill && visibleData.length > 0) {
        ctx.beginPath();

        // Start at the first point at the bottom of the chart
        const firstX = Number(visibleData[0][xAxisKey] || 0);
        ctx.moveTo(scales.x(firstX), scales.y(domains.y[0]));

        // Draw line up to the first data point
        ctx.lineTo(scales.x(firstX), scales.y(Number(visibleData[0][key] || 0)));

        // Draw the line through all points
        visibleData.forEach(item => {
          const x = Number(item[xAxisKey] || 0);
          const y = Number(item[key] || 0);
          ctx.lineTo(scales.x(x), scales.y(y));
        });

        // Draw line down to the bottom of the chart
        const lastX = Number(visibleData[visibleData.length - 1][xAxisKey] || 0);
        ctx.lineTo(scales.x(lastX), scales.y(domains.y[0]));

        // Fill the path
        ctx.fillStyle = `${color}${Math.round(areaFillOpacity * 255)
          .toString(16)
          .padStart(2, '0')}`;
        ctx.fill();
      }

      // Now draw the line
      ctx.beginPath();

      let isFirstPoint = true;
      visibleData.forEach(item => {
        const x = Number(item[xAxisKey] || 0);
        const y = Number(item[key] || 0);

        if (isFirstPoint) {
          ctx.moveTo(scales.x(x), scales.y(y));
          isFirstPoint = false;
        } else {
          ctx.lineTo(scales.x(x), scales.y(y));
        }
      });

      ctx.stroke();

      // Draw data points if enabled
      if (showDataPoints) {
        visibleData.forEach(item => {
          const x = Number(item[xAxisKey] || 0);
          const y = Number(item[key] || 0);

          ctx.beginPath();
          ctx.arc(scales.x(x), scales.y(y), dataPointRadius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          // Highlight hovered point
          if (
            hoveredPoint &&
            hoveredPoint.data === item &&
            hoveredPoint.seriesIndex === seriesIndex
          ) {
            ctx.strokeStyle = theme.palette.mode === 'dark' ? '#fff' : '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      }
    });
  }, [
    downsampledData,
    domains,
    scales,
    colors,
    theme.palette.mode,
    showGrid,
    showAxes,
    showAxisLabels,
    xAxisLabel,
    yAxisLabel,
    formatXAxisDate,
    legendPosition,
    yAxisKeys,
    animate,
    animationProgress,
    showAreaFill,
    areaFillOpacity,
    lineWidth,
    showDataPoints,
    dataPointRadius,
    hoveredPoint,
  ]);

  // Handle mouse move for point hovering
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!downsampledData || !canvasRef.current || isDragging || !showDataPoints) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let closestPoint: HoveredPoint | null = null;
      let minDistance = Infinity;

      downsampledData.forEach((series, seriesIndex) => {
        const x = scales.x(Number(series[xAxisKey]));
        const y = scales.y(Number(series[yAxisKeys[seriesIndex]]));
        const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));

        if (distance < minDistance && distance < 10) {
          minDistance = distance;
          closestPoint = {
            data: series,
            x,
            y,
            seriesIndex,
          };
        }
      });

      if (closestPoint) {
        setHoveredPoint(closestPoint);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'pointer';
        }
      } else {
        setHoveredPoint(null);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'default';
        }
      }
    },
    [downsampledData, scales, xAxisKey, yAxisKeys, isDragging, showDataPoints]
  );

  // Handle canvas click for point selection
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onElementClick || !hoveredPoint) return;
      onElementClick(hoveredPoint.data, hoveredPoint.seriesIndex);
    },
    [onElementClick, hoveredPoint]
  );

  // Handle mouse down for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive) return;

      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [interactive]
  );

  // Handle mouse up for panning
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle mouse move for panning
  const handleMouseMove2 = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !interactive) return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart, interactive]
  );

  // Handle wheel for zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      if (!interactive) return;

      e.preventDefault();

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom(prev => Math.max(0.1, Math.min(10, prev * zoomFactor)));
    },
    [interactive]
  );

  // Render the visualization
  useEffect(() => {
    renderChart();
  }, [renderChart, dimensions, downsampledData, animationProgress]);

  // If no data, show error
  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 1,
        }}
        className={className}
      >
        <Typography variant="body1" color="text.secondary">
          {errorMessage || 'No data available'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        display: 'flex',
        flexDirection: 'column',
      }}
      className={className}
    >
      {/* Title and subtitle */}
      {(title || subtitle) && (
        <Box sx={{ mb: 1 }}>
          {title && <Typography variant="h6">{title}</Typography>}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      {/* Canvas container */}
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          flex: 1,
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseOut={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Tooltip for hovered point */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              top: hoveredPoint.y - 10,
              left: hoveredPoint.x + 10,
              backgroundColor:
                theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(0,0,0,0.2)',
              borderRadius: 4,
              padding: 8,
              pointerEvents: 'none',
              zIndex: 1000,
              maxWidth: 200,
              fontSize: 12,
            }}
          >
            <div>
              <strong>{xAxisKey}:</strong>{' '}
              {formatXAxisDate
                ? formatXAxisDate(Number(hoveredPoint.data[xAxisKey] || 0))
                : Number(hoveredPoint.data[xAxisKey] || 0).toFixed(2)}
            </div>
            <div>
              <strong>{yAxisKeys[hoveredPoint.seriesIndex]}:</strong>{' '}
              {Number(hoveredPoint.data[yAxisKeys[hoveredPoint.seriesIndex]] || 0).toFixed(2)}
            </div>
          </div>
        )}
      </Box>

      {/* Controls for interactive mode */}
      {interactive && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Scroll to zoom, drag to pan, click to select
          </Typography>
        </Box>
      )}

      {/* Data point count information */}
      {downsampledData.length < data.length && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {downsampledData.length.toLocaleString()} of {data.length.toLocaleString()}{' '}
            points (downsampled)
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CanvasLineChart;

import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { ChartDataRecord } from '../../../../types/exploration/AnalysisComponentTypes';
import { BaseChart, BaseChartProps, DefaultTooltip, getColor } from './BaseChart';

export interface ViewportOptimizedScatterPlotProps extends BaseChartProps {
  /** Key for X-axis values */
  xAxisKey: string;

  /** Key for Y-axis values */
  yAxisKey: string;

  /** Key for Z-axis values (point size) if available */
  zAxisKey?: string;

  /** Key for point color if available */
  colorKey?: string;

  /** Whether to show grid lines */
  showGrid?: boolean;

  /** Point size (or default size if not using zAxis) */
  pointSize?: number;

  /** Maximum number of data points to render before applying optimizations */
  maxPointsBeforeOptimization?: number;

  /** Padding factor for viewport to render slightly more points than visible (prevents edge popping) */
  viewportPadding?: number;

  /** X-axis label */
  xAxisLabel?: string;

  /** Y-axis label */
  yAxisLabel?: string;

  /** Z-axis range [min, max] for point size scaling */
  zAxisRange?: [number, number];
}

/**
 * ViewportOptimizedScatterPlot is a performance-optimized scatter plot component
 * that selectively renders only the points visible in the current viewport.
 * This dramatically improves performance for large datasets.
 */
export const ViewportOptimizedScatterPlot = React.memo(function ViewportOptimizedScatterPlot({
  data,
  xAxisKey,
  yAxisKey,
  zAxisKey,
  colorKey,
  width = '100%',
  height = 400,
  title,
  subtitle,
  colors = [],
  customTooltip,
  theme = 'light',
  showGrid = true,
  pointSize = 60,
  maxPointsBeforeOptimization = 1000,
  viewportPadding = 0.1, // 10% padding
  xAxisLabel,
  yAxisLabel,
  zAxisRange = [10, 60],
  className = '',
  animate = false,
  onElementClick,
  errorMessage,
}: ViewportOptimizedScatterPlotProps) {
  // Keep track of the current viewport domain
  const [viewportDomain, setViewportDomain] = useState<{
    x: [number, number];
    y: [number, number];
  } | null>(null);

  // Reference to the chart element for getting dimensions
  const chartRef = useRef<any>(null);

  // Track whether initial data processing has finished
  const [dataProcessed, setDataProcessed] = useState(false);

  // Track data boundaries for all data
  const dataBounds = useMemo(() => {
    if (!data || data.length === 0) return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };

    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    data.forEach(point => {
      const x = Number(point[xAxisKey] || 0);
      const y = Number(point[yAxisKey] || 0);

      xMin = Math.min(xMin, x);
      xMax = Math.max(xMax, x);
      yMin = Math.min(yMin, y);
      yMax = Math.max(yMax, y);
    });

    return {
      xMin: isFinite(xMin) ? xMin : 0,
      xMax: isFinite(xMax) ? xMax : 0,
      yMin: isFinite(yMin) ? yMin : 0,
      yMax: isFinite(yMax) ? yMax : 0,
    };
  }, [data, xAxisKey, yAxisKey]);

  // Initialize viewport to full data bounds
  useEffect(() => {
    if (!viewportDomain && dataBounds) {
      const xRange = dataBounds.xMax - dataBounds.xMin;
      const yRange = dataBounds.yMax - dataBounds.yMin;

      // Add a small buffer around the data
      setViewportDomain({
        x: [dataBounds.xMin - xRange * 0.05, dataBounds.xMax + xRange * 0.05],
        y: [dataBounds.yMin - yRange * 0.05, dataBounds.yMax + yRange * 0.05],
      });

      setDataProcessed(true);
    }
  }, [dataBounds, viewportDomain]);

  // Filter data to show only points in the current viewport (plus padding)
  const visibleData = useMemo(() => {
    if (!viewportDomain || !dataProcessed || data.length <= maxPointsBeforeOptimization) {
      return data; // Show all data if it's a small dataset or viewport not yet set
    }

    // Calculate the extended viewport with padding
    const xRange = viewportDomain.x[1] - viewportDomain.x[0];
    const yRange = viewportDomain.y[1] - viewportDomain.y[0];

    const extendedViewport = {
      xMin: viewportDomain.x[0] - xRange * viewportPadding,
      xMax: viewportDomain.x[1] + xRange * viewportPadding,
      yMin: viewportDomain.y[0] - yRange * viewportPadding,
      yMax: viewportDomain.y[1] + yRange * viewportPadding,
    };

    // Filter data to only include points in the extended viewport
    return data.filter(point => {
      const x = Number(point[xAxisKey] || 0);
      const y = Number(point[yAxisKey] || 0);

      return (
        x >= extendedViewport.xMin &&
        x <= extendedViewport.xMax &&
        y >= extendedViewport.yMin &&
        y <= extendedViewport.yMax
      );
    });
  }, [
    data,
    viewportDomain,
    dataProcessed,
    maxPointsBeforeOptimization,
    viewportPadding,
    xAxisKey,
    yAxisKey,
  ]);

  // Track number of points currently being rendered
  const pointCount = visibleData.length;
  const totalPoints = data.length;
  const isOptimized = totalPoints > maxPointsBeforeOptimization;

  // Handle viewport changes from user interactions (pan/zoom)
  const handleViewportChange = useCallback(
    (domain: { x: [number, number]; y: [number, number] }) => {
      setViewportDomain(domain);
    },
    []
  );

  // Create a debounced version of the handler to avoid frequent updates
  const debouncedViewportChange = useCallback(debounce(handleViewportChange, 100), [
    handleViewportChange,
  ]);

  // Optimization metrics for subtitle
  const optimizationMetrics = useMemo(() => {
    if (!isOptimized || !dataProcessed) return null;

    return `Rendering ${pointCount.toLocaleString()} of ${totalPoints.toLocaleString()} points (${Math.round(
      (pointCount / totalPoints) * 100
    )}%)`;
  }, [pointCount, totalPoints, isOptimized, dataProcessed]);

  // If no data, show error
  if (!data || data.length === 0) {
    return (
      <BaseChart
        width={width}
        height={height}
        title={title}
        subtitle={subtitle}
        theme={theme}
        className={className}
        errorMessage={errorMessage || 'No data available'}
      >
        <ScatterChart />
      </BaseChart>
    );
  }

  // Handle point click
  const handlePointClick = (point: ChartDataRecord) => {
    if (onElementClick) {
      onElementClick(point, 0);
    }
  };

  // Dynamic subtitle based on optimization status
  const displaySubtitle = optimizationMetrics
    ? subtitle
      ? `${subtitle} - ${optimizationMetrics}`
      : optimizationMetrics
    : subtitle;

  // Extract color values if color key is provided
  const colorAccessor = useCallback(
    (point: ChartDataRecord, index: number) => {
      if (colorKey && point[colorKey] !== undefined) {
        // Map the color value to the color scale
        const colorValue = Number(point[colorKey]);
        // Normalize to 0-1 range for color mapping
        const normalizedValue =
          (colorValue - dataBounds.yMin) / (dataBounds.yMax - dataBounds.yMin);
        // Get color index based on the normalized value
        const colorIndex = Math.floor(normalizedValue * (colors.length - 1));
        return getColor(colorIndex, colors);
      }
      // Default color based on index
      return getColor(index % colors.length, colors);
    },
    [colorKey, colors, dataBounds]
  );

  // Create chart content
  const chartContent = (
    <ResponsiveContainer width="100%" height="100%" ref={chartRef}>
      <ScatterChart
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        onMouseUp={e => {
          if (e && e.xAxis && e.yAxis && e.xAxis[0] && e.yAxis[0]) {
            const domain = {
              x: e.xAxis[0].domain as [number, number],
              y: e.yAxis[0].domain as [number, number],
            };
            debouncedViewportChange(domain);
          }
        }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}

        <XAxis
          type="number"
          dataKey={xAxisKey}
          name={xAxisLabel || xAxisKey}
          label={
            xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined
          }
          domain={viewportDomain ? viewportDomain.x : ['auto', 'auto']}
        />

        <YAxis
          type="number"
          dataKey={yAxisKey}
          name={yAxisLabel || yAxisKey}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          domain={viewportDomain ? viewportDomain.y : ['auto', 'auto']}
        />

        {zAxisKey && <ZAxis type="number" dataKey={zAxisKey} range={zAxisRange} />}

        <Tooltip content={customTooltip || <DefaultTooltip />} />

        <Legend />

        <Scatter
          name={`${xAxisLabel || xAxisKey} vs ${yAxisLabel || yAxisKey}`}
          data={visibleData}
          fill={colors[0]}
          shape="circle"
          onClick={handlePointClick}
          isAnimationActive={animate && visibleData.length < 500}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );

  return (
    <BaseChart
      width={width}
      height={height}
      title={title}
      subtitle={displaySubtitle}
      theme={theme}
      className={className}
      errorMessage={errorMessage}
    >
      {chartContent}
    </BaseChart>
  );
});

export default ViewportOptimizedScatterPlot;

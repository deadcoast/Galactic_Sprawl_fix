import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
    CartesianGrid,
    LabelProps,
    Legend,
    Line,
    LineChart as RechartsLineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {
    ChartDataRecord,
    VisualizationValue
} from '../../../types/exploration/AnalysisComponentTypes';
import {
    BaseChart,
    BaseChartProps,
    DefaultTooltip,
    formatAxisTick,
    getColor,
    ReferenceLine as ReferenceLineType
} from './BaseChart';

// Define the dot click event interface
interface DotClickEvent {
  payload: Record<string, unknown>;
  index?: number;
  dataKey?: string;
  cx?: number;
  cy?: number;
  r?: number;
  [key: string]: unknown;
}

// Type for visualization records
type VisualizationRecord = Record<string, VisualizationValue>;

export interface VirtualizedLineChartProps extends BaseChartProps {
  /** Key for X-axis values */
  xAxisKey: string;

  /** Keys for Y-axis values (multiple series) */
  yAxisKeys: string[];

  /** Whether to apply date formatting to x-axis values */
  dateFormat?: boolean;

  /** Whether to connect null data points */
  connectNulls?: boolean;

  /** Curve type for the lines */
  curveType?: 'linear' | 'monotone' | 'step' | 'stepAfter' | 'stepBefore' | 'natural';

  /** Whether to show grid lines */
  showGrid?: boolean;

  /** Whether to fill area under lines */
  fillArea?: boolean;

  /** Stroke width for the lines */
  strokeWidth?: number;

  /** X-axis label */
  xAxisLabel?: string;

  /** Y-axis label */
  yAxisLabel?: string;

  /** Whether to show dots on data points */
  showDots?: boolean;

  /** Whether to show the legend */
  showLegend?: boolean;

  /** Reference lines to display (e.g., thresholds) */
  referenceLines?: ReferenceLineType[];

  /** Maximum number of data points to render before downsampling */
  maxDisplayedPoints?: number;

  /** Enables progressive loading of points as user zooms in */
  enableProgressiveLoading?: boolean;

  /** Subtitle to display additional information */
  subtitle?: string;
}

/**
 * A specialized line chart component that handles extremely large datasets efficiently
 * through downsampling, virtualization, and progressive loading.
 */
export const VirtualizedLineChart = React.memo(function VirtualizedLineChart({
  data,
  xAxisKey,
  yAxisKeys,
  width = '100%',
  height = 400,
  title,
  colors = [],
  dateFormat = false,
  customTooltip,
  theme = 'light',
  connectNulls = true,
  curveType = 'monotone',
  showGrid = true,
  fillArea = false,
  strokeWidth = 2,
  xAxisLabel,
  yAxisLabel,
  showDots = true,
  showLegend = true,
  referenceLines = [],
  className = '',
  animate = false, // Default to false for large datasets
  onElementClick,
  errorMessage,
  maxDisplayedPoints = 1000,
  enableProgressiveLoading = true,
  subtitle,
}: VirtualizedLineChartProps) {
  // State for tracking visible domain (for zooming/panning)
  const [visibleDomain, setVisibleDomain] = useState<{
    x?: [number, number];
    y?: [number, number];
  }>({});

  // State for tracking the detail level based on zoom
  const [detailLevel, setDetailLevel] = useState<number>(1); // 1 = most downsampled

  // Format the processed data for chart rendering
  const formatDataForRendering = useCallback(
    (processedData: ChartDataRecord[]) => {
      return processedData.map(item => {
        // Use a type that matches ChartDataRecord's index signature
        const result = {
          [xAxisKey]: item[xAxisKey],
        } as Record<string, VisualizationValue>;

        if (dateFormat && typeof item[xAxisKey] === 'number') {
          result.formattedDate = new Date(item[xAxisKey] as number).toLocaleDateString();
        }

        // Extract all y-axis values
        yAxisKeys.forEach(key => {
          if (
            typeof item[key] === 'number' ||
            typeof item[key] === 'string' ||
            typeof item[key] === 'boolean' ||
            item[key] === null ||
            item[key] === undefined
          ) {
            result[key] = item[key] as VisualizationValue;
          }
        });

        return result;
      });
    },
    [xAxisKey, yAxisKeys, dateFormat]
  );

  // Process data for visualization
  const processedData = useMemo(() => {
    if (!data || data?.length === 0) {
      return [];
    }

    // Convert data to the expected format
    const processedData = data?.map(item => {
      // Create a new object with the required structure
      const record: ChartDataRecord = {};

      // Copy all properties from the original item
      Object.entries(item).forEach(([key, value]) => {
        // Only copy properties that match the VisualizationValue type
        if (
          typeof value === 'number' ||
          typeof value === 'string' ||
          typeof value === 'boolean' ||
          value === null ||
          value === undefined
        ) {
          record[key] = value;
        }
      });

      return record;
    });

    // Calculate how many points to display based on available space
    const downsampleFactor = Math.ceil(processedData.length / maxDisplayedPoints);

    // No downsampling needed
    if (downsampleFactor === 1) {
      return formatDataForRendering(processedData);
    }

    // Apply intelligent downsampling (LTTB algorithm - Largest Triangle Three Buckets)
    // This preserves visual characteristics better than simple downsampling
    return downsampleLTTB(processedData, xAxisKey, yAxisKeys[0], maxDisplayedPoints);
  }, [
    data,
    xAxisKey,
    yAxisKeys,
    visibleDomain,
    detailLevel,
    maxDisplayedPoints,
    enableProgressiveLoading,
    formatDataForRendering,
  ]);

  // Largest Triangle Three Buckets (LTTB) downsampling algorithm
  const downsampleLTTB = useCallback(
    (
      data: ChartDataRecord[],
      xKey: string,
      yKey: string,
      targetPoints: number
    ): VisualizationRecord[] => {
      const dataLength = data?.length;
      if (dataLength <= targetPoints) {
        return formatDataForRendering(data);
      }

      // Always include first and last points
      const sampled: ChartDataRecord[] = [data[0]];

      // The LTTB algorithm preserves visual characteristics by keeping points that would create the largest triangles
      const bucketSize = (dataLength - 2) / (targetPoints - 2);

      let a = 0;
      for (let i = 0; i < targetPoints - 2; i++) {
        const nextA = Math.floor((i + 1) * bucketSize) + 1;
        let avgX = 0;
        let avgY = 0;
        const bucketCount = Math.max(1, nextA - Math.floor(a + bucketSize));

        // Calculate the average of points in the next bucket
        for (let j = Math.floor(a + bucketSize); j < nextA; j++) {
          const pointIdx = Math.min(j, dataLength - 1);
          // Make sure we always treat these as numbers
          const x = Number(data[pointIdx][xKey] ?? 0);
          const y = Number(data[pointIdx][yKey] ?? 0);
          avgX += x / bucketCount;
          avgY += y / bucketCount;
        }

        // Calculate area of triangles and find max area point
        let maxArea = -1;
        let maxAreaIndex = 0;

        // Use the current point (a) and the average of points in the next bucket
        // to find the point in the current bucket that creates the largest triangle
        for (let j = Math.floor(a + 1); j < nextA; j++) {
          const pointIdx = Math.min(j, dataLength - 1);

          // Get x,y coords from data
          const x = Number(data[pointIdx][xKey] ?? 0);
          const y = Number(data[pointIdx][yKey] ?? 0);

          // aPoint = previous selected point
          const aX = Number(data[a][xKey] ?? 0);
          const aY = Number(data[a][yKey] ?? 0);

          // Calculate triangle area (using cross product)
          const area = Math.abs((aX - avgX) * (y - aY) - (aX - x) * (avgY - aY));

          if (area > maxArea) {
            maxArea = area;
            maxAreaIndex = pointIdx;
          }
        }

        // Add the point with max area
        sampled.push(data[maxAreaIndex]);
        a = maxAreaIndex; // This becomes the new 'a' point
      }

      // Always include the last point
      sampled.push(data[dataLength - 1]);

      return formatDataForRendering(sampled);
    },
    [formatDataForRendering]
  );

  // Handle zoom events
  const handleZoom = useCallback(
    (domain: { x?: [number, number]; y?: [number, number] }) => {
      setVisibleDomain(domain);

      // Adjust detail level based on zoom level
      if (enableProgressiveLoading && domain.x) {
        const [min, max] = domain.x;
        const visibleRange = max - min;
        const totalRange =
          data?.length > 0
            ? (data[data?.length - 1][xAxisKey] as number) - (data[0][xAxisKey] as number)
            : 1;

        // Calculate detail level based on zoom (1-10)
        const zoomRatio = totalRange / visibleRange;
        const newDetailLevel = Math.min(10, Math.max(1, Math.ceil(zoomRatio)));

        setDetailLevel(newDetailLevel);
      }
    },
    [data, xAxisKey, enableProgressiveLoading]
  );

  // If no data, show error
  if (!data || data?.length === 0) {
    return (
      <BaseChart
        width={width}
        height={height}
        title={title}
        theme={theme}
        className={className}
        errorMessage={errorMessage ?? 'No data available'}
        subtitle={subtitle}
      >
        <RechartsLineChart data={[]} />
      </BaseChart>
    );
  }

  // Handle chart click
  const handleChartClick = (chartData: Record<string, unknown> | undefined, index: number) => {
    if (onElementClick && chartData) {
      onElementClick(chartData, index);
    }
  };

  // Handle dot click event
  const handleDotClick = (event: DotClickEvent, index: number) => {
    if (onElementClick && event.payload) {
      onElementClick(event.payload, index);
    }
  };

  // Create the chart content
  const chartContent = (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={processedData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        onClick={chartData =>
          chartData && handleChartClick(chartData as Record<string, unknown>, 0)
        }
        onMouseUp={e => {
          // The recharts library doesn't export proper types for chart events
          const event = e as unknown as {
            xAxis?: { domain: [number, number] }[];
            yAxis?: { domain: [number, number] }[];
          };

          // Use optional chaining to safely access nested domains
          const xDomain = event?.xAxis?.[0]?.domain;
          const yDomain = event?.yAxis?.[0]?.domain;

          // Check if both domains were successfully retrieved
          if (xDomain && yDomain) {
            const domain = { x: xDomain, y: yDomain };
            handleZoom(domain);
          }
        }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#ddd'} />}

        <XAxis
          dataKey={dateFormat && xAxisKey === 'date' ? 'formattedDate' : xAxisKey}
          tickFormatter={value => {
            if (typeof value === 'string' || typeof value === 'number') {
              return formatAxisTick(value, dateFormat);
            }
            return ''; // Fallback for unexpected types
          }}
          label={
            xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined
          }
          domain={visibleDomain.x ?? ['dataMin', 'dataMax']}
        />

        <YAxis
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          domain={visibleDomain.y ?? ['auto', 'auto']}
        />

        <Tooltip content={customTooltip ?? <DefaultTooltip />} />

        {showLegend && <Legend />}

        {/* Reference lines for thresholds or important values */}
        {referenceLines.map((line, i) => (
          <ReferenceLine
            key={`ref-line-${i}`}
            x={line.axis === 'x' ? line.value : undefined}
            y={line.axis === 'y' ? line.value : undefined}
            stroke={line.color ?? '#ff7300'}
            label={
              line.label
                ? ({
                    value: line.label,
                    position: line.position ?? 'center',
                  } as LabelProps)
                : undefined
            }
          />
        ))}

        {/* Render each data series as a line */}
        {yAxisKeys.map((key, index) => (
          <Line
            key={key}
            type={curveType}
            dataKey={key}
            stroke={getColor(index, colors)}
            activeDot={
              showDots
                ? {
                    r: 6,
                    onClick: (e: DotClickEvent) => handleDotClick(e, index),
                  }
                : false
            }
            dot={showDots && processedData.length < 100} // Only show dots if we have a reasonable number of points
            strokeWidth={strokeWidth}
            connectNulls={connectNulls}
            name={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            fill={fillArea ? getColor(index, colors) + '33' : undefined} // Add transparency for fill
            fillOpacity={fillArea ? 0.2 : 0}
            isAnimationActive={animate && processedData.length < 100} // Only animate if we have a small dataset
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );

  // Add info about downsampling if applicable
  const displaySubtitle =
    processedData.length < data?.length
      ? `Showing ${processedData.length} of ${data?.length} points (downsampled for performance)`
      : subtitle;

  return (
    <BaseChart
      width={width}
      height={height}
      title={title}
      theme={theme}
      className={`virtualized-line-chart ${className}`}
      errorMessage={errorMessage}
      subtitle={displaySubtitle}
    >
      {chartContent}
    </BaseChart>
  );
});

export default VirtualizedLineChart;

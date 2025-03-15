import * as React from "react";
import { useMemo } from 'react';
import {
  CartesianGrid,
  LabelProps,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BaseChart,
  BaseChartProps,
  DefaultTooltip,
  formatAxisTick,
  getColor,
  processChartData,
  ReferenceLine as ReferenceLineType,
} from './BaseChart';

// Define allowed positions for reference line labels
type ReferenceLinePosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'insideTop'
  | 'insideBottom'
  | 'insideLeft'
  | 'insideRight'
  | 'insideTopRight'
  | 'insideTopLeft'
  | 'insideBottomRight'
  | 'insideBottomLeft'
  | 'center';

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

export interface LineChartProps extends BaseChartProps {
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
}

/**
 * LineChart component for visualizing time series or other xy data
 */
export function LineChart({
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
  animate = true,
  onElementClick,
  errorMessage,
}: LineChartProps) {
  // Process data for the chart
  const processedData = useMemo(
    () => processChartData(data, xAxisKey, yAxisKeys, dateFormat),
    [data, xAxisKey, yAxisKeys, dateFormat]
  );

  // If no data, show error
  if (!data || data.length === 0) {
    return (
      <BaseChart
        width={width}
        height={height}
        title={title}
        theme={theme}
        className={className}
        errorMessage={errorMessage || 'No data available'}
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
    if (onElementClick && event && event.payload) {
      onElementClick(event.payload, index);
    }
  };

  // Create the chart content
  const chartContent = (
    <RechartsLineChart
      data={processedData}
      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      onClick={chartData => chartData && handleChartClick(chartData as Record<string, unknown>, 0)}
    >
      {showGrid && <CartesianGrid strokeDasharray="3 3" />}

      <XAxis
        dataKey={dateFormat && xAxisKey === 'date' ? 'formattedDate' : xAxisKey}
        tickFormatter={value => formatAxisTick(value, dateFormat)}
        label={
          xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined
        }
      />

      <YAxis
        label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
      />

      <Tooltip content={customTooltip || <DefaultTooltip />} />

      {showLegend && <Legend />}

      {/* Reference lines for thresholds or important values */}
      {referenceLines.map((line, i) => (
        <ReferenceLine
          key={`ref-line-${i}`}
          x={line.axis === 'x' ? line.value : undefined}
          y={line.axis === 'y' ? line.value : undefined}
          stroke={line.color || '#ff7300'}
          label={
            line.label
              ? ({
                  value: line.label,
                  position: line.position || 'center',
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
          dot={showDots}
          strokeWidth={strokeWidth}
          connectNulls={connectNulls}
          name={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
          fill={fillArea ? getColor(index, colors) + '33' : undefined} // Add transparency for fill
          fillOpacity={fillArea ? 0.2 : 0}
          isAnimationActive={animate}
        />
      ))}
    </RechartsLineChart>
  );

  return (
    <BaseChart
      width={width}
      height={height}
      title={title}
      theme={theme}
      className={className}
      errorMessage={errorMessage}
    >
      {chartContent}
    </BaseChart>
  );
}

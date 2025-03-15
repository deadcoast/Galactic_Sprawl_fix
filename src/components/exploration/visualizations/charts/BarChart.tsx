import * as React from "react";
import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  LabelList,
  LabelProps,
  Legend,
  BarChart as RechartsBarChart,
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

// Define the click event interface
interface BarClickEvent {
  payload: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BarChartProps extends BaseChartProps {
  /** Key for X-axis values */
  xAxisKey: string;

  /** Keys for Y-axis values */
  yAxisKeys: string[];

  /** Whether to stack the bars */
  stacked?: boolean;

  /** Whether to show grid lines */
  showGrid?: boolean;

  /** Whether to show the legend */
  showLegend?: boolean;

  /** Bar width in pixels (auto by default) */
  barSize?: number;

  /** Gap between bar groups (as percentage) */
  barGap?: number;

  /** X-axis label */
  xAxisLabel?: string;

  /** Y-axis label */
  yAxisLabel?: string;

  /** X-axis tick angle to prevent overlapping (e.g., -45) */
  xAxisTickAngle?: number;

  /** Whether to show values on the bars */
  showValues?: boolean;

  /** Layout direction ('vertical' or 'horizontal') */
  layout?: 'vertical' | 'horizontal';

  /** Whether to display the x-axis at the top (default: bottom) */
  xAxisAtTop?: boolean;

  /** Reference lines to display (e.g., thresholds) */
  referenceLines?: ReferenceLineType[];
}

/**
 * BarChart component for visualizing categorical data
 */
export function BarChart({
  data,
  xAxisKey,
  yAxisKeys,
  width = '100%',
  height = 400,
  title,
  colors = [],
  stacked = false,
  customTooltip,
  theme = 'light',
  showGrid = true,
  showLegend = true,
  barSize,
  barGap,
  xAxisLabel,
  yAxisLabel,
  xAxisTickAngle = -45,
  showValues = false,
  layout = 'vertical',
  xAxisAtTop = false,
  referenceLines = [],
  className = '',
  animate = true,
  onElementClick,
  errorMessage,
}: BarChartProps) {
  // Process data for the chart
  const processedData = useMemo(
    () => processChartData(data, xAxisKey, yAxisKeys, false),
    [data, xAxisKey, yAxisKeys]
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
        <RechartsBarChart data={[]} />
      </BaseChart>
    );
  }

  // Handle click events
  const handleBarClick = (event: BarClickEvent, index: number) => {
    if (onElementClick && event && event.payload) {
      onElementClick(event.payload, index);
    }
  };

  // Set up layout props for horizontal/vertical layout
  const layoutProps =
    layout === 'horizontal'
      ? {
          layout: 'horizontal' as const,
          xAxis: (
            <XAxis
              type="number"
              label={
                xAxisLabel
                  ? { value: xAxisLabel, position: 'insideBottom', offset: -10 }
                  : undefined
              }
            />
          ),
          yAxis: (
            <YAxis
              type="category"
              dataKey={xAxisKey}
              label={
                yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined
              }
            />
          ),
        }
      : {
          layout: 'vertical' as const,
          xAxis: (
            <XAxis
              type="category"
              dataKey={xAxisKey}
              tickFormatter={value => formatAxisTick(value, false)}
              angle={xAxisTickAngle}
              textAnchor="end"
              height={70}
              orientation={xAxisAtTop ? 'top' : 'bottom'}
              label={
                xAxisLabel
                  ? { value: xAxisLabel, position: 'insideBottom', offset: -10 }
                  : undefined
              }
            />
          ),
          yAxis: (
            <YAxis
              type="number"
              label={
                yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined
              }
            />
          ),
        };

  // Create the chart content
  const chartContent = (
    <RechartsBarChart
      data={processedData}
      margin={{
        top: 20,
        right: 30,
        left: 20,
        bottom: layout === 'vertical' && xAxisTickAngle !== 0 ? 70 : 20,
      }}
      layout={layoutProps.layout}
      barGap={barGap}
      onClick={chartData => chartData && handleBarClick(chartData as BarClickEvent, 0)}
    >
      {showGrid && <CartesianGrid strokeDasharray="3 3" />}

      {layoutProps.xAxis}
      {layoutProps.yAxis}

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

      {/* Render each data series as a bar */}
      {yAxisKeys.map((key, index) => (
        <Bar
          key={key}
          dataKey={key}
          fill={getColor(index, colors)}
          stackId={stacked ? 'stack' : undefined}
          name={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
          onClick={(e: BarClickEvent) => handleBarClick(e, index)}
          barSize={barSize}
          isAnimationActive={animate}
        >
          {showValues && (
            <LabelList
              dataKey={key}
              position={layout === 'horizontal' ? 'right' : 'top'}
              formatter={(value: number) => value.toLocaleString()}
            />
          )}
        </Bar>
      ))}
    </RechartsBarChart>
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

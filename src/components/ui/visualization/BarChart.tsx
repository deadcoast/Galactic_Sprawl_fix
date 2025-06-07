/**
 * @context: ui-system, component-library, visualization-system
 *
 * BarChart component for rendering bar charts
 */
import { useMemo } from 'react';
import { Chart, ChartProps, DataPoint } from './Chart';

export interface BarChartProps extends Omit<ChartProps, 'type'> {
  /**
   * Bar orientation
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal';

  /**
   * Whether to stack bars from multiple datasets
   * @default false
   */
  stacked?: boolean;

  /**
   * Whether to group bars from multiple datasets
   * @default true
   */
  grouped?: boolean;

  /**
   * Bar border width in pixels
   * @default 0
   */
  barBorderWidth?: number;

  /**
   * Bar border color
   * @default 'transparent'
   */
  barBorderColor?: string;

  /**
   * Space between bar groups as a percentage of bar width
   * @default 0.2
   */
  barSpacing?: number;

  /**
   * Whether to show value labels on bars
   * @default false
   */
  showValueLabels?: boolean;

  /**
   * Value label position
   * @default 'inside'
   */
  valueLabelPosition?: 'inside' | 'outside' | 'auto';
}

/**
 * BarChart component for rendering comparative data as bars
 */
export function BarChart({
  orientation = 'vertical',
  stacked = false,
  grouped = true,
  barBorderWidth = 0,
  barBorderColor = 'transparent',
  barSpacing = 0.2,
  showValueLabels = false,
  valueLabelPosition = 'inside',
  ...chartProps
}: BarChartProps) {
  // Process data for display
  const processedData = useMemo(() => {
    if (!chartProps.data) return chartProps.data;

    return {
      ...chartProps.data,
      datasets: chartProps.data.datasets.map(dataset => ({
        ...dataset,
        // Add bar-specific metadata
        _barConfig: {
          orientation,
          stacked,
          grouped,
          barBorderWidth,
          barBorderColor,
          barSpacing,
          showValueLabels,
          valueLabelPosition,
        },
      })),
    };
  }, [
    chartProps.data,
    orientation,
    stacked,
    grouped,
    barBorderWidth,
    barBorderColor,
    barSpacing,
    showValueLabels,
    valueLabelPosition,
  ]);

  return (
    <Chart
      {...chartProps}
      data={processedData}
      type="bar"
      className={`bar-chart ${orientation} ${chartProps.className || ''}`}
      showGrid
    />
  );
}

/**
 * Helper to create categorical data for BarChart
 */
export function createCategoryData(
  values: number[],
  categories: string[],
  datasetLabel = 'Categories',
  color?: string
): ChartProps['data'] {
  const data: DataPoint[] = values.map((value, index) => ({
    label: categories[index] || `Category ${index + 1}`,
    value,
  }));

  return {
    datasets: [
      {
        label: datasetLabel,
        data,
        color,
      },
    ],
  };
}

/**
 * Helper to create comparison data for BarChart
 */
export function createComparisonData(
  datasets: {
    label: string;
    values: number[];
    color?: string;
  }[],
  categories: string[]
): ChartProps['data'] {
  return {
    datasets: datasets.map(dataset => ({
      label: dataset.label,
      color: dataset.color,
      data: dataset.values.map((value, index) => ({
        label: categories[index] || `Category ${index + 1}`,
        value,
      })),
    })),
  };
}

/**
 * @context: ui-system, component-library, visualization-system
 * 
 * LineGraph component for rendering line charts
 */
import * as React from 'react';
import { useMemo } from 'react';
import { Chart, ChartProps, DataPoint } from './Chart';

export interface LineGraphProps extends Omit<ChartProps, 'type'> {
  /**
   * Whether to show data points
   * @default true
   */
  showPoints?: boolean;
  
  /**
   * Whether to fill the area below the line
   * @default false
   */
  fillArea?: boolean;
  
  /**
   * Curve type for the line
   * @default 'linear'
   */
  curveType?: 'linear' | 'smooth';
  
  /**
   * Line width in pixels
   * @default 2
   */
  lineWidth?: number;
  
  /**
   * Point radius in pixels
   * @default 4
   */
  pointRadius?: number;
  
  /**
   * Whether to show value labels above data points
   * @default false
   */
  showValueLabels?: boolean;
}

/**
 * LineGraph component for rendering time series and other linear data
 */
export function LineGraph({
  showPoints = true,
  fillArea = false,
  curveType = 'linear',
  lineWidth = 2,
  pointRadius = 4,
  showValueLabels = false,
  ...chartProps
}: LineGraphProps) {
  // Process data for display
  const processedData = useMemo(() => {
    if (!chartProps.data) return chartProps.data;
    
    // Apply any line-specific data transformations here if needed
    return {
      ...chartProps.data,
      datasets: chartProps.data.datasets.map(dataset => ({
        ...dataset,
        // Add line-specific metadata
        _lineConfig: {
          showPoints,
          fillArea,
          curveType,
          lineWidth,
          pointRadius,
          showValueLabels
        }
      }))
    };
  }, [chartProps.data, showPoints, fillArea, curveType, lineWidth, pointRadius, showValueLabels]);
  
  return (
    <Chart
      {...chartProps}
      data={processedData}
      type={fillArea ? 'area' : 'line'}
      className={`line-graph ${chartProps.className || ''}`}
      showGrid
    />
  );
}

/**
 * Helper to create time series data for LineGraph
 */
export function createTimeSeriesData(
  values: number[], 
  timeLabels: string[],
  datasetLabel: string = 'Time Series',
  color?: string
): ChartProps['data'] {
  const data: DataPoint[] = values.map((value, index) => ({
    label: timeLabels[index] || `Point ${index + 1}`,
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
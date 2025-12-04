/**
 * Chart Components
 *
 * This module exports a collection of chart components for data visualization.
 * All components are built on top of the BaseChart component which provides
 * common functionality like theming, error handling, and loading states.
 */

// Export chart components
export { BarChart } from './BarChart';
export { HeatMap } from './HeatMap';
export { LineChart } from './LineChart';
export { ScatterPlot } from './ScatterPlot';

// Export base chart and utilities
export { BaseChart, DefaultTooltip, formatAxisTick, getColor, processChartData } from './BaseChart';

// Export types
export type {
  BaseChartProps,
  ChartTooltipProps,
  ReferenceLine,
  ReferenceLinePosition,
} from './BaseChart';

export type { HeatMapCell } from './HeatMap';

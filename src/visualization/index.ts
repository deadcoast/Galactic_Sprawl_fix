export { Chart } from './Chart';
export type {
  ChartProps,
  ChartData,
  ChartDataPoint,
  ChartOptions,
  ChartType,
  ChartAxes,
  ChartLegend,
  ChartTooltip,
  ChartAnimation,
  ChartRenderer
} from './Chart';

/**
 * Chart Visualization System
 * 
 * This module provides a flexible chart visualization system with multiple rendering strategies.
 * It automatically selects the most appropriate rendering method based on the data size and device capabilities.
 * 
 * Features:
 * - Strategy pattern for different rendering methods (Canvas, SVG, WebGL)
 * - Support for various chart types (line, bar, scatter, area, pie, radar, heatmap)
 * - Automatic performance optimization for large datasets
 * - Consistent API across rendering methods
 * - Support for theming, animations, and interactive tooltips
 * 
 * @example
 * ```tsx
 * import { Chart } from './visualization';
 * 
 * function LineChartExample() {
 *   const data = {
 *     datasets: [
 *       {
 *         label: 'Dataset 1',
 *         data: [
 *           { x: 1, y: 10 },
 *           { x: 2, y: 15 },
 *           { x: 3, y: 8 },
 *         ],
 *         color: '#4e79a7'
 *       }
 *     ]
 *   };
 *   
 *   const options = {
 *     axes: {
 *       x: { label: 'X Axis', grid: true },
 *       y: { label: 'Y Axis', grid: true }
 *     },
 *     legend: { visible: true, position: 'top' }
 *   };
 *   
 *   return <Chart data={data} options={options} type="line" />;
 * }
 * ```
 */
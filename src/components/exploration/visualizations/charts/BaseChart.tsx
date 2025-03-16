import * as React from 'react';
import { ReactElement } from 'react';
import { ResponsiveContainer, TooltipProps } from 'recharts';
import { DataPoint } from '../../../../types/exploration/DataAnalysisTypes';

/**
 * Common types for chart components
 */

// Type for Recharts TooltipProps
export type ChartTooltipProps = TooltipProps<number | string, string>;

// Define allowed positions for reference line labels
export type ReferenceLinePosition =
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

// Define common reference line type
export interface ReferenceLine {
  value: number;
  label?: string;
  color?: string;
  position?: ReferenceLinePosition;
  axis: 'x' | 'y';
}

/**
 * Base interface for all chart properties
 */
export interface BaseChartProps {
  /**
   * Data to visualize - supports both DataPoint objects and regular records
   */
  data: DataPoint[] | Record<string, unknown>[];

  /**
   * Width of the chart - can be a number (pixels) or string (e.g., '100%')
   */
  width?: number | string;

  /**
   * Height of the chart in pixels
   */
  height?: number | string;

  /**
   * Title displayed above the chart
   */
  title?: string;

  /**
   * Subtitle displayed below the title
   */
  subtitle?: string;

  /**
   * Colors to use for the chart elements
   */
  colors?: string[];

  /**
   * Custom tooltip component to override the default tooltip
   */
  customTooltip?: React.FC<ChartTooltipProps>;

  /**
   * CSS class name for additional styling
   */
  className?: string;

  /**
   * Whether to animate the chart when data changes
   */
  animate?: boolean;

  /**
   * Custom theme for the chart (light or dark)
   */
  theme?: 'light' | 'dark';

  /**
   * Optional click handler for chart elements
   */
  onElementClick?: (data: Record<string, unknown>, index: number) => void;

  /**
   * Whether to show a loading indicator when data is empty
   */
  showLoadingState?: boolean;

  /**
   * Error message to display if there's an error with the chart data
   */
  errorMessage?: string;
}

/**
 * The default color palette for charts
 */
export const defaultColors = [
  '#4361ee', // Blue
  '#3a86ff', // Light blue
  '#4cc9f0', // Cyan
  '#4895ef', // Sky blue
  '#560bad', // Purple
  '#7209b7', // Dark purple
  '#f72585', // Pink
  '#b5179e', // Magenta
  '#3f37c9', // Indigo
  '#4cc9f0', // Teal
  '#4361ee', // Blue
  '#3a0ca3', // Dark blue
  '#7209b7', // Violet
  '#f72585', // Hot pink
  '#4cc9f0', // Sky
];

/**
 * Default custom tooltip that works for most chart types
 */
export const DefaultTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Format the label (often a date)
  const formattedLabel =
    typeof label === 'number' && label > 1000000000 ? new Date(label).toLocaleString() : label;

  return (
    <div className="custom-tooltip rounded border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="font-semibold text-gray-700 dark:text-gray-200">{formattedLabel}</p>
      <ul className="mt-2">
        {payload.map((entry, index) => (
          <li
            key={`item-${index}`}
            className="flex items-center gap-2 text-sm"
            style={{ color: entry.color }}
          >
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="capitalize">
              {entry.name}:{' '}
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : String(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Base chart component that provides common functionality for all chart types
 */
export function BaseChart({
  width = '100%',
  height = 400,
  title,
  subtitle,
  className = '',
  theme = 'light',
  children,
  errorMessage,
  showLoadingState = true,
}: Omit<BaseChartProps, 'data'> & { children: ReactElement }) {
  // Apply theme-specific classes
  const themeClasses = theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800';

  // Show error message if provided
  if (errorMessage) {
    return (
      <div className={`chart-container ${themeClasses} rounded-lg p-4 shadow-md ${className}`}>
        {title && <h3 className="chart-title mb-2 text-lg font-semibold">{title}</h3>}
        {subtitle && <p className="chart-subtitle mb-4 text-sm text-gray-500">{subtitle}</p>}
        <div className="flex h-64 items-center justify-center text-red-500">
          <div className="text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto mb-2 h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p>{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state if required and there's no children
  if (showLoadingState && !React.Children.count(children)) {
    return (
      <div className={`chart-container ${themeClasses} rounded-lg p-4 shadow-md ${className}`}>
        {title && <h3 className="chart-title mb-2 text-lg font-semibold">{title}</h3>}
        {subtitle && <p className="chart-subtitle mb-4 text-sm text-gray-500">{subtitle}</p>}
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-2 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`chart-container ${themeClasses} rounded-lg p-4 shadow-md ${className}`}>
      {title && <h3 className="chart-title mb-2 text-lg font-semibold">{title}</h3>}
      {subtitle && <p className="chart-subtitle mb-4 text-sm text-gray-500">{subtitle}</p>}
      <ResponsiveContainer width={width} height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Process data points for chart visualization
 * Handles both DataPoint objects and record objects
 */
export function processChartData(
  data: DataPoint[] | Record<string, unknown>[],
  xAxisKey: string,
  yAxisKeys: string[] | string,
  dateFormat = false
) {
  if (!data || data.length === 0) return [];

  // Ensure yAxisKeys is an array
  const yKeys = Array.isArray(yAxisKeys) ? yAxisKeys : [yAxisKeys];

  return data.map(item => {
    // Handle DataPoint objects
    if ('properties' in item && 'metadata' in item) {
      const dataPoint = item as DataPoint;
      const properties = { ...dataPoint.properties };
      const metadata = dataPoint.metadata || {};

      // Create a new object with flattened structure for chart
      const processedPoint: Record<string, unknown> = {
        ...properties,
        ...metadata,
        // Include the id and date for reference
        id: dataPoint.id,
        date: dataPoint.date,
        // Format date if it's being used as the x-axis
        formattedDate:
          dateFormat && xAxisKey === 'date'
            ? new Date(dataPoint.date).toLocaleDateString()
            : undefined,
      };

      // Ensure all yKeys have a value, default to 0 if missing
      yKeys.forEach(key => {
        if (!(key in processedPoint)) {
          processedPoint[key] = 0;
        }
      });

      return processedPoint;
    }

    // Handle record objects
    const processedRecord: Record<string, unknown> = {
      ...item,
      // Format date if it's a timestamp and dateFormat is true
      formattedDate:
        dateFormat && xAxisKey === 'date' && typeof item.date === 'number'
          ? new Date(item.date as number).toLocaleDateString()
          : undefined,
    };

    // Ensure all yKeys have a value, default to 0 if missing
    yKeys.forEach(key => {
      if (!(key in processedRecord)) {
        processedRecord[key] = 0;
      }
    });

    return processedRecord;
  });
}

/**
 * Format tick values for the X axis
 */
export function formatAxisTick(value: number | string, dateFormat = false) {
  if (dateFormat && typeof value === 'number') {
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  return String(value);
}

/**
 * Get color from a palette based on index
 */
export function getColor(index: number, colors: string[] = defaultColors) {
  return colors[index % colors.length];
}

/**
 * Format a label by capitalizing and adding spaces before capital letters
 */
export function formatLabel(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

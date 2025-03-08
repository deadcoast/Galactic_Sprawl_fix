import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  Legend,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DataPoint } from '../../../../types/exploration/DataAnalysisTypes';

interface BarChartProps {
  data: DataPoint[] | Record<string, unknown>[];
  xAxisKey: string;
  yAxisKeys: string[];
  width?: number | string;
  height?: number | string;
  title?: string;
  colors?: string[];
  stacked?: boolean;
  customTooltip?: React.FC<unknown>;
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
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F'],
  stacked = false,
  customTooltip,
}: BarChartProps) {
  // Process data for the chart
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(item => {
      // Handle DataPoint objects
      if ('properties' in item && 'metadata' in item) {
        const dataPoint = item as DataPoint;
        const properties = { ...dataPoint.properties };
        const metadata = dataPoint.metadata || {};

        // Create a new object with flattened structure for chart
        return {
          ...properties,
          ...metadata,
          // Include the id for reference
          id: dataPoint.id,
          // Use the name as the display label if appropriate
          label: dataPoint.name,
        };
      }

      // Handle regular record objects
      return {
        ...item,
      };
    });
  }, [data]);

  // Generate unique colors for each bar
  const getBarColor = (index: number) => {
    return colors[index % colors.length];
  };

  if (!data || data.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width={width} height={height}>
        <RechartsBarChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} angle={-45} textAnchor="end" height={70} />
          <YAxis />
          <Tooltip content={customTooltip} />
          <Legend />

          {yAxisKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={getBarColor(index)}
              name={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DataPoint } from '../../../../types/exploration/DataAnalysisTypes';

interface LineChartProps {
  data: DataPoint[] | Record<string, unknown>[];
  xAxisKey: string;
  yAxisKeys: string[];
  width?: number | string;
  height?: number | string;
  title?: string;
  colors?: string[];
  dateFormat?: boolean;
  customTooltip?: React.FC<unknown>;
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
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F'],
  dateFormat = false,
  customTooltip,
}: LineChartProps) {
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
          // Include the id and date for reference
          id: dataPoint.id,
          date: dataPoint.date,
          // Format date if it's being used as the x-axis
          formattedDate:
            dateFormat && xAxisKey === 'date'
              ? new Date(dataPoint.date).toLocaleDateString()
              : undefined,
        };
      }

      // Handle record objects
      return {
        ...item,
        // Format date if it's a timestamp and dateFormat is true
        formattedDate:
          dateFormat && xAxisKey === 'date' && typeof item.date === 'number'
            ? new Date(item.date as number).toLocaleDateString()
            : undefined,
      };
    });
  }, [data, xAxisKey, dateFormat]);

  // Format tick values for the X axis if they're dates
  const formatXAxisTick = (value: number | string) => {
    if (dateFormat && xAxisKey === 'date' && typeof value === 'number') {
      return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return String(value);
  };

  // Generate unique colors for each line
  const getLineColor = (index: number) => {
    return colors[index % colors.length];
  };

  if (!data || data.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width={width} height={height}>
        <RechartsLineChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={dateFormat && xAxisKey === 'date' ? 'formattedDate' : xAxisKey}
            tickFormatter={formatXAxisTick}
          />
          <YAxis />
          <Tooltip content={customTooltip} />
          <Legend />

          {yAxisKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={getLineColor(index)}
              activeDot={{ r: 8 }}
              name={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

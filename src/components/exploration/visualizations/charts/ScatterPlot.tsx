import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  ScatterChart as RechartsScatterChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { DataPoint } from '../../../../types/exploration/DataAnalysisTypes';

interface ScatterPlotProps {
  data: DataPoint[] | Record<string, unknown>[];
  xAxisKey: string;
  yAxisKey: string;
  zAxisKey?: string;
  width?: number | string;
  height?: number | string;
  title?: string;
  color?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  nameKey?: string;
  customTooltip?: React.FC<unknown>;
}

/**
 * ScatterPlot component for visualizing correlations between variables
 */
export function ScatterPlot({
  data,
  xAxisKey,
  yAxisKey,
  zAxisKey,
  width = '100%',
  height = 400,
  title,
  color = '#8884d8',
  xAxisLabel,
  yAxisLabel,
  nameKey,
  customTooltip,
}: ScatterPlotProps) {
  // Process data for the chart
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(item => {
      let x, y, z;

      // Handle DataPoint objects
      if ('properties' in item && 'metadata' in item) {
        const dataPoint = item as DataPoint;
        const properties = { ...dataPoint.properties };
        const metadata = dataPoint.metadata || {};

        // Try to find the required values in properties or metadata
        x = properties[xAxisKey] !== undefined ? properties[xAxisKey] : metadata[xAxisKey];
        y = properties[yAxisKey] !== undefined ? properties[yAxisKey] : metadata[yAxisKey];
        z = zAxisKey
          ? properties[zAxisKey] !== undefined
            ? properties[zAxisKey]
            : metadata[zAxisKey]
          : undefined;

        const name = nameKey
          ? (properties[nameKey] !== undefined ? properties[nameKey] : metadata[nameKey]) ||
            dataPoint.name
          : dataPoint.name;

        // Ensure x and y values are numbers
        x = typeof x === 'number' ? x : parseFloat(String(x)) || 0;
        y = typeof y === 'number' ? y : parseFloat(String(y)) || 0;
        z = z && typeof z === 'number' ? z : z ? parseFloat(String(z)) || 10 : 10;

        return {
          x,
          y,
          z,
          name,
          id: dataPoint.id,
          originalData: dataPoint,
        };
      }
      // Handle regular objects
      else {
        const record = item as Record<string, unknown>;

        x = record[xAxisKey];
        y = record[yAxisKey];
        z = zAxisKey ? record[zAxisKey] : undefined;

        const name = nameKey ? record[nameKey] : undefined;

        // Ensure x and y values are numbers
        x = typeof x === 'number' ? x : parseFloat(String(x)) || 0;
        y = typeof y === 'number' ? y : parseFloat(String(y)) || 0;
        z = z && typeof z === 'number' ? z : z ? parseFloat(String(z)) || 10 : 10;

        return {
          x,
          y,
          z,
          name: name || `(${x}, ${y})`,
          originalData: record,
        };
      }
    });
  }, [data, xAxisKey, yAxisKey, zAxisKey, nameKey]);

  if (!data || data.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width={width} height={height}>
        <RechartsScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid />
          <XAxis
            type="number"
            dataKey="x"
            name={xAxisLabel || xAxisKey}
            label={
              xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined
            }
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yAxisLabel || yAxisKey}
            label={
              yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined
            }
          />
          {zAxisKey && <ZAxis type="number" dataKey="z" range={[20, 200]} />}
          <Tooltip content={customTooltip} cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          <Scatter
            name={`${xAxisLabel || xAxisKey} vs ${yAxisLabel || yAxisKey}`}
            data={processedData}
            fill={color}
          />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

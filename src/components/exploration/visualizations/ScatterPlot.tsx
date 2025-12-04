import { useMemo } from 'react';
import {
  CartesianGrid,
  LabelProps,
  Legend,
  ScatterChart as RechartsScatterChart,
  ReferenceArea,
  ReferenceLine,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { DataPoint } from '../../../types/exploration/DataAnalysisTypes';
import {
  BaseChart,
  BaseChartProps,
  DefaultTooltip,
  formatAxisTick,
  ReferenceLine as ReferenceLineType,
} from './BaseChart';

// Define the click event interface
interface PointClickEvent {
  payload: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ScatterPlotProps extends BaseChartProps {
  /** Key for X-axis values */
  xAxisKey: string;

  /** Key for Y-axis values */
  yAxisKey: string;

  /** Optional key for Z-axis values (bubble size) */
  zAxisKey?: string;

  /** Label for X-axis */
  xAxisLabel?: string;

  /** Label for Y-axis */
  yAxisLabel?: string;

  /** Key for point name/label */
  nameKey?: string;

  /** Whether to show grid lines */
  showGrid?: boolean;

  /** Point fill color */
  color?: string;

  /** Size of the points */
  pointSize?: number;

  /** Minimum for Z-axis size range */
  zAxisSizeMin?: number;

  /** Maximum for Z-axis size range */
  zAxisSizeMax?: number;

  /** Optional quadrants to divide the chart */
  showQuadrants?: boolean;

  /** X-axis value for quadrant division */
  quadrantXValue?: number;

  /** Y-axis value for quadrant division */
  quadrantYValue?: number;

  /** Quadrant label configuration */
  quadrantLabels?: {
    topRight?: string;
    topLeft?: string;
    bottomRight?: string;
    bottomLeft?: string;
  };

  /** Whether to show the legends */
  showLegend?: boolean;

  /** Reference lines to display */
  referenceLines?: ReferenceLineType[];
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
  theme = 'light',
  showGrid = true,
  pointSize = 10,
  zAxisSizeMin = 10,
  zAxisSizeMax = 80,
  showQuadrants = false,
  quadrantXValue,
  quadrantYValue,
  quadrantLabels = {
    topRight: 'Top Right',
    topLeft: 'Top Left',
    bottomRight: 'Bottom Right',
    bottomLeft: 'Bottom Left',
  },
  showLegend = true,
  referenceLines = [],
  className = '',
  animate = true,
  onElementClick,
  errorMessage,
}: ScatterPlotProps) {
  // Process data for the chart
  const processedData = useMemo(() => {
    if (!data || data?.length === 0) return [];

    return data?.map(item => {
      let x, y, z, name;

      // Handle DataPoint objects
      if ('properties' in item && 'metadata' in item) {
        const dataPoint = item as DataPoint;
        const properties = { ...dataPoint.properties };
        const metadata = dataPoint.metadata ?? {};

        // Try to find the required values in properties or metadata
        x = properties[xAxisKey] ?? metadata[xAxisKey];
        y = properties[yAxisKey] ?? metadata[yAxisKey];
        z = zAxisKey ? (properties[zAxisKey] ?? metadata[zAxisKey]) : undefined;

        name = nameKey
          ? (properties[nameKey] ?? metadata[nameKey]) ?? dataPoint.name
          : dataPoint.name;

        // Ensure x and y values are numbers
        x = typeof x === 'number' ? x : (parseFloat(String(x)) ?? 0);
        y = typeof y === 'number' ? y : (parseFloat(String(y)) ?? 0);
        // Safely parse z: ensure it's number, else parse if string, else use pointSize
        z = typeof z === 'number' ? z : (typeof z === 'string' ? parseFloat(z) : NaN) ?? pointSize;

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

        name = nameKey ? record[nameKey] : undefined;

        // Ensure x and y values are numbers
        x = typeof x === 'number' ? x : (parseFloat(String(x)) ?? 0);
        y = typeof y === 'number' ? y : (parseFloat(String(y)) ?? 0);
        // Safely parse z: ensure it's number, else parse if string, else use pointSize
        z = typeof z === 'number' ? z : (typeof z === 'string' ? parseFloat(z) : NaN) ?? pointSize;

        return {
          x,
          y,
          z,
          name: name ?? `(${x}, ${y})`,
          originalData: record,
        };
      }
    });
  }, [data, xAxisKey, yAxisKey, zAxisKey, nameKey, pointSize]);

  // If no data, show error
  if (!data || data?.length === 0) {
    return (
      <BaseChart
        width={width}
        height={height}
        title={title}
        theme={theme}
        className={className}
        errorMessage={errorMessage ?? 'No data available'}
      >
        <RechartsScatterChart data={[]} />
      </BaseChart>
    );
  }

  // Calculate quadrant values if not provided
  const xValue =
    quadrantXValue ??
    (processedData.reduce((sum, item) => sum + (item?.x ?? 0), 0) / (processedData.length || 1));

  const yValue =
    quadrantYValue ??
    (processedData.reduce((sum, item) => sum + (item?.y ?? 0), 0) / (processedData.length || 1));

  // Handle click events
  const handlePointClick = (event: PointClickEvent) => {
    onElementClick?.(event?.payload, 0);
  };

  // Create the chart content
  const chartContent = (
    <RechartsScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      {showGrid && <CartesianGrid strokeDasharray="3 3" />}

      <XAxis
        type="number"
        dataKey="x"
        name={xAxisLabel ?? xAxisKey}
        label={
          xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined
        }
        tickFormatter={(value: string | number) => formatAxisTick(value, false)}
      />

      <YAxis
        type="number"
        dataKey="y"
        name={yAxisLabel ?? yAxisKey}
        label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
        tickFormatter={(value: string | number) => formatAxisTick(value, false)}
      />

      {zAxisKey && (
        <ZAxis type="number" dataKey="z" range={[zAxisSizeMin, zAxisSizeMax]} name={zAxisKey} />
      )}

      <Tooltip content={customTooltip ?? <DefaultTooltip />} cursor={{ strokeDasharray: '3 3' }} />

      {showLegend && <Legend />}

      {/* Reference lines for thresholds or important values */}
      {referenceLines.map((line, i) => (
        <ReferenceLine
          key={`ref-line-${i}`}
          x={line.axis === 'x' ? line.value : undefined}
          y={line.axis === 'y' ? line.value : undefined}
          stroke={line.color ?? '#ff7300'}
          label={
            line.label
              ? ({
                  value: line.label,
                  position: line.position ?? 'center',
                } as LabelProps)
              : undefined
          }
        />
      ))}

      {/* Quadrant reference lines */}
      {showQuadrants && (
        <>
          <ReferenceLine x={xValue} stroke="#666" strokeDasharray="3 3" />
          <ReferenceLine y={yValue} stroke="#666" strokeDasharray="3 3" />

          {/* Quadrant labels */}
          {quadrantLabels.topRight && (
            <ReferenceArea
              x1={xValue}
              x2="auto"
              y1={yValue}
              y2="auto"
              fillOpacity={0}
              label={{ value: quadrantLabels.topRight, position: 'insideTopRight' }}
            />
          )}

          {quadrantLabels.topLeft && (
            <ReferenceArea
              x1={0}
              x2={xValue}
              y1={yValue}
              y2="auto"
              fillOpacity={0}
              label={{ value: quadrantLabels.topLeft, position: 'insideTopLeft' }}
            />
          )}

          {quadrantLabels.bottomRight && (
            <ReferenceArea
              x1={xValue}
              x2="auto"
              y1={0}
              y2={yValue}
              fillOpacity={0}
              label={{ value: quadrantLabels.bottomRight, position: 'insideBottomRight' }}
            />
          )}

          {quadrantLabels.bottomLeft && (
            <ReferenceArea
              x1={0}
              x2={xValue}
              y1={0}
              y2={yValue}
              fillOpacity={0}
              label={{ value: quadrantLabels.bottomLeft, position: 'insideBottomLeft' }}
            />
          )}
        </>
      )}

      <Scatter
        name={`${xAxisLabel ?? xAxisKey} vs ${yAxisLabel ?? yAxisKey}`}
        data={processedData}
        fill={color}
        onClick={(e: PointClickEvent) => handlePointClick(e)}
        isAnimationActive={animate}
      />
    </RechartsScatterChart>
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

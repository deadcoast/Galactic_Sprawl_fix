import { Box, CircularProgress, Typography } from '@mui/material';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useMemoryManager } from '../../../../hooks/useMemoryManager';
import { BaseChartProps } from './BaseChart';
import CanvasLineChart from './CanvasLineChart';
import CanvasScatterPlot from './CanvasScatterPlot';

// Type of visualization to render
export type ChartType =
  | 'auto' // Automatically select the best chart type based on data
  | 'scatter' // Scatter plot
  | 'line' // Line chart
  | 'timeSeries' // Time series (specialized line chart)
  | 'heatmap'; // Heat map (to be implemented)

export interface CanvasChartFactoryProps extends BaseChartProps {
  /** Type of chart to render */
  chartType: ChartType;

  /** Key for X-axis values */
  xAxisKey: string;

  /** Key(s) for Y-axis values (can be multiple for line charts) */
  yAxisKeys: string | string[];

  /** Optional key for point size (scatter plots) */
  sizeKey?: string;

  /** Optional key for point color (scatter plots) */
  colorKey?: string;

  /** Label for X-axis */
  xAxisLabel?: string;

  /** Label for Y-axis */
  yAxisLabel?: string;

  /** Optional min/max values for X-axis */
  xDomain?: [number, number];

  /** Optional min/max values for Y-axis */
  yDomain?: [number, number];

  /** Colors for data series */
  colors?: string[];

  /** Whether to show grid lines */
  showGrid?: boolean;

  /** Whether to show axes */
  showAxes?: boolean;

  /** Whether to use WebGL for rendering (if available) */
  useWebGL?: boolean;

  /** Maximum points to render before downsampling */
  maxPoints?: number;

  /** Whether to show performance statistics */
  showPerformanceStats?: boolean;

  /** Memory management key (for tracking memory usage) */
  memoryKey?: string;

  /** Whether to enable memory optimization */
  enableMemoryOptimization?: boolean;

  /** Auto cleanup level for memory management */
  autoCleanupLevel?: 'none' | 'low' | 'medium' | 'high';

  /** Function to format date values on the X-axis */
  formatXAxisDate?: (value: number) => string;
}

interface ContainerStyleProps {
  width: string | number;
  height: string | number;
  display: 'flex';
  flexDirection: 'column';
  justifyContent: 'center';
  alignItems: 'center';
}

interface ErrorStyleProps extends ContainerStyleProps {
  border: string;
  borderRadius: number;
}

interface WrapperStyleProps {
  position: 'relative';
}

interface OverlayStyleProps {
  position: 'absolute';
  top: number;
  right: number;
  backgroundColor: string;
  color: string;
  padding: string;
  borderRadius: number;
  fontSize: string;
  zIndex: number;
}

const containerStyles = (width: string | number, height: string | number): ContainerStyleProps => ({
  width: typeof width === 'number' ? `${width}px` : width,
  height: typeof height === 'number' ? `${height}px` : height,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
});

const errorStyles = (width: string | number, height: string | number): ErrorStyleProps => ({
  ...containerStyles(width, height),
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 1,
});

const wrapperStyle: WrapperStyleProps = {
  position: 'relative',
};

const overlayStyle: OverlayStyleProps = {
  position: 'absolute',
  top: 5,
  right: 5,
  backgroundColor: 'rgba(0,0,0,0.6)',
  color: 'white',
  padding: '4px 8px',
  borderRadius: 1,
  fontSize: '0.75rem',
  zIndex: 10,
};

/**
 * CanvasChartFactory is a component that renders the appropriate canvas-based
 * chart based on the data and requested chart type. It handles automatic selection
 * of chart types, memory management, and performance optimization.
 */
const CanvasChartFactory: React.FC<CanvasChartFactoryProps> = ({
  data,
  chartType = 'auto',
  xAxisKey,
  yAxisKeys,
  sizeKey,
  colorKey,
  width = '100%',
  height = 400,
  title,
  subtitle,
  xAxisLabel,
  yAxisLabel,
  xDomain,
  yDomain,
  colors,
  showGrid = true,
  showAxes = true,
  useWebGL = true,
  maxPoints = 5000,
  showPerformanceStats = false,
  memoryKey = 'canvas-chart',
  enableMemoryOptimization = true,
  autoCleanupLevel = 'medium',
  formatXAxisDate,
  className = '',
  errorMessage,
  onElementClick,
}) => {
  // State for performance monitoring
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const [pointsRendered, setPointsRendered] = useState<number | null>(null);

  // Memory management
  const memory = useMemoryManager<Array<Record<string, unknown>>>(
    enableMemoryOptimization ? null : data,
    {
      key: memoryKey,
      enableLogging: showPerformanceStats,
      autoCleanupLevel: autoCleanupLevel,
      cacheExpirationTime: 60000, // 1 minute
    }
  );

  // Update memory tracking when data changes
  useEffect(() => {
    if (enableMemoryOptimization && data) {
      memory.updateData(data as Array<Record<string, unknown>>);
    }
  }, [data, memory, enableMemoryOptimization]);

  // Track render performance
  useEffect(() => {
    if (!showPerformanceStats) return;

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
      setPointsRendered(data?.length || 0);
    };
  }, [data, showPerformanceStats]);

  // Auto-detect the best chart type based on data characteristics
  const detectedChartType = useMemo((): ChartType => {
    if (chartType !== 'auto') return chartType;
    if (!data || data.length === 0) return 'scatter';

    // Check if we're dealing with time series data
    const sampleX = data[0][xAxisKey];
    const isTimeData =
      (typeof sampleX === 'number' && sampleX > 1000000000) || // Looks like a timestamp
      (typeof sampleX === 'string' && !isNaN(Date.parse(sampleX))); // Looks like a date string

    if (isTimeData) return 'timeSeries';

    // If we have multiple y keys, it's likely a line chart comparison
    if (Array.isArray(yAxisKeys) && yAxisKeys.length > 1) return 'line';

    // For smaller datasets, scatter plots work well
    if (data.length < 1000) return 'scatter';

    // For larger datasets, line charts with downsampling work better
    return 'line';
  }, [chartType, data, xAxisKey, yAxisKeys]);

  // If memory optimization is enabled and data is not loaded, show loading state
  if (enableMemoryOptimization && !memory.isDataLoaded) {
    return (
      <Box component="div" style={containerStyles(width, height)} className={className}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading chart data...
        </Typography>
      </Box>
    );
  }

  // If we have no data, show error message
  if (!data || data.length === 0) {
    return (
      <Box component="div" style={errorStyles(width, height)} className={className}>
        <Typography variant="body1" color="text.secondary">
          {errorMessage || 'No data available'}
        </Typography>
      </Box>
    );
  }

  // Determine points to render (apply downsampling if needed)
  const activeData = enableMemoryOptimization ? memory.getCachedData('chartData') || data : data;

  // Function to render the appropriate chart based on the determined type
  const renderChart = () => {
    const actualYAxisKeys = Array.isArray(yAxisKeys) ? yAxisKeys : [yAxisKeys];
    const chartData: Record<string, unknown>[] = Array.isArray(activeData) ? activeData : [];

    switch (detectedChartType) {
      case 'scatter':
        return (
          <CanvasScatterPlot
            data={chartData}
            xAxisKey={xAxisKey}
            yAxisKey={Array.isArray(yAxisKeys) ? yAxisKeys[0] : yAxisKeys}
            sizeKey={sizeKey}
            colorKey={colorKey}
            width={width}
            height={height}
            title={title}
            subtitle={subtitle}
            xAxisLabel={xAxisLabel}
            yAxisLabel={yAxisLabel}
            xDomain={xDomain}
            yDomain={yDomain}
            colorRange={colors}
            showGrid={showGrid}
            showAxes={showAxes}
            useWebGL={useWebGL}
            performanceThreshold={maxPoints}
            onElementClick={onElementClick}
            className={className}
            errorMessage={errorMessage}
          />
        );

      case 'line':
      case 'timeSeries':
        return (
          <CanvasLineChart
            data={chartData}
            xAxisKey={xAxisKey}
            yAxisKeys={actualYAxisKeys}
            width={width}
            height={height}
            title={title}
            subtitle={subtitle}
            xAxisLabel={xAxisLabel}
            yAxisLabel={yAxisLabel}
            xDomain={xDomain}
            yDomain={yDomain}
            seriesColors={colors}
            showGrid={showGrid}
            showAxes={showAxes}
            formatXAxisDate={formatXAxisDate}
            maxPointsBeforeDownsampling={maxPoints}
            onElementClick={onElementClick}
            className={className}
            errorMessage={errorMessage}
          />
        );

      // Add other chart types here as they are implemented

      default:
        return (
          <Box component="div" style={errorStyles(width, height)} className={className}>
            <Typography variant="body1" color="text.secondary">
              Unsupported chart type: {detectedChartType}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box component="div" style={wrapperStyle}>
      {renderChart()}

      {/* Performance statistics overlay */}
      {showPerformanceStats && (
        <Box component="div" style={overlayStyle}>
          <div>Chart Type: {detectedChartType}</div>
          <div>Data Points: {data.length.toLocaleString()}</div>
          {pointsRendered && <div>Rendered: {pointsRendered.toLocaleString()} points</div>}
          {renderTime && <div>Render Time: {renderTime.toFixed(1)}ms</div>}
          {enableMemoryOptimization && (
            <div>Memory Usage: {(memory.memoryUsage / 1024 / 1024).toFixed(2)} MB</div>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CanvasChartFactory;

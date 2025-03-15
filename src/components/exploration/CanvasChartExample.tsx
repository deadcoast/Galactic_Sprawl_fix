import {
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Switch,
  Typography,
} from '@mui/material';
import * as React from "react";
import { useEffect, useState } from 'react';
import { ChartDataRecord } from '../../types/exploration/AnalysisComponentTypes';
import CanvasChartFactory, { ChartType } from './visualizations/charts/CanvasChartFactory';

// Generate random scatter plot data
const generateScatterPlotData = (count: number): ChartDataRecord[] => {
  const data: ChartDataRecord[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.random() * 100;
    const y = 50 + Math.random() * 50 - 25 + Math.sin(x / 10) * 20;
    const size = 5 + Math.random() * 15;
    const category = Math.floor(Math.random() * 5);

    data.push({
      id: `point-${i}`,
      x,
      y,
      size,
      category,
      details: `Point ${i} (${x.toFixed(2)}, ${y.toFixed(2)})`,
    });
  }
  return data;
};

// Generate random time series data
const generateTimeSeriesData = (count: number, series: number = 3): ChartDataRecord[] => {
  const data: ChartDataRecord[] = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // Create multiple sine waves with different phases
  for (let i = 0; i < count; i++) {
    const timestamp = now - ((count - i) * oneDay) / count;
    const record: ChartDataRecord = {
      id: `time-${i}`,
      timestamp,
    };

    // Add series values
    for (let s = 0; s < series; s++) {
      const phase = (s * Math.PI) / 4;
      const amplitude = 10 + s * 5;
      const frequency = 0.1 + s * 0.05;
      const trendSlope = s * 0.01;

      record[`series${s}`] =
        amplitude * Math.sin(frequency * i + phase) +
        50 +
        i * trendSlope +
        (Math.random() * 5 - 2.5); // Add some noise
    }

    data.push(record);
  }

  return data;
};

// Format timestamp as date
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};

const CanvasChartExample: React.FC = () => {
  // State for scatter plot demo
  const [scatterPointCount, setScatterPointCount] = useState<number>(5000);
  const [scatterData, setScatterData] = useState<ChartDataRecord[]>([]);

  // State for time series demo
  const [timeSeriesPointCount, setTimeSeriesPointCount] = useState<number>(10000);
  const [timeSeriesData, setTimeSeriesData] = useState<ChartDataRecord[]>([]);
  const [seriesCount, setSeriesCount] = useState<number>(3);

  // State for chart configuration
  const [chartType, setChartType] = useState<ChartType>('auto');
  const [useWebGL, setUseWebGL] = useState<boolean>(true);
  const [showPerformanceStats, setShowPerformanceStats] = useState<boolean>(true);
  const [enableMemoryManagement, setEnableMemoryManagement] = useState<boolean>(true);

  // Generate initial data
  useEffect(() => {
    setScatterData(generateScatterPlotData(scatterPointCount));
  }, [scatterPointCount]);

  useEffect(() => {
    setTimeSeriesData(generateTimeSeriesData(timeSeriesPointCount, seriesCount));
  }, [timeSeriesPointCount, seriesCount]);

  // Handle point click events
  const handlePointClick = (data: Record<string, unknown>, index: number) => {
    console.warn('Clicked point:', data, 'Series index:', index);
  };

  // Get series keys for time series chart
  const getSeriesKeys = (count: number): string[] => {
    return Array.from({ length: count }, (_, i) => `series${i}`);
  };

  return (
    <div className="p-6">
      <Typography variant="h4" gutterBottom>
        Canvas Chart Examples
      </Typography>

      <Typography variant="body1" paragraph>
        These examples demonstrate high-performance canvas-based chart rendering for large datasets.
        WebGL acceleration is used when available for even better performance with very large
        datasets.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Chart Configuration
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={e => setChartType(e.target.value as ChartType)}
              >
                <MenuItem value="auto">Auto-detect</MenuItem>
                <MenuItem value="scatter">Scatter Plot</MenuItem>
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="timeSeries">Time Series</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={<Switch checked={useWebGL} onChange={e => setUseWebGL(e.target.checked)} />}
              label="Use WebGL (if available)"
              sx={{ mt: 2, display: 'block' }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={showPerformanceStats}
                  onChange={e => setShowPerformanceStats(e.target.checked)}
                />
              }
              label="Show Performance Stats"
              sx={{ mt: 1, display: 'block' }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={enableMemoryManagement}
                  onChange={e => setEnableMemoryManagement(e.target.checked)}
                />
              }
              label="Enable Memory Management"
              sx={{ mt: 1, display: 'block' }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Scatter Plot Configuration
            </Typography>

            <Typography id="scatter-points-slider" gutterBottom>
              Point Count: {scatterPointCount.toLocaleString()}
            </Typography>
            <Slider
              value={scatterPointCount}
              onChange={(_, value) => setScatterPointCount(value as number)}
              aria-labelledby="scatter-points-slider"
              min={100}
              max={100000}
              step={100}
              valueLabelDisplay="auto"
              valueLabelFormat={x => x.toLocaleString()}
            />

            <div className="mt-4">
              <Typography variant="body2" color="text.secondary">
                This demonstrates rendering efficiency for large scatter plots. Try increasing the
                point count to see how the canvas renderer handles thousands or even tens of
                thousands of points.
              </Typography>
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Time Series Configuration
            </Typography>

            <Typography id="time-series-points-slider" gutterBottom>
              Point Count: {timeSeriesPointCount.toLocaleString()}
            </Typography>
            <Slider
              value={timeSeriesPointCount}
              onChange={(_, value) => setTimeSeriesPointCount(value as number)}
              aria-labelledby="time-series-points-slider"
              min={1000}
              max={1000000}
              step={1000}
              valueLabelDisplay="auto"
              valueLabelFormat={x => x.toLocaleString()}
            />

            <Typography id="series-count-slider" sx={{ mt: 2 }} gutterBottom>
              Series Count: {seriesCount}
            </Typography>
            <Slider
              value={seriesCount}
              onChange={(_, value) => setSeriesCount(value as number)}
              aria-labelledby="series-count-slider"
              min={1}
              max={10}
              step={1}
              valueLabelDisplay="auto"
            />

            <div className="mt-4">
              <Typography variant="body2" color="text.secondary">
                The time series chart uses the LTTB algorithm to intelligently downsample the data
                while preserving visual characteristics. It can efficiently render millions of data
                points across multiple series.
              </Typography>
            </div>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Scatter Plot Demo
            </Typography>
            <div className="h-[500px]">
              <CanvasChartFactory
                chartType={chartType === 'auto' ? 'scatter' : chartType}
                data={scatterData}
                xAxisKey="x"
                yAxisKeys="y"
                sizeKey="size"
                colorKey="category"
                title="Scatter Plot Performance Demo"
                subtitle={`Rendering ${scatterPointCount.toLocaleString()} data points`}
                width="100%"
                height="100%"
                useWebGL={useWebGL}
                showPerformanceStats={showPerformanceStats}
                enableMemoryOptimization={enableMemoryManagement}
                memoryKey="scatter-plot-demo"
                onElementClick={handlePointClick}
              />
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Time Series Demo
            </Typography>
            <div className="h-[500px]">
              <CanvasChartFactory
                chartType={chartType === 'auto' ? 'timeSeries' : chartType}
                data={timeSeriesData}
                xAxisKey="timestamp"
                yAxisKeys={getSeriesKeys(seriesCount)}
                title="Time Series Performance Demo"
                subtitle={`Rendering ${timeSeriesPointCount.toLocaleString()} data points across ${seriesCount} series`}
                width="100%"
                height="100%"
                useWebGL={useWebGL}
                showPerformanceStats={showPerformanceStats}
                enableMemoryOptimization={enableMemoryManagement}
                memoryKey="time-series-demo"
                formatXAxisDate={formatDate}
                onElementClick={handlePointClick}
              />
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default CanvasChartExample;

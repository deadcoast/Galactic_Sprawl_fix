import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
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
import React, { useCallback, useEffect, useState } from 'react';
import { ChartDataRecord } from '../../types/exploration/AnalysisComponentTypes';
import { ChartType } from './visualizations/charts/CanvasChartFactory';
import MemoryOptimizedCanvasChart from './visualizations/charts/MemoryOptimizedCanvasChart';

// Generate a large dataset for time series
const generateLargeTimeSeriesData = (
  count: number,
  series: number = 3,
  includeNoise: boolean = true
): ChartDataRecord[] => {
  const data: ChartDataRecord[] = [];
  const now = Date.now();
  const interval = (24 * 60 * 60 * 1000) / count; // One day total span

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * interval;
    const record: ChartDataRecord = {
      id: `point-${i}`,
      timestamp,
    };

    // Generate data for each series
    for (let s = 0; s < series; s++) {
      const phase = (s * Math.PI) / 3;
      const amplitude = 10 + s * 5;
      const frequency = 0.002 + s * 0.001;
      const trend = s * 0.01 * i; // Add a trend line

      const baseValue = amplitude * Math.sin(frequency * i + phase) + 50 + trend;
      const noise = includeNoise ? Math.random() * 5 - 2.5 : 0;

      record[`series${s}`] = baseValue + noise;
    }

    data.push(record);
  }

  return data;
};

// Generate large scatter plot data
const generateLargeScatterData = (count: number): ChartDataRecord[] => {
  const data: ChartDataRecord[] = [];

  for (let i = 0; i < count; i++) {
    // Create clusters
    const clusterIndex = Math.floor(Math.random() * 5);
    const clusterCenterX = 20 + clusterIndex * 15;
    const clusterCenterY = 30 + clusterIndex * 10;

    const x = clusterCenterX + (Math.random() * 10 - 5);
    const y = clusterCenterY + (Math.random() * 10 - 5);
    const size = 3 + Math.random() * 7;
    const category = clusterIndex;

    data.push({
      id: `scatter-${i}`,
      x,
      y,
      size,
      category,
      details: `Point ${i} at (${x.toFixed(2)}, ${y.toFixed(2)})`,
    });
  }

  return data;
};

// Format date for axis display
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString();
};

/**
 * A demonstration component for the MemoryOptimizedCanvasChart
 * showing its capabilities with large datasets and memory management
 */
const MemoryOptimizedCanvasDemo: React.FC = () => {
  // Data configuration state
  const [datasetSize, setDatasetSize] = useState<number>(100000);
  const [seriesCount, setSeriesCount] = useState<number>(3);
  const [includeNoise, setIncludeNoise] = useState<boolean>(true);
  const [chartType, setChartType] = useState<ChartType>('timeSeries');

  // Chart configuration state
  const [showPerformanceStats, setShowPerformanceStats] = useState<boolean>(true);
  const [useWebGL, setUseWebGL] = useState<boolean>(true);
  const [enableRenderCaching, setEnableRenderCaching] = useState<boolean>(true);
  const [qualityThreshold, setQualityThreshold] = useState<number>(0.1);
  const [maxPointsBeforeDownsampling, setMaxPointsBeforeDownsampling] = useState<number>(10000);

  // Advanced memory options
  const [autoCleanupLevel, setAutoCleanupLevel] = useState<'none' | 'low' | 'medium' | 'high'>(
    'medium'
  );
  const [memoryThreshold, setMemoryThreshold] = useState<number>(50); // MB

  // Generated data
  const [timeSeriesData, setTimeSeriesData] = useState<ChartDataRecord[]>([]);
  const [scatterData, setScatterData] = useState<ChartDataRecord[]>([]);

  // UI state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [renderCount, setRenderCount] = useState<number>(0);
  const [lastRenderTime, setLastRenderTime] = useState<number>(0);

  // Generate the data based on current configuration
  const generateData = useCallback(() => {
    setIsGenerating(true);

    // Use setTimeout to prevent UI freeze
    setTimeout(() => {
      const startTime = performance.now();

      if (chartType === 'timeSeries' || chartType === 'line') {
        setTimeSeriesData(generateLargeTimeSeriesData(datasetSize, seriesCount, includeNoise));
      } else if (chartType === 'scatter') {
        setScatterData(generateLargeScatterData(datasetSize));
      }

      const endTime = performance.now();
      setLastRenderTime(endTime - startTime);
      setRenderCount(prev => prev + 1);
      setIsGenerating(false);
    }, 100);
  }, [chartType, datasetSize, seriesCount, includeNoise]);

  // Generate initial data
  useEffect(() => {
    generateData();
  }, [generateData]);

  // Get the appropriate data for the selected chart type
  const getChartData = useCallback(() => {
    if (chartType === 'timeSeries' || chartType === 'line') {
      return timeSeriesData;
    } else if (chartType === 'scatter') {
      return scatterData;
    }
    return [];
  }, [chartType, timeSeriesData, scatterData]);

  // Get the series keys based on series count
  const getSeriesKeys = useCallback(() => {
    return Array.from({ length: seriesCount }, (_, i) => `series${i}`);
  }, [seriesCount]);

  // Track memory usage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // This is just an estimate - in a real app we would use the memory API
      // or the profiling tools to get a more accurate measurement
      const approximateMemoryUsage =
        (timeSeriesData.length * seriesCount * 16) / (1024 * 1024) + // Time series data
        (scatterData.length * 32) / (1024 * 1024) + // Scatter data
        (enableRenderCaching ? 4 : 0); // Render cache overhead

      setMemoryUsage(approximateMemoryUsage);
    }, 2000);

    return () => clearInterval(interval);
  }, [timeSeriesData.length, scatterData.length, seriesCount, enableRenderCaching]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Memory-Optimized Canvas Chart Demo
      </Typography>

      <Typography variant="body1" paragraph>
        This demonstration showcases the advanced memory management capabilities of the
        MemoryOptimizedCanvasChart component. It can efficiently handle millions of data points
        through intelligent downsampling, visibility-based rendering, and adaptive quality levels.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Dataset Configuration" />
            <CardContent>
              <Typography gutterBottom>
                Dataset Size: {datasetSize.toLocaleString()} points
              </Typography>
              <Slider
                value={datasetSize}
                onChange={(_, value) => setDatasetSize(value as number)}
                min={1000}
                max={1000000}
                step={1000}
                valueLabelDisplay="auto"
                valueLabelFormat={x => x.toLocaleString()}
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={chartType}
                  label="Chart Type"
                  onChange={e => setChartType(e.target.value as ChartType)}
                >
                  <MenuItem value="timeSeries">Time Series</MenuItem>
                  <MenuItem value="line">Line Chart</MenuItem>
                  <MenuItem value="scatter">Scatter Plot</MenuItem>
                </Select>
              </FormControl>

              {(chartType === 'timeSeries' || chartType === 'line') && (
                <>
                  <Typography gutterBottom>Number of Series: {seriesCount}</Typography>
                  <Slider
                    value={seriesCount}
                    onChange={(_, value) => setSeriesCount(value as number)}
                    min={1}
                    max={10}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{ mb: 2 }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeNoise}
                        onChange={e => setIncludeNoise(e.target.checked)}
                      />
                    }
                    label="Include Noise"
                    sx={{ mb: 2 }}
                  />
                </>
              )}

              <Button variant="contained" onClick={generateData} disabled={isGenerating} fullWidth>
                {isGenerating ? 'Generating...' : 'Regenerate Data'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Rendering Configuration" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={showPerformanceStats}
                    onChange={e => setShowPerformanceStats(e.target.checked)}
                  />
                }
                label="Show Performance Stats"
                sx={{ mb: 2, display: 'block' }}
              />

              <FormControlLabel
                control={
                  <Switch checked={useWebGL} onChange={e => setUseWebGL(e.target.checked)} />
                }
                label="Use WebGL (GPU acceleration)"
                sx={{ mb: 2, display: 'block' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={enableRenderCaching}
                    onChange={e => setEnableRenderCaching(e.target.checked)}
                  />
                }
                label="Enable Render Caching"
                sx={{ mb: 2, display: 'block' }}
              />

              <Typography gutterBottom>Visibility Threshold: {qualityThreshold * 100}%</Typography>
              <Slider
                value={qualityThreshold}
                onChange={(_, value) => setQualityThreshold(value as number)}
                min={0.01}
                max={0.5}
                step={0.01}
                valueLabelDisplay="auto"
                valueLabelFormat={x => `${(x * 100).toFixed(0)}%`}
                sx={{ mb: 3 }}
              />

              <Typography gutterBottom>
                Max Points Before Downsampling: {maxPointsBeforeDownsampling.toLocaleString()}
              </Typography>
              <Slider
                value={maxPointsBeforeDownsampling}
                onChange={(_, value) => setMaxPointsBeforeDownsampling(value as number)}
                min={1000}
                max={50000}
                step={1000}
                valueLabelDisplay="auto"
                valueLabelFormat={x => x.toLocaleString()}
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Memory Management" />
            <CardContent>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Auto Cleanup Level</InputLabel>
                <Select
                  value={autoCleanupLevel}
                  label="Auto Cleanup Level"
                  onChange={e =>
                    setAutoCleanupLevel(e.target.value as 'none' | 'low' | 'medium' | 'high')
                  }
                >
                  <MenuItem value="none">None - Manual cleanup only</MenuItem>
                  <MenuItem value="low">Low - Cleanup very large datasets</MenuItem>
                  <MenuItem value="medium">Medium - Balance performance and memory</MenuItem>
                  <MenuItem value="high">High - Aggressive memory optimization</MenuItem>
                </Select>
              </FormControl>

              <Typography gutterBottom>Memory Threshold: {memoryThreshold} MB</Typography>
              <Slider
                value={memoryThreshold}
                onChange={(_, value) => setMemoryThreshold(value as number)}
                min={10}
                max={200}
                step={10}
                valueLabelDisplay="auto"
                valueLabelFormat={x => `${x} MB`}
                sx={{ mb: 3 }}
              />

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Performance Metrics
              </Typography>

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Estimated Memory Usage
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {memoryUsage.toFixed(2)} MB
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Last Generation Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {lastRenderTime.toFixed(0)} ms
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Render Count
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {renderCount}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Active Data Points
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {datasetSize.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Visualization With Memory-Optimized Canvas Chart
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This chart automatically adjusts rendering quality and memory usage based on visibility
          and dataset size. Scroll the page to see memory optimization in action.
        </Typography>

        <Box sx={{ height: 600, position: 'relative' }}>
          <MemoryOptimizedCanvasChart
            data={getChartData()}
            chartType={chartType}
            xAxisKey={chartType === 'scatter' ? 'x' : 'timestamp'}
            yAxisKeys={chartType === 'scatter' ? 'y' : getSeriesKeys()}
            sizeKey={chartType === 'scatter' ? 'size' : undefined}
            colorKey={chartType === 'scatter' ? 'category' : undefined}
            title={`${chartType === 'timeSeries' ? 'Time Series' : chartType === 'line' ? 'Line Chart' : 'Scatter Plot'} with ${datasetSize.toLocaleString()} Points`}
            subtitle={`Rendering with memory optimization and ${useWebGL ? 'WebGL acceleration' : 'standard Canvas'}`}
            width="100%"
            height={550}
            useWebGL={useWebGL}
            maxPoints={maxPointsBeforeDownsampling}
            showPerformanceStats={showPerformanceStats}
            memoryOptions={{
              autoCleanupLevel: autoCleanupLevel,
              memoryThreshold: memoryThreshold * 1024 * 1024, // Convert to bytes
              enableLogging: showPerformanceStats,
            }}
            visibilityThreshold={qualityThreshold}
            qualityLevels={[0.1, 0.25, 0.5, 0.75, 1.0]}
            enableRenderCaching={enableRenderCaching}
            formatXAxisDate={formatDate}
          />
        </Box>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardHeader title="Memory Management in Action" />
        <CardContent>
          <Typography variant="body2" paragraph>
            To see memory management in action:
          </Typography>

          <Typography component="div" variant="body2">
            <ol>
              <li>Increase the dataset size to 500,000+ points</li>
              <li>Scroll the chart partially out of view</li>
              <li>Notice that the memory usage decreases and quality adapts</li>
              <li>Scroll back to see the chart reload with appropriate quality</li>
            </ol>
          </Typography>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Key Memory Management Features:
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label="Visibility-based Loading/Unloading" />
            <Chip label="Adaptive Quality Levels" />
            <Chip label="Intelligent Downsampling" />
            <Chip label="Canvas Buffer Management" />
            <Chip label="Render Caching" />
            <Chip label="WebGL Acceleration" />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MemoryOptimizedCanvasDemo;

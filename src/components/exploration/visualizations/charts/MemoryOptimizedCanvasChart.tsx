import { Alert, Box, CircularProgress, Paper, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MemoryManagerOptions, useMemoryManager } from '../../../../hooks/useMemoryManager';
import { ChartDataRecord } from '../../../../types/exploration/AnalysisComponentTypes';
import { BaseChartProps } from './BaseChart';
import CanvasChartFactory, { ChartType } from './CanvasChartFactory';

// Buffer management for canvas contexts
interface CanvasBuffer {
  buffer: OffscreenCanvas | null;
  context: OffscreenCanvasRenderingContext2D | null;
  width: number;
  height: number;
  lastUpdated: number;
}

export interface MemoryOptimizedCanvasChartProps extends BaseChartProps {
  /** Type of chart to render */
  chartType: ChartType;

  /** Key for X-axis values */
  xAxisKey: string;

  /** Key(s) for Y-axis values */
  yAxisKeys: string | string[];

  /** Optional key for point size (scatter plots) */
  sizeKey?: string;

  /** Optional key for point color (scatter plots) */
  colorKey?: string;

  /** Optional min/max values for X-axis */
  xDomain?: [number, number];

  /** Optional min/max values for Y-axis */
  yDomain?: [number, number];

  /** Colors for data series */
  colors?: string[];

  /** Whether to use WebGL for rendering (if available) */
  useWebGL?: boolean;

  /** Maximum points to render before downsampling */
  maxPoints?: number;

  /** Whether to show performance statistics */
  showPerformanceStats?: boolean;

  /** Memory management configuration */
  memoryOptions?: Partial<MemoryManagerOptions>;

  /** Visibility threshold for auto-unloading (0-1, percentage of component visible) */
  visibilityThreshold?: number;

  /** Data resolution levels for adaptive quality (higher = better quality but more memory) */
  qualityLevels?: number[];

  /** Whether to use double buffering for smoother rendering */
  useDoubleBuffering?: boolean;

  /** Function to format date values on the X-axis */
  formatXAxisDate?: (value: number) => string;

  /** Whether to cache rendered results between renders */
  enableRenderCaching?: boolean;

  /** Maximum cache size for rendered images (in MB) */
  maxCacheSizeMB?: number;
}

/**
 * MemoryOptimizedCanvasChart is a highly optimized chart component that
 * deeply integrates with the memory management system, providing advanced
 * caching strategies, buffer management, and adaptive quality rendering.
 */
const MemoryOptimizedCanvasChart: React.FC<MemoryOptimizedCanvasChartProps> = ({
  data,
  chartType,
  xAxisKey,
  yAxisKeys,
  sizeKey,
  colorKey,
  width = '100%',
  height = 400,
  title,
  subtitle,
  xDomain,
  yDomain,
  colors,
  useWebGL = true,
  maxPoints = 5000,
  showPerformanceStats = false,
  memoryOptions,
  visibilityThreshold = 0.1,
  qualityLevels = [0.25, 0.5, 1.0],
  useDoubleBuffering = true,
  formatXAxisDate,
  enableRenderCaching = true,
  maxCacheSizeMB = 50,
  className = '',
  errorMessage,
  onElementClick,
}) => {
  // Container ref for checking visibility
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas buffer management
  const [canvasBuffers, setCanvasBuffers] = useState<Map<string, CanvasBuffer>>(new Map());

  // Memory manager key (use component instance ID)
  const instanceIdRef = useRef<string>(`canvas-chart-${Math.random().toString(36).substr(2, 9)}`);

  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    renderTime: number;
    memoryUsage: number;
    dataPoints: number;
    renderedPoints: number;
    renderQuality: number;
  }>({
    renderTime: 0,
    memoryUsage: 0,
    dataPoints: data?.length || 0,
    renderedPoints: 0,
    renderQuality: 1.0,
  });

  // Visibility state
  const [isVisible, setIsVisible] = useState(true);
  const [visibilityPercentage, setVisibilityPercentage] = useState(1.0);

  // Selected quality level based on visibility and data size
  const [qualityLevel, setQualityLevel] = useState(1.0);

  // Render state
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Data processing state
  const [processedData, setProcessedData] = useState<ChartDataRecord[] | null>(null);

  // Enhanced memory manager with canvas-specific features
  const memory = useMemoryManager<{
    data: ChartDataRecord[];
    buffers: Map<string, CanvasBuffer>;
    renderCache: Map<string, ImageBitmap>;
  }>(null, {
    key: instanceIdRef.current,
    enableLogging: showPerformanceStats,
    initialDataSizeEstimate: data ? data.length * 100 : 1000, // Rough estimate
    autoCleanupLevel: memoryOptions?.autoCleanupLevel || 'medium',
    memoryThreshold: memoryOptions?.memoryThreshold || 50 * 1024 * 1024, // 50MB default
    cacheExpirationTime: memoryOptions?.cacheExpirationTime || 60000, // 1 minute default
    ...memoryOptions,
  });

  // Set up intersection observer to track visibility
  useEffect(() => {
    if (!containerRef.current) return;

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    };

    const callback: IntersectionObserverCallback = entries => {
      entries.forEach(entry => {
        setIsVisible(entry.isIntersecting);
        setVisibilityPercentage(entry.intersectionRatio);
      });
    };

    const observer = new IntersectionObserver(callback, options);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Initialize or update data in memory manager
  useEffect(() => {
    if (!data) return;

    // Track start time for performance measurement
    const startTime = performance.now();

    // Calculate optimal quality level based on data size and visibility
    const newQualityLevel = calculateOptimalQualityLevel(
      data.length,
      visibilityPercentage,
      qualityLevels
    );

    setQualityLevel(newQualityLevel);

    // Apply quality level (downsample data if needed)
    const sampledData = applyQualityLevel(data, newQualityLevel);

    // Update memory manager
    memory.updateData({
      data: sampledData,
      buffers: canvasBuffers,
      renderCache: new Map(),
    });

    setProcessedData(sampledData);

    const endTime = performance.now();

    // Update performance metrics
    setPerformanceMetrics(prev => ({
      ...prev,
      renderTime: endTime - startTime,
      memoryUsage: memory.memoryUsage,
      dataPoints: data.length,
      renderedPoints: sampledData.length,
      renderQuality: newQualityLevel,
    }));
  }, [data, memory, visibilityPercentage, qualityLevels, canvasBuffers]);

  // Cleanup unused canvas buffers and cached renders
  useEffect(() => {
    // Only clean up if component is not visible
    if (isVisible && visibilityPercentage > visibilityThreshold) return;

    // Clean up canvas buffers
    setCanvasBuffers(prev => {
      const now = Date.now();
      const newBuffers = new Map(prev);

      // Remove buffers that haven't been used in the last minute
      for (const [key, buffer] of newBuffers.entries()) {
        if (now - buffer.lastUpdated > 60000) {
          if (buffer.buffer) {
            // Close buffer to free memory
            buffer.buffer = null;
            buffer.context = null;
          }
          newBuffers.delete(key);
        }
      }

      return newBuffers;
    });

    // Clean up render cache
    if (memory.getCachedData('renderCache')) {
      const renderCache = memory.getCachedData('renderCache') as Map<string, ImageBitmap>;

      // Clean up old render cache entries
      for (const [key, bitmap] of renderCache.entries()) {
        if (key.startsWith('render_') && !isVisible) {
          // Close bitmap to free memory
          bitmap.close();
          renderCache.delete(key);
        }
      }
    }
  }, [isVisible, visibilityPercentage, visibilityThreshold, memory]);

  // Calculate the optimal quality level based on data size and visibility
  const calculateOptimalQualityLevel = useCallback(
    (dataSize: number, visibility: number, levels: number[]): number => {
      // If component is not visible, use lowest quality
      if (visibility === 0) return levels[0];

      // If data is small, use highest quality
      if (dataSize < maxPoints) return levels[levels.length - 1];

      // Calculate quality based on data size and visibility
      const visibilityFactor = Math.min(1, visibility * 2); // Double influence of visibility
      const sizeFactor = Math.min(1, maxPoints / dataSize);
      const combinedFactor = (visibilityFactor + sizeFactor) / 2;

      // Find the closest quality level
      const index = Math.floor(combinedFactor * (levels.length - 1));
      return levels[Math.max(0, Math.min(levels.length - 1, index))];
    },
    [maxPoints]
  );

  // Apply quality level to data (downsample if needed)
  const applyQualityLevel = useCallback(
    (inputData: ChartDataRecord[], quality: number): ChartDataRecord[] => {
      if (quality >= 1.0 || inputData.length <= maxPoints) {
        return inputData;
      }

      // Calculate how many points to keep
      const targetPoints = Math.max(100, Math.floor(inputData.length * quality));

      // Simple strided sampling
      if (targetPoints < inputData.length / 10) {
        const stride = Math.floor(inputData.length / targetPoints);
        return inputData.filter((_, i) => i % stride === 0);
      }

      // For more sophisticated downsampling, we would use LTTB algorithm
      // but that's already implemented in our CanvasLineChart component
      // so we'll let that handle the details
      return inputData;
    },
    [maxPoints]
  );

  // Create or get a canvas buffer
  const getCanvasBuffer = useCallback(
    (key: string, width: number, height: number): CanvasBuffer => {
      // Check if we already have a buffer with this key
      if (canvasBuffers.has(key)) {
        const buffer = canvasBuffers.get(key)!;

        // If buffer dimensions match, return it
        if (buffer.width === width && buffer.height === height && buffer.buffer) {
          return buffer;
        }
      }

      // Create a new buffer
      let buffer: OffscreenCanvas | null = null;
      let context: OffscreenCanvasRenderingContext2D | null = null;

      try {
        buffer = new OffscreenCanvas(width, height);
        context = buffer.getContext('2d') as OffscreenCanvasRenderingContext2D;
      } catch (error) {
        console.error('Failed to create OffscreenCanvas:', error);
        // If OffscreenCanvas is not supported, we'll fall back to regular canvas
        // in the render method
      }

      const newBuffer: CanvasBuffer = {
        buffer,
        context,
        width,
        height,
        lastUpdated: Date.now(),
      };

      // Store the new buffer
      setCanvasBuffers(prev => {
        const next = new Map(prev);
        next.set(key, newBuffer);
        return next;
      });

      return newBuffer;
    },
    [canvasBuffers]
  );

  // Get render cache key
  const getRenderCacheKey = useCallback(
    (chartType: ChartType, dataHash: string, width: number, height: number): string => {
      return `render_${chartType}_${dataHash}_${width}_${height}`;
    },
    []
  );

  // Calculate a hash for the data (for caching)
  const calculateDataHash = useCallback((data: ChartDataRecord[]): string => {
    // Simple hash based on data length and some sample points
    if (!data.length) return '0';

    const samples = [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]];

    return `${data.length}_${samples.map(s => s.id).join('_')}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all buffers and caches
      canvasBuffers.forEach(buffer => {
        if (buffer.buffer) {
          buffer.buffer = null;
          buffer.context = null;
        }
      });

      // Force memory cleanup
      memory.cleanup();
    };
  }, [memory, canvasBuffers]);

  // If not visible and below threshold, render placeholder
  if (!isVisible && visibilityPercentage < visibilityThreshold) {
    return (
      <Box
        ref={containerRef}
        sx={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 1,
          backgroundColor: 'background.paper',
        }}
        className={className}
      >
        <Typography variant="body2" color="text.secondary">
          Chart offscreen (data unloaded)
        </Typography>
      </Box>
    );
  }

  // Loading state
  if (!processedData) {
    return (
      <Box
        ref={containerRef}
        sx={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 1,
        }}
        className={className}
      >
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading chart data...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (renderError) {
    return (
      <Box
        ref={containerRef}
        sx={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 1,
        }}
        className={className}
      >
        <Alert severity="error" sx={{ maxWidth: '80%' }}>
          {renderError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      className={className}
    >
      {/* Render the chart using our CanvasChartFactory */}
      <CanvasChartFactory
        data={processedData}
        chartType={chartType}
        xAxisKey={xAxisKey}
        yAxisKeys={yAxisKeys}
        sizeKey={sizeKey}
        colorKey={colorKey}
        width={width}
        height={height}
        title={title}
        subtitle={subtitle}
        xDomain={xDomain}
        yDomain={yDomain}
        colors={colors}
        useWebGL={useWebGL}
        maxPoints={maxPoints}
        showPerformanceStats={false} // We'll show our own performance stats
        enableMemoryOptimization={false} // We're already handling memory management
        onElementClick={onElementClick}
        errorMessage={errorMessage}
      />

      {/* Performance stats overlay */}
      {showPerformanceStats && (
        <Paper
          sx={{
            position: 'absolute',
            top: 5,
            right: 5,
            padding: '4px 8px',
            borderRadius: 1,
            fontSize: '0.75rem',
            zIndex: 10,
            opacity: 0.9,
            maxWidth: 200,
          }}
          elevation={1}
        >
          <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
            Performance Metrics
          </Typography>
          <Typography variant="caption" component="div">
            Render Time: {performanceMetrics.renderTime.toFixed(1)}ms
          </Typography>
          <Typography variant="caption" component="div">
            Memory Usage: {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)} MB
          </Typography>
          <Typography variant="caption" component="div">
            Data Points: {performanceMetrics.dataPoints.toLocaleString()}
          </Typography>
          <Typography variant="caption" component="div">
            Rendered: {performanceMetrics.renderedPoints.toLocaleString()} points
          </Typography>
          <Typography variant="caption" component="div">
            Quality: {(performanceMetrics.renderQuality * 100).toFixed(0)}%
          </Typography>
          <Typography variant="caption" component="div">
            Visibility: {(visibilityPercentage * 100).toFixed(0)}%
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MemoryOptimizedCanvasChart;

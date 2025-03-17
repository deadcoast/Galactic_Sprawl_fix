import * as React from "react";
import { useMemo, useState, useEffect, useRef } from 'react';
import { CanvasRenderer } from './renderers/CanvasRenderer';
import { SVGRenderer } from './renderers/SVGRenderer';
import { WebGLRenderer } from './renderers/WebGLRenderer';
import { errorLoggingService, ErrorType } from '../services/ErrorLoggingService';

/**
 * Common chart data point interface
 */
export interface ChartDataPoint {
  x: number | string | Date;
  y: number;
  [key: string]: unknown;
}

/**
 * Chart data interface
 */
export interface ChartData {
  datasets: {
    label: string;
    data: ChartDataPoint[];
    color?: string;
    [key: string]: unknown;
  }[];
  annotations?: {
    type: 'line' | 'box' | 'point';
    position: { x?: number | string | Date; y?: number };
    color?: string;
    label?: string;
    [key: string]: unknown;
  }[];
}

/**
 * Chart axes configuration
 */
export interface ChartAxes {
  x: {
    type: 'linear' | 'time' | 'category' | 'log';
    label?: string;
    min?: number | string | Date;
    max?: number | string | Date;
    tickCount?: number;
    tickFormat?: (value: unknown) => string;
    grid?: boolean;
  };
  y: {
    type: 'linear' | 'log';
    label?: string;
    min?: number;
    max?: number;
    tickCount?: number;
    tickFormat?: (value: number) => string;
    grid?: boolean;
  };
}

/**
 * Chart legend configuration
 */
export interface ChartLegend {
  visible: boolean;
  position: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

/**
 * Chart tooltip configuration
 */
export interface ChartTooltip {
  enabled: boolean;
  mode: 'point' | 'nearest' | 'dataset';
  intersect?: boolean;
  format?: (point: ChartDataPoint, dataset: ChartData['datasets'][0]) => string;
}

/**
 * Chart animation configuration
 */
export interface ChartAnimation {
  enabled: boolean;
  duration?: number;
  easing?: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
}

/**
 * Chart options interface
 */
export interface ChartOptions {
  width?: number | string;
  height?: number | string;
  renderer?: 'canvas' | 'svg' | 'webgl';
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  axes?: ChartAxes;
  legend?: ChartLegend;
  tooltip?: ChartTooltip;
  animation?: ChartAnimation;
  backgroundColor?: string;
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  enablePanning?: boolean;
  enableZooming?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  memoryOptimized?: boolean;
  renderOptimization?: boolean;
  optimizationThreshold?: number;
}

/**
 * Default chart options
 */
const DEFAULT_CHART_OPTIONS: ChartOptions = {
  width: '100%',
  height: 300,
  renderer: 'canvas',
  responsive: true,
  maintainAspectRatio: true,
  axes: {
    x: {
      type: 'linear',
      grid: true,
    },
    y: {
      type: 'linear',
      grid: true,
    }
  },
  legend: {
    visible: true,
    position: 'top',
    align: 'center',
  },
  tooltip: {
    enabled: true,
    mode: 'nearest',
    intersect: true,
  },
  animation: {
    enabled: true,
    duration: 300,
    easing: 'easeInOut',
  },
  backgroundColor: 'transparent',
  padding: {
    top: 10,
    right: 10,
    bottom: 20,
    left: 30,
  },
  enablePanning: false,
  enableZooming: false,
  theme: 'light',
  memoryOptimized: false,
  renderOptimization: true,
  optimizationThreshold: 1000,
};

/**
 * Chart renderer interface
 */
export interface ChartRenderer {
  render: (
    container: HTMLElement,
    data: ChartData,
    options: ChartOptions,
    type: ChartType
  ) => void;
  update: (
    container: HTMLElement,
    data: ChartData,
    options: ChartOptions,
    type: ChartType
  ) => void;
  destroy: () => void;
  getStatus: () => { isInitialized: boolean; lastRenderTime?: number };
}

/**
 * Chart type
 */
export type ChartType = 'line' | 'bar' | 'scatter' | 'area' | 'pie' | 'radar' | 'heatmap';

/**
 * Chart component props
 */
export interface ChartProps {
  data: ChartData;
  options?: Partial<ChartOptions>;
  type: ChartType;
  className?: string;
  onRender?: (renderer: ChartRenderer) => void;
  onError?: (error: Error) => void;
}

/**
 * Chart component that uses a strategy pattern for different rendering methods
 */
export const Chart: React.FC<ChartProps> = ({
  data,
  options = {},
  type,
  className = '',
  onRender,
  onError,
}) => {
  // Merge options with defaults
  const mergedOptions: ChartOptions = useMemo(() => ({
    ...DEFAULT_CHART_OPTIONS,
    ...options,
  }), [options]);

  // Container ref for rendering
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Chart renderer ref
  const rendererRef = useRef<ChartRenderer | null>(null);
  
  // Error state
  const [error, setError] = useState<Error | null>(null);
  
  // Auto-select renderer based on data size and device capabilities if not specified
  const renderer = useMemo(() => {
    // Count total data points
    const totalDataPoints = data.datasets.reduce((acc, dataset) => acc + dataset.data.length, 0);
    
    // If renderer is explicitly set, use that
    if (mergedOptions.renderer) {
      return mergedOptions.renderer;
    }
    
    // Auto-select based on data size and optimization settings
    if (mergedOptions.memoryOptimized || totalDataPoints > (mergedOptions.optimizationThreshold || 1000)) {
      // Check if WebGL is available
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          return 'webgl';
        }
      } catch (e) {
        // WebGL not available, fall back to canvas
      }
      
      return 'canvas';
    }
    
    // For smaller datasets, SVG provides better interactivity
    return 'svg';
  }, [mergedOptions.renderer, mergedOptions.memoryOptimized, mergedOptions.optimizationThreshold, data]);
  
  // Initialize renderer
  useEffect(() => {
    if (!containerRef.current) return;
    
    try {
      // Destroy previous renderer if it exists
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
      
      // Create new renderer based on selected strategy
      switch (renderer) {
        case 'canvas':
          rendererRef.current = new CanvasRenderer();
          break;
        case 'webgl':
          rendererRef.current = new WebGLRenderer();
          break;
        case 'svg':
        default:
          rendererRef.current = new SVGRenderer();
          break;
      }
      
      // Initial render
      rendererRef.current.render(containerRef.current, data, mergedOptions, type);
      
      // Call onRender callback if provided
      if (onRender) {
        onRender(rendererRef.current);
      }
      
      // Clear any previous errors
      if (error) {
        setError(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Log error
      errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
        component: 'Chart',
        renderer,
        chartType: type,
        dataSize: data.datasets.reduce((acc, dataset) => acc + dataset.data.length, 0),
      });
      
      // Set error state
      setError(error);
      
      // Call onError callback if provided
      if (onError) {
        onError(error);
      }
    }
    
    // Cleanup
    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [renderer, type]);
  
  // Update chart when data or options change
  useEffect(() => {
    if (!containerRef.current || !rendererRef.current) return;
    
    try {
      rendererRef.current.update(containerRef.current, data, mergedOptions, type);
      
      // Clear any previous errors
      if (error) {
        setError(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Log error
      errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
        component: 'Chart',
        renderer,
        chartType: type,
        dataSize: data.datasets.reduce((acc, dataset) => acc + dataset.data.length, 0),
        action: 'update',
      });
      
      // Set error state
      setError(error);
      
      // Call onError callback if provided
      if (onError) {
        onError(error);
      }
    }
  }, [data, mergedOptions]);
  
  // Handle container resize
  useEffect(() => {
    if (!containerRef.current || !rendererRef.current || !mergedOptions.responsive) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && rendererRef.current) {
        try {
          rendererRef.current.update(containerRef.current, data, mergedOptions, type);
        } catch (err) {
          console.error('Error resizing chart:', err);
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [mergedOptions.responsive]);
  
  // Fallback UI for errors
  if (error) {
    return (
      <div 
        className={`chart-error ${className}`}
        style={{
          width: mergedOptions.width,
          height: mergedOptions.height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #ff6b6b',
          borderRadius: '4px',
          padding: '1rem',
          backgroundColor: '#fff1f1',
          color: '#d63031',
        }}
      >
        <h4>Chart Error</h4>
        <p style={{ fontSize: '0.875rem' }}>{error.message}</p>
        <button 
          onClick={() => {
            setError(null);
            if (containerRef.current && rendererRef.current) {
              try {
                rendererRef.current.render(containerRef.current, data, mergedOptions, type);
              } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
              }
            }
          }}
          style={{
            marginTop: '0.5rem',
            padding: '0.25rem 0.75rem',
            border: '1px solid #d63031',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#d63031',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={`chart-container ${className}`}
      style={{
        width: mergedOptions.width,
        height: mergedOptions.height,
        position: 'relative',
      }}
      data-chart-type={type}
      data-chart-renderer={renderer}
    />
  );
};

export default Chart;
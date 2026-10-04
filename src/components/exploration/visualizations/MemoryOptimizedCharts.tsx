import { ComponentType } from 'react';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../../services/logging/ErrorLoggingService';
import { BaseChartProps } from './BaseChart';
import { ViewportOptimizedHeatMap } from './ViewportOptimizedHeatMap';
import { ViewportOptimizedScatterPlot } from './ViewportOptimizedScatterPlot';
import { VirtualizedLineChart } from './VirtualizedLineChart';
import withMemoryManagement from './withMemoryManagement';

/**
 * Memory-optimized version of VirtualizedLineChart that includes automatic
 * memory management, cleanup on unmount, and caching capabilities.
 */
export const MemoryOptimizedLineChart = withMemoryManagement(VirtualizedLineChart, {
  // Log memory usage to console during development
  enableLogging: process.env.NODE_ENV === 'development',
  // Show memory stats in the UI during development
  showMemoryStats: process.env.NODE_ENV === 'development',
  // Set memory threshold to 25MB
  memoryThreshold: 25 * 1024 * 1024,
  // Set auto cleanup level to medium
  autoCleanupLevel: 'medium',
  // Cache expiration time (5 minutes)
  cacheExpirationTime: 5 * 60 * 1000,
});

/**
 * Memory-optimized version of ViewportOptimizedScatterPlot with memory management
 */
export const MemoryOptimizedScatterPlot = withMemoryManagement(ViewportOptimizedScatterPlot, {
  // Log memory usage to console during development
  enableLogging: process.env.NODE_ENV === 'development',
  // Show memory stats in the UI during development
  showMemoryStats: process.env.NODE_ENV === 'development',
  // Set memory threshold to 20MB
  memoryThreshold: 20 * 1024 * 1024,
  // Set auto cleanup level to low (less aggressive)
  autoCleanupLevel: 'low',
  // Cache expiration time (10 minutes)
  cacheExpirationTime: 10 * 60 * 1000,
});

/**
 * Memory-optimized version of ViewportOptimizedHeatMap with memory management
 */
export const MemoryOptimizedHeatMap = withMemoryManagement(
  ViewportOptimizedHeatMap as unknown as ComponentType<BaseChartProps>,
  {
    // Log memory usage to console during development
    enableLogging: process.env.NODE_ENV === 'development',
    // Show memory stats in the UI during development
    showMemoryStats: process.env.NODE_ENV === 'development',
    // Set memory threshold to 30MB (heat maps can be large)
    memoryThreshold: 30 * 1024 * 1024,
    // Set auto cleanup level to medium
    autoCleanupLevel: 'medium',
    // Cache expiration time (5 minutes)
    cacheExpirationTime: 5 * 60 * 1000,
  }
);

/**
 * Helper function to reduce SVG nodes in chart data
 *
 * This function reduces the number of data points based on the visible dimensions
 * to prevent excessive DOM nodes and improve SVG rendering performance.
 *
 * @param data The original data array
 * @param maxPoints Maximum number of points to include
 * @param width Chart width in pixels
 * @param height Chart height in pixels
 * @returns Reduced dataset optimized for the given dimensions
 */
export function optimizeSvgNodeCount<T extends Record<string, unknown>>(
  data: T[],
  maxPoints = 1000,
  width = 800,
  height = 400
): T[] {
  if (!data || data?.length <= maxPoints) {
    return data;
  }

  // Calculate optimal reduction based on dimensions
  // The idea is to keep enough points for visual fidelity based on available pixels
  const pixelDensity = (width * height) / maxPoints;
  const optimalDataSize = Math.min(
    data?.length,
    Math.max(maxPoints, Math.floor((width * height) / pixelDensity))
  );

  // Simple sampling approach for demonstration
  // In a real application, you might want to use a more sophisticated algorithm
  // like the LTTB algorithm from VirtualizedLineChart
  const samplingInterval = Math.ceil(data?.length / optimalDataSize);

  return data?.filter((_, index) => index % samplingInterval === 0);
}

/**
 * Utility function to clean up SVG elements from the DOM when a chart is unmounted
 *
 * This is important because charts with complex SVG can leave detached DOM nodes
 * that aren't properly garbage collected
 *
 * @param containerSelector The CSS selector for the chart container
 */
export function cleanupChartSvgNodes(containerSelector: string): void {
  try {
    // Find the chart container
    const container = document.querySelector(containerSelector);
    if (!container) {
      return;
    }

    // Find all SVG elements in the container
    const svgElements = container.querySelectorAll('svg');

    // Remove each SVG element
    svgElements.forEach(svg => {
      if (svg.parentNode) {
        svg.parentNode.removeChild(svg);
      }
    });

    // Force garbage collection hint (this doesn't actually force GC)
    // window.gc is not a standard property, but some browsers support it
    if (typeof window !== 'undefined' && 'gc' in window) {
      // Call the garbage collector if available
      (window as { gc: () => void }).gc();
    }
  } catch (e) {
    // Use correctly imported service
    errorLoggingService.logError(
      e instanceof Error ? e : new Error('Error cleaning up chart SVG nodes'),
      ErrorType.RUNTIME,
      ErrorSeverity.LOW,
      { componentName: 'MemoryOptimizedCharts', action: 'cleanupChartSvgNodes', containerSelector }
    );
  }
}

/**
 * Hook for tracking memory usage in different parts of the application
 * This can be used to monitor overall application memory footprint
 */
export function useApplicationMemoryMonitor() {
  // Implementation would depend on browser capabilities
  // For demonstration, we're returning placeholder values

  return {
    totalJSHeapSize: 0,
    usedJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    isSupported: false,
  };
}

export { cleanupChartSvgNodes as cleanupSvgNodes, optimizeSvgNodeCount as reduceSvgNodes };

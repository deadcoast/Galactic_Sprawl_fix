import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DataVisualizationShaderConfig,
  DataVisualizationShaderType,
  WebGLShaderManager,
} from '../../../lib/optimization/WebGLShaderManager';
import { Position } from '../../../types/core/Position';

export interface DataPoint {
  x: number;
  y: number;
  value: number;
  [key: string]: unknown;
}

export interface DataHighlightVisualizationProps {
  /**
   * Data points to visualize
   * Each point should have at least x, y, and value properties
   */
  data: DataPoint[];

  /**
   * Width of the visualization
   */
  width: number;

  /**
   * Height of the visualization
   */
  height: number;

  /**
   * Visualization type
   */
  visualizationType?: DataVisualizationShaderType;

  /**
   * Color palette for the visualization
   */
  colors?: string[];

  /**
   * Range of values to highlight
   */
  highlightRange?: [number, number];

  /**
   * Whether to animate the visualization
   */
  animate?: boolean;

  /**
   * Animation speed (1.0 is default)
   */
  animationSpeed?: number;

  /**
   * Visual intensity (1.0 is default)
   */
  intensity?: number;

  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Callback when a data point is clicked
   */
  onDataPointClick?: (dataPoint: DataPoint, index: number) => void;

  /**
   * Whether to show a legend
   */
  showLegend?: boolean;

  /**
   * Custom shader configuration overrides
   */
  shaderConfig?: Partial<DataVisualizationShaderConfig>;
}

/**
 * DataHighlightVisualization Component
 *
 * A WebGL-based visualization component that uses shader effects to highlight data?.
 * Supports multiple visualization types including heatmaps, contours, and point clusters.
 */
export const DataHighlightVisualization: React.FC<DataHighlightVisualizationProps> = ({
  data,
  width,
  height,
  visualizationType = DataVisualizationShaderType.HIGHLIGHT,
  colors = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099'],
  highlightRange = [0.7, 1.0],
  animate = true,
  animationSpeed = 1.0,
  intensity = 1.0,
  className = '',
  onDataPointClick,
  showLegend = false,
  shaderConfig,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shaderManagerRef = useRef<WebGLShaderManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Prepare data for WebGL rendering
  const { positions, dataValues, dataRange } = useMemo(() => {
    const pos: Position[] = [];
    const values = new Float32Array(data?.length);
    let min = Infinity;
    let max = -Infinity;

    data?.forEach((point, index) => {
      pos.push({ x: point.x, y: point.y });
      values[index] = point.value;

      min = Math.min(min, point.value);
      max = Math.max(max, point.value);
    });

    return {
      positions: pos,
      dataValues: values,
      dataRange: [min, max] as [number, number],
    };
  }, [data]);

  // Initialize WebGL shader manager
  useEffect(() => {
    if (!canvasRef.current) return;

    const manager = new WebGLShaderManager();
    const success = manager.initialize(canvasRef.current);

    if (success) {
      shaderManagerRef.current = manager;
      setIsInitialized(true);
    }

    return () => {
      if (shaderManagerRef.current) {
        shaderManagerRef.current.dispose();
        shaderManagerRef.current = null;
      }
    };
  }, []);

  // Handle animation and rendering
  useEffect(() => {
    if (!isInitialized || !shaderManagerRef.current) return;

    const manager = shaderManagerRef.current;

    // Create shader configuration
    const config: DataVisualizationShaderConfig = {
      type: visualizationType,
      colors,
      intensity,
      resolution: [width, height],
      animate,
      animationSpeed,
      highlightRange,
      dataRange,
      ...shaderConfig,
    };

    // Render function
    const renderFrame = () => {
      manager.renderDataVisualization(config, dataValues, positions, width, height);
    };

    // Single render if not animating
    if (!animate) {
      renderFrame();
      return;
    }

    // Start animation loop
    manager.startAnimationLoop(renderFrame);

    return () => {
      manager.stopAnimationLoop();
    };
  }, [
    isInitialized,
    visualizationType,
    colors,
    intensity,
    width,
    height,
    animate,
    animationSpeed,
    highlightRange,
    dataRange,
    positions,
    dataValues,
    shaderConfig,
  ]);

  // Handle canvas clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onDataPointClick || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find nearest data point
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    data?.forEach((point, index) => {
      const dx = point.x - x;
      const dy = point.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < nearestDistance && distance < 20) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestIndex !== -1) {
      onDataPointClick(data[nearestIndex], nearestIndex);
    }
  };

  // Render legend if requested
  const renderLegend = () => {
    if (!showLegend) return null;

    return (
      <div className="bg-opacity-70 absolute right-2 bottom-2 rounded bg-black p-2 text-xs text-white">
        <div className="flex flex-col gap-1">
          <div className="font-bold">Legend</div>
          <div className="flex items-center">
            <div
              className="h-4 w-full rounded"
              style={{
                background: `linear-gradient(to right, ${colors.join(', ')})`,
              }}
            />
          </div>
          <div className="flex justify-between">
            <span>{dataRange[0].toFixed(1)}</span>
            <span>{dataRange[1].toFixed(1)}</span>
          </div>
          {highlightRange && (
            <div className="text-yellow-300">
              Highlight: {highlightRange[0].toFixed(1)} - {highlightRange[1].toFixed(1)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block"
        onClick={handleCanvasClick}
      />
      {renderLegend()}
    </div>
  );
};

// Export visualization presets
export const DataVisualizationPresets = {
  /**
   * Heatmap visualization preset
   */
  heatmap: (
    props: Omit<DataHighlightVisualizationProps, 'visualizationType'>
  ): DataHighlightVisualizationProps => ({
    ...props,
    visualizationType: DataVisualizationShaderType.HEATMAP,
    colors: props?.colors ?? ['#000080', '#0000ff', '#00ffff', '#ffff00', '#ff0000'],
  }),

  /**
   * Density visualization preset
   */
  density: (
    props: Omit<DataHighlightVisualizationProps, 'visualizationType'>
  ): DataHighlightVisualizationProps => ({
    ...props,
    visualizationType: DataVisualizationShaderType.DENSITY,
    colors: props?.colors ?? ['#000044', '#000088', '#0000ff', '#4444ff', '#8888ff'],
    intensity: props?.intensity ?? 0.7,
  }),

  /**
   * Highlight visualization preset
   */
  highlight: (
    props: Omit<DataHighlightVisualizationProps, 'visualizationType'>
  ): DataHighlightVisualizationProps => ({
    ...props,
    visualizationType: DataVisualizationShaderType.HIGHLIGHT,
    colors: props?.colors ?? ['#666666', '#888888', '#aaaaaa', '#cccccc', '#ffffff'],
    highlightRange: props?.highlightRange ?? [0.8, 1.0],
    intensity: props?.intensity ?? 0.9,
  }),

  /**
   * Flow visualization preset
   */
  flow: (
    props: Omit<DataHighlightVisualizationProps, 'visualizationType'>
  ): DataHighlightVisualizationProps => ({
    ...props,
    visualizationType: DataVisualizationShaderType.FLOW,
    colors: props?.colors ?? ['#003366', '#0066cc', '#0099ff', '#66ccff', '#99ddff'],
    animate: true,
    animationSpeed: props?.animationSpeed ?? 1.5,
  }),

  /**
   * Contour visualization preset
   */
  contour: (
    props: Omit<DataHighlightVisualizationProps, 'visualizationType'>
  ): DataHighlightVisualizationProps => ({
    ...props,
    visualizationType: DataVisualizationShaderType.CONTOUR,
    colors: props?.colors ?? ['#000000', '#333333', '#666666', '#999999', '#ffffff'],
    intensity: props?.intensity ?? 0.8,
  }),
};

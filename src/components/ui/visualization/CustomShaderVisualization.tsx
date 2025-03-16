import * as React from "react";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useComponentLifecycle } from '../../../hooks/ui/useComponentLifecycle';
import { useComponentRegistration } from '../../../hooks/ui/useComponentRegistration';
import {
  DataVisualizationShaderConfig,
  DataVisualizationShaderType,
  ShaderUniform,
  WebGLShaderManager,
} from '../../../lib/optimization/WebGLShaderManager';
import { Position } from '../../../types/core/Position';

export interface CustomShaderDefinition {
  vertexShader?: string;
  fragmentShader?: string;
  uniforms?: Record<string, ShaderUniform>;
}

export interface DataPoint {
  x: number;
  y: number;
  value: number;
  [key: string]: unknown;
}

export interface CustomShaderVisualizationProps {
  /**
   * Data points to visualize
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
   * Custom shader definition
   */
  shaderDefinition: CustomShaderDefinition;

  /**
   * Base visualization type to extend
   */
  baseVisualizationType?: DataVisualizationShaderType;

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
}

/**
 * CustomShaderVisualization Component
 *
 * A component that allows users to define custom WebGL shaders for data visualization.
 * Extends the base WebGLShaderManager with user-defined shader effects.
 */
export const CustomShaderVisualization: React.FC<CustomShaderVisualizationProps> = ({
  data,
  width,
  height,
  shaderDefinition,
  baseVisualizationType = DataVisualizationShaderType.CUSTOM,
  animate = true,
  animationSpeed = 1.0,
  intensity = 1.0,
  className = '',
  onDataPointClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shaderManagerRef = useRef<WebGLShaderManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Register with component registry
  useComponentRegistration({
    type: 'CustomShaderVisualization',
    eventSubscriptions: ['RESOURCE_UPDATED', 'RESOURCE_FLOW_UPDATED'],
    updatePriority: 'high',
  });

  // Prepare data for WebGL rendering
  const { positions, dataValues, dataRange } = useMemo(() => {
    const pos: Position[] = [];
    const values = new Float32Array(data.length);
    let min = Infinity;
    let max = -Infinity;

    data.forEach((point, index) => {
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

  // Handle component lifecycle
  useComponentLifecycle({
    onMount: () => {
      console.warn('CustomShaderVisualization mounted');
    },
    onUnmount: () => {
      console.warn('CustomShaderVisualization unmounted');
    },
  });

  // Create shader configuration
  const shaderConfig = useMemo((): DataVisualizationShaderConfig => {
    return {
      type: baseVisualizationType,
      colors: ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099'],
      intensity,
      resolution: [width, height],
      animate,
      animationSpeed,
      dataRange,
      customUniforms: shaderDefinition.uniforms,
      customVertexShader: shaderDefinition.vertexShader,
      customFragmentShader: shaderDefinition.fragmentShader,
    };
  }, [
    baseVisualizationType,
    intensity,
    width,
    height,
    animate,
    animationSpeed,
    dataRange,
    shaderDefinition,
  ]);

  // Handle animation and rendering
  useEffect(() => {
    if (!isInitialized || !shaderManagerRef.current) return;

    const manager = shaderManagerRef.current;

    // Render function
    const renderFrame = () => {
      manager.renderDataVisualization(shaderConfig, dataValues, positions, width, height);
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
  }, [isInitialized, shaderConfig, dataValues, positions, width, height, animate]);

  // Handle canvas clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onDataPointClick || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find nearest data point
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    data.forEach((point, index) => {
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

  return (
    <div
      ref={containerRef}
      className={`custom-shader-visualization ${className}`}
      style={{ width, height, position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default CustomShaderVisualization;

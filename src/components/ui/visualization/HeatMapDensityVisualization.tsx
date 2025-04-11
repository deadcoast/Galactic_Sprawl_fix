import * as React from 'react';
import { useMemo } from 'react';
import {
  DataVisualizationShaderType,
  ShaderUniform,
} from '../../../lib/optimization/WebGLShaderManager';
import {
  DataHighlightVisualization,
  DataHighlightVisualizationProps,
} from './DataHighlightVisualization';

/**
 * Kernel density estimation method
 */
export enum KernelType {
  GAUSSIAN = 'gaussian',
  EPANECHNIKOV = 'epanechnikov',
  UNIFORM = 'uniform',
  TRIANGULAR = 'triangular',
  COSINE = 'cosine',
}

/**
 * Enhanced props for heat map density visualization
 */
export interface HeatMapDensityVisualizationProps
  extends Omit<DataHighlightVisualizationProps, 'visualizationType'> {
  /**
   * Bandwidth for kernel density estimation (affects smoothness)
   * Higher values create smoother heatmaps with less detail
   * Lower values create more detailed heatmaps but may introduce noise
   */
  bandwidth?: number;

  /**
   * Kernel type for density estimation
   */
  kernelType?: KernelType;

  /**
   * Number of interpolation steps between data points
   * Higher values create smoother gradients but reduce performance
   */
  interpolationSteps?: number;

  /**
   * Range of the radius around each point where the heat spreads
   * As a percentage of the visualization dimensions
   */
  heatRadius?: number;

  /**
   * Whether to use logarithmic scale for intensity
   * Useful for datasets with high variance
   */
  useLogScale?: boolean;

  /**
   * Contour levels to show on the heatmap
   * Values between 0 and 1 representing intensity thresholds
   */
  contourLevels?: number[];

  /**
   * Whether to show a grid overlay
   */
  showGrid?: boolean;

  /**
   * Grid cell size as a fraction of the visualization dimensions
   */
  gridSize?: number;
}

/**
 * HeatMapDensityVisualization Component
 *
 * A specialized component for rendering density-based heat maps using WebGL shaders.
 * Provides advanced configuration options for kernel density estimation and heat map rendering.
 */
export const HeatMapDensityVisualization: React.FC<HeatMapDensityVisualizationProps> = ({
  data,
  width,
  height,
  colors = ['#000080', '#0000ff', '#00ffff', '#ffff00', '#ff0000'],
  bandwidth = 0.1,
  kernelType = KernelType.GAUSSIAN,
  interpolationSteps = 32,
  heatRadius = 0.15,
  useLogScale = false,
  contourLevels = [],
  showGrid = false,
  gridSize = 0.05,
  ...restProps
}) => {
  // Process data for density visualization
  const processedData = useMemo(() => {
    // For basic usage, we can just return the data
    // In a more advanced implementation, we might preprocess the data
    // to optimize for density visualization
    return data;
  }, [data]);

  // Prepare custom shader uniforms for the heat map visualization
  const customUniforms = useMemo(() => {
    const uniforms: Record<string, ShaderUniform> = {
      u_bandwidth: {
        type: 'float',
        value: bandwidth,
      },
      u_heatRadius: {
        type: 'float',
        value: heatRadius,
      },
      u_interpolationSteps: {
        type: 'float',
        value: interpolationSteps,
      },
      u_useLogScale: {
        type: 'int',
        value: useLogScale ? 1 : 0,
      },
      u_kernelType: {
        type: 'int',
        value: Object.values(KernelType).indexOf(kernelType),
      },
      u_showGrid: {
        type: 'int',
        value: showGrid ? 1 : 0,
      },
      u_gridSize: {
        type: 'float',
        value: gridSize,
      },
    };

    // Add contour levels if provided
    if (contourLevels.length > 0) {
      const levels = new Float32Array(Math.min(contourLevels.length, 10));
      contourLevels.slice(0, 10).forEach((level, i) => {
        levels[i] = level;
      });

      uniforms.u_contourLevels = {
        type: 'float',
        value: levels,
      };

      uniforms.u_contourLevelCount = {
        type: 'int',
        value: contourLevels.length,
      };
    }

    return uniforms;
  }, [
    bandwidth,
    heatRadius,
    interpolationSteps,
    useLogScale,
    kernelType,
    contourLevels,
    showGrid,
    gridSize,
  ]);

  // Custom fragment shader code for enhanced heat map rendering
  const getCustomFragmentShader = (): string => {
    return `
      precision mediump float;
      
      uniform vec3 u_colors[5];
      uniform int u_colorCount;
      uniform float u_intensity;
      uniform float u_time;
      uniform vec2 u_highlightRange;
      uniform float u_bandwidth;
      uniform float u_heatRadius;
      uniform float u_interpolationSteps;
      uniform int u_useLogScale;
      uniform int u_kernelType;
      uniform int u_contourLevelCount;
      uniform float u_contourLevels[10];
      uniform int u_showGrid;
      uniform float u_gridSize;
      
      varying float v_data;
      varying vec2 v_position;
      varying float v_time;
      
      // Helper function to interpolate colors
      vec3 getColor(float value) {
        if (u_colorCount == 1) return u_colors[0];
        
        float indexFloat = value * float(u_colorCount - 1);
        int index = int(floor(indexFloat));
        float t = fract(indexFloat);
        
        if (index >= u_colorCount - 1) {
          return u_colors[u_colorCount - 1];
        }
        
        return mix(u_colors[index], u_colors[index + 1], t);
      }
      
      // Kernel functions for density estimation
      float gaussianKernel(float distance, float bandwidth) {
        float x = distance / bandwidth;
        return exp(-0.5 * x * x);
      }
      
      float epanechnikovKernel(float distance, float bandwidth) {
        float x = distance / bandwidth;
        if (abs(x) <= 1.0) {
          return 0.75 * (1.0 - x * x);
        }
        return 0.0;
      }
      
      float uniformKernel(float distance, float bandwidth) {
        return distance <= bandwidth ? 1.0 : 0.0;
      }
      
      float triangularKernel(float distance, float bandwidth) {
        float x = distance / bandwidth;
        return abs(x) <= 1.0 ? 1.0 - abs(x) : 0.0;
      }
      
      float cosineKernel(float distance, float bandwidth) {
        float x = distance / bandwidth;
        return abs(x) <= 1.0 ? (cos(x * 3.14159) + 1.0) * 0.5 : 0.0;
      }
      
      // Apply kernel based on type
      float applyKernel(float distance, float bandwidth) {
        if (u_kernelType == 0) {
          return gaussianKernel(distance, bandwidth);
        } else if (u_kernelType == 1) {
          return epanechnikovKernel(distance, bandwidth);
        } else if (u_kernelType == 2) {
          return uniformKernel(distance, bandwidth);
        } else if (u_kernelType == 3) {
          return triangularKernel(distance, bandwidth);
        } else if (u_kernelType == 4) {
          return cosineKernel(distance, bandwidth);
        }
        return gaussianKernel(distance, bandwidth);
      }
      
      // Draw grid lines
      float drawGrid(vec2 position, float cellSize) {
        vec2 grid = fract(position / cellSize);
        float line = step(0.98, grid.x) + step(0.98, grid.y);
        return min(line, 1.0) * 0.2;
      }
      
      void main() {
        // Get base color from data value
        float dataValue = v_data;
        
        // Apply log scale if enabled
        if (u_useLogScale == 1 && dataValue > 0.0) {
          dataValue = log(1.0 + dataValue * 9.0) / log(10.0);
        }
        
        // Get color based on data value
        vec3 color = getColor(dataValue);
        float alpha = u_intensity;
        
        // Adjust based on distance from center point
        float dist = length(gl_PointCoord - vec2(0.5));
        float heatValue = applyKernel(dist, u_bandwidth);
        
        // Fade out at edges
        alpha *= heatValue;
        
        // Add contour lines if specified
        if (u_contourLevelCount > 0) {
          for (int i = 0; i < 10; i++) {
            if (i >= u_contourLevelCount) break;
            
            float level = u_contourLevels[i];
            float contourWidth = 0.02;
            if (abs(dataValue - level) < contourWidth) {
              color = mix(color, vec3(1.0), 0.5);
              alpha = mix(alpha, 1.0, 0.5);
            }
          }
        }
        
        // Apply highlight effect if in range
        if (dataValue >= u_highlightRange.x && dataValue <= u_highlightRange.y) {
          // Pulse effect
          float pulse = 0.5 + 0.5 * sin(u_time * 3.0);
          
          // Brighten color and add glow
          color = mix(color, vec3(1.0), pulse * 0.3);
          alpha = mix(alpha, 1.0, pulse * 0.4);
        }
        
        // Apply grid overlay if enabled
        if (u_showGrid == 1) {
          float gridOverlay = drawGrid(v_position, u_gridSize);
          color = mix(color, vec3(1.0), gridOverlay);
        }
        
        gl_FragColor = vec4(color, alpha);
      }
    `;
  };

  // Re-render whenever custom parameters change
  const customShaderConfig = useMemo(
    () => ({
      customUniforms,
      fragmentShader: getCustomFragmentShader(),
    }),
    [customUniforms]
  );

  return (
    <DataHighlightVisualization
      data={processedData}
      width={width}
      height={height}
      visualizationType={DataVisualizationShaderType.HEATMAP}
      colors={colors}
      shaderConfig={customShaderConfig}
      {...restProps}
    />
  );
};

// Preset configurations for common heat map use cases
export const HeatMapDensityPresets = {
  /**
   * Population density preset - optimized for showing clusters
   */
  populationDensity: (
    props: Omit<HeatMapDensityVisualizationProps, 'kernelType' | 'colors' | 'bandwidth'>
  ): HeatMapDensityVisualizationProps => ({
    ...props,
    kernelType: KernelType.GAUSSIAN,
    colors: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#3182bd'],
    bandwidth: 0.1,
    heatRadius: 0.2,
    useLogScale: true,
  }),

  /**
   * Resource concentration preset - shows where resources are concentrated
   */
  resourceConcentration: (
    props: Omit<HeatMapDensityVisualizationProps, 'kernelType' | 'colors' | 'bandwidth'>
  ): HeatMapDensityVisualizationProps => ({
    ...props,
    kernelType: KernelType.EPANECHNIKOV,
    colors: ['#ffffcc', '#c7e9b4', '#7fcdbb', '#41b6c4', '#225ea8'],
    bandwidth: 0.08,
    interpolationSteps: 64,
    contourLevels: [0.2, 0.4, 0.6, 0.8],
  }),

  /**
   * Anomaly detection preset - highlights outliers
   */
  anomalyDetection: (
    props: Omit<HeatMapDensityVisualizationProps, 'kernelType' | 'colors' | 'bandwidth'>
  ): HeatMapDensityVisualizationProps => ({
    ...props,
    kernelType: KernelType.GAUSSIAN,
    colors: ['#f7f7f7', '#d9d9d9', '#bdbdbd', '#969696', '#525252'],
    bandwidth: 0.05,
    highlightRange: [0.9, 1.0],
    useLogScale: false,
    showGrid: true,
    gridSize: 0.1,
  }),

  /**
   * Performance analysis preset - visualizes performance metrics
   */
  performanceAnalysis: (
    props: Omit<HeatMapDensityVisualizationProps, 'kernelType' | 'colors' | 'bandwidth'>
  ): HeatMapDensityVisualizationProps => ({
    ...props,
    kernelType: KernelType.TRIANGULAR,
    colors: ['#edf8e9', '#c7e9c0', '#a1d99b', '#74c476', '#238b45'],
    bandwidth: 0.12,
    interpolationSteps: 48,
    contourLevels: [0.3, 0.6, 0.9],
  }),

  /**
   * Time-series heat map preset - for temporal data analysis
   */
  timeSeriesAnalysis: (
    props: Omit<HeatMapDensityVisualizationProps, 'kernelType' | 'colors' | 'bandwidth'>
  ): HeatMapDensityVisualizationProps => ({
    ...props,
    kernelType: KernelType.COSINE,
    colors: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#74c476', '#238b45'],
    bandwidth: 0.1,
    interpolationSteps: 32,
    useLogScale: false,
    animate: true,
    animationSpeed: 0.8,
  }),
};

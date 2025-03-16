import * as React from "react";
import { useCallback, useMemo, useState } from 'react';
import { DataVisualizationShaderType } from '../../../lib/optimization/WebGLShaderManager';
import {
  DataHighlightVisualization,
  DataPoint,
  DataVisualizationPresets,
} from './DataHighlightVisualization';

export interface DataHighlightDemoProps {
  /**
   * Width of the demo container
   */
  width?: number;

  /**
   * Height of the demo container
   */
  height?: number;

  /**
   * Optional data to use for visualization
   * If not provided, sample data will be generated
   */
  data?: DataPoint[];

  /**
   * Whether to show interactive controls
   */
  showControls?: boolean;

  /**
   * Default visualization type
   */
  defaultVisualizationType?: DataVisualizationShaderType;

  /**
   * Initial highlight range
   */
  initialHighlightRange?: [number, number];

  /**
   * Optional class name for the container
   */
  className?: string;
}

/**
 * DataHighlightDemo
 *
 * A demo component that showcases different WebGL-based data visualization techniques
 * with interactive controls for adjusting visualization parameters.
 */
export const DataHighlightDemo: React.FC<DataHighlightDemoProps> = ({
  width = 800,
  height = 600,
  data: providedData,
  showControls = true,
  defaultVisualizationType = DataVisualizationShaderType.HIGHLIGHT,
  initialHighlightRange = [0.7, 1.0],
  className = '',
}) => {
  // Generate sample data if none provided
  const sampleData = useMemo(() => {
    if (providedData) return providedData;

    // Generate sample data points in a grid pattern
    const data: DataPoint[] = [];
    const gridSize = 30;
    const stepX = width / gridSize;
    const stepY = height / gridSize;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const posX = x * stepX + stepX / 2;
        const posY = y * stepY + stepY / 2;

        // Create various patterns based on position
        const centerX = width / 2;
        const centerY = height / 2;
        const distToCenter = Math.sqrt(Math.pow(posX - centerX, 2) + Math.pow(posY - centerY, 2));

        // Generate different patterns
        const radialValue = 1 - Math.min(1, distToCenter / (Math.min(width, height) / 2));
        const waveValue = Math.sin(x / 3) * Math.cos(y / 2) * 0.5 + 0.5;
        const gridValue = x % 5 === 0 || y % 5 === 0 ? 0.9 : 0.3;

        // Combine patterns
        const combinedValue = (radialValue * 0.5 + waveValue * 0.5) * (1 - gridValue * 0.3);

        data.push({
          x: posX,
          y: posY,
          value: combinedValue,
          pattern: {
            radial: radialValue,
            wave: waveValue,
            grid: gridValue,
          },
        });
      }
    }

    return data;
  }, [providedData, width, height]);

  // State for visualization parameters
  const [visualizationType, setVisualizationType] =
    useState<DataVisualizationShaderType>(defaultVisualizationType);
  const [highlightRange, setHighlightRange] = useState<[number, number]>(initialHighlightRange);
  const [intensity, setIntensity] = useState(1.0);
  const [animate, setAnimate] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);

  // Handle data point selection
  const handleDataPointClick = useCallback((dataPoint: DataPoint, index: number) => {
    console.warn(`Selected data point at index ${index} with value ${dataPoint.value}`);
    setSelectedPoint(dataPoint);
  }, []);

  // Custom color schemes for different visualization types
  const colorSchemes = useMemo(
    () => ({
      [DataVisualizationShaderType.HEATMAP]: [
        '#000080',
        '#0000ff',
        '#00ffff',
        '#ffff00',
        '#ff0000',
      ],
      [DataVisualizationShaderType.CONTOUR]: [
        '#000000',
        '#333333',
        '#666666',
        '#999999',
        '#ffffff',
      ],
      [DataVisualizationShaderType.POINT_CLUSTER]: [
        '#003300',
        '#006600',
        '#009900',
        '#00cc00',
        '#00ff00',
      ],
      [DataVisualizationShaderType.HIGHLIGHT]: [
        '#333333',
        '#666666',
        '#999999',
        '#cccccc',
        '#ffffff',
      ],
      [DataVisualizationShaderType.DENSITY]: [
        '#000044',
        '#000088',
        '#0000ff',
        '#4444ff',
        '#8888ff',
      ],
      [DataVisualizationShaderType.FLOW]: ['#003366', '#0066cc', '#0099ff', '#66ccff', '#99ddff'],
      [DataVisualizationShaderType.TRANSITION]: [
        '#330033',
        '#660066',
        '#990099',
        '#cc00cc',
        '#ff00ff',
      ],
      [DataVisualizationShaderType.CUSTOM]: ['#444444', '#777777', '#aaaaaa', '#dddddd', '#ffffff'],
    }),
    []
  );

  // Apply the current preset
  const getVisualizationProps = useCallback(() => {
    const baseProps = {
      data: sampleData,
      width,
      height,
      visualizationType,
      highlightRange,
      intensity,
      animate,
      animationSpeed,
      showLegend,
      onDataPointClick: handleDataPointClick,
      colors: colorSchemes[visualizationType],
    };

    // Apply presets based on visualization type
    switch (visualizationType) {
      case DataVisualizationShaderType.HEATMAP:
        return DataVisualizationPresets.heatmap(baseProps);
      case DataVisualizationShaderType.DENSITY:
        return DataVisualizationPresets.density(baseProps);
      case DataVisualizationShaderType.HIGHLIGHT:
        return DataVisualizationPresets.highlight(baseProps);
      case DataVisualizationShaderType.FLOW:
        return DataVisualizationPresets.flow(baseProps);
      case DataVisualizationShaderType.CONTOUR:
        return DataVisualizationPresets.contour(baseProps);
      default:
        return baseProps;
    }
  }, [
    sampleData,
    width,
    height,
    visualizationType,
    highlightRange,
    intensity,
    animate,
    animationSpeed,
    showLegend,
    handleDataPointClick,
    colorSchemes,
  ]);

  // Handle range slider changes
  const handleHighlightMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setHighlightRange(prev => [value, Math.max(value, prev[1])]);
  };

  const handleHighlightMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setHighlightRange(prev => [Math.min(value, prev[0]), value]);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="relative">
        <DataHighlightVisualization {...getVisualizationProps()} />

        {/* Info panel for selected point */}
        {selectedPoint && (
          <div className="absolute left-2 top-2 rounded bg-white bg-opacity-90 p-2 text-sm shadow">
            <div className="mb-1 font-bold">Selected Point</div>
            <div>
              Position: ({selectedPoint.x.toFixed(0)}, {selectedPoint.y.toFixed(0)})
            </div>
            <div>Value: {selectedPoint.value.toFixed(3)}</div>
            <div
              className="mt-1 h-4 w-full rounded"
              style={{
                background: `linear-gradient(to right, ${colorSchemes[visualizationType].join(', ')})`,
              }}
            />
            <div className="flex justify-between text-xs">
              <span>0.0</span>
              <span>1.0</span>
            </div>
          </div>
        )}
      </div>

      {showControls && (
        <div className="mt-4 rounded-md bg-gray-100 p-4">
          <h3 className="mb-3 text-lg font-semibold">Visualization Controls</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Visualization Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Visualization Type
              </label>
              <select
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={visualizationType}
                onChange={e => setVisualizationType(e.target.value as DataVisualizationShaderType)}
              >
                {Object.values(DataVisualizationShaderType).map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Intensity */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Intensity: {intensity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={intensity}
                onChange={e => setIntensity(parseFloat(e.target.value))}
                className="block w-full"
              />
            </div>

            {/* Highlight Range Min */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Highlight Min: {highlightRange[0].toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={highlightRange[0]}
                onChange={handleHighlightMinChange}
                className="block w-full"
              />
            </div>

            {/* Highlight Range Max */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Highlight Max: {highlightRange[1].toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={highlightRange[1]}
                onChange={handleHighlightMaxChange}
                className="block w-full"
              />
            </div>

            {/* Animation Controls */}
            <div>
              <div className="mb-2 flex items-center">
                <input
                  id="animate-toggle"
                  type="checkbox"
                  checked={animate}
                  onChange={e => setAnimate(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="animate-toggle" className="ml-2 block text-sm text-gray-700">
                  Enable Animation
                </label>
              </div>

              {animate && (
                <>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Animation Speed: {animationSpeed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={animationSpeed}
                    onChange={e => setAnimationSpeed(parseFloat(e.target.value))}
                    className="block w-full"
                  />
                </>
              )}
            </div>

            {/* Legend Toggle */}
            <div>
              <div className="flex items-center">
                <input
                  id="legend-toggle"
                  type="checkbox"
                  checked={showLegend}
                  onChange={e => setShowLegend(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="legend-toggle" className="ml-2 block text-sm text-gray-700">
                  Show Legend
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-medium">Tips:</p>
            <ul className="mt-1 list-inside list-disc">
              <li>Click on data points to see detailed information</li>
              <li>Try different visualization types for the same data</li>
              <li>Adjust the highlight range to emphasize different data ranges</li>
              <li>The heatmap visualization is best for showing density distribution</li>
              <li>Contour visualization highlights threshold boundaries</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

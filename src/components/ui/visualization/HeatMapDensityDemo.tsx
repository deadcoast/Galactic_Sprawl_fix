import React, { useCallback, useMemo, useState } from 'react';
import { DataPoint } from './DataHighlightVisualization';
import {
  HeatMapDensityPresets,
  HeatMapDensityVisualization,
  HeatMapDensityVisualizationProps,
  KernelType,
} from './HeatMapDensityVisualization';

export interface HeatMapDensityDemoProps {
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
   * Sample data generation type
   */
  sampleDataType?: 'clusters' | 'gradient' | 'random' | 'grid' | 'spiral';

  /**
   * Whether to show interactive controls
   */
  showControls?: boolean;

  /**
   * Show a side-by-side comparison of different kernels
   */
  showKernelComparison?: boolean;

  /**
   * Optional class name for the container
   */
  className?: string;
}

/**
 * HeatMapDensityDemo
 *
 * A demo component that showcases heat map density visualizations with
 * different kernel types and settings.
 */
export const HeatMapDensityDemo: React.FC<HeatMapDensityDemoProps> = ({
  width = 800,
  height = 500,
  data: providedData,
  sampleDataType = 'clusters',
  showControls = true,
  showKernelComparison = false,
  className = '',
}) => {
  // Generate sample data
  const sampleData = useMemo(() => {
    if (providedData) return providedData;

    // Set parameters based on data type
    const pointCount =
      sampleDataType === 'clusters'
        ? 250
        : sampleDataType === 'gradient'
          ? 500
          : sampleDataType === 'grid'
            ? 400
            : sampleDataType === 'spiral'
              ? 300
              : 1000;

    const data: DataPoint[] = [];

    // Generate different data patterns
    switch (sampleDataType) {
      case 'clusters':
        // Generate clustered data
        const clusterCount = 5;
        const pointsPerCluster = Math.floor(pointCount / clusterCount);

        for (let c = 0; c < clusterCount; c++) {
          // Random cluster center
          const centerX = width * (0.2 + Math.random() * 0.6);
          const centerY = height * (0.2 + Math.random() * 0.6);
          const clusterRadius = Math.min(width, height) * (0.05 + Math.random() * 0.1);

          for (let i = 0; i < pointsPerCluster; i++) {
            // Generate point with normal distribution around center
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * clusterRadius;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            // Add point with higher values near center
            const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            const value = 0.3 + 0.7 * (1 - Math.min(1, distFromCenter / clusterRadius));

            data.push({ x, y, value });
          }
        }
        break;

      case 'gradient':
        // Generate gradient data from left to right
        for (let i = 0; i < pointCount; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const value = x / width; // Value increases from left to right

          data.push({ x, y, value });
        }
        break;

      case 'grid':
        // Generate grid pattern
        const gridSize = Math.ceil(Math.sqrt(pointCount));
        const cellWidth = width / gridSize;
        const cellHeight = height / gridSize;

        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const x = (i + 0.5) * cellWidth;
            const y = (j + 0.5) * cellHeight;

            // Higher values in alternating cells
            const isAlternating = (i + j) % 2 === 0;
            const value = isAlternating ? 0.8 : 0.2;

            data.push({ x, y, value });
          }
        }
        break;

      case 'spiral':
        // Generate spiral pattern
        const turns = 3;
        const spiralRadius = Math.min(width, height) * 0.4;
        const spiralCenter = { x: width / 2, y: height / 2 };

        for (let i = 0; i < pointCount; i++) {
          const t = i / pointCount;
          const angle = turns * 2 * Math.PI * t;
          const radius = t * spiralRadius;

          const x = spiralCenter.x + Math.cos(angle) * radius;
          const y = spiralCenter.y + Math.sin(angle) * radius;
          const value = t; // Value increases along the spiral

          data.push({ x, y, value });
        }
        break;

      case 'random':
      default:
        // Generate completely random data
        for (let i = 0; i < pointCount; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const value = Math.random();

          data.push({ x, y, value });
        }
        break;
    }

    return data;
  }, [providedData, width, height, sampleDataType]);

  // State for visualization parameters
  const [selectedPreset, setSelectedPreset] = useState<string>('none');
  const [kernelType, setKernelType] = useState<KernelType>(KernelType.GAUSSIAN);
  const [bandwidth, setBandwidth] = useState<number>(0.1);
  const [useLogScale, setUseLogScale] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showContours, setShowContours] = useState<boolean>(false);
  const [animate, setAnimate] = useState<boolean>(true);

  // Apply preset when selected
  const handlePresetChange = useCallback((presetName: string) => {
    setSelectedPreset(presetName);

    if (presetName === 'none') {
      // Reset to defaults
      setKernelType(KernelType.GAUSSIAN);
      setBandwidth(0.1);
      setUseLogScale(false);
      setShowGrid(false);
      setShowContours(false);
      setAnimate(true);
      return;
    }

    // Apply preset settings
    const presets = HeatMapDensityPresets as Record<string, any>;
    if (presets[presetName]) {
      const preset = presets[presetName]({} as any);
      setKernelType(preset.kernelType || KernelType.GAUSSIAN);
      setBandwidth(preset.bandwidth || 0.1);
      setUseLogScale(preset.useLogScale || false);
      setShowGrid(preset.showGrid || false);
      setShowContours(!!preset.contourLevels?.length);
      setAnimate(preset.animate || true);
    }
  }, []);

  // Get visualization props based on current settings
  const getVisualizationProps = useCallback((): HeatMapDensityVisualizationProps => {
    const baseProps = {
      data: sampleData,
      width: showKernelComparison ? width / 2 - 10 : width,
      height: showKernelComparison ? height / 2 - 10 : height,
      kernelType,
      bandwidth,
      useLogScale,
      showGrid,
      contourLevels: showContours ? [0.2, 0.4, 0.6, 0.8] : [],
      animate,
      showLegend: true,
      intensity: 0.9,
    };

    // Apply preset if selected
    if (selectedPreset !== 'none' && selectedPreset in HeatMapDensityPresets) {
      const presetFunction = (HeatMapDensityPresets as Record<string, any>)[selectedPreset];
      return presetFunction(baseProps);
    }

    return baseProps;
  }, [
    sampleData,
    width,
    height,
    kernelType,
    bandwidth,
    useLogScale,
    showGrid,
    showContours,
    animate,
    selectedPreset,
    showKernelComparison,
  ]);

  // Render kernel comparison grid
  const renderKernelComparison = () => {
    if (!showKernelComparison) return null;

    const kernels = Object.values(KernelType);
    const cellWidth = width / 2 - 10;
    const cellHeight = height / 2 - 10;

    return (
      <div className="grid grid-cols-2 gap-5">
        {kernels.map(kernel => (
          <div key={kernel} className="flex flex-col">
            <h3 className="mb-2 text-center font-semibold capitalize">{kernel} Kernel</h3>
            <HeatMapDensityVisualization
              {...getVisualizationProps()}
              width={cellWidth}
              height={cellHeight}
              kernelType={kernel}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <h2 className="mb-4 text-xl font-bold">Heat Map Density Visualization</h2>

      {showKernelComparison ? (
        renderKernelComparison()
      ) : (
        <div className="mb-4">
          <HeatMapDensityVisualization {...getVisualizationProps()} />
        </div>
      )}

      {showControls && !showKernelComparison && (
        <div className="mt-4 rounded-md bg-gray-100 p-4">
          <h3 className="mb-3 text-lg font-semibold">Visualization Controls</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Preset Selector */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Preset Configuration
              </label>
              <select
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={selectedPreset}
                onChange={e => handlePresetChange(e.target.value)}
              >
                <option value="none">Custom</option>
                <option value="populationDensity">Population Density</option>
                <option value="resourceConcentration">Resource Concentration</option>
                <option value="anomalyDetection">Anomaly Detection</option>
                <option value="performanceAnalysis">Performance Analysis</option>
                <option value="timeSeriesAnalysis">Time Series Analysis</option>
              </select>
            </div>

            {/* Kernel Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Kernel Type</label>
              <select
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={kernelType}
                onChange={e => setKernelType(e.target.value as KernelType)}
              >
                {Object.values(KernelType).map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Bandwidth */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Bandwidth: {bandwidth.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={bandwidth}
                onChange={e => setBandwidth(parseFloat(e.target.value))}
                className="block w-full"
              />
            </div>

            {/* Sample Data Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Sample Data Pattern
              </label>
              <select
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={sampleDataType}
                onChange={e => {
                  const newValue = e.target.value as
                    | 'clusters'
                    | 'gradient'
                    | 'random'
                    | 'grid'
                    | 'spiral';
                  if (newValue !== sampleDataType) {
                    // Trigger data regeneration
                    (e.target as HTMLSelectElement).blur();
                    window.location.search = `?dataType=${newValue}`;
                  }
                }}
              >
                <option value="clusters">Clusters</option>
                <option value="gradient">Gradient</option>
                <option value="grid">Grid</option>
                <option value="spiral">Spiral</option>
                <option value="random">Random</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <input
                  id="log-scale-toggle"
                  type="checkbox"
                  checked={useLogScale}
                  onChange={e => setUseLogScale(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="log-scale-toggle" className="ml-2 block text-sm text-gray-700">
                  Use Logarithmic Scale
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="grid-toggle"
                  type="checkbox"
                  checked={showGrid}
                  onChange={e => setShowGrid(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="grid-toggle" className="ml-2 block text-sm text-gray-700">
                  Show Grid Overlay
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="contour-toggle"
                  type="checkbox"
                  checked={showContours}
                  onChange={e => setShowContours(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="contour-toggle" className="ml-2 block text-sm text-gray-700">
                  Show Contour Lines
                </label>
              </div>

              <div className="flex items-center">
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
            </div>

            {/* Comparison Toggle */}
            <div>
              <button
                onClick={() =>
                  (window.location.search = showKernelComparison ? '' : '?compare=true')
                }
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {showKernelComparison ? 'Hide' : 'Show'} Kernel Comparison
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-medium">About Kernel Density Estimation:</p>
            <ul className="mt-1 list-inside list-disc">
              <li>
                <strong>Gaussian:</strong> Smooth, gradual falloff from center (best for continuous
                data)
              </li>
              <li>
                <strong>Epanechnikov:</strong> Parabolic shape with defined boundary (optimal for
                many applications)
              </li>
              <li>
                <strong>Uniform:</strong> Constant value within bandwidth (sharp edges)
              </li>
              <li>
                <strong>Triangular:</strong> Linear decrease from center (compromise between uniform
                and smoother kernels)
              </li>
              <li>
                <strong>Cosine:</strong> Cosine-based kernel with smooth falloff (similar to
                Gaussian but with bounded support)
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

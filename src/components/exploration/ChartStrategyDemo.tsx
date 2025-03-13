import React, { useEffect, useMemo, useState } from 'react';
import { Chart, ChartData, ChartOptions, ChartType } from '../../visualization';

/**
 * Chart Strategy Demo Component
 *
 * This component demonstrates the Chart Strategy Pattern implementation
 * by allowing users to visualize the same data using different chart types
 * and rendering engines (Canvas, SVG, WebGL).
 */
export const ChartStrategyDemo: React.FC = () => {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [renderer, setRenderer] = useState<'canvas' | 'svg' | 'webgl' | 'auto'>('auto');
  const [dataSize, setDataSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [enableAnimation, setEnableAnimation] = useState(true);

  // Generate sample data based on selected size
  const data: ChartData = useMemo(() => {
    const pointCounts = {
      small: 20,
      medium: 100,
      large: 1000,
    };

    const count = pointCounts[dataSize];
    const datasets = [];

    // Generate sine wave data
    const sineData = Array.from({ length: count }, (_, i) => {
      const x = i * (10 / count);
      return { x, y: Math.sin(x) * 3 + 5 };
    });

    datasets.push({
      label: 'Sine Wave',
      data: sineData,
      color: '#4e79a7',
    });

    // Generate cosine wave data
    const cosineData = Array.from({ length: count }, (_, i) => {
      const x = i * (10 / count);
      return { x, y: Math.cos(x) * 2 + 3 };
    });

    datasets.push({
      label: 'Cosine Wave',
      data: cosineData,
      color: '#f28e2c',
    });

    // Generate square wave data
    const squareData = Array.from({ length: count }, (_, i) => {
      const x = i * (10 / count);
      return { x, y: Math.sign(Math.sin(x)) * 2 + 7 };
    });

    datasets.push({
      label: 'Square Wave',
      data: squareData,
      color: '#e15759',
    });

    return { datasets };
  }, [dataSize]);

  // Chart options
  const options: ChartOptions = useMemo(
    () => ({
      renderer: renderer === 'auto' ? undefined : renderer,
      responsive: true,
      height: 400,
      axes: {
        x: {
          label: 'X Axis',
          type: 'linear',
          grid: true,
          min: 0,
          max: 10,
        },
        y: {
          label: 'Y Axis',
          type: 'linear',
          grid: true,
          min: 0,
          max: 10,
        },
      },
      legend: {
        visible: true,
        position: 'top',
      },
      tooltip: {
        enabled: true,
        mode: 'nearest',
      },
      animation: {
        enabled: enableAnimation,
        duration: 500,
      },
      theme: 'light',
      memoryOptimized: dataSize === 'large',
      renderOptimization: true,
    }),
    [renderer, enableAnimation, dataSize]
  );

  // Create category data for bar/pie charts
  const categoryData: ChartData = useMemo(
    () => ({
      datasets: [
        {
          label: 'Categories',
          data: [
            { x: 'Category A', y: 5 },
            { x: 'Category B', y: 8 },
            { x: 'Category C', y: 3 },
            { x: 'Category D', y: 7 },
            { x: 'Category E', y: 4 },
          ],
          color: '#4e79a7',
        },
        {
          label: 'Series 2',
          data: [
            { x: 'Category A', y: 7 },
            { x: 'Category B', y: 4 },
            { x: 'Category C', y: 6 },
            { x: 'Category D', y: 2 },
            { x: 'Category E', y: 5 },
          ],
          color: '#f28e2c',
        },
      ],
    }),
    []
  );

  // Track render time
  const [renderTime, setRenderTime] = useState<number | null>(null);

  // Define a proper type for the renderer parameter
  interface ChartRenderer {
    getStatus: () => { lastRenderTime?: number };
  }

  const handleRender = (renderer: ChartRenderer) => {
    const status = renderer.getStatus();
    if (status.lastRenderTime) {
      setRenderTime(status.lastRenderTime);
    }
  };

  // Determine which data to use based on chart type
  const chartData = useMemo(() => {
    if (['bar', 'pie', 'radar'].includes(chartType)) {
      return categoryData;
    }
    return data;
  }, [chartType, data, categoryData]);

  // Prevent heatmap selection for small data
  useEffect(() => {
    if (chartType === 'heatmap' && dataSize !== 'large') {
      setChartType('line');
    }
  }, [chartType, dataSize]);

  return (
    <div className="chart-strategy-demo p-4">
      <h2 className="mb-4 text-xl font-bold">Chart Strategy Pattern Demo</h2>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Chart Type</label>
          <select
            className="w-full rounded border p-2"
            value={chartType}
            onChange={e => setChartType(e.target.value as ChartType)}
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="scatter">Scatter Chart</option>
            <option value="area">Area Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="radar">Radar Chart</option>
            <option value="heatmap" disabled={dataSize !== 'large'}>
              Heatmap (Large data only)
            </option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Renderer</label>
          <select
            className="w-full rounded border p-2"
            value={renderer}
            onChange={e => setRenderer(e.target.value as 'canvas' | 'svg' | 'webgl' | 'auto')}
          >
            <option value="auto">Auto (Recommended)</option>
            <option value="canvas">Canvas</option>
            <option value="svg">SVG</option>
            <option value="webgl">WebGL</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Data Size</label>
          <select
            className="w-full rounded border p-2"
            value={dataSize}
            onChange={e => setDataSize(e.target.value as 'small' | 'medium' | 'large')}
          >
            <option value="small">Small (20 points)</option>
            <option value="medium">Medium (100 points)</option>
            <option value="large">Large (1000 points)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Animation</label>
          <div className="mt-2 flex items-center">
            <input
              type="checkbox"
              checked={enableAnimation}
              onChange={e => setEnableAnimation(e.target.checked)}
              className="mr-2"
            />
            <span>Enable Animation</span>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded border bg-white p-4">
        <Chart data={chartData} options={options} type={chartType} onRender={handleRender} />
      </div>

      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
        <div className="rounded bg-gray-100 p-4">
          <h3 className="mb-2 font-bold">Render Information</h3>
          <p>
            Renderer:{' '}
            <span className="font-mono">{renderer === 'auto' ? 'Auto-selected' : renderer}</span>
          </p>
          <p>
            Data Points:{' '}
            <span className="font-mono">
              {chartData.datasets.reduce((sum, dataset) => sum + dataset.data.length, 0)}
            </span>
          </p>
          <p>
            Render Time:{' '}
            <span className="font-mono">
              {renderTime ? `${renderTime.toFixed(2)}ms` : 'Not measured'}
            </span>
          </p>
        </div>

        <div className="rounded bg-gray-100 p-4">
          <h3 className="mb-2 font-bold">Strategy Pattern Benefits</h3>
          <ul className="list-inside list-disc">
            <li>Single API for all chart types</li>
            <li>Automatic renderer selection</li>
            <li>Optimized for different data sizes</li>
            <li>Consistent styling and behavior</li>
          </ul>
        </div>

        <div className="rounded bg-gray-100 p-4">
          <h3 className="mb-2 font-bold">Renderer Comparison</h3>
          <ul className="list-inside list-disc">
            <li>
              <strong>SVG:</strong> Best for small datasets, good for interactivity
            </li>
            <li>
              <strong>Canvas:</strong> Better for medium-sized data, less DOM nodes
            </li>
            <li>
              <strong>WebGL:</strong> Best for large datasets, hardware acceleration
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChartStrategyDemo;

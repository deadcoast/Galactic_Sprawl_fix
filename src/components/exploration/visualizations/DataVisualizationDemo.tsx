import { useState } from 'react';
import { DataPoint } from '../../../types/exploration/DataAnalysisTypes';
import { BarChart } from './charts/BarChart';
import { HeatMap } from './charts/HeatMap';
import { LineChart } from './charts/LineChart';
import { ScatterPlot } from './charts/ScatterPlot';

/**
 * DataVisualizationDemo component for showcasing the various visualization components
 */
export function DataVisualizationDemo() {
  const [activeTab, setActiveTab] = useState('line');

  // Sample time series data for LineChart
  const timeSeriesData: DataPoint[] = Array.from({ length: 10 }, (_, i) => ({
    id: `data-${i}`,
    type: 'resource',
    name: `Resource ${i}`,
    date: Date.now() - (9 - i) * 24 * 60 * 60 * 1000, // Past 10 days
    coordinates: { x: i, y: 0 },
    properties: {
      value1: Math.sin(i * 0.5) * 50 + 50, // Sine wave
      value2: Math.cos(i * 0.5) * 30 + 60, // Cosine wave
      value3: Math.random() * 40 + 30, // Random values
    },
  }));

  // Sample categorical data for BarChart
  const categoricalData: DataPoint[] = [
    {
      id: 'minerals',
      type: 'resource',
      name: 'Minerals',
      date: Date.now(),
      coordinates: { x: 0, y: 0 },
      properties: {
        amount: 85,
        quality: 65,
        accessibility: 90,
      },
    },
    {
      id: 'energy',
      type: 'resource',
      name: 'Energy',
      date: Date.now(),
      coordinates: { x: 1, y: 0 },
      properties: {
        amount: 92,
        quality: 78,
        accessibility: 60,
      },
    },
    {
      id: 'gas',
      type: 'resource',
      name: 'Gas',
      date: Date.now(),
      coordinates: { x: 2, y: 0 },
      properties: {
        amount: 45,
        quality: 82,
        accessibility: 40,
      },
    },
    {
      id: 'exotic',
      type: 'resource',
      name: 'Exotic',
      date: Date.now(),
      coordinates: { x: 3, y: 0 },
      properties: {
        amount: 35,
        quality: 95,
        accessibility: 20,
      },
    },
    {
      id: 'biomass',
      type: 'resource',
      name: 'Biomass',
      date: Date.now(),
      coordinates: { x: 4, y: 0 },
      properties: {
        amount: 68,
        quality: 55,
        accessibility: 75,
      },
    },
  ];

  // Sample correlation data for ScatterPlot
  const correlationData: DataPoint[] = Array.from({ length: 20 }, (_, i) => {
    const x = Math.random() * 100;
    // Create a correlation with some random noise
    const y = 0.5 * x + Math.random() * 30 - 15;

    return {
      id: `point-${i}`,
      type: 'sector',
      name: `Sector ${i}`,
      date: Date.now(),
      coordinates: { x, y },
      properties: {
        resourcePotential: x,
        habitabilityScore: y,
        anomalyCount: Math.floor(Math.random() * 5),
      },
    };
  });

  // Sample heatmap data for HeatMap
  const heatmapData: DataPoint[] = [];

  // Generate grid data
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      // Create a pattern with some hot spots
      const distanceFromCenter = Math.sqrt((x - 5) ** 2 + (y - 5) ** 2);
      const value = 100 - distanceFromCenter * 10 + Math.random() * 20 - 10; // Add some noise

      heatmapData.push({
        id: `cell-${x}-${y}`,
        type: 'sector',
        name: `Cell (${x}, ${y})`,
        date: Date.now(),
        coordinates: { x, y },
        properties: {
          value: Math.max(0, Math.min(100, value)), // Clamp between 0-100
        },
      });
    }
  }

  return (
    <div className="data-visualization-demo">
      <h2 className="mb-4 text-xl font-bold">Data Visualization Components</h2>

      <div className="tabs mb-4">
        <button
          className={`mr-2 px-4 py-2 ${activeTab === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('line')}
        >
          Line Chart
        </button>
        <button
          className={`mr-2 px-4 py-2 ${activeTab === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('bar')}
        >
          Bar Chart
        </button>
        <button
          className={`mr-2 px-4 py-2 ${activeTab === 'scatter' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('scatter')}
        >
          Scatter Plot
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'heatmap' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('heatmap')}
        >
          Heat Map
        </button>
      </div>

      <div className="chart-container rounded border border-gray-300 p-4">
        {activeTab === 'line' && (
          <>
            <h3 className="mb-2 text-lg font-semibold">Time Series Data Visualization</h3>
            <p className="mb-4">This line chart shows multiple time series over a 10-day period.</p>
            <LineChart
              data={timeSeriesData}
              xAxisKey="date"
              yAxisKeys={['value1', 'value2', 'value3']}
              dateFormat={true}
              title="Resource Values Over Time"
            />
          </>
        )}

        {activeTab === 'bar' && (
          <>
            <h3 className="mb-2 text-lg font-semibold">Categorical Data Visualization</h3>
            <p className="mb-4">
              This bar chart compares different properties across resource types.
            </p>
            <BarChart
              data={categoricalData}
              xAxisKey="name"
              yAxisKeys={['amount', 'quality', 'accessibility']}
              title="Resource Properties Comparison"
            />
          </>
        )}

        {activeTab === 'scatter' && (
          <>
            <h3 className="mb-2 text-lg font-semibold">Correlation Data Visualization</h3>
            <p className="mb-4">
              This scatter plot shows the relationship between resource potential and habitability.
            </p>
            <ScatterPlot
              data={correlationData}
              xAxisKey="resourcePotential"
              yAxisKey="habitabilityScore"
              title="Resource Potential vs. Habitability Score"
              xAxisLabel="Resource Potential"
              yAxisLabel="Habitability Score"
            />
          </>
        )}

        {activeTab === 'heatmap' && (
          <>
            <h3 className="mb-2 text-lg font-semibold">Density Data Visualization</h3>
            <p className="mb-4">This heat map shows the intensity distribution across a grid.</p>
            <HeatMap
              data={heatmapData}
              valueKey="value"
              title="Resource Intensity Distribution"
              cellSize={35}
            />
          </>
        )}
      </div>

      <div className="mt-4 rounded bg-gray-100 p-4">
        <h3 className="mb-2 text-lg font-semibold">Usage Notes</h3>
        <ul className="ml-5 list-disc">
          <li>
            All visualization components can handle both DataPoint objects and regular objects.
          </li>
          <li>Charts are responsive and will adjust to container size.</li>
          <li>LineChart supports time series data with automatic date formatting.</li>
          <li>BarChart supports stacked bar configuration for comparison data.</li>
          <li>ScatterPlot can visualize correlations with optional Z-axis (bubble size).</li>
          <li>HeatMap works best with grid-like data to show intensity distribution.</li>
        </ul>
      </div>
    </div>
  );
}

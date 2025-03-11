import { useState } from 'react';
import { DataPoint } from '../../../types/exploration/DataAnalysisTypes';
import { BarChart, HeatMap, LineChart, ReferenceLine, ScatterPlot } from './charts';

/**
 * DataVisualizationDemo component for showcasing the various visualization components
 */
export function DataVisualizationDemo() {
  const [activeTab, setActiveTab] = useState('line');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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

  // Reference lines for charts
  const referenceLines: ReferenceLine[] = [
    { value: 50, label: 'Average', color: '#ff7300', axis: 'y' },
  ];

  // Handle chart element click
  const handleElementClick = (data: Record<string, unknown>, index: number) => {
    console.log('Element clicked:', data, 'Index:', index);
    alert(`Clicked element: ${JSON.stringify(data)}`);
  };

  return (
    <div className="data-visualization-demo">
      <h2 className="mb-4 text-xl font-bold">Data Visualization Components</h2>

      <div className="mb-4 flex justify-between">
        <div className="tabs">
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

        <div className="theme-toggle">
          <button
            className={`px-4 py-2 ${theme === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTheme('light')}
          >
            Light
          </button>
          <button
            className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTheme('dark')}
          >
            Dark
          </button>
        </div>
      </div>

      <div className="chart-container rounded border border-gray-300 p-4">
        {activeTab === 'line' && (
          <>
            <LineChart
              data={timeSeriesData}
              xAxisKey="date"
              yAxisKeys={['value1', 'value2', 'value3']}
              dateFormat={true}
              title="Resource Values Over Time"
              theme={theme}
              xAxisLabel="Date"
              yAxisLabel="Value"
              showGrid={true}
              fillArea={true}
              curveType="monotone"
              showDots={true}
              showLegend={true}
              referenceLines={referenceLines}
              onElementClick={handleElementClick}
              animate={true}
            />
            <div className="mt-4 text-sm">
              <h3 className="font-bold">Line Chart Features:</h3>
              <ul className="list-disc pl-5">
                <li>Date formatting for time series data</li>
                <li>Area fill option for better visualization</li>
                <li>Multiple curve types (linear, monotone, step, etc.)</li>
                <li>Reference lines for thresholds or averages</li>
                <li>Interactive tooltips and click events</li>
              </ul>
            </div>
          </>
        )}

        {activeTab === 'bar' && (
          <>
            <BarChart
              data={categoricalData}
              xAxisKey="name"
              yAxisKeys={['amount', 'quality', 'accessibility']}
              title="Resource Properties Comparison"
              theme={theme}
              xAxisLabel="Resource Type"
              yAxisLabel="Value"
              showGrid={true}
              showLegend={true}
              stacked={false}
              showValues={true}
              xAxisTickAngle={-45}
              referenceLines={referenceLines}
              onElementClick={handleElementClick}
              animate={true}
            />
            <div className="mt-4 text-sm">
              <h3 className="font-bold">Bar Chart Features:</h3>
              <ul className="list-disc pl-5">
                <li>Stacked or grouped bar options</li>
                <li>Value labels on bars</li>
                <li>Horizontal or vertical layout</li>
                <li>Customizable bar size and gap</li>
                <li>Angled labels for better readability</li>
              </ul>
            </div>
          </>
        )}

        {activeTab === 'scatter' && (
          <>
            <ScatterPlot
              data={correlationData}
              xAxisKey="resourcePotential"
              yAxisKey="habitabilityScore"
              title="Resource Potential vs. Habitability Score"
              theme={theme}
              xAxisLabel="Resource Potential"
              yAxisLabel="Habitability Score"
              showGrid={true}
              showLegend={true}
              color="#8884d8"
              pointSize={10}
              showQuadrants={true}
              referenceLines={referenceLines}
              onElementClick={handleElementClick}
              animate={true}
            />
            <div className="mt-4 text-sm">
              <h3 className="font-bold">Scatter Plot Features:</h3>
              <ul className="list-disc pl-5">
                <li>Quadrant division with customizable labels</li>
                <li>Optional Z-axis for bubble size</li>
                <li>Reference lines for correlation analysis</li>
                <li>Customizable point size and color</li>
                <li>Interactive tooltips with point details</li>
              </ul>
            </div>
          </>
        )}

        {activeTab === 'heatmap' && (
          <>
            <HeatMap
              data={heatmapData}
              valueKey="value"
              title="Resource Intensity Distribution"
              theme={theme}
              cellSize={35}
              showValues={true}
              showLegend={true}
              valueDecimals={1}
              cellBorder={{
                width: 1,
                color: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                radius: 0,
              }}
              onElementClick={handleElementClick}
            />
            <div className="mt-4 text-sm">
              <h3 className="font-bold">Heat Map Features:</h3>
              <ul className="list-disc pl-5">
                <li>Customizable color gradient</li>
                <li>Value display in cells</li>
                <li>Adjustable cell size and border</li>
                <li>Color scale legend</li>
                <li>Interactive cell tooltips and clicks</li>
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 rounded bg-gray-100 p-4 dark:bg-gray-800 dark:text-gray-200">
        <h3 className="mb-2 text-lg font-semibold">Common Features Across All Charts</h3>
        <ul className="ml-5 list-disc">
          <li>Light and dark theme support</li>
          <li>Consistent styling and behavior</li>
          <li>Error handling and loading states</li>
          <li>Interactive tooltips and click events</li>
          <li>Animation support for data changes</li>
          <li>Reference lines for thresholds or important values</li>
          <li>Responsive layout that adapts to container size</li>
        </ul>
      </div>
    </div>
  );
}

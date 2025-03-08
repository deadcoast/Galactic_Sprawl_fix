import { useEffect, useMemo, useState } from 'react';
import { useGeneratedDataStream, useMultiSeriesDataStream } from '../../../hooks/useRealTimeData';
import { RealTimeDataService } from '../../../services/RealTimeDataService';
import { DataPoint } from '../../../types/exploration/DataAnalysisTypes';
import { d3Converters } from '../../../types/visualizations/D3Types';
import { BarChart } from './charts/BarChart';
import { HeatMap } from './charts/HeatMap';
import { LineChart } from './charts/LineChart';
import { ScatterPlot } from './charts/ScatterPlot';

/**
 * RealTimeVisualizationDemo component for showcasing real-time data visualization
 */
export function RealTimeVisualizationDemo() {
  const [activeTab, setActiveTab] = useState('time-series');
  const [dataService] = useState(() => new RealTimeDataService());
  const [updateInterval, setUpdateInterval] = useState(1000);
  const [isPaused, setIsPaused] = useState(false);

  // Create sine wave generators with different parameters
  const timeSeriesGenerators = useMemo(() => {
    return {
      wave1: dataService.createSineWaveGenerator(30, 50, 20, 5),
      wave2: dataService.createSineWaveGenerator(40, 60, 30, 3),
      wave3: dataService.createSineWaveGenerator(20, 40, 15, 8),
    };
  }, [dataService]);

  // Use the multi-series data stream hook for time series data
  const [timeSeriesData, timeSeriesStreamId, isTimeSeriesActive, timeSeriesError] =
    useMultiSeriesDataStream(
      dataService,
      'time-series',
      'Real-time Wave Data',
      timeSeriesGenerators,
      updateInterval,
      50 // buffer size
    );

  // Create a resource data generator for the scatter plot
  const resourceGenerator = useMemo(() => {
    return dataService.createExplorationDataGenerator('resource', { x: 50, y: 50 }, 40);
  }, [dataService]);

  // Use the generated data stream hook for resource data
  const [resourceData, resourceStreamId, isResourceActive, resourceError] = useGeneratedDataStream(
    dataService,
    'resources',
    'Resource Discovery',
    resourceGenerator,
    updateInterval * 2,
    30 // buffer size
  );

  // Pause/resume data generation
  useEffect(() => {
    if (isPaused) {
      if (timeSeriesStreamId) {
        const stream = dataService.getDataStreams().find(s => s.id === timeSeriesStreamId);
        if (stream && stream.isActive) {
          dataService.stopStream(timeSeriesStreamId);
        }
      }

      if (resourceStreamId) {
        const stream = dataService.getDataStreams().find(s => s.id === resourceStreamId);
        if (stream && stream.isActive) {
          dataService.stopStream(resourceStreamId);
        }
      }
    } else {
      if (timeSeriesStreamId) {
        const stream = dataService.getDataStreams().find(s => s.id === timeSeriesStreamId);
        if (stream && !stream.isActive) {
          dataService.startStream(timeSeriesStreamId);
        }
      }

      if (resourceStreamId) {
        const stream = dataService.getDataStreams().find(s => s.id === resourceStreamId);
        if (stream && !stream.isActive) {
          dataService.startStream(resourceStreamId);
        }
      }
    }
  }, [isPaused, dataService, timeSeriesStreamId, resourceStreamId]);

  // Format time series data for the line chart
  const formattedTimeSeriesData = useMemo(() => {
    return timeSeriesData.map(dataPoint => ({
      ...dataPoint,
      // Format the timestamp as a date string for display
      formattedTime: new Date(dataPoint.timestamp).toLocaleTimeString(),
    }));
  }, [timeSeriesData]);

  // Convert resource data to properly typed format for charts
  const typedResourceData = useMemo(() => {
    // Ensure resourceData is treated as DataPoint[] for conversion
    const dataPoints = resourceData as DataPoint[];
    return d3Converters.dataPointsToD3Format<Record<string, unknown>>(dataPoints);
  }, [resourceData]);

  // Extract quality and quantity data for the bar chart
  const resourceQualityData = useMemo(() => {
    // Group resources by type and calculate average quality
    const typeGroups: Record<string, { count: number; totalQuality: number }> = {};

    typedResourceData.forEach(resource => {
      if (resource && typeof resource.type === 'string') {
        const resourceType = resource.type;
        if (!typeGroups[resourceType]) {
          typeGroups[resourceType] = { count: 0, totalQuality: 0 };
        }

        typeGroups[resourceType].count++;
        if (typeof resource.quality === 'number') {
          typeGroups[resourceType].totalQuality += resource.quality;
        }
      }
    });

    // Convert to array format for the bar chart
    return Object.entries(typeGroups).map(([type, data]) => ({
      type,
      averageQuality: data.totalQuality / data.count,
      count: data.count,
    }));
  }, [typedResourceData]);

  return (
    <div className="real-time-visualization-demo">
      <h2 className="mb-4 text-xl font-bold">Real-Time Data Visualization</h2>

      <div className="controls mb-4 flex items-center space-x-4">
        <button
          className={`rounded px-4 py-2 ${isPaused ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>

        <div className="update-interval flex items-center">
          <span className="mr-2">Update Interval:</span>
          <select
            value={updateInterval}
            onChange={e => setUpdateInterval(Number(e.target.value))}
            className="rounded border px-2 py-1"
            disabled={isTimeSeriesActive || isResourceActive}
          >
            <option value={200}>200ms (Fast)</option>
            <option value={500}>500ms (Medium)</option>
            <option value={1000}>1000ms (Normal)</option>
            <option value={2000}>2000ms (Slow)</option>
          </select>
        </div>

        <div className="stats">
          <span className="mr-2">Data Points:</span>
          <span className="font-semibold">{timeSeriesData.length}</span>
        </div>
      </div>

      <div className="tabs mb-4">
        <button
          className={`mr-2 px-4 py-2 ${activeTab === 'time-series' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('time-series')}
        >
          Time Series
        </button>
        <button
          className={`mr-2 px-4 py-2 ${activeTab === 'bar-chart' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('bar-chart')}
        >
          Resource Types
        </button>
        <button
          className={`mr-2 px-4 py-2 ${activeTab === 'scatter-plot' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('scatter-plot')}
        >
          Resource Scatter
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'heat-map' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('heat-map')}
        >
          Resource Density
        </button>
      </div>

      <div className="chart-container rounded border border-gray-300 p-4">
        {activeTab === 'time-series' && (
          <>
            <h3 className="mb-2 text-lg font-semibold">Real-Time Sensor Data</h3>
            <p className="mb-4">
              This chart displays simulated sensor readings updated every {updateInterval}ms. Each
              line represents a different sensor.
            </p>
            {timeSeriesError && (
              <div className="error-message mb-4 rounded bg-red-100 p-2 text-red-700">
                Error: {timeSeriesError}
              </div>
            )}
            <LineChart
              data={formattedTimeSeriesData}
              xAxisKey="timestamp"
              yAxisKeys={['wave1', 'wave2', 'wave3']}
              dateFormat={true}
              title="Real-Time Sensor Readings"
            />
          </>
        )}

        {activeTab === 'bar-chart' && (
          <>
            <h3 className="mb-2 text-lg font-semibold">Resource Type Distribution</h3>
            <p className="mb-4">
              This chart shows the distribution of different resource types and their average
              quality.
            </p>
            <BarChart
              data={resourceQualityData}
              xAxisKey="type"
              yAxisKeys={['averageQuality', 'count']}
              title="Resource Types and Quality"
            />
          </>
        )}

        {activeTab === 'scatter-plot' && (
          <>
            <h3 className="mb-2 text-lg font-semibold">Resource Quality vs Quantity</h3>
            <p className="mb-4">
              This scatter plot shows the relationship between resource quantity and quality.
            </p>
            {resourceError && (
              <div className="error-message mb-4 rounded bg-red-100 p-2 text-red-700">
                Error: {resourceError}
              </div>
            )}
            <ScatterPlot
              data={typedResourceData}
              xAxisKey="amount"
              yAxisKey="quality"
              title="Resource Quantity vs Quality"
              xAxisLabel="Quantity"
              yAxisLabel="Quality"
            />
          </>
        )}

        {activeTab === 'heat-map' && (
          <>
            <h3 className="mb-2 text-lg font-semibold">Resource Density Map</h3>
            <p className="mb-4">
              This heat map shows the distribution of resources across the region.
            </p>
            <HeatMap
              data={typedResourceData}
              valueKey="amount"
              title="Resource Density"
              cellSize={35}
            />
          </>
        )}
      </div>

      <div className="mt-4 rounded bg-gray-100 p-4">
        <h3 className="mb-2 text-lg font-semibold">Real-Time Visualization Features</h3>
        <ul className="ml-5 list-disc">
          <li>Data is generated and streamed in real-time using RealTimeDataService</li>
          <li>Visualization components automatically update when new data arrives</li>
          <li>Data is buffered to limit memory usage while maintaining history</li>
          <li>Streams can be paused and resumed to control data flow</li>
          <li>Different update frequencies can be selected for performance testing</li>
          <li>Multiple visualization types can be used with the same real-time data</li>
          <li>Error handling is built in with appropriate feedback</li>
        </ul>
      </div>
    </div>
  );
}

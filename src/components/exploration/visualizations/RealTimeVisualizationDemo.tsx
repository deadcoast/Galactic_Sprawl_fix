import { useEffect, useMemo, useState } from 'react';
import { useRealTimeData } from '../../../hooks/useRealTimeData';
import { ChartDataRecord } from '../../../types/exploration/AnalysisComponentTypes';
import { DataPoint } from '../../../types/exploration/DataAnalysisTypes';
import { BarChart } from './charts/BarChart';
import { HeatMap } from './charts/HeatMap';
import { LineChart } from './charts/LineChart';
import { ScatterPlot } from './charts/ScatterPlot';

/**
 * Custom hook for generated data stream
 */
function useGeneratedDataStream(bufferId: string, interval: number = 1000) {
  const { data, isStreaming, startStream, stopStream } = useRealTimeData({
    bufferId,
    config: {
      updateInterval: interval,
    },
  });

  return { data, isStreaming, startStream, stopStream };
}

/**
 * RealTimeVisualizationDemo component for showcasing real-time data visualization
 */
export function RealTimeVisualizationDemo() {
  const [activeTab, setActiveTab] = useState('time-series');
  const [updateInterval, setUpdateInterval] = useState(1000);
  const [isPaused, setIsPaused] = useState(false);

  // Use custom hooks for data streams
  const {
    data: timeSeriesData,
    isStreaming: isTimeSeriesStreaming,
    startStream: startTimeSeriesStream,
    stopStream: stopTimeSeriesStream,
  } = useGeneratedDataStream('time-series', updateInterval);

  const {
    data: resourceData,
    isStreaming: isResourceStreaming,
    startStream: startResourceStream,
    stopStream: stopResourceStream,
  } = useGeneratedDataStream('resources', updateInterval);

  // Pause/resume data generation
  useEffect(() => {
    if (isPaused) {
      if (isTimeSeriesStreaming) {
        stopTimeSeriesStream();
      }
      if (isResourceStreaming) {
        stopResourceStream();
      }
    } else {
      if (!isTimeSeriesStreaming) {
        startTimeSeriesStream();
      }
      if (!isResourceStreaming) {
        startResourceStream();
      }
    }
  }, [
    isPaused,
    isTimeSeriesStreaming,
    isResourceStreaming,
    startTimeSeriesStream,
    startResourceStream,
    stopTimeSeriesStream,
    stopResourceStream,
  ]);

  // Format time series data for the line chart
  const formattedTimeSeriesData = useMemo(() => {
    return (timeSeriesData as DataPoint[]).map((dataPoint: DataPoint) => ({
      ...dataPoint,
      // Format the timestamp as a date string for display
      date: dataPoint.date ? new Date(dataPoint.date).toLocaleString() : '',
      // Extract values for the chart
      value1: dataPoint.properties?.value1 || 0,
      value2: dataPoint.properties?.value2 || 0,
      value3: dataPoint.properties?.value3 || 0,
    }));
  }, [timeSeriesData]);

  // Convert resource data to ChartDataRecord format for HeatMap
  const typedResourceData = useMemo(() => {
    return (resourceData as Record<string, unknown>[]).map(item => {
      const chartRecord: ChartDataRecord = {};
      // Copy properties from the original item
      Object.entries(item).forEach(([key, value]) => {
        // Only include properties that match the VisualizationValue type
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          value === null ||
          value === undefined
        ) {
          chartRecord[key] = value;
        }
      });
      return chartRecord;
    });
  }, [resourceData]);

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
            disabled={isTimeSeriesStreaming || isResourceStreaming}
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
            <LineChart
              data={formattedTimeSeriesData}
              xAxisKey="date"
              yAxisKeys={['value1', 'value2', 'value3']}
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
              data={typedResourceData}
              xAxisKey="type"
              yAxisKeys={['amount']}
              title="Resource Types and Quantity"
            />
          </>
        )}

        {activeTab === 'scatter-plot' && (
          <>
            <h3 className="mb-2 text-lg font-semibold">Resource Distribution</h3>
            <p className="mb-4">
              This scatter plot shows the relationship between resource quantity and quality.
            </p>
            <ScatterPlot
              data={typedResourceData}
              xAxisKey="x"
              yAxisKey="y"
              title="Resource Distribution"
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
              xKey="x"
              yKey="y"
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

import {
  AlertTriangle,
  BarChart2,
  Database,
  // Filter,
  // List,
  Play,
  Plus,
  // Save,
  Settings,
  Trash2,
} from 'lucide-react';
import * as React from 'react';
import { useDataAnalysis } from '../../contexts/DataAnalysisContext';
import {
  AnalysisConfig,
  AnalysisResult,
  AnalysisType,
  DataPoint,
  /* Dataset, */ VisualizationType,
} from '../../types/exploration/DataAnalysisTypes';

interface DataAnalysisSystemProps {
  className?: string;
}

// Result visualization component
interface ResultVisualizationProps {
  result: AnalysisResult;
  config?: AnalysisConfig;
}

function ResultVisualization({ result, config }: ResultVisualizationProps) {
  if (result.status === 'pending' || result.status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
        <p className="text-blue-500">Processing analysis...</p>
      </div>
    );
  }

  if (result.status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-red-500">
        <AlertTriangle className="mb-4 h-12 w-12" />
        <p className="font-medium">Analysis failed</p>
        <p className="mt-2 text-sm">{result.error || 'Unknown error'}</p>
      </div>
    );
  }

  // Render different visualizations based on the configuration type and visualization type
  if (!config) {
    return (
      <div className="py-8 text-center text-gray-500">
        <BarChart2 className="mx-auto mb-2" />
        <p>Configuration not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Visualization header */}
      <div className="mb-4">
        <h3 className="font-medium">{config.name}</h3>
        <p className="text-sm text-gray-500">{config.description}</p>
      </div>

      {/* Visualization */}
      <div className="mb-4 rounded border bg-white p-4">{renderVisualization(result, config)}</div>

      {/* Insights */}
      {result.insights && result.insights.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 font-medium">Insights</h4>
          <ul className="list-disc space-y-1 pl-5">
            {result.insights.map((insight, index) => (
              <li key={index} className="text-sm">
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {result.summary && (
        <div className="mb-4">
          <h4 className="mb-2 font-medium">Summary</h4>
          <p className="text-sm">{result.summary}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
        <div>
          <span className="font-medium">Started:</span>{' '}
          {new Date(result.startTime).toLocaleString()}
        </div>
        {result.endTime && (
          <div>
            <span className="font-medium">Completed:</span>{' '}
            {new Date(result.endTime).toLocaleString()}
          </div>
        )}
        <div>
          <span className="font-medium">Duration:</span>{' '}
          {result.endTime
            ? `${((result.endTime - result.startTime) / 1000).toFixed(2)} seconds`
            : 'In progress'}
        </div>
        <div>
          <span className="font-medium">Status:</span>{' '}
          <span
            className={`${
              result.status === 'completed'
                ? 'text-green-500'
                : result.status === 'failed'
                  ? 'text-red-500'
                  : result.status === 'processing'
                    ? 'text-blue-500'
                    : 'text-gray-500'
            }`}
          >
            {result.status}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to render the appropriate visualization based on the configuration
function renderVisualization(result: AnalysisResult, config: AnalysisConfig) {
  // This is a placeholder implementation that would be replaced with actual chart components
  // In a real implementation, you would use a charting library like recharts, visx, or d3

  switch (config.visualizationType) {
    case 'lineChart':
      return renderLineChart(result, config);
    case 'barChart':
      return renderBarChart(result, config);
    case 'scatterPlot':
      return renderScatterPlot(result, config);
    case 'pieChart':
      return renderPieChart(result, config);
    case 'heatMap':
      return renderHeatMap(result, config);
    case 'radar':
      return renderRadarChart(result, config);
    case 'histogram':
      return renderHistogram(result, config);
    case 'boxPlot':
      return renderBoxPlot(result, config);
    case 'table':
      return renderTable(result, config);
    case 'map':
      return renderMap(result, config);
    case 'network':
      return renderNetwork(result, config);
    default:
      return (
        <div className="py-8 text-center text-gray-500">
          <p>Custom visualization</p>
          <pre className="mt-4 overflow-x-auto text-xs">{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      );
  }
}

// Placeholder visualization renderers
function renderLineChart(_result: AnalysisResult, _config: AnalysisConfig) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="mb-2 text-gray-500">Line Chart Visualization</p>
        <p className="text-xs text-gray-400">
          (In a real implementation, this would be a line chart using a charting library)
        </p>
      </div>
    </div>
  );
}

function renderBarChart(_result: AnalysisResult, _config: AnalysisConfig) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="mb-2 text-gray-500">Bar Chart Visualization</p>
        <p className="text-xs text-gray-400">
          (In a real implementation, this would be a bar chart using a charting library)
        </p>
      </div>
    </div>
  );
}

function renderScatterPlot(_result: AnalysisResult, _config: AnalysisConfig) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="mb-2 text-gray-500">Scatter Plot Visualization</p>
        <p className="text-xs text-gray-400">
          (In a real implementation, this would be a scatter plot using a charting library)
        </p>
      </div>
    </div>
  );
}

function renderPieChart(_result: AnalysisResult, _config: AnalysisConfig) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="mb-2 text-gray-500">Pie Chart Visualization</p>
        <p className="text-xs text-gray-400">
          (In a real implementation, this would be a pie chart using a charting library)
        </p>
      </div>
    </div>
  );
}

function renderHeatMap(_result: AnalysisResult, _config: AnalysisConfig) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="mb-2 text-gray-500">Heat Map Visualization</p>
        <p className="text-xs text-gray-400">
          (In a real implementation, this would be a heat map using a charting library)
        </p>
      </div>
    </div>
  );
}

function renderRadarChart(_result: AnalysisResult, _config: AnalysisConfig) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="mb-2 text-gray-500">Radar Chart Visualization</p>
        <p className="text-xs text-gray-400">
          (In a real implementation, this would be a radar chart using a charting library)
        </p>
      </div>
    </div>
  );
}

function renderHistogram(_result: AnalysisResult, _config: AnalysisConfig) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="mb-2 text-gray-500">Histogram Visualization</p>
        <p className="text-xs text-gray-400">
          (In a real implementation, this would be a histogram using a charting library)
        </p>
      </div>
    </div>
  );
}

function renderBoxPlot(_result: AnalysisResult, _config: AnalysisConfig) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="mb-2 text-gray-500">Box Plot Visualization</p>
        <p className="text-xs text-gray-400">
          (In a real implementation, this would be a box plot using a charting library)
        </p>
      </div>
    </div>
  );
}

function renderTable(result: AnalysisResult, _config: AnalysisConfig) {
  // For the table visualization, we'll actually implement a simple table
  const data = result.data as Record<string, unknown>;

  if (!data || !Array.isArray(data.data)) {
    return (
      <div className="py-4 text-center text-gray-500">
        <p>No tabular data available</p>
      </div>
    );
  }

  const tableData = data.data as Record<string, unknown>[];
  if (tableData.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  // Get column headers from the first row
  const columns = Object.keys(tableData[0]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(column => (
              <th
                key={column}
                className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {tableData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map(column => (
                <td key={`${rowIndex}-${column}`} className="whitespace-nowrap px-3 py-2 text-xs">
                  {formatCellValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderMap(_result: AnalysisResult, _config: AnalysisConfig) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="mb-2 text-gray-500">Map Visualization</p>
        <p className="text-xs text-gray-400">
          (In a real implementation, this would be a map visualization using a mapping library)
        </p>
      </div>
    </div>
  );
}

function renderNetwork(_result: AnalysisResult, _config: AnalysisConfig) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="mb-2 text-gray-500">Network Visualization</p>
        <p className="text-xs text-gray-400">
          (In a real implementation, this would be a network graph using a graph visualization
          library)
        </p>
      </div>
    </div>
  );
}

// Helper function to format cell values for the table
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export function DataAnalysisSystem({ className = '' }: DataAnalysisSystemProps) {
  // Get data and functions from context
  const {
    datasets,
    analysisConfigs,
    analysisResults,
    createDataset,
    deleteDataset,
    createAnalysisConfig,
    deleteAnalysisConfig,
    runAnalysis,
    getAnalysisResultsByConfigId: _getAnalysisResultsByConfigId,
  } = useDataAnalysis();

  // State for active tab and selected items
  const [activeTab, setActiveTab] = React.useState<'datasets' | 'analysis' | 'results'>('datasets');
  const [selectedDatasetId, setSelectedDatasetId] = React.useState<string | null>(null);
  const [selectedConfigId, setSelectedConfigId] = React.useState<string | null>(null);
  const [selectedResultId, setSelectedResultId] = React.useState<string | null>(null);

  // State for dataset creation
  const [showCreateDataset, setShowCreateDataset] = React.useState(false);
  const [newDatasetName, setNewDatasetName] = React.useState('');
  const [newDatasetDescription, setNewDatasetDescription] = React.useState('');
  const [newDatasetSource, setNewDatasetSource] = React.useState<
    'sectors' | 'anomalies' | 'resources' | 'mixed'
  >('sectors');

  // State for analysis configuration creation
  const [showCreateAnalysis, setShowCreateAnalysis] = React.useState(false);
  const [newAnalysisName, setNewAnalysisName] = React.useState('');
  const [newAnalysisDescription, setNewAnalysisDescription] = React.useState('');
  const [newAnalysisType, setNewAnalysisType] = React.useState<AnalysisType>('trend');
  const [newAnalysisDatasetId, setNewAnalysisDatasetId] = React.useState('');
  const [newAnalysisVisualization, setNewAnalysisVisualization] =
    React.useState<VisualizationType>('lineChart');

  // Get selected items
  const selectedDataset = selectedDatasetId
    ? datasets.find(dataset => dataset.id === selectedDatasetId)
    : null;
  const selectedConfig = selectedConfigId
    ? analysisConfigs.find(config => config.id === selectedConfigId)
    : null;

  // Get the selected result
  const selectedResult = selectedResultId
    ? analysisResults.find(result => result.id === selectedResultId)
    : null;

  // Get the configuration for the selected result
  const selectedResultConfig = selectedResult
    ? analysisConfigs.find(config => config.id === selectedResult.analysisConfigId)
    : undefined;

  // Function to create a dataset from exploration data
  const handleCreateDataset = () => {
    if (!newDatasetName) {
      return;
    }

    // Create sample data points based on the selected source
    const dataPoints: DataPoint[] = generateSampleDataPoints(newDatasetSource);

    // Create the dataset
    createDataset({
      name: newDatasetName,
      description: newDatasetDescription,
      dataPoints,
      source: newDatasetSource,
    });

    // Reset form
    setNewDatasetName('');
    setNewDatasetDescription('');
    setNewDatasetSource('sectors');
    setShowCreateDataset(false);
  };

  // Helper function to generate sample data points
  const generateSampleDataPoints = (
    source: 'sectors' | 'anomalies' | 'resources' | 'mixed'
  ): DataPoint[] => {
    const now = Date.now();
    const dataPoints: DataPoint[] = [];

    // Generate different sample data based on the source
    switch (source) {
      case 'sectors':
        for (let i = 0; i < 10; i++) {
          dataPoints.push({
            id: `sector-${i}`,
            type: 'sector',
            name: `Sector ${String.fromCharCode(65 + i)}`,
            date: now - i * 86400000, // days ago
            coordinates: { x: Math.random() * 100, y: Math.random() * 100 },
            properties: {
              resourcePotential: Math.random() * 100,
              habitabilityScore: Math.random() * 100,
              anomalyCount: Math.floor(Math.random() * 5),
              explored: Math.random() > 0.5,
            },
          });
        }
        break;
      case 'anomalies':
        for (let i = 0; i < 10; i++) {
          dataPoints.push({
            id: `anomaly-${i}`,
            type: 'anomaly',
            name: `Anomaly ${i + 1}`,
            date: now - i * 86400000, // days ago
            coordinates: { x: Math.random() * 100, y: Math.random() * 100 },
            properties: {
              type: ['artifact', 'signal', 'phenomenon'][Math.floor(Math.random() * 3)],
              severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
              investigated: Math.random() > 0.5,
              dangerLevel: Math.random() * 10,
            },
          });
        }
        break;
      case 'resources':
        for (let i = 0; i < 10; i++) {
          dataPoints.push({
            id: `resource-${i}`,
            type: 'resource',
            name: `Resource ${i + 1}`,
            date: now - i * 86400000, // days ago
            coordinates: { x: Math.random() * 100, y: Math.random() * 100 },
            properties: {
              type: ['minerals', 'gas', 'energy', 'organic', 'exotic'][
                Math.floor(Math.random() * 5)
              ],
              amount: Math.random() * 100,
              quality: Math.random(),
              accessibility: Math.random(),
              distribution: ['concentrated', 'scattered', 'veins'][Math.floor(Math.random() * 3)],
              estimatedValue: Math.random() * 1000,
            },
          });
        }
        break;
      case 'mixed':
        // Add a mix of sectors, anomalies, and resources
        dataPoints.push(...generateSampleDataPoints('sectors').slice(0, 3));
        dataPoints.push(...generateSampleDataPoints('anomalies').slice(0, 3));
        dataPoints.push(...generateSampleDataPoints('resources').slice(0, 4));
        break;
    }

    return dataPoints;
  };

  // Function to create an analysis configuration
  const handleCreateAnalysis = () => {
    if (!newAnalysisName || !newAnalysisDatasetId) {
      return;
    }

    // Create parameters based on analysis type
    const parameters = generateDefaultParameters(newAnalysisType);

    // Create visualization config based on visualization type
    const visualizationConfig = generateDefaultVisualizationConfig(newAnalysisVisualization);

    // Create the analysis configuration
    createAnalysisConfig({
      name: newAnalysisName,
      description: newAnalysisDescription,
      type: newAnalysisType,
      datasetId: newAnalysisDatasetId,
      parameters,
      visualizationType: newAnalysisVisualization,
      visualizationConfig,
    });

    // Reset form
    setNewAnalysisName('');
    setNewAnalysisDescription('');
    setNewAnalysisType('trend');
    setNewAnalysisDatasetId('');
    setNewAnalysisVisualization('lineChart');
    setShowCreateAnalysis(false);
  };

  // Helper function to generate default parameters based on analysis type
  const generateDefaultParameters = (type: AnalysisType): Record<string, unknown> => {
    switch (type) {
      case 'trend':
        return {
          xAxis: 'date',
          yAxis: 'value',
          groupBy: 'type',
          timeRange: [Date.now() - 30 * 86400000, Date.now()], // Last 30 days
          aggregation: 'average',
        };
      case 'correlation':
        return {
          variables: ['resourcePotential', 'habitabilityScore', 'anomalyCount'],
          method: 'pearson',
          threshold: 0.5,
        };
      case 'distribution':
        return {
          variable: 'resourcePotential',
          bins: 10,
          normalize: true,
        };
      case 'clustering':
        return {
          variables: ['resourcePotential', 'habitabilityScore'],
          clusters: 3,
          method: 'kmeans',
        };
      case 'prediction':
        return {
          target: 'resourcePotential',
          features: ['habitabilityScore', 'anomalyCount'],
          method: 'linear',
          testSize: 0.2,
        };
      case 'comparison':
        return {
          groups: [
            { id: 'group1', name: 'Group A', filterId: 'filter1' },
            { id: 'group2', name: 'Group B', filterId: 'filter2' },
          ],
          variables: ['resourcePotential', 'habitabilityScore'],
          method: 'absolute',
        };
      case 'anomalyDetection':
        return {
          variables: ['resourcePotential', 'habitabilityScore'],
          method: 'isolation',
          threshold: 0.95,
        };
      case 'resourceMapping':
        return {
          resourceTypes: ['minerals', 'gas', 'energy'],
          valueMetric: 'amount',
          regionSize: 10,
        };
      case 'sectorAnalysis':
        return {
          metrics: ['resourcePotential', 'habitabilityScore', 'anomalyCount'],
          sectorIds: [],
        };
      default:
        return {};
    }
  };

  // Helper function to generate default visualization config based on visualization type
  const generateDefaultVisualizationConfig = (type: VisualizationType): Record<string, unknown> => {
    switch (type) {
      case 'lineChart':
        return {
          xAxisLabel: 'Date',
          yAxisLabel: 'Value',
          showLegend: true,
          showGrid: true,
          colors: ['#4299E1', '#48BB78', '#F6AD55', '#F56565'],
        };
      case 'barChart':
        return {
          xAxisLabel: 'Category',
          yAxisLabel: 'Value',
          showLegend: true,
          showGrid: true,
          colors: ['#4299E1', '#48BB78', '#F6AD55', '#F56565'],
          barSize: 20,
        };
      case 'scatterPlot':
        return {
          xAxisLabel: 'X',
          yAxisLabel: 'Y',
          showLegend: true,
          showGrid: true,
          colors: ['#4299E1', '#48BB78', '#F6AD55', '#F56565'],
          pointSize: 5,
        };
      case 'pieChart':
        return {
          showLegend: true,
          colors: ['#4299E1', '#48BB78', '#F6AD55', '#F56565', '#9F7AEA', '#ED64A6'],
          innerRadius: 0,
          outerRadius: 80,
        };
      case 'heatMap':
        return {
          xAxisLabel: 'X',
          yAxisLabel: 'Y',
          colors: ['#FEEBC8', '#FBD38D', '#F6AD55', '#DD6B20', '#C05621'],
        };
      case 'radar':
        return {
          showLegend: true,
          colors: ['#4299E1', '#48BB78', '#F6AD55', '#F56565'],
          fillOpacity: 0.6,
        };
      case 'histogram':
        return {
          xAxisLabel: 'Value',
          yAxisLabel: 'Frequency',
          showGrid: true,
          color: '#4299E1',
          bins: 10,
        };
      case 'boxPlot':
        return {
          xAxisLabel: 'Category',
          yAxisLabel: 'Value',
          showGrid: true,
          colors: ['#4299E1', '#48BB78', '#F6AD55', '#F56565'],
        };
      case 'table':
        return {
          showHeader: true,
          striped: true,
          bordered: true,
          compact: false,
        };
      case 'map':
        return {
          showLegend: true,
          colors: ['#FEEBC8', '#FBD38D', '#F6AD55', '#DD6B20', '#C05621'],
          zoom: 1,
        };
      case 'network':
        return {
          showLegend: true,
          colors: ['#4299E1', '#48BB78', '#F6AD55', '#F56565'],
          nodeSize: 5,
          linkWidth: 1,
        };
      default:
        return {};
    }
  };

  return (
    <div className={`rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b bg-gray-50 p-4 dark:bg-gray-800">
        <h2 className="flex items-center text-xl font-semibold">
          <BarChart2 className="mr-2" />
          Data Analysis System
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Analyze exploration data to discover patterns and insights
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'datasets'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('datasets')}
        >
          <div className="flex items-center">
            <Database size={16} className="mr-2" />
            Datasets
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'analysis'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('analysis')}
        >
          <div className="flex items-center">
            <Settings size={16} className="mr-2" />
            Analysis
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'results'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('results')}
        >
          <div className="flex items-center">
            <BarChart2 size={16} className="mr-2" />
            Results
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Datasets Tab */}
        {activeTab === 'datasets' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Dataset List */}
            <div className="rounded-lg border p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium">Datasets</h3>
                <button
                  className="rounded bg-blue-500 p-1 text-white hover:bg-blue-600"
                  title="Create new dataset"
                  onClick={() => setShowCreateDataset(!showCreateDataset)}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Create Dataset Form */}
              {showCreateDataset && (
                <div className="mb-4 rounded border bg-gray-50 p-3">
                  <h4 className="mb-2 font-medium">Create New Dataset</h4>
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Name</label>
                    <input
                      type="text"
                      className="w-full rounded border p-2"
                      value={newDatasetName}
                      onChange={e => setNewDatasetName(e.target.value)}
                      placeholder="Enter dataset name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Description</label>
                    <textarea
                      className="w-full rounded border p-2"
                      value={newDatasetDescription}
                      onChange={e => setNewDatasetDescription(e.target.value)}
                      placeholder="Enter dataset description"
                      rows={3}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Data Source</label>
                    <select
                      className="w-full rounded border p-2"
                      value={newDatasetSource}
                      onChange={e =>
                        setNewDatasetSource(
                          e.target.value as 'sectors' | 'anomalies' | 'resources' | 'mixed'
                        )
                      }
                    >
                      <option value="sectors">Sectors</option>
                      <option value="anomalies">Anomalies</option>
                      <option value="resources">Resources</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="mr-2 rounded bg-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-400"
                      onClick={() => setShowCreateDataset(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                      onClick={handleCreateDataset}
                      disabled={!newDatasetName}
                    >
                      Create Dataset
                    </button>
                  </div>
                </div>
              )}

              {datasets.length > 0 ? (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {datasets.map(dataset => (
                    <div
                      key={dataset.id}
                      className={`cursor-pointer rounded border p-2 ${
                        selectedDatasetId === dataset.id
                          ? 'border-blue-200 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDatasetId(dataset.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{dataset.name}</div>
                          <div className="text-xs text-gray-500">
                            {dataset.source} • {dataset.dataPoints.length} points
                          </div>
                        </div>
                        <button
                          className="p-1 text-gray-400 hover:text-red-500"
                          onClick={e => {
                            e.stopPropagation();
                            deleteDataset(dataset.id);
                            if (selectedDatasetId === dataset.id) {
                              setSelectedDatasetId(null);
                            }
                          }}
                          title="Delete dataset"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Database className="mx-auto mb-2" />
                  <p>No datasets available</p>
                  <p className="text-sm">Create a dataset to begin analysis</p>
                </div>
              )}
            </div>

            {/* Dataset Details */}
            <div className="rounded-lg border p-4 md:col-span-2">
              {selectedDataset ? (
                <div>
                  <h3 className="mb-4 font-medium">{selectedDataset.name}</h3>
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div className="rounded border p-2">
                      <div className="text-sm text-gray-500">Source</div>
                      <div className="font-medium capitalize">{selectedDataset.source}</div>
                    </div>
                    <div className="rounded border p-2">
                      <div className="text-sm text-gray-500">Data Points</div>
                      <div className="font-medium">{selectedDataset.dataPoints.length}</div>
                    </div>
                    <div className="rounded border p-2">
                      <div className="text-sm text-gray-500">Created</div>
                      <div className="font-medium">
                        {new Date(selectedDataset.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="rounded border p-2">
                      <div className="text-sm text-gray-500">Updated</div>
                      <div className="font-medium">
                        {new Date(selectedDataset.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="mb-2 font-medium">Description</h4>
                    <p className="text-sm">{selectedDataset.description}</p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Data Preview</h4>
                    <div className="overflow-x-auto rounded border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              ID
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Name
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Type
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {selectedDataset.dataPoints.slice(0, 5).map(point => (
                            <tr key={point.id}>
                              <td className="whitespace-nowrap px-3 py-2 text-xs">
                                {point.id.substring(0, 8)}...
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-xs">{point.name}</td>
                              <td className="whitespace-nowrap px-3 py-2 text-xs capitalize">
                                {point.type}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-xs">
                                {new Date(point.date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {selectedDataset.dataPoints.length > 5 && (
                      <div className="mt-1 text-right text-xs text-gray-500">
                        Showing 5 of {selectedDataset.dataPoints.length} data points
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-500">
                  <Database className="mx-auto mb-2" />
                  <p>Select a dataset to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Analysis Configurations List */}
            <div className="rounded-lg border p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium">Analysis Configurations</h3>
                <button
                  className="rounded bg-blue-500 p-1 text-white hover:bg-blue-600"
                  title="Create new analysis"
                  onClick={() => setShowCreateAnalysis(!showCreateAnalysis)}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Create Analysis Form */}
              {showCreateAnalysis && (
                <div className="mb-4 rounded border bg-gray-50 p-3">
                  <h4 className="mb-2 font-medium">Create New Analysis</h4>
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Name</label>
                    <input
                      type="text"
                      className="w-full rounded border p-2"
                      value={newAnalysisName}
                      onChange={e => setNewAnalysisName(e.target.value)}
                      placeholder="Enter analysis name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Description</label>
                    <textarea
                      className="w-full rounded border p-2"
                      value={newAnalysisDescription}
                      onChange={e => setNewAnalysisDescription(e.target.value)}
                      placeholder="Enter analysis description"
                      rows={2}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Dataset</label>
                    <select
                      className="w-full rounded border p-2"
                      value={newAnalysisDatasetId}
                      onChange={e => setNewAnalysisDatasetId(e.target.value)}
                    >
                      <option value="">Select a dataset</option>
                      {datasets.map(dataset => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Analysis Type</label>
                    <select
                      className="w-full rounded border p-2"
                      value={newAnalysisType}
                      onChange={e => setNewAnalysisType(e.target.value as AnalysisType)}
                    >
                      <option value="trend">Trend Analysis</option>
                      <option value="correlation">Correlation Analysis</option>
                      <option value="distribution">Distribution Analysis</option>
                      <option value="clustering">Clustering Analysis</option>
                      <option value="prediction">Prediction Analysis</option>
                      <option value="comparison">Comparison Analysis</option>
                      <option value="anomalyDetection">Anomaly Detection</option>
                      <option value="resourceMapping">Resource Mapping</option>
                      <option value="sectorAnalysis">Sector Analysis</option>
                      <option value="custom">Custom Analysis</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Visualization Type</label>
                    <select
                      className="w-full rounded border p-2"
                      value={newAnalysisVisualization}
                      onChange={e =>
                        setNewAnalysisVisualization(e.target.value as VisualizationType)
                      }
                    >
                      <option value="lineChart">Line Chart</option>
                      <option value="barChart">Bar Chart</option>
                      <option value="scatterPlot">Scatter Plot</option>
                      <option value="pieChart">Pie Chart</option>
                      <option value="heatMap">Heat Map</option>
                      <option value="radar">Radar Chart</option>
                      <option value="histogram">Histogram</option>
                      <option value="boxPlot">Box Plot</option>
                      <option value="table">Table</option>
                      <option value="map">Map</option>
                      <option value="network">Network Graph</option>
                      <option value="custom">Custom Visualization</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="mr-2 rounded bg-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-400"
                      onClick={() => setShowCreateAnalysis(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                      onClick={handleCreateAnalysis}
                      disabled={!newAnalysisName || !newAnalysisDatasetId}
                    >
                      Create Analysis
                    </button>
                  </div>
                </div>
              )}

              {analysisConfigs.length > 0 ? (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {analysisConfigs.map(config => (
                    <div
                      key={config.id}
                      className={`cursor-pointer rounded border p-2 ${
                        selectedConfigId === config.id
                          ? 'border-blue-200 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedConfigId(config.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{config.name}</div>
                          <div className="text-xs text-gray-500">
                            {config.type} • {config.visualizationType}
                          </div>
                        </div>
                        <div className="flex">
                          <button
                            className="mr-1 p-1 text-gray-400 hover:text-green-500"
                            onClick={e => {
                              e.stopPropagation();
                              runAnalysis(config.id);
                            }}
                            title="Run analysis"
                          >
                            <Play size={14} />
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-red-500"
                            onClick={e => {
                              e.stopPropagation();
                              deleteAnalysisConfig(config.id);
                              if (selectedConfigId === config.id) {
                                setSelectedConfigId(null);
                              }
                            }}
                            title="Delete analysis"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Settings className="mx-auto mb-2" />
                  <p>No analysis configurations</p>
                  <p className="text-sm">Create an analysis to begin</p>
                </div>
              )}
            </div>

            {/* Analysis Configuration Details */}
            <div className="rounded-lg border p-4 md:col-span-2">
              {selectedConfig ? (
                <div>
                  <h3 className="mb-4 font-medium">{selectedConfig.name}</h3>
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div className="rounded border p-2">
                      <div className="text-sm text-gray-500">Analysis Type</div>
                      <div className="font-medium capitalize">{selectedConfig.type}</div>
                    </div>
                    <div className="rounded border p-2">
                      <div className="text-sm text-gray-500">Visualization</div>
                      <div className="font-medium capitalize">
                        {selectedConfig.visualizationType}
                      </div>
                    </div>
                    <div className="rounded border p-2">
                      <div className="text-sm text-gray-500">Dataset</div>
                      <div className="font-medium">
                        {datasets.find(d => d.id === selectedConfig.datasetId)?.name || 'Unknown'}
                      </div>
                    </div>
                    <div className="rounded border p-2">
                      <div className="text-sm text-gray-500">Created</div>
                      <div className="font-medium">
                        {new Date(selectedConfig.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="mb-2 font-medium">Description</h4>
                    <p className="text-sm">{selectedConfig.description}</p>
                  </div>
                  <div className="mb-4">
                    <h4 className="mb-2 font-medium">Parameters</h4>
                    <div className="rounded border bg-gray-50 p-3">
                      <pre className="overflow-x-auto text-xs">
                        {JSON.stringify(selectedConfig.parameters, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Visualization Configuration</h4>
                    <div className="rounded border bg-gray-50 p-3">
                      <pre className="overflow-x-auto text-xs">
                        {JSON.stringify(selectedConfig.visualizationConfig, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="flex items-center rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                      onClick={() => runAnalysis(selectedConfig.id)}
                    >
                      <Play size={16} className="mr-1" />
                      Run Analysis
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-500">
                  <Settings className="mx-auto mb-2" />
                  <p>Select an analysis configuration to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Analysis Results List */}
            <div className="rounded-lg border p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium">Analysis Results</h3>
              </div>

              {analysisResults.length > 0 ? (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {analysisResults.map(result => {
                    const config = analysisConfigs.find(c => c.id === result.analysisConfigId);
                    return (
                      <div
                        key={result.id}
                        className={`cursor-pointer rounded border p-2 ${
                          selectedResultId === result.id
                            ? 'border-blue-200 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedResultId(result.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{config?.name || 'Unknown Analysis'}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(result.startTime).toLocaleString()} •{' '}
                              <span
                                className={`${
                                  result.status === 'completed'
                                    ? 'text-green-500'
                                    : result.status === 'failed'
                                      ? 'text-red-500'
                                      : result.status === 'processing'
                                        ? 'text-blue-500'
                                        : 'text-gray-500'
                                }`}
                              >
                                {result.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <BarChart2 className="mx-auto mb-2" />
                  <p>No analysis results</p>
                  <p className="text-sm">Run an analysis to see results</p>
                </div>
              )}
            </div>

            {/* Analysis Result Details */}
            <div className="rounded-lg border p-4 md:col-span-2">
              {selectedResultId && selectedResult ? (
                <ResultVisualization result={selectedResult} config={selectedResultConfig} />
              ) : (
                <div className="py-16 text-center text-gray-500">
                  <BarChart2 className="mx-auto mb-2" />
                  <p>Select a result to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

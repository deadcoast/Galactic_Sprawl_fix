import {
  AlertTriangle,
  BarChart2,
  Compass,
  Database,
  Layers,
  Map,
  Play,
  Plus,
  RadioTower,
  RefreshCw,
  Settings,
  Trash2,
} from 'lucide-react';
import * as React from 'react';
import { useDataAnalysis } from '../../contexts/DataAnalysisContext';
import { explorationManager } from '../../managers/exploration/ExplorationManager';
import {
  AnalysisConfig,
  AnalysisResult,
  AnalysisType,
  DataPoint,
  Dataset,
  VisualizationType,
} from '../../types/exploration/DataAnalysisTypes';
import { AnalysisVisualization } from './visualizations/AnalysisVisualization';

interface DataAnalysisSystemProps {
  className?: string;
}

// Result visualization component
interface ResultVisualizationProps {
  result: AnalysisResult;
  config?: AnalysisConfig;
}

function ResultVisualization({ result, config }: ResultVisualizationProps) {
  // Handle different result states
  if (result.status === 'pending' || result.status === 'processing') {
    return (
      <div className="py-8 text-center">
        <RefreshCw className="mx-auto mb-2 animate-spin" />
        <p>Processing analysis...</p>
        <p className="text-sm text-gray-500">This may take a few moments</p>
      </div>
    );
  }

  if (result.status === 'failed') {
    return (
      <div className="py-8 text-center text-red-500">
        <AlertTriangle className="mx-auto mb-2" />
        <p>Analysis failed</p>
        <p className="text-sm">{result.error || 'Unknown error occurred'}</p>
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
      <div className="mb-4 rounded border bg-white p-4">
        <AnalysisVisualization result={result} config={config} />
      </div>

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

// Dataset info component
interface DatasetInfoProps {
  dataset: Dataset;
}

function DatasetInfo({ dataset }: DatasetInfoProps) {
  // Count data points by type
  const counts = React.useMemo(() => {
    const typeCounts = {
      sector: 0,
      anomaly: 0,
      resource: 0,
    };

    dataset.dataPoints.forEach(dp => {
      if (dp.type in typeCounts) {
        typeCounts[dp.type as keyof typeof typeCounts]++;
      }
    });

    return typeCounts;
  }, [dataset.dataPoints]);

  // Get icon for dataset source
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'sectors':
        return <Map className="mr-2" size={16} />;
      case 'anomalies':
        return <RadioTower className="mr-2" size={16} />;
      case 'resources':
        return <Layers className="mr-2" size={16} />;
      case 'mixed':
        return <Compass className="mr-2" size={16} />;
      default:
        return <Database className="mr-2" size={16} />;
    }
  };

  return (
    <div className="mb-4 rounded border bg-white p-4">
      <div className="mb-2 flex items-center">
        {getSourceIcon(dataset.source)}
        <h3 className="font-medium">{dataset.name}</h3>
      </div>

      <p className="mb-2 text-sm text-gray-600">{dataset.description}</p>

      <div className="mb-2 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded bg-blue-50 p-2 text-center">
          <div className="font-medium text-blue-700">{counts.sector}</div>
          <div className="text-xs text-blue-600">Sectors</div>
        </div>
        <div className="rounded bg-purple-50 p-2 text-center">
          <div className="font-medium text-purple-700">{counts.anomaly}</div>
          <div className="text-xs text-purple-600">Anomalies</div>
        </div>
        <div className="rounded bg-green-50 p-2 text-center">
          <div className="font-medium text-green-700">{counts.resource}</div>
          <div className="text-xs text-green-600">Resources</div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <div>
          <span className="font-medium">Created:</span>{' '}
          {new Date(dataset.createdAt).toLocaleDateString()}
        </div>
        <div>
          <span className="font-medium">Updated:</span>{' '}
          {new Date(dataset.updatedAt).toLocaleDateString()}
        </div>
        <div>
          <span className="font-medium">Total Points:</span> {dataset.dataPoints.length}
        </div>
      </div>
    </div>
  );
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
    getAnalysisResultsByConfigId,
    getOrCreateDatasetBySource,
  } = useDataAnalysis();

  // State for active tab and selected items
  const [activeTab, setActiveTab] = React.useState<'datasets' | 'analysis' | 'results'>('datasets');
  const [selectedDatasetId, setSelectedDatasetId] = React.useState<string | null>(null);
  const [selectedConfigId, setSelectedConfigId] = React.useState<string | null>(null);
  const [selectedResultId, setSelectedResultId] = React.useState<string | null>(null);

  // Add search/filter state
  const [searchQuery, setSearchQuery] = React.useState('');

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

  // State for exploration stats
  const [explorationStats, setExplorationStats] = React.useState({
    sectorsDiscovered: 0,
    sectorsScanned: 0,
    anomaliesDetected: 0,
    resourcesDetected: 0,
  });

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

  // Add filtered datasets
  const filteredDatasets = React.useMemo(() => {
    if (!searchQuery) return datasets;

    return datasets.filter(
      dataset =>
        dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [datasets, searchQuery]);

  // Get auto-generated exploration datasets
  const explorationDatasets = React.useMemo(() => {
    return datasets.filter(dataset =>
      ['sectors', 'anomalies', 'resources'].includes(dataset.source)
    );
  }, [datasets]);

  // Function to create a dataset from exploration data
  const handleCreateDataset = () => {
    if (!newDatasetName) {
      return;
    }

    // If we're creating from an exploration source, get or create a dataset for that source
    if (['sectors', 'anomalies', 'resources'].includes(newDatasetSource)) {
      const datasetId = getOrCreateDatasetBySource(
        newDatasetSource as 'sectors' | 'anomalies' | 'resources',
        newDatasetName
      );

      // Select the created/existing dataset
      setSelectedDatasetId(datasetId);

      // Reset form
      setNewDatasetName('');
      setNewDatasetDescription('');
      setShowCreateDataset(false);
      return;
    }

    // For mixed datasets, create a new dataset with sample data
    const dataPoints: DataPoint[] = [];

    // Create the dataset
    createDataset({
      name: newDatasetName,
      description: newDatasetDescription || 'Custom dataset for exploration analysis',
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
  // Note: This is kept for backward compatibility but will be phased out
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

  // Effect to update exploration stats
  React.useEffect(() => {
    // Function to update stats
    const updateStats = () => {
      // Get stats safely without directly accessing protected property
      const stats = explorationManager.getMetadata().stats || {};
      setExplorationStats({
        sectorsDiscovered: (stats.sectorsDiscovered as number) || 0,
        sectorsScanned: (stats.sectorsScanned as number) || 0,
        anomaliesDetected: (stats.anomaliesDetected as number) || 0,
        resourcesDetected: (stats.resourcesDetected as number) || 0,
      });
    };

    // Initial update
    updateStats();

    // Set up an interval to update every 5 seconds
    const interval = setInterval(updateStats, 5000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  // Render the component
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

        {/* Exploration stats */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          <div className="rounded bg-blue-50 p-2 text-center">
            <div className="text-sm font-medium text-blue-700">
              {explorationStats.sectorsDiscovered}
            </div>
            <div className="text-xs text-blue-600">Sectors</div>
          </div>
          <div className="rounded bg-green-50 p-2 text-center">
            <div className="text-sm font-medium text-green-700">
              {explorationStats.sectorsScanned}
            </div>
            <div className="text-xs text-green-600">Scanned</div>
          </div>
          <div className="rounded bg-purple-50 p-2 text-center">
            <div className="text-sm font-medium text-purple-700">
              {explorationStats.anomaliesDetected}
            </div>
            <div className="text-xs text-purple-600">Anomalies</div>
          </div>
          <div className="rounded bg-yellow-50 p-2 text-center">
            <div className="text-sm font-medium text-yellow-700">
              {explorationStats.resourcesDetected}
            </div>
            <div className="text-xs text-yellow-600">Resources</div>
          </div>
        </div>
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
          data-testid="datasets-tab"
        >
          <div className="flex items-center">
            <Database className="mr-2" size={16} />
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
          data-testid="analysis-tab"
        >
          <div className="flex items-center">
            <Settings className="mr-2" size={16} />
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
          data-testid="results-tab"
        >
          <div className="flex items-center">
            <BarChart2 className="mr-2" size={16} />
            Results
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Datasets Tab */}
        <div className={activeTab === 'datasets' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Datasets List */}
            <div className="rounded-lg border p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium">Datasets</h3>
                <button
                  className="rounded bg-blue-500 p-1 text-white hover:bg-blue-600"
                  onClick={() => setShowCreateDataset(true)}
                  title="Create new dataset"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add search input */}
              <div className="mb-4">
                <input
                  type="text"
                  className="w-full rounded border p-2"
                  placeholder="Filter datasets..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  data-testid="dataset-filter"
                />
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
                    <input
                      type="text"
                      className="w-full rounded border p-2"
                      value={newDatasetDescription}
                      onChange={e => setNewDatasetDescription(e.target.value)}
                      placeholder="Enter description"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium">Source</label>
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
                  <div className="flex justify-end space-x-2">
                    <button
                      className="rounded border px-2 py-1 text-gray-600 hover:bg-gray-100"
                      onClick={() => setShowCreateDataset(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                      onClick={handleCreateDataset}
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}

              {/* Exploration Datasets Section */}
              {!showCreateDataset && explorationDatasets.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-medium text-purple-600">
                    <Compass className="mb-1 mr-1 inline" size={14} />
                    Exploration Datasets
                  </h4>
                  <div className="space-y-1 text-sm">
                    {explorationDatasets.map(dataset => (
                      <div
                        key={dataset.id}
                        className={`cursor-pointer rounded p-2 hover:bg-gray-100 ${
                          selectedDatasetId === dataset.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedDatasetId(dataset.id)}
                      >
                        <div className="flex items-center">
                          {dataset.source === 'sectors' && <Map className="mr-2" size={14} />}
                          {dataset.source === 'anomalies' && (
                            <RadioTower className="mr-2" size={14} />
                          )}
                          {dataset.source === 'resources' && <Layers className="mr-2" size={14} />}
                          {dataset.name}
                          <span className="ml-auto rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                            {dataset.dataPoints.length}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Datasets */}
              <div className="max-h-64 overflow-y-auto">
                <h4 className="mb-2 text-sm font-medium text-gray-600">All Datasets</h4>
                <div className="space-y-1">
                  {filteredDatasets.length > 0 ? (
                    filteredDatasets.map(dataset => (
                      <div
                        key={dataset.id}
                        className={`cursor-pointer rounded p-2 hover:bg-gray-100 ${
                          selectedDatasetId === dataset.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedDatasetId(dataset.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center overflow-hidden">
                            {dataset.source === 'sectors' && <Map className="mr-2" size={14} />}
                            {dataset.source === 'anomalies' && (
                              <RadioTower className="mr-2" size={14} />
                            )}
                            {dataset.source === 'resources' && (
                              <Layers className="mr-2" size={14} />
                            )}
                            {dataset.source === 'mixed' && <Compass className="mr-2" size={14} />}
                            <span className="truncate">{dataset.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2 text-xs text-gray-500">
                              {dataset.dataPoints.length} pts
                            </span>
                            <button
                              className="text-red-500 hover:text-red-700"
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
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm text-gray-500">No datasets found</div>
                  )}
                </div>
              </div>
            </div>

            {/* Dataset Details */}
            <div className="col-span-2 rounded-lg border p-4">
              {selectedDataset ? (
                <div>
                  <DatasetInfo dataset={selectedDataset} />

                  {/* Data Points */}
                  <div className="mb-4">
                    <h3 className="mb-2 font-medium">Data Points</h3>
                    <div className="max-h-96 overflow-y-auto">
                      {selectedDataset.dataPoints.length > 0 ? (
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border p-2 text-left text-sm">ID</th>
                              <th className="border p-2 text-left text-sm">Type</th>
                              <th className="border p-2 text-left text-sm">Name</th>
                              <th className="border p-2 text-left text-sm">Date</th>
                              <th className="border p-2 text-left text-sm">Properties</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedDataset.dataPoints.slice(0, 20).map(point => (
                              <tr key={point.id} className="hover:bg-gray-50">
                                <td className="border p-2 text-sm">
                                  {point.id.substring(0, 8)}...
                                </td>
                                <td className="border p-2 text-sm">
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-xs ${
                                      point.type === 'sector'
                                        ? 'bg-blue-100 text-blue-700'
                                        : point.type === 'anomaly'
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-green-100 text-green-700'
                                    }`}
                                  >
                                    {point.type}
                                  </span>
                                </td>
                                <td className="border p-2 text-sm">{point.name}</td>
                                <td className="border p-2 text-sm">
                                  {new Date(point.date).toLocaleDateString()}
                                </td>
                                <td className="border p-2 text-sm">
                                  <div className="max-h-20 overflow-y-auto">
                                    {Object.entries(point.properties).map(([key, value]) => (
                                      <div key={key} className="text-xs">
                                        <span className="font-medium">{key}:</span>{' '}
                                        {typeof value === 'object'
                                          ? JSON.stringify(value)
                                          : String(value)}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center text-sm text-gray-500">No data points</div>
                      )}
                      {selectedDataset.dataPoints.length > 20 && (
                        <div className="mt-2 text-center text-xs text-gray-500">
                          Showing 20 of {selectedDataset.dataPoints.length} data points
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Available Analyses */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium">Analyses</h3>
                      <button
                        className="rounded bg-blue-500 p-1 text-white hover:bg-blue-600"
                        onClick={() => {
                          setNewAnalysisDatasetId(selectedDataset.id);
                          setShowCreateAnalysis(true);
                          setActiveTab('analysis');
                        }}
                        title="Create new analysis"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="space-y-1 text-sm">
                      {analysisConfigs
                        .filter(config => config.datasetId === selectedDataset.id)
                        .map(config => (
                          <div
                            key={config.id}
                            className="cursor-pointer rounded-md border p-2 hover:bg-gray-50"
                            onClick={() => {
                              setSelectedConfigId(config.id);
                              setActiveTab('analysis');
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{config.name}</div>
                                <div className="text-xs text-gray-500">{config.description}</div>
                              </div>
                              <div className="flex items-center">
                                <span
                                  className={`mr-2 rounded px-1.5 py-0.5 text-xs ${
                                    config.type === 'trend'
                                      ? 'bg-blue-100 text-blue-700'
                                      : config.type === 'correlation'
                                        ? 'bg-green-100 text-green-700'
                                        : config.type === 'clustering'
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {config.type}
                                </span>
                                <button
                                  className="ml-1 text-blue-500 hover:text-blue-700"
                                  onClick={e => {
                                    e.stopPropagation();
                                    runAnalysis(config.id).catch(console.error);
                                  }}
                                  title="Run analysis"
                                >
                                  <Play size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      {analysisConfigs.filter(config => config.datasetId === selectedDataset.id)
                        .length === 0 && (
                        <div className="text-center text-gray-500">
                          No analyses configured for this dataset
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-500">
                  <Database className="mb-2" size={32} />
                  <p>Select a dataset to view details</p>
                  <p className="mt-2 text-sm">
                    Or{' '}
                    <button
                      className="text-blue-500 hover:underline"
                      onClick={() => setShowCreateDataset(true)}
                    >
                      create a new dataset
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Tab */}
        <div className={activeTab === 'analysis' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Analysis List */}
            <div className="rounded-lg border p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium">Analyses</h3>
                <button
                  className="rounded bg-blue-500 p-1 text-white hover:bg-blue-600"
                  onClick={() => setShowCreateAnalysis(true)}
                  title="Create new analysis"
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
                    <input
                      type="text"
                      className="w-full rounded border p-2"
                      value={newAnalysisDescription}
                      onChange={e => setNewAnalysisDescription(e.target.value)}
                      placeholder="Enter description"
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
                          {dataset.name} ({dataset.source}, {dataset.dataPoints.length} points)
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
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      className="rounded border px-2 py-1 text-gray-600 hover:bg-gray-100"
                      onClick={() => setShowCreateAnalysis(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                      onClick={handleCreateAnalysis}
                      disabled={!newAnalysisName || !newAnalysisDatasetId}
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}

              {/* Analysis List */}
              <div className="max-h-96 overflow-y-auto">
                {analysisConfigs.length > 0 ? (
                  <div className="space-y-2">
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
                              {config.type} •
                              {datasets.find(d => d.id === config.datasetId)?.name ||
                                'Unknown dataset'}
                            </div>
                          </div>
                          <div className="flex">
                            <button
                              className="mr-1 p-1 text-blue-500 hover:text-blue-700"
                              onClick={e => {
                                e.stopPropagation();
                                runAnalysis(config.id).catch(console.error);
                              }}
                              title="Run analysis"
                            >
                              <Play size={16} />
                            </button>
                            <button
                              className="p-1 text-red-500 hover:text-red-700"
                              onClick={e => {
                                e.stopPropagation();
                                deleteAnalysisConfig(config.id);
                                if (selectedConfigId === config.id) {
                                  setSelectedConfigId(null);
                                }
                              }}
                              title="Delete analysis"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500">
                    No analysis configurations available
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Details */}
            <div className="col-span-2 rounded-lg border p-4">
              {selectedConfig ? (
                <div>
                  <div className="mb-4">
                    <h3 className="font-medium">{selectedConfig.name}</h3>
                    <p className="text-sm text-gray-500">{selectedConfig.description}</p>
                  </div>

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
                    <h4 className="mb-2 font-medium">Parameters</h4>
                    <div className="rounded border bg-gray-50 p-3">
                      <pre className="text-xs">
                        {JSON.stringify(selectedConfig.parameters, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="mb-2 font-medium">Results</h4>
                    <div className="space-y-2">
                      {getAnalysisResultsByConfigId(selectedConfig.id).length > 0 ? (
                        getAnalysisResultsByConfigId(selectedConfig.id).map(result => (
                          <div
                            key={result.id}
                            className={`cursor-pointer rounded border p-2 ${
                              selectedResultId === result.id
                                ? 'border-blue-200 bg-blue-50'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              setSelectedResultId(result.id);
                              setActiveTab('results');
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {result.status === 'completed' && (
                                  <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
                                )}
                                {result.status === 'processing' && (
                                  <RefreshCw className="mr-2 animate-spin" size={14} />
                                )}
                                {result.status === 'failed' && (
                                  <AlertTriangle className="mr-2 text-red-500" size={14} />
                                )}
                                <div>
                                  <div className="text-sm">
                                    Run on {new Date(result.startTime).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Status: {result.status}
                                  </div>
                                </div>
                              </div>
                              <div>
                                {result.status === 'completed' && (
                                  <span className="text-xs text-gray-500">
                                    {result.endTime &&
                                      `${((result.endTime - result.startTime) / 1000).toFixed(2)}s`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-sm text-gray-500">
                          No results available. Run the analysis to see results.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                      onClick={() => runAnalysis(selectedConfig.id).catch(console.error)}
                    >
                      <Play className="mr-2 inline" size={14} />
                      Run Analysis
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-500">
                  <Settings className="mb-2" size={32} />
                  <p>Select an analysis to view details</p>
                  <p className="mt-2 text-sm">
                    Or{' '}
                    <button
                      className="text-blue-500 hover:underline"
                      onClick={() => setShowCreateAnalysis(true)}
                    >
                      create a new analysis
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Tab */}
        <div className={activeTab === 'results' ? 'block' : 'hidden'}>
          {selectedResult ? (
            <ResultVisualization result={selectedResult} config={selectedResultConfig} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center text-gray-500">
              <BarChart2 className="mb-2" size={32} />
              <p>No analysis result selected</p>
              <p className="mt-2 text-sm">Run an analysis to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

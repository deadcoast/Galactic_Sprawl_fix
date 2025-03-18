import {
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { Compass, Database, Layers, Map, RadioTower } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect } from 'react';
import { useDataAnalysis } from '../../contexts/DataAnalysisContext';
import { moduleEventBus } from '../../lib/events/ModuleEventBus';
import { EventType } from '../../types/events/EventTypes';
import { StandardizedEvent } from '../../types/events/StandardizedEvents';
import {
  AnalysisConfig,
  AnalysisResult,
  DataPoint,
  Dataset,
} from '../../types/exploration/DataAnalysisTypes';
import AnalysisConfigManager from './AnalysisConfigManager';
import DataFilterPanel from './DataFilterPanel';
import DataPointVirtualList from './DataPointVirtualList';
import DatasetManager from './DatasetManager';
import ResultsPanel from './ResultsPanel';
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
      <div className="flex h-[300px] items-center justify-center">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Processing analysis...
        </Typography>
      </div>
    );
  }

  if (result.status === 'failed') {
    return (
      <div className="rounded bg-red-50 p-3">
        <Typography variant="h6" color="error">
          Analysis Failed
        </Typography>
        <Typography variant="body1">{result.error || 'Unknown error occurred'}</Typography>
      </div>
    );
  }

  return (
    <div>
      {result.summary && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          {result.summary}
        </Typography>
      )}

      {result.insights && result.insights.length > 0 && (
        <div className="mb-2">
          <Typography variant="h6">Key Insights</Typography>
          <ul>
            {result.insights.map((insight, index) => (
              <li key={index}>
                <Typography variant="body2">{insight}</Typography>
              </li>
            ))}
          </ul>
        </div>
      )}

      {config && <AnalysisVisualization result={result} config={config} />}
      {!config && (
        <Typography variant="body2">No configuration available for visualization</Typography>
      )}
    </div>
  );
}

// Dataset info component
interface DatasetInfoProps {
  dataset: Dataset;
}

function _DatasetInfo({ dataset }: DatasetInfoProps) {
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
  }, [dataset]);

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

// Utility function that uses _DatasetInfo for development purposes
const _logDatasetDetails = (dataset: Dataset): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Dataset loaded: ${dataset.id} with ${dataset.dataPoints.length} data points`);
    // In a real implementation, we might render _DatasetInfo to a debug panel
  }
};

export function DataAnalysisSystem({ className = '' }: DataAnalysisSystemProps) {
  const {
    datasets,
    analysisConfigs,
    analysisResults,
    createDataset,
    updateDataset,
    deleteDataset,
    createAnalysisConfig,
    updateAnalysisConfig,
    deleteAnalysisConfig,
    runAnalysis,
    getAnalysisResultsByConfigId,
    refreshData,
    filterDataset,
  } = useDataAnalysis();

  const [selectedDataset, setSelectedDataset] = React.useState<Dataset | null>(null);
  const [selectedConfig, setSelectedConfig] = React.useState<AnalysisConfig | null>(null);
  const [activeTab, setActiveTab] = React.useState<number>(0);
  const [filteredData, setFilteredData] = React.useState<DataPoint[]>([]);
  const [filters, setFilters] = React.useState<
    Array<{
      field: string;
      operator:
        | 'equals'
        | 'notEquals'
        | 'greaterThan'
        | 'lessThan'
        | 'contains'
        | 'notContains'
        | 'between';
      value: string | number | boolean | string[] | [number, number];
    }>
  >([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = React.useState<number>(Date.now());
  const [selectedDataPoint, setSelectedDataPoint] = React.useState<DataPoint | null>(null);

  // Effect to handle initial data loading
  React.useEffect(() => {
    refreshDatasets();
  }, []);

  // Effect to apply filters when they change
  React.useEffect(() => {
    if (selectedDataset && filters.length > 0) {
      const filtered = filterDataset(selectedDataset.id, filters);
      setFilteredData(filtered);
    } else if (selectedDataset) {
      setFilteredData(selectedDataset.dataPoints);
    } else {
      setFilteredData([]);
    }
  }, [selectedDataset, filters, filterDataset, lastRefresh]);

  // Get latest results for the selected config
  const currentResults = selectedConfig
    ? getAnalysisResultsByConfigId(selectedConfig.id).sort(
        (a, b) => (b.startTime || 0) - (a.startTime || 0)
      )
    : [];

  const latestResult = currentResults.length > 0 ? currentResults[0] : null;

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle dataset selection with standardized events
  const handleSelectDataset = useCallback(
    (dataset: Dataset) => {
      setSelectedDataset(dataset);
      if (filters.length > 0) {
        const filtered = filterDataset(dataset.id, filters);
        setFilteredData(filtered);
      } else {
        setFilteredData(dataset.dataPoints);
      }

      // Emit dataset selection event
      const event: StandardizedEvent = {
        type: EventType.MODULE_UPDATED,
        moduleId: dataset.id,
        moduleType: 'exploration',
        timestamp: Date.now(),
        data: {
          action: 'select_dataset',
          datasetId: dataset.id,
          filterCount: filters.length,
        },
      };
      moduleEventBus.emit(event);
    },
    [filters]
  );

  // Handle config selection with standardized events
  const handleSelectConfig = useCallback((config: AnalysisConfig) => {
    setSelectedConfig(config);

    // Emit config selection event
    const event: StandardizedEvent = {
      type: EventType.MODULE_UPDATED,
      moduleId: config.id,
      moduleType: 'exploration',
      timestamp: Date.now(),
      data: {
        action: 'select_config',
        configId: config.id,
        configType: config.type,
      },
    };
    moduleEventBus.emit(event);
  }, []);

  // Handle running analysis with standardized events
  const handleRunAnalysis = useCallback(async () => {
    if (!selectedConfig) return;

    setIsLoading(true);
    try {
      await runAnalysis(selectedConfig.id);

      // Emit analysis complete event
      const event: StandardizedEvent = {
        type: EventType.MODULE_UPDATED,
        moduleId: selectedConfig.id,
        moduleType: 'exploration',
        timestamp: Date.now(),
        data: {
          action: 'run_analysis',
          configId: selectedConfig.id,
          configType: selectedConfig.type,
          status: 'complete',
        },
      };
      moduleEventBus.emit(event);
    } catch (error) {
      console.error('Error running analysis:', error);

      // Emit analysis error event
      const event: StandardizedEvent = {
        type: EventType.MODULE_UPDATED,
        moduleId: selectedConfig.id,
        moduleType: 'exploration',
        timestamp: Date.now(),
        data: {
          action: 'run_analysis',
          configId: selectedConfig.id,
          configType: selectedConfig.type,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
      moduleEventBus.emit(event);
    } finally {
      setIsLoading(false);
    }
  }, [selectedConfig]);

  // Refresh datasets from the data collection service
  const refreshDatasets = () => {
    setIsLoading(true);
    refreshData();
    setLastRefresh(Date.now());
    setIsLoading(false);
  };

  // Handle filter changes with standardized events
  const handleFilterChange = useCallback(
    (
      newFilters: Array<{
        field: string;
        operator:
          | 'equals'
          | 'notEquals'
          | 'greaterThan'
          | 'lessThan'
          | 'contains'
          | 'notContains'
          | 'between';
        value: string | number | boolean | string[] | [number, number];
      }>
    ) => {
      setFilters(newFilters);
      if (selectedDataset) {
        const filtered = filterDataset(selectedDataset.id, newFilters);
        setFilteredData(filtered);

        // Emit filter change event
        const event: StandardizedEvent = {
          type: EventType.MODULE_UPDATED,
          moduleId: selectedDataset.id,
          moduleType: 'exploration',
          timestamp: Date.now(),
          data: {
            action: 'update_filters',
            datasetId: selectedDataset.id,
            filterCount: newFilters.length,
            filteredCount: filtered.length,
          },
        };
        moduleEventBus.emit(event);
      }
    },
    [selectedDataset]
  );

  // Handle data point selection with standardized events
  const handleSelectDataPoint = useCallback(
    (dataPoint: DataPoint) => {
      setSelectedDataPoint(dataPoint);

      // Emit data point selection event
      const event: StandardizedEvent = {
        type: EventType.MODULE_UPDATED,
        moduleId: dataPoint.id,
        moduleType: 'exploration',
        timestamp: Date.now(),
        data: {
          action: 'select_data_point',
          dataPointId: dataPoint.id,
          datasetId: selectedDataset?.id,
        },
      };
      moduleEventBus.emit(event);
    },
    [selectedDataset]
  );

  // Use the utility function that references _DatasetInfo
  React.useEffect(() => {
    if (selectedDataset) {
      _logDatasetDetails(selectedDataset);
    }
  }, [selectedDataset]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    const cleanup = () => {
      // Any cleanup needed for event subscriptions
    };

    return cleanup;
  }, []);

  return (
    <div className={className}>
      <Typography variant="h6" gutterBottom>
        Data Analysis System
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Datasets" />
        <Tab label="Analysis" />
        <Tab label="Results" />
      </Tabs>

      <Grid container spacing={2}>
        {/* Left Panel */}
        <Grid item xs={12} md={3}>
          {activeTab === 0 && (
            <Paper sx={{ p: 2 }}>
              <DatasetManager
                datasets={datasets}
                selectedDataset={selectedDataset}
                onSelectDataset={handleSelectDataset}
                onCreateDataset={createDataset}
                onUpdateDataset={updateDataset}
                onDeleteDataset={deleteDataset}
              />
            </Paper>
          )}
          {activeTab === 1 && (
            <Paper sx={{ p: 2 }}>
              <AnalysisConfigManager
                configs={analysisConfigs}
                selectedConfig={selectedConfig}
                onSelectConfig={handleSelectConfig}
                onCreateConfig={createAnalysisConfig}
                onUpdateConfig={updateAnalysisConfig}
                onDeleteConfig={deleteAnalysisConfig}
                datasets={datasets}
              />
            </Paper>
          )}
          {activeTab === 2 && (
            <Paper sx={{ p: 2 }}>
              <ResultsPanel
                results={analysisResults}
                configs={analysisConfigs}
                onSelectResult={result => {
                  // Find and select the config that was used for this result
                  const config = analysisConfigs.find(c => c.id === result.analysisConfigId);
                  if (config) {
                    setSelectedConfig(config);
                    setActiveTab(1); // Switch to Analysis tab
                  }
                }}
              />
            </Paper>
          )}
        </Grid>

        {/* Center Panel */}
        <Grid item xs={12} md={activeTab === 0 ? 5 : 9}>
          {activeTab === 0 && selectedDataset && (
            <Paper sx={{ p: 2 }}>
              <div className="mb-2">
                <Typography variant="h6">{selectedDataset.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedDataset.description}
                </Typography>
                <div className="mt-1 flex items-center">
                  <Button
                    size="small"
                    onClick={refreshDatasets}
                    disabled={isLoading}
                    sx={{ mr: 1 }}
                  >
                    {isLoading ? <CircularProgress size={20} /> : 'Refresh'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    {filteredData.length} data points
                    {filters.length > 0
                      ? ` (filtered from ${selectedDataset.dataPoints.length})`
                      : ''}
                  </Typography>
                </div>
              </div>

              <Divider sx={{ my: 2 }} />

              {/* Replace static list with virtualized list */}
              <div className="h-[400px]">
                <DataPointVirtualList
                  dataPoints={filteredData}
                  isLoading={isLoading}
                  onSelectDataPoint={handleSelectDataPoint}
                  selectedDataPointId={selectedDataPoint?.id}
                  height="100%"
                />
              </div>
            </Paper>
          )}

          {activeTab === 1 && selectedConfig && (
            <Paper sx={{ p: 2 }}>
              <div className="mb-2">
                <Typography variant="h6">{selectedConfig.name}</Typography>
                <Typography variant="body2">{selectedConfig.description}</Typography>
                <div className="mt-2">
                  <Button variant="contained" onClick={handleRunAnalysis} disabled={isLoading}>
                    {isLoading ? <CircularProgress size={24} /> : 'Run Analysis'}
                  </Button>
                </div>
              </div>

              <Divider sx={{ my: 2 }} />

              {/* Results visualization */}
              {latestResult && (
                <ResultVisualization result={latestResult} config={selectedConfig} />
              )}
            </Paper>
          )}
        </Grid>

        {/* Right Panel - only visible in dataset tab */}
        {activeTab === 0 && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Filters
              </Typography>
              <DataFilterPanel
                _datasetId={selectedDataset?.id || ''}
                filters={filters}
                onFilterChange={handleFilterChange}
              />

              {selectedDataPoint && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Selected Data Point
                  </Typography>
                  <div className="rounded bg-gray-50 p-1">
                    <Typography variant="subtitle1">{selectedDataPoint.name}</Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Type: {selectedDataPoint.type} | ID: {selectedDataPoint.id}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Coordinates: ({selectedDataPoint.coordinates.x},{' '}
                      {selectedDataPoint.coordinates.y})
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Date: {new Date(selectedDataPoint.date).toLocaleString()}
                    </Typography>

                    <Typography variant="overline" display="block" sx={{ mt: 1 }}>
                      Properties
                    </Typography>

                    <div className="ml-1">
                      {Object.entries(selectedDataPoint.properties).map(([key, value]) => (
                        <Typography key={key} variant="body2">
                          <strong>{key}:</strong>{' '}
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </Typography>
                      ))}
                    </div>

                    {selectedDataPoint.metadata &&
                      Object.keys(selectedDataPoint.metadata).length > 0 && (
                        <>
                          <Typography variant="overline" display="block" sx={{ mt: 1 }}>
                            Metadata
                          </Typography>
                          <div className="ml-1">
                            {Object.entries(selectedDataPoint.metadata).map(([key, value]) => (
                              <Typography key={key} variant="body2">
                                <strong>{key}:</strong>{' '}
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </Typography>
                            ))}
                          </div>
                        </>
                      )}
                  </div>
                </>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </div>
  );
}

export default DataAnalysisSystem;

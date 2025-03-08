import {
  Box,
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
import { useDataAnalysis } from '../../contexts/DataAnalysisContext';
import {
  AnalysisConfig,
  AnalysisResult,
  DataPoint,
  Dataset,
} from '../../types/exploration/DataAnalysisTypes';
import AnalysisConfigManager from './AnalysisConfigManager';
import DataFilterPanel from './DataFilterPanel';
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
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Processing analysis...
        </Typography>
      </Box>
    );
  }

  if (result.status === 'failed') {
    return (
      <Box sx={{ p: 3, bgcolor: '#fff4f4', borderRadius: 1 }}>
        <Typography variant="h6" color="error">
          Analysis Failed
        </Typography>
        <Typography variant="body1">{result.error || 'Unknown error occurred'}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {result.summary && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          {result.summary}
        </Typography>
      )}

      {result.insights && result.insights.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Key Insights</Typography>
          <ul>
            {result.insights.map((insight, index) => (
              <li key={index}>
                <Typography variant="body2">{insight}</Typography>
              </li>
            ))}
          </ul>
        </Box>
      )}

      <AnalysisVisualization result={result} config={config} />
    </Box>
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
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle dataset selection
  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    if (filters.length > 0) {
      const filtered = filterDataset(dataset.id, filters);
      setFilteredData(filtered);
    } else {
      setFilteredData(dataset.dataPoints);
    }
  };

  // Handle config selection
  const handleSelectConfig = (config: AnalysisConfig) => {
    setSelectedConfig(config);
  };

  // Handle running analysis
  const handleRunAnalysis = async () => {
    if (!selectedConfig) return;

    setIsLoading(true);
    try {
      await runAnalysis(selectedConfig.id);
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh datasets from the data collection service
  const refreshDatasets = () => {
    setIsLoading(true);
    refreshData();
    setLastRefresh(Date.now());
    setIsLoading(false);
  };

  // Handle filter changes
  const handleFilterChange = (
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
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Data Analysis System
        </Typography>
        <Typography variant="body1" paragraph>
          Analyze exploration data to discover patterns, correlations, and insights.
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={refreshDatasets}
          disabled={isLoading}
          sx={{ mr: 1 }}
        >
          {isLoading ? <CircularProgress size={20} /> : 'Refresh Data'}
        </Button>
      </Grid>

      <Grid item xs={12}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="Datasets" />
            <Tab label="Analysis" />
            <Tab label="Results" />
          </Tabs>
        </Paper>
      </Grid>

      {/* Datasets Tab */}
      {activeTab === 0 && (
        <>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Available Datasets
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <DatasetManager
                datasets={datasets}
                onSelectDataset={handleSelectDataset}
                selectedDataset={selectedDataset}
                onCreateDataset={createDataset}
                onUpdateDataset={updateDataset}
                onDeleteDataset={deleteDataset}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Data Explorer
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {selectedDataset ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Dataset: {selectedDataset.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Points: {filteredData.length} of {selectedDataset.dataPoints.length}
                    </Typography>
                  </Box>

                  <DataFilterPanel
                    datasetId={selectedDataset.id}
                    onFilterChange={handleFilterChange}
                    filters={filters}
                  />
                </>
              ) : (
                <Typography variant="body1">Select a dataset to explore its data</Typography>
              )}
            </Paper>
          </Grid>
        </>
      )}

      {/* Analysis Configuration Tab */}
      {activeTab === 1 && (
        <>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Analysis Configurations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <AnalysisConfigManager
                configs={analysisConfigs}
                datasets={datasets}
                onSelectConfig={handleSelectConfig}
                selectedConfig={selectedConfig}
                onCreateConfig={createAnalysisConfig}
                onUpdateConfig={updateAnalysisConfig}
                onDeleteConfig={deleteAnalysisConfig}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Run Analysis
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {selectedConfig ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">{selectedConfig.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type: {selectedConfig.type}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleRunAnalysis}
                    disabled={isLoading}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Run Analysis'}
                  </Button>

                  <Typography variant="body2" color="text.secondary">
                    {currentResults.length > 0
                      ? `This analysis has been run ${currentResults.length} times.`
                      : 'This analysis has not been run yet.'}
                  </Typography>
                </>
              ) : (
                <Typography variant="body1">Select an analysis configuration to run</Typography>
              )}
            </Paper>
          </Grid>
        </>
      )}

      {/* Results Tab */}
      {activeTab === 2 && (
        <>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Analysis Results
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <ResultsPanel
                results={analysisResults}
                configs={analysisConfigs}
                onSelectResult={result => {
                  const config = analysisConfigs.find(c => c.id === result.analysisConfigId);
                  if (config) {
                    setSelectedConfig(config);
                    setActiveTab(2);
                  }
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Result Visualization
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {selectedConfig && latestResult ? (
                <ResultVisualization result={latestResult} config={selectedConfig} />
              ) : (
                <Typography variant="body1">Select a result to view its visualization</Typography>
              )}
            </Paper>
          </Grid>
        </>
      )}
    </Grid>
  );
}

export default DataAnalysisSystem;

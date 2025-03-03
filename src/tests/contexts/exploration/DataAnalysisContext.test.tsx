import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DataAnalysisProvider, useDataAnalysis } from '../../../contexts/DataAnalysisContext';
import {
  createMockDataset,
  createMockAnalysisConfig,
  createMockAnalysisResult,
  createMockDataPoint
} from '../../utils/exploration/explorationTestUtils';
import { Dataset, AnalysisConfig, AnalysisResult } from '../../../types/exploration/DataAnalysisTypes';

// Test component that uses the DataAnalysisContext
const TestComponent: React.FC<{
  onCreateDataset?: (datasetId: string) => void;
  onUpdateDataset?: (id: string, updates: Partial<Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onDeleteDataset?: (id: string) => void;
  onCreateAnalysisConfig?: (configId: string) => void;
  onRunAnalysis?: (resultId: string) => void;
}> = ({ 
  onCreateDataset, 
  onUpdateDataset, 
  onDeleteDataset, 
  onCreateAnalysisConfig, 
  onRunAnalysis 
}) => {
  const {
    datasets,
    analysisConfigs,
    analysisResults,
    createDataset,
    updateDataset,
    deleteDataset,
    getDatasetById,
    createAnalysisConfig,
    updateAnalysisConfig,
    deleteAnalysisConfig,
    getAnalysisConfigById,
    runAnalysis,
    getAnalysisResultById,
    getAnalysisResultsByConfigId
  } = useDataAnalysis();

  const handleCreateDataset = () => {
    const newDataset = {
      name: 'Test Dataset',
      description: 'A test dataset for analysis',
      dataPoints: [
        createMockDataPoint({ type: 'anomaly' }),
        createMockDataPoint({ type: 'resource' }),
        createMockDataPoint({ type: 'sector' })
      ],
      source: 'mixed' as const
    };
    
    const datasetId = createDataset(newDataset);
    if (onCreateDataset) {
      onCreateDataset(datasetId);
    }
  };

  const handleUpdateDataset = (id: string) => {
    const updates = {
      name: 'Updated Dataset',
      description: 'Updated description'
    };
    
    updateDataset(id, updates);
    if (onUpdateDataset) {
      onUpdateDataset(id, updates);
    }
  };

  const handleDeleteDataset = (id: string) => {
    deleteDataset(id);
    if (onDeleteDataset) {
      onDeleteDataset(id);
    }
  };

  const handleCreateAnalysisConfig = (datasetId: string) => {
    const newConfig = {
      name: 'Test Analysis',
      description: 'A test analysis configuration',
      type: 'trend' as const,
      datasetId,
      parameters: {
        xAxis: 'date',
        yAxis: 'properties.value'
      },
      visualizationType: 'lineChart' as const,
      visualizationConfig: {
        showLegend: true,
        colors: ['#3b82f6', '#10b981', '#ef4444']
      }
    };
    
    const configId = createAnalysisConfig(newConfig);
    if (onCreateAnalysisConfig) {
      onCreateAnalysisConfig(configId);
    }
  };

  const handleRunAnalysis = async (configId: string) => {
    const resultId = await runAnalysis(configId);
    if (onRunAnalysis) {
      onRunAnalysis(resultId);
    }
  };

  return (
    <div>
      <h1>Data Analysis Test Component</h1>
      
      <div>
        <h2>Datasets ({datasets.length})</h2>
        <ul>
          {datasets.map(dataset => (
            <li key={dataset.id} data-testid={`dataset-${dataset.id}`}>
              {dataset.name} - {dataset.dataPoints.length} data points
              <button 
                onClick={() => handleUpdateDataset(dataset.id)}
                data-testid={`update-dataset-${dataset.id}`}
              >
                Update
              </button>
              <button 
                onClick={() => handleDeleteDataset(dataset.id)}
                data-testid={`delete-dataset-${dataset.id}`}
              >
                Delete
              </button>
              <button 
                onClick={() => handleCreateAnalysisConfig(dataset.id)}
                data-testid={`create-config-${dataset.id}`}
              >
                Create Analysis
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h2>Analysis Configs ({analysisConfigs.length})</h2>
        <ul>
          {analysisConfigs.map(config => (
            <li key={config.id} data-testid={`config-${config.id}`}>
              {config.name} - Type: {config.type}
              <button 
                onClick={() => handleRunAnalysis(config.id)}
                data-testid={`run-analysis-${config.id}`}
              >
                Run Analysis
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h2>Analysis Results ({analysisResults.length})</h2>
        <ul>
          {analysisResults.map(result => (
            <li key={result.id} data-testid={`result-${result.id}`}>
              Result for config: {result.analysisConfigId} - Status: {result.status}
            </li>
          ))}
        </ul>
      </div>
      
      <button onClick={handleCreateDataset} data-testid="create-dataset">
        Create Dataset
      </button>
    </div>
  );
};

describe('DataAnalysisContext', () => {
  let mockDatasets: Dataset[];
  let mockAnalysisConfigs: AnalysisConfig[];
  let mockAnalysisResults: AnalysisResult[];

  beforeEach(() => {
    mockDatasets = [
      createMockDataset({
        id: 'dataset-1',
        name: 'Test Dataset 1',
        source: 'anomalies'
      }),
      createMockDataset({
        id: 'dataset-2',
        name: 'Test Dataset 2',
        source: 'resources'
      })
    ];
    
    mockAnalysisConfigs = [
      createMockAnalysisConfig({
        id: 'config-1',
        name: 'Test Config 1',
        datasetId: 'dataset-1',
        type: 'trend'
      }),
      createMockAnalysisConfig({
        id: 'config-2',
        name: 'Test Config 2',
        datasetId: 'dataset-2',
        type: 'correlation'
      })
    ];
    
    mockAnalysisResults = [
      createMockAnalysisResult({
        id: 'result-1',
        analysisConfigId: 'config-1',
        status: 'completed'
      })
    ];
  });

  it('should render datasets', () => {
    render(
      <DataAnalysisProvider 
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <TestComponent />
      </DataAnalysisProvider>
    );

    // Check if all datasets are rendered
    mockDatasets.forEach(dataset => {
      expect(screen.getByTestId(`dataset-${dataset.id}`)).toBeInTheDocument();
    });
  });

  it('should render analysis configs', () => {
    render(
      <DataAnalysisProvider 
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <TestComponent />
      </DataAnalysisProvider>
    );

    // Check if all analysis configs are rendered
    mockAnalysisConfigs.forEach(config => {
      expect(screen.getByTestId(`config-${config.id}`)).toBeInTheDocument();
    });
  });

  it('should render analysis results', () => {
    render(
      <DataAnalysisProvider 
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <TestComponent />
      </DataAnalysisProvider>
    );

    // Check if all analysis results are rendered
    mockAnalysisResults.forEach(result => {
      expect(screen.getByTestId(`result-${result.id}`)).toBeInTheDocument();
    });
  });

  it('should create a new dataset', async () => {
    const onCreateDataset = vi.fn();
    const user = userEvent.setup();

    render(
      <DataAnalysisProvider 
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <TestComponent onCreateDataset={onCreateDataset} />
      </DataAnalysisProvider>
    );

    // Click the create dataset button
    await user.click(screen.getByTestId('create-dataset'));

    // Check if the callback was called with a dataset ID
    expect(onCreateDataset).toHaveBeenCalledWith(expect.any(String));
    
    // The new dataset should be added to the list
    await waitFor(() => {
      expect(screen.getAllByTestId(/^dataset-/)).toHaveLength(mockDatasets.length + 1);
    });
  });

  it('should update a dataset', async () => {
    const onUpdateDataset = vi.fn();
    const user = userEvent.setup();

    render(
      <DataAnalysisProvider 
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <TestComponent onUpdateDataset={onUpdateDataset} />
      </DataAnalysisProvider>
    );

    // Click the update button for the first dataset
    await user.click(screen.getByTestId(`update-dataset-${mockDatasets[0].id}`));

    // Check if the callback was called with the correct parameters
    expect(onUpdateDataset).toHaveBeenCalledWith(
      mockDatasets[0].id,
      expect.objectContaining({
        name: 'Updated Dataset',
        description: 'Updated description'
      })
    );
  });

  it('should delete a dataset', async () => {
    const onDeleteDataset = vi.fn();
    const user = userEvent.setup();

    render(
      <DataAnalysisProvider 
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <TestComponent onDeleteDataset={onDeleteDataset} />
      </DataAnalysisProvider>
    );

    // Get the initial number of datasets
    const initialDatasets = screen.getAllByTestId(/^dataset-/);

    // Click the delete button for the first dataset
    await user.click(screen.getByTestId(`delete-dataset-${mockDatasets[0].id}`));

    // Check if the callback was called with the correct ID
    expect(onDeleteDataset).toHaveBeenCalledWith(mockDatasets[0].id);
    
    // The dataset should be removed from the list
    await waitFor(() => {
      expect(screen.getAllByTestId(/^dataset-/)).toHaveLength(initialDatasets.length - 1);
    });
  });

  it('should create an analysis config', async () => {
    const onCreateAnalysisConfig = vi.fn();
    const user = userEvent.setup();

    render(
      <DataAnalysisProvider 
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <TestComponent onCreateAnalysisConfig={onCreateAnalysisConfig} />
      </DataAnalysisProvider>
    );

    // Click the create analysis config button for the first dataset
    await user.click(screen.getByTestId(`create-config-${mockDatasets[0].id}`));

    // Check if the callback was called with a config ID
    expect(onCreateAnalysisConfig).toHaveBeenCalledWith(expect.any(String));
    
    // The new config should be added to the list
    await waitFor(() => {
      expect(screen.getAllByTestId(/^config-/)).toHaveLength(mockAnalysisConfigs.length + 1);
    });
  });

  it('should run an analysis', async () => {
    const onRunAnalysis = vi.fn();
    const user = userEvent.setup();

    render(
      <DataAnalysisProvider 
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <TestComponent onRunAnalysis={onRunAnalysis} />
      </DataAnalysisProvider>
    );

    // Click the run analysis button for the first config
    await user.click(screen.getByTestId(`run-analysis-${mockAnalysisConfigs[0].id}`));

    // Check if the callback was called with a result ID
    await waitFor(() => {
      expect(onRunAnalysis).toHaveBeenCalledWith(expect.any(String));
    });
    
    // A new result should be added to the list
    await waitFor(() => {
      expect(screen.getAllByTestId(/^result-/)).toHaveLength(mockAnalysisResults.length + 1);
    });
  });
}); 
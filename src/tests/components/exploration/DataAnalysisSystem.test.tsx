import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataAnalysisSystem } from '../../../components/exploration/DataAnalysisSystem';
import { DataAnalysisProvider } from '../../../contexts/DataAnalysisContext';
import {
  createMockAnalysisConfig,
  createMockAnalysisResult,
  createMockDataset,
} from '../../utils/exploration/explorationTestUtils';

describe('DataAnalysisSystem', () => {
  const mockDatasets = [
    createMockDataset({
      id: 'dataset-1',
      name: 'Anomaly Dataset',
      description: 'Dataset containing anomaly data',
      source: 'anomalies',
    }),
    createMockDataset({
      id: 'dataset-2',
      name: 'Resource Dataset',
      description: 'Dataset containing resource data',
      source: 'resources',
    }),
  ];

  const mockAnalysisConfigs = [
    createMockAnalysisConfig({
      id: 'config-1',
      name: 'Trend Analysis',
      description: 'Analysis of trends over time',
      datasetId: 'dataset-1',
      type: 'trend',
      visualizationType: 'lineChart',
    }),
    createMockAnalysisConfig({
      id: 'config-2',
      name: 'Distribution Analysis',
      description: 'Analysis of data distribution',
      datasetId: 'dataset-2',
      type: 'distribution',
      visualizationType: 'histogram',
    }),
  ];

  const mockAnalysisResults = [
    createMockAnalysisResult({
      id: 'result-1',
      analysisConfigId: 'config-1',
      status: 'completed',
    }),
  ];

  it('should render the component with datasets and analysis configs', () => {
    render(
      <DataAnalysisProvider
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <DataAnalysisSystem />
      </DataAnalysisProvider>
    );

    // Check if datasets are rendered
    expect(screen.getByText('Anomaly Dataset')).toBeInTheDocument();
    expect(screen.getByText('Resource Dataset')).toBeInTheDocument();

    // Check if analysis configs are rendered
    expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
    expect(screen.getByText('Distribution Analysis')).toBeInTheDocument();
  });

  it('should allow creating a new dataset', async () => {
    const user = userEvent.setup();

    render(
      <DataAnalysisProvider
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <DataAnalysisSystem />
      </DataAnalysisProvider>
    );

    // Find and click the create dataset button
    const createButton = screen.getByRole('button', {
      name: /create dataset|new dataset|add dataset/i,
    });
    await user.click(createButton);

    // Fill in the dataset form (this will vary based on your implementation)
    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.type(nameInput, 'New Test Dataset');
    await user.type(descriptionInput, 'A dataset created in a test');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save|create|submit/i });
    await user.click(submitButton);

    // Check if the new dataset is added
    await waitFor(() => {
      expect(screen.getByText('New Test Dataset')).toBeInTheDocument();
    });
  });

  it('should allow creating a new analysis configuration', async () => {
    const user = userEvent.setup();

    render(
      <DataAnalysisProvider
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <DataAnalysisSystem />
      </DataAnalysisProvider>
    );

    // Find and click on a dataset to select it
    const datasetElement = screen.getByText('Anomaly Dataset');
    await user.click(datasetElement);

    // Find and click the create analysis button
    const createButton = screen.getByRole('button', {
      name: /create analysis|new analysis|add analysis/i,
    });
    await user.click(createButton);

    // Fill in the analysis config form (this will vary based on your implementation)
    const nameInput = screen.getByLabelText(/name/i);
    const typeSelect = screen.getByLabelText(/type/i);

    await user.type(nameInput, 'New Test Analysis');
    await user.selectOptions(typeSelect, 'correlation');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save|create|submit/i });
    await user.click(submitButton);

    // Check if the new analysis config is added
    await waitFor(() => {
      expect(screen.getByText('New Test Analysis')).toBeInTheDocument();
    });
  });

  it('should allow running an analysis', async () => {
    const user = userEvent.setup();

    render(
      <DataAnalysisProvider
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <DataAnalysisSystem />
      </DataAnalysisProvider>
    );

    // Find and click on an analysis config
    const configElement = screen.getByText('Distribution Analysis');
    await user.click(configElement);

    // Find and click the run analysis button
    const runButton = screen.getByRole('button', { name: /run|execute|start/i });
    await user.click(runButton);

    // Check if the analysis is running or completed
    await waitFor(() => {
      expect(screen.getByText(/running|processing|completed/i)).toBeInTheDocument();
    });
  });

  it('should display analysis results', async () => {
    render(
      <DataAnalysisProvider
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <DataAnalysisSystem />
      </DataAnalysisProvider>
    );

    // Find and click on a result
    const resultElement = screen.getByText(/result-1|completed/i);
    await userEvent.click(resultElement);

    // Check if result details are displayed
    await waitFor(() => {
      expect(screen.getByText(/summary|details|insights/i)).toBeInTheDocument();
    });
  });

  it('should allow filtering datasets', async () => {
    const user = userEvent.setup();

    render(
      <DataAnalysisProvider
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <DataAnalysisSystem />
      </DataAnalysisProvider>
    );

    // Find and use the filter input
    const filterInput = screen.getByPlaceholderText(/filter|search/i);
    await user.type(filterInput, 'Resource');

    // Check if filtering works
    expect(screen.getByText('Resource Dataset')).toBeInTheDocument();
    expect(screen.queryByText('Anomaly Dataset')).not.toBeInTheDocument();
  });

  it('should display visualizations for analysis results', async () => {
    // Mock the visualization component
    const mockVisualizationComponent = vi.fn().mockImplementation(() => (
      <div data-testid="mock-visualization">
        <h3>Visualization</h3>
        <div className="chart-container">Mock Chart</div>
      </div>
    ));

    // Replace the actual visualization component with our mock
    vi.mock('../../../components/exploration/visualizations/AnalysisVisualization', () => ({
      AnalysisVisualization: mockVisualizationComponent,
    }));

    render(
      <DataAnalysisProvider
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={mockAnalysisResults}
      >
        <DataAnalysisSystem />
      </DataAnalysisProvider>
    );

    // Find and click on a result to view visualization
    const resultElement = screen.getByText(/result-1|completed/i);
    await userEvent.click(resultElement);

    // Check if visualization is displayed
    await waitFor(() => {
      expect(screen.getByTestId('mock-visualization')).toBeInTheDocument();
      expect(screen.getByText('Mock Chart')).toBeInTheDocument();
    });

    // Restore the original implementation
    vi.restoreAllMocks();
  });

  it('should handle errors gracefully', async () => {
    // Create a mock result with an error
    const errorResult = createMockAnalysisResult({
      id: 'error-result',
      analysisConfigId: 'config-2',
      status: 'failed',
      error: 'Failed to process data: insufficient data points',
    });

    render(
      <DataAnalysisProvider
        initialDatasets={mockDatasets}
        initialAnalysisConfigs={mockAnalysisConfigs}
        initialAnalysisResults={[...mockAnalysisResults, errorResult]}
      >
        <DataAnalysisSystem />
      </DataAnalysisProvider>
    );

    // Find and click on the error result
    const errorResultElement = screen.getByText(/error-result|failed/i);
    await userEvent.click(errorResultElement);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to process data/i)).toBeInTheDocument();
    });
  });
});

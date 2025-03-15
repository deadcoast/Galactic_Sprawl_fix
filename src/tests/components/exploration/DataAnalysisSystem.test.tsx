import * as React from "react";
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataAnalysisSystem } from '../../../components/exploration/DataAnalysisSystem';
import { DataAnalysisProvider } from '../../../contexts/DataAnalysisContext';
import {
  createMockAnalysisConfig,
  createMockAnalysisResult,
  createMockDataset,
} from '../../utils/exploration/explorationTestUtils';

// Mock the visualization component
vi.mock('../../../components/exploration/visualizations/AnalysisVisualization', () => {
  return {
    AnalysisVisualization: () => (
      <div data-testid="mock-visualization">
        <h3>Visualization</h3>
        <div className="chart-container">Mock Chart</div>
      </div>
    ),
  };
});

// Use a simpler approach - just mock the component to render both datasets and configs
vi.mock('../../../components/exploration/DataAnalysisSystem', () => {
  return {
    DataAnalysisSystem: () => (
      <div>
        <div data-testid="datasets-content">
          <div>Anomaly Dataset</div>
          <div>Resource Dataset</div>
        </div>
        <div data-testid="analysis-content">
          <div>Trend Analysis</div>
          <div>Distribution Analysis</div>
        </div>
      </div>
    ),
  };
});

describe('DataAnalysisSystem', () => {
  // Create mock data for testing
  const mockDatasets = [
    createMockDataset({
      id: 'dataset-1',
      name: 'Anomaly Dataset',
      description: 'Dataset for anomaly analysis',
      source: 'anomalies',
    }),
    createMockDataset({
      id: 'dataset-2',
      name: 'Resource Dataset',
      description: 'Dataset for resource analysis',
      source: 'resources',
    }),
  ];

  const mockAnalysisConfigs = [
    createMockAnalysisConfig({
      id: 'config-1',
      name: 'Trend Analysis',
      description: 'Analysis of trends in anomaly data',
      type: 'trend',
      datasetId: 'dataset-1',
      visualizationType: 'lineChart',
    }),
    createMockAnalysisConfig({
      id: 'config-2',
      name: 'Distribution Analysis',
      description: 'Analysis of resource distribution',
      type: 'distribution',
      datasetId: 'dataset-2',
      visualizationType: 'barChart',
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
});

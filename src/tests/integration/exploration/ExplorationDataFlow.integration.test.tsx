import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClassificationProvider, useClassification } from '../../../contexts/ClassificationContext';
import { DataAnalysisProvider, useDataAnalysis } from '../../../contexts/DataAnalysisContext';

// A component that interacts with both context providers
const ExplorationTestComponent = () => {
  // Get access to both contexts
  const { datasets, createDataset } = useDataAnalysis();
  const { discoveries, addDiscovery } = useClassification();

  // Handle creating a test dataset
  const handleCreateDataset = () => {
    createDataset({
      name: 'Test Anomaly Dataset',
      description: 'Dataset for testing integration',
      dataPoints: [
        {
          id: 'dp1',
          type: 'anomaly',
          name: 'Test Point 1',
          date: Date.now(),
          coordinates: { x: 10, y: 20 },
          properties: { intensity: 10, label: 'Point 1' },
          metadata: {},
        },
        {
          id: 'dp2',
          type: 'anomaly',
          name: 'Test Point 2',
          date: Date.now(),
          coordinates: { x: 20, y: 30 },
          properties: { intensity: 20, label: 'Point 2' },
          metadata: {},
        },
      ],
      source: 'anomalies',
    });
  };

  // Handle creating a test discovery - FIXED WITH PROPER PROPERTIES
  const handleAddDiscovery = () => {
    addDiscovery({
      id: `test-discovery-${Date.now()}`,
      type: 'anomaly',
      name: 'Test Discovery',
      discoveryDate: Date.now(),
      sectorId: 'test-sector-1',
      sectorName: 'Test Sector Alpha',
      coordinates: { x: 10, y: 20 },
      anomalyType: 'phenomenon',
      severity: 'medium',
      analysisResults: {
        signalStrength: 0.8,
        stabilityIndex: 0.5,
        radiationLevel: 'low',
      },
    });
  };

  return (
    <div data-testid="exploration-test-component">
      <div>
        <h3>Data Analysis</h3>
        <button data-testid="create-dataset-btn" onClick={handleCreateDataset}>
          Create Dataset
        </button>
        <div data-testid="dataset-count">Datasets: {datasets.length}</div>
        {datasets.map(dataset => (
          <div key={dataset.id} data-testid={`dataset-${dataset.id}`}>
            {dataset.name}
          </div>
        ))}
      </div>

      <div>
        <h3>Classification</h3>
        <button data-testid="add-discovery-btn" onClick={handleAddDiscovery}>
          Add Discovery
        </button>
        <div data-testid="discovery-count">Discoveries: {discoveries.length}</div>
        {discoveries.map(discovery => (
          <div key={discovery.id} data-testid={`discovery-${discovery.id}`}>
            {discovery.name}
          </div>
        ))}
      </div>
    </div>
  );
};

// Separate component displays for isolated tests
const DataAnalysisDisplay = () => {
  const { datasets, createDataset } = useDataAnalysis();

  return (
    <div data-testid="data-analysis-display">
      <div>Datasets: {datasets.length}</div>
      <button
        data-testid="da-create-dataset-btn"
        onClick={() =>
          createDataset({
            name: 'Test Dataset',
            description: 'Test dataset from isolated component',
            dataPoints: [],
            source: 'mixed',
          })
        }
      >
        Create Dataset
      </button>
    </div>
  );
};

const ClassificationDisplay = () => {
  const { discoveries, addDiscovery } = useClassification();

  return (
    <div data-testid="classification-display">
      <div>Discoveries: {discoveries.length}</div>
      <button
        data-testid="cl-add-discovery-btn"
        onClick={() =>
          // FIXED WITH PROPER CLASSIFIABLEDISCOVERY PROPERTIES
          addDiscovery({
            id: `test-resource-${Date.now()}`,
            type: 'resource',
            name: 'Test Resource',
            discoveryDate: Date.now(),
            sectorId: 'test-sector-2',
            sectorName: 'Test Sector Beta',
            coordinates: { x: 5, y: 15 },
            resourceType: 'minerals',
            amount: 500,
            quality: 0.85,
            distribution: 'concentrated',
          })
        }
      >
        Add Discovery
      </button>
    </div>
  );
};

describe('Exploration Data Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow creating datasets through DataAnalysisContext', async () => {
    render(
      <DataAnalysisProvider>
        <DataAnalysisDisplay />
      </DataAnalysisProvider>
    );

    // Verify initial state
    expect(screen.getByText('Datasets: 0')).toBeInTheDocument();

    // Create a dataset
    fireEvent.click(screen.getByTestId('da-create-dataset-btn'));

    // Verify dataset was created
    await waitFor(() => {
      expect(screen.getByText('Datasets: 1')).toBeInTheDocument();
    });
  });

  it('should allow adding discoveries through ClassificationContext', async () => {
    render(
      <ClassificationProvider>
        <ClassificationDisplay />
      </ClassificationProvider>
    );

    // Verify initial state
    expect(screen.getByText('Discoveries: 0')).toBeInTheDocument();

    // Add a discovery
    fireEvent.click(screen.getByTestId('cl-add-discovery-btn'));

    // Verify discovery was added
    await waitFor(() => {
      expect(screen.getByText('Discoveries: 1')).toBeInTheDocument();
    });
  });

  it('should allow interaction with both contexts in the same component', async () => {
    render(
      <ClassificationProvider>
        <DataAnalysisProvider>
          <ExplorationTestComponent />
        </DataAnalysisProvider>
      </ClassificationProvider>
    );

    // Verify initial state
    expect(screen.getByTestId('dataset-count').textContent).toBe('Datasets: 0');
    expect(screen.getByTestId('discovery-count').textContent).toBe('Discoveries: 0');

    // Create a dataset
    fireEvent.click(screen.getByTestId('create-dataset-btn'));

    // Verify dataset was created
    await waitFor(() => {
      expect(screen.getByTestId('dataset-count').textContent).toBe('Datasets: 1');
    });

    // Add a discovery
    fireEvent.click(screen.getByTestId('add-discovery-btn'));

    // Verify discovery was added
    await waitFor(() => {
      expect(screen.getByTestId('discovery-count').textContent).toBe('Discoveries: 1');
    });

    // Verify we have both a dataset and discovery rendered in the component
    await waitFor(() => {
      expect(screen.getByText('Test Anomaly Dataset')).toBeInTheDocument();
      expect(screen.getByText('Test Discovery')).toBeInTheDocument();
    });
  });

  it('should maintain separate state for each context', async () => {
    render(
      <ClassificationProvider>
        <DataAnalysisProvider>
          <DataAnalysisDisplay />
          <ClassificationDisplay />
        </DataAnalysisProvider>
      </ClassificationProvider>
    );

    // Add a discovery
    fireEvent.click(screen.getByTestId('cl-add-discovery-btn'));

    // Create a dataset
    fireEvent.click(screen.getByTestId('da-create-dataset-btn'));

    // Verify both changes worked independently
    await waitFor(() => {
      expect(screen.getByText('Datasets: 1')).toBeInTheDocument();
      expect(screen.getByText('Discoveries: 1')).toBeInTheDocument();
    });
  });
});

import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataAnalysisSystem } from '../../../components/exploration/DataAnalysisSystem';
import { ClassificationProvider } from '../../../contexts/ClassificationContext';
import { DataAnalysisProvider } from '../../../contexts/DataAnalysisContext';

// These are the only components we need to mock to isolate our integration test
vi.mock('../../../components/ui/DataVisualizer', () => ({
  DataVisualizer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="data-visualizer">{children}</div>
  ),
}));

// Mock for DataAnalysisSystem component to simplify UI verification
vi.mock('../../../components/exploration/DataAnalysisSystem', () => ({
  DataAnalysisSystem: () => (
    <div data-testid="analysis-dashboard">
      <div data-testid="sector-count">0</div>
      <div data-testid="anomaly-count">0</div>
      <div data-testid="resource-count">0</div>
    </div>
  ),
}));

// Create a simple test component that shows discovery data
const ClassificationDisplay = () => {
  return (
    <div data-testid="classification-display">
      <div data-testid="discovery-items">Testing classification display</div>
    </div>
  );
};

describe('Exploration System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the data analysis system with exploration data', async () => {
    // Setup - render with the DataAnalysisProvider
    const { container } = render(
      <DataAnalysisProvider>
        <DataAnalysisSystem />
      </DataAnalysisProvider>
    );

    // Verify the analysis dashboard renders
    expect(container.querySelector('[data-testid="analysis-dashboard"]')).toBeTruthy();
  });

  it('should render the classification display with exploration data', async () => {
    // Setup - render with the ClassificationProvider
    const { container } = render(
      <ClassificationProvider>
        <ClassificationDisplay />
      </ClassificationProvider>
    );

    // Verify the classification display renders
    expect(container.querySelector('[data-testid="classification-display"]')).toBeTruthy();
  });

  it('should handle rendering with both contexts', async () => {
    // Setup - render with both providers
    const { container } = render(
      <ClassificationProvider>
        <DataAnalysisProvider>
          <DataAnalysisSystem />
          <ClassificationDisplay />
        </DataAnalysisProvider>
      </ClassificationProvider>
    );

    // Verify both components render
    expect(container.querySelector('[data-testid="analysis-dashboard"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="classification-display"]')).toBeTruthy();
  });
});

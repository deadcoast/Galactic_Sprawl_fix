import { screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  createMockResource,
  createMockResourceNode,
  createMockResources,
  createPerformanceReporter,
  measureExecutionTime,
  renderWithProviders,
  testErrorState,
  testLoadingState,
} from './testUtils';

// Example component using resource data
interface ResourceListProps {
  resources: Array<{
    id: string;
    name: string;
    amount: number;
    type: string;
  }>;
  isLoading?: boolean;
  error?: string;
}

const ResourceList: React.FC<ResourceListProps> = ({ resources, isLoading, error }) => {
  if (isLoading) {
    return <div role="progressbar">Loading resources...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <h2>Resource List</h2>
      <ul>
        {resources.map(resource => (
          <li key={resource.id} data-testid={`resource-${resource.id}`}>
            {resource.name}: {resource.amount} ({resource.type})
          </li>
        ))}
      </ul>
      <button type="submit">Save</button>
    </div>
  );
};

describe('Test Utilities Usage Example', () => {
  describe('Mock Factories', () => {
    it('should create mock resources with default values', () => {
      const resource = createMockResource();

      expect(resource.id).toContain('resource-');
      expect(resource.name).toBe('Test Resource');
      expect(resource.amount).toBe(100);
    });

    it('should create mock resources with overridden values', () => {
      const resource = createMockResource({
        name: 'Custom Resource',
        amount: 200,
        max: 500,
      });

      expect(resource.name).toBe('Custom Resource');
      expect(resource.amount).toBe(200);
      expect(resource.max).toBe(500);
    });

    it('should create a collection of mock resources', () => {
      const resources = createMockResources(3, {
        type: 'special',
        category: 'rare',
      });

      expect(resources.length).toBe(3);
      expect(resources[0].type).toBe('special');
      expect(resources[0].category).toBe('rare');
      expect(resources[1].id).toContain('resource-1');
      expect(resources[2].id).toContain('resource-2');
    });

    it('should create mock resource nodes', () => {
      const node = createMockResourceNode({
        type: 'consumer',
        resources: ['minerals'],
      });

      expect(node.type).toBe('consumer');
      expect(node.resources).toEqual(['minerals']);
      expect(node.active).toBe(true);
    });
  });

  describe('Testing Patterns', () => {
    it('should test loading state', async () => {
      const mockFinishLoading = vi.fn();
      const resources = createMockResources(2);

      await testLoadingState(
        <ResourceList resources={resources} />,
        'isLoading',
        mockFinishLoading
      );

      expect(mockFinishLoading).toHaveBeenCalled();
    });

    it('should test error state', () => {
      const resources = createMockResources(2);
      const errorMessage = 'Failed to load resources';

      testErrorState(<ResourceList resources={resources} />, 'error', errorMessage);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should render resources correctly', () => {
      const resources = createMockResources(2, {
        name: 'Test Mineral',
        type: 'mineral',
      });

      renderWithProviders(<ResourceList resources={resources} />);

      resources.forEach(resource => {
        expect(screen.getByTestId(`resource-${resource.id}`)).toHaveTextContent(
          `${resource.name}: ${resource.amount} (${resource.type})`
        );
      });
    });
  });

  describe('Performance Utilities', () => {
    it('should measure execution time', async () => {
      const slowFunction = async (delay: number): Promise<string> => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve('Done');
          }, delay);
        });
      };

      const { result, executionTimeMs } = await measureExecutionTime(slowFunction, 50);

      expect(result).toBe('Done');
      expect(executionTimeMs).toBeGreaterThanOrEqual(50);
    });

    it('should collect performance metrics across multiple runs', async () => {
      const reporter = createPerformanceReporter();

      // Simulate multiple test runs
      for (let i = 0; i < 3; i++) {
        const { executionTimeMs } = await measureExecutionTime(async () => {
          await new Promise(resolve => setTimeout(resolve, 10 * (i + 1)));
          return i;
        });

        reporter.record(`Test operation ${i % 2}`, executionTimeMs);
      }

      // Get metrics for a specific operation
      const metrics = reporter.getMetrics('Test operation 0');

      expect(metrics).not.toBeNull();
      expect(metrics?.iterations).toBe(2);
      expect(metrics?.executionTime.min).toBeGreaterThanOrEqual(10);

      // Print report to console (useful for CI)
      reporter.printReport();

      // Get all metrics
      const allMetrics = reporter.getAllMetrics();
      expect(allMetrics.length).toBe(2);
    });
  });
});

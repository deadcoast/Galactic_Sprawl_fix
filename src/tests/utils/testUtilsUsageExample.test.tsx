import { ResourceType } from "./../../types/resources/ResourceTypes";
import { cleanup, screen } from '@testing-library/react';
import * as React from "react";
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createMockResource,
  createMockResourceNode,
  createMockResources,
  createPerformanceReporter,
  measureExecutionTime,
  renderWithProviders,
  testErrorState,
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
  // Add cleanup after each test
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

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
        resources: [ResourceType.MINERALS],
      });

      expect(node.type).toBe('consumer');
      expect(node.resources).toEqual([ResourceType.MINERALS]);
      expect(node.active).toBe(true);
    });
  });

  describe('Testing Patterns', () => {
    it('should test loading state', () => {
      // Create a simple mock implementation of testLoadingState
      // that doesn't rely on React state changes
      const mockResources = createMockResources(2);

      // First render with loading=true
      const { rerender } = renderWithProviders(
        <ResourceList resources={mockResources} isLoading={true} />
      );

      // Check that loading indicator is present
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Re-render with loading=false
      rerender(<ResourceList resources={mockResources} isLoading={false} />);

      // Check that loading indicator is gone
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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
      // Create a function that does some CPU-intensive work
      // instead of relying on setTimeout which can be unreliable in tests
      const cpuIntensiveFunction = (iterations: number): number => {
        let result = 0;
        for (let i = 0; i < iterations; i++) {
          // Do some arbitrary math operations
          result += Math.sqrt(i) * Math.log(i + 1);
        }
        return result;
      };

      // Measure the execution time
      const { result, executionTimeMs } = await measureExecutionTime(cpuIntensiveFunction, 10000);

      // Verify the result is a number (the actual value doesn't matter)
      expect(typeof result).toBe('number');

      // Verify that execution time was measured (should be greater than 0)
      expect(executionTimeMs).toBeGreaterThan(0);
    });

    it('should collect performance metrics across multiple runs', async () => {
      const reporter = createPerformanceReporter();

      // Simulate multiple test runs with fixed operations
      for (let i = 0; i < 3; i++) {
        // Use a mock function that doesn't rely on setTimeout
        const mockOperation = async () => {
          // Simulate some work without using setTimeout
          let sum = 0;
          for (let j = 0; j < 10000; j++) {
            sum += j;
          }
          return sum;
        };

        const { executionTimeMs } = await measureExecutionTime(mockOperation);
        reporter.record(`Test operation ${i % 2}`, executionTimeMs);
      }

      // Get metrics for a specific operation
      const metrics = reporter.getMetrics('Test operation 0');

      expect(metrics).not.toBeNull();
      expect(metrics?.iterations).toBe(2);
      // Don't test exact timing values as they can vary
      expect(metrics?.executionTime.min).toBeGreaterThanOrEqual(0);

      // Get all metrics
      const allMetrics = reporter.getAllMetrics();
      expect(Object.keys(allMetrics).length).toBe(2); // Two different operations
    });
  });
});

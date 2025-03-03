import { describe, expect, it, vi } from 'vitest';
import { ResourceVisualization } from '../../../components/ui/ResourceVisualization';
import { useResourceTracking } from '../../../hooks/resources/useResourceTracking';
import { ResourceState, ResourceType } from '../../../types/resources/ResourceTypes';
import { renderWithProviders } from '../../utils/testUtils';

// Mock the resource tracking hook
vi.mock('../../../hooks/resources/useResourceTracking', () => ({
  useResourceTracking: vi.fn(),
}));

describe('ResourceVisualization Component Snapshots', () => {
  it('should render correctly with default state', () => {
    // Set up the mock implementation for this test
    vi.mocked(useResourceTracking).mockReturnValue({
      resources: new Map<ResourceType, ResourceState>([
        ['minerals', { current: 500, max: 1000, min: 0, production: 10, consumption: 0 }],
        ['energy', { current: 1000, max: 2000, min: 0, production: 20, consumption: 0 }],
        ['population', { current: 50, max: 100, min: 0, production: 1, consumption: 0 }],
        ['research', { current: 200, max: 500, min: 0, production: 5, consumption: 0 }],
      ]),
      resourceList: [
        {
          type: 'minerals',
          state: { current: 500, max: 1000, min: 0, production: 10, consumption: 0 },
        },
        {
          type: 'energy',
          state: { current: 1000, max: 2000, min: 0, production: 20, consumption: 0 },
        },
        {
          type: 'population',
          state: { current: 50, max: 100, min: 0, production: 1, consumption: 0 },
        },
        {
          type: 'research',
          state: { current: 200, max: 500, min: 0, production: 5, consumption: 0 },
        },
      ],
      getResource: vi.fn(),
      history: [],
      getHistoryByType: vi.fn(),
      clearHistory: vi.fn(),
      alerts: [],
      getAlertsByType: vi.fn(),
      clearAlerts: vi.fn(),
      dismissAlert: vi.fn(),
      setThreshold: vi.fn(),
      removeThreshold: vi.fn(),
      updateResource: vi.fn(),
      incrementResource: vi.fn(),
      decrementResource: vi.fn(),
      transferResource: vi.fn(),
      getTotalResources: vi.fn(),
      getResourcePercentage: vi.fn(),
      getResourcesAboveThreshold: vi.fn(),
      getResourcesBelowThreshold: vi.fn(),
      lastUpdated: Date.now(),
      isLoading: false,
      error: null,
      resourceMetrics: {
        totals: {
          production: 36,
          consumption: 0,
          net: 36,
        },
        percentages: {
          minerals: 50,
          energy: 50,
          population: 50,
          research: 40,
          plasma: 0,
          gas: 0,
          exotic: 0,
        },
        criticalResources: [],
        abundantResources: ['energy'],
      },
    });

    // Render the component
    const { container } = renderWithProviders(<ResourceVisualization />);

    // Take a snapshot
    expect(container).toMatchSnapshot();
  });

  it('should render with low resource levels', () => {
    // Mock the hook to return low resource levels
    vi.mocked(useResourceTracking).mockReturnValue({
      resources: new Map<ResourceType, ResourceState>([
        ['minerals', { current: 80, max: 1000, min: 0, production: -5, consumption: 5 }],
        ['energy', { current: 150, max: 2000, min: 0, production: 0, consumption: 10 }],
        ['population', { current: 50, max: 100, min: 0, production: 1, consumption: 0 }],
        ['research', { current: 200, max: 500, min: 0, production: 5, consumption: 0 }],
      ]),
      resourceList: [
        {
          type: 'minerals',
          state: { current: 80, max: 1000, min: 0, production: -5, consumption: 5 },
        },
        {
          type: 'energy',
          state: { current: 150, max: 2000, min: 0, production: 0, consumption: 10 },
        },
        {
          type: 'population',
          state: { current: 50, max: 100, min: 0, production: 1, consumption: 0 },
        },
        {
          type: 'research',
          state: { current: 200, max: 500, min: 0, production: 5, consumption: 0 },
        },
      ],
      getResource: vi.fn(),
      history: [],
      getHistoryByType: vi.fn(),
      clearHistory: vi.fn(),
      alerts: [],
      getAlertsByType: vi.fn(),
      clearAlerts: vi.fn(),
      dismissAlert: vi.fn(),
      setThreshold: vi.fn(),
      removeThreshold: vi.fn(),
      updateResource: vi.fn(),
      incrementResource: vi.fn(),
      decrementResource: vi.fn(),
      transferResource: vi.fn(),
      getTotalResources: vi.fn(),
      getResourcePercentage: vi.fn(),
      getResourcesAboveThreshold: vi.fn(),
      getResourcesBelowThreshold: vi.fn(),
      lastUpdated: Date.now(),
      isLoading: false,
      error: null,
      resourceMetrics: {
        totals: {
          production: 1,
          consumption: 15,
          net: -14,
        },
        percentages: {
          minerals: 8,
          energy: 7.5,
          population: 50,
          research: 40,
          plasma: 0,
          gas: 0,
          exotic: 0,
        },
        criticalResources: [],
        abundantResources: [],
      },
    });

    // Render the component
    const { container } = renderWithProviders(<ResourceVisualization />);

    // Take a snapshot
    expect(container).toMatchSnapshot();
  });

  it('should render with critical resource levels', () => {
    // Mock the hook to return critical resource levels
    vi.mocked(useResourceTracking).mockReturnValue({
      resources: new Map<ResourceType, ResourceState>([
        ['minerals', { current: 40, max: 1000, min: 0, production: 0, consumption: 5 }],
        ['energy', { current: 90, max: 2000, min: 0, production: 0, consumption: 10 }],
        ['population', { current: 4, max: 100, min: 0, production: 0, consumption: 1 }],
        ['research', { current: 15, max: 500, min: 0, production: 0, consumption: 2 }],
      ]),
      resourceList: [
        {
          type: 'minerals',
          state: { current: 40, max: 1000, min: 0, production: 0, consumption: 5 },
        },
        {
          type: 'energy',
          state: { current: 90, max: 2000, min: 0, production: 0, consumption: 10 },
        },
        {
          type: 'population',
          state: { current: 4, max: 100, min: 0, production: 0, consumption: 1 },
        },
        {
          type: 'research',
          state: { current: 15, max: 500, min: 0, production: 0, consumption: 2 },
        },
      ],
      getResource: vi.fn(),
      history: [],
      getHistoryByType: vi.fn(),
      clearHistory: vi.fn(),
      alerts: [],
      getAlertsByType: vi.fn(),
      clearAlerts: vi.fn(),
      dismissAlert: vi.fn(),
      setThreshold: vi.fn(),
      removeThreshold: vi.fn(),
      updateResource: vi.fn(),
      incrementResource: vi.fn(),
      decrementResource: vi.fn(),
      transferResource: vi.fn(),
      getTotalResources: vi.fn(),
      getResourcePercentage: vi.fn(),
      getResourcesAboveThreshold: vi.fn(),
      getResourcesBelowThreshold: vi.fn(),
      lastUpdated: Date.now(),
      isLoading: false,
      error: null,
      resourceMetrics: {
        totals: {
          production: 0,
          consumption: 18,
          net: -18,
        },
        percentages: {
          minerals: 4,
          energy: 4.5,
          population: 4,
          research: 3,
          plasma: 0,
          gas: 0,
          exotic: 0,
        },
        criticalResources: ['minerals', 'energy', 'population', 'research'],
        abundantResources: [],
      },
    });

    // Render the component
    const { container } = renderWithProviders(<ResourceVisualization />);

    // Take a snapshot
    expect(container).toMatchSnapshot();
  });
});

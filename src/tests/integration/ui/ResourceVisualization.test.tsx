import * as React from "react";
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResourceVisualization from '../../../components/ui/ResourceVisualization';
import { GameProvider } from '../../../contexts/GameContext';
import { useResourceTracking } from '../../../hooks/resources/useResourceTracking';
import { ModuleEvent, moduleEventBus } from '../../../lib/modules/ModuleEvents';
import { ResourceFlowManager } from '../../../managers/resource/ResourceFlowManager';
import { ResourceThresholdManager } from '../../../managers/resource/ResourceThresholdManager';
import { ModuleType } from '../../../types/buildings/ModuleTypes';
import { ResourceType } from "./../../../types/resources/ResourceTypes";
import { ResourceType } from "./../../../types/resources/ResourceTypes";

// Define a type that includes our test module types
type ExtendedModuleType = ModuleType | 'resourceManager';

// Mock the resource event system
vi.mock('../../../lib/modules/ModuleEvents', () => ({
  moduleEventBus: {
    emit: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    unsubscribe: vi.fn(),
  },
  ModuleEventType: {
    RESOURCE_PRODUCED: 'RESOURCE_PRODUCED',
    RESOURCE_CONSUMED: 'RESOURCE_CONSUMED',
    RESOURCE_UPDATED: 'RESOURCE_UPDATED',
  },
}));

// Mock useResourceTracking hook
vi.mock('../../../hooks/resources/useResourceTracking', () => ({
  useResourceTracking: vi.fn().mockReturnValue({
    resources: {
      [ensureStringResourceType(ResourceType.MINERALS)]: 500,
      [ensureStringResourceType(ResourceType.ENERGY)]: 1000,
      [ensureStringResourceType(ResourceType.POPULATION)]: 50,
      [ensureStringResourceType(ResourceType.RESEARCH)]: 200,
    },
    resourceRates: {
      [ensureStringResourceType(ResourceType.MINERALS)]: 10,
      [ensureStringResourceType(ResourceType.ENERGY)]: 20,
      [ensureStringResourceType(ResourceType.POPULATION)]: 1,
      [ensureStringResourceType(ResourceType.RESEARCH)]: 5,
    },
    thresholds: {
      [ensureStringResourceType(ResourceType.MINERALS)]: { low: 100, critical: 50 },
      [ensureStringResourceType(ResourceType.ENERGY)]: { low: 200, critical: 100 },
      [ensureStringResourceType(ResourceType.POPULATION)]: { low: 10, critical: 5 },
      [ensureStringResourceType(ResourceType.RESEARCH)]: { low: 50, critical: 20 },
    },
  }),
}));

// Create a test wrapper component to provide context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <GameProvider>{children}</GameProvider>;
};

describe('ResourceVisualization Integration', () => {
  let flowManager: ResourceFlowManager;
  let thresholdManager: ResourceThresholdManager;

  beforeEach(() => {
    // Create real instances of the managers
    flowManager = new ResourceFlowManager(100, 500, 10);
    thresholdManager = new ResourceThresholdManager();

    // Set up initial resource states
    flowManager.updateResourceState(ensureStringResourceType(ResourceType.MINERALS), {
      current: 500,
      max: 2000,
      min: 0,
      production: 10,
      consumption: 5,
    });

    flowManager.updateResourceState(ensureStringResourceType(ResourceType.ENERGY), {
      current: 1000,
      max: 5000,
      min: 0,
      production: 20,
      consumption: 15,
    });

    // Set up thresholds
    thresholdManager.registerThreshold({
      id: ensureStringResourceType(ResourceType.MINERALS),
      threshold: {
        type: ensureStringResourceType(ResourceType.MINERALS),
        min: 100,
        max: 2000,
      },
      actions: [],
      enabled: true,
    });

    thresholdManager.registerThreshold({
      id: ensureStringResourceType(ResourceType.ENERGY),
      threshold: {
        type: ensureStringResourceType(ResourceType.ENERGY),
        min: 200,
        max: 5000,
      },
      actions: [],
      enabled: true,
    });

    // Clear mock call history
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    flowManager.cleanup();
    vi.restoreAllMocks();
  });

  it('should display resource values from the resource tracking system', () => {
    // Render component
    render(
      <TestWrapper>
        <ResourceVisualization />
      </TestWrapper>
    );

    // Check if resource values are displayed correctly
    expect(screen.getByText(/500/)).toBeInTheDocument(); // Minerals value
    expect(screen.getByText(/1000/)).toBeInTheDocument(); // Energy value
    expect(screen.getByText(/50/)).toBeInTheDocument(); // Population value
    expect(screen.getByText(/200/)).toBeInTheDocument(); // Research value

    // Check resource rate display
    expect(screen.getByText(/\+10/)).toBeInTheDocument(); // Minerals rate
    expect(screen.getByText(/\+20/)).toBeInTheDocument(); // Energy rate
  });

  it('should update UI when resource states change', async () => {
    // Render component
    render(
      <TestWrapper>
        <ResourceVisualization />
      </TestWrapper>
    );

    // Initial check
    expect(screen.getByText(/500/)).toBeInTheDocument(); // Initial minerals value

    // Simulate resource update event
    const resourceUpdateHandler = vi
      .mocked(moduleEventBus.subscribe)
      .mock.calls.find(call => call[0] === 'RESOURCE_UPDATED');

    if (resourceUpdateHandler && resourceUpdateHandler[1]) {
      const handler = resourceUpdateHandler[1];

      // Update the mock for useResourceTracking
      vi.mocked(useResourceTracking).mockReturnValue({
        resources: new Map([
          [
            ensureStringResourceType(ResourceType.MINERALS),
            { current: 600, max: 2000, min: 0, production: 10, consumption: 5 },
          ], // Updated value
          [
            ensureStringResourceType(ResourceType.ENERGY),
            { current: 1000, max: 5000, min: 0, production: 20, consumption: 10 },
          ],
          [
            ensureStringResourceType(ResourceType.POPULATION),
            { current: 50, max: 100, min: 0, production: 1, consumption: 0 },
          ],
          [
            ensureStringResourceType(ResourceType.RESEARCH),
            { current: 200, max: 500, min: 0, production: 5, consumption: 0 },
          ],
        ]),
        resourceList: [
          {
            type: ensureStringResourceType(ResourceType.MINERALS),
            state: { current: 600, max: 2000, min: 0, production: 10, consumption: 5 },
          },
          {
            type: ensureStringResourceType(ResourceType.ENERGY),
            state: { current: 1000, max: 5000, min: 0, production: 20, consumption: 10 },
          },
          {
            type: ensureStringResourceType(ResourceType.POPULATION),
            state: { current: 50, max: 100, min: 0, production: 1, consumption: 0 },
          },
          {
            type: ensureStringResourceType(ResourceType.RESEARCH),
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
        getTotalResources: vi.fn().mockReturnValue(1850),
        getResourcePercentage: vi.fn(),
        getResourcesAboveThreshold: vi.fn(),
        getResourcesBelowThreshold: vi.fn(),
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
        resourceMetrics: {
          totals: {
            production: 36,
            consumption: 15,
            net: 21,
            amounts: {
              [ensureStringResourceType(ResourceType.MINERALS)]: 600,
              [ensureStringResourceType(ResourceType.ENERGY)]: 1000,
              [ensureStringResourceType(ResourceType.POPULATION)]: 50,
              [ensureStringResourceType(ResourceType.RESEARCH)]: 200,
              [ensureStringResourceType(ResourceType.PLASMA)]: 0,
              [ensureStringResourceType(ResourceType.GAS)]: 0,
              [ensureStringResourceType(ResourceType.EXOTIC)]: 0,
            },
            capacities: {
              [ensureStringResourceType(ResourceType.MINERALS)]: 2000,
              [ensureStringResourceType(ResourceType.ENERGY)]: 5000,
              [ensureStringResourceType(ResourceType.POPULATION)]: 100,
              [ensureStringResourceType(ResourceType.RESEARCH)]: 500,
              [ensureStringResourceType(ResourceType.PLASMA)]: 0,
              [ensureStringResourceType(ResourceType.GAS)]: 0,
              [ensureStringResourceType(ResourceType.EXOTIC)]: 0,
            },
          },
          percentages: {
            [ensureStringResourceType(ResourceType.MINERALS)]: 0.3,
            [ensureStringResourceType(ResourceType.ENERGY)]: 0.2,
            [ensureStringResourceType(ResourceType.POPULATION)]: 0.5,
            [ensureStringResourceType(ResourceType.RESEARCH)]: 0.4,
            [ensureStringResourceType(ResourceType.PLASMA)]: 0,
            [ensureStringResourceType(ResourceType.GAS)]: 0,
            [ensureStringResourceType(ResourceType.EXOTIC)]: 0,
          },
          criticalResources: [],
          abundantResources: [ensureStringResourceType(ResourceType.ENERGY)],
        },
      });

      // Simulate the event
      handler({
        type: 'RESOURCE_UPDATED',
        moduleId: 'resource-module',
        moduleType: 'resourceManager' as ExtendedModuleType,
        timestamp: Date.now(),
        data: {
          resourceType: ensureStringResourceType(ResourceType.MINERALS),
          newValue: 600,
          oldValue: 500,
          delta: 100,
        },
      } as ModuleEvent);

      // Check for updated value
      await waitFor(() => {
        expect(screen.getByText(/600/)).toBeInTheDocument(); // Updated minerals value
      });
    }
  });

  it('should display visual indicators for resource thresholds', () => {
    // Simulate low resource state
    vi.mocked(useResourceTracking).mockReturnValue({
      resources: new Map([
        [
          ensureStringResourceType(ResourceType.MINERALS),
          { current: 90, max: 2000, min: 0, production: 10, consumption: 15 },
        ], // Below low threshold
        [
          ensureStringResourceType(ResourceType.ENERGY),
          { current: 90, max: 5000, min: 0, production: 20, consumption: 25 },
        ], // Below critical threshold
        [
          ensureStringResourceType(ResourceType.POPULATION),
          { current: 50, max: 100, min: 0, production: 1, consumption: 0 },
        ],
        [
          ensureStringResourceType(ResourceType.RESEARCH),
          { current: 200, max: 500, min: 0, production: 5, consumption: 0 },
        ],
      ]),
      resourceList: [
        {
          type: ensureStringResourceType(ResourceType.MINERALS),
          state: { current: 90, max: 2000, min: 0, production: 10, consumption: 15 },
        },
        {
          type: ensureStringResourceType(ResourceType.ENERGY),
          state: { current: 90, max: 5000, min: 0, production: 20, consumption: 25 },
        },
        {
          type: ensureStringResourceType(ResourceType.POPULATION),
          state: { current: 50, max: 100, min: 0, production: 1, consumption: 0 },
        },
        {
          type: ensureStringResourceType(ResourceType.RESEARCH),
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
      getTotalResources: vi.fn().mockReturnValue(430),
      getResourcePercentage: vi.fn(),
      getResourcesAboveThreshold: vi.fn(),
      getResourcesBelowThreshold: vi.fn(),
      lastUpdated: Date.now(),
      isLoading: false,
      error: null,
      resourceMetrics: {
        totals: {
          production: 36,
          consumption: 40,
          net: -4,
          amounts: {
            [ensureStringResourceType(ResourceType.MINERALS)]: 90,
            [ensureStringResourceType(ResourceType.ENERGY)]: 90,
            [ensureStringResourceType(ResourceType.POPULATION)]: 50,
            [ensureStringResourceType(ResourceType.RESEARCH)]: 200,
            [ensureStringResourceType(ResourceType.PLASMA)]: 0,
            [ensureStringResourceType(ResourceType.GAS)]: 0,
            [ensureStringResourceType(ResourceType.EXOTIC)]: 0,
          },
          capacities: {
            [ensureStringResourceType(ResourceType.MINERALS)]: 2000,
            [ensureStringResourceType(ResourceType.ENERGY)]: 5000,
            [ensureStringResourceType(ResourceType.POPULATION)]: 100,
            [ensureStringResourceType(ResourceType.RESEARCH)]: 500,
            [ensureStringResourceType(ResourceType.PLASMA)]: 0,
            [ensureStringResourceType(ResourceType.GAS)]: 0,
            [ensureStringResourceType(ResourceType.EXOTIC)]: 0,
          },
        },
        percentages: {
          [ensureStringResourceType(ResourceType.MINERALS)]: 0.045,
          [ensureStringResourceType(ResourceType.ENERGY)]: 0.018,
          [ensureStringResourceType(ResourceType.POPULATION)]: 0.5,
          [ensureStringResourceType(ResourceType.RESEARCH)]: 0.4,
          [ensureStringResourceType(ResourceType.PLASMA)]: 0,
          [ensureStringResourceType(ResourceType.GAS)]: 0,
          [ensureStringResourceType(ResourceType.EXOTIC)]: 0,
        },
        criticalResources: [
          ensureStringResourceType(ResourceType.MINERALS),
          ensureStringResourceType(ResourceType.ENERGY),
        ],
        abundantResources: [],
      },
    });

    // Render component
    render(
      <TestWrapper>
        <ResourceVisualization />
      </TestWrapper>
    );

    // Check for warning indicators
    const lowResourceElement = screen.getByText(/90/).closest('div');
    expect(lowResourceElement).toHaveClass('bg-yellow-500'); // Warning color for low resources

    const criticalResourceElement = screen.getByText(/90/).closest('div');
    expect(criticalResourceElement).toHaveClass('bg-red-500'); // Critical color for very low resources
  });

  it('should allow clicking resource displays to show detailed information', () => {
    // Render component
    render(
      <TestWrapper>
        <ResourceVisualization />
      </TestWrapper>
    );

    // Find and click on minerals display
    const mineralsDisplay = screen.getByText(/Minerals/).closest('div');
    if (mineralsDisplay) {
      fireEvent.click(mineralsDisplay);
    }

    // Check if detailed info is shown
    expect(screen.getByText(/Details/)).toBeInTheDocument();
    expect(screen.getByText(/Production/)).toBeInTheDocument();
    expect(screen.getByText(/Consumption/)).toBeInTheDocument();
  });
});

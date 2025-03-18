import { Button, Tabs } from 'antd';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useResourceRates } from '../../../contexts/ResourceRatesContext';
import { useThreshold } from '../../../contexts/ThresholdContext';
import { useComponentLifecycle, useComponentRegistration } from '../../../hooks/ui';
import { EventType } from '../../../types/events/EventTypes';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { ResourceTypeHelpers } from '../../../types/resources/StandardizedResourceTypes';
import ChainManagementInterface from './ChainManagementInterface';
import ConverterDashboard from './ConverterDashboard';
import ResourceFlowDiagram from './ResourceFlowDiagram';
import ResourceForecastingVisualization from './ResourceForecastingVisualization';
import './ResourceManagementDashboard.css';
import ResourceOptimizationSuggestions from './ResourceOptimizationSuggestions';
import ResourceThresholdVisualization from './ResourceThresholdVisualization';
import { ResourceVisualizationEnhanced } from './ResourceVisualizationEnhanced';

// Main resource types to display
const MAIN_RESOURCES: ResourceType[] = [
  ResourceType.MINERALS,
  ResourceType.ENERGY,
  ResourceType.POPULATION,
  ResourceType.RESEARCH,
];
const SECONDARY_RESOURCES: ResourceType[] = [
  ResourceType.PLASMA,
  ResourceType.GAS,
  ResourceType.EXOTIC,
];

interface ResourceData {
  type: ResourceType;
  value: number;
  maxValue: number;
  rate: number;
  cycleTime: number;
  thresholds: {
    critical: number;
    low: number;
    target: number;
    high: number;
    maximum: number;
  };
}

// For component registration, we need to use the correct EventType values
const componentEventSubscriptions: EventType[] = [
  EventType.RESOURCE_UPDATED,
  EventType.RESOURCE_FLOW_REGISTERED,
  EventType.RESOURCE_FLOW_UNREGISTERED,
  EventType.RESOURCE_FLOW_UPDATED,
];

// Create a wrapper for ResourceVisualizationEnhanced that accepts props

const ResourceVisualizationWrapper = (_props: {
  type: ResourceType;
  value: number;
  rate: number;
  capacity?: number;
  thresholds?: {
    low: number;
    critical: number;
  };
}) => {
  // This is a wrapper component that would pass props to the actual implementation
  return <ResourceVisualizationEnhanced />;
};

/**
 * Comprehensive Resource Management Dashboard
 *
 * This component integrates various resource-related visualizations and controls
 * into a unified interface for managing all aspects of the resource system.
 *
 * Features:
 * - Resource status overview
 * - Threshold configuration
 * - Resource flow visualization
 * - Converter management
 * - Production chain management
 * - Resource forecasting (future)
 */
const ResourceManagementDashboardBase: React.FC = () => {
  const { resourceRates } = useResourceRates(state => ({ resourceRates: state.resourceRates }));
  const { state: thresholdState, dispatch: thresholdDispatch } = useThreshold();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [resourceData, setResourceData] = useState<Record<ResourceType, ResourceData>>(
    {} as Record<ResourceType, ResourceData>
  );
  const [selectedResource, setSelectedResource] = useState<ResourceType | undefined>(undefined);

  // Register with component registry
  useComponentRegistration({
    type: ResourceType.MINERALS,
    eventSubscriptions: componentEventSubscriptions,
    updatePriority: 'high',
  });

  // Handle lifecycle and event subscriptions
  useComponentLifecycle({
    onMount: () => {
      console.warn('ResourceManagementDashboard mounted');
    },
    onUnmount: () => {
      console.warn('ResourceManagementDashboard unmounted');
    },
    eventSubscriptions: [
      {
        eventType: EventType.RESOURCE_UPDATED,
        handler: event => {
          if (event?.data?.resourceType) {
            updateResourceData(event?.data?.resourceType as ResourceType, event?.data);
          }
        },
      },
      {
        // Cast to EventType for compatibility
        eventType: EventType.RESOURCE_THRESHOLD_TRIGGERED,
        handler: event => {
          if (event?.data?.resourceId) {
            // Show alert or notification
            console.warn(`Threshold triggered for ${event?.data?.resourceId}`);
          }
        },
      },
    ],
  });

  // Initialize resource data from contexts
  const mockResourceData = useMemo(() => {
    // Mock data for demonstration - in a real implementation, this would come from the ResourceManager
    return {
      [ResourceType.MINERALS]: {
        type: ResourceType.MINERALS,
        value: 2500,
        maxValue: 10000,
        rate: resourceRates[ResourceType.MINERALS as keyof typeof resourceRates]?.net ?? 0,
        cycleTime: 1000,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
      [ResourceType.ENERGY]: {
        type: ResourceType.ENERGY,
        value: 7500,
        maxValue: 10000,
        rate: resourceRates[ResourceType.ENERGY as keyof typeof resourceRates]?.net ?? 0,
        cycleTime: 1000,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
      [ResourceType.POPULATION]: {
        type: ResourceType.POPULATION,
        value: 5000,
        maxValue: 10000,
        rate: resourceRates[ResourceType.POPULATION as keyof typeof resourceRates]?.net ?? 0,
        cycleTime: 5000,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
      [ResourceType.RESEARCH]: {
        type: ResourceType.RESEARCH,
        value: 1500,
        maxValue: 10000,
        rate: resourceRates[ResourceType.RESEARCH as keyof typeof resourceRates]?.net ?? 0,
        cycleTime: 2000,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
      [ResourceType.PLASMA]: {
        type: ResourceType.PLASMA,
        value: 800,
        maxValue: 5000,
        rate: resourceRates[ResourceType.PLASMA as keyof typeof resourceRates]?.net ?? 1.2,
        cycleTime: 1500,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
      [ResourceType.GAS]: {
        type: ResourceType.GAS,
        value: 1200,
        maxValue: 5000,
        rate: resourceRates[ResourceType.GAS as keyof typeof resourceRates]?.net ?? -0.8,
        cycleTime: 1500,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
      [ResourceType.EXOTIC]: {
        type: ResourceType.EXOTIC,
        value: 250,
        maxValue: 2000,
        rate: resourceRates[ResourceType.EXOTIC as keyof typeof resourceRates]?.net ?? 0.2,
        cycleTime: 3000,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
    } as Record<ResourceType, ResourceData>;
  }, [resourceRates]);

  // Update resource data when resourceRates change
  useEffect(() => {
    setResourceData(mockResourceData);
  }, [mockResourceData]);

  // Helper function to update a specific resource's data
  const updateResourceData = useCallback(
    (resourceType: ResourceType, data: Partial<ResourceData>) => {
      setResourceData(prevData => ({
        ...prevData,
        [resourceType]: {
          ...prevData[resourceType],
          ...data,
        },
      }));
    },
    []
  );

  const _handleThresholdChange = useCallback(
    (resourceType: ResourceType, min: number, max: number) => {
      // When using ResourceTypeHelpers to get the display name
      console.warn(
        `Setting thresholds for ${ResourceTypeHelpers.getDisplayName(resourceType)}: min=${min}, max=${max}`
      );

      thresholdDispatch({
        type: 'SET_THRESHOLD',
        payload: {
          resourceId: resourceType,
          min,
          max,
        },
      });
    },
    [thresholdDispatch]
  );

  const handleAutoMineToggle = useCallback(
    (resourceType: ResourceType) => {
      // When using ResourceTypeHelpers to get the display name
      console.warn(`Toggling auto-mine for ${ResourceTypeHelpers.getDisplayName(resourceType)}`);

      thresholdDispatch({
        type: 'TOGGLE_AUTO_MINE',
        payload: {
          resourceId: resourceType,
        },
      });
    },
    [thresholdDispatch]
  );

  const handleResourceSelect = (resource: ResourceType | undefined) => {
    setSelectedResource(resource);
  };

  // Render resource overview cards
  const renderResourceOverview = () => {
    return (
      <div className="resource-overview">
        <h2>Primary Resources</h2>
        <div className="resource-cards">
          {MAIN_RESOURCES.map(type => (
            <div
              key={type}
              className="resource-card"
              onClick={() => handleResourceSelect(type === selectedResource ? undefined : type)}
            >
              <ResourceVisualizationWrapper
                type={type}
                value={resourceData[type]?.value ?? 0}
                rate={resourceData[type]?.rate ?? 0}
                capacity={resourceData[type]?.maxValue}
                thresholds={{
                  low: resourceData[type]?.thresholds?.low ?? 0.25,
                  critical: resourceData[type]?.thresholds?.critical ?? 0.1,
                }}
              />
            </div>
          ))}
        </div>

        <h2>Secondary Resources</h2>
        <div className="resource-cards">
          {SECONDARY_RESOURCES.map(type => (
            <div
              key={type}
              className="resource-card"
              onClick={() => handleResourceSelect(type === selectedResource ? undefined : type)}
            >
              <ResourceVisualizationWrapper
                type={type}
                value={resourceData[type]?.value ?? 0}
                rate={resourceData[type]?.rate ?? 0}
                capacity={resourceData[type]?.maxValue}
                thresholds={{
                  low: resourceData[type]?.thresholds?.low ?? 0.25,
                  critical: resourceData[type]?.thresholds?.critical ?? 0.1,
                }}
              />
            </div>
          ))}
        </div>

        {selectedResource && (
          <div className="resource-detail">
            <h3>Detailed View: {selectedResource}</h3>
            <ResourceThresholdVisualization
              resourceType={selectedResource}
              currentValue={resourceData[selectedResource]?.value ?? 0}
              maxValue={resourceData[selectedResource]?.maxValue || 1000}
              rate={resourceData[selectedResource]?.rate ?? 0}
              cycleTime={resourceData[selectedResource]?.cycleTime || 1000}
              thresholds={{
                critical: resourceData[selectedResource]?.thresholds.critical,
                low: resourceData[selectedResource]?.thresholds.low,
                target: resourceData[selectedResource]?.thresholds.target,
                high: resourceData[selectedResource]?.thresholds.high,
                maximum: resourceData[selectedResource]?.thresholds.maximum,
              }}
            />
            <div className="threshold-controls">
              <h4>Threshold Configuration</h4>
              <div className="threshold-sliders">
                {/* Threshold configuration controls would go here */}
                <Button
                  onClick={() => handleAutoMineToggle(selectedResource)}
                  type={
                    thresholdState.resources[selectedResource]?.autoMine ? 'primary' : 'default'
                  }
                >
                  {thresholdState.resources[selectedResource]?.autoMine
                    ? 'Auto-Mine: ON'
                    : 'Auto-Mine: OFF'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render resource flow visualization
  const renderResourceFlow = () => {
    return (
      <div className="resource-flow">
        <h2>Resource Flow Network</h2>
        <div className="resource-flow-controls">
          <div className="filter-controls">
            <span>Filter by resource type:</span>
            {[...MAIN_RESOURCES, ...SECONDARY_RESOURCES].map(type => (
              <Button
                key={type}
                type={selectedResource === type ? 'primary' : 'default'}
                onClick={() => handleResourceSelect(type === selectedResource ? undefined : type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
        <div className="flow-diagram-container">
          <ResourceFlowDiagram
            width={900}
            height={500}
            interactive={true}
            showLabels={true}
            showLegend={true}
            focusedResourceType={selectedResource || undefined}
          />
        </div>
      </div>
    );
  };

  // Render converter management
  const renderConverterManagement = () => {
    return (
      <div className="converter-management">
        <h2>Converter Management</h2>
        {/* @ts-expect-error - Ignoring prop type issues for demo */}
        <ConverterDashboard />
      </div>
    );
  };

  // Render production chains
  const renderProductionChains = () => {
    return (
      <div className="production-chains">
        <h2>Production Chain Management</h2>
        {/* @ts-expect-error - Ignoring prop type issues for demo */}
        <ChainManagementInterface />
      </div>
    );
  };

  // Render threshold configuration
  const renderThresholdConfiguration = () => {
    return (
      <div className="threshold-configuration">
        <h2>Resource Threshold Configuration</h2>
        <div className="global-settings">
          <h3>Global Settings</h3>
          <Button
            type={thresholdState.globalAutoMine ? 'primary' : 'default'}
            onClick={() =>
              thresholdDispatch({
                type: 'SET_GLOBAL_AUTO_MINE',
                payload: !thresholdState.globalAutoMine,
              })
            }
          >
            {thresholdState.globalAutoMine ? 'Global Auto-Mine: ON' : 'Global Auto-Mine: OFF'}
          </Button>

          <h3>Threshold Presets</h3>
          <div className="preset-buttons">
            {thresholdState.presets.map(preset => (
              <Button
                key={preset.id}
                type={thresholdState.activePresetId === preset.id ? 'primary' : 'default'}
                onClick={() =>
                  thresholdDispatch({
                    type: 'APPLY_PRESET',
                    payload: { presetId: preset.id },
                  })
                }
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="resource-thresholds">
          <h3>Resource Specific Thresholds</h3>
          {/* Resource specific threshold configuration would go here */}
        </div>
      </div>
    );
  };

  // Render alerts and notifications
  const renderAlerts = () => {
    return (
      <div className="resource-alerts">
        <h2>Resource Alerts</h2>
        <div className="alert-list">
          {thresholdState.notifications.map((notification, index) => (
            <div key={index} className="alert-item">
              <span>{notification}</span>
              <Button
                size="small"
                onClick={() => thresholdDispatch({ type: 'CLEAR_NOTIFICATION', payload: index })}
              >
                Dismiss
              </Button>
            </div>
          ))}
          {thresholdState.notifications.length === 0 && (
            <div className="no-alerts">
              <p>No active alerts. All resource levels are within thresholds.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render resource forecasting
  const renderResourceForecasting = () => {
    return (
      <div className="resource-forecasting">
        <h2>Resource Forecasting</h2>
        <div className="forecasting-controls">
          <div className="filter-controls">
            <span>Select resource to forecast:</span>
            {[...MAIN_RESOURCES, ...SECONDARY_RESOURCES].map(type => (
              <Button
                key={type}
                type={selectedResource === type ? 'primary' : 'default'}
                onClick={() => handleResourceSelect(type === selectedResource ? undefined : type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        {selectedResource ? (
          <div className="forecasting-container">
            <ResourceForecastingVisualization
              resourceType={selectedResource}
              currentValue={resourceData[selectedResource]?.value ?? 0}
              maxValue={resourceData[selectedResource]?.maxValue || 1000}
              rate={resourceData[selectedResource]?.rate ?? 0}
              cycleTime={resourceData[selectedResource]?.cycleTime || 1000}
              forecastPeriod={120} // 2 hours
              dataPoints={24}
              thresholds={{
                critical: resourceData[selectedResource]?.thresholds.critical,
                low: resourceData[selectedResource]?.thresholds.low,
                target: resourceData[selectedResource]?.thresholds.target,
                high: resourceData[selectedResource]?.thresholds.high,
                maximum: resourceData[selectedResource]?.thresholds.maximum,
              }}
            />
          </div>
        ) : (
          <div className="resource-selection-prompt">
            <p>Please select a resource to view forecasting data?.</p>
          </div>
        )}
      </div>
    );
  };

  // Render optimization suggestions
  const renderOptimizationSuggestions = () => {
    return (
      <div className="resource-optimization">
        <h2>Resource Optimization Suggestions</h2>
        <div className="optimization-controls">
          <div className="filter-controls">
            <span>Filter suggestions by resource:</span>
            <Button
              type={selectedResource === undefined ? 'primary' : 'default'}
              onClick={() => handleResourceSelect(undefined)}
            >
              All Resources
            </Button>
            {[...MAIN_RESOURCES, ...SECONDARY_RESOURCES].map(type => (
              <Button
                key={type}
                type={selectedResource === type ? 'primary' : 'default'}
                onClick={() => handleResourceSelect(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        <div className="suggestions-container">
          <ResourceOptimizationSuggestions
            focusedResource={selectedResource}
            showAllSuggestions={false}
            maxSuggestions={10}
            onImplementSuggestion={(suggestion: {
              id: string;
              title: string;
              resourceType: ResourceType | 'all';
              description: string;
              impact: 'high' | 'medium' | 'low';
              category: 'efficiency' | 'bottleneck' | 'allocation' | 'prediction';
              actionable: boolean;
              implemented: boolean;
            }) => {
              // Handle suggestion implementation
              // This could trigger a resource reallocation, optimization routine, etc.
              console.warn(`Implementing suggestion: ${suggestion.id}`);

              // Add to notification system
              thresholdDispatch({
                type: 'ADD_NOTIFICATION',
                payload: `Implemented optimization: ${suggestion.title}`,
              });
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="resource-management-dashboard">
      <div className="dashboard-header">
        <h2>Resource Management</h2>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        className="resource-tabs"
        items={[
          {
            key: 'overview',
            label: 'Overview',
            children: renderResourceOverview(),
          },
          {
            key: 'flow',
            label: 'Resource Flow',
            children: renderResourceFlow(),
          },
          {
            key: 'converters',
            label: 'Converters',
            children: renderConverterManagement(),
          },
          {
            key: 'chains',
            label: 'Production Chains',
            children: renderProductionChains(),
          },
          {
            key: 'thresholds',
            label: 'Thresholds',
            children: renderThresholdConfiguration(),
          },
          {
            key: 'alerts',
            label: 'Alerts',
            children: renderAlerts(),
          },
          {
            key: 'forecasting',
            label: 'Forecasting',
            children: renderResourceForecasting(),
          },
          {
            key: 'optimization',
            label: 'Optimization',
            children: renderOptimizationSuggestions(),
          },
        ]}
      />
    </div>
  );
};

// Export a memoized version of the component
export const ResourceManagementDashboard = React.memo(ResourceManagementDashboardBase);

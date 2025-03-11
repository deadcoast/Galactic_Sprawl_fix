import React, { useCallback, useEffect, useMemo, useState } from 'react';
// Temporarily comment out antd and icons imports until dependencies are installed
// import { Button, Tabs } from 'antd';
// import {
//   BarChartOutlined,
//   AlignLeftOutlined,
//   NodeIndexOutlined,
//   SlidersFilled,
//   AlertOutlined,
//   SettingOutlined,
// } from '@ant-design/icons';
import { useResourceRates } from '../../../contexts/ResourceRatesContext';
import { useThreshold } from '../../../contexts/ThresholdContext';
import { useComponentLifecycle, useComponentRegistration } from '../../../hooks/ui';
import { ModuleEventType } from '../../../lib/modules/ModuleEvents';
import {
  ResourceType,
  ResourceTypeHelpers,
} from '../../../types/resources/StandardizedResourceTypes';
import ChainManagementInterface from './ChainManagementInterface';
import ConverterDashboard from './ConverterDashboard';
import ResourceFlowDiagram from './ResourceFlowDiagram';
import ResourceForecastingVisualization from './ResourceForecastingVisualization';
import './ResourceManagementDashboard.css';
import ResourceOptimizationSuggestions from './ResourceOptimizationSuggestions';
import ResourceThresholdVisualization from './ResourceThresholdVisualization';
import { ResourceVisualizationEnhanced } from './ResourceVisualizationEnhanced';

// Temporarily use simplified versions of Button and Tabs from custom components
const Button = ({
  children,
  onClick,
  type,
  size,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: string;
  size?: string;
}) => (
  <button
    onClick={onClick}
    className={`custom-button ${type === 'primary' ? 'primary' : ''} ${size === 'small' ? 'small' : ''}`}
  >
    {children}
  </button>
);

const Tabs = ({
  children,
  activeKey,
  onChange,
  type,
  className,
}: {
  children: React.ReactNode;
  activeKey: string;
  onChange: (key: string) => void;
  type?: string;
  className?: string;
}) => (
  <div className={`custom-tabs ${className || ''}`}>
    <div className="tabs-header">
      {React.Children.map(children, (child: any) => {
        const tabKey = child.props.tabKey;
        return (
          <div
            className={`tab-item ${activeKey === tabKey ? 'active' : ''}`}
            onClick={() => onChange(tabKey)}
          >
            {child.props.tab}
          </div>
        );
      })}
    </div>
    <div className="tabs-content">
      {React.Children.map(children, (child: any) => {
        const tabKey = child.props.tabKey;
        return activeKey === tabKey ? child.props.children : null;
      })}
    </div>
  </div>
);

Tabs.TabPane = ({
  children,
  tab,
  tabKey,
}: {
  children: React.ReactNode;
  tab: React.ReactNode;
  tabKey: string;
}) => <div className="tab-pane">{children}</div>;

// Main resource types to display
const MAIN_RESOURCES: ResourceType[] = ['minerals', 'energy', 'population', 'research'];
const SECONDARY_RESOURCES: ResourceType[] = ['plasma', 'gas', 'exotic'];

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

// Define custom event types for the component registry
type CustomEventType =
  | ModuleEventType
  | 'RESOURCE_THRESHOLD_CHANGED'
  | 'RESOURCE_THRESHOLD_TRIGGERED'
  | 'RESOURCE_FLOW_UPDATED';

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
  const { state: resourceRates } = useResourceRates();
  const { state: thresholdState, dispatch: thresholdDispatch } = useThreshold();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [resourceData, setResourceData] = useState<Record<ResourceType, ResourceData>>(
    {} as Record<ResourceType, ResourceData>
  );
  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);

  // Register with component registry
  useComponentRegistration({
    type: 'ResourceManagementDashboard',
    eventSubscriptions: [
      'RESOURCE_UPDATED',
      'RESOURCE_THRESHOLD_CHANGED' as CustomEventType,
      'RESOURCE_FLOW_UPDATED' as CustomEventType,
      'RESOURCE_THRESHOLD_TRIGGERED' as CustomEventType,
    ],
    updatePriority: 'high',
  });

  // Handle lifecycle and event subscriptions
  useComponentLifecycle({
    onMount: () => {
      console.log('ResourceManagementDashboard mounted');
    },
    onUnmount: () => {
      console.log('ResourceManagementDashboard unmounted');
    },
    eventSubscriptions: [
      {
        eventType: 'RESOURCE_UPDATED' as ModuleEventType,
        handler: event => {
          if (event.data?.resourceType) {
            updateResourceData(event.data.resourceType as ResourceType, event.data);
          }
        },
      },
      {
        eventType: 'RESOURCE_THRESHOLD_TRIGGERED' as CustomEventType,
        handler: event => {
          if (event.data?.resourceId) {
            // Show alert or notification
            console.log(`Threshold triggered for ${event.data.resourceId}`);
          }
        },
      },
    ],
  });

  // Initialize resource data from contexts - convert to useMemo
  const mockResourceData = useMemo(() => {
    // Mock data for demonstration - in a real implementation, this would come from the ResourceManager
    return {
      minerals: {
        type: ResourceType.MINERALS,
        value: 2500,
        maxValue: 10000,
        rate: resourceRates.minerals.net,
        cycleTime: 1000,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
      energy: {
        type: ResourceType.ENERGY,
        value: 7500,
        maxValue: 10000,
        rate: resourceRates.energy.net,
        cycleTime: 1000,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
      population: {
        type: ResourceType.POPULATION,
        value: 5000,
        maxValue: 10000,
        rate: resourceRates.population.net,
        cycleTime: 5000,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
      research: {
        type: ResourceType.RESEARCH,
        value: 1500,
        maxValue: 10000,
        rate: resourceRates.research.net,
        cycleTime: 2000,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
      plasma: {
        type: ResourceType.PLASMA,
        value: 800,
        maxValue: 5000,
        rate: 1.2,
        cycleTime: 1500,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
      gas: {
        type: ResourceType.GAS,
        value: 1200,
        maxValue: 5000,
        rate: -0.8,
        cycleTime: 1500,
        thresholds: {
          critical: 0.1,
          low: 0.25,
          target: 0.5,
          high: 0.75,
          maximum: 0.9,
        },
      },
      exotic: {
        type: ResourceType.EXOTIC,
        value: 250,
        maxValue: 2000,
        rate: 0.2,
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

  // Create memoized callback functions
  const updateResourceData = useCallback((type: ResourceType, data: Record<string, unknown>) => {
    setResourceData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...data,
      },
    }));
  }, []);

  const handleThresholdChange = useCallback(
    (resourceType: ResourceType, min: number, max: number) => {
      // When using ResourceTypeHelpers to get the display name
      console.log(
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
      console.log(`Toggling auto-mine for ${ResourceTypeHelpers.getDisplayName(resourceType)}`);

      thresholdDispatch({
        type: 'TOGGLE_AUTO_MINE',
        payload: {
          resourceId: resourceType,
        },
      });
    },
    [thresholdDispatch]
  );

  const handleResourceSelect = useCallback(
    (resource: ResourceType | null) => {
      setSelectedResource(resource === selectedResource ? null : resource);
    },
    [selectedResource]
  );

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
              onClick={() => handleResourceSelect(type === selectedResource ? null : type)}
            >
              {/* @ts-expect-error - Ignoring prop type issues for demo */}
              <ResourceVisualizationEnhanced
                type={type}
                value={resourceData[type]?.value || 0}
                rate={resourceData[type]?.rate || 0}
                capacity={resourceData[type]?.maxValue}
                thresholds={{
                  low: resourceData[type]?.maxValue * (resourceData[type]?.thresholds.low || 0.25),
                  critical:
                    resourceData[type]?.maxValue * (resourceData[type]?.thresholds.critical || 0.1),
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
              onClick={() => handleResourceSelect(type === selectedResource ? null : type)}
            >
              {/* @ts-expect-error - Ignoring prop type issues for demo */}
              <ResourceVisualizationEnhanced
                type={type}
                value={resourceData[type]?.value || 0}
                rate={resourceData[type]?.rate || 0}
                capacity={resourceData[type]?.maxValue}
                thresholds={{
                  low: resourceData[type]?.maxValue * (resourceData[type]?.thresholds.low || 0.25),
                  critical:
                    resourceData[type]?.maxValue * (resourceData[type]?.thresholds.critical || 0.1),
                }}
              />
            </div>
          ))}
        </div>

        {selectedResource && (
          <div className="resource-detail">
            <h3>Detailed View: {selectedResource}</h3>
            {/* @ts-expect-error - Ignoring prop type issues for demo */}
            <ResourceThresholdVisualization
              resourceType={selectedResource}
              currentValue={resourceData[selectedResource]?.value || 0}
              maxValue={resourceData[selectedResource]?.maxValue || 1000}
              rate={resourceData[selectedResource]?.rate || 0}
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
                onClick={() => handleResourceSelect(type === selectedResource ? null : type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
        <div className="flow-diagram-container">
          {/* @ts-expect-error - Ignoring prop type issues for demo */}
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
                onClick={() => handleResourceSelect(type === selectedResource ? null : type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        {selectedResource ? (
          <div className="forecasting-container">
            {/* @ts-expect-error - Ignoring prop type issues for demo */}
            <ResourceForecastingVisualization
              resourceType={selectedResource}
              currentValue={resourceData[selectedResource]?.value || 0}
              maxValue={resourceData[selectedResource]?.maxValue || 1000}
              rate={resourceData[selectedResource]?.rate || 0}
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
            <p>Please select a resource to view forecasting data.</p>
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
              type={selectedResource === null ? 'primary' : 'default'}
              onClick={() => handleResourceSelect(null)}
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
          {/* @ts-expect-error - Ignoring prop type issues for demo */}
          <ResourceOptimizationSuggestions
            focusedResource={selectedResource}
            showAllSuggestions={false}
            maxSuggestions={10}
            onImplementSuggestion={suggestion => {
              // Handle suggestion implementation
              // This could trigger a resource reallocation, optimization routine, etc.
              console.log(`Implementing suggestion: ${suggestion.id}`);

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
      <header className="dashboard-header">
        <h1>Resource Management</h1>
      </header>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" className="dashboard-tabs">
        <Tabs.TabPane tab={<span>Overview</span>} tabKey="overview">
          {renderResourceOverview()}
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span>Resource Flow</span>} tabKey="flow">
          {renderResourceFlow()}
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span>Forecasting</span>} tabKey="forecasting">
          {renderResourceForecasting()}
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span>Optimization</span>} tabKey="optimization">
          {renderOptimizationSuggestions()}
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span>Converters</span>} tabKey="converters">
          {renderConverterManagement()}
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span>Production Chains</span>} tabKey="chains">
          {renderProductionChains()}
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span>Threshold Config</span>} tabKey="thresholds">
          {renderThresholdConfiguration()}
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span>Alerts</span>} tabKey="alerts">
          {renderAlerts()}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

// Export a memoized version of the component
export const ResourceManagementDashboard = React.memo(ResourceManagementDashboardBase);

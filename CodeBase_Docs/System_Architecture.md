# CURSOR SYSTEM ARCHITECTURE

## PROPERLY UTILIZING THE RESTRUCTURING PLAN

This file outlines the phased restructuring plan for the system codebase. It provides a systematic approach to addressing architectural issues, with specific tasks organized into phases. When implementing improvements or refactoring the codebase, I will refer to this document to understand implementation priorities, the sequence of work, and success criteria for each phase. Use this as a tactical roadmap for transforming the codebase to align with the architecture defined in the System Integration document.

## IMPLEMENTATION APPROACH

When working with this restructuring plan:

1. Analyze each phase to understand its objectives and implementation requirements
2. Prioritize tasks according to the specified sequence within each phase
3. Implement solutions that address the core architectural issues identified in the plan
4. Reference the success metrics to validate that implementations meet the required standards
5. Ensure each implementation contributes to the overall restructuring goals

## PHASE-BASED IMPLEMENTATION

I will approach implementation in a structured manner following the phases outlined in the document:

1. For **Foundation and Analysis** tasks, I will focus on establishing architectural standards and analyzing current implementations
2. During **Core System Implementation**, I will develop standardized patterns for manager services, UI connections, and game loop integration
3. For **Module-by-Module Integration**, I will systematically implement connections between components following the specified patterns
4. When addressing **Performance Optimization and QA**, I will focus on measuring against the success metrics and implementing optimizations

## RELATIONSHIP TO SYSTEM INTEGRATION

While implementing this restructuring plan, I will maintain consistency with the architectural specifications in the System Integration document by:

1. Ensuring all new implementations align with the component relationships defined in the integration map
2. Addressing the critical issues and missing connections identified in the integration document
3. Implementing the standardized patterns that fulfill both the restructuring goals and architectural requirements
4. Validating that completed work satisfies both the architectural vision and the restructuring success criteria

## 1. SYSTEM ARCHITECTURE OVERVIEW

```json
{
  "system_name": "Galactic Sprawl",
  "architecture_type": "Layered with Event-Driven Communication",
  "primary_patterns": ["Context-Manager Pattern", "Event Bus Pattern", "Integration Layer Pattern"],
  "layer_structure": [
    {
      "layer_id": "ui_layer",
      "name": "UI Layer",
      "components": ["UIComponents", "ContextProviders"]
    },
    {
      "layer_id": "service_layer",
      "name": "Service Layer",
      "components": ["ManagerServices", "IntegrationLayer", "EventBuses"]
    },
    {
      "layer_id": "optimization_layer",
      "name": "Optimization Layer",
      "components": ["ResourceFlowManager", "GameLoop"]
    }
  ]
}
```

## 2. COMPONENT CATALOG

```typescript
interface SystemComponent {
  id: string;
  category: ComponentCategory;
  primary_connections: string[];
  responsibilities: string[];
  implementation_status: 'complete' | 'partial' | 'missing';
  codebase_location?: string; // The relative path to the component file in the codebase
}

type ComponentCategory =
  | 'UIComponent'
  | 'ContextProvider'
  | 'ManagerService'
  | 'CustomHook'
  | 'IntegrationLayer'
  | 'EventBus';

const ComponentCatalog: SystemComponent[] = [
  // UI Components
  {
    id: 'GameHUD',
    category: 'UIComponent',
    primary_connections: ['GameContext', 'ModuleContext'],
    responsibilities: ['Display game state', 'Trigger module building', 'Update game state'],
    implementation_status: 'partial',
    codebase_location: 'src/components/ui/GameHUD.tsx',
  },
  {
    id: 'ResourceVisual',
    category: 'UIComponent',
    primary_connections: ['GameContext', 'ResourceRatesContext', 'ThresholdContext'],
    responsibilities: [
      'Display resource data',
      'Show production/consumption rates',
      'Display threshold alerts',
    ],
    implementation_status: 'partial',
    codebase_location: 'src/components/ui/ResourceVisualization.tsx',
  },
  {
    id: 'GameStateMonitor',
    category: 'UIComponent',
    primary_connections: ['GameContext', 'ModuleContext'],
    responsibilities: [
      'Display real-time rates',
      'Show module states',
      'Display system events',
      'Provide debugging info',
    ],
    implementation_status: 'missing',
    codebase_location: 'src/components/debug/GameStateMonitor.tsx',
  },
  {
    id: 'ResourceVisualization',
    category: 'UIComponent',
    primary_connections: ['ResourceRatesContext', 'ThresholdContext'],
    responsibilities: ['Visualize resources', 'Show rates', 'Display alerts'],
    implementation_status: 'partial',
    codebase_location: 'src/components/ui/ResourceVisualization.tsx',
  },
  {
    id: 'ResourceDisplay',
    category: 'UIComponent',
    primary_connections: ['ComponentRegistryService', 'ModuleEventBus'],
    responsibilities: [
      'Display resource data',
      'Update on resource events',
      'Register with component registry',
      'Demonstrate component registration pattern',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/components/ui/resource/ResourceDisplay.tsx',
  },
  {
    id: 'ResourceRegistrationDemo',
    category: 'UIComponent',
    primary_connections: ['ComponentRegistryService', 'ModuleEventBus', 'ResourceDisplay'],
    responsibilities: [
      'Demonstrate component registration system',
      'Display registry statistics',
      'Provide event emission controls',
      'Visualize component lifecycle management',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/components/ui/resource/ResourceRegistrationDemo.tsx',
  },
  {
    id: 'ResourceVisualizationEnhanced',
    category: 'UIComponent',
    primary_connections: ['ComponentRegistryService', 'ModuleEventBus', 'GameContext'],
    responsibilities: [
      'Display resource data with real-time updates',
      'Visualize resource thresholds and status',
      'Showcase component registration integration',
      'Demonstrate event-driven UI updates',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/components/ui/resource/ResourceVisualizationEnhanced.tsx',
  },
  {
    id: 'resource.flow.diagram',
    category: 'UIComponent',
    primary_connections: ['ComponentRegistryService', 'ModuleEventBus', 'ResourceFlowManager'],
    responsibilities: [
      'Visualize the resource flow network using D3 force directed graph',
      'Display producers, consumers, storage nodes, and converters',
      'Show resource connections and flow rates between nodes',
      'Provide interactive zooming, panning, and node repositioning',
      'Update in real-time based on resource flow events',
      'Visualize resource types with color coding and indicators',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/components/ui/resource/ResourceFlowDiagram.tsx',
  },
  {
    id: 'ResourceManagementDashboard',
    category: 'UIComponent',
    primary_connections: [
      'ResourceVisualizationEnhanced',
      'ResourceThresholdVisualization',
      'ResourceFlowDiagram',
      'ConverterDashboard',
      'ChainManagementInterface',
    ],
    responsibilities: [
      'Provide a comprehensive interface for resource management',
      'Display resource status and thresholds',
      'Visualize resource flow network',
      'Manage resource converters and production chains',
      'Configure threshold settings',
      'Monitor resource alerts',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/components/ui/resource/ResourceManagementDashboard.tsx',
  },

  // Context Providers
  {
    id: 'GameContext',
    category: 'ContextProvider',
    primary_connections: ['ResourceManager', 'SystemIntegration'],
    responsibilities: [
      'Maintain game state',
      'Synchronize with manager methods',
      'Dispatch manager actions',
    ],
    implementation_status: 'partial',
    codebase_location: 'src/contexts/GameContext.tsx',
  },
  {
    id: 'ResourceRatesContext',
    category: 'ContextProvider',
    primary_connections: ['ResourceManager', 'ThresholdIntegration'],
    responsibilities: [
      'Track production/consumption rates',
      'Update on resource events',
      'Provide data to UI',
    ],
    implementation_status: 'partial',
    codebase_location: 'src/contexts/ResourceRatesContext.tsx',
  },
  {
    id: 'ThresholdContext',
    category: 'ContextProvider',
    primary_connections: ['ResourceManager', 'ThresholdIntegration'],
    responsibilities: [
      'Manage resource thresholds',
      'Generate alerts',
      'Trigger production adjustments',
    ],
    implementation_status: 'missing',
    codebase_location: 'src/contexts/ThresholdContext.tsx',
  },
  {
    id: 'ModuleContext',
    category: 'ContextProvider',
    primary_connections: ['ModuleManager', 'SystemIntegration', 'ModuleEventBus'],
    responsibilities: [
      'Maintain module state',
      'Synchronize with ModuleManager',
      'Register for module events',
    ],
    implementation_status: 'partial',
    codebase_location: 'src/contexts/ModuleContext.tsx',
  },

  // Manager Services
  {
    id: 'ResourceManager',
    category: 'ManagerService',
    primary_connections: ['ResourceFlowManager', 'GameContext', 'ModuleManager'],
    responsibilities: ['Manage resources', 'Calculate rates', 'Process resource transfers'],
    implementation_status: 'partial',
    codebase_location: 'src/managers/game/ResourceManager.ts',
  },
  {
    id: 'ModuleManager',
    category: 'ManagerService',
    primary_connections: ['ModuleContext', 'ResourceManager', 'ModuleEventBus'],
    responsibilities: [
      'Manage module lifecycle',
      'Process module operations',
      'Emit module events',
    ],
    implementation_status: 'partial',
    codebase_location: 'src/managers/module/ModuleManager.ts',
  },
  {
    id: 'ExplorationManager',
    category: 'ManagerService',
    primary_connections: ['ExplorationSystem'],
    responsibilities: [
      'Manage exploration',
      'Process discoveries',
      'Calculate exploration outcomes',
    ],
    implementation_status: 'missing',
    codebase_location: 'src/managers/exploration/ExplorationManagerImpl.ts',
  },

  // Integration Layer
  {
    id: 'SystemIntegration',
    category: 'IntegrationLayer',
    primary_connections: ['GameContext', 'ResourceManager', 'ModuleManager'],
    responsibilities: [
      'Bridge contexts and managers',
      'Synchronize states',
      'Broadcast state changes',
      'Handle initialization',
    ],
    implementation_status: 'partial',
    codebase_location: 'src/components/core/SystemIntegration.tsx',
  },
  {
    id: 'ComponentRegistryService',
    category: 'IntegrationLayer',
    primary_connections: ['EventPropagationService', 'UIComponents', 'ModuleEventBus'],
    responsibilities: [
      'Register and track UI components',
      'Manage component event subscriptions',
      'Monitor component performance metrics',
      'Provide component lookup by various criteria',
      'Optimize event distribution to components',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/services/ComponentRegistryService.ts',
    related_files: [
      'src/hooks/ui/useComponentRegistration.ts',
      'src/hooks/ui/useComponentLifecycle.ts',
      'src/components/ui/resource/ResourceDisplay.tsx',
      'src/components/ui/resource/ResourceRegistrationDemo.tsx',
    ],
  },
  {
    id: 'ThresholdIntegration',
    category: 'IntegrationLayer',
    primary_connections: ['ThresholdContext', 'ResourceManager'],
    responsibilities: [
      'Connect threshold and resources',
      'Update threshold values',
      'Trigger threshold actions',
      'Generate alerts',
    ],
    implementation_status: 'missing',
    codebase_location: 'src/components/core/ThresholdIntegration.tsx',
  },
  {
    id: 'EventBatcher',
    category: 'IntegrationLayer',
    primary_connections: ['ModuleEventBus', 'GameEventBus', 'ResourceEventBus'],
    responsibilities: [
      'Batch events',
      'Distribute to appropriate buses',
      'Process event priorities',
    ],
    implementation_status: 'partial',
    codebase_location: 'src/utils/events/EventBatcher.ts',
  },

  // Event Buses
  {
    id: 'ModuleEventBus',
    category: 'EventBus',
    primary_connections: ['ModuleManager', 'ModuleContext', 'EventDispatcherProvider'],
    responsibilities: ['Handle module events', 'Manage subscriptions', 'Maintain event history'],
    implementation_status: 'partial',
    codebase_location: 'src/lib/modules/ModuleEvents.ts',
  },
  {
    id: 'GameEventBus',
    category: 'EventBus',
    primary_connections: ['GameContext', 'EventDispatcherProvider'],
    responsibilities: ['Handle game events', 'Manage subscriptions', 'Maintain event history'],
    implementation_status: 'partial',
    codebase_location: 'src/hooks/game/useGlobalEvents.ts',
  },
  {
    id: 'ResourceEventBus',
    category: 'EventBus',
    primary_connections: ['ResourceManager', 'ResourceRatesContext', 'EventDispatcherProvider'],
    responsibilities: ['Handle resource events', 'Manage subscriptions', 'Maintain event history'],
    implementation_status: 'partial',
    codebase_location: 'src/utils/events/EventCommunication.ts',
  },

  // Hooks
  {
    id: 'useResourceManagement',
    category: 'Hook',
    primary_connections: ['ResourceManager', 'ResourceRatesContext'],
    responsibilities: [
      'Access resource data',
      'Provide resource manipulation methods',
      'Track resource rates',
    ],
    implementation_status: 'partial',
    codebase_location: 'src/hooks/resources/useResourceManagement.tsx',
  },
  {
    id: 'useComponentRegistration',
    category: 'Hook',
    primary_connections: ['ComponentRegistryService', 'React Components'],
    responsibilities: [
      'Register components with registry',
      'Provide unique component identifiers',
      'Specify event subscriptions',
      'Set component update priorities',
      'Handle component unregistration on unmount',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/hooks/ui/useComponentRegistration.ts',
  },
  {
    id: 'useComponentLifecycle',
    category: 'Hook',
    primary_connections: ['ComponentRegistryService', 'ModuleEventBus', 'React Components'],
    responsibilities: [
      'Manage component lifecycle events',
      'Set up event subscriptions',
      'Provide automatic cleanup',
      'Track performance metrics',
      'Ensure stable event handlers',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/hooks/ui/useComponentLifecycle.ts',
  },
  {
    id: 'useModuleEvents',
    category: 'Hook',
    primary_connections: ['ModuleEventBus', 'ModuleContext'],
    responsibilities: ['Subscribe to module events', 'Filter events', 'Provide event utilities'],
    implementation_status: 'partial',
    codebase_location: 'src/hooks/modules/useModuleEvents.ts',
  },

  // New component
  {
    id: 'resource.threshold.visualization',
    category: 'Resource Visualization',
    primary_connections: ['ComponentRegistryService', 'ModuleEventBus', 'ResourceThresholds'],
    responsibilities: [
      'Displays current resource levels in relation to defined thresholds',
      'Provides visual indicators for resource status (critical, low, normal, high, maximum)',
      'Calculates and displays time-to-threshold predictions based on current rates',
      'Shows progress towards next threshold level',
      'Updates automatically in response to resource events',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/components/ui/resource/ResourceThresholdVisualization.tsx',
  },

  // Pages
  {
    id: 'ResourceManagementPage',
    category: 'Page',
    primary_connections: [
      'ResourceManagementDashboard',
      'ResourceRatesProvider',
      'ThresholdProvider',
    ],
    responsibilities: [
      'Render the ResourceManagementDashboard component',
      'Provide necessary context providers',
      'Create a full-page layout for resource management',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/pages/ResourceManagementPage.tsx',
  },
  {
    id: 'ResourceForecastingVisualization',
    type: 'ui_component',
    description:
      'Visualizes forecasted resource levels based on current rates and consumption patterns',
    primary_connections: ['ResourceRatesContext', 'ThresholdContext', 'ComponentRegistryService'],
    codebase_location: 'src/components/ui/resource/ResourceForecastingVisualization.tsx',
    events_subscribed: [
      'RESOURCE_UPDATED',
      'RESOURCE_THRESHOLD_CHANGED',
      'RESOURCE_PRODUCED',
      'RESOURCE_CONSUMED',
      'RESOURCE_FLOW_UPDATED',
    ],
    implementation_status: 'completed',
    priority: 'medium',
  },
  {
    id: 'ResourceOptimizationSuggestions',
    type: 'ui_component',
    description:
      'Analyzes resource flows and provides optimization suggestions to improve efficiency',
    primary_connections: [
      'ResourceRatesContext',
      'ThresholdContext',
      'ComponentRegistryService',
      'ResourceFlowManager',
    ],
    codebase_location: 'src/components/ui/resource/ResourceOptimizationSuggestions.tsx',
    events_subscribed: [
      'RESOURCE_UPDATED',
      'RESOURCE_THRESHOLD_CHANGED',
      'RESOURCE_PRODUCED',
      'RESOURCE_CONSUMED',
      'RESOURCE_FLOW_UPDATED',
      'FLOW_OPTIMIZATION_COMPLETED',
      'CONVERTER_STATUS_CHANGED',
    ],
    implementation_status: 'completed',
    priority: 'low',
  },
];
```

## 3. CONNECTION MAP

```typescript
interface SystemConnection {
  source_id: string;
  target_id: string;
  connection_type: ConnectionType;
  data_flow: DataFlow;
  implementation_status: 'implemented' | 'partial' | 'missing';
  connection_pattern: string;
  codebase_location?: string; // Location where the connection is implemented
}

type ConnectionType = 'context-manager' | 'ui-context' | 'integration' | 'event';
type DataFlow = 'unidirectional' | 'bidirectional';

const ConnectionMap: SystemConnection[] = [
  // UI → Context connections
  {
    source_id: 'GameHUD',
    target_id: 'GameContext',
    connection_type: 'ui-context',
    data_flow: 'bidirectional',
    implementation_status: 'partial',
    connection_pattern: 'useGame() hook',
    codebase_location: 'src/components/ui/GameHUD.tsx',
  },
  {
    source_id: 'GameHUD',
    target_id: 'ModuleContext',
    connection_type: 'ui-context',
    data_flow: 'bidirectional',
    implementation_status: 'partial',
    connection_pattern: 'useModules() hook',
    codebase_location: 'src/components/ui/GameHUD.tsx',
  },
  {
    source_id: 'ResourceVisual',
    target_id: 'GameContext',
    connection_type: 'ui-context',
    data_flow: 'bidirectional',
    implementation_status: 'partial',
    connection_pattern: 'useGame() hook',
    codebase_location: 'src/components/ui/ResourceVisualization.tsx',
  },
  {
    source_id: 'ResourceVisual',
    target_id: 'ResourceRatesContext',
    connection_type: 'ui-context',
    data_flow: 'unidirectional',
    implementation_status: 'missing',
    connection_pattern: 'useResourceRates() hook',
    codebase_location: 'src/components/ui/ResourceVisualization.tsx',
  },

  // Context → Manager connections
  {
    source_id: 'GameContext',
    target_id: 'ResourceManager',
    connection_type: 'context-manager',
    data_flow: 'bidirectional',
    implementation_status: 'partial',
    connection_pattern: 'SystemIntegration middleware',
    codebase_location: 'src/components/core/SystemIntegration.tsx',
  },
  {
    source_id: 'ModuleContext',
    target_id: 'ModuleManager',
    connection_type: 'context-manager',
    data_flow: 'bidirectional',
    implementation_status: 'partial',
    connection_pattern: 'SystemIntegration middleware',
    codebase_location: 'src/components/core/SystemIntegration.tsx',
  },
  {
    source_id: 'ThresholdContext',
    target_id: 'ResourceManager',
    connection_type: 'context-manager',
    data_flow: 'bidirectional',
    implementation_status: 'missing',
    connection_pattern: 'ThresholdIntegration middleware',
    codebase_location: 'src/components/core/ThresholdIntegration.tsx',
  },

  // Integration Layer connections
  {
    source_id: 'SystemIntegration',
    target_id: 'GameContext',
    connection_type: 'integration',
    data_flow: 'bidirectional',
    implementation_status: 'partial',
    connection_pattern: 'Context initialization and state sync',
    codebase_location: 'src/components/core/SystemIntegration.tsx',
  },
  {
    source_id: 'SystemIntegration',
    target_id: 'ResourceManager',
    connection_type: 'integration',
    data_flow: 'bidirectional',
    implementation_status: 'partial',
    connection_pattern: 'Manager method calls and event subscription',
    codebase_location: 'src/components/core/SystemIntegration.tsx',
  },
  {
    source_id: 'ThresholdIntegration',
    target_id: 'ThresholdContext',
    connection_type: 'integration',
    data_flow: 'bidirectional',
    implementation_status: 'missing',
    connection_pattern: 'Context initialization and state sync',
    codebase_location: 'src/components/core/ThresholdIntegration.tsx',
  },

  // Event System connections
  {
    source_id: 'ModuleManager',
    target_id: 'ModuleEventBus',
    connection_type: 'event',
    data_flow: 'unidirectional',
    implementation_status: 'partial',
    connection_pattern: 'Event emission',
    codebase_location: 'src/managers/module/ModuleManager.ts',
  },
  {
    source_id: 'ResourceManager',
    target_id: 'ResourceEventBus',
    connection_type: 'event',
    data_flow: 'unidirectional',
    implementation_status: 'partial',
    connection_pattern: 'Event emission',
    codebase_location: 'src/managers/game/ResourceManager.ts',
  },
  {
    source_id: 'EventDispatcherProvider',
    target_id: 'ModuleEventBus',
    connection_type: 'event',
    data_flow: 'bidirectional',
    implementation_status: 'partial',
    connection_pattern: 'React context wrapper',
    codebase_location: 'src/utils/events/EventDispatcher.tsx',
  },
];
```

## 4. RESOURCE FLOW SYSTEM

```typescript
interface ResourceSystem {
  component_id: string;
  node_types: string[];
  primary_processes: Process[];
  performance_optimizations: Optimization[];
  codebase_location: string; // Location of the primary component implementation
}

interface Process {
  id: string;
  steps: string[];
  implementation_status: 'implemented' | 'partial' | 'missing';
  codebase_location?: string; // Location where this process is implemented
}

interface Optimization {
  id: string;
  strategy: string;
  implementation_status: 'implemented' | 'partial' | 'missing';
  codebase_location?: string; // Location where this optimization is implemented
}

const ResourceFlowSystem: ResourceSystem = {
  component_id: 'ResourceFlowManager',
  codebase_location: 'src/managers/resource/ResourceFlowManager.ts',
  node_types: ['ProducerNode', 'StorageNode', 'ConsumerNode', 'ConverterNode'],
  primary_processes: [
    {
      id: 'node_management',
      steps: [
        'Register and unregister resource nodes',
        'Track node state and capabilities',
        'Manage node connections and relationships',
      ],
      implementation_status: 'partial',
      codebase_location: 'src/managers/resource/ResourceFlowManager.ts',
    },
    {
      id: 'connection_management',
      steps: [
        'Establish connections between nodes',
        'Control flow rates between connected nodes',
        'Validate connection compatibility',
      ],
      implementation_status: 'partial',
      codebase_location: 'src/managers/resource/ResourceFlowManager.ts',
    },
    {
      id: 'resource_optimization',
      steps: [
        'Calculate optimal flow distributions',
        'Identify resource bottlenecks',
        'Apply efficiency modifiers for converters',
        'Prioritize essential resource consumers',
      ],
      implementation_status: 'partial',
      codebase_location: 'src/managers/resource/ResourceFlowManager.ts',
    },
    {
      id: 'flow_optimization',
      steps: [
        'Register resource nodes with manager',
        'Establish connections between compatible nodes',
        'Process converters to apply efficiency modifiers',
        'Calculate resource availability from producers and storage',
        'Calculate resource demand from consumers',
        'Identify bottlenecks and underutilized resources',
        'Optimize flow rates based on priorities',
        'Generate transfer records',
      ],
      implementation_status: 'partial',
      codebase_location: 'src/managers/resource/ResourceFlowManager.ts',
    },
    {
      id: 'converter_processing',
      steps: [
        'Apply efficiency ratings to resource production',
        'Process converters before other nodes',
        'Modify output connection rates by efficiency factor',
        'Enable simple and complex conversion chains',
      ],
      implementation_status: 'missing',
      codebase_location: 'src/managers/resource/ResourceFlowManager.ts',
    },
  ],
  performance_optimizations: [
    {
      id: 'batch_processing',
      strategy: 'Process large networks in batches to avoid blocking the main thread',
      implementation_status: 'missing',
      codebase_location: 'src/managers/resource/ResourceFlowManager.ts',
    },
    {
      id: 'state_caching',
      strategy: 'Cache resource states with configurable TTL (time-to-live)',
      implementation_status: 'missing',
      codebase_location: 'src/managers/resource/ResourceFlowManager.ts',
    },
    {
      id: 'incremental_updates',
      strategy: 'Update only connections that have changed, not the entire network',
      implementation_status: 'partial',
      codebase_location: 'src/managers/resource/ResourceFlowManager.ts',
    },
    {
      id: 'history_management',
      strategy: 'Limit transfer history size to prevent memory issues',
      implementation_status: 'missing',
      codebase_location: 'src/managers/resource/ResourceFlowManager.ts',
    },
  ],
};
```

## 5. EVENT SYSTEM

```typescript
interface EventSystem {
  component_id: string;
  core_components: EventComponent[];
  subscription_flow: string[];
  react_integration_pattern: string[];
  codebase_location: string; // Location of the primary event system implementation
}

interface EventComponent {
  id: string;
  responsibilities: string[];
  implementation_status: 'implemented' | 'partial' | 'missing';
  codebase_location?: string; // Location where this component is implemented
}

const EventSystem: EventSystem = {
  component_id: 'ModuleEventBus',
  codebase_location: 'src/lib/modules/ModuleEvents.ts',
  core_components: [
    {
      id: 'ModuleEventBus',
      responsibilities: [
        'Manage event subscription, emission, and history',
        'Operate as a singleton service',
        'Provide subscription management with cleanup',
        'Distribute events to registered listeners',
        'Maintain event history with filtering',
      ],
      implementation_status: 'partial',
      codebase_location: 'src/lib/modules/ModuleEvents.ts',
    },
    {
      id: 'EventDispatcherProvider',
      responsibilities: [
        'Wrap ModuleEventBus in a React context',
        'Manage component lifecycle for subscriptions',
        'Provide specialized hooks for components',
        'Track latest events by type',
      ],
      implementation_status: 'partial',
      codebase_location: 'src/utils/events/EventDispatcher.tsx',
    },
  ],
  subscription_flow: [
    'Components or modules subscribe to specific event types',
    'Event source emits event through ModuleEventBus',
    'ModuleEventBus adds event to history',
    'ModuleEventBus notifies all listeners for that event type',
    'Listeners handle event, potentially causing UI updates',
    'React components use hooks to subscribe with automatic cleanup',
  ],
  react_integration_pattern: [
    'Initialize with ModuleEventBus',
    'Subscribe to all event types to track latest events',
    'Provide useEventSubscription hook',
    'Provide useLatestEvent hook',
    'Provide useFilteredEvents hook',
    'Manage subscription cleanup on unmount',
  ],
};
```

## 6. CURRENT ISSUES AND INTEGRATION PRIORITIES

```typescript
interface SystemIntegrationIssues {
  priority_tasks: PriorityTask[];
  current_issues: Issue[];
  missing_connections: MissingConnection[];
  integration_strategy: IntegrationStrategy[];
}

interface PriorityTask {
  id: string;
  description: string;
  components_involved: string[];
  priority: 'high' | 'medium' | 'low';
  codebase_locations?: string[]; // Locations where changes are needed
}

interface Issue {
  id: string;
  description: string;
  impact: string;
  components_affected: string[];
  codebase_locations?: string[]; // Locations where the issue is present
}

interface MissingConnection {
  source_id: string;
  target_id: string;
  connection_description: string;
  implementation_requirements: string[];
  codebase_locations?: string[]; // Locations where implementation is needed
}

interface IntegrationStrategy {
  id: string;
  description: string;
  implementation_steps: string[];
  codebase_locations?: string[]; // Key locations for implementation
}

const SystemIntegrationIssues: SystemIntegrationIssues = {
  priority_tasks: [
    {
      id: 'resource_context_connection',
      description: 'Connect ResourceManager with GameContext and UI components',
      components_involved: ['ResourceManager', 'GameContext', 'ResourceVisual'],
      priority: 'high',
      codebase_locations: [
        'src/components/core/SystemIntegration.tsx',
        'src/contexts/GameContext.tsx',
        'src/components/ui/ResourceVisualization.tsx',
      ],
    },
    {
      id: 'module_context_connection',
      description: 'Integrate ModuleManager with ModuleContext and module UI components',
      components_involved: ['ModuleManager', 'ModuleContext'],
      priority: 'high',
      codebase_locations: [
        'src/components/core/SystemIntegration.tsx',
        'src/contexts/ModuleContext.tsx',
        'src/components/ui/modules/ModuleHUD.tsx',
      ],
    },
    {
      id: 'exploration_connection',
      description: 'Fix ExplorationManager connections to exploration components',
      components_involved: ['ExplorationManager', 'ExplorationSystem'],
      priority: 'medium',
      codebase_locations: [
        'src/managers/exploration/ExplorationManagerImpl.ts',
        'src/components/exploration/ExplorationSystemIntegration.tsx',
      ],
    },
    {
      id: 'event_registration',
      description: 'Ensure all UI components register for relevant events',
      components_involved: ['UIComponents', 'EventDispatcherProvider'],
      priority: 'high',
      codebase_locations: [
        'src/utils/events/EventDispatcher.tsx',
        'src/hooks/events/useSystemEvents.ts',
      ],
    },
    {
      id: 'state_update_pattern',
      description: 'Create consistent state update patterns throughout the application',
      components_involved: ['ContextProviders', 'ManagerServices'],
      priority: 'medium',
      codebase_locations: ['src/contexts/', 'src/managers/'],
    },
  ],
  current_issues: [
    {
      id: 'missing_game_loop',
      description:
        'Managers have update() methods but no central game loop coordinating these updates',
      impact: "Manager updates aren't happening on a controlled tick cycle",
      components_affected: ['ResourceManager', 'ModuleManager', 'ExplorationManager'],
      codebase_locations: [
        'src/managers/game/GameLoopManager.ts',
        'src/initialization/gameSystemsIntegration.ts',
      ],
    },
    {
      id: 'inconsistent_resource_flow',
      description:
        'Resources are updated both directly (GameContext dispatches) and through events',
      impact: 'No single source of truth for resource changes',
      components_affected: ['ResourceManager', 'GameContext', 'ResourceEventBus'],
      codebase_locations: ['src/managers/game/ResourceManager.ts', 'src/contexts/GameContext.tsx'],
    },
    {
      id: 'disconnected_event_system',
      description: 'EventBatcher is well-designed but used inconsistently across components',
      impact: "Many UI components don't properly subscribe to the events they need",
      components_affected: ['EventBatcher', 'UIComponents', 'ContextProviders'],
      codebase_locations: ['src/utils/events/EventBatcher.ts', 'src/components/ui/'],
    },
    {
      id: 'initialization_order',
      description: 'SystemIntegration depends on resourceManager but gets initialized too late',
      impact: "Components try to use managers before they're ready",
      components_affected: ['SystemIntegration', 'ResourceManager', 'UIComponents'],
      codebase_locations: ['src/components/core/SystemIntegration.tsx', 'src/App.tsx'],
    },
    {
      id: 'missing_actions',
      description:
        "UPDATE_RESOURCE_RATES action mentioned in SystemIntegration doesn't exist in GameContext",
      impact: 'No action to handle resource rate updates',
      components_affected: ['GameContext', 'SystemIntegration'],
      codebase_locations: [
        'src/contexts/GameContext.tsx',
        'src/components/core/SystemIntegration.tsx',
      ],
    },
  ],
  missing_connections: [
    {
      source_id: 'ResourceManager',
      target_id: 'GameContext',
      connection_description: 'ResourceManager needs to consistently notify GameContext of changes',
      implementation_requirements: [
        'Consistent notification pattern',
        'Actions for all resource state changes including rates',
      ],
      codebase_locations: [
        'src/managers/game/ResourceManager.ts',
        'src/contexts/GameContext.tsx',
        'src/components/core/SystemIntegration.tsx',
      ],
    },
    {
      source_id: 'ModuleManager',
      target_id: 'ModuleContext',
      connection_description:
        'ModuleContext operations should consistently go through ModuleManager',
      implementation_requirements: [
        'ModuleContext operations through ModuleManager',
        'Events from ModuleManager update ModuleContext',
      ],
      codebase_locations: [
        'src/managers/module/ModuleManager.ts',
        'src/contexts/ModuleContext.tsx',
        'src/components/core/SystemIntegration.tsx',
      ],
    },
    {
      source_id: 'ThresholdContext',
      target_id: 'ResourceManager',
      connection_description: 'ThresholdContext needs to be updated when resources change',
      implementation_requirements: [
        'Resource change notifications to ThresholdContext',
        'Threshold actions affecting resource usage policies',
      ],
      codebase_locations: [
        'src/contexts/ThresholdContext.tsx',
        'src/managers/game/ResourceManager.ts',
        'src/components/core/ThresholdIntegration.tsx',
      ],
    },
    {
      source_id: 'UIComponents',
      target_id: 'EventSystem',
      connection_description: 'UI components need to consistently subscribe to relevant events',
      implementation_requirements: [
        'Consistent event subscription in UI components',
        'Events triggering state updates through context dispatches',
      ],
      codebase_locations: [
        'src/components/ui/',
        'src/utils/events/EventDispatcher.tsx',
        'src/hooks/events/useSystemEvents.ts',
      ],
    },
  ],
  integration_strategy: [
    {
      id: 'game_loop',
      description: 'Establishing a Central Game Loop',
      implementation_steps: [
        'Create a GameLoop class to coordinate all manager updates',
        'Implement a consistent tick cycle for predictable state updates',
        'Register managers with the game loop',
        'Implement update priorities for different systems',
      ],
      codebase_locations: [
        'src/managers/game/GameLoopManager.ts',
        'src/initialization/gameSystemsIntegration.ts',
      ],
    },
    {
      id: 'resource_standardization',
      description: 'Standardizing Resource Management',
      implementation_steps: [
        'Designate ResourceManager as the single source of truth for resource changes',
        'Ensure all resource updates flow through a consistent pipeline',
        'Implement resource change tracking and notification',
        'Create standardized resource update events',
      ],
      codebase_locations: [
        'src/managers/game/ResourceManager.ts',
        'src/contexts/ResourceRatesContext.tsx',
        'src/components/core/SystemIntegration.tsx',
      ],
    },
    {
      id: 'event_connection',
      description: 'Connecting Event Systems',
      implementation_steps: [
        'Standardize event subscription across all UI components',
        'Ensure all managers properly emit events for state changes',
        'Implement event filtering and prioritization',
        'Create consistent event handling patterns',
      ],
      codebase_locations: [
        'src/utils/events/EventDispatcher.tsx',
        'src/hooks/events/useSystemEvents.ts',
        'src/utils/events/EventBatcher.ts',
      ],
    },
    {
      id: 'initialization_sequence',
      description: 'Fixing Initialization Sequence',
      implementation_steps: [
        'Create a proper dependency graph for initialization',
        'Implement a staged initialization process',
        'Add dependency checking before component initialization',
        'Implement service readiness notifications',
      ],
      codebase_locations: [
        'src/App.tsx',
        'src/initialization/gameSystemsIntegration.ts',
        'src/components/core/SystemIntegration.tsx',
      ],
    },
    {
      id: 'context_actions',
      description: 'Completing GameContext Actions',
      implementation_steps: [
        'Add missing action types to GameContext',
        'Implement handlers for all required state changes',
        'Create consistent action creator patterns',
        'Document action flow through the system',
      ],
      codebase_locations: ['src/contexts/GameContext.tsx', 'src/hooks/game/useGameState.ts'],
    },
  ],
};
```

## 7. IMPLEMENTATION GUIDANCE

When implementing this architecture:

1. **Component Analysis** - First analyze each component to understand its responsibilities and connections.

2. **Connection Implementation** - Focus on implementing missing connections between components following these patterns:

   - UI → Context: Use React hooks
   - Context → Manager: Use middleware pattern
   - Manager → Event: Use event emission pattern
   - Event → UI: Use subscription pattern

3. **System Integration** - Focus first on these critical integration points:

   - ResourceManager → GameContext → ResourceVisual chain
   - ModuleManager → ModuleContext → module UI components
   - Event system subscription for UI components
   - GameLoop integration with manager update methods

4. **Missing Components** - Implement these high-priority missing components:

   - ThresholdIntegration middleware
   - GameStateMonitor for debugging
   - Complete ModuleEventBus connection to UI components

5. **Testing Strategy** - Implement tests for:

   - Component connections
   - State synchronization
   - Event propagation
   - Resource flow optimization

6. **Refactoring Approach** - When refactoring existing components:

   - Add proper typing
   - Standardize event emission and subscription
   - Improve error handling
   - Implement consistent performance monitoring

7. **Development Process** - During implementation:
   - Document components and connections as you go
   - Create reusable patterns for similar components
   - Update integration tests to verify connections
   - Monitor performance impacts of changes

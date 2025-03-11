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

   - ✅ Standardized event system with EventType enum, EventBus class, and useEventSubscription hook
   - ✅ Created BaseContext template for consistent context provider implementation
   - ✅ Implemented BaseManager interface for standardized manager services
   - ✅ Added ServiceRegistry for dependency management between services
   - ✅ Completed Resource Type standardization with enum-based system

2. During **Core System Implementation**, I will develop standardized patterns for manager services, UI connections, and game loop integration

   - ✅ Refactored ResourceManager to implement BaseManager interface
   - ✅ Created standard connection patterns between managers and context providers
   - ✅ Implemented Component Registration System for centralized tracking of UI components
   - ✅ Enhanced GameLoopManager with priority-based scheduling
   - ✅ Fixed initialization sequence in SystemIntegration and App.tsx
   - ✅ Implemented WebGL shader system for advanced data visualizations

3. For **Advanced System Development**, I will focus on developing more sophisticated systems that enhance the application:

   - ✅ Implemented Resource Chaining System for complex production sequences
   - ✅ Added Threshold Management System for automated resource regulation
   - ✅ Enhanced Anomaly Detection System with improved algorithms
   - ✅ Implemented Resource Performance Monitoring System
   - ✅ Created Machine Learning Model for predicting resource consumption
   - ✅ Implemented Adaptive Performance Manager for performance optimization

4. For **Module-by-Module Integration**, I will systematically implement connections between components following the specified patterns

   - ✅ Updated resource UI components to use standard patterns
   - ✅ Implemented event subscriptions for resource changes
   - ✅ Connected ResourceVisualization to ThresholdContext
   - ✅ Created ModuleCard, ModuleGrid, and ModuleUpgradeVisualization components
   - ✅ Implemented standardized event subscriptions for module changes
   - ✅ Connected ModuleStatusDisplay to ModuleManager
   - ✅ Created comprehensive integration tests for Module System
   - ✅ Implemented Exploration System core architecture
     - ✅ Created ExplorationManager implementing BaseManager interface
     - ✅ Implemented ReconShipManagerImpl for ship management
     - ✅ Defined standardized event types for exploration system
     - ✅ Connected DataAnalysisContext with event subscriptions
     - ✅ Updated DataAnalysisSystem UI with real-time exploration data
   - 🔄 In Progress: Discovery Classification Visualization

5. When addressing **Performance Optimization and QA**, I will focus on measuring against the success metrics and implementing optimizations
   - ✅ Added performance monitoring in standardized managers
   - ✅ Implemented memoization in context providers for improved rendering performance
   - ✅ Created event batching for efficient event processing
   - 🔄 In Progress: Comprehensive system-wide performance optimization
   - 🔄 In Progress: Expanding test coverage and integration tests

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
  {
    id: 'ModuleCard',
    category: 'UIComponent',
    primary_connections: ['ModuleManager', 'ModuleStatusManager', 'ModuleEventBus'],
    responsibilities: [
      'Display module information',
      'Show module status and control activation',
      'Provide upgrade controls',
      'Trigger module selection',
      'Update in response to module events',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/components/ui/modules/ModuleCard.tsx',
  },
  {
    id: 'ModuleGrid',
    category: 'UIComponent',
    primary_connections: ['ModuleManager', 'ModuleCard', 'ModuleEventBus'],
    responsibilities: [
      'Display multiple modules in a grid layout',
      'Filter modules by type and status',
      'Sort modules by different criteria',
      'Handle module selection',
      'Update in response to module events',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/components/ui/modules/ModuleGrid.tsx',
  },
  {
    id: 'ModuleUpgradeVisualization',
    category: 'UIComponent',
    primary_connections: ['ModuleManager', 'ModuleEventBus', 'UpgradeSystem'],
    responsibilities: [
      'Visualize the module upgrade process',
      'Show progress through different upgrade stages',
      'Display estimated time remaining',
      'Provide controls for starting and canceling upgrades',
      'Update in real-time based on upgrade progress',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/components/ui/modules/ModuleUpgradeVisualization.tsx',
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

  // New Standardized System Components
  {
    id: 'BaseContext',
    category: 'ContextProvider',
    primary_connections: ['ManagerServices', 'UIComponents', 'EventSystem'],
    responsibilities: [
      'Provide standard context provider template',
      'Implement error handling and loading states',
      'Optimize performance through memoization',
      'Connect to manager services via standard pattern',
      'Handle event subscriptions automatically',
      'Implement context selectors for preventing unnecessary renders',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/lib/contexts/BaseContext.tsx',
  },
  {
    id: 'EventSystem',
    category: 'EventBus',
    primary_connections: ['ManagerServices', 'UIComponents', 'ContextProviders'],
    responsibilities: [
      'Standardize event type definitions',
      'Provide type-safe event subscriptions',
      'Implement event filtering utilities',
      'Handle subscription cleanup automatically',
      'Support batched event processing',
      'Provide performance monitoring',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/lib/events/EventTypes.ts',
    related_files: [
      'src/lib/events/EventBus.ts',
      'src/lib/events/useEventSubscription.ts',
      'src/lib/events/EventBatcher.ts',
      'src/lib/events/EventDevTools.ts',
    ],
  },
  {
    id: 'BaseManager',
    category: 'ManagerService',
    primary_connections: ['ServiceRegistry', 'EventSystem', 'ContextProviders'],
    responsibilities: [
      'Define standard manager interface',
      'Implement lifecycle methods',
      'Provide standardized error handling',
      'Support dependency injection',
      'Standardize event emission',
      'Include performance monitoring',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/lib/managers/BaseManager.ts',
  },
  {
    id: 'ServiceRegistry',
    category: 'IntegrationLayer',
    primary_connections: ['ManagerServices', 'SystemIntegration'],
    responsibilities: [
      'Manage dependencies between services',
      'Handle service initialization',
      'Resolve service dependencies',
      'Provide centralized service access',
      'Monitor service health',
    ],
    implementation_status: 'complete',
    codebase_location: 'src/lib/services/ServiceRegistry.ts',
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

## 8. RESOURCE MANAGEMENT SYSTEM UPDATES

### Resource Type Standardization

The resource management system has been significantly improved through the standardization of resource types across all components. This standardization addresses several architectural issues identified in the priority tasks and current issues sections.

#### Implementation Progress

1. **Core Resource Type Definition**

   - Created a centralized ResourceType enum in `src/types/resources/StandardizedResourceTypes.ts`
   - Replaced string literal types with enum values across all components
   - Implemented helper methods for type conversions and display formatting

2. **UI Component Updates**

   - Updated all resource visualization components to use the ResourceType enum
   - Fixed type inconsistencies in component props and state management
   - Improved error handling for type mismatches

3. **Context Provider Standardization**

   - Updated ResourceRatesContext and ThresholdContext to use the ResourceType enum
   - Implemented proper typing for context values and dispatch functions
   - Added backward compatibility layers for legacy code integration

4. **Mining System Integration**

   - Fixed type inconsistencies in mining-related components:
     - Updated MiningResource interface to use ResourceType enum
     - Corrected type comparisons in MiningControls.tsx from string literals to enum values
     - Standardized property access patterns across mining components
     - Added MiningShip interface to centralize type definitions

5. **Type Migration Strategy**
   - Implemented a phased approach to type migration:
     - Phase 1: Core system components (ResourceFlowManager, ResourceType definition)
     - Phase 2: UI Components and Context Providers
     - Phase 3: Mining System components
     - Phase 4 (Pending): Comprehensive testing
     - Phase 5 (Pending): Legacy code deprecation

#### Benefits Achieved

1. **Enhanced Type Safety**

   - TypeScript compiler now catches type errors at compile time
   - Eliminated runtime errors from incompatible type comparisons
   - Improved IntelliSense support for resource-related code

2. **Code Consistency**

   - Standardized resource type references across the codebase
   - Unified naming conventions for resource properties
   - Consistent property access patterns in all components

3. **Developer Experience**

   - Clearer type definitions improve code readability
   - Better autocompletion support for resource types
   - Simplified development of new resource-related features

4. **Maintenance Improvements**
   - Centralized resource type definitions reduce duplication
   - Easier to extend with new resource types
   - Better refactoring support through TypeScript's static analysis

### Integration with Component Registry

The standardized resource types have been fully integrated with the Component Registry System:

1. **Component Registration**

   - ResourceVisualization components register with proper type information
   - ResourceFlowDiagram nodes use standardized type definitions
   - Mining components properly integrate with the resource system

2. **Event Handling**
   - Resource events include proper type information
   - Components subscribe to events with type safety
   - Event handlers properly type-check resource data

### Documentation and Migration Strategy

To ensure proper adoption of the standardized resource types across the codebase, we've implemented a comprehensive documentation and migration strategy:

1. **Developer Guidelines**

   - Created detailed guidelines in `CodeBase_Docs/CodeBase_Context/StandardizedResourceTypes_Guide.md`
   - Provided clear examples of proper resource type usage
   - Documented best practices for working with the resource type system

2. **Migration Guide**

   - Created step-by-step migration instructions in `CodeBase_Docs/CodeBase_Context/ResourceType_Migration_Guide.md`
   - Outlined common migration scenarios and solutions
   - Provided strategies for handling type errors during migration

3. **Deprecation Warnings**

   - Added `@deprecated` JSDoc annotations to string-based types
   - Implemented runtime warnings when string literals are used (only in development mode)
   - Created a backward-compatible helper function for gradual migration

4. **Testing Framework**
   - Developed comprehensive tests for the ResourceType enum integration
   - Verified backward compatibility with string-based types
   - Created test patterns that other developers can reference

This documentation and migration strategy ensures that developers have clear guidance on how to use the new standardized resource types and how to migrate existing code. The deprecation warnings provide runtime feedback to help identify areas that still need to be updated.

### Completion of Resource Type Standardization

With the completion of the testing, documentation, and deprecation phases, the resource type standardization initiative is now complete. This represents a significant improvement in the codebase's type safety, consistency, and maintainability.

The next steps in the architectural roadmap focus on:

1. Standardizing the event system with similar type safety improvements
2. Implementing the context provider standardization
3. Defining the standard manager interface template

These initiatives will build upon the patterns established in the resource type standardization to create a more cohesive and maintainable codebase.

## Resource Management System

### Standardized Resource Types

We've implemented a standardized type system for resources in `src/types/resources/StandardizedResourceTypes.ts` to address inconsistencies identified during code analysis.

Key improvements:

- Converted string literal resource types to TypeScript enums for better type safety
- Created a centralized metadata repository for resource information
- Implemented a ResourceStateClass with proper validation and consistent property access
- Standardized all resource flow interfaces (nodes, connections, recipes, etc.)
- Added backward compatibility for existing string-based types

Complete documentation is available in `CodeBase_Docs/CodeBase_Context/StandardizedResourceTypes_Documentation.md`

### Implementation Progress

#### ResourceFlowManager Migration

The ResourceFlowManager has been updated to use the standardized resource types:

- Removed duplicate type definitions that are now in StandardizedResourceTypes
- Updated imports to use the new type definitions
- Replaced string literals with enum values
- Added ResourceStateClass for proper state management
- Added backward compatibility for interacting with legacy code

#### UI Component Updates

All UI components have been updated to use standardized types:

- ResourceManagementDashboard.tsx
- ResourceFlowDiagram.tsx
- ResourceThresholdVisualization.tsx
- ResourceVisualizationEnhanced.tsx
- ResourceForecastingVisualization.tsx
- ResourceOptimizationSuggestions.tsx

These components now use ResourceType enums and the ResourceTypeHelpers for type conversions and display name retrieval.

#### Context Provider Updates

The following context providers have been updated to use standardized types:

- ResourceRatesContext - Now uses ResourceType enum for tracking resource rates
- ThresholdContext - Now uses ResourceType enum for threshold configurations

#### Mining System Integration

We've also updated the mining system components to use standardized resource types:

- Updated MiningResource interface in MiningTypes.ts to use ResourceType enum
- Fixed MiningMap component to use consistent types
- Updated MineralProcessingCentre to use standardized MiningResource type
- Resolved type conflicts in ThresholdManager and ThresholdIntegration components

This integration ensures consistency across the resource management and mining systems.

#### Migration Strategy

1. Phase 1 (Completed): Created type definitions and updated core components
2. Phase 2 (Completed): Updated UI components and context providers
3. Phase 3 (In Progress): Resolving type inconsistencies in related subsystems
4. Phase 4 (Upcoming): Implement comprehensive testing
5. Phase 5 (Upcoming): Deprecate old string-based system

## EXPLORATION SYSTEM IMPLEMENTATION DETAILS

### ExplorationManager Implementation

The ExplorationManager has been implemented following the BaseManager pattern, providing a standardized interface for exploration-related functionality. This implementation:

1. Extends AbstractBaseManager to inherit standard manager behavior
2. Manages sectors, anomalies, and scan operations with strong typing
3. Communicates with UI components via standardized event system
4. Integrates with ReconShipManagerImpl for ship assignment operations
5. Exposes performance metrics through the BaseManager interface

Key architectural decisions:

```typescript
/**
 * Architecture pattern: Event-based communication
 *
 * ExplorationManager defines dedicated event types for exploration activities:
 * - SECTOR_DISCOVERED, SECTOR_SCANNED
 * - ANOMALY_DETECTED, RESOURCE_DETECTED
 * - SCAN_STARTED, SCAN_COMPLETED, SCAN_FAILED
 * - SHIP_ASSIGNED, SHIP_UNASSIGNED
 *
 * These events follow the standard BaseEvent structure with additional exploration-specific
 * properties.
 */
export enum ExplorationEvents {
  SECTOR_DISCOVERED = 'EXPLORATION_SECTOR_DISCOVERED',
  SECTOR_SCANNED = 'EXPLORATION_SECTOR_SCANNED',
  // Additional event types...
}

/**
 * Architecture pattern: Type-safe state management
 *
 * Strongly-typed interfaces for all exploration data:
 * - Sector, Anomaly, ScanOperation
 * - Ensures type safety throughout the system
 */
export interface Sector {
  id: string;
  name: string;
  status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  // Additional properties...
}

/**
 * Architecture pattern: Manager implementation
 *
 * ExplorationManager extends AbstractBaseManager to:
 * - Provide standardized lifecycle methods (initialize, update, dispose)
 * - Enable event-based communication
 * - Expose performance metrics via getStats()
 * - Implement exploration-specific functionality
 */
export class ExplorationManager extends AbstractBaseManager<BaseEvent> {
  // Implementation details...
}
```

### DataAnalysisContext Integration

The DataAnalysisContext has been enhanced to automatically process exploration data:

1. Subscribes to exploration events (SECTOR_DISCOVERED, ANOMALY_DETECTED, RESOURCE_DETECTED)
2. Automatically creates and updates datasets based on exploration discoveries
3. Converts exploration entities to standardized DataPoint format for analysis
4. Provides utility methods for accessing exploration-specific datasets

Key architectural decisions:

```typescript
/**
 * Architecture pattern: Event subscription
 *
 * DataAnalysisContext subscribes to exploration events to:
 * - Create datasets automatically from discoveries
 * - Maintain up-to-date analysis data
 * - Enable real-time analysis of exploration findings
 */
useEffect(
  () => {
    // Subscribe to exploration events
    const unsubscribeSector = explorationManager.subscribeToEvent(
      asEventType(ExplorationEvents.SECTOR_DISCOVERED),
      handleSectorDiscovered
    );

    // Additional subscriptions...

    // Cleanup on unmount
    return () => {
      unsubscribeSector();
      // Unsubscribe from other events...
    };
  },
  [
    /* dependencies */
  ]
);
```

### DataAnalysisSystem UI Component

The DataAnalysisSystem UI component has been updated to connect with ExplorationManager through DataAnalysisContext:

1. Displays real-time exploration statistics dashboard
2. Shows auto-generated datasets from exploration discoveries
3. Provides enhanced visualization of exploration data
4. Implements efficient dataset filtering and selection

Key architectural decisions:

```typescript
/**
 * Architecture pattern: Real-time data display
 *
 * DataAnalysisSystem retrieves exploration statistics via:
 * - ExplorationManager.getMetadata().stats
 * - Updates stats on interval for real-time monitoring
 */
React.useEffect(() => {
  // Function to update stats
  const updateStats = () => {
    const stats = explorationManager.getMetadata().stats || {};
    setExplorationStats({
      // Mapping stats...
    });
  };

  // Update on interval
  const interval = setInterval(updateStats, 5000);

  // Cleanup
  return () => clearInterval(interval);
}, []);

/**
 * Architecture pattern: Component specialization
 *
 * Specialized components for different aspects:
 * - DatasetInfo: Dataset statistics and metadata
 * - ResultVisualization: Analysis result visualization
 */
function DatasetInfo({ dataset }: DatasetInfoProps) {
  // Implementation details...
}
```

### Next Implementation Steps

The next steps in completing the Exploration System integration are:

1. Implement discovery classification algorithms
2. Create visualization components for classification results
3. Develop integration tests for exploration system
4. Optimize performance for large datasets
5. Implement user feedback mechanisms for classification accuracy

## Context Implementation Pattern

### Direct React Context Implementation

We have moved away from using the `createStandardContext` utility to a direct React context implementation using hooks. This approach:

1. Eliminates circular dependencies that were causing issues in tests
2. Provides more control over context creation and subscription management
3. Improves type safety and reduces reliance on utility functions

The new context pattern follows this structure:

```typescript
// 1. Define state and action types
interface ContextState extends BaseState {
  // Context-specific state properties
}

enum ActionType {
  // Enum of action types
}

// 2. Define action interfaces with proper typing
interface ContextAction {
  type: ActionType;
  payload: PayloadType;
}

// 3. Create the reducer function
const contextReducer = (state: ContextState, action: ContextAction): ContextState => {
  switch (action.type) {
    // Handle each action type
    default:
      return state;
  }
};

// 4. Create the context with proper TypeScript typing
type ContextType = {
  state: ContextState;
  dispatch: React.Dispatch<ContextAction>;
  manager?: ManagerType; // Optional manager reference
};

const Context = createContext<ContextType | undefined>(undefined);

// 5. Create the provider component
export const ContextProvider: React.FC<ProviderProps> = ({ children, manager, initialState }) => {
  const [state, dispatch] = useReducer(contextReducer, mergedInitialState);

  // Set up subscriptions and cleanup
  useEffect(() => {
    // Subscribe to events
    return () => {
      // Clean up subscriptions
    };
  }, [manager]);

  // Create and memoize the context value
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    manager
  }), [state, manager]);

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

// 6. Create hooks for accessing the context
export const useContextState = <T,>(selector: (state: ContextState) => T): T => {
  const context = useContext(Context);
  if (!context) throw new Error('Must be used within Provider');
  return selector(context.state);
};

export const useContextDispatch = (): React.Dispatch<ContextAction> => {
  const context = useContext(Context);
  if (!context) throw new Error('Must be used within Provider');
  return context.dispatch;
};

// 7. Create specific selectors and utility hooks
export const useSpecificStateValue = () => useContextState(state => state.specificValue);
```

### Implemented in These Contexts

- ResourceRatesContext.tsx
- GameContext.tsx

### Benefits

- No circular dependencies
- Better test compatibility
- Improved type safety
- More explicit state and action types
- Better control over subscriptions and event handling

### Future Improvements

- Fix type compatibility issues between different event type systems
- Standardize this pattern across all contexts
- Create better documentation for how to properly test these contexts

## Type-Safe Configuration Framework

We've developed a comprehensive type safety framework for application configuration, focusing on runtime validation, feature flags, and type-safe access.

### 1. Configuration Type System

#### 1.1 Core Configuration Types

The TypeSafeConfig framework provides rich typing for configuration values:

```typescript
export type ConfigValuePrimitive = string | number | boolean | null;
export type ConfigValue =
  | ConfigValuePrimitive
  | ConfigValuePrimitive[]
  | Record<string, ConfigValuePrimitive>
  | Record<string, ConfigValuePrimitive>[];

export interface ConfigItem<T extends z.ZodType = z.ZodType> {
  key: string;
  name: string;
  description: string;
  schema: T;
  defaultValue: z.infer<T>;
  category?: string;
  tags?: string[];
  metadata?: Record<string, ConfigValue>;
  isSecret?: boolean;
  isRequired?: boolean;
  source?: string;
}
```

This ensures:

- Configuration values have proper type constraints
- Configuration items include runtime validation schemas
- Default values are type-checked against their schemas
- Comprehensive metadata for all configuration settings

#### 1.2 Feature Flag System

The framework includes a powerful feature flag system:

```typescript
export enum FeatureStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  PREVIEW = 'preview',
  EXPERIMENTAL = 'experimental',
  BETA = 'beta',
  DEPRECATED = 'deprecated',
}

export interface FeatureTargeting {
  userRoles?: string[];
  environments?: string[];
  percentageRollout?: number;
  dateRange?: {
    start?: string;
    end?: string;
  };
  customRules?: Record<string, any>;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  status: FeatureStatus;
  defaultValue: boolean;
  targeting?: FeatureTargeting;
  metadata?: Record<string, ConfigValue>;
}
```

This provides:

- Type-safe feature flag definitions
- Rich targeting rules with proper typing
- Status information for feature lifecycle management
- Strongly typed context-based activation

### 2. Configuration Manager

#### 2.1 Type-Safe Access and Validation

The TypeSafeConfigManager class provides type-safe configuration management:

```typescript
export class TypeSafeConfigManager {
  // Registration methods
  registerConfig<T extends z.ZodType>(config: ConfigItem<T>): void;
  registerFeature(feature: FeatureFlag): void;
  registerCategory(category: ConfigCategory): void;

  // Type-safe access methods
  get<T extends z.ZodType>(key: string): z.infer<T> | undefined;
  isFeatureEnabled(key: string): boolean;

  // Validation methods
  set<T extends z.ZodType>(key: string, value: z.infer<T>): ConfigValidationResult;
  validateAllConfigs(): ConfigValidationResult;

  // Import/export methods
  exportConfig(): Record<string, any>;
  exportFeatures(): Record<string, boolean>;
  importConfig(config: Record<string, any>): ConfigValidationResult;
}
```

#### 2.2 Runtime Validation

The framework includes comprehensive runtime validation:

```typescript
// Validation result types
export interface ConfigValidationError {
  key: string;
  message: string;
  path?: string[];
  value?: any;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

// Example validation in the get method
if (this.options.validateOnAccess) {
  const validation = config.schema.safeParse(value);
  if (!validation.success) {
    const errors = this.formatZodErrors(key, validation.error);
    // Handle validation error...
  }
}
```

This ensures:

- All configuration values are validated before use
- Type safety between schema and value is enforced
- Detailed error information for validation failures
- Safe import/export of configuration values

### 3. React Integration

#### 3.1 Configuration Hooks

The framework includes React hooks for type-safe configuration access:

```typescript
export function useTypedConfig<T extends z.ZodType>(
  configManager: TypeSafeConfigManager,
  key: string,
  defaultValue?: z.infer<T>
): z.infer<T> {
  const value = configManager.get<T>(key);
  return value !== undefined ? value : (defaultValue as z.infer<T>);
}

export function useFeatureFlag(
  configManager: TypeSafeConfigManager,
  key: string,
  defaultValue = false
): boolean {
  return configManager.isFeatureEnabled(key) || defaultValue;
}
```

This provides:

- Type-safe configuration access in React components
- Proper type checking for configuration values
- Safe fallback to default values
- Simple API for feature flag checks

#### 3.2 User Context Integration

The framework supports user context for targeting rules:

```typescript
// Setting user context for feature targeting
configManager.setUserContext({
  role: 'admin',
  environment: 'development',
  id: 'user-123',
});

// Automatic evaluation based on context
if (
  feature.targeting.userRoles &&
  feature.targeting.userRoles.length > 0 &&
  this.userContext.role
) {
  if (!feature.targeting.userRoles.includes(this.userContext.role)) {
    return false;
  }
}
```

This enables:

- Role-based feature access
- Environment-specific configuration
- Percentage-based feature rollouts
- Date-based feature activation

### 4. Configuration Categories and Organization

The framework includes support for organizing configuration:

```typescript
export interface ConfigCategory {
  id: string;
  name: string;
  description: string;
  items: ConfigItem[];
}

// Registration method
registerCategory(category: ConfigCategory): void;

// Helper methods
getCategories(): ConfigCategory[];
getConfigItems(): ConfigItem[];
getFeatureFlags(): FeatureFlag[];
```

This provides:

- Logical grouping of configuration settings
- Hierarchical organization of settings
- Better discoverability and management
- Type-safe relationships between settings and categories

### 5. Helper Utilities

The framework includes helper utilities for creating configuration items:

```typescript
export function createConfigItem<T extends z.ZodType>(
  key: string,
  schema: T,
  defaultValue: z.infer<T>,
  options: Omit<ConfigItem<T>, 'key' | 'schema' | 'defaultValue'> = {}
): ConfigItem<T> {
  return {
    key,
    schema,
    defaultValue,
    name: options.name || key,
    description: options.description || '',
    // Other properties...
  };
}

export function createFeatureFlag(
  key: string,
  defaultValue: boolean,
  options: Omit<FeatureFlag, 'key' | 'defaultValue'> = {} as any
): FeatureFlag {
  return {
    key,
    defaultValue,
    name: options.name || key,
    // Other properties...
  };
}
```

This ensures:

- Type-safe creation of configuration items
- Default values for optional properties
- Consistent configuration patterns
- Reduced boilerplate code

### 6. Demonstration Component

The `TypeSafeConfigDemo.tsx` component showcases the configuration framework:

- Interactive configuration management UI
- Feature flag visualization with targeting rules
- Live editing of configuration values with validation
- User context manipulation for feature flag testing
- Import/export functionality
- Theme switching based on configuration

### 7. Schema-Based Validation

The framework leverages Zod schemas for validation:

```typescript
// Example schemas for configuration
const themeSchema = z.enum(['light', 'dark', 'system']);
const pageSizeSchema = z.number().int().min(5).max(100);
const apiEndpointSchema = z.string().url();
const notificationSchema = z.object({
  enabled: z.boolean(),
  sound: z.boolean().optional(),
  frequency: z.enum(['immediately', 'batched', 'daily']).optional(),
});

// Configuration creation with schemas
createConfigItem('theme', themeSchema, 'system', {
  name: 'Theme',
  description: 'Application color theme',
});
```

This provides:

- Rich validation rules with clear error messages
- Type inference from validation schema to TypeScript types
- Custom validation for complex configuration values
- Composition of validation rules

### 8. Benefits and Impact

#### 8.1 Development Benefits

- Prevents configuration-related type errors
- Improves IDE autocompletion for configuration values
- Ensures consistent configuration patterns
- Makes refactoring safer with type checking

#### 8.2 Runtime Benefits

- Catches invalid configuration values before they cause issues
- Provides helpful error messages for troubleshooting
- Ensures feature flags are correctly evaluated
- Simplifies context-based feature activation

#### 8.3 User Experience Benefits

- Enables safer feature rollouts with targeting rules
- Supports gradual feature adoption through percentage rollouts
- Allows for customized experiences based on user context
- Provides better error handling for misconfiguration

### 9. Best Practices

#### 9.1 Schema Definition

Define schemas for configuration values with appropriate constraints:

```typescript
// Good: Schema with appropriate constraints
const connectionSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  timeoutMs: z.number().int().min(0).max(60000),
  retryCount: z.number().int().min(0).max(10),
});

// Bad: Loose schema without constraints
const looseConnectionSchema = z.object({
  host: z.string(),
  port: z.number(),
  timeoutMs: z.number(),
  retryCount: z.number(),
});
```

#### 9.2 Feature Flag Organization

Organize feature flags with clear status and targeting rules:

```typescript
// Good: Clear organization and targeting
const featureFlags = [
  createFeatureFlag('newDashboard', false, {
    name: 'New Dashboard',
    description: 'Enable the new dashboard interface',
    status: FeatureStatus.PREVIEW,
    targeting: {
      userRoles: ['admin', 'beta-tester'],
      percentageRollout: 20,
    },
  }),
  // Other flags...
];

// Bad: Lack of organization and documentation
const poorFeatureFlags = {
  newDashboard: true,
  advancedCharts: false,
  // Other flags without documentation or targeting...
};
```

#### 9.3 Access Patterns

Use type-safe access patterns for configuration values:

```typescript
// Good: Type-safe access with hooks
const theme = useTypedConfig<typeof themeSchema>(configManager, 'theme', 'system');
const isNewDashboardEnabled = useFeatureFlag(configManager, 'newDashboard');

// Bad: Untyped access without validation
const theme = config.theme || 'system';
const isNewDashboardEnabled = features.newDashboard === true;
```

This type-safe configuration framework ensures that our application is correctly configured at both development time and runtime, with proper validation, organization, and type checking throughout the configuration lifecycle.

## PERFORMANCE OPTIMIZATION SYSTEMS

### Machine Learning Resource Consumption Predictor

The system now includes a machine learning prediction model for resource consumption:

- **Implementation**: Created `ResourceConsumptionPredictor` class that implements a linear regression model
- **Key Features**:

  - Analyzes historical resource consumption patterns
  - Predicts future resource needs based on usage patterns
  - Adapts to different user behaviors and system loads
  - Provides confidence scores with predictions
  - Supports online learning with incremental model updates

- **Core Components**:

  - Feature extraction from usage patterns and system metrics
  - Multiple linear regression model using normal equation method
  - Confidence scoring with R-squared calculation
  - Matrix operations for numerical stability
  - Prediction caching for performance

- **Integration Points**:
  - Connects with ResourcePerformanceMonitor for historical data
  - Provides predictions to AdaptivePerformanceManager
  - Suggests resource optimizations based on predicted vs actual usage

### Adaptive Performance Management

The system now includes an adaptive performance optimization manager:

- **Implementation**: Created `AdaptivePerformanceManager` class that optimizes performance based on device capabilities
- **Key Features**:

  - Device capability detection and profiling
  - Adaptive throttling based on system load
  - Power-saving mode for battery-constrained devices
  - Optimization suggestion engine
  - ML-based resource consumption prediction

- **Core Components**:

  - Device profiling system for hardware capability assessment
  - GameLoop frequency adjustment for adaptive throttling
  - Priority-based update throttling for resource optimization
  - Optimization suggestion generation and application

- **Integration Points**:
  - Connects with GameLoopManager for timing adjustments
  - Integrates with ResourceConsumptionPredictor for ML-based optimizations
  - Interfaces with event system for performance alerts and suggestions
  - Provides device-specific optimizations

## Performance Monitoring

### Long Session Memory Tracking

The Long Session Memory Tracking system provides comprehensive tools for monitoring, testing, and visualizing application memory usage over extended sessions. This system helps to identify memory leaks, analyze performance degradation, and ensure optimal resource utilization in long-running applications.

#### Architecture Components

1. **Core Utility (`LongSessionMemoryTracker`):**

   - Collects periodic memory snapshots
   - Analyzes memory usage trends and growth patterns
   - Provides leak detection algorithms with configurable thresholds
   - Supports session markers for correlating memory changes with user activities
   - Implements memory cleanup and optimization recommendations

2. **Test Suite (`LongSessionMemoryTestSuite`):**

   - Facilitates controlled testing of memory behavior
   - Simulates memory leaks with configurable rates
   - Runs test batteries for comprehensive evaluation
   - Generates detailed reports with findings and recommendations
   - Supports automated and manual testing scenarios

3. **Visualization Component (`LongSessionMemoryVisualizer`):**

   - Renders interactive charts of memory usage over time
   - Highlights potential leak areas and problematic trends
   - Provides detailed metrics and comparison tools
   - Supports real-time updates during active tracking

4. **Integration Page (`LongSessionMemoryPage`):**
   - Combines all components into a unified interface
   - Offers user-friendly controls for configuration
   - Provides tabs for tracking, testing, and viewing results
   - Includes notification system for important events

#### Performance Benefits

- Early detection of memory leaks before they impact end users
- Detailed analysis of memory growth patterns over extended usage periods
- Comparative benchmarking across different application states
- Reduction in performance degradation incidents related to memory issues
- Improved resource utilization through targeted optimizations

#### Implementation Considerations

- Browser memory API availability and limitations
- Accuracy of memory measurements in different environments
- Balancing snapshot frequency with performance impact
- False positive mitigation in leak detection algorithms
- Data visualization performance for large datasets

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

## RESOURCE FLOW SYSTEM ARCHITECTURE IMPROVEMENTS

### Overview

The resource flow system has been significantly improved to address type conflicts, code organization, and maintainability issues. The improvements focus on standardizing resource types, implementing a proper singleton pattern, and creating a centralized resource registry.

### Implemented Improvements

1. **Resource Type Converter**: Created a new type conversion layer in `ResourceTypeConverter.ts` for bidirectional conversion between string-based and enum-based resource types, ensuring type safety.

2. **Resource Registry**: Implemented a centralized `ResourceRegistry` class that provides comprehensive metadata for resource types, supports categorization, tagging, and includes an event system for resource changes.

3. **Integration Layer**: Created `ResourceRegistryIntegration` to facilitate the transition from legacy string-based types to enum-based types.

4. **Type Safety Improvements**: Added explicit type definitions and type guards to enhance event handling and replace `any` types with proper interfaces.

### Remaining Work

1. **Fix Linter Errors**: Address remaining linter errors in `ResourceConversionManager`, particularly in async handling and property access.

2. **Complete ResourceFlowManager Refactoring**: Update `ResourceFlowManager` to utilize `ResourceConversionManager` and implement the `AbstractBaseManager` interface.

3. **Integration Testing**: Conduct comprehensive testing post-refactoring to ensure functionality and performance.

4. **Documentation Updates**: Update codebase documentation to reflect the new architecture and add JSDoc comments.

### Long-term Recommendations

1. **Standardize on a Single Resource Type System**: Aim for a unified definition of `ResourceType`.

2. **Resource Registry UI**: Implement a debug interface for viewing and managing resources, visualizing resource flows and conversions.

3. **Performance Optimization**: Profile the system post-refactoring to identify bottlenecks.

4. **Unit Test Coverage**: Increase unit test coverage for reliability.

## Resource Registry System

The Resource Registry system has been significantly enhanced to address inconsistencies in resource type handling across the codebase. The improvements focus on standardizing resource types, implementing a proper singleton pattern, and creating a centralized resource registry.

#### Key Improvements

1. **Resource Type Converter**: Created a new type conversion layer in `ResourceTypeConverter.ts` for bidirectional conversion between string-based and enum-based resource types, ensuring type safety.

   - Added type guards for runtime type checking
   - Implemented caching for performance optimization
   - Created utilities for converting arrays, records, and objects
   - Added comprehensive error handling for invalid conversions

2. **Resource Registry**: Implemented a centralized `ResourceRegistry` class that provides comprehensive metadata for resource types, supports categorization, tagging, and includes an event system for resource changes.

3. **Resource Type Migration**: Created a migration utility in `ResourceTypeMigration.ts` to facilitate the transition from string-based to enum-based resource types.

   - Implemented analysis functions to identify migration needs
   - Created compatibility wrappers for gradual migration
   - Developed a comprehensive migration guide for developers

4. **Subsystem Updates**: Updated core resource subsystems to use standardized resource types.
   - Modified `ResourceSystem.ts` to use enum-based resource types with a compatibility layer
   - Updated `ResourceFlowSubsystem.ts` to accept both string and enum resource types
   - Updated `ResourceTransferSubsystem.ts` to handle both types and convert as needed
   - Updated `ResourceStorageSubsystem.ts` with comprehensive type conversion support
   - Updated `ResourceThresholdSubsystem.ts` to accept both string and enum resource types
   - Currently updating `ResourceFlowManager.ts` and `useResourceManagement.tsx` to use standardized resource types

#### Implementation Status

- ✅ Core ResourceRegistry implementation
- ✅ ResourceRegistryIntegration with ResourceManager
- ✅ ResourceTypeConverter with bidirectional mapping
- ✅ ResourceTypeMigration utility for code migration
- ✅ Updated ResourceSystem with standardized types
- ✅ Updated ResourceFlowSubsystem with type conversion
- ✅ Updated ResourceTransferSubsystem with type conversion
- ✅ Updated ResourceStorageSubsystem with type conversion
- ✅ Updated ResourceThresholdSubsystem with type conversion
- ✅ Updated ResourceFlowManager with standardized types
- ✅ Updated ResourcePerformanceMonitor with standardized types
- ✅ Updated AdaptivePerformanceManager with standardized types
- ✅ Updated ResourceManager with standardized types (fixed linter errors)
- ✅ Updated ResourceIntegration with standardized types (fixed properly)
- ✅ Updated UI components with standardized types:
  - ✅ ResourceDisplay component
  - ✅ ResourceRegistrationDemo
- ⬜ Update remaining resource-related code with standardized types
- ⬜ Update tests to use standardized resource types

## Code Duplication Analysis and Consolidation Strategy

### Identified Duplication Patterns

The codebase contains several recurring patterns of duplication that should be addressed through architectural improvements:

1. **Singleton Pattern Duplication**

   - Services and managers repeatedly implement the same singleton pattern
   - Opportunity: Create base classes or utilities for standardized singleton implementation

2. **Event System Fragmentation**

   - Multiple event systems with overlapping functionality
   - Opportunity: Unified event architecture with context-specific adapters

3. **Component Pattern Duplication**

   - Visualization components with similar rendering logic
   - UI components with duplicated functionality
   - Opportunity: Component composition and inheritance hierarchies

4. **Hook Pattern Duplication**

   - Common React hook patterns duplicated across the codebase
   - Opportunity: Higher-order hooks and hook factories

5. **Manager/Service Lifecycle Duplication**
   - Initialization, error handling, and lifecycle management duplicated
   - Opportunity: Standardized lifecycle management

### Consolidation Architecture

The following architectural improvements will address the identified duplication patterns:

#### 1. Core Infrastructure Layer

**Base Service Architecture**

```
BaseService (abstract)
├── SingletonService (abstract)
│   ├── DataProcessingService
│   ├── ErrorLoggingService
│   └── ...
└── ServiceRegistry
    ├── register()
    ├── get()
    └── initialize()
```

**Base Manager Architecture**

```
BaseManager (abstract)
├── SingletonManager (abstract)
│   ├── ResourceManager
│   ├── CombatManager
│   └── ...
└── ManagerRegistry
    ├── register()
    ├── get()
    └── initialize()
```

#### 2. Event System Architecture

```
EventSystem
├── EventBus (core implementation)
├── Adapters
│   ├── ReactEventAdapter
│   ├── WorkerEventAdapter
│   └── ServiceEventAdapter
└── Processors
    ├── EventBatcher
    ├── EventFilter
    └── EventPrioritizer
```

#### 3. Component Architecture

**Visualization Component Architecture**

```
BaseVisualizationComponent
├── Renderers
│   ├── SVGRenderer
│   ├── CanvasRenderer
│   └── WebGLRenderer
├── Charts
│   ├── BaseChart
│   ├── LineChart
│   └── ...
└── Utilities
    ├── DataTransformers
    ├── MemoryOptimizers
    └── ErrorBoundaries
```

**UI Component Architecture**

```
BaseUIComponent
├── Button
│   ├── PrimaryButton
│   ├── SecondaryButton
│   └── SpecializedButtons
└── ErrorBoundaries
    ├── GlobalErrorBoundary
    ├── VisualizationErrorBoundary
    └── ...
```

#### 4. Hook Architecture

```
BaseHooks
├── LifecycleHooks
│   ├── useComponentLifecycle
│   └── useSubscription
├── StateHooks
│   ├── useAsyncState (loading, error, data pattern)
│   └── useResourceState
└── CallbackHooks
    ├── useEventCallback
    └── useActionCallback
```

### Implementation Phases

The consolidation will be implemented in four phases, as detailed in the System_Scratchpad.md tasklist:

1. **Phase 1: Critical Infrastructure Consolidation** (VERY HIGH Priority)

   - Service pattern standardization
   - Service registry unification

2. **Phase 2: Core System Consolidation** (HIGH Priority)

   - Event system unification
   - Resource management consolidation
   - Manager pattern standardization
   - Visualization component consolidation
   - Hook pattern standardization
   - System integration architecture

3. **Phase 3: Secondary System Consolidation** (MEDIUM Priority)

   - Event processing pipeline
   - Module management system
   - Performance monitoring system
   - Animation optimization system
   - UI component standardization
   - Game system consolidation
   - Callback pattern standardization

4. **Phase 4: Low Priority Consolidation** (LOW Priority)
   - Worker implementation
   - Testing utilities
   - Visualization error handling
   - Visualization type definitions

### Architectural Principles for Consolidation

1. **Composition Over Inheritance**

   - Use composition for specialized behavior where possible
   - Reserve inheritance for clear "is-a" relationships

2. **Interface Standardization**

   - Define clear interfaces before implementation
   - Ensure consistent prop/parameter naming across similar components

3. **Separation of Concerns**

   - Separate rendering logic from data management
   - Separate business logic from UI components

4. **Progressive Enhancement**

   - Implement consolidation incrementally
   - Maintain backward compatibility during transition

5. **Test-Driven Refactoring**
   - Ensure test coverage before refactoring
   - Verify behavior consistency after consolidation

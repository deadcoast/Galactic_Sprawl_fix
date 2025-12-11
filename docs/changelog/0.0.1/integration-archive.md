# CURSOR SYSTEM INTEGRATION FILE

## PROPERLY UTILIZING THE ARCHITECTURE DOCUMENTATION

This file documents the current state of the system architecture. It serves as a comprehensive reference for all system components, their relationships, and implementation status. When analyzing the codebase, refer to this document to understand the intended architecture, identify gaps between the current implementation and the architectural vision, and determine what connections need to be established or fixed. This document represents the `source of truth` for system architecture decisions and should inform all implementation work.

## USAGE INSTRUCTIONS FOR IMPLEMENTATION

When working with this architectural documentation:

1. Reference specific components using their unique identifiers to ensure precise communication about system elements
2. Parse all JSON objects and TypeScript interfaces as structured specifications that define the intended implementation
3. When implementing a component, first analyze the relevant codebase files to understand current implementation status
4. Fill in any placeholder values in the interfaces with concrete code implementations that align with architectural standards
5. Present implementation suggestions with specific code examples that follow the architectural patterns
6. Generate actionable code that fulfills the requirements specified in each component section

The document serves as a comprehensive blueprint for the system architecture, with each section containing machine-readable specifications that guide implementation decisions. I will maintain consistency with these specifications when suggesting code changes or additions.

## IMPLEMENTATION APPROACH

When suggesting implementations based on this document, I will:

1. First identify the component and its connections in the architecture specification
2. Reference the implementation status to understand what needs to be built or modified
3. Follow the specified connection patterns when implementing component relationships
4. Ensure new code aligns with the architectural patterns defined in the document
5. Address any identified issues or missing connections with solutions that conform to the architecture

This approach ensures that all implementation work contributes to a cohesive system that matches the intended architecture while addressing the current state of the codebase.

## System Overview

```json
{
  "project": "Galactic Sprawl",
  "current_issues": [
    "UI-backend disconnection",
    "Inconsistent type usage",
    "Architectural drift"
  ],
  "goal": "Transform codebase into maintainable, scalable system with clear architectural boundaries"
}
```

## Reference Documents

```json
{
  "reference_architecture": [
    "System Integration Map",
    "System Architecture Diagrams"
  ],
  "priority": "Implement connections depicted in diagrams while standardizing patterns"
}
```

## Implementation Timeline

```json
{
  "phases": [
    {
      "id": "phase1",
      "name": "Foundation and Analysis",
      "duration": "2 weeks",
      "components": ["ResourceSystem", "EventSystem", "ContextProviders"]
    },
    {
      "id": "phase2",
      "name": "Core System Implementation",
      "duration": "4 weeks",
      "components": ["ManagerServices", "UIConnections", "GameLoop"]
    },
    {
      "id": "phase3",
      "name": "Module-by-Module Integration",
      "duration": "6 weeks",
      "components": ["ResourceModule", "ModuleSystem", "ExplorationSystem"]
    },
    {
      "id": "phase4",
      "name": "Performance Optimization and QA",
      "duration": "2 weeks",
      "components": ["PerformanceOptimization", "TestingQA"]
    }
  ]
}
```

## Phase 1: Foundation and Analysis

### Component: ResourceSystem

**Implementation ID**: `phase1.resource`

#### Current Implementation Status

- Located primarily in `src/managers/game/ResourceManager.ts` and `src/managers/resource/ResourceFlowManager.ts`
- ResourceManager: Manages resources with production/consumption tracking, but lacks consistent event emission
- ResourceFlowManager: Handles resource optimization but has limited integration with UI
- ResourceIntegration: Located in `src/hooks/resources/useResourceManagement.tsx` - creates singleton connection
- Missing connections between ResourceVisual UI components and ResourceRatesContext

#### Analysis Tasks

- Parse ResourceFlowManager implementation against architecture diagram
- Identify type discrepancies using TypeScript compiler API
- Map event handling patterns and component connection gaps
- Generate report on architectural compliance

#### Implementation Tasks

```typescript
interface ResourceImplementationTasks {
  type_standardization: {
    target_files: [
      "src/types/resources/ResourceTypes.ts",
      "src/managers/game/ResourceManager.ts",
      "src/managers/resource/ResourceFlowManager.ts",
    ];
    type_definitions: {
      resources: string; // Core resource type definitions with strict typing
      nodes: string; // Resource node type definitions
      flows: string; // Flow connection type definitions
    };
  };
  connection_implementation: {
    missing_connections: [
      {
        from: "ResourceManager";
        to: "GameContext";
        connection_type: "event-driven";
      },
      {
        from: "ResourceRatesContext";
        to: "ResourceVisual";
        connection_type: "hook-based";
      },
      {
        from: "ResourceManager";
        to: "ThresholdContext";
        connection_type: "middleware";
      },
    ];
    implementation_priority: [1, 2, 3]; // Connection implementation order
  };
  event_standardization: {
    event_types: [
      "RESOURCE_PRODUCED",
      "RESOURCE_CONSUMED",
      "RESOURCE_TRANSFERRED",
      "RESOURCE_THRESHOLD_REACHED",
    ];
    emission_points: [
      "ResourceManager.addResource()",
      "ResourceManager.subtractResource()",
      "ResourceManager.transferResource()",
      "ResourceThresholdManager.checkThresholds()",
    ];
    subscription_patterns: "Use moduleEventBus.subscribe() with cleanup on component unmount";
  };
}
```

### Component: EventSystem

**Implementation ID**: `phase1.events`

#### Current Implementation Status

- ✅ Core event system standardized with proper type definitions in `src/lib/events/EventTypes.ts`
- ✅ EventBus base class implemented in `src/lib/events/EventBus.ts` with memory management and performance monitoring
- ✅ ModuleEventBus updated in `src/lib/modules/ModuleEvents.ts` to extend standardized EventBus
- ✅ Standardized event subscription hook in `src/lib/events/useEventSubscription.ts`
- ✅ Event batching implemented in `src/lib/events/EventBatcher.ts` for performance optimization
- ✅ Developer tools created in `src/lib/events/EventDevTools.ts` for debugging and monitoring
- ✅ UI components updated to use standardized event subscription patterns

#### Analysis Tasks

- ✅ Compare ModuleEventBus implementation with architecture documentation
- ✅ Catalog event subscription patterns across UI components
- ✅ Identify subscription cleanup issues
- ✅ Map event emission patterns in manager services

#### Implementation Tasks

```typescript
interface EventSystemTasks {
  standardization: {
    event_type_definitions: "✅ Create standardized event interfaces with strict typing";
    subscription_utilities: "✅ Implement useEventSubscription hook with automated cleanup";
    memory_leak_prevention: {
      tracking_mechanism: "✅ Track subscriptions by component or hook instance ID";
      cleanup_pattern: "✅ Use useEffect cleanup function to unsubscribe";
    };
  };
  implementation_order: [
    "✅ Standardize event type definitions",
    "✅ Implement subscription utilities",
    "✅ Enhance EventDispatcher with standardized hooks",
    "✅ Refactor UI components to use standardized patterns",
    "✅ Add memory leak detection in development mode",
  ];
}
```

### Component: ContextProviders

**Implementation ID**: `phase1.contexts`

#### Current Implementation Status

- ✅ BaseContext template created in `src/lib/contexts/BaseContext.tsx` providing standardized context pattern
- ✅ Context provider template includes error handling, loading states, and performance optimization
- ✅ Context selector pattern implemented for preventing unnecessary re-renders
- ✅ Standard connection pattern to manager services via middleware
- ✅ Automatic event subscription handling with cleanup
- Partial implementation of GameContext in `src/contexts/GameContext.tsx` - needs refactoring to BaseContext
- Partial implementation of ResourceRatesContext in `src/contexts/ResourceRatesContext.tsx` - needs refactoring
- ThresholdContext in `src/contexts/ThresholdContext.tsx` - connections to ResourceManager implemented
- Partial implementation of ModuleContext in `src/contexts/ModuleContext.tsx` - needs refactoring

#### Analysis Tasks

- ✅ Analyze existing context provider implementations
- ✅ Identify state management patterns
- ✅ Map context-to-manager connections
- ✅ Assess render optimization opportunities

#### Implementation Tasks

```typescript
interface ContextStandardizationTasks {
  template_creation: {
    context_template: "✅ Create a standard context provider pattern with consistent API";
    connection_pattern: "✅ Implement standard manager-context connection via middleware";
  };
  refactoring: {
    priority_contexts: [
      "GameContext",
      "ResourceRatesContext",
      "ThresholdContext",
      "ModuleContext",
    ];
    implementation_steps: [
      "✅ Extract common context provider patterns",
      "✅ Create standard reducer pattern",
      "✅ Implement manager connection middleware",
      "✅ Standardize event subscription",
      "✅ Add memoization for performance",
    ];
  };
  consumer_updates: {
    patterns: "✅ Use context selectors to prevent unnecessary re-renders";
    hook_implementations: [
      "🔄 useGame() with selector pattern",
      "🔄 useResourceRates() with selector pattern",
      "✅ useThresholds() with selector pattern",
      "🔄 useModules() with selector pattern",
    ];
  };
}
```

## Phase 2: Core System Implementation

### Component: ManagerServices

**Implementation ID**: `phase2.managers`

#### Current Implementation Status

- ✅ BaseManager interface defined in `src/lib/managers/BaseManager.ts` with standard lifecycle methods
- ✅ ServiceRegistry implemented in `src/lib/services/ServiceRegistry.ts` for dependency management
- ✅ ResourceManager refactored in `src/managers/game/ResourceManager.ts` to implement BaseManager
- ✅ ResourceFlowManager updated in `src/managers/resource/ResourceFlowManager.ts` with standardized patterns
- ✅ ModuleManager refactored in `src/managers/module/ModuleManager.ts` to implement BaseManager
- ✅ GameLoopManager enhanced in `src/managers/game/GameLoopManager.ts` for coordinating updates
- ✅ Staged initialization process implemented with proper dependency resolution

#### Analysis Tasks

- ✅ Map current manager service interfaces
- ✅ Identify dependencies between managers
- ✅ Analyze initialization sequences
- ✅ Document event emission patterns

#### Implementation Tasks

```typescript
interface ManagerStandardizationTasks {
  interface_definition: {
    base_manager_interface: "✅ Create a BaseManager interface with standard lifecycle methods";
    specialization_patterns: {
      ResourceManager: "✅ Implement BaseManager with resource-specific extensions";
      ModuleManager: "✅ Implement BaseManager with module-specific extensions";
      ExplorationManager: "🔄 Implement BaseManager with exploration-specific extensions";
    };
  };
  service_registry: {
    implementation: "✅ Create a centralized ServiceRegistry for dependency injection";
    dependency_resolution: "✅ Implement dependency resolution with proper initialization order";
  };
  refactoring: {
    priority_managers: ["ResourceManager", "ModuleManager", "GameLoopManager"];
    implementation_steps: {
      ResourceManager: [
        "✅ Implement BaseManager interface",
        "✅ Add consistent event emission",
        "✅ Standardize error handling",
        "✅ Add performance tracking",
      ];
      ModuleManager: [
        "✅ Implement BaseManager interface",
        "✅ Standardize event emission",
        "✅ Add dependency injection",
        "✅ Improve error handling",
      ];
    };
  };
  initialization: {
    sequence_implementation: "✅ Create a staged initialization process in App.tsx";
    dependency_graph: {
      ResourceManager: [];
      ModuleManager: ["ResourceManager"];
      ResourceFlowManager: ["ResourceManager"];
      GameLoopManager: ["ResourceManager", "ModuleManager"];
    };
  };
}
```

### Component: UIConnections

**Implementation ID**: `phase2.ui`

#### Current Implementation Status

- SystemIntegration component in `src/components/core/SystemIntegration.tsx` - partial implementation
- ResourceVisualization in `src/components/ui/ResourceVisualization.tsx` - requires standardized hook usage
- ResourceVisualizationEnhanced in `src/components/ui/ResourceVisualizationEnhanced.tsx` - incomplete integration
- ModuleStatusDisplay (missing connection to ModuleManager)
- GameHUD renders UI components but has incomplete context connections

#### Analysis Tasks

- Catalog UI component context usage
- Identify event subscription patterns
- Map action dispatch patterns
- Analyze data flow from backend to UI

#### Implementation Tasks

```typescript
interface UIConnectionTasks {
  context_usage: {
    standardized_hooks: {
      useResource: "Access resource data with selector pattern";
      useModule: "Access module data with selector pattern";
      useGameActions: "Dispatch game actions with type safety";
    };
    implementation_priority: ["useResource", "useModule", "useGameActions"];
  };
  event_subscriptions: {
    standard_pattern: "Use useEventSubscription hook with selector pattern";
    implementation_examples: {
      ResourceVisualization: "Subscribe to resource events for real-time updates";
      ModuleStatusDisplay: "Subscribe to module events for status changes";
      GameHUD: "Subscribe to game events for global state changes";
    };
  };
  component_updates: {
    priority_components: [
      "ResourceVisualization",
      "ModuleStatusDisplay",
      "GameHUD",
    ];
    implementation_steps: {
      ResourceVisualization: [
        "Refactor to use standardized hooks",
        "Implement event subscription",
        "Add memoization for performance",
        "Implement error boundary",
      ];
      ModuleStatusDisplay: [
        "Connect to ModuleManager via context",
        "Implement event subscription",
        "Add real-time updates",
      ];
    };
  };
}
```

### Component: GameLoop

**Implementation ID**: `phase2.gameloop`

#### Current Implementation Status

- GameLoopManager defined in `src/managers/game/GameLoopManager.ts` - partial implementation
- Update system in `src/initialization/gameSystemsIntegration.ts`
- ResourceFlowManager optimization not properly connected to game loop
- Missing central coordination for system updates

#### Analysis Tasks

- Identify current update mechanisms
- Map system update dependencies
- Analyze performance characteristics
- Document timing requirements

#### Implementation Tasks

```typescript
interface GameLoopTasks {
  central_implementation: {
    loop_manager: "Enhance GameLoopManager with priority-based scheduling";
    update_scheduling: "Implement multi-tier update scheduling based on priorities";
  };
  system_integration: {
    priority_systems: [
      "ResourceManager",
      "ModuleManager",
      "ResourceFlowManager",
    ];
    integration_pattern: {
      ResourceManager: "Register for high-priority updates";
      ModuleManager: "Register for medium-priority updates";
      ResourceFlowManager: "Register for low-priority optimization updates";
    };
  };
  performance: {
    optimization_strategies: [
      "Batch similar updates",
      "Skip unchanged components",
      "Implement time budgeting",
      "Add frame rate monitoring",
    ];
    monitoring_implementation: "Add performance monitoring to detect bottlenecks";
    comparison_functionality: {
      component: "OptimizationComparisonView";
      location: "src/components/ui/performance/OptimizationComparisonView.tsx";
      features: [
        "Side-by-side comparison of optimized/unoptimized modes",
        "Real-time performance metrics visualization",
        "Statistical analysis of optimization benefits",
        "A/B testing capabilities",
        "Mode switching between optimized, unoptimized, and comparison views",
        "Support for overlay and side-by-side visualization modes",
      ];
      integration_points: [
        "Integrates with AnimationFrameManager for performance profiling",
        "Provides standardized performance metrics collection",
        "Supplies statistical comparison data for optimization analysis",
      ];
    };
  };
}
```

## Phase 3: Module-by-Module Integration

### Component: ResourceModule

**Implementation ID**: `phase3.resources`

#### Current Implementation Status

- ResourceVisualization component in `src/components/ui/ResourceVisualization.tsx` - partial implementation
- ResourceRatesContext in `src/contexts/ResourceRatesContext.tsx` - missing ThresholdContext integration
- useResourceManagement hook in `src/hooks/resources/useResourceManagement.tsx` - needs standardization
- ThresholdContext implementation missing

#### Implementation Tasks

```typescript
interface ResourceModuleIntegrationTasks {
  ui_refactoring: {
    component_list: [
      "ResourceVisualization",
      "ResourceVisualizationEnhanced",
      "ResourceEventMonitor",
    ];
    hook_implementations: {
      useResource: "Standardized hook for resource data access";
      useResourceRates: "Hook for production/consumption rates";
      useResourceThresholds: "Hook for threshold monitoring";
    };
  };
  event_subscriptions: {
    subscription_implementations: {
      ResourceVisualization: "Subscribe to RESOURCE_UPDATED, RESOURCE_THRESHOLD_CHANGED";
      ResourceEventMonitor: "Subscribe to all resource events with filtering";
      ResourceManager: "Emit standardized events for all resource changes";
    };
  };
  testing: {
    integration_tests: [
      "ResourceVisualization renders correct data",
      "ResourceVisualization updates on ResourceManager changes",
      "ThresholdContext triggers alerts on threshold violations",
    ];
    test_implementation: {
      ResourceVisualization: "Test component rendering and updates";
      ThresholdIntegration: "Test threshold monitoring and alerts";
    };
  };
  documentation: {
    pattern_documentation: "Document resource component patterns and best practices";
    developer_guides: [
      "Resource system integration guide",
      "Threshold monitoring guide",
      "Resource visualization best practices",
    ];
  };
}
```

### Component: ModuleSystem

**Implementation ID**: `phase3.modules`

#### Current Implementation Status

- ✅ ModuleManager refactored in `src/managers/module/ModuleManager.ts` to implement BaseManager
- ✅ ModuleContext in `src/contexts/ModuleContext.tsx` connected to ModuleManager with event subscriptions
- ✅ Module components implemented in `src/components/ui/modules/` directory:
  - ✅ ModuleCard component for displaying module information
  - ✅ ModuleGrid component for showing and filtering modules
  - ✅ ModuleUpgradeVisualization component for visualizing the upgrade process
- ✅ ModuleStatusManager and ModuleUpgradeManager integrated with the standardized patterns
- ✅ Comprehensive integration tests created in `src/tests/integration/ModuleSystemIntegration.test.tsx`

#### Implementation Tasks

```typescript
interface ModuleSystemIntegrationTasks {
  ui_refactoring: {
    component_list: [
      "ModuleHUD",
      "ModuleStatusDisplay",
      "ModuleUpgradeDisplay",
    ];
    hook_implementations: {
      useModule: "✅ Hook for accessing module data";
      useModuleActions: "✅ Hook for module actions";
      useModuleEvents: "✅ Hook for module event subscription";
    };
  };
  event_subscriptions: {
    subscription_implementations: {
      ModuleStatusDisplay: "✅ Subscribe to MODULE_STATUS_CHANGED, MODULE_UPDATED";
      ModuleUpgradeDisplay: "✅ Subscribe to MODULE_UPGRADED, MODULE_UPGRADE_AVAILABLE";
      ModuleHUD: "✅ Subscribe to MODULE_CREATED, MODULE_DESTROYED";
    };
  };
  testing: {
    integration_tests: [
      "✅ ModuleStatusDisplay updates on status changes",
      "✅ ModuleUpgradeDisplay shows correct upgrade options",
      "✅ ModuleHUD correctly renders available modules",
    ];
    test_implementation: {
      ModuleStatusDisplay: "✅ Test status updates and rendering";
      ModuleUpgradeSystem: "✅ Test upgrade path calculation and application";
    };
  };
  documentation: {
    pattern_documentation: "✅ Document module system integration patterns";
    developer_guides: [
      "✅ Module system integration guide",
      "✅ Module upgrades implementation guide",
      "✅ Module status monitoring guide",
    ];
  };
}
```

#### Key Integration Points

The Module System now provides the following integration points:

1. **UI Components to ModuleManager**:
   - Components connect directly to the ModuleManager through event subscriptions
   - The ModuleCard component displays module information and provides controls
   - The ModuleGrid component allows filtering and sorting of modules
   - The ModuleUpgradeVisualization component shows upgrade progress

2. **Event-Based Communication**:
   - Module components subscribe to module events using the standardized useEventSubscription hook
   - Components automatically update when module state changes
   - Event subscriptions are cleaned up on component unmount

3. **Integration Tests**:
   - Comprehensive tests verify the integration between UI components and the ModuleManager
   - Tests check the end-to-end flow from module selection to upgrading
   - Performance monitoring is included to detect rendering issues

### Component: ExplorationSystem

**Implementation ID**: `phase3.exploration`

#### Current Implementation Status

- ExplorationManager partially implemented
- DataAnalysisSystem component in `src/components/exploration/DataAnalysisSystem.tsx`
- DataAnalysisContext in `src/contexts/DataAnalysisContext.tsx`
- DiscoveryClassification component incomplete
- Missing connection between ExplorationManager and DataAnalysisSystem

#### Implementation Tasks

```typescript
interface ExplorationSystemIntegrationTasks {
  ui_refactoring: {
    component_list: [
      "DataAnalysisSystem",
      "DiscoveryClassification",
      "ResourcePotentialVisualization",
    ];
    hook_implementations: {
      useExploration: "Hook for exploration data";
      useDataAnalysis: "Hook for data analysis features";
      useDiscovery: "Hook for discovery classification";
    };
  };
  event_subscriptions: {
    subscription_implementations: {
      DataAnalysisSystem: "Subscribe to ANALYSIS_COMPLETED, DATA_UPDATED";
      DiscoveryClassification: "Subscribe to DISCOVERY_CLASSIFIED, NEW_DISCOVERY";
      ResourcePotentialVisualization: "Subscribe to RESOURCE_POTENTIAL_UPDATED";
    };
  };
  testing: {
    integration_tests: [
      "DataAnalysisSystem processes data correctly",
      "DiscoveryClassification categorizes discoveries properly",
      "ResourcePotentialVisualization shows accurate potential",
    ];
    test_implementation: {
      DataAnalysisSystem: "Test analysis algorithms and visualization";
      ExplorationManager: "Test exploration coordination and discovery";
    };
  };
  documentation: {
    pattern_documentation: "Document exploration system integration patterns";
    developer_guides: [
      "Exploration system integration guide",
      "Data analysis implementation guide",
      "Discovery classification guide",
    ];
  };
}
```

## Phase 4: Performance Optimization and QA

### Component: PerformanceOptimization

**Implementation ID**: `phase4.performance`

#### Current Implementation Status

- Performance monitoring utilities partially implemented
- ResourceFlowManager optimization initiated with caching and batch processing
- Performance benchmarks started for ResourceFlowManager and EventSystem
- React component optimizations begun with selective memoization
- UI virtualization needed for large data sets

#### Implementation Tasks

```typescript
interface PerformanceOptimizationTasks {
  monitoring: {
    critical_systems: ["ResourceFlowManager", "GameLoopManager", "EventSystem"];
    monitoring_implementation: "Implement comprehensive performance monitoring system";
    benchmarking_tools: {
      ResourceFlowManager: "Extend ResourceFlowManager.benchmark.ts with more comprehensive test scenarios";
      EventSystem: "Create automated detection of performance regressions";
      MemoryUsage: "Add memory usage analysis to all benchmark tools";
      UI: "Create visual dashboard for performance test results";
    };
  };
  profiling: {
    key_operations: [
      "Resource flow optimization",
      "Event distribution",
      "UI rendering",
    ];
    profiling_implementation: "Create performance profiling tools for key operations";
    visualization: "Implement visual profiling reports with performance trends over time";
  };
  optimization: {
    target_areas: {
      ResourceFlowManager: "Optimize flow calculation algorithm";
      EventSystem: "Implement event batching and prioritization";
      Rendering: "Implement React.memo and useMemo for expensive components";
    };
    implementation_strategies: {
      ResourceFlowManager: [
        "Implement Web Worker offloading for large networks",
        "Add spatial partitioning optimization for geographical networks",
        "Convert optimization process to use async/await pattern",
        "Implement predictive optimization based on trends",
      ];
      EventSystem: [
        "Create EventPrioritizer utility class",
        "Implement time-based event batching with RxJS",
        "Add priority queue for critical events",
        "Develop event throttling for UI updates",
      ];
      Rendering: [
        "Audit all components for unnecessary re-renders",
        "Apply React.memo to pure components",
        "Implement useMemo for expensive calculations",
        "Add useCallback for handler functions passed as props",
        "Integrate react-window for resource lists",
        "Add virtualized scrolling for event logs",
        "Implement infinite loading pattern for large datasets",
        "Create custom virtualization for specialized components",
      ];
    };
  };
  benchmarks: {
    benchmark_implementations: {
      ResourceFlow: "Benchmark resource flow optimization with varying node counts";
      EventProcessing: "Benchmark event processing with high event volumes";
      RenderPerformance: "Benchmark component rendering with complex state";
    };
    automated_testing: {
      PerformanceBudgets: "Set up performance budgets for key operations";
      CI_Integration: "Configure CI/CD pipeline for performance testing";
      RegressionAlerts: "Implement workflow for performance regression alerts";
      VisualReports: "Create visual performance regression reports";
    };
    success_criteria: {
      ResourceFlow: 5000; // Process 5000 nodes in < 16ms
      EventProcessing: 1000; // Process 1000 events in < 16ms
      RenderPerformance: 60; // Maintain 60 FPS with full UI
    };
  };
}
```

### Component: TestingQA

**Implementation ID**: `phase4.testing`

#### Current Implementation Status

- Unit tests for key components exist but integration test coverage is lacking
- ResourceFlowManager.test.ts and ModuleManager.test.ts implemented
- Missing system boundary tests
- No automated architectural validation

## Component Registration System

**Implementation ID**: `phase2.ui.componentRegistry`

### Current Implementation Status

- Fully implemented with core services and hooks in place
- ComponentRegistryService in `src/services/ComponentRegistryService.ts` - implements centralized component tracking system
- useComponentRegistration hook in `src/hooks/ui/useComponentRegistration.ts` - provides React integration for components
- useComponentLifecycle hook in `src/hooks/ui/useComponentLifecycle.ts` - manages component lifecycle and event subscriptions
- ResourceDisplay component in `src/components/ui/resource/ResourceDisplay.tsx` - example implementation
- ResourceRegistrationDemo in `src/components/ui/resource/ResourceRegistrationDemo.tsx` - demonstration component
- ResourceVisualizationEnhanced in `src/components/ui/resource/ResourceVisualizationEnhanced.tsx` - enhanced resource visualization using the component registration system

### Architecture

```typescript
interface ComponentRegistrationSystem {
  services: {
    ComponentRegistryService: {
      purpose: "Centralized tracking of all UI components";
      capabilities: [
        "Component registration and unregistration",
        "Event subscription management",
        "Performance metrics tracking",
        "Component lookup by ID, type, and event subscription",
      ];
      connections: [
        {
          to: "EventPropagationService";
          connection_type: "event_distribution";
        },
        { to: "React UI Components"; connection_type: "registration_hooks" },
      ];
    };
  };

  hooks: {
    useComponentRegistration: {
      purpose: "Register React components with the registry";
      parameters: {
        type: "Component type identifier";
        eventSubscriptions: "Array of event types the component listens to";
        updatePriority: "Priority level for updates (high, medium, low)";
      };
      return: "Component ID for tracking";
    };

    useComponentLifecycle: {
      purpose: "Manage component lifecycle and event subscriptions";
      capabilities: [
        "Mount/unmount event handling",
        "Automatic event subscription setup and cleanup",
        "Performance tracking integration",
      ];
    };
  };

  demo_components: {
    ResourceDisplay: "Example implementation of registration pattern";
    ResourceRegistrationDemo: "Demo UI for showcasing registry capabilities";
  };
}
```

### Integration Points

The Component Registration System establishes the following key integration points:

1. **UI Components to Events System**:
   - Components register their interest in specific events
   - Event propagation is optimized to only notify relevant components
   - Automatic cleanup on component unmount prevents memory leaks

2. **Performance Monitoring**:
   - Tracks component render counts and render times
   - Identifies components exceeding performance thresholds
   - Provides aggregated performance reports

3. **Centralized Component Management**:
   - Maintains registry of all active UI components
   - Tracks component types and counts
   - Enables component lookup by various criteria

### Implementation Details

```typescript
interface ComponentMetadata {
  id: string; // Unique identifier for the component
  type: string; // Component type (e.g., 'ResourceDisplay')
  eventSubscriptions: string[]; // Events this component is interested in
  updatePriority: "high" | "medium" | "low"; // Priority for updates

  // Performance metrics
  renderCount?: number;
  averageRenderTime?: number;
  totalRenderTime?: number;
  lastUpdated?: number;
}

// Registry methods
interface ComponentRegistry {
  registerComponent(metadata: ComponentMetadata): () => void;
  getComponentsByEvent(eventType: string): ComponentMetadata[];
  updateComponentMetrics(id: string, renderTime: number): void;
  getAllComponents(): ComponentMetadata[];
  getComponentById(id: string): ComponentMetadata | undefined;
  getComponentsByType(type: string): ComponentMetadata[];
  getPerformanceReport(): PerformanceReport;
  notifyComponentsOfEvent(eventType: string, eventData: unknown): void;
}

// Hook implementations
function useComponentRegistration(
  options: ComponentRegistrationOptions,
): string;
function useComponentLifecycle(options: ComponentLifecycleOptions): void;
```

### Usage Pattern

```tsx
// Example component implementation using the registration system
const ExampleComponent: React.FC = () => {
  // Register with the component registry
  const componentId = useComponentRegistration({
    type: "ExampleComponent",
    eventSubscriptions: ["EXAMPLE_EVENT_TYPE", "ANOTHER_EVENT_TYPE"],
    updatePriority: "medium",
  });

  // Set up lifecycle and event handlers
  useComponentLifecycle({
    onMount: () => console.log("Component mounted"),
    onUnmount: () => console.log("Component unmounted"),
    eventSubscriptions: [
      {
        eventType: "EXAMPLE_EVENT_TYPE",
        handler: (event) => handleExampleEvent(event),
      },
    ],
  });

  // Component implementation
  return <div>Example Component</div>;
};
```

### Next Implementation Steps

1. Apply the component registration pattern to core UI components:
   - ResourceVisualization ✅ (Implemented in ResourceVisualizationEnhanced)
   - ModuleStatusDisplay
   - GameHUD

2. Enhance the system with:
   - Automated performance monitoring and reporting
   - Event subscription optimization
   - Component rendering optimization based on metrics

3. Create comprehensive documentation and developer guides for adopting the pattern

## Success Metrics and Verification

```json
{
  "type_safety": {
    "metrics": [
      {
        "name": "TypeScript Error Reduction",
        "target": "90% reduction in TypeScript errors",
        "measurement": "Compiler error count before vs. after"
      },
      {
        "name": "Any Type Reduction",
        "target": "95% reduction in 'any' type usage",
        "measurement": "Count of 'any' types before vs. after"
      }
    ]
  },
  "component_connections": {
    "metrics": [
      {
        "name": "UI-Backend Connection",
        "target": "100% of UI components properly connected",
        "measurement": "Static analysis of component-context connections"
      },
      {
        "name": "State Update Reliability",
        "target": "Zero stale state issues",
        "measurement": "Automated tests for state propagation"
      }
    ]
  },
  "code_quality": {
    "metrics": [
      {
        "name": "Test Coverage",
        "target": "85% test coverage for critical systems",
        "measurement": "Test coverage reports"
      },
      {
        "name": "Pattern Consistency",
        "target": "95% adherence to standardized patterns",
        "measurement": "Static analysis of pattern usage"
      }
    ]
  },
  "performance": {
    "metrics": [
      {
        "name": "Rendering Performance",
        "target": "60 FPS for complex UI components",
        "measurement": "Performance profiling"
      },
      {
        "name": "Resource Flow Optimization",
        "target": "50% reduction in computation time",
        "measurement": "Benchmark comparisons"
      }
    ]
  }
}
```

### Component Updates

#### UI Components

The following UI components have been migrated to use the standardized resource types:

- **ResourceManagementDashboard**
  - Uses ResourceType enum for type references
  - Uses ResourceTypeHelpers for display name generation
- **ResourceFlowDiagram**
  - Updated to use ResourceType enum for node and connection resource types
  - Uses standardized interfaces for network nodes and links
- **ResourceThresholdVisualization**
  - Updated to use ResourceType enum for resource identification
  - Uses ResourceTypeHelpers for UI display names
- **ResourceVisualizationEnhanced**
  - Updated resource mappings to use ResourceType enum
  - Improved type safety in resource displays
- **ResourceForecastingVisualization**
  - Uses ResourceType enum for resource types
  - Improved forecast calculations with standardized types
- **ResourceOptimizationSuggestions**
  - Updated suggestion filtering to use ResourceType enum
  - Improved type handling for optimization suggestions

#### Context Providers

Context providers have been updated to use standardized resource types:

- **ResourceRatesContext**
  - Updated from string-based CoreResourceType to ResourceType enum
  - Added compatibility layer for legacy string-based resource references
  - Improved type-safety in rate calculation methods
- **ThresholdContext**
  - Updated Resource interface to use ResourceType enum
  - Improved consistency in threshold management

#### Mining System Integration

The mining system components have been updated to use standardized resource types:

- **MiningTypes.ts**
  - Updated `MiningResource` interface to use ResourceType enum instead of string literals
  - Added new `MiningShip` interface for consistent type definitions
  - Standardized property naming conventions

- **MineralProcessingCentre.tsx**
  - Updated to use ResourceType enum for resource identification
  - Improved type safety in resource processing logic

- **MiningControls.tsx**
  - Replaced string literal comparisons with ResourceType enum values
  - Fixed type inconsistencies in conditional rendering based on resource types
  - Improved UI consistency for different resource types

- **MiningMap.tsx**
  - Updated to use the standardized MiningResource type
  - Enhanced type safety in resource mapping functions

- **ThresholdManager and ThresholdIntegration**
  - Updated to handle ResourceType enum values
  - Fixed type compatibility issues with threshold monitoring

### Type Migration Strategy

The standardized type system has been successfully integrated into all resource-related components:

1. **Core System Components:**
   - ResourceFlowManager has been updated to use the standardized types
   - String literal types have been replaced with enums
   - ResourceStateClass is used for state management

2. **UI Components:**
   - All UI components have been updated to use standardized types
   - Component-specific helpers use ResourceTypeHelpers for display

3. **Context Providers:**
   - Context providers now use ResourceType enum for improved type-safety
   - Backward compatibility maintained for interoperating with legacy code

4. **Mining System:**
   - Mining components updated to use ResourceType enum
   - Type inconsistencies resolved across the mining subsystem
   - String literal comparisons replaced with type-safe enum comparisons

5. **Backward Compatibility:**
   - ResourceTypeString type for string literal compatibility
   - ResourceTypeHelpers.stringToEnum for string to enum conversion
   - ResourceStateClass.fromResourceState for legacy state conversion

### Implementation Fixes and Progress

Recent fixes focused on resolving type inconsistencies in the mining system:

1. **Type Comparison Issues:**
   - Fixed type comparison errors in MiningControls.tsx by replacing string literal comparisons with enum values
   - Updated conditional rendering logic to use ResourceType enum values throughout

2. **Interface Standardization:**
   - Updated MiningResource interface in MiningTypes.ts to use ResourceType enum
   - Added MiningShip interface to centralize type definitions
   - Standardized property access patterns across mining components

3. **Integration Consistency:**
   - Fixed TypeScript errors related to incompatible comparisons between enum and string types
   - Ensured consistent enum usage across mining and resource management subsystems
   - Maintained backward compatibility where needed through helper methods

4. **Testing Strategy:**
   - Using existing tests in src/tests/managers/resource/ResourceFlowManager.test.ts to verify changes
   - Reviewing console output for type errors after each component update
   - Ensuring all components render correctly with the updated types

## Core Systems

### Exploration System

```json
{
  "id": "exploration_system",
  "version": "1.0.0",
  "description": "System for space exploration, discovery and analysis",
  "components": [
    {
      "id": "exploration_manager",
      "type": "manager",
      "implementation_status": "complete",
      "file_path": "src/managers/exploration/ExplorationManager.ts",
      "description": "Central manager for exploration operations, sector discovery, and anomaly detection",
      "implements": ["BaseManager"],
      "connections": [
        {
          "to": "event_bus",
          "type": "publishes_events",
          "events": [
            "SECTOR_DISCOVERED",
            "ANOMALY_DETECTED",
            "RESOURCE_DETECTED",
            "SCAN_STARTED",
            "SCAN_COMPLETED"
          ]
        },
        {
          "to": "recon_ship_manager",
          "type": "uses_service",
          "description": "Coordinates ship assignments with scan operations"
        },
        {
          "to": "data_analysis_context",
          "type": "provides_data",
          "description": "Exploration data is consumed by analysis system"
        }
      ]
    },
    {
      "id": "recon_ship_manager",
      "type": "manager",
      "implementation_status": "complete",
      "file_path": "src/managers/exploration/ReconShipManagerImpl.ts",
      "description": "Manages reconnaissance ships for exploration operations",
      "connections": [
        {
          "to": "exploration_manager",
          "type": "provides_service",
          "description": "Handles ship operations requested by ExplorationManager"
        }
      ]
    },
    {
      "id": "data_analysis_context",
      "type": "context_provider",
      "implementation_status": "complete",
      "file_path": "src/contexts/DataAnalysisContext.tsx",
      "description": "Context provider for analysis of exploration data, automatically processes discoveries",
      "connections": [
        {
          "to": "exploration_manager",
          "type": "subscribes_to_events",
          "events": [
            "SECTOR_DISCOVERED",
            "ANOMALY_DETECTED",
            "RESOURCE_DETECTED"
          ]
        },
        {
          "to": "data_analysis_system",
          "type": "provides_context",
          "description": "Supplies processed exploration data to UI"
        }
      ]
    },
    {
      "id": "data_analysis_system",
      "type": "ui_component",
      "implementation_status": "complete",
      "file_path": "src/components/exploration/DataAnalysisSystem.tsx",
      "description": "UI component for visualizing and analyzing exploration data",
      "connections": [
        {
          "to": "data_analysis_context",
          "type": "consumes_context",
          "description": "Displays analysis of exploration discoveries"
        },
        {
          "to": "exploration_manager",
          "type": "retrieves_metadata",
          "description": "Shows real-time exploration statistics"
        }
      ]
    },
    {
      "id": "discovery_classification",
      "type": "ui_component",
      "implementation_status": "planned",
      "file_path": "src/components/exploration/DiscoveryClassification.tsx",
      "description": "Component for classification of anomalies and resources",
      "connections": [
        {
          "to": "data_analysis_context",
          "type": "consumes_context",
          "description": "Uses analysis data for classification algorithms"
        }
      ]
    }
  ],
  "integration_points": [
    {
      "from": "exploration_system",
      "to": "resource_system",
      "type": "data_flow",
      "description": "Discovered resources are added to the resource system for extraction and processing",
      "status": "implemented"
    },
    {
      "from": "exploration_system",
      "to": "tech_system",
      "type": "data_flow",
      "description": "Anomalies may unlock new research opportunities in the tech system",
      "status": "planned"
    }
  ]
}
```

### Exploration System Integration Details

The Exploration System has been integrated with the core architecture following standardized patterns:

#### Manager Implementation

The ExplorationManager implements the BaseManager interface to provide consistent behavior with other system managers:

1. **Lifecycle Management**: Implements `initialize()`, `update()`, and `dispose()` methods for standard lifecycle
2. **Event Communication**: Uses the EventBus for publishing standardized events
3. **Dependency Management**: Receives dependencies through the ServiceRegistry
4. **Performance Monitoring**: Exposes statistics through the getMetadata() interface

```typescript
/**
 * ExplorationManager extends AbstractBaseManager to integrate with the core systems
 * - Implements standardized lifecycle methods
 * - Uses EventBus for event-based communication
 * - Provides performance metrics
 */
export class ExplorationManager extends AbstractBaseManager<BaseEvent> {
  constructor(
    eventBus: EventBus<BaseEvent>,
    shipManager: ReconShipManagerImpl,
  ) {
    super("ExplorationManager", eventBus);
    this.shipManager = shipManager;
  }

  // Lifecycle methods
  protected async onInitialize(
    dependencies?: Record<string, unknown>,
  ): Promise<void> {
    // Initialization logic with dependency injection
    this.subscribeToEvent(
      EventType.STATUS_CHANGED,
      this.handleShipStatusChange,
    );
  }

  protected onUpdate(deltaTime: number): void {
    // Update logic for active scan operations
    this.updateScanOperations(deltaTime);
  }

  // Event publishing
  private completeScanOperation(operationId: string): void {
    // Operation completion logic
    this.publishEvent(
      this.createEvent(ExplorationEvents.SCAN_COMPLETED, {
        sector,
        operation,
      }),
    );
  }
}
```

#### Context Provider Integration

The DataAnalysisContext connects with the ExplorationManager through event subscriptions:

1. **Automated Dataset Creation**: Automatically creates datasets from exploration events
2. **Data Transformation**: Converts exploration entities to standardized DataPoints
3. **Type Safety**: Uses strongly-typed interfaces for all data transformations
4. **Resource Optimization**: Implements efficient data storage and retrieval

```typescript
/**
 * DataAnalysisContext integrates with ExplorationManager through event subscriptions
 * - Creates datasets automatically from exploration events
 * - Provides custom hooks for UI components
 */
export const DataAnalysisProvider: React.FC<DataAnalysisProviderProps> = ({
  children,
  initialDatasets = [],
  initialAnalysisConfigs = [],
  initialAnalysisResults = [],
}) => {
  // Event subscriptions
  useEffect(() => {
    // Subscribe to exploration events
    const unsubscribeSector = explorationManager.subscribeToEvent(
      asEventType(ExplorationEvents.SECTOR_DISCOVERED),
      handleSectorDiscovered
    );

    // More subscriptions...

    // Cleanup
    return () => {
      unsubscribeSector();
      // More unsubscriptions...
    };
  }, [dependencies]);

  // Context value
  const contextValue: DataAnalysisContextType = {
    // Context data and methods...
  };

  return <DataAnalysisContext.Provider value={contextValue}>{children}</DataAnalysisContext.Provider>;
};
```

#### UI Component Integration

The DataAnalysisSystem UI component integrates with the ExplorationManager through the DataAnalysisContext:

1. **Real-time Data Display**: Shows live exploration statistics
2. **Automatic Updates**: Periodically refreshes data from ExplorationManager
3. **Dataset Visualization**: Displays datasets generated from exploration events
4. **Interaction Patterns**: Follows standardized UI patterns for consistency

```typescript
/**
 * DataAnalysisSystem integrates with exploration data through:
 * - DataAnalysisContext for datasets and analysis results
 * - ExplorationManager.getMetadata() for statistics
 */
export function DataAnalysisSystem({ className = '' }: DataAnalysisSystemProps) {
  // Context usage
  const {
    datasets,
    analysisConfigs,
    analysisResults,
    // More context values...
  } = useDataAnalysis();

  // Get exploration-specific datasets
  const explorationDatasets = React.useMemo(() => {
    return datasets.filter(dataset =>
      ['sectors', 'anomalies', 'resources'].includes(dataset.source)
    );
  }, [datasets]);

  // Statistics update
  React.useEffect(() => {
    const updateStats = () => {
      const stats = explorationManager.getMetadata().stats || {};
      setExplorationStats({
        // Mapping stats...
      });
    };

    // Update interval
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Render UI with exploration data
  return (
    // Component JSX...
  );
}
```

### Planned Integration Enhancements

Future integration work for the Exploration System includes:

1. **Resource System Integration**: Connect discovered resources to the resource extraction system
2. **Technology System Integration**: Link anomalies to the research and technology tree
3. **Mission System Integration**: Generate exploration missions based on discovered sectors
4. **Ship Management Integration**: Enhance ship assignment and management capabilities
5. **Classification Algorithm Integration**: Implement AI-based classification of discoveries

## Context Implementation

### Current Implementation

We have moved away from using the `createStandardContext` utility to a direct React context implementation using hooks. This approach:

1. Eliminates circular dependencies that were causing issues in tests
2. Provides more control over context creation and subscription management
3. Improves type safety and reduces reliance on utility functions

The contexts that have been refactored to use this new pattern are:

- ResourceRatesContext
- GameContext

### Benefits of the New Pattern

- No circular dependencies between contexts and their consumers
- Better test compatibility with mocking frameworks
- Improved type safety with explicit state and action types
- More explicit control over subscriptions and event handling
- Easier to understand and maintain

### Integration with Managers

The new context pattern maintains the same integration with managers as before:

- Managers are passed to the context provider as props
- The context subscribes to manager events and updates state accordingly
- Actions in the context can trigger manager methods
- The manager is included in the context value for direct access when needed

### Event Handling

Event handling has been improved with:

- Better type safety for event subscriptions
- Safer cleanup of event subscriptions
- More explicit error handling for subscription failures

### Future Improvements

- Fix type compatibility issues between different event type systems
- Standardize this pattern across all contexts
- Create better documentation for how to properly test these contexts
- Improve error handling and logging for context operations

## Success Metrics and Verification

````json
{
  "type_safety": {
    "metrics": [
      {
        "name": "TypeScript Error Reduction",
        "target": "90% reduction in TypeScript errors",
        "measurement": "Compiler error count before vs. after"
      },
      {
        "name": "Any Type Reduction",
        "target": "95% reduction in 'any' type usage",
        "measurement": "Count of 'any' types before vs. after"
      }
    ]
  },
  "component_connections": {
    "metrics": [
      {
        "name": "UI-Backend Connection",
        "target": "100% of UI components properly connected",
        "measurement": "Static analysis of component-context connections"
      },
      {
        "name": "State Update Reliability",
# CURSOR SYSTEM INTEGRATION FILE

## PROPERLY UTILIZING THE ARCHITECTURE DOCUMENTATION

This file documents the current state of the system architecture. It serves as a comprehensive reference for all system components, their relationships, and implementation status. When analyzing the codebase, refer to this document to understand the intended architecture, identify gaps between the current implementation and the architectural vision, and determine what connections need to be established or fixed. This document represents the `source of truth` for system architecture decisions and should inform all implementation work.

## USAGE INSTRUCTIONS FOR IMPLEMENTATION

When working with this architectural documentation:

1. Reference specific components using their unique identifiers to ensure precise communication about system elements
2. Parse all JSON objects and TypeScript interfaces as structured specifications that define the intended implementation
3. When implementing a component, first analyze the relevant codebase files to understand current implementation status
4. Fill in any placeholder values in the interfaces with concrete code implementations that align with architectural standards
5. Present implementation suggestions with specific code examples that follow the architectural patterns
6. Generate actionable code that fulfills the requirements specified in each component section

The document serves as a comprehensive blueprint for the system architecture, with each section containing machine-readable specifications that guide implementation decisions. I will maintain consistency with these specifications when suggesting code changes or additions.

## IMPLEMENTATION APPROACH

When suggesting implementations based on this document, I will:

1. First identify the component and its connections in the architecture specification
2. Reference the implementation status to understand what needs to be built or modified
3. Follow the specified connection patterns when implementing component relationships
4. Ensure new code aligns with the architectural patterns defined in the document
5. Address any identified issues or missing connections with solutions that conform to the architecture

This approach ensures that all implementation work contributes to a cohesive system that matches the intended architecture while addressing the current state of the codebase.

## System Overview

```json
{
  "project": "Galactic Sprawl",
  "current_issues": ["UI-backend disconnection", "Inconsistent type usage", "Architectural drift"],
  "goal": "Transform codebase into maintainable, scalable system with clear architectural boundaries"
}
````

## Reference Documents

```json
{
  "reference_architecture": [
    "System Integration Map",
    "System Architecture Diagrams"
  ],
  "priority": "Implement connections depicted in diagrams while standardizing patterns"
}
```

## Implementation Timeline

```json
{
  "phases": [
    {
      "id": "phase1",
      "name": "Foundation and Analysis",
      "duration": "2 weeks",
      "components": ["ResourceSystem", "EventSystem", "ContextProviders"]
    },
    {
      "id": "phase2",
      "name": "Core System Implementation",
      "duration": "4 weeks",
      "components": ["ManagerServices", "UIConnections", "GameLoop"]
    },
    {
      "id": "phase3",
      "name": "Module-by-Module Integration",
      "duration": "6 weeks",
      "components": ["ResourceModule", "ModuleSystem", "ExplorationSystem"]
    },
    {
      "id": "phase4",
      "name": "Performance Optimization and QA",
      "duration": "2 weeks",
      "components": ["PerformanceOptimization", "TestingQA"]
    }
  ]
}
```

## Phase 1: Foundation and Analysis

### Component: ResourceSystem

**Implementation ID**: `phase1.resource`

#### Current Implementation Status

- Located primarily in `src/managers/game/ResourceManager.ts` and `src/managers/resource/ResourceFlowManager.ts`
- ResourceManager: Manages resources with production/consumption tracking, but lacks consistent event emission
- ResourceFlowManager: Handles resource optimization but has limited integration with UI
- ResourceIntegration: Located in `src/hooks/resources/useResourceManagement.tsx` - creates singleton connection
- Missing connections between ResourceVisual UI components and ResourceRatesContext

#### Analysis Tasks

- Parse ResourceFlowManager implementation against architecture diagram
- Identify type discrepancies using TypeScript compiler API
- Map event handling patterns and component connection gaps
- Generate report on architectural compliance

#### Implementation Tasks

```typescript
interface ResourceImplementationTasks {
  type_standardization: {
    target_files: [
      "src/types/resources/ResourceTypes.ts",
      "src/managers/game/ResourceManager.ts",
      "src/managers/resource/ResourceFlowManager.ts",
    ];
    type_definitions: {
      resources: string; // Core resource type definitions with strict typing
      nodes: string; // Resource node type definitions
      flows: string; // Flow connection type definitions
    };
  };
  connection_implementation: {
    missing_connections: [
      {
        from: "ResourceManager";
        to: "GameContext";
        connection_type: "event-driven";
      },
      {
        from: "ResourceRatesContext";
        to: "ResourceVisual";
        connection_type: "hook-based";
      },
      {
        from: "ResourceManager";
        to: "ThresholdContext";
        connection_type: "middleware";
      },
    ];
    implementation_priority: [1, 2, 3]; // Connection implementation order
  };
  event_standardization: {
    event_types: [
      "RESOURCE_PRODUCED",
      "RESOURCE_CONSUMED",
      "RESOURCE_TRANSFERRED",
      "RESOURCE_THRESHOLD_REACHED",
    ];
    emission_points: [
      "ResourceManager.addResource()",
      "ResourceManager.subtractResource()",
      "ResourceManager.transferResource()",
      "ResourceThresholdManager.checkThresholds()",
    ];
    subscription_patterns: "Use moduleEventBus.subscribe() with cleanup on component unmount";
  };
}
```

### Component: EventSystem

**Implementation ID**: `phase1.events`

#### Current Implementation Status

- ✅ Core event system standardized with proper type definitions in `src/lib/events/EventTypes.ts`
- ✅ EventBus base class implemented in `src/lib/events/EventBus.ts` with memory management and performance monitoring
- ✅ ModuleEventBus updated in `src/lib/modules/ModuleEvents.ts` to extend standardized EventBus
- ✅ Standardized event subscription hook in `src/lib/events/useEventSubscription.ts`
- ✅ Event batching implemented in `src/lib/events/EventBatcher.ts` for performance optimization
- ✅ Developer tools created in `src/lib/events/EventDevTools.ts` for debugging and monitoring
- ✅ UI components updated to use standardized event subscription patterns

#### Analysis Tasks

- ✅ Compare ModuleEventBus implementation with architecture documentation
- ✅ Catalog event subscription patterns across UI components
- ✅ Identify subscription cleanup issues
- ✅ Map event emission patterns in manager services

#### Implementation Tasks

```typescript
interface EventSystemTasks {
  standardization: {
    event_type_definitions: "✅ Create standardized event interfaces with strict typing";
    subscription_utilities: "✅ Implement useEventSubscription hook with automated cleanup";
    memory_leak_prevention: {
      tracking_mechanism: "✅ Track subscriptions by component or hook instance ID";
      cleanup_pattern: "✅ Use useEffect cleanup function to unsubscribe";
    };
  };
  implementation_order: [
    "✅ Standardize event type definitions",
    "✅ Implement subscription utilities",
    "✅ Enhance EventDispatcher with standardized hooks",
    "✅ Refactor UI components to use standardized patterns",
    "✅ Add memory leak detection in development mode",
  ];
}
```

### Component: ContextProviders

**Implementation ID**: `phase1.contexts`

#### Current Implementation Status

- ✅ BaseContext template created in `src/lib/contexts/BaseContext.tsx` providing standardized context pattern
- ✅ Context provider template includes error handling, loading states, and performance optimization
- ✅ Context selector pattern implemented for preventing unnecessary re-renders
- ✅ Standard connection pattern to manager services via middleware
- ✅ Automatic event subscription handling with cleanup
- Partial implementation of GameContext in `src/contexts/GameContext.tsx` - needs refactoring to BaseContext
- Partial implementation of ResourceRatesContext in `src/contexts/ResourceRatesContext.tsx` - needs refactoring
- ThresholdContext in `src/contexts/ThresholdContext.tsx` - connections to ResourceManager implemented
- Partial implementation of ModuleContext in `src/contexts/ModuleContext.tsx` - needs refactoring

#### Analysis Tasks

- ✅ Analyze existing context provider implementations
- ✅ Identify state management patterns
- ✅ Map context-to-manager connections
- ✅ Assess render optimization opportunities

#### Implementation Tasks

```typescript
interface ContextStandardizationTasks {
  template_creation: {
    context_template: "✅ Create a standard context provider pattern with consistent API";
    connection_pattern: "✅ Implement standard manager-context connection via middleware";
  };
  refactoring: {
    priority_contexts: [
      "GameContext",
      "ResourceRatesContext",
      "ThresholdContext",
      "ModuleContext",
    ];
    implementation_steps: [
      "✅ Extract common context provider patterns",
      "✅ Create standard reducer pattern",
      "✅ Implement manager connection middleware",
      "✅ Standardize event subscription",
      "✅ Add memoization for performance",
    ];
  };
  consumer_updates: {
    patterns: "✅ Use context selectors to prevent unnecessary re-renders";
    hook_implementations: [
      "🔄 useGame() with selector pattern",
      "🔄 useResourceRates() with selector pattern",
      "✅ useThresholds() with selector pattern",
      "🔄 useModules() with selector pattern",
    ];
  };
}
```

## Phase 2: Core System Implementation

### Component: ManagerServices

**Implementation ID**: `phase2.managers`

#### Current Implementation Status

- ✅ BaseManager interface defined in `src/lib/managers/BaseManager.ts` with standard lifecycle methods
- ✅ ServiceRegistry implemented in `src/lib/services/ServiceRegistry.ts` for dependency management
- ✅ ResourceManager refactored in `src/managers/game/ResourceManager.ts` to implement BaseManager
- ✅ ResourceFlowManager updated in `src/managers/resource/ResourceFlowManager.ts` with standardized patterns
- ✅ ModuleManager refactored in `src/managers/module/ModuleManager.ts` to implement BaseManager
- ✅ GameLoopManager enhanced in `src/managers/game/GameLoopManager.ts` for coordinating updates
- ✅ Staged initialization process implemented with proper dependency resolution

#### Analysis Tasks

- ✅ Map current manager service interfaces
- ✅ Identify dependencies between managers
- ✅ Analyze initialization sequences
- ✅ Document event emission patterns

#### Implementation Tasks

```typescript
interface ManagerStandardizationTasks {
  interface_definition: {
    base_manager_interface: "✅ Create a BaseManager interface with standard lifecycle methods";
    specialization_patterns: {
      ResourceManager: "✅ Implement BaseManager with resource-specific extensions";
      ModuleManager: "✅ Implement BaseManager with module-specific extensions";
      ExplorationManager: "🔄 Implement BaseManager with exploration-specific extensions";
    };
  };
  service_registry: {
    implementation: "✅ Create a centralized ServiceRegistry for dependency injection";
    dependency_resolution: "✅ Implement dependency resolution with proper initialization order";
  };
  refactoring: {
    priority_managers: ["ResourceManager", "ModuleManager", "GameLoopManager"];
    implementation_steps: {
      ResourceManager: [
        "✅ Implement BaseManager interface",
        "✅ Add consistent event emission",
        "✅ Standardize error handling",
        "✅ Add performance tracking",
      ];
      ModuleManager: [
        "✅ Implement BaseManager interface",
        "✅ Standardize event emission",
        "✅ Add dependency injection",
        "✅ Improve error handling",
      ];
    };
  };
  initialization: {
    sequence_implementation: "✅ Create a staged initialization process in App.tsx";
    dependency_graph: {
      ResourceManager: [];
      ModuleManager: ["ResourceManager"];
      ResourceFlowManager: ["ResourceManager"];
      GameLoopManager: ["ResourceManager", "ModuleManager"];
    };
  };
}
```

### Component: UIConnections

**Implementation ID**: `phase2.ui`

#### Current Implementation Status

- SystemIntegration component in `src/components/core/SystemIntegration.tsx` - partial implementation
- ResourceVisualization in `src/components/ui/ResourceVisualization.tsx` - requires standardized hook usage
- ResourceVisualizationEnhanced in `src/components/ui/ResourceVisualizationEnhanced.tsx` - incomplete integration
- ModuleStatusDisplay (missing connection to ModuleManager)
- GameHUD renders UI components but has incomplete context connections

#### Analysis Tasks

- Catalog UI component context usage
- Identify event subscription patterns
- Map action dispatch patterns
- Analyze data flow from backend to UI

#### Implementation Tasks

```typescript
interface UIConnectionTasks {
  context_usage: {
    standardized_hooks: {
      useResource: "Access resource data with selector pattern";
      useModule: "Access module data with selector pattern";
      useGameActions: "Dispatch game actions with type safety";
    };
    implementation_priority: ["useResource", "useModule", "useGameActions"];
  };
  event_subscriptions: {
    standard_pattern: "Use useEventSubscription hook with selector pattern";
    implementation_examples: {
      ResourceVisualization: "Subscribe to resource events for real-time updates";
      ModuleStatusDisplay: "Subscribe to module events for status changes";
      GameHUD: "Subscribe to game events for global state changes";
    };
  };
  component_updates: {
    priority_components: [
      "ResourceVisualization",
      "ModuleStatusDisplay",
      "GameHUD",
    ];
    implementation_steps: {
      ResourceVisualization: [
        "Refactor to use standardized hooks",
        "Implement event subscription",
        "Add memoization for performance",
        "Implement error boundary",
      ];
      ModuleStatusDisplay: [
        "Connect to ModuleManager via context",
        "Implement event subscription",
        "Add real-time updates",
      ];
    };
  };
}
```

### Component: GameLoop

**Implementation ID**: `phase2.gameloop`

#### Current Implementation Status

- GameLoopManager defined in `src/managers/game/GameLoopManager.ts` - partial implementation
- Update system in `src/initialization/gameSystemsIntegration.ts`
- ResourceFlowManager optimization not properly connected to game loop
- Missing central coordination for system updates

#### Analysis Tasks

- Identify current update mechanisms
- Map system update dependencies
- Analyze performance characteristics
- Document timing requirements

#### Implementation Tasks

```typescript
interface GameLoopTasks {
  central_implementation: {
    loop_manager: "Enhance GameLoopManager with priority-based scheduling";
    update_scheduling: "Implement multi-tier update scheduling based on priorities";
  };
  system_integration: {
    priority_systems: [
      "ResourceManager",
      "ModuleManager",
      "ResourceFlowManager",
    ];
    integration_pattern: {
      ResourceManager: "Register for high-priority updates";
      ModuleManager: "Register for medium-priority updates";
      ResourceFlowManager: "Register for low-priority optimization updates";
    };
  };
  performance: {
    optimization_strategies: [
      "Batch similar updates",
      "Skip unchanged components",
      "Implement time budgeting",
      "Add frame rate monitoring",
    ];
    monitoring_implementation: "Add performance monitoring to detect bottlenecks";
  };
}
```

## Phase 3: Module-by-Module Integration

### Component: ResourceModule

**Implementation ID**: `phase3.resources`

#### Current Implementation Status

- ResourceVisualization component in `src/components/ui/ResourceVisualization.tsx` - partial implementation
- ResourceRatesContext in `src/contexts/ResourceRatesContext.tsx` - missing ThresholdContext integration
- useResourceManagement hook in `src/hooks/resources/useResourceManagement.tsx` - needs standardization
- ThresholdContext implementation missing

#### Implementation Tasks

```typescript
interface ResourceModuleIntegrationTasks {
  ui_refactoring: {
    component_list: [
      "ResourceVisualization",
      "ResourceVisualizationEnhanced",
      "ResourceEventMonitor",
    ];
    hook_implementations: {
      useResource: "Standardized hook for resource data access";
      useResourceRates: "Hook for production/consumption rates";
      useResourceThresholds: "Hook for threshold monitoring";
    };
  };
  event_subscriptions: {
    subscription_implementations: {
      ResourceVisualization: "Subscribe to RESOURCE_UPDATED, RESOURCE_THRESHOLD_CHANGED";
      ResourceEventMonitor: "Subscribe to all resource events with filtering";
      ResourceManager: "Emit standardized events for all resource changes";
    };
  };
  testing: {
    integration_tests: [
      "ResourceVisualization renders correct data",
      "ResourceVisualization updates on ResourceManager changes",
      "ThresholdContext triggers alerts on threshold violations",
    ];
    test_implementation: {
      ResourceVisualization: "Test component rendering and updates";
      ThresholdIntegration: "Test threshold monitoring and alerts";
    };
  };
  documentation: {
    pattern_documentation: "Document resource component patterns and best practices";
    developer_guides: [
      "Resource system integration guide",
      "Threshold monitoring guide",
      "Resource visualization best practices",
    ];
  };
}
```

### Component: ModuleSystem

**Implementation ID**: `phase3.modules`

#### Current Implementation Status

- ✅ ModuleManager refactored in `src/managers/module/ModuleManager.ts` to implement BaseManager
- ✅ ModuleContext in `src/contexts/ModuleContext.tsx` connected to ModuleManager with event subscriptions
- ✅ Module components implemented in `src/components/ui/modules/` directory:
  - ✅ ModuleCard component for displaying module information
  - ✅ ModuleGrid component for showing and filtering modules
  - ✅ ModuleUpgradeVisualization component for visualizing the upgrade process
- ✅ ModuleStatusManager and ModuleUpgradeManager integrated with the standardized patterns
- ✅ Comprehensive integration tests created in `src/tests/integration/ModuleSystemIntegration.test.tsx`

#### Implementation Tasks

```typescript
interface ModuleSystemIntegrationTasks {
  ui_refactoring: {
    component_list: [
      "ModuleHUD",
      "ModuleStatusDisplay",
      "ModuleUpgradeDisplay",
    ];
    hook_implementations: {
      useModule: "✅ Hook for accessing module data";
      useModuleActions: "✅ Hook for module actions";
      useModuleEvents: "✅ Hook for module event subscription";
    };
  };
  event_subscriptions: {
    subscription_implementations: {
      ModuleStatusDisplay: "✅ Subscribe to MODULE_STATUS_CHANGED, MODULE_UPDATED";
      ModuleUpgradeDisplay: "✅ Subscribe to MODULE_UPGRADED, MODULE_UPGRADE_AVAILABLE";
      ModuleHUD: "✅ Subscribe to MODULE_CREATED, MODULE_DESTROYED";
    };
  };
  testing: {
    integration_tests: [
      "✅ ModuleStatusDisplay updates on status changes",
      "✅ ModuleUpgradeDisplay shows correct upgrade options",
      "✅ ModuleHUD correctly renders available modules",
    ];
    test_implementation: {
      ModuleStatusDisplay: "✅ Test status updates and rendering";
      ModuleUpgradeSystem: "✅ Test upgrade path calculation and application";
    };
  };
  documentation: {
    pattern_documentation: "✅ Document module system integration patterns";
    developer_guides: [
      "✅ Module system integration guide",
      "✅ Module upgrades implementation guide",
      "✅ Module status monitoring guide",
    ];
  };
}
```

#### Key Integration Points

The Module System now provides the following integration points:

1. **UI Components to ModuleManager**:
   - Components connect directly to the ModuleManager through event subscriptions
   - The ModuleCard component displays module information and provides controls
   - The ModuleGrid component allows filtering and sorting of modules
   - The ModuleUpgradeVisualization component shows upgrade progress

2. **Event-Based Communication**:
   - Module components subscribe to module events using the standardized useEventSubscription hook
   - Components automatically update when module state changes
   - Event subscriptions are cleaned up on component unmount

3. **Integration Tests**:
   - Comprehensive tests verify the integration between UI components and the ModuleManager
   - Tests check the end-to-end flow from module selection to upgrading
   - Performance monitoring is included to detect rendering issues

### Component: ExplorationSystem

**Implementation ID**: `phase3.exploration`

#### Current Implementation Status

- ExplorationManager partially implemented
- DataAnalysisSystem component in `src/components/exploration/DataAnalysisSystem.tsx`
- DataAnalysisContext in `src/contexts/DataAnalysisContext.tsx`
- DiscoveryClassification component incomplete
- Missing connection between ExplorationManager and DataAnalysisSystem

#### Implementation Tasks

```typescript
interface ExplorationSystemIntegrationTasks {
  ui_refactoring: {
    component_list: [
      "DataAnalysisSystem",
      "DiscoveryClassification",
      "ResourcePotentialVisualization",
    ];
    hook_implementations: {
      useExploration: "Hook for exploration data";
      useDataAnalysis: "Hook for data analysis features";
      useDiscovery: "Hook for discovery classification";
    };
  };
  event_subscriptions: {
    subscription_implementations: {
      DataAnalysisSystem: "Subscribe to ANALYSIS_COMPLETED, DATA_UPDATED";
      DiscoveryClassification: "Subscribe to DISCOVERY_CLASSIFIED, NEW_DISCOVERY";
      ResourcePotentialVisualization: "Subscribe to RESOURCE_POTENTIAL_UPDATED";
    };
  };
  testing: {
    integration_tests: [
      "DataAnalysisSystem processes data correctly",
      "DiscoveryClassification categorizes discoveries properly",
      "ResourcePotentialVisualization shows accurate potential",
    ];
    test_implementation: {
      DataAnalysisSystem: "Test analysis algorithms and visualization";
      ExplorationManager: "Test exploration coordination and discovery";
    };
  };
  documentation: {
    pattern_documentation: "Document exploration system integration patterns";
    developer_guides: [
      "Exploration system integration guide",
      "Data analysis implementation guide",
      "Discovery classification guide",
    ];
  };
}
```

## Phase 4: Performance Optimization and QA

### Component: PerformanceOptimization

**Implementation ID**: `phase4.performance`

#### Current Implementation Status

- Performance monitoring utilities partially implemented
- ResourceFlowManager optimization incomplete
- Missing performance benchmarks
- Not all UI components are optimized for rendering performance

#### Implementation Tasks

```typescript
interface PerformanceOptimizationTasks {
  monitoring: {
    critical_systems: ["ResourceFlowManager", "GameLoopManager", "EventSystem"];
    monitoring_implementation: "Implement comprehensive performance monitoring system";
  };
  profiling: {
    key_operations: [
      "Resource flow optimization",
      "Event distribution",
      "UI rendering",
    ];
    profiling_implementation: "Create performance profiling tools for key operations";
  };
  optimization: {
    target_areas: {
      ResourceFlowManager: "Optimize flow calculation algorithm";
      EventSystem: "Implement event batching and prioritization";
      Rendering: "Implement React.memo and useMemo for expensive components";
    };
    implementation_strategies: {
      ResourceFlowManager: "Implement incremental updates instead of full recalculation";
      EventSystem: "Use priority queue for event processing";
      Rendering: "Implement virtualization for long lists";
    };
  };
  benchmarks: {
    benchmark_implementations: {
      ResourceFlow: "Benchmark resource flow optimization with varying node counts";
      EventProcessing: "Benchmark event processing with high event volumes";
      RenderPerformance: "Benchmark component rendering with complex state";
    };
    success_criteria: {
      ResourceFlow: 5000; // Process 5000 nodes in < 16ms
      EventProcessing: 1000; // Process 1000 events in < 16ms
      RenderPerformance: 60; // Maintain 60 FPS with full UI
    };
  };
}
```

### Component: TestingQA

**Implementation ID**: `phase4.testing`

#### Current Implementation Status

- Unit tests for key components exist but integration test coverage is lacking
- ResourceFlowManager.test.ts and ModuleManager.test.ts implemented
- Missing system boundary tests
- No automated architectural validation

#### Implementation Tasks

```typescript
interface TestingQATasks {
  coverage: {
    core_systems: {
      ResourceSystem: 85;
      ModuleSystem: 80;
      EventSystem: 75;
      UIComponents: 70;
    };
    implementation_strategy: "Create comprehensive test suite for core systems";
  };
  integration_tests: {
    boundary_tests: {
      "ResourceManager-GameContext": "Test bidirectional updates between ResourceManager and GameContext";
      "ModuleManager-ModuleContext": "Test bidirectional updates between ModuleManager and ModuleContext";
      "ThresholdContext-ResourceManager": "Test threshold monitoring and notifications";
    };
    implementation_priority: [
      "ResourceManager-GameContext",
      "ModuleManager-ModuleContext",
      "ThresholdContext-ResourceManager",
    ];
  };
  simulation_tests: {
    complex_systems: [
      "ResourceFlowOptimization",
      "ModuleUpgradeChain",
      "EventPropagation",
    ];
    implementation_approach: "Create simulation tests for complex system interactions";
  };
  automation: {
    quality_checks: [
      "Type consistency checking",
      "Architectural boundary validation",
      "Performance regression testing",
      "Memory leak detection",
    ];
    integration_approach: "Integrate quality checks into CI/CD pipeline";
  };
}
```

## Implementation Tools

### Cursor AI Capabilities Utilization

```json
{
  "analysis_capabilities": [
    {
      "capability": "Pattern Detection",
      "utilization": "Identify inconsistent patterns across the codebase"
    },
    {
      "capability": "Type Analysis",
      "utilization": "Analyze type usage and suggest standardized types"
    },
    {
      "capability": "Dependency Mapping",
      "utilization": "Map dependencies between components and systems"
    }
  ],
  "generation_capabilities": [
    {
      "capability": "Code Generation",
      "utilization": "Generate standardized implementations for core components"
    },
    {
      "capability": "Refactoring Scripts",
      "utilization": "Create scripts for transforming existing code"
    },
    {
      "capability": "Test Generation",
      "utilization": "Generate test cases for system connections"
    }
  ],
  "verification_capabilities": [
    {
      "capability": "Architecture Validation",
      "utilization": "Verify implementations against architecture specifications"
    },
    {
      "capability": "Type Checking",
      "utilization": "Ensure consistent type usage across the codebase"
    },
    {
      "capability": "Performance Analysis",
      "utilization": "Identify potential performance issues"
    }
  ]
}
```

## Component Registration System

**Implementation ID**: `phase2.ui.componentRegistry`

### Current Implementation Status

- Fully implemented with core services and hooks in place
- ComponentRegistryService in `src/services/ComponentRegistryService.ts` - implements centralized component tracking system
- useComponentRegistration hook in `src/hooks/ui/useComponentRegistration.ts` - provides React integration for components
- useComponentLifecycle hook in `src/hooks/ui/useComponentLifecycle.ts` - manages component lifecycle and event subscriptions
- ResourceDisplay component in `src/components/ui/resource/ResourceDisplay.tsx` - example implementation
- ResourceRegistrationDemo in `src/components/ui/resource/ResourceRegistrationDemo.tsx` - demonstration component
- ResourceVisualizationEnhanced in `src/components/ui/resource/ResourceVisualizationEnhanced.tsx` - enhanced resource visualization using the component registration system

### Architecture

```typescript
interface ComponentRegistrationSystem {
  services: {
    ComponentRegistryService: {
      purpose: "Centralized tracking of all UI components";
      capabilities: [
        "Component registration and unregistration",
        "Event subscription management",
        "Performance metrics tracking",
        "Component lookup by ID, type, and event subscription",
      ];
      connections: [
        {
          to: "EventPropagationService";
          connection_type: "event_distribution";
        },
        { to: "React UI Components"; connection_type: "registration_hooks" },
      ];
    };
  };

  hooks: {
    useComponentRegistration: {
      purpose: "Register React components with the registry";
      parameters: {
        type: "Component type identifier";
        eventSubscriptions: "Array of event types the component listens to";
        updatePriority: "Priority level for updates (high, medium, low)";
      };
      return: "Component ID for tracking";
    };

    useComponentLifecycle: {
      purpose: "Manage component lifecycle and event subscriptions";
      capabilities: [
        "Mount/unmount event handling",
        "Automatic event subscription setup and cleanup",
        "Performance tracking integration",
      ];
    };
  };

  demo_components: {
    ResourceDisplay: "Example implementation of registration pattern";
    ResourceRegistrationDemo: "Demo UI for showcasing registry capabilities";
  };
}
```

### Integration Points

The Component Registration System establishes the following key integration points:

1. **UI Components to Events System**:
   - Components register their interest in specific events
   - Event propagation is optimized to only notify relevant components
   - Automatic cleanup on component unmount prevents memory leaks

2. **Performance Monitoring**:
   - Tracks component render counts and render times
   - Identifies components exceeding performance thresholds
   - Provides aggregated performance reports

3. **Centralized Component Management**:
   - Maintains registry of all active UI components
   - Tracks component types and counts
   - Enables component lookup by various criteria

### Implementation Details

```typescript
interface ComponentMetadata {
  id: string; // Unique identifier for the component
  type: string; // Component type (e.g., 'ResourceDisplay')
  eventSubscriptions: string[]; // Events this component is interested in
  updatePriority: "high" | "medium" | "low"; // Priority for updates

  // Performance metrics
  renderCount?: number;
  averageRenderTime?: number;
  totalRenderTime?: number;
  lastUpdated?: number;
}

// Registry methods
interface ComponentRegistry {
  registerComponent(metadata: ComponentMetadata): () => void;
  getComponentsByEvent(eventType: string): ComponentMetadata[];
  updateComponentMetrics(id: string, renderTime: number): void;
  getAllComponents(): ComponentMetadata[];
  getComponentById(id: string): ComponentMetadata | undefined;
  getComponentsByType(type: string): ComponentMetadata[];
  getPerformanceReport(): PerformanceReport;
  notifyComponentsOfEvent(eventType: string, eventData: unknown): void;
}

// Hook implementations
function useComponentRegistration(
  options: ComponentRegistrationOptions,
): string;
function useComponentLifecycle(options: ComponentLifecycleOptions): void;
```

### Usage Pattern

```tsx
// Example component implementation using the registration system
const ExampleComponent: React.FC = () => {
  // Register with the component registry
  const componentId = useComponentRegistration({
    type: "ExampleComponent",
    eventSubscriptions: ["EXAMPLE_EVENT_TYPE", "ANOTHER_EVENT_TYPE"],
    updatePriority: "medium",
  });

  // Set up lifecycle and event handlers
  useComponentLifecycle({
    onMount: () => console.log("Component mounted"),
    onUnmount: () => console.log("Component unmounted"),
    eventSubscriptions: [
      {
        eventType: "EXAMPLE_EVENT_TYPE",
        handler: (event) => handleExampleEvent(event),
      },
    ],
  });

  // Component implementation
  return <div>Example Component</div>;
};
```

### Next Implementation Steps

1. Apply the component registration pattern to core UI components:
   - ResourceVisualization ✅ (Implemented in ResourceVisualizationEnhanced)
   - ModuleStatusDisplay
   - GameHUD

2. Enhance the system with:
   - Automated performance monitoring and reporting
   - Event subscription optimization
   - Component rendering optimization based on metrics

3. Create comprehensive documentation and developer guides for adopting the pattern

## Success Metrics and Verification

```json
{
  "type_safety": {
    "metrics": [
      {
        "name": "TypeScript Error Reduction",
        "target": "90% reduction in TypeScript errors",
        "measurement": "Compiler error count before vs. after"
      },
      {
        "name": "Any Type Reduction",
        "target": "95% reduction in 'any' type usage",
        "measurement": "Count of 'any' types before vs. after"
      }
    ]
  },
  "component_connections": {
    "metrics": [
      {
        "name": "UI-Backend Connection",
        "target": "100% of UI components properly connected",
        "measurement": "Static analysis of component-context connections"
      },
      {
        "name": "State Update Reliability",
        "target": "Zero stale state issues",
        "measurement": "Automated tests for state propagation"
      }
    ]
  },
  "code_quality": {
    "metrics": [
      {
        "name": "Test Coverage",
        "target": "85% test coverage for critical systems",
        "measurement": "Test coverage reports"
      },
      {
        "name": "Pattern Consistency",
        "target": "95% adherence to standardized patterns",
        "measurement": "Static analysis of pattern usage"
      }
    ]
  },
  "performance": {
    "metrics": [
      {
        "name": "Rendering Performance",
        "target": "60 FPS for complex UI components",
        "measurement": "Performance profiling"
      },
      {
        "name": "Resource Flow Optimization",
        "target": "50% reduction in computation time",
        "measurement": "Benchmark comparisons"
      }
    ]
  }
}
```

## Core Systems

### Exploration System

```json
{
  "id": "exploration_system",
  "version": "1.0.0",
  "description": "System for space exploration, discovery and analysis",
  "components": [
    {
      "id": "exploration_manager",
      "type": "manager",
      "implementation_status": "complete",
      "file_path": "src/managers/exploration/ExplorationManager.ts",
      "description": "Central manager for exploration operations, sector discovery, and anomaly detection",
      "implements": ["BaseManager"],
      "connections": [
        {
          "to": "event_bus",
          "type": "publishes_events",
          "events": [
            "SECTOR_DISCOVERED",
            "ANOMALY_DETECTED",
            "RESOURCE_DETECTED",
            "SCAN_STARTED",
            "SCAN_COMPLETED"
          ]
        },
        {
          "to": "recon_ship_manager",
          "type": "uses_service",
          "description": "Coordinates ship assignments with scan operations"
        },
        {
          "to": "data_analysis_context",
          "type": "provides_data",
          "description": "Exploration data is consumed by analysis system"
        }
      ]
    },
    {
      "id": "recon_ship_manager",
      "type": "manager",
      "implementation_status": "complete",
      "file_path": "src/managers/exploration/ReconShipManagerImpl.ts",
      "description": "Manages reconnaissance ships for exploration operations",
      "connections": [
        {
          "to": "exploration_manager",
          "type": "provides_service",
          "description": "Handles ship operations requested by ExplorationManager"
        }
      ]
    },
    {
      "id": "data_analysis_context",
      "type": "context_provider",
      "implementation_status": "complete",
      "file_path": "src/contexts/DataAnalysisContext.tsx",
      "description": "Context provider for analysis of exploration data, automatically processes discoveries",
      "connections": [
        {
          "to": "exploration_manager",
          "type": "subscribes_to_events",
          "events": [
            "SECTOR_DISCOVERED",
            "ANOMALY_DETECTED",
            "RESOURCE_DETECTED"
          ]
        },
        {
          "to": "data_analysis_system",
          "type": "provides_context",
          "description": "Supplies processed exploration data to UI"
        }
      ]
    },
    {
      "id": "data_analysis_system",
      "type": "ui_component",
      "implementation_status": "complete",
      "file_path": "src/components/exploration/DataAnalysisSystem.tsx",
      "description": "UI component for visualizing and analyzing exploration data",
      "connections": [
        {
          "to": "data_analysis_context",
          "type": "consumes_context",
          "description": "Displays analysis of exploration discoveries"
        },
        {
          "to": "exploration_manager",
          "type": "retrieves_metadata",
          "description": "Shows real-time exploration statistics"
        }
      ]
    },
    {
      "id": "discovery_classification",
      "type": "ui_component",
      "implementation_status": "planned",
      "file_path": "src/components/exploration/DiscoveryClassification.tsx",
      "description": "Component for classification of anomalies and resources",
      "connections": [
        {
          "to": "data_analysis_context",
          "type": "consumes_context",
          "description": "Uses analysis data for classification algorithms"
        }
      ]
    }
  ],
  "integration_points": [
    {
      "from": "exploration_system",
      "to": "resource_system",
      "type": "data_flow",
      "description": "Discovered resources are added to the resource system for extraction and processing",
      "status": "implemented"
    },
    {
      "from": "exploration_system",
      "to": "tech_system",
      "type": "data_flow",
      "description": "Anomalies may unlock new research opportunities in the tech system",
      "status": "planned"
    }
  ]
}
```

### Exploration System Integration Details

The Exploration System has been integrated with the core architecture following standardized patterns:

#### Manager Implementation

The ExplorationManager implements the BaseManager interface to provide consistent behavior with other system managers:

1. **Lifecycle Management**: Implements `initialize()`, `update()`, and `dispose()` methods for standard lifecycle
2. **Event Communication**: Uses the EventBus for publishing standardized events
3. **Dependency Management**: Receives dependencies through the ServiceRegistry
4. **Performance Monitoring**: Exposes statistics through the getMetadata() interface

```typescript
/**
 * ExplorationManager extends AbstractBaseManager to integrate with the core systems
 * - Implements standardized lifecycle methods
 * - Uses EventBus for event-based communication
 * - Provides performance metrics
 */
export class ExplorationManager extends AbstractBaseManager<BaseEvent> {
  constructor(
    eventBus: EventBus<BaseEvent>,
    shipManager: ReconShipManagerImpl,
  ) {
    super("ExplorationManager", eventBus);
    this.shipManager = shipManager;
  }

  // Lifecycle methods
  protected async onInitialize(
    dependencies?: Record<string, unknown>,
  ): Promise<void> {
    // Initialization logic with dependency injection
    this.subscribeToEvent(
      EventType.STATUS_CHANGED,
      this.handleShipStatusChange,
    );
  }

  protected onUpdate(deltaTime: number): void {
    // Update logic for active scan operations
    this.updateScanOperations(deltaTime);
  }

  // Event publishing
  private completeScanOperation(operationId: string): void {
    // Operation completion logic
    this.publishEvent(
      this.createEvent(ExplorationEvents.SCAN_COMPLETED, {
        sector,
        operation,
      }),
    );
  }
}
```

#### Context Provider Integration

The DataAnalysisContext connects with the ExplorationManager through event subscriptions:

1. **Automated Dataset Creation**: Automatically creates datasets from exploration events
2. **Data Transformation**: Converts exploration entities to standardized DataPoints
3. **Type Safety**: Uses strongly-typed interfaces for all data transformations
4. **Resource Optimization**: Implements efficient data storage and retrieval

```typescript
/**
 * DataAnalysisContext integrates with ExplorationManager through event subscriptions
 * - Creates datasets automatically from exploration events
 * - Provides custom hooks for UI components
 */
export const DataAnalysisProvider: React.FC<DataAnalysisProviderProps> = ({
  children,
  initialDatasets = [],
  initialAnalysisConfigs = [],
  initialAnalysisResults = [],
}) => {
  // Event subscriptions
  useEffect(() => {
    // Subscribe to exploration events
    const unsubscribeSector = explorationManager.subscribeToEvent(
      asEventType(ExplorationEvents.SECTOR_DISCOVERED),
      handleSectorDiscovered
    );

    // More subscriptions...

    // Cleanup
    return () => {
      unsubscribeSector();
      // More unsubscriptions...
    };
  }, [dependencies]);

  // Context value
  const contextValue: DataAnalysisContextType = {
    // Context data and methods...
  };

  return <DataAnalysisContext.Provider value={contextValue}>{children}</DataAnalysisContext.Provider>;
};
```

#### UI Component Integration

The DataAnalysisSystem UI component integrates with the ExplorationManager through the DataAnalysisContext:

1. **Real-time Data Display**: Shows live exploration statistics
2. **Automatic Updates**: Periodically refreshes data from ExplorationManager
3. **Dataset Visualization**: Displays datasets generated from exploration events
4. **Interaction Patterns**: Follows standardized UI patterns for consistency

```typescript
/**
 * DataAnalysisSystem integrates with exploration data through:
 * - DataAnalysisContext for datasets and analysis results
 * - ExplorationManager.getMetadata() for statistics
 */
export function DataAnalysisSystem({ className = '' }: DataAnalysisSystemProps) {
  // Context usage
  const {
    datasets,
    analysisConfigs,
    analysisResults,
    // More context values...
  } = useDataAnalysis();

  // Get exploration-specific datasets
  const explorationDatasets = React.useMemo(() => {
    return datasets.filter(dataset =>
      ['sectors', 'anomalies', 'resources'].includes(dataset.source)
    );
  }, [datasets]);

  // Statistics update
  React.useEffect(() => {
    const updateStats = () => {
      const stats = explorationManager.getMetadata().stats || {};
      setExplorationStats({
        // Mapping stats...
      });
    };

    // Update interval
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Render UI with exploration data
  return (
    // Component JSX...
  );
}
```

### Planned Integration Enhancements

Future integration work for the Exploration System includes:

1. **Resource System Integration**: Connect discovered resources to the resource extraction system
2. **Technology System Integration**: Link anomalies to the research and technology tree
3. **Mission System Integration**: Generate exploration missions based on discovered sectors
4. **Ship Management Integration**: Enhance ship assignment and management capabilities
5. **Classification Algorithm Integration**: Implement AI-based classification of discoveries

## Context Implementation

### Current Implementation

We have moved away from using the `createStandardContext` utility to a direct React context implementation using hooks. This approach:

1. Eliminates circular dependencies that were causing issues in tests
2. Provides more control over context creation and subscription management
3. Improves type safety and reduces reliance on utility functions

The contexts that have been refactored to use this new pattern are:

- ResourceRatesContext
- GameContext

### Benefits of the New Pattern

- No circular dependencies between contexts and their consumers
- Better test compatibility with mocking frameworks
- Improved type safety with explicit state and action types
- More explicit control over subscriptions and event handling
- Easier to understand and maintain

### Integration with Managers

The new context pattern maintains the same integration with managers as before:

- Managers are passed to the context provider as props
- The context subscribes to manager events and updates state accordingly
- Actions in the context can trigger manager methods
- The manager is included in the context value for direct access when needed

### Event Handling

Event handling has been improved with:

- Better type safety for event subscriptions
- Safer cleanup of event subscriptions
- More explicit error handling for subscription failures

### Future Improvements

- Fix type compatibility issues between different event type systems
- Standardize this pattern across all contexts
- Create better documentation for how to properly test these contexts
- Improve error handling and logging for context operations

## Success Metrics and Verification

```json
{
  "type_safety": {
    "metrics": [
      {
        "name": "TypeScript Error Reduction",
        "target": "90% reduction in TypeScript errors",
        "measurement": "Compiler error count before vs. after"
      },
      {
        "name": "Any Type Reduction",
        "target": "95% reduction in 'any' type usage",
        "measurement": "Count of 'any' types before vs. after"
      }
    ]
  },
  "component_connections": {
    "metrics": [
      {
        "name": "UI-Backend Connection",
        "target": "100% of UI components properly connected",
        "measurement": "Static analysis of component-context connections"
      },
      {
        "name": "State Update Reliability",
        "target": "Zero stale state issues",
        "measurement": "Automated tests for state propagation"
      }
    ]
  },
  "code_quality": {
    "metrics": [
      {
        "name": "Test Coverage",
        "target": "85% test coverage for critical systems",
        "measurement": "Test coverage reports"
      },
      {
        "name": "Pattern Consistency",
        "target": "95% adherence to standardized patterns",
        "measurement": "Static analysis of pattern usage"
      }
    ]
  },
  "performance": {
    "metrics": [
      {
        "name": "Rendering Performance",
        "target": "60 FPS for complex UI components",
        "measurement": "Performance profiling"
      },
      {
        "name": "Resource Flow Optimization",
        "target": "50% reduction in computation time",
        "measurement": "Benchmark comparisons"
      }
    ]
  }
}
```

## Implementation Notes for Cursor

1. This plan is structured for machine parsing and execution. Each component has a unique implementation ID for reference.

2. Implementation priorities are explicitly specified to guide execution order.
3. Type definitions and interfaces are provided as templates for code generation.
4. Success metrics are quantifiable and measurable through automated means.
5. The plan assumes an iterative implementation approach with continuous validation against architecture specifications.

## Cursor-Specific Instructions

1. Parse each component section to extract implementation tasks.
2. Generate comprehensive analysis reports before beginning implementation.
3. Create standardized patterns based on the specifications in each component section.
4. Prioritize implementation based on the specified order and dependencies.
5. Validate each implementation against the success metrics before proceeding to the next component.
6. Generate documentation for implemented patterns and components to ensure knowledge transfer.
7. Utilize the specified AI capabilities for analysis, generation, and verification throughout the implementation process.

### Resource System Visualization

**Implementation Status**:

- ResourceVisualizationEnhanced: Fully implemented
- ResourceThresholdVisualization: Fully implemented
- ResourceFlowDiagram: Fully implemented
- Resource Management Dashboard: Not yet implemented
- Resource Forecasting Visualization: Not yet implemented
- Resource Optimization Suggestions: Not yet implemented

**Implementation Details for ResourceThresholdVisualization**:

- Shows resource levels relative to defined thresholds (critical, low, normal, high, maximum)
- Provides real-time predictions for when thresholds will be reached based on current rates
- Visualizes progress towards next threshold with color-coded indicators
- Integrates with the component registration system for lifecycle management
- Subscribes to resource events for automatic updates
- Efficiently re-renders only when relevant resource data changes

**Implementation Details for ResourceFlowDiagram**:

- Visualizes the full resource flow network using D3.js force-directed graph
- Shows different node types (producer, consumer, storage, converter) with distinct visuals
- Displays resource flow connections with animated paths indicating rate and direction
- Provides interactive features: zoom, pan, node dragging, and selection
- Integrates with component registration system for automatic updates
- Includes detailed resource type indicators and comprehensive legend
- Updates in real-time based on resource flow events
- Supports focusing on specific resource types and nodes

**Integration Points**:

- Connects to resource threshold definitions from ResourceManager
- Receives real-time updates from the ModuleEvents system
- Registered with ComponentRegistryService for performance tracking
- Can be used within any resource management interface
- ResourceFlowDiagram provides visualization of ResourceFlowManager's network

**Next Steps**:

- Create a comprehensive Resource Management Dashboard combining all visualization components
- Implement resource forecasting with trend line visualization and projections
- Develop resource optimization suggestions based on production/consumption patterns
- Enhance ResourceFlowDiagram with detailed node statistics and optimization indicators

## Resource System Standardization

### Standardized Resource Types

- **File:** `src/types/resources/StandardizedResourceTypes.ts`
- **Description:** Provides standardized type definitions for the resource management system to ensure consistency across the codebase.
- **Dependencies:**
  - TypeScript Enum support
- **Key Components:**
  - **ResourceType Enum:** Replaces string literals with enum values
  - **ResourceStateClass:** Manages resource state with proper validation
  - **ResourceTypeHelpers:** Provides utilities for working with resource types
  - **Type Interfaces:** Standardized interfaces for the resource flow system
- **Integration Points:**
  - **ResourceFlowManager:** Core manager updated to use standardized types
  - **UI Components:** All UI components updated to use standardized types
  - **ResourceRatesContext:** Updated to use ResourceType enum
  - **ThresholdContext:** Updated to use ResourceType enum
  - **Mining System:** Mining components updated to use ResourceType enum

- **Implementation Status:**
  - Phase 1 (Complete): Core type definitions and ResourceFlowManager
  - Phase 2 (Complete): UI component and context provider updates
  - Phase 3 (Complete): Mining system integration with standardized types
  - Phase 4 (Pending): Comprehensive testing
  - Phase 5 (Pending): Legacy code deprecation

### Component Updates

#### UI Components

The following UI components have been migrated to use the standardized resource types:

- **ResourceManagementDashboard**
  - Uses ResourceType enum for type references
  - Uses ResourceTypeHelpers for display name generation
- **ResourceFlowDiagram**
  - Updated to use ResourceType enum for node and connection resource types
  - Uses standardized interfaces for network nodes and links
- **ResourceThresholdVisualization**
  - Updated to use ResourceType enum for resource identification
  - Uses ResourceTypeHelpers for UI display names
- **ResourceVisualizationEnhanced**
  - Updated resource mappings to use ResourceType enum
  - Improved type safety in resource displays

#### Context Providers

Context providers have been updated to use standardized resource types:

- **ResourceRatesContext**
  - Updated from string-based CoreResourceType to ResourceType enum
  - Added compatibility layer for legacy string-based resource references
  - Improved type-safety in rate calculation methods
- **ThresholdContext**
  - Updated Resource interface to use ResourceType enum
  - Improved consistency in threshold management

#### Mining System Integration

The mining system components have been updated to use standardized resource types:

- **MiningTypes.ts**
  - Updated `MiningResource` interface to use ResourceType enum instead of string literals
  - Added new `MiningShip` interface for consistent type definitions
  - Standardized property naming conventions

- **MineralProcessingCentre.tsx**
  - Updated to use ResourceType enum for resource identification
  - Improved type safety in resource processing logic

- **MiningControls.tsx**
  - Replaced string literal comparisons with ResourceType enum values
  - Fixed type inconsistencies in conditional rendering based on resource types
  - Improved UI consistency for different resource types

- **MiningMap.tsx**
  - Updated to use the standardized MiningResource type
  - Enhanced type safety in resource mapping functions

- **ThresholdManager and ThresholdIntegration**
  - Updated to handle ResourceType enum values
  - Fixed type compatibility issues with threshold monitoring

### Type Migration Strategy

The standardized type system has been successfully integrated into all resource-related components:

1. **Core System Components:**
   - ResourceFlowManager has been updated to use the standardized types
   - String literal types have been replaced with enums
   - ResourceStateClass is used for state management

2. **UI Components:**
   - All UI components have been updated to use

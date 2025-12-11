# GALACTIC SPRAWL SYSTEM INTEGRATION

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

## SYSTEM OVERVIEW

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

## IMPLEMENTATION TIMELINE

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

## IMPLEMENTATION STATUS DASHBOARD

This dashboard provides a centralized view of implementation status across all system components.

### Resource System

| Component                      | Status      | Location                                               |
| ------------------------------ | ----------- | ------------------------------------------------------ |
| ResourceType Enum              | ✅ Complete | `src/types/resources/StandardizedResourceTypes.ts`     |
| ResourceManager                | ✅ Complete | `src/managers/game/ResourceManager.ts`                 |
| ResourceFlowManager            | ✅ Complete | `src/managers/resource/ResourceFlowManager.ts`         |
| ResourceRatesContext           | ✅ Complete | `src/contexts/ResourceRatesContext.tsx`                |
| ThresholdContext               | ✅ Complete | `src/contexts/ThresholdContext.tsx`                    |
| ResourceVisualization          | ✅ Complete | `src/components/ui/ResourceVisualization.tsx`          |
| ResourceVisualizationEnhanced  | ✅ Complete | `src/components/ui/ResourceVisualizationEnhanced.tsx`  |
| ResourceThresholdVisualization | ✅ Complete | `src/components/ui/ResourceThresholdVisualization.tsx` |
| ResourceFlowDiagram            | ✅ Complete | `src/components/ui/ResourceFlowDiagram.tsx`            |
| Mining System Integration      | ✅ Complete | Multiple files                                         |

### Event System

| Component              | Status      | Location                                 |
| ---------------------- | ----------- | ---------------------------------------- |
| EventTypes             | ✅ Complete | `src/lib/events/EventTypes.ts`           |
| EventBus               | ✅ Complete | `src/lib/events/EventBus.ts`             |
| ModuleEventBus         | ✅ Complete | `src/lib/modules/ModuleEvents.ts`        |
| EventSubscription Hook | ✅ Complete | `src/lib/events/useEventSubscription.ts` |
| EventBatcher           | ✅ Complete | `src/lib/events/EventBatcher.ts`         |
| EventDevTools          | ✅ Complete | `src/lib/events/EventDevTools.ts`        |

### Context Providers

| Component            | Status         | Location                                |
| -------------------- | -------------- | --------------------------------------- |
| BaseContext          | ✅ Complete    | `src/lib/contexts/BaseContext.tsx`      |
| GameContext          | 🔄 In Progress | `src/contexts/GameContext.tsx`          |
| ResourceRatesContext | ✅ Complete    | `src/contexts/ResourceRatesContext.tsx` |
| ThresholdContext     | ✅ Complete    | `src/contexts/ThresholdContext.tsx`     |
| ModuleContext        | 🔄 In Progress | `src/contexts/ModuleContext.tsx`        |
| DataAnalysisContext  | ✅ Complete    | `src/contexts/DataAnalysisContext.tsx`  |

### Manager Services

| Component          | Status      | Location                                         |
| ------------------ | ----------- | ------------------------------------------------ |
| BaseManager        | ✅ Complete | `src/lib/managers/BaseManager.ts`                |
| ServiceRegistry    | ✅ Complete | `src/lib/services/ServiceRegistry.ts`            |
| ResourceManager    | ✅ Complete | `src/managers/game/ResourceManager.ts`           |
| ModuleManager      | ✅ Complete | `src/managers/module/ModuleManager.ts`           |
| GameLoopManager    | ✅ Complete | `src/managers/game/GameLoopManager.ts`           |
| ExplorationManager | ✅ Complete | `src/managers/exploration/ExplorationManager.ts` |

### Module System

| Component                  | Status      | Location                                                   |
| -------------------------- | ----------- | ---------------------------------------------------------- |
| ModuleManager              | ✅ Complete | `src/managers/module/ModuleManager.ts`                     |
| ModuleContext              | ✅ Complete | `src/contexts/ModuleContext.tsx`                           |
| ModuleCard                 | ✅ Complete | `src/components/ui/modules/ModuleCard.tsx`                 |
| ModuleGrid                 | ✅ Complete | `src/components/ui/modules/ModuleGrid.tsx`                 |
| ModuleUpgradeVisualization | ✅ Complete | `src/components/ui/modules/ModuleUpgradeVisualization.tsx` |

### Exploration System

| Component               | Status      | Location                                                 |
| ----------------------- | ----------- | -------------------------------------------------------- |
| ExplorationManager      | ✅ Complete | `src/managers/exploration/ExplorationManager.ts`         |
| ReconShipManager        | ✅ Complete | `src/managers/exploration/ReconShipManagerImpl.ts`       |
| DataAnalysisContext     | ✅ Complete | `src/contexts/DataAnalysisContext.tsx`                   |
| DataAnalysisSystem      | ✅ Complete | `src/components/exploration/DataAnalysisSystem.tsx`      |
| DiscoveryClassification | 🔄 Planned  | `src/components/exploration/DiscoveryClassification.tsx` |

## ARCHITECTURAL STANDARDS

This section defines the core architectural patterns used throughout the system. These patterns should be consistently applied to maintain architectural integrity.

### BaseManager Pattern

The BaseManager pattern provides a standardized interface for all manager services:

```typescript
interface BaseManager<T extends BaseEvent = BaseEvent> {
  // Lifecycle methods
  initialize(dependencies?: Record<string, unknown>): Promise<void>;
  update(deltaTime: number): void;
  dispose(): void;

  // Event handling
  subscribeToEvent<E extends T>(
    eventType: EventType,
    handler: EventHandler<E>,
  ): Unsubscribe;
  publishEvent<E extends T>(event: E): void;

  // Metadata
  getMetadata(): ManagerMetadata;
}
```

Key characteristics:

- Standardized lifecycle methods (initialize, update, dispose)
- Consistent event subscription and publishing
- Dependency injection through initialize method
- Performance tracking through metadata

### Context Provider Pattern

The Context Provider pattern establishes a standardized approach for React context providers:

```typescript
// Context creation
export const ExampleContext = React.createContext<ExampleContextType | null>(null);

// Provider component
export const ExampleProvider: React.FC<ExampleProviderProps> = ({
  children,
  exampleManager,
  initialState = {},
}) => {
  // State management
  const [state, dispatch] = useReducer(exampleReducer, initialState);

  // Event subscriptions
  useEffect(() => {
    // Subscribe to manager events
    const unsubscribe = exampleManager.subscribeToEvent(
      EventType.EXAMPLE_EVENT,
      handleExampleEvent
    );

    // Cleanup
    return () => unsubscribe();
  }, [exampleManager]);

  // Context value
  const contextValue = {
    ...state,
    exampleManager,
    // Actions
    doSomething: () => { /* implementation */ },
  };

  return (
    <ExampleContext.Provider value={contextValue}>
      {children}
    </ExampleContext.Provider>
  );
};

// Custom hook
export const useExample = () => {
  const context = useContext(ExampleContext);
  if (!context) {
    throw new Error('useExample must be used within an ExampleProvider');
  }
  return context;
};
```

Key characteristics:

- Consistent state management with useReducer
- Automatic event subscription to managers
- Proper cleanup of subscriptions
- Custom hook for consuming context
- Type safety throughout

### Event Subscription Pattern

The Event Subscription pattern provides a standardized approach for subscribing to events:

```typescript
// In a component
useEffect(() => {
  // Subscribe to events
  const unsubscribe = eventBus.subscribe(EventType.EXAMPLE_EVENT, handleEvent);

  // Cleanup
  return () => unsubscribe();
}, [eventBus]);

// Using the hook
useEventSubscription(eventBus, EventType.EXAMPLE_EVENT, handleEvent, [
  /* dependencies */
]);
```

Key characteristics:

- Consistent subscription pattern
- Automatic cleanup on component unmount
- Type safety for event types and handlers
- Dependency tracking for subscription updates

### Component Registration Pattern

The Component Registration pattern provides a standardized approach for registering UI components:

```typescript
// In a component
const componentId = useComponentRegistration({
  type: "ExampleComponent",
  eventSubscriptions: ["EXAMPLE_EVENT_TYPE"],
  updatePriority: "medium",
});

useComponentLifecycle({
  onMount: () => console.log("Component mounted"),
  onUnmount: () => console.log("Component unmounted"),
  eventSubscriptions: [
    {
      eventType: "EXAMPLE_EVENT_TYPE",
      handler: (event) => handleEvent(event),
    },
  ],
});
```

Key characteristics:

- Centralized component tracking
- Automatic event subscription management
- Performance metrics tracking
- Lifecycle management

## PHASE 1: FOUNDATION AND ANALYSIS

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

## PHASE 2: CORE SYSTEM IMPLEMENTATION

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

### Component Registration System

**Implementation ID**: `phase2.ui.componentRegistry`

#### Current Implementation Status

- Fully implemented with core services and hooks in place
- ComponentRegistryService in `src/services/ComponentRegistryService.ts` - implements centralized component tracking system
- useComponentRegistration hook in `src/hooks/ui/useComponentRegistration.ts` - provides React integration for components
- useComponentLifecycle hook in `src/hooks/ui/useComponentLifecycle.ts` - manages component lifecycle and event subscriptions
- ResourceDisplay component in `src/components/ui/resource/ResourceDisplay.tsx` - example implementation
- ResourceRegistrationDemo in `src/components/ui/resource/ResourceRegistrationDemo.tsx` - demonstration component
- ResourceVisualizationEnhanced in `src/components/ui/resource/ResourceVisualizationEnhanced.tsx` - enhanced resource visualization using the component registration system

#### Architecture

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

#### Integration Points

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

#### Implementation Details

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

#### Usage Pattern

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

## PHASE 3: MODULE-BY-MODULE INTEGRATION

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

### Integration Points

#### Resource System Integration

```typescript
interface ResourceSystemIntegration {
  discovery_flow: {
    steps: [
      "Resource detection by ExplorationManager",
      "Resource classification by DiscoveryClassification",
      "Resource registration with ResourceManager",
      "Resource node creation in ResourceFlowManager",
    ];
    events: [
      "RESOURCE_DETECTED",
      "RESOURCE_CLASSIFIED",
      "RESOURCE_REGISTERED",
      "RESOURCE_NODE_CREATED",
    ];
  };

  data_flow: {
    ExplorationManager: {
      outputs: ["ResourceData", "ResourceLocation", "ResourceQuality"];
      consumers: ["ResourceManager", "ResourceFlowManager"];
    };
    ResourceManager: {
      inputs: ["ResourceData", "ResourceLocation"];
      outputs: ["ResourceAvailability", "ExtractionRate"];
    };
  };
}
```

#### Technology System Integration

```typescript
interface TechnologySystemIntegration {
  anomaly_research: {
    flow: [
      "Anomaly detection by ExplorationManager",
      "Classification by DiscoveryClassification",
      "Research opportunity creation",
      "Technology tree update",
    ];
    events: [
      "ANOMALY_DETECTED",
      "ANOMALY_CLASSIFIED",
      "RESEARCH_OPPORTUNITY_CREATED",
      "TECH_TREE_UPDATED",
    ];
  };

  data_sharing: {
    ExplorationManager: {
      provides: ["AnomalyData", "ResearchOpportunities"];
      receives: ["TechnologyRequirements", "ResearchProgress"];
    };
    TechnologyManager: {
      provides: ["TechnologyRequirements", "ResearchCapabilities"];
      receives: ["AnomalyData", "ResearchOpportunities"];
    };
  };
}
```

### Implementation Details

#### ExplorationManager

```typescript
class ExplorationManager extends AbstractBaseManager<ExplorationEvent> {
  private shipManager: ReconShipManager;
  private sectors: Map<string, SectorData>;
  private activeScans: Map<string, ScanOperation>;

  constructor(
    eventBus: EventBus<ExplorationEvent>,
    shipManager: ReconShipManager,
  ) {
    super("ExplorationManager", eventBus);
    this.shipManager = shipManager;
    this.sectors = new Map();
    this.activeScans = new Map();
  }

  public async startSectorScan(sectorId: string): Promise<void> {
    const ships = await this.shipManager.getAvailableShips();
    if (ships.length === 0) {
      throw new Error("No ships available for scanning");
    }

    const operation = new ScanOperation(sectorId, ships[0]);
    this.activeScans.set(operation.id, operation);

    await this.shipManager.assignShip(ships[0], operation);
    this.publishEvent(
      this.createEvent(ExplorationEvents.SCAN_STARTED, { operation }),
    );
  }

  protected async onUpdate(deltaTime: number): Promise<void> {
    for (const [id, operation] of this.activeScans) {
      await this.updateScanOperation(operation, deltaTime);
    }
  }

  private async updateScanOperation(
    operation: ScanOperation,
    deltaTime: number,
  ): Promise<void> {
    operation.progress += deltaTime * operation.ship.scanRate;

    if (operation.progress >= 100) {
      await this.completeScanOperation(operation);
    }
  }

  private async completeScanOperation(operation: ScanOperation): Promise<void> {
    const discoveries = await this.generateDiscoveries(operation);

    for (const discovery of discoveries) {
      switch (discovery.type) {
        case "resource":
          this.publishEvent(
            this.createEvent(ExplorationEvents.RESOURCE_DETECTED, {
              discovery,
            }),
          );
          break;
        case "anomaly":
          this.publishEvent(
            this.createEvent(ExplorationEvents.ANOMALY_DETECTED, { discovery }),
          );
          break;
      }
    }

    this.activeScans.delete(operation.id);
    await this.shipManager.releaseShip(operation.ship);
    this.publishEvent(
      this.createEvent(ExplorationEvents.SCAN_COMPLETED, { operation }),
    );
  }
}
```

#### DataAnalysisContext

```typescript
interface AnalysisState {
  datasets: Dataset[];
  analysisResults: AnalysisResult[];
  activeAnalysis: string[];
}

const DataAnalysisContext = React.createContext<DataAnalysisContextType | null>(null);

export const DataAnalysisProvider: React.FC<DataAnalysisProviderProps> = ({
  children,
  explorationManager,
}) => {
  const [state, dispatch] = useReducer(analysisReducer, initialState);

  useEffect(() => {
    const subscriptions = [
      explorationManager.subscribeToEvent(ExplorationEvents.RESOURCE_DETECTED, handleResourceDetected),
      explorationManager.subscribeToEvent(ExplorationEvents.ANOMALY_DETECTED, handleAnomalyDetected),
    ];

    return () => subscriptions.forEach(unsub => unsub());
  }, [explorationManager]);

  const startAnalysis = useCallback(async (datasetId: string) => {
    dispatch({ type: 'START_ANALYSIS', payload: { datasetId } });

    try {
      const result = await analyzeDataset(state.datasets.find(d => d.id === datasetId)!);
      dispatch({ type: 'ANALYSIS_COMPLETED', payload: { result } });
    } catch (error) {
      dispatch({ type: 'ANALYSIS_FAILED', payload: { error } });
    }
  }, [state.datasets]);

  const contextValue = useMemo(() => ({
    ...state,
    startAnalysis,
  }), [state, startAnalysis]);

  return (
    <DataAnalysisContext.Provider value={contextValue}>
      {children}
    </DataAnalysisContext.Provider>
  );
};
```

#### DataAnalysisSystem

```typescript
export const DataAnalysisSystem: React.FC = () => {
  const {
    datasets,
    analysisResults,
    activeAnalysis,
    startAnalysis,
  } = useDataAnalysis();

  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  const handleAnalyze = useCallback(() => {
    if (selectedDataset) {
      startAnalysis(selectedDataset);
    }
  }, [selectedDataset, startAnalysis]);

  return (
    <div className="data-analysis-system">
      <DatasetSelector
        datasets={datasets}
        selectedDataset={selectedDataset}
        onSelect={setSelectedDataset}
      />

      <AnalysisControls
        onAnalyze={handleAnalyze}
        isAnalyzing={activeAnalysis.includes(selectedDataset!)}
        disabled={!selectedDataset}
      />

      <AnalysisResults
        results={analysisResults}
        selectedDataset={selectedDataset}
      />

      <VisualizationPanel
        dataset={datasets.find(d => d.id === selectedDataset)}
        results={analysisResults.filter(r => r.datasetId === selectedDataset)}
      />
    </div>
  );
};
```

## PHASE 4: PERFORMANCE OPTIMIZATION AND QA

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

## EXPLORATION SYSTEM DETAILS

### System Overview

The Exploration System manages space exploration, discovery, and analysis of new sectors, resources, and anomalies. It integrates with multiple core systems to provide a comprehensive exploration experience.

### Architecture

```typescript
interface ExplorationSystem {
  managers: {
    ExplorationManager: {
      purpose: "Central manager for exploration operations";
      responsibilities: [
        "Sector discovery coordination",
        "Anomaly detection",
        "Resource detection",
        "Scan operation management",
      ];
      events: [
        "SECTOR_DISCOVERED",
        "ANOMALY_DETECTED",
        "RESOURCE_DETECTED",
        "SCAN_STARTED",
        "SCAN_COMPLETED",
      ];
    };
    ReconShipManager: {
      purpose: "Manages reconnaissance ship operations";
      responsibilities: [
        "Ship assignment",
        "Scan coordination",
        "Fleet management",
      ];
    };
  };

  contexts: {
    DataAnalysisContext: {
      purpose: "Provides analysis capabilities for discoveries";
      features: [
        "Automated dataset creation",
        "Real-time analysis",
        "Classification support",
      ];
    };
  };

  components: {
    DataAnalysisSystem: {
      purpose: "UI component for visualizing analysis";
      features: [
        "Real-time data visualization",
        "Interactive analysis tools",
        "Discovery classification",
      ];
    };
    DiscoveryClassification: {
      purpose: "Classifies new discoveries";
      features: [
        "Resource classification",
        "Anomaly categorization",
        "Threat assessment",
      ];
    };
  };
}
```

### Integration Points

#### Resource System Integration

```typescript
interface ResourceSystemIntegration {
  discovery_flow: {
    steps: [
      "Resource detection by ExplorationManager",
      "Resource classification by DiscoveryClassification",
      "Resource registration with ResourceManager",
      "Resource node creation in ResourceFlowManager",
    ];
    events: [
      "RESOURCE_DETECTED",
      "RESOURCE_CLASSIFIED",
      "RESOURCE_REGISTERED",
      "RESOURCE_NODE_CREATED",
    ];
  };

  data_flow: {
    ExplorationManager: {
      outputs: ["ResourceData", "ResourceLocation", "ResourceQuality"];
      consumers: ["ResourceManager", "ResourceFlowManager"];
    };
    ResourceManager: {
      inputs: ["ResourceData", "ResourceLocation"];
      outputs: ["ResourceAvailability", "ExtractionRate"];
    };
  };
}
```

#### Technology System Integration

```typescript
interface TechnologySystemIntegration {
  anomaly_research: {
    flow: [
      "Anomaly detection by ExplorationManager",
      "Classification by DiscoveryClassification",
      "Research opportunity creation",
      "Technology tree update",
    ];
    events: [
      "ANOMALY_DETECTED",
      "ANOMALY_CLASSIFIED",
      "RESEARCH_OPPORTUNITY_CREATED",
      "TECH_TREE_UPDATED",
    ];
  };

  data_sharing: {
    ExplorationManager: {
      provides: ["AnomalyData", "ResearchOpportunities"];
      receives: ["TechnologyRequirements", "ResearchProgress"];
    };
    TechnologyManager: {
      provides: ["TechnologyRequirements", "ResearchCapabilities"];
      receives: ["AnomalyData", "ResearchOpportunities"];
    };
  };
}
```

### Implementation Details

#### ExplorationManager

```typescript
class ExplorationManager extends AbstractBaseManager<ExplorationEvent> {
  private shipManager: ReconShipManager;
  private sectors: Map<string, SectorData>;
  private activeScans: Map<string, ScanOperation>;

  constructor(
    eventBus: EventBus<ExplorationEvent>,
    shipManager: ReconShipManager,
  ) {
    super("ExplorationManager", eventBus);
    this.shipManager = shipManager;
    this.sectors = new Map();
    this.activeScans = new Map();
  }

  public async startSectorScan(sectorId: string): Promise<void> {
    const ships = await this.shipManager.getAvailableShips();
    if (ships.length === 0) {
      throw new Error("No ships available for scanning");
    }

    const operation = new ScanOperation(sectorId, ships[0]);
    this.activeScans.set(operation.id, operation);

    await this.shipManager.assignShip(ships[0], operation);
    this.publishEvent(
      this.createEvent(ExplorationEvents.SCAN_STARTED, { operation }),
    );
  }

  protected async onUpdate(deltaTime: number): Promise<void> {
    for (const [id, operation] of this.activeScans) {
      await this.updateScanOperation(operation, deltaTime);
    }
  }

  private async updateScanOperation(
    operation: ScanOperation,
    deltaTime: number,
  ): Promise<void> {
    operation.progress += deltaTime * operation.ship.scanRate;

    if (operation.progress >= 100) {
      await this.completeScanOperation(operation);
    }
  }

  private async completeScanOperation(operation: ScanOperation): Promise<void> {
    const discoveries = await this.generateDiscoveries(operation);

    for (const discovery of discoveries) {
      switch (discovery.type) {
        case "resource":
          this.publishEvent(
            this.createEvent(ExplorationEvents.RESOURCE_DETECTED, {
              discovery,
            }),
          );
          break;
        case "anomaly":
          this.publishEvent(
            this.createEvent(ExplorationEvents.ANOMALY_DETECTED, { discovery }),
          );
          break;
      }
    }

    this.activeScans.delete(operation.id);
    await this.shipManager.releaseShip(operation.ship);
    this.publishEvent(
      this.createEvent(ExplorationEvents.SCAN_COMPLETED, { operation }),
    );
  }
}
```

#### DataAnalysisContext

```typescript
interface AnalysisState {
  datasets: Dataset[];
  analysisResults: AnalysisResult[];
  activeAnalysis: string[];
}

const DataAnalysisContext = React.createContext<DataAnalysisContextType | null>(null);

export const DataAnalysisProvider: React.FC<DataAnalysisProviderProps> = ({
  children,
  explorationManager,
}) => {
  const [state, dispatch] = useReducer(analysisReducer, initialState);

  useEffect(() => {
    const subscriptions = [
      explorationManager.subscribeToEvent(ExplorationEvents.RESOURCE_DETECTED, handleResourceDetected),
      explorationManager.subscribeToEvent(ExplorationEvents.ANOMALY_DETECTED, handleAnomalyDetected),
    ];

    return () => subscriptions.forEach(unsub => unsub());
  }, [explorationManager]);

  const startAnalysis = useCallback(async (datasetId: string) => {
    dispatch({ type: 'START_ANALYSIS', payload: { datasetId } });

    try {
      const result = await analyzeDataset(state.datasets.find(d => d.id === datasetId)!);
      dispatch({ type: 'ANALYSIS_COMPLETED', payload: { result } });
    } catch (error) {
      dispatch({ type: 'ANALYSIS_FAILED', payload: { error } });
    }
  }, [state.datasets]);

  const contextValue = useMemo(() => ({
    ...state,
    startAnalysis,
  }), [state, startAnalysis]);

  return (
    <DataAnalysisContext.Provider value={contextValue}>
      {children}
    </DataAnalysisContext.Provider>
  );
};
```

#### DataAnalysisSystem

```typescript
export const DataAnalysisSystem: React.FC = () => {
  const {
    datasets,
    analysisResults,
    activeAnalysis,
    startAnalysis,
  } = useDataAnalysis();

  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  const handleAnalyze = useCallback(() => {
    if (selectedDataset) {
      startAnalysis(selectedDataset);
    }
  }, [selectedDataset, startAnalysis]);

  return (
    <div className="data-analysis-system">
      <DatasetSelector
        datasets={datasets}
        selectedDataset={selectedDataset}
        onSelect={setSelectedDataset}
      />

      <AnalysisControls
        onAnalyze={handleAnalyze}
        isAnalyzing={activeAnalysis.includes(selectedDataset!)}
        disabled={!selectedDataset}
      />

      <AnalysisResults
        results={analysisResults}
        selectedDataset={selectedDataset}
      />

      <VisualizationPanel
        dataset={datasets.find(d => d.id === selectedDataset)}
        results={analysisResults.filter(r => r.datasetId === selectedDataset)}
      />
    </div>
  );
};
```

## TESTING AND QA INFRASTRUCTURE

### Test Architecture

```typescript
interface TestInfrastructure {
  frameworks: {
    unit_testing: {
      framework: "Jest";
      features: [
        "Component testing with React Testing Library",
        "Manager service testing",
        "Context testing",
        "Event system testing",
      ];
    };
    integration_testing: {
      framework: "Jest + Custom Test Runners";
      features: [
        "System boundary testing",
        "Cross-component interaction testing",
        "Event propagation testing",
        "State management testing",
      ];
    };
    performance_testing: {
      framework: "Custom Performance Test Suite";
      features: [
        "Component render performance",
        "State update performance",
        "Event system performance",
        "Resource flow optimization testing",
      ];
    };
  };

  test_types: {
    unit_tests: {
      coverage: {
        target: "90%";
        current: "85%";
        critical_components: "95%";
      };
      focus_areas: [
        "Individual component logic",
        "Manager method behavior",
        "Context state management",
        "Event handling",
      ];
    };
    integration_tests: {
      coverage: {
        target: "85%";
        current: "70%";
        critical_paths: "90%";
      };
      focus_areas: [
        "Component interaction flows",
        "System boundary communication",
        "Event propagation chains",
        "State synchronization",
      ];
    };
    performance_tests: {
      metrics: {
        render_time: "< 16ms";
        state_update: "< 50ms";
        event_propagation: "< 100ms";
        resource_flow: "< 200ms";
      };
      focus_areas: [
        "UI render performance",
        "State update efficiency",
        "Event system throughput",
        "Resource calculation optimization",
      ];
    };
  };
}
```

### Test Implementation Examples

#### Unit Testing

```typescript
describe("ResourceManager", () => {
  let resourceManager: ResourceManager;
  let eventBus: EventBus<ResourceEvent>;

  beforeEach(() => {
    eventBus = new EventBus();
    resourceManager = new ResourceManager(eventBus);
  });

  describe("addResource", () => {
    it("should emit RESOURCE_ADDED event when adding new resource", async () => {
      const eventSpy = jest.fn();
      eventBus.subscribe(ResourceEvents.RESOURCE_ADDED, eventSpy);

      await resourceManager.addResource({
        type: ResourceType.IRON,
        amount: 100,
        location: { x: 0, y: 0 },
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ResourceEvents.RESOURCE_ADDED,
          payload: expect.objectContaining({
            resourceType: ResourceType.IRON,
            amount: 100,
          }),
        }),
      );
    });

    it("should update existing resource when adding to same location", async () => {
      const location = { x: 0, y: 0 };

      await resourceManager.addResource({
        type: ResourceType.IRON,
        amount: 100,
        location,
      });

      await resourceManager.addResource({
        type: ResourceType.IRON,
        amount: 50,
        location,
      });

      const resource = await resourceManager.getResourceAt(location);
      expect(resource).toEqual(
        expect.objectContaining({
          type: ResourceType.IRON,
          amount: 150,
        }),
      );
    });
  });
});
```

#### Integration Testing

```typescript
describe("Resource System Integration", () => {
  let system: TestSystem;

  beforeEach(async () => {
    system = await TestSystem.create({
      components: [
        "ResourceManager",
        "ResourceFlowManager",
        "ResourceVisualization",
      ],
    });
  });

  afterEach(async () => {
    await system.cleanup();
  });

  it("should update visualization when resource flow changes", async () => {
    // Arrange
    const source = await system.resourceManager.addResource({
      type: ResourceType.IRON,
      amount: 1000,
      location: { x: 0, y: 0 },
    });

    const destination = await system.resourceManager.addResource({
      type: ResourceType.IRON,
      amount: 0,
      location: { x: 1, y: 0 },
    });

    await system.resourceFlowManager.createFlow({
      from: source.id,
      to: destination.id,
      rate: 10,
    });

    // Act
    await system.tick(1000); // Simulate 1 second

    // Assert
    const visualization = await system.getComponent("ResourceVisualization");
    const flowLine = visualization.getFlowLine(source.id, destination.id);

    expect(flowLine).toBeDefined();
    expect(flowLine.props.rate).toBe(10);
    expect(await system.resourceManager.getAmount(destination.id)).toBe(10);
  });
});
```

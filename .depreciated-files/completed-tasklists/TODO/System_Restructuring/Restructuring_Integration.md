# System Integration Map

## 1. Core System Architecture

### Layers and Components

- **Top Layer**: UI Components ↔ Context Providers ↔ Manager Services
- **Bottom Layer**: Custom Hooks ↔ Integration Layer ↔ Event Buses

### Components by Category

1. **UI Components**: GameHUD, ResourceVisual, TechTree, ExplorationSystem, GameStateMonitor
2. **Context Providers**: GameContext, ModuleContext, ThresholdContext, ResourceRates, ShipContext
3. **Manager Services**: ResourceManager, ModuleManager, ShipManager, ExplorationManager, ThresholdManager
4. **Custom Hooks**: useGameState, useModuleStatus, useResourceRates
5. **Integration Layer**: SystemIntegration, ThresholdIntegration, EventBatcher
6. **Event Buses**: ModuleEventBus, GameEventBus, ResourceEventBus

### Connection Patterns

- UI Components connect to Context Providers (bidirectional)
- Context Providers connect to Manager Services (bidirectional)
- Custom Hooks connect to Integration Layer (bidirectional)
- Integration Layer connects to Event Buses (bidirectional)
- Context Providers connect to Integration Layer (bidirectional)

## 2. Connection Points

### 2.1 UI ←→ Context Connection Points

- **GameHUD Component**
  - Uses `useGame()` to access game state
  - Uses `useModules()` to manage module building
  - Should dispatch actions to update game state

- **ResourceVisualization Component**
  - Uses `useGame()` to access resource data
  - Uses `useResourceRates()` to access production/consumption rates
  - Connected to ThresholdContext through ThresholdIntegration
  - Displays real-time updates from ResourceManager

- **GameStateMonitor Component**
  - Uses `useGameState()` to access game state
  - Uses `useModules()` to access module state
  - Displays real-time resource rates, module states, and system events
  - Provides debugging information for development

### 2.2 Context ←→ Manager Connection Points

- **GameContext**
  - Initialized with ResourceManager through SystemIntegration
  - State updates synchronized with manager methods
  - Dispatches trigger manager actions

- **ResourceRatesContext**
  - Tracks production and consumption rates for all resources
  - Updates in response to resource events from ResourceManager
  - Provides production/consumption data to UI components

- **ThresholdContext**
  - Connected to ResourceManager through ThresholdIntegration
  - Manages resource thresholds and generates alerts
  - Triggers resource production/consumption adjustments

- **ModuleContext**
  - Uses ModuleManager for operations through SystemIntegration
  - State synchronized with ModuleManager
  - Registers for module events through ModuleEventBus

### 2.3 Integration ←→ Service Connection Points

- **SystemIntegration Component**
  - Bridges between frontend contexts and backend managers
  - Synchronizes resource and module states
  - Broadcasts state changes as events
  - Handles initialization timing

- **ThresholdIntegration Component**
  - Connects ThresholdContext with ResourceManager
  - Updates threshold values based on resource states
  - Triggers actions when thresholds are crossed
  - Generates alerts for critical resource states

## 3. Resource Flow System

### 3.1 System Structure

- **Node Types**: Producer Nodes, Storage Nodes, Consumer Nodes, Converter Nodes
- **Central Component**: ResourceFlowManager (connects all node types)
- **Flow Pattern**: Producers → Storage → Consumers, with Converters as transformation points

### 3.2 ResourceFlowManager Responsibilities

1. **Node Management**:
   - Registers and unregisters resource nodes (producers, consumers, storage, converters)
   - Tracks node state and capabilities

2. **Connection Management**:
   - Establishes connections between nodes
   - Controls flow rates between connected nodes

3. **Resource Optimization**:
   - Calculates optimal flow distributions based on priorities
   - Identifies resource bottlenecks and underutilized resources
   - Applies efficiency modifiers for converter nodes

4. **Resource State Tracking**:
   - Maintains current state of all resources in the system
   - Provides caching for efficient state retrieval

### 3.3 Data Flow Sequence

1. Game Modules register with ResourceFlowManager
2. User Actions update ResourceFlowManager
3. UI Components query ResourceFlowManager
4. ResourceFlowManager runs optimization cycle
5. Resource Transfers execute
6. Events emit to notify system changes

### 3.4 Key Processes

#### 3.4.1 Flow Optimization Process

1. Resource nodes register with the ResourceFlowManager
2. Connections are established between compatible nodes
3. The optimizeFlows method runs periodically (or on-demand) to:
   - Process converters to apply efficiency modifiers
   - Calculate resource availability from producers and storage
   - Calculate resource demand from consumers
   - Identify bottlenecks and underutilized resources
   - Optimize flow rates based on priorities and available resources
   - Generate transfer records for the optimized flows
4. UI components query the ResourceFlowManager for current state and flows
5. Events are emitted when significant changes occur (shortages, transfers, etc.)

#### 3.4.2 Converter Node Processing

1. Each converter has an efficiency rating that affects resource production
2. When the flow optimization runs, converters are processed first
3. Output connections from converters have their rates modified by the efficiency factor
4. This enables both simple conversion (e.g., minerals to processed minerals) and complex chains

### 3.5 Performance Considerations

1. **Batch Processing**
   - Processes large networks in batches to avoid blocking the main thread
   - The batch size is configurable based on network complexity

2. **Resource State Caching**
   - Caches resource states with configurable TTL (time-to-live)
   - Invalidates cache entries when states are updated

3. **Incremental Updates**
   - Updates only connections that have changed, not the entire network
   - Returns only the changes in the optimization result

4. **History Management**
   - Limits transfer history size to prevent memory issues
   - Provides filtered history queries for efficient access

## 4. Event System

### 4.1 Core Components and Relationships

1. **ModuleEventBus (Central Component)**
   - Manages event subscription, emission, and history
   - Operates as a singleton service
   - Key functions:
     - Subscription management with cleanup functions
     - Event distribution to registered listeners
     - Event history maintenance with filtering capabilities

2. **EventDispatcherProvider (React Integration)**
   - Wraps ModuleEventBus in a React context
   - Manages component lifecycle for subscriptions
   - Provides specialized hooks for components:
     - useEventSubscription
     - useLatestEvent
     - useFilteredEvents

3. **System Participants**
   - Module Events: Event sources from game systems
   - React Components: UI elements consuming events
   - System Components: Backend services emitting events
   - UI Event Handlers: Process events for UI updates

### 4.2 Component Relationships %%%%

#### 4.2.1 ModuleEventBus

The core event bus that handles event subscription, emission, and history management:

1. **Event Subscription**
   - Manages listeners for different event types
   - Provides unsubscribe functions for cleanup

2. **Event Emission**
   - Distributes events to registered listeners
   - Adds events to history with size limiting

3. **Event History**
   - Maintains a history of all events
   - Provides filtered history queries (by module, type, etc.)

#### 4.2.2 EventDispatcherProvider

A React context provider that integrates the ModuleEventBus with React components:

1. **React Integration**
   - Wraps the ModuleEventBus in a React context
   - Manages component lifecycle for subscriptions

2. **Event Hooks**
   - Provides hooks for easy event subscription
   - Tracks latest events by type
   - Offers filtered event access

### 4.3 Data Flow Sequence

#### 4.3.1 Event Subscription and Emission

1. Components or modules subscribe to specific event types they're interested in
2. When an event occurs, the source emits it through the ModuleEventBus
3. The ModuleEventBus:
   - Adds the event to its history
   - Notifies all listeners for that event type
4. Listeners handle the event, potentially causing UI updates or state changes
5. React components use hooks to subscribe, with automatic cleanup on unmount

#### 4.3.2 React Integration

The EventDispatcherProvider connects React components to the event system:

1. Initializes with the ModuleEventBus
2. Subscribes to all event types to track latest events
3. Provides hooks for components to easily:
   - Subscribe to events (`useEventSubscription`)
   - Access latest events (`useLatestEvent`)
   - Get filtered event sets (`useFilteredEvents`)
4. Manages subscription cleanup when components unmount

## 5. Current Issues and Integration Priorities

### 5.1 Overview of Integration Priorities

The following key integration tasks must be prioritized:

1. Connect ResourceManager with GameContext and UI components
2. Integrate ModuleManager with ModuleContext and module UI components
3. Fix ExplorationManager connections to exploration components
4. Ensure all UI components register for relevant events
5. Create consistent state update patterns throughout the application

### 5.2 Current Issues

#### 5.2.1 Missing Game Loop Coordination

- Managers have update() methods but no central game loop coordinating these updates
- Manager updates aren't happening on a controlled tick cycle

#### 5.2.2 Inconsistent Resource Update Flow

- Resources are updated both directly (GameContext dispatches) and through events
- No single source of truth for resource changes

#### 5.2.3 Event Systems Not Connected to UI Updates

- EventBatcher is well-designed but used inconsistently across components
- Many UI components don't properly subscribe to the events they need

#### 5.2.4 Initialization Order Problems

- SystemIntegration depends on resourceManager but gets initialized too late
- Components try to use managers before they're ready

#### 5.2.5 Missing Event Type Actions in GameContext

- UPDATE_RESOURCE_RATES action mentioned in SystemIntegration doesn't exist in GameContext
- No action to handle resource rate updates

### 5.3 Critical Missing Connection Points

#### 5.3.1 ResourceManager ↔ GameContext

- ResourceManager needs to consistently notify GameContext of changes
- GameContext needs actions to handle all resource state changes including rates

#### 5.3.2 ModuleManager ↔ ModuleContext

- ModuleContext operations should consistently go through ModuleManager
- Events from ModuleManager should update ModuleContext

#### 5.3.3 ThresholdContext ↔ ResourceManager

- ThresholdContext needs to be updated when resources change
- Threshold actions should affect resource usage policies

#### 5.3.4 UI Components ↔ Event System

- UI components need to consistently subscribe to relevant events
- Events should trigger state updates through context dispatches

### 5.4 Integration Strategy

To address the issues identified above, the integration strategy should focus on:

1. **Establishing a Central Game Loop**
   - Create a GameLoop class to coordinate all manager updates
   - Implement a consistent tick cycle for predictable state updates

2. **Standardizing Resource Management**
   - Designate ResourceManager as the single source of truth for resource changes
   - Ensure all resource updates flow through a consistent pipeline

3. **Connecting Event Systems**
   - Standardize event subscription across all UI components
   - Ensure all managers properly emit events for state changes

4. **Fixing Initialization Sequence**
   - Create a proper dependency graph for initialization
   - Implement a staged initialization process

5. **Completing GameContext Actions**
   - Add missing action types to GameContext
   - Implement handlers for all required state changes

## Resource Management System

### UI Components

#### ResourceManagementDashboard

- **File**: `src/components/ui/resource/ResourceManagementDashboard.tsx`
- **CSS**: `src/components/ui/resource/ResourceManagementDashboard.css`
- **Dependencies**:
  - `ResourceVisualizationEnhanced`
  - `ResourceThresholdVisualization`
  - `ResourceFlowDiagram`
  - `ConverterDashboard`
  - `ChainManagementInterface`
  - `ResourceForecastingVisualization`
  - `ResourceOptimizationSuggestions`
  - `ResourceRatesContext`
  - `ThresholdContext`
  - `ComponentRegistration System`
- **Description**: A comprehensive dashboard that integrates various resource-related visualizations and controls into a unified interface for managing all aspects of the resource system. Features include resource status overview, threshold configuration, resource flow visualization, converter management, production chain management, resource forecasting, optimization suggestions, and resource alerts.
- **Status**: Complete
- **Integration Points**:
  - Connects to ResourceRatesContext for real-time resource data
  - Integrates with ThresholdContext for threshold management
  - Uses ComponentRegistration system for event handling
  - Provides a unified interface for all resource management components

#### ResourceForecastingVisualization

- **File**: `src/components/ui/resource/ResourceForecastingVisualization.tsx`
- **CSS**: `src/components/ui/resource/ResourceForecastingVisualization.css`
- **Dependencies**:
  - `chart.js`
  - `react-chartjs-2`
  - `ResourceRatesContext`
  - `ThresholdContext`
  - `ComponentRegistration System`
- **Description**: Visualizes forecasted resource levels based on current rates and consumption patterns. Includes dynamic charts showing future resource trends, critical events prediction, and time-to-threshold calculations.
- **Status**: Complete
- **Integration Points**:
  - Connects to ResourceRatesContext for resource rate data
  - Integrates with ThresholdContext for threshold values
  - Uses ComponentRegistration system for real-time updates
  - Registers for resource-related events to update forecasts

#### ResourceOptimizationSuggestions

- **File**: `src/components/ui/resource/ResourceOptimizationSuggestions.tsx`
- **CSS**: `src/components/ui/resource/ResourceOptimizationSuggestions.css`
- **Dependencies**:
  - `lucide-react`
  - `ResourceRatesContext`
  - `ThresholdContext`
  - `ComponentRegistration System`
- **Description**: Analyzes resource flows and provides optimization suggestions to improve efficiency. Identifies potential bottlenecks, underutilized resources, excess production, and provides actionable suggestions for optimization.
- **Status**: Complete
- **Integration Points**:
  - Connects to ResourceRatesContext for resource rate data
  - Integrates with ThresholdContext for threshold values
  - Uses ComponentRegistration system for events
  - Provides actionable suggestions that can trigger notifications

### Pages

#### ResourceManagementPage

- **File**: `src/pages/ResourceManagementPage.tsx`
- **CSS**: `src/pages/ResourceManagementPage.css`
- **Dependencies**:
  - `ResourceManagementDashboard`
  - `ResourceRatesProvider`
  - `ThresholdProvider`
- **Description**: The main page for resource management, provides a full-page layout for the ResourceManagementDashboard and wraps it with necessary context providers.
- **Status**: Complete
- **Integration Points**:
  - Provides ResourceRatesProvider for resource data
  - Provides ThresholdProvider for threshold management
  - Acts as the entry point for resource management in the application

## Resource System Standardization

### Standardized Resource Types

- **File:** `src/types/resources/StandardizedResourceTypes.ts`
- **Description:** Provides standardized type definitions for the resource management system to ensure consistency across the codebase.
- **Dependencies:**
  - TypeScript Enum support
- **Key Features:**
  - Defines `ResourceType` as an enum for better type safety and intellisense support
  - Provides backward compatibility with string-based resource types
  - Implements metadata lookup using typed constants
  - Contains a `ResourceStateClass` with proper encapsulation and validation
  - Features comprehensive interfaces for various resource operations
  - Enables consistent type checking through standardized interfaces

- **Integration Points:**
  - Resource management components
  - Resource visualization components
  - ResourceFlowManager
  - ResourceManager
  - Any UI components that display or manipulate resources
- **Usage Example:**

```typescript
import {
  ResourceType,
  ResourceTypeHelpers,
  ResourceStateClass,
} from "src/types/resources/StandardizedResourceTypes";

// Using the enum for type safety
const mineralResource = ResourceType.MINERALS;

// Using helper methods
const displayName = ResourceTypeHelpers.getDisplayName(mineralResource);

// Creating a resource state with validation
const resourceState = new ResourceStateClass({
  type: ResourceType.ENERGY,
  current: 500,
  max: 1000,
});

// Accessing computed properties
const rate = resourceState.rate;
```

- **Implementation Status:** Completed

### Migration Strategy

- **Phase 1 (Current):** Created standardized type definitions
- **Phase 2 (Upcoming):** Update ResourceFlowManager to use standardized types
- **Phase 3 (Upcoming):** Update UI components to use standardized types
- **Phase 4 (Upcoming):** Deprecate old string-based type system

### Type Consistency Guidelines

1. Always use `ResourceType` enum instead of string literals
2. Use the `ResourceStateClass` for managing resource state values
3. Follow the standardized naming conventions for resource properties
4. Use helper methods for type conversions when interacting with legacy code
5. Ensure all new components use the standardized interfaces

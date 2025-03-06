# Galactic Sprawl System Integration Map

## Core System Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│    UI Components    │     │  Context Providers  │     │  Manager Services   │
├─────────────────────┤     ├─────────────────────┤     ├─────────────────────┤
│ - GameHUD           │     │ - GameContext       │     │ - ResourceManager   │
│ - ResourceVisual    │◄───►│ - ModuleContext     │◄───►│ - ModuleManager     │
│ - TechTree          │     │ - ThresholdContext  │     │ - ShipManager       │
│ - ExplorationSystem │     │ - ShipContext       │     │ - ExplorationManager│
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
                                      ▲
                                      │
                                      ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│    Custom Hooks     │     │  Service Systems    │     │  Event Buses        │
├─────────────────────┤     ├─────────────────────┤     ├─────────────────────┤
│ - useGameState      │     │ - EventSystem       │     │ - ModuleEventBus    │
│ - useModuleStatus   │◄───►│ - WebSocketServer   │◄───►│ - GameEventBus      │
│ - useResourceMgmt   │     │ - AutomationSystem  │     │ - ResourceEventBus  │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## Connection Points

### 1. UI ←→ Context Connection Points

- **GameHUD Component**

  - Uses `useGame()` to access game state
  - Uses `useModules()` to manage module building
  - Should dispatch actions to update game state

- **ResourceVisualization Component**

  - Uses `useGame()` to access resource data
  - Should connect to ThresholdContext for alerts
  - Needs to display real-time updates from ResourceManager

- **Exploration Components**
  - Use ClassificationContext and DataAnalysisContext
  - Need to connect to ExplorationManager through contexts

### 2. Context ←→ Manager Connection Points

- **GameContext**

  - Should be initialized with ResourceManager instance
  - Needs to connect game state updates with manager methods
  - Dispatches should trigger manager actions

- **ModuleContext**
  - Uses ModuleManager for operations
  - Should sync state with ModuleManager
  - Should register for module events through ModuleEventBus

### 3. Manager ←→ Service Connection Points

- **ResourceManager**

  - Needs to broadcast changes to event system
  - Should trigger UI updates through context
  - Provides APIs for other managers to consume resources

- **ModuleManager**
  - Manages module lifecycle events through ModuleEventBus
  - Should connect with automation system
  - Provides module capabilities to other systems

## Missing Connections

1. **Frontend/Backend Disconnect**: The UI components are not properly updating when backend state changes
2. **Context Update Failures**: Contexts are not always re-rendering components when state changes
3. **Event Broadcasting**: Event buses are not properly connected to UI components
4. **Resource Flow**: Resource changes are not triggering UI updates reliably
5. **State Synchronization**: Multiple sources of truth causing consistency problems

## Integration Priorities

1. Connect ResourceManager with GameContext and UI components
2. Integrate ModuleManager with ModuleContext and module UI components
3. Fix ExplorationManager connections to exploration components
4. Ensure all UI components register for relevant events
5. Create consistent state update patterns throughout the application

- Missing Game Loop Coordination:
  - You have managers with update() methods but no central game loop coordinating these updates
  - Manager updates aren't happening on a controlled tick cycle
- Inconsistent Resource Update Flow:
  - Resources are updated both directly (GameContext dispatches) and through events
  - No single source of truth for resource changes
- Event Systems Not Connected to UI Updates:
  - Your EventBatcher is well-designed but used inconsistently across components
  - Many UI components don't properly subscribe to the events they need
- Initialization Order Problems:
  - SystemIntegration depends on resourceManager but gets initialized too late
  - Components try to use managers before they're ready
- Missing Event Type Actions in GameContext:
  - UPDATE_RESOURCE_RATES action mentioned in SystemIntegration doesn't exist in GameContext
  - No action to handle resource rate updates
- C. Identify Where These Components Should Connect:
- The critical missing connection points are:
- ResourceManager ↔ GameContext:
  - ResourceManager needs to consistently notify GameContext of changes
  - GameContext needs actions to handle all resource state changes including rates
- ModuleManager ↔ ModuleContext:
  - ModuleContext operations should consistently go through ModuleManager
  - Events from ModuleManager should update ModuleContext
- ThresholdContext ↔ ResourceManager:
  - ThresholdContext needs to be updated when resources change
  - Threshold actions should affect resource usage policies
- UI Components ↔ Event System:
  - UI components need to consistently subscribe to relevant events
  - Events should trigger state updates through context dispatches

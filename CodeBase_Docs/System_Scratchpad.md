# Scratchpad

## Comprehensive Integration and Implementation Plan

### Completed Work

- ✅ Exploration system integration tests implemented and passing
- ✅ BaseContext template created with standardized patterns
- ✅ Event system standardization with proper type definitions
- ✅ Component Registration System implemented
- ✅ Resource system visualization components (ResourceVisualizationEnhanced, ResourceThresholdVisualization, ResourceFlowDiagram)
- ✅ Standardized resource types with ResourceType enum implementation
- ✅ Mining system integration with standardized resource types
- ✅ Module system refactoring and integration
- ✅ ExplorationManager in src/managers/exploration/ExplorationManager.ts implementing AbstractBaseManager
- ✅ ResourceManager implementing BaseManager with proper event emission
- ✅ ResourceRatesContext refactored to fix circular dependency issues and tests passing
- ✅ GameContext refactored to follow the same pattern as ResourceRatesContext with all tests passing
- ✅ ClassificationContext tests fixed and passing

### Implementation Priority Matrix

| Priority | Component                         | Status             | Critical Integrations           | Estimated Complexity |
| -------- | --------------------------------- | ------------------ | ------------------------------- | -------------------- |
| 1        | Context Provider Refactoring      | In Progress        | UI components, Manager services | High                 |
| 2        | Exploration System Implementation | Partially Complete | Resource system, Data analysis  | Medium               |
| 3        | Performance Optimization          | Not Started        | All systems                     | High                 |
| 4        | Testing and Quality Assurance     | In Progress        | All systems                     | Medium               |
| 5        | Resource Management Dashboard     | Not Started        | Resource system                 | Medium               |

## Phase 1: Context Provider Refactoring

### ResourceRatesContext Refactoring - Detailed Implementation Plan

#### 1. Action Type Definition

- [x] Create ResourceRatesActionType enum:
  ```typescript
  export enum ResourceRatesActionType {
    UPDATE_RESOURCE_RATE = 'resourceRates/updateResourceRate',
    UPDATE_ALL_RATES = 'resourceRates/updateAllRates',
    RESET_RATES = 'resourceRates/resetRates',
    SET_LOADING = 'resourceRates/setLoading',
    SET_ERROR = 'resourceRates/setError',
  }
  ```

#### 2. Action Creator Implementation

- [x] Create typed action creators:

  ```typescript
  export const createUpdateRateAction = (
    resourceType: ResourceType,
    rates: ResourceRateDetail
  ): ResourceRatesAction => ({
    type: ResourceRatesActionType.UPDATE_RESOURCE_RATE,
    payload: { resourceType, rates },
  });

  export const createUpdateAllRatesAction = (
    rates: Record<ResourceType, ResourceRateDetail>
  ): ResourceRatesAction => ({
    type: ResourceRatesActionType.UPDATE_ALL_RATES,
    payload: { rates },
  });
  ```

#### 3. State Interface Extension

- [x] Extend ResourceRatesState with BaseState:
  ```typescript
  export interface ResourceRatesState extends BaseState {
    resourceRates: Record<ResourceType, ResourceRateDetail>;
  }
  ```

#### 4. Reducer Implementation

- [x] Create reducer function:
  ```typescript
  export const resourceRatesReducer = (
    state: ResourceRatesState,
    action: ResourceRatesAction
  ): ResourceRatesState => {
    switch (action.type) {
      case ResourceRatesActionType.UPDATE_RESOURCE_RATE:
        return {
          ...state,
          resourceRates: {
            ...state.resourceRates,
            [action.payload.resourceType]: action.payload.rates,
          },
          lastUpdated: Date.now(),
        };
      case ResourceRatesActionType.UPDATE_ALL_RATES:
        return {
          ...state,
          resourceRates: action.payload.allRates,
          lastUpdated: Date.now(),
        };
      case ResourceRatesActionType.RESET_RATES:
        return {
          ...state,
          resourceRates: defaultResourceRates,
          isLoading: false,
          error: null,
          lastUpdated: Date.now(),
        };
      case ResourceRatesActionType.SET_LOADING:
        return {
          ...state,
          isLoading: action.payload.isLoading,
        };
      case ResourceRatesActionType.SET_ERROR:
        return {
          ...state,
          error: action.payload.error,
          isLoading: false,
        };
      default:
        return state;
    }
  };
  ```

#### 5. Event Handler Implementation

- [x] Create event handlers for resource updates:

  ```typescript
  const createEventHandler = (dispatch: React.Dispatch<ResourceRatesAction>) => {
    return (event: BaseEvent) => {
      if (event.data && typeof event.data === 'object' && 'resourceType' in event.data) {
        const resourceType = event.data.resourceType as ResourceType;
        const rates = calculateRatesFromEvent(event);
        dispatch(createUpdateRateAction(resourceType, rates));
      }
    };
  };
  ```

#### 6. Context Selector Implementation

- [x] Create memoized selectors:

  ```typescript
  export const selectResourceRates = (state: ResourceRatesState) => state.resourceRates;

  export const selectResourceRate = (state: ResourceRatesState, resourceType: ResourceType) =>
    state.resourceRates[resourceType];

  export const selectNetRate = (state: ResourceRatesState, resourceType: ResourceType) => {
    const rates = state.resourceRates[resourceType];
    return rates ? rates.net : 0;
  };
  ```

#### 7. ResourceRatesProvider Implementation

- [x] Implement ResourceRatesProvider using createContext and useReducer:

  ```typescript
  // Create context
  type ResourceRatesContextType = {
    state: ResourceRatesState;
    dispatch: React.Dispatch<ResourceRatesAction>;
  };

  const ResourceRatesContext = createContext<ResourceRatesContextType | undefined>(undefined);

  // Provider component
  export const ResourceRatesProvider: React.FC<{
    children: React.ReactNode;
    manager?: ResourceManager;
    initialState?: Partial<ResourceRatesState>;
  }> = ({ children, manager, initialState: initialStateOverride }) => {
    // Get initial state from ResourceManager if available
    const effectiveInitialState = useMemo(() => {
      if (manager) {
        try {
          const rates = manager.getAllResourceRates?.() || defaultResourceRates;
          return {
            ...initialState,
            resourceRates: rates,
            ...(initialStateOverride || {}),
          };
        } catch (error) {
          console.error('Error getting resource rates from manager:', error);
        }
      }
      return { ...initialState, ...(initialStateOverride || {}) };
    }, [manager, initialStateOverride]);

    // Create reducer
    const [state, dispatch] = useReducer(resourceRatesReducer, effectiveInitialState);

    // Set up event subscriptions with the manager when provided
    useEffect(() => {
      if (manager) {
        // Create event handler with dispatch
        const eventHandler = (event: BaseEvent) => {
          if (event.data && typeof event.data === 'object' && 'resourceType' in event.data) {
            const resourceType = event.data.resourceType as ResourceType;
            const rates = calculateRatesFromEvent(event);
            dispatch(createUpdateRateAction(resourceType, rates));
          }
        };

        // Set up event subscriptions
        const unsubscribeResourceUpdated = manager.subscribeToEvent(
          EventType.RESOURCE_UPDATED,
          eventHandler
        );

        const unsubscribeResourceProduced = manager.subscribeToEvent(
          EventType.RESOURCE_PRODUCED,
          eventHandler
        );

        const unsubscribeResourceConsumed = manager.subscribeToEvent(
          EventType.RESOURCE_CONSUMED,
          eventHandler
        );

        // Clean up subscriptions
        return () => {
          unsubscribeResourceUpdated();
          unsubscribeResourceProduced();
          unsubscribeResourceConsumed();
        };
      }
      return undefined;
    }, [manager]);

    // Create context value
    const contextValue = useMemo(() => ({ state, dispatch }), [state]);

    return (
      <ResourceRatesContext.Provider value={contextValue}>
        {children}
      </ResourceRatesContext.Provider>
    );
  };
  ```

#### 8. ResourceManager Integration

- [x] Add getAllResourceRates method to ResourceManager:

  ```typescript
  public getAllResourceRates(): Record<ResourceType, { production: number; consumption: number; net: number }> {
    const rates: Record<ResourceType, { production: number; consumption: number; net: number }> = {} as Record<
      ResourceType,
      { production: number; consumption: number; net: number }
    >;

    // Initialize with default rates for all resource types
    const resourceTypes = ['minerals', 'energy', 'population', 'research', 'plasma', 'gas', 'exotic'];

    // Set rates for each resource type
    resourceTypes.forEach(typeKey => {
      const type = typeKey as ResourceType;
      const state = this.getResourceState(type);
      rates[type] = {
        production: state?.production || 0,
        consumption: state?.consumption || 0,
        net: (state?.production || 0) - (state?.consumption || 0)
      };
    });

    return rates;
  }
  ```

#### 9. useResourceRates Hook Enhancement

- [x] Enhance hook with selectors:

  ```typescript
  // Hook to use the context
  export const useResourceRates = <T>(selector: (state: ResourceRatesState) => T): T => {
    const context = useContext(ResourceRatesContext);
    if (!context) {
      throw new Error('useResourceRates must be used within a ResourceRatesProvider');
    }
    return selector(context.state);
  };

  // Hook to use the dispatch function
  export const useResourceRatesDispatch = (): React.Dispatch<ResourceRatesAction> => {
    const context = useContext(ResourceRatesContext);
    if (!context) {
      throw new Error('useResourceRatesDispatch must be used within a ResourceRatesProvider');
    }
    return context.dispatch;
  };

  // Specialized hooks for specific resource types
  export const useResourceRate = (resourceType: ResourceType): ResourceRateDetail => {
    return useResourceRates((state: ResourceRatesState) => state.resourceRates[resourceType]);
  };

  export const useNetResourceRate = (resourceType: ResourceType): number => {
    return useResourceRates((state: ResourceRatesState) => {
      const rates = state.resourceRates[resourceType];
      return rates ? rates.net : 0;
    });
  };
  ```

#### 10. Testing

- [x] Create comprehensive tests:
  - Verify resource rate calculations match expected values
  - Test event subscriptions and cleanup
  - Verify context updates when ResourceManager emits events
  - Test selectors return correct values
- [x] Fix circular dependency issue in ResourceRatesProvider
  - Replaced createStandardContext with direct React context implementation
  - Removed dependency on useContextDispatch within the provider
  - All tests now pass successfully

### ModuleContext Refactoring - Detailed Implementation Plan

#### 1. Action Type Definition

- [x] Create ModuleActionType enum:
  ```typescript
  export enum ModuleActionType {
    ADD_MODULE = 'module/addModule',
    UPDATE_MODULE = 'module/updateModule',
    REMOVE_MODULE = 'module/removeModule',
    SELECT_MODULE = 'module/selectModule',
    SET_ACTIVE_MODULES = 'module/setActiveModules',
    SET_LOADING = 'module/setLoading',
    SET_ERROR = 'module/setError',
  }
  ```

#### 2. State Interface Definition

- [x] Define ModuleState interface:
  ```typescript
  export interface ModuleState extends BaseState {
    modules: Record<string, Module>;
    activeModuleIds: string[];
    selectedModuleId: string | null;
    categories: string[];
  }
  ```

#### 3. Reducer Implementation

- [x] Create moduleReducer:
  ```typescript
  export const moduleReducer = (state: ModuleState, action: ModuleAction): ModuleState => {
    switch (action.type) {
      case ModuleActionType.ADD_MODULE:
        return {
          ...state,
          modules: {
            ...state.modules,
            [action.payload.module.id]: action.payload.module,
          },
          lastUpdated: Date.now(),
        };
      case ModuleActionType.UPDATE_MODULE:
        return {
          ...state,
          modules: {
            ...state.modules,
            [action.payload.moduleId]: {
              ...state.modules[action.payload.moduleId],
              ...action.payload.updates,
            },
          },
          lastUpdated: Date.now(),
        };
      // Additional cases for other actions
      default:
        return state;
    }
  };
  ```

#### 4. Manager Configuration

- [x] Create ModuleManager configuration:

  ```typescript
  const managerConfig: ManagerConfig<ModuleState, ModuleManager> = {
    connect: (manager: ModuleManager, dispatch) => {
      // Event subscriptions
      const unsubscribeModuleCreated = manager.subscribeToEvent(
        ModuleEventType.MODULE_CREATED,
        event => {
          dispatch({
            type: ModuleActionType.ADD_MODULE,
            payload: { module: event.data.module },
          });
        }
      );

      // Additional subscriptions

      return () => {
        unsubscribeModuleCreated();
        // Cleanup other subscriptions
      };
    },

    getInitialState: (manager: ModuleManager) => {
      // Get initial modules and state
      const modules = manager.getAllModules();
      const moduleMap = modules.reduce(
        (acc, module) => {
          acc[module.id] = module;
          return acc;
        },
        {} as Record<string, Module>
      );

      return {
        modules: moduleMap,
        activeModuleIds: manager.getActiveModuleIds(),
        selectedModuleId: null,
        categories: manager.getModuleCategories(),
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      };
    },
  };
  ```

#### 5. Context Selectors

- [x] Create performance-optimized selectors:
  ```typescript
  export const selectModules = (state: ModuleState) => state.modules;
  export const selectModuleById = (state: ModuleState, id: string) => state.modules[id];
  export const selectActiveModules = (state: ModuleState) => {
    return state.activeModuleIds.map(id => state.modules[id]).filter(Boolean);
  };
  export const selectSelectedModule = (state: ModuleState) => {
    return state.selectedModuleId ? state.modules[state.selectedModuleId] : null;
  };
  ```

#### 6. Provider Implementation

- [x] Implement ModuleProvider using createStandardContext:
  ```typescript
  export const [ModuleProvider, useModules] = createStandardContext<
    ModuleState,
    ModuleAction,
    ModuleManager
  >({
    name: 'Module',
    reducer: moduleReducer,
    initialState: {
      modules: {},
      activeModuleIds: [],
      selectedModuleId: null,
      categories: [],
      isLoading: false,
      error: null,
      lastUpdated: Date.now(),
    },
    managerConfig,
  });
  ```

#### 7. Enhanced Hooks

- [x] Create specialized hooks:

  ```typescript
  export const useModule = (moduleId: string) => {
    return useModules(state => selectModuleById(state, moduleId));
  };

  export const useActiveModules = () => {
    return useModules(selectActiveModules);
  };

  export const useSelectedModule = () => {
    return useModules(selectSelectedModule);
  };
  ```

### GameContext Refactoring - Detailed Implementation Plan

#### 1. Action Type Definition

- [x] Create GameActionType enum:
  ```typescript
  export enum GameActionType {
    START_GAME = 'game/startGame',
    PAUSE_GAME = 'game/pauseGame',
    RESUME_GAME = 'game/resumeGame',
    END_GAME = 'game/endGame',
    UPDATE_GAME_STATE = 'game/updateGameState',
    SET_LOADING = 'game/setLoading',
    SET_ERROR = 'game/setError',
  }
  ```

#### 2. Action Creator Implementation

- [x] Create typed action creators
- [x] Implement reducer function
- [x] Create context selectors
- [ ] Fix circular dependency issue in GameProvider (similar to ResourceRatesContext fix)

### Next Steps

1. Complete ModuleContext refactoring

   - Implement direct React context implementation similar to ResourceRatesContext
   - Fix any circular dependencies
   - Ensure proper event subscription handling
   - Create comprehensive tests for ModuleContext

2. Implement ResourceRatesContext integration with UI components

   - Create resource rate visualization components
   - Implement resource trend displays
   - Add forecasting capabilities based on current rates
   - Ensure responsive updates when rates change

3. Begin performance monitoring implementation
   - Create baseline performance metrics
   - Implement component render time tracking
   - Add event processing monitoring
   - Create visualization tools for performance metrics

## Phase 2: Exploration System Implementation

### ExplorationManager Enhancement

- [x] Complete ExplorationManager implementation according to BaseManager interface
- [x] Add proper event emission for exploration events
- [x] Connect with ReconShipManager for ship coordination
- [ ] Implement sector discovery algorithms
- [ ] Add anomaly and resource detection logic
- [ ] Integrate with data analysis system

### Data Analysis System

- [x] Complete DataAnalysisContext integration with ExplorationManager
- [x] Enhance automatic dataset creation from exploration events
- [ ] Implement advanced filtering and analysis algorithms
- [ ] Optimize data transformation and storage
- [ ] Add real-time visualization updates

### Discovery Classification

- [x] Complete DiscoveryClassification component implementation
- [ ] Implement classification algorithms for anomalies and resources
- [ ] Connect classification system to resource system
- [ ] Add visualization for classification results
- [ ] Implement user feedback mechanisms for classification

## Phase 3: Performance Optimization

### Monitoring and Profiling

- [ ] Implement performance monitoring for critical paths
  - Resource flow optimization
  - Event distribution
  - UI rendering
- [ ] Create performance profiling tools with metrics
- [ ] Add runtime performance visualization
- [ ] Implement warning system for performance issues

### Optimization Implementations

- [ ] Optimize ResourceFlowManager calculation algorithm
  - Implement incremental updates
  - Add caching for expensive calculations
  - Optimize node and edge traversal
- [x] Enhance event system performance
  - [x] Implement event batching for high-frequency events
  - [ ] Add priority queue for event processing
  - [x] Create event filtering to reduce unnecessary processing
- [ ] Improve rendering performance
  - [ ] Use React.memo for list components
  - [ ] Implement specialized equality checks
  - [ ] Use useMemo for derived data calculations
  - [ ] Add virtualization for long lists

## Phase 4: Testing and Quality Assurance

### Unit Test Expansion

- [x] Expand unit test coverage for core systems
  - [x] ResourceFlowManager
  - [x] EventSystem
  - [ ] ExplorationManager
  - [x] ModuleManager
- [ ] Implement component unit tests
- [ ] Create service tests for manager implementations

### Integration Testing

- [x] Complete integration tests for system boundaries
  - [ ] ResourceManager-GameContext
  - [ ] ModuleManager-ModuleContext
  - [ ] ThresholdContext-ResourceManager
  - [x] ExplorationManager-DataAnalysisContext
- [ ] Create end-to-end tests for core gameplay flows
- [ ] Test boundary interactions between systems
- [ ] Implement module lifecycle tests

### Simulation Testing

- [ ] Create simulation tests for complex system interactions
  - Resource flow optimization
  - Module upgrade chains
  - Exploration and discovery
- [ ] Implement automated architectural validation
- [ ] Add performance regression testing

## Phase 5: User Interface Enhancement

### Resource Management Dashboard

- [ ] Create comprehensive Resource Management Dashboard
  - Combine all resource visualization components
  - Add resource forecasting with trend visualization
  - Implement resource optimization suggestions
- [x] Enhance ResourceFlowDiagram
  - [x] Add detailed node statistics
  - [ ] Implement optimization indicators
  - [ ] Create interactive optimization controls

### Exploration Interface

- [ ] Create unified exploration interface
  - Integrate sector scanning controls
  - Add anomaly analysis visualization
  - Implement classification interface
  - Display resource potential visualization
- [ ] Enhance map visualization
  - Add real-time updates for discoveries
  - Implement heat maps for resource concentration
  - Create visual indicators for anomalies

### System Integration UI

- [ ] Implement central system integration dashboard
  - Create system status visualization
  - Add performance monitoring interface
  - Implement system connection visualization
- [ ] Enhance error handling and user feedback
  - Add detailed error messages
  - Implement recovery suggestions
  - Create system health indicators

## Implementation Approach

### For Each Component Implementation:

1. **Analysis Phase:**

   - Review existing code in the component directory
   - Identify dependencies and integration points
   - Map event flow and state management patterns
   - Catalog type definitions and interfaces

2. **Design Phase:**

   - Define clear interfaces and types
   - Create component architecture diagram
   - Identify reusable patterns and utilities
   - Plan testing strategy

3. **Implementation Phase:**

   - Start with core functionality
   - Implement using standardized patterns
   - Follow type-safe practices
   - Add proper event handling and context integration

4. **Testing Phase:**

   - Create unit tests for core functionality
   - Implement integration tests for system boundaries
   - Test performance characteristics
   - Verify error handling and edge cases

5. **Documentation Phase:**
   - Update component documentation
   - Add implementation notes
   - Document integration points
   - Create usage examples

## Type Standardization Approach

For each system being implemented or refactored:

1. Define core types and interfaces in dedicated type files
2. Use enums instead of string literals for defined types
3. Create helper utilities for type conversion and validation
4. Implement strict type checking and avoid "any" types
5. Use generics for reusable components and functions
6. Document type interfaces with JSDoc comments
7. Add runtime validation for external data

## Action Items and Progress

| Task                                   | Status | Notes                                                    |
| -------------------------------------- | ------ | -------------------------------------------------------- |
| GameContext Refactoring                | ✅     | Completed with proper React context implementation       |
| ResourceRatesContext Refactoring       | ✅     | Completed with proper React context implementation       |
| ModuleContext Refactoring              | ✅     | Completed with proper React context implementation       |
| ModuleContext Tests                    | 🔄     | In progress - Type compatibility issues mostly fixed     |
| Data Analysis System Enhancements      | 🔄     | In progress - implementing data collection pipeline      |
| Performance Monitoring                 | 🔄     | Planning phase - defining metrics and collection methods |
| Resource Management Dashboard          | 🔄     | Design phase - wireframes created                        |
| Unified Exploration Interface          | 🔄     | Research phase - evaluating component structure          |
| Expand Integration Test Coverage       | 🔄     | In progress - focusing on critical paths                 |
| Optimize ResourceFlowManager Algorithm | 🔄     | Analysis phase - profiling performance bottlenecks       |

### Next Immediate Tasks

#### ModuleContext Tests Completion

- ✅ Fixed hook usage with proper selector functions
- ✅ Added missing `moduleType` property to event data objects
- ✅ Updated TestModule to use proper Position type from GameTypes
- ✅ Fixed ServiceContext initialization with empty object instead of null
- ✅ Made isActive a required boolean in TestModule
- 🔄 Need to resolve remaining type compatibility issues with Module interface

#### Event System Standardization

- ✅ Created EventDataTypes.ts with proper type mapping
- ✅ Fixed event type compatibility issues between different event systems
- ✅ Fixed BaseEvent compatibility with event data types
- 🔄 Standardize event validation across the application
- 🔄 Implement proper error handling for invalid events

#### ResourceRatesContext UI Integration

- 🔄 Create ResourceRatesDisplay component
- 🔄 Implement ResourceRatesTrends visualization
- 🔄 Add resource rate filtering capabilities

#### ExplorationManagerImpl Refactoring

- 🔄 Identify circular dependencies
- 🔄 Implement proper event handling
- 🔄 Create comprehensive tests

### ModuleContext Test Improvements

We've made substantial progress in fixing the ModuleContext test implementation:

1. **Fixed Type Compatibility Issues**:

   - Added missing `moduleType` property to all event data objects to comply with BaseEvent interface
   - Updated TestModule interface to use proper Position type from GameTypes
   - Made isActive a required boolean property instead of optional
   - Fixed ServiceContext initialization with empty object instead of null
   - Properly typed service registry to avoid use of `any`

2. **Fixed Hook Usage**:

   - Corrected useModules to properly accept selector functions
   - Used the correct API pattern for useModule and useModuleActions
   - Fixed component implementations to match the actual hook usage

3. **Improved Event Emissions**:
   - Added proper type annotations for event data
   - Ensured all events contain required properties
   - Implemented correct event emission pattern

### Remaining Issues in ModuleContext Tests

1. **Module vs TestModule Compatibility**:

   - There are still some incompatibilities between our TestModule interface and the actual Module interface:
     - The `level` property in TestModule is optional, but required in Module
     - May need to fully align our test types with production types

2. **Event Validation**:
   - Need to implement comprehensive event validation logic
   - Consider using validation functions from EventDataTypes.ts

### Next Steps for Testing

1. Resolve remaining type compatibility issues between TestModule and Module
2. Create helper utilities for generating test modules with valid properties
3. Implement proper event validation in test modules
4. Consider extracting common testing patterns to a reusable utility file

# ModuleContext Testing - Implementation Summary

We've significantly improved the ModuleContext test implementation by:

## 1. Creating Properly Typed Test Modules

- Implemented a `TestModule` interface that fully matches the actual `Module` interface
- Added all required properties to prevent type compatibility issues
- Created a `createTestModule` factory function that ensures all modules have required fields

```typescript
interface TestModule {
  id: string;
  name: string;
  type: ModuleType;
  status: ModuleStatus;
  position: Position;
  level: number; // Required property
  isActive: boolean;
  buildingId?: string;
  attachmentPointId?: string;
  progress?: number;
  subModules?: Array<unknown>;
  parentModuleId?: string;
}

function createTestModule(overrides: Partial<TestModule> = {}): TestModule {
  return {
    id: `module-${Date.now()}`,
    name: 'Test Module',
    type: 'radar' as ModuleType,
    status: ModuleStatus.ACTIVE,
    position: { x: 0, y: 0 },
    level: 1,
    isActive: true,
    ...overrides,
  };
}
```

## 2. Adding Building Support

- Created a `TestBuilding` interface compatible with `ModularBuilding`
- Added proper building type handling with `BuildingType` enum
- Implemented building-module association tracking

```typescript
interface TestBuilding {
  id: string;
  type: BuildingType;
  name?: string;
  level: number;
  modules: TestModule[];
  status: 'active' | 'constructing' | 'inactive';
  attachmentPoints: Array<{
    id: string;
    position: Position;
    allowedTypes: ModuleType[];
    occupied: boolean;
    currentModule?: string;
  }>;
}
```

## 3. Implementing Proper Event Validation

- Added event data validation to ensure correct structure
- Made event emission type-safe by validating before emitting
- Created reusable validation utility

```typescript
function validateAndEmitEvent<T extends EventType>(
  eventBus: EventBus<BaseEvent>,
  eventType: T,
  eventData: BaseEvent
): void {
  if (!validateEventData(eventType, eventData)) {
    console.error(`Invalid event data for ${eventType}`, eventData);
    throw new Error(`Invalid event data for ${eventType}`);
  }

  eventBus.emit(eventData);
}
```

## 4. Making ModuleManagerWrapper Fully IModuleManager Compatible

- Implemented all required IModuleManager interface methods
- Added support for module categorization and filtering
- Handled building-module associations properly
- Updated event emission to match production behavior

### Remaining Issues

While we've made significant progress, there are still type compatibility issues to resolve:

1. `TestModule` vs `BaseModule` status compatibility (enum vs string literal)
2. Building attachment point type compatibility
3. Array type compatibility between string arrays and object arrays

### Next Steps

To complete the ModuleContext test implementation:

1. Align `TestModule.status` with `BaseModule.status` by ensuring compatible types
2. Fix attachment point compatibility by providing all required fields
3. Properly handle module references in buildings (using IDs vs. objects)
4. Add more specific tests for type validation and error handling

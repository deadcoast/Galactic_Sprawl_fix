# System Scratchpad

## Code Consolidation Progress (from Repair_Scratchpad.md)

**Review Repair_Scratchpad.md for complete context**

- [ ] Task-007: Implement Chart Component Strategy Pattern
- [ ] Task-008: Refactor Manager Implementations
- [ ] Task-009: Implement UI Component Hierarchy
- [ ] Task-010: Implement Error Boundary System
- [ ] Task-011: Standardize Testing Utilities
- [ ] Task-012: Consolidate Data Transformation Utilities
- [ ] Task-013: Create Common Type Definitions

## Resource Type Standardization Progress

- [x] Created a comprehensive fix script (`fix_resources.sh`) that combines all resource type fixes
- [x] Fixed ResourceTypeMigration.ts imports to include ResourceTypeString
- [x] Fixed duplicate imports in ResourceDiscoverySystem.tsx
- [x] Updated component props to use ResourceType enum instead of string
- [x] Fixed string literals to use ResourceType enum values
- [x] Fixed object literals with string resourceType
- [x] Fixed specific files with remaining issues
- [x] Fixed files that use ResourceTypeMigration
- [x] Fixed duplicate React imports
- [ ] Address remaining TypeScript errors (~1372 remaining, down from 1785)

### Next Steps for Resource Type Standardization

1. **Address Remaining Resource Type Errors**:

   - Focus on components with the most errors first
   - Update function parameters to accept ResourceType
   - Add type conversion where needed

2. **Fix React Type Definition Conflicts**:

   - Ensure esModuleInterop is enabled in tsconfig.json
   - Fix remaining import issues in components

3. **Improve Type Safety**:
   - Replace 'any' types with proper interfaces
   - Implement generics for reusable components
   - Add type guards where necessary

## Next Priority Task: Chart Component Strategy Pattern (Task-007)

The next priority task is to implement a chart component system using the strategy pattern to allow for different rendering strategies (Canvas, SVG, WebGL) while maintaining a consistent API.

### Implementation Steps

1. Create a base Chart component with renderer strategies
2. Implement different rendering strategies (Canvas, SVG, WebGL)
3. Create a unified API for chart configuration
4. Implement performance optimizations for each renderer
5. Add support for different chart types (line, bar, scatter, etc.)
6. Create comprehensive documentation and examples

## Pending Tasks

### UI and Visualization Enhancements

- [ ] Implementing advanced WebGL shader effects for data highlighting
- [ ] Creating heat-based rendering for density visualization
- [ ] Developing a particle system for animated data transitions
- [ ] Supporting custom visual encodings through shaders
- [ ] Cross-Chart Coordination: Synchronized interactions across multiple visualizations

### Integration Issues

- [ ] Fix Material UI dependency issues

  - Updated Material UI packages to correct version (5.15.11)
  - Added required peer dependencies (@emotion/react and @emotion/styled)
  - Verified type safety in components using Material UI

- [ ] Front-End and Back-End Integration
  - [x] Create proper API interfaces between services and UI components
  - [ ] Implement service provider pattern for dependency injection
  - [ ] Add service registration in the application bootstrap process
    - [x] Updated ErrorLoggingService to implement BaseService
    - [x] Updated APIService to implement BaseService
    - [ ] Updated RecoveryService to implement BaseService
    - [ ] Updated ComponentRegistryService to implement BaseService
    - [ ] Updated EventPropagationService to implement BaseService
  - [ ] Create end-to-end tests for service-to-UI integration

### Advanced Analysis Implementation

- [ ] Anomaly Detection Enhancement

  - [ ] Implement statistical anomaly detection
  - [ ] Add isolation forest algorithm for complex anomalies
  - [ ] Create anomaly visualization with highlighting
  - [ ] Implement anomaly explanation generation

- [ ] Worker Enhancement
  - [ ] Add progress reporting for long-running tasks
  - [ ] Implement worker pooling for multiple parallel operations
  - [ ] Create typed transfer objects for efficient data passing
  - [ ] Add cancellation support for in-progress operations

### Performance Improvements

- [ ] API Optimization

  - [ ] Implement server-side pagination for very large datasets
  - [ ] Create data streaming capabilities for real-time updates
  - [ ] Add automatic data aggregation for time series data
  - [ ] Implement query optimization for complex analysis operations

- [ ] Advanced Canvas Features
  - [ ] Add WebGL shader effects for data highlighting
  - [ ] Implement heat-based rendering for density visualization
  - [ ] Create particle system for animated data transitions
  - [ ] Support for custom visual encodings through shaders

### Future Enhancements

- [ ] Advanced WebGL Features

  - [ ] Implement custom shaders for enhanced visual effects
  - [ ] Add GPU-based data processing for large datasets
  - [ ] Create WebGL-based picking for advanced interaction
  - [ ] Implement instanced rendering for repeated elements

- [ ] Real-Time Data Visualization

  - [ ] Create streaming data support for real-time updates
  - [ ] Implement efficient appending to existing datasets
  - [ ] Add animated transitions for data changes
  - [ ] Create time-window based rendering for streaming data

- [ ] Cross-Chart Coordination
  - [ ] Implement synchronized zooming/panning across charts
  - [ ] Create linked brushing for multi-view exploration
  - [ ] Add synchronized highlighting across visualizations
  - [ ] Implement shared color scales and legends

## STAGE 1 DUPLICATE IDENTIFICATION PLAN

### 1. Pattern-Based Search Strategy

[ ] Common Naming Patterns
[ ] Directory Structure Analysis
[ ] Implementation Patterns

### 2. Functionality-Based Search

[ ] Core Services
[ ] Component Patterns
[ ] Data Management

### 3. Systematic Code Analysis

[ ] Use grep_search for common patterns
[ ] Use codebase_search for similar functionality
[ ] Cross-reference with dependencies and imports

### 4. Documentation Analysis

[ ] Review architecture docs
[ ] Check integration docs

### 5. Test Coverage Analysis

[ ] Analyze test files

### Success Metrics

- [ ] All files categorized by functionality
- [ ] Duplicate patterns identified and documented
- [ ] Clear consolidation priorities established
- [ ] Impact assessment completed
- [ ] Migration paths outlined

## Completed Tasks

- [x] EventEmitter Consolidation and Enhancement
- [x] Resource Type Standardization (migrated to 04_RESOURCES.md)

# Code Consolidation Tasklist

## Phase 1: Critical Infrastructure Consolidation (VERY HIGH Priority)

### Service Pattern Standardization

- [ ] Create a base `SingletonService` abstract class
  - Target files:
    - `/src/services/DataProcessingService.ts`
    - `/src/services/WorkerService.ts`
    - `/src/services/ErrorLoggingService.ts`
    - `/src/services/APIService.ts`
    - `/src/services/RealTimeDataService.ts`
    - `/src/services/WebGLService.ts`
    - `/src/services/RecoveryService.ts`
  - Implementation: Extract common singleton pattern into reusable base class

### Service Registry Unification

- [ ] Consolidate service registry implementations
  - Target files:
    - `/src/lib/managers/ServiceRegistry.ts`
    - `/src/lib/services/ServiceRegistry.ts`
  - Implementation: Create unified service registry with clear separation of concerns

## Phase 2: Core System Consolidation (HIGH Priority)

### Event System Unification

- [ ] Create unified event system architecture
  - Target files:
    - `/src/lib/events/EventBus.ts`
    - `/src/lib/utils/EventEmitter.ts`
    - `/src/utils/events/EventDispatcher.tsx`
    - `/src/utils/events/EventCommunication.ts`
  - Implementation: Implement a unified event system with adapters for different contexts

### Resource Management Consolidation

- [ ] Unify resource management systems
  - Target files:
    - `/src/managers/game/ResourceManager.ts`
    - `/src/managers/resource/ResourceFlowManager.ts`
    - `/src/managers/resource/ResourceStorageManager.ts`
    - `/src/managers/resource/ResourceTransferManager.tsx`
    - `/src/hooks/resources/useResourceManagement.tsx`
  - Implementation: Create a unified resource management system with specialized components

### Manager Pattern Standardization

- [ ] Create base manager class for singleton managers
  - Target files:
    - `/src/managers/weapons/AdvancedWeaponEffectManager.ts`
    - `/src/managers/combat/EnvironmentalHazardManager.ts`
    - `/src/managers/game/assetManager.ts`
    - `/src/managers/ai/BehaviorTreeManager.ts`
  - Implementation: Extract common singleton pattern into reusable base class

### Visualization Component Consolidation

- [ ] Unify chart component system

  - Target files:
    - `/src/components/exploration/visualizations/charts/BaseChart.tsx`
    - `/src/components/exploration/visualizations/charts/CanvasLineChart.tsx`
    - `/src/components/exploration/visualizations/charts/LineChart.tsx`
    - `/src/components/exploration/visualizations/charts/VirtualizedLineChart.tsx`
  - Implementation: Create a unified chart component system with renderer strategy pattern

- [ ] Consolidate memory optimization for visualization

  - Target files:
    - `/src/components/exploration/visualizations/MemoryOptimizedCharts.tsx`
    - `/src/components/exploration/MemoryOptimizedCanvasDemo.tsx`
    - `/src/components/exploration/visualizations/charts/MemoryOptimizedCanvasChart.tsx`
  - Implementation: Refactor into a unified memory optimization system

- [ ] Unify resource visualization components
  - Target files:
    - `/src/components/ui/ResourceVisualization.tsx`
    - `/src/components/ui/ResourceVisualizationEnhanced.tsx`
    - `/src/components/ui/resource/ResourceFlowDiagram.tsx`
    - `/src/components/ui/resource/ResourceDistributionChart.tsx`
    - `/src/components/ui/resource/ResourceThresholdVisualization.tsx`
    - `/src/components/ui/resource/ResourceForecastingVisualization.tsx`
    - `/src/effects/component_effects/ResourceFlowVisualization.tsx`
  - Implementation: Create a unified resource visualization library

### Hook Pattern Standardization

- [ ] Create hook factories for common patterns
  - Target files:
    - `/src/hooks/services/useService.ts`
    - `/src/hooks/modules/useSubModules.ts`
    - `/src/hooks/modules/useModuleUpgrade.ts`
  - Implementation: Create hook factories or higher-order hooks for common patterns

### System Integration Architecture

- [ ] Create unified system integration architecture
  - Target files:
    - `/src/components/core/SystemIntegration.tsx`
    - `/src/components/core/ThresholdIntegration.tsx`
    - `/src/components/exploration/ExplorationSystemIntegration.tsx`
    - `/src/managers/resource/ResourceIntegration.ts`
    - `/src/managers/mining/MiningResourceIntegration.ts`
    - `/src/initialization/gameSystemsIntegration.ts`
  - Implementation: Create a unified system integration architecture with specialized modules

## Phase 3: Secondary System Consolidation (MEDIUM Priority)

### Event Processing Pipeline

- [ ] Consolidate event processing components
  - Target files:
    - `/src/utils/events/EventBatcher.ts`
    - `/src/utils/events/EventFilter.ts`
    - `/src/utils/events/EventPrioritizer.ts`
  - Implementation: Create a unified event processing pipeline

### Module Management System

- [ ] Unify module management system
  - Target files:
    - `/src/managers/module/ModuleManager.ts`
    - `/src/managers/module/ModuleManagerWrapper.ts`
    - `/src/managers/module/ModuleManagerWrapper.test.ts`
  - Implementation: Refactor into a unified module system with clear interfaces

### Performance Monitoring System

- [ ] Create centralized performance monitoring
  - Target files:
    - `/src/services/telemetry/SessionPerformanceTracker.ts`
    - `/src/hooks/performance/useSessionPerformance.ts`
    - `/src/utils/performance/hookPerformanceMonitor.ts`
  - Implementation: Create a centralized performance monitoring system

### Animation Optimization System

- [ ] Unify animation frame management
  - Target files:
    - `/src/utils/performance/D3AnimationFrameManager.ts`
    - `/src/utils/performance/D3AnimationQualityManager.ts`
    - `/src/utils/performance/animationFrameManagerInstance.ts`
  - Implementation: Create a unified animation optimization system with D3 adapter if needed

### UI Component Standardization

- [ ] Create unified button component system

  - Target files:
    - `/src/components/ui/Button.tsx`
    - `/src/components/ui/common/Button.tsx`
    - `/src/components/ui/buttons/AbilityButton.tsx`
  - Implementation: Create a configurable button component system with composition for specialized behavior

- [ ] Unify error boundary implementations
  - Target files:
    - `/src/components/ui/GlobalErrorBoundary.tsx`
    - `/src/components/ui/VPRErrorBoundary.tsx`
    - `/src/components/ui/visualizations/errors/D3VisualizationErrorBoundary.tsx`
    - `/src/components/ui/visualizations/errors/VisualizationErrorBoundaries.tsx`
  - Implementation: Create a unified error boundary system with specialized handlers for different contexts

### Visualization Data Transformation

- [ ] Extract common data transformation logic
  - Target files:
    - `/src/components/exploration/visualizations/AnalysisVisualization.tsx`
    - `/src/components/exploration/visualizations/charts/ResourceMappingVisualization.tsx`
    - Various chart components
  - Implementation: Extract data transformation utilities

### Chart Component Interface Standardization

- [ ] Create common interface hierarchy
  - Target files:
    - Various chart components with duplicated props
  - Implementation: Create common interface hierarchy for chart components

### Game System Consolidation

- [ ] Unify combat management system

  - Target files:
    - `/src/managers/combat/combatManager.ts`
    - `/src/managers/combat/CombatMechanicsSystem.ts`
    - `/src/components/combat/CombatSystemDemo.tsx`
  - Implementation: Create a unified combat management system

- [ ] Unify ship management system
  - Target files:
    - `/src/managers/ships/ShipManagerImpl.ts`
    - `/src/factories/ships/ShipClassFactory.ts`
    - `/src/hooks/ships/useShipClassManager.ts`
  - Implementation: Create a unified ship management system

### Callback Pattern Standardization

- [ ] Extract reusable callback patterns
  - Target files:
    - `/src/hooks/ships/useShipEffects.ts`
    - `/src/hooks/modules/useModuleState.ts`
    - `/src/hooks/modules/useSubModules.ts`
  - Implementation: Extract reusable callback patterns into utility hooks

### Component Lifecycle Management

- [ ] Standardize lifecycle management
  - Target files:
    - `/src/hooks/ui/useComponentLifecycle.ts`
    - Various event subscription implementations
  - Implementation: Standardize lifecycle management across components

## Phase 4: Low Priority Consolidation (LOW Priority)

### Worker Implementation

- [ ] Implement worker factory pattern
  - Target files:
    - `/src/workers/worker.ts`
    - `/src/workers/ResourceFlowWorker.ts`
    - `/src/workers/DataProcessingWorker.ts`
  - Implementation: Implement a worker factory pattern with specialized workers

### Testing Utilities

- [ ] Create unified testing utility library
  - Target files:
    - `/src/tests/utils/testUtils.tsx`
    - `/src/tests/utils/testPerformanceUtils.ts`
    - `/src/tests/utils/performanceTestUtils.ts`
  - Implementation: Create a unified testing utility library

### Visualization Error Handling

- [ ] Standardize visualization error handling
  - Target files:
    - `/src/components/ui/visualizations/errors/VisualizationErrorBoundaries.tsx`
    - `/src/tests/components/exploration/DataAnalysisSystem.test.tsx`
  - Implementation: Standardize error handling across visualization components

### Visualization Type Definitions

- [ ] Create shared type definitions
  - Target files:
    - `/src/types/exploration/AnalysisComponentTypes.ts`
    - `/src/types/exploration/DataAnalysisTypes.ts`
  - Implementation: Create shared type definitions for visualization components

## Completed Tasks

### Exploration System Consolidation

- [x] Unify exploration data processing

  - Resolution: Created unified exploration system with shared types, utilities, and components:
    - `/src/types/exploration/unified/ExplorationTypes.ts`
    - `/src/types/exploration/unified/ExplorationTypeUtils.ts`
    - `/src/components/exploration/unified/context/ExplorationContext.tsx`
    - `/src/components/exploration/unified/core/BaseAnalysisVisualizer.tsx`

- [x] Unify galaxy mapping components
  - Resolution: Created unified mapping component that provides consistent UI and behavior:
    - `/src/components/exploration/unified/core/BaseMap.tsx`
    - `/src/components/exploration/unified/system/GalaxyExplorationSystem.tsx`

## Progress Tracking

- Total Tasks: 25
- Completed: 2
- In Progress: 0
- Not Started: 23

## Next Steps

1. Begin with Phase 1 (VERY HIGH priority) tasks to establish core infrastructure patterns
2. Move to Phase 2 (HIGH priority) tasks once Phase 1 is complete
3. Continue with Phase 3 and 4 as resources allow

## Scratchpad

### Type Safety Improvements

[X] Create shared type definitions for chart components
[X] Fix `instanceof Date` type checking in WebGLRenderer
[ ] Resolve type compatibility issues in WebGLRenderer:

- Base ChartOptions vs ExtendedChartOptions compatibility
- Theme type comparisons
- Tick formatter parameter types
  [ ] Review and update other visualization component types
  [ ] Add type validation tests
  [ ] Implement automated type coverage reporting

### Code Structure

[ ] Fix case block declarations
[ ] Update unused variable handling
[ ] Improve ESLint configuration

### Logging

[ ] Implement logging service
[ ] Update console statements
[ ] Add logging configuration

[ ] Create System_Directory_Tree.md
[ ] Create System_Development_History.md
[ ] Update System_Architecture.md with phased restructuring plan
[ ] Complete initial analysis of code duplication patterns
[ ] Implement service registry consolidation
[ ] Standardize event system implementation
[ ] Unify resource management interfaces
[ ] Consolidate visualization component APIs
[ ] Set up integration testing framework
[ ] Document public APIs and integration points

[X] Fix useFactionBehavior.ts event system integration

- [x] Remove unused calculateTerritorySystems function
- [x] Integrate proper event handling using FactionEventType enum
- [x] Ensure consistent resource management through proper interfaces
- [x] Implement proper service access patterns
- [x] Fix linter errors following type standards

[ ] Update System Documentation

- [ ] Document useFactionBehavior.ts changes in System_Architecture.md
- [ ] Update integration points in System_Integration.md
- [ ] Add new event handling patterns to development history

[ ] Implement Remaining Tasks from System Architecture

- [ ] Complete Discovery Classification Visualization
- [ ] Continue system-wide performance optimization
- [ ] Expand test coverage and integration tests

[ ] Fix Resource Management System Integration

- [ ] Fix ResourceManager event handling
  - Fix unsubscribe/subscribe method implementation
  - Fix args usage in event handling
- [ ] Fix MiningResourceIntegration type issues
  - Remove duplicate ResourceType imports
  - Update OldResourceType references to use new ResourceType enum
  - Fix FlowNode and ResourceThreshold property issues
  - Implement proper event handling in MiningShipManagerImpl

### Current Focus

1. ResourceManager.ts event system fixes

   - Implement proper TypedEventEmitter methods
   - Fix event subscription handling

2. MiningResourceIntegration.ts standardization
   - Remove legacy resource type usage
   - Update to use standardized interfaces
   - Fix type definitions for flow nodes and thresholds

[X] Fix MiningResourceIntegration event system

- [x] Use proper EventEmitter types
- [x] Use proper event interfaces
- [x] Use proper resource type enums

[ ] Fix MiningShipManager resource types

- [ ] Convert string resourceType to ResourceType enum
- [ ] Update MiningTask interface to use proper types
- [ ] Update dispatchShipToResource to use ResourceType
- [ ] Add proper type guards and validation

### Current Focus

1. Convert string-based resource types to enums in MiningShipManager
2. Ensure consistent type usage across mining system
3. Implement proper type validation at boundaries

[ ] Fix Event Type Issues

- [ ] Update TechTreeEvents to satisfy Record<string, unknown>
- [ ] Update ModuleEvents to satisfy Record<string, unknown>
- [ ] Fix OfficerManager EventEmitter implementation
- [ ] Add missing getResourceNodes method to MiningShipManagerImpl

### Current Focus

1. Convert event interfaces to proper Record types
2. Fix EventEmitter implementations
3. Add missing methods
4. Remove unused @ts-expect-error

### Implementation Order

1. Fix base event types (TechTreeEvents, ModuleEvents)
2. Update manager implementations
3. Add missing methods
4. Clean up type assertions

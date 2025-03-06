## Tests

All tests are now located in the `src/tests/` directory, organized by test type.

### Unit Tests

- **Components**: `src/tests/components/` - Tests for React components
  - `exploration/` - Tests for exploration components
  - `buildings/` - Tests for building components
  - `ui/` - Tests for UI components
- **Managers**: `src/tests/managers/` - Tests for manager classes
  - `weapons/` - Tests for weapon managers
  - `resource/` - Tests for resource managers
  - `game/` - Tests for game managers
  - `automation/` - Tests for automation managers
  - `module/` - Tests for module managers
- **Hooks**: `src/tests/hooks/` - Tests for custom React hooks
- **Utils**: `src/tests/utils/` - Tests for utility functions
- **Contexts**: `src/tests/contexts/` - Tests for React contexts

### Integration Tests

- `src/tests/integration/resource/MiningResourceIntegration.test.ts` - Integration tests for the mining resource system
  - Tests the integration between MiningResourceIntegration, MiningShipManager, and ResourceFlowManager
  - Includes tests for mining node registration, ship assignment, and resource flow optimization
  - Uses type guards to validate custom event types
  - Properly implements spy objects with assertions
- `src/tests/integration/ResourceVisualization.test.tsx` - Integration tests for the ResourceVisualization UI component with complete ResourceTrackingResult mock implementations, testing resource visualization rendering with different resource states (normal, critical, abundant)

### End-to-End Tests

- `src/tests/e2e/README.md` - Documentation and setup instructions for E2E testing with Playwright
- `src/tests/e2e/models/MiningPage.ts` - Page Object Model for the Mining page used in E2E tests
- `src/tests/e2e/mining.spec.ts` - E2E tests for the Mining module functionality
- `src/tests/e2e/exploration.spec.ts` - E2E tests for the Exploration module functionality
- `src/tests/e2e/test-setup.ts` - Setup and teardown functions for E2E tests with dynamic port allocation

### Performance Tests

- `src/tests/performance/ResourceFlowManager.benchmark.ts` - Performance benchmarks for the ResourceFlowManager
- `src/tests/performance/EventProcessing.benchmark.ts` - Performance benchmarks for the event processing system with improved memory usage measurement and metrics calculation

### Tool Tests

- `src/tests/tools/fix-typescript-any.test.js` - Tests for the TypeScript 'any' type fixer tool

  - Tests various command-line options and functionality
  - Verifies proper handling of TypeScript files with 'any' types
  - Uses dynamic imports and proper mocking of global objects

- `src/tests/tools/setup-linting.test.js` - Tests for the ESLint and Prettier setup tool

  - Completely rewritten to use proper ES module mocking
  - Tests configuration file creation and validation
  - Verifies proper handling of existing configuration files
  - Uses manual mocks with both named and default exports

- `src/tests/tools/run-lint-workflow.test.js` - Tests for the lint workflow runner

  - Tests various command-line options and workflow steps
  - Verifies proper handling of errors and command failures
  - Uses dynamic imports and proper mocking of global objects

- `src/tests/tools/fix-eslint-by-rule.test.js` - Tests for the ESLint rule fixer

  - Tests various command-line options and rule fixing functionality
  - Verifies proper handling of errors and progress reporting
  - Uses dynamic imports and proper mocking of global objects

- `src/tests/tools/analyze-lint-errors.test.js` - Tests for the ESLint error analyzer
  - Tests various command-line options and error analysis functionality
  - Verifies proper handling of invalid input and timeout options
  - Uses dynamic imports and proper mocking of global objects

### Test Documentation

- `CodeBase_Docs/Test_Utilities_Guide.md` - Guide to using the enhanced test utilities
- `CodeBase_Docs/Integration_Testing_Best_Practices.md` - Guidelines for creating effective integration tests
- `CodeBase_Docs/ResourceFlowManager_Testing.md` - Documentation for ResourceFlowManager test implementation
- `CodeBase_Docs/UI_Testing_Best_Practices.md` - Comprehensive guide for component, integration, and E2E UI testing
- `CodeBase_Docs/Performance_Benchmark_Practices.md` - Best practices for performance benchmarking
- `CodeBase_Docs/Test_Issues_March_2025.md` - Comprehensive documentation of test issues identified in March 2025 and their solutions
  - Includes solutions for tool test mocking issues
  - Addresses WebSocket server port conflicts in E2E tests
  - Provides fixes for GameLoopManager error handling tests
  - Documents ResourceFlowManager test issues and solutions
  - Outlines next steps for improving test reliability

### Test Fixtures

- `src/tests/fixtures/index.ts` - Exports all fixtures for easy importing
- `src/tests/fixtures/resourceFixtures.ts` - Common resource test data
  - `resourceTypes` - Array of resource types
  - `resourceStates` - Record of resource states (empty, standard, abundant)
  - `resourcePriorities` - Array of resource priorities
  - `flowNodes` - Record of flow nodes (powerPlant, factory, storage, converter)
  - `flowConnections` - Array of flow connections
  - `resourceFlows` - Array of resource flows
- `src/tests/fixtures/explorationFixtures.ts` - Common exploration test data
  - `reconShips` - Array of recon ships
  - `sectors` - Array of sectors
  - `fleetFormations` - Array of fleet formations
  - `explorationTasks` - Array of exploration tasks
- `src/tests/fixtures/miningFixtures.ts` - Common mining test data
  - `miningShips` - Array of mining ships
  - `miningNodes` - Array of mining nodes
  - `miningHubs` - Array of mining hubs
  - `miningOperations` - Array of mining operations

### Test Utilities

- `src/tests/utils/index.ts` - Unified exports of all test utilities
- `src/tests/utils/testUtils.tsx` - Utility functions for testing React components

  - Provides functions for testing loading states, resource connections, and performance
  - Includes mock implementations of common hooks and contexts
  - Uses proper TypeScript typing for all utility functions

- `src/tests/utils/fixtureUtils.ts` - Utility functions for creating test fixtures

  - Provides functions for creating resource states, resource nodes, and other test objects
  - Uses type-specific defaults based on resource type
  - Properly implements TypeScript interfaces for type safety

- `src/tests/utils/asyncTestUtils.ts` - Utilities for testing asynchronous code

  - `wait` - Waits for a specified time
  - `waitForConditionAsync` - Waits for a condition to be true
  - `createDeferredPromise` - Creates a promise that can be resolved externally
  - `createMockEventEmitter` - Creates a mock event emitter
  - `createMockTimer` - Creates a mock timer for testing time-based functionality
  - `createMockRAF` - Creates a mock requestAnimationFrame implementation

- `src/tests/utils/performanceTestUtils.ts` - Utilities for performance testing

  - `measureExecTime` - Measures execution time of a function
  - `runBenchmark` - Runs a benchmark for a function
  - `createPerfReporter` - Creates a performance reporter for tracking metrics
  - `measureMemory` - Measures memory usage of a function

- `src/tests/utils/testUtilsUsageExample.test.tsx` - Example tests for the test utilities

  - Demonstrates proper usage of the test utilities
  - Uses CPU-intensive operations for reliable performance testing
  - Implements proper assertions for performance metrics

- `src/tests/setup.ts` - Main test setup file
- `src/tests/setup/testingLibrary.setup.ts` - Setup for React Testing Library

### NPM Scripts for Running Tests

The following npm scripts have been added to package.json to run different types of tests:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest src/tests/components src/tests/utils src/tests/hooks src/tests/managers",
    "test:integration": "vitest src/tests/integration",
    "test:e2e": "playwright test",
    "test:perf": "vitest src/tests/performance",
    "test:tools": "vitest src/tests/tools"
  }
}
```

### Automation System

- `src/managers/game/AutomationManager.ts` - Core manager for module automation, supporting complex condition types, action chaining, and rule lifecycle management. Includes robust type handling for mixed return types with proper type assertions and narrowing.
- `src/managers/automation/GlobalAutomationManager.ts` - System-wide manager for automation routines, integrating with module-specific automation, delegating rule management to AutomationManager
- `src/components/ui/automation/AutomationVisualization.tsx` - Main interface for visualizing and managing automation routines, including filtering, enabling/disabling, and accessing the visual rule editor
- `src/components/ui/automation/AutomationRuleEditor.tsx` - Visual programming interface for automation rules with drag-and-drop functionality, allowing users to create complex conditions and action chains
- `src/components/ui/automation/AutomationRuleEditor.css` - Styling for the visual programming interface with a modern, clean design
- `src/initialization/automationSystemInit.ts` - Bootstrap for automation system, registering default automation routines
- `src/hooks/automation/useAutomation.ts` - Custom React hook for accessing automation functionality from components

### UI Components

- `src/components/ui/resource/ChainVisualization.tsx` - Interactive React component that visualizes production chains using D3.js with interactive node selection, visual feedback on node clicks, and event handlers for nodes, links, and tooltips
- `src/components/ui/resource/ConverterDashboard.tsx` - Main interface for managing converters and production chains
- `src/components/ui/resource/ConverterDetailsView.tsx` - Detailed view of a single converter with stats, active processes, available recipes, and efficiency factors
- `src/components/ui/resource/ChainManagementInterface.tsx` - Interface for creating and managing multi-step production chains and templates
- `src/components/ui/resource/ConverterDashboard.css` - Styles for the converter dashboard component
- `src/components/ui/resource/ConverterDetailsView.css` - Styles for the converter details view component
- `src/components/ui/resource/ChainManagementInterface.css` - Styles for the chain management interface component

### Combat System UI Components

- `src/components/combat/CombatLayout.tsx` - Layout component for combat-related pages providing navigation and common structure
- `src/components/combat/CombatDashboard.tsx` - Main dashboard for combat operations overview
- `src/components/combat/FleetDetails.tsx` - Component for detailed fleet information and management
- `src/components/combat/BattleView.tsx` - Component for viewing and managing active battles
- `src/components/combat/formations/FormationTacticsPage.tsx` - Page component for managing formation tactics
- `src/components/combat/formations/FormationTacticsPanel.tsx` - Panel component for displaying formation visualizations, tactical bonuses, and behavior options
- `src/components/combat/formations/FormationVisualizer.tsx` - Visual representation of fleet formations
- `src/components/combat/formations/TacticalBehaviorSelector.tsx` - Component for selecting tactical behaviors
- `src/components/combat/formations/FormationTacticsContainer.tsx` - Container for managing formations across multiple fleets

### Weapon Effects

- **src/managers/weapons/AdvancedWeaponEffectManager.ts**: Manages advanced weapon effects including beam, homing, multi-stage, and environment interactions. The manager extends EventEmitter and implements the \_WeaponEvents interface with proper property getters and setters. Supports various weapon categories (machineGun, gaussCannon, etc.) and variants (standard, sparkRounds, etc.)

### UI Library Components

- `src/components/ui/Button.tsx` - Versatile button component with multiple style variants and sizes using class-variance-authority
- `src/components/ui/Tabs.tsx` - Accessible tabbed interface component using @radix-ui/react-tabs

### Module Status Components

- `src/components/ui/modules/ModuleStatusDisplay.tsx` - Component for displaying and managing module status with status transition visualization and interactive status controls

### Visual Effects

- `src/effects/component_effects/SmokeTrailEffect.tsx` - Particle-based visual effect component that creates dynamic smoke trails with customizable direction, color, and particle behavior, using Three.js for rendering
- `src/effects/component_effects/ExplosionEffect.tsx` - Visual effect for creating explosion animations
- `src/effects/component_effects/GlowEffect.tsx` - Visual effect for creating glowing elements

### Pages

- `src/pages/ConverterManagementPage.tsx` - Page component that integrates the converter management UI components with routing
- `src/pages/ConverterManagementPage.css` - Styles for the converter management page

### Event System

- `src/lib/modules/ModuleEvents.ts` - Core event system implementation with event types and the event bus with detailed JSDoc documentation
- `src/utils/events/EventDispatcher.tsx` - React context provider and hooks for the event system with comprehensive documentation
- `src/hooks/useModuleEvents.ts` - Custom hook for working with module events

### Mining Hub UI Components

- `src/components/buildings/modules/MiningHub/MiningWindow.tsx` - Main interface for the Mining Hub module, allowing resource visualization and management
- `src/components/buildings/modules/MiningHub/MiningControls.tsx` - Control panel for mining operations
- `src/components/buildings/modules/MiningHub/MiningMap.tsx` - Visual map representation of mining resources
- `src/components/buildings/modules/MiningHub/ResourceNode.tsx` - Individual resource node component used in the mining interface
- `src/components/buildings/modules/MiningHub/ResourceTransfer.tsx` - Component for visualizing and managing resource transfers
- `src/components/buildings/modules/MiningHub/ResourceStorage.tsx` - UI for resource storage management
- `src/components/buildings/modules/MiningHub/ThresholdManager.tsx` - Interface for setting and managing resource thresholds
- `src/components/buildings/modules/MiningHub/ThresholdStatusIndicator.tsx` - Visual indicator for threshold status
- `src/components/buildings/modules/MiningHub/MiningTutorial.tsx` - Tutorial component for the Mining Hub

### Mothership System

- `src/components/buildings/mothership/MothershipCore.tsx` - Core component for the Mothership, integrating animated superstructure expansion and resource flow visualizations
- `src/effects/component_effects/MothershipSuperstructure.tsx` - Component for rendering an animated superstructure that expands based on the expansion level
- `src/effects/component_effects/ResourceFlowVisualization.tsx` - Component for visualizing resource flows between different points with animated particles
- `src/styles/components/mothership.css` - CSS styles for the Mothership components, including animations for the superstructure and resource flows

### Colony System

- `src/components/buildings/colony/ColonyManagementSystem.tsx`: Main component for managing a colony, integrating population growth, trade routes, and growth modifiers. Provides comprehensive colony management with expandable sections for different aspects of colony operations.
  - Key interfaces: `GrowthModifier`, `TradePartner`, `TradeRoute`, `PopulationEvent`, `BuildingData`, `ResourceData`, `SatisfactionFactor`
  - Key features: Population management, trade route visualization, growth modifier management, building management, resource tracking, satisfaction monitoring
- `src/components/buildings/colony/PopulationGrowthModule.tsx` - Component for visualizing and managing population growth with growth history tracking and modifier support
- `src/components/buildings/colony/TradeRouteVisualization.tsx` - Component for visualizing trade routes between the colony and its trade partners with resource flow animations
- `src/components/buildings/colony/GrowthRateModifiers.tsx` - Component for managing growth rate modifiers with visual feedback on modifier effects
- `src/components/buildings/colony/AutomatedPopulationManager.tsx` - Component for automating population growth with cycle management and event tracking
- `src/components/buildings/colony/ColonyMap.tsx`: Interactive map component for visualizing and managing colony buildings. Supports zooming, panning, and building selection. Displays buildings with color-coding based on type and status indicators.
  - Key interfaces: `BuildingData`, `ColonyMapProps`
  - Key features: Interactive grid, building visualization, status indicators, zoom/pan controls
- `src/components/buildings/colony/ResourceDashboard.tsx` - Dashboard component for monitoring and managing colony resources
- `src/components/buildings/colony/SatisfactionMeter.tsx` - Component for visualizing colony satisfaction based on various factors
- `src/components/buildings/colony/PopulationProjectionChart.tsx` - Component for projecting future population growth based on current growth rate
- `src/config/automation/colonyRules.ts` - Configuration for colony automation rules, including population growth, resource management, and trade route establishment
- `src/pages/ColonyManagementPage.tsx` - Page component that showcases the Colony Management System with sample data

## Combat System

### Components

- **src/components/combat/radar/RadarSweepAnimation.tsx**: Animated radar sweep visualization with customizable appearance and performance settings.
- **src/components/combat/radar/DetectionVisualization.tsx**: Visualizes detected objects on radar with different representations based on object type and confidence level.
- **src/components/combat/radar/RangeIndicators.tsx**: Displays detection, weapon, and communication ranges with customizable appearance and interactive elements.
- **src/components/combat/alerts/AlertSystemUI.tsx**: Alert system UI with different severity levels and interaction options.
- **src/components/combat/CombatSystemDemo.tsx**: Demo component that integrates all combat system UI components.
- **src/pages/CombatSystemPage.tsx**: Page that showcases the Combat System UI components.

### Combat Systems

- `src/managers/combat/ObjectDetectionSystem.ts`: Implements a system for detecting objects in space based on scanner capabilities and environmental factors. Handles passive and active scanning, detection confidence, and environmental effects on detection.
  - Key interfaces: `ObjectDetectionEventMap`, `DetectorUnit`, `DetectableObject`
  - Key classes: `ObjectDetectionSystemImpl`
  - Key enums: `ObjectDetectionEvent`

## Documentation

### Architecture

- `CodeBase_Docs/CodeBase_Architecture.md` - Overall architecture of the codebase, including a comprehensive section on TypeScript best practices for handling mixed return types
- `CodeBase_Docs/CodeBase_Mapping_Index.md` - This file, a master index of all files in the codebase
- `CodeBase_Docs/System_Architecture_Diagrams.md` - Visual diagrams and detailed explanations of complex systems

### System Design

- `CodeBase_Docs/Performance_Considerations.md` - Analysis of performance critical paths with optimization techniques and recommendations
- `CodeBase_Docs/ResourceFlowManager_Optimizations.md` - Specific optimizations for the resource flow system
- `CodeBase_Docs/Event_System_Optimizations.md` - Specific optimizations for the event system
- `CodeBase_Docs/MultiStep_Production_Chains.md` - Detailed documentation of the multi-step production chain system
- `CodeBase_Docs/Resource_Conversion_Efficiency.md` - Comprehensive guide to the resource conversion efficiency system
- `CodeBase_Docs/ConverterManagementUI.md` - Design specifications for the converter management user interface

### Testing Documentation

- `CodeBase_Docs/Integration_Testing_Best_Practices.md` - Guidelines for creating effective integration tests
- `CodeBase_Docs/ResourceFlowManager_Testing.md` - Documentation for ResourceFlowManager test implementation
- `CodeBase_Docs/UI_Testing_Best_Practices.md` - Comprehensive guide for component, integration, and E2E UI testing
- `CodeBase_Docs/Performance_Benchmark_Practices.md` - Best practices for performance benchmarking
- `CodeBase_Docs/Test_Utilities_Guide.md` - Guide to using the enhanced test utilities

### Error and Linting Documentation

- `CodeBase_Docs/CodeBase_Error_Log.md` - Common issues encountered during development, including detailed logs of fixes for TypeScript errors like property access on mixed return types
- `CodeBase_Docs/CodeBase_Linting_Progress.md` - Linting rules and best practices
- `CodeBase_Docs/TypeScript_Error_Fixing_Strategies.md` - Strategies for fixing TypeScript errors
- `CodeBase_Docs/TypeScript_Type_Guard_Best_Practices.md` - Best practices for implementing and using type guards in TypeScript, with a focus on their use in test files

## Configuration Files

### TypeScript Configuration

- `tsconfig.json` - Main TypeScript configuration for the application code
- `tsconfig.node.json` - TypeScript configuration for Node.js-specific files
- `tsconfig.check.json` - TypeScript configuration for type checking with downlevel iteration

### ESLint Configuration

- `eslint.config.js` - ESLint configuration using the new flat config format
- `.eslintignore` - Files and directories to be ignored by ESLint

### Build Configuration

- `vite.config.ts` - Vite build configuration
- `vitest.config.ts` - Vitest test configuration
- `jest.config.js` - Jest test configuration for legacy tests

## Recent Updates

- `src/managers/weapons/AdvancedWeaponEffectManager.ts` - Implemented the `_WeaponEvents` interface properly in the `AdvancedWeaponEffectManager` class. The interface is now used for handling weapon effect events and bridges between the custom `_WeaponEvents` format and the standard `AdvancedWeaponEffectEvents` system. Added properties, index signature, and a bridging method to properly satisfy the interface requirements.

## Bundle Optimization and Code Splitting

- **src/utils/preload.ts** - Utility functions for intelligent preloading of lazy-loaded components using requestIdleCallback or setTimeout fallback. Provides functions to preload common and low-priority routes in the background.

- **src/router/routes.tsx** - Route configuration implementing React.lazy code splitting for all route components. Implements Suspense boundaries with loading fallbacks for each route.

- **src/main.tsx** - Application entry point that now triggers background preloading of common routes after initial render.

- **src/App.tsx** - Main application component with lazy loading for the GameLayout component to optimize initial rendering.

- **vite.config.ts** - Enhanced build configuration with optimized code splitting, tree shaking, and bundle size optimization. Implements advanced Rollup configuration with manual chunks for vendor code, aggressive tree shaking, and minification settings.

## Error Handling System

- `src/components/ui/GlobalErrorBoundary.tsx` - React error boundary component that wraps the entire application to catch and handle uncaught errors. Provides a user-friendly fallback UI with error details and a reload option.

### Exploration System

- `CodeBase_Docs/CodeBase_Mapping/exploration_components.md` - Comprehensive mapping of all exploration system components, their relationships, and supporting files
- `src/components/exploration/AutomatedSectorScanner.tsx` - Component for automated sector scanning
- `src/components/exploration/RealTimeMapUpdates.tsx` - Component for real-time map updates
- `src/components/exploration/AdvancedFilteringSystem.tsx` - Component for advanced filtering of exploration data
- `src/components/exploration/DetailedAnomalyAnalysis.tsx` - Component for detailed anomaly analysis
- `src/components/exploration/ResourcePotentialVisualization.tsx` - Component for resource potential visualization
- `src/components/exploration/GalaxyMappingSystem.tsx` - Component for galaxy mapping
- `src/components/exploration/ResourceDiscoverySystem.tsx` - Component for resource discovery
- `src/components/exploration/ExplorationDataManager.tsx` - Component for exploration data management
- `src/components/exploration/DiscoveryClassification.tsx` - Component for discovery classification
- `src/components/exploration/DataAnalysisSystem.tsx`: Component for analyzing exploration data with various visualization types. Provides dataset management, analysis configuration, and result visualization.
  - Key interfaces: `DataAnalysisSystemProps`, `ResultVisualizationProps`
  - Key features: Dataset creation, analysis configuration, result visualization, multiple chart types
- `src/contexts/ClassificationContext.tsx` - Context provider for the classification system
- `src/contexts/DataAnalysisContext.tsx` - Context provider for the data analysis system
- `src/types/exploration/ClassificationTypes.ts` - Types and interfaces for the classification system
- `src/types/exploration/DataAnalysisTypes.ts` - Types and interfaces for the data analysis system

## Services

### Core Services

- `src/services/ErrorLoggingService.ts`: Provides structured error logging capabilities for the application. Handles logging errors with metadata, categorizing errors by type and severity, and sending errors to a remote logging service.

  - Key interfaces: `ErrorMetadata`, `ErrorLogEntry`
  - Key enums: `ErrorSeverity`, `ErrorType`

- `src/services/RecoveryService.ts`: Provides mechanisms for recovering from critical application failures. Handles saving application state snapshots, restoring previous states, implementing different recovery strategies, and providing graceful degradation options.
  - Key interfaces: `StateSnapshot`, `RecoveryConfig`
  - Key enums: `RecoveryStrategy`

### Other Services

// ... existing code ...

### Utilities

- `src/utils/profiling/componentProfiler.ts`: Provides utilities for profiling React component performance. Includes functions for measuring render times, tracking prop changes, and identifying wasted renders.
  - Key functions: `createComponentProfiler`, `profileRender`, `withProfiling`
  - Key interfaces: `InternalProfilerOptions`

### Test Files

- `src/tests/utils/events/rxjsIntegration.test.ts` - Tests for RxJS integration with the event system
  - Tests the initialization of RxJS integration with the module event bus
  - Includes tests for filtering events by type and module ID
  - Uses sample events to verify event filtering functionality
  - Implements async test patterns for proper event handling

```

```

---
CODEBASE MAPPING INDEX
---

# Galactic Sprawl Codebase Mapping

This document serves as the main index for the Galactic Sprawl project codebase mapping. The detailed mapping has been categorized into separate files for better organization and maintainability. When you add to a category, you must also add a reference to it in this index.

## Project Mapping Guidelines

- All paths are relative to project root
- Dependencies indicate direct relationships
- "Used By" indicates reverse dependencies
- All components should follow consistent naming
- Event systems should use centralized bus

### Event Data Type Guards

- `src/hooks/game/useGameState.ts` - Added type guards for mission and sector event data to ensure type safety when handling events.
- `src/initialization/moduleFrameworkInit.ts` - Added type guards for resource threshold event data to ensure type safety when handling resource events.
- `src/utils/events/rxjsIntegration.ts` - Fixed filter predicate for event data to properly handle possibly undefined values.
- `src/tests/utils/events/rxjsIntegration.test.ts` - Added proper null checks for event data in tests.
- `src/utils/ships/shipUtils.ts` - Fixed handling of the currentAmmo property on WeaponState using type intersection.
- `src/managers/resource/ResourceThresholdManager.ts` - Added type guards for resource update event data to ensure type safety when handling resource updates.

### Type Guard Patterns

- Type Guard for Event Data:

  ```typescript
  function isResourceEvent(event: GameEvent): event is ResourceEvent {
    return event.type === 'RESOURCE_UPDATE' && 'resourceId' in event.data;
  }
  ```

- Type Guard for Nullable Values:

  ```typescript
  function isNonNullResource(resource: Resource | null): resource is Resource {
    return resource !== null;
  }
  ```

### TypeScript Error Fixes

- `src/components/ui/modules/ModuleHUD.tsx` - Added documentation for unused event handlers to explain their future implementation.
- `src/components/buildings/modules/ExplorationHub/MissionReplay.tsx` - Implemented the unused event variable to enhance UI by highlighting the current event.
- `src/components/ui/GameHUD.tsx` - Added documentation for the \_Notification interface to explain its future use.
- `src/components/buildings/modules/MiningHub/ResourceNode.tsx` - Implemented unused techBonuses, assignedShip, and color variables.
- `src/components/buildings/modules/MiningHub/MiningWindow.tsx` - Implemented unused handleContextMenuEvent function and fixed parameter types.
- `src/hooks/modules/useModuleUpgrade.ts` - Added documentation for the \_ModuleEventData interface.
- `src/hooks/resource/useResourceTracking.ts` - Implemented unused \_calculateTotals and \_calculatePercentages functions.
- `src/hooks/vpr/useVPR.ts` - Implemented unused type parameter in getVPRAnimationSet function.
- `src/hooks/vpr/useVPRInteractivity.ts` - Implemented unused moduleId parameter in handleModuleHover function.
- `src/hooks/factions/useFactionBehavior.ts` - Added documentation for 11 unused functions and fixed a syntax error.
- `src/initialization/eventSystemInit.ts` - Implemented unused \_resourceSystemComm and \_moduleSystemComm variables.
- `src/managers/combat/combatManager.ts` - Implemented unused zone and unit processing functions.
- `src/managers/module/ModuleAttachmentManager.ts` - Added documentation for the \_\_ModuleAttachmentEventData interface.
- `src/managers/resource/ResourceExchangeManager.ts` - Implemented unused calculateRates and findOptimalPath functions.
- `src/lib/automation/ConditionChecker.ts` - Added documentation for the \_\_RuntimeCondition interface and \_miningManager variable, and fixed interface property issues by updating the code to use the correct properties from the AutomationCondition interface.
- `src/lib/optimization/EntityPool.ts` - Added documentation for unused \_maxSize and \_expandSize variables.
- `src/components/weapons/WeaponUpgradeSystem.tsx` - Implemented the unused key parameter in the renderStatValue function to display formatted stat names.
- `src/contexts/ModuleContext.tsx` - Implemented the unused \_module variable in the CREATE_MODULE case by adding logging for module creation.
- `src/effects/component_effects/ExplosionEffect.tsx` - Implemented the target parameter in the gsap.to function and added documentation for the camera parameter.
- `src/effects/component_effects/ShieldEffect.tsx` - Implemented the uniforms, vertexShader, fragmentShader, and components parameters with comprehensive documentation.
- `src/effects/component_effects/ShieldImpactEffect.ts` - Implemented the point parameter in the ripplePoints.forEach method to calculate position.
- `src/effects/component_effects/SmokeTrailEffect.tsx` - Added documentation for the camera parameter in the Canvas component.
- `src/effects/component_effects/ThrusterEffect.tsx` - Implemented the callback parameter in the mockUseFrame function and added documentation for the CanvasProps interface.
- `src/effects/component_effects/ExplosionEffect.tsx` - Replaced JSX namespace declaration with proper type definitions for Three.js elements.
- `src/effects/component_effects/SmokeTrailEffect.tsx` - Replaced JSX namespace declaration with proper type definitions for Three.js elements.
- `src/effects/component_effects/ThrusterEffect.tsx` - Replaced JSX namespace declaration with proper type definitions for Three.js elements.

### ESLint Console Statement Fixes

- `src/lib/ai/shipMovement.ts` - Replaced console.log with console.warn for ship position logging.
- `src/lib/optimization/EntityPool.ts` - Replaced console.log with console.warn for pool expansion logging.
- `src/managers/automation/GlobalAutomationManager.ts` - Replaced console.log with console.warn for automation manager status.
- `src/managers/resource/ResourcePoolManager.ts` - Replaced console.log with console.warn for resource allocation logging.
- `src/managers/weapons/WeaponEffectManager.ts` - Replaced console.log with console.warn for weapon effect creation.
- `src/components/buildings/modules/hangar/ShipHangar.tsx` - Replaced console.log with console.warn for mock ships usage.
- `src/components/combat/BattleEnvironment.tsx` - Replaced console.log with console.warn for fleet AI debugging.
- `src/components/ui/GameHUD.tsx` - Replaced console.log with console.warn for notification system debugging.
- `src/effects/component_effects/ExplosionEffect.tsx` - Replaced console.log with console.warn for particle effect debugging.
- `src/effects/component_effects/ShieldEffect.tsx` - Replaced console.log with console.warn for shader material debugging.

### Event System Optimizations

- `src/utils/events/EventBatcher.ts` - Implemented event batching for high-frequency events using RxJS operators. Provides configuration options for time window, batch size, and empty batch handling.
- `src/hooks/events/useEventBatching.ts` - Created React hooks for event batching, debouncing, and throttling. Includes useEventBatching, useEventDebouncing, and useEventThrottling hooks.
- `src/utils/events/EventFilter.ts` - Implemented optimized event filtering with three strategies: standard filtering, batch processing, and indexed filtering. Provides efficient filtering for large event histories.
- `src/hooks/events/useEventFiltering.ts` - Created React hooks for event filtering, including useEventFiltering and usePaginatedEventFiltering hooks.
- `src/tests/utils/events/EventBatcher.test.ts` - Added comprehensive tests for the EventBatcher utility, covering batch creation, configuration, and batch processing functions.
- `src/tests/hooks/events/useEventBatching.test.tsx` - Added tests for the event batching hooks, including initialization, configuration updates, and event handling.
- `src/tests/utils/events/EventFilter.test.ts` - Added tests for the EventFilter class, covering basic filtering, batch processing, indexed filtering, and configuration updates.
- `CodeBase_Docs/Event_System_Optimizations.md` - Created detailed documentation for the event system optimizations, including implementation details, usage examples, and best practices.

## Ship Types and Abilities

- src/types/ships/CommonShipTypes.ts: Contains the CommonShipAbility interface which now includes an id property to match the Effect interface requirements
- src/managers/module/ShipHangarManager.ts: Updated to include unique IDs for ship abilities and their effects
- src/config/ships/spaceRatsShips.ts: Added unique IDs to all ship abilities
- src/config/ships/lostNovaShips.ts: Added unique IDs to all ship abilities
- src/config/ships/equatorHorizonShips.ts: Added unique IDs to all ship abilities
- src/components/ships/FactionShips/lostNova/DarkMatterReaper.tsx: Implements a Lost Nova faction ship with base stats scaling and weapon configuration. Uses underscore-prefixed variables for future stat scaling implementation.

## Categories

1. [Development Tools](./Categories/Development_Tools_References.md)

   - Linting and Code Quality
   - Testing Framework
   - Type Safety Improvements

2. [Core Systems](./Categories/Core_Systems_References.md)

   - Resource Management
   - Module Framework
   - Event System
   - State Management
   - UI Framework
   - Faction Ship System
   - VPR View
   - Civilization Sprawl View

3. [Combat System](./Categories/Combat_System_References.md)

   - Combat Worker
   - Combat Type Conversion Utilities
   - Combat System Components

4. [UI Components](./Categories/UI_References.md)

   - HUD Components
   - Menus
   - Dialogs
   - UI Hooks
   - Visualization

5. [Game Mechanics](./Categories/Game_Mechanics_References.md)

   - Exploration
   - Mining
   - Research
   - Ship Management
   - Economy

6. [Build Configuration](./Categories/Build_Configuration_References.md)

   - TypeScript Configuration
   - Vite Configuration

7. [Testing Framework](./Categories/Testing_Framework_References.md)

   - Unit Tests
   - Component Tests
   - Integration Tests
   - End-to-End Tests
   - Test Utilities
   - Playwright Setup

8. [Ship System](./Categories/Ship_System_References.md)

   - Ship Configuration
   - Ship Type Relationships
   - Ship Implementation Details
   - Ship Formation System
   - AI Integration
   - Ship Hangar System
   - Player Ship System

9. [Resource Management](./Categories/Resource_Management_References.md)

   - Core Components
   - Resource Type Definitions
   - Resource Utilities
   - Resource Type Relationships
   - Resource Tracking Flow
   - Resource Management Events
   - Resource Management Hooks
   - Resource Management UI Components

10. [Resource Tracking](./Categories/Resource_Tracking_References.md)

    - Core Resource Tracking Types
    - Resource Serialization Interfaces
    - Type Relationships
    - Resource Tracking Flow
    - Resource Tracking Components
    - Resource Tracking Hooks
    - Resource Tracking Events
    - Resource Tracking Integration

11. [Effect System](./Categories/Effect_System_References.md)

    - Core Effect Types
    - Effect Utilities
    - Components Using Effects
    - Effect System Integration
    - Effect Type Relationships
    - Effect Creation Flow
    - Effect System Dependencies
    - Effect System Components
    - Effect System Hooks
    - Effect System Events

12. [Combat Type Conversion](./Categories/Combat_Type_Conversion_References.md)

    - Core Type Conversion Utilities
    - Combat System Components
    - Type Relationships
    - Conversion Flow
    - Type Conversion Implementation
    - Type Conversion Usage
    - Type Conversion Testing
    - Type Conversion Benefits

13. [Automation System](./Categories/Automation_System_References.md)

    - Core Components
    - Automation Routines
    - Automation System Architecture
    - Automation System Events
    - Automation System Integration
    - Automation System Configuration
    - Automation System Testing

14. [Project Phase](./Categories/Project_Phase_References.md)
    - Project Mapping Guidelines
    - Development Phases
    - Development Workflow
    - Project Structure
    - Coding Standards
    - Version Control
    - Documentation
    - Performance Considerations
    - Security Considerations
    - Accessibility Considerations

## Type System and Error Fixes

- [Type Relationship References](Categories/Type_Relationship_References.md) - Hierarchical relationships between types in the system
- [TypeScript Error Fixes](Categories/TypeScript_Error_Fixes.md) - Tracking of files fixed for TypeScript errors, categorized by error type

## Combat System

### Weapon Configuration

- `src/config/combat/weaponConfig.ts`: Defines weapon configurations including stats, effects, and behaviors
  - Contains effect definitions for various weapon types
  - Each effect must have a unique ID to satisfy the `Effect` interface
  - Effects include properties like name, description, duration, and strength
  - Used by the `WeaponEffectManager` to apply effects during combat

### Weapon Types

- `src/types/weapons/WeaponTypes.ts`: Contains interfaces and types for the weapon system
  - Defines `WeaponMount` interface for weapon attachment points
  - Defines weapon categories, states, and upgrade paths
  - Used throughout the combat system for type safety

### Weapon Effects

- `src/effects/types_effects/EffectTypes.ts`: Defines the base effect types used in the game
  - Contains `BaseEffect` interface which is extended by specific effect types
  - Categorizes effects into combat, status, and other types
  - Used by the weapon system to apply effects to targets

### Effect Interface

- `src/types/core/GameTypes.ts`: Contains the `Effect` interface definition
  - Requires each effect to have a unique `id` property
  - Used by weapon effects, ship abilities, and other game systems
  - Ensures consistent effect handling across the codebase

### Environmental Hazard Manager

- `src/managers/combat/EnvironmentalHazardManager.ts`: Manages environmental hazards in the game world, including creation, interaction, and cleanup of hazards.

### Advanced Weapon Effects

- `src/effects/types_effects/AdvancedWeaponEffects.ts`: Defines interfaces for advanced weapon effects, including chain effects, beam effects, status effects, and environmental interactions.

- `src/managers/weapons/AdvancedWeaponEffectManager.ts`: Handles creation and management of advanced weapon effects, including visual configuration and lifecycle management.

- `src/types/geometry.ts`: Core geometric types used throughout the application, including Position, Vector, Size, and Transform interfaces.

### Combat System

- `src/utils/combat/scanRadiusUtils.ts` - Utilities for calculating scan radius, detection probability, and target signatures in the combat system.
- `src/managers/combat/ObjectDetectionSystem.ts` - System for detecting objects in space based on scanner capabilities and environmental factors.
- `src/managers/combat/ThreatAssessmentManager.ts` - System for assessing threat levels of detected objects.
- `src/managers/combat/CombatMechanicsSystem.ts` - Core combat mechanics including weapons, damage, and effects.

## Automation System

### Automation Manager

- `src/managers/game/AutomationManager.ts`: Manages automated behaviors in the game
  - Defines interfaces for automation conditions and actions
  - Handles event-based automation triggers
  - Processes condition checks and action execution

### Automation Rules

- `src/config/automation/`: Directory containing rule configurations for different modules
  - `hangarRules.ts`: Rules for ship hangar automation
  - `miningRules.ts`: Rules for mining operations automation
  - `combatRules.ts`: Rules for combat automation
  - `colonyRules.ts`: Rules for colony management automation
  - `explorationRules.ts`: Rules for exploration automation
  - Each file contains condition and action definitions that must match the expected types

### Condition Checker

- `src/lib/automation/ConditionChecker.ts`: Validates conditions for automation rules
  - Implements logic to check different condition types
  - Handles resource, time, event, and status conditions
  - Used by the automation system to determine when to trigger actions

## Module System

### Module Manager

- `src/managers/module/ModuleManager.ts`: Manages the lifecycle and state of all modules in the game
  - Handles module creation, attachment, upgrades, and state updates
  - Maintains a registry of module configurations
  - Provides methods to attach modules to buildings
  - Manages module activation and deactivation

### Module Upgrade Manager

- `src/managers/module/ModuleUpgradeManager.ts`: Manages the upgrade paths and processes for modules
  - Defines upgrade paths with levels, requirements, and effects
  - Handles the upgrade process including resource costs
  - Manages upgrade status tracking
  - Provides methods to check upgrade requirements

### Module Tests

- `src/tests/managers/module/ModuleManager.test.ts`: Tests for the Module Manager

  - Tests module creation, attachment, and state management
  - Verifies building registration and module retrieval
  - Ensures proper event emission for module actions
  - Uses properly typed mock objects that match the actual implementation

- `src/tests/managers/module/ModuleUpgradeManager.test.ts`: Tests for the Module Upgrade Manager
  - Tests upgrade path registration and retrieval
  - Verifies upgrade requirement checking
  - Tests the upgrade process including resource costs
  - Ensures proper event emission for upgrade actions
  - Uses properly typed mock objects with all required properties

### Module Types

- `src/types/buildings/ModuleTypes.ts`: Contains interfaces and types for the module system
  - Defines `BaseModule` interface for all modules
  - Defines `ModuleType` for different module categories
  - Defines `ModuleConfig` for module configuration
  - Defines `ModularBuilding` for buildings that can have modules
  - Defines `ModuleAttachmentPoint` for module attachment points
  - Used throughout the module system for type safety

## Type Safety Improvements

### Event Data Type Guards

- `src/hooks/game/useGameState.ts` - Added type guards for mission and sector event data to ensure type safety when handling events.
- `src/initialization/moduleFrameworkInit.ts` - Added type guards for resource threshold event data to ensure type safety when handling resource events.
- `src/utils/events/rxjsIntegration.ts` - Fixed filter predicate for event data to properly handle possibly undefined values.
- `src/tests/utils/events/rxjsIntegration.test.ts` - Added proper null checks for event data in tests.
- `src/utils/ships/shipUtils.ts` - Fixed handling of the currentAmmo property on WeaponState using type intersection.
- `src/managers/resource/ResourceThresholdManager.ts` - Added type guards for resource update event data to ensure type safety when handling resource updates.

### Faction Behavior Types

- `src/types/ships/FactionTypes.ts` - Updated the FactionBehaviorType to be a string literal union type instead of an object type.
- `src/types/ships/FactionTypes.ts` - Added a new FactionBehaviorConfig interface for behavior configuration objects.
- `src/config/factions/factionConfig.ts` - Updated faction configurations to use the new FactionBehaviorType with proper type assertions.
- `src/config/factions/factionConfig.ts` - Added missing faction configurations for 'player', 'enemy', 'neutral', and 'ally' to satisfy the Record<FactionId, FactionConfig> type.
- `src/hooks/factions/useFactionBehavior.ts` - Updated the FactionCombatUnit interface to use FactionBehaviorConfig for the tactics property.
- `src/hooks/factions/useFactionBehavior.ts` - Updated the convertUnitsToFaction function to use the new FactionBehaviorType with proper type assertions.

## Visual Effects System

### Component Effects

- `src/effects/component_effects/ExplosionEffect.tsx` - Implements explosion visual effects with particle systems

  - Uses Three.js for 3D rendering
  - Implements proper animation lifecycle with useFrame
  - Provides configurable size, color, and intensity
  - Includes proper cleanup to prevent memory leaks

- `src/effects/component_effects/ShieldEffect.tsx` - Implements shield visual effects with custom shaders

  - Uses custom shader materials for advanced visual effects
  - Implements hexagonal grid patterns and glow effects
  - Provides impact point visualization
  - Supports dynamic shield health visualization

- `src/effects/component_effects/ShieldImpactEffect.ts` - Implements shield impact visual effects

  - Creates ripple effects at impact points
  - Generates crack patterns based on damage
  - Provides configurable impact intensity
  - Integrates with the shield effect system

- `src/effects/component_effects/SmokeTrailEffect.tsx` - Implements smoke trail visual effects

  - Uses particle systems for realistic smoke
  - Provides configurable direction and intensity
  - Implements proper physics-based movement
  - Includes turbulence for natural-looking smoke

- `src/effects/component_effects/ThrusterEffect.tsx` - Implements thruster visual effects
  - Creates realistic engine exhaust effects
  - Provides configurable size and intensity
  - Implements proper particle lifecycle
  - Includes glow effects for visual enhancement

## Maintenance

This mapping is maintained as a living document. When adding new components or modifying existing ones, please update the relevant category file and add it to this index.

Please refer to the [CodeBase Mapping Index](./CodeBase_Mapping_Index.md) for the complete documentation.

## Available Category References

1. [Development Tools References](./Categories/Development_Tools_References.md)

   - Contains information about development tools, linting configuration, and testing utilities

2. [Core Systems References](./Categories/Core_Systems_References.md)

   - Contains information about core system architecture, including resource management, module framework, and event systems

3. [Combat System References](./Categories/Combat_System_References.md)

   - Contains information about combat system architecture, including combat worker, type conversion utilities, and combat components

4. [Build Configuration References](./Categories/Build_Configuration_References.md)

   - Contains information about build configuration, including TypeScript configuration and Vite configuration

5. [UI References](./Categories/UI_References.md)

   - Contains information about UI components, view system architecture, and visualization components

6. [Game Mechanics References](./Categories/Game_Mechanics_References.md)

   - Contains information about game modules architecture, state management, faction ship system, resource management system, and automation system

7. [Testing Framework References](./Categories/Testing_Framework_References.md)

   - Contains information about unit tests, component tests, integration tests, and end-to-end tests

8. [Ship System References](./Categories/Ship_System_References.md)

   - Contains information about ship configuration, ship type relationships, ship implementation details, ship formation system, AI integration, and player ship system

9. [Resource Management References](./Categories/Resource_Management_References.md)

   - Contains information about resource management system implementation, resource type definitions, resource utilities, resource tracking flow, and resource management UI components

10. [Resource Tracking References](./Categories/Resource_Tracking_References.md)

    - Contains information about resource tracking system implementation, resource serialization interfaces, type relationships, resource tracking flow, and resource tracking integration

11. [Effect System References](./Categories/Effect_System_References.md)

    - Contains information about effect system implementation, core effect types, effect utilities, components using effects, effect system integration, and effect system events

12. [Combat Type Conversion References](./Categories/Combat_Type_Conversion_References.md)

    - Contains information about combat system type conversion utilities, combat system components, type relationships, conversion flow, and type conversion implementation

13. [Automation System References](./Categories/Automation_System_References.md)

    - Contains information about automation system implementation, core components, automation routines, system architecture, events, integration, and testing

14. [Project Phase References](./Categories/Project_Phase_References.md)

    - Contains information about project mapping guidelines, development phases, workflow, structure, coding standards, and best practices

## Maintenance Guidelines

When updating the codebase:

1. Add new components or systems to the appropriate category file
2. Update existing documentation to reflect changes in the codebase
3. Maintain consistent formatting and organization within each category file
4. If a new category is needed, create a new file and update the index

### TypeScript Namespace Fixes

The following files had TypeScript namespace issues that were fixed by replacing namespace declarations with proper type definitions:

1. `src/effects/component_effects/ExplosionEffect.tsx` - Replaced JSX namespace declaration with proper type definitions for Three.js elements.
2. `src/effects/component_effects/SmokeTrailEffect.tsx` - Replaced JSX namespace declaration with proper type definitions for Three.js elements.
3. `src/effects/component_effects/ThrusterEffect.tsx` - Replaced JSX namespace declaration with proper type definitions for Three.js elements.

These fixes ensure that the codebase follows modern TypeScript best practices by using ES2015 module syntax instead of namespaces.

### Resource Management System Optimizations

- `src/managers/resource/ResourceFlowManager.ts` - Optimized for better performance with large resource networks:

  - Added caching system for resource states to reduce redundant lookups
  - Implemented batch processing for large networks to prevent UI freezing
  - Split the large `optimizeFlows()` method into smaller, focused methods
  - Added performance metrics to track execution time and resource usage
  - Enhanced converter node processing with better efficiency calculations
  - Improved error handling with more descriptive warning messages
  - Added configurable parameters for optimization interval, cache TTL, and batch size

- `src/tests/managers/resource/ResourceFlowManager.test.ts` - Updated tests for the optimized ResourceFlowManager:

  - Added tests for the caching system
  - Added tests for batch processing with large networks
  - Added tests for converter node processing
  - Added tests for performance metrics
  - Updated existing tests to work with the new implementation

- `src/tests/managers/resource/ResourceFlowManager.cache.test.ts` - Tests for the caching system of ResourceFlowManager, including cache invalidation, expiration, and isolation.
- `src/tests/managers/resource/ResourceFlowManager.batch.test.ts` - Tests for batch processing functionality of ResourceFlowManager for handling large resource networks efficiently.
- `src/tests/managers/resource/ResourceFlowManager.errors.test.ts` - Tests for error handling and edge cases in ResourceFlowManager, including input validation, edge conditions, and error recovery.
- `src/tests/integration/resource/MiningResourceIntegration.test.ts` - Integration tests for the interaction between ResourceFlowManager and MiningResourceIntegration, testing node registration, resource thresholds, transfers, and flow optimization.
- `src/tests/integration/ui/ResourceVisualization.test.tsx` - Integration tests for the ResourceVisualization UI component's interaction with the resource management system, testing resource display, updates, threshold indicators, and user interactions.
- `src/tests/performance/ResourceFlowManager.benchmark.ts` - Performance benchmarks for ResourceFlowManager, measuring execution time, nodes processed, connections processed, transfers generated, and memory usage for different network sizes and configurations.

- `CodeBase_Docs/ResourceFlowManager_Optimizations.md` - Detailed documentation of the ResourceFlowManager optimizations:

  - Overview of the optimization goals
  - Explanation of the caching system implementation
  - Details on batch processing for large networks
  - Code refactoring and organization improvements
  - Performance monitoring and metrics
  - Converter system improvements
  - Usage examples and future improvement plans

- `CodeBase_Docs/ResourceFlowManager_Testing.md` - Comprehensive documentation of the ResourceFlowManager test implementation, testing strategy, and best practices identified.

- `CodeBase_Docs/Integration_Testing_Best_Practices.md` - Guidelines and best practices for creating integration tests, including test structure, mocking strategies, type safety techniques, and common test scenarios.

- `CodeBase_Docs/Performance_Benchmark_Practices.md` - Guidelines and best practices for creating performance benchmarks, including benchmark structure, scenario design, metric collection, and result reporting.

## React Component Optimizations

### Optimized Components

1. **MiningWindow** (`src/components/buildings/modules/MiningHub/MiningWindow.tsx`)

   - Purpose: Main interface for mining operations
   - Optimizations:
     - Memoized resource filtering and sorting
     - Cached tech bonus calculations
     - Optimized event handlers
     - Type-safe state management

2. **ModuleStatusDisplay** (`src/components/modules/ModuleStatusDisplay.tsx`)

   - Purpose: Displays module status information
   - Optimizations:
     - Wrapped in React.memo
     - Optimized prop comparisons
     - Efficient state updates

3. **ModuleStatusSummary** (`src/components/modules/ModuleStatusSummary.tsx`)

   - Purpose: Shows summary of module statuses
   - Optimizations:
     - Wrapped in React.memo
     - Efficient data aggregation
     - Optimized rendering

4. **ModuleStatusSummaryItem** (`src/components/modules/ModuleStatusSummaryItem.tsx`)

   - Purpose: Individual module status item
   - Optimizations:
     - Wrapped in React.memo
     - Minimal prop dependencies
     - Efficient updates

5. **ModuleAlertList** (`src/components/alerts/ModuleAlertList.tsx`)

   - Purpose: Displays module alerts
   - Optimizations:
     - Wrapped in React.memo
     - Efficient alert filtering
     - Optimized rendering

6. **ModuleAlertItem** (`src/components/alerts/ModuleAlertItem.tsx`)
   - Purpose: Individual alert item
   - Optimizations:
     - Wrapped in React.memo
     - Minimal prop dependencies
     - Efficient updates

### Performance Enhancement Patterns

1. **Memoization Strategy**

   - Use React.memo for pure components
   - Implement useMemo for expensive calculations
   - Apply useCallback for event handlers

2. **State Management**

   - Group related state
   - Use functional updates
   - Implement proper cleanup

3. **Type Safety**

   - Strong TypeScript types
   - Proper interface definitions
   - Type-safe event handling

4. **Event System Integration**
   - Efficient event batching
   - Proper event filtering
   - Optimized event handlers

## Testing Framework and End-to-End Testing

- `playwright.config.ts`: Configuration file for Playwright end-to-end testing

  - Defines test directory (`src/tests/e2e`)
  - Sets timeouts and reporter options
  - Configures browsers (Chromium and Firefox)
  - Sets up web server command and port

- `src/tests/e2e/README.md`: Documentation for setting up and running Playwright tests

  - Installation instructions
  - Configuration details
  - Examples and best practices
  - Page Object Model pattern documentation

- `src/tests/e2e/models/MiningPage.ts`: Page Object Model for the Mining page

  - Locators for page elements
  - Methods for interacting with the page
  - Helper methods for verification and assertions

- `src/tests/e2e/mining.spec.ts`: End-to-end tests for the Mining page

  - Tests for resource display
  - Tests for search and filtering functionality
  - Tests for resource selection and view mode toggle
  - Tests for ship assignment and resource prioritization

- `src/tests/components/ui/ResourceVisualization.snapshot.test.tsx`: Snapshot tests for the ResourceVisualization component

  - Tests for default state rendering
  - Tests for low resource levels rendering
  - Tests for critical resource levels rendering

- Test configuration in package.json:
  - `test:e2e`: Runs Playwright tests
  - `test:e2e:ui`: Runs Playwright tests with UI
  - `test:e2e:headed`: Runs Playwright tests in headed mode
  - `test:e2e:debug`: Runs Playwright tests in debug mode

## Combat System Components

### Formation Tactics System

- `src/components/combat/formations/FormationTacticsPage.tsx` - Main page component for the formation tactics system
  - Implements faction selection using valid FactionId values
  - Uses factionDisplayNames mapping to maintain consistent UI
- `src/components/combat/formations/FormationTacticsPanel.tsx` - Panel for managing fleet formations and tactical behaviors
- `src/components/combat/formations/FormationTacticsContainer.tsx` - Container component that manages fleet formations across multiple fleets
- `src/components/combat/formations/FormationVisualizer.tsx` - Component for visualizing fleet formations
- `src/components/combat/formations/FormationPresetList.tsx` - Component for displaying and selecting formation presets
- `src/components/combat/formations/FormationEditor.tsx` - Component for creating and editing custom formations
- `src/components/combat/formations/TacticalBonusCard.tsx` - Component for displaying formation bonuses
- `src/components/combat/formations/TacticalBehaviorSelector.tsx` - Component for selecting and configuring tactical behaviors

### UI Components

- `src/components/ui/Button.tsx` - Reusable button component with various styles
- `src/components/ui/Card.tsx` - Card component for displaying content in a contained area
- `src/components/ui/Tabs.tsx` - Tabbed interface component for organizing content

### Utilities

- `src/utils/cn.ts` - Utility function for merging class names with Tailwind

### Tech Tree System

- `src/components/ui/tech/TechVisualFeedback.tsx` - Enhanced visual feedback components for the tech tree system, including:
  - `TechVisualFeedback` - Main component for tech node visualization with animations and tooltips
  - `TechConnectionLine` - Component for visualizing connections between tech nodes
  - `ResearchProgressIndicator` - Component for displaying research progress
  - `TechSynergyIndicator` - Component for visualizing synergies between technologies
- `src/components/ui/TechTree.tsx` - Main tech tree component, updated to use the enhanced visual feedback components
- `src/managers/game/techTreeManager.ts` - Manager for handling tech unlocks and progression

## State Management

- `src/utils/state/contextSelectors.ts` - Utilities for optimizing context state access and preventing unnecessary re-renders

  - `createSelector` - Creates a memoized selector function
  - `useContextSelector` - Hook for selecting portions of context state
  - `createContextSelector` - Creates a hook for selecting context state
  - `createPropertySelector` - Creates a hook for selecting a specific property
  - `createNestedPropertySelector` - Creates a hook for selecting a nested property
  - `createMultiPropertySelector` - Creates a hook for selecting multiple properties

- `src/utils/state/statePersistence.ts` - Utilities for persisting state to localStorage with versioning

  - `createStatePersistence` - Creates a state persistence manager
  - `createStatePersistenceHook` - Creates a hook-friendly state persistence manager
  - `createLocalStorageItem` - Creates a simple localStorage getter/setter

- `src/utils/state/stateMigration.ts` - Utilities for migrating state between schema versions
  - `createMigrationManager` - Creates a migration manager
  - `createMigrationBuilder` - Creates a migration builder
  - `addProperty` - Helper for adding properties
  - `renameProperty` - Helper for renaming properties
  - `removeProperty` - Helper for removing properties
  - `transformProperty` - Helper for transforming properties

## UI Framework

### Component Profiling System

- `src/utils/profiling/componentProfiler.ts` - Core utilities for profiling individual components

  - `createComponentProfiler` - Creates a component profiler
  - `profileRender` - Profiles a component render
  - `withProfiling` - HOC for profiling a component

- `src/utils/profiling/applicationProfiler.ts` - Application-wide profiling system

  - `createApplicationProfiler` - Creates an application profiler
  - `applicationProfiler` - Global application profiler instance

- `src/hooks/ui/useComponentProfiler.ts` - React hook for profiling components

  - `useComponentProfiler` - Hook for profiling a component
  - `useComponentProfilerWithUpdates` - Hook for profiling with state updates

- `src/hooks/ui/useProfilingOverlay.ts` - Hook for controlling the profiling overlay

  - `useProfilingOverlay` - Hook for controlling the overlay visibility

- `src/components/ui/profiling/ProfilingOverlay.tsx` - Visual overlay for displaying profiling metrics

  - `ProfilingOverlay` - Component for displaying profiling metrics

- `src/types/ui/UITypes.ts` - Types for the profiling system
  - `ComponentRenderMetrics` - Metrics for component renders
  - `ComponentProfilingOptions` - Options for component profiling
  - `ComponentProfilingResult` - Result of component profiling
  - `ApplicationProfilingMetrics` - Metrics for application profiling
  - `ApplicationProfilingOptions` - Options for application profiling
  - `ApplicationProfilingResult` - Result of application profiling

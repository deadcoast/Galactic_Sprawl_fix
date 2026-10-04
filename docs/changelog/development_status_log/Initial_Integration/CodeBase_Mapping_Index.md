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

## Categories

1. [Development Tools](./Development_Tools_References.md)

   - Linting and Code Quality
   - Testing Framework
   - Build Tools
   - Type Safety Improvements

2. [Core Systems](./Core_Systems_References.md)

   - Resource Management
   - Module Framework
   - Event System
   - Game State Management
   - Serialization
   - Worker Architecture

3. [Combat System](./Combat_System_References.md)

   - Combat Worker
   - Combat Types
   - Weapon Systems
   - Hazard Detection
   - Combat AI

4. [UI Components](./UI_References.md)

   - HUD Components
   - Menus
   - Dialogs
   - UI Hooks
   - Visualization

5. [Game Mechanics](./Game_Mechanics_References.md)

   - Exploration
   - Mining
   - Research
   - Ship Management
   - Economy

6. [Build Configuration](./Build_Configuration_References.md)

   - TypeScript Configuration
   - Vite Configuration
   - Dependency Management
   - Optimization Settings

7. [Development Tools](./Categories/Development_Tools_References.md)

   - Linting and Code Quality
   - Testing Framework
   - Type Safety Improvements

8. [Core Systems](./Categories/Core_Systems_References.md)

   - Resource Management
   - Module Framework
   - Event System
   - State Management
   - UI Framework
   - Faction Ship System
   - VPR View
   - Civilization Sprawl View

9. [Combat System](./Categories/Combat_System_References.md)

   - Combat Worker
   - Combat Type Conversion Utilities
   - Combat System Components

10. [UI Components](./Categories/UI_References.md)

- HUD Components
- Menus
- Dialogs
- UI Hooks
- Visualization

11. [Game Mechanics](./Categories/Game_Mechanics_References.md)

- Exploration
- Mining
- Research
- Ship Management
- Economy

12. [Build Configuration](./Categories/Build_Configuration_References.md)

- TypeScript Configuration
- Vite Configuration

13. [Testing Framework](./Categories/Testing_Framework_References.md)

- Unit Tests
- Component Tests
- Integration Tests
- End-to-End Tests
- Test Utilities
- Playwright Setup

14. [Ship System](./Categories/Ship_System_References.md)

- Ship Configuration
- Ship Type Relationships
- Ship Implementation Details
- Ship Formation System
- AI Integration
- Ship Hangar System
- Player Ship System

15. [Resource Management](./Categories/Resource_Management_References.md)

- Core Components
- Resource Type Definitions
- Resource Utilities
- Resource Type Relationships
- Resource Tracking Flow
- Resource Management Events
- Resource Management Hooks
- Resource Management UI Components

16. [Resource Tracking](./Categories/Resource_Tracking_References.md)

    - Core Resource Tracking Types
    - Resource Serialization Interfaces
    - Type Relationships
    - Resource Tracking Flow
    - Resource Tracking Components
    - Resource Tracking Hooks
    - Resource Tracking Events
    - Resource Tracking Integration

17. [Effect System](./Categories/Effect_System_References.md)

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

18. [Combat Type Conversion](./Categories/Combat_Type_Conversion_References.md)

    - Core Type Conversion Utilities
    - Combat System Components
    - Type Relationships
    - Conversion Flow
    - Type Conversion Implementation
    - Type Conversion Usage
    - Type Conversion Testing
    - Type Conversion Benefits

19. [Automation System](./Categories/Automation_System_References.md)

    - Core Components
    - Automation Routines
    - Automation System Architecture
    - Automation System Events
    - Automation System Integration
    - Automation System Configuration
    - Automation System Testing

20. [Project Phase](./Categories/Project_Phase_References.md)
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

## Usage Guidelines

- All paths are relative to project root
- Dependencies indicate direct relationships
- "Used By" indicates reverse dependencies
- All components should follow consistent naming
- Event systems should use centralized bus

## Maintenance

This mapping is maintained as a living document. When adding new components or modifying existing ones, please update the relevant category file.

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

- `src/tests/components/ui/ResourceVisualization.snapshot.test.tsx`: Tests for the ResourceVisualization component using a custom TestGameProvider that simulates different resource states. The test verifies resource values are displayed correctly and that appropriate warnings appear when resources are low or critical.

## Test Patterns

### Testing Without Mocks

- We've adopted a pattern of using actual implementations rather than mocks in tests
- For context-dependent components, we create simplified context providers that use real implementation patterns
- For components using framer-motion, we focus tests on the content being rendered rather than animations

### Components with Contexts

- Use a custom Provider component that provides controlled test data
- Avoid using the actual app Provider if it has complex dependencies
- Pass test data through the simplified provider to exercise different component states

### Components with Animations

- Focus tests on the rendered content, not animations
- Use flexible query methods (`getAllByText`, `getByText` with options) to handle variations in how content is rendered
- Accept and ignore animation-related warnings in the console as long as the tests pass
- See `src/tests/components/ui/ResourceVisualization.snapshot.test.tsx` for an example

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

## Utils

### Events

- `src/utils/events/EventBus.ts`: Implementation of the event bus pattern for application-wide event handling.
- `src/utils/events/EventTypes.ts`: Type definitions for various events used throughout the application.
- `src/utils/events/rxjsIntegration.ts`: Integration between the module event system and RxJS for reactive programming. Provides utilities for filtering, transforming, and combining event streams.

### Profiling

- `src/utils/profiling/applicationProfiler.ts`: Provides application-wide performance profiling capabilities. Includes functions for measuring component render times and tracking performance metrics.

### Port Configuration

- `vite.config.ts` - Development server configured to run on port 3001 with `strictPort: false` to allow fallback if port is in use.
- `playwright.config.ts` - E2E test configuration set to connect to port 3001, with webServer section to automatically start the dev server. Also updated `baseURL` to 'http://localhost:3001' in both chromium and firefox projects.
- `src/tests/e2e/exploration.spec.ts` - E2E tests updated to use `http://localhost:3001/` for navigation.
- `src/tests/e2e/mining-simplified.spec.ts` - E2E tests updated to use `http://localhost:3001/mining` for navigation.
- `src/tests/e2e/mining-test.spec.ts` - E2E tests updated to use `http://localhost:3001/mining` for navigation and improved with proper error handling.

### Test Configuration

- `playwright.config.ts` - Configured to automatically start the dev server before running tests, with unique port to avoid conflicts.
- `package.json` - Test scripts updated to use the correct commands for running E2E tests:
  - `npm run test:e2e` - Run all E2E tests
  - `npm run test:e2e:debug` - Run E2E tests in debug mode
  - `npm run test:e2e:ui` - Run E2E tests with Playwright UI
  - `npm run test:e2e:headed` - Run E2E tests in headed mode (visible browser)

## Testing

### Component Tests

- `src/tests/components/buildings/MiningWindow.test.tsx` - Tests for the MiningWindow component using the simplified testing approach. Focuses on verifying the presence of key UI elements and basic functionality without complex mocks.
- `src/tests/components/exploration/ReconShipCoordination.test.tsx` - Tests for the ReconShipCoordination component using the actual component implementation instead of mocks. Demonstrates the simplified testing approach that focuses on testing behavior and user-visible elements rather than implementation details. Uses a type-safe render function with a properly typed interface to ensure type checking during tests.

## Test Factories

### Overview

As part of our initiative to remove mocking from tests, we're implementing a "Test Factory Pattern" that creates actual implementations for testing rather than using mocks. These factories will create controlled, isolated instances of services and components that can be used in tests.

### Planned Test Factory Files

| File Path                                          | Purpose                                                                                 | Status      |
| -------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------- |
| src/tests/factories/createTestModuleEvents.ts      | Creates a real ModuleEvents implementation for testing with event tracking capabilities | Implemented |
| src/tests/factories/createTestResourceManager.ts   | Creates a real ResourceManager implementation with in-memory storage for testing        | Planned     |
| src/tests/factories/createTestGameProvider.tsx     | Creates a React context provider using the actual GameContext implementation            | Planned     |
| src/tests/factories/createTestAutomationManager.ts | Creates a real AutomationManager implementation for testing                             | Planned     |
| src/tests/factories/createTestModuleManager.ts     | Creates a real ModuleManager implementation for testing                                 | Planned     |

### Implemented Test Factories

#### createTestModuleEvents.ts

This factory creates a real implementation of the ModuleEvents system for testing purposes. It provides:

1. A fully functional ModuleEventBus that behaves like the real implementation
2. The complete set of ModuleEventType values as constants
3. Helper methods for verifying events and listeners in tests

**Key Features:**

- Event tracking and filtering by type or module ID
- Listener management with proper cleanup
- Error handling that matches the real implementation
- Helper methods for test verification

**Example Usage:**

```typescript
import { createTestModuleEvents } from '../factories/createTestModuleEvents';

describe('ModuleManager', () => {
  let testModuleEvents;

  beforeEach(() => {
    testModuleEvents = createTestModuleEvents();
    vi.doMock('../../../lib/modules/ModuleEvents', () => testModuleEvents);
  });

  afterEach(() => {
    testModuleEvents.clearEvents();
    vi.resetModules();
  });

  it('should emit events correctly', () => {
    // Test using real implementation
    const moduleEvents = require('../../../lib/modules/ModuleEvents');
    moduleEvents.moduleEventBus.emit('TEST_EVENT', { data: 'test' });

    // Verify using helper methods
    const events = testModuleEvents.getEmittedEvents('TEST_EVENT');
    expect(events.length).toBe(1);
    expect(events[0].eventData.data).toBe('test');
  });
});
```

### Test Factory Design Principles

1. **Type Compatibility**: Each factory creates objects that fully implement the actual interfaces of the system, ensuring type safety.
2. **Controlled Environment**: Factories create isolated instances with controlled state that won't affect other tests.
3. **Actual Behavior**: Test factories implement the actual behavior of the system, not simplified mocks.
4. **Verification Helpers**: Test factories include helper methods for verifying the behavior and state of created objects.
5. **Minimal Dependencies**: Test factories minimize dependencies on other parts of the system, making tests more focused.

### Relationship to Current Tests

These test factories will replace the mock implementations currently used in our tests. The following files will be updated to use test factories:

| Test File                                                       | Current Approach                               | Planned Approach                          |
| --------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------- |
| src/tests/components/ui/ResourceVisualization.snapshot.test.tsx | Using mock interfaces - FIXED                  | Using real TestGameProvider without mocks |
| src/tests/managers/ExplorationManager.test.ts                   | Using createTestEnvironment with mocks - FIXED | Using actual implementations              |
| src/tests/components/DataAnalysisSystem.test.tsx                | Using vi.mock() for GameContext                | Will use TestGameProvider                 |
| src/tests/hooks/useAutomation.test.tsx                          | Using vi.mock() for AutomationManager          | Will use createTestAutomationManager      |
| src/tests/managers/ResourceFlowManager.test.ts                  | Using vi.mock() for ResourceManager            | Will use createTestResourceManager        |
| src/tests/managers/GlobalAutomationManager.test.ts              | Using vi.mock() for various services           | Will use multiple test factories          |

### Test Factory Pattern Examples

```typescript
// Example usage for ModuleEvents testing
import { createTestModuleEvents } from '../factories/createTestModuleEvents';

describe('ModuleManager', () => {
  let testModuleEvents;

  beforeEach(() => {
    testModuleEvents = createTestModuleEvents();
    vi.doMock('../../../lib/modules/ModuleEvents', () => testModuleEvents);
  });

  afterEach(() => {
    testModuleEvents.clearEvents();
    vi.resetModules();
  });

  it('should emit events correctly', () => {
    // Test using real implementation
    const moduleEvents = require('../../../lib/modules/ModuleEvents');
    moduleEvents.moduleEventBus.emit('TEST_EVENT', { data: 'test' });

    // Verify using helper methods
    const events = testModuleEvents.getEmittedEvents('TEST_EVENT');
    expect(events.length).toBe(1);
    expect(events[0].eventData.data).toBe('test');
  });
});

// Example usage for component testing
import { renderWithGameContext } from '../factories/createTestGameProvider';
import { ResourceDisplay } from '../../components/ResourceDisplay';

describe('ResourceDisplay', () => {
  it('should display resources correctly', () => {
    // Render with controlled context state
    const { getByText } = renderWithGameContext(<ResourceDisplay />, {
      resources: {
        minerals: { value: 100, max: 500 }
      }
    });

    // Verify rendered content
    expect(getByText('Minerals: 100/500')).toBeInTheDocument();
  });
});
```

### Implementation Plan

The test factories will be implemented in phases:

1. Create core test factories for commonly used services
2. Update high-priority tests to use test factories
3. Create documentation and examples for using test factories
4. Update remaining tests to use test factories
5. Establish standards to prevent future use of mocks

This approach will improve test reliability, maintainability, and ensure tests verify actual behavior instead of mock behavior.

## Test Utilities

- `src/tests/utils/mockUtils.ts` - Contains mock implementations for various services and components (DEPRECATED - Use test factories instead)
- `src/tests/utils/testUtils.ts` - Contains utility functions for testing

## Test Factories

### Module Events Test Factory

- **File:** `src/tests/factories/createTestModuleEvents.ts`
- **Purpose:** Creates real ModuleEventBus implementation for testing
- **Features:** Event tracking, listener management, history retrieval
- **Related Files:** `src/lib/modules/ModuleEvents.ts`

### Resource Manager Test Factory

- **File:** `src/tests/factories/createTestResourceManager.ts`
- **Purpose:** Creates real ResourceManager implementation for testing
- **Features:** Resource tracking, production, consumption, transfers
- **Related Files:** `src/managers/game/ResourceManager.ts`

### Game Provider Test Factory

- **File:** `src/tests/factories/createTestGameProvider.tsx`
- **Purpose:** Creates real GameContext provider for testing components
- **Features:** Context provision, state management, helper methods
- **Related Files:** `src/contexts/GameContext.tsx`, `src/reducers/gameReducer.ts`

### Module Manager Test Factory

- **File:** `src/tests/factories/createTestModuleManager.ts`
- **Purpose:** Creates real ModuleManager implementation for testing
- **Features:** Module creation, building management, module activation
- **Related Files:** `src/managers/module/ModuleManager.ts`

## Recent Updates

- Added `src/components/core/SystemIntegration.tsx` - New component to bridge the gap between backend managers and frontend contexts
- Updated `src/App.tsx` to use the SystemIntegration component
- Fixed GameLayout integration with proper props
- Added development debugging tools for ResourceManager

## Tests

All tests are now located in the `src/tests/` directory, organized by test type.

### Test Factories

- **Factories**: `src/tests/factories/` - Test factory implementations for testing without mocks
  - `createTestModuleEvents.ts` - Factory for creating real ModuleEvents instances for testing
  - `createTestModuleEvents.test.ts` - Tests for the ModuleEvents test factory
  - `createTestModuleManager.ts` - Factory for creating real ModuleManager instances for testing
  - `createTestModuleManager.test.ts` - Tests for the ModuleManager test factory
  - `createTestResourceManager.ts` - Factory for creating real ResourceManager instances for testing
  - `createTestResourceManager.test.ts` - Tests for the ResourceManager test factory
  - `createTestGameProvider.tsx` - Factory for creating real GameProvider components for testing
  - `createTestGameProvider.test.tsx` - Tests for the GameProvider test factory
  - `createTestAutomationManager.ts` - Factory for creating real AutomationManager instances for testing
  - `createTestAutomationManager.test.ts` - Tests for the AutomationManager test factory

### Unit Tests

- **Components**: `src/tests/components/` - Tests for React components
  - `exploration/` - Tests for exploration components
    - `ExplorationManager.test.ts` - Tests for the ExplorationManager functionality, including ship assignment and search/filtering operations
  - `buildings/` - Tests for building components
  - `ui/` - Tests for UI components
    - `ResourceVisualization.snapshot.test.tsx` - Snapshot tests for the ResourceVisualization component using mocked framer-motion components
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
- `src/tests/e2e/models/ExplorationPage.ts` - Page Object Model for the Exploration page used in E2E tests
- `src/tests/e2e/mining-simplified.spec.ts` - Simplified E2E tests for the Mining module functionality
- `src/tests/e2e/exploration.spec.ts` - E2E tests for the Exploration module functionality
  - Uses flexible selectors to handle UI variations
  - Implements robust error handling for game initialization issues
  - Takes screenshots at key points for debugging
  - Logs detailed information about page content
  - Consolidated functionality from exploration-basic.spec.ts
- `src/tests/e2e/mining-test.spec.ts` - Comprehensive E2E tests for the Mining module functionality
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
- `CodeBase_Docs/Test_Fixes_March_2025.md` - Documentation of test fixes implemented in March 2025
  - Includes detailed solutions for ResourceVisualization.snapshot.test.tsx
  - Documents the fix for ExplorationManager.test.ts import issues
  - Provides best practices for mocking and test isolation

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
- `src/tests/utils/portManager.ts` - Port management utility for test environment
  - Handles dynamic port allocation for services in tests
  - Prevents port conflicts between tests
  - Provides cleanup mechanisms for used ports
  - Tracks port usage with service names and timestamps
- `src/tests/utils/testStateReset.ts` - Utility for resetting global state between tests
  - Provides functions for registering cleanup functions
  - Implements global state reset for tests
  - Handles WebSocket server cleanup
  - Manages resource manager cleanup
  - Provides setup and teardown functions for test environment
- `src/tests/utils/resourceManagerCleanup.ts` - Utility for implementing proper cleanup for resource managers
  - Provides functions for registering resource managers for cleanup
  - Implements a registry for managing multiple resource managers
  - Supports different cleanup methods (cleanup, reset, clear, dispose)
  - Provides helper functions for creating cleanable managers
- `src/tests/utils/testTeardown.ts` - Utility for adding teardown functions to test suites
  - Provides functions for registering teardown functions
  - Implements test isolation with automatic setup and teardown
  - Supports objects with teardown methods
  - Provides helper functions for creating test contexts with automatic teardown
- `src/tests/utils/mockUtils.ts` - Centralized mocking utilities for common modules
  - Provides standardized mocks for frequently used modules
  - Includes utilities for mocking ES modules without hoisting issues
  - Supports mocking both named and default exports
  - Includes utilities for mocking React components, hooks, and context providers
  - Provides helper functions for creating mock classes and objects
  - Implements proper cleanup for mocks with restoreAllMocks function
  - Contains createFramerMotionMock for mocking framer-motion components and hooks
  - Used in ResourceVisualization.snapshot.test.tsx to avoid matchMedia issues
  - Implements mockESModule and mockModuleWithExports for ES module mocking
- `src/tests/utils/exploration/explorationTestUtils.ts` - Utilities for testing exploration components
  - Contains createTestEnvironment function for setting up test environments with exploration and ship managers
  - Used in ExplorationManager.test.ts for testing ship assignment and search/filtering
  - Provides mock implementations for exploration-related functionality
  - Includes utilities for creating mock star systems, ships, and other exploration entities
- `src/tests/utils/testPerformanceUtils.ts` - Utilities for optimizing test performance
  - Provides functions for parallel test execution with controlled concurrency
  - Implements resource optimization for expensive operations with caching
  - Supports lazy initialization of test resources
  - Includes utilities for measuring memory usage during test execution
  - Provides functions for running setup operations in parallel
  - Implements conditional setup to skip expensive operations when not needed
  - Supports mocking expensive operations to improve test performance
- `src/tests/examples/mockUtilsExample.test.ts` - Example tests for the mock utilities
  - Demonstrates proper usage of the mock utilities
  - Shows how to create and use mocks for common modules
  - Illustrates ES module mocking techniques
  - Provides examples of mocking with custom implementations
- `src/tests/examples/testPerformanceExample.test.ts` - Example tests for the test performance utilities
  - Demonstrates parallel test execution with executeTestsInParallel and parallelDescribe
  - Shows resource optimization with optimizeResourceIntensiveOperation
  - Illustrates lazy initialization with createLazyTestValue
  - Provides examples of parallel setup and conditional setup
  - Demonstrates memory usage measurement with measureMemoryUsage
- `src/tests/utils/testUtilsUsageExample.test.tsx` - Example tests for the test utilities
  - Demonstrates proper usage of the test utilities
  - Uses CPU-intensive operations for reliable performance testing
  - Implements proper assertions for performance metrics
- `src/tests/examples/testIsolationExample.test.ts` - Example tests for the test isolation utilities
  - Demonstrates proper usage of the test isolation utilities
  - Shows how to use the resource manager registry
  - Illustrates WebSocket server isolation
  - Provides examples of multiple manager isolation
- `src/tests/setup.ts` - Main test setup file
  - Configures global mocks and test environment
  - Provides WebSocket server management with dynamic port allocation
  - Implements proper cleanup for test resources
  - Exports helper functions for test setup and teardown
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
    "test:tools": "vitest src/tests/tools",
    "test:coverage": "vitest run --coverage"
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
- `src/contexts/DataAnalysisContext.tsx`

## UI Component Fixes (March 2025)

### Core UI Components

| Component                                     | Purpose                                                  | Changes                                                                                                    |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/components/ui/GameHUD.tsx`               | Main game interface for module building and management   | Enhanced UI with keyboard shortcuts, tooltips, improved resource display, better module building functions |
| `src/components/ui/GameLayout.tsx`            | Layout component that contains GameHUD and manages views | Fixed view toggle functions, improved state management, added logging                                      |
| `src/components/ui/ResourceVisualization.tsx` | Visualizes resource levels with thresholds               | Connected to actual game state, added threshold indicators                                                 |

### UI Component Fixes

| Issue                       | File             | Solution                                                                             |
| --------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| Module building not working | `GameHUD.tsx`    | Implemented proper module building function that accesses the ModuleContext directly |
| Navigation issues           | `GameLayout.tsx` | Fixed view toggle functions and added proper state management                        |
| Context usage issues        | `GameHUD.tsx`    | Implemented local versions of context functions to avoid hook usage issues           |
| Poor user feedback          | `GameHUD.tsx`    | Added tooltips, keyboard shortcuts, and enhanced resource status displays            |

### UI Component Enhancements

The GameHUD component has been significantly enhanced with the following features:

1. **Keyboard Shortcuts**

   - Alt+M for Mining menu
   - Alt+E for Exploration menu
   - Alt+H for Mothership menu
   - Alt+C for Colony menu
   - F1 for Tech Tree
   - F2 for Settings
   - Escape to close active menu

2. **Enhanced Resource Display**

   - Added real-time extraction rate indicators (+/- per second)
   - Resource status indicators with icons (critical, normal, abundant)
   - Color-coded resource values based on thresholds

3. **Tooltips and Improved UX**

   - Implemented detailed tooltips for all menu items
   - Enhanced resource requirement displays
   - Added build availability status in tooltips
   - Improved visual feedback for user interactions

4. **Building Process Improvements**
   - Fixed module building functionality to work properly with ModuleContext
   - Added detailed resource requirement checks
   - Improved error messages with specific resource shortage information
   - Enhanced notifications with more detailed information

### ResourceVisualization Tooltip Implementation (March 2025)

The ResourceVisualization component has been enhanced with an informative tooltip system that provides detailed information about each resource:

1. **Resource Information Display**

   - Shows current value, capacity, and utilization percentage
   - Displays extraction/consumption rates with color coding
   - Includes time-to-empty calculations for resources being consumed
   - Includes time-to-full calculations for resources being generated

2. **Threshold Visualization**

   - Displays low and critical thresholds with colored indicators
   - Shows status messages based on current resource levels
   - Provides visual feedback on resource status

3. **Interactive Elements**

   - Tooltips appear on hover with smooth positioning
   - Cursor changes to indicate interactive elements
   - Resource cards provide visual feedback on hover

4. **Technical Implementation**
   - Uses the existing tooltip context system
   - Implements ref-based positioning for accurate tooltip placement
   - Provides descriptive resource information for better user understanding
   - Calculates important metrics like time until empty/full

These enhancements significantly improve the user experience by providing more detailed information about resources, helping players make informed decisions about resource management.

### UI Component Flow

The updated UI component flow ensures proper integration between components:

1. `App.tsx` - Initializes the game state and context providers
2. `GameLayout.tsx` - Manages the overall game layout and view toggles
3. `GameHUD.tsx` - Provides enhanced interface for module building
4. `ResourceVisualization.tsx` - Displays resource levels with visual feedback

The UI component enhancements ensure proper integration between the UI layer and the game systems, allowing module building, navigation between views, and providing clear feedback to the user.

## Officer Management System

The Officer Management System handles the recruitment, training, and assignment of officers to various ships and squads.

### Core Files

| File Path                               | Purpose                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/officers/OfficerTypes.ts`    | Defines all officer-related TypeScript interfaces and types including OfficerRole, OfficerSpecialization, Officer, Squad, and related events |
| `src/managers/module/OfficerManager.ts` | Core implementation of the OfficerManager that handles hiring, training, squad management, and experience progression                        |
| `src/config/OfficerConfig.ts`           | Configuration settings for officer-related systems                                                                                           |

### UI Components

| File Path                                                     | Purpose                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| `src/components/buildings/modules/academy/OfficerAcademy.tsx` | Main academy UI component that displays and manages officers  |
| `src/components/buildings/modules/academy/OfficerCard.tsx`    | Displays individual officer information in grid or list views |
| `src/components/buildings/modules/academy/OfficerDetails.tsx` | Shows detailed officer information when selected              |

## Ship Hangar System

The Ship Hangar System manages ship construction, docking, deployment, and maintenance.

### Core Files

| File Path                                  | Purpose                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `src/types/buildings/ShipHangarTypes.ts`   | Defines all ship hangar related TypeScript interfaces including ShipBuildQueueItem, ShipHangarBay, and events |
| `src/managers/module/ShipHangarManager.ts` | Implementation of ship construction, bay management, repair, and deployment functionality                     |

### UI Components

| File Path                                                | Purpose                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/components/buildings/modules/hangar/ShipHangar.tsx` | Main UI component for managing ships, building queue, and deployment |

## Core Components

- **Core Components**: `src/components/core/` - Core system integration components
  - `SystemIntegration.tsx` - Integrates frontend contexts with backend managers, synchronizing resource and module states
  - `ThresholdIntegration.tsx` - Connects ThresholdContext with ResourceManager, managing resource thresholds
  - `IntegrationErrorHandler.tsx` - Error boundary component for integration components

## Debug Components

- **Debug Components**: `src/components/debug/` - Debugging and monitoring components
  - `GameStateMonitor.tsx` - Real-time visualization of game state for debugging, including resources, modules, events, and system metrics

## Contexts

- **Resource Contexts**: `src/contexts/` - Context providers for resource management
  - `ResourceRatesContext.tsx` - Tracks and provides resource production and consumption rates
  - `ThresholdContext.tsx` - Manages resource thresholds and alerts
  - `GameContext.tsx` - Manages global game state
  - `ModuleContext.tsx` - Manages module state

## System Integration Components

### Core Integration Components

- `src/components/core/SystemIntegration.tsx` - Core component that bridges frontend and backend systems

  - Handles resource state synchronization
  - Connects to ModuleEvents system for real-time updates
  - Emits resource update events to notify other systems

- `src/components/core/ThresholdIntegration.tsx` - Component that integrates resource thresholds with UI

  - Monitors resource levels against defined thresholds
  - Triggers alerts when thresholds are crossed
  - Updates UI components with threshold status

- `src/components/core/IntegrationErrorHandler.tsx` - Error boundary component for integration components
  - Catches and handles errors in integration components
  - Provides fallback UI when errors occur
  - Logs errors to the ErrorLoggingService
  - Attempts recovery from non-fatal errors

### Event System

- `src/services/EventPropagationService.ts` - Service for mapping and propagating events between systems

  - Centralizes event mapping configuration
  - Transforms events between different event systems
  - Ensures events are properly propagated to all interested components

- `src/hooks/events/useSystemEvents.ts` - Custom hooks for UI components to register for system events
  - `useModuleEvents`: Hook for subscribing to module events with automatic cleanup
  - `useGlobalSystemEvents`: Hook for subscribing to global game events
  - `useMultipleModuleEvents`: Helper hook for subscribing to multiple module events

### UI Components

- `src/components/ui/ResourceEventMonitor.tsx` - Component that demonstrates the use of event hooks
  - Monitors and displays resource-related events in real-time
  - Shows how to properly subscribe to events and handle cleanup
  - Provides filtering and clearing of event logs

## Resource Management

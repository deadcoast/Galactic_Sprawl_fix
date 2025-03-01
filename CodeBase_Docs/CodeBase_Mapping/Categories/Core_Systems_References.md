---
CORE SYSTEMS REFERENCES
---

# Core Systems Architecture

## Resource Management [~60% Complete]

- Implemented in: src/managers/game/ResourceManager.ts
- Performance monitoring: src/managers/resource/ResourcePerformanceMonitor.ts
- Performance monitoring: src/managers/resource/ResourcePerformanceMonitor.ts
- Resource events: src/hooks/modules/useModuleEvents.ts
- Mining implementation: src/managers/mining/MiningShipManagerImpl.ts

## Module Framework [100% Complete]

- Core types: src/types/buildings/ModuleTypes.ts
- Module manager: src/managers/module/ModuleManager.ts
- Module events: src/lib/modules/ModuleEvents.ts
- Ship hangar: src/managers/module/ShipHangarManager.ts
- Module attachment: src/managers/module/ModuleAttachmentManager.ts
- Module validation: src/utils/modules/moduleValidation.ts
- Module HUD: src/components/ui/modules/ModuleHUD.tsx
- Module automation: src/hooks/modules/useModuleAutomation.ts
- Sub-module system: src/managers/module/SubModuleManager.ts
- Module status tracking: src/managers/module/ModuleStatusManager.ts
- Module upgrade system: src/managers/module/ModuleUpgradeManager.ts
- Framework initialization: src/initialization/moduleFrameworkInit.ts

## Event System [~80% Complete]

- Event emitter: src/utils/EventEmitter.ts
- Module events: src/lib/modules/ModuleEvents.ts
- Combat events: src/managers/combat/combatManager.ts
- Faction events: src/managers/factions/FactionRelationshipManager.ts
- Event dispatcher: src/utils/events/EventDispatcher.tsx
- RxJS integration: src/utils/events/rxjsIntegration.ts
- Game loop manager: src/managers/game/GameLoopManager.ts
- Event communication: src/utils/events/EventCommunication.ts
- Event filtering: src/utils/events/EventFiltering.ts
- Event system initialization: src/initialization/eventSystemInit.ts
- Automation system initialization: src/initialization/automationSystemInit.ts
- Game Systems Integration: src/initialization/gameSystemsIntegration.ts

## State Management [~40% Complete]

- Game context: src/contexts/GameContext.tsx
- Combat state: src/managers/combat/combatManager.ts
- Fleet AI state: src/hooks/factions/useFleetAI.ts
- Faction behavior: src/hooks/factions/useFactionBehavior.ts

## UI Framework [~30% Complete]

- Main layout: src/components/ui/GameLayout.tsx
- Star system view: src/components/ui/VPRStarSystemView.tsx
- Tech tree: src/components/ui/TechTree.tsx
- Game HUD: src/components/ui/GameHUD.tsx

## Faction Ship System [~70% Complete]

- Base components:
  - FactionShipBase: src/components/ships/common/FactionShipBase.tsx
  - FactionShipStats: src/components/ships/common/FactionShipStats.tsx
  - LostNovaShip: src/components/ships/common/LostNovaShip.tsx
  - SpaceRatShip: src/components/ships/common/SpaceRatShip.tsx
- Lost Nova faction ships:
  - DarkMatterReaper: src/components/ships/FactionShips/lostNova/DarkMatterReaper.tsx
  - EclipseScythe: src/components/ships/FactionShips/lostNova/EclipseScythe.tsx
  - NullHunter: src/components/ships/FactionShips/lostNova/NullHunter.tsx
- Space Rats faction ships:
  - RatKing: src/components/ships/FactionShips/spaceRats/RatKing.tsx
  - RogueNebula: src/components/ships/FactionShips/spaceRats/RogueNebula.tsx
- Type definitions:
  - FactionShipTypes: src/types/ships/FactionShipTypes.ts
  - FactionTypes: src/types/ships/FactionTypes.ts
  - ShipTypes: src/types/ships/ShipTypes.ts
  - WeaponTypes: src/types/weapons/WeaponTypes.ts
  - WeaponEffects: src/effects/types_effects/WeaponEffects.ts

## VPR (Visual Progress Representation) View

- Components:
  - VPR View: src/components/ui/VPRStarSystemView.tsx
  - Game Layout: src/components/ui/GameLayout.tsx

## Civilization Sprawl View [~40% Complete]

- Components:
  - Sprawl View: src/components/ui/SprawlView.tsx
  - Game Layout: src/components/ui/GameLayout.tsx

## Resource Management System

- Primary Components:
  - Resource Manager: src/managers/game/ResourceManager.ts
    Purpose: Central management of all game resources
    Dependencies: ResourcePerformanceMonitor, ModuleEvents
  - Performance Monitor: src/managers/resource/ResourcePerformanceMonitor.ts
    Purpose: Monitor and optimize resource operations
    Dependencies: ResourceManager
  - Resource Events: src/hooks/modules/useModuleEvents.ts

### Core Systems Architecture

1. Resource Management [~60% Complete]

   - Implemented in: src/managers/game/ResourceManager.ts
   - Performance monitoring: src/managers/resource/ResourcePerformanceMonitor.ts
   - Performance monitoring: src/managers/resource/ResourcePerformanceMonitor.ts
   - Resource events: src/hooks/modules/useModuleEvents.ts
   - Mining implementation: src/managers/mining/MiningShipManagerImpl.ts

2. Module Framework [100% Complete]

   - Core types: src/types/buildings/ModuleTypes.ts
   - Module manager: src/managers/module/ModuleManager.ts
   - Module events: src/lib/modules/ModuleEvents.ts
   - Ship hangar: src/managers/module/ShipHangarManager.ts
   - Module attachment: src/managers/module/ModuleAttachmentManager.ts
   - Module validation: src/utils/modules/moduleValidation.ts
   - Module HUD: src/components/ui/modules/ModuleHUD.tsx
   - Module automation: src/hooks/modules/useModuleAutomation.ts
   - Sub-module system: src/managers/module/SubModuleManager.ts
   - Module status tracking: src/managers/module/ModuleStatusManager.ts
   - Module upgrade system: src/managers/module/ModuleUpgradeManager.ts
   - Framework initialization: src/initialization/moduleFrameworkInit.ts

3. Event System [~80% Complete]

   - Event emitter: src/utils/EventEmitter.ts
   - Module events: src/lib/modules/ModuleEvents.ts
   - Combat events: src/managers/combat/combatManager.ts
   - Faction events: src/managers/factions/FactionRelationshipManager.ts
   - Event dispatcher: src/utils/events/EventDispatcher.tsx
   - RxJS integration: src/utils/events/rxjsIntegration.ts
   - Game loop manager: src/managers/game/GameLoopManager.ts
   - Event communication: src/utils/events/EventCommunication.ts
   - Event filtering: src/utils/events/EventFiltering.ts
   - Event system initialization: src/initialization/eventSystemInit.ts
   - Automation system initialization: src/initialization/automationSystemInit.ts
   - Game Systems Integration: src/initialization/gameSystemsIntegration.ts

4. State Management [~40% Complete]

   - Game context: src/contexts/GameContext.tsx
   - Combat state: src/managers/combat/combatManager.ts
   - Fleet AI state: src/hooks/factions/useFleetAI.ts
   - Faction behavior: src/hooks/factions/useFactionBehavior.ts

5. Faction Ship System [~70% Complete]

   - Base components:
     - FactionShipBase: src/components/ships/common/FactionShipBase.tsx
     - FactionShipStats: src/components/ships/common/FactionShipStats.tsx
     - LostNovaShip: src/components/ships/common/LostNovaShip.tsx
     - SpaceRatShip: src/components/ships/common/SpaceRatShip.tsx
   - Lost Nova faction ships:
     - DarkMatterReaper: src/components/ships/FactionShips/lostNova/DarkMatterReaper.tsx
     - EclipseScythe: src/components/ships/FactionShips/lostNova/EclipseScythe.tsx
     - NullHunter: src/components/ships/FactionShips/lostNova/NullHunter.tsx
   - Space Rats faction ships:
     - RatKing: src/components/ships/FactionShips/spaceRats/RatKing.tsx
     - RogueNebula: src/components/ships/FactionShips/spaceRats/RogueNebula.tsx
   - Type definitions:
     - FactionShipTypes: src/types/ships/FactionShipTypes.ts
     - FactionTypes: src/types/ships/FactionTypes.ts
     - ShipTypes: src/types/ships/ShipTypes.ts
     - WeaponTypes: src/types/weapons/WeaponTypes.ts
     - WeaponEffects: src/effects/types_effects/WeaponEffects.ts

6. VPR (Visual Progress Representation) View

   - Components:
     - VPR View: src/components/ui/VPRStarSystemView.tsx
     - Game Layout: src/components/ui/GameLayout.tsx

7. Civilization Sprawl View [~40% Complete]

   - Components:
     - Sprawl View: src/components/ui/SprawlView.tsx
     - Game Layout: src/components/ui/GameLayout.tsx

8. Resource Management System

   - Primary Components:
     - Resource Manager: src/managers/game/ResourceManager.ts
       Purpose: Central management of all game resources
       Dependencies: ResourcePerformanceMonitor, ModuleEvents
     - Performance Monitor: src/managers/resource/ResourcePerformanceMonitor.ts
       Purpose: Monitor and optimize resource operations
       Dependencies: ResourceManager
     - Resource Events: src/hooks/modules/useModuleEvents.ts
       Purpose: Handle resource-related events and updates
       Dependencies: EventEmitter
     - Mining Implementation: src/managers/mining/MiningShipManagerImpl.ts
       Purpose: Handle mining operations and resource extraction
       Dependencies: ResourceManager, ShipHangarManager

9. Module Framework

- Primary Components:
  - Core Types: src/types/buildings/ModuleTypes.ts
    Purpose: Type definitions for all module systems
    Used By: ModuleManager, ShipHangarManager
  - Module Manager: src/managers/module/ModuleManager.ts
    Purpose: Manage module lifecycle and interactions
    Dependencies: ModuleTypes, ModuleEvents
  - Module Events: src/lib/modules/ModuleEvents.ts
    Purpose: Handle module-specific events
    Dependencies: EventEmitter
  - Ship Hangar: src/managers/module/ShipHangarManager.ts
    Purpose: Manage ship construction and deployment
    Dependencies: ModuleTypes, ResourceManager
  - Module Attachment Manager: src/managers/module/ModuleAttachmentManager.ts
    Purpose: Manage module attachment to buildings and ships
    Dependencies: ModuleTypes, ModuleEvents, ModuleManager
  - Module Validation: src/utils/modules/moduleValidation.ts
    Purpose: Validate module operations and types
    Dependencies: ModuleTypes
  - Module HUD: src/components/ui/modules/ModuleHUD.tsx
    Purpose: Display module information and controls
    Dependencies: ModuleManager, ModuleEvents
  - Module Automation: src/hooks/modules/useModuleAutomation.ts
    Purpose: Automate module operations based on rules
    Dependencies: ModuleManager, ModuleEvents
  - Sub-Module Manager: src/managers/module/SubModuleManager.ts
    Purpose: Manage sub-module lifecycle and effects
    Dependencies: ModuleTypes, ModuleEvents, ModuleManager
  - Sub-Module Hook: src/hooks/modules/useSubModules.ts
    Purpose: React hook for sub-module management
    Dependencies: SubModuleManager
  - Sub-Module HUD: src/components/ui/modules/SubModuleHUD.tsx
    Purpose: Display sub-module information and controls
    Dependencies: SubModuleManager, useSubModules
  - Module Status Manager: src/managers/module/ModuleStatusManager.ts
    Purpose: Track module status, history, and alerts
    Dependencies: ModuleTypes, ModuleEvents, ModuleManager
  - Module Status Hook: src/hooks/modules/useModuleStatus.ts
    Purpose: React hook for module status management
    Dependencies: ModuleStatusManager, ModuleEvents
  - Module Status Display: src/components/ui/modules/ModuleStatusDisplay.tsx
    Purpose: Visualize module status, metrics, and alerts
    Dependencies: useModuleStatus, ModuleManager
  - Module Upgrade Manager: src/managers/module/ModuleUpgradeManager.ts
    Purpose: Manage module upgrade paths, requirements, and effects
    Dependencies: ModuleTypes, ModuleEvents, ModuleManager, ResourceManager
  - Module Upgrade Hook: src/hooks/modules/useModuleUpgrade.ts
    Purpose: React hook for module upgrade management
    Dependencies: ModuleUpgradeManager, ModuleEvents
  - Module Upgrade Display: src/components/ui/modules/ModuleUpgradeDisplay.tsx
    Purpose: Display module upgrade information and controls
    Dependencies: useModuleUpgrade, ModuleManager
  - Module Upgrade Visualization: src/components/ui/modules/ModuleUpgradeVisualization.tsx
    Purpose: Visualize module upgrades with animations and effects
    Dependencies: useModuleUpgrade, ModuleUpgradeManager
  - Module Framework Initialization: src/initialization/moduleFrameworkInit.ts
    Purpose: Initialize and integrate the module framework with existing systems
    Dependencies: ModuleManager, ModuleAttachmentManager, ModuleStatusManager, ModuleUpgradeManager, SubModuleManager, ResourceManager

11. Event System

- Primary Components:
  - Event Emitter: src/utils/EventEmitter.ts
    Purpose: Core event handling system
    Used By: All event-based systems
  - Module Events: src/lib/modules/ModuleEvents.ts
    Purpose: Module-specific event handling
    Dependencies: EventEmitter
  - Combat Events: src/managers/combat/combatManager.ts
    Purpose: Combat-related event handling
    Dependencies: EventEmitter, FleetAI
  - Faction Events: src/managers/factions/FactionRelationshipManager.ts
    Purpose: Manage faction interactions and relationships
    Dependencies: EventEmitter
  - Event Dispatcher: src/utils/events/EventDispatcher.tsx
    Purpose: React Context-based event dispatcher for components
    Dependencies: ModuleEvents, React Context API
  - RxJS Integration: src/utils/events/rxjsIntegration.ts
    Purpose: Integrate RxJS with the event system for reactive programming
    Dependencies: ModuleEvents, RxJS
  - Game Loop Manager: src/managers/game/GameLoopManager.ts
    Purpose: Centralized timer and game loop for consistent updates
    Dependencies: ModuleEvents
  - Event Communication: src/utils/events/EventCommunication.ts
    Purpose: System-to-system messaging and communication
    Dependencies: ModuleEvents, RxJS
  - Event Filtering: src/utils/events/EventFiltering.ts
    Purpose: Filter, batch, and prioritize events
    Dependencies: RxJS
  - Event System Initialization: src/initialization/eventSystemInit.ts
    Purpose: Initialize and integrate all event system components
    Dependencies: EventDispatcher, RxJS Integration, Game Loop Manager, Event Communication
  - Automation System Initialization: src/initialization/automationSystemInit.ts
    Purpose: Initialize the global automation system and register default routines
    Dependencies: GlobalAutomationManager, EventDispatcher, Game Loop Manager
  - Game Systems Integration: src/initialization/gameSystemsIntegration.ts
    Purpose: Integrate the event system with existing game systems
    Dependencies: ResourceManager, MiningShipManagerImpl, CombatManager, TechTreeManager, EventDispatcher

12. State Management

- Primary Components:
  - Game Context: src/contexts/GameContext.tsx
    Purpose: Global game state management
    Used By: All game components
  - Combat State: src/managers/combat/combatManager.ts
    Purpose: Manage combat system state
    Dependencies: GameContext, FleetAI
  - Fleet AI State: src/hooks/factions/useFleetAI.ts
    Purpose: Handle fleet AI behavior and state
    Dependencies: GameContext, FactionBehavior
  - Faction Behavior: src/hooks/factions/useFactionBehavior.ts
    Purpose: Manage faction behavior patterns
    Dependencies: GameContext

### Required Libraries & Dependencies

1. Core Technologies

   - React/TypeScript
     Purpose: Main development framework
     Used By: All components
   - Redux/Context
     Purpose: State management
     Used By: GameContext, all managers
   - WebGL/Three.js
     Purpose: 3D visualization
     Used By: VPRStarSystemView
   - RxJS
     Purpose: Event handling
     Used By: EventEmitter, all event systems

2. Visualization Libraries

   - React-konva
     Purpose: Canvas rendering
     Used By: 2D game elements
   - React-three-fiber
     Purpose: 3D rendering
     Used By: VPRStarSystemView
   - D3.js
     Purpose: Data visualization
     Used By: SprawlView
   - SVG.js
     Purpose: Vector graphics
     Used By: UI components

3. Animation Libraries

   - Framer Motion
     Purpose: Component animations
     Used By: UI transitions
   - GSAP
     Purpose: Complex animations
     Used By: Visual effects
   - React-spring
     Purpose: Physics-based animations
     Used By: Interactive elements

4. Utility Libraries
   - React-zoom-pan-pinch
     Purpose: Navigation controls
     Used By: Map views
   - React-tooltip
     Purpose: Information display
     Used By: UI components

### Development Tools

1. Build Tools

   - Webpack/Vite
     Purpose: Build system
     Used By: Development pipeline
   - ESLint/Prettier
     Purpose: Code quality
     Used By: Development workflow
   - LintingFixes.md
     Purpose: Documentation of linting fixes and best practices
     Used By: Development workflow, code quality maintenance

2. Testing Tools

   - Jest/Testing Library
     Purpose: Unit/Integration testing
     Used By: Test suites
   - Storybook
     Purpose: Component development
     Used By: UI development

3. Linter Configuration

   - ESLint Config: eslint.config.js
     Purpose: Configure ESLint rules for the project
     Used By: All TypeScript/JavaScript files
   - TypeScript Config: tsconfig.json
     Purpose: Configure TypeScript compiler options
     Used By: TypeScript compiler, ESLint
   - Node TypeScript Config: tsconfig.node.json
     Purpose: Configure TypeScript for Node.js specific code
     Used By: Node.js related TypeScript files
   - Linting Fixes Documentation: LintingFixes.md
     Purpose: Document common linting issues and their solutions
     Used By: Developers fixing linting issues

4. Linting and Type Safety

   - Primary Components:
     - ESLint Configuration: .eslintrc.json
       Purpose: Configure ESLint rules for the project
       Used By: All TypeScript/JavaScript files
     - Prettier Configuration: .prettierrc.json
       Purpose: Configure code formatting rules
       Used By: All source files
     - VPR Hook: src/hooks/ui/useVPR.ts
       Purpose: Manage Visual Progress Representation state
       Dependencies: React hooks
       Contains: VPRState interface for type safety
     - VPR System Hook: src/hooks/ui/useVPRSystem.ts
       Purpose: Manage VPR system with modules and upgrades
       Dependencies: React hooks, VPR Hook
       Contains: ModuleUpdateData type for type safety
     - Global Automation Hook: src/hooks/automation/useGlobalAutomation.ts
       Purpose: Manage global automation events and routines
       Dependencies: React hooks, Event system
       Contains: AutomationEvent interface for type safety
     - Resource Validation: src/utils/resources/resourceValidation.ts
       Purpose: Validate resource-related objects
       Dependencies: ResourceTypes
       Contains: Type guards for resource objects
     - Type Conversions: src/utils/typeConversions.ts
       Purpose: Convert between different type representations
       Dependencies: CombatTypes, WeaponTypes
       Contains: Helper functions for type conversions
     - Exploration Hub: src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
       Purpose: Manage exploration ships and missions
       Dependencies: ReconShipManagerImpl
       Contains: ExplorationTask interface for type safety
     - Linting Tools: tools/
       Purpose: Scripts for analyzing and fixing linting issues
       Files: analyze-lint-errors.js, chart-eslint-by-rule.js, fix-eslint-by-rule.js, track-eslint-progress.js
       Dependencies: ESLint, fs, path

5. Ship Configuration [~75% Complete]

   - Core Stats: src/config/ships/shipStats.ts
     Purpose: Base ship statistics configuration
     Used By: All ship implementations
   - Space Rats Ships: src/config/ships/spaceRatsShips.ts
     Purpose: Space Rats faction ship configurations
     Dependencies: shipStats.ts
     Features:
     - 10 unique ship types
     - Faction-specific stats
     - Special abilities
     - Weapon configurations
   - Lost Nova Ships: src/config/ships/lostNovaShips.ts
     Purpose: Lost Nova faction ship configurations
     Dependencies: shipStats.ts
     Features:
     - 10 unique ship types
     - Stealth mechanics
     - Advanced tech integration
     - Special weapon systems
   - Equator Horizon Ships: src/config/ships/equatorHorizonShips.ts
     Purpose: Equator Horizon faction ship configurations
     Dependencies: shipStats.ts
     Features:
     - 10 unique ship types
     - Balance mechanics
     - Advanced defense systems
     - Specialized weapon loadouts
   - Configuration Index: src/config/ships/index.ts
     Purpose: Central export point for ship configurations
     Dependencies: All ship configuration files

6. Ship Type Relationships

   - Base Ship Types:
     Location: src/components/ships/base/
     Dependencies:
     - Combat system
     - Weapon system
     - Movement system
   - Faction Ship Extensions:
     Location: src/components/ships/FactionShips/
     Dependencies:
     - Base ship types
     - Faction behavior system
     - Special abilities system
   - Configuration Integration:
     Location: src/config/ships/
     Dependencies:
     - Ship components
     - Combat system
     - Weapon system
     - Faction system

7. Ship Implementation Features
   - Base Features:
     - Core movement system
     - Basic weapon mounts
     - Health/shield management
     - Status tracking
   - Faction Features:
     - Unique abilities
     - Special weapons
     - Custom formations
     - Faction bonuses
   - Configuration Features:
     - Balanced stat distribution
     - Progressive tier system
     - Resource requirements
     - Tech tree integration

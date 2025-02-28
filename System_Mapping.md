***********************************
PROJECT PHASE MAPPING
***********************************

## Project Mapping Guidelines
- All paths are relative to project root
- Dependencies indicate direct relationships
- "Used By" indicates reverse dependencies
- All components should follow consistent naming
- Event systems should use centralized bus


### Core Systems Architecture

1. Resource Management [~60% Complete]
   - Implemented in: src/managers/game/ResourceManager.ts
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

5. UI Framework [~30% Complete]
   - Main layout: src/components/ui/GameLayout.tsx
   - Star system view: src/components/ui/VPRStarSystemView.tsx
   - Tech tree: src/components/ui/TechTree.tsx
   - Game HUD: src/components/ui/GameHUD.tsx

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

10. Event System
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

11. State Management
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

### View System Architecture

1. Core UI Framework
   - Primary Components:
     - Main Layout: src/components/ui/GameLayout.tsx
       Purpose: Main game layout structure
       Used By: All view components
     - Game HUD: src/components/ui/GameHUD.tsx
       Purpose: Heads-up display interface
       Dependencies: GameContext, ResourceManager
     - VPR View: src/components/ui/VPRStarSystemView.tsx
       Purpose: Visual progress representation
       Dependencies: GameLayout, ResourceManager
     - Tech Tree: src/components/ui/TechTree.tsx
       Purpose: Technology progression interface
       Dependencies: GameContext, ResourceManager

2. Visualization Components
   - Primary Components:
     - Star System View: src/components/ui/VPRStarSystemView.tsx
       Purpose: Main game view interface
       Dependencies: GameLayout, ThreeJS
     - Sprawl View: src/components/ui/SprawlView.tsx
       Purpose: Civilization expansion interface
       Dependencies: GameLayout, D3

3. Module-Specific Views
   - Primary Components:
     - Colony Core: src/components/buildings/colony/ColonyCore.tsx
       Purpose: Colony management interface
       Dependencies: ModuleManager, ResourceManager
     - Mining Hub: src/components/buildings/modules/MiningHub/MiningControls.tsx
       Purpose: Mining operations interface
       Dependencies: MiningShipManager, ResourceManager
     - Exploration Hub: src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
       Purpose: Exploration management interface
       Dependencies: ReconShipManager

4. Rendering Systems
   - Primary Components:
     - Parallax System: src/systems/rendering/ParallaxSystem.ts
       Purpose: Handle multi-layer background effects
       Dependencies: ThreeJS, GameContext
     - Environmental Effects: src/systems/rendering/EnvironmentalEffects.ts
       Purpose: Manage weather and lighting effects
       Dependencies: ThreeJS, GameContext
     - Animation Manager: src/systems/rendering/AnimationManager.ts
       Purpose: Coordinate complex animations and transitions
       Dependencies: GSAP, Framer Motion

5. Interactive Systems
   - Primary Components:
     - Navigation Controller: src/systems/interaction/NavigationController.ts
       Purpose: Handle zoom, pan, and camera controls
       Dependencies: React-zoom-pan-pinch
     - Tooltip Manager: src/systems/interaction/TooltipManager.ts
       Purpose: Manage information display and tooltips
       Dependencies: React-tooltip
     - Asset Controller: src/systems/interaction/AssetController.ts
       Purpose: Handle asset interactions and validations
       Dependencies: GameContext, ResourceManager

6. Performance Systems
   - Primary Components:
     - Render Optimizer: src/systems/performance/RenderOptimizer.ts
       Purpose: Optimize rendering performance
       Dependencies: ThreeJS, React-konva
     - Memory Manager: src/systems/performance/MemoryManager.ts
       Purpose: Handle memory management and cleanup
       Dependencies: GameContext
     - Effect Scheduler: src/systems/performance/EffectScheduler.ts
       Purpose: Manage and schedule visual effects
       Dependencies: GSAP, AnimationManager

### Game Modules Architecture

1. Core Gameplay Modules
   - Primary Components:
     - Colony Core: src/components/buildings/colony/ColonyCore.tsx
       Purpose: Main colony management
       Dependencies: ModuleManager, ResourceManager
     - Combat Manager: src/managers/combat/combatManager.ts
       Purpose: Combat system management
       Dependencies: FleetAI, EventEmitter
     - Mining Manager: src/managers/mining/MiningShipManager.ts
       Purpose: Mining operations management
       Dependencies: ResourceManager, ShipHangarManager

2. Support Modules
   - Primary Components:
     - Tech Tree Manager: src/managers/game/techTreeManager.ts
       Purpose: Technology progression system
       Dependencies: ResourceManager, GameContext
     - Ship Hangar: src/managers/module/ShipHangarManager.ts
       Purpose: Ship management system
       Dependencies: ModuleManager, ResourceManager

3. Mothership [~40% Complete]
   - Core component: src/components/buildings/colony/ColonyCore.tsx
   - VPR effects: src/effects/component_effects/CentralMothership.tsx
   - Module attachment system implemented
   - Resource management integration needed

4. Colony System [~30% Complete]
   - Core component: src/components/buildings/colony/ColonyCore.tsx
   - Automated expansion: src/components/buildings/colony/AutomatedExpansion.tsx
   - Population management needed
   - Resource distribution system needed

5. Combat System [~60% Complete]
   - Combat manager: src/managers/combat/combatManager.ts
   - War ship manager: src/managers/combat/WarShipManagerImpl.ts
   - Fleet AI hooks: src/hooks/factions/useFleetAI.ts
   - Faction behavior: src/hooks/factions/useFactionBehavior.ts
   - Features implemented:
     - Faction-specific combat units with proper type safety
     - State machine-driven faction behavior
     - Fleet formation and management system
     - Weapon system type conversions
     - Territory control and threat assessment
     - Resource-aware combat operations
     - Combat tactics system
     - Relationship management
   - Features needed:
     - Advanced formation patterns
     - Specialized faction abilities
     - Dynamic difficulty scaling
     - Advanced AI behaviors
     - Combat environment effects

6. Exploration System [~35% Complete]
   - Exploration Hub: src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
   - Exploration Window: src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx
   - Recon Ship Manager: src/managers/exploration/ReconShipManagerImpl.ts
   - Features implemented:
     - Sector mapping system with unmapped/mapped/scanning states
     - Recon ship tracking and task management
     - Experience and discovery tracking
     - Anomaly detection system
   - Features needed:
     - Real-time map updates
     - Advanced filtering system
     - Detailed anomaly analysis
     - Resource potential visualization

7. Mining System [~40% Complete]
   - Mining Controls: src/components/buildings/modules/MiningHub/MiningControls.tsx
   - Mining Ship Manager: src/managers/mining/MiningShipManager.ts
   - Features implemented:
     - Automated mining dispatch system
     - Resource threshold management
     - Mining experience system with bonuses
     - Tech tree integration
   - Features needed:
     - Enhanced visualization of mining operations
     - Advanced priority management
     - Resource flow optimization
     - Storage management system

8. Tech Tree System [~45% Complete]
   - Core Components:
     - Tech Tree UI: src/components/ui/TechTree.tsx
     - Tech Tree Manager: src/managers/game/techTreeManager.ts
     - Ship Hangar Integration: src/managers/module/ShipHangarManager.ts
   - Features implemented:
     - Comprehensive tech node system with 8 categories:
       - Infrastructure
       - War Fleet
       - Recon Fleet
       - Mining Fleet
       - Weapons
       - Defense
       - Special Projects
       - Cross-Domain Synergies
     - 3-tier progression system
     - Tech requirements validation
     - Resource cost management
     - Visual upgrade system
     - Ship tier upgrades
   - Features needed:
     - Enhanced visual feedback
     - Real-time progress tracking
     - Advanced synergy visualization
     - Detailed tech path planning

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

2. Testing Tools
   - Jest/Testing Library
     Purpose: Unit/Integration testing
     Used By: Test suites
   - Storybook
     Purpose: Component development
     Used By: UI development

### Tech Tree Architecture

1. Core Components
   - Primary Components:
     - Tech Node System: src/systems/tech/TechNodeSystem.ts
       Purpose: Manage tech tree node relationships
       Dependencies: TechTreeManager
     - Tech Category Manager: src/systems/tech/TechCategoryManager.ts
       Purpose: Handle tech categories and progression
       Dependencies: TechTreeManager, ResourceManager
     - Tech Requirement Validator: src/systems/tech/TechRequirementValidator.ts
       Purpose: Validate tech requirements and prerequisites
       Dependencies: TechTreeManager, ResourceManager
     - Tech Synergy Calculator: src/systems/tech/TechSynergyCalculator.ts
       Purpose: Calculate and manage tech synergies
       Dependencies: TechNodeSystem, TechCategoryManager

2. Tech Categories
   - Infrastructure System: src/systems/tech/categories/InfrastructureSystem.ts
     Purpose: Manage infrastructure technology progression
     Dependencies: TechNodeSystem
   - Fleet System: src/systems/tech/categories/FleetSystem.ts
     Purpose: Handle fleet-related technologies
     Dependencies: TechNodeSystem, ShipHangarManager
   - Combat System: src/systems/tech/categories/CombatSystem.ts
     Purpose: Manage combat technology progression
     Dependencies: TechNodeSystem, CombatManager
   - Resource System: src/systems/tech/categories/ResourceSystem.ts
     Purpose: Handle resource-related technologies
     Dependencies: TechNodeSystem, ResourceManager

### Recent System Updates

1. Combat System Type Architecture [~45% Complete]
   - Combat types: src/types/combat/CombatTypes.ts
     Purpose: Core combat type definitions
     Dependencies: WeaponTypes, GameTypes, FactionTypes
     Features:
       - CombatUnit base interface
       - FactionCombatUnit extension
       - Combat status system
       - Weapon integration
       - Type safety improvements

2. Weapon System Type Architecture [~50% Complete]
   - Weapon types: src/types/weapons/WeaponTypes.ts
     Purpose: Core weapon type definitions
     Used By: CombatTypes, typeConversions
     Features:
       - WeaponSystem interface
       - WeaponMount interface
       - Category and variant types
       - Status management
       - Effect system integration

3. Type Conversion System [~60% Complete]
   - Type conversions: src/utils/typeConversions.ts
     Purpose: General type conversion utilities
     Dependencies: All type systems
     Features:
       - Combat unit conversions
       - Weapon system conversions
       - Type guard implementations
       - Safe type assertions
       - Validation functions

4. Geometry System [~70% Complete]
   - Core types: src/types/core/GameTypes.ts
     Purpose: Position and vector types
     Used By: All geometry-dependent systems
   - Geometry utils: src/utils/geometry.ts
     Purpose: Geometry calculation utilities
     Dependencies: GameTypes
     Features:
       - Vector2D interface
       - BoundingBox interface
       - Distance calculations
       - Angle calculations
       - Point interpolation
       - Rotation transformations

5. Faction System Updates [~55% Complete]
   - Faction types: src/types/ships/FactionTypes.ts
     Purpose: Core faction type definitions
     Used By: CombatTypes, useFactionBehavior
     Features:
       - Extended FactionId support
       - FactionBehaviorType improvements
       - State management types
       - Configuration interfaces

### Type Safety Implementation Map

1. Combat Type Safety
   - Location: src/types/combat/CombatTypes.ts
   - Key Implementations:
     - CombatUnitStatus type with main/secondary states
     - Strict weapon system integration
     - Proper faction type handling
     - Experience system typing
     - Formation type safety

2. Weapon Type Safety
   - Location: src/types/weapons/WeaponTypes.ts
   - Key Implementations:
     - WeaponCategory type restrictions
     - Mount size and position types
     - Status type enforcement
     - Effect type integration
     - Configuration type safety

3. Faction Type Safety
   - Location: src/types/ships/FactionTypes.ts
   - Key Implementations:
     - FactionId literal types
     - Behavior type structures
     - State management types
     - Configuration type safety
     - Relationship type handling

### Type Conversion Implementation Map

1. Combat Unit Conversions
   - Location: src/utils/typeConversions.ts
   - Key Functions:
     - convertToFactionCombatUnit
     - convertToBaseCombatUnit
     - isFactionCombatUnit type guard
     - isBaseCombatUnit type guard

2. Weapon System Conversions
   - Location: src/utils/weapons/weaponTypeConversions.ts
   - Key Functions:
     - convertWeaponMountToSystem
     - convertWeaponSystemToMount
     - convertWeaponCategoryToSystemType
     - isValidWeaponMount validation
     - isValidWeaponSystem validation

### Ship System Architecture

1. Ship Components [~65% Complete]
   - Base Components: src/components/ships/base/
     Purpose: Core ship component implementations
     Used By: All ship types
   - Common Components: src/components/ships/common/
     Purpose: Shared ship functionality
     Used By: All faction ships
   - Faction Ships: src/components/ships/FactionShips/
     Purpose: Faction-specific ship implementations
     Dependencies: base, common components
   - Player Ships: src/components/ships/player/
     Purpose: Player-controlled ship implementations
     Dependencies: base, common components

2. Ship Configuration [~75% Complete]
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

3. Ship Type Relationships
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

4. Ship Implementation Features
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

### Ship Implementation Details

1. Base Ship Architecture
   - BaseShip: src/components/ships/base/BaseShip.tsx
     Purpose: Core ship component implementation
     Features:
       - Health/shield management
       - Basic movement controls
       - Weapon system integration
       - Status management

2. Common Ship Components
   - FactionShipBase: src/components/ships/common/FactionShipBase.tsx
     Purpose: Base component for all faction ships
     Features:
       - Faction-specific styling
       - Status effect container
       - Ability button container
       - Weapon control integration
       - Type-safe faction color mapping using Record<FactionId, string>
   - FactionShipStats: src/components/ships/common/FactionShipStats.tsx
     Purpose: Shared ship statistics display
     Features:
       - Faction-specific styling
       - Status display
       - Weapon and ability information
       - Type-safe behavior string conversion with helper functions
   - FactionFleet: src/components/ships/common/FactionFleet.tsx
     Purpose: Fleet management and formation control
     Features:
       - Formation transitions
       - AI adaptation display
       - Performance metrics
       - Combat style management
   - CommonShipMovement: src/components/ships/common/CommonShipMovement.tsx
     Purpose: Shared movement functionality
   - CommonShipStats: src/components/ships/common/CommonShipStats.tsx
     Purpose: Shared ship statistics display

3. Faction-Specific Ships
   - SpaceRatShip: src/components/ships/common/SpaceRatShip.tsx
     Purpose: Space Rats faction implementation
     Features:
       - Faction-specific abilities
       - Custom weapon handling
   - LostNovaShip: src/components/ships/common/LostNovaShip.tsx
     Purpose: Lost Nova faction implementation
     Features:
       - Stealth mechanics
       - Advanced tech integration
   - EquatorHorizonShip: src/components/ships/common/EquatorHorizonShip.tsx
     Purpose: Equator Horizon faction implementation
     Features:
       - Balance mechanics
       - Advanced defense systems

4. Ship Formation System
   - Formation Shapes:
     - Spearhead
     - Shield
     - Diamond
     - Arrow
     - Circle
     - Wedge
     - Line
   - Formation Patterns:
     - Offensive (red)
     - Defensive (blue)
     - Balanced (purple)
   - Features:
     - Dynamic transitions
     - Adaptive spacing
     - Performance-based quality
     - Pattern-based coloring

5. AI Integration
   - Adaptive AI:
     - Combat style adaptation
     - Range preference learning
     - Formation speed adjustment
     - Performance tracking
   - Fleet AI:
     - Formation management
     - Unit positioning
     - Combat coordination
     - Tactical decision making

12. Type System [~70% Complete]
    - Primary Components:
      - Combat Types: src/types/combat/CombatTypes.ts
        Purpose: Core combat system type definitions
        Used By: combatManager, useFactionBehavior
      - Faction Types: src/types/ships/FactionTypes.ts
        Purpose: Faction-specific type definitions
        Used By: useFactionBehavior, FactionRelationshipManager
      - Weapon Types: src/types/weapons/WeaponTypes.ts
        Purpose: Weapon system type definitions
        Used By: combatManager, WarShipManager
      - Type Conversions: src/utils/typeConversions.ts
        Purpose: Type conversion utilities
        Used By: All combat and faction systems

13. State Machine System [~50% Complete]
    - Primary Components:
      - Faction Behavior: src/hooks/factions/useFactionBehavior.ts
        Purpose: Manage faction state and behavior
        Dependencies: FactionTypes, CombatTypes
      - State Transitions: src/types/ships/FactionTypes.ts
        Purpose: Define state machine transitions
        Used By: useFactionBehavior
      - Event Handling: src/lib/modules/ModuleEvents.ts
        Purpose: Handle state machine events
        Dependencies: EventEmitter

# Effect System Implementation

## Core Effect Types
- Primary Components:
  - Base Effect Types: src/types/core/GameTypes.ts
    Purpose: Core effect type definitions
    Used By: All effect systems
  - Effect Type Extensions: src/effects/types_effects/EffectTypes.ts
    Purpose: Extended effect type definitions
    Dependencies: GameTypes
  - Weapon Effect Types: src/effects/types_effects/WeaponEffects.ts
    Purpose: Weapon-specific effect types
    Dependencies: GameTypes, EffectTypes

## Effect Utilities
- Primary Components:
  - Effect Utils: src/effects/util_effects/effectUtils.ts
    Purpose: Core effect utility functions
    Dependencies: EffectTypes, GameTypes
  - Weapon Effect Utils: src/utils/weapons/weaponEffectUtils.ts
    Purpose: Weapon-specific effect utilities
    Dependencies: WeaponEffects, effectUtils

## Effect System Integration
- Primary Components:
  - Ship Effects: src/hooks/ships/useShipEffects.ts
    Purpose: Ship effect management
    Dependencies: effectUtils, WeaponEffects
  - Combat Effects: src/managers/combat/combatManager.ts
    Purpose: Combat effect handling
    Dependencies: effectUtils, WeaponEffects
  - Visual Effects: src/effects/component_effects/WeaponEffect.tsx
    Purpose: Effect visualization
    Dependencies: WeaponEffects, effectUtils

## Effect Type Relationships
```
GameTypes.Effect
└── EffectTypes.BaseEffect
    ├── WeaponEffects.WeaponEffect
    │   ├── WeaponEffects.DamageEffect
    │   ├── WeaponEffects.AreaEffect
    │   └── WeaponEffects.StatusEffect
    ├── EffectTypes.CombatEffect
    └── EffectTypes.VisualEffect
```

## Effect Creation Flow
```
weaponEffectUtils.createWeaponLike
└── weaponEffectUtils.createBaseWeaponEffect
    ├── weaponEffectUtils.createDamageEffect
    ├── weaponEffectUtils.createAreaEffect
    └── weaponEffectUtils.createStatusEffect
```

## Effect System Dependencies
1. Core Dependencies:
   - GameTypes.Effect: Base effect interface
   - EffectTypes.BaseEffect: Extended effect interface
   - WeaponEffects: Weapon effect types

2. Utility Dependencies:
   - effectUtils: Core effect functions
   - weaponEffectUtils: Weapon effect functions
   - typeConversions: Type conversion utilities

3. Integration Dependencies:
   - useShipEffects: Ship effect hook
   - combatManager: Combat effect handling
   - WeaponEffect: Effect visualization

# Resource Management System Implementation

## Core Components

- Resource Manager: src/managers/game/ResourceManager.ts
  Purpose: Central manager for all resource operations
  Dependencies: ResourceTypes, ResourceThresholdManager, ResourceFlowManager

- Resource Threshold Manager: src/managers/resource/ResourceThresholdManager.ts
  Purpose: Monitors resource thresholds and triggers actions
  Dependencies: ResourceTypes, ModuleEvents
  Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors; includes severity information in the data object of ModuleEvents

- Resource Flow Manager: src/managers/resource/ResourceFlowManager.ts
  Purpose: Optimizes resource flows between systems
  Dependencies: ResourceTypes, ResourceValidation
  Notes: Uses ResourcePriority interface for priority management, requires complete objects rather than primitive values; uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors

- Resource Storage Manager: src/managers/resource/ResourceStorageManager.ts
  Purpose: Manages resource storage containers
  Dependencies: ResourceTypes, ResourceValidation
  Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors

- Resource Cost Manager: src/managers/resource/ResourceCostManager.ts
  Purpose: Manages resource costs and validations
  Dependencies: ResourceTypes, ResourceValidation

- Resource Exchange Manager: src/managers/resource/ResourceExchangeManager.ts
  Purpose: Handles resource exchanges and rates
  Dependencies: ResourceTypes, ResourceValidation
  Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors

- Resource Pool Manager: src/managers/resource/ResourcePoolManager.ts
  Purpose: Manages resource pools and distribution
  Dependencies: ResourceTypes, ResourceValidation
  Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors

- Resource Integration: src/managers/resource/ResourceIntegration.ts
  Purpose: Integrates all resource systems
  Dependencies: ResourceManager, ResourceThresholdManager, ResourceFlowManager

- Mining Resource Integration: src/managers/mining/MiningResourceIntegration.ts
  Purpose: Connect mining operations with resource management
  Dependencies: MiningShipManager, ResourceThresholdManager, ResourceFlowManager

- Resource Performance Monitor: src/managers/resource/ResourcePerformanceMonitor.ts
  Purpose: Monitors resource system performance
  Dependencies: ResourceTypes, ModuleEvents

- Resource Visualization: src/components/ui/ResourceVisualizationEnhanced.tsx
  Purpose: Visualizes resource states and flows
  Dependencies: ResourceFlowManager, GameContext

- Resource Display: src/components/ui/ResourceDisplay.tsx
  Purpose: Displays resource information
  Dependencies: useResourceManagement, framer-motion

- Resource Management Hook: src/hooks/resources/useResourceManagement.tsx
  Purpose: Unified access to resource management system
  Dependencies: ResourceManager, ResourceIntegration
  Notes: Uses proper singleton initialization pattern with error handling

## Resource Type Relationships
```
ResourceTypes.Resource
├── ResourceTypes.BasicResource
│   ├── ResourceTypes.Mineral
│   ├── ResourceTypes.Energy
│   └── ResourceTypes.Gas
├── ResourceTypes.AdvancedResource
│   ├── ResourceTypes.ProcessedMaterial
│   ├── ResourceTypes.RefinedMaterial
│   └── ResourceTypes.SpecializedMaterial
└── ResourceTypes.SpecialResource
    ├── ResourceTypes.Artifact
    ├── ResourceTypes.Technology
    └── ResourceTypes.RareElement
```

## Resource Container Relationships
```
ResourceTypes.ResourceContainer
├── ResourceTypes.ResourcePool
│   ├── ResourceTypes.GlobalPool
│   └── ResourceTypes.ModulePool
├── ResourceTypes.ResourceStorage
│   ├── ResourceTypes.BasicStorage
│   └── ResourceTypes.AdvancedStorage
└── ResourceTypes.ResourceTransfer
    ├── ResourceTypes.DirectTransfer
    └── ResourceTypes.GradualTransfer
```

## Resource System Dependencies
1. Core Dependencies:
   - ResourceTypes.Resource: Base resource interface
   - ResourceTypes.ResourceContainer: Resource container interface
   - ResourceTypes.ResourceThreshold: Threshold configuration interface

2. Utility Dependencies:
   - resourceUtils: Core resource functions
   - thresholdUtils: Threshold management functions
   - flowUtils: Resource flow utilities

3. Integration Dependencies:
   - useResourceManager: Resource management hook
   - useResourceThresholds: Threshold management hook
   - ResourceDisplay: Resource visualization components

## Resource Management System

### Types
- `src/types/resources/ResourceTypes.ts` - Core resource type definitions

### Utilities
- `src/utils/resources/resourceValidation.ts` - Resource validation utilities

### Managers
- `src/managers/resource/ResourceThresholdManager.ts` - Threshold management system
  - Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors; includes severity information in the data object of ModuleEvents
- `src/managers/resource/ResourceFlowManager.ts` - Resource flow optimization
  - Notes: Uses ResourcePriority interface for priority management, requires complete objects rather than primitive values; uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors
- `src/managers/resource/ResourceStorageManager.ts` - Storage management system
  - Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors
- `src/managers/resource/ResourceCostManager.ts` - Resource cost validation
- `src/managers/resource/ResourceExchangeManager.ts` - Resource exchange calculations
  - Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors
- `src/managers/resource/ResourcePoolManager.ts` - Resource pool management
  - Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors
- `src/managers/resource/ResourceIntegration.ts` - Integration with existing game systems
- `src/managers/mining/MiningResourceIntegration.ts` - Integration with mining system

### Hooks
- `src/hooks/resources/useResourceTracking.ts` - Global resource tracking
  - Notes: Uses Array.from() to convert Map entries to an array before iteration to avoid MapIterator errors
- `src/hooks/resources/useResourceManagement.ts` - Resource management hook for React components
  - Notes: Uses proper singleton initialization pattern with error handling

### UI Components
- `src/components/ui/ResourceVisualizationEnhanced.tsx` - Enhanced resource visualization component

## Tests

### Resource Management Tests
- `src/tests/setup.ts`: Test setup file with mocks for localStorage and moduleEventBus
- `src/tests/managers/resource/ResourceThresholdManager.test.ts`: Tests for ResourceThresholdManager
- `src/tests/managers/resource/ResourceFlowManager.test.ts`: Tests for ResourceFlowManager
- `src/tests/managers/resource/ResourceStorageManager.test.ts`: Tests for ResourceStorageManager
- `src/tests/hooks/resources/useResourceTracking.test.tsx`: Tests for useResourceTracking hook

## Module Framework

### Core Components
- `src/types/buildings/ModuleTypes.ts` - Core module type definitions
- `src/managers/module/ModuleManager.ts` - Central module management
- `src/lib/modules/ModuleEvents.ts` - Module event definitions
- `src/managers/module/ModuleAttachmentManager.ts` - Module attachment system
- `src/utils/modules/moduleValidation.ts` - Module validation utilities
- `src/components/ui/modules/ModuleHUD.tsx` - Dynamic module HUD components
- `src/hooks/modules/useModuleAutomation.ts` - Module automation hook
- `src/managers/module/SubModuleManager.ts` - Sub-module management
- `src/hooks/modules/useSubModules.ts` - Sub-module hook
- `src/components/ui/modules/SubModuleHUD.tsx` - Sub-module UI components
- `src/managers/module/ModuleStatusManager.ts` - Module status management
- `src/hooks/modules/useModuleStatus.ts` - Module status hook
- `src/components/ui/modules/ModuleStatusDisplay.tsx` - Module status display
- `src/managers/module/ModuleUpgradeManager.ts` - Module upgrade management
- `src/hooks/modules/useModuleUpgrade.ts` - Module upgrade hook
- `src/components/ui/modules/ModuleUpgradeDisplay.tsx` - Module upgrade display
- `src/components/ui/modules/ModuleUpgradeVisualization.tsx` - Module upgrade visualization
- `src/initialization/moduleFrameworkInit.ts` - Module framework initialization

### Module Managers
- `src/managers/buildings/ShipHangarManager.ts` - Ship hangar module management

12. Automation System [~90% Complete]
   - Primary Components:
     - Global Automation Manager: src/managers/automation/GlobalAutomationManager.ts
       Purpose: Manage global automation routines and execution
       Dependencies: AutomationManager, GameLoopManager, EventCommunication
     - Automation Visualization: src/components/ui/automation/AutomationVisualization.tsx
       Purpose: Visualize and control automation routines
       Dependencies: GlobalAutomationManager, CSS Styling
     - Automation CSS: src/styles/automation.css
       Purpose: Style the automation visualization components
       Dependencies: None
     - Automation Hook: src/hooks/automation/useAutomation.ts
       Purpose: React hook for accessing the global automation system
       Dependencies: GlobalAutomationManager, AutomationManager
     - Automation System Initialization: src/initialization/automationSystemInit.ts
       Purpose: Initialize the automation system and register default routines
       Dependencies: GlobalAutomationManager, EventDispatcher

### Unit Tests

1. Event System Tests
   - Event Dispatcher Tests: `src/tests/utils/events/EventDispatcher.test.tsx`
     Purpose: Test the React Context-based event dispatcher
     Dependencies: React Testing Library, Vitest
   - RxJS Integration Tests: `src/tests/utils/events/rxjsIntegration.test.ts`
     Purpose: Test the RxJS integration with the event system
     Dependencies: RxJS, Vitest
   - Game Loop Tests: `src/tests/managers/game/GameLoopManager.test.ts`
     Purpose: Test the centralized timer manager
     Dependencies: Vitest
   - Event Communication Tests: `src/tests/utils/events/EventCommunication.test.ts`
     Purpose: Test the system-to-system communication
     Dependencies: Vitest, moduleEventBus mock
     Features:
       - System-to-system messaging tests
       - Message priority tests
       - Acknowledgment system tests
       - Error handling tests
       - Observable stream tests
       - Cleanup and resource management tests
   - Event Filtering Tests: 
     - Basic Tests: `src/tests/utils/events/EventFilteringBasic.test.ts`

### Build Configuration

1. TypeScript Configuration
   - Main configuration: tsconfig.json
     - Target: ES2020
     - Module: ESNext
     - Strict mode enabled
     - downlevelIteration enabled for proper Map/Set iteration
     - esModuleInterop enabled for better module compatibility
   - Type checking configuration: tsconfig.check.json
     - Extends main configuration
     - Target: ES2015
     - Excludes problematic test files
   - NPM Scripts:
     - type-check: Runs TypeScript compiler with downlevelIteration flag
     - type-check:downlevel: Uses tsconfig.check.json for stricter checking
     - build: Includes downlevelIteration flag for production builds

2. Vite Configuration
   - Configuration file: vite.config.ts
   - ESBuild target: ES2020
   - React plugin enabled
   - Static file serving configured
   - CSS source maps enabled
   - Optimized dependencies configuration

### Combat System Architecture

1. Combat Worker
   - combatWorker.ts: src/workers/combatWorker.ts
     Purpose: Web Worker for combat calculations
     Features:
       - Spatial partitioning with quadtree
       - Batch processing for performance
       - Hazard detection and avoidance
       - Weapon targeting system
       - Position calculation with easing
       - Type-safe array iteration for hazard processing
       - Explicit type annotations for collections
       - Traditional for loops for better type narrowing
     Dependencies:
       - CombatTypes.ts
       - HazardTypes.ts
       - GameTypes.ts
       - WeaponTypes.ts
       - QuadTree.ts
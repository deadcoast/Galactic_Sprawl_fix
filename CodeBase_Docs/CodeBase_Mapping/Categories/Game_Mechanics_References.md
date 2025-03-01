---
GAME MECHANICS REFERENCES
---

# Game Mechanics

## Game Modules Architecture

### Core Gameplay Modules

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

### Support Modules

- Primary Components:
  - Tech Tree Manager: src/managers/game/techTreeManager.ts
    Purpose: Technology progression system
    Dependencies: ResourceManager, GameContext
  - Ship Hangar: src/managers/module/ShipHangarManager.ts
    Purpose: Ship management system
    Dependencies: ModuleManager, ResourceManager

### Mothership [~40% Complete]

- Core component: src/components/buildings/colony/ColonyCore.tsx
- VPR effects: src/effects/component_effects/CentralMothership.tsx
- Module attachment system implemented
- Resource management integration needed

### Colony System [~30% Complete]

- Core component: src/components/buildings/colony/ColonyCore.tsx
- Automated expansion: src/components/buildings/colony/AutomatedExpansion.tsx
- Population management needed
- Resource distribution system needed

### Combat System [~60% Complete]

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

### Exploration System [~35% Complete]

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

### Mining System [~40% Complete]

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

### Tech Tree System [~45% Complete]

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

## State Management

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

## Resource Management System

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

## Automation System [~90% Complete]

- Primary Components:
  - Global Automation Manager: src/managers/automation/GlobalAutomationManager.js
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

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

### Exploration System (~80% Complete)

**Components:**

- Exploration Hub (`src/components/exploration/ExplorationHub.tsx`)
- Exploration Window (`src/components/exploration/ExplorationWindow.tsx`)
- Recon Ship Manager (`src/components/exploration/ReconShipManager.tsx`)
- Automated Sector Scanner (`src/components/exploration/AutomatedSectorScanner.tsx`)
- Real-Time Map Updates (`src/components/exploration/RealTimeMapUpdates.tsx`)
- Advanced Filtering System (`src/components/exploration/AdvancedFilteringSystem.tsx`)
- Advanced Filtering Demo (`src/components/exploration/AdvancedFilteringDemo.tsx`)
- Exploration System Integration (`src/components/exploration/ExplorationSystemIntegration.tsx`)
- Detailed Anomaly Analysis (`src/components/exploration/DetailedAnomalyAnalysis.tsx`)
- Detailed Anomaly Analysis Demo (`src/components/exploration/DetailedAnomalyAnalysisDemo.tsx`)
- Resource Potential Visualization (`src/components/exploration/ResourcePotentialVisualization.tsx`)
- Resource Potential Visualization Demo (`src/components/exploration/ResourcePotentialVisualizationDemo.tsx`)
- Galaxy Map System (`src/components/exploration/GalaxyMapSystem.tsx`)
- Galaxy Mapping System (`src/components/exploration/GalaxyMappingSystem.tsx`)
- Galaxy Mapping System Demo (`src/components/exploration/GalaxyMappingSystemDemo.tsx`)
- Resource Discovery System (`src/components/exploration/ResourceDiscoverySystem.tsx`)
- Resource Discovery Demo (`src/components/exploration/ResourceDiscoveryDemo.tsx`)
- Exploration Data Manager (`src/components/exploration/ExplorationDataManager.tsx`)
- Exploration Data Manager Demo (`src/components/exploration/ExplorationDataManagerDemo.tsx`)

**Implementations:**

- Sector mapping
- Anomaly detection
- Recon ship deployment
- Sector data collection
- Automated sector scanning
- Energy consumption management
- Real-time map updates
- Ship movement visualization
- Scan progress tracking
- Advanced filtering system
- Filter visualization
- Multi-criteria search
- Detailed anomaly analysis
- Spectrum analysis visualization
- Material properties analysis
- Spatial distortion analysis
- Biological impact assessment
- Resource potential visualization
- Resource distribution mapping
- Resource quality assessment
- Extraction difficulty analysis
- Resource value estimation
- Galaxy mapping system
- Faction territory visualization
- Trade route visualization
- Cosmic event system
- Interactive tutorial system
- Resource discovery processing
- Raw signal analysis
- Resource classification
- Resource data generation
- Discovery confidence calculation
- Exploration data management
- Data categorization system
- Record tagging and organization
- Data export and import
- Related records linking
- Starred records system
- Notes and documentation
- Search and filtering

**Features Needed:**

- Discovery classification
- Recon ship coordination
- Data analysis system

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

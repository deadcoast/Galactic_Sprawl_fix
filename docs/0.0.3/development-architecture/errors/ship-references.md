---
SHIP SYSTEM REFERENCES
---

# Ship System Architecture

## Ship Configuration [~75% Complete]

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

## Ship Type Relationships

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

## Ship Implementation Features

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

## Ship Implementation Details

### Base Ship Architecture

- BaseShip: src/components/ships/base/BaseShip.tsx
  Purpose: Core ship component implementation
  Features:
  - Health/shield management
  - Basic movement controls
  - Weapon system integration
  - Status management

### Common Ship Components

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

### Faction-Specific Ships

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

### Ship Formation System

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

### AI Integration

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

### Type System [~70% Complete]

- Primary Components:
  - Combat Types: src/types/combat/CombatTypes.ts
    Purpose: Core combat system type definitions
    Used By: combatManager, useFactionBehavior
  - Faction Types: src/types/ships/FactionTypes.ts
    Purpose: Faction-specific type definitions
    Used By: useFactionBehavior, FactionRelationshipManager
  - Weapon Types: src/types/weapons/WeaponTypes.ts
    Purpose: Weapon system type definitions
    Used By: combatManager, CombatShipManager
  - Type Conversions: src/utils/typeConversions.ts
    Purpose: Type conversion utilities
    Used By: All combat and faction systems

### State Machine System [~50% Complete]

- Primary Components:
  - Faction Behavior: src/hooks/factions/useFactionBehavior.ts
    Purpose: Manage faction state and behavior
    Dependencies: FactionTypes, CombatTypes
  - State Transitions: src/types/ships/FactionTypes.ts
    Purpose: Define state transitions for factions
    Dependencies: FactionTypes

### Ship Hangar System

- Ship Hangar Manager: src/managers/module/ShipHangarManager.ts
  Purpose: Manage ship construction and deployment
  Dependencies: ModuleTypes, ResourceManager
- Ship Hangar UI: src/components/buildings/modules/hangar/ShipHangar.tsx
  Purpose: UI for ship hangar
  Dependencies: ShipHangarManager
- Ship Customization: src/components/ships/player/customization/PlayerShipCustomization.tsx
  Purpose: UI for ship customization
  Dependencies: ShipHangarManager
- Ship Upgrade System: src/components/ships/player/customization/PlayerShipUpgradeSystem.tsx
  Purpose: UI for ship upgrades
  Dependencies: ShipHangarManager

### Player Ship System

- War Ship: src/components/ships/player/variants/warships/WarShip.tsx
  Purpose: Base component for player war ships
  Dependencies: BaseShip
- Spitflare: src/components/ships/player/variants/warships/Spitflare.tsx
  Purpose: Tier 1 war ship
  Dependencies: WarShip
- Star Schooner: src/components/ships/player/variants/warships/StarSchooner.tsx
  Purpose: Tier 1/2 war ship
  Dependencies: WarShip
- Orion's Frigate: src/components/ships/player/variants/warships/OrionFrigate.tsx
  Purpose: Tier 2 war ship
  Dependencies: WarShip
- Harbringer Galleon: src/components/ships/player/variants/warships/HarbringerGalleon.tsx
  Purpose: Tier 2 war ship
  Dependencies: WarShip
- Midway Carrier: src/components/ships/player/variants/warships/MidwayCarrier.tsx
  Purpose: Tier 3 war ship
  Dependencies: WarShip
- Mother Earth's Revenge: src/components/ships/player/variants/warships/MotherEarthRevenge.tsx
  Purpose: Special war ship
  Dependencies: WarShip

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

6. Type System [~70% Complete]

   - Primary Components:
     - Combat Types: src/types/combat/CombatTypes.ts
       Purpose: Core combat system type definitions
       Used By: combatManager, useFactionBehavior
     - Faction Types: src/types/ships/FactionTypes.ts
       Purpose: Faction-specific type definitions
       Used By: useFactionBehavior, FactionRelationshipManager
     - Weapon Types: src/types/weapons/WeaponTypes.ts
       Purpose: Weapon system type definitions
       Used By: combatManager, CombatShipManager
     - Type Conversions: src/utils/typeConversions.ts
       Purpose: Type conversion utilities
       Used By: All combat and faction systems

7. State Machine System [~50% Complete]
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

### Faction Behavior System

- **FactionBehaviorType and FactionBehaviorConfig**: src/types/ships/FactionTypes.ts

  - Purpose: Define faction behavior types and configuration
  - Features:
    - FactionBehaviorType as string literal union type
    - FactionBehaviorConfig as object interface with behavior property
    - Clear separation of concerns between types

- **FactionShipStats Component**: src/components/ships/common/FactionShipStats.tsx

  - Purpose: Display ship statistics with faction-specific styling
  - Features:
    - Helper function to get behavior string from FactionBehaviorConfig
    - Type-safe behavior string formatting
    - Conditional styling based on behavior type

- **EquatorHorizonShip Component**: src/components/ships/common/EquatorHorizonShip.tsx

  - Purpose: Equator Horizon faction ship implementation
  - Features:
    - Uses FactionBehaviorConfig for tactics property
    - Properly typed behavior values

- **LostNovaShip Component**: src/components/ships/common/LostNovaShip.tsx

  - Purpose: Lost Nova faction ship implementation
  - Features:
    - Helper function to create FactionBehaviorConfig from string
    - Flexible tactics property accepting string or FactionBehaviorConfig
    - Type-safe behavior conversion

- **SpaceRatShip Component**: src/components/ships/common/SpaceRatShip.tsx

  - Purpose: Space Rats faction ship implementation
  - Features:
    - Helper function to create FactionBehaviorConfig from string
    - Flexible tactics property accepting string or FactionBehaviorConfig
    - Type-safe behavior conversion

- **Faction Ship Files**:
  - src/components/ships/FactionShips/lostNova/DarkMatterReaper.tsx
  - src/components/ships/FactionShips/lostNova/EclipseScythe.tsx
  - src/components/ships/FactionShips/lostNova/NullHunter.tsx
  - src/components/ships/FactionShips/spaceRats/RogueNebula.tsx
  - Purpose: Specific faction ship implementations
  - Features:
    - Helper functions to create FactionBehaviorConfig from string
    - Type-safe behavior conversion
    - Consistent behavior configuration

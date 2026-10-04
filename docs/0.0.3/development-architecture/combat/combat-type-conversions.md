---
COMBAT TYPE CONVERSION REFERENCES
---

# Combat System Type Conversion Updates

## Core Type Conversion Utilities

- **typeConversions.ts**: src/utils/typeConversions.ts
  - Added functions to convert between different CombatUnit interfaces
  - Handles conversion between manager-style and type-safe CombatUnit objects
  - Dependencies: CombatTypes.ts, GameTypes.ts

## Combat System Components

- **useCombatAI.ts**: src/hooks/combat/useCombatAI.js

  - Updated to use type conversion functions for CombatUnit objects
  - Accesses health, shield, etc. through the stats property
  - Dependencies: typeConversions.ts, CombatTypes.ts, BehaviorTreeManager.ts

- **ShipClassFactory.ts**: src/factories/ships/ShipClassFactory.ts

  - Updated to create manager-style CombatUnit objects and convert them
  - Uses proper WeaponSystem interface for weapon conversion
  - Dependencies: typeConversions.ts, CombatTypes.ts, WeaponTypes.ts

- **BehaviorTreeManager.ts**: src/managers/ai/BehaviorTreeManager.ts
  - Updated to use the stats property for health, shield, etc.
  - Added target property to CombatUnit interface in BehaviorContext
  - Dependencies: CombatTypes.ts, EventEmitter.ts

## Type Relationships

```
CombatManager.CombatUnit
├── id: string
├── faction: string
├── type: string
├── tier: number
├── position: { x, y }
├── status: string
├── health: number
├── maxHealth: number
├── shield: number
├── maxShield: number
├── target?: string
└── weapons: Array<{
id: string,
type: string,
range: number,
damage: number,
cooldown: number,
status: string
}>

CombatTypes.CombatUnit
├── id: string
├── type: string
├── position: { x, y }
├── rotation: number
├── velocity: { x, y }
├── status: CombatUnitStatus
├── weapons: WeaponSystem[]
└── stats: {
health: number,
maxHealth: number,
shield: number,
maxShield: number,
armor: number,
speed: number,
turnRate: number
}
```

## Conversion Flow

```
combatManager.getUnitStatus(unitId)
└── convertToCombatTypesUnit()
└── CombatTypes.CombatUnit with stats property
```

## Type Conversion Implementation

- **convertToCombatTypesUnit**: src/utils/typeConversions.ts

  - Purpose: Converts CombatManager.CombatUnit to CombatTypes.CombatUnit
  - Features:
    - Maps properties to appropriate structure
    - Handles weapon conversion
    - Creates stats object
    - Preserves all required data
  - Dependencies: CombatTypes.ts, WeaponTypes.ts

- **convertToManagerUnit**: src/utils/typeConversions.ts
  - Purpose: Converts CombatTypes.CombatUnit to CombatManager.CombatUnit
  - Features:
    - Flattens stats object
    - Converts weapons to manager format
    - Preserves all required data
  - Dependencies: CombatTypes.ts, WeaponTypes.ts

## Type Conversion Usage

- **Combat Manager**: src/managers/combat/combatManager.ts

  - Purpose: Central manager for combat system
  - Uses type conversion for:
    - Sending data to combat worker
    - Receiving data from combat worker
    - Providing data to UI components
  - Dependencies: typeConversions.ts, CombatTypes.ts

- **Combat UI Components**: src/components/combat/
  - Purpose: UI components for combat system
  - Uses type conversion for:
    - Displaying combat unit information
    - Handling user interactions
    - Updating combat unit state
  - Dependencies: typeConversions.ts, CombatTypes.ts

## Type Conversion Testing

- **Type Conversion Tests**: src/tests/utils/typeConversions.test.ts
  - Purpose: Tests for type conversion utilities
  - Features:
    - Tests for convertToCombatTypesUnit
    - Tests for convertToManagerUnit
    - Tests for edge cases
    - Tests for data preservation
  - Dependencies: typeConversions.ts, CombatTypes.ts

## Type Conversion Benefits

1. **Type Safety**:

   - Ensures type safety across different parts of the system
   - Prevents runtime errors from incorrect property access
   - Provides better IDE support with autocomplete

2. **Separation of Concerns**:

   - Allows manager to use simpler flat structure
   - Allows type system to use more complex nested structure
   - Decouples different parts of the combat system

3. **Performance**:
   - Optimizes data structure for different use cases
   - Reduces memory usage by converting only when needed
   - Improves performance by using appropriate data structure

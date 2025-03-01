---
COMBAT SYSTEM REFERENCES
---

# Combat System Architecture

## Combat Worker

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

# Combat System Type Conversion Updates

## Core Type Conversion Utilities

- **typeConversions.ts**: src/utils/typeConversions.ts
  - Added functions to convert between different CombatUnit interfaces
  - Handles conversion between manager-style and type-safe CombatUnit objects
  - Dependencies: CombatTypes.ts, GameTypes.ts

## Combat System Components

- **useCombatAI.ts**: src/hooks/combat/useCombatAI.ts

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

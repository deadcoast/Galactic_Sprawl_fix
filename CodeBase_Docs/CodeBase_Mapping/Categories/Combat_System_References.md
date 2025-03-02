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

## Combat System Components

- **BattleEnvironment.tsx**: src/components/combat/BattleEnvironment.tsx
  Purpose: Main component for rendering the combat environment
  Features:
  - Hazard visualization and management
  - Combat unit movement and rendering
  - Weapon effects and animations
  - Fleet AI visualization with formation lines
  - Combat optimization using web workers
  - Implementation of the `__FleetAIResult` interface for advanced fleet AI visualization:
    ```typescript
    interface __FleetAIResult {
      formationPatterns: string[];
      adaptiveAI: boolean;
      factionBehavior: string;
      visualFeedback?: {
        formationLines: {
          points: [number, number][];
          style: 'solid' | 'dashed';
          color: string;
          opacity: number;
        }[];
      };
    }
    ```
    Dependencies:
  - CombatTypes.ts
  - HazardTypes.ts
  - WeaponTypes.ts
  - combatWorker.ts
  - useFactionBehavior.ts

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

## Fleet AI Visualization

The BattleEnvironment component implements advanced fleet AI visualization using the `__FleetAIResult` interface. This allows for:

1. **Formation Pattern Visualization**: Displays the formation patterns used by fleet AI
2. **Adaptive AI Feedback**: Shows how the AI adapts to combat situations
3. **Faction-specific Behavior**: Visualizes different behaviors based on faction
4. **Visual Feedback**: Renders formation lines with customizable styles, colors, and opacity

Example implementation:

```typescript
// Create a memoized fleet AI result
const fleetAIResult = useMemo<__FleetAIResult>(() => ({
  formationPatterns: ['delta', 'arrow', 'shield'],
  adaptiveAI: true,
  factionBehavior: faction,
  visualFeedback: {
    formationLines: [{
      points: [[0, 0], [100, 100]],
      style: 'solid' as 'solid' | 'dashed',
      color: '#3498db',
      opacity: 0.75
    }]
  }
}), [faction]);

// Render formation lines based on fleet AI result
{fleetAIResult.visualFeedback?.formationLines.map((line, index) => (
  <path
    key={`formation-line-${index}`}
    d={`M ${line.points.map(p => p.join(',')).join(' L ')}`}
    stroke={line.color}
    strokeWidth={2}
    opacity={line.opacity}
    strokeDasharray={line.style === 'dashed' ? '5,5' : undefined}
  />
))}
```

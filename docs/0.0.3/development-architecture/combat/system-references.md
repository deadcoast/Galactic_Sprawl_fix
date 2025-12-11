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
          style: "solid" | "dashed";
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

## Fleet Formation Tactics System

- **FormationTacticsPanel.tsx**: src/components/combat/formations/FormationTacticsPanel.tsx
  Purpose: Main component for managing fleet formations and tactics
  Features:
  - Formation visualization and selection
  - Tactical behavior configuration
  - Formation effectiveness calculation
  - Tactical bonuses based on formation/tactic combinations
  - Stats visualizations for offensive, defensive, mobility, and coordination ratings
  - Type-safe formation management with proper FleetFormation type mapping
    Dependencies:
  - FleetFormation from CombatTypes.ts
  - useFleetAI.ts
  - FormationVisualizer.tsx
  - FormationPresetList.tsx
  - FormationEditor.tsx
  - TacticalBehaviorSelector.tsx
  - TacticalBonusCard.tsx

- **FormationVisualizer.tsx**: src/components/combat/formations/FormationVisualizer.tsx
  Purpose: Visual representation of fleet formations
  Features:
  - Renders different formation patterns (spearhead, shield, diamond, arrow, circle, wedge, line, scattered)
  - Color-coded formations based on type (offensive, defensive, balanced)
  - Direction indicator for formation facing
  - Grid visualization with ship positions
  - Dynamic scaling based on formation spacing
    Dependencies:
  - FleetFormation from CombatTypes.ts
  - useMemo for performance optimization

- **FormationPresetList.tsx**: src/components/combat/formations/FormationPresetList.tsx
  Purpose: Displays a list of predefined formation patterns for selection
  Features:
  - Type-filtered formation presets
  - Visual previews of formation patterns
  - Descriptive text for each formation
  - Click handling for formation selection
    Dependencies:
  - FleetFormation from CombatTypes.ts

- **FormationEditor.tsx**: src/components/combat/formations/FormationEditor.tsx
  Purpose: Interface for creating and editing custom formations
  Features:
  - Type selection (offensive, defensive, balanced)
  - Pattern selection (spearhead, shield, diamond, etc.)
  - Spacing adjustment
  - Facing angle control
  - Adaptive spacing toggle
  - Transition speed adjustment
    Dependencies:
  - FleetFormation from CombatTypes.ts
  - FormationVisualizer.tsx

- **TacticalBehaviorSelector.tsx**: src/components/combat/formations/TacticalBehaviorSelector.tsx
  Purpose: Interface for selecting tactical behaviors
  Features:
  - Categorized behavior options (attack, defense, movement, special)
  - Formation type compatibility filtering
  - Visual representation of behavior effects
  - Detailed descriptions of tactical behaviors
    Dependencies:
  - Icons from lucide-react
  - FleetFormation from CombatTypes.ts

- **TacticalBonusCard.tsx**: src/components/combat/formations/TacticalBonusCard.tsx
  Purpose: Visual display of formation and tactic bonuses
  Features:
  - Color-coded cards based on bonus type (offensive, defensive, utility)
  - Appropriate icons for each bonus type
  - Detailed bonus descriptions
  - Numerical bonus value display
    Dependencies:
  - Icons from lucide-react

- **FormationTacticsContainer.tsx**: src/components/combat/formations/FormationTacticsContainer.tsx
  Purpose: Container component that manages fleet formations across multiple fleets
  Features:
  - Fleet selection
  - Integration with combat system for formation updates
  - Faction-specific formation handling
  - Empty state handling
    Dependencies:
  - useCombatSystem.ts
  - FleetFormation from CombatTypes.ts
  - FormationTacticsPanel.tsx

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

## Combat System Hooks

- **useCombatSystem.ts**: src/hooks/combat/useCombatSystem.ts
  Purpose: Primary hook for managing fleet formations, tactics, and combat state
  Features:
  - Manages combat system state (threat level, active units, active status)
  - Provides functions for updating fleet formations
  - Provides functions for updating tactical behaviors
  - Returns fleet formations and tactics for UI components
  - Reserved state setters for future implementation:
    ```typescript
    // State hooks with reserved setters for future implementation
    const [threatLevel, _setThreatLevel] = useState(0); // Reserved for future threat level updates
    const [activeUnits, _setActiveUnits] = useState(0); // Reserved for tracking active combat units
    const [isActive, _setIsActive] = useState(false); // Reserved for combat activation status
    ```
  - Uses proper logging with console.warn instead of console.log for development:
    ```typescript
    // Development logging with proper console methods
    console.warn(`Updating formation for fleet ${fleetId}:`, formation);
    ```
    Implementation Notes:
  - Returns placeholder objects for formations and tactics (to be implemented)
  - Uses useCallback for performance optimization
  - Typed to ensure type safety with CombatTypes
  - Follows ESLint rules for console statements (warn/error only)
    Dependencies:
  - combatManager.ts
  - FleetFormation from CombatTypes.ts

- **useUnitCombat.ts**: src/hooks/combat/useUnitCombat.ts
  Purpose: Hook for managing individual combat unit state
  Features:
  - Real-time updates for unit status
  - Health and shield monitoring
  - Target tracking
  - Position updates
    Implementation Notes:
  - Uses interval for frequent updates (250ms)
  - Cleans up interval on unmount
  - Provides fallback values for missing properties
    Dependencies:
  - combatManager.ts
  - CombatTypes.ts

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

## Combat Types Key Interfaces

- **FleetFormation (CombatTypes.ts)**:

  ```typescript
  export interface FleetFormation {
    type: "offensive" | "defensive" | "balanced";
    pattern:
      | "spearhead"
      | "shield"
      | "diamond"
      | "arrow"
      | "circle"
      | "wedge"
      | "line"
      | "scattered";
    spacing: number;
    facing: number;
    adaptiveSpacing: boolean;
    transitionSpeed: number;
  }
  ```

- **FleetFormation (useFleetAI.ts) - Note: Different property definitions**:
  ```typescript
  interface FleetFormation {
    type:
      | "line"
      | "wedge"
      | "circle"
      | "scattered"
      | "arrow"
      | "diamond"
      | "shield"
      | "spearhead";
    spacing: number;
    facing: number;
    pattern: "defensive" | "offensive" | "balanced";
    adaptiveSpacing: boolean;
    transitionSpeed?: number;
    subFormations?: {
      type: FleetFormation["type"];
      units: string[];
    }[];
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

## Formation Type Mapping

When using `useCombatSystem` with `FormationTacticsPanel`, care must be taken to map between two different `FleetFormation` types:

1. **FleetFormation in CombatTypes.ts**:

   ```typescript
   interface FleetFormation {
     type: "offensive" | "defensive" | "balanced";
     pattern:
       | "spearhead"
       | "shield"
       | "diamond"
       | "arrow"
       | "circle"
       | "wedge"
       | "line"
       | "scattered";
     // other properties...
   }
   ```

2. **FleetFormation in useFleetAI.ts**:
   ```typescript
   interface FleetFormation {
     type:
       | "spearhead"
       | "shield"
       | "diamond"
       | "arrow"
       | "circle"
       | "wedge"
       | "line"
       | "scattered";
     pattern: "offensive" | "defensive" | "balanced";
     // other properties...
   }
   ```

The mapping solution is implemented in `FormationTacticsPanel.tsx`:

```typescript
// Map from fleetAI.formation to CombatTypes.FleetFormation
const mappedFormation: FleetFormation = {
  // In fleetAI, 'pattern' is what we call 'type' in CombatTypes
  type: fleetAI.formation.pattern as "offensive" | "defensive" | "balanced",
  // In fleetAI, 'type' is what we call 'pattern' in CombatTypes
  pattern: fleetAI.formation.type as
    | "spearhead"
    | "shield"
    | "diamond"
    | "arrow"
    | "circle"
    | "wedge"
    | "line"
    | "scattered",
  // Other properties map directly
  spacing: fleetAI.formation.spacing,
  facing: fleetAI.formation.facing,
  adaptiveSpacing: fleetAI.formation.adaptiveSpacing,
  transitionSpeed: fleetAI.formation.transitionSpeed || 1,
};
```

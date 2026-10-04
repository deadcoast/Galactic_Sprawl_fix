---
EFFECT SYSTEM REFERENCES
---

# Effect System Implementation Updates

## Core Effect Types

- **WeaponEffects.ts**: src/effects/types_effects/WeaponEffects.ts

  - Updated to include 'name' and 'description' properties in WeaponEffect interface
  - Ensures type safety for components accessing these properties
  - Dependencies: GameTypes.ts, EffectTypes.ts

- **EffectTypes.ts**: src/effects/types_effects/EffectTypes.ts

  - Contains BaseEffect interface with 'name' and 'description' properties
  - Provides type hierarchy for different effect types
  - Dependencies: GameTypes.ts

- **shipEffects.ts**: src/effects/types_effects/shipEffects.ts
  - Updated to use BaseEffect instead of Effect for ability effects
  - Added missing 'id' properties to all effect objects
  - Dependencies: WeaponEffects.ts, EffectTypes.ts

## Effect Utilities

- **effectUtils.ts**: src/effects/util_effects/effectUtils.ts

  - Updated createEffect function to ensure duration is not undefined
  - Provides utility functions for creating different types of effects
  - Dependencies: EffectTypes.ts, WeaponEffects.ts

- **weaponEffectUtils.ts**: src/utils/weapons/weaponEffectUtils.ts
  - Updated all effect creation functions to include name and description parameters
  - Added default values for optional properties
  - Fixed validateEffect function to properly handle undefined values
  - Dependencies: WeaponEffects.ts, EffectTypes.ts

## Components Using Effects

- **WeaponComponents.tsx**: src/components/weapons/WeaponComponents.tsx

  - Uses 'name' and 'description' properties from WeaponEffect
  - Dependencies: WeaponEffects.ts

- **WeaponControl.tsx**: src/components/weapons/WeaponControl.tsx
  - Uses 'name' and 'description' properties from WeaponEffect
  - Dependencies: WeaponEffects.ts

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

## Effect System Components

- **EffectManager**: src/managers/effects/EffectManager.ts

  - Purpose: Central manager for all effects
  - Dependencies: EffectTypes, effectUtils
  - Features:
    - Effect creation and application
    - Effect duration tracking
    - Effect removal and cleanup
    - Effect stacking and prioritization

- **EffectRenderer**: src/components/effects/EffectRenderer.tsx

  - Purpose: Renders visual effects
  - Dependencies: EffectTypes, VisualEffects
  - Features:
    - Particle effects
    - Animation effects
    - Sound effects
    - Screen effects

- **StatusEffectManager**: src/managers/effects/StatusEffectManager.ts
  - Purpose: Manages status effects on entities
  - Dependencies: EffectTypes, StatusEffects
  - Features:
    - Status effect application
    - Status effect duration tracking
    - Status effect removal
    - Status effect visualization

## Effect System Hooks

- **useEffects**: src/hooks/effects/useEffects.ts

  - Purpose: React hook for accessing the effect system
  - Dependencies: EffectManager
  - Features:
    - Effect creation
    - Effect application
    - Effect removal
    - Effect querying

- **useStatusEffects**: src/hooks/effects/useStatusEffects.ts
  - Purpose: React hook for managing status effects
  - Dependencies: StatusEffectManager
  - Features:
    - Status effect application
    - Status effect removal
    - Status effect querying
    - Status effect visualization

## Effect System Events

- **EffectAppliedEvent**: Triggered when an effect is applied

  - Payload: { effectId, targetId, effect, source }

- **EffectRemovedEvent**: Triggered when an effect is removed

  - Payload: { effectId, targetId, effect, reason }

- **EffectUpdatedEvent**: Triggered when an effect is updated

  - Payload: { effectId, targetId, oldEffect, newEffect }

- **StatusEffectChangedEvent**: Triggered when a status effect changes
  - Payload: { targetId, statusId, oldValue, newValue }

# Effect System Implementation Updates

## Core Effect Types

- **WeaponEffects.ts**: src/effects/types_effects/WeaponEffects.ts

  - Updated to include 'name' and 'description' properties in WeaponEffect interface
  - Ensures type safety for components accessing these properties
  - Dependencies: GameTypes.ts, EffectTypes.ts

- **EffectTypes.ts**: src/effects/types_effects/EffectTypes.ts

  - Contains BaseEffect interface with 'name' and 'description' properties
  - Provides type hierarchy for different effect types
  - Dependencies: GameTypes.ts

- **shipEffects.ts**: src/effects/types_effects/shipEffects.ts
  - Updated to use BaseEffect instead of Effect for ability effects
  - Added missing 'id' properties to all effect objects
  - Dependencies: WeaponEffects.ts, EffectTypes.ts

## Effect Utilities

- **effectUtils.ts**: src/effects/util_effects/effectUtils.ts

  - Updated createEffect function to ensure duration is not undefined
  - Provides utility functions for creating different types of effects
  - Dependencies: EffectTypes.ts, WeaponEffects.ts

- **weaponEffectUtils.ts**: src/utils/weapons/weaponEffectUtils.ts
  - Updated all effect creation functions to include name and description parameters
  - Added default values for optional properties
  - Fixed validateEffect function to properly handle undefined values
  - Dependencies: WeaponEffects.ts, EffectTypes.ts

## Components Using Effects

- **WeaponComponents.tsx**: src/components/weapons/WeaponComponents.tsx

  - Uses 'name' and 'description' properties from WeaponEffect
  - Dependencies: WeaponEffects.ts

- **WeaponControl.tsx**: src/components/weapons/WeaponControl.tsx
  - Uses 'name' and 'description' properties from WeaponEffect
  - Dependencies: WeaponEffects.ts

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

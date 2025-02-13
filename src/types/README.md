# Galactic Sprawl Type System

This document outlines the type hierarchy and relationships between different types in the Galactic Sprawl project.

## Core Types (`core/GameTypes.ts`)

Base types used throughout the project:
- `BaseStats`: Core stats shared by ships and other entities
- `Effect`: Base effect type for all game effects
- `Position`, `Velocity`: Core geometry types
- `Quality`, `Tier`: Common enums

## Weapon System (`weapons/`)

### Base Types (`WeaponTypes.ts`)
```typescript
// Core weapon categories and variants
WeaponCategory
WeaponVariant
WeaponMountSize
WeaponMountPosition
WeaponStatus
WeaponUpgradeType

// Stats hierarchy
BaseWeaponStats
└── CombatWeaponStats (extends with special properties)

// Configuration and state
WeaponMount
WeaponConfig
WeaponState
WeaponInstance
WeaponUpgrade
```

### Effects (`WeaponEffectTypes.ts`)
```typescript
Effect (from core)
├── WeaponDamageEffect
└── WeaponAreaEffect
```

## Ship System (`ships/`)

### Common Types (`CommonShipTypes.ts`)
```typescript
// Base ship interfaces
ShipType
CommonShip
└── FactionShip (in FactionShipTypes.ts)

// Stats hierarchy
BaseStats (from core)
└── CommonShipStats
    ├── FactionShipStats (in FactionShipTypes.ts)
    └── PlayerShipStats (in PlayerShipTypes.ts)

// Abilities and capabilities
CommonShipAbility
CommonShipCapabilities
```

### Faction Types (`FactionShipTypes.ts`)
```typescript
// Ship class hierarchies by faction
FactionShipClass
├── SpaceRatsShipClass
├── LostNovaShipClass
└── EquatorHorizonShipClass

// Faction-specific types
FactionConfig
FactionState
FactionManager
```

## Combat System (`combat/`)

### Combat Types (`CombatTypes.ts`)
```typescript
// Core combat entities
CombatUnit
CombatState
Projectile
CombatEffect
CombatResult

// Re-exports from weapon system
WeaponCategory
WeaponVariant
CombatWeaponStats (as WeaponStats)
WeaponConfig
WeaponInstance
```

## Type Relationships

1. **Weapon System**
   - `WeaponInstance` combines `WeaponConfig` and `WeaponState`
   - `WeaponMount` can hold a `WeaponInstance`
   - `CombatWeaponStats` extends `BaseWeaponStats` with combat-specific properties

2. **Ship System**
   - All ships extend `CommonShip`
   - Ships use `WeaponMount` from the weapon system
   - Ships have abilities that use `Effect` from core

3. **Combat System**
   - Uses weapon types through re-exports
   - `CombatUnit` represents any entity in combat
   - `CombatEffect` uses core `Effect` type

## Best Practices

1. **Type Extensions**
   - Extend base types for specialized functionality
   - Use interfaces for complex objects
   - Use type unions for variants

2. **Type Organization**
   - Keep related types in the same file
   - Use clear naming conventions
   - Document type relationships

3. **Type Safety**
   - Use strict type checking
   - Avoid type assertions when possible
   - Use discriminated unions for state handling

4. **Backward Compatibility**
   - Use type re-exports for compatibility
   - Maintain consistent type structures
   - Document breaking changes

## Common Patterns

1. **Stats Pattern**
   ```typescript
   interface BaseStats {
     health: number;
     maxHealth: number;
     // ...
   }

   interface ExtendedStats extends BaseStats {
     special?: {
       // Additional properties
     }
   }
   ```

2. **Config/State Pattern**
   ```typescript
   interface Config {
     id: string;
     // Static configuration
   }

   interface State {
     status: string;
     // Dynamic state
   }

   interface Instance {
     config: Config;
     state: State;
   }
   ```

3. **Effect Pattern**
   ```typescript
   interface Effect {
     type: string;
     duration: number;
     magnitude: number;
   }
   ``` 
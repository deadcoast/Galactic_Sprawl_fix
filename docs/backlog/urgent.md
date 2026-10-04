# INTEGRATION REQUIREMENTS - ORPHANED FEATURES FUNCTIONS AND VALUES

## 1

> /Users/deadcoast/github/Galactic_Sprawl_fix/src/components/ui/data/index.ts

```ts
/**
 * @context: ui-system, component-bridge
 *
 * Data display components placeholder.
 * These components need implementation - currently providing stubs to prevent import errors.
 *
 * TODO: Implement these components or source from a component library
 */
```

## 2

> In src/components/ui/data/index.ts

- the animate prop only sets final styles (opacity: 1 and transform: translateX(0)) so no visible transition occurs; change it to apply initial and target states with transitions (e.g., set initial opacity/transform when animate is false and target when true) or use CSS keyframes/animation classes and toggle them via the prop; ensure the transition property is present on the element regardless and that initial values (e.g., opacity: 0, translateX(some px)) are applied so the browser can animate to the final state when animate becomes true.

## 3

> In src/components/ui/feedback/index.ts

- the injected CSS defines several keyframe animations but is missing the pulse keyframes used by Spinner and Skeleton; add an @keyframes pulse rule to the style.textContent that smoothly scales/changes opacity (e.g., a small scale up and down or opacity pulse between 0% and 100% with a midpoint) so the 'pulse' animation referenced by components works; update the style string to include this @keyframes pulse block and ensure the document.head.appendChild(style) still runs after the addition.

## 4

> In src/components/ui/feedback/index.ts

- the buffer bar is skipped when bufferValue is 0 because the condition uses a truthy check; change the guard to explicitly allow zero by checking for non-null/undefined (e.g., replace the truthy check with a test like bufferValue != null or bufferValue !== undefined && bufferValue !== null) so the buffer element renders for 0 while still excluding null/undefined; ensure the rest of the code uses bufferValue as a number (cast/parse if necessary) before computing bufferPercentage.

## 5

> In src/components/ui/feedback/index.ts

- implement a ToastContainer React component that subscribes to the existing toastListeners, holds active toasts in state, and renders them; specifically, add a ToastContainer: `React.FC<ToastContainerProps>` that defaults position to 'bottom-right', uses useState to track an array of (ToastProps & { id: string }), registers a listener in useEffect that appends incoming toasts and cleans up by removing the listener on unmount, provides a handleClose(id) to remove a toast from state, and renders a container positioned per the position prop mapping to the defined positions with toasts.map(...) creating a Toast component for each toast passing key, all toast props, and an onClose that calls handleClose(id); ensure you import React, useState, useEffect, and the existing Toast component and types, and keep types for props consistent with ToastProps and ToastOptions.

## 6

> In src/managers/combat/combatManager.ts

- the FleetCombatUnit, Threat, and Fleet interfaces are defined here but duplicated in src/hooks/factions/useFleetAI.ts; replace the string-literal union types for ship and weapon kinds with exported enums (e.g., Export ShipType and WeaponType enums) and update FleetCombatUnit to use those enums for the type fields, export the interfaces/enums from this file, then remove the duplicate type definitions from src/hooks/factions/useFleetAI.ts and import the types via: import type { FleetCombatUnit, Threat, Fleet, ShipType, WeaponType } from '../../managers/combat/combatManager'; ensure any existing usages are updated to the enum members.

## 7

> src/managers/combat/combatManager.ts

⚠️ Potential issue | 🟡 Minor

🧩 Analysis chain
Use FactionId enum for faction comparisons instead of string literals at line 529; consider typing FleetCombatUnit.faction as FactionId for consistency.

Line 529 uses string literals 'player' and 'ally' to filter friendly units. Replace these with the FactionId enum type to ensure type safety and consistency:

// Current (line 529)
if (unit.faction === 'player' || unit.faction === 'ally') {

// Should be
if (unit.faction === FactionId.PLAYER || unit.faction === FactionId.ALLY) {
Additionally, the FleetCombatUnit interface (line 58) defines faction: string, but it should be typed as faction: FactionId to prevent type mismatches and enable compile-time validation. This would also clarify that the line 494 filter logic intentionally assumes units assigned to a fleet share the same faction identifier.

## 8

> In src/managers/combat/combatManager.ts

- replace the string literal faction checks ('player' and 'ally') with the FactionId enum (e.g.,FactionId.Player and FactionId.Ally), import FactionId from its module at the
  top of the file, and ensure unit.faction is typed/compared as FactionId (adjust
  the unit type or add a cast if necessary) so the comparisons use enum values
  rather than raw strings.

## 9

> In src/managers/combat/combatManager.ts

- the mapping helpers use string literal keys/values; replace them to use the ShipType and WeaponType enums (and CombatUnitStatus enum if available) instead: import the enums at top, change the map key types to the corresponding enum types and map values to the `FleetCombatUnit['type']/'weapons'[0]['type']` enums (use enum members rather than raw strings), remove toLowerCase() on weapon keys and instead ensure lookups use enum members (or create a small normalizer from input string to enum), make the maps exhaustive for all enum values or handle unknowns with a typed fallback, and update return types to return the enum members so type safety is preserved.

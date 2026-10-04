# Pattern Library - Galactic Sprawl Integration

**Purpose**: This document contains proven, step-by-step patterns for all common integration operations in the Galactic Sprawl codebase. Each pattern includes code examples, verification steps, and time estimates.

**Last Updated**: 2025-11-13
**Pattern Count**: 5 core patterns

---

## Table of Contents

1. [Pattern 1: Add Manager to Registry](#pattern-1-add-manager-to-registry)
2. [Pattern 2: Create Manager Hook](#pattern-2-create-manager-hook)
3. [Pattern 3: Integrate Component with Manager](#pattern-3-integrate-component-with-manager)
4. [Pattern 4: Convert String Literal to Enum](#pattern-4-convert-string-literal-to-enum)
5. [Pattern 5: Subscribe to Events](#pattern-5-subscribe-to-events)

---

## Pattern 1: Add Manager to Registry

### When to Use
- Adding any manager class to the ManagerRegistry
- Making a manager accessible throughout the application
- Establishing singleton pattern for manager

### Prerequisites
- ✅ Manager class file exists (e.g., `SomeManager.ts`)
- ✅ Manager exports a class or has `getInstance()` method
- ✅ No circular dependencies with other managers
- ✅ Manager imports compile without errors

### Time Estimate
**20-30 minutes** (experienced) | **45-60 minutes** (first time)

### Difficulty
🟢 **Easy** - Follows exact pattern every time

### Files to Modify
1. `src/managers/ManagerRegistry.ts` (main file)
2. Optional: Manager file if it needs exports fixed

---

### Step-by-Step Instructions

#### STEP 1: Analyze the Manager (5-10 minutes)

**Action**: Read the manager file to understand its structure

**Questions to Answer:**
1. Does it export a class directly? (`export class SomeManager`)
2. Does it have a `getInstance()` static method?
3. Does it export a singleton instance? (`export const someManager = new SomeManager()`)
4. What dependencies does it import?

**Example Analysis:**
```typescript
// Reading src/managers/game/GameLoopManager.ts

// ✅ Exports class directly
export class GameLoopManager { ... }

// ✅ Exports singleton instance
export const gameLoopManager = new GameLoopManager();

// Decision: Use the class export, create instance in registry
```

**Common Patterns Found:**
- **Direct Class Export**: `export class Manager` → Use `new Manager()` in registry
- **getInstance Pattern**: `export class Manager { static getInstance() }` → Use `Manager.getInstance()`
- **Direct Instance Export**: `export const manager = new Manager()` → Return imported instance

---

#### STEP 2: Add Import to ManagerRegistry.ts (5 minutes)

**Location**: `src/managers/ManagerRegistry.ts`, around lines 9-32 (import section)

**Action**: Add import statement for the manager

**Pattern**:
```typescript
import { ManagerClassName } from './relative/path/to/ManagerFile';
```

**Example**:
```typescript
// Add this line in alphabetical order with other imports
import { GameLoopManager } from './game/GameLoopManager';
import { GameManager } from './game/GameManager';
import { AssetManager } from './game/AssetManager';
```

**Tips**:
- Maintain alphabetical ordering within each subsystem group
- Use destructuring if importing type and implementation
- Check the import compiles: Look for red squiggly lines in IDE

---

#### STEP 3: Add Singleton Instance Variable (5 minutes)

**Location**: `src/managers/ManagerRegistry.ts`, around lines 34-54 (singleton instances section)

**Action**: Declare a module-level variable to store the singleton instance

**Pattern**:
```typescript
let managerNameInstance: ManagerType | null = null;
```

**Example**:
```typescript
// Add after other singleton declarations
let gameLoopManagerInstance: GameLoopManager | null = null;
let gameManagerInstance: GameManager | null = null;
let assetManagerInstance: AssetManager | null = null;
```

**Tips**:
- Use `null` as initial value (enables lazy initialization)
- Variable name should be camelCase version of manager name + "Instance"
- Type should match the manager class type

---

#### STEP 4: Create Getter Function (10-15 minutes)

**Location**: `src/managers/ManagerRegistry.ts`, around lines 56-293 (getter functions section)

**Action**: Create a function that returns the singleton instance, creating it if needed

**Pattern** (Direct Instantiation):
```typescript
/**
 * Get the singleton instance of ManagerName
 * @returns The ManagerName instance
 */
export function getManagerName(): ManagerType {
  if (!managerNameInstance) {
    managerNameInstance = new ManagerType();
  }
  return managerNameInstance;
}
```

**Pattern** (getInstance Method):
```typescript
/**
 * Get the singleton instance of ManagerName
 * @returns The ManagerName instance
 */
export function getManagerName(): ManagerType {
  if (!managerNameInstance) {
    managerNameInstance = ManagerType.getInstance();
  }
  return managerNameInstance;
}
```

**Pattern** (With Dependencies):
```typescript
/**
 * Get the singleton instance of ManagerName
 * @returns The ManagerName instance
 */
export function getManagerName(): ManagerType {
  if (!managerNameInstance) {
    // Get dependencies first
    const dependency = getDependencyManager();
    managerNameInstance = new ManagerType(dependency);
  }
  return managerNameInstance;
}
```

**Example**:
```typescript
/**
 * Get the singleton instance of GameLoopManager
 * @returns The GameLoopManager instance
 */
export function getGameLoopManager(): GameLoopManager {
  if (!gameLoopManagerInstance) {
    gameLoopManagerInstance = new GameLoopManager();
  }
  return gameLoopManagerInstance;
}
```

**Tips**:
- Add JSDoc comment above function (copy pattern from examples)
- Use non-null assertion `!` on return if TypeScript complains
- Add after the last existing getter function
- Maintain consistent formatting with existing functions

---

#### STEP 5: Update Reset Function (5 minutes)

**Location**: `src/managers/ManagerRegistry.ts`, around lines 297-320 (resetManagers function)

**Action**: Add null assignment for testing/cleanup

**Pattern**:
```typescript
export function resetManagers(): void {
  // ... existing resets
  managerNameInstance = null;
}
```

**Example**:
```typescript
export function resetManagers(): void {
  combatManagerInstance = null;
  objectDetectionSystemInstance = null;
  // ... other resets
  gameLoopManagerInstance = null;
  gameManagerInstance = null;
  assetManagerInstance = null;
  // ...
}
```

**Tips**:
- Add at the end of the function body
- No need to maintain alphabetical order here
- This enables fresh instances in tests

---

#### STEP 6: Add Type Export (5 minutes)

**Location**: `src/managers/ManagerRegistry.ts`, around lines 322-344 (type exports section)

**Action**: Export the manager type for use in other files

**Pattern**:
```typescript
export type {
  // ... existing types
  ManagerType,
}
```

**Example**:
```typescript
export type {
  AssetManager,
  AsteroidFieldManager,
  AutomationManager,
  // ... alphabetically ordered
  GameLoopManager,
  GameManager,
  // ... more types
}
```

**Tips**:
- Maintain alphabetical order
- Use `type` export (not value export)
- Place in the correct alphabetical position

---

### Verification Steps

After completing all steps, verify the integration:

#### 1. TypeScript Compilation
```bash
npm run type-check
```
**Expected**: No errors, or no NEW errors

#### 2. Linting
```bash
npm run lint
```
**Expected**: No errors, or no NEW errors

#### 3. Build
```bash
npm run build
```
**Expected**: Build succeeds

#### 4. Import Test (in browser console or test file)
```typescript
import { getManagerName } from '@/managers/ManagerRegistry';

const manager = getManagerName();
console.log(manager); // Should not be null
```

#### 5. Singleton Test
```typescript
import { getManagerName } from '@/managers/ManagerRegistry';

const instance1 = getManagerName();
const instance2 = getManagerName();
console.log(instance1 === instance2); // Should be true
```

---

### Success Criteria

- ✅ Manager imported in ManagerRegistry.ts
- ✅ Singleton instance variable declared
- ✅ Getter function created and exported
- ✅ Reset function updated
- ✅ Type exported
- ✅ TypeScript compiles with no new errors
- ✅ Lint passes with no new errors
- ✅ Build succeeds
- ✅ Manager can be imported and instantiated
- ✅ Singleton pattern works (same instance on multiple calls)

---

### Common Errors & Solutions

**Error**: `Cannot find module './path/to/Manager'`
**Solution**: Check the import path is correct relative to ManagerRegistry.ts

**Error**: `Type 'Manager | null' is not assignable to type 'Manager'`
**Solution**: Add non-null assertion `!` to return statement: `return managerInstance!;`

**Error**: `Circular dependency detected`
**Solution**: Manager is importing ManagerRegistry. Use getter functions instead of direct imports in the manager.

**Error**: `Manager is not a constructor`
**Solution**: Manager exports an instance, not a class. Return the imported instance directly instead of using `new`.

---

### Time Breakdown

| Step | Time |
|------|------|
| 1. Analyze Manager | 5-10 min |
| 2. Add Import | 5 min |
| 3. Add Instance Variable | 5 min |
| 4. Create Getter | 10-15 min |
| 5. Update Reset | 5 min |
| 6. Add Type Export | 5 min |
| **Total** | **35-45 min** |
| Verification | +10 min |
| **Grand Total** | **45-55 min** |

---

## Pattern 2: Create Manager Hook

### When to Use
- After adding a manager to ManagerRegistry
- Making manager accessible in React components
- Following the established hooks pattern

### Prerequisites
- ✅ Manager added to ManagerRegistry (Pattern 1 complete)
- ✅ Getter function exists (e.g., `getManagerName()`)
- ✅ Manager type exported from ManagerRegistry

### Time Estimate
**15-20 minutes** (experienced) | **30-40 minutes** (first time)

### Difficulty
🟢 **Easy** - Follows exact pattern every time

### Files to Modify
1. `src/hooks/managers/useManagers.ts` (main file)
2. `src/hooks/managers/index.ts` (export file)

---

### Step-by-Step Instructions

#### STEP 1: Add Imports to useManagers.ts (5 minutes)

**Location**: `src/hooks/managers/useManagers.ts`, lines 21-64 (import section)

**Action**: Import the getter function and type from ManagerRegistry

**Pattern**:
```typescript
import {
  // ... existing imports
  getManagerName,
  type ManagerType,
} from '../../managers/ManagerRegistry';
```

**Example**:
```typescript
import {
  getAssetManager,
  getAsteroidFieldManager,
  // ... (maintain alphabetical order)
  getGameLoopManager,
  getGameManager,
  // ... more getters
  type AssetManager,
  type AsteroidFieldManager,
  // ... (maintain alphabetical order)
  type GameLoopManager,
  type GameManager,
  // ... more types
} from '../../managers/ManagerRegistry';
```

**Tips**:
- Getters go first, types go after (separated by comment or blank line)
- Maintain alphabetical order in both sections
- Import both the getter AND the type

---

#### STEP 2: Create Individual Hook (10 minutes)

**Location**: `src/hooks/managers/useManagers.ts`, around lines 66-232 (individual hooks section)

**Action**: Create a hook function that returns the manager instance

**Pattern**:
```typescript
/**
 * Hook to access the ManagerName singleton
 * Brief description of what this manager does
 */
export function useManagerName(): ManagerType {
  return useMemo(() => getManagerName(), []);
}
```

**Example**:
```typescript
/**
 * Hook to access the GameLoopManager singleton
 * Manages the core game loop, update cycles, and timing
 */
export function useGameLoopManager(): GameLoopManager {
  return useMemo(() => getGameLoopManager(), []);
}

/**
 * Hook to access the GameManager singleton
 * Manages game state, start/stop/pause functionality
 */
export function useGameManager(): GameManager {
  return useMemo(() => getGameManager(), []);
}

/**
 * Hook to access the AssetManager singleton
 * Manages game asset loading and retrieval
 */
export function useAssetManager(): AssetManager {
  return useMemo(() => getAssetManager(), []);
}
```

**Tips**:
- Hook name: `use` + manager name (e.g., `useGameLoopManager`)
- Always use `useMemo` for performance
- Empty dependency array `[]` (manager is singleton)
- Add JSDoc comment describing manager purpose
- Add in alphabetical order with other hooks

---

#### STEP 3: Update Combined Hook (5 minutes)

**Location**: `src/hooks/managers/useManagers.ts`, around lines 243-270 (useManagers function)

**Action**: Add the new manager to the combined `useManagers()` hook

**Pattern**:
```typescript
export function useManagers() {
  return useMemo(
    () => ({
      // ... existing managers
      managerName: getManagerName(),
      // ... more managers
    }),
    []
  );
}
```

**Example**:
```typescript
export function useManagers() {
  return useMemo(
    () => ({
      resourceManager: getResourceManager(),
      resourceFlowManager: getResourceFlowManager(),
      // ... (maintain alphabetical order)
      gameLoopManager: getGameLoopManager(),
      gameManager: getGameManager(),
      assetManager: getAssetManager(),
      // ... more managers
    }),
    []
  );
}
```

**Tips**:
- Property name: camelCase manager name (e.g., `gameLoopManager`)
- Maintain alphabetical order
- Add comma after each entry

---

#### STEP 4: Export Hook from Index (5 minutes)

**Location**: `src/hooks/managers/index.ts`, lines 13-36 (export section)

**Action**: Add export for the new hook

**Pattern**:
```typescript
export {
  // ... existing exports
  useManagerName,
  // ... more exports
} from './useManagers';
```

**Example**:
```typescript
export {
  useAssetManager,
  useAsteroidFieldManager,
  // ... (maintain alphabetical order)
  useGameLoopManager,
  useGameManager,
  // ... more hooks
} from './useManagers';
```

**Tips**:
- Maintain alphabetical order
- All exports come from `'./useManagers'`
- Include the combined `useManagers` export

---

### Verification Steps

#### 1. TypeScript Compilation
```bash
npm run type-check
```
**Expected**: No errors

#### 2. Hook Import Test
```typescript
import { useManagerName } from '@/hooks/managers';

function TestComponent() {
  const manager = useManagerName();
  console.log(manager); // Should not be null
  return <div>Manager: {manager.constructor.name}</div>;
}
```

#### 3. Combined Hook Test
```typescript
import { useManagers } from '@/hooks/managers';

function TestComponent() {
  const { managerName } = useManagers();
  console.log(managerName); // Should not be null
  return <div>Manager available!</div>;
}
```

---

### Success Criteria

- ✅ Getter and type imported in useManagers.ts
- ✅ Individual hook created with useMemo
- ✅ Combined hook updated with new manager
- ✅ Hook exported from index.ts
- ✅ TypeScript compiles with no errors
- ✅ Hook can be imported in components
- ✅ Manager instance is accessible via hook

---

### Common Errors & Solutions

**Error**: `Cannot find name 'useMemo'`
**Solution**: Ensure React is imported at top: `import { useMemo } from 'react';`

**Error**: `Module '"@/hooks/managers"' has no exported member 'useManagerName'`
**Solution**: Check that hook is exported in index.ts

**Error**: `Type 'ManagerType' is not assignable to type 'ManagerType'`
**Solution**: Check that you're importing the type from ManagerRegistry, not from the manager file directly

---

### Time Breakdown

| Step | Time |
|------|------|
| 1. Add Imports | 5 min |
| 2. Create Individual Hook | 10 min |
| 3. Update Combined Hook | 5 min |
| 4. Export Hook | 5 min |
| **Total** | **25 min** |
| Verification | +5 min |
| **Grand Total** | **30 min** |

---

## Pattern 3: Integrate Component with Manager

### When to Use
- Connecting a UI component to a manager for data/functionality
- Replacing mock data with real manager data
- Subscribing to manager events for real-time updates

### Prerequisites
- ✅ Manager in ManagerRegistry (Pattern 1 complete)
- ✅ Hook created for manager (Pattern 2 complete)
- ✅ Component file exists and renders
- ✅ Understand component's current data source (mock data, context, etc.)

### Time Estimate
**1-3 hours** (varies significantly by component complexity)

### Difficulty
🟡 **Medium** - Requires understanding component logic and data flow

### Files to Modify
1. Component file (e.g., `src/components/SomeComponent.tsx`)
2. Optional: Component types if manager types differ

---

### Step-by-Step Instructions

#### STEP 1: Analyze Component (15-30 minutes)

**Action**: Read component to understand current state and data sources

**Questions to Answer:**
1. What data does the component display?
2. Where does that data currently come from? (mock data, props, context)
3. What manager should provide this data?
4. Are there type mismatches between component and manager?
5. What user interactions need to trigger manager methods?
6. What events should the component subscribe to?

**Example Analysis** (from MiningWindow.tsx):
```typescript
// Current data source
const mockShips = [
  { id: '1', name: 'Dredger 1', status: 'mining' },
  // ... more mock data
];

// Component displays: list of mining ships
// Manager: MiningShipManager
// Method needed: getAllShips()
// Events needed: MINING_SHIP_UPDATED, MINING_OPERATION_COMPLETE
// Type mismatch: UnifiedMiningShip vs MiningShip (needs conversion)
```

**Documentation**:
Create a comment at top of file:
```typescript
/**
 * INTEGRATION STATUS: In Progress
 * MANAGER: MiningShipManager
 * DATA SOURCE: Manager + Mock fallback
 * EVENTS: MINING_SHIP_UPDATED, MINING_OPERATION_COMPLETE
 * CONVERSION: UnifiedMiningShip → MiningShip (line 150)
 */
```

---

#### STEP 2: Import Manager Hook (5 minutes)

**Location**: Component file, import section (top of file)

**Action**: Import the manager hook

**Pattern**:
```typescript
import { useManagerName } from '@/hooks/managers';
```

**Example**:
```typescript
import { useMiningShipManager } from '@/hooks/managers';
```

**Tips**:
- Add after other hook imports
- Use the `@/hooks/managers` path (not relative path)

---

#### STEP 3: Add Manager Instance to Component (5 minutes)

**Location**: Component function body, near top

**Action**: Get manager instance using the hook

**Pattern**:
```typescript
export function ComponentName() {
  const manager = useManagerName();

  // ... rest of component
}
```

**Example**:
```typescript
export function MiningWindow() {
  const miningShipManager = useMiningShipManager();

  // ... rest of component
}
```

**Tips**:
- Add near the top, after other hooks
- Variable name: camelCase manager name

---

#### STEP 4: Add State for Manager Data (10 minutes)

**Location**: Component function body, after manager instance

**Action**: Create state to hold data from manager

**Pattern**:
```typescript
const [managerData, setManagerData] = useState<DataType[]>([]);
```

**Example**:
```typescript
const [managerShips, setManagerShips] = useState<MiningShip[]>([]);
```

**Tips**:
- Prefix with "manager" to distinguish from mock data
- Use appropriate type (may need to convert from manager's type)
- Initialize with empty array or appropriate default

---

#### STEP 5: Create Data Sync Effect (20-40 minutes)

**Location**: Component function body, in useEffect

**Action**: Fetch data from manager and keep it updated

**Pattern** (Polling Approach):
```typescript
useEffect(() => {
  const updateData = () => {
    const data = manager.getData();
    setManagerData(data);
  };

  // Initial fetch
  updateData();

  // Poll for updates
  const interval = setInterval(updateData, 1000);

  return () => clearInterval(interval);
}, [manager]);
```

**Pattern** (Event-Driven Approach):
```typescript
useEffect(() => {
  const updateData = () => {
    const data = manager.getData();
    setManagerData(data);
  };

  // Initial fetch
  updateData();

  // Subscribe to events
  const unsubscribe = moduleEventBus.subscribe(
    EventType.DATA_UPDATED,
    updateData
  );

  return unsubscribe;
}, [manager]);
```

**Example** (MiningWindow with conversion layer):
```typescript
useEffect(() => {
  const updateShips = () => {
    const unifiedShips = miningShipManager.getAllShips();

    // Convert UnifiedMiningShip to MiningShip
    const convertedShips: MiningShip[] = unifiedShips.map(ship => ({
      id: ship.id,
      name: ship.name,
      type: ship.shipClass === PlayerShipClass.ROCK_BREAKER
        ? PlayerShipClass.ROCK_BREAKER
        : PlayerShipClass.VOID_DREDGER,
      status: (ship.status as 'idle' | 'mining' | 'returning') || 'idle',
      capacity: typeof ship.stats?.cargo === 'number'
        ? ship.stats.cargo
        : ship.stats?.cargo?.capacity || 1000,
      currentLoad: ship.currentLoad || 0,
      targetNode: ship.targetNode,
      efficiency: ship.efficiency || 1.0,
    }));

    setManagerShips(convertedShips);
  };

  updateShips();
  const interval = setInterval(updateShips, 1000);
  return () => clearInterval(interval);
}, [miningShipManager]);
```

**Tips**:
- Use polling (setInterval) for simple updates
- Use events (moduleEventBus) for better performance
- Add type conversion layer if manager types differ from component types
- Always return cleanup function

---

#### STEP 6: Update Render Logic (15-30 minutes)

**Location**: Component return statement / render section

**Action**: Use manager data with fallback to mock data

**Pattern**:
```typescript
const displayData = managerData.length > 0 ? managerData : mockData;

return (
  <div>
    {displayData.map(item => (
      <ItemDisplay key={item.id} item={item} />
    ))}
  </div>
);
```

**Example** (MiningWindow):
```typescript
const ships = managerShips.length > 0 ? managerShips : mockShips;

return (
  <div className="mining-window">
    <ShipList ships={ships} />
  </div>
);
```

**Tips**:
- Always provide fallback to mock data (graceful degradation)
- Don't delete mock data (keep for development/testing)
- Use ternary operator for clean fallback logic

---

#### STEP 7: Add Manager Method Calls (20-40 minutes)

**Location**: Event handlers and component methods

**Action**: Call manager methods for user interactions

**Pattern**:
```typescript
const handleAction = (id: string) => {
  manager.performAction(id);
  // Update UI if needed
};
```

**Example** (starting a mining operation):
```typescript
const handleStartMining = (shipId: string, asteroidId: string) => {
  miningShipManager.assignShipToAsteroid(shipId, asteroidId);
  // Data will update via the sync effect
};
```

**Tips**:
- Call manager methods for actions (don't modify state directly)
- Let the sync effect update UI (single source of truth)
- Add error handling around manager calls

---

#### STEP 8: Test Integration (15-30 minutes)

**Action**: Verify component works with manager integration

**Checklist**:
1. Run dev server: `npm run dev`
2. Navigate to component in browser
3. Check console for errors
4. Verify data displays correctly
5. Test user interactions work
6. Verify fallback to mock data if manager empty
7. Check performance (no lag, no memory leaks)

---

### Verification Steps

#### 1. Component Renders
```bash
npm run dev
# Navigate to component URL
# Check: No console errors, component displays
```

#### 2. Manager Data Flows
```javascript
// In browser console
const manager = useManagerName(); // Get from devtools
console.log(manager.getData()); // Verify data exists
```

#### 3. Events Working (if using events)
```javascript
// Perform action that triggers event
// Check console or UI updates
```

#### 4. Fallback Works
```javascript
// Clear manager data
manager.clearData();
// Verify component shows mock data
```

---

### Success Criteria

- ✅ Component renders without errors
- ✅ Manager hook imported and used
- ✅ Manager data flows to component
- ✅ Mock data preserved as fallback
- ✅ User interactions call manager methods
- ✅ Events update UI (if using events)
- ✅ No performance degradation
- ✅ TypeScript compiles with no errors
- ✅ Zero breaking changes to component API

---

### Common Errors & Solutions

**Error**: `Cannot read property 'getData' of undefined`
**Solution**: Manager instance is null. Check that manager is in registry and hook returns instance.

**Error**: Type mismatch between manager and component
**Solution**: Add conversion layer in the sync effect (see STEP 5 example)

**Error**: Component re-renders infinitely
**Solution**: Ensure useEffect dependency array includes only manager, not data state

**Error**: Mock data not showing as fallback
**Solution**: Check fallback logic uses `>` or `>=` to detect empty arrays

---

### Time Breakdown (varies by component)

| Step | Simple Component | Complex Component |
|------|-----------------|-------------------|
| 1. Analyze Component | 15 min | 30 min |
| 2. Import Hook | 5 min | 5 min |
| 3. Add Manager Instance | 5 min | 5 min |
| 4. Add State | 10 min | 15 min |
| 5. Create Sync Effect | 20 min | 40 min |
| 6. Update Render | 15 min | 30 min |
| 7. Add Method Calls | 20 min | 40 min |
| 8. Test Integration | 15 min | 30 min |
| **Total** | **1.5-2 hrs** | **2.5-3 hrs** |

---

## Pattern 4: Convert String Literal to Enum

### When to Use
- Replacing string literal types with proper enums
- Improving type safety and IDE autocomplete
- Part of Phase 2: Type System Unification

### Prerequisites
- ✅ Enum file exists or needs to be created
- ✅ All string values identified
- ✅ No conflicts with existing enum values

### Time Estimate
**30-60 minutes per file** (varies by usage count)

### Difficulty
🟡 **Medium** - Requires careful search and replace

### Files to Modify
1. Enum definition file (e.g., `src/types/enums/SomeEnum.ts`)
2. All files using the string literals (could be 10-50+ files)

---

### Step-by-Step Instructions

#### STEP 1: Identify All String Literals (15-20 minutes)

**Action**: Find all uses of the string literal type

**Commands**:
```bash
# Search for the type definition
grep -r "type SomeType = " src/

# Search for string literal values
grep -r "'literal-value'" src/
grep -r '"literal-value"' src/
```

**Example**:
```bash
# Finding ModuleType usages
grep -r "type ModuleType" src/
# Output: src/types/buildings/ModuleTypes.ts:export type ModuleType = 'mining-hub' | 'exploration-hub' | ...

grep -r "'mining-hub'" src/
# Output: 15 files use this string
```

**Documentation**:
Create a list:
```markdown
## String Literal to Enum Conversion: ModuleType

**String Values Found:**
- 'mining-hub' (15 files)
- 'exploration-hub' (12 files)
- 'production-facility' (8 files)
... (list all values)

**Files Using Type:**
- src/components/buildings/modules/MiningHub.tsx
- src/managers/module/ModuleManager.ts
... (list all files)
```

---

#### STEP 2: Create or Update Enum (15 minutes)

**Action**: Define the enum with all values

**Pattern**:
```typescript
/**
 * Enum description
 */
export enum EnumName {
  VALUE_1 = 'value-1',
  VALUE_2 = 'value-2',
  // ... all values
}
```

**Example**:
```typescript
/**
 * Module types in the game
 */
export enum ModuleType {
  MINING_HUB = 'mining-hub',
  EXPLORATION_HUB = 'exploration-hub',
  PRODUCTION_FACILITY = 'production-facility',
  COMMAND_CENTER = 'command-center',
  RESEARCH_LAB = 'research-lab',
  // ... more types
}
```

**Tips**:
- Use SCREAMING_SNAKE_CASE for enum keys
- Use kebab-case for string values (matches existing)
- Add JSDoc comment describing purpose
- Group related values together

---

#### STEP 3: Replace Type Definition (5 minutes)

**Action**: Replace string literal type with enum

**Before**:
```typescript
export type ModuleType = 'mining-hub' | 'exploration-hub' | 'production-facility';
```

**After**:
```typescript
export { ModuleType } from '../enums/ModuleType';
```

Or if in same file:
```typescript
// Remove: export type ModuleType = ...
// Already defined as enum above
```

---

#### STEP 4: Update Imports in Files (10-20 minutes)

**Action**: Update import statements to use enum instead of type

**Before**:
```typescript
import type { ModuleType } from '@/types/buildings/ModuleTypes';
```

**After**:
```typescript
import { ModuleType } from '@/types/buildings/ModuleTypes';
// Remove 'type' keyword since enum is a value, not just a type
```

**Tips**:
- Remove `type` keyword from import
- Enum is both a type AND a value
- Can be used in both type positions and runtime code

---

#### STEP 5: Replace String Literals with Enum Values (20-40 minutes)

**Action**: Replace all string literal usage with enum values

**Before**:
```typescript
const moduleType: ModuleType = 'mining-hub';

if (module.type === 'exploration-hub') {
  // ...
}
```

**After**:
```typescript
const moduleType: ModuleType = ModuleType.MINING_HUB;

if (module.type === ModuleType.EXPLORATION_HUB) {
  // ...
}
```

**Pattern for Replacement**:
1. Find: `'string-value'`
2. Replace: `EnumName.ENUM_VALUE`

**Tips**:
- Use find-and-replace in IDE for each value
- Check each replacement (don't blind replace)
- Watch for string values in other contexts (URLs, API calls, etc. that shouldn't change)

---

#### STEP 6: Create Type Guard (Optional but Recommended) (10 minutes)

**Action**: Create runtime validation function

**Pattern**:
```typescript
/**
 * Type guard for EnumName
 */
export function isEnumName(value: unknown): value is EnumName {
  return typeof value === 'string' &&
         Object.values(EnumName).includes(value as EnumName);
}
```

**Example**:
```typescript
/**
 * Type guard for ModuleType
 */
export function isModuleType(value: unknown): value is ModuleType {
  return typeof value === 'string' &&
         Object.values(ModuleType).includes(value as ModuleType);
}
```

**Usage**:
```typescript
function processModule(type: unknown) {
  if (isModuleType(type)) {
    // TypeScript knows 'type' is ModuleType here
    console.log(`Processing module: ${type}`);
  } else {
    console.error('Invalid module type');
  }
}
```

---

### Verification Steps

#### 1. TypeScript Compilation
```bash
npm run type-check
```
**Expected**: No errors (or fewer errors than before)

#### 2. Search for Remaining Literals
```bash
grep -r "'old-string-value'" src/
```
**Expected**: No results, or only in comments/tests

#### 3. Test Enum Usage
```typescript
import { ModuleType } from '@/types/buildings/ModuleTypes';

const type: ModuleType = ModuleType.MINING_HUB;
console.log(type); // 'mining-hub'
console.log(ModuleType.MINING_HUB === 'mining-hub'); // true
```

#### 4. IDE Autocomplete Test
- Type `ModuleType.` in IDE
- Verify autocomplete shows all enum values
- Verify descriptions appear (if added)

---

### Success Criteria

- ✅ Enum defined with all values
- ✅ String literal type removed or replaced
- ✅ All imports updated (removed `type` keyword)
- ✅ All string literal usages replaced with enum values
- ✅ Type guard created (optional)
- ✅ TypeScript compiles with no new errors
- ✅ IDE autocomplete works for enum values
- ✅ Runtime behavior unchanged

---

### Common Errors & Solutions

**Error**: `'EnumName' only refers to a type, but is being used as a value here`
**Solution**: Import the enum without `type` keyword: `import { EnumName }` not `import type { EnumName }`

**Error**: String comparisons fail after conversion
**Solution**: Enum values ARE strings, comparison should work. Check that enum value matches exact string.

**Error**: Can't find all occurrences of string
**Solution**: String may be in template literals: `` `${variable}` ``. Search for variable name.

---

### Time Breakdown

| Step | Time |
|------|------|
| 1. Identify Literals | 15-20 min |
| 2. Create Enum | 15 min |
| 3. Replace Type Def | 5 min |
| 4. Update Imports | 10-20 min |
| 5. Replace Literals | 20-40 min |
| 6. Create Type Guard | 10 min |
| **Total** | **75-110 min** |
| Verification | +10 min |
| **Grand Total** | **85-120 min** |

---

## Pattern 5: Subscribe to Events

### When to Use
- Component needs to react to manager events
- Replacing polling (setInterval) with event-driven updates
- Part of Phase 3: Event System Integration

### Prerequisites
- ✅ Manager emits events via moduleEventBus
- ✅ EventType enum includes the event you need
- ✅ Component already has manager integration

### Time Estimate
**20-30 minutes** (simple) | **45-60 minutes** (complex with multiple events)

### Difficulty
🟡 **Medium** - Requires understanding event flow

### Files to Modify
1. Component file (subscribe to events)
2. Optional: EventTypes.ts (if adding new event types)

---

### Step-by-Step Instructions

#### STEP 1: Identify Events to Subscribe (10 minutes)

**Action**: Determine which events the component should listen to

**Questions**:
1. What data changes should update this component?
2. Which manager emits events for those changes?
3. What are the EventType enum values for those events?

**Example**:
```typescript
// Component: MiningWindow
// Manager: MiningShipManager
// Events needed:
// - EventType.MINING_OPERATION_STARTED (ship starts mining)
// - EventType.MINING_OPERATION_COMPLETE (ship finishes)
// - EventType.SHIP_STATUS_CHANGED (ship status updates)
```

---

#### STEP 2: Import moduleEventBus and EventType (5 minutes)

**Location**: Component file, import section

**Action**: Import event bus and event types

**Pattern**:
```typescript
import { moduleEventBus } from '@/lib/modules/ModuleEvents';
import { EventType } from '@/types/events/EventTypes';
```

**Example**:
```typescript
import { moduleEventBus } from '@/lib/modules/ModuleEvents';
import { EventType } from '@/types/events/EventTypes';
```

---

#### STEP 3: Create Event Handler Function (10 minutes)

**Location**: Component function body, before useEffect

**Action**: Create callback function to handle the event

**Pattern**:
```typescript
const handleEvent = useCallback((event: ModuleEvent) => {
  // Extract data from event
  const data = event.data;

  // Update component state
  setComponentData(prevData => {
    // Update logic
    return updatedData;
  });
}, [/* dependencies */]);
```

**Example**:
```typescript
const handleMiningComplete = useCallback((event: ModuleEvent) => {
  const { shipId, resources } = event.data;

  // Refresh ship list to show updated status
  const ships = miningShipManager.getAllShips();
  const converted = convertShips(ships);
  setManagerShips(converted);

  // Show notification
  console.log(`Ship ${shipId} completed mining, gained ${resources}`);
}, [miningShipManager]);
```

**Tips**:
- Use `useCallback` to memoize handler
- Add manager to dependency array if used in handler
- Extract event data carefully (check type)

---

#### STEP 4: Subscribe to Event in useEffect (10-15 minutes)

**Location**: Component function body, in useEffect

**Action**: Subscribe to event, return cleanup function

**Pattern**:
```typescript
useEffect(() => {
  // Subscribe to event
  const unsubscribe = moduleEventBus.subscribe(
    EventType.EVENT_NAME,
    handleEvent
  );

  // Cleanup on unmount
  return unsubscribe;
}, [handleEvent]);
```

**Example** (single event):
```typescript
useEffect(() => {
  const unsubscribe = moduleEventBus.subscribe(
    EventType.MINING_OPERATION_COMPLETE,
    handleMiningComplete
  );

  return unsubscribe;
}, [handleMiningComplete]);
```

**Example** (multiple events):
```typescript
useEffect(() => {
  const unsubscribe1 = moduleEventBus.subscribe(
    EventType.MINING_OPERATION_STARTED,
    handleMiningStarted
  );

  const unsubscribe2 = moduleEventBus.subscribe(
    EventType.MINING_OPERATION_COMPLETE,
    handleMiningComplete
  );

  const unsubscribe3 = moduleEventBus.subscribe(
    EventType.SHIP_STATUS_CHANGED,
    handleShipStatusChanged
  );

  return () => {
    unsubscribe1();
    unsubscribe2();
    unsubscribe3();
  };
}, [handleMiningStarted, handleMiningComplete, handleShipStatusChanged]);
```

**Tips**:
- Always return cleanup function
- For multiple subscriptions, return a function that calls all unsubscribes
- Include handler in dependency array

---

#### STEP 5: Remove Polling if Events Sufficient (10 minutes)

**Action**: If events provide all needed updates, remove setInterval polling

**Before** (polling):
```typescript
useEffect(() => {
  const updateData = () => {
    const data = manager.getData();
    setData(data);
  };

  updateData(); // Initial
  const interval = setInterval(updateData, 1000); // Poll

  return () => clearInterval(interval);
}, [manager]);
```

**After** (event-driven):
```typescript
// Initial data fetch
useEffect(() => {
  const data = manager.getData();
  setData(data);
}, [manager]);

// Event subscription for updates
useEffect(() => {
  const unsubscribe = moduleEventBus.subscribe(
    EventType.DATA_UPDATED,
    (event) => {
      const data = manager.getData();
      setData(data);
    }
  );

  return unsubscribe;
}, [manager]);
```

**Or** (hybrid approach - keep polling as fallback):
```typescript
useEffect(() => {
  const updateData = () => {
    const data = manager.getData();
    setData(data);
  };

  // Event-driven updates (primary)
  const unsubscribe = moduleEventBus.subscribe(
    EventType.DATA_UPDATED,
    updateData
  );

  // Polling as fallback (in case events miss)
  const interval = setInterval(updateData, 5000); // Slower polling

  return () => {
    unsubscribe();
    clearInterval(interval);
  };
}, [manager]);
```

**Tips**:
- Test events work reliably before removing polling
- Consider hybrid approach for robustness
- If keeping polling, increase interval (less frequent)

---

### Verification Steps

#### 1. Event Emitted
```typescript
// In manager code, verify event is emitted
moduleEventBus.emit({
  type: EventType.DATA_UPDATED,
  moduleId: 'manager-id',
  moduleType: 'manager',
  timestamp: Date.now(),
  data: { ... }
});
```

#### 2. Component Receives Event
```typescript
// In event handler
const handleEvent = useCallback((event) => {
  console.log('Event received:', event);
  // Should log when event fires
}, []);
```

#### 3. UI Updates
- Trigger action that emits event
- Verify component UI updates
- Check console for event logs

---

### Success Criteria

- ✅ moduleEventBus and EventType imported
- ✅ Event handler created with useCallback
- ✅ Subscription created in useEffect
- ✅ Cleanup function returns unsubscribe
- ✅ Component updates when event fires
- ✅ No memory leaks (cleanup works)
- ✅ Polling removed or reduced (if events sufficient)

---

### Common Errors & Solutions

**Error**: Event handler called with undefined event
**Solution**: Check that manager emits event with correct EventType

**Error**: Component updates infinitely
**Solution**: Event handler is recreating itself. Add proper dependencies to useCallback.

**Error**: Events don't update component
**Solution**: Check that unsubscribe is in cleanup return, not called immediately

**Error**: Memory leak / component updated after unmount
**Solution**: Ensure cleanup function is returned and calls unsubscribe

---

### Time Breakdown

| Step | Time |
|------|------|
| 1. Identify Events | 10 min |
| 2. Import Event Bus | 5 min |
| 3. Create Handler | 10 min |
| 4. Subscribe in useEffect | 10-15 min |
| 5. Remove Polling | 10 min |
| **Total** | **45-50 min** |
| Verification | +10 min |
| **Grand Total** | **55-60 min** |

---

## Summary Table: All Patterns

| Pattern | Difficulty | Time | Files Modified |
|---------|-----------|------|----------------|
| 1. Add Manager to Registry | 🟢 Easy | 35-55 min | 1 |
| 2. Create Manager Hook | 🟢 Easy | 25-30 min | 2 |
| 3. Integrate Component | 🟡 Medium | 1.5-3 hrs | 1-2 |
| 4. String to Enum | 🟡 Medium | 75-120 min | 10-50+ |
| 5. Subscribe to Events | 🟡 Medium | 45-60 min | 1-2 |

---

## Quick Reference Commands

**Type Check**:
```bash
npm run type-check
```

**Lint**:
```bash
npm run lint
```

**Build**:
```bash
npm run build
```

**Search for String**:
```bash
grep -r "search-string" src/
```

**Search for Type**:
```bash
grep -r "type TypeName" src/
```

**Count Occurrences**:
```bash
grep -r "pattern" src/ | wc -l
```

---

## Pattern Selection Guide

**Need to add a new manager?** → Use Patterns 1 & 2 in sequence

**Need to connect component to manager?** → Use Pattern 3

**Need to improve type safety?** → Use Pattern 4

**Need real-time updates in component?** → Use Pattern 5

**Need to integrate a subsystem?** → Use Patterns 1, 2, 3 in sequence for all managers/components

---

**Last Updated**: 2025-11-13
**Maintainer**: Galactic Sprawl Audit Team
**Version**: 1.0.0

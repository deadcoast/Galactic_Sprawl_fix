# Quick Start: Add Manager to Registry

**Time**: 20 minutes | **Difficulty**: 🟢 Easy

This is the 5-minute reference guide for adding any manager to ManagerRegistry. For detailed explanations, see [PATTERN_LIBRARY.md](./PATTERN_LIBRARY.md#pattern-1-add-manager-to-registry).

---

## Prerequisites

- ✅ Manager class file exists and exports a class
- ✅ Manager compiles without errors
- ✅ No circular dependencies

---

## Steps

### 1. Add Import
**File**: `src/managers/ManagerRegistry.ts` (lines ~9-32)

```typescript
import { YourManager } from './relative/path/YourManager';
```

### 2. Add Instance Variable
**File**: `src/managers/ManagerRegistry.ts` (lines ~34-54)

```typescript
let yourManagerInstance: YourManager | null = null;
```

### 3. Create Getter Function
**File**: `src/managers/ManagerRegistry.ts` (lines ~56-293)

**Pattern A** (Direct instantiation):
```typescript
/**
 * Get the singleton instance of YourManager
 * @returns The YourManager instance
 */
export function getYourManager(): YourManager {
  if (!yourManagerInstance) {
    yourManagerInstance = new YourManager();
  }
  return yourManagerInstance;
}
```

**Pattern B** (getInstance method):
```typescript
export function getYourManager(): YourManager {
  if (!yourManagerInstance) {
    yourManagerInstance = YourManager.getInstance();
  }
  return yourManagerInstance;
}
```

**Pattern C** (With dependencies):
```typescript
export function getYourManager(): YourManager {
  if (!yourManagerInstance) {
    const dependency = getDependencyManager();
    yourManagerInstance = new YourManager(dependency);
  }
  return yourManagerInstance;
}
```

### 4. Update Reset Function
**File**: `src/managers/ManagerRegistry.ts` (lines ~297-320)

```typescript
export function resetManagers(): void {
  // ... existing resets
  yourManagerInstance = null;
}
```

### 5. Add Type Export
**File**: `src/managers/ManagerRegistry.ts` (lines ~322-344)

```typescript
export type {
  // ... existing types (alphabetical order)
  YourManager,
}
```

---

## Verify

```bash
npm run type-check && npm run lint
```

**Expected**: No errors (or no NEW errors)

---

## Test

```typescript
import { getYourManager } from '@/managers/ManagerRegistry';

const manager = getYourManager();
console.log(manager); // Should not be null

const instance2 = getYourManager();
console.log(manager === instance2); // Should be true (singleton)
```

---

## Common Errors

**Error**: `Cannot find module`
→ Check import path is correct

**Error**: `Type 'Manager | null' is not assignable to type 'Manager'`
→ Add `!` to return: `return yourManagerInstance!;`

**Error**: `Circular dependency detected`
→ Manager imports ManagerRegistry. Use getters instead.

---

## Done! ✅

Now create the hook: See [QUICK_START_CREATE_HOOK.md](./QUICK_START_CREATE_HOOK.md)

---

**Full Pattern Details**: [PATTERN_LIBRARY.md](./PATTERN_LIBRARY.md#pattern-1-add-manager-to-registry)

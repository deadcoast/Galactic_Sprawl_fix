# Quick Start: Create Manager Hook

**Time**: 15 minutes | **Difficulty**: 🟢 Easy

This is the 5-minute reference guide for creating a React hook for any manager. For detailed explanations, see [PATTERN_LIBRARY.md](./PATTERN_LIBRARY.md#pattern-2-create-manager-hook).

---

## Prerequisites

- ✅ Manager added to ManagerRegistry (see [QUICK_START_ADD_MANAGER.md](./QUICK_START_ADD_MANAGER.md))
- ✅ Getter function exists (e.g., `getYourManager()`)
- ✅ Type exported from ManagerRegistry

---

## Steps

### 1. Add Imports
**File**: `src/hooks/managers/useManagers.ts` (lines ~21-64)

```typescript
import {
  // ... existing imports (alphabetical)
  getYourManager,
  type YourManager,
} from '../../managers/ManagerRegistry';
```

### 2. Create Individual Hook
**File**: `src/hooks/managers/useManagers.ts` (lines ~66-232)

```typescript
/**
 * Hook to access the YourManager singleton
 * Brief description of what this manager does
 */
export function useYourManager(): YourManager {
  return useMemo(() => getYourManager(), []);
}
```

### 3. Update Combined Hook
**File**: `src/hooks/managers/useManagers.ts` (lines ~243-270)

```typescript
export function useManagers() {
  return useMemo(
    () => ({
      // ... existing managers (alphabetical)
      yourManager: getYourManager(),
    }),
    []
  );
}
```

### 4. Export Hook
**File**: `src/hooks/managers/index.ts` (lines ~13-36)

```typescript
export {
  // ... existing exports (alphabetical)
  useYourManager,
} from './useManagers';
```

---

## Verify

```bash
npm run type-check
```

**Expected**: No errors

---

## Test

```typescript
import { useYourManager } from '@/hooks/managers';

function TestComponent() {
  const manager = useYourManager();
  console.log(manager); // Should not be null
  return <div>Manager: {manager.constructor.name}</div>;
}
```

Or test combined hook:

```typescript
import { useManagers } from '@/hooks/managers';

function TestComponent() {
  const { yourManager } = useManagers();
  console.log(yourManager); // Should not be null
  return <div>Managers available!</div>;
}
```

---

## Common Errors

**Error**: `Cannot find name 'useMemo'`
→ Check React is imported: `import { useMemo } from 'react';`

**Error**: `Module has no exported member 'useYourManager'`
→ Check hook is exported in `index.ts`

---

## Done! ✅

Now you can use the manager in any component:

```typescript
import { useYourManager } from '@/hooks/managers';

export function MyComponent() {
  const manager = useYourManager();

  // Use manager...
  const data = manager.getData();

  return <div>{/* render */}</div>;
}
```

---

**Full Pattern Details**: [PATTERN_LIBRARY.md](./PATTERN_LIBRARY.md#pattern-2-create-manager-hook)

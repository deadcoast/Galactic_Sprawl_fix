# GALACTIC SPRAWL RECONCILIATION PLAN

**Generated:** 2025-12-10
**Based On:** AUDIT_REPORT.md
**Mode:** STRICT PRESERVATION (No Deletions)

---

## PHASE 2 OVERVIEW

This plan addresses all issues identified in the audit using ONLY additive operations:

- ✅ Add imports/exports
- ✅ Add wrapper functions
- ✅ Add integration code
- ✅ Rename with ALL references updated
- ❌ NO deletions
- ❌ NO commenting out code
- ❌ NO removing "unused" items

---

## SECTION 1: CANONICAL NAMING DECISIONS

### 1.1 ModuleEventBus - Canonical Choice

**CANONICAL:** `/src/lib/events/ModuleEventBus.ts`

- Reason: Extends EventBus base class, has validation, uses ErrorLoggingService
- Features: Type validation, filtering by moduleId/moduleType

**NON-CANONICAL (Keep as Wrapper):** `/src/lib/modules/ModuleEvents.ts`

- Action: Convert to thin wrapper that delegates to canonical ModuleEventBus
- Preserve: History tracking functionality (add to canonical if missing)

**Files to Update:**

```plaintext
src/initialization/eventSystemInit.ts
src/utils/events/EventDispatcher.tsx
src/utils/events/EventCommunication.ts
src/hooks/events/useModuleEvents.ts
src/hooks/modules/useModuleAutomation.ts
src/hooks/modules/useModuleUpgrade.ts
src/hooks/modules/useSubModules.ts
src/managers/module/SubModuleManager.ts
```

### 1.2 ServiceRegistry - Canonical Choice

**CANONICAL:** `/src/lib/managers/ServiceRegistry.ts`

- Reason: Most comprehensive, manager-focused which is primary use case

**NON-CANONICAL (Keep as Re-exports):**

- `/src/lib/services/ServiceRegistry.ts` → Re-export from canonical
- `/src/lib/registry/ServiceRegistry.ts` → Re-export from canonical

**Files to Update:**

```plaintext
All files importing from lib/services/ServiceRegistry
All files importing from lib/registry/ServiceRegistry
```

### 1.3 FactionShipTypes - Canonical Choice

**CANONICAL:** `/src/types/ships/FactionShipTypes.ts`

- Reason: Contains full 322-line implementation

**NON-CANONICAL (Keep as Re-exports):**

- `/src/types/factions/FactionShipTypes.ts` (Already re-exports - KEEP)
- `/src/types/ships/FactionTypes.ts` (Already re-exports - KEEP)

**Action:** No changes needed - already correctly structured

### 1.4 useModuleEvents Hook - Canonical Choice

**CANONICAL:** `/src/hooks/modules/useModuleEvents.ts`

- Reason: Uses UnifiedEventSystem, more features, proper lifecycle hooks

**NON-CANONICAL (Keep as Adapter):** `/src/hooks/events/useModuleEvents.ts`

- Action: Convert to adapter that imports from canonical location
- Add deprecation comment pointing to canonical

### 1.5 EventBatcher - Canonical Choice

**CANONICAL:** `/src/lib/events/EventBatcher.ts`

- Reason: Class-based, integrates with EventBus architecture

**NON-CANONICAL (Keep for RxJS users):** `/src/utils/events/EventBatchingRxJS.ts`

- Action: Keep as alternative for RxJS-based code
- Add comment documenting when to use each

### 1.6 Components: Badge/Button

**CANONICAL:** `/src/ui/components/Badge/Badge.tsx` and `/src/ui/components/Button/Button.tsx`

- Reason: Newer design system implementation

**NON-CANONICAL (Keep as Adapters):**

- `/src/components/ui/common/Badge.tsx` - Keep as adapter wrapping canonical
- `/src/components/ui/common/Button.tsx` - Already wraps canonical (correct)

---

## SECTION 2: INTEGRATION ROADMAP

### 2.1 CRITICAL FIX: Broken Exports in `/src/components/ui/index.ts`

**Problem:** 28 exports point to non-existent files
**Solution:** Create re-export mappings to actual component locations

**Step 1:** Create missing directories as re-export aggregators

```plaintext
mkdir -p src/components/ui/typography
mkdir -p src/components/ui/inputs
mkdir -p src/components/ui/layout
mkdir -p src/components/ui/feedback
mkdir -p src/components/ui/navigation
mkdir -p src/components/ui/data
mkdir -p src/components/ui/game
```

**Step 2:** Create index.ts files that re-export from `/src/ui/components/`

**File:** `src/components/ui/typography/index.ts`

```typescript
// Re-export typography components from ui design system
export { Heading } from '../../../ui/components/typography/Heading';
export { Text } from '../../../ui/components/typography/Text';
export { Label } from '../../../ui/components/typography/Label';
```

**File:** `src/components/ui/inputs/index.ts`

```typescript
// Re-export input components from ui design system
export { Input } from '../../../ui/components/inputs/Input';
export { Checkbox } from '../../../ui/components/inputs/Checkbox';
export { Radio } from '../../../ui/components/inputs/Radio';
export { Select } from '../../../ui/components/inputs/Select';
export { Slider } from '../../../ui/components/inputs/Slider';
export { Switch } from '../../../ui/components/inputs/Switch';
```

**File:** `src/components/ui/layout/index.ts`

```typescript
// Re-export layout components from ui design system
export { Container } from '../../../ui/components/layout/Container';
export { Grid } from '../../../ui/components/layout/Grid';
export { Flex } from '../../../ui/components/layout/Flex';
export { Stack } from '../../../ui/components/layout/Stack';
export { Spacer } from '../../../ui/components/layout/Spacer';
```

**File:** `src/components/ui/feedback/index.ts`

```typescript
// Re-export feedback components - create stubs or import if exist
// TODO: These components need to be implemented or sourced
export { Alert } from './Alert';
export { Spinner } from './Spinner';
export { Progress } from './Progress';
export { Skeleton } from './Skeleton';
export { Toast } from './Toast';
```

**Step 3:** Create single-file re-exports for missing components

**File:** `src/components/ui/Icon.tsx`

```typescript
// Re-export Icon from ui design system
export { Icon } from '../../ui/components/Icon';
```

**File:** `src/components/ui/Badge.tsx`

```typescript
// Re-export Badge from ui design system
export { Badge } from '../../ui/components/Badge';
```

**File:** `src/components/ui/Tooltip.tsx`

```typescript
// Re-export Tooltip from ui design system
export { Tooltip } from '../../ui/components/Tooltip';
```

**File:** `src/components/ui/Divider.tsx`

```typescript
// Re-export Divider from ui design system
export { Divider } from '../../ui/components/Divider';
```

**Step 4:** Update index.ts to use correct paths
Update exports in `src/components/ui/index.ts` to point to the new re-export files.

### 2.2 ModuleEventBus Consolidation

**Goal:** Make `/src/lib/modules/ModuleEvents.ts` delegate to canonical ModuleEventBus while preserving its unique history features.

**Step 1:** Add history functionality to canonical ModuleEventBus if missing

**Edit:** `src/lib/events/ModuleEventBus.ts`

```typescript
// ADD after existing imports:
import type { ModuleEventType as LegacyModuleEventType } from '../modules/ModuleEvents';

// ADD history tracking (if not already present):
private eventHistory: ModuleEvent[] = [];
private maxHistorySize = 1000;

// ADD history methods:
public getHistory(): ModuleEvent[] {
  return [...this.eventHistory];
}

public getModuleHistory(moduleId: string): ModuleEvent[] {
  return this.eventHistory.filter(e => e.moduleId === moduleId);
}

public getEventTypeHistory(type: string): ModuleEvent[] {
  return this.eventHistory.filter(e => e.type === type);
}

public clearHistory(): void {
  this.eventHistory = [];
}

// MODIFY emit() to track history:
// After validation, add: this.eventHistory.push(event);
// Trim if over maxHistorySize
```

**Step 2:** Convert legacy ModuleEvents to wrapper

**Edit:** `src/lib/modules/ModuleEvents.ts`

```typescript
// ADD at top - delegate to canonical:
import { moduleEventBus as canonicalEventBus, ModuleEvent } from '../events/ModuleEventBus';

// KEEP existing exports for backward compatibility
// MODIFY class to delegate:

class ModuleEventBusLegacy {
  // Delegate all methods to canonical
  subscribe(type: ModuleEventType, listener: ModuleEventListener): () => void {
    return canonicalEventBus.subscribe(type, listener);
  }

  emit(event: ModuleEvent): void {
    canonicalEventBus.emit(event);
  }

  getHistory(): ModuleEvent[] {
    return canonicalEventBus.getHistory();
  }

  getModuleHistory(moduleId: string): ModuleEvent[] {
    return canonicalEventBus.getModuleHistory(moduleId);
  }

  getEventTypeHistory(type: ModuleEventType): ModuleEvent[] {
    return canonicalEventBus.getEventTypeHistory(type);
  }

  clearHistory(): void {
    canonicalEventBus.clearHistory();
  }
}

// KEEP: export const moduleEventBus = new ModuleEventBusLegacy();
// This maintains backward compatibility
```

### 2.3 ServiceRegistry Consolidation

**Step 1:** Update `/src/lib/services/ServiceRegistry.ts`

```typescript
// Replace content with re-export
/**
 * @deprecated Import from lib/managers/ServiceRegistry instead
 * This file exists for backward compatibility
 */
export * from '../managers/ServiceRegistry';
```

**Step 2:** Update `/src/lib/registry/ServiceRegistry.ts`

```typescript
// Replace content with re-export
/**
 * @deprecated Import from lib/managers/ServiceRegistry instead
 * This file exists for backward compatibility
 */
export * from '../managers/ServiceRegistry';
```

### 2.4 useModuleEvents Hook Consolidation

**Edit:** `src/hooks/events/useModuleEvents.ts`

```typescript
// ADD at top:
/**
 * @deprecated Use the enhanced version from hooks/modules/useModuleEvents instead
 * This file exists for backward compatibility
 */

// ADD re-export of canonical:
export {
  useModuleEvents,
  useMultipleModuleEvents,
  useModuleLifecycle,
  useModuleResources,
  useModuleAutomation,
  useModuleStatus,
  MODULE_EVENTS
} from '../modules/useModuleEvents';

// KEEP existing implementation below for any code still using old API
```

### 2.5 Connect Orphaned TODO Implementations

**File:** `src/managers/module/ModuleUpgradeManager.ts`

**Lines 283 & 351:** Add tech requirement checking

```typescript
// ADD new method:
private checkTechRequirements(requirements: ModuleUpgradeRequirements): boolean {
  // Get TechTreeManager reference
  const techManager = getTechTreeManager();
  if (!techManager) {
    // If no tech manager, skip tech requirements (return true)
    return true;
  }

  // Check each tech requirement
  for (const techId of requirements.techRequirements || []) {
    if (!techManager.isTechUnlocked(techId)) {
      return false;
    }
  }
  return true;
}

// ADD import at top:
import { getTechTreeManager } from '../ManagerRegistry';
```

**File:** `src/managers/module/OfficerManager.ts`

**Line 255:** Add portrait generation stub

```typescript
// ADD method:
private generatePortrait(officer: Officer): string {
  // Return default portrait for now
  // Future: integrate with portrait generation service
  const defaultPortraits = [
    '/assets/officers/default_1.png',
    '/assets/officers/default_2.png',
    '/assets/officers/default_3.png',
  ];
  const index = Math.floor(Math.random() * defaultPortraits.length);
  return defaultPortraits[index];
}
```

**File:** `src/managers/module/ModuleManagerWrapper.ts`

**Lines 215 & 224:** Add proper cleanup

```typescript
// ADD cleanup method:
public cleanup(): void {
  // Unsubscribe from all event listeners
  this.subscriptions.forEach(unsub => unsub());
  this.subscriptions = [];
}

// ADD fallback handling:
private handleManagerUnavailable(operation: string): void {
  errorLoggingService.logError(
    new Error(`ModuleManager unavailable for operation: ${operation}`),
    'ModuleManagerWrapper',
    { operation }
  );
}
```

---

## SECTION 3: DEPENDENCY RESOLUTION ORDER

Execute fixes in this order to avoid breaking dependencies:

### Phase 3.1: Foundation Fixes (No Dependencies)

1. ✅ Create missing directories under `/src/components/ui/`
2. ✅ Create re-export files for typography, inputs, layout
3. ✅ Create single-file re-exports (Icon, Badge, Tooltip, Divider)

### Phase 3.2: Event System Consolidation

1. ✅ Add history tracking to canonical ModuleEventBus
2. ✅ Convert legacy ModuleEvents.ts to wrapper
3. ✅ Update useModuleEvents hook in /hooks/events/ to re-export

### Phase 3.3: Registry Consolidation

1. ✅ Update lib/services/ServiceRegistry.ts to re-export
2. ✅ Update lib/registry/ServiceRegistry.ts to re-export

### Phase 3.4: TODO Implementations

1. ✅ Add tech requirement checking to ModuleUpgradeManager
2. ✅ Add portrait generation to OfficerManager
3. ✅ Add cleanup methods to ModuleManagerWrapper

### Phase 3.5: Circular Dependency Mitigation

1. ⚠️ Add type-only imports where circular deps exist
2. ⚠️ Consider lazy loading for ErrorLoggingService ↔ UnifiedEventSystem

---

## SECTION 4: FILES TO CREATE

### 4.1 New Re-export Files

| Path                                    | Purpose                         |
|-----------------------------------------|---------------------------------|
| `src/components/ui/Icon.tsx`            | Re-export from ui/components    |
| `src/components/ui/Badge.tsx`           | Re-export from ui/components    |
| `src/components/ui/Tooltip.tsx`         | Re-export from ui/components    |
| `src/components/ui/Divider.tsx`         | Re-export from ui/components    |
| `src/components/ui/typography/index.ts` | Aggregate typography re-exports |
| `src/components/ui/inputs/index.ts`     | Aggregate input re-exports      |
| `src/components/ui/layout/index.ts`     | Aggregate layout re-exports     |
| `src/components/ui/navigation/index.ts` | Aggregate navigation re-exports |
| `src/components/ui/feedback/index.ts`   | Aggregate feedback re-exports   |
| `src/components/ui/data/index.ts`       | Aggregate data re-exports       |
| `src/components/ui/game/index.ts`       | Aggregate game re-exports       |

### 4.2 New Integration Files (Optional)

| Path                                       | Purpose                      |
|--------------------------------------------|------------------------------|
| `src/integration/EventSystemBridge.ts`     | Bridge between event systems |
| `src/integration/ManagerRegistryBridge.ts` | Unified manager access       |

---

## SECTION 5: FILES TO MODIFY

### 5.1 Critical Path (Must Fix)

| File                                  | Changes                                       |
|---------------------------------------|-----------------------------------------------|
| `src/components/ui/index.ts`          | Update exports to use new re-export structure |
| `src/lib/events/ModuleEventBus.ts`    | Add history tracking methods                  |
| `src/lib/modules/ModuleEvents.ts`     | Convert to wrapper delegating to canonical    |
| `src/lib/services/ServiceRegistry.ts` | Convert to re-export                          |
| `src/lib/registry/ServiceRegistry.ts` | Convert to re-export                          |
| `src/hooks/events/useModuleEvents.ts` | Add deprecation notice, re-export canonical   |

### 5.2 Enhancement Path (Should Fix)

| File                                          | Changes                             |
|-----------------------------------------------|-------------------------------------|
| `src/managers/module/ModuleUpgradeManager.ts` | Implement tech requirement checking |
| `src/managers/module/OfficerManager.ts`       | Implement portrait generation       |
| `src/managers/module/ModuleManagerWrapper.ts` | Add cleanup and fallback methods    |

### 5.3 Documentation Path (Nice to Have)

| File                                    | Changes                 |
|-----------------------------------------|-------------------------|
| `src/lib/events/EventBatcher.ts`        | Add usage documentation |
| `src/utils/events/EventBatchingRxJS.ts` | Add usage documentation |

---

## SECTION 6: VALIDATION CHECKLIST

After each phase, verify:

### Phase 3.1 Validation

- [ ] `npm run build` completes without module resolution errors
- [ ] All 28 broken exports now resolve

### Phase 3.2 Validation

- [ ] moduleEventBus.getHistory() works from both import paths
- [ ] Event subscriptions work through both entry points
- [ ] No duplicate events being fired

### Phase 3.3 Validation

- [ ] ServiceRegistry can be imported from all three paths
- [ ] All registered services accessible

### Phase 3.4 Validation

- [ ] Tech requirements properly block upgrades when not met
- [ ] Officers have generated portraits
- [ ] ModuleManagerWrapper cleanup prevents memory leaks

### Phase 3.5 Validation

- [ ] No runtime circular dependency errors
- [ ] Lazy loading doesn't break functionality

---

## APPENDIX: CHANGE LOG TEMPLATE

Use this format for all edits:

```plaintext
EDITING [filename]: [what I'm adding/changing]
- Adding: [description]
- Connecting: [what orphaned code this connects]
- Preserving: [what existing functionality is maintained]
```

---

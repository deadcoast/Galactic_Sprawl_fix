# CLAUDE.md - Galactic Sprawl Development Guide

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🎯 PRIMARY MISSION: CODEBASE AUDIT & INTEGRATION

**THIS IS AN INTEGRATION PROJECT, NOT A FEATURE DEVELOPMENT PROJECT.**

### Mission Statement
The Galactic Sprawl codebase experienced a corrupt merge that fragmented systems. Your mission is to **AUDIT, INTEGRATE, and CONNECT** existing code—NOT to delete, refactor, or rebuild.

### Core Principles (ABSOLUTE REQUIREMENTS)

1. **ZERO DELETIONS** - Never delete functions, files, or code marked as "unused"
2. **INTEGRATION OVER REPLACEMENT** - Connect existing systems, don't rebuild them
3. **PRESERVATION FIRST** - All existing functionality must remain intact
4. **DOCUMENT EVERYTHING** - Every phase produces 3-4 documentation files
5. **FOLLOW THE PATTERN** - Use the established 4-step audit cycle for ALL work

### Current Status
- **Overall Progress**: 6% of full audit complete
- **Phase 1 (Managers)**: 41% complete (21/51 managers integrated)
- **Remaining Work**: 885 hours across 11 phases (9 main + 2 sub-phases)
- **Timeline**: 11-21 months part-time, 5-10 months full-time
- **AI Executability**: 80% (thanks to Session 3 restructuring)

---

## 🎓 FOUNDATION DOCUMENTS (USE THESE FOR ALL TASKS)

**✨ NEW (Session 3)**: The audit plan has been restructured with comprehensive execution guides. **ALWAYS consult these documents before starting any task.**

### 📖 Primary Resources (Read First)

**1. PATTERN_LIBRARY.md** (`.docs/PATTERN_LIBRARY.md`)
- **When to Use**: EVERY time you integrate managers, components, types, or events
- **Contains**: 5 comprehensive patterns with step-by-step code examples
  - Pattern 1: Add Manager to Registry (20-30 min)
  - Pattern 2: Create Manager Hook (15-20 min)
  - Pattern 3: Integrate Component with Manager (1-3 hrs)
  - Pattern 4: Convert String Literal to Enum (75-120 min)
  - Pattern 5: Subscribe to Events (45-60 min)
- **Value**: Copy-paste code snippets, no guesswork needed

**2. DEPENDENCY_MAP.md** (`.docs/DEPENDENCY_MAP.md`)
- **When to Use**: BEFORE starting any manager or component integration
- **Contains**: Complete dependency graph for 51 managers, types, and components
- **Value**: Prevents out-of-order execution, identifies blockers
- **Critical**: Shows what MUST be completed before each task

**3. DECISION_TREES.md** (`.docs/DECISION_TREES.md`)
- **When to Use**: When facing architectural decisions
- **Contains**: 6 decision trees for common choices
  - Interface+Impl vs Direct Class
  - getInstance() vs Registry Pattern
  - Type Mismatch Handling
  - Component Integration Pattern
  - Factory Creation
  - String Literal vs Enum
- **Value**: Ensures consistency without human input

**4. QUICK_START_ADD_MANAGER.md** (`.docs/QUICK_START_ADD_MANAGER.md`)
- **When to Use**: Adding any manager to registry (most common operation)
- **Contains**: 5-step process with copy-paste code
- **Value**: 5-minute reference, no need to read full pattern library

**5. QUICK_START_CREATE_HOOK.md** (`.docs/QUICK_START_CREATE_HOOK.md`)
- **When to Use**: Creating React hook for manager (second most common)
- **Contains**: 4-step process with code snippets
- **Value**: 5-minute reference

### 🤖 Automation Scripts

**Run these scripts regularly to track progress:**

```bash
# Validate Phase 1 progress
.docs/scripts/validate-phase-1.sh

# Show progress across all phases
.docs/scripts/audit-progress.sh
```

**Output includes**:
- Manager count (current/target)
- Hook count (current/target)
- Type-check, lint, build status
- Progress percentage and bars

---

## 📋 THE AUDIT CYCLE (MANDATORY PROCESS)

**EVERY audit phase MUST follow this 4-step cycle:**

```
┌─────────────────────────────────────────────────────┐
│  STEP 1: INVENTORY (10-15% of phase time)          │
│  ├─ Catalog all files in the system                │
│  ├─ Map relationships and dependencies             │
│  ├─ Identify disconnections and duplicates         │
│  ├─ Document current state                         │
│  └─ Create: PHASE_X_1_INVENTORY.md                 │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  STEP 2: ANALYSIS (15-20% of phase time)           │
│  ├─ Analyze patterns and anti-patterns             │
│  ├─ Identify duplicates and conflicts              │
│  ├─ Find integration points                        │
│  ├─ Prioritize fixes (high/medium/low)             │
│  └─ Create: PHASE_X_2_ANALYSIS.md                  │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  STEP 3: INTEGRATION (60-70% of phase time)        │
│  ├─ Implement fixes following patterns             │
│  ├─ Add to registries (Manager, Factory, etc.)     │
│  ├─ Create access patterns (hooks, utilities)      │
│  ├─ Update components to use registries            │
│  ├─ Test each integration                          │
│  └─ Create: PHASE_X_3_INTEGRATION.md               │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  STEP 4: VERIFICATION (5-10% of phase time)        │
│  ├─ Validate all changes                           │
│  ├─ Check for breaking changes (must be ZERO)      │
│  ├─ Document integration patterns                  │
│  ├─ Update AUDIT_STATUS.md with progress           │
│  └─ Create: PHASE_X_COMPLETE.md                    │
└─────────────────────────────────────────────────────┘
```

### Required Documentation Per Phase
Every phase MUST produce these 4 documents:

1. **PHASE_X_1_INVENTORY.md** - Complete catalog of system
2. **PHASE_X_2_ANALYSIS.md** - Pattern analysis and priorities
3. **PHASE_X_3_INTEGRATION.md** - Integration guide with examples
4. **PHASE_X_COMPLETE.md** - Completion report with metrics

---

## 📚 AUDIT PLAN DOCUMENTS (READ BEFORE STARTING)

### Before ANY Work Session
1. **Read**: `.docs/EXECUTIVE_SUMMARY.md` - Quick overview of current status
2. **Read**: `.docs/AUDIT_STATUS.md` - Current progress and next steps
3. **Reference**: `.docs/FULL_SCOPE_AUDIT_PLAN.md` - Complete 9-phase roadmap

### 9-Phase Audit Roadmap

| Phase | System | Hours | Status | Priority | Completion |
|-------|--------|-------|--------|----------|------------|
| 1 | **Managers** | 68 | ✅ In Progress | HIGH | 35% |
| 2 | **Types** | 90 | ❌ Not Started | HIGH | 0% |
| 3 | **Events** | 75 | ❌ Not Started | HIGH | 0% |
| 4 | **Components** | 225 | ❌ Not Started | HIGH | 3% |
| 5 | **Factories** | 40 | ❌ Not Started | MEDIUM | 0% |
| 6 | **Context API** | 65 | ❌ Not Started | MEDIUM | 0% |
| 7 | **Utilities** | 50 | ❌ Not Started | LOW | 0% |
| 8 | **Services** | 33 | ❌ Not Started | LOW | 0% |
| 9 | **State Mgmt** | 75 | ❌ Not Started | LOW | 0% |

**Total**: 721 hours remaining (~6-12 months part-time)

---

## 🔧 INTEGRATION PATTERNS (STRICT REQUIREMENTS)

### Pattern 1: Manager Integration (Phase 1)

**Step-by-Step Process**:

```typescript
// STEP 1: Add to ManagerRegistry.ts
import { NewManager } from './path/to/NewManager';

let newManagerInstance: NewManager | null = null;

export function getNewManager(): NewManager {
  if (!newManagerInstance) {
    // Use getInstance() if available, otherwise new Constructor
    newManagerInstance = NewManager.getInstance(); // or new NewManager()
  }
  return newManagerInstance!;
}

// STEP 2: Update resetManagers()
export function resetManagers(): void {
  // ... existing resets
  newManagerInstance = null;
}

// STEP 3: Add type export
export type {
  // ... existing types
  NewManager,
};

// STEP 4: Create hook in useManagers.ts
export function useNewManager(): NewManager {
  return useMemo(() => getNewManager(), []);
}

// STEP 5: Export hook from index.ts
export { useNewManager } from './useManagers';

// STEP 6: Update useManagers() combined hook
export function useManagers() {
  return useMemo(
    () => ({
      // ... existing managers
      newManager: getNewManager(),
    }),
    []
  );
}
```

**Checklist for Each Manager**:
- [ ] Import added to ManagerRegistry.ts
- [ ] Singleton instance variable declared
- [ ] Getter function created
- [ ] resetManagers() updated
- [ ] Type export added
- [ ] Hook created in useManagers.ts
- [ ] Hook exported from index.ts
- [ ] Combined hook updated
- [ ] AUDIT_STATUS.md updated with new count

---

### Pattern 2: Component Integration (Phase 4)

**BEFORE (Anti-Pattern)**:
```typescript
// ❌ WRONG - Direct Context API usage, bypasses managers
function MyComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Polling pattern - inefficient
    const interval = setInterval(() => {
      fetch('/api/data').then(r => r.json()).then(setData);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <div>{/* UI */}</div>;
}
```

**AFTER (Correct Pattern)**:
```typescript
// ✅ CORRECT - Uses manager + event-driven updates
import { useResourceManager } from '@/hooks/managers';
import { moduleEventBus } from '@/lib/events/ModuleEventBus';
import { EventType } from '@/types/events/EventTypes';

function MyComponent() {
  const resourceManager = useResourceManager();
  const [data, setData] = useState(() => resourceManager.getAllResources());

  useEffect(() => {
    // Event-driven updates, no polling
    const unsubscribe = moduleEventBus.subscribe(
      EventType.RESOURCE_UPDATED,
      (event) => {
        if (isResourceEvent(event)) {
          setData(resourceManager.getAllResources());
        }
      }
    );
    return unsubscribe;
  }, [resourceManager]);

  return <div>{/* UI */}</div>;
}
```

**Component Integration Checklist**:
- [ ] Manager imported via hook (`useManagerName`)
- [ ] Initial state from manager (not hardcoded/mocked)
- [ ] Event subscription instead of polling
- [ ] Type guards used for event validation
- [ ] Proper cleanup in useEffect return
- [ ] Fallback to mock data if manager empty (graceful degradation)
- [ ] Zero breaking changes to existing UI

---

### Pattern 3: Type System (Phase 2)

**BEFORE (Anti-Pattern)**:
```typescript
// ❌ WRONG - String literals and string unions
type ResourceCategory = 'mineral' | 'gas' | 'exotic';

interface Resource {
  type: 'iron' | 'helium' | 'dark_matter';
  category: ResourceCategory;
}

function processResource(type: string) {
  if (type === 'iron') { /* ... */ }
}
```

**AFTER (Correct Pattern)**:
```typescript
// ✅ CORRECT - Enums only
import { ResourceType } from '@/types/resources/ResourceTypes';

enum ResourceCategory {
  MINERAL = 'MINERAL',
  GAS = 'GAS',
  EXOTIC = 'EXOTIC',
}

interface Resource {
  type: ResourceType;
  category: ResourceCategory;
}

function processResource(type: ResourceType) {
  switch (type) {
    case ResourceType.IRON:
      /* ... */
      break;
    case ResourceType.HELIUM:
      /* ... */
      break;
    // Must handle ALL enum cases
    default:
      assertNever(type);
  }
}

// Type guard (REQUIRED)
function isResourceType(value: unknown): value is ResourceType {
  return typeof value === 'string' &&
         Object.values(ResourceType).includes(value as ResourceType);
}
```

**Type System Checklist**:
- [ ] All string literals converted to enums
- [ ] String unions converted to enums
- [ ] Type guards created for all enums
- [ ] Switch statements use exhaustive checking
- [ ] No `as` casts without type guard validation
- [ ] Runtime validation at boundaries

---

### Pattern 4: Event System (Phase 3)

**Event Emission Pattern**:
```typescript
import { EventType, ModuleType } from '@/types/events/EventTypes';
import { moduleEventBus } from '@/lib/events/ModuleEventBus';

// ✅ CORRECT - Fully typed event
function emitResourceUpdate(resourceType: ResourceType, amount: number) {
  const eventData: ResourceUpdatedEventData = {
    resourceType,
    amount,
    timestamp: Date.now(),
  };

  moduleEventBus.emit({
    type: EventType.RESOURCE_UPDATED,
    moduleId: 'resource-module-1',
    moduleType: ModuleType.RESOURCE_PROCESSOR,
    timestamp: Date.now(),
    data: eventData,
  });
}
```

**Event Subscription Pattern**:
```typescript
// ✅ CORRECT - With type guard
useEffect(() => {
  const unsubscribe = moduleEventBus.subscribe(
    EventType.RESOURCE_UPDATED,
    (event) => {
      // ALWAYS use type guard
      if (!isResourceUpdatedEvent(event)) {
        console.warn('Invalid event received:', event);
        return;
      }

      // Now event.data is properly typed
      handleResourceUpdate(event.data);
    }
  );

  return unsubscribe; // ALWAYS cleanup
}, []);
```

**Event System Checklist**:
- [ ] EventType enum used (never strings)
- [ ] ModuleType enum used (never strings)
- [ ] Event data properly typed
- [ ] Type guard used before processing
- [ ] Subscription cleaned up in useEffect return
- [ ] Error handling for invalid events

---

## 🚫 ABSOLUTE ANTI-PATTERNS (NEVER DO THESE)

### 1. NEVER Delete "Unused" Code
```typescript
// ❌ WRONG
// "This function looks unused, I'll delete it"
// export function oldFunction() { ... } // DELETED

// ✅ CORRECT
// "This function is disconnected. I'll document it and integrate it."
// Document in INVENTORY.md, create integration path in ANALYSIS.md
```

### 2. NEVER Create Direct Manager Instances
```typescript
// ❌ WRONG
import { ResourceManager } from '../managers/game/ResourceManager';
const manager = new ResourceManager();

// ✅ CORRECT
import { useResourceManager } from '@/hooks/managers';
const manager = useResourceManager();
```

### 3. NEVER Use String Literals for Typed Values
```typescript
// ❌ WRONG
const resourceType = 'energy';
const eventType = 'RESOURCE_UPDATED';
const moduleType = 'mining_hub';

// ✅ CORRECT
const resourceType = ResourceType.ENERGY;
const eventType = EventType.RESOURCE_UPDATED;
const moduleType = ModuleType.MINING_HUB;
```

### 4. NEVER Skip the Audit Cycle
```typescript
// ❌ WRONG
// "I'll just add this manager quickly without documenting"
// [Makes changes without INVENTORY → ANALYSIS → INTEGRATION → VERIFICATION]

// ✅ CORRECT
// 1. INVENTORY: Document all existing managers
// 2. ANALYSIS: Identify integration points
// 3. INTEGRATION: Add manager following pattern
// 4. VERIFICATION: Test and document
```

### 5. NEVER Use Type Assertions Without Guards
```typescript
// ❌ WRONG
const event = data as ResourceEvent; // Unsafe!
processEvent(event);

// ✅ CORRECT
if (isResourceEvent(data)) {
  processEvent(data); // Type-safe!
} else {
  console.error('Invalid event:', data);
}
```

### 6. NEVER Poll When You Can Subscribe
```typescript
// ❌ WRONG
useEffect(() => {
  const interval = setInterval(() => {
    const data = manager.getData();
    setState(data);
  }, 1000);
  return () => clearInterval(interval);
}, []);

// ✅ CORRECT
useEffect(() => {
  const unsubscribe = moduleEventBus.subscribe(
    EventType.DATA_UPDATED,
    (event) => setState(event.data)
  );
  return unsubscribe;
}, []);
```

### 7. NEVER Skip Documentation
```typescript
// ❌ WRONG
// [Makes 10 changes without updating AUDIT_STATUS.md]

// ✅ CORRECT
// After each integration:
// 1. Update AUDIT_STATUS.md with new counts
// 2. Document pattern in PHASE_X_INTEGRATION.md
// 3. Update progress visualization
```

---

## 📊 CONSISTENCY REQUIREMENTS

### File Naming Conventions
```
Managers:       PascalCase + Manager suffix
                Example: ResourceManager.ts, CombatManager.ts

Hooks:          camelCase + use prefix
                Example: useResourceManager.ts, useManagers.ts

Components:     PascalCase
                Example: MiningWindow.tsx, ResourceDisplay.tsx

Types:          PascalCase + Types suffix
                Example: ResourceTypes.ts, EventTypes.ts

Utilities:      camelCase + Util/Utils suffix
                Example: typeGuards.ts, validationUtils.ts

Constants:      SCREAMING_SNAKE_CASE
                Example: MAX_RESOURCES, DEFAULT_TIMEOUT
```

### Import Order (STRICT)
```typescript
// 1. External dependencies
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';

// 2. Manager hooks
import { useResourceManager, useCombatManager } from '@/hooks/managers';

// 3. Types
import { ResourceType, EventType } from '@/types/...';

// 4. Event bus
import { moduleEventBus } from '@/lib/events/ModuleEventBus';

// 5. Components
import { ResourceDisplay } from './ResourceDisplay';

// 6. Utilities
import { isResourceEvent } from '@/utils/typeGuards';

// 7. Styles (if any)
import './styles.css';
```

### Commit Message Format
```
Format: <type>(<scope>): <description>

Types:
  audit    - Audit/inventory work
  integrate - Integration of disconnected systems
  docs     - Documentation updates
  types    - Type system improvements
  events   - Event system work
  test     - Test additions/fixes
  refactor - Code improvements (NO deletions)

Examples:
  audit(managers): catalog all 52 manager files
  integrate(managers): add ExplorationManager to registry
  docs(audit): update AUDIT_STATUS with Phase 1 progress
  types(resources): convert string literals to ResourceType enum
  events(combat): add event subscriptions to CombatDashboard

Footer (ALWAYS):
  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🎯 SESSION WORKFLOW (REQUIRED STEPS)

### Before Starting ANY Work

```markdown
1. READ .docs/EXECUTIVE_SUMMARY.md
   - Understand current status (6% complete, Phase 1 @ 41%)
   - Review next immediate steps

2. READ .docs/AUDIT_STATUS.md
   - Check current phase progress
   - Identify next task to work on
   - Review blocking issues

3. CHECK .docs/DEPENDENCY_MAP.md
   - VERIFY dependencies for your task are complete
   - Check if any blockers exist
   - Confirm integration order

4. RUN PROGRESS SCRIPT
   ```bash
   .docs/scripts/audit-progress.sh
   ```
   - Validate current state
   - Confirm no regressions

2. READ .docs/AUDIT_STATUS.md
   - Check current phase progress
   - Review next 5 immediate steps
   - Note any blockers

3. READ .docs/FULL_SCOPE_AUDIT_PLAN.md (relevant section)
   - Understand current phase requirements
   - Review integration patterns
   - Check dependencies

4. CHECK Current Phase Documents
   - Phase 1: PHASE_1_1_MANAGER_INVENTORY.md (inventory)
   - Phase 1: Integration pattern templates
   - Phase 1: Remaining managers list (34 remaining)

5. IDENTIFY Tasks for This Session
   - Pick 1-5 managers to integrate, OR
   - Pick 1-2 components to connect, OR
   - Start next audit phase (if current phase complete)

6. FOLLOW The Audit Cycle
   - If starting new phase: Begin with INVENTORY
   - If continuing phase: Follow INTEGRATION checklist
   - If finishing phase: Complete VERIFICATION
```

### During Work

```markdown
1. USE TodoWrite Tool
   - Create todo items for each integration
   - Mark in_progress when starting
   - Mark completed when done
   - Keep list updated

2. FOLLOW Integration Pattern
   - Copy exact pattern from INTEGRATION.md
   - Complete ALL checklist items
   - Test each change
   - Document any deviations

3. PRESERVE Everything
   - Never delete code
   - Add fallbacks for new integrations
   - Keep mock data as fallback
   - Maintain backward compatibility

4. DOCUMENT As You Go
   - Update AUDIT_STATUS.md with counts
   - Note any issues or blockers
   - Document integration decisions
   - Update progress visualization
```

### After Work Session

```markdown
1. UPDATE AUDIT_STATUS.md
   - New manager/component counts
   - Updated progress percentages
   - New completion estimates
   - Any blockers discovered

2. CREATE/UPDATE Phase Documents
   - Add entries to INVENTORY.md if new items found
   - Document patterns in INTEGRATION.md
   - Note issues in ANALYSIS.md
   - Update COMPLETE.md if phase done

3. VERIFY Zero Breaking Changes
   - All existing functionality intact
   - Type checks pass (npm run type-check)
   - No deletions occurred
   - Fallbacks in place

4. COMMIT Changes
   - Follow commit message format
   - Reference phase in scope
   - Include Claude footer
   - Descriptive message
```

---

## 📖 Project Overview

Galactic Sprawl is a TypeScript/React-based space empire management game featuring modular systems, resource management, exploration, and combat. The architecture emphasizes type safety, event-driven communication, and singleton manager patterns.

**Current State**: Post-merge fragmentation requiring systematic audit and integration.

---

## 🔧 Development Commands

### Build and Development
```bash
npm run dev              # Start development server (port 3001)
npm run build            # Build for production (runs tsc && vite build)
npm run preview          # Preview production build
```

### Testing
```bash
npm test                 # Run all tests with Vitest
npm run test:ui          # Run tests with Vitest UI
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests
npm run test:e2e         # Run Playwright end-to-end tests
npm run test:e2e:ui      # Run E2E tests with Playwright UI
npm run test:e2e:debug   # Debug E2E tests
npm run test:perf        # Run performance tests
npm run coverage         # Generate test coverage report
```

### Linting and Type Checking
```bash
npm run lint             # Run ESLint with caching
npm run lint:fix         # Auto-fix ESLint issues
npm run lint:critical    # Lint critical game systems
npm run lint:changed     # Lint only changed files in git
npm run type-check       # Run TypeScript compiler without emitting files
npm run typecheck:specific # Run targeted type checks
```

### Code Quality
```bash
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changes
npm run format:all       # Format and fix linting issues
npm run validate         # Run type-check and lint:critical in parallel
npm run find-circular    # Find circular dependencies using madge
```

### Advanced Linting Tools
```bash
npm run lint:track       # Track ESLint error progress
npm run lint:chart       # Generate progress charts
npm run lint:status      # Show lint status and top issues
npm run lint:fix-top     # Auto-fix top ESLint issues
npm run lint:workflow    # Run complete linting workflow
npm run lint:workflow:interactive # Interactive linting workflow
npm run lint:workflow:auto-fix    # Automated linting workflow with fixes
```

---

## 🏗️ Architecture Overview

### System Hierarchy

```
Type System (Foundation)
  ↓ Enums, Interfaces, Type Guards
Event System (Communication)
  ↓ moduleEventBus, TypedEventEmitter
Registry System (Access Control)
  ↓ ManagerRegistry, FactoryRegistry
Manager Systems (Business Logic)
  ↓ Singletons, Event Emission
Component Systems (UI)
  ↓ React Hooks, Event Subscriptions
```

### Core Architectural Patterns

1. **Manager Registry Pattern**: All managers accessed through `ManagerRegistry.ts`
2. **Enum-Based Type System**: Use enums (ResourceType, EventType, ModuleType) not strings
3. **Event-Driven Communication**: Systems communicate via `moduleEventBus` with typed events
4. **Singleton Managers**: Managers use singleton pattern with getInstance() or registry getters
5. **Hook-Based Access**: Components use React hooks (useResourceManager) to access managers

---

## 🗂️ Key Manager Systems

### Resource Management (5 managers)
- `ResourceManager` - Core resource allocation and state
- `ResourceFlowManager` - Resource flow optimization (uses Web Workers)
- `ResourceConversionManager` - Resource conversion logic
- `ResourceThresholdManager` - Threshold monitoring (NOT IN REGISTRY ❌)
- `ResourceStorageManager` - Storage management (NOT IN REGISTRY ❌)

### Module Management (5 managers)
- `ModuleManager` - Module lifecycle and coordination (NOT IN REGISTRY ❌)
- `ModuleStatusManager` - Status tracking ✅ IN REGISTRY
- `ModuleUpgradeManager` - Upgrade system (NOT IN REGISTRY ❌)
- `SubModuleManager` - Sub-module handling (NOT IN REGISTRY ❌)
- `ModuleAttachmentManager` - Attachment logic (NOT IN REGISTRY ❌)

### Combat & Ships (5 managers)
- `CombatManager` - Combat coordination ✅ IN REGISTRY
- `CombatShipManagerImpl` - Combat ship management (NOT IN REGISTRY ❌)
- `ThreatAssessmentManager` - Threat evaluation ✅ IN REGISTRY
- `CombatMechanicsSystem` - Combat mechanics ✅ IN REGISTRY
- `ObjectDetectionSystem` - Object detection ✅ IN REGISTRY

### Exploration & Mining (3 managers)
- `ExplorationManager` - Exploration coordination ✅ IN REGISTRY
- `ReconShipManager` - Reconnaissance ships ✅ IN REGISTRY
- `MiningShipManager` - Mining operations ✅ IN REGISTRY

### Game Systems (8 managers)
- `GameLoopManager` - Game loop coordination (NOT IN REGISTRY ❌)
- `AutomationManager` - Automation systems ✅ IN REGISTRY
- `GlobalAutomationManager` - Global automation ✅ IN REGISTRY
- `TechTreeManager` - Technology tree ✅ IN REGISTRY
- `FactionBehaviorManager` - Faction AI ✅ IN REGISTRY
- `AsteroidFieldManager` - Asteroid fields ✅ IN REGISTRY
- `EffectLifecycleManager` - Visual effects ✅ IN REGISTRY
- `GameStateManager` - Game state (NOT IN REGISTRY ❌)

### Colony System (8 managers - NONE IN REGISTRY ❌)
- `ColonyManagerImpl` - Colony management
- `PopulationManager` - Population growth
- `HabitableWorldManager` - Habitable worlds
- `BiodomeManager` - Biodome modules
- `TradeRouteManager` - Trade routes
- `ColonyProductionManager` - Colony production
- `ColonyExpansionManager` - Colony expansion
- `ColonySatisfactionManager` - Colony satisfaction

**Phase 1 Progress**: 18/52 managers integrated (35%)

---

## 🪝 Component Integration (Using Manager Hooks)

### Available Manager Hooks (18 total)

**Resource Hooks**:
```typescript
import {
  useResourceManager,
  useResourceFlowManager,
  useResourceConversionManager
} from '@/hooks/managers';
```

**Combat Hooks**:
```typescript
import {
  useCombatManager,
  useCombatMechanicsSystem,
  useThreatAssessmentManager,
  useObjectDetectionSystem
} from '@/hooks/managers';
```

**Ship Hooks**:
```typescript
import {
  useMiningShipManager,
  useReconShipManager,
  useExplorationManager
} from '@/hooks/managers';
```

**Module Hooks**:
```typescript
import {
  useOfficerManager,
  useModuleStatusManager
} from '@/hooks/managers';
```

**Game Hooks**:
```typescript
import {
  useTechTreeManager,
  useAutomationManager,
  useGlobalAutomationManager,
  useFactionBehaviorManager,
  useAsteroidFieldManager
} from '@/hooks/managers';
```

**Effect Hooks**:
```typescript
import { useEffectLifecycleManager } from '@/hooks/managers';
```

**Combined Hook** (all managers):
```typescript
import { useManagers } from '@/hooks/managers';

const {
  resourceManager,
  combatManager,
  miningShipManager,
  // ... all 18 managers
} = useManagers();
```

### Component Integration Example

```typescript
import { useState, useEffect } from 'react';
import { useResourceManager } from '@/hooks/managers';
import { moduleEventBus } from '@/lib/events/ModuleEventBus';
import { EventType, ResourceType } from '@/types/...';
import { isResourceEvent } from '@/utils/typeGuards';

function ResourceDisplay() {
  const resourceManager = useResourceManager();
  const [resources, setResources] = useState(() =>
    resourceManager.getAllResources()
  );

  useEffect(() => {
    const unsubscribe = moduleEventBus.subscribe(
      EventType.RESOURCE_UPDATED,
      (event) => {
        if (isResourceEvent(event)) {
          setResources(resourceManager.getAllResources());
        }
      }
    );

    return unsubscribe;
  }, [resourceManager]);

  return (
    <div>
      {Object.entries(resources).map(([type, amount]) => (
        <div key={type}>
          {type}: {amount}
        </div>
      ))}
    </div>
  );
}
```

---

## 📁 Critical Files Reference

### Audit Documents (READ FIRST)
- `.docs/EXECUTIVE_SUMMARY.md` - Quick overview and current status
- `.docs/AUDIT_STATUS.md` - Detailed progress tracker
- `.docs/FULL_SCOPE_AUDIT_PLAN.md` - Complete 9-phase roadmap
- `.docs/PHASE_1_1_MANAGER_INVENTORY.md` - Manager catalog
- `.docs/PHASE_1_2_TYPE_SYSTEM_MAP.md` - Type system analysis
- `.docs/PHASE_1_3_COMPONENT_INTEGRATION_MAP.md` - Component integration map
- `.docs/MINING_SUBSYSTEM_INTEGRATION.md` - Proof-of-concept integration guide

### Core Systems
- `src/managers/ManagerRegistry.ts` - **CENTRAL MANAGER ACCESS POINT**
- `src/hooks/managers/useManagers.ts` - Manager access hooks
- `src/hooks/managers/index.ts` - Hook exports
- `src/lib/events/ModuleEventBus.ts` - Event bus implementation
- `src/lib/events/TypedEventEmitter.ts` - Type-safe event emitter

### Type Definitions
- `src/types/resources/ResourceTypes.ts` - Resource type enums and interfaces
- `src/types/events/EventTypes.ts` - Event type enums (120+ values)
- `src/types/buildings/ModuleTypes.ts` - Module type definitions (⚠️ STRING UNION, needs conversion to enum)
- `src/types/ships/UnifiedShipTypes.ts` - Unified ship types
- `src/types/ships/PlayerShipTypes.ts` - Player ship classes

### Documentation (Cursor Rules)
- `.cursorrules` - **Core development rules** (READ BEFORE ANY TASK)
- `.cursorcontext.md` - Detailed codebase documentation with hashtag-based sections
- `.cursor/rules/` - Domain-specific rules:
  - `core-architecture.mdc`
  - `manager-rules.mdc`
  - `event-handling.mdc`
  - `type-definitions.mdc`
  - `factory-integration.mdc`
  - And more...

---

## ⚠️ Common Anti-Patterns to Avoid

1. **String Literals Instead of Enums** - Always use `ResourceType.ENERGY` not `"energy"`
2. **Direct Manager Instantiation** - Always use `getResourceManager()` not `new ResourceManager()`
3. **Unsafe Type Assertions** - Use type guards, not `as` casts without validation
4. **Direct Property Access** - Use safe extraction utilities for potentially undefined objects
5. **Creating Wrappers** - Don't wrap existing methods, use them directly
6. **Skipping Documentation** - Always check `.cursorcontext.md` before implementing patterns
7. **Deleting "Unused" Code** - NEVER delete during audit, document and integrate instead
8. **Polling Instead of Events** - Use event subscriptions, not setInterval
9. **Skipping Audit Cycle** - Must follow INVENTORY → ANALYSIS → INTEGRATION → VERIFICATION
10. **Missing Type Guards** - Every event handler must validate with type guards

---

## 🧪 Testing Best Practices

- Test files located in `src/tests/`
- Use Vitest for unit/integration tests
- Use Playwright for E2E tests
- Performance tests in `src/tests/performance/`
- Test utilities in `src/tests/tools/`
- Mock factories in `src/types/managers/MockManagerFactory.ts`

**Testing During Audit**:
- ✅ Test each manager integration before moving to next
- ✅ Verify components still render after integration
- ✅ Check event subscriptions work correctly
- ✅ Validate type safety improvements
- ❌ Don't batch multiple integrations without testing

---

## ⚡ Performance Considerations

- The game manages 50+ star systems
- Uses React.memo and useMemo for optimization
- Lazy loading for non-critical components
- WebGL for advanced graphics (via react-three-fiber)
- D3.js for visualizations
- RxJS for complex event handling
- Web Workers for intensive calculations (ResourceFlowWorker)

---

## 🛠️ Technology Stack

- **Core**: TypeScript 5.8.3, React 18.3.1
- **Build**: Vite 5.4.2
- **State**: Context API, RxJS 7.8.1
- **UI**: Framer Motion, Ant Design, Chakra UI, Material-UI
- **3D**: Three.js, react-three-fiber, @react-three/drei
- **Visualization**: D3.js, Recharts, Chart.js
- **Testing**: Vitest, Playwright, Testing Library

---

## 🔄 Git Workflow

When making changes:
1. Check `git status` to see current branch and changes
2. Use audit commit message format (see above)
3. Reference the main branch: `main`
4. Include Claude footer in all commits
5. Recent focus: Manager integration audit (Phase 1)

---

## 🎯 When in Doubt

**BEFORE implementing anything**:

1. ✅ Read `.docs/AUDIT_STATUS.md` - Understand current progress
2. ✅ Read `.docs/FULL_SCOPE_AUDIT_PLAN.md` - Check current phase requirements
3. ✅ Check `.cursorrules` - Verify required patterns
4. ✅ Search `.cursorcontext.md` - Find system-specific guidance
5. ✅ Review `.cursor/rules/` - Check domain-specific rules
6. ✅ Look at existing manager implementations in `src/managers/`
7. ✅ Check type definitions in `src/types/`
8. ✅ Follow the 4-step audit cycle (INVENTORY → ANALYSIS → INTEGRATION → VERIFICATION)
9. ✅ Use the Manager Registry pattern for ALL manager access
10. ✅ Use enums for ALL predefined values
11. ✅ Validate types at runtime with type guards
12. ✅ Document EVERYTHING

**REMEMBER**: This is an **integration project**, not a feature development project. Your job is to connect, not to delete or rebuild.

---

## 🎯 Success Metrics

### Current Status
- ✅ Manager Coverage: 35% (18/52)
- ✅ Component Integration: 3% (9/297)
- ✅ Type Safety Score: 7.5/10
- ✅ Event-Driven: ~10%
- ✅ Code Deletions: 0 (MUST stay 0)
- ✅ Breaking Changes: 0 (MUST stay 0)

### Target Metrics (Full Audit Complete)
- 🎯 Manager Coverage: 100% (52/52)
- 🎯 Component Integration: 80%+ (240+/297)
- 🎯 Type Safety Score: 9.5/10
- 🎯 Event-Driven: 80%+
- 🎯 Code Deletions: 0 (ZERO TOLERANCE)
- 🎯 Breaking Changes: 0 (ZERO TOLERANCE)

---

**Last Updated**: 2025-11-13
**Audit Progress**: 5% Complete (Phase 1 @ 35%)
**Current Focus**: Complete Phase 1 - Manager Integration (34 managers remaining)
**Next Milestone**: 52/52 managers in registry (ETA: 6-8 weeks)

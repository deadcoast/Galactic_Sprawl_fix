# unfinished-tasks.md

> If a task seems complete, validate its integration in the source code before the task is marked complete.

## TASKLIST

HIGH PRIORITY
- [ ] Fix SelectedShipDetails.tsx TypeScript union complexity errors (TS2590 at lines 37–40 & 147)
  - [ ] Refactor expression(s) to reduce union type complexity (e.g., explicit type assertions, helper functions).
- [ ] Fix ShipCard.tsx Record<ShipStatus,string> type mismatch (TS2739)
  - [ ] Add missing keys (combat, active, inactive) or adjust type.
- [ ] Fix useManagerRegistryIntegration.ts runtime-unsafe call & missing method (TS2339, ESLint no-unsafe-call)
  - [ ] Add proper generic constraint for T or use type guard ensuring getName exists.

MEDIUM PRIORITY
- [x] Fix eslint @typescript-eslint/no-base-to-string in useFactionBehavior.ts (object stringification)
- [ ] Remove console statements & replace with errorLoggingService in useManagerRegistryIntegration.ts (no-console x2)
- [ ] Unused variable 'e' in useManagerRegistryIntegration.ts (no-unused-vars)

LOW PRIORITY
- [ ] Review any remaining TypeScript & ESLint warnings after above fixes and update types / guards as needed.

---
NOTE: Complete each sub-task and tick when fully implemented & passing tsc plus lint.

## FUTURE TASKLIST TODOs

- [ ] Task 2: Implement Proper Type Definitions

  - [ ] Defer `any`/`unknown` refinement in `src/hooks/ui/useComponentRegistration.ts` (Blocked by missing Context/Types)
  - [ ] Create concrete type definitions to replace all 'any' types (Remaining: Primarily D3 files under Task 10, and potentially others found later)
  - [ ] Implement strict type checking across all components
  - [ ] Add proper generic implementations for container classes
  - [ ] Create type utilities for complex type relationships

  Primary Files with Any Types:

  - [ ] `src/utils/performance/D3BatchedUpdates.ts`: (Deferred to Task 10)
  - [ ] `src/types/visualizations/D3SelectionTypes.ts`: (Deferred to Task 10)

- [ ] Task 3: Implement Proper Null Checking

  - [ ] Implement proper error handlers for null conditions
  - [ ] Add validation functions to ensure data structures are complete before access

- [ ] Task 4: Implement Structured Logging System

  - [ ] Implement environment-specific logging configuration
  - [ ] Add context information to all log messages

- [ ] Task 5: Implement Proper Type Definitions for Ignored Cases

  - [ ] Create proper interfaces for all @ts-ignore cases
  - [ ] Implement type utilities for complex type scenarios
  - [ ] Refactor code to properly handle edge cases with type safety
  - [ ] Create unit tests validating type correctness

- [ ] Task 7: Complete System Integration
  - [x] Connect all implemented components to their respective systems (GameManager via ManagerRegistry)
  - [ ] Implement all missing functionality in resource flow system
  - [ ] Complete event system implementation with proper type safety
  - [ ] Ensure full integration between worker system and main application

Key Integration Files:
`src/workers/ResourceFlowWorker.ts`

- [x] No robust retry mechanism for failed operations

`src/workers/worker.ts`

- [x] Missing proper task scheduling and prioritization
- [x] Insufficient task cancellation implementation

Additional Integration Required:

- [ ] Complete entirely the event system implementation in src/lib/events/
- [ ] Complete the Missing connections between resource system components
- [ ] Complete Unfinished worker communication protocol
- [ ] Replace Incomplete error propagation across system boundaries with robust solution

- [ ] Task 8: Global Type Safety & Validation:

  - [x] Replaced undefined NodeType references with strongly-typed `FlowNodeType` enum in `ResourceFlowWorker.ts` and added missing import to reduce implicit any usage.

- [ ] Task 9: Logging Strategy Implementation:

  - [ ] Decide whether to extend `errorLoggingService` for `info`/`warn`/`debug` or adopt a different library/strategy.
  - [ ] Replace all remaining `console.error` calls with `errorLoggingService.logError`.
  - [ ] Ensure consistent logging context (service/module name, action) across the application.

- [ ] Task 10: D3 Refactoring & Typing:

  - [ ] Replace `any` types in `src/utils/performance/D3BatchedUpdates.ts` with proper types.
  - [ ] Replace `any` types in `src/types/visualizations/D3SelectionTypes.ts` with stricter interfaces.
  - [ ] Address `@ts-ignore` comments in D3-related files by implementing correct types or refactoring.
  - [ ] Fix `Font` / `FontFaceSet` issues in `src/types/declarations.d.ts`.

- [ ] Task 12: Event System Consolidation:

  - [ ] Analyze the different event buses/emitters (`moduleEventBus`, `systemCommunications`, potentially others).
  - [ ] Design a unified event bus strategy (e.g., using `EventPropagationService` more broadly or a dedicated global bus).
  - [x] Refactor code to use the chosen unified event system. -> _(Partially: ShipManagerImpl refactored)_
  - [x] Ensure consistent event type definitions (`EventType`, `ModuleEventType`) and address string literal usage (partially in `ResourceFlowDiagram.tsx`, `ResourceFlowSubsystem.ts`, `ShipHangar.tsx`).

- [ ] Task 13: Worker System Enhancement:

  - [x] Implement structured error reporting from workers (using `errorLoggingService` or similar) -> _Changed to use postMessage for consistency_.
  - [x] Add robust type checking/guards for `postMessage` data in `worker.ts` and `ResourceFlowManager.ts` -> _Input validation added in workers_.
  - [x] Implement retry mechanisms for failed worker operations in `ResourceFlowWorkerUtil.ts` (exponential backoff, 3 attempts).
    - [x] Implement task scheduling/prioritization and cancellation logic in `worker.ts`.  -> _Implemented new protocol & cancellation support_

- [ ] Task 14: Rule System Review:
  - [ ] Clarify the contradiction between Service Implementation Anti-Pattern Rule #4 (`getInstance` override) and #5 (direct export). Update rules if necessary.
  - [x] Review Resource Types Rule and Event Types Rule for violations (addressed in `ResourceFlowSubsystem.ts`, `ResourceFlowDiagram.tsx`, `ShipHangar.tsx`).

Task 15: Type System Standardization:

- [ ] Consolidate ResourceType definitions into a single source of truth
- [ ] Create migration utilities for string-to-enum type conversion
- [ ] Document type system best practices in a central location
- [ ] Create type guard utilities for runtime validation
- [ ] Add safe extraction utilities for working with potentially undefined objects
- [x] Replace all `any` types with proper type definitions or `unknown` -> _(Progress made, excluding deferred/blocked)_
- [ ] Implement proper error handling with typed error objects
      Task 16: Update Resource Type Usage:
- [ ] Update all components and code currently using string-based resource types to use the standardized `ResourceType` enum.

Task 17: Standardize Event Handling in Managers

- [ ] `Standardizing Event Handling`: Updating managers to use the TypedEventEmitter standard (Task 1.3).
- [ ] `Consolodating Managers`: Consolodate overlapping functions from managers and remove legacy files.
- [ ] `Improving Type Safety`: Replacing any types, adding type guards, fixing implicit any errors, and ensuring correct payload types in managers and related components (Task 1.4, Task 8).
- [ ] `Resource Type Standardization`: Migrating managers away from string-based resource types to use the ResourceType enum (Task 1.2).
- [ ] `Integrating Logging`: Replacing console statements with the structured logging service (Task 4, Task 9).
- [ ] `Worker Communication`: Improving type checking and error handling in managers interacting with workers like ResourceFlowManager.ts (Task 13).
- [ ] `Eliminate`any`Type Usage:`
- [ ] Replace `any` with specific types, `unknown`, or generics, prioritizing visualization components, chart renderers, UI components, and type utilities. -> _(Progress made)_
- [ ] Create/use proper interfaces for complex data structures currently typed as `any`. -> _(Partial progress)_
- [ ] Implement type guards where necessary for runtime validation

Task 18: Shared Types & Validation:

- [ ] Create/consolidate shared type definitions (e.g., for D3 selections, event handlers). -> _(ShipManagerEvents created)_
- [ ] Create/consolidate type guard utilities for runtime validation.
- [ ] Define or identify a standardized `EventEmitter` base class/interface (`TypedEventEmitter` confirmed standard for manager-specific events).
- [ ] Update all manager classes to implement/use this standard interface.
- [ ] Add any missing standard event methods to manager classes. -> _(Likely relates to foundational managers)_
- [ ] Update components and hooks to use the standardized event methods type-safe keys/payloads.

- [x] Task 19: GameManager Legacy API Compatibility
  - [x] Implement legacy wrapper methods (`dispatchEvent`, `subscribeToGameTime`, `addEventListener`) on `GameManager` to satisfy hook dependencies and eliminate TypeScript errors in `useGameState.ts`.

## CURRENT STATUS: 3,397 ESLint violations across 142 files

### ACTIVE CORRECTION PLAN - HIGH PRIORITY (Severity 8: 2,156 violations)

## Phase 1: Type Safety Critical (Target: 581 violations)

- [ ] **@typescript-eslint/no-unsafe-assignment** (197 violations)
  - [ ] AutomationVisualization.tsx, TypeSafeConfigDemo.tsx, ModuleManagerWrapper.ts
  - [ ] APIService.ts, DataProcessingService.ts, RealTimeDataService.ts
- [ ] **@typescript-eslint/no-unsafe-member-access** (157 violations)
  - [ ] ChainVisualization.tsx, FlowDiagram.tsx, Tooltip.tsx
- [ ] **@typescript-eslint/no-unsafe-argument** (131 violations)
- [ ] **@typescript-eslint/no-unsafe-return** (96 violations)

## Phase 2: Async/Promise Safety (Target: 89 violations)

- [ ] **@typescript-eslint/no-floating-promises** (89 violations)
  - [ ] AutomationManager.ts, eventSystemInit.ts, techTreeManager.ts
  - [ ] useResourceManagement.tsx, useStreamedData.ts, useTypedApi.ts

## Phase 3: Enum Safety (Target: 238 violations)

- [ ] **@typescript-eslint/no-unsafe-enum-comparison** (238 violations)
  - [ ] ColonyManagerImpl.ts, CombatMechanicsSystem.ts, CanvasRenderer.tsx
  - [ ] ResourceRegistryIntegration.ts, EventFiltering.ts

## Phase 4: Template Safety (Target: 67 violations)

- [ ] **@typescript-eslint/restrict-template-expressions** (67 violations)
  - [ ] ModuleHUD.tsx, SubModuleHUD.tsx, useModuleUpgrade.ts
  - [ ] AutomationManager.ts, ModuleAttachmentManager.ts

## Phase 5: Null/Undefined Safety (Target: 118 violations)

- [ ] **@typescript-eslint/prefer-nullish-coalescing** (118 violations)
  - [ ] ResourceRatesDisplay.tsx, FlowDiagram.tsx, APIService.ts

## Phase 6: Function Implementation (Target: 47 violations)

- [ ] **@typescript-eslint/no-empty-function** (47 violations)
  - [ ] AutomationVisualization.tsx, VPRStarSystemView.tsx, ShieldEffect.tsx

---

## MEDIUM PRIORITY (Severity 4: 1,241 violations)

### Phase 7: Development Cleanup

- [ ] **no-console** (625+ violations) - Replace with logger calls
- [ ] **@typescript-eslint/no-unused-vars** (200+ violations) - Clean or prefix with \_

---

## EXECUTION STRATEGY

### Current Focus: **Phase 1 - Type Safety Critical**

1. **Target Files per Session**: 3-5 files with highest violation density
2. **Verification**: ESLint check after each file correction
3. **Documentation**: Update progress in CODEBASE_ARCHIVE.md

### Priority File List (Starting with highest violation counts):

1. **AutomationVisualization.tsx** (6 violations)
2. **TypeSafeConfigDemo.tsx** (12 violations)
3. **ModuleManagerWrapper.ts** (19 violations)
4. **APIService.ts** (13 violations)
5. **RealTimeDataService.ts** (8 violations)

### Exit Criteria:

- **Phase 1 Complete**: All type safety violations resolved
- **Build Success**: `pnpm tsc --noEmit` passes
- **Test Verification**: Core functionality maintained

---

### CURRENT TARGET: APIService.ts (13 violations)

### NEXT PRIORITY TARGETS:

- [ ] RealTimeDataService.ts (8 violations)

---

## Quick Commands for Current Phase

```bash
# Check specific rule violations
eslint src/ --rule '@typescript-eslint/no-unsafe-assignment: error'

# Fix specific file
eslint src/components/ui/automation/AutomationVisualization.tsx --fix

# Verify after corrections
pnpm tsc --noEmit
```

---

## ESLINT TASKLIST

## HIGH (PRIORITY 1)

- [ ] **Type-safety violations (`any`, unsafe ops)**
  - [ ] `@typescript-eslint/no-unsafe-assignment`, `no-unsafe-argument`, `no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-return`
- [ ] **Missing `await` / promise misuse**
  - [ ] `@typescript-eslint/require-await`
  - [ ] `@typescript-eslint/no-floating-promises`
  - [ ] `@typescript-eslint/no-misused-promises`
  - [ ] `@typescript-eslint/await-thenable`
- [ ] **Improper null / undefined guarding**
  - [ ] `@typescript-eslint/prefer-nullish-coalescing` (`??`, `??=`, `??:`)
  - [ ] `@typescript-eslint/prefer-optional-chain`
- [ ] **Template-string safety**
  - [ ] `@typescript-eslint/restrict-template-expressions`
  - [ ] `@typescript-eslint/no-base-to-string`
- [ ] **Unsafe enum / switch logic**
  - [ ] `@typescript-eslint/no-unsafe-enum-comparison`

---

## MEDIUM (PRIORITY 2)

- [ ] **Error-handling correctness**
  - [ ] `@typescript-eslint/prefer-promise-reject-errors`
  - [ ] `@typescript-eslint/no-unsafe-optional-chaining`
- [ ] **API / semantic soundness**
  - [ ] `@typescript-eslint/unbound-method`
  - [ ] `@typescript-eslint/no-redundant-type-constituents`
  - [ ] `@typescript-eslint/no-empty-object-type`
  - [ ] `@typescript-eslint/no-explicit-any`
- [ ] **Code style that aids maintainability**
  - [ ] `prefer-const`
  - [ ] `no-unsafe-enum-comparison` (non-switch contexts)
  - [ ] `@typescript-eslint/consistent-indexed-object-style`

---

## LOW (PRIORITY 3)

- [ ] **Noise removal**
  - [ ] `no-console` (swap to logger or conditional compile)
  - [ ] `@typescript-eslint/no-unused-vars`
  - [ ] `_` / `_e` placeholders — either prefix with `_` or delete
- [ ] **Readability niceties**
  - [ ] `@typescript-eslint/no-unsafe-enum-comparison` (when purely stylistic)
  - [ ] `@typescript-eslint/no-unused-vars` in test fixtures & storybook files
- [ ] **Misc. tidy-ups**
  - [ ] Broken interface extensions (`no-empty-object-type`)
  - [ ] Record-vs-index-signature (`consistent-indexed-object-style`)
  - [ ] Any remaining redundant JSX/string interpolation quirks

---

## How to use this list

1. **Pick one rule at a time.**  
   Run `eslint . --rule '<ruleId>: error' --fix` or use Cursor's multi-file quick-fix.
2. **Commit after each rule.** Smaller diffs, easier rollbacks.
3. **Check off items above** (⌘-space in Markdown preview toggles checkboxes).
4. When HIGH is clear, re-run the full lint task; promote any leftover MEDIUM issues if they block CI.

---

### Quick commands

```bash
# All HIGH rules at once (adjust as you clear issues)
eslint . --fix \
  --rule '@typescript-eslint/no-unsafe-assignment: error' \
  --rule '@typescript-eslint/require-await: error' \
  --rule '@typescript-eslint/prefer-nullish-coalescing: error' \
  --rule '@typescript-eslint/no-floating-promises: error' \
  --rule '@typescript-eslint/restrict-template-expressions: error'
```

---

### ⏱ Priority 0 – Build-Blocking (Severity 8)

P0-1 – TS2769: "No overload matches this call" (MUI Grid / Typography)
• Where:
DataAnalysisSystem.tsx (lines 677–828)
CanvasLineChart.tsx (line 950)
• Fix:
Add the required component prop to every Grid or Typography element.
If needed, cast the element with as const.
Also, confirm your @mui/material version matches its typings.

P0-2 – TS2322 / TS2345: Type mismatch or undefined passed where not allowed
• Where:
BattleEnvironment.tsx (line 433)
HeatMap.tsx (lines 146 / 168 / 192)
HarbringerGalleon.tsx (lines 113 / 116)
ShipHangarManager.ts (lines 1245 / 1680)
…and similar locations
• Fix:
• Audit and refactor union types (e.g., string | Position) into discriminated unions
• Guard against undefined
• Narrow generics before passing to APIs

P0-3 – Missing exports / Wrong imports
• Where:
• main.tsx (check file extensions)
• ErrorTypes.ts (line 27) – duplicate enum
• darkTheme.ts – alpha, createTheme issues
• DataCollectionService.ts – unexported members
• tsconfig.json – invalid option like allowImportingTsExtensions
• Fix:
• Fix import paths (./App.tsx → ./App)
• De-duplicate enum values
• Upgrade or pin @mui/material
• Remove unsupported tsconfig options

P0-4 – Implicit any / Unsafe any / Unsafe member access
• Where:
• CombatShipManager.ts
• DataPointVirtualList.tsx
• VisualizationInspector.tsx
• Additional files flagged by ESLint
• Fix:
• Replace any with real interfaces
• Use optional chaining (?.)
• Assert known types with as Type

P0-5 – Jest typings missing (TS2708 / TS2694)
• Where:
• ModuleContext.test.tsx
• Fix:
• Install test typings: npm i -D @types/jest or use vitest types if applicable
• Add "types": ["jest"] to your tsconfig.json

P0-6 – Global script error (--isolatedModules, TS1208)
• Where:
• calculations.ts
• Fix:
• Add export {} to mark it as a module
• Or move helpers into an existing module

### Exit Criterion:

Run this to confirm all issues are resolved:

pnpm tsc --noEmit

Success = zero errors returned

---

### 🔧 Priority 1 – Warnings & Clean-Up (Severity 4)

- **Unused variables / values**

  - `customFleetAIResult`, `points`, `rangeCircles` (`BattleEnvironment.tsx`)
  - Dozens more in tests & mining managers.
    _Action:_ remove or prefix with `_` if intentional side effect.

- **Unexpected console statements** (`no-console`) – 25+ hits in mining, renderers, etc.
  _Action:_ wrap in a logger or remove.

- **Sourcery suggestions** (assignment operator, object destructuring, unreachable code, merge nested ifs).
  _Action:_ auto-apply Sourcery quick-fix or replicate manually.

- **Prefer optional chaining** (`ResourceDiscoverySystem.tsx 232`).
  _Action:_ replace `&&` chains with `?.`.

- **Consistent generic constructors & array-type** in `ModuleAttachmentManager.ts` and `WebGLRenderer.tsx`.
  _Action:_ change `new Map<string, number>()` → `new Map<string, number>()` and replace `Array<T>` with `T[]`.

> **Exit criterion:** `eslint . --max-warnings 0` passes.

---

### 📝 Priority 2 – Informational / Style (Severity ≤ 2)

- **Prefer `interface` over `type`, record over index signature** (`EventTypes.ts` 430 – 572).
- **Binding element implicitly has `any`** – theme, width, etc.
- **Sourcery style comments** – avoid function declarations inside blocks, prefer `const`, etc.

> **Exit criterion:** codebase lint score clean; no Sourcery suggestions left.

---

### **Recommended Attack Order for Cursor Agent**

1. **Run `pnpm update`** – bring `@mui/material`, `@types/react`, `typescript-eslint`, and Jest/Vitest types into sync.
2. **Apply P0 fixes module-by-module** (table above). Commit after each module compiles.
3. **Enable `eslint --fix` & Sourcery auto-apply**; sweep P1 warnings.
4. **Refactor style issues (P2).**
5. **Lock in with CI:** add `tsc --noEmit` and `eslint --max-warnings 0` to pre-push hook.

---

**Remaining MUI Grid/Typography Issues:**

- PIXI.js library compatibility (combat ships) - Low priority
- MUI overload errors (VirtualizedEventLog) - Can be fixed with same approach
- Minor typing issues - Can be addressed as needed

🔄 `src/components/exploration/DataAnalysisSystem.tsx` - Need to complete remaining Grid components
❌ Other files with similar MUI overload errors

- [ ] P1-1 IMPLEMENT all unused vars, values & Placeholders. DO NOT DELETE UNLESS ABSOLUTELY NECESSARY.
- [ ] P1-2 Replace console.\* with logger
- [ ] P1-3 Auto-apply Sourcery structural fixes
- [ ] P1-4 Add optional chaining where flagged
- [ ] P1-5 Fix generic-constructor / array-type style issues

- [ ] P2-1 Convert index signatures to Record / interfaces
- [ ] P2-2 Eliminate remaining implicit any bindings
- [ ] P2-3 Clear remaining Sourcery style comments

- [ ] **MEDIUM PRIORITY**: Fix remaining ESLint violations in EventTypes.ts
  - [ ] Convert index signatures to Record types (lines 430, 480)
  - [ ] Convert type to interface (line 572)
  - [ ] Remove unused type parameter (line 439)
  - [ ] Remove unused eslint-disable directive (line 551)

_Finish P0 before touching P1; do not promote code until `tsc` is green._

---

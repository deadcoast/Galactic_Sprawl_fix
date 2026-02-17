# One Voice Cleanup Pass

## Mission
Create a single architectural direction for the codebase by removing duplicate module surfaces, collapsing legacy paths, and standardizing how domains expose behavior.

This cleanup pass is designed for a large repo and is intentionally staged. The priority is to stop new divergence first, then converge high-risk subsystems in controlled batches.

## Baseline (Generated 2026-02-16)
Source: `reports/one-voice/codebase-audit.json`

- Runtime source files: 796
- Duplicate basenames: 33
- Large files (>= 1200 lines): 17
- Files with TODO/deprecated/stub markers: 116 (391 markers)
- Circular dependency groups: 9
- Reachable from runtime entrypoints: 185 / 796
- Disconnected from runtime entrypoints: 612
- Missing tool script targets in `package.json`: 14

This confirms a split architecture with multiple parallel implementations and a large disconnected surface.

## Seam Map
### 1) UI Surface Duplication
Evidence:
- `src/components/ui/*` and `src/ui/components/*` coexist.
- Duplicate component basenames: `Badge.tsx`, `Button.tsx`, `Divider.tsx`, `Icon.tsx`, `Tooltip.tsx`.

Risk:
- Engineers can import visually similar components with different behavior.
- Design and accessibility fixes do not propagate consistently.

Direction:
- Canonical UI surface: `src/ui/components/*`.
- `src/components/ui/*` remains compatibility-only until removed.

### 2) Registry Fragmentation
Evidence:
- Three registries with overlapping intent:
  - `src/lib/managers/ServiceRegistry.ts`
  - `src/lib/registry/ServiceRegistry.ts`
  - `src/lib/services/ServiceRegistry.ts`

Risk:
- Inconsistent lifecycle sequencing and singleton behavior.

Direction:
- Canonical registry: `src/lib/registry/ServiceRegistry.ts`.
- Other registry files become explicit adapters or get retired.

### 3) Event System Split
Evidence:
- Both `src/lib/modules/ModuleEvents.ts` and `src/lib/events/ModuleEventBus.ts` are used.
- Circular groups include event/core manager dependencies.

Risk:
- Event payload shape drift and unpredictable subscription semantics.

Direction:
- Canonical event runtime: `src/lib/events/UnifiedEventSystem.ts`.
- Module event APIs become typed wrappers over this single runtime.

### 4) Resource Domain Dual Stack
Evidence:
- Legacy `src/managers/game/ResourceManager.ts` coexists with newer resource domain:
  - `src/managers/resource/*`
  - `src/resource/subsystems/*`
  - `src/resource/ResourceSystem.ts`

Risk:
- Duplicate source of truth for balances, thresholds, and flow updates.

Direction:
- Canonical domain home: `src/managers/resource/*` + `src/resource/ResourceSystem.ts` as orchestration.
- Legacy manager becomes adapter-only and is gradually phased out.

### 5) Dead/Disconnected Surface Area
Evidence:
- 612 files disconnected from runtime entrypoints in audit.
- Largest disconnected group is under `components/` (272 files).

Risk:
- Refactors and upgrades touch files that are not runtime-relevant.
- Hidden regressions and dead maintenance cost.

Direction:
- Introduce explicit lifecycle states for disconnected files:
  - `active`
  - `candidate`
  - `archive`

### 6) Tooling Integrity Drift
Evidence:
- 14 npm scripts reference missing `tools/*` files.

Risk:
- Operational confusion and broken developer workflows.

Direction:
- Restore or remove broken script targets; no dangling scripts allowed.

## Canonical Module Pattern (One Voice Contract)
All new/rewritten domains must follow this structure:

```text
src/modules/<domain>/
  index.ts            # only public exports
  types.ts            # public contracts only
  contracts.ts        # ports/interfaces for adapters
  manager.ts          # orchestration and lifecycle
  service.ts          # pure domain/service logic
  hooks.ts            # React integration boundary
  ui/                 # domain-specific presentation
  adapters/           # compatibility shims to legacy APIs
  __tests__/          # module-local tests
```

Rules:
- Import from `index.ts` for cross-domain usage.
- No deep imports into another domain internals.
- Side-effectful initialization stays in module manager or app initialization layer.
- Adapters are temporary and must be documented with removal targets.

## Staged Refactor Plan
## Phase 0: Freeze Divergence (Started)
Deliverables:
- Add audit automation: `scripts/one-voice-audit.mjs`.
- Add report outputs:
  - `reports/one-voice/codebase-audit.json`
  - `reports/one-voice/codebase-audit.md`
- Add script: `npm run audit:one-voice`.
- Add lint guardrails for known legacy import paths.

Exit criteria:
- New duplicate path usage is blocked in lint.
- Baseline metrics are reproducible from a single command.

## Phase 1: Converge Import Surfaces
Deliverables:
- Enforce canonical import paths for:
  - logging (`services/logging/ErrorLoggingService`)
  - resource type conversion (`utils/resources/ResourceTypeConverter`)
  - button surface (`ui/components/Button`)
- Build a migration map for major duplicate basenames.

Exit criteria:
- No runtime code imports deprecated wrappers.
- Compatibility wrappers are tracked and explicitly marked.

## Phase 2: Event Runtime Unification
Deliverables:
- Pick one event runtime and migrate callers in batches.
- Replace direct bus dual-usage with typed adapters.
- Remove circular references caused by event-manager coupling.

Exit criteria:
- Module events route through one runtime.
- Circular dependency count reduced for event-related SCCs.

## Phase 3: Resource System Consolidation
Deliverables:
- Define single source of truth for resource state mutations.
- Restrict legacy `ResourceManager` to adapter role.
- Port threshold/flow orchestration into unified resource domain.

Exit criteria:
- No dual-write state paths for resource updates.
- Resource integration tests validate one canonical path.

## Phase 4: UI Surface Consolidation
Deliverables:
- Migrate live routes/pages to canonical UI surface.
- Move legacy `components/ui/*` exports behind adapters only.
- Remove duplicate error boundary implementations in favor of one stack.

Exit criteria:
- Active routes import from `src/ui/components/*`.
- One error boundary framework is used in app shell.

## Phase 5: Dead Code and Tooling Cleanup
Deliverables:
- Classify disconnected files into `active/candidate/archive`.
- Restore missing `tools/*` scripts or remove references.
- Archive or delete confirmed dead code after verification.

Exit criteria:
- Disconnected file count reduced with decision logs.
- `package.json` has no broken script targets.

## Execution Governance
- Run `npm run audit:one-voice` before each cleanup batch.
- Update `reports/one-voice/codebase-audit.*` after each batch.
- Track before/after deltas for:
  - disconnected files
  - duplicate basenames
  - circular groups
  - marker hotspots

## Stage 1 Changes Applied In This Pass
- Added one-command architecture audit:
  - `scripts/one-voice-audit.mjs`
  - `npm run audit:one-voice`
- Generated baseline reports:
  - `reports/one-voice/codebase-audit.json`
  - `reports/one-voice/codebase-audit.md`
- Reduced wrapper-path drift by moving imports to canonical paths in:
  - `src/services/AnalysisAlgorithmService.ts`
  - `src/hooks/resources/useResourceManagement.tsx`
  - `src/utils/typeGuards/resourceTypeGuards.ts`
  - `src/utils/ResourceTypeMigration.ts`
- Added lint restrictions to block key legacy import surfaces in `eslint.config.js`.

## Next Batches (Recommended Order)
1. Resolve missing `tools/*` scripts (restore or remove).
2. Create explicit adapter registry for duplicate ServiceRegistry implementations.
3. Collapse event bus dual usage into one runtime contract.
4. Reduce top marker hotspots:
   - `src/managers/resource/ResourceFlowManager.ts`
   - `src/services/AnalysisAlgorithmService.ts`
   - `src/systems/exploration/DiscoveryClassification.ts`

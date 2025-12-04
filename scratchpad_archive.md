
- [x] HIGH PRIORITY
  - [x] Resolve type-safety & enum issues in `useResourceSystemIntegration.ts`
    - [x] Confirm `ErrorType` enum contains `UI`; added `UI`, `USER_INTERFACE`, and `UI_WARNING` aliases in `ErrorTypes.ts`
    - [x] Refactor unsafe argument casts (lines 67, 91, 175, 212, 265, 296, 318)
    - [x] Remove unused variables (`e`, `enableLogging`, `resourceFlowManager`, etc.)
  - [x] Correct event/enum mismatches in `gameSystemsIntegration.ts`
    - [x] Replace `EventType.TECH_NODE_UNLOCKED` with `TECH_UNLOCKED` or add constant
    - [x] Fix missing `isTechTreeNodeUnlockedEvent` export & `updateNodeStatus` method
    - [x] Address all `payload` unknown-type occurrences
  - [x] Add `capacity` data to `ResourceState` usages — changed `ResourceState.capacity` to optional and fixed constructor initialization in `ResourceTypes.ts`
  - [x] Remove `unknown` overshadow in union (line 87) of `useSessionPerformance.ts`
  - [x] Harden `useChartCoordination.ts` against unsafe assignments/calls & protected

- [x] MEDIUM PRIORITY
  - [x] Fix `no-base-to-string` violation in `useFactionBehavior.ts` (line 1857)
  - [x] Replace `Array<T>` with `T[]` in `useResourceTracking.ts`

- [x] LOW PRIORITY
  - [x] Clean up redundant/unused vars across listed files
  - [x] Remove `console` statements flagged by linter
  - [x] Apply nullish coalescing (`??`) where suggested (`useResourceTracking.ts`)
  - [x] Apply nullish coalescing and type-safe parsing in `useResourceTracking.ts`
  - [x] Replace `Array<T>` with `T[]` in `useResourceTracking.ts`

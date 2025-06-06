## Task 19: Fix TypeScript and ESLint Errors

### Type Mismatches and Missing Properties
- [ ] Fix ShipFactory.ts formation and combatStats type assignments (lines 281, 284)
- [ ] Fix WebGLShaderManager.ts 'dracombatrays' property (line 230) - likely typo for 'drawArrays'
- [ ] Add missing 'clearAllListeners' method to ModuleAttachmentManager, ModuleStatusManager, ModuleUpgradeManager
- [ ] Fix ShipHangarManager.ts PlayerShipCategory to ShipCategory type mismatch (lines 811, 2466)
- [ ] Fix ResourceFlowManager.ts possibly undefined 'capacity' (line 2559)

### Unsafe Type Assignments
- [ ] Fix CombatShipManager.ts unsafe assignments (lines 165, 177, 184, 312, 324)
- [ ] Fix worker.ts unsafe assignments and member access (lines 121, 129, 139, 154, 155, 162)
- [ ] Fix test files 'unknown' type issues in ErrorBoundary.test.tsx and performance tests

### Method Signature Mismatches
- [ ] Fix ExplorationManager.ts event handler parameter mismatch (line 168)
- [ ] Fix ExplorationManager.ts onInitialize/onDispose return type (should return Promise<void>)
- [ ] Fix ResourceManager.ts missing abstract member 'onUpdate' implementation
- [ ] Fix ResourceManager.ts syntax errors and malformed method (lines 295-319)
- [ ] Fix WeaponUpgradeManager.ts subscribe method return type mismatch

### Missing Exports and Imports
- [ ] Export EXPLORATION_EVENTS from ExplorationManager.ts or update DataCollectionService.ts
- [ ] Create missing '../events/SharedEventTypes' module or update imports
- [ ] Export isValidStringType from ResourceTypeConverter.ts

### Property Name Corrections
- [ ] Fix 'logwarn' to 'logWarn' in EventPropagationService.ts and DataProcessingService.ts
- [ ] Fix 'capabilities' to 'abilities' in MiningShipManager.ts (line 326)

### Console Statement Replacements
- [ ] Replace console statements with errorLoggingService in:
  - [ ] CombatShipManager.ts (line 341)
  - [ ] worker.ts (lines 113, 159, 169)

### Type System Fixes
- [ ] Fix EventTypes.ts generic TypedEvent usage (lines 373, 391, 445, 449, 464)
- [ ] Fix ThemeTypes.ts type assignment issues (lines 351)
- [ ] Add ErrorType.WORKER enum value or use correct error type

### Numeric Operation Type Fixes
- [ ] Fix MiningResourceIntegration.ts numeric operations on '{}' type (lines 387, 390)
- [ ] Fix MiningShipManager.ts arithmetic operations (lines 194, 196, 223)

### Test Fixes
- [ ] Fix expect.unknown() calls in ErrorBoundary.test.tsx
- [ ] Fix LongSessionMemoryTestSuite.ts unknown type and missing property issues
- [ ] Fix MultitabPerformanceTestSuite.ts unknown object issues

### Code Quality
- [ ] Merge nested if conditions in CombatShipManager.ts (line 129) as suggested by Sourcery
- [ ] Fix enhancedComponentProfiler.ts unknown type issue (line 641)
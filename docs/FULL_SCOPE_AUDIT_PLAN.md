# Galactic Sprawl - Full Scope Codebase Audit & Integration Plan

## Overview
This document outlines the complete audit and integration scope for the Galactic Sprawl codebase. We have completed **Phase 1 (Manager Integration)** which represents approximately **5-10% of the total work needed**. This plan maps out the remaining 90-95% of audit and integration work.

---

## ✅ What We've Accomplished (Phase 1 Complete)

### Manager System Integration
**Scope**: 1 of 9 major systems audited and integrated
**Progress**: 35% of managers connected (18/52)
**Components**: 3% integrated (9/297)

#### Deliverables
1. ✅ **Manager Registry Expansion**: 14 → 18 managers (+29%)
2. ✅ **Manager Access Hooks**: 18 hooks created for React components
3. ✅ **Mining Subsystem Integration**: Proof-of-concept completed
4. ✅ **Pattern Established**: Reusable template for future integrations
5. ✅ **Documentation**: Integration guides and completion reports

#### Files Created/Modified
- Created: `src/hooks/managers/useManagers.ts`, `src/hooks/managers/index.ts`
- Modified: `ManagerRegistry.ts`, `MiningWindow.tsx`
- Docs: 2 integration guides
- **Total**: ~550 lines added, 0 lines deleted

#### Key Achievements
- ✅ Zero code deletion (100% preservation)
- ✅ Zero breaking changes
- ✅ Type-safe integration throughout
- ✅ Backward compatible with fallbacks

---

## 🎯 What Still Needs to Be Done

### Critical Understanding
**We have only addressed 1 of 9 major system categories.**

The codebase has 9 interconnected systems that ALL need the same level of audit and integration:
1. ✅ **Managers** (35% done) ← Phase 1 Complete
2. ❌ **Types** (75% disconnected)
3. ❌ **Events** (90% not integrated)
4. ❌ **Components** (97% not using managers)
5. ❌ **Factories** (100% not in registry)
6. ❌ **Context API** (parallel architecture, not connected)
7. ❌ **Utilities** (scattered, no central registry)
8. ❌ **Services** (external APIs, not standardized)
9. ❌ **State Management** (Redux/Context mix, needs unification)

---

## 📋 Full Scope Audit Plan

### Phase 1: Manager Integration ✅ COMPLETE
**Status**: 35% Complete (18/52 managers)
**Remaining**: 34 managers to integrate

#### Remaining Manager Work
**Critical Managers Not Yet Integrated** (Priority Order):

1. **Colony System** (8 managers):
   - ColonyManagerImpl
   - PopulationManager
   - HabitableWorldManager
   - BiodomeManager
   - TradeRouteManager
   - ColonyProductionManager
   - ColonyExpansionManager
   - ColonySatisfactionManager

2. **Ship System** (4 managers):
   - CombatShipManager (renamed from WarShipManager)
   - TransportShipManager
   - ShipyardManager
   - FleetManager

3. **Production System** (3 managers):
   - ProductionManager
   - ProductionChainManager
   - ProductionQueueManager

4. **Game Core** (3 managers):
   - GameLoopManager
   - GameStateManager
   - SaveManager

5. **Exploration System** (2 managers):
   - SectorManager
   - ScanningManager

6. **Effects & Visuals** (2 managers):
   - ParticleSystemManager (duplicate exists in game/ and effects/)
   - VisualEffectsManager

7. **UI Management** (2 managers):
   - NotificationManager
   - TooltipManager

8. **Progression** (2 managers):
   - ProgressionManager
   - AchievementManager

9. **Diplomacy** (2 managers):
   - DiplomacyManager
   - FactionRelationManager

10. **Research** (1 manager):
    - ResearchManager (separate from TechTreeManager)

11. **Trade** (1 manager):
    - MarketManager

12. **Automation** (1 manager):
    - AutomationRuleManager

13. **Tutorial** (1 manager):
    - TutorialManager

14. **Performance** (2 managers):
    - PerformanceMonitor
    - MemoryManager

**Estimated Work**: 34 managers × 2 hours each = **68 hours**

---

### Phase 2: Type System Unification ❌ NOT STARTED
**Current Status**: 80 type files, 55+ enums, ~7.5/10 type safety
**Problem**: String literals used instead of enums, duplicate types, missing type guards

#### Audit Scope

**2.1: Type Inventory & Analysis** (Est. 20 hours)
- [ ] Catalog all type files (80 files)
- [ ] Map enum usage vs string literals
- [ ] Identify duplicate type definitions
- [ ] Find missing type guards
- [ ] Analyze type relationships and dependencies
- [ ] Document type conversion needs

**Deliverable**: `PHASE_2_1_TYPE_INVENTORY.md`

**2.2: Enum Consolidation** (Est. 40 hours)
- [ ] Convert string literals to enums (15+ files identified)
  - [ ] AutomationRuleEditor.tsx
  - [ ] BattleEnvironment.tsx
  - [ ] DragAndDrop.tsx
  - [ ] ModuleType (currently string union, needs enum)
  - [ ] FlowNodeType (duplicate in 2 files)
- [ ] Create missing enums for common patterns
- [ ] Add type guards for all enums
- [ ] Update all components using string literals

**Deliverable**: `PHASE_2_2_ENUM_UNIFICATION.md`

**2.3: Type Guard Implementation** (Est. 30 hours)
- [ ] Create type guards for all major types
- [ ] Replace `as` assertions with type guards
- [ ] Document type guard patterns
- [ ] Create type guard utilities

**Key Files**:
- `src/types/resources/ResourceTypes.ts` (20 ResourceType values)
- `src/types/events/EventTypes.ts` (120+ EventType values)
- `src/types/buildings/ModuleTypes.ts` (needs enum conversion)
- `src/types/ships/UnifiedShipTypes.ts`
- `src/types/mining/MiningTypes.ts`

**Critical Issues**:
```typescript
// WRONG (string literal)
type: 'mineral' | ResourceType.GAS | ResourceType.EXOTIC

// RIGHT (enum only)
type: ResourceType.IRON | ResourceType.GAS | ResourceType.EXOTIC

// WRONG (ModuleType as string union)
export type ModuleType = 'colony_core' | 'mining_hub' | ...

// RIGHT (ModuleType as enum)
export enum ModuleType {
  COLONY_CORE = 'COLONY_CORE',
  MINING_HUB = 'MINING_HUB',
  ...
}
```

**Estimated Work**: **90 hours**

---

### Phase 3: Event System Integration ❌ NOT STARTED
**Current Status**: EventType enum has 120+ values, but only ~10% components subscribe
**Problem**: Events defined but not used, no event bus integration in most components

#### Audit Scope

**3.1: Event Usage Audit** (Est. 15 hours)
- [ ] Map all EventType enum values (120+)
- [ ] Find all moduleEventBus.emit() calls
- [ ] Find all moduleEventBus.subscribe() calls
- [ ] Identify events never emitted
- [ ] Identify events never subscribed
- [ ] Document event flow patterns

**Deliverable**: `PHASE_3_1_EVENT_AUDIT.md`

**3.2: Event Integration** (Est. 60 hours)
- [ ] Connect components to event bus
- [ ] Replace polling with event subscriptions
- [ ] Add missing event emissions
- [ ] Remove unused events
- [ ] Document event communication patterns
- [ ] Create event hook utilities

**Example Pattern**:
```typescript
// BEFORE (polling)
useEffect(() => {
  const interval = setInterval(() => {
    const data = manager.getData();
    setState(data);
  }, 1000);
  return () => clearInterval(interval);
}, []);

// AFTER (event-driven)
useEffect(() => {
  const unsubscribe = moduleEventBus.subscribe(
    EventType.DATA_UPDATED,
    (event) => setState(event.data)
  );
  return unsubscribe;
}, []);
```

**Key Areas**:
- Mining events (12 event types)
- Combat events (20+ event types)
- Resource events (15+ event types)
- Module events (25+ event types)
- Exploration events (10+ event types)

**Estimated Work**: **75 hours**

---

### Phase 4: Component-Manager Integration ❌ NOT STARTED
**Current Status**: 9/297 components use managers (3%)
**Problem**: 97% of components bypass manager layer, use Context API directly

#### Audit Scope

**4.1: Component Dependency Mapping** (Est. 25 hours)
- [ ] Analyze all 297 components
- [ ] Map component → manager relationships
- [ ] Identify Context API usage vs manager usage
- [ ] Document data flow for each subsystem
- [ ] Prioritize components for integration

**Deliverable**: `PHASE_4_1_COMPONENT_DEPENDENCY_MAP.md`

**4.2: Subsystem Integration** (Est. 200 hours)

**Buildings Subsystem** (~60 components):
- [ ] Colony components (15 files) → ColonyManager
- [ ] Module components (45 files) → ModuleStatusManager, various managers

**Combat Subsystem** (~25 components):
- [ ] Combat UI (8 files) → CombatManager
- [ ] Ship combat (12 files) → CombatShipManager
- [ ] Tactical (5 files) → ThreatAssessmentManager

**Exploration Subsystem** (~40 components):
- [ ] ExplorationHub (7 files) → ExplorationManager ✅ (manager ready)
- [ ] Star maps (15 files) → SectorManager
- [ ] Scanning (8 files) → ScanningManager
- [ ] Discovery (10 files) → ExplorationManager

**Mining Subsystem** (~13 components):
- [x] MiningWindow → MiningShipManager ✅ DONE
- [ ] MiningControls → MiningShipManager
- [ ] ResourceNode → ResourceManager
- [ ] MiningMap → AsteroidFieldManager
- [ ] 9 other components

**Ship Subsystem** (~40 components):
- [ ] Ship management (15 files) → ShipyardManager
- [ ] Ship display (10 files) → FleetManager
- [ ] Ship status (8 files) → various ship managers
- [ ] Ship upgrades (7 files) → ShipyardManager

**UI Subsystem** (~113 components):
- [ ] Resource displays (20 files) → ResourceManager
- [ ] Tech tree (15 files) → TechTreeManager
- [ ] Notifications (10 files) → NotificationManager
- [ ] Menus (30 files) → various managers
- [ ] HUD (20 files) → various managers
- [ ] Dialogs (18 files) → various managers

**Tutorial Subsystem** (~6 components):
- [ ] Tutorial components → TutorialManager

**Estimated Work**: **225 hours**

---

### Phase 5: Factory Pattern Integration ❌ NOT STARTED
**Current Status**: Factories exist but not in central registry
**Problem**: Factory usage scattered, no standardized access pattern

#### Audit Scope

**5.1: Factory Inventory** (Est. 10 hours)
- [ ] Catalog all factory files
- [ ] Map factory → manager relationships
- [ ] Identify factory usage patterns
- [ ] Find duplicate factory logic

**Deliverable**: `PHASE_5_1_FACTORY_INVENTORY.md`

**5.2: Factory Registry Creation** (Est. 30 hours)
- [ ] Create FactoryRegistry.ts
- [ ] Register all factories
- [ ] Create factory access hooks
- [ ] Update components to use registry

**Key Factories**:
- ShipFactory ✅ (exists, used by managers)
- BuildingFactory
- ModuleFactory
- ResourceFactory
- EffectFactory
- ParticleFactory

**Estimated Work**: **40 hours**

---

### Phase 6: Context API Integration ❌ NOT STARTED
**Current Status**: Parallel architecture - Context API vs Manager layer
**Problem**: Two state management systems not communicating

#### Audit Scope

**6.1: Context API Audit** (Est. 15 hours)
- [ ] Map all Context providers
- [ ] Identify Context → Manager integration points
- [ ] Document data flow conflicts
- [ ] Plan unification strategy

**Deliverable**: `PHASE_6_1_CONTEXT_AUDIT.md`

**6.2: Context-Manager Bridge** (Est. 50 hours)
- [ ] Connect Context providers to managers
- [ ] Sync Context state with manager state
- [ ] Migrate Context-only logic to managers
- [ ] Document integration patterns

**Key Contexts**:
- GameStateContext
- ResourceContext
- CombatContext
- ExplorationContext
- ShipContext
- ModuleContext
- TechContext

**Estimated Work**: **65 hours**

---

### Phase 7: Utility System Organization ❌ NOT STARTED
**Current Status**: Utilities scattered across codebase
**Problem**: No central registry, duplicate utilities, inconsistent patterns

#### Audit Scope

**7.1: Utility Inventory** (Est. 10 hours)
- [ ] Catalog all utility files
- [ ] Identify duplicate utilities
- [ ] Map utility dependencies
- [ ] Document utility patterns

**Deliverable**: `PHASE_7_1_UTILITY_INVENTORY.md`

**7.2: Utility Consolidation** (Est. 40 hours)
- [ ] Remove duplicate utilities
- [ ] Create utility index files
- [ ] Standardize utility patterns
- [ ] Document utility usage

**Key Utility Areas**:
- Math utilities
- String utilities
- Array utilities
- Object utilities
- Validation utilities
- Conversion utilities
- Format utilities

**Estimated Work**: **50 hours**

---

### Phase 8: Service Layer Standardization ❌ NOT STARTED
**Current Status**: External API calls not standardized
**Problem**: Inconsistent service patterns, no error handling strategy

#### Audit Scope

**8.1: Service Audit** (Est. 8 hours)
- [ ] Catalog all service files
- [ ] Map API endpoints
- [ ] Document service patterns
- [ ] Identify error handling

**Deliverable**: `PHASE_8_1_SERVICE_AUDIT.md`

**8.2: Service Standardization** (Est. 25 hours)
- [ ] Create service base class
- [ ] Standardize error handling
- [ ] Add retry logic
- [ ] Document service patterns

**Key Services**:
- TypeSafeApiClient
- SaveService
- LoadService
- ExternalAPIService

**Estimated Work**: **33 hours**

---

### Phase 9: State Management Unification ❌ NOT STARTED
**Current Status**: Redux + Context API mix
**Problem**: Unclear state ownership, duplicate state

#### Audit Scope

**9.1: State Audit** (Est. 15 hours)
- [ ] Map all state locations
- [ ] Identify state duplication
- [ ] Document state ownership
- [ ] Plan unification strategy

**Deliverable**: `PHASE_9_1_STATE_AUDIT.md`

**9.2: State Unification** (Est. 60 hours)
- [ ] Consolidate duplicate state
- [ ] Establish single source of truth
- [ ] Migrate to unified pattern
- [ ] Document state architecture

**Estimated Work**: **75 hours**

---

## 📊 Full Scope Effort Estimate

### By Phase
| Phase | System | Status | Hours | Completion |
|-------|--------|--------|-------|------------|
| 1 | Manager Integration | ✅ In Progress | 68 | 35% |
| 2 | Type System | ❌ Not Started | 90 | 0% |
| 3 | Event System | ❌ Not Started | 75 | 0% |
| 4 | Component Integration | ❌ Not Started | 225 | 3% |
| 5 | Factory Pattern | ❌ Not Started | 40 | 0% |
| 6 | Context API | ❌ Not Started | 65 | 0% |
| 7 | Utility System | ❌ Not Started | 50 | 0% |
| 8 | Service Layer | ❌ Not Started | 33 | 0% |
| 9 | State Management | ❌ Not Started | 75 | 0% |
| **TOTAL** | **All Systems** | **5% Complete** | **721** | **5%** |

### Realistic Timeline
- **Phase 1 Completion**: 68 hours remaining (1.5-2 months part-time)
- **Phases 2-9**: 653 hours (6-8 months part-time)
- **TOTAL**: ~9-10 months part-time development

### By Priority
**High Priority** (300 hours):
- Complete Phase 1 (68 hours)
- Phase 2: Type System (90 hours)
- Phase 3: Event System (75 hours)
- Phase 4: Core Component Integration (67 hours - critical components only)

**Medium Priority** (250 hours):
- Phase 4: Remaining Components (158 hours)
- Phase 6: Context-Manager Bridge (65 hours)
- Phase 5: Factory Registry (40 hours)

**Low Priority** (171 hours):
- Phase 7: Utility Consolidation (50 hours)
- Phase 8: Service Standardization (33 hours)
- Phase 9: State Unification (75 hours)

---

## 🎯 Recommended Execution Strategy

### Iterative Audit Cycles
Use the **same pattern** as Phase 1 for each system:

#### Cycle Template
```
1. INVENTORY (10-15% of phase time)
   - Catalog all files in system
   - Map relationships
   - Identify disconnections
   - Document current state
   - Create inventory document

2. ANALYSIS (15-20% of phase time)
   - Analyze patterns
   - Identify duplicates
   - Find integration points
   - Prioritize fixes
   - Create analysis document

3. INTEGRATION (60-70% of phase time)
   - Implement fixes
   - Add to registries
   - Create access patterns
   - Update components
   - Test integrations

4. VERIFICATION (5-10% of phase time)
   - Validate changes
   - Check for breaks
   - Document patterns
   - Create completion report
```

### Sprint Planning (2-week sprints)
**Sprint 1-4**: Complete Phase 1 (Manager Integration)
- Sprint 1: Add 8-10 managers
- Sprint 2: Add 8-10 managers
- Sprint 3: Add remaining 8-10 managers
- Sprint 4: Integrate 5-10 components

**Sprint 5-8**: Phase 2 (Type System)
- Sprint 5: Type inventory + enum audit
- Sprint 6: Convert string literals to enums
- Sprint 7: Implement type guards
- Sprint 8: Verification

**Sprint 9-12**: Phase 3 (Event System)
- Sprint 9: Event usage audit
- Sprint 10-11: Integrate events in components
- Sprint 12: Replace polling with events

**Sprint 13-24**: Phase 4 (Component Integration)
- Sprint 13-14: Mining + Exploration subsystems
- Sprint 15-16: Combat subsystem
- Sprint 17-18: Colony subsystem
- Sprint 19-20: Ship subsystem
- Sprint 21-22: UI subsystem (critical)
- Sprint 23-24: UI subsystem (remaining)

**Sprint 25-30**: Phases 5-9
- Sprint 25-26: Factory integration
- Sprint 27-28: Context-Manager bridge
- Sprint 29-30: Utilities + Services

---

## 🚨 Critical Dependencies

### Must Complete First
1. **Phase 1** before Phase 4 (components need managers in registry)
2. **Phase 2** before Phase 3 (events need proper types)
3. **Phase 3** before removing polling in Phase 4

### Can Run in Parallel
- Phase 5 (Factories) can run alongside Phase 1
- Phase 7 (Utilities) can run anytime
- Phase 8 (Services) independent

---

## 📈 Success Metrics

### Quantitative Goals
- **Manager Coverage**: 35% → 100% (52 managers)
- **Component Integration**: 3% → 80%+ (240+ components)
- **Type Safety Score**: 7.5/10 → 9.5/10
- **Event Usage**: 10% → 80%+
- **Code Duplication**: Current → 50% reduction

### Qualitative Goals
- ✅ Single source of truth for all systems
- ✅ Type-safe throughout
- ✅ Event-driven architecture
- ✅ Zero breaking changes during migration
- ✅ All existing functionality preserved
- ✅ Comprehensive documentation

---

## 🔄 Continuous Audit Process

### After Initial Completion
Each major feature addition should trigger:
1. **System Audit** - Which systems affected?
2. **Integration Check** - Connected to managers?
3. **Type Safety Review** - Using enums?
4. **Event Mapping** - Emitting proper events?
5. **Documentation Update** - Audit docs updated?

### Monthly Review
- Review registry coverage
- Check for new disconnections
- Identify emerging patterns
- Update audit priorities

---

## 📝 Documentation Requirements

### Per Phase
Each phase must produce:
1. **Inventory Document** (PHASE_X_1_*.md)
2. **Analysis Document** (PHASE_X_2_*.md)
3. **Integration Guide** (PHASE_X_3_*.md)
4. **Completion Report** (PHASE_X_COMPLETE.md)

### Global Documents
Maintain:
1. **Architecture Map** (system relationships)
2. **Integration Status** (current % complete)
3. **Pattern Library** (reusable patterns)
4. **Breaking Change Log** (if any)

---

## 🎯 Current Status Summary

### Completed (5%)
- ✅ Phase 1.1: Manager inventory
- ✅ Phase 1.2: Type system inventory
- ✅ Phase 1.3: Component integration inventory
- ✅ Manager Registry expansion (14 → 18)
- ✅ Manager access hooks (18 hooks)
- ✅ Mining subsystem proof-of-concept

### In Progress (Phase 1: 35%)
- ⏳ Complete manager registry (34 managers remaining)
- ⏳ Integrate remaining subsystems

### Not Started (95%)
- ❌ Phases 2-9 (8 major systems)
- ❌ 653 hours of estimated work
- ❌ ~240 components to integrate
- ❌ Type system unification
- ❌ Event system integration
- ❌ Context-Manager bridge
- ❌ Factory registry
- ❌ Utility consolidation
- ❌ Service standardization
- ❌ State unification

---

## 💡 Key Takeaways

### Scale Reality
- **Phase 1 = ~5% of total audit work**
- **721 total hours estimated** (~4.5 months full-time)
- **9 major systems** need same level of attention
- **This is a 6-12 month project** at part-time pace

### Success Factors
1. **No deletions policy** - Integration, not replacement
2. **Iterative approach** - Small, verified steps
3. **Pattern reuse** - Same audit cycle each phase
4. **Documentation-driven** - Every phase produces docs
5. **Backward compatibility** - Zero breaking changes

### Risk Mitigation
- Start with highest-value phases (1-4)
- Validate each integration thoroughly
- Maintain fallbacks during migration
- Document all patterns for consistency
- Regular verification checkpoints

---

**Document Version**: 1.0
**Date**: 2025-11-13
**Status**: Phase 1 @ 35% Complete, 95% Remaining
**Next Milestone**: Complete Phase 1 Manager Integration
**Estimated Full Completion**: Q3-Q4 2025 (part-time pace)

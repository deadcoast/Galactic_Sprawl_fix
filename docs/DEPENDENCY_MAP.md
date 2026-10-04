# Dependency Map - Galactic Sprawl

**Purpose**: This document maps all dependencies between managers, types, components, and systems to ensure correct integration order and identify blocking issues.

**Last Updated**: 2025-11-13
**Status**: Based on comprehensive source code validation

---

## Table of Contents

1. [Manager Dependencies](#manager-dependencies)
2. [Type Dependencies](#type-dependencies)
3. [Component Dependencies](#component-dependencies)
4. [Critical Path](#critical-path)
5. [Blocking Issues](#blocking-issues)
6. [Integration Sequence](#integration-sequence)

---

## Manager Dependencies

### Dependency Graph

```
CRITICAL INFRASTRUCTURE (No dependencies - complete first):
├─ AssetManager (standalone)
├─ GameManager (standalone)
└─ GameLoopManager (standalone)

CORE MANAGERS (Depend on infrastructure):
├─ ResourceManager (standalone)
├─ TechTreeManager (standalone)
├─ ShipFactory (standalone) ⚠️ Required by many ship managers
└─ AsteroidFieldManager (standalone)

RESOURCE SUBSYSTEM:
├─ ResourceFlowManager → ResourceManager
├─ ResourceConversionManager → ResourceManager, ResourceFlowManager
├─ ResourceStorageManager → ResourceManager
├─ ResourceThresholdManager → ResourceManager, ResourceStorageManager
├─ ResourceCostManager → ResourceManager
├─ ResourceExchangeManager → ResourceManager
├─ ResourcePoolManager → ResourceManager
└─ ResourcePerformanceMonitor → ResourceManager, ResourceFlowManager

COMBAT SUBSYSTEM:
├─ ObjectDetectionSystem (standalone)
├─ CombatManager (standalone)
├─ CombatMechanicsSystem → ObjectDetectionSystem
├─ ThreatAssessmentManager (standalone)
├─ CombatShipManager → ShipManager, ShipFactory
├─ EnvironmentalHazardManager → CombatManager
├─ WeaponEffectManager (standalone)
└─ AdvancedWeaponEffectManager → WeaponEffectManager

SHIP SUBSYSTEM:
├─ ShipManager → ShipFactory
├─ MiningShipManager → ShipManager, AsteroidFieldManager  ✅
├─ ReconShipManager → ShipManager  ✅
├─ CombatShipManager → ShipManager, ShipFactory
├─ TransportShipManager → ShipManager
├─ FleetManager → ShipManager, CombatShipManager
├─ ShipyardManager → ShipFactory
├─ ShipHangarManager → ShipManager
└─ SalvageManager → ShipManager

COLONY SUBSYSTEM:
├─ ColonyManagerImpl (standalone)
├─ PopulationManager → ColonyManagerImpl
├─ HabitableWorldManager → ColonyManagerImpl
├─ BiodomeManager → ColonyManagerImpl
├─ ColonyProductionManager → ColonyManagerImpl, ProductionManager
├─ TradeRouteManager → ColonyManagerImpl
├─ ColonyExpansionManager → ColonyManagerImpl
└─ ColonySatisfactionManager → ColonyManagerImpl

EXPLORATION SUBSYSTEM:
├─ ExplorationManager (standalone)  ✅
├─ SectorManager (standalone)
└─ ScanningManager → ExplorationManager

MODULE SUBSYSTEM:
├─ ModuleManager (standalone)
├─ ModuleStatusManager (standalone)  ✅
├─ ModuleAttachmentManager → ModuleManager
├─ ModuleUpgradeManager → ModuleManager
├─ SubModuleManager → ModuleManager
└─ OfficerManager → TechTreeManager  ✅

PRODUCTION SUBSYSTEM:
├─ ProductionManager (standalone)
├─ ProductionChainManager → ProductionManager
└─ ProductionQueueManager → ProductionManager

GAME SYSTEMS:
├─ AutomationManager (standalone)  ✅
├─ GlobalAutomationManager (standalone)  ✅
├─ AutomationRuleManager → AutomationManager
├─ FactionBehaviorManager (standalone)  ✅
├─ FactionRelationshipManager → FactionBehaviorManager
├─ factionManager (standalone) ⚠️ Duplicate/standalone
├─ DiplomacyManager (standalone)
├─ MarketManager (standalone)
├─ SaveManager (standalone)
└─ GameStateManager (standalone)

EFFECTS & VISUAL:
├─ EffectLifecycleManager (standalone)  ✅
├─ VisualEffectsManager → EffectLifecycleManager
├─ ParticleSystemManager (standalone)
├─ AnimationManager (standalone)
└─ BehaviorTreeManager (standalone)

PROGRESSION:
├─ ProgressionManager (standalone)
├─ AchievementManager → ProgressionManager
└─ ResearchManager → TechTreeManager

UI MANAGERS:
├─ TooltipManager (standalone)
├─ NotificationManager (standalone)
└─ TutorialManager (standalone)

PERFORMANCE:
├─ MemoryManager (standalone)
├─ PerformanceMonitor (standalone)
├─ AdaptivePerformanceManager → PerformanceMonitor
└─ ResourcePerformanceMonitor → ResourceManager
```

---

### Detailed Manager Dependencies

#### Critical Dependencies (Must Complete First)

**AssetManager** (✅ In Registry - Session 2)
- **Depends on**: Nothing
- **Required by**: GameManager (asset loading)
- **Priority**: CRITICAL
- **Status**: Complete

**GameManager** (✅ In Registry - Session 2)
- **Depends on**: AssetManager (optional)
- **Required by**: All game systems
- **Priority**: CRITICAL
- **Status**: Complete

**GameLoopManager** (✅ In Registry - Session 2)
- **Depends on**: Nothing
- **Required by**: All update-based systems
- **Priority**: CRITICAL
- **Status**: Complete

**ShipFactory** (❌ Not in Registry)
- **Depends on**: Nothing
- **Required by**: ShipManager, CombatShipManager, ShipyardManager
- **Priority**: CRITICAL
- **Blocks**: All ship managers
- **Status**: ⚠️ **BLOCKER** - Must create next

---

#### Resource System Dependencies

**ResourceManager** (✅ In Registry - Session 1)
- **Depends on**: Nothing
- **Required by**: All resource-related managers
- **Priority**: HIGH
- **Status**: Complete

**ResourceFlowManager** (✅ In Registry - Session 1)
- **Depends on**: ResourceManager
- **Required by**: ResourceConversionManager, ResourcePerformanceMonitor
- **Priority**: HIGH
- **Status**: Complete

**ResourceConversionManager** (✅ In Registry - Session 1)
- **Depends on**: ResourceManager, ResourceFlowManager
- **Required by**: Production systems
- **Priority**: HIGH
- **Status**: Complete

---

#### Combat System Dependencies

**ObjectDetectionSystem** (✅ In Registry - Session 1)
- **Depends on**: Nothing
- **Required by**: CombatMechanicsSystem
- **Priority**: HIGH
- **Status**: Complete

**CombatMechanicsSystem** (✅ In Registry - Session 1)
- **Depends on**: ObjectDetectionSystem
- **Required by**: Combat components
- **Priority**: HIGH
- **Status**: Complete

**CombatShipManager** (❌ Not in Registry)
- **Depends on**: ShipManager (not in registry), ShipFactory (not in registry)
- **Required by**: FleetManager
- **Priority**: HIGH
- **Status**: ⚠️ **BLOCKED** by ShipManager, ShipFactory

---

## Type Dependencies

### Critical Enums (Must be solid before Phase 3)

#### ResourceType (COMPLETE ✅)
**Status**: ✅ Proper enum in src/types/resources/ResourceTypes.ts
**Values**: 23 resource types defined
**Usage**: Widespread, properly typed
**Action**: None needed

#### EventType (NEEDS REVIEW ⚠️)
**Status**: ⚠️ Enum exists but may have inconsistencies
**Location**: src/types/events/EventTypes.ts
**Values**: 120+ event types
**Issues**:
- Some events may be unused
- Possible duplicates
- Need to verify all emitted events are defined
**Action**: Audit in Phase 2

#### ModuleType (CRITICAL BLOCKER ❌)
**Status**: ❌ STRING LITERAL, not enum
**Location**: src/types/buildings/ModuleTypes.ts
**Current**: `export type ModuleType = 'mining-hub' | 'exploration-hub' | ...`
**Problem**: Blocks 15+ components from proper typing
**Action**: **MUST CONVERT TO ENUM** before Phase 4
**Priority**: **CRITICAL BLOCKER**

#### ShipClass (NEEDS CONSOLIDATION ⚠️)
**Status**: ⚠️ Multiple enum definitions exist
**Locations**:
- src/types/ships/PlayerShipClass.ts
- src/types/ships/UnifiedShipTypes.ts (UnifiedShipClass)
**Problem**: Inconsistent usage, some components use one, some use other
**Action**: Consolidate to single enum in Phase 2

#### BuildingType (⚠️)
**Status**: ⚠️ May be string literal
**Location**: src/types/buildings/
**Action**: Verify and convert if needed in Phase 2

---

### Type Conversion Requirements

#### UnifiedMiningShip ↔ MiningShip
**Status**: ✅ Conversion layer exists (MiningWindow.tsx:150)
**Pattern**:
```typescript
const convertedShips: MiningShip[] = unifiedShips.map(ship => ({
  id: ship.id,
  name: ship.name,
  type: ship.shipClass,
  status: ship.status as 'idle' | 'mining' | 'returning',
  // ... more conversions
}));
```
**Action**: Use same pattern for other components

#### UnifiedShipStatus ↔ OldShipStatus
**Status**: ⚠️ Temporary during transition
**Action**: Consolidate in Phase 2

---

## Component Dependencies

### Mining Subsystem (Partially Integrated)

**MiningWindow** (✅ Integrated - Session 1)
- **Depends on**: MiningShipManager ✅
- **Status**: Complete
- **Pattern**: Manager data + mock fallback

**MiningMap** (❌ Not Integrated)
- **Depends on**: AsteroidFieldManager ✅ (in registry)
- **Status**: Ready to integrate
- **Priority**: HIGH

**MiningControls** (❌ Not Integrated)
- **Depends on**: MiningShipManager ✅ (in registry)
- **Status**: Ready to integrate
- **Priority**: MEDIUM

**ResourceNode** (❌ Not Integrated)
- **Depends on**: ResourceManager ✅ (in registry)
- **Status**: Ready to integrate
- **Priority**: MEDIUM

---

### Exploration Subsystem (Not Integrated)

**ExplorationWindow** (❌ Not Integrated)
- **Depends on**: ExplorationManager ✅ (in registry - Session 1)
- **Status**: Ready to integrate
- **Priority**: HIGH
- **Estimated Time**: 2-3 hours

**ExplorationControls** (❌ Not Integrated)
- **Depends on**: ExplorationManager ✅
- **Status**: Ready to integrate
- **Priority**: HIGH

**MissionLog** (❌ Not Integrated)
- **Depends on**: ExplorationManager ✅
- **Status**: Ready to integrate
- **Priority**: MEDIUM

**ShipStatusMonitor** (❌ Not Integrated)
- **Depends on**: ReconShipManager ✅ (in registry - Session 1)
- **Status**: Ready to integrate
- **Priority**: MEDIUM

---

### Colony Subsystem (Not Integrated)

**ColonyCore** (❌ Not Integrated)
- **Depends on**: ColonyManagerImpl ❌ (not in registry)
- **Status**: ⚠️ BLOCKED
- **Priority**: HIGH
- **Action**: Add ColonyManagerImpl to registry first

**HabitableWorld** (❌ Not Integrated)
- **Depends on**: HabitableWorldManager ❌, ColonyManagerImpl ❌
- **Status**: ⚠️ BLOCKED
- **Priority**: HIGH

**PopulationGrowthModule** (❌ Not Integrated)
- **Depends on**: PopulationManager ❌, ColonyManagerImpl ❌
- **Status**: ⚠️ BLOCKED
- **Priority**: MEDIUM

---

### Combat Subsystem (Not Integrated)

**CombatDisplay** (❌ Not Integrated)
- **Depends on**: CombatManager ✅ (in registry)
- **Status**: Ready to integrate
- **Priority**: HIGH
- **Estimated Time**: 2-3 hours

**CombatControls** (❌ Not Integrated)
- **Depends on**: CombatManager ✅, CombatShipManager ❌
- **Status**: ⚠️ Partially blocked
- **Priority**: MEDIUM

**WeaponryDisplay** (❌ Not Integrated)
- **Depends on**: WeaponUpgradeManager ❌, WeaponFactory ❌
- **Status**: ⚠️ BLOCKED
- **Priority**: LOW

---

## Critical Path

### Integration Order (Phases 1-4)

**SPRINT 1: Critical Infrastructure** (✅ COMPLETE)
```
1. GameLoopManager ✅
2. GameManager ✅
3. AssetManager ✅
```

**SPRINT 2: Factories & Core** (⚠️ NEXT - CRITICAL)
```
1. ShipFactory ❌ (BLOCKER - create first)
2. ShipManager ❌ (depends on ShipFactory)
3. ModuleManager ❌ (needed by many systems)
4. ProductionManager ❌ (needed by colony/resource systems)
```

**SPRINT 3: Ship Managers** (after Sprint 2)
```
1. CombatShipManager (depends on ShipManager, ShipFactory)
2. TransportShipManager (depends on ShipManager)
3. FleetManager (depends on ShipManager, CombatShipManager)
```

**SPRINT 4: Colony Managers** (high value)
```
1. ColonyManagerImpl
2. PopulationManager
3. HabitableWorldManager
4. BiodomeManager
```

**SPRINT 5: Component Integration** (after managers complete)
```
1. MiningMap (depends on AsteroidFieldManager ✅)
2. ExplorationWindow (depends on ExplorationManager ✅)
3. CombatDisplay (depends on CombatManager ✅)
4. ColonyCore (depends on ColonyManagerImpl - from Sprint 4)
```

---

## Blocking Issues

### Critical Blockers (Must Resolve Immediately)

#### 1. ModuleType String Literal ❌
**Issue**: ModuleType is string literal, not enum
**Blocks**: 15+ components that use ModuleType
**Impact**: Type safety, autocomplete, refactoring
**Priority**: **CRITICAL**
**Resolution**: Convert to enum in Phase 2.1
**Estimated Time**: 2-3 hours

#### 2. ShipFactory Missing ❌
**Issue**: ShipFactory not in registry
**Blocks**: ShipManager, CombatShipManager, ShipyardManager, FleetManager
**Impact**: Cannot integrate 10+ ship-related managers
**Priority**: **CRITICAL**
**Resolution**: Add ShipFactory to registry in Sprint 2
**Estimated Time**: 30 minutes

#### 3. WeaponFactory Missing ❌
**Issue**: WeaponFactory doesn't exist
**Blocks**: WeaponUpgradeManager, weapon-related components
**Impact**: Cannot integrate weapon systems
**Priority**: HIGH
**Resolution**: Create WeaponFactory in Phase 5 (Factories)
**Estimated Time**: 3-4 hours (new factory)

---

### Medium Priority Blockers

#### 4. ModuleFactory Missing ❌
**Issue**: ModuleFactory doesn't exist
**Blocks**: ModuleManager, module creation components
**Impact**: Module system not fully functional
**Priority**: MEDIUM
**Resolution**: Create ModuleFactory in Phase 5
**Estimated Time**: 3-4 hours

#### 5. Registry Fragmentation ⚠️
**Issue**: 3 different ServiceRegistry implementations found
**Locations**:
- src/managers/services/ServiceRegistry.ts
- src/systems/services/ServiceRegistry.ts
- src/lib/services/ServiceRegistry.ts
**Impact**: Confusion, potential conflicts
**Priority**: MEDIUM
**Resolution**: Consolidate in Phase 1.5 (Registry Consolidation)
**Estimated Time**: 2-3 hours

---

## Integration Sequence

### Recommended Order for Maximum Efficiency

**Phase 1: Managers (76.5 hours)**

**Week 1-2: Critical Infrastructure**
1. ✅ GameLoopManager, GameManager, AssetManager (COMPLETE)
2. ShipFactory (CREATE - 2 hrs)
3. ShipManager (2 hrs)
4. ModuleManager (2 hrs)
5. ProductionManager (2 hrs)

**Week 3-4: Combat & Ships**
6. CombatShipManager (2 hrs)
7. EnvironmentalHazardManager (2 hrs)
8. FleetManager (2 hrs)
9. TransportShipManager (2 hrs)
10. ShipyardManager (2 hrs)

**Week 5-6: Colony System**
11. ColonyManagerImpl (2 hrs)
12. PopulationManager (2 hrs)
13. HabitableWorldManager (2 hrs)
14. BiodomeManager (2 hrs)
15. ColonyProductionManager (2 hrs)

**Week 7-8: Resource & Production**
16-20. Remaining resource managers (10 hrs)
21-23. Remaining production managers (6 hrs)

**Week 9-10: Remaining Systems**
24-51. All remaining managers (40 hrs)

---

**Phase 2: Types (110 hours)**

**Priority Order**:
1. ModuleType string → enum (CRITICAL - 3 hrs)
2. ShipClass consolidation (3 hrs)
3. EventType audit (8 hrs)
4. Remaining string literals (96 hrs)

---

**Phase 3: Events (90 hours)**

**Dependencies**: Phase 2 complete (EventType enum solid)

---

**Phase 4: Components (225 hours)**

**Priority Order**:
1. Mining subsystem (15 hrs - MiningMap, MiningControls, ResourceNode)
2. Exploration subsystem (20 hrs - 5 components)
3. Combat subsystem (25 hrs - 8 components)
4. Colony subsystem (40 hrs - 12 components)
5. Remaining components (125 hrs)

---

## Dependency Verification Checklist

Before starting any manager integration, verify:

- [ ] **No Circular Dependencies**: Manager doesn't import ManagerRegistry
- [ ] **Dependencies Available**: All required managers are in registry
- [ ] **Types Defined**: All types used by manager are defined as enums
- [ ] **Factory Exists**: If manager creates objects, factory is available
- [ ] **Events Defined**: All events emitted by manager are in EventType enum

Before starting any component integration, verify:

- [ ] **Manager Available**: Required manager is in registry and has hook
- [ ] **Types Match**: Component types compatible with manager types (or conversion layer planned)
- [ ] **Events Available**: Events needed by component are defined
- [ ] **Mock Data Present**: Component has fallback mock data for development

---

## Quick Reference: Integration Readiness

### ✅ Ready to Integrate (Managers Available)

**Components**:
- MiningMap → AsteroidFieldManager ✅
- MiningControls → MiningShipManager ✅
- ExplorationWindow → ExplorationManager ✅
- ExplorationControls → ExplorationManager ✅
- ShipStatusMonitor → ReconShipManager ✅
- CombatDisplay → CombatManager ✅
- ResourceNode → ResourceManager ✅

### ⚠️ Partially Ready (Some Dependencies Missing)

**Components**:
- CombatControls → CombatManager ✅, CombatShipManager ❌

### ❌ Blocked (Managers Not Available)

**Components**:
- ColonyCore → ColonyManagerImpl ❌
- HabitableWorld → HabitableWorldManager ❌
- WeaponryDisplay → WeaponUpgradeManager ❌, WeaponFactory ❌

---

**Last Updated**: 2025-11-13
**Next Review**: After Sprint 2 completion
**Maintainer**: Galactic Sprawl Audit Team

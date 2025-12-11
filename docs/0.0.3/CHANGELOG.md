# CHANGELOG 0.0.3: Galactic Sprawl Docs

GALACTIC SPRAWL CODEBASE AUDIT REPORT

**Generated:** 2025-12-10
**Audit Type:** Full Reconciliation Audit (Strict Preservation Mode)
**Status:** Phase 1 Complete - Reconnaissance

---

## EXECUTIVE SUMMARY

This audit identified **integration debt accumulated over ~1 month** with the following key findings:

| Category | Count | Critical Issues |
|----------|-------|-----------------|
| Manager/Service Classes | 60+ | 3 duplicate ServiceRegistry implementations |
| Event System Files | 45+ | 2 conflicting ModuleEventBus implementations |
| Resource System Files | 15+ | Intentional re-exports (no issues) |
| Module System Files | 20+ | Complementary type definitions |
| Combat/Ship Files | 50+ | 1 critical FactionShipTypes duplicate |
| **Broken Exports** | **28** | **CRITICAL: /src/components/ui/index.ts** |
| Circular Dependencies | 19 | Various type and manager cycles |
| TODO/FIXME Comments | 70+ | Concentrated in ResourceFlowManager, ShipManager |

### CRITICAL ACTION ITEMS (Must Fix)
1. **28 broken exports** in `/src/components/ui/index.ts` pointing to non-existent files
2. **2 conflicting ModuleEventBus** implementations need consolidation
3. **3 ServiceRegistry** implementations need unified approach
4. **FactionShipTypes.ts** duplicate file in `/types/factions/` is redundant

---

## SECTION 1: MODULE INVENTORY

### 1.1 Manager Classes (45+)

#### Automation Managers
| File | Class | Purpose |
|------|-------|---------|
| `src/managers/automation/GlobalAutomationManager.ts` | GlobalAutomationManager | Global automation rules |
| `src/managers/automation/AutomationManager.ts` | AutomationManager | Module-level automation |

#### AI/Behavior Managers
| File | Class | Purpose |
|------|-------|---------|
| `src/managers/ai/BehaviorTreeManager.ts` | BehaviorTreeManager | AI behavior trees |

#### Combat Managers
| File | Class | Lines | Purpose |
|------|-------|-------|---------|
| `src/managers/combat/combatManager.ts` | CombatManager | 474 | Core combat management |
| `src/managers/combat/CombatShipManager.ts` | CombatShipManagerImpl | 518 | Ship combat management |
| `src/managers/combat/CombatMechanicsSystem.ts` | CombatMechanicsSystem | 806 | Combat physics/mechanics |
| `src/managers/combat/EnvironmentalHazardManager.ts` | EnvironmentalHazardManager | 950 | Hazard management |
| `src/managers/combat/ObjectDetectionSystem.ts` | ObjectDetectionSystem | 507 | Spatial detection |
| `src/managers/combat/ThreatAssessmentManager.ts` | ThreatAssessmentManager | 674 | Threat evaluation |

#### Module Managers
| File | Class | Lines | Purpose |
|------|-------|-------|---------|
| `src/managers/module/ModuleManager.ts` | ModuleManager | 812 | Core module CRUD |
| `src/managers/module/ModuleManagerWrapper.ts` | ModuleManagerWrapper | ~300 | Adapter for ModuleContext |
| `src/managers/module/ModuleStatusManager.ts` | ModuleStatusManager | ~400 | Extended status tracking |
| `src/managers/module/ModuleUpgradeManager.ts` | ModuleUpgradeManager | ~350 | Upgrade progression |
| `src/managers/module/ModuleAttachmentManager.ts` | ModuleAttachmentManager | ~300 | Building attachment |
| `src/managers/module/SubModuleManager.ts` | SubModuleManager | ~400 | Sub-module management |
| `src/managers/module/OfficerManager.ts` | OfficerManager | ~300 | Officer academy |
| `src/managers/module/ShipHangarManager.ts` | ShipHangarManager | ~250 | Hangar management |

#### Resource Managers
| File | Class | Purpose |
|------|-------|---------|
| `src/managers/resource/ResourceFlowManager.ts` | ResourceFlowManager | Resource flow optimization |
| `src/managers/resource/ResourceConversionManager.ts` | ResourceConversionManager | Resource conversion |
| `src/managers/resource/ResourcePoolManager.ts` | ResourcePoolManager | Pool allocation |
| `src/managers/resource/ResourceStorageManager.ts` | ResourceStorageManager | Storage operations |
| `src/managers/resource/ResourceThresholdManager.ts` | ResourceThresholdManager | Threshold monitoring |
| `src/managers/resource/ResourceExchangeManager.ts` | ResourceExchangeManager | Exchange operations |
| `src/managers/resource/ResourceCostManager.ts` | ResourceCostManager | Cost calculations |

#### Weapon Managers
| File | Class | Lines | Purpose |
|------|-------|-------|---------|
| `src/managers/weapons/WeaponEffectManager.ts` | WeaponEffectManager | 410 | Effect lifecycle |
| `src/managers/weapons/AdvancedWeaponEffectManager.ts` | AdvancedWeaponEffectManager | 1238 | Advanced effects |
| `src/managers/weapons/WeaponUpgradeManager.ts` | WeaponUpgradeManager | 374 | Upgrade progression |

#### Game Managers
| File | Class | Purpose |
|------|-------|---------|
| `src/managers/game/GameManager.ts` | GameManager | Core game state |
| `src/managers/game/GameLoopManager.ts` | GameLoopManager | Game loop coordination |
| `src/managers/game/TechTreeManager.ts` | TechTreeManager | Technology progression |
| `src/managers/game/AssetManager.ts` | AssetManager | Asset loading |
| `src/managers/game/AnimationManager.ts` | AnimationManager | Animation coordination |

#### Other Managers
| File | Class | Purpose |
|------|-------|---------|
| `src/managers/ships/ShipManager.ts` | ShipManager | Central ship management (29,531 lines) |
| `src/managers/mining/MiningShipManager.ts` | MiningShipManager | Mining operations |
| `src/managers/exploration/ExplorationManager.ts` | ExplorationManager | Exploration system |
| `src/managers/exploration/ReconShipManager.ts` | ReconShipManager | Recon ship operations |
| `src/managers/factions/factionManager.ts` | FactionManager | Faction management |
| `src/managers/factions/FactionBehaviorManager.ts` | FactionBehaviorManager | Faction AI |
| `src/managers/factions/FactionRelationshipManager.ts` | FactionRelationshipManager | Diplomacy |
| `src/managers/colony/ColonyManagerImpl.ts` | ColonyManagerImpl | Colony management |
| `src/managers/salvage/SalvageManager.ts` | SalvageManager | Salvage operations |

### 1.2 Service Classes (15+)

| File | Class | Purpose |
|------|-------|---------|
| `src/services/logging/ErrorLoggingService.ts` | ErrorLoggingService | Error logging |
| `src/services/logging/LoggerService.ts` | LoggerService | General logging |
| `src/services/api/APIService.ts` | APIService | API operations |
| `src/services/data/DataCollectionService.ts` | DataCollectionService | Data collection |
| `src/services/data/DataProcessingService.ts` | DataProcessingService | Data processing |
| `src/services/analysis/AnalysisAlgorithmService.ts` | AnalysisAlgorithmService | Analysis algorithms |
| `src/services/analysis/AnomalyDetectionService.ts` | AnomalyDetectionService | Anomaly detection |
| `src/services/realtime/RealTimeDataService.ts` | RealTimeDataService | Real-time data |
| `src/services/registry/ComponentRegistryService.ts` | ComponentRegistryService | Component registration |
| `src/services/events/EventPropagationService.ts` | EventPropagationService | Event propagation |
| `src/services/worker/WorkerService.ts` | WorkerService | Web Worker management |
| `src/services/recovery/RecoveryService.ts` | RecoveryService | Error recovery |
| `src/services/graphics/WebGLService.ts` | WebGLService | WebGL rendering |

### 1.3 ServiceRegistry Implementations (DUPLICATE - Needs Consolidation)

| File | Pattern | Notes |
|------|---------|-------|
| `src/lib/managers/ServiceRegistry.ts` | Singleton | Manager-focused registry |
| `src/lib/services/ServiceRegistry.ts` | Singleton | Service-focused registry |
| `src/lib/registry/ServiceRegistry.ts` | Singleton | Generic registry |

**ISSUE:** Three separate ServiceRegistry implementations exist. They should be consolidated into a single unified registry.

---

## SECTION 2: DEPENDENCY MAP

### 2.1 Event System Architecture

```
                    ┌─────────────────────────────────────┐
                    │         UnifiedEventSystem          │
                    │   (src/lib/events/UnifiedEventSystem.ts)   │
                    └─────────────────┬───────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│      EventBus       │   │   ModuleEventBus    │   │    EventEmitter     │
│  (lib/events/)      │   │  (lib/events/)      │   │   (lib/events/)     │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │         CONFLICT                   │
                    ▼                                    ▼
          ┌─────────────────────┐           ┌─────────────────────┐
          │   ModuleEventBus    │           │   ModuleEventBus    │
          │ (lib/events/)       │           │ (lib/modules/)      │
          │ - Extends EventBus  │           │ - Standalone        │
          │ - Has validation    │           │ - Has history       │
          └─────────────────────┘           └─────────────────────┘
```

### 2.2 Resource System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ResourceSystem                                │
│              (src/resource/ResourceSystem.ts)                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     │                       │                       │
     ▼                       ▼                       ▼
┌────────────┐        ┌────────────┐         ┌────────────┐
│  Flow      │        │  Storage   │         │ Threshold  │
│ Subsystem  │        │ Subsystem  │         │ Subsystem  │
└────────────┘        └────────────┘         └────────────┘
     │                       │                       │
     └───────────────────────┼───────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Transfer       │
                    │ Subsystem      │
                    └────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ResourceRegistry                                │
│              (src/registry/ResourceRegistry.ts)                      │
│                             │                                        │
│                             ▼                                        │
│              ResourceRegistryIntegration                             │
│       (src/registry/ResourceRegistryIntegration.ts)                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Module System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ModuleContext                                  │
│              (src/contexts/ModuleContext.tsx)                        │
│  - Redux-pattern reducer                                             │
│  - Event subscription                                                │
│  - Legacy action dispatch                                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ModuleManagerWrapper                              │
│           (src/managers/module/ModuleManagerWrapper.ts)              │
│  - Adapter pattern                                                   │
│  - Type conversion (BaseModule → Module)                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ModuleManager                                   │
│             (src/managers/module/ModuleManager.ts)                   │
│                             │                                        │
│     ┌───────────────────────┼───────────────────────┐               │
│     │                       │                       │               │
│     ▼                       ▼                       ▼               │
│ ModuleStatus        SubModuleManager        ModuleUpgrade           │
│ Manager                                     Manager                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 Ship Type Hierarchy

```
                    ┌─────────────────────────────────────┐
                    │          CommonShipTypes            │
                    │   (src/types/ships/CommonShipTypes.ts)   │
                    │   - ShipCategory (11 types)              │
                    │   - ShipStatus (21 states)               │
                    │   - CommonShipStats                       │
                    │   - CommonShipCapabilities               │
                    └─────────────────┬───────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│     ShipTypes       │   │  FactionShipTypes   │   │  PlayerShipTypes    │
│   (Unified Ship)    │   │  (30 faction ships) │   │  (13 player ships)  │
│   - Discriminated   │   │  - SpaceRats (10)   │   │  - PlayerShipClass  │
│     union details   │   │  - LostNova (10)    │   │  - Fighter interface│
└─────────────────────┘   │  - EquatorHorizon(10)│   └─────────────────────┘
                          └─────────────────────┘
```

### 2.5 Circular Dependencies Found (19 chains)

| Chain | Files Involved | Severity |
|-------|----------------|----------|
| 1 | ResourceTypes ↔ ResourceConversionTypes ↔ ProductionChainTypes | MEDIUM |
| 2 | ResourceTypes ↔ ResourceConversionTypes | MEDIUM |
| 3 | ShipTypes ↔ FactionShipTypes | LOW |
| 4 | ShipTypes ↔ PlayerShipTypes | LOW |
| 5 | UnifiedEventSystem ↔ ErrorLoggingService | HIGH |
| 6 | UnifiedEventSystem ↔ ErrorLoggingService ↔ BaseManager | HIGH |
| 7 | ErrorLoggingService ↔ BaseManager | HIGH |
| 8 | ModuleManager ↔ ModuleStatusManager | MEDIUM |
| 9 | ManagerRegistry ↔ MiningShipManager ↔ shipBehavior | MEDIUM |
| 10 | ManagerRegistry ↔ MiningShipManager | MEDIUM |
| 11-13 | Chart ↔ CanvasRenderer/SVGRenderer/WebGLRenderer | LOW |
| 14 | useResourceTracking ↔ ResourceSerializationTypes | LOW |
| 15 | ThemeTypes ↔ defaultTheme | LOW |
| 16-19 | ResourceSystem ↔ Subsystems (4 chains) | MEDIUM |

---

## SECTION 3: INTEGRATION GAP ANALYSIS

### 3.1 CRITICAL: Broken Exports in `/src/components/ui/index.ts`

**28 exports reference non-existent files:**

```typescript
// These directories DO NOT EXIST:
// - /src/components/ui/typography/
// - /src/components/ui/inputs/
// - /src/components/ui/layout/
// - /src/components/ui/feedback/
// - /src/components/ui/navigation/
// - /src/components/ui/data/
// - /src/components/ui/game/

// Missing single files:
// - /src/components/ui/Icon.tsx
// - /src/components/ui/Badge.tsx
// - /src/components/ui/Tooltip.tsx
// - /src/components/ui/Divider.tsx
```

**Full list of broken exports:**

| Line | Export | Missing Path |
|------|--------|--------------|
| 25-27 | Icon | `./Icon` |
| 28 | Badge | `./Badge` |
| 29 | Tooltip | `./Tooltip` |
| 30 | Divider | `./Divider` |
| 31-33 | Heading, Text, Label | `./typography/*` |
| 34-39 | Input, Checkbox, Radio, Select, Slider, Switch | `./inputs/*` |
| 40-44 | Container, Grid, Flex, Stack, Spacer | `./layout/*` |
| 45-49 | Alert, Spinner, Progress, Skeleton, Toast | `./feedback/*` |
| 50-53 | Tabs, Menu, Breadcrumb, Pagination | `./navigation/*` |
| 54-56 | TechTree, AlertPanel, CommandConsole | `./game/*` |
| 57-60 | DataTable, StatusCard, Metric, Timeline | `./data/*` |

**Note:** These components exist in `/src/ui/components/` - the paths need to be corrected.

### 3.2 Placeholder Functions (TODO/FIXME Inventory)

| File | Line | Comment |
|------|------|---------|
| `src/resource/subsystems/ResourceFlowSubsystem.ts` | 1097 | TODO: Get default state more dynamically if possible |
| `src/resource/subsystems/ResourceFlowSubsystem.ts` | 1106 | TODO: Determine appropriate priority based on module/resources |
| `src/registry/ResourceRegistryIntegration.ts` | 125 | TODO: Implement this placeholder function |
| `src/managers/module/ModuleUpgradeManager.ts` | 283 | TODO: Implement tech requirement checking |
| `src/managers/module/ModuleUpgradeManager.ts` | 351 | TODO: Implement tech requirement checking |
| `src/managers/module/OfficerManager.ts` | 255 | TODO: Implement portrait generation |
| `src/managers/module/ModuleManagerWrapper.ts` | 215 | TODO: Implement proper cleanup |
| `src/managers/module/ModuleManagerWrapper.ts` | 224 | TODO: Implement proper fallback |
| `src/lib/events/EventBus.ts` | 242 | TODO: IMPLEMENT 'Return no-op function' PATTERN |

**High TODO concentration areas:**
- ResourceFlowManager: 15 TODOs
- ShipManager: 12 TODOs
- ModuleManagerWrapper: 2 TODOs
- ColonyManagerImpl: 2 TODOs

### 3.3 Partially Implemented Interfaces

| Interface | File | Status |
|-----------|------|--------|
| ResourceRegistryIntegration | `src/registry/ResourceRegistryIntegration.ts` | Placeholder methods |
| IModuleManager | `src/types/modules/ModuleTypes.ts` | Fully defined |
| FactionManager | `src/types/ships/FactionShipTypes.ts` | Interface only |

### 3.4 Disconnected Event Handlers

The following event subscription patterns were found but may not be properly connected:

1. **ModuleContext** subscribes to events but some event types may not be emitted
2. **useModuleEvents** in `/src/hooks/events/` has deprecated unsubscribe method
3. **EventCommunication** system-to-system messaging not fully integrated

---

## SECTION 4: NAMING CONFLICT REGISTRY

### 4.1 CRITICAL: Duplicate ModuleEventBus

| Location | Implementation | Features |
|----------|----------------|----------|
| `/src/lib/events/ModuleEventBus.ts` | Extends EventBus | Validation, filtering, ErrorLoggingService |
| `/src/lib/modules/ModuleEvents.ts` | Standalone | History tracking, simple pub-sub |

**Both export:** `moduleEventBus` singleton
**Conflict:** Different capabilities, different event handling

### 4.2 CRITICAL: Duplicate ServiceRegistry

| Location | Focus |
|----------|-------|
| `/src/lib/managers/ServiceRegistry.ts` | Manager registration |
| `/src/lib/services/ServiceRegistry.ts` | Service registration |
| `/src/lib/registry/ServiceRegistry.ts` | Generic registration |

### 4.3 CRITICAL: Duplicate FactionShipTypes

| Location | Content |
|----------|---------|
| `/src/types/ships/FactionShipTypes.ts` | **PRIMARY** - 322 lines, full implementation |
| `/src/types/factions/FactionShipTypes.ts` | **REDUNDANT** - 2 lines, re-export only |
| `/src/types/ships/FactionTypes.ts` | **REDUNDANT** - 2 lines, re-export only |

### 4.4 Duplicate useModuleEvents Hook

| Location | Implementation |
|----------|----------------|
| `/src/hooks/events/useModuleEvents.ts` | Direct moduleEventBus access |
| `/src/hooks/modules/useModuleEvents.ts` | UnifiedEventSystem-based (enhanced) |

### 4.5 Duplicate EventBatcher

| Location | Implementation |
|----------|----------------|
| `/src/lib/events/EventBatcher.ts` | Class-based direct batching |
| `/src/utils/events/EventBatchingRxJS.ts` | RxJS stream-based batching |

### 4.6 Module Type Definition Files (Intentional - Complementary)

| File | Purpose |
|------|---------|
| `/src/types/modules/ModuleTypes.ts` | Manager interface, Module with building context |
| `/src/types/buildings/ModuleTypes.ts` | BaseModule, sub-modules, attachment system |

**Status:** Different purposes, no conflict - Module extends BaseModule with building context

### 4.7 ResourceTypeConverter/Migration Files (Intentional - Backward Compatibility)

| File | Purpose |
|------|---------|
| `/src/utils/resources/ResourceTypeConverter.ts` | Canonical implementation |
| `/src/utils/ResourceTypeConverter.ts` | Re-export for backward compatibility |
| `/src/utils/resources/ResourceTypeMigration.ts` | Migration logic |
| `/src/utils/ResourceTypeMigration.ts` | Deprecation utilities |

**Status:** Intentional structure - no changes needed

### 4.8 Badge/Button Component Duplicates

| Component | Location 1 | Location 2 | Notes |
|-----------|-----------|-----------|-------|
| Badge | `/src/components/ui/common/Badge.tsx` | `/src/ui/components/Badge/Badge.tsx` | Different props |
| Button | `/src/components/ui/common/Button.tsx` | `/src/ui/components/Button/Button.tsx` | common/ wraps ui/ |

---

## SECTION 5: EVENT TYPE DEFINITIONS

### 5.1 EventType Enum (212+ types)

Located in `/src/types/events/EventTypes.ts`:

**Categories (15):**
- LIFECYCLE, RESOURCE, ATTACHMENT, AUTOMATION, STATUS
- MISSION, SUB_MODULE, COMBAT, TECH, SYSTEM
- THRESHOLD, EXPLORATION, FACTION, EFFECTS, MINING, AI, OFFICER

### 5.2 ModuleEventType Definitions (Multiple Conflicting)

| File | Event Count | Format |
|------|-------------|--------|
| `/src/types/events/EventTypes.ts` | 212+ | EventType enum |
| `/src/types/events/ModuleEventTypes.ts` | 11 | Separate ModuleEventType type |
| `/src/types/events/ModuleEvents.ts` | Named events | 'module:created' format |
| `/src/lib/modules/ModuleEvents.ts` | 65+ | ModuleEventType union |

---

## SECTION 6: STATISTICS SUMMARY

### 6.1 Codebase Size

| Category | Files | Lines (Est.) |
|----------|-------|--------------|
| Managers | 45+ | 40,000+ |
| Services | 15+ | 5,000+ |
| Types | 60+ | 15,000+ |
| Hooks | 50+ | 10,000+ |
| Components | 100+ | 25,000+ |
| Utils | 40+ | 8,000+ |
| **Total** | **310+** | **100,000+** |

### 6.2 Ship System

| Faction | Ships | Config Lines |
|---------|-------|--------------|
| Space Rats | 10 | 809 |
| Lost Nova | 10 | 810 |
| Equator Horizon | 10 | 950 |
| Player | 13 | 106 |
| **Total** | **43** | **2,675** |

### 6.3 Weapon System

| Category | Count |
|----------|-------|
| Weapon Categories | 19 |
| Weapon Variants | 13 |
| Weapon Upgrades | 3 tiers |

### 6.4 Resource System

| Category | Count |
|----------|-------|
| Resource Types | 19 |
| Resource Categories | 3 |
| Flow Node Types | 6 |
| Subsystems | 4 |

---

## SECTION 7: ISSUES PRIORITIZED BY SEVERITY

### CRITICAL (Must Fix Before Proceeding)

1. **28 broken exports** in `/src/components/ui/index.ts`
2. **Duplicate ModuleEventBus** - consolidate to single implementation

### HIGH (Should Fix)

3. **3 ServiceRegistry** implementations - consolidate
4. **Circular dependencies** in event/logging system
5. **Duplicate useModuleEvents** hooks - consolidate

### MEDIUM (Recommended)

6. **FactionShipTypes** redundant re-export files
7. **EventBatcher** dual implementations
8. **TODO implementations** for tech requirement checking

### LOW (Optional Cleanup)

9. **Circular dependencies** in type files (ship types, resource types)
10. **Badge/Button** component consolidation
11. **Documentation** of intentional re-export patterns

---

## APPENDIX A: FILE LISTINGS

### A.1 All Manager Files

```
src/managers/
├── ManagerRegistry.ts
├── automation/
│   ├── AutomationManager.ts
│   └── GlobalAutomationManager.ts
├── ai/
│   └── BehaviorTreeManager.ts
├── combat/
│   ├── combatManager.ts
│   ├── CombatShipManager.ts
│   ├── CombatMechanicsSystem.ts
│   ├── EnvironmentalHazardManager.ts
│   ├── ObjectDetectionSystem.ts
│   └── ThreatAssessmentManager.ts
├── colony/
│   └── ColonyManagerImpl.ts
├── effects/
│   ├── EffectLifecycleManager.ts
│   └── ParticleSystemManager.ts
├── exploration/
│   ├── ExplorationManager.ts
│   └── ReconShipManager.ts
├── factions/
│   ├── factionManager.ts
│   ├── FactionBehaviorManager.ts
│   └── FactionRelationshipManager.ts
├── game/
│   ├── GameManager.ts
│   ├── GameLoopManager.ts
│   ├── TechTreeManager.ts
│   ├── AssetManager.ts
│   ├── AnimationManager.ts
│   ├── AsteroidFieldManager.ts
│   └── ResourceManager.ts
├── mining/
│   └── MiningShipManager.ts
├── module/
│   ├── ModuleManager.ts
│   ├── ModuleManagerWrapper.ts
│   ├── ModuleStatusManager.ts
│   ├── ModuleUpgradeManager.ts
│   ├── ModuleAttachmentManager.ts
│   ├── SubModuleManager.ts
│   ├── OfficerManager.ts
│   └── ShipHangarManager.ts
├── resource/
│   ├── ResourceFlowManager.ts
│   ├── ResourceConversionManager.ts
│   ├── ResourcePoolManager.ts
│   ├── ResourceStorageManager.ts
│   ├── ResourceThresholdManager.ts
│   ├── ResourceExchangeManager.ts
│   └── ResourceCostManager.ts
├── salvage/
│   └── SalvageManager.ts
├── ships/
│   └── ShipManager.ts
└── weapons/
    ├── WeaponEffectManager.ts
    ├── AdvancedWeaponEffectManager.ts
    └── WeaponUpgradeManager.ts
```

### A.2 All Event-Related Files

```
src/lib/events/
├── EventBus.ts
├── EventBusTypes.ts
├── EventEmitter.ts
├── EventBatcher.ts
├── ModuleEventBus.ts
└── UnifiedEventSystem.ts

src/lib/modules/
└── ModuleEvents.ts          # DUPLICATE ModuleEventBus

src/utils/events/
├── EventBatcher.ts
├── EventBatchingRxJS.ts
├── EventCommunication.ts
├── EventDataTypes.ts
├── EventDevTools.ts
├── EventDispatcher.tsx
├── EventFilter.ts
├── EventFiltering.ts
├── EventPrioritizer.ts
├── EventThrottling.ts
├── eventTypeGuards.ts
└── rxjsIntegration.ts

src/types/events/
├── EventTypes.ts
├── CombatEvents.ts
├── ExplorationEvents.ts
├── FactionEvents.ts
├── EnvironmentalHazardEvents.ts
├── ModuleEvents.ts
├── ModuleEventTypes.ts
├── OfficerEvents.ts
├── SharedEventTypes.ts
├── ShipEvents.ts
├── StandardizedEvents.ts
├── TypedEvent.ts
└── EventEmitterInterface.ts

src/hooks/events/
├── useEventBatching.ts
├── useEventFiltering.ts
├── useEventSubscription.ts
├── useModuleEvents.ts       # Direct moduleEventBus
└── useSystemEvents.ts

src/hooks/modules/
└── useModuleEvents.ts       # DUPLICATE - UnifiedEventSystem
```

---

**END OF AUDIT REPORT**

*Next Step: Generate RECONCILIATION_PLAN.md with specific fixes for all issues identified.*

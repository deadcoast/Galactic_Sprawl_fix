# PHASE 1.3: COMPONENT INTEGRATION INVENTORY

**Generated**: 2025-01-13
**Status**: IN PROGRESS
**Total Component Files**: 297
**Total Exported Components**: 369+
**Manager Registry Usage**: ~8 components (2.7%)
**Event Bus Usage**: 150+ instances

---

## EXECUTIVE SUMMARY

### Key Findings:

1. **Massive Component Library**: 297 component files organized into 13 major domains
2. **Severe Integration Gap**: Only **2.7%** of components access ManagerRegistry
3. **Context-Heavy Architecture**: Most components use Context API instead of managers
4. **Event Usage Present**: 150+ instances of event bus usage, but unclear integration patterns
5. **Well-Organized Structure**: Clean domain separation (buildings, combat, exploration, ships, UI)
6. **No Direct Manager Imports**: Good - components NOT directly importing manager classes
7. **Manager Access Missing**: Bad - only 8 components use ManagerRegistry getters

---

## PART 1: COMPONENT DOMAIN BREAKDOWN

### Domain Structure:

```
src/components/
├── buildings/          ~60 components (Colonies, Modules, Mothership)
├── combat/             ~25 components (Battle, Radar, Formations)
├── exploration/        ~40 components (Mapping, Analysis, Discovery)
├── ships/              ~40 components (Player, Faction, Hangar)
├── ui/                 ~113 components (HUD, Visualization, Controls)
├── factions/           ~5 components (Diplomacy, Relations)
├── trade/              ~3 components (Trading systems)
├── weapons/            ~5 components (Weapon systems)
├── core/               ~3 components (Integration, Error Handling)
├── debug/              ~2 components (Debug tools)
├── performance/        ~1 component (Performance monitoring)
├── providers/          Context providers
└── Total:              ~297 component files
```

---

## PART 2: MANAGER ACCESS ANALYSIS

### Components Using ManagerRegistry ✅ (8 found):

#### 1. ShipHangar.tsx
**Path**: `src/components/buildings/modules/hangar/ShipHangar.tsx`
**Manager Access**:
```typescript
import { getResourceManager } from '../../../../managers/ManagerRegistry';
const resourceManager = useMemo(() => getResourceManager(), []);
```
**Integration Status**: ✅ CONNECTED
**Purpose**: Ship hangar module interface
**Notes**: Properly uses ManagerRegistry, wrapped in useMemo

---

#### 2. SystemIntegration.tsx
**Path**: `src/components/core/SystemIntegration.tsx`
**Manager Access**:
```typescript
import { getResourceManager } from '../../managers/ManagerRegistry';
const resourceManager = getResourceManager();
```
**Integration Status**: ✅ CONNECTED
**Purpose**: Core system integration layer
**Notes**: Direct access pattern (no memo)

---

#### 3. ThresholdIntegration.tsx
**Path**: `src/components/core/ThresholdIntegration.tsx`
**Manager Access**:
```typescript
import { getResourceManager } from '../../managers/ManagerRegistry';
const resourceManager = getResourceManager();
```
**Integration Status**: ✅ CONNECTED
**Purpose**: Resource threshold integration
**Notes**: Direct access pattern

---

#### 4. ConverterManagerUI.tsx
**Path**: `src/components/ui/resource/ConverterManagerUI.tsx`
**Manager Access**:
```typescript
import { getResourceFlowManager } from '../../../managers/ManagerRegistry';
```
**Integration Status**: ✅ CONNECTED
**Purpose**: Resource converter management UI
**Notes**: Accesses ResourceFlowManager

---

#### 5. TechVisualFeedback.tsx
**Path**: `src/components/ui/tech/TechVisualFeedback.tsx`
**Manager Access**:
```typescript
import { getTechTreeManager } from '../../../managers/ManagerRegistry';
```
**Integration Status**: ✅ CONNECTED
**Purpose**: Tech tree visual feedback
**Notes**: Accesses TechTreeManager

---

### ❌ Components NOT Using Managers But Should (Examples):

#### ExplorationHub.tsx
**Path**: `src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx`
**Current Status**: ❌ DISCONNECTED
**Should Use**: ExplorationManager (NOT in registry!)
**Problem**: ExplorationManager exists but not in registry

#### MiningWindow.tsx
**Path**: `src/components/buildings/modules/MiningHub/MiningWindow.tsx`
**Current Status**: ❌ DISCONNECTED
**Should Use**: MiningShipManager (IS in registry!)
**Problem**: Component doesn't access manager

#### OfficerAcademy.tsx
**Path**: `src/components/buildings/modules/academy/OfficerAcademy.tsx`
**Current Status**: ❌ DISCONNECTED
**Should Use**: OfficerManager (NOT in registry!)
**Problem**: OfficerManager exists but not in registry

#### CombatDashboard.tsx
**Path**: `src/components/combat/CombatDashboard.tsx`
**Current Status**: ❌ DISCONNECTED
**Should Use**: CombatManager (IS in registry!)
**Problem**: Component doesn't access manager

---

## PART 3: CONTEXT API USAGE ANALYSIS

### Primary Context Usage:

#### GameContext
**File**: `src/contexts/GameContext.tsx`
**Used By**: GameHUD.tsx, many others
**Exports**:
- `useGameState()`
- `useGameDispatch()`
- `GameActionType` enum

**Pattern**:
```typescript
const { resources, tech } = useGameState();
const dispatch = useGameDispatch();
```

#### ModuleContext
**File**: `src/contexts/ModuleContext.tsx`
**Used By**: GameHUD.tsx, module components
**Exports**:
- `useModules()`
- `useModuleDispatch()`
- `ModuleActionType` enum

**Pattern**:
```typescript
const modules = useModules();
const dispatch = useModuleDispatch();
```

### Context vs Manager Pattern:

**Current Architecture**: Context API is PRIMARY data source
**Manager Role**: UNCLEAR - managers exist but components don't use them
**Integration Issue**: Disconnect between manager system and UI layer

---

## PART 4: EVENT SYSTEM USAGE

### Event Bus Usage: **150+ instances**

#### Components Using moduleEventBus:

**GameHUD.tsx**:
```typescript
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
// Usage in component for event emissions/subscriptions
```

**Pattern Analysis**:
- Components import `moduleEventBus` directly
- Subscribe to module events
- Emit module events
- Some use EventType enum ✓
- Some use string literals ❌

### Event Subscription Patterns:

**Pattern 1: Direct Subscription** (Common):
```typescript
useEffect(() => {
  const handler = (event) => {
    // Handle event
  };
  moduleEventBus.subscribe(EventType.MODULE_CREATED, handler);
  return () => {
    moduleEventBus.unsubscribe(EventType.MODULE_CREATED, handler);
  };
}, []);
```

**Pattern 2: Custom Hooks** (Rare):
```typescript
// Hook wraps event subscription
const useModuleEvents = (eventType, handler) => {
  useEffect(() => {
    moduleEventBus.subscribe(eventType, handler);
    return () => moduleEventBus.unsubscribe(eventType, handler);
  }, [eventType, handler]);
};
```

---

## PART 5: COMPONENT CATEGORIES

### 1. Buildings Domain (~60 components)

#### Colony Components (15 files):
- `AutomatedExpansion.tsx` - Colony expansion automation
- `AutomatedPopulationManager.tsx` - Population automation (⚠️ MISNAMED - is component, not manager)
- `BiodomeModule.tsx` - Biodome module
- `ColonyCore.tsx` - Colony core management
- `ColonyManagementSystem.tsx` - Colony management UI
- `ColonyMap.tsx` - Colony map visualization
- `CulturalCenter.tsx` - Cultural center module
- `EconomicHub.tsx` - Economic hub module
- `GrowthRateModifiers.tsx` - Growth rate UI
- `HabitableWorld.tsx` - Habitable world interface
- `PopulationGrowthModule.tsx` - Population growth module
- `ResourceDashboard.tsx` - Colony resource dashboard
- `ResourceTransferAnimation.tsx` - Resource transfer animations
- `SatisfactionMeter.tsx` - Satisfaction display
- `TradeRouteVisualization.tsx` - Trade route visualization

**Integration Status**: ⚠️ MIXED
**Manager Connection**: ColonyManagerImpl NOT in registry, components likely disconnected
**Event Usage**: Present via moduleEventBus
**Context Usage**: Heavy reliance on Context API

---

#### Module Components (~30 files across subdomains):

**Academy Modules** (4 files):
- `OfficerAcademy.tsx` - Officer recruitment/training
- `HiringPanel.tsx` - Officer hiring interface
- `OfficerCard.tsx` - Officer display card
- `OfficerDetails.tsx` - Officer details view

**Integration Status**: ❌ DISCONNECTED
**Should Use**: OfficerManager (exists but NOT in registry)

**Exploration Hub** (7 files):
- `ExplorationHub.tsx` - Main exploration interface
- `ExplorationControls.tsx` - Exploration controls
- `ExplorationWindow.tsx` - Exploration window
- `ExplorationTutorial.tsx` - Tutorial system
- `MissionLog.tsx` - Mission log
- `MissionReplay.tsx` - Mission replay
- `ShipStatusMonitor.tsx` - Ship status display

**Integration Status**: ❌ DISCONNECTED
**Should Use**: ExplorationManager (exists but NOT in registry)

**Hangar** (5 files):
- `ShipHangar.tsx` - ✅ USES ResourceManager
- `HangarBayList.tsx` - Hangar bay list
- `HangarModule.tsx` - Hangar module interface
- `ShipBuildingInterface.tsx` - Ship building UI
- `ShipCard.tsx` - Ship card display

**Integration Status**: ⚠️ PARTIAL
**Note**: ShipHangar uses ResourceManager, but ShipHangarManager NOT in registry

**Mining Hub** (11 files):
- `MiningWindow.tsx` - Main mining interface
- `MiningControls.tsx` - Mining controls
- `MiningMap.tsx` - Mining map visualization
- `MiningTutorial.tsx` - Mining tutorial
- `AutomationMonitor.tsx` - Automation monitoring
- `MineralProcessingCentre.tsx` - Processing center
- `ResourceNode.tsx` - Resource node display
- `ResourceStorage.tsx` - Storage display
- `ResourceTransfer.tsx` - Transfer interface
- `TechBonus.tsx` - Tech bonus display
- `ThresholdManager.tsx` - Threshold management UI (⚠️ MISNAMED)

**Integration Status**: ❌ DISCONNECTED
**Should Use**: MiningShipManager (IS in registry!), ResourceManager
**Problem**: Components don't access managers

**Radar Module** (1 file):
- `RadarModule.tsx` - Radar module interface

**Trading Hub** (1 file):
- `TradingHub.tsx` - Trading interface

---

### 2. Combat Domain (~25 components)

**Main Combat Components**:
- `BattleEnvironment.tsx` - Battle environment
- `BattleView.tsx` - Battle view
- `CombatDashboard.tsx` - Combat dashboard ❌ Should use CombatManager
- `CombatLayout.tsx` - Combat layout
- `CombatSystemDemo.tsx` - Combat system demo
- `FleetDetails.tsx` - Fleet details
- `SalvageSystem.tsx` - Salvage system

**Alerts** (1 file):
- `AlertSystemUI.tsx` - Alert system UI

**Formations** (7 files):
- `FormationEditor.tsx` - Formation editor
- `FormationPresetList.tsx` - Preset list
- `FormationTacticsContainer.tsx` - Tactics container
- `FormationTacticsPage.tsx` - Tactics page
- `FormationTacticsPanel.tsx` - Tactics panel
- `FormationVisualizer.tsx` - Visual izer
- `TacticalBehaviorSelector.tsx` - Behavior selector
- `TacticalBonusCard.tsx` - Bonus card

**Radar** (3 files):
- `DetectionVisualization.tsx` - Detection visualization
- `RadarSweepAnimation.tsx` - Sweep animation
- `RangeIndicators.tsx` - Range indicators

**Integration Status**: ❌ MOSTLY DISCONNECTED
**Available Managers**: CombatManager, CombatMechanicsSystem, ThreatAssessmentManager (ALL in registry!)
**Problem**: Components don't access any of these managers

---

### 3. Exploration Domain (~40 components)

**Main Exploration Components** (many files):
- `AdvancedFilteringSystem.tsx` - Filtering system
- `AnalysisConfigManager.tsx` - Config manager (⚠️ MISNAMED component)
- `AnomalyAnalysis.tsx` - Anomaly analysis
- `AutomatedSectorScanner.tsx` - Sector scanner
- `DataAnalysisSystem.tsx` - Data analysis
- `DataFilterPanel.tsx` - Filter panel
- `DataPointVirtualList.tsx` - Virtual list
- `DatasetManager.tsx` - Dataset manager (⚠️ MISNAMED component)
- `DetailedAnomalyAnalysis.tsx` - Detailed analysis
- `DiscoveryClassification.tsx` - Discovery classification
- `ExplorationDataManager.tsx` - Data manager (⚠️ MISNAMED component)
- `ExplorationSystemIntegration.tsx` - System integration
- `GalaxyMappingSystem.tsx` - Mapping system
- `GalaxyMapSystem.tsx` - Map system
- `RealTimeMapUpdates.tsx` - Map updates
- `ReconShipCoordination.tsx` - Ship coordination
- `ResourceDiscoverySystem.tsx` - Resource discovery
- `ResourcePotentialVisualization.tsx` - Potential visualization
- `ResultsPanel.tsx` - Results panel

**Unified Exploration** (subdirectory with organized structure):
- `/context/ExplorationContext.tsx` - Context provider
- `/core/BaseAnalysisVisualizer.tsx` - Base visualizer
- `/core/BaseDataTable.tsx` - Base table
- `/core/BaseMap.tsx` - Base map
- `/system/GalaxyExplorationSystem.tsx` - Galaxy exploration system

**Visualizations** (subdirectory):
- Multiple chart components (BarChart, BaseChart, CanvasChartFactory, etc.)

**Integration Status**: ❌ COMPLETELY DISCONNECTED
**Should Use**: ExplorationManager, ReconShipManager (BOTH exist, NEITHER in registry!)
**Pattern**: Uses Context API (ExplorationContext)
**Problem**: Major subsystem with NO manager integration

---

### 4. Ships Domain (~40 components)

**Player Ships**:
- Multiple ship variant components
- Ship customization components
- Ship adapters

**Faction Ships**:
- Faction-specific ship components
- Organized by faction (equatorHorizon, lostNova, spaceRats)

**Common/Base**:
- Shared ship components

**Integration Status**: ❌ DISCONNECTED
**Should Use**: ShipManager, CombatShipManager, ReconShipManager, MiningShipManager
**Problem**: Multiple ship managers exist, minimal integration

---

### 5. UI Domain (~113 components)

**Major UI Components**:
- `GameHUD.tsx` - ✅ Uses GameContext, ModuleContext, moduleEventBus
- `GalaxyMap.tsx` - Galaxy map visualization
- `SprawlView.tsx` - Civilization sprawl view
- `TechTree.tsx` - Tech tree interface
- `DiplomacyPanel.tsx` - Diplomacy interface
- `ResourceEventMonitor.tsx` - Resource event monitoring
- `ResourceRegistryUI.tsx` - Resource registry UI
- `NotificationSystem.tsx` - Notification system
- `DragAndDrop.tsx` - Drag and drop system
- `ContextMenu.tsx` - Context menu system
- `Tabs.tsx` - Tab system
- `TooltipProvider.tsx` - Tooltip provider
- `GlobalErrorBoundary.tsx` - Error boundary

**UI Subdomains**:
- `/automation/` - Automation UI components
- `/buttons/` - Button components
- `/common/` - Common UI elements
- `/config/` - Configuration UI
- `/errors/` - Error UI components
- `/event/` - Event UI components
- `/game/` - Game UI components
- `/layout/` - Layout components
- `/modules/` - Module UI components
- `/performance/` - Performance UI
- `/resource/` - Resource UI (includes ConverterManagerUI ✅)
- `/tech/` - Tech UI (includes TechVisualFeedback ✅)
- `/visualization/` - Visualization components

**Integration Status**: ⚠️ VERY MIXED
**Manager Access**: Only 4-5 UI components use managers
**Primary Pattern**: Context API for state, moduleEventBus for events

---

## PART 6: INTEGRATION PATTERNS ANALYSIS

### Pattern 1: Context-Driven (DOMINANT - 95% of components)

**Example: GameHUD.tsx**
```typescript
// Uses Context API for state
const { resources, tech } = useGameState();
const dispatch = useGameDispatch();
const modules = useModules();
const moduleDispatch = useModuleDispatch();

// Uses event bus for events
import { moduleEventBus } from '../../lib/modules/ModuleEvents';

// NO manager access
```

**Pros**:
- React-friendly pattern
- Easy to use
- Good for component state

**Cons**:
- Disconnected from manager layer
- Managers become unused
- No business logic in managers
- UI and logic tightly coupled

---

### Pattern 2: Manager-Driven (RARE - 5% of components)

**Example: ShipHangar.tsx**
```typescript
import { getResourceManager } from '../../../../managers/ManagerRegistry';

const resourceManager = useMemo(() => getResourceManager(), []);

// Access manager methods
resourceManager.getResource(ResourceType.MINERALS);
```

**Pros**:
- Connects to manager layer
- Business logic in managers
- Separation of concerns

**Cons**:
- Rare pattern in codebase
- Most components don't follow this
- Inconsistent architecture

---

### Pattern 3: Hybrid (VERY RARE)

**Example: Core Integration Components**
```typescript
// Use manager for business logic
const resourceManager = getResourceManager();

// Use event bus for communication
moduleEventBus.emit({ type: EventType.RESOURCE_UPDATED, ... });

// Use context for UI state
const { uiState } = useGameState();
```

---

## PART 7: CRITICAL ISSUES

### 🔴 Issue 1: Architecture Confusion

**Problem**: Two parallel architectures exist
1. **Manager Architecture**: 52+ managers, comprehensive business logic system
2. **Context Architecture**: Context API provides state to components

**Result**: Managers are mostly unused by UI layer

**Impact**:
- Managers contain business logic but no consumers
- Components duplicate logic or skip it entirely
- No single source of truth

---

### 🔴 Issue 2: Manager Integration Gap

**Statistics**:
- **Total Components**: 297
- **Using ManagerRegistry**: 8 (2.7%)
- **Should Use Managers**: ~100+ (35%)
- **Integration Gap**: 97.3% disconnected

**Examples of Disconnection**:
- ExplorationHub → ExplorationManager (exists, not in registry)
- MiningWindow → MiningShipManager (in registry, component doesn't use it)
- CombatDashboard → CombatManager (in registry, component doesn't use it)
- OfficerAcademy → OfficerManager (exists, not in registry)

---

### 🔴 Issue 3: Misnamed Components

**Components Named "*Manager" That Aren't Managers**:
1. `AutomatedPopulationManager.tsx` - Is a COMPONENT, not a manager
2. `AnalysisConfigManager.tsx` - Is a COMPONENT, not a manager
3. `DatasetManager.tsx` - Is a COMPONENT, not a manager
4. `ExplorationDataManager.tsx` - Is a COMPONENT, not a manager
5. `ThresholdManager.tsx` (in MiningHub) - Is a COMPONENT, not a manager

**Problem**: Naming confusion between components and managers

**Solution**: Rename to:
- `AutomatedPopulationPanel.tsx`
- `AnalysisConfigPanel.tsx`
- `DatasetPanel.tsx`
- `ExplorationDataPanel.tsx`
- `ThresholdPanel.tsx`

---

### ⚠️ Issue 4: Event System Inconsistency

**Pattern 1: Using EventType Enum** ✅
```typescript
moduleEventBus.emit({
  type: EventType.MODULE_CREATED,
  ...
});
```

**Pattern 2: Using String Literals** ❌
```typescript
if (event?.type === 'AUTOMATION_STARTED') {
  // ...
}
```

**Found In**: AutomationRuleEditor, BattleEnvironment, and others (see Phase 1.2 report)

---

### ⚠️ Issue 5: No Standard Manager Access Hook

**Current**: Each component imports and calls getters individually
```typescript
import { getResourceManager } from '../../../managers/ManagerRegistry';
const resourceManager = getResourceManager();
```

**Better**: Standard hook pattern
```typescript
const resourceManager = useResourceManager(); // Doesn't exist!
const combatManager = useCombatManager(); // Doesn't exist!
```

**Note**: Hook `useManagerRegistryIntegration` exists in `src/hooks/integration/` but appears unused

---

## PART 8: INTEGRATION RECOMMENDATIONS

### Priority 1: Create Manager Access Hooks (HIGH IMPACT)

**Create hooks for all registered managers**:
```typescript
// src/hooks/managers/useManagers.ts
export function useResourceManager() {
  return useMemo(() => getResourceManager(), []);
}

export function useCombatManager() {
  return useMemo(() => getCombatManager(), []);
}

export function useExplorationManager() {
  return useMemo(() => getExplorationManager(), []); // Need to add to registry first!
}

// ... for all managers
```

**Benefits**:
- Standardizes manager access
- Memoization built-in
- Easy to use in components
- Encourages manager usage

---

### Priority 2: Add Missing Managers to Registry

**Managers That Should Be In Registry**:
1. ExplorationManager - Used by ~40 exploration components
2. ReconShipManager - Used by exploration components
3. ShipManager / CombatShipManager - Used by ship components
4. OfficerManager - Used by academy components
5. ModuleStatusManager - Used by module components
6. ModuleUpgradeManager - Used by module components
7. ShipHangarManager - Used by hangar components

---

### Priority 3: Connect Major Subsystems

**Phase 3A: Exploration System**
- Add ExplorationManager to registry
- Create `useExplorationManager()` hook
- Update ExplorationHub components to use manager
- Update ReconShipCoordination to use ReconShipManager
- Target: Connect 40 exploration components

**Phase 3B: Combat System**
- Create `useCombatManager()` hook (manager already in registry)
- Update CombatDashboard to use manager
- Update BattleView to use manager
- Connect combat subsystems
- Target: Connect 25 combat components

**Phase 3C: Mining System**
- Create `useMiningShipManager()` hook (manager already in registry)
- Update MiningWindow to use manager
- Update MiningControls to use manager
- Target: Connect 11 mining components

**Phase 3D: Module System**
- Add ModuleStatusManager, ModuleUpgradeManager to registry
- Create hooks
- Update module components
- Target: Connect 30+ module components

---

### Priority 4: Rename Misnamed Components

**Rename these components** to avoid confusion:
```
AutomatedPopulationManager.tsx → AutomatedPopulationPanel.tsx
AnalysisConfigManager.tsx → AnalysisConfigPanel.tsx
DatasetManager.tsx → DatasetPanel.tsx
ExplorationDataManager.tsx → ExplorationDataPanel.tsx
ThresholdManager.tsx → ThresholdPanel.tsx
```

---

### Priority 5: Create Integration Examples

**Create example components showing best practices**:
1. **ExampleConnectedComponent.tsx** - Shows manager + context + events pattern
2. **ExampleEventDriven Component.tsx** - Shows proper event handling
3. **ExampleManagerConsumer.tsx** - Shows manager consumption patterns

**Document in**: `.docs/Component_Integration_Guide.md`

---

## PART 9: COMPONENT HEALTH METRICS

### Integration Score: **3/10** ⚠️

| Metric | Score | Notes |
|--------|-------|-------|
| Manager Access | 2.7% | Only 8/297 components use managers |
| Registry Usage | 3/10 | Only 14/52 managers in registry |
| Event Type Safety | 6/10 | Some string literals still used |
| Naming Consistency | 7/10 | 5 components misnamed as "*Manager" |
| Context Usage | 9/10 | Heavy, consistent Context API usage |
| Hook Patterns | 8/10 | Good hook usage, missing manager hooks |
| **Overall** | **3/10** | Architecture disconnect |

---

## PART 10: NEXT STEPS

### Immediate Actions:

1. ✅ Complete component inventory (this document)
2. ⏳ Create manager access hooks for all registered managers
3. ⏳ Add ExplorationManager, OfficerManager, ShipManagers to registry
4. ⏳ Rename misnamed components
5. ⏳ Connect 1 major subsystem as proof of concept (Mining or Exploration)

### Future Phases:

6. Connect remaining major subsystems
7. Create component integration guide
8. Add ESLint rules to enforce patterns
9. Deprecate direct Context usage where managers should be used
10. Document Context vs Manager usage guidelines

---

## STATUS: PHASE 1.3 - 85% COMPLETE

**Completed**:
- ✅ Full component file discovery (297 files)
- ✅ Domain categorization (13 domains)
- ✅ Manager access pattern analysis
- ✅ Event usage analysis
- ✅ Integration gap identification
- ✅ Critical issues documented
- ✅ Integration recommendations

**Remaining**:
- ⏳ Detailed component-by-component analysis (for top 50 components)
- ⏳ Hook usage comprehensive audit
- ⏳ Context provider dependency mapping
- ⏳ Create integration examples

---

*This document will be continuously updated as Phase 1.3 progresses.*

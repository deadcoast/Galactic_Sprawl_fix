# {{PROJECT_NAME}} Technical Structure Report

## Executive Summary

This report provides an analysis of the {{PROJECT_NAME}} codebase structure, organization, and potential areas for improvement.

## Duplication Analysis

### Identical Files

The following files have identical implementations and should be consolidated:

- Files with hash 96da1e09:
  - `src/components/buildings/modules/ExplorationHub/ReconShipStatus.tsx`
  - `src/components/ships/player/variants/reconships/ReconShipStatus.tsx`

- Files with hash 7215ee9c:
  - `src/components/ui/resource/ConverterDetailsView.css`
  - `src/modules/ModuleManagerWrapper.test.ts`



### Similar Files

Several components have multiple implementations:

### UI Components

- `HabitableWorld.tsx` (2 implementations):
  - `src/components/buildings/colony/HabitableWorld.tsx`
  - `src/effects/component_effects/HabitableWorld.tsx`

- `ExplorationHub.tsx` (2 implementations):
  - `src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx`
  - `src/effects/component_effects/ExplorationHub.tsx`

- `ReconShipStatus.tsx` (2 implementations):
  - `src/components/buildings/modules/ExplorationHub/ReconShipStatus.tsx`
  - `src/components/ships/player/variants/reconships/ReconShipStatus.tsx`

- `BarChart.tsx` (2 implementations):
  - `src/components/exploration/visualizations/charts/BarChart.tsx`
  - `src/components/ui/visualizations/BarChart.tsx`

- `Button.tsx` (4 implementations):
  - `src/components/ui/Button.tsx`
  - `src/components/ui/common/Button.tsx`
  - `src/ui/components/Button/Button.tsx`
  - `src/ui/components/Button.tsx`

- `Card.tsx` (3 implementations):
  - `src/components/ui/Card.tsx`
  - `src/ui/components/Card/Card.tsx`
  - `src/ui/components/Card.tsx`

- `GlobalErrorBoundary.tsx` (2 implementations):
  - `src/components/ui/GlobalErrorBoundary.tsx`
  - `src/errorHandling/GlobalErrorBoundary.tsx`

- `AbilityButton.tsx` (2 implementations):
  - `src/components/ui/buttons/AbilityButton.tsx`
  - `src/ui/components/Button/variants/AbilityButton.tsx`

- `Badge.tsx` (3 implementations):
  - `src/components/ui/common/Badge.tsx`
  - `src/ui/components/Badge/Badge.tsx`
  - `src/ui/components/Badge.tsx`

- `ErrorBoundary.tsx` (2 implementations):
  - `src/components/ui/errors/ErrorBoundary.tsx`
  - `src/errorHandling/ErrorBoundary.tsx`

- `ErrorFallback.tsx` (2 implementations):
  - `src/components/ui/errors/ErrorFallback.tsx`
  - `src/errorHandling/ErrorFallback.tsx`

- `ModuleCard.tsx` (2 implementations):
  - `src/components/ui/modules/ModuleCard.tsx`
  - `src/ui/components/Card/variants/ModuleCard.tsx`

- `ResourceFlowDiagram.tsx` (2 implementations):
  - `src/components/ui/resource/ResourceFlowDiagram.tsx`
  - `src/components/ui/visualizations/ResourceFlowDiagram.tsx`

- `Chart.tsx` (2 implementations):
  - `src/components/ui/visualizations/Chart.tsx`
  - `src/visualization/Chart.tsx`

### Service/Manager Files

- `ServiceRegistry.ts` (3 implementations):
  - `src/lib/managers/ServiceRegistry.ts`
  - `src/lib/registry/ServiceRegistry.ts`
  - `src/lib/services/ServiceRegistry.ts`

- `ParticleSystemManager.ts` (2 implementations):
  - `src/managers/effects/ParticleSystemManager.ts`
  - `src/managers/game/ParticleSystemManager.ts`

- `ModuleManagerWrapper.test.ts` (2 implementations):
  - `src/managers/module/ModuleManagerWrapper.test.ts`
  - `src/modules/ModuleManagerWrapper.test.ts`

- `ShipHangarManager.ts` (2 implementations):
  - `src/managers/module/ShipHangarManager.ts`
  - `src/managers/ships/ShipHangarManager.ts`

### Type Definitions

- `BaseTypedEventEmitter.ts` (2 implementations):
  - `src/lib/events/BaseTypedEventEmitter.ts`
  - `src/lib/modules/BaseTypedEventEmitter.ts`

- `ResourceFlowTypes.ts` (2 implementations):
  - `src/managers/resource/ResourceFlowTypes.ts`
  - `src/types/resources/ResourceFlowTypes.ts`

- `ModuleTypes.ts` (2 implementations):
  - `src/types/buildings/ModuleTypes.ts`
  - `src/types/modules/ModuleTypes.ts`

- `EventTypes.ts` (2 implementations):
  - `src/types/events/EventTypes.ts`
  - `src/types/ui/EventTypes.ts`

- `ExplorationTypes.ts` (2 implementations):
  - `src/types/exploration/ExplorationTypes.ts`
  - `src/types/exploration/unified/ExplorationTypes.ts`

- `ResourceTypeConverter.ts` (3 implementations):
  - `src/types/resources/ResourceTypeConverter.ts`
  - `src/utils/ResourceTypeConverter.ts`
  - `src/utils/resources/ResourceTypeConverter.ts`

- `ResourceTypeMigration.ts` (2 implementations):
  - `src/utils/ResourceTypeMigration.ts`
  - `src/utils/resources/ResourceTypeMigration.ts`

### Utility Functions

- `factions.ts` (2 implementations):
  - `src/config/factions/factions.ts`
  - `src/config/factions.ts`

- `useModuleEvents.ts` (2 implementations):
  - `src/hooks/events/useModuleEvents.ts`
  - `src/hooks/modules/useModuleEvents.ts`

- `EventBatcher.ts` (2 implementations):
  - `src/lib/events/EventBatcher.ts`
  - `src/utils/events/EventBatcher.ts`

- `ModuleEvents.ts` (2 implementations):
  - `src/lib/modules/ModuleEvents.ts`
  - `src/types/events/ModuleEvents.ts`

- `geometry.ts` (2 implementations):
  - `src/types/geometry.ts`
  - `src/utils/geometry.ts`

### Other Files

- `README.md` (10 implementations):
  - `README.md`
  - `analyze-codebase/README.md`
  - `essential/README.md`
  - `src/components/ui/errors/README.md`
  - `src/components/ui/optimized/README.md`
  - `src/components/ui/virtualized/README.md`
  - `src/errorHandling/README.md`
  - `src/tests/README.md`
  - `src/types/README.md`
  - `src/utils/dataTransforms/README.md`

- `package-lock.json` (2 implementations):
  - `analyze-codebase/package-lock.json`
  - `package-lock.json`

- `package.json` (2 implementations):
  - `analyze-codebase/package.json`
  - `package.json`

- `index.html` (2 implementations):
  - `index.html`
  - `playwright-report/index.html`



### Empty Files

The following files are empty or contain only whitespace:

- `src/config/game/gameConfig.ts`
- `src/lib/ai/behaviorTree.ts`
- `src/pages/ConverterManagementPage.tsx`
- `src/types/common.ts`
- `src/types/index.ts`


## Recommendations

1. **Consolidate Duplicated Files**: Merge the identical files to avoid maintenance overhead.
2. **Review Similar Implementations**: Examine the similarly named files to check for duplicated functionality.
3. **Clean Up Empty Files**: Either implement the intended functionality or remove empty placeholder files.

---

*Report generated on: Sun Mar 23 2025*

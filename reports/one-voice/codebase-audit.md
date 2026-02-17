# One Voice Codebase Audit

Generated: 2026-02-16T06:49:48.302Z

## Summary
- Runtime source files: 796
- Graph source files: 796
- Duplicated basenames: 33
- Large files (>= 1200 lines): 17
- Files with TODO/deprecated/stub markers: 116 (391 total markers)
- Circular dependency groups: 9
- Reachable from entrypoints: 185 / 796
- Disconnected from entrypoints: 612
- Unresolved local imports: 23
- Missing tools/* script targets: 14

## Entrypoints
- main.tsx
- workers/worker.ts
- workers/ResourceFlowWorker.ts
- workers/combatWorker.ts
- workers/DataProcessingWorker.ts

## Disconnected Files By Directory
| Directory | Count |
| --- | --- |
| components | 272 |
| hooks | 61 |
| utils | 54 |
| types | 53 |
| ui | 32 |
| effects | 29 |
| tests | 25 |
| managers | 20 |
| config | 13 |
| lib | 10 |
| errorHandling | 8 |
| contexts | 6 |
| initialization | 6 |
| pages | 6 |
| resource | 5 |
| services | 4 |
| styles | 2 |
| api | 1 |
| eslint-rules | 1 |
| router | 1 |
| systems | 1 |
| visualization | 1 |
| vite-env.d.ts | 1 |

## Top Duplicate Basenames
| Basename | Count | Sample Paths |
| --- | --- | --- |
| index.ts | 35 | components/exploration/core/index.ts<br/>components/exploration/index.ts<br/>components/exploration/visualizations/index.ts |
| Badge.tsx | 4 | components/ui/Badge.tsx<br/>components/ui/common/Badge.tsx<br/>ui/components/Badge.tsx |
| Button.tsx | 3 | components/ui/common/Button.tsx<br/>ui/components/Button.tsx<br/>ui/components/Button/Button.tsx |
| ServiceRegistry.ts | 3 | lib/managers/ServiceRegistry.ts<br/>lib/registry/ServiceRegistry.ts<br/>lib/services/ServiceRegistry.ts |
| AbilityButton.tsx | 2 | components/ui/buttons/AbilityButton.tsx<br/>ui/components/Button/variants/AbilityButton.tsx |
| BarChart.tsx | 2 | components/exploration/visualizations/BarChart.tsx<br/>components/ui/visualization/BarChart.tsx |
| BaseAnalysisVisualizer.tsx | 2 | components/exploration/core/BaseAnalysisVisualizer.tsx<br/>components/ui/showcase/BaseAnalysisVisualizer.tsx |
| Card.tsx | 2 | ui/components/Card.tsx<br/>ui/components/Card/Card.tsx |
| Chart.tsx | 2 | components/ui/visualization/Chart.tsx<br/>visualization/Chart.tsx |
| Divider.tsx | 2 | components/ui/Divider.tsx<br/>ui/components/Divider.tsx |
| ErrorBoundary.tsx | 2 | components/ui/errors/ErrorBoundary.tsx<br/>errorHandling/ErrorBoundary.tsx |
| ErrorFallback.tsx | 2 | components/ui/errors/ErrorFallback.tsx<br/>errorHandling/ErrorFallback.tsx |
| ErrorLoggingService.ts | 2 | services/ErrorLoggingService.ts<br/>services/logging/ErrorLoggingService.ts |
| EventBatcher.ts | 2 | lib/events/EventBatcher.ts<br/>utils/events/EventBatcher.ts |
| EventTypes.ts | 2 | types/events/EventTypes.ts<br/>types/ui/EventTypes.ts |
| ExplorationHub.tsx | 2 | components/buildings/modules/ExplorationHub/ExplorationHub.tsx<br/>effects/component_effects/ExplorationHub.tsx |
| FactionShipTypes.ts | 2 | types/factions/FactionShipTypes.ts<br/>types/ships/FactionShipTypes.ts |
| geometry.ts | 2 | types/geometry.ts<br/>utils/geometry.ts |
| GlobalErrorBoundary.tsx | 2 | components/ui/GlobalErrorBoundary.tsx<br/>errorHandling/GlobalErrorBoundary.tsx |
| HabitableWorld.tsx | 2 | components/buildings/colony/HabitableWorld.tsx<br/>effects/component_effects/HabitableWorld.tsx |
| Icon.tsx | 2 | components/ui/Icon.tsx<br/>ui/components/Icon.tsx |
| ModuleCard.tsx | 2 | components/ui/modules/ModuleCard.tsx<br/>ui/components/Card/variants/ModuleCard.tsx |
| ModuleEvents.ts | 2 | lib/modules/ModuleEvents.ts<br/>types/events/ModuleEvents.ts |
| ModuleTypes.ts | 2 | types/buildings/ModuleTypes.ts<br/>types/modules/ModuleTypes.ts |
| ParticleSystemManager.ts | 2 | managers/effects/ParticleSystemManager.ts<br/>managers/game/ParticleSystemManager.ts |

## Top Large Files
| File | Lines | Markers |
| --- | --- | --- |
| config/automation/miningRules.ts | 8423 | 0 |
| services/AnalysisAlgorithmService.ts | 3712 | 15 |
| managers/resource/ResourceFlowManager.ts | 3369 | 25 |
| hooks/factions/useFactionBehavior.ts | 2790 | 14 |
| visualization/renderers/WebGLRenderer.tsx | 2603 | 0 |
| managers/module/ShipHangarManager.ts | 2525 | 0 |
| components/ui/showcase/DataDashboardApp.tsx | 1909 | 1 |
| components/ui/performance/VisualizationInspector.tsx | 1839 | 0 |
| components/exploration/DetailedAnomalyAnalysis.tsx | 1779 | 3 |
| visualization/renderers/CanvasRenderer.tsx | 1668 | 0 |
| components/exploration/system/GalaxyExplorationSystem.tsx | 1556 | 0 |
| components/ui/showcase/PerformanceMonitoringDashboard.tsx | 1496 | 0 |
| resource/subsystems/ResourceFlowSubsystem.ts | 1358 | 4 |
| contexts/ModuleContext.test.tsx | 1282 | 1 |
| managers/game/ResourceManager.ts | 1264 | 3 |
| managers/weapons/AdvancedWeaponEffectManager.ts | 1239 | 0 |
| components/buildings/modules/ExplorationHub/ExplorationHub.tsx | 1234 | 3 |

## Marker Hotspots
| File | Markers | Lines |
| --- | --- | --- |
| managers/resource/ResourceFlowManager.ts | 25 | 3369 |
| systems/exploration/DiscoveryClassification.ts | 17 | 491 |
| services/AnalysisAlgorithmService.ts | 15 | 3712 |
| hooks/factions/useFactionBehavior.ts | 14 | 2790 |
| managers/resource/ResourceIntegration.ts | 13 | 661 |
| components/ui/resource/ConverterManagerUI.tsx | 13 | 408 |
| managers/ships/ShipManager.ts | 12 | 864 |
| hooks/combat/useCombatAI.ts | 11 | 508 |
| managers/mining/MiningShipManager.ts | 9 | 722 |
| lib/modules/ModuleEvents.ts | 9 | 464 |
| contexts/ModuleContext.tsx | 8 | 915 |
| managers/automation/GlobalAutomationManager.ts | 7 | 776 |
| components/exploration/ExplorationDataManager.tsx | 7 | 622 |
| components/combat/formations/FormationTacticsPanel.tsx | 7 | 395 |
| hooks/automation/useAutomation.ts | 7 | 118 |
| components/buildings/modules/MiningHub/MiningWindow.tsx | 6 | 854 |
| workers/worker.ts | 6 | 188 |
| managers/resource/ResourceConversionManager.ts | 5 | 964 |
| components/ui/automation/AutomationVisualization.tsx | 5 | 524 |
| lib/managers/BaseManager.ts | 5 | 462 |
| registry/ResourceRegistryIntegration.ts | 5 | 367 |
| errorHandling/utils/migration.ts | 5 | 184 |
| components/ui/game/index.ts | 5 | 164 |
| components/ui/navigation/index.ts | 5 | 117 |
| resource/subsystems/ResourceFlowSubsystem.ts | 4 | 1358 |

## Circular Dependency Samples
| Length | Cycle |
| --- | --- |
| 5 | lib/ai/shipBehavior.ts -> lib/ai/shipMovement.ts -> managers/ManagerRegistry.ts -> managers/combat/combatManager.ts -> managers/mining/MiningShipManager.ts |
| 5 | resource/ResourceSystem.ts -> resource/subsystems/ResourceFlowSubsystem.ts -> resource/subsystems/ResourceStorageSubsystem.ts -> resource/subsystems/ResourceThresholdSubsystem.ts -> resource/subsystems/ResourceTransferSubsystem.ts |
| 4 | visualization/Chart.tsx -> visualization/renderers/CanvasRenderer.tsx -> visualization/renderers/SVGRenderer.tsx -> visualization/renderers/WebGLRenderer.tsx |
| 3 | lib/events/UnifiedEventSystem.ts -> lib/managers/BaseManager.ts -> services/logging/ErrorLoggingService.ts |
| 3 | types/resources/ProductionChainTypes.ts -> types/resources/ResourceConversionTypes.ts -> types/resources/ResourceTypes.ts |
| 2 | hooks/resources/useResourceTracking.ts -> types/resources/ResourceSerializationTypes.ts |
| 2 | managers/module/ModuleManager.ts -> managers/module/ModuleStatusManager.ts |
| 2 | types/ships/FactionShipTypes.ts -> types/ships/ShipTypes.ts |
| 1 | lib/modules/ModuleEvents.ts |

## Unresolved Local Imports
| File | Specifier |
| --- | --- |
| App.tsx | ./pages/ExplorationMap |
| App.tsx | ./pages/FleetManagement |
| App.tsx | ./pages/ResearchTree |
| components/ui/index.ts | ./Button |
| components/ui/index.ts | ./Card |
| components/ui/index.ts | ./showcase |
| components/ui/index.ts | ./accordion/Accordion |
| components/ui/index.ts | ./alert/Alert |
| components/ui/index.ts | ./avatar/Avatar |
| components/ui/index.ts | ./badge/Badge |
| components/ui/index.ts | ./breadcrumb/Breadcrumb |
| components/ui/index.ts | ./checkbox/Checkbox |
| components/ui/modules/ModuleCard.tsx | ./ModuleCard.css |
| components/ui/modules/ModuleGrid.tsx | ./ModuleGrid.css |
| components/ui/modules/ModuleUpgradeVisualization.tsx | ./ModuleUpgradeVisualization.css |
| components/ui/resource/ConverterDetailsView.tsx | ./ConverterDetailsView.css |
| hooks/integration/useResourceSystemIntegration.ts | ../store/hooks |
| hooks/integration/useResourceSystemIntegration.ts | ../../store/slices/resourceSlice |
| lib/optimization/RenderBatcher.d.ts | ../utils/EventEmitter |
| lib/registry/ServiceRegistry.ts | ../lib/registry/ServiceRegistry |
| utils/events/EventDispatcher.tsx | ../utils/events/EventDispatcher |
| utils/resources/ResourceTypeMigration.ts | ../../types/resources/LegacyResourceTypes |
| visualization/index.ts | ./visualization |

## Missing Tools Script Targets
| Script | Missing Target |
| --- | --- |
| fix-imports | tools/fix-imports.js |
| fix-imports-v2 | tools/fix-imports-v2.js |
| format:prettier | tools/fix-eslint-by-rule.js |
| lint:chart | tools/eslint-progress-chart.js |
| lint:fix-rule | tools/fix-eslint-by-rule.js |
| lint:fix-top | tools/fix-eslint-by-rule.js |
| lint:status | tools/eslint-progress-chart.js |
| lint:status | tools/fix-eslint-by-rule.js |
| lint:track | tools/track-eslint-progress.js |
| lint:workflow | tools/run-lint-workflow.mjs |
| lint:workflow:analyze | tools/run-lint-workflow.mjs |
| lint:workflow:auto-fix | tools/run-lint-workflow.mjs |
| lint:workflow:interactive | tools/run-lint-workflow.mjs |
| typecheck:specific | tools/run-typecheck.mjs |

## Legacy Path Candidates
- components/buildings/modules/MiningHub/ThresholdManager.tsx
- components/buildings/modules/MiningHub/ThresholdPresetsPanel.tsx
- components/buildings/modules/MiningHub/ThresholdStatusIndicator.tsx
- components/core/ThresholdIntegration.tsx
- components/ui/resource/ResourceThresholdVisualization.tsx
- contexts/ThresholdContext.tsx
- contexts/ThresholdTypes.ts
- managers/resource/ResourceThresholdManager.ts
- resource/subsystems/ResourceThresholdSubsystem.ts

# src code tree

```
src/
├── api/
│   └── TypeSafeApiClient.ts
├── components/
│   ├── combat/
│   │   ├── alerts/
│   │   │   └── AlertSystemUI.tsx
│   │   ├── formations/
│   │   │   ├── FormationEditor.tsx
│   │   │   ├── FormationPresetList.tsx
│   │   │   ├── FormationTacticsContainer.tsx
│   │   │   ├── FormationTacticsPage.tsx
│   │   │   ├── FormationTacticsPanel.tsx
│   │   │   ├── FormationVisualizer.tsx
│   │   │   ├── TacticalBehaviorSelector.tsx
│   │   │   └── TacticalBonusCard.tsx
│   │   ├── radar/
│   │   │   ├── DetectionVisualization.tsx
│   │   │   ├── RadarSweepAnimation.tsx
│   │   │   └── RangeIndicators.tsx
│   │   ├── BattleEnvironment.tsx
│   │   ├── BattleView.tsx
│   │   ├── CombatDashboard.tsx
│   │   ├── CombatSystemDemo.tsx
│   │   ├── FleetDetails.tsx
│   │   └── SalvageSystem.tsx
│   ├── core/
│   │   ├── IntegrationErrorHandler.tsx
│   │   ├── SystemIntegration.tsx
│   │   └── ThresholdIntegration.tsx
│   ├── debug/
│   │   ├── AIDebugOverlay.tsx
│   │   └── GameStateMonitor.tsx
│   ├── exploration/
│   │   ├── unified/
│   │   │   ├── context/
│   │   │   │   └── ExplorationContext.tsx
│   │   │   ├── core/
│   │   │   │   ├── BaseAnalysisVisualizer.tsx
│   │   │   │   ├── BaseDataTable.tsx
│   │   │   │   ├── BaseMap.tsx
│   │   │   │   └── index.ts
│   │   │   ├── system/
│   │   │   │   └── GalaxyExplorationSystem.tsx
│   │   │   └── index.ts
│   │   ├── visualizations/
│   │   │   ├── charts/
│   │   │   │   ├── BarChart.tsx
│   │   │   │   ├── BaseChart.tsx
│   │   │   │   ├── CanvasChartFactory.tsx
│   │   │   │   ├── CanvasLineChart.tsx
│   │   │   │   ├── CanvasScatterPlot.tsx
│   │   │   │   ├── ClusterVisualization.tsx
│   │   │   │   ├── HeatMap.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── LineChart.tsx
│   │   │   │   ├── MemoryOptimizedCanvasChart.tsx
│   │   │   │   ├── MemoryOptimizedCharts.tsx
│   │   │   │   ├── PopulationProjectionChart.tsx
│   │   │   │   ├── PredictionVisualization.tsx
│   │   │   │   ├── ResourceDistributionChart.tsx
│   │   │   │   ├── ResourceFlowDiagram.tsx
│   │   │   │   ├── ResourceMappingVisualization.tsx
│   │   │   │   ├── ScatterPlot.tsx
│   │   │   │   ├── TooltipAdapter.tsx
│   │   │   │   ├── ViewportOptimizedHeatMap.tsx
│   │   │   │   ├── ViewportOptimizedScatterPlot.tsx
│   │   │   │   ├── VirtualizedDataTable.tsx
│   │   │   │   └── VirtualizedLineChart.tsx
│   │   │   ├── AnalysisVisualization.tsx
│   │   │   └── withMemoryManagement.tsx
│   │   ├── AdvancedFilteringSystem.tsx
│   │   ├── AnalysisConfigManager.tsx
│   │   ├── AnomalyAnalysis.tsx
│   │   ├── AutomatedSectorScanner.tsx
│   │   ├── DataAnalysisSystem.tsx
│   │   ├── DataFilterPanel.tsx
│   │   ├── DataPointVirtualList.tsx
│   │   ├── DatasetManager.tsx
│   │   ├── DetailedAnomalyAnalysis.tsx
│   │   ├── DiscoveryClassification.tsx
│   │   ├── ExplorationDataManager.tsx
│   │   ├── ExplorationSystemIntegration.tsx
│   │   ├── GalaxyMappingSystem.tsx
│   │   ├── GalaxyMapSystem.tsx
│   │   ├── RealTimeMapUpdates.tsx
│   │   ├── ReconShipCoordination.tsx
│   │   ├── ResourceDiscoverySystem.tsx
│   │   ├── ResourcePotentialVisualization.tsx
│   │   └── ResultsPanel.tsx
│   ├── factions/
│   │   ├── FactionAI.tsx
│   │   └── FactionManager.tsx
│   ├── performance/
│   │   ├── DeviceCapabilityReport.tsx
│   │   ├── GeographicAnalysisDashboard.tsx
│   │   ├── LongSessionMemoryVisualizer.tsx
│   │   ├── MultitabPerformanceLauncher.tsx
│   │   └── MultitabPerformanceResults.tsx
│   ├── providers/
│   │   └── ServiceProvider.tsx
│   ├── ships/
│   │   ├── base/
│   │   │   └── BaseShip.tsx
│   │   ├── common/
│   │   │   ├── CommonShipMovement.tsx
│   │   │   ├── CommonShipStats.tsx
│   │   │   ├── EquatorHorizonShip.tsx
│   │   │   ├── FactionFleet.tsx
│   │   │   ├── FactionShipBase.tsx
│   │   │   ├── FactionShipStats.tsx
│   │   │   ├── LostNovaShip.tsx
│   │   │   └── SpaceRatShip.tsx
│   │   ├── FactionShips/
│   │   │   ├── equatorHorizon/
│   │   │   │   ├── CelestialArbiter.tsx
│   │   │   │   ├── EtherealGalleon.tsx
│   │   │   │   └── StellarEquinox.tsx
│   │   │   ├── lostNova/
│   │   │   │   ├── DarkMatterReaper.tsx
│   │   │   │   ├── EclipseScythe.tsx
│   │   │   │   └── NullHunter.tsx
│   │   │   ├── spaceRats/
│   │   │   │   ├── AsteroidMarauder.tsx
│   │   │   │   ├── RatKing.tsx
│   │   │   │   └── RogueNebula.tsx
│   │   │   └── FactionDashboard.tsx
│   │   └── player/
│   │       ├── adapters/
│   │       │   └── ShipAdapter.tsx
│   │       ├── base/
│   │       │   ├── PlayerShipBase.tsx
│   │       │   └── PlayerShipStats.tsx
│   │       ├── customization/
│   │       │   ├── PlayerShipCustomization.tsx
│   │       │   ├── PlayerShipUpgrade.tsx
│   │       │   └── PlayerShipUpgradeSystem.tsx
│   │       └── variants/
│   │           ├── miningships/
│   │           │   └── VoidDredgerMiner.tsx
│   │           ├── reconships/
│   │           │   ├── ReconShipControl.tsx
│   │           │   └── ReconShipStatus.tsx
│   │           └── warships/
│   │               ├── HarbringerGalleon.tsx
│   │               ├── MidwayCarrier.tsx
│   │               ├── MotherEarthRevenge.tsx
│   │               ├── OrionFrigate.tsx
│   │               ├── PlayerWarShipCombat.tsx
│   │               ├── Spitflare.tsx
│   │               ├── StarSchooner.tsx
│   │               └── WarShip.tsx
│   ├── trade/
│   ├── ui/
│   │   ├── automation/
│   │   │   ├── AutomationRuleEditor.css
│   │   │   ├── AutomationRuleEditor.tsx
│   │   │   └── AutomationVisualization.tsx
│   │   ├── buttons/
│   │   │   └── AbilityButton.tsx
│   │   ├── common/
│   │   │   ├── Badge.tsx
│   │   │   └── Button.tsx
│   │   ├── config/
│   │   │   └── TypeSafeConfigDemo.tsx
│   │   ├── errors/
│   │   │   ├── ComponentErrorState.tsx
│   │   │   ├── ComponentSpecificErrorStates.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ErrorFallback.tsx
│   │   │   ├── ErrorHandlingExamples.tsx
│   │   │   ├── index.ts
│   │   │   ├── NetworkErrorFallback.tsx
│   │   │   ├── README.md
│   │   │   └── ResourceLoadingError.tsx
│   │   ├── event/
│   │   │   └── VirtualizedEventLog.tsx
│   │   ├── game/
│   │   │   ├── FactionBadge.tsx
│   │   │   ├── index.ts
│   │   │   ├── LazyMiniMap.tsx
│   │   │   ├── MiniMap.tsx
│   │   │   └── ShipDisplay.tsx
│   │   ├── modules/
│   │   │   ├── index.ts
│   │   │   ├── ModuleCard.tsx
│   │   │   ├── ModuleControls.tsx
│   │   │   ├── ModuleGrid.tsx
│   │   │   ├── ModuleHUD.tsx
│   │   │   ├── ModuleStatusDisplay.tsx
│   │   │   ├── ModuleStatusIndicator.tsx
│   │   │   ├── ModuleUpgradeDisplay.tsx
│   │   │   ├── ModuleUpgradeVisualization.tsx
│   │   │   └── SubModuleHUD.tsx
│   │   ├── optimized/
│   │   │   ├── index.ts
│   │   │   ├── MemoizedComponent.tsx
│   │   │   └── README.md
│   │   ├── overlays/
│   │   │   ├── Dialog.tsx
│   │   │   ├── Drawer.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Popover.tsx
│   │   ├── performance/
│   │   │   ├── AdvancedMetricAnalysis.tsx
│   │   │   ├── AnimationFrameManagerDemo.tsx
│   │   │   ├── AnimationPerformanceProfilerDemo.tsx
│   │   │   ├── AnimationQualityDemo.tsx
│   │   │   ├── BatchedUpdateDemo.tsx
│   │   │   ├── D3AccessorBenchmarkView.tsx
│   │   │   ├── D3PerformanceProfilerView.tsx
│   │   │   ├── DynamicBudgetAdjustmentPanel.tsx
│   │   │   ├── index.ts
│   │   │   ├── InterpolationMemoizationDemo.tsx
│   │   │   ├── MLPerformancePrediction.tsx
│   │   │   ├── OptimizationComparisonView.tsx
│   │   │   ├── OptimizedFlowDiagram.tsx
│   │   │   ├── PerformanceBenchmarkDashboard.tsx
│   │   │   ├── PerformanceBudgetTracker.tsx
│   │   │   ├── PerformanceRegressionReport.tsx
│   │   │   ├── performanceTypes.ts
│   │   │   ├── UserBehaviorCorrelationView.tsx
│   │   │   ├── VisualizationInspector.tsx
│   │   │   └── VisualizationPerformanceComparison.tsx
│   │   ├── profiling/
│   │   │   ├── index.ts
│   │   │   ├── ProfilingOverlay.css
│   │   │   └── ProfilingOverlay.tsx
│   │   ├── resource/
│   │   │   ├── ChainManagementInterface.css
│   │   │   ├── ChainManagementInterface.tsx
│   │   │   ├── ChainVisualization.tsx
│   │   │   ├── ConverterDashboard.css
│   │   │   ├── ConverterDashboard.tsx
│   │   │   ├── ConverterDetailsView.tsx
│   │   │   ├── ResourceBar.tsx
│   │   │   ├── ResourceDisplay.tsx
│   │   │   ├── ResourceForecastingVisualization.css
│   │   │   ├── ResourceForecastingVisualization.tsx
│   │   │   ├── ResourceGrid.tsx
│   │   │   ├── ResourceIcon.tsx
│   │   │   ├── ResourceManagementDashboard.css
│   │   │   ├── ResourceManagementDashboard.tsx
│   │   │   ├── ResourceOptimizationSuggestions.css
│   │   │   ├── ResourceOptimizationSuggestions.tsx
│   │   │   ├── ResourceOptimizationSuggestions.tsx.bak
│   │   │   ├── ResourceRateFiltering.tsx
│   │   │   ├── ResourceRatesDisplay.tsx
│   │   │   ├── ResourceRatesTrends.tsx
│   │   │   ├── ResourceRatesUI.tsx
│   │   │   ├── ResourceThresholdVisualization.tsx
│   │   │   ├── ResourceVisualizationEnhanced.tsx
│   │   │   ├── VirtualizedResourceDataset.tsx
│   │   │   └── VirtualizedResourceList.tsx
│   │   ├── showcase/
│   │   │   ├── BaseAnalysisVisualizer.tsx
│   │   │   ├── DataDashboardApp.tsx
│   │   │   └── PerformanceMonitoringDashboard.tsx
│   │   ├── status/
│   │   │   └── StatusEffect.tsx
│   │   ├── tech/
│   │   │   └── TechVisualFeedback.tsx
│   │   ├── visualization/
│   │   │   ├── AnomalyVisualization.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── Chart.tsx
│   │   │   ├── CustomShaderVisualization.tsx
│   │   │   ├── D3VisualizationErrorBoundary.tsx
│   │   │   ├── DataHighlightVisualization.tsx
│   │   │   ├── DataTransitionParticleSystem.tsx
│   │   │   ├── FlowDiagram.tsx
│   │   │   ├── HeatMapDensityVisualization.tsx
│   │   │   ├── LazyNetworkGraph.tsx
│   │   │   ├── LazyResourceFlowDiagram.tsx
│   │   │   ├── LineGraph.tsx
│   │   │   ├── NetworkGraph.tsx
│   │   │   ├── ParticleTransitionVisualization.tsx
│   │   │   ├── README.md
│   │   │   ├── ResourceFlowDiagram.tsx
│   │   │   ├── ResourceVisualization.tsx
│   │   │   ├── TemporalAnalysisView.tsx
│   │   │   └── VisualizationErrorBoundaries.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ContextMenu.tsx
│   │   ├── DiplomacyPanel.tsx
│   │   ├── DragAndDrop.tsx
│   │   ├── GalaxyMap.tsx
│   │   ├── GameHUD.tsx
│   │   ├── GlobalErrorBoundary.tsx
│   │   ├── index.ts
│   │   ├── NotificationSystem.tsx
│   │   ├── ResourceEventMonitor.tsx
│   │   ├── ResourceRegistryUI.tsx
│   │   ├── SprawlView.tsx
│   │   ├── Tabs.tsx
│   │   ├── TechTree.tsx
│   │   ├── tooltip-context.ts
│   │   ├── tooltip-context.tsx
│   │   ├── TooltipProvider.tsx
│   │   ├── VPRErrorBoundary.tsx
│   │   ├── VPRLoadingFallback.tsx
│   │   └── VPRStarSystemView.tsx
│   └── weapons/
│       ├── WeaponComponents.tsx
│       ├── WeaponControl.tsx
│       ├── WeaponSpecialization.tsx
│       ├── WeaponSystem.tsx
│       └── WeaponUpgradeSystem.tsx
├── config/
│   ├── automation/
│   │   ├── colonyRules.ts
│   │   ├── combatRules.ts
│   │   ├── explorationRules.ts
│   │   ├── hangarRules.ts
│   │   └── miningRules.ts
│   ├── combat/
│   │   ├── combatConfig.ts
│   │   └── weaponConfig.ts
│   ├── factions/
│   │   ├── factionConfig.ts
│   │   └── factions.ts
│   ├── game/
│   │   └── gameConfig.ts
│   ├── modules/
│   │   ├── defaultModuleConfigs.ts
│   │   └── upgradePathsConfig.ts
│   ├── resource/
│   │   └── ResourceConfig.ts
│   ├── ships/
│   │   ├── equatorHorizonShips.ts
│   │   ├── index.ts
│   │   ├── lostNovaShips.ts
│   │   ├── shipStats.ts
│   │   └── spaceRatsShips.ts
│   ├── factions.ts
│   ├── OfficerConfig.ts
│   └── ShipBlueprints.ts
├── contexts/
│   ├── ClassificationContext.tsx
│   ├── DataAnalysisContext.tsx
│   ├── GameContext.tsx
│   ├── ModuleContext.test.tsx
│   ├── ModuleContext.tsx
│   ├── ResourceRatesContext.tsx
│   ├── ShipContext.tsx
│   ├── ThemeContext.tsx
│   ├── ThresholdContext.tsx
│   └── ThresholdTypes.ts
├── effects/
│   ├── component_effects/
│   │   ├── BackgroundEffect.tsx
│   │   ├── BuildingUpgradeEffect.tsx
│   │   ├── CapitalShipEffect.tsx
│   │   ├── CentralMothership.tsx
│   │   ├── ColonyStarStation.tsx
│   │   ├── CombatAutomationEffect.tsx
│   │   ├── EngineTrailEffect.ts
│   │   ├── ExplorationHub.tsx
│   │   ├── ExplosionEffect.tsx
│   │   ├── FormationTransitionEffect.tsx
│   │   ├── HabitableWorld.tsx
│   │   ├── MineralProcessing.tsx
│   │   ├── ModuleUpgradeTransition.tsx
│   │   ├── MothershipSuperstructure.tsx
│   │   ├── PopulationIndicator.tsx
│   │   ├── ProgressionEffects.tsx
│   │   ├── ResourceFlowVisualization.tsx
│   │   ├── ShieldEffect.tsx
│   │   ├── ShieldImpactEffect.ts
│   │   ├── ShipPathEffect.tsx
│   │   ├── SmokeTrailEffect.tsx
│   │   ├── StarSystemBackdrop.tsx
│   │   ├── ThrusterEffect.tsx
│   │   ├── VisualEffect.ts
│   │   └── WeaponEffect.tsx
│   ├── style_effects/
│   │   ├── effects.css
│   │   └── vpr-effects.css
│   ├── types_effects/
│   │   ├── AdvancedWeaponEffects.ts
│   │   ├── EffectTypes.ts
│   │   ├── EnvironmentalHazardEffects.ts
│   │   ├── shipEffects.ts
│   │   └── WeaponEffects.ts
│   └── util_effects/
│       └── effectUtils.ts
├── errorHandling/
│   ├── specialized/
│   │   ├── DataFetchingErrorBoundary.tsx
│   │   └── VisualizationErrorBoundary.tsx
│   ├── utils/
│   │   ├── errorBoundaryHOC.tsx
│   │   └── migration.ts
│   ├── ErrorBoundary.tsx
│   ├── ErrorFallback.tsx
│   ├── GlobalErrorBoundary.tsx
│   ├── index.ts
│   └── README.md
├── eslint-rules/
│   └── no-string-resource-types.js
├── examples/
│   ├── StatePersistenceExample.tsx
│   └── StateSelectorExample.tsx
├── factories/
│   └── ships/
│       └── ShipClassFactory.ts
├── hooks/
│   ├── automation/
│   │   ├── useAutomation.ts
│   │   └── useGlobalAutomation.ts
│   ├── combat/
│   │   ├── useCombatAI.ts
│   │   └── useCombatSystem.ts
│   ├── errors/
│   │   ├── index.ts
│   │   └── useErrorHandler.ts
│   ├── events/
│   │   ├── useEventBatching.ts
│   │   ├── useEventFiltering.ts
│   │   ├── useEventSubscription.ts
│   │   ├── useModuleEvents.ts
│   │   └── useSystemEvents.ts
│   ├── factions/
│   │   ├── useAdaptiveAI.ts
│   │   ├── useDiplomacy.ts
│   │   ├── useEnemyAI.ts
│   │   ├── useFactionAI.ts
│   │   ├── useFactionBehavior.ts
│   │   └── useFleetAI.ts
│   ├── factory/
│   │   ├── createDataFetchHook.ts
│   │   ├── createLifecycleHook.ts
│   │   ├── createStateHook.ts
│   │   └── index.ts
│   ├── game/
│   │   ├── useAnimation.ts
│   │   ├── useAssets.ts
│   │   ├── useGameState.ts
│   │   ├── useGlobalEvents.ts
│   │   └── useScalingSystem.ts
│   ├── integration/
│   │   ├── index.ts
│   │   ├── useEventSystemIntegration.ts
│   │   ├── useManagerRegistryIntegration.ts
│   │   ├── useModuleSystemIntegration.ts
│   │   └── useResourceSystemIntegration.ts
│   ├── modules/
│   │   ├── useModuleAutomation.ts
│   │   ├── useModuleEvents.ts
│   │   ├── useModuleState.ts
│   │   ├── useModuleStatus.ts
│   │   ├── useModuleUpgrade.ts
│   │   └── useSubModules.ts
│   ├── performance/
│   │   ├── useMemoWithDeepCompare.ts
│   │   ├── useOptimizedCallback.ts
│   │   └── useSessionPerformance.ts
│   ├── resources/
│   │   ├── useResourceManagement.tsx
│   │   ├── useResourceState.ts
│   │   ├── useResourceSystem.ts
│   │   └── useResourceTracking.ts
│   ├── services/
│   │   └── useService.ts
│   ├── ships/
│   │   ├── useShipActions.ts
│   │   ├── useShipClassManager.ts
│   │   └── useShipEffects.ts
│   ├── ui/
│   │   ├── index.ts
│   │   ├── useBreakpoint.ts
│   │   ├── useComponentLifecycle.ts
│   │   ├── useComponentProfiler.ts
│   │   ├── useComponentRegistration.ts
│   │   ├── useDebugOverlay.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useProfilingOverlay.ts
│   │   ├── useTheme.ts
│   │   ├── useTooltip.ts
│   │   ├── useVPR.ts
│   │   ├── useVPRInteractivity.ts
│   │   └── useVPRSystem.ts
│   ├── visualization/
│   │   └── useChartCoordination.ts
│   ├── useGPUCompute.ts
│   ├── useMemoryManager.ts
│   ├── usePaginatedData.ts
│   ├── useRealTimeData.ts
│   ├── useStreamedData.ts
│   ├── useTypedApi.ts
│   ├── useWebGL.ts
│   └── useWorker.ts
├── initialization/
│   ├── automationSystemInit.ts
│   ├── eventSystemInit.ts
│   ├── gameSystemsIntegration.ts
│   ├── moduleFrameworkInit.ts
│   ├── moduleUpgradeInit.ts
│   └── serviceRegistration.ts
├── lib/
│   ├── ai/
│   │   ├── behaviorTree.ts
│   │   ├── ResourceConsumptionPredictor.ts
│   │   ├── shipBehavior.ts
│   │   └── shipMovement.ts
│   ├── automation/
│   │   └── ConditionChecker.ts
│   ├── contexts/
│   │   └── BaseContext.tsx
│   ├── events/
│   │   ├── BaseEventEmitter.ts
│   │   ├── BaseTypedEventEmitter.ts
│   │   ├── EventBatcher.ts
│   │   ├── EventBus.ts
│   │   ├── EventBusTypes.ts
│   │   ├── EventEmitter.ts
│   │   ├── ModuleEventBus.ts
│   │   └── UnifiedEventSystem.ts
│   ├── managers/
│   │   ├── BaseManager.ts
│   │   └── ServiceRegistry.ts
│   ├── modules/
│   │   ├── BaseTypedEventEmitter.ts
│   │   └── ModuleEvents.ts
│   ├── optimization/
│   │   ├── EntityPool.ts
│   │   ├── QuadTree.ts
│   │   ├── RenderBatcher.d.ts
│   │   ├── RenderBatcher.ts
│   │   └── WebGLShaderManager.ts
│   ├── patterns/
│   │   └── Singleton.ts
│   ├── registry/
│   │   └── ServiceRegistry.ts
│   ├── services/
│   │   ├── BaseService.ts
│   │   └── ServiceRegistry.ts
│   └── visualization/
│       ├── ChartCoordinationManager.ts
│       └── ParticleSystem.ts
├── managers/
│   ├── ai/
│   │   └── BehaviorTreeManager.ts
│   ├── automation/
│   │   └── GlobalAutomationManager.ts
│   ├── colony/
│   │   └── ColonyManagerImpl.ts
│   ├── combat/
│   │   ├── CombatManager.ts
│   │   ├── CombatMechanicsSystem.ts
│   │   ├── EnvironmentalHazardManager.ts
│   │   ├── ObjectDetectionSystem.ts
│   │   ├── ThreatAssessmentManager.ts
│   │   └── WarShipManagerImpl.ts
│   ├── effects/
│   │   ├── EffectLifecycleManager.ts
│   │   └── ParticleSystemManager.ts
│   ├── exploration/
│   │   ├── ExplorationManager.ts
│   │   ├── ExplorationManagerImpl.ts
│   │   └── ReconShipManagerImpl.ts
│   ├── factions/
│   │   ├── FactionBehaviorManager.ts
│   │   ├── factionManager.ts
│   │   └── FactionRelationshipManager.ts
│   ├── game/
│   │   ├── animationManager.ts
│   │   ├── assetManager.ts
│   │   ├── AsteroidFieldManager.ts
│   │   ├── AutomationManager.ts
│   │   ├── GameLoopManager.ts
│   │   ├── gameManager.ts
│   │   ├── ParticleSystemManager.ts
│   │   ├── ResourceManager.ts
│   │   ├── salvageManager.ts
│   │   └── techTreeManager.ts
│   ├── mining/
│   │   ├── MiningResourceIntegration.ts
│   │   └── MiningShipManagerImpl.ts
│   ├── module/
│   │   ├── BaseModuleManager.ts
│   │   ├── ModuleAttachmentManager.ts
│   │   ├── ModuleManager.ts
│   │   ├── ModuleManagerWrapper.ts
│   │   ├── ModuleStatusManager.ts
│   │   ├── ModuleUpgradeManager.ts
│   │   ├── OfficerManager.ts
│   │   ├── ShipHangarManager.ts
│   │   └── SubModuleManager.ts
│   ├── player/
│   ├── resource/
│   │   ├── AdaptivePerformanceManager.ts
│   │   ├── ResourceConversionManager.ts
│   │   ├── ResourceCostManager.ts
│   │   ├── ResourceExchangeManager.ts
│   │   ├── ResourceFlowManager.ts
│   │   ├── ResourceFlowTypes.ts
│   │   ├── ResourceIntegration.ts
│   │   ├── ResourcePerformanceMonitor.ts
│   │   ├── ResourcePoolManager.ts
│   │   ├── ResourceStorageManager.ts
│   │   ├── ResourceThresholdManager.ts
│   │   └── ResourceTransferManager.tsx
│   ├── ships/
│   │   ├── ShipManagerImpl.ts
│   │   └── StandardShipHangarManager.ts
│   ├── weapons/
│   │   ├── AdvancedWeaponEffectManager.ts
│   │   ├── WeaponEffectManager.ts
│   │   └── WeaponUpgradeManager.ts
│   └── ManagerRegistry.ts
├── pages/
│   ├── performance/
│   │   ├── LongSessionMemoryPage.tsx
│   │   └── MultitabPerformanceTestPage.tsx
│   ├── ColonyManagementPage.tsx
│   ├── CombatSystemPage.tsx
│   ├── ConverterManagementPage.css
│   ├── ConverterManagementPage.tsx
│   ├── PerformanceAnalysisDashboard.tsx
│   ├── ResourceManagementPage.css
│   ├── ResourceManagementPage.tsx
│   └── ResourceRegistryDemo.tsx
├── registry/
│   ├── ResourceRegistry.ts
│   └── ResourceRegistryIntegration.ts
├── resource/
│   ├── subsystems/
│   │   ├── ResourceFlowSubsystem.ts
│   │   ├── ResourceStorageSubsystem.ts
│   │   ├── ResourceThresholdSubsystem.ts
│   │   └── ResourceTransferSubsystem.ts
│   └── ResourceSystem.ts
├── services/
│   ├── telemetry/
│   │   ├── SessionPerformanceTracker.ts
│   │   └── UserBehaviorCorrelationAnalysis.ts
│   ├── AnalysisAlgorithmService.ts
│   ├── AnomalyDetectionService.ts
│   ├── APIService.ts
│   ├── ComponentRegistryService.ts
│   ├── DataCollectionService.ts
│   ├── DataProcessingService.ts
│   ├── ErrorLoggingService.ts
│   ├── EventPropagationService.ts
│   ├── RealTimeDataService.ts
│   ├── RecoveryService.ts
│   ├── WebGLService.ts
│   └── WorkerService.ts
├── styles/
│   ├── components/
│   │   ├── capital-ships.css
│   │   ├── colony.css
│   │   ├── exploration.css
│   │   ├── habitable-world.css
│   │   ├── mineral-processing.css
│   │   └── mothership.css
│   ├── ui/
│   │   └── vpr-system.css
│   ├── automation.css
│   ├── mediaQueries.ts
│   └── themeUtils.ts
├── systems/
│   └── exploration/
│       └── DiscoveryClassification.ts
├── tests/
│   ├── accessibility/
│   │   └── a11y.test.tsx
│   ├── components/
│   │   └── ui/
│   │       ├── Button.test.tsx
│   │       ├── Card.test.tsx
│   │       ├── ErrorBoundary.test.tsx
│   │       └── responsive.test.tsx
│   ├── hooks/
│   ├── integration/
│   │   └── ui-components.test.tsx
│   ├── performance/
│   │   ├── LongSessionMemoryTestSuite.ts
│   │   └── MultitabPerformanceTestSuite.ts
│   ├── setup/
│   │   └── testingLibrary.setup.ts
│   ├── utils/
│   │   └── test-utils.tsx
│   ├── README.md
│   ├── setup.ts
│   ├── setupTests.ts
│   ├── types.d.ts
│   └── vitest.d.ts
├── tools/
│   └── manager_tree.py
├── types/
│   ├── combat/
│   │   ├── CombatTypes.ts
│   │   ├── HazardTypes.ts
│   │   └── SalvageTypes.ts
│   ├── common/
│   │   └── VectorTypes.ts
│   ├── config/
│   │   └── TypeSafeConfig.ts
│   ├── core/
│   │   ├── GameTypes.ts
│   │   └── Position.ts
│   ├── debug/
│   │   └── DebugTypes.ts
│   ├── events/
│   │   ├── CombatEvents.ts
│   │   ├── EnvironmentalHazardEvents.ts
│   │   ├── EventEmitterInterface.ts
│   │   ├── EventTypes.ts
│   │   ├── ExplorationEvents.ts
│   │   ├── FactionEvents.ts
│   │   ├── moduleEventBus.d.ts
│   │   ├── ModuleEvents.ts
│   │   ├── ModuleEventTypes.ts
│   │   ├── OfficerEvents.ts
│   │   ├── SharedEventTypes.ts
│   │   ├── ShipEvents.ts
│   │   └── StandardizedEvents.ts
│   ├── exploration/
│   │   ├── unified/
│   │   │   ├── ExplorationTypes.ts
│   │   │   ├── ExplorationTypeUtils.ts
│   │   │   └── index.ts
│   │   ├── AnalysisComponentTypes.ts
│   │   ├── ClassificationTypes.ts
│   │   ├── DataAnalysisTypes.ts
│   │   └── ExplorationTypes.ts
│   ├── managers/
│   │   ├── MockManagerFactory.ts
│   │   └── SharedManagerTypes.ts
│   ├── mining/
│   │   └── MiningTypes.ts
│   ├── modules/
│   │   └── ModuleTypes.ts
│   ├── officers/
│   │   └── OfficerTypes.ts
│   ├── resources/
│   │   ├── FlowNodeTypes.ts
│   │   ├── ResourceConversionTypes.ts
│   │   ├── ResourceFlowTypes.ts
│   │   ├── ResourcePoolTypes.ts
│   │   ├── ResourceSerializationTypes.ts
│   │   ├── ResourceTypeConverter.ts
│   │   ├── ResourceTypes.ts
│   │   └── ResourceTypeUtils.ts
│   ├── shared/
│   │   └── index.ts
│   ├── ships/
│   │   ├── CommonShipTypes.ts
│   │   ├── FactionShipTypes.ts
│   │   ├── FactionTypes.ts
│   │   ├── PlayerShipTypes.ts
│   │   ├── Ship.ts
│   │   └── ShipTypes.ts
│   ├── state/
│   │   └── TypeSafeStateManagement.ts
│   ├── system/
│   │   └── SystemTypes.ts
│   ├── ui/
│   │   ├── ComponentTypes.ts
│   │   ├── EventTypes.ts
│   │   ├── ThemeTypes.ts
│   │   ├── typeGuards.ts
│   │   └── UITypes.ts
│   ├── visualization/
│   │   ├── CommonTypes.ts
│   │   └── index.ts
│   ├── visualizations/
│   │   ├── D3AnimationTypes.ts
│   │   ├── D3DragTypes.ts
│   │   ├── D3SelectionTypes.ts
│   │   ├── D3Types.ts
│   │   ├── D3ValidationHooks.ts
│   │   ├── D3Validators.ts
│   │   ├── D3ZoomTypes.ts
│   │   └── FlowTypes.ts
│   ├── weapons/
│   │   ├── WeaponTypes.ts
│   │   └── WeaponUpgrades.ts
│   ├── common.ts
│   ├── declarations.d.ts
│   ├── geometry.ts
│   ├── global.d.ts
│   ├── index.ts
│   ├── README.md
│   ├── test-utils.d.ts
│   ├── types-fix.d.ts
│   └── TypeUtils.ts
├── ui/
│   ├── components/
│   │   ├── Badge/
│   │   │   ├── variants/
│   │   │   │   ├── index.ts
│   │   │   │   └── StatusBadge.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── index.ts
│   │   ├── Button/
│   │   │   ├── variants/
│   │   │   │   └── AbilityButton.tsx
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   │   ├── variants/
│   │   │   │   └── ModuleCard.tsx
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   ├── inputs/
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Radio.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Slider.tsx
│   │   │   └── Switch.tsx
│   │   ├── typography/
│   │   │   ├── Heading.tsx
│   │   │   ├── Label.tsx
│   │   │   └── Text.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Divider.tsx
│   │   ├── Icon.tsx
│   │   ├── index.ts
│   │   └── Tooltip.tsx
│   └── theme/
│       └── defaultTheme.ts
├── utils/
│   ├── combat/
│   │   └── scanRadiusUtils.ts
│   ├── dataTransforms/
│   │   ├── chartTransforms.ts
│   │   ├── filterTransforms.ts
│   │   ├── index.ts
│   │   ├── README.md
│   │   └── scientificTransforms.ts
│   ├── events/
│   │   ├── EventBatcher.ts
│   │   ├── EventBatchingRxJS.ts
│   │   ├── EventCommunication.ts
│   │   ├── EventDataTypes.ts
│   │   ├── EventDevTools.ts
│   │   ├── EventDispatcher.tsx
│   │   ├── EventFilter.ts
│   │   ├── EventFiltering.ts
│   │   ├── EventPrioritizer.ts
│   │   ├── EventThrottling.ts
│   │   ├── eventTypeGuards.ts
│   │   └── rxjsIntegration.ts
│   ├── logging/
│   │   └── loggerService.ts
│   ├── math/
│   │   └── calculations.ts
│   ├── modules/
│   │   └── moduleValidation.ts
│   ├── performance/
│   │   ├── .cursor/
│   │   │   └── ignore/
│   │   │       └── README.md
│   │   ├── benchmarks/
│   │   │   ├── DynamicBudgetAdjustment.ts
│   │   │   ├── PerformanceBenchmarkTools.ts
│   │   │   └── PerformanceBudgets.ts
│   │   ├── longsession/
│   │   │   └── LongSessionMemoryTracker.ts
│   │   ├── multitab/
│   │   │   └── MultitabCommunicationChannel.ts
│   │   ├── network/
│   │   │   └── NetworkDegradationSimulator.ts
│   │   ├── animationFrameManagerInstance.ts
│   │   ├── ComponentOptimizer.ts
│   │   ├── D3AccessorBenchmark.ts
│   │   ├── D3AnimationFrameManager.ts
│   │   ├── D3AnimationProfiler.ts
│   │   ├── D3AnimationQualityManager.ts
│   │   ├── D3BatchedUpdates.ts
│   │   ├── D3InterpolationCache.ts
│   │   ├── D3PerformanceOptimizations.ts
│   │   ├── D3PerformanceProfiler.ts
│   │   ├── HookPerformanceDashboard.tsx
│   │   └── hookPerformanceMonitor.ts
│   ├── profiling/
│   │   ├── applicationProfiler.ts
│   │   ├── componentProfiler.ts
│   │   ├── enhancedComponentProfiler.ts
│   │   └── index.ts
│   ├── resources/
│   │   ├── ResourceTypeConverter.ts
│   │   ├── ResourceTypeMigration.ts
│   │   └── resourceUtils.ts
│   ├── services/
│   │   └── ServiceAccess.ts
│   ├── ships/
│   │   ├── shipClassUtils.ts
│   │   └── shipUtils.ts
│   ├── spatial/
│   │   └── SpatialPartitioning.ts
│   ├── state/
│   │   ├── contextSelectors.ts
│   │   ├── stateMigration.ts
│   │   └── statePersistence.ts
│   ├── typeGuards/
│   │   └── resourceTypeGuards.ts
│   ├── weapons/
│   │   ├── weaponEffectUtils.ts
│   │   └── weaponTypeConversions.ts
│   ├── workers/
│   │   └── ResourceFlowWorkerUtil.ts
│   ├── cn.ts
│   ├── geometry.ts
│   ├── idGenerator.ts
│   ├── preload.ts
│   ├── ResourceTypeConverter.ts
│   ├── ResourceTypeMigration.ts
│   ├── typeConversions.ts
│   └── vpr-diagnostic.ts
├── visualization/
│   ├── renderers/
│   │   ├── CanvasRenderer.tsx
│   │   ├── SVGRenderer.tsx
│   │   └── WebGLRenderer.tsx
│   ├── Chart.tsx
│   └── index.ts
├── workers/
│   ├── combatWorker.ts
│   ├── DataProcessingWorker.ts
│   ├── ResourceFlowWorker.ts
│   └── worker.ts
├── App.tsx
├── generate_tree.py
├── index.css
└── main.tsx

```

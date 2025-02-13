# Galaxy Sprawl Project Directory Structure

```
Galactic_Sprawl/
│   └── .cursorrules
│   └── .eslintignore
│   └── README.md
│   └── eslint.config.js
│   └── future_update
│   └── index.html
│   └── package-lock.json
│   └── package.json
│   └── postcss.config.js
│   └── requirements.txt
│   └── tailwind.config.js
│   └── tsconfig.app.json
│   └── tsconfig.app.tsbuildinfo
│   └── tsconfig.json
│   └── tsconfig.node.json
│   └── tsconfig.node.tsbuildinfo
│   └── vite.config.ts
│   └── dist/
│   │   └── index.html
│   └── GalaxySprawlDocs/
│   │   └── (index)-GalaxySprawlDocs.md
│   │   └── GS-ProjectDevPlan.md
│   │   └── directory_structure.md
│   │   └── generate_directory_tree.py
│   │   └── FactionsAndAI(FAI)/
│   │   │   └── (index)-FactionsAndAI(FAI).md
│   │   │   └── GS_FAI-FactionsAndAI.md
│   │   └── ShipsAndCombat(SC)/
│   │   │   └── (index)-ShipsAndCombat(SC).md
│   │   │   └── GS_SC-ShipsAndCombat.md
│   │   └── GameplayLogic(GL)/
│   │   │   └── (index)-GameplayLogic(GL).md
│   │   │   └── GS_GL-AutomationFunctions.md
│   │   │   └── GS_GL-CoreGameplayLogic.md
│   │   │   └── GS_GL-ProgressionSystem.md
│   │   └── ScalingAndVisuals(SV)/
│   │   │   └── (index)-ScalingAndVisuals(SV).md
│   │   │   └── GS_SV-ScalingAndVisuals.md
│   │   └── TechTree(TTR)/
│   │   │   └── (index)-TechTree(TTR).md
│   │   │   └── GS_TTR-TechTree.md
│   │   └── UIAndMapViews(UI)-(MV)/
│   │   │   └── (index)-UIAndMapViews(UI)-(MV).md
│   │   │   └── GS_GUI-GlobalUIImplementations.md
│   │   │   └── MapViews(MV)/
│   │   │   │   └── (index)-MapViews(MV).md
│   │   │   │   └── GS_MV-CivilizationSprawlView.md
│   │   │   │   └── GS_MV-LocalGalaxyMap.md
│   │   │   │   └── GS_MV-VisualProgressRepresentationUIView.md
│   │   │   └── UIMenus(UIM)/
│   │   │   │   └── (index)-UIMenus(UIM).md
│   │   │   │   └── GS_UIM-ExplorationAndMining.md
│   │   │   │   └── GS_UIM-HabitableWorlds.md
│   │   │   │   └── GS_UIM-MothershipAndColonyUIMenu.md
│   │   │   │   └── GS_UIM-OfficersAcademyAndShipHanger.md
│   │   │   └── src/
│   │   │   │   └── App.tsx
│   │   │   │   └── index.css
│   │   │   │   └── main.tsx
│   │   │   │   └── vite-env.d.ts
│   │   │   │   └── types/
│   │   │   │   │   └── common.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │   └── ui/
│   │   │   │   │   │   └── UITypes.ts
│   │   │   │   │   │   └── ships/
│   │   │   │   │   │   │   └── CommonShipTypes.ts
│   │   │   │   │   │   │   └── FactionShipTypes.ts
│   │   │   │   │   │   │   └── FactionTypes.ts
│   │   │   │   │   │   │   └── PlayerShipTypes.ts
│   │   │   │   │   │   │   └── ShipTypes.ts
│   │   │   │   │   │   └── buildings/
│   │   │   │   │   │   │   └── ModuleTypes.ts
│   │   │   │   │   │   └── core/
│   │   │   │   │   │   │   └── GameTypes.ts
│   │   │   │   │   │   └── combat/
│   │   │   │   │   │   │   └── CombatTypes.ts
│   │   │   │   │   │   │   └── SalvageTypes.ts
│   │   │   │   │   │   └── weapons/
│   │   │   │   │   │   │   └── WeaponEffectTypes.ts
│   │   │   │   │   │   │   └── WeaponTypes.ts
│   │   │   │   │   │   └── debug/
│   │   │   │   │   │   │   └── DebugTypes.ts
│   │   │   │   │   │   └── contexts/
│   │   │   │   │   │   │   └── GameContext.tsx
│   │   │   │   │   │   │   └── ThresholdContext.tsx
│   │   │   │   │   │   │   └── ThresholdTypes.ts
│   │   │   │   │   │   └── config/
│   │   │   │   │   │   │   └── ships/
│   │   │   │   │   │   │   │   └── equatorHorizonShips.ts
│   │   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   │   │   └── lostNovaShips.ts
│   │   │   │   │   │   │   │   └── shipEffects.ts
│   │   │   │   │   │   │   │   └── shipStats.ts
│   │   │   │   │   │   │   │   └── spaceRatsShips.ts
│   │   │   │   │   │   │   └── combat/
│   │   │   │   │   │   │   │   └── combatConfig.ts
│   │   │   │   │   │   │   │   └── weaponConfig.ts
│   │   │   │   │   │   │   └── game/
│   │   │   │   │   │   │   │   └── gameConfig.ts
│   │   │   │   │   │   │   └── factions/
│   │   │   │   │   │   │   │   └── factionConfig.ts
│   │   │   │   │   │   │   │   └── factions.ts
│   │   │   │   │   │   └── utils/
│   │   │   │   │   │   │   └── helpers.ts
│   │   │   │   │   │   │   └── idGenerator.ts
│   │   │   │   │   │   │   └── math.ts
│   │   │   │   │   │   │   └── shipUtils.ts
│   │   │   │   │   │   │   └── types/
│   │   │   │   │   │   │   └── math/
│   │   └── styles/
│   │   │   │   └── ui/
│   │   │   │   │   └── vpr-system.css
│   │   │   │   └── components/
│   │   │   │   │   └── capital-ships.css
│   │   │   │   │   └── colony.css
│   │   │   │   │   └── exploration.css
│   │   │   │   │   └── habitable-world.css
│   │   │   │   │   └── mineral-processing.css
│   │   │   │   │   └── mothership.css
│   │   │   │   └── effects/
│   │   │   │   │   └── effects.css
│   │   │   │   │   └── vpr-effects.css
│   │   └── components/
│   │   │   │   └── DiplomacyPanel.tsx
│   │   │   │   └── GalaxyMap.tsx
│   │   │   │   └── GameHUD.tsx
│   │   │   │   └── GameLayout.tsx
│   │   │   │   └── SprawlView.tsx
│   │   │   │   └── TechTree.tsx
│   │   │   │   └── VPRErrorBoundary.tsx
│   │   │   │   └── VPRLoadingFallback.tsx
│   │   │   │   └── VPRStarSystemView.tsx
│   │   │   │   └── ui/
│   │   │   │   │   └── NotificationSystem.tsx
│   │   │   │   │   └── TooltipProvider.tsx
│   │   │   │   │   └── tooltip-context.ts
│   │   │   │   └── ships/
│   │   │   │   │   └── common/
│   │   │   │   │   │   └── CommonShipMovement.tsx
│   │   │   │   │   │   └── CommonShipStats.tsx
│   │   │   │   │   │   └── WeaponMount.tsx
│   │   │   │   │   └── FactionShips/
│   │   │   │   │   │   └── FactionAI.tsx
│   │   │   │   │   │   └── FactionFleet.tsx
│   │   │   │   │   │   └── FactionManager.tsx
│   │   │   │   │   │   └── FactionShipBase.tsx
│   │   │   │   │   │   └── FactionShipStats.tsx
│   │   │   │   │   │   └── lostNova/
│   │   │   │   │   │   │   └── DarkMatterReaper.tsx
│   │   │   │   │   │   │   └── EclipseScythe.tsx
│   │   │   │   │   │   │   └── LostNovaShip.tsx
│   │   │   │   │   │   │   └── NullHunter.tsx
│   │   │   │   │   │   └── equatorHorizon/
│   │   │   │   │   │   │   └── CelestialArbiter.tsx
│   │   │   │   │   │   │   └── EquatorHorizonShip.tsx
│   │   │   │   │   │   │   └── EtherealGalleon.tsx
│   │   │   │   │   │   │   └── StellarEquinox.tsx
│   │   │   │   │   │   └── spaceRats/
│   │   │   │   │   │   │   └── AsteroidMarauder.tsx
│   │   │   │   │   │   │   └── RatKing.tsx
│   │   │   │   │   │   │   └── RogueNebula.tsx
│   │   │   │   │   │   │   └── SpaceRatShip.tsx
│   │   │   │   │   └── MiningShips/
│   │   │   │   │   └── player/
│   │   │   │   │   │   └── variants/
│   │   │   │   │   │   │   └── reconships/
│   │   │   │   │   │   │   └── ReconShipControl.tsx
│   │   │   │   │   │   │   └── ReconShipStatus.tsx
│   │   │   │   │   │   └── miningships/
│   │   │   │   │   │   │   └── VoidDredgerMiner.tsx
│   │   │   │   │   │   └── warships/
│   │   │   │   │   │   │   └── HarbringerGalleon.tsx
│   │   │   │   │   │   │   └── MidwayCarrier.tsx
│   │   │   │   │   │   │   └── MotherEarthRevenge.tsx
│   │   │   │   │   │   │   └── OrionFrigate.tsx
│   │   │   │   │   │   │   └── PlayerWarShipCombat.tsx
│   │   │   │   │   │   │   └── Spitflare.tsx
│   │   │   │   │   │   │   └── StarSchooner.tsx
│   │   │   │   │   │   │   └── WarShip.tsx
│   │   │   │   │   └── customization/
│   │   │   │   │   │   └── PlayerShipCustomization.tsx
│   │   │   │   │   │   └── PlayerShipUpgrade.tsx
│   │   │   │   │   │   └── PlayerShipUpgradeSystem.tsx
│   │   │   │   │   └── base/
│   │   │   │   │   │   └── PlayerShipBase.tsx
│   │   │   │   │   │   └── PlayerShipStats.tsx
│   │   │   │   │   └── buildings/
│   │   │   │   │   └── colony/
│   │   │   │   │   └── AutomatedExpansion.tsx
│   │   │   │   │   └── BiodomeModule.tsx
│   │   │   │   │   └── ColonyCore.tsx
│   │   │   │   │   └── CulturalCenter.tsx
│   │   │   │   │   └── EconomicHub.tsx
│   │   │   │   │   └── HabitableWorld.tsx
│   │   │   │   │   └── ResourceTransferAnimation.tsx
│   │   │   │   └── modules/
│   │   │   │   │   └── academy/
│   │   │   │   │   │   └── HiringPanel.tsx
│   │   │   │   │   │   └── OfficerAcademy.tsx
│   │   │   │   │   │   └── OfficerCard.tsx
│   │   │   │   │   │   └── OfficerDetails.tsx
│   │   │   │   │   └── hangar/
│   │   │   │   │   │   └── HangarModule.tsx
│   │   │   │   │   │   └── ShipHangar.tsx
│   │   │   │   │   └── MiningHub/
│   │   │   │   │   │   └── AutomationMonitor.tsx
│   │   │   │   │   │   └── MineralProcessingCentre.tsx
│   │   │   │   │   │   └── MiningControls.tsx
│   │   │   │   │   │   └── MiningMap.tsx
│   │   │   │   │   │   └── MiningTutorial.tsx
│   │   │   │   │   │   └── MiningWindow.tsx
│   │   │   │   │   │   └── ResourceNode.tsx
│   │   │   │   │   │   └── ResourceStorage.tsx
│   │   │   │   │   │   └── ResourceTransfer.tsx
│   │   │   │   │   │   └── ResourceTransferManager.tsx
│   │   │   │   │   │   └── TechBonus.tsx
│   │   │   │   │   │   └── ThresholdManager.tsx
│   │   │   │   │   │   └── ThresholdPresetsPanel.tsx
│   │   │   │   │   │   └── ThresholdStatusIndicator.tsx
│   │   │   │   │   └── ExplorationHub/
│   │   │   │   │   │   └── ExplorationControls.tsx
│   │   │   │   │   │   └── ExplorationHub.tsx
│   │   │   │   │   │   └── ExplorationTutorial.tsx
│   │   │   │   │   │   └── ExplorationWindow.tsx
│   │   │   │   │   │   └── MissionLog.tsx
│   │   │   │   │   │   └── ReconShipStatus.tsx
│   │   │   │   │   └── radar/
│   │   │   │   │   │   └── RadarModule.tsx
│   │   │   │   │   └── trading/
│   │   │   │   │   │   └── TradingHub.tsx
│   │   │   │   └── mothership/
│   │   │   │   │   └── MothershipCore.tsx
│   │   │   │   └── combat/
│   │   │   │   └── BattleEnvironment.tsx
│   │   │   │   └── SalvageSystem.tsx
│   │   │   │   └── trade/
│   │   │   │   └── TradeRouteVisualizer.tsx
│   │   │   │   └── weapons/
│   │   │   │   └── WeaponComponents.tsx
│   │   │   │   └── WeaponControl.tsx
│   │   │   │   └── WeaponLoadout.tsx
│   │   │   │   └── WeaponSystem.tsx
│   │   │   │   └── WeaponUpgradeSystem.tsx
│   │   │   │   └── visual/
│   │   │   │   └── BackgroundEffect.tsx
│   │   │   │   └── BuildingUpgradeEffect.tsx
│   │   │   │   └── CapitalShipEffect.tsx
│   │   │   │   └── CentralMothership.tsx
│   │   │   │   └── ColonyStarStation.tsx
│   │   │   │   └── ExplorationHub.tsx
│   │   │   │   └── HabitableWorld.tsx
│   │   │   │   └── MineralProcessing.tsx
│   │   │   │   └── ModuleUpgradeTransition.tsx
│   │   │   │   └── PopulationIndicator.tsx
│   │   │   │   └── ProgressionEffects.tsx
│   │   │   │   └── StarSystemBackdrop.tsx
│   │   │   │   └── TradeRouteEffect.tsx
│   │   │   │   └── factions/
│   │   │   │   │   └── FactionManager.tsx
│   │   │   │   └── effects/
│   │   │   │   │   └── ExplosionEffect.tsx
│   │   │   │   │   └── ShieldEffect.tsx
│   │   │   │   │   └── SmokeTrailEffect.tsx
│   │   │   │   │   └── ThrusterEffect.tsx
│   │   │   │   │   └── WeaponEffect.tsx
│   │   │   │   └── debug/
│   │   │   │   │   └── AIDebugOverlay.tsx
│   │   └── hooks/
│   │   │   │   └── ui/
│   │   │   │   │   └── useDebugOverlay.ts
│   │   │   │   │   └── useTooltip.ts
│   │   │   │   │   └── useVPR.ts
│   │   │   │   │   └── useVPRInteractivity.ts
│   │   │   │   │   └── useVPRSystem.ts
│   │   │   │   └── combat/
│   │   │   │   │   └── useCombatSystem.ts
│   │   │   │   └── game/
│   │   │   │   │   └── useAnimation.ts
│   │   │   │   │   └── useAssets.ts
│   │   │   │   │   └── useGameState.ts
│   │   │   │   │   └── useGlobalEvents.ts
│   │   │   │   │   └── useScalingSystem.ts
│   │   │   │   └── factions/
│   │   │   │   │   └── useAdaptiveAI.ts
│   │   │   │   │   └── useDiplomacy.ts
│   │   │   │   │   └── useEnemyAI.ts
│   │   │   │   │   └── useFactionAI.ts
│   │   │   │   │   └── useFactionBehavior.ts
│   │   │   │   │   └── useFleetAI.ts
│   │   │   │   └── debug/
│   │   └── lib/
│   │   │   │   └── combat/
│   │   │   │   │   └── combatManager.ts
│   │   │   │   │   └── salvageManager.ts
│   │   │   │   └── utils/
│   │   │   │   │   └── EventEmitter.ts
│   │   │   │   └── game/
│   │   │   │   │   └── animationManager.ts
│   │   │   │   │   └── assetManager.ts
│   │   │   │   │   └── gameManager.ts
│   │   │   │   │   └── techTreeManager.ts
│   │   │   │   └── ai/
│   │   │   │   │   └── behaviorTree.ts
│   │   │   │   │   └── shipBehavior.ts
│   │   │   │   │   └── shipMovement.ts
│   │   │   │   └── factions/
│   │   │   │   │   └── factionManager.ts
│   │   └── effects/
│   │   │   │   └── combat/
│   │   │   │   │   └── ExplosionEffect.tsx
│   │   │   │   │   └── ShieldEffect.tsx
│   │   │   │   │   └── WeaponEffect.tsx
│   │   │   │   └── particles/
│   │   │   │   └── visual/
│   │   │   │   │   └── SmokeTrailEffect.tsx
│   │   │   │   │   └── ThrusterEffect.tsx
│   │   │   │   └── FactionDashboard.tsx
```

# Galaxy Sprawl Project Directory Structure

```
Galactic_Sprawl/
│   └── .cursorrules
│   └── eslint.config.js
│   └── future_update
│   └── index.html
│   └── package-lock.json
│   └── package.json
│   └── postcss.config.js
│   └── requirements.txt
│   └── tailwind.config.js
│   └── tsconfig.app.json
│   └── tsconfig.json
│   └── tsconfig.node.json
│   └── vite.config.ts
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
│   └── public/
│   └── src/
│   │   └── App.tsx
│   │   └── index.css
│   │   └── main.tsx
│   │   └── vite-env.d.ts
│   │   └── types/
│   │   │   └── common.ts
│   │   │   └── ui/
│   │   │   │   └── UITypes.ts
│   │   │   └── ships/
│   │   │   │   └── ShipTypes.ts
│   │   │   │   └── WeaponTypes.ts
│   │   │   └── combat/
│   │   │   │   └── CombatTypes.ts
│   │   │   └── factions/
│   │   │   │   └── CombatTypes.ts
│   │   │   │   └── FactionTypes.ts
│   │   │   │   └── ShipTypes.ts
│   │   └── contexts/
│   │   │   └── GameContext.tsx
│   │   │   └── ThresholdContext.tsx
│   │   │   └── ThresholdTypes.ts
│   │   └── config/
│   │   │   └── playerShipStats.ts
│   │   │   └── ships/
│   │   │   │   └── playerShipStats.ts
│   │   │   └── combat/
│   │   │   │   └── combatConfig.ts
│   │   │   └── game/
│   │   │   │   └── gameConfig.ts
│   │   │   └── factions/
│   │   │   │   └── factionConfig.ts
│   │   │   │   └── shipStats.ts
│   │   │   │   └── weaponConfig.ts
│   │   └── utils/
│   │   │   └── helpers.ts
│   │   │   └── idGenerator.ts
│   │   │   └── math.ts
│   │   └── styles/
│   │   │   └── capital-ships.css
│   │   │   └── colony.css
│   │   │   └── effects.css
│   │   │   └── exploration.css
│   │   │   └── habitable-world.css
│   │   │   └── mineral-processing.css
│   │   │   └── mothership.css
│   │   │   └── vpr-effects.css
│   │   │   └── vpr-system.css
│   │   │   └── ui/
│   │   │   └── components/
│   │   │   └── effects/
│   │   └── components/
│   │   │   └── GalaxyMap.tsx
│   │   │   └── GameHUD.tsx
│   │   │   └── GameLayout.tsx
│   │   │   └── SprawlView.tsx
│   │   │   └── TechTree.tsx
│   │   │   └── VPRErrorBoundary.tsx
│   │   │   └── VPRLoadingFallback.tsx
│   │   │   └── VPRStarSystemView.tsx
│   │   │   └── ui/
│   │   │   │   └── TooltipProvider.tsx
│   │   │   │   └── tooltip-context.ts
│   │   │   └── ships/
│   │   │   │   └── ShipStats.tsx
│   │   │   │   └── common/
│   │   │   │   │   └── ShipBase.tsx
│   │   │   │   │   └── ShipStats.tsx
│   │   │   │   │   └── WeaponMount.tsx
│   │   │   │   └── factions/
│   │   │   │   │   └── lostNova/
│   │   │   │   │   │   └── DarkMatterReaper.tsx
│   │   │   │   │   │   └── EclipseScythe.tsx
│   │   │   │   │   └── equatorHorizon/
│   │   │   │   │   │   └── CelestialArbiter.tsx
│   │   │   │   │   │   └── EtherealGalleon.tsx
│   │   │   │   │   │   └── StellarEquinox.tsx
│   │   │   │   │   └── spaceRats/
│   │   │   │   │   │   └── AsteroidMarauder.tsx
│   │   │   │   │   │   └── RatKing.tsx
│   │   │   │   │   │   └── RogueNebula.tsx
│   │   │   │   └── player/
│   │   │   │   │   └── prefabs/
│   │   │   │   │   └── controls/
│   │   │   └── combat/
│   │   │   │   └── BattleEnvironment.tsx
│   │   │   │   └── SalvageSystem.tsx
│   │   │   └── trade/
│   │   │   │   └── TradeRouteVisualizer.tsx
│   │   │   └── officers/
│   │   │   │   └── HiringPanel.tsx
│   │   │   │   └── OfficerCard.tsx
│   │   │   │   └── OfficerDetails.tsx
│   │   │   │   └── OfficersAcademy.tsx
│   │   │   └── colony/
│   │   │   │   └── AutomatedExpansion.tsx
│   │   │   │   └── BiodomeModule.tsx
│   │   │   │   └── CulturalCenter.tsx
│   │   │   │   └── EconomicHub.tsx
│   │   │   │   └── HabitableWorld.tsx
│   │   │   │   └── ResourceTransferAnimation.tsx
│   │   │   └── mining/
│   │   │   │   └── AutomationMonitor.tsx
│   │   │   │   └── MineralProcessingCentre.tsx
│   │   │   │   └── MiningControls.tsx
│   │   │   │   └── MiningMap.tsx
│   │   │   │   └── MiningTutorial.tsx
│   │   │   │   └── MiningWindow.tsx
│   │   │   │   └── ResourceNode.tsx
│   │   │   │   └── ResourceStorage.tsx
│   │   │   │   └── ResourceTransfer.tsx
│   │   │   │   └── ResourceTransferManager.tsx
│   │   │   │   └── TechBonus.tsx
│   │   │   │   └── ThresholdManager.tsx
│   │   │   │   └── ThresholdPresetsPanel.tsx
│   │   │   │   └── ThresholdStatusIndicator.tsx
│   │   │   │   └── VoidDredger.tsx
│   │   │   └── exploration/
│   │   │   │   └── ExplorationControls.tsx
│   │   │   │   └── ExplorationHub.tsx
│   │   │   │   └── ExplorationTutorial.tsx
│   │   │   │   └── ExplorationWindow.tsx
│   │   │   │   └── MissionLog.tsx
│   │   │   │   └── ReconShipStatus.tsx
│   │   │   └── visual/
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
│   │   │   └── playerShips/
│   │   │   │   └── ReconShipControl.tsx
│   │   │   │   └── ReconShipStatus.tsx
│   │   │   │   └── ShipCustomization.tsx
│   │   │   │   └── ShipHangar.tsx
│   │   │   │   └── ShipStats.tsx
│   │   │   │   └── ShipUpgrade.tsx
│   │   │   │   └── ShipUpgradeSystem.tsx
│   │   │   │   └── WarShip.tsx
│   │   │   │   └── WarShipCombat.tsx
│   │   │   │   └── WeaponControl.tsx
│   │   │   │   └── WeaponLoadout.tsx
│   │   │   │   └── WeaponSystem.tsx
│   │   │   │   └── WeaponUpgradeSystem.tsx
│   │   │   │   └── prefabs/
│   │   │   │   │   └── HarbringerGalleon.tsx
│   │   │   │   │   └── MidwayCarrier.tsx
│   │   │   │   │   └── MotherEarthRevenge.tsx
│   │   │   │   │   └── OrionFrigate.tsx
│   │   │   │   │   └── Spitflare.tsx
│   │   │   │   │   └── StarSchooner.tsx
│   │   │   └── factions/
│   │   │   │   └── DiplomacyPanel.tsx
│   │   │   │   └── EquatorHorizonShip.tsx
│   │   │   │   └── FactionAI.tsx
│   │   │   │   └── FactionFleet.tsx
│   │   │   │   └── FactionManager.tsx
│   │   │   │   └── LostNovaShip.tsx
│   │   │   │   └── SpaceRatShip.tsx
│   │   │   │   └── ui/
│   │   │   │   └── ships/
│   │   │   │   │   └── lostNova/
│   │   │   │   │   │   └── DarkMatterReaper.tsx
│   │   │   │   │   │   └── EclipseScythe.tsx
│   │   │   │   │   │   └── NullHunter.tsx
│   │   │   │   │   └── components/
│   │   │   │   │   │   └── ShipBase.tsx
│   │   │   │   │   │   └── WeaponMount.tsx
│   │   │   │   │   └── equatorHorizon/
│   │   │   │   │   │   └── CelestialArbiter.tsx
│   │   │   │   │   │   └── EtherealGalleon.tsx
│   │   │   │   │   │   └── StellarEquinox.tsx
│   │   │   │   │   └── spaceRats/
│   │   │   │   │   │   └── AsteroidMarauder.tsx
│   │   │   │   │   │   └── RatKing.tsx
│   │   │   │   │   │   └── RogueNebula.tsx
│   │   │   │   └── types/
│   │   │   │   │   └── CombatTypes.ts
│   │   │   │   │   └── FactionTypes.ts
│   │   │   │   │   └── ShipTypes.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── config/
│   │   │   │   │   └── factionConfig.ts
│   │   │   │   │   └── factionShipStats.ts
│   │   │   │   │   └── factions.ts
│   │   │   │   │   └── shipStats.ts
│   │   │   │   │   └── weaponConfig.ts
│   │   │   │   └── factionLib/
│   │   │   │   │   └── factionManager.ts
│   │   │   │   └── factionHooks/
│   │   │   │   │   └── useEnemyAI.ts
│   │   │   │   │   └── useFactionAI.ts
│   │   │   │   │   └── useFactionBehavior.ts
│   │   │   │   └── hooks/
│   │   │   │   └── lib/
│   │   │   │   └── factionShips/
│   │   │   │   │   └── FactionShip.tsx
│   │   │   │   │   └── lostNova/
│   │   │   │   │   └── equatorHorizon/
│   │   │   │   │   └── spaceRats/
│   │   │   │   │   │   └── AsteroidMarauder.tsx
│   │   │   │   │   │   └── RatKing.tsx
│   │   │   │   │   │   └── RogueNebula.tsx
│   │   │   │   │   │   └── SpaceRatFleet.tsx
│   │   │   │   └── factionTypes/
│   │   │   │   │   └── ship.ts
│   │   │   └── effects/
│   │   │   │   └── ExplosionEffect.tsx
│   │   │   │   └── ShieldEffect.tsx
│   │   │   │   └── SmokeTrailEffect.tsx
│   │   │   │   └── ThrusterEffect.tsx
│   │   │   │   └── WeaponEffect.tsx
│   │   │   └── debug/
│   │   │   │   └── AIDebugOverlay.tsx
│   │   └── hooks/
│   │   │   └── useAdaptiveAI.ts
│   │   │   └── useCombatSystem.ts
│   │   │   └── useDebugOverlay.ts
│   │   │   └── useDiplomacy.ts
│   │   │   └── useFleetAI.ts
│   │   │   └── useGlobalEvents.ts
│   │   │   └── useScalingSystem.ts
│   │   │   └── useTooltip.ts
│   │   │   └── useVPR.ts
│   │   │   └── useVPRInteractivity.ts
│   │   │   └── useVPRSystem.ts
│   │   │   └── ui/
│   │   │   │   └── useTooltip.ts
│   │   │   └── combat/
│   │   │   │   └── useCombatSystem.ts
│   │   │   └── game/
│   │   │   │   └── useGameState.ts
│   │   │   └── factions/
│   │   │   │   └── useEnemyAI.ts
│   │   │   │   └── useFactionAI.ts
│   │   │   │   └── useFactionBehavior.ts
│   │   └── lib/
│   │   │   └── combatManager.ts
│   │   │   └── combat/
│   │   │   │   └── combatManager.ts
│   │   │   └── game/
│   │   │   │   └── gameManager.ts
│   │   │   └── ai/
│   │   │   │   └── behaviorTree.ts
│   │   │   └── factions/
│   │   │   │   └── factionManager.ts
│   │   └── effects/
│   │   │   └── combat/
│   │   │   │   └── ExplosionEffect.tsx
│   │   │   │   └── ShieldEffect.tsx
│   │   │   │   └── WeaponEffect.tsx
│   │   │   └── particles/
│   │   │   └── visual/
│   │   │   │   └── SmokeTrailEffect.tsx
│   │   │   │   └── ThrusterEffect.tsx
```

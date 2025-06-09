# Galaxy Sprawl Project Directory Structure

```plaintext
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
│   └── vitest.config.ts
│   └── dist/
│   │   └── index.html
│   └── src/
│   │   └── App.tsx
│   │   └── index.css
│   │   └── main.tsx
│   │   └── vite-env.d.ts
│   │   └── types/
│   │   │   └── README.md
│   │   │   └── common.ts
│   │   │   └── index.ts
│   │   │   └── ui/
│   │   │   │   └── UITypes.ts
│   │   │   └── ships/
│   │   │   │   └── CommonShipTypes.ts
│   │   │   │   └── FactionShipTypes.ts
│   │   │   │   └── FactionTypes.ts
│   │   │   │   └── PlayerShipTypes.ts
│   │   │   │   └── ShipTypes.ts
│   │   │   └── buildings/
│   │   │   │   └── ModuleTypes.ts
│   │   │   └── core/
│   │   │   │   └── GameTypes.ts
│   │   │   └── combat/
│   │   │   │   └── CombatTypes.ts
│   │   │   │   └── SalvageTypes.ts
│   │   │   └── weapons/
│   │   │   │   └── WeaponTypes.ts
│   │   │   │   └── WeaponUpgrades.ts
│   │   │   └── effects/
│   │   │   │   └── EffectTypes.ts
│   │   │   │   └── WeaponEffects.ts
│   │   │   │   └── shipEffects.ts
│   │   │   └── debug/
│   │   │   │   └── DebugTypes.ts
│   │   └── contexts/
│   │   │   └── GameContext.tsx
│   │   │   └── ShipContext.tsx
│   │   │   └── ThresholdContext.tsx
│   │   │   └── ThresholdTypes.ts
│   │   └── config/
│   │   │   └── ships/
│   │   │   │   └── equatorHorizonShips.ts
│   │   │   │   └── index.ts
│   │   │   │   └── lostNovaShips.ts
│   │   │   │   └── shipStats.ts
│   │   │   │   └── spaceRatsShips.ts
│   │   │   └── combat/
│   │   │   │   └── combatConfig.ts
│   │   │   │   └── weaponConfig.ts
│   │   │   └── game/
│   │   │   │   └── gameConfig.ts
│   │   │   └── factions/
│   │   │   │   └── factionConfig.ts
│   │   │   │   └── factions.ts
│   │   └── tests/
│   │   │   └── setup.ts
│   │   │   └── utils/
│   │   │   │   └── testUtils.tsx
│   │   │   └── components/
│   │   │   │   └── weapons/
│   │   │   │   │   └── WeaponSystem.test.tsx
│   │   │   │   │   └── WeaponUpgradeSystem.test.tsx
│   │   └── utils/
│   │   │   └── helpers.ts
│   │   │   └── idGenerator.ts
│   │   │   └── math.ts
│   │   │   └── shipUtils.ts
│   │   │   └── ships/
│   │   │   │   └── shipClassUtils.ts
│   │   │   └── types/
│   │   │   └── math/
│   │   │   └── effects/
│   │   │   │   └── effectUtils.ts
│   │   └── styles/
│   │   │   └── ui/
│   │   │   │   └── vpr-system.css
│   │   │   └── components/
│   │   │   │   └── capital-ships.css
│   │   │   │   └── colony.css
│   │   │   │   └── exploration.css
│   │   │   │   └── habitable-world.css
│   │   │   │   └── mineral-processing.css
│   │   │   │   └── mothership.css
│   │   │   └── effects/
│   │   │   │   └── effects.css
│   │   │   │   └── vpr-effects.css
│   │   └── components/
│   │   │   └── ui/
│   │   │   │   └── DiplomacyPanel.tsx
│   │   │   │   └── GalaxyMap.tsx
│   │   │   │   └── GameHUD.tsx
│   │   │   │   └── GameLayout.tsx
│   │   │   │   └── NotificationSystem.tsx
│   │   │   │   └── SprawlView.tsx
│   │   │   │   └── TechTree.tsx
│   │   │   │   └── TooltipProvider.tsx
│   │   │   │   └── VPRErrorBoundary.tsx
│   │   │   │   └── VPRLoadingFallback.tsx
│   │   │   │   └── VPRStarSystemView.tsx
│   │   │   │   └── tooltip-context.ts
│   │   │   │   └── buttons/
│   │   │   │   │   └── AbilityButton.tsx
│   │   │   │   └── status/
│   │   │   │   │   └── StatusEffect.tsx
│   │   │   └── ships/
│   │   │   │   └── common/
│   │   │   │   │   └── CommonShipMovement.tsx
│   │   │   │   │   └── CommonShipStats.tsx
│   │   │   │   └── FactionShips/
│   │   │   │   │   └── FactionDashboard.tsx
│   │   │   │   │   └── FactionFleet.tsx
│   │   │   │   │   └── FactionShipBase.tsx
│   │   │   │   │   └── FactionShipStats.tsx
│   │   │   │   │   └── lostNova/
│   │   │   │   │   │   └── DarkMatterReaper.tsx
│   │   │   │   │   │   └── EclipseScythe.tsx
│   │   │   │   │   │   └── LostNovaShip.tsx
│   │   │   │   │   │   └── NullHunter.tsx
│   │   │   │   │   └── equatorHorizon/
│   │   │   │   │   │   └── CelestialArbiter.tsx
│   │   │   │   │   │   └── EquatorHorizonShip.tsx
│   │   │   │   │   │   └── EtherealGalleon.tsx
│   │   │   │   │   │   └── StellarEquinox.tsx
│   │   │   │   │   └── spaceRats/
│   │   │   │   │   │   └── AsteroidMarauder.tsx
│   │   │   │   │   │   └── RatKing.tsx
│   │   │   │   │   │   └── RogueNebula.tsx
│   │   │   │   │   │   └── SpaceRatShip.tsx
│   │   │   │   └── base/
│   │   │   │   │   └── BaseShip.tsx
│   │   │   │   └── player/
│   │   │   │   │   └── variants/
│   │   │   │   │   │   └── reconships/
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
│   │   │   └── buildings/
│   │   │   │   └── colony/
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
│   │   │   └── combat/
│   │   │   │   └── BattleEnvironment.tsx
│   │   │   │   └── SalvageSystem.tsx
│   │   │   └── trade/
│   │   │   │   └── TradeRouteVisualizer.tsx
│   │   │   └── weapons/
│   │   │   │   └── WeaponComponents.tsx
│   │   │   │   └── WeaponControl.tsx
│   │   │   │   └── WeaponLoadout.tsx
│   │   │   │   └── WeaponSystem.tsx
│   │   │   │   └── WeaponUpgradeSystem.tsx
│   │   │   └── factions/
│   │   │   │   └── FactionAI.tsx
│   │   │   │   └── FactionManager.tsx
│   │   │   └── effects/
│   │   │   │   └── BackgroundEffect.tsx
│   │   │   │   └── BuildingUpgradeEffect.tsx
│   │   │   │   └── CapitalShipEffect.tsx
│   │   │   │   └── CentralMothership.tsx
│   │   │   │   └── ColonyStarStation.tsx
│   │   │   │   └── ExplorationHub.tsx
│   │   │   │   └── ExplosionEffect.tsx
│   │   │   │   └── HabitableWorld.tsx
│   │   │   │   └── MineralProcessing.tsx
│   │   │   │   └── ModuleUpgradeTransition.tsx
│   │   │   │   └── PopulationIndicator.tsx
│   │   │   │   └── ProgressionEffects.tsx
│   │   │   │   └── ShieldEffect.tsx
│   │   │   │   └── SmokeTrailEffect.tsx
│   │   │   │   └── StarSystemBackdrop.tsx
│   │   │   │   └── ThrusterEffect.tsx
│   │   │   │   └── TradeRouteEffect.tsx
│   │   │   │   └── WeaponEffect.tsx
│   │   │   └── debug/
│   │   │   │   └── AIDebugOverlay.tsx
│   │   └── hooks/
│   │   │   └── ui/
│   │   │   │   └── useDebugOverlay.ts
│   │   │   │   └── useTooltip.ts
│   │   │   │   └── useVPR.ts
│   │   │   │   └── useVPRInteractivity.ts
│   │   │   │   └── useVPRSystem.ts
│   │   │   └── ships/
│   │   │   │   └── useShipActions.ts
│   │   │   │   └── useShipEffects.ts
│   │   │   └── combat/
│   │   │   │   └── useCombatSystem.ts
│   │   │   └── game/
│   │   │   │   └── useAnimation.ts
│   │   │   │   └── useAssets.ts
│   │   │   │   └── useGameState.ts
│   │   │   │   └── useGlobalEvents.ts
│   │   │   │   └── useScalingSystem.ts
│   │   │   └── factions/
│   │   │   │   └── useAdaptiveAI.ts
│   │   │   │   └── useDiplomacy.ts
│   │   │   │   └── useEnemyAI.ts
│   │   │   │   └── useFactionAI.ts
│   │   │   │   └── useFactionBehavior.ts
│   │   │   │   └── useFleetAI.ts
│   │   └── lib/
│   │   │   └── combat/
│   │   │   │   └── combatManager.ts
│   │   │   │   └── salvageManager.ts
│   │   │   └── utils/
│   │   │   │   └── EventEmitter.ts
│   │   │   └── game/
│   │   │   │   └── animationManager.ts
│   │   │   │   └── assetManager.ts
│   │   │   │   └── gameManager.ts
│   │   │   │   └── techTreeManager.ts
│   │   │   └── ai/
│   │   │   │   └── behaviorTree.ts
│   │   │   │   └── shipBehavior.ts
│   │   │   │   └── shipMovement.ts
│   │   │   └── factions/
│   │   │   │   └── factionManager.ts
```

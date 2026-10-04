/**
 * ManagerRegistry.ts
 *
 * Central registry for all manager singletons to avoid circular dependencies
 * and ensure consistent access to manager instances.
 * @context: registry-system, manager-registry
 */

import { GlobalAutomationManager } from './automation/GlobalAutomationManager';
import { CombatManager } from './combat/combatManager';
import { CombatMechanicsSystem, CombatMechanicsSystemImpl } from './combat/CombatMechanicsSystem';
import { ObjectDetectionSystem, ObjectDetectionSystemImpl } from './combat/ObjectDetectionSystem';
import {
  ThreatAssessmentManager,
  ThreatAssessmentManagerImpl,
} from './combat/ThreatAssessmentManager';
import { effectLifecycleManager, EffectLifecycleManager } from './effects/EffectLifecycleManager';
import { ParticleSystemManager } from './effects/ParticleSystemManager';
import { ExplorationManager } from './exploration/ExplorationManager';
import { ReconShipManagerImpl } from './exploration/ReconShipManager';
import { FactionBehaviorManager } from './factions/FactionBehaviorManager';
import { AssetManager } from './game/assetManager';
import { AsteroidFieldManager } from './game/AsteroidFieldManager';
import { AutomationManager } from './game/AutomationManager';
import { GameLoopManager } from './game/GameLoopManager';
import { GameManager, gameManager as gameManagerSingleton } from './game/gameManager';
import { ResourceManager } from './game/ResourceManager';
import { TechTreeManager } from './game/techTreeManager';
import { MiningShipManager } from './mining/MiningShipManager';
import { ModuleManager } from './module/ModuleManager';
import { ModuleStatusManager } from './module/ModuleStatusManager';
import { OfficerManager } from './module/OfficerManager';
import { ResourceConversionManager } from './resource/ResourceConversionManager';
import { ResourceFlowManager } from './resource/ResourceFlowManager';
import { ShipManager } from './ships/ShipManager';

// Singleton instances
let combatManagerInstance: CombatManager | null = null;
let objectDetectionSystemInstance: ObjectDetectionSystem | null = null;
let threatAssessmentManagerInstance: ThreatAssessmentManager | null = null;
let combatMechanicsSystemInstance: CombatMechanicsSystem | null = null;
let techTreeManagerInstance: TechTreeManager | null = null;
let resourceManagerInstance: ResourceManager | null = null;
let automationManagerInstance: AutomationManager | null = null;
let globalAutomationManagerInstance: GlobalAutomationManager | null = null;
let factionBehaviorManagerInstance: FactionBehaviorManager | null = null;
let asteroidFieldManagerInstance: AsteroidFieldManager | null = null;
let resourceFlowManagerInstance: ResourceFlowManager | null = null;
let resourceConversionManagerInstance: ResourceConversionManager | null = null;
let miningShipManagerInstance: MiningShipManager | null = null;
let explorationManagerInstance: ExplorationManager | null = null;
let reconShipManagerInstance: ReconShipManagerImpl | null = null;
let officerManagerInstance: OfficerManager | null = null;
let moduleManagerInstance: ModuleManager | null = null;
let moduleStatusManagerInstance: ModuleStatusManager | null = null;
let gameLoopManagerInstance: GameLoopManager | null = null;
let gameManagerInstance: GameManager | null = null;
let assetManagerInstance: AssetManager | null = null;
let shipManagerInstance: ShipManager | null = null;
let particleSystemManagerInstance: ParticleSystemManager | null = null;

/**
 * Get the singleton instance of CombatManager
 * @returns The CombatManager instance
 */
export function getCombatManager(): CombatManager {
  combatManagerInstance ??= new CombatManager();
  return combatManagerInstance;
}

/**
 * Get the singleton instance of ObjectDetectionSystem
 * @returns The ObjectDetectionSystem instance
 */
export function getObjectDetectionSystem(): ObjectDetectionSystem {
  objectDetectionSystemInstance ??= ObjectDetectionSystemImpl.getInstance();
  return objectDetectionSystemInstance;
}

/**
 * Get the singleton instance of ThreatAssessmentManager
 * @returns The ThreatAssessmentManager instance
 */
export function getThreatAssessmentManager(): ThreatAssessmentManager {
  threatAssessmentManagerInstance ??= new ThreatAssessmentManagerImpl();
  // Add non-null assertion
  return threatAssessmentManagerInstance;
}

/**
 * Get the singleton instance of CombatMechanicsSystem
 * @returns The CombatMechanicsSystem instance
 */
export function getCombatMechanicsSystem(): CombatMechanicsSystem {
  combatMechanicsSystemInstance ??= CombatMechanicsSystemImpl.getInstance(getObjectDetectionSystem());
  return combatMechanicsSystemInstance;
}

/**
 * Get the singleton instance of TechTreeManager
 * @returns The TechTreeManager instance
 */
export function getTechTreeManager(): TechTreeManager {
  techTreeManagerInstance ??= TechTreeManager.getInstance();
  return techTreeManagerInstance;
}

/**
 * Get the singleton instance of ResourceManager
 * @returns The ResourceManager instance
 */
export function getResourceManager(): ResourceManager {
  resourceManagerInstance ??= ResourceManager.getInstance();
  return resourceManagerInstance;
}

/**
 * Get the singleton instance of AutomationManager
 * @returns The AutomationManager instance
 */
export function getAutomationManager(): AutomationManager {
  automationManagerInstance ??= new AutomationManager();
  return automationManagerInstance;
}

/**
 * Get the singleton instance of GlobalAutomationManager
 * @returns The GlobalAutomationManager instance
 */
export function getGlobalAutomationManager(): GlobalAutomationManager {
  globalAutomationManagerInstance ??= GlobalAutomationManager.getInstance();
  return globalAutomationManagerInstance;
}

/**
 * Get the singleton instance of FactionBehaviorManager
 * @returns The FactionBehaviorManager instance
 */
export function getFactionBehaviorManager(): FactionBehaviorManager {
  factionBehaviorManagerInstance ??= new FactionBehaviorManager();
  return factionBehaviorManagerInstance;
}

/**
 * Get the singleton instance of AsteroidFieldManager
 * @returns The AsteroidFieldManager instance
 */
export function getAsteroidFieldManager(): AsteroidFieldManager {
  asteroidFieldManagerInstance ??= new AsteroidFieldManager();
  return asteroidFieldManagerInstance;
}

/**
 * Get the singleton instance of ResourceFlowManager
 * @returns The ResourceFlowManager instance
 */
export function getResourceFlowManager(): ResourceFlowManager {
  resourceFlowManagerInstance ??= ResourceFlowManager.getInstance();
  return resourceFlowManagerInstance;
}

/**
 * Get the singleton instance of MiningShipManagerImpl
 * @returns The MiningShipManagerImpl instance
 */
export function getMiningShipManager(): MiningShipManager {
  miningShipManagerInstance ??= MiningShipManager.getInstance();
  return miningShipManagerInstance;
}

/**
 * Get the singleton instance of ResourceConversionManager
 * @returns The ResourceConversionManager instance
 */
export function getResourceConversionManager(): ResourceConversionManager {
  resourceConversionManagerInstance ??= ResourceConversionManager.getInstance();
  return resourceConversionManagerInstance;
}

/**
 * Get the singleton instance of EffectLifecycleManager
 * @returns The EffectLifecycleManager instance
 */
export function getEffectLifecycleManager(): EffectLifecycleManager {
  // Return the imported singleton instance directly
  return effectLifecycleManager;
}

/**
 * Get the singleton instance of ExplorationManager
 * @returns The ExplorationManager instance
 */
export function getExplorationManager(): ExplorationManager {
  if (!explorationManagerInstance) {
    explorationManagerInstance = new ExplorationManager(getReconShipManager());
  }
  return explorationManagerInstance!;
}

/**
 * Get the singleton instance of ReconShipManager
 * @returns The ReconShipManager instance
 */
export function getReconShipManager(): ReconShipManagerImpl {
  if (!reconShipManagerInstance) {
    reconShipManagerInstance = new ReconShipManagerImpl();
  }
  return reconShipManagerInstance!;
}

/**
 * Get the singleton instance of OfficerManager
 * @returns The OfficerManager instance
 */
export function getOfficerManager(): OfficerManager {
  if (!officerManagerInstance) {
    officerManagerInstance = new OfficerManager();
  }
  return officerManagerInstance!;
}

/**
 * Get the singleton instance of ModuleManager
 * @returns The ModuleManager instance
 */
export function getModuleManager(): ModuleManager {
  if (!moduleManagerInstance) {
    moduleManagerInstance = new ModuleManager();
  }
  return moduleManagerInstance!;
}

/**
 * Get the singleton instance of ModuleStatusManager
 * @returns The ModuleStatusManager instance
 */
export function getModuleStatusManager(): ModuleStatusManager {
  if (!moduleStatusManagerInstance) {
    moduleStatusManagerInstance = ModuleStatusManager.getInstance();
  }
  return moduleStatusManagerInstance!;
}

/**
 * Get the singleton instance of GameLoopManager
 * @returns The GameLoopManager instance
 */
export function getGameLoopManager(): GameLoopManager {
  if (!gameLoopManagerInstance) {
    gameLoopManagerInstance = new GameLoopManager();
  }
  return gameLoopManagerInstance!;
}

/**
 * Get the singleton instance of GameManager
 * @returns The GameManager instance
 */
export function getGameManager(): GameManager {
  gameManagerInstance ??= gameManagerSingleton;
  return gameManagerInstance;
}

/**
 * Get the singleton instance of AssetManager
 * @returns The AssetManager instance
 */
export function getAssetManager(): AssetManager {
  if (!assetManagerInstance) {
    assetManagerInstance = AssetManager.getInstance();
  }
  return assetManagerInstance!;
}

/**
 * Get the singleton instance of ShipManager
 * @returns The ShipManager instance
 */
export function getShipManager(): ShipManager {
  if (!shipManagerInstance) {
    shipManagerInstance = ShipManager.getInstance();
  }
  return shipManagerInstance!;
}

/**
 * Get the singleton instance of ParticleSystemManager
 * @returns The ParticleSystemManager instance
 */
export function getParticleSystemManager(): ParticleSystemManager {
  if (!particleSystemManagerInstance) {
    particleSystemManagerInstance = ParticleSystemManager.getInstance();
  }
  return particleSystemManagerInstance!;
}

/**
 * Reset all manager instances - primarily used for testing
 */
export function resetManagers(): void {
  combatManagerInstance = null;
  objectDetectionSystemInstance = null;
  threatAssessmentManagerInstance = null;
  combatMechanicsSystemInstance = null;
  techTreeManagerInstance = null;
  resourceManagerInstance = null;
  automationManagerInstance = null;
  globalAutomationManagerInstance = null;
  factionBehaviorManagerInstance = null;
  asteroidFieldManagerInstance = null;
  resourceFlowManagerInstance = null;
  resourceConversionManagerInstance = null;
  miningShipManagerInstance = null;
  explorationManagerInstance = null;
  reconShipManagerInstance = null;
  officerManagerInstance = null;
  moduleManagerInstance = null;
  moduleStatusManagerInstance = null;
  gameLoopManagerInstance = null;
  gameManagerInstance = null;
  assetManagerInstance = null;
  shipManagerInstance = null;
  particleSystemManagerInstance = null;
  // Resetting the imported instance isn't straightforward from here.
  // The original file might need its own reset logic if required for testing.
}

// Export manager classes for type usage
export { CombatManager, GameManager, ResourceManager };
export type {
  AssetManager,
  AsteroidFieldManager,
  AutomationManager,
  CombatMechanicsSystem,
  EffectLifecycleManager,
  ExplorationManager,
  FactionBehaviorManager,
  GameLoopManager,
  GlobalAutomationManager,
  MiningShipManager,
  ModuleManager,
  ModuleStatusManager,
  ObjectDetectionSystem,
  OfficerManager,
  ParticleSystemManager,
  ResourceConversionManager,
  ResourceFlowManager,
  ShipManager,
  TechTreeManager,
  ThreatAssessmentManager,
};
export type { ReconShipManagerImpl };

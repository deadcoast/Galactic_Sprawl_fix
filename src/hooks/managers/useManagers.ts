/**
 * Manager Access Hooks
 *
 * Standardized React hooks for accessing manager instances from ManagerRegistry.
 * All hooks use useMemo for performance optimization.
 *
 * Usage:
 * ```typescript
 * import { useResourceManager, useCombatManager } from '@/hooks/managers/useManagers';
 *
 * function MyComponent() {
 *   const resourceManager = useResourceManager();
 *   const combatManager = useCombatManager();
 *
 *   // Use managers...
 * }
 * ```
 */

import { useMemo } from 'react';
import {
  getAssetManager,
  getAsteroidFieldManager,
  getAutomationManager,
  getCombatManager,
  getCombatMechanicsSystem,
  getEffectLifecycleManager,
  getExplorationManager,
  getFactionBehaviorManager,
  getGameLoopManager,
  getGameManager,
  getGlobalAutomationManager,
  getMiningShipManager,
  getModuleManager,
  getModuleStatusManager,
  getObjectDetectionSystem,
  getOfficerManager,
  getParticleSystemManager,
  getReconShipManager,
  getShipManager,
  getResourceConversionManager,
  getResourceFlowManager,
  getResourceManager,
  getTechTreeManager,
  getThreatAssessmentManager,
  type AssetManager,
  type AsteroidFieldManager,
  type AutomationManager,
  type CombatManager,
  type CombatMechanicsSystem,
  type EffectLifecycleManager,
  type ExplorationManager,
  type FactionBehaviorManager,
  type GameLoopManager,
  type GameManager,
  type GlobalAutomationManager,
  type MiningShipManager,
  type ModuleManager,
  type ModuleStatusManager,
  type ObjectDetectionSystem,
  type OfficerManager,
  type ParticleSystemManager,
  type ReconShipManagerImpl,
  type ShipManager,
  type ResourceConversionManager,
  type ResourceFlowManager,
  type ResourceManager,
  type TechTreeManager,
  type ThreatAssessmentManager,
} from '../../managers/ManagerRegistry';

/**
 * Hook to access the ResourceManager singleton
 * Manages game resources, production, consumption, and transfers
 */
export function useResourceManager(): ResourceManager {
  return useMemo(() => getResourceManager(), []);
}

/**
 * Hook to access the ResourceFlowManager singleton
 * Manages resource flow networks, conversions, and optimizations
 */
export function useResourceFlowManager(): ResourceFlowManager {
  return useMemo(() => getResourceFlowManager(), []);
}

/**
 * Hook to access the ResourceConversionManager singleton
 * Manages resource conversion recipes and processes
 */
export function useResourceConversionManager(): ResourceConversionManager {
  return useMemo(() => getResourceConversionManager(), []);
}

/**
 * Hook to access the CombatManager singleton
 * Manages combat systems and battle coordination
 */
export function useCombatManager(): CombatManager {
  return useMemo(() => getCombatManager(), []);
}

/**
 * Hook to access the CombatMechanicsSystem singleton
 * Manages combat mechanics calculations and rules
 */
export function useCombatMechanicsSystem(): CombatMechanicsSystem {
  return useMemo(() => getCombatMechanicsSystem(), []);
}

/**
 * Hook to access the ThreatAssessmentManager singleton
 * Manages threat evaluation and tactical assessments
 */
export function useThreatAssessmentManager(): ThreatAssessmentManager {
  return useMemo(() => getThreatAssessmentManager(), []);
}

/**
 * Hook to access the ObjectDetectionSystem singleton
 * Manages object detection for combat and navigation
 */
export function useObjectDetectionSystem(): ObjectDetectionSystem {
  return useMemo(() => getObjectDetectionSystem(), []);
}

/**
 * Hook to access the MiningShipManager singleton
 * Manages mining ship operations and assignments
 */
export function useMiningShipManager(): MiningShipManager {
  return useMemo(() => getMiningShipManager(), []);
}

/**
 * Hook to access the TechTreeManager singleton
 * Manages technology tree and research progression
 */
export function useTechTreeManager(): TechTreeManager {
  return useMemo(() => getTechTreeManager(), []);
}

/**
 * Hook to access the AutomationManager singleton
 * Manages automation systems
 */
export function useAutomationManager(): AutomationManager {
  return useMemo(() => getAutomationManager(), []);
}

/**
 * Hook to access the GlobalAutomationManager singleton
 * Manages global automation coordination
 */
export function useGlobalAutomationManager(): GlobalAutomationManager {
  return useMemo(() => getGlobalAutomationManager(), []);
}

/**
 * Hook to access the FactionBehaviorManager singleton
 * Manages faction AI behaviors
 */
export function useFactionBehaviorManager(): FactionBehaviorManager {
  return useMemo(() => getFactionBehaviorManager(), []);
}

/**
 * Hook to access the AsteroidFieldManager singleton
 * Manages asteroid field generation and resources
 */
export function useAsteroidFieldManager(): AsteroidFieldManager {
  return useMemo(() => getAsteroidFieldManager(), []);
}

/**
 * Hook to access the EffectLifecycleManager singleton
 * Manages visual effects lifecycle
 */
export function useEffectLifecycleManager(): EffectLifecycleManager {
  return useMemo(() => getEffectLifecycleManager(), []);
}

/**
 * Hook to access the ExplorationManager singleton
 * Manages star system exploration, ship assignments, and sector scanning
 */
export function useExplorationManager(): ExplorationManager {
  return useMemo(() => getExplorationManager(), []);
}

/**
 * Hook to access the ReconShipManager singleton
 * Manages reconnaissance ship operations and assignments
 */
export function useReconShipManager(): ReconShipManagerImpl {
  return useMemo(() => getReconShipManager(), []);
}

/**
 * Hook to access the OfficerManager singleton
 * Manages officers, squads, and training programs
 */
export function useOfficerManager(): OfficerManager {
  return useMemo(() => getOfficerManager(), []);
}

/**
 * Hook to access the ModuleManager singleton
 * Manages module creation, attachment, and upgrades
 */
export function useModuleManager(): ModuleManager {
  return useMemo(() => getModuleManager(), []);
}

/**
 * Hook to access the ModuleStatusManager singleton
 * Manages module status tracking and lifecycle
 */
export function useModuleStatusManager(): ModuleStatusManager {
  return useMemo(() => getModuleStatusManager(), []);
}

/**
 * Hook to access the ParticleSystemManager singleton
 * Manages particle effects and rendering
 */
export function useParticleSystemManager(): ParticleSystemManager {
  return useMemo(() => getParticleSystemManager(), []);
}

/**
 * Hook to access the ShipManager singleton
 * Manages ship registry, status tracking, and assignments
 */
export function useShipManager(): ShipManager {
  return useMemo(() => getShipManager(), []);
}

/**
 * Hook to access the GameLoopManager singleton
 * Manages the core game loop, update cycles, and timing
 */
export function useGameLoopManager(): GameLoopManager {
  return useMemo(() => getGameLoopManager(), []);
}

/**
 * Hook to access the GameManager singleton
 * Manages game state, start/stop/pause functionality
 */
export function useGameManager(): GameManager {
  return useMemo(() => getGameManager(), []);
}

/**
 * Hook to access the AssetManager singleton
 * Manages game asset loading and retrieval
 */
export function useAssetManager(): AssetManager {
  return useMemo(() => getAssetManager(), []);
}

/**
 * Hook to access multiple managers at once
 * Useful when a component needs several managers
 *
 * @example
 * ```typescript
 * const { resourceManager, combatManager } = useManagers();
 * ```
 */
export function useManagers() {
  return useMemo(
    () => ({
      resourceManager: getResourceManager(),
      resourceFlowManager: getResourceFlowManager(),
      resourceConversionManager: getResourceConversionManager(),
      combatManager: getCombatManager(),
      combatMechanicsSystem: getCombatMechanicsSystem(),
      threatAssessmentManager: getThreatAssessmentManager(),
      objectDetectionSystem: getObjectDetectionSystem(),
      miningShipManager: getMiningShipManager(),
      techTreeManager: getTechTreeManager(),
      automationManager: getAutomationManager(),
      globalAutomationManager: getGlobalAutomationManager(),
      factionBehaviorManager: getFactionBehaviorManager(),
      asteroidFieldManager: getAsteroidFieldManager(),
      effectLifecycleManager: getEffectLifecycleManager(),
      explorationManager: getExplorationManager(),
      reconShipManager: getReconShipManager(),
      officerManager: getOfficerManager(),
      moduleManager: getModuleManager(),
      moduleStatusManager: getModuleStatusManager(),
      particleSystemManager: getParticleSystemManager(),
      shipManager: getShipManager(),
      gameLoopManager: getGameLoopManager(),
      gameManager: getGameManager(),
      assetManager: getAssetManager(),
    }),
    []
  );
}

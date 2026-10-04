/**
 * Manager Hooks Index
 *
 * Central export point for all manager access hooks.
 * Import from this file to access any manager in your components.
 *
 * @example
 * ```typescript
 * import { useResourceManager, useCombatManager } from '@/hooks/managers';
 * ```
 */

export {
  useAssetManager,
  useAsteroidFieldManager,
  useAutomationManager,
  useCombatManager,
  useCombatMechanicsSystem,
  useEffectLifecycleManager,
  useExplorationManager,
  useFactionBehaviorManager,
  useGameLoopManager,
  useGameManager,
  useGlobalAutomationManager,
  useManagers,
  useMiningShipManager,
  useModuleStatusManager,
  useObjectDetectionSystem,
  useOfficerManager,
  useReconShipManager,
  useResourceConversionManager,
  useResourceFlowManager,
  useResourceManager,
  useTechTreeManager,
  useThreatAssessmentManager,
} from './useManagers';

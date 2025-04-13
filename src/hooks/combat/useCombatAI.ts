import { useCallback, useEffect, useState } from 'react';
import { behaviorTreeManager } from './../../managers/ai/BehaviorTreeManager';
// Assume BehaviorEvents should be imported or defined elsewhere

import { getCombatManager } from '../../managers/ManagerRegistry'; // Assume getBehaviorTreeManager is correct
import { CombatUnitStatus } from '../../types/combat/CombatTypes';
import type { AIState } from '../../types/debug/DebugTypes';
import { CombatUnitDamageEvent, CombatUnitStatusEvent } from '../../types/events/CombatEvents';
import { FactionId } from '../../types/ships/FactionShipTypes';
// Define formation interface to replace unknown type
interface UnitFormation {
  type: 'offensive' | 'defensive' | 'balanced';
  spacing: number;
  facing: number;
}

// TODO: Replace 'any' with actual BehaviorEvents type once available/exported
type BehaviorEventPayload = any;

// Get the singleton instance of the BehaviorTreeManager
const behaviorTreeManager = getBehaviorTreeManager();

export function useCombatAI(unitId: string, factionId: FactionId) {
  const [status, setStatus] = useState<CombatUnitStatus>({
    main: 'active',
    effects: [],
  });
  const [performance, setPerformance] = useState({
    successRate: 0,
    damageDealt: 0,
    damageTaken: 0,
    killCount: 0,
  });

  // Add state for current formation
  const [currentFormation, setCurrentFormation] = useState<UnitFormation>({
    type: 'balanced',
    spacing: 100,
    facing: 0,
  });

  const [aiState, setAIState] = useState<AIState>({
    behaviorState: 'idle',
    fleetStrength: 0, // Initialize appropriately
    threatLevel: 0, // Initialize appropriately
    lastAction: 'None',
    nextAction: 'evaluate',
    cooldowns: {},
  });
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // --- Event Handlers ---

  /**
   * Handles the 'nodeExecuted' event from the behavior tree.
   * Updates the AI state based on the outcome of the executed node.
   */
  // TODO: Replace 'any' with BehaviorEvents['nodeExecuted']
  const handleNodeExecuted = useCallback(
    (event: BehaviorEventPayload) => {
      if (!unitId || event?.unitId !== unitId) {
        return;
      }

      setAIState(prevState => ({
        ...prevState,
        // behaviorState: event.nodeName === 'FindTargetNode' && event.success ? 'engaging' : prevState.behaviorState,
        lastAction: `Node: ${event?.nodeName} (${event?.success ? 'Success' : 'Failure'})`,
      }));
      setLastUpdateTime(Date.now());
    },
    [unitId]
  );

  /**
   * Handles the 'actionStarted' event from the behavior tree.
   * Updates the AI state to reflect the action currently being performed.
   */
  // TODO: Replace 'any' with BehaviorEvents['actionStarted']
  const handleActionStarted = useCallback(
    (event: BehaviorEventPayload) => {
      if (!unitId || event?.unitId !== unitId) {
        return;
      }

      setAIState(prevState => ({
        ...prevState,
        behaviorState: 'acting', // General 'acting' state, could be more specific
        lastAction: `Started: ${event?.actionName}`,
        nextAction: `Complete: ${event?.actionName}`, // Indicate the expected completion
      }));
      setLastUpdateTime(Date.now());
    },
    [unitId]
  );

  /**
   * Handles the 'actionCompleted' event from the behavior tree.
   * Updates the AI state after an action finishes, potentially triggering evaluation.
   */
  // TODO: Replace 'any' with BehaviorEvents['actionCompleted']
  const handleActionCompleted = useCallback(
    (event: BehaviorEventPayload) => {
      if (!unitId || event?.unitId !== unitId) {
        return;
      }

      setAIState(prevState => ({
        ...prevState,
        behaviorState: 'idle', // Return to idle after action completion
        lastAction: `Completed: ${event?.actionName} (${event?.success ? 'Success' : 'Failure'})`,
        nextAction: 'evaluate', // Trigger re-evaluation
      }));
      setLastUpdateTime(Date.now());
    },
    [unitId]
  );

  // TODO: Replace 'any' with BehaviorEvents['treeCompleted']
  const handleTreeCompletedInternal = useCallback(
    (event: BehaviorEventPayload) => {
      if (event?.unitId === unitId) {
        setPerformance(prev => ({
          ...prev,
          successRate: prev.successRate * 0.9 + (event?.success ? 0.1 : 0),
        }));
      }
    },
    [unitId]
  );

  useEffect(() => {
    const combatManager = getCombatManager();

    // TODO: Replace 'any' with BehaviorEvents['nodeExecuted']
    const handleNodeExecutedPerf = (event: BehaviorEventPayload) => {
      // Update performance metrics based on node execution
      setPerformance(prev => ({
        ...prev,
        successRate: prev.successRate * 0.9 + (event?.success ? 0.1 : 0),
      }));
    };

    // TODO: Replace 'any' with BehaviorEvents['actionStarted']
    const handleActionStartedStatus = (event: BehaviorEventPayload) => {
      if (event?.unitId === unitId) {
        // Update status based on action type
        setStatus(prev => ({
          ...prev,
          secondary: 'charging', // Assuming 'charging' is a valid secondary status
        }));
      }
    };

    // Set up subscriptions if behaviorTreeManager exists and has 'on' method
    let unsubscribeNodeExecuted: (() => void) | undefined;
    let unsubscribeActionStarted: (() => void) | undefined;
    let unsubscribeTreeCompleted: (() => void) | undefined;

    if (behaviorTreeManager && typeof behaviorTreeManager.on === 'function') {
      unsubscribeNodeExecuted = behaviorTreeManager.on('nodeExecuted', handleNodeExecutedPerf);
      unsubscribeActionStarted = behaviorTreeManager.on('actionStarted', handleActionStartedStatus);
      unsubscribeTreeCompleted = behaviorTreeManager.on(
        'treeCompleted',
        handleTreeCompletedInternal
      );
    } else {
      console.warn(
        "behaviorTreeManager or its 'on' method is not available for event subscription."
      );
    }

    // Subscribe to combat events for performance tracking
    const unsubscribeDamaged = combatManager.on(
      'combat:unit-damaged',
      (event: CombatUnitDamageEvent) => {
        if (event?.unitId === unitId) {
          setPerformance(prev => ({
            ...prev,
            damageTaken: prev.damageTaken + event?.damageAmount,
          }));
        } else if (event?.damageSource === unitId) {
          setPerformance(prev => ({
            ...prev,
            damageDealt: prev.damageDealt + event?.damageAmount,
          }));
        }
      }
    );

    const unsubscribeStatusChanged = combatManager.on(
      'combat:unit-status-changed',
      (event: CombatUnitStatusEvent) => {
        if (event?.unitId === unitId) {
          // Convert string status to CombatUnitStatus object
          setStatus({
            main: event?.status === 'destroyed' ? 'destroyed' : 'active', // Assuming 'active' is default if not destroyed
            effects: [], // Reset effects or update based on event data if available
          });
        }
      }
    );

    // Update behavior tree periodically
    const updateInterval = setInterval(() => {
      const unit = combatManager.getUnitStatus?.(unitId);
      if (!unit) {
        return;
      }

      const convertStatus = (status: string): CombatUnitStatus => ({
        main: status === 'destroyed' ? 'destroyed' : status === 'disabled' ? 'disabled' : 'active',
        effects: [],
      });

      // Use optional chaining and default values for safety
      const nearbyEnemies = (
        combatManager
          .getUnitsInRange?.(unit.position, 500)
          ?.filter(other => other.faction !== factionId) ?? []
      ).map(u => ({
        // Map CombatUnit to structure expected by context
        id: u.id,
        faction: u.faction,
        position: u.position,
        status: convertStatus(u.status), // Use converted status
        stats: {
          health: u.stats?.health ?? 0,
          shield: u.stats?.shield ?? 0,
          armor: u.stats?.armor ?? 0,
        }, // Select relevant stats
        // Add other relevant properties needed by the behavior tree
      }));

      const nearbyAllies = (
        combatManager
          .getUnitsInRange?.(unit.position, 500)
          ?.filter(other => other.faction === factionId && other.id !== unitId) ?? []
      ).map(u => ({
        // Map CombatUnit to structure expected by context
        id: u.id,
        faction: u.faction,
        position: u.position,
        status: convertStatus(u.status), // Use converted status
        stats: {
          health: u.stats?.health ?? 0,
          shield: u.stats?.shield ?? 0,
          armor: u.stats?.armor ?? 0,
        }, // Select relevant stats
        // Add other relevant properties needed by the behavior tree
      }));

      // Update formation based on combat situation
      updateFormation(nearbyEnemies.length, nearbyAllies.length);

      // Prepare context, ensure optional properties are handled
      const contextForUpdate = {
        unit: {
          id: unit.id,
          position: unit.position,
          status: convertStatus(unit.status),
          stats: {
            health: unit.stats?.health ?? 0,
            shield: unit.stats?.shield ?? 0,
            armor: unit.stats?.armor ?? 0,
          },
          target: unit.target?.id, // Pass target ID if available
          // Add other necessary unit properties
        },
        factionId,
        fleetStrength: nearbyAllies.reduce((sum, ally) => sum + (ally.stats?.health ?? 0), 0),
        threatLevel: nearbyEnemies.reduce((sum, enemy) => sum + (enemy.stats?.health ?? 0), 0),
        nearbyEnemies,
        nearbyAllies,
        currentFormation,
        lastAction: aiState.lastAction, // Pass current lastAction
        cooldowns: aiState.cooldowns, // Pass current cooldowns
        timestamp: Date.now(), // Add timestamp
      };

      // Update behavior tree context safely
      if (behaviorTreeManager && typeof behaviorTreeManager.updateContext === 'function') {
        behaviorTreeManager.updateContext(unitId, contextForUpdate);
      }

      // Evaluate behavior tree safely
      const treeId = `${factionId}-combat`;
      let evaluationResult: any = null; // TODO: Replace 'any'
      let success = false;
      if (behaviorTreeManager && typeof behaviorTreeManager.evaluateTree === 'function') {
        evaluationResult = behaviorTreeManager.evaluateTree(unitId, treeId);
        success = evaluationResult?.success ?? false; // Use ?? for success flag
      }

      setPerformance(prev => ({
        ...prev,
        successRate: prev.successRate * 0.9 + (success ? 0.1 : 0),
      }));

      // Update AI state based on evaluation result
      setAIState(prevState => ({
        ...prevState,
        nextAction: evaluationResult?.nextAction ?? 'evaluate',
        behaviorState: evaluationResult?.newState ?? prevState.behaviorState,
        cooldowns: evaluationResult?.updatedCooldowns ?? prevState.cooldowns,
      }));
      setLastUpdateTime(Date.now());
    }, 1000);

    return () => {
      clearInterval(updateInterval);
      // Safely call unsubscribe functions
      unsubscribeNodeExecuted?.();
      unsubscribeActionStarted?.();
      unsubscribeTreeCompleted?.();
      unsubscribeDamaged?.(); // Assuming combatManager.on returns a function or undefined
      unsubscribeStatusChanged?.(); // Assuming combatManager.on returns a function or undefined
    };
  }, [unitId, factionId, currentFormation, handleTreeCompletedInternal]); // Added handleTreeCompletedInternal

  // Update formation based on combat situation
  const updateFormation = (enemyCount: number, allyCount: number) => {
    // Dynamically adjust formation based on combat situation
    if (enemyCount > allyCount * 2) {
      // Defensive formation when outnumbered
      setCurrentFormation({
        type: 'defensive',
        spacing: 50, // Tighter spacing for defense
        facing: 0, // Face toward enemies
      });
    } else if (allyCount > enemyCount * 1.5) {
      // Offensive formation when we outnumber enemies
      setCurrentFormation({
        type: 'offensive',
        spacing: 150, // Wider spacing for attack
        facing: 0, // Face toward enemies
      });
    } else {
      // Balanced formation for even engagements
      setCurrentFormation({
        type: 'balanced',
        spacing: 100,
        facing: 0,
      });
    }
  };

  // Expose function to manually set formation
  const setFormation = (
    formationType: 'offensive' | 'defensive' | 'balanced',
    spacing?: number
  ) => {
    setCurrentFormation({
      type: formationType,
      spacing:
        spacing ?? (formationType === 'offensive' ? 150 : formationType === 'defensive' ? 50 : 100), // Use ??
      facing: 0,
    });
  };

  // --- Effects ---

  /**
   * Subscribes to behavior tree events when the component mounts or unitId changes.
   * Unsubscribes when the component unmounts or unitId changes.
   */
  useEffect(() => {
    if (!unitId) return; // Don't subscribe if no unit ID

    // Subscribe to events specific to this unit safely
    let unsubscribeNodeExecuted: (() => void) | undefined;
    let unsubscribeActionStarted: (() => void) | undefined;
    let unsubscribeActionCompleted: (() => void) | undefined;

    if (behaviorTreeManager && typeof behaviorTreeManager.on === 'function') {
      unsubscribeNodeExecuted = behaviorTreeManager.on('nodeExecuted', handleNodeExecuted);
      unsubscribeActionStarted = behaviorTreeManager.on('actionStarted', handleActionStarted);
      unsubscribeActionCompleted = behaviorTreeManager.on('actionCompleted', handleActionCompleted);
    } else {
      console.warn(
        "behaviorTreeManager or its 'on' method is not available for AI event subscription."
      );
    }

    // Cleanup function to unsubscribe
    return () => {
      unsubscribeNodeExecuted?.();
      unsubscribeActionStarted?.();
      unsubscribeActionCompleted?.();
    };
  }, [unitId, handleNodeExecuted, handleActionStarted, handleActionCompleted]); // Resubscribe if unitId or handlers change

  /**
   * Periodically triggers the behavior tree evaluation for the unit.
   */
  useEffect(() => {
    if (!unitId) return; // Don't run evaluation if no unit ID

    const evaluateAI = () => {
      // Fetch necessary context for the unit (target info, environment state, etc.)
      // Replace 'any' with a proper context type
      const context: Record<string, unknown> = {
        // Use Record<string, unknown> instead of any
        unitId: unitId,
        timestamp: Date.now(),
        // Add other necessary context properties here based on Behavior Tree needs
      };

      // Update the context in the behavior tree manager before evaluation safely
      if (behaviorTreeManager && typeof behaviorTreeManager.updateContext === 'function') {
        behaviorTreeManager.updateContext(unitId, context);
      }

      // Evaluate the tree for this unit safely
      let evaluationResult: any = null; // TODO: Replace 'any'
      if (behaviorTreeManager && typeof behaviorTreeManager.evaluateTree === 'function') {
        evaluationResult = behaviorTreeManager.evaluateTree(unitId);
      }

      setAIState(prevState => ({
        ...prevState,
        // Update state based on evaluation result if needed
        nextAction: evaluationResult?.nextAction ?? 'evaluate', // Use result or default
        behaviorState: evaluationResult?.newState ?? prevState.behaviorState,
        cooldowns: evaluationResult?.updatedCooldowns ?? prevState.cooldowns,
      }));
      setLastUpdateTime(Date.now());
    };

    // Evaluate immediately on unitId change, then set interval
    evaluateAI();
    const intervalId = setInterval(evaluateAI, 1000); // Evaluate every second

    // Cleanup function to clear interval
    return () => clearInterval(intervalId);
  }, [unitId, aiState.lastAction, aiState.cooldowns]); // Add relevant state dependencies

  return {
    status,
    performance,
    currentFormation,
    setFormation,
    aiState,
  };
}

/**
 * Updates the combat context for a specific unit within the Behavior Tree Manager.
 * This function should be called whenever the unit's situation changes significantly
 * (e.g., target changed, took damage, new enemies detected).
 *
 * @param unitId - The ID of the unit whose context is being updated.
 * @param updatedContext - An object containing the updated context fields.
 */
// Use Record<string, unknown> instead of Partial<any>
export function updateCombatAIContext(
  unitId: string,
  updatedContext: Partial<Record<string, unknown>>
) {
  if (!unitId) {
    console.warn('Cannot update context for null unitId.');
    return;
  }
  // Use the provided updatedContext type
  if (behaviorTreeManager && typeof behaviorTreeManager.updateContext === 'function') {
    behaviorTreeManager.updateContext(unitId, updatedContext);
  }
}

/**
 * Evaluates the behavior tree for a specific unit immediately.
 * This can be used to force a re-evaluation outside of the regular interval,
 * for example, in response to a high-priority event.
 *
 * @param unitId - The ID of the unit whose behavior tree should be evaluated.
 * @returns The result of the evaluation, potentially including the next action or state.
 */
// TODO: Replace 'any' with the actual return type of evaluateTree
export function evaluateCombatAI(unitId: string): any | null {
  if (!unitId) {
    console.warn('Cannot evaluate AI for null unitId.');
    return null;
  }

  // Evaluate safely
  let evaluationResult: any = null; // TODO: Replace 'any'
  if (behaviorTreeManager && typeof behaviorTreeManager.evaluateTree === 'function') {
    evaluationResult = behaviorTreeManager.evaluateTree(unitId);
  }

  // For now, just return the result
  return evaluationResult ?? {}; // Use ?? to return empty object instead of null if desired
}

/**
 * Retrieves the latest AI state for a given unit ID directly from the hook's state.
 * Note: This provides a snapshot and might not be the absolute latest if called
 * between updates. Primarily useful for debugging or quick checks.
 *
 * @param unitId - The ID of the unit.
 * @returns The last known AIState for the unit, or a default state if not found.
 */
export function getUnitAIState(unitId: string): AIState {
  // This function cannot directly access the 'aiState' from the hook instance.
  // Refactor needed for global state access or manager-based approach.

  // Placeholder implementation: Returns a default state.
  console.warn('getUnitAIState is a placeholder and cannot access hook state directly.');
  return {
    behaviorState: 'idle',
    fleetStrength: 0,
    threatLevel: 0,
    lastAction: 'Unknown',
    nextAction: 'evaluate',
    cooldowns: {},
  };
}

/**
 * Formats the AI state for display purposes, suitable for debugging UI.
 *
 * @param aiState - The AIState object to format.
 * @returns A formatted string representing the AI state.
 */
export function formatAIStateForDisplay(aiState: AIState): string {
  const { behaviorState, lastAction, nextAction, threatLevel, fleetStrength } = aiState;
  // Use nullish coalescing for safety
  const formattedLastAction = lastAction ?? 'None';
  const formattedNextAction = nextAction ?? 'None';

  return `State: ${behaviorState} | Threat: ${threatLevel.toFixed(2)} | Strength: ${fleetStrength.toFixed(0)} | Last: ${formattedLastAction} | Next: ${formattedNextAction}`;
}

import { useEffect, useState } from 'react';
import { behaviorTreeManager } from '../../managers/ai/BehaviorTreeManager';
import { combatManager } from '../../managers/combat/combatManager';
import { CombatUnit } from '../../types/combat/CombatTypes';
import { FactionId } from '../../types/ships/FactionTypes';

interface CombatAIState {
  isActive: boolean;
  currentBehavior: string;
  lastAction: string;
  performance: {
    successRate: number;
    actionsPerMinute: number;
    damageDealt: number;
    damageTaken: number;
  };
}

export function useCombatAI(unitId: string, factionId: FactionId) {
  const [state, setState] = useState<CombatAIState>({
    isActive: false,
    currentBehavior: 'idle',
    lastAction: '',
    performance: {
      successRate: 0,
      actionsPerMinute: 0,
      damageDealt: 0,
      damageTaken: 0,
    },
  });

  useEffect(() => {
    let actionCount = 0;
    let startTime = Date.now();
    let successCount = 0;
    let totalActions = 0;

    // Subscribe to behavior tree events
    const handleNodeExecuted = ({ nodeId, success }: { nodeId: string; success: boolean }) => {
      totalActions++;
      if (success) {
        successCount++;
      }
      setState(prev => ({
        ...prev,
        performance: {
          ...prev.performance,
          successRate: (successCount / totalActions) * 100,
        },
      }));
    };

    const handleActionStarted = ({ actionType }: { actionType: string }) => {
      actionCount++;
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      setState(prev => ({
        ...prev,
        lastAction: actionType,
        performance: {
          ...prev.performance,
          actionsPerMinute: actionCount / elapsedMinutes,
        },
      }));
    };

    behaviorTreeManager.on('nodeExecuted', handleNodeExecuted);
    behaviorTreeManager.on('actionStarted', handleActionStarted);

    // Update AI context periodically
    const updateInterval = setInterval(() => {
      const unit = combatManager.getUnitStatus(unitId) as CombatUnit;
      if (!unit) {
        return;
      }

      const nearbyUnits = combatManager.getUnitsInRange(unit.position, 500);
      const nearbyEnemies = nearbyUnits.filter(u => u.faction !== factionId);
      const nearbyAllies = nearbyUnits.filter(u => u.faction === factionId);

      // Calculate fleet strength and threat level
      const fleetStrength = calculateFleetStrength(unit, nearbyAllies);
      const threatLevel = calculateThreatLevel(nearbyEnemies);

      // Update behavior tree context
      behaviorTreeManager.updateContext(unitId, {
        unit,
        factionId,
        fleetStrength,
        threatLevel,
        nearbyEnemies,
        nearbyAllies,
        currentFormation: unit.formation || {
          type: 'balanced',
          spacing: 100,
          facing: 0,
        },
        cooldowns: {},
      });

      // Evaluate behavior tree
      const treeId = `${factionId}-combat`;
      const success = behaviorTreeManager.evaluateTree(unitId, treeId);

      setState(prev => ({
        ...prev,
        isActive: true,
        currentBehavior: success ? 'executing' : 'idle',
      }));
    }, 250); // Fast updates for combat

    return () => {
      clearInterval(updateInterval);
      behaviorTreeManager.off('nodeExecuted', handleNodeExecuted);
      behaviorTreeManager.off('actionStarted', handleActionStarted);
    };
  }, [unitId, factionId]);

  return state;
}

function calculateFleetStrength(unit: CombatUnit, allies: CombatUnit[]): number {
  const unitStrength = (unit.health / unit.maxHealth) * (unit.shield / unit.maxShield);
  const allyStrength = allies.reduce((sum, ally) => {
    return sum + (ally.health / ally.maxHealth) * (ally.shield / ally.maxShield);
  }, 0);

  return (unitStrength + allyStrength) / (1 + allies.length);
}

function calculateThreatLevel(enemies: CombatUnit[]): number {
  if (enemies.length === 0) {
    return 0;
  }

  return enemies.reduce((sum, enemy) => {
    const baseStrength = (enemy.health / enemy.maxHealth) * (enemy.shield / enemy.maxShield);
    const weaponStrength = enemy.weapons.reduce((total, w) => total + w.damage, 0) / 100;
    return sum + baseStrength * (1 + weaponStrength);
  }, 0) / enemies.length;
} 
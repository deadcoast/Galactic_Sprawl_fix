import { useEffect, useState } from 'react';
import { BehaviorEvents, behaviorTreeManager } from '../../managers/ai/BehaviorTreeManager';
import { getCombatManager } from '../../managers/ManagerRegistry';
import { CombatUnitStatus } from '../../types/combat/CombatTypes';
import { CombatUnitDamageEvent, CombatUnitStatusEvent } from '../../types/events/CombatEvents';
import { FactionId } from '../../types/ships/FactionTypes';
import { WeaponCategory, WeaponStatus } from '../../types/weapons/WeaponTypes';

// Define formation interface to replace any type
interface UnitFormation {
  type: 'offensive' | 'defensive' | 'balanced';
  spacing: number;
  facing: number;
}

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

  useEffect(() => {
    const combatManager = getCombatManager();

    const handleNodeExecuted = (event: BehaviorEvents['nodeExecuted']) => {
      // Update performance metrics based on node execution
      setPerformance(prev => ({
        ...prev,
        successRate: prev.successRate * 0.9 + (event?.success ? 0.1 : 0),
      }));
    };

    const handleActionStarted = (event: BehaviorEvents['actionStarted']) => {
      if (event?.unitId === unitId) {
        // Update status based on action type
        setStatus(prev => ({
          ...prev,
          secondary: 'charging',
        }));
      }
    };

    const handleTreeCompleted = (event: BehaviorEvents['treeCompleted']) => {
      if (event?.unitId === unitId) {
        // Update performance metrics
        setPerformance(prev => ({
          ...prev,
          successRate: prev.successRate * 0.9 + (event?.success ? 0.1 : 0),
        }));
      }
    };

    // Set up subscriptions
    const unsubscribeNodeExecuted = behaviorTreeManager.on('nodeExecuted', handleNodeExecuted);
    const unsubscribeActionStarted = behaviorTreeManager.on('actionStarted', handleActionStarted);
    const unsubscribeTreeCompleted = behaviorTreeManager.on('treeCompleted', handleTreeCompleted);

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
            main: event?.status === 'destroyed' ? 'destroyed' : 'active',
            effects: [],
          });
        }
      }
    );

    // Update behavior tree periodically
    const updateInterval = setInterval(() => {
      const unit = combatManager.getUnitStatus?.(unitId);
      if (!unit) return;

      const convertStatus = (status: string): CombatUnitStatus => ({
        main: status === 'destroyed' ? 'destroyed' : status === 'disabled' ? 'disabled' : 'active',
        effects: [],
      });

      const nearbyEnemies = (
        combatManager
          .getUnitsInRange?.(unit.position, 500)
          ?.filter(other => other.faction !== factionId) ?? []
      ).map(unit => ({
        ...unit,
        velocity: { x: 0, y: 0 }, // Add default velocity for units
        status: convertStatus(unit.status),
        weapons: unit.weapons.map(weapon => ({
          id: weapon.id,
          type: weapon.type as WeaponCategory,
          damage: weapon.damage,
          range: weapon.range,
          cooldown: weapon.cooldown,
          status: weapon.status as WeaponStatus,
        })),
        stats: {
          ...unit.stats,
          armor: 0, // Add default armor value
        },
      }));

      const nearbyAllies = (
        combatManager
          .getUnitsInRange?.(unit.position, 500)
          ?.filter(other => other.faction === factionId && other.id !== unitId) ?? []
      ).map(unit => ({
        ...unit,
        velocity: { x: 0, y: 0 }, // Add default velocity for units
        status: convertStatus(unit.status),
        weapons: unit.weapons.map(weapon => ({
          id: weapon.id,
          type: weapon.type as WeaponCategory,
          damage: weapon.damage,
          range: weapon.range,
          cooldown: weapon.cooldown,
          status: weapon.status as WeaponStatus,
        })),
        stats: {
          ...unit.stats,
          armor: 0, // Add default armor value
        },
      }));

      // Update behavior tree context
      behaviorTreeManager.updateContext?.(unitId, {
        unit: {
          ...unit,
          velocity: { x: 0, y: 0 }, // Add default velocity
          status: convertStatus(unit.status),
          weapons: unit.weapons.map(weapon => ({
            id: weapon.id,
            type: weapon.type as WeaponCategory,
            damage: weapon.damage,
            range: weapon.range,
            cooldown: weapon.cooldown,
            status: weapon.status as WeaponStatus,
          })),
          stats: {
            ...unit.stats,
            armor: 0, // Add default armor value
          },
          target: unit.target?.id,
        },
        factionId,
        fleetStrength: nearbyAllies.reduce((sum, ally) => sum + ally.stats.health, 0),
        threatLevel: nearbyEnemies.reduce((sum, enemy) => sum + enemy.stats.health, 0),
        nearbyEnemies,
        nearbyAllies,
        currentFormation: {
          type: 'balanced',
          spacing: 100,
          facing: 0,
        },
        lastAction: undefined,
        cooldowns: {},
      });

      // Evaluate behavior tree
      const treeId = `${factionId}-combat`;
      const success = behaviorTreeManager.evaluateTree?.(unitId, treeId) || false;

      setPerformance(prev => ({
        ...prev,
        successRate: prev.successRate * 0.9 + (success ? 0.1 : 0),
      }));
    }, 1000);

    return () => {
      clearInterval(updateInterval);
      if (typeof unsubscribeNodeExecuted === 'function') unsubscribeNodeExecuted();
      if (typeof unsubscribeActionStarted === 'function') unsubscribeActionStarted();
      if (typeof unsubscribeTreeCompleted === 'function') unsubscribeTreeCompleted();
      if (typeof unsubscribeDamaged === 'function') unsubscribeDamaged();
      if (typeof unsubscribeStatusChanged === 'function') unsubscribeStatusChanged();
    };
  }, [unitId, factionId]);

  return {
    status,
    performance,
  };
}

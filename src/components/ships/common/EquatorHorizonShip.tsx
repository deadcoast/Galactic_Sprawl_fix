import { Shield, Target } from 'lucide-react';
import { ReactNode, useCallback } from 'react';
import { CombatEffectType } from '../../../effects/types_effects/EffectTypes';
import { createEffect, isDamageEffect } from '../../../effects/util_effects/effectUtils';
import { useShipEffects } from '../../../hooks/ships/useShipEffects';
import { EquatorHorizonShipClass, FactionShipStats } from '../../../types/ships/FactionShipTypes';
import { FactionBehaviorConfig, FactionId } from '../../../types/ships/FactionTypes';
import { UnifiedShipStatus } from '../../../types/ships/UnifiedShipTypes';
import { WeaponMount } from '../../../types/weapons/WeaponTypes';
import { createDamageEffect } from '../../../utils/weapons/weaponEffectUtils';
import { AbilityButton } from '../../ui/buttons/AbilityButton';
import { StatusEffect } from '../../ui/status/StatusEffect';
import { ResourceType } from './../../../types/resources/ResourceTypes';
import { FactionShipBase } from './FactionShipBase';

interface EquatorHorizonShipProps {
  id: string;
  name: string;
  type: EquatorHorizonShipClass;
  status: UnifiedShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponMount[];
  stats: FactionShipStats;
  position: { x: number; y: number };
  rotation: number;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: () => void;
  onFire?: (weaponId: string) => void;
  children?: ReactNode;
}

/**
 * EquatorHorizonShip Component
 *
 * Base component for Equator Horizon faction ships.
 * Provides faction-specific styling and behavior.
 */
export function EquatorHorizonShip({
  id,
  name,
  type,
  status,
  health,
  maxHealth,
  shield,
  maxShield,
  weapons,
  stats,
  position,
  rotation,
  onEngage,
  onRetreat,
  onSpecialAbility,
  onFire,
  children,
}: EquatorHorizonShipProps) {
  const { addEffect, removeEffect, hasEffect } = useShipEffects();

  // Handle weapon firing
  const handleFire = useCallback(
    (weaponId: string) => {
      const weapon = weapons.find(mount => mount.id === weaponId)?.currentWeapon;

      if (weapon && weapon.state.status === 'ready') {
        // Apply weapon effects
        weapon.state.effects.forEach(effect => {
          if (isDamageEffect(effect)) {
            console.warn(
              `[EquatorHorizonShip] Firing weapon ${weaponId} with strength ${effect.strength}`
            );
          }
        });

        // Update weapon state
        weapon.state.status = 'cooling';
        setTimeout(() => {
          if (weapon) {
            weapon.state.status = 'ready';
          }
        }, weapon.config.baseStats.cooldown * 1000);

        // Call the onFire callback if provided
        onFire?.(weaponId);
      }
    },
    [weapons, onFire]
  );

  // Faction-specific effects
  const handleOvercharge = useCallback(() => {
    const effectId = 'overcharge';
    const hasOvercharge = hasEffect(effectId);
    if (hasOvercharge) {
      removeEffect(effectId);
      // Remove overcharge effect from weapons
      weapons.forEach(mount => {
        if (mount.currentWeapon) {
          mount.currentWeapon.state.effects = mount.currentWeapon.state.effects.filter(effect => {
            if (isDamageEffect(effect)) {
              return effect.id !== effectId;
            }
            return true;
          });

          // Reset weapon stats
          mount.currentWeapon.state.currentStats = {
            ...mount.currentWeapon.config.baseStats,
          };
        }
      });
    } else {
      // Create base effect for ship
      const baseEffect = createEffect(
        effectId,
        'Overcharge',
        'damage' as CombatEffectType,
        1.4,
        'Increases weapon damage and accuracy',
        {
          duration: 10,
          active: true,
        }
      );
      addEffect(baseEffect);

      // Create weapon effect for each weapon
      weapons.forEach(mount => {
        if (mount.currentWeapon) {
          const weaponEffect = createDamageEffect({
            id: `${mount.currentWeapon.config.id}-${effectId}`,
            magnitude: mount.currentWeapon.state.currentStats.damage * 1.4,
            duration: 10,
            strength: 1.4,
            damageType: ResourceType.ENERGY,
            penetration: 0.2,
          });

          mount.currentWeapon.state.effects = [
            ...mount.currentWeapon.state.effects.filter(effect => {
              if (isDamageEffect(effect)) {
                return effect.id !== weaponEffect.id;
              }
              return true;
            }),
            weaponEffect,
          ];

          // Update weapon stats with overcharge
          const { currentStats } = mount.currentWeapon.state;
          mount.currentWeapon.state.currentStats = {
            ...currentStats,
            damage: currentStats.damage * 1.4,
            accuracy: Math.min(1, currentStats.accuracy * 1.4),
          };
        }
      });
    }
    onSpecialAbility?.();
  }, [hasEffect, removeEffect, addEffect, weapons, onSpecialAbility]);

  // Handle reinforced shields effect
  const handleReinforcedShields = useCallback(() => {
    const effectId = 'reinforced-shields';
    const hasShields = hasEffect(effectId);
    if (hasShields) {
      removeEffect(effectId);
    } else {
      const baseEffect = createEffect(
        effectId,
        'Reinforced Shields',
        'shield' as CombatEffectType,
        1.5,
        'Boosts shield strength and regeneration',
        {
          duration: 15,
          active: true,
        }
      );
      addEffect(baseEffect);
    }
    onSpecialAbility?.();
  }, [hasEffect, removeEffect, addEffect, onSpecialAbility]);

  return (
    <FactionShipBase
      ship={{
        id,
        name,
        category: 'war',
        stats: stats,
        abilities: [
          {
            id: 'overcharge-ability',
            name: 'Overcharge',
            description: 'Increases weapon damage and accuracy',
            cooldown: 15,
            duration: 10,
            active: hasEffect('overcharge'),
            effect: {
              id: 'overcharge',
              name: 'Overcharge Effect',
              description: 'Boosted weapon damage',
              type: 'damage',
              magnitude: 1.4,
              duration: 10,
              active: hasEffect('overcharge'),
              cooldown: 0,
            },
          },
          {
            id: 'reinforced-shields-ability',
            name: 'Reinforced Shields',
            description: 'Boosts shield strength and regeneration',
            cooldown: 20,
            duration: 15,
            active: hasEffect('reinforced-shields'),
            effect: {
              id: 'reinforced-shields',
              name: 'Reinforced Shields Effect',
              description: 'Boosted shield strength',
              type: 'shield',
              magnitude: 1.5,
              duration: 15,
              active: hasEffect('reinforced-shields'),
              cooldown: 0,
            },
          },
        ],
        displayStats: undefined,
        class: type,
        faction: 'equator-horizon' as FactionId,
        status: status,
        tactics: {
          formation: 'balanced',
          behavior: 'defensive',
        } as FactionBehaviorConfig,
        health,
        maxHealth,
        shield,
        maxShield,
        position,
        rotation,
      }}
      onEngage={onEngage}
      onRetreat={onRetreat}
      onSpecialAbility={onSpecialAbility}
      onFire={handleFire}
    >
      {/* Status Effects */}
      <StatusEffect
        active={hasEffect('overcharge')}
        icon={Target}
        label="Overcharge"
        color="amber"
      />
      <StatusEffect
        active={hasEffect('reinforced-shields')}
        icon={Shield}
        label="Reinforced Shields"
        color="cyan"
      />

      {/* Ability Buttons */}
      <AbilityButton
        active={hasEffect('overcharge')}
        icon={Target}
        label="Overcharge"
        color="amber"
        onClick={handleOvercharge}
      />
      <AbilityButton
        active={hasEffect('reinforced-shields')}
        icon={Shield}
        label="Reinforced Shields"
        color="cyan"
        onClick={handleReinforcedShields}
      />

      {children}
    </FactionShipBase>
  );
}

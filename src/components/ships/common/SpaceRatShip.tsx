import { FactionShipBase } from './FactionShipBase';
import { SpaceRatsShipClass } from '../../../types/ships/FactionShipTypes';
import { ReactNode } from 'react';
import { WeaponMount } from '../../../types/weapons/WeaponTypes';
import { WeaponEffect } from '../../../effects/types_effects/WeaponEffects';
import { useShipEffects } from '../../../hooks/ships/useShipEffects';
import { BaseEffect } from '../../../effects/types_effects/EffectTypes';
import { Zap, Shield } from 'lucide-react';
import { StatusEffect } from '../../ui/status/StatusEffect';
import { AbilityButton } from '../../ui/buttons/AbilityButton';
import { FactionShipStats } from '../../../types/ships/FactionShipTypes';

interface SpaceRatShipProps {
  id: string;
  name: string;
  type: SpaceRatsShipClass;
  status: 'engaging' | 'patrolling' | 'retreating' | 'disabled';
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponMount[];
  stats: FactionShipStats;
  tactics: 'aggressive' | 'defensive' | 'hit-and-run' | 'stealth';
  position: { x: number; y: number };
  rotation: number;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: () => void;
  onFire?: (weaponId: string) => void;
  children?: ReactNode;
}

/**
 * SpaceRatShip Component
 *
 * Base component for Space Rats faction ships.
 * Provides faction-specific styling and behavior.
 */
export function SpaceRatShip({
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
  tactics,
  position,
  rotation,
  onEngage,
  onRetreat,
  onSpecialAbility,
  onFire,
  children,
}: SpaceRatShipProps) {
  const { addEffect, removeEffect, hasEffect } = useShipEffects();

  // Faction-specific effects
  const handleRageMode = () => {
    if (hasEffect('rage-mode')) {
      removeEffect('rage-mode');
      // Remove rage effect from weapons
      weapons.forEach(mount => {
        if (mount.currentWeapon) {
          mount.currentWeapon.state.effects = mount.currentWeapon.state.effects.filter(
            effect => effect.name !== 'Rage Mode'
          );
        }
      });
    } else {
      const baseEffect: BaseEffect = {
        id: 'rage-mode',
        name: 'Rage Mode',
        description: 'Increased damage but reduced defense',
        type: 'damage',
        magnitude: 1.5,
        duration: 10,
        active: true,
      };
      addEffect(baseEffect);

      // Apply rage mode effect to all weapons
      weapons.forEach(mount => {
        if (mount.currentWeapon) {
          const weaponEffect: WeaponEffect = {
            type: 'damage',
            name: 'Rage Mode',
            description: 'Increased weapon damage',
            duration: 10,
            strength: 1.5,
            magnitude: 1.5,
            active: true,
            cooldown: 0,
          };

          mount.currentWeapon.state.effects.push(weaponEffect);
        }
      });
    }
    onSpecialAbility?.();
  };

  const handleScrapShield = () => {
    if (hasEffect('scrap-shield')) {
      removeEffect('scrap-shield');
    } else {
      const shieldEffect: BaseEffect = {
        id: 'scrap-shield',
        name: 'Scrap Shield',
        description: 'Temporary shield boost from scrap metal',
        type: 'shield',
        magnitude: 1.3,
        duration: 8,
        active: true,
      };
      addEffect(shieldEffect);
    }
  };

  return (
    <FactionShipBase
      ship={{
        id,
        name,
        class: type,
        faction: 'space-rats',
        status,
        tactics,
        category: 'war',
        health,
        maxHealth,
        shield,
        maxShield,
        position,
        rotation,
        abilities: [
          {
            name: 'Rage Mode',
            description: 'Increases damage output at the cost of defense',
            cooldown: 15,
            duration: 10,
            active: hasEffect('rage-mode'),
            effect: {
              type: 'damage',
              name: 'Rage Mode',
              description: 'Increased damage but reduced defense',
              magnitude: 1.5,
              duration: 10,
            },
          },
          {
            name: 'Scrap Shield',
            description: 'Creates a temporary shield from scrap metal',
            cooldown: 12,
            duration: 8,
            active: hasEffect('scrap-shield'),
            effect: {
              type: 'shield',
              name: 'Scrap Shield',
              description: 'Temporary shield boost from scrap metal',
              magnitude: 1.3,
              duration: 8,
            },
          },
        ],
        stats,
      }}
      onEngage={onEngage}
      onRetreat={onRetreat}
      onSpecialAbility={onSpecialAbility}
      onFire={onFire}
    >
      {/* Status Effects */}
      <StatusEffect active={hasEffect('rage-mode')} icon={Zap} label="Rage Mode" color="red" />
      <StatusEffect
        active={hasEffect('scrap-shield')}
        icon={Shield}
        label="Scrap Shield"
        color="amber"
      />

      {/* Ability Buttons */}
      <AbilityButton
        active={hasEffect('rage-mode')}
        icon={Zap}
        label="Rage Mode"
        color="red"
        onClick={handleRageMode}
      />
      <AbilityButton
        active={hasEffect('scrap-shield')}
        icon={Shield}
        label="Scrap Shield"
        color="amber"
        onClick={handleScrapShield}
      />

      {children}
    </FactionShipBase>
  );
}

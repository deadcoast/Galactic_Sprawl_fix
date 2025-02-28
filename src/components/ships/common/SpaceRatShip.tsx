import { ReactNode } from 'react';
import { BaseEffect } from '../../../effects/types_effects/EffectTypes';
import { useShipEffects } from '../../../hooks/ships/useShipEffects';
import {
  FactionShip,
  FactionShipStats,
  SpaceRatsShipClass,
} from '../../../types/ships/FactionShipTypes';
import { FactionBehaviorType } from '../../../types/ships/FactionTypes';
import { WeaponMount } from '../../../types/weapons/WeaponTypes';
import { FactionShipBase } from './FactionShipBase';

// Import the correct WeaponEffect type
import { DamageEffect } from '../../../effects/types_effects/WeaponEffects';

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
  tactics: FactionBehaviorType | string;
  position: { x: number; y: number };
  rotation: number;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: () => void;
  onFire?: (weaponId: string) => void;
  children?: ReactNode;
}

// Helper function to create a FactionBehaviorType from string
const createFactionBehavior = (behavior: string): FactionBehaviorType => {
  return {
    formation: 'standard',
    behavior: behavior,
  };
};

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
            effect => effect.id !== 'rage-mode'
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
        cooldown: 0,
      };
      addEffect(baseEffect);

      // Apply rage mode effect to all weapons
      weapons.forEach(mount => {
        if (mount.currentWeapon) {
          // Create a proper DamageEffect instead of WeaponEffect
          const weaponEffect: DamageEffect = {
            id: 'rage-mode-weapon',
            type: 'damage',
            duration: 10,
            strength: 1.5,
            magnitude: 1.5,
            damageType: 'physical',
            penetration: 0.3,
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
        magnitude: 2.0,
        duration: 8,
        active: true,
        cooldown: 0,
      };
      addEffect(shieldEffect);
    }
    onSpecialAbility?.();
  };

  // Determine which special ability to use based on ship type
  const handleSpecialAbility = () => {
    switch (type) {
      case 'ratKing':
      case 'asteroidMarauder':
      case 'plasmaFang':
        handleRageMode();
        break;
      case 'rogueNebula':
      case 'wailingWreck':
      case 'verminVanguard':
        handleScrapShield();
        break;
      default:
        onSpecialAbility?.();
    }
  };

  // Create a ship object that matches the expected type
  const shipData: FactionShip = {
    id,
    name,
    class: type,
    faction: 'space-rats',
    status,
    // Convert string tactics to FactionBehaviorType if needed
    tactics: typeof tactics === 'string' ? createFactionBehavior(tactics) : tactics,
    category: 'war',
    health,
    maxHealth,
    shield,
    maxShield,
    position,
    rotation,
    stats,
    // Add the required abilities property
    abilities: [
      {
        name: 'Rage Mode',
        description: 'Increases damage output at the cost of defense',
        cooldown: 15,
        duration: 10,
        active: hasEffect('rage-mode'),
        effect: {
          id: 'rage-mode-effect',
          type: 'damage',
          duration: 10,
          magnitude: 1.5,
        },
      },
      {
        name: 'Scrap Shield',
        description: 'Temporary shield boost from scrap metal',
        cooldown: 20,
        duration: 8,
        active: hasEffect('scrap-shield'),
        effect: {
          id: 'scrap-shield-effect',
          type: 'shield',
          duration: 8,
          magnitude: 2.0,
        },
      },
    ],
  };

  return (
    <FactionShipBase
      ship={shipData}
      onEngage={onEngage}
      onRetreat={onRetreat}
      onSpecialAbility={handleSpecialAbility}
      onFire={onFire}
    >
      {/* Space Rats specific UI elements */}
      <div className="mt-4 space-y-2">
        {hasEffect('rage-mode') && (
          <div className="rounded-lg bg-red-900/30 px-3 py-2 text-sm">
            <div className="font-medium text-gray-300">Rage Mode Active</div>
            <div className="text-xs text-gray-400">+50% damage, -25% defense</div>
          </div>
        )}

        {hasEffect('scrap-shield') && (
          <div className="rounded-lg bg-amber-900/30 px-3 py-2 text-sm">
            <div className="font-medium text-gray-300">Scrap Shield Active</div>
            <div className="text-xs text-gray-400">+100% shield strength</div>
          </div>
        )}

        {type === 'ratKing' && (
          <div className="rounded-lg bg-red-900/30 px-3 py-2 text-sm">
            <div className="font-medium text-gray-300">Rat King Aura</div>
            <div className="text-xs text-gray-400">Nearby allies gain +15% damage</div>
          </div>
        )}

        {type === 'wailingWreck' && (
          <div className="rounded-lg bg-amber-900/30 px-3 py-2 text-sm">
            <div className="font-medium text-gray-300">Scrap Collector</div>
            <div className="text-xs text-gray-400">Gains resources from destroyed ships</div>
          </div>
        )}
      </div>

      {children}
    </FactionShipBase>
  );
}

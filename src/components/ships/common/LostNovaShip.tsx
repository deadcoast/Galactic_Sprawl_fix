import { ReactNode } from 'react';
import { BaseEffect } from '../../../effects/types_effects/EffectTypes';
import { useShipEffects } from '../../../hooks/ships/useShipEffects';
import {
  FactionShip,
  FactionShipStats,
  LostNovaShipClass,
} from '../../../types/ships/FactionShipTypes';
import { FactionBehaviorConfig, FactionBehaviorType } from '../../../types/ships/FactionTypes';
import { WeaponMount } from '../../../types/weapons/WeaponTypes';
import { ResourceType } from './../../../types/resources/ResourceTypes';
import { FactionShipBase } from './FactionShipBase';

// Import the correct WeaponEffect type
import { DamageEffect } from '../../../effects/types_effects/WeaponEffects';

interface LostNovaShipProps {
  id: string;
  name: string;
  type: LostNovaShipClass;
  status: 'engaging' | 'patrolling' | 'retreating' | 'disabled';
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponMount[];
  stats: FactionShipStats;
  tactics: FactionBehaviorConfig | string;
  position: { x: number; y: number };
  rotation: number;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: () => void;
  onFire?: (weaponId: string) => void;
  children?: ReactNode;
}

// Helper function to create a FactionBehaviorConfig from string
const createFactionBehavior = (behavior: string): FactionBehaviorConfig => {
  return {
    formation: 'standard',
    behavior: behavior as FactionBehaviorType,
  };
};

/**
 * LostNovaShip Component
 *
 * Base component for Lost Nova faction ships.
 * Provides faction-specific styling and behavior.
 */
export function LostNovaShip({
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
}: LostNovaShipProps) {
  const { addEffect, removeEffect, hasEffect } = useShipEffects();

  // Faction-specific effects
  const handleVoidPulse = () => {
    if (hasEffect('void-pulse')) {
      removeEffect('void-pulse');
      // Remove void pulse effect from weapons
      weapons.forEach(mount => {
        if (mount.currentWeapon) {
          mount.currentWeapon.state.effects = mount.currentWeapon.state.effects.filter(
            effect => effect.id !== 'void-pulse'
          );
        }
      });
    } else {
      const baseEffect: BaseEffect = {
        id: 'void-pulse',
        name: 'Void Pulse',
        description: 'Disrupts enemy shields and cloaking',
        type: 'jamming',
        duration: 10,
        magnitude: 1.5,
        active: true,
        cooldown: 0,
      };
      addEffect(baseEffect);

      // Add void pulse effect to weapons
      weapons.forEach(mount => {
        if (mount.currentWeapon) {
          // Create a proper DamageEffect instead of WeaponEffect
          const weaponEffect: DamageEffect = {
            id: 'void-pulse-weapon',
            name: 'Void Pulse Weapon Effect',
            description: 'Disrupts enemy shields and cloaking',
            type: 'damage',
            duration: 8,
            strength: 1.0,
            magnitude: 1.0,
            damageType: ResourceType.ENERGY,
            penetration: 0.5,
          };
          mount.currentWeapon.state.effects.push(weaponEffect);
        }
      });
    }
    onSpecialAbility?.();
  };

  const handleStealthField = () => {
    if (hasEffect('stealth-field')) {
      removeEffect('stealth-field');
    } else {
      const stealthEffect: BaseEffect = {
        id: 'stealth-field',
        name: 'Stealth Field',
        description: 'Reduces detection range of enemy ships',
        type: 'stealth',
        duration: 15,
        magnitude: 2.0,
        active: true,
        cooldown: 0,
      };
      addEffect(stealthEffect);
    }
    onSpecialAbility?.();
  };

  // Determine which special ability to use based on ship type
  const handleSpecialAbility = () => {
    switch (type) {
      case 'eclipseScythe':
      case 'nullsRevenge':
      case 'darkMatterReaper':
        handleVoidPulse();
        break;
      case 'quantumPariah':
      case 'entropyScale':
      case 'voidRevenant':
        handleStealthField();
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
    faction: 'lost-nova',
    status,
    // Convert string tactics to FactionBehaviorType if needed
    tactics: typeof tactics === 'string' ? createFactionBehavior(tactics) : tactics,
    category: 'recon',
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
        id: 'void-pulse-ability',
        name: 'Void Pulse',
        description: 'Disrupts enemy shields and cloaking',
        cooldown: 10,
        duration: 8,
        active: hasEffect('void-pulse'),
        effect: {
          id: 'void-pulse-effect',
          type: 'jamming',
          duration: 8,
          magnitude: 1.5,
        },
      },
      {
        id: 'stealth-field-ability',
        name: 'Stealth Field',
        description: 'Reduces detection range of enemy ships',
        cooldown: 15,
        duration: 12,
        active: hasEffect('stealth-field'),
        effect: {
          id: 'stealth-field-effect',
          type: 'stealth',
          duration: 12,
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
      {/* Lost Nova specific UI elements */}
      <div className="mt-4 space-y-2">
        {hasEffect('stealth-field') && (
          <div className="rounded-lg bg-violet-900/30 px-3 py-2 text-sm">
            <div className="font-medium text-gray-300">Stealth Field Active</div>
            <div className="text-xs text-gray-400">Detection range reduced by 50%</div>
          </div>
        )}

        {hasEffect('void-pulse') && (
          <div className="rounded-lg bg-violet-900/30 px-3 py-2 text-sm">
            <div className="font-medium text-gray-300">Void Pulse Active</div>
            <div className="text-xs text-gray-400">Enemy shields and cloaking disrupted</div>
          </div>
        )}

        {type === 'darkMatterReaper' && (
          <div className="rounded-lg bg-violet-900/30 px-3 py-2 text-sm">
            <div className="font-medium text-gray-300">Dark Matter Core</div>
            <div className="text-xs text-gray-400">+25% weapon damage, -15% shield capacity</div>
          </div>
        )}

        {type === 'voidRevenant' && (
          <div className="rounded-lg bg-violet-900/30 px-3 py-2 text-sm">
            <div className="font-medium text-gray-300">Void Adaptation</div>
            <div className="text-xs text-gray-400">Regenerates 1% shield every 5 seconds</div>
          </div>
        )}
      </div>

      {children}
    </FactionShipBase>
  );
}

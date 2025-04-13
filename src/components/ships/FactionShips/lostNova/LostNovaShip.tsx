import { ReactNode, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { BaseEffect } from '../../../../effects/types_effects/EffectTypes';
import { useShipEffects } from '../../../../hooks/ships/useShipEffects';
import { ResourceType } from '../../../../types/resources/ResourceTypes';
import {
  FactionShip,
  FactionShipStats,
  LostNovaShipClass,
} from '../../../../types/ships/FactionShipTypes';
import { FactionBehaviorConfig, FactionBehaviorType } from '../../../../types/ships/FactionTypes';
import { UnifiedShipStatus } from '../../../../types/ships/ShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { FactionShipBase } from '../../common/FactionShipBase';

// Import the correct WeaponEffect type
import { DamageEffect } from '../../../../effects/types_effects/WeaponEffects';

interface LostNovaShipProps {
  id: string;
  name: string;
  type: LostNovaShipClass;
  status: UnifiedShipStatus;
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
}: LostNovaShipProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
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
  const handleSpecialAbility = useCallback(() => {
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
  }, [hasEffect, removeEffect, addEffect, onSpecialAbility]);

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
    // Populate abilities array correctly
    abilities: [
      {
        id: 'void-shroud-ability',
        name: 'Void Shroud',
        description: 'Temporarily increases evasion and stealth',
        cooldown: 25,
        duration: 10,
        active: hasEffect('void-shroud'),
        effect: {
          id: 'void-shroud',
          name: 'Void Shroud Effect',
          description: 'Increased evasion & stealth',
          type: 'buff',
          magnitude: 0.3,
          duration: 10,
          active: hasEffect('void-shroud'),
          cooldown: 0,
        },
      },
      {
        id: 'entropy-cascade-ability',
        name: 'Entropy Cascade',
        description: 'Deals damage over time to nearby enemies',
        cooldown: 30,
        duration: 8,
        active: hasEffect('entropy-cascade'),
        effect: {
          id: 'entropy-cascade',
          name: 'Entropy Cascade Effect',
          description: 'Area damage over time',
          type: 'damage',
          magnitude: 15,
          duration: 8,
          active: hasEffect('entropy-cascade'),
          cooldown: 0,
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

import { ReactNode, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { BaseEffect } from '../../../../effects/types_effects/EffectTypes';
import { useShipEffects } from '../../../../hooks/ships/useShipEffects';
import {
  FactionShip,
  FactionShipStats,
  SpaceRatsShipClass,
} from '../../../../types/ships/FactionShipTypes';
import { FactionBehaviorConfig, FactionBehaviorType } from '../../../../types/ships/FactionTypes';
import { UnifiedShipStatus } from '../../../../types/ships/ShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { FactionShipBase } from '../../common/FactionShipBase';

// Import the correct WeaponEffect type
import { DamageEffect } from '../../../../effects/types_effects/WeaponEffects';

interface SpaceRatShipProps {
  id: string;
  name: string;
  type: SpaceRatsShipClass;
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
    formation: 'chaotic',
    behavior: behavior as FactionBehaviorType,
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
}: SpaceRatShipProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
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
            name: 'Rage Mode Weapon Effect',
            description: 'Increases weapon damage at the cost of defense',
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
  const handleSpecialAbility = useCallback(() => {
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
  }, [hasEffect, removeEffect, addEffect, onSpecialAbility]);

  // Create a ship object that matches the expected type
  const shipData: FactionShip = {
    id,
    name,
    class: type,
    faction: 'space-rats',
    status,
    // Convert string tactics to FactionBehaviorType if needed
    tactics: typeof tactics === 'string' ? createFactionBehavior(tactics) : tactics,
    category: 'combat',
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
        id: 'scavenge-ability',
        name: 'Scavenge',
        description: 'Increases resource gain from destroyed ships',
        tier: 1 as const,
        cooldown: 60,
        duration: 300, // Long duration passive-like
        active: hasEffect('scavenge'),
        // Add missing properties to effect object
        effect: {
          id: 'scavenge',
          name: 'Scavenge Effect',
          description: 'Bonus resource gain',
          type: 'buff', // Assuming 'buff' or a specific effect type
          magnitude: 0.2, // Example magnitude (e.g., 20% bonus)
          duration: 300,
          active: hasEffect('scavenge'),
          cooldown: 0,
        },
      },
      {
        id: 'scombatm-tactics-ability',
        name: 'Scombatm Tactics',
        description: 'Increases speed and evasion when near allies',
        tier: 1 as const,
        cooldown: 45,
        duration: 15,
        active: hasEffect('scombatm-tactics'),
        // Add missing properties to effect object
        effect: {
          id: 'scombatm-tactics',
          name: 'Scombatm Tactics Effect',
          description: 'Increased speed & evasion',
          type: 'buff', // Assuming 'buff' or a specific effect type
          magnitude: 0.15, // Example magnitude (e.g., 15% increase)
          duration: 15,
          active: hasEffect('scombatm-tactics'),
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

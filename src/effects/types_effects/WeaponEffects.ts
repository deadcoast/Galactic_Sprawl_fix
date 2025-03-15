/**
 * Weapon effect types and interfaces
 * @module WeaponEffects
 */

import { Effect } from '../../types/core/GameTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";
// Effect Types
// ------------------------------------------------------------

/**
 * Base weapon effect interface
 */
export interface WeaponEffect extends Effect {
  type: 'damage' | 'area' | 'status';
  duration: number;
  strength: number;
  /** Name of the effect */
  name: string;
  /** Description of what the effect does */
  description: string;
}

/**
 * Damage-based weapon effect
 */
export interface DamageEffect extends WeaponEffect {
  type: 'damage';
  damageType: 'physical' | ResourceType.ENERGY | 'explosive';
  penetration: number;
}

/**
 * Area-based weapon effect
 */
export interface AreaEffect extends WeaponEffect {
  type: 'area';
  radius: number;
  falloff: number;
}

/**
 * Status-based weapon effect
 */
export interface StatusEffect extends WeaponEffect {
  type: 'status';
  statusType: 'burn' | 'emp' | 'slow' | 'stun';
}

// Effect Collections
// ------------------------------------------------------------

/**
 * Union type of all possible weapon effects
 */
export type WeaponEffectType = DamageEffect | AreaEffect | StatusEffect;

/**
 * Collection of effects applied to a weapon
 */
export interface WeaponEffects {
  primary: WeaponEffectType;
  secondary?: WeaponEffectType[];
}

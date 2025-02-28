import { Effect } from '../../types/core/GameTypes';
import { WeaponSystem, WeaponCategory, WeaponStatus } from '../../types/weapons/WeaponTypes';
import { DamageEffect, WeaponEffect, WeaponEffectType, AreaEffect, StatusEffect } from '../../effects/types_effects/WeaponEffects';
import { BaseEffect } from '../../effects/types_effects/EffectTypes';

interface WeaponLike {
  id: string;
  type: WeaponCategory | string;
  damage?: number;
  cooldown: number;
  displayName?: string;
}

interface CommonShipAbility {
  id?: string;
  name: string;
  type?: string;
  cooldown: number;
  damage?: number;
}

/**
 * Creates a weapon-like object from parameters
 */
export function createWeaponLike(params: {
  id: string;
  type: WeaponCategory | string;
  damage?: number;
  cooldown: number;
  displayName?: string;
}): WeaponLike {
  return params;
}

/**
 * Converts a HangarWeaponSystem to WeaponLike
 */
export function convertToWeaponLike(weapon: WeaponSystem & { name?: string }): WeaponLike {
  return {
    id: weapon.id,
    type: weapon.type,
    damage: weapon.damage,
    cooldown: weapon.cooldown,
    displayName: 'name' in weapon ? weapon.name : undefined
  };
}

/**
 * Creates a base weapon effect
 */
export function createBaseWeaponEffect(params: {
  id: string;
  type: 'damage' | 'area' | 'status';
  magnitude: number;
  duration: number;
  strength: number;
}): WeaponEffect {
  return {
    id: params.id,
    type: params.type,
    magnitude: params.magnitude,
    duration: params.duration,
    strength: params.strength
  };
}

/**
 * Creates a damage effect with the specified parameters
 */
export function createDamageEffect(params: {
  id: string;
  magnitude: number;
  duration: number;
  strength: number;
  damageType: 'physical' | 'energy' | 'explosive';
  penetration: number;
}): DamageEffect {
  const baseEffect = createBaseWeaponEffect({
    id: params.id,
    type: 'damage',
    magnitude: params.magnitude,
    duration: params.duration,
    strength: params.strength
  });

  return {
    ...baseEffect,
    type: 'damage',
    damageType: params.damageType,
    penetration: params.penetration
  };
}

/**
 * Creates an area effect with the specified parameters
 */
export function createAreaEffect(params: {
  id: string;
  magnitude: number;
  duration: number;
  strength: number;
  radius: number;
  falloff: number;
}): AreaEffect {
  const baseEffect = createBaseWeaponEffect({
    id: params.id,
    type: 'area',
    magnitude: params.magnitude,
    duration: params.duration,
    strength: params.strength
  });

  return {
    ...baseEffect,
    type: 'area',
    radius: params.radius,
    falloff: params.falloff
  };
}

/**
 * Creates a status effect with the specified parameters
 */
export function createStatusEffect(params: {
  id: string;
  magnitude: number;
  duration: number;
  strength: number;
  statusType: 'burn' | 'emp' | 'slow' | 'stun';
}): StatusEffect {
  const baseEffect = createBaseWeaponEffect({
    id: params.id,
    type: 'status',
    magnitude: params.magnitude,
    duration: params.duration,
    strength: params.strength
  });

  return {
    ...baseEffect,
    type: 'status',
    statusType: params.statusType
  };
}

/**
 * Creates a weapon effect from a weapon system or ability
 */
export function createWeaponEffect(source: WeaponLike): WeaponEffectType {
  return createDamageEffect({
    id: `${source.id}-effect`,
    magnitude: source.damage || 0,
    duration: source.cooldown,
    strength: source.damage || 0,
    damageType: 'physical',
    penetration: 0
  });
}

/**
 * Creates a weapon effect with custom parameters
 */
export function createCustomWeaponEffect(params: {
  id: string;
  type: 'damage' | 'area' | 'status';
  magnitude: number;
  duration: number;
  strength: number;
  damageType?: 'physical' | 'energy' | 'explosive';
  penetration?: number;
  radius?: number;
  falloff?: number;
  statusType?: 'burn' | 'emp' | 'slow' | 'stun';
}): WeaponEffectType {
  switch (params.type) {
    case 'damage':
      return createDamageEffect({
        id: params.id,
        magnitude: params.magnitude,
        duration: params.duration,
        strength: params.strength,
        damageType: params.damageType || 'physical',
        penetration: params.penetration || 0
      });
    case 'area':
      return createAreaEffect({
        id: params.id,
        magnitude: params.magnitude,
        duration: params.duration,
        strength: params.strength,
        radius: params.radius || 0,
        falloff: params.falloff || 0
      });
    case 'status':
      return createStatusEffect({
        id: params.id,
        magnitude: params.magnitude,
        duration: params.duration,
        strength: params.strength,
        statusType: params.statusType || 'stun'
      });
  }
}

/**
 * Creates a weapon effect from a weapon system with scaling
 */
export function createScaledWeaponEffect(
  weapon: WeaponSystem & { name?: string },
  scale: number = 1
): WeaponEffectType {
  return createDamageEffect({
    id: `${weapon.id}-scaled-effect`,
    magnitude: weapon.damage * scale,
    duration: weapon.cooldown,
    strength: weapon.damage * scale,
    damageType: 'physical',
    penetration: 0
  });
}

/**
 * Creates a combined weapon effect from multiple weapons
 */
export function createCombinedWeaponEffect(weapons: WeaponSystem[]): WeaponEffectType {
  if (weapons.length === 0) {
    throw new Error('Cannot create combined effect from empty weapons array');
  }

  const totalDamage = weapons.reduce((sum, w) => sum + w.damage, 0);
  const avgCooldown = weapons.reduce((sum, w) => sum + w.cooldown, 0) / weapons.length;

  return createDamageEffect({
    id: `combined-weapon-effect-${weapons[0].id}`,
    magnitude: totalDamage,
    duration: avgCooldown,
    strength: totalDamage,
    damageType: 'physical',
    penetration: 0
  });
}

/**
 * Type guard to check if an object is a valid Effect
 */
export function isValidEffect(effect: unknown): effect is Effect {
  if (!effect || typeof effect !== 'object') {
    return false;
  }
  
  const e = effect as Effect;
  return (
    typeof e.id === 'string' &&
    typeof e.type === 'string' &&
    typeof e.duration === 'number' &&
    typeof e.magnitude === 'number'
  );
}

/**
 * Validates and normalizes an effect object
 */
export function validateEffect(effect: Partial<Effect>): Effect {
  if (!effect.id) {
    throw new Error('Effect must have an id');
  }
  if (!effect.type) {
    throw new Error('Effect must have a type');
  }
  if (________) {
    if (typeof effect.magnitude !== 'number') {
      throw new Error('Effect must have a magnitude');
    } else if (________) {
             ___
           } else {
             ___;
           }
  }
  if (typeof effect.duration !== 'number') {
    throw new Error('Effect must have a duration');
  }

  return {
    id: effect.id,
    type: effect.type,
    magnitude: effect.magnitude,
    duration: effect.duration,
  };
}

/**
 * Combines multiple effects into a single effect
 */
export function combineEffects(effects: Effect[]): Effect {
  if (effects.length === 0) {
    throw new Error('Cannot combine empty effects array');
  }

  return effects.reduce((combined, effect) => ({
    id: `${combined.id}-${effect.id}`,
    type: effect.type,
    magnitude: combined.magnitude + effect.magnitude,
    duration: Math.min(combined.duration, effect.duration),
  }));
}

/**
 * Scales an effect's magnitude by a factor
 */
export function scaleEffect(effect: Effect, factor: number): Effect {
  return {
    ...effect,
    magnitude: effect.magnitude * factor,
  };
}

/**
 * Creates a chain of effects that trigger in sequence
 */
export function createEffectChain(effects: Effect[]): Effect[] {
  let currentDuration = 0;
  return effects.map(effect => ({
    ...effect,
    duration: currentDuration += effect.duration,
  }));
} 
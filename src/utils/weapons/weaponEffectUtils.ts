import {
  AreaEffect,
  DamageEffect,
  StatusEffect,
  WeaponEffect,
  WeaponEffectType,
} from '../../effects/types_effects/WeaponEffects';
import { Effect } from '../../types/core/GameTypes';
import { WeaponCategory, WeaponSystem } from '../../types/weapons/WeaponTypes';

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
    displayName: 'name' in weapon ? weapon.name : undefined,
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
  name?: string;
  description?: string;
}): WeaponEffect {
  return {
    id: params.id,
    type: params.type,
    magnitude: params.magnitude,
    duration: params.duration,
    strength: params.strength,
    name: params.name || params.id,
    description: params.description || `${params.type} effect with magnitude ${params.magnitude}`,
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
  name?: string;
  description?: string;
}): DamageEffect {
  const baseEffect = createBaseWeaponEffect({
    id: params.id,
    type: 'damage',
    magnitude: params.magnitude,
    duration: params.duration,
    strength: params.strength,
    name: params.name,
    description: params.description,
  });

  return {
    ...baseEffect,
    type: 'damage' as const,
    damageType: params.damageType,
    penetration: params.penetration,
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
  name?: string;
  description?: string;
}): AreaEffect {
  const baseEffect = createBaseWeaponEffect({
    id: params.id,
    type: 'area',
    magnitude: params.magnitude,
    duration: params.duration,
    strength: params.strength,
    name: params.name,
    description: params.description,
  });

  return {
    ...baseEffect,
    type: 'area' as const,
    radius: params.radius,
    falloff: params.falloff,
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
  name?: string;
  description?: string;
}): StatusEffect {
  const baseEffect = createBaseWeaponEffect({
    id: params.id,
    type: 'status',
    magnitude: params.magnitude,
    duration: params.duration,
    strength: params.strength,
    name: params.name,
    description: params.description,
  });

  return {
    ...baseEffect,
    type: 'status' as const,
    statusType: params.statusType,
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
    penetration: 0,
    name: source.displayName || `${source.type} Effect`,
    description: `Effect from ${source.displayName || source.type}`,
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
  name?: string;
  description?: string;
}): WeaponEffectType {
  switch (params.type) {
    case 'damage':
      return createDamageEffect({
        id: params.id,
        magnitude: params.magnitude,
        duration: params.duration,
        strength: params.strength,
        damageType: params.damageType || 'physical',
        penetration: params.penetration || 0,
        name: params.name,
        description: params.description,
      });
    case 'area':
      return createAreaEffect({
        id: params.id,
        magnitude: params.magnitude,
        duration: params.duration,
        strength: params.strength,
        radius: params.radius || 0,
        falloff: params.falloff || 0,
        name: params.name,
        description: params.description,
      });
    case 'status':
      return createStatusEffect({
        id: params.id,
        magnitude: params.magnitude,
        duration: params.duration,
        strength: params.strength,
        statusType: params.statusType || 'stun',
        name: params.name,
        description: params.description,
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
    penetration: 0,
    name: weapon.name || `Scaled ${weapon.type}`,
    description: `Scaled effect (${scale}x) from ${weapon.name || weapon.type}`,
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
  const weaponNames = weapons.map(w => ('name' in w ? (w as any).name : w.type)).join(', ');

  return createDamageEffect({
    id: `combined-weapon-effect-${weapons[0].id}`,
    magnitude: totalDamage,
    duration: avgCooldown,
    strength: totalDamage,
    damageType: 'physical',
    penetration: 0,
    name: `Combined Weapons`,
    description: `Combined effect from: ${weaponNames}`,
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
  if (effect.magnitude === undefined) {
    throw new Error('Effect must have a magnitude');
  } else if (typeof effect.magnitude !== 'number') {
    throw new Error('Effect magnitude must be a number');
  }
  if (typeof effect.duration !== 'number') {
    throw new Error('Effect must have a duration');
  }

  return {
    id: effect.id,
    type: effect.type,
    magnitude: effect.magnitude,
    duration: effect.duration,
    target: effect.target,
    active: effect.active,
    cooldown: effect.cooldown,
  };
}

/**
 * Combines multiple effects into a single effect
 */
export function combineEffects(effects: Effect[]): Effect {
  if (effects.length === 0) {
    throw new Error('Cannot combine empty effects array');
  }

  // Create the base combined effect
  const combinedEffect: Effect = {
    id: effects.map(e => e.id).join('-'),
    type: effects[0].type,
    magnitude: effects.reduce((sum, e) => sum + e.magnitude, 0),
    duration: Math.min(...effects.map(e => e.duration)),
  };

  // Get names and descriptions if available
  const names = effects.filter(e => 'name' in e).map(e => (e as any).name);
  const descriptions = effects.filter(e => 'description' in e).map(e => (e as any).description);

  // Add name and description as any to avoid type errors
  if (names.length > 0) {
    (combinedEffect as any).name = `Combined: ${names.join(', ')}`;
  }

  if (descriptions.length > 0) {
    (combinedEffect as any).description = `Combined effects: ${descriptions.join('; ')}`;
  }

  return combinedEffect;
}

/**
 * Scales an effect's magnitude by a factor
 */
export function scaleEffect(effect: Effect, factor: number): Effect {
  const result = {
    ...effect,
    magnitude: effect.magnitude * factor,
  };

  // Add scaled information to name and description if they exist
  if ('name' in effect && typeof (effect as any).name === 'string') {
    (result as any).name = `Scaled ${(effect as any).name}`;
  }

  if ('description' in effect && typeof (effect as any).description === 'string') {
    (result as any).description = `${(effect as any).description} (scaled by ${factor})`;
  }

  return result;
}

/**
 * Creates a chain of effects that trigger in sequence
 */
export function createEffectChain(effects: Effect[]): Effect[] {
  let currentDuration = 0;
  return effects.map(effect => ({
    ...effect,
    duration: (currentDuration += effect.duration),
  }));
}

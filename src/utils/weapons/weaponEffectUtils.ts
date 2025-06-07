import {
  AreaEffect,
  DamageEffect,
  StatusEffect,
  WeaponEffect,
  WeaponEffectType,
} from '../../effects/types_effects/WeaponEffects';
import { Effect } from '../../types/core/GameTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { WeaponCategory, WeaponSystem } from '../../types/weapons/WeaponTypes';

interface WeaponLike {
  id: string;
  type: WeaponCategory | string;
  damage?: number;
  cooldown: number;
  displayName?: string;
}

/**
 * Common ship ability interface for standardizing ship special abilities
 *
 * This interface will be used in future implementations to:
 * 1. Standardize the structure of ship special abilities across different ship classes
 * 2. Enable ability sharing and inheritance between related ship types
 * 3. Support the upcoming ship ability customization system
 * 4. Provide consistent ability parameters for UI display and tooltips
 * 5. Facilitate ability cooldown and activation state tracking
 *
 * Properties:
 * - id: Unique identifier for the ability
 * - name: Display name of the ability
 * - type: Category of ability (offensive, defensive, utility, etc.)
 * - cooldown: Time in seconds before the ability can be used again
 * - damage: Base damage value for offensive abilities
 */

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
  damageType: 'physical' | ResourceType.ENERGY | 'explosive';
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
    magnitude: source.damage ?? 0,
    duration: source.cooldown,
    strength: source.damage ?? 0,
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
  damageType?: 'physical' | ResourceType.ENERGY | 'explosive';
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
        penetration: params.penetration ?? 0,
        name: params.name,
        description: params.description,
      });
    case 'area':
      return createAreaEffect({
        id: params.id,
        magnitude: params.magnitude,
        duration: params.duration,
        strength: params.strength,
        radius: params.radius ?? 0,
        falloff: params.falloff ?? 0,
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
  scale = 1
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

  // Calculate combined damage and cooldown
  const totalDamage = weapons.reduce((sum, weapon) => sum + weapon.damage, 0);
  const avgCooldown = weapons.reduce((sum, weapon) => sum + weapon.cooldown, 0) / weapons.length;

  // Create a combined weapon-like object
  const combinedWeapon: WeaponLike = {
    id: `combined-${weapons[0].id}`,
    type: weapons[0].type,
    damage: totalDamage,
    cooldown: avgCooldown,
    displayName: `Combined ${weapons[0].type}`,
  };

  // Create effect from the combined weapon
  return createWeaponEffect(combinedWeapon);
}

/**
 * Checks if an object is a valid Effect
 */
export function isValidEffect(effect: unknown): effect is Effect {
  if (!effect || typeof effect !== 'object') {
    return false;
  }

  const effectObj = effect as Partial<Effect>;
  return (
    typeof effectObj.id === 'string' &&
    typeof effectObj.type === 'string' &&
    typeof effectObj.magnitude === 'number' &&
    typeof effectObj.duration === 'number'
  );
}

/**
 * Validates and normalizes an effect
 */
export function validateEffect(effect: Partial<Effect>): Effect {
  if (!effect.id) {
    throw new Error('Effect must have an id');
  }

  if (!effect.type) {
    throw new Error('Effect must have a type');
  }

  return {
    id: effect.id,
    type: effect.type,
    magnitude: effect.magnitude ?? 0,
    duration: effect.duration ?? 0,
  };
}

/**
 * Combines multiple effects into a single effect
 */
export function combineEffects(effects: Effect[]): Effect {
  if (effects.length === 0) {
    throw new Error('Cannot combine empty effects array');
  }

  // Use the first effect as a base
  const baseEffect = effects[0];

  // Combine magnitudes and take the longest duration
  const combinedMagnitude = effects.reduce((sum, effect) => sum + effect.magnitude, 0);
  const maxDuration = Math.max(...effects.map(effect => effect.duration));

  // Create a new effect with combined values
  return {
    id: `combined-${baseEffect.id}`,
    type: baseEffect.type,
    magnitude: combinedMagnitude,
    duration: maxDuration,
  };
}

/**
 * Scales an effect by a factor
 */
export function scaleEffect(effect: Effect, factor: number): Effect {
  // Create a new effect with scaled values
  return {
    id: `scaled-${effect.id}`,
    type: effect.type,
    magnitude: effect.magnitude * factor,
    duration: effect.duration,
  };
}

/**
 * Creates a chain of effects that trigger sequentially
 */
export function createEffectChain(effects: Effect[]): Effect[] {
  if (effects.length <= 1) {
    return effects;
  }

  // Create a new array of effects with sequential triggers
  return effects.map((effect, index) => {
    if (index === 0) {
      return effect;
    }

    // Each subsequent effect is triggered by the previous one
    return {
      ...effect,
      id: `chain-${index}-${effect.id}`,
      trigger: {
        type: 'effect-complete',
        effectId: effects[index - 1].id,
      },
    };
  });
}

/**
 * Creates a ship ability using the CommonShipAbility interface
 * Following the factory pattern similar to other creation methods in the codebase
 */
export function createShipAbility(params: {
  name: string;
  type?: string;
  cooldown: number;
  damage?: number;
  id?: string;
}): CommonShipAbility {
  return {
    id: params.id || `ability-${Math.random().toString(36).substring(2, 9)}`,
    name: params.name,
    type: params.type || 'offensive',
    cooldown: params.cooldown,
    damage: params.damage,
  };
}

/**
 * Converts a weapon system to a ship ability
 * Following the conversion pattern between related types
 */
export function weaponToShipAbility(weapon: WeaponSystem): CommonShipAbility {
  return {
    id: weapon.id,
    name: `${weapon.type} Weapon`, // Convert weapon type to a name
    type: 'offensive',
    cooldown: weapon.cooldown,
    damage: weapon.damage,
  };
}

/**
 * Creates a customized ship ability based on a template
 * Following the customization pattern with defaults and overrides
 */
export function createCustomShipAbility(
  baseAbility: Partial<CommonShipAbility>,
  customizations: Partial<CommonShipAbility>
): CommonShipAbility {
  // Start with default values based on patterns in context file
  const defaultAbility: CommonShipAbility = {
    id: `ability-${Math.random().toString(36).substring(2, 9)}`,
    name: 'Unnamed Ability',
    type: 'utility',
    cooldown: 30,
    damage: undefined,
  };

  // Merge with base ability and then customizations - following standard object merging pattern
  return {
    ...defaultAbility,
    ...baseAbility,
    ...customizations,
    // Always ensure an ID exists following the ID generation pattern
    id: customizations.id || baseAbility.id || defaultAbility.id,
  };
}

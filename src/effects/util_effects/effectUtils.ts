import { Effect } from '../../types/core/GameTypes';
import {
  AreaEffect,
  BaseEffect,
  CombatEffect,
  EffectStack,
  EffectType,
  StatusEffect,
  WeaponEffect,
} from '../types_effects/EffectTypes';
import { DamageEffect } from '../types_effects/WeaponEffects';

// Effect Creation
// ------------------------------------------------------------

/**
 * Creates a new base effect with default values
 */
export function createEffect(
  id: string,
  name: string,
  type: EffectType,
  magnitude: number,
  description: string,
  options: Partial<BaseEffect> = {}
): BaseEffect {
  return {
    id,
    name,
    type,
    magnitude,
    description,
    active: true,
    duration: options?.duration ?? 0,
    ...options,
  };
}

/**
 * Creates a weapon effect from a base effect
 */
export function createWeaponEffect(
  baseEffect: BaseEffect,
  strength: number,
  type: 'damage' | 'area' | 'status' = 'damage',
  duration = 0
): WeaponEffect {
  return {
    ...baseEffect,
    type,
    strength,
    duration,
  };
}

/**
 * Creates a combat effect from a base effect
 */
export function createCombatEffect(
  baseEffect: BaseEffect,
  sourceId: string,
  targetId: string,
  remainingTime: number = baseEffect.duration ?? 0,
  effects: BaseEffect[] = []
): CombatEffect {
  return {
    ...baseEffect,
    sourceId,
    targetId,
    remainingTime,
    effects,
  };
}

// Effect Stack Management
// ------------------------------------------------------------

/**
 * Creates a new effect stack for a target
 */
export function createEffectStack(targetId: string): EffectStack {
  return {
    targetId,
    effects: [],
    history: [],
  };
}

/**
 * Adds an effect to a stack
 */
export function addEffect(stack: EffectStack, effect: BaseEffect): EffectStack {
  return {
    ...stack,
    effects: [...stack.effects, effect],
    history: [
      ...stack.history,
      {
        effectId: effect.id,
        timestamp: Date.now(),
        action: 'applied',
      },
    ],
  };
}

/**
 * Removes an effect from a stack
 */
export function removeEffect(stack: EffectStack, effectId: string): EffectStack {
  return {
    ...stack,
    effects: stack.effects.filter(e => e.id !== effectId),
    history: [
      ...stack.history,
      {
        effectId,
        timestamp: Date.now(),
        action: 'removed',
      },
    ],
  };
}

// Effect Validation
// ------------------------------------------------------------

/**
 * Type guard for weapon effects
 */
export function isWeaponEffect(effect: BaseEffect | Effect): effect is WeaponEffect {
  return (
    'type' in effect &&
    (effect.type === 'damage' || effect.type === 'area' || effect.type === 'status') &&
    'strength' in effect &&
    typeof effect.strength === 'number'
  );
}

/**
 * Type guard for damage effects
 */
export function isDamageEffect(effect: BaseEffect | Effect): effect is DamageEffect {
  return (
    isWeaponEffect(effect) &&
    effect.type === 'damage' &&
    'damageType' in effect &&
    'penetration' in effect
  );
}

/**
 * Type guard for area effects
 */
export function isAreaEffect(effect: BaseEffect | Effect): effect is AreaEffect {
  return (
    isWeaponEffect(effect) && effect.type === 'area' && 'radius' in effect && 'falloff' in effect
  );
}

/**
 * Type guard for status effects
 */
export function isStatusEffect(effect: BaseEffect | Effect): effect is StatusEffect {
  return isWeaponEffect(effect) && effect.type === 'status' && 'statusType' in effect;
}

/**
 * Type guard for combat effects
 */
export function isCombatEffect(effect: BaseEffect | Effect): effect is CombatEffect {
  return (
    'remainingTime' in effect &&
    'sourceId' in effect &&
    'targetId' in effect &&
    'effects' in effect &&
    Array.isArray((effect as CombatEffect).effects)
  );
}

// Effect Composition
// ------------------------------------------------------------

/**
 * Combines multiple effects into a single effect
 */
export function composeEffects(effects: BaseEffect[]): BaseEffect {
  if (effects.length === 0) {
    throw new Error('Cannot compose empty effects array');
  }

  const base = effects[0];
  return effects.reduce(
    (combined, effect) => ({
      ...combined,
      magnitude: combined.magnitude + effect.magnitude,
      duration: Math.min(combined.duration || Infinity, effect.duration || Infinity),
    }),
    { ...base }
  );
}

/**
 * Applies modifiers to an effect
 */
export function modifyEffect(effect: BaseEffect, modifiers: Partial<BaseEffect>): BaseEffect {
  return {
    ...effect,
    ...modifiers,
    magnitude: effect.magnitude * (modifiers.magnitude || 1),
  };
}

// Effect Debugging
// ------------------------------------------------------------

/**
 * Formats an effect for debugging
 */
export function formatEffectDebug(effect: BaseEffect): string {
  return `[${effect.type}] ${effect.name} (${effect.magnitude}) - ${
    effect.active ? 'Active' : 'Inactive'
  }${effect.duration ? ` for ${effect.duration}s` : ''}`;
}

/**
 * Validates an effect stack for consistency
 */
export function validateEffectStack(stack: EffectStack): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for duplicate effects
  const effectIds = new Set<string>();
  stack.effects.forEach(effect => {
    if (effectIds.has(effect.id)) {
      errors.push(`Duplicate effect ID: ${effect.id}`);
    }
    effectIds.add(effect.id);
  });

  // Check for expired effects
  stack.effects.forEach(effect => {
    if (
      effect.duration &&
      effect.active &&
      Date.now() - getEffectStartTime(stack, effect.id) > effect.duration * 1000
    ) {
      errors.push(`Expired effect still active: ${effect.id}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets the start time of an effect from the stack history
 */
function getEffectStartTime(stack: EffectStack, effectId: string): number {
  const appliedEntry = stack.history
    .filter(entry => entry.effectId === effectId && entry.action === 'applied')
    .pop();
  return appliedEntry?.timestamp ?? 0;
}

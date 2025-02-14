import { DamageEffect, AreaEffect as WeaponAreaEffect } from './WeaponEffects';
import { Effect, AreaEffect } from '../../types/core/GameTypes';

// Weapon Effects
export const PLASMA_EFFECT: DamageEffect = {
  type: 'damage',
  name: 'Plasma Burn',
  description: 'Deals plasma damage over time',
  magnitude: 20,
  duration: 4,
  active: true,
  cooldown: 0,
  strength: 20,
  damageType: 'energy',
  penetration: 10,
};

export const GAUSS_EFFECT: DamageEffect = {
  type: 'damage',
  name: 'Gauss Impact',
  description: 'Electromagnetic acceleration damage',
  magnitude: 50,
  duration: 2,
  active: true,
  cooldown: 0,
  strength: 50,
  damageType: 'physical',
  penetration: 30,
};

export const EXPLOSIVE_EFFECT: WeaponAreaEffect = {
  type: 'area',
  name: 'Explosive Impact',
  description: 'Area explosive damage',
  magnitude: 60,
  duration: 2,
  active: true,
  cooldown: 0,
  strength: 60,
  radius: 60,
  falloff: 0.5,
};

// Ability Effects
export const DAMAGE_BOOST_EFFECT: Effect = {
  type: 'damage',
  name: 'Damage Boost',
  description: 'Increases weapon damage',
  magnitude: 1.8,
  duration: 12,
};

export const SHIELD_FIELD_EFFECT: AreaEffect = {
  type: 'shield',
  name: 'Shield Field',
  description: 'Creates a powerful shield field',
  magnitude: 2.0,
  duration: 15,
  radius: 500,
};

export const SPEED_BOOST_EFFECT: Effect = {
  type: 'speed',
  name: 'Speed Boost',
  description: 'Increases movement speed',
  magnitude: 1.5,
  duration: 5,
};

export const STEALTH_EFFECT: Effect = {
  type: 'stealth',
  name: 'Stealth Field',
  description: 'Reduces detection range',
  magnitude: 1.0,
  duration: 8,
};

export const SPEED_REDUCTION_EFFECT: AreaEffect = {
  type: 'speed',
  name: 'Speed Reduction',
  description: 'Creates a field that slows enemies',
  magnitude: 0.6,
  duration: 9,
  radius: 300,
};

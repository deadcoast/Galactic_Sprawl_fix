import { AreaEffect as BaseAreaEffect, BaseEffect } from './EffectTypes';
import { DamageEffect, AreaEffect as WeaponAreaEffect } from './WeaponEffects';

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
  id: 'plasma-effect',
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
  id: 'gauss-effect',
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
  id: 'explosive-effect',
};

// Ability Effects
export const DAMAGE_BOOST_EFFECT: BaseEffect = {
  id: 'damage-boost-effect',
  type: 'damage',
  name: 'Damage Boost',
  description: 'Increases weapon damage',
  magnitude: 1.8,
  duration: 12,
};

export const SHIELD_FIELD_EFFECT: BaseAreaEffect = {
  id: 'shield-field-effect',
  type: 'shield',
  name: 'Shield Field',
  description: 'Creates a powerful shield field',
  magnitude: 2.0,
  duration: 15,
  radius: 500,
  position: { x: 0, y: 0 },
};

export const SPEED_BOOST_EFFECT: BaseEffect = {
  id: 'speed-boost-effect',
  type: 'speed',
  name: 'Speed Boost',
  description: 'Increases movement speed',
  magnitude: 1.5,
  duration: 5,
};

export const STEALTH_EFFECT: BaseEffect = {
  id: 'stealth-effect',
  type: 'stealth',
  name: 'Stealth Field',
  description: 'Reduces detection range',
  magnitude: 1.0,
  duration: 8,
};

export const SPEED_REDUCTION_EFFECT: BaseAreaEffect = {
  id: 'speed-reduction-effect',
  type: 'speed',
  name: 'Speed Reduction',
  description: 'Creates a field that slows enemies',
  magnitude: 0.6,
  duration: 9,
  radius: 300,
  position: { x: 0, y: 0 },
};

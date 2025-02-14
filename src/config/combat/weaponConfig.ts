import {
  WeaponCategory,
  BaseWeaponStats as WeaponStats,
  WeaponType,
  WeaponVariant,
  CombatWeaponStats,
} from '../../types/weapons/WeaponTypes';
import { DamageEffect, AreaEffect } from '../../effects/types_effects/WeaponEffects';

// Base stats for each weapon category
const baseWeaponStats: Record<WeaponCategory, WeaponStats> = {
  machineGun: {
    damage: 10,
    rateOfFire: 10,
    range: 300,
    accuracy: 0.8,
    energyCost: 5,
    cooldown: 0.1,
    effects: [
      {
        type: 'damage',
        name: 'Kinetic Impact',
        description: 'Basic kinetic damage',
        magnitude: 10,
        duration: 0,
        active: true,
        cooldown: 0.1,
        damage: 10,
        strength: 10,
        damageType: 'physical',
        penetration: 0.1,
      } as DamageEffect,
    ],
  },
  gaussCannon: {
    damage: 30,
    rateOfFire: 3,
    range: 500,
    accuracy: 0.9,
    energyCost: 15,
    cooldown: 0.3,
    effects: [
      {
        type: 'damage',
        name: 'Gauss Impact',
        description: 'Electromagnetic acceleration damage',
        magnitude: 30,
        duration: 0,
        active: true,
        cooldown: 0.3,
        damage: 30,
        strength: 30,
        damageType: 'energy',
        penetration: 0.3,
      } as DamageEffect,
    ],
    special: {
      armorPenetration: 0.3,
    },
  },
  railGun: {
    damage: 100,
    rateOfFire: 1,
    range: 800,
    accuracy: 0.95,
    energyCost: 30,
    cooldown: 1.0,
    effects: [
      {
        type: 'damage',
        name: 'Hypervelocity Impact',
        description: 'High-velocity projectile damage',
        magnitude: 100,
        duration: 0,
        active: true,
        cooldown: 1.0,
        damage: 100,
        damageType: 'physical',
        penetration: 0.5,
        strength: 100,
      } as DamageEffect,
    ],
    special: {
      armorPenetration: 0.5,
    },
  },
  mgss: {
    damage: 15,
    rateOfFire: 15,
    range: 400,
    accuracy: 0.7,
    energyCost: 8,
    cooldown: 0.1,
    effects: [
      {
        type: 'damage',
        name: 'MGSS Impact',
        description: 'Multi-gun system damage',
        magnitude: 15,
        duration: 0,
        active: true,
        cooldown: 0.1,
        damage: 15,
        damageType: 'physical',
        penetration: 0.2,
        strength: 15,
      } as DamageEffect,
    ],
  },
  rockets: {
    damage: 50,
    rateOfFire: 2,
    range: 600,
    accuracy: 0.85,
    energyCost: 20,
    cooldown: 0.5,
    effects: [
      {
        type: 'area',
        name: 'Rocket Explosion',
        description: 'Area explosive damage',
        magnitude: 50,
        duration: 0,
        active: true,
        cooldown: 0.5,
        radius: 50,
        strength: 50,
        falloff: 0.5,
      } as AreaEffect,
    ],
    special: {
      areaOfEffect: 50,
    },
  },
  pointDefense: {
    damage: 5,
    rateOfFire: 20,
    range: 200,
    accuracy: 0.9,
    energyCost: 3,
    cooldown: 0.05,
    effects: [
      {
        type: 'damage',
        name: 'Point Defense',
        description: 'Anti-missile/fighter damage',
        magnitude: 5,
        duration: 0,
        active: true,
        cooldown: 0.05,
        damage: 5,
        damageType: 'physical',
        penetration: 0.1,
        strength: 5,
      } as DamageEffect,
    ],
  },
  flakCannon: {
    damage: 25,
    rateOfFire: 5,
    range: 350,
    accuracy: 0.75,
    energyCost: 10,
    cooldown: 0.2,
    effects: [
      {
        type: 'area',
        name: 'Flak Burst',
        description: 'Area anti-fighter damage',
        magnitude: 25,
        duration: 0,
        active: true,
        cooldown: 0.2,
        damage: 25,
        radius: 30,
        falloff: 0.5,
        strength: 25,
      } as AreaEffect,
    ],
    special: {
      areaOfEffect: 30,
    },
  },
  capitalLaser: {
    damage: 200,
    rateOfFire: 0.5,
    range: 1000,
    accuracy: 0.95,
    energyCost: 50,
    cooldown: 2.0,
    effects: [
      {
        type: 'damage',
        name: 'Capital Laser',
        description: 'Heavy energy damage',
        magnitude: 200,
        duration: 0,
        active: true,
        cooldown: 2.0,
        damage: 200,
        damageType: 'energy',
        penetration: 0.4,
        strength: 200,
      } as DamageEffect,
    ],
    special: {
      shieldDamageBonus: 0.5,
    },
  },
  torpedoes: {
    damage: 150,
    rateOfFire: 0.5,
    range: 700,
    accuracy: 0.8,
    energyCost: 40,
    cooldown: 2.0,
    effects: [
      {
        type: 'area',
        name: 'Torpedo Detonation',
        description: 'Heavy explosive damage',
        magnitude: 150,
        duration: 0,
        active: true,
        cooldown: 2.0,
        damage: 150,
        radius: 60,
        falloff: 0.4,
        strength: 150,
      } as AreaEffect,
    ],
    special: {
      areaOfEffect: 60,
      armorPenetration: 0.4,
    },
  },
  harmonicCannon: {
    damage: 75,
    rateOfFire: 2,
    range: 600,
    accuracy: 0.9,
    energyCost: 25,
    cooldown: 0.5,
    effects: [
      {
        type: 'damage',
        name: 'Harmonic Resonance',
        description: 'Shield-penetrating damage',
        magnitude: 75,
        duration: 0,
        active: true,
        cooldown: 0.5,
        damage: 75,
        damageType: 'energy',
        penetration: 0.6,
        strength: 75,
      } as DamageEffect,
    ],
    special: {
      shieldDamageBonus: 0.8,
    },
  },
  temporalCannon: {
    damage: 100,
    rateOfFire: 1,
    range: 500,
    accuracy: 0.85,
    energyCost: 35,
    cooldown: 1.0,
    effects: [
      {
        type: 'damage',
        name: 'Temporal Disruption',
        description: 'Time-warping damage',
        magnitude: 100,
        duration: 3,
        active: true,
        cooldown: 1.0,
        damage: 100,
        damageType: 'energy',
        penetration: 0.3,
        strength: 100,
      } as DamageEffect,
    ],
    special: {
      disableChance: 0.3,
    },
  },
  quantumCannon: {
    damage: 120,
    rateOfFire: 1,
    range: 800,
    accuracy: 0.9,
    energyCost: 45,
    cooldown: 1.5,
    effects: [
      {
        type: 'damage',
        name: 'Quantum Collapse',
        description: 'Reality-warping damage',
        magnitude: 120,
        duration: 0,
        active: true,
        cooldown: 1.5,
        damage: 120,
        damageType: 'energy',
        penetration: 0.6,
        strength: 120,
      } as DamageEffect,
    ],
    special: {
      armorPenetration: 0.6,
      shieldDamageBonus: 0.4,
    },
  },
};

// Variant modifiers for each weapon type
const variantModifiers: Record<WeaponVariant, Partial<WeaponStats>> = {
  // Machine Gun variants
  basic: {},
  plasmaRounds: {
    damage: 15,
    effects: [
      {
        type: 'damage',
        name: 'Plasma Burn',
        description: 'Plasma damage over time',
        magnitude: 15,
        duration: 3,
        active: true,
        cooldown: 0.1,
        damage: 15,
        damageType: 'energy',
        penetration: 0.2,
        strength: 15,
      } as DamageEffect,
    ],
    special: {
      armorPenetration: 0.2,
    },
  },
  sparkRounds: {
    damage: 8,
    effects: [
      {
        type: 'damage',
        name: 'Shield Disruption',
        description: 'Enhanced shield damage',
        magnitude: 8,
        duration: 2,
        active: true,
        cooldown: 0.1,
        damage: 8,
        damageType: 'energy',
        penetration: 0.1,
        strength: 8,
      } as DamageEffect,
    ],
    special: {
      shieldDamageBonus: 0.5,
    },
  },

  // Gauss Cannon variants
  gaussPlaner: {
    damage: 25,
    accuracy: 0.85,
    effects: [
      {
        type: 'area',
        name: 'Area Gauss',
        description: 'Area electromagnetic damage',
        magnitude: 25,
        duration: 0,
        active: true,
        cooldown: 0.3,
        damage: 25,
        radius: 30,
        falloff: 0.5,
        strength: 25,
      } as AreaEffect,
    ],
    special: {
      areaOfEffect: 30,
    },
  },
  recirculatingGauss: {
    damage: 20,
    rateOfFire: 5,
    energyCost: 20,
    effects: [
      {
        type: 'damage',
        name: 'Rapid Gauss',
        description: 'Rapid electromagnetic damage',
        magnitude: 20,
        duration: 0,
        active: true,
        cooldown: 0.2,
        damage: 20,
        damageType: 'energy',
        penetration: 0.2,
        strength: 20,
      } as DamageEffect,
    ],
  },

  // Rail Gun variants
  lightShot: {
    damage: 150,
    rateOfFire: 0.5,
    accuracy: 0.98,
    special: {
      armorPenetration: 0.7,
    },
  },
  maurader: {
    damage: 80,
    rateOfFire: 2,
    accuracy: 0.9,
    special: {
      armorPenetration: 0.4,
    },
  },

  // MGSS variants
  engineAssistedSpool: {
    rateOfFire: 20,
    accuracy: 0.6,
    energyCost: 12,
  },
  slugMGSS: {
    damage: 25,
    rateOfFire: 10,
    accuracy: 0.8,
    special: {
      armorPenetration: 0.2,
    },
  },

  // Rocket variants
  emprRockets: {
    damage: 30,
    special: {
      disableChance: 0.3,
      areaOfEffect: 40,
    },
  },
  swarmRockets: {
    damage: 20,
    rateOfFire: 4,
    accuracy: 0.9,
    special: {
      areaOfEffect: 30,
    },
  },
  bigBangRockets: {
    damage: 100,
    rateOfFire: 1,
    energyCost: 30,
    special: {
      areaOfEffect: 80,
    },
  },
};

// Helper function to create a weapon type with variants
export function createWeaponType(
  id: string,
  category: WeaponCategory,
  variant: WeaponVariant
): WeaponType {
  const baseStats = baseWeaponStats[category];
  const modifiers = variantModifiers[variant];

  return {
    id,
    category,
    variant,
    baseStats: {
      ...baseStats,
      ...modifiers,
      special: {
        ...baseStats.special,
        ...modifiers.special,
      },
    },
    visualAsset: `weapons/${category}/${variant}`,
  };
}

// Pre-configured weapon types
export const weaponTypes: Record<string, WeaponType> = {
  // Machine Guns
  basicMachineGun: createWeaponType('basicMachineGun', 'machineGun', 'basic'),
  plasmaMachineGun: createWeaponType('plasmaMachineGun', 'machineGun', 'plasmaRounds'),
  sparkMachineGun: createWeaponType('sparkMachineGun', 'machineGun', 'sparkRounds'),

  // Gauss Cannons
  gaussPlaner: createWeaponType('gaussPlaner', 'gaussCannon', 'gaussPlaner'),
  recirculatingGauss: createWeaponType('recirculatingGauss', 'gaussCannon', 'recirculatingGauss'),

  // Rail Guns
  lightShot: createWeaponType('lightShot', 'railGun', 'lightShot'),
  maurader: createWeaponType('maurader', 'railGun', 'maurader'),

  // MGSS
  engineAssistedMGSS: createWeaponType('engineAssistedMGSS', 'mgss', 'engineAssistedSpool'),
  slugMGSS: createWeaponType('slugMGSS', 'mgss', 'slugMGSS'),

  // Rockets
  emprRockets: createWeaponType('emprRockets', 'rockets', 'emprRockets'),
  swarmRockets: createWeaponType('swarmRockets', 'rockets', 'swarmRockets'),
  bigBangRockets: createWeaponType('bigBangRockets', 'rockets', 'bigBangRockets'),
};

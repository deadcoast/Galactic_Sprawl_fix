import {
  WeaponCategory,
  WeaponStats,
  WeaponType,
  WeaponVariant,
} from "../../types/combat/CombatTypes";

// Base stats for each weapon category
const baseWeaponStats: Record<WeaponCategory, WeaponStats> = {
  machineGun: {
    damage: 10,
    rateOfFire: 10,
    range: 300,
    accuracy: 0.8,
    energyCost: 5,
    cooldown: 0.1,
    effects: []
  },
  gaussCannon: {
    damage: 30,
    rateOfFire: 3,
    range: 500,
    accuracy: 0.9,
    energyCost: 15,
    cooldown: 0.3,
    effects: [],
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
    effects: [],
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
    effects: []
  },
  rockets: {
    damage: 50,
    rateOfFire: 2,
    range: 600,
    accuracy: 0.85,
    energyCost: 20,
    cooldown: 0.5,
    effects: [],
    special: {
      areaOfEffect: 50,
    },
  },
};

// Variant modifiers for each weapon type
const variantModifiers: Record<WeaponVariant, Partial<WeaponStats>> = {
  // Machine Gun variants
  basic: {},
  plasmaRounds: {
    damage: 15,
    special: {
      armorPenetration: 0.2,
    },
  },
  sparkRounds: {
    damage: 8,
    special: {
      shieldDamageBonus: 0.5,
    },
  },

  // Gauss Cannon variants
  gaussPlaner: {
    damage: 25,
    accuracy: 0.85,
    special: {
      areaOfEffect: 30,
    },
  },
  recirculatingGauss: {
    damage: 20,
    rateOfFire: 5,
    energyCost: 20,
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
  variant: WeaponVariant,
): WeaponType {
  const baseStats = baseWeaponStats[category];
  const modifiers = variantModifiers[variant];

  return {
    id,
    category,
    variant,
    stats: {
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
  basicMachineGun: createWeaponType("basicMachineGun", "machineGun", "basic"),
  plasmaMachineGun: createWeaponType(
    "plasmaMachineGun",
    "machineGun",
    "plasmaRounds",
  ),
  sparkMachineGun: createWeaponType(
    "sparkMachineGun",
    "machineGun",
    "sparkRounds",
  ),

  // Gauss Cannons
  gaussPlaner: createWeaponType("gaussPlaner", "gaussCannon", "gaussPlaner"),
  recirculatingGauss: createWeaponType(
    "recirculatingGauss",
    "gaussCannon",
    "recirculatingGauss",
  ),

  // Rail Guns
  lightShot: createWeaponType("lightShot", "railGun", "lightShot"),
  maurader: createWeaponType("maurader", "railGun", "maurader"),

  // MGSS
  engineAssistedMGSS: createWeaponType(
    "engineAssistedMGSS",
    "mgss",
    "engineAssistedSpool",
  ),
  slugMGSS: createWeaponType("slugMGSS", "mgss", "slugMGSS"),

  // Rockets
  emprRockets: createWeaponType("emprRockets", "rockets", "emprRockets"),
  swarmRockets: createWeaponType("swarmRockets", "rockets", "swarmRockets"),
  bigBangRockets: createWeaponType(
    "bigBangRockets",
    "rockets",
    "bigBangRockets",
  ),
};

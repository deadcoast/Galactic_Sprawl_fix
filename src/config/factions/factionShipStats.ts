import { Effect } from "../../types/core/GameTypes";
import {
  ShipDisplayStats,
  SpaceRatsShipClass,
} from "../../types/ships/CommonShipTypes";
import {
  MountSize,
  WeaponCategory,
  WeaponMount,
} from "../../types/ships/WeaponTypes";

export interface ShipWeaponStats {
  damage: number;
  range: number;
  accuracy: number;
  type: "machineGun" | "gaussCannon" | "railGun" | "MGSS" | "rockets";
  effects: {
    type: "plasma" | "spark" | "gauss" | "explosive";
    damage: number;
    duration: number;
    radius?: number;
  }[];
}

export interface ShipDefenseStats {
  hull: number;
  shield: number;
  armor: number;
}

export interface ShipMobilityStats {
  speed: number;
  agility: number;
  jumpRange: number;
}

export interface ShipSystemStats {
  power: number;
  radar: number;
  efficiency: number;
}

export interface ShipAbility {
  name: string;
  description: string;
  cooldown: number;
  duration: number;
  active: boolean;
  effect: {
    type: "stealth" | "shield" | "speed" | "damage";
    magnitude: number;
    radius?: number;
    duration: number;
  };
}

export interface ShipStats {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  armor: number;
  speed: number;
  turnRate: number;
  cargo: number;
  energy: number;
  maxEnergy: number;
  weapons: WeaponMount[];
  defense: {
    armor: number;
    shield: number;
    regeneration: number;
  };
  mobility: {
    speed: number;
    turnRate: number;
    acceleration: number;
  };
  systems: {
    power: number;
    crew: number;
    cargo: number;
  };
  abilities: {
    name: string;
    description: string;
    cooldown: number;
    duration: number;
    active: boolean;
    effect: Effect;
  }[];
}

export const SHIP_STATS: Partial<Record<SpaceRatsShipClass, ShipStats>> = {
  ratKing: {
    health: 1000,
    maxHealth: 1000,
    shield: 500,
    maxShield: 500,
    armor: 300,
    speed: 100,
    turnRate: 2,
    cargo: 500,
    energy: 1000,
    maxEnergy: 1000,
    weapons: [
      {
        id: "railgun-mount-1",
        size: "medium" as MountSize,
        position: { x: 0, y: 0 },
        rotation: 0,
        allowedCategories: ["railGun"] as WeaponCategory[],
        currentWeapon: {
          config: {
            id: "basic-railgun",
            name: "Heavy Railgun",
            category: "railGun",
            tier: 1,
            baseStats: {
              damage: 120,
              range: 900,
              accuracy: 0.95,
              rateOfFire: 1,
              energyCost: 30,
              cooldown: 3,
              effects: [],
            },
            visualAsset: "weapons/railgun/basic",
            mountRequirements: {
              size: "medium",
              power: 30,
              crew: 2,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 120,
              range: 900,
              accuracy: 0.95,
              rateOfFire: 1,
              energyCost: 30,
              cooldown: 3,
              effects: [],
            },
          },
        },
      },
    ],
    defense: {
      armor: 300,
      shield: 500,
      regeneration: 10,
    },
    mobility: {
      speed: 100,
      turnRate: 2,
      acceleration: 50,
    },
    systems: {
      power: 1000,
      crew: 10,
      cargo: 500,
    },
    abilities: [
      {
        name: "Rat King's Wrath",
        description: "Temporarily boosts weapon damage and fire rate",
        cooldown: 30,
        duration: 10,
        active: false,
        effect: {
          type: "damage",
          magnitude: 1.5,
          duration: 10,
        },
      },
    ],
  },
  asteroidMarauder: {
    health: 600,
    maxHealth: 600,
    shield: 300,
    maxShield: 300,
    armor: 200,
    speed: 120,
    turnRate: 3,
    cargo: 200,
    energy: 500,
    maxEnergy: 500,
    weapons: [
      {
        id: "mg-mount-1",
        size: "small",
        position: { x: 0, y: 0 },
        rotation: 0,
        allowedCategories: ["machineGun"],
        currentWeapon: {
          config: {
            id: "basic-mg",
            name: "Machine Gun",
            category: "machineGun",
            tier: 1,
            baseStats: {
              damage: 30,
              range: 600,
              accuracy: 0.8,
              rateOfFire: 10,
              energyCost: 5,
              cooldown: 2,
              effects: [],
            },
            visualAsset: "weapons/machinegun/basic",
            mountRequirements: {
              size: "small",
              power: 5,
              crew: 1,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 30,
              range: 600,
              accuracy: 0.8,
              rateOfFire: 10,
              energyCost: 5,
              cooldown: 2,
              effects: [],
            },
          },
        },
      },
    ],
    defense: {
      armor: 200,
      shield: 300,
      regeneration: 5,
    },
    mobility: {
      speed: 120,
      turnRate: 3,
      acceleration: 60,
    },
    systems: {
      power: 500,
      crew: 4,
      cargo: 200,
    },
    abilities: [
      {
        name: "Scavenger Boost",
        description: "Temporarily increases ship speed",
        cooldown: 15,
        duration: 5,
        active: false,
        effect: { type: "speed", magnitude: 1.5, duration: 5 },
      },
    ],
  },
  rogueNebula: {
    health: 500,
    maxHealth: 500,
    shield: 400,
    maxShield: 400,
    armor: 150,
    speed: 150,
    turnRate: 3.5,
    cargo: 300,
    energy: 600,
    maxEnergy: 600,
    weapons: [
      {
        id: "railgun-mount-1",
        size: "medium" as MountSize,
        position: { x: 0, y: 0 },
        rotation: 0,
        allowedCategories: ["railGun"] as WeaponCategory[],
        currentWeapon: {
          config: {
            id: "advanced-railgun",
            name: "Advanced Railgun",
            category: "railGun",
            tier: 2,
            baseStats: {
              damage: 120,
              range: 900,
              accuracy: 0.85,
              rateOfFire: 1,
              energyCost: 25,
              cooldown: 3,
              effects: [],
            },
            visualAsset: "weapons/railgun/advanced",
            mountRequirements: {
              size: "medium",
              power: 25,
              crew: 2,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 120,
              range: 900,
              accuracy: 0.85,
              rateOfFire: 1,
              energyCost: 25,
              cooldown: 3,
              effects: [],
            },
          },
        },
      },
    ],
    defense: {
      armor: 150,
      shield: 400,
      regeneration: 8,
    },
    mobility: {
      speed: 150,
      turnRate: 3.5,
      acceleration: 75,
    },
    systems: {
      power: 600,
      crew: 6,
      cargo: 300,
    },
    abilities: [
      {
        name: "Stealth Drive",
        description: "Activates stealth capabilities",
        cooldown: 25,
        duration: 8,
        active: false,
        effect: { type: "stealth", magnitude: 1, duration: 8 },
      },
    ],
  },
  ratsRevenge: {
    health: 800,
    maxHealth: 800,
    shield: 400,
    maxShield: 400,
    armor: 250,
    speed: 130,
    turnRate: 3,
    cargo: 350,
    energy: 800,
    maxEnergy: 800,
    weapons: [
      {
        id: "mgss-mount-1",
        size: "medium" as MountSize,
        position: { x: 0, y: 0 },
        rotation: 0,
        allowedCategories: ["mgss"] as WeaponCategory[],
        currentWeapon: {
          config: {
            id: "basic-mgss",
            name: "MGSS Cannon",
            category: "mgss",
            tier: 2,
            baseStats: {
              damage: 40,
              range: 700,
              accuracy: 0.75,
              rateOfFire: 8,
              energyCost: 8,
              cooldown: 2,
              effects: [{ type: "plasma", damage: 15, duration: 2 }],
            },
            visualAsset: "weapons/mgss/basic",
            mountRequirements: {
              size: "medium",
              power: 20,
              crew: 2,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 40,
              range: 700,
              accuracy: 0.75,
              rateOfFire: 8,
              energyCost: 8,
              cooldown: 2,
              effects: [{ type: "plasma", damage: 15, duration: 2 }],
            },
          },
        },
      },
    ],
    defense: {
      armor: 250,
      shield: 400,
      regeneration: 8,
    },
    mobility: {
      speed: 130,
      turnRate: 3,
      acceleration: 65,
    },
    systems: {
      power: 800,
      crew: 8,
      cargo: 350,
    },
    abilities: [
      {
        name: "Combat Overdrive",
        description: "Enhances weapon damage",
        cooldown: 20,
        duration: 5,
        active: false,
        effect: { type: "damage", magnitude: 1.5, duration: 5 },
      },
    ],
  },
  darkSectorCorsair: {
    health: 550,
    maxHealth: 550,
    shield: 350,
    maxShield: 350,
    armor: 180,
    speed: 140,
    turnRate: 3,
    cargo: 250,
    energy: 600,
    maxEnergy: 600,
    weapons: [
      {
        id: "gauss-mount-1",
        size: "medium" as MountSize,
        position: { x: 0, y: 0 },
        rotation: 0,
        allowedCategories: ["gaussCannon"] as WeaponCategory[],
        currentWeapon: {
          config: {
            id: "basic-gauss",
            name: "Gauss Cannon",
            category: "gaussCannon",
            tier: 2,
            baseStats: {
              damage: 90,
              range: 850,
              accuracy: 0.9,
              rateOfFire: 4,
              energyCost: 15,
              cooldown: 2,
              effects: [{ type: "gauss", damage: 20, duration: 3 }],
            },
            visualAsset: "weapons/gauss/basic",
            mountRequirements: {
              size: "medium",
              power: 25,
              crew: 2,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 90,
              range: 850,
              accuracy: 0.9,
              rateOfFire: 4,
              energyCost: 15,
              cooldown: 2,
              effects: [{ type: "gauss", damage: 20, duration: 3 }],
            },
          },
        },
      },
    ],
    defense: {
      armor: 180,
      shield: 350,
      regeneration: 7,
    },
    mobility: {
      speed: 140,
      turnRate: 3,
      acceleration: 70,
    },
    systems: {
      power: 600,
      crew: 6,
      cargo: 250,
    },
    abilities: [
      {
        name: "Shadow Protocol",
        description: "Reduces visibility",
        cooldown: 30,
        duration: 4,
        active: false,
        effect: { type: "stealth", magnitude: 0.8, duration: 4 },
      },
    ],
  },
  wailingWreck: {
    health: 900,
    shield: 200,
    armor: 400,
    speed: 80,
    turnRate: 2,
    weapons: [
      {
        type: "rockets",
        damage: 150,
        range: 1000,
        cooldown: 4,
        accuracy: 0.7,
        effects: [{ type: "explosive", damage: 75, duration: 1, radius: 40 }],
      },
    ],
    abilities: [
      {
        name: "Emergency Thrusters",
        description: "Modifies ship speed",
        cooldown: 40,
        duration: 8,
        active: false,
        effect: { type: "speed", magnitude: 0.5, duration: 8 },
      },
    ],
  },
  galacticScourge: {
    health: 1200,
    shield: 600,
    armor: 350,
    speed: 90,
    turnRate: 3,
    weapons: [
      {
        type: "railGun",
        damage: 200,
        range: 1100,
        cooldown: 3,
        accuracy: 0.85,
        effects: [{ type: "gauss", damage: 50, duration: 2 }],
      },
    ],
    abilities: [
      {
        name: "Chaos Wave",
        description: "Unleashes a devastating area attack",
        cooldown: 40,
        duration: 12,
        active: false,
        effect: { type: "damage", magnitude: 1.8, radius: 300, duration: 12 },
      },
    ],
  },
  plasmaFang: {
    health: 450,
    shield: 300,
    armor: 150,
    speed: 160,
    turnRate: 3,
    weapons: [
      {
        type: "MGSS",
        damage: 35,
        range: 600,
        cooldown: 2,
        accuracy: 0.8,
        effects: [{ type: "plasma", damage: 20, duration: 4 }],
      },
    ],
    abilities: [
      {
        name: "Plasma Burst",
        description: "Fires a concentrated plasma blast",
        cooldown: 22,
        duration: 6,
        active: false,
        effect: { type: "damage", magnitude: 1.6, duration: 6 },
      },
    ],
  },
  verminVanguard: {
    health: 700,
    shield: 450,
    armor: 250,
    speed: 110,
    turnRate: 3,
    weapons: [
      {
        type: "gaussCannon",
        damage: 100,
        range: 950,
        cooldown: 2,
        accuracy: 0.88,
        effects: [{ type: "gauss", damage: 25, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: "Rally Vermin",
        description: "Increases nearby allies speed and combat effectiveness",
        cooldown: 28,
        duration: 10,
        active: false,
        effect: { type: "speed", magnitude: 1.3, radius: 200, duration: 10 },
      },
    ],
  },
  blackVoidBuccaneer: {
    health: 600,
    shield: 500,
    armor: 200,
    speed: 135,
    turnRate: 3,
    weapons: [
      {
        id: "railgun-mount-1",
        size: "medium",
        position: { x: 0, y: 0 },
        rotation: 0,
        allowedCategories: ["railGun"],
        currentWeapon: {
          config: {
            id: "basic-railgun",
            name: "Rail Gun",
            category: "railGun",
            tier: 2,
            baseStats: {
              damage: 140,
              range: 1000,
              accuracy: 0.9,
              rateOfFire: 1,
              energyCost: 30,
              cooldown: 3,
            },
            mountRequirements: {
              size: "medium",
              power: 30,
              crew: 2,
            },
            visualAsset: "weapons/railgun/basic",
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 140,
              range: 1000,
              accuracy: 0.9,
              rateOfFire: 1,
              energyCost: 30,
              cooldown: 3,
            },
          },
        },
      },
    ],
    abilities: [
      {
        name: "Void Cloak",
        description: "Temporarily cloaks the ship, making it harder to detect",
        cooldown: 32,
        duration: 7,
        active: false,
        effect: { type: "stealth", magnitude: 0.9, duration: 7 },
      },
    ],
  },

  // Lost Nova Ships
  eclipseScythe: {
    health: 800,
    shield: 800,
    armor: 200,
    speed: 150,
    turnRate: 3,
    weapons: [
      {
        type: "gaussCannon",
        damage: 150,
        range: 1000,
        cooldown: 2,
        accuracy: 0.9,
        effects: [{ type: "gauss", damage: 50, duration: 2 }],
      },
    ],
    abilities: [
      {
        name: "Phase Shift",
        cooldown: 20,
        duration: 5,
        active: false,
        effect: { type: "stealth", magnitude: 1, duration: 5 },
      },
    ],
  },
  nullsRevenge: {
    health: 1100,
    shield: 900,
    armor: 300,
    speed: 100,
    turnRate: 3,
    weapons: [
      {
        type: "railGun",
        damage: 180,
        range: 1200,
        cooldown: 3,
        accuracy: 0.85,
        effects: [{ type: "gauss", damage: 60, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: "Null Field",
        description:
          "Creates a protective energy field that doubles shield strength",
        cooldown: 35,
        duration: 8,
        active: false,
        effect: { type: "shield", magnitude: 2, duration: 8 },
      },
    ],
  },
  darkMatterReaper: {
    health: 900,
    shield: 700,
    armor: 250,
    speed: 120,
    turnRate: 3,
    weapons: [
      {
        type: "MGSS",
        damage: 60,
        range: 900,
        cooldown: 3,
        accuracy: 0.8,
        effects: [{ type: "plasma", damage: 30, duration: 4 }],
      },
    ],
    abilities: [
      {
        name: "Dark Matter Burst",
        cooldown: 30,
        duration: 6,
        active: false,
        effect: { type: "damage", magnitude: 1.8, radius: 250, duration: 6 },
      },
    ],
  },
  quantumPariah: {
    health: 600,
    shield: 600,
    armor: 150,
    speed: 170,
    turnRate: 3,
    weapons: [
      {
        type: "gaussCannon",
        damage: 100,
        range: 800,
        cooldown: 2,
        accuracy: 0.95,
        effects: [{ type: "gauss", damage: 40, duration: 2 }],
      },
    ],
    abilities: [
      {
        name: "Quantum Cloak",
        cooldown: 25,
        duration: 7,
        active: false,
        effect: { type: "stealth", magnitude: 1, duration: 7 },
      },
    ],
  },
  entropyScale: {
    health: 850,
    shield: 850,
    armor: 280,
    speed: 110,
    turnRate: 3,
    weapons: [
      {
        type: "railGun",
        damage: 160,
        range: 1100,
        cooldown: 2,
        accuracy: 0.88,
        effects: [{ type: "gauss", damage: 45, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: "Entropy Field",
        cooldown: 28,
        duration: 9,
        active: false,
        effect: { type: "speed", magnitude: 0.6, radius: 300, duration: 9 },
      },
    ],
  },
  voidRevenant: {
    health: 750,
    shield: 750,
    armor: 200,
    speed: 140,
    turnRate: 3,
    weapons: [
      {
        type: "MGSS",
        damage: 45,
        range: 850,
        cooldown: 2,
        accuracy: 0.85,
        effects: [{ type: "plasma", damage: 25, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: "Void Jump",
        cooldown: 22,
        duration: 4,
        active: false,
        effect: { type: "stealth", magnitude: 0.9, duration: 7 },
      },
    ],
  },
  scytheOfAndromeda: {
    health: 1000,
    shield: 1000,
    armor: 350,
    speed: 130,
    turnRate: 3,
    weapons: [
      {
        type: "railGun",
        damage: 200,
        range: 1300,
        cooldown: 3,
        accuracy: 0.92,
        effects: [{ type: "gauss", damage: 70, duration: 4 }],
      },
    ],
    abilities: [
      {
        name: "Star Tear",
        cooldown: 45,
        duration: 10,
        active: false,
        effect: { type: "damage", magnitude: 2.2, radius: 400, duration: 10 },
      },
    ],
  },
  nebulaPersistence: {
    health: 950,
    shield: 950,
    armor: 300,
    speed: 90,
    turnRate: 3,
    weapons: [
      {
        type: "rockets",
        damage: 180,
        range: 1000,
        cooldown: 2,
        accuracy: 0.8,
        effects: [{ type: "explosive", damage: 90, duration: 2, radius: 60 }],
      },
    ],
    abilities: [
      {
        name: "Nebula Shield",
        cooldown: 32,
        duration: 12,
        active: false,
        effect: { type: "shield", magnitude: 1.8 },
      },
    ],
  },
  oblivionsWake: {
    health: 800,
    shield: 800,
    armor: 250,
    speed: 160,
    turnRate: 3,
    weapons: [
      {
        type: "gaussCannon",
        damage: 140,
        range: 950,
        cooldown: 3,
        accuracy: 0.9,
        effects: [{ type: "gauss", damage: 55, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: "Wake of Destruction",
        cooldown: 38,
        duration: 8,
        active: false,
        effect: { type: "damage", magnitude: 1.6, radius: 200, duration: 8 },
      },
    ],
  },
  forbiddenVanguard: {
    health: 1200,
    shield: 1200,
    armor: 400,
    speed: 120,
    turnRate: 3,
    weapons: [
      {
        type: "MGSS",
        damage: 70,
        range: 1100,
        cooldown: 3,
        accuracy: 0.88,
        effects: [{ type: "plasma", damage: 40, duration: 5 }],
      },
    ],
    abilities: [
      {
        name: "Forbidden Technology",
        cooldown: 50,
        duration: 15,
        active: false,
        effect: { type: "damage", magnitude: 2.5, radius: 500 },
      },
    ],
  },

  // Equator Horizon Ships
  celestialArbiter: {
    health: 1500,
    shield: 1000,
    armor: 500,
    speed: 80,
    turnRate: 3,
    weapons: [
      {
        type: "railGun",
        damage: 300,
        range: 1500,
        cooldown: 3,
        accuracy: 0.95,
        effects: [{ type: "gauss", damage: 100, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: "Balance Restoration",
        cooldown: 45,
        duration: 15,
        active: false,
        effect: { type: "shield", magnitude: 2, radius: 500 },
      },
    ],
  },
  etherealGalleon: {
    health: 1300,
    shield: 1200,
    armor: 400,
    speed: 100,
    turnRate: 3,
    weapons: [
      {
        type: "MGSS",
        damage: 80,
        range: 1200,
        cooldown: 3,
        accuracy: 0.9,
        effects: [{ type: "plasma", damage: 50, duration: 4 }],
      },
    ],
    abilities: [
      {
        name: "Ancient Energy",
        cooldown: 40,
        duration: 12,
        active: false,
        effect: { type: "damage", magnitude: 2.2 },
      },
    ],
  },
  stellarEquinox: {
    health: 1100,
    shield: 900,
    armor: 350,
    speed: 120,
    turnRate: 3,
    weapons: [
      {
        type: "gaussCannon",
        damage: 200,
        range: 1300,
        cooldown: 3,
        accuracy: 0.93,
        effects: [{ type: "gauss", damage: 80, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: "Perfect Harmony",
        cooldown: 35,
        duration: 10,
        active: false,
        effect: { type: "shield", magnitude: 1.8, radius: 400 },
      },
    ],
  },
  chronosSentinel: {
    health: 900,
    shield: 1100,
    armor: 300,
    speed: 140,
    turnRate: 3,
    weapons: [
      {
        type: "railGun",
        damage: 250,
        range: 1400,
        cooldown: 3,
        accuracy: 0.92,
        effects: [{ type: "gauss", damage: 90, duration: 2 }],
      },
    ],
    abilities: [
      {
        name: "Time Dilation",
        cooldown: 30,
        duration: 8,
        active: false,
        effect: { type: "speed", magnitude: 0.5, radius: 300 },
      },
    ],
  },
  nebulasJudgement: {
    health: 1000,
    shield: 800,
    armor: 400,
    speed: 160,
    turnRate: 3,
    weapons: [
      {
        type: "MGSS",
        damage: 150,
        range: 1100,
        cooldown: 3,
        accuracy: 0.9,
        effects: [{ type: "plasma", damage: 60, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: "Swift Justice",
        cooldown: 25,
        duration: 6,
        active: false,
        effect: { type: "damage", magnitude: 2 },
      },
    ],
  },
  aetherialHorizon: {
    health: 1400,
    shield: 1300,
    armor: 450,
    speed: 110,
    turnRate: 3,
    weapons: [
      {
        type: "rockets",
        damage: 280,
        range: 1600,
        cooldown: 4,
        accuracy: 0.85,
        effects: [{ type: "explosive", damage: 140, duration: 2, radius: 80 }],
      },
    ],
    abilities: [
      {
        name: "First Contact",
        cooldown: 55,
        duration: 18,
        active: false,
        effect: { type: "shield", magnitude: 2.5, radius: 600 },
      },
    ],
  },
  cosmicCrusader: {
    health: 1200,
    shield: 1000,
    armor: 380,
    speed: 130,
    turnRate: 3,
    weapons: [
      {
        type: "gaussCannon",
        damage: 220,
        range: 1400,
        cooldown: 3,
        accuracy: 0.94,
        effects: [{ type: "gauss", damage: 85, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: "Threat Neutralization",
        cooldown: 42,
        duration: 12,
        active: false,
        effect: { type: "damage", magnitude: 2.3, radius: 450 },
      },
    ],
  },
  balancekeepersWrath: {
    health: 1600,
    shield: 1400,
    armor: 600,
    speed: 70,
    turnRate: 3,
    weapons: [
      {
        type: "railGun",
        damage: 350,
        range: 1800,
        cooldown: 4,
        accuracy: 0.96,
        effects: [{ type: "gauss", damage: 120, duration: 4 }],
      },
    ],
    abilities: [
      {
        name: "Wrath of Balance",
        cooldown: 60,
        duration: 20,
        active: false,
        effect: { type: "damage", magnitude: 3, radius: 700 },
      },
    ],
  },
  eclipticWatcher: {
    health: 800,
    shield: 1000,
    armor: 250,
    speed: 180,
    turnRate: 3,
    weapons: [
      {
        type: "MGSS",
        damage: 100,
        range: 1000,
        cooldown: 3,
        accuracy: 0.92,
        effects: [{ type: "plasma", damage: 45, duration: 2 }],
      },
    ],
    abilities: [
      {
        name: "Perfect Stealth",
        cooldown: 38,
        duration: 10,
        active: false,
        effect: { type: "stealth", magnitude: 1 },
      },
    ],
  },
  harmonysVanguard: {
    health: 1300,
    shield: 1100,
    armor: 420,
    speed: 140,
    turnRate: 3,
    weapons: [
      {
        type: "gaussCannon",
        damage: 240,
        range: 1500,
        cooldown: 3,
        accuracy: 0.93,
        effects: [{ type: "gauss", damage: 95, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: "Order from Chaos",
        cooldown: 48,
        duration: 15,
        active: false,
        effect: { type: "shield", magnitude: 2.2, radius: 550 },
      },
    ],
  },
} as const;

// Helper function to get ship stats with type safety
export function getShipStats(shipClass: SpaceRatsShipClass): ShipStats {
  const stats = SHIP_STATS[shipClass];
  if (!stats) {
    throw new Error(`No stats found for ship class: ${shipClass}`);
  }
  return stats;
}

// Helper function to calculate display stats
export function getShipDisplayStats(stats: ShipStats): ShipDisplayStats {
  return {
    weapons: {
      damage: stats.weapons.reduce(
        (sum, mount) =>
          sum + (mount.currentWeapon?.state.currentStats.damage || 0),
        0,
      ),
      range: Math.max(
        ...stats.weapons.map(
          (mount) => mount.currentWeapon?.state.currentStats.range || 0,
        ),
      ),
      accuracy:
        stats.weapons.reduce(
          (sum, mount) =>
            sum + (mount.currentWeapon?.state.currentStats.accuracy || 0),
          0,
        ) / stats.weapons.length,
    },
    defense: {
      hull: stats.health,
      shield: stats.shield,
      armor: stats.armor,
    },
    mobility: {
      speed: stats.speed,
      agility: stats.turnRate * 20,
      jumpRange: 0,
    },
    systems: {
      power: stats.systems.power,
      radar: Math.round(
        stats.weapons.reduce(
          (sum, mount) =>
            sum + (mount.currentWeapon?.state.currentStats.range || 0),
          0,
        ) / 100,
      ),
      efficiency: stats.systems.power,
    },
  };
}

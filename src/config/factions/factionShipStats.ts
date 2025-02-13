import { Effect } from "../../types/core/GameTypes";
import {
  CommonShipStats,
  ShipCategory,
} from "../../types/ships/CommonShipTypes";
import {
  WeaponCategory,
  WeaponMount,
  WeaponMountSize,
  WeaponMountPosition,
  WeaponConfig,
} from "../../types/weapons/WeaponTypes";

// Update weapon effects to include magnitude
export interface WeaponEffect {
  type: "plasma" | "spark" | "gauss" | "explosive";
  damage: number;
  duration: number;
  magnitude: number;
  radius?: number;
}

export interface ShipWeaponStats {
  damage: number;
  range: number;
  accuracy: number;
  type: WeaponCategory;
  effects: WeaponEffect[];
}

export interface ShipDefenseStats {
  hull: number;
  shield: number;
  armor: number;
  evasion: number;
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
  category: ShipCategory;
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
    radar: number;
    efficiency: number;
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

// Update weapon mount positions to use the enum directly
const WEAPON_POSITIONS: Record<string, WeaponMountPosition> = {
  FRONT: "front",
  SIDE: "side",
  TURRET: "turret",
} as const;

export interface WeaponMountState {
  status: "ready" | "reloading" | "disabled";
  currentStats: {
    damage: number;
    range: number;
    accuracy: number;
    rateOfFire: number;
    energyCost: number;
    cooldown: number;
    effects: Effect[];
  };
  effects: Effect[];
}

export interface WeaponMountConfig {
  id: string;
  size: WeaponMountSize;
  position: WeaponMountPosition;
  rotation: number;
  allowedCategories: WeaponCategory[];
  currentWeapon: {
    config: WeaponConfig;
    state: WeaponMountState;
  };
}

// Ship stats interface that includes additional properties
interface ExtendedShipStats extends CommonShipStats {
  armor: number;
  category: ShipCategory;
  defense: {
    armor: number;
    shield: number;
    evasion: number;
    regeneration: number;
  };
  mobility: {
    speed: number;
    turnRate: number;
    acceleration: number;
  };
  systems: {
    power: number;
    radar: number;
    efficiency: number;
    crew: number;
    cargo: number;
  };
}

// Update weapon configurations
export const SHIP_STATS: Record<string, ExtendedShipStats> = {
  "asteroid-marauder": {
    health: 800,
    maxHealth: 800,
    shield: 300,
    maxShield: 400,
    energy: 400,
    maxEnergy: 400,
    category: "war",
    weapons: [
      {
        id: "mg-mount-1",
        size: "small" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
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
              size: "small" as WeaponMountSize,
              power: 5,
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
            effects: [],
          },
        },
      },
    ],
    armor: 80,
    defense: {
      armor: 200,
      shield: 300,
      evasion: 0.3,
      regeneration: 5,
    },
    mobility: {
      speed: 120,
      turnRate: 2.5,
      acceleration: 6,
    },
    systems: {
      power: 500,
      radar: 60,
      efficiency: 500,
      crew: 4,
      cargo: 200,
    },
    abilities: [],
    cargo: 100,
    speed: 120,
    turnRate: 2.5,
  },
  "rat-king": {
    health: 1000,
    maxHealth: 1000,
    shield: 400,
    maxShield: 500,
    energy: 500,
    maxEnergy: 500,
    category: "war",
    weapons: [
      {
        id: "rocket-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["rockets"],
        currentWeapon: {
          config: {
            id: "heavy-rocket",
            name: "Heavy Rocket",
            category: "rockets",
            tier: 2,
            baseStats: {
              damage: 150,
              range: 1000,
              accuracy: 0.7,
              rateOfFire: 1,
              energyCost: 20,
              cooldown: 4,
              effects: [{ type: "explosive", damage: 75, duration: 1, radius: 40, magnitude: 1.5 }],
            },
            visualAsset: "weapons/rockets/heavy",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 30,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 150,
              range: 1000,
              accuracy: 0.7,
              rateOfFire: 1,
              energyCost: 20,
              cooldown: 4,
              effects: [{ type: "explosive", damage: 75, duration: 1, radius: 40, magnitude: 1.5 }],
            },
            effects: [{ type: "explosive", damage: 75, duration: 1, radius: 40, magnitude: 1.5 }],
          },
        },
      },
      {
        id: "side-gun-1",
        type: "machineGun",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.SIDE,
        rotation: 90,
        allowedCategories: ["machineGun", "pointDefense"],
        currentWeapon: {
          config: {
            id: "rapid-mg",
            name: "Rapid Machine Gun",
            category: "machineGun",
            tier: 1,
            baseStats: {
              damage: 30,
              range: 600,
              accuracy: 0.8,
              rateOfFire: 10,
              energyCost: 5,
              cooldown: 2,
              effects: [{
                type: "damage",
                magnitude: 0.8,
                duration: 2,
              }],
            },
            visualAsset: "weapons/machinegun-rapid",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 20,
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
              effects: [{
                type: "damage",
                magnitude: 0.8,
                duration: 2,
              }],
            },
            effects: [{
              type: "damage",
              magnitude: 0.8,
              duration: 2,
            }],
          },
        },
      },
      {
        id: "side-gun-2",
        type: "machineGun",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.SIDE,
        rotation: -90,
        allowedCategories: ["machineGun", "pointDefense"],
        currentWeapon: {
          config: {
            id: "rapid-mg",
            name: "Rapid Machine Gun",
            category: "machineGun",
            tier: 1,
            baseStats: {
              damage: 30,
              range: 600,
              accuracy: 0.8,
              rateOfFire: 10,
              energyCost: 5,
              cooldown: 2,
              effects: [{
                type: "damage",
                magnitude: 0.8,
                duration: 2,
              }],
            },
            visualAsset: "weapons/machinegun-rapid",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 20,
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
              effects: [{
                type: "damage",
                magnitude: 0.8,
                duration: 2,
              }],
            },
            effects: [{
              type: "damage",
              magnitude: 0.8,
              duration: 2,
            }],
          },
        },
      },
      {
        id: "turret-1",
        type: "pointDefense",
        size: "small" as WeaponMountSize,
        position: WEAPON_POSITIONS.TURRET,
        rotation: 0,
        allowedCategories: ["pointDefense", "flakCannon"],
        currentWeapon: {
          config: {
            id: "pd-turret",
            name: "Point Defense Turret",
            category: "pointDefense",
            tier: 1,
            baseStats: {
              damage: 15,
              range: 400,
              accuracy: 0.9,
              rateOfFire: 15,
              energyCost: 3,
              cooldown: 1,
              effects: [],
            },
            visualAsset: "weapons/point-defense-basic",
            mountRequirements: {
              size: "small" as WeaponMountSize,
              power: 10,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 15,
              range: 400,
              accuracy: 0.9,
              rateOfFire: 15,
              energyCost: 3,
              cooldown: 1,
              effects: [],
            },
            effects: [],
          },
        },
      },
    ],
    armor: 100,
    defense: {
      armor: 150,
      shield: 400,
      evasion: 0.25,
      regeneration: 8,
    },
    mobility: {
      speed: 100,
      turnRate: 2.0,
      acceleration: 5,
    },
    systems: {
      power: 600,
      radar: 100,
      efficiency: 600,
      crew: 6,
      cargo: 300,
    },
    abilities: [],
    cargo: 150,
    speed: 100,
    turnRate: 2.0,
  },
  asteroidMarauder: {
    health: 600,
    maxHealth: 600,
    shield: 300,
    maxShield: 300,
    energy: 500,
    maxEnergy: 500,
    category: "war",
    armor: 200,
    speed: 120,
    turnRate: 3,
    cargo: 200,
    defense: {
      armor: 200,
      shield: 300,
      evasion: 0.3,
      regeneration: 5,
    },
    mobility: {
      speed: 120,
      turnRate: 3,
      acceleration: 60,
    },
    systems: {
      power: 500,
      radar: 60,
      efficiency: 500,
      crew: 4,
      cargo: 200,
    },
    weapons: [
      {
        id: "mg-mount-1",
        size: "small" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
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
              size: "small" as WeaponMountSize,
              power: 5,
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
            effects: [],
          },
        },
      },
    ],
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
    category: "recon",
    weapons: [
      {
        id: "railgun-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
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
              effects: [],
            },
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 30,
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
              effects: [],
            },
            effects: [],
          },
        },
      },
    ],
    defense: {
      armor: 150,
      shield: 400,
      evasion: 0.25,
      regeneration: 8,
    },
    mobility: {
      speed: 150,
      turnRate: 3.5,
      acceleration: 75,
    },
    systems: {
      power: 600,
      radar: 100,
      efficiency: 600,
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
    category: "war",
    weapons: [
      {
        id: "mgss-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["mgss"] as WeaponCategory[],
        currentWeapon: {
          config: {
            id: "basic-mgss",
            name: "mgss Cannon",
            category: "mgss",
            tier: 2,
            baseStats: {
              damage: 40,
              range: 700,
              accuracy: 0.75,
              rateOfFire: 8,
              energyCost: 8,
              cooldown: 2,
              effects: [{ type: "plasma", damage: 15, duration: 2, magnitude: 1.2 }],
            },
            visualAsset: "weapons/mgss/basic",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 20,
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
              effects: [{ type: "plasma", damage: 15, duration: 2, magnitude: 1.2 }],
            },
            effects: [{ type: "plasma", damage: 15, duration: 2, magnitude: 1.2 }],
          },
        },
      },
    ],
    defense: {
      armor: 250,
      shield: 400,
      evasion: 0.2,
      regeneration: 8,
    },
    mobility: {
      speed: 130,
      turnRate: 3,
      acceleration: 65,
    },
    systems: {
      power: 800,
      radar: 70,
      efficiency: 800,
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
    category: "recon",
    weapons: [
      {
        id: "gauss-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["gaussCannon"],
        currentWeapon: {
          config: {
            id: "heavy-gauss",
            name: "Heavy Gauss Cannon",
            category: "gaussCannon",
            tier: 2,
            baseStats: {
              damage: 150,
              range: 1000,
              accuracy: 0.9,
              rateOfFire: 2,
              energyCost: 25,
              cooldown: 2,
              effects: [{ type: "gauss", damage: 50, duration: 2, magnitude: 1.5 }],
            },
            visualAsset: "weapons/gauss/heavy",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 30,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 150,
              range: 1000,
              accuracy: 0.9,
              rateOfFire: 2,
              energyCost: 25,
              cooldown: 2,
              effects: [{ type: "gauss", damage: 50, duration: 2, magnitude: 1.5 }],
            },
            effects: [{ type: "gauss", damage: 50, duration: 2, magnitude: 1.5 }],
          },
        },
      },
    ],
    defense: {
      armor: 180,
      shield: 350,
      evasion: 0.35,
      regeneration: 7,
    },
    mobility: {
      speed: 140,
      turnRate: 3,
      acceleration: 70,
    },
    systems: {
      power: 600,
      radar: 100,
      efficiency: 600,
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
    maxHealth: 900,
    shield: 200,
    maxShield: 200,
    energy: 500,
    maxEnergy: 500,
    armor: 400,
    speed: 80,
    turnRate: 2,
    cargo: 400,
    category: "war",
    defense: {
      armor: 400,
      shield: 200,
      evasion: 0.2,
      regeneration: 4,
    },
    mobility: {
      speed: 80,
      turnRate: 2,
      acceleration: 40,
    },
    systems: {
      power: 500,
      radar: 100,
      efficiency: 500,
      crew: 8,
      cargo: 400,
    },
    weapons: [
      {
        id: "rocket-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["rockets"],
        currentWeapon: {
          config: {
            id: "heavy-rocket",
            name: "Heavy Rocket",
            category: "rockets",
            tier: 2,
            baseStats: {
              damage: 150,
              range: 1000,
              accuracy: 0.7,
              rateOfFire: 1,
              energyCost: 20,
              cooldown: 4,
              effects: [{ type: "explosive", damage: 75, duration: 1, radius: 40, magnitude: 1.5 }],
            },
            visualAsset: "weapons/rockets/heavy",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 30,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 150,
              range: 1000,
              accuracy: 0.7,
              rateOfFire: 1,
              energyCost: 20,
              cooldown: 4,
              effects: [{ type: "explosive", damage: 75, duration: 1, radius: 40, magnitude: 1.5 }],
            },
            effects: [{ type: "explosive", damage: 75, duration: 1, radius: 40, magnitude: 1.5 }],
          },
        },
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
    maxHealth: 1200,
    shield: 600,
    maxShield: 600,
    energy: 800,
    maxEnergy: 800,
    armor: 350,
    speed: 90,
    turnRate: 3,
    cargo: 500,
    category: "war",
    defense: {
      armor: 350,
      shield: 600,
      evasion: 0.25,
      regeneration: 10,
    },
    mobility: {
      speed: 90,
      turnRate: 3,
      acceleration: 45,
    },
    systems: {
      power: 800,
      radar: 110,
      efficiency: 800,
      crew: 12,
      cargo: 500,
    },
    weapons: [
      {
        id: "railgun-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["railGun"],
        currentWeapon: {
          config: {
            id: "advanced-railgun",
            name: "Advanced Railgun",
            category: "railGun",
            tier: 3,
            baseStats: {
              damage: 200,
              range: 1100,
              accuracy: 0.85,
              rateOfFire: 1,
              energyCost: 40,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 50, duration: 2, magnitude: 1.8 }],
            },
            visualAsset: "weapons/railgun/advanced",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 50,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 200,
              range: 1100,
              accuracy: 0.85,
              rateOfFire: 1,
              energyCost: 40,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 50, duration: 2, magnitude: 1.8 }],
            },
            effects: [{ type: "gauss", damage: 50, duration: 2, magnitude: 1.8 }],
          },
        },
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
    maxHealth: 450,
    shield: 300,
    maxShield: 300,
    energy: 400,
    maxEnergy: 400,
    armor: 150,
    speed: 160,
    turnRate: 3,
    cargo: 200,
    category: "recon",
    defense: {
      armor: 150,
      shield: 300,
      evasion: 0.4,
      regeneration: 6,
    },
    mobility: {
      speed: 160,
      turnRate: 3,
      acceleration: 80,
    },
    systems: {
      power: 400,
      radar: 110,
      efficiency: 400,
      crew: 4,
      cargo: 200,
    },
    weapons: [
      {
        id: "mgss-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["mgss"],
        currentWeapon: {
          config: {
            id: "advanced-mgss",
            name: "Advanced mgss",
            category: "mgss",
            tier: 2,
            baseStats: {
              damage: 70,
              range: 1100,
              accuracy: 0.88,
              rateOfFire: 3,
              energyCost: 25,
              cooldown: 3,
              effects: [{ type: "plasma", damage: 40, duration: 5, magnitude: 1.8 }],
            },
            visualAsset: "weapons/mgss/advanced",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 35,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 70,
              range: 1100,
              accuracy: 0.88,
              rateOfFire: 3,
              energyCost: 25,
              cooldown: 3,
              effects: [{ type: "plasma", damage: 40, duration: 5, magnitude: 1.8 }],
            },
            effects: [{ type: "plasma", damage: 40, duration: 5, magnitude: 1.8 }],
          },
        },
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
    maxHealth: 700,
    shield: 450,
    maxShield: 450,
    energy: 400,
    maxEnergy: 400,
    armor: 250,
    speed: 110,
    turnRate: 3,
    cargo: 200,
    category: "war",
    defense: {
      armor: 250,
      shield: 450,
      evasion: 0.3,
      regeneration: 5,
    },
    mobility: {
      speed: 110,
      turnRate: 3,
      acceleration: 55,
    },
    systems: {
      power: 400,
      radar: 95,
      efficiency: 400,
      crew: 4,
      cargo: 200,
    },
    weapons: [
      {
        id: "gauss-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["gaussCannon"],
        currentWeapon: {
          config: {
            id: "heavy-gauss",
            name: "Heavy Gauss Cannon",
            category: "gaussCannon",
            tier: 2,
            baseStats: {
              damage: 100,
              range: 950,
              accuracy: 0.88,
              rateOfFire: 2,
              energyCost: 25,
              cooldown: 2,
              effects: [{ type: "gauss", damage: 25, duration: 3, magnitude: 1.5 }],
            },
            visualAsset: "weapons/gauss/heavy",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 30,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 100,
              range: 950,
              accuracy: 0.88,
              rateOfFire: 2,
              energyCost: 25,
              cooldown: 2,
              effects: [{ type: "gauss", damage: 25, duration: 3, magnitude: 1.5 }],
            },
            effects: [{ type: "gauss", damage: 25, duration: 3, magnitude: 1.5 }],
          },
        },
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
    maxHealth: 600,
    shield: 500,
    maxShield: 500,
    energy: 400,
    maxEnergy: 400,
    armor: 200,
    speed: 135,
    turnRate: 3,
    cargo: 250,
    category: "recon",
    defense: {
      armor: 200,
      shield: 500,
      evasion: 0.35,
      regeneration: 6,
    },
    mobility: {
      speed: 135,
      turnRate: 3,
      acceleration: 70,
    },
    systems: {
      power: 400,
      radar: 100,
      efficiency: 400,
      crew: 4,
      cargo: 250,
    },
    weapons: [
      {
        id: "railgun-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
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
              effects: [],
            },
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 30,
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
              effects: [],
            },
            effects: [],
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
    maxHealth: 800,
    shield: 800,
    maxShield: 800,
    energy: 600,
    maxEnergy: 600,
    armor: 200,
    speed: 150,
    turnRate: 3,
    cargo: 300,
    category: "recon",
    defense: {
      armor: 200,
      shield: 800,
      evasion: 0.4,
      regeneration: 8,
    },
    mobility: {
      speed: 150,
      turnRate: 3,
      acceleration: 75,
    },
    systems: {
      power: 600,
      radar: 100,
      efficiency: 600,
      crew: 6,
      cargo: 300,
    },
    weapons: [
      {
        id: "gauss-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["gaussCannon"],
        currentWeapon: {
          config: {
            id: "heavy-gauss",
            name: "Heavy Gauss Cannon",
            category: "gaussCannon",
            tier: 2,
            baseStats: {
              damage: 150,
              range: 1000,
              accuracy: 0.9,
              rateOfFire: 2,
              energyCost: 25,
              cooldown: 2,
              effects: [{ type: "gauss", damage: 50, duration: 2, magnitude: 1.5 }],
            },
            visualAsset: "weapons/gauss/heavy",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 30,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 150,
              range: 1000,
              accuracy: 0.9,
              rateOfFire: 2,
              energyCost: 25,
              cooldown: 2,
              effects: [{ type: "gauss", damage: 50, duration: 2, magnitude: 1.5 }],
            },
            effects: [{ type: "gauss", damage: 50, duration: 2, magnitude: 1.5 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Phase Shift",
        description: "Temporarily shifts the ship out of phase",
        cooldown: 20,
        duration: 5,
        active: false,
        effect: { type: "stealth", magnitude: 1, duration: 5 },
      },
    ],
  },
  nullsRevenge: {
    health: 1100,
    maxHealth: 1100,
    shield: 900,
    maxShield: 900,
    energy: 700,
    maxEnergy: 700,
    armor: 300,
    speed: 100,
    turnRate: 3,
    cargo: 400,
    category: "war",
    defense: {
      armor: 300,
      shield: 900,
      evasion: 0.3,
      regeneration: 8,
    },
    mobility: {
      speed: 100,
      turnRate: 3,
      acceleration: 50,
    },
    systems: {
      power: 700,
      radar: 100,
      efficiency: 700,
      crew: 8,
      cargo: 400,
    },
    weapons: [
      {
        id: "railgun-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["railGun"],
        currentWeapon: {
          config: {
            id: "advanced-railgun",
            name: "Advanced Railgun",
            category: "railGun",
            tier: 3,
            baseStats: {
              damage: 180,
              range: 1200,
              accuracy: 0.85,
              rateOfFire: 1,
              energyCost: 35,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 60, duration: 3, magnitude: 1.8 }],
            },
            visualAsset: "weapons/railgun/advanced",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 45,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 180,
              range: 1200,
              accuracy: 0.85,
              rateOfFire: 1,
              energyCost: 35,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 60, duration: 3, magnitude: 1.8 }],
            },
            effects: [{ type: "gauss", damage: 60, duration: 3, magnitude: 1.8 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Null Field",
        description: "Creates a protective energy field that doubles shield strength",
        cooldown: 35,
        duration: 8,
        active: false,
        effect: { type: "shield", magnitude: 2, duration: 8 },
      },
    ],
  },
  darkMatterReaper: {
    health: 900,
    maxHealth: 900,
    shield: 700,
    maxShield: 700,
    energy: 600,
    maxEnergy: 600,
    armor: 250,
    speed: 120,
    turnRate: 3,
    cargo: 300,
    category: "war",
    defense: {
      armor: 250,
      shield: 700,
      evasion: 0.35,
      regeneration: 7,
    },
    mobility: {
      speed: 120,
      turnRate: 3,
      acceleration: 60,
    },
    systems: {
      power: 600,
      radar: 100,
      efficiency: 600,
      crew: 6,
      cargo: 300,
    },
    weapons: [
      {
        id: "mgss-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["mgss"],
        currentWeapon: {
          config: {
            id: "advanced-mgss",
            name: "Advanced MGSS",
            category: "mgss",
            tier: 2,
            baseStats: {
              damage: 60,
              range: 900,
              accuracy: 0.8,
              rateOfFire: 4,
              energyCost: 15,
              cooldown: 3,
              effects: [{ type: "plasma", damage: 30, duration: 4, magnitude: 1.5 }],
            },
            visualAsset: "weapons/mgss/advanced",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 25,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 60,
              range: 900,
              accuracy: 0.8,
              rateOfFire: 4,
              energyCost: 15,
              cooldown: 3,
              effects: [{ type: "plasma", damage: 30, duration: 4, magnitude: 1.5 }],
            },
            effects: [{ type: "plasma", damage: 30, duration: 4, magnitude: 1.5 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Dark Matter Burst",
        description: "Releases a burst of dark matter energy",
        cooldown: 30,
        duration: 6,
        active: false,
        effect: { type: "damage", magnitude: 1.8, radius: 250, duration: 6 },
      },
    ],
  },
  quantumPariah: {
    health: 600,
    maxHealth: 600,
    shield: 600,
    maxShield: 600,
    energy: 500,
    maxEnergy: 500,
    armor: 150,
    speed: 170,
    turnRate: 3,
    cargo: 250,
    category: "recon",
    defense: {
      armor: 150,
      shield: 600,
      evasion: 0.45,
      regeneration: 6,
    },
    mobility: {
      speed: 170,
      turnRate: 3,
      acceleration: 85,
    },
    systems: {
      power: 500,
      radar: 100,
      efficiency: 500,
      crew: 5,
      cargo: 250,
    },
    weapons: [
      {
        id: "gauss-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["gaussCannon"],
        currentWeapon: {
          config: {
            id: "advanced-gauss",
            name: "Advanced Gauss Cannon",
            category: "gaussCannon",
            tier: 2,
            baseStats: {
              damage: 100,
              range: 800,
              accuracy: 0.95,
              rateOfFire: 2,
              energyCost: 20,
              cooldown: 2,
              effects: [{ type: "gauss", damage: 40, duration: 2, magnitude: 1.5 }],
            },
            visualAsset: "weapons/gauss/advanced",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 25,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 100,
              range: 800,
              accuracy: 0.95,
              rateOfFire: 2,
              energyCost: 20,
              cooldown: 2,
              effects: [{ type: "gauss", damage: 40, duration: 2, magnitude: 1.5 }],
            },
            effects: [{ type: "gauss", damage: 40, duration: 2, magnitude: 1.5 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Quantum Cloak",
        description: "Activates quantum stealth technology",
        cooldown: 25,
        duration: 7,
        active: false,
        effect: { type: "stealth", magnitude: 1, duration: 7 },
      },
    ],
  },
  entropyScale: {
    health: 850,
    maxHealth: 850,
    shield: 850,
    maxShield: 850,
    energy: 650,
    maxEnergy: 650,
    armor: 280,
    speed: 110,
    turnRate: 3,
    cargo: 350,
    category: "war",
    defense: {
      armor: 280,
      shield: 850,
      evasion: 0.3,
      regeneration: 8,
    },
    mobility: {
      speed: 110,
      turnRate: 3,
      acceleration: 55,
    },
    systems: {
      power: 650,
      radar: 100,
      efficiency: 650,
      crew: 7,
      cargo: 350,
    },
    weapons: [
      {
        id: "railgun-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["railGun"],
        currentWeapon: {
          config: {
            id: "advanced-railgun",
            name: "Advanced Railgun",
            category: "railGun",
            tier: 2,
            baseStats: {
              damage: 160,
              range: 1100,
              accuracy: 0.88,
              rateOfFire: 1,
              energyCost: 30,
              cooldown: 2,
              effects: [{ type: "gauss", damage: 45, duration: 3, magnitude: 1.6 }],
            },
            visualAsset: "weapons/railgun/advanced",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 35,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 160,
              range: 1100,
              accuracy: 0.88,
              rateOfFire: 1,
              energyCost: 30,
              cooldown: 2,
              effects: [{ type: "gauss", damage: 45, duration: 3, magnitude: 1.6 }],
            },
            effects: [{ type: "gauss", damage: 45, duration: 3, magnitude: 1.6 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Entropy Field",
        description: "Creates a field of entropic energy",
        cooldown: 28,
        duration: 9,
        active: false,
        effect: { type: "speed", magnitude: 0.6, radius: 300, duration: 9 },
      },
    ],
  },
  voidRevenant: {
    health: 750,
    maxHealth: 750,
    shield: 750,
    maxShield: 750,
    energy: 550,
    maxEnergy: 550,
    armor: 200,
    speed: 140,
    turnRate: 3,
    cargo: 280,
    category: "recon",
    defense: {
      armor: 200,
      shield: 750,
      evasion: 0.4,
      regeneration: 7,
    },
    mobility: {
      speed: 140,
      turnRate: 3,
      acceleration: 70,
    },
    systems: {
      power: 550,
      radar: 100,
      efficiency: 550,
      crew: 5,
      cargo: 280,
    },
    weapons: [
      {
        id: "mgss-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["mgss"],
        currentWeapon: {
          config: {
            id: "advanced-mgss",
            name: "Advanced MGSS",
            category: "mgss",
            tier: 2,
            baseStats: {
              damage: 45,
              range: 850,
              accuracy: 0.85,
              rateOfFire: 5,
              energyCost: 12,
              cooldown: 2,
              effects: [{ type: "plasma", damage: 25, duration: 3, magnitude: 1.4 }],
            },
            visualAsset: "weapons/mgss/advanced",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 20,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 45,
              range: 850,
              accuracy: 0.85,
              rateOfFire: 5,
              energyCost: 12,
              cooldown: 2,
              effects: [{ type: "plasma", damage: 25, duration: 3, magnitude: 1.4 }],
            },
            effects: [{ type: "plasma", damage: 25, duration: 3, magnitude: 1.4 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Void Jump",
        description: "Performs a short-range void teleport",
        cooldown: 22,
        duration: 4,
        active: false,
        effect: { type: "stealth", magnitude: 0.9, duration: 7 },
      },
    ],
  },
  scytheOfAndromeda: {
    health: 1000,
    maxHealth: 1000,
    shield: 1000,
    maxShield: 1000,
    energy: 800,
    maxEnergy: 800,
    armor: 350,
    speed: 130,
    turnRate: 3,
    cargo: 400,
    category: "war",
    defense: {
      armor: 350,
      shield: 1000,
      evasion: 0.35,
      regeneration: 8,
    },
    mobility: {
      speed: 130,
      turnRate: 3,
      acceleration: 65,
    },
    systems: {
      power: 800,
      radar: 100,
      efficiency: 800,
      crew: 8,
      cargo: 400,
    },
    weapons: [
      {
        id: "railgun-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["railGun"],
        currentWeapon: {
          config: {
            id: "advanced-railgun",
            name: "Advanced Railgun",
            category: "railGun",
            tier: 3,
            baseStats: {
              damage: 200,
              range: 1300,
              accuracy: 0.92,
              rateOfFire: 1,
              energyCost: 40,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 70, duration: 4, magnitude: 1.8 }],
            },
            visualAsset: "weapons/railgun/advanced",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 50,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 200,
              range: 1300,
              accuracy: 0.92,
              rateOfFire: 1,
              energyCost: 40,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 70, duration: 4, magnitude: 1.8 }],
            },
            effects: [{ type: "gauss", damage: 70, duration: 4, magnitude: 1.8 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Star Tear",
        description: "Unleashes a devastating stellar energy burst",
        cooldown: 45,
        duration: 10,
        active: false,
        effect: { type: "damage", magnitude: 2.2, radius: 400, duration: 10 },
      },
    ],
  },
  nebulaPersistence: {
    health: 950,
    maxHealth: 950,
    shield: 950,
    maxShield: 950,
    energy: 650,
    maxEnergy: 650,
    armor: 300,
    speed: 90,
    turnRate: 3,
    cargo: 350,
    category: "war",
    defense: {
      armor: 300,
      shield: 950,
      evasion: 0.3,
      regeneration: 7,
    },
    mobility: {
      speed: 90,
      turnRate: 3,
      acceleration: 45,
    },
    systems: {
      power: 650,
      radar: 100,
      efficiency: 650,
      crew: 7,
      cargo: 350,
    },
    weapons: [
      {
        id: "rocket-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["rockets"],
        currentWeapon: {
          config: {
            id: "heavy-rocket",
            name: "Heavy Rocket",
            category: "rockets",
            tier: 2,
            baseStats: {
              damage: 180,
              range: 1000,
              accuracy: 0.8,
              rateOfFire: 1,
              energyCost: 30,
              cooldown: 2,
              effects: [{ type: "explosive", damage: 90, duration: 2, radius: 60, magnitude: 1.5 }],
            },
            visualAsset: "weapons/rockets/heavy",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 40,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 180,
              range: 1000,
              accuracy: 0.8,
              rateOfFire: 1,
              energyCost: 30,
              cooldown: 2,
              effects: [{ type: "explosive", damage: 90, duration: 2, radius: 60, magnitude: 1.5 }],
            },
            effects: [{ type: "explosive", damage: 90, duration: 2, radius: 60, magnitude: 1.5 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Nebula Shield",
        description: "Generates a protective nebulous barrier",
        cooldown: 32,
        duration: 12,
        active: false,
        effect: { type: "shield", magnitude: 1.8, duration: 12 },
      },
    ],
  },
  oblivionsWake: {
    health: 800,
    maxHealth: 800,
    shield: 800,
    maxShield: 800,
    energy: 600,
    maxEnergy: 600,
    armor: 250,
    speed: 160,
    turnRate: 3,
    cargo: 300,
    category: "recon",
    defense: {
      armor: 250,
      shield: 800,
      evasion: 0.35,
      regeneration: 7,
    },
    mobility: {
      speed: 160,
      turnRate: 3,
      acceleration: 80,
    },
    systems: {
      power: 600,
      radar: 100,
      efficiency: 600,
      crew: 6,
      cargo: 300,
    },
    weapons: [
      {
        id: "gauss-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["gaussCannon"],
        currentWeapon: {
          config: {
            id: "heavy-gauss",
            name: "Heavy Gauss Cannon",
            category: "gaussCannon",
            tier: 2,
            baseStats: {
              damage: 140,
              range: 950,
              accuracy: 0.9,
              rateOfFire: 2,
              energyCost: 25,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 55, duration: 3, magnitude: 1.5 }],
            },
            visualAsset: "weapons/gauss/heavy",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 30,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 140,
              range: 950,
              accuracy: 0.9,
              rateOfFire: 2,
              energyCost: 25,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 55, duration: 3, magnitude: 1.5 }],
            },
            effects: [{ type: "gauss", damage: 55, duration: 3, magnitude: 1.5 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Wake of Destruction",
        description: "Leaves a trail of destructive energy",
        cooldown: 38,
        duration: 8,
        active: false,
        effect: { type: "damage", magnitude: 1.6, radius: 200, duration: 8 },
      },
    ],
  },
  forbiddenVanguard: {
    health: 1200,
    maxHealth: 1200,
    shield: 1200,
    maxShield: 1200,
    energy: 700,
    maxEnergy: 700,
    armor: 400,
    speed: 120,
    turnRate: 3,
    cargo: 350,
    category: "war",
    defense: {
      armor: 400,
      shield: 1200,
      evasion: 0.3,
      regeneration: 8,
    },
    mobility: {
      speed: 120,
      turnRate: 3,
      acceleration: 60,
    },
    systems: {
      power: 700,
      radar: 100,
      efficiency: 700,
      crew: 8,
      cargo: 350,
    },
    weapons: [
      {
        id: "mgss-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["mgss"],
        currentWeapon: {
          config: {
            id: "advanced-mgss",
            name: "Advanced MGSS",
            category: "mgss",
            tier: 3,
            baseStats: {
              damage: 80,
              range: 1200,
              accuracy: 0.9,
              rateOfFire: 3,
              energyCost: 30,
              cooldown: 3,
              effects: [{ type: "plasma", damage: 50, duration: 4, magnitude: 1.8 }],
            },
            visualAsset: "weapons/mgss/advanced",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 45,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 80,
              range: 1200,
              accuracy: 0.9,
              rateOfFire: 3,
              energyCost: 30,
              cooldown: 3,
              effects: [{ type: "plasma", damage: 50, duration: 4, magnitude: 1.8 }],
            },
            effects: [{ type: "plasma", damage: 50, duration: 4, magnitude: 1.8 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Forbidden Technology",
        description: "Activates forbidden weapon systems",
        cooldown: 50,
        duration: 15,
        active: false,
        effect: { type: "damage", magnitude: 2.5, radius: 500, duration: 15 },
      },
    ],
  },

  // Equator Horizon Ships
  celestialArbiter: {
    health: 1500,
    maxHealth: 1500,
    shield: 1000,
    maxShield: 1000,
    energy: 900,
    maxEnergy: 900,
    armor: 500,
    speed: 80,
    turnRate: 3,
    cargo: 400,
    category: "war",
    defense: {
      armor: 500,
      shield: 1000,
      evasion: 0.25,
      regeneration: 10,
    },
    mobility: {
      speed: 80,
      turnRate: 3,
      acceleration: 40,
    },
    systems: {
      power: 900,
      radar: 100,
      efficiency: 900,
      crew: 10,
      cargo: 400,
    },
    weapons: [
      {
        id: "railgun-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["railGun"],
        currentWeapon: {
          config: {
            id: "advanced-railgun",
            name: "Advanced Railgun",
            category: "railGun",
            tier: 3,
            baseStats: {
              damage: 300,
              range: 1500,
              accuracy: 0.95,
              rateOfFire: 1,
              energyCost: 45,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 100, duration: 3, magnitude: 2.0 }],
            },
            visualAsset: "weapons/railgun/advanced",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 60,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 300,
              range: 1500,
              accuracy: 0.95,
              rateOfFire: 1,
              energyCost: 45,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 100, duration: 3, magnitude: 2.0 }],
            },
            effects: [{ type: "gauss", damage: 100, duration: 3, magnitude: 2.0 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Balance Restoration",
        description: "Restores balance to nearby space",
        cooldown: 45,
        duration: 15,
        active: false,
        effect: { type: "shield", magnitude: 2, radius: 500, duration: 15 },
      },
    ],
  },
  etherealGalleon: {
    health: 1300,
    maxHealth: 1300,
    shield: 1200,
    maxShield: 1200,
    energy: 700,
    maxEnergy: 700,
    armor: 400,
    speed: 100,
    turnRate: 3,
    cargo: 350,
    category: "war",
    defense: {
      armor: 400,
      shield: 1200,
      evasion: 0.3,
      regeneration: 8,
    },
    mobility: {
      speed: 100,
      turnRate: 3,
      acceleration: 50,
    },
    systems: {
      power: 700,
      radar: 100,
      efficiency: 700,
      crew: 8,
      cargo: 350,
    },
    weapons: [
      {
        id: "mgss-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["mgss"],
        currentWeapon: {
          config: {
            id: "advanced-mgss",
            name: "Advanced MGSS",
            category: "mgss",
            tier: 3,
            baseStats: {
              damage: 80,
              range: 1200,
              accuracy: 0.9,
              rateOfFire: 3,
              energyCost: 30,
              cooldown: 3,
              effects: [{ type: "plasma", damage: 50, duration: 4, magnitude: 1.8 }],
            },
            visualAsset: "weapons/mgss/advanced",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 45,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 80,
              range: 1200,
              accuracy: 0.9,
              rateOfFire: 3,
              energyCost: 30,
              cooldown: 3,
              effects: [{ type: "plasma", damage: 50, duration: 4, magnitude: 1.8 }],
            },
            effects: [{ type: "plasma", damage: 50, duration: 4, magnitude: 1.8 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Ancient Energy",
        description: "Channels ancient energy weapons",
        cooldown: 40,
        duration: 12,
        active: false,
        effect: { type: "damage", magnitude: 2.2, duration: 12 },
      },
    ],
  },
  stellarEquinox: {
    health: 1100,
    maxHealth: 1100,
    shield: 900,
    maxShield: 900,
    energy: 650,
    maxEnergy: 650,
    armor: 350,
    speed: 120,
    turnRate: 3,
    cargo: 300,
    category: "war",
    defense: {
      armor: 350,
      shield: 900,
      evasion: 0.35,
      regeneration: 7,
    },
    mobility: {
      speed: 120,
      turnRate: 3,
      acceleration: 60,
    },
    systems: {
      power: 650,
      radar: 100,
      efficiency: 650,
      crew: 6,
      cargo: 300,
    },
    weapons: [
      {
        id: "gauss-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["gaussCannon"],
        currentWeapon: {
          config: {
            id: "advanced-gauss",
            name: "Advanced Gauss Cannon",
            category: "gaussCannon",
            tier: 3,
            baseStats: {
              damage: 220,
              range: 1400,
              accuracy: 0.94,
              rateOfFire: 2,
              energyCost: 35,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 85, duration: 3, magnitude: 1.9 }],
            },
            visualAsset: "weapons/gauss/advanced",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 50,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 220,
              range: 1400,
              accuracy: 0.94,
              rateOfFire: 2,
              energyCost: 35,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 85, duration: 3, magnitude: 1.9 }],
            },
            effects: [{ type: "gauss", damage: 85, duration: 3, magnitude: 1.9 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Perfect Harmony",
        description: "Creates a harmonious shield field",
        cooldown: 35,
        duration: 10,
        active: false,
        effect: { type: "shield", magnitude: 1.8, radius: 400, duration: 10 },
      },
    ],
  },
  chronosSentinel: {
    health: 900,
    maxHealth: 900,
    shield: 1100,
    maxShield: 1100,
    energy: 600,
    maxEnergy: 600,
    armor: 300,
    speed: 140,
    turnRate: 3,
    cargo: 300,
    category: "recon",
    defense: {
      armor: 300,
      shield: 1100,
      evasion: 0.4,
      regeneration: 7,
    },
    mobility: {
      speed: 140,
      turnRate: 3,
      acceleration: 70,
    },
    systems: {
      power: 600,
      radar: 100,
      efficiency: 600,
      crew: 6,
      cargo: 300,
    },
    weapons: [
      {
        id: "railgun-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["railGun"],
        currentWeapon: {
          config: {
            id: "advanced-railgun",
            name: "Advanced Railgun",
            category: "railGun",
            tier: 3,
            baseStats: {
              damage: 250,
              range: 1400,
              accuracy: 0.92,
              rateOfFire: 1,
              energyCost: 40,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 90, duration: 2, magnitude: 1.9 }],
            },
            visualAsset: "weapons/railgun/advanced",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 50,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 250,
              range: 1400,
              accuracy: 0.92,
              rateOfFire: 1,
              energyCost: 40,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 90, duration: 2, magnitude: 1.9 }],
            },
            effects: [{ type: "gauss", damage: 90, duration: 2, magnitude: 1.9 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Time Dilation",
        description: "Manipulates local time flow",
        cooldown: 30,
        duration: 8,
        active: false,
        effect: { type: "speed", magnitude: 0.5, radius: 300, duration: 8 },
      },
    ],
  },
  nebulasJudgement: {
    health: 1000,
    maxHealth: 1000,
    shield: 800,
    maxShield: 800,
    energy: 600,
    maxEnergy: 600,
    armor: 400,
    speed: 160,
    turnRate: 3,
    cargo: 300,
    category: "war",
    defense: {
      armor: 400,
      shield: 800,
      evasion: 0.4,
      regeneration: 7,
    },
    mobility: {
      speed: 160,
      turnRate: 3,
      acceleration: 80,
    },
    systems: {
      power: 600,
      radar: 100,
      efficiency: 600,
      crew: 6,
      cargo: 300,
    },
    weapons: [
      {
        id: "mgss-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["mgss"],
        currentWeapon: {
          config: {
            id: "advanced-mgss",
            name: "Advanced MGSS",
            category: "mgss",
            tier: 3,
            baseStats: {
              damage: 150,
              range: 1100,
              accuracy: 0.9,
              rateOfFire: 3,
              energyCost: 30,
              cooldown: 3,
              effects: [{ type: "plasma", damage: 60, duration: 3, magnitude: 1.8 }],
            },
            visualAsset: "weapons/mgss/advanced",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 45,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 150,
              range: 1100,
              accuracy: 0.9,
              rateOfFire: 3,
              energyCost: 30,
              cooldown: 3,
              effects: [{ type: "plasma", damage: 60, duration: 3, magnitude: 1.8 }],
            },
            effects: [{ type: "plasma", damage: 60, duration: 3, magnitude: 1.8 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Swift Justice",
        description: "Delivers rapid weapon strikes",
        cooldown: 25,
        duration: 6,
        active: false,
        effect: { type: "damage", magnitude: 2, duration: 6 },
      },
    ],
  },
  aetherialHorizon: {
    health: 1400,
    maxHealth: 1400,
    shield: 1300,
    maxShield: 1300,
    energy: 800,
    maxEnergy: 800,
    armor: 450,
    speed: 110,
    turnRate: 3,
    cargo: 400,
    category: "war",
    defense: {
      armor: 450,
      shield: 1300,
      evasion: 0.3,
      regeneration: 9,
    },
    mobility: {
      speed: 110,
      turnRate: 3,
      acceleration: 55,
    },
    systems: {
      power: 800,
      radar: 100,
      efficiency: 800,
      crew: 8,
      cargo: 400,
    },
    weapons: [
      {
        id: "rocket-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["rockets"],
        currentWeapon: {
          config: {
            id: "heavy-rocket",
            name: "Heavy Rocket",
            category: "rockets",
            tier: 3,
            baseStats: {
              damage: 280,
              range: 1600,
              accuracy: 0.85,
              rateOfFire: 1,
              energyCost: 40,
              cooldown: 4,
              effects: [{ type: "explosive", damage: 140, duration: 2, radius: 80, magnitude: 2.0 }],
            },
            visualAsset: "weapons/rockets/heavy",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 55,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 280,
              range: 1600,
              accuracy: 0.85,
              rateOfFire: 1,
              energyCost: 40,
              cooldown: 4,
              effects: [{ type: "explosive", damage: 140, duration: 2, radius: 80, magnitude: 2.0 }],
            },
            effects: [{ type: "explosive", damage: 140, duration: 2, radius: 80, magnitude: 2.0 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "First Contact",
        description: "Initiates powerful defensive protocols",
        cooldown: 55,
        duration: 18,
        active: false,
        effect: { type: "shield", magnitude: 2.5, radius: 600, duration: 18 },
      },
    ],
  },
  cosmicCrusader: {
    health: 1200,
    maxHealth: 1200,
    shield: 1000,
    maxShield: 1000,
    energy: 700,
    maxEnergy: 700,
    armor: 380,
    speed: 130,
    turnRate: 3,
    cargo: 350,
    category: "war",
    defense: {
      armor: 380,
      shield: 1000,
      evasion: 0.35,
      regeneration: 8,
    },
    mobility: {
      speed: 130,
      turnRate: 3,
      acceleration: 65,
    },
    systems: {
      power: 700,
      radar: 100,
      efficiency: 700,
      crew: 7,
      cargo: 350,
    },
    weapons: [
      {
        id: "gauss-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["gaussCannon"],
        currentWeapon: {
          config: {
            id: "advanced-gauss",
            name: "Advanced Gauss Cannon",
            category: "gaussCannon",
            tier: 3,
            baseStats: {
              damage: 220,
              range: 1400,
              accuracy: 0.94,
              rateOfFire: 2,
              energyCost: 35,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 85, duration: 3, magnitude: 1.9 }],
            },
            visualAsset: "weapons/gauss/advanced",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 50,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 220,
              range: 1400,
              accuracy: 0.94,
              rateOfFire: 2,
              energyCost: 35,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 85, duration: 3, magnitude: 1.9 }],
            },
            effects: [{ type: "gauss", damage: 85, duration: 3, magnitude: 1.9 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Threat Neutralization",
        description: "Neutralizes nearby threats",
        cooldown: 42,
        duration: 12,
        active: false,
        effect: { type: "damage", magnitude: 2.3, radius: 450, duration: 12 },
      },
    ],
  },
  balancekeepersWrath: {
    health: 1600,
    maxHealth: 1600,
    shield: 1400,
    maxShield: 1400,
    energy: 1000,
    maxEnergy: 1000,
    armor: 600,
    speed: 70,
    turnRate: 3,
    cargo: 500,
    category: "war",
    defense: {
      armor: 600,
      shield: 1400,
      evasion: 0.2,
      regeneration: 12,
    },
    mobility: {
      speed: 70,
      turnRate: 3,
      acceleration: 35,
    },
    systems: {
      power: 1000,
      radar: 120,
      efficiency: 1000,
      crew: 12,
      cargo: 500,
    },
    weapons: [
      {
        id: "railgun-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["railGun"],
        currentWeapon: {
          config: {
            id: "advanced-railgun",
            name: "Advanced Railgun",
            category: "railGun",
            tier: 3,
            baseStats: {
              damage: 350,
              range: 1800,
              accuracy: 0.96,
              rateOfFire: 1,
              energyCost: 50,
              cooldown: 4,
              effects: [{ type: "gauss", damage: 120, duration: 4, magnitude: 2.2 }],
            },
            visualAsset: "weapons/railgun/advanced",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 70,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 350,
              range: 1800,
              accuracy: 0.96,
              rateOfFire: 1,
              energyCost: 50,
              cooldown: 4,
              effects: [{ type: "gauss", damage: 120, duration: 4, magnitude: 2.2 }],
            },
            effects: [{ type: "gauss", damage: 120, duration: 4, magnitude: 2.2 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Wrath of Balance",
        description: "Unleashes the ultimate balancing force",
        cooldown: 60,
        duration: 20,
        active: false,
        effect: { type: "damage", magnitude: 3, radius: 700, duration: 20 },
      },
    ],
  },
  eclipticWatcher: {
    health: 800,
    maxHealth: 800,
    shield: 1000,
    maxShield: 1000,
    energy: 500,
    maxEnergy: 500,
    armor: 250,
    speed: 180,
    turnRate: 3,
    cargo: 250,
    category: "recon",
    defense: {
      armor: 250,
      shield: 1000,
      evasion: 0.45,
      regeneration: 6,
    },
    mobility: {
      speed: 180,
      turnRate: 3,
      acceleration: 90,
    },
    systems: {
      power: 500,
      radar: 100,
      efficiency: 500,
      crew: 5,
      cargo: 250,
    },
    weapons: [
      {
        id: "mgss-mount-1",
        size: "medium" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["mgss"],
        currentWeapon: {
          config: {
            id: "advanced-mgss",
            name: "Advanced MGSS",
            category: "mgss",
            tier: 2,
            baseStats: {
              damage: 100,
              range: 1000,
              accuracy: 0.92,
              rateOfFire: 4,
              energyCost: 20,
              cooldown: 3,
              effects: [{ type: "plasma", damage: 45, duration: 2, magnitude: 1.6 }],
            },
            visualAsset: "weapons/mgss/advanced",
            mountRequirements: {
              size: "medium" as WeaponMountSize,
              power: 30,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 100,
              range: 1000,
              accuracy: 0.92,
              rateOfFire: 4,
              energyCost: 20,
              cooldown: 3,
              effects: [{ type: "plasma", damage: 45, duration: 2, magnitude: 1.6 }],
            },
            effects: [{ type: "plasma", damage: 45, duration: 2, magnitude: 1.6 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Perfect Stealth",
        description: "Achieves perfect stealth capability",
        cooldown: 38,
        duration: 10,
        active: false,
        effect: { type: "stealth", magnitude: 1, duration: 10 },
      },
    ],
  },
  harmonysVanguard: {
    health: 1300,
    maxHealth: 1300,
    shield: 1100,
    maxShield: 1100,
    energy: 750,
    maxEnergy: 750,
    armor: 420,
    speed: 140,
    turnRate: 3,
    cargo: 350,
    category: "war",
    defense: {
      armor: 420,
      shield: 1100,
      evasion: 0.35,
      regeneration: 9,
    },
    mobility: {
      speed: 140,
      turnRate: 3,
      acceleration: 70,
    },
    systems: {
      power: 750,
      radar: 100,
      efficiency: 750,
      crew: 8,
      cargo: 350,
    },
    weapons: [
      {
        id: "gauss-mount-1",
        size: "large" as WeaponMountSize,
        position: WEAPON_POSITIONS.FRONT,
        rotation: 0,
        allowedCategories: ["gaussCannon"],
        currentWeapon: {
          config: {
            id: "advanced-gauss",
            name: "Advanced Gauss Cannon",
            category: "gaussCannon",
            tier: 3,
            baseStats: {
              damage: 240,
              range: 1500,
              accuracy: 0.93,
              rateOfFire: 2,
              energyCost: 35,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 95, duration: 3, magnitude: 2.0 }],
            },
            visualAsset: "weapons/gauss/advanced",
            mountRequirements: {
              size: "large" as WeaponMountSize,
              power: 55,
            },
          },
          state: {
            status: "ready",
            currentStats: {
              damage: 240,
              range: 1500,
              accuracy: 0.93,
              rateOfFire: 2,
              energyCost: 35,
              cooldown: 3,
              effects: [{ type: "gauss", damage: 95, duration: 3, magnitude: 2.0 }],
            },
            effects: [{ type: "gauss", damage: 95, duration: 3, magnitude: 2.0 }],
          },
        },
      },
    ],
    abilities: [
      {
        name: "Order from Chaos",
        description: "Brings order to chaotic space",
        cooldown: 48,
        duration: 15,
        active: false,
        effect: { type: "shield", magnitude: 2.2, radius: 550, duration: 15 },
      },
    ],
  },
} as const;

// Add missing type
type SpaceRatsShipClass = keyof typeof SHIP_STATS;

// Add missing interface
interface ShipDisplayStats {
  weapons: {
    damage: number;
    range: number;
    accuracy: number;
  };
  defense: {
    hull: number;
    shield: number;
    armor: number;
  };
  mobility: {
    speed: number;
    agility: number;
    jumpRange: number;
  };
  systems: {
    power: number;
    radar: number;
    efficiency: number;
  };
}

// Helper function to get ship stats with type safety
export function getShipStats(shipClass: SpaceRatsShipClass): ShipStats {
  const stats = SHIP_STATS[shipClass];
  if (!stats) {
    throw new Error(`No stats found for ship class: ${shipClass}`);
  }
  // Add missing properties
  return {
    ...stats,
    systems: {
      ...stats.systems,
      radar: Math.round(
        stats.weapons.reduce(
          (sum, mount) =>
            sum + (mount.currentWeapon?.state.currentStats.range || 0),
          0,
        ) / 100
      ),
      efficiency: stats.systems.power,
    },
  };
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
        )
      ),
      accuracy: stats.weapons.reduce(
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
        ) / 100
      ),
      efficiency: stats.systems.power,
    },
  };
}





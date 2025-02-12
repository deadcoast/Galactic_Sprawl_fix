import {
  ShipClass,
  ShipDisplayStats,
  ShipStats,
} from "../../types/ships/CommonShipTypes";

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
  cooldown: number;
  duration: number;
  effect: {
    type: "stealth" | "shield" | "speed" | "damage";
    magnitude: number;
    radius?: number;
  };
}

export interface ShipStats {
  health: number;
  shield: number;
  armor: number;
  speed: number;
  turnRate: number;
  weapons: ShipWeaponStats[];
  defense: ShipDefenseStats;
  mobility: ShipMobilityStats;
  systems: ShipSystemStats;
  abilities: ShipAbility[];
}

export const SHIP_STATS: Record<ShipClass, ShipStats> = {
  // Space Rats Ships
  "rat-king": {
    health: 1000,
    shield: 500,
    armor: 300,
    speed: 100,
    turnRate: 2,
    weapons: [
      {
        type: "MGSS",
        damage: 50,
        range: 800,
        cooldown: 0.1,
        accuracy: 0.7,
        effects: [{ type: "plasma", damage: 10, duration: 3 }],
      },
      {
        type: "rockets",
        damage: 200,
        range: 1200,
        cooldown: 5,
        accuracy: 0.8,
        effects: [{ type: "explosive", damage: 100, duration: 1, radius: 50 }],
      },
    ],
    abilities: [
      {
        name: "Pirate's Fury",
        cooldown: 30,
        duration: 10,
        effect: { type: "damage", magnitude: 2 },
      },
    ],
  },
  "asteroid-marauder": {
    health: 600,
    shield: 300,
    armor: 200,
    speed: 120,
    turnRate: 3,
    weapons: [
      {
        type: "machineGun",
        damage: 30,
        range: 600,
        cooldown: 2,
        accuracy: 0.8,
        effects: [],
      },
    ],
    abilities: [
      {
        name: "Scavenger Boost",
        cooldown: 15,
        duration: 5,
        effect: { type: "speed", magnitude: 1.5 },
      },
    ],
  },
  "rogue-nebula": {
    health: 500,
    shield: 400,
    armor: 150,
    speed: 150,
    turnRate: 3.5,
    weapons: [
      {
        type: "railGun",
        damage: 120,
        range: 900,
        cooldown: 3,
        accuracy: 0.85,
        effects: [{ type: "gauss", damage: 30, duration: 2 }],
      },
    ],
    abilities: [
      {
        name: "Stealth Drive",
        cooldown: 25,
        duration: 8,
        effect: { type: "stealth", magnitude: 1 },
      },
    ],
  },
  "rats-revenge": {
    health: 800,
    shield: 400,
    armor: 250,
    speed: 130,
    turnRate: 3,
    weapons: [
      {
        type: "MGSS",
        damage: 40,
        range: 700,
        cooldown: 2,
        accuracy: 0.75,
        effects: [{ type: "plasma", damage: 15, duration: 2 }],
      },
    ],
    abilities: [
      {
        name: "Vengeful Strike",
        cooldown: 20,
        duration: 5,
        effect: { type: "damage", magnitude: 1.5 },
      },
    ],
  },
  "dark-sector-corsair": {
    health: 550,
    shield: 350,
    armor: 180,
    speed: 140,
    turnRate: 3,
    weapons: [
      {
        type: "gaussCannon",
        damage: 90,
        range: 850,
        cooldown: 2,
        accuracy: 0.9,
        effects: [{ type: "gauss", damage: 20, duration: 3 }],
      },
    ],
    abilities: [
      {
        name: "Shadow Strike",
        cooldown: 18,
        duration: 4,
        effect: { type: "stealth", magnitude: 0.8 },
      },
    ],
  },
  "wailing-wreck": {
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
        name: "Sonic Disruption",
        cooldown: 35,
        duration: 8,
        effect: { type: "speed", magnitude: 0.5 },
      },
    ],
  },
  "galactic-scourge": {
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
        cooldown: 40,
        duration: 12,
        effect: { type: "damage", magnitude: 1.8, radius: 300 },
      },
    ],
  },
  "plasma-fang": {
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
        cooldown: 22,
        duration: 6,
        effect: { type: "damage", magnitude: 1.6 },
      },
    ],
  },
  "vermin-vanguard": {
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
        cooldown: 28,
        duration: 10,
        effect: { type: "speed", magnitude: 1.3, radius: 200 },
      },
    ],
  },
  "black-void-buccaneer": {
    health: 600,
    shield: 500,
    armor: 200,
    speed: 135,
    turnRate: 3,
    weapons: [
      {
        type: "railGun",
        damage: 140,
        range: 1000,
        cooldown: 3,
        accuracy: 0.9,
        effects: [{ type: "gauss", damage: 35, duration: 2 }],
      },
    ],
    abilities: [
      {
        name: "Void Cloak",
        cooldown: 32,
        duration: 7,
        effect: { type: "stealth", magnitude: 0.9 },
      },
    ],
  },

  // Lost Nova Ships
  "eclipse-scythe": {
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
        effect: { type: "stealth", magnitude: 1 },
      },
    ],
  },
  "nulls-revenge": {
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
        cooldown: 35,
        duration: 8,
        effect: { type: "shield", magnitude: 2 },
      },
    ],
  },
  "dark-matter-reaper": {
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
        effect: { type: "damage", magnitude: 1.8, radius: 250 },
      },
    ],
  },
  "quantum-pariah": {
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
        effect: { type: "stealth", magnitude: 1 },
      },
    ],
  },
  "entropy-scale": {
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
        effect: { type: "speed", magnitude: 0.6, radius: 300 },
      },
    ],
  },
  "void-revenant": {
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
        effect: { type: "stealth", magnitude: 0.9 },
      },
    ],
  },
  "scythe-of-andromeda": {
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
        effect: { type: "damage", magnitude: 2.2, radius: 400 },
      },
    ],
  },
  "nebular-persistence": {
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
        effect: { type: "shield", magnitude: 1.8 },
      },
    ],
  },
  "oblivions-wake": {
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
        effect: { type: "damage", magnitude: 1.6, radius: 200 },
      },
    ],
  },
  "forbidden-vanguard": {
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
        effect: { type: "damage", magnitude: 2.5, radius: 500 },
      },
    ],
  },

  // Equator Horizon Ships
  "celestial-arbiter": {
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
        effect: { type: "shield", magnitude: 2, radius: 500 },
      },
    ],
  },
  "ethereal-galleon": {
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
        effect: { type: "damage", magnitude: 2.2 },
      },
    ],
  },
  "stellar-equinox": {
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
        effect: { type: "shield", magnitude: 1.8, radius: 400 },
      },
    ],
  },
  "chronos-sentinel": {
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
        effect: { type: "speed", magnitude: 0.5, radius: 300 },
      },
    ],
  },
  "nebulas-judgement": {
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
        effect: { type: "damage", magnitude: 2 },
      },
    ],
  },
  "aetherial-horizon": {
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
        effect: { type: "shield", magnitude: 2.5, radius: 600 },
      },
    ],
  },
  "cosmic-crusader": {
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
        effect: { type: "damage", magnitude: 2.3, radius: 450 },
      },
    ],
  },
  "balancekeepers-wrath": {
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
        effect: { type: "damage", magnitude: 3, radius: 700 },
      },
    ],
  },
  "ecliptic-watcher": {
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
        effect: { type: "stealth", magnitude: 1 },
      },
    ],
  },
  "harmonys-vanguard": {
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
        effect: { type: "shield", magnitude: 2.2, radius: 550 },
      },
    ],
  },
} as const;

// Helper function to get ship stats with type safety
export function getShipStats(shipClass: ShipClass): ShipStats {
  return SHIP_STATS[shipClass];
}

// Helper function to calculate display stats
export function getShipDisplayStats(stats: ShipStats): ShipDisplayStats {
  return {
    weapons: {
      damage: stats.weapons.reduce((sum, w) => sum + w.damage, 0),
      range: Math.max(...stats.weapons.map((w) => w.range)),
      accuracy:
        stats.weapons.reduce((sum, w) => sum + w.accuracy, 0) /
        stats.weapons.length,
    },
    defense: {
      hull: stats.health,
      shield: stats.shield,
      armor: stats.armor,
    },
    mobility: {
      speed: stats.speed,
      agility: stats.turnRate * 20, // Convert turn rate to agility score
      jumpRange: 0, // Base ships don't have jump capability
    },
    systems: {
      power: Math.round(stats.weapons.length * 30 + stats.shield / 10),
      radar: Math.round(
        stats.weapons.reduce((sum, w) => sum + w.range, 0) / 100,
      ),
      efficiency: Math.round(
        (1 - stats.weapons.reduce((sum, w) => sum + w.cooldown, 0) / 10) * 100,
      ),
    },
  };
}

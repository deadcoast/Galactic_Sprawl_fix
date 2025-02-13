import { PlayerShipClass, PlayerShipCategory } from '../types/ships/PlayerShipTypes';
import { ResourceType } from '../types/resources/ResourceTypes';
import { Tier } from '../types/core/GameTypes';

export interface ShipBlueprint {
  shipClass: PlayerShipClass;
  name: string;
  description: string;
  category: PlayerShipCategory;
  tier: Tier;
  baseStats: {
    hull: number;
    shield: number;
    energy: number;
    speed: number;
    cargo?: number;
    scanRange?: number;
    miningRate?: number;
  };
  requirements: {
    tier: Tier;
    resourceCost: Array<{
      type: ResourceType;
      amount: number;
    }>;
    buildTime: number;
    prerequisites?: {
      technology?: string[];
      resources?: Array<{
        type: ResourceType;
        amount: number;
      }>;
      officers?: {
        minLevel: number;
        specialization: string;
      };
    };
  };
  weapons?: Array<{
    name: string;
    damage: number;
    range: number;
    cooldown: number;
  }>;
  abilities?: Array<{
    name: string;
    description: string;
    cooldown: number;
    duration: number;
  }>;
}

export const SHIP_BLUEPRINTS: ShipBlueprint[] = [
  // Tier 1 Ships
  {
    shipClass: 'spitflare',
    name: 'Spitflare',
    description: 'Fast and agile combat ship, perfect for early game skirmishes',
    category: 'war',
    tier: 1,
    baseStats: {
      hull: 100,
      shield: 50,
      energy: 100,
      speed: 15
    },
    requirements: {
      tier: 1,
      resourceCost: [
        { type: 'minerals', amount: 100 },
        { type: 'energy', amount: 50 }
      ],
      buildTime: 60000 // 1 minute
    },
    weapons: [
      {
        name: 'Light Laser',
        damage: 10,
        range: 100,
        cooldown: 5
      }
    ]
  },
  {
    shipClass: 'void-dredger-miner',
    name: 'Void Dredger',
    description: 'Basic mining vessel with decent cargo capacity',
    category: 'mining',
    tier: 1,
    baseStats: {
      hull: 80,
      shield: 30,
      energy: 120,
      speed: 8,
      cargo: 200,
      miningRate: 10
    },
    requirements: {
      tier: 1,
      resourceCost: [
        { type: 'minerals', amount: 150 },
        { type: 'energy', amount: 30 }
      ],
      buildTime: 90000 // 1.5 minutes
    }
  },
  {
    shipClass: 'andromeda-cutter',
    name: 'Andromeda Cutter',
    description: 'Light reconnaissance vessel with advanced scanning capabilities',
    category: 'recon',
    tier: 1,
    baseStats: {
      hull: 60,
      shield: 40,
      energy: 80,
      speed: 20,
      scanRange: 150
    },
    requirements: {
      tier: 1,
      resourceCost: [
        { type: 'minerals', amount: 80 },
        { type: 'energy', amount: 70 }
      ],
      buildTime: 45000 // 45 seconds
    }
  },

  // Tier 2 Ships
  {
    shipClass: 'star-schooner',
    name: 'Star Schooner',
    description: 'Advanced reconnaissance ship with stealth capabilities',
    category: 'recon',
    tier: 2,
    baseStats: {
      hull: 90,
      shield: 70,
      energy: 120,
      speed: 25,
      scanRange: 250
    },
    requirements: {
      tier: 2,
      resourceCost: [
        { type: 'minerals', amount: 180 },
        { type: 'energy', amount: 150 },
        { type: 'plasma', amount: 50 }
      ],
      buildTime: 120000, // 2 minutes
      prerequisites: {
        technology: ['advanced-sensors', 'stealth-systems'],
        officers: {
          minLevel: 2,
          specialization: 'recon'
        }
      }
    },
    abilities: [
      {
        name: 'Stealth Mode',
        description: 'Become invisible to enemy sensors for a short duration',
        cooldown: 60,
        duration: 15
      }
    ]
  },
  {
    shipClass: 'orion-frigate',
    name: 'Orion Frigate',
    description: 'Versatile combat vessel with balanced offensive and defensive capabilities',
    category: 'war',
    tier: 2,
    baseStats: {
      hull: 200,
      shield: 150,
      energy: 180,
      speed: 12
    },
    requirements: {
      tier: 2,
      resourceCost: [
        { type: 'minerals', amount: 300 },
        { type: 'energy', amount: 200 },
        { type: 'plasma', amount: 100 }
      ],
      buildTime: 180000, // 3 minutes
      prerequisites: {
        technology: ['advanced-weapons', 'shield-harmonics'],
        officers: {
          minLevel: 2,
          specialization: 'war'
        }
      }
    },
    weapons: [
      {
        name: 'Heavy Laser',
        damage: 25,
        range: 150,
        cooldown: 8
      },
      {
        name: 'Missile Battery',
        damage: 40,
        range: 200,
        cooldown: 15
      }
    ]
  },

  // Tier 3 Ships
  {
    shipClass: 'harbringer-galleon',
    name: 'Harbringer Galleon',
    description: 'Massive warship with devastating firepower',
    category: 'war',
    tier: 3,
    baseStats: {
      hull: 400,
      shield: 300,
      energy: 300,
      speed: 8
    },
    requirements: {
      tier: 3,
      resourceCost: [
        { type: 'minerals', amount: 600 },
        { type: 'energy', amount: 400 },
        { type: 'plasma', amount: 200 },
        { type: 'exotic', amount: 50 }
      ],
      buildTime: 300000, // 5 minutes
      prerequisites: {
        technology: ['capital-ship-construction', 'advanced-weapon-systems'],
        officers: {
          minLevel: 3,
          specialization: 'war'
        }
      }
    },
    weapons: [
      {
        name: 'Plasma Lance',
        damage: 100,
        range: 200,
        cooldown: 20
      },
      {
        name: 'Point Defense Grid',
        damage: 15,
        range: 50,
        cooldown: 2
      }
    ],
    abilities: [
      {
        name: 'Shield Overcharge',
        description: 'Temporarily boost shield capacity by 50%',
        cooldown: 120,
        duration: 20
      }
    ]
  },
  {
    shipClass: 'midway-carrier',
    name: 'Midway Carrier',
    description: 'Capital ship capable of deploying fighter squadrons',
    category: 'war',
    tier: 3,
    baseStats: {
      hull: 500,
      shield: 250,
      energy: 400,
      speed: 6
    },
    requirements: {
      tier: 3,
      resourceCost: [
        { type: 'minerals', amount: 800 },
        { type: 'energy', amount: 500 },
        { type: 'plasma', amount: 300 },
        { type: 'exotic', amount: 100 }
      ],
      buildTime: 360000, // 6 minutes
      prerequisites: {
        technology: ['carrier-operations', 'fighter-production'],
        officers: {
          minLevel: 3,
          specialization: 'war'
        }
      }
    },
    abilities: [
      {
        name: 'Launch Fighters',
        description: 'Deploy a squadron of fighter craft',
        cooldown: 90,
        duration: 30
      },
      {
        name: 'Recall Fighters',
        description: 'Recall all deployed fighters for repairs',
        cooldown: 30,
        duration: 0
      }
    ]
  }
];

export function getShipBlueprint(shipClass: PlayerShipClass): ShipBlueprint | undefined {
  return SHIP_BLUEPRINTS.find(blueprint => blueprint.shipClass === shipClass);
}

export function getShipsByCategory(category: PlayerShipCategory): ShipBlueprint[] {
  return SHIP_BLUEPRINTS.filter(blueprint => blueprint.category === category);
}

export function getShipsByTier(tier: Tier): ShipBlueprint[] {
  return SHIP_BLUEPRINTS.filter(blueprint => blueprint.tier <= tier);
}

export function getAvailableShips(tier: Tier, category?: PlayerShipCategory): ShipBlueprint[] {
  let ships = SHIP_BLUEPRINTS.filter(blueprint => blueprint.tier <= tier);
  if (category) {
    ships = ships.filter(blueprint => blueprint.category === category);
  }
  return ships;
} 
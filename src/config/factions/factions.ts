import { Crown, Skull, Star } from 'lucide-react';

export interface FactionConfig {
  id: string;
  name: string;
  description: string;
  banner: {
    primaryColor: string;
    secondaryColor: string;
    icon: typeof Crown    ;
  };
  behavior: {
    baseAggression: number; // 0-1, determines likelihood of initiating combat
    retreatThreshold: number; // 0-1, health percentage at which ships retreat
    reinforcementThreshold: number; // 0-1, fleet strength at which reinforcements are called
    expansionRate: number; // 0-1, how quickly they expand territory
    tradingPreference: number; // 0-1, likelihood of engaging in trade vs combat
  };
  spawnConditions: {
    minTier: number; // Minimum player tier required for faction to appear
    maxShips: number; // Maximum number of ships this faction can field at once
    spawnRate: number; // 0-1, frequency of new ship spawns
    territorySize: number; // Base territory size in light years
  };
  specialRules: {
    alwaysHostile?: boolean; // For Space Rats
    requiresProvocation?: boolean; // For Lost Nova
    powerThreshold?: number; // For Equator Horizon, player power level that triggers their appearance
  };
}

export const factionConfigs: Record<string, FactionConfig> = {
  player: {
    id: 'player',
    name: 'Player Faction',
    description: 'The player-led empire focused on balanced growth and exploration.',
    banner: {
      primaryColor: '#2563eb', // blue-600
      secondaryColor: '#0f172a', // slate-900
      icon: Star,
    },
    behavior: {
      baseAggression: 0.4,
      retreatThreshold: 0.35,
      reinforcementThreshold: 0.55,
      expansionRate: 0.6,
      tradingPreference: 0.8,
    },
    spawnConditions: {
      minTier: 1,
      maxShips: 25,
      spawnRate: 0.6,
      territorySize: 150,
    },
    specialRules: {},
  },
  enemy: {
    id: 'enemy',
    name: 'Hostile Coalition',
    description: 'A hostile umbrella faction representing generic enemy fleets.',
    banner: {
      primaryColor: '#dc2626', // red-600
      secondaryColor: '#1f2937', // gray-800
      icon: Skull,
    },
    behavior: {
      baseAggression: 0.8,
      retreatThreshold: 0.25,
      reinforcementThreshold: 0.5,
      expansionRate: 0.7,
      tradingPreference: 0.2,
    },
    spawnConditions: {
      minTier: 1,
      maxShips: 18,
      spawnRate: 0.7,
      territorySize: 120,
    },
    specialRules: {
      alwaysHostile: true,
    },
  },
  neutral: {
    id: 'neutral',
    name: 'Neutral Syndicates',
    description: 'Independent systems prioritizing trade and self-preservation.',
    banner: {
      primaryColor: '#64748b', // slate-500
      secondaryColor: '#0f172a', // slate-900
      icon: Crown,
    },
    behavior: {
      baseAggression: 0.2,
      retreatThreshold: 0.45,
      reinforcementThreshold: 0.7,
      expansionRate: 0.4,
      tradingPreference: 0.9,
    },
    spawnConditions: {
      minTier: 1,
      maxShips: 12,
      spawnRate: 0.4,
      territorySize: 130,
    },
    specialRules: {},
  },
  ally: {
    id: 'ally',
    name: 'Allied Command',
    description: 'Friendly fleets that support player operations and logistics.',
    banner: {
      primaryColor: '#16a34a', // green-600
      secondaryColor: '#0f172a', // slate-900
      icon: Star,
    },
    behavior: {
      baseAggression: 0.35,
      retreatThreshold: 0.4,
      reinforcementThreshold: 0.65,
      expansionRate: 0.5,
      tradingPreference: 0.75,
    },
    spawnConditions: {
      minTier: 1,
      maxShips: 16,
      spawnRate: 0.5,
      territorySize: 140,
    },
    specialRules: {},
  },
  spaceRats: {
    id: 'spaceRats',
    name: 'Space Rats',
    description: 'Ruthless pirates thriving on chaos and plunder',
    banner: {
      primaryColor: '#991b1b', // red-800
      secondaryColor: '#1c1917', // stone-900
      icon: Skull,
    },
    behavior: {
      baseAggression: 0.9,
      retreatThreshold: 0.2,
      reinforcementThreshold: 0.4,
      expansionRate: 0.7,
      tradingPreference: 0.1,
    },
    spawnConditions: {
      minTier: 1,
      maxShips: 15,
      spawnRate: 0.8,
      territorySize: 100,
    },
    specialRules: {
      alwaysHostile: true,
    },
  },
  lostNova: {
    id: 'lostNova',
    name: 'Lost Nova',
    description: 'Exiled scientists wielding forbidden technologies',
    banner: {
      primaryColor: '#7c3aed', // violet-600
      secondaryColor: '#1e1b4b', // indigo-950
      icon: Star,
    },
    behavior: {
      baseAggression: 0.4,
      retreatThreshold: 0.4,
      reinforcementThreshold: 0.6,
      expansionRate: 0.3,
      tradingPreference: 0.6,
    },
    spawnConditions: {
      minTier: 2,
      maxShips: 12,
      spawnRate: 0.5,
      territorySize: 150,
    },
    specialRules: {
      requiresProvocation: true,
    },
  },
  equatorHorizon: {
    id: 'equatorHorizon',
    name: 'Equator Horizon',
    description: 'Ancient civilization maintaining cosmic balance',
    banner: {
      primaryColor: '#d97706', // amber-600
      secondaryColor: '#78350f', // amber-900
      icon: Crown,
    },
    behavior: {
      baseAggression: 0.5,
      retreatThreshold: 0.3,
      reinforcementThreshold: 0.5,
      expansionRate: 0.4,
      tradingPreference: 0.4,
    },
    spawnConditions: {
      minTier: 3,
      maxShips: 20,
      spawnRate: 0.3,
      territorySize: 200,
    },
    specialRules: {
      powerThreshold: 0.7, // Appears when player reaches 70% of max power
    },
  },
};

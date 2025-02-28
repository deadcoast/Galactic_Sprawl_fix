import { FactionId } from '../types/ships/FactionTypes';

export const FACTION_SHIPS: Record<FactionId, string[]> = {
  'player': ['spitflare', 'starSchooner', 'orionFrigate'],
  'enemy': ['harbringerGalleon', 'midwayCarrier', 'motherEarthRevenge'],
  'neutral': ['starSchooner', 'orionFrigate'],
  'ally': ['spitflare', 'orionFrigate'],
  'space-rats': [
    'rat-king',
    'asteroid-marauder',
    'rogue-nebula',
    'rats-revenge',
    'dark-sector-corsair',
    'wailing-wreck',
    'galactic-scourge',
    'plasma-fang',
    'vermin-vanguard',
    'black-void-buccaneer'
  ],
  'lost-nova': [
    'nova-seeker',
    'stellar-ghost',
    'void-wanderer',
    'astral-nomad',
    'cosmic-drifter',
    'nebula-phantom',
    'starlight-exile',
    'celestial-vagrant',
    'galactic-hermit',
    'interstellar-outcast'
  ],
  'equator-horizon': [
    'horizon-guardian',
    'equatorial-sentinel',
    'meridian-protector',
    'solstice-warden',
    'twilight-defender',
    'daybreak-enforcer',
    'dusk-keeper',
    'dawn-watcher',
    'noon-stalker',
    'eclipse-hunter'
  ]
};

export const FACTION_CONFIG: Record<FactionId, {
  baseAggression: number;
  expansionRate: number;
  tradingPreference: number;
  maxShips: number;
  spawnRules: {
    minTier: 1 | 2 | 3;
    requiresCondition?: string;
    spawnInterval: number;
  };
  specialRules: {
    alwaysHostile?: boolean;
    stealthBonus?: number;
    tradingBonus?: number;
  };
}> = {
  'player': {
    baseAggression: 0.5,
    expansionRate: 1,
    tradingPreference: 0.7,
    maxShips: 10,
    spawnRules: {
      minTier: 1,
      spawnInterval: 60
    },
    specialRules: {}
  },
  'enemy': {
    baseAggression: 0.8,
    expansionRate: 1.2,
    tradingPreference: 0.3,
    maxShips: 15,
    spawnRules: {
      minTier: 2,
      spawnInterval: 45
    },
    specialRules: {
      alwaysHostile: true
    }
  },
  'neutral': {
    baseAggression: 0.2,
    expansionRate: 0.8,
    tradingPreference: 0.9,
    maxShips: 8,
    spawnRules: {
      minTier: 1,
      spawnInterval: 90
    },
    specialRules: {
      tradingBonus: 0.2
    }
  },
  'ally': {
    baseAggression: 0.6,
    expansionRate: 1,
    tradingPreference: 0.8,
    maxShips: 12,
    spawnRules: {
      minTier: 1,
      spawnInterval: 60
    },
    specialRules: {}
  },
  'space-rats': {
    baseAggression: 0.9,
    expansionRate: 1.5,
    tradingPreference: 0.1,
    maxShips: 20,
    spawnRules: {
      minTier: 1,
      spawnInterval: 30
    },
    specialRules: {
      alwaysHostile: true
    }
  },
  'lost-nova': {
    baseAggression: 0.4,
    expansionRate: 0.7,
    tradingPreference: 0.5,
    maxShips: 12,
    spawnRules: {
      minTier: 2,
      requiresCondition: 'nebula',
      spawnInterval: 60
    },
    specialRules: {
      stealthBonus: 0.3
    }
  },
  'equator-horizon': {
    baseAggression: 0.6,
    expansionRate: 1.2,
    tradingPreference: 0.6,
    maxShips: 15,
    spawnRules: {
      minTier: 2,
      spawnInterval: 45
    },
    specialRules: {}
  }
};

export const FACTION_STATES: Record<FactionId, string> = {
  'player': 'active',
  'enemy': 'hostile',
  'neutral': 'passive',
  'ally': 'friendly',
  'space-rats': 'patrolling',
  'lost-nova': 'hiding',
  'equator-horizon': 'dormant'
}; 
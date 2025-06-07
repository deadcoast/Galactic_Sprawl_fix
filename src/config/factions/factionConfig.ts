import {
    EquatorHorizonConfig,
    EquatorHorizonShipClass,
    FactionBehaviorType,
    FactionConfig,
    FactionId,
    FactionShipClass,
    LostNovaConfig,
    LostNovaShipClass,
    SpaceRatsConfig,
    SpaceRatsShipClass
} from '../../types/ships/FactionShipTypes';

export const spaceRatsConfig: SpaceRatsConfig = {
  id: 'space-rats',
  name: 'Space Rats',
  description: 'Scavengers and pirates operating in asteroid fields.',
  baseRelationship: -0.5,
  shipClasses: [
    'ratKing',
    'asteroidMarauder',
    'rogueNebula',
    'ratsRevenge',
    'darkSectorCorsair',
    'wailingWreck',
    'galacticScourge',
    'plasmaFang',
    'verminVanguard',
    'blackVoidBuccaneer',
  ] as SpaceRatsShipClass[],
  behaviorConfig: {
    formation: 'swarm',
    behavior: 'aggressive',
    target: 'weakest',
  },
  banner: {
    primaryColor: 'red',
    secondaryColor: 'gray',
    sigil: 'rat-skull',
  },

  defaultBehavior: 'aggressive' as FactionBehaviorType,
  spawnConditions: {
    minThreatLevel: 0, // Always hostile
    maxShipsPerFleet: 8,
    territoryPreference: ['asteroid-fields', 'trade-routes', 'mining-sectors'] as string[],
  },
  pirateFleetComposition: {
    flagshipType: 'ratKing',
    supportShips: ['asteroidMarauder', 'rogueNebula', 'darkSectorCorsair', 'wailingWreck'] as FactionShipClass[],
  },
} as const;

export const FACTION_SHIPS: Record<FactionId, string[]> = {
  player: ['spitflare', 'starSchooner', 'orionFrigate'],
  enemy: ['harbringerGalleon', 'midwayCarrier', 'motherEarthRevenge'],
  neutral: ['starSchooner', 'orionFrigate'],
  ally: ['spitflare', 'orionFrigate'],
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
    'black-void-buccaneer',
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
    'interstellar-outcast',
  ],
  'equator-horizon': [
    'horizon-guardian',
    'equatorial-sentinel',
    'meridian-protector',
    'solstice-combatden',
    'twilight-defender',
    'daybreak-enforcer',
    'dusk-keeper',
    'dawn-watcher',
    'noon-stalker',
    'eclipse-hunter',
  ],
};

export const FACTION_CONFIG: Record<
  FactionId,
  {
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
  }
> = {
  player: {
    baseAggression: 0.5,
    expansionRate: 1,
    tradingPreference: 0.7,
    maxShips: 10,
    spawnRules: {
      minTier: 1,
      spawnInterval: 60,
    },
    specialRules: {},
  },
  enemy: {
    baseAggression: 0.8,
    expansionRate: 1.2,
    tradingPreference: 0.3,
    maxShips: 15,
    spawnRules: {
      minTier: 2,
      spawnInterval: 45,
    },
    specialRules: {
      alwaysHostile: true,
    },
  },
  neutral: {
    baseAggression: 0.2,
    expansionRate: 0.8,
    tradingPreference: 0.9,
    maxShips: 8,
    spawnRules: {
      minTier: 1,
      spawnInterval: 90,
    },
    specialRules: {
      tradingBonus: 0.2,
    },
  },
  ally: {
    baseAggression: 0.6,
    expansionRate: 1,
    tradingPreference: 0.8,
    maxShips: 12,
    spawnRules: {
      minTier: 1,
      spawnInterval: 60,
    },
    specialRules: {},
  },
  'space-rats': {
    baseAggression: 0.9,
    expansionRate: 1.5,
    tradingPreference: 0.1,
    maxShips: 20,
    spawnRules: {
      minTier: 1,
      spawnInterval: 30,
    },
    specialRules: {
      alwaysHostile: true,
    },
  },
  'lost-nova': {
    baseAggression: 0.4,
    expansionRate: 0.7,
    tradingPreference: 0.5,
    maxShips: 12,
    spawnRules: {
      minTier: 2,
      requiresCondition: 'nebula',
      spawnInterval: 60,
    },
    specialRules: {
      stealthBonus: 0.3,
    },
  },
  'equator-horizon': {
    baseAggression: 0.6,
    expansionRate: 1.2,
    tradingPreference: 0.6,
    maxShips: 15,
    spawnRules: {
      minTier: 2,
      spawnInterval: 45,
    },
    specialRules: {},
  },
};

export const FACTION_STATES: Record<FactionId, string> = {
  player: 'active',
  enemy: 'hostile',
  neutral: 'passive',
  ally: 'friendly',
  'space-rats': 'patrolling',
  'lost-nova': 'hiding',
  'equator-horizon': 'dormant',
};

export const lostNovaConfig: LostNovaConfig = {
  id: 'lost-nova',
  name: 'Lost Nova',
  description: 'Mysterious faction utilizing forbidden technology.',
  baseRelationship: 0.0,
  shipClasses: [
    'eclipseScythe',
    'nullsRevenge',
    'darkMatterReaper',
    'quantumPariah',
    'entropyScale',
    'voidRevenant',
    'scytheOfAndromeda',
    'nebularPersistence',
    'oblivionsWake',
    'forbiddenVanguard',
  ] as LostNovaShipClass[],
  behaviorConfig: {
    formation: 'scatter',
    behavior: 'stealth',
    target: 'isolated',
  },
  banner: {
    primaryColor: 'violet',
    secondaryColor: 'indigo',
    sigil: 'broken-star',
  },
  defaultBehavior: 'stealth' as FactionBehaviorType,
  spawnConditions: {
    minThreatLevel: 0.3, // Only appears when somewhat threatened
    maxShipsPerFleet: 6,
    territoryPreference: ['dark-sectors', 'nebulae', 'void-regions'] as string[],
  },
  forbiddenTech: {
    darkMatterLevel: 3,
    geneticModifications: ['neural-enhancement', 'void-adaptation', 'temporal-shifting'] as string[],
  },
} as const;

export const equatorHorizonConfig: EquatorHorizonConfig = {
  id: 'equator-horizon',
  name: 'Equator Horizon',
  description: 'Ancient faction dedicated to maintaining galactic balance.',
  baseRelationship: 0.2,
  shipClasses: [
    'celestialArbiter',
    'etherealGalleon',
    'stellarEquinox',
    'chronosSentinel',
    'nebulasJudgement',
    'aetherialHorizon',
    'cosmicCrusader',
    'balancekeepersWrath',
    'eclipticWatcher',
    'harmonysVanguard',
  ] as EquatorHorizonShipClass[],
  behaviorConfig: {
    formation: 'phalanx',
    behavior: 'balance',
    target: 'strongest',
  },
  banner: {
    primaryColor: 'amber',
    secondaryColor: 'violet',
    sigil: 'ancient-wheel',
  },
  defaultBehavior: 'balance' as FactionBehaviorType,
  spawnConditions: {
    minThreatLevel: 0.7, // Only appears when player is powerful
    maxShipsPerFleet: 10,
    territoryPreference: ['ancient-ruins', 'stellar-anomalies', 'temporal-rifts'] as string[],
  },
  balanceThresholds: {
    playerExpansion: 0.7, // 70% of available systems
    resourceControl: 0.6, // 60% of total resources
    techLevel: 3, // Tier 3 technology
  },
} as const;

// Ship class configurations
export const shipClassConfigs = {
  spaceRats: {
    classes: [
      'ratKing',
      'asteroidMarauder',
      'rogueNebula',
      'ratsRevenge',
      'darkSectorCorsair',
      'wailingWreck',
      'galacticScourge',
      'plasmaFang',
      'verminVanguard',
      'blackVoidBuccaneer',
    ] as SpaceRatsShipClass[],
  },
  lostNova: {
    classes: [
      'eclipseScythe',
      'nullsRevenge',
      'darkMatterReaper',
      'quantumPariah',
      'entropyScale',
      'voidRevenant',
      'scytheOfAndromeda',
      'nebularPersistence',
      'oblivionsWake',
      'forbiddenVanguard',
    ] as LostNovaShipClass[],
  },
  equatorHorizon: {
    classes: [
      'celestialArbiter',
      'etherealGalleon',
      'stellarEquinox',
      'chronosSentinel',
      'nebulasJudgement',
      'aetherialHorizon',
      'cosmicCrusader',
      'balancekeepersWrath',
      'eclipticWatcher',
      'harmonysVanguard',
    ] as EquatorHorizonShipClass[],
  },
} as const;

export const factionIds = ['space-rats', 'lost-nova', 'equator-horizon'] as const;

export const factionBehaviors = [
  'aggressive',
  'defensive',
  'hit-and-run',
  'stealth',
  'balance',
] as FactionBehaviorType[];

export const factionConfigs: Record<FactionId, FactionConfig> = {
  'space-rats': spaceRatsConfig,
  'lost-nova': lostNovaConfig,
  'equator-horizon': equatorHorizonConfig,
  player: {
    id: 'player',
    name: 'Player Faction',
    description: 'The players faction.',
    baseRelationship: 1.0,
    shipClasses: [] as FactionShipClass[],
    behaviorConfig: {
      formation: 'flexible',
      behavior: 'defensive',
      target: 'nearest',
    },
    banner: {
      primaryColor: 'blue',
      secondaryColor: 'gold',
      sigil: 'star',
    },
    defaultBehavior: 'defensive' as FactionBehaviorType,
    spawnConditions: {
      minThreatLevel: 0,
      maxShipsPerFleet: 10,
      territoryPreference: ['player-systems', 'core-sectors', 'resource-rich'] as string[],
    },
  },
  enemy: {
    id: 'enemy',
    name: 'Enemy Faction',
    description: 'A generic hostile faction.',
    baseRelationship: -1.0,
    shipClasses: [] as FactionShipClass[],
    behaviorConfig: {
      formation: 'line',
      behavior: 'aggressive',
      target: 'player',
    },
    banner: {
      primaryColor: 'red',
      secondaryColor: 'black',
      sigil: 'skull',
    },
    defaultBehavior: 'aggressive' as FactionBehaviorType,
    spawnConditions: {
      minThreatLevel: 0,
      maxShipsPerFleet: 8,
              territoryPreference: ['border-systems', 'strategic-points', 'resource-rich'] as string[],
    },
  },
  neutral: {
    id: 'neutral',
    name: 'Neutral Faction',
    description: 'A neutral faction focused on trade or other goals.',
    baseRelationship: 0.0,
    shipClasses: [] as FactionShipClass[],
    behaviorConfig: {
      formation: 'cluster',
      behavior: 'passive',
      target: 'none',
    },
    banner: {
      primaryColor: 'gray',
      secondaryColor: 'white',
      sigil: 'circle',
    },
    defaultBehavior: 'defensive' as FactionBehaviorType,
    spawnConditions: {
      minThreatLevel: 0.5,
      maxShipsPerFleet: 5,
              territoryPreference: ['neutral-zones', 'trade-routes', 'peaceful-sectors'] as string[],
    },
  },
  ally: {
    id: 'ally',
    name: 'Allied Faction',
    description: 'A faction allied with the player.',
    baseRelationship: 0.8,
    shipClasses: [] as FactionShipClass[],
    behaviorConfig: {
      formation: 'support',
      behavior: 'defensive',
      target: 'player_target',
    },
    banner: {
      primaryColor: 'green',
      secondaryColor: 'blue',
      sigil: 'shield',
    },
    defaultBehavior: 'defensive' as FactionBehaviorType,
    spawnConditions: {
      minThreatLevel: 0.2,
      maxShipsPerFleet: 7,
              territoryPreference: ['allied-systems', 'border-defense', 'joint-operations'] as string[],
    },
  },
} as const;

import {
  EquatorHorizonConfig,
  EquatorHorizonShipClass,
  FactionConfig,
  LostNovaConfig,
  LostNovaShipClass,
  SpaceRatsConfig,
  SpaceRatsShipClass,
} from '../../types/ships/FactionShipTypes';
import { FactionBehaviorType, FactionId } from '../../types/ships/FactionTypes';

export const spaceRatsConfig: SpaceRatsConfig = {
  id: 'space-rats',
  name: 'Space Rats',
  banner: {
    primaryColor: 'red',
    secondaryColor: 'gray',
    sigil: 'rat-skull',
  },
  defaultBehavior: 'aggressive' as FactionBehaviorType,
  spawnConditions: {
    minThreatLevel: 0, // Always hostile
    maxShipsPerFleet: 8,
    territoryPreference: ['asteroid-fields', 'trade-routes', 'mining-sectors'],
  },
  pirateFleetComposition: {
    flagshipType: 'ratKing',
    supportShips: ['asteroidMarauder', 'rogueNebula', 'darkSectorCorsair', 'wailingWreck'],
  },
} as const;

export const lostNovaConfig: LostNovaConfig = {
  id: 'lost-nova',
  name: 'Lost Nova',
  banner: {
    primaryColor: 'violet',
    secondaryColor: 'indigo',
    sigil: 'broken-star',
  },
  defaultBehavior: 'stealth' as FactionBehaviorType,
  spawnConditions: {
    minThreatLevel: 0.3, // Only appears when somewhat threatened
    maxShipsPerFleet: 6,
    territoryPreference: ['dark-sectors', 'nebulae', 'void-regions'],
  },
  forbiddenTech: {
    darkMatterLevel: 3,
    geneticModifications: ['neural-enhancement', 'void-adaptation', 'temporal-shifting'],
  },
} as const;

export const equatorHorizonConfig: EquatorHorizonConfig = {
  id: 'equator-horizon',
  name: 'Equator Horizon',
  banner: {
    primaryColor: 'amber',
    secondaryColor: 'violet',
    sigil: 'ancient-wheel',
  },
  defaultBehavior: 'balance' as FactionBehaviorType,
  spawnConditions: {
    minThreatLevel: 0.7, // Only appears when player is powerful
    maxShipsPerFleet: 10,
    territoryPreference: ['ancient-ruins', 'stellar-anomalies', 'temporal-rifts'],
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
] as const satisfies FactionBehaviorType[];

export const factionConfigs: Record<FactionId, FactionConfig> = {
  'space-rats': spaceRatsConfig,
  'lost-nova': lostNovaConfig,
  'equator-horizon': equatorHorizonConfig,
  player: {
    id: 'player',
    name: 'Player Faction',
    banner: {
      primaryColor: 'blue',
      secondaryColor: 'gold',
      sigil: 'star',
    },
    defaultBehavior: 'defensive' as FactionBehaviorType,
    spawnConditions: {
      minThreatLevel: 0,
      maxShipsPerFleet: 10,
      territoryPreference: ['player-systems', 'core-sectors', 'resource-rich'],
    },
  },
  enemy: {
    id: 'enemy',
    name: 'Enemy Faction',
    banner: {
      primaryColor: 'red',
      secondaryColor: 'black',
      sigil: 'skull',
    },
    defaultBehavior: 'aggressive' as FactionBehaviorType,
    spawnConditions: {
      minThreatLevel: 0,
      maxShipsPerFleet: 8,
      territoryPreference: ['border-systems', 'strategic-points', 'resource-rich'],
    },
  },
  neutral: {
    id: 'neutral',
    name: 'Neutral Faction',
    banner: {
      primaryColor: 'gray',
      secondaryColor: 'white',
      sigil: 'circle',
    },
    defaultBehavior: 'defensive' as FactionBehaviorType,
    spawnConditions: {
      minThreatLevel: 0.5,
      maxShipsPerFleet: 5,
      territoryPreference: ['neutral-zones', 'trade-routes', 'peaceful-sectors'],
    },
  },
  ally: {
    id: 'ally',
    name: 'Allied Faction',
    banner: {
      primaryColor: 'green',
      secondaryColor: 'blue',
      sigil: 'shield',
    },
    defaultBehavior: 'defensive' as FactionBehaviorType,
    spawnConditions: {
      minThreatLevel: 0.2,
      maxShipsPerFleet: 7,
      territoryPreference: ['allied-systems', 'border-defense', 'joint-operations'],
    },
  },
} as const;

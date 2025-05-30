import { Tier } from '../core/GameTypes';
import { CombatWeaponStats, WeaponInstance } from '../weapons/WeaponTypes';
import { CommonShipAbility, CommonShipDisplayStats, CommonShipStats } from './CommonShipTypes';
import { FactionBehaviorConfig, FactionBehaviorType, FactionId } from './FactionTypes';
import { ShipStats, ShipType } from './ShipTypes';
import { UnifiedShipStatus } from './UnifiedShipTypes';

export interface FactionConfig {
  id: FactionId;
  name: string;
  banner: {
    primaryColor: string;
    secondaryColor: string;
    sigil: string;
  };
  defaultBehavior: FactionBehaviorType;
  spawnConditions: {
    minThreatLevel: number;
    maxShipsPerFleet: number;
    territoryPreference: string[];
  };
}

export interface AIBehavior {
  id: string;
  type: FactionBehaviorType;
  priority: 'attack' | 'defend' | 'support';
  conditions: {
    healthThreshold: number;
    shieldThreshold: number;
    targetDistance: number;
    allySupport: boolean;
  };
}

export interface FactionState {
  id: FactionId;
  fleetStrength: number;
  threatLevel: number;
  territory: string[];
  relationships: Record<FactionId, number>;
  activeShips: ShipType[];
  currentBehavior: AIBehavior;
}

export interface FactionManager {
  factions: Record<FactionId, FactionState>;
  updateBehavior: (factionId: FactionId, behavior: AIBehavior) => void;
  spawnFleet: (factionId: FactionId, systemId: string) => void;
  updateTerritory: (factionId: FactionId, territory: string[]) => void;
  updateRelationships: (factionId: FactionId, relationships: Record<FactionId, number>) => void;
}

// Faction-specific configurations
export interface SpaceRatsConfig extends FactionConfig {
  id: 'space-rats';
  pirateFleetComposition: {
    flagshipType: 'ratKing';
    supportShips: string[];
  };
}

export interface LostNovaConfig extends FactionConfig {
  id: 'lost-nova';
  forbiddenTech: {
    darkMatterLevel: number;
    geneticModifications: string[];
  };
}

export interface EquatorHorizonConfig extends FactionConfig {
  id: 'equator-horizon';
  balanceThresholds: {
    playerExpansion: number;
    resourceControl: number;
    techLevel: number;
  };
}

// Faction Ship Classes - Using camelCase for consistency
export type SpaceRatsShipClass =
  | 'ratKing'
  | 'asteroidMarauder'
  | 'rogueNebula'
  | 'ratsRevenge'
  | 'darkSectorCorsair'
  | 'wailingWreck'
  | 'galacticScourge'
  | 'plasmaFang'
  | 'verminVanguard'
  | 'blackVoidBuccaneer';

export type LostNovaShipClass =
  | 'eclipseScythe'
  | 'nullsRevenge'
  | 'darkMatterReaper'
  | 'quantumPariah'
  | 'entropyScale'
  | 'voidRevenant'
  | 'scytheOfAndromeda'
  | 'nebularPersistence'
  | 'oblivionsWake'
  | 'forbiddenVanguard';

export type EquatorHorizonShipClass =
  | 'celestialArbiter'
  | 'etherealGalleon'
  | 'stellarEquinox'
  | 'chronosSentinel'
  | 'nebulasJudgement'
  | 'aetherialHorizon'
  | 'cosmicCrusader'
  | 'balancekeepersWrath'
  | 'eclipticWatcher'
  | 'harmonysVanguard';

export type FactionShipClass = SpaceRatsShipClass | LostNovaShipClass | EquatorHorizonShipClass;

// Faction Ship Stats
export interface FactionShipStats extends CommonShipStats {
  tier: Tier;
  faction: FactionId;
}

// Faction Ship Ability
export interface FactionShipAbility extends CommonShipAbility {
  factionRequirement?: FactionId;
  tier: Tier;
}

// Faction Ship Display Stats (for UI)
export type FactionShipDisplayStats = CommonShipDisplayStats;

// Faction Ship Interface
export interface FactionShip /* extends CommonShip */ {
  id: string;
  name: string;
  category: string;
  stats: CommonShipStats;
  abilities?: CommonShipAbility[];
  displayStats?: FactionShipDisplayStats;
  faction: FactionId;
  class: FactionShipClass;
  status: UnifiedShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  position: { x: number; y: number };
  rotation: number;
  target?: string;
  tactics: FactionBehaviorConfig;
  specialAbility?: {
    name: string;
    description: string;
    cooldown: number;
    active: boolean;
  };
}

// Faction Ship Config
export interface FactionShipConfig {
  id: string;
  name: string;
  class: FactionShipClass;
  faction: FactionId;
  tier: Tier;
  baseStats: FactionShipStats;
  visualAsset: string;
}

// Faction Ship Component Props
export interface FactionShipProps {
  ship: FactionShip;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: () => void;
  onFire?: (weaponId: string) => void;
  className?: string;
}

export interface ShipStatsWithWeapons extends ShipStats {
  weapons: {
    primary: WeaponInstance;
    secondary?: WeaponInstance[];
    stats: CombatWeaponStats;
  };
  abilities: FactionShipAbility[];
}

export interface FactionFleet {
  ships: FactionShip[];
  formation: {
    type: 'offensive' | 'defensive' | 'stealth';
    spacing: number;
    facing: number;
  };
  strength: number;
}

import { Position, Tier } from '../core/GameTypes';
import { ResourceType } from '../resources/ResourceTypes';
import { CombatWeaponStats, WeaponInstance } from '../weapons/WeaponTypes';
// Import ShipStatus from CommonShipTypes to break circular dependency with ShipTypes
import {
    CommonShipAbility,
    CommonShipDisplayStats,
    CommonShipStats,
    ShipStatus,
    ShipType,
} from './CommonShipTypes';

// Define core Faction types here
export type FactionId =
  | 'player'
  | 'enemy'
  | 'neutral'
  | 'ally'
  | 'space-rats'
  | 'lost-nova'
  | 'equator-horizon';

export type FactionBehaviorType =
  | 'aggressive'
  | 'defensive'
  | 'hit-and-run'
  | 'stealth'
  | 'balance'
  | 'passive' // Add other potential types if known
  | 'evasive';

export interface FactionBehaviorConfig {
  // Define based on usage in FactionShip and potentially useFactionBehavior
  formation: string; // Placeholder type
  behavior: FactionBehaviorType;
  target?: string; // Placeholder type
}

export interface FactionConfig {
  // Define the base FactionConfig interface
  id: FactionId;
  name: string; // Add name
  description: string; // Add description
  baseRelationship: number; // Add baseRelationship
  shipClasses: FactionShipClass[];
  behaviorConfig: FactionBehaviorConfig; // Use defined FactionBehaviorConfig
  specialRules?: {
    alwaysHostile?: boolean;
    requiresProvocation?: boolean;
    powerThreshold?: number;
  };
  defaultBehavior?: FactionBehaviorType; // Add optional defaultBehavior
  spawnConditions?: {
    // Add optional spawnConditions
    minThreatLevel?: number;
    maxShipsPerFleet?: number;
    territoryPreference?: string[];
    requiresCondition?: string; // Added based on lostNovaConfig usage
    spawnInterval?: number; // Added based on FACTION_CONFIG usage
    minTier?: 1 | 2 | 3; // Added based on FACTION_CONFIG usage
  };
  banner?: {
    // Add optional banner property
    primaryColor: string;
    secondaryColor: string;
    sigil: string;
  };
  fleetComposition?: {
    maxFleets: number;
    maxShipsPerFleet: number;
  };
  territoryConfig?: {
    initialRadius: number;
    expansionRate: number;
  };
  resourcePriorities?: ResourceType[];
  pirateFleetComposition?: {
    flagshipType: FactionShipClass;
    supportShips: FactionShipClass[]; // Use FactionShipClass here too
  };
}

export interface FactionState {
  id: FactionId;
  fleetStrength: number;
  threatLevel: number;
  territory: {
    systems: string[];
    outposts: string[];
    colonies: string[];
  };
  relationships: Record<FactionId, number>;
  activeShips: ShipType[];
  currentBehavior: AIBehavior;

  /**
   * Optional aggregate statistics for the faction. Populated by behavior hooks/managers.
   * Currently only totalShips is used for simple power calculations, but the
   * object is intentionally extensible for future metrics (e.g., fleetStrength,
   * resourceIncome, controlledSystems).
   */
  stats?: {
    totalShips?: number;
    [key: string]: unknown;
  };
}

// Faction-specific configurations
export interface SpaceRatsConfig extends FactionConfig {
  id: 'space-rats';
  pirateFleetComposition: {
    flagshipType: 'ratKing';
    supportShips: FactionShipClass[];
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

export interface FactionManager {
  factions: Record<FactionId, FactionState>;
  getFactionState(factionId: FactionId): FactionState | undefined;
  getAllFactionStates(): Record<FactionId, FactionState>;
  updateBehavior: (factionId: FactionId, behavior: AIBehavior) => void;
  spawnFleet: (factionId: FactionId, systemId: string) => void;
  updateTerritory: (factionId: FactionId, territory: string[]) => void;
  updateRelationships: (factionId: FactionId, relationships: Record<FactionId, number>) => void;
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

  // Optional extended stats used by legacy factories
  accuracy?: number;
  criticalChance?: number;
  criticalDamage?: number;
  armorPenetration?: number;
  shieldPenetration?: number;
  miningRate?: number;
  category?: import('./ShipTypes').ShipCategory;
  name?: string;
  capabilities?: Record<string, unknown> & {
    canSalvage?: boolean;
    canMine?: boolean;
    canJump?: boolean;
    scanning?: number;
    stealth?: number;
    combat?: number;
    stealthActive?: boolean;
    speed?: number;
    range?: number;
  };
  tactics?: Record<string, unknown>;
  formation?: Record<string, unknown>;
  specialAbility?: Record<string, unknown>;
  techBonuses?: Record<string, unknown>;
  combatStats?: Record<string, unknown>;
  stealth?: Record<string, unknown>;
  sensors?: Record<string, unknown>;
  formationId?: string;
  formationRole?: string;
  coordinationBonus?: number;
}

// Ability effect definition used by faction ships
export interface AbilityEffect {
  type: 'stealth' | 'shield' | 'speed' | 'damage' | (string & {});
  magnitude: number;
  radius?: number;
  duration?: number;
}

// Faction Ship Ability
export interface FactionShipAbility extends CommonShipAbility {
  factionRequirement?: FactionId;
  tier: Tier;
  // inherits effect from CommonShipAbility - no additional field
}

// Faction Ship Display Stats (for UI)
export type FactionShipDisplayStats = CommonShipDisplayStats;

// Faction Ship Interface
export interface FactionShip /* extends CommonShip */ {
  id: string;
  name: string;
  category: 'combat' | 'support' | 'civilian';
  status: ShipStatus;
  faction: FactionId;
  class: FactionShipClass;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  position: Position;
  rotation: number;
  tactics: FactionBehaviorConfig;
  stats: CommonShipStats;
  abilities: FactionShipAbility[];
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

// Use Omit to exclude the conflicting 'weapons' property from CommonShipStats
export interface ShipStatsWithWeapons extends Omit<CommonShipStats, 'weapons'> {
  weapons: {
    primary: WeaponInstance;
    secondary?: WeaponInstance[];
    stats: CombatWeaponStats;
  };
  // inherits abilities from CommonShipStats
}

/**
 * Represents a formation configuration for a faction fleet.
 */
export interface FactionFleetFormation {
  type: 'offensive' | 'defensive' | 'balanced' | 'stealth'; // Define possible formation types
  spacing: number;
  facing: number;
}

/**
 * Represents a fleet of faction ships.
 */
export interface FactionFleet {
  id: string; // Add missing ID
  name: string; // Add missing name
  ships: FactionShip[];
  formation: FactionFleetFormation; // Use the defined interface
  strength: number;
  status: 'idle' | 'moving' | 'attacking' | 'retreating' | 'defending'; // Add missing status
  target?: string | Position; // Add missing target
  orders?: string; // Add missing orders
  stats?: CommonShipStats; // Use CommonShipStats instead of ShipStats
}

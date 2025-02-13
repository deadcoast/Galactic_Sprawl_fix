import { WeaponType } from '../combat/CombatTypes';
import { FactionId } from './FactionTypes';
import { Tier } from "../../types/core/GameTypes";
import {
  CommonShip,
  CommonShipAbility,
  CommonShipDisplayStats,
  CommonShipStats,
} from "../../types/ships/CommonShipTypes";
import { ShipStatus } from "../../components/ships/FactionShips/FactionShipBase";
import { WeaponMount } from "../weapons/WeaponTypes";
import { ShipType } from './ShipTypes';
import { WeaponType } from '../combat/CombatTypes';

export type FactionId = "space-rats" | "lost-nova" | "equator-horizon";

export type FactionBehaviorType = 'aggressive' | 'defensive' | 'hit-and-run' | 'stealth' | 'balance';

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
  id: "space-rats";
  pirateFleetComposition: {
    flagshipType: 'ratKing';
    supportShips: string[];
  };
}

export interface LostNovaConfig extends FactionConfig {
  id: "lost-nova";
  forbiddenTech: {
    darkMatterLevel: number;
    geneticModifications: string[];
  };
}

export interface EquatorHorizonConfig extends FactionConfig {
  id: "equator-horizon";
  balanceThresholds: {
    playerExpansion: number;
    resourceControl: number;
    techLevel: number;
  };
} 
// Faction IDs
export type FactionId = "space-rats" | "lost-nova" | "equator-horizon";

// Faction Ship Classes
export type SpaceRatsShipClass =
  | "rat-king"
  | "asteroid-marauder"
  | "rogue-nebula"
  | "rats-revenge"
  | "dark-sector-corsair"
  | "wailing-wreck"
  | "galactic-scourge"
  | "plasma-fang"
  | "vermin-vanguard"
  | "black-void-buccaneer";

export type LostNovaShipClass =
  | "eclipse-scythe"
  | "nulls-revenge"
  | "dark-matter-reaper"
  | "quantum-pariah"
  | "entropy-scale"
  | "void-revenant"
  | "scythe-of-andromeda"
  | "nebular-persistence"
  | "oblivions-wake"
  | "forbidden-vanguard";

export type EquatorHorizonShipClass =
  | "celestial-arbiter"
  | "ethereal-galleon"
  | "stellar-equinox"
  | "chronos-sentinel"
  | "nebulas-judgement"
  | "aetherial-horizon"
  | "cosmic-crusader"
  | "balancekeepers-wrath"
  | "ecliptic-watcher"
  | "harmonys-vanguard";

export type FactionShipClass =
  | SpaceRatsShipClass
  | LostNovaShipClass
  | EquatorHorizonShipClass;

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
export interface FactionShip {
  id: string;
  name: string;
  faction: string;
  class: string;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  stats: any;
  tactics: "aggressive" | "defensive" | "hit-and-run";
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
  className?: string;
}

export interface ShipStatsWithWeapons {
  weapons: WeaponMount[];
  abilities: any[];
  [key: string]: any; // Allow for other stats properties
}

export interface ShipStats {
  health: number;
  shields: number;
  speed: number;
  maneuverability: number;
  cargo: number;
}

export interface ShipLoadout {
  weapons: WeaponType[];
  upgrades: string[];
}

export interface ShipType {
  id: string;
  name: string;
  faction: FactionId;
  class: string;
  tier: 1 | 2 | 3;
  stats: ShipStats;
  loadout: ShipLoadout;
  visualAsset: string;
}

// Ship class types for each faction
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
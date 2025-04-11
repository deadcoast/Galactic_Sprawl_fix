import { Position, Tier, Velocity } from '../core/GameTypes';
import { Officer } from '../officers/OfficerTypes';
import { WeaponMount } from '../weapons/WeaponTypes';
import {
  CommonShipAbility,
  CommonShipCapabilities,
  CommonShipStats,
  ShipCargo,
} from './CommonShipTypes';
import { FactionShipClass } from './FactionShipTypes'; // Keep FactionShipStats import if used
import { FactionBehaviorConfig, FactionId } from './FactionTypes';
import { PlayerShipClass } from './PlayerShipTypes';

/**
 * Consolidated Ship Status Enum
 */
export enum UnifiedShipStatus {
  IDLE = 'idle',
  READY = 'ready',
  ENGAGING = 'engaging',
  PATROLLING = 'patrolling',
  RETREATING = 'retreating',
  DISABLED = 'disabled',
  DAMAGED = 'damaged',
  REPAIRING = 'repairing',
  UPGRADING = 'upgrading',
  SCANNING = 'scanning',
  INVESTIGATING = 'investigating',
  RETURNING = 'returning',
  MINING = 'mining',
  MAINTENANCE = 'maintenance',
  HIDING = 'hiding',
  PREPARING = 'preparing',
  AMBUSHING = 'ambushing',
  RETALIATING = 'retaliating',
  WITHDRAWING = 'withdrawing',
  DORMANT = 'dormant',
  AWAKENING = 'awakening',
  ENFORCING = 'enforcing',
  OVERWHELMING = 'overwhelming',
  PURSUING = 'pursuing',
  ATTACKING = 'attacking',
  AGGRESSIVE = 'aggressive',
}

/**
 * Consolidated Ship Category Enum
 */
export enum ShipCategory {
  WAR = 'war',
  RECON = 'recon',
  MINING = 'mining',
  TRANSPORT = 'transport',
  SCOUT = 'scout',
  FIGHTER = 'fighter',
  CRUISER = 'cruiser',
  BATTLESHIP = 'battleship',
  CARRIER = 'carrier',
}

/**
 * Consolidated detailed Stats object (consider merging/extending CommonShipStats)
 */
export interface DetailedShipStats extends CommonShipStats {
  armor?: number; // From FactionCombatUnit / Defense
  turnRate: number; // Already in CommonShipStats
  accuracy?: number; // From FactionCombatUnit
  evasion?: number; // From FactionCombatUnit / Defense
  criticalChance?: number; // From FactionCombatUnit
  criticalDamage?: number; // From FactionCombatUnit
  armorPenetration?: number; // From FactionCombatUnit
  shieldPenetration?: number; // From FactionCombatUnit
  // Consider adding mobility/defense substructures if preferred over flat list
}

/**
 * Consolidated Experience object
 */
export interface ShipExperience {
  current?: number; // From FactionCombatUnit
  total?: number; // From FactionCombatUnit
  level: number; // From FactionCombatUnit & PlayerShipStats
  skills?: string[]; // From FactionCombatUnit
}

/**
 * Base Ship Interface - Includes properties common across most definitions
 */
export interface BaseShip {
  id: string;
  name: string;
  category: ShipCategory;
  status: UnifiedShipStatus;
  position: Position;
  rotation?: number;
  // velocity?: Velocity; // Let's make velocity optional as it's not universal
  velocity?: Velocity;
  faction?: FactionId;
  tier?: Tier;
  level?: number; // Base level (can be part of experience object)
  experience?: number | ShipExperience; // Keep union type here
  stats: CommonShipStats; // Keep CommonShipStats as the base
  capabilities?: Partial<CommonShipCapabilities>; // Use partial for flexibility
  officerBonuses?: {
    buildSpeed?: number;
    resourceEfficiency?: number;
    combatEffectiveness?: number;
  };
  abilities?: CommonShipAbility[];
  assignedOfficers?: Officer[];
  // Properties from ShipEvents.ts
  fuel?: number;
  maxFuel?: number;
  crew?: number;
  maxCrew?: number;
  location?: string;
  destination?: string;
  cargo?: ShipCargo; // Keep original ShipCargo type for now
  assignedTo?: string;
}

/**
 * Combat Ship Interface
 */
export interface CombatShip extends BaseShip {
  category:
    | ShipCategory.WAR
    | ShipCategory.FIGHTER
    | ShipCategory.CRUISER
    | ShipCategory.BATTLESHIP
    | ShipCategory.CARRIER;
  class?: FactionShipClass | PlayerShipClass;
  stats: DetailedShipStats; // Use more detailed stats for combat ships
  experience?: number | ShipExperience; // Align experience type with BaseShip
  tactics?: FactionBehaviorConfig;
  formation?: {
    type: 'offensive' | 'defensive' | 'balanced';
    spacing: number;
    facing: number;
    position?: number;
  };
  specialAbility?: {
    name: string;
    description: string;
    cooldown: number;
    active: boolean;
    effectiveness?: number; // Added from WarShip
  };
  techBonuses?: {
    weaponEfficiency?: number;
    shieldRegeneration?: number;
    energyEfficiency?: number;
  };
  combatStats?: {
    damageDealt: number;
    damageReceived: number;
    killCount: number;
    assistCount: number;
  };
  // Add optional detailed status, keeping base status compatible
  combatStatusDetail?: {
    main: 'active' | 'disabled' | 'destroyed';
    secondary?: 'charging' | 'cooling' | 'repairing' | 'boosting';
    effects?: string[];
  };
}

/**
 * Mining Ship Interface
 */
export interface MiningShip extends BaseShip {
  category: ShipCategory.MINING;
  class?: PlayerShipClass.ROCK_BREAKER | PlayerShipClass.VOID_DREDGER | FactionShipClass;
  currentLoad?: number;
  targetNode?: string;
  efficiency?: number;
}

/**
 * Recon Ship Interface
 */
export interface ReconShip extends BaseShip {
  category: ShipCategory.RECON | ShipCategory.SCOUT;
  class?: PlayerShipClass.ANDROMEDA_CUTTER | PlayerShipClass.STAR_SCHOONER | FactionShipClass;
  // Refined capabilities based on multiple sources
  capabilities?: Partial<CommonShipCapabilities> & {
    scanning?: number;
    stealth?: number;
    combat?: number; // Added from ReconCoordination
    stealthActive?: boolean; // Added from ReconCoordination
    speed?: number; // Added from ReconCoordination
    range?: number; // Added from ReconCoordination
    cargo?: number; // Added from ReconCoordination
    weapons?: number; // Added from ReconCoordination
  };
  assignedSectorId?: string;
  targetSector?: string;
  specialization?: 'mapping' | 'anomaly' | 'resource';
  efficiency?: number;
  currentTask?: {
    // From ReconCoordination
    type: string;
    target: string;
    progress: number;
  };
  discoveries?: {
    // From ReconShipManagerImpl
    mappedSectors: number;
    anomaliesFound: number;
    resourcesLocated: number;
  };
  stealth?: {
    // From ReconShipManagerImpl
    active: boolean;
    level: number;
    cooldown: number;
  };
  sensors?: {
    // From ReconShipManagerImpl
    range: number;
    accuracy: number;
    anomalyDetection: number;
  };
  formationId?: string; // Added from ReconCoordination
  formationRole?: 'leader' | 'support' | 'scout'; // Added from ReconCoordination
  coordinationBonus?: number; // Added from ReconCoordination
}

/**
 * Transport Ship Interface
 */
export interface TransportShip extends BaseShip {
  category: ShipCategory.TRANSPORT;
  // Add specific properties if needed
}

/**
 * Discriminated Union for any Ship type
 */
export type UnifiedShip = CombatShip | MiningShip | ReconShip | TransportShip;

// Weapon Data Source Types
export type BlueprintWeaponData = {
  name: string;
  damage: number;
  range: number;
  cooldown: number;
  [key: string]: unknown;
};
export type WeaponDataSource = BlueprintWeaponData | WeaponMount;

// Type Guards
export function isBlueprintWeaponData(data: WeaponDataSource): data is BlueprintWeaponData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    'damage' in data &&
    !('size' in data) &&
    !('currentWeapon' in data)
  );
}

export function isEmptyWeaponMount(data: WeaponDataSource): data is WeaponMount {
  return (
    typeof data === 'object' &&
    data !== null &&
    'size' in data &&
    (data as WeaponMount).currentWeapon === undefined
  );
}

export function isWeaponMountWithWeapon(data: WeaponDataSource): data is WeaponMount {
  return (
    typeof data === 'object' &&
    data !== null &&
    'currentWeapon' in data &&
    data.currentWeapon !== undefined
  );
}

export function isCombatShip(ship: UnifiedShip): ship is CombatShip {
  return [
    ShipCategory.WAR,
    ShipCategory.FIGHTER,
    ShipCategory.CRUISER,
    ShipCategory.BATTLESHIP,
    ShipCategory.CARRIER,
  ].includes(ship.category);
}

export function isMiningShip(ship: UnifiedShip): ship is MiningShip {
  return ship.category === ShipCategory.MINING;
}

export function isReconShip(ship: UnifiedShip): ship is ReconShip {
  return [ShipCategory.RECON, ShipCategory.SCOUT].includes(ship.category);
}

export function isTransportShip(ship: UnifiedShip): ship is TransportShip {
  return ship.category === ShipCategory.TRANSPORT;
}

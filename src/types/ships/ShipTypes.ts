import { Position, Tier, Velocity } from '../core/GameTypes';
import { WeaponMount } from '../weapons/WeaponTypes';
import
  {
    CommonShipCapabilities, // Re-add import
    CommonShipStats,
    ShipCargo,
    ShipStatus,
  } from './CommonShipTypes';
import { FactionBehaviorConfig, FactionId, FactionShipClass } from './FactionShipTypes'; // Keep FactionShipStats import if used
import { PlayerShipClass } from './PlayerShipTypes';

export { ShipStatus };
// Alias used by UI components expecting UnifiedShipStatus
export type UnifiedShipStatus = ShipStatus;
// Provide runtime alias for enum to satisfy value usage
export const UnifiedShipStatus = ShipStatus;
export type { FactionId, Position, ShipCargo, Tier }; // Export types only

/**
 * Consolidated Ship Category Enum
 */
export enum ShipCategory {
  combat = 'combat',
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
 * Consolidated Experience object
 */
export interface ShipExperience {
  current?: number;
  total?: number;
  level: number; // From FactionCombatUnit & PlayerShipStats
  skills?: string[]; // From FactionCombatUnit
}

/**
 * Core Ship Interface - Holds common properties.
 * Category-specific details are in the 'details' discriminated union.
 */
export interface Ship {
  id: string;
  name: string;
  category: ShipCategory;
  status: ShipStatus;
  position: Position;
  rotation?: number;
  velocity?: Velocity;
  faction: FactionId;
  tier: Tier;
  experience: ShipExperience;
  fuel: number;
  maxFuel: number;
  crew: number;
  maxCrew: number;
  cargo: ShipCargo;
  stats: CommonShipStats;
  capabilities?: Partial<CommonShipCapabilities>;
  details: ShipDetails | null; // Discriminated union for specific details
}

// --- DETAILS INTERFACES --- Keep these minimal with only category-specific fields

export interface CombatShipDetails {
  category: ShipCategory.combat | ShipCategory.FIGHTER | ShipCategory.CRUISER | ShipCategory.BATTLESHIP | ShipCategory.CARRIER;
  class?: FactionShipClass | PlayerShipClass;
  combatDetails?: CombatStatsDetails; // Update reference to renamed interface
  tactics?: FactionBehaviorConfig;
  formation?: { type: 'offensive' | 'defensive' | 'balanced'; spacing: number; facing: number; };
  specialAbility?: { name: string; description: string; cooldown: number; active: boolean; effectiveness?: number; };
  techBonuses?: { weaponEfficiency?: number; shieldRegeneration?: number; energyEfficiency?: number; };
  combatStats?: { damageDealt: number; damageReceived: number; killCount: number; assistCount: number; };
  combatStatusDetail?: { main: 'active' | 'disabled' | 'destroyed'; secondary?: 'charging' | 'cooling' | 'repairing' | 'boosting'; effects?: string[]; };
}

export interface MiningShipDetails {
  category: ShipCategory.MINING;
  class?: PlayerShipClass.ROCK_BREAKER | PlayerShipClass.VOID_DREDGER | FactionShipClass;
  currentLoad?: number;
  targetNode?: string;
  efficiency?: number;
}

export interface ReconShipDetails {
  category: ShipCategory.RECON | ShipCategory.SCOUT;
  class?: PlayerShipClass.ANDROMEDA_CUTTER | PlayerShipClass.STAR_SCHOONER | FactionShipClass;
  // ExplorationHub-specific tracking?
  efficiency?: number;
  lastUpdate?: number;
  // Use ReconCapabilities defined earlier for specific scanning/stealth properties
  reconCapabilities?: ReconCapabilities;
  assignedSectorId?: string;
  targetSector?: string;
  currentTask?: { type: string; target: string; progress: number; };
  discoveries?: { mappedSectors: number; anomaliesFound: number; resourcesLocated: number; };
  stealth?: { active: boolean; level: number; cooldown: number; };
  sensors?: { range: number; accuracy: number; anomalyDetection: number; };
}

export interface TransportShipDetails {
  category: ShipCategory.TRANSPORT;
  // Add transport-specific details if any arise
}

// Discriminated union type for ship details
export type ShipDetails =
  | CombatShipDetails
  | MiningShipDetails
  | ReconShipDetails
  | TransportShipDetails;

// --- Define Specific Capabilities for Recon Ships ---
export interface ReconCapabilities extends Partial<CommonShipCapabilities> {
  // Assuming these are core capabilities, make non-optional initially
  scanning: number;
  stealth: number;
  combat?: number;      // Optional combat capability value
  stealthActive?: boolean; // Optional flag for active stealth
  speed?: number;         // Optional speed override/detail
  range?: number;         // Optional range override/detail
  cargo?: number;         // Optional cargo override/detail
  weapons?: number;       // Optional weapons override/detail
  // Inherits canScan, canJump, etc. from CommonShipCapabilities via extends Partial<...>
}

// --- Define Specific Ship Type Aliases ---

/**
 * Represents a ship specifically identified as a Recon ship.
 */
export type ReconShip = Ship & { details: ReconShipDetails };

/**
 * Represents a summarized view of a ship, suitable for lists.
 */
export interface ShipSummary {
  id: string;
  name: string;
  category: ShipCategory;
  status: ShipStatus;
  tier: Tier; // Added Tier for potential list filtering/display
}

// Update Type Guards to use the new structure

// Weapon Data Source Types
export interface BlueprintWeaponData {
  name: string;
  damage: number;
  range: number;
  cooldown: number;
  [key: string]: unknown;
}
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

export function isCombatShip(ship: Ship): ship is Ship & { details: CombatShipDetails } {
  return (
    ship.details !== null && (
      ship.details.category === ShipCategory.combat ||
      ship.details.category === ShipCategory.FIGHTER ||
      ship.details.category === ShipCategory.CRUISER ||
      ship.details.category === ShipCategory.BATTLESHIP ||
      ship.details.category === ShipCategory.CARRIER
    )
  );
}

export function isMiningShip(ship: Ship): ship is Ship & { details: MiningShipDetails } {
  return ship.details !== null && ship.details.category === ShipCategory.MINING;
}

export function isReconShip(ship: Ship): ship is Ship & { details: ReconShipDetails } {
  return ship.details !== null && (ship.details.category === ShipCategory.RECON || ship.details.category === ShipCategory.SCOUT);
}

export function isTransportShip(ship: Ship): ship is Ship & { details: TransportShipDetails } {
  return ship.details !== null && ship.details.category === ShipCategory.TRANSPORT;
}

/**
 * Tier type
 */
// Removed duplicate export

/**
 * Combat-specific detailed stats, kept separate for complexity reduction.
 */
export interface CombatStatsDetails {
  armor: number;
  accuracy: number;
  evasion: number;
  // Add other combat stats as needed
}

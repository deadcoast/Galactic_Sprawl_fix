import { Tier } from '../core/GameTypes';
// Import ShipStatus from CommonShipTypes to break circular dependency with ShipTypes
import { CommonShipAbility, CommonShipDisplayStats, CommonShipStats, ShipStatus } from './CommonShipTypes';

// Player Ship Classes - Changed from type alias to enum
export enum PlayerShipClass {
  HARBRINGER_GALLEON = 'harbringer-galleon',
  MIDWAY_CARRIER = 'midway-carrier',
  MOTHER_EARTH_REVENGE = 'mother-earth-revenge',
  ORION_FRIGATE = 'orion-frigate',
  SPITFLARE = 'spitflare',
  STAR_SCHOONER = 'star-schooner',
  VOID_DREDGER_MINER = 'void-dredger-miner',
  ANDROMEDA_CUTTER = 'andromeda-cutter',
  // Add placeholder/default if needed
  SCOUT = 'scout', // Added SCOUT based on usage in ShipHangar.tsx
  FIGHTER = 'fighter', // Added FIGHTER based on usage in ShipHangar.tsx
  CRUISER = 'cruiser', // Added CRUISER based on usage in ShipHangar.tsx
  // Add the specific mining ship classes
  ROCK_BREAKER = 'rock-breaker', // Added MS-RB12G
  VOID_DREDGER = 'void-dredger', // Added MVVD (Note: VOID_DREDGER_MINER already exists, clarify if VOID_DREDGER is separate or rename existing)
}

// Player Ship Categories
export type PlayerShipCategory = 'combat' | 'recon' | 'mining';

// Fighter state (relevant for carriers)
export interface Fighter {
  id: string;
  status: 'docked' | 'deployed' | 'returning' | 'lost';
  health: number;
  // Add maxHealth or other relevant fighter stats if needed
}

// Docking Bay state (relevant for specific carriers/motherships)
export interface DockingBay {
  id: string;
  type: 'fighter' | 'frigate' | 'carrier';
  status: 'empty' | 'occupied' | 'launching' | 'docking';
  shipId?: string;
}

// Player Ship Stats
export interface PlayerShipStats extends CommonShipStats {
  experience: number;
  level: number;
  tier: Tier;
  // Add optional carrier-specific stats here
  maxFighters?: number;
  repairRate?: number;
  /** Optional stealth rating (0-100) */
  stealth?: number;
}

// Player Ship Ability
export interface PlayerShipAbility extends CommonShipAbility {
  unlockLevel: number;
  tier: Tier;
}

// Player Ship Display Stats (for UI)
export type PlayerShipDisplayStats = CommonShipDisplayStats;

// Player Ship Interface
export interface PlayerShip /* extends CommonShip */ {
  // Redefine common properties needed from CommonShip
  id: string;
  name: string;
  category: string; // Or PlayerShipCategory?
  position: { x: number; y: number };
  rotation?: number;
  // Add FactionId if needed from CommonShip
  // faction?: FactionId;
  // Add PlayerShip specific properties
  class: PlayerShipClass;
  // Use UnifiedShipStatus
  status: ShipStatus;
  stats: PlayerShipStats;
  abilities: PlayerShipAbility[];
  upgrades: string[];
  fighters?: Fighter[]; // Add optional fighters list
  dockingBays?: DockingBay[]; // Add optional dockingBays list
  alerts?: string[]; // ADD optional alerts here
  /** Currently assigned task identifier */
  currentTask?: string;
}

// Player Ship Config
export interface PlayerShipConfig {
  id: string;
  name: string;
  class: PlayerShipClass;
  tier: Tier;
  baseStats: PlayerShipStats;
  visualAsset: string;
}

// Player Ship Component Props
export interface PlayerShipProps {
  ship: PlayerShip;
  onFire?: () => void;
  onAbility?: () => void;
  onUpgrade?: () => void;
  className?: string;
}

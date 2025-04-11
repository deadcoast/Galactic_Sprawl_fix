import { Tier } from '../core/GameTypes';
import { CommonShipAbility, CommonShipDisplayStats, CommonShipStats } from './CommonShipTypes';
import { UnifiedShipStatus } from './UnifiedShipTypes';

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
export type PlayerShipCategory = 'war' | 'recon' | 'mining';

// Player Ship Stats
export interface PlayerShipStats extends CommonShipStats {
  experience: number;
  level: number;
  tier: Tier;
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
  status: UnifiedShipStatus;
  stats: PlayerShipStats;
  abilities: PlayerShipAbility[];
  upgrades: string[];
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

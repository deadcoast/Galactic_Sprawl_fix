import { Tier } from '../core/GameTypes';
import {
  CommonShip,
  CommonShipAbility,
  CommonShipDisplayStats,
  CommonShipStats,
} from './CommonShipTypes';

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
}

// Player Ship Categories
export type PlayerShipCategory = 'war' | 'recon' | 'mining';

// Player Ship Status
export type PlayerShipStatus = 'ready' | 'engaging' | 'patrolling' | 'retreating' | 'disabled';

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
export interface PlayerShip extends CommonShip {
  class: PlayerShipClass;
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

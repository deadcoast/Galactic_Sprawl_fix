import { BaseStats } from '../core/GameTypes';
import { CombatWeaponStats, WeaponInstance, WeaponMount, WeaponType } from '../weapons/WeaponTypes';

/**
 * Base ship type interface
 */
export interface ShipType {
  id: string;
  name: string;
  class: string;
  visualAsset: string;
  baseStats: BaseStats;
  weapons: WeaponMount[];
}

/**
 * Extended ship stats interface
 */
export interface ShipStats extends BaseStats {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  speed: number;
  maneuverability: number;
  cargo: number;
  weapons?: {
    primary: WeaponInstance;
    secondary?: WeaponInstance[];
    stats: CombatWeaponStats;
  };
}

/**
 * Ship loadout configuration
 */
export interface ShipLoadout {
  weapons: WeaponMount[];
  upgrades: string[];
  weaponTypes?: WeaponType[];
}

/**
 * All possible ship status states
 */
export type ShipStatus =
  | 'idle'
  | 'ready'
  | 'engaging'
  | 'patrolling'
  | 'retreating'
  | 'disabled'
  | 'damaged';

/**
 * Type alias for ship categories/classes used for differentiation
 */
export type ShipCategory =
  | 'scout'
  | 'fighter'
  | 'cruiser'
  | 'battleship'
  | 'carrier'
  | 'transport';

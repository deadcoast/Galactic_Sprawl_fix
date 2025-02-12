import { WeaponType } from './CombatTypes';
import { FactionId } from './FactionTypes';

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
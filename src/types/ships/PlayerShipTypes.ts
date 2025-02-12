import { Tier } from "../core/GameTypes";
import {
  CommonShip,
  CommonShipAbility,
  CommonShipDisplayStats,
  CommonShipStats,
} from "./CommonShipTypes";

// Player Ship Classes
export type PlayerShipClass =
  | "harbringer-galleon"
  | "midway-carrier"
  | "mother-earth-revenge"
  | "orion-frigate"
  | "spitflare"
  | "star-schooner"
  | "void-dredger-miner"
  | "andromeda-cutter";

// Player Ship Categories
export type PlayerShipCategory = "war" | "recon" | "mining";

// Player Ship Status
export type PlayerShipStatus =
  | "ready"
  | "engaging"
  | "patrolling"
  | "retreating"
  | "disabled";

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

import { Tier } from "../../types/core/GameTypes";
import {
  CommonShip,
  CommonShipAbility,
  CommonShipDisplayStats,
  CommonShipStats,
} from "../../types/ships/CommonShipTypes";

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
export interface FactionShip extends CommonShip {
  faction: FactionId;
  class: FactionShipClass;
  stats: FactionShipStats;
  abilities: FactionShipAbility[];
  tactics: "aggressive" | "defensive" | "hit-and-run";
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

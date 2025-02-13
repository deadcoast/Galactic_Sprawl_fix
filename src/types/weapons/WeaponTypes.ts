import { Effect, Tier } from "../core/GameTypes";

// Weapon Categories
export type WeaponCategory =
  | "machineGun"
  | "gaussCannon"
  | "railGun"
  | "mgss"
  | "rockets"
  | "pointDefense"
  | "flakCannon"
  | "capitalLaser"
  | "torpedoes";

export type WeaponMountSize = "small" | "medium" | "large";
export type WeaponMountPosition = "front" | "side" | "turret";
export type WeaponStatus = "ready" | "charging" | "cooling" | "disabled";
export type WeaponUpgradeType =
  | "plasma"
  | "spark"
  | "gauss"
  | "light"
  | "maurader"
  | "engine"
  | "slug"
  | "empr"
  | "swarm"
  | "bigBang";

// Weapon Stats
export interface WeaponStats {
  damage: number;
  range: number;
  accuracy: number;
  rateOfFire: number;
  energyCost: number;
  cooldown: number;
  effects: Effect[];
}

export interface WeaponEffect {
  name: string;
  description: string;
  active: boolean;
  cooldown: number;
}

// Weapon Mount Configuration
export interface WeaponMount {
  id: string;
  type?: WeaponCategory;
  size: WeaponMountSize;
  position: WeaponMountPosition;
  rotation: number;
  allowedCategories: WeaponCategory[];
  currentWeapon?: WeaponInstance;
}

// Weapon Configuration
export interface WeaponConfig {
  id: string;
  name: string;
  category: WeaponCategory;
  tier: Tier;
  baseStats: WeaponStats;
  visualAsset: string;
  mountRequirements: {
    size: WeaponMountSize;
    power: number;
  };
}

export interface WeaponState {
  status: WeaponStatus;
  currentStats: WeaponStats;
  effects: Effect[];
  currentAmmo?: number;
  maxAmmo?: number;
}

export interface WeaponInstance {
  config: WeaponConfig;
  state: WeaponState;
}

export interface WeaponUpgrade {
  id: string;
  name: string;
  type: WeaponUpgradeType;
  description: string;
  stats: Partial<WeaponStats>;
  specialEffect?: {
    name: string;
    description: string;
  };
  requirements: {
    tech: string[];
    resources: { type: string; amount: number }[];
  };
  unlocked: boolean;
}

export interface WeaponSystemProps {
  weapon: WeaponInstance;
  availableUpgrades?: WeaponUpgrade[];
  resources?: Record<string, number>;
  onFire?: (weaponId: string) => void;
  onUpgrade?: (upgradeId: string) => void;
  onToggleEffect?: (effectName: string) => void;
}

// Weapon Colors for UI
export const WEAPON_COLORS: Record<WeaponCategory, string> = {
  machineGun: "cyan",
  gaussCannon: "violet",
  railGun: "indigo",
  mgss: "fuchsia",
  rockets: "rose",
  pointDefense: "lime",
  flakCannon: "yellow",
  capitalLaser: "orange",
  torpedoes: "red",
} as const;

export const UPGRADE_COLORS: Record<WeaponUpgradeType, string> = {
  plasma: "cyan",
  spark: "cyan",
  gauss: "violet",
  light: "violet",
  maurader: "indigo",
  engine: "indigo",
  slug: "fuchsia",
  empr: "rose",
  swarm: "rose",
  bigBang: "rose",
} as const;

import { Effect } from "../core/GameTypes";

// Effect Types
// ------------------------------------------------------------

/**
 * Base weapon damage effect
 */
export interface WeaponDamageEffect extends Effect {
  damage: number;
  active: boolean;
  cooldown: number;
}

/**
 * Area of effect weapon damage
 */
export interface WeaponAreaEffect extends Effect {
  damage: number;
  radius: number;
  active: boolean;
  cooldown: number;
}

export type WeaponEffectType = WeaponDamageEffect | WeaponAreaEffect;

// Base Types
// ------------------------------------------------------------

/**
 * All available weapon categories
 */
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

/**
 * Specific weapon variants within each category
 */
export type WeaponVariant =
  // Machine Gun variants
  | "basic"
  | "plasmaRounds"
  | "sparkRounds"
  // Gauss Cannon variants
  | "gaussPlaner"
  | "recirculatingGauss"
  // Rail Gun variants
  | "lightShot"
  | "maurader"
  // MGSS variants
  | "engineAssistedSpool"
  | "slugMGSS"
  // Rocket variants
  | "emprRockets"
  | "swarmRockets"
  | "bigBangRockets";

// Mount Configuration
// ------------------------------------------------------------

export type WeaponMountSize = "small" | "medium" | "large";
export type WeaponMountPosition = "front" | "side" | "turret";
export type WeaponStatus = "ready" | "charging" | "cooling" | "disabled";

// Upgrade Types
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

// Core Interfaces
// ------------------------------------------------------------

/**
 * Base weapon type interface
 */
export interface WeaponType {
  category: WeaponCategory;
  variant: WeaponVariant;
  visualAsset: string;
  stats: CombatWeaponStats;
}

/**
 * Base weapon stats common to all weapons
 */
export interface BaseWeaponStats {
  damage: number;
  range: number;
  accuracy: number;
  rateOfFire: number;
  energyCost: number;
  cooldown: number;
  effects: WeaponEffectType[];
}

/**
 * Extended weapon stats for combat
 */
export interface CombatWeaponStats extends BaseWeaponStats {
  special?: {
    armorPenetration?: number;
    shieldDamageBonus?: number;
    areaOfEffect?: number;
    disableChance?: number;
  };
}

/**
 * Weapon effect interface
 */
export interface WeaponEffect extends Effect {
  active: boolean;
  cooldown: number;
  damage?: number;
  radius?: number;
  sourceWeaponId?: string;  // Added from EffectTypes.ts
}

// Mount and Configuration
// ------------------------------------------------------------

/**
 * Weapon mount configuration
 */
export interface WeaponMount {
  id: string;
  type?: WeaponCategory;
  size: WeaponMountSize;
  position: WeaponMountPosition;
  rotation: number;
  allowedCategories: WeaponCategory[];
  currentWeapon?: WeaponInstance;
}

/**
 * Weapon configuration
 */
export interface WeaponConfig {
  id: string;
  name: string;
  category: WeaponCategory;
  variant?: WeaponVariant;
  tier: number;
  baseStats: CombatWeaponStats;
  visualAsset: string;
  mountRequirements: {
    size: WeaponMountSize;
    power: number;
  };
  requirements?: {
    tech: string[];
    resources: { type: string; amount: number }[];
  };
}

// State and Instance
// ------------------------------------------------------------

/**
 * Weapon state
 */
export interface WeaponState {
  status: WeaponStatus;
  currentStats: CombatWeaponStats;
  effects: Effect[];
  currentAmmo?: number;
  maxAmmo?: number;
}

/**
 * Runtime weapon instance
 */
export interface WeaponInstance {
  config: WeaponConfig;
  state: WeaponState;
}

// Upgrade System
// ------------------------------------------------------------

/**
 * Weapon upgrade configuration
 */
export interface WeaponUpgrade {
  id: string;
  name: string;
  type: WeaponUpgradeType;
  description: string;
  stats: Partial<CombatWeaponStats>;
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

// Component Props
// ------------------------------------------------------------

/**
 * Props for weapon system components
 */
export interface WeaponSystemProps {
  weapon: WeaponInstance;
  availableUpgrades?: WeaponUpgrade[];
  resources?: Record<string, number>;
  onFire?: (weaponId: string) => void;
  onUpgrade?: (upgradeId: string) => void;
  onToggleEffect?: (effectName: string) => void;
}

// UI Constants
// ------------------------------------------------------------

/**
 * Color mapping for weapon categories in UI
 */
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

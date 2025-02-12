import { Effect, Position, Tier } from "../core/GameTypes";

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

// Weapon Mount Types
export type MountSize = "small" | "medium" | "large";

// Weapon Stats
export interface WeaponStats {
  damage: number;
  range: number;
  accuracy: number;
  rateOfFire: number;
  energyCost: number;
  cooldown: number;
  effects?: Effect[];
}

// Weapon Mount Configuration
export interface WeaponMount {
  id: string;
  type?: WeaponCategory; // Optional for backward compatibility
  size: MountSize;
  position: Position;
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
    size: MountSize;
    power: number;
    crew: number;
  };
}

// Weapon State
export interface WeaponState {
  status: "ready" | "charging" | "cooling" | "disabled";
  currentStats: WeaponStats;
  currentAmmo?: number;
  maxAmmo?: number;
  lastFired?: number;
}

// Weapon Instance (combines config and state)
export interface WeaponInstance {
  config: WeaponConfig;
  state: WeaponState;
}

// Weapon Component Props
export interface WeaponComponentProps {
  weapon: WeaponInstance;
  onFire: () => void;
  onReload?: () => void;
  onToggleAutofire?: () => void;
}

// Weapon Upgrade
export interface WeaponUpgrade {
  id: string;
  name: string;
  description: string;
  stats: Partial<WeaponStats>;
  cost: {
    resources: number;
    energy: number;
  };
  requirements: {
    tier: Tier;
    research?: string[];
  };
}

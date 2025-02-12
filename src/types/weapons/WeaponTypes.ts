export type WeaponCategory =
  | "machineGun"
  | "gaussCannon"
  | "railGun"
  | "mgss"
  | "rockets";
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

export interface WeaponStats {
  damage: number;
  range: number;
  accuracy: number;
  rateOfFire: number;
  energyCost: number;
}

export interface WeaponEffect {
  name: string;
  description: string;
  active: boolean;
  cooldown: number;
}

export interface WeaponMount {
  id: string;
  size: WeaponMountSize;
  position: WeaponMountPosition;
  currentWeapon?: WeaponInstance;
}

export interface WeaponConfig {
  id: string;
  name: string;
  category: WeaponCategory;
  tier: 1 | 2 | 3;
  baseStats: WeaponStats;
  requirements: {
    power: number;
    crew: number;
    mountSize: WeaponMountSize;
  };
  visualAsset?: string;
}

export interface WeaponState {
  status: WeaponStatus;
  currentStats: WeaponStats;
  effects: WeaponEffect[];
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

export const WEAPON_COLORS: Record<WeaponCategory, string> = {
  machineGun: "cyan",
  gaussCannon: "violet",
  railGun: "indigo",
  mgss: "fuchsia",
  rockets: "rose",
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

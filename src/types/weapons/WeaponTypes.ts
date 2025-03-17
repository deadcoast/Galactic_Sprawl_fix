/**
 * Core weapon types and interfaces
 * @module WeaponTypes
 */

import {
  AreaEffect,
  DamageEffect,
  WeaponEffect,
  WeaponEffectType,
} from '../../effects/types_effects/WeaponEffects';
import { ResourceType } from '../resources/ResourceTypes';

export type { AreaEffect, DamageEffect, WeaponEffect, WeaponEffectType };

// Base Types
// ------------------------------------------------------------

/**
 * All available weapon categories
 */
export type WeaponCategory =
  | 'machineGun'
  | 'gaussCannon'
  | 'railGun'
  | 'mgss'
  | 'rockets'
  | 'pointDefense'
  | 'flakCannon'
  | 'capitalLaser'
  | 'torpedoes'
  | 'harmonicCannon'
  | 'temporalCannon'
  | 'quantumCannon'
  | 'plasmaCannon'
  | 'beamWeapon'
  | 'pulseWeapon'
  | 'disruptor'
  | 'ionCannon';

/**
 * Specific weapon variants within each category
 */
export type WeaponVariant =
  // Machine Gun variants
  | 'basic'
  | 'plasmaRounds'
  | 'sparkRounds'
  // Gauss Cannon variants
  | 'gaussPlaner'
  | 'recirculatingGauss'
  // Rail Gun variants
  | 'lightShot'
  | 'maurader'
  // MGSS variants
  | 'engineAssistedSpool'
  | 'slugMGSS'
  // Rocket variants
  | 'emprRockets'
  | 'swarmRockets'
  | 'bigBangRockets';

/**
 * Weapon mount sizes
 */
export type WeaponMountSize = 'small' | 'medium' | 'large';

/**
 * Weapon mount positions
 */
export type WeaponMountPosition = 'front' | 'side' | 'rear' | 'turret';

/**
 * Weapon operational status
 */
export type WeaponStatus = 'ready' | 'charging' | 'cooling' | 'disabled';

// Upgrade Types
export type WeaponUpgradeType =
  | ResourceType.PLASMA
  | 'spark'
  | 'gauss'
  | 'light'
  | 'maurader'
  | 'engine'
  | 'slug'
  | 'empr'
  | 'swarm'
  | 'bigBang';

// Core Interfaces
// ------------------------------------------------------------

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
  special?: {
    armorPenetration?: number;
    shieldDamageBonus?: number;
    areaOfEffect?: number;
    disableChance?: number;
  };
}

/**
 * Extended weapon stats with effects
 */
export interface WeaponStats extends BaseWeaponStats {
  effects: WeaponEffectType[];
  special?: {
    armorPenetration?: number;
    shieldDamageBonus?: number;
    areaOfEffect?: number;
    disableChance?: number;
  };
}

/**
 * Base weapon type interface
 */
export interface WeaponType {
  id: string;
  category: WeaponCategory;
  variant: WeaponVariant;
  visualAsset: string;
  baseStats: BaseWeaponStats;
}

/**
 * Extended weapon stats for combat
 */
export interface CombatWeaponStats extends WeaponStats {
  currentAmmo?: number;
  maxAmmo?: number;
  reloadTime?: number;
  spread?: number;
  projectileSpeed?: number;
  projectileLifetime?: number;
}

// Mount and Configuration
// ------------------------------------------------------------

/**
 * Weapon mount configuration
 */
export interface WeaponMount {
  id: string;
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
  tier: number;
  baseStats: WeaponStats;
  visualAsset: string;
  mountRequirements: {
    size: WeaponMountSize;
    power: number;
  };
  requirements?: {
    tech: string[];
    resources: string[];
  };
}

// State and Instance
// ------------------------------------------------------------

/**
 * Current state of a weapon
 */
export interface WeaponState {
  status: WeaponStatus;
  currentStats: WeaponStats;
  effects: WeaponEffectType[];
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
  machineGun: 'cyan',
  gaussCannon: 'violet',
  railGun: 'indigo',
  mgss: 'fuchsia',
  rockets: 'orange',
  pointDefense: 'yellow',
  flakCannon: 'amber',
  capitalLaser: 'red',
  torpedoes: 'blue',
  harmonicCannon: 'emerald',
  temporalCannon: 'purple',
  quantumCannon: 'sky',
  plasmaCannon: 'rose',
  beamWeapon: 'pink',
  pulseWeapon: 'lime',
  disruptor: 'teal',
  ionCannon: 'cyan',
} as const;

export const UPGRADE_COLORS: Record<WeaponUpgradeType, string> = {
  [ResourceType.PLASMA]: 'cyan',
  spark: 'cyan',
  gauss: 'violet',
  light: 'violet',
  maurader: 'indigo',
  engine: 'indigo',
  slug: 'fuchsia',
  empr: 'rose',
  swarm: 'rose',
  bigBang: 'rose',
} as const;

export interface WeaponSystem {
  id: string;
  type: WeaponCategory;
  damage: number;
  range: number;
  cooldown: number;
  status: WeaponStatus;
  upgrades?: {
    name: string;
    description: string;
    unlocked: boolean;
  }[];
}

/**
 * Weapon upgrade types and interfaces
 * @module WeaponUpgrades
 */

import { BaseWeaponStats, WeaponCategory, WeaponVariant, WeaponUpgrade, WeaponUpgradeType, DamageEffect, AreaEffect } from "./WeaponTypes";
import { WeaponEffectType } from "../../effects/types_effects/WeaponEffects";

// Upgrade Types
// ------------------------------------------------------------

/**
 * Available upgrade tiers
 */
export type UpgradeTier = 1 | 2 | 3;

/**
 * Resource requirements for upgrades
 */
export interface UpgradeRequirements {
  credits: number;
  materials: number;
  tier: UpgradeTier;
}

/**
 * Stat changes applied by an upgrade
 */
export interface UpgradeStats extends Partial<BaseWeaponStats> {
  effects?: (DamageEffect | AreaEffect)[];
}

// Upgrade Collections
// ------------------------------------------------------------

/**
 * Collection of upgrades available for a weapon
 */
export interface AvailableUpgrades {
  tier1: WeaponUpgrade[];
  tier2: WeaponUpgrade[];
  tier3: WeaponUpgrade[];
}

/**
 * Upgrade state for a weapon instance
 */
export interface WeaponUpgradeState {
  appliedUpgrades: WeaponUpgrade[];
  availableUpgrades: AvailableUpgrades;
  currentTier: UpgradeTier;
} 
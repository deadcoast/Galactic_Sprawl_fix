import { BaseStats, Effect } from '../core/GameTypes';
import {
  WeaponMount,
  WeaponCategory,
  CombatWeaponStats,
  WeaponType as WeaponTypeBase,
} from '../weapons/WeaponTypes';
import { Tier } from '../core/GameTypes';
import { ResourceCost } from '../resources/ResourceTypes';

// Ship Type Interface
export interface ShipType {
  type: string;
}

// Ship Categories
export type ShipCategory = 'war' | 'recon' | 'mining';

// Re-export weapon type for backward compatibility
export type WeaponType = WeaponTypeBase;

// Ship Status
export type ShipStatus =
  | 'ready'
  | 'engaging'
  | 'patrolling'
  | 'retreating'
  | 'disabled'
  | 'damaged'
  | 'repairing'
  | 'upgrading';

// Common Ship Stats Interface
export interface CommonShipStats extends BaseStats {
  energy: number;
  maxEnergy: number;
  speed: number;
  turnRate: number;
  cargo: number;
  weapons: WeaponMount[];
  abilities: CommonShipAbility[];
  defense: {
    armor: number;
    shield: number;
    evasion: number;
    regeneration?: number;
  };
  mobility: {
    speed: number;
    turnRate: number;
    acceleration: number;
  };
}

// Common Weapon Stats
export interface CommonWeaponStats {
  damage: number;
  range: number;
  accuracy: number;
  rateOfFire: number;
  energyCost: number;
  cooldown: number;
  effects: Effect[];
}

// Common Ship Ability Interface
export interface CommonShipAbility {
  name: string;
  description: string;
  cooldown: number;
  duration: number;
  active: boolean;
  effect: Effect;
}

// Common Display Stats Interface (for UI components)
export interface CommonShipDisplayStats {
  weapons: {
    damage: number;
    range: number;
    accuracy: number;
  };
  defense: {
    hull: number;
    shield: number;
    armor: number;
  };
  mobility: {
    speed: number;
    agility: number;
    jumpRange: number;
  };
  systems: {
    power: number;
    radar: number;
    efficiency: number;
  };
}

// Base Ship Interface
export interface CommonShip {
  id: string;
  name: string;
  category: ShipCategory;
  status: ShipStatus;
  stats: CommonShipStats;
  abilities: CommonShipAbility[];
  officerBonuses?: {
    buildSpeed?: number;
    resourceEfficiency?: number;
    combatEffectiveness?: number;
  };
}

// Common Ship Capabilities
export interface CommonShipCapabilities {
  canSalvage: boolean;
  canScan: boolean;
  canMine: boolean;
  canJump: boolean;
}

// Common utility functions
export function getShipCategory(type: string): ShipCategory {
  if (type.toLowerCase().includes('war') || type.toLowerCase().includes('combat')) {
    return 'war';
  }
  if (type.toLowerCase().includes('recon') || type.toLowerCase().includes('scout')) {
    return 'recon';
  }
  return 'mining';
}

export function getDefaultCapabilities(category: ShipCategory): CommonShipCapabilities {
  switch (category) {
    case 'war':
      return {
        canSalvage: false,
        canScan: false,
        canMine: false,
        canJump: true,
      };
    case 'recon':
      return {
        canSalvage: true,
        canScan: true,
        canMine: false,
        canJump: true,
      };
    case 'mining':
      return {
        canSalvage: true,
        canScan: false,
        canMine: true,
        canJump: false,
      };
  }
}

export interface ShipUpgradeStats {
  hull: {
    current: number;
    upgraded: number;
  };
  shield: {
    current: number;
    upgraded: number;
  };
  weapons: {
    current: number;
    upgraded: number;
  };
  speed: {
    current: number;
    upgraded: number;
  };
}

export interface ShipUpgradeRequirement {
  type: 'tech' | 'resource' | 'facility';
  name: string;
  met: boolean;
}

export interface ShipVisualUpgrade {
  name: string;
  description: string;
  preview: string;
}

export interface ShipUpgradeInfo {
  shipId: string;
  tier: Tier;
  upgradeAvailable: boolean;
  requirements: ShipUpgradeRequirement[];
  stats: ShipUpgradeStats;
  resourceCost: ResourceCost[];
  visualUpgrades: ShipVisualUpgrade[];
}

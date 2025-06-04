import { Effect, Tier } from '../core/GameTypes';
import { ResourceCost } from '../resources/ResourceTypes';
import { WeaponMount, WeaponType as WeaponTypeBase } from '../weapons/WeaponTypes';
import { ResourceType } from './../resources/ResourceTypes';

// Ship Type Interface
export interface ShipType {
  type: ResourceType;
}

// Ship Categories
export type ShipCategory = 'combat' | 'mining' | 'recon' | 'transport' | 'support' | 'utility';

// Re-export weapon type for backcompatibility
export type WeaponType = WeaponTypeBase;

// Ship Status - Changed from type alias to enum
export enum ShipStatus {
  IDLE = 'idle',
  MOVING = 'moving',
  MINING = 'mining',
  SCANNING = 'scanning',
  ENGAGING = 'engaging',
  REPAIRING = 'repairing',
  UPGRADING = 'upgrading',
  DAMAGED = 'damaged',
  DESTROYED = 'destroyed',
  READY = 'ready',
  ASSIGNED = 'assigned', // Added for task assignment status
  RETURNING = 'returning', // Added based on usage
  ATTACKING = 'attacking', // Added based on usage
  WITHDRAWING = 'withdrawing', // Added based on usage
  DISABLED = 'disabled', // Added based on usage
  MAINTENANCE = 'maintenance', // Added for faction base mapping
  INVESTIGATING = 'investigating', // Added for faction base mapping
}

// Common Ship Stats Interface
export interface CommonShipStats {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  speed: number;
  turnRate: number;
  cargo?: number | ShipCargo;
  weapons: WeaponMount[];
  abilities: CommonShipAbility[];
  defense: {
    armor: number;
    shield: number;
    evasion: number;
    regeneration: number;
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
  id: string;
  name: string;
  description: string;
  cooldown: number;
  duration: number;
  active: boolean;
  effect: {
    id: string;
    name: string;
    description: string;
    type: string;
    magnitude: number;
    duration: number;
    active?: boolean;
    cooldown?: number;
  };
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
  officerBonuses?: {
    buildSpeed?: number;
    resourceEfficiency?: number;
    combatEffectiveness?: number;
  };
  [key: string]: any; // Allow additional properties
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
  if (type.toLowerCase().includes('combat') || type.toLowerCase().includes('combat')) {
    return 'combat';
  }
  if (type.toLowerCase().includes('recon') || type.toLowerCase().includes('scout')) {
    return 'recon';
  }
  return 'mining';
}

export function getDefaultCapabilities(category: ShipCategory): CommonShipCapabilities {
  switch (category) {
    case 'combat':
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
    // Add cases for transport, support, utility if specific defaults are needed
    default:
      // Ensure exhaustive check or throw error for unhandled categories
      throw new Error(`Unhandled ship category: ${category}`);
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

// Define ShipCargo interface
export interface ShipCargo {
  capacity: number;
  resources: Map<ResourceType, number>;
}

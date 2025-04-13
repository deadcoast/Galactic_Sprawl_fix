import { Effect } from '../core/GameTypes';
import { FactionShipClass } from '../ships/FactionShipTypes';
import { FactionId } from '../ships/FactionTypes';
import {
  CombatWeaponStats,
  WeaponCategory,
  WeaponConfig,
  WeaponEffect,
  WeaponInstance,
  WeaponMount,
  WeaponSystem,
  WeaponType,
  WeaponVariant,
} from '../weapons/WeaponTypes';

// Re-export weapon types for backcombatd compatibility
export type {
  WeaponCategory,
  WeaponConfig,
  WeaponEffect,
  WeaponInstance,
  WeaponMount,
  CombatWeaponStats as WeaponStats,
  WeaponType,
  WeaponVariant,
};

// Combat-specific types
export type CombatUnitStatus = {
  main: 'active' | 'disabled' | 'destroyed';
  secondary?: 'charging' | 'cooling' | 'repairing' | 'boosting';
  effects: string[];
};

export interface CombatUnit {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  rotation: number;
  velocity: {
    x: number;
    y: number;
  };
  status: CombatUnitStatus;
  weapons: WeaponSystem[];
  stats: {
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    armor: number;
    speed: number;
    turnRate: number;
  };
}

export interface CombatState {
  units: CombatUnit[];
  projectiles: Projectile[];
  effects: CombatEffect[];
}

export interface Projectile {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  damage: number;
  effects: Effect[];
  sourceId: string;
  targetId?: string;
}

export interface CombatEffect {
  id: string;
  type: string;
  position: { x: number; y: number };
  radius: number;
  duration: number;
  remainingTime: number;
  effects: Effect[];
}

export interface CombatResult {
  winner?: string;
  duration: number;
  damageDone: Record<string, number>;
  unitsLost: Record<string, number>;
  effectsTriggered: Record<string, number>;
}

export interface FactionCombatUnit extends CombatUnit {
  faction: FactionId;
  class: FactionShipClass;
  tactics: {
    formation: string;
    behavior: string;
    target?: string;
  };
  weaponMounts: WeaponMount[];
  formation: {
    type: 'offensive' | 'defensive' | 'balanced';
    spacing: number;
    facing: number;
    position: number;
  };
  stats: {
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    armor: number;
    speed: number;
    turnRate: number;
    accuracy: number;
    evasion: number;
    criticalChance: number;
    criticalDamage: number;
    armorPenetration: number;
    shieldPenetration: number;
    experience: number;
    level: number;
  };
  experience: {
    current: number;
    total: number;
    level: number;
    skills: {
      name: string;
      level: number;
    }[];
  };
  status: {
    main: 'active' | 'disabled' | 'destroyed';
    secondary?: 'charging' | 'cooling' | 'repairing' | 'boosting';
    effects: string[];
  };
}

export interface FleetFormation {
  type: 'offensive' | 'defensive' | 'balanced';
  pattern: 'spearhead' | 'shield' | 'diamond' | 'arrow' | 'circle' | 'wedge' | 'line' | 'scattered';
  spacing: number;
  facing: number;
  adaptiveSpacing: boolean;
  transitionSpeed: number;
}

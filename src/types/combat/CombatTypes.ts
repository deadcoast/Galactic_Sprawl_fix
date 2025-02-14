import {
  WeaponCategory,
  WeaponVariant,
  CombatWeaponStats,
  WeaponConfig,
  WeaponInstance,
  WeaponType,
  WeaponMount,
  WeaponEffect,
} from '../weapons/WeaponTypes';
import { Effect } from '../core/GameTypes';

// Re-export weapon types for backward compatibility
export type {
  WeaponCategory,
  WeaponVariant,
  CombatWeaponStats as WeaponStats,
  WeaponConfig,
  WeaponInstance,
  WeaponType,
  WeaponMount,
  WeaponEffect,
};

// Combat-specific types
export interface CombatUnit {
  id: string;
  position: { x: number; y: number };
  rotation: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  currentWeapon?: WeaponInstance;
  effects: Effect[];
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

import { LucideIcon } from 'lucide-react';
import { Effect } from '../../types/core/GameTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";
// Base Effect Types
// ------------------------------------------------------------

/**
 * Base Effect Interface
 * Common properties for all effects in the game
 */
export interface BaseEffect extends Effect {
  /** Name of the effect */
  name: string;
  /** Description of what the effect does */
  description: string;
  /** Type of effect */
  type: EffectType;
}

// Effect Categories
// ------------------------------------------------------------

/**
 * All possible effect types in the game
 */
export type EffectType =
  | CombatEffectType
  | StatusEffectType
  | VisualEffectType
  | EnvironmentalEffectType;

/**
 * Combat-related effect types
 */
export type CombatEffectType =
  | 'damage'
  | 'heal'
  | 'shield'
  | 'armor'
  | 'accuracy'
  | 'evasion'
  | 'critical'
  | 'resistance';

/**
 * Status-related effect types
 */
export type StatusEffectType =
  | 'stealth'
  | 'speed'
  | 'detection'
  | 'cloaking'
  | 'jamming'
  | 'scanning';

/**
 * Visual effect types
 */
export type VisualEffectType = ResourceType.PLASMA | 'spark' | 'gauss' | 'explosive' | 'beam' | 'particle';

/**
 * Environmental effect types
 */
export type EnvironmentalEffectType = 'radiation' | 'emp' | 'gravity' | 'magnetic' | 'thermal';

// Specialized Effect Interfaces
// ------------------------------------------------------------

/**
 * Area Effect Interface
 * For effects that affect an area
 */
export interface AreaEffect extends BaseEffect {
  /** Radius of effect in game units */
  radius: number;
  /** Position of the effect */
  position: { x: number; y: number };
}

/**
 * Status Effect Interface
 * For UI representation of effects
 */
export interface StatusEffect extends BaseEffect {
  /** Icon to display */
  icon: LucideIcon;
  /** Color theme */
  color: 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'cyan' | 'amber' | 'indigo' | 'teal';
  /** Additional content */
  content?: React.ReactNode;
}

/**
 * Combat Effect Interface
 * For effects during combat
 */
export interface CombatEffect extends BaseEffect {
  /** Time remaining for the effect */
  remainingTime: number;
  /** Source unit ID */
  sourceId: string;
  /** Target unit ID */
  targetId: string;
  /** List of sub-effects */
  effects: BaseEffect[];
}

// Effect Collections
// ------------------------------------------------------------

/**
 * Effect Stack Interface
 * For managing multiple effects on a target
 */
export interface EffectStack {
  /** Target entity ID */
  targetId: string;
  /** Active effects */
  effects: BaseEffect[];
  /** Effect history */
  history: {
    effectId: string;
    timestamp: number;
    action: 'applied' | 'removed' | 'expired';
  }[];
}

// Re-export from core types for backward compatibility
export type { Effect } from '../../types/core/GameTypes';
export type { WeaponEffect, WeaponEffectType } from './WeaponEffects';

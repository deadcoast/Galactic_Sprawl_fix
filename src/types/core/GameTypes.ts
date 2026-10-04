/**
 * Core game types used throughout the project
 */
import { ResourceType } from './../resources/ResourceTypes';

// Base Types
export type Quality = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type Tier = 1 | 2 | 3;

// Faction Types
export type FactionId = 'spaceRats' | 'lostNova' | 'equatorHorizon';

// Core Status Types
export type BaseStatus = 'idle' | 'engaging' | 'patrolling' | 'retreating' | 'disabled' | 'damaged';
export type CombatStatus = Extract<BaseStatus, 'engaging' | 'retreating' | 'damaged'>;
export type PatrolStatus = Extract<BaseStatus, 'idle' | 'patrolling' | 'disabled'>;

// Behavior Types
export type AIBehavior = 'aggressive' | 'defensive' | 'hit-and-run' | 'support';
export type CombatTactic = 'flank' | 'charge' | 'kite' | 'hold';

// Resource Types
// Using standardized ResourceType enum from StandardizedResourceTypes.ts
export interface ResourceAmount {
  type: ResourceType;
  amount: number;
}

// Coordinate Types
export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  dx: number;
  dy: number;
}

// Common Stats
export interface BaseStats {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  speed: number;
  turnRate: number;
}

// Effect Types
export interface Effect {
  /** Unique identifier for the effect */
  id: string;
  /** Type of effect */
  type: string;
  /** Duration in seconds */
  duration: number;
  /** Magnitude/strength of the effect */
  magnitude: number;
  /** Optional target identifier */
  target?: string;
  /** Whether the effect is currently active */
  active?: boolean;
  /** Cooldown time in seconds */
  cooldown?: number;
}

// Ability Types
export interface Ability {
  name: string;
  description: string;
  cooldown: number;
  duration: number;
  effect: Effect;
  active: boolean;
}

// Event Types
export type GameEventType = 'combat' | 'exploration' | 'trade' | 'diplomacy';
export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: unknown;
}

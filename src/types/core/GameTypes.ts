// Base Types
export type Quality = "low" | "medium" | "high";
export type Tier = 1 | 2 | 3;

// Faction Types
export type FactionId = "spaceRats" | "lostNova" | "equatorHorizon";

// Core Status Types
export type BaseStatus =
  | "idle"
  | "engaging"
  | "patrolling"
  | "retreating"
  | "disabled"
  | "damaged";
export type CombatStatus = Extract<
  BaseStatus,
  "engaging" | "retreating" | "damaged"
>;
export type PatrolStatus = Extract<
  BaseStatus,
  "idle" | "patrolling" | "disabled"
>;

// Behavior Types
export type AIBehavior = "aggressive" | "defensive" | "hit-and-run" | "support";
export type CombatTactic = "flank" | "charge" | "kite" | "hold";

// Resource Types
export type ResourceType = "minerals" | "energy" | "population" | "research";
export type ResourceAmount = {
  type: ResourceType;
  amount: number;
};

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
}

// Effect Types
export interface Effect {
  type:
    | "stealth"
    | "shield"
    | "speed"
    | "damage"
    | "plasma"
    | "spark"
    | "gauss"
    | "explosive";
  magnitude: number;
  duration: number;
  radius?: number;
  damage?: number;
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
export type GameEventType = "combat" | "exploration" | "trade" | "diplomacy";
export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: unknown;
}

/**
 * Environmental Hazard effect types and interfaces
 * @module EnvironmentalHazardEffects
 */

import { Effect } from '../../types/core/GameTypes';

// Base Hazard Types
// ------------------------------------------------------------

/**
 * Base environmental hazard effect interface
 */
export interface HazardEffect extends Effect {
  /** The type of hazard effect */
  type: 'damage' | 'field' | 'weather' | 'anomaly';
  /** Duration of the effect in seconds */
  duration: number;
  /** Strength of the effect (1-100) */
  strength: number;
  /** Name of the hazard effect */
  name: string;
  /** Description of what the hazard does */
  description: string;
  /** Radius of effect in units */
  radius: number;
  /** Whether the hazard moves */
  isMoving: boolean;
  /** Visual tier of the hazard (affects appearance) */
  visualTier: 1 | 2 | 3;
}

/**
 * Damage-based hazard effect (direct damage to ships/structures)
 */
export interface DamageHazardEffect extends HazardEffect {
  type: 'damage';
  /** Type of damage inflicted */
  damageType: 'physical' | 'energy' | 'corrosive' | 'thermal';
  /** How much the damage ignores armor (0-1) */
  penetration: number;
  /** Damage per second */
  damagePerSecond: number;
  /** Whether damage scales with proximity to center */
  hasFalloff: boolean;
}

/**
 * Field-based hazard effect (alters properties within an area)
 */
export interface FieldHazardEffect extends HazardEffect {
  type: 'field';
  /** Type of field effect */
  fieldType: 'gravity' | 'magnetic' | 'radiation' | 'temporal';
  /** How the field affects movement (negative slows, positive speeds up) */
  speedModifier: number;
  /** How the field affects weapon accuracy */
  accuracyModifier: number;
  /** How the field affects shield regeneration */
  shieldModifier: number;
  /** Intensity of visual distortion */
  distortionStrength: number;
}

/**
 * Weather-based hazard effect (environmental conditions)
 */
export interface WeatherHazardEffect extends HazardEffect {
  type: 'weather';
  /** Type of weather phenomenon */
  weatherType: 'solarFlare' | 'ionStorm' | 'cosmicDust' | 'spaceDebris';
  /** Visibility reduction (0-1) */
  visibilityReduction: number;
  /** Sensor range reduction (0-1) */
  sensorReduction: number;
  /** Communication interference (0-1) */
  communicationInterference: number;
  /** Particle density for visual effects */
  particleDensity: number;
}

/**
 * Anomaly-based hazard effect (strange phenomena)
 */
export interface AnomalyHazardEffect extends HazardEffect {
  type: 'anomaly';
  /** Type of anomaly */
  anomalyType: 'wormhole' | 'temporalRift' | 'quantumFluctuation' | 'dimensionalTear';
  /** Whether ships can be teleported */
  canTeleport: boolean;
  /** Chance of random effect (0-1) */
  randomEffectChance: number;
  /** Whether the anomaly grows/shrinks over time */
  isPulsating: boolean;
  /** Special visual effect identifier */
  specialEffect: string;
}

// Specialized Hazard Behaviors
// ------------------------------------------------------------

/**
 * Interface for hazards that can move
 */
export interface MovingHazard {
  /** Movement speed in units per second */
  speed: number;
  /** Direction in radians */
  direction: number;
  /** Whether the hazard follows a target */
  isHoming: boolean;
  /** Target ID if homing */
  targetId?: string;
}

/**
 * Interface for hazards that can split or multiply
 */
export interface SplittingHazard {
  /** Whether the hazard can split */
  canSplit: boolean;
  /** Maximum number of splits */
  maxSplits: number;
  /** Conditions that trigger splitting */
  splitTrigger: 'time' | 'damage' | 'proximity';
  /** Reduction in size for child hazards (0-1) */
  childSizeReduction: number;
}

/**
 * Union type of all possible hazard effects
 */
export type HazardEffectType =
  | DamageHazardEffect
  | FieldHazardEffect
  | WeatherHazardEffect
  | AnomalyHazardEffect;

/**
 * Configuration for environmental hazard generation
 */
export interface HazardGenerationConfig {
  /** Minimum number of hazards to generate */
  minHazards: number;
  /** Maximum number of hazards to generate */
  maxHazards: number;
  /** Tech level determining hazard complexity */
  techLevel: number;
  /** Whether to include anomalies */
  includeAnomalies: boolean;
  /** Difficulty level affecting hazard severity */
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  /** Special theme for hazard types */
  theme?: 'asteroid' | 'nebula' | 'blackHole' | 'solarFlare';
}

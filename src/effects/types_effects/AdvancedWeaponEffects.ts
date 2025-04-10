import { Position } from '../../types/geometry';
import { ResourceType } from './../../types/resources/ResourceTypes';
/**
 * Advanced weapon effect types and interfaces
 * @module AdvancedWeaponEffects
 */

// Advanced Weapon Effects
// ------------------------------------------------------------

/**
 * Base interface for all advanced weapon effects
 */
export interface BaseAdvancedWeaponEffect {
  id: string;
  type: 'damage' | 'status' | 'area' | 'utility';
  magnitude: number; // General magnitude/power of the effect
  strength: number; // Raw strength value (damage, healing, etc.)
  duration: number; // Duration in seconds
  name: string;
  description: string;
  active: boolean; // Whether the effect is currently active
  cooldown: number; // Current cooldown time remaining
}

/**
 * Chain Effect - Jumps between multiple targets
 */
export interface ChainEffect extends BaseAdvancedWeaponEffect {
  type: 'damage';
  chainCount: number; // How many targets it can jump to
  chainRange: number; // Range for chain jumps
  chainFalloff: number; // Damage reduction per jump (0-1)
  prioritizeClosest: boolean; // Whether to prioritize closest targets
  position: Position; // Added: Initial position of the effect
  direction: number; // Added: Initial direction/orientation
}

/**
 * Represents an effect that bypasses a portion of shield defenses
 */
export interface ShieldBypassEffect extends BaseAdvancedWeaponEffect {
  type: 'damage';
  damageType: ResourceType | 'physical' | 'corrosive' | 'thermal'; // Type of damage dealt
  penetration: number; // Base shield penetration factor (0 to 1)
  bypassRatio: number; // Percentage of shield bypassed (0 to 1)
  directHullDamage?: number; // Additional flat damage applied directly to hull
  hasVisualEffect: boolean; // Whether the bypass has a visual representation
  visualColorTheme?: string; // Theme color for visuals
  position: Position; // Added: Initial position of the effect
  direction: number; // Added: Initial direction/velocity vector
}

/**
 * Delayed Effect - Detonates after a delay
 */
export interface DelayedEffect extends BaseAdvancedWeaponEffect {
  type: 'area';
  radius: number; // Explosion radius
  falloff: number; // Damage falloff from center (0-1)
  delayTime: number; // Time before detonation in seconds
  hasWarningIndicator: boolean;
  warningFrequency: number; // How often the warning flashes (Hz)
  falloffRange: number; // Range at which falloff begins
  position: Position; // Added
  direction: number; // Added (initial direction if projectile)
}

/**
 * Status effect types
 */
export type StatusEffectType =
  | 'burn' // Damage over time
  | 'emp' // Disables systems
  | 'slow' // Reduces movement speed
  | 'stun' // Temporarily disables all actions
  | 'corrosion' // Reduces hull integrity over time
  | 'disruption' // Reduces weapon effectiveness
  | 'freeze' // Slows or freezes systems
  | 'phase'; // Shifts target partially out of phase

/**
 * Enhanced Status Effect - Applies status effects to targets
 */
export interface EnhancedStatusEffect extends BaseAdvancedWeaponEffect {
  type: 'status';
  statusType: StatusEffectType;
  intensity: number; // Intensity of the status effect
  statusDuration: number; // How long the status lasts
  isStackable: boolean; // Whether the effect can stack
  maxStacks?: number; // Maximum number of stacks
  stackingBehavior?: 'additive' | 'multiplicative' | 'max';
  position: Position; // Added (position where status is applied)
}

/**
 * Beam Effect - Continuous damage in a line
 */
export interface BeamEffect extends BaseAdvancedWeaponEffect {
  type: 'damage';
  damageType: ResourceType.ENERGY | 'kinetic' | 'explosive';
  penetration: number; // Penetration value (0-1)
  beamWidth: number; // Width of the beam
  isPenetrating: boolean; // Whether it penetrates multiple targets
  maxPenetrationTargets?: number; // Max targets penetrated
  penetrationFalloff?: number; // Damage falloff per penetration (0-1)
  visualIntensity: number; // Visual effect intensity
  isPulsing: boolean; // Whether the beam pulses
  pulseFrequency?: number; // Pulse frequency in Hz
  position: Position; // Added (beam origin)
  direction: number; // Added (beam direction)
}

/**
 * Multi-stage Effect - Effect with multiple phases
 */
export interface MultiStageEffect extends BaseAdvancedWeaponEffect {
  type: 'damage';
  stages: Array<{
    stageType: 'damage' | 'area' | 'status' | 'movement';
    stageDuration: number;
    stageMultiplier: number;
    interruptible: boolean;
  }>;
  currentStage: number;
  autoProgress: boolean; // Whether stages progress automatically
  isLooping: boolean; // Whether the effect loops after completion
  position: Position; // Added
  direction: number; // Added (initial direction if applicable)
}

/**
 * Homing Effect - Tracks and follows targets
 */
export interface HomingEffect extends BaseAdvancedWeaponEffect {
  type: 'damage';
  turnRate: number; // Turning rate in degrees per second
  trackingDuration: number; // How long it tracks for
  hasAcceleration: boolean; // Whether it accelerates over time
  initialVelocity: number; // Starting velocity
  maxVelocity: number; // Maximum velocity
  hasCountermeasures: boolean; // Whether it can be countered
  countermeasureEvadeChance?: number; // Chance to evade countermeasures (0-1)
  position: Position; // Added
  direction: number; // Added (initial direction)
}

/**
 * Environmental Interaction Effect - Interacts with hazards
 */
export interface EnvironmentalInteractionEffect extends BaseAdvancedWeaponEffect {
  type: 'damage';
  interactsWithHazardTypes: Array<'damage' | 'field' | 'weather' | 'anomaly'>;
  hazardInteractions: {
    damageMultiplier: number;
    areaMultiplier: number;
    durationMultiplier: number;
    transforms: boolean; // Whether it transforms hazards into new types
  };
  canCreateHazards: boolean;
  createdHazardType?: 'damage' | 'field' | 'weather' | 'anomaly';
  hazardCreationChance?: number; // Chance to create a hazard (0-1)
  position: Position; // Added
  direction: number; // Added
}

/**
 * Tactical effect types
 */
export type TacticalEffectType =
  | 'scan' // Reveals targets
  | 'jam' // Jams enemy systems
  | 'shield' // Enhances shields
  | 'boost' // Boosts stats
  | 'cloak' // Provides stealth
  | 'reveal' // Reveals cloaked units
  | 'repair'; // Repairs damage

/**
 * Tactical Effect - Utility effects for tactical advantage
 */
export interface TacticalEffect extends BaseAdvancedWeaponEffect {
  type: 'damage'; // Base type, though it's more utility-focused
  tacticalType: TacticalEffectType;
  effectRadius: number; // Radius of effect
  affectsAllies: boolean; // Whether it affects allies
  affectsEnemies: boolean; // Whether it affects enemies
  tacticalDuration: number; // How long the tactical effect lasts
  tacticalCooldown: number; // Cooldown between tactical uses
  hasLimitedUses: boolean; // Whether it has limited uses
  usesRemaining?: number; // Number of uses remaining
  position: Position; // Added
  direction: number; // Added (direction for area or utility effects)
}

// Advanced Weapon Effect Collections
// ------------------------------------------------------------

/**
 * Union type for all advanced weapon effect types
 */
export type AdvancedWeaponEffectType =
  | ChainEffect
  | ShieldBypassEffect
  | DelayedEffect
  | EnhancedStatusEffect
  | BeamEffect
  | MultiStageEffect
  | HomingEffect
  | EnvironmentalInteractionEffect
  | TacticalEffect;

/**
 * Collection of advanced effects that can be applied to a weapon
 */
export interface AdvancedWeaponEffects {
  primary: AdvancedWeaponEffectType;
  secondary?: AdvancedWeaponEffectType[];
}

/**
 * Configuration settings for visual representation of advanced weapon effects
 */
export interface AdvancedEffectVisualConfig {
  /** Particle count for effect visualization */
  particleCount: number;
  /** Color theme for the effect */
  colorTheme: string;
  /** Size of the effect particles */
  particleSize: number;
  /** Speed of the particles */
  particleSpeed: number;
  /** Whether the effect has light emission */
  hasLightEmission: boolean;
  /** Light intensity (if emission is enabled) */
  lightIntensity?: number;
  /** Light radius (if emission is enabled) */
  lightRadius?: number;
  /** Light color (if emission is enabled) */
  lightColor?: string;
  /** Whether the effect has sound */
  hasSound: boolean;
  /** Sound volume (if sound is enabled) */
  soundVolume?: number;
  /** Sound effect ID (if sound is enabled) */
  soundEffectId?: string;
}

/**
 * Configuration for effect creation
 */
export interface EffectCreationConfig {
  targetTier: number; // 1-5, determines power level
  qualityLevel: 'low' | 'medium' | 'high'; // Visual quality
  visualTheme?: string; // Override for visual theme
  soundEnabled: boolean; // Whether to enable sound
  specialProperties?: {
    // Optional special properties
    homing?: boolean;
    beamPulsating?: boolean;
    statusStackable?: boolean;
    chainPriority?: 'closest' | 'furthest' | 'random';
    particleDensity?: 'low' | 'medium' | 'high';
    [key: string]: unknown; // Allow for custom properties with unknown type
  };
}

import { ResourceType } from './../../types/resources/ResourceTypes';
/**
 * Advanced Weapon Effect Manager
 *
 * Manages the creation, behavior, and lifecycle of advanced weapon effects
 * in the combat system.
 */

import EventEmitter from 'eventemitter3';
import {
  AdvancedEffectVisualConfig,
  AdvancedWeaponEffectType,
  BeamEffect,
  ChainEffect,
  DelayedEffect,
  EffectCreationConfig,
  EnhancedStatusEffect,
  EnvironmentalInteractionEffect,
  HomingEffect,
  MultiStageEffect,
  ShieldBypassEffect,
  TacticalEffect,
} from '../../effects/types_effects/AdvancedWeaponEffects';
import { Position } from '../../types/geometry';

// Types for weapon categories
export type WeaponCategory =
  | 'machineGun'
  | 'mgss'
  | 'gaussCannon'
  | 'railGun'
  | 'rockets'
  | 'torpedoes'
  | 'pointDefense'
  | 'flakCannon'
  | 'capitalLaser'
  | 'beamWeapon'
  | 'ionCannon'
  | 'harmonicCannon'
  | 'temporalCannon'
  | 'quantumCannon';

// Types for weapon variants
export type WeaponVariant =
  | 'standard'
  | 'sparkRounds'
  | 'plasmaRounds'
  | 'gaussPlaner'
  | 'clustered';

// Event types for weapons manager
interface _WeaponEvents {
  effectCreated: {
    effectId: string;
    weaponId: string;
    effectType: AdvancedWeaponEffectType['type'];
    position: Position;
  };
  effectRemoved: {
    effectId: string;
  };
  effectUpdated: {
    effectId: string;
    changes: Partial<AdvancedWeaponEffectType>;
  };
  environmentalInteraction: {
    effectId: string;
    hazardId: string;
    interactionType: string;
    position: Position;
  };
  [key: string]: unknown; // Allow for other custom events
}

// Events for the advanced weapon effect manager
interface AdvancedWeaponEffectEvents {
  effectCreated: {
    effectId: string;
    weaponId: string;
    effectType: string;
    position: Position;
  };
  effectRemoved: {
    effectId: string;
  };
  effectModified: {
    effectId: string;
    changes: Partial<AdvancedWeaponEffectType>;
  };
  effectImpact: {
    effectId: string;
    targetId: string;
    damage: number;
    effectType: string;
  };
  effectInteraction: {
    effectId: string;
    interactionType: 'hazard' | 'weapon' | 'shield';
    interactionId: string;
    result: string;
  };
  stageTransition: {
    effectId: string;
    previousStage: number;
    newStage: number;
    effectType: string;
  };
  [key: string]: unknown; // Index signature to satisfy Record<string, unknown>
}

/**
 * Manager class for advanced weapon effects
 */
export class AdvancedWeaponEffectManager
  extends EventEmitter<AdvancedWeaponEffectEvents>
  implements _WeaponEvents
{
  private static instance: AdvancedWeaponEffectManager;

  // Store active effects with their complete data
  private effects: Map<string, AdvancedWeaponEffectType> = new Map();

  // Track beam effects for continuous update
  private beamEffects: Map<string, BeamEffect> = new Map();

  // Track homing effects for targeting updates
  private homingEffects: Map<string, HomingEffect & { targetPosition: Position }> = new Map();

  // Track multi-stage effects for stage progression
  private multiStageEffects: Map<string, MultiStageEffect> = new Map();

  // Track effects that interact with environment
  private interactiveEffects: Map<string, EnvironmentalInteractionEffect> = new Map();

  // Track effect lifecycle timers
  private effectTimers: Map<string, number> = new Map();

  // Track active visual configurations
  private visualConfigs: Map<string, AdvancedEffectVisualConfig> = new Map();

  // Implementation of _WeaponEvents interface
  private _effectCreated: _WeaponEvents['effectCreated'] | undefined;
  public get effectCreated(): _WeaponEvents['effectCreated'] {
    return this._effectCreated as _WeaponEvents['effectCreated'];
  }
  public set effectCreated(data: _WeaponEvents['effectCreated']) {
    this._effectCreated = data;
    this.emitWeaponEvent('effectCreated', data);
  }

  private _effectRemoved: _WeaponEvents['effectRemoved'] | undefined;
  public get effectRemoved(): _WeaponEvents['effectRemoved'] {
    return this._effectRemoved as _WeaponEvents['effectRemoved'];
  }
  public set effectRemoved(data: _WeaponEvents['effectRemoved']) {
    this._effectRemoved = data;
    this.emitWeaponEvent('effectRemoved', data);
  }

  private _effectUpdated: _WeaponEvents['effectUpdated'] | undefined;
  public get effectUpdated(): _WeaponEvents['effectUpdated'] {
    return this._effectUpdated as _WeaponEvents['effectUpdated'];
  }
  public set effectUpdated(data: _WeaponEvents['effectUpdated']) {
    this._effectUpdated = data;
    this.emitWeaponEvent('effectUpdated', data);
  }

  private _environmentalInteraction: _WeaponEvents['environmentalInteraction'] | undefined;
  public get environmentalInteraction(): _WeaponEvents['environmentalInteraction'] {
    return this._environmentalInteraction as _WeaponEvents['environmentalInteraction'];
  }
  public set environmentalInteraction(data: _WeaponEvents['environmentalInteraction']) {
    this._environmentalInteraction = data;
    this.emitWeaponEvent('environmentalInteraction', data);
  }

  // Index signature for _WeaponEvents interface
  [key: string]: unknown;

  private constructor() {
    super();
    this.setupUpdateLoop();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): AdvancedWeaponEffectManager {
    if (!AdvancedWeaponEffectManager.instance) {
      AdvancedWeaponEffectManager.instance = new AdvancedWeaponEffectManager();
    }
    return AdvancedWeaponEffectManager.instance;
  }

  /**
   * Set up a loop to update effects that need continuous updates
   */
  private setupUpdateLoop(): void {
    // Update interval for continuous effects (30 FPS equivalent)
    const updateInterval = 33;

    setInterval(() => {
      this.updateBeamEffects();
      this.updateHomingEffects();
      this.updateMultiStageEffects();
    }, updateInterval);
  }

  /**
   * Create an advanced weapon effect for a given weapon
   */
  public createEffect(
    weaponId: string,
    category: WeaponCategory,
    variant: WeaponVariant,
    position: Position,
    direction: number,
    config: EffectCreationConfig
  ): string {
    // Generate a unique ID for the effect
    const effectId = `effect-${weaponId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Determine which type of effect to create based on weapon category and variant
    let effect: AdvancedWeaponEffectType | null = null;

    // Create appropriate visual configuration
    const visualConfig = this.createVisualConfig(category, variant, config);

    // Track the visual configuration
    this.visualConfigs.set(effectId, visualConfig);

    // Create effect based on weapon category
    switch (category) {
      case 'machineGun':
      case 'mgss': {
        // Rapid-fire weapons get chain effects or enhanced status effects
        if (variant === 'sparkRounds') {
          effect = this.createEnhancedStatusEffect(effectId, position, 'emp', config);
        } else if (variant === 'plasmaRounds') {
          effect = this.createEnhancedStatusEffect(effectId, position, 'burn', config);
        } else {
          // Default to chain effect for machine guns
          effect = this.createChainEffect(effectId, position, direction, config);
        }
        break;
      }

      case 'gaussCannon':
      case 'railGun': {
        // High-velocity weapons get shield bypass or environmental interaction
        if (variant === 'gaussPlaner') {
          effect = this.createEnvironmentalInteractionEffect(effectId, position, direction, config);
        } else {
          effect = this.createShieldBypassEffect(effectId, position, direction, config);
        }
        break;
      }

      case 'rockets':
      case 'torpedoes': {
        // Explosive weapons get delayed or multi-stage effects
        if (variant === 'clustered') {
          effect = this.createMultiStageEffect(effectId, position, direction, config);
        } else {
          effect = this.createDelayedEffect(effectId, position, direction, config);
        }
        break;
      }

      case 'pointDefense':
      case 'flakCannon': {
        // Defense weapons get tactical or homing effects
        effect = this.createTacticalEffect(effectId, position, direction, config);
        break;
      }

      case 'capitalLaser':
      case 'beamWeapon':
      case 'ionCannon': {
        // Energy weapons get beam effects
        effect = this.createBeamEffect(effectId, position, direction, config);
        break;
      }

      case 'harmonicCannon':
      case 'temporalCannon':
      case 'quantumCannon': {
        // Advanced energy weapons get homing or multi-stage effects
        if (config.specialProperties?.homing) {
          effect = this.createHomingEffect(effectId, position, direction, config);
        } else {
          effect = this.createMultiStageEffect(effectId, position, direction, config);
        }
        break;
      }

      default: {
        // Default to shield bypass effect for unknown categories
        effect = this.createShieldBypassEffect(effectId, position, direction, config);
      }
    }

    if (effect) {
      // Store the effect
      this.effects.set(effectId, effect);

      // Set up lifecycle based on effect type
      this.setupEffectLifecycle(effectId, effect);

      // Create event data
      const eventData: _WeaponEvents['effectCreated'] = {
        effectId,
        weaponId,
        effectType: effect.type,
        position,
      };

      // Process through the _WeaponEvents interface
      this.effectCreated = eventData;

      return effectId;
    }

    return '';
  }

  /**
   * Set up effect lifecycle management
   */
  private setupEffectLifecycle(effectId: string, effect: AdvancedWeaponEffectType): void {
    // Add to appropriate tracking collections based on effect type
    if (this.isBeamEffect(effect)) {
      this.beamEffects.set(effectId, effect);
    } else if (this.isHomingEffect(effect)) {
      this.homingEffects.set(effectId, {
        ...effect,
        targetPosition: { x: 0, y: 0 }, // Initialize with default, will be updated
      });
    } else if (this.isMultiStageEffect(effect)) {
      this.multiStageEffects.set(effectId, effect);
    } else if (this.isEnvironmentalInteractionEffect(effect)) {
      this.interactiveEffects.set(effectId, effect);
    }

    // Set duration-based cleanup if not a continuous effect
    if (!this.isBeamEffect(effect) && 'duration' in effect) {
      const timerId = window.setTimeout(() => {
        this.removeEffect(effectId);
      }, effect.duration * 1000);

      this.effectTimers.set(effectId, timerId);
    }
  }

  /**
   * Create a chain effect that can hit multiple targets
   */
  private createChainEffect(
    id: string,
    position: Position,
    direction: number,
    config: EffectCreationConfig
  ): ChainEffect {
    // Calculate base values based on tier and quality
    const strength = 30 + 20 * config.targetTier;
    const duration = 3 + config.targetTier;
    const chainCount = 2 + config.targetTier;
    const chainRange = 100 + 50 * config.targetTier;

    // Determine chain targeting priority
    const prioritizeClosest =
      config.specialProperties?.chainPriority === 'closest' ||
      !config.specialProperties?.chainPriority;

    // Create the effect
    return {
      id,
      type: 'damage',
      magnitude: strength,
      strength,
      duration,
      name: `Chain Lightning Mk${config.targetTier}`,
      description: `Electric discharge that chains between ${chainCount} targets`,
      chainCount,
      chainRange,
      chainFalloff: 0.2,
      prioritizeClosest,
      active: true,
      cooldown: 0,
      position: position,
      direction: direction,
    };
  }

  /**
   * Create a shield bypass effect that penetrates shields
   */
  private createShieldBypassEffect(
    id: string,
    position: Position,
    direction: number,
    config: EffectCreationConfig
  ): ShieldBypassEffect {
    // Calculate base values based on tier and quality
    const strength = 40 + 25 * config.targetTier;
    const duration = 1;
    const penetration = 0.3 + 0.1 * config.targetTier;
    const bypassRatio = 0.4 + 0.1 * config.targetTier;

    // Create the effect
    return {
      id,
      type: 'damage',
      magnitude: strength,
      strength,
      duration,
      name: `Shield Bypass Mk${config.targetTier}`,
      description: `Penetrates ${Math.round(bypassRatio * 100)}% of shield protection`,
      damageType: ResourceType.ENERGY,
      penetration,
      bypassRatio,
      directHullDamage: 0.2 * config.targetTier,
      hasVisualEffect: config.qualityLevel !== 'low',
      visualColorTheme: config.visualTheme || 'blue',
      active: true,
      cooldown: 0,
      position: position,
      direction: direction,
    };
  }

  /**
   * Create a delayed effect that detonates after a time
   */
  private createDelayedEffect(
    id: string,
    position: Position,
    direction: number,
    config: EffectCreationConfig
  ): DelayedEffect {
    // Calculate base values based on tier and quality
    const strength = 50 + 30 * config.targetTier;
    const duration = 5 + config.targetTier;
    const radius = 80 + 20 * config.targetTier;
    const delayTime = 2.0;

    // Create the effect
    return {
      id,
      type: 'area',
      magnitude: strength,
      strength,
      duration,
      name: `Delayed Detonation Mk${config.targetTier}`,
      description: `Explosive charge that detonates after ${delayTime} seconds`,
      radius,
      falloff: 0.5,
      delayTime,
      hasWarningIndicator: true,
      warningFrequency: 1 + config.targetTier,
      falloffRange: radius * 0.8,
      active: true,
      cooldown: 0,
      position: position,
      direction: direction,
    };
  }

  /**
   * Create an enhanced status effect
   */
  private createEnhancedStatusEffect(
    id: string,
    position: Position,
    statusType: EnhancedStatusEffect['statusType'],
    config: EffectCreationConfig
  ): EnhancedStatusEffect {
    // Calculate base values based on tier and quality
    const strength = 25 + 15 * config.targetTier;
    const duration = 4 + 2 * config.targetTier;
    const intensity = 30 + 20 * config.targetTier;

    // Status effect properties
    const isStackable = config.specialProperties?.statusStackable || false;
    const maxStacks = isStackable ? 3 + config.targetTier : undefined;

    // Create name and description based on status type
    let name = '';
    let description = '';

    switch (statusType) {
      case 'burn': {
        name = `Plasma Burn Mk${config.targetTier}`;
        description = `Plasma burns that deal damage over time for ${duration.toFixed(1)} seconds`;
        break;
      }
      case 'emp': {
        name = `EMP Discharge Mk${config.targetTier}`;
        description = `Electromagnetic pulse that disables systems for ${duration.toFixed(1)} seconds`;
        break;
      }
      case 'slow': {
        name = `Field Dampener Mk${config.targetTier}`;
        description = `Energy field that reduces movement speed by ${intensity}%`;
        break;
      }
      case 'stun': {
        name = `Neural Disruptor Mk${config.targetTier}`;
        description = `Neural disruptor that stuns targets for ${duration.toFixed(1)} seconds`;
        break;
      }
      case 'corrosion': {
        name = `Nanite Corrosion Mk${config.targetTier}`;
        description = `Nanites that corrode hull integrity by ${intensity}%`;
        break;
      }
      case 'disruption': {
        name = `System Disruptor Mk${config.targetTier}`;
        description = `Disruptor that reduces weapon effectiveness by ${intensity}%`;
        break;
      }
      case 'freeze': {
        name = `Cryo Freeze Mk${config.targetTier}`;
        description = `Freezes target systems for ${duration.toFixed(1)} seconds`;
        break;
      }
      case 'phase': {
        name = `Phase Shift Mk${config.targetTier}`;
        description = `Shifts target partially out of phase, reducing damage by ${intensity}%`;
        break;
      }
      default: {
        name = `Status Effect Mk${config.targetTier}`;
        description = `Applies a status effect for ${duration.toFixed(1)} seconds`;
      }
    }

    // Create the effect
    return {
      id,
      type: 'status',
      magnitude: strength,
      strength,
      duration,
      name,
      description,
      statusType,
      intensity,
      statusDuration: duration,
      isStackable,
      maxStacks,
      stackingBehavior: 'additive',
      active: true,
      cooldown: 0,
      position: position,
    };
  }

  /**
   * Create a beam effect for continuous damage
   */
  private createBeamEffect(
    id: string,
    position: Position,
    direction: number,
    config: EffectCreationConfig
  ): BeamEffect {
    // Calculate base values based on tier and quality
    const strength = 40 + 30 * config.targetTier;
    const duration = 3 + config.targetTier;
    const beamWidth = 5 + 2 * config.targetTier;

    // Beam properties
    const isPenetrating = config.targetTier >= 2;
    const isPulsing = config.specialProperties?.beamPulsating || false;

    // Create the effect
    return {
      id,
      type: 'damage',
      magnitude: strength,
      strength,
      duration,
      name: `Energy Beam Mk${config.targetTier}`,
      description: `Continuous energy beam that deals ${strength} damage per second`,
      damageType: ResourceType.ENERGY,
      penetration: 0.3 + 0.1 * config.targetTier,
      beamWidth,
      isPenetrating,
      maxPenetrationTargets: isPenetrating ? 1 + config.targetTier : undefined,
      penetrationFalloff: isPenetrating ? 0.3 : undefined,
      visualIntensity: 50 + 20 * config.targetTier,
      isPulsing,
      pulseFrequency: isPulsing ? 2 + config.targetTier : undefined,
      active: true,
      cooldown: 0,
      position: position,
      direction: direction,
    };
  }

  /**
   * Create a multi-stage effect with different phases
   */
  private createMultiStageEffect(
    id: string,
    position: Position,
    direction: number,
    config: EffectCreationConfig
  ): MultiStageEffect {
    // Calculate base values based on tier and quality
    const strength = 35 + 25 * config.targetTier;
    const duration = 6 + 2 * config.targetTier;

    // Define stages based on tier
    const stages = [];

    // First stage - always damage
    stages.push({
      stageType: 'damage' as const,
      stageDuration: 1.0,
      stageMultiplier: 1.0,
      interruptible: true,
    });

    // Second stage - area effect
    stages.push({
      stageType: 'area' as const,
      stageDuration: 2.0,
      stageMultiplier: 1.5,
      interruptible: false,
    });

    // Higher tiers get additional stages
    if (config.targetTier >= 2) {
      stages.push({
        stageType: 'status' as const,
        stageDuration: 2.0,
        stageMultiplier: 1.2,
        interruptible: true,
      });
    }

    if (config.targetTier >= 3) {
      stages.push({
        stageType: 'movement' as const,
        stageDuration: 2.0,
        stageMultiplier: 2.0,
        interruptible: false,
      });
    }

    // Create the effect
    return {
      id,
      type: 'damage',
      magnitude: strength,
      strength,
      duration,
      name: `Multi-Phase Cascade Mk${config.targetTier}`,
      description: `Cascade effect with ${stages.length} stages of increasing power`,
      stages,
      currentStage: 0,
      autoProgress: true,
      isLooping: config.targetTier >= 3,
      active: true,
      cooldown: 0,
      position: position,
      direction: direction,
    };
  }

  /**
   * Create a homing effect that tracks targets
   */
  private createHomingEffect(
    id: string,
    position: Position,
    direction: number,
    config: EffectCreationConfig
  ): HomingEffect {
    // Calculate base values based on tier and quality
    const strength = 45 + 25 * config.targetTier;
    const duration = 8 + 2 * config.targetTier;

    // Homing properties
    const turnRate = 30 + 15 * config.targetTier; // degrees per second
    const initialVelocity = 100 + 50 * config.targetTier;
    const maxVelocity = initialVelocity * 1.5;
    const hasCountermeasures = config.targetTier >= 2;

    // Create the effect
    return {
      id,
      type: 'damage',
      magnitude: strength,
      strength,
      duration,
      name: `Homing Projectile Mk${config.targetTier}`,
      description: `Self-guided projectile that tracks and pursues targets`,
      turnRate,
      trackingDuration: duration,
      hasAcceleration: true,
      initialVelocity,
      maxVelocity,
      hasCountermeasures,
      countermeasureEvadeChance: hasCountermeasures ? 0.3 + 0.1 * config.targetTier : undefined,
      active: true,
      cooldown: 0,
      position: position,
      direction: direction,
    };
  }

  /**
   * Create an environmental interaction effect
   */
  private createEnvironmentalInteractionEffect(
    id: string,
    position: Position,
    direction: number,
    config: EffectCreationConfig
  ): EnvironmentalInteractionEffect {
    // Calculate base values based on tier and quality
    const strength = 30 + 20 * config.targetTier;
    const duration = 5 + 2 * config.targetTier;

    // Determine hazard types to interact with
    const interactsWithHazardTypes: Array<'damage' | 'field' | 'weather' | 'anomaly'> = ['damage'];
    if (config.targetTier >= 2) {
      interactsWithHazardTypes.push('field');
    }
    if (config.targetTier >= 3) {
      interactsWithHazardTypes.push('weather', 'anomaly');
    }

    // Create the effect
    return {
      id,
      type: 'damage',
      magnitude: strength,
      strength,
      duration,
      name: `Environmental Catalyst Mk${config.targetTier}`,
      description: `Interacts with environmental hazards to create powerful combined effects`,
      interactsWithHazardTypes,
      hazardInteractions: {
        damageMultiplier: 1.2 + 0.2 * config.targetTier,
        areaMultiplier: 1.1 + 0.1 * config.targetTier,
        durationMultiplier: 1.1 + 0.1 * config.targetTier,
        transforms: config.targetTier >= 3,
      },
      canCreateHazards: config.targetTier >= 2,
      createdHazardType: config.targetTier >= 2 ? 'damage' : undefined,
      hazardCreationChance: config.targetTier >= 2 ? 0.3 + 0.1 * config.targetTier : undefined,
      active: true,
      cooldown: 0,
      position: position,
      direction: direction,
    };
  }

  /**
   * Create a tactical effect for utility purposes
   */
  private createTacticalEffect(
    id: string,
    position: Position,
    direction: number,
    config: EffectCreationConfig
  ): TacticalEffect {
    // Calculate base values based on tier and quality
    const strength = 20 + 15 * config.targetTier;
    const duration = 7 + 3 * config.targetTier;

    // Determine tactical type based on tier
    let tacticalType: TacticalEffect['tacticalType'];
    const tier = config.targetTier;

    if (tier === 1) {
      tacticalType = Math.random() < 0.5 ? 'scan' : 'jam';
    } else if (tier === 2) {
      const roll = Math.random();
      if (roll < 0.33) {
        tacticalType = 'shield';
      } else if (roll < 0.66) {
        tacticalType = 'boost';
      } else {
        tacticalType = 'jam';
      }
    } else {
      const roll = Math.random();
      if (roll < 0.25) {
        tacticalType = 'cloak';
      } else if (roll < 0.5) {
        tacticalType = 'reveal';
      } else if (roll < 0.75) {
        tacticalType = 'repair';
      } else {
        tacticalType = 'boost';
      }
    }

    // Create the effect
    return {
      id,
      type: 'damage', // Base type is damage, but actually provides utility
      magnitude: strength,
      strength,
      duration,
      name: `Tactical System Mk${config.targetTier}`,
      description: `Tactical ${tacticalType} system with advanced functionality`,
      tacticalType,
      effectRadius: 100 + 50 * config.targetTier,
      affectsAllies: ['boost', 'shield', 'cloak', 'repair'].includes(tacticalType),
      affectsEnemies: ['scan', 'jam', 'reveal'].includes(tacticalType),
      tacticalDuration: duration,
      tacticalCooldown: 10 + 5 * config.targetTier,
      hasLimitedUses: true,
      usesRemaining: 3 + config.targetTier,
      active: true,
      cooldown: 0,
      position: position,
      direction: direction,
    };
  }

  /**
   * Create a visual configuration for an effect
   */
  private createVisualConfig(
    category: WeaponCategory,
    variant: WeaponVariant,
    config: EffectCreationConfig
  ): AdvancedEffectVisualConfig {
    // Base particle count by quality level
    let particleCount = 20;
    if (config.qualityLevel === 'medium') {
      particleCount = 50;
    } else if (config.qualityLevel === 'high') {
      particleCount = 100;
    }

    // Adjust by density if specified
    if (config.specialProperties?.particleDensity === 'low') {
      particleCount = Math.floor(particleCount * 0.5);
    } else if (config.specialProperties?.particleDensity === 'high') {
      particleCount = Math.floor(particleCount * 1.5);
    }

    // Determine color theme based on weapon category
    let colorTheme = 'blue';

    switch (category) {
      case 'machineGun':
      case 'mgss': {
        colorTheme = 'orange';
        break;
      }
      case 'gaussCannon':
      case 'railGun': {
        colorTheme = 'cyan';
        break;
      }
      case 'rockets':
      case 'torpedoes': {
        colorTheme = 'red';
        break;
      }
      case 'capitalLaser':
      case 'beamWeapon':
      case 'ionCannon': {
        colorTheme = 'purple';
        break;
      }
      case 'harmonicCannon':
      case 'temporalCannon':
      case 'quantumCannon': {
        colorTheme = 'green';
        break;
      }
    }

    // Override with config theme if provided
    if (config.visualTheme) {
      colorTheme = config.visualTheme;
    }

    // Determine particle size and speed
    const particleSize = 3 + config.targetTier;
    const particleSpeed = 2 + config.targetTier;

    // Light emission based on quality
    const hasLightEmission = config.qualityLevel !== 'low';
    const lightIntensity = hasLightEmission ? 0.7 + 0.1 * config.targetTier : undefined;
    const lightRadius = hasLightEmission ? 50 + 20 * config.targetTier : undefined;
    const lightColor = hasLightEmission ? colorTheme : undefined;

    // Sound effects
    const hasSound = config.soundEnabled;
    const soundVolume = hasSound ? 0.5 + 0.1 * config.targetTier : undefined;
    const soundEffectId = hasSound ? `${category}-${variant}-sound` : undefined;

    return {
      particleCount,
      colorTheme,
      particleSize,
      particleSpeed,
      hasLightEmission,
      lightIntensity,
      lightRadius,
      lightColor,
      hasSound,
      soundVolume,
      soundEffectId,
    };
  }

  /**
   * Type guard for BeamEffect
   */
  private isBeamEffect(effect: AdvancedWeaponEffectType): effect is BeamEffect {
    return 'beamWidth' in effect;
  }

  /**
   * Type guard for HomingEffect
   */
  private isHomingEffect(effect: AdvancedWeaponEffectType): effect is HomingEffect {
    return 'turnRate' in effect;
  }

  /**
   * Type guard for MultiStageEffect
   */
  private isMultiStageEffect(effect: AdvancedWeaponEffectType): effect is MultiStageEffect {
    return 'stages' in effect;
  }

  /**
   * Type guard for EnvironmentalInteractionEffect
   */
  private isEnvironmentalInteractionEffect(
    effect: AdvancedWeaponEffectType
  ): effect is EnvironmentalInteractionEffect {
    return 'interactsWithHazardTypes' in effect;
  }

  /**
   * Remove an effect and clean up resources
   */
  public removeEffect(effectId: string): void {
    // Clear the lifecycle timer
    if (this.effectTimers.has(effectId)) {
      clearTimeout(this.effectTimers.get(effectId));
      this.effectTimers.delete(effectId);
    }

    // Remove from tracking maps
    this.effects.delete(effectId);
    this.beamEffects.delete(effectId);
    this.homingEffects.delete(effectId);
    this.multiStageEffects.delete(effectId);
    this.interactiveEffects.delete(effectId);
    this.visualConfigs.delete(effectId);

    // Create event data
    const eventData: _WeaponEvents['effectRemoved'] = {
      effectId,
    };

    // Process through the _WeaponEvents interface
    this.effectRemoved = eventData;
  }

  /**
   * Clean up all effects and timers
   */
  public cleanup(): void {
    // Clear all timers
    for (const timerId of this.effectTimers.values()) {
      clearTimeout(timerId);
    }

    // Clear all active effects
    this.effects.clear();
    this.beamEffects.clear();
    this.homingEffects.clear();
    this.multiStageEffects.clear();
    this.interactiveEffects.clear();
    this.effectTimers.clear();
    this.visualConfigs.clear();
  }

  /**
   * Updates for beam effects (continuous)
   */
  private updateBeamEffects(): void {
    // TO BE IMPLEMENTED
  }

  /**
   * Updates for homing effects (movement and tracking)
   */
  private updateHomingEffects(): void {
    // TO BE IMPLEMENTED
  }

  /**
   * Updates for multi-stage effects (stage progression)
   */
  private updateMultiStageEffects(): void {
    // TO BE IMPLEMENTED
  }

  /**
   * Handle interaction between an effect and an environmental hazard
   */
  public handleHazardInteraction(effectId: string, hazardId: string): void {
    // Get the effect
    const effect = this.effects.get(effectId);
    if (!effect) {
      return;
    }

    // Create default position and interaction type
    const position = { x: 0, y: 0 } as Position;
    let interactionType = 'collision';

    // Check if this is an environmental interaction effect
    if (this.isEnvironmentalInteractionEffect(effect)) {
      // Update interaction type based on effect and hazard
      interactionType = this.determineInteractionType(effect, hazardId);

      // Apply effects based on interaction type
      this.applyHazardInteractionEffects(effect, hazardId, interactionType);
    }

    // Create event data
    const eventData: _WeaponEvents['environmentalInteraction'] = {
      effectId,
      hazardId,
      interactionType,
      position,
    };

    // Process through the _WeaponEvents interface
    this.environmentalInteraction = eventData;
  }

  /**
   * Determine the type of interaction between an effect and a hazard
   */
  private determineInteractionType(
    effect: EnvironmentalInteractionEffect,
    hazardId: string
  ): string {
    // Get the effect's interaction types
    const interactionTypes = effect.interactsWithHazardTypes;

    // Here we would normally look up the hazard type from a hazard manager
    // Since we don't have direct access to that, we'll infer from the hazard ID
    let hazardType: 'damage' | 'field' | 'weather' | 'anomaly' = 'damage';

    if (hazardId.includes('radiation') || hazardId.includes('laser')) {
      hazardType = 'damage';
    } else if (hazardId.includes('gravity') || hazardId.includes('magnetic')) {
      hazardType = 'field';
    } else if (hazardId.includes('storm') || hazardId.includes('nebula')) {
      hazardType = 'weather';
    } else if (hazardId.includes('temporal') || hazardId.includes('wormhole')) {
      hazardType = 'anomaly';
    }

    // Check if effect interacts with this hazard type
    if (interactionTypes.includes(hazardType)) {
      // Determine specific interaction based on hazard type
      switch (hazardType) {
        case 'damage':
          return 'amplify';
        case 'field':
          return 'enhance';
        case 'weather':
          return 'redirect';
        case 'anomaly':
          return 'transform';
        default:
          return 'collision';
      }
    }

    // Default to collision for non-interactive hazards
    return 'collision';
  }

  /**
   * Apply effects based on the interaction between a weapon effect and a hazard
   */
  private applyHazardInteractionEffects(
    effect: EnvironmentalInteractionEffect,
    _hazardId: string,
    interactionType: string
  ): void {
    // Make a copy of the current values before modifying
    const currentStrength = effect.strength;
    const currentMagnitude = effect.magnitude;
    const currentDuration = effect.duration;

    // Apply changes to the effect based on interaction type
    switch (interactionType) {
      case 'amplify': {
        // Increase strength and magnitude
        effect.strength = currentStrength * effect.hazardInteractions.damageMultiplier;
        effect.magnitude = currentMagnitude * 1.2;
        break;
      }
      case 'redirect': {
        // Modify direction property if it exists (via type assertion)
        if (this.isHomingEffect(effect)) {
          // For homing effects, increase turn rate
          effect.turnRate *= 1.5;
        }
        break;
      }
      case 'enhance': {
        // Increase duration
        effect.duration = currentDuration * effect.hazardInteractions.durationMultiplier;
        break;
      }
      case 'transform': {
        // Transform effect behavior
        if (effect.hazardInteractions.transforms && effect.canCreateHazards) {
          // Set this effect to create hazards with 100% chance
          effect.hazardCreationChance = 1.0;
        }
        break;
      }
      default: {
        // Basic collision - slight strength reduction
        effect.strength = currentStrength * 0.9;
      }
    }

    // Update the effect in our collection
    this.effects.set(effect.id, effect);

    // Emit an effect updated event to notify listeners
    const changes: Partial<AdvancedWeaponEffectType> = {
      id: effect.id,
      strength: effect.strength,
      magnitude: effect.magnitude,
      duration: effect.duration,
    };

    // Emit update event
    this.effectUpdated = {
      effectId: effect.id,
      changes,
    };
  }

  /**
   * Handle impact of an effect with a target
   */
  public handleImpact(effectId: string, targetId: string, damageMultiplier: number = 1.0): void {
    const effect = this.effects.get(effectId);
    if (!effect) {
      return;
    }

    // Calculate damage based on effect type and multiplier
    const damage = effect.strength * damageMultiplier;

    // Apply special effects based on effect type
    if (this.isEnvironmentalInteractionEffect(effect)) {
      // Emit effect impact event with environmental interaction information
      this.emit('effectImpact', {
        effectId,
        targetId,
        damage,
        effectType: effect.type,
      });
    } else {
      // Standard impact without special effects
      this.emit('effectImpact', {
        effectId,
        targetId,
        damage,
        effectType: effect.type,
      });
    }

    // Remove one-shot effects after impact
    if (!this.isBeamEffect(effect)) {
      this.removeEffect(effectId);
    }
  }

  /**
   * Convert and emit _WeaponEvents to AdvancedWeaponEffectEvents
   */
  private emitWeaponEvent<K extends keyof _WeaponEvents>(
    eventName: K,
    data: _WeaponEvents[K]
  ): void {
    // Map _WeaponEvents to AdvancedWeaponEffectEvents as needed
    switch (eventName) {
      case 'effectCreated':
        this.emit('effectCreated', {
          effectId: (data as _WeaponEvents['effectCreated']).effectId,
          weaponId: (data as _WeaponEvents['effectCreated']).weaponId,
          effectType: (data as _WeaponEvents['effectCreated']).effectType,
          position: (data as _WeaponEvents['effectCreated']).position,
        });
        break;
      case 'effectRemoved':
        this.emit('effectRemoved', {
          effectId: (data as _WeaponEvents['effectRemoved']).effectId,
        });
        break;
      case 'effectUpdated':
        this.emit('effectModified', {
          effectId: (data as _WeaponEvents['effectUpdated']).effectId,
          changes: (data as _WeaponEvents['effectUpdated']).changes,
        });
        break;
      case 'environmentalInteraction':
        this.emit('effectInteraction', {
          effectId: (data as _WeaponEvents['environmentalInteraction']).effectId,
          interactionType: 'hazard',
          interactionId: (data as _WeaponEvents['environmentalInteraction']).hazardId,
          result: (data as _WeaponEvents['environmentalInteraction']).interactionType,
        });
        break;
    }
  }
}

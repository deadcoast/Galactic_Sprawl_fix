import { ResourceType } from './../../types/resources/ResourceTypes';
/**
 * Environmental Hazard Manager
 *
 * Manages the generation, behavior, and lifecycle of environmental hazards
 * in combat scenarios.
 */

// Import Base Class
import {
  AnomalyHazardEffect,
  DamageHazardEffect,
  FieldHazardEffect,
  HazardEffectType,
  HazardGenerationConfig,
  MovingHazard,
  SplittingHazard,
  WeatherHazardEffect,
} from '../../effects/types_effects/EnvironmentalHazardEffects';
import { BaseTypedEventEmitter } from '../../lib/events/BaseTypedEventEmitter';
// Remove eventSystem import
// import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import { Position } from '../../types/core/GameTypes';
// Remove old event type imports
// import {
//     EventType,
//     HazardCreatedEventData,
//     HazardRemovedEventData
// } from '../../types/events/EventTypes';
// Import new event types
import {
  EnvironmentalHazardEventType,
  EnvironmentalHazardManagerEvents,
} from '../../types/events/EnvironmentalHazardEvents';

/**
 * Manager class for environmental hazards in combat
 */
// Extend Base Class
export class EnvironmentalHazardManager extends BaseTypedEventEmitter<EnvironmentalHazardManagerEvents> {
  // Remove static instance field
  // private static instance: EnvironmentalHazardManager;

  // Store active hazards with their complete data
  private hazards: Map<string, HazardEffectType> = new Map();

  // Track moving hazards for efficient updates
  private movingHazards: Map<string, MovingHazard> = new Map();

  // Track splitting hazards
  private splittingHazards: Map<string, SplittingHazard> = new Map();

  // Track hazard lifecycle timers
  private hazardTimers: Map<string, number> = new Map();

  // Change constructor to protected
  protected constructor() {
    super(); // Add super call
  }

  /**
   * Generate environmental hazards based on configuration
   */
  public generateHazards(
    config: HazardGenerationConfig,
    battlefieldSize: { width: number; height: number }
  ): string[] {
    const { minHazards, maxHazards, techLevel, includeAnomalies, difficulty, theme } = config;

    // Determine number of hazards to generate
    const count = Math.floor(Math.random() * (maxHazards - minHazards + 1)) + minHazards;

    const hazardIds: string[] = [];

    // Generate the hazards
    for (let i = 0; i < count; i++) {
      // Generate position within battlefield
      const position = {
        x: Math.random() * battlefieldSize.width,
        y: Math.random() * battlefieldSize.height,
      };

      const hazardId = this.createHazard(position, techLevel, includeAnomalies, difficulty, theme);
      if (hazardId) {
        hazardIds.push(hazardId);
      }
    }

    return hazardIds;
  }

  /**
   * Create a single hazard based on parameters
   */
  private createHazard(
    position: Position,
    techLevel: number,
    includeAnomalies: boolean,
    difficulty: HazardGenerationConfig['difficulty'],
    theme?: HazardGenerationConfig['theme']
  ): string {
    // Generate a unique ID for the hazard
    const hazardId = `hazard-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Determine hazard type based on theme and tech level
    let hazardType: HazardEffectType['type'] = 'damage';

    // Higher tech levels allow more complex hazards
    if (techLevel >= 2) {
      const types: HazardEffectType['type'][] = ['damage', 'field'];
      if (techLevel >= 3) {
        types.push('weather');
        if (includeAnomalies && techLevel >= 4) {
          types.push('anomaly');
        }
      }

      // Theme influences hazard type probability
      if (theme) {
        switch (theme) {
          case 'asteroid':
            // More likely to be damage type
            hazardType =
              Math.random() < 0.7 ? 'damage' : types[Math.floor(Math.random() * types.length)];
            break;
          case 'nebula':
            // More likely to be field type
            hazardType =
              Math.random() < 0.7 ? 'field' : types[Math.floor(Math.random() * types.length)];
            break;
          case 'blackHole':
            // More likely to be field or anomaly type
            if (types.includes('anomaly')) {
              hazardType =
                Math.random() < 0.7
                  ? Math.random() < 0.5
                    ? 'field'
                    : 'anomaly'
                  : types[Math.floor(Math.random() * types.length)];
            } else {
              hazardType =
                Math.random() < 0.7 ? 'field' : types[Math.floor(Math.random() * types.length)];
            }
            break;
          case 'solarFlare':
            // More likely to be weather type
            if (types.includes('weather')) {
              hazardType =
                Math.random() < 0.7 ? 'weather' : types[Math.floor(Math.random() * types.length)];
            } else {
              hazardType = types[Math.floor(Math.random() * types.length)];
            }
            break;
          default:
            hazardType = types[Math.floor(Math.random() * types.length)];
        }
      } else {
        hazardType = types[Math.floor(Math.random() * types.length)];
      }
    }

    // Based on the selected type, generate the appropriate hazard
    let hazard: HazardEffectType;

    // Calculate base values using difficulty and tech level
    const baseStrength = this.calculateBaseStrength(difficulty, techLevel);
    const baseDuration = this.calculateBaseDuration(difficulty, techLevel);
    const baseRadius = this.calculateBaseRadius(difficulty, hazardType);

    // Determine if hazard should move
    const shouldMove = Math.random() < 0.3 * techLevel;

    // Determine hazard visual tier based on tech level
    const visualTier = Math.min(Math.ceil(techLevel / 2), 3) as 1 | 2 | 3;

    // Generate the specific hazard based on type
    switch (hazardType) {
      case 'damage':
        hazard = this.createDamageHazard(
          hazardId,
          position,
          baseStrength,
          baseDuration,
          baseRadius,
          visualTier,
          shouldMove,
          difficulty,
          theme
        );
        break;
      case 'field':
        hazard = this.createFieldHazard(
          hazardId,
          position,
          baseStrength,
          baseDuration,
          baseRadius,
          visualTier,
          shouldMove,
          difficulty,
          theme
        );
        break;
      case 'weather':
        hazard = this.createWeatherHazard(
          hazardId,
          position,
          baseStrength,
          baseDuration,
          baseRadius,
          visualTier,
          shouldMove,
          difficulty,
          theme
        );
        break;
      case 'anomaly':
        hazard = this.createAnomalyHazard(
          hazardId,
          position,
          baseStrength,
          baseDuration,
          baseRadius,
          visualTier,
          shouldMove,
          difficulty,
          theme
        );
        break;
      default:
        // Fallback to damage hazard
        hazard = this.createDamageHazard(
          hazardId,
          position,
          baseStrength,
          baseDuration,
          baseRadius,
          visualTier,
          shouldMove,
          difficulty,
          theme
        );
    }

    // Store the hazard
    this.hazards.set(hazardId, hazard);

    // Set up lifecycle management
    this.setupHazardLifecycle(hazardId, hazard);

    // Emit creation event using this.emit
    this.emit(EnvironmentalHazardEventType.HAZARD_CREATED, {
      hazardId,
      hazardType: hazard.type,
      position,
    });
    // eventSystem.publish({
    //   type: EventType.HAZARD_CREATED,
    //   managerId: 'EnvironmentalHazardManager',
    //   timestamp: Date.now(),
    //   data: eventData,
    // });

    return hazardId;
  }

  /**
   * Calculate the base strength of a hazard based on difficulty and tech level
   */
  private calculateBaseStrength(
    difficulty: HazardGenerationConfig['difficulty'],
    techLevel: number
  ): number {
    const difficultyMultiplier = {
      easy: 0.6,
      normal: 1.0,
      hard: 1.5,
      extreme: 2.0,
    }[difficulty];

    // Scale between 10-100 based on difficulty and tech level
    return Math.floor(10 + techLevel * 15 * difficultyMultiplier);
  }

  /**
   * Calculate the base duration of a hazard based on difficulty and tech level
   */
  private calculateBaseDuration(
    difficulty: HazardGenerationConfig['difficulty'],
    techLevel: number
  ): number {
    const difficultyMultiplier = {
      easy: 0.8,
      normal: 1.0,
      hard: 1.3,
      extreme: 1.7,
    }[difficulty];

    // Scale between 10-60 seconds based on difficulty and tech level
    return 10 + techLevel * 5 * difficultyMultiplier;
  }

  /**
   * Calculate the base radius of a hazard based on difficulty and type
   */
  private calculateBaseRadius(
    difficulty: HazardGenerationConfig['difficulty'],
    type: HazardEffectType['type']
  ): number {
    const difficultyMultiplier = {
      easy: 0.8,
      normal: 1.0,
      hard: 1.2,
      extreme: 1.5,
    }[difficulty];

    let baseValue = 50; // Default base radius

    // Adjust base radius by hazard type
    switch (type) {
      case 'damage':
        baseValue = 40; // Smaller damage areas
        break;
      case 'field':
        baseValue = 80; // Larger field effects
        break;
      case 'weather':
        baseValue = 120; // Large weather effects
        break;
      case 'anomaly':
        baseValue = 60; // Medium anomaly sizes
        break;
    }

    return baseValue * difficultyMultiplier;
  }

  /**
   * Set up hazard lifecycle management
   */
  private setupHazardLifecycle(hazardId: string, hazard: HazardEffectType): void {
    // Set up timeout to remove the hazard when its duration expires
    const timerId = window.setTimeout(() => {
      this.removeHazard(hazardId);
    }, hazard.duration * 1000);

    // Store the timer ID for cleanup
    this.hazardTimers.set(hazardId, timerId);

    // Set up movement if the hazard is moving
    if (hazard.isMoving) {
      // Create moving behavior
      const movingHazard: MovingHazard = {
        speed: 10 + hazard.strength / 10, // Faster for stronger hazards
        direction: Math.random() * Math.PI * 2, // Random direction
        isHoming: Math.random() < 0.2, // 20% chance to be homing
      };

      this.movingHazards.set(hazardId, movingHazard);
    }

    // Determine if hazard can split (only for certain types and strengths)
    if (
      (hazard.type === 'damage' || hazard.type === 'anomaly') &&
      hazard.strength > 50 &&
      Math.random() < 0.3
    ) {
      const splittingHazard: SplittingHazard = {
        canSplit: true,
        maxSplits: Math.floor(hazard.strength / 30),
        splitTrigger: Math.random() < 0.5 ? 'time' : 'damage',
        childSizeReduction: 0.5 + Math.random() * 0.3,
      };

      this.splittingHazards.set(hazardId, splittingHazard);
    }
  }

  /**
   * Remove a hazard and clean up resources
   */
  public removeHazard(hazardId: string): void {
    // Clear the lifecycle timer
    if (this.hazardTimers.has(hazardId)) {
      clearTimeout(this.hazardTimers.get(hazardId));
      this.hazardTimers.delete(hazardId);
    }

    // Remove from tracking maps
    this.hazards.delete(hazardId);
    this.movingHazards.delete(hazardId);
    this.splittingHazards.delete(hazardId);

    // Emit removal event using this.emit
    this.emit(EnvironmentalHazardEventType.HAZARD_REMOVED, { hazardId });
    // eventSystem.publish({
    //   type: EventType.HAZARD_REMOVED,
    //   managerId: 'EnvironmentalHazardManager',
    //   timestamp: Date.now(),
    //   data: eventData,
    // });
  }

  /**
   * Get all active hazards
   */
  public getActiveHazards(): HazardEffectType[] {
    return Array.from(this.hazards.values());
  }

  /**
   * Get a specific hazard by ID
   */
  public getHazard(hazardId: string): HazardEffectType | undefined {
    return this.hazards.get(hazardId);
  }

  /**
   * Clean up all hazards and timers
   */
  public cleanup(): void {
    // Clear all timers
    for (const timerId of this.hazardTimers.values()) {
      clearTimeout(timerId);
    }

    // Clear all maps
    this.hazards.clear();
    this.movingHazards.clear();
    this.splittingHazards.clear();
    this.hazardTimers.clear();
  }

  /**
   * Create a damage-based hazard
   */
  private createDamageHazard(
    id: string,
    _position: Position,
    strength: number,
    duration: number,
    radius: number,
    visualTier: 1 | 2 | 3,
    isMoving: boolean,
    difficulty: HazardGenerationConfig['difficulty'],
    theme?: HazardGenerationConfig['theme']
  ): DamageHazardEffect {
    // Determine damage type based on theme and randomness
    let damageType: DamageHazardEffect['damageType'] = 'physical';

    if (theme === 'solarFlare') {
      damageType = Math.random() < 0.8 ? 'thermal' : ResourceType.ENERGY;
    } else if (theme === 'nebula') {
      damageType = Math.random() < 0.7 ? 'corrosive' : ResourceType.ENERGY;
    } else if (theme === 'blackHole') {
      damageType = Math.random() < 0.8 ? ResourceType.ENERGY : 'physical';
    } else {
      // Random selection for default case
      const types: DamageHazardEffect['damageType'][] = [
        'physical',
        ResourceType.ENERGY,
        'corrosive',
        'thermal',
      ];
      damageType = types[Math.floor(Math.random() * types.length)];
    }

    // Calculate penetration based on damage type and difficulty
    let penetration = 0.1; // Base penetration
    if (damageType === ResourceType.ENERGY) {
      penetration += 0.2;
    }
    if (damageType === 'corrosive') {
      penetration += 0.3;
    }

    // Adjust based on difficulty
    if (difficulty === 'hard') {
      penetration += 0.1;
    }
    if (difficulty === 'extreme') {
      penetration += 0.2;
    }

    // Cap between 0.1 and 0.8
    penetration = Math.max(0.1, Math.min(0.8, penetration));

    // Calculate damage per second based on strength
    const damagePerSecond = strength * (0.5 + visualTier * 0.2);

    // Determine if damage has falloff
    const hasFalloff = Math.random() < 0.7; // 70% chance of falloff

    // Create the hazard effect
    return {
      id,
      type: 'damage',
      duration,
      strength,
      magnitude: strength,
      name: this.generateHazardName('damage', damageType, visualTier),
      description: this.generateHazardDescription('damage', damageType, strength, visualTier),
      radius,
      isMoving,
      visualTier,
      damageType,
      penetration,
      damagePerSecond,
      hasFalloff,
      active: true,
      cooldown: 0,
    };
  }

  /**
   * Create a field-based hazard
   */
  private createFieldHazard(
    id: string,
    _position: Position,
    strength: number,
    duration: number,
    radius: number,
    visualTier: 1 | 2 | 3,
    isMoving: boolean,
    difficulty: HazardGenerationConfig['difficulty'],
    theme?: HazardGenerationConfig['theme']
  ): FieldHazardEffect {
    // Determine field type based on theme and randomness
    let fieldType: FieldHazardEffect['fieldType'] = 'gravity';

    if (theme === 'blackHole') {
      fieldType = Math.random() < 0.8 ? 'gravity' : 'temporal';
    } else if (theme === 'nebula') {
      fieldType = Math.random() < 0.6 ? 'radiation' : 'magnetic';
    } else if (theme === 'solarFlare') {
      fieldType = Math.random() < 0.7 ? 'radiation' : 'magnetic';
    } else {
      // Random selection for default case
      const types: FieldHazardEffect['fieldType'][] = [
        'gravity',
        'magnetic',
        'radiation',
        'temporal',
      ];
      fieldType = types[Math.floor(Math.random() * types.length)];
    }

    // Calculate modifiers based on field type and strength
    let speedModifier = 0;
    let accuracyModifier = 0;
    let shieldModifier = 0;

    // Normalize strength to a -1 to 1 scale for modifiers
    // Higher strength means stronger negative effects
    const normalizedStrength = (strength / 100) * 2 - 1;

    switch (fieldType) {
      case 'gravity':
        // Gravity affects speed more than other attributes
        speedModifier = -0.5 * normalizedStrength;
        accuracyModifier = -0.2 * normalizedStrength;
        shieldModifier = -0.1 * normalizedStrength;
        break;
      case 'magnetic':
        // Magnetic fields affect shields and accuracy
        speedModifier = -0.1 * normalizedStrength;
        accuracyModifier = -0.4 * normalizedStrength;
        shieldModifier = -0.4 * normalizedStrength;
        break;
      case 'radiation':
        // Radiation affects shields the most
        speedModifier = -0.2 * normalizedStrength;
        accuracyModifier = -0.2 * normalizedStrength;
        shieldModifier = -0.6 * normalizedStrength;
        break;
      case 'temporal':
        // Temporal fields have varied effects
        speedModifier = -0.3 * normalizedStrength;
        accuracyModifier = -0.3 * normalizedStrength;
        shieldModifier = -0.3 * normalizedStrength;
        break;
    }

    // Adjust based on difficulty
    if (difficulty === 'hard') {
      speedModifier *= 1.2;
      accuracyModifier *= 1.2;
      shieldModifier *= 1.2;
    } else if (difficulty === 'extreme') {
      speedModifier *= 1.5;
      accuracyModifier *= 1.5;
      shieldModifier *= 1.5;
    } else if (difficulty === 'easy') {
      speedModifier *= 0.7;
      accuracyModifier *= 0.7;
      shieldModifier *= 0.7;
    }

    // Visual distortion based on strength and field type
    let distortionStrength = (strength / 100) * (0.5 + visualTier * 0.2);
    if (fieldType === 'temporal') {
      distortionStrength *= 1.5;
    }
    if (fieldType === 'gravity') {
      distortionStrength *= 1.3;
    }

    // Create the hazard effect
    return {
      id,
      type: 'field',
      duration,
      strength,
      magnitude: strength,
      name: this.generateHazardName('field', fieldType, visualTier),
      description: this.generateHazardDescription('field', fieldType, strength, visualTier),
      radius,
      isMoving,
      visualTier,
      fieldType,
      speedModifier,
      accuracyModifier,
      shieldModifier,
      distortionStrength,
      active: true,
      cooldown: 0,
    };
  }

  /**
   * Create a weather-based hazard
   */
  private createWeatherHazard(
    id: string,
    _position: Position,
    strength: number,
    duration: number,
    radius: number,
    visualTier: 1 | 2 | 3,
    isMoving: boolean,
    difficulty: HazardGenerationConfig['difficulty'],
    theme?: HazardGenerationConfig['theme']
  ): WeatherHazardEffect {
    // Determine weather type based on theme and randomness
    let weatherType: WeatherHazardEffect['weatherType'] = 'cosmicDust';

    if (theme === 'solarFlare') {
      weatherType = Math.random() < 0.8 ? 'solarFlare' : 'ionStorm';
    } else if (theme === 'nebula') {
      weatherType = Math.random() < 0.7 ? 'cosmicDust' : 'ionStorm';
    } else if (theme === 'asteroid') {
      weatherType = Math.random() < 0.8 ? 'spaceDebris' : 'cosmicDust';
    } else {
      // Random selection for default case
      const types: WeatherHazardEffect['weatherType'][] = [
        'solarFlare',
        'ionStorm',
        'cosmicDust',
        'spaceDebris',
      ];
      weatherType = types[Math.floor(Math.random() * types.length)];
    }

    // Calculate effect values based on strength
    const effectStrength = strength / 100;

    // Different weather types have different primary effects
    let visibilityReduction = 0.2 * effectStrength;
    let sensorReduction = 0.2 * effectStrength;
    let communicationInterference = 0.2 * effectStrength;

    switch (weatherType) {
      case 'solarFlare':
        communicationInterference = 0.5 * effectStrength;
        sensorReduction = 0.4 * effectStrength;
        visibilityReduction = 0.3 * effectStrength;
        break;
      case 'ionStorm':
        sensorReduction = 0.5 * effectStrength;
        communicationInterference = 0.4 * effectStrength;
        visibilityReduction = 0.3 * effectStrength;
        break;
      case 'cosmicDust':
        visibilityReduction = 0.6 * effectStrength;
        sensorReduction = 0.3 * effectStrength;
        communicationInterference = 0.2 * effectStrength;
        break;
      case 'spaceDebris':
        visibilityReduction = 0.4 * effectStrength;
        sensorReduction = 0.2 * effectStrength;
        communicationInterference = 0.1 * effectStrength;
        break;
    }

    // Adjust based on difficulty
    if (difficulty === 'hard') {
      visibilityReduction = Math.min(1, visibilityReduction * 1.3);
      sensorReduction = Math.min(1, sensorReduction * 1.3);
      communicationInterference = Math.min(1, communicationInterference * 1.3);
    } else if (difficulty === 'extreme') {
      visibilityReduction = Math.min(1, visibilityReduction * 1.6);
      sensorReduction = Math.min(1, sensorReduction * 1.6);
      communicationInterference = Math.min(1, communicationInterference * 1.6);
    } else if (difficulty === 'easy') {
      visibilityReduction *= 0.7;
      sensorReduction *= 0.7;
      communicationInterference *= 0.7;
    }

    // Particle density for visual effects, higher for better visual quality
    const particleDensity = 30 + 70 * (strength / 100) * (visualTier / 3);

    // Create the hazard effect
    return {
      id,
      type: 'weather',
      duration,
      strength,
      magnitude: strength,
      name: this.generateHazardName('weather', weatherType, visualTier),
      description: this.generateHazardDescription('weather', weatherType, strength, visualTier),
      radius,
      isMoving,
      visualTier,
      weatherType,
      visibilityReduction,
      sensorReduction,
      communicationInterference,
      particleDensity,
      active: true,
      cooldown: 0,
    };
  }

  /**
   * Create an anomaly-based hazard
   */
  private createAnomalyHazard(
    id: string,
    _position: Position,
    strength: number,
    duration: number,
    radius: number,
    visualTier: 1 | 2 | 3,
    isMoving: boolean,
    difficulty: HazardGenerationConfig['difficulty'],
    theme?: HazardGenerationConfig['theme']
  ): AnomalyHazardEffect {
    // Determine anomaly type - high tech levels allow more exotic anomalies
    let anomalyType: AnomalyHazardEffect['anomalyType'] = 'wormhole';

    if (theme === 'blackHole') {
      anomalyType = Math.random() < 0.7 ? 'wormhole' : 'dimensionalTear';
    } else {
      // All anomaly types have equal chance otherwise
      const types: AnomalyHazardEffect['anomalyType'][] = [
        'wormhole',
        'temporalRift',
        'quantumFluctuation',
        'dimensionalTear',
      ];
      anomalyType = types[Math.floor(Math.random() * types.length)];
    }

    // Determine teleportation capabilities
    const canTeleport =
      anomalyType === 'wormhole' || (anomalyType === 'dimensionalTear' && Math.random() < 0.5);

    // Effect properties based on type and strength
    const normalizedStrength = strength / 100;

    // Random effect chance increases with strength and difficulty
    let randomEffectChance = normalizedStrength * 0.5;
    if (difficulty === 'hard') {
      randomEffectChance *= 1.3;
    }
    if (difficulty === 'extreme') {
      randomEffectChance *= 1.6;
    }
    if (difficulty === 'easy') {
      randomEffectChance *= 0.7;
    }

    // Cap random effect chance
    randomEffectChance = Math.min(0.8, randomEffectChance);

    // Determine if anomaly pulsates
    const isPulsating = Math.random() < 0.7 || anomalyType === 'quantumFluctuation';

    // Different visual effects based on anomaly type
    let specialEffect = 'standard';
    switch (anomalyType) {
      case 'wormhole':
        specialEffect = 'vortex';
        break;
      case 'temporalRift':
        specialEffect = 'timewarp';
        break;
      case 'quantumFluctuation':
        specialEffect = 'quantum';
        break;
      case 'dimensionalTear':
        specialEffect = 'rift';
        break;
    }

    // Higher visual tier adds suffixes to the effect name
    if (visualTier === 2) {
      specialEffect += '-enhanced';
    }
    if (visualTier === 3) {
      specialEffect += '-advanced';
    }

    // Create the hazard effect
    return {
      id,
      type: 'anomaly',
      duration,
      strength,
      magnitude: strength,
      name: this.generateHazardName('anomaly', anomalyType, visualTier),
      description: this.generateHazardDescription('anomaly', anomalyType, strength, visualTier),
      radius,
      isMoving,
      visualTier,
      anomalyType,
      canTeleport,
      randomEffectChance,
      isPulsating,
      specialEffect,
      active: true,
      cooldown: 0,
    };
  }

  /**
   * Generate a hazard name based on its type and properties
   */
  private generateHazardName(
    type: HazardEffectType['type'],
    subType: string,
    tier: number
  ): string {
    const tierPrefix = tier === 1 ? '' : tier === 2 ? 'Strong ' : 'Intense ';

    switch (type) {
      case 'damage': {
        const damageNames: Record<string, string> = {
          physical: 'Asteroid Field',
          energy: 'Energy Surge',
          corrosive: 'Corrosive Cloud',
          thermal: 'Thermal Vent',
        };
        return `${tierPrefix}${damageNames[subType] || 'Damaging Hazard'}`;
      }

      case 'field': {
        const fieldNames: Record<string, string> = {
          gravity: 'Gravity Well',
          magnetic: 'Magnetic Distortion',
          radiation: 'Radiation Zone',
          temporal: 'Time Distortion',
        };
        return `${tierPrefix}${fieldNames[subType] || 'Field Hazard'}`;
      }

      case 'weather': {
        const weatherNames: Record<string, string> = {
          solarFlare: 'Solar Flare',
          ionStorm: 'Ion Storm',
          cosmicDust: 'Cosmic Dust Cloud',
          spaceDebris: 'Space Debris Field',
        };
        return `${tierPrefix}${weatherNames[subType] || 'Space Weather'}`;
      }

      case 'anomaly': {
        const anomalyNames: Record<string, string> = {
          wormhole: 'Wormhole',
          temporalRift: 'Temporal Rift',
          quantumFluctuation: 'Quantum Fluctuation',
          dimensionalTear: 'Dimensional Tear',
        };
        return `${tierPrefix}${anomalyNames[subType] || 'Spatial Anomaly'}`;
      }

      default:
        return `${tierPrefix}Environmental Hazard`;
    }
  }

  /**
   * Generate a description for a hazard based on its type and properties
   */
  private generateHazardDescription(
    type: HazardEffectType['type'],
    subType: string,
    strength: number,
    _tier: number
  ): string {
    const intensity = strength < 40 ? 'minor' : strength < 70 ? 'significant' : 'severe';

    switch (type) {
      case 'damage': {
        const damageDesc: Record<string, string> = {
          physical: `Causes ${intensity} physical damage to ships traveling through it.`,
          energy: `Emits ${intensity} energy discharges that damage ship systems.`,
          corrosive: `Contains ${intensity} corrosive particles that eat through ship hulls.`,
          thermal: `Generates ${intensity} heat that can damage ship components.`,
        };
        return damageDesc[subType] || `Causes ${intensity} damage to ships.`;
      }

      case 'field': {
        const fieldDesc: Record<string, string> = {
          gravity: `Creates a ${intensity} gravitational pull that affects ship movement.`,
          magnetic: `Generates ${intensity} magnetic interference that affects ship systems.`,
          radiation: `Emits ${intensity} radiation that disrupts shields and sensors.`,
          temporal: `Creates ${intensity} temporal distortions that affect ship systems in unpredictable ways.`,
        };
        return fieldDesc[subType] || `Generates a ${intensity} field effect in the area.`;
      }

      case 'weather': {
        const weatherDesc: Record<string, string> = {
          solarFlare: `A ${intensity} solar flare causing interference with communications and sensors.`,
          ionStorm: `A ${intensity} ion storm that can disrupt ship systems and shields.`,
          cosmicDust: `A ${intensity} cloud of cosmic dust that reduces visibility and sensor range.`,
          spaceDebris: `A ${intensity} field of space debris that can damage ship hulls.`,
        };
        return weatherDesc[subType] || `Creates ${intensity} space weather conditions.`;
      }

      case 'anomaly': {
        const anomalyDesc: Record<string, string> = {
          wormhole: `A ${intensity} spatial anomaly that can teleport ships to other locations.`,
          temporalRift: `A ${intensity} tear in spacetime that causes temporal distortions.`,
          quantumFluctuation: `A ${intensity} quantum phenomenon that has unpredictable effects on ships.`,
          dimensionalTear: `A ${intensity} breach between dimensions with strange properties.`,
        };
        return anomalyDesc[subType] || `A ${intensity} spatial anomaly with unknown effects.`;
      }

      default:
        return `An environmental hazard with ${intensity} effects.`;
    }
  }
}

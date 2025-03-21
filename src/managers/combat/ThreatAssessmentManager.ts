import { EventEmitter } from '../../lib/events/EventEmitter';
import { CombatUnit } from '../../types/combat/CombatTypes';
import { getDistance } from '../../utils/combat/scanRadiusUtils';
import { DetectableObject } from './ObjectDetectionSystem';

/**
 * Enum for threat levels
 */
export enum ThreatLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Enum for threat types
 */
export enum ThreatType {
  COMBAT = 'combat',
  ENVIRONMENTAL = 'environmental',
  UNKNOWN = 'unknown',
}

/**
 * Interface for a threat assessment
 */
export interface ThreatAssessment {
  targetId: string;
  level: ThreatLevel;
  type: ThreatType;
  distance: number;
  bearing: number;
  estimatedDamageOutput: number;
  estimatedTimeToImpact: number;
  timestamp: number;
}

/**
 * Events emitted by the ThreatAssessmentManager
 */
export enum ThreatAssessmentEvent {
  THREAT_DETECTED = 'THREAT_DETECTED',
  THREAT_UPDATED = 'THREAT_UPDATED',
  THREAT_REMOVED = 'THREAT_REMOVED',
  THREAT_LEVEL_CHANGED = 'THREAT_LEVEL_CHANGED',
}

/**
 * Event data interfaces
 */
export interface ThreatDetectedEventData {
  assessment: ThreatAssessment;
  sourceId: string;
}

export interface ThreatUpdatedEventData {
  assessment: ThreatAssessment;
  previousAssessment: ThreatAssessment;
  sourceId: string;
}

export interface ThreatRemovedEventData {
  targetId: string;
  reason: 'DESTROYED' | 'OUT_OF_RANGE' | 'FRIENDLY' | 'MANUAL';
  sourceId: string;
}

export interface ThreatLevelChangedEventData {
  targetId: string;
  previousLevel: ThreatLevel;
  newLevel: ThreatLevel;
  sourceId: string;
}

// Event map for the threat assessment system
export interface ThreatAssessmentEventMap extends Record<string, unknown> {
  [ThreatAssessmentEvent.THREAT_DETECTED]: ThreatDetectedEventData;
  [ThreatAssessmentEvent.THREAT_UPDATED]: ThreatUpdatedEventData;
  [ThreatAssessmentEvent.THREAT_REMOVED]: ThreatRemovedEventData;
  [ThreatAssessmentEvent.THREAT_LEVEL_CHANGED]: ThreatLevelChangedEventData;
}

/**
 * Types for environmental hazards
 */
export interface EnvironmentalHazard {
  id: string;
  position: { x: number; y: number };
  radius: number;
  type: string;
  severity: number; // 0-1, higher is more severe
  effects: Array<{ type: string; value: number }>;
}

/**
 * Interface for the ThreatAssessmentManager
 */
export interface ThreatAssessmentManager {
  assessThreat(detectedObject: DetectableObject, observerId: string): ThreatAssessment;
  updateThreatAssessment(targetId: string, observerId: string): void;
  getActiveThreatsByLevel(level: ThreatLevel, observerId: string): ThreatAssessment[];
  getHighestThreatLevel(observerId: string): ThreatLevel;
  getThreatsInRange(
    position: { x: number; y: number },
    range: number,
    observerId: string
  ): ThreatAssessment[];
  removeThreat(
    targetId: string,
    reason: ThreatRemovedEventData['reason'],
    observerId: string
  ): void;
  on<K extends ThreatAssessmentEvent>(
    event: K,
    callback: (data: ThreatAssessmentEventMap[K]) => void
  ): void;
  off<K extends ThreatAssessmentEvent>(
    event: K,
    callback: (data: ThreatAssessmentEventMap[K]) => void
  ): void;
}

/**
 * @context: combat-system.threat-assessment, manager-registry
 * Implementation of the threat assessment manager following the singleton pattern
 */
export class ThreatAssessmentManagerImpl implements ThreatAssessmentManager {
  private static instance: ThreatAssessmentManagerImpl | null = null;
  
  // Maps observerId -> targetId -> assessment
  private threatAssessments: Map<string, Map<string, ThreatAssessment>> = new Map();

  // Additional data for threat calculation
  private knownCombatUnits: Map<string, CombatUnit> = new Map();
  private environmentalHazards: Map<string, EnvironmentalHazard> = new Map();

  // Emit events when threats change
  private eventEmitter = new EventEmitter<ThreatAssessmentEventMap>();

  // Configuration values
  private readonly CRITICAL_THREAT_DISTANCE = 200;
  private readonly HIGH_THREAT_DISTANCE = 500;
  private readonly MEDIUM_THREAT_DISTANCE = 1000;
  private readonly LOW_THREAT_DISTANCE = 2000;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize any required setup
  }
  
  /**
   * Get the singleton instance of ThreatAssessmentManagerImpl
   */
  public static getInstance(): ThreatAssessmentManagerImpl {
    if (!ThreatAssessmentManagerImpl.instance) {
      ThreatAssessmentManagerImpl.instance = new ThreatAssessmentManagerImpl();
    }
    return ThreatAssessmentManagerImpl.instance;
  }

  /**
   * Register known combat units for more accurate threat assessment
   */
  public registerCombatUnit(unit: CombatUnit): void {
    this.knownCombatUnits.set(unit.id, unit);
  }

  /**
   * Get all active threats for an observer regardless of level
   */
  public getAllThreats(observerId: string): ThreatAssessment[] {
    const observerThreats = this.threatAssessments.get(observerId);
    if (!observerThreats) {
      return [];
    }

    return Array.from(observerThreats.values());
  }

  /**
   * Get all threats at or above a specific level for an observer
   */
  public getActiveThreatsByLevel(level: ThreatLevel, observerId: string): ThreatAssessment[] {
    const allThreats = this.getAllThreats(observerId);

    const threatLevelValues = {
      [ThreatLevel.NONE]: 0,
      [ThreatLevel.LOW]: 1,
      [ThreatLevel.MEDIUM]: 2,
      [ThreatLevel.HIGH]: 3,
      [ThreatLevel.CRITICAL]: 4,
    };

    const minimumThreatValue = threatLevelValues[level];

    return allThreats.filter(threat => threatLevelValues[threat.level] >= minimumThreatValue);
  }

  /**
   * Get the highest current threat level for an observer
   */
  public getHighestThreatLevel(observerId: string): ThreatLevel {
    const allThreats = this.getAllThreats(observerId);
    if (allThreats.length === 0) {
      return ThreatLevel.NONE;
    }

    const threatLevelValues = {
      [ThreatLevel.NONE]: 0,
      [ThreatLevel.LOW]: 1,
      [ThreatLevel.MEDIUM]: 2,
      [ThreatLevel.HIGH]: 3,
      [ThreatLevel.CRITICAL]: 4,
    };

    let highestLevel = ThreatLevel.NONE;
    let highestValue = 0;

    for (const threat of allThreats) {
      const value = threatLevelValues[threat.level];
      if (value > highestValue) {
        highestValue = value;
        highestLevel = threat.level;
      }
    }

    return highestLevel;
  }

  /**
   * Get all threats within a specific range of a position
   */
  public getThreatsInRange(
    position: { x: number; y: number },
    range: number,
    observerId: string
  ): ThreatAssessment[] {
    const allThreats = this.getAllThreats(observerId);

    return allThreats.filter(threat => {
      // Check if we have the detected object in our registry
      const detectedObject = this.knownCombatUnits.get(threat.targetId);
      if (!detectedObject) {
        return false;
      }

      // Calculate distance
      const distance = getDistance(position, detectedObject.position);
      return distance <= range;
    });
  }

  /**
   * Remove a threat from tracking
   */
  public removeThreat(
    targetId: string,
    reason: ThreatRemovedEventData['reason'],
    observerId: string
  ): void {
    const observerThreats = this.threatAssessments.get(observerId);
    if (!observerThreats) {
      return;
    }

    // Check if threat exists
    const existingThreat = observerThreats.get(targetId);
    if (!existingThreat) {
      return;
    }

    // Remove the threat
    observerThreats.delete(targetId);

    // Emit event
    this.eventEmitter.emit(ThreatAssessmentEvent.THREAT_REMOVED, {
      targetId,
      reason,
      sourceId: observerId,
    });
  }

  /**
   * Assess the threat level of a detected object
   */
  public assessThreat(detectedObject: DetectableObject, observerId: string): ThreatAssessment {
    // Find the observer
    const observer = this.knownCombatUnits.get(observerId);
    if (!observer) {
      throw new Error(`Observer with ID ${observerId} not found.`);
    }

    // Calculate base threat level based on distance
    const distance = getDistance(observer.position, detectedObject.position);
    let threatLevel = this.calculateBaseThreatLevel(distance);

    // Enhance threat assessment for known combat units
    const knownUnit = this.knownCombatUnits.get(detectedObject.id);

    // Calculate damage output potential
    let estimatedDamageOutput = 0;
    if (knownUnit) {
      estimatedDamageOutput = this.calculateDamageOutput(knownUnit);

      // Adjust threat level based on weapon capabilities
      threatLevel = this.adjustThreatLevelForWeapons(threatLevel, knownUnit, observer, distance);
    }

    // Calculate bearing
    const bearing = this.calculateBearing(observer.position, detectedObject.position);

    // Estimate time to impact (assuming direct approach at max speed)
    const estimatedTimeToImpact = knownUnit
      ? distance / knownUnit.stats.speed
      : Number.POSITIVE_INFINITY;

    // Create assessment
    const assessment: ThreatAssessment = {
      targetId: detectedObject.id,
      level: threatLevel,
      type: knownUnit ? ThreatType.COMBAT : ThreatType.UNKNOWN,
      distance,
      bearing,
      estimatedDamageOutput,
      estimatedTimeToImpact,
      timestamp: Date.now(),
    };

    // Store assessment
    let observerThreats = this.threatAssessments.get(observerId);
    if (!observerThreats) {
      observerThreats = new Map();
      this.threatAssessments.set(observerId, observerThreats);
    }

    const existingAssessment = observerThreats.get(detectedObject.id);
    observerThreats.set(detectedObject.id, assessment);

    // Emit appropriate event
    if (existingAssessment) {
      if (existingAssessment.level !== assessment.level) {
        this.eventEmitter.emit(ThreatAssessmentEvent.THREAT_LEVEL_CHANGED, {
          targetId: detectedObject.id,
          previousLevel: existingAssessment.level,
          newLevel: assessment.level,
          sourceId: observerId,
        });
      }

      this.eventEmitter.emit(ThreatAssessmentEvent.THREAT_UPDATED, {
        assessment,
        previousAssessment: existingAssessment,
        sourceId: observerId,
      });
    } else {
      this.eventEmitter.emit(ThreatAssessmentEvent.THREAT_DETECTED, {
        assessment,
        sourceId: observerId,
      });
    }

    return assessment;
  }

  /**
   * Update a threat assessment for an already detected object
   */
  public updateThreatAssessment(targetId: string, observerId: string): void {
    // Get current observer threats
    const observerThreats = this.threatAssessments.get(observerId);
    if (!observerThreats) {
      return;
    }

    // Get existing assessment
    const existingAssessment = observerThreats.get(targetId);
    if (!existingAssessment) {
      return;
    }

    // Get target and observer units
    const targetUnit = this.knownCombatUnits.get(targetId);
    const observerUnit = this.knownCombatUnits.get(observerId);

    if (!targetUnit || !observerUnit) {
      // If either unit is not found, consider the threat lost
      this.removeThreat(targetId, 'OUT_OF_RANGE', observerId);
      return;
    }

    // Recalculate the threat assessment
    const detectedObject: DetectableObject = {
      id: targetUnit.id,
      position: targetUnit.position,
      type: targetUnit.type,
      faction: 'unknown', // This would come from your faction system
      signature: 0.5,
      isActive: true,
    };

    this.assessThreat(detectedObject, observerId);
  }

  /**
   * Calculate base threat level based on distance
   */
  private calculateBaseThreatLevel(distance: number): ThreatLevel {
    if (distance <= this.CRITICAL_THREAT_DISTANCE) {
      return ThreatLevel.CRITICAL;
    } else if (distance <= this.HIGH_THREAT_DISTANCE) {
      return ThreatLevel.HIGH;
    } else if (distance <= this.MEDIUM_THREAT_DISTANCE) {
      return ThreatLevel.MEDIUM;
    } else if (distance <= this.LOW_THREAT_DISTANCE) {
      return ThreatLevel.LOW;
    }

    return ThreatLevel.NONE;
  }

  /**
   * Calculate potential damage output of a unit
   */
  private calculateDamageOutput(unit: CombatUnit): number {
    let totalDamage = 0;

    // Sum up damage potential of all weapons
    for (const weapon of unit.weapons) {
      // Skip disabled weapons
      if (weapon.status === 'disabled') {
        continue;
      }

      totalDamage += weapon.damage;
    }

    return totalDamage;
  }

  /**
   * Adjust threat level based on weapon capabilities
   */
  private adjustThreatLevelForWeapons(
    baseLevel: ThreatLevel,
    targetUnit: CombatUnit,
    observerUnit: CombatUnit,
    distance: number
  ): ThreatLevel {
    const threatLevelValues = {
      [ThreatLevel.NONE]: 0,
      [ThreatLevel.LOW]: 1,
      [ThreatLevel.MEDIUM]: 2,
      [ThreatLevel.HIGH]: 3,
      [ThreatLevel.CRITICAL]: 4,
    };

    let threatValue = threatLevelValues[baseLevel];

    // Check if target weapons are in range
    const hasWeaponsInRange = targetUnit.weapons.some(
      weapon => weapon.range >= distance && weapon.status !== 'disabled'
    );

    if (hasWeaponsInRange) {
      // Increase threat level if weapons are in range
      threatValue += 1;
    }

    // Calculate damage potential ratio
    const targetDamageOutput = this.calculateDamageOutput(targetUnit);
    const observerHealth = observerUnit.stats.health + observerUnit.stats.shield;

    // If target can potentially deal more than 50% of observer's health + shield, increase threat
    if (targetDamageOutput >= observerHealth * 0.5) {
      threatValue += 1;
    }

    // Cap threat level
    threatValue = Math.min(threatValue, 4);

    // Convert back to enum
    const threatLevels = [
      ThreatLevel.NONE,
      ThreatLevel.LOW,
      ThreatLevel.MEDIUM,
      ThreatLevel.HIGH,
      ThreatLevel.CRITICAL,
    ];

    return threatLevels[threatValue];
  }

  /**
   * Calculate bearing from source to target in degrees (0-359)
   */
  private calculateBearing(
    source: { x: number; y: number },
    target: { x: number; y: number }
  ): number {
    const deltaX = target.x - source.x;
    const deltaY = target.y - source.y;

    // Calculate angle in radians
    const angleRad = Math.atan2(deltaY, deltaX);

    // Convert to degrees and ensure 0-359 range
    let angleDeg = ((angleRad * 180) / Math.PI) % 360;
    if (angleDeg < 0) {
      angleDeg += 360;
    }

    return angleDeg;
  }

  /**
   * Register event listener
   */
  public on<K extends ThreatAssessmentEvent>(
    event: K,
    callback: (data: ThreatAssessmentEventMap[K]) => void
  ): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Remove event listener
   */
  public off<K extends ThreatAssessmentEvent>(
    event: K,
    callback: (data: ThreatAssessmentEventMap[K]) => void
  ): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Register an environmental hazard for threat assessment
   */
  public registerEnvironmentalHazard(hazard: EnvironmentalHazard): void {
    this.environmentalHazards.set(hazard.id, hazard);

    // Register the hazard with all known units
    for (const unitId of this.knownCombatUnits.keys()) {
      this.assessHazardThreat(unitId, hazard);
    }
  }

  /**
   * Unregister an environmental hazard
   */
  public unregisterEnvironmentalHazard(hazardId: string): void {
    this.environmentalHazards.delete(hazardId);

    // Remove this hazard from all threat assessments
    for (const [unitId, threats] of this.threatAssessments.entries()) {
      if (threats.has(hazardId)) {
        threats.delete(hazardId);
        this.eventEmitter.emit(ThreatAssessmentEvent.THREAT_REMOVED, {
          sourceId: unitId,
          targetId: hazardId,
          reason: 'MANUAL',
        });
      }
    }
  }

  /**
   * Assess the threat level of a hazard for a specific unit
   */
  private assessHazardThreat(unitId: string, hazard: EnvironmentalHazard): void {
    const unit = this.knownCombatUnits.get(unitId);
    if (!unit) return;

    const distance = getDistance(unit.position, hazard.position);

    // Determine threat level based on distance and hazard severity
    let threatLevel = ThreatLevel.NONE;

    if (distance <= hazard.radius) {
      // Unit is inside the hazard
      threatLevel = hazard.severity > 0.7 ? ThreatLevel.CRITICAL : ThreatLevel.HIGH;
    } else {
      // Unit is outside but within range
      const normalizedDistance = (distance - hazard.radius) / this.LOW_THREAT_DISTANCE;
      if (normalizedDistance < 0.2) {
        threatLevel = ThreatLevel.HIGH;
      } else if (normalizedDistance < 0.5) {
        threatLevel = ThreatLevel.MEDIUM;
      } else if (normalizedDistance < 1.0) {
        threatLevel = ThreatLevel.LOW;
      }
    }

    // Only create an assessment if there's a threat
    if (threatLevel !== ThreatLevel.NONE) {
      // Create or update the threat assessment
      const assessment: ThreatAssessment = {
        targetId: hazard.id,
        level: threatLevel,
        type: ThreatType.ENVIRONMENTAL,
        distance: distance,
        bearing: 0, // Calculate if needed
        estimatedDamageOutput: hazard.severity * 100, // Rough estimate
        estimatedTimeToImpact: 0, // Immediate for environmental hazards
        timestamp: Date.now(),
      };

      // Store the assessment
      let unitThreats = this.threatAssessments.get(unitId);
      if (!unitThreats) {
        unitThreats = new Map();
        this.threatAssessments.set(unitId, unitThreats);
      }

      const existingAssessment = unitThreats.get(hazard.id);
      unitThreats.set(hazard.id, assessment);

      // Emit appropriate event
      if (!existingAssessment) {
        this.eventEmitter.emit(ThreatAssessmentEvent.THREAT_DETECTED, {
          sourceId: unitId,
          assessment,
        });
      } else if (existingAssessment.level !== assessment.level) {
        this.eventEmitter.emit(ThreatAssessmentEvent.THREAT_LEVEL_CHANGED, {
          sourceId: unitId,
          targetId: hazard.id,
          previousLevel: existingAssessment.level,
          newLevel: assessment.level,
        });
      } else {
        this.eventEmitter.emit(ThreatAssessmentEvent.THREAT_UPDATED, {
          sourceId: unitId,
          assessment,
          previousAssessment: existingAssessment,
        });
      }
    }
  }

  /**
   * Get all environmental hazards that pose a threat to a unit
   */
  public getEnvironmentalThreats(unitId: string): ThreatAssessment[] {
    const unitThreats = this.threatAssessments.get(unitId);
    if (!unitThreats) return [];

    return Array.from(unitThreats.values())
      .filter(threat => threat.type === ThreatType.ENVIRONMENTAL)
      .sort((a, b) => {
        // Sort by threat level (critical first)
        if (a.level !== b.level) {
          return this.getThreatLevelValue(b.level) - this.getThreatLevelValue(a.level);
        }
        // Then by distance (closest first)
        return a.distance - b.distance;
      });
  }

  /**
   * Helper to convert threat level to numeric value for sorting
   */
  private getThreatLevelValue(level: ThreatLevel): number {
    switch (level) {
      case ThreatLevel.CRITICAL:
        return 4;
      case ThreatLevel.HIGH:
        return 3;
      case ThreatLevel.MEDIUM:
        return 2;
      case ThreatLevel.LOW:
        return 1;
      case ThreatLevel.NONE:
        return 0;
      default:
        return 0;
    }
  }
}

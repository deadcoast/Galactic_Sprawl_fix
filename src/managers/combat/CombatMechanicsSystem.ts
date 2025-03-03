import { CombatEffect, CombatUnit, Projectile } from '../../types/combat/CombatTypes';
import { EventEmitter } from '../../utils/EventEmitter';
import { getDistance } from '../../utils/combat/scanRadiusUtils';
import { ObjectDetectionSystem } from './ObjectDetectionSystem';

/**
 * Combat mechanics events
 */
export enum CombatEvent {
  WEAPON_FIRED = 'WEAPON_FIRED',
  PROJECTILE_IMPACT = 'PROJECTILE_IMPACT',
  COMBAT_DAMAGE = 'COMBAT_DAMAGE',
  SHIELD_IMPACT = 'SHIELD_IMPACT',
  CRITICAL_HIT = 'CRITICAL_HIT',
  UNIT_DESTROYED = 'UNIT_DESTROYED',
  COMBAT_STARTED = 'COMBAT_STARTED',
  COMBAT_ENDED = 'COMBAT_ENDED',
  EFFECT_APPLIED = 'EFFECT_APPLIED',
  EFFECT_EXPIRED = 'EFFECT_EXPIRED',
}

/**
 * Types for event data
 */
export interface WeaponFiredEventData {
  sourceId: string;
  targetId?: string;
  weaponId: string;
  position: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  weaponType: string;
  projectileId: string;
  timestamp: number;
}

export interface ProjectileImpactEventData {
  projectileId: string;
  targetId?: string;
  position: { x: number; y: number };
  damage: number;
  effects: string[];
  timestamp: number;
}

export interface CombatDamageEventData {
  targetId: string;
  sourceId: string;
  damageAmount: number;
  damageType: string;
  previousHealth: number;
  currentHealth: number;
  timestamp: number;
}

export interface ShieldImpactEventData {
  targetId: string;
  sourceId: string;
  damageAmount: number;
  previousShield: number;
  currentShield: number;
  shieldBreached: boolean;
  timestamp: number;
}

export interface CriticalHitEventData {
  targetId: string;
  sourceId: string;
  location: string;
  multiplier: number;
  effects: string[];
  timestamp: number;
}

export interface UnitDestroyedEventData {
  unitId: string;
  destroyedById: string;
  position: { x: number; y: number };
  timestamp: number;
}

export interface CombatStartedEventData {
  initiatorId: string;
  defenderId: string;
  position: { x: number; y: number };
  reason: 'ATTACK' | 'DEFENSE' | 'PATROL' | 'AMBUSH';
  timestamp: number;
}

export interface CombatEndedEventData {
  participantIds: string[];
  winnerId?: string;
  position: { x: number; y: number };
  reason: 'DESTROYED' | 'RETREATED' | 'TIMEOUT' | 'OBJECTIVE_COMPLETE';
  duration: number;
  timestamp: number;
}

export interface EffectAppliedEventData {
  targetId: string;
  sourceId: string;
  effectId: string;
  effectType: string;
  duration: number;
  strength: number;
  timestamp: number;
}

export interface EffectExpiredEventData {
  targetId: string;
  effectId: string;
  effectType: string;
  finalImpact?: Record<string, unknown>;
  timestamp: number;
}

// Interface for combat mechanics event map
export interface CombatEventMap extends Record<string, unknown> {
  [CombatEvent.WEAPON_FIRED]: WeaponFiredEventData;
  [CombatEvent.PROJECTILE_IMPACT]: ProjectileImpactEventData;
  [CombatEvent.COMBAT_DAMAGE]: CombatDamageEventData;
  [CombatEvent.SHIELD_IMPACT]: ShieldImpactEventData;
  [CombatEvent.CRITICAL_HIT]: CriticalHitEventData;
  [CombatEvent.UNIT_DESTROYED]: UnitDestroyedEventData;
  [CombatEvent.COMBAT_STARTED]: CombatStartedEventData;
  [CombatEvent.COMBAT_ENDED]: CombatEndedEventData;
  [CombatEvent.EFFECT_APPLIED]: EffectAppliedEventData;
  [CombatEvent.EFFECT_EXPIRED]: EffectExpiredEventData;
}

// Critical hit locations
export enum CriticalHitLocation {
  ENGINES = 'engines',
  WEAPONS = 'weapons',
  SENSORS = 'sensors',
  POWER_CORE = 'power_core',
  LIFE_SUPPORT = 'life_support',
  COMMAND_BRIDGE = 'command_bridge',
}

// Interface for combat mechanics system
export interface CombatMechanicsSystem {
  initiateCombat(
    attackerId: string,
    defenderId: string,
    reason: CombatStartedEventData['reason']
  ): void;
  endCombat(
    participantIds: string[],
    reason: CombatEndedEventData['reason'],
    winnerId?: string
  ): void;
  fireWeapon(
    unitId: string,
    weaponId: string,
    targetPosition?: { x: number; y: number },
    targetId?: string
  ): void;
  updateProjectiles(deltaTime: number): void;
  applyDamage(targetId: string, sourceId: string, damage: number, damageType: string): void;
  applyEffect(
    targetId: string,
    sourceId: string,
    effectType: string,
    duration: number,
    strength: number
  ): string;
  removeEffect(targetId: string, effectId: string): void;
  checkCriticalHit(targetId: string, sourceId: string, damage: number): boolean;
  canTargetUnit(sourceId: string, targetId: string): boolean;
  isInWeaponRange(sourceId: string, targetId: string, weaponId: string): boolean;
  on<K extends CombatEvent>(event: K, callback: (data: CombatEventMap[K]) => void): void;
  off<K extends CombatEvent>(event: K, callback: (data: CombatEventMap[K]) => void): void;
}

/**
 * Implementation of the combat mechanics system
 */
export class CombatMechanicsSystemImpl implements CombatMechanicsSystem {
  private combatUnits: Map<string, CombatUnit> = new Map();
  private projectiles: Map<string, Projectile> = new Map();
  private activeEffects: Map<string, CombatEffect> = new Map();
  private activeCombats: Map<string, Set<string>> = new Map(); // unitId -> Set of opponent unitIds

  private eventEmitter = new EventEmitter<CombatEventMap>();
  private idCounter = 0;

  // Optional dependency on detection system for visibility checks
  private detectionSystem?: ObjectDetectionSystem;

  // Configuration
  private readonly CRITICAL_HIT_THRESHOLD = 0.2; // Health % below which critical hits become more likely
  private readonly BASE_CRITICAL_CHANCE = 0.05; // 5% base chance for critical hit
  private readonly CRITICAL_HIT_DAMAGE_MULTIPLIER = 1.5; // 50% more damage on critical hit
  private readonly SHIELD_DAMAGE_REDUCTION = 0.7; // Shields reduce damage by 30%
  private readonly ARMOR_DAMAGE_REDUCTION_PER_POINT = 0.02; // Each armor point reduces damage by 2%

  constructor(detectionSystem?: ObjectDetectionSystem) {
    this.detectionSystem = detectionSystem;
  }

  /**
   * Register a combat unit with the system
   */
  public registerUnit(unit: CombatUnit): void {
    this.combatUnits.set(unit.id, unit);
  }

  /**
   * Unregister a combat unit from the system
   */
  public unregisterUnit(unitId: string): void {
    this.combatUnits.delete(unitId);

    // Clean up active combats
    this.activeCombats.delete(unitId);
    for (const [combatantId, opponents] of this.activeCombats.entries()) {
      if (opponents.has(unitId)) {
        opponents.delete(unitId);

        // If no more opponents, end combat
        if (opponents.size === 0) {
          this.activeCombats.delete(combatantId);
        }
      }
    }
  }

  /**
   * Initiate combat between two units
   */
  public initiateCombat(
    attackerId: string,
    defenderId: string,
    reason: CombatStartedEventData['reason']
  ): void {
    const attacker = this.combatUnits.get(attackerId);
    const defender = this.combatUnits.get(defenderId);

    if (!attacker || !defender) {
      console.error(`Cannot initiate combat: units not found`);
      return;
    }

    // Add units to active combats
    let attackerOpponents = this.activeCombats.get(attackerId);
    if (!attackerOpponents) {
      attackerOpponents = new Set();
      this.activeCombats.set(attackerId, attackerOpponents);
    }
    attackerOpponents.add(defenderId);

    let defenderOpponents = this.activeCombats.get(defenderId);
    if (!defenderOpponents) {
      defenderOpponents = new Set();
      this.activeCombats.set(defenderId, defenderOpponents);
    }
    defenderOpponents.add(attackerId);

    // Emit combat started event
    this.eventEmitter.emit(CombatEvent.COMBAT_STARTED, {
      initiatorId: attackerId,
      defenderId,
      position: attacker.position,
      reason,
      timestamp: Date.now(),
    });
  }

  /**
   * End combat for a group of participants
   */
  public endCombat(
    participantIds: string[],
    reason: CombatEndedEventData['reason'],
    winnerId?: string
  ): void {
    // Cleanup active combats
    for (const unitId of participantIds) {
      this.activeCombats.delete(unitId);
    }

    // Find a representative position
    let position = { x: 0, y: 0 };
    for (const unitId of participantIds) {
      const unit = this.combatUnits.get(unitId);
      if (unit) {
        position = unit.position;
        break;
      }
    }

    // Emit combat ended event
    this.eventEmitter.emit(CombatEvent.COMBAT_ENDED, {
      participantIds,
      winnerId,
      position,
      reason,
      duration: 0, // Would need to track start time
      timestamp: Date.now(),
    });
  }

  /**
   * Fire a weapon from a unit at a target
   */
  public fireWeapon(
    unitId: string,
    weaponId: string,
    targetPosition?: { x: number; y: number },
    targetId?: string
  ): void {
    const unit = this.combatUnits.get(unitId);
    if (!unit) {
      console.error(`Cannot fire weapon: unit ${unitId} not found`);
      return;
    }

    // Find the weapon
    const weapon = unit.weapons.find(w => w.id === weaponId);
    if (!weapon) {
      console.error(`Cannot fire weapon: weapon ${weaponId} not found on unit ${unitId}`);
      return;
    }

    // Check if weapon is ready to fire
    if (weapon.status !== 'ready') {
      console.error(`Cannot fire weapon: weapon ${weaponId} is not ready (${weapon.status})`);
      return;
    }

    // Determine target position
    let finalTargetPosition: { x: number; y: number } | undefined;

    if (targetPosition) {
      finalTargetPosition = targetPosition;
    } else if (targetId) {
      const targetUnit = this.combatUnits.get(targetId);
      if (targetUnit) {
        finalTargetPosition = targetUnit.position;
      }
    }

    if (!finalTargetPosition) {
      console.error(`Cannot fire weapon: no valid target specified`);
      return;
    }

    // Check if target is in range
    const distance = getDistance(unit.position, finalTargetPosition);
    if (distance > weapon.range) {
      console.error(`Cannot fire weapon: target is out of range (${distance} > ${weapon.range})`);
      return;
    }

    // Generate projectile
    const projectileId = `projectile_${unitId}_${Date.now()}_${this.idCounter++}`;
    const projectile: Projectile = {
      id: projectileId,
      position: { ...unit.position },
      velocity: this.calculateProjectileVelocity(unit.position, finalTargetPosition),
      damage: weapon.damage,
      effects: [], // Would be determined by weapon type
      sourceId: unitId,
      targetId,
    };

    // Add projectile to active projectiles
    this.projectiles.set(projectileId, projectile);

    // Set weapon on cooldown
    weapon.status = 'cooling';
    setTimeout(() => {
      if (weapon) {
        weapon.status = 'ready';
      }
    }, weapon.cooldown);

    // Emit weapon fired event
    this.eventEmitter.emit(CombatEvent.WEAPON_FIRED, {
      sourceId: unitId,
      targetId,
      weaponId,
      position: unit.position,
      targetPosition: finalTargetPosition,
      weaponType: weapon.type,
      projectileId,
      timestamp: Date.now(),
    });
  }

  /**
   * Calculate projectile velocity based on source and target positions
   */
  private calculateProjectileVelocity(
    source: { x: number; y: number },
    target: { x: number; y: number }
  ): { x: number; y: number } {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize direction vector and multiply by speed
    const speed = 500; // Pixels per second, configurable
    return {
      x: (dx / distance) * speed,
      y: (dy / distance) * speed,
    };
  }

  /**
   * Update projectile positions and check for impacts
   */
  public updateProjectiles(deltaTime: number): void {
    for (const [projectileId, projectile] of this.projectiles.entries()) {
      // Update position
      projectile.position.x += projectile.velocity.x * deltaTime;
      projectile.position.y += projectile.velocity.y * deltaTime;

      // Check for impact with target
      if (projectile.targetId) {
        const targetUnit = this.combatUnits.get(projectile.targetId);
        if (targetUnit) {
          const distance = getDistance(projectile.position, targetUnit.position);
          const impactRadius = 20; // Configurable

          if (distance <= impactRadius) {
            // Impact with target
            this.handleProjectileImpact(projectileId, projectile, projectile.targetId);
            continue; // Skip further checks
          }
        }
      }

      // If no specific target or target not hit, check all units
      for (const [unitId, unit] of this.combatUnits.entries()) {
        // Skip source unit
        if (unitId === projectile.sourceId) {
          continue;
        }

        const distance = getDistance(projectile.position, unit.position);
        const impactRadius = 20; // Configurable

        if (distance <= impactRadius) {
          // Impact with unit
          this.handleProjectileImpact(projectileId, projectile, unitId);
          break;
        }
      }
    }
  }

  /**
   * Handle a projectile impacting with a unit
   */
  private handleProjectileImpact(
    projectileId: string,
    projectile: Projectile,
    targetId: string
  ): void {
    // Remove projectile
    this.projectiles.delete(projectileId);

    const targetUnit = this.combatUnits.get(targetId);
    if (!targetUnit) {
      return;
    }

    // Emit impact event
    this.eventEmitter.emit(CombatEvent.PROJECTILE_IMPACT, {
      projectileId,
      targetId,
      position: projectile.position,
      damage: projectile.damage,
      effects: projectile.effects.map(e => e.toString()),
      timestamp: Date.now(),
    });

    // Apply damage
    this.applyDamage(targetId, projectile.sourceId, projectile.damage, 'kinetic');

    // Apply effects
    for (const effect of projectile.effects) {
      this.applyEffect(
        targetId,
        projectile.sourceId,
        effect.type,
        effect.duration,
        effect.magnitude
      );
    }
  }

  /**
   * Apply damage to a unit
   */
  public applyDamage(targetId: string, sourceId: string, damage: number, damageType: string): void {
    const targetUnit = this.combatUnits.get(targetId);
    if (!targetUnit) {
      console.error(`Cannot apply damage: target ${targetId} not found`);
      return;
    }

    // Check for critical hit
    const isCritical = this.checkCriticalHit(targetId, sourceId, damage);
    const finalDamage = isCritical ? damage * this.CRITICAL_HIT_DAMAGE_MULTIPLIER : damage;

    // Apply to shields first if available
    if (targetUnit.stats.shield > 0) {
      const shieldDamage = finalDamage * this.SHIELD_DAMAGE_REDUCTION;
      const previousShield = targetUnit.stats.shield;

      // Reduce shield
      targetUnit.stats.shield = Math.max(0, targetUnit.stats.shield - shieldDamage);

      // Calculate if shield was breached
      const shieldBreached = targetUnit.stats.shield === 0 && previousShield > 0;

      // Emit shield impact event
      this.eventEmitter.emit(CombatEvent.SHIELD_IMPACT, {
        targetId,
        sourceId,
        damageAmount: shieldDamage,
        previousShield,
        currentShield: targetUnit.stats.shield,
        shieldBreached,
        timestamp: Date.now(),
      });

      // If shield absorbed all damage, we're done
      if (targetUnit.stats.shield > 0) {
        return;
      }

      // Otherwise, calculate remaining damage that gets through to hull
      const remainingDamage = finalDamage - previousShield / this.SHIELD_DAMAGE_REDUCTION;

      if (remainingDamage <= 0) {
        return;
      }

      // Apply remaining damage to hull after armor reduction
      this.applyHullDamage(targetUnit, sourceId, remainingDamage, damageType);
    } else {
      // No shields, apply directly to hull
      this.applyHullDamage(targetUnit, sourceId, finalDamage, damageType);
    }
  }

  /**
   * Apply damage directly to hull after shields
   */
  private applyHullDamage(
    targetUnit: CombatUnit,
    sourceId: string,
    damage: number,
    damageType: string
  ): void {
    // Calculate armor damage reduction
    const armorReduction = 1 - targetUnit.stats.armor * this.ARMOR_DAMAGE_REDUCTION_PER_POINT;
    const finalDamage = damage * armorReduction;

    // Apply damage to hull
    const previousHealth = targetUnit.stats.health;
    targetUnit.stats.health = Math.max(0, targetUnit.stats.health - finalDamage);

    // Emit damage event
    this.eventEmitter.emit(CombatEvent.COMBAT_DAMAGE, {
      targetId: targetUnit.id,
      sourceId,
      damageAmount: finalDamage,
      damageType,
      previousHealth,
      currentHealth: targetUnit.stats.health,
      timestamp: Date.now(),
    });

    // Check if unit is destroyed
    if (targetUnit.stats.health <= 0) {
      this.handleUnitDestroyed(targetUnit.id, sourceId);
    }
  }

  /**
   * Handle a unit being destroyed
   */
  private handleUnitDestroyed(unitId: string, destroyedById: string): void {
    const unit = this.combatUnits.get(unitId);
    if (!unit) {
      return;
    }

    // Update unit status
    unit.status.main = 'destroyed';

    // Emit destroyed event
    this.eventEmitter.emit(CombatEvent.UNIT_DESTROYED, {
      unitId,
      destroyedById,
      position: unit.position,
      timestamp: Date.now(),
    });

    // End all combats involving this unit
    const opponents = this.activeCombats.get(unitId);
    if (opponents) {
      const participantIds = [unitId, ...Array.from(opponents)];
      this.endCombat(participantIds, 'DESTROYED', destroyedById);
    }
  }

  /**
   * Check if a hit is critical based on target's condition
   */
  public checkCriticalHit(targetId: string, sourceId: string, damage: number): boolean {
    const targetUnit = this.combatUnits.get(targetId);
    if (!targetUnit) {
      return false;
    }

    // Base critical chance
    let criticalChance = this.BASE_CRITICAL_CHANCE;

    // Increase chance if target is already damaged
    const healthRatio = targetUnit.stats.health / targetUnit.stats.maxHealth;
    if (healthRatio < this.CRITICAL_HIT_THRESHOLD) {
      criticalChance += (this.CRITICAL_HIT_THRESHOLD - healthRatio) * 0.5;
    }

    // Adjust critical chance based on damage amount relative to target's max health
    // Higher damage relative to max health increases critical chance
    const damageRatio = damage / targetUnit.stats.maxHealth;
    criticalChance += damageRatio * 0.3; // 30% boost for damage equal to max health

    // Random check
    const isCritical = Math.random() < criticalChance;

    if (isCritical) {
      // Determine hit location
      const locations = Object.values(CriticalHitLocation);
      const location = locations[Math.floor(Math.random() * locations.length)];

      // Emit critical hit event
      this.eventEmitter.emit(CombatEvent.CRITICAL_HIT, {
        targetId,
        sourceId,
        location,
        multiplier: this.CRITICAL_HIT_DAMAGE_MULTIPLIER,
        effects: [], // Could add specific effects based on location
        timestamp: Date.now(),
      });
    }

    return isCritical;
  }

  /**
   * Apply a combat effect to a unit
   */
  public applyEffect(
    targetId: string,
    sourceId: string,
    effectType: string,
    duration: number,
    strength: number
  ): string {
    const targetUnit = this.combatUnits.get(targetId);
    if (!targetUnit) {
      console.error(`Cannot apply effect: target ${targetId} not found`);
      return '';
    }

    // Generate effect ID
    const effectId = `effect_${effectType}_${targetId}_${Date.now()}_${this.idCounter++}`;

    // Create effect
    const effect: CombatEffect = {
      id: effectId,
      type: effectType,
      position: targetUnit.position,
      radius: 0,
      duration,
      remainingTime: duration,
      effects: [], // Would depend on effect type
    };

    // Add to active effects
    this.activeEffects.set(effectId, effect);

    // Set up expiration
    setTimeout(() => {
      this.removeEffect(targetId, effectId);
    }, duration);

    // Emit effect applied event
    this.eventEmitter.emit(CombatEvent.EFFECT_APPLIED, {
      targetId,
      sourceId,
      effectId,
      effectType,
      duration,
      strength,
      timestamp: Date.now(),
    });

    return effectId;
  }

  /**
   * Remove an effect from a unit
   */
  public removeEffect(targetId: string, effectId: string): void {
    const effect = this.activeEffects.get(effectId);
    if (!effect) {
      return;
    }

    // Remove from active effects
    this.activeEffects.delete(effectId);

    // Emit effect expired event
    this.eventEmitter.emit(CombatEvent.EFFECT_EXPIRED, {
      targetId,
      effectId,
      effectType: effect.type,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if a unit can target another unit
   */
  public canTargetUnit(sourceId: string, targetId: string): boolean {
    const sourceUnit = this.combatUnits.get(sourceId);
    const targetUnit = this.combatUnits.get(targetId);

    if (!sourceUnit || !targetUnit) {
      return false;
    }

    // Check if target is visible
    if (this.detectionSystem) {
      // Use detection system to check visibility
      const detectedObjects = this.detectionSystem.getDetectedObjects(sourceId);
      if (!detectedObjects.includes(targetId)) {
        return false;
      }
    }

    // Other targeting rules can be added here

    return true;
  }

  /**
   * Check if a target is in range of a specific weapon
   */
  public isInWeaponRange(sourceId: string, targetId: string, weaponId: string): boolean {
    const sourceUnit = this.combatUnits.get(sourceId);
    const targetUnit = this.combatUnits.get(targetId);

    if (!sourceUnit || !targetUnit) {
      return false;
    }

    // Find the weapon
    const weapon = sourceUnit.weapons.find(w => w.id === weaponId);
    if (!weapon) {
      return false;
    }

    // Calculate distance
    const distance = getDistance(sourceUnit.position, targetUnit.position);

    // Check against weapon range
    return distance <= weapon.range;
  }

  /**
   * Register event listener
   */
  public on<K extends CombatEvent>(event: K, callback: (data: CombatEventMap[K]) => void): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Remove event listener
   */
  public off<K extends CombatEvent>(event: K, callback: (data: CombatEventMap[K]) => void): void {
    this.eventEmitter.off(event, callback);
  }
}

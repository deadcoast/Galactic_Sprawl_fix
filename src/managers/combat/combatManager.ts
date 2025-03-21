/**
 * CombatManager.ts
 *
 * This manager handles combat operations using the standardized event system.
 */

import { BaseTypedEventEmitter } from '../../lib/events/BaseTypedEventEmitter';
import { Position } from '../../types/core/GameTypes';
import { CombatEvents, CombatUnitStatus } from '../../types/events/CombatEvents';
import { FactionId } from '../../types/ships/FactionTypes';

/**
 * Combat unit interface
 */
export interface CombatUnit {
  id: string;
  type: string;
  faction: FactionId;
  position: Position;
  rotation: number;
  status: CombatUnitStatus;
  stats: {
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    speed: number;
    turnRate: number;
  };
  weapons: CombatWeapon[];
  target?: {
    id: string;
    position: Position;
  };
}

/**
 * Combat weapon interface
 */
export interface CombatWeapon {
  id: string;
  type: string;
  damage: number;
  range: number;
  cooldown: number;
  status: 'ready' | 'charging' | 'cooling';
  lastFired?: number;
}

/**
 * @context: combat-system, manager-registry
 * Combat manager class that uses standardized types and events
 */
export class CombatManager extends BaseTypedEventEmitter<CombatEvents> {
  private static instance: CombatManager | null = null;
  private units: Map<string, CombatUnit> = new Map();

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    super();
  }
  
  /**
   * Get the singleton instance of CombatManager
   */
  public static getInstance(): CombatManager {
    if (!CombatManager.instance) {
      CombatManager.instance = new CombatManager();
    }
    return CombatManager.instance;
  }

  /**
   * Get all units
   * @returns An array of all units
   */
  public getAllUnits(): CombatUnit[] {
    return Array.from(this.units.values());
  }

  /**
   * Get a unit by ID
   * @param unitId The ID of the unit to get
   * @returns The unit, or undefined if not found
   */
  public getUnitStatus(unitId: string): CombatUnit | undefined {
    return this.units.get(unitId);
  }

  /**
   * Get units in range of a position
   * @param position The position to check
   * @param range The range to check
   * @returns An array of units in range
   */
  public getUnitsInRange(position: Position, range: number): CombatUnit[] {
    return this.getAllUnits().filter(unit => {
      const distance = Math.sqrt(
        Math.pow(unit.position.x - position.x, 2) + Math.pow(unit.position.y - position.y, 2)
      );
      return distance <= range;
    });
  }

  /**
   * Spawn a unit
   * @param unitType The type of unit to spawn
   * @param position The position to spawn at
   * @param faction The faction the unit belongs to
   * @returns The spawned unit
   */
  public spawnUnit(unitType: string, position: Position, faction: FactionId): CombatUnit {
    const id = `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const unit: CombatUnit = {
      id,
      type: unitType,
      faction,
      position,
      rotation: 0,
      status: 'idle',
      stats: {
        health: 100,
        maxHealth: 100,
        shield: 100,
        maxShield: 100,
        speed: 10,
        turnRate: 5,
      },
      weapons: [],
    };

    this.units.set(id, unit);

    this.emit('combat:unit-spawned', {
      unitId: id,
      unitType,
      position,
      faction,
      timestamp: Date.now(),
    });

    return unit;
  }

  /**
   * Destroy a unit
   * @param unitId The ID of the unit to destroy
   * @param destroyedBy Optional ID of the unit that destroyed this unit
   * @returns True if the unit was destroyed, false if not found
   */
  public destroyUnit(unitId: string, destroyedBy?: string): boolean {
    const unit = this.units.get(unitId);
    if (!unit) {
      return false;
    }

    this.units.delete(unitId);

    this.emit('combat:unit-destroyed', {
      unitId,
      destroyedBy,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Move a unit
   * @param unitId The ID of the unit to move
   * @param position The position to move to
   * @returns True if the unit was moved, false if not found
   */
  public moveUnit(unitId: string, position: Position): boolean {
    const unit = this.units.get(unitId);
    if (!unit) {
      return false;
    }

    const previousPosition = { ...unit.position };
    unit.position = position;

    // Update status if it was idle
    if (unit.status === 'idle') {
      const previousStatus = unit.status;
      unit.status = 'moving';

      this.emit('combat:unit-status-changed', {
        unitId,
        status: 'moving',
        previousStatus,
        timestamp: Date.now(),
      });
    }

    this.units.set(unitId, unit);

    this.emit('combat:unit-moved', {
      unitId,
      position,
      previousPosition,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Rotate a unit
   * @param unitId The ID of the unit to rotate
   * @param rotation The rotation angle in degrees
   * @returns True if the unit was rotated, false if not found
   */
  public rotateUnit(unitId: string, rotation: number): boolean {
    const unit = this.units.get(unitId);
    if (!unit) {
      return false;
    }

    const previousRotation = unit.rotation;
    unit.rotation = rotation;
    this.units.set(unitId, unit);

    this.emit('combat:unit-rotated', {
      unitId,
      rotation,
      previousRotation,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Change a unit's status
   * @param unitId The ID of the unit
   * @param status The new status
   * @returns True if the status was changed, false if not found
   */
  public changeUnitStatus(unitId: string, status: CombatUnitStatus): boolean {
    const unit = this.units.get(unitId);
    if (!unit) {
      return false;
    }

    const previousStatus = unit.status;
    unit.status = status;
    this.units.set(unitId, unit);

    this.emit('combat:unit-status-changed', {
      unitId,
      status,
      previousStatus,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Damage a unit
   * @param unitId The ID of the unit to damage
   * @param damageAmount The amount of damage to apply
   * @param damageSource Optional source of the damage
   * @param damageType Optional type of damage
   * @returns True if the unit was damaged, false if not found
   */
  public damageUnit(
    unitId: string,
    damageAmount: number,
    damageSource?: string,
    damageType?: string
  ): boolean {
    const unit = this.units.get(unitId);
    if (!unit) {
      return false;
    }

    // Apply damage to shield first, then health
    let remainingDamage = damageAmount;
    if (unit.stats.shield > 0) {
      const shieldDamage = Math.min(unit.stats.shield, remainingDamage);
      unit.stats.shield -= shieldDamage;
      remainingDamage -= shieldDamage;

      this.emit('combat:unit-shield-changed', {
        unitId,
        shieldAmount: -shieldDamage,
        currentShield: unit.stats.shield,
        maxShield: unit.stats.maxShield,
        timestamp: Date.now(),
      });
    }

    if (remainingDamage > 0) {
      unit.stats.health = Math.max(0, unit.stats.health - remainingDamage);

      // Change status if health reaches 0
      if (unit.stats.health === 0 && unit.status !== 'destroyed') {
        const previousStatus = unit.status;
        unit.status = 'destroyed';

        this.emit('combat:unit-status-changed', {
          unitId,
          status: 'destroyed',
          previousStatus,
          timestamp: Date.now(),
        });
      }
      // Change status to damaged if not already
      else if (
        unit.stats.health < unit.stats.maxHealth * 0.5 &&
        unit.status !== 'damaged' &&
        unit.status !== 'destroyed'
      ) {
        const previousStatus = unit.status;
        unit.status = 'damaged';

        this.emit('combat:unit-status-changed', {
          unitId,
          status: 'damaged',
          previousStatus,
          timestamp: Date.now(),
        });
      }
    }

    this.units.set(unitId, unit);

    this.emit('combat:unit-damaged', {
      unitId,
      damageAmount,
      currentHealth: unit.stats.health,
      maxHealth: unit.stats.maxHealth,
      damageSource,
      damageType,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Fire a weapon
   * @param unitId The ID of the unit firing the weapon
   * @param weaponId The ID of the weapon to fire
   * @param targetId Optional ID of the target
   * @param targetPosition Optional position to fire at
   * @returns True if the weapon was fired, false if not found or on cooldown
   */
  public fireWeapon(
    unitId: string,
    weaponId: string,
    targetId?: string,
    targetPosition?: Position
  ): boolean {
    const unit = this.units.get(unitId);
    if (!unit) {
      return false;
    }

    const weapon = unit.weapons.find(w => w.id === weaponId);
    if (!weapon || weapon.status !== 'ready') {
      return false;
    }

    weapon.status = 'cooling';
    weapon.lastFired = Date.now();
    this.units.set(unitId, unit);

    this.emit('combat:unit-weapon-fired', {
      unitId,
      weaponId,
      targetId,
      targetPosition,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Engage a target
   * @param unitId The ID of the unit engaging
   * @param targetId The ID of the target
   * @returns True if the target was engaged, false if not found
   */
  public engageTarget(unitId: string, targetId: string): boolean {
    const unit = this.units.get(unitId);
    const target = this.units.get(targetId);
    if (!unit || !target) {
      return false;
    }

    unit.target = {
      id: targetId,
      position: target.position,
    };

    // Change status to attacking if not already
    if (unit.status !== 'attacking') {
      const previousStatus = unit.status;
      unit.status = 'attacking';

      this.emit('combat:unit-status-changed', {
        unitId,
        status: 'attacking',
        previousStatus,
        timestamp: Date.now(),
      });
    }

    this.units.set(unitId, unit);

    this.emit('combat:unit-target-acquired', {
      unitId,
      targetId,
      targetPosition: target.position,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Lose target
   * @param unitId The ID of the unit losing target
   * @returns True if the target was lost, false if not found or no target
   */
  public loseTarget(unitId: string): boolean {
    const unit = this.units.get(unitId);
    if (!unit || !unit.target) {
      return false;
    }

    const targetId = unit.target.id;
    const targetPosition = unit.target.position;
    unit.target = undefined;

    // Change status to idle if attacking
    if (unit.status === 'attacking') {
      const previousStatus = unit.status;
      unit.status = 'idle';

      this.emit('combat:unit-status-changed', {
        unitId,
        status: 'idle',
        previousStatus,
        timestamp: Date.now(),
      });
    }

    this.units.set(unitId, unit);

    this.emit('combat:unit-target-lost', {
      unitId,
      targetId,
      targetPosition,
      timestamp: Date.now(),
    });

    return true;
  }
}

/**
 * Example usage:
 *
 * ```typescript
 * // Get the combat manager instance from the registry
 * import { getCombatManager } from '../ManagerRegistry';
 * const combatManager = getCombatManager();
 *
 * // Subscribe to events
 * combatManager.on('combat:unit-spawned', ({ unitId, unitType, position, faction }) => {
 *   console.warn(`Unit ${unitId} of type ${unitType} spawned at (${position.x}, ${position.y}) for faction ${faction}`);
 * });
 *
 * // Spawn a unit
 * const unit = combatManager.spawnUnit('fighter', { x: 100, y: 100 }, 'player');
 *
 * // Move the unit
 * combatManager.moveUnit(unit.id, { x: 200, y: 200 });
 * ```
 */

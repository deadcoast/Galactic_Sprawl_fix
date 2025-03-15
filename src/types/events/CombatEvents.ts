/**
 * CombatEvents.ts
 *
 * This file defines the events related to combat.
 * These events are used by combat managers and related components.
 */

import { Position } from '../core/GameTypes';
import { FactionId } from '../ships/FactionTypes';

/**
 * Base combat event interface
 */
export interface CombatEvent {
  unitId: string;
  timestamp?: number;
}

/**
 * Combat unit movement event interface
 */
export interface CombatUnitMovementEvent extends CombatEvent {
  position: Position;
  previousPosition?: Position;
}

/**
 * Combat unit rotation event interface
 */
export interface CombatUnitRotationEvent extends CombatEvent {
  rotation: number;
  previousRotation?: number;
}

/**
 * Combat unit status event interface
 */
export interface CombatUnitStatusEvent extends CombatEvent {
  status: CombatUnitStatus;
  previousStatus?: CombatUnitStatus;
}

/**
 * Combat unit damage event interface
 */
export interface CombatUnitDamageEvent extends CombatEvent {
  damageAmount: number;
  currentHealth: number;
  maxHealth: number;
  damageSource?: string;
  damageType?: string;
}

/**
 * Combat unit shield event interface
 */
export interface CombatUnitShieldEvent extends CombatEvent {
  shieldAmount: number;
  currentShield: number;
  maxShield: number;
}

/**
 * Combat unit weapon event interface
 */
export interface CombatUnitWeaponEvent extends CombatEvent {
  weaponId: string;
  targetId?: string;
  targetPosition?: Position;
}

/**
 * Combat unit target event interface
 */
export interface CombatUnitTargetEvent extends CombatEvent {
  targetId: string;
  targetPosition: Position;
}

/**
 * Combat unit spawn event interface
 */
export interface CombatUnitSpawnEvent extends CombatEvent {
  unitType: string;
  position: Position;
  faction: FactionId;
}

/**
 * Combat unit destroy event interface
 */
export interface CombatUnitDestroyEvent extends CombatEvent {
  destroyedBy?: string;
}

/**
 * Combat unit status type
 */
export type CombatUnitStatus =
  | 'idle'
  | 'moving'
  | 'attacking'
  | 'defending'
  | 'retreating'
  | 'damaged'
  | 'disabled'
  | 'destroyed';

/**
 * Interface defining all combat-related events
 */
export interface CombatEvents {
  /**
   * Emitted when a combat unit moves
   */
  'combat:unit-moved': CombatUnitMovementEvent;

  /**
   * Emitted when a combat unit rotates
   */
  'combat:unit-rotated': CombatUnitRotationEvent;

  /**
   * Emitted when a combat unit's status changes
   */
  'combat:unit-status-changed': CombatUnitStatusEvent;

  /**
   * Emitted when a combat unit takes damage
   */
  'combat:unit-damaged': CombatUnitDamageEvent;

  /**
   * Emitted when a combat unit's shield changes
   */
  'combat:unit-shield-changed': CombatUnitShieldEvent;

  /**
   * Emitted when a combat unit fires a weapon
   */
  'combat:unit-weapon-fired': CombatUnitWeaponEvent;

  /**
   * Emitted when a combat unit acquires a target
   */
  'combat:unit-target-acquired': CombatUnitTargetEvent;

  /**
   * Emitted when a combat unit loses a target
   */
  'combat:unit-target-lost': CombatUnitTargetEvent;

  /**
   * Emitted when a combat unit is spawned
   */
  'combat:unit-spawned': CombatUnitSpawnEvent;

  /**
   * Emitted when a combat unit is destroyed
   */
  'combat:unit-destroyed': CombatUnitDestroyEvent;
}

/**
 * ShipEvents.ts
 *
 * This file defines the events related to ships and ship hangars.
 * These events are used by the ShipHangarManager and related components.
 */

import { ResourceType } from '../resources/ResourceTypes';
import { ShipCategory, ShipStatus } from '../ships/ShipTypes';

/**
 * Ship cargo interface
 */
export interface ShipCargo {
  capacity: number;
  resources: Map<ResourceType, number>;
}

/**
 * Ship data interface
 */
export interface Ship {
  id: string;
  name: string;
  type: ShipCategory;
  level: number;
  health: number;
  maxHealth: number;
  fuel: number;
  maxFuel: number;
  crew: number;
  maxCrew: number;
  status: ShipStatus;
  location?: string;
  destination?: string;
  cargo?: ShipCargo;
}

/**
 * Interface defining all ship-related events
 */
export interface ShipEvents {
  /**
   * Emitted when a ship is added to the hangar
   */
  'ship:added': {
    ship: Ship;
    hangarId: string;
  };

  /**
   * Emitted when a ship is removed from the hangar
   */
  'ship:removed': {
    shipId: string;
    hangarId: string;
  };

  /**
   * Emitted when a ship's status changes
   */
  'ship:status-changed': {
    shipId: string;
    newStatus: ShipStatus;
    oldStatus: ShipStatus;
  };

  /**
   * Emitted when cargo is loaded onto a ship
   */
  'cargo:loaded': {
    shipId: string;
    resourceType: ResourceType;
    amount: number;
  };

  /**
   * Emitted when cargo is unloaded from a ship
   */
  'cargo:unloaded': {
    shipId: string;
    resourceType: ResourceType;
    amount: number;
  };

  /**
   * Emitted when a ship is launched
   */
  'ship:launched': {
    shipId: string;
    destination: string;
    estimatedArrival: number;
  };

  /**
   * Emitted when a ship arrives at its destination
   */
  'ship:arrived': {
    shipId: string;
    location: string;
    arrivalTime: number;
  };

  /**
   * Emitted when a ship is damaged
   */
  'ship:damaged': {
    shipId: string;
    damageAmount: number;
    currentHealth: number;
  };

  /**
   * Emitted when a ship is repaired
   */
  'ship:repaired': {
    shipId: string;
    repairAmount: number;
    currentHealth: number;
  };

  /**
   * Emitted when a new ship type becomes available
   */
  'ship-type:available': {
    shipType: ShipCategory;
    requirements: Record<string, unknown>;
  };

  /**
   * Index signature for unknown other events
   */
  [ key: string ]: unknown;
}

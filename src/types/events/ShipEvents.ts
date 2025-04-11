/**
 * ShipEvents.ts
 *
 * This file defines the events related to ships and ship hangars.
 * These events are used by the ShipHangarManager and related components.
 */

import { ResourceType } from '../resources/ResourceTypes';
import { ShipCategory, ShipStatus } from '../ships/ShipTypes';
export { ShipStatus };

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
  assignedTo?: string;
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
  [key: string]: unknown;
}

/**
 * Defines the events emitted by the ShipManager
 */
export interface ShipManagerEvents {
  /**
   * Emitted when a new ship is created.
   */
  shipCreated: {
    ship: Ship;
  };

  /**
   * Emitted when a ship's status changes.
   */
  shipStatusUpdated: {
    shipId: string;
    oldStatus: ShipStatus;
    newStatus: ShipStatus;
  };

  /**
   * Emitted when a ship's assignment changes.
   */
  shipAssignmentUpdated: {
    shipId: string;
    oldAssignment?: string;
    newAssignment?: string;
  };

  /**
   * Emitted when a ship is destroyed or removed.
   * Add this event when ship removal logic is implemented.
   */
  // shipRemoved: {
  //   shipId: string;
  //   ship: Ship; // Include the removed ship details
  // };

  // Add index signature to satisfy TypedEventEmitter constraint
  [key: string]: unknown;
}

// Example Event Type Enum (Optional, but good practice)
export enum ShipEventType {
  SHIP_CREATED = 'shipCreated',
  SHIP_STATUS_UPDATED = 'shipStatusUpdated',
  SHIP_ASSIGNMENT_UPDATED = 'shipAssignmentUpdated',
  // SHIP_REMOVED = 'shipRemoved',
}

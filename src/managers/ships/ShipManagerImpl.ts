/**
 * Implementation of the ShipManager
 * Handles ship creation, management, and status updates
 */

import { BaseTypedEventEmitter } from '../../lib/events/BaseTypedEventEmitter';
import { Ship, ShipEventType, ShipManagerEvents, ShipStatus } from '../../types/events/ShipEvents';

/**
 * Implements the ship manager functionality
 * Manages all ships in the game
 */
export class ShipManagerImpl extends BaseTypedEventEmitter<ShipManagerEvents> {
  private ships: Map<string, Ship> = new Map();

  constructor() {
    super(); // Call base class constructor
  }

  /**
   * Create a new ship with the provided properties
   * NOTE: The input `ship` type might need adjustment based on how ships are actually created.
   * Assuming the input provides enough data to construct the full Ship type.
   */
  public createShip(
    shipData: Partial<Ship> & { id: string; name: string; type: string; status: ShipStatus }
  ): Ship {
    // Construct the full Ship object - requires default values or more input data
    const newShip: Ship = {
      level: 1,
      health: 100,
      maxHealth: 100,
      fuel: 100,
      maxFuel: 100,
      crew: 10,
      maxCrew: 10,
      ...shipData, // Spread the input data
    };
    this.ships.set(newShip.id, newShip);
    this.emit(ShipEventType.SHIP_CREATED, { ship: newShip }); // Emit event
    return newShip;
  }

  /**
   * Get a ship by ID
   */
  public getShipById(shipId: string): Ship {
    const ship = this.ships.get(shipId);
    if (!ship) {
      throw new Error(`Ship with ID ${shipId} not found`);
    }
    return ship;
  }

  /**
   * Update a ship's status
   */
  public updateShipStatus(shipId: string, status: ShipStatus): void {
    // Accept ShipStatus enum
    const ship = this.getShipById(shipId);
    const oldStatus = ship.status;
    ship.status = status;
    this.emit(ShipEventType.SHIP_STATUS_UPDATED, { shipId, oldStatus, newStatus: status }); // Emit event
  }

  /**
   * Update a ship's assignment
   */
  public updateShipAssignment(shipId: string, systemId: string): void {
    const ship = this.getShipById(shipId);
    const oldAssignment = ship.assignedTo;
    ship.assignedTo = systemId;
    this.emit(ShipEventType.SHIP_ASSIGNMENT_UPDATED, {
      shipId,
      oldAssignment,
      newAssignment: systemId,
    }); // Emit event
  }

  /**
   * Get all ships
   */
  public getAllShips(): Ship[] {
    return Array.from(this.ships.values());
  }

  /**
   * Get ships by type
   */
  public getShipsByType(type: string): Ship[] {
    return Array.from(this.ships.values()).filter(ship => ship.type === type);
  }

  /**
   * Get ships by status
   */
  public getShipsByStatus(status: string): Ship[] {
    return Array.from(this.ships.values()).filter(ship => ship.status === status);
  }
}

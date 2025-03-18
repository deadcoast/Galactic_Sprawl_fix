/**
 * Implementation of the ShipManager
 * Handles ship creation, management, and status updates
 */

// Define interfaces for the types used
export interface Ship {
  id: string;
  name: string;
  type: string;
  status: string;
  assignedTo?: string;
}

/**
 * Implements the ship manager functionality
 * Manages all ships in the game
 */
export class ShipManagerImpl {
  private ships: Map<string, Ship> = new Map();

  /**
   * Create a new ship with the provided properties
   */
  public createShip(ship: { id: string; name: string; type: string; status: string }): Ship {
    const newShip: Ship = { ...ship };
    this.ships.set(ship.id, newShip);
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
  public updateShipStatus(shipId: string, status: string): void {
    const ship = this.getShipById(shipId);
    ship.status = status;
  }

  /**
   * Update a ship's assignment
   */
  public updateShipAssignment(shipId: string, systemId: string): void {
    const ship = this.getShipById(shipId);
    ship.assignedTo = systemId;
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

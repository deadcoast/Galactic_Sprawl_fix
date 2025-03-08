/**
 * @file ReconShipManagerImpl.ts
 * Implementation of the ReconShipManager for exploration ships.
 *
 * This file provides a basic implementation of ship management
 * functionality used by the ExplorationManager.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for exploration ship data
 */
export interface Ship {
  id: string;
  name: string;
  type: string;
  status: string;
  sensorRange?: number;
  speed?: number;
  efficiency?: number;
  sectorId?: string;
  position?: { x: number; y: number };
  [key: string]: unknown;
}

/**
 * Implementation of the ship manager for exploration ships
 */
export class ReconShipManagerImpl {
  private ships: Map<string, Ship> = new Map();

  /**
   * Create a new ReconShipManagerImpl
   */
  constructor() {
    // Add some sample ships
    this.addShip({
      id: uuidv4(),
      name: 'Explorer I',
      type: 'recon',
      status: 'idle',
      sensorRange: 5,
      speed: 3,
      efficiency: 0.8,
      position: { x: 0, y: 0 },
    });

    this.addShip({
      id: uuidv4(),
      name: 'Explorer II',
      type: 'recon',
      status: 'idle',
      sensorRange: 6,
      speed: 2.5,
      efficiency: 0.9,
      position: { x: 0, y: 0 },
    });

    this.addShip({
      id: uuidv4(),
      name: 'Scout I',
      type: 'scout',
      status: 'idle',
      sensorRange: 3,
      speed: 5,
      efficiency: 0.7,
      position: { x: 0, y: 0 },
    });
  }

  /**
   * Add a new ship to the manager
   * @param ship The ship to add
   * @returns The added ship
   */
  public addShip(ship: Ship): Ship {
    this.ships.set(ship.id, ship);
    return ship;
  }

  /**
   * Get a ship by its ID
   * @param shipId The ID of the ship to get
   * @returns The ship or undefined if not found
   */
  public getShipById(shipId: string): Ship | undefined {
    return this.ships.get(shipId);
  }

  /**
   * Get all ships
   * @returns All ships
   */
  public getAllShips(): Ship[] {
    return Array.from(this.ships.values());
  }

  /**
   * Get ships by status
   * @param status The status to filter by
   * @returns Ships with the given status
   */
  public getShipsByStatus(status: string): Ship[] {
    return Array.from(this.ships.values()).filter(ship => ship.status === status);
  }

  /**
   * Update a ship's status
   * @param shipId The ID of the ship to update
   * @param status The new status
   * @returns True if the ship was updated, false otherwise
   */
  public updateShipStatus(shipId: string, status: string): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) return false;

    ship.status = status;
    return true;
  }

  /**
   * Assign a ship to a sector
   * @param shipId The ID of the ship to assign
   * @param sectorId The ID of the sector to assign to
   * @returns True if the ship was assigned, false otherwise
   */
  public assignShipToSector(shipId: string, sectorId: string): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) return false;

    ship.sectorId = sectorId;
    ship.status = 'scanning';
    return true;
  }

  /**
   * Unassign a ship from its current assignment
   * @param shipId The ID of the ship to unassign
   * @returns True if the ship was unassigned, false otherwise
   */
  public unassignShip(shipId: string): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) return false;

    delete ship.sectorId;
    ship.status = 'idle';
    return true;
  }
}

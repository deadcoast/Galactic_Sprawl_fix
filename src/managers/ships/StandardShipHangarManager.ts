/**
 * StandardShipHangarManager.ts
 *
 * This manager handles ship hangar operations using the standardized event system.
 * It fully implements the ShipEvents interface and uses the standardized types.
 */

import { BaseTypedEventEmitter } from '../../lib/events/BaseTypedEventEmitter';
import { Ship, ShipEvents } from '../../types/events/ShipEvents';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { ShipStatus, ShipType } from '../../types/ships/ShipTypes';

/**
 * Ship hangar manager class that uses standardized types and events
 */
export class StandardShipHangarManager extends BaseTypedEventEmitter<ShipEvents> {
  private ships: Map<string, Ship> = new Map();
  private capacity: number;
  private hangarId: string;

  /**
   * Constructor
   * @param hangarId The ID of the hangar
   * @param capacity The capacity of the hangar
   */
  constructor(hangarId: string, capacity: number = 10) {
    super();
    this.hangarId = hangarId;
    this.capacity = capacity;
  }

  /**
   * Get all ships in the hangar
   * @returns An array of all ships
   */
  public getAllShips(): Ship[] {
    return Array.from(this.ships.values());
  }

  /**
   * Get a ship by ID
   * @param shipId The ID of the ship to get
   * @returns The ship, or undefined if not found
   */
  public getShip(shipId: string): Ship | undefined {
    return this.ships.get(shipId);
  }

  /**
   * Add a ship to the hangar
   * @param ship The ship to add
   * @returns True if the ship was added, false if the hangar is full
   */
  public addShip(ship: Ship): boolean {
    if (this.ships.size >= this.capacity) {
      return false;
    }

    this.ships.set(ship.id, ship);
    this.emit('ship:added', { ship, hangarId: this.hangarId });
    return true;
  }

  /**
   * Remove a ship from the hangar
   * @param shipId The ID of the ship to remove
   * @returns True if the ship was removed, false if not found
   */
  public removeShip(shipId: string): boolean {
    if (!this.ships.has(shipId)) {
      return false;
    }

    this.ships.delete(shipId);
    this.emit('ship:removed', { shipId, hangarId: this.hangarId });
    return true;
  }

  /**
   * Change a ship's status
   * @param shipId The ID of the ship
   * @param newStatus The new status
   * @returns True if the status was changed, false if not found
   */
  public changeShipStatus(shipId: string, newStatus: ShipStatus): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return false;
    }

    const oldStatus = ship.status;
    ship.status = newStatus;
    this.ships.set(shipId, ship);
    this.emit('ship:status-changed', { shipId, newStatus, oldStatus });
    return true;
  }

  /**
   * Deploy a ship
   * @param shipId The ID of the ship to deploy
   * @param destination The destination to deploy to
   * @returns True if the ship was deployed, false if not found or already deployed
   */
  public deployShip(shipId: string, destination: string): boolean {
    const ship = this.ships.get(shipId);
    if (!ship || ship.status !== 'idle') {
      return false;
    }

    const oldStatus = ship.status;
    ship.status = 'engaging';
    ship.destination = destination;
    this.ships.set(shipId, ship);
    this.emit('ship:status-changed', { shipId, newStatus: 'engaging', oldStatus });
    return true;
  }

  /**
   * Launch a ship to a destination
   * @param shipId The ID of the ship to launch
   * @param destination The destination to launch to
   * @param estimatedArrival The estimated arrival time (timestamp)
   * @returns True if the ship was launched, false if not found or not ready
   */
  public launchShip(shipId: string, destination: string, estimatedArrival: number): boolean {
    const ship = this.ships.get(shipId);
    if (!ship || ship.status !== 'ready') {
      return false;
    }

    ship.destination = destination;
    this.ships.set(shipId, ship);
    this.emit('ship:launched', { shipId, destination, estimatedArrival });
    return true;
  }

  /**
   * Mark a ship as arrived at its destination
   * @param shipId The ID of the ship that arrived
   * @param location The location where the ship arrived
   * @param arrivalTime The arrival time (timestamp)
   * @returns True if the ship was marked as arrived, false if not found
   */
  public shipArrived(shipId: string, location: string, arrivalTime: number): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return false;
    }

    ship.location = location;
    ship.destination = undefined;
    this.ships.set(shipId, ship);
    this.emit('ship:arrived', { shipId, location, arrivalTime });
    return true;
  }

  /**
   * Damage a ship
   * @param shipId The ID of the ship to damage
   * @param damageAmount The amount of damage to apply
   * @returns True if the ship was damaged, false if not found
   */
  public damageShip(shipId: string, damageAmount: number): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return false;
    }

    ship.health = Math.max(0, ship.health - damageAmount);
    const currentHealth = ship.health;
    this.ships.set(shipId, ship);
    this.emit('ship:damaged', { shipId, damageAmount, currentHealth });
    return true;
  }

  /**
   * Repair a ship
   * @param shipId The ID of the ship to repair
   * @param repairAmount The amount of health to restore
   * @returns True if the ship was repaired, false if not found
   */
  public repairShip(shipId: string, repairAmount: number): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return false;
    }

    ship.health = Math.min(ship.maxHealth, ship.health + repairAmount);
    const currentHealth = ship.health;
    this.ships.set(shipId, ship);
    this.emit('ship:repaired', { shipId, repairAmount, currentHealth });
    return true;
  }

  /**
   * Load cargo onto a ship
   * @param shipId The ID of the ship to load cargo onto
   * @param resourceType The type of resource to load
   * @param amount The amount of resource to load
   * @returns True if the cargo was loaded, false if not found or not enough capacity
   */
  public loadCargo(shipId: string, resourceType: ResourceType, amount: number): boolean {
    const ship = this.ships.get(shipId);
    if (!ship || !ship.cargo) {
      return false;
    }

    // Calculate current cargo usage
    let currentUsage = 0;
    for (const [_, value] of ship.cargo.resources) {
      currentUsage += value;
    }

    // Check if there's enough capacity
    if (currentUsage + amount > ship.cargo.capacity) {
      return false;
    }

    // Add the resource
    const currentAmount = ship.cargo.resources.get(resourceType) || 0;
    ship.cargo.resources.set(resourceType, currentAmount + amount);
    this.ships.set(shipId, ship);
    this.emit('cargo:loaded', { shipId, resourceType, amount });
    return true;
  }

  /**
   * Unload cargo from a ship
   * @param shipId The ID of the ship to unload cargo from
   * @param resourceType The type of resource to unload
   * @param amount The amount of resource to unload
   * @returns True if the cargo was unloaded, false if not found or not enough resources
   */
  public unloadCargo(shipId: string, resourceType: ResourceType, amount: number): boolean {
    const ship = this.ships.get(shipId);
    if (!ship || !ship.cargo) {
      return false;
    }

    // Check if there's enough of the resource
    const currentAmount = ship.cargo.resources.get(resourceType) || 0;
    if (currentAmount < amount) {
      return false;
    }

    // Remove the resource
    const newAmount = currentAmount - amount;
    if (newAmount === 0) {
      ship.cargo.resources.delete(resourceType);
    } else {
      ship.cargo.resources.set(resourceType, newAmount);
    }
    this.ships.set(shipId, ship);
    this.emit('cargo:unloaded', { shipId, resourceType, amount });
    return true;
  }

  /**
   * Make a ship type available
   * @param shipType The type of ship to make available
   * @param requirements The requirements to build this ship type
   */
  public makeShipTypeAvailable(shipType: ShipType, requirements: Record<string, any>): void {
    this.emit('ship-type:available', { shipType, requirements });
  }

  /**
   * Create a new ship
   * @param name The name of the ship
   * @param type The type of the ship
   * @returns The new ship
   */
  public createShip(name: string, type: ShipType): Ship {
    const id = `ship-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Set base stats based on ship type
    let maxHealth = 100;
    let maxFuel = 100;
    let maxCrew = 10;
    let cargoCapacity = 100;

    // In a real implementation, these would be based on the ShipType from ShipTypes.ts
    // For now, we're using default values
    const ship: Ship = {
      id,
      name,
      type,
      level: 1,
      health: maxHealth,
      maxHealth,
      fuel: maxFuel,
      maxFuel,
      crew: maxCrew,
      maxCrew,
      status: 'idle',
    };

    // Add cargo if the ship has capacity
    if (cargoCapacity > 0) {
      ship.cargo = {
        capacity: cargoCapacity,
        resources: new Map(),
      };
    }

    return ship;
  }
}

/**
 * Example usage:
 *
 * ```typescript
 * // Create a new hangar manager
 * const hangarManager = new StandardShipHangarManager('main-hangar', 5);
 *
 * // Subscribe to events
 * hangarManager.on('ship:added', ({ ship, hangarId }) => {
 *   console.log(`Ship ${ship.name} added to hangar ${hangarId}`);
 * });
 *
 * // Create and add a ship
 * const newShip = hangarManager.createShip('Falcon', 'cruiser');
 * hangarManager.addShip(newShip);
 *
 * // Launch the ship
 * hangarManager.launchShip(newShip.id, 'Alpha Centauri', Date.now() + 60000);
 * ```
 */

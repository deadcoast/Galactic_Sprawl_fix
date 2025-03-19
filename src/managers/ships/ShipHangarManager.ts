/**
 * ShipHangarManager.ts
 *
 * This manager handles ship hangar operations using the standardized event system.
 */

import { BaseTypedEventEmitter } from '../../lib/modules/BaseTypedEventEmitter';
import { ResourceType } from './../../types/resources/ResourceTypes';

/**
 * Ship type enum for internal use
 * @deprecated Use ShipTypeEnum from ShipTypes.ts instead
 */
export enum ShipType {
  SCOUT = 'scout',
  FIGHTER = 'fighter',
  CRUISER = 'cruiser',
  BATTLESHIP = 'battleship',
  CARRIER = 'carrier',
  TRANSPORT = 'transport',
}

/**
 * Ship data interface for internal use
 * @deprecated Use Ship from ShipEvents.ts instead
 */
export interface Ship {
  id: string;
  name: string;
  type: ShipType;
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
 * Ship status enum for internal use
 * @deprecated Use ShipStatusEnum from ShipTypes.ts instead
 */
export enum ShipStatus {
  DOCKED = 'docked',
  DEPLOYED = 'deployed',
  DAMAGED = 'damaged',
  REPAIRING = 'repairing',
  REFUELING = 'refueling',
  UPGRADING = 'upgrading',
}

/**
 * Ship cargo interface for internal use
 * @deprecated Use ShipCargo from ShipEvents.ts instead
 */
export interface ShipCargo {
  capacity: number;
  resources: Map<ResourceType, number>;
}

/**
 * Ship hangar events interface
 */
interface ShipHangarEvents {
  'ship:added': { ship: Ship; hangarId: string };
  'ship:removed': { shipId: string; hangarId: string };
  'ship:updated': { ship: Ship };
  'ship:status-changed': { shipId: string; newStatus: ShipStatus; oldStatus: ShipStatus };
  'ship:deployed': { shipId: string; destination: string };
  'ship:launched': { shipId: string; destination: string; estimatedArrival: number };
  'ship:arrived': { shipId: string; location: string; arrivalTime: number };
  'ship:docked': { shipId: string };
  'ship:damaged': { shipId: string; damageAmount: number; currentHealth: number };
  'ship:repaired': { shipId: string; repairAmount: number; currentHealth: number };
  'ship:refueled': { shipId: string; amount: number };
  'ship:upgraded': { shipId: string; level: number };
  'cargo:loaded': { shipId: string; resourceType: ResourceType; amount: number };
  'cargo:unloaded': { shipId: string; resourceType: ResourceType; amount: number };
  'hangar:capacity-changed': { oldCapacity: number; newCapacity: number };
  'ship-type:available': { shipType: ShipType; requirements: Record<string, unknown> };
  /**
   * Index signature for any other events
   */
  [key: string]: unknown;
}

/**
 * Ship hangar manager class
 */
export class ShipHangarManager extends BaseTypedEventEmitter<ShipHangarEvents> {
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
   * Update a ship
   * @param ship The updated ship data
   * @returns True if the ship was updated, false if not found
   */
  public updateShip(ship: Ship): boolean {
    if (!this.ships.has(ship.id)) {
      return false;
    }

    this.ships.set(ship.id, ship);
    this.emit('ship:updated', { ship });
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
    if (!ship || ship.status !== ShipStatus.DOCKED) {
      return false;
    }

    const oldStatus = ship.status;
    ship.status = ShipStatus.DEPLOYED;
    ship.destination = destination;
    this.ships.set(shipId, ship);
    this.emit('ship:deployed', { shipId, destination });
    this.emit('ship:status-changed', {
      shipId,
      newStatus: ShipStatus.DEPLOYED,
      oldStatus,
    });
    return true;
  }

  /**
   * Dock a ship
   * @param shipId The ID of the ship to dock
   * @returns True if the ship was docked, false if not found or not deployed
   */
  public dockShip(shipId: string): boolean {
    const ship = this.ships.get(shipId);
    if (!ship || ship.status !== ShipStatus.DEPLOYED) {
      return false;
    }

    const oldStatus = ship.status;
    ship.status = ShipStatus.DOCKED;
    ship.destination = undefined;
    this.ships.set(shipId, ship);
    this.emit('ship:docked', { shipId });
    this.emit('ship:status-changed', {
      shipId,
      newStatus: ShipStatus.DOCKED,
      oldStatus,
    });
    return true;
  }

  /**
   * Damage a ship
   * @param shipId The ID of the ship to damage
   * @param damage The amount of damage to apply
   * @returns True if the ship was damaged, false if not found
   */
  public damageShip(shipId: string, damage: number): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return false;
    }

    const oldStatus = ship.status;
    ship.health = Math.max(0, ship.health - damage);
    if (ship.health === 0) {
      ship.status = ShipStatus.DAMAGED;
      this.emit('ship:status-changed', {
        shipId,
        newStatus: ShipStatus.DAMAGED,
        oldStatus,
      });
    }
    this.ships.set(shipId, ship);
    this.emit('ship:damaged', { shipId, damageAmount: damage, currentHealth: ship.health });
    return true;
  }

  /**
   * Repair a ship
   * @param shipId The ID of the ship to repair
   * @param amount The amount of health to restore
   * @returns True if the ship was repaired, false if not found
   */
  public repairShip(shipId: string, amount: number): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return false;
    }

    const oldStatus = ship.status;
    const oldHealth = ship.health;
    ship.health = Math.min(ship.maxHealth, ship.health + amount);
    if (oldHealth === 0 && ship.health > 0) {
      ship.status = ShipStatus.DOCKED;
      this.emit('ship:status-changed', {
        shipId,
        newStatus: ShipStatus.DOCKED,
        oldStatus,
      });
    }
    this.ships.set(shipId, ship);
    this.emit('ship:repaired', { shipId, repairAmount: amount, currentHealth: ship.health });
    return true;
  }

  /**
   * Refuel a ship
   * @param shipId The ID of the ship to refuel
   * @param amount The amount of fuel to add
   * @returns True if the ship was refueled, false if not found
   */
  public refuelShip(shipId: string, amount: number): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return false;
    }

    ship.fuel = Math.min(ship.maxFuel, ship.fuel + amount);
    this.ships.set(shipId, ship);
    this.emit('ship:refueled', { shipId, amount });
    return true;
  }

  /**
   * Upgrade a ship
   * @param shipId The ID of the ship to upgrade
   * @returns True if the ship was upgraded, false if not found
   */
  public upgradeShip(shipId: string): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return false;
    }

    ship.level += 1;
    ship.maxHealth += 10;
    ship.maxFuel += 5;
    this.ships.set(shipId, ship);
    this.emit('ship:upgraded', { shipId, level: ship.level });
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
    const currentAmount = ship.cargo.resources.get(resourceType) ?? 0;
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
    const currentAmount = ship.cargo.resources.get(resourceType) ?? 0;
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
   * Set the capacity of the hangar
   * @param capacity The new capacity
   */
  public setCapacity(capacity: number): void {
    const oldCapacity = this.capacity;
    this.capacity = capacity;
    this.emit('hangar:capacity-changed', { oldCapacity, newCapacity: capacity });
  }

  /**
   * Get the capacity of the hangar
   * @returns The capacity
   */
  public getCapacity(): number {
    return this.capacity;
  }

  /**
   * Get the number of ships in the hangar
   * @returns The number of ships
   */
  public getShipCount(): number {
    return this.ships.size;
  }

  /**
   * Get the ID of the hangar
   * @returns The hangar ID
   */
  public getHangarId(): string {
    return this.hangarId;
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

    switch (type) {
      case ShipType.SCOUT:
        maxHealth = 50;
        maxFuel = 150;
        maxCrew = 5;
        cargoCapacity = 50;
        break;
      case ShipType.FIGHTER:
        maxHealth = 100;
        maxFuel = 100;
        maxCrew = 10;
        cargoCapacity = 0;
        break;
      case ShipType.CRUISER:
        maxHealth = 200;
        maxFuel = 200;
        maxCrew = 50;
        cargoCapacity = 200;
        break;
      case ShipType.BATTLESHIP:
        maxHealth = 500;
        maxFuel = 300;
        maxCrew = 100;
        cargoCapacity = 100;
        break;
      case ShipType.CARRIER:
        maxHealth = 400;
        maxFuel = 250;
        maxCrew = 200;
        cargoCapacity = 300;
        break;
      case ShipType.TRANSPORT:
        maxHealth = 150;
        maxFuel = 200;
        maxCrew = 20;
        cargoCapacity = 1000;
        break;
    }

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
      status: ShipStatus.DOCKED,
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

  /**
   * Launch a ship to a destination
   * @param shipId The ID of the ship to launch
   * @param destination The destination to launch to
   * @param estimatedArrival The estimated arrival time (timestamp)
   * @returns True if the ship was launched, false if not found or not ready
   */
  public launchShip(shipId: string, destination: string, estimatedArrival: number): boolean {
    const ship = this.ships.get(shipId);
    if (!ship || ship.status !== ShipStatus.DOCKED) {
      return false;
    }

    const oldStatus = ship.status;
    ship.status = ShipStatus.DEPLOYED;
    ship.destination = destination;
    this.ships.set(shipId, ship);
    this.emit('ship:launched', { shipId, destination, estimatedArrival });
    this.emit('ship:status-changed', {
      shipId,
      newStatus: ShipStatus.DEPLOYED,
      oldStatus,
    });
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
   * Make a ship type available
   * @param shipType The type of ship to make available
   * @param requirements The requirements to build this ship type
   */
  public makeShipTypeAvailable(shipType: ShipType, requirements: Record<string, unknown>): void {
    this.emit('ship-type:available', { shipType, requirements });
  }
}

/**
 * Example usage:
 *
 * ```typescript
 * // Create a new hangar manager
 * const hangarManager = new ShipHangarManager('main-hangar', 5);
 *
 * // Subscribe to events
 * hangarManager.on('ship:added', ({ ship }) => {
 *   console.warn(`Ship ${ship.name} added to hangar`);
 * });
 *
 * // Create and add a ship
 * const newShip = hangarManager.createShip('Falcon', ShipType.CRUISER);
 * hangarManager.addShip(newShip);
 *
 * // Deploy the ship
 * hangarManager.deployShip(newShip.id, 'Alpha Centauri');
 * ```
 */

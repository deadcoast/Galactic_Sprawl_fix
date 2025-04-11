/**
 * Implementation of the ShipManager
 * Handles ship creation, management, and status updates
 */

import { TypedEventEmitter } from '../../lib/events/EventEmitter';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';
import { ShipCategory, UnifiedShip, UnifiedShipStatus } from '../../types/ships/UnifiedShipTypes';
import { ResourceManager } from '../game/ResourceManager';
/**
 * StandardShipHangarManager.ts
 *
 * This manager handles ship hangar operations using the standardized event system.
 * It fully implements the ShipEvents interface and uses the standardized types.
 */

import { shipFactory } from '../../factories/ships/ShipFactory';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { ShipCargo } from '../../types/ships/CommonShipTypes';
import { FactionShipClass } from '../../types/ships/FactionShipTypes';
import { PlayerShipClass } from '../../types/ships/PlayerShipTypes';
import { OfficerManager } from '../module/OfficerManager';
import { ShipHangarManager } from '../module/ShipHangarManager';

/**
 * Ship hangar manager class that uses standardized types and events
 */
export class StandardShipHangarManager extends ShipHangarManager {
  /**
   * The map of ships in the hangar
   */
  private ships: Map<string, UnifiedShip> = new Map();

  /**
   * The capacity of the hangar
   */
  private capacity: number;

  /**
   * The ID of the hangar
   */
  private hangarId: string;

  /**
   * Constructor
   * @param hangarId The ID of the hangar
   * @param capacity The capacity of the hangar
   */
  constructor(
    hangarId: string,
    capacity: number = 10,
    resourceManager: ResourceManager,
    officerManager: OfficerManager
  ) {
    super(resourceManager, officerManager);
    this.hangarId = hangarId;
    this.capacity = capacity;
    this.ships = new Map();
  }

  /**
   * Get all ships in the hangar
   * @returns An array of all ships
   */
  public getAllShips(): UnifiedShip[] {
    return Array.from(this.ships.values());
  }

  /**
   * Get a ship by ID
   * @param shipId The ID of the ship to get
   * @returns The ship, or undefined if not found
   */
  public getShip(shipId: string): UnifiedShip | undefined {
    return this.ships.get(shipId);
  }

  /**
   * Add a ship to the hangar (Ships should be created via factory)
   * @param ship The ship to add
   * @returns True if the ship was added, false if the hangar is full
   */
  public addShip(ship: UnifiedShip): boolean {
    if (this.ships.size >= this.capacity) {
      console.warn(
        `[StandardShipHangarManager] Hangar ${this.hangarId} is full. Cannot add ship ${ship.id}`
      );
      return false;
    }
    if (this.ships.has(ship.id)) {
      console.warn(
        `[StandardShipHangarManager] Ship ${ship.id} already in hangar ${this.hangarId}.`
      );
      return false; // Or handle as update?
    }

    this.ships.set(ship.id, ship);
    return true;
  }

  /**
   * Remove a ship from the hangar
   * @param shipId The ID of the ship to remove
   * @returns True if the ship was removed, false if not found
   */
  public removeShip(shipId: string): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) {
      console.warn(
        `[StandardShipHangarManager] Ship ${shipId} not found in hangar ${this.hangarId} for removal.`
      );
      return false;
    }

    this.ships.delete(shipId);
    return true;
  }

  /**
   * Change a ship's status
   * @param shipId The ID of the ship
   * @param newStatus The new status
   * @returns True if the status was changed, false if not found
   */
  public changeShipStatus(shipId: string, newStatus: UnifiedShipStatus): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return false;
    }

    const oldStatus = ship.status;
    if (oldStatus === newStatus) return true; // No change needed

    ship.status = newStatus;
    return true;
  }

  /**
   * Deploy a ship (Simplified - sets status to ENGAGING)
   * @param shipId The ID of the ship to deploy
   * @param destination The destination to deploy to (optional for this simplified version)
   * @returns True if the ship was deployed, false if not found or not in a deployable state
   */
  public deployShip(shipId: string, destination?: string): boolean {
    const ship = this.ships.get(shipId);
    if (!ship || ![UnifiedShipStatus.IDLE, UnifiedShipStatus.READY].includes(ship.status)) {
      console.warn(
        `[StandardShipHangarManager] Ship ${shipId} cannot be deployed from status ${ship?.status}`
      );
      return false;
    }

    if (destination) {
      ship.destination = destination;
    }
    this.changeShipStatus(shipId, UnifiedShipStatus.ENGAGING);
    return true;
  }

  /**
   * Launch a ship from its bay
   * Corrected signature to match base class.
   * TODO: Needs logic adjustment if destination/arrival time were important.
   * TODO: Event emission needed after base class update.
   * @param shipId The ID of the ship to launch
   */
  public launchShip(shipId: string): void {
    const ship = this.getShip(shipId);
    if (!ship || ship.status !== UnifiedShipStatus.READY) {
      console.warn(
        `[StandardShipHangarManager] Ship ${shipId} cannot be launched from status ${ship?.status}`
      );
      return;
    }

    this.changeShipStatus(shipId, UnifiedShipStatus.IDLE);
    console.log(
      `[StandardShipHangarManager] Launched ship ${shipId}. (Destination logic removed due to base class signature)`
    );
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
    this.changeShipStatus(shipId, UnifiedShipStatus.IDLE);

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
    if (!ship || !ship.stats) {
      return false;
    }

    const oldHealth = ship.stats.health ?? ship.stats.maxHealth ?? 0;
    const newHealth = Math.max(0, oldHealth - damageAmount);
    ship.stats.health = newHealth;

    if (newHealth === 0 && ship.status !== UnifiedShipStatus.DISABLED) {
      this.changeShipStatus(shipId, UnifiedShipStatus.DISABLED);
    } else if (newHealth > 0 && ship.status !== UnifiedShipStatus.DAMAGED) {
      if (ship.status !== UnifiedShipStatus.DISABLED) {
        this.changeShipStatus(shipId, UnifiedShipStatus.DAMAGED);
      }
    }

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
    if (!ship || !ship.stats || !ship.stats.maxHealth) {
      return false;
    }
    if (ship.stats.health === ship.stats.maxHealth) return true;

    const oldHealth = ship.stats.health ?? 0;
    const newHealth = Math.min(ship.stats.maxHealth, oldHealth + repairAmount);
    ship.stats.health = newHealth;

    if (
      newHealth === ship.stats.maxHealth &&
      [UnifiedShipStatus.DAMAGED, UnifiedShipStatus.DISABLED, UnifiedShipStatus.REPAIRING].includes(
        ship.status
      )
    ) {
      this.changeShipStatus(shipId, UnifiedShipStatus.IDLE);
    } else if (ship.status !== UnifiedShipStatus.REPAIRING) {
      this.changeShipStatus(shipId, UnifiedShipStatus.REPAIRING);
    }

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
    if (!ship?.cargo?.capacity || !ship?.cargo?.resources) {
      if (ship && !ship.cargo) {
        const defaultCapacity = ship.stats?.cargoCapacity ?? 0;
        if (defaultCapacity > 0) {
          ship.cargo = { capacity: defaultCapacity, resources: new Map() };
        } else {
          console.warn(`[StandardShipHangarManager] Ship ${shipId} has no cargo capacity defined.`);
          return false;
        }
      } else if (ship && ship.cargo && !ship.cargo.resources) {
        ship.cargo.resources = new Map();
      } else {
        console.warn(
          `[StandardShipHangarManager] Ship ${shipId} not found or invalid cargo structure.`
        );
        return false;
      }
    }

    let currentUsage = 0;
    for (const value of ship.cargo.resources.values()) {
      currentUsage += value;
    }

    if (currentUsage + amount > ship.cargo.capacity) {
      console.warn(
        `[StandardShipHangarManager] Not enough cargo capacity on ship ${shipId} for ${amount} ${resourceType}. Available: ${ship.cargo.capacity - currentUsage}`
      );
      return false;
    }

    const currentAmount = ship.cargo.resources.get(resourceType) ?? 0;
    ship.cargo.resources.set(resourceType, currentAmount + amount);

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
    if (!ship?.cargo?.resources) {
      console.warn(
        `[StandardShipHangarManager] Ship ${shipId} not found or has no cargo resources.`
      );
      return false;
    }

    const currentAmount = ship.cargo.resources.get(resourceType) ?? 0;
    if (currentAmount < amount) {
      console.warn(
        `[StandardShipHangarManager] Not enough ${resourceType} (${currentAmount}) on ship ${shipId} to unload ${amount}.`
      );
      return false;
    }

    const newAmount = currentAmount - amount;
    if (newAmount === 0) {
      ship.cargo.resources.delete(resourceType);
    } else {
      ship.cargo.resources.set(resourceType, newAmount);
    }

    return true;
  }

  /**
   * Make a ship type available (using ShipCategory)
   * @param shipCategory The category of ship to make available
   * @param requirements The requirements to build this ship type
   */
  public makeShipTypeAvailable(
    shipCategory: ShipCategory,
    requirements: Record<string, unknown>
  ): void {
    // TODO: Add event emission once base class supports it
  }

  /**
   * Initiates the build process for a ship using the ShipFactory.
   *
   * @param shipClass The class of the ship to build (e.g., PlayerShipClass.STAR_SCHOONER)
   * @param options Optional configuration for the ship.
   * @returns The created UnifiedShip object if successful, otherwise undefined.
   */
  public buildShip(
    shipClass: PlayerShipClass | FactionShipClass,
    options: any = {}
  ): UnifiedShip | undefined {
    try {
      const buildOptions = { ...options, hangarId: this.hangarId };

      const newShip = shipFactory.createShip(shipClass, buildOptions);

      if (newShip) {
        const added = this.addShip(newShip);
        if (!added) {
          console.error(
            `[StandardShipHangarManager] Failed to add newly built ship ${newShip.id} to full hangar ${this.hangarId}.`
          );
          return undefined;
        }
        console.log(
          `[StandardShipHangarManager] Started build and added ship ${newShip.id} (${newShip.name}) to hangar ${this.hangarId}.`
        );
        return newShip;
      }
      return undefined;
    } catch (error) {
      console.error(
        `[StandardShipHangarManager] Error building ship of class ${shipClass}:`,
        error
      );
      return undefined;
    }
  }

  /**
   * Check the cargo of a ship and return it ensuring it conforms to ShipCargo.
   * Handles cases where cargo might be just a capacity number.
   * @param shipId The ID of the ship to check.
   * @returns ShipCargo object or undefined if not found or invalid.
   */
  public checkCargo(shipId: string): ShipCargo | undefined {
    const ship = this.getShip(shipId);

    if (!ship) {
      console.warn(`[StandardShipHangarManager] Ship ${shipId} not found for checkCargo.`);
      return undefined;
    }

    if (!ship.cargo) {
      const defaultCapacity = ship.stats?.cargoCapacity ?? 0;
      if (defaultCapacity > 0) {
        console.warn(
          `[StandardShipHangarManager] Ship ${shipId} cargo was undefined, initializing.`
        );
        ship.cargo = { capacity: defaultCapacity, resources: new Map() };
      } else {
        return undefined;
      }
    }

    if (!(ship.cargo.resources instanceof Map)) {
      console.warn(
        `[StandardShipHangarManager] Ship ${shipId} cargo.resources is not a Map. Re-initializing empty map.`
      );
      ship.cargo.resources = new Map<ResourceType, number>();
    }

    if (typeof ship.cargo.capacity !== 'number') {
      console.warn(
        `[StandardShipHangarManager] Ship ${shipId} cargo.capacity is not a number. Setting to 0.`
      );
      ship.cargo.capacity = 0;
    }

    return ship.cargo as ShipCargo;
  }

  /**
   * Updates the status for multiple ships using the UnifiedShipStatus enum.
   * @param shipIds Array of ship IDs to update.
   * @param status The new status from the UnifiedShipStatus enum.
   */
  public updateMultipleShipStatuses(shipIds: string[], status: UnifiedShipStatus): void {
    shipIds.forEach(shipId => {
      this.changeShipStatus(shipId, status);
    });
  }

  /**
   * Sets all currently engaging ships to idle status, using the UnifiedShipStatus enum.
   */
  public setShipsToIdle(): void {
    const engagingShips = this.getAllShips().filter(
      ship => ship.status === UnifiedShipStatus.ENGAGING
    );
    if (engagingShips.length > 0) {
      console.log(
        `[StandardShipHangarManager] Setting ${engagingShips.length} engaging ships to idle.`
      );
      this.updateMultipleShipStatuses(
        engagingShips.map(ship => ship.id),
        UnifiedShipStatus.IDLE
      );
    } else {
      console.log('[StandardShipHangarManager] No engaging ships found to set to idle.');
    }
  }

  /**
   * Calculates the total value of resources in a ship's cargo.
   * Assumes value is simply the amount for demonstration.
   * @param shipId The ID of the ship.
   * @returns The total calculated value, or 0 if no cargo or resources.
   */
  public getTotalCargoValue(shipId: string): number {
    const cargo = this.checkCargo(shipId);
    if (!cargo || cargo.resources.size === 0) {
      return 0;
    }

    let totalValue = 0;
    for (const amount of cargo.resources.values()) {
      totalValue += amount;
    }
    return totalValue;
  }
}

/**
 * Example usage:
 *
 * ```typescript
 * // Create a new hangar manager
 * const hangarManager = new StandardShipHangarManager('main-hangar', 5);
 *
 * // Create and add a ship
 * const newShip = hangarManager.createShip('Falcon', 'cruiser');
 * hangarManager.addShip(newShip);
 *
 * // Launch the ship
 * hangarManager.launchShip(newShip.id, 'Alpha Centauri', Date.now() + 60000);
 * ```
 */

// Define a local Event Map for this manager
// Renamed slightly for clarity and updated structure
interface ShipManagerEventPayloads {
  SHIP_STATUS_UPDATED: {
    shipId: string;
    oldStatus?: UnifiedShipStatus;
    newStatus: UnifiedShipStatus;
  };
  SHIP_ASSIGNMENT_UPDATED: {
    shipId: string;
    oldAssignment?: string;
    newAssignment?: string;
  };
  SHIP_REMOVED: { shipId: string };
  // Adding index signature to satisfy the constraint of TypedEventEmitter
  [key: string]: unknown;
}

/**
 * Implements the ship manager functionality
 * Manages all ships in the game
 */
// Updated base class generic to use the payload type map
export class ShipManager extends TypedEventEmitter<ShipManagerEventPayloads> {
  // Updated map to use UnifiedShip
  private ships: Map<string, UnifiedShip> = new Map();
  private resourceManager: ResourceManager; // Keep ResourceManager if needed for future logic

  constructor(resourceManager: ResourceManager) {
    super();
    this.resourceManager = resourceManager;
    errorLoggingService.logInfo('[ShipManager] Initialized');
  }

  /**
   * Register an existing ship with the manager.
   * Ship creation should likely happen elsewhere (e.g., ShipHangarManager or ShipFactory).
   * @param ship The ship object to register.
   */
  // Updated parameter type to UnifiedShip
  public registerShip(ship: UnifiedShip): void {
    if (this.ships.has(ship.id)) {
      errorLoggingService.logWarn(`[ShipManager] Ship already registered: ${ship.id}`);
      return;
    }
    this.ships.set(ship.id, ship);
    // Consider emitting a SHIP_REGISTERED event if needed
    errorLoggingService.logInfo(`[ShipManager] Ship registered: ${ship.id} (${ship.name})`);
  }

  /**
   * Get a ship by ID
   */
  // Updated return type to UnifiedShip
  public getShipById(shipId: string): UnifiedShip | undefined {
    const ship = this.ships.get(shipId);
    if (!ship) {
      // Keep warning, but maybe use a specific error type
      errorLoggingService.logWarn(`[ShipManager] Ship with ID ${shipId} not found.`);
      return undefined;
    }
    return ship;
  }

  /**
   * Update a ship's status
   */
  // Updated status parameter to UnifiedShipStatus
  public updateShipStatus(shipId: string, status: UnifiedShipStatus): void {
    const ship = this.getShipById(shipId);
    if (!ship) {
      return; // Error logged in getShipById
    }
    const oldStatus = ship.status;
    if (oldStatus !== status) {
      ship.status = status;
      // This payload now correctly matches the ShipManagerEventPayloads definition
      const payload = { shipId, oldStatus, newStatus: status };
      this.emit('SHIP_STATUS_UPDATED', payload); // Should now type-check correctly
      errorLoggingService.logInfo(
        `[ShipManager] Ship ${shipId} status updated: ${oldStatus} -> ${status}`
      );
    } else {
      // Warning is fine here
      errorLoggingService.logWarn(
        `[ShipManager] Ship ${shipId} already has status ${status}. No update performed.`
      );
    }
  }

  /**
   * Update a ship's assignment
   */
  public assignShip(shipId: string, assignment: string): void {
    const ship = this.getShipById(shipId);
    if (ship) {
      const oldAssignment = ship.assignedTo;
      ship.assignedTo = assignment;

      // This payload now correctly matches the ShipManagerEventPayloads definition
      const payload = {
        shipId,
        oldAssignment,
        newAssignment: assignment,
      };
      this.emit('SHIP_ASSIGNMENT_UPDATED', payload); // Should now type-check correctly
      errorLoggingService.logInfo(`[ShipManager] Ship ${shipId} assigned to: ${assignment}`);
    } else {
      // Error logged in getShipById
      // Log additional context if needed
      errorLoggingService.logError(
        new Error(`Cannot assign ship: Ship not found ${shipId}`),
        ErrorType.RUNTIME,
        ErrorSeverity.MEDIUM,
        {
          service: 'ShipManager',
          method: 'assignShip',
          shipId: shipId,
          assignment: assignment,
        }
      );
    }
  }

  /**
   * Unassigns a ship, making it available for new tasks.
   */
  public unassignShip(shipId: string): void {
    const ship = this.getShipById(shipId);
    if (ship) {
      const oldAssignment = ship.assignedTo;
      ship.assignedTo = undefined;

      // This payload now correctly matches the ShipManagerEventPayloads definition
      const payload = {
        shipId,
        oldAssignment,
        newAssignment: undefined,
      };
      this.emit('SHIP_ASSIGNMENT_UPDATED', payload); // Should now type-check correctly
      errorLoggingService.logInfo(`[ShipManager] Ship ${shipId} unassigned.`);
    } else {
      // Error logged in getShipById
      errorLoggingService.logError(
        new Error(`Cannot unassign ship: Ship not found ${shipId}`),
        ErrorType.RUNTIME,
        ErrorSeverity.MEDIUM,
        {
          service: 'ShipManager',
          method: 'unassignShip',
          shipId: shipId,
        }
      );
    }
  }

  /**
   * Get all ships
   */
  // Updated return type
  public getAllShips(): UnifiedShip[] {
    return Array.from(this.ships.values());
  }

  // Removed getShipsByType as UnifiedShip uses category enum
  // /**
  //  * Get ships by type
  //  */
  // public getShipsByType(type: string): Ship[] {
  //   return Array.from(this.ships.values()).filter(ship => ship.type === type);
  // }

  /**
   * Get ships by category
   * @param category The ShipCategory to filter by
   * @returns Ships matching the category
   */
  public getShipsByCategory(category: ShipCategory): UnifiedShip[] {
    return Array.from(this.ships.values()).filter(ship => ship.category === category);
  }

  /**
   * Get ships by status
   */
  // Updated status parameter and return type
  public getShipsByStatus(status: UnifiedShipStatus): UnifiedShip[] {
    return Array.from(this.ships.values()).filter(ship => ship.status === status);
  }

  /**
   * Removes a ship from the manager (e.g., if destroyed).
   * @param shipId The ID of the ship to remove.
   * @returns True if the ship was removed, false otherwise.
   */
  public removeShip(shipId: string): boolean {
    const ship = this.ships.get(shipId);
    if (ship) {
      this.ships.delete(shipId);
      // This payload now correctly matches the ShipManagerEventPayloads definition
      const payload = { shipId };
      this.emit('SHIP_REMOVED', payload); // Should now type-check correctly
      errorLoggingService.logInfo(`[ShipManager] Ship removed: ${shipId}`);
      return true;
    } else {
      errorLoggingService.logWarn(`[ShipManager] Attempted to remove non-existent ship: ${shipId}`);
      return false;
    }
  }
}

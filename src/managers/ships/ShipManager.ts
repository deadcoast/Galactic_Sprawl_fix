/**
 * Implementation of the ShipManager
 * Handles ship creation, management, and status updates
 */
import { CreateShipOptions, ShipFactory, shipFactory } from '../../factories/ships/ShipFactory';
import { TypedEventEmitter } from '../../lib/events/EventEmitter';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/logging/ErrorLoggingService';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { Ship, ShipCategory, ShipStatus, ShipSummary, Tier } from '../../types/ships/ShipTypes';
import { ShipCargo } from '../../types/ships/CommonShipTypes'; // Import ShipCargo
import { FactionShipClass } from '../../types/ships/FactionShipTypes'; // Import FactionShipClass
import { PlayerShipClass } from '../../types/ships/PlayerShipTypes'; // Import PlayerShipClass
import { ResourceManager } from '../game/ResourceManager';
import { getResourceManager } from '../ManagerRegistry';
import { ModuleManager, moduleManager } from '../module/ModuleManager';
import { OfficerManager } from '../module/OfficerManager';
import { ShipHangarManager } from '../module/ShipHangarManager';

/**
 * Ship hangar manager class that uses standardized types and events
 */
export class StandardShipHangarManager extends ShipHangarManager {
  /**
   * The map of ships in the hangar
   */
  private ships = new Map<string, Ship>();

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
    capacity = 10,
    resourceManager: ResourceManager,
    officerManager: OfficerManager
  ) {
    super(resourceManager, officerManager);
    this.hangarId = hangarId;
    this.capacity = capacity;
    this.ships = new Map();
  }

  /**
   * Get summarized data for all ships in the hangar
   * @returns An array of ShipSummary objects
   */
  public getAllShips(): ShipSummary[] {
    return Array.from(this.ships.values()).map((ship) => ({
      id: ship.id,
      name: ship.name,
      category: ship.category,
      status: ship.status,
      tier: ship.tier, // Add missing tier
    }));
  }

  /**
   * Get the full details of a ship by ID
   * @param shipId The ID of the ship to get
   * @returns The full Ship object, or undefined if not found
   */
  public getShipDetails(shipId: string): Ship | undefined {
    return this.ships.get(shipId);
  }

  /**
   * Get a ship by ID
   * @param shipId The ID of the ship to get
   * @returns The ship, or undefined if not found
   */
  public getShip(shipId: string): Ship | undefined {
    // Deprecate this or align with getShipDetails? For now, keep it as an alias.
    return this.getShipDetails(shipId);
  }

  /**
   * Add a ship to the hangar (Ships should be created via factory)
   * @param ship The ship to add
   * @returns True if the ship was added, false if the hangar is full
   */
  public addShip(ship: Ship): boolean {
    if (this.ships.size >= this.capacity) {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Hangar ${this.hangarId} is full. Cannot add ship ${ship.id}`
      );
      return false;
    }
    if (this.ships.has(ship.id)) {
      errorLoggingService.logWarn(
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
      errorLoggingService.logWarn(
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
  public changeShipStatus(shipId: string, newStatus: ShipStatus): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return false;
    }

    const oldStatus = ship.status;
    if (oldStatus === newStatus) {
      return true;
    } // No change needed

    ship.status = newStatus;
    // TODO: Emit event if ShipHangarManager requires it
    return true;
  }

  /**
   * Deploy a ship (Simplified - sets status to ENGAGING)
   * @param shipId The ID of the ship to deploy
   * @returns True if the ship was deployed, false if not found or not in a deployable state
   */
  public deployShip(shipId: string): boolean {
    const ship = this.ships.get(shipId);
    // Use optional chaining for safer status access
    if (!ship || ![ShipStatus.IDLE, ShipStatus.READY].includes(ship.status)) {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Ship ${shipId} cannot be deployed from status ${ship?.status}`
      );
      return false;
    }

    this.changeShipStatus(shipId, ShipStatus.ENGAGING);
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
    // Use optional chaining for safer status access
    if (!ship || ship.status !== ShipStatus.READY) {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Ship ${shipId} cannot be launched from status ${ship?.status}`
      );
      return;
    }

    this.changeShipStatus(shipId, ShipStatus.IDLE);
    errorLoggingService.logInfo(
      `[StandardShipHangarManager] Launched ship ${shipId}. (Destination logic removed due to base class signature)`
    );
  }

  /**
   * Mark a ship as arrived at its destination
   * @param shipId The ID of the ship that arrived
   * @returns True if the ship was marked as arrived, false if not found
   */
  public shipArrived(shipId: string): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return false;
    }

    this.changeShipStatus(shipId, ShipStatus.IDLE);
    // TODO: Emit event if ShipHangarManager requires it
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
    // Add explicit check for ship.stats
    if (!ship?.stats) {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Ship ${shipId} not found or has no stats for damageShip.`
      );
      return false;
    }

    // Now safe to access stats properties
    const oldHealth = ship.stats.health ?? ship.stats.maxHealth ?? 0;
    const newHealth = Math.max(0, oldHealth - damageAmount);
    ship.stats.health = newHealth;

    // Use optional chaining for status access
    if (newHealth === 0 && ship.status !== ShipStatus.DISABLED) {
      this.changeShipStatus(shipId, ShipStatus.DISABLED);
    } else if (
      newHealth > 0 &&
      ship.status !== ShipStatus.DAMAGED &&
      ship.status !== ShipStatus.DISABLED
    ) {
      this.changeShipStatus(shipId, ShipStatus.DAMAGED);
    }
    // TODO: Emit event if ShipHangarManager requires it
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
    // Check stats and maxHealth exist
    if (!ship?.stats?.maxHealth) {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Ship ${shipId} not found or missing stats/maxHealth for repairShip.`
      );
      return false;
    }
    // Ensure health exists before comparing
    if (ship.stats.health !== undefined && ship.stats.health === ship.stats.maxHealth) {
      return true;
    }

    const oldHealth = ship.stats.health ?? 0;
    const newHealth = Math.min(ship.stats.maxHealth, oldHealth + repairAmount);
    ship.stats.health = newHealth;

    // Ensure status exists before comparing
    if (
      ship.status &&
      newHealth === ship.stats.maxHealth &&
      [ShipStatus.DAMAGED, ShipStatus.DISABLED, ShipStatus.REPAIRING].includes(ship.status)
    ) {
      this.changeShipStatus(shipId, ShipStatus.IDLE);
    } else if (ship.status !== ShipStatus.REPAIRING) {
      this.changeShipStatus(shipId, ShipStatus.REPAIRING);
    }
    // TODO: Emit event if ShipHangarManager requires it
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

    if (!ship) {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Ship ${shipId} not found for loadCargo.`
      );
      return false;
    }

    // Initialize cargo if necessary and possible
    if (!ship.cargo) {
      let defaultCapacity = 0;
      // Safely check if cargoCapacity exists on stats and is a number
      if (ship.stats && 'cargoCapacity' in ship.stats && typeof ship.stats.cargoCapacity === 'number') {
        defaultCapacity = ship.stats.cargoCapacity;
      }

      if (defaultCapacity > 0) {
        ship.cargo = { capacity: defaultCapacity, resources: new Map() };
        errorLoggingService.logInfo(
          `[StandardShipHangarManager] Initialized cargo for ship ${shipId}.`
        );
      } else {
        errorLoggingService.logWarn(
          `[StandardShipHangarManager] Ship ${shipId} has no defined cargo capacity or stats. Cannot initialize cargo.`
        );
        return false;
      }
    }

    // Ensure resources is a Map
    if (!(ship.cargo.resources instanceof Map)) {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Ship ${shipId} cargo.resources is not a Map. Re-initializing.`
      );
      ship.cargo.resources = new Map<ResourceType, number>();
    }
    // Ensure capacity is a number
    if (typeof ship.cargo.capacity !== 'number') {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Ship ${shipId} cargo.capacity is not a number. Using 0.`
      );
      ship.cargo.capacity = 0;
    }

    let currentUsage = 0;
    // Safely iterate over resources map
    if (ship.cargo.resources) {
      for (const value of ship.cargo.resources.values()) {
        currentUsage += value;
      }
    }

    if (currentUsage + amount > ship.cargo.capacity) {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Not enough cargo capacity on ship ${shipId} for ${amount} ${resourceType}. Available: ${ship.cargo.capacity - currentUsage}`
      );
      return false;
    }

    const currentAmount = ship.cargo.resources.get(resourceType) ?? 0;
    ship.cargo.resources.set(resourceType, currentAmount + amount);
    // TODO: Emit event if ShipHangarManager requires it
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
    // Use optional chaining for safer access
    if (!ship?.cargo?.resources) {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Ship ${shipId} not found or has no cargo resources for unloadCargo.`
      );
      return false;
    }

    const currentAmount = ship.cargo.resources.get(resourceType) ?? 0;
    if (currentAmount < amount) {
      errorLoggingService.logWarn(
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
    // TODO: Emit event if ShipHangarManager requires it
    return true;
  }

  /**
   * Make a ship type available (using ShipCategory)
   * @param shipCategory The category of ship to make available
   * @param _requirements The requirements to build this ship type
   */
  public makeShipTypeAvailable(
    shipCategory: ShipCategory,
    _requirements: Record<string, unknown>
  ): void {
    // TODO: Add event emission once base class supports it
    errorLoggingService.logInfo(
      `[StandardShipHangarManager] Ship type ${shipCategory} availability requirements set.`
    );
    // Actual implementation would involve storing requirements and potentially emitting an event
  }

  /**
   * Initiates the build process for a ship using the ShipFactory.
   *
   * @param shipClass The class of the ship to build (e.g., PlayerShipClass.STAR_SCHOONER)
   * @param options Optional configuration for the ship.
   * @returns The created Ship object if successful, otherwise undefined.
   */
  public buildShip(
    shipClass: PlayerShipClass | FactionShipClass, // Use imported types
    options?: CreateShipOptions
  ): Ship | undefined {
    try {
      // Add default position if not provided, remove hangarId
      const buildOptions: CreateShipOptions = {
        position: { x: 0, y: 0 }, // Provide default position
        ...options,
        // hangarId: this.hangarId, // Removed hangarId
      };

      // Use the imported shipFactory instance
      const newShip = shipFactory.createShip(shipClass, buildOptions);

      if (newShip) {
        const added = this.addShip(newShip);
        if (!added) {
          errorLoggingService.logError(
            new Error(
              `[StandardShipHangarManager] Failed to add newly built ship ${newShip.id} to full hangar ${this.hangarId}.`
            ),
            ErrorType.RUNTIME,
            ErrorSeverity.HIGH
          );
          return undefined;
        }
        errorLoggingService.logInfo(
          `[StandardShipHangarManager] Started build and added ship ${newShip.id} (${newShip.name}) to hangar ${this.hangarId}.`
        );
        return newShip;
      }
      return undefined;
    } catch (error) {
      errorLoggingService.logError(
        new Error(`[StandardShipHangarManager] Error building ship of class ${shipClass}`, {
          cause: error instanceof Error ? error : undefined,
        }),
        ErrorType.RUNTIME,
        ErrorSeverity.HIGH
      );
      return undefined;
    }
  }

  /**
   * Check the cargo of a ship and return it ensuring it conforms to ShipCargo.
   * Handles cases where cargo might be just a capacity number or invalid.
   * @param shipId The ID of the ship to check.
   * @returns ShipCargo object or undefined if not found or invalid.
   */
  public checkCargo(shipId: string): ShipCargo | undefined {
    const ship = this.getShip(shipId);

    if (!ship) {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Ship ${shipId} not found for checkCargo.`
      );
      return undefined;
    }

    // Determine default capacity correctly from stats.cargo
    let defaultCapacity = 0;
    if (ship.stats?.cargo) {
      if (typeof ship.stats.cargo === 'number') {
        defaultCapacity = ship.stats.cargo;
      } else if (
        typeof ship.stats.cargo === 'object' &&
        ship.stats.cargo !== null &&
        typeof ship.stats.cargo.capacity === 'number'
      ) {
        defaultCapacity = ship.stats.cargo.capacity;
      }
    }

    // Initialize or validate cargo structure
    if (!ship.cargo || typeof ship.cargo !== 'object') {
      // Use the derived defaultCapacity
      if (defaultCapacity > 0) {
        errorLoggingService.logWarn(
          `[StandardShipHangarManager] Ship ${shipId} cargo was invalid or undefined, initializing.`
        );
        ship.cargo = { capacity: defaultCapacity, resources: new Map() };
      } else {
        errorLoggingService.logWarn(
          `[StandardShipHangarManager] Ship ${shipId} has no cargo capacity, cannot initialize cargo.`
        );
        return undefined; // No capacity, no cargo object
      }
    }

    // Ensure resources is a Map
    if (!(ship.cargo.resources instanceof Map)) {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Ship ${shipId} cargo.resources is not a Map. Re-initializing empty map.`
      );
      ship.cargo.resources = new Map<ResourceType, number>();
    }

    // Ensure capacity is a number and consistent with stats if possible
    if (typeof ship.cargo.capacity !== 'number' || isNaN(ship.cargo.capacity)) {
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Ship ${shipId} cargo.capacity is not a valid number. Setting to derived default: ${defaultCapacity}.`
      );
      ship.cargo.capacity = defaultCapacity;
    } else if (ship.cargo.capacity !== defaultCapacity && defaultCapacity > 0) {
      // Optional: Log inconsistency or update if needed
      errorLoggingService.logWarn(
        `[StandardShipHangarManager] Ship ${shipId} cargo.capacity (${ship.cargo.capacity}) inconsistent with stats-derived capacity (${defaultCapacity}). Keeping existing cargo capacity.`
      );
      // Or force update: ship.cargo.capacity = defaultCapacity;
    }

    // Ensure integrity of resource amounts
    for (const [key, value] of ship.cargo.resources.entries()) {
      if (typeof value !== 'number' || isNaN(value) || value < 0) {
        errorLoggingService.logWarn(
          `[StandardShipHangarManager] Ship ${shipId} cargo has invalid amount for resource ${key}. Setting to 0.`
        );
        ship.cargo.resources.set(key, 0);
      }
    }

    return ship.cargo;
  }

  /**
   * Updates the status for multiple ships using the ShipStatus enum.
   * @param shipIds Array of ship IDs to update.
   * @param status The new status from the ShipStatus enum.
   */
  public updateMultipleShipStatuses(shipIds: string[], status: ShipStatus): void {
    shipIds.forEach(shipId => {
      this.changeShipStatus(shipId, status);
    });
  }

  /**
   * Sets all currently engaging ships to idle status, using the ShipStatus enum.
   */
  public setShipsToIdle(): void {
    const engagingShips = this.getAllShips().filter(ship => ship.status === ShipStatus.ENGAGING);
    if (engagingShips.length > 0) {
      errorLoggingService.logInfo(
        `[StandardShipHangarManager] Setting ${engagingShips.length} engaging ships to idle.`
      );
      this.updateMultipleShipStatuses(
        engagingShips.map(ship => ship.id),
        ShipStatus.IDLE
      );
    } else {
      errorLoggingService.logInfo(
        '[StandardShipHangarManager] No engaging ships found to set to idle.'
      );
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
      // Add validation if value calculation is more complex
      if (typeof amount === 'number' && !isNaN(amount)) {
        totalValue += amount;
      }
    }
    return totalValue;
  }

  /**
   * Get the full details of all ships in the hangar
   * @returns An array of Ship objects
   */
  public getAllShipDetails(): Ship[] {
    return Array.from(this.ships.values());
  }
}

// Define a local Event Map for this manager
interface ShipManagerEventPayloads {
  SHIP_STATUS_UPDATED: {
    shipId: string;
    oldStatus?: ShipStatus;
    newStatus: ShipStatus;
  };
  SHIP_ASSIGNMENT_UPDATED: {
    shipId: string;
    oldAssignment?: string;
    newAssignment?: string;
  };
  SHIP_REMOVED: { shipId: string };
  [key: string]: unknown;
}

/**
 * Implements the ship manager functionality
 * Manages all ships in the game globally
 */
export class ShipManager extends TypedEventEmitter<ShipManagerEventPayloads> {
  private static instance: ShipManager | null = null;
  private ships = new Map<string, Ship>();
  private resourceManager: ResourceManager;
  private moduleManager: ModuleManager;
  private shipFactory: ShipFactory;
  private fleetAssignments = new Map<string, string[]>();

  private nextShipId = 0;

  private constructor() {
    super();
    this.resourceManager = getResourceManager();
    this.moduleManager = moduleManager;
    this.shipFactory = shipFactory;
    errorLoggingService.logInfo('[ShipManager] Initialized'); // Update global call
  }

  public static getInstance(): ShipManager {
    if (!ShipManager.instance) {
      ShipManager.instance = new ShipManager();
    }
    return ShipManager.instance;
  }

  /**
   * Register an existing ship with the manager.
   * This might be called by Hangar Managers or Factories upon creation/transfer.
   * @param ship The ship object to register.
   */
  public registerShip(ship: Ship): void {
    if (this.ships.has(ship.id)) {
      errorLoggingService.logWarn(`[ShipManager] Ship already registered: ${ship.id}`); // Update global call, fix typo
      return;
    }
    this.ships.set(ship.id, ship);
    errorLoggingService.logInfo(`[ShipManager] Ship registered: ${ship.id} (${ship.name})`); // Update global call
    // Potentially emit a global SHIP_REGISTERED event if needed
  }

  /**
   * Get a ship by ID
   */
  public getShipById(shipId: string): Ship | undefined {
    const ship = this.ships.get(shipId);
    if (!ship) {
      // Reduced log severity as this might be a common check
      // errorLoggingService.logWarn(`[ShipManager] Ship with ID ${shipId} not found.`);
      return undefined;
    }
    return ship;
  }

  /**
   * Update a ship's status globally.
   * Should be called by the component/manager responsible for the status change (e.g., Hangar, Combat).
   */
  public updateShipStatus(shipId: string, status: ShipStatus): void {
    const ship = this.getShipById(shipId);
    if (!ship) {
      errorLoggingService.logWarn(`[ShipManager] Cannot update status: Ship not found ${shipId}`); // Update global call, fix typo
      return;
    }
    const oldStatus = ship.status;
    if (oldStatus !== status) {
      ship.status = status;
      const payload = { shipId, oldStatus, newStatus: status };
      this.emit('SHIP_STATUS_UPDATED', payload); // Use defined event key
      // Consider logging level - Info might be too verbose for frequent updates
      // errorLoggingService.logInfo(`[ShipManager] Ship ${shipId} status updated: ${oldStatus} -> ${status}`);
    } else {
      // Log only if debugging status updates
      // errorLoggingService.logWarn(`[ShipManager] Ship ${shipId} already has status ${status}. No update performed.`);
    }
  }

  /**
   * Update a ship's assignment (e.g., to a mission, task, or location).
   * Assumes Ship has an 'assignedTo' property.
   */
  public assignShip(shipId: string, assignment: string): void {
    const ship = this.getShipById(shipId);
    if (ship) {
      // const previousAssignment = ship.assignedTo; // Remove assignedTo usage
      ship.status = ShipStatus.ASSIGNED; // Set status when assigning
      const payload = {
        shipId,
        // previousAssignment, // Include if needed
        newAssignment: assignment,
      };
      this.emit('SHIP_ASSIGNMENT_UPDATED', payload);
      errorLoggingService.logInfo(`[ShipManager] Ship ${shipId} assigned to: ${assignment}`); // Update global call
    } else {
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
   * Assumes Ship has an 'assignedTo' property.
   */
  public unassignShip(shipId: string): void {
    const ship = this.getShipById(shipId);
    if (ship) {
      // const previousAssignment = ship.assignedTo; // Remove assignedTo usage
      ship.status = ShipStatus.IDLE; // Revert to IDLE when unassigning
      const payload = {
        shipId,
        // previousAssignment, // Include if needed
        newAssignment: undefined,
      };
      this.emit('SHIP_ASSIGNMENT_UPDATED', payload);
      errorLoggingService.logInfo(`[ShipManager] Ship ${shipId} unassigned.`); // Update global call
    } else {
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
   * Get all ships managed globally
   */
  public getAllShips(): Ship[] {
    return Array.from(this.ships.values());
  }

  /**
   * Get ships by category globally
   * @param category The ShipCategory to filter by
   * @returns Ships matching the category
   */
  public getShipsByCategory(category: ShipCategory): Ship[] {
    return Array.from(this.ships.values()).filter(ship => ship.category === category);
  }

  /**
   * Get ships by status globally
   */
  public getShipsByStatus(status: ShipStatus): Ship[] {
    return Array.from(this.ships.values()).filter(ship => ship.status === status);
  }

  /**
   * Removes a ship from the global manager (e.g., if destroyed).
   * Should be called by the system responsible for ship destruction.
   * @param shipId The ID of the ship to remove.
   * @returns True if the ship was removed, false otherwise.
   */
  public removeShip(shipId: string): boolean {
    const ship = this.ships.get(shipId);
    if (ship) {
      this.ships.delete(shipId);
      const payload = { shipId };
      this.emit('SHIP_REMOVED', payload); // Use defined event key
      errorLoggingService.logInfo(`[ShipManager] Ship removed: ${shipId}`); // Update global call
      // TODO: Consider cleanup tasks like removing from fleet assignments map if used
      this.removeShipFromFleet(shipId); // Remove from fleet assignments if managing globally
      return true;
    } else {
      errorLoggingService.logWarn(`[ShipManager] Attempted to remove non-existent ship: ${shipId}`); // Update global call, fix typo
      return false;
    }
  }

  // --- Fleet Management (Example - if needed globally) ---

  /**
   * Assigns a ship to a global fleet.
   */
  public assignShipToFleet(shipId: string, fleetId: string): boolean {
    const ship = this.getShipById(shipId);
    if (!ship) {
      errorLoggingService.logWarn(`Ship ${shipId} not found for fleet assignment.`);
      return false;
    }

    // Remove from previous fleet if assigned globally
    this.removeShipFromFleet(shipId);

    if (!this.fleetAssignments.has(fleetId)) {
      this.fleetAssignments.set(fleetId, []);
    }
    this.fleetAssignments.get(fleetId)?.push(shipId);
    // Optionally update a fleetId property on the ship itself if the Ship type supports it
    // (ship as any).fleetId = fleetId; // Add type assertion if needed
    // TODO: Emit global fleet assignment event if needed
    errorLoggingService.logInfo(`[ShipManager] Assigned ship ${shipId} to fleet ${fleetId}`);
    return true;
  }

  /**
   * Removes a ship from any global fleet assignment.
   */
  public removeShipFromFleet(shipId: string): boolean {
    let removed = false;
    let previousFleetId: string | undefined;
    this.fleetAssignments.forEach((assignedShipIds, fleetId) => {
      const index = assignedShipIds.indexOf(shipId);
      if (index > -1) {
        assignedShipIds.splice(index, 1);
        removed = true;
        previousFleetId = fleetId;
        // Optionally clear fleetId property on the ship
        // const ship = this.getShipById(shipId);
        // if (ship && (ship as any).fleetId) (ship as any).fleetId = undefined;
      }
    });
    if (removed) {
      // TODO: Emit global fleet removal event if needed
      errorLoggingService.logInfo(
        `[ShipManager] Removed ship ${shipId} from fleet ${previousFleetId}`
      );
    }
    return removed;
  }

  /**
   * Get all ships belonging to a specific global fleet.
   */
  public getShipsInFleet(fleetId: string): Ship[] {
    const shipIds = this.fleetAssignments.get(fleetId) ?? [];
    return shipIds.map(id => this.getShipById(id)).filter((ship): ship is Ship => !!ship);
  }
}

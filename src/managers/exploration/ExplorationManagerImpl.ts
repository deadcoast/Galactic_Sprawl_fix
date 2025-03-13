/**
 * @file ExplorationManagerImpl.ts
 * Implementation of the ExplorationManager that conforms to the BaseManager interface.
 *
 * This class handles:
 * 1. Star system management and ship assignments
 * 2. Sector scanning and discovery tracking
 * 3. Integration with ship managers for operation
 * 4. Event-based communication with UI components
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '../../lib/events/EventBus';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';

// Define Exploration specific event types
export enum ExplorationEvents {
  SECTOR_DISCOVERED = 'EXPLORATION_SECTOR_DISCOVERED',
  SECTOR_SCANNED = 'EXPLORATION_SECTOR_SCANNED',
  ANOMALY_DETECTED = 'EXPLORATION_ANOMALY_DETECTED',
  RESOURCE_DETECTED = 'EXPLORATION_RESOURCE_DETECTED',
  SCAN_STARTED = 'EXPLORATION_SCAN_STARTED',
  SCAN_COMPLETED = 'EXPLORATION_SCAN_COMPLETED',
  SCAN_FAILED = 'EXPLORATION_SCAN_FAILED',
  SHIP_ASSIGNED = 'EXPLORATION_SHIP_ASSIGNED',
  SHIP_UNASSIGNED = 'EXPLORATION_SHIP_UNASSIGNED',
  SYSTEM_CREATED = 'EXPLORATION_SYSTEM_CREATED',
  SYSTEM_UPDATED = 'EXPLORATION_SYSTEM_UPDATED',
}

// Define interfaces for the types used
export interface StarSystem {
  id: string;
  name: string;
  type?: string;
  resources?: string[];
  status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  assignedShips: string[];
  position: {
    x: number;
    y: number;
  };
  lastScanned?: number;
  discoveredAt?: number;
}

export interface SystemSearchCriteria {
  name?: string;
  type?: string;
  resources?: string[];
  status?: string;
}

// Ship interface to break circular dependency
export interface IShip {
  id: string;
  name: string;
  type: string;
  status: string;
  assignedTo?: string;
}

// Ship manager interface to break circular dependency
export interface IShipManager {
  getShipById(shipId: string): IShip | undefined;
  updateShipStatus(shipId: string, status: string): void;
  updateShipAssignment(shipId: string, systemId: string): void;
  getAllShips(): IShip[];
  getShipsByType(type: string): IShip[];
  getShipsByStatus(status: string): IShip[];
}

// Event data interface
export interface ExplorationEventData extends Record<string, unknown> {
  system?: StarSystem;
  shipId?: string;
  systemId?: string;
  reason?: string;
}

/**
 * ExplorationManagerImpl implements the exploration manager functionality,
 * managing star systems and their assignments.
 */
export class ExplorationManagerImpl extends AbstractBaseManager<BaseEvent> {
  private systems: Map<string, StarSystem> = new Map();

  // Module ID for this manager (used in events)
  private moduleId: string = uuidv4();

  // Statistics
  private stats = {
    systemsCreated: 0,
    systemsUpdated: 0,
    shipsAssigned: 0,
    shipsUnassigned: 0,
  };

  /**
   * Create a new ExplorationManagerImpl
   *
   * @param eventBus The event bus for events
   * @param shipManager The ship manager implementation
   */
  constructor(
    private eventBus: EventBus<BaseEvent>,
    private shipManager: IShipManager
  ) {
    super('ExplorationManagerImpl');
  }

  /**
   * Get the version of this manager implementation
   */
  protected getVersion(): string {
    return '1.0.0';
  }

  /**
   * Get statistics for this manager (for monitoring)
   */
  protected getStats(): Record<string, number | string> {
    return {
      ...this.stats,
      systemCount: this.systems.size,
    };
  }

  /**
   * Initialize the exploration manager
   */
  protected async onInitialize(_dependencies?: Record<string, unknown>): Promise<void> {
    console.warn('ExplorationManagerImpl initialized');

    // No initialization needed at this time
    return Promise.resolve();
  }

  /**
   * Handle updates on each tick
   */
  protected onUpdate(_deltaTime: number): void {
    // Currently no time-based updates needed
  }

  /**
   * Clean up resources
   */
  protected async onDispose(): Promise<void> {
    this.systems.clear();
    return Promise.resolve();
  }

  /**
   * Create an event with proper structure
   */
  private createEvent(eventType: ExplorationEvents, data: ExplorationEventData): BaseEvent {
    return {
      type: eventType as unknown as EventType,
      timestamp: Date.now(),
      moduleId: this.moduleId,
      moduleType: 'EXPLORATION' as ModuleType,
      data,
    };
  }

  /**
   * Create a new star system in the exploration manager
   */
  public createStarSystem(system: {
    id: string;
    name: string;
    status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
    position?: { x: number; y: number };
  }): StarSystem {
    const now = Date.now();

    const newSystem: StarSystem = {
      ...system,
      position: system.position || { x: 0, y: 0 },
      assignedShips: [],
      discoveredAt: now,
    };

    this.systems.set(system.id, newSystem);
    this.stats.systemsCreated++;

    // Emit event
    const event = this.createEvent(ExplorationEvents.SYSTEM_CREATED, {
      system: newSystem,
    });
    this.publishEvent(event);

    return newSystem;
  }

  /**
   * Get a star system by ID
   */
  public getSystemById(systemId: string): StarSystem | undefined {
    return this.systems.get(systemId);
  }

  /**
   * Get all star systems
   */
  public getAllSystems(): StarSystem[] {
    return Array.from(this.systems.values());
  }

  /**
   * Add an existing star system to the exploration manager
   */
  public addStarSystem(system: {
    id: string;
    name: string;
    type: string;
    resources: string[];
    status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
    position?: { x: number; y: number };
  }): StarSystem {
    const now = Date.now();

    const newSystem: StarSystem = {
      ...system,
      position: system.position || { x: 0, y: 0 },
      assignedShips: [],
      discoveredAt: now,
    };

    this.systems.set(system.id, newSystem);
    this.stats.systemsCreated++;

    // Emit event
    const event = this.createEvent(ExplorationEvents.SYSTEM_CREATED, {
      system: newSystem,
    });
    this.publishEvent(event);

    return newSystem;
  }

  /**
   * Update a star system
   */
  public updateSystem(
    systemId: string,
    updates: Partial<Omit<StarSystem, 'id'>>
  ): StarSystem | undefined {
    const system = this.systems.get(systemId);
    if (!system) {
      return undefined;
    }

    const updatedSystem = {
      ...system,
      ...updates,
    };

    this.systems.set(systemId, updatedSystem);
    this.stats.systemsUpdated++;

    // Emit event
    const event = this.createEvent(ExplorationEvents.SYSTEM_UPDATED, {
      system: updatedSystem,
    });
    this.publishEvent(event);

    return updatedSystem;
  }

  /**
   * Assign a ship to a star system
   */
  public assignShipToSystem(shipId: string, systemId: string): boolean {
    const system = this.systems.get(systemId);
    if (!system) {
      return false;
    }

    const ship = this.shipManager.getShipById(shipId);
    if (!ship) {
      return false;
    }

    // Update the system
    system.assignedShips.push(shipId);
    this.systems.set(systemId, system);

    // Update the ship
    this.shipManager.updateShipStatus(shipId, 'assigned');
    this.shipManager.updateShipAssignment(shipId, systemId);

    this.stats.shipsAssigned++;

    // Emit event
    const event = this.createEvent(ExplorationEvents.SHIP_ASSIGNED, {
      system,
      shipId,
      systemId,
    });
    this.publishEvent(event);

    return true;
  }

  /**
   * Unassign a ship from a system
   */
  public unassignShipFromSystem(shipId: string, systemId: string): boolean {
    const system = this.systems.get(systemId);
    if (!system) {
      return false;
    }

    // Check if the ship is actually assigned to this system
    const shipIndex = system.assignedShips.indexOf(shipId);
    if (shipIndex === -1) {
      return false;
    }

    // Update the system
    system.assignedShips.splice(shipIndex, 1);
    this.systems.set(systemId, system);

    // Update the ship
    this.shipManager.updateShipStatus(shipId, 'idle');
    this.shipManager.updateShipAssignment(shipId, '');

    this.stats.shipsUnassigned++;

    // Emit event
    const event = this.createEvent(ExplorationEvents.SHIP_UNASSIGNED, {
      system,
      shipId,
      systemId,
    });
    this.publishEvent(event);

    return true;
  }

  /**
   * Search star systems based on criteria
   */
  public searchSystems(criteria: SystemSearchCriteria): StarSystem[] {
    const results: StarSystem[] = [];

    for (const system of this.systems.values()) {
      if (this.matchesCriteria(system, criteria)) {
        results.push(system);
      }
    }

    return results;
  }

  /**
   * Check if a system matches the search criteria
   */
  private matchesCriteria(system: StarSystem, criteria: SystemSearchCriteria): boolean {
    // Check name
    if (criteria.name && !system.name.toLowerCase().includes(criteria.name.toLowerCase())) {
      return false;
    }

    // Check type
    if (criteria.type && system.type !== criteria.type) {
      return false;
    }

    // Check resources
    if (criteria.resources && criteria.resources.length > 0) {
      if (!system.resources) {
        return false;
      }

      if (!criteria.resources.every(resource => system.resources?.includes(resource))) {
        return false;
      }
    }

    // Check status
    if (criteria.status && system.status !== criteria.status) {
      return false;
    }

    return true;
  }
}

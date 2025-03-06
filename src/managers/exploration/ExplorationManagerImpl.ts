/**
 * Implementation of the ExplorationManager
 * Handles star system management and ship assignments
 */

import type { ShipManagerImpl } from '../ships/ShipManagerImpl';

// Define interfaces for the types used
export interface StarSystem {
  id: string;
  name: string;
  type?: string;
  resources?: string[];
  status: string;
  assignedShips: string[];
}

export interface SystemSearchCriteria {
  name?: string;
  type?: string;
  resources?: string[];
  status?: string;
}

/**
 * Implements the exploration manager functionality, managing star systems and their assignments
 */
export class ExplorationManagerImpl {
  private systems: Map<string, StarSystem> = new Map();
  private shipManager: ShipManagerImpl;

  constructor(shipManager: ShipManagerImpl) {
    this.shipManager = shipManager;
  }

  /**
   * Create a new star system in the exploration manager
   */
  public createStarSystem(system: { id: string; name: string; status: string }): StarSystem {
    const newSystem: StarSystem = {
      ...system,
      assignedShips: [],
    };

    this.systems.set(system.id, newSystem);
    return newSystem;
  }

  /**
   * Get a star system by ID
   */
  public getSystemById(systemId: string): StarSystem {
    const system = this.systems.get(systemId);
    if (!system) {
      throw new Error(`System with ID ${systemId} not found`);
    }
    return system;
  }

  /**
   * Add an existing star system to the exploration manager
   */
  public addStarSystem(system: {
    id: string;
    name: string;
    type: string;
    resources: string[];
    status: string;
  }): StarSystem {
    const newSystem: StarSystem = {
      ...system,
      assignedShips: [],
    };

    this.systems.set(system.id, newSystem);
    return newSystem;
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

    // Update the ship
    this.shipManager.updateShipStatus(shipId, 'assigned');
    this.shipManager.updateShipAssignment(shipId, systemId);

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
    if (criteria.name && !system.name.includes(criteria.name)) {
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

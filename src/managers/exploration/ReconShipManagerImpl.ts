/**
 * @file ReconShipManagerImpl.ts
 * Implementation of the ReconShipManager for exploration ships.
 *
 * This file provides a basic implementation of ship management
 * functionality used by the ExplorationManager.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Position } from '../../types/core/GameTypes';

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
  position?: Position;
  capabilities?: {
    canScan: boolean;
    canSalvage: boolean;
    canMine: boolean;
    canJump: boolean;
  };
  stealth?: {
    active: boolean;
    level: number;
    cooldown: number;
  };
  sensors?: {
    range: number;
    accuracy: number;
    anomalyDetection: number;
  };
  discoveries?: {
    mappedSectors: number;
    anomaliesFound: number;
    resourcesLocated: number;
  };
  [key: string]: unknown;
}

export interface ExplorationTask {
  id: string;
  type: 'explore' | 'investigate' | 'evade';
  target: {
    id: string;
    position: Position;
  };
  priority: number;
  assignedAt: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  status: 'queued' | 'in-progress' | 'completed' | 'failed';
  progress?: number;
  threatLevel?: number;
}

export type ShipEvent = {
  shipId: string;
  task?: ExplorationTask;
  progress?: number;
};

export type EventCallback = (event: ShipEvent) => void;

/**
 * Implementation of the ship manager for exploration ships
 */
export class ReconShipManagerImpl extends EventEmitter {
  private ships: Map<string, Ship> = new Map();
  private tasks: Map<string, ExplorationTask> = new Map();
  private lastUpdate: number = Date.now();

  /**
   * Create a new ReconShipManagerImpl
   */
  constructor() {
    super();
    this.ships = new Map();
    this.tasks = new Map();

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
    this.emit('shipRegistered', { shipId: ship.id });
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

  public registerShip(ship: Ship): void {
    this.ships.set(ship.id, ship);
    this.emit('shipRegistered', { shipId: ship.id });
  }

  public unregisterShip(shipId: string): void {
    this.ships.delete(shipId);
    this.emit('shipUnregistered', { shipId });
  }

  public assignExplorationTask(
    shipId: string,
    sectorId: string,
    position: Position,
    specialization: 'mapping' | 'anomaly' | 'resource'
  ): void {
    const task: ExplorationTask = {
      id: uuidv4(),
      type: 'explore',
      target: {
        id: sectorId,
        position,
      },
      priority: 1,
      assignedAt: Date.now(),
      specialization,
      status: 'queued',
    };

    this.tasks.set(task.id, task);
    this.emit('taskAssigned', { shipId, task });
  }

  public update(deltaTime: number): void {
    const now = Date.now();
    const dt = now - this.lastUpdate;
    this.lastUpdate = now;

    // Update all active tasks
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'in-progress') {
        // Simulate task progress
        const progress = (task.progress || 0) + (deltaTime / 1000) * 0.1; // 10% per second
        if (progress >= 1) {
          task.status = 'completed';
          this.emit('taskCompleted', { shipId: taskId, task });
          this.tasks.delete(taskId);
        } else {
          task.progress = progress;
          this.emit('taskProgress', { shipId: taskId, task, progress });
        }
      }
    }
  }

  public on(event: string, listener: EventCallback): this {
    return super.on(event, listener);
  }

  public off(event: string, listener: EventCallback): this {
    return super.off(event, listener);
  }
}

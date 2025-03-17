/**
 * @file ReconShipManagerImpl.ts
 * Implementation of the ReconShipManager for exploration ships.
 *
 * This file provides a basic implementation of ship management
 * functionality used by the ExplorationManager.
 */

import { v4 as uuidv4 } from 'uuid';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';

/**
 * Interface for exploration ship data
 */
export interface Ship {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'assigned' | 'scanning' | 'returning';
  assignedSectorId?: string;
  position?: { x: number; y: number };
  sensorRange?: number;
  speed?: number;
  efficiency?: number;
  sectorId?: string;
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

export interface ShipEvent extends BaseEvent {
  type: EventType;
  moduleId: string;
  moduleType: ModuleType;
  data: ShipEventData;
}

export interface ShipEventData extends Record<string, unknown> {
  shipId: string;
  ship?: Ship;
  sectorId?: string;
  status?: Ship['status'];
  position?: { x: number; y: number };
}

/**
 * Type guard for ShipEvent
 */
export function isShipEvent(event: unknown): event is ShipEvent {
  if (!event || typeof event !== 'object') return false;
  const e = event as ShipEvent;
  return (
    'type' in e &&
    'moduleId' in e &&
    'moduleType' in e &&
    'data' in e &&
    typeof e.type === 'string' &&
    typeof e.moduleId === 'string' &&
    typeof e.moduleType === 'string' &&
    typeof e.data === 'object' &&
    'shipId' in e.data &&
    typeof e.data.shipId === 'string'
  );
}

/**
 * Implementation of the ship manager for exploration ships
 */
export class ReconShipManagerImpl extends AbstractBaseManager<ShipEvent> {
  private ships: Map<string, Ship> = new Map();
  private tasks: Map<string, ExplorationTask> = new Map();

  constructor() {
    super('ReconShipManager');
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
    this.publish({
      type: EventType.EXPLORATION_SHIP_REGISTERED,
      moduleId: ship.id,
      moduleType: 'ship' as ModuleType,
      timestamp: Date.now(),
      data: { shipId: ship.id, ship },
    });
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
  public updateShipStatus(shipId: string, status: Ship['status']): void {
    const ship = this.ships.get(shipId);
    if (!ship) return;

    ship.status = status;
    this.ships.set(shipId, ship);

    this.publish({
      type: EventType.STATUS_CHANGED,
      moduleId: shipId,
      moduleType: 'ship' as ModuleType,
      timestamp: Date.now(),
      data: { shipId, status, ship },
    });
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

    ship.assignedSectorId = sectorId || undefined;
    ship.status = 'scanning';
    this.ships.set(shipId, ship);

    this.publish({
      type: EventType.MODULE_UPDATED,
      moduleId: shipId,
      moduleType: 'ship' as ModuleType,
      timestamp: Date.now(),
      data: { shipId, sectorId, ship },
    });
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

    delete ship.assignedSectorId;
    ship.status = 'idle';
    this.ships.set(shipId, ship);

    this.publish({
      type: EventType.MODULE_UPDATED,
      moduleId: shipId,
      moduleType: 'ship' as ModuleType,
      timestamp: Date.now(),
      data: { shipId, ship },
    });
    return true;
  }

  public registerShip(ship: Ship): void {
    this.ships.set(ship.id, ship);
    this.publish({
      type: EventType.EXPLORATION_SHIP_REGISTERED,
      moduleId: ship.id,
      moduleType: 'ship' as ModuleType,
      timestamp: Date.now(),
      data: { shipId: ship.id, ship },
    });
  }

  public unregisterShip(shipId: string): void {
    this.ships.delete(shipId);
    this.publish({
      type: EventType.EXPLORATION_SHIP_UNREGISTERED,
      moduleId: shipId,
      moduleType: 'ship' as ModuleType,
      timestamp: Date.now(),
      data: { shipId },
    });
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
    this.publish({
      type: EventType.EXPLORATION_TASK_ASSIGNED,
      moduleId: task.id,
      moduleType: 'task' as ModuleType,
      timestamp: Date.now(),
      data: { shipId, task },
    });
  }

  public update(deltaTime: number): void {
    // Update all active tasks
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'in-progress') {
        // Simulate task progress
        const progress = (task.progress || 0) + (deltaTime / 1000) * 0.1; // 10% per second
        if (progress >= 1) {
          task.status = 'completed';
          this.publish({
            type: EventType.EXPLORATION_TASK_COMPLETED,
            moduleId: taskId,
            moduleType: 'task' as ModuleType,
            timestamp: Date.now(),
            data: { shipId: taskId, task },
          });
          this.tasks.delete(taskId);
        } else {
          task.progress = progress;
          this.publish({
            type: EventType.EXPLORATION_TASK_PROGRESS,
            moduleId: taskId,
            moduleType: 'task' as ModuleType,
            timestamp: Date.now(),
            data: { shipId: taskId, task, progress },
          });
        }
      }
    }
  }

  public updateShipPosition(shipId: string, position: { x: number; y: number }): void {
    const ship = this.ships.get(shipId);
    if (!ship) return;

    ship.position = position;
    this.ships.set(shipId, ship);

    this.publish({
      type: EventType.EXPLORATION_POSITION_UPDATED,
      moduleId: shipId,
      moduleType: 'ship' as ModuleType,
      timestamp: Date.now(),
      data: { shipId, position, ship },
    });
  }

  protected async onInitialize(_dependencies?: unknown): Promise<void> {
    console.warn('ReconShipManager initialized');
  }

  protected onUpdate(_deltaTime: number): void {
    // Update ship states if needed
  }

  protected async onDispose(): Promise<void> {
    this.ships.clear();
    this.tasks.clear();
  }

  protected getVersion(): string {
    return '1.0.0';
  }

  protected getStats(): Record<string, number | string> {
    return {
      totalShips: this.ships.size,
      idleShips: Array.from(this.ships.values()).filter(s => s.status === 'idle').length,
      assignedShips: Array.from(this.ships.values()).filter(s => s.status === 'assigned').length,
      scanningShips: Array.from(this.ships.values()).filter(s => s.status === 'scanning').length,
      returningShips: Array.from(this.ships.values()).filter(s => s.status === 'returning').length,
    };
  }
}

/**
 * @file ReconShipManagerImpl.ts
 * Implementation of the ReconShipManager for exploration ships.
 *
 * This file provides a basic implementation of ship management
 * functionality used by the ExplorationManager.
 */

import { v4 as uuidv4 } from 'uuid';
import { TypedEventEmitter } from '../../lib/events/EventEmitter';
import { Position } from '../../types/core/GameTypes';
import { ExplorationTask } from '../../types/exploration/ExplorationTypes';
import { ReconShip, ShipCategory, ShipStatus } from '../../types/ships/ShipTypes';

/**
 * Define Event Map for this manager - data types for TypedEventEmitter
 */
export interface ReconShipManagerEvents {
  EXPLORATION_SHIP_REGISTERED: { shipId: string; ship: ReconShip };
  EXPLORATION_SHIP_UNREGISTERED: { shipId: string };
  STATUS_CHANGED: { shipId: string; status: ShipStatus; ship: ReconShip };
  MODULE_UPDATED: { shipId: string; sectorId?: string; ship: ReconShip };
  EXPLORATION_TASK_ASSIGNED: { shipId: string; task: ExplorationTask };
  EXPLORATION_TASK_COMPLETED: { shipId: string; task: ExplorationTask };
  EXPLORATION_TASK_PROGRESS: { shipId: string; task: ExplorationTask; progress: number };
  EXPLORATION_POSITION_UPDATED: {
    shipId: string;
    position: Position;
    ship: ReconShip;
  };
  [key: string]: unknown; // Index signature for TypedEventEmitter compatibility
}

/**
 * Implementation of the ship manager for exploration ships
 */
export class ReconShipManagerImpl extends TypedEventEmitter<ReconShipManagerEvents> {
  private ships = new Map<string, ReconShip>();
  private tasks = new Map<string, ExplorationTask>();

  constructor() {
    super();
    this.ships = new Map<string, ReconShip>();
    this.tasks = new Map<string, ExplorationTask>();
  }

  /**
   * Get a ship by its ID
   * @param shipId The ID of the ship to get
   * @returns The ship or undefined if not found
   */
  public getShipById(shipId: string): ReconShip | undefined {
    return this.ships.get(shipId);
  }

  /**
   * Get all ships
   * @returns All ships
   */
  public getAllShips(): ReconShip[] {
    return Array.from(this.ships.values());
  }

  /**
   * Get ships by status
   * @param status The status to filter by
   * @returns Ships with the given status
   */
  public getShipsByStatus(status: ShipStatus): ReconShip[] {
    return Array.from(this.ships.values()).filter(ship => ship.status === status);
  }

  /**
   * Update a ship's status
   * @param shipId The ID of the ship to update
   * @param status The new status
   * @returns True if the ship was updated, false otherwise
   */
  public updateShipStatus(shipId: string, status: ShipStatus): void {
    const ship = this.ships.get(shipId);
    if (!ship) return;
    ship.status = status;
    const payload = {
      shipId,
      status,
      ship,
    };
    this.emit('STATUS_CHANGED', payload);
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
    ship.status = ShipStatus.SCANNING;
    const payload = {
      shipId,
      sectorId,
      ship,
    };
    this.emit('MODULE_UPDATED', payload);
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
    ship.status = ShipStatus.IDLE;
    const payload = {
      shipId,
      ship,
    };
    this.emit('MODULE_UPDATED', payload);
    return true;
  }

  public registerShip(ship: ReconShip): void {
    if (ship.category !== ShipCategory.RECON) {
      // console.warn(
      //   `Attempted to register non-recon ship (${ship.name}, ${ship.category}) with ReconShipManager.`
      // );
      return;
    }
    this.ships.set(ship.id, ship);
    const payload = {
      shipId: ship.id,
      ship,
    };
    this.emit('EXPLORATION_SHIP_REGISTERED', payload);
  }

  public unregisterShip(shipId: string): void {
    const ship = this.ships.get(shipId);
    if (ship) {
      this.ships.delete(shipId);
      const payload = {
        shipId,
      };
      this.emit('EXPLORATION_SHIP_UNREGISTERED', payload);
    }
  }

  public assignExplorationTask(
    shipId: string,
    sectorId: string,
    position: Position,
    specialization: 'mapping' | 'anomaly' | 'resource'
  ): void {
    const ship = this.getShipById(shipId);
    if (!ship || ship.status !== ShipStatus.IDLE) {
      // console.warn(`Cannot assign task: Ship ${shipId} not found or not idle.`);
      return;
    }
    const task: ExplorationTask = {
      id: uuidv4(),
      type: 'explore',
      target: { id: sectorId, position },
      priority: 1,
      assignedAt: Date.now(),
      specialization,
      status: 'queued',
      assignedShipId: shipId,
    };
    this.tasks.set(task.id, task);
    ship.status = ShipStatus.READY;
    const taskPayload = {
      shipId: ship.id,
      task,
    };
    this.emit('EXPLORATION_TASK_ASSIGNED', taskPayload);
    const statusPayload = {
      shipId,
      status: ship.status,
      ship,
    };
    this.emit('STATUS_CHANGED', statusPayload);
  }

  public update(deltaTime: number): void {
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'in-progress') {
        const ship = this.ships.get(task.assignedShipId);
        const efficiencyFactor = ship?.details?.efficiency ?? 1;
        const progressIncrement = (deltaTime / 1000) * 0.1 * efficiencyFactor;
        task.progress = (task.progress ?? 0) + progressIncrement;

        if (task.progress >= 1) {
          task.status = 'completed';
          const completedShip = this.ships.get(task.assignedShipId);
          if (completedShip) {
            completedShip.status = ShipStatus.RETURNING;
            const statusPayload = {
              shipId: completedShip.id,
              status: completedShip.status,
              ship: completedShip,
            };
            this.emit('STATUS_CHANGED', statusPayload);
          }
          const taskPayload = {
            shipId: task.assignedShipId,
            task,
          };
          this.emit('EXPLORATION_TASK_COMPLETED', taskPayload);
          this.tasks.delete(taskId);
        } else {
          const progressShip = this.ships.get(task.assignedShipId);
          if (progressShip) {
            const progressPayload = {
              shipId: task.assignedShipId,
              task,
              progress: task.progress,
            };
            this.emit('EXPLORATION_TASK_PROGRESS', progressPayload);
          }
        }
      } else if (task.status === 'queued') {
        const assignedShip = this.ships.get(task.assignedShipId);
        if (assignedShip && assignedShip.status === ShipStatus.READY) {
          task.status = 'in-progress';
          assignedShip.status = ShipStatus.SCANNING;
          const statusPayload = {
            shipId: assignedShip.id,
            status: assignedShip.status,
            ship: assignedShip,
          };
          this.emit('STATUS_CHANGED', statusPayload);
        }
      }
    }
  }

  public updateShipPosition(shipId: string, position: Position): void {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return;
    }
    ship.position = position;
    const payload = {
      shipId,
      position,
      ship,
    };
    this.emit('EXPLORATION_POSITION_UPDATED', payload);
  }

  public dispose(): void {
    this.ships.clear();
    this.tasks.clear();
    this.removeAllListeners();
    // console.warn('ReconShipManager disposed - Listener cleanup via removeAllListeners()');
  }

  public getVersion(): string {
    return '1.1.1';
  }

  public getStats(): Record<string, number | string> {
    // console.warn('getStats called but not fully implemented.');
    return {
      totalShips: this.ships.size,
      idleShips: this.getShipsByStatus(ShipStatus.IDLE).length,
      assignedShips: this.getShipsByStatus(ShipStatus.READY).length,
      scanningShips: this.getShipsByStatus(ShipStatus.SCANNING).length,
      returningShips: this.getShipsByStatus(ShipStatus.RETURNING).length,
      totalTasks: this.tasks.size,
      queuedTasks: Array.from(this.tasks.values()).filter(t => t.status === 'queued').length,
      inProgressTasks: Array.from(this.tasks.values()).filter(t => t.status === 'in-progress')
        .length,
    };
  }
}

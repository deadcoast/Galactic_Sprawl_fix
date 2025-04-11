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
import { ReconShip, ShipCategory, UnifiedShipStatus } from '../../types/ships/UnifiedShipTypes';

/**
 * Define Event Map for this manager using string literals
 * Added index signature
 */
interface ReconShipManagerEvents {
  EXPLORATION_SHIP_REGISTERED: (payload: { shipId: string; ship: ReconShip }) => void;
  EXPLORATION_SHIP_UNREGISTERED: (payload: { shipId: string }) => void;
  STATUS_CHANGED: (payload: { shipId: string; status: UnifiedShipStatus; ship: ReconShip }) => void;
  MODULE_UPDATED: (payload: { shipId: string; sectorId?: string; ship: ReconShip }) => void;
  EXPLORATION_TASK_ASSIGNED: (payload: { shipId: string; task: any }) => void; // TODO: Type task
  EXPLORATION_TASK_COMPLETED: (payload: { shipId: string; task: any }) => void; // TODO: Type task
  EXPLORATION_TASK_PROGRESS: (payload: { shipId: string; task: any; progress: number }) => void; // TODO: Type task
  EXPLORATION_POSITION_UPDATED: (payload: {
    shipId: string;
    position: Position;
    ship: ReconShip;
  }) => void;
  [key: string]: (...args: any[]) => any; // Added index signature
}

/**
 * Implementation of the ship manager for exploration ships
 */
export class ReconShipManagerImpl extends TypedEventEmitter<ReconShipManagerEvents> {
  private ships: Map<string, ReconShip> = new Map();
  private tasks: Map<string, any> = new Map(); // TODO: Define ExplorationTask type properly

  constructor() {
    super();
    this.ships = new Map();
    this.tasks = new Map();
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
  public getShipsByStatus(status: UnifiedShipStatus): ReconShip[] {
    return Array.from(this.ships.values()).filter(ship => ship.status === status);
  }

  /**
   * Update a ship's status
   * @param shipId The ID of the ship to update
   * @param status The new status
   * @returns True if the ship was updated, false otherwise
   */
  public updateShipStatus(shipId: string, status: UnifiedShipStatus): void {
    const ship = this.ships.get(shipId);
    if (!ship) return;
    ship.status = status;
    const payload: { shipId: string; status: UnifiedShipStatus; ship: ReconShip } = {
      shipId,
      status,
      ship,
    };
    this.emit('STATUS_CHANGED', payload as any);
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
    ship.status = UnifiedShipStatus.SCANNING;
    const payload: { shipId: string; sectorId?: string; ship: ReconShip } = {
      shipId,
      sectorId,
      ship,
    };
    this.emit('MODULE_UPDATED', payload as any);
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
    ship.status = UnifiedShipStatus.IDLE;
    const payload: { shipId: string; sectorId?: string; ship: ReconShip } = {
      shipId,
      ship,
    };
    this.emit('MODULE_UPDATED', payload as any);
    return true;
  }

  public registerShip(ship: ReconShip): void {
    if (ship.category !== ShipCategory.RECON) {
      console.warn(
        `Attempted to register non-recon ship (${ship.name}, ${ship.category}) with ReconShipManager.`
      );
      return;
    }
    this.ships.set(ship.id, ship);
    const payload: { shipId: string; ship: ReconShip } = { shipId: ship.id, ship };
    this.emit('EXPLORATION_SHIP_REGISTERED', payload as any);
  }

  public unregisterShip(shipId: string): void {
    const ship = this.ships.get(shipId);
    if (ship) {
      this.ships.delete(shipId);
      const payload: { shipId: string } = { shipId };
      this.emit('EXPLORATION_SHIP_UNREGISTERED', payload as any);
    }
  }

  public assignExplorationTask(
    shipId: string,
    sectorId: string,
    position: Position,
    specialization: 'mapping' | 'anomaly' | 'resource'
  ): void {
    const ship = this.getShipById(shipId);
    if (!ship || ship.status !== UnifiedShipStatus.IDLE) {
      console.warn(`Cannot assign task: Ship ${shipId} not found or not idle.`);
      return;
    }
    const task: any = {
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
    ship.status = UnifiedShipStatus.READY;
    const taskPayload: { shipId: string; task: any } = { shipId: task.id, task };
    this.emit('EXPLORATION_TASK_ASSIGNED', taskPayload as any);
    const statusPayload: { shipId: string; status: UnifiedShipStatus; ship: ReconShip } = {
      shipId,
      status: ship.status,
      ship,
    };
    this.emit('STATUS_CHANGED', statusPayload as any);
  }

  public update(deltaTime: number): void {
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'in-progress') {
        const ship = this.ships.get(task.assignedShipId);
        const efficiencyFactor = ship?.stats?.efficiency ?? 1;
        const progressIncrement = (deltaTime / 1000) * 0.1 * efficiencyFactor;
        const progress = (task.progress ?? 0) + progressIncrement;

        if (progress >= 1) {
          task.status = 'completed';
          const completedShip = this.ships.get(task.assignedShipId);
          if (completedShip) {
            completedShip.status = UnifiedShipStatus.RETURNING;
            const statusPayload: { shipId: string; status: UnifiedShipStatus; ship: ReconShip } = {
              shipId: completedShip.id,
              status: completedShip.status,
              ship: completedShip,
            };
            this.emit('STATUS_CHANGED', statusPayload as any);
          }
          const taskPayload: { shipId: string; task: any } = { shipId: taskId, task };
          this.emit('EXPLORATION_TASK_COMPLETED', taskPayload as any);
          this.tasks.delete(taskId);
        } else {
          task.progress = progress;
          const progressPayload: { shipId: string; task: any; progress: number } = {
            shipId: taskId,
            task,
            progress,
          };
          this.emit('EXPLORATION_TASK_PROGRESS', progressPayload as any);
        }
      } else if (task.status === 'queued') {
        const assignedShip = this.ships.get(task.assignedShipId);
        if (assignedShip && assignedShip.status === UnifiedShipStatus.READY) {
          task.status = 'in-progress';
          assignedShip.status = UnifiedShipStatus.SCANNING;
          const statusPayload: { shipId: string; status: UnifiedShipStatus; ship: ReconShip } = {
            shipId: assignedShip.id,
            status: assignedShip.status,
            ship: assignedShip,
          };
          this.emit('STATUS_CHANGED', statusPayload as any);
        }
      }
    }
  }

  public updateShipPosition(shipId: string, position: Position): void {
    const ship = this.ships.get(shipId);
    if (!ship) return;
    ship.position = position;
    const payload: { shipId: string; position: Position; ship: ReconShip } = {
      shipId,
      position,
      ship,
    };
    this.emit('EXPLORATION_POSITION_UPDATED', payload as any);
  }

  public dispose(): void {
    this.ships.clear();
    this.tasks.clear();
    this.removeAllListeners();
    console.warn('ReconShipManager disposed - Listener cleanup via removeAllListeners()');
  }

  public getVersion(): string {
    return '1.1.1';
  }

  public getStats(): Record<string, number | string> {
    return {
      totalShips: this.ships.size,
      idleShips: this.getShipsByStatus(UnifiedShipStatus.IDLE).length,
      assignedShips: this.getShipsByStatus(UnifiedShipStatus.READY).length,
      scanningShips: this.getShipsByStatus(UnifiedShipStatus.SCANNING).length,
      returningShips: this.getShipsByStatus(UnifiedShipStatus.RETURNING).length,
      totalTasks: this.tasks.size,
      queuedTasks: Array.from(this.tasks.values()).filter(t => t.status === 'queued').length,
      inProgressTasks: Array.from(this.tasks.values()).filter(t => t.status === 'in-progress')
        .length,
    };
  }
}

import { EventEmitter } from '../../lib/events/EventEmitter';
import { techTreeManager } from '../../managers/game/techTreeManager';
import { Salvage } from '../../types/combat/SalvageTypes';
import {
  CommonShipCapabilities,
  getDefaultCapabilities,
  getShipCategory,
  ShipCategory,
  type ShipType,
} from '../../types/ships/CommonShipTypes';

interface Position {
  x: number;
  y: number;
}

interface ShipWithPosition extends ShipType {
  id: string;
  position: Position;
  category: ShipCategory;
  capabilities: CommonShipCapabilities;
  stats: {
    health: number;
    shield: number;
    speed: number;
    maneuverability: number;
    cargo: number;
  };
}

interface ShipTask {
  id: string;
  type: 'salvage' | 'combat' | 'patrol' | 'mine';
  target?: {
    id: string;
    position: Position;
  };
  priority: number;
  assignedAt: number;
}

interface ShipBehaviorEvents {
  type: string;
  data: {
    taskAssigned?: { shipId: string; taskId: string; taskType: string };
    taskCompleted?: { shipId: string; taskId: string; success: boolean };
    shipAdded?: { shipId: string; category: ShipCategory };
    shipRemoved?: { shipId: string };
  };
}

class ShipBehaviorManagerImpl extends EventEmitter<ShipBehaviorEvents> {
  private tasks: Map<string, ShipTask> = new Map();
  private ships: Map<string, ShipWithPosition> = new Map();
  private salvageTargets: Map<string, string> = new Map(); // salvageId -> shipId

  constructor() {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('salvageGenerated', ((event: CustomEvent) => {
      const { items, position } = event.detail;
      this.handleNewSalvage(items, position);
    }) as EventListener);
  }

  private handleNewSalvage(items: Salvage[], position: Position): void {
    // Find nearby ships that can salvage
    const nearbyShips = Array.from(this.ships.values())
      .filter(ship => {
        // Calculate distance
        const distance = Math.sqrt(
          Math.pow(ship.position.x - position.x, 2) + Math.pow(ship.position.y - position.y, 2)
        );

        // Check if ship can salvage
        const category = getShipCategory(ship.type);
        const capabilities = getDefaultCapabilities(category);

        // War ships can salvage if they have the cutting laser
        if (category === 'war' && techTreeManager.hasWarShipSalvage()) {
          capabilities.canSalvage = true;
        }

        return capabilities.canSalvage && distance < 1000; // 1000 units range
      })
      .sort((a, b) => {
        // Sort by distance
        const distA = Math.sqrt(
          Math.pow(a.position.x - position.x, 2) + Math.pow(a.position.y - position.y, 2)
        );
        const distB = Math.sqrt(
          Math.pow(b.position.x - position.x, 2) + Math.pow(b.position.y - position.y, 2)
        );
        return distA - distB;
      });

    // Assign salvage tasks to nearby ships
    items.forEach(salvage => {
      const ship = nearbyShips[0]; // Get closest ship
      if (ship) {
        this.assignSalvageTask(ship.id!, salvage.id, position);
        this.salvageTargets.set(salvage.id, ship.id!);
      }
    });
  }

  public assignTask(task: ShipTask): void {
    if (!task.target) {
      return;
    }

    this.tasks.set(task.id, task);
    this.emit({
      type: 'taskAssigned',
      data: {
        taskAssigned: {
          shipId: task.id,
          taskId: task.id,
          taskType: task.type,
        },
      },
    });
  }

  public assignSalvageTask(shipId: string, salvageId: string, position: Position): void {
    const task: ShipTask = {
      id: `salvage-${salvageId}`,
      type: 'salvage',
      target: {
        id: salvageId,
        position,
      },
      priority: 2, // Medium priority
      assignedAt: Date.now(),
    };

    this.tasks.set(shipId, task);
    this.emit({
      type: 'taskAssigned',
      data: {
        taskAssigned: {
          shipId,
          taskId: task.id,
          taskType: task.type,
        },
      },
    });
  }

  public registerShip(ship: ShipWithPosition): void {
    if (!ship.id) {
      return;
    }
    this.ships.set(ship.id, ship);
  }

  public unregisterShip(shipId: string): void {
    this.ships.delete(shipId);
    this.tasks.delete(shipId);
  }

  public getShipTask(shipId: string): ShipTask | undefined {
    return this.tasks.get(shipId);
  }

  public completeTask(shipId: string): void {
    const task = this.tasks.get(shipId);
    if (task) {
      if (task.type === 'salvage' && task.target) {
        this.salvageTargets.delete(task.target.id);
      }
      this.tasks.delete(shipId);
      this.emit({
        type: 'taskCompleted',
        data: {
          taskCompleted: {
            shipId,
            taskId: task.id,
            success: true,
          },
        },
      });
    }
  }

  public isSalvageTargeted(salvageId: string): boolean {
    return this.salvageTargets.has(salvageId);
  }

  public getTargetingShip(salvageId: string): string | undefined {
    return this.salvageTargets.get(salvageId);
  }
}

export const shipBehaviorManager = new ShipBehaviorManagerImpl();

import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { EventEmitter } from '../../lib/utils/EventEmitter';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";
import { CommonShipCapabilities } from '../../types/ships/CommonShipTypes';
import { ResourceManager } from '../game/ResourceManager';

// Create an instance of ResourceManager
const resourceManager = new ResourceManager();

interface MiningShip {
  id: string;
  name: string;
  type: 'rockBreaker' | 'voidDredger';
  status: 'idle' | 'mining' | 'returning' | 'maintenance';
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
  position: Position;
  capabilities: CommonShipCapabilities;
  techBonuses?: {
    extractionRate: number;
    efficiency: number;
  };
}

interface MiningTask {
  id: string;
  type: 'mine';
  target: {
    id: string;
    position: Position;
  };
  priority: number;
  assignedAt: number;
  resourceType: ResourceType;
  thresholds: {
    min: number;
    max: number;
  };
}

export class MiningShipManagerImpl extends EventEmitter {
  private ships: Map<string, MiningShip> = new Map();
  private tasks: Map<string, MiningTask> = new Map();
  private resourceNodes: Map<
    string,
    {
      id: string;
      type: ResourceType;
      position: Position;
      thresholds: { min: number; max: number };
    }
  > = new Map();

  public registerShip(ship: MiningShip): void {
    if (ship.capabilities.canMine) {
      this.ships.set(ship.id, ship);

      // Emit both internal and module events
      this.emit('shipRegistered', { shipId: ship.id });
      moduleEventBus.emit({
        type: 'MODULE_ACTIVATED',
        moduleId: ship.id,
        moduleType: 'mineral' as ModuleType,
        timestamp: Date.now(),
        data: { ship },
      });
    }
  }

  public unregisterShip(shipId: string): void {
    if (this.ships.has(shipId)) {
      this.ships.delete(shipId);
      this.tasks.delete(shipId);

      // Emit both internal and module events
      this.emit('shipUnregistered', { shipId });
      moduleEventBus.emit({
        type: 'MODULE_DEACTIVATED',
        moduleId: shipId,
        moduleType: 'mineral' as ModuleType,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Register a resource node that can be mined by ships
   * @param id - Unique identifier for the resource node
   * @param type - Type of resource at this node
   * @param position - Position of the resource node
   * @param thresholds - Min/max thresholds for resource extraction
   */
  public registerResourceNode(
    id: string,
    type: ResourceType,
    position: Position,
    thresholds: { min: number; max: number }
  ): void {
    this.resourceNodes.set(id, {
      id,
      type,
      position,
      thresholds,
    });

    console.warn(`[MiningShipManager] Registered resource node ${id} of type ${type}`);
  }

  /**
   * Unregister a resource node
   * @param id - Unique identifier for the resource node to unregister
   */
  public unregisterResourceNode(id: string): void {
    if (this.resourceNodes.has(id)) {
      this.resourceNodes.delete(id);
      console.warn(`[MiningShipManager] Unregistered resource node ${id}`);

      // Unassign any ships that were targeting this node
      this.ships.forEach((ship, shipId) => {
        if (ship.targetNode === id) {
          this.updateShipStatus(shipId, 'idle');
          ship.targetNode = undefined;
          console.warn(`[MiningShipManager] Unassigned ship ${shipId} from deleted node ${id}`);
        }
      });
    }
  }

  /**
   * Get all registered resource nodes
   * @returns Array of resource nodes
   */
  public getResourceNodes(): Array<{
    id: string;
    type: ResourceType;
    position: Position;
    thresholds: { min: number; max: number };
  }> {
    return Array.from(this.resourceNodes.values());
  }

  public assignMiningTask(
    shipId: string,
    resourceId: string,
    position: Position,
    resourceType: ResourceType,
    thresholds: { min: number; max: number }
  ): void {
    const ship = this.ships.get(shipId);
    if (!ship) {
      console.warn(`[MiningShipManager] Cannot assign task: Ship ${shipId} not found`);
      return;
    }

    // Check if the resource node is registered
    if (!this.resourceNodes.has(resourceId)) {
      // Auto-register the resource node if it doesn't exist
      this.registerResourceNode(resourceId, resourceType, position, thresholds);
      console.warn(
        `[MiningShipManager] Auto-registered resource node ${resourceId} during task assignment`
      );
    }

    const taskId = `mining-task-${shipId}-${Date.now()}`;
    const task: MiningTask = {
      id: taskId,
      type: 'mine',
      target: {
        id: resourceId,
        position,
      },
      priority: this.getPriorityForResourceType(resourceType),
      assignedAt: Date.now(),
      resourceType,
      thresholds,
    };

    this.tasks.set(shipId, task);
    this.updateShipStatus(shipId, 'mining');

    // Emit task events
    this.emit('taskAssigned', { shipId, task });
    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED',
      moduleId: shipId,
      moduleType: 'mineral' as ModuleType,
      timestamp: Date.now(),
      data: { task },
    });
  }

  public completeTask(shipId: string): void {
    const task = this.tasks.get(shipId);
    const ship = this.ships.get(shipId);

    if (task && ship) {
      // Transfer resources
      if (ship.currentLoad > 0) {
        resourceManager.transferResources(
          task.resourceType,
          ship.currentLoad,
          shipId,
          'mineral-processing-centre'
        );
        ship.currentLoad = 0;
      }

      this.tasks.delete(shipId);
      this.updateShipStatus(shipId, 'returning');

      // Emit completion events
      this.emit('taskCompleted', { shipId, task });
      moduleEventBus.emit({
        type: 'AUTOMATION_CYCLE_COMPLETE',
        moduleId: shipId,
        moduleType: 'mineral' as ModuleType,
        timestamp: Date.now(),
        data: { task },
      });
    }
  }

  public updateShipTechBonuses(
    shipId: string,
    bonuses: { extractionRate: number; efficiency: number }
  ): void {
    const ship = this.ships.get(shipId);
    if (ship) {
      ship.techBonuses = bonuses;
      this.emit('techBonusesUpdated', { shipId, bonuses });
    }
  }

  private updateShipStatus(
    shipId: string,
    status: 'idle' | 'mining' | 'returning' | 'maintenance'
  ): void {
    const ship = this.ships.get(shipId);
    if (ship) {
      ship.status = status;

      // Emit status events
      this.emit('shipStatusUpdated', { shipId, status });
      moduleEventBus.emit({
        type: 'STATUS_CHANGED',
        moduleId: shipId,
        moduleType: 'mineral' as ModuleType,
        timestamp: Date.now(),
        data: { status },
      });
    }
  }

  private getPriorityForResourceType(type: ResourceType): number {
    // Assign priority based on resource type
    switch (type) {
      case ResourceType.MINERALS:
        return 1;
      case ResourceType.IRON:
        return 2;
      case ResourceType.COPPER:
        return 3;
      case ResourceType.TITANIUM:
        return 4;
      case ResourceType.URANIUM:
        return 5;
      case ResourceType.EXOTIC:
        return 6;
      case ResourceType.EXOTIC_MATTER:
        return 7;
      case ResourceType.DARK_MATTER:
        return 8;
      default:
        return 0;
    }
  }

  public getShipEfficiency(shipId: string): number {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return 0;
    }

    // Base efficiency plus any tech bonuses
    let efficiency = ship.efficiency;
    if (ship.techBonuses) {
      efficiency *= ship.techBonuses.efficiency;
    }

    return Math.min(1, efficiency);
  }
}

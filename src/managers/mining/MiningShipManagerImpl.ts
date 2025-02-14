import { EventEmitter } from '../../lib/utils/EventEmitter';
import { CommonShipCapabilities } from '../../types/ships/CommonShipTypes';
import { Position } from '../../types/core/GameTypes';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { resourceManager } from '../game/ResourceManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';

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

  public assignMiningTask(
    shipId: string,
    resourceId: string,
    position: Position,
    resourceType: ResourceType,
    thresholds: { min: number; max: number }
  ): void {
    const ship = this.ships.get(shipId);
    if (!ship || !ship.capabilities.canMine) {
      return;
    }

    const task: MiningTask = {
      id: `mine-${resourceId}`,
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
    switch (type) {
      case 'exotic':
        return 3;
      case 'gas':
        return 2;
      case 'minerals':
        return 1;
      default:
        return 0;
    }
  }

  // Add method to get ship efficiency with tech bonuses
  public getShipEfficiency(shipId: string): number {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return 0;
    }

    const baseEfficiency = ship.efficiency;
    const techBonus = ship.techBonuses?.efficiency || 1;

    return baseEfficiency * techBonus;
  }
}

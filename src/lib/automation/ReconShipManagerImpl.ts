import { EventEmitter } from '../utils/EventEmitter';
import { CommonShipCapabilities } from '../../types/ships/CommonShipTypes';
import { Position } from '../../types/core/GameTypes';
import { moduleEventBus } from '../modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { combatManager } from '../combat/combatManager';

interface ReconShip {
  id: string;
  name: string;
  type: 'AC27G' | 'PathFinder' | 'VoidSeeker';
  status: 'idle' | 'scanning' | 'investigating' | 'returning';
  targetSector?: string;
  experience: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  efficiency: number;
  position: Position;
  capabilities: CommonShipCapabilities;
  stealth: {
    active: boolean;
    level: number;
    cooldown: number;
  };
  sensors: {
    range: number;
    accuracy: number;
    anomalyDetection: number;
  };
  discoveries: {
    mappedSectors: number;
    anomaliesFound: number;
    resourcesLocated: number;
  };
  techBonuses?: {
    scanSpeed: number;
    stealthEfficiency: number;
    detectionRange: number;
  };
}

interface ExplorationTask {
  id: string;
  type: 'explore';
  target: {
    id: string;
    position: Position;
  };
  priority: number;
  assignedAt: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  status: 'queued' | 'in-progress' | 'completed' | 'failed';
}

export class ReconShipManagerImpl extends EventEmitter {
  private ships: Map<string, ReconShip> = new Map();
  private tasks: Map<string, ExplorationTask> = new Map();
  private sectors: Map<
    string,
    {
      id: string;
      position: Position;
      explored: boolean;
      anomalies: number;
      resources: number;
    }
  > = new Map();

  public registerShip(ship: ReconShip): void {
    if (ship.capabilities.canScan) {
      this.ships.set(ship.id, ship);

      // Emit events
      this.emit('shipRegistered', { shipId: ship.id });
      moduleEventBus.emit({
        type: 'MODULE_ACTIVATED',
        moduleId: ship.id,
        moduleType: 'radar' as ModuleType,
        timestamp: Date.now(),
        data: { ship },
      });
    }
  }

  public unregisterShip(shipId: string): void {
    if (this.ships.has(shipId)) {
      this.ships.delete(shipId);
      this.tasks.delete(shipId);

      // Emit events
      this.emit('shipUnregistered', { shipId });
      moduleEventBus.emit({
        type: 'MODULE_DEACTIVATED',
        moduleId: shipId,
        moduleType: 'radar' as ModuleType,
        timestamp: Date.now(),
      });
    }
  }

  public assignExplorationTask(
    shipId: string,
    sectorId: string,
    position: Position,
    specialization: 'mapping' | 'anomaly' | 'resource'
  ): void {
    const ship = this.ships.get(shipId);
    if (!ship || !ship.capabilities.canScan) {
      return;
    }

    const task: ExplorationTask = {
      id: `explore-${sectorId}`,
      type: 'explore',
      target: {
        id: sectorId,
        position,
      },
      priority: this.getPriorityForSpecialization(specialization),
      assignedAt: Date.now(),
      specialization,
      status: 'queued',
    };

    this.tasks.set(shipId, task);
    this.updateShipStatus(shipId, 'scanning');

    // Emit events
    this.emit('taskAssigned', { shipId, task });
    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED',
      moduleId: shipId,
      moduleType: 'radar' as ModuleType,
      timestamp: Date.now(),
      data: { task },
    });
  }

  public completeTask(shipId: string): void {
    const task = this.tasks.get(shipId);
    const ship = this.ships.get(shipId);

    if (task && ship) {
      // Update sector data
      const sector = this.sectors.get(task.target.id);
      if (sector) {
        sector.explored = true;
        ship.discoveries.mappedSectors++;

        // Update based on specialization
        if (task.specialization === 'anomaly') {
          sector.anomalies = Math.floor(Math.random() * 3) + 1; // 1-3 anomalies
          ship.discoveries.anomaliesFound += sector.anomalies;
        } else if (task.specialization === 'resource') {
          sector.resources = Math.floor(Math.random() * 5) + 1; // 1-5 resources
          ship.discoveries.resourcesLocated += sector.resources;
        }
      }

      // Grant experience
      ship.experience += this.calculateExperienceGain(task);

      this.tasks.delete(shipId);
      this.updateShipStatus(shipId, 'returning');

      // Emit events
      this.emit('taskCompleted', { shipId, task });
      moduleEventBus.emit({
        type: 'AUTOMATION_CYCLE_COMPLETE',
        moduleId: shipId,
        moduleType: 'radar' as ModuleType,
        timestamp: Date.now(),
        data: { task, discoveries: ship.discoveries },
      });
    }
  }

  public updateShipTechBonuses(
    shipId: string,
    bonuses: { scanSpeed: number; stealthEfficiency: number; detectionRange: number }
  ): void {
    const ship = this.ships.get(shipId);
    if (ship) {
      ship.techBonuses = bonuses;
      this.emit('techBonusesUpdated', { shipId, bonuses });
    }
  }

  public toggleShipStealth(shipId: string): void {
    const ship = this.ships.get(shipId);
    if (ship && ship.stealth.cooldown <= 0) {
      ship.stealth.active = !ship.stealth.active;
      this.emit('stealthToggled', { shipId, active: ship.stealth.active });
    }
  }

  private updateShipStatus(
    shipId: string,
    status: 'idle' | 'scanning' | 'investigating' | 'returning'
  ): void {
    const ship = this.ships.get(shipId);
    if (ship) {
      ship.status = status;

      // Emit events
      this.emit('shipStatusUpdated', { shipId, status });
      moduleEventBus.emit({
        type: 'STATUS_CHANGED',
        moduleId: shipId,
        moduleType: 'radar' as ModuleType,
        timestamp: Date.now(),
        data: { status },
      });
    }
  }

  private getPriorityForSpecialization(specialization: 'mapping' | 'anomaly' | 'resource'): number {
    switch (specialization) {
      case 'anomaly':
        return 3;
      case 'resource':
        return 2;
      case 'mapping':
        return 1;
      default:
        return 0;
    }
  }

  private calculateExperienceGain(task: ExplorationTask): number {
    const baseXP = 100;
    const timeFactor = (Date.now() - task.assignedAt) / 1000 / 60; // Minutes
    const specializationBonus = task.specialization === 'anomaly' ? 1.5 : 1.2;

    return Math.floor(baseXP * timeFactor * specializationBonus);
  }

  // Add method to get ship efficiency with tech bonuses
  public getShipEfficiency(shipId: string): number {
    const ship = this.ships.get(shipId);
    if (!ship) return 0;

    const baseEfficiency = ship.efficiency;
    const techBonus = ship.techBonuses?.scanSpeed || 1;

    return baseEfficiency * techBonus;
  }

  // Update method for periodic tasks
  public update(deltaTime: number): void {
    this.ships.forEach(ship => {
      // Update stealth cooldown
      if (ship.stealth.cooldown > 0) {
        ship.stealth.cooldown = Math.max(0, ship.stealth.cooldown - deltaTime);
      }

      // Apply tech bonuses to sensor range
      if (ship.techBonuses) {
        ship.sensors.range = ship.sensors.range * ship.techBonuses.detectionRange;
      }

      // Handle automatic stealth activation near threats
      if (this.isNearThreat(ship) && !ship.stealth.active && ship.stealth.cooldown <= 0) {
        this.toggleShipStealth(ship.id);
      }
    });
  }

  private isNearThreat(ship: ReconShip): boolean {
    // Get threats within ship's sensor range
    const threats = combatManager.getThreatsInRange(ship.position, ship.sensors.range);

    if (threats.length === 0) {
      return false;
    }

    // Calculate threat level based on proximity and severity
    const threatLevel = threats.reduce((total, threat) => {
      const distance = Math.sqrt(
        Math.pow(threat.position.x - ship.position.x, 2) +
          Math.pow(threat.position.y - ship.position.y, 2)
      );

      // Scale threat by distance and severity
      const distanceFactor = 1 - Math.min(distance / ship.sensors.range, 1);
      const severityFactor =
        threat.severity === 'high' ? 1 : threat.severity === 'medium' ? 0.6 : 0.3;

      // Apply sensor accuracy to detection reliability
      const detectionChance = ship.sensors.accuracy * (ship.techBonuses?.detectionRange || 1);

      return total + distanceFactor * severityFactor * detectionChance;
    }, 0);

    // Return true if threat level exceeds threshold
    // Scale threshold based on ship's stealth capabilities
    const stealthFactor = (ship.stealth.level / 100) * (ship.techBonuses?.stealthEfficiency || 1);
    const baseThreshold = 0.3; // Base threshold for threat response

    return threatLevel > baseThreshold * (1 + stealthFactor);
  }
}

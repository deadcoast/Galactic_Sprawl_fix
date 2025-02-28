import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { CommonShipCapabilities } from '../../types/ships/CommonShipTypes';
import { EventEmitter } from '../../utils/EventEmitter';
import { combatManager } from '../combat/combatManager';

interface Anomaly {
  id: string;
  type: 'artifact' | 'signal' | 'phenomenon';
  severity: 'low' | 'medium' | 'high';
  description: string;
  investigated: boolean;
}

interface Threat {
  id: string;
  position: Position;
  severity: number;
  type: string;
}

interface ReconShipEvents {
  shipRegistered: { shipId: string };
  shipUnregistered: { shipId: string };
  taskAssigned: { shipId: string; task: ExplorationTask };
  taskCompleted: { shipId: string; task: ExplorationTask };
  techBonusesUpdated: {
    shipId: string;
    bonuses: {
      scanSpeed: number;
      stealthEfficiency: number;
      detectionRange: number;
    };
  };
  stealthToggled: { shipId: string; active: boolean };
  shipStatusUpdated: { shipId: string; status: ReconShip['status'] };
  threatDetected: { shipId: string; threatLevel: number; position: Position };
  anomalyDiscovered: { shipId: string; anomaly: Anomaly; position: Position };
}

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

export class ReconShipManagerImpl extends EventEmitter<ReconShipEvents> {
  private ships: Map<string, ReconShip> = new Map();
  private tasks: Map<string, ExplorationTask> = new Map();
  private sectors: Map<
    string,
    {
      id: string;
      position: Position;
      explored: boolean;
      anomalies: Anomaly[];
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

    // Check for threats before assigning task
    const threats = this.getNearbyThreats(position, ship.sensors.range);
    const threatLevel = this.calculateThreatLevel(threats, ship);

    if (threatLevel > 0.7) {
      // High threat - initiate evasion
      this.assignEvasionTask(shipId, position, threats);
      return;
    }

    const task: ExplorationTask = {
      id: `explore-${sectorId}`,
      type: threatLevel > 0.3 ? 'investigate' : 'explore',
      target: {
        id: sectorId,
        position,
      },
      priority: this.getPriorityForSpecialization(specialization),
      assignedAt: Date.now(),
      specialization,
      status: 'queued',
      threatLevel,
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

  private assignEvasionTask(shipId: string, position: Position, threats: Threat[]): void {
    const ship = this.ships.get(shipId);
    if (!ship) return;

    // Calculate safe position away from threats
    const safePosition = this.calculateSafePosition(position, threats);

    const task: ExplorationTask = {
      id: `evade-${Date.now()}`,
      type: 'evade',
      target: {
        id: 'safe-zone',
        position: safePosition,
      },
      priority: 10, // Highest priority for evasion
      assignedAt: Date.now(),
      specialization: 'mapping',
      status: 'queued',
      threatLevel: 1,
    };

    this.tasks.set(shipId, task);
    this.updateShipStatus(shipId, 'returning');
    this.toggleShipStealth(shipId, true);

    this.emit('taskAssigned', { shipId, task });
  }

  private calculateSafePosition(position: Position, threats: Threat[]): Position {
    // Calculate vector away from threats
    const escapeVector = threats.reduce(
      (vec, threat) => {
        const dx = position.x - threat.position.x;
        const dy = position.y - threat.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return {
          x: vec.x + (dx / distance) * threat.severity,
          y: vec.y + (dy / distance) * threat.severity,
        };
      },
      { x: 0, y: 0 }
    );

    // Normalize and scale
    const magnitude = Math.sqrt(escapeVector.x * escapeVector.x + escapeVector.y * escapeVector.y);
    const safeDistance = 500; // Base safe distance

    return {
      x: position.x + (escapeVector.x / magnitude) * safeDistance,
      y: position.y + (escapeVector.y / magnitude) * safeDistance,
    };
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

        // Enhanced specialization handling
        if (task.specialization === 'anomaly') {
          const anomalies = this.generateAnomalies(ship.sensors.anomalyDetection);
          sector.anomalies = anomalies;
          ship.discoveries.anomaliesFound += anomalies.length;

          // Emit anomaly discoveries
          anomalies.forEach(anomaly => {
            this.emit('anomalyDiscovered', {
              shipId,
              anomaly,
              position: task.target.position,
            });
          });

          // Emit mission event
          moduleEventBus.emit({
            type: 'MISSION_COMPLETED',
            moduleId: shipId,
            moduleType: 'radar' as ModuleType,
            timestamp: Date.now(),
            data: {
              type: 'anomaly',
              sector: task.target.id,
              importance: anomalies.some(a => a.severity === 'high')
                ? 'high'
                : anomalies.some(a => a.severity === 'medium')
                  ? 'medium'
                  : 'low',
              description: `Discovered ${anomalies.length} anomalies in ${task.target.id}`,
              xpGained: this.calculateExperienceGain(task, ship),
              anomalyDetails: anomalies.map(a => ({
                type: a.type,
                severity: a.severity,
                investigated: a.investigated,
              })),
            },
          });
        } else if (task.specialization === 'resource') {
          sector.resources = Math.floor(Math.random() * 5) + 1;
          ship.discoveries.resourcesLocated += sector.resources;

          // Emit mission event
          moduleEventBus.emit({
            type: 'MISSION_COMPLETED',
            moduleId: shipId,
            moduleType: 'radar' as ModuleType,
            timestamp: Date.now(),
            data: {
              type: 'discovery',
              sector: task.target.id,
              importance: sector.resources > 3 ? 'high' : sector.resources > 1 ? 'medium' : 'low',
              description: `Located ${sector.resources} resource deposits in ${task.target.id}`,
              xpGained: this.calculateExperienceGain(task, ship),
              resourcesFound: [{ type: 'Unknown', amount: sector.resources }],
            },
          });
        }
      }

      // Enhanced experience calculation
      const experienceGained = this.calculateExperienceGain(task, ship);
      ship.experience += experienceGained;

      // Apply tech bonuses based on experience
      this.updateTechBonuses(ship);

      this.tasks.delete(shipId);
      this.updateShipStatus(shipId, 'returning');

      // Emit events
      this.emit('taskCompleted', { shipId, task });
      moduleEventBus.emit({
        type: 'AUTOMATION_CYCLE_COMPLETE',
        moduleId: shipId,
        moduleType: 'radar' as ModuleType,
        timestamp: Date.now(),
        data: {
          task,
          discoveries: ship.discoveries,
          experienceGained,
          heatMapValue: this.calculateHeatMapValue(sector),
        },
      });
    }
  }

  private calculateHeatMapValue(sector: any): number {
    if (!sector) return 0;

    let heatValue = 0;

    // Resource potential contribution (40%)
    heatValue += (sector.resources || 0) * 0.4;

    // Anomaly contribution (30%)
    if (sector.anomalies) {
      const anomalyHeat = sector.anomalies.reduce((sum: number, anomaly: Anomaly) => {
        return (
          sum + (anomaly.severity === 'high' ? 0.3 : anomaly.severity === 'medium' ? 0.2 : 0.1)
        );
      }, 0);
      heatValue += anomalyHeat;
    }

    // Habitability contribution (30%)
    if (sector.habitabilityScore) {
      heatValue += sector.habitabilityScore * 0.3;
    }

    // Age decay
    if (sector.lastScanned) {
      const hoursSinceLastScan = (Date.now() - sector.lastScanned) / (1000 * 60 * 60);
      const ageFactor = Math.max(0, 1 - hoursSinceLastScan / 168); // 168 hours = 1 week
      heatValue *= ageFactor;
    }

    return Math.min(1, heatValue);
  }

  private generateAnomalies(detectionSkill: number): Anomaly[] {
    const count = Math.floor(Math.random() * 3 * detectionSkill) + 1;
    const anomalies: Anomaly[] = [];
    const anomalyTypes = ['artifact', 'signal', 'phenomenon'] as const;
    const severityLevels = ['high', 'medium', 'low'] as const;

    for (let i = 0; i < count; i++) {
      const type = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
      const severity = Math.random() < 0.2 ? 'high' : Math.random() < 0.5 ? 'medium' : 'low';

      anomalies.push({
        id: `anomaly-${Date.now()}-${i}`,
        type,
        severity,
        description: this.generateAnomalyDescription(type, severity),
        investigated: false,
      });
    }

    return anomalies;
  }

  private generateAnomalyDescription(
    type: 'artifact' | 'signal' | 'phenomenon',
    severity: 'low' | 'medium' | 'high'
  ): string {
    const descriptions = {
      artifact: {
        high: 'Ancient technological marvel of immense power',
        medium: 'Mysterious alien artifacts with unknown purpose',
        low: 'Scattered remnants of past civilizations',
      },
      signal: {
        high: 'Powerful energy signature of unknown origin',
        medium: 'Recurring patterns in subspace frequencies',
        low: 'Faint echoes of distant transmissions',
      },
      phenomenon: {
        high: 'Dangerous spatial anomaly requiring immediate attention',
        medium: 'Unusual gravitational fluctuations detected',
        low: 'Minor disturbances in local space-time',
      },
    } as const;

    return descriptions[type][severity];
  }

  private calculateExperienceGain(task: ExplorationTask, ship: ReconShip): number {
    const baseXP = 100;
    const timeFactor = (Date.now() - task.assignedAt) / 1000 / 60; // Minutes

    // Specialization bonus
    const specializationBonus = task.specialization === ship.specialization ? 1.5 : 1.2;

    // Threat bonus
    const threatBonus = task.threatLevel ? 1 + task.threatLevel : 1;

    // Efficiency bonus
    const efficiencyBonus = ship.efficiency;

    // Discovery bonus
    const discoveryBonus =
      ship.discoveries.anomaliesFound * 0.1 + ship.discoveries.resourcesLocated * 0.05;

    return Math.floor(
      baseXP *
        timeFactor *
        specializationBonus *
        threatBonus *
        efficiencyBonus *
        (1 + discoveryBonus)
    );
  }

  private updateTechBonuses(ship: ReconShip): void {
    const experienceLevel = Math.floor(ship.experience / 1000);
    const bonuses = {
      scanSpeed: 1 + experienceLevel * 0.1,
      stealthEfficiency: 1 + experienceLevel * 0.15,
      detectionRange: 1 + experienceLevel * 0.05,
    };

    this.emit('techBonusesUpdated', { shipId: ship.id, bonuses });
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

  public toggleShipStealth(shipId: string, active: boolean): void {
    const ship = this.ships.get(shipId);
    if (ship && ship.stealth.cooldown <= 0) {
      ship.stealth.active = active;
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

  // Add method to get ship efficiency with tech bonuses
  public getShipEfficiency(shipId: string): number {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return 0;
    }

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
        ship.sensors.range *= ship.techBonuses.detectionRange;
      }

      // Handle automatic stealth activation near threats
      if (this.isNearThreat(ship) && !ship.stealth.active && ship.stealth.cooldown <= 0) {
        this.toggleShipStealth(ship.id, true);
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

  private getNearbyThreats(position: Position, range: number): Threat[] {
    return combatManager.getThreatsInRange(position, range).map(threat => ({
      id: threat.id,
      position: threat.position,
      severity: threat.severity === 'high' ? 1 : threat.severity === 'medium' ? 0.6 : 0.3,
      type: threat.type,
    }));
  }

  private calculateThreatLevel(threats: Threat[], ship: ReconShip): number {
    if (threats.length === 0) return 0;

    return threats.reduce((total, threat) => {
      const distance = Math.sqrt(
        Math.pow(threat.position.x - ship.position.x, 2) +
          Math.pow(threat.position.y - ship.position.y, 2)
      );

      const distanceFactor = 1 - Math.min(distance / ship.sensors.range, 1);
      const detectionChance = ship.sensors.accuracy * (ship.techBonuses?.detectionRange || 1);

      return total + distanceFactor * threat.severity * detectionChance;
    }, 0);
  }
}

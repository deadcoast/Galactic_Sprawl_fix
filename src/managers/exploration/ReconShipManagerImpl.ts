import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
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

interface ReconShipEvents extends Record<string, unknown> {
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
  fleetFormationCreated: { formationId: string; shipIds: string[]; formation: FleetFormation };
  fleetFormationDisbanded: { formationId: string };
  shipAddedToFormation: { formationId: string; shipId: string };
  shipRemovedFromFormation: { formationId: string; shipId: string };
  taskShared: { sourceShipId: string; targetShipId: string; task: ExplorationTask };
  coordinatedScanStarted: { sectorId: string; shipIds: string[] };
  coordinatedScanCompleted: { sectorId: string; shipIds: string[]; results: ScanResult };
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
  formationId?: string;
  formationRole?: 'leader' | 'support' | 'scout';
  coordinationBonus?: number;
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

interface SectorData {
  id: string;
  position: Position;
  explored: boolean;
  anomalies: Anomaly[];
  resources: number;
  habitabilityScore?: number;
  lastScanned?: number;
}

interface FleetFormation {
  id: string;
  name: string;
  type: 'exploration' | 'survey' | 'defensive';
  shipIds: string[];
  leaderId: string;
  position: Position;
  scanBonus: number;
  detectionBonus: number;
  stealthBonus: number;
  createdAt: number;
}

interface ScanResult {
  sectorId: string;
  resources: {
    type: string;
    amount: number;
    quality: number;
  }[];
  anomalies: Anomaly[];
  habitabilityScore: number;
  scanAccuracy: number;
  scanTime: number;
}

export class ReconShipManagerImpl extends EventEmitter<ReconShipEvents> {
  private ships: Map<string, ReconShip> = new Map();
  private tasks: Map<string, ExplorationTask> = new Map();
  private sectors: Map<string, SectorData> = new Map();
  private formations: Map<string, FleetFormation> = new Map();
  private coordinatedScans: Map<
    string,
    { shipIds: string[]; progress: number; startTime: number }
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
    if (!ship) {
      return;
    }

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
          // Generate more detailed resource data
          const resourceCount = Math.floor(Math.random() * 5) + 1;
          const resourceTypes: ('minerals' | 'energy' | 'gas' | 'plasma' | 'exotic')[] = [
            'minerals',
            'energy',
            'gas',
            'plasma',
            'exotic',
          ];

          // Create detailed resource signals
          const resourceSignals = Array.from({ length: resourceCount }, () => {
            const signalType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            const signalStrength = 0.3 + Math.random() * 0.7; // 30-100% strength
            const signalDepth = Math.random(); // 0-100% depth (higher = harder to access)
            const signalPatterns = ['concentrated', 'scattered', 'veins'] as const;
            const signalPattern = signalPatterns[Math.floor(Math.random() * signalPatterns.length)];

            return {
              type: signalType,
              strength: signalStrength,
              depth: signalDepth,
              pattern: signalPattern,
            };
          });

          // Update sector with resource count
          sector.resources = resourceCount;
          ship.discoveries.resourcesLocated += resourceCount;

          // Determine importance based on resource quality and quantity
          const averageStrength =
            resourceSignals.reduce((sum, signal) => sum + signal.strength, 0) /
            resourceSignals.length;
          const hasExotic = resourceSignals.some(signal => signal.type === 'exotic');
          const importance = hasExotic
            ? 'high'
            : averageStrength > 0.7 || resourceCount > 3
              ? 'high'
              : averageStrength > 0.5 || resourceCount > 1
                ? 'medium'
                : 'low';

          // Create detailed resource data for the event
          const resourcesFound = resourceSignals.map(signal => ({
            type: signal.type,
            amount: Math.floor(signal.strength * 100),
            quality: signal.strength,
            accessibility: 1 - signal.depth,
            distribution: signal.pattern,
          }));

          // Emit mission event with detailed resource data
          moduleEventBus.emit({
            type: 'MISSION_COMPLETED',
            moduleId: shipId,
            moduleType: 'radar' as ModuleType,
            timestamp: Date.now(),
            data: {
              type: 'discovery',
              sector: task.target.id,
              importance,
              description: `Located ${resourceCount} resource deposits in ${task.target.id}`,
              xpGained: this.calculateExperienceGain(task, ship),
              resourcesFound,
              rawSignals: resourceSignals,
            },
          });

          // Also emit a resource discovery event for the resource discovery system
          moduleEventBus.emit({
            type: 'RESOURCE_DISCOVERED' as ModuleEventType,
            moduleId: shipId,
            moduleType: 'radar' as ModuleType,
            timestamp: Date.now(),
            data: {
              sectorId: task.target.id,
              sectorName: task.target.id, // This would be better with actual sector name
              resourceSignals,
              scanQuality: 0.5 + ship.sensors.accuracy * 0.5, // 50-100% based on ship sensors
              confidence: 0.4 + ship.experience / 1000, // Confidence increases with ship experience
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
          heatMapValue: sector ? this.calculateHeatMapValue(sector) : 0,
        },
      });
    }
  }

  private calculateHeatMapValue(sector: SectorData): number {
    if (!sector) {
      return 0;
    }

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

    // Update coordinated scans
    this.updateCoordinatedScans(deltaTime);
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
    if (threats.length === 0) {
      return 0;
    }

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

  /**
   * Creates a new fleet formation with the specified ships
   * @param name Formation name
   * @param type Formation type
   * @param shipIds IDs of ships to include in the formation
   * @param leaderId ID of the ship that will lead the formation
   * @returns The created formation ID
   */
  public createFleetFormation(
    name: string,
    type: 'exploration' | 'survey' | 'defensive',
    shipIds: string[],
    leaderId: string
  ): string {
    // Validate that all ships exist and leader is among them
    if (!shipIds.every(id => this.ships.has(id)) || !shipIds.includes(leaderId)) {
      return '';
    }

    // Create a unique ID for the formation
    const formationId = `formation-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Calculate formation position (average of all ships)
    const position = this.calculateFormationPosition(shipIds);

    // Calculate formation bonuses based on type and ships
    const { scanBonus, detectionBonus, stealthBonus } = this.calculateFormationBonuses(
      type,
      shipIds
    );

    // Create the formation
    const formation: FleetFormation = {
      id: formationId,
      name,
      type,
      shipIds,
      leaderId,
      position,
      scanBonus,
      detectionBonus,
      stealthBonus,
      createdAt: Date.now(),
    };

    // Store the formation
    this.formations.set(formationId, formation);

    // Update ships with formation information
    shipIds.forEach(shipId => {
      const ship = this.ships.get(shipId);
      if (ship) {
        const updatedShip = {
          ...ship,
          formationId,
          formationRole:
            shipId === leaderId ? ('leader' as const) : this.determineFormationRole(ship, type),
          coordinationBonus: shipId === leaderId ? scanBonus * 0.5 : scanBonus,
        };
        this.ships.set(shipId, updatedShip);
      }
    });

    // Emit event
    this.emit('fleetFormationCreated', { formationId, shipIds, formation });

    return formationId;
  }

  /**
   * Disbands an existing fleet formation
   * @param formationId ID of the formation to disband
   */
  public disbandFleetFormation(formationId: string): void {
    const formation = this.formations.get(formationId);
    if (!formation) {
      return;
    }

    // Remove formation information from ships
    formation.shipIds.forEach(shipId => {
      const ship = this.ships.get(shipId);
      if (ship) {
        const { formationId: _, formationRole: __, coordinationBonus: ___, ...restShip } = ship;
        this.ships.set(shipId, restShip as ReconShip);
      }
    });

    // Remove the formation
    this.formations.delete(formationId);

    // Emit event
    this.emit('fleetFormationDisbanded', { formationId });
  }

  /**
   * Adds a ship to an existing formation
   * @param formationId ID of the formation
   * @param shipId ID of the ship to add
   */
  public addShipToFormation(formationId: string, shipId: string): void {
    const formation = this.formations.get(formationId);
    const ship = this.ships.get(shipId);

    if (!formation || !ship || formation.shipIds.includes(shipId)) {
      return;
    }

    // Add ship to formation
    formation.shipIds.push(shipId);

    // Recalculate formation bonuses
    const { scanBonus, detectionBonus, stealthBonus } = this.calculateFormationBonuses(
      formation.type,
      formation.shipIds
    );

    // Update formation
    this.formations.set(formationId, {
      ...formation,
      scanBonus,
      detectionBonus,
      stealthBonus,
    });

    // Update ship
    this.ships.set(shipId, {
      ...ship,
      formationId,
      formationRole: this.determineFormationRole(ship, formation.type),
      coordinationBonus: scanBonus,
    });

    // Emit event
    this.emit('shipAddedToFormation', { formationId, shipId });
  }

  /**
   * Removes a ship from a formation
   * @param formationId ID of the formation
   * @param shipId ID of the ship to remove
   */
  public removeShipFromFormation(formationId: string, shipId: string): void {
    const formation = this.formations.get(formationId);
    const ship = this.ships.get(shipId);

    if (!formation || !ship || !formation.shipIds.includes(shipId)) {
      return;
    }

    // Check if this is the leader
    const isLeader = shipId === formation.leaderId;

    // Remove ship from formation
    formation.shipIds = formation.shipIds.filter(id => id !== shipId);

    // If this was the leader, assign a new leader if there are ships left
    if (isLeader && formation.shipIds.length > 0) {
      formation.leaderId = formation.shipIds[0];

      // Update the new leader's role
      const newLeader = this.ships.get(formation.leaderId);
      if (newLeader) {
        this.ships.set(formation.leaderId, {
          ...newLeader,
          formationRole: 'leader',
        });
      }
    }

    // If no ships left, disband the formation
    if (formation.shipIds.length === 0) {
      this.formations.delete(formationId);
      this.emit('fleetFormationDisbanded', { formationId });
      return;
    }

    // Recalculate formation bonuses
    const { scanBonus, detectionBonus, stealthBonus } = this.calculateFormationBonuses(
      formation.type,
      formation.shipIds
    );

    // Update formation
    this.formations.set(formationId, {
      ...formation,
      scanBonus,
      detectionBonus,
      stealthBonus,
    });

    // Remove formation info from ship
    const { formationId: _, formationRole: __, coordinationBonus: ___, ...restShip } = ship;
    this.ships.set(shipId, restShip as ReconShip);

    // Emit event
    this.emit('shipRemovedFromFormation', { formationId, shipId });
  }

  /**
   * Starts a coordinated scan of a sector using multiple ships
   * @param sectorId ID of the sector to scan
   * @param shipIds IDs of ships to use for scanning
   */
  public startCoordinatedScan(sectorId: string, shipIds: string[]): void {
    // Validate that all ships exist and are available
    if (
      !shipIds.every(id => {
        const ship = this.ships.get(id);
        return ship && ship.status === 'idle';
      })
    ) {
      return;
    }

    // Get sector data or create if it doesn't exist
    let sector = this.sectors.get(sectorId);
    if (!sector) {
      // Create a placeholder sector
      sector = {
        id: sectorId,
        position: { x: 0, y: 0 }, // This will be updated when the scan completes
        explored: false,
        anomalies: [],
        resources: 0,
      };
      this.sectors.set(sectorId, sector);
    }

    // Update ships status
    shipIds.forEach(shipId => {
      this.updateShipStatus(shipId, 'scanning');

      // Update ship target
      const ship = this.ships.get(shipId);
      if (ship) {
        this.ships.set(shipId, {
          ...ship,
          targetSector: sectorId,
        });
      }
    });

    // Start coordinated scan
    this.coordinatedScans.set(sectorId, {
      shipIds,
      progress: 0,
      startTime: Date.now(),
    });

    // Emit event
    this.emit('coordinatedScanStarted', { sectorId, shipIds });

    // Emit module events for each ship
    shipIds.forEach(shipId => {
      moduleEventBus.emit({
        type: 'MODULE_ACTIVATED',
        moduleId: shipId,
        moduleType: 'radar' as ModuleType,
        timestamp: Date.now(),
        data: { sectorId },
      });
    });
  }

  /**
   * Shares a task from one ship to another
   * @param sourceShipId ID of the ship sharing the task
   * @param targetShipId ID of the ship receiving the task
   * @param taskType Type of task to share
   */
  public shareTask(
    sourceShipId: string,
    targetShipId: string,
    taskType: 'explore' | 'investigate' | 'evade'
  ): void {
    const sourceShip = this.ships.get(sourceShipId);
    const targetShip = this.ships.get(targetShipId);
    const sourceTask = this.tasks.get(sourceShipId);

    if (!sourceShip || !targetShip || !sourceTask || sourceTask.type !== taskType) {
      return;
    }

    // Create a new task for the target ship
    const newTask: ExplorationTask = {
      ...sourceTask,
      id: `${sourceTask.id}-shared-${Date.now()}`,
      assignedAt: Date.now(),
    };

    // Assign the task to the target ship
    this.tasks.set(targetShipId, newTask);
    this.updateShipStatus(targetShipId, 'scanning');

    // Emit events
    this.emit('taskShared', { sourceShipId, targetShipId, task: newTask });
    this.emit('taskAssigned', { shipId: targetShipId, task: newTask });

    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED',
      moduleId: targetShipId,
      moduleType: 'radar' as ModuleType,
      timestamp: Date.now(),
      data: { task: newTask },
    });
  }

  /**
   * Automatically distributes tasks among available ships based on their specializations
   * @param sectorIds IDs of sectors to scan
   * @param prioritizeFormations Whether to prioritize ships in formations
   */
  public autoDistributeTasks(sectorIds: string[], prioritizeFormations = true): void {
    // Get available ships
    const availableShips = Array.from(this.ships.values()).filter(ship => ship.status === 'idle');

    if (availableShips.length === 0 || sectorIds.length === 0) {
      return;
    }

    // Sort ships by priority (formations first if prioritizeFormations is true)
    const sortedShips = [...availableShips].sort((a, b) => {
      if (prioritizeFormations) {
        // Ships in formations have higher priority
        if (a.formationId && !b.formationId) {
          return -1;
        }
        if (!a.formationId && b.formationId) {
          return 1;
        }
      }

      // Then sort by experience
      return b.experience - a.experience;
    });

    // Distribute tasks
    sectorIds.forEach((sectorId, index) => {
      if (index >= sortedShips.length) {
        return;
      }

      const ship = sortedShips[index];

      // If ship is in a formation, check if we can do a coordinated scan
      if (ship.formationId && prioritizeFormations) {
        const formation = this.formations.get(ship.formationId);
        if (formation) {
          // Get all idle ships in the formation
          const formationShips = formation.shipIds
            .map(id => this.ships.get(id))
            .filter(s => s && s.status === 'idle')
            .map(s => s!.id);

          if (formationShips.length > 1) {
            // Start a coordinated scan with all available ships in the formation
            this.startCoordinatedScan(sectorId, formationShips);
            return;
          }
        }
      }

      // Otherwise, assign an individual task
      this.assignExplorationTask(
        ship.id,
        sectorId,
        { x: 0, y: 0 }, // This will be updated when the scan starts
        ship.specialization
      );
    });
  }

  /**
   * Gets all active fleet formations
   * @returns Array of fleet formations
   */
  public getFleetFormations(): FleetFormation[] {
    return Array.from(this.formations.values());
  }

  /**
   * Gets a specific fleet formation by ID
   * @param formationId ID of the formation
   * @returns The formation or undefined if not found
   */
  public getFleetFormation(formationId: string): FleetFormation | undefined {
    return this.formations.get(formationId);
  }

  /**
   * Gets all ships in a specific formation
   * @param formationId ID of the formation
   * @returns Array of ships in the formation
   */
  public getShipsInFormation(formationId: string): ReconShip[] {
    const formation = this.formations.get(formationId);
    if (!formation) {
      return [];
    }

    return formation.shipIds
      .map(id => this.ships.get(id))
      .filter(ship => ship !== undefined) as ReconShip[];
  }

  /**
   * Calculates the average position of all ships in a formation
   * @param shipIds IDs of ships in the formation
   * @returns Average position
   */
  private calculateFormationPosition(shipIds: string[]): Position {
    const ships = shipIds
      .map(id => this.ships.get(id))
      .filter(ship => ship !== undefined) as ReconShip[];

    if (ships.length === 0) {
      return { x: 0, y: 0 };
    }

    const totalX = ships.reduce((sum, ship) => sum + ship.position.x, 0);
    const totalY = ships.reduce((sum, ship) => sum + ship.position.y, 0);

    return {
      x: totalX / ships.length,
      y: totalY / ships.length,
    };
  }

  /**
   * Calculates bonuses for a formation based on its type and ships
   * @param type Formation type
   * @param shipIds IDs of ships in the formation
   * @returns Object with scan, detection, and stealth bonuses
   */
  private calculateFormationBonuses(
    type: 'exploration' | 'survey' | 'defensive',
    shipIds: string[]
  ): { scanBonus: number; detectionBonus: number; stealthBonus: number } {
    const ships = shipIds
      .map(id => this.ships.get(id))
      .filter(ship => ship !== undefined) as ReconShip[];

    if (ships.length === 0) {
      return { scanBonus: 0, detectionBonus: 0, stealthBonus: 0 };
    }

    // Base bonuses depend on formation type
    let baseScanBonus = 0;
    let baseDetectionBonus = 0;
    let baseStealthBonus = 0;

    switch (type) {
      case 'exploration':
        baseScanBonus = 0.2;
        baseDetectionBonus = 0.1;
        baseStealthBonus = 0.1;
        break;
      case 'survey':
        baseScanBonus = 0.3;
        baseDetectionBonus = 0.05;
        baseStealthBonus = 0.05;
        break;
      case 'defensive':
        baseScanBonus = 0.1;
        baseDetectionBonus = 0.3;
        baseStealthBonus = 0.2;
        break;
    }

    // Additional bonuses based on ship specializations
    const specializationCounts = {
      mapping: ships.filter(ship => ship.specialization === 'mapping').length,
      anomaly: ships.filter(ship => ship.specialization === 'anomaly').length,
      resource: ships.filter(ship => ship.specialization === 'resource').length,
    };

    // Synergy bonus for diverse specializations
    const diversityBonus = Object.values(specializationCounts).every(count => count > 0) ? 0.1 : 0;

    // Scale bonuses based on ship count (diminishing returns)
    const shipCountFactor = Math.min(1, 0.5 + ships.length * 0.1);

    // Calculate final bonuses
    const scanBonus = baseScanBonus * shipCountFactor + diversityBonus;
    const detectionBonus = baseDetectionBonus * shipCountFactor + diversityBonus;
    const stealthBonus = baseStealthBonus * shipCountFactor + diversityBonus;

    return { scanBonus, detectionBonus, stealthBonus };
  }

  /**
   * Determines the role of a ship in a formation based on its specialization and formation type
   * @param ship The ship
   * @param formationType Type of formation
   * @returns The role ('support' or 'scout')
   */
  private determineFormationRole(
    ship: ReconShip,
    formationType: 'exploration' | 'survey' | 'defensive'
  ): 'support' | 'scout' {
    // Determine role based on specialization and formation type
    if (
      (formationType === 'exploration' && ship.specialization === 'mapping') ||
      (formationType === 'survey' && ship.specialization === 'resource') ||
      (formationType === 'defensive' && ship.specialization === 'anomaly')
    ) {
      return 'support'; // Primary support role
    }

    return 'scout'; // Scout role for other combinations
  }

  /**
   * Updates the state of all coordinated scans
   * @param deltaTime Time elapsed since last update in milliseconds
   */
  private updateCoordinatedScans(deltaTime: number): void {
    // Process each coordinated scan
    for (const [sectorId, scanData] of this.coordinatedScans.entries()) {
      // Calculate scan progress
      const ships = scanData.shipIds
        .map(id => this.ships.get(id))
        .filter(ship => ship !== undefined) as ReconShip[];

      if (ships.length === 0) {
        // No ships left, cancel the scan
        this.coordinatedScans.delete(sectorId);
        continue;
      }

      // Calculate scan speed based on ships and their formation bonuses
      let scanSpeed = ships.reduce((total, ship) => {
        // Base scan speed
        let shipScanSpeed = ship.efficiency;

        // Add tech bonuses if available
        if (ship.techBonuses?.scanSpeed) {
          shipScanSpeed *= ship.techBonuses.scanSpeed;
        }

        // Add coordination bonus if available
        if (ship.coordinationBonus) {
          shipScanSpeed *= 1 + ship.coordinationBonus;
        }

        return total + shipScanSpeed;
      }, 0);

      // Apply diminishing returns for large fleets
      scanSpeed = Math.min(scanSpeed, scanSpeed * (0.5 + 0.5 / Math.sqrt(ships.length)));

      // Update progress
      const progressIncrement = (scanSpeed * deltaTime) / 10000; // Normalize to 0-1 scale
      scanData.progress += progressIncrement;

      // Check if scan is complete
      if (scanData.progress >= 1) {
        // Generate scan results
        const results = this.generateCoordinatedScanResults(sectorId, ships);

        // Update sector data
        this.updateSectorData(sectorId, results);

        // Reset ships
        scanData.shipIds.forEach(shipId => {
          this.updateShipStatus(shipId, 'idle');

          // Update ship experience
          const ship = this.ships.get(shipId);
          if (ship) {
            const experienceGain = 100 + Math.floor(Math.random() * 50);
            this.ships.set(shipId, {
              ...ship,
              experience: ship.experience + experienceGain,
              targetSector: undefined,
              discoveries: {
                ...ship.discoveries,
                mappedSectors: ship.discoveries.mappedSectors + 1,
                anomaliesFound: ship.discoveries.anomaliesFound + results.anomalies.length,
                resourcesLocated: ship.discoveries.resourcesLocated + results.resources.length,
              },
            });
          }
        });

        // Emit event
        this.emit('coordinatedScanCompleted', {
          sectorId,
          shipIds: scanData.shipIds,
          results,
        });

        // Remove the scan
        this.coordinatedScans.delete(sectorId);
      } else {
        // Update the scan data
        this.coordinatedScans.set(sectorId, scanData);
      }
    }
  }

  /**
   * Generates results for a coordinated scan
   * @param sectorId ID of the scanned sector
   * @param ships Ships involved in the scan
   * @returns Scan results
   */
  private generateCoordinatedScanResults(sectorId: string, ships: ReconShip[]): ScanResult {
    // Calculate scan accuracy based on ships and their bonuses
    const scanAccuracy = Math.min(
      0.95,
      ships.reduce((total, ship) => {
        let {accuracy} = ship.sensors;

        // Add tech bonuses if available
        if (ship.techBonuses?.scanSpeed) {
          accuracy *= ship.techBonuses.scanSpeed;
        }

        // Add coordination bonus if available
        if (ship.coordinationBonus) {
          accuracy *= 1 + ship.coordinationBonus;
        }

        return total + accuracy;
      }, 0) / ships.length
    );

    // Generate resources based on scan accuracy and ship specializations
    const resourceSpecialists = ships.filter(ship => ship.specialization === 'resource');
    const resourceCount = Math.floor(Math.random() * 3 + 1 + resourceSpecialists.length);

    const resources = Array.from({ length: resourceCount }, () => ({
      type: ['minerals', 'gas', 'energy', 'organic', 'exotic'][Math.floor(Math.random() * 5)],
      amount: Math.floor(Math.random() * 100) + 10,
      quality: Math.random() * scanAccuracy,
    }));

    // Generate anomalies based on scan accuracy and ship specializations
    const anomalySpecialists = ships.filter(ship => ship.specialization === 'anomaly');
    const anomalyCount = Math.floor(
      Math.random() * 2 + (Math.random() < 0.3 ? 1 : 0) + anomalySpecialists.length * 0.5
    );

    const anomalies = this.generateAnomalies(
      scanAccuracy * (1 + anomalySpecialists.length * 0.2)
    ).slice(0, anomalyCount);

    // Calculate habitability score
    const habitabilityScore = Math.random() * 100;

    return {
      sectorId,
      resources,
      anomalies,
      habitabilityScore,
      scanAccuracy,
      scanTime: Date.now() - (this.coordinatedScans.get(sectorId)?.startTime ?? 0),
    };
  }

  /**
   * Updates sector data with scan results
   * @param sectorId ID of the sector
   * @param results Scan results
   */
  private updateSectorData(sectorId: string, results: ScanResult): void {
    const sector = this.sectors.get(sectorId);
    if (!sector) {
      return;
    }

    // Update sector data
    this.sectors.set(sectorId, {
      ...sector,
      explored: true,
      anomalies: results.anomalies,
      resources: results.resources.reduce((total, resource) => total + resource.amount, 0),
      habitabilityScore: results.habitabilityScore,
      lastScanned: Date.now(),
    });
  }
}

import { ResourceType } from './../../types/resources/ResourceTypes';
/**
 * @file ExplorationManager.ts
 * Implementation of the ExplorationManager that conforms to the BaseManager interface.
 *
 * This class handles:
 * 1. Star system management and ship assignments
 * 2. Sector scanning and discovery tracking
 * 3. Integration with ReconShipManager for ship operations
 * 4. Event-based communication with UI components
 */

import { v4 as uuidv4 } from 'uuid';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { ReconShipManagerImpl, Ship } from './ReconShipManagerImpl';

/**
 * Exploration event interface extending BaseEvent
 */
export interface ExplorationEvent extends BaseEvent {
  type: EventType;
  moduleId: string;
  moduleType: ModuleType;
  data: ExplorationEventData;
}

/**
 * Type guard for ExplorationEvent
 */
export function isExplorationEvent(event: unknown): event is ExplorationEvent {
  if (!event || typeof event !== 'object') return false;
  const e = event as ExplorationEvent;
  return (
    'type' in e &&
    'moduleId' in e &&
    'moduleType' in e &&
    'data' in e &&
    typeof e.type === 'string' &&
    typeof e.moduleId === 'string' &&
    typeof e.moduleType === 'string' &&
    typeof e.data === 'object'
  );
}

// Map exploration events to standard EventType enum
export const EXPLORATION_EVENTS = {
  SECTOR_DISCOVERED: EventType.EXPLORATION_SECTOR_DISCOVERED,
  SECTOR_SCANNED: EventType.EXPLORATION_SECTOR_SCANNED,
  ANOMALY_DETECTED: EventType.EXPLORATION_ANOMALY_DETECTED,
  RESOURCE_DETECTED: EventType.EXPLORATION_RESOURCE_DETECTED,
  SCAN_STARTED: EventType.EXPLORATION_SCAN_STARTED,
  SCAN_COMPLETED: EventType.EXPLORATION_SCAN_COMPLETED,
  SCAN_FAILED: EventType.EXPLORATION_SCAN_FAILED,
  SHIP_ASSIGNED: EventType.EXPLORATION_SHIP_ASSIGNED,
  SHIP_UNASSIGNED: EventType.EXPLORATION_SHIP_UNASSIGNED,
} as const;

// Define a type for our exploration event data
export interface ExplorationEventData extends Record<string, unknown> {
  sector?: Sector;
  operation?: ScanOperation;
  resource?: {
    type: ResourceType;
    amount: number;
    quality: number;
  };
  anomaly?: Anomaly;
  ship?: Ship;
  reason?: string;
  sectorId?: string;
  shipId?: string;
  anomalyId?: string;
}

// Define interfaces for the types used
export interface StarSystem {
  id: string;
  name: string;
  type?: string;
  resources?: string[];
  status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  assignedShips: string[];
  position: {
    x: number;
    y: number;
  };
  lastScanned?: number;
  discoveredAt?: number;
}

export interface Sector {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  resourcePotential: number;
  habitabilityScore: number;
  anomalies: Anomaly[];
  lastScanned?: number;
  discoveredAt?: number;
  resources?: Array<{
    type: ResourceType;
    amount: number;
    quality?: number;
  }>;
}

export interface Anomaly {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  position: { x: number; y: number };
  discoveredAt: number;
  investigatedAt?: number;
  sectorId: string;
  data?: Record<string, unknown>;
}

export interface SystemSearchCriteria {
  name?: string;
  type?: string;
  resources?: string[];
  status?: string;
}

export interface ScanOperation {
  id: string;
  sectorId: string;
  shipId: string;
  startTime: number;
  estimatedDuration: number;
  progress: number;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  results?: Record<string, unknown>;
}

/**
 * ExplorationManager implements the exploration system functionality,
 * managing star systems, sectors, anomalies, and coordinating with ship operations.
 */
export class ExplorationManager extends AbstractBaseManager<ExplorationEvent> {
  // Maps to store exploration data
  private sectors: Map<string, Sector> = new Map();
  private anomalies: Map<string, Anomaly> = new Map();
  private scanOperations: Map<string, ScanOperation> = new Map();

  // References to other managers
  private shipManager: ReconShipManagerImpl;

  // Stats tracking
  private stats = {
    sectorsDiscovered: 0,
    sectorsScanned: 0,
    anomaliesDetected: 0,
    resourcesDetected: 0,
    activeScans: 0,
    completedScans: 0,
    failedScans: 0,
  };

  // Module ID for this manager (used in events)
  private moduleId: string = uuidv4();

  /**
   * Creates a new ExplorationManager
   *
   * @param shipManager The ship manager to use for ship operations
   * @param id Optional ID for the manager
   */
  constructor(shipManager: ReconShipManagerImpl, id?: string) {
    super('ExplorationManager', id);
    this.shipManager = shipManager;
  }

  /**
   * Get the version of this manager implementation
   */
  protected getVersion(): string {
    return '1.0.0';
  }

  /**
   * Get statistics for this manager (for monitoring)
   */
  protected getStats(): Record<string, number | string> {
    return {
      ...this.stats,
      sectorCount: this.sectors.size,
      anomalyCount: this.anomalies.size,
      activeScans: this.getActiveScans().length,
    };
  }

  /**
   * Initialize the exploration manager
   */
  protected async onInitialize(_dependencies?: Record<string, unknown>): Promise<void> {
    console.warn('ExplorationManager initialized');

    // Subscribe to ship-related events to update exploration data
    this.subscribe(EventType.STATUS_CHANGED, this.handleShipStatusChange);
  }

  /**
   * Handle updates on each tick
   */
  protected onUpdate(_deltaTime: number): void {
    // Update active scan operations
    this.updateScanOperations(_deltaTime);
  }

  /**
   * Clean up resources
   */
  protected async onDispose(): Promise<void> {
    // Clear all data
    this.sectors.clear();
    this.anomalies.clear();
    this.scanOperations.clear();
  }

  /**
   * Creates a standard ExplorationEvent
   */
  private createEvent(type: EventType, data: ExplorationEventData): ExplorationEvent {
    return {
      type,
      timestamp: Date.now(),
      moduleId: this.moduleId,
      moduleType: 'exploration' as ModuleType,
      data,
    };
  }

  /**
   * Handle ship status changes
   */
  private handleShipStatusChange = (event: ExplorationEvent): void => {
    if (!isExplorationEvent(event)) return;

    const { shipId, status } = event.data;
    if (!shipId || !status) return;

    // If the ship is no longer available, cancel its scan operations
    if (status === 'unavailable' || status === 'destroyed') {
      this.cancelScanOperationsForShip(shipId as string);
    }
  };

  /**
   * Update active scan operations
   */
  private updateScanOperations(_deltaTime: number): void {
    // Calculate progress for active scan operations
    for (const [id, operation] of this.scanOperations.entries()) {
      if (operation.status === 'active') {
        const elapsedTime = Date.now() - operation.startTime;
        const progress = Math.min(1, elapsedTime / operation.estimatedDuration);

        // Update the operation with new progress
        operation.progress = progress;

        // Check if the operation is complete
        if (progress >= 1) {
          this.completeScanOperation(id);
        }
      }
    }
  }

  /**
   * Complete a scan operation
   */
  private completeScanOperation(operationId: string): void {
    const operation = this.scanOperations.get(operationId);
    if (!operation) return;

    // Update the operation status
    operation.status = 'completed';
    operation.progress = 1;
    this.stats.completedScans++;
    this.stats.activeScans--;

    // Update the sector
    const sector = this.sectors.get(operation.sectorId);
    if (sector) {
      sector.status = 'analyzed';
      sector.lastScanned = Date.now();

      // Generate discoveries based on the scan
      this.generateDiscoveries(sector);

      // Emit a scan completed event
      this.publishEvent(
        this.createEvent(EXPLORATION_EVENTS.SCAN_COMPLETED, {
          sector,
          operation,
        })
      );
    }
  }

  /**
   * Generate discoveries (resources and anomalies) for a sector
   */
  private generateDiscoveries(sector: Sector): void {
    // Logic to generate discoveries based on sector properties
    // This is simplified for now

    // Generate resources
    const resourceCount = Math.floor(sector.resourcePotential * 5);
    if (resourceCount > 0) {
      const resources = [];
      for (let i = 0; i < resourceCount; i++) {
        const resource = {
          type: this.getRandomResourceType(),
          amount: Math.floor(Math.random() * 100) + 10,
          quality: Math.random(),
        };
        resources.push(resource);
        this.stats.resourcesDetected++;

        // Emit a resource detected event
        this.publishEvent(
          this.createEvent(EXPLORATION_EVENTS.RESOURCE_DETECTED, {
            resource,
            sector,
          })
        );
      }
      sector.resources = resources;
    }

    // Generate anomalies
    const anomalyChance = 0.3 + sector.habitabilityScore * 0.2;
    if (Math.random() < anomalyChance) {
      const anomaly: Anomaly = {
        id: uuidv4(),
        type: this.getRandomAnomalyType(),
        severity: this.getRandomSeverity(),
        description: 'Anomalous readings detected in this sector',
        position: {
          x: sector.coordinates.x + (Math.random() * 0.4 - 0.2),
          y: sector.coordinates.y + (Math.random() * 0.4 - 0.2),
        },
        discoveredAt: Date.now(),
        sectorId: sector.id,
      };

      sector.anomalies = [...(sector.anomalies || []), anomaly];
      this.anomalies.set(anomaly.id, anomaly);
      this.stats.anomaliesDetected++;

      // Emit an anomaly detected event
      this.publishEvent(
        this.createEvent(EXPLORATION_EVENTS.ANOMALY_DETECTED, {
          anomaly,
          sector,
          anomalyId: anomaly.id,
        })
      );
    }
  }

  /**
   * Start a new scan operation
   */
  private startScanOperation(shipId: string, sectorId: string): void {
    const sector = this.sectors.get(sectorId);
    if (!sector) return;

    // Create a new scan operation
    const operation: ScanOperation = {
      id: uuidv4(),
      sectorId,
      shipId,
      startTime: Date.now(),
      estimatedDuration: this.calculateScanDuration(sector),
      progress: 0,
      status: 'active',
    };

    // Add the operation to the map
    this.scanOperations.set(operation.id, operation);
    this.stats.activeScans++;

    // Update the sector status
    sector.status = 'scanning';

    // Emit a scan started event
    this.publishEvent(
      this.createEvent(EXPLORATION_EVENTS.SCAN_STARTED, {
        operation,
        sector,
        sectorId,
        shipId,
      })
    );
  }

  /**
   * Cancel scan operations for a ship
   */
  private cancelScanOperationsForShip(shipId: string): void {
    for (const [_id, operation] of this.scanOperations.entries()) {
      if (operation.shipId === shipId && operation.status === 'active') {
        operation.status = 'cancelled';
        this.stats.activeScans--;

        // Emit a scan failed event
        this.publishEvent(
          this.createEvent(EXPLORATION_EVENTS.SCAN_FAILED, {
            operation,
            reason: 'cancelled_by_ship',
            sectorId: operation.sectorId,
            shipId,
          })
        );
      }
    }
  }

  /**
   * Calculate the duration for a scan operation
   */
  private calculateScanDuration(sector: Sector): number {
    // Base duration is 30 seconds
    let duration = 30000;

    // Adjust for resource potential
    duration += sector.resourcePotential * 10000;

    // Adjust for habitability score
    duration += sector.habitabilityScore * 5000;

    // Add some randomness
    duration *= 0.8 + Math.random() * 0.4;

    return duration;
  }

  /**
   * Get a random resource type
   */
  private getRandomResourceType(): ResourceType {
    const resourceTypes = [
      ResourceType.MINERALS,
      ResourceType.ENERGY,
      ResourceType.PLASMA,
      ResourceType.GAS,
      ResourceType.EXOTIC,
      ResourceType.IRON,
      ResourceType.COPPER,
      ResourceType.TITANIUM,
      ResourceType.URANIUM,
      ResourceType.WATER,
      ResourceType.HELIUM,
      ResourceType.DEUTERIUM,
      ResourceType.ANTIMATTER,
      ResourceType.DARK_MATTER,
      ResourceType.EXOTIC_MATTER,
    ];
    return resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
  }

  /**
   * Get a random anomaly type
   */
  private getRandomAnomalyType(): string {
    const types = ['spatial', 'temporal', 'quantum', 'biological', 'gravitational', 'unknown'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Get a random severity level
   */
  private getRandomSeverity(): 'low' | 'medium' | 'high' {
    const severities = ['low', 'medium', 'high'];
    return severities[Math.floor(Math.random() * severities.length)] as 'low' | 'medium' | 'high';
  }

  /**
   * Create or add a new sector
   */
  public addSector(sectorData: Omit<Sector, 'id' | 'anomalies' | 'discoveredAt'>): Sector {
    const now = Date.now();
    const id = uuidv4();

    const sector: Sector = {
      ...sectorData,
      id,
      anomalies: [],
      discoveredAt: now,
    };

    this.sectors.set(sector.id, sector);
    this.stats.sectorsDiscovered++;

    // Emit a sector discovered event
    this.publishEvent(
      this.createEvent(EXPLORATION_EVENTS.SECTOR_DISCOVERED, {
        sector,
        sectorId: sector.id,
      })
    );

    return sector;
  }

  /**
   * Assign a ship to scan a sector
   */
  public assignShipToSector(shipId: string, sectorId: string): boolean {
    const sector = this.sectors.get(sectorId);
    if (!sector) return false;

    // Check if ship exists and update its status using the ship manager
    const ship = this.shipManager.getShipById(shipId);
    if (!ship) return false;

    // Assign the ship to the sector in the ship manager
    if (!this.shipManager.assignShipToSector(shipId, sectorId)) {
      return false;
    }

    // Start the scan operation
    this.startScanOperation(shipId, sectorId);

    // Emit a ship assigned event
    this.publishEvent(
      this.createEvent(EXPLORATION_EVENTS.SHIP_ASSIGNED, {
        sectorId,
        shipId,
        sector,
        ship,
      })
    );

    return true;
  }

  /**
   * Unassign a ship from scanning a sector
   */
  public unassignShip(shipId: string): boolean {
    // Get the ship
    const ship = this.shipManager.getShipById(shipId);
    if (!ship) return false;

    // Cancel any active scan operations
    this.cancelScanOperationsForShip(shipId);

    // Unassign the ship in the ship manager
    if (!this.shipManager.unassignShip(shipId)) {
      return false;
    }

    // Emit a ship unassigned event
    this.publishEvent(
      this.createEvent(EXPLORATION_EVENTS.SHIP_UNASSIGNED, {
        shipId,
        ship,
      })
    );

    return true;
  }

  /**
   * Get a sector by id
   */
  public getSector(sectorId: string): Sector | undefined {
    return this.sectors.get(sectorId);
  }

  /**
   * Get all sectors
   */
  public getAllSectors(): Sector[] {
    return Array.from(this.sectors.values());
  }

  /**
   * Get sectors by status
   */
  public getSectorsByStatus(status: Sector['status']): Sector[] {
    return Array.from(this.sectors.values()).filter(sector => sector.status === status);
  }

  /**
   * Get an anomaly by id
   */
  public getAnomaly(anomalyId: string): Anomaly | undefined {
    return this.anomalies.get(anomalyId);
  }

  /**
   * Get all anomalies
   */
  public getAllAnomalies(): Anomaly[] {
    return Array.from(this.anomalies.values());
  }

  /**
   * Get anomalies by sector
   */
  public getAnomaliesBySector(sectorId: string): Anomaly[] {
    return Array.from(this.anomalies.values()).filter(anomaly => anomaly.sectorId === sectorId);
  }

  /**
   * Get active scan operations
   */
  public getActiveScans(): ScanOperation[] {
    return Array.from(this.scanOperations.values()).filter(op => op.status === 'active');
  }

  /**
   * Get scan operations by sector
   */
  public getScanOperationsBySector(sectorId: string): ScanOperation[] {
    return Array.from(this.scanOperations.values()).filter(op => op.sectorId === sectorId);
  }

  /**
   * Get scan operations by ship
   */
  public getScanOperationsByShip(shipId: string): ScanOperation[] {
    return Array.from(this.scanOperations.values()).filter(op => op.shipId === shipId);
  }
}

// Mock event bus and ship manager for demonstration purposes
const shipManager = new ReconShipManagerImpl();

// Export a singleton instance of the ExplorationManager
export const explorationManager = new ExplorationManager(shipManager);

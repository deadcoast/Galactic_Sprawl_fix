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
import { ReconShipManagerImpl, ReconShipManagerEvents } from './ReconShipManager';
import { ReconShip, ShipStatus } from '../../types/ships/ShipTypes';
/**
 * @file ExplorationManagerImpl.ts
 * Implementation of the ExplorationManager that conforms to the BaseManager interface.
 * 
 * This class handles:
 * 1. Star system management and ship assignments
 * 2. Sector scanning and discovery tracking
 * 3. Integration with ship managers for operation
 * 4. Event-based communication with UI components
 */

// Define interfaces for the types used
export interface StarSystem {
  id: string;
  name: string;
  type?: string;
  resources?: ResourceType[];
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
  resources?: {
    type: ResourceType;
    amount: number;
    quality?: number;
  }[];
  position: { x: number; y: number };
  assignedShips: string[];
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
  resources?: ResourceType[];
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

// Event data interface
export interface ExplorationEventData extends Record<string, unknown> {
  sector?: Sector;
  operation?: ScanOperation;
  resource?: {
    type: ResourceType;
    amount: number;
    quality: number;
  };
  anomaly?: Anomaly;
  ship?: ReconShip;
  reason?: string;
  sectorId?: string;
  shipId?: string;
  anomalyId?: string;
}

/**
 * Exploration event interface extending BaseEvent
 */
export interface ExplorationEvent extends BaseEvent {
  type: EventType;
  moduleId: string;
  moduleType: ModuleType;
  data: ExplorationEventData;
}

// Type guard for ExplorationEvent
export function isExplorationEvent(event: unknown): event is ExplorationEvent {
  if (typeof event !== 'object' || event === null) return false;
  const potentialEvent = event as ExplorationEvent;
  return (
    typeof potentialEvent.type === 'string' &&
    typeof potentialEvent.timestamp === 'number' &&
    typeof potentialEvent.moduleId === 'string' &&
    typeof potentialEvent.moduleType === 'string' &&
    typeof potentialEvent.data === 'object'
  );
}

/**
 * ExplorationManager implements the exploration system functionality,
 * managing star systems, sectors, anomalies, and coordinating with ship operations.
 */
export class ExplorationManager extends AbstractBaseManager<ExplorationEvent> {
  private sectors: Map<string, Sector> = new Map<string, Sector>();
  private anomalies: Map<string, Anomaly> = new Map<string, Anomaly>();
  private scanOperations: Map<string, ScanOperation> = new Map<string, ScanOperation>();
  private shipManager: ReconShipManagerImpl;

  // Statistics
  private stats = {
    sectorsDiscovered: 0,
    sectorsScanned: 0,
    anomaliesDetected: 0,
    resourcesDetected: 0,
    activeScans: 0,
    completedScans: 0,
    failedScans: 0,
  };

  private moduleId: string = uuidv4();

  /**
   * Create a new ExplorationManager
   * @param shipManager The ReconShipManager implementation
   * @param id Optional manager ID
   */
  constructor(shipManager: ReconShipManagerImpl, id?: string) {
    super('ExplorationManager', id);
    this.shipManager = shipManager;

    // Listen to ship status changes using the correct event type and method
    this.shipManager.on(EventType.STATUS_CHANGED, this.handleShipStatusChange as (data: { shipId: string; status: ShipStatus; ship: ReconShip; }) => void);
  }

  /**
   * Handles ship status changes, potentially canceling scan operations.
   * This listener receives the specific payload from ReconShipManager.
   * @param payload The event payload containing ship ID, status, and ship object.
   */
  private handleShipStatusChange = (payload: {
    shipId: string;
    status: ShipStatus;
    ship: ReconShip;
  }): void => {
    const { shipId, status } = payload;
    if (status === ShipStatus.DISABLED || status === ShipStatus.DESTROYED) {
      // Find any active scan operation involving this ship
      const activeScan = Array.from(this.scanOperations.values()).find(
        (op) => op.shipId === shipId && op.status === 'active'
      );

      if (activeScan) {
        // Cancel the scan operation
        this.cancelScanOperation(activeScan.id, 'ship_unavailable');
      }
    }
  };

  /**
   * Initializes the ExplorationManager.
   */
  public onInitialize(): void {
    // Initialization logic, e.g., loading data, setting up initial state
    this.publishEvent(
      this.createEvent(EventType.MODULE_ACTIVATED, {
        status: 'active',
      })
    );
  }

  /**
   * Updates the manager's state based on the elapsed time.
   * @param deltaTime Time elapsed since the last update in milliseconds.
   */
  public onUpdate(deltaTime: number): void {
    // Update ongoing scan operations
    this.updateScanOperations(deltaTime);
  }

  /**
   * Cleans up resources when the manager is disposed.
   */
  public onDispose(): void {
    // Cleanup logic, e.g., unsubscribing from events, saving state
    this.shipManager.off(EventType.STATUS_CHANGED, this.handleShipStatusChange as (data: (payload: { shipId: string; status: ShipStatus; ship: ReconShip; }) => void) => void);
    this.publishEvent(
      this.createEvent(EventType.MODULE_DEACTIVATED, {
        status: 'inactive',
      })
    );
  }

  /**
   * Get the version of this manager implementation
   */
  protected getVersion(): string {
    return '1.1.0';
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
        this.createEvent(EventType.EXPLORATION_SCAN_COMPLETED, {
          sector,
          operation,
        })
      );
    }
  }

  /**
   * Cancel a specific scan operation by its ID.
   * @param operationId The ID of the operation to cancel.
   * @param reason A string indicating the reason for cancellation.
   */
  private cancelScanOperation(operationId: string, reason: string): void {
    const operation = this.scanOperations.get(operationId);
    if (operation && operation.status === 'active') {
      operation.status = 'cancelled';
      this.stats.activeScans--;
      this.stats.failedScans++;

      // Emit a scan failed event
      this.publishEvent(
        this.createEvent(EventType.EXPLORATION_SCAN_FAILED, {
          operation,
          reason,
          sectorId: operation.sectorId,
          shipId: operation.shipId,
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
          this.createEvent(EventType.EXPLORATION_RESOURCE_DETECTED, {
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

      sector.anomalies = [...(sector.anomalies ?? []), anomaly];
      this.anomalies.set(anomaly.id, anomaly);
      this.stats.anomaliesDetected++;

      // Emit an anomaly detected event
      this.publishEvent(
        this.createEvent(EventType.EXPLORATION_ANOMALY_DETECTED, {
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
      this.createEvent(EventType.EXPLORATION_SCAN_STARTED, {
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
    for (const operation of this.scanOperations.values()) {
      if (operation.shipId === shipId && operation.status === 'active') {
        operation.status = 'cancelled';
        this.stats.activeScans--;

        // Emit a scan failed event
        this.publishEvent(
          this.createEvent(EventType.EXPLORATION_SCAN_FAILED, {
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
      this.createEvent(EventType.EXPLORATION_SECTOR_DISCOVERED, {
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
      this.createEvent(EventType.EXPLORATION_SHIP_ASSIGNED, {
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

    // Cancel unknown active scan operations
    this.cancelScanOperationsForShip(shipId);

    // Unassign the ship in the ship manager
    if (!this.shipManager.unassignShip(shipId)) {
      return false;
    }

    // Emit a ship unassigned event
    this.publishEvent(
      this.createEvent(EventType.EXPLORATION_SHIP_UNASSIGNED, {
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

  // --- New Methods for Ship Manager Interaction ---

  /**
   * Retrieves all reconnaissance ships managed by the internal ship manager.
   * @returns An array of ReconShip objects.
   */
  public getAllReconShips(): ReconShip[] {
    return this.shipManager.getAllShips();
  }

  /**
   * Add a listener for a specific event type from the ReconShipManager.
   * @param eventType The type of event to listen for (must be a key of ReconShipManagerEvents).
   * @param listener The function to call when the event is emitted.
   */
  public addReconShipListener<K extends keyof ReconShipManagerEvents>(
    eventType: K,
    listener: ReconShipManagerEvents[K]
  ): void {
    // Use the 'on' method provided by TypedEventEmitter
    this.shipManager.on(eventType, listener);
  }

  /**
   * Remove a listener for a specific event type from the ReconShipManager.
   * @param eventType The type of event to stop listening for (must be a key of ReconShipManagerEvents).
   * @param listener The listener function to remove.
   */
  public removeReconShipListener<K extends keyof ReconShipManagerEvents>(
    eventType: K,
    listener: ReconShipManagerEvents[K]
  ): void {
    // Use the 'off' method provided by TypedEventEmitter
    this.shipManager.off(eventType, listener);
  }

  // --- Initialization and Teardown ---
}

// Mock event bus and ship manager for demonstration purposes
const shipManager = new ReconShipManagerImpl();

// Export a singleton instance of the ExplorationManager
export const explorationManager = new ExplorationManager(shipManager);

import { ResourceType } from './../types/resources/ResourceTypes';
/**
 * @file DataCollectionService.ts
 * Service for collecting and preprocessing data for analysis
 *
 * This service:
 * 1. Subscribes to relevant exploration events
 * 2. Preprocesses data into standardized formats
 * 3. Provides filtering and sampling capabilities
 * 4. Manages caching for improved performance
 * 5. Performs data validation and enrichment
 */

import { v4 as uuidv4 } from 'uuid';
import {
    Anomaly, ExplorationManager,
    Sector
} from '../managers/exploration/ExplorationManager';
import { BaseEvent, EventType } from '../types/events/EventTypes';
import { DataPoint, ResourceData } from '../types/exploration/DataAnalysisTypes';
import {
    errorLoggingService,
    ErrorSeverity,
    ErrorType
} from './logging/ErrorLoggingService';

/**
 * Local constants for exploration event types
 * Maps directly to EventType enum values for type safety
 */
const EXPLORATION_EVENTS = {
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

// Define PropertyType for DataPoint properties to fix type issues
type PropertyType = string | number | boolean | string[];

// Interface for coordinates to ensure proper structure
interface Coordinates {
  x: number;
  y: number;
}

// Cache interface for storing processed data
interface DataCache {
  sectors: Map<string, DataPoint>;
  anomalies: Map<string, DataPoint>;
  resources: Map<string, DataPoint>;
  lastUpdated: Record<string, number>;
}

/**
 * Helper function to safely access a nested property from an object
 * with type checking
 *
 * @param obj The object to access properties from
 * @param path The dot-separated path to the property
 * @returns The property value or undefined if not found
 */
function getNestedProperty(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Type-safe helper for checking if a value is a valid DataPoint property
 *
 * @param value The value to check
 * @returns True if the value is a valid DataPoint property
 */
function isValidDataPointProperty(value: unknown): value is PropertyType {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    (Array.isArray(value) && value.every(item => typeof item === 'string'))
  );
}

// Custom type guard to validate Sector objects
function isSector(obj: unknown): obj is Sector {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const sector = obj as Partial<Sector>;
  return (
    typeof sector.id === 'string' &&
    typeof sector.name === 'string' &&
    typeof sector.status === 'string'
  );
}

// Custom type guard to validate Anomaly objects
function isAnomaly(obj: unknown): obj is Anomaly {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const anomaly = obj as Partial<Anomaly>;
  return (
    typeof anomaly.id === 'string' &&
    typeof anomaly.type === 'string' &&
    typeof anomaly.sectorId === 'string'
  );
}

// Custom type guard to validate ResourceData objects
function isResourceData(obj: unknown): obj is ResourceData {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const resource = obj as Partial<ResourceData>;
  return typeof resource.type === 'string' && typeof resource.amount === 'number';
}

/**
 * Convert exploration event key to EventType
 * @param event The exploration event key
 * @returns The corresponding EventType
 */
function asEventType(event: keyof typeof EXPLORATION_EVENTS): EventType {
  return EXPLORATION_EVENTS[event];
}

/**
 * Check if a BaseEvent has the expected exploration event type
 * @param event The event to check
 * @param expectedType The expected exploration event type
 * @returns True if the event is of the expected type, false otherwise
 */
function isExplorationEventOfType(
  event: BaseEvent,
  expectedType: keyof typeof EXPLORATION_EVENTS
): boolean {
  return event?.type === EXPLORATION_EVENTS[expectedType];
}

/**
 * Create type guards for exploration event data types
 */

/**
 * Type guard for sector discovery event data
 */
interface SectorDiscoveryEventData {
  sector: Sector;
  [key: string]: unknown;
}

function isSectorDiscoveryEventData(data: unknown): data is SectorDiscoveryEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const eventData = data as Partial<SectorDiscoveryEventData>;
  return !!eventData.sector && isSector(eventData.sector);
}

/**
 * Type guard for anomaly detection event data
 */
interface AnomalyDetectionEventData {
  anomaly: Anomaly;
  sectorId: string;
  [key: string]: unknown;
}

function isAnomalyDetectionEventData(data: unknown): data is AnomalyDetectionEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const eventData = data as Partial<AnomalyDetectionEventData>;
  return (
    !!eventData.anomaly && isAnomaly(eventData.anomaly) && typeof eventData.sectorId === 'string'
  );
}

/**
 * Type guard for resource detection event data
 */
interface ResourceDetectionEventData {
  resource: ResourceData;
  sectorId: string;
  [key: string]: unknown;
}

function isResourceDetectionEventData(data: unknown): data is ResourceDetectionEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const eventData = data as Partial<ResourceDetectionEventData>;
  return (
    !!eventData.resource &&
    isResourceData(eventData.resource) &&
    typeof eventData.sectorId === 'string'
  );
}

/**
 * Type definitions for aggregation operations
 */

/**
 * Type-safe aggregation function
 */
type AggregationFunction = 'sum' | 'avg' | 'min' | 'max' | 'count';

/**
 * Interface for aggregation operations
 */
interface AggregationOperation {
  field: string;
  function: AggregationFunction;
  outputField: string;
}

/**
 * Aggregation result interface with properly typed groupValue
 */
interface AggregationResult extends Record<string, unknown> {
  groupValue: string | number | boolean;
}

/**
 * Service for collecting and preprocessing exploration data
 */
export class DataCollectionService {
  private eventSubscriptions: (() => void)[] = [];
  private cache: DataCache = {
    sectors: new Map(),
    anomalies: new Map(),
    resources: new Map(),
    lastUpdated: {
      sectors: 0,
      anomalies: 0,
      resources: 0,
    },
  };

  // Set a callback for data updates
  private onDataUpdated?: (type: 'sector' | 'anomaly' | 'resource', dataPoint: DataPoint) => void;

  // Track statistics about collected data
  private stats = {
    totalSectors: 0,
    totalAnomalies: 0,
    totalResources: 0,
    lastCollectionTime: 0,
    processingTimes: [] as number[],
    averageProcessingTime: 0,
  };

  constructor(private explorationManager: ExplorationManager) {}

  /**
   * Initialize the service and subscribe to events
   */
  public initialize(): void {
    this.subscribeToEvents();
    this.stats.lastCollectionTime = Date.now();
  }

  /**
   * Clean up resources used by the service
   */
  public dispose(): void {
    // Unsubscribe from all events
    this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
    this.eventSubscriptions = [];

    // Clear cache
    this.cache.sectors.clear();
    this.cache.anomalies.clear();
    this.cache.resources.clear();
  }

  /**
   * Set a callback to be called when data is updated
   * @param callback The callback function
   */
  public setOnDataUpdated(
    callback: (type: 'sector' | 'anomaly' | 'resource', dataPoint: DataPoint) => void
  ): void {
    this.onDataUpdated = callback;
  }

  /**
   * Get statistics about the data collection process
   */
  public getStats(): {
    totalSectors: number;
    totalAnomalies: number;
    totalResources: number;
    lastCollectionTime: number;
    averageProcessingTime: number;
  } {
    const avgTime = this.stats.processingTimes.length
      ? this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length
      : 0;

    return {
      totalSectors: this.stats.totalSectors,
      totalAnomalies: this.stats.totalAnomalies,
      totalResources: this.stats.totalResources,
      lastCollectionTime: this.stats.lastCollectionTime,
      averageProcessingTime: avgTime,
    };
  }

  /**
   * Subscribe to relevant exploration events
   */
  private subscribeToEvents(): void {
    try {
      // Subscribe to sector discovery events
      const unsubscribeSectorDiscovered = this.explorationManager.subscribeToEvent(
        EXPLORATION_EVENTS.SECTOR_DISCOVERED,
        this.handleSectorDiscovered.bind(this)
      );

      // Subscribe to sector scanning events
      const unsubscribeSectorScanned = this.explorationManager.subscribeToEvent(
        EXPLORATION_EVENTS.SECTOR_SCANNED,
        this.handleSectorScanned.bind(this)
      );

      // Subscribe to anomaly detection events
      const unsubscribeAnomalyDetected = this.explorationManager.subscribeToEvent(
        EXPLORATION_EVENTS.ANOMALY_DETECTED,
        this.handleAnomalyDetected.bind(this)
      );

      // Subscribe to resource detection events
      const unsubscribeResourceDetected = this.explorationManager.subscribeToEvent(
        EXPLORATION_EVENTS.RESOURCE_DETECTED,
        this.handleResourceDetected.bind(this)
      );

      // Store unsubscribe functions for cleanup
      this.eventSubscriptions.push(
        unsubscribeSectorDiscovered,
        unsubscribeSectorScanned,
        unsubscribeAnomalyDetected,
        unsubscribeResourceDetected
      );
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Error subscribing to exploration events'),
        ErrorType.EVENT_HANDLING,
        ErrorSeverity.HIGH,
        { componentName: 'DataCollectionService', action: 'subscribeToEvents' }
      );
    }
  }

  /**
   * Handle sector discovery events with proper type validation
   */
  private handleSectorDiscovered(event: BaseEvent): void {
    // Ensure this is the correct event type
    if (!isExplorationEventOfType(event, 'SECTOR_DISCOVERED')) {
      console.warn('Incorrect event type received:', event?.type);
      return;
    }

    // Validate event data
    if (!isSectorDiscoveryEventData(event.data)) {
      console.warn('Invalid sector discovery event data:', event.data);
      return;
    }

    const { sector } = event.data;
    const dataPoint = this.processSectorData(sector);

    // Calculate processing time and update stats
    const processingTime = Date.now() - (event.timestamp || Date.now());
    this.stats.totalSectors += 1;
    this.stats.averageProcessingTime =
      (this.stats.averageProcessingTime * (this.stats.totalSectors - 1) + processingTime) /
      this.stats.totalSectors;
    this.stats.lastCollectionTime = Date.now();

    // Store in cache
    this.cache.sectors.set(dataPoint.id, dataPoint);
    this.cache.lastUpdated.sectors = Date.now();

    // Notify listener if registered
    if (this.onDataUpdated) {
      this.onDataUpdated('sector', dataPoint);
    }
  }

  /**
   * Handle sector scanning events with proper type validation
   */
  private handleSectorScanned(event: BaseEvent): void {
    // Ensure this is the correct event type
    if (!isExplorationEventOfType(event, 'SECTOR_SCANNED')) {
      console.warn('Incorrect event type received:', event?.type);
      return;
    }

    // Similar to sector discovery but with updated data
    if (!isSectorDiscoveryEventData(event.data)) {
      console.warn('Invalid sector scan event data:', event.data);
      return;
    }

    const { sector } = event.data;
    const dataPoint = this.processSectorData(sector);

    // Update cache
    this.cache.sectors.set(dataPoint.id, dataPoint);
    this.cache.lastUpdated.sectors = Date.now();

    // Notify listener if registered
    if (this.onDataUpdated) {
      this.onDataUpdated('sector', dataPoint);
    }
  }

  /**
   * Handle anomaly detection events with proper type validation
   */
  private handleAnomalyDetected(event: BaseEvent): void {
    // Ensure this is the correct event type
    if (!isExplorationEventOfType(event, 'ANOMALY_DETECTED')) {
      console.warn('Incorrect event type received:', event?.type);
      return;
    }

    // Validate event data
    if (!isAnomalyDetectionEventData(event.data)) {
      console.warn('Invalid anomaly detection event data:', event.data);
      return;
    }

    const { anomaly } = event.data;
    const dataPoint = this.processAnomalyData(anomaly);

    // Update stats
    this.stats.totalAnomalies += 1;
    this.stats.lastCollectionTime = Date.now();

    // Store in cache
    this.cache.anomalies.set(dataPoint.id, dataPoint);
    this.cache.lastUpdated.anomalies = Date.now();

    // Notify listener if registered
    if (this.onDataUpdated) {
      this.onDataUpdated('anomaly', dataPoint);
    }
  }

  /**
   * Handle resource detection events with proper type validation
   */
  private handleResourceDetected(event: BaseEvent): void {
    // Ensure this is the correct event type
    if (!isExplorationEventOfType(event, 'RESOURCE_DETECTED')) {
      console.warn('Incorrect event type received:', event?.type);
      return;
    }

    // Validate event data
    if (!isResourceDetectionEventData(event.data)) {
      console.warn('Invalid resource detection event data:', event.data);
      return;
    }

    const { resource } = event.data;
    const dataPoint = this.processResourceData(resource);

    // Update stats
    this.stats.totalResources += 1;
    this.stats.lastCollectionTime = Date.now();

    // Store in cache
    this.cache.resources.set(dataPoint.id, dataPoint);
    this.cache.lastUpdated.resources = Date.now();

    // Notify listener if registered
    if (this.onDataUpdated) {
      this.onDataUpdated('resource', dataPoint);
    }
  }

  /**
   * Process sector data into a standardized format
   */
  private processSectorData(sector: Sector): DataPoint {
    // Ensure coordinates are valid
    const coordinates: Coordinates = {
      x: sector.coordinates?.x ?? 0,
      y: sector.coordinates?.y ?? 0,
    };

    // Extract additional metadata that might be useful for analysis
    const metadata: Record<string, PropertyType> = {
      anomalyIds: sector.anomalies?.map(a => a.id) ?? [],
      resourceTypes: sector.resources?.map(r => r.type) ?? [],
      lastUpdated: sector.lastScanned || Date.now(),
    };

    // Add region information if available
    if (sector.coordinates) {
      metadata.region = `${sector.coordinates.x},${sector.coordinates.y}`;
    }

    // Calculate additional derived properties
    const anomalyCount = sector.anomalies?.length ?? 0;
    const resourceCount = sector.resources?.length ?? 0;
    const explorationScore = this.calculateExplorationScore(
      sector.habitabilityScore ?? 0,
      sector.resourcePotential ?? 0,
      anomalyCount
    );

    return {
      id: sector.id,
      type: 'sector',
      name: sector.name,
      date: sector.discoveredAt || Date.now(),
      coordinates,
      properties: {
        status: sector.status,
        resourcePotential: sector.resourcePotential ?? 0,
        habitabilityScore: sector.habitabilityScore ?? 0,
        anomalyCount,
        resourceCount,
        lastScanned: sector.lastScanned ?? 0,
        explorationScore,
      },
      metadata,
    };
  }

  /**
   * Process anomaly data into a standardized format
   */
  private processAnomalyData(anomaly: Anomaly): DataPoint {
    // Create enhanced metadata
    let metadata: Record<string, PropertyType> = {};

    // Add unknown existing metadata from anomaly.data
    if (typeof anomaly.data === 'object' && anomaly.data !== null) {
      Object.entries(anomaly.data).forEach(([key, value]) => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          (Array.isArray(value) && value.every(item => typeof item === 'string'))
        ) {
          metadata[key] = value as PropertyType;
        } else if (value !== undefined && value !== null) {
          // Convert non-matching types to string if possible
          metadata[key] = String(value);
        }
      });
    }

    // Add investigation status metadata
    metadata.investigated = !!anomaly.investigatedAt;
    metadata.investigationAge = anomaly.investigatedAt ? Date.now() - anomaly.investigatedAt : 0;

    // Fix the type mismatch in calculateRiskAssessment call
    // Convert anomaly.severity from string to number
    const severityAsNumber =
      typeof anomaly.severity === 'string'
        ? (parseFloat(anomaly.severity) ?? 0)
        : (anomaly.severity ?? 0);

    // Calculate risk assessment based on severity and type
    const riskAssessment = this.calculateRiskAssessment(severityAsNumber, anomaly.type);
    if (!metadata) {
      metadata = {};
    }
    metadata.riskAssessment = riskAssessment;

    // Ensure coordinates are valid
    const coordinates: Coordinates = {
      x: anomaly.position?.x ?? 0,
      y: anomaly.position?.y ?? 0,
    };

    return {
      id: anomaly.id,
      type: 'anomaly',
      name: `${anomaly.type} Anomaly`,
      date: anomaly.discoveredAt,
      coordinates,
      properties: {
        type: anomaly.type,
        severity: anomaly.severity,
        description: anomaly.description,
        investigatedAt: anomaly.investigatedAt ?? 0,
        sectorId: anomaly.sectorId,
        riskFactor: this.calculateRiskFactor(severityAsNumber, riskAssessment),
      },
      metadata,
    };
  }

  /**
   * Process resource data into a standardized format
   */
  private processResourceData(resource: ResourceData): DataPoint {
    // Ensure coordinates are provided with defaults
    // Handle the type more explicitly to avoid property access issues
    const resourceCoords = resource.coordinates as { x?: number; y?: number } | undefined;
    const coordinates: Coordinates = {
      x: resourceCoords?.x ?? 0,
      y: resourceCoords?.y ?? 0,
    };

    // Cast accessibility to ensure it's a PropertyType
    const accessibility = resource.accessibility !== undefined ? Number(resource.accessibility) : 1;

    // Create enhanced metadata
    const metadata: Record<string, PropertyType> = {
      estimatedValue: resource.amount * (resource.quality || 1),
      accessibility,
      harvestEfficiency: this.calculateHarvestEfficiency(accessibility, resource.quality || 1),
    };

    // Add extraction difficulty if available
    if (resource.extractionDifficulty !== undefined) {
      metadata.extractionDifficulty = Number(resource.extractionDifficulty);
    }

    // Add purity grade based on quality
    metadata.purityGrade = this.calculatePurityGrade(resource.quality || 1);

    // Add resource density if available or calculate a default
    metadata.density =
      resource.density !== undefined ? Number(resource.density) : resource.amount / 100;

    // Calculate resource potential score
    const potentialScore = this.calculateResourcePotential(
      resource.amount,
      resource.quality || 1,
      accessibility
    );

    // Add additional resource data if available
    if (typeof resource.data === 'object' && resource.data !== null) {
      Object.entries(resource.data).forEach(([key, value]) => {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          (Array.isArray(value) && value.every(item => typeof item === 'string'))
        ) {
          metadata[key] = value as PropertyType;
        }
      });
    }

    return {
      id: resource.sectorId ? `${resource.sectorId}-${resource.type}` : uuidv4(),
      type: 'resource',
      name: `${resource.type} Resource`,
      date: Date.now(),
      coordinates,
      properties: {
        type: resource.type,
        amount: resource.amount,
        quality: resource.quality || 1,
        sectorId: resource.sectorId ?? '',
        potentialScore,
      },
      metadata,
    };
  }

  /**
   * Calculate an exploration score for a sector based on its properties
   */
  private calculateExplorationScore(
    habitability: number,
    resourcePotential: number,
    anomalyCount: number
  ): number {
    // Higher values of each component increase the score
    // Anomalies add significant value to exploration
    const habitabilityFactor = habitability * 0.3;
    const resourceFactor = resourcePotential * 0.4;
    const anomalyFactor = Math.min(anomalyCount * 0.1, 0.3); // Cap at 30% influence

    // Calculate score on a scale of 0-100
    const score = (habitabilityFactor + resourceFactor + anomalyFactor) * 100;

    // Ensure score is within 0-100 range
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate a risk assessment value for an anomaly
   */
  private calculateRiskAssessment(severity: number, type: string): number {
    // Base risk is determined by severity (0-10 scale)
    let riskBase = severity ?? 0;

    // Adjust risk based on anomaly type
    // Higher risk for dangerous anomaly types
    const highRiskTypes = ['radiation', 'temporal', 'gravitational', 'void'];
    const mediumRiskTypes = ['magnetic', 'spatial', ResourceType.ENERGY];

    if (highRiskTypes.some(t => type.toLowerCase().includes(t))) {
      riskBase *= 1.5; // 50% higher risk
    } else if (mediumRiskTypes.some(t => type.toLowerCase().includes(t))) {
      riskBase *= 1.2; // 20% higher risk
    }

    // Normalize to 0-10 scale
    return Math.min(10, Math.max(0, riskBase));
  }

  /**
   * Calculate a risk factor combining severity and risk assessment
   */
  private calculateRiskFactor(severity: number, riskAssessment: number): number {
    // Combined measure considering both severity and risk assessment
    return severity * 0.6 + riskAssessment * 0.4;
  }

  /**
   * Calculate a harvest efficiency rating based on accessibility and quality
   */
  private calculateHarvestEfficiency(accessibility: number, quality: number): number {
    // Higher quality resources with better accessibility are more efficient to harvest
    // Efficiency is on a 0-1 scale
    const accessibilityFactor = Math.min(1, Math.max(0, accessibility));
    const qualityFactor = quality / 10; // Normalize quality to 0-1 range (assuming quality 0-10)

    return accessibilityFactor * (0.7 + qualityFactor * 0.3); // Accessibility has more weight
  }

  /**
   * Calculate resource potential score based on key factors
   */
  private calculateResourcePotential(
    amount: number,
    quality: number,
    accessibility: number
  ): number {
    // Normalize inputs
    const normalizedAmount = Math.min(1, amount / 1000); // Cap at 1000 units
    const normalizedQuality = quality / 10; // Assuming quality range 0-10
    const normalizedAccessibility = Math.min(1, Math.max(0, accessibility));

    // Weight factors differently based on importance
    const amountWeight = 0.5;
    const qualityWeight = 0.3;
    const accessibilityWeight = 0.2;

    // Calculate weighted score
    const score =
      normalizedAmount * amountWeight +
      normalizedQuality * qualityWeight +
      normalizedAccessibility * accessibilityWeight;

    // Return score on 0-100 scale
    return Math.round(score * 100);
  }

  /**
   * Determine purity grade based on quality value
   */
  private calculatePurityGrade(quality: number): string {
    if (quality >= 9) {
      return 'Ultra-Pure';
    }
    if (quality >= 7) {
      return 'Premium';
    }
    if (quality >= 5) {
      return 'Standard';
    }
    if (quality >= 3) {
      return 'Low-Grade';
    }
    return 'Impure';
  }

  /**
   * Get all cached sector data
   */
  public getSectorData(): DataPoint[] {
    return Array.from(this.cache.sectors.values());
  }

  /**
   * Get all cached anomaly data
   */
  public getAnomalyData(): DataPoint[] {
    return Array.from(this.cache.anomalies.values());
  }

  /**
   * Get all cached resource data
   */
  public getResourceData(): DataPoint[] {
    return Array.from(this.cache.resources.values());
  }

  /**
   * Get all data of a specific type
   */
  public getData(type: 'sector' | 'anomaly' | 'resource'): DataPoint[] {
    switch (type) {
      case 'sector':
        return this.getSectorData();
      case 'anomaly':
        return this.getAnomalyData();
      case 'resource':
        return this.getResourceData();
      default:
        return [];
    }
  }

  /**
   * Get all data as a single array
   */
  public getAllData(): DataPoint[] {
    return [...this.getSectorData(), ...this.getAnomalyData(), ...this.getResourceData()];
  }

  /**
   * Filter data by property values
   */
  public filterData(
    data: DataPoint[],
    filters: {
      field: string;
      operator:
        | 'equals'
        | 'notEquals'
        | 'greaterThan'
        | 'lessThan'
        | 'contains'
        | 'notContains'
        | 'between';
      value: string | number | boolean | string[] | [number, number];
    }[]
  ): DataPoint[] {
    if (!filters.length) {
      return data;
    }

    return data?.filter(dataPoint => {
      return filters.every(filter => {
        const fieldParts = filter.field.split('.');
        let currentValue: unknown = dataPoint;

        // Traverse nested properties
        for (const part of fieldParts) {
          if (currentValue === undefined || currentValue === null) {
            return false;
          }
          currentValue = (currentValue as Record<string, unknown>)[part];
        }

        // Apply filter based on operator
        switch (filter.operator) {
          case 'equals':
            return currentValue === filter.value;
          case 'notEquals':
            return currentValue !== filter.value;
          case 'greaterThan':
            return (
              typeof currentValue === 'number' &&
              typeof filter.value === 'number' &&
              currentValue > filter.value
            );
          case 'lessThan':
            return (
              typeof currentValue === 'number' &&
              typeof filter.value === 'number' &&
              currentValue < filter.value
            );
          case 'contains':
            if (typeof currentValue === 'string' && typeof filter.value === 'string') {
              return currentValue.toLowerCase().includes(filter.value.toLowerCase());
            }
            if (Array.isArray(currentValue) && !Array.isArray(filter.value)) {
              return currentValue.includes(filter.value);
            }
            return false;
          case 'notContains':
            if (typeof currentValue === 'string' && typeof filter.value === 'string') {
              return !currentValue.toLowerCase().includes(filter.value.toLowerCase());
            }
            if (Array.isArray(currentValue) && !Array.isArray(filter.value)) {
              return !currentValue.includes(filter.value);
            }
            return false;
          case 'between':
            if (
              typeof currentValue === 'number' &&
              Array.isArray(filter.value) &&
              filter.value.length === 2 &&
              typeof filter.value[0] === 'number' &&
              typeof filter.value[1] === 'number'
            ) {
              return currentValue >= filter.value[0] && currentValue <= filter.value[1];
            }
            return false;
          default:
            return false;
        }
      });
    });
  }

  /**
   * Get the last update time for a specific data type
   */
  public getLastUpdated(type: 'sector' | 'anomaly' | 'resource'): number {
    return this.cache.lastUpdated[type];
  }

  /**
   * Transform data points using a custom transformation function with type safety
   *
   * @param data Array of DataPoints to transform
   * @param transformFn Function that transforms a DataPoint
   * @returns Array of transformed DataPoints
   */
  public transformData(
    data: DataPoint[],
    transformFn: (dataPoint: DataPoint) => Partial<DataPoint>
  ): DataPoint[] {
    return data?.map(dataPoint => {
      const transformed = transformFn(dataPoint);

      // Validate transformed data
      if (!transformed || typeof transformed !== 'object') {
        console.warn('Invalid transformation result:', transformed);
        return dataPoint;
      }

      // Apply transformation and ensure required properties are preserved
      return {
        ...dataPoint,
        ...transformed,
        // Ensure id and type are always preserved
        id: transformed.id || dataPoint.id,
        type: transformed.type || dataPoint.type,
      };
    });
  }

  private isStringOrNumberOrBoolean(value: unknown): value is string | number | boolean {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
  }

  /**
   * Apply an aggregation function to a set of values
   *
   * @param values Array of values to aggregate
   * @param aggregationFn The aggregation function to apply
   * @returns The result of the aggregation
   */
  private applyAggregation(values: unknown[], aggregationFn: AggregationFunction): number {
    // Filter out non-numeric values
    const numericValues = values.filter(
      value => typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))
    );

    // Convert to numbers
    const numbers = numericValues.map(v => (typeof v === 'number' ? v : Number(v)));

    if (numbers.length === 0) {
      return 0;
    }

    // Apply the aggregation function
    switch (aggregationFn) {
      case 'sum':
        return numbers.reduce((sum, value) => sum + value, 0);
      case 'avg':
        return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
      case 'min':
        return Math.min(...numbers);
      case 'max':
        return Math.max(...numbers);
      case 'count':
        return numbers.length;
      default:
        return 0;
    }
  }

  /**
   * Aggregate data by a group field and apply aggregation functions
   *
   * @param data The data points to aggregate
   * @param groupByField The field to group by
   * @param aggregations The aggregation operations to perform
   * @returns Array of aggregation results
   */
  public aggregateData(
    data: DataPoint[],
    groupByField: string,
    aggregations: AggregationOperation[]
  ): AggregationResult[] {
    // Group data by the specified field
    const groups = new Map<string | number | boolean, DataPoint[]>();

    // First pass: group the data
    data?.forEach(dataPoint => {
      const groupValue = getNestedProperty(dataPoint, groupByField);

      // Skip items where the group value isn't a valid primitive type
      if (!this.isStringOrNumberOrBoolean(groupValue)) {
        return;
      }

      // Add to group
      const group = groups.get(groupValue) ?? [];
      group.push(dataPoint);
      groups.set(groupValue, group);
    });

    // Second pass: calculate aggregations
    const results: AggregationResult[] = [];

    groups.forEach((groupData, groupValue) => {
      const result: AggregationResult = {
        groupValue,
      };

      // Apply each aggregation function
      aggregations.forEach(agg => {
        // Get values for the field from all items in the group
        const values = groupData.map(dataPoint => getNestedProperty(dataPoint, agg.field));

        // Apply the aggregation function
        result[agg.outputField] = this.applyAggregation(values, agg.function);
      });

      results.push(result);
    });

    return results;
  }
}

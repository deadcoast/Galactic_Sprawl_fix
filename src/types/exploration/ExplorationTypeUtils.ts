/**
 * @context: type-definitions, exploration-system
 *
 * Exploration Type Utilities
 *
 * This file contains utility functions for working with exploration types,
 * including type conversion functions, validation, and helper functions.
 */

import { ResourceType } from '../resources/ResourceTypes';
import { DataPoint } from './DataAnalysisTypes';
import
  {
    AnalysisResult,
    AnalysisType,
    Anomaly,
    AnomalyType,
    Coordinates,
    DangerLevel,
    Effect,
    EffectType,
    ExplorationStatus,
    InvestigationStage,
    ResourceDeposit,
    Sector,
    VisualData
  } from './ExplorationTypes';

// =========================================
// Type Conversion Utilities
// =========================================

/**
 * Convert a DataPoint to a Coordinates object
 */
export function dataPointToCoordinates(dataPoint: DataPoint): Coordinates {
  return {
    id: `coord-${dataPoint.id}`,
    x: dataPoint.coordinates.x,
    y: dataPoint.coordinates.y,
    z: dataPoint.properties?.z as number | undefined,
    sector: dataPoint.properties?.sector as string | undefined,
    quadrant: dataPoint.properties?.quadrant as string | undefined,
  };
}

/**
 * Convert a DataPoint to an Anomaly
 */
export function dataPointToAnomaly(dataPoint: DataPoint): Anomaly {
  // Create default visual data if not provided
  const defaultVisualData: VisualData = {
    primaryColor: '#FF5500',
    secondaryColor: '#AA3300',
    pattern: 'pulse',
    intensity: 75,
    size: 2,
    animation: 'flicker',
  };

  // Get visual data from properties or use default
  // Must cast to unknown first before casting to VisualData to avoid type errors
  let visualData: VisualData | undefined;
  if (dataPoint.properties?.visualData) {
    // Safe type casting pattern following Type Safety Pattern
    visualData = dataPoint.properties.visualData as unknown as VisualData;
  } else {
    visualData = defaultVisualData;
  }

  return {
    id: dataPoint.id,
    name: dataPoint.name,
    type: 'anomaly',
    anomalyType: determineAnomalyType(dataPoint),
    intensity: (dataPoint.properties?.intensity as number) || 50,
    stability: (dataPoint.properties?.stability as number) || 50,
    discoveredAt: dataPoint.date,
    coordinates: dataPointToCoordinates(dataPoint),
    explorationStatus: ExplorationStatus.DETECTED,
    composition: [],
    effects: [],
    investigation: {
      status: InvestigationStage.NOT_STARTED,
      progress: 0,
      findings: [],
      requiredEquipment: [],
      recommendedActions: [],
    },
    potentialUses: [],
    dangerLevel: determineDangerLevel(dataPoint),
    visualData,
  };
}

/**
 * Convert a DataPoint to a ResourceDeposit
 */
export function dataPointToResourceDeposit(dataPoint: DataPoint): ResourceDeposit {
  return {
    id: dataPoint.id,
    type: determineResourceType(dataPoint),
    amount: (dataPoint.properties?.amount as number) || 100,
    quality: (dataPoint.properties?.quality as number) || 50,
    accessibility: (dataPoint.properties?.accessibility as number) || 50,
    coordinates: dataPointToCoordinates(dataPoint),
    explorationStatus: ExplorationStatus.DETECTED,
    discoveredAt: dataPoint.date,
  };
}

/**
 * Convert a DataPoint to a Sector
 */
export function dataPointToSector(dataPoint: DataPoint): Sector {
  return {
    id: dataPoint.id,
    name: dataPoint.name,
    type: 'sector',
    discoveredAt: dataPoint.date,
    coordinates: dataPointToCoordinates(dataPoint),
    explorationStatus: ExplorationStatus.DETECTED,
    systems: [],
    resources: [],
    anomalies: [],
    tradeRoutes: [],
    dangerLevel: determineDangerLevel(dataPoint),
    environmentalConditions: [],
    // Required property for Sector - add with default value
    accessibility: (dataPoint.properties?.accessibility as number) || 50,
  };
}

/**
 * Convert an Anomaly to a DataPoint
 */
export function anomalyToDataPoint(anomaly: Anomaly): DataPoint {
  // Safe properties that follow type requirements for DataPoint.properties
  const safeProperties: Record<string, string | number | boolean | string[]> = {
    anomalyType: anomaly.anomalyType,
    intensity: anomaly.intensity,
    stability: anomaly.stability,
    dangerLevel: anomaly.dangerLevel,
  };

  // Add coordinates properties safely with proper type guards
  if (typeof anomaly.coordinates.z === 'number') {
    safeProperties.z = anomaly.coordinates.z;
  }

  if (typeof anomaly.coordinates.sector === 'string') {
    safeProperties.sector = anomaly.coordinates.sector;
  }

  if (typeof anomaly.coordinates.quadrant === 'string') {
    safeProperties.quadrant = anomaly.coordinates.quadrant;
  }

  // Serialize visualData as JSON string if available
  if (anomaly.visualData) {
    safeProperties.serializedVisualData = JSON.stringify(anomaly.visualData);
  }

  return {
    id: anomaly.id,
    type: 'anomaly',
    name: anomaly.name,
    date: anomaly.discoveredAt,
    coordinates: {
      x: anomaly.coordinates.x,
      y: anomaly.coordinates.y,
    },
    properties: safeProperties,
  };
}

/**
 * Convert a ResourceDeposit to a DataPoint
 * @private Use the exported version from the export statement below
 */
function _resourceDepositToDataPoint(resource: ResourceDeposit): DataPoint {
  // Safe properties that follow type requirements for DataPoint.properties
  const safeProperties: Record<string, string | number | boolean | string[]> = {
    resourceType: resource.type,
    amount: resource.amount,
    quality: resource.quality,
    accessibility: resource.accessibility,
  };

  // Add coordinates properties safely with proper type guards
  if (typeof resource.coordinates.z === 'number') {
    safeProperties.z = resource.coordinates.z;
  }

  if (typeof resource.coordinates.sector === 'string') {
    safeProperties.sector = resource.coordinates.sector;
  }

  if (typeof resource.coordinates.quadrant === 'string') {
    safeProperties.quadrant = resource.coordinates.quadrant;
  }

  return {
    id: resource.id,
    type: 'resource',
    name: `${resource.type} Deposit`,
    date: resource.discoveredAt ?? Date.now(),
    coordinates: {
      x: resource.coordinates.x,
      y: resource.coordinates.y,
    },
    properties: safeProperties,
  };
}

/**
 * Convert a Sector to a DataPoint
 * @private Use the exported version from the export statement below
 */
function _sectorToDataPoint(sector: Sector): DataPoint {
  // Safe properties that follow type requirements for DataPoint.properties
  const safeProperties: Record<string, string | number | boolean | string[]> = {
    dangerLevel: sector.dangerLevel,
    systemCount: sector.systems.length,
    anomalyCount: sector.anomalies.length,
    resourceCount: sector.resources.length,
    accessibility: sector.accessibility,
  };

  // Add coordinates properties safely with proper type guards
  if (typeof sector.coordinates.z === 'number') {
    safeProperties.z = sector.coordinates.z;
  }

  if (typeof sector.coordinates.quadrant === 'string') {
    safeProperties.quadrant = sector.coordinates.quadrant;
  }

  // Add faction control if available
  if (sector.factionControl?.factionName) {
    safeProperties.factionControl = sector.factionControl.factionName;
  }

  return {
    id: sector.id,
    type: 'sector',
    name: sector.name,
    date: sector.discoveredAt,
    coordinates: {
      x: sector.coordinates.x,
      y: sector.coordinates.y,
    },
    properties: safeProperties,
  };
}

// =========================================
// Helper Functions
// =========================================

/**
 * Determine anomaly type based on data point properties
 */
function determineAnomalyType(dataPoint: DataPoint): AnomalyType {
  const typeProperty = dataPoint.properties?.anomalyType as string | undefined;

  if (typeProperty && Object.values(AnomalyType).includes(typeProperty as AnomalyType)) {
    return typeProperty as AnomalyType;
  }

  // Try to determine based on other properties
  const energySignature = dataPoint.properties?.energySignature as number | undefined;
  const gravitationalDistortion = dataPoint.properties?.gravitationalDistortion as
    | number
    | undefined;
  const temporalFlux = dataPoint.properties?.temporalFlux as number | undefined;

  if (energySignature && energySignature > 70) {
    return AnomalyType.ENERGY_SIGNATURE;
  } else if (gravitationalDistortion && gravitationalDistortion > 70) {
    return AnomalyType.GRAVITATIONAL_ANOMALY;
  } else if (temporalFlux && temporalFlux > 70) {
    return AnomalyType.TEMPORAL_ANOMALY;
  }

  // Default case
  return AnomalyType.UNKNOWN;
}

/**
 * Determine resource type based on data point properties
 */
function determineResourceType(dataPoint: DataPoint): ResourceType {
  const typeProperty = dataPoint.properties?.resourceType as string | undefined;

  if (typeProperty && Object.values(ResourceType).includes(typeProperty as ResourceType)) {
    return typeProperty as ResourceType;
  }

  // Default case
  return ResourceType.MINERALS;
}

/**
 * Determine danger level based on data point properties
 */
function determineDangerLevel(dataPoint: DataPoint): DangerLevel {
  const dangerProperty = dataPoint.properties?.dangerLevel as string | undefined;

  if (dangerProperty && Object.values(DangerLevel).includes(dangerProperty as DangerLevel)) {
    return dangerProperty as DangerLevel;
  }

  // Try to determine based on other properties
  const radiationLevel = dataPoint.properties?.radiationLevel as number | undefined;
  const hostileActivity = dataPoint.properties?.hostileActivity as number | undefined;
  const instability = dataPoint.properties?.instability as number | undefined;

  if (radiationLevel && radiationLevel > 80) {
    return DangerLevel.EXTREME;
  } else if (hostileActivity && hostileActivity > 70) {
    return DangerLevel.HIGH;
  } else if (instability && instability > 60) {
    return DangerLevel.MODERATE;
  }

  // Default case
  return DangerLevel.UNKNOWN;
}

/**
 * Create a default effect based on effect type
 * @private Use the exported version from the export statement below
 */
function _createDefaultEffect(type: EffectType): Effect {
  const effectId = `effect-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  switch (type) {
    case EffectType.BUFF:
      return {
        id: effectId,
        name: 'Enhancement Field',
        type: EffectType.BUFF,
        strength: 50,
        duration: 60,
        description: 'Enhances the performance of nearby systems.',
        impactedSystems: ['shields', 'sensors'],
      };

    case EffectType.DEBUFF:
      return {
        id: effectId,
        name: 'Interference Field',
        type: EffectType.DEBUFF,
        strength: 40,
        duration: 45,
        description: 'Causes interference in nearby systems.',
        impactedSystems: ['communications', 'sensors'],
      };

    case EffectType.DAMAGE:
      return {
        id: effectId,
        name: 'Corrosive Radiation',
        type: EffectType.DAMAGE,
        strength: 60,
        duration: 30,
        description: 'Gradually damages hull integrity.',
        impactedSystems: ['hull', 'external_systems'],
      };

    case EffectType.HEALING:
      return {
        id: effectId,
        name: 'Restorative Field',
        type: EffectType.HEALING,
        strength: 45,
        duration: 90,
        description: 'Gradually repairs damaged systems.',
        impactedSystems: ['all'],
      };

    case EffectType.ENVIRONMENTAL:
      return {
        id: effectId,
        name: 'Gravitational Distortion',
        type: EffectType.ENVIRONMENTAL,
        strength: 70,
        duration: -1, // Permanent
        description: 'Alters the gravitational field in the area.',
        impactedSystems: ['navigation', 'propulsion'],
      };

    case EffectType.SPECIAL:
    default:
      return {
        id: effectId,
        name: 'Unknown Phenomenon',
        type: EffectType.SPECIAL,
        strength: 50,
        duration: 120,
        description: 'Has unpredictable effects on nearby systems.',
        impactedSystems: ['random'],
      };
  }
}

/**
 * Create a default analysis result
 * @private Use the exported version from the export statement below
 */
function _createDefaultAnalysisResult(type: AnalysisType, entityIds: string[]): AnalysisResult {
  return {
    id: `analysis-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Analysis`,
    type,
    createdAt: Date.now(),
    data: {},
    entityIds,
    insights: [],
    summary: `Default ${type} analysis of ${entityIds.length} entities.`,
    confidence: 70,
  };
}

/**
 * Filter entities by exploration status
 */
export function filterByExplorationStatus<T extends { explorationStatus: ExplorationStatus }>(
  entities: T[],
  status: ExplorationStatus
): T[] {
  return entities.filter(entity => entity.explorationStatus === status);
}

/**
 * Sort entities by discovery date
 */
export function sortByDiscoveryDate<T extends { discoveredAt: number }>(
  entities: T[],
  ascending = false
): T[] {
  return [...entities].sort((a, b) =>
    ascending ? a.discoveredAt - b.discoveredAt : b.discoveredAt - a.discoveredAt
  );
}

/**
 * Calculate the distance between two coordinates
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const x = coord2.x - coord1.x;
  const y = coord2.y - coord1.y;
  const z = (coord2.z ?? 0) - (coord1.z ?? 0);

  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Find the nearest entities to a target coordinate
 */
export function findNearestEntities<T extends { coordinates: Coordinates }>(
  entities: T[],
  targetCoord: Coordinates,
  limit = 5
): T[] {
  return [...entities]
    .map(entity => ({
      entity,
      distance: calculateDistance(entity.coordinates, targetCoord),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(item => item.entity);
}

/**
 * Create an empty exploration state for initialization
 */
export function createEmptyExplorationState() {
  return {
    sectors: [],
    systems: [],
    planets: [],
    resources: [],
    anomalies: [],
    tradeRoutes: [],
    activities: [],
    analysisResults: [],
    loading: false,
    error: null,
  };
}

// Export functions with renamed private implementations to avoid redeclaration errors
// following the pattern from resources.mdc
export const resourceDepositToDataPoint = _resourceDepositToDataPoint;
export const sectorToDataPoint = _sectorToDataPoint;
export const createDefaultEffect = _createDefaultEffect;
export const createDefaultAnalysisResult = _createDefaultAnalysisResult;

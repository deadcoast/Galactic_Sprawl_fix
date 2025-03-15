/**
 * Exploration Type Utilities
 * 
 * This file contains utility functions for working with exploration types,
 * including type conversion functions, validation, and helper functions.
 */

import {
  Anomaly,
  AnomalyType,
  AnalysisResult,
  AnalysisType,
  Coordinates,
  DangerLevel,
  EffectType,
  Effect,
  ExplorationStatus,
  InvestigationStage,
  Sector,
  StarSystem,
  Planet,
  ResourceDeposit
} from './ExplorationTypes';
import { DataPoint } from '../DataAnalysisTypes';
import { ResourceType } from "./../../resources/ResourceTypes";

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
    quadrant: dataPoint.properties?.quadrant as string | undefined
  };
}

/**
 * Convert a DataPoint to an Anomaly
 */
export function dataPointToAnomaly(dataPoint: DataPoint): Anomaly {
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
      recommendedActions: []
    },
    potentialUses: [],
    dangerLevel: determineDangerLevel(dataPoint),
    visualData: dataPoint.properties?.visualData as any || undefined
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
    discoveredAt: dataPoint.date
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
    environmentalConditions: []
  };
}

/**
 * Convert an Anomaly to a DataPoint
 */
export function anomalyToDataPoint(anomaly: Anomaly): DataPoint {
  return {
    id: anomaly.id,
    type: 'anomaly',
    name: anomaly.name,
    date: anomaly.discoveredAt,
    coordinates: {
      x: anomaly.coordinates.x,
      y: anomaly.coordinates.y
    },
    properties: {
      anomalyType: anomaly.anomalyType,
      intensity: anomaly.intensity,
      stability: anomaly.stability,
      dangerLevel: anomaly.dangerLevel,
      z: anomaly.coordinates.z,
      sector: anomaly.coordinates.sector,
      quadrant: anomaly.coordinates.quadrant,
      visualData: anomaly.visualData
    }
  };
}

/**
 * Convert a ResourceDeposit to a DataPoint
 */
export function resourceDepositToDataPoint(resource: ResourceDeposit): DataPoint {
  return {
    id: resource.id,
    type: 'resource',
    name: `${resource.type} Deposit`,
    date: resource.discoveredAt || Date.now(),
    coordinates: {
      x: resource.coordinates.x,
      y: resource.coordinates.y
    },
    properties: {
      resourceType: resource.type,
      amount: resource.amount,
      quality: resource.quality,
      accessibility: resource.accessibility,
      z: resource.coordinates.z,
      sector: resource.coordinates.sector,
      quadrant: resource.coordinates.quadrant
    }
  };
}

/**
 * Convert a Sector to a DataPoint
 */
export function sectorToDataPoint(sector: Sector): DataPoint {
  return {
    id: sector.id,
    type: 'sector',
    name: sector.name,
    date: sector.discoveredAt,
    coordinates: {
      x: sector.coordinates.x,
      y: sector.coordinates.y
    },
    properties: {
      dangerLevel: sector.dangerLevel,
      systemCount: sector.systems.length,
      anomalyCount: sector.anomalies.length,
      resourceCount: sector.resources.length,
      z: sector.coordinates.z,
      quadrant: sector.coordinates.quadrant,
      factionControl: sector.factionControl?.factionName
    }
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
  const gravitationalDistortion = dataPoint.properties?.gravitationalDistortion as number | undefined;
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
  } else if ((radiationLevel && radiationLevel > 30) || 
            (hostileActivity && hostileActivity > 30) || 
            (instability && instability > 30)) {
    return DangerLevel.LOW;
  }
  
  // Default case
  return DangerLevel.UNKNOWN;
}

/**
 * Create a default effect based on type
 */
export function createDefaultEffect(type: EffectType): Effect {
  const id = `effect-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  switch (type) {
    case EffectType.BUFF:
      return {
        id,
        name: 'Positive Effect',
        type: EffectType.BUFF,
        strength: 50,
        duration: -1,
        description: 'A positive effect that enhances capabilities.',
        impactedSystems: ['shields', 'sensors']
      };
    
    case EffectType.DEBUFF:
      return {
        id,
        name: 'Negative Effect',
        type: EffectType.DEBUFF,
        strength: 40,
        duration: 300,
        description: 'A negative effect that impairs capabilities.',
        impactedSystems: ['engines', 'weapons']
      };
    
    case EffectType.DAMAGE:
      return {
        id,
        name: 'Damage Effect',
        type: EffectType.DAMAGE,
        strength: 60,
        duration: 60,
        description: 'An effect that causes damage over time.',
        impactedSystems: ['hull', 'components']
      };
    
    case EffectType.ENVIRONMENTAL:
      return {
        id,
        name: 'Environmental Effect',
        type: EffectType.ENVIRONMENTAL,
        strength: 30,
        duration: -1,
        description: 'An environmental effect that alters the surroundings.',
        impactedSystems: ['scanners', 'mining']
      };
    
    default:
      return {
        id,
        name: 'Special Effect',
        type: EffectType.SPECIAL,
        strength: 50,
        duration: 120,
        description: 'A special effect with unique properties.',
        impactedSystems: ['all']
      };
  }
}

/**
 * Create a default analysis result
 */
export function createDefaultAnalysisResult(type: AnalysisType, entityIds: string[]): AnalysisResult {
  const id = `analysis-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  return {
    id,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Analysis`,
    type,
    createdAt: Date.now(),
    entityIds,
    data: {},
    insights: [],
    summary: 'Analysis complete. Review results for more information.',
    confidence: 75
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
  ascending: boolean = false
): T[] {
  return [...entities].sort((a, b) => {
    return ascending ? a.discoveredAt - b.discoveredAt : b.discoveredAt - a.discoveredAt;
  });
}

/**
 * Calculate distance between two coordinates
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const dx = coord2.x - coord1.x;
  const dy = coord2.y - coord1.y;
  const dz = (coord2.z || 0) - (coord1.z || 0);
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Find nearest entities to a given coordinate
 */
export function findNearestEntities<T extends { coordinates: Coordinates }>(
  entities: T[],
  targetCoord: Coordinates,
  limit: number = 5
): T[] {
  return [...entities]
    .map(entity => ({
      entity,
      distance: calculateDistance(entity.coordinates, targetCoord)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(item => item.entity);
}

/**
 * Create a blank exploration state
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
    error: null
  };
}

// Export utility functions
export {
  dataPointToCoordinates,
  dataPointToAnomaly,
  dataPointToResourceDeposit,
  dataPointToSector,
  anomalyToDataPoint,
  resourceDepositToDataPoint,
  sectorToDataPoint,
  determineAnomalyType,
  determineResourceType,
  determineDangerLevel,
  createDefaultEffect,
  createDefaultAnalysisResult,
  filterByExplorationStatus,
  sortByDiscoveryDate,
  calculateDistance,
  findNearestEntities,
  createEmptyExplorationState
};
import { Vector3D } from '../common/VectorTypes';
import { ResourceType } from "./../resources/ResourceTypes";

export enum SectorType {
  UNEXPLORED = 'UNEXPLORED',
  ASTEROID_FIELD = 'ASTEROID_FIELD',
  NEBULA = 'NEBULA',
  PLANETARY_SYSTEM = 'PLANETARY_SYSTEM',
  DEEP_SPACE = 'DEEP_SPACE',
}

export enum DiscoveryType {
  RESOURCE_DEPOSIT = 'RESOURCE_DEPOSIT',
  ALIEN_ARTIFACT = 'ALIEN_ARTIFACT',
  ANOMALY = 'ANOMALY',
  DERELICT = 'DERELICT',
  SPATIAL_PHENOMENON = 'SPATIAL_PHENOMENON',
}

export interface Discovery {
  id: string;
  type: DiscoveryType;
  location: Vector3D;
  classification?: Classification;
  analysisProgress: number;
  metadata: DiscoveryMetadata;
}

export interface Classification {
  id: string;
  type: DiscoveryType;
  confidence: number;
  details: ClassificationDetails;
  timestamp: number;
  metadata: ClassificationMetadata;
}

export interface ClassificationResult {
  type: DiscoveryType;
  confidence: number;
  details: ClassificationDetails;
  timestamp: number;
  analysisTime: number;
  enhancementApplied: boolean;
}

export interface ClassificationDetails {
  resourceType?: ResourceType;
  estimatedQuantity?: number;
  extractionDifficulty?: number;
  qualityIndicators?: QualityIndicators;
  artifactOrigin?: string;
  artifactAge?: number;
  anomalyType?: string;
  anomalyIntensity?: number;
  derelictType?: string;
  derelictCondition?: number;
  phenomenonType?: string;
  phenomenonStability?: number;
}

export interface ClassificationMetadata {
  analysisVersion: string;
  analysisTime: number;
  enhancementApplied: boolean;
}

export interface DiscoveryMetadata {
  discoveryTime: number;
  discoveryMethod: string;
  initialReadings: InitialReadings;
  scanData: ScanData;
}

export interface QualityIndicators {
  purity: number;
  density: number;
  stability: number;
  accessibility: number;
}

export interface InitialReadings {
  radiation: number;
  magneticField: number;
  temperature: number;
  pressure: number;
}

export interface ScanData {
  spectralAnalysis: number[];
  densityMapping: number[];
  elementalComposition: Map<string, number>;
  structuralIntegrity: number;
}

/**
 * @context: type-definitions, exploration-system
 *
 * Unified Exploration Types
 *
 * This file contains all type definitions used across the exploration system.
 * It provides a single source of truth for exploration-related types,
 * eliminating duplication and ensuring consistency across components.
 */

import { BasePoint } from '../../visualization/CommonTypes';
import { ResourceType } from './../../resources/ResourceTypes';

// =========================================
// Base Types
// =========================================

/**
 * Base exploration entity with common properties
 */
export interface ExplorationEntity {
  id: string;
  name: string;
  discoveredAt: number;
  coordinates: Coordinates;
  explorationStatus: ExplorationStatus;
}

/**
 * Coordinates in the galaxy map
 */
export interface Coordinates extends BasePoint {
  id: string;
  x: number;
  y: number;
  z?: number;
  sector?: string;
  quadrant?: string;
}

/**
 * Status of an exploration entity
 */
export enum ExplorationStatus {
  UNDISCOVERED = 'undiscovered',
  DETECTED = 'detected',
  SCANNED = 'scanned',
  ANALYZED = 'analyzed',
  FULLY_EXPLORED = 'fully_explored',
}

// =========================================
// Sector Types
// =========================================

/**
 * Sector in the galaxy map
 */
export interface Sector extends ExplorationEntity {
  type: 'sector';
  systems: StarSystem[];
  resources: ResourceDeposit[];
  anomalies: Anomaly[];
  tradeRoutes: TradeRoute[];
  factionControl?: FactionControl;
  dangerLevel: DangerLevel;
  environmentalConditions: EnvironmentalCondition[];
  accessibility: number; // 0-100 scale
}

/**
 * Star system within a sector
 */
export interface StarSystem extends ExplorationEntity {
  type: 'system';
  starType: StarType;
  planets: Planet[];
  asteroidBelts: AsteroidBelt[];
  jumpPoints: JumpPoint[];
  specialFeatures: SpecialFeature[];
  sectorId: string;
}

/**
 * Types of stars
 */
export enum StarType {
  MAIN_SEQUENCE = 'main_sequence',
  RED_DWARF = 'red_dwarf',
  WHITE_DWARF = 'white_dwarf',
  BLUE_GIANT = 'blue_giant',
  RED_GIANT = 'red_giant',
  NEUTRON_STAR = 'neutron_star',
  BLACK_HOLE = 'black_hole',
  BINARY = 'binary',
  TRINARY = 'trinary',
}

/**
 * Planet within a star system
 */
export interface Planet extends ExplorationEntity {
  type: 'planet';
  planetType: PlanetType;
  size: number;
  habitability: number; // 0-100 scale
  resources: ResourceDeposit[];
  systemId: string;
  orbitDistance: number;
  moons: Moon[];
  colonized: boolean;
  colonyId?: string;
}

/**
 * Types of planets
 */
export enum PlanetType {
  ROCKY = 'rocky',
  GAS_GIANT = 'gas_giant',
  ICE = 'ice',
  LAVA = 'lava',
  OCEAN = 'ocean',
  DESERT = 'desert',
  JUNGLE = 'jungle',
  TERRAN = 'terran',
}

/**
 * Moon orbiting a planet
 */
export interface Moon extends ExplorationEntity {
  type: 'moon';
  size: number;
  resources: ResourceDeposit[];
  planetId: string;
  orbitDistance: number;
  colonized: boolean;
  colonyId?: string;
}

/**
 * Asteroid belt within a star system
 */
export interface AsteroidBelt extends ExplorationEntity {
  type: 'asteroid_belt';
  resources: ResourceDeposit[];
  systemId: string;
  orbitDistance: number;
  density: number; // 0-100 scale
  size: number;
}

/**
 * Jump point connecting star systems
 */
export interface JumpPoint extends ExplorationEntity {
  type: 'jump_point';
  sourceSystemId: string;
  targetSystemId: string;
  stability: number; // 0-100 scale
  energyRequired: number;
  status: JumpPointStatus;
}

/**
 * Status of a jump point
 */
export enum JumpPointStatus {
  STABLE = 'stable',
  UNSTABLE = 'unstable',
  COLLAPSING = 'collapsing',
  DORMANT = 'dormant',
  ACTIVE = 'active',
}

/**
 * Special feature within a star system
 */
export interface SpecialFeature {
  id: string;
  name: string;
  type: SpecialFeatureType;
  description: string;
  effects: Effect[];
}

/**
 * Types of special features
 */
export enum SpecialFeatureType {
  STELLAR_PHENOMENON = 'stellar_phenomenon',
  ANCIENT_STRUCTURE = 'ancient_structure',
  SPATIAL_ANOMALY = 'spatial_anomaly',
  DEBRIS_FIELD = 'debris_field',
  RESEARCH_STATION = 'research_station',
}

// =========================================
// Resource Types
// =========================================

/**
 * Resource deposit
 */
export interface ResourceDeposit {
  id: string;
  type: ResourceType;
  amount: number;
  quality: number; // 0-100 scale
  accessibility: number; // 0-100 scale
  coordinates: Coordinates;
  explorationStatus: ExplorationStatus;
  discoveredAt?: number;
}

// =========================================
// Anomaly Types
// =========================================

/**
 * Anomaly detected during exploration
 */
export interface Anomaly extends ExplorationEntity {
  type: 'anomaly';
  anomalyType: AnomalyType;
  intensity: number; // 0-100 scale
  stability: number; // 0-100 scale
  composition: AnomalyComposition[];
  effects: Effect[];
  investigation: InvestigationStatus;
  potentialUses: PotentialUse[];
  dangerLevel: DangerLevel;
  visualData?: VisualData;
}

/**
 * Types of anomalies
 */
export enum AnomalyType {
  SPATIAL_DISTORTION = 'spatial_distortion',
  ENERGY_SIGNATURE = 'energy_signature',
  GRAVITATIONAL_ANOMALY = 'gravitational_anomaly',
  RADIATION_SOURCE = 'radiation_source',
  QUANTUM_FLUCTUATION = 'quantum_fluctuation',
  TEMPORAL_ANOMALY = 'temporal_anomaly',
  UNKNOWN = 'unknown',
}

/**
 * Composition of an anomaly
 */
export interface AnomalyComposition {
  element: string;
  percentage: number;
  properties: string[];
}

/**
 * Effect of an anomaly or feature
 */
export interface Effect {
  id: string;
  name: string;
  type: EffectType;
  strength: number; // 0-100 scale
  duration: number; // in seconds, -1 for permanent
  description: string;
  impactedSystems: string[]; // ship systems, modules, etc.
}

/**
 * Types of effects
 */
export enum EffectType {
  BUFF = 'buff',
  DEBUFF = 'debuff',
  DAMAGE = 'damage',
  HEALING = 'healing',
  ENVIRONMENTAL = 'environmental',
  SPECIAL = 'special',
}

/**
 * Investigation status of an anomaly
 */
export interface InvestigationStatus {
  status: InvestigationStage;
  progress: number; // 0-100 scale
  findings: Finding[];
  requiredEquipment: string[];
  recommendedActions: string[];
}

/**
 * Stages of investigation
 */
export enum InvestigationStage {
  NOT_STARTED = 'not_started',
  INITIAL_SCAN = 'initial_scan',
  DETAILED_ANALYSIS = 'detailed_analysis',
  COMPREHENSIVE_STUDY = 'comprehensive_study',
  FULLY_UNDERSTOOD = 'fully_understood',
}

/**
 * Finding from an investigation
 */
export interface Finding {
  id: string;
  title: string;
  description: string;
  significance: number; // 0-100 scale
  category: FindingCategory;
  relatedFindings: string[]; // IDs of related findings
}

/**
 * Categories of findings
 */
export enum FindingCategory {
  SCIENTIFIC = 'scientific',
  TECHNOLOGICAL = 'technological',
  BIOLOGICAL = 'biological',
  HISTORICAL = 'historical',
  STRATEGIC = 'strategic',
}

/**
 * Potential use for an anomaly
 */
export interface PotentialUse {
  id: string;
  name: string;
  description: string;
  requiredTechnology: string[];
  resourceCost: {
    type: ResourceType;
    amount: number;
  }[];
  benefits: string[];
  risks: string[];
  exploitationDifficulty: number; // 0-100 scale
}

/**
 * Visual data for an anomaly
 */
export interface VisualData {
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  intensity: number; // 0-100 scale
  size: number;
  animation: string;
}

/**
 * Danger level for entities
 */
export enum DangerLevel {
  NONE = 'none',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  EXTREME = 'extreme',
  UNKNOWN = 'unknown',
}

/**
 * Environmental condition in a sector
 */
export interface EnvironmentalCondition {
  id: string;
  name: string;
  type: EnvironmentalConditionType;
  severity: number; // 0-100 scale
  effects: Effect[];
  description: string;
}

/**
 * Types of environmental conditions
 */
export enum EnvironmentalConditionType {
  RADIATION = 'radiation',
  GRAVITY = 'gravity',
  TEMPERATURE = 'temperature',
  PRESSURE = 'pressure',
  SOLAR_ACTIVITY = 'solar_activity',
  COSMIC_STORM = 'cosmic_storm',
  SPECIAL = 'special',
}

// =========================================
// Faction and Trade Types
// =========================================

/**
 * Faction control of a sector
 */
export interface FactionControl {
  factionId: string;
  factionName: string;
  controlLevel: number; // 0-100 scale
  stability: number; // 0-100 scale
  disposition: Disposition;
  militaryPresence: number; // 0-100 scale
}

/**
 * Disposition of a faction
 */
export enum Disposition {
  HOSTILE = 'hostile',
  UNFRIENDLY = 'unfriendly',
  NEUTRAL = 'neutral',
  FRIENDLY = 'friendly',
  ALLIED = 'allied',
}

/**
 * Trade route between sectors or systems
 */
export interface TradeRoute {
  id: string;
  name: string;
  sourceId: string;
  targetId: string;
  resourceTypes: ResourceType[];
  volume: number; // 0-100 scale
  security: number; // 0-100 scale
  distance: number;
  travelTime: number; // in seconds
  factionControl?: FactionControl;
}

// =========================================
// Analysis Types
// =========================================

/**
 * Analysis result for exploration data
 */
export interface AnalysisResult {
  id: string;
  name: string;
  type: AnalysisType;
  createdAt: number;
  data: Record<string, unknown>;
  entityIds: string[];
  insights: Insight[];
  summary: string;
  confidence: number; // 0-100 scale
}

/**
 * Types of analysis
 */
export enum AnalysisType {
  COMPOSITION = 'composition',
  ENERGY = ResourceType.ENERGY,
  SPATIAL = 'spatial',
  TEMPORAL = 'temporal',
  RESOURCE = 'resource',
  STRATEGIC = 'strategic',
  PREDICTIVE = 'predictive',
}

/**
 * Insight from analysis
 */
export interface Insight {
  id: string;
  title: string;
  description: string;
  significance: number; // 0-100 scale
  actionable: boolean;
  recommendedActions: string[];
}

// =========================================
// Exploration Activity Types
// =========================================

/**
 * Record of exploration activity
 */
export interface ExplorationActivity {
  id: string;
  type: ExplorationActivityType;
  entityId: string;
  entityType: string;
  timestamp: number;
  duration: number; // in seconds
  result: ExplorationResult;
  shipId: string;
  crewId: string;
  resources: {
    type: ResourceType;
    amount: number;
  }[];
}

/**
 * Types of exploration activities
 */
export enum ExplorationActivityType {
  SCAN = 'scan',
  SURVEY = 'survey',
  SAMPLE = 'sample',
  INVESTIGATE = 'investigate',
  RESEARCH = ResourceType.RESEARCH,
  EXPLOIT = 'exploit',
}

/**
 * Result of exploration activity
 */
export interface ExplorationResult {
  success: boolean;
  data: Record<string, unknown>;
  discoveries: string[]; // IDs of discovered entities
  quality: number; // 0-100 scale
  rewards: Reward[];
}

/**
 * Reward from exploration
 */
export interface Reward {
  type: RewardType;
  amount: number;
  description: string;
}

/**
 * Types of rewards
 */
export enum RewardType {
  RESOURCE = 'resource',
  TECHNOLOGY = 'technology',
  REPUTATION = 'reputation',
  CREDITS = 'credits',
  EXPERIENCE = 'experience',
  SPECIAL = 'special',
}

// =========================================
// Map Visualization Types
// =========================================

/**
 * Viewport for map visualization
 */
export interface MapViewport {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

/**
 * Visual settings for map
 */
export interface MapVisualSettings {
  showGrid: boolean;
  showLabels: boolean;
  showResourceIcons: boolean;
  showAnomalyIcons: boolean;
  showFactionBorders: boolean;
  showTradeRoutes: boolean;
  detailLevel: DetailLevel;
  theme: MapTheme;
}

/**
 * Detail level for visualization
 */
export enum DetailLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
}

/**
 * Theme for map visualization
 */
export enum MapTheme {
  STANDARD = 'standard',
  DARK = 'dark',
  LIGHT = 'light',
  SATELLITE = 'satellite',
  TACTICAL = 'tactical',
}

/**
 * Map selection
 */
export interface MapSelection {
  entityId: string;
  entityType: string;
  coordinates: Coordinates;
  selected: boolean;
  highlightColor?: string;
}

// =========================================
// Context and State Types
// =========================================

/**
 * State for exploration data
 */
export interface ExplorationState {
  sectors: Sector[];
  systems: StarSystem[];
  planets: Planet[];
  resources: ResourceDeposit[];
  anomalies: Anomaly[];
  tradeRoutes: TradeRoute[];
  activities: ExplorationActivity[];
  analysisResults: AnalysisResult[];
  loading: boolean;
  error: string | null;
}

/**
 * Context for exploration data
 */
export interface ExplorationContextType {
  state: ExplorationState;
  // Sector operations
  getSectors: () => Sector[];
  getSectorById: (id: string) => Sector | undefined;
  updateSector: (sector: Sector) => void;

  // System operations
  getSystemsBySectorId: (sectorId: string) => StarSystem[];
  getSystemById: (id: string) => StarSystem | undefined;
  updateSystem: (system: StarSystem) => void;

  // Planet operations
  getPlanetsBySystemId: (systemId: string) => Planet[];
  getPlanetById: (id: string) => Planet | undefined;
  updatePlanet: (planet: Planet) => void;

  // Anomaly operations
  getAnomaliesBySectorId: (sectorId: string) => Anomaly[];
  getAnomalyById: (id: string) => Anomaly | undefined;
  updateAnomaly: (anomaly: Anomaly) => void;

  // Resource operations
  getResourcesByEntityId: (entityId: string) => ResourceDeposit[];
  updateResource: (resource: ResourceDeposit) => void;

  // Analysis operations
  getAnalysisResultsByEntityId: (entityId: string) => AnalysisResult[];
  createAnalysis: (config: Omit<AnalysisResult, 'id' | 'createdAt'>) => string;

  // Activity operations
  recordActivity: (activity: Omit<ExplorationActivity, 'id' | 'timestamp'>) => string;
  getActivitiesByEntityId: (entityId: string) => ExplorationActivity[];

  // General operations
  refreshData: () => Promise<void>;
}

// =========================================
// Event Types
// =========================================

/**
 * Base exploration event
 */
export interface ExplorationEvent {
  id: string;
  type: ExplorationEventType;
  entityId?: string;
  entityType?: string;
  timestamp: number;
  data: Record<string, unknown>;
}

/**
 * Types of exploration events
 */
export enum ExplorationEventType {
  ENTITY_DISCOVERED = 'entity_discovered',
  ENTITY_UPDATED = 'entity_updated',
  SCAN_COMPLETED = 'scan_completed',
  ANALYSIS_COMPLETED = 'analysis_completed',
  ACTIVITY_RECORDED = 'activity_recorded',
  MAP_INTERACTION = 'map_interaction',
  ERROR_OCCURRED = 'error_occurred',
}

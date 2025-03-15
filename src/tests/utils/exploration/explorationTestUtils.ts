import { v4 as uuidv4 } from 'uuid';
import {
  ClassifiableDiscovery,
  Classification,
  ClassificationProperty,
  ConfidenceLevel,
  TaxonomyCategory,
} from '../../../types/exploration/ClassificationTypes';
import {
  AnalysisConfig,
  AnalysisResult,
  DataFilter,
  DataPoint,
  Dataset,
} from '../../../types/exploration/DataAnalysisTypes';
import { ResourceType } from "./../../../types/resources/ResourceTypes";

/**
 * Creates a mock taxonomy category for testing
 */
export function createMockTaxonomyCategory(
  overrides: Partial<TaxonomyCategory> = {}
): TaxonomyCategory {
  return {
    id: overrides.id || `category-${uuidv4().slice(0, 8)}`,
    name: overrides.name || 'Test Category',
    description: overrides.description || 'A test category for classification',
    level: overrides.level !== undefined ? overrides.level : 1,
    parentId: overrides.parentId,
    color: overrides.color || '#3b82f6',
    icon: overrides.icon,
    properties: overrides.properties || [],
  };
}

/**
 * Creates a mock classification property for testing
 */
export function createMockClassificationProperty(
  overrides: Partial<ClassificationProperty> = {}
): ClassificationProperty {
  return {
    id: overrides.id || `property-${uuidv4().slice(0, 8)}`,
    name: overrides.name || 'Test Property',
    description: overrides.description || 'A test property for classification',
    type: overrides.type || 'string',
    required: overrides.required !== undefined ? overrides.required : false,
    options: overrides.options,
    unit: overrides.unit,
    defaultValue: overrides.defaultValue,
  };
}

/**
 * Creates a mock classifiable discovery for testing
 */
export function createMockClassifiableDiscovery(
  overrides: Partial<ClassifiableDiscovery> = {}
): ClassifiableDiscovery {
  const isAnomaly =
    overrides.type === 'anomaly' || (overrides.type === undefined && Math.random() > 0.5);

  return {
    id: overrides.id || `discovery-${uuidv4().slice(0, 8)}`,
    type: overrides.type || (isAnomaly ? 'anomaly' : 'resource'),
    name: overrides.name || `Test ${isAnomaly ? 'Anomaly' : 'Resource'} Discovery`,
    discoveryDate: overrides.discoveryDate || Date.now(),
    sectorId: overrides.sectorId || `sector-${uuidv4().slice(0, 8)}`,
    sectorName: overrides.sectorName || 'Test Sector',
    coordinates: overrides.coordinates || {
      x: Math.floor(Math.random() * 100),
      y: Math.floor(Math.random() * 100),
    },
    classification: overrides.classification,
    // Anomaly specific properties
    anomalyType: isAnomaly ? overrides.anomalyType || 'phenomenon' : undefined,
    severity: isAnomaly ? overrides.severity || 'medium' : undefined,
    analysisResults: isAnomaly
      ? overrides.analysisResults || {
          energyLevel: Math.floor(Math.random() * 100),
          stabilityIndex: Math.random(),
          radiationSignature: 'alpha-beta-gamma',
        }
      : undefined,
    // Resource specific properties
    resourceType: !isAnomaly ? overrides.resourceType || ResourceType.MINERALS : undefined,
    amount: !isAnomaly ? overrides.amount || Math.floor(Math.random() * 1000) : undefined,
    quality: !isAnomaly ? overrides.quality || Math.random() : undefined,
    distribution: !isAnomaly ? overrides.distribution || 'scattered' : undefined,
  };
}

/**
 * Creates a mock classification for testing
 */
export function createMockClassification(overrides: Partial<Classification> = {}): Classification {
  const confidenceValue = overrides.confidence !== undefined ? overrides.confidence : 0.75;
  let confidenceLevel: ConfidenceLevel = 'medium';

  if (confidenceValue < 0.3) confidenceLevel = 'low';
  else if (confidenceValue < 0.7) confidenceLevel = 'medium';
  else if (confidenceValue < 0.9) confidenceLevel = 'high';
  else confidenceLevel = 'confirmed';

  return {
    id: overrides.id || `classification-${uuidv4().slice(0, 8)}`,
    discoveryId: overrides.discoveryId || `discovery-${uuidv4().slice(0, 8)}`,
    discoveryType: overrides.discoveryType || 'anomaly',
    categoryId: overrides.categoryId || `category-${uuidv4().slice(0, 8)}`,
    confidence: confidenceValue,
    confidenceLevel: overrides.confidenceLevel || confidenceLevel,
    properties: overrides.properties || {
      name: 'Test Property Value',
      intensity: 75,
      isStable: true,
    },
    notes: overrides.notes,
    classifiedBy: overrides.classifiedBy || 'ai',
    classifiedDate: overrides.classifiedDate || Date.now(),
    verifiedBy: overrides.verifiedBy,
    verifiedDate: overrides.verifiedDate,
    previousClassifications: overrides.previousClassifications,
    similarDiscoveries: overrides.similarDiscoveries,
  };
}

/**
 * Creates a mock data point for testing
 */
export function createMockDataPoint(overrides: Partial<DataPoint> = {}): DataPoint {
  const types = ['sector', 'anomaly', 'resource'] as const;
  const type = overrides.type || types[Math.floor(Math.random() * types.length)];

  return {
    id: overrides.id || `datapoint-${uuidv4().slice(0, 8)}`,
    type,
    name: overrides.name || `Test ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    date: overrides.date || Date.now(),
    coordinates: overrides.coordinates || {
      x: Math.floor(Math.random() * 100),
      y: Math.floor(Math.random() * 100),
    },
    properties: overrides.properties || {
      value: Math.random() * 100,
      category: 'test',
      status: 'active',
    },
    metadata: overrides.metadata,
  };
}

/**
 * Creates a mock dataset for testing
 */
export function createMockDataset(overrides: Partial<Dataset> = {}, dataPointCount = 5): Dataset {
  const dataPoints: DataPoint[] = [];

  for (let i = 0; i < dataPointCount; i++) {
    dataPoints.push(
      createMockDataPoint({
        type:
          overrides.source === 'mixed'
            ? undefined
            : (overrides.source as 'sector' | 'anomaly' | 'resource'),
      })
    );
  }

  return {
    id: overrides.id || `dataset-${uuidv4().slice(0, 8)}`,
    name: overrides.name || 'Test Dataset',
    description: overrides.description || 'A test dataset for analysis',
    createdAt: overrides.createdAt || Date.now(),
    updatedAt: overrides.updatedAt || Date.now(),
    dataPoints: overrides.dataPoints || dataPoints,
    filters: overrides.filters,
    source: overrides.source || 'mixed',
  };
}

/**
 * Creates a mock data filter for testing
 */
export function createMockDataFilter(overrides: Partial<DataFilter> = {}): DataFilter {
  return {
    id: overrides.id || `filter-${uuidv4().slice(0, 8)}`,
    field: overrides.field || 'properties.value',
    operator: overrides.operator || 'greaterThan',
    value: overrides.value !== undefined ? overrides.value : 50,
    active: overrides.active !== undefined ? overrides.active : true,
  };
}

/**
 * Creates a mock analysis config for testing
 */
export function createMockAnalysisConfig(overrides: Partial<AnalysisConfig> = {}): AnalysisConfig {
  return {
    id: overrides.id || `analysis-config-${uuidv4().slice(0, 8)}`,
    name: overrides.name || 'Test Analysis',
    description: overrides.description || 'A test analysis configuration',
    type: overrides.type || 'trend',
    datasetId: overrides.datasetId || `dataset-${uuidv4().slice(0, 8)}`,
    parameters: overrides.parameters || {
      xAxis: 'date',
      yAxis: 'properties.value',
    },
    visualizationType: overrides.visualizationType || 'lineChart',
    visualizationConfig: overrides.visualizationConfig || {
      showLegend: true,
      colors: ['#3b82f6', '#10b981', '#ef4444'],
    },
    createdAt: overrides.createdAt || Date.now(),
    updatedAt: overrides.updatedAt || Date.now(),
  };
}

/**
 * Creates a mock analysis result for testing
 */
export function createMockAnalysisResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    id: overrides.id || `analysis-result-${uuidv4().slice(0, 8)}`,
    analysisConfigId: overrides.analysisConfigId || `analysis-config-${uuidv4().slice(0, 8)}`,
    status: overrides.status || 'completed',
    startTime: overrides.startTime || Date.now() - 5000,
    endTime: overrides.endTime || Date.now(),
    data: overrides.data || {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [
        {
          label: 'Values',
          data: [12, 19, 3, 5, 2],
        },
      ],
    },
    summary: overrides.summary || 'Analysis completed successfully with 5 data points processed.',
    insights: overrides.insights || [
      'Significant upward trend detected in January-February',
      'Anomalous drop in March requires further investigation',
    ],
    error: overrides.error,
  };
}

/**
 * Creates multiple mock classifiable discoveries for testing
 */
export function createMockClassifiableDiscoveries(
  count: number,
  template: Partial<ClassifiableDiscovery> = {}
): ClassifiableDiscovery[] {
  const discoveries: ClassifiableDiscovery[] = [];

  for (let i = 0; i < count; i++) {
    discoveries.push(
      createMockClassifiableDiscovery({
        ...template,
        id: `discovery-${i}-${uuidv4().slice(0, 8)}`,
      })
    );
  }

  return discoveries;
}

/**
 * Creates a hierarchical taxonomy structure for testing
 */
export function createMockTaxonomyHierarchy(): TaxonomyCategory[] {
  // Root categories
  const anomalyRoot = createMockTaxonomyCategory({
    id: 'anomaly-root',
    name: 'Anomalies',
    description: 'Root category for all anomaly classifications',
    level: 0,
    color: '#6366f1',
  });

  const resourceRoot = createMockTaxonomyCategory({
    id: 'resource-root',
    name: 'Resources',
    description: 'Root category for all resource classifications',
    level: 0,
    color: '#10b981',
  });

  // Level 1 categories
  const spatialAnomaly = createMockTaxonomyCategory({
    id: 'spatial-anomaly',
    name: 'Spatial Anomalies',
    description: 'Anomalies that affect or exist within space',
    parentId: 'anomaly-root',
    level: 1,
    color: '#8b5cf6',
  });

  const temporalAnomaly = createMockTaxonomyCategory({
    id: 'temporal-anomaly',
    name: 'Temporal Anomalies',
    description: 'Anomalies that affect or exist within time',
    parentId: 'anomaly-root',
    level: 1,
    color: '#3b82f6',
  });

  const mineralResource = createMockTaxonomyCategory({
    id: 'mineral-resource',
    name: 'Mineral Resources',
    description: 'Solid mineral resources',
    parentId: 'resource-root',
    level: 1,
    color: '#f59e0b',
  });

  const gasResource = createMockTaxonomyCategory({
    id: 'gas-resource',
    name: 'Gas Resources',
    description: 'Gaseous resources',
    parentId: 'resource-root',
    level: 1,
    color: '#10b981',
  });

  // Level 2 categories
  const wormholeAnomaly = createMockTaxonomyCategory({
    id: 'wormhole-anomaly',
    name: 'Wormholes',
    description: 'Spatial anomalies that connect two points in space',
    parentId: 'spatial-anomaly',
    level: 2,
    color: '#7c3aed',
  });

  const timeLoopAnomaly = createMockTaxonomyCategory({
    id: 'timeloop-anomaly',
    name: 'Time Loops',
    description: 'Temporal anomalies that cause repeating time patterns',
    parentId: 'temporal-anomaly',
    level: 2,
    color: '#2563eb',
  });

  return [
    anomalyRoot,
    resourceRoot,
    spatialAnomaly,
    temporalAnomaly,
    mineralResource,
    gasResource,
    wormholeAnomaly,
    timeLoopAnomaly,
  ];
}

/**
 * Creates a mock resource type for testing
 */
export function createMockResourceType(): ResourceType {
  const resourceTypes: ResourceType[] = [
    ResourceType.MINERALS,
    ResourceType.ENERGY,
    ResourceType.POPULATION,
    ResourceType.RESEARCH,
    ResourceType.PLASMA,
    ResourceType.GAS,
    ResourceType.EXOTIC,
  ];

  return resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
}

/**
 * Creates a test environment for exploration tests with mocked managers
 */
export function createTestEnvironment() {
  return {
    explorationManager: {
      createStarSystem: (system: {
        id: string;
        name: string;
        status: string;
        assignedShips?: string[];
      }) => ({ ...system, assignedShips: system.assignedShips || [] }),
      assignShipToSystem: (_shipId: string, _systemId: string) => true,
      getSystemById: (systemId: string) => ({
        id: systemId,
        name: 'Alpha Centauri',
        status: 'discovered',
        assignedShips: ['ship-1'],
      }),
      addStarSystem: (system: {
        id: string;
        name: string;
        type: string;
        resources: string[];
        status: string;
      }) => system,
      searchSystems: (criteria: {
        name?: string;
        type?: string;
        resources?: string[];
        status?: string;
      }) => {
        // Implementation for searchSystems based on criteria
        if (criteria.name) {
          return [
            {
              id: 'system-1',
              name: 'System 1',
              type: 'single',
              resources: [ResourceType.GAS],
              status: 'explored',
            },
          ];
        } else if (criteria.type && criteria.resources) {
          return Array.from({ length: 3 }, (_, i) => ({
            id: `system-${i * 6}`,
            name: `System ${i * 6}`,
            type: 'binary',
            resources: [ResourceType.MINERALS],
            status: i % 4 === 0 ? 'unexplored' : 'explored',
          }));
        } else if (criteria.type) {
          return Array.from({ length: 7 }, (_, i) => ({
            id: `system-${i * 3}`,
            name: `System ${i * 3}`,
            type: 'binary',
            resources: i % 2 === 0 ? [ResourceType.MINERALS, ResourceType.ENERGY] : [ResourceType.GAS],
            status: i % 4 === 0 ? 'unexplored' : 'explored',
          }));
        } else if (criteria.resources) {
          return Array.from({ length: 10 }, (_, i) => ({
            id: `system-${i * 2}`,
            name: `System ${i * 2}`,
            type: i % 3 === 0 ? 'binary' : 'single',
            resources: [ResourceType.MINERALS, ResourceType.ENERGY],
            status: i % 4 === 0 ? 'unexplored' : 'explored',
          }));
        } else if (criteria.status) {
          return Array.from({ length: 5 }, (_, i) => ({
            id: `system-${i * 4}`,
            name: `System ${i * 4}`,
            type: i % 3 === 0 ? 'binary' : 'single',
            resources: i % 2 === 0 ? [ResourceType.MINERALS, ResourceType.ENERGY] : [ResourceType.GAS],
            status: 'unexplored',
          }));
        }
        return [];
      },
    },
    shipManager: {
      createShip: (ship: { id: string; name: string; type: string; status: string }) => ({
        ...ship,
      }),
      getShipById: (shipId: string) => ({
        id: shipId,
        name: shipId === 'ship-1' ? 'Explorer 1' : 'Explorer 2',
        type: 'exploration',
        status: shipId === 'ship-1' ? 'assigned' : 'idle',
        assignedTo: shipId === 'ship-1' ? 'system-1' : undefined,
      }),
    },
  };
}

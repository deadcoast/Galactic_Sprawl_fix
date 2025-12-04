import { ResourceType } from './../resources/ResourceTypes';

/**
 * Represents a data point for analysis
 */
export interface DataPoint {
  id: string;
  type: 'sector' | 'anomaly' | 'resource';
  name: string;
  date: number;
  coordinates: { x: number; y: number };
  properties: Record<string, string | number | boolean | string[]>;
  metadata?: Record<string, string | number | boolean | string[]>;

  /**
   * Index signature to allow direct property access
   * This helps with using dot notation for properties that are dynamically added
   */
  [key: string]: unknown;
}

/**
 * Represents a dataset for analysis
 */
export interface Dataset {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  dataPoints: DataPoint[];
  filters?: DataFilter[];
  source: 'sectors' | 'anomalies' | 'resources' | 'mixed';
}

/**
 * Represents a filter for data analysis
 */
export interface DataFilter {
  id: string;
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
  active: boolean;
}

/**
 * Represents an analysis configuration
 */
export interface AnalysisConfig {
  id: string;
  name: string;
  description: string;
  type: AnalysisType;
  datasetId: string;
  parameters: Record<string, unknown>;
  visualizationType: VisualizationType;
  visualizationConfig: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Represents the result of an analysis
 */
export interface AnalysisResult {
  id: string;
  analysisConfigId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  data: Record<string, unknown>;
  summary?: string;
  insights?: string[];
  error?: string;
}

/**
 * Types of analysis that can be performed
 */
export type AnalysisType =
  | 'trend'
  | 'correlation'
  | 'distribution'
  | 'clustering'
  | 'prediction'
  | 'comparison'
  | 'anomalyDetection'
  | 'resourceMapping'
  | 'sectorAnalysis'
  | 'custom';

/**
 * Types of visualizations that can be used
 */
export type VisualizationType =
  | 'lineChart'
  | 'barChart'
  | 'scatterPlot'
  | 'pieChart'
  | 'heatMap'
  | 'radar'
  | 'histogram'
  | 'boxPlot'
  | 'table'
  | 'map'
  | 'network'
  | 'custom';

/**
 * Represents a trend analysis configuration
 */
export interface TrendAnalysisConfig extends AnalysisConfig {
  type: 'trend';
  parameters: {
    xAxis: string;
    yAxis: string;
    groupBy?: string;
    timeRange?: [number, number];
    aggregation?: 'sum' | 'average' | 'min' | 'max' | 'count';
  };
}

/**
 * Represents a correlation analysis configuration
 */
export interface CorrelationAnalysisConfig extends AnalysisConfig {
  type: 'correlation';
  parameters: {
    variables: string[];
    method?: 'pearson' | 'spearman' | 'kendall';
    threshold?: number;
  };
}

/**
 * Represents a distribution analysis configuration
 */
export interface DistributionAnalysisConfig extends AnalysisConfig {
  type: 'distribution';
  parameters: {
    variable: string;
    bins?: number;
    normalize?: boolean;
  };
}

/**
 * Represents a clustering analysis configuration
 */
export interface ClusteringAnalysisConfig extends AnalysisConfig {
  type: 'clustering';
  parameters: {
    variables: string[];
    clusters?: number;
    method?: 'kmeans' | 'hierarchical' | 'dbscan';
  };
}

/**
 * Represents a prediction analysis configuration
 */
export interface PredictionAnalysisConfig extends AnalysisConfig {
  type: 'prediction';
  parameters: {
    target: string;
    features: string[];
    method?: 'linear' | 'randomForest' | 'neuralNetwork';
    testSize?: number;
  };
}

/**
 * Represents a comparison analysis configuration
 */
export interface ComparisonAnalysisConfig extends AnalysisConfig {
  type: 'comparison';
  parameters: {
    baseVariable: string;
    comparisonVariables: string[];
    normalizeValues?: boolean;
    timeRange?: [number, number];
    groupBy?: string;
  };
}

/**
 * Represents an anomaly detection analysis configuration
 */
export interface AnomalyDetectionAnalysisConfig extends AnalysisConfig {
  type: 'anomalyDetection';
  parameters: {
    variables: string[];
    method?: 'isolation' | 'oneClass' | 'statistical';
    threshold?: number;
  };
}

/**
 * Represents a resource mapping analysis configuration
 */
export interface ResourceMappingAnalysisConfig extends AnalysisConfig {
  type: 'resourceMapping';
  parameters: {
    resourceTypes?: ResourceType[];
    valueMetric?: 'amount' | 'quality' | 'accessibility' | 'estimatedValue';
    regionSize?: number;
  };
}

/**
 * Represents a sector analysis configuration
 */
export interface SectorAnalysisConfig extends AnalysisConfig {
  type: 'sectorAnalysis';
  parameters: {
    metrics: ('resourcePotential' | 'habitabilityScore' | 'anomalyCount' | 'resourceCount')[];
    sectorIds?: string[];
    includeNeighbors?: boolean;
    timeRange?: [number, number];
  };
}

/**
 * Interface representing resource data from exploration
 */
export interface ResourceData {
  type: ResourceType;
  amount: number;
  quality?: number;
  sectorId?: string;
  [key: string]: unknown;
}

/**
 * Context for the data analysis system
 */
export interface DataAnalysisContextType {
  // Datasets and related operations
  datasets: Dataset[];
  addDataset: (dataset: Dataset) => void;
  removeDataset: (datasetId: string) => void;
  clearDatasets: () => void;
  createDataset: (dataset: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateDataset: (
    id: string,
    updates: Partial<Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>>
  ) => void;
  deleteDataset: (id: string) => void;
  getDatasetById?: (id: string) => Dataset | undefined;

  // Analysis configurations
  analysisConfigs: AnalysisConfig[];
  createAnalysisConfig: (config: Omit<AnalysisConfig, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAnalysisConfig: (
    id: string,
    updates: Partial<Omit<AnalysisConfig, 'id' | 'createdAt' | 'updatedAt'>>
  ) => void;
  deleteAnalysisConfig: (id: string) => void;
  getAnalysisConfigById?: (id: string) => AnalysisConfig | undefined;

  // Analysis results
  analysisResults: AnalysisResult[];
  getAnalysisResultById?: (id: string) => AnalysisResult | undefined;
  getAnalysisResultsByConfigId: (configId: string) => AnalysisResult[];
  runAnalysis: (configId: string) => Promise<string>;

  // Data point management
  addDataPointToDataset: (datasetId: string, dataPoint: DataPoint) => void;
  removeDataPointFromDataset: (datasetId: string, dataPointId: string) => void;

  // Dataset utilities
  getOrCreateDatasetBySource: (
    source: 'sectors' | 'anomalies' | 'resources' | 'mixed',
    name?: string
  ) => string;

  // Data operations
  refreshData: () => void;
  filterDataset: (
    datasetId: string,
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
  ) => DataPoint[];

  // Conversion utilities
  sectorToDataPoint: (sector: Record<string, unknown>) => DataPoint;
  anomalyToDataPoint: (anomaly: Record<string, unknown>) => DataPoint;
  resourceToDataPoint: (
    resource: Record<string, unknown>,
    sectorId?: string,
    coordinates?: { x: number; y: number }
  ) => DataPoint;

  // Analysis and stats
  calculateStatistics?: (datasetId: string) => Record<string, unknown>;
  applyFilter?: (datasetId: string, filter: unknown) => DataPoint[];

  // Linked data system for cross-referencing entities
  linkedData: Record<string, unknown>;
  storeLinkedData: (key: string, data: unknown) => void;

  // Statistics tracking for anomalies
  anomalyStats: Record<string, unknown>;
  updateAnomalyStats: (data: {
    anomalyId: string;
    sectorData: unknown;
    discoveryTime: number;
  }) => void;
}

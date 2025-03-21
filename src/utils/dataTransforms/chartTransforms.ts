/**
 * Chart Data Transformation Utilities
 *
 * This module provides standardized utilities for transforming data
 * for visualization components. It consolidates common patterns for
 * extracting, processing, and formatting chart data?.
 */

import {
  ChartDataRecord,
  ClusterPoint,
  ForecastPoint,
  PredictionPoint,
  ResourceGridCell,
} from '../../types/exploration/AnalysisComponentTypes';
import { AnalysisResult, DataPoint } from '../../types/exploration/DataAnalysisTypes';
import { ResourceType } from './../../types/resources/ResourceTypes';

//=============================================================================
// Type Guards
//=============================================================================

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is an array
 */
export function isArray<T = unknown>(value: unknown): value is Array<T> {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

//=============================================================================
// Safe Data Extraction
//=============================================================================

/**
 * Safely extracts a number value from an object property
 * @param obj The object to extract from
 * @param key The property key
 * @param defaultValue Default value if property doesn't exist or isn't a number
 */
export function safelyExtractNumber(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  defaultValue = 0
): number {
  if (!obj) return defaultValue;
  const value = obj[key];
  return isNumber(value) ? value : defaultValue;
}

/**
 * Safely extracts a string value from an object property
 * @param obj The object to extract from
 * @param key The property key
 * @param defaultValue Default value if property doesn't exist or isn't a string
 */
export function safelyExtractString(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  defaultValue = ''
): string {
  if (!obj) return defaultValue;
  const value = obj[key];
  return isString(value) ? value : defaultValue;
}

/**
 * Safely extracts an array from an object property
 * @param obj The object to extract from
 * @param key The property key
 * @param defaultValue Default value if property doesn't exist or isn't an array
 */
export function safelyExtractArray<T = unknown>(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  defaultValue: T[] = []
): T[] {
  if (!obj) return defaultValue;
  const value = obj[key];
  return isArray<T>(value) ? value : defaultValue;
}

/**
 * Safely extracts an object from an object property
 * @param obj The object to extract from
 * @param key The property key
 * @param defaultValue Default value if property doesn't exist or isn't an object
 */
export function safelyExtractObject<T extends Record<string, unknown>>(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  defaultValue: T
): T {
  if (!obj) return defaultValue;
  const value = obj[key];
  return isObject(value) ? (value as T) : defaultValue;
}

/**
 * Safely extracts a property from a nested object structure
 * @param obj The object to extract from
 * @param path Path to the property using dot notation (e.g., 'properties.value')
 * @param defaultValue Default value if path doesn't exist
 */
export function safelyExtractPath<T>(
  obj: Record<string, unknown> | null | undefined,
  path: string,
  defaultValue: T
): T {
  if (!obj) return defaultValue;

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current !== null && current !== undefined ? (current as T) : defaultValue;
}

//=============================================================================
// Domain Calculations
//=============================================================================

/**
 * Calculates the domain (min/max) for a numeric data field
 * @param data Array of data objects
 * @param key Property key to extract
 * @param padding Optional padding percentage (0-1) to add to the domain
 */
export function calculateDomain(
  data: Record<string, unknown>[],
  key: string,
  padding = 0.05
): [number, number] {
  if (!data || data?.length === 0) {
    return [0, 1];
  }

  let min = Infinity;
  let max = -Infinity;

  for (const item of data) {
    const value = safelyExtractNumber(item, key, NaN);
    if (!isNaN(value)) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  // Handle edge cases
  if (!isFinite(min) || !isFinite(max) || min === max) {
    return min === max ? [min - 1, max + 1] : [0, 1];
  }

  // Apply padding
  const range = max - min;
  const paddingAmount = range * padding;
  return [min - paddingAmount, max + paddingAmount];
}

/**
 * Calculates multiple domains at once
 * @param data Array of data objects
 * @param keys Object mapping output keys to data property keys
 * @param padding Optional padding percentage
 */
export function calculateDomains(
  data: Record<string, unknown>[],
  keys: Record<string, string>,
  padding = 0.05
): Record<string, [number, number]> {
  const domains: Record<string, [number, number]> = {};

  for (const [outputKey, dataKey] of Object.entries(keys)) {
    domains[outputKey] = calculateDomain(data, dataKey, padding);
  }

  return domains;
}

//=============================================================================
// Color Mapping
//=============================================================================

/**
 * Creates a color scale function that maps numeric values to colors
 * @param domain Min/max value range
 * @param range Array of colors to interpolate between
 */
export function createColorScale(
  domain: [number, number],
  range: string[]
): (value: number) => string {
  return (value: number) => {
    // Normalize value to 0-1 range
    const normalizedValue = Math.max(0, Math.min(1, (value - domain[0]) / (domain[1] - domain[0])));

    // Map to color index
    const index = Math.min(range.length - 1, Math.floor(normalizedValue * range.length));
    return range[index];
  };
}

/**
 * Maps resource types to standard colors
 * @param resourceType Resource type to get color for
 * @param defaultColor Default color if resource type is not recognized
 */
export function getResourceTypeColor(
  resourceType: ResourceType | ResourceType,
  defaultColor = '#888888'
): string {
  const resourceTypeColors: Record<ResourceType, string> = {
    MINERALS: '#3D85C6', // Blue
    ENERGY: '#F1C232', // Yellow/gold
    POPULATION: '#6AA84F', // Green
    RESEARCH: '#9FC5E8', // Light blue
    PLASMA: '#D5A6BD', // Purple
    GAS: '#C27BA0', // Pink
    EXOTIC: '#CC0000', // Red
    ORGANIC: '#B6D7A8', // Light green
    FOOD: '#93C47D', // Darker green
    IRON: '#A2C4C9', // Steel blue
    COPPER: '#E69138', // Copper orange
    TITANIUM: '#CCCCCC', // Silver
    URANIUM: '#76A5AF', // Blue-green
    WATER: '#9FC5E8', // Light blue
    HELIUM: '#EAD1DC', // Light pink
    DEUTERIUM: '#CFE2F3', // Very light blue
    ANTIMATTER: '#FF0000', // Bright red
    DARK_MATTER: '#351C75', // Deep purple
    EXOTIC_MATTER: '#FF00FF', // Magenta
  };

  return (resourceTypeColors as Record<string, string>)[resourceType] || defaultColor;
}

/**
 * Converts a hex color code to RGB components
 * @param hex Hex color code (e.g., '#FF0000')
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Default to black if invalid hex
  const defaultRgb = { r: 0, g: 0, b: 0 };

  // Remove # if present
  const sanitizedHex = hex.replace(/^#/, '');

  // Handle different hex formats
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(sanitizedHex)) {
    return defaultRgb;
  }

  let r, g, b;

  if (sanitizedHex.length === 3) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    r = parseInt(sanitizedHex.charAt(0) + sanitizedHex.charAt(0), 16);
    g = parseInt(sanitizedHex.charAt(1) + sanitizedHex.charAt(1), 16);
    b = parseInt(sanitizedHex.charAt(2) + sanitizedHex.charAt(2), 16);
  } else {
    r = parseInt(sanitizedHex.substring(0, 2), 16);
    g = parseInt(sanitizedHex.substring(2, 4), 16);
    b = parseInt(sanitizedHex.substring(4, 6), 16);
  }

  return { r, g, b };
}

//=============================================================================
// Data Format Transformations
//=============================================================================

/**
 * Transforms cluster data from analysis results
 * @param result Analysis result containing cluster data
 * @param allData All data points
 */
export function transformClusterData(
  result: AnalysisResult,
  allData: ChartDataRecord[]
): {
  clusters: unknown[];
  features: string[];
  clusterPoints: ClusterPoint[];
} {
  if (!result || typeof result !== 'object') {
    return {
      clusters: [],
      features: [],
      clusterPoints: [],
    };
  }

  const resultData =
    result.data && typeof result.data === 'object' ? (result.data as Record<string, unknown>) : {};

  const clusters = safelyExtractArray(resultData, 'clusters', []);
  const features = safelyExtractArray<string>(resultData, 'features', []);
  const clusterPoints: ClusterPoint[] = [];

  clusters.forEach(cluster => {
    if (!cluster || typeof cluster !== 'object') return;

    const clusterObj = cluster as Record<string, unknown>;
    const clusterIndex = safelyExtractNumber(clusterObj, 'cluster', 0);
    const pointIds = safelyExtractArray<string>(clusterObj, 'pointIds', []);

    pointIds.forEach(pointId => {
      const originalPoint = allData.find(p => p.id === pointId);
      if (!originalPoint) return;

      // Type cast to Record<string, unknown> for proper extraction
      const originalPointObj = originalPoint as Record<string, unknown>;

      const featureValues = features.map(feature => {
        const value = safelyExtractPath<unknown>(
          originalPointObj,
          feature,
          safelyExtractPath<unknown>(originalPointObj, `properties.${feature}`, null)
        );

        return isNumber(value) ? value : null;
      });

      clusterPoints.push({
        id: pointId,
        name: safelyExtractString(originalPoint, 'name', `Point-${pointId}`),
        type: safelyExtractString(originalPoint, 'type', 'unknown'),
        cluster: clusterIndex,
        features: featureValues,
        distanceToCentroid: 0, // Default value
        originalPoint: originalPoint as unknown as DataPoint,
      });
    });
  });

  return {
    clusters,
    features,
    clusterPoints,
  };
}

/**
 * Transforms prediction data from analysis results
 * @param result Analysis result containing prediction data
 */
export function transformPredictionData(result: AnalysisResult): {
  predictions: PredictionPoint[];
  forecast: ForecastPoint[];
  model: string;
  targetVariable: string;
  features: string[];
  metrics: unknown;
  modelDetails: unknown;
} {
  if (!result || typeof result !== 'object') {
    return {
      predictions: [],
      forecast: [],
      model: 'unknown',
      targetVariable: '',
      features: [],
      metrics: { mse: 0, rmse: 0, mae: 0 },
      modelDetails: {},
    };
  }

  // Extract data with type safety
  const resultData = result.data && typeof result.data === 'object' ? result.data : {};
  const predictions = safelyExtractArray<PredictionPoint>(resultData, 'predictions', []);
  const forecast = safelyExtractArray<ForecastPoint>(resultData, 'forecast', []);
  const features = safelyExtractArray<string>(resultData, 'features', []);
  const metrics = safelyExtractObject(resultData, 'metrics', { mse: 0, rmse: 0, mae: 0 });
  const modelDetails = safelyExtractObject(resultData, 'modelDetails', {});
  const model = safelyExtractString(resultData, 'model', 'unknown');

  // Get the target variable safely
  let targetVariable = '';
  if (resultData && typeof resultData === 'object') {
    const config = safelyExtractObject(resultData, 'config', {});
    const params = safelyExtractObject(config, 'parameters', {});
    targetVariable = safelyExtractString(params, 'target', '');
  }

  // Process model details based on model type
  let typedModelDetails: unknown;

  if (model === 'linear') {
    typedModelDetails = {
      coefficients: safelyExtractArray<number>(modelDetails, 'coefficients', [0]),
      weights: safelyExtractArray<number>(modelDetails, 'weights', []),
      featureImportance: safelyExtractArray(modelDetails, 'featureImportance', []),
    };
  } else if (model === 'neuralNetwork') {
    typedModelDetails = {
      architecture: safelyExtractObject(modelDetails, 'architecture', {
        inputSize: 0,
        hiddenUnits: 0,
        activation: 'unknown',
      }),
      training: safelyExtractObject(modelDetails, 'training', {
        epochs: 0,
        learningRate: 0,
        batchSize: 0,
      }),
      normalization: safelyExtractObject(modelDetails, 'normalization', {
        means: [],
        stdDevs: [],
      }),
    };
  } else {
    typedModelDetails = modelDetails;
  }

  return {
    predictions,
    forecast,
    model,
    targetVariable,
    features,
    metrics,
    modelDetails: typedModelDetails,
  };
}

/**
 * Transforms resource mapping data from analysis results
 * @param result Analysis result containing resource mapping data
 */
export function transformResourceMappingData(result: AnalysisResult): {
  resourcePoints: DataPoint[];
  gridCells: ResourceGridCell[];
  resourceTypes: ResourceType[];
  valueMetric: string;
  regionSize: number;
  xRange: [number, number];
  yRange: [number, number];
  density: Record<string, number>;
  insights: string[];
  summary: string;
} {
  if (!result || typeof result !== 'object') {
    return {
      resourcePoints: [],
      gridCells: [],
      resourceTypes: [],
      valueMetric: 'amount',
      regionSize: 0,
      xRange: [0, 0],
      yRange: [0, 0],
      density: {},
      insights: [],
      summary: '',
    };
  }

  // Extract with type guards
  const resultData =
    result.data && typeof result.data === 'object' ? (result.data as Record<string, unknown>) : {};

  // Safely extract all data with proper type checking
  const resourcePoints = safelyExtractArray<DataPoint>(resultData, 'resourcePoints', []);
  const gridCells = safelyExtractArray<ResourceGridCell>(resultData, 'gridCells', []);
  const resourceTypes = safelyExtractArray<ResourceType>(resultData, 'resourceTypes', []);

  const valueMetric = safelyExtractString(resultData, 'valueMetric', 'amount') as
    | 'amount'
    | 'quality'
    | 'accessibility'
    | 'estimatedValue';

  const regionSize = safelyExtractNumber(resultData, 'regionSize', 1);

  // Ensure ranges are properly formatted
  let xRange: [number, number] = [0, 0];
  let yRange: [number, number] = [0, 0];

  if (
    isArray(resultData?.xRange) &&
    resultData?.xRange.length === 2 &&
    isNumber(resultData?.xRange[0]) &&
    isNumber(resultData?.xRange[1])
  ) {
    xRange = resultData?.xRange as [number, number];
  }

  if (
    isArray(resultData?.yRange) &&
    resultData?.yRange.length === 2 &&
    isNumber(resultData?.yRange[0]) &&
    isNumber(resultData?.yRange[1])
  ) {
    yRange = resultData?.yRange as [number, number];
  }

  // Extract remaining data safely
  const density = safelyExtractObject<Record<string, number>>(resultData, 'density', {});

  // Use type guards for direct property access
  const insightsData =
    result.insights && Array.isArray(result.insights)
      ? (result.insights.filter(insight => typeof insight === 'string') as string[])
      : [];

  const summaryText = result.summary && typeof result.summary === 'string' ? result.summary : '';

  return {
    resourcePoints,
    gridCells,
    resourceTypes,
    valueMetric,
    regionSize,
    xRange,
    yRange,
    density,
    insights: insightsData,
    summary: summaryText,
  };
}

/**
 * Transforms raw data points into scatter plot format
 * @param dataPoints Array of data points with coordinates
 * @param valueMetric Metric to use for point value
 */
export function transformToScatterFormat(
  dataPoints: DataPoint[],
  valueMetric: string = 'amount'
): Array<{
  id: string;
  name: string;
  x: number;
  y: number;
  value: number;
  type: string;
  coordinates: { x: number; y: number };
}> {
  if (!isArray(dataPoints) || dataPoints.length === 0) {
    return [];
  }

  return dataPoints.map(point => {
    // Safely extract properties
    const properties = safelyExtractObject(point, 'properties', {});
    const resourceType = safelyExtractString(
      properties,
      'resourceType',
      safelyExtractString(properties, 'type', 'unknown')
    );

    const value = safelyExtractNumber(
      properties,
      valueMetric,
      safelyExtractNumber(properties, 'amount', 1)
    );

    const coordinates = safelyExtractObject(point, 'coordinates', { x: 0, y: 0 });

    return {
      id: safelyExtractString(point, 'id', `point-${Math.random().toString(36).substr(2, 9)}`),
      name: safelyExtractString(point, 'name', `Resource ${point.id || 'Unknown'}`),
      x: safelyExtractNumber(coordinates, 'x', 0),
      y: safelyExtractNumber(coordinates, 'y', 0),
      value,
      type: resourceType,
      coordinates: {
        x: safelyExtractNumber(coordinates, 'x', 0),
        y: safelyExtractNumber(coordinates, 'y', 0),
      },
    };
  });
}

/**
 * Transforms resource grid cells into heat map format
 * @param gridCells Array of grid cells
 * @param valueMetric Metric to use for cell value
 * @param selectedResourceType Type of resource to filter by (or 'all')
 */
export function transformToHeatMapFormat(
  gridCells: ResourceGridCell[],
  valueMetric: string = 'amount',
  selectedResourceType: string = 'all'
): Array<{
  x: number;
  y: number;
  value: number;
  resources: Array<{
    type: ResourceType;
    amount: number;
    quality?: number;
    accessibility?: number;
    estimatedValue?: number;
  }>;
}> {
  if (!Array.isArray(gridCells)) {
    return [];
  }

  return gridCells.map(cell => {
    // Convert ResourceGridCell to Record<string, unknown> via unknown
    const cellObj = cell as unknown as Record<string, unknown>;
    let value = 0;

    if (selectedResourceType === 'all') {
      value = safelyExtractNumber(cellObj, 'totalValue', 0);
    } else {
      const resources = safelyExtractArray(cellObj, 'resources', []);
      const resourceData = resources.find(
        r =>
          typeof r === 'object' &&
          r !== null &&
          safelyExtractString(r as Record<string, unknown>, 'type', '') === selectedResourceType
      );

      if (resourceData && typeof resourceData === 'object') {
        value = safelyExtractNumber(
          resourceData as Record<string, unknown>,
          valueMetric,
          safelyExtractNumber(resourceData as Record<string, unknown>, 'amount', 0)
        );
      }
    }

    return {
      x: safelyExtractNumber(cellObj, 'x', 0),
      y: safelyExtractNumber(cellObj, 'y', 0),
      value,
      resources: safelyExtractArray(cellObj, 'resources', []),
    };
  });
}

//=============================================================================
// Filtering utilities
//=============================================================================

/**
 * Type-safe conversion of filter values
 * @param value The value to convert
 * @param operator The filter operator determining the expected type
 */
export function convertFilterValue(
  value: string,
  operator: string
): string | number | boolean | [number, number] {
  // Numeric operators
  if (['greaterThan', 'lessThan', 'equals', 'notEquals'].includes(operator)) {
    // Try to convert to number first
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num;
    }

    // Handle boolean values
    if (value === 'true' || value === 'false') {
      return value === 'true';
    }
  }

  // Between operator (expects a range)
  if (operator === 'between' && value.includes(',')) {
    const [minStr, maxStr] = value.split(',');
    const min = parseFloat(minStr.trim());
    const max = parseFloat(maxStr.trim());
    if (!isNaN(min) && !isNaN(max)) {
      return [min, max];
    }
  }

  // Default to string
  return value;
}

/**
 * Formats a filter value for display
 * @param value The filter value
 */
export function formatFilterValue(value: string | number | boolean | [number, number]): string {
  if (Array.isArray(value)) {
    return `${value[0]} to ${value[1]}`;
  }
  return String(value);
}

/**
 * Applies filters to a dataset
 * @param data Array of data objects
 * @param filters Array of filter objects
 */
export function applyFilters(
  data: Array<Record<string, unknown>>,
  filters: Array<{
    field: string;
    operator: string;
    value: string | number | boolean | [number, number];
  }>
): Array<Record<string, unknown>> {
  if (!Array.isArray(data) || !Array.isArray(filters)) {
    return [];
  }

  return data.filter(item => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    return filters.every(filter => {
      const { field, operator, value } = filter;
      const fieldPath = field.split('.');

      // Safely extract the field value
      let currentObj: unknown = item;
      for (const key of fieldPath) {
        if (!currentObj || typeof currentObj !== 'object') {
          return false;
        }
        currentObj = (currentObj as Record<string, unknown>)[key];
      }

      const fieldValue = currentObj;

      switch (operator) {
        case 'equals':
          return fieldValue === value;

        case 'notEquals':
          return fieldValue !== value;

        case 'greaterThan':
          return isNumber(fieldValue) && isNumber(value) && fieldValue > value;

        case 'lessThan':
          return isNumber(fieldValue) && isNumber(value) && fieldValue < value;

        case 'contains':
          return (
            isString(fieldValue) &&
            isString(value) &&
            fieldValue.toLowerCase().includes(value.toLowerCase())
          );

        case 'notContains':
          return (
            isString(fieldValue) &&
            isString(value) &&
            !fieldValue.toLowerCase().includes(value.toLowerCase())
          );

        case 'between':
          return (
            isNumber(fieldValue) &&
            Array.isArray(value) &&
            value.length === 2 &&
            isNumber(value[0]) &&
            isNumber(value[1]) &&
            fieldValue >= value[0] &&
            fieldValue <= value[1]
          );

        default:
          return true;
      }
    });
  });
}

//=============================================================================
// Pagination utilities
//=============================================================================

/**
 * Creates a paginated subset of data
 * @param data The full dataset
 * @param pageSize Number of items per page
 * @param currentPage Current page number (0-based)
 */
export function paginateData<T>(
  data: T[],
  pageSize: number,
  currentPage: number
): {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  if (!Array.isArray(data)) {
    return {
      items: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  const totalItems = data?.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.max(0, Math.min(currentPage, totalPages - 1));

  const startIndex = safePage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    items: data?.slice(startIndex, endIndex),
    totalItems,
    totalPages,
    currentPage: safePage,
    hasNextPage: safePage < totalPages - 1,
    hasPreviousPage: safePage > 0,
  };
}

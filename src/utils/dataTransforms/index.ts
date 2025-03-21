/**
 * Data Transformation Utilities
 *
 * This module exports consolidated utilities for transforming data
 * for visualization components, filtering, and scientific analysis.
 *
 * Each utility is organized by purpose to make it easier to find
 * and use the appropriate transformation functions.
 */

// Export all chart transformation utilities
export * from './chartTransforms';

// Export all scientific transformation utilities
export * from './scientificTransforms';

// Export all filter transformation utilities
export * from './filterTransforms';
export { calculateDomain, calculateDomains };

// Re-export specific utilities with more descriptive names to improve discoverability

// Domain calculation
import { calculateDomain, calculateDomains } from './chartTransforms';

// Color utilities
import { createColorScale, getResourceTypeColor, hexToRgb } from './chartTransforms';
export { createColorScale, getResourceTypeColor, hexToRgb };

// Safe data extraction
import {
  safelyExtractArray,
  safelyExtractNumber,
  safelyExtractObject,
  safelyExtractPath,
  safelyExtractString,
} from './chartTransforms';
export {
  safelyExtractArray,
  safelyExtractNumber,
  safelyExtractObject,
  safelyExtractPath,
  safelyExtractString,
};

// Type guards
import { isArray, isNumber, isObject, isString } from './chartTransforms';
export { isArray, isNumber, isObject, isString };

// Data transformations for specific visualization types
import {
  transformClusterData,
  transformPredictionData,
  transformResourceMappingData,
  transformToHeatMapFormat,
  transformToScatterFormat,
} from './chartTransforms';
export {
  transformClusterData,
  transformPredictionData,
  transformResourceMappingData,
  transformToHeatMapFormat,
  transformToScatterFormat,
};

// Pagination
import { paginateData } from './chartTransforms';
export { paginateData };

// Scientific transformations
import {
  calculateClusterCentroids,
  calculateCorrelationMatrix,
  calculateDistancesToCentroids,
  calculateResiduals,
  calculateStatistics,
  extractFeatureImportance,
  isLinearRegressionModel,
  isNeuralNetworkModel,
  transformTimeSeriesData,
} from './scientificTransforms';
export {
  calculateClusterCentroids,
  calculateCorrelationMatrix,
  calculateDistancesToCentroids,
  calculateResiduals,
  calculateStatistics,
  extractFeatureImportance,
  isLinearRegressionModel,
  isNeuralNetworkModel,
  transformTimeSeriesData,
};

// Filter transformations
import {
  applyComplexFilter,
  applyFilter,
  applyFilters,
  convertFilterValue,
  createFilter,
  detectFieldTypes,
  formatFilter,
  formatFilterValue,
  getFieldRange,
  getInputTypeForOperator,
  getUniqueValues,
  validateFilter,
} from './filterTransforms';
export {
  applyComplexFilter,
  applyFilter,
  applyFilters,
  convertFilterValue,
  createFilter,
  detectFieldTypes,
  formatFilter,
  formatFilterValue,
  getFieldRange,
  getInputTypeForOperator,
  getUniqueValues,
  validateFilter,
};

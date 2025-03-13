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

// Re-export specific utilities with more descriptive names to improve discoverability

// Domain calculation
import { calculateDomain, calculateDomains } from './chartTransforms';
export { calculateDomain, calculateDomains };

// Color utilities
import { createColorScale, getResourceTypeColor, hexToRgb } from './chartTransforms';
export { createColorScale, getResourceTypeColor, hexToRgb };

// Safe data extraction 
import { 
  safelyExtractNumber, 
  safelyExtractString, 
  safelyExtractArray, 
  safelyExtractObject, 
  safelyExtractPath 
} from './chartTransforms';
export {
  safelyExtractNumber, 
  safelyExtractString, 
  safelyExtractArray, 
  safelyExtractObject, 
  safelyExtractPath
};

// Type guards
import { isNumber, isString, isArray, isObject } from './chartTransforms';
export { isNumber, isString, isArray, isObject };

// Data transformations for specific visualization types
import { 
  transformClusterData, 
  transformPredictionData, 
  transformResourceMappingData,
  transformToScatterFormat,
  transformToHeatMapFormat
} from './chartTransforms';
export {
  transformClusterData, 
  transformPredictionData, 
  transformResourceMappingData,
  transformToScatterFormat,
  transformToHeatMapFormat
};

// Pagination
import { paginateData } from './chartTransforms';
export { paginateData };

// Scientific transformations
import { 
  transformTimeSeriesData, 
  calculateResiduals,
  calculateCorrelationMatrix,
  calculateStatistics,
  extractFeatureImportance,
  isLinearRegressionModel,
  isNeuralNetworkModel,
  calculateClusterCentroids,
  calculateDistancesToCentroids
} from './scientificTransforms';
export {
  transformTimeSeriesData, 
  calculateResiduals,
  calculateCorrelationMatrix,
  calculateStatistics,
  extractFeatureImportance,
  isLinearRegressionModel,
  isNeuralNetworkModel,
  calculateClusterCentroids,
  calculateDistancesToCentroids
};

// Filter transformations 
import {
  createFilter,
  validateFilter,
  convertFilterValue,
  formatFilterValue,
  formatFilter,
  getInputTypeForOperator,
  applyFilter,
  applyFilters, 
  applyComplexFilter,
  detectFieldTypes,
  getUniqueValues,
  getFieldRange
} from './filterTransforms';
export {
  createFilter,
  validateFilter,
  convertFilterValue,
  formatFilterValue,
  formatFilter,
  getInputTypeForOperator,
  applyFilter,
  applyFilters, 
  applyComplexFilter,
  detectFieldTypes,
  getUniqueValues,
  getFieldRange
};
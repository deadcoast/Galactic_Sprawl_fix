/**
 * Scientific Data Transformation Utilities
 *
 * This module provides specialized utilities for scientific data transformations
 * used in advanced analysis visualizations like prediction models, clustering, and
 * statistical analysis.
 */

import { safelyExtractArray, safelyExtractNumber, safelyExtractObject } from './chartTransforms';

//=============================================================================
// Time Series Transformations
//=============================================================================

/**
 * Transforms time series data for visualization
 * @param timePoints Array of time points
 * @param actualValues Array of actual values
 * @param predictedValues Array of predicted values (optional)
 * @param forecastValues Array of forecast values (optional)
 */
export function transformTimeSeriesData(
  timePoints: number[] | string[],
  actualValues: number[],
  predictedValues?: number[],
  forecastValues?: number[]
): Array<{
  time: number | string;
  actual?: number;
  predicted?: number;
  forecast?: number;
}> {
  // Create time series data points
  const timeSeriesData: Array<{
    time: number | string;
    actual?: number;
    predicted?: number;
    forecast?: number;
  }> = [];

  // Add actual and predicted values
  const maxActualLength = Math.min(timePoints.length, actualValues.length);
  for (let i = 0; i < maxActualLength; i++) {
    const point: {
      time: number | string;
      actual?: number;
      predicted?: number;
    } = {
      time: timePoints[i],
      actual: actualValues[i],
    };

    if (predictedValues && i < predictedValues.length) {
      point.predicted = predictedValues[i];
    }

    timeSeriesData.push(point);
  }

  // Add forecast values
  if (forecastValues && forecastValues.length > 0) {
    // Calculate the start index for forecast values
    const forecastStartIndex = timeSeriesData.length;
    const forecastTimes = timePoints.slice(forecastStartIndex);

    // Add available forecast times, or generate them if needed
    for (let i = 0; i < forecastValues.length; i++) {
      const time =
        i < forecastTimes.length
          ? forecastTimes[i]
          : generateNextTimePoint(timePoints, forecastStartIndex + i);

      timeSeriesData.push({
        time,
        forecast: forecastValues[i],
      });
    }
  }

  return timeSeriesData;
}

/**
 * Generates a next time point for forecasting based on pattern detection
 * @param existingTimePoints Array of existing time points
 * @param index Index of the new time point
 */
function generateNextTimePoint(
  existingTimePoints: Array<number | string>,
  index: number
): number | string {
  if (existingTimePoints.length < 2) {
    return index; // Default to index if not enough points to detect pattern
  }

  // Check if time points are numeric and follow a pattern
  if (typeof existingTimePoints[0] === 'number' && typeof existingTimePoints[1] === 'number') {
    const firstPoint = existingTimePoints[0] as number;
    const lastPoint = existingTimePoints[existingTimePoints.length - 1] as number;
    const interval = (lastPoint - firstPoint) / (existingTimePoints.length - 1);
    return lastPoint + interval * (index - existingTimePoints.length + 1);
  }

  // Handle date string pattern (assuming ISO format for simplicity)
  if (typeof existingTimePoints[0] === 'string' && typeof existingTimePoints[1] === 'string') {
    try {
      const firstDate = new Date(existingTimePoints[0]);
      const lastDate = new Date(existingTimePoints[existingTimePoints.length - 1]);

      // Calculate interval in milliseconds
      const interval = (lastDate.getTime() - firstDate.getTime()) / (existingTimePoints.length - 1);

      // Calculate next date
      const nextDate = new Date(
        lastDate.getTime() + interval * (index - existingTimePoints.length + 1)
      );
      return nextDate.toISOString().split('T')[0]; // Return as YYYY-MM-DD
    } catch (e) {
      // If date parsing fails, return string representation of index
      return `Point ${index}`;
    }
  }

  // Default fallback
  return `Point ${index}`;
}

/**
 * Calculates residuals (actual - predicted)
 * @param actualValues Array of actual values
 * @param predictedValues Array of predicted values
 */
export function calculateResiduals(actualValues: number[], predictedValues: number[]): number[] {
  // Calculate residuals (actual - predicted)
  const residuals: number[] = [];
  const minLength = Math.min(actualValues.length, predictedValues.length);

  for (let i = 0; i < minLength; i++) {
    residuals.push(actualValues[i] - predictedValues[i]);
  }

  return residuals;
}

//=============================================================================
// Statistical Transformations
//=============================================================================

/**
 * Calculates correlation coefficients between variables
 * @param data Array of data objects
 * @param variables Array of variable names to correlate
 */
export function calculateCorrelationMatrix(
  data: Array<Record<string, unknown>>,
  variables: string[]
): Array<Array<number>> {
  if (!data || data?.length === 0 || !variables || variables.length === 0) {
    return [];
  }

  // Extract numeric values for each variable
  const extractedData: Record<string, number[]> = {};

  // Initialize arrays for each variable
  variables.forEach(variable => {
    extractedData[variable] = [];
  });

  // Extract values from data
  data?.forEach(item => {
    variables.forEach(variable => {
      const value = safelyExtractNumber(item, variable, NaN);
      if (!isNaN(value)) {
        extractedData[variable].push(value);
      }
    });
  });

  // Create correlation matrix
  const correlationMatrix: number[][] = [];

  // Calculate correlation for each pair of variables
  for (let i = 0; i < variables.length; i++) {
    correlationMatrix[i] = [];
    for (let j = 0; j < variables.length; j++) {
      // Diagonal values are always 1 (self-correlation)
      if (i === j) {
        correlationMatrix[i][j] = 1;
        continue;
      }

      // Get values for variables
      const variable1Values = extractedData[variables[i]];
      const variable2Values = extractedData[variables[j]];

      // Calculate correlation
      const correlation = calculatePearsonCorrelation(variable1Values, variable2Values);
      correlationMatrix[i][j] = correlation;
    }
  }

  return correlationMatrix;
}

/**
 * Calculates Pearson correlation coefficient between two variables
 * @param values1 Array of values for first variable
 * @param values2 Array of values for second variable
 */
function calculatePearsonCorrelation(values1: number[], values2: number[]): number {
  // Calculate valid data points (where both values exist)
  const validPairs: Array<[number, number]> = [];

  const minLength = Math.min(values1.length, values2.length);
  for (let i = 0; i < minLength; i++) {
    if (!isNaN(values1[i]) && !isNaN(values2[i])) {
      validPairs.push([values1[i], values2[i]]);
    }
  }

  // Handle insufficient data
  if (validPairs.length < 2) {
    return NaN;
  }

  // Calculate means
  let sum1 = 0;
  let sum2 = 0;
  for (const [val1, val2] of validPairs) {
    sum1 += val1;
    sum2 += val2;
  }
  const mean1 = sum1 / validPairs.length;
  const mean2 = sum2 / validPairs.length;

  // Calculate correlation coefficient
  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  for (const [val1, val2] of validPairs) {
    const diff1 = val1 - mean1;
    const diff2 = val2 - mean2;
    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  }

  // Avoid division by zero
  if (denominator1 === 0 || denominator2 === 0) {
    return 0;
  }

  return numerator / Math.sqrt(denominator1 * denominator2);
}

/**
 * Calculates descriptive statistics for a variable
 * @param data Array of data objects
 * @param variable Variable name to analyze
 */
export function calculateStatistics(
  data: Array<Record<string, unknown>>,
  variable: string
): {
  min: number;
  max: number;
  mean: number;
  median: number;
  standardDeviation: number;
  count: number;
  missing: number;
} {
  if (!data || data?.length === 0) {
    return {
      min: NaN,
      max: NaN,
      mean: NaN,
      median: NaN,
      standardDeviation: NaN,
      count: 0,
      missing: 0,
    };
  }

  // Extract values and filter out invalid ones
  const values: number[] = [];
  let missing = 0;

  data?.forEach(item => {
    const value = safelyExtractNumber(item, variable, NaN);
    if (!isNaN(value)) {
      values.push(value);
    } else {
      missing++;
    }
  });

  // Handle no valid values
  if (values.length === 0) {
    return {
      min: NaN,
      max: NaN,
      mean: NaN,
      median: NaN,
      standardDeviation: NaN,
      count: 0,
      missing,
    };
  }

  // Sort values for min, max, and median calculations
  values.sort((a, b) => a - b);

  const min = values[0];
  const max = values[values.length - 1];

  // Calculate mean
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  // Calculate median
  let median: number;
  const middle = Math.floor(values.length / 2);
  if (values.length % 2 === 0) {
    median = (values[middle - 1] + values[middle]) / 2;
  } else {
    median = values[middle];
  }

  // Calculate standard deviation
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    min,
    max,
    mean,
    median,
    standardDeviation,
    count: values.length,
    missing,
  };
}

//=============================================================================
// Feature Importance and Model Transformations
//=============================================================================

/**
 * Extracts feature importance from model details
 * @param modelDetails Model details object
 * @param features Array of feature names
 */
export function extractFeatureImportance(
  modelDetails: Record<string, unknown>,
  features: string[]
): Array<{ feature: string; importance: number }> {
  // Try to extract explicit feature importance
  const explicitImportance = safelyExtractArray<{ feature: string; importance: number }>(
    modelDetails,
    'featureImportance',
    []
  );

  if (explicitImportance.length > 0) {
    return explicitImportance;
  }

  // Try to extract coefficients for linear models
  const coefficients = safelyExtractArray<number>(modelDetails, 'coefficients', []);

  if (coefficients.length > 0 && features.length > 0) {
    // Create feature importance from coefficients
    // Use absolute values as importance measure
    return features
      .map((feature, index) => {
        const coefficient = index < coefficients.length ? Math.abs(coefficients[index]) : 0;
        return {
          feature,
          importance: coefficient,
        };
      })
      .sort((a, b) => b.importance - a.importance);
  }

  // Try to extract weights for other models
  const weights = safelyExtractArray<number>(modelDetails, 'weights', []);

  if (weights.length > 0 && features.length > 0) {
    // Create feature importance from weights
    return features
      .map((feature, index) => {
        const weight = index < weights.length ? Math.abs(weights[index]) : 0;
        return {
          feature,
          importance: weight,
        };
      })
      .sort((a, b) => b.importance - a.importance);
  }

  // Return empty array if no importance data found
  return [];
}

/**
 * Type guard to check if model details are from a linear regression model
 * @param modelDetails Model details object
 */
export function isLinearRegressionModel(modelDetails: Record<string, unknown>): boolean {
  // Check for coefficients which are typical for linear models
  const coefficients = safelyExtractArray(modelDetails, 'coefficients', undefined);
  return Array.isArray(coefficients) && coefficients.length > 0;
}

/**
 * Type guard to check if model details are from a neural network model
 * @param modelDetails Model details object
 */
export function isNeuralNetworkModel(modelDetails: Record<string, unknown>): boolean {
  // Check for architecture which is typical for neural networks
  const architecture = safelyExtractObject(modelDetails, 'architecture', {});
  return !!architecture && typeof architecture === 'object';
}

//=============================================================================
// Clustering Transformations
//=============================================================================

/**
 * Calculates cluster centroids from cluster points
 * @param clusterPoints Array of cluster points
 * @param features Array of feature names
 */
export function calculateClusterCentroids(
  clusterPoints: Array<{
    cluster: number;
    features: Array<number | null>;
  }>,
  features: string[]
): Array<{
  cluster: number;
  centroid: number[];
  size: number;
}> {
  if (!clusterPoints || clusterPoints.length === 0 || !features || features.length === 0) {
    return [];
  }

  // Group points by cluster
  const clusters: Record<number, Array<Array<number | null>>> = {};

  clusterPoints.forEach(point => {
    const { cluster, features: pointFeatures } = point;

    if (!clusters[cluster]) {
      clusters[cluster] = [];
    }

    clusters[cluster].push(pointFeatures);
  });

  // Calculate centroids
  const centroids: Array<{
    cluster: number;
    centroid: number[];
    size: number;
  }> = [];

  for (const [clusterStr, points] of Object.entries(clusters)) {
    const cluster = parseInt(clusterStr, 10);
    const numFeatures = features.length;
    const validCounts: number[] = Array(numFeatures).fill(0);
    const sums: number[] = Array(numFeatures).fill(0);

    // Sum values by feature
    points.forEach(pointFeatures => {
      pointFeatures.forEach((value, i) => {
        if (value !== null && !isNaN(value)) {
          sums[i] += value;
          validCounts[i]++;
        }
      });
    });

    // Calculate averages
    const centroid = sums.map((sum, i) => (validCounts[i] > 0 ? sum / validCounts[i] : 0));

    centroids.push({
      cluster,
      centroid,
      size: points.length,
    });
  }

  return centroids;
}

/**
 * Calculates distances between points and their cluster centroids
 * @param clusterPoints Array of cluster points
 * @param centroids Array of cluster centroids
 */
export function calculateDistancesToCentroids(
  clusterPoints: Array<{
    cluster: number;
    features: Array<number | null>;
  }>,
  centroids: Array<{
    cluster: number;
    centroid: number[];
  }>
): Array<{
  pointIndex: number;
  distance: number;
}> {
  if (!clusterPoints || clusterPoints.length === 0 || !centroids || centroids.length === 0) {
    return [];
  }

  // Map centroids by cluster for quick lookup
  const centroidMap = new Map<number, number[]>();
  centroids.forEach(({ cluster, centroid }) => {
    centroidMap.set(cluster, centroid);
  });

  // Calculate distances
  return clusterPoints
    .map((point, index) => {
      const centroid = centroidMap.get(point.cluster);

      // Skip if centroid not found
      if (!centroid) {
        return {
          pointIndex: index,
          distance: Infinity,
        };
      }

      // Calculate Euclidean distance
      let sum = 0;
      let validDimensions = 0;

      point.features.forEach((value, i) => {
        if (value !== null && !isNaN(value) && i < centroid.length) {
          sum += Math.pow(value - centroid[i], 2);
          validDimensions++;
        }
      });

      // Handle case where no valid dimensions exist
      if (validDimensions === 0) {
        return {
          pointIndex: index,
          distance: Infinity,
        };
      }

      // Normalize by dimensionality for fair comparison
      const distance = Math.sqrt(sum) / Math.sqrt(validDimensions);

      return {
        pointIndex: index,
        distance,
      };
    })
    .filter(item => isFinite(item?.distance))
    .sort((a, b) => b.distance - a.distance); // Sort descending (most distant first)
}

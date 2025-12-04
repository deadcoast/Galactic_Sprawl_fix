/**
 * ResourceConsumptionPredictor
 *
 * A machine learning model implementation for predicting resource consumption patterns.
 * This system analyzes historical resource usage data to predict future consumption
 * trends, allowing for optimized resource allocation and proactive performance tuning.
 */

import { PerformanceMetrics } from '../../managers/resource/ResourcePerformanceMonitor';
import { ResourceType } from './../../types/resources/ResourceTypes';

/**
 * Data point for model training and prediction
 */
export interface ConsumptionDataPoint {
  timestamp: number;
  resourceType: ResourceType;
  value: number;
  sessionDuration: number;
  userActions: number;
  systemLoad: number;
  devicePerformanceScore?: number;
}

/**
 * Prediction result with confidence metrics
 */
export interface ConsumptionPrediction {
  resourceType: ResourceType;
  predictedValue: number;
  confidence: number;
  timeframe: 'short' | 'medium' | 'long'; // prediction timeframe
  potentialSavings: number;
  timestamp: number;
}

/**
 * Trained model data structure
 */
interface ModelData {
  resourceType: ResourceType;
  coefficients: number[];
  intercept: number;
  confidenceScore: number;
  lastUpdated: number;
}

/**
 * Machine learning model for predicting resource consumption
 * Uses a linear regression approach with support for online learning
 */
export class ResourceConsumptionPredictor {
  private models = new Map<ResourceType, ModelData>();
  private historicalData = new Map<ResourceType, ConsumptionDataPoint[]>();
  private predictionCache = new Map<ResourceType, ConsumptionPrediction>();

  // Configuration
  private maxHistoricalDataPoints = 1000;
  private predictionUpdateIntervalMs = 60000; // 1 minute
  private minDataPointsForTraining = 30;
  private lastPredictionTime = 0;

  constructor() {
    this.lastPredictionTime = Date.now();
  }

  /**
   * Initialize the predictor with existing metrics history if available
   */
  public initialize(metricsHistory?: Map<ResourceType, PerformanceMetrics[]>): void {
    if (metricsHistory) {
      for (const [resourceType, metrics] of metricsHistory.entries()) {
        const dataPoints: ConsumptionDataPoint[] = metrics.map(metric => ({
          timestamp: metric.timestamp,
          resourceType: metric.resourceType as ResourceType,
          value: metric.consumptionRate,
          sessionDuration: 0, // Will be calculated based on first entry
          userActions: 0, // Will need to be populated from event data
          systemLoad: 0, // Will be derived from overall metrics
        }));

        this.historicalData.set(resourceType, dataPoints);
      }

      // Initialize models for resources with sufficient data
      this.initializeModels();
    }

    console.warn('[ResourceConsumptionPredictor] Initialized predictor');
  }

  /**
   * Add a new consumption data point for training
   */
  public addDataPoint(dataPoint: ConsumptionDataPoint): void {
    const { resourceType } = dataPoint;

    if (!this.historicalData.has(resourceType)) {
      this.historicalData.set(resourceType, []);
    }

    const dataPoints = this.historicalData.get(resourceType)!;
    dataPoints.push(dataPoint);

    // Limit the number of data points to prevent memory issues
    if (dataPoints.length > this.maxHistoricalDataPoints) {
      dataPoints.shift();
    }

    // Check if we need to update the model
    if (dataPoints.length >= this.minDataPointsForTraining) {
      this.trainModel(resourceType);
    }

    // Check if we need to update predictions
    if (Date.now() - this.lastPredictionTime > this.predictionUpdateIntervalMs) {
      this.updateAllPredictions();
      this.lastPredictionTime = Date.now();
    }
  }

  /**
   * Train models for all resource types that have sufficient data
   */
  private initializeModels(): void {
    for (const [resourceType, dataPoints] of this.historicalData.entries()) {
      if (dataPoints.length >= this.minDataPointsForTraining) {
        this.trainModel(resourceType);
      }
    }
  }

  /**
   * Train the model for a specific resource type
   * Implements multiple linear regression
   */
  private trainModel(resourceType: ResourceType): void {
    const dataPoints = this.historicalData.get(resourceType);
    if (!dataPoints || dataPoints.length < this.minDataPointsForTraining) {
      return;
    }

    // Extract features and target values
    const features: number[][] = dataPoints.map(dp => [
      dp.sessionDuration,
      dp.userActions,
      dp.systemLoad,
      dp.devicePerformanceScore ?? 1.0, // Default to 1.0 if not provided
      Math.sin(2 * Math.PI * (new Date(dp.timestamp).getHours() / 24)), // Time of day feature
      Math.cos(2 * Math.PI * (new Date(dp.timestamp).getHours() / 24)), // Time of day feature
    ]);

    const targets: number[] = dataPoints.map(dp => dp.value);

    // Implement linear regression using normal equation
    // X'X coefficients = X'y
    try {
      const coefficients = this.multipleLinearRegression(features, targets);

      // Calculate model confidence (R-squared)
      const predictions = features.map(feature =>
        this.predictWithCoefficients(feature, coefficients.slice(1), coefficients[0])
      );

      const confidenceScore = this.calculateConfidenceScore(targets, predictions);

      // Store the trained model
      this.models.set(resourceType, {
        resourceType,
        coefficients: coefficients.slice(1),
        intercept: coefficients[0],
        confidenceScore,
        lastUpdated: Date.now(),
      });

      console.warn(
        `[ResourceConsumptionPredictor] Trained model for ${resourceType} with confidence: ${confidenceScore.toFixed(2)}`
      );
    } catch (error) {
      console.error(
        `[ResourceConsumptionPredictor] Error training model for ${resourceType}:`,
        error
      );
    }
  }

  /**
   * Implement multiple linear regression using normal equation
   */
  private multipleLinearRegression(features: number[][], targets: number[]): number[] {
    // Add a column of 1s for the intercept term
    const X = features.map(feature => [1, ...feature]);

    // Compute X^T * X
    const XtX = this.matrixMultiply(this.transpose(X), X);

    // Compute (X^T * X)^-1
    const XtXInv = this.invertMatrix(XtX);

    // Compute X^T * y
    const Xty = this.matrixVectorMultiply(this.transpose(X), targets);

    // Compute (X^T * X)^-1 * X^T * y
    return this.matrixVectorMultiply(XtXInv, Xty);
  }

  /**
   * Matrix multiplication
   */
  private matrixMultiply(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [];

    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < a[0].length; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }

    return result;
  }

  /**
   * Matrix-vector multiplication
   */
  private matrixVectorMultiply(a: number[][], b: number[]): number[] {
    const result: number[] = [];

    for (let i = 0; i < a.length; i++) {
      let sum = 0;
      for (let j = 0; j < b.length; j++) {
        sum += a[i][j] * b[j];
      }
      result[i] = sum;
    }

    return result;
  }

  /**
   * Matrix transpose
   */
  private transpose(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: number[][] = [];

    for (let j = 0; j < cols; j++) {
      result[j] = [];
      for (let i = 0; i < rows; i++) {
        result[j][i] = matrix[i][j];
      }
    }

    return result;
  }

  /**
   * Matrix inversion using Gaussian elimination
   * This is a simplified approach and may not be numerically stable for all matrices
   */
  private invertMatrix(matrix: number[][]): number[][] {
    const n = matrix.length;

    // Create augmented matrix [A|I]
    const augmented: number[][] = [];
    for (let i = 0; i < n; i++) {
      augmented[i] = [...matrix[i]];
      for (let j = 0; j < n; j++) {
        augmented[i].push(i === j ? 1 : 0);
      }
    }

    // Gaussian elimination
    for (let i = 0; i < n; i++) {
      // Find the maximum element in the current column
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = j;
        }
      }

      // Swap the maximum row with the current row
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Scale the current row to have a 1 on the diagonal
      const scale = augmented[i][i];
      if (Math.abs(scale) < 1e-10) {
        throw new Error('Matrix is singular or nearly singular');
      }

      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= scale;
      }

      // Eliminate other rows
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const factor = augmented[j][i];
          for (let k = 0; k < 2 * n; k++) {
            augmented[j][k] -= factor * augmented[i][k];
          }
        }
      }
    }

    // Extract the right side of the augmented matrix
    const result: number[][] = [];
    for (let i = 0; i < n; i++) {
      result[i] = augmented[i].slice(n);
    }

    return result;
  }

  /**
   * Calculate the confidence score (R-squared) of the model
   */
  private calculateConfidenceScore(actual: number[], predicted: number[]): number {
    const mean = actual.reduce((sum, value) => sum + value, 0) / actual.length;

    const totalSumOfSquares = actual.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0);
    const residualSumOfSquares = actual.reduce(
      (sum, value, i) => sum + Math.pow(value - predicted[i], 2),
      0
    );

    return 1 - residualSumOfSquares / totalSumOfSquares;
  }

  /**
   * Predict consumption with model coefficients
   */
  private predictWithCoefficients(
    features: number[],
    coefficients: number[],
    intercept: number
  ): number {
    return intercept + features.reduce((sum, value, index) => sum + value * coefficients[index], 0);
  }

  /**
   * Generate consumption predictions for a resource type
   */
  public predict(
    resourceType: ResourceType,
    contextData: {
      sessionDuration: number;
      userActions: number;
      systemLoad: number;
      devicePerformanceScore?: number;
    }
  ): ConsumptionPrediction | null {
    const model = this.models.get(resourceType);
    if (!model) {
      return null;
    }

    // Create feature vector for prediction
    const features = [
      contextData.sessionDuration,
      contextData.userActions,
      contextData.systemLoad,
      contextData.devicePerformanceScore ?? 1.0,
      Math.sin(2 * Math.PI * (new Date().getHours() / 24)), // Time of day feature
      Math.cos(2 * Math.PI * (new Date().getHours() / 24)), // Time of day feature
    ];

    // Make prediction
    const predictedValue = this.predictWithCoefficients(
      features,
      model.coefficients,
      model.intercept
    );

    // Create prediction object
    const prediction: ConsumptionPrediction = {
      resourceType,
      predictedValue: Math.max(0, predictedValue), // Ensure non-negative
      confidence: model.confidenceScore,
      timeframe: 'short', // Default to short-term prediction
      potentialSavings: 0, // Will be calculated later
      timestamp: Date.now(),
    };

    // Cache prediction
    this.predictionCache.set(resourceType, prediction);

    return prediction;
  }

  /**
   * Update predictions for all resource types
   */
  private updateAllPredictions(): void {
    const now = Date.now();
    const contextData = this.generateContextData(now);

    for (const resourceType of this.models.keys()) {
      this.predict(resourceType, contextData);
    }
  }

  /**
   * Generate context data for prediction
   */
  private generateContextData(timestamp: number): {
    sessionDuration: number;
    userActions: number;
    systemLoad: number;
    devicePerformanceScore?: number;
  } {
    // In a real implementation, this data would come from system monitoring
    // For now, use placeholder values
    return {
      sessionDuration: (timestamp - this.lastPredictionTime) / 1000, // in seconds
      userActions: Math.round(Math.random() * 10), // placeholder
      systemLoad: 0.5 + Math.random() * 0.3, // placeholder
      devicePerformanceScore: 1.0, // placeholder
    };
  }

  /**
   * Get all cached predictions
   */
  public getAllPredictions(): Map<ResourceType, ConsumptionPrediction> {
    return new Map(this.predictionCache);
  }

  /**
   * Calculate potential resource savings based on predictions
   */
  public calculatePotentialSavings(resourceType: ResourceType, currentConsumption: number): number {
    const prediction = this.predictionCache.get(resourceType);
    if (!prediction) {
      return 0;
    }

    // If current consumption is higher than predicted, we can potentially save the difference
    return Math.max(0, currentConsumption - prediction.predictedValue);
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.historicalData.clear();
    this.models.clear();
    this.predictionCache.clear();
    console.warn('[ResourceConsumptionPredictor] Cleaned up predictor');
  }
}

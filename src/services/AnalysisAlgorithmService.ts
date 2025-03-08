/**
 * @file AnalysisAlgorithmService.ts
 * Service for implementing data analysis algorithms
 *
 * This service:
 * 1. Provides implementation for various analysis types
 * 2. Processes datasets using appropriate algorithms
 * 3. Generates insights from data patterns
 * 4. Implements caching for expensive calculations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisConfig,
  AnalysisResult,
  ClusteringAnalysisConfig,
  ComparisonAnalysisConfig,
  CorrelationAnalysisConfig,
  DataPoint,
  Dataset,
  DistributionAnalysisConfig,
  PredictionAnalysisConfig,
  ResourceMappingAnalysisConfig,
  SectorAnalysisConfig,
  TrendAnalysisConfig,
} from '../types/exploration/DataAnalysisTypes';

/**
 * Interface for algorithm options
 */
interface AlgorithmOptions {
  timeoutMs?: number;
  maxSamples?: number;
  normalize?: boolean;
  includeDetails?: boolean;
  confidenceThreshold?: number;
}

/**
 * Service for implementing analysis algorithms
 */
export class AnalysisAlgorithmService {
  // Cache for storing computed results to improve performance
  private resultCache: Map<string, { result: AnalysisResult; expiresAt: number }> = new Map();

  // Cache expiration time (10 minutes)
  private cacheExpirationMs = 10 * 60 * 1000;

  /**
   * Run analysis on a dataset
   */
  public async runAnalysis(
    config: AnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions = {}
  ): Promise<AnalysisResult> {
    // Generate a cache key based on config, dataset, and options
    const cacheKey = this.generateCacheKey(config, dataset, options);

    // Check if a cached result exists and is still valid
    const cachedResult = this.resultCache.get(cacheKey);
    if (cachedResult && cachedResult.expiresAt > Date.now()) {
      return cachedResult.result;
    }

    // Start the analysis
    const resultId = uuidv4();
    const startTime = Date.now();

    // Create a pending result
    const pendingResult: AnalysisResult = {
      id: resultId,
      analysisConfigId: config.id,
      status: 'processing',
      startTime,
      data: {},
    };

    try {
      // Run the appropriate analysis algorithm based on the type
      let result: AnalysisResult;

      switch (config.type) {
        case 'trend':
          result = await this.analyzeTrend(config as TrendAnalysisConfig, dataset, options);
          break;
        case 'correlation':
          result = await this.analyzeCorrelation(
            config as CorrelationAnalysisConfig,
            dataset,
            options
          );
          break;
        case 'distribution':
          result = await this.analyzeDistribution(
            config as DistributionAnalysisConfig,
            dataset,
            options
          );
          break;
        case 'clustering':
          result = await this.analyzeClustering(
            config as ClusteringAnalysisConfig,
            dataset,
            options
          );
          break;
        case 'prediction':
          result = await this.analyzePrediction(
            config as PredictionAnalysisConfig,
            dataset,
            options
          );
          break;
        case 'comparison':
          result = await this.analyzeComparison(
            config as ComparisonAnalysisConfig,
            dataset,
            options
          );
          break;
        case 'resourceMapping':
          result = await this.analyzeResourceMapping(
            config as ResourceMappingAnalysisConfig,
            dataset,
            options
          );
          break;
        case 'sectorAnalysis':
          result = await this.analyzeSector(config as SectorAnalysisConfig, dataset, options);
          break;
        default:
          throw new Error(`Unsupported analysis type: ${config.type}`);
      }

      // Update the result cache
      this.resultCache.set(cacheKey, {
        result,
        expiresAt: Date.now() + this.cacheExpirationMs,
      });

      return result;
    } catch (error) {
      // Return a failed result if an error occurred
      const failedResult: AnalysisResult = {
        id: resultId,
        analysisConfigId: config.id,
        status: 'failed',
        startTime,
        endTime: Date.now(),
        data: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      return failedResult;
    }
  }

  /**
   * Generate a cache key for a specific analysis configuration and dataset
   */
  private generateCacheKey(
    config: AnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions
  ): string {
    // Create a key based on configuration ID, dataset ID, last updated time, and options
    const optionsKey = JSON.stringify(options);
    return `${config.id}:${dataset.id}:${dataset.updatedAt}:${optionsKey}`;
  }

  /**
   * Analyze trend data
   */
  private async analyzeTrend(
    config: TrendAnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Extract parameters
    const { xAxis, yAxis, groupBy, timeRange, aggregation } = config.parameters;

    // Filter data points based on time range
    let dataPoints = dataset.dataPoints;
    if (timeRange) {
      dataPoints = dataPoints.filter(dp => dp.date >= timeRange[0] && dp.date <= timeRange[1]);
    }

    // Group data by the groupBy parameter if specified
    let groupedData: Record<string, DataPoint[]> = {};
    if (groupBy) {
      // Group data by the specified property
      groupedData = this.groupDataByProperty(dataPoints, groupBy);
    } else {
      // Just use one group with all data points
      groupedData = { all: dataPoints };
    }

    // Prepare the result data structure
    const resultData: Record<string, unknown> = {
      xAxis,
      yAxis,
      groupBy,
      timeRange,
      aggregation,
      groups: {},
    };

    // Process each group
    for (const [group, points] of Object.entries(groupedData)) {
      // Sort by the x-axis property (usually date)
      const sortedPoints = this.sortDataPoints(points, xAxis);

      // Extract x and y values
      const values = sortedPoints
        .map(point => {
          // Extract the x and y values using property paths
          const x = this.getPropertyByPath(point, xAxis);
          const y = this.getPropertyByPath(point, yAxis);

          // Only include points with valid x and y values
          if (x !== undefined && y !== undefined && typeof y === 'number') {
            return { x, y };
          }

          return null;
        })
        .filter(Boolean) as Array<{ x: unknown; y: number }>;

      // Apply aggregation if specified
      let aggregatedValues = values;
      if (aggregation) {
        aggregatedValues = this.aggregateValues(values, aggregation);
      }

      // Calculate trend line
      const trendLine = this.calculateTrendLine(aggregatedValues);

      // Add group data to result
      (resultData.groups as Record<string, unknown>)[group] = {
        values: aggregatedValues,
        trendLine,
      };
    }

    // Generate insights
    const insights = this.generateTrendInsights(resultData);

    // Create the result
    const result: AnalysisResult = {
      id: uuidv4(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime,
      endTime: Date.now(),
      data: resultData,
      summary: this.generateTrendSummary(resultData),
      insights,
    };

    return result;
  }

  /**
   * Analyze correlation between variables
   */
  private async analyzeCorrelation(
    config: CorrelationAnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Extract parameters
    const { variables, method = 'pearson', threshold = 0.5 } = config.parameters;

    // Prepare the result data structure
    const resultData: Record<string, unknown> = {
      variables,
      method,
      threshold,
      correlations: [],
    };

    // Calculate correlation for each pair of variables
    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const var1 = variables[i];
        const var2 = variables[j];

        // Extract values for both variables
        const values = dataset.dataPoints
          .map(point => {
            const val1 = this.getPropertyByPath(point, var1);
            const val2 = this.getPropertyByPath(point, var2);

            if (
              val1 !== undefined &&
              val2 !== undefined &&
              typeof val1 === 'number' &&
              typeof val2 === 'number'
            ) {
              return { var1: val1, var2: val2 };
            }

            return null;
          })
          .filter(Boolean) as Array<{ var1: number; var2: number }>;

        // Calculate correlation coefficient based on method
        let coefficient: number;
        switch (method) {
          case 'pearson':
            coefficient = this.calculatePearsonCorrelation(
              values.map(v => v.var1),
              values.map(v => v.var2)
            );
            break;
          case 'spearman':
            coefficient = this.calculateSpearmanCorrelation(
              values.map(v => v.var1),
              values.map(v => v.var2)
            );
            break;
          case 'kendall':
            coefficient = this.calculateKendallCorrelation(
              values.map(v => v.var1),
              values.map(v => v.var2)
            );
            break;
          default:
            coefficient = this.calculatePearsonCorrelation(
              values.map(v => v.var1),
              values.map(v => v.var2)
            );
        }

        // Add to correlations if above threshold
        if (Math.abs(coefficient) >= threshold) {
          (resultData.correlations as Array<Record<string, unknown>>).push({
            variables: [var1, var2],
            coefficient,
            strength: this.getCorrelationStrength(coefficient),
            sampleSize: values.length,
          });
        }
      }
    }

    // Generate insights
    const insights = this.generateCorrelationInsights(resultData);

    // Create the result
    const result: AnalysisResult = {
      id: uuidv4(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime,
      endTime: Date.now(),
      data: resultData,
      summary: this.generateCorrelationSummary(resultData),
      insights,
    };

    return result;
  }

  /**
   * Analyze distribution of a variable
   */
  private async analyzeDistribution(
    config: DistributionAnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Extract parameters
    const { variable, bins = 10, normalize = false } = config.parameters;

    // Extract values for the variable
    const values = dataset.dataPoints
      .map(point => {
        const value = this.getPropertyByPath(point, variable);
        return typeof value === 'number' ? value : null;
      })
      .filter(Boolean) as number[];

    // Calculate distribution
    const distribution = this.calculateDistribution(values, bins, normalize);

    // Calculate statistics
    const statistics = this.calculateStatistics(values);

    // Prepare the result data
    const resultData: Record<string, unknown> = {
      variable,
      bins,
      normalize,
      distribution,
      statistics,
    };

    // Generate insights
    const insights = this.generateDistributionInsights(resultData);

    // Create the result
    const result: AnalysisResult = {
      id: uuidv4(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime,
      endTime: Date.now(),
      data: resultData,
      summary: this.generateDistributionSummary(resultData),
      insights,
    };

    return result;
  }

  /**
   * More analysis methods would be implemented here for other analysis types.
   * For brevity, I'm only including detailed implementations for a few types.
   */

  private async analyzeClustering(
    config: ClusteringAnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions
  ): Promise<AnalysisResult> {
    // Placeholder implementation
    return {
      id: uuidv4(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime: Date.now(),
      endTime: Date.now(),
      data: {
        message: 'Clustering analysis is not fully implemented yet',
        clusters: [],
      },
      summary: 'Clustering analysis requires further implementation',
    };
  }

  private async analyzePrediction(
    config: PredictionAnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions
  ): Promise<AnalysisResult> {
    // Placeholder implementation
    return {
      id: uuidv4(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime: Date.now(),
      endTime: Date.now(),
      data: {
        message: 'Prediction analysis is not fully implemented yet',
        predictions: [],
      },
      summary: 'Prediction analysis requires further implementation',
    };
  }

  private async analyzeComparison(
    config: ComparisonAnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions
  ): Promise<AnalysisResult> {
    // Placeholder implementation
    return {
      id: uuidv4(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime: Date.now(),
      endTime: Date.now(),
      data: {
        message: 'Comparison analysis is not fully implemented yet',
        comparisons: [],
      },
      summary: 'Comparison analysis requires further implementation',
    };
  }

  private async analyzeResourceMapping(
    config: ResourceMappingAnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions
  ): Promise<AnalysisResult> {
    // Placeholder implementation
    return {
      id: uuidv4(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime: Date.now(),
      endTime: Date.now(),
      data: {
        message: 'Resource mapping analysis is not fully implemented yet',
        mapping: [],
      },
      summary: 'Resource mapping analysis requires further implementation',
    };
  }

  private async analyzeSector(
    config: SectorAnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions
  ): Promise<AnalysisResult> {
    // Placeholder implementation
    return {
      id: uuidv4(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime: Date.now(),
      endTime: Date.now(),
      data: {
        message: 'Sector analysis is not fully implemented yet',
        sectors: [],
      },
      summary: 'Sector analysis requires further implementation',
    };
  }

  /**
   * Helper method to sort data points by a property
   */
  private sortDataPoints(dataPoints: DataPoint[], property: string): DataPoint[] {
    return [...dataPoints].sort((a, b) => {
      const aValue = this.getPropertyByPath(a, property);
      const bValue = this.getPropertyByPath(b, property);

      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }

      return String(aValue).localeCompare(String(bValue));
    });
  }

  /**
   * Helper method to group data points by a property
   */
  private groupDataByProperty(
    dataPoints: DataPoint[],
    property: string
  ): Record<string, DataPoint[]> {
    const groups: Record<string, DataPoint[]> = {};

    for (const point of dataPoints) {
      const value = this.getPropertyByPath(point, property);
      if (value === undefined) continue;

      const groupKey = String(value);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(point);
    }

    return groups;
  }

  /**
   * Helper method to get a property value using a dot-notation path
   */
  private getPropertyByPath(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let value: unknown = obj;

    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }

      value = (value as Record<string, unknown>)[part];
    }

    return value;
  }

  /**
   * Helper method to aggregate values
   */
  private aggregateValues(
    values: Array<{ x: unknown; y: number }>,
    aggregation: 'sum' | 'average' | 'min' | 'max' | 'count'
  ): Array<{ x: unknown; y: number }> {
    // Group by x value
    const groups = new Map<unknown, number[]>();

    for (const { x, y } of values) {
      if (!groups.has(x)) {
        groups.set(x, []);
      }

      groups.get(x)!.push(y);
    }

    // Aggregate each group
    const result: Array<{ x: unknown; y: number }> = [];

    for (const [x, yValues] of groups.entries()) {
      let aggregatedValue: number;

      switch (aggregation) {
        case 'sum':
          aggregatedValue = yValues.reduce((sum, value) => sum + value, 0);
          break;
        case 'average':
          aggregatedValue = yValues.reduce((sum, value) => sum + value, 0) / yValues.length;
          break;
        case 'min':
          aggregatedValue = Math.min(...yValues);
          break;
        case 'max':
          aggregatedValue = Math.max(...yValues);
          break;
        case 'count':
          aggregatedValue = yValues.length;
          break;
        default:
          aggregatedValue = yValues.reduce((sum, value) => sum + value, 0);
      }

      result.push({ x, y: aggregatedValue });
    }

    // Sort by x value
    return result.sort((a, b) => {
      if (typeof a.x === 'number' && typeof b.x === 'number') {
        return a.x - b.x;
      }

      return String(a.x).localeCompare(String(b.x));
    });
  }

  /**
   * Calculate Pearson correlation coefficient between two sets of values
   */
  private calculatePearsonCorrelation(xValues: number[], yValues: number[]): number {
    if (xValues.length !== yValues.length || xValues.length === 0) {
      return 0;
    }

    // Calculate means
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / xValues.length;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;

    // Calculate terms for correlation
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;

    for (let i = 0; i < xValues.length; i++) {
      const xDiff = xValues[i] - xMean;
      const yDiff = yValues[i] - yMean;

      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }

    if (xDenominator === 0 || yDenominator === 0) {
      return 0;
    }

    return numerator / Math.sqrt(xDenominator * yDenominator);
  }

  /**
   * Calculate Spearman correlation coefficient (placeholder implementation)
   */
  private calculateSpearmanCorrelation(xValues: number[], yValues: number[]): number {
    // Simplified implementation - in a real system this would be more complex
    return this.calculatePearsonCorrelation(this.rankValues(xValues), this.rankValues(yValues));
  }

  /**
   * Calculate Kendall correlation coefficient (placeholder implementation)
   */
  private calculateKendallCorrelation(xValues: number[], yValues: number[]): number {
    // Simplified placeholder - in a real system this would be properly implemented
    return (
      this.calculatePearsonCorrelation(this.rankValues(xValues), this.rankValues(yValues)) * 0.9
    ); // Adjusting factor for demonstration
  }

  /**
   * Convert values to ranks for rank-based correlation methods
   */
  private rankValues(values: number[]): number[] {
    // Create indexed values
    const indexedValues = values.map((value, index) => ({ value, index }));

    // Sort by value
    indexedValues.sort((a, b) => a.value - b.value);

    // Assign ranks (with ties handled by averaging)
    const ranks = new Array(values.length).fill(0);

    let i = 0;
    while (i < indexedValues.length) {
      const value = indexedValues[i].value;

      // Find all values equal to the current value
      let j = i + 1;
      while (j < indexedValues.length && indexedValues[j].value === value) {
        j++;
      }

      // Assign average rank to all tied values
      const rank = (i + j - 1) / 2 + 1;
      for (let k = i; k < j; k++) {
        ranks[indexedValues[k].index] = rank;
      }

      i = j;
    }

    return ranks;
  }

  /**
   * Calculate linear trend line
   */
  private calculateTrendLine(values: Array<{ x: unknown; y: number }>): {
    slope: number;
    intercept: number;
  } {
    if (values.length < 2) {
      return { slope: 0, intercept: 0 };
    }

    // Convert x values to numbers (assume date values or indices if not numbers)
    const xyValues = values.map((value, index) => ({
      x: typeof value.x === 'number' ? value.x : index,
      y: value.y,
    }));

    // Calculate means
    const xMean = xyValues.reduce((sum, { x }) => sum + (x as number), 0) / xyValues.length;
    const yMean = xyValues.reduce((sum, { y }) => sum + y, 0) / xyValues.length;

    // Calculate slope and intercept using least squares method
    let numerator = 0;
    let denominator = 0;

    for (const { x, y } of xyValues) {
      const xDiff = (x as number) - xMean;
      numerator += xDiff * (y - yMean);
      denominator += xDiff * xDiff;
    }

    if (denominator === 0) {
      return { slope: 0, intercept: yMean };
    }

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    return { slope, intercept };
  }

  /**
   * Calculate distribution
   */
  private calculateDistribution(
    values: number[],
    bins: number,
    normalize: boolean
  ): Array<{
    binStart: number;
    binEnd: number;
    count: number;
    normalizedCount?: number;
  }> {
    if (values.length === 0) {
      return [];
    }

    // Calculate range
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // Handle special case where all values are the same
    if (range === 0) {
      return [
        {
          binStart: min,
          binEnd: max,
          count: values.length,
          normalizedCount: normalize ? 1 : undefined,
        },
      ];
    }

    // Calculate bin width
    const binWidth = range / bins;

    // Initialize bins
    const distribution = Array.from({ length: bins }, (_, i) => {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;

      return {
        binStart,
        binEnd,
        count: 0,
        normalizedCount: undefined,
      };
    });

    // Count values in each bin
    for (const value of values) {
      const binIndex = Math.min(
        Math.floor((value - min) / binWidth),
        bins - 1 // Handle edge case where value === max
      );

      distribution[binIndex].count++;
    }

    // Normalize counts if requested
    if (normalize) {
      const maxCount = Math.max(...distribution.map(bin => bin.count));
      for (const bin of distribution) {
        bin.normalizedCount = bin.count / (maxCount || 1);
      }
    }

    return distribution;
  }

  /**
   * Calculate statistics for a set of values
   */
  private calculateStatistics(values: number[]): Record<string, number> {
    if (values.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        standardDeviation: 0,
        variance: 0,
      };
    }

    // Sort values for median and quartiles
    const sortedValues = [...values].sort((a, b) => a - b);

    // Calculate basic statistics
    const count = values.length;
    const min = sortedValues[0];
    const max = sortedValues[count - 1];
    const sum = values.reduce((sum, value) => sum + value, 0);
    const mean = sum / count;

    // Calculate median
    const midIndex = Math.floor(count / 2);
    const median =
      count % 2 === 0
        ? (sortedValues[midIndex - 1] + sortedValues[midIndex]) / 2
        : sortedValues[midIndex];

    // Calculate variance and standard deviation
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / count;
    const standardDeviation = Math.sqrt(variance);

    // Calculate quartiles
    const q1Index = Math.floor(count / 4);
    const q3Index = Math.floor((3 * count) / 4);
    const q1 = sortedValues[q1Index];
    const q3 = sortedValues[q3Index];
    const interquartileRange = q3 - q1;

    return {
      count,
      min,
      max,
      mean,
      median,
      standardDeviation,
      variance,
      q1,
      q3,
      interquartileRange,
      range: max - min,
    };
  }

  /**
   * Generate insights for trend analysis
   */
  private generateTrendInsights(data: Record<string, unknown>): string[] {
    const insights: string[] = [];
    const groups = data.groups as Record<
      string,
      { values: any[]; trendLine: { slope: number; intercept: number } }
    >;

    // Add insights for each group
    for (const [group, groupData] of Object.entries(groups)) {
      const { values, trendLine } = groupData;

      if (values.length === 0) continue;

      // Add insight about trend direction
      if (Math.abs(trendLine.slope) < 0.001) {
        insights.push(`The ${group} group shows a stable trend with minimal change.`);
      } else if (trendLine.slope > 0) {
        insights.push(
          `The ${group} group shows an increasing trend with a slope of ${trendLine.slope.toFixed(3)}.`
        );
      } else {
        insights.push(
          `The ${group} group shows a decreasing trend with a slope of ${trendLine.slope.toFixed(3)}.`
        );
      }

      // Add insight about data points
      insights.push(`Analysis of ${group} is based on ${values.length} data points.`);
    }

    return insights;
  }

  /**
   * Generate a summary for trend analysis
   */
  private generateTrendSummary(data: Record<string, unknown>): string {
    const groups = data.groups as Record<
      string,
      { values: any[]; trendLine: { slope: number; intercept: number } }
    >;
    const groupCount = Object.keys(groups).length;

    if (groupCount === 0) {
      return 'No valid data found for trend analysis.';
    }

    if (groupCount === 1) {
      const [group, groupData] = Object.entries(groups)[0];
      const { trendLine } = groupData;

      if (Math.abs(trendLine.slope) < 0.001) {
        return `Analysis shows a stable trend for ${group} with minimal change over time.`;
      } else if (trendLine.slope > 0) {
        return `Analysis shows an increasing trend for ${group} over time.`;
      } else {
        return `Analysis shows a decreasing trend for ${group} over time.`;
      }
    }

    return `Analysis of ${groupCount} groups shows varying trends over time.`;
  }

  /**
   * Generate insights for correlation analysis
   */
  private generateCorrelationInsights(data: Record<string, unknown>): string[] {
    const insights: string[] = [];
    const correlations = data.correlations as Array<{
      variables: string[];
      coefficient: number;
      strength: string;
      sampleSize: number;
    }>;

    if (correlations.length === 0) {
      insights.push('No significant correlations were found between the analyzed variables.');
      return insights;
    }

    // Sort correlations by absolute coefficient value
    correlations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));

    // Add insight for strongest correlation
    const strongest = correlations[0];
    insights.push(
      `The strongest correlation is between "${strongest.variables[0]}" and "${strongest.variables[1]}" with a ${strongest.strength} coefficient of ${strongest.coefficient.toFixed(3)}.`
    );

    // Add insights for positive and negative correlations
    const positiveCorrelations = correlations.filter(c => c.coefficient > 0);
    const negativeCorrelations = correlations.filter(c => c.coefficient < 0);

    if (positiveCorrelations.length > 0) {
      insights.push(
        `Found ${positiveCorrelations.length} positive correlations among the variables.`
      );
    }

    if (negativeCorrelations.length > 0) {
      insights.push(
        `Found ${negativeCorrelations.length} negative correlations among the variables.`
      );
    }

    return insights;
  }

  /**
   * Generate a summary for correlation analysis
   */
  private generateCorrelationSummary(data: Record<string, unknown>): string {
    const correlations = data.correlations as Array<{
      variables: string[];
      coefficient: number;
      strength: string;
      sampleSize: number;
    }>;

    if (correlations.length === 0) {
      return 'No significant correlations were found between the analyzed variables.';
    }

    return `Found ${correlations.length} significant correlations among the analyzed variables.`;
  }

  /**
   * Generate insights for distribution analysis
   */
  private generateDistributionInsights(data: Record<string, unknown>): string[] {
    const insights: string[] = [];
    const statistics = data.statistics as Record<string, number>;

    if (!statistics) {
      return ['No valid statistics found for distribution analysis.'];
    }

    // Add insight about central tendency
    insights.push(
      `The mean value is ${statistics.mean.toFixed(2)} and the median is ${statistics.median.toFixed(2)}.`
    );

    // Add insight about dispersion
    insights.push(
      `The data has a standard deviation of ${statistics.standardDeviation.toFixed(2)} and a range of ${statistics.range.toFixed(2)}.`
    );

    // Add insight about distribution shape
    const skewness = (statistics.mean - statistics.median) / statistics.standardDeviation;
    if (Math.abs(skewness) < 0.1) {
      insights.push('The distribution appears to be approximately symmetric.');
    } else if (skewness > 0) {
      insights.push('The distribution shows a positive skew (tail extends to the right).');
    } else {
      insights.push('The distribution shows a negative skew (tail extends to the left).');
    }

    return insights;
  }

  /**
   * Generate a summary for distribution analysis
   */
  private generateDistributionSummary(data: Record<string, unknown>): string {
    const statistics = data.statistics as Record<string, number>;

    if (!statistics) {
      return 'No valid statistics found for distribution analysis.';
    }

    return `Distribution analysis of ${data.variable} with mean=${statistics.mean.toFixed(2)} and SD=${statistics.standardDeviation.toFixed(2)}.`;
  }

  /**
   * Get correlation strength description based on coefficient
   */
  private getCorrelationStrength(coefficient: number): string {
    const absoluteCoefficient = Math.abs(coefficient);

    if (absoluteCoefficient < 0.3) {
      return 'weak';
    } else if (absoluteCoefficient < 0.7) {
      return 'moderate';
    } else {
      return 'strong';
    }
  }
}

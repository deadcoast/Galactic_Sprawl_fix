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
import { ResourceType } from '../types/resources/ResourceTypes';
import { isResourceType } from '../utils/typeGuards/resourceTypeGuards';
import { ErrorSeverity, ErrorType, errorLoggingService } from './ErrorLoggingService'; // Added import

/**
 * Interface for algorithm options
 */
interface AlgorithmOptions {
  timeoutMs?: number;
  maxSamples?: number;
  normalize?: boolean;
  includeDetails?: boolean;
  confidenceThreshold?: number;
  useWorker?: boolean; // Option to use WebWorker for heavy calculations
  sampleData?: boolean; // Option to sample large datasets for faster processing
  sampleSize?: number; // Number of samples to use when sampleData is true
}

// Type definition for property extraction and value memoization
type PropertyExtractor = (point: DataPoint) => unknown;

/**
 * Interface for distribution bins
 */
interface DistributionBin {
  binStart: number;
  binEnd: number;
  count: number;
  normalizedCount?: number;
}

/**
 * Interface for resource cells in mapping
 */
interface ResourceCell {
  x: number;
  y: number;
  resources: { type: ResourceType; amount: number }[];
  totalValue: number;
  dominantResource?: ResourceType;
  dominantPercentage?: number;
  totalResourceCount: number;
}

/**
 * Service for implementing analysis algorithms
 */
export class AnalysisAlgorithmService {
  // Cache for storing computed results to improve performance
  private resultCache: Map<string, { result: AnalysisResult; expiresAt: number }> = new Map<
    string,
    { result: AnalysisResult; expiresAt: number }
  >();

  // Cache expiration time (10 minutes)
  private cacheExpirationMs = 10 * 60 * 1000;

  // Property access cache for faster property extraction
  private propertyExtractorCache: Map<string, PropertyExtractor> = new Map<string, PropertyExtractor>();

  // Default sample size for large datasets
  private defaultSampleSize = 1000;

  // Memoization for common statistical operations
  private memoizedMeans: Map<string, number> = new Map<string, number>();

  // WebWorker pool for parallel processing
  private workerPool: Worker[] = [];
  private isWorkerSupported = typeof Worker !== 'undefined';
  private maxWorkers = navigator.hardwareConcurrency ?? 4;

  constructor() {
    // Initialize WebWorker pool if supported
    if (this.isWorkerSupported) {
      this.initWorkerPool();
    }
  }

  /**
   * Initialize WebWorker pool for parallel processing
   */
  private initWorkerPool(): void {
    // Create workers up to the maximum number allowed
    for (let i = 0; i < this.maxWorkers; i++) {
      try {
        // Create a worker for calculation-intensive tasks
        const worker = new Worker(new URL('../workers/AnalysisWorker.ts', import.meta.url));
        this.workerPool.push(worker);
      } catch (error) {
        // Replace console.error with errorLoggingService.logError
        errorLoggingService.logError(
          error instanceof Error ? error : new Error('Failed to create analysis worker'),
          ErrorType.INITIALIZATION,
          ErrorSeverity.HIGH,
          { componentName: 'AnalysisAlgorithmService', action: 'initWorkerPool' }
        );
      }
    }
  }

  /**
   * Run analysis on a dataset
   */
  public async runAnalysis(
    config: AnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions = {}
  ): Promise<AnalysisResult> {
    // Set default options
    const effectiveOptions = {
      ...options,
      sampleData: options?.sampleData ?? dataset.dataPoints.length > this.defaultSampleSize,
      sampleSize: options?.sampleSize ?? this.defaultSampleSize,
      useWorker: options?.useWorker ?? (this.isWorkerSupported && dataset.dataPoints.length > 5000),
    };

    // Generate a cache key based on config, dataset, and options
    const cacheKey = this.generateCacheKey(config, dataset, effectiveOptions);

    // Check if a cached result exists and is still valid
    const cachedResult = this.resultCache.get(cacheKey);
    if (cachedResult && cachedResult.expiresAt > Date.now()) {
      return cachedResult.result;
    }

    // Clear memoization caches for new analysis
    this.clearMemoizationCaches();

    // Sample the dataset if needed
    const dataToProcess = this.getSampledDataset(dataset, effectiveOptions);

    // Start the analysis
    const resultId = uuidv4();
    const startTime = Date.now();

    // Create a pending result
    const _pendingResult: AnalysisResult = {
      id: resultId,
      analysisConfigId: config.id,
      status: 'processing',
      startTime,
      data: {},
    };

    try {
      // Use a worker if available and needed
      let result: AnalysisResult;

      if (effectiveOptions.useWorker && this.workerPool.length > 0) {
        result = await this.runAnalysisInWorker(config, dataToProcess, effectiveOptions);
      } else {
        // Run the appropriate analysis algorithm based on the type
        switch (config.type) {
          case 'trend':
            result = await this.analyzeTrend(
              config as TrendAnalysisConfig,
              dataToProcess,
              effectiveOptions
            );
            break;
          case 'correlation':
            result = await this.analyzeCorrelation(
              config as CorrelationAnalysisConfig,
              dataToProcess,
              effectiveOptions
            );
            break;
          case 'distribution':
            result = await this.analyzeDistribution(
              config as DistributionAnalysisConfig,
              dataToProcess,
              effectiveOptions
            );
            break;
          case 'clustering':
            result = await this.analyzeClustering(
              config as ClusteringAnalysisConfig,
              dataToProcess,
              effectiveOptions
            );
            break;
          case 'prediction':
            result = await this.analyzePrediction(
              config as PredictionAnalysisConfig,
              dataToProcess,
              effectiveOptions
            );
            break;
          case 'comparison':
            result = await this.analyzeComparison(
              config as ComparisonAnalysisConfig,
              dataToProcess,
              effectiveOptions
            );
            break;
          case 'resourceMapping':
            result = await this.analyzeResourceMapping(
              config as ResourceMappingAnalysisConfig,
              dataToProcess,
              effectiveOptions
            );
            break;
          case 'sectorAnalysis':
            result = await this.analyzeSector(
              config as SectorAnalysisConfig,
              dataToProcess,
              effectiveOptions
            );
            break;
          default:
            throw new Error(`Unsupported analysis type: ${config.type}`);
        }
      }

      // Add data sampling info to result if sampling was used
      if (
        effectiveOptions.sampleData &&
        dataset.dataPoints.length > effectiveOptions.sampleSize &&
        result?.data
      ) {
        result.data.samplingInfo = {
          originalSize: dataset.dataPoints.length,
          sampleSize: effectiveOptions.sampleSize,
          samplingRatio: effectiveOptions.sampleSize / dataset.dataPoints.length,
        };
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
   * Run analysis in a WebWorker for improved performance
   */
  private runAnalysisInWorker(
    config: AnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions
  ): Promise<AnalysisResult> {
    return new Promise((resolve, reject) => {
      // Find an available worker
      const worker = this.workerPool[0]; // Simple round-robin for now

      // Create a unique message ID for this analysis
      const messageId = uuidv4();

      // Set up message handler
      const handleMessage = (event: MessageEvent) => {
        if (event?.data?.messageId === messageId && event?.data?.result) {
          // Clean up message handler
          worker.removeEventListener('message', handleMessage);

          if (event?.data?.error) {
            reject(new Error(event?.data?.error as string));
          } else {
            resolve(event?.data?.result as AnalysisResult);
          }
        }
      };

      // Set up error handler
      const handleError = (error: ErrorEvent) => {
        worker.removeEventListener('error', handleError);
        reject(new Error(`Worker error: ${error.message}`));
      };

      // Register handlers
      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      // Post message to worker
      worker.postMessage({
        messageId,
        action: 'runAnalysis',
        config,
        dataset,
        options,
      });

      // Set up timeout if specified
      if (options?.timeoutMs) {
        setTimeout(() => {
          worker.removeEventListener('message', handleMessage);
          worker.removeEventListener('error', handleError);
          reject(new Error(`Analysis timed out after ${options?.timeoutMs}ms`));
        }, options?.timeoutMs);
      }
    });
  }

  /**
   * Sample dataset for faster processing
   */
  private getSampledDataset(dataset: Dataset, options: AlgorithmOptions): Dataset {
    if (
      !options?.sampleData ||
      !options?.sampleSize ||
      dataset.dataPoints.length <= options.sampleSize
    ) {
      return dataset;
    }

    // Create a sampled copy of the dataset
    const sampledPoints = this.stratifiedSample(dataset.dataPoints, options.sampleSize);

    return {
      ...dataset,
      dataPoints: sampledPoints,
    };
  }

  /**
   * Create a stratified sample of data points ensuring representation across types
   */
  private stratifiedSample(dataPoints: DataPoint[], sampleSize: number): DataPoint[] {
    // Group data points by type
    const byType: Record<string, DataPoint[]> = {};
    for (const point of dataPoints) {
      if (!byType[point.type]) {
        byType[point.type] = [];
      }
      byType[point.type].push(point);
    }

    const result: DataPoint[] = [];
    const types = Object.keys(byType);

    // Calculate samples per type
    let remaining = sampleSize;
    const typeAllocations: Record<string, number> = {};

    for (const type of types) {
      // Allocate proportionally to original size
      const proportion = byType[type].length / dataPoints.length;
      const allocation = Math.floor(sampleSize * proportion);
      typeAllocations[type] = allocation;
      remaining -= allocation;
    }

    // Distribute unknown remaining sample slots
    let typeIndex = 0;
    while (remaining > 0) {
      typeAllocations[types[typeIndex % types.length]]++;
      remaining--;
      typeIndex++;
    }

    // Sample from each type
    for (const type of types) {
      const typeSampleSize = typeAllocations[type];
      const typeDataPoints = byType[type];

      // Randomly select data points
      const selected = new Set<number>();
      while (selected.size < typeSampleSize) {
        const index = Math.floor(Math.random() * typeDataPoints.length);
        selected.add(index);
      }

      // Add selected points to result
      for (const index of selected) {
        result?.push(typeDataPoints[index]);
      }
    }

    return result;
  }

  /**
   * Clear memoization caches before starting a new analysis
   */
  private clearMemoizationCaches(): void {
    this.memoizedMeans.clear();
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
    let { dataPoints } = dataset;
    if (timeRange) {
      dataPoints = dataPoints.filter(dp => dp.date >= timeRange[0] && dp.date <= timeRange[1]);
    }

    // Get or create optimized property extractors
    const xExtractor = this.getPropertyExtractor(xAxis);
    const yExtractor = this.getPropertyExtractor(yAxis);
    const groupExtractor = groupBy ? this.getPropertyExtractor(groupBy) : null;

    // Group data by the groupBy parameter if specified
    let groupedData: Record<string, DataPoint[]> = {};
    if (groupExtractor) {
      // Group data using the optimized extractor
      groupedData = this.groupDataByExtractor(dataPoints, groupExtractor);
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
      const sortedPoints = this.sortDataPointsByExtractor(points, xExtractor);

      // Extract x and y values using optimized extractors
      const values = sortedPoints
        .map(point => {
          // Extract the x and y values using optimized extractors
          const x = xExtractor(point);
          const y = yExtractor(point);

          // Only include points with valid x and y values
          if (x !== undefined && y !== undefined && typeof y === 'number') {
            return { x, y };
          }

          return null;
        })
        .filter(Boolean) as { x: unknown; y: number }[];

      // Apply aggregation if specified
      let aggregatedValues = values;
      if (aggregation) {
        aggregatedValues = this.aggregateValues(values, aggregation);
      }

      // Calculate trend line with optimized algorithm
      const trendLine = this.calculateTrendLineOptimized(aggregatedValues);

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
   * Optimize property access with compiled accessor functions
   */
  private getPropertyExtractor(path: string): PropertyExtractor {
    // Check if we already have a cached extractor
    if (this.propertyExtractorCache.has(path)) {
      return this.propertyExtractorCache.get(path)!;
    }

    // Parse the property path
    const parts = path.split('.');

    // Create an optimized extractor function
    const extractor = (obj: DataPoint): unknown => {
      if (parts.length === 1) {
        // Direct property access (most common case)
        const property = parts[0];
        if (property in obj) {
          return obj[property as keyof DataPoint];
        } else if (property in obj.properties) {
          return obj.properties[property];
        } else if (obj.metadata && property in obj.metadata) {
          return obj.metadata[property];
        }
        return undefined;
      } else {
        // Handle nested properties
        let current: Record<string, unknown> = obj as Record<string, unknown>;
        for (let i = 0; i < parts.length; i++) {
          if (current === null || current === undefined) {
            return undefined;
          }

          // Check in standard properties
          if (current[parts[i]] !== undefined) {
            current = current[parts[i]] as Record<string, unknown>;
            continue;
          }

          // Check in DataPoint's properties or metadata
          if (i === 0) {
            if (parts[i] === 'properties' && obj.properties) {
              current = obj.properties as Record<string, unknown>;
            } else if (parts[i] === 'metadata' && obj.metadata) {
              current = obj.metadata as Record<string, unknown>;
            } else {
              return undefined;
            }
          } else {
            return undefined;
          }
        }
        return current;
      }
    };

    // Cache the extractor for future use
    this.propertyExtractorCache.set(path, extractor);
    return extractor;
  }

  /**
   * Sort data points using the optimized property extractor
   */
  private sortDataPointsByExtractor(
    dataPoints: DataPoint[],
    extractor: PropertyExtractor
  ): DataPoint[] {
    return [...dataPoints].sort((a, b) => {
      const aValue = extractor(a);
      const bValue = extractor(b);

      if (aValue === undefined) {
        return 1;
      }
      if (bValue === undefined) {
        return -1;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }

      return String(aValue).localeCompare(String(bValue));
    });
  }

  /**
   * Group data points using the optimized property extractor
   */
  private groupDataByExtractor(
    dataPoints: DataPoint[],
    extractor: PropertyExtractor
  ): Record<string, DataPoint[]> {
    const result: Record<string, DataPoint[]> = {};

    for (const point of dataPoints) {
      const value = extractor(point);

      if (value !== undefined) {
        const key = String(value);
        if (!result[key]) {
          result[key] = [];
        }
        result[key].push(point);
      }
    }

    return result;
  }

  /**
   * Optimized trend line calculation using single-pass algorithm
   */
  private calculateTrendLineOptimized(values: { x: unknown; y: number }[]): {
    slope: number;
    intercept: number;
  } {
    if (values.length < 2) {
      return { slope: 0, intercept: 0 };
    }

    // Convert x values to numbers for calculation
    const points = values
      .map(v => {
        const xNum =
          typeof v.x === 'number'
            ? v.x
            : v.x instanceof Date
              ? v.x.getTime()
              : parseFloat(String(v.x));

        return isNaN(xNum) ? null : { x: xNum, y: v.y };
      })
      .filter(Boolean) as { x: number; y: number }[];

    if (points.length < 2) {
      return { slope: 0, intercept: 0 };
    }

    // Use optimized single-pass algorithm for calculating linear regression
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    const n = points.length;

    for (const point of points) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumX2 += point.x * point.x;
    }

    const denominator = n * sumX2 - sumX * sumX;

    if (Math.abs(denominator) < 1e-10) {
      return { slope: 0, intercept: sumY / n };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Analyze correlation between variables with optimized algorithms
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

    // Create optimized property extractors for all variables
    const extractors = variables.map(variable => this.getPropertyExtractor(variable));

    // Pre-extract all values to optimize computation
    const extractedValues: number[][] = [];

    for (const extractor of extractors) {
      const values = dataset.dataPoints
        .map(point => {
          const value = extractor(point);
          return typeof value === 'number' ? value : undefined;
        })
        .filter((v): v is number => v !== undefined);

      extractedValues.push(values);
    }

    // Calculate correlation for each pair of variables
    const promises: Promise<{
      var1: string;
      var2: string;
      coefficient: number;
      strength: string;
      sampleSize: number;
    } | null>[] = [];

    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const var1 = variables[i];
        const var2 = variables[j];

        const values1 = extractedValues[i];
        const values2 = extractedValues[j];

        // Find common indices where both variables have values
        const commonValues: { var1: number; var2: number }[] = [];

        // Optimize by using Set for faster lookups
        const values1Set = new Set(values1);

        for (let k = 0; k < Math.min(values1.length, values2.length); k++) {
          if (values1Set.has(values1[k]) && values2[k] !== undefined) {
            commonValues.push({ var1: values1[k], var2: values2[k] });
          }
        }

        // Skip if not enough data points
        if (commonValues.length < 3) {
          continue;
        }

        // Calculate correlation coefficient based on method
        const promise = (async () => {
          let coefficient: number;

          const var1Values = commonValues.map(v => v.var1);
          const var2Values = commonValues.map(v => v.var2);

          switch (method) {
            case 'pearson':
              coefficient = this.calculatePearsonCorrelationOptimized(var1Values, var2Values);
              break;
            case 'spearman':
              coefficient = this.calculateSpearmanCorrelationOptimized(var1Values, var2Values);
              break;
            case 'kendall':
              coefficient = this.calculateKendallCorrelationOptimized(var1Values, var2Values);
              break;
            default:
              coefficient = this.calculatePearsonCorrelationOptimized(var1Values, var2Values);
          }

          // Add to correlations if above threshold
          if (Math.abs(coefficient) >= threshold) {
            return {
              var1,
              var2,
              coefficient,
              strength: this.getCorrelationStrength(coefficient),
              sampleSize: commonValues.length,
            };
          }

          return null;
        })();

        promises.push(promise);
      }
    }

    // Wait for all correlation calculations
    const correlations = (await Promise.all(promises)).filter(Boolean);
    resultData.correlations = correlations;

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
   * Optimized Pearson correlation calculation
   */
  private calculatePearsonCorrelationOptimized(xValues: number[], yValues: number[]): number {
    if (xValues.length !== yValues.length || xValues.length === 0) {
      return 0;
    }

    // Use memoization for means
    const xArrayKey = xValues.join(',');
    const yArrayKey = yValues.join(',');

    // Calculate or retrieve means
    let xMean = this.memoizedMeans.get(xArrayKey);
    if (xMean === undefined) {
      xMean = xValues.reduce((sum, x) => sum + x, 0) / xValues.length;
      this.memoizedMeans.set(xArrayKey, xMean);
    }

    let yMean = this.memoizedMeans.get(yArrayKey);
    if (yMean === undefined) {
      yMean = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;
      this.memoizedMeans.set(yArrayKey, yMean);
    }

    // Calculate correlation with optimized algorithm
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;

    // Optimize loop by avoiding repeated subtraction operations
    const xDiffs = new Float64Array(xValues.length);
    const yDiffs = new Float64Array(yValues.length);

    for (let i = 0; i < xValues.length; i++) {
      xDiffs[i] = xValues[i] - xMean;
      yDiffs[i] = yValues[i] - yMean;
    }

    for (let i = 0; i < xValues.length; i++) {
      numerator += xDiffs[i] * yDiffs[i];
      xDenominator += xDiffs[i] * xDiffs[i];
      yDenominator += yDiffs[i] * yDiffs[i];
    }

    if (xDenominator === 0 || yDenominator === 0) {
      return 0;
    }

    return numerator / Math.sqrt(xDenominator * yDenominator);
  }

  /**
   * Optimized Spearman correlation calculation
   */
  private calculateSpearmanCorrelationOptimized(xValues: number[], yValues: number[]): number {
    // Optimized implementation using faster ranking and cached calculations
    const xRanks = this.rankValuesOptimized(xValues);
    const yRanks = this.rankValuesOptimized(yValues);

    return this.calculatePearsonCorrelationOptimized(xRanks, yRanks);
  }

  /**
   * Optimized Kendall correlation calculation
   */
  private calculateKendallCorrelationOptimized(xValues: number[], yValues: number[]): number {
    if (xValues.length !== yValues.length || xValues.length < 2) {
      return 0;
    }

    const n = xValues.length;
    let concordant = 0;
    let discordant = 0;

    // Optimize by using a more efficient algorithm for Kendall's tau
    // This implementation has O(n log n) complexity rather than O(n²)
    const indices = Array.from({ length: n }, (_, i) => i);
    indices.sort((i, j) => xValues[i] - xValues[j]);

    // Count inversions (equivalent to counting discordant pairs)
    const yValuesRanked = indices.map(i => yValues[i]);
    discordant = this.countInversions(yValuesRanked);

    // Calculate total possible pairs
    const totalPairs = (n * (n - 1)) / 2;

    // Concordant pairs = total pairs - discordant pairs
    concordant = totalPairs - discordant;

    // Calculate Kendall's tau coefficient
    return (concordant - discordant) / totalPairs;
  }

  /**
   * Count inversions in an array (used for Kendall's tau calculation)
   * Using an efficient divide-and-conquer algorithm (merge sort based)
   */
  private countInversions(arr: number[]): number {
    if (arr.length <= 1) {
      return 0;
    }

    const mid = Math.floor(arr.length / 2);
    const left = arr.slice(0, mid);
    const right = arr.slice(mid);

    // Recursively count inversions in left and right halves
    let count = this.countInversions(left) + this.countInversions(right);

    // Count inversions during merge
    let i = 0,
      j = 0,
      k = 0;
    const merged = new Array(arr.length);

    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        merged[k++] = left[i++];
      } else {
        // Inversion found - all remaining elements in left are inversions
        merged[k++] = right[j++];
        count += left.length - i;
      }
    }

    // Copy remaining elements
    while (i < left.length) {
      merged[k++] = left[i++];
    }
    while (j < right.length) {
      merged[k++] = right[j++];
    }

    // Copy merged array back to original
    for (let i = 0; i < merged.length; i++) {
      arr[i] = merged[i];
    }

    return count;
  }

  /**
   * Optimized rank calculation for correlation methods
   */
  private rankValuesOptimized(values: number[]): number[] {
    const n = values.length;
    if (n <= 1) {
      return values.slice();
    }

    // Create indexed values
    const indexedValues = values.map((value, index) => ({ value, index }));

    // Sort by value using a more efficient sort for numeric data
    indexedValues.sort((a, b) => a.value - b.value);

    // Optimize rank assignment with a single pass and linked structure
    const ranks = new Float64Array(n);

    let i = 0;
    while (i < n) {
      const { value } = indexedValues[i];

      // Find all values equal to the current value
      let j = i + 1;
      while (j < n && indexedValues[j].value === value) {
        j++;
      }

      // Calculate average rank for tied values
      const rank = (i + j - 1) / 2 + 1;

      // Assign ranks in a single pass
      for (let k = i; k < j; k++) {
        ranks[indexedValues[k].index] = rank;
      }

      i = j;
    }

    return Array.from(ranks);
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
   * Analyze clustering patterns in the dataset using k-means algorithm
   */
  private async analyzeClustering(
    config: ClusteringAnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Extract parameters from the config
    const { variables, clusters: clusterCount = 3, method = 'kmeans' } = config.parameters;

    // Map to the expected variable names
    const features = variables;
    const k = clusterCount;
    const algorithm = method;
    const maxIterations = 100;
    const distanceMetric = 'euclidean';
    const normalize = true;

    // Validate input parameters
    if (features.length < 1) {
      return {
        id: uuidv4(),
        analysisConfigId: config.id,
        status: 'failed',
        startTime,
        endTime: Date.now(),
        data: {},
        error: 'At least one feature must be specified for clustering analysis',
      };
    }

    if (dataset.dataPoints.length < k) {
      return {
        id: uuidv4(),
        analysisConfigId: config.id,
        status: 'failed',
        startTime,
        endTime: Date.now(),
        data: {},
        error: `Not enough data points (${dataset.dataPoints.length}) for ${k} clusters`,
      };
    }

    // Create extractors for each feature
    const extractors = features.map(feature => this.getPropertyExtractor(feature));

    // Extract feature vectors from data points
    const featureVectors: number[][] = [];
    const validIndices: number[] = [];

    dataset.dataPoints.forEach((point, index) => {
      const vector: number[] = [];
      let valid = true;

      // Extract each feature value
      for (const extractor of extractors) {
        const value = extractor(point);

        if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
          vector.push(value);
        } else {
          valid = false;
          break;
        }
      }

      if (valid && vector.length === features.length) {
        featureVectors.push(vector);
        validIndices.push(index);
      }
    });

    // Not enough valid points for clustering
    if (featureVectors.length < k) {
      return {
        id: uuidv4(),
        analysisConfigId: config.id,
        status: 'failed',
        startTime,
        endTime: Date.now(),
        data: {},
        error: `Not enough valid data points (${featureVectors.length}) for ${k} clusters`,
      };
    }

    // Normalize feature vectors if specified
    const normalizedVectors = options?.normalize
      ? this.normalizeFeatureVectors(featureVectors)
      : featureVectors;

    // Run k-means clustering algorithm
    const clusterResult = this.runKMeansClustering(
      normalizedVectors,
      k,
      maxIterations,
      distanceMetric
    );

    // Map cluster assignments back to original data points
    const clusteredPoints = validIndices.map((originalIndex, vectorIndex) => {
      const clusterIndex = clusterResult.clusters[vectorIndex];
      const point = dataset.dataPoints[originalIndex];
      const featureValues = features.map(feature => {
        const value = this.getPropertyByPath(point, feature);
        return typeof value === 'number' ? value : null;
      });

      return {
        id: point.id,
        name: point.name,
        type: point.type,
        cluster: clusterIndex,
        features: featureValues,
        distanceToCentroid: this.calculateDistance(
          normalizedVectors[vectorIndex],
          clusterResult.centroids[clusterIndex],
          distanceMetric
        ),
      };
    });

    // Group points by cluster
    const clusterGroups: Record<string, unknown[]> = {};
    clusteredPoints.forEach(point => {
      const clusterKey = String(point.cluster);
      if (!clusterGroups[clusterKey]) {
        clusterGroups[clusterKey] = [];
      }
      clusterGroups[clusterKey].push(point);
    });

    // Calculate statistics for each cluster
    const clusterStats = Object.entries(clusterGroups).map(([clusterKey, points]) => {
      const clusterIndex = parseInt(clusterKey, 10);
      const centroid = clusterResult.centroids[clusterIndex];

      // Calculate statistics for each feature within this cluster
      const featureStats = features.map((feature: string, featureIndex: number) => {
        const typedPoints = points as { features: number[]; id: string }[];
        const values = typedPoints
          .map(p => p.features[featureIndex])
          .filter((v: unknown): v is number => v !== null);

        return {
          feature,
          mean:
            values.length > 0
              ? values.reduce((sum: number, v: number) => sum + v, 0) / values.length
              : 0,
          min: values.length > 0 ? Math.min(...values) : 0,
          max: values.length > 0 ? Math.max(...values) : 0,
          count: values.length,
        };
      });

      return {
        cluster: clusterIndex,
        size: points.length,
        percentage: (points.length / clusteredPoints.length) * 100,
        centroid,
        featureStats,
        pointIds: (points as { id: string }[]).map(p => p.id),
      };
    });

    // Prepare result data
    const resultData: Record<string, unknown> = {
      algorithm,
      features,
      k,
      distanceMetric,
      inertia: clusterResult.inertia,
      clusters: clusterStats,
      normalized: options?.normalize,
    };

    // Generate insights and summary
    const insights = this.generateClusteringInsights(resultData);
    const summary = this.generateClusteringSummary(resultData);

    // Create the result
    const result: AnalysisResult = {
      id: uuidv4(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime,
      endTime: Date.now(),
      data: resultData,
      summary,
      insights,
    };

    return result;
  }

  /**
   * Normalize feature vectors using z-score normalization
   */
  private normalizeFeatureVectors(vectors: number[][]): number[][] {
    if (vectors.length === 0) {
      return [];
    }

    const dimensions = vectors[0].length;
    const means = new Array(dimensions).fill(0);
    const stdDevs = new Array(dimensions).fill(0);

    // Calculate means
    for (const vector of vectors) {
      for (let d = 0; d < dimensions; d++) {
        means[d] += vector[d];
      }
    }

    for (let d = 0; d < dimensions; d++) {
      means[d] /= vectors.length;
    }

    // Calculate standard deviations
    for (const vector of vectors) {
      for (let d = 0; d < dimensions; d++) {
        stdDevs[d] += Math.pow(vector[d] - means[d], 2);
      }
    }

    for (let d = 0; d < dimensions; d++) {
      stdDevs[d] = Math.sqrt(stdDevs[d] / vectors.length);
    }

    // Apply z-score normalization
    return vectors.map(vector =>
      vector.map((value, d) => (stdDevs[d] > 0 ? (value - means[d]) / stdDevs[d] : 0))
    );
  }

  /**
   * Run k-means clustering algorithm on feature vectors
   */
  private runKMeansClustering(
    vectors: number[][],
    k: number,
    maxIterations: number,
    distanceMetric: string
  ): {
    clusters: number[];
    centroids: number[][];
    inertia: number;
  } {
    const n = vectors.length;
    const dimensions = vectors[0].length;

    // Initialize centroids using k-means++ method
    const centroids = this.initializeKMeansPlusPlusCentroids(vectors, k, distanceMetric);

    // Initialize cluster assignments
    const clusters = new Array(n).fill(0);
    let prevClusters = new Array(n).fill(-1);
    let iteration = 0;

    // Repeat until convergence or max iterations reached
    while (!this.arraysEqual(clusters, prevClusters) && iteration < maxIterations) {
      // Store previous cluster assignments
      prevClusters = [...clusters];

      // Assign each point to the nearest centroid
      for (let i = 0; i < n; i++) {
        const vector = vectors[i];
        let minDistance = Infinity;
        let nearestCluster = 0;

        for (let j = 0; j < k; j++) {
          const distance = this.calculateDistance(vector, centroids[j], distanceMetric);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = j;
          }
        }

        clusters[i] = nearestCluster;
      }

      // Update centroids based on new cluster assignments
      const newCentroids: number[][] = Array(k)
        .fill(0)
        .map(() => Array(dimensions).fill(0));
      const counts = Array(k).fill(0);

      for (let i = 0; i < n; i++) {
        const cluster = clusters[i];
        counts[cluster]++;

        for (let d = 0; d < dimensions; d++) {
          newCentroids[cluster][d] += vectors[i][d];
        }
      }

      // Calculate new centroid as average of points in cluster
      for (let j = 0; j < k; j++) {
        // Handle empty clusters by reinitializing with a random point
        if (counts[j] === 0) {
          const randomIndex = Math.floor(Math.random() * n);
          newCentroids[j] = [...vectors[randomIndex]];
        } else {
          for (let d = 0; d < dimensions; d++) {
            newCentroids[j][d] /= counts[j];
          }
        }
      }

      centroids.splice(0, centroids.length, ...newCentroids);
      iteration++;
    }

    // Calculate inertia (sum of squared distances to nearest centroid)
    const inertia = vectors.reduce((sum, vector, i) => {
      const centroid = centroids[clusters[i]];
      const distance = this.calculateDistance(vector, centroid, distanceMetric);
      return sum + distance * distance;
    }, 0);

    return { clusters, centroids, inertia };
  }

  /**
   * Initialize k-means centroids using k-means++ algorithm
   * This gives better initial centroids than random selection
   */
  private initializeKMeansPlusPlusCentroids(
    vectors: number[][],
    k: number,
    distanceMetric: string
  ): number[][] {
    const n = vectors.length;
    const centroids: number[][] = [];

    // Choose first centroid randomly
    const firstIndex = Math.floor(Math.random() * n);
    centroids.push([...vectors[firstIndex]]);

    // Choose remaining centroids using weighted probabilities
    for (let i = 1; i < k; i++) {
      // Calculate minimum distance from each point to unknown existing centroid
      const distances = vectors.map(vector => {
        const minDistance = centroids.reduce((min, centroid) => {
          const distance = this.calculateDistance(vector, centroid, distanceMetric);
          return Math.min(min, distance);
        }, Infinity);
        return minDistance * minDistance; // Square the distance for weighted probability
      });

      // Calculate sum of squared distances
      const distanceSum = distances.reduce((sum, distance) => sum + distance, 0);

      // Choose next centroid with probability proportional to squared distance
      let random = Math.random() * distanceSum;
      let index = 0;

      while (index < n && random > 0) {
        random -= distances[index];
        index++;
      }

      // Adjust index since we incremented one extra time
      index = Math.max(0, index - 1);

      centroids.push([...vectors[index]]);
    }

    return centroids;
  }

  /**
   * Calculate distance between two vectors
   */
  private calculateDistance(a: number[], b: number[], metric = 'euclidean'): number {
    switch (metric) {
      case 'euclidean':
        return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));

      case 'manhattan':
        return a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0);

      case 'cosine': {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

        if (magnitudeA === 0 || magnitudeB === 0) {
          return 1;
        } // Maximum distance
        return 1 - dotProduct / (magnitudeA * magnitudeB);
      }

      default:
        return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
    }
  }

  /**
   * Check if two arrays are equal
   */
  private arraysEqual(a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate insights about clustering results
   */
  private generateClusteringInsights(data: Record<string, unknown>): string[] {
    const insights: string[] = [];
    // Extract relevant data
    const numClusters = data.numClusters ? (data.numClusters as number) : 0;
    const inertia = data.inertia ? (data.inertia as number) : undefined;
    const clusters = data.clusters
      ? (data.clusters as {
          id: number;
          size: number;
          featureStats: {
            feature: string;
            mean: number;
            min: number;
            max: number;
          }[];
        }[])
      : [];

    // Generate general insights
    if (numClusters > 0) {
      // Check for imbalanced clusters
      const clusterSizes = clusters.map(c => (c as { size: number }).size);
      const maxSize = Math.max(...clusterSizes);
      const minSize = Math.min(...clusterSizes);
      const sizeRatio = maxSize / minSize;

      if (sizeRatio > 5) {
        insights.push(
          `The clusters are highly imbalanced. The largest cluster is ${sizeRatio.toFixed(1)}x larger than the smallest.`
        );
      } else if (sizeRatio > 2) {
        insights.push(
          `The clusters show some size variation. The largest cluster is ${sizeRatio.toFixed(1)}x larger than the smallest.`
        );
      } else {
        insights.push(`The clusters are relatively balanced in size.`);
      }

      // Add algorithm-specific insights
      if (data.algorithm === 'kmeans') {
        insights.push(
          `K-means clustering identified ${numClusters} clusters based on the specified features.`
        );

        // Check inertia
        if (inertia !== undefined) {
          insights.push(
            `The clustering has an inertia (sum of squared distances) of ${inertia.toFixed(2)}.`
          );
        }
      }

      // Add feature-specific insights
      clusters.forEach(
        (
          cluster: {
            id: number;
            size: number;
            featureStats: {
              feature: string;
              mean: number;
              min: number;
              max: number;
            }[];
          },
          _i // Prefix unused parameter
        ) => {
          // Find distinctive features for this cluster
          const distinctiveFeatures = cluster.featureStats
            .filter(stat => stat.mean > 0.5 || stat.mean < -0.5)
            .sort((a, b) => Math.abs(b.mean) - Math.abs(a.mean));

          if (distinctiveFeatures.length > 0) {
            const topFeature = distinctiveFeatures[0];
            const featureType = topFeature.mean > 0 ? 'high' : 'low';

            insights.push(
              `Cluster ${cluster.id} is characterized by ${featureType} values of ${topFeature.feature}.`
            );
          }
        }
      );
    }

    return insights;
  }

  /**
   * Generate summary of clustering results
   */
  private generateClusteringSummary(data: Record<string, unknown>): string {
    const algorithm = data?.algorithm as string;
    const k = data?.k as number;
    const features = data?.features as string[];

    let summary = `Clustering analysis using ${algorithm} algorithm identified ${k} clusters`;

    if (features && features.length > 0) {
      summary += ` based on the following features: ${features.join(', ')}.`;
    } else {
      summary += '.';
    }

    return summary;
  }

  /**
   * Helper method to sort data points by a property
   */
  private sortDataPoints(dataPoints: DataPoint[], property: string): DataPoint[] {
    return [...dataPoints].sort((a, b) => {
      const aValue = this.getPropertyByPath(a, property);
      const bValue = this.getPropertyByPath(b, property);

      if (aValue === undefined) {
        return 1;
      }
      if (bValue === undefined) {
        return -1;
      }

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
      if (value === undefined) {
        continue;
      }

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
    values: { x: unknown; y: number }[],
    aggregation: 'sum' | 'average' | 'min' | 'max' | 'count'
  ): { x: unknown; y: number }[] {
    // Group by x value
    const groups = new Map<unknown, number[]>();

    for (const { x, y } of values) {
      if (!groups.has(x)) {
        groups.set(x, []);
      }

      groups.get(x)!.push(y);
    }

    // Aggregate each group
    const result: { x: unknown; y: number }[] = [];

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

      result?.push({ x, y: aggregatedValue });
    }

    // Sort by x value
    return result?.sort((a, b) => {
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
      const { value } = indexedValues[i];

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
  private calculateTrendLine(values: { x: unknown; y: number }[]): {
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
    const xMean = xyValues.reduce((sum, { x }) => sum + (x), 0) / xyValues.length;
    const yMean = xyValues.reduce((sum, { y }) => sum + y, 0) / xyValues.length;

    // Calculate slope and intercept using least squares method
    let numerator = 0;
    let denominator = 0;

    for (const { x, y } of xyValues) {
      const xDiff = (x) - xMean;
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
  ): {
    binStart: number;
    binEnd: number;
    count: number;
    normalizedCount?: number;
  }[] {
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
    const distribution: DistributionBin[] = Array.from({ length: bins }, (_, i) => {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;

      return {
        binStart,
        binEnd,
        count: 0,
        normalizedCount: undefined, // Set to undefined initially
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
        // Now this assignment is safe because normalizedCount is optional
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
    const groups = data?.groups as Record<
      string,
      { values: unknown[]; trendLine: { slope: number; intercept: number } }
    >;

    // Add insights for each group
    for (const [group, groupData] of Object.entries(groups)) {
      const { values, trendLine } = groupData;

      if (values.length === 0) {
        continue;
      }

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
    const groups = data?.groups as Record<
      string,
      { values: unknown[]; trendLine: { slope: number; intercept: number } }
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
    const correlations = data?.correlations as {
      variables: string[];
      coefficient: number;
      strength: string;
      sampleSize: number;
    }[];

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
    const correlations = data?.correlations as {
      variables: string[];
      coefficient: number;
      strength: string;
      sampleSize: number;
    }[];

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
    const statistics = data?.statistics as Record<string, number>;

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
    const statistics = data?.statistics as Record<string, number>;

    if (!statistics) {
      return 'No valid statistics found for distribution analysis.';
    }

    return `Distribution analysis of ${data?.variable} with mean=${statistics.mean.toFixed(2)} and SD=${statistics.standardDeviation.toFixed(2)}.`;
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

  /**
   * Analyze data to generate predictions using various models
   */
  private async analyzePrediction(
    config: PredictionAnalysisConfig,
    dataset: Dataset,
    _options: AlgorithmOptions // Prefix unused parameter
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Extract parameters from config
    const { target, features = [], method = 'linear', testSize = 0.2 } = config.parameters;

    // Map to the expected variable names
    const targetVariable = target;
    const model = method;
    const testSplit = testSize;
    const epochs = 100; // Default value for neural network
    const predictionHorizon = 1; // Default prediction horizon

    // Validate input parameters
    if (!targetVariable) {
      return {
        id: uuidv4(),
        analysisConfigId: config.id,
        status: 'failed',
        startTime,
        endTime: Date.now(),
        data: {},
        error: 'Target variable must be specified for prediction analysis',
      };
    }

    if (dataset.dataPoints.length < 10) {
      return {
        id: uuidv4(),
        analysisConfigId: config.id,
        status: 'failed',
        startTime,
        endTime: Date.now(),
        data: {},
        error: 'Insufficient data points for prediction analysis (minimum 10 required)',
      };
    }

    // Create extractors for each feature and the target variable
    const featureExtractors = features.map(feature => this.getPropertyExtractor(feature));
    const targetExtractor = this.getPropertyExtractor(targetVariable);

    // Extract feature vectors and target values
    const dataPoints: {
      features: number[];
      target: number;
      date?: number;
      original: DataPoint;
    }[] = [];

    dataset.dataPoints.forEach(point => {
      // Extract feature values
      const featureValues: number[] = [];
      let allFeaturesValid = true;

      // Extract each feature value
      for (const extractor of featureExtractors) {
        const value = extractor(point);

        if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
          featureValues.push(value);
        } else {
          allFeaturesValid = false;
          break;
        }
      }

      // Extract target value
      const targetValue = targetExtractor(point);

      if (
        allFeaturesValid &&
        typeof targetValue === 'number' &&
        !isNaN(targetValue) &&
        isFinite(targetValue)
      ) {
        dataPoints.push({
          features: featureValues,
          target: targetValue,
          date: point.date, // For time series forecasting
          original: point,
        });
      }
    });

    // Sort data by date if available (for time series)
    if (dataPoints.length > 0 && dataPoints[0].date !== undefined) {
      dataPoints.sort((a, b) => (a.date ?? 0) - (b.date ?? 0));
    }

    // Split data into training and testing sets
    const splitIndex = Math.floor(dataPoints.length * (1 - testSplit));
    const trainingData = dataPoints.slice(0, splitIndex);
    const testingData = dataPoints.slice(splitIndex);

    // Train the appropriate prediction model
    let modelResult: {
      predictions: {
        features: number[];
        actual: number;
        predicted: number;
        error?: number;
      }[];
      forecast: {
        features: number[];
        predicted: number;
        confidence?: [number, number]; // Lower and upper bounds
      }[];
      metrics: {
        mse: number;
        rmse: number;
        mae: number;
        r2?: number;
      };
      modelDetails: Record<string, unknown>;
    };

    switch (model) {
      case 'linear':
        modelResult = this.runLinearRegression(
          trainingData,
          testingData,
          features,
          predictionHorizon
        );
        break;
      case 'neuralNetwork':
        modelResult = await this.runNeuralNetwork(
          trainingData,
          testingData,
          features,
          predictionHorizon,
          epochs
        );
        break;
      default:
        modelResult = this.runLinearRegression(
          trainingData,
          testingData,
          features,
          predictionHorizon
        );
    }

    // Generate insights and prepare result data
    const resultData: Record<string, unknown> = {
      model,
      targetVariable,
      features,
      predictionHorizon,
      dataPointCount: dataPoints.length,
      trainTestSplit: {
        training: trainingData.length,
        testing: testingData.length,
        ratio: 1 - testSplit,
      },
      metrics: modelResult.metrics,
      predictions: modelResult.predictions,
      forecast: modelResult.forecast,
      modelDetails: modelResult.modelDetails,
    };

    // Generate insights about the prediction model
    const insights = this.generatePredictionInsights(resultData);

    // Create the result
    const result: AnalysisResult = {
      id: uuidv4(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime,
      endTime: Date.now(),
      data: resultData,
      summary: this.generatePredictionSummary(resultData),
      insights,
    };

    return result;
  }

  /**
   * Run linear regression model for prediction
   */
  private runLinearRegression(
    trainingData: {
      features: number[];
      target: number;
      date?: number;
      original: DataPoint;
    }[],
    testingData: {
      features: number[];
      target: number;
      date?: number;
      original: DataPoint;
    }[],
    featureNames: string[],
    predictionHorizon: number
  ): {
    predictions: {
      features: number[];
      actual: number;
      predicted: number;
      error?: number;
    }[];
    forecast: {
      features: number[];
      predicted: number;
      confidence?: [number, number];
    }[];
    metrics: {
      mse: number;
      rmse: number;
      mae: number;
      r2: number;
    };
    modelDetails: Record<string, unknown>;
  } {
    // Extract feature and target matrices
    const X_train = trainingData.map(point => point.features);
    const y_train = trainingData.map(point => point.target);

    const X_test = testingData.map(point => point.features);
    const y_test = testingData.map(point => point.target);

    // Add bias term (intercept) to feature matrices
    const X_train_with_bias = X_train.map(features => [1, ...features]);
    const X_test_with_bias = X_test.map(features => [1, ...features]);

    // Calculate coefficients using normal equation
    // (X^T * X)^(-1) * X^T * y
    const coefficients = this.calculateLinearRegressionCoefficients(X_train_with_bias, y_train);

    // Make predictions on test set
    const testPredictions = X_test_with_bias.map(features =>
      features.reduce((sum, value, index) => sum + value * coefficients[index], 0)
    );

    // Calculate metrics
    const errors = testPredictions.map((predicted, i) => predicted - y_test[i]);
    const squaredErrors = errors.map(error => error * error);
    const absErrors = errors.map(error => Math.abs(error));

    const mse = squaredErrors.reduce((sum, sq) => sum + sq, 0) / squaredErrors.length;
    const rmse = Math.sqrt(mse);
    const mae = absErrors.reduce((sum, abs) => sum + abs, 0) / absErrors.length;

    // Calculate R^2 (coefficient of determination)
    const mean_y = y_test.reduce((sum, y) => sum + y, 0) / y_test.length;
    const total_variance = y_test.reduce((sum, y) => sum + Math.pow(y - mean_y, 2), 0);
    const r2 = 1 - squaredErrors.reduce((sum, sq) => sum + sq, 0) / total_variance;

    // Create prediction results
    const predictions = testingData.map((point, i) => ({
      features: point.features,
      actual: point.target,
      predicted: testPredictions[i],
      error: errors[i],
    }));

    // Generate forecast for future periods
    const forecast: {
      features: number[];
      predicted: number;
      confidence?: [number, number];
    }[] = [];

    // For time series forecasting
    if (trainingData[0].date !== undefined && predictionHorizon > 0) {
      // Start with the last point's features
      let lastFeatures = [...testingData[testingData.length - 1].features];

      for (let i = 0; i < predictionHorizon; i++) {
        // Predict the next value
        const nextPrediction = [1, ...lastFeatures].reduce(
          (sum, value, index) => sum + value * coefficients[index],
          0
        );

        // Add confidence interval (2 * RMSE for 95% confidence)
        const confidence: [number, number] = [nextPrediction - 2 * rmse, nextPrediction + 2 * rmse];

        // Add to forecast
        forecast.push({
          features: lastFeatures,
          predicted: nextPrediction,
          confidence,
        });

        // Update feature vector for next iteration (simple autoregressive approach)
        // This assumes the target becomes a feature in the next step
        // More sophisticated approaches would be needed for real applications
        if (lastFeatures.length > 0) {
          lastFeatures = [nextPrediction, ...lastFeatures.slice(0, -1)];
        }
      }
    }

    // Return model result
    return {
      predictions,
      forecast,
      metrics: {
        mse,
        rmse,
        mae,
        r2,
      },
      modelDetails: {
        coefficients,
        intercept: coefficients[0],
        weights: coefficients.slice(1),
        featureImportance: coefficients.slice(1).map((coef, i) => ({
          feature: featureNames[i],
          importance: Math.abs(coef),
        })),
      },
    };
  }

  /**
   * Calculate linear regression coefficients using normal equation
   */
  private calculateLinearRegressionCoefficients(X: number[][], y: number[]): number[] {
    const numSamples = X.length;
    const numFeatures = X[0].length;

    // Calculate X^T (transpose of X)
    const X_T = Array(numFeatures)
      .fill(0)
      .map(() => Array(numSamples).fill(0));
    for (let i = 0; i < numSamples; i++) {
      for (let j = 0; j < numFeatures; j++) {
        X_T[j][i] = X[i][j];
      }
    }

    // Calculate X^T * X
    const X_T_X = Array(numFeatures)
      .fill(0)
      .map(() => Array(numFeatures).fill(0));
    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numFeatures; j++) {
        for (let k = 0; k < numSamples; k++) {
          X_T_X[i][j] += X_T[i][k] * X[k][j];
        }
      }
    }

    // Calculate inverse of X^T * X
    const X_T_X_inv = this.calculateMatrixInverse(X_T_X);

    // Calculate X^T * y
    const X_T_y = Array(numFeatures).fill(0);
    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numSamples; j++) {
        X_T_y[i] += X_T[i][j] * y[j];
      }
    }

    // Calculate coefficients = (X^T * X)^(-1) * X^T * y
    const coefficients = Array(numFeatures).fill(0);
    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numFeatures; j++) {
        coefficients[i] += X_T_X_inv[i][j] * X_T_y[j];
      }
    }

    return coefficients;
  }

  /**
   * Calculate the inverse of a matrix using Gaussian elimination
   * This is a simple implementation for demonstration purposes
   * For production, consider using a library like math.js
   */
  private calculateMatrixInverse(matrix: number[][]): number[][] {
    const n = matrix.length;

    // Create augmented matrix [A|I]
    const augMatrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      augMatrix.push([...matrix[i], ...Array(n).fill(0)]);
      augMatrix[i][n + i] = 1;
    }

    // Apply Gaussian elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(augMatrix[j][i]) > Math.abs(augMatrix[maxRow][i])) {
          maxRow = j;
        }
      }

      // Swap rows
      if (maxRow !== i) {
        [augMatrix[i], augMatrix[maxRow]] = [augMatrix[maxRow], augMatrix[i]];
      }

      // Pivot value
      const pivot = augMatrix[i][i];

      // Skip singular matrix
      if (Math.abs(pivot) < 1e-10) {
        // Return identity matrix (fallback)
        return Array(n)
          .fill(0)
          .map((_, i) =>
            Array(n)
              .fill(0)
              .map((_, j) => (i === j ? 1 : 0))
          );
      }

      // Scale pivot row
      for (let j = i; j < 2 * n; j++) {
        augMatrix[i][j] /= pivot;
      }

      // Eliminate other rows
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const factor = augMatrix[j][i];
          for (let k = i; k < 2 * n; k++) {
            augMatrix[j][k] -= factor * augMatrix[i][k];
          }
        }
      }
    }

    // Extract right part (inverse matrix)
    const inverseMatrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      inverseMatrix.push(augMatrix[i].slice(n));
    }

    return inverseMatrix;
  }

  /**
   * Run neural network model for prediction
   */
  private async runNeuralNetwork(
    trainingData: {
      features: number[];
      target: number;
      date?: number;
      original: DataPoint;
    }[],
    testingData: {
      features: number[];
      target: number;
      date?: number;
      original: DataPoint;
    }[],
    featureNames: string[],
    predictionHorizon: number,
    epochs: number
  ): Promise<{
    predictions: {
      features: number[];
      actual: number;
      predicted: number;
      error?: number;
    }[];
    forecast: {
      features: number[];
      predicted: number;
      confidence?: [number, number];
    }[];
    metrics: {
      mse: number;
      rmse: number;
      mae: number;
    };
    modelDetails: Record<string, unknown>;
  }> {
    // Extract feature and target matrices
    const X_train = trainingData.map(point => point.features);
    const y_train = trainingData.map(point => point.target);

    const X_test = testingData.map(point => point.features);
    const y_test = testingData.map(point => point.target);

    // Normalize features
    const { normalizedTrainFeatures, normalizedTestFeatures, featureMeans, featureStdDevs } =
      this.normalizeFeatures(X_train, X_test);

    // Normalize targets
    const allTargets = [...y_train, ...y_test];
    const targetMean = allTargets.reduce((sum, y) => sum + y, 0) / allTargets.length;
    const targetStdDev = Math.sqrt(
      allTargets.reduce((sum, y) => sum + Math.pow(y - targetMean, 2), 0) / allTargets.length
    );

    const normalizedTrainTargets = y_train.map(y => (y - targetMean) / targetStdDev);
    const normalizedTestTargets = y_test.map(y => (y - targetMean) / targetStdDev);

    // Simple neural network implementation (2-layer NN)
    const numFeatures = normalizedTrainFeatures[0].length;
    const hiddenSize = Math.max(5, Math.min(20, Math.floor(numFeatures * 2)));

    // Initialize weights randomly
    const weights1 = Array(numFeatures)
      .fill(0)
      .map(() =>
        Array(hiddenSize)
          .fill(0)
          .map(() => (Math.random() - 0.5) * 0.1)
      );

    const bias1 = Array(hiddenSize)
      .fill(0)
      .map(() => (Math.random() - 0.5) * 0.1);

    const weights2 = Array(hiddenSize)
      .fill(0)
      .map(() => (Math.random() - 0.5) * 0.1);
    let bias2 = (Math.random() - 0.5) * 0.1; // Change from const to let

    // Training parameters
    const learningRate = 0.01;
    const batchSize = Math.min(32, normalizedTrainFeatures.length);

    // Training loop
    for (let epoch = 0; epoch < epochs; epoch++) {
      // Shuffle training data
      const indices = Array(normalizedTrainFeatures.length)
        .fill(0)
        .map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      // Mini-batch training
      for (
        let batchStart = 0;
        batchStart < normalizedTrainFeatures.length;
        batchStart += batchSize
      ) {
        const batchEnd = Math.min(batchStart + batchSize, normalizedTrainFeatures.length);
        const batchIndices = indices.slice(batchStart, batchEnd);

        // Initialize gradients
        const gradWeights1 = Array(numFeatures)
          .fill(0)
          .map(() => Array(hiddenSize).fill(0));
        const gradBias1 = Array(hiddenSize).fill(0);
        const gradWeights2 = Array(hiddenSize).fill(0);
        let gradBias2 = 0; // Change from const to let

        let batchLoss = 0;

        // Process each sample in the batch
        for (const idx of batchIndices) {
          const x = normalizedTrainFeatures[idx];
          const y = normalizedTrainTargets[idx];

          // Forcombatd pass
          // Hidden layer with ReLU activation
          const hidden = Array(hiddenSize).fill(0);
          for (let i = 0; i < hiddenSize; i++) {
            for (let j = 0; j < numFeatures; j++) {
              hidden[i] += x[j] * weights1[j][i];
            }
            hidden[i] += bias1[i];
            // ReLU activation
            hidden[i] = Math.max(0, hidden[i]);
          }

          // Output layer (linear)
          let output = 0;
          for (let i = 0; i < hiddenSize; i++) {
            output += hidden[i] * weights2[i];
          }
          output += bias2;

          // Loss (MSE)
          const error = output - y;
          batchLoss += error * error;

          // Backcombatd pass
          // Output layer gradient
          const gradOutput = 2 * error;

          // Hidden layer gradient
          for (let i = 0; i < hiddenSize; i++) {
            if (hidden[i] > 0) {
              // ReLU gradient
              gradWeights2[i] += gradOutput * hidden[i];
              for (let j = 0; j < numFeatures; j++) {
                gradWeights1[j][i] += gradOutput * weights2[i] * x[j];
              }
              gradBias1[i] += gradOutput * weights2[i];
            }
          }

          gradBias2 += gradOutput;
        }

        // Update weights
        const batchScale = 1 / batchIndices.length;

        for (let i = 0; i < numFeatures; i++) {
          for (let j = 0; j < hiddenSize; j++) {
            weights1[i][j] -= learningRate * gradWeights1[i][j] * batchScale;
          }
        }

        for (let i = 0; i < hiddenSize; i++) {
          bias1[i] -= learningRate * gradBias1[i] * batchScale;
          weights2[i] -= learningRate * gradWeights2[i] * batchScale;
        }

        bias2 -= learningRate * gradBias2 * batchScale; // This is fine, bias2 is a let
      }
    }

    // (...args: unknown[]) => unknown to make predictions
    const predict = (features: number[]): number => {
      // Normalize features
      const normalizedFeatures = features.map(
        (value, i) => (value - featureMeans[i]) / featureStdDevs[i]
      );

      // Forcombatd pass through the network
      const hidden = Array(hiddenSize).fill(0);
      for (let i = 0; i < hiddenSize; i++) {
        for (let j = 0; j < numFeatures; j++) {
          hidden[i] += normalizedFeatures[j] * weights1[j][i];
        }
        hidden[i] += bias1[i];
        hidden[i] = Math.max(0, hidden[i]); // ReLU
      }

      let output = 0;
      for (let i = 0; i < hiddenSize; i++) {
        output += hidden[i] * weights2[i];
      }
      output += bias2;

      // Denormalize the output
      return output * targetStdDev + targetMean;
    };

    // Make predictions on test data
    const testPredictions = X_test.map(features => predict(features));

    // Calculate metrics
    const errors = testPredictions.map((predicted, i) => predicted - y_test[i]);
    const squaredErrors = errors.map(error => error * error);
    const absErrors = errors.map(error => Math.abs(error));

    const mse = squaredErrors.reduce((sum, sq) => sum + sq, 0) / squaredErrors.length;
    const rmse = Math.sqrt(mse);
    const mae = absErrors.reduce((sum, abs) => sum + abs, 0) / absErrors.length;

    // Create prediction results
    const predictions = testingData.map((point, i) => ({
      features: point.features,
      actual: point.target,
      predicted: testPredictions[i],
      error: errors[i],
    }));

    // Generate forecast for future periods
    const forecast: {
      features: number[];
      predicted: number;
      confidence?: [number, number];
    }[] = [];

    // For time series forecasting
    if (trainingData[0].date !== undefined && predictionHorizon > 0) {
      // Start with the last point's features
      let lastFeatures = [...testingData[testingData.length - 1].features];

      for (let i = 0; i < predictionHorizon; i++) {
        // Predict the next value
        const nextPrediction = predict(lastFeatures);

        // Add confidence interval (2 * RMSE for 95% confidence)
        const confidence: [number, number] = [nextPrediction - 2 * rmse, nextPrediction + 2 * rmse];

        // Add to forecast
        forecast.push({
          features: lastFeatures,
          predicted: nextPrediction,
          confidence,
        });

        // Update feature vector for next iteration (simple autoregressive approach)
        if (lastFeatures.length > 0) {
          lastFeatures = [nextPrediction, ...lastFeatures.slice(0, -1)];
        }
      }
    }

    // Return model result
    return {
      predictions,
      forecast,
      metrics: {
        mse,
        rmse,
        mae,
      },
      modelDetails: {
        architecture: {
          inputSize: numFeatures,
          hiddenSize,
          outputSize: 1,
        },
        normalization: {
          featureMeans,
          featureStdDevs,
          targetMean,
          targetStdDev,
        },
        training: {
          epochs,
          finalMSE: mse,
        },
      },
    };
  }

  /**
   * Normalize features for neural network training
   */
  private normalizeFeatures(
    trainFeatures: number[][],
    testFeatures: number[][]
  ): {
    normalizedTrainFeatures: number[][];
    normalizedTestFeatures: number[][];
    featureMeans: number[];
    featureStdDevs: number[];
  } {
    const numFeatures = trainFeatures[0].length;
    const featureMeans = Array(numFeatures).fill(0);
    const featureStdDevs = Array(numFeatures).fill(0);

    // Calculate means
    for (const features of trainFeatures) {
      for (let i = 0; i < numFeatures; i++) {
        featureMeans[i] += features[i];
      }
    }

    for (let i = 0; i < numFeatures; i++) {
      featureMeans[i] /= trainFeatures.length;
    }

    // Calculate standard deviations
    for (const features of trainFeatures) {
      for (let i = 0; i < numFeatures; i++) {
        featureStdDevs[i] += Math.pow(features[i] - featureMeans[i], 2);
      }
    }

    for (let i = 0; i < numFeatures; i++) {
      featureStdDevs[i] = Math.sqrt(featureStdDevs[i] / trainFeatures.length);
      if (featureStdDevs[i] === 0) {
        featureStdDevs[i] = 1; // Avoid division by zero
      }
    }

    // Normalize train features
    const normalizedTrainFeatures = trainFeatures.map(features =>
      features.map((value, i) => (value - featureMeans[i]) / featureStdDevs[i])
    );

    // Normalize test features
    const normalizedTestFeatures = testFeatures.map(features =>
      features.map((value, i) => (value - featureMeans[i]) / featureStdDevs[i])
    );

    return {
      normalizedTrainFeatures,
      normalizedTestFeatures,
      featureMeans,
      featureStdDevs,
    };
  }

  /**
   * Generate insights about prediction results
   */
  private generatePredictionInsights(data: Record<string, unknown>): string[] {
    const insights: string[] = [];
    const model = data?.model as string;
    const metrics = data?.metrics as { mse: number; rmse: number; mae: number; r2?: number };
    const forecast = data?.forecast as { predicted: number; confidence?: [number, number] }[];

    // Model type and quality insights
    insights.push(
      `Prediction model: ${model === 'linear' ? 'Linear Regression' : 'Neural Network'}.`
    );

    if (metrics.r2 !== undefined) {
      const { r2 } = metrics;
      if (r2 > 0.8) {
        insights.push(
          `The model explains ${(r2 * 100).toFixed(1)}% of the variance in the data, indicating a strong fit.`
        );
      } else if (r2 > 0.5) {
        insights.push(
          `The model explains ${(r2 * 100).toFixed(1)}% of the variance in the data, indicating a moderate fit.`
        );
      } else {
        insights.push(
          `The model explains only ${(r2 * 100).toFixed(1)}% of the variance, suggesting a weak relationship between features and target.`
        );
      }
    }

    insights.push(
      `Mean Absolute Error (MAE): ${metrics.mae.toFixed(3)}, Root Mean Squared Error (RMSE): ${metrics.rmse.toFixed(3)}.`
    );

    // Feature importance for linear models
    if (model === 'linear' && data?.modelDetails) {
      const modelDetails = data.modelDetails as Record<string, unknown>;
      if ('featureImportance' in modelDetails) {
        const featureImportance = modelDetails.featureImportance as {
          feature: string;
          importance: number;
        }[];

        // Sort features by importance
        const sortedFeatures = [...featureImportance].sort((a, b) => b.importance - a.importance);

        if (sortedFeatures.length > 0) {
          const topFeatures = sortedFeatures.slice(0, Math.min(3, sortedFeatures.length));

          insights.push(
            `Top influential features: ${topFeatures
              .map(f => `${f.feature} (importance: ${f.importance.toFixed(3)})`)
              .join(', ')}.`
          );
        }
      }
    }

    // Forecast insights
    if (forecast && forecast.length > 0) {
      const firstPrediction = forecast[0].predicted;
      const lastPrediction = forecast[forecast.length - 1].predicted;
      const trend =
        lastPrediction > firstPrediction
          ? 'upcombatd'
          : lastPrediction < firstPrediction
            ? 'downcombatd'
            : 'stable';

      insights.push(
        `The ${forecast.length}-step forecast shows a ${trend} trend from ${firstPrediction.toFixed(2)} to ${lastPrediction.toFixed(2)}.`
      );

      if (forecast[0].confidence) {
        const confidenceWidth = forecast[0].confidence[1] - forecast[0].confidence[0];

        insights.push(
          `Forecast confidence interval width: ${confidenceWidth.toFixed(2)} (±${(confidenceWidth / 2).toFixed(2)}).`
        );
      }
    }

    return insights;
  }

  /**
   * Generate summary of prediction results
   */
  private generatePredictionSummary(data: Record<string, unknown>): string {
    const model = data?.model as string;
    const targetVariable = data?.targetVariable as string;
    const metrics = data?.metrics as { mse: number; rmse: number; mae: number; r2?: number };

    let summary = `${model === 'linear' ? 'Linear regression' : 'Neural network'} model `;

    if (metrics.r2 !== undefined) {
      const r2Description =
        metrics.r2 > 0.7 ? 'strongly' : metrics.r2 > 0.4 ? 'moderately' : 'weakly';
      summary += `${r2Description} predicts ${targetVariable} with R² of ${metrics.r2.toFixed(2)} and RMSE of ${metrics.rmse.toFixed(2)}.`;
    } else {
      summary += `predicts ${targetVariable} with RMSE of ${metrics.rmse.toFixed(2)}.`;
    }

    return summary;
  }

  /**
   * Analyze the spatial distribution of resources
   */
  private async analyzeResourceMapping(
    config: ResourceMappingAnalysisConfig,
    dataset: Dataset,
    options: AlgorithmOptions
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Extract parameters
    const { valueMetric = 'amount', regionSize = 10 } = config.parameters as {
      // resourceTypes is extracted separately below
      valueMetric?: 'amount' | 'quality' | 'accessibility' | 'estimatedValue';
      regionSize?: number;
    };
    // Extract resourceTypes separately for clarity
    const resourceTypes: ResourceType[] = config.parameters?.resourceTypes ?? [];

    // Validate dataset content
    if (dataset.dataPoints.length === 0) {
      throw new Error('Dataset contains no data points for resource mapping analysis.');
    }

    // Filter data points by resource type if specified
    let resourcePoints = dataset.dataPoints.filter(
      point => point.properties && (point.properties.resourceType || point.properties.type)
    );

    if (resourceTypes.length > 0) {
      resourcePoints = resourcePoints.filter(point => {
        const typeValue = point.properties.resourceType || point.properties.type;
        // Use the isResourceType guard for safe comparison
        if (isResourceType(typeValue)) {
          // Check if the validated typeValue is included in the requested resourceTypes array
          return resourceTypes.includes(typeValue as ResourceType);
        }
        return false;
      });
    }

    if (resourcePoints.length === 0) {
      throw new Error('No resource data points found in the dataset.');
    }

    // Determine the x and y range from the data
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // Find the bounds of the area
    resourcePoints.forEach(point => {
      const { x, y } = point.coordinates;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    // Add some padding to the bounds
    const padding = regionSize * 0.5;
    minX = Math.floor(minX - padding);
    maxX = Math.ceil(maxX + padding);
    minY = Math.floor(minY - padding);
    maxY = Math.ceil(maxY + padding);

    // Create a grid with cells of regionSize
    const gridCells: Record<
      string,
      {
        x: number;
        y: number;
        resources: {
          type: ResourceType;
          amount: number;
          quality?: number;
          accessibility?: number;
          estimatedValue?: number;
        }[];
        points: DataPoint[];
      }
    > = {};

    // Assign each resource point to a grid cell
    resourcePoints.forEach(point => {
      const cellX = Math.floor(point.coordinates.x / regionSize) * regionSize;
      const cellY = Math.floor(point.coordinates.y / regionSize) * regionSize;
      const cellKey = `${cellX},${cellY}`;

      if (!gridCells[cellKey]) {
        gridCells[cellKey] = {
          x: cellX,
          y: cellY,
          resources: [],
          points: [],
        };
      }

      // Add the point to the cell
      gridCells[cellKey].points.push(point);

      // Extract resource information safely
      const resourceTypeRaw = point.properties.resourceType || point.properties.type;
      let resourceType: ResourceType | undefined;
      if (isResourceType(resourceTypeRaw)) {
        resourceType = resourceTypeRaw as ResourceType;
      } else {
        // Log or handle cases where the resource type is invalid
        errorLoggingService.logError(
          new Error(`Invalid resource type found: ${resourceTypeRaw}`),
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          { pointId: point.id }
        );
        return; // Skip this point if the type is invalid
      }

      const amount = typeof point.properties.amount === 'number' ? point.properties.amount : 1;
      const quality =
        typeof point.properties.quality === 'number' ? point.properties.quality : undefined;
      const accessibility =
        typeof point.properties.accessibility === 'number'
          ? point.properties.accessibility
          : undefined;
      const estimatedValue =
        typeof point.properties.estimatedValue === 'number'
          ? point.properties.estimatedValue
          : undefined;

      // Check if this resource type already exists in the cell
      const existingResource = gridCells[cellKey].resources.find(r => r.type === resourceType);

      if (existingResource) {
        // Update existing resource
        existingResource.amount += amount;

        // Update other properties if they exist (using nullish coalescing for safety)
        existingResource.quality =
          existingResource.quality !== undefined && quality !== undefined
            ? (existingResource.quality + quality) / 2 // Average the quality
            : (existingResource.quality ?? quality);

        existingResource.accessibility =
          existingResource.accessibility !== undefined && accessibility !== undefined
            ? (existingResource.accessibility + accessibility) / 2 // Average the accessibility
            : (existingResource.accessibility ?? accessibility);

        existingResource.estimatedValue =
          existingResource.estimatedValue !== undefined && estimatedValue !== undefined
            ? existingResource.estimatedValue + estimatedValue // Sum the estimated value
            : (existingResource.estimatedValue ?? estimatedValue);
      } else {
        // Add new resource type to the cell
        gridCells[cellKey].resources.push({
          type: resourceType, // Use validated ResourceType
          amount,
          quality,
          accessibility,
          estimatedValue,
        });
      }
    });

    // Calculate aggregate metrics for each cell
    const processedCells = Object.values(gridCells).map(cell => {
      // Calculate total value in the cell based on the selected metric
      let totalValue = 0;

      // Count total resources in the cell
      const totalResourceCount = cell.resources.reduce((sum, resource) => sum + resource.amount, 0);

      // Calculate total value based on selected metric
      cell.resources.forEach(resource => {
        const metricValue =
          resource[valueMetric] !== undefined ? (resource[valueMetric]) : resource.amount;

        totalValue += metricValue;
      });

      // Determine dominant resource type
      let dominantResource: ResourceType | undefined;
      let dominantPercentage = 0;

      if (cell.resources.length > 0) {
        // Sort resources by amount
        const sortedResources = [...cell.resources].sort((a, b) => b.amount - a.amount);
        dominantResource = sortedResources[0].type;
        dominantPercentage = sortedResources[0].amount / totalResourceCount;
      }

      return {
        x: cell.x,
        y: cell.y,
        resources: cell.resources,
        totalValue,
        dominantResource,
        dominantPercentage,
        totalResourceCount,
      };
    });

    // Calculate resource type density using ResourceType as key
    const resourceTypeDensity: Record<ResourceType, number> = {} as Record<ResourceType, number>;
    // Store ResourceType enums
    const allResourceTypes = new Set<ResourceType>();

    processedCells.forEach(cell => {
      cell.resources.forEach(resource => {
        allResourceTypes.add(resource.type);

        if (!resourceTypeDensity[resource.type]) {
          resourceTypeDensity[resource.type] = 0;
        }

        resourceTypeDensity[resource.type] += resource.amount;
      });
    });

    // Normalize densities
    const totalResources = Object.values(resourceTypeDensity).reduce((sum, val) => sum + val, 0);

    // Use Object.keys and iterate safely
    (Object.keys(resourceTypeDensity) as ResourceType[]).forEach(type => {
      resourceTypeDensity[type] /= totalResources || 1; // Avoid division by zero
    });

    // Generate insights
    const insights = this.generateResourceMappingInsights({
      cells: processedCells,
      resourceDensity: resourceTypeDensity,
      xRange: [minX, maxX],
      yRange: [minY, maxY],
      valueMetric,
    });

    // Generate summary
    const summary = this.generateResourceMappingSummary({
      cells: processedCells,
      resourceDensity: resourceTypeDensity,
      xRange: [minX, maxX],
      yRange: [minY, maxY],
      valueMetric,
    });

    // Prepare result
    const result: AnalysisResult = {
      id: crypto.randomUUID(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime,
      endTime: Date.now(),
      data: {
        resourcePoints,
        gridCells: processedCells,
        // Return ResourceType array
        resourceTypes: Array.from(allResourceTypes),
        valueMetric,
        regionSize,
        xRange: [minX, maxX],
        yRange: [minY, maxY],
        density: resourceTypeDensity,
      },
      insights,
      summary,
    };

    return result;
  }

  /**
   * Generate insights from resource mapping analysis
   */
  private generateResourceMappingInsights(data: Record<string, unknown>): string[] {
    const insights: string[] = [];
    // Use ResourceType for keys
    const resourceDensity = data.resourceDensity as Record<ResourceType, number>;
    const valueMetric = data.valueMetric as string;

    // Cast cells to the proper type, now using ResourceType
    const typedCells = (data.cells || []) as {
      x: number;
      y: number;
      resources: { type: ResourceType; amount: number }[];
      totalValue: number;
      dominantResource?: ResourceType;
      dominantPercentage?: number;
      totalResourceCount: number;
    }[];

    // Add insights about most abundant resource types
    const sortedDensities = (Object.entries(resourceDensity) as [ResourceType, number][]).sort(
      ([, a], [, b]) => b - a
    );

    if (sortedDensities.length > 0) {
      const [topType, topDensity] = sortedDensities[0];
      insights.push(
        `${topType} is the most abundant resource in the mapped region, making up ${(topDensity * 100).toFixed(1)}% of all resources.`
      );
    }

    if (sortedDensities.length > 1) {
      const [, , ...restTypes] = sortedDensities;
      const rareTypes = restTypes.filter(([, density]) => density < 0.1);

      if (rareTypes.length > 0) {
        insights.push(
          `Rare resources include: ${rareTypes.map(([type]) => type).join(', ')}, each comprising less than 10% of the total.`
        );
      }
    }

    // Find resource-rich regions
    if (typedCells.length > 0) {
      const sortedCells = [...typedCells].sort((a, b) => b.totalValue - a.totalValue);
      const topCell = sortedCells[0];

      if (topCell?.dominantResource) {
        insights.push(
          `The region with the highest ${valueMetric} concentration is located at coordinates (${topCell.x}, ${topCell.y}), containing primarily ${topCell.dominantResource}.`
        );
      }

      // Find clusters of similar resources
      // Use ResourceType for keys
      const resourceClusters: Record<ResourceType, number> = {} as Record<ResourceType, number>;

      typedCells.forEach(cell => {
        if (cell.dominantResource) {
          if (!resourceClusters[cell.dominantResource]) {
            resourceClusters[cell.dominantResource] = 0;
          }
          resourceClusters[cell.dominantResource]++;
        }
      });

      const sortedClusters = (Object.entries(resourceClusters) as [ResourceType, number][]).sort(
        ([, a], [, b]) => b - a
      );

      if (sortedClusters.length > 0) {
        const [mostClusteredType, clusterCount] = sortedClusters[0];

        if (clusterCount > 1) {
          insights.push(
            `${mostClusteredType} tends to form clusters across the map, with ${clusterCount} regions where it's the dominant resource.`
          );
        }
      }
    }

    // Identify resource diversity
    const avgResourceTypesPerCell =
      typedCells.length > 0
        ? typedCells.reduce((sum, cell) => sum + cell.resources.length, 0) / typedCells.length
        : 0;

    if (avgResourceTypesPerCell > 2.5) {
      insights.push(
        `The mapped region shows high resource diversity with an average of ${avgResourceTypesPerCell.toFixed(1)} resource types per region.`
      );
    } else if (avgResourceTypesPerCell < 1.5) {
      insights.push(
        `The mapped region shows low resource diversity with an average of ${avgResourceTypesPerCell.toFixed(1)} resource types per region.`
      );
    }

    return insights;
  }

  /**
   * Generate summary from resource mapping analysis
   */
  private generateResourceMappingSummary(data: Record<string, unknown>): string {
    // Cast cells and density correctly
    const typedCells = (data.cells || []) as {
      x: number;
      y: number;
      resources: { type: ResourceType; amount: number }[];
      totalValue: number;
      dominantResource?: ResourceType;
      dominantPercentage?: number;
      totalResourceCount: number;
    }[];
    const resourceDensity = data.resourceDensity as Record<ResourceType, number>;
    const xRange = data.xRange as [number, number];
    const yRange = data.yRange as [number, number];
    const valueMetric = data.valueMetric as string;

    const sortedDensities = (Object.entries(resourceDensity) as [ResourceType, number][])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topResourceTypes = sortedDensities
      // Format ResourceType enums directly
      .map(([type, density]) => `${type} (${(density * 100).toFixed(1)}%)`)
      .join(', ');

    const mapSize = `${(xRange[1] - xRange[0]).toFixed(0)}x${(yRange[1] - yRange[0]).toFixed(0)}`;
    const regionCount = typedCells.length;
    const totalResourceAmount = typedCells.reduce((sum, cell) => sum + cell.totalResourceCount, 0);

    return `Resource mapping analysis of a ${mapSize} area identified ${regionCount} resource regions containing a total of ${totalResourceAmount.toFixed(0)} resource units. The predominant resource types are ${topResourceTypes}. This analysis used ${valueMetric} as the primary metric for evaluation.`;
  }

  /**
   * Analyze comparison between datasets or variables
   */
  private async analyzeComparison(
    config: ComparisonAnalysisConfig,
    _dataset: Dataset, // Prefix unused parameter (stub)
    _options: AlgorithmOptions // Prefix unused parameter (stub)
  ): Promise<AnalysisResult> {
    // This is a stub implementation that will be fully implemented later
    const startTime = Date.now();

    // Extract parameters
    const {
      baseVariable,
      comparisonVariables,
      normalizeValues = false,
      timeRange,
      groupBy,
    } = config.parameters;

    // For now, just return a basic result structure
    const result: AnalysisResult = {
      id: crypto.randomUUID(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime,
      endTime: Date.now(),
      data: {
        baseVariable,
        comparisonVariables,
        comparisonData: [],
        summary: 'Comparison analysis stub implementation',
      },
      summary: 'Comparison analysis stub implementation',
      insights: ['This is a stub implementation of the comparison analysis.'],
    };

    return result;
  }

  /**
   * Analyze sectors for various metrics
   */
  private async analyzeSector(
    config: SectorAnalysisConfig,
    _dataset: Dataset, // Prefix unused parameter (stub)
    _options: AlgorithmOptions // Prefix unused parameter (stub)
  ): Promise<AnalysisResult> {
    // This is a stub implementation that will be fully implemented later
    const startTime = Date.now();

    // Extract parameters
    const { metrics, sectorIds, includeNeighbors = false, timeRange } = config.parameters;

    // For now, just return a basic result structure
    const result: AnalysisResult = {
      id: crypto.randomUUID(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime,
      endTime: Date.now(),
      data: {
        metrics,
        sectorIds,
        sectorData: [],
        summary: 'Sector analysis stub implementation',
      },
      summary: 'Sector analysis stub implementation',
      insights: ['This is a stub implementation of the sector analysis.'],
    };

    return result;
  }
}

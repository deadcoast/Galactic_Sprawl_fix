/**
 * Dynamic Budget Adjustment
 *
 * This file provides a system for automatically refining performance budgets
 * based on real-world usage data, ensuring that they remain realistic and
 * relevant as the application evolves.
 */

import { BenchmarkResult } from './PerformanceBenchmarkTools';
import { ALL_PERFORMANCE_BUDGETS, PerformanceBudget } from './PerformanceBudgets';

/**
 * Configuration for performance telemetry
 */
export interface PerformanceTelemetryConfig {
  /**
   * Whether telemetry is enabled
   */
  enabled: boolean;

  /**
   * Sampling rate (0-1, where 1 means 100% of events are sampled)
   */
  samplingRate: number;

  /**
   * Maximum number of samples to collect per category
   */
  maxSamplesPerCategory: number;

  /**
   * Whether to record device information with samples
   */
  recordDeviceInfo: boolean;

  /**
   * Endpoint for uploading telemetry data (if applicable)
   */
  uploadEndpoint?: string;

  /**
   * Whether to automatically adjust budgets based on telemetry
   */
  autoAdjustBudgets: boolean;

  /**
   * Buffer range for budget adjustment (percentage)
   *
   * e.g., 0.2 means budgets will be set 20% higher than observed p95
   */
  budgetBuffer: number;
}

/**
 * Performance sample with metadata
 */
export interface PerformanceSample {
  /**
   * Name of the operation
   */
  name: string;

  /**
   * Timestamp when the sample was collected
   */
  timestamp: Date;

  /**
   * Execution time in milliseconds
   */
  executionTimeMs: number;

  /**
   * Memory usage in MB (if available)
   */
  memoryUsageMB?: number;

  /**
   * Operations per second (if applicable)
   */
  operationsPerSecond?: number;

  /**
   * User agent string (for client samples)
   */
  userAgent?: string;

  /**
   * Device type (desktop, mobile, tablet)
   */
  deviceType?: 'desktop' | 'mobile' | 'tablet';

  /**
   * Screen dimensions (for client samples)
   */
  screenDimensions?: { width: number; height: number };

  /**
   * Application version
   */
  appVersion?: string;

  /**
   * Environment (development, staging, production)
   */
  environment?: 'development' | 'staging' | 'production';

  /**
   * Custom metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Statistical analysis of performance samples
 */
export interface PerformanceStatistics {
  /**
   * Name of the operation
   */
  name: string;

  /**
   * Number of samples
   */
  sampleCount: number;

  /**
   * Mean execution time
   */
  meanExecutionTimeMs: number;

  /**
   * Median execution time
   */
  medianExecutionTimeMs: number;

  /**
   * 95th percentile execution time
   */
  p95ExecutionTimeMs: number;

  /**
   * 99th percentile execution time
   */
  p99ExecutionTimeMs: number;

  /**
   * Standard deviation of execution time
   */
  stdDevExecutionTimeMs: number;

  /**
   * Minimum execution time
   */
  minExecutionTimeMs: number;

  /**
   * Maximum execution time
   */
  maxExecutionTimeMs: number;

  /**
   * Mean memory usage (if available)
   */
  meanMemoryUsageMB?: number;

  /**
   * 95th percentile memory usage (if available)
   */
  p95MemoryUsageMB?: number;

  /**
   * Mean operations per second (if applicable)
   */
  meanOperationsPerSecond?: number;

  /**
   * 5th percentile operations per second (if applicable)
   */
  p5OperationsPerSecond?: number;

  /**
   * Timestamp of the oldest sample
   */
  oldestSample: Date;

  /**
   * Timestamp of the newest sample
   */
  newestSample: Date;

  /**
   * Device type breakdown (percentage of samples from each device type)
   */
  deviceTypeBreakdown?: Record<string, number>;
}

/**
 * Budget adjustment recommendation
 */
export interface BudgetAdjustmentRecommendation {
  /**
   * Original budget
   */
  originalBudget: PerformanceBudget;

  /**
   * Recommended budget
   */
  recommendedBudget: PerformanceBudget;

  /**
   * Reason for the recommendation
   */
  reason: string;

  /**
   * Performance statistics this recommendation is based on
   */
  statistics: PerformanceStatistics;

  /**
   * Confidence level (0-1)
   */
  confidence: number;
}

/**
 * Collection of performance samples for analysis
 */
class PerformanceTelemetryCollector {
  private samples: PerformanceSample[] = [];
  private config: PerformanceTelemetryConfig;

  constructor(config: PerformanceTelemetryConfig) {
    this.config = config;
  }

  /**
   * Record a performance sample
   *
   * @param sample Performance sample to record
   * @returns Whether the sample was recorded
   */
  public recordSample(sample: PerformanceSample): boolean {
    if (!this.config.enabled) return false;

    // Apply sampling rate
    if (Math.random() > this.config.samplingRate) return false;

    // Check if we've reached maximum samples for this category
    const existingSamples = this.samples.filter(s => s.name === sample.name);
    if (existingSamples.length >= this.config.maxSamplesPerCategory) {
      // Replace oldest sample
      const oldestIndex = this.samples.indexOf(
        existingSamples.reduce((oldest, current) =>
          oldest.timestamp < current.timestamp ? oldest : current
        )
      );
      if (oldestIndex >= 0) {
        this.samples[oldestIndex] = sample;
        return true;
      }
      return false;
    }

    // Add the sample
    this.samples.push(sample);

    // Trigger upload if endpoint is configured
    if (this.config.uploadEndpoint && this.samples.length % 10 === 0) {
      this.uploadSamples().catch(err =>
        console.error('Failed to upload performance samples:', err)
      );
    }

    return true;
  }

  /**
   * Record a benchmark result as a sample
   *
   * @param result Benchmark result to record
   * @returns Whether the sample was recorded
   */
  public recordBenchmarkResult(result: BenchmarkResult): boolean {
    return this.recordSample({
      name: result.name,
      timestamp: result.timestamp,
      executionTimeMs: result.executionTimeMs,
      memoryUsageMB: result.memoryUsageMB,
      operationsPerSecond: result.operationsPerSecond,
      environment: 'development', // Benchmark results are typically from development
      metadata: { additionalMetrics: result.additionalMetrics },
    });
  }

  /**
   * Get all samples for a specific operation
   *
   * @param name Name of the operation
   * @returns Array of samples for the operation
   */
  public getSamplesForOperation(name: string): PerformanceSample[] {
    return this.samples.filter(sample => sample.name === name);
  }

  /**
   * Get all samples
   *
   * @returns All collected samples
   */
  public getAllSamples(): PerformanceSample[] {
    return [...this.samples];
  }

  /**
   * Clear all samples
   */
  public clearSamples(): void {
    this.samples = [];
  }

  /**
   * Upload samples to the configured endpoint
   */
  private async uploadSamples(): Promise<void> {
    if (!this.config.uploadEndpoint) return;

    const batchSize = 100;
    const batches = [];

    // Split samples into batches
    for (let i = 0; i < this.samples.length; i += batchSize) {
      batches.push(this.samples.slice(i, i + batchSize));
    }

    // Upload each batch
    for (const batch of batches) {
      try {
        await fetch(this.config.uploadEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch),
        });
      } catch (error) {
        console.error('Failed to upload performance samples:', error);
      }
    }
  }

  /**
   * Calculate statistics for all operations
   *
   * @returns Map of operation names to statistics
   */
  public calculateStatistics(): Map<string, PerformanceStatistics> {
    const operationNames = new Set(this.samples.map(sample => sample.name));
    const result = new Map<string, PerformanceStatistics>();

    for (const name of operationNames) {
      const samples = this.getSamplesForOperation(name);
      if (samples.length === 0) continue;

      result.set(name, this.calculateStatisticsForSamples(name, samples));
    }

    return result;
  }

  /**
   * Calculate statistics for a set of samples
   *
   * @param name Operation name
   * @param samples Samples to analyze
   * @returns Statistical analysis
   */
  private calculateStatisticsForSamples(
    name: string,
    samples: PerformanceSample[]
  ): PerformanceStatistics {
    // Extract execution times and sort them
    const executionTimes = samples.map(sample => sample.executionTimeMs).sort((a, b) => a - b);

    // Calculate percentiles
    const p95Index = Math.floor(executionTimes.length * 0.95);
    const p99Index = Math.floor(executionTimes.length * 0.99);
    const medianIndex = Math.floor(executionTimes.length * 0.5);

    // Calculate mean
    const meanExecutionTimeMs =
      executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;

    // Calculate standard deviation
    const squaredDifferences = executionTimes.map(time => Math.pow(time - meanExecutionTimeMs, 2));
    const variance =
      squaredDifferences.reduce((sum, diff) => sum + diff, 0) / executionTimes.length;
    const stdDevExecutionTimeMs = Math.sqrt(variance);

    // Find timestamps
    const timestamps = samples.map(sample => sample.timestamp);
    const oldestSample = new Date(Math.min(...timestamps.map(t => t.getTime())));
    const newestSample = new Date(Math.max(...timestamps.map(t => t.getTime())));

    // Calculate memory usage statistics if available
    let meanMemoryUsageMB: number | undefined;
    let p95MemoryUsageMB: number | undefined;

    const memorySamples = samples
      .filter(sample => sample.memoryUsageMB !== undefined)
      .map(sample => sample.memoryUsageMB as number)
      .sort((a, b) => a - b);

    if (memorySamples.length > 0) {
      meanMemoryUsageMB = memorySamples.reduce((sum, mem) => sum + mem, 0) / memorySamples.length;
      p95MemoryUsageMB = memorySamples[Math.floor(memorySamples.length * 0.95)];
    }

    // Calculate operations per second statistics if applicable
    let meanOperationsPerSecond: number | undefined;
    let p5OperationsPerSecond: number | undefined;

    const opsSamples = samples
      .filter(sample => sample.operationsPerSecond !== undefined)
      .map(sample => sample.operationsPerSecond as number)
      .sort((a, b) => a - b);

    if (opsSamples.length > 0) {
      meanOperationsPerSecond = opsSamples.reduce((sum, ops) => sum + ops, 0) / opsSamples.length;
      p5OperationsPerSecond = opsSamples[Math.floor(opsSamples.length * 0.05)];
    }

    // Calculate device type breakdown if available
    let deviceTypeBreakdown: Record<string, number> | undefined;

    const deviceTypes = samples
      .filter(sample => sample.deviceType !== undefined)
      .map(sample => sample.deviceType as string);

    if (deviceTypes.length > 0) {
      deviceTypeBreakdown = {};
      for (const deviceType of deviceTypes) {
        deviceTypeBreakdown[deviceType] = (deviceTypeBreakdown[deviceType] || 0) + 1;
      }

      // Convert to percentages
      for (const deviceType in deviceTypeBreakdown) {
        deviceTypeBreakdown[deviceType] =
          (deviceTypeBreakdown[deviceType] / deviceTypes.length) * 100;
      }
    }

    return {
      name,
      sampleCount: samples.length,
      meanExecutionTimeMs,
      medianExecutionTimeMs: executionTimes[medianIndex],
      p95ExecutionTimeMs: executionTimes[p95Index],
      p99ExecutionTimeMs: executionTimes[p99Index],
      stdDevExecutionTimeMs,
      minExecutionTimeMs: executionTimes[0],
      maxExecutionTimeMs: executionTimes[executionTimes.length - 1],
      meanMemoryUsageMB,
      p95MemoryUsageMB,
      meanOperationsPerSecond,
      p5OperationsPerSecond,
      oldestSample,
      newestSample,
      deviceTypeBreakdown,
    };
  }
}

/**
 * Dynamic budget adjuster that analyzes performance data and recommends budget adjustments
 */
export class DynamicBudgetAdjuster {
  private telemetryCollector: PerformanceTelemetryCollector;
  private budgets: PerformanceBudget[];
  private config: PerformanceTelemetryConfig;

  constructor(
    config: PerformanceTelemetryConfig = {
      enabled: true,
      samplingRate: 0.1,
      maxSamplesPerCategory: 1000,
      recordDeviceInfo: true,
      autoAdjustBudgets: false,
      budgetBuffer: 0.2, // 20% buffer
    },
    initialBudgets: PerformanceBudget[] = ALL_PERFORMANCE_BUDGETS
  ) {
    this.config = config;
    this.telemetryCollector = new PerformanceTelemetryCollector(config);
    this.budgets = [...initialBudgets];
  }

  /**
   * Record a performance sample
   *
   * @param sample Performance sample to record
   * @returns Whether the sample was recorded
   */
  public recordSample(sample: PerformanceSample): boolean {
    const recorded = this.telemetryCollector.recordSample(sample);

    // If auto-adjustment is enabled, check if we need to adjust budgets
    if (recorded && this.config.autoAdjustBudgets) {
      this.checkForBudgetAdjustments();
    }

    return recorded;
  }

  /**
   * Record multiple performance samples
   *
   * @param samples Array of performance samples to record
   * @returns Number of samples successfully recorded
   */
  public recordSamples(samples: PerformanceSample[]): number {
    let recordedCount = 0;

    for (const sample of samples) {
      if (this.recordSample(sample)) {
        recordedCount++;
      }
    }

    return recordedCount;
  }

  /**
   * Record benchmark results
   *
   * @param results Benchmark results to record
   * @returns Number of results successfully recorded
   */
  public recordBenchmarkResults(results: BenchmarkResult[]): number {
    let recordedCount = 0;

    for (const result of results) {
      if (this.telemetryCollector.recordBenchmarkResult(result)) {
        recordedCount++;
      }
    }

    // If auto-adjustment is enabled, check if we need to adjust budgets
    if (recordedCount > 0 && this.config.autoAdjustBudgets) {
      this.checkForBudgetAdjustments();
    }

    return recordedCount;
  }

  /**
   * Check if budgets need to be adjusted based on current telemetry
   *
   * @returns Array of budget adjustment recommendations
   */
  public checkForBudgetAdjustments(): BudgetAdjustmentRecommendation[] {
    const statistics = this.telemetryCollector.calculateStatistics();
    const recommendations: BudgetAdjustmentRecommendation[] = [];

    for (const budget of this.budgets) {
      const stats = statistics.get(budget.name);
      if (!stats || stats.sampleCount < 30) continue; // Need sufficient samples

      let shouldAdjust = false;
      const newBudget = { ...budget };
      let reason = '';
      let confidence = 0;

      // Check execution time
      const buffer = 1 + this.config.budgetBuffer;
      const p95WithBuffer = stats.p95ExecutionTimeMs * buffer;

      if (p95WithBuffer > budget.maxExecutionTimeMs * 1.5) {
        // Current budget is unrealistically low (more than 50% lower than p95)
        newBudget.maxExecutionTimeMs = Math.ceil(p95WithBuffer);
        reason = `Budget was too low (${budget.maxExecutionTimeMs}ms vs ${stats.p95ExecutionTimeMs.toFixed(2)}ms p95)`;
        shouldAdjust = true;
        confidence = 0.9;
      } else if (p95WithBuffer < budget.maxExecutionTimeMs * 0.5) {
        // Current budget is unrealistically high (more than double the p95)
        newBudget.maxExecutionTimeMs = Math.ceil(p95WithBuffer);
        reason = `Budget was too high (${budget.maxExecutionTimeMs}ms vs ${stats.p95ExecutionTimeMs.toFixed(2)}ms p95)`;
        shouldAdjust = true;
        confidence = 0.8;
      }

      // Check memory usage
      if (stats.p95MemoryUsageMB !== undefined && budget.maxMemoryUsageMB !== undefined) {
        const p95MemoryWithBuffer = stats.p95MemoryUsageMB * buffer;

        if (p95MemoryWithBuffer > budget.maxMemoryUsageMB * 1.5) {
          newBudget.maxMemoryUsageMB = Math.ceil(p95MemoryWithBuffer);
          reason += reason ? ', ' : '';
          reason += `Memory budget was too low (${budget.maxMemoryUsageMB}MB vs ${stats.p95MemoryUsageMB.toFixed(2)}MB p95)`;
          shouldAdjust = true;
          confidence = Math.max(confidence, 0.85);
        } else if (p95MemoryWithBuffer < budget.maxMemoryUsageMB * 0.5) {
          newBudget.maxMemoryUsageMB = Math.ceil(p95MemoryWithBuffer);
          reason += reason ? ', ' : '';
          reason += `Memory budget was too high (${budget.maxMemoryUsageMB}MB vs ${stats.p95MemoryUsageMB.toFixed(2)}MB p95)`;
          shouldAdjust = true;
          confidence = Math.max(confidence, 0.75);
        }
      }

      // Check operations per second
      if (
        stats.p5OperationsPerSecond !== undefined &&
        budget.minOperationsPerSecond !== undefined
      ) {
        // For operations per second, use p5 (worst 5%) with a buffer to ensure realistic expectations
        const p5OpsWithBuffer = stats.p5OperationsPerSecond / buffer;

        if (p5OpsWithBuffer < budget.minOperationsPerSecond * 0.75) {
          newBudget.minOperationsPerSecond = Math.floor(p5OpsWithBuffer);
          reason += reason ? ', ' : '';
          reason += `Operations budget was too high (${budget.minOperationsPerSecond} ops/s vs ${stats.p5OperationsPerSecond.toFixed(2)} ops/s p5)`;
          shouldAdjust = true;
          confidence = Math.max(confidence, 0.8);
        } else if (p5OpsWithBuffer > budget.minOperationsPerSecond * 1.5) {
          newBudget.minOperationsPerSecond = Math.floor(p5OpsWithBuffer);
          reason += reason ? ', ' : '';
          reason += `Operations budget was too low (${budget.minOperationsPerSecond} ops/s vs ${stats.p5OperationsPerSecond.toFixed(2)} ops/s p5)`;
          shouldAdjust = true;
          confidence = Math.max(confidence, 0.7);
        }
      }

      if (shouldAdjust) {
        recommendations.push({
          originalBudget: budget,
          recommendedBudget: newBudget,
          reason,
          statistics: stats,
          confidence,
        });

        // Apply the adjustment if auto-adjust is enabled
        if (this.config.autoAdjustBudgets) {
          this.adjustBudget(budget.name, newBudget);
        }
      }
    }

    return recommendations;
  }

  /**
   * Adjust a budget based on a recommendation
   *
   * @param operationName Name of the operation to adjust budget for
   * @param newBudget New budget values
   * @returns Whether the adjustment was successful
   */
  public adjustBudget(operationName: string, newBudget: PerformanceBudget): boolean {
    const index = this.budgets.findIndex(b => b.name === operationName);
    if (index === -1) return false;

    this.budgets[index] = { ...this.budgets[index], ...newBudget };

    // Log the adjustment
    console.info(`Adjusted performance budget for "${operationName}":`, {
      before: this.budgets[index],
      after: newBudget,
    });

    return true;
  }

  /**
   * Get the current adjusted budgets
   *
   * @returns Array of current budgets
   */
  public getCurrentBudgets(): PerformanceBudget[] {
    return [...this.budgets];
  }

  /**
   * Get telemetry statistics for all operations
   *
   * @returns Map of operation names to statistics
   */
  public getTelemetryStatistics(): Map<string, PerformanceStatistics> {
    return this.telemetryCollector.calculateStatistics();
  }

  /**
   * Reset the telemetry collector
   */
  public resetTelemetry(): void {
    this.telemetryCollector.clearSamples();
  }

  /**
   * Generate a full report with budget recommendations and statistics
   *
   * @returns Object containing budgets, statistics, and recommendations
   */
  public generateReport(): {
    budgets: PerformanceBudget[];
    statistics: Map<string, PerformanceStatistics>;
    recommendations: BudgetAdjustmentRecommendation[];
  } {
    return {
      budgets: this.getCurrentBudgets(),
      statistics: this.getTelemetryStatistics(),
      recommendations: this.checkForBudgetAdjustments(),
    };
  }
}

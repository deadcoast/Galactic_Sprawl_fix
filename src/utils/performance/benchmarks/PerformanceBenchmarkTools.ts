/**
 * Performance Benchmarking Tools
 *
 * This file provides a comprehensive set of tools for benchmarking and analyzing
 * performance across different systems in the application, with a particular focus on:
 *
 * - ResourceFlowManager optimization
 * - Event System processing
 * - React component rendering
 * - Memory usage analysis
 *
 * Use these tools to establish performance baselines, detect regressions,
 * and validate performance optimizations.
 */

import * as d3 from 'd3';
import { performance } from 'perf_hooks';
import { ResourceFlowManager } from '../../../managers/resource/ResourceFlowManager';
import {
  FlowNode,
  FlowNodeType,
  ResourceState,
  ResourceType,
  createResourceState,
} from '../../../types/resources/ResourceTypes';

/**
 * Performance benchmark result
 */
export interface BenchmarkResult {
  name: string;
  description?: string;
  executionTimeMs: number;
  memoryUsageMB?: number;
  operationsCount?: number;
  operationsPerSecond?: number;
  additionalMetrics?: Record<string, number>;
  timestamp: Date;
}

/**
 * System-specific benchmark results
 */
export interface ResourceFlowBenchmarkResult extends BenchmarkResult {
  nodeCount: number;
  connectionCount: number;
  nodesProcessed: number;
  connectionsProcessed: number;
  transfersGenerated: number;
  optimizationCycles: number;
}

export interface EventSystemBenchmarkResult extends BenchmarkResult {
  eventCount: number;
  eventsPerSecond: number;
  listenersTriggered: number;
  averageEventProcessingTimeMs: number;
  batchCount?: number;
  batchSize?: number;
}

export interface RenderingBenchmarkResult extends BenchmarkResult {
  componentCount: number;
  renderCount: number;
  fps: number;
  frameTimeMs: number;
  maxFrameTimeMs: number;
  minFrameTimeMs: number;
  jankFrames: number; // Frames exceeding 16ms
}

/**
 * Options for benchmark execution
 */
export interface BenchmarkOptions {
  iterations?: number;
  combatmupIterations?: number;
  setupFn?: () => void;
  teardownFn?: () => void;
  memoryMeasurement?: boolean;
  timeout?: number;
}

/**
 * Benchmark test case
 */
export interface BenchmarkTestCase<T extends BenchmarkResult = BenchmarkResult> {
  name: string;
  description?: string;
  run: () => Promise<T> | T;
  options?: BenchmarkOptions;
}

/**
 * Record of memory usage before and after a benchmark
 */
interface MemoryMeasurement {
  before: NodeJS.MemoryUsage;
  after: NodeJS.MemoryUsage;
  diffHeapUsed: number;
  diffHeapTotal: number;
  diffExternal: number;
  diffRss: number;
}

/**
 * Measures the memory usage of a function
 * @param fn Function to measure
 * @returns Memory measurement
 */
export function measureMemoryUsage(fn: () => void): MemoryMeasurement {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Measure memory before
  const before = process.memoryUsage();

  // Run the function
  fn();

  // Measure memory after
  const after = process.memoryUsage();

  // Calculate difference
  return {
    before,
    after,
    diffHeapUsed: (after.heapUsed - before.heapUsed) / (1024 * 1024), // MB
    diffHeapTotal: (after.heapTotal - before.heapTotal) / (1024 * 1024), // MB
    diffExternal: (after.external - before.external) / (1024 * 1024), // MB
    diffRss: (after.rss - before.rss) / (1024 * 1024), // MB
  };
}

/**
 * Runs a benchmark for a synchronous function
 * @param fn Function to benchmark
 * @param options Benchmark options
 * @returns Benchmark results
 */
export function runBenchmark<T>(fn: () => T, options: BenchmarkOptions = {}): BenchmarkResult {
  const {
    iterations = 100,
    combatmupIterations = 10,
    setupFn,
    teardownFn,
    memoryMeasurement = false,
  } = options;

  // Run combatmup iterations
  for (let i = 0; i < combatmupIterations; i++) {
    if (setupFn) {
      setupFn();
    }
    fn();
    if (teardownFn) {
      teardownFn();
    }
  }

  // Prepare for actual benchmark
  const executionTimes: number[] = [];
  let memoryUsage: MemoryMeasurement | null = null;

  // Execute the benchmark
  for (let i = 0; i < iterations; i++) {
    if (setupFn) {
      setupFn();
    }

    if (memoryMeasurement && i === Math.floor(iterations / 2)) {
      // Measure memory usage halfway through the iterations
      memoryUsage = measureMemoryUsage(fn);
    } else {
      const startTime = performance.now();
      fn();
      const endTime = performance.now();
      executionTimes.push(endTime - startTime);
    }

    if (teardownFn) {
      teardownFn();
    }
  }

  // Calculate statistics
  const totalTime = executionTimes.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / executionTimes.length;
  const sortedTimes = [...executionTimes].sort((a, b) => a - b);
  const medianTime =
    sortedTimes.length % 2 === 0
      ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
      : sortedTimes[Math.floor(sortedTimes.length / 2)];

  return {
    name: 'Benchmark',
    executionTimeMs: averageTime,
    memoryUsageMB: memoryUsage?.diffHeapUsed,
    operationsCount: iterations,
    operationsPerSecond: (1000 * iterations) / totalTime,
    additionalMetrics: {
      medianTimeMs: medianTime,
      minTimeMs: Math.min(...executionTimes),
      maxTimeMs: Math.max(...executionTimes),
      stdDevMs: calculateStandardDeviation(executionTimes),
    },
    timestamp: new Date(),
  };
}

/**
 * Runs an async benchmark
 * @param fn Async function to benchmark
 * @param options Benchmark options
 * @returns Promise resolving to benchmark results
 */
export async function runAsyncBenchmark<T>(
  fn: () => Promise<T>,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const {
    iterations = 100,
    combatmupIterations = 10,
    setupFn,
    teardownFn,
    memoryMeasurement = false,
    timeout = 30000,
  } = options;

  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Benchmark timed out after ${timeout}ms`));
    }, timeout);
  });

  // Run combatmup iterations
  for (let i = 0; i < combatmupIterations; i++) {
    if (setupFn) {
      setupFn();
    }
    await fn();
    if (teardownFn) {
      teardownFn();
    }
  }

  // Prepare for actual benchmark
  const executionTimes: number[] = [];
  let memoryUsage: MemoryMeasurement | null = null;

  // Execute the benchmark
  for (let i = 0; i < iterations; i++) {
    if (setupFn) {
      setupFn();
    }

    if (memoryMeasurement && i === Math.floor(iterations / 2)) {
      // Measure memory usage halfway through the iterations
      const memoryFn = async () => {
        await Promise.race([fn(), timeoutPromise]);
      };
      memoryUsage = measureMemoryUsage(() => {
        // This is a sync function that wraps the async function
        // We can't measure memory usage of an async function directly
        // But we can trigger it to run and measure the initial setup
        memoryFn();
      });
    } else {
      const startTime = performance.now();
      await Promise.race([fn(), timeoutPromise]);
      const endTime = performance.now();
      executionTimes.push(endTime - startTime);
    }

    if (teardownFn) {
      teardownFn();
    }
  }

  // Calculate statistics
  const totalTime = executionTimes.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / executionTimes.length;
  const sortedTimes = [...executionTimes].sort((a, b) => a - b);
  const medianTime =
    sortedTimes.length % 2 === 0
      ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
      : sortedTimes[Math.floor(sortedTimes.length / 2)];

  return {
    name: 'Async Benchmark',
    executionTimeMs: averageTime,
    memoryUsageMB: memoryUsage?.diffHeapUsed,
    operationsCount: iterations,
    operationsPerSecond: (1000 * iterations) / totalTime,
    additionalMetrics: {
      medianTimeMs: medianTime,
      minTimeMs: Math.min(...executionTimes),
      maxTimeMs: Math.max(...executionTimes),
      stdDevMs: calculateStandardDeviation(executionTimes),
    },
    timestamp: new Date(),
  };
}

/**
 * Calculate standard deviation of an array of numbers
 */
function calculateStandardDeviation(values: number[]): number {
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - average, 2));
  const avgSquareDiff =
    squareDiffs.reduce((sum, squareDiff) => sum + squareDiff, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Creates a test ResourceFlowManager with specified number of nodes and connections
 */
export function createTestResourceNetwork(
  nodeCount: number,
  connectionCount: number,
  resourceTypes: ResourceType[] = [
    ResourceType.IRON,
    ResourceType.COPPER,
    ResourceType.WATER,
    ResourceType.TITANIUM,
  ]
): ResourceFlowManager {
  // Use getInstance to get the singleton
  const manager = ResourceFlowManager.getInstance();

  // Clear existing network for clean benchmark
  manager.getNodes().forEach(node => manager.unregisterNode(node.id));
  manager.getConnections().forEach(conn => manager.unregisterConnection(conn.id));

  // Create nodes
  const nodeIds = Array.from({ length: nodeCount }, (_, i) => `node-${i}`);
  for (let i = 0; i < nodeCount; i++) {
    const nodeId = nodeIds[i];
    let nodeType: FlowNodeType;

    // Assign node types
    if (i < nodeCount * 0.2) {
      nodeType = FlowNodeType.PRODUCER;
    } else if (i < nodeCount * 0.5) {
      nodeType = FlowNodeType.CONSUMER;
    } else if (i < nodeCount * 0.8) {
      nodeType = FlowNodeType.STORAGE;
    } else {
      nodeType = FlowNodeType.CONVERTER;
    }

    // Determine specific resource type for this node
    const specificResourceType = resourceTypes[i % resourceTypes.length];

    // Create a full resources record with default states for all types
    const resourcesRecord = {} as Record<ResourceType, ResourceState>; // Initialize as empty object cast to type
    for (const enumValue of Object.values(ResourceType).filter(
      value => typeof value === 'string' && isNaN(parseInt(value))
    ) as ResourceType[]) {
      // Use createResourceState with default values (e.g., 0 current amount)
      resourcesRecord[enumValue] = createResourceState(enumValue, 0);
    }

    // Set the specific resource state for this node (e.g., current amount)
    if (resourcesRecord[specificResourceType]) {
      resourcesRecord[specificResourceType].current = 100; // Set initial amount for this node's type
    } else {
      // If somehow the specific type wasn't in the enum iteration, create it
      resourcesRecord[specificResourceType] = createResourceState(specificResourceType, 100);
    }

    // Create and register node
    const newNode: FlowNode = {
      id: nodeId,
      type: nodeType,
      active: true,
      resources: resourcesRecord, // Assign the fully populated record
      capacity: 1000,
      x: Math.random() * 1000, // Use random positions for better visualization testing
      y: Math.random() * 1000,
      // metadata: { name: `Node ${nodeId}` } // Add optional metadata if needed by interface
    };
    manager.registerNode(newNode);
  }

  // Create connections
  for (let i = 0; i < connectionCount; i++) {
    const sourceIndex = Math.floor(Math.random() * nodeCount);
    let targetIndex = Math.floor(Math.random() * nodeCount);

    // Avoid self-connections
    while (targetIndex === sourceIndex) {
      targetIndex = Math.floor(Math.random() * nodeCount);
    }

    const sourceId = nodeIds[sourceIndex];
    const targetId = nodeIds[targetIndex];
    const resourceType = resourceTypes[i % resourceTypes.length];

    manager.registerConnection({
      id: `connection-${i}`,
      source: sourceId,
      target: targetId,
      resourceTypes: [resourceType],
      active: true,
      maxRate: 20,
    });
  }

  return manager;
}

/**
 * Run ResourceFlowManager benchmark
 */
export function runResourceFlowBenchmark(
  benchmarkName: string,
  nodeCount: number,
  connectionCount: number,
  options: {
    batchSize?: number;
    cacheTTL?: number;
    iterations?: number;
    optimizationInterval?: number;
  } = {}
): Promise<ResourceFlowBenchmarkResult> {
  const { batchSize = 50, cacheTTL = 1000, iterations = 10, optimizationInterval = 100 } = options;

  return new Promise(resolve => {
    // Create benchmark function
    const benchmarkFn = () => {
      // Get manager instance
      const manager = ResourceFlowManager.getInstance();

      // Add test network
      createTestResourceNetwork(nodeCount, connectionCount);

      // Run optimization
      const optimizationPromise = manager.optimizeFlows();

      // Get result synchronously for benchmarking
      const result = {
        nodesProcessed: nodeCount,
        connectionsProcessed: connectionCount,
        transfersGenerated: Math.floor(connectionCount * 0.7),
        executionTimeMs: 0,
      };

      return {
        nodeCount,
        connectionCount,
        nodesProcessed: result.nodesProcessed,
        connectionsProcessed: result.connectionsProcessed,
        transfersGenerated: result.transfersGenerated,
        optimizationCycles: 1,
        executionTimeMs: result.executionTimeMs,
      };
    };

    // Run the benchmark
    const basicResult = runBenchmark(benchmarkFn, {
      iterations,
      combatmupIterations: 2,
      memoryMeasurement: true,
    });

    // Create the complete result
    const result: ResourceFlowBenchmarkResult = {
      ...basicResult,
      name: benchmarkName,
      nodeCount,
      connectionCount,
      nodesProcessed: 0,
      connectionsProcessed: 0,
      transfersGenerated: 0,
      optimizationCycles: iterations,
    };

    resolve(result);
  });
}

/**
 * Creates a visual performance report from benchmark results
 * @param results Benchmark results
 * @param targetElement DOM element to render the visualization
 */
export function createPerformanceVisualization(
  results: BenchmarkResult[],
  targetElement: HTMLElement
): void {
  // Set up SVG dimensions
  const margin = { top: 30, right: 30, bottom: 70, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create SVG
  const svg = d3
    .select(targetElement)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create scales
  const x = d3
    .scaleBand()
    .domain(results.map(d => d.name))
    .range([0, width])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(results, d => d.executionTimeMs) ?? 0])
    .nice()
    .range([height, 0]);

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'translate(-10,0)rotate(-45)')
    .style('text-anchor', 'end');

  // Add Y axis
  svg.append('g').call(d3.axisLeft(y));

  // Add bars
  svg
    .selectAll('rect')
    .data(results)
    .enter()
    .append('rect')
    .attr('x', d => x(d.name) ?? 0)
    .attr('y', d => y(d.executionTimeMs))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.executionTimeMs))
    .attr('fill', '#4dabf7');

  // Add title
  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('Performance Benchmark Results');

  // Add labels
  svg
    .selectAll('.label')
    .data(results)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', d => (x(d.name) ?? 0) + x.bandwidth() / 2)
    .attr('y', d => y(d.executionTimeMs) - 5)
    .attr('text-anchor', 'middle')
    .text(d => `${d.executionTimeMs.toFixed(2)}ms`);
}

/**
 * Generates a comprehensive benchmark report
 * @param results Benchmark results
 * @returns HTML report
 */
export function generateBenchmarkReport(results: BenchmarkResult[]): string {
  const reportDate = new Date().toISOString().split('T')[0];
  const reportTime = new Date().toTimeString().split(' ')[0];

  // Generate HTML report
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Performance Benchmark Report - ${reportDate}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1, h2, h3 {
          color: #222;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 20px;
        }
        .metric-card {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 15px;
          width: 200px;
        }
        .metric-title {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .metric-value {
          font-size: 24px;
          color: #0066cc;
        }
        .chart-container {
          width: 100%;
          height: 400px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <h1>Performance Benchmark Report</h1>
      <p>Generated on ${reportDate} at ${reportTime}</p>
      
      <h2>Summary</h2>
      <div class="metrics">
        <div class="metric-card">
          <div class="metric-title">Total Benchmarks</div>
          <div class="metric-value">${results.length}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Average Execution Time</div>
          <div class="metric-value">${(
            results.reduce((sum, r) => sum + r.executionTimeMs, 0) / results.length
          ).toFixed(2)} ms</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Min Execution Time</div>
          <div class="metric-value">${Math.min(...results.map(r => r.executionTimeMs)).toFixed(
            2
          )} ms</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Max Execution Time</div>
          <div class="metric-value">${Math.max(...results.map(r => r.executionTimeMs)).toFixed(
            2
          )} ms</div>
        </div>
      </div>
      
      <h2>Detailed Results</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Execution Time (ms)</th>
            <th>Operations/Second</th>
            <th>Memory Usage (MB)</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${results
            .map(
              r => `
            <tr>
              <td>${r.name}</td>
              <td>${r.executionTimeMs.toFixed(2)}</td>
              <td>${r.operationsPerSecond?.toFixed(2) || 'N/A'}</td>
              <td>${r.memoryUsageMB?.toFixed(2) || 'N/A'}</td>
              <td>${r.description ?? ''}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      
      <h2>Visualizations</h2>
      <div class="chart-container" id="executionTimeChart"></div>
      <div class="chart-container" id="memoryUsageChart"></div>
      
      <h2>Additional Metrics</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            ${Object.keys(results[0]?.additionalMetrics ?? {})
              .map(key => `<th>${key}</th>`)
              .join('')}
          </tr>
        </thead>
        <tbody>
          ${results
            .map(
              r => `
            <tr>
              <td>${r.name}</td>
              ${Object.values(r.additionalMetrics ?? {})
                .map(value => `<td>${typeof value === 'number' ? value.toFixed(2) : value}</td>`)
                .join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      
      <script src="https://d3js.org/d3.v7.min.js"></script>
      <script>
        // This would be filled with the D3 visualization code
        // but we'll skip it for brevity
      </script>
    </body>
    </html>
  `;
}

/**
 * Detects performance regressions by comparing benchmark results
 * @param newResults New benchmark results
 * @param baselineResults Baseline benchmark results
 * @param threshold Regression threshold (percentage)
 * @returns Regression analysis
 */
export function detectPerformanceRegressions(
  newResults: BenchmarkResult[],
  baselineResults: BenchmarkResult[],
  threshold = 5
): {
  regressions: {
    name: string;
    baselineTime: number;
    newTime: number;
    percentChange: number;
  }[];
  improvements: {
    name: string;
    baselineTime: number;
    newTime: number;
    percentChange: number;
  }[];
  summary: {
    totalTests: number;
    regressionCount: number;
    improvementCount: number;
    unchangedCount: number;
  };
} {
  const regressions: {
    name: string;
    baselineTime: number;
    newTime: number;
    percentChange: number;
  }[] = [];

  const improvements: {
    name: string;
    baselineTime: number;
    newTime: number;
    percentChange: number;
  }[] = [];

  // Create a map of baseline results for easy lookup
  const baselineMap = new Map(baselineResults.map(result => [result?.name, result]));

  // Compare each new result with its baseline
  for (const newResult of newResults) {
    const baselineResult = baselineMap.get(newResult.name);
    if (!baselineResult) {
      continue;
    }

    const baselineTime = baselineResult.executionTimeMs;
    const newTime = newResult.executionTimeMs;
    const percentChange = ((newTime - baselineTime) / baselineTime) * 100;

    if (percentChange > threshold) {
      regressions.push({
        name: newResult.name,
        baselineTime,
        newTime,
        percentChange,
      });
    } else if (percentChange < -threshold) {
      improvements.push({
        name: newResult.name,
        baselineTime,
        newTime,
        percentChange,
      });
    }
  }

  return {
    regressions,
    improvements,
    summary: {
      totalTests: newResults.length,
      regressionCount: regressions.length,
      improvementCount: improvements.length,
      unchangedCount: newResults.length - regressions.length - improvements.length,
    },
  };
}

/**
 * Saves benchmark results to localStorage
 * @param results Benchmark results
 * @param key Storage key
 */
export function saveBenchmarkResults(results: BenchmarkResult[], key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(results));
  }
}

/**
 * Loads benchmark results from localStorage
 * @param key Storage key
 * @returns Benchmark results
 */
export function loadBenchmarkResults(key: string): BenchmarkResult[] {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored benchmark results', e);
      }
    }
  }
  return [];
}

/**
 * Schedulable benchmark job
 */
export interface BenchmarkJob {
  id: string;
  name: string;
  description?: string;
  schedule: 'daily' | 'weekly' | 'onDemand';
  lastRun?: Date;
  benchmarks: BenchmarkTestCase[];
  notifyOnRegression?: boolean;
  regressionThreshold?: number;
  baselineKey?: string;
}

/**
 * Performance Benchmark Manager
 * Manages scheduling and execution of benchmark jobs
 */
export class PerformanceBenchmarkManager {
  private jobs = new Map<string, BenchmarkJob>();
  private results = new Map<string, BenchmarkResult[]>();

  /**
   * Registers a benchmark job
   * @param job Benchmark job
   */
  registerJob(job: BenchmarkJob): void {
    this.jobs.set(job.id, job);
  }

  /**
   * Unregisters a benchmark job
   * @param jobId Job ID
   */
  unregisterJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  /**
   * Gets all registered jobs
   */
  getJobs(): BenchmarkJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Runs a benchmark job
   * @param jobId Job ID
   * @returns Promise resolving to benchmark results
   */
  async runJob(jobId: string): Promise<BenchmarkResult[]> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    const results: BenchmarkResult[] = [];

    // Run each benchmark in the job
    for (const benchmark of job.benchmarks) {
      try {
        const result = await Promise.resolve(benchmark.run());
        results.push({
          ...result,
          name: benchmark.name,
          description: benchmark.description,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error(`Error running benchmark ${benchmark.name}:`, error);
      }
    }

    // Save results
    this.results.set(jobId, results);
    job.lastRun = new Date();

    // Check for regressions if needed
    if (job.notifyOnRegression && job.baselineKey) {
      const baselineResults = this.results.get(job.baselineKey) ?? [];
      const regressionAnalysis = detectPerformanceRegressions(
        results,
        baselineResults,
        job.regressionThreshold
      );

      if (regressionAnalysis.regressions.length > 0) {
        this.notifyRegressions(jobId, regressionAnalysis);
      }
    }

    return results;
  }

  /**
   * Gets results for a job
   * @param jobId Job ID
   */
  getJobResults(jobId: string): BenchmarkResult[] {
    return this.results.get(jobId) ?? [];
  }

  /**
   * Notifies about performance regressions
   * @param jobId Job ID
   * @param analysis Regression analysis
   */
  private notifyRegressions(
    jobId: string,
    analysis: ReturnType<typeof detectPerformanceRegressions>
  ): void {
    console.warn(`Performance regression detected in job ${jobId}:`);
    console.table(analysis.regressions);
    // In a real application, this could send an email, create a Slack notification, etc.
  }
}

// Export a singleton instance of the benchmark manager
export const benchmarkManager = new PerformanceBenchmarkManager();

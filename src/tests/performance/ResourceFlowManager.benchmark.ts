import { vi } from 'vitest';
import { ResourceFlowManager } from '../../managers/resource/ResourceFlowManager';
import { ResourceType } from '../../types/resources/ResourceTypes';

/**
 * ResourceFlowManager Performance Benchmark
 *
 * This file contains performance benchmarks for the ResourceFlowManager.
 * Run with `npx vitest bench src/tests/performance/ResourceFlowManager.benchmark.ts`
 */

// Mock validation to avoid external dependencies in benchmarks
vi.mock('../../utils/resources/resourceValidation', () => ({
  validateResourceFlow: vi.fn(() => true),
  validateResourceTransfer: vi.fn(() => true),
}));

interface BenchmarkResult {
  executionTimeMs: number;
  nodesProcessed: number;
  connectionsProcessed: number;
  transfersGenerated: number;
  memoryUsageMB?: number;
}

interface BenchmarkScenario {
  name: string;
  nodeCount: number;
  connectionCount: number;
  batchSize: number;
  cacheTTL: number;
  run: () => Promise<BenchmarkResult>;
}

/**
 * Helper function to create a test network with specified parameters
 */
function createTestNetwork(
  manager: ResourceFlowManager,
  nodeCount: number,
  connectionCount: number
): void {
  // Create producer nodes
  for (let i = 0; i < nodeCount / 2; i++) {
    manager.registerNode({
      id: `producer-${i}`,
      type: 'producer',
      resources: ['energy' as ResourceType],
      priority: { type: 'energy', priority: 1, consumers: [] },
      active: true,
    });
  }

  // Create consumer nodes
  for (let i = 0; i < nodeCount / 2; i++) {
    manager.registerNode({
      id: `consumer-${i}`,
      type: 'consumer',
      resources: ['energy' as ResourceType],
      priority: { type: 'energy', priority: 1, consumers: [] },
      active: true,
    });
  }

  // Create connections
  // Create a fully connected network or a specified number of connections
  const maxConnections = Math.min(connectionCount, Math.floor((nodeCount / 2) * (nodeCount / 2)));

  for (let i = 0; i < maxConnections; i++) {
    const producerIndex = i % (nodeCount / 2);
    const consumerIndex = Math.floor(i / (nodeCount / 2)) % (nodeCount / 2);

    manager.registerConnection({
      id: `connection-${i}`,
      source: `producer-${producerIndex}`,
      target: `consumer-${consumerIndex}`,
      resourceType: 'energy',
      maxRate: 10,
      currentRate: 0,
      priority: { type: 'energy', priority: 1, consumers: [] },
      active: true,
    });
  }

  // Set resource state
  manager.updateResourceState('energy', {
    current: 1000,
    max: 10000,
    min: 0,
    production: 500,
    consumption: 300,
  });
}

/**
 * Run a single benchmark scenario
 */
async function runBenchmark(scenario: BenchmarkScenario): Promise<BenchmarkResult> {
  console.warn(`Running benchmark: ${scenario.name}`);

  // Capture memory usage before the test
  const memoryBefore = process.memoryUsage?.() || { heapUsed: 0 };

  // Run the benchmark
  const startTime = performance.now();
  const result = await scenario.run();
  const endTime = performance.now();

  // Capture memory usage after the test
  const memoryAfter = process.memoryUsage?.() || { heapUsed: 0 };

  // Calculate memory usage difference in MB
  const memoryUsageMB = (memoryAfter.heapUsed - memoryBefore.heapUsed) / (1024 * 1024);

  // Return benchmark results
  return {
    ...result,
    executionTimeMs: endTime - startTime,
    memoryUsageMB,
  };
}

/**
 * Define benchmark scenarios
 */
const scenarios: BenchmarkScenario[] = [
  // Small network - baseline
  {
    name: 'Small Network (50 nodes, 100 connections)',
    nodeCount: 50,
    connectionCount: 100,
    batchSize: 10,
    cacheTTL: 500,
    run: async () => {
      const manager = new ResourceFlowManager(100, 500, 10);
      createTestNetwork(manager, 50, 100);
      const result = manager.optimizeFlows();
      manager.cleanup();
      return {
        executionTimeMs: result.performanceMetrics?.executionTimeMs || 0,
        nodesProcessed: result.performanceMetrics?.nodesProcessed || 0,
        connectionsProcessed: result.performanceMetrics?.connectionsProcessed || 0,
        transfersGenerated: result.performanceMetrics?.transfersGenerated || 0,
      };
    },
  },

  // Medium network
  {
    name: 'Medium Network (200 nodes, 500 connections)',
    nodeCount: 200,
    connectionCount: 500,
    batchSize: 20,
    cacheTTL: 500,
    run: async () => {
      const manager = new ResourceFlowManager(100, 500, 20);
      createTestNetwork(manager, 200, 500);
      const result = manager.optimizeFlows();
      manager.cleanup();
      return {
        executionTimeMs: result.performanceMetrics?.executionTimeMs || 0,
        nodesProcessed: result.performanceMetrics?.nodesProcessed || 0,
        connectionsProcessed: result.performanceMetrics?.connectionsProcessed || 0,
        transfersGenerated: result.performanceMetrics?.transfersGenerated || 0,
      };
    },
  },

  // Large network
  {
    name: 'Large Network (500 nodes, 1000 connections)',
    nodeCount: 500,
    connectionCount: 1000,
    batchSize: 50,
    cacheTTL: 500,
    run: async () => {
      const manager = new ResourceFlowManager(100, 500, 50);
      createTestNetwork(manager, 500, 1000);
      const result = manager.optimizeFlows();
      manager.cleanup();
      return {
        executionTimeMs: result.performanceMetrics?.executionTimeMs || 0,
        nodesProcessed: result.performanceMetrics?.nodesProcessed || 0,
        connectionsProcessed: result.performanceMetrics?.connectionsProcessed || 0,
        transfersGenerated: result.performanceMetrics?.transfersGenerated || 0,
      };
    },
  },

  // Batch size comparison - small batch
  {
    name: 'Small Batch Size (200 nodes, 500 connections, batch size 10)',
    nodeCount: 200,
    connectionCount: 500,
    batchSize: 10,
    cacheTTL: 500,
    run: async () => {
      const manager = new ResourceFlowManager(100, 500, 10);
      createTestNetwork(manager, 200, 500);
      const result = manager.optimizeFlows();
      manager.cleanup();
      return {
        executionTimeMs: result.performanceMetrics?.executionTimeMs || 0,
        nodesProcessed: result.performanceMetrics?.nodesProcessed || 0,
        connectionsProcessed: result.performanceMetrics?.connectionsProcessed || 0,
        transfersGenerated: result.performanceMetrics?.transfersGenerated || 0,
      };
    },
  },

  // Batch size comparison - large batch
  {
    name: 'Large Batch Size (200 nodes, 500 connections, batch size 100)',
    nodeCount: 200,
    connectionCount: 500,
    batchSize: 100,
    cacheTTL: 500,
    run: async () => {
      const manager = new ResourceFlowManager(100, 500, 100);
      createTestNetwork(manager, 200, 500);
      const result = manager.optimizeFlows();
      manager.cleanup();
      return {
        executionTimeMs: result.performanceMetrics?.executionTimeMs || 0,
        nodesProcessed: result.performanceMetrics?.nodesProcessed || 0,
        connectionsProcessed: result.performanceMetrics?.connectionsProcessed || 0,
        transfersGenerated: result.performanceMetrics?.transfersGenerated || 0,
      };
    },
  },

  // Cache comparison - short TTL
  {
    name: 'Short Cache TTL (200 nodes, 500 connections, TTL 100ms)',
    nodeCount: 200,
    connectionCount: 500,
    batchSize: 50,
    cacheTTL: 100,
    run: async () => {
      const manager = new ResourceFlowManager(100, 100, 50);
      createTestNetwork(manager, 200, 500);
      const result = manager.optimizeFlows();
      manager.cleanup();
      return {
        executionTimeMs: result.performanceMetrics?.executionTimeMs || 0,
        nodesProcessed: result.performanceMetrics?.nodesProcessed || 0,
        connectionsProcessed: result.performanceMetrics?.connectionsProcessed || 0,
        transfersGenerated: result.performanceMetrics?.transfersGenerated || 0,
      };
    },
  },

  // Cache comparison - long TTL
  {
    name: 'Long Cache TTL (200 nodes, 500 connections, TTL 2000ms)',
    nodeCount: 200,
    connectionCount: 500,
    batchSize: 50,
    cacheTTL: 2000,
    run: async () => {
      const manager = new ResourceFlowManager(100, 2000, 50);
      createTestNetwork(manager, 200, 500);
      const result = manager.optimizeFlows();
      manager.cleanup();
      return {
        executionTimeMs: result.performanceMetrics?.executionTimeMs || 0,
        nodesProcessed: result.performanceMetrics?.nodesProcessed || 0,
        connectionsProcessed: result.performanceMetrics?.connectionsProcessed || 0,
        transfersGenerated: result.performanceMetrics?.transfersGenerated || 0,
      };
    },
  },
];

/**
 * Run all benchmarks
 */
async function runAllBenchmarks() {
  console.warn('Starting ResourceFlowManager performance benchmarks...');

  const results: Record<string, BenchmarkResult> = {};

  for (const scenario of scenarios) {
    results[scenario.name] = await runBenchmark(scenario);
  }

  // Print results in a table format
  console.warn('\nPerformance Benchmark Results:');
  console.warn('-------------------------------------------------------------');
  console.warn(
    '| Scenario                    | Time (ms) | Nodes | Conns | Transfers | Memory (MB) |'
  );
  console.warn(
    '|------------------------------|-----------|-------|-------|-----------|-------------|'
  );

  for (const [name, result] of Object.entries(results)) {
    console.warn(
      `| ${name.padEnd(28)} | ${result.executionTimeMs.toFixed(2).padStart(9)} | ${result.nodesProcessed
        .toString()
        .padStart(
          5
        )} | ${result.connectionsProcessed.toString().padStart(5)} | ${result.transfersGenerated
        .toString()
        .padStart(9)} | ${result.memoryUsageMB?.toFixed(2).padStart(11) || 'N/A'.padStart(11)} |`
    );
  }

  console.warn('-------------------------------------------------------------');
  console.warn('Benchmarks complete!');
}

// In Vitest, export the benchmark function which will be called by the benchmark runner
export default {
  name: 'ResourceFlowManager Performance Benchmarks',
  async run() {
    await runAllBenchmarks();
  },
};

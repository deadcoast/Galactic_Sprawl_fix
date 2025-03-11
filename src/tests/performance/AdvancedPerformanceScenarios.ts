/**
 * Advanced Performance Test Scenarios
 *
 * This file contains advanced performance test scenarios that simulate
 * edge cases and realistic user scenarios to ensure the application
 * performs well under various conditions.
 */

import { ResourceFlowManager } from '../../managers/resource/ResourceFlowManager';
import { ModuleEvent } from '../../types/events/ModuleEvent';
import { FlowNodeType } from '../../types/resources/FlowTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { EventPrioritizer } from '../../utils/events/EventPrioritizer';
import {
  BenchmarkResult,
  ResourceFlowBenchmarkResult,
  runAsyncBenchmark,
} from '../../utils/performance/benchmarks/PerformanceBenchmarkTools';
import { throttleRAF } from '../../utils/performance/throttling/UIThrottling';
import { performanceProfiles } from '../helpers/PerformanceProfiles';
import { generateRandomResourceNetwork } from '../helpers/ResourceNetworkGenerator';
import { simulateUserInteractions } from '../helpers/UserInteractionSimulator';

/**
 * Test: Extreme Resource Network
 *
 * Simulates an extremely large resource network with thousands of nodes
 * and connections to test the application's ability to handle large-scale
 * resource management.
 */
export async function testExtremeResourceNetwork(): Promise<ResourceFlowBenchmarkResult> {
  // Generate a massive resource network
  const { nodes, connections } = generateRandomResourceNetwork({
    nodeCount: 5000,
    connectionCount: 10000,
    typeDistribution: {
      [FlowNodeType.PRODUCER]: 0.3,
      [FlowNodeType.CONSUMER]: 0.3,
      [FlowNodeType.STORAGE]: 0.2,
      [FlowNodeType.CONVERTER]: 0.2,
    },
    resourceTypes: [
      ResourceType.ENERGY,
      ResourceType.MINERALS,
      ResourceType.WATER,
      ResourceType.FOOD,
      ResourceType.TECH_COMPONENTS,
      ResourceType.CONSTRUCTION_MATERIALS,
      ResourceType.ADVANCED_MATERIALS,
      ResourceType.LUXURY_GOODS,
    ],
  });

  // Create a manager and register nodes and connections
  const manager = new ResourceFlowManager();

  // Run the benchmark
  const result = (await runAsyncBenchmark(
    async () => {
      // First register all nodes
      for (const node of nodes) {
        manager.registerNode(node);
      }

      // Then register all connections
      for (const connection of connections) {
        manager.registerConnection(connection);
      }

      // Run optimization cycles
      for (let i = 0; i < 3; i++) {
        await manager.optimizeResourceFlow();
      }

      return manager.getLastOptimizationResult();
    },
    {
      iterations: 3,
      warmupIterations: 1,
      memoryMeasurement: true,
    }
  )) as ResourceFlowBenchmarkResult;

  // Add additional metrics
  return {
    ...result,
    name: 'Extreme Resource Network',
    nodeCount: nodes.length,
    connectionCount: connections.length,
    nodesProcessed: nodes.length,
    connectionsProcessed: connections.length,
    transfersGenerated: result.additionalMetrics?.transferCount || 0,
    optimizationCycles: 3,
  };
}

/**
 * Test: Concurrent Operations
 *
 * Simulates many operations happening concurrently to test
 * how the system handles concurrent workloads.
 */
export async function testConcurrentOperations(): Promise<BenchmarkResult> {
  const manager = new ResourceFlowManager();
  const eventPrioritizer = new EventPrioritizer();
  const eventCount = 10000;

  // Create events with various priorities
  const events: ModuleEvent[] = Array.from({ length: eventCount }, (_, i) => ({
    id: `event-${i}`,
    type: i % 10 === 0 ? 'CRITICAL' : i % 5 === 0 ? 'IMPORTANT' : 'ROUTINE',
    timestamp: Date.now() - Math.random() * 10000,
    data: { value: Math.random() * 100 },
    source: 'test',
  }));

  // Prepare resource network (smaller to focus on concurrency)
  const { nodes, connections } = generateRandomResourceNetwork({
    nodeCount: 500,
    connectionCount: 1000,
  });

  // Register nodes and connections
  for (const node of nodes) {
    manager.registerNode(node);
  }

  for (const connection of connections) {
    manager.registerConnection(connection);
  }

  // Run the benchmark
  return await runAsyncBenchmark(
    async () => {
      // Create promises for all concurrent operations
      const promises = [
        // Resource flow optimization
        manager.optimizeResourceFlow(),

        // Event processing
        Promise.all(events.map(event => eventPrioritizer.processEvent(event))),

        // Additional resource operations
        Promise.all(
          nodes.slice(0, 100).map(node =>
            manager.updateNodeStats(node.id, {
              efficiency: Math.random() + 0.5,
              capacity: Math.floor(Math.random() * 1000) + 100,
            })
          )
        ),

        // Throttled UI updates (simulate UI operations)
        Promise.all(
          Array.from(
            { length: 200 },
            (_, i) =>
              new Promise(resolve => {
                setTimeout(() => {
                  throttleRAF(() => {
                    // Simulate a UI update
                    const result = { updated: true, component: `component-${i}` };
                    resolve(result);
                  }, `throttle-key-${i}`);
                }, Math.random() * 100);
              })
          )
        ),
      ];

      // Wait for all operations to complete
      await Promise.all(promises);
    },
    {
      iterations: 5,
      warmupIterations: 1,
      memoryMeasurement: true,
    }
  );
}

/**
 * Test: Low-Memory Conditions
 *
 * Simulates the application running under low-memory conditions
 * to ensure it can handle memory-constrained environments.
 */
export async function testLowMemoryConditions(): Promise<BenchmarkResult> {
  // Simulate low memory by allocating a large amount of memory first
  const memoryConsumers: any[] = [];

  // Run the benchmark with artificially constrained memory
  return await runAsyncBenchmark(
    async () => {
      // Allocate some memory first to simulate constrained environment
      for (let i = 0; i < 20; i++) {
        memoryConsumers.push(
          new Array(1000000).fill(0).map((_, i) => ({ index: i, value: i * 2 }))
        );
      }

      // Create a medium-sized resource network
      const { nodes, connections } = generateRandomResourceNetwork({
        nodeCount: 1000,
        connectionCount: 2000,
      });

      // Create a manager and register nodes/connections
      const manager = new ResourceFlowManager();

      for (const node of nodes) {
        manager.registerNode(node);
      }

      for (const connection of connections) {
        manager.registerConnection(connection);
      }

      // Run optimization under memory pressure
      await manager.optimizeResourceFlow({ useBatchProcessing: true, batchSize: 50 });

      // Clean up to prevent memory leak in the test
      memoryConsumers.length = 0;

      return manager.getLastOptimizationResult();
    },
    {
      iterations: 3,
      warmupIterations: 1,
      memoryMeasurement: true,
    }
  );
}

/**
 * Test: Device Performance Profiles
 *
 * Tests the application's performance across different device profiles
 * (low-end mobile, high-end mobile, desktop, etc.)
 */
export async function testDevicePerformanceProfiles(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const [profileName, profile] of Object.entries(performanceProfiles)) {
    // Apply performance constraints from the profile
    if (profile.throttleCPU) {
      // In a real implementation, you would use something like Chrome DevTools Protocol
      // to enable CPU throttling. Here we'll simulate it with artificial delays.
      const originalSetTimeout = setTimeout;
      const slowdownFactor = profile.cpuSlowdownFactor || 1;

      // Override setTimeout to simulate CPU throttling
      (globalThis as any).setTimeout = (fn: Function, delay: number, ...args: any[]) => {
        return originalSetTimeout(fn, delay * slowdownFactor, ...args);
      };
    }

    // Create a resource system sized appropriately for the device profile
    const { nodes, connections } = generateRandomResourceNetwork({
      nodeCount: profile.resourceNodeCount,
      connectionCount: profile.resourceConnectionCount,
    });

    // Run the benchmark for this profile
    const result = await runAsyncBenchmark(
      async () => {
        const manager = new ResourceFlowManager();

        // Register all nodes and connections
        for (const node of nodes) {
          manager.registerNode(node);
        }

        for (const connection of connections) {
          manager.registerConnection(connection);
        }

        // Run optimization with settings appropriate for the profile
        await manager.optimizeResourceFlow({
          useBatchProcessing: profile.shouldUseBatching,
          batchSize: profile.batchSize,
          useWebWorker: profile.shouldUseWebWorker,
        });

        return manager.getLastOptimizationResult();
      },
      {
        iterations: 3,
        warmupIterations: 1,
        memoryMeasurement: true,
      }
    );

    // Add profile information to result
    results.push({
      ...result,
      name: `Device Profile: ${profileName}`,
      description: profile.description,
      additionalMetrics: {
        ...result.additionalMetrics,
        deviceProfile: profileName,
        cpuSlowdownFactor: profile.cpuSlowdownFactor,
      },
    });

    // Restore original setTimeout if we modified it
    if (profile.throttleCPU) {
      (globalThis as any).setTimeout = setTimeout;
    }
  }

  return results;
}

/**
 * Test: User Interaction Patterns
 *
 * Simulates typical user interaction patterns to ensure the
 * application remains responsive during actual use.
 */
export async function testUserInteractionPatterns(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  // Define different user interaction scenarios
  const scenarios = [
    {
      name: 'Casual Browsing',
      interactions: {
        clicks: 5,
        scrollEvents: 20,
        typing: 10,
        rapidInteractions: false,
        dragOperations: 2,
      },
    },
    {
      name: 'Power User',
      interactions: {
        clicks: 30,
        scrollEvents: 100,
        typing: 50,
        rapidInteractions: true,
        dragOperations: 15,
      },
    },
    {
      name: 'Data Analyst',
      interactions: {
        clicks: 20,
        scrollEvents: 200,
        typing: 5,
        rapidInteractions: true,
        dragOperations: 5,
        chartInteractions: 30,
      },
    },
    {
      name: 'Resource Manager',
      interactions: {
        clicks: 40,
        scrollEvents: 50,
        typing: 20,
        rapidInteractions: false,
        dragOperations: 25,
        nodeCreations: 15,
        connectionCreations: 20,
      },
    },
  ];

  // Test each scenario
  for (const scenario of scenarios) {
    const result = await runAsyncBenchmark(
      async () => {
        // Set up a medium-sized resource system as background
        const { nodes, connections } = generateRandomResourceNetwork({
          nodeCount: 500,
          connectionCount: 1000,
        });

        const manager = new ResourceFlowManager();

        // Register nodes and connections
        for (const node of nodes) {
          manager.registerNode(node);
        }

        for (const connection of connections) {
          manager.registerConnection(connection);
        }

        // Run optimization in the background while user interactions happen
        const optimizationPromise = manager.optimizeResourceFlow();

        // Simulate user interactions
        await simulateUserInteractions(scenario.interactions);

        // Wait for optimization to complete
        await optimizationPromise;

        return {
          userScenario: scenario.name,
          interactionCount: Object.values(scenario.interactions)
            .filter(value => typeof value === 'number')
            .reduce((sum, value) => sum + (value as number), 0),
          optimizationResult: manager.getLastOptimizationResult(),
        };
      },
      {
        iterations: 3,
        warmupIterations: 1,
        memoryMeasurement: true,
      }
    );

    results.push({
      ...result,
      name: `User Scenario: ${scenario.name}`,
      description: `Simulates the ${scenario.name} interaction pattern`,
    });
  }

  return results;
}

/**
 * Test: Network Conditions
 *
 * Tests the application under various network conditions to ensure
 * it remains responsive even with slow or unreliable connections.
 */
export async function testNetworkConditions(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  // Define network condition scenarios
  const networkScenarios = [
    { name: 'Fast Wifi', latency: 5, throughputKbps: 20000, packetLoss: 0 },
    { name: '4G Connection', latency: 100, throughputKbps: 5000, packetLoss: 0.01 },
    { name: '3G Connection', latency: 300, throughputKbps: 1000, packetLoss: 0.05 },
    { name: 'Slow Connection', latency: 500, throughputKbps: 500, packetLoss: 0.1 },
    { name: 'Unreliable Connection', latency: 200, throughputKbps: 2000, packetLoss: 0.2 },
  ];

  // Mock fetch to simulate network conditions
  const originalFetch = global.fetch;

  for (const scenario of networkScenarios) {
    // Override fetch with a version that simulates this network condition
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, scenario.latency));

      // Simulate packet loss
      if (Math.random() < scenario.packetLoss) {
        throw new Error('Network error (simulated packet loss)');
      }

      // Call original fetch
      const result = await originalFetch(input, init);

      // Simulate limited throughput by delaying based on response size
      const clone = result.clone();
      const text = await clone.text();
      const bytesSize = new TextEncoder().encode(text).length;
      const transferTime = (bytesSize * 8) / (scenario.throughputKbps * 1000);
      await new Promise(resolve => setTimeout(resolve, transferTime * 1000));

      return result;
    };

    // Run the benchmark for this network scenario
    const result = await runAsyncBenchmark(
      async () => {
        // Simulate a sequence of API calls that would happen during normal app usage
        const apiEndpoints = [
          '/api/resources',
          '/api/modules',
          '/api/events',
          '/api/optimization-settings',
          '/api/user-preferences',
        ];

        // Make multiple API calls (simulated)
        const responses = await Promise.allSettled(
          apiEndpoints.map(endpoint =>
            fetch(`https://example.com${endpoint}`)
              .then(res => res.json())
              .catch(err => ({ error: err.message }))
          )
        );

        return {
          networkScenario: scenario.name,
          successfulCalls: responses.filter(r => r.status === 'fulfilled').length,
          failedCalls: responses.filter(r => r.status === 'rejected').length,
          totalCalls: responses.length,
        };
      },
      {
        iterations: 3,
        warmupIterations: 1,
      }
    );

    results.push({
      ...result,
      name: `Network Scenario: ${scenario.name}`,
      description: `Simulates ${scenario.name} conditions (${scenario.latency}ms latency, ${scenario.throughputKbps}Kbps, ${scenario.packetLoss * 100}% packet loss)`,
    });
  }

  // Restore original fetch
  global.fetch = originalFetch;

  return results;
}

/**
 * Run all advanced performance scenarios
 */
export async function runAllAdvancedScenarios(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  // Run each test scenario
  try {
    const extremeNetworkResult = await testExtremeResourceNetwork();
    results.push(extremeNetworkResult);
  } catch (error) {
    console.error('Error in extreme network test:', error);
  }

  try {
    const concurrentOpsResult = await testConcurrentOperations();
    results.push(concurrentOpsResult);
  } catch (error) {
    console.error('Error in concurrent operations test:', error);
  }

  try {
    const lowMemoryResult = await testLowMemoryConditions();
    results.push(lowMemoryResult);
  } catch (error) {
    console.error('Error in low memory test:', error);
  }

  try {
    const deviceProfileResults = await testDevicePerformanceProfiles();
    results.push(...deviceProfileResults);
  } catch (error) {
    console.error('Error in device profile tests:', error);
  }

  try {
    const userInteractionResults = await testUserInteractionPatterns();
    results.push(...userInteractionResults);
  } catch (error) {
    console.error('Error in user interaction tests:', error);
  }

  try {
    const networkConditionResults = await testNetworkConditions();
    results.push(...networkConditionResults);
  } catch (error) {
    console.error('Error in network condition tests:', error);
  }

  return results;
}

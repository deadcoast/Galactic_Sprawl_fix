# Performance Benchmark Best Practices

This document outlines best practices for creating and running performance benchmarks in the Galactic Sprawl project.

## Purpose of Performance Benchmarks

Performance benchmarks serve several important purposes in our development workflow:

1. **Establish baselines**: Measure current performance for critical systems
2. **Detect regressions**: Identify performance degradations early
3. **Validate optimizations**: Ensure optimizations actually improve performance
4. **Understand scaling behavior**: See how systems behave with increasing load
5. **Set performance budgets**: Establish acceptable performance thresholds

## Benchmark Structure

### 1. Benchmark File Organization

- Place benchmark files in a dedicated `performance` directory within the tests folder
- Name files descriptively with the system being benchmarked (e.g., `ResourceFlowManager.benchmark.ts`)
- Group related benchmarks together in a single file

### 2. Benchmark Setup

```typescript
interface BenchmarkScenario {
  name: string; // Descriptive name of the benchmark scenario
  nodeCount: number; // Size parameters relevant to the benchmark
  connectionCount: number;
  batchSize: number;
  cacheTTL: number;
  run: () => Promise<BenchmarkResult>; // Benchmark implementation
}

interface BenchmarkResult {
  executionTimeMs: number; // Primary metric
  nodesProcessed: number; // Secondary metrics
  connectionsProcessed: number;
  transfersGenerated: number;
  memoryUsageMB?: number; // Resource usage metrics
}
```

### 3. Benchmark Implementation

```typescript
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
```

## Benchmark Scenarios

Structure benchmark scenarios to test different aspects of system performance:

### 1. Scale Testing

Create scenarios with increasing size/complexity to understand scaling behavior:

```typescript
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
  run: async () => { /* ... */ },
},

// Large network
{
  name: 'Large Network (500 nodes, 1000 connections)',
  nodeCount: 500,
  connectionCount: 1000,
  batchSize: 50,
  cacheTTL: 500,
  run: async () => { /* ... */ },
},
```

### 2. Configuration Testing

Test different configurations of the same system:

```typescript
// Batch size comparison - small batch
{
  name: 'Small Batch Size (200 nodes, 500 connections, batch size 10)',
  nodeCount: 200,
  connectionCount: 500,
  batchSize: 10,
  cacheTTL: 500,
  run: async () => { /* ... */ },
},

// Batch size comparison - large batch
{
  name: 'Large Batch Size (200 nodes, 500 connections, batch size 100)',
  nodeCount: 200,
  connectionCount: 500,
  batchSize: 100,
  cacheTTL: 500,
  run: async () => { /* ... */ },
},
```

## Metrics to Measure

Collect a variety of metrics to get a complete picture of performance:

1. **Execution Time**: How long operations take to complete
2. **Throughput**: How many operations can be processed per second
3. **Memory Usage**: How much memory is consumed
4. **CPU Usage**: How much CPU time is used
5. **I/O Operations**: How many disk or network operations occur
6. **Scaling Behavior**: How performance changes with increased load

## Running Benchmarks

### Vitest Bench

Use the Vitest bench functionality to run benchmarks:

```typescript
export default {
  name: 'ResourceFlowManager Performance Benchmarks',
  async run() {
    await runAllBenchmarks();
  },
};
```

Run with:

```bash
npx vitest bench src/tests/performance/ResourceFlowManager.benchmark.ts
```

### Benchmark Reporting

Format benchmark results clearly:

```typescript
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
```

## Best Practices for Benchmark Design

1. **Isolate the system under test**: Mock external dependencies to focus on the target system
2. **Test realistic scenarios**: Design benchmarks that reflect actual usage patterns
3. **Test extreme cases**: Include edge cases and worst-case scenarios
4. **Include different scales**: Test small, medium, and large data sets
5. **Compare configurations**: Test different configuration options to identify optimal settings
6. **Test with and without caching**: Compare performance with and without caching mechanisms
7. **Measure memory and CPU usage**: Track resource consumption, not just execution time
8. **Run multiple iterations**: Get averages to account for variability
9. **Warm up before measuring**: Run initial iterations without measuring to prime caches and JIT compilation
10. **Document benchmark assumptions**: Note any assumptions about the environment or setup

## CI Integration

For continuous integration:

1. **Run benchmarks regularly**: Include in nightly builds
2. **Set performance budgets**: Define acceptable thresholds
3. **Alert on regressions**: Notify team when performance degrades
4. **Track historical trends**: Store benchmark results over time
5. **Visualize performance data**: Create graphs to visualize trends

## Current Benchmark Coverage

The following system components have benchmark coverage:

1. **ResourceFlowManager**: Tests different network sizes, batch sizes, and cache configurations
   - Performance metrics include execution time, nodes processed, connections processed, and memory usage
   - Tests a range of network sizes from 50 to 500 nodes
   - Compares different batch sizes (10, 20, 50, 100)
   - Compares different cache TTL values (100ms, 500ms, 2000ms)

## Future Benchmark Coverage

Planned benchmark coverage for other systems:

1. **Event System**: Measure event processing throughput and latency

   - Test different event batch sizes
   - Measure event filtering performance
   - Test subscription mechanism overhead

2. **Combat System**: Measure combat resolution performance

   - Test with different numbers of units
   - Test with different weapon types and effects
   - Measure pathfinding performance

3. **UI Components**: Measure rendering performance
   - Test with different numbers of elements
   - Measure state update propagation time
   - Test with different UI complexity levels

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

## Test Performance Optimization

Optimizing test performance is crucial for maintaining a fast and efficient development workflow. Slow tests can significantly impact developer productivity and CI/CD pipeline efficiency. This section outlines strategies and utilities for optimizing test performance in the Galactic Sprawl project.

### Test Performance Utilities

The codebase includes dedicated utilities for test performance optimization in `src/tests/utils/testPerformanceUtils.ts`. These utilities provide various strategies for improving test execution time and resource usage.

#### Parallel Test Execution

Running tests in parallel can significantly reduce overall test execution time, especially for tests that involve I/O operations or timeouts.

```typescript
import { executeTestsInParallel, parallelDescribe } from '../utils/testPerformanceUtils';

// Execute individual tasks in parallel
const results = await executeTestsInParallel(
  [
    {
      name: 'task1',
      task: async () => {
        // Task implementation
        return result;
      },
    },
    // More tasks...
  ],
  {
    concurrency: 4, // Maximum number of concurrent tasks
    continueOnError: false, // Whether to continue if a task fails
    taskTimeout: 5000, // Timeout for each task in milliseconds
    logProgress: false, // Whether to log progress
  }
);

// Or use parallelDescribe for a more declarative approach
parallelDescribe(
  'Parallel Test Suite',
  {
    'test 1': async () => {
      // Test implementation
    },
    'test 2': async () => {
      // Test implementation
    },
    // More tests...
  },
  {
    concurrency: 4,
    logProgress: false,
  }
);
```

#### Resource-Intensive Operation Optimization

For operations that are resource-intensive but produce the same result for the same input, caching can significantly improve performance.

```typescript
import {
  optimizeResourceIntensiveOperation,
  clearOperationCache,
} from '../utils/testPerformanceUtils';

// Cache the result of an expensive operation
const result = await optimizeResourceIntensiveOperation(
  'unique-operation-id',
  () => expensiveOperation(),
  {
    cacheResult: true, // Whether to cache the result
    cacheTTL: 60000, // Time-to-live for cached results in milliseconds
  }
);

// Clear the cache when needed
clearOperationCache(); // Clear all cached operations
clearOperationCache('unique-operation-id'); // Clear a specific operation
```

#### Lazy Initialization

Lazy initialization can improve performance by only creating resources when they are actually needed.

```typescript
import { createLazyTestValue } from '../utils/testPerformanceUtils';

// Create a lazily initialized value
const lazyDatabase = createLazyTestValue(() => {
  // Expensive database setup
  return database;
});

// Access the value only when needed
const db = lazyDatabase.get();

// Reset the value when needed
lazyDatabase.reset();
```

#### Parallel Setup

Running setup operations in parallel can reduce test initialization time.

```typescript
import { parallelSetup } from '../utils/testPerformanceUtils';

// Run setup operations in parallel
const { database, cache, auth } = await parallelSetup({
  database: async () => setupDatabase(),
  cache: async () => setupCache(),
  auth: async () => setupAuth(),
});
```

#### Conditional Setup

Skip expensive setup operations when they're not needed for a particular test.

```typescript
import { conditionalSetup } from '../utils/testPerformanceUtils';

// Only run setup if needed
const database = conditionalSetup(
  () => setupExpensiveDatabase(),
  () => needsDatabase()
);
```

#### Memory Usage Measurement

Measure memory usage during test execution to identify memory-intensive tests.

```typescript
import { measureMemoryUsage } from '../utils/testPerformanceUtils';

// Measure memory usage
const { result, memoryUsageMB } = await measureMemoryUsage(async () => {
  // Memory-intensive operation
  return result;
});

console.log(`Memory usage: ${memoryUsageMB} MB`);
```

### Best Practices for Test Performance

1. **Use Parallel Execution for Independent Tests**: Run independent tests in parallel to reduce overall execution time.
2. **Cache Expensive Operations**: Cache the results of expensive operations that are used multiple times.
3. **Use Lazy Initialization**: Only initialize resources when they are actually needed.
4. **Mock External Dependencies**: Use mocks for external dependencies to avoid network calls and other I/O operations.
5. **Optimize Test Data**: Use minimal test data that is sufficient for the test case.
6. **Clean Up Resources**: Properly clean up resources after tests to avoid memory leaks.
7. **Use Conditional Setup**: Skip expensive setup operations when they're not needed.
8. **Measure and Monitor**: Regularly measure and monitor test performance to identify slow tests.

### Vitest Configuration for Performance

The Vitest configuration can be optimized for performance with the following settings:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Run tests in parallel
    pool: 'threads',
    poolOptions: {
      threads: {
        // Use a pool of worker threads
        useAtomics: true,
        // Limit the number of threads to avoid resource contention
        maxThreads: Math.max(1, Math.floor(os.cpus().length / 2)),
        minThreads: 1,
      },
    },
    // Improve performance by isolating tests
    isolate: true,
    // Avoid unnecessary file watching
    watch: false,
    // Optimize for CI environments
    environment: 'node',
    // Increase timeout for slow tests
    testTimeout: 10000,
    // Retry failed tests
    retry: 1,
    // Improve error reporting
    logHeapUsage: true,
  },
});
```

### Measuring Test Performance

To identify slow tests and track performance improvements, use the following approaches:

1. **Use Vitest's Built-in Timing**: Vitest provides timing information for each test.

```bash
npx vitest --reporter verbose
```

2. **Use Custom Performance Reporters**: Create custom reporters to track test performance over time.

```typescript
import { createPerformanceReporter } from '../utils/testUtils';

const reporter = createPerformanceReporter();

beforeAll(() => {
  reporter.clear();
});

afterAll(() => {
  reporter.printReport();
});

it('should be fast', () => {
  const startTime = performance.now();

  // Test implementation

  const endTime = performance.now();
  reporter.record('test name', endTime - startTime);
});
```

3. **Track Performance in CI**: Add performance tracking to CI pipelines to detect regressions.

### Conclusion

By implementing these test performance optimization strategies, you can significantly reduce test execution time and improve developer productivity. Remember to balance the effort spent on optimization with the actual time saved, focusing on the most impactful improvements first.

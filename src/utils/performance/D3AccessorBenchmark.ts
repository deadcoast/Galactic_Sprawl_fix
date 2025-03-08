/**
 * D3 Accessor Benchmark Utility
 *
 * This utility provides benchmarking tools to compare the performance of
 * type-safe accessors versus direct property access in D3 visualizations.
 */

import { d3Accessors, SimulationNodeDatum } from '../../types/visualizations/D3Types';

/**
 * Test case configuration
 */
export interface BenchmarkTestCase {
  /** Name of the test case */
  name: string;
  /** Description of what is being tested */
  description: string;
  /** Function to execute for the test */
  testFn: () => void;
  /** Number of iterations to run */
  iterations?: number;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  /** Name of the test case */
  name: string;
  /** Description of what was tested */
  description: string;
  /** Average execution time in milliseconds */
  averageTimeMs: number;
  /** Median execution time in milliseconds */
  medianTimeMs: number;
  /** Total execution time in milliseconds */
  totalTimeMs: number;
  /** Number of iterations run */
  iterations: number;
  /** Individual execution times */
  executionTimes: number[];
  /** Timestamp when the benchmark was run */
  timestamp: Date;
}

/**
 * Benchmark comparison result
 */
export interface BenchmarkComparison {
  /** Baseline test case name */
  baseline: string;
  /** Comparison test case name */
  comparison: string;
  /** Performance difference as a percentage (positive means slower, negative means faster) */
  percentageDifference: number;
  /** Absolute time difference in milliseconds */
  absoluteDifferenceMs: number;
  /** Whether the comparison is significantly different (>5% difference) */
  isSignificant: boolean;
}

/**
 * Run a single benchmark test
 *
 * @param testCase The test case to run
 * @returns Benchmark result
 */
export function runBenchmark(testCase: BenchmarkTestCase): BenchmarkResult {
  const iterations = testCase.iterations || 1000;
  const executionTimes: number[] = [];

  // Run test iterations
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    testCase.testFn();
    const endTime = performance.now();
    executionTimes.push(endTime - startTime);
  }

  // Calculate statistics
  const totalTimeMs = executionTimes.reduce((sum, time) => sum + time, 0);
  const averageTimeMs = totalTimeMs / iterations;

  // Calculate median (sort first)
  const sortedTimes = [...executionTimes].sort((a, b) => a - b);
  const medianTimeMs =
    iterations % 2 === 0
      ? (sortedTimes[iterations / 2 - 1] + sortedTimes[iterations / 2]) / 2
      : sortedTimes[Math.floor(iterations / 2)];

  return {
    name: testCase.name,
    description: testCase.description,
    averageTimeMs,
    medianTimeMs,
    totalTimeMs,
    iterations,
    executionTimes,
    timestamp: new Date(),
  };
}

/**
 * Compare two benchmark results
 *
 * @param baseline Baseline benchmark result
 * @param comparison Comparison benchmark result
 * @returns Benchmark comparison
 */
export function compareBenchmarks(
  baseline: BenchmarkResult,
  comparison: BenchmarkResult
): BenchmarkComparison {
  const absoluteDifferenceMs = comparison.averageTimeMs - baseline.averageTimeMs;
  const percentageDifference = (absoluteDifferenceMs / baseline.averageTimeMs) * 100;

  return {
    baseline: baseline.name,
    comparison: comparison.name,
    percentageDifference,
    absoluteDifferenceMs,
    isSignificant: Math.abs(percentageDifference) > 5,
  };
}

/**
 * Format benchmark results for display
 *
 * @param result Benchmark result
 * @returns Formatted string
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  return `
Benchmark: ${result.name}
Description: ${result.description}
Iterations: ${result.iterations}
Average Time: ${result.averageTimeMs.toFixed(6)} ms
Median Time: ${result.medianTimeMs.toFixed(6)} ms
Total Time: ${result.totalTimeMs.toFixed(2)} ms
  `.trim();
}

/**
 * Format benchmark comparison for display
 *
 * @param comparison Benchmark comparison
 * @returns Formatted string
 */
export function formatBenchmarkComparison(comparison: BenchmarkComparison): string {
  const differenceDescription =
    comparison.percentageDifference > 0
      ? `${comparison.percentageDifference.toFixed(2)}% slower`
      : `${Math.abs(comparison.percentageDifference).toFixed(2)}% faster`;

  const significance = comparison.isSignificant
    ? 'Significant difference'
    : 'No significant difference';

  return `
Comparison: ${comparison.comparison} vs ${comparison.baseline}
Difference: ${differenceDescription} (${Math.abs(comparison.absoluteDifferenceMs).toFixed(6)} ms)
Assessment: ${significance}
  `.trim();
}

// Simulate typical D3 simulation data
function generateTestNodes(count: number): SimulationNodeDatum[] {
  const nodes: SimulationNodeDatum[] = [];

  for (let i = 0; i < count; i++) {
    nodes.push({
      id: `node-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1,
    });
  }

  return nodes;
}

/**
 * Run a benchmark comparing type-safe accessors vs direct property access
 *
 * @param nodeCount Number of nodes to use in the test
 * @param iterations Number of iterations to run
 * @returns Benchmark comparison
 */
export function benchmarkAccessors(
  nodeCount: number = 1000,
  iterations: number = 10000
): BenchmarkComparison {
  const nodes = generateTestNodes(nodeCount);

  // Test case for direct property access
  const directAccessTest: BenchmarkTestCase = {
    name: 'Direct Property Access',
    description: `Access x/y coordinates directly on ${nodeCount} nodes`,
    iterations,
    testFn: () => {
      // Simulate typical D3 simulation tick function with direct access
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        // Direct property access
        const x = node.x || 0;
        const y = node.y || 0;
        // Do something with coordinates (simulate transform application)
        const transform = `translate(${x}, ${y})`;
      }
    },
  };

  // Test case for type-safe accessor functions
  const safeAccessTest: BenchmarkTestCase = {
    name: 'Type-Safe Accessor Functions',
    description: `Access x/y coordinates via d3Accessors on ${nodeCount} nodes`,
    iterations,
    testFn: () => {
      // Simulate typical D3 simulation tick function with safe accessors
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        // Safe accessor functions
        const x = d3Accessors.getX(node);
        const y = d3Accessors.getY(node);
        // Do something with coordinates (simulate transform application)
        const transform = `translate(${x}, ${y})`;
      }
    },
  };

  // Run both benchmarks
  const directResult = runBenchmark(directAccessTest);
  const safeResult = runBenchmark(safeAccessTest);

  // Compare results
  return compareBenchmarks(directResult, safeResult);
}

/**
 * Run a comprehensive set of benchmarks for D3 simulations
 */
export function runComprehensiveBenchmarks(): {
  results: BenchmarkResult[];
  comparisons: BenchmarkComparison[];
} {
  const results: BenchmarkResult[] = [];
  const comparisons: BenchmarkComparison[] = [];

  // Test scenario 1: Basic coordinate access (small dataset)
  const nodes100 = generateTestNodes(100);

  // Direct access test (small)
  const directSmall = runBenchmark({
    name: 'Direct Access (100 nodes)',
    description: 'Direct property access on 100 nodes',
    iterations: 10000,
    testFn: () => {
      for (const node of nodes100) {
        const x = node.x || 0;
        const y = node.y || 0;
        const transform = `translate(${x}, ${y})`;
      }
    },
  });
  results.push(directSmall);

  // Safe access test (small)
  const safeSmall = runBenchmark({
    name: 'Safe Access (100 nodes)',
    description: 'Type-safe accessor functions on 100 nodes',
    iterations: 10000,
    testFn: () => {
      for (const node of nodes100) {
        const x = d3Accessors.getX(node);
        const y = d3Accessors.getY(node);
        const transform = `translate(${x}, ${y})`;
      }
    },
  });
  results.push(safeSmall);

  // Compare small dataset
  comparisons.push(compareBenchmarks(directSmall, safeSmall));

  // Test scenario 2: Basic coordinate access (large dataset)
  const nodes10000 = generateTestNodes(10000);

  // Direct access test (large)
  const directLarge = runBenchmark({
    name: 'Direct Access (10000 nodes)',
    description: 'Direct property access on 10000 nodes',
    iterations: 100,
    testFn: () => {
      for (const node of nodes10000) {
        const x = node.x || 0;
        const y = node.y || 0;
        const transform = `translate(${x}, ${y})`;
      }
    },
  });
  results.push(directLarge);

  // Safe access test (large)
  const safeLarge = runBenchmark({
    name: 'Safe Access (10000 nodes)',
    description: 'Type-safe accessor functions on 10000 nodes',
    iterations: 100,
    testFn: () => {
      for (const node of nodes10000) {
        const x = d3Accessors.getX(node);
        const y = d3Accessors.getY(node);
        const transform = `translate(${x}, ${y})`;
      }
    },
  });
  results.push(safeLarge);

  // Compare large dataset
  comparisons.push(compareBenchmarks(directLarge, safeLarge));

  // Test scenario 3: Simulation tick function (realistic scenario)
  const simulationNodes = generateTestNodes(500);

  // Direct access simulation test
  const directSim = runBenchmark({
    name: 'Direct Access Simulation',
    description: 'Simulation tick function with direct property access',
    iterations: 1000,
    testFn: () => {
      // Simulate a D3 force simulation tick
      for (let i = 0; i < simulationNodes.length; i++) {
        const d = simulationNodes[i];
        // Direct property access with manual null checking
        const x = d.x !== undefined ? d.x : 0;
        const y = d.y !== undefined ? d.y : 0;

        // Apply force simulation logic (simplified)
        const vx = d.vx || 0;
        const vy = d.vy || 0;
        d.x = x + vx * 0.1;
        d.y = y + vy * 0.1;

        // Constrain to bounds
        if (d.x! < 0) d.x = 0;
        if (d.x! > 500) d.x = 500;
        if (d.y! < 0) d.y = 0;
        if (d.y! > 500) d.y = 500;
      }
    },
  });
  results.push(directSim);

  // Safe access simulation test
  const safeSim = runBenchmark({
    name: 'Safe Access Simulation',
    description: 'Simulation tick function with type-safe accessors',
    iterations: 1000,
    testFn: () => {
      // Simulate a D3 force simulation tick
      for (let i = 0; i < simulationNodes.length; i++) {
        const d = simulationNodes[i];
        // Safe accessor functions
        const x = d3Accessors.getX(d);
        const y = d3Accessors.getY(d);

        // Apply force simulation logic (simplified)
        const vx = d.vx || 0;
        const vy = d.vy || 0;
        d.x = x + vx * 0.1;
        d.y = y + vy * 0.1;

        // Constrain to bounds (type-safe version still needs non-null assertion for assignment)
        if (d.x! < 0) d.x = 0;
        if (d.x! > 500) d.x = 500;
        if (d.y! < 0) d.y = 0;
        if (d.y! > 500) d.y = 500;
      }
    },
  });
  results.push(safeSim);

  // Compare simulation tests
  comparisons.push(compareBenchmarks(directSim, safeSim));

  return { results, comparisons };
}

/**
 * Generate a comprehensive benchmark report
 */
export function generateBenchmarkReport(): string {
  const { results, comparisons } = runComprehensiveBenchmarks();

  let report = `
# D3 Accessor Performance Benchmark Report
Generated: ${new Date().toISOString()}

## Summary
This report compares the performance of type-safe accessors versus direct property access
in D3 visualizations across different scenarios and data sizes.

## Results
`;

  // Add individual results
  results.forEach(result => {
    report += `\n### ${result.name}\n`;
    report += formatBenchmarkResult(result) + '\n';
  });

  // Add comparisons
  report += `\n## Comparisons\n`;
  comparisons.forEach(comparison => {
    report += `\n${formatBenchmarkComparison(comparison)}\n`;
  });

  // Add recommendations
  report += `
## Recommendations
`;

  // Determine if type-safe accessors have a significant performance impact
  const hasSignificantImpact = comparisons.some(
    comp => comp.isSignificant && comp.percentageDifference > 0
  );

  if (hasSignificantImpact) {
    report += `
- Type-safe accessors show a measurable performance impact in some scenarios
- Consider implementing optimizations such as memoization for performance-critical sections
- Evaluate usage patterns to determine where direct access might be necessary
`;
  } else {
    report += `
- Type-safe accessors show minimal performance impact across tested scenarios
- Continue using type-safe accessors for improved code safety and maintainability
- No need for extensive optimization at this time
`;
  }

  return report;
}

/**
 * Run all benchmarks and output results to console
 */
export function runAndLogBenchmarks(): void {
  console.log('Running D3 Accessor Benchmarks...');

  const report = generateBenchmarkReport();
  console.log(report);

  console.log('Benchmark complete.');
}

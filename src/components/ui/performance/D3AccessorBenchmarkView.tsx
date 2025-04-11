import * as React from 'react';
import { useState } from 'react';
import {
  benchmarkAccessors,
  BenchmarkComparison,
  BenchmarkResult,
  runComprehensiveBenchmarks,
} from '../../../utils/performance/D3AccessorBenchmark';

/**
 * Component to display and run D3 accessor benchmarks
 */
const D3AccessorBenchmarkView: React.FC = () => {
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [benchmarkComparisons, setBenchmarkComparisons] = useState<BenchmarkComparison[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [nodeCounts, setNodeCounts] = useState([100, 1000, 10000]);
  const [iterations, setIterations] = useState(1000);
  const [selectedTest, setSelectedTest] = useState<'quick' | 'comprehensive'>('quick');

  /**
   * Run a custom benchmark with specified node count and iterations
   */
  const runCustomBenchmark = async () => {
    setIsRunning(true);

    try {
      // Clear previous results
      setBenchmarkResults([]);
      setBenchmarkComparisons([]);

      // Run benchmarks for each node count (async to prevent blocking UI)
      const comparisons: BenchmarkComparison[] = [];
      for (const nodeCount of nodeCounts) {
        // Use setTimeout to allow UI updates between tests
        await new Promise(resolve => {
          setTimeout(() => {
            const comparison = benchmarkAccessors(nodeCount, iterations);
            comparisons.push(comparison);
            resolve(null);
          }, 0);
        });
      }

      setBenchmarkComparisons(comparisons);
      setHasResults(true);
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Run comprehensive benchmarks across multiple scenarios
   */
  const runComprehensiveBenchmarkSuite = async () => {
    setIsRunning(true);

    try {
      // Clear previous results
      setBenchmarkResults([]);
      setBenchmarkComparisons([]);

      // Run comprehensive benchmarks (wrapped in setTimeout to prevent UI freezing)
      await new Promise(resolve => {
        setTimeout(() => {
          const { results, comparisons } = runComprehensiveBenchmarks();
          setBenchmarkResults(results);
          setBenchmarkComparisons(comparisons);
          setHasResults(true);
          resolve(null);
        }, 0);
      });
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Run the selected benchmark
   */
  const runBenchmark = () => {
    if (selectedTest === 'quick') {
      runCustomBenchmark();
    } else {
      runComprehensiveBenchmarkSuite();
    }
  };

  /**
   * Get a color based on performance difference
   */
  const getDifferenceColor = (difference: number): string => {
    if (Math.abs(difference) < 5) return 'text-blue-500'; // Not significant
    if (difference > 0) return 'text-red-500'; // Slower
    return 'text-green-500'; // Faster
  };

  /**
   * Generate a chart showing performance comparison
   */
  const renderComparisonChart = () => {
    if (benchmarkComparisons.length === 0) return null;

    const maxPercentage = Math.max(
      ...benchmarkComparisons.map(c => Math.abs(c.percentageDifference))
    );
    const chartMax = Math.min(maxPercentage * 1.2, 100); // Limit to 100% max

    return (
      <div className="mt-6 mb-8">
        <h3 className="mb-3 text-lg font-semibold">Performance Comparison Chart</h3>
        <div className="rounded bg-gray-100 p-4">
          {benchmarkComparisons.map((comparison, index) => {
            const barWidth = (Math.abs(comparison.percentageDifference) / chartMax) * 100;
            const barColor = comparison.percentageDifference > 0 ? 'bg-red-500' : 'bg-green-500';
            const barDirection = comparison.percentageDifference > 0 ? 'right' : 'left';

            return (
              <div key={index} className="mb-3">
                <div className="mb-1 flex justify-between">
                  <span>{comparison.comparison}</span>
                  <span className={getDifferenceColor(comparison.percentageDifference)}>
                    {comparison.percentageDifference > 0 ? 'Slower' : 'Faster'} by{' '}
                    {Math.abs(comparison.percentageDifference).toFixed(2)}%
                  </span>
                </div>
                <div className="relative h-6 rounded-sm bg-gray-200">
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-400"></div>
                  <div
                    className={`absolute top-0 bottom-0 ${barColor} rounded-sm`}
                    style={{
                      width: `${barWidth}%`,
                      [barDirection === 'left' ? 'right' : 'left']: '50%',
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>{chartMax.toFixed(0)}% Faster</span>
            <span>Baseline</span>
            <span>{chartMax.toFixed(0)}% Slower</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">D3 Accessor Performance Benchmark</h1>

      <div className="mb-6">
        <p className="mb-3 text-gray-700">
          This benchmark compares the performance of type-safe accessor functions versus direct
          property access in D3 visualizations. The results will help determine if there's a
          significant performance cost associated with the type safety improvements.
        </p>
      </div>

      <div className="mb-6 rounded border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-lg font-semibold">Benchmark Configuration</h2>

        <div className="mb-4">
          <label className="mb-2 block">Benchmark Type</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center">
              <input
                type="radio"
                name="benchmarkType"
                checked={selectedTest === 'quick'}
                onChange={() => setSelectedTest('quick')}
                className="mr-2"
              />
              Quick Test (Custom Parameters)
            </label>

            <label className="flex cursor-pointer items-center">
              <input
                type="radio"
                name="benchmarkType"
                checked={selectedTest === 'comprehensive'}
                onChange={() => setSelectedTest('comprehensive')}
                className="mr-2"
              />
              Comprehensive Test Suite
            </label>
          </div>
        </div>

        {selectedTest === 'quick' && (
          <>
            <div className="mb-4">
              <label className="mb-2 block">Node Counts</label>
              <div className="flex flex-wrap gap-2">
                {[100, 1000, 10000, 50000].map(count => (
                  <label key={count} className="flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={nodeCounts.includes(count)}
                      onChange={() => {
                        if (nodeCounts.includes(count)) {
                          setNodeCounts(nodeCounts.filter(c => c !== count));
                        } else {
                          setNodeCounts([...nodeCounts, count].sort((a, b) => a - b));
                        }
                      }}
                      className="mr-1"
                    />
                    {count.toLocaleString()} nodes
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block">Iterations</label>
              <select
                value={iterations}
                onChange={e => setIterations(Number(e.target.value))}
                className="rounded border border-gray-300 px-2 py-1"
              >
                <option value="100">100 iterations</option>
                <option value="1000">1,000 iterations</option>
                <option value="10000">10,000 iterations</option>
                <option value="100000">100,000 iterations</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Higher iteration counts provide more accurate results but take longer to run.
              </p>
            </div>
          </>
        )}

        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          onClick={runBenchmark}
          disabled={isRunning}
        >
          {isRunning ? 'Running Benchmark...' : 'Run Benchmark'}
        </button>
      </div>

      {isRunning && (
        <div className="my-4 rounded border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center">
            <svg className="mr-3 h-5 w-5 animate-spin text-blue-500" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Running benchmarks... This may take a few moments.</span>
          </div>
        </div>
      )}

      {hasResults && !isRunning && (
        <div className="results-container">
          <h2 className="mb-4 text-xl font-semibold">Benchmark Results</h2>

          {renderComparisonChart()}

          <div className="comparison-results mb-6">
            <h3 className="mb-2 text-lg font-semibold">Performance Comparisons</h3>
            {benchmarkComparisons.map((comparison, index) => (
              <div key={index} className="mb-4 rounded border border-gray-200 bg-gray-50 p-3">
                <h4 className="font-medium">
                  {comparison.comparison} vs {comparison.baseline}
                </h4>
                <p className={`mt-1 ${getDifferenceColor(comparison.percentageDifference)}`}>
                  {comparison.percentageDifference > 0 ? 'Slower' : 'Faster'} by{' '}
                  <strong>{Math.abs(comparison.percentageDifference).toFixed(2)}%</strong> (
                  {Math.abs(comparison.absoluteDifferenceMs).toFixed(6)} ms per operation)
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {comparison.isSignificant
                    ? 'This is a statistically significant difference.'
                    : 'This difference is not statistically significant.'}
                </p>
              </div>
            ))}
          </div>

          {benchmarkResults.length > 0 && (
            <div className="detailed-results mb-6">
              <h3 className="mb-2 text-lg font-semibold">Detailed Results</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Test</th>
                      <th className="border p-2">Iterations</th>
                      <th className="border p-2">Avg. Time (ms)</th>
                      <th className="border p-2">Median Time (ms)</th>
                      <th className="border p-2">Total Time (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkResults.map((result, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border p-2 font-medium">{result?.name}</td>
                        <td className="border p-2 text-right">
                          {result?.iterations.toLocaleString()}
                        </td>
                        <td className="border p-2 text-right">
                          {result?.averageTimeMs.toFixed(6)}
                        </td>
                        <td className="border p-2 text-right">{result?.medianTimeMs.toFixed(6)}</td>
                        <td className="border p-2 text-right">{result?.totalTimeMs.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="conclusions mb-6 rounded border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 text-lg font-semibold">Conclusions</h3>
            {benchmarkComparisons.some(
              comp => comp.isSignificant && comp.percentageDifference > 5
            ) ? (
              <div>
                <p className="mb-2">
                  <strong className="text-red-600">Performance Impact Detected:</strong> Type-safe
                  accessors show a measurable performance impact in some scenarios.
                </p>
                <p className="mb-1">
                  <strong>Recommendations:</strong>
                </p>
                <ul className="list-disc pl-6">
                  <li>
                    Consider implementing memoization for accessor results in performance-critical
                    code paths
                  </li>
                  <li>
                    For high-frequency operations (e.g., inner simulation loops), evaluate using
                    direct access with explicit type checking
                  </li>
                  <li>Further benchmarking should focus on specific application scenarios</li>
                </ul>
              </div>
            ) : (
              <div>
                <p className="mb-2">
                  <strong className="text-green-600">Minimal Performance Impact:</strong> Type-safe
                  accessors show negligible or acceptable performance differences compared to direct
                  property access.
                </p>
                <p className="mb-1">
                  <strong>Recommendations:</strong>
                </p>
                <ul className="list-disc pl-6">
                  <li>
                    Continue using type-safe accessors for improved code safety and maintainability
                  </li>
                  <li>No immediate optimization needed for accessor patterns</li>
                  <li>Further performance improvements should focus on other areas</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default D3AccessorBenchmarkView;

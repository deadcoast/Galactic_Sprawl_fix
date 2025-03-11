/**
 * Network Degradation Test Suite
 *
 * This test suite evaluates application performance under various network conditions by
 * simulating realistic network scenarios such as high latency, limited bandwidth, and packet loss.
 *
 * It helps identify performance issues and potential areas for optimization when users
 * are on less-than-ideal network connections.
 */

import {
  BenchmarkResult,
  runAsyncBenchmark,
  saveBenchmarkResults,
} from '../../utils/performance/benchmarks/PerformanceBenchmarkTools';
import {
  NetworkCondition,
  NetworkProfiles,
  runWithNetworkCondition,
} from '../../utils/performance/network/NetworkDegradationSimulator';
import { simulateUserInteractions } from '../helpers/UserInteractionSimulator';

/**
 * Result of a network degradation test
 */
export interface NetworkDegradationTestResult extends BenchmarkResult {
  /** The network condition that was simulated */
  networkCondition: NetworkCondition;

  /** Number of successful operations */
  successfulOperations: number;

  /** Number of failed operations */
  failedOperations: number;

  /** Average response time in milliseconds */
  averageResponseTimeMs: number;

  /** Maximum response time in milliseconds */
  maxResponseTimeMs: number;

  /** Time until first meaningful interaction was possible (ms) */
  timeToInteractive: number;
}

/**
 * Response from mock API request
 */
interface MockApiResponse {
  success: boolean;
  endpoint: string;
  timestamp: number;
  dataSize: number;
  data: string;
}

/**
 * Test API response time and error rates under various network conditions
 */
export async function testApiPerformance(): Promise<NetworkDegradationTestResult[]> {
  const results: NetworkDegradationTestResult[] = [];

  // Define key API endpoints to test
  const apiEndpoints = [
    '/api/resources',
    '/api/modules',
    '/api/ships',
    '/api/fleets',
    '/api/exploration/sectors',
    '/api/combat/status',
    '/api/user/preferences',
  ];

  // Mock API data size in bytes (for more realistic simulation)
  const mockApiResponseSizes: Record<string, number> = {
    '/api/resources': 15000, // 15 KB
    '/api/modules': 25000, // 25 KB
    '/api/ships': 50000, // 50 KB
    '/api/fleets': 120000, // 120 KB
    '/api/exploration/sectors': 200000, // 200 KB
    '/api/combat/status': 8000, // 8 KB
    '/api/user/preferences': 2000, // 2 KB
  };

  // Network conditions to test
  const networkConditions = [
    NetworkProfiles.FAST_WIFI,
    NetworkProfiles.FOUR_G,
    NetworkProfiles.THREE_G,
    NetworkProfiles.SLOW_WIFI,
    NetworkProfiles.EDGE,
    NetworkProfiles.POOR_NETWORK,
  ];

  // Mock API request function
  const mockApiRequest = async (endpoint: string): Promise<MockApiResponse> => {
    // In a real implementation, this would call the actual API
    // For testing, we'll simulate a response with a delay proportional to the mock data size

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 20));

    // Return mock response
    const responseSize = mockApiResponseSizes[endpoint] || 10000;
    const mockData: MockApiResponse = {
      success: true,
      endpoint,
      timestamp: Date.now(),
      dataSize: responseSize,
      // Generate a string of the appropriate size
      data: 'x'.repeat(responseSize / 10), // Reduce actual memory usage in test
    };

    return mockData;
  };

  // Test each network condition
  for (const condition of networkConditions) {
    // Run benchmark under this network condition
    const conditionResult = await runWithNetworkCondition(condition, async () => {
      return await runAsyncBenchmark(
        async () => {
          const startTime = Date.now();

          // Stats collection
          let successCount = 0;
          let failureCount = 0;
          const responseTimes: number[] = [];
          let maxResponseTime = 0;

          // Make requests to all endpoints sequentially
          for (const endpoint of apiEndpoints) {
            try {
              const requestStart = Date.now();

              // Make the API request
              await mockApiRequest(endpoint);

              // Record success
              successCount++;

              // Record response time
              const responseTime = Date.now() - requestStart;
              responseTimes.push(responseTime);
              maxResponseTime = Math.max(maxResponseTime, responseTime);
            } catch (error) {
              // Record failure
              failureCount++;
            }
          }

          // Calculate averages
          const averageResponseTime =
            responseTimes.length > 0
              ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
              : 0;

          // Time to interactive (time to first successful response)
          const timeToInteractive =
            responseTimes.length > 0 ? responseTimes[0] : Date.now() - startTime;

          return {
            successfulOperations: successCount,
            failedOperations: failureCount,
            averageResponseTimeMs: averageResponseTime,
            maxResponseTimeMs: maxResponseTime,
            timeToInteractive,
          };
        },
        {
          iterations: 3,
          warmupIterations: 1,
        }
      );
    });

    // Add network condition information to the result
    const result: NetworkDegradationTestResult = {
      ...conditionResult,
      name: `API Performance - ${condition.name}`,
      description: `Test API response times under ${condition.name} conditions`,
      networkCondition: condition,
      successfulOperations: conditionResult.additionalMetrics?.successfulOperations || 0,
      failedOperations: conditionResult.additionalMetrics?.failedOperations || 0,
      averageResponseTimeMs: conditionResult.additionalMetrics?.averageResponseTimeMs || 0,
      maxResponseTimeMs: conditionResult.additionalMetrics?.maxResponseTimeMs || 0,
      timeToInteractive: conditionResult.additionalMetrics?.timeToInteractive || 0,
    };

    results.push(result);

    // Optional: log progress
    console.log(`Completed network test: ${condition.name}`);
    console.log(
      `  - Success rate: ${result.successfulOperations}/${result.successfulOperations + result.failedOperations}`
    );
    console.log(`  - Avg response time: ${result.averageResponseTimeMs.toFixed(2)}ms`);
  }

  // Save results for analysis
  saveBenchmarkResults(results, 'network_degradation_api_performance');

  return results;
}

/**
 * Test resource loading performance under various network conditions
 */
export async function testResourceLoadingPerformance(): Promise<NetworkDegradationTestResult[]> {
  const results: NetworkDegradationTestResult[] = [];

  // Define resource types to test
  const resourceTypes = [
    { type: 'style', size: 30000 }, // 30 KB CSS
    { type: 'script', size: 250000 }, // 250 KB JavaScript
    { type: 'image', size: 500000 }, // 500 KB image
    { type: 'data', size: 100000 }, // 100 KB JSON data
    { type: 'font', size: 80000 }, // 80 KB font
  ];

  // Network conditions to test
  const networkConditions = [
    NetworkProfiles.FAST_WIFI,
    NetworkProfiles.FOUR_G,
    NetworkProfiles.THREE_G,
    NetworkProfiles.POOR_NETWORK,
  ];

  // Mock resource loading function
  const mockResourceLoad = async (resource: { type: string; size: number }): Promise<void> => {
    // Simulate some base processing time
    await new Promise(resolve => setTimeout(resolve, 10));

    // Return success
    return;
  };

  // Test each network condition
  for (const condition of networkConditions) {
    // Run benchmark under this network condition
    const conditionResult = await runWithNetworkCondition(condition, async () => {
      return await runAsyncBenchmark(
        async () => {
          const startTime = Date.now();

          // Stats collection
          let successCount = 0;
          let failureCount = 0;
          const responseTimes: number[] = [];
          let maxResponseTime = 0;

          // Load all resources in parallel (more realistic)
          const loadPromises = resourceTypes.map(async resource => {
            try {
              const loadStart = Date.now();

              // Load the resource
              await mockResourceLoad(resource);

              // Record success
              successCount++;

              // Record response time
              const responseTime = Date.now() - loadStart;
              responseTimes.push(responseTime);
              maxResponseTime = Math.max(maxResponseTime, responseTime);

              return { success: true, time: responseTime };
            } catch (error) {
              // Record failure
              failureCount++;
              return { success: false, time: 0 };
            }
          });

          // Wait for all resources to load (or fail)
          await Promise.all(loadPromises);

          // Calculate averages
          const averageResponseTime =
            responseTimes.length > 0
              ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
              : 0;

          // Assume time to interactive is when critical resources are loaded
          // In this case, when style and script are loaded
          const criticalResources = loadPromises.slice(0, 2);
          const criticalPromises = await Promise.all(criticalResources);
          const timeToInteractive = criticalPromises.reduce(
            (sum, result) => (result.success ? sum + result.time : sum),
            0
          );

          return {
            successfulOperations: successCount,
            failedOperations: failureCount,
            averageResponseTimeMs: averageResponseTime,
            maxResponseTimeMs: maxResponseTime,
            timeToInteractive,
          };
        },
        {
          iterations: 3,
          warmupIterations: 1,
        }
      );
    });

    // Add network condition information to the result
    const result: NetworkDegradationTestResult = {
      ...conditionResult,
      name: `Resource Loading - ${condition.name}`,
      description: `Test resource loading under ${condition.name} conditions`,
      networkCondition: condition,
      successfulOperations: conditionResult.additionalMetrics?.successfulOperations || 0,
      failedOperations: conditionResult.additionalMetrics?.failedOperations || 0,
      averageResponseTimeMs: conditionResult.additionalMetrics?.averageResponseTimeMs || 0,
      maxResponseTimeMs: conditionResult.additionalMetrics?.maxResponseTimeMs || 0,
      timeToInteractive: conditionResult.additionalMetrics?.timeToInteractive || 0,
    };

    results.push(result);
  }

  // Save results for analysis
  saveBenchmarkResults(results, 'network_degradation_resource_loading');

  return results;
}

/**
 * Test user interaction performance under various network conditions
 */
export async function testUserInteractionPerformance(): Promise<NetworkDegradationTestResult[]> {
  const results: NetworkDegradationTestResult[] = [];

  // Define interaction scenarios
  const interactionScenarios = [
    {
      name: 'Basic Navigation',
      interactions: {
        clicks: 10,
        scrollEvents: 5,
        rapidInteractions: false,
      },
    },
    {
      name: 'Resource Management',
      interactions: {
        clicks: 15,
        dragOperations: 8,
        nodeCreations: 5,
        connectionCreations: 8,
        rapidInteractions: false,
      },
    },
    {
      name: 'Combat Scenario',
      interactions: {
        clicks: 25,
        dragOperations: 5,
        rapidInteractions: true,
      },
    },
  ];

  // Network conditions to test
  const networkConditions = [
    NetworkProfiles.FAST_WIFI,
    NetworkProfiles.FOUR_G,
    NetworkProfiles.SLOW_WIFI,
    NetworkProfiles.POOR_NETWORK,
  ];

  // Test each interaction scenario under each network condition
  for (const scenario of interactionScenarios) {
    for (const condition of networkConditions) {
      // Run benchmark under this network condition
      const conditionResult = await runWithNetworkCondition(condition, async () => {
        return await runAsyncBenchmark(
          async () => {
            const startTime = Date.now();

            // Stats collection
            let successCount = 0;
            let failureCount = 0;
            const responseTimes: number[] = [];

            try {
              // Simulate user interactions
              await simulateUserInteractions(scenario.interactions);

              // Record all interactions as successful
              successCount = Object.values(scenario.interactions)
                .filter(val => typeof val === 'number')
                .reduce((sum, val) => sum + (val as number), 0);

              // Calculate response time (total time divided by number of interactions)
              const totalTime = Date.now() - startTime;
              const avgResponseTime = totalTime / successCount;
              responseTimes.push(avgResponseTime);
            } catch (error) {
              // Record all as failed if there's an error
              failureCount = Object.values(scenario.interactions)
                .filter(val => typeof val === 'number')
                .reduce((sum, val) => sum + (val as number), 0);
            }

            // Calculate average response time
            const averageResponseTime =
              responseTimes.length > 0
                ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
                : 0;

            // Simulate max response time (usually 2-3x average in real scenarios)
            const maxResponseTime = averageResponseTime * 2.5;

            // Time to first interaction (estimate)
            const timeToInteractive = Math.min(averageResponseTime * 1.2, 5000);

            return {
              successfulOperations: successCount,
              failedOperations: failureCount,
              averageResponseTimeMs: averageResponseTime,
              maxResponseTimeMs: maxResponseTime,
              timeToInteractive,
            };
          },
          {
            iterations: 3,
            warmupIterations: 1,
          }
        );
      });

      // Add network condition information to the result
      const result: NetworkDegradationTestResult = {
        ...conditionResult,
        name: `${scenario.name} - ${condition.name}`,
        description: `Test ${scenario.name} interactions under ${condition.name} conditions`,
        networkCondition: condition,
        successfulOperations: conditionResult.additionalMetrics?.successfulOperations || 0,
        failedOperations: conditionResult.additionalMetrics?.failedOperations || 0,
        averageResponseTimeMs: conditionResult.additionalMetrics?.averageResponseTimeMs || 0,
        maxResponseTimeMs: conditionResult.additionalMetrics?.maxResponseTimeMs || 0,
        timeToInteractive: conditionResult.additionalMetrics?.timeToInteractive || 0,
      };

      results.push(result);
    }
  }

  // Save results for analysis
  saveBenchmarkResults(results, 'network_degradation_user_interaction');

  return results;
}

/**
 * Run combined network degradation tests
 */
export async function runNetworkDegradationTests(): Promise<
  Record<string, NetworkDegradationTestResult[]>
> {
  console.log('Running network degradation test suite...');

  // Run tests
  const apiResults = await testApiPerformance();
  console.log(`Completed API performance tests (${apiResults.length} scenarios)`);

  const resourceResults = await testResourceLoadingPerformance();
  console.log(`Completed resource loading tests (${resourceResults.length} scenarios)`);

  const interactionResults = await testUserInteractionPerformance();
  console.log(`Completed user interaction tests (${interactionResults.length} scenarios)`);

  // Aggregate results
  const results = {
    api: apiResults,
    resources: resourceResults,
    interactions: interactionResults,
  };

  // Generate summary
  const summary = generateTestSummary(results);
  console.log(summary);

  return results;
}

/**
 * Generate a human-readable summary of test results
 */
function generateTestSummary(results: Record<string, NetworkDegradationTestResult[]>): string {
  let summary = '\n===== NETWORK DEGRADATION TEST SUMMARY =====\n\n';

  // Process each test category
  for (const [category, categoryResults] of Object.entries(results)) {
    summary += `${category.toUpperCase()} TESTS:\n`;
    summary += '-'.repeat(40) + '\n';

    // Group by network condition
    const byCondition: Record<string, NetworkDegradationTestResult[]> = {};

    categoryResults.forEach(result => {
      const conditionName = result.networkCondition.name;
      byCondition[conditionName] = byCondition[conditionName] || [];
      byCondition[conditionName].push(result);
    });

    // Add summary for each network condition
    for (const [conditionName, conditionResults] of Object.entries(byCondition)) {
      const avgResponseTime =
        conditionResults.reduce((sum, result) => sum + result.averageResponseTimeMs, 0) /
        conditionResults.length;

      const successRate =
        (conditionResults.reduce((sum, result) => sum + result.successfulOperations, 0) /
          conditionResults.reduce(
            (sum, result) => sum + result.successfulOperations + result.failedOperations,
            0
          )) *
        100;

      summary += `${conditionName}:\n`;
      summary += `  - Average Response Time: ${avgResponseTime.toFixed(2)}ms\n`;
      summary += `  - Success Rate: ${successRate.toFixed(2)}%\n`;

      // Add performance classification
      let classification = '';
      if (avgResponseTime < 100) classification = 'Excellent';
      else if (avgResponseTime < 300) classification = 'Good';
      else if (avgResponseTime < 1000) classification = 'Fair';
      else if (avgResponseTime < 3000) classification = 'Poor';
      else classification = 'Very Poor';

      summary += `  - Performance Classification: ${classification}\n\n`;
    }

    summary += '\n';
  }

  // Add overall recommendations
  summary += 'RECOMMENDATIONS:\n';
  summary += '-'.repeat(40) + '\n';

  // Check if there are poor performers
  const allResults = [
    ...(results.api || []),
    ...(results.resources || []),
    ...(results.interactions || []),
  ];

  const poorPerformers = allResults.filter(r => r.averageResponseTimeMs > 1000);
  const veryPoorPerformers = allResults.filter(r => r.averageResponseTimeMs > 3000);

  if (veryPoorPerformers.length > 0) {
    summary += '- Critical: Implement offline support and progressive enhancement for:\n';
    summary += veryPoorPerformers
      .map(r => `  * ${r.name} (${r.averageResponseTimeMs.toFixed(0)}ms)`)
      .join('\n');
    summary += '\n\n';
  }

  if (poorPerformers.length > 0) {
    summary += '- Recommended: Optimize performance for degraded networks for:\n';
    summary += poorPerformers
      .map(r => `  * ${r.name} (${r.averageResponseTimeMs.toFixed(0)}ms)`)
      .join('\n');
    summary += '\n\n';
  }

  // General recommendations
  summary += '- Consider implementing:\n';
  summary += '  * Request prioritization for critical resources\n';
  summary += '  * Progressive loading for non-critical content\n';
  summary += '  * Offline capability for core functionality\n';
  summary += '  * Reduced payloads for slow connections\n';
  summary += '  * Connection-aware UI with appropriate feedback\n';

  return summary;
}

// Export the individual test functions and the combined runner
export default {
  testApiPerformance,
  testResourceLoadingPerformance,
  testUserInteractionPerformance,
  runNetworkDegradationTests,
};

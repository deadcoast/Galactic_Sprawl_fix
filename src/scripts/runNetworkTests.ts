/**
 * Network Degradation Test Suite Runner
 *
 * This script runs the network degradation test suite to evaluate application
 * performance under various network conditions. It provides command-line options
 * to run specific tests or all tests together.
 *
 * Usage:
 *   npx ts-node src/scripts/runNetworkTests.ts --all
 *   npx ts-node src/scripts/runNetworkTests.ts --api
 *   npx ts-node src/scripts/runNetworkTests.ts --resources
 *   npx ts-node src/scripts/runNetworkTests.ts --interactions
 */

import {
  NetworkDegradationTestResult,
  testApiPerformance,
  testResourceLoadingPerformance,
  testUserInteractionPerformance,
} from '../tests/performance/NetworkDegradationTestSuite';

// Parse command line arguments
const args = process.argv.slice(2);
const runAll = args.includes('--all');
const runApi = args.includes('--api') || runAll;
const runResources = args.includes('--resources') || runAll;
const runInteractions = args.includes('--interactions') || runAll;
const generateReport = args.includes('--report') || runAll;

// Define a function to format duration
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}

// Function to print a result table
function printResultTable(results: NetworkDegradationTestResult[], title: string): void {
  console.log(`\n${title}`);
  console.log('-'.repeat(100));
  console.log(
    '| Network Condition       | Avg Response Time | Max Response Time | Success Rate | TTI        |'
  );
  console.log(
    '|-------------------------|-------------------|-------------------|--------------|------------|'
  );

  // Group results by network condition
  const groupedResults: Record<string, NetworkDegradationTestResult[]> = {};
  results.forEach(result => {
    const conditionName = result.networkCondition.name;
    groupedResults[conditionName] = groupedResults[conditionName] || [];
    groupedResults[conditionName].push(result);
  });

  // Sort network conditions by average response time (ascending)
  const sortedConditions = Object.entries(groupedResults)
    .map(([condition, results]) => {
      const avgResponseTime =
        results.reduce((sum, r) => sum + r.averageResponseTimeMs, 0) / results.length;

      return { condition, avgResponseTime };
    })
    .sort((a, b) => a.avgResponseTime - b.avgResponseTime);

  // Print each condition's results
  for (const { condition } of sortedConditions) {
    const condResults = groupedResults[condition];
    const avgResponseTime =
      condResults.reduce((sum, r) => sum + r.averageResponseTimeMs, 0) / condResults.length;

    const maxResponseTime = Math.max(...condResults.map(r => r.maxResponseTimeMs));

    const successCount = condResults.reduce((sum, r) => sum + r.successfulOperations, 0);

    const totalOps = successCount + condResults.reduce((sum, r) => sum + r.failedOperations, 0);

    const successRate = totalOps > 0 ? (successCount / totalOps) * 100 : 0;

    const avgTTI =
      condResults.reduce((sum, r) => sum + r.timeToInteractive, 0) / condResults.length;

    // Print the row
    console.log(
      `| %-23s | %-17s | %-17s | %-12s | %-10s |`.replace(/%(-?\d+)s/g, (match, width) => {
        const paddingLength = parseInt(width.replace('-', ''));
        const text = [
          condition.padEnd(23),
          formatDuration(avgResponseTime).padEnd(17),
          formatDuration(maxResponseTime).padEnd(17),
          `${successRate.toFixed(1)}%`.padEnd(12),
          formatDuration(avgTTI).padEnd(10),
        ][0];
        return width.startsWith('-') ? text.padEnd(paddingLength) : text.padStart(paddingLength);
      })
    );
  }

  console.log('-'.repeat(100));
}

// Function to generate a full HTML report
function generateHtmlReport(results: Record<string, NetworkDegradationTestResult[]>): void {
  // Implementation for generating a detailed HTML report
  // (This would be a more extensive implementation in the real system)
  console.log('\nGenerating HTML report...');
  console.log('HTML report generation not implemented in this demo script.');
}

async function main(): Promise<void> {
  console.log('Network Degradation Test Suite Runner');
  console.log('====================================\n');

  const startTime = Date.now();
  const results: Record<string, NetworkDegradationTestResult[]> = {};

  if (runApi) {
    console.log('Running API performance tests...');
    results.api = await testApiPerformance();
    printResultTable(results.api, 'API Performance Results');
  }

  if (runResources) {
    console.log('\nRunning resource loading performance tests...');
    results.resources = await testResourceLoadingPerformance();
    printResultTable(results.resources, 'Resource Loading Performance Results');
  }

  if (runInteractions) {
    console.log('\nRunning user interaction performance tests...');
    results.interactions = await testUserInteractionPerformance();
    printResultTable(results.interactions, 'User Interaction Performance Results');
  }

  // Print overall time
  const totalTime = Date.now() - startTime;
  console.log(`\nCompleted all tests in ${formatDuration(totalTime)}`);

  // Generate report if requested
  if (generateReport) {
    generateHtmlReport(results);
  }

  // Print usage instructions if no arguments provided
  if (!runAll && !runApi && !runResources && !runInteractions) {
    console.log('\nUsage:');
    console.log('  npx ts-node src/scripts/runNetworkTests.ts --all         Run all tests');
    console.log(
      '  npx ts-node src/scripts/runNetworkTests.ts --api         Run API performance tests'
    );
    console.log(
      '  npx ts-node src/scripts/runNetworkTests.ts --resources   Run resource loading tests'
    );
    console.log(
      '  npx ts-node src/scripts/runNetworkTests.ts --interactions Run user interaction tests'
    );
    console.log('  npx ts-node src/scripts/runNetworkTests.ts --report      Generate HTML report');
  }
}

// Run the main function
main().catch(error => {
  console.error('Error running network tests:', error);
  process.exit(1);
});

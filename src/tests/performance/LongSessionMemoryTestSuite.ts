/**
 * LongSessionMemoryTestSuite
 *
 * This test suite evaluates application performance over extended usage sessions.
 * It helps identify memory leaks and gradual performance degradation that only
 * become apparent with prolonged application use.
 */

import {
  BenchmarkResult,
  saveBenchmarkResults,
} from '../../utils/performance/benchmarks/PerformanceBenchmarkTools';
import {
  LongSessionMemoryTracker,
  MemorySnapshot,
  MemoryTrendAnalysis,
} from '../../utils/performance/longsession/LongSessionMemoryTracker';

/**
 * Result of a long session memory test
 */
export interface LongSessionMemoryResult extends BenchmarkResult {
  /** Test duration in milliseconds */
  durationMs: number;

  /** Number of snapshots taken */
  snapshotCount: number;

  /** Initial memory usage in MB */
  initialMemoryMB: number;

  /** Final memory usage in MB */
  finalMemoryMB: number;

  /** Memory growth rate in MB per hour */
  memoryGrowthRateMBPerHour: number;

  /** Whether a memory leak was detected */
  leakDetected: boolean;

  /** Leak severity if detected (1-5) */
  leakSeverity?: number;

  /** Test parameters */
  parameters: Record<string, unknown>;

  /** All memory snapshots taken during the test */
  snapshots: MemorySnapshot[];

  /** Memory trend analysis result */
  analysis?: MemoryTrendAnalysis;
}

/**
 * Options for long session memory tests
 */
export interface LongSessionMemoryTestOptions {
  /** Test duration in milliseconds */
  durationMs?: number;

  /** Interval between memory snapshots in milliseconds */
  snapshotIntervalMs?: number;

  /** Memory leak threshold in MB per minute */
  leakThresholdMBPerMinute?: number;

  /** Whether to track DOM nodes */
  trackDomNodes?: boolean;

  /** Whether to induce memory leaks for testing leak detection */
  induceMemoryLeak?: boolean;

  /** Memory leak rate to induce (MB per minute) */
  memoryLeakRateMBPerMinute?: number;

  /** Whether to simulate user actions during the test */
  simulateUserActions?: boolean;

  /** User action simulation interval in milliseconds */
  userActionIntervalMs?: number;

  /** Array functions to execute to generate memory allocations */
  simulationFunctions?: Array<() => void>;
}

/**
 * Test suite for long session memory tracking
 */
export class LongSessionMemoryTestSuite {
  private memoryTracker: LongSessionMemoryTracker;
  private testOptions: LongSessionMemoryTestOptions;
  private simulationIntervalId: number | null = null;
  private userActionIntervalId: number | null = null;
  private testStartTime: number = 0;
  private testResults: LongSessionMemoryResult | null = null;
  private memoryLeakObjects: unknown[] = [];
  private isRunningTest = false;
  private leakDetectedHandler: ((analysis: MemoryTrendAnalysis) => void) | null = null;

  /**
   * Create a new long session memory test suite
   */
  constructor(options: LongSessionMemoryTestOptions = {}) {
    this.testOptions = {
      durationMs: 60 * 60 * 1000, // Default: 1 hour
      snapshotIntervalMs: 60 * 1000, // Default: 1 minute
      leakThresholdMBPerMinute: 0.5,
      trackDomNodes: true,
      induceMemoryLeak: false,
      memoryLeakRateMBPerMinute: 1,
      simulateUserActions: true,
      userActionIntervalMs: 5000,
      simulationFunctions: [],
      ...options,
    };

    // Create memory tracker with appropriate configuration
    this.memoryTracker = new LongSessionMemoryTracker({
      snapshotIntervalMs: this.testOptions.snapshotIntervalMs,
      trackDomNodes: this.testOptions.trackDomNodes,
      leakThresholdMBPerMinute: this.testOptions.leakThresholdMBPerMinute,
      reportToEventBus: false, // Don't report to event bus during tests
      loggingLevel: 2,
    });
  }

  /**
   * Run a long session memory test with the configured options
   * @returns Promise resolving to test results
   */
  public async runTest(): Promise<LongSessionMemoryResult> {
    if (this.isRunningTest) {
      throw new Error('A test is already running');
    }

    this.isRunningTest = true;
    this.testStartTime = Date.now();
    this.memoryLeakObjects = [];

    console.log(
      `Starting long session memory test (${this.formatDuration(this.testOptions.durationMs!)})`
    );

    // Set up leak detection handler
    this.leakDetectedHandler = (analysis: MemoryTrendAnalysis) => {
      console.warn(
        `Memory leak detected during test! Growth rate: ${analysis.growthRatePerMinute.toFixed(2)} MB/min, Severity: ${analysis.leakSeverity}`
      );
    };

    // Start memory tracking
    this.memoryTracker.startTracking();

    // Initial snapshot
    const initialSnapshot = this.memoryTracker.takeSnapshot();

    // Set up memory leak simulation if enabled
    if (this.testOptions.induceMemoryLeak) {
      this.startMemoryLeakSimulation();
    }

    // Set up user action simulation if enabled
    if (this.testOptions.simulateUserActions) {
      this.startUserActionSimulation();
    }

    // Wait for the test duration
    await new Promise<void>(resolve => {
      const timeoutId = setTimeout(() => {
        // Clean up and resolve
        this.stopTest();
        resolve();
      }, this.testOptions.durationMs);

      // Add to interval cleanup if test is terminated early
      if (this.simulationIntervalId === null) {
        this.simulationIntervalId = timeoutId as unknown as number;
      }
    });

    // Gather final results if test wasn't already stopped
    if (this.isRunningTest) {
      return this.createTestResults();
    }

    return this.testResults!;
  }

  /**
   * Run a memory leak detection test with a simulated leak
   */
  public async runMemoryLeakDetectionTest(
    leakRateMBPerMinute: number = 2,
    durationMs: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<LongSessionMemoryResult> {
    // Configure test for leak detection
    this.testOptions.induceMemoryLeak = true;
    this.testOptions.memoryLeakRateMBPerMinute = leakRateMBPerMinute;
    this.testOptions.durationMs = durationMs;
    this.testOptions.snapshotIntervalMs = 10 * 1000; // More frequent snapshots for leak detection
    this.testOptions.leakThresholdMBPerMinute = leakRateMBPerMinute / 2; // Set threshold below the leak rate

    console.log(`Starting memory leak detection test with ${leakRateMBPerMinute} MB/min leak rate`);

    // Run the test
    return this.runTest();
  }

  /**
   * Run a battery of memory tests with different configurations
   */
  public async runTestBattery(): Promise<Record<string, LongSessionMemoryResult>> {
    console.log('Starting long session memory test battery');

    const results: Record<string, LongSessionMemoryResult> = {};

    // Test 1: Baseline memory usage (short test, no leaks)
    console.log('Running baseline memory test (2 minutes)');
    this.testOptions.durationMs = 2 * 60 * 1000; // 2 minutes
    this.testOptions.induceMemoryLeak = false;
    this.testOptions.simulateUserActions = true;
    results.baseline = await this.runTest();

    // Test 2: Slow leak detection
    console.log('Running slow leak detection test (3 minutes)');
    results.slowLeak = await this.runMemoryLeakDetectionTest(0.5, 3 * 60 * 1000);

    // Test 3: Moderate leak detection
    console.log('Running moderate leak detection test (3 minutes)');
    results.moderateLeak = await this.runMemoryLeakDetectionTest(2, 3 * 60 * 1000);

    // Test 4: Severe leak detection
    console.log('Running severe leak detection test (2 minutes)');
    results.severeLeak = await this.runMemoryLeakDetectionTest(10, 2 * 60 * 1000);

    // Test 5: User activity simulation (no leaks)
    console.log('Running user activity simulation test (3 minutes)');
    this.testOptions.durationMs = 3 * 60 * 1000; // 3 minutes
    this.testOptions.induceMemoryLeak = false;
    this.testOptions.simulateUserActions = true;
    this.testOptions.userActionIntervalMs = 1000; // More frequent user actions
    results.userActivity = await this.runTest();

    // Save comprehensive report
    saveBenchmarkResults(
      Object.values(results),
      `long_session_memory_tests_${new Date().toISOString().substring(0, 10)}`
    );

    return results;
  }

  /**
   * Stop the current test
   */
  public stopTest(): void {
    if (!this.isRunningTest) return;

    // Clean up simulation intervals
    if (this.simulationIntervalId !== null) {
      clearInterval(this.simulationIntervalId);
      this.simulationIntervalId = null;
    }

    if (this.userActionIntervalId !== null) {
      clearInterval(this.userActionIntervalId);
      this.userActionIntervalId = null;
    }

    // Stop memory tracking
    this.memoryTracker.stopTracking();

    // Clear memory leak objects
    this.memoryLeakObjects = [];

    // Remove leak detection handler
    this.leakDetectedHandler = null;

    // Create test results
    this.testResults = this.createTestResults();
    this.isRunningTest = false;

    console.log(
      `Long session memory test completed. Duration: ${this.formatDuration(Date.now() - this.testStartTime)}`
    );
  }

  /**
   * Create test results from the collected data
   */
  private createTestResults(): LongSessionMemoryResult {
    const snapshots = this.memoryTracker.getSnapshots();
    const analysis = this.memoryTracker.getLatestAnalysis();
    const endTime = Date.now();

    if (snapshots.length < 2) {
      throw new Error('Not enough memory snapshots collected to generate test results');
    }

    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];

    const result: LongSessionMemoryResult = {
      name: 'Long Session Memory Test',
      description: `Memory usage analysis over ${this.formatDuration(endTime - this.testStartTime)}`,
      executionTimeMs: endTime - this.testStartTime,
      durationMs: endTime - this.testStartTime,
      snapshotCount: snapshots.length,
      initialMemoryMB: firstSnapshot.usedHeapSizeMB,
      finalMemoryMB: lastSnapshot.usedHeapSizeMB,
      memoryGrowthRateMBPerHour: analysis ? analysis.growthRatePerHour : 0,
      leakDetected: analysis ? analysis.suspectedLeak : false,
      leakSeverity: analysis?.leakSeverity,
      parameters: {
        durationMs: this.testOptions.durationMs,
        snapshotIntervalMs: this.testOptions.snapshotIntervalMs,
        leakThresholdMBPerMinute: this.testOptions.leakThresholdMBPerMinute,
        trackDomNodes: this.testOptions.trackDomNodes,
        induceMemoryLeak: this.testOptions.induceMemoryLeak,
        memoryLeakRateMBPerMinute: this.testOptions.memoryLeakRateMBPerMinute,
        simulateUserActions: this.testOptions.simulateUserActions,
      },
      timestamp: new Date(),
      snapshots,
      analysis,
    };

    return result;
  }

  /**
   * Simulate a memory leak by periodically allocating objects that aren't garbage collected
   */
  private startMemoryLeakSimulation(): void {
    if (!this.testOptions.induceMemoryLeak) return;

    const allocationIntervalMs = 1000; // Allocate memory every second

    // Calculate how much memory to leak per allocation to achieve the desired rate
    const mbPerAllocation =
      (this.testOptions.memoryLeakRateMBPerMinute! / 60) * (allocationIntervalMs / 1000);

    // Start allocation cycle
    this.simulationIntervalId = window.setInterval(() => {
      if (!this.isRunningTest) {
        clearInterval(this.simulationIntervalId!);
        this.simulationIntervalId = null;
        return;
      }

      // Allocate memory - each entry is about 1KB, so we need to allocate
      // mbPerAllocation * 1024 entries to simulate the desired leak rate
      const count = Math.floor(mbPerAllocation * 1024);

      try {
        // Create a large array and keep a reference to prevent garbage collection
        const array = new Array(count).fill(0).map(() => ({
          id: Math.random(),
          timestamp: Date.now(),
          data: new Array(10).fill(Math.random().toString(36)),
        }));

        this.memoryLeakObjects.push(array);
      } catch (e) {
        console.error('Failed to allocate memory for leak simulation:', e);
        clearInterval(this.simulationIntervalId!);
        this.simulationIntervalId = null;
      }
    }, allocationIntervalMs);
  }

  /**
   * Simulate user actions to generate realistic memory usage patterns
   */
  private startUserActionSimulation(): void {
    if (!this.testOptions.simulateUserActions) return;

    const actionTypes = [
      'scroll',
      'click',
      'input',
      'resize',
      'navigation',
      'data-load',
      'rendering',
    ];

    this.userActionIntervalId = window.setInterval(() => {
      if (!this.isRunningTest) {
        clearInterval(this.userActionIntervalId!);
        this.userActionIntervalId = null;
        return;
      }

      // Randomly select an action type
      const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];

      switch (actionType) {
        case 'scroll':
          this.simulateScrolling();
          break;
        case 'click':
          this.simulateElementInteraction();
          break;
        case 'input':
          this.simulateInputActivity();
          break;
        case 'resize':
          this.simulateResize();
          break;
        case 'navigation':
          this.simulateNavigation();
          break;
        case 'data-load':
          this.simulateDataLoading();
          break;
        case 'rendering':
          this.simulateRendering();
          break;
      }

      // Also run any custom simulation functions
      if (this.testOptions.simulationFunctions && this.testOptions.simulationFunctions.length > 0) {
        const randomFunction =
          this.testOptions.simulationFunctions[
            Math.floor(Math.random() * this.testOptions.simulationFunctions.length)
          ];

        try {
          randomFunction();
        } catch (e) {
          console.error('Error in custom simulation function:', e);
        }
      }
    }, this.testOptions.userActionIntervalMs);
  }

  /**
   * Simulate scrolling activity
   */
  private simulateScrolling(): void {
    // Create temporary div for scrolling
    const scrollDiv = document.createElement('div');
    scrollDiv.style.height = '10000px';
    scrollDiv.style.width = '100px';
    scrollDiv.style.position = 'absolute';
    scrollDiv.style.top = '-9999px';
    scrollDiv.style.left = '-9999px';
    document.body.appendChild(scrollDiv);

    // Perform some scrolling operations
    for (let i = 0; i < 100; i += 10) {
      scrollDiv.scrollTop = i * 10;
    }

    // Cleanup after a delay to allow any event handlers to fire
    setTimeout(() => {
      document.body.removeChild(scrollDiv);
    }, 100);
  }

  /**
   * Simulate element interaction (clicks, hovers)
   */
  private simulateElementInteraction(): void {
    // Create a temporary button to interact with
    const button = document.createElement('button');
    button.textContent = 'Test Button';
    button.style.position = 'absolute';
    button.style.top = '-9999px';
    button.style.left = '-9999px';

    // Add a simple event handler
    const clickHandler = () => {
      // Do something with memory
      const data = new Array(100).fill(0).map(() => Math.random());
      button.dataset.lastClick = JSON.stringify({
        time: Date.now(),
        data: data.slice(0, 5), // Store a small sample to use memory
      });
    };

    button.addEventListener('click', clickHandler);
    document.body.appendChild(button);

    // Simulate clicks
    button.click();

    // Cleanup after a delay
    setTimeout(() => {
      button.removeEventListener('click', clickHandler);
      document.body.removeChild(button);
    }, 100);
  }

  /**
   * Simulate input activity
   */
  private simulateInputActivity(): void {
    // Create a temporary input field
    const input = document.createElement('input');
    input.type = 'text';
    input.style.position = 'absolute';
    input.style.top = '-9999px';
    input.style.left = '-9999px';
    document.body.appendChild(input);

    // Generate a random string to input
    const randomText = Math.random().toString(36).substring(2);

    // Set the input value and trigger events
    input.value = randomText;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Cleanup after a delay
    setTimeout(() => {
      document.body.removeChild(input);
    }, 100);
  }

  /**
   * Simulate window resize events
   */
  private simulateResize(): void {
    // Dispatch resize events
    window.dispatchEvent(new Event('resize'));

    // Force layout recalculation
    const width = document.body.offsetWidth;
    const height = document.body.offsetHeight;

    // Do something with the values to prevent optimization
    if (width > 0 && height > 0) {
      const ratio = width / height;
      // Store in a temporary element to use memory
      const tmp = document.createElement('div');
      tmp.dataset.ratio = ratio.toString();
      document.body.appendChild(tmp);

      // Cleanup after a delay
      setTimeout(() => {
        document.body.removeChild(tmp);
      }, 100);
    }
  }

  /**
   * Simulate navigation activity
   */
  private simulateNavigation(): void {
    // Create a temporary history entry without actually navigating
    const currentUrl = window.location.href;
    const fakeUrl = `${currentUrl.split('?')[0]}?t=${Date.now()}`;

    // Use pushState to simulate navigation
    try {
      window.history.pushState({ time: Date.now() }, '', fakeUrl);

      // Revert after a delay
      setTimeout(() => {
        window.history.back();
      }, 50);
    } catch (e) {
      // Ignore errors from running in test environment
      console.log('Navigation simulation skipped in test environment');
    }
  }

  /**
   * Simulate data loading operations
   */
  private simulateDataLoading(): void {
    // Create a sample dataset
    const dataset = {
      items: new Array(100).fill(0).map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000,
        properties: {
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          size: Math.floor(Math.random() * 100),
          active: Math.random() > 0.5,
        },
      })),
    };

    // Store dataset in a temporary DOM element to simulate data binding
    const dataContainer = document.createElement('div');
    dataContainer.id = 'data-container';
    dataContainer.style.display = 'none';
    document.body.appendChild(dataContainer);

    // Simulate data processing and binding
    dataset.items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.dataset.id = item.id.toString();
      itemElement.dataset.name = item.name;
      itemElement.dataset.value = item.value.toString();
      itemElement.style.color = item.properties.color;
      dataContainer.appendChild(itemElement);
    });

    // Simulate accessing the data
    const randomItem = dataset.items[Math.floor(Math.random() * dataset.items.length)];
    dataContainer.setAttribute('data-selected', randomItem.id.toString());

    // Cleanup after a delay
    setTimeout(() => {
      document.body.removeChild(dataContainer);
    }, 200);
  }

  /**
   * Simulate rendering operations
   */
  private simulateRendering(): void {
    // Create a container for rendering simulation
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '500px';
    container.style.height = '500px';
    document.body.appendChild(container);

    // Create a number of elements to simulate a rendering operation
    const elementCount = 50;

    for (let i = 0; i < elementCount; i++) {
      const element = document.createElement('div');
      element.style.position = 'absolute';
      element.style.width = '10px';
      element.style.height = '10px';
      element.style.backgroundColor = `hsl(${i * (360 / elementCount)}, 80%, 50%)`;
      element.style.top = `${Math.random() * 490}px`;
      element.style.left = `${Math.random() * 490}px`;
      element.style.borderRadius = `${Math.random() > 0.5 ? '50%' : '0'}`;
      element.dataset.id = i.toString();
      container.appendChild(element);
    }

    // Force layout calculation
    const elements = container.querySelectorAll('div');
    elements.forEach(el => {
      el.getBoundingClientRect();
    });

    // Cleanup after a delay
    setTimeout(() => {
      document.body.removeChild(container);
    }, 200);
  }

  /**
   * Format a duration in milliseconds as a human-readable string
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Generate a report from test results
   */
  public static generateReport(
    results: LongSessionMemoryResult | Record<string, LongSessionMemoryResult>
  ): string {
    let report = '# Long Session Memory Test Report\n\n';

    if (!results) {
      return report + 'No test results available.\n';
    }

    // Process either a single result or multiple results
    const resultsArray = Array.isArray(results)
      ? results
      : Object.keys(results).length > 0
        ? Object.entries(results).map(([name, result]) => ({ ...result, testName: name }))
        : [results];

    // Add report generation time
    report += `**Generated:** ${new Date().toLocaleString()}\n\n`;

    for (const result of resultsArray) {
      const testName = 'testName' in result ? result.testName : result.name;
      report += `## ${testName}\n\n`;

      // Add test parameters
      report += '### Test Parameters\n\n';
      for (const [key, value] of Object.entries(result.parameters)) {
        report += `- **${key}:** ${value}\n`;
      }
      report += '\n';

      // Add test results
      report += '### Results\n\n';
      report += `- **Duration:** ${(result.durationMs / 1000 / 60).toFixed(2)} minutes\n`;
      report += `- **Snapshots:** ${result.snapshotCount}\n`;
      report += `- **Initial Memory:** ${result.initialMemoryMB.toFixed(2)} MB\n`;
      report += `- **Final Memory:** ${result.finalMemoryMB.toFixed(2)} MB\n`;
      report += `- **Memory Change:** ${(result.finalMemoryMB - result.initialMemoryMB).toFixed(2)} MB\n`;
      report += `- **Growth Rate:** ${result.memoryGrowthRateMBPerHour.toFixed(2)} MB/hour\n`;
      report += `- **Leak Detected:** ${result.leakDetected ? 'Yes' : 'No'}\n`;

      if (result.leakDetected && result.leakSeverity) {
        report += `- **Leak Severity:** ${result.leakSeverity} (1-5 scale)\n`;
      }

      report += '\n';

      // Add analysis if available
      if (result.analysis) {
        report += '### Analysis\n\n';
        report += `- **Confidence:** ${(result.analysis.confidence * 100).toFixed(1)}%\n`;
        report += `- **Trend:** ${result.analysis.overallTrend > 0 ? 'Increasing' : 'Decreasing'}\n`;
        report += `- **Growth Rate/Minute:** ${result.analysis.growthRatePerMinute.toFixed(3)} MB/min\n`;

        if (result.analysis.isAccelerating) {
          report += `- **Warning:** Memory growth rate is accelerating!\n`;
        }

        // Add estimated time to limit if available
        if (result.analysis.estimatedTimeToLimit < Number.POSITIVE_INFINITY) {
          const hoursToLimit = result.analysis.estimatedTimeToLimit / (1000 * 60 * 60);
          report += `- **Estimated Time to Limit:** ${hoursToLimit.toFixed(1)} hours\n`;
        }

        report += '\n';
      }

      // Add visual indicator of memory trend
      report += '### Memory Trend\n\n';
      report += '```\n';

      // Create a simple ASCII chart
      const snapshots = result.snapshots;
      if (snapshots && snapshots.length > 0) {
        const memoryValues = snapshots.map(s => s.usedHeapSizeMB);
        const minMemory = Math.min(...memoryValues);
        const maxMemory = Math.max(...memoryValues);
        const range = maxMemory - minMemory;
        const chartHeight = 10;
        const chartWidth = Math.min(50, snapshots.length);

        // Only show chart if we have a meaningful range
        if (range > 0.1) {
          // Create the chart
          for (let y = 0; y < chartHeight; y++) {
            const memoryAtThisRow = maxMemory - (y / (chartHeight - 1)) * range;
            let row =
              y === 0 || y === chartHeight - 1
                ? memoryAtThisRow.toFixed(1).padStart(6) + ' MB |'
                : '        |';

            // Add data points
            for (let x = 0; x < chartWidth; x++) {
              const snapshotIndex = Math.floor((x / chartWidth) * snapshots.length);
              const memory = snapshots[snapshotIndex].usedHeapSizeMB;
              const normalizedMemory = (memory - minMemory) / range;
              const height = normalizedMemory * (chartHeight - 1);

              row += Math.abs(chartHeight - 1 - y - height) < 0.5 ? '*' : ' ';
            }

            report += row + '\n';
          }

          // Add time axis
          report += '        +' + '-'.repeat(chartWidth) + '\n';
          report +=
            '         ' +
            '0'.padEnd(chartWidth / 2) +
            (
              (snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp) /
              (1000 * 60)
            ).toFixed(0) +
            ' min';
        } else {
          report += 'Memory usage stable - not enough variation to display chart.\n';
        }
      } else {
        report += 'Not enough data to display memory trend.\n';
      }

      report += '```\n\n';

      // Add recommendations based on results
      report += '### Recommendations\n\n';

      if (result.leakDetected) {
        report +=
          '- **Investigate memory leaks!** The test detected a significant memory growth pattern.\n';

        if (result.leakSeverity && result.leakSeverity >= 3) {
          report +=
            '- **Critical priority!** The detected leak is severe and could impact application stability.\n';
        }

        report += '- Review event listeners and ensure proper cleanup.\n';
        report += '- Check for cached objects that are not being released.\n';
        report += '- Monitor DOM element creation and removal patterns.\n';
      } else if (result.memoryGrowthRateMBPerHour > 5) {
        report +=
          '- **Monitor memory usage.** While no leak was detected, memory growth is higher than optimal.\n';
        report += '- Consider implementing memory optimization techniques.\n';
      } else {
        report += '- Memory usage appears stable or within acceptable growth parameters.\n';
        report += '- Continue monitoring in production environment under real user conditions.\n';
      }

      report += '\n';
    }

    return report;
  }
}

/**
 * LongSessionMemoryTestSuite.ts
 *
 * Test suite for long-term memory performance testing
 */

import {
  MemorySnapshot,
  MemoryTrendAnalysis,
} from '../../utils/performance/longsession/LongSessionMemoryTracker';

export interface MemoryTestResult {
  testName: string;
  startTime: number;
  endTime: number;
  memoryBefore: number;
  memoryAfter: number;
  heapUsed: number;
  duration: number;
  passed: boolean;
  details?: string;
}

export interface MemorySuiteConfig {
  iterations: number;
  dataSize: 'small' | 'medium' | 'large';
  allowGC: boolean;
  trackDetailedStats: boolean;
  delayBetweenTests: number;
  snapshotIntervalMs?: number;
  leakThresholdMBPerMinute?: number;
  durationMs?: number;
}

export interface LongSessionMemoryResult {
  testName: string;
  startTime: number;
  endTime: number;
  duration: number;
  durationMs: number; // Same as duration but explicitly in milliseconds
  initialMemoryMB: number;
  finalMemoryMB: number;
  memoryGrowthRateMBPerHour: number;
  leakDetected: boolean;
  leakSeverity?: number;
  snapshots: MemorySnapshot[];
  analysis: MemoryTrendAnalysis;
  memorySnapshots: {
    timestamp: number;
    memoryUsage: number;
  }[];
  analysisResults: {
    averageUsage: number;
    peakUsage: number;
    growthRate: number;
    isLeakDetected: boolean;
    leakSeverity?: number;
  };
  passed: boolean;
}

/**
 * Long session memory test suite
 */
export class LongSessionMemoryTestSuite {
  private config: MemorySuiteConfig;
  private results: MemoryTestResult[] = [];
  private isRunning = false;
  private onProgressCallback?: (progress: number) => void;
  private onTestCompleteCallback?: (result: MemoryTestResult) => void;
  private onSuiteCompleteCallback?: (results: MemoryTestResult[]) => void;

  constructor(config: Partial<MemorySuiteConfig> = {}) {
    this.config = {
      iterations: config.iterations || 10,
      dataSize: config.dataSize || 'medium',
      allowGC: config.allowGC !== undefined ? config.allowGC : true,
      trackDetailedStats: config.trackDetailedStats || false,
      delayBetweenTests: config.delayBetweenTests || 1000,
      snapshotIntervalMs: config.snapshotIntervalMs || 5000,
      leakThresholdMBPerMinute: config.leakThresholdMBPerMinute || 0.5,
      durationMs: config.durationMs || 60000,
    };
  }

  public async runSuite(): Promise<MemoryTestResult[]> {
    if (this.isRunning) {
      throw new Error('Test suite is already running');
    }

    this.isRunning = true;
    this.results = [];

    // Run the memory leak tests
    await this.runMemoryLeakTest();
    await this.runLargeObjectsTest();
    await this.runEventListenerTest();
    await this.runDOMReferenceTest();
    await this.runCircularReferenceTest();

    this.isRunning = false;

    if (this.onSuiteCompleteCallback) {
      this.onSuiteCompleteCallback(this.results);
    }

    return this.results;
  }

  public onProgress(callback: (progress: number) => void): void {
    this.onProgressCallback = callback;
  }

  public onTestComplete(callback: (result: MemoryTestResult) => void): void {
    this.onTestCompleteCallback = callback;
  }

  public onSuiteComplete(callback: (results: MemoryTestResult[]) => void): void {
    this.onSuiteCompleteCallback = callback;
  }

  public cancelTests(): void {
    this.isRunning = false;
  }

  public getResults(): MemoryTestResult[] {
    return [...this.results];
  }

  public async runTest(): Promise<LongSessionMemoryResult> {
    return this.createMemoryTest('Standard Memory Test', this.config.durationMs || 60000);
  }

  public async runMemoryLeakDetectionTest(
    leakRate: number,
    duration: number
  ): Promise<LongSessionMemoryResult> {
    return this.createMemoryTest('Memory Leak Detection Test', duration, leakRate);
  }

  public async runTestBattery(): Promise<Record<string, LongSessionMemoryResult>> {
    const results: Record<string, LongSessionMemoryResult> = {};

    // Run a standard memory test
    results.standard = await this.runTest();

    // Run tests with different loads
    results.lightweight = await this.createMemoryTest(
      'Lightweight Test',
      this.config.durationMs || 60000,
      0
    );
    results.moderate = await this.createMemoryTest(
      'Moderate Load Test',
      this.config.durationMs || 60000,
      0.5
    );
    results.intensive = await this.createMemoryTest(
      'Intensive Load Test',
      this.config.durationMs || 60000,
      2
    );

    return results;
  }

  private async createMemoryTest(
    testName: string,
    duration: number,
    leakRate = 0
  ): Promise<LongSessionMemoryResult> {
    const startTime = Date.now();
    const snapshots: { timestamp: number; memoryUsage: number }[] = [];
    const snapshotInterval = this.config.snapshotIntervalMs || 5000;
    let testEndTime: number;

    // Initial memory snapshot
    snapshots.push({
      timestamp: startTime,
      memoryUsage: this.getMemoryUsage(),
    });

    // Create artificial memory usage based on leakRate if specified
    if (leakRate > 0) {
      const leakObjects: unknown[] = [];

      // Run until test duration is complete
      const intervalId = setInterval(() => {
        if (!this.isRunning || Date.now() - startTime >= duration) {
          clearInterval(intervalId);
          return;
        }

        // Create objects to simulate memory leak based on leakRate
        const objsToCreate = Math.floor(leakRate * 100);
        for (let i = 0; i < objsToCreate; i++) {
          leakObjects.push(new Array(10000).fill(Math.random()));
        }

        // Take memory snapshot
        snapshots.push({
          timestamp: Date.now(),
          memoryUsage: this.getMemoryUsage(),
        });
      }, snapshotInterval);

      // Wait for test to complete
      await new Promise<void>(resolve => {
        const checkComplete = setInterval(() => {
          if (!this.isRunning || Date.now() - startTime >= duration) {
            clearInterval(checkComplete);
            resolve();
          }
        }, 100);
      });
    } else {
      // For tests without artificial leak, just take snapshots at intervals
      const intervalId = setInterval(() => {
        if (!this.isRunning || Date.now() - startTime >= duration) {
          clearInterval(intervalId);
          return;
        }

        snapshots.push({
          timestamp: Date.now(),
          memoryUsage: this.getMemoryUsage(),
        });
      }, snapshotInterval);

      // Wait for test to complete
      await new Promise<void>(resolve => {
        const checkComplete = setInterval(() => {
          if (!this.isRunning || Date.now() - startTime >= duration) {
            clearInterval(checkComplete);
            resolve();
          }
        }, 100);
      });
    }

    testEndTime = Date.now();

    // Final memory snapshot
    snapshots.push({
      timestamp: testEndTime,
      memoryUsage: this.getMemoryUsage(),
    });

    // Analyze results
    const averageUsage =
      snapshots.reduce((sum, snapshot) => sum + snapshot.memoryUsage, 0) / snapshots.length;
    const peakUsage = Math.max(...snapshots.map(s => s.memoryUsage));

    // Calculate growth rate in MB per minute
    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];
    const memoryDiff = lastSnapshot.memoryUsage - firstSnapshot.memoryUsage;
    const timeDiffMinutes = (lastSnapshot.timestamp - firstSnapshot.timestamp) / (1000 * 60);
    const growthRate = timeDiffMinutes > 0 ? memoryDiff / timeDiffMinutes : 0;

    // Determine if a leak is detected
    const isLeakDetected = growthRate > (this.config.leakThresholdMBPerMinute || 0.5);

    // Calculate leak severity (1-5 scale)
    let leakSeverity: number | undefined;
    if (isLeakDetected) {
      const baseThreshold = this.config.leakThresholdMBPerMinute || 0.5;
      leakSeverity = Math.min(5, Math.ceil(growthRate / baseThreshold));
    }

    const initialMemoryMB = firstSnapshot.memoryUsage;
    const finalMemoryMB = lastSnapshot.memoryUsage;
    const memoryGrowthRateMBPerHour = growthRate * 60; // Convert from per minute to per hour

    // Convert to MemorySnapshot format required by the visualizer
    const memorySnapshots: MemorySnapshot[] = snapshots.map(snapshot => ({
      timestamp: snapshot.timestamp,
      usedHeapSizeMB: snapshot.memoryUsage,
      totalHeapSizeMB: snapshot.memoryUsage * 1.5, // Estimate total heap size
      heapLimitMB: snapshot.memoryUsage * 4, // Estimate heap limit
    }));

    // Create MemoryTrendAnalysis object required by the visualizer
    const memoryAnalysis: MemoryTrendAnalysis = {
      overallTrend: growthRate > 0 ? 1 : growthRate < 0 ? -1 : 0,
      growthRatePerMinute: growthRate,
      growthRatePerHour: memoryGrowthRateMBPerHour,
      estimatedTimeToLimit: isLeakDetected
        ? ((memorySnapshots[0].heapLimitMB - memorySnapshots[0].usedHeapSizeMB) / growthRate) *
          60 *
          1000 // Convert to ms
        : Number.POSITIVE_INFINITY,
      isAccelerating: false, // We don't calculate acceleration in this simple test
      confidence: 0.8, // Reasonable confidence
      suspectedLeak: isLeakDetected,
      leakCause: isLeakDetected ? 'Simulated memory leak' : undefined,
      leakSeverity: leakSeverity,
    };

    return {
      testName,
      startTime,
      endTime: testEndTime,
      duration: testEndTime - startTime,
      durationMs: duration,
      initialMemoryMB,
      finalMemoryMB,
      memoryGrowthRateMBPerHour,
      leakDetected: isLeakDetected,
      leakSeverity,
      snapshots: memorySnapshots, // Use the converted format
      analysis: memoryAnalysis, // Use the converted format
      memorySnapshots: snapshots,
      analysisResults: {
        averageUsage,
        peakUsage,
        growthRate,
        isLeakDetected,
        leakSeverity,
      },
      passed: !isLeakDetected,
    };
  }

  public static generateReport(
    results: LongSessionMemoryResult | Record<string, LongSessionMemoryResult>
  ): string {
    let report = '# Memory Test Report\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    if ('testName' in results) {
      // Single test result
      const result = results as LongSessionMemoryResult;
      report += this.formatSingleTestReport(result);
    } else {
      // Multiple test results
      const testResults = results as Record<string, LongSessionMemoryResult>;
      report += '## Test Battery Results\n\n';

      for (const [testKey, result] of Object.entries(testResults)) {
        report += `### ${testKey.charAt(0).toUpperCase() + testKey.slice(1)} Test\n\n`;
        report += this.formatSingleTestReport(result);
        report += '---\n\n';
      }

      // Add comparison table
      report += '## Test Comparison\n\n';
      report += '| Test | Duration | Average Memory | Peak Memory | Growth Rate | Status |\n';
      report += '|------|----------|----------------|-------------|-------------|--------|\n';

      for (const [testKey, result] of Object.entries(testResults)) {
        const { analysisResults, duration, passed } = result;
        report += `| ${testKey} | ${(duration / 1000).toFixed(1)}s | ${analysisResults.averageUsage.toFixed(1)} MB | ${analysisResults.peakUsage.toFixed(1)} MB | ${analysisResults.growthRate.toFixed(2)} MB/min | ${passed ? '✅ Pass' : '❌ Fail'} |\n`;
      }
    }

    return report;
  }

  private static formatSingleTestReport(result: LongSessionMemoryResult): string {
    const { testName, startTime, endTime, duration, memorySnapshots, analysisResults, passed } =
      result;
    let report = `## ${testName}\n\n`;

    report += `- **Start Time**: ${new Date(startTime).toLocaleString()}\n`;
    report += `- **End Time**: ${new Date(endTime).toLocaleString()}\n`;
    report += `- **Duration**: ${(duration / 1000).toFixed(1)} seconds\n`;
    report += `- **Average Memory Usage**: ${analysisResults.averageUsage.toFixed(1)} MB\n`;
    report += `- **Peak Memory Usage**: ${analysisResults.peakUsage.toFixed(1)} MB\n`;
    report += `- **Memory Growth Rate**: ${analysisResults.growthRate.toFixed(2)} MB/min\n`;
    report += `- **Memory Leak Detected**: ${analysisResults.isLeakDetected ? 'Yes' : 'No'}\n`;

    if (analysisResults.leakSeverity !== undefined) {
      report += `- **Leak Severity**: ${analysisResults.leakSeverity}/5\n`;
    }

    report += `- **Test Status**: ${passed ? '✅ Passed' : '❌ Failed'}\n\n`;

    // Add snapshot data
    report += '### Memory Snapshots\n\n';
    report += '| Time | Memory Usage (MB) | Elapsed (s) |\n';
    report += '|------|-------------------|-------------|\n';

    for (const snapshot of memorySnapshots) {
      const elapsedSeconds = ((snapshot.timestamp - startTime) / 1000).toFixed(1);
      report += `| ${new Date(snapshot.timestamp).toLocaleTimeString()} | ${snapshot.memoryUsage.toFixed(1)} | ${elapsedSeconds} |\n`;
    }

    report += '\n';
    return report;
  }

  private async runMemoryLeakTest(): Promise<void> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    // Create large arrays and objects multiple times
    const dataSize = this.getDataSize();
    const containers: any[] = [];

    for (let i = 0; i < this.config.iterations; i++) {
      // Creating potentially leaky objects
      const obj = {
        data: new Array(dataSize).fill(0).map((_, idx) => ({ id: idx, value: `value-${idx}` })),
        metadata: { created: Date.now(), iterations: i },
      };

      containers.push(obj);

      // Report progress
      if (this.onProgressCallback) {
        this.onProgressCallback((i / this.config.iterations) * 20); // First test = 0-20%
      }

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 10));

      if (!this.isRunning) break;
    }

    // Allow objects to be garbage collected if config allows
    if (this.config.allowGC) {
      containers.length = 0;
      if (window.gc) window.gc();
    }

    const memoryAfter = this.getMemoryUsage();
    const endTime = performance.now();

    const result: MemoryTestResult = {
      testName: 'Memory Leak Test',
      startTime,
      endTime,
      memoryBefore,
      memoryAfter,
      heapUsed: memoryAfter - memoryBefore,
      duration: endTime - startTime,
      passed: this.config.allowGC ? memoryAfter - memoryBefore < dataSize * 10 : true,
    };

    this.results.push(result);

    if (this.onTestCompleteCallback) {
      this.onTestCompleteCallback(result);
    }

    // Delay before next test
    await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenTests));
  }

  private async runLargeObjectsTest(): Promise<void> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    // Create and destroy large objects
    const dataSize = this.getDataSize();

    for (let i = 0; i < this.config.iterations; i++) {
      // Large object creation
      const largeObject = new Array(dataSize).fill(0).map(() => {
        return {
          id: Math.random().toString(36).substring(2),
          timestamp: Date.now(),
          data: new Array(100).fill(Math.random()),
        };
      });

      // Do something with the object to prevent optimization
      const sum = largeObject.reduce((acc, item) => acc + item.data.reduce((a, b) => a + b, 0), 0);

      // Report progress
      if (this.onProgressCallback) {
        this.onProgressCallback(20 + (i / this.config.iterations) * 20); // Second test = 20-40%
      }

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 10));

      if (!this.isRunning) break;
    }

    // Force garbage collection if available and allowed
    if (this.config.allowGC && window.gc) {
      window.gc();
    }

    const memoryAfter = this.getMemoryUsage();
    const endTime = performance.now();

    const result: MemoryTestResult = {
      testName: 'Large Objects Test',
      startTime,
      endTime,
      memoryBefore,
      memoryAfter,
      heapUsed: memoryAfter - memoryBefore,
      duration: endTime - startTime,
      passed: true, // We can't really determine a "pass" here, just collecting metrics
    };

    this.results.push(result);

    if (this.onTestCompleteCallback) {
      this.onTestCompleteCallback(result);
    }

    // Delay before next test
    await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenTests));
  }

  private async runEventListenerTest(): Promise<void> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    // Create elements and attach event listeners
    const elements: HTMLDivElement[] = [];
    const eventHandlers: ((e: Event) => void)[] = [];

    for (let i = 0; i < Math.min(this.config.iterations, 100); i++) {
      const element = document.createElement('div');
      element.style.display = 'none';
      document.body.appendChild(element);
      elements.push(element);

      // Create listener
      const handler = (e: Event) => {
        console.log('Event handled', e.type, i);
      };

      // Attach listener
      element.addEventListener('click', handler);
      eventHandlers.push(handler);

      // Report progress
      if (this.onProgressCallback) {
        this.onProgressCallback(40 + (i / Math.min(this.config.iterations, 100)) * 20); // Third test = 40-60%
      }

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 10));

      if (!this.isRunning) break;
    }

    // Remove event listeners and elements if configured to do so
    if (this.config.allowGC) {
      elements.forEach((element, i) => {
        element.removeEventListener('click', eventHandlers[i]);
        element.remove();
      });
    }

    const memoryAfter = this.getMemoryUsage();
    const endTime = performance.now();

    const result: MemoryTestResult = {
      testName: 'Event Listener Test',
      startTime,
      endTime,
      memoryBefore,
      memoryAfter,
      heapUsed: memoryAfter - memoryBefore,
      duration: endTime - startTime,
      passed: this.config.allowGC ? memoryAfter - memoryBefore < 1000000 : true, // 1MB threshold
    };

    this.results.push(result);

    if (this.onTestCompleteCallback) {
      this.onTestCompleteCallback(result);
    }

    // Delay before next test
    await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenTests));
  }

  private async runDOMReferenceTest(): Promise<void> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    // Create DOM elements and store references
    const references: HTMLElement[] = [];

    for (let i = 0; i < Math.min(this.config.iterations * 10, 500); i++) {
      const element = document.createElement('div');
      element.innerHTML = `<span>Test element ${i}</span><ul>${Array(10)
        .fill(0)
        .map((_, idx) => `<li>Item ${idx}</li>`)
        .join('')}</ul>`;
      element.style.display = 'none';
      document.body.appendChild(element);

      references.push(element);

      // Report progress
      if (this.onProgressCallback) {
        this.onProgressCallback(60 + (i / Math.min(this.config.iterations * 10, 500)) * 20); // Fourth test = 60-80%
      }

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 5));

      if (!this.isRunning) break;
    }

    // Clean up if configured to do so
    if (this.config.allowGC) {
      references.forEach(element => element.remove());
      references.length = 0;
    }

    const memoryAfter = this.getMemoryUsage();
    const endTime = performance.now();

    const result: MemoryTestResult = {
      testName: 'DOM Reference Test',
      startTime,
      endTime,
      memoryBefore,
      memoryAfter,
      heapUsed: memoryAfter - memoryBefore,
      duration: endTime - startTime,
      passed: this.config.allowGC ? memoryAfter - memoryBefore < 2000000 : true, // 2MB threshold
    };

    this.results.push(result);

    if (this.onTestCompleteCallback) {
      this.onTestCompleteCallback(result);
    }

    // Delay before next test
    await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenTests));
  }

  private async runCircularReferenceTest(): Promise<void> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    // Create objects with circular references
    const objects: any[] = [];

    for (let i = 0; i < this.config.iterations; i++) {
      const parent: any = { name: `parent-${i}`, children: [] };
      const child1: any = { name: `child1-${i}`, parent: parent };
      const child2: any = { name: `child2-${i}`, parent: parent, sibling: child1 };

      child1.sibling = child2;
      parent.children.push(child1, child2);

      objects.push(parent);

      // Create deeper circular structures
      if (i % 2 === 0) {
        const deepStructure: any = { level: 0 };
        let current = deepStructure;

        for (let j = 1; j < 20; j++) {
          current.next = { level: j, previous: current };
          current = current.next;
        }

        // Complete the circle
        current.next = deepStructure;
        deepStructure.previous = current;

        objects.push(deepStructure);
      }

      // Report progress
      if (this.onProgressCallback) {
        this.onProgressCallback(80 + (i / this.config.iterations) * 20); // Fifth test = 80-100%
      }

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 10));

      if (!this.isRunning) break;
    }

    // Break circular references if configured to do so
    if (this.config.allowGC) {
      objects.forEach(obj => {
        if (obj.children) {
          obj.children.forEach((child: any) => {
            child.parent = null;
            child.sibling = null;
          });
          obj.children = null;
        }

        // Break deep circular references
        if (obj.level !== undefined) {
          let current = obj;
          let maxIterations = 100; // Safety to prevent infinite loops

          while (current && current.next && maxIterations-- > 0) {
            const next = current.next;
            current.next = null;
            current.previous = null;
            current = next;

            // If we've looped back to the beginning
            if (current === obj) break;
          }
        }
      });

      objects.length = 0;

      // Force garbage collection if available
      if (window.gc) window.gc();
    }

    const memoryAfter = this.getMemoryUsage();
    const endTime = performance.now();

    const result: MemoryTestResult = {
      testName: 'Circular Reference Test',
      startTime,
      endTime,
      memoryBefore,
      memoryAfter,
      heapUsed: memoryAfter - memoryBefore,
      duration: endTime - startTime,
      passed: this.config.allowGC ? memoryAfter - memoryBefore < 1000000 : true, // 1MB threshold
    };

    this.results.push(result);

    if (this.onTestCompleteCallback) {
      this.onTestCompleteCallback(result);
    }
  }

  private getMemoryUsage(): number {
    if (window.performance && window.performance.memory) {
      return (window.performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getDataSize(): number {
    switch (this.config.dataSize) {
      case 'small':
        return 10000;
      case 'medium':
        return 100000;
      case 'large':
        return 1000000;
      default:
        return 100000;
    }
  }
}

// Add the global gc declaration for TypeScript
declare global {
  interface Window {
    gc?: () => void;
  }
}

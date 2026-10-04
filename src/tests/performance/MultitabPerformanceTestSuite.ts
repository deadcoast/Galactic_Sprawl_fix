/**
 * MultitabPerformanceTestSuite.ts
 *
 * Test suite for multitab performance testing
 */

import { PerformanceMetrics } from '../../hooks/ui/useDebugOverlay';

export interface PerformanceMetric {
  average: number;
  min: number;
  max: number;
  samples: number[];
}

export interface MultitabPerformanceResult {
  tabId: string;
  memory: PerformanceMetric;
  cpu: PerformanceMetric;
  fps?: PerformanceMetric;
  errors: {
    type: string;
    message: string;
    timestamp: number;
  }[];
  startTime: number;
  endTime?: number;
  status: 'initializing' | 'running' | 'completed' | 'error';
}

export interface MultitabTestConfig {
  tabCount: number;
  scenarioType: 'resource-intensive' | 'memory-intensive' | 'network-intensive' | 'ui-intensive';
  duration: number; // in seconds
  delayBetweenTabs: number; // in milliseconds
  reportFrequency: number; // in milliseconds
  autoClose: boolean;
  preserveData: boolean;
}

/**
 * Class to manage performance testing across multiple tabs
 */
export class MultitabPerformanceTestSuite {
  private config: MultitabTestConfig;
  private results: MultitabPerformanceResult[] = [];
  private tabs: Window[] = [];
  private isRunning = false;
  private startTime = 0;
  private testId: string;
  private onProgressCallback?: (progress: number) => void;
  private onResultCallback?: (results: MultitabPerformanceResult[]) => void;
  private onTabOpenCallback?: (tabId: string, tabWindow: Window) => void;
  private onTestCompleteCallback?: (results: MultitabPerformanceResult[]) => void;
  private intervalId?: number;

  constructor(config: MultitabTestConfig) {
    this.config = config;
    this.testId = `perf-test-${Date.now()}`;
  }

  /**
   * Start the performance test across multiple tabs
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Test is already running');
    }

    // Clear previous results if not preserving data
    if (!this.config.preserveData) {
      this.results = [];
    }

    this.isRunning = true;
    this.startTime = Date.now();

    // Create tabs with delay between them
    for (let i = 0; i < this.config.tabCount; i++) {
      if (!this.isRunning) break; // Stop if cancelled

      const tabId = `tab-${i + 1}`;

      // Initialize result object for this tab
      this.results.push({
        tabId,
        memory: { average: 0, min: Infinity, max: 0, samples: [] },
        cpu: { average: 0, min: Infinity, max: 0, samples: [] },
        fps: { average: 0, min: Infinity, max: 0, samples: [] },
        errors: [],
        startTime: Date.now(),
        status: 'initializing',
      });

      // Open the tab with parameters
      const testUrl = this.getTestUrl(i, tabId);
      const tabWindow = window.open(testUrl, tabId);

      if (tabWindow) {
        this.tabs.push(tabWindow);

        if (this.onTabOpenCallback) {
          this.onTabOpenCallback(tabId, tabWindow);
        }

        // Update tab status
        this.updateTabStatus(tabId, 'running');
      } else {
        // Failed to open tab
        this.updateTabStatus(tabId, 'error');
        this.addError(tabId, 'system', 'Failed to open tab - check popup blocker');
      }

      // Add delay before opening next tab
      if (i < this.config.tabCount - 1 && this.config.delayBetweenTabs > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenTabs));
      }
    }

    // Start collecting data from tabs
    this.startDataCollection();

    // End test after duration
    setTimeout(() => {
      this.stop();
    }, this.config.duration * 1000);
  }

  /**
   * Stop the performance test and close tabs if configured
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Stop collecting data
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    // Mark all tabs as completed
    this.results.forEach(result => {
      if (result.status === 'running') {
        result.status = 'completed';
        result.endTime = Date.now();
      }
    });

    // Close tabs if configured to do so
    if (this.config.autoClose) {
      this.tabs.forEach(tab => {
        try {
          tab.close();
        } catch (e) {
          // Ignore errors when closing tabs
          console.error('Error closing tab:', e);
        }
      });
      this.tabs = [];
    }

    // Calculate final metrics
    this.calculateFinalMetrics();

    // Notify test completion
    if (this.onTestCompleteCallback) {
      this.onTestCompleteCallback(this.results);
    }
  }

  /**
   * Register a callback for progress updates
   */
  public onProgress(callback: (progress: number) => void): void {
    this.onProgressCallback = callback;
  }

  /**
   * Register a callback for result updates
   */
  public onResult(callback: (results: MultitabPerformanceResult[]) => void): void {
    this.onResultCallback = callback;
  }

  /**
   * Register a callback for when a new tab is opened
   */
  public onTabOpen(callback: (tabId: string, tabWindow: Window) => void): void {
    this.onTabOpenCallback = callback;
  }

  /**
   * Register a callback for test completion
   */
  public onTestComplete(callback: (results: MultitabPerformanceResult[]) => void): void {
    this.onTestCompleteCallback = callback;
  }

  /**
   * Get the current results
   */
  public getResults(): MultitabPerformanceResult[] {
    return [...this.results];
  }

  /**
   * Check if the test is running
   */
  public isTestRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the progress of the test (0-100)
   */
  public getProgress(): number {
    if (!this.isRunning || this.startTime === 0) return 0;
    if (Date.now() - this.startTime >= this.config.duration * 1000) return 100;

    return Math.min(
      100,
      Math.floor(((Date.now() - this.startTime) / (this.config.duration * 1000)) * 100)
    );
  }

  /**
   * Start collecting performance data from tabs
   */
  private startDataCollection(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }

    this.intervalId = window.setInterval(() => {
      // Update progress
      if (this.onProgressCallback) {
        this.onProgressCallback(this.getProgress());
      }

      // Collect data from each tab
      this.tabs.forEach((tab, index) => {
        try {
          if (!tab || tab.closed) {
            // Tab was closed
            const tabId = `tab-${index + 1}`;
            this.updateTabStatus(tabId, 'error');
            this.addError(tabId, 'system', 'Tab was closed unexpectedly');
            return;
          }

          const tabId = `tab-${index + 1}`;

          // Try to retrieve performance data from the tab
          if (tab.performance) {
            this.collectPerformanceData(tabId, tab);
          }

          // Notify with current results
          if (this.onResultCallback) {
            this.onResultCallback(this.results);
          }
        } catch (e) {
          console.error('Error collecting data from tab:', e);
          // Ignore cross-origin errors
        }
      });
    }, this.config.reportFrequency);
  }

  /**
   * Collect performance data from a tab
   */
  private collectPerformanceData(tabId: string, tabWindow: Window): void {
    try {
      let memoryUsage = 0;
      let cpuUsage = 0;
      let fps = 0;

      // Memory usage (if available)
      const performanceWithMemory = tabWindow.performance as unknown as Performance;
      if (performanceWithMemory.memory && 'usedJSHeapSize' in performanceWithMemory.memory) {
        memoryUsage = (performanceWithMemory.memory as { usedJSHeapSize: number }).usedJSHeapSize / (1024 * 1024); // Convert to MB
        this.updateMetric(tabId, 'memory', memoryUsage);
      }

      // Estimate CPU usage (this is just a rough approximation)
      // In a real app, you would use the Performance API more effectively
      const start = performance.now();
      let count = 0;
      for (let i = 0; i < 100000; i++) {
        count += i;
      }
      const end = performance.now();
      cpuUsage = (end - start) * 10; // Just a rough scaling factor
      this.updateMetric(tabId, 'cpu', Math.min(100, cpuUsage)); // Cap at 100%

      // FPS (in a real app, you would use requestAnimationFrame)
      if (typeof tabWindow.requestAnimationFrame === 'function') {
        // We can't actually measure frames here, but in a real app we would
        // This is just an approximation for the example
        fps = 60 - cpuUsage / 5; // Rough estimate - higher CPU = lower FPS
        fps = Math.max(1, Math.min(60, fps)); // Clamp between 1-60
        this.updateMetric(tabId, 'fps', fps);
      }
    } catch (e) {
      console.error(`Error getting performance data for ${tabId}:`, e);
    }
  }

  /**
   * Update a performance metric for a tab
   */
  private updateMetric(tabId: string, metricName: 'memory' | 'cpu' | 'fps', value: number): void {
    const result = this.results.find(r => r.tabId === tabId);
    if (!result) return;

    const metric = result[metricName];
    if (!metric) return;

    // Add sample
    metric.samples.push(value);

    // Update min/max
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);

    // Update average
    metric.average = metric.samples.reduce((sum, val) => sum + val, 0) / metric.samples.length;
  }

  /**
   * Update the status of a tab
   */
  private updateTabStatus(tabId: string, status: MultitabPerformanceResult['status']): void {
    const result = this.results.find(r => r.tabId === tabId);
    if (result) {
      result.status = status;

      if (status === 'completed' || status === 'error') {
        result.endTime = Date.now();
      }
    }
  }

  /**
   * Add an error for a tab
   */
  private addError(tabId: string, type: string, message: string): void {
    const result = this.results.find(r => r.tabId === tabId);
    if (result) {
      result.errors.push({
        type,
        message,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Calculate final metrics for all tabs
   */
  private calculateFinalMetrics(): void {
    // Nothing additional to calculate right now
    // In a real app, you might want to calculate more complex metrics
  }

  /**
   * Get the URL for a test tab
   */
  private getTestUrl(index: number, tabId: string): string {
    const baseUrl = window.location.href.split('?')[0];
    const params = new URLSearchParams();

    params.set('scenario', this.config.scenarioType);
    params.set('tabId', tabId);
    params.set('testId', this.testId);
    params.set('duration', String(this.config.duration));

    return `${baseUrl}?${params.toString()}#test-worker`;
  }
}

// Add the window.performance.memory TypeScript declaration
declare global {
  interface Performance {
    memory?: PerformanceMetrics;
  }
}

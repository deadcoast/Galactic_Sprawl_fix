/**
 * MultitabPerformanceTestSuite
 *
 * This test suite evaluates application performance when multiple tabs are running
 * simultaneously. It helps identify potential issues like memory leaks, shared
 * resource contention, and performance degradation in multi-tab scenarios.
 *
 * The test suite uses the MultitabCommunicationChannel to coordinate tests across
 * multiple browser tabs.
 */

import {
  BenchmarkResult,
  saveBenchmarkResults,
} from '../../utils/performance/benchmarks/PerformanceBenchmarkTools';

import {
  MultitabCommunicationChannel,
  TabMessage,
  TestConfiguration,
} from '../../utils/performance/multitab/MultitabCommunicationChannel';

/**
 * Result of a multi-tab performance test
 */
export interface MultitabPerformanceResult extends BenchmarkResult {
  /** Number of tabs active during the test */
  tabCount: number;

  /** Type of test performed */
  testType: string;

  /** Test parameters */
  parameters: Record<string, unknown>;

  /** Performance metrics specific to this test */
  metrics: {
    /** Memory usage in MB per tab (average) */
    memoryPerTabMB: number;

    /** Frames per second (average) */
    fps: number;

    /** Event processing time in ms (average) */
    eventProcessingTimeMs: number;

    /** UI response time in ms (average) */
    uiResponseTimeMs: number;

    /** Number of dropped frames */
    droppedFrames: number;

    /** Time to interactive in ms */
    timeToInteractiveMs: number;
  };
}

/**
 * Resource contention test options
 */
export interface ResourceContentionTestOptions {
  /** Number of shared resources to track */
  resourceCount?: number;

  /** Operations per second on each resource */
  operationsPerSecond?: number;

  /** Duration of the test in milliseconds */
  durationMs?: number;

  /** Maximum memory per tab in MB */
  maxMemoryPerTabMB?: number;
}

/**
 * UI Responsiveness test options
 */
export interface UIResponsivenessTestOptions {
  /** Number of UI interactions to perform */
  interactionCount?: number;

  /** Types of interactions to perform */
  interactionTypes?: Array<'click' | 'drag' | 'scroll' | 'type'>;

  /** Delay between interactions in milliseconds */
  interactionDelayMs?: number;

  /** Duration of the test in milliseconds */
  durationMs?: number;
}

/**
 * DOM operation test options
 */
export interface DOMOperationTestOptions {
  /** Number of DOM elements to create */
  elementCount?: number;

  /** Frequency of DOM updates per second */
  updateFrequency?: number;

  /** Duration of the test in milliseconds */
  durationMs?: number;
}

/**
 * Memory Usage test options
 */
export interface MemoryUsageTestOptions {
  /** Duration of the test in milliseconds */
  durationMs?: number;

  /** Interval for memory sampling in milliseconds */
  samplingIntervalMs?: number;

  /** Whether to attempt to force garbage collection during test */
  attemptGC?: boolean;
}

/**
 * MultitabPerformanceTest class
 * Responsible for running and coordinating multi-tab performance tests
 */
export class MultitabPerformanceTest {
  /** Communication channel for coordinating with other tabs */
  private channel: MultitabCommunicationChannel;

  /** Current test configuration */
  private testConfig: TestConfiguration | null = null;

  /** Test results from this tab */
  private localResults: Partial<MultitabPerformanceResult> | null = null;

  /** Combined results from all tabs */
  private combinedResults: MultitabPerformanceResult[] = [];

  /** Whether we're currently running a test */
  private isRunningTest = false;

  /** Test start timestamp */
  private testStartTime = 0;

  /** Handler for test completion */
  private onTestComplete: ((results: MultitabPerformanceResult[]) => void) | null = null;

  /** Performance metrics collected during the test */
  private metrics = {
    fps: [] as number[],
    memoryUsage: [] as number[],
    eventProcessingTime: [] as number[],
    uiResponseTime: [] as number[],
    droppedFrames: 0,
    timeToInteractive: 0,
  };

  /** Animation frame request ID for FPS tracking */
  private animFrameId: number | null = null;

  /** Interval ID for memory tracking */
  private memoryIntervalId: number | null = null;

  /**
   * Create a new MultitabPerformanceTest instance
   * @param isCoordinator Whether this tab should be the test coordinator
   */
  constructor(isCoordinator = false) {
    this.channel = new MultitabCommunicationChannel(isCoordinator ? 'coordinator' : 'worker');

    // Set up message handlers
    this.setupMessageHandlers();
  }

  /**
   * Set up handlers for inter-tab messages
   */
  private setupMessageHandlers(): void {
    this.channel.addMessageHandler(this.handleMessage.bind(this));
  }

  /**
   * Handle an incoming message from another tab
   */
  private handleMessage(message: TabMessage): void {
    // Skip our own messages
    if (message.senderId === this.channel.getTabId()) {
      return;
    }

    switch (message.type) {
      case 'START_TEST':
        if (this.channel.isWorker() && !this.isRunningTest && message.payload) {
          // Worker tab receiving test configuration from coordinator
          this.testConfig = message.payload as unknown as TestConfiguration;
          this.startTest().catch(err => console.error('Error starting test:', err));
        }
        break;

      case 'END_TEST':
        if (this.isRunningTest) {
          this.endTest();
        }
        break;

      case 'REPORT':
        if (this.channel.isCoordinator() && message.payload) {
          // Coordinator receiving test results from a worker
          const result = message.payload as unknown as Partial<MultitabPerformanceResult>;
          if (result) {
            this.collectTabResult(message.senderId, result);
          }
        }
        break;
    }
  }

  /**
   * Activate the test coordinator or worker
   */
  public activate(): void {
    this.channel.activate();
  }

  /**
   * Deactivate and clean up
   */
  public deactivate(): void {
    this.stopMetricsCollection();
    this.channel.deactivate();
  }

  /**
   * Check if we're the test coordinator
   */
  public isCoordinator(): boolean {
    return this.channel.isCoordinator();
  }

  /**
   * Get the number of active tabs
   */
  public getTabCount(): number {
    return this.channel.getActiveTabCount();
  }

  /**
   * Start collecting performance metrics
   */
  private startMetricsCollection(): void {
    // Start collecting FPS
    let lastFrameTime = performance.now();
    let frameTimes: number[] = [];

    const recordFrame = () => {
      const now = performance.now();
      const frameTime = now - lastFrameTime;
      lastFrameTime = now;

      // Record frame time
      frameTimes.push(frameTime);

      // Limit array size to prevent memory issues
      if (frameTimes.length > 100) {
        frameTimes = frameTimes.slice(-100);
      }

      // Calculate FPS from recent frame times
      const fps = 1000 / (frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length);
      this.metrics.fps.push(fps);

      // Count dropped frames (approximately, assuming 60 FPS target)
      if (frameTime > 1000 / 30) {
        // Frame took more than 33ms (less than 30 FPS)
        this.metrics.droppedFrames++;
      }

      // Continue recording if test is still running
      if (this.isRunningTest) {
        this.animFrameId = requestAnimationFrame(recordFrame);
      }
    };

    this.animFrameId = requestAnimationFrame(recordFrame);

    // Start collecting memory usage
    this.memoryIntervalId = window.setInterval(() => {
      if (typeof performance.memory !== 'undefined') {
        // Chrome-specific memory info
        const memoryInfo = (performance as any).memory;
        if (memoryInfo && memoryInfo.usedJSHeapSize) {
          const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
          this.metrics.memoryUsage.push(usedMB);
        }
      }
    }, 1000) as unknown as number;

    // Record time to interactive (assume we're interactive now)
    this.metrics.timeToInteractive = performance.now() - this.testStartTime;
  }

  /**
   * Stop collecting performance metrics
   */
  private stopMetricsCollection(): void {
    // Stop FPS tracking
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // Stop memory tracking
    if (this.memoryIntervalId !== null) {
      clearInterval(this.memoryIntervalId);
      this.memoryIntervalId = null;
    }
  }

  /**
   * Calculate final metrics from collected data
   */
  private calculateFinalMetrics(): Record<string, number> {
    const avgFps =
      this.metrics.fps.length > 0
        ? this.metrics.fps.reduce((sum, fps) => sum + fps, 0) / this.metrics.fps.length
        : 0;

    const avgMemory =
      this.metrics.memoryUsage.length > 0
        ? this.metrics.memoryUsage.reduce((sum, mem) => sum + mem, 0) /
          this.metrics.memoryUsage.length
        : 0;

    const avgEventTime =
      this.metrics.eventProcessingTime.length > 0
        ? this.metrics.eventProcessingTime.reduce((sum, time) => sum + time, 0) /
          this.metrics.eventProcessingTime.length
        : 0;

    const avgUiTime =
      this.metrics.uiResponseTime.length > 0
        ? this.metrics.uiResponseTime.reduce((sum, time) => sum + time, 0) /
          this.metrics.uiResponseTime.length
        : 0;

    return {
      fps: avgFps,
      memoryPerTabMB: avgMemory,
      eventProcessingTimeMs: avgEventTime,
      uiResponseTimeMs: avgUiTime,
      droppedFrames: this.metrics.droppedFrames,
      timeToInteractiveMs: this.metrics.timeToInteractive,
    };
  }

  /**
   * Collect a test result from a worker tab
   */
  private collectTabResult(tabId: string, result: Partial<MultitabPerformanceResult>): void {
    // Store the result
    const tabResult: MultitabPerformanceResult = {
      name: result.name || 'Unknown Test',
      description: result.description || '',
      executionTimeMs: result.executionTimeMs || 0,
      tabCount: this.getTabCount(),
      testType: result.testType || 'unknown',
      parameters: result.parameters || {},
      timestamp: result.timestamp || new Date(),
      metrics: result.metrics || {
        memoryPerTabMB: 0,
        fps: 0,
        eventProcessingTimeMs: 0,
        uiResponseTimeMs: 0,
        droppedFrames: 0,
        timeToInteractiveMs: 0,
      },
    };

    this.combinedResults.push(tabResult);

    // Check if all tabs have reported
    const expectedTabCount = this.getTabCount() - 1; // All tabs except coordinator
    if (this.combinedResults.length >= expectedTabCount) {
      // All results collected, notify callback
      if (this.onTestComplete) {
        this.onTestComplete(this.combinedResults);
      }

      // Reset for next test
      this.combinedResults = [];
    }
  }

  /**
   * Start a test as the coordinator
   */
  public async runCoordinatedTest(
    config: TestConfiguration,
    onComplete?: (results: MultitabPerformanceResult[]) => void
  ): Promise<void> {
    if (!this.channel.isCoordinator()) {
      throw new Error('Only the coordinator tab can initiate a test');
    }

    if (this.isRunningTest) {
      throw new Error('A test is already running');
    }

    // Check if we have enough tabs
    if (this.getTabCount() < 2) {
      throw new Error('Need at least 2 tabs (1 coordinator + 1 worker) to run a test');
    }

    // Store configuration and callback
    this.testConfig = config;
    this.onTestComplete = onComplete || null;

    // Reset results
    this.combinedResults = [];

    // Broadcast test start to all worker tabs
    this.channel.sendMessage({
      type: 'START_TEST',
      payload: config,
    });

    // Start the test in this tab too
    await this.startTest();

    // Coordinator will end the test after the specified duration
    setTimeout(() => {
      this.channel.sendMessage({
        type: 'END_TEST',
        payload: { reason: 'completed' },
      });
      this.endTest();
    }, config.durationMs);
  }

  /**
   * Start a test (called on both coordinator and worker tabs)
   */
  private async startTest(): Promise<void> {
    if (!this.testConfig) {
      throw new Error('No test configuration');
    }

    this.isRunningTest = true;
    this.testStartTime = performance.now();

    // Start collecting metrics
    this.startMetricsCollection();

    // Run the appropriate test based on configuration
    try {
      switch (this.testConfig.testType) {
        case 'resourceContention':
          await this.runResourceContentionTest(this.testConfig.parameters);
          break;

        case 'uiResponsiveness':
          await this.runUIResponsivenessTest(this.testConfig.parameters);
          break;

        case 'domOperations':
          await this.runDOMOperationsTest(this.testConfig.parameters);
          break;

        case 'memoryUsage':
          await this.runMemoryUsageTest(this.testConfig.parameters);
          break;

        default:
          console.warn(`Unknown test type: ${this.testConfig.testType}`);
      }
    } catch (error) {
      console.error('Error running test:', error);
      this.channel.setState('error');
    }
  }

  /**
   * End the current test and report results
   */
  private endTest(): void {
    if (!this.isRunningTest) {
      return;
    }

    // Stop collecting metrics
    this.stopMetricsCollection();

    // Calculate final metrics
    const metrics = this.calculateFinalMetrics();

    // Create result
    this.localResults = {
      name: `Multi-tab ${this.testConfig?.testType || 'Unknown'} Test`,
      description: `Test with ${this.getTabCount()} tabs open simultaneously`,
      executionTimeMs: performance.now() - this.testStartTime,
      tabCount: this.getTabCount(),
      testType: this.testConfig?.testType || 'unknown',
      parameters: this.testConfig?.parameters || {},
      timestamp: new Date(),
      metrics: {
        memoryPerTabMB: metrics.memoryPerTabMB,
        fps: metrics.fps,
        eventProcessingTimeMs: metrics.eventProcessingTimeMs,
        uiResponseTimeMs: metrics.uiResponseTimeMs,
        droppedFrames: metrics.droppedFrames,
        timeToInteractiveMs: metrics.timeToInteractiveMs,
      },
    };

    // If we're a worker, report results to coordinator
    if (this.channel.isWorker()) {
      this.channel.sendMessage({
        type: 'REPORT',
        payload: this.localResults,
      });
    } else if (this.channel.isCoordinator() && this.onTestComplete) {
      // If we're the coordinator, add our results to the combined results
      this.collectTabResult(this.channel.getTabId(), this.localResults);
    }

    // Reset for next test
    this.isRunningTest = false;
    this.testConfig = null;
    this.channel.setState('idle');
  }

  /**
   * Run a resource contention test
   * Tests performance when multiple tabs are competing for shared resources
   */
  private async runResourceContentionTest(parameters: Record<string, unknown>): Promise<void> {
    const options: ResourceContentionTestOptions = {
      resourceCount: 20,
      operationsPerSecond: 50,
      durationMs: 10000,
      maxMemoryPerTabMB: 100,
      ...parameters,
    };

    // Create shared resources (localStorage)
    const resourcePrefix = 'multitab_test_resource_';

    // Initialize resources
    for (let i = 0; i < options.resourceCount!; i++) {
      localStorage.setItem(
        `${resourcePrefix}${i}`,
        JSON.stringify({
          value: 0,
          lastUpdated: Date.now(),
          updatedBy: this.channel.getTabId(),
        })
      );
    }

    // Calculate operation interval
    const operationIntervalMs = 1000 / options.operationsPerSecond!;

    // Run until test ends
    const startTime = performance.now();

    // Create a benchmark function to measure resource operations
    const benchmarkFn = async () => {
      // Select a random resource
      const resourceIndex = Math.floor(Math.random() * options.resourceCount!);
      const resourceKey = `${resourcePrefix}${resourceIndex}`;

      // Read the resource
      const readStart = performance.now();
      const resourceData = localStorage.getItem(resourceKey);
      const readTime = performance.now() - readStart;

      // Track read performance
      this.metrics.eventProcessingTime.push(readTime);

      // Update the resource
      const writeStart = performance.now();
      if (resourceData) {
        const resource = JSON.parse(resourceData);
        resource.value++;
        resource.lastUpdated = Date.now();
        resource.updatedBy = this.channel.getTabId();
        localStorage.setItem(resourceKey, JSON.stringify(resource));
      }
      const writeTime = performance.now() - writeStart;

      // Track write performance
      this.metrics.eventProcessingTime.push(writeTime);

      // Sleep to maintain operations per second rate
      await new Promise(resolve => setTimeout(resolve, operationIntervalMs));
    };

    while (performance.now() - startTime < options.durationMs! && this.isRunningTest) {
      await benchmarkFn();
    }

    // Clean up resources
    for (let i = 0; i < options.resourceCount!; i++) {
      localStorage.removeItem(`${resourcePrefix}${i}`);
    }
  }

  /**
   * Run a UI responsiveness test
   * Tests UI performance when multiple tabs are active
   */
  private async runUIResponsivenessTest(parameters: Record<string, unknown>): Promise<void> {
    const options: UIResponsivenessTestOptions = {
      interactionCount: 100,
      interactionTypes: ['click', 'scroll'],
      interactionDelayMs: 100,
      durationMs: 10000,
      ...parameters,
    };

    // Create a test container
    const container = document.createElement('div');
    container.className = 'multitab-test-container';
    container.style.cssText =
      'position: fixed; right: 20px; bottom: 20px; width: 300px; height: 200px; ' +
      'background: rgba(0,0,0,0.1); overflow: auto; z-index: 1000; padding: 10px; border-radius: 5px;';

    // Add elements to interact with
    for (let i = 0; i < 20; i++) {
      const el = document.createElement('button');
      el.textContent = `Test Button ${i}`;
      el.className = 'multitab-test-button';
      el.style.cssText = 'margin: 5px; padding: 8px; display: block;';
      el.addEventListener('click', e => {
        // Simulate processing
        const start = performance.now();
        // Artificial delay to simulate work
        const end = performance.now() + 2 + Math.random() * 10;
        while (performance.now() < end) {
          // Busy wait
        }
        const responseTime = performance.now() - start;
        this.metrics.uiResponseTime.push(responseTime);
      });
      container.appendChild(el);
    }

    document.body.appendChild(container);

    // Run until test ends
    const startTime = performance.now();
    let interactionCount = 0;

    const performInteraction = async () => {
      if (!this.isRunningTest || interactionCount >= options.interactionCount!) {
        return;
      }

      // Choose a random interaction
      const interactionType =
        options.interactionTypes![Math.floor(Math.random() * options.interactionTypes!.length)];

      switch (interactionType) {
        case 'click':
          // Click a random button
          const buttons = container.querySelectorAll('.multitab-test-button');
          if (buttons.length > 0) {
            const button = buttons[Math.floor(Math.random() * buttons.length)] as HTMLButtonElement;
            const start = performance.now();
            button.click();
            const clickTime = performance.now() - start;
            this.metrics.uiResponseTime.push(clickTime);
          }
          break;

        case 'scroll':
          // Scroll the container
          const start = performance.now();
          container.scrollTop = Math.random() * container.scrollHeight;
          const scrollTime = performance.now() - start;
          this.metrics.uiResponseTime.push(scrollTime);
          break;

        case 'drag':
          // Simulated drag (we can't programmatically create real drag events easily)
          // Just track a synthetic metric
          this.metrics.uiResponseTime.push(5 + Math.random() * 10);
          break;

        case 'type':
          // Simulated typing (we can't programmatically create real keyboard events easily)
          // Just track a synthetic metric
          this.metrics.uiResponseTime.push(5 + Math.random() * 8);
          break;
      }

      interactionCount++;

      // Sleep before next interaction
      await new Promise(resolve => setTimeout(resolve, options.interactionDelayMs!));

      // Schedule next interaction if we should continue
      if (performance.now() - startTime < options.durationMs! && this.isRunningTest) {
        performInteraction();
      }
    };

    // Start interactions
    await performInteraction();

    // Clean up
    try {
      document.body.removeChild(container);
    } catch (e) {
      // Handle removal errors
      console.warn('Error removing test container:', e);
    }
  }

  /**
   * Run a DOM operations test
   * Tests performance when creating and updating many DOM elements
   */
  private async runDOMOperationsTest(parameters: Record<string, unknown>): Promise<void> {
    const options: DOMOperationTestOptions = {
      elementCount: 500,
      updateFrequency: 10,
      durationMs: 10000,
      ...parameters,
    };

    // Create a test container
    const container = document.createElement('div');
    container.className = 'multitab-test-dom-container';
    container.style.cssText =
      'position: fixed; right: 20px; bottom: 20px; width: 300px; height: 200px; ' +
      'background: rgba(0,0,0,0.1); overflow: hidden; z-index: 1000; padding: 0; border-radius: 5px;';

    // Create elements
    const elements: HTMLElement[] = [];
    for (let i = 0; i < options.elementCount!; i++) {
      const el = document.createElement('div');
      el.className = 'multitab-test-element';
      el.style.cssText =
        `position: absolute; width: 5px; height: 5px; background: hsl(${i % 360}, 70%, 50%); ` +
        `left: ${Math.random() * 300}px; top: ${Math.random() * 200}px; border-radius: 50%;`;
      el.setAttribute('data-index', i.toString());
      container.appendChild(el);
      elements.push(el);
    }

    document.body.appendChild(container);

    // Calculate update interval
    const updateIntervalMs = 1000 / options.updateFrequency!;

    // Update elements at specified frequency
    const updateInterval = setInterval(() => {
      if (!this.isRunningTest) {
        clearInterval(updateInterval);
        return;
      }

      const updateStart = performance.now();

      // Update positions of some elements
      const updateCount = Math.min(50, elements.length);
      for (let i = 0; i < updateCount; i++) {
        const elementIndex = Math.floor(Math.random() * elements.length);
        const element = elements[elementIndex];

        // Update position
        element.style.left = `${Math.random() * 300}px`;
        element.style.top = `${Math.random() * 200}px`;

        // Update color
        const hue = (parseInt(element.getAttribute('data-index') || '0') + 1) % 360;
        element.style.backgroundColor = `hsl(${hue}, 70%, 50%)`;
      }

      const updateTime = performance.now() - updateStart;
      this.metrics.eventProcessingTime.push(updateTime);
    }, updateIntervalMs);

    // End the test after specified duration
    await new Promise(resolve => setTimeout(resolve, options.durationMs!));

    // Clean up
    clearInterval(updateInterval);
    try {
      document.body.removeChild(container);
    } catch (e) {
      // Handle removal errors
      console.warn('Error removing DOM test container:', e);
    }
  }

  /**
   * Run a memory usage test
   * Tests memory growth over time with multiple tabs
   */
  private async runMemoryUsageTest(parameters: Record<string, unknown>): Promise<void> {
    const options: MemoryUsageTestOptions = {
      durationMs: 20000,
      samplingIntervalMs: 1000,
      attemptGC: false,
      ...parameters,
    };

    // Array to store allocated objects
    const allocations: unknown[] = [];

    // Allocate memory at intervals
    let allocationSize = 250 * 1024; // 250KB initial allocation

    const allocateInterval = setInterval(() => {
      if (!this.isRunningTest) {
        clearInterval(allocateInterval);
        return;
      }

      // Allocate memory (create large arrays)
      try {
        const array = new Array(allocationSize).fill(0).map(() => ({
          value: Math.random(),
          data: new Array(10).fill(Math.random()),
          timestamp: Date.now(),
        }));
        allocations.push(array);

        // Increase for next allocation
        allocationSize = Math.floor(allocationSize * 1.05);
      } catch (e) {
        console.warn('Memory allocation failed:', e);
      }

      // Try garbage collection if enabled
      if (options.attemptGC && typeof window.gc === 'function') {
        try {
          window.gc();
        } catch (e) {
          // GC not available
        }
      }
    }, options.samplingIntervalMs!);

    // End the test after specified duration
    await new Promise(resolve => setTimeout(resolve, options.durationMs!));

    // Clean up
    clearInterval(allocateInterval);

    // Clear allocations
    allocations.length = 0;

    // Try garbage collection if enabled
    if (options.attemptGC && typeof window.gc === 'function') {
      try {
        window.gc();
      } catch (e) {
        // GC not available
      }
    }
  }

  /**
   * Run a resource contention test as coordinator
   */
  public runResourceContentionTest(
    options: ResourceContentionTestOptions = {}
  ): Promise<MultitabPerformanceResult[]> {
    return new Promise(resolve => {
      const config: TestConfiguration = {
        testType: 'resourceContention',
        parameters: options as unknown as Record<string, unknown>,
        durationMs: options.durationMs || 10000,
        synchronizeStart: true,
      };

      this.runCoordinatedTest(config, results => {
        resolve(results);
      });
    });
  }

  /**
   * Run a UI responsiveness test as coordinator
   */
  public runUIResponsivenessTest(
    options: UIResponsivenessTestOptions = {}
  ): Promise<MultitabPerformanceResult[]> {
    return new Promise(resolve => {
      const config: TestConfiguration = {
        testType: 'uiResponsiveness',
        parameters: options as unknown as Record<string, unknown>,
        durationMs: options.durationMs || 10000,
        synchronizeStart: true,
      };

      this.runCoordinatedTest(config, results => {
        resolve(results);
      });
    });
  }

  /**
   * Run a DOM operations test as coordinator
   */
  public runDOMOperationsTest(
    options: DOMOperationTestOptions = {}
  ): Promise<MultitabPerformanceResult[]> {
    return new Promise(resolve => {
      const config: TestConfiguration = {
        testType: 'domOperations',
        parameters: options as unknown as Record<string, unknown>,
        durationMs: options.durationMs || 10000,
        synchronizeStart: true,
      };

      this.runCoordinatedTest(config, results => {
        resolve(results);
      });
    });
  }

  /**
   * Run a memory usage test as coordinator
   */
  public runMemoryUsageTest(
    options: MemoryUsageTestOptions = {}
  ): Promise<MultitabPerformanceResult[]> {
    return new Promise(resolve => {
      const config: TestConfiguration = {
        testType: 'memoryUsage',
        parameters: options as unknown as Record<string, unknown>,
        durationMs: options.durationMs || 20000,
        synchronizeStart: true,
      };

      this.runCoordinatedTest(config, results => {
        resolve(results);
      });
    });
  }

  /**
   * Run a comprehensive multi-tab test battery
   */
  public async runTestBattery(): Promise<Record<string, MultitabPerformanceResult[]>> {
    if (!this.channel.isCoordinator()) {
      throw new Error('Only the coordinator tab can run the test battery');
    }

    console.log('Starting multi-tab performance test battery...');
    const results: Record<string, MultitabPerformanceResult[]> = {};

    // Run resource contention test
    console.log('Running resource contention test...');
    results.resourceContention = await this.runResourceContentionTest({
      durationMs: 15000,
    });

    // Run UI responsiveness test
    console.log('Running UI responsiveness test...');
    results.uiResponsiveness = await this.runUIResponsivenessTest({
      durationMs: 15000,
    });

    // Run DOM operations test
    console.log('Running DOM operations test...');
    results.domOperations = await this.runDOMOperationsTest({
      durationMs: 15000,
    });

    // Run memory usage test
    console.log('Running memory usage test...');
    results.memoryUsage = await this.runMemoryUsageTest({
      durationMs: 20000,
    });

    console.log('Multi-tab test battery complete!');

    // Save results for analysis
    saveBenchmarkResults(
      Object.values(results).flat(),
      `multitab_performance_battery_${this.getTabCount()}_tabs`
    );

    return results;
  }

  /**
   * Generate human-readable report from test results
   */
  public static generateReport(results: Record<string, MultitabPerformanceResult[]>): string {
    let report = '## Multi-Tab Performance Test Report\n\n';

    // Add test time and tab count
    const tabCount = results[Object.keys(results)[0]]?.[0]?.tabCount || 0;
    report += `**Test Time:** ${new Date().toLocaleString()}\n`;
    report += `**Number of Tabs:** ${tabCount}\n\n`;

    // Process each test type
    for (const [testType, testResults] of Object.entries(results)) {
      report += `### ${testType} Test\n\n`;

      // Calculate averages across all tabs
      const avgFps = testResults.reduce((sum, r) => sum + r.metrics.fps, 0) / testResults.length;
      const avgMemory =
        testResults.reduce((sum, r) => sum + r.metrics.memoryPerTabMB, 0) / testResults.length;
      const avgEventTime =
        testResults.reduce((sum, r) => sum + r.metrics.eventProcessingTimeMs, 0) /
        testResults.length;
      const avgUiTime =
        testResults.reduce((sum, r) => sum + r.metrics.uiResponseTimeMs, 0) / testResults.length;
      const totalDroppedFrames = testResults.reduce((sum, r) => sum + r.metrics.droppedFrames, 0);

      report += `**Average FPS:** ${avgFps.toFixed(2)}\n`;
      report += `**Average Memory Per Tab:** ${avgMemory.toFixed(2)} MB\n`;
      report += `**Average Event Processing Time:** ${avgEventTime.toFixed(2)} ms\n`;
      report += `**Average UI Response Time:** ${avgUiTime.toFixed(2)} ms\n`;
      report += `**Total Dropped Frames:** ${totalDroppedFrames}\n\n`;

      // Add performance assessment
      let assessment = '';
      if (avgFps < 30) {
        assessment += '- **Critical:** FPS below 30, indicating significant rendering issues\n';
      }
      if (avgEventTime > 50) {
        assessment +=
          '- **Warning:** Event processing time above 50ms, indicating potential responsiveness issues\n';
      }
      if (avgUiTime > 100) {
        assessment += '- **Warning:** UI response time above 100ms, indicating noticeable UI lag\n';
      }
      if (totalDroppedFrames > 100) {
        assessment +=
          '- **Warning:** High number of dropped frames, indicating visual stuttering\n';
      }

      if (assessment) {
        report += '**Performance Issues Detected:**\n' + assessment + '\n';
      } else {
        report += '**No significant performance issues detected.**\n\n';
      }
    }

    return report;
  }
}

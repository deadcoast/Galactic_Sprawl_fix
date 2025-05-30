/**
 * LongSessionMemoryTracker
 *
 * A utility for tracking memory usage over extended application sessions.
 * It helps identify memory leaks and gradual performance degradation that
 * only become apparent with prolonged application use.
 *
 * Features:
 * - Periodic memory snapshots
 * - Memory growth trend analysis
 * - Leak detection with statistical analysis
 * - Timeline visualization data
 * - Memory allocation and garbage collection tracking
 */

import { moduleEventBus } from '../../../lib/modules/ModuleEvents';

// Define our memory metrics interface for internal use without extending global interfaces
interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Extend the Window interface to potentially support manual GC
declare global {
  interface Window {
    gc?: () => void;
  }
}

/** Memory snapshot data structure */
export interface MemorySnapshot {
  /** Timestamp when the snapshot was taken (ms since epoch) */
  timestamp: number;

  /** Used JavaScript heap size (MB) */
  usedHeapSizeMB: number;

  /** Total allocated JavaScript heap size (MB) */
  totalHeapSizeMB: number;

  /** Maximum JavaScript heap size limit (MB) */
  heapLimitMB: number;

  /** DOM node count (if available) */
  domNodeCount?: number;

  /** Number of detached DOM nodes (if available) */
  detachedDomNodes?: number;

  /** Event listeners count (if available) */
  eventListenerCount?: number;

  /** Active timers count (if available) */
  timerCount?: number;

  /** Active animation frames (if available) */
  animationFrameCount?: number;

  /** Number of large arrays (>10K elements) in memory (if available) */
  largeArrayCount?: number;

  /** Number of active XHR objects (if available) */
  xhrCount?: number;

  /** Number of active fetch requests (if available) */
  fetchCount?: number;

  /** Custom metadata for this snapshot */
  metadata?: Record<string, unknown>;
}

/** Memory trend analysis result */
export interface MemoryTrendAnalysis {
  /** Overall trend (positive means growth, negative means reduction) */
  overallTrend: number;

  /** Growth rate per minute (MB/min) */
  growthRatePerMinute: number;

  /** Growth rate per hour (MB/hour) */
  growthRatePerHour: number;

  /** Extrapolated time until memory limit is reached (ms) */
  estimatedTimeToLimit: number;

  /** Whether memory growth is accelerating */
  isAccelerating: boolean;

  /** Confidence in this analysis (0-1) */
  confidence: number;

  /** Whether there is a suspected memory leak */
  suspectedLeak: boolean;

  /** Potential leak cause if identified */
  leakCause?: string;

  /** Leak severity (1-5, 5 being most severe) */
  leakSeverity?: number;
}

/** Configuration options for the memory tracker */
export interface MemoryTrackerOptions {
  /** Interval between memory snapshots (ms) */
  snapshotIntervalMs?: number;

  /** Maximum number of snapshots to keep */
  maxSnapshots?: number;

  /** Whether to attempt to get detailed memory info */
  detailedMemoryInfo?: boolean;

  /** Whether to track DOM nodes */
  trackDomNodes?: boolean;

  /** Whether to track detached DOM nodes */
  trackDetachedNodes?: boolean;

  /** Whether to attempt garbage collection before snapshots */
  attemptGarbageCollection?: boolean;

  /** Whether to periodically send memory reports to the event bus */
  reportToEventBus?: boolean;

  /** Report interval in ms (how often to send reports) */
  reportIntervalMs?: number;

  /** Threshold for leak detection (growth rate in MB/min) */
  leakThresholdMBPerMinute?: number;

  /** Logging level (0=none, 1=errors, 2=warnings, 3=info) */
  loggingLevel?: number;

  /** Callback when a memory snapshot is taken */
  onSnapshot?: (snapshot: MemorySnapshot) => void;

  /** Callback when memory analysis is updated */
  onAnalysisUpdate?: (analysis: MemoryTrendAnalysis) => void;

  /** Callback when a potential memory leak is detected */
  onLeakDetected?: (analysis: MemoryTrendAnalysis) => void;
}

/**
 * Default configuration for memory tracking
 */
const DEFAULT_OPTIONS: MemoryTrackerOptions = {
  snapshotIntervalMs: 60000, // 1 minute
  maxSnapshots: 120, // 2 hours of data at 1 snapshot per minute
  detailedMemoryInfo: true,
  trackDomNodes: true,
  trackDetachedNodes: false, // Expensive operation, off by default
  attemptGarbageCollection: false,
  reportToEventBus: true,
  reportIntervalMs: 300000, // 5 minutes
  leakThresholdMBPerMinute: 0.5, // 0.5 MB per minute sustained growth could indicate a leak
  loggingLevel: 2,
  onSnapshot: undefined,
  onAnalysisUpdate: undefined,
  onLeakDetected: undefined,
};

/**
 * Core class for tracking memory usage over extended sessions
 */
export class LongSessionMemoryTracker {
  /** Memory snapshots collected over time */
  private snapshots: MemorySnapshot[] = [];

  /** Timestamp when tracking started */
  private startTime: number;

  /** Latest memory analysis */
  private latestAnalysis: MemoryTrendAnalysis | null = null;

  /** Configuration options */
  private options: MemoryTrackerOptions;

  /** Interval ID for snapshots */
  private snapshotIntervalId: number | null = null;

  /** Interval ID for reporting */
  private reportIntervalId: number | null = null;

  /** Whether tracking is currently active */
  private isTracking = false;

  /** Browser support info */
  private browserSupport = {
    memoryAPI: false,
    performanceAPI: false,
    domCountAPI: false,
    gc: false,
  };

  /** Session markers for significant events */
  private sessionMarkers: {
    timestamp: number;
    name: string;
    metadata?: Record<string, unknown>;
  }[] = [];

  /**
   * Create a new memory tracker
   */
  constructor(options: MemoryTrackerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.startTime = Date.now();
    this.detectBrowserSupport();
  }

  /**
   * Detect browser API support
   */
  private detectBrowserSupport(): void {
    // Check Performance API support
    this.browserSupport.performanceAPI = typeof performance !== 'undefined';

    // Check Memory API support (Chrome)
    this.browserSupport.memoryAPI =
      this.browserSupport.performanceAPI &&
      typeof performance !== 'undefined' &&
      'memory' in performance;

    // Check DOM Count API support
    this.browserSupport.domCountAPI =
      typeof document !== 'undefined' && typeof document.querySelectorAll === 'function';

    // Check GC support (rarely available in browsers)
    this.browserSupport.gc = typeof window !== 'undefined' && typeof window.gc === 'function';

    if (this.options?.loggingLevel && this.options?.loggingLevel >= 3) {
      console.warn('[LongSessionMemoryTracker] Browser support detected:', this.browserSupport);
    }

    // Warn if memory API not available
    if (
      !this.browserSupport.memoryAPI &&
      this.options?.loggingLevel &&
      this.options?.loggingLevel >= 2
    ) {
      console.warn(
        '[LongSessionMemoryTracker] Performance.memory API not available in this browser. Memory tracking will be limited.'
      );
    }
  }

  /**
   * Start tracking memory usage
   */
  public startTracking(): void {
    if (this.isTracking) return;
    this.isTracking = true;

    this.startTime = Date.now();
    this.snapshots = [];
    this.sessionMarkers = [];

    // Take initial snapshot
    this.takeSnapshot();

    // Set up periodic snapshots
    this.snapshotIntervalId = window.setInterval(
      () => this.takeSnapshot(),
      this.options?.snapshotIntervalMs ?? DEFAULT_OPTIONS.snapshotIntervalMs!
    );

    // Set up periodic reporting if enabled
    if (this.options?.reportToEventBus) {
      this.reportIntervalId = window.setInterval(
        () => this.sendMemoryReport(),
        this.options?.reportIntervalMs ?? DEFAULT_OPTIONS.reportIntervalMs!
      );
    }

    if (this.options?.loggingLevel && this.options?.loggingLevel >= 3) {
      console.warn('[LongSessionMemoryTracker] Started tracking memory usage');
    }

    // Add session start marker
    this.addSessionMarker('tracking_started');
  }

  /**
   * Stop tracking memory usage
   */
  public stopTracking(): void {
    if (!this.isTracking) return;

    // Clear intervals
    if (this.snapshotIntervalId !== null) {
      clearInterval(this.snapshotIntervalId);
      this.snapshotIntervalId = null;
    }

    if (this.reportIntervalId !== null) {
      clearInterval(this.reportIntervalId);
      this.reportIntervalId = null;
    }

    this.isTracking = false;

    // Take one final snapshot
    this.takeSnapshot();

    // Add session end marker
    this.addSessionMarker('tracking_stopped');

    if (this.options?.loggingLevel && this.options?.loggingLevel >= 3) {
      console.warn('[LongSessionMemoryTracker] Stopped tracking memory usage');
    }
  }

  /**
   * Take a memory snapshot
   */
  public takeSnapshot(): MemorySnapshot {
    // Run garbage collection if configured and supported
    if (this.options?.attemptGarbageCollection && this.browserSupport.gc) {
      try {
        this.attemptGarbageCollection();
      } catch (_e) {
        // Ignore errors from GC attempts
      }
    }

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedHeapSizeMB: 0,
      totalHeapSizeMB: 0,
      heapLimitMB: 0,
    };

    // Add memory info if available
    if (this.browserSupport.memoryAPI && performance && 'memory' in performance) {
      // Type assertion as our internal interface
      const memoryInfo = performance.memory as unknown as MemoryMetrics;

      // Access properties safely with nullish coalescing for defaults
      snapshot.usedHeapSizeMB = (memoryInfo.usedJSHeapSize ?? 0) / (1024 * 1024);
      snapshot.totalHeapSizeMB = (memoryInfo.totalJSHeapSize ?? 0) / (1024 * 1024);
      snapshot.heapLimitMB = (memoryInfo.jsHeapSizeLimit ?? 0) / (1024 * 1024);
    }

    // Count DOM nodes if configured and supported
    if (this.options?.trackDomNodes && this.browserSupport.domCountAPI) {
      snapshot.domNodeCount = document.querySelectorAll('*').length;
    }

    // Add to snapshots array, ensuring we don't exceed maximum
    this.snapshots.push(snapshot);
    if (this.snapshots.length > (this.options?.maxSnapshots ?? DEFAULT_OPTIONS.maxSnapshots!)) {
      this.snapshots.shift();
    }

    // Run analysis after sufficient data is collected
    if (this.snapshots.length >= 3) {
      this.analyzeMemoryTrend();
    }

    // Notify via callback if configured
    if (this.options?.onSnapshot) {
      this.options.onSnapshot(snapshot);
    }

    return snapshot;
  }

  /**
   * Analyze memory usage trend
   */
  private analyzeMemoryTrend(): void {
    // Need at least 3 snapshots for a meaningful trend analysis
    if (this.snapshots.length < 3) return;

    // Extract data points for analysis
    const snapshots = [...this.snapshots];
    const timestamps = snapshots.map(s => s.timestamp);
    const memoryValues = snapshots.map(s => s.usedHeapSizeMB);

    // Calculate trend with linear regression
    const {
      slope,
      intercept: _intercept,
      correlation,
    } = this.calculateLinearRegression(timestamps, memoryValues);

    // Convert to more meaningful metrics
    // MB per millisecond to MB per minute
    const growthRatePerMinute = slope * 60000;
    // MB per minute to MB per hour
    const growthRatePerHour = growthRatePerMinute * 60;

    // Calculate estimated time until memory limit (if we have memory limit info)
    let estimatedTimeToLimit = Number.POSITIVE_INFINITY;
    const latestSnapshot = snapshots[snapshots.length - 1];

    if (slope > 0 && latestSnapshot.heapLimitMB > 0) {
      const remainingMemory = latestSnapshot.heapLimitMB - latestSnapshot.usedHeapSizeMB;
      estimatedTimeToLimit = remainingMemory / slope; // in ms
    }

    // Is memory growth accelerating?
    const isAccelerating = this.isGrowthAccelerating(timestamps, memoryValues);

    // Calculate confidence level
    const confidence =
      Math.min(
        snapshots.length / 10, // More data points = higher confidence, max at 10 points
        1 // Cap at 1.0
      ) * Math.abs(correlation); // Scale by correlation strength

    // Detect potential memory leak
    const suspectedLeak =
      growthRatePerMinute >
        (this.options?.leakThresholdMBPerMinute ?? DEFAULT_OPTIONS.leakThresholdMBPerMinute!) &&
      confidence > 0.7 &&
      snapshots.length >= 5; // Need at least 5 data points

    // Create analysis result
    const analysis: MemoryTrendAnalysis = {
      overallTrend: slope,
      growthRatePerMinute,
      growthRatePerHour,
      estimatedTimeToLimit,
      isAccelerating,
      confidence,
      suspectedLeak,
    };

    // Add leak severity if a leak is suspected
    if (suspectedLeak) {
      analysis.leakSeverity = this.calculateLeakSeverity(growthRatePerMinute);

      // Try to identify the cause
      if (isAccelerating) {
        analysis.leakCause = 'Accelerating memory growth suggests an uncontrolled object creation';
      } else if (this.sessionMarkers.length > 0) {
        // Check if there's correlation with session markers
        // This is a simplified approach - a real implementation would need more sophisticated analysis
        analysis.leakCause = 'Possible correlation with recent system events';
      }
    }

    // Update latest analysis
    this.latestAnalysis = analysis;

    // Notify via callbacks if configured
    if (this.options?.onAnalysisUpdate) {
      this.options.onAnalysisUpdate(analysis);
    }

    if (suspectedLeak && this.options?.onLeakDetected) {
      this.options.onLeakDetected(analysis);
    }

    // Log results if configured
    if (this.options?.loggingLevel && this.options?.loggingLevel >= 3) {
      console.warn('[LongSessionMemoryTracker] Memory trend analysis:', analysis);
    } else if (suspectedLeak && this.options?.loggingLevel && this.options?.loggingLevel >= 2) {
      console.warn('[LongSessionMemoryTracker] Potential memory leak detected:', analysis);
    }
  }

  /**
   * Calculate linear regression on time series data
   */
  private calculateLinearRegression(
    xValues: number[],
    yValues: number[]
  ): { slope: number; intercept: number; correlation: number } {
    const n = xValues.length;

    if (n === 0 || xValues.length !== yValues.length) {
      return { slope: 0, intercept: 0, correlation: 0 };
    }

    // Convert timestamps to seconds from start to avoid precision issues
    const startTime = xValues[0];
    const xValuesNormalized = xValues.map(x => (x - startTime) / 1000);

    // Calculate means
    const meanX = xValuesNormalized.reduce((sum, x) => sum + x, 0) / n;
    const meunknown = yValues.reduce((sum, y) => sum + y, 0) / n;

    // Calculate sums for regression formula
    let numerator = 0;
    let denominator = 0;
    let sumSquaredErrors = 0;
    let totalSumOfSquares = 0;

    for (let i = 0; i < n; i++) {
      const x = xValuesNormalized[i];
      const y = yValues[i];

      const xDiff = x - meanX;
      const yDiff = y - meunknown;

      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
      totalSumOfSquares += yDiff * yDiff;
    }

    // Avoid division by zero
    if (denominator === 0) {
      return { slope: 0, intercept: meunknown, correlation: 0 };
    }

    // Calculate regression parameters
    const slope = numerator / denominator;
    const intercept = meunknown - slope * meanX;

    // Calculate predicted values and sum of squared errors
    for (let i = 0; i < n; i++) {
      const predicted = slope * xValuesNormalized[i] + intercept;
      sumSquaredErrors += Math.pow(yValues[i] - predicted, 2);
    }

    // Calculate correlation coefficient
    let correlation = 0;
    if (totalSumOfSquares > 0) {
      correlation = Math.sqrt(1 - sumSquaredErrors / totalSumOfSquares);

      // Adjust sign based on slope
      if (slope < 0) correlation = -correlation;
    }

    // Convert slope back to original time units (MB per ms)
    const originalSlope = slope / 1000;

    return { slope: originalSlope, intercept, correlation };
  }

  /**
   * Determine if memory growth is accelerating
   */
  private isGrowthAccelerating(timestamps: number[], memoryValues: number[]): boolean {
    if (timestamps.length < 6) return false; // Need at least 6 points for reliable acceleration detection

    // Split data into first and second half
    const midpoint = Math.floor(timestamps.length / 2);
    const firstHalfX = timestamps.slice(0, midpoint);
    const firstHalfY = memoryValues.slice(0, midpoint);
    const secondHalfX = timestamps.slice(midpoint);
    const secondHalfY = memoryValues.slice(midpoint);

    // Calculate growth rate for each half
    const firstHalfRegression = this.calculateLinearRegression(firstHalfX, firstHalfY);
    const secondHalfRegression = this.calculateLinearRegression(secondHalfX, secondHalfY);

    // Compare slopes
    return secondHalfRegression.slope > firstHalfRegression.slope * 1.2; // 20% faster growth = acceleration
  }

  /**
   * Calculate leak severity on a scale of 1-5
   */
  private calculateLeakSeverity(growthRatePerMinute: number): number {
    // Scale from 1-5 based on growth rate
    // 1: slow leak (<1MB/min)
    // 2: moderate leak (1-2MB/min)
    // 3: significant leak (2-5MB/min)
    // 4: serious leak (5-10MB/min)
    // 5: critical leak (>10MB/min)

    if (growthRatePerMinute >= 10) return 5;
    if (growthRatePerMinute >= 5) return 4;
    if (growthRatePerMinute >= 2) return 3;
    if (growthRatePerMinute >= 1) return 2;
    return 1;
  }

  /**
   * Get all collected memory snapshots
   */
  public getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get the latest memory analysis
   */
  public getLatestAnalysis(): MemoryTrendAnalysis | null {
    return this.latestAnalysis;
  }

  /**
   * Add a session marker for significant events
   */
  public addSessionMarker(name: string, metadata?: Record<string, unknown>): void {
    this.sessionMarkers.push({
      timestamp: Date.now(),
      name,
      metadata,
    });
  }

  /**
   * Get all session markers
   */
  public getSessionMarkers(): {
    timestamp: number;
    name: string;
    metadata?: Record<string, unknown>;
  }[] {
    return [...this.sessionMarkers];
  }

  /**
   * Send memory report to event bus
   */
  private sendMemoryReport(): void {
    if (!this.options?.reportToEventBus || !this.isTracking || !this.latestAnalysis) return;

    moduleEventBus.emit({
      type: 'STATUS_CHANGED',
      moduleId: 'long-session-memory-tracker',
      moduleType: 'resource-manager', // Using the correct ModuleType from ModuleEventTypes
      timestamp: Date.now(),
      data: {
        type: 'memory_report',
        snapshots: this.snapshots.slice(-10), // Only send most recent 10 snapshots
        analysis: this.latestAnalysis,
        markers: this.sessionMarkers.slice(-5), // Only send most recent 5 markers
        sessionDurationMs: Date.now() - this.startTime,
      },
    });
  }

  /**
   * Get total session duration in milliseconds
   */
  public getSessionDurationMs(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Force run garbage collection (if supported)
   */
  public attemptGarbageCollection(): boolean {
    if (!this.browserSupport.gc || !window.gc) {
      return false;
    }

    try {
      window.gc();
      return true;
    } catch (_e) {
      // Silent fail - GC is not critical
      return false;
    }
  }

  /**
   * Clear all accumulated data (snapshots and markers)
   */
  public clearData(): void {
    this.snapshots = [];
    this.sessionMarkers = [];
    this.latestAnalysis = null;
  }
}

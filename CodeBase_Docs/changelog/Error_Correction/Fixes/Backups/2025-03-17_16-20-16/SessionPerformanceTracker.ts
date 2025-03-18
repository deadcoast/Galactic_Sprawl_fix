/**
 * SessionPerformanceTracker
 *
 * A service that anonymously tracks performance metrics during user sessions.
 * Collects, aggregates, and reports performance data without storing personally
 * identifiable information.
 */

import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { ModuleEvent } from '../../types/events/ModuleEventTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";
import { generateAnonymousId } from '../../utils/idGenerator';

/**
 * Session identification data
 */
export interface SessionMetadata {
  sessionId: string;
  deviceCategory: 'desktop' | 'tablet' | 'mobile' | 'unknown';
  browserCategory: string;
  viewportWidth: number;
  viewportHeight: number;
  startTimestamp: number;
  geographicRegion?: string;
  connectionType?: string;
  memoryEstimate?: number;
}

/**
 * Performance metrics collected during a session
 */
export interface SessionPerformanceData {
  sessionId: string;
  timestamp: number;
  metrics: {
    fps: number;
    memoryUsage: number;
    cpuUsage: number;
    resourceUtilization: Map<ResourceType, number>;
    renderTime: number;
    eventProcessingTime: number;
    interactionLatency: number;
    loadTimes: {
      [componentId: string]: number;
    };
    eventCounts: {
      [eventType: string]: number;
    };
  };
  userInteractions: UserInteractionData[];
  errors: ErrorData[];
}

/**
 * Data about user interactions with timestamps and performance metrics
 */
export interface UserInteractionData {
  interactionType: 'click' | 'hover' | 'scroll' | 'keypress' | 'custom';
  targetComponent?: string;
  timestamp: number;
  responseTime: number;
  successful: boolean;
}

/**
 * Error information for tracking performance-related errors
 */
export interface ErrorData {
  errorType: string;
  message: string;
  timestamp: number;
  componentId?: string;
  stackSummary?: string;
  affectedResource?: ResourceType;
}

/**
 * Options for telemetry collection
 */
export interface TelemetryOptions {
  collectionEnabled: boolean;
  samplingRate: number; // 0.0 to 1.0
  anonymousIdSeed?: string;
  geolocationEnabled: boolean;
  performanceDetailLevel: 'minimal' | 'standard' | 'detailed';
  transmitIntervalMs: number;
  maxBatchSize: number;
  errorSamplingRate: number; // 0.0 to 1.0
}

// Browser API interfaces to avoid 'any' usage
interface NavigatorExtended extends Navigator {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    type?: string;
  };
  getBattery?: () => Promise<{
    charging: boolean;
    level: number;
  }>;
}

interface PerformanceExtended extends Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

/**
 * Service that tracks anonymous session performance metrics
 */
export class SessionPerformanceTracker {
  private isEnabled: boolean;
  private sessionMetadata!: SessionMetadata; // Using definite assignment assertion
  private performanceData: SessionPerformanceData[] = [];
  private options: TelemetryOptions;
  private transmitInterval: number | null = null;
  private eventSubscription: (() => void) | null = null;
  private interactionObservers: Map<string, () => void> = new Map();
  private componentLoadTimers: Map<string, number> = new Map();
  private startTime: number;
  private lastTransmitTime: number;
  private accumulatedEventCounts: Record<string, number> = {};

  /**
   * Initialize the session performance tracker
   */
  constructor(options?: Partial<TelemetryOptions>) {
    this.startTime = performance.now();
    this.lastTransmitTime = this.startTime;

    // Set default options
    this.options = {
      collectionEnabled: true,
      samplingRate: 0.1, // Only track 10% of sessions by default
      geolocationEnabled: false,
      performanceDetailLevel: 'standard',
      transmitIntervalMs: 60000, // Transmit data every minute
      maxBatchSize: 50,
      errorSamplingRate: 1.0, // Track all errors
      ...options,
    };

    // Only enable tracking if it passes the sampling threshold
    const samplingValue = Math.random();
    this.isEnabled = this.options.collectionEnabled && samplingValue <= this.options.samplingRate;

    if (!this.isEnabled) {
      console.warn('[SessionPerformanceTracker] Telemetry disabled due to sampling');
      return;
    }

    // Create session metadata
    this.sessionMetadata = this.generateSessionMetadata();

    // Initialize performance data for the current session
    this.initializeCurrentSessionData();

    // Subscribe to system events
    this.subscribeToEvents();

    // Set up interaction tracking
    this.setupInteractionTracking();

    // Start transmission cycle
    this.startTransmissionCycle();

    console.warn(
      `[SessionPerformanceTracker] Initialized session: ${this.sessionMetadata.sessionId}`
    );
  }

  /**
   * Generate anonymous session metadata
   */
  private generateSessionMetadata(): SessionMetadata {
    // Create an anonymous ID that doesn't contain PII
    const sessionId = generateAnonymousId(this.options.anonymousIdSeed);

    // Detect device type from user agent and screen size
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    let deviceCategory: 'desktop' | 'tablet' | 'mobile' | 'unknown' = 'unknown';
    if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
      deviceCategory = screenWidth >= 768 ? 'tablet' : 'mobile';
    } else {
      deviceCategory = 'desktop';
    }

    // Determine browser category without version info for anonymity
    let browserCategory = 'unknown';
    if (userAgent.includes('firefox')) {
      browserCategory = 'firefox';
    } else if (userAgent.includes('chrome')) {
      browserCategory = 'chrome';
    } else if (userAgent.includes('safari')) {
      browserCategory = 'safari';
    } else if (userAgent.includes('edge')) {
      browserCategory = 'edge';
    }

    // Get viewport size
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get optional connection information if available
    const nav = navigator as NavigatorExtended;
    let connectionType: string | undefined;
    if (nav.connection) {
      connectionType = nav.connection.effectiveType || nav.connection.type;
    }

    // Estimate memory if available
    let memoryEstimate: number | undefined;
    if (nav.deviceMemory) {
      memoryEstimate = nav.deviceMemory;
    } else if ((performance as PerformanceExtended).memory) {
      memoryEstimate = (performance as PerformanceExtended).memory!.jsHeapSizeLimit / 1048576; // Convert to MB
    }

    // Optional geographic region if enabled (coarse-grained only)
    let geographicRegion: string | undefined;
    if (this.options.geolocationEnabled) {
      // Only collect broad region data, not specific coordinates
      if (navigator.language) {
        // Just use language/region preference as a proxy
        geographicRegion = navigator.language.split('-')[1] || navigator.language;
      }
    }

    return {
      sessionId,
      deviceCategory,
      browserCategory,
      viewportWidth,
      viewportHeight,
      startTimestamp: Date.now(),
      connectionType,
      memoryEstimate,
      geographicRegion,
    };
  }

  /**
   * Initialize performance data structure for the current session
   */
  private initializeCurrentSessionData(): void {
    const currentData: SessionPerformanceData = {
      sessionId: this.sessionMetadata.sessionId,
      timestamp: Date.now(),
      metrics: {
        fps: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        resourceUtilization: new Map(),
        renderTime: 0,
        eventProcessingTime: 0,
        interactionLatency: 0,
        loadTimes: {},
        eventCounts: {},
      },
      userInteractions: [],
      errors: [],
    };

    this.performanceData.push(currentData);
  }

  /**
   * Subscribe to system events for performance monitoring
   */
  private subscribeToEvents(): void {
    if (!this.isEnabled) return;

    this.eventSubscription = moduleEventBus.subscribe({
      topic: 'STATUS_CHANGED',
      callback: (event: ModuleEvent) => {
        this.trackEvent(event);

        // Track specific performance-related events
        if (event.moduleId === 'game-loop-manager') {
          if (event.data.type === 'performance_snapshot') {
            this.trackPerformanceSnapshot(event.data);
          }
        }

        // Track errors
        if (event.type === 'ERROR') {
          this.trackError({
            errorType: event.data.type || 'unknown',
            message: (event.data.message as string) || 'Unknown error',
            timestamp: event.timestamp,
            componentId: event.moduleId,
            affectedResource: event.data.resourceType as ResourceType,
          });
        }
      },
    });
  }

  /**
   * Set up tracking for user interactions
   */
  private setupInteractionTracking(): void {
    if (!this.isEnabled) return;

    // Track clicks
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const componentId = target.getAttribute('data-component-id') || target.id || target.tagName;

      const startTime = performance.now();

      // Add a one-time callback to requestAnimationFrame to measure response time
      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTime;

        this.trackUserInteraction({
          interactionType: 'click',
          targetComponent: componentId,
          timestamp: Date.now(),
          responseTime,
          successful: true,
        });
      });
    };

    document.addEventListener('click', clickHandler);
    this.interactionObservers.set('click', () => {
      document.removeEventListener('click', clickHandler);
    });

    // Track scrolling performance
    let lastScrollTime = 0;
    const scrollTimeouts: number[] = [];

    const scrollHandler = () => {
      const now = performance.now();
      const timeSinceLastScroll = now - lastScrollTime;
      lastScrollTime = now;

      // Only track if it's been a while since the last scroll
      // to avoid tracking every tiny scroll event
      if (timeSinceLastScroll > 500) {
        const scrollTimeout = window.setTimeout(() => {
          this.trackUserInteraction({
            interactionType: 'scroll',
            timestamp: Date.now(),
            responseTime: performance.now() - now,
            successful: true,
          });
        }, 100);

        scrollTimeouts.push(scrollTimeout);
      }
    };

    document.addEventListener('scroll', scrollHandler, { passive: true });
    this.interactionObservers.set('scroll', () => {
      document.removeEventListener('scroll', scrollHandler);
      scrollTimeouts.forEach(clearTimeout);
    });
  }

  /**
   * Start periodic transmission of telemetry data
   */
  private startTransmissionCycle(): void {
    if (!this.isEnabled) return;

    this.transmitInterval = window.setInterval(() => {
      this.transmitTelemetryData();
    }, this.options.transmitIntervalMs);
  }

  /**
   * Track a system event for telemetry
   */
  private trackEvent(event: ModuleEvent): void {
    if (!this.isEnabled) return;

    // Increment event count
    const eventType = `${event.type}:${event.data.type || 'unknown'}`;
    this.accumulatedEventCounts[eventType] = (this.accumulatedEventCounts[eventType] || 0) + 1;

    // For detailed level, track event processing time
    if (this.options.performanceDetailLevel === 'detailed') {
      const startTime = performance.now();

      // Measure how long the event takes to be processed
      // This is a simplification - in reality we would measure actual handler execution
      setTimeout(() => {
        const processingTime = performance.now() - startTime;

        // Update event processing time metric (rolling average)
        const current = this.getCurrentSessionData();
        current.metrics.eventProcessingTime =
          (current.metrics.eventProcessingTime + processingTime) / 2;
      }, 0);
    }
  }

  /**
   * Track a performance snapshot
   */
  private trackPerformanceSnapshot(data: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const current = this.getCurrentSessionData();

    // Update general metrics
    if (typeof data.fps === 'number') {
      current.metrics.fps = data.fps;
    }

    if (typeof data.memoryUsage === 'number') {
      current.metrics.memoryUsage = data.memoryUsage;
    }

    if (typeof data.cpuUsage === 'number') {
      current.metrics.cpuUsage = data.cpuUsage;
    }

    // Update resource utilization
    if (data.resourceUtilization && typeof data.resourceUtilization === 'object') {
      const utilization = data.resourceUtilization as Record<string, number>;
      for (const [resource, value] of Object.entries(utilization)) {
        current.metrics.resourceUtilization.set(resource as ResourceType, value);
      }
    }

    // Update render time
    if (typeof data.renderTime === 'number') {
      current.metrics.renderTime = data.renderTime;
    }
  }

  /**
   * Register the start of a component load
   */
  public startComponentLoadTimer(componentId: string): void {
    if (!this.isEnabled) return;

    this.componentLoadTimers.set(componentId, performance.now());
  }

  /**
   * Register the completion of a component load
   */
  public endComponentLoadTimer(componentId: string): void {
    if (!this.isEnabled) return;

    const startTime = this.componentLoadTimers.get(componentId);
    if (startTime === undefined) return;

    const loadTime = performance.now() - startTime;
    this.componentLoadTimers.delete(componentId);

    // Update load time metrics
    const current = this.getCurrentSessionData();
    current.metrics.loadTimes[componentId] = loadTime;
  }

  /**
   * Track a user interaction with the system
   */
  public trackUserInteraction(interaction: UserInteractionData): void {
    if (!this.isEnabled) return;

    const current = this.getCurrentSessionData();

    // Add to interactions array
    current.userInteractions.push(interaction);

    // Update average interaction latency metric
    const totalInteractions = current.userInteractions.length;
    const totalLatency = current.userInteractions.reduce(
      (sum, interaction) => sum + interaction.responseTime,
      0
    );

    current.metrics.interactionLatency = totalLatency / totalInteractions;
  }

  /**
   * Track an error that occurred
   */
  public trackError(error: ErrorData): void {
    if (!this.isEnabled) return;

    // Apply error sampling
    if (Math.random() > this.options.errorSamplingRate) {
      return;
    }

    const current = this.getCurrentSessionData();
    current.errors.push(error);
  }

  /**
   * Get the current session's data object
   */
  private getCurrentSessionData(): SessionPerformanceData {
    // If the last entry is older than 5 minutes, create a new entry
    const lastEntry = this.performanceData[this.performanceData.length - 1];
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    if (lastEntry.timestamp < fiveMinutesAgo) {
      this.initializeCurrentSessionData();
    }

    return this.performanceData[this.performanceData.length - 1];
  }

  /**
   * Transmit collected telemetry data to the server
   */
  private transmitTelemetryData(): void {
    if (!this.isEnabled || this.performanceData.length === 0) return;

    // Update event counts in the current session data
    const current = this.getCurrentSessionData();
    current.metrics.eventCounts = { ...this.accumulatedEventCounts };

    // Reset accumulated counts after transferring
    this.accumulatedEventCounts = {};

    // Prepare data for transmission
    const dataToTransmit = {
      metadata: this.sessionMetadata,
      performanceData: this.performanceData.slice(0, this.options.maxBatchSize),
    };

    // In a real implementation, we would transmit this data to a telemetry server
    // For this implementation, we'll log it
    console.warn('[SessionPerformanceTracker] Transmitting telemetry data:', dataToTransmit);

    // After transmission, remove the transmitted entries except the current one
    if (this.performanceData.length > 1) {
      this.performanceData = this.performanceData.slice(this.options.maxBatchSize);
    }

    // Ensure we always have at least one entry
    if (this.performanceData.length === 0) {
      this.initializeCurrentSessionData();
    }

    this.lastTransmitTime = performance.now();
  }

  /**
   * Force an immediate transmission of telemetry data
   */
  public flushTelemetryData(): void {
    if (!this.isEnabled) return;

    this.transmitTelemetryData();
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Transmit any pending data
    if (this.isEnabled) {
      this.flushTelemetryData();
    }

    // Clear transmission interval
    if (this.transmitInterval !== null) {
      clearInterval(this.transmitInterval);
      this.transmitInterval = null;
    }

    // Remove event subscription
    if (this.eventSubscription) {
      this.eventSubscription();
      this.eventSubscription = null;
    }

    // Remove interaction observers
    for (const unsubscribe of this.interactionObservers.values()) {
      unsubscribe();
    }
    this.interactionObservers.clear();

    // Clear data
    this.performanceData = [];
    this.componentLoadTimers.clear();
    this.accumulatedEventCounts = {};

    console.warn(
      `[SessionPerformanceTracker] Cleaned up session: ${this.sessionMetadata.sessionId}`
    );
  }
}

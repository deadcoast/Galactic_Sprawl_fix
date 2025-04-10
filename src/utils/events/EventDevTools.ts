/**
 * @file EventDevTools.ts
 * Developer tools for monitoring and debugging event system.
 *
 * This utility provides:
 * 1. Event monitoring and visualization
 * 2. Subscription tracking
 * 3. Performance profiling
 * 4. Memory leak detection
 * 5. Event flow visualization
 */

import { EventBus, EventPerformanceMetrics } from '../../lib/events/EventBus';
import {
  BaseEvent,
  EVENT_CATEGORY_MAP,
  EventCategory,
  EventType,
} from '../../types/events/EventTypes';

/**
 * Configuration options for EventDevTools
 */
export interface EventDevToolsConfig {
  /**
   * Whether to enable dev tools (can be toggled at runtime)
   */
  enabled: boolean;

  /**
   * Maximum number of events to keep in history
   */
  maxEventHistory: number;

  /**
   * Events to exclude from logging
   */
  excludedEvents?: EventType[];

  /**
   * Categories to exclude from logging
   */
  excludedCategories?: EventCategory[];

  /**
   * Whether to log events to console
   */
  consoleLogging: boolean;

  /**
   * Whether to track subscription activity
   */
  trackSubscriptions: boolean;

  /**
   * Whether to track performance metrics
   */
  trackPerformance: boolean;

  /**
   * Threshold in milliseconds for slow event processing warnings
   */
  slowEventThreshold: number;

  /**
   * Whether to detect potential memory leaks
   */
  detectMemoryLeaks: boolean;

  /**
   * Warning threshold for number of subscribers to a single event
   */
  subscriberWarningThreshold: number;
}

/**
 * Default configuration for EventDevTools
 */
const DEFAULT_CONFIG: EventDevToolsConfig = {
  enabled: process.env.NODE_ENV === 'development',
  maxEventHistory: 100,
  consoleLogging: true,
  trackSubscriptions: true,
  trackPerformance: true,
  slowEventThreshold: 50, // ms
  detectMemoryLeaks: true,
  subscriberWarningThreshold: 20,
};

/**
 * Event history entry with additional metadata
 */
interface EventHistoryEntry<T extends BaseEvent = BaseEvent> {
  event: T;
  timestamp: number;
  processingTime?: number;
  sequenceId: number;
}

/**
 * Subscription activity entry
 */
interface SubscriptionActivity {
  eventType: EventType | '*';
  action: 'subscribe' | 'unsubscribe';
  source?: string;
  timestamp: number;
  subscriptionId: string;
}

/**
 * Memory leak detection report entry
 */
interface MemoryLeakSuspect {
  eventType: EventType | '*';
  subscriptionCount: number;
  oldestSubscriptionAge: number; // ms
  sources: string[];
}

/**
 * EventDevTools class for monitoring and debugging events
 */
export class EventDevTools<T extends BaseEvent = BaseEvent> {
  /**
   * Configuration options
   */
  private config: EventDevToolsConfig;

  /**
   * Event history with metadata
   */
  private eventHistory: EventHistoryEntry<T>[] = [];

  /**
   * Subscription activity history
   */
  private subscriptionActivity: SubscriptionActivity[] = [];

  /**
   * Event sequence counter
   */
  private eventSequence = 0;

  /**
   * Map to track processing time by event type
   */
  private eventProcessingTimes: Map<EventType, number[]> = new Map();

  /**
   * Set of excluded event types
   */
  private excludedEventTypes: Set<EventType>;

  /**
   * Set of component sources that have subscribed but not unsubscribed
   */
  private activeSubscriptionSources: Set<string> = new Set();

  /**
   * Creates a new EventDevTools instance
   * @param targetEventBus The event bus to monitor
   * @param config Configuration options
   */
  constructor(
    private readonly targetEventBus: EventBus<T>,
    config: Partial<EventDevToolsConfig> = {}
  ) {
    // Apply default config with overrides
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize excluded event types
    this.excludedEventTypes = new Set(this.config.excludedEvents ?? []);

    // Add excluded categories
    if (this.config.excludedCategories) {
      for (const category of this.config.excludedCategories) {
        // Use imported EVENT_CATEGORY_MAP instead of trying to access it from EventBus
        const categoryEvents = Object.entries(EVENT_CATEGORY_MAP)
          .filter(([_, cat]) => cat === category)
          .map(([eventType, _]) => eventType as EventType);

        categoryEvents.forEach(eventType => this.excludedEventTypes.add(eventType));
      }
    }

    // Set up monitoring if enabled
    if (this.config.enabled) {
      this.setupMonitoring();
    }
  }

  /**
   * Set up event bus monitoring
   */
  private setupMonitoring(): void {
    // Monitor all events
    const unsubscribeEvents = this.targetEventBus.subscribe('*', this.handleEvent.bind(this), {
      source: 'EventDevTools',
    });

    // Add cleanup method
    this.dispose = () => {
      unsubscribeEvents();
      console.warn('[EventDevTools] Stopped monitoring events');
    };

    console.warn('[EventDevTools] Started monitoring events');
  }

  /**
   * Handle an event for monitoring
   * @param event The event to monitor
   */
  private handleEvent(event: T): void {
    // Skip if disabled or event is excluded
    if (!this.config.enabled || this.excludedEventTypes.has(event?.type)) {
      return;
    }

    const startTime = performance.now();
    const sequenceId = ++this.eventSequence;

    // Add to history
    this.eventHistory.push({
      event,
      timestamp: startTime,
      sequenceId,
    });

    // Trim history if needed
    if (this.eventHistory.length > this.config.maxEventHistory) {
      this.eventHistory.shift();
    }

    // Calculate processing time after all subscribers have been notified
    setTimeout(() => {
      // Get performance metrics for this event type
      const metrics = this.targetEventBus.getPerformanceMetrics(event?.type);

      // Update the event history entry with processing time
      const historyEntry = this.eventHistory.find(entry => entry.sequenceId === sequenceId);
      if (historyEntry) {
        historyEntry.processingTime = metrics.lastProcessingTime;
      }

      // Track processing time for this event type
      if (!this.eventProcessingTimes.has(event?.type)) {
        this.eventProcessingTimes.set(event?.type, []);
      }
      this.eventProcessingTimes.get(event?.type)!.push(metrics.lastProcessingTime);

      // Check for slow event processing
      if (
        this.config.trackPerformance &&
        metrics.lastProcessingTime > this.config.slowEventThreshold
      ) {
        console.warn(
          `[EventDevTools] Slow event processing: ${event?.type} took ${metrics.lastProcessingTime.toFixed(2)}ms (threshold: ${this.config.slowEventThreshold}ms)`
        );
      }

      // Log event to console if enabled
      if (this.config.consoleLogging) {
        const timeString = metrics.lastProcessingTime
          ? ` (${metrics.lastProcessingTime.toFixed(2)}ms)`
          : '';

        console.warn(`[EventDevTools] Event: ${event?.type}${timeString}`, event);
      }
    }, 0);
  }

  /**
   * Track subscription activity
   * @param eventType The event type being subscribed to
   * @param action The subscription action (subscribe or unsubscribe)
   * @param source The source of the subscription
   * @param subscriptionId The ID of the subscription
   */
  trackSubscription(
    eventType: EventType | '*',
    action: 'subscribe' | 'unsubscribe',
    source: string = 'unknown',
    subscriptionId: string
  ): void {
    if (!this.config.enabled || !this.config.trackSubscriptions) {
      return;
    }

    // Track subscription activity
    this.subscriptionActivity.push({
      eventType,
      action,
      source,
      timestamp: Date.now(),
      subscriptionId,
    });

    // Track active subscription sources
    if (action === 'subscribe') {
      this.activeSubscriptionSources.add(source);
    } else {
      // Check if this source has unknown other active subscriptions
      const hasOtherSubscriptions = this.subscriptionActivity.some(
        activity =>
          activity.source === source &&
          activity.action === 'subscribe' &&
          activity.subscriptionId !== subscriptionId &&
          !this.subscriptionActivity.some(
            unsubActivity =>
              unsubActivity.action === 'unsubscribe' &&
              unsubActivity.subscriptionId === activity.subscriptionId
          )
      );

      if (!hasOtherSubscriptions) {
        this.activeSubscriptionSources.delete(source);
      }
    }

    // Check for subscriber count warnings
    const subscriberCount = this.targetEventBus.getSubscriptionCountForType(eventType);
    if (subscriberCount > this.config.subscriberWarningThreshold && action === 'subscribe') {
      console.warn(
        `[EventDevTools] High subscriber count: ${eventType} has ${subscriberCount} subscribers (threshold: ${this.config.subscriberWarningThreshold})`
      );
    }

    // Log subscription activity
    if (this.config.consoleLogging) {
      console.warn(
        `[EventDevTools] ${action === 'subscribe' ? 'Subscribed to' : 'Unsubscribed from'} ${eventType} (source: ${source})`
      );
    }
  }

  /**
   * Check for potential memory leaks (components that subscribed but didn't unsubscribe)
   * @returns List of potential memory leak suspects
   */
  detectPotentialMemoryLeaks(): MemoryLeakSuspect[] {
    if (!this.config.enabled || !this.config.detectMemoryLeaks) {
      return [];
    }

    const suspects: MemoryLeakSuspect[] = [];
    const now = Date.now();
    const eventTypes = new Set([...this.subscriptionActivity.map(activity => activity.eventType)]);

    // Check each event type
    for (const eventType of eventTypes) {
      // Get subscriptions for this event type
      const subscriptions = this.subscriptionActivity.filter(
        activity => activity.eventType === eventType
      );

      // Group by source
      const sources = new Set(subscriptions.map(activity => activity.source).filter(Boolean));
      const activeSourcesForType: string[] = [];

      // For each source, check if there are subscriptions without matching unsubscriptions
      for (const source of sources) {
        if (!source) continue;

        const sourceSubscriptions = subscriptions.filter(activity => activity.source === source);

        // Count unbalanced subscriptions
        const subscribes = sourceSubscriptions.filter(activity => activity.action === 'subscribe');
        const unsubscribes = sourceSubscriptions.filter(
          activity => activity.action === 'unsubscribe'
        );

        if (subscribes.length > unsubscribes.length) {
          activeSourcesForType.push(source);
        }
      }

      // If there are active sources, calculate the oldest subscription age
      if (activeSourcesForType.length > 0) {
        const oldestSubscription = subscriptions
          .filter(
            activity =>
              activity.action === 'subscribe' &&
              activeSourcesForType.includes(activity.source ?? '')
          )
          .sort((a, b) => a.timestamp - b.timestamp)[0];

        const oldestSubscriptionAge = now - oldestSubscription.timestamp;

        // Add to suspects list
        suspects.push({
          eventType,
          subscriptionCount: activeSourcesForType.length,
          oldestSubscriptionAge,
          sources: activeSourcesForType,
        });
      }
    }

    return suspects;
  }

  /**
   * Generate a performance report for event processing
   * @returns Object containing performance metrics for event processing
   */
  generatePerformanceReport(): Record<string, EventPerformanceMetrics> {
    if (!this.config.enabled || !this.config.trackPerformance) {
      return {};
    }

    // Get metrics for all event types
    const metrics: Record<string, EventPerformanceMetrics> = {};

    // Get overall metrics
    metrics.all = this.targetEventBus.getPerformanceMetrics('all');

    // Get metrics for each event type that has been processed
    for (const eventType of this.eventProcessingTimes.keys()) {
      metrics[eventType.toString()] = this.targetEventBus.getPerformanceMetrics(eventType);
    }

    return metrics;
  }

  /**
   * Enable or disable event monitoring
   * @param enabled Whether to enable event monitoring
   */
  setEnabled(enabled: boolean): void {
    if (this.config.enabled === enabled) {
      return;
    }

    this.config.enabled = enabled;

    if (enabled) {
      this.setupMonitoring();
    } else {
      this.dispose();
    }
  }

  /**
   * Get event history
   * @returns Array of event history entries
   */
  getEventHistory(): EventHistoryEntry<T>[] {
    return [...this.eventHistory];
  }

  /**
   * Get subscription activity history
   * @returns Array of subscription activity entries
   */
  getSubscriptionActivity(): SubscriptionActivity[] {
    return [...this.subscriptionActivity];
  }

  /**
   * Clean up resources
   * This will be replaced when monitoring is set up
   */
  dispose(): void {
    // Default no-op, replaced when monitoring is set up
  }
}

/**
 * Singleton instance for global access
 */
let devToolsInstance: EventDevTools<BaseEvent> | null = null;

/**
 * Initialize the event dev tools with the given event bus
 * @param eventBus The event bus to monitor
 * @param config Configuration options
 * @returns The EventDevTools instance
 */
export function initializeEventDevTools<T extends BaseEvent>(
  eventBus: EventBus<T>,
  config: Partial<EventDevToolsConfig> = {}
): EventDevTools<T> {
  if (devToolsInstance) {
    console.warn('[EventDevTools] Dev tools already initialized, disposing previous instance');
    devToolsInstance.dispose();
  }

  // Create a new instance with the given event bus
  const newInstance = new EventDevTools<T>(eventBus, config);

  // Store it as the global instance (this is fine since we're just using it for type compatibility)
  devToolsInstance = newInstance as unknown as EventDevTools<BaseEvent>;

  return newInstance;
}

/**
 * Get the current EventDevTools instance
 * @returns The current EventDevTools instance, or null if not initialized
 */
export function getEventDevTools<T extends BaseEvent>(): EventDevTools<T> | null {
  return devToolsInstance as unknown as EventDevTools<T> | null;
}

/**
 * EventPrioritizer.ts
 *
 * Advanced event prioritization system that works with the existing event infrastructure
 * to intelligently process events based on priority, type, and system load.
 *
 * This class provides:
 * 1. Priority-based event processing with configurable levels
 * 2. Dynamic throttling based on system load
 * 3. Integration with existing EventBatcher
 * 4. Event coalescing for high-frequency events
 * 5. Adaptive processing strategies
 */

import { Subject, Subscription, from, of } from 'rxjs';
import { bufferTime, concatMap, delay, filter, mergeMap } from 'rxjs/operators';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { EventBatchConfig } from './EventBatcher';

/**
 * Priority levels for events
 */
export enum EventPriority {
  CRITICAL = 0, // Immediate processing, never batched
  HIGH = 1, // High priority, minimal batching
  NORMAL = 2, // Standard priority
  LOW = 3, // Low priority, can be delayed
  BACKGROUND = 4, // Processed when system is idle
}

/**
 * Configuration for the EventPrioritizer
 */
export interface EventPrioritizerConfig {
  /**
   * Default priority for events without explicit priority
   */
  defaultPriority: EventPriority;

  /**
   * Map of event types to their priority
   */
  priorityMap: Map<EventType | string, EventPriority>;

  /**
   * Batch configuration by priority level
   */
  batchConfigByPriority: Map<EventPriority, EventBatchConfig>;

  /**
   * Whether to enable adaptive throttling based on system load
   */
  enableAdaptiveThrottling: boolean;

  /**
   * Threshold for high load detection (events per second)
   */
  highLoadThreshold: number;

  /**
   * Whether to enable event coalescing for high-frequency events
   */
  enableEventCoalescing: boolean;

  /**
   * Event types that can be coalesced (only the most recent is processed)
   */
  coalesceableEventTypes: Set<EventType | string>;

  /**
   * Maximum events to process per cycle
   */
  maxEventsPerCycle: number;
}

/**
 * Default configuration for the EventPrioritizer
 */
const DEFAULT_CONFIG: EventPrioritizerConfig = {
  defaultPriority: EventPriority.NORMAL,
  priorityMap: new Map(),
  batchConfigByPriority: new Map([
    [EventPriority.CRITICAL, { timeWindow: 0, maxBatchSize: 1, emitEmptyBatches: false }],
    [EventPriority.HIGH, { timeWindow: 50, maxBatchSize: 10, emitEmptyBatches: false }],
    [EventPriority.NORMAL, { timeWindow: 100, maxBatchSize: 50, emitEmptyBatches: false }],
    [EventPriority.LOW, { timeWindow: 250, maxBatchSize: 100, emitEmptyBatches: false }],
    [EventPriority.BACKGROUND, { timeWindow: 500, maxBatchSize: 200, emitEmptyBatches: false }],
  ]),
  enableAdaptiveThrottling: true,
  highLoadThreshold: 1000, // 1000 events per second
  enableEventCoalescing: true,
  coalesceableEventTypes: new Set([
    // Add event types that can be coalesced here
    // These are typically high-frequency update events where only the latest state matters
    'POSITION_UPDATED',
    'RESOURCE_UPDATED',
    'PROGRESS_UPDATED',
    'ANIMATION_FRAME',
    'MOUSE_MOVE',
    'SCROLL',
  ]),
  maxEventsPerCycle: 1000,
};

/**
 * Metrics for the EventPrioritizer
 */
export interface PrioritizerMetrics {
  /**
   * Total events received
   */
  totalEventsReceived: number;

  /**
   * Events processed per priority level
   */
  eventsByPriority: Record<EventPriority, number>;

  /**
   * Events coalesced (dropped because newer events of same type arrived)
   */
  eventsCoalesced: number;

  /**
   * Average processing time per event (ms)
   */
  avgProcessingTimeMs: number;

  /**
   * Max processing time for unknown event (ms)
   */
  maxProcessingTimeMs: number;

  /**
   * Current events per second rate
   */
  eventsPerSecond: number;

  /**
   * Whether the system is currently under high load
   */
  isHighLoad: boolean;

  /**
   * Event queue depth by priority
   */
  queueDepthByPriority: Record<EventPriority, number>;
}

/**
 * Event with priority information
 */
export interface PrioritizedEvent<T extends BaseEvent = BaseEvent> {
  event: T;
  priority: EventPriority;
  timestamp: number;
  id: string;
}

/**
 * EventPrioritizer class for prioritizing and efficiently processing events
 */
export class EventPrioritizer<T extends BaseEvent = BaseEvent> {
  /**
   * Priority queues for each priority level
   */
  private queues: Map<EventPriority, PrioritizedEvent<T>[]> = new Map();

  /**
   * Whether the prioritizer is currently processing
   */
  private processing = false;

  /**
   * Subject for emitting prioritized events
   */
  private eventSubject = new Subject<PrioritizedEvent<T>>();

  /**
   * Observable for prioritized events
   */
  private events$ = this.eventSubject.asObservable();

  /**
   * Map of event type to latest event (for coalescing)
   */
  private latestEventByType: Map<string, PrioritizedEvent<T>> = new Map();

  /**
   * Set of active subscriptions
   */
  private subscriptions: Set<Subscription> = new Set();

  /**
   * Performance metrics
   */
  private metrics: PrioritizerMetrics = {
    totalEventsReceived: 0,
    eventsByPriority: {
      [EventPriority.CRITICAL]: 0,
      [EventPriority.HIGH]: 0,
      [EventPriority.NORMAL]: 0,
      [EventPriority.LOW]: 0,
      [EventPriority.BACKGROUND]: 0,
    },
    eventsCoalesced: 0,
    avgProcessingTimeMs: 0,
    maxProcessingTimeMs: 0,
    eventsPerSecond: 0,
    isHighLoad: false,
    queueDepthByPriority: {
      [EventPriority.CRITICAL]: 0,
      [EventPriority.HIGH]: 0,
      [EventPriority.NORMAL]: 0,
      [EventPriority.LOW]: 0,
      [EventPriority.BACKGROUND]: 0,
    },
  };

  /**
   * Recent event processing times for adaptive throttling
   */
  private recentProcessingTimes: number[] = [];

  /**
   * Recent event timestamps for calculating events per second
   */
  private recentEventTimestamps: number[] = [];

  /**
   * Configuration for the prioritizer
   */
  private config: EventPrioritizerConfig;

  /**
   * Create a new EventPrioritizer
   */
  constructor(
    /**
     * Processor function to handle events
     */
    private processor: (event: T) => Promise<void> | void,

    /**
     * Configuration for the prioritizer
     */
    config: Partial<EventPrioritizerConfig> = {}
  ) {
    // Merge with default config
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      batchConfigByPriority: new Map([
        ...DEFAULT_CONFIG.batchConfigByPriority,
        ...(config.batchConfigByPriority || new Map()),
      ]),
      priorityMap: new Map([...(config.priorityMap || new Map())]),
      coalesceableEventTypes: new Set([
        ...DEFAULT_CONFIG.coalesceableEventTypes,
        ...(config.coalesceableEventTypes || new Set()),
      ]),
    };

    // Initialize queues
    Object.values(EventPriority).forEach(priority => {
      if (typeof priority === 'number') {
        this.queues.set(priority, []);
      }
    });

    // Setup event processing pipelines
    this.setupEventProcessing();
  }

  /**
   * Setup event processing pipelines
   */
  private setupEventProcessing(): void {
    // Create a stream for each priority level
    Object.values(EventPriority).forEach(priority => {
      if (typeof priority === 'number') {
        const priorityEvents$ = this.events$.pipe(filter(e => e.priority === priority));

        // Get batch config for this priority
        const batchConfig = this.config.batchConfigByPriority.get(priority) || {
          timeWindow: 100,
          maxBatchSize: 50,
          emitEmptyBatches: false,
        };

        // For CRITICAL priority, process immediately without batching
        if (priority === EventPriority.CRITICAL) {
          const subscription = priorityEvents$
            .pipe(
              concatMap(async event => {
                await this.processEvent(event);
                return event;
              })
            )
            .subscribe();

          this.subscriptions.add(subscription);
          return;
        }

        // For other priorities, use batching
        const subscription = priorityEvents$
          .pipe(
            // Buffer events by time or count, whichever comes first
            bufferTime(
              batchConfig.timeWindow,
              null,
              batchConfig.maxBatchSize || Number.MAX_SAFE_INTEGER
            ),
            // Only process non-empty batches
            filter(events => events.length > 0),
            // Process each batch
            concatMap(async events => {
              // Sort by timestamp (older first)
              events.sort((a, b) => a.timestamp - b.timestamp);

              // Process each event in the batch
              for (const event of events) {
                await this.processEvent(event);
              }

              return events;
            })
          )
          .subscribe();

        this.subscriptions.add(subscription);
      }
    });

    // Setup metrics calculation
    const metricsSubscription = of(true)
      .pipe(
        // Update metrics every second
        concatMap(() => from(this.updateMetrics())),
        delay(1000),
        // Repeat indefinitely
        mergeMap(() => of(true))
      )
      .subscribe();

    this.subscriptions.add(metricsSubscription);
  }

  /**
   * Process a single event
   */
  private async processEvent(prioritizedEvent: PrioritizedEvent<T>): Promise<void> {
    const startTime = performance.now();

    try {
      // Process the event
      const result = this.processor(prioritizedEvent.event);

      // If it returns a promise, await it
      if (result instanceof Promise) {
        await result;
      }

      // Update metrics
      const processingTime = performance.now() - startTime;
      this.recentProcessingTimes.push(processingTime);

      // Keep only the last 100 processing times
      if (this.recentProcessingTimes.length > 100) {
        this.recentProcessingTimes.shift();
      }

      // Update max processing time
      this.metrics.maxProcessingTimeMs = Math.max(this.metrics.maxProcessingTimeMs, processingTime);

      // Update average processing time
      this.metrics.avgProcessingTimeMs =
        this.recentProcessingTimes.reduce((sum, time) => sum + time, 0) /
        this.recentProcessingTimes.length;

      // Increment processed count for this priority
      this.metrics.eventsByPriority[prioritizedEvent.priority]++;
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  /**
   * Update metrics for adaptive throttling
   */
  private async updateMetrics(): Promise<void> {
    // Calculate events per second
    const now = Date.now();

    // Remove events older than 1 second
    this.recentEventTimestamps = this.recentEventTimestamps.filter(
      timestamp => now - timestamp <= 1000
    );

    // Calculate events per second
    this.metrics.eventsPerSecond = this.recentEventTimestamps.length;

    // Determine if we're under high load
    this.metrics.isHighLoad = this.metrics.eventsPerSecond >= this.config.highLoadThreshold;

    // Update queue depths
    this.queues.forEach((queue, priority) => {
      this.metrics.queueDepthByPriority[priority] = queue.length;
    });
  }

  /**
   * Generate a unique ID for an event
   */
  private generateEventId(event: T): string {
    return `${event?.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get priority for an event
   */
  private getEventPriority(event: T): EventPriority {
    // Check if priority is explicitly set in the priority map
    if (this.config.priorityMap.has(event?.type)) {
      return this.config.priorityMap.get(event?.type)!;
    }

    // Otherwise use default priority
    return this.config.defaultPriority;
  }

  /**
   * Add an event to be processed
   */
  public addEvent(event: T): void {
    // Increment total events received
    this.metrics.totalEventsReceived++;

    // Record timestamp for events per second calculation
    this.recentEventTimestamps.push(Date.now());

    // Get priority for this event
    const priority = this.getEventPriority(event);

    // Create prioritized event
    const prioritizedEvent: PrioritizedEvent<T> = {
      event,
      priority,
      timestamp: Date.now(),
      id: this.generateEventId(event),
    };

    // Check if this event type can be coalesced
    if (this.config.enableEventCoalescing && this.config.coalesceableEventTypes.has(event?.type)) {
      // Check if we already have an event of this type
      if (this.latestEventByType.has(event?.type)) {
        // Increment coalesced count
        this.metrics.eventsCoalesced++;
      }

      // Store as latest event of this type
      this.latestEventByType.set(event?.type, prioritizedEvent);
    } else {
      // For non-coalesceable events, emit immediately
      this.eventSubject.next(prioritizedEvent);
    }
  }

  /**
   * Flush coalesced events
   */
  public flushCoalescedEvents(): void {
    if (!this.config.enableEventCoalescing) {
      return;
    }

    // Emit all coalesced events
    this.latestEventByType.forEach(event => {
      this.eventSubject.next(event);
    });

    // Clear the map
    this.latestEventByType.clear();
  }

  /**
   * Get current metrics
   */
  public getMetrics(): PrioritizerMetrics {
    return { ...this.metrics };
  }

  /**
   * Update the configuration
   */
  public updateConfig(config: Partial<EventPrioritizerConfig>): void {
    // Update configuration
    this.config = {
      ...this.config,
      ...config,
      batchConfigByPriority: new Map([
        ...this.config.batchConfigByPriority,
        ...(config.batchConfigByPriority || new Map()),
      ]),
      priorityMap: new Map([...this.config.priorityMap, ...(config.priorityMap || new Map())]),
      coalesceableEventTypes: new Set([
        ...this.config.coalesceableEventTypes,
        ...(config.coalesceableEventTypes || new Set()),
      ]),
    };
  }

  /**
   * Set priority for specific event types
   */
  public setPriority(eventType: EventType | string, priority: EventPriority): void {
    this.config.priorityMap.set(eventType, priority);
  }

  /**
   * Set multiple event priorities at once
   */
  public setPriorities(priorityMap: Map<EventType | string, EventPriority>): void {
    priorityMap.forEach((priority, eventType) => {
      this.config.priorityMap.set(eventType, priority);
    });
  }

  /**
   * Set batch configuration for a priority level
   */
  public setBatchConfig(priority: EventPriority, config: EventBatchConfig): void {
    this.config.batchConfigByPriority.set(priority, config);
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalEventsReceived: 0,
      eventsByPriority: {
        [EventPriority.CRITICAL]: 0,
        [EventPriority.HIGH]: 0,
        [EventPriority.NORMAL]: 0,
        [EventPriority.LOW]: 0,
        [EventPriority.BACKGROUND]: 0,
      },
      eventsCoalesced: 0,
      avgProcessingTimeMs: 0,
      maxProcessingTimeMs: 0,
      eventsPerSecond: 0,
      isHighLoad: false,
      queueDepthByPriority: {
        [EventPriority.CRITICAL]: 0,
        [EventPriority.HIGH]: 0,
        [EventPriority.NORMAL]: 0,
        [EventPriority.LOW]: 0,
        [EventPriority.BACKGROUND]: 0,
      },
    };

    this.recentProcessingTimes = [];
    this.recentEventTimestamps = [];
  }

  /**
   * Dispose of the prioritizer
   */
  public dispose(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });

    // Clear subscriptions
    this.subscriptions.clear();

    // Complete subject
    this.eventSubject.complete();

    // Clear queues
    this.queues.forEach(queue => {
      queue.length = 0;
    });

    // Clear coalesced events
    this.latestEventByType.clear();
  }
}

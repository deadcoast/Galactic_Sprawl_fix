/**
 * EventThrottling.ts
 *
 * Event throttling utilities specifically designed for UI updates.
 * Provides specialized functions to prevent excessive UI re-renders.
 */

import { Observable, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  groupBy,
  map,
  mergeMap,
  throttleTime,
} from 'rxjs/operators';
import { BaseEvent } from '../../types/events/EventTypes';

/**
 * Configuration for UI throttling
 */
export interface UIThrottleConfig {
  /**
   * Throttle interval in milliseconds
   */
  throttleMs: number;

  /**
   * Whether to include the trailing edge of the throttle window
   */
  trailing?: boolean;

  /**
   * Whether to track performance metrics
   */
  trackMetrics?: boolean;
}

/**
 * Configuration for UI debouncing
 */
export interface UIDebounceConfig {
  /**
   * Debounce delay in milliseconds
   */
  debounceMs: number;

  /**
   * Whether to track performance metrics
   */
  trackMetrics?: boolean;
}

/**
 * Performance metrics for throttled/debounced events
 */
export interface UIEventPerformanceMetrics {
  /**
   * Total events received
   */
  totalEventsReceived: number;

  /**
   * Events that were allowed through (not dropped)
   */
  eventsEmitted: number;

  /**
   * Events dropped (throttled or debounced)
   */
  eventsDropped: number;

  /**
   * Percentage of events that were dropped
   */
  dropRatePercentage: number;

  /**
   * Timestamps of recent events (for calculating event rate)
   */
  recentEventTimestamps: number[];

  /**
   * Current events per second rate
   */
  eventsPerSecond: number;

  /**
   * Estimated render time saved in milliseconds
   */
  estimatedRenderTimeSavedMs: number;

  /**
   * Average time between emitted events in milliseconds
   */
  avgTimeBetweenEmittedEventsMs: number;
}

/**
 * Create initial performance metrics
 */
function createInitialMetrics(): UIEventPerformanceMetrics {
  return {
    totalEventsReceived: 0,
    eventsEmitted: 0,
    eventsDropped: 0,
    dropRatePercentage: 0,
    recentEventTimestamps: [],
    eventsPerSecond: 0,
    estimatedRenderTimeSavedMs: 0,
    avgTimeBetweenEmittedEventsMs: 0,
  };
}

/**
 * Create a throttled event stream optimized for UI updates
 */
export function createUIThrottledStream<T extends BaseEvent>(
  source: Observable<T>,
  config: UIThrottleConfig
): {
  /**
   * The throttled event stream
   */
  stream: Observable<T>;

  /**
   * Observable of performance metrics (if tracking is enabled)
   */
  metrics$: Observable<UIEventPerformanceMetrics> | null;
} {
  let metricsSubject: Subject<UIEventPerformanceMetrics> | null = null;
  const metrics = createInitialMetrics();
  let lastEmitTime = 0;
  const trackedEvents: T[] = [];

  // Create metrics subject if tracking is enabled
  if (config.trackMetrics) {
    metricsSubject = new Subject<UIEventPerformanceMetrics>();
  }

  // Create the throttled stream
  const throttled$ = source.pipe(
    // Add pre-throttle tracking
    map(event => {
      if (config.trackMetrics) {
        const now = Date.now();
        metrics.totalEventsReceived++;
        trackedEvents.push(event);
        metrics.recentEventTimestamps.push(now);

        // Keep only the last 1000 timestamps
        if (metrics.recentEventTimestamps.length > 1000) {
          metrics.recentEventTimestamps.shift();
        }

        // Calculate events per second
        const oneSecondAgo = now - 1000;
        const recentEvents = metrics.recentEventTimestamps.filter(t => t >= oneSecondAgo);
        metrics.eventsPerSecond = recentEvents.length;
      }
      return event;
    }),

    // Apply throttling
    throttleTime(config.throttleMs, undefined, {
      leading: true,
      trailing: config.trailing ?? false,
    }),

    // Add post-throttle tracking
    map(event => {
      if (config.trackMetrics) {
        const now = Date.now();
        metrics.eventsEmitted++;
        metrics.eventsDropped = metrics.totalEventsReceived - metrics.eventsEmitted;
        metrics.dropRatePercentage =
          metrics.totalEventsReceived > 0
            ? (metrics.eventsDropped / metrics.totalEventsReceived) * 100
            : 0;

        // Calculate average time between emitted events
        if (lastEmitTime > 0) {
          const timeSinceLastEmit = now - lastEmitTime;
          // Moving average (weight: 0.2 for new value, 0.8 for existing average)
          metrics.avgTimeBetweenEmittedEventsMs =
            metrics.avgTimeBetweenEmittedEventsMs * 0.8 + timeSinceLastEmit * 0.2;
        }

        // Estimate render time saved (assuming 10ms per render)
        metrics.estimatedRenderTimeSavedMs = metrics.eventsDropped * 10;

        lastEmitTime = now;

        // Emit updated metrics
        if (metricsSubject) {
          metricsSubject.next({ ...metrics });
        }
      }
      return event;
    })
  );

  return {
    stream: throttled$,
    metrics$: metricsSubject ? metricsSubject.asObservable() : null,
  };
}

/**
 * Create a debounced event stream optimized for UI updates
 */
export function createUIDebounceStream<T extends BaseEvent>(
  source: Observable<T>,
  config: UIDebounceConfig
): {
  /**
   * The debounced event stream
   */
  stream: Observable<T>;

  /**
   * Observable of performance metrics (if tracking is enabled)
   */
  metrics$: Observable<UIEventPerformanceMetrics> | null;
} {
  let metricsSubject: Subject<UIEventPerformanceMetrics> | null = null;
  const metrics = createInitialMetrics();
  let lastEmitTime = 0;

  // Create metrics subject if tracking is enabled
  if (config.trackMetrics) {
    metricsSubject = new Subject<UIEventPerformanceMetrics>();
  }

  // Create the debounced stream
  const debounced$ = source.pipe(
    // Add pre-debounce tracking
    map(event => {
      if (config.trackMetrics) {
        const now = Date.now();
        metrics.totalEventsReceived++;
        metrics.recentEventTimestamps.push(now);

        // Keep only the last 1000 timestamps
        if (metrics.recentEventTimestamps.length > 1000) {
          metrics.recentEventTimestamps.shift();
        }

        // Calculate events per second
        const oneSecondAgo = now - 1000;
        const recentEvents = metrics.recentEventTimestamps.filter(t => t >= oneSecondAgo);
        metrics.eventsPerSecond = recentEvents.length;
      }
      return event;
    }),

    // Apply debouncing
    debounceTime(config.debounceMs),

    // Add post-debounce tracking
    map(event => {
      if (config.trackMetrics) {
        const now = Date.now();
        metrics.eventsEmitted++;
        metrics.eventsDropped = metrics.totalEventsReceived - metrics.eventsEmitted;
        metrics.dropRatePercentage =
          metrics.totalEventsReceived > 0
            ? (metrics.eventsDropped / metrics.totalEventsReceived) * 100
            : 0;

        // Calculate average time between emitted events
        if (lastEmitTime > 0) {
          const timeSinceLastEmit = now - lastEmitTime;
          // Moving average (weight: 0.2 for new value, 0.8 for existing average)
          metrics.avgTimeBetweenEmittedEventsMs =
            metrics.avgTimeBetweenEmittedEventsMs * 0.8 + timeSinceLastEmit * 0.2;
        }

        // Estimate render time saved (assuming 10ms per render)
        metrics.estimatedRenderTimeSavedMs = metrics.eventsDropped * 10;

        lastEmitTime = now;

        // Emit updated metrics
        if (metricsSubject) {
          metricsSubject.next({ ...metrics });
        }
      }
      return event;
    })
  );

  return {
    stream: debounced$,
    metrics$: metricsSubject ? metricsSubject.asObservable() : null,
  };
}

/**
 * Create a stream that filters out duplicate/unchanged events by comparing properties
 */
export function createDistinctUntilChangedStream<T extends BaseEvent>(
  source: Observable<T>,
  comparator: (previous: T, current: T) => boolean
): Observable<T> {
  return source.pipe(distinctUntilChanged(comparator));
}

/**
 * Create a stream that only emits when significant changes occur
 * (Threshold-based change detection)
 */
export function createSignificantChangeStream<T extends BaseEvent>(
  source: Observable<T>,
  isSignificantChange: (previous: T | null, current: T) => boolean
): Observable<T> {
  let previous: T | null = null;

  return source.pipe(
    filter(current => {
      const isSignificant = isSignificantChange(previous, current);
      if (isSignificant) {
        previous = current;
      }
      return isSignificant;
    })
  );
}

/**
 * Create a processor function that throttles UI updates
 */
export function createUIThrottledProcessor<T extends BaseEvent>(
  processor: (event: T) => void,
  config: UIThrottleConfig
): (event: T) => void {
  // Create a subject for events
  const eventSubject = new Subject<T>();

  // Create a throttled stream
  const { stream } = createUIThrottledStream(eventSubject.asObservable(), config);

  // Subscribe to the throttled stream
  stream.subscribe(event => {
    processor(event);
  });

  // Return a function that adds events to the subject
  return (event: T) => {
    eventSubject.next(event);
  };
}

/**
 * Create a processor function that debounces UI updates
 */
export function createUIDebounceProcessor<T extends BaseEvent>(
  processor: (event: T) => void,
  config: UIDebounceConfig
): (event: T) => void {
  // Create a subject for events
  const eventSubject = new Subject<T>();

  // Create a debounced stream
  const { stream } = createUIDebounceStream(eventSubject.asObservable(), config);

  // Subscribe to the debounced stream
  stream.subscribe(event => {
    processor(event);
  });

  // Return a function that adds events to the subject
  return (event: T) => {
    eventSubject.next(event);
  };
}

/**
 * Create a specialized processor for smooth visual updates
 * This uses adaptive throttling based on event frequency
 */
export function createSmoothUIUpdateProcessor<T extends BaseEvent>(
  processor: (event: T) => void,
  config: {
    /**
     * Minimum throttle interval in milliseconds
     */
    minThrottleMs: number;

    /**
     * Maximum throttle interval in milliseconds
     */
    maxThrottleMs: number;

    /**
     * Event rate threshold (events per second) for switching between throttle intervals
     */
    rateThresholdEventsPerSecond: number;
  }
): (event: T) => void {
  // Create a subject for events
  const eventSubject = new Subject<T>();
  let recentEvents: number[] = [];

  // Create a self-adapting throttled stream
  const adaptiveThrottled$ = eventSubject.pipe(
    // Track event rate before throttling
    map(event => {
      const now = Date.now();
      recentEvents.push(now);

      // Keep only events from the last second
      recentEvents = recentEvents.filter(time => now - time <= 1000);

      // Calculate events per second
      const eventsPerSecond = recentEvents.length;

      // Calculate appropriate throttle interval
      let throttleInterval: number;
      if (eventsPerSecond >= config.rateThresholdEventsPerSecond) {
        throttleInterval = config.maxThrottleMs;
      } else {
        // Linear interpolation between min and max based on event rate
        const ratio = Math.min(1, eventsPerSecond / config.rateThresholdEventsPerSecond);
        throttleInterval =
          config.minThrottleMs + (config.maxThrottleMs - config.minThrottleMs) * ratio;
      }

      return { event, throttleInterval };
    }),

    // Group by approximate throttle interval range (rounded to nearest 50ms)
    groupBy(data => Math.round(data?.throttleInterval / 50) * 50),

    // Apply appropriate throttling to each group
    mergeMap(group =>
      group.pipe(
        throttleTime(+group.key, undefined, { leading: true, trailing: true }),
        map(data => data?.event)
      )
    )
  );

  // Subscribe to the adaptive throttled stream
  adaptiveThrottled$.subscribe(event => {
    processor(event);
  });

  // Return a function that adds events to the subject
  return (event: T) => {
    eventSubject.next(event);
  };
}

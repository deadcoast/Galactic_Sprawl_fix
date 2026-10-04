/**
 * EventBatchingRxJS.ts
 *
 * Advanced event batching utilities using RxJS for time-based event processing.
 * Provides specialized operators and utilities for working with event streams.
 */

import { Observable, Subject, interval, of, timer } from 'rxjs';
import {
  bufferTime,
  bufferToggle,
  catchError,
  filter,
  map,
  mergeMap,
  switchMap,
  take,
  throttleTime,
} from 'rxjs/operators';
import { EventPriority } from './EventPrioritizer';

/**
 * Configuration for time-based event batching
 */
export interface TimeBatchConfig {
  /**
   * Time window in milliseconds to collect events before processing
   */
  timeWindow: number;

  /**
   * Maximum number of events to include in a batch before processing
   */
  maxBatchSize?: number;

  /**
   * Whether to emit batches on a fixed schedule regardless of event counts
   */
  emitOnSchedule?: boolean;

  /**
   * Fixed schedule interval in milliseconds (if emitOnSchedule is true)
   */
  scheduleInterval?: number;

  /**
   * Group events by a specific property
   */
  groupBy?: (event: unknown) => string;

  /**
   * Priority threshold - events with priority below this will be batched
   */
  priorityThreshold?: EventPriority;

  /**
   * Whether to sort events by timestamp within batches
   */
  sortByTimestamp?: boolean;
}

/**
 * Default configuration for time-based event batching
 */
const DEFAULT_TIME_BATCH_CONFIG: TimeBatchConfig = {
  timeWindow: 100,
  maxBatchSize: 100,
  emitOnSchedule: false,
  scheduleInterval: 1000,
  sortByTimestamp: true,
};

/**
 * Time-based batch result with performance metrics
 */
export interface TimeBatchResult<T> {
  /**
   * Events in the batch
   */
  events: T[];

  /**
   * Start timestamp of the batch window
   */
  startTime: number;

  /**
   * End timestamp of the batch window
   */
  endTime: number;

  /**
   * Size of the batch
   */
  batchSize: number;

  /**
   * Whether the batch was triggered by reaching the time window
   */
  timeWindowReached: boolean;

  /**
   * Whether the batch was triggered by reaching the max batch size
   */
  maxSizeReached: boolean;

  /**
   * Events per second rate during this batch window
   */
  eventsPerSecond: number;

  /**
   * Time between first and last event in the batch (ms)
   */
  eventSpread: number;
}

/**
 * Create a time-based batched event stream
 *
 * @param source - Source event stream
 * @param config - Batching configuration
 */
export function createTimeBatchedStream<T>(
  source: Observable<T>,
  config: Partial<TimeBatchConfig> = {}
): Observable<TimeBatchResult<T>> {
  // Merge with default config
  const batchConfig: TimeBatchConfig = {
    ...DEFAULT_TIME_BATCH_CONFIG,
    ...config,
  };

  // If emitting on a fixed schedule
  if (batchConfig.emitOnSchedule && batchConfig.scheduleInterval) {
    return source.pipe(
      // Buffer events based on fixed timer intervals
      bufferToggle(interval(batchConfig.scheduleInterval), () => timer(batchConfig.timeWindow)),
      // Filter out empty batches
      filter(events => events.length > 0),
      // Create batch result
      map(events => createBatchResult(events, batchConfig, false, false))
    );
  }

  // If priority threshold is set, split the stream
  if (batchConfig.priorityThreshold !== undefined) {
    // High priority stream (process immediately)
    const highPriorityStream = source.pipe(
      filter((event: unknown) => {
        const eventObj = event as { priority?: EventPriority };
        return (
          eventObj.priority !== undefined && eventObj.priority < batchConfig.priorityThreshold!
        );
      }),
      map(event => [event]),
      map(events => createBatchResult(events, batchConfig, false, false))
    );

    // Low priority stream (batch)
    const lowPriorityStream = source.pipe(
      filter((event: unknown) => {
        const eventObj = event as { priority?: EventPriority };
        return (
          eventObj.priority === undefined || eventObj.priority >= batchConfig.priorityThreshold!
        );
      }),
      bufferTime(batchConfig.timeWindow, null, batchConfig.maxBatchSize ?? Number.MAX_SAFE_INTEGER),
      filter(events => events.length > 0),
      map(events =>
        createBatchResult(
          events,
          batchConfig,
          true,
          events.length >= (batchConfig.maxBatchSize ?? Number.MAX_SAFE_INTEGER)
        )
      )
    );

    // Merge the streams
    return highPriorityStream.pipe(
      mergeMap(result => of(result)),
      mergeMap(result =>
        lowPriorityStream.pipe(
          take(0),
          mergeMap(() => of(result)),
          catchError(() => of(result))
        )
      )
    ) as Observable<TimeBatchResult<T>>;
  }

  // Standard batching approach
  return source.pipe(
    // Buffer events by time window and max size
    bufferTime(batchConfig.timeWindow, null, batchConfig.maxBatchSize ?? Number.MAX_SAFE_INTEGER),
    // Filter out empty batches
    filter(events => events.length > 0),
    // Create batch result
    map(events =>
      createBatchResult(
        events,
        batchConfig,
        true,
        events.length >= (batchConfig.maxBatchSize ?? Number.MAX_SAFE_INTEGER)
      )
    )
  );
}

/**
 * Create a batch result object from a batch of events
 */
function createBatchResult<T>(
  events: T[],
  config: TimeBatchConfig,
  timeWindowReached: boolean,
  maxSizeReached: boolean
): TimeBatchResult<T> {
  // Get timestamps (if available)
  const now = Date.now();
  const timestamps = events.map(event => {
    const eventObj = event as { timestamp?: number };
    return eventObj.timestamp ?? now;
  });

  // Sort events by timestamp if configured
  if (config.sortByTimestamp && events.length > 1) {
    // Create tuples of [event, timestamp]
    const tuples = events.map((event, i) => [event, timestamps[i]]);
    // Sort by timestamp
    tuples.sort((a, b) => (a[1] as number) - (b[1] as number));
    // Extract sorted events
    events = tuples.map(tuple => tuple[0]) as T[];
  }

  // Calculate start and end times
  const startTime = Math.min(...timestamps);
  const endTime = Math.max(...timestamps);

  // Calculate events per second
  const durationSec = Math.max((endTime - startTime) / 1000, 0.001); // Ensure minimum duration to avoid division by zero
  const eventsPerSecond = events.length / durationSec;

  // Create the result
  return {
    events,
    startTime,
    endTime,
    batchSize: events.length,
    timeWindowReached,
    maxSizeReached,
    eventsPerSecond,
    eventSpread: events.length > 1 ? endTime - startTime : 0,
  };
}

/**
 * Group batched events by a specific property
 */
export function groupBatchedEvents<T>(
  batchResult: TimeBatchResult<T>,
  groupFn: (event: T) => string
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};

  for (const event of batchResult.events) {
    const key = groupFn(event);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(event);
  }

  return groups;
}

/**
 * Create a time-based event batch processor
 */
export function createTimeBatchProcessor<T, R>(
  processor: (events: T[]) => R,
  config: Partial<TimeBatchConfig> = {}
): (event: T) => void {
  // Create a subject for events
  const eventSubject = new Subject<T>();

  // Create a batched stream
  const batchedStream = createTimeBatchedStream(eventSubject.asObservable(), config);

  // Subscribe to the batched stream
  batchedStream.subscribe(result => {
    processor(result?.events);
  });

  // Return a function that adds events to the subject
  return (event: T) => {
    eventSubject.next(event);
  };
}

/**
 * Create a throttled event stream that limits the rate of events
 */
export function createThrottledEventStream<T>(
  source: Observable<T>,
  throttleMs: number,
  trailing = false
): Observable<T> {
  return source.pipe(throttleTime(throttleMs, undefined, { leading: true, trailing }));
}

/**
 * Process events in dynamic time windows based on system load
 */
export function createAdaptiveTimeBatchedStream<T>(
  source: Observable<T>,
  getSystemLoad: () => number, // 0-1 value representing system load
  config: {
    minTimeWindow: number;
    maxTimeWindow: number;
    minBatchSize: number;
    maxBatchSize: number;
  }
): Observable<TimeBatchResult<T>> {
  return interval(100).pipe(
    // Sample system load every 100ms
    map(() => {
      const load = getSystemLoad();
      // Calculate adaptive time window based on load
      const timeWindow = Math.floor(
        config.minTimeWindow + (config.maxTimeWindow - config.minTimeWindow) * load
      );
      // Calculate adaptive batch size based on load (inverse relationship)
      const batchSize = Math.floor(
        config.maxBatchSize - (config.maxBatchSize - config.minBatchSize) * load
      );

      return { timeWindow, batchSize };
    }),
    // Switch to a new buffer strategy based on current load
    switchMap(adaptiveConfig =>
      source.pipe(
        bufferTime(adaptiveConfig.timeWindow, null, adaptiveConfig.batchSize),
        filter(events => events.length > 0),
        map(events =>
          createBatchResult(
            events,
            { timeWindow: adaptiveConfig.timeWindow },
            true,
            events.length >= adaptiveConfig.batchSize
          )
        )
      )
    )
  );
}

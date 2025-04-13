import { Observable, Subject, bufferTime, filter, share } from 'rxjs';
import { ModuleEvent, ModuleEventType, moduleEventBus } from '../../lib/modules/ModuleEvents';

/**
 * Event batch configuration
 */
export interface EventBatchConfig {
  /**
   * Time window in milliseconds to batch events
   */
  timeWindow: number;

  /**
   * Maximum number of events in a batch
   */
  maxBatchSize?: number;

  /**
   * Whether to emit empty batches
   */
  emitEmptyBatches?: boolean;
}

/**
 * Default batch configuration
 */
const DEFAULT_BATCH_CONFIG: EventBatchConfig = {
  timeWindow: 100, // 100ms default batch window
  maxBatchSize: 100, // 100 events max per batch
  emitEmptyBatches: false, // Don't emit empty batches
};

/**
 * Event batch with metadata
 */
export interface EventBatch<T extends ModuleEvent = ModuleEvent> {
  /**
   * Events in the batch
   */
  events: T[];

  /**
   * Timestamp when the batch was created
   */
  timestamp: number;

  /**
   * Batch size
   */
  size: number;

  /**
   * Time window in milliseconds
   */
  timeWindow: number;

  /**
   * Event types in the batch
   */
  eventTypes: Set<ModuleEventType>;

  /**
   * Module IDs in the batch
   */
  moduleIds: Set<string>;
}

/**
 * Subject for all module events
 */
const moduleEventSubject = new Subject<ModuleEvent>();

/**
 * Observable for all module events
 */
const moduleEvents$ = moduleEventSubject.asObservable().pipe(
  share() // Share the observable to prevent multiple subscriptions
);

/**
 * Map of event type to batch subject
 */
const batchSubjects = new Map<string, Subject<EventBatch>>();

/**
 * Map of event type to batch configuration
 */
const batchConfigs = new Map<string, EventBatchConfig>();

/**
 * Initialize the event batcher
 */
export function initializeEventBatcher(): () => void {
  // Subscribe to all module events and forcombatd them to the subject
  const unsubscribe = moduleEventBus.subscribe('MODULE_CREATED' as ModuleEventType, event => {
    moduleEventSubject.next(event);
  });

  // Return a cleanup function
  return () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
    moduleEventSubject.complete();

    // Complete all batch subjects
    batchSubjects.forEach(subject => subject.complete());
    batchSubjects.clear();
    batchConfigs.clear();
  };
}

/**
 * Create a batch key from event types
 */
function createBatchKey(eventTypes: ModuleEventType[]): string {
  return eventTypes.sort().join('|');
}

/**
 * Create a batched event stream for specific event types
 */
export function createBatchedEventStream(
  eventTypes: ModuleEventType[],
  config: Partial<EventBatchConfig> = {}
): Observable<EventBatch> {
  // Create a batch key
  const batchKey = createBatchKey(eventTypes);

  // Check if a batch subject already exists for this key
  if (batchSubjects.has(batchKey)) {
    return batchSubjects.get(batchKey)!.asObservable();
  }

  // Merge config with defaults
  const batchConfig: EventBatchConfig = {
    ...DEFAULT_BATCH_CONFIG,
    ...config,
  };

  // Store the config
  batchConfigs.set(batchKey, batchConfig);

  // Create a new subject
  const batchSubject = new Subject<EventBatch>();
  batchSubjects.set(batchKey, batchSubject);

  // Create a filtered stream for the specified event types
  const filteredEvents$ = moduleEvents$.pipe(filter(event => eventTypes.includes(event?.type)));

  // Create a batched stream
  filteredEvents$
    .pipe(
      bufferTime(batchConfig.timeWindow, null, batchConfig.maxBatchSize || Number.MAX_SAFE_INTEGER),
      filter(events => batchConfig.emitEmptyBatches || events.length > 0)
    )
    .subscribe(events => {
      // Create a batch
      const batch: EventBatch = {
        events,
        timestamp: Date.now(),
        size: events.length,
        timeWindow: batchConfig.timeWindow,
        eventTypes: new Set(events.map(event => event?.type)),
        moduleIds: new Set(events.map(event => event?.moduleId)),
      };

      // Emit the batch
      batchSubject.next(batch);
    });

  return batchSubject.asObservable();
}

/**
 * Update batch configuration for specific event types
 */
export function updateBatchConfig(
  eventTypes: ModuleEventType[],
  config: Partial<EventBatchConfig>
): void {
  // Create a batch key
  const batchKey = createBatchKey(eventTypes);

  // Get the current config
  const currentConfig = batchConfigs.get(batchKey) || DEFAULT_BATCH_CONFIG;

  // Update the config
  batchConfigs.set(batchKey, {
    ...currentConfig,
    ...config,
  });

  // Re-create the batch stream with the new config
  if (batchSubjects.has(batchKey)) {
    // Complete the old subject
    batchSubjects.get(batchKey)!.complete();
    batchSubjects.delete(batchKey);

    // Create a new stream with the updated config
    createBatchedEventStream(eventTypes, batchConfigs.get(batchKey));
  }
}

/**
 * Get batch configuration for specific event types
 */
export function getBatchConfig(eventTypes: ModuleEventType[]): EventBatchConfig {
  // Create a batch key
  const batchKey = createBatchKey(eventTypes);

  // Return the config or default
  return batchConfigs.get(batchKey) || DEFAULT_BATCH_CONFIG;
}

/**
 * Process a batch of events with a handler function
 */
export function processBatch<T>(batch: EventBatch, handler: (events: ModuleEvent[]) => T): T {
  return handler(batch.events);
}

/**
 * Group events in a batch by event type
 */
export function groupBatchByEventType(batch: EventBatch): Record<ModuleEventType, ModuleEvent[]> {
  const result: Record<ModuleEventType, ModuleEvent[]> = {} as Record<
    ModuleEventType,
    ModuleEvent[]
  >;

  batch.events.forEach(event => {
    if (!result[event?.type]) {
      result[event?.type] = [];
    }
    result[event?.type].push(event);
  });

  return result;
}

/**
 * Group events in a batch by module ID
 */
export function groupBatchByModuleId(batch: EventBatch): Record<string, ModuleEvent[]> {
  const result: Record<string, ModuleEvent[]> = {};

  batch.events.forEach(event => {
    if (!result[event?.moduleId]) {
      result[event?.moduleId] = [];
    }
    result[event?.moduleId].push(event);
  });

  return result;
}

/**
 * Filter events in a batch by a predicate function
 */
export function filterBatch(
  batch: EventBatch,
  predicate: (event: ModuleEvent) => boolean
): EventBatch {
  const filteredEvents = batch.events.filter(predicate);

  return {
    ...batch,
    events: filteredEvents,
    size: filteredEvents.length,
    eventTypes: new Set(filteredEvents.map(event => event?.type)),
    moduleIds: new Set(filteredEvents.map(event => event?.moduleId)),
  };
}

/**
 * Map events in a batch using a mapping function
 */
export function mapBatch<T>(batch: EventBatch, mapper: (event: ModuleEvent) => T): T[] {
  return batch.events.map(mapper);
}

/**
 * Reduce events in a batch to a single value
 */
export function reduceBatch<T>(
  batch: EventBatch,
  reducer: (accumulator: T, event: ModuleEvent) => T,
  initialValue: T
): T {
  return batch.events.reduce(reducer, initialValue);
}

/**
 * Get batch statistics
 */
export function getBatchStats(batch: EventBatch): {
  eventCount: number;
  eventTypeCount: number;
  moduleIdCount: number;
  eventTypeCounts: Record<ModuleEventType, number>;
  moduleIdCounts: Record<string, number>;
} {
  const eventTypeCounts: Record<ModuleEventType, number> = {} as Record<ModuleEventType, number>;
  const moduleIdCounts: Record<string, number> = {};

  batch.events.forEach(event => {
    // Count event types
    if (!eventTypeCounts[event?.type]) {
      eventTypeCounts[event?.type] = 0;
    }
    eventTypeCounts[event?.type]++;

    // Count module IDs
    if (!moduleIdCounts[event?.moduleId]) {
      moduleIdCounts[event?.moduleId] = 0;
    }
    moduleIdCounts[event?.moduleId]++;
  });

  return {
    eventCount: batch.size,
    eventTypeCount: batch.eventTypes.size,
    moduleIdCount: batch.moduleIds.size,
    eventTypeCounts,
    moduleIdCounts,
  };
}

/**
 * Create a debounced event stream for specific event types
 * This is useful for UI updates that don't need to happen on every event
 */
export function createDebouncedEventStream(
  eventTypes: ModuleEventType[],
  debounceTime: number
): Observable<ModuleEvent> {
  // Create a batched stream with a time window equal to the debounce time
  const batchedStream$ = createBatchedEventStream(eventTypes, {
    timeWindow: debounceTime,
    emitEmptyBatches: false,
  });

  // Create a subject for the debounced events
  const debouncedSubject = new Subject<ModuleEvent>();

  // Subscribe to the batched stream and emit the last event of each batch
  batchedStream$.subscribe(batch => {
    if (batch.events.length > 0) {
      // Emit the last event in the batch
      debouncedSubject.next(batch.events[batch.events.length - 1]);
    }
  });

  return debouncedSubject.asObservable();
}

/**
 * Create a throttled event stream for specific event types
 * This is useful for high-frequency events that need to be limited
 */
export function createThrottledEventStream(
  eventTypes: ModuleEventType[],
  throttleTime: number
): Observable<ModuleEvent> {
  // Create a batched stream with a time window equal to the throttle time
  const batchedStream$ = createBatchedEventStream(eventTypes, {
    timeWindow: throttleTime,
    emitEmptyBatches: false,
  });

  // Create a subject for the throttled events
  const throttledSubject = new Subject<ModuleEvent>();

  // Subscribe to the batched stream and emit the first event of each batch
  batchedStream$.subscribe(batch => {
    if (batch.events.length > 0) {
      // Emit the first event in the batch
      throttledSubject.next(batch.events[0]);
    }
  });

  return throttledSubject.asObservable();
}

/**
 * Emit a batch of events through the module event bus
 */
export function emitEventBatch(batch: EventBatch): void {
  // Emit each event in the batch
  batch.events.forEach(event => {
    moduleEventBus.emit(event);
  });
}

/**
 * Create a combined batch stream from multiple batch streams
 */
export function combineBatchStreams(...streams: Observable<EventBatch>[]): Observable<EventBatch> {
  // Create a subject for the combined batches
  const combinedSubject = new Subject<EventBatch>();

  // Subscribe to all streams
  streams.forEach(stream => {
    stream.subscribe(batch => {
      combinedSubject.next(batch);
    });
  });

  return combinedSubject.asObservable();
}

/**
 * Create a filtered batch stream
 */
export function filterBatchStream(
  stream: Observable<EventBatch>,
  predicate: (batch: EventBatch) => boolean
): Observable<EventBatch> {
  // Create a subject for the filtered batches
  const filteredSubject = new Subject<EventBatch>();

  // Subscribe to the stream
  stream.subscribe(batch => {
    if (predicate(batch)) {
      filteredSubject.next(batch);
    }
  });

  return filteredSubject.asObservable();
}

/**
 * Create a mapped batch stream
 */
export function mapBatchStream<T>(
  stream: Observable<EventBatch>,
  mapper: (batch: EventBatch) => T
): Observable<T> {
  // Create a subject for the mapped batches
  const mappedSubject = new Subject<T>();

  // Subscribe to the stream
  stream.subscribe(batch => {
    mappedSubject.next(mapper(batch));
  });

  return mappedSubject.asObservable();
}

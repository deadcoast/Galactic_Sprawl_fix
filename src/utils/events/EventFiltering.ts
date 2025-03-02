import { Observable, timer } from 'rxjs';
import { buffer, debounceTime, filter, groupBy, map, mergeMap } from 'rxjs/operators';
import { ModuleEvent, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { MessagePriority, SystemMessage } from './EventCommunication';

/**
 * Filter condition type for event filtering
 */
export type FilterCondition<T> = (event: T) => boolean;

/**
 * Event batch processor type
 */
export type BatchProcessor<T, R> = (events: T[]) => R;

/**
 * Event priority queue for handling events based on priority
 */
export class EventPriorityQueue<T extends { priority?: number }> {
  private queues: Map<number, T[]> = new Map();
  private processing = false;
  private processingPromise: Promise<void> | null = null;
  private processor: (event: T) => Promise<void> | void;

  /**
   * Create a new event priority queue
   * @param processor Function to process each event
   */
  constructor(processor: (event: T) => Promise<void> | void) {
    this.processor = processor;

    // Initialize queues for each priority level
    for (let i = 0; i <= 4; i++) {
      this.queues.set(i, []);
    }
  }

  /**
   * Add an event to the queue
   * @param event Event to add
   */
  public enqueue(event: T): void {
    const priority = event.priority !== undefined ? event.priority : MessagePriority.NORMAL;
    const queue = this.queues.get(priority);
    if (queue) {
      queue.push(event);
      this.processQueue();
    }
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;
    this.processingPromise = this.processQueueInternal();
    await this.processingPromise;
    this.processingPromise = null;
    this.processing = false;

    // Check if new events were added during processing
    let hasEvents = false;
    // Convert Map entries to array to avoid MapIterator error
    const queueValues = Array.from(this.queues.values());
    for (const queue of queueValues) {
      if (queue.length > 0) {
        hasEvents = true;
        break;
      }
    }

    if (hasEvents) {
      this.processQueue();
    }
  }

  /**
   * Internal queue processing
   */
  private async processQueueInternal(): Promise<void> {
    // Process all events in priority order
    const queueEntries = Array.from(this.queues.entries());
    for (const [_priority, queue] of queueEntries) {
      while (queue.length > 0) {
        const event = queue.shift();
        if (event) {
          try {
            const result = this.processor(event);
            if (result instanceof Promise) {
              await result;
            }
          } catch (error) {
            console.error('Error processing event:', error);
          }
        }
      }
    }
  }

  /**
   * Get the current queue sizes
   */
  public getQueueSizes(): Record<number, number> {
    const sizes: Record<number, number> = {};
    // Convert Map entries to array to avoid MapIterator error
    const queueEntries = Array.from(this.queues.entries());
    for (const [priority, queue] of queueEntries) {
      sizes[priority] = queue.length;
    }
    return sizes;
  }

  /**
   * Check if the queue is currently processing
   */
  public isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Wait for all current processing to complete
   */
  public async waitForProcessing(): Promise<void> {
    if (this.processingPromise) {
      await this.processingPromise;
    }
  }

  /**
   * Clear all queues
   */
  public clear(): void {
    // Convert Map entries to array to avoid MapIterator error
    const queueValues = Array.from(this.queues.values());
    for (const queue of queueValues) {
      queue.length = 0;
    }
  }

  /**
   * Process all events in priority order
   */
  public processAll(): void {
    // Convert Map entries to array to avoid MapIterator error
    const queueEntries = Array.from(this.queues.entries());
    for (const [_priority, queue] of queueEntries) {
      while (queue.length > 0) {
        const event = queue.shift();
        if (event) {
          this.processor(event);
        }
      }
    }
  }
}

/**
 * Create a filtered event stream
 * @param source Source observable
 * @param condition Filter condition
 */
export function createFilteredStream<T>(
  source: Observable<T>,
  condition: FilterCondition<T>
): Observable<T> {
  return source.pipe(filter(condition));
}

/**
 * Create a batched event stream
 * @param source Source observable
 * @param timeWindow Time window for batching in milliseconds
 * @param processor Batch processor function
 */
export function createBatchedStream<T, R>(
  source: Observable<T>,
  timeWindow: number,
  processor: BatchProcessor<T, R>
): Observable<R> {
  return source.pipe(
    buffer(timer(0, timeWindow)),
    filter(events => events.length > 0),
    map(events => processor(events))
  );
}

/**
 * Create a grouped event stream
 * @param source Source observable
 * @param keySelector Function to select the key for grouping
 */
export function createGroupedStream<T, K>(
  source: Observable<T>,
  keySelector: (event: T) => K
): Observable<{ key: K; events: T[] }> {
  return source.pipe(
    groupBy(keySelector),
    mergeMap(group => {
      return group.pipe(
        buffer(group.pipe(debounceTime(100))),
        map(events => ({ key: group.key, events }))
      );
    })
  );
}

/**
 * Filter module events by type
 * @param events Module events observable
 * @param type Event type to filter
 */
export function filterEventsByType(
  events: Observable<ModuleEvent>,
  type: ModuleEventType
): Observable<ModuleEvent> {
  return events.pipe(filter(event => event.type === type));
}

/**
 * Filter module events by module ID
 * @param events Module events observable
 * @param moduleId Module ID to filter
 */
export function filterEventsByModuleId(
  events: Observable<ModuleEvent>,
  moduleId: string
): Observable<ModuleEvent> {
  return events.pipe(filter(event => event.moduleId === moduleId));
}

/**
 * Filter module events by module type
 * @param events Module events observable
 * @param moduleType Module type to filter
 */
export function filterEventsByModuleType(
  events: Observable<ModuleEvent>,
  moduleType: string
): Observable<ModuleEvent> {
  return events.pipe(filter(event => event.moduleType === moduleType));
}

/**
 * Filter system messages by type
 * @param messages System messages observable
 * @param type Message type to filter
 */
export function filterMessagesByType(
  messages: Observable<SystemMessage>,
  type: string
): Observable<SystemMessage> {
  return messages.pipe(filter(message => message.type === type));
}

/**
 * Filter system messages by source
 * @param messages System messages observable
 * @param source Source system ID to filter
 */
export function filterMessagesBySource(
  messages: Observable<SystemMessage>,
  source: string
): Observable<SystemMessage> {
  return messages.pipe(filter(message => message.source === source));
}

/**
 * Filter system messages by priority
 * @param messages System messages observable
 * @param priority Priority level to filter
 * @param comparison Comparison operator ('eq' | 'lt' | 'lte' | 'gt' | 'gte')
 */
export function filterMessagesByPriority(
  messages: Observable<SystemMessage>,
  priority: MessagePriority,
  comparison: 'eq' | 'lt' | 'lte' | 'gt' | 'gte' = 'eq'
): Observable<SystemMessage> {
  return messages.pipe(
    filter(message => {
      const messagePriority = message.priority;
      switch (comparison) {
        case 'eq':
          return messagePriority === priority;
        case 'lt':
          return messagePriority < priority;
        case 'lte':
          return messagePriority <= priority;
        case 'gt':
          return messagePriority > priority;
        case 'gte':
          return messagePriority >= priority;
        default:
          return messagePriority === priority;
      }
    })
  );
}

/**
 * Create a conditional event processor
 * @param condition Condition to check
 * @param processor Processor function
 */
export function createConditionalProcessor<T>(
  condition: FilterCondition<T>,
  processor: (event: T) => void
): (event: T) => void {
  return (event: T) => {
    if (condition(event)) {
      processor(event);
    }
  };
}

/**
 * Create a debounced event processor
 * @param processor Processor function
 * @param debounceMs Debounce time in milliseconds
 */
export function createDebouncedProcessor<T>(
  processor: (event: T) => void,
  debounceMs: number
): {
  process: (event: T) => void;
  flush: () => void;
} {
  let timeout: NodeJS.Timeout | null = null;
  let lastEvent: T | null = null;

  return {
    process: (event: T) => {
      lastEvent = event;

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        if (lastEvent) {
          processor(lastEvent);
          lastEvent = null;
        }
        timeout = null;
      }, debounceMs);
    },
    flush: () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      if (lastEvent) {
        processor(lastEvent);
        lastEvent = null;
      }
    },
  };
}

/**
 * Create a throttled event processor
 * @param processor Processor function
 * @param throttleMs Throttle time in milliseconds
 */
export function createThrottledProcessor<T>(
  processor: (event: T) => void,
  throttleMs: number
): (event: T) => void {
  let lastProcessTime = 0;
  let pending: T | null = null;
  let timeout: NodeJS.Timeout | null = null;

  return (event: T) => {
    const now = Date.now();

    if (now - lastProcessTime >= throttleMs) {
      // Process immediately
      lastProcessTime = now;
      processor(event);
    } else {
      // Store for later processing
      pending = event;

      if (!timeout) {
        timeout = setTimeout(
          () => {
            if (pending) {
              processor(pending);
              pending = null;
            }
            lastProcessTime = Date.now();
            timeout = null;
          },
          throttleMs - (now - lastProcessTime)
        );
      }
    }
  };
}

/**
 * Create a batch event processor
 * @param batchProcessor Batch processor function
 * @param maxBatchSize Maximum batch size
 * @param maxWaitMs Maximum wait time in milliseconds
 */
export function createBatchProcessor<T, R>(
  batchProcessor: BatchProcessor<T, R>,
  maxBatchSize: number,
  maxWaitMs: number
): {
  process: (event: T) => void;
  flush: () => R | null;
  onResult: (callback: (result: R) => void) => () => void;
} {
  const batch: T[] = [];
  let timeout: NodeJS.Timeout | null = null;
  const resultCallbacks: Set<(result: R) => void> = new Set();

  const processCurrentBatch = (): R | null => {
    if (batch.length === 0) {
      return null;
    }

    const currentBatch = [...batch];
    batch.length = 0;

    const result = batchProcessor(currentBatch);

    // Notify callbacks
    resultCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Error in batch result callback:', error);
      }
    });

    return result;
  };

  return {
    process: (event: T) => {
      batch.push(event);

      if (batch.length >= maxBatchSize) {
        // Process immediately if batch is full
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        processCurrentBatch();
      } else if (!timeout) {
        // Start timer for batch processing
        timeout = setTimeout(() => {
          timeout = null;
          processCurrentBatch();
        }, maxWaitMs);
      }
    },
    flush: () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      return processCurrentBatch();
    },
    onResult: (callback: (result: R) => void) => {
      resultCallbacks.add(callback);
      return () => {
        resultCallbacks.delete(callback);
      };
    },
  };
}

/**
 * Create a priority-based event processor
 * @param processors Map of processors by priority
 * @param defaultPriority Default priority if not specified
 */
export function createPriorityProcessor<T extends { priority?: number }>(
  processors: Map<number, (event: T) => void>,
  defaultPriority: number = MessagePriority.NORMAL
): (event: T) => void {
  return (event: T) => {
    const priority = event.priority !== undefined ? event.priority : defaultPriority;
    const processor = processors.get(priority);

    if (processor) {
      processor(event);
    } else {
      // Find the closest priority processor
      let closestPriority: number | null = null;
      let minDistance = Infinity;

      for (const p of Array.from(processors.keys())) {
        const distance = Math.abs(p - priority);
        if (distance < minDistance) {
          minDistance = distance;
          closestPriority = p;
        }
      }

      if (closestPriority !== null) {
        const closestProcessor = processors.get(closestPriority);
        if (closestProcessor) {
          closestProcessor(event);
        }
      }
    }
  };
}

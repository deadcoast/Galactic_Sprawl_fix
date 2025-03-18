import { useEffect, useState } from 'react';
import { ErrorType, errorLoggingService } from '../../services/ErrorLoggingService';

/**
 * Base event interface that all events should extend
 */
export interface BaseEvent {
  type: string;
  timestamp?: number;
  [key: string]: unknown;
}

/**
 * Event handler function type
 */
export type EventHandler<T extends BaseEvent> = (event: T) => void | Promise<void>;

/**
 * Event subscription options
 */
export interface SubscriptionOptions {
  priority?: number; // Higher priority handlers are called first (default: 0)
  once?: boolean; // If true, the handler is automatically unsubscribed after the first call
  filter?: (event: BaseEvent) => boolean; // Only call the handler if the filter returns true
}

/**
 * Subscription details tracking
 */
interface Subscription<T extends BaseEvent> {
  id: string;
  handler: EventHandler<T>;
  options: SubscriptionOptions;
  scope?: string; // Optional scope for grouping subscriptions
}

/**
 * Event publication options
 */
export interface PublishOptions {
  async?: boolean; // Whether to publish asynchronously
  timeout?: number; // Timeout for async handlers (in ms)
  errorMode?: 'continue' | 'throw'; // Whether to continue after a handler error
}

/**
 * Event batch entry for batched events
 */
interface EventBatchEntry<T extends BaseEvent> {
  event: T;
  options?: PublishOptions;
}

/**
 * A unified event system that provides a consistent API for event handling
 * throughout the application, with support for synchronous and asynchronous
 * events, priority-based handling, and event filtering.
 */
export class EventSystem {
  private static instance: EventSystem | null = null;

  // Use a more generic type for the handlers Map to accommodate different event types
  private handlers = new Map<string, Map<string, Subscription<BaseEvent>>>();
  private batchQueue: EventBatchEntry<BaseEvent>[] = [];
  private isBatching = false;
  private isProcessingBatch = false;
  private subscriptionCounter = 0;

  // Default options for event publishing
  private defaultPublishOptions: PublishOptions = {
    async: false,
    timeout: 5000,
    errorMode: 'continue',
  };

  protected constructor() {
    // Initialize the event system
  }

  /**
   * Get the singleton instance of the EventSystem
   * @returns The singleton instance
   */
  public static getInstance(): EventSystem {
    if (!EventSystem.instance) {
      EventSystem.instance = new EventSystem();
    }
    return EventSystem.instance;
  }

  /**
   * Subscribe to an event
   * @param eventType The event type to subscribe to
   * @param handler The handler function to call when the event is published
   * @param options Optional subscription options
   * @param scope Optional scope for grouping subscriptions
   * @returns A function to unsubscribe
   */
  public subscribe<T extends BaseEvent>(
    eventType: string,
    handler: EventHandler<T>,
    options: SubscriptionOptions = {},
    scope?: string
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Map());
    }

    const subscriptionId = `${eventType}_${++this.subscriptionCounter}`;
    // Use type assertion to handle the generic type
    const subscription = {
      id: subscriptionId,
      handler,
      options,
      scope,
    } as unknown as Subscription<BaseEvent>;

    this.handlers.get(eventType)!.set(subscriptionId, subscription);

    // Return unsubscribe function
    return () => {
      const handlersForType = this.handlers.get(eventType);
      if (handlersForType) {
        handlersForType.delete(subscriptionId);
        if (handlersForType.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    };
  }

  /**
   * Publish an event
   * @param event The event to publish
   * @param options Optional publishing options
   */
  public publish<T extends BaseEvent>(event: T, options?: PublishOptions): void {
    // Ensure event has a timestamp
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    // If batching is active, add to batch queue and return
    if (this.isBatching) {
      this.batchQueue.push({ event, options });
      return;
    }

    // Merge options with defaults
    const mergedOptions = { ...this.defaultPublishOptions, ...options };

    if (mergedOptions.async) {
      this.publishAsync(event, mergedOptions).catch(error => {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorType.RUNTIME,
          undefined,
          { context: 'EventSystem.publish', eventType: event.type }
        );
      });
    } else {
      this.publishSync(event, mergedOptions);
    }
  }

  /**
   * Publish an event asynchronously
   * @param event The event to publish
   * @param options Optional publishing options
   */
  public async publishAsync<T extends BaseEvent>(
    event: T,
    options: PublishOptions = {}
  ): Promise<void> {
    // Ensure event has a timestamp
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    // Merge options with defaults
    const mergedOptions = { ...this.defaultPublishOptions, ...options, async: true };

    // Get handlers for this event type
    const handlersMap = this.handlers.get(event.type);
    if (!handlersMap || handlersMap.size === 0) {
      return;
    }

    try {
      // Convert to array and sort by priority
      const handlers = Array.from(handlersMap.values()).sort(
        (a, b) => (b.options.priority || 0) - (a.options.priority || 0)
      );

      // Create array of promises with timeout
      const promises = handlers
        .filter(subscription => this.shouldHandleEvent(subscription, event))
        .map(subscription => {
          // Handle once option
          if (subscription.options.once) {
            handlersMap.delete(subscription.id);
          }

          // Create promise with timeout
          return Promise.race([
            Promise.resolve().then(() => subscription.handler(event)),
            new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error(`Handler timeout for event ${event.type}`));
              }, mergedOptions.timeout);
            }),
          ]).catch(error => {
            if (mergedOptions.errorMode === 'throw') {
              throw error;
            } else {
              errorLoggingService.logError(
                error instanceof Error ? error : new Error(String(error)),
                ErrorType.RUNTIME,
                undefined,
                { context: 'EventSystem.publishAsync.handler', eventType: event.type }
              );
            }
          });
        });

      // Wait for all promises to resolve
      await Promise.all(promises);
    } catch (error) {
      if (mergedOptions.errorMode === 'throw') {
        throw error;
      } else {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorType.RUNTIME,
          undefined,
          { context: 'EventSystem.publishAsync', eventType: event.type }
        );
      }
    }
  }

  /**
   * Publish an event synchronously
   * @param event The event to publish
   * @param options Optional publishing options
   */
  private publishSync<T extends BaseEvent>(event: T, options: PublishOptions): void {
    // Get handlers for this event type
    const handlersMap = this.handlers.get(event.type);
    if (!handlersMap || handlersMap.size === 0) {
      return;
    }

    try {
      // Convert to array and sort by priority
      const handlers = Array.from(handlersMap.values()).sort(
        (a, b) => (b.options.priority || 0) - (a.options.priority || 0)
      );

      // Call each handler
      for (const subscription of handlers) {
        if (this.shouldHandleEvent(subscription, event)) {
          try {
            // Handle once option
            if (subscription.options.once) {
              handlersMap.delete(subscription.id);
            }

            // Call handler
            subscription.handler(event);
          } catch (error) {
            if (options.errorMode === 'throw') {
              throw error;
            } else {
              errorLoggingService.logError(
                error instanceof Error ? error : new Error(String(error)),
                ErrorType.RUNTIME,
                undefined,
                { context: 'EventSystem.publishSync.handler', eventType: event.type }
              );
            }
          }
        }
      }
    } catch (error) {
      if (options.errorMode === 'throw') {
        throw error;
      } else {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorType.RUNTIME,
          undefined,
          { context: 'EventSystem.publishSync', eventType: event.type }
        );
      }
    }
  }

  /**
   * Start a batched event publishing session
   * Multiple events can be added to the batch using publish(), and they will be
   * published together when endBatch() is called.
   */
  public startBatch(): void {
    this.isBatching = true;
    this.batchQueue = [];
  }

  /**
   * End a batched event publishing session and publish all events in the batch
   * @param async Whether to publish the batch asynchronously
   */
  public async endBatch(async = false): Promise<void> {
    if (!this.isBatching) {
      return;
    }

    this.isBatching = false;

    // If already processing a batch, just return (avoids recursive batch processing)
    if (this.isProcessingBatch) {
      return;
    }

    this.isProcessingBatch = true;

    try {
      if (async) {
        await Promise.all(
          this.batchQueue.map(entry => this.publishAsync(entry.event, entry.options))
        );
      } else {
        for (const entry of this.batchQueue) {
          this.publish(entry.event, entry.options);
        }
      }
    } finally {
      this.batchQueue = [];
      this.isProcessingBatch = false;
    }
  }

  /**
   * Clear all event subscriptions
   * @param eventType Optional event type to clear. If not provided, all subscriptions are cleared.
   * @param scope Optional scope to clear. If provided, only subscriptions in this scope are cleared.
   */
  public clearSubscriptions(eventType?: string, scope?: string): void {
    if (eventType) {
      if (scope) {
        // Clear subscriptions for a specific event type and scope
        const handlersMap = this.handlers.get(eventType);
        if (handlersMap) {
          for (const [id, subscription] of handlersMap.entries()) {
            if (subscription.scope === scope) {
              handlersMap.delete(id);
            }
          }
          if (handlersMap.size === 0) {
            this.handlers.delete(eventType);
          }
        }
      } else {
        // Clear all subscriptions for a specific event type
        this.handlers.delete(eventType);
      }
    } else if (scope) {
      // Clear all subscriptions for a specific scope
      for (const [eventType, handlersMap] of this.handlers.entries()) {
        for (const [id, subscription] of handlersMap.entries()) {
          if (subscription.scope === scope) {
            handlersMap.delete(id);
          }
        }
        if (handlersMap.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    } else {
      // Clear all subscriptions
      this.handlers.clear();
    }
  }

  /**
   * Determine whether an event should be handled by a subscription
   * @param subscription The subscription to check
   * @param event The event to check
   * @returns True if the subscription should handle the event
   */
  private shouldHandleEvent<T extends BaseEvent>(subscription: Subscription<T>, event: T): boolean {
    return !subscription.options.filter || subscription.options.filter(event);
  }

  /**
   * Create a React hook that subscribes to an event
   * @param eventType The event type to subscribe to
   * @param options Optional subscription options
   * @returns The last received event, or null if no event has been received
   */
  public createHook<T extends BaseEvent>(
    eventType: string,
    options: SubscriptionOptions = {}
  ): () => T | null {
    return () => {
      const [lastEvent, setLastEvent] = useState<T | null>(null);

      useEffect(() => {
        const unsubscribe = this.subscribe<T>(
          eventType,
          event => {
            setLastEvent(event);
          },
          options
        );

        return unsubscribe;
      }, [eventType, JSON.stringify(options)]);

      return lastEvent;
    };
  }
}

// Export singleton instance
export const eventSystem = EventSystem.getInstance();

/**
 * React hook for subscribing to events
 * @param eventType The event type to subscribe to
 * @param handler The handler function to call when the event is published
 * @param options Optional subscription options
 */
export function useEventSubscription<T extends BaseEvent>(
  eventType: string,
  handler: EventHandler<T>,
  options: SubscriptionOptions = {}
): void {
  // Use the eventSystem constant instead of EventSystem.getInstance()
  const unsubscribe = eventSystem.subscribe(eventType, handler, options);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);
}

/**
 * React hook for getting the last event of a specific type
 * @param eventType The event type to get
 * @param options Optional subscription options
 * @returns The last event of the specified type, or null if none
 */
export function useLastEvent<T extends BaseEvent>(
  eventType: string,
  options: SubscriptionOptions = {}
): T | null {
  // Use the eventSystem constant instead of EventSystem.getInstance()
  return eventSystem.createHook<T>(eventType, options)();
}

/**
 * Publish an event to all subscribers
 * @param event The event to publish
 * @param options Optional publishing options
 */
export function publishEvent<T extends BaseEvent>(event: T, options?: PublishOptions): void {
  // Use the eventSystem constant instead of EventSystem.getInstance()
  eventSystem.publish(event, options);
}

/**
 * Publish an event asynchronously to all subscribers
 * @param event The event to publish
 * @param options Optional publishing options
 * @returns A promise that resolves when all handlers have completed
 */
export async function publishEventAsync<T extends BaseEvent>(
  event: T,
  options?: PublishOptions
): Promise<void> {
  // Use the eventSystem constant instead of EventSystem.getInstance()
  await eventSystem.publishAsync(event, options);
}

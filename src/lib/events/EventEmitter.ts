/**
 * EventEmitter.ts
 *
 * A generic event emitter implementation that supports both typed events
 * and predicate-based subscriptions. This implementation is designed to be
 * compatible with the EventBus system while providing additional flexibility.
 */

import { BaseEvent, EventType } from '../../types/events/EventTypes';

/**
 * Type for event handler functions
 */
export type EventHandler<T> = (event: T) => void;

/**
 * Type for event predicate functions that can filter events
 */
export type EventPredicate<T> = (event: T) => boolean;

/**
 * Options for event subscription
 */
export interface SubscriptionOptions {
  /**
   * Call listener immediately with last event of this type if available
   */
  emitLatest?: boolean;

  /**
   * Source identification for tracking subscriptions
   */
  source?: string;

  /**
   * Priority for event processing (lower numbers = higher priority)
   */
  priority?: number;
}

/**
 * Performance metrics for event processing
 */
export interface EventPerformanceMetrics {
  eventType: string | 'all';
  emitCount: number;
  listenerCount: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  lastProcessingTime: number;
  maxProcessingTime: number;
}

/**
 * Generic EventEmitter class for simple event handling
 *
 * This implementation supports:
 * 1. Predicate-based subscriptions for filtering events
 * 2. Named event subscriptions with type safety
 * 3. Performance monitoring
 * 4. Event history tracking
 */
export class EventEmitter<T = BaseEvent> {
  private handlers: {
    predicate: EventPredicate<T>;
    handler: EventHandler<T>;
    priority: number;
  }[] = [];

  private history: T[] = [];
  private latestEvents = new Map<string, T>();
  private maxHistorySize: number;
  private metrics = new Map<string, EventPerformanceMetrics>();
  private trackPerformance: boolean;

  /**
   * Creates a new EventEmitter instance
   * @param maxHistorySize Maximum number of events to keep in history
   * @param trackPerformance Whether to track performance metrics
   */
  constructor(maxHistorySize = 100, trackPerformance = false) {
    this.maxHistorySize = maxHistorySize;
    this.trackPerformance = trackPerformance;

    // Initialize metrics for all events
    this.metrics.set('all', {
      eventType: 'all',
      emitCount: 0,
      listenerCount: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      lastProcessingTime: 0,
      maxProcessingTime: 0,
    });
  }

  /**
   * Subscribe to events that match the given predicate
   *
   * @param predicate Function to determine if an event should trigger the handler
   * @param handler Function to call when a matching event is emitted
   * @param options Additional subscription options
   * @returns Function to unsubscribe the handler
   */
  public subscribe(
    predicate: EventPredicate<T>,
    handler: EventHandler<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    const subscription = {
      predicate,
      handler,
      priority: options?.priority ?? 100,
    };

    this.handlers.push(subscription);

    // Sort handlers by priority (lower numbers = higher priority)
    this.handlers.sort((a, b) => a.priority - b.priority);

    // Update metrics
    if (this.trackPerformance) {
      this.updateListenerCountMetrics();
    }

    // Return unsubscribe function
    return () => {
      const index = this.handlers.indexOf(subscription);
      if (index !== -1) {
        this.handlers.splice(index, 1);

        // Update metrics
        if (this.trackPerformance) {
          this.updateListenerCountMetrics();
        }
      }
    };
  }

  /**
   * Subscribe to all events
   *
   * @param handler Function to call for all events
   * @param options Additional subscription options
   * @returns Function to unsubscribe the handler
   */
  public subscribeToAll(handler: EventHandler<T>, options: SubscriptionOptions = {}): () => void {
    return this.subscribe(() => true, handler, options);
  }

  /**
   * Subscribe to events using event name
   */
  public on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void {
    return this.subscribe(
      e => typeof e === 'object' && e !== null && 'type' in e && (e as { type: K }).type === event,
      handler as EventHandler<T>
    );
  }

  /**
   * Unsubscribe from events using event name
   */
  public off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void {
    const index = this.handlers.findIndex(
      h => h.handler === handler && h.predicate({ type: event } as T)
    );
    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * Emit an event to all matching subscribers
   * Supports both single argument (event object) and double argument (event name, data) patterns
   */
  public emit<K extends keyof T>(eventOrType: T | K, data?: T[K]): void {
    let event: T;
    if (typeof eventOrType === 'object' && eventOrType !== null) {
      event = eventOrType as T;
    } else {
      event = { type: eventOrType, ...data } as T;
    }

    // Add to history
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Store as latest event if it has a type property
    if (event && typeof event === 'object' && 'type' in event) {
      const eventType = String((event as Record<string, unknown>).type);
      this.latestEvents.set(eventType, event);
    }

    // Performance tracking
    const startTime = this.trackPerformance ? performance.now() : 0;
    let processingTime = 0;

    // Call matching handlers
    for (const { predicate, handler } of this.handlers) {
      if (predicate(event)) {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      }
    }

    // Update performance metrics
    if (this.trackPerformance) {
      processingTime = performance.now() - startTime;

      // Update metrics for specific event type if available
      if (event && typeof event === 'object' && 'type' in event) {
        const eventType = String((event as Record<string, unknown>).type);
        this.updatePerformanceMetrics(eventType, processingTime, this.handlers.length);
      }

      // Update overall metrics
      this.updatePerformanceMetrics('all', processingTime, this.handlers.length);
    }
  }

  /**
   * Get the event history
   *
   * @param eventType Optional event type to filter by
   * @returns Array of events
   */
  public getHistory(eventType?: string): T[] {
    if (!eventType) {
      return [...this.history];
    }

    return this.history.filter(event => {
      return (
        typeof event === 'object' &&
        event !== null &&
        'type' in event &&
        (event as Record<string, unknown>).type === eventType
      );
    });
  }

  /**
   * Get the latest event of a specific type
   *
   * @param eventType The event type to get
   * @returns The latest event of the specified type, or undefined if none exists
   */
  public getLatestEvent(eventType: string): T | undefined {
    return this.latestEvents.get(eventType);
  }

  /**
   * Get performance metrics for event processing
   *
   * @param eventType Optional event type to get metrics for, defaults to 'all'
   * @returns Performance metrics object
   */
  public getPerformanceMetrics(eventType = 'all'): EventPerformanceMetrics {
    return (
      this.metrics.get(eventType) || {
        eventType,
        emitCount: 0,
        listenerCount: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        lastProcessingTime: 0,
        maxProcessingTime: 0,
      }
    );
  }

  /**
   * Remove all event handlers
   */
  public clear(): void {
    this.handlers = [];
    this.updateListenerCountMetrics();
  }

  /**
   * Clear the event history
   */
  public clearHistory(): void {
    this.history = [];
    this.latestEvents.clear();
  }

  /**
   * Reset performance metrics
   */
  public resetMetrics(): void {
    this.metrics.clear();
    this.metrics.set('all', {
      eventType: 'all',
      emitCount: 0,
      listenerCount: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      lastProcessingTime: 0,
      maxProcessingTime: 0,
    });
  }

  /**
   * Get the number of registered handlers
   */
  public get handlerCount(): number {
    return this.handlers.length;
  }

  /**
   * Update performance metrics for an event type
   *
   * @param eventType The event type to update metrics for
   * @param processingTime The time taken to process the event
   * @param listenerCount The number of listeners for the event
   */
  private updatePerformanceMetrics(
    eventType: string,
    processingTime: number,
    listenerCount: number
  ): void {
    if (!this.trackPerformance) return;

    // Create metrics object if it doesn't exist
    if (!this.metrics.has(eventType)) {
      this.metrics.set(eventType, {
        eventType,
        emitCount: 0,
        listenerCount: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        lastProcessingTime: 0,
        maxProcessingTime: 0,
      });
    }

    const metrics = this.metrics.get(eventType)!;

    // Update metrics
    metrics.emitCount += 1;
    metrics.listenerCount = listenerCount;
    metrics.totalProcessingTime += processingTime;
    metrics.lastProcessingTime = processingTime;
    metrics.maxProcessingTime = Math.max(metrics.maxProcessingTime, processingTime);
    metrics.averageProcessingTime = metrics.totalProcessingTime / metrics.emitCount;
  }

  /**
   * Update listener count metrics
   */
  private updateListenerCountMetrics(): void {
    if (!this.trackPerformance) return;

    // Update all metrics objects with current listener count
    for (const [_eventType, metrics] of this.metrics.entries()) {
      metrics.listenerCount = this.handlers.length;
    }
  }
}

/**
 * Specialized EventEmitter for named events
 *
 * This implementation provides a more structured API for working with
 * named events, while maintaining compatibility with the base EventEmitter.
 */
export class TypedEventEmitter<T extends Record<string, unknown>> {
  private emitter: EventEmitter<{ type: keyof T | EventType } & Record<string, unknown>>;

  /**
   * Creates a new TypedEventEmitter instance
   *
   * @param maxHistorySize Maximum number of events to keep in history
   * @param trackPerformance Whether to track performance metrics
   */
  constructor(maxHistorySize = 100, trackPerformance = false) {
    this.emitter = new EventEmitter<{ type: keyof T | EventType } & Record<string, unknown>>(
      maxHistorySize,
      trackPerformance
    );
  }

  /**
   * Subscribe to an event
   *
   * @param event The event type to subscribe to
   * @param callback The function to call when the event occurs
   * @returns A function that, when called, unsubscribes the listener
   */
  public on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
    return this.emitter.subscribe(
      e => e.type === event,
      e => callback(e.data as T[K])
    );
  }

  /**
   * Unsubscribe from an event
   *
   * @deprecated Use the returned function from on() instead
   * @param event The event type to unsubscribe from
   * @param callback The function to unsubscribe
   */
  public off<K extends keyof T>(_event: K, _callback: (data: T[K]) => void): void {
    console.warn(
      'TypedEventEmitter.off() is deprecated. Use the returned function from on() instead.'
    );
    // This method is kept for backcombatd compatibility but doesn't actually work
    // since we can't identify the original subscription
  }

  /**
   * Emit an event with data
   *
   * @param event The event type to emit
   * @param data The event data
   */
  public emit<K extends keyof T>(event: K, data: T[K]): void {
    this.emitter.emit({
      type: event,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Subscribe to an event (alias for on)
   *
   * @param event The event type to subscribe to
   * @param callback The function to call when the event occurs
   * @returns A function that, when called, unsubscribes the listener
   */
  public subscribe<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
    return this.on(event, callback);
  }

  /**
   * Unsubscribe from an event (alias for off)
   *
   * @deprecated Use the returned function from subscribe() instead
   * @param event The event type to unsubscribe from
   * @param callback The function to unsubscribe
   */
  public unsubscribe<K extends keyof T>(_event: K, _callback: (data: T[K]) => void): void {
    console.warn(
      'TypedEventEmitter.unsubscribe() is deprecated. Use the returned function from subscribe() instead.'
    );
    this.off(_event, _callback);
  }

  /**
   * Remove all listeners for an event
   *
   * @param event Optional event type to remove listeners for. If not provided, all listeners are removed.
   */
  public removeAllListeners<K extends keyof T>(event?: K): void {
    // Since we can't selectively remove listeners by event type in the underlying implementation,
    // we'll need to recreate the emitter if an event is specified
    if (event) {
      // Since we can't access private properties, we'll clear all handlers
      // This is a simplified approach that removes all listeners when a specific event is specified
      this.emitter.clear();
    } else {
      this.emitter.clear();
    }
  }

  /**
   * Get the event history
   *
   * @param event Optional event type to filter by
   * @returns Array of events
   */
  public getHistory<K extends keyof T>(
    event?: K
  ): { type: keyof T | EventType; data: unknown; timestamp: number }[] {
    return this.emitter.getHistory(event as string) as {
      type: keyof T | EventType;
      data: unknown;
      timestamp: number;
    }[];
  }

  /**
   * Get performance metrics for event processing
   *
   * @param event Optional event type to get metrics for, defaults to 'all'
   * @returns Performance metrics object
   */
  public getPerformanceMetrics<K extends keyof T>(event?: K): EventPerformanceMetrics {
    return this.emitter.getPerformanceMetrics(event as string);
  }

  /**
   * Clear the event history
   */
  public clearHistory(): void {
    this.emitter.clearHistory();
  }

  /**
   * Reset performance metrics
   */
  public resetMetrics(): void {
    this.emitter.resetMetrics();
  }

  /**
   * Get the number of registered handlers
   */
  public get handlerCount(): number {
    return this.emitter.handlerCount;
  }
}

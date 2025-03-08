/**
 * @file EventBus.ts
 * Base class for event bus implementations providing standardized event management.
 *
 * This class provides:
 * 1. Standardized subscription management with automatic cleanup
 * 2. Event distribution to registered listeners
 * 3. Event history tracking with filtering capabilities
 * 4. Performance monitoring for event handling
 */

import {
  BaseEvent,
  EventCategory,
  EventType,
  getEventTypesByCategory,
  isValidEventType,
} from '../../types/events/EventTypes';

/**
 * Type for event listener function that handles events
 */
export type EventListener<T extends BaseEvent = BaseEvent> = (event: T) => void;

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
  eventType: EventType | 'all';
  emitCount: number;
  listenerCount: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  lastProcessingTime: number;
  maxProcessingTime: number;
}

/**
 * Subscription ID type used to identify subscriptions
 */
export type SubscriptionId = string;

/**
 * Subscription record to track active subscriptions
 */
interface Subscription<T extends BaseEvent = BaseEvent> {
  id: SubscriptionId;
  eventType: EventType | '*';
  listener: EventListener<T>;
  priority: number;
  source?: string;
  createdAt: number;
}

/**
 * Base EventBus class that can be extended for specific use cases
 */
export class EventBus<T extends BaseEvent = BaseEvent> {
  /**
   * Map of event types to sets of subscriptions
   * @private
   */
  private subscriptions: Map<EventType | '*', Set<Subscription<T>>>;

  /**
   * Array containing event history
   * @private
   */
  private history: T[];

  /**
   * Map containing the latest event of each type
   * @private
   */
  private latestEvents: Map<EventType, T>;

  /**
   * Maximum number of events to keep in history
   * @private
   */
  private maxHistorySize: number;

  /**
   * Map containing performance metrics for event types
   * @private
   */
  private metrics: Map<EventType | 'all', EventPerformanceMetrics>;

  /**
   * Counter for generating unique subscription IDs
   * @private
   */
  private subscriptionCounter: number;

  /**
   * Set containing subscription IDs that have been removed
   * This prevents memory leaks from dangling references
   * @private
   */
  private removedSubscriptions: Set<SubscriptionId>;

  /**
   * Creates a new EventBus instance
   * @param maxHistorySize Maximum number of events to keep in history
   * @param trackPerformance Whether to track performance metrics
   */
  constructor(
    maxHistorySize = 1000,
    protected trackPerformance = true
  ) {
    this.subscriptions = new Map();
    this.history = [];
    this.latestEvents = new Map();
    this.maxHistorySize = maxHistorySize;
    this.metrics = new Map();
    this.subscriptionCounter = 0;
    this.removedSubscriptions = new Set();

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
   * Subscribe to events of a specific type
   * @param eventType The type of event to subscribe to, or '*' for all events
   * @param listener The function to call when events of this type occur
   * @param options Additional subscription options
   * @returns A function that, when called, unsubscribes the listener
   */
  subscribe(
    eventType: EventType | '*',
    listener: EventListener<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    // Validate event type if it's not the wildcard
    if (eventType !== '*' && !isValidEventType(eventType)) {
      console.error(`[EventBus] Invalid event type: ${eventType}`);
      return () => {}; // Return no-op function
    }

    // Create set for this event type if it doesn't exist
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }

    const subscriptionId = this.generateSubscriptionId();
    const subscription: Subscription<T> = {
      id: subscriptionId,
      eventType,
      listener,
      priority: options.priority ?? 100, // Default priority
      source: options.source,
      createdAt: Date.now(),
    };

    // Add subscription to the set
    this.subscriptions.get(eventType)!.add(subscription);

    // Update metrics for total listener count
    this.updateListenerCountMetrics();

    // Emit latest event if requested
    if (options.emitLatest && eventType !== '*' && this.latestEvents.has(eventType)) {
      try {
        listener(this.latestEvents.get(eventType)!);
      } catch (error) {
        console.error(`[EventBus] Error in listener when emitting latest event:`, error);
      }
    }

    // Return unsubscribe function
    return () => this.unsubscribe(subscriptionId);
  }

  /**
   * Subscribe to events of a specific category
   * @param category The category of events to subscribe to
   * @param listener The function to call when events of this category occur
   * @param options Additional subscription options
   * @returns A function that, when called, unsubscribes all listeners
   */
  subscribeToCategory(
    category: EventCategory,
    listener: EventListener<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    const eventTypes = getEventTypesByCategory(category);
    const unsubscribeFunctions: Array<() => void> = [];

    // Subscribe to each event type in the category
    for (const eventType of eventTypes) {
      unsubscribeFunctions.push(this.subscribe(eventType, listener, options));
    }

    // Return function that unsubscribes from all event types
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Unsubscribe a listener by subscription ID
   * @param subscriptionId The ID of the subscription to remove
   */
  unsubscribe(subscriptionId: SubscriptionId): void {
    // Mark subscription as removed
    this.removedSubscriptions.add(subscriptionId);

    // Remove subscription from all event types
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const updatedSubscriptions = new Set<Subscription<T>>();

      for (const subscription of subscriptions) {
        if (subscription.id !== subscriptionId) {
          updatedSubscriptions.add(subscription);
        }
      }

      if (updatedSubscriptions.size === 0) {
        this.subscriptions.delete(eventType);
      } else {
        this.subscriptions.set(eventType, updatedSubscriptions);
      }
    }

    // Update metrics for total listener count
    this.updateListenerCountMetrics();
  }

  /**
   * Emit an event to all subscribed listeners
   * @param event The event to emit
   */
  emit(event: T): void {
    const startTime = this.trackPerformance ? performance.now() : 0;

    // Add to history
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Update latest event for this type
    this.latestEvents.set(event.type, event);

    // Get all subscriptions for this event type and the wildcard type
    const specificSubscriptions = this.subscriptions.get(event.type) || new Set<Subscription<T>>();
    const wildcardSubscriptions = this.subscriptions.get('*') || new Set<Subscription<T>>();

    // Combine and sort subscriptions by priority
    const allSubscriptions = [...specificSubscriptions, ...wildcardSubscriptions].sort(
      (a, b) => a.priority - b.priority
    );

    // Notify listeners
    for (const subscription of allSubscriptions) {
      // Skip if subscription has been removed
      if (this.removedSubscriptions.has(subscription.id)) {
        continue;
      }

      try {
        subscription.listener(event);
      } catch (error) {
        console.error(`[EventBus] Error in event listener for event type ${event.type}:`, error);
      }
    }

    // Update performance metrics
    if (this.trackPerformance) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      this.updatePerformanceMetrics(event.type, processingTime, allSubscriptions.length);
    }
  }

  /**
   * Get the latest event of a specific type
   * @param eventType The type of event to get
   * @returns The latest event of the specified type, or undefined if none exists
   */
  getLatestEvent(eventType: EventType): T | undefined {
    return this.latestEvents.get(eventType);
  }

  /**
   * Get the event history filtered by event type
   * @param eventType The type of event to filter by
   * @returns An array of events of the specified type
   */
  getEventHistory(eventType?: EventType): T[] {
    if (!eventType) {
      return [...this.history]; // Return a copy of the entire history
    }

    return this.history.filter(event => event.type === eventType);
  }

  /**
   * Get the event history filtered by module ID
   * @param moduleId The ID of the module to filter by
   * @returns An array of events for the specified module
   */
  getModuleHistory(moduleId: string): T[] {
    return this.history.filter(event => event.moduleId === moduleId);
  }

  /**
   * Get performance metrics for a specific event type or all events
   * @param eventType The type of event to get metrics for, or 'all' for all events
   * @returns Performance metrics for the specified event type
   */
  getPerformanceMetrics(eventType: EventType | 'all' = 'all'): EventPerformanceMetrics {
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
   * Clear the event history
   */
  clearHistory(): void {
    this.history = [];
    this.latestEvents.clear();
  }

  /**
   * Clear all subscriptions
   */
  clearSubscriptions(): void {
    this.subscriptions.clear();
    this.updateListenerCountMetrics();
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
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
   * Get the total number of subscriptions
   * @returns The total number of subscriptions
   */
  getSubscriptionCount(): number {
    let count = 0;
    for (const subscriptions of this.subscriptions.values()) {
      count += subscriptions.size;
    }
    return count;
  }

  /**
   * Get the number of subscriptions for a specific event type
   * @param eventType The type of event to count subscriptions for
   * @returns The number of subscriptions for the specified event type
   */
  getSubscriptionCountForType(eventType: EventType | '*'): number {
    const subscriptions = this.subscriptions.get(eventType);
    return subscriptions ? subscriptions.size : 0;
  }

  /**
   * Generate a unique subscription ID
   * @private
   * @returns A unique subscription ID
   */
  private generateSubscriptionId(): SubscriptionId {
    return `sub_${Date.now()}_${this.subscriptionCounter++}`;
  }

  /**
   * Update performance metrics for an event type
   * @private
   * @param eventType The type of event to update metrics for
   * @param processingTime The time taken to process the event
   * @param listenerCount The number of listeners for this event
   */
  private updatePerformanceMetrics(
    eventType: EventType,
    processingTime: number,
    listenerCount: number
  ): void {
    // Update metrics for specific event type
    if (!this.metrics.has(eventType)) {
      this.metrics.set(eventType, {
        eventType,
        emitCount: 0,
        listenerCount,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        lastProcessingTime: 0,
        maxProcessingTime: 0,
      });
    }

    const typeMetrics = this.metrics.get(eventType)!;
    const newEmitCount = typeMetrics.emitCount + 1;

    typeMetrics.emitCount = newEmitCount;
    typeMetrics.listenerCount = listenerCount;
    typeMetrics.totalProcessingTime += processingTime;
    typeMetrics.averageProcessingTime = typeMetrics.totalProcessingTime / newEmitCount;
    typeMetrics.lastProcessingTime = processingTime;
    typeMetrics.maxProcessingTime = Math.max(typeMetrics.maxProcessingTime, processingTime);

    // Update overall metrics
    const allMetrics = this.metrics.get('all')!;
    const newAllEmitCount = allMetrics.emitCount + 1;

    allMetrics.emitCount = newAllEmitCount;
    allMetrics.totalProcessingTime += processingTime;
    allMetrics.averageProcessingTime = allMetrics.totalProcessingTime / newAllEmitCount;
    allMetrics.lastProcessingTime = processingTime;
    allMetrics.maxProcessingTime = Math.max(allMetrics.maxProcessingTime, processingTime);
  }

  /**
   * Update listener count metrics
   * @private
   */
  private updateListenerCountMetrics(): void {
    let totalCount = 0;

    // Count all listeners
    for (const subscriptions of this.subscriptions.values()) {
      totalCount += subscriptions.size;
    }

    // Update all metrics with new listener count
    const allMetrics = this.metrics.get('all')!;
    allMetrics.listenerCount = totalCount;

    // Update individual event type metrics
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      if (eventType !== '*' && this.metrics.has(eventType)) {
        const typeMetrics = this.metrics.get(eventType)!;
        typeMetrics.listenerCount = subscriptions.size;
      }
    }
  }
}

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

import { v4 as uuidv4 } from 'uuid';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { ModuleType } from '../../types/buildings/ModuleTypes';
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
 * Event handler type that accepts a generic event data type
 */
export type EventHandler<TEventData = unknown> = (data: TEventData) => void;

/**
 * Event bus interface
 */
export interface IEventBus {
  /**
   * Subscribe to an event
   * @param eventName The name of the event to subscribe to
   * @param handler The handler function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  on<TEventData = unknown>(eventName: string, handler: EventHandler<TEventData>): () => void;

  /**
   * Subscribe to an event once
   * @param eventName The name of the event to subscribe to
   * @param handler The handler function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  once<TEventData = unknown>(eventName: string, handler: EventHandler<TEventData>): () => void;

  /**
   * Unsubscribe from an event
   * @param eventName The name of the event to unsubscribe from
   * @param handler The handler function to unsubscribe
   */
  off<TEventData = unknown>(eventName: string, handler: EventHandler<TEventData>): void;

  /**
   * Emit an event
   * @param eventName The name of the event to emit
   * @param data The data to pass to the event handlers
   */
  emitEvent<TEventData = unknown>(eventName: string, data: TEventData): void;

  /**
   * Check if an event has subscribers
   * @param eventName The name of the event to check
   * @returns Whether the event has subscribers
   */
  hasListeners(eventName: string): boolean;

  /**
   * Get the number of subscribers for an event
   * @param eventName The name of the event to check
   * @returns The number of subscribers
   */
  listenerCount(eventName: string): number;

  /**
   * Clear all subscribers for an event
   * @param eventName The name of the event to clear
   */
  clearListeners(eventName: string): void;

  /**
   * Clear all subscribers for all events
   */
  clearAllListeners(): void;
}

/**
 * Base EventBus class that can be extended for specific use cases
 */
export class EventBus<T extends BaseEvent = BaseEvent> implements IEventBus {
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

  private handlers: Map<string, Set<EventHandler>> = new Map();
  private onceHandlers: Map<string, Set<EventHandler>> = new Map();

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
      priority: options?.priority ?? 100, // Default priority
      source: options?.source,
      createdAt: Date.now(),
    };

    // Add subscription to the set
    this.subscriptions.get(eventType)!.add(subscription);

    // Update metrics for total listener count
    this.updateListenerCountMetrics();

    // Emit latest event if requested
    if (options?.emitLatest && eventType !== '*' && this.latestEvents.has(eventType)) {
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
    this.latestEvents.set(event?.type, event);

    // Get all subscriptions for this event type and the wildcard type
    const specificSubscriptions = this.subscriptions.get(event?.type) || new Set<Subscription<T>>();
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
        console.error(`[EventBus] Error in event listener for event type ${event?.type}:`, error);
      }
    }

    // Update performance metrics
    if (this.trackPerformance) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      this.updatePerformanceMetrics(event?.type, processingTime, allSubscriptions.length);
    }
  }

  /**
   * Emit an event by name and data
   * @param eventName The name of the event to emit
   * @param data The data to pass to the event handlers
   */
  emitEvent<TEventData = unknown>(eventName: string, data: TEventData): void {
    // Create an event object that conforms to the BaseEvent interface
    const event: BaseEvent = {
      id: uuidv4(),
      type: eventName as EventType,
      name: eventName as EventType,
      description: eventName as EventType,
      category: eventName as EventType,
      subCategory: eventName as EventType,
      timestamp: Date.now(),
      moduleId: (data as { moduleId?: string })?.moduleId || 'unknown',
      moduleType: (data as { moduleType?: ModuleType })?.moduleType || 'radar',
      data: data as Record<string, unknown>,
    };
    this.emit(event as T);
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

    return this.history.filter(event => event?.type === eventType);
  }

  /**
   * Get the event history filtered by module ID
   * @param moduleId The ID of the module to filter by
   * @returns An array of events for the specified module
   */
  getModuleHistory(moduleId: string): T[] {
    return this.history.filter(event => event?.moduleId === moduleId);
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

  /**
   * Subscribe to an event
   * @param eventName The name of the event to subscribe to
   * @param handler The handler function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  public on<TEventData = unknown>(
    eventName: string,
    handler: EventHandler<TEventData>
  ): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    this.handlers.get(eventName)!.add(handler as EventHandler);

    return () => this.off(eventName, handler);
  }

  /**
   * Subscribe to an event once
   * @param eventName The name of the event to subscribe to
   * @param handler The handler function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  public once<TEventData = unknown>(
    eventName: string,
    handler: EventHandler<TEventData>
  ): () => void {
    if (!this.onceHandlers.has(eventName)) {
      this.onceHandlers.set(eventName, new Set());
    }

    this.onceHandlers.get(eventName)!.add(handler as EventHandler);

    return () => this.off(eventName, handler);
  }

  /**
   * Unsubscribe from an event
   * @param eventName The name of the event to unsubscribe from
   * @param handler The handler function to unsubscribe
   */
  public off<TEventData = unknown>(eventName: string, handler: EventHandler<TEventData>): void {
    // Remove from regular handlers
    if (this.handlers.has(eventName)) {
      this.handlers.get(eventName)!.delete(handler as EventHandler);
    }

    // Remove from once handlers
    if (this.onceHandlers.has(eventName)) {
      this.onceHandlers.get(eventName)!.delete(handler as EventHandler);
    }
  }

  /**
   * Check if an event has subscribers
   * @param eventName The name of the event to check
   * @returns Whether the event has subscribers
   */
  public hasListeners(eventName: string): boolean {
    return (
      (this.handlers.has(eventName) && this.handlers.get(eventName)!.size > 0) ||
      (this.onceHandlers.has(eventName) && this.onceHandlers.get(eventName)!.size > 0)
    );
  }

  /**
   * Get the number of subscribers for an event
   * @param eventName The name of the event to check
   * @returns The number of subscribers
   */
  public listenerCount(eventName: string): number {
    let count = 0;

    if (this.handlers.has(eventName)) {
      count += this.handlers.get(eventName)!.size;
    }

    if (this.onceHandlers.has(eventName)) {
      count += this.onceHandlers.get(eventName)!.size;
    }

    return count;
  }

  /**
   * Clear all subscribers for an event
   * @param eventName The name of the event to clear
   */
  public clearListeners(eventName: string): void {
    if (this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    if (this.onceHandlers.has(eventName)) {
      this.onceHandlers.set(eventName, new Set());
    }
  }

  /**
   * Clear all subscribers for all events
   */
  public clearAllListeners(): void {
    this.handlers.clear();
    this.onceHandlers.clear();
  }
}

/**
 * Global event bus instance
 */
export const globalEventBus = new EventBus();

/**
 * Event emitter interface for classes that emit events
 */
export interface IEventEmitter {
  /**
   * Subscribe to an event
   * @param eventName The name of the event to subscribe to
   * @param handler The handler function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  on<TEventData = unknown>(eventName: string, handler: EventHandler<TEventData>): () => void;

  /**
   * Subscribe to an event once
   * @param eventName The name of the event to subscribe to
   * @param handler The handler function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  once<TEventData = unknown>(eventName: string, handler: EventHandler<TEventData>): () => void;

  /**
   * Unsubscribe from an event
   * @param eventName The name of the event to unsubscribe from
   * @param handler The handler function to unsubscribe
   */
  off<TEventData = unknown>(eventName: string, handler: EventHandler<TEventData>): void;
}

/**
 * Mixin that adds event emitter functionality to a class
 * @param Base The base class to extend
 * @returns A class that extends the base class with event emitter functionality
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EventEmitterMixin<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class extends Base implements IEventEmitter {
    private eventBus: EventBus = new EventBus();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
    }

    /**
     * Subscribe to an event
     * @param eventName The name of the event to subscribe to
     * @param handler The handler function to call when the event is emitted
     * @returns A function to unsubscribe the handler
     */
    public on<TEventData = unknown>(
      eventName: string,
      handler: EventHandler<TEventData>
    ): () => void {
      return this.eventBus.on(eventName, handler);
    }

    /**
     * Subscribe to an event once
     * @param eventName The name of the event to subscribe to
     * @param handler The handler function to call when the event is emitted
     * @returns A function to unsubscribe the handler
     */
    public once<TEventData = unknown>(
      eventName: string,
      handler: EventHandler<TEventData>
    ): () => void {
      return this.eventBus.once(eventName, handler);
    }

    /**
     * Unsubscribe from an event
     * @param eventName The name of the event to unsubscribe from
     * @param handler The handler function to unsubscribe
     */
    public off<TEventData = unknown>(eventName: string, handler: EventHandler<TEventData>): void {
      this.eventBus.off(eventName, handler);
    }

    /**
     * Emit an event
     * @param eventName The name of the event to emit
     * @param data The data to pass to the event handlers
     */
    protected emit<TEventData = unknown>(eventName: string, data: TEventData): void {
      this.eventBus.emitEvent(eventName, data);
    }

    /**
     * Clear all event listeners
     */
    protected clearAllListeners(): void {
      this.eventBus.clearAllListeners();
    }
  };
}

/**
 * Type-safe event definitions
 *
 * This allows for type checking of event data when emitting and subscribing to events.
 */
export class TypedEventEmitter<EventMap extends Record<string, unknown>> {
  private eventBus: EventBus = new EventBus();

  /**
   * Subscribe to an event
   * @param eventName The name of the event to subscribe to
   * @param handler The handler function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  public on<K extends keyof EventMap>(
    eventName: K,
    handler: EventHandler<EventMap[K]>
  ): () => void {
    return this.eventBus.on(eventName as string, handler);
  }

  /**
   * Subscribe to an event once
   * @param eventName The name of the event to subscribe to
   * @param handler The handler function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  public once<K extends keyof EventMap>(
    eventName: K,
    handler: EventHandler<EventMap[K]>
  ): () => void {
    return this.eventBus.once(eventName as string, handler);
  }

  /**
   * Unsubscribe from an event
   * @param eventName The name of the event to unsubscribe from
   * @param handler The handler function to unsubscribe
   */
  public off<K extends keyof EventMap>(eventName: K, handler: EventHandler<EventMap[K]>): void {
    this.eventBus.off(eventName as string, handler);
  }

  /**
   * Emit an event
   * @param eventName The name of the event to emit
   * @param data The data to pass to the event handlers
   */
  protected emit<K extends keyof EventMap>(eventName: K, data: EventMap[K]): void {
    this.eventBus.emitEvent(eventName as string, data);
  }

  /**
   * Clear all event listeners
   */
  protected clearAllListeners(): void {
    this.eventBus.clearAllListeners();
  }
}

/**
 * Example usage:
 *
 * ```typescript
 * // Define event types
 * interface MyEvents {
 *   'resource:added': { type: ResourceType; amount: number };
 *   'resource:removed': { type: ResourceType; amount: number };
 *   'player:levelup': { level: number; rewards: string[] };
 * }
 *
 * // Create a typed event emitter
 * class ResourceManager extends TypedEventEmitter<MyEvents> {
 *   public addResource(type: ResourceType, amount: number): void {
 *     // Add resource logic...
 *
 *     // Emit with type safety
 *     this.emit('resource:added', { type, amount });
 *   }
 * }
 *
 * // Usage with type safety
 * const manager = new ResourceManager();
 *
 * // TypeScript will enforce the correct event data type
 * manager.on('resource:added', ({ type, amount }) => {
 *   console.warn(`Added ${amount} of ${type}`);
 * });
 * ```
 */

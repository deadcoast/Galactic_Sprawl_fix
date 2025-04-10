/**
 * EventEmitterInterface.ts
 *
 * This file defines the standard interface for event emitters in the system.
 * All manager classes that need to emit events should implement this interface.
 */

import { EventType } from './EventTypes';

/**
 * Type definition for an event handler function
 * @template T The type of data associated with the event (defaults to any)
 */
export type EventHandler<T> = (data: T) => void;

/**
 * Type definition for an event predicate function used for filtering
 * @template T The type of data associated with the event (defaults to any)
 */
export type EventPredicate<T> = (data: T) => boolean;

/**
 * Options for event subscription
 */
export interface SubscriptionOptions<T> {
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
 * Standard interface for event emitters
 * This interface should be implemented by all manager classes that need to emit events
 */
export interface IEventEmitter {
  /**
   * Subscribe to an event
   * @template T The type of data associated with the event
   * @param eventType The type of event to subscribe to
   * @param handler The function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  on<T>(
    eventType: EventType | string,
    handler: EventHandler<T>,
    options?: SubscriptionOptions<T>
  ): () => void;

  /**
   * Unsubscribe a handler from an event type
   * @template T The type of data associated with the event
   * @param eventType The type of event to unsubscribe from
   * @param handler The handler function to remove
   */
  off<T>(eventType: EventType | string, handler: EventHandler<T>): void;

  /**
   * Emit an event
   * @template T The type of data associated with the event
   * @param eventType The type of event to emit
   * @param data The data associated with the event
   */
  emit<T>(eventType: EventType | string, data: T): void;

  /**
   * Remove all event listeners
   *
   * @param eventType Optional event type to remove listeners for. If not provided, all listeners are removed.
   */
  removeAllListeners(eventType?: EventType | string): void;

  /**
   * Get the number of listeners for an event type
   *
   * @param eventType The event type to get the listener count for
   * @returns The number of listeners
   */
  listenerCount(eventType: EventType | string): number;
}

/**
 * Interface for typed event emitters
 * This interface provides type safety for event data
 */
export interface ITypedEventEmitter<T extends Record<string, unknown>> {
  /**
   * Subscribe to an event
   *
   * @param event The event name (key of T)
   * @param callback The function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void;

  /**
   * Unsubscribe from an event
   *
   * @param event The event name (key of T)
   * @param callback The handler function to remove
   */
  off<K extends keyof T>(event: K, callback: (data: T[K]) => void): void;

  /**
   * Emit an event
   *
   * @param event The event name (key of T)
   * @param data The data to pass to the event handlers
   */
  emit<K extends keyof T>(event: K, data: T[K]): void;

  /**
   * Remove all event listeners
   *
   * @param event Optional event name to remove listeners for. If not provided, all listeners are removed.
   */
  removeAllListeners<K extends keyof T>(event?: K): void;
}

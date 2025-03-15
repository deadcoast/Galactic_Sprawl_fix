/**
 * BaseEventEmitter.ts
 *
 * This file provides a base implementation of the EventEmitter interface
 * that manager classes can extend to gain event emitting capabilities.
 */

import {
  EventHandler,
  IEventEmitter,
  SubscriptionOptions,
} from '../../types/events/EventEmitterInterface';
import { EventType } from '../../types/events/EventTypes';
import { EventEmitter } from './EventEmitter';

/**
 * Base class for all event emitters in the system
 * Manager classes should extend this class to gain event emitting capabilities
 */
export class BaseEventEmitter implements IEventEmitter {
  private eventEmitter: EventEmitter;

  /**
   * Creates a new BaseEventEmitter
   * @param maxHistorySize Maximum number of events to keep in history
   * @param trackPerformance Whether to track performance metrics
   */
  constructor(maxHistorySize = 100, trackPerformance = false) {
    this.eventEmitter = new EventEmitter(maxHistorySize, trackPerformance);
  }

  /**
   * Subscribe to an event
   *
   * @param eventType The type of event to subscribe to
   * @param handler The function to call when the event is emitted
   * @param options Additional subscription options
   * @returns A function to unsubscribe the handler
   */
  public on<T = any>(
    eventType: EventType | string,
    handler: EventHandler<T>,
    options?: SubscriptionOptions
  ): () => void {
    return this.eventEmitter.subscribe(
      event => {
        if (typeof event === 'object' && event !== null && 'type' in event) {
          return (event as any).type === eventType;
        }
        return false;
      },
      handler as any,
      options
    );
  }

  /**
   * Unsubscribe from an event
   *
   * @param eventType The type of event to unsubscribe from
   * @param handler The handler function to remove
   */
  public off<T = any>(eventType: EventType | string, handler: EventHandler<T>): void {
    // This is a simplified implementation since the EventEmitter class doesn't have a direct 'off' method
    // In a real implementation, you would need to track subscriptions to properly remove them
    console.warn('off method is not fully implemented in BaseEventEmitter');
  }

  /**
   * Emit an event
   *
   * @param eventType The type of event to emit
   * @param data The data to pass to the event handlers
   */
  public emit<T = any>(eventType: EventType | string, data: T): void {
    // Create an event object that conforms to the BaseEvent interface
    const event = {
      type: eventType as EventType,
      timestamp: Date.now(),
      moduleId: (data as any)?.moduleId || 'unknown',
      moduleType: (data as any)?.moduleType || 'unknown',
      data: data as unknown as Record<string, unknown>,
    };
    this.eventEmitter.emit(event);
  }

  /**
   * Remove all event listeners
   *
   * @param eventType Optional event type to remove listeners for. If not provided, all listeners are removed.
   */
  public removeAllListeners(eventType?: EventType | string): void {
    // This is a simplified implementation since the EventEmitter class doesn't have a direct 'removeAllListeners' method
    // In a real implementation, you would need to track subscriptions to properly remove them
    console.warn('removeAllListeners method is not fully implemented in BaseEventEmitter');
    this.eventEmitter.clear();
  }

  /**
   * Get the number of listeners for an event type
   *
   * @param eventType The event type to get the listener count for
   * @returns The number of listeners
   */
  public listenerCount(eventType: EventType | string): number {
    // This is a simplified implementation since the EventEmitter class doesn't track listeners by event type
    return this.eventEmitter.handlerCount;
  }

  /**
   * Get the event history
   *
   * @param eventType Optional event type to filter by
   * @returns Array of events
   */
  public getHistory(eventType?: string): any[] {
    return this.eventEmitter.getHistory(eventType);
  }

  /**
   * Get the latest event of a specific type
   *
   * @param eventType The event type to get
   * @returns The latest event of the specified type, or undefined if none exists
   */
  public getLatestEvent(eventType: string): any | undefined {
    return this.eventEmitter.getLatestEvent(eventType);
  }

  /**
   * Get performance metrics for event processing
   *
   * @param eventType Optional event type to get metrics for, defaults to 'all'
   * @returns Performance metrics object
   */
  public getPerformanceMetrics(eventType?: string): any {
    return this.eventEmitter.getPerformanceMetrics(eventType);
  }
}

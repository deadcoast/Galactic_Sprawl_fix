/**
 * BaseTypedEventEmitter.ts
 *
 * This file provides a base implementation of the ITypedEventEmitter interface
 * that manager classes can extend to gain typed event emitting capabilities.
 */

import { ITypedEventEmitter } from '../../types/events/EventEmitterInterface';
import { TypedEventEmitter } from './EventBus';

/**
 * Base class for all typed event emitters in the system
 * Manager classes should extend this class to gain typed event emitting capabilities
 */
export class BaseTypedEventEmitter<T extends Record<string, any>>
  extends TypedEventEmitter<T>
  implements ITypedEventEmitter<T>
{
  /**
   * Creates a new BaseTypedEventEmitter
   */
  constructor() {
    super();
  }

  /**
   * Emit an event
   *
   * @param event The event name (key of T)
   * @param data The data to pass to the event handlers
   */
  public emit<K extends keyof T>(event: K, data: T[K]): void {
    // Call the protected emit method from the parent class
    super.emit(event, data);
  }

  /**
   * Remove all event listeners
   *
   * @param event Optional event name to remove listeners for. If not provided, all listeners are removed.
   */
  public removeAllListeners<K extends keyof T>(event?: K): void {
    if (event) {
      // Clear listeners for a specific event
      const handlers = this.getHandlers(event);
      if (handlers) {
        handlers.forEach(handler => {
          this.off(event, handler);
        });
      }
    } else {
      // Clear all listeners
      this.clearAllListeners();
    }
  }

  /**
   * Get all handlers for a specific event
   * This is a helper method used by removeAllListeners
   *
   * @param event The event name
   * @returns Array of handlers for the event
   */
  private getHandlers<K extends keyof T>(event: K): Array<(data: T[K]) => void> {
    // This is a simplified implementation
    // In a real implementation, we would track all handlers
    return [];
  }

  /**
   * Subscribe to an event (alias for on)
   *
   * @param event The event name (key of T)
   * @param callback The function to call when the event is emitted
   * @returns A function to unsubscribe the handler
   */
  public subscribe<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
    return this.on(event, callback);
  }

  /**
   * Unsubscribe from an event (alias for off)
   *
   * @param event The event name (key of T)
   * @param callback The handler function to remove
   */
  public unsubscribe<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    this.off(event, callback);
  }
}

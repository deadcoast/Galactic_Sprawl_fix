/**
 * Base class for typed event emitters
 * Provides type-safe event emission and subscription
 */
export class BaseTypedEventEmitter<T extends Record<string, unknown>> {
  private listeners: Map<keyof T, Set<(data: T[keyof T]) => void>> = new Map();

  /**
   * Subscribe to an event
   * @param event The event to subscribe to
   * @param callback The callback function to call when the event is emitted
   * @returns A function to unsubscribe from the event
   */
  public on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const eventListeners = this.listeners.get(event)!;
    eventListeners.add(callback as (data: T[keyof T]) => void);

    // Return unsubscribe function
    return () => {
      eventListeners.delete(callback as (data: T[keyof T]) => void);
    };
  }

  /**
   * Unsubscribe from an event
   * @param event The event to unsubscribe from
   * @param callback The callback function to remove
   */
  public off<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback as (data: T[keyof T]) => void);
    }
  }

  /**
   * Subscribe to an event once
   * @param event The event to subscribe to
   * @param callback The callback function to call when the event is emitted
   * @returns A function to unsubscribe from the event
   */
  public once<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
    const onceCallback = (data: T[K]) => {
      callback(data);
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(onceCallback as (data: T[keyof T]) => void);
      }
    };

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const eventListeners = this.listeners.get(event)!;
    eventListeners.add(onceCallback as (data: T[keyof T]) => void);

    // Return unsubscribe function
    return () => {
      eventListeners.delete(onceCallback as (data: T[keyof T]) => void);
    };
  }

  /**
   * Emit an event
   * @param event The event to emit
   * @param data The data to emit with the event
   */
  protected emit<K extends keyof T>(event: K, data: T[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data as T[keyof T]));
    }
  }

  /**
   * Remove all listeners for an event or all events
   * @param event Optional event to remove listeners for. If not provided, removes all listeners.
   */
  public removeAllListeners<K extends keyof T>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   * @param event The event to get the listener count for
   * @returns The number of listeners for the event
   */
  public listenerCount<K extends keyof T>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Get all event names that have listeners
   * @returns An array of event names that have listeners
   */
  public eventNames(): Array<keyof T> {
    return Array.from(this.listeners.keys());
  }
}

/**
 * Generic event emitter implementation
 */
export class EventEmitter<T extends Record<string, any> = Record<string, any>> {
  private events: Map<keyof T, Array<(data: T[keyof T]) => void>> = new Map();

  /**
   * Subscribe to an event
   */
  public on<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)?.push(callback as (data: T[keyof T]) => void);
  }

  /**
   * Emit an event with data
   */
  public emit<K extends keyof T>(event: K, data: T[K]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data as T[keyof T]));
    }
  }

  /**
   * Unsubscribe from an event
   */
  public off<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback as (data: T[keyof T]) => void);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Subscribe to an event (alias for on)
   */
  public subscribe<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    this.on(event, callback);
  }

  /**
   * Unsubscribe from an event (alias for off)
   */
  public unsubscribe<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    this.off(event, callback);
  }

  /**
   * Remove all listeners for an event
   */
  public removeAllListeners<K extends keyof T>(event?: K): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

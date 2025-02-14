/**
 * Generic event emitter implementation
 */
export class EventEmitter<T extends Record<string, any>> {
  private listeners: Map<keyof T, Array<(data: T[keyof T]) => void>> = new Map();

  /**
   * Subscribe to an event
   */
  public on<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback as (data: T[keyof T]) => void);
  }

  /**
   * Unsubscribe from an event
   */
  public off<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback as (data: T[keyof T]) => void);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event with data
   */
  public emit<K extends keyof T>(event: K, data: T[K]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data as T[keyof T]));
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
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

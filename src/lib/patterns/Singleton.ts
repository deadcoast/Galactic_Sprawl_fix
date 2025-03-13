/**
 * Generic Singleton implementation that can be extended by services and managers.
 * Provides a common pattern for singleton instances throughout the application.
 * 
 * @example
 * ```typescript
 * class MyService extends Singleton<MyService> {
 *   protected constructor() {
 *     super();
 *     // initialization code
 *   }
 *   
 *   public doSomething(): void {
 *     // implementation
 *   }
 * }
 * 
 * // Usage:
 * const service = MyService.getInstance();
 * service.doSomething();
 * ```
 */
export abstract class Singleton<T> {
  private static instances = new Map<string, any>();

  protected constructor() {
    // Protected constructor to prevent direct instantiation
  }

  /**
   * Gets the singleton instance of the class.
   * Creates a new instance if one doesn't exist yet.
   */
  public static getInstance<T extends Singleton<T>>(this: new () => T): T {
    const className = this.name;
    if (!Singleton.instances.has(className)) {
      Singleton.instances.set(className, new this());
    }
    return Singleton.instances.get(className) as T;
  }

  /**
   * Initializes the singleton instance.
   * This method should be overridden by subclasses that need initialization logic.
   */
  public async initialize?(): Promise<void>;

  /**
   * Disposes of resources used by the singleton instance.
   * This method should be overridden by subclasses that need cleanup logic.
   */
  public async dispose?(): Promise<void>;

  /**
   * Resets the singleton instance.
   * This is primarily useful for testing purposes.
   */
  public static resetInstance(className: string): void {
    if (Singleton.instances.has(className)) {
      const instance = Singleton.instances.get(className);
      if (instance && typeof instance.dispose === 'function') {
        instance.dispose();
      }
      Singleton.instances.delete(className);
    }
  }
}
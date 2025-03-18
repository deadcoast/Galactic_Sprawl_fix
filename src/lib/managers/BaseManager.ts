import { ErrorType, errorLoggingService } from '../../services/ErrorLoggingService';
import { EventType, BaseEvent as LegacyBaseEvent } from '../../types/events/EventTypes';
import { EventBus } from '../events/EventBus';
import { BaseEvent, eventSystem } from '../events/UnifiedEventSystem';
import { Singleton } from '../patterns/Singleton';

/**
 * Base interface for all manager classes
 */
export interface IBaseManager {
  /**
   * Initialize the manager
   */
  initialize(dependencies?: Record<string, unknown>): Promise<void>;

  /**
   * Dispose of the manager's resources
   */
  dispose(): Promise<void>;

  /**
   * Update method called on each game tick for time-based updates
   */
  update(deltaTime: number): void;

  /**
   * Get the manager's name
   */
  getName(): string;

  /**
   * Get the manager's status
   */
  getStatus(): ManagerStatus;

  /**
   * Handle errors that occur within the manager
   */
  handleError(error: Error, context?: Record<string, unknown>): void;
}

/**
 * Manager status
 */
export enum ManagerStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  DISPOSED = 'disposed',
}

/**
 * Manager metrics
 */
export interface ManagerMetrics {
  [key: string]: number;
}

/**
 * Legacy Manager Metadata for backward compatibility
 */
export interface ManagerMetadata {
  id: string;
  name: string;
  version: string;
  isInitialized: boolean;
  dependencies: string[];
  status: 'initializing' | 'active' | 'error' | 'disposed';
  lastUpdateTime?: number;
  errorMessage?: string;
  stats?: Record<string, number | string>;
}

/**
 * Standard interface for all manager services in the application.
 * This interface is maintained for backward compatibility.
 */
export interface BaseManager<TEvent extends LegacyBaseEvent = LegacyBaseEvent> {
  readonly id: string;
  readonly name: string;
  readonly eventBus: EventBus<TEvent>;
  initialize(dependencies?: Record<string, unknown>): Promise<void>;
  update(deltaTime: number): void;
  dispose(): Promise<void>;
  subscribeToEvent(eventType: EventType, handler: (event: TEvent) => void): () => void;
  publishEvent(event: TEvent): void;
  isInitialized(): boolean;
  getMetadata(): ManagerMetadata;
}

/**
 * Base manager implementation that all managers should extend
 */
export abstract class AbstractBaseManager<T extends BaseEvent = BaseEvent>
  extends Singleton<AbstractBaseManager<T>>
  implements IBaseManager
{
  public readonly id: string;
  protected managerName: string;
  protected status: ManagerStatus = ManagerStatus.UNINITIALIZED;
  protected metrics: ManagerMetrics = {};
  protected lastError: Error | null = null;
  protected unsubscribeFunctions: (() => void)[] = [];
  protected dependencies: string[] = [];
  protected lastUpdateTime?: number;

  /**
   * Constructor for the base manager
   * @param name The name of the manager
   * @param id Optional ID for the manager
   */
  protected constructor(name: string, id?: string) {
    super();
    this.managerName = name;
    this.id = id || `${name}_${Date.now()}`;
  }

  /**
   * Initialize the manager
   */
  public async initialize(dependencies?: Record<string, unknown>): Promise<void> {
    if (this.status === ManagerStatus.READY) {
      return;
    }

    try {
      this.status = ManagerStatus.INITIALIZING;

      // Store dependencies if provided
      if (dependencies) {
        this.dependencies = Object.keys(dependencies);
      }

      // Call the implementation-specific initialization
      await this.onInitialize(dependencies);

      this.status = ManagerStatus.READY;

      // Publish initialization event
      this.publish({
        type: 'MANAGER_INITIALIZED',
        managerId: this.managerName,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.status = ManagerStatus.ERROR;
      this.lastError = error instanceof Error ? error : new Error(String(error));

      this.handleError(this.lastError, { context: 'initialize' });
      throw this.lastError;
    }
  }

  /**
   * Update method called on each game tick
   */
  public update(deltaTime: number): void {
    this.lastUpdateTime = Date.now();
    if (this.status === ManagerStatus.READY) {
      this.onUpdate(deltaTime);
    }
  }

  /**
   * Dispose of the manager's resources
   */
  public async dispose(): Promise<void> {
    if (this.status === ManagerStatus.DISPOSED) {
      return;
    }

    try {
      // Unsubscribe from all events
      for (const unsubscribe of this.unsubscribeFunctions) {
        unsubscribe();
      }

      // Clear the unsubscribe functions array
      this.unsubscribeFunctions = [];

      // Call the implementation-specific disposal
      await this.onDispose();

      this.status = ManagerStatus.DISPOSED;

      // Publish disposal event
      this.publish({
        type: 'MANAGER_DISPOSED',
        managerId: this.managerName,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)), {
        context: 'dispose',
      });
      throw error;
    }
  }

  /**
   * Get the manager's name
   */
  public getName(): string {
    return this.managerName;
  }

  /**
   * Get the manager's status
   */
  public getStatus(): ManagerStatus {
    return this.status;
  }

  /**
   * Check if the manager is initialized (for compatibility)
   */
  public isInitialized(): boolean {
    return this.status === ManagerStatus.READY;
  }

  /**
   * Get manager metadata (for compatibility)
   */
  public getMetadata(): ManagerMetadata {
    return {
      id: this.id,
      name: this.managerName,
      version: this.getVersion(),
      isInitialized: this.isInitialized(),
      dependencies: this.dependencies,
      status: this.mapStatusToLegacy(this.status),
      lastUpdateTime: this.lastUpdateTime,
      errorMessage: this.lastError?.message,
      stats: this.getStats(),
    };
  }

  /**
   * Handle errors that occur within the manager
   */
  public handleError(error: Error, context?: Record<string, unknown>): void {
    this.lastError = error;

    // Log the error
    errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
      manager: this.managerName,
      status: this.status,
      ...context,
    });

    // Publish error event
    this.publish({
      type: 'MANAGER_ERROR',
      managerId: this.managerName,
      error: error.message,
      timestamp: Date.now(),
      context,
    });
  }

  /**
   * Reset the manager to its initial state
   * This is primarily useful for testing
   */
  public reset(): void {
    this.status = ManagerStatus.UNINITIALIZED;
    this.metrics = {};
    this.lastError = null;
    this.lastUpdateTime = undefined;

    // Unsubscribe from all events
    for (const unsubscribe of this.unsubscribeFunctions) {
      unsubscribe();
    }

    // Clear the unsubscribe functions array
    this.unsubscribeFunctions = [];
  }

  /**
   * Get manager metrics
   */
  public getMetrics(): ManagerMetrics {
    return { ...this.metrics };
  }

  /**
   * Update a specific metric
   */
  protected updateMetric(key: string, value: number): void {
    this.metrics[key] = value;
  }

  /**
   * Increment a metric
   */
  protected incrementMetric(key: string, increment = 1): void {
    this.metrics[key] = (this.metrics[key] ?? 0) + increment;
  }

  /**
   * Publish an event
   */
  protected publish<E extends BaseEvent>(event: E): void {
    eventSystem.publish(event);
  }

  /**
   * Legacy method for publishing events (for backward compatibility)
   */
  public publishEvent(event: LegacyBaseEvent): void {
    // Convert legacy event to new format
    this.publish({
      ...event,
    });
  }

  /**
   * Subscribe to an event
   */
  protected subscribe<E extends BaseEvent>(
    eventType: string,
    handler: (event: E) => void
  ): () => void {
    const unsubscribe = eventSystem.subscribe(eventType, handler);
    this.unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Legacy method for subscribing to events (for backward compatibility)
   */
  public subscribeToEvent(
    eventType: EventType,
    handler: (event: LegacyBaseEvent) => void
  ): () => void {
    // Adapt legacy subscription to new event system
    return this.subscribe(eventType, event => handler(event as unknown as LegacyBaseEvent));
  }

  /**
   * Start a batched event publishing session
   */
  protected startEventBatch(): void {
    eventSystem.startBatch();
  }

  /**
   * End a batched event publishing session
   */
  protected async endEventBatch(async = false): Promise<void> {
    await eventSystem.endBatch(async);
  }

  /**
   * Get the version of this manager implementation (for compatibility)
   */
  protected getVersion(): string {
    return '1.0.0';
  }

  /**
   * Get statistics for this manager (for compatibility)
   */
  protected getStats(): Record<string, number | string> {
    const result: Record<string, number | string> = {};

    // Convert numeric metrics to stats
    for (const [key, value] of Object.entries(this.metrics)) {
      result[key] = value;
    }

    return result;
  }

  /**
   * Map new status enum to legacy status string (for compatibility)
   */
  private mapStatusToLegacy(status: ManagerStatus): ManagerMetadata['status'] {
    switch (status) {
      case ManagerStatus.INITIALIZING:
        return 'initializing';
      case ManagerStatus.READY:
        return 'active';
      case ManagerStatus.ERROR:
        return 'error';
      case ManagerStatus.DISPOSED:
        return 'disposed';
      default:
        return 'initializing';
    }
  }

  /**
   * Manager-specific initialization logic
   * To be implemented by subclasses
   */
  protected abstract onInitialize(dependencies?: Record<string, unknown>): Promise<void>;

  /**
   * Manager-specific update logic
   * To be implemented by subclasses
   */
  protected abstract onUpdate(deltaTime: number): void;

  /**
   * Manager-specific disposal logic
   * To be implemented by subclasses
   */
  protected abstract onDispose(): Promise<void>;
}

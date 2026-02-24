// CIRCULAR DEPENDENCY MITIGATION:
// ErrorLoggingService extends AbstractBaseManager, creating a circular dependency.
// We use type-only import for ErrorType and lazy loading for errorLoggingService.
import type { ErrorType as ErrorTypeEnum } from '../../services/logging/ErrorLoggingService';

import { ModuleType } from '../../types/buildings/ModuleTypes';
import { EventType, BaseEvent as LegacyBaseEvent } from '../../types/events/EventTypes';
import { EventBus } from '../events/EventBus';
import { BaseEvent, eventSystem } from '../events/UnifiedEventSystem';
import { Singleton } from '../patterns/Singleton';

// Lazy-loaded error logging to break circular dependency
let _errorLoggingService: typeof import('../../services/logging/ErrorLoggingService').errorLoggingService | null = null;
let _ErrorType: typeof import('../../services/logging/ErrorLoggingService').ErrorType | null = null;

function getErrorLoggingService() {
  if (!_errorLoggingService) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require('../../services/logging/ErrorLoggingService');
      _errorLoggingService = module.errorLoggingService;
      _ErrorType = module.ErrorType;
    } catch {
      // Circular dependency not yet resolved — fall back to console
    }
  }
  if (!_errorLoggingService || !_ErrorType) {
    // Return a minimal stub so callers don't crash
    return {
      errorLoggingService: { logError: (...args: unknown[]) => console.error('[BaseManager fallback]', ...args) } as NonNullable<typeof _errorLoggingService>,
      ErrorType: { RUNTIME: 'RUNTIME' } as unknown as NonNullable<typeof _ErrorType>,
    };
  }
  return { errorLoggingService: _errorLoggingService, ErrorType: _ErrorType };
}

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
export type ManagerMetrics = Record<string, number>;

/**
 * Legacy Manager Metadata for backcombatd compatibility
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
 * This interface is maintained for backcombatd compatibility.
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
export abstract class AbstractBaseManager<T extends BaseEvent>
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
  protected metadata: ManagerMetadata;

  /**
   * Constructor for the base manager
   * @param name The name of the manager
   * @param id Optional ID for the manager
   */
  protected constructor(name: string, id?: string) {
    super();
    this.managerName = name;
    this.id = id ?? `${name}_${Date.now()}`;
    this.metadata = {
      id: this.id,
      name: this.managerName,
      version: '1.0.0',
      isInitialized: false,
      dependencies: [],
      status: 'initializing',
    };
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

    // Log the error using lazy-loaded service to avoid circular dependency
    const { errorLoggingService, ErrorType } = getErrorLoggingService();
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
   * Subscribe to an event.
   * Tracks the subscription for automatic cleanup on dispose.
   * @param eventType The event type string (or EventType enum value)
   * @param handler The function to call when the event is published
   * @returns An unsubscribe function
   */
  protected subscribe<E extends T = T>(eventType: string, handler: (event: E) => void): () => void {
    // Use global eventSystem
    const unsubscribe = eventSystem.subscribe(eventType, handler as (event: BaseEvent) => void);
    this.unsubscribeFunctions.push(unsubscribe);
    // Return a function that both unsubscribes and removes from tracking
    return () => {
      unsubscribe();
      this.unsubscribeFunctions = this.unsubscribeFunctions.filter(fn => fn !== unsubscribe);
    };
  }

  /**
   * Publish an event.
   * @param event The event object to publish
   */
  protected publish(event: Partial<BaseEvent> & Record<string, unknown>): void {
    // Default module type when not explicitly provided
    const DEFAULT_MODULE_TYPE = 'resource-manager' as ModuleType;

    const fullEvent: BaseEvent & Record<string, unknown> = {
      type: (event as BaseEvent).type ?? ('UNKNOWN_EVENT' as EventType),
      moduleId: this.id,
      moduleType: (event as BaseEvent).moduleType ?? DEFAULT_MODULE_TYPE,
      timestamp: Date.now(),
      ...(event as Record<string, unknown>),
    } as BaseEvent & Record<string, unknown>;

    eventSystem.publish(fullEvent);
  }

  /**
   * Legacy method for publishing events (for backcombatd compatibility)
   */
  public publishEvent(event: LegacyBaseEvent): void {
    // Convert legacy event to new format
    this.publish({
      ...event,
      type: event.type,
      moduleId: event.moduleId ?? this.id,
      moduleType: (event as BaseEvent).moduleType ?? ('resource-manager' as ModuleType),
      timestamp: event.timestamp ?? Date.now(),
    });
  }

  /**
   * Subscribe to an event
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

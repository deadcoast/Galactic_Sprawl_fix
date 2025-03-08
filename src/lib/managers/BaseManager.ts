import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { EventBus } from '../events/EventBus';

/**
 * Standard interface for all manager services in the application.
 * Managers handle core game logic and state, communicating with the UI
 * through contexts and events.
 */
export interface BaseManager<TEvent extends BaseEvent = BaseEvent> {
  /**
   * Unique identifier for this manager instance
   */
  readonly id: string;

  /**
   * The manager's name for identification and debugging
   */
  readonly name: string;

  /**
   * The event bus used by this manager for publishing events
   */
  readonly eventBus: EventBus<TEvent>;

  /**
   * Initialize the manager. Called by the ServiceRegistry during startup.
   * @param dependencies Optional map of dependencies provided by the ServiceRegistry
   * @returns Promise that resolves when initialization is complete
   */
  initialize(dependencies?: Record<string, unknown>): Promise<void>;

  /**
   * Update method called on each game tick for time-based updates
   * @param deltaTime Time in milliseconds since the last update
   */
  update(deltaTime: number): void;

  /**
   * Clean up resources used by this manager. Called during shutdown
   * or when the manager is removed from the ServiceRegistry.
   * @returns Promise that resolves when cleanup is complete
   */
  dispose(): Promise<void>;

  /**
   * Subscribe to an event
   * @param eventType The type of event to subscribe to
   * @param handler The function to call when the event is dispatched
   * @returns A function to unsubscribe from the event
   */
  subscribeToEvent(eventType: EventType, handler: (event: TEvent) => void): () => void;

  /**
   * Publish an event to the event bus
   * @param event The event to publish
   */
  publishEvent(event: TEvent): void;

  /**
   * Check if the manager is initialized
   */
  isInitialized(): boolean;

  /**
   * Get metadata about this manager (for debugging and monitoring)
   */
  getMetadata(): ManagerMetadata;
}

/**
 * Metadata interface for manager information
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
 * Base implementation of the BaseManager interface with common functionality
 */
export abstract class AbstractBaseManager<TEvent extends BaseEvent = BaseEvent>
  implements BaseManager<TEvent>
{
  public readonly id: string;
  public readonly eventBus: EventBus<TEvent>;
  private _isInitialized = false;
  private _status: ManagerMetadata['status'] = 'initializing';
  private _errorMessage?: string;
  private _lastUpdateTime?: number;
  private _dependencies: string[] = [];

  constructor(
    public readonly name: string,
    eventBus: EventBus<TEvent>,
    id?: string
  ) {
    this.id = id || `${name}_${Date.now()}`;
    this.eventBus = eventBus;
  }

  async initialize(dependencies?: Record<string, unknown>): Promise<void> {
    try {
      if (dependencies) {
        this._dependencies = Object.keys(dependencies);
      }

      await this.onInitialize(dependencies);
      this._isInitialized = true;
      this._status = 'active';
    } catch (error) {
      this._status = 'error';
      this._errorMessage = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  update(deltaTime: number): void {
    this._lastUpdateTime = Date.now();
    if (this._isInitialized) {
      this.onUpdate(deltaTime);
    }
  }

  async dispose(): Promise<void> {
    try {
      await this.onDispose();
      this._status = 'disposed';
    } catch (error) {
      this._status = 'error';
      this._errorMessage = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  subscribeToEvent(eventType: EventType, handler: (event: TEvent) => void): () => void {
    return this.eventBus.subscribe(eventType, handler);
  }

  publishEvent(event: TEvent): void {
    this.eventBus.emit(event);
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }

  getMetadata(): ManagerMetadata {
    return {
      id: this.id,
      name: this.name,
      version: this.getVersion(),
      isInitialized: this._isInitialized,
      dependencies: this._dependencies,
      status: this._status,
      lastUpdateTime: this._lastUpdateTime,
      errorMessage: this._errorMessage,
      stats: this.getStats(),
    };
  }

  /**
   * Get the version of this manager implementation
   */
  protected abstract getVersion(): string;

  /**
   * Get statistics for this manager (for monitoring)
   */
  protected getStats(): Record<string, number | string> {
    return {};
  }

  /**
   * Initialization logic to be implemented by concrete managers
   */
  protected abstract onInitialize(dependencies?: Record<string, unknown>): Promise<void>;

  /**
   * Update logic to be implemented by concrete managers
   */
  protected abstract onUpdate(deltaTime: number): void;

  /**
   * Cleanup logic to be implemented by concrete managers
   */
  protected abstract onDispose(): Promise<void>;
}

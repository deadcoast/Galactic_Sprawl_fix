import { EventBus } from '../../lib/events/EventBus';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { GameEvent } from '../../types/core/GameTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';

/**
 * Game manager event
 */
export interface GameManagerEvent extends BaseEvent {
  type: EventType; // Using only EventType for type safety
  gameTime?: number;
}

/**
 * Manager responsible for controlling the game loop and time
 */
export class GameManager extends AbstractBaseManager<GameManagerEvent> {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private gameTime: number = 0;
  private lastUpdate: number = 0;
  private frameId: number | null = null;
  private timeSubscribers: Set<(gameTime: number) => void> = new Set();
  private eventListeners: Map<string, Set<(event: GameEvent) => void>> = new Map();
  private eventBus: EventBus<GameManagerEvent>;

  constructor(eventBus: EventBus<GameManagerEvent>) {
    super('GameManager');
    this.eventBus = eventBus;
  }

  /**
   * @inheritdoc
   */
  protected async onInitialize(): Promise<void> {
    // Initialize game state
    this.isRunning = false;
    this.isPaused = false;
    this.gameTime = 0;
    this.lastUpdate = 0;
  }

  /**
   * @inheritdoc
   */
  protected onUpdate(deltaTime: number): void {
    if (!this.isRunning || this.isPaused) return;

    // Update game time
    this.gameTime += deltaTime;

    // Publish time update event
    this.publishEvent({
      type: EventType.TIME_UPDATED,
      timestamp: Date.now(),
      moduleId: this.id,
      moduleType: 'command' as ModuleType,
      gameTime: this.gameTime,
    });

    // Notify subscribers
    this.timeSubscribers.forEach(callback => {
      callback(this.gameTime);
    });
  }

  /**
   * @inheritdoc
   */
  protected async onDispose(): Promise<void> {
    this.stop();
    this.timeSubscribers.clear();
  }

  /**
   * @inheritdoc
   */
  protected getVersion(): string {
    return '1.0.0';
  }

  /**
   * @inheritdoc
   */
  protected getStats(): Record<string, number | string> {
    return {
      gameTime: this.gameTime,
      isRunning: this.isRunning ? 1 : 0,
      isPaused: this.isPaused ? 1 : 0,
      subscriberCount: this.timeSubscribers.size,
    };
  }

  /**
   * Start the game
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastUpdate = performance.now();

    // Start game loop
    this.updateGameLoop(this.lastUpdate);

    // Publish event
    this.publishEvent({
      type: EventType.GAME_STARTED,
      timestamp: Date.now(),
      moduleId: this.id,
      moduleType: 'command' as ModuleType,
      gameTime: this.gameTime,
    });
  }

  /**
   * Pause the game
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;

    // Publish event
    this.publishEvent({
      type: EventType.GAME_PAUSED,
      timestamp: Date.now(),
      moduleId: this.id,
      moduleType: 'command' as ModuleType,
      gameTime: this.gameTime,
    });
  }

  /**
   * Resume the game
   */
  resume(): void {
    if (!this.isRunning || !this.isPaused) return;

    this.isPaused = false;
    this.lastUpdate = performance.now();

    // Publish event
    this.publishEvent({
      type: EventType.GAME_RESUMED,
      timestamp: Date.now(),
      moduleId: this.id,
      moduleType: 'command' as ModuleType,
      gameTime: this.gameTime,
    });
  }

  /**
   * Stop the game
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.isPaused = false;

    // Cancel animation frame
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    // Publish event
    this.publishEvent({
      type: EventType.GAME_STOPPED,
      timestamp: Date.now(),
      moduleId: this.id,
      moduleType: 'command' as ModuleType,
      gameTime: this.gameTime,
    });
  }

  /**
   * Subscribe to game time updates
   * @param callback Function to call with updated game time
   * @returns Unsubscribe function
   */
  public subscribeToGameTime(callback: (gameTime: number) => void): () => void {
    this.timeSubscribers.add(callback);
    return () => {
      this.timeSubscribers.delete(callback);
    };
  }

  /**
   * Add event listener for game events
   * @param type Event type to listen for
   * @param callback Function to call when event is dispatched
   * @returns Unsubscribe function
   */
  addEventListener(type: string, callback: (event: GameEvent) => void): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }

    this.eventListeners.get(type)?.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(type);
      if (listeners) {
        listeners.delete(callback);
        // Clean up empty listener sets
        if (listeners.size === 0) {
          this.eventListeners.delete(type);
        }
      }
    };
  }

  /**
   * Dispatch game event
   */
  dispatchEvent(event: GameEvent) {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  /**
   * Update game state - this is the game loop
   * This is public to match the AbstractBaseManager interface
   */
  public update(deltaTime: number): void {
    // This is the public method required by AbstractBaseManager
    // We delegate to onUpdate which contains our actual implementation
    this.onUpdate(deltaTime);
  }

  /**
   * Internal update method for the game loop
   */
  private updateGameLoop(timestamp: number): void {
    if (!this.isRunning) return;

    // Calculate delta time
    const deltaTime = (timestamp - this.lastUpdate) / 1000;
    this.lastUpdate = timestamp;

    // Update game state
    this.onUpdate(deltaTime);

    // Publish time update event
    this.publishEvent({
      type: EventType.TIME_UPDATED,
      timestamp: Date.now(),
      moduleId: this.id,
      moduleType: 'command' as ModuleType,
      gameTime: this.gameTime,
    });

    // Notify subscribers
    this.timeSubscribers.forEach(callback => {
      callback(this.gameTime);
    });

    // Schedule next update
    this.frameId = requestAnimationFrame(this.updateGameLoop.bind(this));
  }

  /**
   * Get current game time
   */
  getGameTime(): number {
    return this.gameTime;
  }

  /**
   * Check if game is running
   */
  isGameRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Check if game is paused
   */
  isGamePaused(): boolean {
    return this.isPaused;
  }
}

// Create singleton instance with default event bus
const gameEventBus = new EventBus<GameManagerEvent>();
export const gameManager = new GameManager(gameEventBus);

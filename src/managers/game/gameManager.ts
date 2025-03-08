import { EventBus } from '../../lib/events/EventBus';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { GameEvent } from '../../types/core/GameTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';

/**
 * Game events specific to the game manager
 */
export enum GameManagerEventType {
  GAME_STARTED = 'GAME_STARTED',
  GAME_PAUSED = 'GAME_PAUSED',
  GAME_RESUMED = 'GAME_RESUMED',
  GAME_STOPPED = 'GAME_STOPPED',
  TIME_UPDATED = 'TIME_UPDATED',
}

/**
 * Game manager event
 */
export interface GameManagerEvent extends BaseEvent {
  type: GameManagerEventType | EventType;
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
  private subscribers: Set<(gameTime: number) => void> = new Set();
  private eventListeners: Map<string, Set<(event: GameEvent) => void>> = new Map();

  constructor(eventBus: EventBus<GameManagerEvent>) {
    super('GameManager', eventBus);
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

    // Register event handlers if needed
    console.log('GameManager initialized');
  }

  /**
   * @inheritdoc
   */
  protected onUpdate(deltaTime: number): void {
    if (this.isRunning && !this.isPaused) {
      // Directly update game time with the provided delta
      this.gameTime += deltaTime;

      // Notify subscribers
      this.subscribers.forEach(callback => {
        callback(this.gameTime);
      });

      // Publish time updated event
      this.publishEvent({
        type: GameManagerEventType.TIME_UPDATED,
        gameTime: this.gameTime,
      });
    }
  }

  /**
   * @inheritdoc
   */
  protected async onDispose(): Promise<void> {
    this.stop();
    this.subscribers.clear();
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
      subscriberCount: this.subscribers.size,
    };
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastUpdate = performance.now();
      this.frameId = requestAnimationFrame(this.update.bind(this));

      this.publishEvent({
        type: GameManagerEventType.GAME_STARTED,
        gameTime: this.gameTime,
      });
    }
  }

  /**
   * Pause the game
   */
  pause(): void {
    if (!this.isPaused && this.isRunning) {
      this.isPaused = true;

      this.publishEvent({
        type: GameManagerEventType.GAME_PAUSED,
        gameTime: this.gameTime,
      });
    }
  }

  /**
   * Resume the game
   */
  resume(): void {
    if (this.isPaused && this.isRunning) {
      this.isPaused = false;
      this.lastUpdate = performance.now();

      this.publishEvent({
        type: GameManagerEventType.GAME_RESUMED,
        gameTime: this.gameTime,
      });
    }
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      this.isPaused = false;

      if (this.frameId !== null) {
        cancelAnimationFrame(this.frameId);
        this.frameId = null;
      }

      this.publishEvent({
        type: GameManagerEventType.GAME_STOPPED,
        gameTime: this.gameTime,
      });
    }
  }

  /**
   * Subscribe to game updates
   * @param callback Function to call on each update
   * @returns Function to unsubscribe
   */
  subscribe(callback: (gameTime: number) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Add event listener
   */
  addEventListener(type: string, callback: (event: GameEvent) => void) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)?.add(callback);
    return () => {
      this.eventListeners.get(type)?.delete(callback);
    };
  }

  /**
   * Dispatch game event
   */
  dispatchEvent(event: GameEvent) {
    this.eventListeners.get(event.type)?.forEach(callback => {
      callback(event);
    });
  }

  /**
   * Main update loop
   */
  private update(timestamp: number): void {
    if (!this.isRunning) return;

    if (!this.isPaused) {
      const deltaTime = timestamp - this.lastUpdate;
      this.gameTime += deltaTime;

      // Notify subscribers
      this.subscribers.forEach(callback => {
        callback(this.gameTime);
      });

      // Publish time updated event
      this.publishEvent({
        type: GameManagerEventType.TIME_UPDATED,
        gameTime: this.gameTime,
      });
    }

    this.lastUpdate = timestamp;
    this.frameId = requestAnimationFrame(this.update.bind(this));
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

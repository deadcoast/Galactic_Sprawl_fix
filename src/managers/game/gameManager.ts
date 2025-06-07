import { BaseEvent, eventSystem } from '../../lib/events/UnifiedEventSystem';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { GameEvent } from '../../types/core/GameTypes';
import { EventType } from '../../types/events/EventTypes';

/**
 * Game manager event
 */
export interface GameManagerEvent extends BaseEvent {
  type: EventType;
  gameTime?: number;
}

/**
 * Manager responsible for controlling the game loop and time
 */
export class GameManager extends AbstractBaseManager<GameManagerEvent> {
  private isRunning = false;
  private isPaused = false;
  private gameTime = 0;
  private lastUpdate = 0;
  private frameId: number | null = null;

  constructor() {
    super('GameManager');
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
    this.publish({
      type: EventType.TIME_UPDATED,
      timestamp: Date.now(),
      moduleId: this.id,
      moduleType: 'command' as ModuleType,
      gameTime: this.gameTime,
    });
  }

  /**
   * @inheritdoc
   */
  protected async onDispose(): Promise<void> {
    this.stop();
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
    this.publish({
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
    this.publish({
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
    this.publish({
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
    this.publish({
      type: EventType.GAME_STOPPED,
      timestamp: Date.now(),
      moduleId: this.id,
      moduleType: 'command' as ModuleType,
      gameTime: this.gameTime,
    });
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

    // Update game state using the protected onUpdate method
    this.onUpdate(deltaTime);

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

  /**
   * Dispatch a generic GameEvent using the global event system
   * This maintains compatibility with legacy hooks that expect a dispatchEvent API.
   * @param event The GameEvent to dispatch
   */
  public dispatchEvent(event: GameEvent): void {
    // Ensure the event has a timestamp for the UnifiedEventSystem contract
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp ?? Date.now(),
      moduleId: this.id,
      moduleType: 'command' as ModuleType,
    } as unknown as BaseEvent;

    // Forward the event to the global event system
    eventSystem.publish(eventWithTimestamp);
  }

  /**
   * Subscribe to TIME_UPDATED events and receive the current gameTime value.
   * @param handler Callback invoked with the latest gameTime.
   * @returns Unsubscribe function.
   */
  public subscribeToGameTime(handler: (gameTime: number) => void): () => void {
    return this.subscribe<GameManagerEvent>(EventType.TIME_UPDATED, event => {
      if (typeof event.gameTime === 'number') {
        handler(event.gameTime);
      }
    });
  }

  /**
   * Generic event listener helper to maintain legacy compatibility.
   * If the special "*" wildcard is provided, the listener will subscribe
   * to all GameManager-related EventType values and return a single
   * composite unsubscribe.
   *
   * @param eventType Specific EventType string or the wildcard "*".
   * @param handler   Callback for incoming events.
   * @returns Unsubscribe function for the created subscription(s).
   */
  public addEventListener(
    eventType: EventType | string | '*',
    handler: (event: GameManagerEvent) => void
  ): () => void {
    if (eventType === '*') {
      const eventTypes: EventType[] = [
        EventType.GAME_STARTED,
        EventType.GAME_PAUSED,
        EventType.GAME_RESUMED,
        EventType.GAME_STOPPED,
        EventType.TIME_UPDATED,
      ];

      const unsubscribers = eventTypes.map(type =>
        this.subscribe<GameManagerEvent>(type, handler)
      );

      // Return a unified unsubscribe that clears all underlying subscriptions
      return () => {
        unsubscribers.forEach(unsub => unsub());
      };
    }

    // For specific events, delegate to the protected subscribe helper
    return this.subscribe<GameManagerEvent>(eventType.toString(), handler);
  }
}

// Create singleton instance
// We don't need to pass an event bus anymore
export const gameManager = new GameManager();

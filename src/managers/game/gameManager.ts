import { BaseEvent } from '../../lib/events/UnifiedEventSystem';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
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
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private gameTime: number = 0;
  private lastUpdate: number = 0;
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
}

// Create singleton instance
// We don't need to pass an event bus anymore
export const gameManager = new GameManager();

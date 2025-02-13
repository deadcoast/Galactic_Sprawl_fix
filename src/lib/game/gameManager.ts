import { GameEvent } from '../../types/core/GameTypes';

export class GameManager {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private gameTime: number = 0;
  private lastUpdate: number = 0;
  private frameId: number | null = null;
  private subscribers: Set<(gameTime: number) => void> = new Set();
  private eventListeners: Map<string, Set<(event: GameEvent) => void>> = new Map();

  // Start the game loop
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastUpdate = performance.now();
      this.frameId = requestAnimationFrame(this.update.bind(this));
    }
  }

  // Pause the game
  pause() {
    this.isPaused = true;
  }

  // Resume the game
  resume() {
    this.isPaused = false;
    this.lastUpdate = performance.now();
  }

  // Stop the game loop
  stop() {
    this.isRunning = false;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  // Subscribe to game updates
  subscribe(callback: (gameTime: number) => void) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Add event listener
  addEventListener(type: string, callback: (event: GameEvent) => void) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)?.add(callback);
    return () => {
      this.eventListeners.get(type)?.delete(callback);
    };
  }

  // Dispatch game event
  dispatchEvent(event: GameEvent) {
    this.eventListeners.get(event.type)?.forEach(callback => {
      callback(event);
    });
  }

  // Main update loop
  private update(timestamp: number) {
    if (!this.isRunning) return;

    if (!this.isPaused) {
      const deltaTime = timestamp - this.lastUpdate;
      this.gameTime += deltaTime;
      
      // Notify subscribers
      this.subscribers.forEach(callback => {
        callback(this.gameTime);
      });
    }

    this.lastUpdate = timestamp;
    this.frameId = requestAnimationFrame(this.update.bind(this));
  }

  // Get current game time
  getGameTime() {
    return this.gameTime;
  }

  // Check if game is running
  isGameRunning() {
    return this.isRunning;
  }

  // Check if game is paused
  isGamePaused() {
    return this.isPaused;
  }
}

// Create singleton instance
export const gameManager = new GameManager();

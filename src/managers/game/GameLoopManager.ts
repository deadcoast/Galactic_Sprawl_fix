import { ModuleEventType, moduleEventBus } from '../../lib/modules/ModuleEvents';

/**
 * Update priority levels
 */
export enum UpdatePriority {
  CRITICAL = 0, // Run every frame, no matter what (physics, core game state)
  HIGH = 1, // Run most frames, can be skipped occasionally (AI, combat)
  NORMAL = 2, // Run regularly, can be skipped more often (resource updates)
  LOW = 3, // Run occasionally (visual effects, non-critical updates)
  BACKGROUND = 4, // Run when there's spare time (analytics, cleanup)
}

/**
 * Update callback type
 */
export type UpdateCallback = (deltaTime: number, elapsedTime: number) => void;

/**
 * Update registration interface
 */
export interface UpdateRegistration {
  id: string;
  callback: UpdateCallback;
  priority: UpdatePriority;
  interval?: number; // Optional interval in ms (for fixed timestep updates)
  lastUpdate?: number; // Last time this was updated
}

/**
 * Game loop statistics
 */
export interface GameLoopStats {
  fps: number;
  frameTime: number;
  updateTime: number;
  renderTime: number;
  idleTime: number;
  elapsedTime: number;
  frameCount: number;
  skippedFrames: number;
  priorityStats: Record<
    UpdatePriority,
    {
      count: number;
      totalTime: number;
      averageTime: number;
    }
  >;
}

/**
 * Game loop manager configuration
 */
export interface GameLoopConfig {
  targetFPS: number;
  maxDeltaTime: number;
  priorityThrottling: boolean;
  fixedTimestep: boolean;
  throttlePriorities: UpdatePriority[];
  statsInterval: number;
  enableStats: boolean;
}

/**
 * Game loop manager for centralized timing and updates
 */
export class GameLoopManager {
  private updates: Map<string, UpdateRegistration> = new Map();
  private running: boolean = false;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private skippedFrames: number = 0;
  private elapsedTime: number = 0;
  private animationFrameId: number | null = null;
  private statsInterval: number | null = null;
  private stats: GameLoopStats;
  private config: GameLoopConfig;

  constructor(config: Partial<GameLoopConfig> = {}) {
    // Default configuration
    this.config = {
      targetFPS: 60,
      maxDeltaTime: 1000 / 30, // Cap at 30 FPS equivalent
      priorityThrottling: true,
      fixedTimestep: false,
      throttlePriorities: [UpdatePriority.LOW, UpdatePriority.BACKGROUND],
      statsInterval: 1000, // 1 second
      enableStats: true,
      ...config,
    };

    // Initialize stats
    this.stats = {
      fps: 0,
      frameTime: 0,
      updateTime: 0,
      renderTime: 0,
      idleTime: 0,
      elapsedTime: 0,
      frameCount: 0,
      skippedFrames: 0,
      priorityStats: {
        [UpdatePriority.CRITICAL]: { count: 0, totalTime: 0, averageTime: 0 },
        [UpdatePriority.HIGH]: { count: 0, totalTime: 0, averageTime: 0 },
        [UpdatePriority.NORMAL]: { count: 0, totalTime: 0, averageTime: 0 },
        [UpdatePriority.LOW]: { count: 0, totalTime: 0, averageTime: 0 },
        [UpdatePriority.BACKGROUND]: { count: 0, totalTime: 0, averageTime: 0 },
      },
    };
  }

  /**
   * Start the game loop
   */
  public start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.skippedFrames = 0;
    this.elapsedTime = 0;

    // Start the game loop
    this.animationFrameId = requestAnimationFrame(this.gameLoop);

    // Start stats reporting if enabled
    if (this.config.enableStats) {
      this.statsInterval = window.setInterval(() => {
        this.reportStats();
      }, this.config.statsInterval);
    }

    // Emit game loop started event
    moduleEventBus.emit({
      type: 'GAME_LOOP_STARTED' as ModuleEventType,
      moduleId: 'game-loop-manager',
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: { config: this.config },
    });
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    // Stop the animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop stats reporting
    if (this.statsInterval !== null) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    // Emit game loop stopped event
    moduleEventBus.emit({
      type: 'GAME_LOOP_STOPPED' as ModuleEventType,
      moduleId: 'game-loop-manager',
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: { stats: this.stats },
    });
  }

  /**
   * Register an update callback
   */
  public registerUpdate(
    id: string,
    callback: UpdateCallback,
    priority: UpdatePriority = UpdatePriority.NORMAL,
    interval?: number
  ): void {
    this.updates.set(id, {
      id,
      callback,
      priority,
      interval,
      lastUpdate: performance.now(),
    });

    // Emit update registered event
    moduleEventBus.emit({
      type: 'GAME_LOOP_UPDATE_REGISTERED' as ModuleEventType,
      moduleId: 'game-loop-manager',
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: { id, priority, interval },
    });
  }

  /**
   * Unregister an update callback
   */
  public unregisterUpdate(id: string): void {
    if (this.updates.has(id)) {
      this.updates.delete(id);

      // Emit update unregistered event
      moduleEventBus.emit({
        type: 'GAME_LOOP_UPDATE_UNREGISTERED' as ModuleEventType,
        moduleId: 'game-loop-manager',
        moduleType: 'resource-manager',
        timestamp: Date.now(),
        data: { id },
      });
    }
  }

  /**
   * Get the current game loop stats
   */
  public getStats(): GameLoopStats {
    return { ...this.stats };
  }

  /**
   * Update the game loop configuration
   */
  public updateConfig(config: Partial<GameLoopConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Emit config updated event
    moduleEventBus.emit({
      type: 'GAME_LOOP_CONFIG_UPDATED' as ModuleEventType,
      moduleId: 'game-loop-manager',
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: { config: this.config },
    });
  }

  /**
   * The main game loop
   */
  private gameLoop = (timestamp: number): void => {
    if (!this.running) {
      return;
    }

    // Schedule the next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop);

    // Calculate delta time
    const now = timestamp;
    let deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Cap delta time to prevent spiral of death
    if (deltaTime > this.config.maxDeltaTime) {
      deltaTime = this.config.maxDeltaTime;
      this.skippedFrames++;
    }

    // Update elapsed time
    this.elapsedTime += deltaTime;
    this.frameCount++;

    // Update frame time stats
    this.stats.frameTime = deltaTime;

    // Start update timing
    const updateStartTime = performance.now();

    // Process updates by priority
    this.processUpdates(deltaTime, this.elapsedTime);

    // End update timing
    const updateEndTime = performance.now();
    this.stats.updateTime = updateEndTime - updateStartTime;

    // Calculate idle time (time left in the frame)
    const targetFrameTime = 1000 / this.config.targetFPS;
    const currentFrameTime = performance.now() - now;
    this.stats.idleTime = Math.max(0, targetFrameTime - currentFrameTime);

    // Update FPS stats
    this.stats.fps = 1000 / deltaTime;
    this.stats.elapsedTime = this.elapsedTime;
    this.stats.frameCount = this.frameCount;
    this.stats.skippedFrames = this.skippedFrames;
  };

  /**
   * Process all registered updates
   */
  private processUpdates(deltaTime: number, elapsedTime: number): void {
    // Group updates by priority
    const priorityGroups: Map<UpdatePriority, UpdateRegistration[]> = new Map();

    for (const update of this.updates.values()) {
      if (!priorityGroups.has(update.priority)) {
        priorityGroups.set(update.priority, []);
      }
      priorityGroups.get(update.priority)!.push(update);
    }

    // Process each priority group
    for (
      let priority = UpdatePriority.CRITICAL;
      priority <= UpdatePriority.BACKGROUND;
      priority++
    ) {
      const updates = priorityGroups.get(priority) || [];

      // Skip throttled priorities if enabled
      if (
        this.config.priorityThrottling &&
        this.config.throttlePriorities.includes(priority) &&
        this.frameCount % (priority + 1) !== 0
      ) {
        continue;
      }

      // Process all updates in this priority group
      for (const update of updates) {
        // Skip if interval is set and not enough time has passed
        if (update.interval && update.lastUpdate) {
          const timeSinceLastUpdate = elapsedTime - update.lastUpdate;
          if (timeSinceLastUpdate < update.interval) {
            continue;
          }
        }

        // Update the last update time
        update.lastUpdate = elapsedTime;

        // Measure update time
        const startTime = performance.now();

        try {
          // Call the update callback
          update.callback(deltaTime, elapsedTime);
        } catch (error) {
          console.error(`Error in update ${update.id}:`, error);

          // Emit error event
          moduleEventBus.emit({
            type: 'ERROR_OCCURRED' as ModuleEventType,
            moduleId: 'game-loop-manager',
            moduleType: 'resource-manager',
            timestamp: Date.now(),
            data: {
              error,
              updateId: update.id,
              priority: update.priority,
            },
          });
        }

        // Update stats
        const endTime = performance.now();
        const updateTime = endTime - startTime;

        this.stats.priorityStats[priority].count++;
        this.stats.priorityStats[priority].totalTime += updateTime;
        this.stats.priorityStats[priority].averageTime =
          this.stats.priorityStats[priority].totalTime / this.stats.priorityStats[priority].count;
      }
    }
  }

  /**
   * Report game loop stats
   */
  private reportStats(): void {
    // Calculate average FPS
    const avgFps = this.frameCount / (this.config.statsInterval / 1000);

    // Reset frame count for next interval
    this.frameCount = 0;

    // Emit stats event
    moduleEventBus.emit({
      type: 'GAME_LOOP_STATS' as ModuleEventType,
      moduleId: 'game-loop-manager',
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: {
        ...this.stats,
        avgFps,
      },
    });

    // Log stats if in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[GameLoop] Stats:', {
        fps: avgFps.toFixed(2),
        updateTime: this.stats.updateTime.toFixed(2) + 'ms',
        idleTime: this.stats.idleTime.toFixed(2) + 'ms',
        skippedFrames: this.stats.skippedFrames,
      });
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stop();
    this.updates.clear();
  }
}

// Export singleton instance
export const gameLoopManager = new GameLoopManager();

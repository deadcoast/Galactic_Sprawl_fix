import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameLoopManager, UpdatePriority } from '../../../managers/game/GameLoopManager';
import { moduleEventBus } from '../../../lib/modules/ModuleEvents';

// Mock the moduleEventBus
vi.mock('../../../lib/modules/ModuleEvents', () => {
  return {
    moduleEventBus: {
      emit: vi.fn()
    },
    ModuleEventType: {
      GAME_LOOP_STARTED: 'GAME_LOOP_STARTED',
      GAME_LOOP_STOPPED: 'GAME_LOOP_STOPPED',
      GAME_LOOP_UPDATE_REGISTERED: 'GAME_LOOP_UPDATE_REGISTERED',
      GAME_LOOP_UPDATE_UNREGISTERED: 'GAME_LOOP_UPDATE_UNREGISTERED',
      GAME_LOOP_CONFIG_UPDATED: 'GAME_LOOP_CONFIG_UPDATED',
      GAME_LOOP_STATS: 'GAME_LOOP_STATS',
      ERROR_OCCURRED: 'ERROR_OCCURRED'
    }
  };
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 0) as unknown as number;
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// Mock performance.now
const originalPerformanceNow = performance.now;
let mockTime = 0;

describe('GameLoopManager', () => {
  let gameLoopManager: GameLoopManager;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock time
    mockTime = 0;
    performance.now = vi.fn(() => mockTime);
    
    // Create a new instance for each test
    gameLoopManager = new GameLoopManager({
      enableStats: false, // Disable stats to simplify testing
      targetFPS: 60
    });
  });
  
  afterEach(() => {
    // Clean up
    gameLoopManager.cleanup();
    
    // Restore original performance.now
    performance.now = originalPerformanceNow;
    
    // Clear all timers
    vi.clearAllTimers();
  });
  
  describe('initialization', () => {
    it('should initialize with default config', () => {
      const manager = new GameLoopManager();
      const stats = manager.getStats();
      
      // Check that stats are initialized
      expect(stats.fps).toBe(0);
      expect(stats.frameTime).toBe(0);
      expect(stats.updateTime).toBe(0);
      expect(stats.elapsedTime).toBe(0);
      expect(stats.frameCount).toBe(0);
      expect(stats.skippedFrames).toBe(0);
      
      // Check that priority stats are initialized
      expect(stats.priorityStats[UpdatePriority.CRITICAL].count).toBe(0);
      expect(stats.priorityStats[UpdatePriority.HIGH].count).toBe(0);
      expect(stats.priorityStats[UpdatePriority.NORMAL].count).toBe(0);
      expect(stats.priorityStats[UpdatePriority.LOW].count).toBe(0);
      expect(stats.priorityStats[UpdatePriority.BACKGROUND].count).toBe(0);
    });
    
    it('should initialize with custom config', () => {
      const customConfig = {
        targetFPS: 30,
        maxDeltaTime: 100,
        priorityThrottling: false,
        fixedTimestep: true,
        throttlePriorities: [UpdatePriority.NORMAL, UpdatePriority.LOW],
        statsInterval: 2000,
        enableStats: false
      };
      
      const manager = new GameLoopManager(customConfig);
      
      // Update config and check that it emits an event
      manager.updateConfig({ targetFPS: 45 });
      
      expect(moduleEventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'GAME_LOOP_CONFIG_UPDATED',
        data: expect.objectContaining({
          config: expect.objectContaining({
            targetFPS: 45
          })
        })
      }));
    });
  });
  
  describe('start and stop', () => {
    it('should start the game loop', () => {
      gameLoopManager.start();
      
      // Check that it emits a start event
      expect(moduleEventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'GAME_LOOP_STARTED',
        moduleId: 'game-loop-manager'
      }));
      
      // Check that requestAnimationFrame was called
      expect(requestAnimationFrame).toHaveBeenCalled();
    });
    
    it('should not start the game loop if already running', () => {
      gameLoopManager.start();
      
      // Clear mocks
      vi.clearAllMocks();
      
      // Try to start again
      gameLoopManager.start();
      
      // Check that it doesn't emit another start event
      expect(moduleEventBus.emit).not.toHaveBeenCalled();
    });
    
    it('should stop the game loop', () => {
      gameLoopManager.start();
      
      // Clear mocks
      vi.clearAllMocks();
      
      gameLoopManager.stop();
      
      // Check that it emits a stop event
      expect(moduleEventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'GAME_LOOP_STOPPED',
        moduleId: 'game-loop-manager'
      }));
      
      // Check that cancelAnimationFrame was called
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });
    
    it('should not stop the game loop if not running', () => {
      // Try to stop without starting
      gameLoopManager.stop();
      
      // Check that it doesn't emit a stop event
      expect(moduleEventBus.emit).not.toHaveBeenCalled();
      
      // Check that cancelAnimationFrame was not called
      expect(cancelAnimationFrame).not.toHaveBeenCalled();
    });
  });
  
  describe('update registration', () => {
    it('should register an update callback', () => {
      const callback = vi.fn();
      
      gameLoopManager.registerUpdate('test-update', callback, UpdatePriority.NORMAL);
      
      // Check that it emits a registration event
      expect(moduleEventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'GAME_LOOP_UPDATE_REGISTERED',
        data: expect.objectContaining({
          id: 'test-update',
          priority: UpdatePriority.NORMAL
        })
      }));
    });
    
    it('should unregister an update callback', () => {
      const callback = vi.fn();
      
      gameLoopManager.registerUpdate('test-update', callback);
      
      // Clear mocks
      vi.clearAllMocks();
      
      gameLoopManager.unregisterUpdate('test-update');
      
      // Check that it emits an unregistration event
      expect(moduleEventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'GAME_LOOP_UPDATE_UNREGISTERED',
        data: expect.objectContaining({
          id: 'test-update'
        })
      }));
    });
    
    it('should not emit an event when unregistering a non-existent update', () => {
      gameLoopManager.unregisterUpdate('non-existent-update');
      
      // Check that it doesn't emit an event
      expect(moduleEventBus.emit).not.toHaveBeenCalled();
    });
  });
  
  describe('game loop execution', () => {
    it('should call update callbacks with delta time and elapsed time', async () => {
      const callback = vi.fn();
      
      gameLoopManager.registerUpdate('test-update', callback, UpdatePriority.CRITICAL);
      
      // Start the game loop
      gameLoopManager.start();
      
      // Advance time
      mockTime = 16; // 16ms = ~60fps
      
      // Wait for the next frame
      await vi.advanceTimersByTimeAsync(0);
      
      // Check that the callback was called with the correct parameters
      expect(callback).toHaveBeenCalledWith(16, 16);
      
      // Advance time again
      mockTime = 32; // +16ms
      
      // Wait for the next frame
      await vi.advanceTimersByTimeAsync(0);
      
      // Check that the callback was called again with updated parameters
      expect(callback).toHaveBeenCalledWith(16, 32);
    });
    
    it('should handle errors in update callbacks', async () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      gameLoopManager.registerUpdate('error-update', errorCallback, UpdatePriority.CRITICAL);
      
      // Start the game loop
      gameLoopManager.start();
      
      // Advance time
      mockTime = 16;
      
      // Wait for the next frame
      await vi.advanceTimersByTimeAsync(0);
      
      // Check that it emits an error event
      expect(moduleEventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'ERROR_OCCURRED',
        data: expect.objectContaining({
          updateId: 'error-update',
          error: expect.any(Error)
        })
      }));
    });
    
    it('should respect update intervals', async () => {
      const callback = vi.fn();
      
      // Register an update with a 100ms interval
      gameLoopManager.registerUpdate('interval-update', callback, UpdatePriority.NORMAL, 100);
      
      // Start the game loop
      gameLoopManager.start();
      
      // Advance time by 50ms (not enough for the interval)
      mockTime = 50;
      await vi.advanceTimersByTimeAsync(0);
      
      // Check that the callback was not called
      expect(callback).not.toHaveBeenCalled();
      
      // Advance time by another 60ms (total 110ms, enough for the interval)
      mockTime = 110;
      await vi.advanceTimersByTimeAsync(0);
      
      // Check that the callback was called
      expect(callback).toHaveBeenCalledTimes(1);
    });
    
    it('should cap delta time to prevent spiral of death', async () => {
      const callback = vi.fn();
      
      gameLoopManager.registerUpdate('test-update', callback, UpdatePriority.CRITICAL);
      
      // Start the game loop
      gameLoopManager.start();
      
      // Advance time by a large amount (more than maxDeltaTime)
      mockTime = 1000;
      
      // Wait for the next frame
      await vi.advanceTimersByTimeAsync(0);
      
      // Check that delta time was capped (default maxDeltaTime is 1000/30 = ~33.33ms)
      expect(callback).toHaveBeenCalledWith(1000/30, 1000/30);
      
      // Check that skipped frames was incremented
      const stats = gameLoopManager.getStats();
      expect(stats.skippedFrames).toBe(1);
    });
  });
  
  describe('priority-based updates', () => {
    it('should process updates in priority order', async () => {
      const executionOrder: string[] = [];
      
      // Register updates with different priorities
      gameLoopManager.registerUpdate('critical', () => {
        executionOrder.push('critical');
      }, UpdatePriority.CRITICAL);
      
      gameLoopManager.registerUpdate('high', () => {
        executionOrder.push('high');
      }, UpdatePriority.HIGH);
      
      gameLoopManager.registerUpdate('normal', () => {
        executionOrder.push('normal');
      }, UpdatePriority.NORMAL);
      
      gameLoopManager.registerUpdate('low', () => {
        executionOrder.push('low');
      }, UpdatePriority.LOW);
      
      gameLoopManager.registerUpdate('background', () => {
        executionOrder.push('background');
      }, UpdatePriority.BACKGROUND);
      
      // Start the game loop
      gameLoopManager.start();
      
      // Advance time
      mockTime = 16;
      
      // Wait for the next frame
      await vi.advanceTimersByTimeAsync(0);
      
      // Check that updates were processed in priority order
      expect(executionOrder).toEqual(['critical', 'high', 'normal', 'low', 'background']);
    });
    
    it('should throttle low priority updates based on configuration', async () => {
      // Create a manager with priority throttling enabled
      const manager = new GameLoopManager({
        enableStats: false,
        priorityThrottling: true,
        throttlePriorities: [UpdatePriority.LOW, UpdatePriority.BACKGROUND]
      });
      
      const criticalCallback = vi.fn();
      const lowCallback = vi.fn();
      const backgroundCallback = vi.fn();
      
      // Register updates with different priorities
      manager.registerUpdate('critical', criticalCallback, UpdatePriority.CRITICAL);
      manager.registerUpdate('low', lowCallback, UpdatePriority.LOW);
      manager.registerUpdate('background', backgroundCallback, UpdatePriority.BACKGROUND);
      
      // Start the game loop
      manager.start();
      
      // Advance time for first frame (frameCount = 1)
      mockTime = 16;
      await vi.advanceTimersByTimeAsync(0);
      
      // Critical should be called every frame
      expect(criticalCallback).toHaveBeenCalledTimes(1);
      
      // LOW priority (3) should be called every 4th frame (frameCount % (priority + 1) === 0)
      // So it shouldn't be called on frame 1
      expect(lowCallback).toHaveBeenCalledTimes(0);
      
      // BACKGROUND priority (4) should be called every 5th frame
      // So it shouldn't be called on frame 1
      expect(backgroundCallback).toHaveBeenCalledTimes(0);
      
      // Reset mocks
      vi.clearAllMocks();
      
      // Advance time for fourth frame (frameCount = 4)
      mockTime = 64; // 16 * 4
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(0);
      
      // Critical should be called every frame
      expect(criticalCallback).toHaveBeenCalledTimes(3);
      
      // LOW priority should be called on frame 4
      expect(lowCallback).toHaveBeenCalledTimes(1);
      
      // BACKGROUND priority should not be called on frame 4
      expect(backgroundCallback).toHaveBeenCalledTimes(0);
      
      // Clean up
      manager.cleanup();
    });
  });
  
  describe('stats reporting', () => {
    it('should update stats during game loop execution', async () => {
      // Create a manager with stats enabled
      const manager = new GameLoopManager({
        enableStats: true,
        statsInterval: 100
      });
      
      // Start the game loop
      manager.start();
      
      // Advance time
      mockTime = 16;
      await vi.advanceTimersByTimeAsync(0);
      
      // Get stats
      const stats = manager.getStats();
      
      // Check that stats were updated
      expect(stats.fps).toBeGreaterThan(0);
      expect(stats.frameTime).toBe(16);
      expect(stats.frameCount).toBe(1);
      
      // Advance time to trigger stats reporting
      mockTime = 116;
      await vi.advanceTimersByTimeAsync(100);
      
      // Check that it emits a stats event
      expect(moduleEventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'GAME_LOOP_STATS',
        data: expect.objectContaining({
          avgFps: expect.any(Number)
        })
      }));
      
      // Clean up
      manager.cleanup();
    });
  });
}); 
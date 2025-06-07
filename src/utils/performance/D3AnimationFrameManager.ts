/**
 * D3 Animation Frame Manager
 *
 * This module provides a centralized system for efficiently coordinating multiple
 * animations. It optimizes performance by:
 *
 * 1. Batching animations in a single requestAnimationFrame loop
 * 2. Prioritizing animations based on visibility and importance
 * 3. Distributing animation work across frames for complex animations
 * 4. Providing synchronization mechanisms between related animations
 * 5. Managing frame budgets to ensure smooth performance
 */

import * as d3 from 'd3';
import {
  AnimationConfig,
  TypedAnimationSequence,
} from '../../types/visualizations/D3AnimationTypes';
import { AnimationPerformanceReport, createAnimationProfiler } from './D3AnimationProfiler';

/**
 * Priority level for animations
 */
export type AnimationPriority = 'critical' | 'high' | 'medium' | 'low' | 'background';

/**
 * Status of a registered animation
 */
export type AnimationStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

/**
 * Visibility state of an animation to determine if it should be updated
 */
export type AnimationVisibility = 'visible' | 'partially-visible' | 'hidden';

/**
 * Animation type to help optimize similar animations
 */
export type AnimationType = 'transition' | 'simulation' | 'timer' | 'sequence' | 'custom';

/**
 * Configuration for registered animations
 */
export interface RegisteredAnimationConfig extends AnimationConfig {
  /** Unique ID for the animation */
  id: string;
  /** User-friendly name for the animation */
  name: string;
  /** Priority level determines scheduling order */
  priority: AnimationPriority;
  /** Animation type for optimization opportunities */
  type: AnimationType;
  /** Whether the animation should continue even when off-screen */
  runWhenHidden?: boolean;
  /** Maximum amount of time per frame for this animation (ms) */
  frameTimeBudget?: number;
  /** Whether to enable profiling for this animation */
  enableProfiling?: boolean;
  /** Callback for animation completion */
  onComplete?: () => void;
  /** Synchronization group ID to coordinate related animations */
  syncGroup?: string;
}

/**
 * The animation frame callback function signature
 */
export type AnimationFrameCallback = (
  elapsed: number,
  deltaTime: number,
  frameInfo: FrameInfo
) => boolean | void;

/**
 * Information about the current animation frame
 */
export interface FrameInfo {
  /** Frame timestamp */
  timestamp: number;
  /** Time elapsed since animation start */
  elapsed: number;
  /** Time since last frame */
  deltaTime: number;
  /** Current frame number */
  frameCount: number;
  /** Duration left in the frame budget (ms) */
  remainingFrameBudget: number;
  /** Whether the animation should try to finish critical work this frame */
  isFrameOverBudget: boolean;
  /** Current FPS based on recent frames */
  currentFps: number;
}

/**
 * Registered animation object
 */
export interface RegisteredAnimation {
  /** Animation configuration */
  config: RegisteredAnimationConfig;
  /** Frame callback function */
  callback: AnimationFrameCallback;
  /** Current animation status */
  status: AnimationStatus;
  /** Current visibility state */
  visibility: AnimationVisibility;
  /** Start time of the animation */
  startTime: number;
  /** Last frame timestamp */
  lastFrameTime: number;
  /** Elapsed time since start */
  elapsedTime: number;
  /** Elapsed time when paused (to resume from) */
  pausedElapsedTime?: number;
  /** Pause start timestamp */
  pauseStartTime?: number;
  /** Current frame number */
  frameCount: number;
  /** Animation-specific data storage */
  data?: Record<string, unknown>;
  /** Performance profiling data if enabled */
  profilingData?: {
    /** Animation profiler if enabled */
    profiler: ReturnType<typeof createAnimationProfiler>;
    /** Animation performance report if available */
    report?: AnimationPerformanceReport;
  };
}

/**
 * Configuration for the animation frame manager
 */
export interface AnimationFrameManagerConfig {
  /** Target frames per second */
  targetFps?: number;
  /** Frame budget in milliseconds (defaults to 16ms for 60fps) */
  frameBudget?: number;
  /** Whether to enable auto-pausing of hidden animations */
  autoPauseHidden?: boolean;
  /** Maximum animations to process per frame */
  maxAnimationsPerFrame?: number;
  /** Whether to enable performance profiling */
  enableProfiling?: boolean;
  /** Whether to automatically cancel long-running animations */
  autoCancelLongRunning?: boolean;
  /** Time threshold for long-running animations in ms */
  longRunningThreshold?: number;
  /** Whether to log diagnostic information to console */
  debugMode?: boolean;
}

/**
 * Creates a centralized animation frame manager for coordinating multiple animations
 *
 * @param config Configuration options for the manager
 * @returns Animation frame manager API
 */
export function createAnimationFrameManager(config: AnimationFrameManagerConfig = {}) {
  // Configuration with defaults
  const {
    targetFps = 60,
    frameBudget = (1000 / targetFps) * 0.8, // 80% of frame time
    autoPauseHidden = true,
    maxAnimationsPerFrame = 0, // 0 means no limit
    enableProfiling = false,
    autoCancelLongRunning = false,
    longRunningThreshold = 30000, // 30 seconds
    debugMode = false,
  } = config;

  // Internal state
  const animations = new Map<string, RegisteredAnimation>();
  const syncGroups = new Map<string, Set<string>>();
  let isRunning = false;
  let lastFrameTimestamp = 0;
  let rafId: number | null = null;
  let frameCount = 0;
  let frameTimes: number[] = [];

  // FPS tracking (last 60 frames)
  const fpsBufferSize = 60;
  const fpsBuffer: number[] = new Array<number>(fpsBufferSize).fill(0);
  let fpsBufferIndex = 0;
  let currentFps = targetFps;

  /**
   * Update FPS calculation with the latest frame time
   *
   * @param deltaTime Time since last frame in ms
   */
  function updateFps(deltaTime: number) {
    // Add latest frame time to buffer
    fpsBuffer[fpsBufferIndex] = deltaTime > 0 ? 1000 / deltaTime : 0;
    fpsBufferIndex = (fpsBufferIndex + 1) % fpsBufferSize;

    // Calculate average FPS from buffer, ignoring zeros
    const validFrames = fpsBuffer.filter(fps => fps > 0);
    currentFps =
      validFrames.length > 0
        ? validFrames.reduce((sum, fps) => sum + fps, 0) / validFrames.length
        : targetFps;
  }

  /**
   * Main animation frame loop
   *
   * @param timestamp Current frame timestamp
   */
  const animationFrame = (timestamp: number) => {
    // Calculate timing information
    const deltaTime = lastFrameTimestamp ? timestamp - lastFrameTimestamp : 0;
    lastFrameTimestamp = timestamp;

    // Update FPS tracking
    updateFps(deltaTime);
    frameCount++;

    // Update frame timing history (keep last 10 frames)
    frameTimes.push(deltaTime);
    if (frameTimes.length > 10) {
      frameTimes.shift();
    }

    // Process animations in priority order
    const frameStartTime = performance.now();
    let frameTimeBudgetRemaining = frameBudget;
    let animationsProcessed = 0;

    // Sort animations by priority
    const sortedAnimations = Array.from(animations.values())
      .filter(anim => anim.status === 'running')
      .sort((a, b) => {
        // Order by priority first
        const priorityOrder = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
          background: 4,
        };

        const priorityDiff = priorityOrder[a.config.priority] - priorityOrder[b.config.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by visibility
        const visibilityOrder = {
          visible: 0,
          'partially-visible': 1,
          hidden: 2,
        };

        return visibilityOrder[a.visibility] - visibilityOrder[b.visibility];
      });

    // Process each animation
    for (const animation of sortedAnimations) {
      // Skip if we've reached the per-frame animation limit
      if (maxAnimationsPerFrame > 0 && animationsProcessed >= maxAnimationsPerFrame) {
        if (debugMode) {
          // console.warn(
          //   `Animation frame manager: Reached max animations per frame (${maxAnimationsPerFrame})`
          // );
        }
        break;
      }

      // Skip hidden animations if configured to do so
      if (autoPauseHidden && animation.visibility === 'hidden' && !animation.config.runWhenHidden) {
        continue;
      }

      // Check if we have time remaining in the frame budget
      const now = performance.now();
      const timeElapsed = now - frameStartTime;
      frameTimeBudgetRemaining = Math.max(0, frameBudget - timeElapsed);

      // Skip if we're out of time
      if (frameTimeBudgetRemaining <= 0) {
        if (debugMode) {
          // console.warn(
          //   `Animation frame manager: Frame budget exhausted, skipping remaining animations`
          // );
        }
        break;
      }

      // Prepare frame info
      const _deltaTime = timestamp - animation.lastFrameTime;
      const _frameInfo = {
        timestamp,
        elapsed: animation.elapsedTime,
        deltaTime: _deltaTime,
        frameCount: animation.frameCount,
        remainingFrameBudget: frameTimeBudgetRemaining,
        isFrameOverBudget:
          frameTimeBudgetRemaining < (animation.config.frameTimeBudget ?? frameBudget * 0.2),
        currentFps,
      };

      // Update animation timing info
      animation.lastFrameTime = timestamp;
      animation.elapsedTime = timestamp - animation.startTime;
      animation.frameCount++;

      // Record frame for profiling if enabled
      if (animation.config.enableProfiling && animation.profilingData?.profiler) {
        animation.profilingData.profiler.recordFrame();
      }

      try {
        // Execute animation callback
        const result = animation.callback(animation.elapsedTime, _deltaTime, _frameInfo);

        // Handle result (return true to stop the animation)
        if (result === true) {
          completeAnimation(animation.config.id);
        }

        // Auto-cancel long-running animations if enabled
        if (
          autoCancelLongRunning &&
          animation.elapsedTime > longRunningThreshold &&
          !animation.config.loop
        ) {
          if (debugMode) {
            // console.warn(
            //   `Animation frame manager: Auto-cancelling long-running animation ${animation.config.id}`
            // );
          }
          completeAnimation(animation.config.id);
        }
      } catch {
        // console.error(`Error in animation ${animation.config.id}:`);
        animation.status = 'error';
      }

      animationsProcessed++;
    }

    // Continue the animation loop if we have active animations
    if (animations.size > 0 && hasRunningAnimations()) {
      rafId = requestAnimationFrame(animationFrame);
    } else {
      stopAnimationLoop();
    }
  };

  /**
   * Check if there are unknown running animations
   */
  function hasRunningAnimations(): boolean {
    return Array.from(animations.values()).some(anim => anim.status === 'running');
  }

  /**
   * Start the animation frame loop
   */
  function startAnimationLoop() {
    if (isRunning) return;

    isRunning = true;
    lastFrameTimestamp = 0;
    frameCount = 0;
    frameTimes = [];

    if (debugMode) {
      // console.warn('Animation frame manager: Starting animation loop');
    }

    rafId = requestAnimationFrame(animationFrame);
  }

  /**
   * Stop the animation frame loop
   */
  function stopAnimationLoop() {
    if (!isRunning) return;

    isRunning = false;

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    if (debugMode) {
      // console.warn('Animation frame manager: Stopping animation loop');
    }
  }

  /**
   * Register a new animation with the frame manager
   *
   * @param config Animation configuration
   * @param callback Animation frame callback function
   * @returns Animation ID
   */
  function registerAnimation(
    config: Omit<RegisteredAnimationConfig, 'id'> & { id?: string },
    callback: AnimationFrameCallback
  ): string {
    // Generate ID if not provided
    const id = config.id ?? `animation-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Create full configuration with defaults
    const fullConfig: RegisteredAnimationConfig = {
      id,
      name: config.name ?? `Animation ${id}`,
      priority: config.priority ?? 'medium',
      type: config.type ?? 'custom',
      duration: config.duration ?? 1000,
      easing: config.easing,
      loop: config.loop ?? false,
      runWhenHidden: config.runWhenHidden ?? false,
      frameTimeBudget: config.frameTimeBudget ?? frameBudget * 0.5,
      enableProfiling: config.enableProfiling ?? enableProfiling,
      onComplete: config.onComplete,
      syncGroup: config.syncGroup,
    };

    // Create animation entry
    const animation: RegisteredAnimation = {
      config: fullConfig,
      callback,
      status: 'idle',
      visibility: 'visible',
      startTime: 0,
      lastFrameTime: 0,
      elapsedTime: 0,
      frameCount: 0,
    };

    // Set up profiling if enabled
    if (fullConfig.enableProfiling) {
      animation.profilingData = {
        profiler: createAnimationProfiler({
          targetFps,
          detailedMetrics: true,
        }),
      };
    }

    // Add to sync group if specified
    if (fullConfig.syncGroup) {
      let group = syncGroups.get(fullConfig.syncGroup);
      if (!group) {
        group = new Set<string>();
        syncGroups.set(fullConfig.syncGroup, group);
      }
      group.add(id);
    }

    // Store the animation
    animations.set(id, animation);

    if (debugMode) {
      // console.warn(`Animation frame manager: Registered animation ${id} (${fullConfig.name})`);
    }

    return id;
  }

  /**
   * Start a registered animation
   *
   * @param id Animation ID
   * @param resetTime Whether to reset the animation time
   */
  function startAnimation(id: string, resetTime = true): void {
    const animation = animations.get(id);
    if (!animation) {
      if (debugMode) {
        // console.warn(`Animation frame manager: Cannot start animation ${id} - not found`);
      }
      return;
    }

    // Reset or resume timing
    const now = performance.now();
    if (resetTime) {
      animation.startTime = now;
      animation.lastFrameTime = now;
      animation.frameCount = 0;
    } else if (animation.status === 'paused' && animation.pausedElapsedTime !== undefined) {
      // Resume from pause - adjust start time to maintain elapsed time
      animation.startTime = now - animation.pausedElapsedTime;
      animation.lastFrameTime = now;
    }

    animation.status = 'running';

    // Reset pause tracking
    animation.pausedElapsedTime = undefined;
    animation.pauseStartTime = undefined;

    // Start profiling if enabled
    if (animation.config.enableProfiling && animation.profilingData?.profiler) {
      animation.profilingData.profiler.start(
        animation.config.id,
        animation.config.name,
        animation.config
      );
    }

    if (debugMode) {
      // console.warn(`Animation frame manager: Started animation ${id} (${animation.config.name})`);
    }

    // Start the animation loop if needed
    if (!isRunning) {
      startAnimationLoop();
    }
  }

  /**
   * Pause a running animation
   *
   * @param id Animation ID
   */
  function pauseAnimation(id: string): void {
    const animation = animations.get(id);
    if (!animation || animation.status !== 'running') {
      return;
    }

    animation.status = 'paused';
    animation.pausedElapsedTime = animation.elapsedTime;
    animation.pauseStartTime = performance.now();

    if (debugMode) {
      // console.warn(`Animation frame manager: Paused animation ${id} (${animation.config.name})`);
    }
  }

  /**
   * Resume a paused animation
   *
   * @param id Animation ID
   */
  function resumeAnimation(id: string): void {
    const animation = animations.get(id);
    if (!animation || animation.status !== 'paused') {
      return;
    }

    startAnimation(id, false);

    if (debugMode) {
      // console.warn(`Animation frame manager: Resumed animation ${id} (${animation.config.name})`);
    }
  }

  /**
   * Stop and complete an animation
   *
   * @param id Animation ID
   */
  function completeAnimation(id: string): void {
    const animation = animations.get(id);
    if (!animation) {
      return;
    }

    animation.status = 'completed';

    // Generate final profiling report if enabled
    if (animation.config.enableProfiling && animation.profilingData?.profiler) {
      animation.profilingData.report = animation.profilingData.profiler.stop();
    }

    // Call completion handler if provided
    if (animation?.config?.onComplete) {
      try {
        animation.config.onComplete();
      } catch {
        // console.error(`Error in animation completion handler for ${id}:`);
      }
    }

    if (debugMode) {
      // console.warn(`Animation frame manager: Completed animation ${id} (${animation.config.name})`);
    }
  }

  /**
   * Cancel an animation without completing it
   *
   * @param id Animation ID
   */
  function cancelAnimation(id: string): void {
    const animation = animations.get(id);
    if (!animation) {
      return;
    }

    // Stop profiling if active
    if (
      animation.config.enableProfiling &&
      animation.profilingData?.profiler?.getStatus()?.isRunning &&
      animation.profilingData
    ) {
      animation.profilingData.report = animation.profilingData.profiler?.stop();
    }

    animations.delete(id);

    // Remove from sync group if needed
    if (animation.config.syncGroup) {
      const group = syncGroups.get(animation.config.syncGroup);
      if (group) {
        group.delete(id);
        if (group.size === 0) {
          syncGroups.delete(animation.config.syncGroup);
        }
      }
    }

    if (debugMode) {
      // console.warn(`Animation frame manager: Cancelled animation ${id} (${animation.config.name})`);
    }
  }

  /**
   * Update the visibility state of an animation
   *
   * @param id Animation ID
   * @param visibility New visibility state
   */
  function updateVisibility(id: string, visibility: AnimationVisibility): void {
    const animation = animations.get(id);
    if (!animation) {
      return;
    }

    const oldVisibility = animation.visibility;
    animation.visibility = visibility;

    // Auto-pause/resume based on visibility if enabled
    if (autoPauseHidden && !animation.config.runWhenHidden) {
      if (visibility === 'hidden' && animation.status === 'running') {
        pauseAnimation(id);
      } else if (
        visibility !== 'hidden' &&
        oldVisibility === 'hidden' &&
        animation.status === 'paused'
      ) {
        resumeAnimation(id);
      }
    }

    if (debugMode) {
      // console.warn(`Animation frame manager: Updated visibility for ${id} to ${visibility}`);
    }
  }

  /**
   * Update the priority of an animation
   *
   * @param id Animation ID
   * @param priority New priority level
   */
  function updatePriority(id: string, priority: AnimationPriority): void {
    const animation = animations.get(id);
    if (!animation) {
      return;
    }

    animation.config.priority = priority;

    if (debugMode) {
      // console.warn(`Animation frame manager: Updated priority for ${id} to ${priority}`);
    }
  }

  /**
   * Synchronize multiple animations in the same group
   *
   * @param groupId Synchronization group ID
   * @param action Action to perform on all animations in the group
   */
  function syncAnimations(
    groupId: string,
    action: 'start' | 'pause' | 'resume' | 'complete' | 'cancel'
  ): void {
    const group = syncGroups.get(groupId);
    if (!group || group.size === 0) {
      return;
    }

    for (const animationId of group) {
      switch (action) {
        case 'start':
          startAnimation(animationId);
          break;
        case 'pause':
          pauseAnimation(animationId);
          break;
        case 'resume':
          resumeAnimation(animationId);
          break;
        case 'complete':
          completeAnimation(animationId);
          break;
        case 'cancel':
          cancelAnimation(animationId);
          break;
      }
    }

    if (debugMode) {
      // console.warn(`Animation frame manager: Synchronized group ${groupId} with action ${action}`);
    }
  }

  /**
   * Get performance metrics for an animation
   *
   * @param id Animation ID
   * @returns Performance report if available
   */
  function getPerformanceReport(id: string): AnimationPerformanceReport | undefined {
    const animation = animations.get(id);
    if (!animation?.profilingData) {
      return undefined;
    }

    // If animation is still running, get current report
    if (
      animation.status === 'running' &&
      animation.profilingData.profiler?.getStatus()?.isRunning
    ) {
      return animation.profilingData.profiler.stop();
    }

    return animation.profilingData.report;
  }

  /**
   * Get the current status of the animation frame manager
   */
  function getStatus() {
    return {
      isRunning,
      animationCount: animations.size,
      runningAnimations: Array.from(animations.values()).filter(a => a.status === 'running').length,
      frameCount,
      currentFps,
      syncGroups: syncGroups.size,
      averageFrameTime:
        frameTimes.length > 0
          ? frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length
          : 0,
    };
  }

  /**
   * Get all registered animations
   */
  function getAnimations() {
    return Array.from(animations.entries()).map(([id, anim]) => ({
      id,
      name: anim.config.name,
      status: anim.status,
      priority: anim.config.priority,
      visibility: anim.visibility,
      type: anim.config.type,
      frameCount: anim.frameCount,
    }));
  }

  /**
   * Check whether an animation is visible in the viewport
   *
   * @param element Element to check visibility for
   * @returns Visibility state based on element position
   */
  function checkElementVisibility(element: Element): AnimationVisibility {
    if (!element) {
      return 'hidden';
    }

    // Use IntersectionObserver API if available
    if ('IntersectionObserver' in window) {
      // This is a simplified version - in practice, you would set up and maintain
      // observers for elements. For now, we'll use getBoundingClientRect as a fallback.
    }

    // Fallback to getBoundingClientRect
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    // Check if completely visible
    if (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= windowHeight &&
      rect.right <= windowWidth
    ) {
      return 'visible';
    }

    // Check if partially visible
    if (
      rect.top <= windowHeight &&
      rect.bottom >= 0 &&
      rect.left <= windowWidth &&
      rect.right >= 0
    ) {
      return 'partially-visible';
    }

    // Not visible at all
    return 'hidden';
  }

  /**
   * Create a utility that automatically updates animation visibility based on element visibility
   *
   * @param animationId Animation ID
   * @param element Element to track
   * @param options Configuration options
   * @returns Cleanup function
   */
  function createVisibilityTracker(
    animationId: string,
    element: Element,
    options: {
      checkInterval?: number; // How often to check visibility (ms)
      autoStartWhenVisible?: boolean; // Whether to auto-start the animation when visible
      autoPauseWhenHidden?: boolean; // Whether to auto-pause when hidden
    } = {}
  ): () => void {
    const {
      checkInterval = 500,
      autoStartWhenVisible = false,
      autoPauseWhenHidden = true,
    } = options;

    // Initial visibility check
    let currentVisibility = checkElementVisibility(element);
    updateVisibility(animationId, currentVisibility);

    // Set up interval to check visibility
    const intervalId = setInterval(() => {
      const newVisibility = checkElementVisibility(element);

      // Only update if visibility changed
      if (newVisibility !== currentVisibility) {
        currentVisibility = newVisibility;
        updateVisibility(animationId, newVisibility);

        // Handle auto-start/pause if configured
        const animation = animations.get(animationId);
        if (!animation) return;

        if (
          autoStartWhenVisible &&
          (newVisibility === 'visible' || newVisibility === 'partially-visible') &&
          animation.status === 'idle'
        ) {
          startAnimation(animationId);
        } else if (
          autoPauseWhenHidden &&
          newVisibility === 'hidden' &&
          animation.status === 'running'
        ) {
          pauseAnimation(animationId);
        } else if (
          autoStartWhenVisible &&
          (newVisibility === 'visible' || newVisibility === 'partially-visible') &&
          animation.status === 'paused'
        ) {
          resumeAnimation(animationId);
        }
      }
    }, checkInterval);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }

  /**
   * Create animation synchronization utility that keeps animations in sync
   * even when some are paused or resumed at different times
   *
   * @param animationIds Animation IDs to synchronize
   * @returns Synchronized animation control functions
   */
  function createSynchronizedAnimations(animationIds: string[]) {
    // Generate a unique sync group ID
    const syncGroupId = `sync-group-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Update all animations to use this sync group
    animationIds.forEach(id => {
      const animation = animations.get(id);
      if (animation) {
        animation.config.syncGroup = syncGroupId;

        // Add to sync group
        let group = syncGroups.get(syncGroupId);
        if (!group) {
          group = new Set<string>();
          syncGroups.set(syncGroupId, group);
        }
        group.add(id);
      }
    });

    // Return control functions that operate on the whole group
    return {
      startAll: () => syncAnimations(syncGroupId, 'start'),
      pauseAll: () => syncAnimations(syncGroupId, 'pause'),
      resumeAll: () => syncAnimations(syncGroupId, 'resume'),
      completeAll: () => syncAnimations(syncGroupId, 'complete'),
      cancelAll: () => syncAnimations(syncGroupId, 'cancel'),
      getSyncGroupId: () => syncGroupId,
    };
  }

  // Return the public API
  return {
    registerAnimation,
    startAnimation,
    pauseAnimation,
    resumeAnimation,
    completeAnimation,
    cancelAnimation,
    updateVisibility,
    updatePriority,
    getPerformanceReport,
    getStatus,
    getAnimations,
    checkElementVisibility,
    createVisibilityTracker,
    createSynchronizedAnimations,

    // Direct sync group management
    syncAnimations,
  };
}

/**
 * Singleton instance for simple usage
 */
export const animationFrameManager = createAnimationFrameManager();

/**
 * Helper to register a D3 transition with the animation frame manager
 *
 * @param selection D3 selection to animate
 * @param config Animation configuration
 * @returns Animation ID and the selection
 */
export function registerD3Transition<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  config: Omit<RegisteredAnimationConfig, 'id' | 'type'> & { id?: string }
): { id: string; selection: d3.Selection<GElement, Datum, PElement, PDatum> } {
  // Create complete configuration
  const fullConfig: Omit<RegisteredAnimationConfig, 'id'> & { id?: string } = {
    ...config,
    type: 'transition',
  };

  // Register animation with frame manager
  const id = animationFrameManager.registerAnimation(
    fullConfig,
    (_elapsed, _deltaTime, _frameInfo) => {
      // Calculate progress based on elapsed time
      const duration = fullConfig.duration || 1000;
      const progress = Math.min(1, _elapsed / duration);

      // Check if animation is complete
      if (progress >= 1 && !fullConfig.loop) {
        return true; // Complete the animation
      }

      return false;
    }
  );

  // Start the animation
  animationFrameManager.startAnimation(id);

  return { id, selection };
}

/**
 * Helper to register a D3 timer animation with the frame manager
 *
 * @param callback D3 timer callback
 * @param config Animation configuration
 * @returns Animation ID and stop function
 */
export function registerD3Timer(
  callback: (elapsed: number) => boolean | void,
  config: Omit<RegisteredAnimationConfig, 'id' | 'type'> & { id?: string }
): { id: string; stop: () => void } {
  // Create complete configuration
  const fullConfig: Omit<RegisteredAnimationConfig, 'id'> & { id?: string } = {
    ...config,
    type: 'timer',
  };

  // Register animation with frame manager
  const id = animationFrameManager.registerAnimation(
    fullConfig,
    (elapsed, _deltaTime, _frameInfo) => {
      // Call the original callback
      const result = callback(elapsed);

      // Check if animation should complete
      if (
        result === true ||
        (fullConfig.duration && elapsed >= fullConfig.duration && !fullConfig.loop)
      ) {
        return true; // Complete the animation
      }

      return false;
    }
  );

  // Start the animation
  animationFrameManager.startAnimation(id);

  // Return the ID and a stop function
  return {
    id,
    stop: () => animationFrameManager.cancelAnimation(id),
  };
}

/**
 * Register a TypedAnimationSequence with the frame manager for optimal performance
 *
 * @param sequence Animation sequence to register
 * @param config Animation configuration
 * @returns Animation ID and sequence controller
 */
export function registerAnimationSequence<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(
  sequence: TypedAnimationSequence<GElement, Datum, PElement, PDatum>,
  config: Omit<RegisteredAnimationConfig, 'id' | 'type'> & { id?: string }
): {
  id: string;
  controller: { start: () => void; stop: () => void; pause: () => void; resume: () => void };
} {
  // Store original sequence methods to intercept them
  const _originalStart = sequence.start.bind(sequence); // Bind 'this'
  const _originalStop = sequence.stop.bind(sequence); // Bind 'this'

  // Create complete configuration
  const fullConfig: Omit<RegisteredAnimationConfig, 'id'> & { id?: string } = {
    ...config,
    type: 'sequence',
  };

  // Register animation with frame manager
  const id = animationFrameManager.registerAnimation(
    fullConfig,
    (elapsed, _deltaTime, _frameInfo) => {
      // Check if sequence is complete based on its configuration
      // Since we don't have direct access to sequence's internal state,
      // we rely on the manager to handle timing
      const duration = fullConfig.duration || 1000;

      if (elapsed >= duration && !fullConfig.loop) {
        return true; // Complete the animation
      }

      return false;
    }
  );

  // Create controller
  const controller = {
    start: () => {
      // Start in frame manager
      animationFrameManager.startAnimation(id);
      // Start the actual sequence
      _originalStart.call(sequence);
    },
    stop: () => {
      // Stop in frame manager
      animationFrameManager.cancelAnimation(id);
      // Stop the actual sequence
      _originalStop.call(sequence);
    },
    pause: () => {
      animationFrameManager.pauseAnimation(id);
      // Note: TypedAnimationSequence doesn't have pause method by default
    },
    resume: () => {
      animationFrameManager.resumeAnimation(id);
      // Note: TypedAnimationSequence doesn't have resume method by default
    },
  };

  return { id, controller };
}

/**
 * D3 Animation Performance Profiler
 *
 * This module provides specialized profiling tools for measuring and improving
 * animation performance in D3 visualizations. It includes utilities for:
 *
 * 1. Tracking frame rates and frame timing during animations
 * 2. Measuring interpolation performance
 * 3. Identifying bottlenecks in animation sequences
 * 4. Generating performance reports and recommendations
 */

import * as d3 from 'd3';
import {
  AnimationConfig,
  TypedAnimationSequence,
} from '../../types/visualizations/D3AnimationTypes';

/**
 * Performance metrics for a single animation frame
 */
export interface AnimationFrameMetrics {
  /** Timestamp when the frame started processing */
  frameStartTime: number;
  /** Timestamp when the frame was completed */
  frameEndTime: number;
  /** Duration of the frame in milliseconds */
  frameDuration: number;
  /** Number of DOM updates in this frame */
  domUpdateCount: number;
  /** Number of interpolations performed in this frame */
  interpolationCount: number;
  /** Time spent on interpolation calculations */
  interpolationTime: number;
  /** Time spent on DOM updates */
  domUpdateTime: number;
}

/**
 * Performance data for a complete animation
 */
export interface AnimationPerformanceData {
  /** Unique ID for the animation being profiled */
  animationId: string;
  /** Name of the animation being profiled */
  animationName: string;
  /** When the animation started */
  startTime: number;
  /** When the animation ended */
  endTime: number;
  /** Total duration of the animation */
  totalDuration: number;
  /** Configuration of the animation */
  animationConfig: AnimationConfig;
  /** Performance metrics for each frame */
  frames: AnimationFrameMetrics[];
  /** Average frame duration */
  averageFrameDuration: number;
  /** Minimum frame duration */
  minFrameDuration: number;
  /** Maximum frame duration */
  maxFrameDuration: number;
  /** Target FPS */
  targetFps: number;
  /** Actual average FPS achieved */
  actualFps: number;
  /** Number of frames that exceeded target frame duration */
  droppedFrames: number;
  /** Percentage of frames that met the target duration */
  frameSuccessRate: number;
  /** Total number of DOM updates (only present if detailedMetrics=true) */
  totalDomUpdates?: number;
  /** Total number of interpolations (only present if detailedMetrics=true) */
  totalInterpolations?: number;
  /** Total time spent on interpolations (only present if detailedMetrics=true) */
  totalInterpolationTime?: number;
}

/**
 * Performance bottleneck identification
 */
export interface AnimationBottleneck {
  /** Type of bottleneck */
  type: 'interpolation' | 'dom_updates' | 'javascript' | 'rendering' | 'unknown';
  /** Severity level from 0-1 (0 = minor, 1 = severe) */
  severity: number;
  /** Description of the bottleneck */
  description: string;
  /** Suggested fix */
  suggestion: string;
  /** Frame indices where this bottleneck occurred */
  affectedFrames: number[];
}

/**
 * Animation performance report
 */
export interface AnimationPerformanceReport {
  /** Performance data for the animation */
  performanceData: AnimationPerformanceData;
  /** Identified bottlenecks */
  bottlenecks: AnimationBottleneck[];
  /** Overall performance score (0-100) */
  performanceScore: number;
  /** Specific recommendations to improve performance */
  recommendations: string[];
  /** Whether the animation meets performance targets */
  meetsTargets: boolean;
}

/**
 * Configuration for animation profiling
 */
export interface AnimationProfilerConfig {
  /** Target FPS to maintain */
  targetFps?: number;
  /** Enable detailed per-frame metrics */
  detailedMetrics?: boolean;
  /** Duration to profile (ms) - undefined for entire animation */
  profileDuration?: number;
  /** Whether to track DOM updates */
  trackDomUpdates?: boolean;
  /** Whether to track interpolation performance */
  trackInterpolation?: boolean;
  /** Callback to execute when profiling is complete */
  onComplete?: (report: AnimationPerformanceReport) => void;
}

/**
 * Creates a profiler for measuring animation performance
 *
 * @param config Profiler configuration
 * @returns Animation profiler object
 */
export function createAnimationProfiler(config: AnimationProfilerConfig = {}) {
  const {
    targetFps = 60,
    detailedMetrics = true,
    profileDuration,
    trackDomUpdates = true,
    trackInterpolation = true,
    onComplete,
  } = config;

  // Initialize profiling state
  let animationId = `animation-${Date.now()}`;
  let animationName = 'Unnamed Animation';
  let isRunning = false;
  let startTime = 0;
  let frameCount = 0;
  let frames: AnimationFrameMetrics[] = [];
  let lastFrameTime = 0;
  let animationConfig: AnimationConfig = { duration: 0 };
  // Track total DOM updates (for detailed metrics reporting)
  let totalDomUpdates = 0;
  let interpolationMeasurements: Array<{ count: number; duration: number }> = [];

  const targetFrameDuration = 1000 / targetFps;

  /**
   * Starts profiling an animation
   *
   * @param id Optional custom ID for the animation
   * @param name Optional name for the animation
   * @param config Configuration of the animation being profiled
   */
  function start(id?: string, name?: string, config?: AnimationConfig) {
    if (isRunning) {
      stop();
    }

    if (id) {
      animationId = id;
    }

    if (name) {
      animationName = name;
    }

    if (config) {
      animationConfig = config;
    }

    isRunning = true;
    startTime = performance.now();
    lastFrameTime = startTime;
    frameCount = 0;
    frames = [];
    totalDomUpdates = 0;
    interpolationMeasurements = [];

    // Set up duration-limited profiling if requested
    if (profileDuration) {
      setTimeout(() => {
        if (isRunning) {
          stop();
        }
      }, profileDuration);
    }
  }

  /**
   * Records metrics for a single animation frame
   *
   * @param frameMetrics Optional metrics to include
   */
  function recordFrame(frameMetrics?: Partial<AnimationFrameMetrics>) {
    if (!isRunning) return;

    const now = performance.now();
    const frameDuration = now - lastFrameTime;

    const metrics: AnimationFrameMetrics = {
      frameStartTime: lastFrameTime,
      frameEndTime: now,
      frameDuration,
      domUpdateCount: frameMetrics?.domUpdateCount ?? 0,
      interpolationCount: frameMetrics?.interpolationCount ?? 0,
      interpolationTime: frameMetrics?.interpolationTime ?? 0,
      domUpdateTime: frameMetrics?.domUpdateTime ?? 0,
    };

    frames.push(metrics);
    frameCount++;
    lastFrameTime = now;
  }

  /**
   * Records DOM update performance
   *
   * @param updateCount Number of elements updated
   * @param duration Time taken for the updates
   */
  function recordDomUpdates(updateCount: number, duration: number) {
    if (!isRunning || !trackDomUpdates) return;

    totalDomUpdates += updateCount;

    // Update the last frame with DOM update information
    if (frames.length > 0) {
      const lastFrame = frames[frames.length - 1];
      lastFrame.domUpdateCount += updateCount;
      lastFrame.domUpdateTime += duration;
    }
  }

  /**
   * Records interpolation performance
   *
   * @param count Number of interpolations performed
   * @param duration Time taken for the interpolations
   */
  function recordInterpolation(count: number, duration: number) {
    if (!isRunning || !trackInterpolation) return;

    interpolationMeasurements.push({ count, duration });

    // Update the last frame with interpolation information
    if (frames.length > 0) {
      const lastFrame = frames[frames.length - 1];
      lastFrame.interpolationCount += count;
      lastFrame.interpolationTime += duration;
    }
  }

  /**
   * Stops profiling and generates a performance report
   *
   * @returns A performance report for the animation
   */
  function stop(): AnimationPerformanceReport {
    if (!isRunning) {
      return createEmptyReport();
    }

    isRunning = false;
    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    // Calculate frame statistics
    const frameDurations = frames.map(f => f.frameDuration);
    const averageFrameDuration =
      frames.length > 0
        ? frameDurations.reduce((sum, duration) => sum + duration, 0) / frames.length
        : 0;
    const minFrameDuration = frameDurations.length > 0 ? Math.min(...frameDurations) : 0;
    const maxFrameDuration = frameDurations.length > 0 ? Math.max(...frameDurations) : 0;
    const actualFps = averageFrameDuration > 0 ? 1000 / averageFrameDuration : 0;
    const droppedFrames = frames.filter(f => f.frameDuration > targetFrameDuration).length;
    const frameSuccessRate = frames.length > 0 ? 1 - droppedFrames / frames.length : 0;

    // Create performance data object
    const performanceData: AnimationPerformanceData = {
      animationId,
      animationName,
      startTime,
      endTime,
      totalDuration,
      animationConfig,
      frames,
      averageFrameDuration,
      minFrameDuration,
      maxFrameDuration,
      targetFps,
      actualFps,
      droppedFrames,
      frameSuccessRate,
    };

    // Add detailed metrics if enabled
    if (detailedMetrics) {
      performanceData.totalDomUpdates = totalDomUpdates;
      performanceData.totalInterpolations = interpolationMeasurements.reduce(
        (sum, m) => sum + m.count,
        0
      );
      performanceData.totalInterpolationTime = interpolationMeasurements.reduce(
        (sum, m) => sum + m.duration,
        0
      );
    }

    // Identify bottlenecks
    const bottlenecks = identifyBottlenecks(performanceData);

    // Calculate overall performance score (0-100)
    const performanceScore = calculatePerformanceScore(performanceData, bottlenecks);

    // Generate recommendations
    const recommendations = generateRecommendations(performanceData, bottlenecks);

    // Determine if performance targets are met
    const meetsTargets = performanceScore >= 80 && frameSuccessRate >= 0.95;

    // Create the full report
    const report: AnimationPerformanceReport = {
      performanceData,
      bottlenecks,
      performanceScore,
      recommendations,
      meetsTargets,
    };

    // Call the completion callback if provided
    if (onComplete) {
      onComplete(report);
    }

    return report;
  }

  /**
   * Creates an empty performance report
   */
  function createEmptyReport(): AnimationPerformanceReport {
    return {
      performanceData: {
        animationId,
        animationName,
        startTime: 0,
        endTime: 0,
        totalDuration: 0,
        animationConfig,
        frames: [],
        averageFrameDuration: 0,
        minFrameDuration: 0,
        maxFrameDuration: 0,
        targetFps,
        actualFps: 0,
        droppedFrames: 0,
        frameSuccessRate: 0,
      },
      bottlenecks: [],
      performanceScore: 0,
      recommendations: ['No performance data available.'],
      meetsTargets: false,
    };
  }

  /**
   * Identifies performance bottlenecks in the animation
   */
  function identifyBottlenecks(data: AnimationPerformanceData): AnimationBottleneck[] {
    const bottlenecks: AnimationBottleneck[] = [];

    // Check for frame rate issues
    if (data.actualFps < targetFps * 0.9) {
      bottlenecks.push({
        type: 'unknown',
        severity: Math.min(1, (targetFps - data.actualFps) / targetFps),
        description: `Frame rate below target (${data.actualFps.toFixed(1)} fps vs target ${targetFps} fps)`,
        suggestion: 'Review the animation for complexity and optimize rendering performance',
        affectedFrames: frames.map((_, index) => index),
      });
    }

    // Check for DOM update bottlenecks
    const domHeavyFrames = frames
      .map((frame, index) => ({
        index,
        ratio: frame.domUpdateTime / frame.frameDuration,
      }))
      .filter(frame => frame.ratio > 0.5);

    if (domHeavyFrames.length > frames.length * 0.2) {
      bottlenecks.push({
        type: 'dom_updates',
        severity: Math.min(1, domHeavyFrames.length / frames.length),
        description: `DOM updates consuming >50% of frame time in ${domHeavyFrames.length} frames`,
        suggestion: 'Reduce DOM updates by batching changes or using virtual DOM techniques',
        affectedFrames: domHeavyFrames.map(f => f.index),
      });
    }

    // Check for interpolation bottlenecks
    const interpolationHeavyFrames = frames
      .map((frame, index) => ({
        index,
        ratio: frame.interpolationTime / frame.frameDuration,
      }))
      .filter(frame => frame.ratio > 0.3);

    if (interpolationHeavyFrames.length > frames.length * 0.2) {
      bottlenecks.push({
        type: 'interpolation',
        severity: Math.min(1, interpolationHeavyFrames.length / frames.length),
        description: `Interpolation consuming >30% of frame time in ${interpolationHeavyFrames.length} frames`,
        suggestion:
          'Implement memoization for interpolation results or reduce interpolation complexity',
        affectedFrames: interpolationHeavyFrames.map(f => f.index),
      });
    }

    // Check for rendering issues (high variance in frame times)
    const frameDurationStdDev = calculateStandardDeviation(frames.map(f => f.frameDuration));

    if (frameDurationStdDev > targetFrameDuration * 0.5) {
      bottlenecks.push({
        type: 'rendering',
        severity: Math.min(1, frameDurationStdDev / targetFrameDuration),
        description: 'High variance in frame times indicates inconsistent rendering performance',
        suggestion:
          'Look for layout thrashing, implement requestAnimationFrame properly, or use CSS transitions where possible',
        affectedFrames: frames
          .map((frame, index) => ({ index, duration: frame.frameDuration }))
          .filter(
            frame => Math.abs(frame.duration - data?.averageFrameDuration) > targetFrameDuration
          )
          .map(frame => frame.index),
      });
    }

    return bottlenecks;
  }

  /**
   * Calculates standard deviation for an array of numbers
   */
  function calculateStandardDeviation(values: number[]): number {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Calculates an overall performance score based on metrics and bottlenecks
   */
  function calculatePerformanceScore(
    data: AnimationPerformanceData,
    bottlenecks: AnimationBottleneck[]
  ): number {
    // Base score from frame success rate (0-50 points)
    const frameRateScore = data?.frameSuccessRate * 50;

    // Score from actual FPS vs target FPS (0-20 points)
    const fpsRatio = Math.min(1, data?.actualFps / targetFps);
    const fpsScore = fpsRatio * 20;

    // Penalty from bottlenecks (0-30 points)
    const bottleneckPenalty = bottlenecks.reduce(
      (penalty, bottleneck) => penalty + bottleneck.severity * 10,
      0
    );
    const bottleneckScore = Math.max(0, 30 - bottleneckPenalty);

    // Calculate total score (0-100)
    return Math.round(frameRateScore + fpsScore + bottleneckScore);
  }

  /**
   * Generates performance improvement recommendations
   */
  function generateRecommendations(
    data: AnimationPerformanceData,
    bottlenecks: AnimationBottleneck[]
  ): string[] {
    const recommendations: string[] = [];

    // Add bottleneck-specific recommendations
    bottlenecks.forEach(bottleneck => {
      recommendations.push(bottleneck.suggestion);
    });

    // Add general recommendations based on performance data
    if (data?.actualFps < targetFps * 0.8) {
      recommendations.push('Consider reducing animation complexity or extending duration');
    }

    if (data?.frames.some(f => f.domUpdateCount > 50)) {
      recommendations.push('Limit DOM updates per frame to improve performance');
    }

    if (data?.frames.some(f => f.interpolationCount > 100)) {
      recommendations.push(
        'Reduce the number of interpolations per frame or implement memoization'
      );
    }

    // If performance is good, acknowledge it
    if (data?.frameSuccessRate > 0.95 && data?.actualFps >= targetFps * 0.95) {
      recommendations.push('Animation performance is good, no critical issues detected');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Wraps a selection's transition method to enable profiling
   *
   * @param selection D3 selection to profile
   * @returns The modified selection
   */
  function wrapSelection<GElement extends Element, Datum, PElement extends Element, PDatum>(
    selection: d3.Selection<GElement, Datum, PElement, PDatum>
  ): d3.Selection<GElement, Datum, PElement, PDatum> {
    if (!isRunning || !trackDomUpdates) {
      return selection;
    }

    // Store the original methods
    const originalTransition = selection.transition;
    const originalAttr = selection.attr;
    const originalStyle = selection.style;

    // Wrap transition method
    (selection.transition as unknown) = function (
      this: d3.Selection<GElement, Datum, PElement, PDatum>,
      ...args: Parameters<typeof originalTransition>
    ): ReturnType<typeof originalTransition> {
      const startTime = performance.now();
      const result = originalTransition.apply(this, args);
      const duration = performance.now() - startTime;

      // Record transition creation
      recordDomUpdates(1, duration);

      return result;
    };

    // Wrap attr method
    (selection.attr as unknown) = function (
      this: d3.Selection<GElement, Datum, PElement, PDatum>,
      ...args: Parameters<typeof originalAttr>
    ): ReturnType<typeof originalAttr> {
      const startTime = performance.now();
      const result = originalAttr.apply(this, args);
      const duration = performance.now() - startTime;

      // Record attribute updates
      recordDomUpdates(selection.size(), duration);

      return result;
    };

    // Wrap style method
    (selection.style as unknown) = function (
      this: d3.Selection<GElement, Datum, PElement, PDatum>,
      ...args: Parameters<typeof originalStyle>
    ): ReturnType<typeof originalStyle> {
      const startTime = performance.now();
      const result = originalStyle.apply(this, args);
      const duration = performance.now() - startTime;

      // Record style updates
      recordDomUpdates(selection.size(), duration);

      return result;
    };

    return selection;
  }

  /**
   * Creates a wrapped interpolator for performance measurement
   *
   * @param interpolator Original interpolator function
   * @returns Wrapped interpolator that measures performance
   */
  function wrapInterpolator<T>(interpolator: (t: number) => T): (t: number) => T {
    if (!isRunning || !trackInterpolation) {
      return interpolator;
    }

    return (t: number): T => {
      const startTime = performance.now();
      const result = interpolator(t);
      const duration = performance.now() - startTime;

      recordInterpolation(1, duration);

      return result;
    };
  }

  /**
   * Gets the current profiling status
   */
  function getStatus() {
    return {
      isRunning,
      frameCount,
      elapsedTime: isRunning ? performance.now() - startTime : 0,
      currentFps:
        isRunning && frameCount > 0 ? frameCount / ((performance.now() - startTime) / 1000) : 0,
    };
  }

  // Return the profiler API
  return {
    start,
    stop,
    recordFrame,
    recordDomUpdates,
    recordInterpolation,
    wrapSelection,
    wrapInterpolator,
    getStatus,
  };
}

/**
 * Helper to profile a D3AnimationSequence
 *
 * @param sequence Animation sequence to profile
 * @param config Profiler configuration
 * @returns Promise that resolves to a performance report
 */
export function profileAnimationSequence<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(
  sequence: TypedAnimationSequence<GElement, Datum, PElement, PDatum>,
  config: AnimationProfilerConfig = {}
): Promise<AnimationPerformanceReport> {
  return new Promise(resolve => {
    const profiler = createAnimationProfiler({
      ...config,
      onComplete: report => resolve(report),
    });

    // Define animation sequence config interface
    interface AnimationSequenceConfig {
      transitions?: Array<{ duration?: number }>;
      loop?: boolean;
      onComplete?: () => void;
    }

    // Start profiling
    const sequenceConfig = (sequence as unknown as { config?: AnimationSequenceConfig }).config;
    profiler.start(
      'sequence-' + Date.now(),
      'Animation Sequence',
      // Extract duration from the first transition if available
      sequenceConfig && sequenceConfig.transitions && sequenceConfig.transitions[0]
        ? { duration: sequenceConfig.transitions[0].duration ?? 0 }
        : { duration: 0 }
    );

    // Create a frame tracking wrapper
    const frameTracker = () => {
      profiler.recordFrame();
      if (profiler.getStatus().isRunning) {
        requestAnimationFrame(frameTracker);
      }
    };

    // Start frame tracking
    requestAnimationFrame(frameTracker);

    // Start the sequence
    sequence.start();

    // Stop profiling when sequence completes or after timeout
    const stopTimeout = setTimeout(() => {
      if (profiler.getStatus().isRunning) {
        profiler.stop();
      }
    }, config.profileDuration || 10000); // Default to 10 seconds max

    // Try to access private property to detect completion
    if (sequenceConfig && !sequenceConfig.loop && sequenceConfig.onComplete) {
      const originalOnComplete = sequenceConfig.onComplete;
      sequenceConfig.onComplete = () => {
        originalOnComplete();
        clearTimeout(stopTimeout);
        if (profiler.getStatus().isRunning) {
          profiler.stop();
        }
      };
    }
  });
}

/**
 * Formats a performance report as a readable string
 *
 * @param report Animation performance report
 * @returns Formatted report as string
 */
export function formatPerformanceReport(report: AnimationPerformanceReport): string {
  const { performanceData, bottlenecks, performanceScore, recommendations } = report;

  const lines = [
    `# Animation Performance Report for "${performanceData.animationName}"`,
    ``,
    `## Overview`,
    `- **Performance Score**: ${performanceScore}/100${performanceScore >= 80 ? ' ✅' : ' ⚠️'}`,
    `- **Target FPS**: ${performanceData.targetFps}`,
    `- **Actual FPS**: ${performanceData.actualFps.toFixed(1)}${performanceData.actualFps >= performanceData.targetFps * 0.95 ? ' ✅' : ' ⚠️'}`,
    `- **Duration**: ${performanceData.totalDuration.toFixed(0)}ms`,
    `- **Frame Success Rate**: ${(performanceData.frameSuccessRate * 100).toFixed(1)}%`,
    `- **Dropped Frames**: ${performanceData.droppedFrames} of ${performanceData.frames.length}`,
    ``,
    `## Performance Bottlenecks`,
  ];

  if (bottlenecks.length === 0) {
    lines.push('No significant bottlenecks detected.');
  } else {
    bottlenecks.forEach((bottleneck, i) => {
      lines.push(`### Bottleneck ${i + 1}: ${bottleneck.type.replace('_', ' ').toUpperCase()}`);
      lines.push(`- **Severity**: ${(bottleneck.severity * 100).toFixed(0)}%`);
      lines.push(`- **Description**: ${bottleneck.description}`);
      lines.push(`- **Suggestion**: ${bottleneck.suggestion}`);
      lines.push(``);
    });
  }

  lines.push(`## Recommendations`);
  if (recommendations.length === 0) {
    lines.push('No specific recommendations.');
  } else {
    recommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. ${rec}`);
    });
  }

  return lines.join('\n');
}

/**
 * Default profiler instance for simple usage
 */
export const defaultAnimationProfiler = createAnimationProfiler();

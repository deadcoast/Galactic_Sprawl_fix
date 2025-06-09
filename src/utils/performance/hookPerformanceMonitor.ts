/**
 * @file hookPerformanceMonitor.ts
 * Provides performance monitoring utilities for hooks.
 *
 * This file implements:
 * 1. Execution time measurement for hooks
 * 2. Performance reporting for hooks
 * 3. Threshold-based warnings for slow operations
 */

import { logger } from '../../services/logging/loggerService';

/**
 * Configuration for hook performance monitoring
 */
export interface HookPerformanceConfig {
  /**
   * Whether performance monitoring is enabled
   */
  enabled: boolean;

  /**
   * Threshold in milliseconds for when to warn about slow selector operations
   */
  selectorThreshold?: number;

  /**
   * Threshold in milliseconds for when to warn about slow data computation
   */
  computationThreshold?: number;

  /**
   * Whether to log all measurements, not just those exceeding thresholds
   */
  verbose?: boolean;

  /**
   * Name of the hook (for identification in logs)
   */
  hookName: string;
}

/**
 * Default performance monitoring configuration
 */
export const defaultPerformanceConfig: Omit<HookPerformanceConfig, 'hookName'> = {
  enabled: process.env.NODE_ENV === 'development',
  selectorThreshold: 2, // 2ms
  computationThreshold: 5, // 5ms
  verbose: false,
};

/**
 * Performance data collected for a hook
 */
export interface HookPerformanceData {
  /**
   * Name of the hook
   */
  hookName: string;

  /**
   * Execution times for selectors
   */
  selectorTimes: Record<string, number[]>;

  /**
   * Execution times for computations
   */
  computationTimes: Record<string, number[]>;

  /**
   * Number of renders
   */
  renderCount: number;

  /**
   * Last render timestamp
   */
  lastRenderTime: number;
}

/**
 * Global store for all hooks performance data
 */
const hooksPerformanceData: Record<string, HookPerformanceData> = {};

/**
 * Measures the execution time of a selector function
 *
 * @param selectorName Name of the selector
 * @param fn Function to measure
 * @param config Performance monitoring configuration
 * @returns Result of the function
 */
export function measureSelectorTime<T>(
  selectorName: string,
  fn: () => T,
  config: HookPerformanceConfig
): T {
  if (!config.enabled) {
    return fn();
  }

  // Initialize performance data for this hook if it doesn't exist
  if (!hooksPerformanceData[config.hookName]) {
    hooksPerformanceData[config.hookName] = {
      hookName: config.hookName,
      selectorTimes: {},
      computationTimes: {},
      renderCount: 0,
      lastRenderTime: Date.now(),
    };
  }

  // Initialize selector times for this selector if it doesn't exist
  const hookData = hooksPerformanceData[config.hookName];
  if (!hookData.selectorTimes[selectorName]) {
    hookData.selectorTimes[selectorName] = [];
  }

  // Measure execution time
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  // Store the execution time
  hookData.selectorTimes[selectorName].push(duration);

  // Keep only the last 100 measurements
  if (hookData.selectorTimes[selectorName].length > 100) {
    hookData.selectorTimes[selectorName].shift();
  }

  // Log warning if execution time exceeds threshold
  if (duration > (config.selectorThreshold ?? 2)) {
    logger.warn(
      `[${config.hookName}] Slow selector '${selectorName}': ${duration.toFixed(2)}ms (threshold: ${config.selectorThreshold}ms)`
    );
  } else if (config.verbose) {
    logger.warn(`[${config.hookName}] Selector '${selectorName}': ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Measures the execution time of a computation function
 *
 * @param computationName Name of the computation
 * @param fn Function to measure
 * @param config Performance monitoring configuration
 * @returns Result of the function
 */
export function measureComputationTime<T>(
  computationName: string,
  fn: () => T,
  config: HookPerformanceConfig
): T {
  if (!config.enabled) {
    return fn();
  }

  // Initialize performance data for this hook if it doesn't exist
  if (!hooksPerformanceData[config.hookName]) {
    hooksPerformanceData[config.hookName] = {
      hookName: config.hookName,
      selectorTimes: {},
      computationTimes: {},
      renderCount: 0,
      lastRenderTime: Date.now(),
    };
  }

  // Initialize computation times for this computation if it doesn't exist
  const hookData = hooksPerformanceData[config.hookName];
  if (!hookData.computationTimes[computationName]) {
    hookData.computationTimes[computationName] = [];
  }

  // Measure execution time
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  // Store the execution time
  hookData.computationTimes[computationName].push(duration);

  // Keep only the last 100 measurements
  if (hookData.computationTimes[computationName].length > 100) {
    hookData.computationTimes[computationName].shift();
  }

  // Log warning if execution time exceeds threshold
  if (duration > (config.computationThreshold ?? 5)) {
    logger.warn(
      `[${config.hookName}] Slow computation '${computationName}': ${duration.toFixed(2)}ms (threshold: ${config.computationThreshold}ms)`
    );
  } else if (config.verbose) {
    logger.warn(`[${config.hookName}] Computation '${computationName}': ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Tracks a render of a hook
 *
 * @param config Performance monitoring configuration
 */
export function trackHookRender(config: HookPerformanceConfig): void {
  if (!config.enabled) {
    return;
  }

  // Initialize performance data for this hook if it doesn't exist
  if (!hooksPerformanceData[config.hookName]) {
    hooksPerformanceData[config.hookName] = {
      hookName: config.hookName,
      selectorTimes: {},
      computationTimes: {},
      renderCount: 0,
      lastRenderTime: Date.now(),
    };
  }

  // Increment render count
  const hookData = hooksPerformanceData[config.hookName];
  hookData.renderCount++;

  // Calculate time since last render
  const now = Date.now();
  const timeSinceLastRender = now - hookData.lastRenderTime;
  hookData.lastRenderTime = now;

  // Log if verbose
  if (config.verbose) {
    logger.warn(
      `[${config.hookName}] Render #${hookData.renderCount} (${timeSinceLastRender}ms since last render)`
    );
  }
}

/**
 * Gets performance data for a specific hook
 *
 * @param hookName Name of the hook
 * @returns Performance data for the hook
 */
export function getHookPerformanceData(hookName: string): HookPerformanceData | undefined {
  return hooksPerformanceData[hookName];
}

/**
 * Gets performance data for all hooks
 *
 * @returns Performance data for all hooks
 */
export function getAllHooksPerformanceData(): Record<string, HookPerformanceData> {
  return { ...hooksPerformanceData };
}

/**
 * Gets average execution time for a selector
 *
 * @param hookName Name of the hook
 * @param selectorName Name of the selector
 * @returns Average execution time in milliseconds
 */
export function getAverageSelectorTime(hookName: string, selectorName: string): number {
  const hookData = hooksPerformanceData[hookName];
  if (!hookData?.selectorTimes[selectorName] || hookData.selectorTimes[selectorName].length === 0) {
    return 0;
  }

  const times = hookData.selectorTimes[selectorName];
  return times.reduce((sum, time) => sum + time, 0) / times.length;
}

/**
 * Gets average execution time for a computation
 *
 * @param hookName Name of the hook
 * @param computationName Name of the computation
 * @returns Average execution time in milliseconds
 */
export function getAverageComputationTime(hookName: string, computationName: string): number {
  const hookData = hooksPerformanceData[hookName];
  if (
    !hookData?.computationTimes[computationName] ||
    hookData.computationTimes[computationName].length === 0
  ) {
    return 0;
  }

  const times = hookData.computationTimes[computationName];
  return times.reduce((sum, time) => sum + time, 0) / times.length;
}

/**
 * Gets a performance report for a hook
 *
 * @param hookName Name of the hook
 * @returns Performance report for the hook
 */
export function getHookPerformanceReport(hookName: string): string {
  const hookData = hooksPerformanceData[hookName];
  if (!hookData) {
    return `No performance data available for hook '${hookName}'`;
  }

  let report = `Performance Report for '${hookName}':\n`;
  report += `Total Renders: ${hookData.renderCount}\n\n`;

  report += `Selectors:\n`;
  Object.entries(hookData.selectorTimes).forEach(([selectorName, times]) => {
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const max = Math.max(...times);
    report += `  - ${selectorName}: avg ${average.toFixed(2)}ms, max ${max.toFixed(2)}ms (${times.length} samples)\n`;
  });

  report += `\nComputations:\n`;
  Object.entries(hookData.computationTimes).forEach(([computationName, times]) => {
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const max = Math.max(...times);
    report += `  - ${computationName}: avg ${average.toFixed(2)}ms, max ${max.toFixed(2)}ms (${times.length} samples)\n`;
  });

  return report;
}

/**
 * Clears performance data for a specific hook
 *
 * @param hookName Name of the hook
 */
export function clearHookPerformanceData(hookName: string): void {
  delete hooksPerformanceData[hookName];
}

/**
 * Clears performance data for all hooks
 */
export function clearAllHooksPerformanceData(): void {
  Object.keys(hooksPerformanceData).forEach(hookName => {
    delete hooksPerformanceData[hookName];
  });
}

/**
 * Performance Profiles
 *
 * This file defines different device performance profiles for testing
 * the application across various hardware capabilities.
 */

/**
 * Interface defining a device performance profile
 */
export interface DevicePerformanceProfile {
  /**
   * Description of the device profile
   */
  description: string;

  /**
   * Whether to throttle CPU in tests
   */
  throttleCPU: boolean;

  /**
   * CPU slowdown factor (1 = no slowdown)
   */
  cpuSlowdownFactor?: number;

  /**
   * Memory constraints in MB
   */
  memoryConstraintMB?: number;

  /**
   * Number of resource nodes to use for tests
   */
  resourceNodeCount: number;

  /**
   * Number of resource connections to use for tests
   */
  resourceConnectionCount: number;

  /**
   * Whether batch processing should be used
   */
  shouldUseBatching: boolean;

  /**
   * Batch size for processing
   */
  batchSize?: number;

  /**
   * Whether to use web workers
   */
  shouldUseWebWorker: boolean;
}

/**
 * Performance profiles for different device types
 */
export const performanceProfiles: Record<string, DevicePerformanceProfile> = {
  'low-end-mobile': {
    description: 'Low-end mobile device with limited CPU and memory',
    throttleCPU: true,
    cpuSlowdownFactor: 6, // 6x slower than desktop
    memoryConstraintMB: 512,
    resourceNodeCount: 100,
    resourceConnectionCount: 150,
    shouldUseBatching: true,
    batchSize: 20,
    shouldUseWebWorker: false, // Web worker might be too expensive on low-end devices
  },

  'mid-range-mobile': {
    description: 'Mid-range mobile device',
    throttleCPU: true,
    cpuSlowdownFactor: 3, // 3x slower
    memoryConstraintMB: 1024,
    resourceNodeCount: 300,
    resourceConnectionCount: 450,
    shouldUseBatching: true,
    batchSize: 50,
    shouldUseWebWorker: true,
  },

  'high-end-mobile': {
    description: 'High-end mobile device or tablet',
    throttleCPU: true,
    cpuSlowdownFactor: 2, // 2x slower
    memoryConstraintMB: 2048,
    resourceNodeCount: 500,
    resourceConnectionCount: 800,
    shouldUseBatching: true,
    batchSize: 100,
    shouldUseWebWorker: true,
  },

  laptop: {
    description: 'Average laptop computer',
    throttleCPU: false,
    memoryConstraintMB: 4096,
    resourceNodeCount: 1000,
    resourceConnectionCount: 1500,
    shouldUseBatching: true,
    batchSize: 200,
    shouldUseWebWorker: true,
  },

  desktop: {
    description: 'High-performance desktop computer',
    throttleCPU: false,
    memoryConstraintMB: 8192,
    resourceNodeCount: 2000,
    resourceConnectionCount: 3000,
    shouldUseBatching: true,
    batchSize: 500,
    shouldUseWebWorker: true,
  },

  server: {
    description: 'Server-grade hardware',
    throttleCPU: false,
    memoryConstraintMB: 16384,
    resourceNodeCount: 5000,
    resourceConnectionCount: 10000,
    shouldUseBatching: true,
    batchSize: 1000,
    shouldUseWebWorker: true,
  },
};

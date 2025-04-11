/**
 * D3 Performance Optimizations
 *
 * This utility provides optimizations for D3 visualizations to address
 * common performance bottlenecks identified by the profiler.
 */

import * as d3 from 'd3';
import { memoizedD3Accessors } from './D3PerformanceProfiler';

/**
 * Configuration options for D3 performance optimizations
 */
export interface PerformanceOptimizationConfig {
  /** Whether to use memoized accessors */
  useMemoizedAccessors: boolean;
  /** Whether to use optimized simulation tick logic */
  useOptimizedSimulation: boolean;
  /** Whether to batch DOM updates */
  useBatchedDOMUpdates: boolean;
  /** Whether to use throttled rendering */
  useThrottledRendering: boolean;
  /** Minimum frame time in ms (for throttling) */
  minFrameTimeMs: number;
  /** Whether to use worker-based simulation */
  useWorkerSimulation: boolean;
}

/**
 * Default optimization configuration
 */
export const defaultOptimizationConfig: PerformanceOptimizationConfig = {
  useMemoizedAccessors: true,
  useOptimizedSimulation: true,
  useBatchedDOMUpdates: true,
  useThrottledRendering: false,
  minFrameTimeMs: 16, // ~60fps
  useWorkerSimulation: false,
};

/**
 * Apply optimizations to a D3 force simulation
 *
 * @param simulation The simulation to optimize
 * @param config Optimization configuration
 */
export function optimizeForceSimulation(
  simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>,
  config: Partial<PerformanceOptimizationConfig> = {}
): void {
  const mergedConfig = { ...defaultOptimizationConfig, ...config };

  // Set optimal alpha decay for faster convergence
  if (mergedConfig.useOptimizedSimulation) {
    simulation.alphaDecay(0.03); // Faster convergence
    simulation.alphaMin(0.001); // Stop at lower energy
  }

  // Optimize force distances based on node count
  const nodeCount = simulation.nodes().length;
  const linkForce = simulation.force('link');
  const chargeForce = simulation.force('charge') as d3.ForceManyBody<d3.SimulationNodeDatum>;

  if (linkForce && 'distance' in linkForce) {
    // Adjust link distance based on node count
    // Type assertion with interface for link force with distance method
    interface LinkForceWithDistance {
      distance(distance: number): unknown;
    }
    (linkForce as LinkForceWithDistance).distance(nodeCount > 100 ? 30 : nodeCount > 50 ? 40 : 50);
  }

  if (chargeForce) {
    // Adjust charge strength based on node count
    const chargeStrength = nodeCount > 200 ? -30 : nodeCount > 100 ? -50 : -70;

    chargeForce.strength(chargeStrength);

    // Use theta for approximation in large simulations
    if (nodeCount > 100) {
      chargeForce.theta(0.9); // Higher theta = more approximation = faster but less accurate
    }
  }
}

/**
 * Create a throttled tick function for improved rendering performance
 *
 * @param simulation The simulation to optimize
 * @param tickCallback The function to call on each tick
 * @param config Optimization configuration
 * @returns A function to start/stop the optimized simulation
 */
export function createOptimizedTicker(
  simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>,
  tickCallback: () => void,
  config: Partial<PerformanceOptimizationConfig> = {}
): { start: () => void; stop: () => void } {
  const mergedConfig = { ...defaultOptimizationConfig, ...config };

  let rafId: number | null = null;
  let lastFrameTime = 0;

  // Optimized ticker function
  const ticker = () => {
    const currentTime = performance.now();
    const elapsed = currentTime - lastFrameTime;

    // Run multiple simulation steps for complex simulations with throttled rendering
    if (mergedConfig.useOptimizedSimulation) {
      const iterations = Math.min(
        4, // Max iterations per frame
        Math.max(
          1, // At least one iteration
          Math.floor(elapsed / 8) // ~8ms per iteration target
        )
      );

      // Run simulation steps
      for (let i = 0; i < iterations; i++) {
        simulation.tick();
      }
    } else {
      // Standard single tick
      simulation.tick();
    }

    // Throttle rendering for performance
    if (!mergedConfig.useThrottledRendering || elapsed >= mergedConfig.minFrameTimeMs) {
      tickCallback();
      lastFrameTime = currentTime;
    }

    // Continue animation if simulation is still active
    if (simulation.alpha() > simulation.alphaMin()) {
      rafId = requestAnimationFrame(ticker);
    } else {
      // Ensure one final render when simulation ends
      tickCallback();
      rafId = null;
    }
  };

  return {
    start: () => {
      if (rafId === null) {
        lastFrameTime = performance.now();
        simulation.alpha(1).restart();
        rafId = requestAnimationFrame(ticker);
      }
    },
    stop: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}

/**
 * Optimize D3 selection updates for performance
 *
 * @param selection The D3 selection to optimize
 * @param updateFn The function that performs updates on the selection
 * @param config Optimization configuration
 */
export function optimizeSelectionUpdates<
  T extends d3.Selection<SVGElement, unknown, Element, unknown>,
>(
  selection: T,
  updateFn: (selection: T) => void,
  config: Partial<PerformanceOptimizationConfig> = {}
): void {
  const mergedConfig = { ...defaultOptimizationConfig, ...config };

  if (mergedConfig.useBatchedDOMUpdates) {
    // Temporarily detach elements from DOM for batch updates
    // This only works for SVG elements that are already in the DOM
    const parent = selection.node()?.parentNode;
    const nextSibling = selection.node()?.nextSibling;

    if (parent) {
      const fragment = document.createDocumentFragment();
      selection.each(function () {
        fragment.appendChild(this);
      });

      // Apply updates to detached elements
      updateFn(selection);

      // Reattach elements
      if (nextSibling) {
        parent.insertBefore(fragment, nextSibling);
      } else {
        parent.appendChild(fragment);
      }
    } else {
      // Fall back to normal updates if parent not found
      updateFn(selection);
    }
  } else {
    // Standard updates
    updateFn(selection);
  }
}

/**
 * Create a data structure index for faster lookups
 *
 * @param data Array of data items
 * @param keyFn (...args: unknown[]) => unknown to extract a key from each item
 * @returns An object mapping keys to data items
 */
export function createDataIndex<T>(data: T[], keyFn: (item: T) => string): Record<string, T> {
  return data?.reduce(
    (index, item) => {
      const key = keyFn(item);
      index[key] = item;
      return index;
    },
    {} as Record<string, T>
  );
}

/**
 * Create an optimized D3 accessor function for node properties
 *
 * @param propName The property name to access
 * @param defaultValue Default value to return if property not found
 * @param useMemoized Whether to use memoization
 * @returns An accessor function for the specified property
 */
export function createOptimizedAccessor<T>(
  propName: string,
  defaultValue: T,
  useMemoized = true
): (node: unknown) => T {
  // Use WeakMap for memoization if requested
  const cache = new WeakMap<object, T>();

  // Create the accessor function
  const accessor = (node: unknown): T => {
    if (!node || typeof node !== 'object') {
      return defaultValue;
    }

    // Type-safe property access using type assertion and index access
    const nodeObj = node as Record<string, unknown>;
    return propName in nodeObj ? (nodeObj[propName] as T) : defaultValue;
  };

  // Return memoized version if requested
  if (useMemoized) {
    return (node: unknown): T => {
      if (!node || typeof node !== 'object') {
        return defaultValue;
      }

      // Check cache first
      if (cache.has(node as object)) {
        return cache.get(node as object) as T;
      }

      // Calculate and cache result
      const result = accessor(node);
      cache.set(node as object, result);
      return result;
    };
  }

  return accessor;
}

/**
 * Optimize node coordinates by pre-computing for the current frame
 *
 * @param nodes Array of simulation nodes
 * @returns Object with optimized coordinate getters
 */
export function createCoordinateCache(nodes: d3.SimulationNodeDatum[]): {
  getX: (node: d3.SimulationNodeDatum) => number;
  getY: (node: d3.SimulationNodeDatum) => number;
} {
  // Pre-compute and cache coordinates
  const xCache = new Map<string, number>();
  const yCache = new Map<string, number>();

  // Populate caches
  nodes.forEach(node => {
    // Type-safe property access
    const nodeObj = node as Record<string, unknown>;
    const id = typeof nodeObj.id === 'string' ? nodeObj.id : Math.random().toString();
    xCache.set(id, memoizedD3Accessors.getX(node));
    yCache.set(id, memoizedD3Accessors.getY(node));
  });

  return {
    getX: (node: d3.SimulationNodeDatum): number => {
      // Type-safe property access
      const nodeObj = node as Record<string, unknown>;
      const id = typeof nodeObj.id === 'string' ? nodeObj.id : '';
      return xCache.has(id) ? (xCache.get(id) ?? 0) : memoizedD3Accessors.getX(node);
    },
    getY: (node: d3.SimulationNodeDatum): number => {
      // Type-safe property access
      const nodeObj = node as Record<string, unknown>;
      const id = typeof nodeObj.id === 'string' ? nodeObj.id : '';
      return yCache.has(id) ? (yCache.get(id) ?? 0) : memoizedD3Accessors.getY(node);
    },
  };
}

/**
 * Optimize data transformations by memoizing results
 *
 * @param transformFn The function that transforms the data
 * @returns A memoized version of the transform function
 */
export function memoizeTransform<T, R>(transformFn: (data: T) => R): (data: T) => R {
  const cache = new Map<string, R>();

  return (data: T): R => {
    // Create a cache key based on JSON stringification
    // Note: This assumes data is serializable and not too large
    const key = JSON.stringify(data);

    if (cache.has(key)) {
      return cache.get(key) as R;
    }

    const result = transformFn(data);
    cache.set(key, result);
    return result;
  };
}

/**
 * Apply all available performance optimizations to a D3 visualization
 *
 * @param simulation The force simulation to optimize
 * @param selectionUpdater Function that updates the visualization's DOM elements
 * @param config Optimization configuration
 * @returns Controls for the optimized simulation
 */
export function optimizeVisualization(
  simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>,
  selectionUpdater: () => void,
  config: Partial<PerformanceOptimizationConfig> = {}
): { start: () => void; stop: () => void } {
  const mergedConfig = { ...defaultOptimizationConfig, ...config };

  // 1. Optimize the force simulation parameters
  optimizeForceSimulation(simulation, mergedConfig);

  // 2. Create optimized ticker with throttled rendering
  return createOptimizedTicker(
    simulation,
    () => {
      // Clear accessor caches on each frame
      if (mergedConfig.useMemoizedAccessors) {
        memoizedD3Accessors.clearAllCache();
      }

      // Call the selection updater function to render changes
      selectionUpdater();
    },
    mergedConfig
  );
}

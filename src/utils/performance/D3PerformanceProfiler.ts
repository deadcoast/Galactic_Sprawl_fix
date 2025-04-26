/**
 * D3 Performance Profiler
 *
 * This utility provides tools for profiling D3 visualizations to identify
 * performance bottlenecks in simulation ticks and rendering operations.
 */

import * as d3 from 'd3';
import { d3Accessors, SimulationNodeDatum } from '../../types/visualizations/D3Types';

// Create a common interface for a D3 force that has an 'on' method
interface ForceWithOnMethod {
  on(typenames: string, listener: null | (() => void)): unknown;
}

/**
 * Types of performance measurements
 */
export enum ProfilerMeasurementType {
  SIMULATION_TICK = 'simulation_tick',
  FORCE_CALCULATION = 'force_calculation',
  COORDINATE_ACCESS = 'coordinate_access',
  DOM_MANIPULATION = 'dom_manipulation',
  ATTRIBUTE_UPDATE = 'attribute_update',
  TRANSITION = 'transition',
  DATA_PREPARATION = 'data_preparation',
  OTHER = 'other',
}

/**
 * Performance measurement result
 */
export interface PerformanceMeasurement {
  /** Type of operation measured */
  type: ProfilerMeasurementType;
  /** Name/description of the specific operation */
  name: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Number of operations performed */
  operationCount: number;
  /** Whether this operation is a bottleneck */
  isBottleneck: boolean;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Timestamp when the measurement was taken */
  timestamp: Date;
}

/**
 * A section of code to profile
 */
export interface ProfilerSection {
  /** Name/description of the section */
  name: string;
  /** Type of operation */
  type: ProfilerMeasurementType;
  /** (...args: unknown[]) => unknown to execute */
  fn: () => void;
  /** Operation count (e.g., number of nodes processed) */
  operationCount: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Performance profile result
 */
export interface PerformanceProfile {
  /** All measurements taken */
  measurements: PerformanceMeasurement[];
  /** Total duration of all measurements */
  totalDurationMs: number;
  /** Identified bottlenecks */
  bottlenecks: PerformanceMeasurement[];
  /** Start time of the profile */
  startTime: Date;
  /** End time of the profile */
  endTime: Date;
  /** Recommendations for performance optimization */
  recommendations: string[];
}

/**
 * Methods for profiling D3 visualization performance
 */
export class D3Profiler {
  private measurements: PerformanceMeasurement[] = [];
  private startTime: Date | null = null;
  private endTime: Date | null = null;
  private bottleneckThreshold = 5; // ms

  /**
   * Create a new profiler instance
   *
   * @param bottleneckThreshold Threshold in ms to consider an operation a bottleneck
   */
  constructor(bottleneckThreshold?: number) {
    if (bottleneckThreshold !== undefined) {
      this.bottleneckThreshold = bottleneckThreshold;
    }
  }

  /**
   * Start a profiling session
   */
  startProfiling(): void {
    this.measurements = [];
    this.startTime = new Date();
  }

  /**
   * End a profiling session and return the profile
   *
   * @returns The performance profile
   */
  endProfiling(): PerformanceProfile {
    this.endTime = new Date();

    if (!this.startTime) {
      throw new Error('Cannot end profiling session that has not been started');
    }

    // Calculate total duration
    const totalDurationMs = this.measurements.reduce(
      (total, measurement) => total + measurement.durationMs,
      0
    );

    // Identify bottlenecks
    const bottlenecks = this.measurements.filter(
      measurement =>
        measurement.durationMs > this.bottleneckThreshold ||
        measurement.durationMs / totalDurationMs > 0.1 // >10% of total time
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(bottlenecks, totalDurationMs);

    return {
      measurements: this.measurements,
      totalDurationMs,
      bottlenecks,
      startTime: this.startTime,
      endTime: this.endTime,
      recommendations,
    };
  }

  /**
   * Measure the performance of a section of code
   *
   * @param section The section to profile
   * @returns The performance measurement
   */
  measureSection(section: ProfilerSection): PerformanceMeasurement {
    const startTime = performance.now();
    section.fn();
    const endTime = performance.now();

    const durationMs = endTime - startTime;
    const isBottleneck = durationMs > this.bottleneckThreshold;

    const measurement: PerformanceMeasurement = {
      type: section.type,
      name: section.name,
      durationMs,
      operationCount: section.operationCount,
      isBottleneck,
      metadata: section.metadata,
      timestamp: new Date(),
    };

    this.measurements.push(measurement);
    return measurement;
  }

  /**
   * Get the bottleneck threshold
   */
  getBottleneckThreshold(): number {
    return this.bottleneckThreshold;
  }

  /**
   * Generate optimization recommendations based on the profile
   *
   * @param bottlenecks The identified bottlenecks
   * @param _totalDurationMs Total duration of all measurements (prefixed, unused)
   * @returns Array of recommendation strings
   */
  private generateRecommendations(
    bottlenecks: PerformanceMeasurement[],
    _totalDurationMs: number // Prefixed
  ): string[] {
    const recommendations: string[] = [];

    if (bottlenecks.length === 0) {
      recommendations.push('No significant bottlenecks detected.');
      return recommendations;
    }

    // Group bottlenecks by type
    const bottlenecksByType = bottlenecks.reduce(
      (groups, bottleneck) => {
        const group = groups[bottleneck.type] ?? [];
        group.push(bottleneck);
        groups[bottleneck.type] = group;
        return groups;
      },
      {} as Record<ProfilerMeasurementType, PerformanceMeasurement[]>
    );

    // Generate recommendations for each type of bottleneck
    if (bottlenecksByType[ProfilerMeasurementType.SIMULATION_TICK]) {
      recommendations.push(
        'Optimize simulation tick function by reducing complexity or frequency of updates.'
      );
      recommendations.push(
        'Consider using a lower alpha decay rate to reduce the number of simulation ticks.'
      );
    }

    if (bottlenecksByType[ProfilerMeasurementType.COORDINATE_ACCESS]) {
      recommendations.push(
        'Consider memoizing coordinate accessors for frequently accessed nodes.'
      );
      recommendations.push(
        'In performance-critical loops, use direct property access with proper type checking.'
      );
    }

    if (bottlenecksByType[ProfilerMeasurementType.DOM_MANIPULATION]) {
      recommendations.push('Reduce DOM manipulation frequency by batching updates.');
      recommendations.push(
        "Use D3's enter/update/exit pattern efficiently to minimize DOM operations."
      );
    }

    if (bottlenecksByType[ProfilerMeasurementType.ATTRIBUTE_UPDATE]) {
      recommendations.push('Reduce the number of attribute updates during animation frames.');
      recommendations.push(
        'Consider using CSS transitions for simple animations instead of JavaScript.'
      );
    }

    if (bottlenecksByType[ProfilerMeasurementType.DATA_PREPARATION]) {
      recommendations.push('Cache transformed data to avoid recalculating on each render.');
      recommendations.push('Implement lazy evaluation for data transformations when possible.');
    }

    // General recommendations
    recommendations.push(
      'Consider using React.memo or useMemo for components that render D3 visualizations.'
    );

    return recommendations;
  }
}

/**
 * Specialized profiler for D3 force simulations
 */
export class ForceSimulationProfiler {
  private profiler: D3Profiler;
  private originalTick: ((...args: unknown[]) => unknown) | null = null;
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null;
  private tickMeasurements: PerformanceMeasurement[] = [];
  private forceMeasurements: Record<string, PerformanceMeasurement[]> = {};

  constructor(bottleneckThreshold?: number) {
    this.profiler = new D3Profiler(bottleneckThreshold);
  }

  /**
   * Attach the profiler to a D3 force simulation
   *
   * @param simulation The D3 force simulation to profile
   */
  attachToSimulation(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>): void {
    this.simulation = simulation;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.originalTick = simulation.tick as (...args: unknown[]) => unknown;

    // Wrap the tick function to measure performance
    const { originalTick } = this;
    // Store the profiler instance for use in the customTick function
    const profilerInstance = this.profiler;
    const { tickMeasurements } = this;

    // Define a function that returns a simulation
    const customTick = function (this: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
      const startTime = performance.now();
      // Call original tick in the context of the simulation
      originalTick?.apply(simulation, []);
      const endTime = performance.now();

      tickMeasurements.push({
        type: ProfilerMeasurementType.SIMULATION_TICK,
        name: 'Simulation Tick',
        durationMs: endTime - startTime,
        operationCount: simulation.nodes().length,
        isBottleneck: endTime - startTime > profilerInstance.getBottleneckThreshold(),
        metadata: {
          nodeCount: simulation.nodes().length,
          alpha: simulation.alpha(),
        },
        timestamp: new Date(),
      });

      return this;
    };

    // Assign the custom tick function
    simulation.tick = customTick;

    // Wrap each force to measure performance
    // Use proper typings for on() method
    const linkForce = simulation.force('link');
    const chargeForce = simulation.force('charge');
    const centerForce = simulation.force('center');
    const collisionForce = simulation.force('collision');

    if (linkForce && 'on' in linkForce) {
      (linkForce as unknown as ForceWithOnMethod).on('tick.profile', this.measureForce('link'));
    }

    if (chargeForce && 'on' in chargeForce) {
      (chargeForce as unknown as ForceWithOnMethod).on('tick.profile', this.measureForce('charge'));
    }

    if (centerForce && 'on' in centerForce) {
      (centerForce as unknown as ForceWithOnMethod).on('tick.profile', this.measureForce('center'));
    }

    if (collisionForce && 'on' in collisionForce) {
      (collisionForce as unknown as ForceWithOnMethod).on(
        'tick.profile',
        this.measureForce('collision')
      );
    }
  }

  /**
   * Generate a function to measure force calculation performance
   *
   * @param forceName The name of the force to measure
   * @returns A function to measure the force
   */
  private measureForce(forceName: string): () => void {
    return () => {
      const startTime = performance.now();
      // The force calculation happens automatically
      const endTime = performance.now();

      if (!this.forceMeasurements[forceName]) {
        this.forceMeasurements[forceName] = [];
      }

      this.forceMeasurements[forceName].push({
        type: ProfilerMeasurementType.FORCE_CALCULATION,
        name: `${forceName} Force Calculation`,
        durationMs: endTime - startTime,
        operationCount: this.simulation?.nodes().length ?? 0,
        isBottleneck: endTime - startTime > this.profiler.getBottleneckThreshold(),
        metadata: {
          forceName,
          nodeCount: this.simulation?.nodes().length ?? 0,
          alpha: this.simulation?.alpha() ?? 0,
        },
        timestamp: new Date(),
      });
    };
  }

  /**
   * Detach the profiler from the simulation
   */
  detachFromSimulation(): void {
    if (!this.simulation || !this.originalTick) {
      return;
    }

    // Restore original tick function
    this.simulation.tick = this.originalTick as d3.Simulation<
      d3.SimulationNodeDatum,
      undefined
    >['tick'];

    // Remove event listeners from forces
    const linkForce = this.simulation.force('link');
    const chargeForce = this.simulation.force('charge');
    const centerForce = this.simulation.force('center');
    const collisionForce = this.simulation.force('collision');

    if (linkForce && 'on' in linkForce) {
      (linkForce as unknown as ForceWithOnMethod).on('tick.profile', null);
    }

    if (chargeForce && 'on' in chargeForce) {
      (chargeForce as unknown as ForceWithOnMethod).on('tick.profile', null);
    }

    if (centerForce && 'on' in centerForce) {
      (centerForce as unknown as ForceWithOnMethod).on('tick.profile', null);
    }

    if (collisionForce && 'on' in collisionForce) {
      (collisionForce as unknown as ForceWithOnMethod).on('tick.profile', null);
    }

    this.simulation = null;
    this.originalTick = null;
  }

  /**
   * Get the profile results
   *
   * @returns The performance profile
   */
  getProfile(): PerformanceProfile {
    const allMeasurements = [
      ...this.tickMeasurements,
      ...Object.values(this.forceMeasurements).flat(),
    ];

    const totalDurationMs = allMeasurements.reduce(
      (total, measurement) => total + measurement.durationMs,
      0
    );

    const bottlenecks = allMeasurements.filter(
      measurement =>
        measurement.durationMs > this.profiler.getBottleneckThreshold() ||
        measurement.durationMs / totalDurationMs > 0.1 // >10% of total time
    );

    // Calculate average tick time
    const avgTickTime =
      this.tickMeasurements.length > 0
        ? this.tickMeasurements.reduce((sum, m) => sum + m.durationMs, 0) /
          this.tickMeasurements.length
        : 0;

    // Generate specialized recommendations
    const recommendations = this.generateForceRecommendations(bottlenecks, avgTickTime);

    // Sort measurements by time (most expensive first)
    const sortedMeasurements = allMeasurements.sort((a, b) => b.durationMs - a.durationMs);

    return {
      measurements: sortedMeasurements,
      totalDurationMs,
      bottlenecks,
      startTime: this.tickMeasurements.length > 0 ? this.tickMeasurements[0].timestamp : new Date(),
      endTime:
        this.tickMeasurements.length > 0
          ? this.tickMeasurements[this.tickMeasurements.length - 1].timestamp
          : new Date(),
      recommendations,
    };
  }

  /**
   * Generate recommendations for force simulation optimization
   *
   * @param bottlenecks The identified bottlenecks
   * @param avgTickTime Average tick time in milliseconds
   * @returns Array of recommendation strings
   */
  private generateForceRecommendations(
    bottlenecks: PerformanceMeasurement[],
    avgTickTime: number
  ): string[] {
    const recommendations: string[] = [];

    // Check for slow tick performance
    if (avgTickTime > 16) {
      // 16ms = 60fps threshold
      recommendations.push(
        `Simulation tick performance is below 60fps (${avgTickTime.toFixed(2)}ms per tick). Consider the following optimizations:`
      );

      recommendations.push('- Reduce the number of nodes in the simulation');
      recommendations.push('- Use a higher alpha decay rate to converge faster');
      recommendations.push('- Implement a step-based simulation instead of continuous');
    }

    // Identify problematic forces
    const forceBottlenecks = bottlenecks.filter(
      b => b.type === ProfilerMeasurementType.FORCE_CALCULATION
    );

    if (forceBottlenecks.length > 0) {
      // Group by force name
      const forceGroups = forceBottlenecks.reduce(
        (groups, bottleneck) => {
          const forceName = (bottleneck.metadata?.forceName as string) || 'unknown';
          const group = groups[forceName] ?? [];
          group.push(bottleneck);
          groups[forceName] = group;
          return groups;
        },
        {} as Record<string, PerformanceMeasurement[]>
      );

      // Generate recommendations for each slow force
      Object.entries(forceGroups).forEach(([forceName, measurements]) => {
        const avgForceTime =
          measurements.reduce((sum, m) => sum + m.durationMs, 0) / measurements.length;

        recommendations.push(
          `Force '${forceName}' is taking ${avgForceTime.toFixed(2)}ms on average. Consider:`
        );

        if (forceName === 'link') {
          recommendations.push('- Reduce the number of links or link distance');
          recommendations.push('- Use a more efficient link force implementation');
        } else if (forceName === 'charge') {
          recommendations.push('- Reduce charge strength or increase distance cutoff');
          recommendations.push('- Use a more approximate charge calculation (higher theta value)');
        } else if (forceName === 'collision') {
          recommendations.push('- Reduce collision radius or iteration count');
          recommendations.push('- Consider using a simpler collision detection strategy');
        }
      });
    }

    return recommendations;
  }

  /**
   * Reset the profiler
   */
  reset(): void {
    this.tickMeasurements = [];
    this.forceMeasurements = {};
  }
}

/**
 * Profile the performance of coordinate access methods
 *
 * @param nodes The nodes to test coordinate access on
 * @param iterations Number of iterations to run
 * @returns The performance measurement
 */
export function profileCoordinateAccess(
  nodes: SimulationNodeDatum[],
  iterations = 1000
): PerformanceProfile {
  const profiler = new D3Profiler();
  profiler.startProfiling();

  // Profile direct property access
  profiler.measureSection({
    name: 'Direct Property Access',
    type: ProfilerMeasurementType.COORDINATE_ACCESS,
    operationCount: nodes.length * iterations,
    fn: () => {
      for (let i = 0; i < iterations; i++) {
        for (const node of nodes) {
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _transform = `translate(${x}, ${y})`; // Prefixed
        }
      }
    },
  });

  // Profile type-safe accessor functions
  profiler.measureSection({
    name: 'Type-Safe Accessor Functions',
    type: ProfilerMeasurementType.COORDINATE_ACCESS,
    operationCount: nodes.length * iterations,
    fn: () => {
      for (let i = 0; i < iterations; i++) {
        for (const node of nodes) {
          const x = d3Accessors.getX(node);
          const y = d3Accessors.getY(node);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _transform = `translate(${x}, ${y})`; // Prefixed
        }
      }
    },
  });

  return profiler.endProfiling();
}

/**
 * Profile DOM manipulation performance
 *
 * @param containerSelector The CSS selector for the container element
 * @param nodeCount Number of nodes to create
 * @returns The performance measurement
 */
export function profileDOMOperations(
  containerSelector: string,
  nodeCount = 1000
): PerformanceProfile {
  const profiler = new D3Profiler();
  profiler.startProfiling();

  const container = d3.select(containerSelector);

  // Generate test data
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    x: Math.random() * 500,
    y: Math.random() * 500,
    value: Math.random() * 100,
  }));

  // Profile DOM creation
  profiler.measureSection({
    name: 'DOM Creation',
    type: ProfilerMeasurementType.DOM_MANIPULATION,
    operationCount: nodeCount,
    fn: () => {
      container.selectAll('*').remove();
      const svg = container.append('svg').attr('width', 500).attr('height', 500);

      svg
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('cx', d => {
          const node = d as { x: number };
          return node.x;
        })
        .attr('cy', d => {
          const node = d as { y: number };
          return node.y;
        })
        .attr('r', d => {
          const node = d as { value: number };
          return node.value / 10;
        })
        .attr('fill', 'steelblue');
    },
  });

  // Profile attribute updates
  profiler.measureSection({
    name: 'Attribute Updates',
    type: ProfilerMeasurementType.ATTRIBUTE_UPDATE,
    operationCount: nodeCount,
    fn: () => {
      container
        .selectAll('circle')
        .attr('cx', d => {
          const node = d as { x: number };
          return node.x + Math.random() * 10 - 5;
        })
        .attr('cy', d => {
          const node = d as { y: number };
          return node.y + Math.random() * 10 - 5;
        })
        .attr('r', d => {
          const node = d as { value: number };
          return node.value / 10 + Math.random() * 2;
        });
    },
  });

  // Profile transitions
  profiler.measureSection({
    name: 'Transitions',
    type: ProfilerMeasurementType.TRANSITION,
    operationCount: nodeCount,
    fn: () => {
      container
        .selectAll('circle')
        .transition()
        .duration(500)
        .attr('cx', d => {
          const node = d as { x: number };
          return node.x + Math.random() * 20 - 10;
        })
        .attr('cy', d => {
          const node = d as { y: number };
          return node.y + Math.random() * 20 - 10;
        });
    },
  });

  // Profile DOM removal
  profiler.measureSection({
    name: 'DOM Removal',
    type: ProfilerMeasurementType.DOM_MANIPULATION,
    operationCount: nodeCount,
    fn: () => {
      container.selectAll('*').remove();
    },
  });

  return profiler.endProfiling();
}

/**
 * Create a memoized version of the D3 accessor functions
 */
export const memoizedD3Accessors = {
  // Cache for getX results
  xCache: new WeakMap<object, number>(),

  // Cache for getY results
  yCache: new WeakMap<object, number>(),

  /**
   * Get the x coordinate of a node (with memoization)
   */
  getX: (node: object): number => {
    if (!node || typeof node !== 'object') {
      return 0;
    }

    // Check cache first
    if (memoizedD3Accessors.xCache.has(node)) {
      return memoizedD3Accessors.xCache.get(node) ?? 0;
    }

    // Calculate and cache result
    const result = d3Accessors.getX(node);
    memoizedD3Accessors.xCache.set(node, result);
    return result;
  },

  /**
   * Get the y coordinate of a node (with memoization)
   */
  getY: (node: object): number => {
    if (!node || typeof node !== 'object') {
      return 0;
    }

    // Check cache first
    if (memoizedD3Accessors.yCache.has(node)) {
      return memoizedD3Accessors.yCache.get(node) ?? 0;
    }

    // Calculate and cache result
    const result = d3Accessors.getY(node);
    memoizedD3Accessors.yCache.set(node, result);
    return result;
  },

  /**
   * Clear the cache for a specific node
   */
  clearCache: (node: object): void => {
    memoizedD3Accessors.xCache.delete(node);
    memoizedD3Accessors.yCache.delete(node);
  },

  /**
   * Clear the entire cache
   */
  clearAllCache: (): void => {
    memoizedD3Accessors.xCache = new WeakMap<object, number>();
    memoizedD3Accessors.yCache = new WeakMap<object, number>();
  },
};

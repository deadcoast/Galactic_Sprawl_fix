/**
 * Performance Budgets
 *
 * This file defines performance budgets for key operations in the application.
 * These budgets serve as thresholds for acceptable performance and are used
 * to detect performance regressions during automated testing.
 */

export interface PerformanceBudget {
  /**
   * The name of the operation or component being measured
   */
  name: string;

  /**
   * Maximum acceptable execution time in milliseconds
   */
  maxExecutionTimeMs: number;

  /**
   * Maximum acceptable memory usage in MB (if applicable)
   */
  maxMemoryUsageMB?: number;

  /**
   * Minimum acceptable operations per second (if applicable)
   */
  minOperationsPerSecond?: number;

  /**
   * Description of the budget
   */
  description?: string;

  /**
   * The category this budget belongs to
   */
  category: 'resourceFlow' | 'eventSystem' | 'ui' | 'initialization' | 'network';

  /**
   * Whether this is a critical budget where violations should block CI
   */
  critical: boolean;
}

/**
 * Resource Flow Manager Performance Budgets
 */
export const RESOURCE_FLOW_BUDGETS: PerformanceBudget[] = [
  {
    name: 'ResourceFlow (Small)',
    maxExecutionTimeMs: 50,
    maxMemoryUsageMB: 10,
    description: 'Small resource network (50 nodes, 75 connections)',
    category: 'resourceFlow',
    critical: true,
  },
  {
    name: 'ResourceFlow (Medium)',
    maxExecutionTimeMs: 200,
    maxMemoryUsageMB: 25,
    description: 'Medium resource network (200 nodes, 300 connections)',
    category: 'resourceFlow',
    critical: true,
  },
  {
    name: 'ResourceFlow (Large)',
    maxExecutionTimeMs: 500,
    maxMemoryUsageMB: 50,
    description: 'Large resource network (500 nodes, 750 connections)',
    category: 'resourceFlow',
    critical: false,
  },
  {
    name: 'ResourceFlow Optimization',
    maxExecutionTimeMs: 300,
    maxMemoryUsageMB: 30,
    description: 'Resource flow optimization cycle',
    category: 'resourceFlow',
    critical: true,
  },
];

/**
 * Event System Performance Budgets
 */
export const EVENT_SYSTEM_BUDGETS: PerformanceBudget[] = [
  {
    name: 'EventSystem Processing (1000 events)',
    maxExecutionTimeMs: 100,
    minOperationsPerSecond: 10000,
    description: 'Processing 1000 standard events',
    category: 'eventSystem',
    critical: true,
  },
  {
    name: 'EventPrioritizer (High Priority)',
    maxExecutionTimeMs: 5,
    description: 'Processing high priority events',
    category: 'eventSystem',
    critical: true,
  },
  {
    name: 'Event Batching (100 events)',
    maxExecutionTimeMs: 50,
    description: 'Batching 100 events',
    category: 'eventSystem',
    critical: false,
  },
];

/**
 * UI Performance Budgets
 */
export const UI_PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  {
    name: 'ResourceManagementDashboard Render',
    maxExecutionTimeMs: 50,
    description: 'Initial render of resource management dashboard',
    category: 'ui',
    critical: true,
  },
  {
    name: 'ResourceVisualizationEnhanced Update',
    maxExecutionTimeMs: 16, // Target 60fps
    description: 'Updating resource visualization component',
    category: 'ui',
    critical: true,
  },
  {
    name: 'VirtualizedResourceList (1000 items)',
    maxExecutionTimeMs: 30,
    description: 'Rendering virtualized resource list with 1000 items',
    category: 'ui',
    critical: true,
  },
  {
    name: 'VirtualizedEventLog (1000 events)',
    maxExecutionTimeMs: 30,
    description: 'Rendering virtualized event log with 1000 events',
    category: 'ui',
    critical: true,
  },
];

/**
 * Initialization Performance Budgets
 */
export const INITIALIZATION_BUDGETS: PerformanceBudget[] = [
  {
    name: 'Application Bootstrap',
    maxExecutionTimeMs: 1000,
    description: 'Time to bootstrap the application',
    category: 'initialization',
    critical: true,
  },
  {
    name: 'Resource System Initialization',
    maxExecutionTimeMs: 300,
    description: 'Time to initialize the resource system',
    category: 'initialization',
    critical: false,
  },
];

/**
 * All performance budgets
 */
export const ALL_PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  ...RESOURCE_FLOW_BUDGETS,
  ...EVENT_SYSTEM_BUDGETS,
  ...UI_PERFORMANCE_BUDGETS,
  ...INITIALIZATION_BUDGETS,
];

/**
 * Get performance budget by name
 * @param name Budget name
 * @returns Performance budget or undefined if not found
 */
export function getPerformanceBudget(name: string): PerformanceBudget | undefined {
  return ALL_PERFORMANCE_BUDGETS.find(budget => budget.name === name);
}

/**
 * Get performance budgets by category
 * @param category Budget category
 * @returns Array of performance budgets in the specified category
 */
export function getPerformanceBudgetsByCategory(
  category: PerformanceBudget['category']
): PerformanceBudget[] {
  return ALL_PERFORMANCE_BUDGETS.filter(budget => budget.category === category);
}

/**
 * Check if a result violates its performance budget
 * @param resultName Name of the result
 * @param executionTimeMs Execution time in milliseconds
 * @param memoryUsageMB Memory usage in MB (optional)
 * @param operationsPerSecond Operations per second (optional)
 * @returns Object indicating if budget is violated and details
 */
export function checkPerformanceBudget(
  resultName: string,
  executionTimeMs: number,
  memoryUsageMB?: number,
  operationsPerSecond?: number
): {
  violated: boolean;
  budget?: PerformanceBudget;
  violations: {
    executionTime?: boolean;
    memoryUsage?: boolean;
    operationsPerSecond?: boolean;
  };
} {
  const budget = getPerformanceBudget(resultName);

  if (!budget) {
    return { violated: false, violations: {} };
  }

  const violations = {
    executionTime: budget.maxExecutionTimeMs < executionTimeMs,
    memoryUsage:
      budget.maxMemoryUsageMB !== undefined &&
      memoryUsageMB !== undefined &&
      budget.maxMemoryUsageMB < memoryUsageMB,
    operationsPerSecond:
      budget.minOperationsPerSecond !== undefined &&
      operationsPerSecond !== undefined &&
      budget.minOperationsPerSecond > operationsPerSecond,
  };

  const violated =
    violations.executionTime || violations.memoryUsage || violations.operationsPerSecond;

  return {
    violated,
    budget,
    violations,
  };
}

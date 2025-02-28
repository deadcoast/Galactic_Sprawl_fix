import { ResourceState, ResourceType } from './ResourceTypes';

/**
 * Pool allocation strategy
 */
export type PoolAllocationStrategy = 'equal' | 'priority' | 'demand-based' | 'custom';

/**
 * Pool distribution rule
 */
export interface PoolDistributionRule {
  id: string;
  poolId: string;
  targetIds: string[];
  resourceType: ResourceType;
  percentage: number;
  minAmount?: number;
  maxAmount?: number;
  priority: number;
  condition?: (state: ResourceState) => boolean;
}

/**
 * Pool allocation result
 */
export interface PoolAllocationResult {
  poolId: string;
  resourceType: ResourceType;
  allocations: Array<{
    targetId: string;
    amount: number;
    percentage: number;
  }>;
  timestamp: number;
}

/**
 * Pool allocation options
 */
export interface PoolAllocationOptions {
  strategy?: PoolAllocationStrategy;
  priorityMap?: Map<string, number>;
  customAllocations?: Map<string, number>;
  minAllocation?: number;
  maxAllocation?: number;
}

/**
 * Pool distribution options
 */
export interface PoolDistributionOptions {
  interval?: number;
  maxHistory?: number;
  autoDistribute?: boolean;
  validateRules?: boolean;
}

/**
 * Pool target demand
 */
export interface PoolTargetDemand {
  targetId: string;
  resourceType: ResourceType;
  currentAmount: number;
  capacity: number;
  priority: number;
  demandFactor: number;
}

/**
 * Pool resource summary
 */
export interface PoolResourceSummary {
  poolId: string;
  resourceType: ResourceType;
  amount: number;
  capacity: number;
  percentage: number;
  distributionRules: number;
  lastDistribution?: number;
}

/**
 * Type guard for PoolDistributionRule
 */
export function isPoolDistributionRule(obj: any): obj is PoolDistributionRule {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'id' in obj &&
    'poolId' in obj &&
    'targetIds' in obj &&
    'resourceType' in obj &&
    'percentage' in obj &&
    'priority' in obj &&
    Array.isArray(obj.targetIds)
  );
}

/**
 * Type guard for PoolAllocationResult
 */
export function isPoolAllocationResult(obj: any): obj is PoolAllocationResult {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'poolId' in obj &&
    'resourceType' in obj &&
    'allocations' in obj &&
    'timestamp' in obj &&
    Array.isArray(obj.allocations)
  );
}

/**
 * Helper function to create a default distribution rule
 */
export function createDefaultDistributionRule(
  poolId: string,
  targetIds: string[],
  resourceType: ResourceType
): PoolDistributionRule {
  return {
    id: `rule-${poolId}-${resourceType}-${Date.now()}`,
    poolId,
    targetIds,
    resourceType,
    percentage: 100,
    priority: 1,
  };
}

/**
 * Helper function to calculate demand factor for a target
 */
export function calculateDemandFactor(currentAmount: number, capacity: number): number {
  if (capacity <= 0) {
    return 0;
  }
  const fillPercentage = (currentAmount / capacity) * 100;
  return Math.max(0, 100 - fillPercentage) / 100;
}

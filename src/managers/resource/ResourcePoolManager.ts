import {
  ResourceContainer,
  ResourcePool,
  ResourceState,
  ResourceType,
  createResourceState,
} from '../../types/resources/ResourceTypes';

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
  enabled?: boolean;
  sourceId?: string;
  amount?: number;
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
 * Resource Pool Manager
 * Manages resource pools, distribution, and allocation
 */
export class ResourcePoolManager {
  private pools: Map<string, ResourcePool>;
  private containers: Map<string, ResourceContainer>;
  private distributionRules: Map<string, PoolDistributionRule>;
  private resourceStates: Map<ResourceType, ResourceState>;
  private allocationHistory: PoolAllocationResult[];
  private allocationStrategy: PoolAllocationStrategy;
  private maxHistorySize: number;
  private lastDistribution: number;
  private distributionInterval: number;

  constructor(
    allocationStrategy: PoolAllocationStrategy = 'priority',
    distributionInterval = 5000,
    maxHistorySize = 100
  ) {
    this.pools = new Map();
    this.containers = new Map();
    this.distributionRules = new Map();
    this.resourceStates = new Map();
    this.allocationHistory = [];
    this.allocationStrategy = allocationStrategy;
    this.maxHistorySize = maxHistorySize;
    this.lastDistribution = 0;
    this.distributionInterval = distributionInterval;
  }

  /**
   * Update resource state
   */
  public updateResourceState(type: ResourceType, state: ResourceState): void {
    this.resourceStates.set(type, state);
  }

  /**
   * Register a resource pool
   */
  public registerPool(pool: ResourcePool): boolean {
    if (!pool) {
      console.error('Invalid resource pool:', pool);
      return false;
    }

    this.pools.set(pool.id, pool);
    return true;
  }

  /**
   * Unregister a resource pool
   */
  public unregisterPool(id: string): boolean {
    if (!this.pools.has(id)) {
      return false;
    }

    // Remove all distribution rules for this pool
    for (const [ruleId, rule] of Array.from(this.distributionRules.entries())) {
      if (rule.poolId === id) {
        this.distributionRules.delete(ruleId);
      }
    }

    this.pools.delete(id);
    return true;
  }

  /**
   * Register a container
   */
  public registerContainer(container: ResourceContainer): boolean {
    if (!container.id) {
      console.error('Invalid container:', container);
      return false;
    }

    this.containers.set(container.id, container);
    return true;
  }

  /**
   * Unregister a container
   */
  public unregisterContainer(id: string): boolean {
    if (!this.containers.has(id)) {
      return false;
    }

    this.containers.delete(id);
    return true;
  }

  /**
   * Register a distribution rule
   */
  public registerDistributionRule(rule: PoolDistributionRule): boolean {
    if (!rule.id || !rule.poolId || !rule.targetIds || rule.targetIds.length === 0) {
      console.error('Invalid distribution rule:', rule);
      return false;
    }

    // Verify pool exists
    if (!this.pools.has(rule.poolId)) {
      console.error(`Pool ${rule.poolId} does not exist`);
      return false;
    }

    // Verify targets exist
    for (const targetId of rule.targetIds) {
      if (!this.containers.has(targetId)) {
        console.error(`Target container ${targetId} does not exist`);
        return false;
      }
    }

    this.distributionRules.set(rule.id, rule);
    return true;
  }

  /**
   * Unregister a distribution rule
   */
  public unregisterDistributionRule(id: string): boolean {
    if (!this.distributionRules.has(id)) {
      return false;
    }

    this.distributionRules.delete(id);
    return true;
  }

  /**
   * Set allocation strategy
   */
  public setAllocationStrategy(strategy: PoolAllocationStrategy): void {
    this.allocationStrategy = strategy;
  }

  /**
   * Get allocation strategy
   */
  public getAllocationStrategy(): PoolAllocationStrategy {
    return this.allocationStrategy;
  }

  /**
   * Add resource to pool
   */
  public addToPool(poolId: string, type: ResourceType, amount: number): boolean {
    const pool = this.pools.get(poolId);
    if (!pool) {
      console.error(`Pool ${poolId} does not exist`);
      return false;
    }

    // Initialize resources map if it doesn't exist
    if (!pool.resources) {
      pool.resources = {
        [ResourceType.MINERALS]: 0,
        [ResourceType.ENERGY]: 0,
        [ResourceType.POPULATION]: 0,
        [ResourceType.RESEARCH]: 0,
        [ResourceType.FOOD]: 0,
        [ResourceType.WATER]: 0,
        [ResourceType.PLASMA]: 0,
        [ResourceType.GAS]: 0,
        [ResourceType.EXOTIC]: 0,
        [ResourceType.ORGANIC]: 0,
        [ResourceType.IRON]: 0,
        [ResourceType.COPPER]: 0,
        [ResourceType.TITANIUM]: 0,
        [ResourceType.URANIUM]: 0,
        [ResourceType.HELIUM]: 0,
        [ResourceType.DEUTERIUM]: 0,
        [ResourceType.ANTIMATTER]: 0,
        [ResourceType.DARK_MATTER]: 0,
        [ResourceType.EXOTIC_MATTER]: 0,
      };
    }

    // Add resource to pool
    const currentAmount = pool.resources[type] ?? 0;
    pool.resources[type] = currentAmount + amount;

    return true;
  }

  /**
   * Remove resource from pool
   */
  public removeFromPool(poolId: string, type: ResourceType, amount: number): boolean {
    const pool = this.pools.get(poolId);
    if (!pool || !pool.resources) {
      console.error(`Pool ${poolId} does not exist or has no resources`);
      return false;
    }

    const currentAmount = pool.resources[type] ?? 0;
    if (currentAmount < amount) {
      console.error(`Insufficient ${type} in pool ${poolId}`);
      return false;
    }

    pool.resources[type] = currentAmount - amount;
    return true;
  }

  /**
   * Transfer between pools
   */
  public transferBetweenPools(
    sourcePoolId: string,
    targetPoolId: string,
    type: ResourceType,
    amount: number
  ): boolean {
    // Remove from source pool
    if (!this.removeFromPool(sourcePoolId, type, amount)) {
      return false;
    }

    // Add to target pool
    if (!this.addToPool(targetPoolId, type, amount)) {
      // Rollback source pool removal
      this.addToPool(sourcePoolId, type, amount);
      return false;
    }

    return true;
  }

  /**
   * Distribute resources from pools to containers
   */
  public distributeResources(now = Date.now()): PoolAllocationResult[] {
    // Skip if not enough time has passed
    if (now - this.lastDistribution < this.distributionInterval) {
      return [];
    }

    this.lastDistribution = now;
    const results: PoolAllocationResult[] = [];

    // Sort rules by priority (high to low)
    const sortedRules = Array.from(this.distributionRules.values()).sort(
      (a, b) => b.priority - a.priority
    );

    // Process each rule
    for (const rule of sortedRules) {
      // Skip disabled rules
      if (rule.enabled === false) {
        continue;
      }

      const pool = this.pools.get(rule.poolId);
      if (!pool || !pool.resources) {
        continue;
      }

      const resourceAmount = pool.resources[rule.resourceType] ?? 0;
      if (resourceAmount <= 0) {
        continue;
      }

      // Check condition if provided
      if (rule.condition) {
        const resourceState = this.resourceStates.get(rule.resourceType);
        if (!resourceState || !rule.condition(resourceState)) {
          continue;
        }
      }

      // Calculate amount to distribute
      let amountToDistribute = resourceAmount * (rule.percentage / 100);

      // Apply min/max constraints
      if (rule.minAmount !== undefined && amountToDistribute < rule.minAmount) {
        amountToDistribute = Math.min(rule.minAmount, resourceAmount);
      }

      if (rule.maxAmount !== undefined && amountToDistribute > rule.maxAmount) {
        amountToDistribute = rule.maxAmount;
      }

      // Skip if amount is too small
      if (amountToDistribute <= 0) {
        continue;
      }

      // Allocate resources based on strategy
      const allocations = this.allocateResources(
        rule.targetIds,
        rule.resourceType,
        amountToDistribute
      );

      // Apply allocations
      let totalAllocated = 0;
      for (const allocation of allocations) {
        const container = this.containers.get(allocation.targetId);
        if (!container) {
          continue;
        }

        // Initialize resources map if it doesn't exist
        if (!container.resources) {
          container.resources = {
            [ResourceType.MINERALS]: createResourceState(ResourceType.MINERALS),
            [ResourceType.ENERGY]: createResourceState(ResourceType.ENERGY),
            [ResourceType.POPULATION]: createResourceState(ResourceType.POPULATION),
            [ResourceType.RESEARCH]: createResourceState(ResourceType.RESEARCH),
            [ResourceType.FOOD]: createResourceState(ResourceType.FOOD),
            [ResourceType.WATER]: createResourceState(ResourceType.WATER),
            [ResourceType.PLASMA]: createResourceState(ResourceType.PLASMA),
            [ResourceType.GAS]: createResourceState(ResourceType.GAS),
            [ResourceType.EXOTIC]: createResourceState(ResourceType.EXOTIC),
            [ResourceType.ORGANIC]: createResourceState(ResourceType.ORGANIC),
            [ResourceType.IRON]: createResourceState(ResourceType.IRON),
            [ResourceType.COPPER]: createResourceState(ResourceType.COPPER),
            [ResourceType.TITANIUM]: createResourceState(ResourceType.TITANIUM),
            [ResourceType.URANIUM]: createResourceState(ResourceType.URANIUM),
            [ResourceType.HELIUM]: createResourceState(ResourceType.HELIUM),
            [ResourceType.DEUTERIUM]: createResourceState(ResourceType.DEUTERIUM),
            [ResourceType.ANTIMATTER]: createResourceState(ResourceType.ANTIMATTER),
            [ResourceType.DARK_MATTER]: createResourceState(ResourceType.DARK_MATTER),
            [ResourceType.EXOTIC_MATTER]: createResourceState(ResourceType.EXOTIC_MATTER),
          };
        }

        // Add resource to container
        const resourceState =
          container.resources[rule.resourceType] || createResourceState(rule.resourceType);
        const updatedResourceState = {
          ...resourceState,
          current: resourceState.current + allocation.amount,
        };
        container.resources[rule.resourceType] = updatedResourceState;
        totalAllocated += allocation.amount;
      }

      // Remove allocated amount from pool
      if (totalAllocated > 0) {
        pool.resources[rule.resourceType] = resourceAmount - totalAllocated;

        // Record allocation
        const result: PoolAllocationResult = {
          poolId: rule.poolId,
          resourceType: rule.resourceType,
          allocations,
          timestamp: now,
        };

        results.push(result);
        this.allocationHistory.push(result);

        // Trim history if needed
        if (this.allocationHistory.length > this.maxHistorySize) {
          this.allocationHistory = this.allocationHistory.slice(-this.maxHistorySize);
        }
      }
    }

    return results;
  }

  /**
   * Allocate resources based on strategy
   */
  private allocateResources(
    targetIds: string[],
    resourceType: ResourceType,
    amount: number
  ): Array<{ targetId: string; amount: number; percentage: number }> {
    if (targetIds.length === 0 || amount <= 0) {
      return [];
    }

    switch (this.allocationStrategy) {
      case 'equal':
        return this.allocateEqual(targetIds, amount);
      case 'priority':
        return this.allocatePriority(targetIds, resourceType, amount);
      case 'demand-based':
        return this.allocateDemandBased(targetIds, resourceType, amount);
      case 'custom':
        return this.allocateCustom(targetIds, resourceType, amount);
      default:
        return this.allocateEqual(targetIds, amount);
    }
  }

  /**
   * Allocate resources equally
   */
  private allocateEqual(
    targetIds: string[],
    amount: number
  ): Array<{ targetId: string; amount: number; percentage: number }> {
    const equalAmount = amount / targetIds.length;
    const percentage = 100 / targetIds.length;

    return targetIds.map(targetId => ({
      targetId,
      amount: equalAmount,
      percentage,
    }));
  }

  /**
   * Allocate resources based on priority
   */
  private allocatePriority(
    targetIds: string[],
    resourceType: ResourceType,
    amount: number
  ): Array<{ targetId: string; amount: number; percentage: number }> {
    // Get containers with priority
    const containersWithPriority = targetIds
      .map(id => {
        const container = this.containers.get(id);

        // Check if container can accept this resource type
        if (container && 'acceptedTypes' in container) {
          const typedContainer = container as { acceptedTypes?: ResourceType[] };
          if (
            typedContainer.acceptedTypes &&
            !typedContainer.acceptedTypes.includes(resourceType)
          ) {
            console.warn(
              `[ResourcePoolManager] Container ${id} cannot accept resource type ${resourceType}`
            );
            return { id, priority: 0 }; // Zero priority means it won't receive unknown allocation
          }
        }

        return {
          id,
          priority:
            container && 'priority' in container ? (container as { priority: number }).priority : 1,
        };
      })
      .sort((a, b) => b.priority - a.priority);

    // Calculate total priority
    const totalPriority = containersWithPriority.reduce(
      (sum, container) => sum + container.priority,
      0
    );

    // Log allocation details
    console.warn(
      `[ResourcePoolManager] Allocating ${amount} units of ${resourceType} based on priority`
    );

    // Allocate based on priority
    return containersWithPriority.map(container => {
      const containerPercentage = (container.priority / totalPriority) * 100;
      const containerAmount = (container.priority / totalPriority) * amount;

      // Log individual container allocation
      if (containerAmount > 0) {
        console.warn(
          `[ResourcePoolManager] Allocated ${containerAmount.toFixed(2)} units of ${resourceType} to container ${container.id} (${containerPercentage.toFixed(2)}%)`
        );
      }

      return {
        targetId: container.id,
        amount: containerAmount,
        percentage: containerPercentage,
      };
    });
  }

  /**
   * Allocate resources based on demand
   */
  private allocateDemandBased(
    targetIds: string[],
    resourceType: ResourceType,
    amount: number
  ): Array<{ targetId: string; amount: number; percentage: number }> {
    // Calculate demand for each container
    const containerDemands = targetIds.map(id => {
      const container = this.containers.get(id);
      if (!container) {
        return { id, demand: 0 };
      }

      // Calculate demand based on capacity and current amount
      let demand = 0;
      if (container.capacity && container.resources) {
        const currentAmount =
          container.resources[resourceType] ?? createResourceState(resourceType);
        demand = Math.max(0, container.capacity - currentAmount.current);
      }

      return { id, demand };
    });

    // Calculate total demand
    const totalDemand = containerDemands.reduce((sum, container) => sum + container.demand, 0);

    // If no demand, allocate equally
    if (totalDemand <= 0) {
      return this.allocateEqual(targetIds, amount);
    }

    // Allocate based on demand
    return containerDemands.map(container => {
      const containerPercentage = (container.demand / totalDemand) * 100;
      const containerAmount = (container.demand / totalDemand) * amount;

      return {
        targetId: container.id,
        amount: containerAmount,
        percentage: containerPercentage,
      };
    });
  }

  /**
   * Allocate resources based on custom logic
   */
  private allocateCustom(
    targetIds: string[],
    resourceType: ResourceType,
    amount: number
  ): Array<{ targetId: string; amount: number; percentage: number }> {
    // This is a placeholder for custom allocation logic
    // In a real implementation, this would use more complex rules

    // For now, we'll use a combination of priority and demand
    const priorityAllocations = this.allocatePriority(targetIds, resourceType, amount);
    const demandAllocations = this.allocateDemandBased(targetIds, resourceType, amount);

    // Combine allocations (50% priority, 50% demand)
    return targetIds.map(id => {
      const priorityAllocation = priorityAllocations.find(a => a.targetId === id);
      const demandAllocation = demandAllocations.find(a => a.targetId === id);

      const combinedAmount =
        (priorityAllocation?.amount ?? 0) * 0.5 + (demandAllocation?.amount ?? 0) * 0.5;

      const combinedPercentage =
        (priorityAllocation?.percentage ?? 0) * 0.5 + (demandAllocation?.percentage ?? 0) * 0.5;

      return {
        targetId: id,
        amount: combinedAmount,
        percentage: combinedPercentage,
      };
    });
  }

  /**
   * Get pool by ID
   */
  public getPool(id: string): ResourcePool | undefined {
    return this.pools.get(id);
  }

  /**
   * Get all pools
   */
  public getAllPools(): ResourcePool[] {
    return Array.from(this.pools.values());
  }

  /**
   * Get pools by type
   */
  public getPoolsByType(type: ResourceType): ResourcePool[] {
    return Array.from(this.pools.values()).filter(pool => pool.resources[type] > 0);
  }

  /**
   * Get distribution rules by pool ID
   */
  public getDistributionRulesByPool(poolId: string): PoolDistributionRule[] {
    return Array.from(this.distributionRules.values()).filter(rule => rule.poolId === poolId);
  }

  /**
   * Get allocation history
   */
  public getAllocationHistory(): PoolAllocationResult[] {
    return [...this.allocationHistory];
  }

  /**
   * Get allocation history by pool ID
   */
  public getAllocationHistoryByPool(poolId: string): PoolAllocationResult[] {
    return this.allocationHistory.filter(result => result?.poolId === poolId);
  }

  /**
   * Get allocation history by resource type
   */
  public getAllocationHistoryByType(type: ResourceType): PoolAllocationResult[] {
    return this.allocationHistory.filter(result => result?.resourceType === type);
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.pools.clear();
    this.containers.clear();
    this.distributionRules.clear();
    this.resourceStates.clear();
    this.allocationHistory = [];
  }

  /**
   * Transfer resources directly between containers
   */
  public transferDirectly(
    sourceId: string,
    targetId: string,
    resourceType: ResourceType,
    amount: number
  ): boolean {
    const sourceContainer = this.containers.get(sourceId);
    const targetContainer = this.containers.get(targetId);

    if (!sourceContainer || !targetContainer) {
      console.error(`Source or target container not found: ${sourceId}, ${targetId}`);
      return false;
    }

    // Initialize resources maps if they don't exist
    if (!sourceContainer.resources) {
      sourceContainer.resources = {
        [ResourceType.MINERALS]: createResourceState(ResourceType.MINERALS),
        [ResourceType.ENERGY]: createResourceState(ResourceType.ENERGY),
        [ResourceType.POPULATION]: createResourceState(ResourceType.POPULATION),
        [ResourceType.RESEARCH]: createResourceState(ResourceType.RESEARCH),
        [ResourceType.FOOD]: createResourceState(ResourceType.FOOD),
        [ResourceType.WATER]: createResourceState(ResourceType.WATER),
        [ResourceType.PLASMA]: createResourceState(ResourceType.PLASMA),
        [ResourceType.GAS]: createResourceState(ResourceType.GAS),
        [ResourceType.EXOTIC]: createResourceState(ResourceType.EXOTIC),
        [ResourceType.ORGANIC]: createResourceState(ResourceType.ORGANIC),
        [ResourceType.IRON]: createResourceState(ResourceType.IRON),
        [ResourceType.COPPER]: createResourceState(ResourceType.COPPER),
        [ResourceType.TITANIUM]: createResourceState(ResourceType.TITANIUM),
        [ResourceType.URANIUM]: createResourceState(ResourceType.URANIUM),
        [ResourceType.HELIUM]: createResourceState(ResourceType.HELIUM),
        [ResourceType.DEUTERIUM]: createResourceState(ResourceType.DEUTERIUM),
        [ResourceType.ANTIMATTER]: createResourceState(ResourceType.ANTIMATTER),
        [ResourceType.DARK_MATTER]: createResourceState(ResourceType.DARK_MATTER),
        [ResourceType.EXOTIC_MATTER]: createResourceState(ResourceType.EXOTIC_MATTER),
      };
    }

    if (!targetContainer.resources) {
      targetContainer.resources = {
        [ResourceType.MINERALS]: createResourceState(ResourceType.MINERALS),
        [ResourceType.ENERGY]: createResourceState(ResourceType.ENERGY),
        [ResourceType.POPULATION]: createResourceState(ResourceType.POPULATION),
        [ResourceType.RESEARCH]: createResourceState(ResourceType.RESEARCH),
        [ResourceType.FOOD]: createResourceState(ResourceType.FOOD),
        [ResourceType.WATER]: createResourceState(ResourceType.WATER),
        [ResourceType.PLASMA]: createResourceState(ResourceType.PLASMA),
        [ResourceType.GAS]: createResourceState(ResourceType.GAS),
        [ResourceType.EXOTIC]: createResourceState(ResourceType.EXOTIC),
        [ResourceType.ORGANIC]: createResourceState(ResourceType.ORGANIC),
        [ResourceType.IRON]: createResourceState(ResourceType.IRON),
        [ResourceType.COPPER]: createResourceState(ResourceType.COPPER),
        [ResourceType.TITANIUM]: createResourceState(ResourceType.TITANIUM),
        [ResourceType.URANIUM]: createResourceState(ResourceType.URANIUM),
        [ResourceType.HELIUM]: createResourceState(ResourceType.HELIUM),
        [ResourceType.DEUTERIUM]: createResourceState(ResourceType.DEUTERIUM),
        [ResourceType.ANTIMATTER]: createResourceState(ResourceType.ANTIMATTER),
        [ResourceType.DARK_MATTER]: createResourceState(ResourceType.DARK_MATTER),
        [ResourceType.EXOTIC_MATTER]: createResourceState(ResourceType.EXOTIC_MATTER),
      };
    }

    // Check if source has enough resources
    const sourceAmount =
      sourceContainer.resources[resourceType] ?? createResourceState(resourceType);
    if (sourceAmount.current < amount) {
      console.error(`Insufficient ${resourceType} in source container ${sourceId}`);
      return false;
    }

    // Transfer resources
    const targetAmount =
      targetContainer.resources[resourceType] ?? createResourceState(resourceType);

    // Update source and target containers
    sourceContainer.resources[resourceType] = {
      ...sourceAmount,
      current: sourceAmount.current - amount,
    };
    targetContainer.resources[resourceType] = {
      ...targetAmount,
      current: targetAmount.current + amount,
    };

    return true;
  }
}

import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import { ResourceState, ResourceTransfer, ResourceType } from '../../types/resources/ResourceTypes';
import { ResourceSystem, ResourceSystemConfig } from '../ResourceSystem';

/**
 * Storage container configuration
 */
export interface StorageContainerConfig {
  id: string;
  name: string;
  type: 'container' | 'pool' | 'storage';
  capacity: number;
  resourceTypes: ResourceType[];
  priority: number;
  location?: string;
  efficiency?: number;
  accessSpeed?: number;
  upgradeLevel?: number;
  maxUpgradeLevel?: number;
}

/**
 * Storage container state
 */
export interface StorageContainerState {
  config: StorageContainerConfig;
  resources: Map<ResourceType, ResourceState>;
  totalStored: number;
  lastUpdated: number;
}

/**
 * Storage allocation
 */
export interface StorageAllocation {
  containerId: string;
  resourceType: ResourceType;
  amount: number;
  percentage: number;
}

/**
 * ResourceStorageSubsystem
 * 
 * Manages resource storage containers, pools, and allocation strategies
 */
export class ResourceStorageSubsystem {
  private containers: Map<string, StorageContainerState>;
  private resourcePriorities: Map<ResourceType, number>;
  private transferHistory: ResourceTransfer[];
  private parentSystem: ResourceSystem;
  private config: ResourceSystemConfig;
  private isInitialized = false;

  constructor(parentSystem: ResourceSystem, config: ResourceSystemConfig) {
    this.parentSystem = parentSystem;
    this.config = config;
    this.containers = new Map();
    this.resourcePriorities = new Map();
    this.transferHistory = [];
    
    // Set default resource priorities
    this.setDefaultResourcePriorities();
  }

  /**
   * Set default resource priorities
   */
  private setDefaultResourcePriorities(): void {
    // Higher number = higher priority
    this.resourcePriorities.set('energy', 10);
    this.resourcePriorities.set('minerals', 8);
    this.resourcePriorities.set('population', 9);
    this.resourcePriorities.set('research', 10);
    this.resourcePriorities.set('plasma', 10);
    this.resourcePriorities.set('gas', 7);
    this.resourcePriorities.set('exotic', 6);
  }

  /**
   * Initialize the subsystem
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Additional initialization logic can go here
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ResourceStorageSubsystem:', error);
      throw error;
    }
  }

  /**
   * Dispose of the subsystem
   */
  public async dispose(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Cleanup resources
      this.containers.clear();
      this.resourcePriorities.clear();
      this.transferHistory = [];

      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to dispose ResourceStorageSubsystem:', error);
      throw error;
    }
  }

  /**
   * Register a storage container
   */
  public registerContainer(config: StorageContainerConfig): boolean {
    if (!config.id || !config.resourceTypes || config.resourceTypes.length === 0) {
      console.error('Invalid storage container configuration:', config);
      return false;
    }

    // Initialize resource states
    const resources = new Map<ResourceType, ResourceState>();

    for (const type of config.resourceTypes) {
      resources.set(type, {
        current: 0,
        min: 0,
        max: config.capacity / config.resourceTypes.length, // Divide capacity equally by default
        production: 0,
        consumption: 0,
      });
    }

    this.containers.set(config.id, {
      config,
      resources,
      totalStored: 0,
      lastUpdated: Date.now(),
    });

    return true;
  }

  /**
   * Unregister a storage container
   */
  public unregisterContainer(id: string): boolean {
    if (!this.containers.has(id)) {
      return false;
    }

    this.containers.delete(id);
    return true;
  }

  /**
   * Get a storage container
   */
  public getContainer(id: string): StorageContainerState | undefined {
    return this.containers.get(id);
  }

  /**
   * Get all storage containers
   */
  public getAllContainers(): StorageContainerState[] {
    return Array.from(this.containers.values());
  }

  /**
   * Get containers by resource type
   */
  public getContainersByResourceType(type: ResourceType): StorageContainerState[] {
    return Array.from(this.containers.values()).filter(container => 
      container.resources.has(type)
    );
  }

  /**
   * Store resource in a specific container
   */
  public storeResource(containerId: string, type: ResourceType, amount: number): number {
    const container = this.containers.get(containerId);
    if (!container || !container.resources.has(type) || amount <= 0) {
      return 0;
    }

    const resourceState = container.resources.get(type)!;
    const availableSpace = resourceState.max - resourceState.current;

    if (availableSpace <= 0) {
      // Emit overflow event
      eventSystem.publish({
        type: 'RESOURCE_STORAGE_OVERFLOW',
        resourceType: type,
        amount,
        containerId,
        timestamp: Date.now(),
      });
      return 0;
    }

    const amountToStore = Math.min(amount, availableSpace);

    resourceState.current += amountToStore;
    container.totalStored += amountToStore;
    container.lastUpdated = Date.now();

    // Update system resource state
    const systemState = this.parentSystem.getResourceState(type);
    if (systemState) {
      systemState.current += amountToStore;
      this.parentSystem.updateResourceState(type, systemState);
    }

    // Record transfer
    this.recordTransfer({
      type,
      source: 'external',
      target: containerId,
      amount: amountToStore,
      timestamp: Date.now(),
    });

    return amountToStore;
  }

  /**
   * Retrieve resource from a specific container
   */
  public retrieveResource(containerId: string, type: ResourceType, amount: number): number {
    const container = this.containers.get(containerId);
    if (!container || !container.resources.has(type) || amount <= 0) {
      return 0;
    }

    const resourceState = container.resources.get(type)!;

    if (resourceState.current <= 0) {
      return 0;
    }

    const amountToRetrieve = Math.min(amount, resourceState.current);

    resourceState.current -= amountToRetrieve;
    container.totalStored -= amountToRetrieve;
    container.lastUpdated = Date.now();

    // Update system resource state
    const systemState = this.parentSystem.getResourceState(type);
    if (systemState) {
      systemState.current -= amountToRetrieve;
      this.parentSystem.updateResourceState(type, systemState);
    }

    // Record transfer
    this.recordTransfer({
      type,
      source: containerId,
      target: 'external',
      amount: amountToRetrieve,
      timestamp: Date.now(),
    });

    return amountToRetrieve;
  }

  /**
   * Store resource in the best available container
   */
  public storeResourceOptimal(type: ResourceType, amount: number): number {
    if (amount <= 0) {
      return 0;
    }

    // Get all containers that can store this resource type
    const availableContainers = this.getContainersByResourceType(type);

    if (availableContainers.length === 0) {
      return 0;
    }

    // Calculate scores for each container based on the allocation strategy
    const containerScores = this.calculateContainerScores(availableContainers, type);

    // Sort containers by score (highest first)
    const sortedContainers = [...containerScores].sort((a, b) => b.score - a.score);

    let remainingAmount = amount;
    let totalStored = 0;

    // Try to store in containers by score order
    for (const { containerId } of sortedContainers) {
      if (remainingAmount <= 0) {
        break;
      }

      const amountStored = this.storeResource(containerId, type, remainingAmount);
      totalStored += amountStored;
      remainingAmount -= amountStored;
    }

    // Handle overflow if needed
    if (remainingAmount > 0 && this.config.overflowPolicy !== 'reject') {
      // Emit overflow event
      eventSystem.publish({
        type: 'RESOURCE_STORAGE_OVERFLOW',
        resourceType: type,
        amount: remainingAmount,
        timestamp: Date.now(),
      });
    }

    // Check if rebalancing is needed
    if (this.config.autoRebalance) {
      this.checkAndRebalance(type);
    }

    return totalStored;
  }

  /**
   * Retrieve resource from the best available container
   */
  public retrieveResourceOptimal(type: ResourceType, amount: number): number {
    if (amount <= 0) {
      return 0;
    }

    // Get all containers that store this resource type
    const availableContainers = this.getContainersByResourceType(type);

    if (availableContainers.length === 0) {
      return 0;
    }

    // Calculate scores for each container based on the allocation strategy
    // For retrieval, we want to prioritize containers with higher fill percentage
    const containerScores = this.calculateContainerScores(availableContainers, type, true);

    // Sort containers by score (highest first)
    const sortedContainers = [...containerScores].sort((a, b) => b.score - a.score);

    let remainingAmount = amount;
    let totalRetrieved = 0;

    // Try to retrieve from containers by score order
    for (const { containerId } of sortedContainers) {
      if (remainingAmount <= 0) {
        break;
      }

      const amountRetrieved = this.retrieveResource(containerId, type, remainingAmount);
      totalRetrieved += amountRetrieved;
      remainingAmount -= amountRetrieved;
    }

    return totalRetrieved;
  }

  /**
   * Calculate container scores for allocation
   */
  private calculateContainerScores(
    containers: StorageContainerState[],
    resourceType: ResourceType,
    forRetrieval = false
  ): Array<{ containerId: string; score: number }> {
    const weights = {
      containerPriority: 0.4,
      resourcePriority: 0.4,
      fillPercentage: 0.2,
    };
    
    const resourcePriorityValue = this.resourcePriorities.get(resourceType) || 5;

    return containers.map(container => {
      const resourceState = container.resources.get(resourceType)!;
      const fillRatio = resourceState.current / resourceState.max;

      // For storage, we prefer containers with lower fill percentage
      // For retrieval, we prefer containers with higher fill percentage
      const fillScore = forRetrieval ? fillRatio : 1 - fillRatio;

      // Calculate weighted score
      const score =
        container.config.priority * weights.containerPriority +
        resourcePriorityValue * weights.resourcePriority +
        fillScore * weights.fillPercentage;

      return {
        containerId: container.config.id,
        score,
      };
    });
  }

  /**
   * Redistribute overflow by expanding container capacity
   */
  public redistributeOverflow(type: ResourceType, amount: number, sourceId?: string): number {
    // Find containers that can store this resource type
    const relevantContainers = this.getContainersByResourceType(type);

    if (relevantContainers.length === 0) {
      return 0;
    }

    // If sourceId is provided, filter out that container
    const eligibleContainers = sourceId 
      ? relevantContainers.filter(c => c.config.id !== sourceId)
      : relevantContainers;

    if (eligibleContainers.length === 0) {
      // Sort by upgrade potential (containers with lower upgrade level first)
      const upgradableContainers = relevantContainers
        .filter(
          container =>
            container.config.upgradeLevel !== undefined &&
            container.config.maxUpgradeLevel !== undefined &&
            container.config.upgradeLevel < container.config.maxUpgradeLevel
        )
        .sort((a, b) => (a.config.upgradeLevel || 0) - (b.config.upgradeLevel || 0));

      if (upgradableContainers.length === 0) {
        return 0;
      }

      // Upgrade the first container
      const containerToUpgrade = upgradableContainers[0];
      
      // For each resource type in the container
      for (const [resType, resourceState] of containerToUpgrade.resources.entries()) {
        // Increase capacity by 20%
        const capacityIncrease = resourceState.max * 0.2;
        resourceState.max += capacityIncrease;
      }

      // Increment upgrade level
      if (containerToUpgrade.config.upgradeLevel !== undefined) {
        containerToUpgrade.config.upgradeLevel += 1;
      }

      // Try to store again if it's the target resource type
      if (sourceId) {
        return this.storeResource(containerToUpgrade.config.id, type, amount);
      } else {
        return this.storeResourceOptimal(type, amount);
      }
    } else {
      // Distribute among eligible containers
      let remainingAmount = amount;
      let totalStored = 0;

      // Calculate available space in all eligible containers
      for (const container of eligibleContainers) {
        if (remainingAmount <= 0) break;

        const resourceState = container.resources.get(type)!;
        const availableSpace = resourceState.max - resourceState.current;
        
        if (availableSpace <= 0) continue;

        const amountToStore = Math.min(remainingAmount, availableSpace);
        const stored = this.storeResource(container.config.id, type, amountToStore);
        
        totalStored += stored;
        remainingAmount -= stored;
      }

      return totalStored;
    }
  }

  /**
   * Check if rebalancing is needed and perform it
   */
  private checkAndRebalance(type: ResourceType): void {
    const containers = this.getContainersByResourceType(type);

    if (containers.length <= 1) {
      return;
    }

    // Calculate fill ratios
    const fillRatios = containers.map(container => {
      const resourceState = container.resources.get(type)!;
      return {
        id: container.config.id,
        fillRatio: resourceState.current / resourceState.max,
      };
    });

    // Find min and max fill ratios
    const minFill = Math.min(...fillRatios.map(r => r.fillRatio));
    const maxFill = Math.max(...fillRatios.map(r => r.fillRatio));

    // Check if imbalance exceeds threshold (default 0.2 or 20%)
    const threshold = 0.2;
    if (maxFill - minFill > threshold) {
      this.rebalanceContainers(type, containers);
    }
  }

  /**
   * Rebalance resources between containers
   */
  private rebalanceContainers(type: ResourceType, containers: StorageContainerState[]): void {
    // Calculate target fill ratio (average)
    let totalCurrent = 0;
    let totalMax = 0;

    for (const container of containers) {
      const resourceState = container.resources.get(type)!;
      totalCurrent += resourceState.current;
      totalMax += resourceState.max;
    }

    const targetFillRatio = totalCurrent / totalMax;

    // Calculate transfers needed
    for (const container of containers) {
      const resourceState = container.resources.get(type)!;
      const currentFillRatio = resourceState.current / resourceState.max;

      if (Math.abs(currentFillRatio - targetFillRatio) < 0.05) {
        // Close enough, skip
        continue;
      }

      const targetAmount = resourceState.max * targetFillRatio;
      const difference = targetAmount - resourceState.current;

      if (difference > 0) {
        // Need to add resources
        // Find container with excess
        const sourceContainer = containers.find(c => {
          const rs = c.resources.get(type)!;
          return rs.current / rs.max > targetFillRatio + 0.05;
        });

        if (sourceContainer) {
          const sourceState = sourceContainer.resources.get(type)!;
          const availableToTransfer = sourceState.current - sourceState.max * targetFillRatio;
          const transferAmount = Math.min(difference, availableToTransfer);

          // Transfer resources
          this.transferBetweenContainers(
            sourceContainer.config.id,
            container.config.id,
            type,
            transferAmount
          );
        }
      }
    }
  }

  /**
   * Transfer resources between containers
   */
  public transferBetweenContainers(
    sourceId: string,
    targetId: string,
    type: ResourceType,
    amount: number
  ): number {
    if (amount <= 0 || sourceId === targetId) {
      return 0;
    }

    // Retrieve from source
    const retrievedAmount = this.retrieveResource(sourceId, type, amount);

    if (retrievedAmount <= 0) {
      return 0;
    }

    // Store in target
    const storedAmount = this.storeResource(targetId, type, retrievedAmount);

    // If not all was stored, return remainder to source
    if (storedAmount < retrievedAmount) {
      const remainder = retrievedAmount - storedAmount;
      this.storeResource(sourceId, type, remainder);
    }

    // Record transfer
    this.recordTransfer({
      type,
      source: sourceId,
      target: targetId,
      amount: storedAmount,
      timestamp: Date.now(),
    });

    return storedAmount;
  }

  /**
   * Record a transfer in history
   */
  private recordTransfer(transfer: ResourceTransfer): void {
    this.transferHistory.push(transfer);

    // Trim history if needed
    if (this.transferHistory.length > this.config.maxHistorySize) {
      this.transferHistory = this.transferHistory.slice(-this.config.maxHistorySize);
    }
  }

  /**
   * Get transfer history
   */
  public getTransferHistory(): ResourceTransfer[] {
    return [...this.transferHistory];
  }

  /**
   * Get total stored amount of a resource type
   */
  public getTotalStored(type: ResourceType): number {
    let total = 0;

    for (const container of this.containers.values()) {
      const resourceState = container.resources.get(type);
      if (resourceState) {
        total += resourceState.current;
      }
    }

    return total;
  }

  /**
   * Get total capacity for a resource type
   */
  public getTotalCapacity(type: ResourceType): number {
    let total = 0;

    for (const container of this.containers.values()) {
      const resourceState = container.resources.get(type);
      if (resourceState) {
        total += resourceState.max;
      }
    }

    return total;
  }

  /**
   * Set resource priority
   */
  public setResourcePriority(type: ResourceType, priority: number): void {
    this.resourcePriorities.set(type, priority);
  }

  /**
   * Get resource priority
   */
  public getResourcePriority(type: ResourceType): number {
    return this.resourcePriorities.get(type) || 5;
  }

  /**
   * Update container configuration
   */
  public updateContainerConfig(id: string, config: Partial<StorageContainerConfig>): boolean {
    const container = this.containers.get(id);
    if (!container) {
      return false;
    }

    // Update config
    container.config = {
      ...container.config,
      ...config,
    };

    return true;
  }
}
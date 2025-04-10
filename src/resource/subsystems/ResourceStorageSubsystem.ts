import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';
import {
    ResourceType,
    ResourceTypeString,
    ResourceState as StringResourceState,
    ResourceTransfer as StringResourceTransfer,
} from '../../types/resources/ResourceTypes';
import { ensureStringResourceType } from '../../utils/resources/ResourceTypeConverter';
import { ResourceSystem, ResourceSystemConfig } from '../ResourceSystem';

/**
 * Safe and forceful conversion to enum ResourceType
 * This works around TypeScript's strict type checking for the enum values
 */
function forceToEnumResourceType(type: string): ResourceType {
  // Cast through unknown to bypass TypeScript's type checking
  return type as unknown as ResourceType;
}

/**
 * Helper method to safely get resource state from parent system
 */
function getParentResourceState(
  parentSystem: ResourceSystem,
  stringType: ResourceTypeString
): StringResourceState | undefined {
  // The parentSystem.getResourceState expects ResourceType enum
  // Here we use forceToEnumResourceType to ensure type compatibility
  return parentSystem.getResourceState(forceToEnumResourceType(stringType));
}

/**
 * Storage container configuration
 */
export interface StorageContainerConfig {
  id: string;
  name: string;
  type: 'container' | 'pool' | 'storage';
  capacity: number;
  resourceTypes: ResourceTypeString[];
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
  resources: Map<ResourceTypeString, StringResourceState>;
  totalStored: number;
  lastUpdated: number;
}

/**
 * Storage allocation
 */
export interface StorageAllocation {
  containerId: string;
  resourceType: ResourceTypeString;
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
  private resourcePriorities: Map<ResourceTypeString, number>;
  private transferHistory: StringResourceTransfer[];
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
    this.resourcePriorities.set(ResourceType.ENERGY as ResourceTypeString, 10);
    this.resourcePriorities.set(ResourceType.MINERALS as ResourceTypeString, 8);
    this.resourcePriorities.set(ResourceType.POPULATION as ResourceTypeString, 9);
    this.resourcePriorities.set(ResourceType.RESEARCH as ResourceTypeString, 10);
    this.resourcePriorities.set(ResourceType.PLASMA as ResourceTypeString, 10);
    this.resourcePriorities.set(ResourceType.GAS as ResourceTypeString, 7);
    this.resourcePriorities.set(ResourceType.EXOTIC as ResourceTypeString, 6);
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
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Failed to initialize ResourceStorageSubsystem'),
        ErrorType.INITIALIZATION,
        ErrorSeverity.CRITICAL,
        { componentName: 'ResourceStorageSubsystem', action: 'initialize' }
      );
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
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Failed to dispose ResourceStorageSubsystem'),
        ErrorType.RUNTIME,
        ErrorSeverity.HIGH,
        { componentName: 'ResourceStorageSubsystem', action: 'dispose' }
      );
      throw error;
    }
  }

  /**
   * Register a storage container
   */
  public registerContainer(config: StorageContainerConfig): boolean {
    if (!config.id || !config.resourceTypes || config.resourceTypes.length === 0) {
      errorLoggingService.logError(
        new Error(`Invalid storage container configuration: ${JSON.stringify(config)}`),
        ErrorType.CONFIGURATION,
        ErrorSeverity.MEDIUM,
        { componentName: 'ResourceStorageSubsystem', action: 'registerContainer' }
      );
      return false;
    }

    // Initialize resource states
    const resources = new Map<ResourceTypeString, StringResourceState>();

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
  public getContainersByResourceType(type: ResourceTypeString): StorageContainerState[] {
    return Array.from(this.containers.values()).filter(container => container.resources.has(type));
  }

  /**
   * Store resource in a specific container
   */
  public storeResource(
    containerId: string,
    type: ResourceTypeString | ResourceType,
    amount: number
  ): number {
    // Convert to string resource type for internal use
    const stringType = ensureStringResourceType(type);

    const container = this.containers.get(containerId);
    if (!container || amount <= 0) {
      return 0;
    }

    // Check if container supports this resource type
    if (!container.config.resourceTypes.includes(stringType)) {
      console.warn(`Container ${containerId} does not support resource type ${stringType}`);
      return 0;
    }

    // Initialize resource state if it doesn't exist
    if (!container.resources.has(stringType)) {
      container.resources.set(stringType, {
        current: 0,
        max: container.config.capacity,
        min: 0,
        production: 0,
        consumption: 0,
      });
    }

    const resourceState = container.resources.get(stringType)!;
    const availableSpace = resourceState.max - resourceState.current;

    if (availableSpace <= 0) {
      // Handle overflow based on policy
      if (this.config.overflowPolicy === 'redistribute') {
        return this.redistributeResource(stringType, amount, containerId);
      }

      // Publish overflow event
      eventSystem.publish({
        type: 'RESOURCE_STORAGE_OVERFLOW',
        resourceType: forceToEnumResourceType(stringType),
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

    // Update system-wide resource state if necessary
    const systemState = getParentResourceState(this.parentSystem, stringType);
    if (systemState) {
      systemState.current += amountToStore;
      this.parentSystem.updateResourceState(forceToEnumResourceType(stringType), systemState);
    }

    // Record transfer
    this.recordTransfer({
      type: forceToEnumResourceType(stringType),
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
  public retrieveResource(
    containerId: string,
    type: ResourceTypeString | ResourceType,
    amount: number
  ): number {
    // Convert to string resource type for internal use
    const stringType = ensureStringResourceType(type);

    const container = this.containers.get(containerId);
    if (!container || !container.resources.has(stringType) || amount <= 0) {
      return 0;
    }

    const resourceState = container.resources.get(stringType)!;

    if (resourceState.current <= 0) {
      return 0;
    }

    const amountToRetrieve = Math.min(amount, resourceState.current);

    resourceState.current -= amountToRetrieve;
    container.totalStored -= amountToRetrieve;
    container.lastUpdated = Date.now();

    // Check if the resource state exists in the system
    const systemState = getParentResourceState(this.parentSystem, stringType);
    if (systemState) {
      systemState.current -= amountToRetrieve;
      this.parentSystem.updateResourceState(forceToEnumResourceType(stringType), systemState);
    }

    // Record transfer
    this.recordTransfer({
      type: forceToEnumResourceType(stringType),
      source: containerId,
      target: 'external',
      amount: amountToRetrieve,
      timestamp: Date.now(),
    });

    return amountToRetrieve;
  }

  /**
   * Redistribute resource to other containers when primary is full
   */
  private redistributeResource(
    type: ResourceTypeString,
    amount: number,
    excludeContainerId: string
  ): number {
    let totalStored = 0;
    const availableContainers = Array.from(this.containers.values())
      .filter(
        container =>
          container.config.id !== excludeContainerId &&
          container.config.resourceTypes.includes(type)
      )
      .sort((a, b) => b.config.priority - a.config.priority);

    for (const container of availableContainers) {
      if (amount <= 0) {
        break;
      }

      const stored = this.storeResource(container.config.id, type, amount);
      totalStored += stored;
      amount -= stored;
    }

    return totalStored;
  }

  /**
   * Store resource in the best available container
   */
  public storeResourceOptimal(type: ResourceTypeString | ResourceType, amount: number): number {
    if (amount <= 0) {
      return 0;
    }

    // Get all containers that can store this resource type
    const availableContainers = this.getContainersByResourceType(type as ResourceTypeString);

    if (availableContainers.length === 0) {
      return 0;
    }

    // Calculate scores for each container based on the allocation strategy
    const containerScores = this.calculateContainerScores(
      availableContainers,
      type as ResourceTypeString,
      true
    );

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
      this.checkAndRebalance(type as ResourceTypeString);
    }

    return totalStored;
  }

  /**
   * Retrieve resource from the best available container
   */
  public retrieveResourceOptimal(type: ResourceTypeString | ResourceType, amount: number): number {
    if (amount <= 0) {
      return 0;
    }

    // Get all containers that store this resource type
    const availableContainers = this.getContainersByResourceType(type as ResourceTypeString);

    if (availableContainers.length === 0) {
      return 0;
    }

    // Calculate scores for each container based on the allocation strategy
    // For retrieval, we want to prioritize containers with higher fill percentage
    const containerScores = this.calculateContainerScores(
      availableContainers,
      type as ResourceTypeString,
      true
    );

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
    resourceType: ResourceTypeString,
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
  public redistributeOverflow(
    type: ResourceTypeString | ResourceType,
    amount: number,
    sourceId?: string
  ): number {
    // Find containers that can store this resource type
    const relevantContainers = this.getContainersByResourceType(type as ResourceTypeString);

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
        .sort((a, b) => (a.config.upgradeLevel ?? 0) - (b.config.upgradeLevel ?? 0));

      if (upgradableContainers.length === 0) {
        return 0;
      }

      // Upgrade the first container
      const containerToUpgrade = upgradableContainers[0];

      // For each resource type in the container
      for (const [_resType, resourceState] of containerToUpgrade.resources.entries()) {
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
        if (remainingAmount <= 0) {
          break;
        }

        const resourceState = container.resources.get(type as ResourceTypeString)!;
        const availableSpace = resourceState.max - resourceState.current;

        if (availableSpace <= 0) {
          continue;
        }

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
  private checkAndRebalance(type: ResourceTypeString): void {
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
  private rebalanceContainers(type: ResourceTypeString, containers: StorageContainerState[]): void {
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
    type: ResourceTypeString | ResourceType,
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
      type: forceToEnumResourceType(type as ResourceTypeString),
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
  private recordTransfer(transfer: StringResourceTransfer): void {
    // Limit history size
    if (this.transferHistory.length >= this.config.maxHistorySize) {
      this.transferHistory.shift();
    }

    this.transferHistory.push(transfer);

    // Publish transfer event
    eventSystem.publish({
      type: 'RESOURCE_TRANSFER',
      resourceType: transfer.type,
      amount: transfer.amount,
      source: transfer.source,
      target: transfer.target,
      timestamp: transfer.timestamp,
    });
  }

  /**
   * Get transfer history
   */
  public getTransferHistory(): StringResourceTransfer[] {
    return [...this.transferHistory];
  }

  /**
   * Get total stored amount of a resource type
   */
  public getTotalStored(type: ResourceTypeString | ResourceType): number {
    let total = 0;

    for (const container of this.containers.values()) {
      const resourceState = container.resources.get(type as ResourceTypeString);
      if (resourceState) {
        total += resourceState.current;
      }
    }

    return total;
  }

  /**
   * Get total capacity for a resource type
   */
  public getTotalCapacity(type: ResourceTypeString | ResourceType): number {
    let total = 0;

    for (const container of this.containers.values()) {
      const resourceState = container.resources.get(type as ResourceTypeString);
      if (resourceState) {
        total += resourceState.max;
      }
    }

    return total;
  }

  /**
   * Set resource priority
   */
  public setResourcePriority(type: ResourceTypeString | ResourceType, priority: number): void {
    // Ensure priority is between 0 and 10
    const constrainedPriority = Math.max(0, Math.min(10, priority));
    const stringType = ensureStringResourceType(type);
    this.resourcePriorities.set(stringType, constrainedPriority);
  }

  /**
   * Get resource priority
   */
  public getResourcePriority(type: ResourceTypeString | ResourceType): number {
    const stringType = ensureStringResourceType(type);
    return this.resourcePriorities.get(stringType) || 5;
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

  /**
   * Get resource state for a specific container and resource type
   */
  public getContainerResourceState(
    containerId: string,
    type: ResourceTypeString | ResourceType
  ): StringResourceState | null {
    // Convert to string resource type for internal use
    const stringType = ensureStringResourceType(type);

    const container = this.containers.get(containerId);
    if (!container || !container.resources.has(stringType)) {
      return null;
    }

    return { ...container.resources.get(stringType)! };
  }

  /**
   * Get all resource states for a specific container
   */
  public getContainerResourceStates(
    containerId: string
  ): Map<ResourceTypeString, StringResourceState> | null {
    const container = this.containers.get(containerId);
    if (!container) {
      return null;
    }

    // Create a copy of the resource states
    const resourceStates = new Map<ResourceTypeString, StringResourceState>();
    for (const [type, state] of container.resources.entries()) {
      resourceStates.set(type, { ...state });
    }

    return resourceStates;
  }

  /**
   * Get all containers that store a specific resource type
   */
  public getContainersForResourceType(
    type: ResourceTypeString | ResourceType
  ): StorageContainerState[] {
    // Convert to string resource type for internal use
    const stringType = ensureStringResourceType(type);

    return Array.from(this.containers.values()).filter(container =>
      container.config.resourceTypes.includes(stringType)
    );
  }

  /**
   * Get total stored amount of a specific resource type across all containers
   */
  public getTotalStoredAmount(type: ResourceTypeString | ResourceType): number {
    // Convert to string resource type for internal use
    const stringType = ensureStringResourceType(type);

    let total = 0;
    for (const container of this.containers.values()) {
      const resourceState = container.resources.get(stringType);
      if (resourceState) {
        total += resourceState.current;
      }
    }
    return total;
  }

  /**
   * Get total storage capacity for a specific resource type across all containers
   */
  public getTotalStorageCapacity(type: ResourceTypeString | ResourceType): number {
    // Convert to string resource type for internal use
    const stringType = ensureStringResourceType(type);

    let total = 0;
    for (const container of this.containers.values()) {
      if (container.config.resourceTypes.includes(stringType)) {
        total += container.config.capacity;
      }
    }
    return total;
  }

  /**
   * Get available storage space for a specific resource type across all containers
   */
  public getAvailableStorageSpace(type: ResourceTypeString | ResourceType): number {
    // Convert to string resource type for internal use
    const stringType = ensureStringResourceType(type);

    let total = 0;
    for (const container of this.containers.values()) {
      if (container.config.resourceTypes.includes(stringType)) {
        const resourceState = container.resources.get(stringType);
        if (resourceState) {
          total += resourceState.max - resourceState.current;
        } else {
          total += container.config.capacity;
        }
      }
    }
    return total;
  }
}

import { moduleEventBus } from '../modules/ModuleEvents';
import {
  ResourceType,
  ResourceState,
  ResourceTransfer,
  ResourceManagerConfig,
  ResourceThreshold,
  ResourceProduction,
  ResourceConsumption,
  ResourceFlow,
} from '../../types/resources/ResourceTypes';

/**
 * Manages game resources
 */
export class ResourceManager {
  private resources: Map<ResourceType, ResourceState>;
  private transfers: ResourceTransfer[];
  private maxTransferHistory: number;

  constructor(maxTransferHistory = 1000) {
    this.resources = new Map();
    this.transfers = [];
    this.maxTransferHistory = maxTransferHistory;

    // Initialize default resources
    this.initializeResource('minerals');
    this.initializeResource('energy');
    this.initializeResource('population');
    this.initializeResource('research');
    this.initializeResource('plasma');
    this.initializeResource('gas');
    this.initializeResource('exotic');
  }

  /**
   * Initializes a resource type
   */
  private initializeResource(type: ResourceType): void {
    this.resources.set(type, {
      current: 0,
      max: 1000,
      min: 0,
      production: 0,
      consumption: 0,
    });
  }

  /**
   * Gets the current amount of a resource
   */
  getResourceAmount(type: ResourceType): number {
    return this.resources.get(type)?.current || 0;
  }

  /**
   * Gets the full state of a resource
   */
  getResourceState(type: ResourceType): ResourceState | undefined {
    return this.resources.get(type);
  }

  /**
   * Updates a resource amount
   */
  setResourceAmount(type: ResourceType, amount: number): void {
    const state = this.resources.get(type);
    if (!state) {
      return;
    }

    const oldAmount = state.current;
    state.current = Math.max(state.min, Math.min(amount, state.max));

    // Emit resource event
    moduleEventBus.emit({
      type: state.current > oldAmount ? 'RESOURCE_PRODUCED' : 'RESOURCE_CONSUMED',
      moduleId: 'resource-manager',
      moduleType: 'radar', // Default type
      timestamp: Date.now(),
      data: {
        resourceType: type,
        oldAmount,
        newAmount: state.current,
        delta: state.current - oldAmount,
      },
    });
  }

  /**
   * Adds to a resource amount
   */
  addResource(type: ResourceType, amount: number): void {
    const state = this.resources.get(type);
    if (!state) {
      return;
    }

    this.setResourceAmount(type, state.current + amount);
  }

  /**
   * Removes from a resource amount
   */
  removeResource(type: ResourceType, amount: number): void {
    const state = this.resources.get(type);
    if (!state) {
      return;
    }

    this.setResourceAmount(type, state.current - amount);
  }

  /**
   * Updates resource production rate
   */
  setResourceProduction(type: ResourceType, amount: number): void {
    const state = this.resources.get(type);
    if (!state) {
      return;
    }

    state.production = amount;
  }

  /**
   * Updates resource consumption rate
   */
  setResourceConsumption(type: ResourceType, amount: number): void {
    const state = this.resources.get(type);
    if (!state) {
      return;
    }

    state.consumption = amount;
  }

  /**
   * Transfers resources between modules
   */
  transferResources(
    type: ResourceType,
    amount: number,
    source: string,
    target: string,
  ): void {
    // Record transfer
    const transfer: ResourceTransfer = {
      type,
      amount,
      source,
      target,
      timestamp: Date.now(),
    };

    this.transfers.push(transfer);
    if (this.transfers.length > this.maxTransferHistory) {
      this.transfers.shift();
    }

    // Emit transfer event
    moduleEventBus.emit({
      type: 'RESOURCE_TRANSFERRED',
      moduleId: source,
      moduleType: 'radar', // Default type
      timestamp: Date.now(),
      data: { transfer },
    });
  }

  /**
   * Gets resource transfer history
   */
  getTransferHistory(): ResourceTransfer[] {
    return [...this.transfers];
  }

  /**
   * Gets transfer history for a specific module
   */
  getModuleTransferHistory(moduleId: string): ResourceTransfer[] {
    return this.transfers.filter(
      t => t.source === moduleId || t.target === moduleId,
    );
  }

  /**
   * Gets transfer history for a specific resource type
   */
  getResourceTransferHistory(type: ResourceType): ResourceTransfer[] {
    return this.transfers.filter(t => t.type === type);
  }

  /**
   * Updates resource limits
   */
  setResourceLimits(type: ResourceType, min: number, max: number): void {
    const state = this.resources.get(type);
    if (!state) {
      return;
    }

    state.min = min;
    state.max = max;

    // Clamp current value to new limits
    this.setResourceAmount(type, state.current);
  }
}

// Export singleton instance
export const resourceManager = new ResourceManager(); 
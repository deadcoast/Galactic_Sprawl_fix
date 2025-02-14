import { moduleEventBus } from '../../lib/modules/ModuleEvents';
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
import {
  RESOURCE_MANAGER_CONFIG,
  PRODUCTION_INTERVALS,
  RESOURCE_THRESHOLDS,
  DEFAULT_PRODUCTION_RATES,
  DEFAULT_CONSUMPTION_RATES,
  TRANSFER_CONFIG,
  STORAGE_EFFICIENCY,
  RESOURCE_PRIORITIES,
} from '../../config/resource/ResourceConfig';

/**
 * Resource operation error types
 */
type ResourceError = {
  code: 'INVALID_RESOURCE' | 'INSUFFICIENT_RESOURCES' | 'INVALID_TRANSFER' | 'THRESHOLD_VIOLATION';
  message: string;
  details?: any;
};

/**
 * Manages game resources
 */
export class ResourceManager {
  private resources: Map<ResourceType, ResourceState>;
  private transfers: ResourceTransfer[];
  private maxTransferHistory: number;
  private productions: Map<string, ResourceProduction>;
  private consumptions: Map<string, ResourceConsumption>;
  private flows: Map<string, ResourceFlow>;
  private storageEfficiency: number;
  private config: ResourceManagerConfig;
  private productionIntervals: Map<string, NodeJS.Timeout>;
  private errors: Map<string, ResourceError>;

  constructor(maxTransferHistory = 1000, config: ResourceManagerConfig = RESOURCE_MANAGER_CONFIG) {
    this.resources = new Map();
    this.transfers = [];
    this.maxTransferHistory = maxTransferHistory;
    this.productions = new Map();
    this.consumptions = new Map();
    this.flows = new Map();
    this.storageEfficiency = STORAGE_EFFICIENCY.BASE;
    this.config = config;
    this.productionIntervals = new Map();
    this.errors = new Map();

    // Initialize resources with config limits
    Object.entries(config.defaultResourceLimits).forEach(([type, limits]) => {
      this.initializeResource(type as ResourceType, limits.min, limits.max);
    });

    console.debug('[ResourceManager] Initialized with config:', config);
  }

  /**
   * Initializes a resource type with configured limits
   */
  private initializeResource(type: ResourceType, min: number, max: number): void {
    this.resources.set(type, {
      current: 0,
      max: max * this.storageEfficiency,
      min,
      production: DEFAULT_PRODUCTION_RATES[type],
      consumption: DEFAULT_CONSUMPTION_RATES[type],
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
   * Sets the storage efficiency level
   */
  setStorageEfficiency(level: keyof typeof STORAGE_EFFICIENCY): void {
    const oldEfficiency = this.storageEfficiency;
    this.storageEfficiency = STORAGE_EFFICIENCY[level];

    // Update max capacities with new efficiency
    for (const [type, limits] of Object.entries(this.config.defaultResourceLimits)) {
      const state = this.resources.get(type as ResourceType);
      if (state) {
        const oldMax = state.max;
        state.max = limits.max * this.storageEfficiency;
        console.debug(
          `[ResourceManager] Updated ${type} storage capacity: ${oldMax.toFixed(2)} -> ${state.max.toFixed(2)}`
        );
      }
    }

    moduleEventBus.emit({
      type: 'STATUS_CHANGED',
      moduleId: 'resource-manager',
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: {
        type: 'storage_efficiency',
        oldValue: oldEfficiency,
        newValue: this.storageEfficiency,
      },
    });
  }

  /**
   * Handles and logs resource operation errors
   */
  private handleError(id: string, error: ResourceError): void {
    this.errors.set(id, error);
    console.error(`[ResourceManager] Error in ${id}:`, error.message);

    moduleEventBus.emit({
      type: 'ERROR_OCCURRED',
      moduleId: id,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: error,
    });
  }

  /**
   * Validates resource transfer operation
   */
  private validateTransfer(
    type: ResourceType,
    amount: number,
    source: string,
    target: string
  ): ResourceError | null {
    if (!this.resources.has(type)) {
      return {
        code: 'INVALID_RESOURCE',
        message: `Invalid resource type: ${type}`,
      };
    }

    const sourceAmount = this.getResourceAmount(type);
    if (sourceAmount < amount) {
      return {
        code: 'INSUFFICIENT_RESOURCES',
        message: `Insufficient ${type}: required ${amount}, available ${sourceAmount}`,
        details: { required: amount, available: sourceAmount },
      };
    }

    if (source === target) {
      return {
        code: 'INVALID_TRANSFER',
        message: 'Source and target cannot be the same',
        details: { source, target },
      };
    }

    return null;
  }

  /**
   * Transfers resources between modules with error handling
   */
  transferResources(type: ResourceType, amount: number, source: string, target: string): boolean {
    const error = this.validateTransfer(type, amount, source, target);
    if (error) {
      this.handleError(`transfer-${source}-${target}`, error);
      return false;
    }

    try {
      // Apply transfer configuration limits
      amount = Math.max(
        TRANSFER_CONFIG.MIN_AMOUNT,
        Math.min(amount, TRANSFER_CONFIG.MAX_BATCH_SIZE)
      );

      // Apply transfer rate multiplier for efficiency
      const transferAmount = amount * TRANSFER_CONFIG.TRANSFER_RATE_MULTIPLIER;

      // Record transfer with configured history limit
      const transfer: ResourceTransfer = {
        type,
        amount: transferAmount,
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
        moduleType: 'resource-manager',
        timestamp: Date.now(),
        data: { transfer },
      });

      console.debug(
        `[ResourceManager] Transferred ${transferAmount.toFixed(2)} ${type} from ${source} to ${target}`
      );

      return true;
    } catch (err) {
      this.handleError(`transfer-${source}-${target}`, {
        code: 'INVALID_TRANSFER',
        message: 'Transfer operation failed',
        details: err,
      });
      return false;
    }
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
    return this.transfers.filter(t => t.source === moduleId || t.target === moduleId);
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

  /**
   * Registers a new resource production
   */
  registerProduction(id: string, production: ResourceProduction): void {
    const oldProduction = this.productions.get(id);
    this.productions.set(id, production);

    // Emit production registration event
    moduleEventBus.emit({
      type: 'RESOURCE_PRODUCTION_REGISTERED',
      moduleId: id,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: {
        production,
        oldProduction,
      },
    });

    console.debug(
      `[ResourceManager] Registered production for ${production.type}: ${production.amount}/tick every ${production.interval}ms`
    );
  }

  /**
   * Registers a new resource consumption
   */
  registerConsumption(id: string, consumption: ResourceConsumption): void {
    const oldConsumption = this.consumptions.get(id);
    this.consumptions.set(id, consumption);

    // Emit consumption registration event
    moduleEventBus.emit({
      type: 'RESOURCE_CONSUMPTION_REGISTERED',
      moduleId: id,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: {
        consumption,
        oldConsumption,
      },
    });

    console.debug(
      `[ResourceManager] Registered consumption for ${consumption.type}: ${consumption.amount}/tick every ${consumption.interval}ms`
    );
  }

  /**
   * Registers a new resource flow between modules
   */
  registerFlow(id: string, flow: ResourceFlow): void {
    const oldFlow = this.flows.get(id);
    this.flows.set(id, flow);

    // Emit flow registration event
    moduleEventBus.emit({
      type: 'RESOURCE_FLOW_REGISTERED',
      moduleId: id,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: {
        flow,
        oldFlow,
      },
    });

    console.debug(
      `[ResourceManager] Registered flow from ${flow.source} to ${flow.target} for ${flow.resources.length} resource types`
    );
  }

  /**
   * Unregisters a production
   */
  unregisterProduction(id: string): void {
    const production = this.productions.get(id);
    if (production) {
      this.productions.delete(id);
      moduleEventBus.emit({
        type: 'RESOURCE_PRODUCTION_UNREGISTERED',
        moduleId: id,
        moduleType: 'resource-manager',
        timestamp: Date.now(),
        data: { production },
      });
    }
  }

  /**
   * Unregisters a consumption
   */
  unregisterConsumption(id: string): void {
    const consumption = this.consumptions.get(id);
    if (consumption) {
      this.consumptions.delete(id);
      moduleEventBus.emit({
        type: 'RESOURCE_CONSUMPTION_UNREGISTERED',
        moduleId: id,
        moduleType: 'resource-manager',
        timestamp: Date.now(),
        data: { consumption },
      });
    }
  }

  /**
   * Unregisters a flow
   */
  unregisterFlow(id: string): void {
    const flow = this.flows.get(id);
    if (flow) {
      this.flows.delete(id);
      moduleEventBus.emit({
        type: 'RESOURCE_FLOW_UNREGISTERED',
        moduleId: id,
        moduleType: 'resource-manager',
        timestamp: Date.now(),
        data: { flow },
      });
    }
  }

  /**
   * Updates resource production and consumption with configured intervals
   */
  update(deltaTime: number): void {
    // Handle production with configured rates
    for (const [id, production] of this.productions) {
      if (!this.checkThresholds(production.conditions)) {
        continue;
      }

      const baseRate = DEFAULT_PRODUCTION_RATES[production.type];
      const amount = (baseRate * production.amount * deltaTime) / production.interval;
      this.addResource(production.type, amount);

      console.debug(
        `[ResourceManager] Produced ${amount.toFixed(2)} ${production.type} from ${id}`
      );
    }

    // Handle consumption with configured rates
    for (const [id, consumption] of this.consumptions) {
      if (!this.checkThresholds(consumption.conditions)) {
        continue;
      }

      const baseRate = DEFAULT_CONSUMPTION_RATES[consumption.type];
      const amount = (baseRate * consumption.amount * deltaTime) / consumption.interval;
      const currentAmount = this.getResourceAmount(consumption.type);

      if (currentAmount >= amount || !consumption.required) {
        this.removeResource(consumption.type, amount);
        console.debug(
          `[ResourceManager] Consumed ${amount.toFixed(2)} ${consumption.type} by ${id}`
        );
      } else if (consumption.required) {
        moduleEventBus.emit({
          type: 'RESOURCE_SHORTAGE',
          moduleId: id,
          moduleType: 'resource-manager',
          timestamp: Date.now(),
          data: {
            resourceType: consumption.type,
            required: amount,
            available: currentAmount,
            priority: RESOURCE_PRIORITIES[consumption.type],
          },
        });
      }
    }

    // Handle flows with configured transfer settings
    for (const [id, flow] of this.flows) {
      if (!this.checkThresholds(flow.conditions)) {
        console.debug(`[ResourceManager] Flow ${id} skipped due to threshold conditions`);
        continue;
      }

      for (const resource of flow.resources) {
        const amount =
          (resource.amount * deltaTime) / (resource.interval || TRANSFER_CONFIG.DEFAULT_INTERVAL);
        this.transferResources(resource.type, amount, flow.source, flow.target);
        console.debug(
          `[ResourceManager] Flow ${id} transferred ${amount.toFixed(2)} ${resource.type}`
        );
      }
    }
  }

  /**
   * Checks resource thresholds against configured values
   */
  private checkThresholds(thresholds?: ResourceThreshold[]): boolean {
    if (!thresholds) {
      return true;
    }

    return thresholds.every(threshold => {
      const state = this.resources.get(threshold.type);
      if (!state) {
        return false;
      }

      const currentRatio = state.current / state.max;

      // Use configured threshold values
      if (threshold.min !== undefined && currentRatio < RESOURCE_THRESHOLDS.LOW) {
        return false;
      }

      if (threshold.max !== undefined && currentRatio > RESOURCE_THRESHOLDS.HIGH) {
        return false;
      }

      if (threshold.target !== undefined) {
        const targetRatio = threshold.target / state.max;
        return Math.abs(currentRatio - targetRatio) < 0.1; // 10% tolerance
      }

      return true;
    });
  }

  /**
   * Schedules a production cycle with configured intervals
   */
  scheduleProduction(id: string, production: ResourceProduction): void {
    // Clear any existing interval
    this.clearProductionSchedule(id);

    // Register the production
    this.registerProduction(id, production);

    // Set up the interval
    const interval = setInterval(() => {
      if (this.checkThresholds(production.conditions)) {
        const baseRate = DEFAULT_PRODUCTION_RATES[production.type];
        const amount = baseRate * production.amount;
        this.addResource(production.type, amount);

        console.debug(
          `[ResourceManager] Scheduled production: ${amount.toFixed(2)} ${production.type} from ${id}`
        );
      }
    }, production.interval || PRODUCTION_INTERVALS.NORMAL);

    this.productionIntervals.set(id, interval);

    console.debug(
      `[ResourceManager] Scheduled production for ${id} every ${
        production.interval || PRODUCTION_INTERVALS.NORMAL
      }ms`
    );
  }

  /**
   * Clears a production schedule
   */
  clearProductionSchedule(id: string): void {
    const interval = this.productionIntervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.productionIntervals.delete(id);
      this.unregisterProduction(id);

      console.debug(`[ResourceManager] Cleared production schedule for ${id}`);
    }
  }

  /**
   * Schedules a resource flow with configured intervals
   */
  scheduleFlow(id: string, flow: ResourceFlow): boolean {
    try {
      // Clear any existing flow
      this.clearFlowSchedule(id);

      // Validate flow configuration
      if (!flow.resources.length) {
        throw new Error('Flow must have at least one resource');
      }

      // Register the flow
      this.registerFlow(id, flow);

      // Set up intervals for each resource
      flow.resources.forEach(resource => {
        const interval = setInterval(() => {
          if (this.checkThresholds(flow.conditions)) {
            const { amount } = resource;
            this.transferResources(resource.type, amount, flow.source, flow.target);
          }
        }, resource.interval || TRANSFER_CONFIG.DEFAULT_INTERVAL);

        this.productionIntervals.set(`${id}-${resource.type}`, interval);

        console.debug(
          `[ResourceManager] Scheduled flow for ${resource.type} from ${flow.source} to ${
            flow.target
          } every ${resource.interval || TRANSFER_CONFIG.DEFAULT_INTERVAL}ms`
        );
      });

      return true;
    } catch (err) {
      this.handleError(id, {
        code: 'INVALID_TRANSFER',
        message: 'Failed to schedule flow',
        details: err,
      });
      return false;
    }
  }

  /**
   * Clears a flow schedule
   */
  clearFlowSchedule(id: string): void {
    // Clear all intervals for this flow
    Array.from(this.productionIntervals.entries())
      .filter(([key]) => key.startsWith(id))
      .forEach(([key, interval]) => {
        clearInterval(interval);
        this.productionIntervals.delete(key);
      });

    this.unregisterFlow(id);
    console.debug(`[ResourceManager] Cleared flow schedule for ${id}`);
  }

  /**
   * Gets the production schedule status
   */
  getProductionSchedule(id: string): boolean {
    return this.productionIntervals.has(id);
  }

  /**
   * Gets all active production schedules
   */
  getActiveSchedules(): string[] {
    return Array.from(this.productionIntervals.keys());
  }

  /**
   * Cleans up all schedules
   */
  cleanup(): void {
    // Clear all intervals
    this.productionIntervals.forEach((interval, id) => {
      clearInterval(interval);
      console.debug(`[ResourceManager] Cleaned up schedule for ${id}`);
    });
    this.productionIntervals.clear();

    // Clear all registrations
    this.productions.clear();
    this.flows.clear();
    this.consumptions.clear();

    console.debug('[ResourceManager] Cleaned up all schedules and registrations');
  }

  /**
   * Gets the last error for an operation
   */
  getLastError(id: string): ResourceError | undefined {
    return this.errors.get(id);
  }

  /**
   * Clears error state for an operation
   */
  clearError(id: string): void {
    this.errors.delete(id);
  }
}

// Export singleton instance
export const resourceManager = new ResourceManager();

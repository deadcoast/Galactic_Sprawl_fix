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
import { resourcePerformanceMonitor } from '../resource/ResourcePerformanceMonitor';
import type { PerformanceMetrics, ResourcePerformanceSnapshot } from '../resource/ResourcePerformanceMonitor';

// Update TRANSFER_CONFIG type to include MIN_INTERVAL
const TRANSFER_CONFIG_WITH_MIN = {
  ...TRANSFER_CONFIG,
  MIN_INTERVAL: 500, // Minimum 500ms between transfers
};

/**
 * Resource operation error types
 */
type ResourceError = {
  code: 'INVALID_RESOURCE' | 'INSUFFICIENT_RESOURCES' | 'INVALID_TRANSFER' | 'THRESHOLD_VIOLATION';
  message: string;
  details?: any;
};

/**
 * Resource optimization strategies
 */
interface OptimizationStrategy {
  id: string;
  type: 'production' | 'consumption' | 'transfer';
  priority: number;
  condition: () => boolean;
  apply: () => void;
}

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
  private optimizationStrategies: Map<string, OptimizationStrategy>;
  private optimizationMetrics: {
    productionEfficiency: number;
    consumptionEfficiency: number;
    transferEfficiency: number;
    lastOptimizationTime: number;
  };

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
    this.optimizationStrategies = new Map();
    this.optimizationMetrics = {
      productionEfficiency: 1.0,
      consumptionEfficiency: 1.0,
      transferEfficiency: 1.0,
      lastOptimizationTime: Date.now(),
    };

    // Initialize resources with config limits
    Object.entries(config.defaultResourceLimits).forEach(([type, limits]) => {
      this.initializeResource(type as ResourceType, limits.min, limits.max);
    });

    // Initialize optimization strategies
    this.initializeOptimizationStrategies();

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
        TRANSFER_CONFIG_WITH_MIN.MIN_AMOUNT,
        Math.min(amount, TRANSFER_CONFIG_WITH_MIN.MAX_BATCH_SIZE)
      );

      // Apply transfer rate multiplier for efficiency
      const transferAmount = amount * TRANSFER_CONFIG_WITH_MIN.TRANSFER_RATE_MULTIPLIER;

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
   * Initializes resource optimization strategies
   */
  private initializeOptimizationStrategies(): void {
    // Production optimization - balance production rates based on demand
    this.optimizationStrategies.set('balance-production', {
      id: 'balance-production',
      type: 'production',
      priority: 1,
      condition: () => {
        const now = Date.now();
        return now - this.optimizationMetrics.lastOptimizationTime > 60000; // Run every minute
      },
      apply: () => {
        for (const [type, state] of this.resources) {
          const usage = this.calculateResourceUsage(type);
          const currentProduction = state.production;
          const targetProduction = usage * 1.2; // 20% buffer

          if (Math.abs(currentProduction - targetProduction) > 0.1) {
            const oldProduction = state.production;
            state.production = targetProduction;
            console.debug(
              `[ResourceManager] Optimized production for ${type}: ${oldProduction.toFixed(2)} -> ${targetProduction.toFixed(2)}`
            );
          }
        }
        this.optimizationMetrics.productionEfficiency = this.calculateProductionEfficiency();
      },
    });

    // Consumption optimization - reduce waste and optimize resource usage
    this.optimizationStrategies.set('optimize-consumption', {
      id: 'optimize-consumption',
      type: 'consumption',
      priority: 2,
      condition: () => {
        return Array.from(this.resources.values()).some(
          state => state.current / state.max > RESOURCE_THRESHOLDS.HIGH
        );
      },
      apply: () => {
        for (const [type, state] of this.resources) {
          if (state.current / state.max > RESOURCE_THRESHOLDS.HIGH) {
            const consumers = Array.from(this.consumptions.values())
              .filter(c => c.type === type)
              .sort((a, b) => (b.required ? 1 : -1));

            for (const consumer of consumers) {
              if (!consumer.required) {
                const oldRate = consumer.amount;
                consumer.amount *= 1.5; // Increase consumption to reduce excess
                console.debug(
                  `[ResourceManager] Increased consumption rate for ${type}: ${oldRate.toFixed(2)} -> ${consumer.amount.toFixed(2)}`
                );
              }
            }
          }
        }
        this.optimizationMetrics.consumptionEfficiency = this.calculateConsumptionEfficiency();
      },
    });

    // Transfer optimization - optimize resource distribution
    this.optimizationStrategies.set('optimize-transfers', {
      id: 'optimize-transfers',
      type: 'transfer',
      priority: 3,
      condition: () => this.flows.size > 0,
      apply: () => {
        for (const flow of this.flows.values()) {
          const sourceStates = flow.resources.map(r => ({
            resource: r,
            state: this.resources.get(r.type),
          }));

          for (const { resource, state } of sourceStates) {
            if (!state) {
              continue;
            }

            const utilization = state.current / state.max;
            if (utilization < RESOURCE_THRESHOLDS.LOW) {
              const oldInterval = resource.interval;
              resource.interval = Math.max(
                resource.interval * 1.5,
                TRANSFER_CONFIG_WITH_MIN.DEFAULT_INTERVAL
              );
              console.debug(
                `[ResourceManager] Adjusted transfer interval for ${resource.type}: ${oldInterval}ms -> ${resource.interval}ms`
              );
            } else if (utilization > RESOURCE_THRESHOLDS.HIGH) {
              const oldInterval = resource.interval;
              resource.interval = Math.max(
                resource.interval * 0.75,
                TRANSFER_CONFIG_WITH_MIN.MIN_INTERVAL
              );
              console.debug(
                `[ResourceManager] Adjusted transfer interval for ${resource.type}: ${oldInterval}ms -> ${resource.interval}ms`
              );
            }
          }
        }
        this.optimizationMetrics.transferEfficiency = this.calculateTransferEfficiency();
      },
    });
  }

  /**
   * Calculates resource usage rate
   */
  private calculateResourceUsage(type: ResourceType): number {
    const consumers = Array.from(this.consumptions.values())
      .filter(c => c.type === type)
      .reduce((total, c) => total + c.amount, 0);

    const transfers = Array.from(this.flows.values())
      .flatMap(f => f.resources)
      .filter(r => r.type === type)
      .reduce((total, r) => total + r.amount, 0);

    return consumers + transfers;
  }

  /**
   * Calculates production efficiency
   */
  private calculateProductionEfficiency(): number {
    const efficiencies = Array.from(this.resources.entries()).map(([type, state]) => {
      const usage = this.calculateResourceUsage(type);
      const {production} = state;
      return usage > 0 ? Math.min(production / usage, 1.5) : 1.0;
    });

    return efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length;
  }

  /**
   * Calculates consumption efficiency
   */
  private calculateConsumptionEfficiency(): number {
    const efficiencies = Array.from(this.resources.entries()).map(([type, state]) => {
      const usage = this.calculateResourceUsage(type);
      return usage > 0 ? Math.min(state.current / (usage * 10), 1.0) : 1.0;
    });

    return efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length;
  }

  /**
   * Calculates transfer efficiency
   */
  private calculateTransferEfficiency(): number {
    if (this.transfers.length === 0) {
      return 1.0;
    }

    const recentTransfers = this.transfers.filter(t => Date.now() - t.timestamp < 60000).length; // Last minute

    const successRate = recentTransfers / Math.max(this.errors.size, 1);
    return Math.min(successRate, 1.0);
  }

  /**
   * Runs optimization strategies
   */
  private runOptimizations(): void {
    const strategies = Array.from(this.optimizationStrategies.values())
      .sort((a, b) => b.priority - a.priority)
      .filter(s => s.condition());

    for (const strategy of strategies) {
      try {
        strategy.apply();
        console.debug(`[ResourceManager] Applied optimization strategy: ${strategy.id}`);
      } catch (err) {
        console.error(
          `[ResourceManager] Failed to apply optimization strategy ${strategy.id}:`,
          err
        );
      }
    }

    this.optimizationMetrics.lastOptimizationTime = Date.now();

    // Emit optimization metrics
    moduleEventBus.emit({
      type: 'STATUS_CHANGED',
      moduleId: 'resource-manager',
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: {
        type: 'optimization',
        metrics: this.optimizationMetrics,
      },
    });
  }

  /**
   * Updates resource production and consumption with configured intervals
   */
  update(deltaTime: number): void {
    // Run optimizations first
    this.runOptimizations();

    // Update performance metrics for each resource
    for (const [type, state] of this.resources) {
      const usage = this.calculateResourceUsage(type);
      resourcePerformanceMonitor.recordMetrics(
        type,
        state.production,
        usage,
        this.calculateTransferRate(type),
        state.current / state.max
      );
    }

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
          (resource.amount * deltaTime) /
          (resource.interval || TRANSFER_CONFIG_WITH_MIN.DEFAULT_INTERVAL);
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
        }, resource.interval || TRANSFER_CONFIG_WITH_MIN.DEFAULT_INTERVAL);

        this.productionIntervals.set(`${id}-${resource.type}`, interval);

        console.debug(
          `[ResourceManager] Scheduled flow for ${resource.type} from ${flow.source} to ${
            flow.target
          } every ${resource.interval || TRANSFER_CONFIG_WITH_MIN.DEFAULT_INTERVAL}ms`
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
    resourcePerformanceMonitor.cleanup();
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

  /**
   * Gets current optimization metrics
   */
  getOptimizationMetrics() {
    return { ...this.optimizationMetrics };
  }

  /**
   * Calculates transfer rate for a resource
   */
  private calculateTransferRate(type: ResourceType): number {
    const recentTransfers = this.transfers
      .filter(t => t.type === type && Date.now() - t.timestamp < 60000)
      .reduce((sum, t) => sum + t.amount, 0);

    return recentTransfers / 60; // Transfers per second
  }

  /**
   * Gets performance metrics
   */
  getPerformanceMetrics(type: ResourceType): PerformanceMetrics[] {
    return resourcePerformanceMonitor.getResourceHistory(type);
  }

  /**
   * Gets latest performance snapshot
   */
  getPerformanceSnapshot(): ResourcePerformanceSnapshot {
    return resourcePerformanceMonitor.getLatestSnapshot();
  }

  /**
   * Get all resources as an object
   */
  public getAllResources(): Record<ResourceType, number> {
    const resources: Record<ResourceType, number> = {} as Record<ResourceType, number>;
    
    for (const [type, state] of Array.from(this.resources)) {
      resources[type] = state.current;
    }
    
    return resources;
  }

  /**
   * Get all resource states
   */
  public getAllResourceStates(): Record<ResourceType, ResourceState> {
    const states: Record<ResourceType, ResourceState> = {} as Record<ResourceType, ResourceState>;
    
    for (const [type, state] of Array.from(this.resources)) {
      states[type] = { ...state };
    }
    
    return states;
  }

  /**
   * Get all resource flows
   */
  public getAllResourceFlows(): ResourceFlow[] {
    const flows: ResourceFlow[] = [];
    
    for (const flow of Array.from(this.flows.values())) {
      flows.push({ ...flow });
    }
    
    return flows;
  }

  /**
   * Save resource state to localStorage
   */
  private saveResourceState(): void {
    const resourceData: Record<ResourceType, ResourceState> = {} as Record<ResourceType, ResourceState>;
    
    for (const [type, state] of Array.from(this.resources)) {
      resourceData[type] = { ...state };
    }
    
    const productionData: Record<string, ResourceProduction> = {};
    
    for (const [id, production] of Array.from(this.productions)) {
      productionData[id] = { ...production };
    }
    
    const consumptionData: Record<string, ResourceConsumption> = {};
    
    for (const [id, consumption] of Array.from(this.consumptions)) {
      consumptionData[id] = { ...consumption };
    }
    
    const flowData: Record<string, ResourceFlow> = {};
    
    for (const [id, flow] of Array.from(this.flows)) {
      flowData[id] = { ...flow };
    }
  }
}

// Export singleton instance
export const resourceManager = new ResourceManager();

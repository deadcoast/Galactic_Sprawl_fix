import {
  DEFAULT_CONSUMPTION_RATES,
  DEFAULT_PRODUCTION_RATES,
  PRODUCTION_INTERVALS,
  RESOURCE_MANAGER_CONFIG,
  RESOURCE_PRIORITIES,
  RESOURCE_THRESHOLDS,
  STORAGE_EFFICIENCY,
  TRANSFER_CONFIG,
} from '../../config/resource/ResourceConfig';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import {
  ResourceConsumption,
  ResourceFlow,
  ResourceManagerConfig,
  ResourceProduction,
  ResourceState,
  ResourceThreshold,
  ResourceTransfer,
  ResourceType,
} from '../../types/resources/ResourceTypes';
import { resourcePerformanceMonitor } from '../resource/ResourcePerformanceMonitor';

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
  details?: unknown;
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

    console.warn('[ResourceManager] Initialized with config:', config);
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
  removeResource(type: ResourceType, amount: number): boolean {
    const state = this.resources.get(type);
    if (!state) {
      return false;
    }

    const oldAmount = state.current;
    state.current = Math.max(state.min, Math.min(oldAmount - amount, state.max));

    // Emit resource event
    moduleEventBus.emit({
      type: state.current < oldAmount ? 'RESOURCE_PRODUCED' : 'RESOURCE_CONSUMED',
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

    return true;
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
        console.warn(
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

      console.warn(
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

    console.warn(
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

    console.warn(
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

    console.warn(
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
        // Convert Map entries to array to avoid MapIterator error
        const resourceEntries = Array.from(this.resources.entries());
        for (const [type, state] of resourceEntries) {
          const usage = this.calculateResourceUsage(type);
          const currentProduction = state.production;
          const targetProduction = usage * 1.2; // 20% buffer

          if (Math.abs(currentProduction - targetProduction) > 0.1) {
            const oldProduction = state.production;
            state.production = targetProduction;
            console.warn(
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
        // Convert Map entries to array to avoid MapIterator error
        const resourceEntries = Array.from(this.resources.entries());
        for (const [type, state] of resourceEntries) {
          if (state.current / state.max > RESOURCE_THRESHOLDS.HIGH) {
            const consumers = Array.from(this.consumptions.values())
              .filter(c => c.type === type)
              .sort((_a, b) => (b.required ? 1 : -1));

            for (const consumer of consumers) {
              if (!consumer.required) {
                const oldRate = consumer.amount;
                consumer.amount *= 1.5;
                console.warn(
                  `[ResourceManager] Increased consumption of ${type} for ${consumer.type}: ${oldRate.toFixed(2)} -> ${consumer.amount.toFixed(2)}`
                );
                break;
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
        // Convert Map values to array to avoid MapIterator error
        const flowValues = Array.from(this.flows.values());
        for (const flow of flowValues) {
          const sourceStates = flow.resources.map(r => ({
            resource: r,
            state: this.resources.get(r.type),
          }));

          // Check if any source is below threshold
          const belowThreshold = sourceStates.some(
            s => s.state && s.state.current / s.state.max < RESOURCE_THRESHOLDS.LOW
          );

          if (belowThreshold) {
            // Reduce flow rate
            flow.resources.forEach(r => {
              const oldRate = r.amount;
              r.amount *= 0.8;
              console.warn(
                `[ResourceManager] Reduced flow rate for ${r.type}: ${oldRate.toFixed(2)} -> ${r.amount.toFixed(2)}`
              );
            });
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
      const { production } = state;
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
        console.warn(`[ResourceManager] Applied optimization strategy: ${strategy.id}`);
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
    // Convert Map entries to array to avoid MapIterator error
    const resourceEntries = Array.from(this.resources.entries());
    for (const [type, state] of resourceEntries) {
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
    // Convert Map entries to array to avoid MapIterator error
    const productionEntries = Array.from(this.productions.entries());
    for (const [id, production] of productionEntries) {
      if (!this.checkThresholds(production.conditions)) {
        continue;
      }

      // Calculate amount to produce based on rate and time
      const amount = (production.amount * deltaTime) / production.interval;
      this.addResource(production.type, amount);

      console.warn(`[ResourceManager] Produced ${amount.toFixed(2)} ${production.type} from ${id}`);
    }

    // Handle consumption with configured rates
    // Convert Map entries to array to avoid MapIterator error
    const consumptionEntries = Array.from(this.consumptions.entries());
    for (const [id, consumption] of consumptionEntries) {
      if (!this.checkThresholds(consumption.conditions)) {
        continue;
      }

      // Calculate amount to consume based on rate and time
      const amount = (consumption.amount * deltaTime) / consumption.interval;
      const success = this.removeResource(consumption.type, amount);

      if (success) {
        console.warn(
          `[ResourceManager] Consumed ${amount.toFixed(2)} ${consumption.type} by ${id}`
        );
      } else if (consumption.required) {
        // Log error for required consumption
        this.handleError(id, {
          code: 'INSUFFICIENT_RESOURCES',
          message: `Failed to consume required resource: ${consumption.type}`,
          details: {
            type: consumption.type,
            amount,
            consumer: id,
            priority: RESOURCE_PRIORITIES[consumption.type],
          },
        });
      }
    }

    // Handle flows with configured transfer settings
    // Convert Map entries to array to avoid MapIterator error
    const flowEntries = Array.from(this.flows.entries());
    for (const [id, flow] of flowEntries) {
      if (!this.checkThresholds(flow.conditions)) {
        console.warn(`[ResourceManager] Flow ${id} skipped due to threshold conditions`);
        continue;
      }

      // Process each resource in the flow
      flow.resources.forEach(resource => {
        // Calculate amount to transfer based on rate and time
        const amount = (resource.amount * deltaTime) / (resource.interval || 1000);
        const success = this.transferResources(resource.type, amount, flow.source, flow.target);

        if (success) {
          console.warn(
            `[ResourceManager] Transferred ${amount.toFixed(2)} ${resource.type} from ${
              flow.source
            } to ${flow.target}`
          );
        } else {
          console.warn(
            `[ResourceManager] Failed to transfer ${amount.toFixed(2)} ${resource.type} from ${
              flow.source
            } to ${flow.target}`
          );
        }
      });
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

        console.warn(
          `[ResourceManager] Scheduled production: ${amount.toFixed(2)} ${production.type} from ${id}`
        );
      }
    }, production.interval || PRODUCTION_INTERVALS.NORMAL);

    this.productionIntervals.set(id, interval);

    console.warn(
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

      console.warn(`[ResourceManager] Cleared production schedule for ${id}`);
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

        console.warn(
          `[ResourceManager] Scheduled flow for ${resource.type} from ${flow.source} to ${
            flow.target
          } every ${resource.interval || TRANSFER_CONFIG_WITH_MIN.DEFAULT_INTERVAL}ms`
        );
      });

      return true;
    } catch (err) {
      console.error(`[ResourceManager] Failed to schedule flow for ${id}:`, err);
      return false;
    }
  }

  /**
   * Clears a flow schedule
   */
  private clearFlowSchedule(id: string): void {
    const intervals = Array.from(this.productionIntervals.entries())
      .filter(entry => entry[0].startsWith(`${id}-`))
      .map(entry => entry[1]);

    intervals.forEach(interval => {
      clearInterval(interval);
    });

    this.productionIntervals.delete(`${id}-`);
    this.unregisterFlow(id);

    console.warn(`[ResourceManager] Cleared flow schedule for ${id}`);
  }

  public getAllResources(): Record<ResourceType, number> {
    const resources: Record<ResourceType, number> = {} as Record<ResourceType, number>;

    // Convert Map entries to array to avoid MapIterator error
    const resourceEntries = Array.from(this.resources.entries());
    for (const [type, state] of resourceEntries) {
      resources[type] = state.current;
    }

    return resources;
  }

  public getAllResourceStates(): Record<ResourceType, ResourceState> {
    const states: Record<ResourceType, ResourceState> = {} as Record<ResourceType, ResourceState>;

    // Convert Map entries to array to avoid MapIterator error
    const resourceEntries = Array.from(this.resources.entries());
    for (const [type, state] of resourceEntries) {
      states[type] = { ...state };
    }

    return states;
  }

  public getAllResourceFlows(): ResourceFlow[] {
    const flows: ResourceFlow[] = [];

    // Convert Map values to array to avoid MapIterator error
    const flowValues = Array.from(this.flows.values());
    for (const flow of flowValues) {
      flows.push({ ...flow });
    }

    return flows;
  }

  /**
   * Saves the current resource state to localStorage and emits an event
   * This method is used for persistence and state recovery after game reload
   * It captures the complete resource system state including:
   * - Current resource amounts and limits
   * - Production configurations
   * - Consumption configurations
   * - Flow configurations
   */
  private __saveResourceState(): void {
    const resourceData: Record<ResourceType, ResourceState> = {} as Record<
      ResourceType,
      ResourceState
    >;

    // Convert Map entries to array to avoid MapIterator error
    const resourceEntries = Array.from(this.resources.entries());
    for (const [type, state] of resourceEntries) {
      resourceData[type] = { ...state };
    }

    const productionData: Record<string, ResourceProduction> = {};

    // Convert Map entries to array to avoid MapIterator error
    const productionEntries = Array.from(this.productions.entries());
    for (const [id, production] of productionEntries) {
      productionData[id] = { ...production };
    }

    const consumptionData: Record<string, ResourceConsumption> = {};

    // Convert Map entries to array to avoid MapIterator error
    const consumptionEntries = Array.from(this.consumptions.entries());
    for (const [id, consumption] of consumptionEntries) {
      consumptionData[id] = { ...consumption };
    }

    const flowData: Record<string, ResourceFlow> = {};

    // Convert Map entries to array to avoid MapIterator error
    const flowEntries = Array.from(this.flows.entries());
    for (const [id, flow] of flowEntries) {
      flowData[id] = { ...flow };
    }

    // Create a complete state object
    const completeState = {
      resources: resourceData,
      productions: productionData,
      consumptions: consumptionData,
      flows: flowData,
      storageEfficiency: this.storageEfficiency,
      timestamp: Date.now(),
    };

    try {
      // Save to localStorage
      localStorage.setItem('resourceManagerState', JSON.stringify(completeState));

      // Emit an event to notify that the state has been saved
      moduleEventBus.emit({
        type: 'RESOURCE_STATE_SAVED' as ModuleEventType,
        moduleId: 'resource-manager',
        moduleType: 'resource-manager' as ModuleType,
        timestamp: Date.now(),
        data: {
          timestamp: completeState.timestamp,
          resourceCount: Object.keys(resourceData).length,
          productionCount: Object.keys(productionData).length,
          consumptionCount: Object.keys(consumptionData).length,
          flowCount: Object.keys(flowData).length,
        },
      });

      console.warn(
        `[ResourceManager] State saved with ${Object.keys(resourceData).length} resources`
      );
    } catch (error) {
      // Handle potential localStorage errors
      this.handleError('save-state', {
        code: 'INVALID_TRANSFER',
        message: 'Failed to save resource state',
        details: error,
      });
      console.error('[ResourceManager] Failed to save state:', error);
    }
  }

  /**
   * Loads the resource state from localStorage
   * @returns True if state was successfully loaded, false otherwise
   */
  public loadResourceState(): boolean {
    try {
      const savedState = localStorage.getItem('resourceManagerState');
      if (!savedState) {
        return false;
      }

      const parsedState = JSON.parse(savedState);

      // Validate the state structure
      if (
        !parsedState.resources ||
        !parsedState.productions ||
        !parsedState.consumptions ||
        !parsedState.flows
      ) {
        console.warn('[ResourceManager] Invalid saved state structure');
        return false;
      }

      // Clear current state
      this.resources.clear();
      this.productions.clear();
      this.consumptions.clear();
      this.flows.clear();

      // Restore resources
      Object.entries(parsedState.resources).forEach(([type, state]) => {
        this.resources.set(type as ResourceType, state as ResourceState);
      });

      // Restore productions
      Object.entries(parsedState.productions).forEach(([id, production]) => {
        this.productions.set(id, production as ResourceProduction);
      });

      // Restore consumptions
      Object.entries(parsedState.consumptions).forEach(([id, consumption]) => {
        this.consumptions.set(id, consumption as ResourceConsumption);
      });

      // Restore flows
      Object.entries(parsedState.flows).forEach(([id, flow]) => {
        this.flows.set(id, flow as ResourceFlow);
      });

      // Restore storage efficiency
      if (typeof parsedState.storageEfficiency === 'number') {
        this.storageEfficiency = parsedState.storageEfficiency;
      }

      // Emit an event to notify that the state has been loaded
      moduleEventBus.emit({
        type: 'RESOURCE_STATE_LOADED' as ModuleEventType,
        moduleId: 'resource-manager',
        moduleType: 'resource-manager' as ModuleType,
        timestamp: Date.now(),
        data: {
          originalTimestamp: parsedState.timestamp,
          resourceCount: Object.keys(parsedState.resources).length,
          productionCount: Object.keys(parsedState.productions).length,
          consumptionCount: Object.keys(parsedState.consumptions).length,
          flowCount: Object.keys(parsedState.flows).length,
        },
      });

      console.warn(
        `[ResourceManager] State loaded with ${Object.keys(parsedState.resources).length} resources`
      );
      return true;
    } catch (error) {
      this.handleError('load-state', {
        code: 'INVALID_TRANSFER',
        message: 'Failed to load resource state',
        details: error,
      });
      console.error('[ResourceManager] Failed to load state:', error);
      return false;
    }
  }

  /**
   * Saves the current resource state
   * This is a public method that triggers the private __saveResourceState method
   */
  public saveState(): void {
    this.__saveResourceState();
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
}

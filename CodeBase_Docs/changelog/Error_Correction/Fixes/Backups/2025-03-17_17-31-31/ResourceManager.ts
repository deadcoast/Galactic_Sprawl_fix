import {
  DEFAULT_PRODUCTION_RATES,
  PRODUCTION_INTERVALS,
  RESOURCE_MANAGER_CONFIG,
  RESOURCE_PRIORITIES,
  RESOURCE_THRESHOLDS,
  STORAGE_EFFICIENCY,
  TRANSFER_CONFIG,
} from '../../config/resource/ResourceConfig';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { EventHandler } from '../../types/events/EventEmitterInterface';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import {
  ResourceConsumption as ImportedResourceConsumption,
  ResourceFlow as ImportedResourceFlow,
  ResourceProduction as ImportedResourceProduction,
  ResourceTransfer as ImportedResourceTransfer,
  ResourceState,
  ResourceThreshold,
  ResourceTypeHelpers,
  ResourceTypeString,
} from '../../types/resources/ResourceTypes';
import {
  ensureEnumResourceType,
  ensureStringResourceType,
  toEnumResourceType,
} from '../../utils/resources/ResourceTypeMigration';
import { resourcePerformanceMonitor } from '../resource/ResourcePerformanceMonitor';
import { ResourceType } from './../../types/resources/ResourceTypes';

// Define ResourceManagerConfig interface based on the config structure
interface ResourceManagerConfig {
  defaultResourceLimits?: Record<ResourceType, { min: number; max: number }>;
  // Add other config properties as needed
}

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
 * Resource manager event interface
 */
export interface ResourceManagerEvent extends BaseEvent {
  type: EventType;
  resourceType: ResourceType;
  amount?: number;
  source?: string;
  target?: string;
  details?: Record<string, unknown>;
}

// Type guard for ResourceManagerEvent
export function isResourceManagerEvent(event: unknown): event is ResourceManagerEvent {
  if (!event || typeof event !== 'object') return false;
  const e = event as ResourceManagerEvent;
  return (
    'type' in e &&
    'resourceType' in e &&
    typeof e.type === 'string' &&
    Object.values(EventType).includes(e.type as EventType) &&
    Object.values(ResourceType).includes(e.resourceType as ResourceType)
  );
}

// Update the ResourceProduction interface to properly use standardized resource types
interface ResourceProduction extends Omit<ImportedResourceProduction, 'type'> {
  type: ResourceType;
  rate: number;
  maxRate: number;
  minRate?: number;
  efficiency?: number;
}

// Update the ResourceConsumption interface to properly use standardized resource types
interface ResourceConsumption extends Omit<ImportedResourceConsumption, 'type'> {
  type: ResourceType;
}

// Update the ResourceFlow interface to properly use standardized resource types
interface ResourceFlow extends Omit<ImportedResourceFlow, 'resources'> {
  resources: Array<{
    type: ResourceType;
    amount: number;
    interval?: number;
  }>;
}

// Update the ResourceTransfer interface to properly use standardized resource types
interface ResourceTransfer extends Omit<ImportedResourceTransfer, 'type'> {
  type: ResourceType;
}

/**
 * Manages game resources
 */
export class ResourceManager extends AbstractBaseManager<ResourceManagerEvent> {
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
  private eventHandlers: Map<EventType, Set<EventHandler<ResourceManagerEvent>>>;

  constructor(
    maxTransferHistory = 1000,
    config: ResourceManagerConfig = RESOURCE_MANAGER_CONFIG as ResourceManagerConfig
  ) {
    super('ResourceManager');

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
    this.eventHandlers = new Map();

    // Initialize event handlers for resource-related events
    this.initializeEventHandlers();

    console.warn('[ResourceManager] Created with config:', config);
  }

  /**
   * Initialize event handlers for resource-related events
   */
  private initializeEventHandlers(): void {
    // Resource production events
    this.subscribe(EventType.RESOURCE_PRODUCED, this.handleResourceProduced.bind(this));
    this.subscribe(EventType.RESOURCE_CONSUMED, this.handleResourceConsumed.bind(this));
    this.subscribe(EventType.RESOURCE_TRANSFERRED, this.handleResourceTransferred.bind(this));
    this.subscribe(EventType.RESOURCE_SHORTAGE, this.handleResourceShortage.bind(this));
    this.subscribe(EventType.RESOURCE_THRESHOLD_TRIGGERED, this.handleResourceThreshold.bind(this));
  }

  /**
   * Handle resource production events
   */
  private handleResourceProduced(event: ResourceManagerEvent): void {
    if (!isResourceManagerEvent(event)) return;
    const { resourceType, amount = 0 } = event;
    this.addResource(resourceType, amount);
  }

  /**
   * Handle resource consumption events
   */
  private handleResourceConsumed(event: ResourceManagerEvent): void {
    if (!isResourceManagerEvent(event)) return;
    const { resourceType, amount = 0 } = event;
    this.removeResource(resourceType, amount);
  }

  /**
   * Handle resource transfer events
   */
  private handleResourceTransferred(event: ResourceManagerEvent): void {
    if (!isResourceManagerEvent(event)) return;
    const { resourceType, amount = 0, source, target } = event;
    if (source && target) {
      this.transferResources(resourceType, amount, source, target);
    }
  }

  /**
   * Handle resource shortage events
   */
  private handleResourceShortage(event: ResourceManagerEvent): void {
    if (!isResourceManagerEvent(event)) return;
    const { resourceType } = event;
    // Implement shortage handling logic
    this.optimizeResourceProduction(resourceType);
  }

  /**
   * Handle resource threshold events
   */
  private handleResourceThreshold(event: ResourceManagerEvent): void {
    if (!isResourceManagerEvent(event)) return;
    const { resourceType, details } = event;
    if (details?.thresholds) {
      this.checkThresholds(details.thresholds as ResourceThreshold[]);
    } else {
      this.logResourceError(`threshold-${resourceType}`, {
        code: 'THRESHOLD_VIOLATION',
        message: `No thresholds provided for ${resourceType}`,
      });
    }
  }

  /**
   * Optimize resource production for a specific resource type
   */
  private optimizeResourceProduction(resourceType: ResourceType): void {
    // Implement optimization logic
    const currentAmount = this.getResourceAmount(resourceType);
    const state = this.getResourceState(resourceType);

    if (state && currentAmount < state.min) {
      // Increase production if possible
      const producers = Array.from(this.productions.values()).filter(p => p.type === resourceType);

      for (const producer of producers) {
        if (producer.rate < producer.maxRate) {
          producer.rate = Math.min(producer.rate * 1.5, producer.maxRate);
        }
      }
    }
  }

  /**
   * @inheritdoc
   */
  protected async onInitialize(_dependencies?: unknown): Promise<void> {
    // Initialize resources with config limits
    if (this.config.defaultResourceLimits) {
      Object.entries(this.config.defaultResourceLimits).forEach(([type, limits]) => {
        const resourceType = ResourceType[type as keyof typeof ResourceType];
        if (limits && typeof limits.min === 'number' && typeof limits.max === 'number') {
          this.initializeResource(resourceType, limits.min, limits.max);
        }
      });
    } else {
      console.warn(
        '[ResourceManager] Warning: defaultResourceLimits is null or undefined in config'
      );
    }

    // Initialize optimization strategies
    this.initializeOptimizationStrategies();

    // Publish initialization event
    this.publish({
      type: EventType.SYSTEM_STARTUP,
      resourceType: ResourceType.MINERALS,
      moduleId: this.id,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: { config: this.config },
    });

    console.warn('[ResourceManager] Initialized with config:', this.config);
  }

  /**
   * @inheritdoc
   */
  protected onUpdate(deltaTime: number): void {
    // Process optimizations every 5 seconds
    if (Date.now() - this.optimizationMetrics.lastOptimizationTime > 5000) {
      this.runOptimizations();
      this.optimizationMetrics.lastOptimizationTime = Date.now();
    }

    // Publish update event with current resource states
    this.publish({
      type: EventType.RESOURCE_UPDATED,
      resourceType: ResourceType.MINERALS,
      moduleId: this.id,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: {
        resources: this.getAllResourceStates(),
        deltaTime,
      },
    });
  }

  /**
   * @inheritdoc
   */
  protected async onDispose(): Promise<void> {
    // Stop all production intervals
    for (const [_id, interval] of this.productionIntervals.entries()) {
      clearInterval(interval);
    }
    this.productionIntervals.clear();

    // Save state before disposing
    this.saveState();

    // Clear all maps
    this.resources.clear();
    this.transfers = [];
    this.productions.clear();
    this.consumptions.clear();
    this.flows.clear();
    this.errors.clear();
    this.optimizationStrategies.clear();

    console.warn('[ResourceManager] Disposed');
  }

  /**
   * @inheritdoc
   */
  protected getVersion(): string {
    return '1.0.0';
  }

  /**
   * @inheritdoc
   */
  protected getStats(): Record<string, number | string> {
    return {
      resourceCount: this.resources.size,
      transferCount: this.transfers.length,
      productionCount: this.productions.size,
      consumptionCount: this.consumptions.size,
      flowCount: this.flows.size,
      productionEfficiency: this.optimizationMetrics.productionEfficiency,
      consumptionEfficiency: this.optimizationMetrics.consumptionEfficiency,
      transferEfficiency: this.optimizationMetrics.transferEfficiency,
    };
  }

  /**
   * Initialize a resource with min and max values
   * @param type Resource type
   * @param min Minimum value
   * @param max Maximum value
   */
  private initializeResource(type: ResourceType, min: number, max: number): void {
    // Ensure we're using the enum resource type
    const resourceType = ensureEnumResourceType(type);

    // Create resource state if it doesn't exist
    if (!this.resources.has(resourceType)) {
      this.resources.set(resourceType, {
        current: min,
        max,
        min,
        production: 0,
        consumption: 0,
      });
    }
  }

  /**
   * Get the current amount of a resource
   */
  getResourceAmount(type: ResourceType): number {
    const state = this.resources.get(type);
    return state?.current || 0;
  }

  /**
   * Get the current state of a resource
   */
  getResourceState(type: ResourceType): ResourceState | undefined {
    return this.resources.get(type);
  }

  /**
   * Set the amount of a resource
   */
  setResourceAmount(type: ResourceType, amount: number): void {
    const state = this.resources.get(type);
    if (!state) {
      this.logResourceError('set-amount', {
        code: 'INVALID_RESOURCE',
        message: `Invalid resource type: ${type}`,
      });
      return;
    }

    // Clamp amount between min and max
    const clampedAmount = Math.max(state.min, Math.min(state.max, amount));
    state.current = clampedAmount;

    // Update the resource state
    this.resources.set(type, state);

    // Publish resource update event
    this.publish({
      type: EventType.RESOURCE_UPDATED,
      resourceType: type,
      moduleId: this.id,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      amount: clampedAmount,
      data: {
        previous: state.current,
        current: clampedAmount,
        min: state.min,
        max: state.max,
      },
    });

    // Update performance metrics
    resourcePerformanceMonitor.recordMetrics(
      type,
      state.production,
      state.consumption,
      this.calculateTransferRate(type),
      clampedAmount / state.max
    );
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

    // Check if we have enough
    if (state.current < amount) {
      // Emit shortage event
      this.publish({
        type: EventType.RESOURCE_SHORTAGE,
        resourceType: type,
        moduleId: this.id,
        moduleType: 'resource-manager',
        timestamp: Date.now(),
        amount: amount,
        data: {
          resourceType: type,
          requiredAmount: amount,
          availableAmount: state.current,
          deficit: amount - state.current,
        },
      });
      return false;
    }

    this.setResourceAmount(type, state.current - amount);
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
    if (this.config.defaultResourceLimits) {
      for (const [type, limits] of Object.entries(this.config.defaultResourceLimits)) {
        // Convert string type to ResourceType
        let resourceType: ResourceType;
        try {
          // Try to convert directly if it's already in the correct format
          resourceType = type as unknown as ResourceType;
        } catch (_e) {
          // If that fails, try to use the helper
          resourceType = ResourceTypeHelpers.stringToEnum(type.toLowerCase() as ResourceTypeString);
        }

        const state = this.resources.get(resourceType);
        if (state && limits && typeof limits.max === 'number') {
          const oldMax = state.max;
          state.max = limits.max * this.storageEfficiency;
          console.warn(
            `[ResourceManager] Updated ${type} storage capacity: ${oldMax.toFixed(2)} -> ${state.max.toFixed(2)}`
          );
        }
      }
    }

    this.publish({
      type: EventType.RESOURCE_THRESHOLD_CHANGED,
      moduleId: this.id,
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
  private logResourceError(id: string, error: ResourceError): void {
    this.errors.set(id, error);
    console.error(`[ResourceManager] Error in ${id}:`, error.message);

    this.publish({
      type: EventType.ERROR_OCCURRED,
      moduleId: id,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: error,
    });
  }

  /**
   * @inheritdoc
   */
  public override handleError(error: Error, context?: Record<string, unknown>): void {
    // Call the parent class implementation
    super.handleError(error, context);

    // Additional resource manager specific error handling
    console.error(`[ResourceManager] Error:`, error.message);
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
      this.logResourceError(`transfer-${source}-${target}`, error);
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
      this.publish({
        type: EventType.RESOURCE_TRANSFERRED,
        resourceType: type,
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
      this.logResourceError(`transfer-${source}-${target}`, {
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
    this.publish({
      type: EventType.RESOURCE_PRODUCTION_REGISTERED,
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
    this.publish({
      type: EventType.RESOURCE_CONSUMPTION_REGISTERED,
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
    this.publish({
      type: EventType.RESOURCE_FLOW_REGISTERED,
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
      this.publish({
        type: EventType.RESOURCE_PRODUCTION_UNREGISTERED,
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
      this.publish({
        type: EventType.RESOURCE_CONSUMPTION_UNREGISTERED,
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
      this.publish({
        type: EventType.RESOURCE_FLOW_UNREGISTERED,
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
              .filter(c => {
                // Convert enum type to string type for comparison
                const stringType = ensureStringResourceType(c.type);
                return stringType === type;
              })
              .sort((_a, b) => (b.required ? 1 : -1));

            for (const consumer of consumers) {
              if (!consumer.required) {
                const oldRate = consumer.amount;
                consumer.amount *= 1.5;
                console.warn(
                  `[ResourceManager] Increased consumption of ${type}: ${oldRate.toFixed(2)} -> ${consumer.amount.toFixed(2)}`
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
            state: this.resources.get(this.ensureResourceType(r.type)),
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
                `[ResourceManager] Reduced flow rate for ${this.ensureResourceType(r.type)}: ${oldRate.toFixed(2)} -> ${r.amount.toFixed(2)}`
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
      .filter(c => {
        // Handle string type comparison
        return ensureStringResourceType(c.type) === ensureStringResourceType(type);
      })
      .reduce((total, c) => total + c.amount, 0);

    const transfers = Array.from(this.flows.values())
      .flatMap(f => f.resources)
      .filter(r => {
        // Handle string type comparison
        return ensureStringResourceType(r.type) === ensureStringResourceType(type);
      })
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
    this.publish({
      type: EventType.RESOURCE_FLOW_OPTIMIZATION_COMPLETED,
      moduleId: this.id,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: {
        productionEfficiency: this.optimizationMetrics.productionEfficiency,
        consumptionEfficiency: this.optimizationMetrics.consumptionEfficiency,
        transferEfficiency: this.optimizationMetrics.transferEfficiency,
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
    const resourceEntries = Array.from(this.resources.entries());
    for (const [type, state] of resourceEntries) {
      const usage = this.calculateResourceUsage(type);

      // Convert string type to enum type for the performance monitor
      const enumType = toEnumResourceType(type);
      resourcePerformanceMonitor.recordMetrics(
        enumType,
        state.production,
        usage,
        this.calculateTransferRate(type),
        state.current / state.max
      );
    }

    // Handle production with configured rates
    const productionEntries = Array.from(this.productions.entries());
    for (const [id, production] of productionEntries) {
      if (!this.checkThresholds(production.conditions)) {
        continue;
      }

      // Calculate amount to produce based on rate and time
      const amount = (production.amount * deltaTime) / production.interval;
      // Add resource using the enum type directly
      this.addResource(production.type, amount);

      console.warn(`[ResourceManager] Produced ${amount.toFixed(2)} ${production.type} from ${id}`);
    }

    // Handle consumption with configured rates
    const consumptionEntries = Array.from(this.consumptions.entries());
    for (const [id, consumption] of consumptionEntries) {
      if (!this.checkThresholds(consumption.conditions)) {
        continue;
      }

      // Calculate amount to consume based on rate and time
      const amount = (consumption.amount * deltaTime) / consumption.interval;
      // Remove resource using the enum type directly
      this.removeResource(consumption.type, amount);

      if (consumption.required) {
        // Log error for required consumption
        this.logResourceError(id, {
          code: 'INSUFFICIENT_RESOURCES',
          message: `Failed to consume required resource: ${consumption.type}`,
          details: {
            type: consumption.type,
            amount,
            consumer: id,
            priority: RESOURCE_PRIORITIES[consumption.type as ResourceType],
          },
        });
      }
    }

    // Handle flows with configured transfer settings
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
        // Transfer resources using the enum type directly
        this.transferResources(resource.type, amount, flow.source, flow.target);
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
      const state = this.resources.get(threshold.resourceId);
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
        // Add resource using the enum type directly
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
            const amount = resource.amount;
            // Transfer resources using the enum type directly
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
    this.resources.forEach((state, type) => {
      states[type] = { ...state };
    });
    return states;
  }

  /**
   * Get production and consumption rates for all resources
   * @returns Record of resource rates by type
   */
  public getAllResourceRates(): Record<
    ResourceType,
    { production: number; consumption: number; net: number }
  > {
    const rates: Record<ResourceType, { production: number; consumption: number; net: number }> =
      {} as Record<ResourceType, { production: number; consumption: number; net: number }>;

    // Initialize with default rates for all resource types
    // Use string keys and then cast to StringResourceType to avoid TS error
    const resourceTypes = [
      ResourceType.MINERALS,
      ResourceType.ENERGY,
      ResourceType.POPULATION,
      ResourceType.RESEARCH,
      ResourceType.PLASMA,
      ResourceType.GAS,
      ResourceType.EXOTIC,
    ];

    // Set rates for each resource type
    resourceTypes.forEach(typeKey => {
      const type = typeKey as ResourceType;
      const state = this.getResourceState(type);
      rates[type] = {
        production: state?.production || 0,
        consumption: state?.consumption || 0,
        net: (state?.production || 0) - (state?.consumption || 0),
      };
    });

    return rates;
  }

  /**
   * Get all resource flows
   * @returns Array of all registered resource flows
   */
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
   * Saves the current resource state
   */
  public saveState(): void {
    // Implementation of saveState method
    console.warn('[ResourceManager] Saving resource state');
    // Add your implementation here
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

  // Helper function to ensure type safety when converting resource types
  private ensureResourceType(type: ResourceType | string): ResourceType {
    if (typeof type === 'string') {
      return ResourceType[type as keyof typeof ResourceType];
    }
    return type;
  }
}

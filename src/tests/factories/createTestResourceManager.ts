import {
  ResourceConsumption,
  ResourceFlow,
  ResourceManagerConfig,
  ResourceProduction,
  ResourceState,
  ResourceTransfer,
  ResourceType,
} from '../../types/resources/ResourceTypes';

/**
 * Test factory for the ResourceManager
 *
 * This file provides a test implementation of the ResourceManager that behaves
 * like the real implementation but is isolated for testing purposes.
 * It provides the same interface as the real ResourceManager class plus helper methods
 * for verifying resource operations in tests.
 */

/**
 * Default resource limits configuration for testing
 */
const TEST_RESOURCE_LIMITS: Record<ResourceType, { min: number; max: number }> = {
  minerals: { min: 0, max: 10000 },
  energy: { min: 0, max: 10000 },
  population: { min: 0, max: 1000 },
  research: { min: 0, max: 10000 },
  plasma: { min: 0, max: 5000 },
  gas: { min: 0, max: 5000 },
  exotic: { min: 0, max: 1000 },
};

/**
 * Default test resource manager configuration
 */
const DEFAULT_TEST_CONFIG: ResourceManagerConfig = {
  maxTransferHistory: 100,
  defaultResourceLimits: TEST_RESOURCE_LIMITS,
};

/**
 * Interface for the test resource manager
 * Includes the public methods from the real ResourceManager class
 * plus additional helper methods for testing.
 */
export interface TestResourceManager {
  // Core resource methods
  getResourceAmount(type: ResourceType): number;
  getResourceState(type: ResourceType): ResourceState | undefined;
  setResourceAmount(type: ResourceType, amount: number): void;
  addResource(type: ResourceType, amount: number): void;
  removeResource(type: ResourceType, amount: number): boolean;

  // Resource limits and rates
  setResourceProduction(type: ResourceType, amount: number): void;
  setResourceConsumption(type: ResourceType, amount: number): void;
  setResourceLimits(type: ResourceType, min: number, max: number): void;
  setStorageEfficiency(level: number): void;

  // Resource transfers
  transferResources(type: ResourceType, amount: number, source: string, target: string): boolean;
  getTransferHistory(): ResourceTransfer[];
  getModuleTransferHistory(moduleId: string): ResourceTransfer[];
  getResourceTransferHistory(type: ResourceType): ResourceTransfer[];

  // Resource production/consumption
  registerProduction(id: string, production: ResourceProduction): void;
  unregisterProduction(id: string): void;
  registerConsumption(id: string, consumption: ResourceConsumption): void;
  unregisterConsumption(id: string): void;
  registerFlow(id: string, flow: ResourceFlow): void;
  unregisterFlow(id: string): void;
  scheduleProduction(id: string, production: ResourceProduction): void;
  clearProductionSchedule(id: string): void;
  scheduleFlow(id: string, flow: ResourceFlow): boolean;

  // State management
  update(deltaTime: number): void;
  getAllResources(): Record<ResourceType, number>;
  getAllResourceStates(): Record<ResourceType, ResourceState>;
  getAllResourceFlows(): ResourceFlow[];

  // Test helper methods
  reset(): void;
  getProductions(): Map<string, ResourceProduction>;
  getConsumptions(): Map<string, ResourceConsumption>;
  getFlows(): Map<string, ResourceFlow>;
  setInitialResources(resources: Partial<Record<ResourceType, number>>): void;
  simulateProduction(id: string): void;
  simulateConsumption(id: string): void;
  hasResource(type: ResourceType, amount: number): boolean;
  throwErrorNextOperation(error?: string): void;
}

/**
 * Creates a test implementation of ResourceManager for testing.
 *
 * @param config Optional configuration for the resource manager
 * @returns A TestResourceManager instance
 */
export function createTestResourceManager(
  config: ResourceManagerConfig = DEFAULT_TEST_CONFIG
): TestResourceManager {
  // Resource state storage
  const resources = new Map<ResourceType, ResourceState>();

  // Track transfers
  const transfers: ResourceTransfer[] = [];
  const maxTransferHistory = config.maxTransferHistory;

  // Track production and consumption
  const productions = new Map<string, ResourceProduction>();
  const consumptions = new Map<string, ResourceConsumption>();
  const flows = new Map<string, ResourceFlow>();
  const productionIntervals = new Map<string, NodeJS.Timeout>();

  // Error simulation for testing
  let simulateError: string | null = null;

  /**
   * Initialize a resource with default values
   */
  function initializeResource(type: ResourceType, min: number, max: number): void {
    resources.set(type, {
      current: 0,
      min,
      max,
      production: 0,
      consumption: 0,
    });
  }

  // Initialize resources based on config
  Object.entries(config.defaultResourceLimits).forEach(([type, limits]) => {
    initializeResource(type as ResourceType, limits.min, limits.max);
  });

  return {
    /**
     * Get the current amount of a resource
     */
    getResourceAmount(type: ResourceType): number {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      const resource = resources.get(type);
      return resource ? resource.current : 0;
    },

    /**
     * Get the complete state of a resource
     */
    getResourceState(type: ResourceType): ResourceState | undefined {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      return resources.get(type);
    },

    /**
     * Set the amount of a resource directly
     */
    setResourceAmount(type: ResourceType, amount: number): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      const resource = resources.get(type);
      if (resource) {
        resource.current = Math.max(resource.min, Math.min(amount, resource.max));
      } else {
        // Create resource with default limits if it doesn't exist
        const defaultLimits = config.defaultResourceLimits[type] || { min: 0, max: 1000 };
        initializeResource(type, defaultLimits.min, defaultLimits.max);
        const newResource = resources.get(type)!;
        newResource.current = Math.max(newResource.min, Math.min(amount, newResource.max));
      }
    },

    /**
     * Add a quantity to a resource
     */
    addResource(type: ResourceType, amount: number): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      if (amount <= 0) return;

      const resource = resources.get(type);
      if (resource) {
        resource.current = Math.min(resource.current + amount, resource.max);
      } else {
        // Create resource with default limits if it doesn't exist
        const defaultLimits = config.defaultResourceLimits[type] || { min: 0, max: 1000 };
        initializeResource(type, defaultLimits.min, defaultLimits.max);
        const newResource = resources.get(type)!;
        newResource.current = Math.min(amount, newResource.max);
      }
    },

    /**
     * Remove a quantity from a resource
     */
    removeResource(type: ResourceType, amount: number): boolean {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      if (amount <= 0) return true;

      const resource = resources.get(type);
      if (!resource) return false;

      if (resource.current < amount) return false;

      resource.current -= amount;
      return true;
    },

    /**
     * Set the production rate for a resource
     */
    setResourceProduction(type: ResourceType, amount: number): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      const resource = resources.get(type);
      if (resource) {
        resource.production = amount;
      }
    },

    /**
     * Set the consumption rate for a resource
     */
    setResourceConsumption(type: ResourceType, amount: number): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      const resource = resources.get(type);
      if (resource) {
        resource.consumption = amount;
      }
    },

    /**
     * Set the min and max limits for a resource
     */
    setResourceLimits(type: ResourceType, min: number, max: number): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      const resource = resources.get(type);
      if (resource) {
        resource.min = min;
        resource.max = max;
        resource.current = Math.max(resource.min, Math.min(resource.current, resource.max));
      } else {
        initializeResource(type, min, max);
      }
    },

    /**
     * Set the storage efficiency multiplier
     */
    setStorageEfficiency(_level: number): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      // In the test implementation, we don't actually use this
      // but we keep the method for compatibility
    },

    /**
     * Transfer resources from one module to another
     */
    transferResources(type: ResourceType, amount: number, source: string, target: string): boolean {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      if (amount <= 0) return false;

      // Create a transfer record
      const transfer: ResourceTransfer = {
        type,
        amount,
        source,
        target,
        timestamp: Date.now(),
      };

      // Add to history
      transfers.push(transfer);
      if (transfers.length > maxTransferHistory) {
        transfers.shift();
      }

      return true;
    },

    /**
     * Get all resource transfers
     */
    getTransferHistory(): ResourceTransfer[] {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      return [...transfers];
    },

    /**
     * Get transfers for a specific module
     */
    getModuleTransferHistory(moduleId: string): ResourceTransfer[] {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      return transfers.filter(t => t.source === moduleId || t.target === moduleId);
    },

    /**
     * Get transfers for a specific resource type
     */
    getResourceTransferHistory(type: ResourceType): ResourceTransfer[] {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      return transfers.filter(t => t.type === type);
    },

    /**
     * Register a production process
     */
    registerProduction(id: string, production: ResourceProduction): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      productions.set(id, { ...production });
    },

    /**
     * Unregister a production process
     */
    unregisterProduction(id: string): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      productions.delete(id);
      clearProductionSchedule(id);
    },

    /**
     * Register a consumption process
     */
    registerConsumption(id: string, consumption: ResourceConsumption): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      consumptions.set(id, { ...consumption });
    },

    /**
     * Unregister a consumption process
     */
    unregisterConsumption(id: string): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      consumptions.delete(id);
    },

    /**
     * Register a resource flow
     */
    registerFlow(id: string, flow: ResourceFlow): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      flows.set(id, { ...flow });
    },

    /**
     * Unregister a resource flow
     */
    unregisterFlow(id: string): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      flows.delete(id);
    },

    /**
     * Schedule a production to run at intervals
     */
    scheduleProduction(id: string, production: ResourceProduction): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      // Clear any existing interval
      clearProductionSchedule(id);

      // Register the production
      registerProduction(id, production);

      // Schedule it to run
      const interval = setInterval(() => {
        const prod = productions.get(id);
        if (prod) {
          addResource(prod.type, prod.amount);
        } else {
          // Production was removed, clear the interval
          clearProductionSchedule(id);
        }
      }, production.interval);

      productionIntervals.set(id, interval);
    },

    /**
     * Clear a scheduled production
     */
    clearProductionSchedule(id: string): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      const interval = productionIntervals.get(id);
      if (interval) {
        clearInterval(interval);
        productionIntervals.delete(id);
      }
    },

    /**
     * Schedule a resource flow
     */
    scheduleFlow(id: string, flow: ResourceFlow): boolean {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      // Register the flow
      registerFlow(id, flow);

      // In test implementation, we don't actually schedule it to run
      // but we return true to indicate success
      return true;
    },

    /**
     * Update resource state based on production and consumption
     */
    update(_deltaTime: number): void {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      // In a test implementation, we can just process productions and consumptions on demand
      // rather than simulating time passing
    },

    /**
     * Get all resources as a simple object
     */
    getAllResources(): Record<ResourceType, number> {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      const result: Partial<Record<ResourceType, number>> = {};
      resources.forEach((resource, type) => {
        result[type] = resource.current;
      });
      return result as Record<ResourceType, number>;
    },

    /**
     * Get all resource states
     */
    getAllResourceStates(): Record<ResourceType, ResourceState> {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      const result: Partial<Record<ResourceType, ResourceState>> = {};
      resources.forEach((resource, type) => {
        result[type] = { ...resource };
      });
      return result as Record<ResourceType, ResourceState>;
    },

    /**
     * Get all resource flows
     */
    getAllResourceFlows(): ResourceFlow[] {
      if (simulateError) {
        const error = simulateError;
        simulateError = null;
        throw new Error(error);
      }

      return Array.from(flows.values());
    },

    // Test helper methods

    /**
     * Reset the resource manager to initial state
     */
    reset(): void {
      // Clear resources
      resources.clear();

      // Reinitialize resources
      Object.entries(config.defaultResourceLimits).forEach(([type, limits]) => {
        initializeResource(type as ResourceType, limits.min, limits.max);
      });

      // Clear transfers
      transfers.length = 0;

      // Clear productions and consumptions
      productions.clear();
      consumptions.clear();
      flows.clear();

      // Clear intervals
      productionIntervals.forEach(interval => clearInterval(interval));
      productionIntervals.clear();

      // Reset error simulation
      simulateError = null;
    },

    /**
     * Get all production registrations
     */
    getProductions(): Map<string, ResourceProduction> {
      return new Map(productions);
    },

    /**
     * Get all consumption registrations
     */
    getConsumptions(): Map<string, ResourceConsumption> {
      return new Map(consumptions);
    },

    /**
     * Get all flow registrations
     */
    getFlows(): Map<string, ResourceFlow> {
      return new Map(flows);
    },

    /**
     * Set initial resource amounts for testing
     */
    setInitialResources(initialResources: Partial<Record<ResourceType, number>>): void {
      Object.entries(initialResources).forEach(([type, amount]) => {
        this.setResourceAmount(type as ResourceType, amount);
      });
    },

    /**
     * Simulate a production cycle for testing
     */
    simulateProduction(id: string): void {
      const production = productions.get(id);
      if (production) {
        this.addResource(production.type, production.amount);
      }
    },

    /**
     * Simulate a consumption cycle for testing
     */
    simulateConsumption(id: string): void {
      const consumption = consumptions.get(id);
      if (consumption) {
        this.removeResource(consumption.type, consumption.amount);
      }
    },

    /**
     * Check if there is enough of a resource
     */
    hasResource(type: ResourceType, amount: number): boolean {
      const resource = resources.get(type);
      return resource ? resource.current >= amount : false;
    },

    /**
     * Set up the manager to throw an error on the next operation
     */
    throwErrorNextOperation(error: string = 'Simulated error'): void {
      simulateError = error;
    },
  };

  // Helper functions to make the implementation cleaner
  function clearProductionSchedule(id: string): void {
    const interval = productionIntervals.get(id);
    if (interval) {
      clearInterval(interval);
      productionIntervals.delete(id);
    }
  }

  function registerProduction(id: string, production: ResourceProduction): void {
    productions.set(id, { ...production });
  }

  function addResource(type: ResourceType, amount: number): void {
    if (amount <= 0) return;

    const resource = resources.get(type);
    if (resource) {
      resource.current = Math.min(resource.current + amount, resource.max);
    } else {
      // Create resource with default limits if it doesn't exist
      const defaultLimits = config.defaultResourceLimits[type] || { min: 0, max: 1000 };
      initializeResource(type, defaultLimits.min, defaultLimits.max);
      const newResource = resources.get(type)!;
      newResource.current = Math.min(amount, newResource.max);
    }
  }

  function registerFlow(id: string, flow: ResourceFlow): void {
    flows.set(id, { ...flow });
  }
}

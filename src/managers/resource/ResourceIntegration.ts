import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import {
  ResourcePriority,
  ResourceState,
  ResourceTransfer,
  ResourceType,
} from '../../types/resources/ResourceTypes';
import { ResourceManager } from '../game/ResourceManager';
import { ResourceCostManager } from './ResourceCostManager';
import { ResourceExchangeManager } from './ResourceExchangeManager';
import { FlowNodeType, ResourceFlowManager } from './ResourceFlowManager';
import { ResourcePoolManager } from './ResourcePoolManager';
import { ResourceStorageManager, StorageContainerConfig } from './ResourceStorageManager';
import { ResourceThresholdManager, ThresholdConfig } from './ResourceThresholdManager';

/**
 * ResourceIntegration
 *
 * Integrates the new resource management system with existing game systems.
 * Acts as a bridge between the legacy ResourceManager and the new specialized managers.
 */
export class ResourceIntegration {
  private resourceManager: ResourceManager;
  private thresholdManager: ResourceThresholdManager;
  private flowManager: ResourceFlowManager;
  private storageManager: ResourceStorageManager;
  private costManager: ResourceCostManager;
  private exchangeManager: ResourceExchangeManager;
  private poolManager: ResourcePoolManager;
  private initialized: boolean = false;
  private transferHistory: ResourceTransfer[] = [];

  constructor(
    resourceManager: ResourceManager,
    thresholdManager: ResourceThresholdManager,
    flowManager: ResourceFlowManager,
    storageManager: ResourceStorageManager,
    costManager: ResourceCostManager,
    exchangeManager: ResourceExchangeManager,
    poolManager: ResourcePoolManager
  ) {
    this.resourceManager = resourceManager;
    this.thresholdManager = thresholdManager;
    this.flowManager = flowManager;
    this.storageManager = storageManager;
    this.costManager = costManager;
    this.exchangeManager = exchangeManager;
    this.poolManager = poolManager;
  }

  /**
   * Initialize the integration
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }

    // Subscribe to resource events from the legacy system
    this.subscribeToLegacyEvents();

    // Initialize threshold monitoring
    this.initializeThresholds();

    // Initialize storage containers
    this.initializeStorage();

    // Initialize resource flows
    this.initializeFlows();

    // Start the threshold monitoring
    this.thresholdManager.start();

    this.initialized = true;
    console.warn('[ResourceIntegration] Resource management system integrated');
  }

  /**
   * Subscribe to legacy resource events
   */
  private subscribeToLegacyEvents(): void {
    // Subscribe to resource produced events
    moduleEventBus.subscribe('RESOURCE_PRODUCED' as ModuleEventType, event => {
      // Type guard for event data
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      // Extract and validate resource type
      const resourceType = event.data.type;
      if (!this.isValidResourceType(resourceType)) {
        return;
      }

      // Get resource state
      const resourceState = this.resourceManager.getResourceState(resourceType);
      if (resourceState) {
        this.updateResourceState(resourceType, resourceState);
      }
    });

    // Subscribe to resource consumed events
    moduleEventBus.subscribe('RESOURCE_CONSUMED' as ModuleEventType, event => {
      // Type guard for event data
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      // Extract and validate resource type
      const resourceType = event.data.type;
      if (!this.isValidResourceType(resourceType)) {
        return;
      }

      // Get resource state
      const resourceState = this.resourceManager.getResourceState(resourceType);
      if (resourceState) {
        this.updateResourceState(resourceType, resourceState);
      }
    });

    // Subscribe to resource transferred events
    moduleEventBus.subscribe('RESOURCE_TRANSFERRED' as ModuleEventType, event => {
      // Type guard for event data
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      // Extract and validate transfer properties
      const { resourceType, amount, source, target } = event.data;
      if (
        !this.isValidResourceType(resourceType) ||
        typeof amount !== 'number' ||
        typeof source !== 'string' ||
        typeof target !== 'string'
      ) {
        return;
      }

      // Record transfer in history
      this.transferHistory.push({
        type: resourceType,
        amount,
        source,
        target,
        timestamp: Date.now(),
      });

      // Keep history size manageable
      if (this.transferHistory.length > 100) {
        this.transferHistory.shift();
      }
    });

    // Subscribe to resource shortage events
    moduleEventBus.subscribe('RESOURCE_SHORTAGE' as ModuleEventType, event => {
      // Type guard for event data
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      // Extract and validate threshold properties
      const { resourceType, requiredAmount } = event.data;
      if (!this.isValidResourceType(resourceType) || typeof requiredAmount !== 'number') {
        return;
      }

      // Get current resource state
      const currentAmount = this.resourceManager.getResourceAmount(resourceType);
      const status = currentAmount < requiredAmount ? 'warning' : 'inactive';

      // Emit a status change event for the resource module
      moduleEventBus.emit({
        type: 'STATUS_CHANGED' as ModuleEventType,
        moduleId: `resource-${resourceType}`,
        moduleType: 'resource' as ModuleType,
        timestamp: Date.now(),
        data: {
          status,
          previousStatus: 'unknown',
          reason: `Resource ${resourceType} ${status === 'warning' ? 'shortage' : 'sufficient'}`,
          currentAmount,
          requiredAmount,
          deficit: status === 'warning' ? requiredAmount - currentAmount : 0,
        },
      });

      // Log the status change
      console.warn(
        `[ResourceIntegration] Resource ${resourceType} status: ${status} (${currentAmount}/${requiredAmount})`
      );

      // Find or create threshold configuration
      const existingConfig = this.thresholdManager
        .getThresholdConfigs()
        .find(config => config.threshold.type === resourceType);

      if (existingConfig) {
        // Update existing threshold if needed
        existingConfig.threshold.min = Math.max(existingConfig.threshold.min || 0, requiredAmount);
        // Update the threshold configuration
        this.thresholdManager.registerThreshold({
          ...existingConfig,
          threshold: {
            ...existingConfig.threshold,
            min: Math.max(existingConfig.threshold.min || 0, requiredAmount),
          },
        });
      } else {
        // Create new threshold configuration
        this.thresholdManager.registerThreshold({
          id: `shortage-${resourceType}-${Date.now()}`,
          threshold: {
            type: resourceType,
            min: requiredAmount,
          },
          actions: [
            {
              type: 'notification',
              target: 'system',
              message: `Low ${resourceType} resources`,
              priority: 1,
            },
          ],
          enabled: true,
          autoResolve: true,
        });
      }
    });
  }

  /**
   * Type guard to validate if a value is a valid ResourceType
   */
  private isValidResourceType(value: unknown): value is ResourceType {
    if (typeof value !== 'string') {
      return false;
    }

    // Check if the value is one of the known resource types
    // This assumes ResourceType is a string enum or string literal type
    const validTypes = [
      'energy',
      'minerals',
      'food',
      'consumer_goods',
      'alloys',
      'research',
      'influence',
      'unity',
      'exotic_matter',
      'dark_matter',
      'nanites',
      'living_metal',
      'zro',
      'motes',
      'gases',
      'crystals',
    ];

    return validTypes.includes(value as string);
  }

  /**
   * Initialize thresholds based on the legacy resource manager
   */
  private initializeThresholds(): void {
    // Get all resource types
    const resourceTypes = Array.from(this.resourceManager['resources'].keys()) as ResourceType[];

    // Create thresholds for each resource type
    resourceTypes.forEach(type => {
      const resourceState = this.resourceManager.getResourceState(type);
      if (!resourceState) {
        return;
      }

      // Create a threshold config
      const config: ThresholdConfig = {
        id: `resource-${type}`,
        threshold: {
          type,
          min: resourceState.min,
          max: resourceState.max,
          target: (resourceState.min + resourceState.max) / 2,
        },
        actions: [
          {
            type: 'notification',
            target: 'system',
            message: `${type} threshold triggered`,
          },
        ],
        enabled: true,
      };

      this.thresholdManager.registerThreshold(config);
    });
  }

  /**
   * Initialize storage containers based on the legacy resource manager
   */
  private initializeStorage(): void {
    // Get all resource types
    const resourceTypes = Array.from(this.resourceManager['resources'].keys()) as ResourceType[];

    // Create a main storage container for each resource type
    resourceTypes.forEach(type => {
      const resourceState = this.resourceManager.getResourceState(type);
      if (!resourceState) {
        return;
      }

      // Create a storage container config
      const config: StorageContainerConfig = {
        id: `main-storage-${type}`,
        name: `Main ${type} Storage`,
        type: 'storage',
        capacity: resourceState.max,
        resourceTypes: [type],
        priority: 10, // High priority for main storage
      };

      this.storageManager.registerContainer(config);

      // Initialize with current amount
      this.storageManager.storeResource(config.id, type, resourceState.current);
    });
  }

  /**
   * Initialize resource flows based on the legacy resource manager
   */
  private initializeFlows(): void {
    // Get all resource types
    const resourceTypes = Array.from(this.resourceManager['resources'].keys()) as ResourceType[];

    // Create producer and consumer nodes for each resource type
    resourceTypes.forEach(type => {
      const resourceState = this.resourceManager.getResourceState(type);
      if (!resourceState) {
        return;
      }

      // Create a resource priority
      const resourcePriority: ResourcePriority = {
        type,
        priority: 1,
        consumers: [],
      };

      // Create producer node
      this.flowManager.registerNode({
        id: `producer-${type}`,
        type: 'producer' as FlowNodeType,
        resources: [type],
        priority: resourcePriority,
        active: true,
      });

      // Create consumer node
      this.flowManager.registerNode({
        id: `consumer-${type}`,
        type: 'consumer' as FlowNodeType,
        resources: [type],
        priority: resourcePriority,
        active: true,
      });

      // Create storage node
      this.flowManager.registerNode({
        id: `storage-${type}`,
        type: 'storage' as FlowNodeType,
        resources: [type],
        priority: resourcePriority,
        capacity: resourceState.max,
        active: true,
      });

      // Create connections
      this.flowManager.registerConnection({
        id: `production-${type}`,
        source: `producer-${type}`,
        target: `storage-${type}`,
        resourceType: type,
        maxRate: resourceState.production,
        currentRate: 0,
        priority: resourcePriority,
        active: true,
      });

      this.flowManager.registerConnection({
        id: `consumption-${type}`,
        source: `storage-${type}`,
        target: `consumer-${type}`,
        resourceType: type,
        maxRate: resourceState.consumption,
        currentRate: 0,
        priority: resourcePriority,
        active: true,
      });

      // Update resource state in flow manager
      this.flowManager.updateResourceState(type, resourceState);
    });
  }

  /**
   * Update resource state in all managers
   */
  private updateResourceState(type: ResourceType, state: ResourceState): void {
    // Update in threshold manager via event
    moduleEventBus.emit({
      type: 'resource:update' as ModuleEventType,
      moduleId: 'resource-integration',
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: {
        type,
        state,
      },
    });

    // Update in flow manager
    this.flowManager.updateResourceState(type, state);

    // Update in cost manager
    this.costManager.updateResourceState(type, state);

    // Update in exchange manager
    this.exchangeManager.updateResourceState(type, state);
  }

  /**
   * Update method to be called on game loop
   */
  public update(_deltaTime: number): void {
    if (!this.initialized) {
      return;
    }

    // Optimize resource flows
    const flowResult = this.flowManager.optimizeFlows();

    // Apply transfers to the legacy resource manager
    flowResult.transfers.forEach(transfer => {
      // Only apply transfers to/from storage
      if (transfer.source.startsWith('storage-') || transfer.target.startsWith('storage-')) {
        // Extract the resource type from the node ID
        const sourceType = transfer.source.replace('storage-', '') as ResourceType;
        const targetType = transfer.target.replace('storage-', '') as ResourceType;

        // If transferring from storage to consumer, remove from legacy manager
        if (transfer.source.startsWith('storage-') && transfer.target.startsWith('consumer-')) {
          this.resourceManager.removeResource(sourceType, transfer.amount);
        }

        // If transferring from producer to storage, add to legacy manager
        if (transfer.source.startsWith('producer-') && transfer.target.startsWith('storage-')) {
          this.resourceManager.addResource(targetType, transfer.amount);
        }
      }
    });
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (!this.initialized) {
      return;
    }

    // Stop threshold monitoring
    this.thresholdManager.stop();

    // Clean up all managers
    this.thresholdManager.cleanup();
    this.flowManager.cleanup();
    this.storageManager.cleanup();
    this.costManager.cleanup();
    this.exchangeManager.cleanup();
    this.poolManager.cleanup();

    this.initialized = false;
  }
}

/**
 * Factory function to create and initialize the resource integration
 */
export function createResourceIntegration(resourceManager: ResourceManager): ResourceIntegration {
  // Create all the resource managers
  const thresholdManager = new ResourceThresholdManager();
  const flowManager = new ResourceFlowManager();
  const storageManager = new ResourceStorageManager();
  const costManager = new ResourceCostManager();
  const exchangeManager = new ResourceExchangeManager();
  const poolManager = new ResourcePoolManager();

  // Create the integration
  const integration = new ResourceIntegration(
    resourceManager,
    thresholdManager,
    flowManager,
    storageManager,
    costManager,
    exchangeManager,
    poolManager
  );

  // Initialize the integration
  integration.initialize();

  return integration;
}

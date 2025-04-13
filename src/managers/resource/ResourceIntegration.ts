import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import {
  FlowConnection,
  FlowNode,
  FlowNodeType,
  ResourcePriorityConfig,
  ResourceState,
  ResourceTransfer,
  ResourceType,
  ResourceTypeString,
  FlowNode as StandardizedFlowNode,
  toEnumResourceType,
} from '../../types/resources/ResourceTypes';
import { ResourceManager } from '../game/ResourceManager';
import { ResourceCostManager } from './ResourceCostManager';
import { ResourceExchangeManager } from './ResourceExchangeManager';
import { ResourceFlowManager } from './ResourceFlowManager';
import { ResourcePoolManager } from './ResourcePoolManager';
import { ResourceStorageManager, StorageContainerConfig } from './ResourceStorageManager';
import { ResourceThresholdManager, ThresholdConfig } from './ResourceThresholdManager';

// Access instance via getInstance() at the top level
const resourceFlowManager = ResourceFlowManager.getInstance();

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
  private initialized = false;
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
      if (!event?.data || typeof event?.data !== 'object') {
        return;
      }

      // Extract and validate resource type
      const resourceType = event?.data?.type;
      if (!this.isValidResourceType(resourceType)) {
        return;
      }

      const enumType = toEnumResourceType(resourceType);

      // Get resource state
      const resourceState = this.resourceManager.getResourceState(enumType);
      if (resourceState) {
        this.updateResourceState(resourceType, resourceState);
      }
    });

    // Subscribe to resource consumed events
    moduleEventBus.subscribe('RESOURCE_CONSUMED' as ModuleEventType, event => {
      // Type guard for event data
      if (!event?.data || typeof event?.data !== 'object') {
        return;
      }

      // Extract and validate resource type
      const resourceType = event?.data?.type;
      if (!this.isValidResourceType(resourceType)) {
        return;
      }

      const enumType = toEnumResourceType(resourceType);

      // Get resource state
      const resourceState = this.resourceManager.getResourceState(enumType);
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

      const enumType = toEnumResourceType(resourceType);

      // Record transfer in history
      this.transferHistory.push({
        type: enumType,
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

      const enumType = toEnumResourceType(resourceType);

      // Get current resource state
      const currentAmount = this.resourceManager.getResourceAmount(enumType);
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
        .find(config => config.threshold.resourceId === enumType);

      if (existingConfig) {
        // Update existing threshold if needed
        existingConfig.threshold.min = Math.max(existingConfig.threshold.min ?? 0, requiredAmount);
        // Update the threshold configuration
        this.thresholdManager.registerThreshold({
          ...existingConfig,
          threshold: {
            ...existingConfig.threshold,
            min: Math.max(existingConfig.threshold.min ?? 0, requiredAmount),
          },
        });
      } else {
        // Create new threshold configuration
        this.thresholdManager.registerThreshold({
          id: `shortage-${resourceType}-${Date.now()}`,
          threshold: {
            resourceId: enumType,
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
  private isValidResourceType(value: unknown): value is ResourceTypeString {
    if (typeof value !== 'string') {
      return false;
    }

    // Check if the value is one of the known resource types
    return Object.values(ResourceType).includes(value as ResourceType);
  }

  /**
   * Initialize thresholds based on the legacy resource manager
   */
  private initializeThresholds(): void {
    // Get all resource types
    const resourceTypes = Array.from(this.resourceManager.resources.keys());

    // Create thresholds for each resource type
    resourceTypes.forEach(type => {
      const enumType = toEnumResourceType(type);
      const resourceState = this.resourceManager.getResourceState(enumType);
      if (!resourceState) {
        return;
      }

      // Create a threshold config
      const config: ThresholdConfig = {
        id: `resource-${type}`,
        threshold: {
          resourceId: enumType,
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
    const resourceTypes = Array.from(this.resourceManager.resources.keys());

    // Create a main storage container for each resource type
    resourceTypes.forEach(type => {
      const enumType = toEnumResourceType(type);
      const resourceState = this.resourceManager.getResourceState(enumType);
      if (!resourceState) {
        return;
      }

      // Create a storage container config
      const config: StorageContainerConfig = {
        id: `main-storage-${type}`,
        name: `Main ${type} Storage`,
        type: 'storage',
        capacity: resourceState.max,
        resourceTypes: [enumType],
        priority: 10, // High priority for main storage
      };

      this.storageManager.registerContainer(config);

      // Initialize with current amount
      this.storageManager.storeResource(config.id, enumType, resourceState.current);
    });
  }

  /**
   * Initialize resource flows based on the legacy resource manager
   */
  private initializeFlows(): void {
    // Get all resource types
    const resourceTypes = Array.from(this.resourceManager.resources.keys());

    // Create producer and consumer nodes for each resource type
    resourceTypes.forEach(type => {
      const enumType = toEnumResourceType(type);
      const resourceState = this.resourceManager.getResourceState(enumType);
      if (!resourceState) {
        return;
      }

      const resourcePriority: ResourcePriorityConfig = {
        type: enumType,
        priority: 1,
        consumers: [],
      };

      // Create empty resource records with all required keys
      const emptyResources = Object.values(ResourceType).reduce(
        (acc, rt) => {
          acc[rt] = {
            current: 0,
            max: 0,
            min: 0,
            capacity: 0,
            production: 0,
            consumption: 0,
            rate: 0,
            value: 0,
          };
          return acc;
        },
        {} as Record<ResourceType, ResourceState>
      );

      // Create producer node
      const producerNode: FlowNode = {
        id: `producer-${type}`,
        type: FlowNodeType.PRODUCER,
        resources: { ...emptyResources, [enumType]: resourceState },
        priority: resourcePriority,
        active: true,
        x: 0,
        y: 0,
      };
      this.flowManager.registerNode(this.adaptFlowNode(producerNode));

      // Create consumer node
      const consumerNode: FlowNode = {
        id: `consumer-${type}`,
        type: FlowNodeType.CONSUMER,
        resources: { ...emptyResources, [enumType]: resourceState },
        priority: resourcePriority,
        active: true,
        x: 0,
        y: 0,
      };
      this.flowManager.registerNode(this.adaptFlowNode(consumerNode));

      // Create storage node
      const storageNode: FlowNode = {
        id: `storage-${type}`,
        type: FlowNodeType.STORAGE,
        resources: { ...emptyResources, [enumType]: resourceState },
        priority: resourcePriority,
        capacity: resourceState.max,
        active: true,
        x: 0,
        y: 0,
      };
      this.flowManager.registerNode(this.adaptFlowNode(storageNode));

      // Create connections
      const productionConnection: FlowConnection = {
        id: `production-${type}`,
        source: `producer-${type}`,
        target: `storage-${type}`,
        resourceTypes: [enumType],
        maxRate: resourceState.production,
        currentRate: 0,
        priority: resourcePriority,
        active: true,
      };
      this.flowManager.registerConnection(productionConnection);

      const consumptionConnection: FlowConnection = {
        id: `consumption-${type}`,
        source: `storage-${type}`,
        target: `consumer-${type}`,
        resourceTypes: [enumType],
        maxRate: resourceState.consumption,
        currentRate: 0,
        priority: resourcePriority,
        active: true,
      };
      this.flowManager.registerConnection(consumptionConnection);

      // Update resource state in flow manager
      this.flowManager.updateNodeResourceState(enumType, resourceState);
    });
  }

  /**
   * Helper method to adapt FlowNode structure (currently a pass-through)
   */
  private adaptFlowNode(node: FlowNode): StandardizedFlowNode {
    // Since both types now point to the same interface after consolidation,
    // this is currently just a pass-through.
    // TODO: Re-evaluate if this adapter is still needed or if conversion logic
    // is required elsewhere.
    return node;
  }

  /**
   * Update resource state in all managers
   */
  private updateResourceState(type: ResourceTypeString, state: ResourceState): void {
    const enumType = toEnumResourceType(type);

    // Update in threshold manager via event
    moduleEventBus.emit({
      type: 'resource:update' as ModuleEventType,
      moduleId: 'resource-integration',
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: {
        type: enumType,
        state,
      },
    });

    // Update in flow manager
    this.flowManager.updateNodeResourceState(enumType, state);

    // Update in cost manager
    this.costManager.updateResourceState(enumType, state);

    // Update in exchange manager
    this.exchangeManager.updateResourceState(enumType, state);
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
    flowResult.then(result => {
      result?.transfers.forEach(transfer => {
        // Only apply transfers to/from storage
        if (transfer.source.startsWith('storage-') || transfer.target.startsWith('storage-')) {
          // Extract the resource type from the node ID
          const sourceType = transfer.source.replace('storage-', '') as ResourceTypeString;
          const targetType = transfer.target.replace('storage-', '') as ResourceTypeString;

          // If transferring from storage to consumer, remove from legacy manager
          if (transfer.source.startsWith('storage-') && transfer.target.startsWith('consumer-')) {
            const enumSourceType = toEnumResourceType(sourceType);
            this.resourceManager.removeResource(enumSourceType, transfer.amount);
          }

          // If transferring from producer to storage, add to legacy manager
          if (transfer.source.startsWith('producer-') && transfer.target.startsWith('storage-')) {
            const enumTargetType = toEnumResourceType(targetType);
            this.resourceManager.addResource(enumTargetType, transfer.amount);
          }
        }
      });
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
    this.flowManager.dispose(); // Use dispose instead of cleanup
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
  const flowManager = ResourceFlowManager.getInstance(); // Use getInstance instead of new
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

/**
 * Integrates resource logic with module events.
 */
export function initializeResourceIntegration(): void {
  // Cast event strings to ModuleEventType for subscribe
  moduleEventBus.subscribe('MODULE_CREATED' as ModuleEventType, event => {
    if (isModuleEventWithId(event)) {
      // initializeResourceState(event.moduleId, ResourceType.ENERGY, { current: 0, max: 1000, capacity: 1000 });
    }
  });

  moduleEventBus.subscribe('MODULE_ACTIVATED' as ModuleEventType, event => {
    if (isModuleEventWithId(event)) {
      // Placeholder
    }
  });

  moduleEventBus.subscribe('MODULE_DEACTIVATED' as ModuleEventType, event => {
    if (isModuleEventWithId(event)) {
      // Placeholder
    }
  });

  moduleEventBus.subscribe('RESOURCE_PRODUCED' as ModuleEventType, event => {
    if (isResourceEvent(event)) {
      const { moduleId, resourceType, amount } = event;
      const currentState =
        resourceFlowManager.getNodeResourceState(moduleId, resourceType) ??
        createDefaultResourceState();
      const newAmount = currentState.current + amount;
      const newState: ResourceState = {
        ...currentState,
        current: currentState.max !== undefined ? Math.min(currentState.max, newAmount) : newAmount,
        capacity: currentState.capacity ?? 1000,
        min: currentState.min ?? 0,
        production: currentState.production ?? 0,
        consumption: currentState.consumption ?? 0,
        rate: currentState.rate ?? 0,
        value: currentState.value ?? 0,
      };
      resourceFlowManager.updateNodeResourceState(moduleId, resourceType, newState);
    }
  });

  moduleEventBus.subscribe('RESOURCE_CONSUMED' as ModuleEventType, event => {
    if (isResourceEvent(event)) {
      const { moduleId, resourceType, amount } = event;
      const currentState =
        resourceFlowManager.getNodeResourceState(moduleId, resourceType) ??
        createDefaultResourceState();
      const consumedAmount = Math.min(currentState.current, amount);
      if (consumedAmount > 0) {
        const newState: ResourceState = {
          ...currentState,
          current: currentState.current - consumedAmount,
          capacity: currentState.capacity ?? 1000,
          min: currentState.min ?? 0,
          production: currentState.production ?? 0,
          consumption: currentState.consumption ?? 0,
          rate: currentState.rate ?? 0,
          value: currentState.value ?? 0,
        };
        resourceFlowManager.updateNodeResourceState(moduleId, resourceType, newState);
      }
    }
  });

  // Removed RESOURCE_TRANSFER_REQUESTED subscriber
}

// Helper function to initialize resource state
function initializeResourceState(
  moduleId: string,
  resourceType: ResourceType,
  state: Partial<ResourceState>
): void {
  const currentState =
    resourceFlowManager.getNodeResourceState(moduleId, resourceType) ??
    createDefaultResourceState();
  const newState: ResourceState = {
    current: state.current ?? currentState.current ?? 0,
    max: state.max ?? currentState.max ?? Infinity,
    capacity: state.capacity ?? currentState.capacity ?? 1000,
    min: state.min ?? currentState.min ?? 0,
    production: state.production ?? currentState.production ?? 0,
    consumption: state.consumption ?? currentState.consumption ?? 0,
    rate: state.rate ?? currentState.rate ?? 0,
    value: state.value ?? currentState.value ?? 0,
  };
  resourceFlowManager.updateNodeResourceState(moduleId, resourceType, newState);
}

// Default state helper
function createDefaultResourceState(): ResourceState {
  return {
    current: 0,
    max: Infinity,
    production: 0,
    consumption: 0,
    rate: 0,
    min: 0,
    value: 0,
    capacity: 1000,
  };
}

// Type guards using unknown and 'in' operator
function isModuleEventWithId(event: unknown): event is { moduleId: string } {
  return (
    typeof event === 'object' &&
    event !== null &&
    'moduleId' in event &&
    typeof (event as { moduleId: unknown }).moduleId === 'string'
  );
}

function isResourceEvent(
  event: unknown
): event is { moduleId: string; resourceType: ResourceType; amount: number } {
  return (
    typeof event === 'object' &&
    event !== null &&
    'moduleId' in event &&
    typeof (event as { moduleId: unknown }).moduleId === 'string' &&
    'resourceType' in event &&
    Object.values(ResourceType).includes(
      (event as { resourceType: unknown }).resourceType as ResourceType
    ) &&
    'amount' in event &&
    typeof (event as { amount: unknown }).amount === 'number'
  );
}

function isResourceTransferEvent(
  event: unknown
): event is {
  sourceModuleId: string;
  targetModuleId: string;
  resourceType: ResourceType;
  amount: number;
} {
  return (
    typeof event === 'object' &&
    event !== null &&
    'sourceModuleId' in event &&
    typeof (event as { sourceModuleId: unknown }).sourceModuleId === 'string' &&
    'targetModuleId' in event &&
    typeof (event as { targetModuleId: unknown }).targetModuleId === 'string' &&
    'resourceType' in event &&
    Object.values(ResourceType).includes(
      (event as { resourceType: unknown }).resourceType as ResourceType
    ) &&
    'amount' in event &&
    typeof (event as { amount: unknown }).amount === 'number'
  );
}

// Removed all transfer logic and example code causing promise errors

// initializeResourceIntegration(); // Call during setup

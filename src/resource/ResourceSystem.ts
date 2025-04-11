import { eventSystem } from '../lib/events/UnifiedEventSystem';
import { Singleton } from '../lib/patterns/Singleton';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../services/ErrorLoggingService';
import { ModuleType } from '../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../types/events/EventTypes';
import { ResourceState, ResourceTransfer } from '../types/resources/ResourceTypes';
import {
  ensureStringResourceType,
  toStringResourceType,
} from '../utils/resources/ResourceTypeConverter';
import { ResourceType } from './../types/resources/ResourceTypes';
import { ResourceFlowSubsystem } from './subsystems/ResourceFlowSubsystem';
import { ResourceStorageSubsystem } from './subsystems/ResourceStorageSubsystem';
import { ResourceThresholdSubsystem } from './subsystems/ResourceThresholdSubsystem';
import { ResourceTransferSubsystem } from './subsystems/ResourceTransferSubsystem';

/**
 * Configuration options for the resource system
 */
export interface ResourceSystemConfig {
  /** Time to live for resource cache in milliseconds */
  cacheTTL: number;
  /** Interval for optimization in milliseconds */
  optimizationInterval: number;
  /** Batch size for processing large networks */
  batchSize: number;
  /** Whether to use Web Worker offloading for large networks */
  useWorkerOffloading: boolean;
  /** Whether to use spatial partitioning for geographical networks */
  useSpatialPartitioning: boolean;
  /** Storage allocation strategy */
  defaultAllocationStrategy: 'balanced' | 'prioritized' | 'dedicated';
  /** How to handle storage overflow */
  overflowPolicy: 'reject' | 'redistribute' | 'convert' | 'discard';
  /** Whether to automatically rebalance storage */
  autoRebalance: boolean;
  /** Maximum history size */
  maxHistorySize: number;
}

/**
 * Unified Resource Management System
 *
 * This system consolidates multiple resource-related managers into a cohesive architecture
 * with specialized subsystems for different aspects of resource management:
 *
 * - Storage: Manages resource storage containers and allocation
 * - Flow: Optimizes resource flow through the network
 * - Transfer: Handles resource transfers between entities
 * - Threshold: Monitors resource levels and triggers actions when thresholds are reached
 */
export class ResourceSystem extends Singleton<ResourceSystem> {
  // Configuration
  private config: ResourceSystemConfig;

  // Subsystems
  private storage: ResourceStorageSubsystem;
  private flow: ResourceFlowSubsystem;
  private transfer: ResourceTransferSubsystem;
  private threshold: ResourceThresholdSubsystem;

  // Resource state cache
  private resourceCache: Map<
    ResourceType,
    {
      state: ResourceState;
      lastUpdated: number;
      expiresAt: number;
    }
  > = new Map();

  // Processing state
  private optimizationInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  public constructor(config?: Partial<ResourceSystemConfig>) {
    super();
    // Initialize with default or provided configuration
    this.config = {
      cacheTTL: config?.cacheTTL ?? 5000,
      optimizationInterval: config?.optimizationInterval ?? 10000,
      batchSize: config?.batchSize ?? 100,
      useWorkerOffloading: config?.useWorkerOffloading ?? false,
      useSpatialPartitioning: config?.useSpatialPartitioning ?? false,
      defaultAllocationStrategy: config?.defaultAllocationStrategy ?? 'balanced',
      overflowPolicy: config?.overflowPolicy ?? 'redistribute',
      autoRebalance: config?.autoRebalance ?? true,
      maxHistorySize: config?.maxHistorySize ?? 1000,
    };

    // Initialize subsystems
    this.storage = new ResourceStorageSubsystem(this, this.config);
    this.flow = new ResourceFlowSubsystem(this, this.config);
    this.transfer = new ResourceTransferSubsystem(this, this.config);
    this.threshold = new ResourceThresholdSubsystem(this, this.config);

    this.initializeEventSubscriptions();
  }

  /**
   * Initialize event subscriptions between subsystems
   */
  private initializeEventSubscriptions(): void {
    // Listen for threshold events
    eventSystem.subscribe(EventType.RESOURCE_THRESHOLD_TRIGGERED, event => {
      console.warn('Resource threshold reached:', event);
      // Additional handling as needed
    });

    // Listen for storage overflow events
    eventSystem.subscribe(EventType.RESOURCE_SHORTAGE, event => {
      console.warn('Resource storage overflow:', event);
      // Handle overflow according to policy
      if (event?.data && typeof event?.data === 'object') {
        const { resourceType, amount, containerId } = event?.data as {
          resourceType: ResourceType;
          amount: number;
          containerId: string;
        };
        this.handleStorageOverflow(resourceType, amount, containerId);
      }
    });

    // Listen for resource state changes
    eventSystem.subscribe(EventType.RESOURCE_UPDATED, event => {
      // Invalidate cache for the resource type
      if (event?.data && typeof event?.data === 'object') {
        const { resourceType } = event?.data as { resourceType: ResourceType };
        this.resourceCache.delete(resourceType);
      }
    });
  }

  /**
   * Initialize the resource system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize all subsystems
      await this.storage.initialize();
      await this.flow.initialize();
      await this.transfer.initialize();
      await this.threshold.initialize();

      // Start optimization interval
      this.startOptimizationInterval();

      this.isInitialized = true;
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Failed to initialize ResourceSystem'),
        ErrorType.INITIALIZATION,
        ErrorSeverity.CRITICAL,
        { componentName: 'ResourceSystem', action: 'initialize' }
      );
      throw error;
    }
  }

  /**
   * Dispose of the resource system
   */
  public async dispose(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Stop optimization interval
      if (this.optimizationInterval) {
        clearInterval(this.optimizationInterval);
        this.optimizationInterval = null;
      }

      // Dispose all subsystems in reverse order
      await this.threshold.dispose();
      await this.transfer.dispose();
      await this.flow.dispose();
      await this.storage.dispose();

      // Clear cache
      this.resourceCache.clear();

      this.isInitialized = false;
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Failed to dispose ResourceSystem'),
        ErrorType.RUNTIME,
        ErrorSeverity.HIGH,
        { componentName: 'ResourceSystem', action: 'dispose' }
      );
      throw error;
    }
  }

  /**
   * Start the optimization interval
   */
  private startOptimizationInterval(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }

    this.optimizationInterval = setInterval(() => {
      this.flow.optimizeFlows().catch(error => {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error('Error in flow optimization'),
          ErrorType.RUNTIME,
          ErrorSeverity.MEDIUM,
          { componentName: 'ResourceSystem', action: 'optimizeFlowsInterval' }
        );
      });
    }, this.config.optimizationInterval);
  }

  /**
   * Handles resource overflow according to the configured policy
   *
   * @param type The resource type that overflowed
   * @param amount The amount of overflow
   * @param sourceId The ID of the source container
   */
  private handleStorageOverflow(type: ResourceType, amount: number, sourceId: string): void {
    // Ensure type is enum ResourceType
    const resourceType = ensureStringResourceType(type);

    // Convert to string type for subsystems that still use string-based types
    const stringType = toStringResourceType(resourceType as ResourceType);

    switch (this.config.overflowPolicy) {
      case 'redistribute': {
        // Find other containers with available space
        this.storage.redistributeOverflow(stringType as ResourceType, amount, sourceId);
        break;
      }
      case 'convert': {
        // Convert to another resource type if possible
        // For example, excess energy might be converted to heat
        const alternativeType = this.getAlternativeResourceType(resourceType as ResourceType);
        if (alternativeType) {
          this.convertResources(
            resourceType as ResourceType,
            amount,
            alternativeType,
            amount * 0.5, // Conversion ratio
            sourceId
          );
        }
        break;
      }
      case 'discard': {
        // Simply discard the excess resources
        const event: BaseEvent & { type: string } = {
          type: EventType.RESOURCE_CONSUMED,
          timestamp: Date.now(),
          moduleId: sourceId,
          moduleType: 'resource-manager' as ModuleType,
          data: {
            resourceType: resourceType as ResourceType,
            amount,
            sourceId,
          },
        };
        eventSystem.publish(event);
        break;
      }
      case 'reject':
      default: {
        // Reject the overflow (do nothing, it's handled by the caller)
        const event: BaseEvent & { type: string } = {
          type: EventType.RESOURCE_SHORTAGE,
          timestamp: Date.now(),
          moduleId: sourceId,
          moduleType: 'resource-manager' as ModuleType,
          data: {
            resourceType,
            amount,
            sourceId,
          },
        };
        eventSystem.publish(event);
        break;
      }
    }
  }

  /**
   * Gets an alternative resource type for conversion
   * This is a simple example - in a real implementation, this would be more sophisticated
   *
   * @param type The original resource type
   * @returns An alternative resource type, or undefined if none available
   */
  private getAlternativeResourceType(type: ResourceType): ResourceType | undefined {
    // Simple mapping of resource types to alternatives
    const alternatives: Partial<Record<ResourceType, ResourceType>> = {
      [ResourceType.ENERGY]: ResourceType.PLASMA,
      [ResourceType.MINERALS]: ResourceType.IRON,
      [ResourceType.WATER]: ResourceType.ENERGY,
      [ResourceType.POPULATION]: ResourceType.RESEARCH,
      [ResourceType.RESEARCH]: ResourceType.ENERGY,
      [ResourceType.PLASMA]: ResourceType.ENERGY,
      [ResourceType.GAS]: ResourceType.ENERGY,
      [ResourceType.EXOTIC]: ResourceType.DARK_MATTER,
      [ResourceType.IRON]: ResourceType.MINERALS,
      [ResourceType.COPPER]: ResourceType.MINERALS,
      [ResourceType.TITANIUM]: ResourceType.MINERALS,
      [ResourceType.URANIUM]: ResourceType.ENERGY,
      [ResourceType.HELIUM]: ResourceType.GAS,
      [ResourceType.DEUTERIUM]: ResourceType.ENERGY,
      [ResourceType.ANTIMATTER]: ResourceType.ENERGY,
      [ResourceType.DARK_MATTER]: ResourceType.EXOTIC,
      [ResourceType.EXOTIC_MATTER]: ResourceType.EXOTIC,
    };

    return alternatives[type];
  }

  /**
   * Gets the current state of a resource
   *
   * @param type The resource type
   * @returns The resource state, or undefined if not found
   */
  public getResourceState(type: ResourceType): ResourceState | undefined {
    // Ensure type is enum ResourceType
    const resourceType = ensureStringResourceType(type);

    // Convert to string type for subsystems that still use string-based types
    const stringType = toStringResourceType(resourceType as ResourceType);

    // Check cache first
    const cached = this.resourceCache.get(resourceType as ResourceType);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.state;
    }

    // Cache miss or expired, get fresh state from flow subsystem
    const state = this.flow.getResourceState(stringType as ResourceType);

    if (state) {
      // Update cache
      this.resourceCache.set(resourceType as ResourceType, {
        state,
        lastUpdated: now,
        expiresAt: now + this.config.cacheTTL,
      });
      return state;
    }

    return undefined;
  }

  /**
   * Updates the state of a resource
   *
   * @param type The resource type
   * @param state The new resource state
   */
  public updateResourceState(type: ResourceType, state: ResourceState): void {
    // Ensure type is enum ResourceType
    const resourceType = ensureStringResourceType(type);

    // Convert to string type for subsystems that still use string-based types
    const stringType = toStringResourceType(resourceType as ResourceType);

    // Update in flow subsystem
    this.flow.updateResourceState(stringType as ResourceType, state);
    this.invalidateCache(resourceType as ResourceType);

    // Notify threshold subsystem of the update
    if (state && typeof state === 'object') {
      this.threshold.checkThresholds(stringType as ResourceType, state);
    }
  }

  /**
   * Invalidates the cache for a resource type
   *
   * @param type The resource type to invalidate
   */
  private invalidateCache(type: ResourceType): void {
    // Ensure type is enum ResourceType
    const resourceType = ensureStringResourceType(type);
    this.resourceCache.delete(resourceType as ResourceType);
  }

  /**
   * Get the current resource total
   */
  public getResourceTotal(type: ResourceType): number {
    const state = this.getResourceState(type);
    return state?.current ?? 0;
  }

  /**
   * Get the storage subsystem
   */
  public getStorageSubsystem(): ResourceStorageSubsystem {
    return this.storage;
  }

  /**
   * Get the flow subsystem
   */
  public getFlowSubsystem(): ResourceFlowSubsystem {
    return this.flow;
  }

  /**
   * Get the transfer subsystem
   */
  public getTransferSubsystem(): ResourceTransferSubsystem {
    return this.transfer;
  }

  /**
   * Get the threshold subsystem
   */
  public getThresholdSubsystem(): ResourceThresholdSubsystem {
    return this.threshold;
  }

  /**
   * Check if a resource exists
   */
  public hasResource(type: ResourceType): boolean {
    return this.getResourceTotal(type) > 0;
  }

  /**
   * Check if a resource has at least the specified amount
   */
  public hasResourceAmount(type: ResourceType, amount: number): boolean {
    return this.getResourceTotal(type) >= amount;
  }

  /**
   * Get available resource space
   */
  public getAvailableSpace(type: ResourceType): number {
    const state = this.getResourceState(type);
    if (!state) {
      return 0;
    }
    return Math.max(0, state.max - state.current);
  }

  /**
   * Store a resource
   */
  public storeResource(type: ResourceType, amount: number, targetId?: string): number {
    // Convert to string type for subsystems that still use string-based types
    const stringType = toStringResourceType(type);

    if (targetId) {
      return this.storage.storeResource(targetId, stringType as ResourceType, amount);
    } else {
      return this.storage.storeResourceOptimal(stringType as ResourceType, amount);
    }
  }

  /**
   * Retrieve a resource
   */
  public retrieveResource(type: ResourceType, amount: number, sourceId?: string): number {
    // Convert to string type for subsystems that still use string-based types
    const stringType = toStringResourceType(type);

    if (sourceId) {
      return this.storage.retrieveResource(sourceId, stringType as ResourceType, amount);
    } else {
      return this.storage.retrieveResourceOptimal(stringType as ResourceType, amount);
    }
  }

  /**
   * Transfer resources between entities
   */
  public transferResource(
    type: ResourceType,
    amount: number,
    sourceId: string,
    targetId: string
  ): number {
    // Convert to string type for subsystems that still use string-based types
    const stringType = toStringResourceType(type as ResourceType);
    return this.transfer.transferResource(stringType as ResourceType, amount, sourceId, targetId);
  }

  /**
   * Register a resource flow
   */
  public registerResourceFlow(
    sourceId: string,
    targetId: string,
    type: ResourceType,
    rate: number
  ): boolean {
    // Convert to string type for subsystems that still use string-based types
    const stringType = toStringResourceType(type as ResourceType);
    return this.flow.registerResourceFlow(sourceId, targetId, stringType as ResourceType, rate);
  }

  /**
   * Convert resources from one type to another
   */
  public convertResources(
    inputType: ResourceType,
    inputAmount: number,
    outputType: ResourceType,
    outputAmount: number,
    sourceId: string
  ): boolean {
    // Retrieve the input resources
    const retrieved = this.retrieveResource(inputType, inputAmount, sourceId);
    if (retrieved < inputAmount) {
      // Not enough resources, return what was retrieved
      if (retrieved > 0) {
        this.storeResource(inputType, retrieved, sourceId);
      }
      return false;
    }

    // Store the output resources
    this.storeResource(outputType, outputAmount, sourceId);
    return true;
  }

  /**
   * Get all recent resource transfers
   */
  public getTransferHistory(): ResourceTransfer[] {
    return this.transfer.getTransferHistory();
  }

  /**
   * Get resource transfers for a specific type
   */
  public getTransfersByType(type: ResourceType): ResourceTransfer[] {
    // Convert to string type for subsystems that still use string-based types
    const stringType = toStringResourceType(type as ResourceType);
    return this.transfer.getTransfersByType(stringType as ResourceType);
  }
}

// Export default for easier imports
export default ResourceSystem.getInstance();

import { Singleton } from '../lib/patterns/Singleton';
import { eventSystem } from '../lib/events/UnifiedEventSystem';
import { ResourceState, ResourceTransfer, ResourceType } from '../types/resources/ResourceTypes';
import { ResourceStorageSubsystem } from './subsystems/ResourceStorageSubsystem';
import { ResourceFlowSubsystem } from './subsystems/ResourceFlowSubsystem';
import { ResourceTransferSubsystem } from './subsystems/ResourceTransferSubsystem';
import { ResourceThresholdSubsystem } from './subsystems/ResourceThresholdSubsystem';

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
 * Default configuration for the resource system
 */
const DEFAULT_CONFIG: ResourceSystemConfig = {
  cacheTTL: 2000,
  optimizationInterval: 5000,
  batchSize: 50,
  useWorkerOffloading: true,
  useSpatialPartitioning: true,
  defaultAllocationStrategy: 'balanced',
  overflowPolicy: 'redistribute',
  autoRebalance: true,
  maxHistorySize: 100
};

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
  
  protected constructor(config?: Partial<ResourceSystemConfig>) {
    super();
    // Merge provided config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };

    // Initialize subsystems
    this.storage = new ResourceStorageSubsystem(this, this.config);
    this.flow = new ResourceFlowSubsystem(this, this.config);
    this.transfer = new ResourceTransferSubsystem(this, this.config);
    this.threshold = new ResourceThresholdSubsystem(this, this.config);

    // Subscribe to subsystem events
    this.initializeEventSubscriptions();
  }

  /**
   * Initialize event subscriptions between subsystems
   */
  private initializeEventSubscriptions(): void {
    // Listen for threshold events
    eventSystem.subscribe('RESOURCE_THRESHOLD_REACHED', (event) => {
      console.log('Resource threshold reached:', event);
      // Additional handling as needed
    });

    // Listen for storage overflow events
    eventSystem.subscribe('RESOURCE_STORAGE_OVERFLOW', (event) => {
      console.log('Resource storage overflow:', event);
      // Handle overflow according to policy
      this.handleStorageOverflow(event.resourceType, event.amount, event.containerId);
    });
    
    // Listen for resource state changes
    eventSystem.subscribe('RESOURCE_STATE_CHANGED', (event) => {
      // Invalidate cache for the resource type
      this.resourceCache.delete(event.resourceType);
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
      console.error('Failed to initialize ResourceSystem:', error);
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
      console.error('Failed to dispose ResourceSystem:', error);
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
        console.error('Error in flow optimization:', error);
      });
    }, this.config.optimizationInterval);
  }

  /**
   * Handle storage overflow according to policy
   */
  private handleStorageOverflow(type: ResourceType, amount: number, sourceId: string): void {
    switch (this.config.overflowPolicy) {
      case 'redistribute':
        this.storage.redistributeOverflow(type, amount, sourceId);
        break;
      case 'convert':
        // Implementation will depend on conversion rules
        break;
      case 'discard':
        // Simply ignore the overflow
        break;
      default:
        // 'reject' is the default - no action needed
        break;
    }
  }

  /**
   * Get a resource state
   */
  public getResourceState(type: ResourceType): ResourceState | undefined {
    // Check cache first
    const now = Date.now();
    const cachedEntry = this.resourceCache.get(type);

    if (cachedEntry && now < cachedEntry.expiresAt) {
      return cachedEntry.state;
    }

    // Cache miss or expired, get from flow subsystem
    const state = this.flow.getResourceState(type);

    // Update cache if state exists
    if (state) {
      this.resourceCache.set(type, {
        state: { ...state }, // Clone to prevent reference issues
        lastUpdated: now,
        expiresAt: now + this.config.cacheTTL,
      });
    }

    return state;
  }

  /**
   * Update a resource state
   */
  public updateResourceState(type: ResourceType, state: ResourceState): void {
    // Update in flow subsystem
    this.flow.updateResourceState(type, state);

    // Invalidate cache
    this.invalidateCache(type);

    // Check thresholds
    this.threshold.checkThresholds(type, state);
  }

  /**
   * Invalidate cache for a resource type
   */
  private invalidateCache(type: ResourceType): void {
    this.resourceCache.delete(type);
  }

  /**
   * Get the current resource total
   */
  public getResourceTotal(type: ResourceType): number {
    const state = this.getResourceState(type);
    return state?.current || 0;
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
    if (targetId) {
      return this.storage.storeResource(targetId, type, amount);
    } else {
      return this.storage.storeResourceOptimal(type, amount);
    }
  }

  /**
   * Retrieve a resource
   */
  public retrieveResource(type: ResourceType, amount: number, sourceId?: string): number {
    if (sourceId) {
      return this.storage.retrieveResource(sourceId, type, amount);
    } else {
      return this.storage.retrieveResourceOptimal(type, amount);
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
    return this.transfer.transferResource(type, amount, sourceId, targetId);
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
    return this.flow.registerResourceFlow(sourceId, targetId, type, rate);
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
    return this.transfer.getTransfersByType(type);
  }
}

// Export singleton instance
export const resourceSystem = ResourceSystem.getInstance();

// Export default for easier imports
export default resourceSystem;
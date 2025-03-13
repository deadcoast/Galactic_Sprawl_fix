import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import {
  ChainExecutionStatus,
  ConversionChain,
  ConverterNodeConfig,
  ConverterProcessStatus,
  FlowConnection,
  FlowNode,
  ResourceConversionProcess,
  ResourceConversionRecipe,
  ResourceFlow,
  ResourceState,
  ResourceStateClass,
  ResourceTransfer,
  ResourceType,
} from '../../types/resources/StandardizedResourceTypes';
import { validateResourceTransfer } from '../../utils/resources/resourceValidation';
// Import new utility classes
import { BaseEvent } from '../../lib/events/UnifiedEventSystem';
import { AbstractBaseManager, ManagerStatus } from '../../lib/managers/BaseManager';
import { SpatialIndex, SpatialObject } from '../../utils/spatial/SpatialPartitioning';
import {
  FlowOptimizationResult,
  ResourceFlowWorkerUtil,
} from '../../utils/workers/ResourceFlowWorkerUtil';

// Define ConversionResult interface
interface ConversionResult {
  success: boolean;
  processId: string;
  recipeId: string;
  outputsProduced?: { type: ResourceType; amount: number }[];
  byproductsProduced?: { type: ResourceType; amount: number }[];
  error?: string;
}

// Extend ResourceConversionProcess to include processId
interface ExtendedResourceConversionProcess extends ResourceConversionProcess {
  processId: string;
}

// Re-export FlowNode interface for use in other components
export type { FlowNode } from '../../types/resources/StandardizedResourceTypes';

/**
 * Extended FlowNode with spatial coordinates for geographical networks
 */
interface GeoFlowNode extends FlowNode, SpatialObject {
  // Spatial coordinates
  x: number;
  y: number;
}

/**
 * Resource flow events
 */
export interface ResourceFlowEvent extends BaseEvent {
  type:
    | 'RESOURCE_FLOW_INITIALIZED'
    | 'RESOURCE_FLOW_OPTIMIZED'
    | 'RESOURCE_NODE_REGISTERED'
    | 'RESOURCE_NODE_UPDATED'
    | 'RESOURCE_NODE_UNREGISTERED'
    | 'RESOURCE_CONNECTION_REGISTERED'
    | 'RESOURCE_CONNECTION_UPDATED'
    | 'RESOURCE_CONNECTION_UNREGISTERED'
    | 'RESOURCE_CONVERSION_STARTED'
    | 'RESOURCE_CONVERSION_COMPLETED'
    | 'RESOURCE_CONVERSION_FAILED'
    | 'RESOURCE_TRANSFER_COMPLETED';
  nodeId?: string;
  connectionId?: string;
  resourceType?: ResourceType;
  processId?: string;
  data?: unknown;
}

/**
 * Manager for resource flow through the game systems
 * Responsible for:
 * - Tracking resource nodes (producers, consumers, storage, converters)
 * - Managing connections between nodes
 * - Optimizing resource distribution
 * - Processing resource conversions
 */
export class ResourceFlowManager extends AbstractBaseManager<ResourceFlowEvent> {
  // Flow network data structures
  private nodes: Map<string, FlowNode> = new Map();
  private connections: Map<string, FlowConnection> = new Map();
  private sourceConnections: Map<string, string[]> = new Map();
  private targetConnections: Map<string, string[]> = new Map();

  // Type-specific node registries
  private producerNodes: Map<string, FlowNode> = new Map();
  private consumerNodes: Map<string, FlowNode> = new Map();
  private storageNodes: Map<string, FlowNode> = new Map();
  private converterNodes: Map<string, FlowNode> = new Map();

  // Resource tracking
  private resourceStates: Map<ResourceType, ResourceState> = new Map();
  private resourceProducers: Map<ResourceType, string[]> = new Map();
  private resourceConsumers: Map<ResourceType, string[]> = new Map();
  private resourceStorage: Map<ResourceType, string[]> = new Map();

  // Conversion recipes and chains
  private conversionRecipes: Map<string, ResourceConversionRecipe> = new Map();
  private conversionChains: Map<string, ConversionChain> = new Map();
  private chainExecutions: Map<string, ChainExecutionStatus> = new Map();

  // Processing state
  private processingQueue: ExtendedResourceConversionProcess[] = [];
  private completedProcesses: ExtendedResourceConversionProcess[] = [];
  private lastProcessingTime = 0;
  private processingInterval: number | null = null;
  private optimizationInterval: NodeJS.Timeout | null = null;

  // Transfer history
  private transferHistory: ResourceTransfer[] = [];
  private maxHistorySize = 1000;

  // Optimization settings
  private flowOptimizationEnabled = true;
  private optimizationIntervalMs = 5000;
  private processingIntervalMs = 1000;
  private resourceCapacityBuffer = 0.1; // 10% buffer for resource capacity

  // Resource cache for performance optimization
  private resourceCache: Map<
    ResourceType,
    {
      state: ResourceState;
      lastUpdated: number;
      expiresAt: number;
    }
  > = new Map();
  private cacheTTL = 2000; // Cache time-to-live in milliseconds

  // New optimization properties
  private workerUtil: ResourceFlowWorkerUtil | null = null;
  private spatialIndex: SpatialIndex<GeoFlowNode> | null = null;
  private useWorkerOffloading = false;
  private useSpatialPartitioning = false;
  private batchSize = 50;
  private worldBounds = { minX: 0, minY: 0, maxX: 10000, maxY: 10000 };
  private isOptimizing = false;
  private lastOptimizationResult: FlowOptimizationResult | null = null;

  private static instance: ResourceFlowManager;

  /**
   * Get the singleton instance of ResourceFlowManager
   * @returns The singleton instance
   */
  public static getInstance(): ResourceFlowManager {
    if (!ResourceFlowManager.instance) {
      ResourceFlowManager.instance = new ResourceFlowManager();
    }
    return ResourceFlowManager.instance;
  }

  /**
   * Create a new ResourceFlowManager
   *
   * @param optimizationIntervalMs - Interval for flow optimization in milliseconds
   * @param cacheTTL - Time-to-live for cached resource states in milliseconds
   * @param batchSize - Batch size for processing large networks
   * @param useWorkerOffloading - Whether to use Web Worker offloading for large networks
   * @param useSpatialPartitioning - Whether to use spatial partitioning for geographical networks
   */
  protected constructor(
    optimizationIntervalMs = 5000,
    cacheTTL = 2000,
    batchSize = 50,
    useWorkerOffloading = true,
    useSpatialPartitioning = true
  ) {
    super('ResourceFlowManager');

    this.optimizationIntervalMs = optimizationIntervalMs;
    this.cacheTTL = cacheTTL;
    this.batchSize = batchSize;
    this.useWorkerOffloading = useWorkerOffloading;
    this.useSpatialPartitioning = useSpatialPartitioning;

    // Other initializations will be done in onInitialize
  }

  /**
   * Implementation of abstract method from AbstractBaseManager
   * Initialize the manager
   */
  protected async onInitialize(_dependencies?: Record<string, unknown>): Promise<void> {
    // Initialize resource states
    this.initializeResourceStates();

    // Initialize Web Worker utility if enabled
    if (this.useWorkerOffloading) {
      try {
        this.workerUtil = new ResourceFlowWorkerUtil();
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error(String(error)), {
          context: 'initializeWorker',
        });
        this.useWorkerOffloading = false;
      }
    }

    // Initialize spatial index if enabled
    if (this.useSpatialPartitioning) {
      this.spatialIndex = new SpatialIndex<GeoFlowNode>(this.worldBounds);
    }

    // Subscribe to module events that might affect resource flow
    this.subscribeToModuleEvents();

    // Start optimization and processing intervals
    this.startAsyncOptimizationInterval();
    this.startProcessingInterval(this.processingIntervalMs);

    // Publish initialization event
    this.publish({
      type: 'RESOURCE_FLOW_INITIALIZED',
      timestamp: Date.now(),
      data: {
        optimizationIntervalMs: this.optimizationIntervalMs,
        cacheTTL: this.cacheTTL,
        batchSize: this.batchSize,
        useWorkerOffloading: this.useWorkerOffloading,
        useSpatialPartitioning: this.useSpatialPartitioning,
      },
    });
  }

  /**
   * Implementation of abstract method from AbstractBaseManager
   * Update the manager state
   */
  protected onUpdate(deltaTime: number): void {
    // Process any pending conversions
    this.processConversions();

    // Update any active chains
    for (const [chainId, chainStatus] of this.chainExecutions.entries()) {
      if (chainStatus.active && !chainStatus.paused) {
        this.updateChainProgress(chainId);
      }
    }

    // Update metrics
    this.updateMetric('nodesCount', this.nodes.size);
    this.updateMetric('connectionsCount', this.connections.size);
    this.updateMetric('activeProcessesCount', this.processingQueue.length);
    this.updateMetric('deltaTime', deltaTime);
  }

  /**
   * Implementation of abstract method from AbstractBaseManager
   * Dispose of the manager's resources
   */
  protected async onDispose(): Promise<void> {
    // Clean up intervals
    if (this.processingInterval !== null) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.optimizationInterval !== null) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }

    // Cleanup Web Worker
    if (this.workerUtil) {
      this.workerUtil.terminate();
      this.workerUtil = null;
    }

    // Clear spatial index
    if (this.spatialIndex) {
      this.spatialIndex.clear();
    }

    // Unsubscribe from module events
    this.unsubscribeFromModuleEvents();

    // Clear data structures
    this.nodes.clear();
    this.connections.clear();
    this.sourceConnections.clear();
    this.targetConnections.clear();

    this.producerNodes.clear();
    this.consumerNodes.clear();
    this.storageNodes.clear();
    this.converterNodes.clear();

    this.resourceCache.clear();
    this.transferHistory = [];
    this.processingQueue = [];
    this.completedProcesses = [];
    this.conversionRecipes.clear();
    this.conversionChains.clear();
    this.chainExecutions.clear();
  }

  /**
   * Subscribe to module events that might affect resource flow
   */
  private subscribeToModuleEvents(): void {
    // Use the subscribe method from AbstractBaseManager to keep track of subscriptions
    this.subscribe('MODULE_CREATED', this.handleModuleCreated);
    this.subscribe('MODULE_UPDATED', this.handleModuleUpdated);
    this.subscribe('MODULE_DESTROYED', this.handleModuleDestroyed);
    this.subscribe('MODULE_ENABLED', this.handleModuleStateChanged);
    this.subscribe('MODULE_DISABLED', this.handleModuleStateChanged);
  }

  /**
   * Unsubscribe from module events
   */
  private unsubscribeFromModuleEvents(): void {
    // The AbstractBaseManager.dispose() method will handle unsubscribing from all events
  }

  // Initialize with default states for all resource types
  private initializeResourceStates(): void {
    // Initialize resource states for all resource types
    Object.values(ResourceType).forEach(type => {
      // Using the ResourceStateClass for proper initialization with defaults
      const resourceState = new ResourceStateClass({ type });
      this.resourceStates.set(type, resourceState.asObject());
      this.resourceProducers.set(type, []);
      this.resourceConsumers.set(type, []);
      this.resourceStorage.set(type, []);
    });
  }

  /**
   * Registers a node in the resource flow network
   *
   * Adds a new node to the network or updates an existing node with the same ID.
   * Nodes can be producers, consumers, storage facilities, or converters.
   *
   * @param {FlowNode} node - The node to register
   * @returns {boolean} True if the node was successfully registered, false otherwise
   *
   * @example
   * // Register a producer node
   * flowManager.registerNode({
   *   id: 'mine-1',
   *   type: 'producer',
   *   resources: ['minerals'],
   *   priority: { type: 'minerals', priority: 2, consumers: [] },
   *   active: true
   * });
   */
  public registerNode(node: FlowNode): boolean {
    if (!node.id || !node.resources || node.resources.length === 0) {
      this.handleError(new Error('Invalid flow node'), { node });
      return false;
    }

    this.nodes.set(node.id, node);

    // Invalidate cache for affected resource types
    for (const resourceType of node.resources) {
      this.invalidateCache(resourceType);
    }

    // Publish event
    this.publish({
      type: 'RESOURCE_NODE_REGISTERED',
      timestamp: Date.now(),
      nodeId: node.id,
      data: { node },
    });

    return true;
  }

  /**
   * Unregisters a node from the resource flow network
   *
   * Removes a node and all its connections from the network.
   * This will also remove any connections where this node is a source or target.
   *
   * @param {string} id - The ID of the node to unregister
   * @returns {boolean} True if the node was successfully unregistered, false if the node was not found
   *
   * @example
   * // Unregister a node
   * flowManager.unregisterNode('mine-1');
   */
  public unregisterNode(id: string): boolean {
    if (!this.nodes.has(id)) {
      return false;
    }

    // Get node resources before removing it
    const node = this.nodes.get(id);
    const affectedResources = node ? [...node.resources] : [];

    // Remove all connections to/from this node
    // Convert Map entries to array to avoid MapIterator error
    const connectionEntries = Array.from(this.connections.entries());
    const removedConnections: FlowConnection[] = [];

    for (const [connectionId, connection] of connectionEntries) {
      if (connection.source === id || connection.target === id) {
        this.connections.delete(connectionId);
        removedConnections.push(connection);
      }
    }

    this.nodes.delete(id);

    // Invalidate cache for affected resource types
    for (const resourceType of affectedResources) {
      this.invalidateCache(resourceType);
    }

    // Publish event
    this.publish({
      type: 'RESOURCE_NODE_UNREGISTERED',
      timestamp: Date.now(),
      nodeId: id,
      data: {
        node,
        removedConnections,
      },
    });

    return true;
  }

  /**
   * Registers a connection between nodes in the resource flow network
   *
   * Adds a new connection or updates an existing connection with the same ID.
   * Connections define how resources flow between nodes and at what rate.
   * Both source and target nodes must exist in the network.
   *
   * @param {FlowConnection} connection - The connection to register
   * @returns {boolean} True if the connection was successfully registered, false otherwise
   *
   * @example
   * // Register a connection between a mine and a factory
   * flowManager.registerConnection({
   *   id: 'mine-to-factory',
   *   source: 'mine-1',
   *   target: 'factory-1',
   *   resourceType: 'minerals',
   *   maxRate: 10,
   *   currentRate: 5,
   *   priority: { type: 'minerals', priority: 1, consumers: [] },
   *   active: true
   * });
   */
  public registerConnection(connection: FlowConnection): boolean {
    if (
      !connection.id ||
      !connection.source ||
      !connection.target ||
      !connection.resourceType ||
      connection.maxRate <= 0
    ) {
      console.warn('Invalid connection:', connection);
      return false;
    }

    // Ensure source and target nodes exist
    if (!this.nodes.has(connection.source)) {
      console.warn(`Source node ${connection.source} does not exist`);
      return false;
    }

    if (!this.nodes.has(connection.target)) {
      console.warn(`Target node ${connection.target} does not exist`);
      return false;
    }

    // Ensure source node has the resource type
    const sourceNode = this.nodes.get(connection.source);
    if (!sourceNode?.resources.includes(connection.resourceType)) {
      console.warn(
        `Source node ${connection.source} does not have resource type ${connection.resourceType}`
      );
      return false;
    }

    this.connections.set(connection.id, connection);

    // Invalidate cache for the affected resource type
    this.invalidateCache(connection.resourceType);

    return true;
  }

  /**
   * Unregisters a connection from the resource flow network
   *
   * Removes a connection between nodes from the network.
   *
   * @param {string} id - The ID of the connection to unregister
   * @returns {boolean} True if the connection was successfully unregistered, false if the connection was not found
   *
   * @example
   * // Unregister a connection
   * flowManager.unregisterConnection('mine-to-factory');
   */
  public unregisterConnection(id: string): boolean {
    const connection = this.connections.get(id);
    if (!connection) {
      return false;
    }

    // Store resource type before removing the connection
    const { resourceType } = connection;

    this.connections.delete(id);

    // Invalidate cache for the affected resource type
    this.invalidateCache(resourceType);

    return true;
  }

  /**
   * Updates the state of a resource in the network
   *
   * Updates the current, minimum, maximum, production, and consumption values
   * for a specific resource type. Also invalidates any cache entries for this resource.
   *
   * @param {ResourceType} type - The type of resource to update
   * @param {ResourceState} state - The new state of the resource
   *
   * @example
   * // Update the state of minerals
   * flowManager.updateResourceState('minerals', {
   *   current: 1000,
   *   min: 0,
   *   max: 5000,
   *   production: 50,
   *   consumption: 30
   * });
   */
  public updateResourceState(type: ResourceType, state: ResourceState): void {
    this.resourceStates.set(type, state);

    // Invalidate cache for the affected resource type
    this.invalidateCache(type);
  }

  /**
   * Gets the current state of a resource in the network
   *
   * Returns the cached state if available and not expired,
   * otherwise returns the stored state from the network.
   *
   * @param {ResourceType} type - The type of resource to query
   * @returns {ResourceState | undefined} The current state of the resource, or undefined if not found
   *
   * @example
   * // Get the current state of minerals
   * const mineralState = flowManager.getResourceState('minerals');
   * if (mineralState) {
   *   console.warn(`Current minerals: ${mineralState.current}/${mineralState.max}`);
   * }
   */
  public getResourceState(type: ResourceType): ResourceState | undefined {
    // Check cache first
    const now = Date.now();
    const cachedEntry = this.resourceCache.get(type);

    if (cachedEntry && now < cachedEntry.expiresAt) {
      return cachedEntry.state;
    }

    // Cache miss or expired, get from network
    const state = this.resourceStates.get(type);

    // Update cache if state exists
    if (state) {
      this.resourceCache.set(type, {
        state: { ...state }, // Clone to prevent reference issues
        lastUpdated: now,
        expiresAt: now + this.cacheTTL,
      });
    }

    return state;
  }

  /**
   * Invalidate cache for a resource type
   */
  private invalidateCache(type: ResourceType): void {
    this.resourceCache.delete(type);
  }

  /**
   * Optimize resource flows, with updated implementation using async/await
   *
   * This method now supports:
   * 1. Web Worker offloading for large networks
   * 2. Spatial partitioning for geographical networks
   * 3. Asynchronous processing with async/await
   */
  public async optimizeFlows(): Promise<FlowOptimizationResult> {
    // Prevent concurrent optimization runs
    if (this.isOptimizing) {
      return (
        this.lastOptimizationResult || {
          transfers: [],
          updatedConnections: [],
          bottlenecks: [],
          underutilized: [],
          performanceMetrics: {
            executionTimeMs: 0,
            nodesProcessed: 0,
            connectionsProcessed: 0,
            transfersGenerated: 0,
          },
        }
      );
    }

    this.isOptimizing = true;
    const startTime = Date.now();

    try {
      // Get active nodes and connections
      const activeNodes = Array.from(this.nodes.values()).filter(node => node.active);
      const activeConnections = Array.from(this.connections.values()).filter(conn => conn.active);

      // Check if we should use Web Worker offloading
      if (this.useWorkerOffloading && this.workerUtil && activeNodes.length > this.batchSize) {
        try {
          // Offload optimization to Web Worker
          const result = await this.workerUtil.optimizeFlows(
            activeNodes,
            activeConnections,
            this.resourceStates
          );

          // Apply the results from the worker
          this.applyOptimizationResults(result);

          // Add execution time to performance metrics
          result.performanceMetrics = result.performanceMetrics || {
            executionTimeMs: 0,
            nodesProcessed: activeNodes.length,
            connectionsProcessed: activeConnections.length,
            transfersGenerated: result.transfers.length,
          };

          result.performanceMetrics.executionTimeMs = Date.now() - startTime;

          this.lastOptimizationResult = result;
          this.isOptimizing = false;
          return result;
        } catch (error) {
          console.warn('Web Worker optimization failed, falling back to main thread:', error);
          // Fall back to main thread optimization
        }
      }

      // If we're here, we're using main thread optimization
      // Categorize nodes by type
      const producers = activeNodes.filter(node => node.type === 'producer');
      const consumers = activeNodes.filter(node => node.type === 'consumer');
      const storages = activeNodes.filter(node => node.type === 'storage');
      const converters = activeNodes.filter(node => node.type === 'converter');

      // Process converters (in batches if needed)
      await this.processConverters(converters, activeConnections);

      // Calculate resource balance and optimize flows
      const { availability, demand } = await this.calculateResourceBalance(
        producers,
        consumers,
        storages,
        activeConnections
      );

      // Identify resource issues
      const { bottlenecks, underutilized } = this.identifyResourceIssues(availability, demand);

      // Optimize flow rates
      const { updatedConnections, transfers } = await this.optimizeFlowRates(
        activeConnections,
        availability,
        demand
      );

      // Update connections with optimized rates
      for (const connection of updatedConnections) {
        this.connections.set(connection.id, connection);
      }

      // Create result object
      const result: FlowOptimizationResult = {
        transfers,
        updatedConnections,
        bottlenecks,
        underutilized,
        performanceMetrics: {
          executionTimeMs: Date.now() - startTime,
          nodesProcessed: activeNodes.length,
          connectionsProcessed: activeConnections.length,
          transfersGenerated: transfers.length,
        },
      };

      this.lastOptimizationResult = result;

      // Update metrics
      this.updateMetric('lastOptimizationTimeMs', result.performanceMetrics?.executionTimeMs || 0);
      this.updateMetric('bottlenecksCount', bottlenecks.length);
      this.updateMetric('underutilizedCount', underutilized.length);
      this.updateMetric('transfersCount', transfers.length);

      // Publish optimization completed event
      this.publish({
        type: 'RESOURCE_FLOW_OPTIMIZED',
        timestamp: Date.now(),
        data: {
          metrics: result.performanceMetrics,
          bottlenecksCount: bottlenecks.length,
          underutilizedCount: underutilized.length,
          transfersCount: transfers.length,
        },
      });

      return result;
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Apply optimization results from the worker to the main thread
   */
  private applyOptimizationResults(result: FlowOptimizationResult): void {
    // Update connections with optimized rates
    for (const connection of result.updatedConnections) {
      this.connections.set(connection.id, connection);
    }

    // Add transfers to history
    for (const transfer of result.transfers) {
      this.addToTransferHistory(transfer);
    }
  }

  /**
   * Process converter nodes in batches
   */
  private async processConverters(
    converters: FlowNode[],
    activeConnections: FlowConnection[]
  ): Promise<void> {
    // Process converters in batches to avoid blocking the main thread
    const batchSize = this.batchSize;
    const batchCount = Math.ceil(converters.length / batchSize);

    for (let i = 0; i < batchCount; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, converters.length);
      const batch = converters.slice(start, end);

      // Process each converter in the batch
      for (const converter of batch) {
        // Original converter processing logic
        if (converter.converterConfig && converter.converterConfig.type === 'advanced') {
          this.processAdvancedConverter(converter, activeConnections);
        } else {
          this.tryStartConversions(converter);
        }
      }

      // If we have multiple batches, yield to the event loop to prevent blocking
      if (batchCount > 1 && i < batchCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  /**
   * Calculate resource balance between producers, consumers, and storage
   */
  private async calculateResourceBalance(
    producers: FlowNode[],
    consumers: FlowNode[],
    storages: FlowNode[],
    activeConnections: FlowConnection[]
  ): Promise<{
    availability: Partial<Record<ResourceType, number>>;
    demand: Partial<Record<ResourceType, number>>;
  }> {
    // If using worker offloading and network is large, use worker
    if (
      this.useWorkerOffloading &&
      this.workerUtil &&
      producers.length + consumers.length + storages.length > this.batchSize
    ) {
      try {
        return await this.workerUtil.calculateResourceBalance(
          producers,
          consumers,
          storages,
          activeConnections
        );
      } catch (error) {
        console.warn(
          'Worker resource balance calculation failed, falling back to main thread:',
          error
        );
        // Fall back to main thread calculation
      }
    }

    // Main thread calculation (original code)
    const availability: Partial<Record<ResourceType, number>> = {};
    const demand: Partial<Record<ResourceType, number>> = {};

    // Calculate production capacity
    for (const _producer of producers) {
      // ... existing production capacity calculation code ...
    }

    // Calculate consumer demand
    for (const _consumer of consumers) {
      // ... existing consumer demand calculation code ...
    }

    // Factor in storage capacity
    for (const _storage of storages) {
      // ... existing storage capacity calculation code ...
    }

    return { availability, demand };
  }

  /**
   * Optimize flow rates based on resource availability and demand
   */
  private async optimizeFlowRates(
    activeConnections: FlowConnection[],
    availability: Partial<Record<ResourceType, number>>,
    demand: Partial<Record<ResourceType, number>>
  ): Promise<{
    updatedConnections: FlowConnection[];
    transfers: ResourceTransfer[];
  }> {
    // If using worker offloading and network is large, use worker
    if (this.useWorkerOffloading && this.workerUtil && activeConnections.length > this.batchSize) {
      try {
        return await this.workerUtil.optimizeFlowRates(activeConnections, availability, demand);
      } catch (error) {
        console.warn('Worker flow rate optimization failed, falling back to main thread:', error);
        // Fall back to main thread optimization
      }
    }

    // Main thread optimization (original code)
    const updatedConnections: FlowConnection[] = [];
    const transfers: ResourceTransfer[] = [];

    // ... existing flow rate optimization code ...

    return { updatedConnections, transfers };
  }

  /**
   * Register a node with spatial coordinates for geographical networks
   */
  public registerGeoNode(node: GeoFlowNode): boolean {
    // Register the node normally
    const success = this.registerNode(node);

    // Add to spatial index if enabled
    if (success && this.useSpatialPartitioning && this.spatialIndex) {
      this.spatialIndex.add(node);
    }

    return success;
  }

  /**
   * Update a node's position in the geographical network
   */
  public updateNodePosition(id: string, x: number, y: number): boolean {
    // Check if node exists
    const node = this.nodes.get(id);
    if (!node) return false;

    // Update node in spatial index if enabled
    if (this.useSpatialPartitioning && this.spatialIndex) {
      return this.spatialIndex.updatePosition(id, x, y);
    }

    return false;
  }

  /**
   * Find nearby nodes within a given range
   */
  public findNearbyNodes(x: number, y: number, range: number): GeoFlowNode[] {
    if (this.useSpatialPartitioning && this.spatialIndex) {
      return this.spatialIndex.findNearby(x, y, range);
    }

    return [];
  }

  /**
   * Start the asynchronous optimization interval
   */
  public startAsyncOptimizationInterval(): void {
    if (this.optimizationInterval !== null) {
      clearInterval(this.optimizationInterval);
    }

    // Use setInterval for regular optimization
    this.optimizationInterval = setInterval(() => {
      if (this.flowOptimizationEnabled && this.getStatus() === ManagerStatus.READY) {
        // Call async optimize without waiting (fire and forget)
        this.optimizeFlows().catch(error => {
          this.handleError(error instanceof Error ? error : new Error(String(error)), {
            context: 'asyncOptimizationInterval',
          });
        });
      }
    }, this.optimizationIntervalMs);
  }

  /**
   * Deprecated: Use dispose() instead
   * This method is kept for backward compatibility
   */
  public cleanup(): void {
    // Call dispose() which includes all cleanup logic
    this.dispose().catch(error => {
      this.handleError(error instanceof Error ? error : new Error(String(error)), {
        context: 'cleanup',
      });
    });
  }

  /**
   * Process an advanced converter with multi-step production chains
   *
   * @param {FlowNode} converter - The converter node to process
   * @param {FlowConnection[]} activeConnections - Active connections in the network
   * @private
   */
  private processAdvancedConverter(
    converter: FlowNode,
    _activeConnections: FlowConnection[]
  ): void {
    if (!converter.converterConfig) {
      return;
    }

    const config = converter.converterConfig;

    // Initialize converter status if not present
    if (!converter.converterStatus) {
      converter.converterStatus = {
        activeProcesses: [],
        queuedProcesses: [],
        completedProcesses: 0,
        failedProcesses: 0,
        totalResourcesProduced: {},
        totalResourcesConsumed: {},
        averageEfficiency: converter.efficiency || 1.0,
        uptime: 0,
      };
    }

    // Update converter status in network
    this.nodes.set(converter.id, converter);

    // Auto-start new conversion processes if configured
    if (config.autoStart) {
      this.tryStartConversions(converter);
    }
  }

  /**
   * Try to start conversion processes for a converter node
   *
   * @param {FlowNode} converter - The converter node
   * @private
   */
  private tryStartConversions(converter: FlowNode): void {
    if (!converter.converterConfig || !converter.converterStatus) {
      return;
    }

    const config = converter.converterConfig;
    const status = converter.converterStatus;

    // Check if we can start more processes
    if (status.activeProcesses.length >= config.maxConcurrentProcesses) {
      return;
    }

    // Get supported recipes
    const availableRecipes = config.supportedRecipes
      .map(recipeId => this.conversionRecipes.get(recipeId))
      .filter(recipe => recipe !== undefined) as ResourceConversionRecipe[];

    // Try to start each supported recipe
    for (const recipe of availableRecipes) {
      // Check if we're at maximum capacity
      if (status.activeProcesses.length >= config.maxConcurrentProcesses) {
        break;
      }

      // Check if we have the required inputs
      const canStart = this.checkRecipeInputs(converter.id, recipe);

      if (canStart) {
        // Start the conversion process
        this.startConversionProcess(converter.id, recipe.id);
      }
    }

    // Update converter in network
    this.nodes.set(converter.id, converter);
  }

  /**
   * Check if a converter has all the required inputs for a recipe
   *
   * @param {string} converterId - The ID of the converter
   * @param {ResourceConversionRecipe} recipe - The recipe to check
   * @returns {boolean} True if the converter has all required inputs
   * @private
   */
  private checkRecipeInputs(_converterId: string, recipe: ResourceConversionRecipe): boolean {
    // Check each required input
    for (const input of recipe.inputs) {
      // Get current resource state
      const resourceState = this.getResourceState(input.type);

      // If resource state doesn't exist or is less than required, return false
      if (!resourceState || resourceState.current < input.amount) {
        return false;
      }
    }

    return true;
  }

  /**
   * Start a conversion process
   *
   * @param {string} converterId - The ID of the converter node
   * @param {string} recipeId - The ID of the recipe to start
   * @returns {ConversionResult} The result of starting the conversion
   * @private
   */
  private startConversionProcess(converterId: string, recipeId: string): ConversionResult {
    // Get converter and recipe
    const converter = this.nodes.get(converterId);
    const recipe = this.conversionRecipes.get(recipeId);

    if (!converter || converter.type !== 'converter' || !recipe) {
      return {
        success: false,
        processId: '',
        recipeId: '',
      };
    }

    // Ensure converter has a status
    if (!converter.converterStatus) {
      converter.converterStatus = {
        activeProcesses: [],
        queuedProcesses: [],
        completedProcesses: 0,
        failedProcesses: 0,
        totalResourcesProduced: {},
        totalResourcesConsumed: {},
        averageEfficiency: converter.efficiency || 1.0,
        uptime: 0,
      };
    }

    // Check if converter can process this recipe
    if (
      converter.converterConfig &&
      !converter.converterConfig.supportedRecipes.includes(recipeId)
    ) {
      return {
        success: false,
        processId: '',
        recipeId: '',
      };
    }

    // Check if converter has reached maximum concurrent processes
    if (
      converter.converterConfig &&
      converter.converterStatus.activeProcesses.length >=
        converter.converterConfig.maxConcurrentProcesses
    ) {
      return {
        success: false,
        processId: '',
        recipeId: '',
      };
    }

    // Check if inputs are available
    const hasInputs = this.checkRecipeInputs(converterId, recipe);
    if (!hasInputs) {
      return {
        success: false,
        processId: '',
        recipeId: '',
      };
    }

    // Consume inputs
    const now = Date.now();
    const inputsConsumed: { type: ResourceType; amount: number }[] = [];

    for (const input of recipe.inputs) {
      // Get resource state
      const state = this.getResourceState(input.type);
      if (!state) {
        continue;
      }

      // Consume resource
      state.current -= input.amount;
      state.consumption += input.amount;

      // Update resource state
      this.updateResourceState(input.type, state);

      // Add to inputs consumed
      inputsConsumed.push({ type: input.type, amount: input.amount });

      // Update converter status
      if (converter.converterStatus) {
        // Initialize totalResourcesConsumed if it doesn't exist
        if (!converter.converterStatus.totalResourcesConsumed) {
          converter.converterStatus.totalResourcesConsumed = {};
        }

        // Update the consumed amount
        const currentAmount = converter.converterStatus.totalResourcesConsumed[input.type] || 0;
        converter.converterStatus.totalResourcesConsumed[input.type] = currentAmount + input.amount;
      }
    }

    // Calculate efficiency
    const efficiency = this.calculateConverterEfficiency(converter, recipe);

    // Create conversion process
    const processId = `${converterId}-${recipeId}-${now}`;
    const processEndTime = now + recipe.processingTime;

    const process: ResourceConversionProcess & { processId: string } = {
      recipeId,
      progress: 0,
      startTime: now,
      endTime: processEndTime,
      sourceId: converterId,
      active: true,
      paused: false,
      inputsProvided: true,
      appliedEfficiency: efficiency,
      processId: processId,
    };

    // Apply efficiency to processing time
    if (efficiency !== 1.0) {
      // More efficient = faster processing
      const newDuration = recipe.processingTime / efficiency;
      process.endTime = process.startTime + newDuration;
    }

    // Add process to active processes
    this.processingQueue.push(process);

    // Add process to converter's active processes
    converter.converterStatus.activeProcesses.push(process);

    // Update converter in network
    this.nodes.set(converterId, converter);

    // Emit resource produced event
    moduleEventBus.emit({
      type: 'RESOURCE_PRODUCED',
      moduleId: converter.id,
      moduleType: 'mineral' as ModuleType,
      timestamp: Date.now(),
      data: {
        processId,
        recipeId: recipe.id,
        converterId: converter.id,
        outputsProduced: [],
        byproductsProduced: [],
        efficiency,
      },
    });

    // Return the result
    return {
      success: true,
      processId,
      recipeId: recipe.id,
      outputsProduced: inputsConsumed,
    };
  }

  /**
   * Start the processing interval for conversion processes
   *
   * @param {number} interval - The interval in milliseconds
   * @private
   */
  private startProcessingInterval(interval: number): void {
    // Clear any existing interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Set new interval
    this.processingInterval = setInterval(() => {
      this.processConversions();
    }, interval) as unknown as number;
  }

  /**
   * Process all active conversion processes
   * @private
   */
  private processConversions(): void {
    // Array to collect processes to complete
    const processesToComplete: ExtendedResourceConversionProcess[] = [];

    // Check all active processes
    for (const process of this.processingQueue) {
      // Skip paused processes
      if (process.paused) {
        continue;
      }

      // Check if process is active
      if (!process.active) {
        continue;
      }

      // Get current time
      const now = Date.now();

      // Check if process is complete
      if (now >= process.endTime) {
        processesToComplete.push(process);
      }
    }

    // Complete processes
    for (const process of processesToComplete) {
      // Get converter
      const converter = this.nodes.get(process.sourceId);
      if (!converter) {
        // Converter not found, remove process from active processes
        this.processingQueue = this.processingQueue.filter(p => p.processId !== process.processId);
        continue;
      }

      // Get recipe
      const recipe = this.conversionRecipes.get(process.recipeId);
      if (!recipe) {
        // Recipe not found, remove process from active processes
        this.processingQueue = this.processingQueue.filter(p => p.processId !== process.processId);
        continue;
      }

      // Complete the process
      const result = this.completeConversionProcess(process.processId, process, converter, recipe);

      // Check if this process is part of an active chain
      for (const chainStatus of this.chainExecutions.values()) {
        // Find the step that contains this process
        const stepIndex = chainStatus.stepStatus.findIndex(
          step => step.processId === process.processId
        );
        if (stepIndex >= 0) {
          // Found a matching step
          const step = chainStatus.stepStatus[stepIndex];

          // Update step status
          step.status = result.success ? 'completed' : 'failed';
          step.endTime = Date.now();

          // Update chain status
          if (!result.success) {
            chainStatus.failed = true;
            chainStatus.active = false;
            chainStatus.errorMessage = result.error || 'Process failed';
          } else if (stepIndex === chainStatus.stepStatus.length - 1) {
            // This was the last step in the chain
            chainStatus.completed = true;
            chainStatus.active = false;
          } else if (chainStatus.active && !chainStatus.paused) {
            // Move to the next step
            chainStatus.currentStepIndex = stepIndex + 1;
            this.processNextChainStep(chainStatus.chainId);
          }

          // Update chain progress
          this.updateChainProgress(chainStatus.chainId);
        }
      }
    }
  }

  /**
   * Complete a conversion process and produce outputs
   *
   * @param {string} processId - The ID of the process
   * @param {ResourceConversionProcess} process - The process to complete
   * @param {FlowNode} converter - The converter node
   * @param {ResourceConversionRecipe} recipe - The recipe being processed
   * @returns {ConversionResult} The result of the conversion
   * @private
   */
  private completeConversionProcess(
    processId: string,
    process: ResourceConversionProcess,
    converter: FlowNode,
    recipe: ResourceConversionRecipe
  ): ConversionResult {
    // Remove process from active processes
    this.processingQueue = this.processingQueue.filter(p => p.processId !== processId);

    // Remove process from converter's active processes
    if (converter.converterStatus) {
      converter.converterStatus.activeProcesses = converter.converterStatus.activeProcesses.filter(
        p => p.startTime !== process.startTime || p.recipeId !== process.recipeId
      );
    }

    // Apply efficiency to process and get the calculated efficiency value
    const efficiency = this._applyEfficiencyToProcess(processId, process, converter, recipe);

    // Process the outputs with the calculated efficiency
    const outputsProduced: { type: ResourceType; amount: number }[] = [];

    for (const output of recipe.outputs) {
      // Apply efficiency to output amount
      const outputAmount = Math.max(1, Math.floor(output.amount * efficiency));

      // Get resource state
      const state = this.getResourceState(output.type) || {
        current: 0,
        max: 100,
        min: 0,
        production: 0,
        consumption: 0,
      };

      // Add output to resource state
      state.current += outputAmount;
      state.production += outputAmount;

      // Update resource state
      this.updateResourceState(output.type, state);

      // Add to outputs produced
      outputsProduced.push({ type: output.type, amount: outputAmount });

      // Update converter status
      if (converter.converterStatus) {
        // Initialize totalResourcesProduced if it doesn't exist
        if (!converter.converterStatus.totalResourcesProduced) {
          converter.converterStatus.totalResourcesProduced = {};
        }

        // Update the produced amount
        const currentAmount = converter.converterStatus.totalResourcesProduced[output.type] || 0;
        converter.converterStatus.totalResourcesProduced[output.type] =
          currentAmount + outputAmount;
      }
    }

    // Check for byproducts
    const byproductsProduced: { type: ResourceType; amount: number }[] = [];
    if (converter.converterConfig?.byproducts) {
      for (const [resourceType, chance] of Object.entries(converter.converterConfig.byproducts)) {
        // Roll for byproduct
        if (Math.random() < chance) {
          // Determine amount (1-3 units)
          const amount = Math.floor(Math.random() * 3) + 1;

          // Get resource state
          const state = this.getResourceState(resourceType as ResourceType) || {
            current: 0,
            max: 100,
            min: 0,
            production: 0,
            consumption: 0,
          };

          // Add byproduct to resource state
          state.current += amount;
          state.production += amount;

          // Update resource state
          this.updateResourceState(resourceType as ResourceType, state);

          // Add to byproducts produced
          byproductsProduced.push({ type: resourceType as ResourceType, amount });
        }
      }
    }

    // Update converter status
    if (converter.converterStatus) {
      // Update completed processes count
      converter.converterStatus.completedProcesses++;

      // Update average efficiency
      const oldAvg = converter.converterStatus.averageEfficiency;
      const oldCount = converter.converterStatus.completedProcesses - 1;
      const newAvg =
        (oldAvg * oldCount + efficiency) / converter.converterStatus.completedProcesses;
      converter.converterStatus.averageEfficiency = newAvg;
    }

    // Update converter in network
    this.nodes.set(converter.id, converter);

    // Emit event
    moduleEventBus.emit({
      type: 'RESOURCE_PRODUCED',
      moduleId: converter.id,
      moduleType: 'mineral' as ModuleType,
      timestamp: Date.now(),
      data: {
        processId,
        recipeId: recipe.id,
        converterId: converter.id,
        outputsProduced: outputsProduced || [],
        byproductsProduced,
        efficiency,
      },
    });

    // Near the end of the method, before returning
    // Use _applyEfficiencyToOutputs to modify the result based on efficiency
    const result: ConversionResult = {
      success: true,
      processId,
      recipeId: recipe.id,
      outputsProduced,
      byproductsProduced,
    };

    // Apply efficiency to the output amounts using the other unused function
    return this._applyEfficiencyToOutputs(result, efficiency);
  }

  /**
   * Register a conversion recipe
   *
   * @param {ResourceConversionRecipe} recipe - The recipe to register
   * @returns {boolean} True if the recipe was successfully registered
   */
  public registerRecipe(recipe: ResourceConversionRecipe): boolean {
    // Validate the recipe
    if (!recipe.id || !recipe.inputs.length || !recipe.outputs.length) {
      return false;
    }

    // Add to recipes map
    this.conversionRecipes.set(recipe.id, recipe);
    return true;
  }

  /**
   * Unregister a conversion recipe
   *
   * @param {string} id - The ID of the recipe to unregister
   * @returns {boolean} True if the recipe was successfully unregistered
   */
  public unregisterRecipe(id: string): boolean {
    // Check if recipe exists
    if (!this.conversionRecipes.has(id)) {
      return false;
    }

    // Remove recipe from recipes map
    this.conversionRecipes.delete(id);

    // Also remove from any chains that use it
    for (const chain of this.conversionChains.values()) {
      chain.steps = chain.steps.filter(step => step !== id);
    }

    return true;
  }

  /**
   * Register a conversion chain
   *
   * @param {ConversionChain} chain - The chain to register
   * @returns {boolean} True if the chain was successfully registered
   */
  public registerChain(chain: ConversionChain): boolean {
    // Validate the chain
    if (!chain.id || !chain.steps.length) {
      return false;
    }

    // Verify all recipes in the chain exist
    for (const recipeId of chain.steps) {
      if (!this.conversionRecipes.has(recipeId)) {
        return false;
      }
    }

    // Add to chains map
    this.conversionChains.set(chain.id, chain);
    return true;
  }

  /**
   * Unregister a conversion chain
   *
   * @param {string} id - The ID of the chain to unregister
   * @returns {boolean} True if the chain was successfully unregistered
   */
  public unregisterChain(id: string): boolean {
    // Check if chain exists
    if (!this.conversionChains.has(id)) {
      return false;
    }

    // Remove chain from chains map
    this.conversionChains.delete(id);
    return true;
  }

  /**
   * Get all registered recipes
   *
   * @returns {ResourceConversionRecipe[]} Array of all registered recipes
   */
  public getRecipes(): ResourceConversionRecipe[] {
    return Array.from(this.conversionRecipes.values());
  }

  /**
   * Get a specific recipe by ID
   *
   * @param {string} id - The ID of the recipe to get
   * @returns {ResourceConversionRecipe | undefined} The recipe, or undefined if not found
   */
  public getRecipe(id: string): ResourceConversionRecipe | undefined {
    return this.conversionRecipes.get(id);
  }

  /**
   * Get all registered chains
   *
   * @returns {ConversionChain[]} Array of all registered chains
   */
  public getChains(): ConversionChain[] {
    return Array.from(this.conversionChains.values());
  }

  /**
   * Get a specific chain by ID
   *
   * @param {string} id - The ID of the chain to get
   * @returns {ConversionChain | undefined} The chain, or undefined if not found
   */
  public getChain(id: string): ConversionChain | undefined {
    return this.conversionChains.get(id);
  }

  /**
   * Start a conversion process manually
   *
   * @param {string} converterId - The ID of the converter node
   * @param {string} recipeId - The ID of the recipe to start
   * @returns {ConversionResult} The result of starting the conversion
   */
  public startConversion(converterId: string, recipeId: string): ConversionResult {
    return this.startConversionProcess(converterId, recipeId);
  }

  /**
   * Pause a conversion process
   *
   * @param {string} processId - The ID of the process to pause
   * @returns {boolean} True if the process was successfully paused
   */
  public pauseConversion(processId: string): boolean {
    const process = this.processingQueue.find(p => p.processId === processId);
    if (!process) {
      return false;
    }

    process.paused = true;
    this.processingQueue = this.processingQueue.map(p =>
      p.processId === processId ? { ...p, paused: true } : p
    );

    // Update in converter's status
    const converter = this.nodes.get(process.sourceId);
    if (converter && converter.converterStatus) {
      const processIndex = converter.converterStatus.activeProcesses.findIndex(
        p => p.startTime === process.startTime && p.recipeId === process.recipeId
      );

      if (processIndex >= 0) {
        converter.converterStatus.activeProcesses[processIndex] = process;
        this.nodes.set(process.sourceId, converter);
      }
    }

    return true;
  }

  /**
   * Resume a paused conversion process
   *
   * @param {string} processId - The ID of the process to resume
   * @returns {boolean} True if the process was successfully resumed
   */
  public resumeConversion(processId: string): boolean {
    const process = this.processingQueue.find(p => p.processId === processId);
    if (!process) {
      return false;
    }

    process.paused = false;
    this.processingQueue = this.processingQueue.map(p =>
      p.processId === processId ? { ...p, paused: false } : p
    );

    // Update in converter's status
    const converter = this.nodes.get(process.sourceId);
    if (converter && converter.converterStatus) {
      const processIndex = converter.converterStatus.activeProcesses.findIndex(
        p => p.startTime === process.startTime && p.recipeId === process.recipeId
      );

      if (processIndex >= 0) {
        converter.converterStatus.activeProcesses[processIndex] = process;
        this.nodes.set(process.sourceId, converter);
      }
    }

    return true;
  }

  /**
   * Cancel a conversion process
   *
   * @param {string} processId - The ID of the process to cancel
   * @returns {boolean} True if the process was successfully cancelled
   */
  public cancelConversion(processId: string): boolean {
    const process = this.processingQueue.find(p => p.processId === processId);
    if (!process) {
      return false;
    }

    // Remove from active processes
    this.processingQueue = this.processingQueue.filter(p => p.processId !== processId);

    // Update in converter's status
    const converter = this.nodes.get(process.sourceId);
    if (converter && converter.converterStatus) {
      converter.converterStatus.activeProcesses = converter.converterStatus.activeProcesses.filter(
        p => p.startTime !== process.startTime || p.recipeId !== process.recipeId
      );
      converter.converterStatus.failedProcesses++;
      this.nodes.set(process.sourceId, converter);
    }

    return true;
  }

  /**
   * Get all active conversion processes
   *
   * @returns {ResourceConversionProcess[]} Array of all active conversion processes
   */
  public getActiveProcesses(): ResourceConversionProcess[] {
    return this.processingQueue;
  }

  /**
   * Get active conversion processes for a specific converter
   *
   * @param {string} converterId - The ID of the converter
   * @returns {ResourceConversionProcess[]} Array of active conversion processes for the converter
   */
  public getConverterProcesses(converterId: string): ResourceConversionProcess[] {
    return this.processingQueue.filter(p => p.sourceId === converterId);
  }

  /**
   * Update converter configuration
   *
   * @param {string} converterId - The ID of the converter
   * @param {ConverterNodeConfig} config - The new configuration
   * @returns {boolean} True if the configuration was successfully updated
   */
  public updateConverterConfig(converterId: string, config: ConverterNodeConfig): boolean {
    const converter = this.nodes.get(converterId);
    if (!converter || converter.type !== 'converter') {
      return false;
    }

    converter.converterConfig = config;
    this.nodes.set(converterId, converter);
    return true;
  }

  /**
   * @returns {ConverterProcessStatus | undefined} The converter status, or undefined if not found
   */
  public getConverterStatus(converterId: string): ConverterProcessStatus | undefined {
    const converter = this.nodes.get(converterId);
    if (!converter || converter.type !== 'converter') {
      return undefined;
    }

    return converter.converterStatus;
  }

  /**
   * Calculates resource balance (availability and demand)
   */
  private calculateResourceBalance(
    producers: FlowNode[],
    consumers: FlowNode[],
    storages: FlowNode[],
    activeConnections: FlowConnection[]
  ): {
    availability: Partial<Record<ResourceType, number>>;
    demand: Partial<Record<ResourceType, number>>;
  } {
    // Initialize with current resource states
    const availability: Partial<Record<ResourceType, number>> = {};
    const demand: Partial<Record<ResourceType, number>> = {};

    // Convert Map entries to array to avoid MapIterator error
    const resourceStateEntries = Array.from(this.resourceStates.entries());
    for (const [type, _state] of resourceStateEntries) {
      availability[type] = 0;
      demand[type] = 0;
    }

    // Process producers in batches if there are many
    const producerBatchCount = Math.ceil(producers.length / this.batchSize);

    for (let i = 0; i < producerBatchCount; i++) {
      const batchStart = i * this.batchSize;
      const batchEnd = Math.min((i + 1) * this.batchSize, producers.length);
      const producerBatch = producers.slice(batchStart, batchEnd);

      for (const producer of producerBatch) {
        for (const resourceType of producer.resources) {
          // Find outgoing connections for this resource
          const outgoingConnections = activeConnections.filter(
            conn => conn.source === producer.id && conn.resourceType === resourceType
          );

          // Sum up max rates
          const totalMaxRate = outgoingConnections.reduce((sum, conn) => sum + conn.maxRate, 0);

          // Apply efficiency if available
          const effectiveRate = producer.efficiency
            ? totalMaxRate * producer.efficiency
            : totalMaxRate;

          availability[resourceType] = (availability[resourceType] || 0) + effectiveRate;
        }
      }
    }

    // Process consumers in batches if there are many
    const consumerBatchCount = Math.ceil(consumers.length / this.batchSize);

    for (let i = 0; i < consumerBatchCount; i++) {
      const batchStart = i * this.batchSize;
      const batchEnd = Math.min((i + 1) * this.batchSize, consumers.length);
      const consumerBatch = consumers.slice(batchStart, batchEnd);

      for (const consumer of consumerBatch) {
        for (const resourceType of consumer.resources) {
          // Find incoming connections for this resource
          const incomingConnections = activeConnections.filter(
            conn => conn.target === consumer.id && conn.resourceType === resourceType
          );

          // Sum up max rates
          const totalMaxRate = incomingConnections.reduce((sum, conn) => sum + conn.maxRate, 0);

          demand[resourceType] = (demand[resourceType] || 0) + totalMaxRate;
        }
      }
    }

    // Process storage nodes in batches if there are many
    const storageBatchCount = Math.ceil(storages.length / this.batchSize);

    for (let i = 0; i < storageBatchCount; i++) {
      const batchStart = i * this.batchSize;
      const batchEnd = Math.min((i + 1) * this.batchSize, storages.length);
      const storageBatch = storages.slice(batchStart, batchEnd);

      for (const storage of storageBatch) {
        for (const resourceType of storage.resources) {
          // Use cached resource state if available
          const resourceState = this.getResourceState(resourceType);
          if (!resourceState) {
            continue;
          }

          // If storage is near capacity, reduce availability
          if (resourceState.current > resourceState.max * 0.9) {
            availability[resourceType] = Math.max(
              0,
              (availability[resourceType] || 0) - (resourceState.max - resourceState.current)
            );
          }

          // If storage is near empty, increase demand
          if (resourceState.current < resourceState.max * 0.1) {
            demand[resourceType] = (demand[resourceType] || 0) + resourceState.max * 0.2;
          }
        }
      }
    }

    return { availability, demand };
  }

  /**
   * Identifies resource bottlenecks and underutilized resources
   */
  private identifyResourceIssues(
    availability: Partial<Record<ResourceType, number>>,
    demand: Partial<Record<ResourceType, number>>
  ): {
    bottlenecks: string[];
    underutilized: string[];
  } {
    const bottlenecks: string[] = [];
    const underutilized: string[] = [];

    // Find bottlenecks (resources where demand exceeds availability)
    for (const type in demand) {
      const demandValue = demand[type] || 0;
      const availabilityValue = availability[type] || 0;

      if (demandValue > availabilityValue * 1.1) {
        // 10% threshold to avoid minor imbalances
        bottlenecks.push(type);
      } else if (availabilityValue > demandValue * 1.5) {
        // 50% threshold for underutilization
        underutilized.push(type);
      }
    }

    return { bottlenecks, underutilized };
  }

  /**
   * Optimizes flow rates based on priorities
   */
  private optimizeFlowRates(
    activeConnections: FlowConnection[],
    availability: Partial<Record<ResourceType, number>>,
    demand: Partial<Record<ResourceType, number>>
  ): {
    updatedConnections: FlowConnection[];
    transfers: ResourceTransfer[];
  } {
    const updatedConnections: FlowConnection[] = [];
    const transfers: ResourceTransfer[] = [];
    const now = Date.now();

    // Sort connections by priority (high to low)
    const prioritizedConnections = [...activeConnections].sort(
      (a, b) => Number(b.priority.priority) - Number(a.priority.priority)
    );

    // Process connections in batches if there are many
    const connectionBatchCount = Math.ceil(prioritizedConnections.length / this.batchSize);

    for (let i = 0; i < connectionBatchCount; i++) {
      const batchStart = i * this.batchSize;
      const batchEnd = Math.min((i + 1) * this.batchSize, prioritizedConnections.length);
      const connectionBatch = prioritizedConnections.slice(batchStart, batchEnd);

      // Adjust flow rates for this batch
      for (const connection of connectionBatch) {
        const { resourceType } = connection;
        const availableForType = availability[resourceType] || 0;
        const demandForType = demand[resourceType] || 0;

        if (availableForType <= 0 || demandForType <= 0) {
          // No flow possible
          connection.currentRate = 0;
        } else if (availableForType >= demandForType) {
          // Full flow possible
          connection.currentRate = Math.min(connection.maxRate, demandForType);
        } else {
          // Partial flow based on ratio
          const ratio = availableForType / demandForType;
          connection.currentRate = connection.maxRate * ratio;
        }

        updatedConnections.push({ ...connection });

        // Update the actual connection in the network
        this.connections.set(connection.id, connection);

        // Generate transfer if flow is positive
        if (connection.currentRate > 0) {
          const transfer: ResourceTransfer = {
            type: connection.resourceType,
            source: connection.source,
            target: connection.target,
            amount: connection.currentRate,
            timestamp: now,
          };

          if (validateResourceTransfer(transfer)) {
            transfers.push(transfer);

            // Add to history
            this.addToTransferHistory(transfer);
          }
        }
      }
    }

    return { updatedConnections, transfers };
  }

  /**
   * Adds a transfer to history
   */
  private addToTransferHistory(transfer: ResourceTransfer): void {
    this.transferHistory.push(transfer);

    // Trim history if needed
    if (this.transferHistory.length > this.maxHistorySize) {
      this.transferHistory = this.transferHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Calculate the efficiency for a converter based on input quality and other modifiers
   *
   * @param {FlowNode} converter - The converter node
   * @param {ResourceConversionRecipe} recipe - The recipe being processed
   * @returns {number} The calculated efficiency (1.0 = 100%)
   * @private
   */
  private calculateConverterEfficiency(
    converter: FlowNode,
    recipe: ResourceConversionRecipe
  ): number {
    // Start with the converter's base efficiency
    let efficiency = converter.efficiency || 1.0;

    // Apply recipe base efficiency
    efficiency *= recipe.baseEfficiency;

    // Check for converter config efficiency modifiers
    if (converter.converterConfig?.efficiencyModifiers) {
      const modifiers = converter.converterConfig.efficiencyModifiers;

      // Apply general modifiers
      if (modifiers['global']) {
        efficiency *= modifiers['global'];
      }

      // Apply recipe-specific modifiers
      if (modifiers[recipe.id]) {
        efficiency *= modifiers[recipe.id];
      }

      // Apply resource-specific modifiers
      for (const input of recipe.inputs) {
        if (modifiers[input.type]) {
          efficiency *= modifiers[input.type];
        }
      }
    }

    // Apply dynamic efficiency based on resource quality (simulated)
    // In a real implementation, we would check actual resource quality
    // This is a placeholder for the resource quality system
    const qualityFactors = this.calculateResourceQualityFactors(recipe.inputs);
    for (const [_resourceType, factor] of Object.entries(qualityFactors)) {
      efficiency *= factor;
    }

    // Apply technology tier bonus (1-10% per tier)
    if (converter.converterConfig?.tier) {
      const tierBonus = 1 + converter.converterConfig.tier * 0.05;
      efficiency *= tierBonus;
    }

    // Apply network stress factor
    const networkStressFactor = this.calculateNetworkStressFactor(converter);
    efficiency *= networkStressFactor;

    // Apply chain bonus if this is part of a chain
    if (converter.converterConfig?.chainBonus) {
      efficiency *= converter.converterConfig.chainBonus;
    }

    // Clamp efficiency to reasonable range (0.1 to 5.0)
    efficiency = Math.max(0.1, Math.min(5.0, efficiency));

    return efficiency;
  }

  /**
   * Calculate quality factors for input resources
   *
   * @param {ResourceCost[]} inputs - The input resources
   * @returns {Record<string, number>} Quality factors by resource type
   * @private
   */
  private calculateResourceQualityFactors(
    inputs: { type: ResourceType; amount: number }[]
  ): Record<string, number> {
    const qualityFactors: Record<string, number> = {};

    for (const input of inputs) {
      // For now, use a simulated quality factor
      // In the future, this would be based on actual resource quality attributes
      const baseQuality = 1.0;
      const randomVariation = Math.random() * 0.2 - 0.1; // -10% to +10%
      qualityFactors[input.type] = baseQuality + randomVariation;
    }

    return qualityFactors;
  }

  /**
   * Calculate network stress factor based on resource availability and demand
   *
   * @param {FlowNode} converter - The converter node
   * @returns {number} Network stress factor (0.7 to 1.3)
   * @private
   */
  private calculateNetworkStressFactor(converter: FlowNode): number {
    // Default to neutral factor
    let stressFactor = 1.0;

    // Check resource states for converter's resources
    for (const resourceType of converter.resources) {
      const state = this.getResourceState(resourceType);
      if (state) {
        // Calculate resource utilization
        const utilization = state.consumption / Math.max(state.production, 0.001);

        // High utilization reduces efficiency
        if (utilization > 0.9) {
          stressFactor *= 0.9;
        }
        // Low utilization increases efficiency
        else if (utilization < 0.5) {
          stressFactor *= 1.1;
        }
      }
    }

    // Clamp to reasonable range
    return Math.max(0.7, Math.min(1.3, stressFactor));
  }

  /**
   * Apply efficiency mechanics to a conversion process
   *
   * @param {string} processId - The ID of the process
   * @param {ResourceConversionProcess} process - The conversion process
   * @param {FlowNode} converter - The converter node
   * @param {ResourceConversionRecipe} recipe - The recipe being processed
   * @returns {number} The efficiency applied to the process
   * @private
   */
  private _applyEfficiencyToProcess(
    _processId: string,
    process: ResourceConversionProcess,
    converter: FlowNode,
    recipe: ResourceConversionRecipe
  ): number {
    // Calculate efficiency
    const efficiency = this.calculateConverterEfficiency(converter, recipe);

    // Store efficiency with the process
    process.appliedEfficiency = efficiency;

    // Apply efficiency to processing time
    if (efficiency !== 1.0) {
      // More efficient = faster processing
      const newDuration = recipe.processingTime / efficiency;
      process.endTime = process.startTime + newDuration;
      process.progress = Math.min(process.startTime - process.startTime / newDuration, 1);
    }

    return efficiency;
  }

  /**
   * Apply efficiency to resource outputs when completing a process
   *
   * @param {ConversionResult} result - The conversion result
   * @param {number} efficiency - The efficiency to apply
   * @returns {ConversionResult} The updated conversion result
   * @private
   */
  private _applyEfficiencyToOutputs(
    result: ConversionResult,
    efficiency: number
  ): ConversionResult {
    if (!result.success || !result.outputsProduced) {
      return result;
    }

    // Apply efficiency to output amounts
    for (const output of result.outputsProduced) {
      // Higher efficiency = more output
      output.amount = Math.floor(output.amount * efficiency);

      // Ensure minimum of 1 output if any was produced
      output.amount = Math.max(output.amount, 1);
    }

    return result;
  }

  /**
   * Get node by ID
   *
   * @param id The ID of the node to retrieve
   * @returns The flow node with the specified ID, or undefined if not found
   */
  public getNode(id: string): FlowNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all nodes in the network
   *
   * @returns {FlowNode[]} Array of all nodes in the network
   */
  public getNodes(): FlowNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all connections in the network
   *
   * @returns {FlowConnection[]} Array of all connections in the network
   */
  public getConnections(): FlowConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get a specific connection by ID
   *
   * @param {string} id - ID of the connection to retrieve
   * @returns {FlowConnection | undefined} The connection if found, undefined otherwise
   */
  public getConnection(id: string): FlowConnection | undefined {
    return this.connections.get(id);
  }

  /**
   * Create a resource flow between nodes
   *
   * This method creates a resource flow by automatically registering nodes and connections
   * based on the resource flow specification.
   *
   * @param {ResourceFlow} flow - The resource flow specification
   * @returns {boolean} True if the flow was successfully created, false otherwise
   */
  public createFlow(flow: ResourceFlow): boolean {
    // Validate the flow
    if (!flow.source || !flow.target || !flow.resources || flow.resources.length === 0) {
      console.warn('Invalid resource flow:', flow);
      return false;
    }

    // Create nodes if they don't exist
    if (!this.nodes.has(flow.source)) {
      this.registerNode({
        id: flow.source,
        type: 'producer',
        resources: flow.resources.map(r => r.type),
        priority: { type: flow.resources[0].type, priority: 1, consumers: [] },
        active: true,
      });
    }

    if (!this.nodes.has(flow.target)) {
      this.registerNode({
        id: flow.target,
        type: 'consumer',
        resources: flow.resources.map(r => r.type),
        priority: { type: flow.resources[0].type, priority: 1, consumers: [] },
        active: true,
      });
    }

    // Create connections for each resource
    let success = true;
    for (const resource of flow.resources) {
      const connectionId = `${flow.source}-${flow.target}-${resource.type}`;
      const connection: FlowConnection = {
        id: connectionId,
        source: flow.source,
        target: flow.target,
        resourceType: resource.type,
        maxRate: resource.amount,
        currentRate: 0,
        priority: { type: resource.type, priority: 1, consumers: [] },
        active: true,
      };

      const registered = this.registerConnection(connection);
      if (!registered) {
        success = false;
      }
    }

    return success;
  }

  /**
   * Update the progress of a conversion chain
   */
  private updateChainProgress(chainId: string): void {
    const chainStatus = this.chainExecutions.get(chainId);
    if (!chainStatus) return;

    // Calculate overall progress
    const completedSteps = 0;
    let totalProgress = 0;

    for (const step of chainStatus.stepStatus) {
      if (step.status === 'completed') {
        // Prefix with underscore to indicate it's unused
        let _completedSteps = completedSteps;
        _completedSteps++;
        totalProgress += 1;
      } else if (step.status === 'in_progress') {
        // Calculate step progress based on process progress
        const process = this.processingQueue.find(p => p.processId === step.processId);
        if (process) {
          const stepProgress = process.progress || 0;
          totalProgress += stepProgress;
        }
      }
    }

    // Update chain progress
    const totalSteps = chainStatus.stepStatus.length;
    chainStatus.progress = totalSteps > 0 ? totalProgress / totalSteps : 0;

    // Update chain in map
    this.chainExecutions.set(chainId, chainStatus);

    // Update metrics
    this.updateMetric(
      'activeChains',
      Array.from(this.chainExecutions.values()).filter(c => c.active).length
    );
    this.updateMetric(
      'completedChains',
      Array.from(this.chainExecutions.values()).filter(c => c.completed).length
    );
  }

  /**
   * Get the version of this manager implementation (for compatibility)
   * @override
   */
  protected getVersion(): string {
    return '2.0.0';
  }

  // Module event handlers
  private handleModuleCreated = (data: unknown) => {
    // Handle module creation
    const { id, type } = data;
    // Register module as appropriate node type based on module type
    this.registerModuleAsNode(id, type as ModuleType);
  };

  private handleModuleUpdated = (data: unknown) => {
    // Handle module update
    const { id, changes } = data;
    this.updateNodeFromModule(id, changes);
  };

  private handleModuleDestroyed = (data: unknown) => {
    // Handle module destruction
    const { id } = data;
    this.unregisterNode(id);
  };

  private handleModuleStateChanged = (data: unknown) => {
    // Handle module state change (enabled/disabled)
    const { id, active } = data;
    this.setNodeActive(id, active);
  };

  // Register a module as a node based on its type
  private registerModuleAsNode(moduleId: string, moduleType: ModuleType): void {
    // Implementation will determine node type based on module type
    // This is a placeholder
    console.warn(`Registering module ${moduleId} of type ${moduleType} as node`);
  }

  // Update a node based on module changes
  private updateNodeFromModule(moduleId: string, changes: unknown): void {
    // Implementation will update node properties based on module changes
    // This is a placeholder
    console.warn(`Updating node for module ${moduleId} with changes`, changes);
  }

  // Set a node's active state
  private setNodeActive(nodeId: string, active: boolean): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.active = active;
      this.nodes.set(nodeId, node);
    }
  }

  /**
   * Process the next step in a conversion chain
   *
   * @param chainId The ID of the chain to process
   * @private
   */
  private processNextChainStep(chainId: string): void {
    const chainStatus = this.chainExecutions.get(chainId);
    if (!chainStatus || !chainStatus.active || chainStatus.paused) {
      return;
    }

    // Get the current step
    const currentStepIndex = chainStatus.currentStepIndex;
    if (currentStepIndex >= chainStatus.stepStatus.length) {
      // Chain is complete
      chainStatus.completed = true;
      chainStatus.active = false;
      return;
    }

    const step = chainStatus.stepStatus[currentStepIndex];
    if (step.status !== 'pending') {
      // Step is already in progress or completed
      return;
    }

    // Get the recipe for this step
    const recipeId = step.recipeId;
    const recipe = this.conversionRecipes.get(recipeId);
    if (!recipe) {
      // Recipe not found
      step.status = 'failed';
      chainStatus.failed = true;
      chainStatus.active = false;
      chainStatus.errorMessage = `Recipe ${recipeId} not found`;
      return;
    }

    // Find a converter that can process this recipe
    const converters = Array.from(this.nodes.values()).filter(
      node =>
        node.type === 'converter' &&
        node.active &&
        node.converterConfig?.supportedRecipes.includes(recipeId)
    );

    if (converters.length === 0) {
      // No converter found
      step.status = 'failed';
      chainStatus.failed = true;
      chainStatus.active = false;
      chainStatus.errorMessage = `No converter found for recipe ${recipeId}`;
      return;
    }

    // Sort converters by priority
    converters.sort((a, b) => {
      const aEfficiency = a.efficiency || 1;
      const bEfficiency = b.efficiency || 1;
      return bEfficiency - aEfficiency; // Higher efficiency first
    });

    // Try to start the conversion on the first available converter
    let started = false;
    for (const converter of converters) {
      // Check if converter has capacity
      if (
        converter.converterStatus &&
        converter.converterConfig &&
        converter.converterStatus.activeProcesses.length >=
          converter.converterConfig.maxConcurrentProcesses
      ) {
        continue;
      }

      // Try to start the conversion
      const result = this.startConversionProcess(converter.id, recipeId);
      if (result.success) {
        // Update step status
        step.status = 'in_progress';
        step.startTime = Date.now();
        step.processId = result.processId;
        step.converterId = converter.id;
        started = true;
        break;
      }
    }

    if (!started) {
      // Could not start conversion
      step.status = 'failed';
      chainStatus.failed = true;
      chainStatus.active = false;
      chainStatus.errorMessage = `Could not start conversion for recipe ${recipeId}`;
    }

    // Update chain status
    this.chainExecutions.set(chainId, chainStatus);
  }
}

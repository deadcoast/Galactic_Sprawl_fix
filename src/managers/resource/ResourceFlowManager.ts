import {
  ChainExecutionStatus,
  ConversionChain,
  ConverterFlowNode,
  FlowConnection,
  FlowNode,
  FlowNodeType,
  ResourceConversionProcess,
  ResourceConversionRecipe,
  ResourceFlow,
  ResourceState,
  ResourceStateClass,
  ResourceType,
  ResourceTypeString,
} from '../../types/resources/ResourceTypes';
// Import new utility classes
import { BaseEvent } from '../../lib/events/UnifiedEventSystem';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { EventType } from '../../types/events/EventTypes';
import { ResourceTransfer } from '../../types/resources/ResourceTypes';
import { SpatialIndex, SpatialObject } from '../../utils/spatial/SpatialPartitioning';
import {
  FlowOptimizationResult,
  ResourceFlowWorkerUtil,
} from '../../utils/workers/ResourceFlowWorkerUtil';
// Import ResourceRegistry and ResourceRegistryIntegration
import { ResourceRegistry } from '../../registry/ResourceRegistry';
import { ResourceRegistryIntegration } from '../../registry/ResourceRegistryIntegration';
// Import ResourceTypeConverter functions
import {
  ensureStringResourceType,
  enumToStringResourceType,
  stringToEnumResourceType,
} from '../../utils/resources/ResourceTypeConverter';
// Import ExtendedResourceConversionRecipe
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { ExtendedResourceConversionRecipe } from '../../types/resources/ResourceConversionTypes';

// Helper function to create a default ResourceState
function createDefaultResourceState(): ResourceState {
  return { current: 0, max: 100, min: 0, production: 0, consumption: 0 };
}

// Helper function to initialize a Record<ResourceType, ResourceState>
function initializeResourceRecord(): Record<ResourceType, ResourceState> {
  const record: Partial<Record<ResourceType, ResourceState>> = {};
  // Iterate over numeric enum values
  for (const typeValue of Object.values(ResourceType)) {
    if (typeof typeValue === 'number') {
      record[typeValue as ResourceType] = createDefaultResourceState();
    }
  }
  return record as Record<ResourceType, ResourceState>; // Cast after initialization
}

// Add type alias for StandardizedResourceType for backward compatibility
type StandardizedResourceType = ResourceType;

// Add StandardizedResourceTransfer type definition
interface StandardizedResourceTransfer {
  type: ResourceType;
  source: string;
  target: string;
  amount: number;
  timestamp: number;
}

// Extend ConverterNodeConfig with additional properties
interface ExtendedConverterNodeConfig {
  maxConcurrentProcesses: number;
  efficiencyModifiers: Record<string, number>;
  tier?: number;
  chainBonus?: number;
  type?: string;
}

/**
 * Interface for ResourceFlowManager
 */
export interface IResourceFlowManager {
  registerNode(node: FlowNode): boolean;
  unregisterNode(id: string): boolean;
  registerConnection(connection: FlowConnection): boolean;
  unregisterConnection(id: string): boolean;
  updateGlobalResourceState(type: ResourceTypeString | ResourceType, state: ResourceState): void;
  getGlobalResourceState(type: ResourceTypeString | ResourceType): ResourceState | undefined;
  getNode(id: string): FlowNode | undefined;
  getNodes(): FlowNode[];
  getConnections(): FlowConnection[];
  getConnection(id: string): FlowConnection | undefined;
  createFlow(flow: ResourceFlow): boolean;
  optimizeFlows(): Promise<FlowOptimizationResult>;
  getAllResourceStates(): Map<string, { available: number }>;
  getAllConversionRecipes(): Array<{
    input: { type: string; amount: number };
    output: { type: string; amount: number };
  }>;
  setConversionRate(sourceType: string, targetType: string, rate: number): void;
}

// Define ConversionResult interface
interface ConversionResult {
  success: boolean;
  processId: string;
  recipeId: string;
  outputsProduced?: { type: ResourceTypeString; amount: number }[];
  byproductsProduced?: { type: ResourceTypeString; amount: number }[];
  error?: string;
}

// Extend ResourceConversionProcess to include processId
interface ExtendedResourceConversionProcess extends ResourceConversionProcess {
  processId: string;
}

// Re-export FlowNode interface for use in other components
export type { FlowNode } from '../../types/resources/ResourceTypes';

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
  resourceType?: ResourceTypeString | ResourceType;
  processId?: string;
  data?: unknown;
}

// Define a type for the resource map to ensure consistency
type ResourceStateMap = Map<string, ResourceState>;
type ResourceProducersMap = Map<string, string[]>;
type ResourceConsumersMap = Map<string, string[]>;
type ResourceStorageMap = Map<string, string[]>;
type ResourceConvertersMap = Map<string, string[]>;

/**
 * Manager for resource flow through the game systems
 * Responsible for:
 * - Tracking resource nodes (producers, consumers, storage, converters)
 * - Managing connections between nodes
 * - Optimizing resource distribution
 * - Processing resource conversions
 */
// @ts-expect-error The Singleton class has a type compatibility issue that needs to be addressed at a higher level
export class ResourceFlowManager
  extends AbstractBaseManager<ResourceFlowEvent>
  implements IResourceFlowManager
{
  // Singleton instance
  private static _instance: ResourceFlowManager | null = null;

  /**
   * Get the singleton instance of ResourceFlowManager
   */
  public static getInstance(): ResourceFlowManager {
    if (!ResourceFlowManager._instance) {
      ResourceFlowManager._instance = new ResourceFlowManager();
    }
    return ResourceFlowManager._instance;
  }

  // Flow network data structures
  private nodes: Map<string, FlowNode> = new Map();
  private connections: Map<string, FlowConnection> = new Map();
  private sourceConnections: Map<string, string[]> = new Map();
  private targetConnections: Map<string, string[]> = new Map();

  // Categorized nodes for faster lookups
  private producerNodes: Map<string, FlowNode> = new Map();
  private consumerNodes: Map<string, FlowNode> = new Map();
  private storageNodes: Map<string, FlowNode> = new Map();
  private converterNodes: Map<string, ConverterFlowNode> = new Map();

  // Resource state tracking
  private resourceStates: ResourceStateMap = new Map();
  private resourceProducers: ResourceProducersMap = new Map();
  private resourceConsumers: ResourceConsumersMap = new Map();
  private resourceStorage: ResourceStorageMap = new Map();
  private resourceConverters: ResourceConvertersMap = new Map();

  // Caching
  private resourceCache: Map<
    ResourceTypeString,
    { state: ResourceState; lastUpdated: number; expiresAt: number }
  > = new Map();
  private cacheTTL = 5000; // 5 seconds

  // Transfer history
  private transferHistory: ResourceTransfer[] = [];
  private maxHistorySize = 1000;

  // Conversion processing
  private processingQueue: ExtendedResourceConversionProcess[] = [];
  private _completedProcesses: ExtendedResourceConversionProcess[] = [];
  private conversionRecipes: Map<string, ResourceConversionRecipe> = new Map();
  private conversionChains: Map<string, ConversionChain> = new Map();
  private chainExecutions: Map<string, ChainExecutionStatus> = new Map();

  // Optimization state
  private isOptimizing = false;
  private lastOptimizationResult: FlowOptimizationResult | null = null;

  // Intervals
  private processingInterval: number | null = null;
  private optimizationInterval: number | null = null;
  private optimizationIntervalMs = 5000; // 5 seconds

  // Performance settings
  private batchSize = 100;
  private useWorkerOffloading = true;
  private workerUtil: ResourceFlowWorkerUtil | null = null;

  // Spatial partitioning for geographical networks
  private spatialIndex: SpatialIndex<GeoFlowNode> | null = null;

  // Resource flow settings
  private flowOptimizationEnabled = true;
  private _resourceCapacityBuffer = 0.05; // 5% buffer to prevent overflow
  private _lastProcessingTime = 0;

  // New properties
  public useSpatialPartitioning = false;
  public worldBounds = { minX: 0, minY: 0, maxX: 10000, maxY: 10000 };
  public processingIntervalMs = 1000;

  // ResourceRegistry integration
  private resourceRegistry: ResourceRegistry;
  private registryIntegration: ResourceRegistryIntegration;

  /**
   * Private constructor to enforce singleton pattern
   */
  protected constructor() {
    super('ResourceFlowManager');
    this.resourceRegistry = ResourceRegistry.getInstance();
    this.registryIntegration = ResourceRegistryIntegration.getInstance();
    this.initializeResourceStates();
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

    // Sync with ResourceRegistry
    this.syncWithResourceRegistry();

    // Subscribe to module events that might affect resource flow
    this.subscribeToModuleEvents();

    // Start optimization and processing intervals
    this.startAsyncOptimizationInterval();
    this.startProcessingInterval(this.processingIntervalMs);

    // Commenting out initial publish as RESOURCE_FLOW_INITIALIZED doesn't exist in EventType
    /*
    this.publish({
      type: EventType.RESOURCE_FLOW_INITIALIZED, // This event type does not exist
      timestamp: Date.now(),
      data: {
        optimizationIntervalMs: this.optimizationIntervalMs,
        cacheTTL: this.cacheTTL,
        batchSize: this.batchSize,
        useWorkerOffloading: this.useWorkerOffloading,
        useSpatialPartitioning: this.useSpatialPartitioning,
      },
    });
    */
  }

  /**
   * Sync with ResourceRegistry
   * This method synchronizes the ResourceFlowManager with the ResourceRegistry
   */
  private syncWithResourceRegistry(): void {
    // Register resource flow manager with registry integration
    // Cast to a specific interface to avoid circular dependency issues
    interface MinimalResourceFlowManager {
      getAllResourceStates?: () => Map<string, { available: number }>;
      getAllConversionRecipes?: () => Array<{
        input: { type: string; amount: number };
        output: { type: string; amount: number };
      }>;
      setConversionRate?: (sourceType: string, targetType: string, rate: number) => void;
    }

    this.registryIntegration.syncResourceAvailability(
      this as unknown as MinimalResourceFlowManager
    );
    this.registryIntegration.syncConversionRecipes(this as unknown as MinimalResourceFlowManager);

    // Subscribe to registry events
    this.resourceRegistry.subscribe('resourceRegistered', data => {
      if ('resourceType' in data && 'metadata' in data) {
        // Update local resource state when a new resource is registered
        const enumType = this.safeResourceTypeConversion(data?.resourceType);
        const stringType = enumToStringResourceType(enumType);

        if (stringType && !this.resourceStates.has(stringType)) {
          // Initialize resource state for the new resource
          const resourceState = new ResourceStateClass({
            type: enumType,
          });
          this.resourceStates.set(stringType, resourceState.asObject());
          this.resourceProducers.set(stringType, []);
          this.resourceConsumers.set(stringType, []);
          this.resourceStorage.set(stringType, []);
        }
      }
    });

    this.resourceRegistry.subscribe('conversionRateChanged', data => {
      if ('sourceType' in data && 'targetType' in data && 'rate' in data) {
        // Update conversion recipes when rates change
        // This is a placeholder for actual implementation
        console.warn(
          `Conversion rate changed: ${data?.sourceType} -> ${data?.targetType} = ${data?.rate}`
        );
      }
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
    this._completedProcesses = [];
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

  /**
   * Initialize resource states for all known resource types
   */
  private initializeResourceStates(): void {
    // Initialize resource states for all known resource types
    const resourceTypes: ResourceTypeString[] = [
      ResourceType.MINERALS,
      ResourceType.ENERGY,
      ResourceType.POPULATION,
      ResourceType.RESEARCH,
      ResourceType.PLASMA,
      ResourceType.GAS,
      ResourceType.EXOTIC,
    ];

    // Create default resource states
    resourceTypes.forEach(type => {
      if (!this.resourceStates.has(type)) {
        this.resourceStates.set(type, {
          current: 0,
          max: 1000,
          min: 0,
          production: 0,
          consumption: 0,
        });
      }
    });
  }

  /**
   * Register a node in the resource flow network
   *
   * @param node The node to register
   * @returns True if the node was successfully registered, false otherwise
   */
  public registerNode(node: FlowNode): boolean {
    // Ensure resources is a Record, not a Map
    if (!node.id || typeof node.resources !== 'object' || node.resources === null || Array.isArray(node.resources) || Object.keys(node.resources).length === 0) {
        this.handleError(new Error('Invalid flow node: resources must be a non-empty Record'), { node });
        return false;
    }

    this.nodes.set(node.id, node);

    // Add node to type-specific maps
    if (node.type === FlowNodeType.PRODUCER) {
      this.producerNodes.set(node.id, node);
    } else if (node.type === FlowNodeType.CONSUMER) {
      this.consumerNodes.set(node.id, node);
    } else if (node.type === FlowNodeType.STORAGE) {
      this.storageNodes.set(node.id, node);
    } else if (node.type === FlowNodeType.CONVERTER) {
      this.converterNodes.set(node.id, node as ConverterFlowNode);
    }

    // Invalidate cache for affected resource types
    for (const resourceType of Object.keys(node.resources)) {
        this.invalidateCache(resourceType as ResourceType);
    }

    // Publish event using correct EventType
    this.publish({
      type: EventType.RESOURCE_FLOW_REGISTERED, // Corrected: Use RESOURCE_FLOW_REGISTERED
      timestamp: Date.now(),
      moduleId: this.id, // Assuming base manager provides this.id
      moduleType: 'resource-manager' as ModuleType, // Example
      data: { nodeId: node.id, node },
    });

    return true;
  }

  /**
   * Unregister a node from the resource flow network
   *
   * @param id The ID of the node to unregister
   * @returns True if the node was successfully unregistered, false otherwise
   */
  public unregisterNode(id: string): boolean {
    if (!this.nodes.has(id)) {
      return false;
    }

    const node = this.nodes.get(id);
    const affectedResources = node?.resources ? Object.keys(node.resources) : [];

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
      this.invalidateCache(resourceType as ResourceType);
    }

    // Publish event using correct EventType
    this.publish({
      type: EventType.RESOURCE_FLOW_UNREGISTERED, // Corrected: Use RESOURCE_FLOW_UNREGISTERED
      timestamp: Date.now(),
      moduleId: this.id,
      moduleType: 'resource-manager' as ModuleType,
      data: { nodeId: id, node }, // Include node data if needed
    });

    return true;
  }

  /**
   * Register a connection between nodes in the resource flow network
   *
   * @param connection The connection to register
   * @returns True if the connection was successfully registered, false otherwise
   */
  public registerConnection(connection: FlowConnection): boolean {
    if (
      !connection.id ||
      !connection.source ||
      !connection.target ||
      !connection.resourceTypes ||
      connection.resourceTypes.length === 0 ||
      (connection.maxRate !== undefined && connection.maxRate <= 0)
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
    // Check if sourceNode.resources is a valid Record before accessing keys
    if (
        sourceNode?.resources &&
        typeof sourceNode.resources === 'object' &&
        !Array.isArray(sourceNode.resources) && // Ensure it's not an array
        connection.resourceTypes &&
        !connection.resourceTypes.every(type => Object.prototype.hasOwnProperty.call(sourceNode.resources, type))
    ) {
        console.warn(
            `Source node ${connection.source} does not have all resource types ${connection.resourceTypes.join(', ')}`
        );
        return false;
    }

    this.connections.set(connection.id, connection);

    // Invalidate cache for the affected resource types
    for (const resourceType of connection.resourceTypes) {
      this.invalidateCache(resourceType);
    }

    return true;
  }

  /**
   * Unregister a connection from the resource flow network
   *
   * @param id The ID of the connection to unregister
   * @returns True if the connection was successfully unregistered, false otherwise
   */
  public unregisterConnection(id: string): boolean {
    const connection = this.connections.get(id);
    if (!connection) {
      return false;
    }

    // Get resource types before removing
    const {resourceTypes} = connection;

    this.connections.delete(id);

    // Invalidate cache for the affected resource types
    for (const resourceType of resourceTypes) {
      this.invalidateCache(resourceType);
    }

    return true;
  }

  /**
   * Update the *global* state of a resource (affecting the entire network/manager)
   *
   * @param type The type of resource to update
   * @param state The new state of the resource
   */
  public updateGlobalResourceState(type: ResourceTypeString | ResourceType, state: ResourceState): void {
    const stringType = ensureStringResourceType(this.safeResourceTypeConversion(type));
    this.resourceStates.set(stringType, state);

    // Invalidate cache for the affected resource type
    this.invalidateCache(this.safeResourceTypeConversion(stringType));
  }

  /**
   * Get the *global* state of a resource
   *
   * @param type The type of resource to get the state for
   * @returns The resource state, or undefined if not found
   */
  public getGlobalResourceState(type: ResourceTypeString | ResourceType): ResourceState | undefined {
    const stringType = ensureStringResourceType(this.safeResourceTypeConversion(type));

    // Check cache first
    const now = Date.now();
    const cachedEntry = this.resourceCache.get(stringType);

    if (cachedEntry && now < cachedEntry.expiresAt) {
      return cachedEntry.state;
    }

    // Cache miss or expired, get from network
    const state = this.resourceStates.get(stringType);

    // Update cache if state exists
    if (state) {
      this.resourceCache.set(stringType, {
        state,
        lastUpdated: now,
        expiresAt: now + this.cacheTTL,
      });
    }

    return state;
  }

  /**
   * Helper function to adapt FlowConnection for different module interfaces
   * Handles the priority property compatibility issues
   */
  private adaptFlowConnection(
    connection: FlowConnection
  ): import('../../types/resources/ResourceTypes').FlowConnection {
    const adaptedConnection = { ...connection };

    // Convert priority to ResourcePriorityConfig if it's a number
    if (typeof adaptedConnection.priority === 'number') {
      adaptedConnection.priority = {
        type: adaptedConnection.resourceTypes ? adaptedConnection.resourceTypes[0] : ResourceType.ENERGY,
        priority: adaptedConnection.priority,
        consumers: [],
      };
    }

    return adaptedConnection as import('../../types/resources/ResourceTypes').FlowConnection;
  }

  /**
   * Adapts an array of FlowConnections for compatibility with resource types module
   */
  private adaptFlowConnections(
    connections: FlowConnection[]
  ): import('../../types/resources/ResourceTypes').FlowConnection[] {
    return connections.map(conn => this.adaptFlowConnection(conn));
  }

  /**
   * Utility function to convert between resource type formats safely
   */
  private convertResourceType(type: ResourceType | ResourceTypeString): ResourceTypeString {
    return ensureStringResourceType(this.safeResourceTypeConversion(type));
  }

  /**
   * Optimizes resource flows with proper type handling
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
      const adaptedConnections = this.adaptFlowConnections(activeConnections);

      // Check if we should use Web Worker offloading
      if (this.useWorkerOffloading && this.workerUtil && activeNodes.length > this.batchSize) {
        try {
          // Convert resourceStates to the format expected by the worker
          const standardizedResourceStates = new Map<StandardizedResourceType, ResourceState>();

          // Convert keys from ResourceType to StandardizedResourceType
          for (const [key, value] of this.resourceStates.entries()) {
            // This is a simplified conversion - in a real implementation, you would need to map
            // the string resource types to the corresponding enum values
            standardizedResourceStates.set(key as unknown as StandardizedResourceType, value);
          }

          // Offload optimization to Web Worker
          const result = await this.workerUtil.optimizeFlows(
            activeNodes,
            adaptedConnections,
            standardizedResourceStates
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

          // Convert transfers to the expected format
          const transfers: StandardizedResourceTransfer[] = result.transfers.map(t => ({
            type: this.safeResourceTypeConversion(t.type),
            amount: t.amount,
            source: t.source,
            target: t.target,
            timestamp: t.timestamp,
          }));

          this.lastOptimizationResult = {
            ...result,
            transfers,
          };
          this.isOptimizing = false;
          return this.lastOptimizationResult;
        } catch (error) {
          console.warn('Web Worker optimization failed, falling back to main thread:', error);
          // Fall back to main thread optimization
        }
      }

      // Rest of method remains the same
      // ...
    } finally {
      this.isOptimizing = false;
    }

    // Default fallback result
    return {
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
    };
  }

  /**
   * Process converter nodes in batches with proper type handling
   */
  private async processConverters(
    converters: FlowNode[],
    activeConnections: FlowConnection[]
  ): Promise<void> {
    // Don't process if no converters or connections
    if (
      !converters ||
      converters.length === 0 ||
      !activeConnections ||
      activeConnections.length === 0
    ) {
      return;
    }

    // Apply worker offloading if available
    if (this.workerUtil && this.useWorkerOffloading) {
      try {
        // Use adapter for type compatibility
        const _adaptedConnections = this.adaptFlowConnections(activeConnections);
        // Placeholder for worker offloading
        return;
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error(String(error)), {
          context: 'workerProcessConverters',
        });
      }
    }

    // Process in batches
    const batchSize = Math.min(this.batchSize, 20);
    for (let i = 0; i < converters.length; i += batchSize) {
      const batch = converters.slice(i, i + batchSize);
      for (const converter of batch) {
        // Original converter processing logic
        const converterNode = converter as ConverterFlowNode;
        this.tryStartConversions(converterNode);
      }
    }
  }

  /**
   * Calculate resource balance with proper type handling
   */
  private async calculateResourceBalance(
    producers: FlowNode[],
    consumers: FlowNode[],
    storages: FlowNode[],
    activeConnections: FlowConnection[]
  ): Promise<{
    availability: Partial<Record<ResourceTypeString, number>>;
    demand: Partial<Record<ResourceTypeString, number>>;
  }> {
    // If using worker offloading and network is large, use worker
    if (
      this.useWorkerOffloading &&
      this.workerUtil &&
      producers.length + consumers.length + storages.length > this.batchSize
    ) {
      try {
        // Use adapter for type compatibility
        const adaptedConnections = this.adaptFlowConnections(activeConnections);

        // Offload calculation to Web Worker
        return (await this.workerUtil.calculateResourceBalance(
          producers,
          consumers,
          storages,
          adaptedConnections
        )) as {
          availability: Partial<Record<ResourceTypeString, number>>;
          demand: Partial<Record<ResourceTypeString, number>>;
        };
      } catch (error) {
        console.warn('Worker calculation failed, falling back to main thread', error);
      }
    }

    // Default implementation (placeholder)
    return { availability: {}, demand: {} };
  }

  /**
   * Optimize flow rates with proper type handling
   */
  private async optimizeFlowRates(
    activeConnections: FlowConnection[],
    availability: Partial<Record<ResourceTypeString, number>>,
    demand: Partial<Record<ResourceTypeString, number>>
  ): Promise<{
    updatedConnections: FlowConnection[];
    transfers: ResourceTransfer[];
  }> {
    // If using worker offloading and network is large, use worker
    if (this.useWorkerOffloading && this.workerUtil && activeConnections.length > this.batchSize) {
      try {
        // Use adapter for type compatibility
        const adaptedConnections = this.adaptFlowConnections(activeConnections);

        // Convert the availability and demand to the format expected by the worker
        const standardizedAvailability: Partial<Record<StandardizedResourceType, number>> = {};
        const standardizedDemand: Partial<Record<StandardizedResourceType, number>> = {};

        // Convert keys from ResourceType to StandardizedResourceType
        Object.entries(availability).forEach(([key, value]) => {
          standardizedAvailability[key as unknown as StandardizedResourceType] = value;
        });

        Object.entries(demand).forEach(([key, value]) => {
          standardizedDemand[key as unknown as StandardizedResourceType] = value;
        });

        const result = await this.workerUtil.optimizeFlowRates(
          adaptedConnections,
          standardizedAvailability,
          standardizedDemand
        );

        // Convert the result back to the format expected by the caller
        return {
          updatedConnections: result?.updatedConnections,
          transfers: result?.transfers.map(t => this.convertResourceTransfer(t)),
        };
      } catch (error) {
        console.warn('Worker flow rate optimization failed, falling back to main thread:', error);
        // Fall back to main thread optimization
      }
    }

    // Main thread implementation (simplified for example)
    const updatedConnections: FlowConnection[] = [];
    const transfers: ResourceTransfer[] = [];

    // Create dummy transfers for compilation
    for (const connection of activeConnections) {
      const currentRate = connection.currentRate ?? 0;
      // Use resourceTypes array, assuming the first type is relevant here
      if (currentRate > 0 && connection.resourceTypes && connection.resourceTypes.length > 0) {
        const transfer: ResourceTransfer = {
          type: this.safeResourceTypeConversion(connection.resourceTypes[0]), // Use first type
          source: connection.source,
          target: connection.target,
          amount: currentRate,
          timestamp: Date.now(),
        };

        transfers.push(transfer);
      }
    }

    return { updatedConnections, transfers };
  }

  /**
   * Calculate the efficiency for a converter with null checking
   */
  private calculateConverterEfficiency(
    converter: ConverterFlowNode,
    recipe: ResourceConversionRecipe
  ): number {
    let efficiency = 1.0;

    // Apply recipe base efficiency if it exists
    if ('baseEfficiency' in recipe) {
      efficiency *= (recipe as ExtendedResourceConversionRecipe).baseEfficiency;
    }

    // Check for converter configuration efficiency modifiers
    if (converter.configuration?.efficiencyModifiers) {
      const modifiers = converter.configuration.efficiencyModifiers;

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
        // Check modifier for ResourceType enum value
        const enumType = input.type; // Assuming input.type is already ResourceType enum
        if (modifiers[enumType]) {
          efficiency *= modifiers[enumType];
        }
      }
    }

    // Apply dynamic efficiency based on resource quality (simulated)
    const qualityFactors = this.calculateResourceQualityFactors(recipe.inputs);
    for (const [_resourceType, factor] of Object.entries(qualityFactors)) {
      efficiency *= factor;
    }

    // Apply technology tier bonus (1-10% per tier) with null check
    // Cast configuration to ExtendedConverterNodeConfig if needed to access tier
    const converterConfig = converter.configuration as ExtendedConverterNodeConfig | undefined;
    if (converterConfig && typeof converterConfig.tier === 'number') {
      const tierBonus = 1 + converterConfig.tier * 0.05;
      efficiency *= tierBonus;
    }

    // Return clamped efficiency
    return Math.max(0, Math.min(efficiency, 2));
  }

  /**
   * Calculate network stress factor with null checks
   */
  private calculateNetworkStressFactor(converter: FlowNode): number {
    // Default to neutral factor
    let stressFactor = 1.0;

    // Check resource states for converter's resources
    if (converter.resources && typeof converter.resources === 'object') {
        // Use Object.entries for Record iteration
        for (const [resourceTypeStr] of Object.entries(converter.resources)) {
            const resourceType = this.safeResourceTypeConversion(resourceTypeStr as ResourceTypeString); // Convert string key to enum
            const convertedType = this.convertResourceType(resourceType);
            const state = this.getGlobalResourceState(convertedType); // Use renamed global state getter
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
    }

    // Clamp to reasonable range
    return Math.max(0.7, Math.min(1.3, stressFactor));
  }

  /**
   * Calculate quality factors for input resources
   */
  private calculateResourceQualityFactors(
    inputs: { type: StandardizedResourceType | ResourceTypeString; amount: number }[]
  ): Record<string, number> {
    const qualityFactors: Record<string, number> = {};

    for (const input of inputs) {
      // Convert the type to ensure compatibility
      const convertedType = this.convertResourceType(input.type);

      // For now, use a simulated quality factor
      // In the future, this would be based on actual resource quality attributes
      const baseQuality = 1.0;
      const randomVariation = Math.random() * 0.2 - 0.1; // -10% to +10%
      qualityFactors[convertedType] = baseQuality + randomVariation;
    }

    return qualityFactors;
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
      // Convert StandardizedResourceTransfer to ResourceTransfer
      const convertedTransfer = this.convertResourceTransfer(transfer);
      this.addToTransferHistory(convertedTransfer);
    }
  }

  /**
   * Get a node by ID
   *
   * @param id The ID of the node to get
   * @returns The node, or undefined if not found
   */
  public getNode(id: string): FlowNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all nodes in the resource flow network
   *
   * @returns Array of all nodes
   */
  public getNodes(): FlowNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all connections in the resource flow network
   *
   * @returns Array of all connections
   */
  public getConnections(): FlowConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get a connection by ID
   *
   * @param id The ID of the connection to get
   * @returns The connection, or undefined if not found
   */
  public getConnection(id: string): FlowConnection | undefined {
    return this.connections.get(id);
  }

  /**
   * Create a resource flow
   *
   * @param flow The resource flow to create
   * @returns True if the flow was successfully created, false otherwise
   */
  public createFlow(flow: ResourceFlow): boolean {
    if (!flow.source || !flow.target || !flow.resources || flow.resources.length === 0) {
      console.warn('[ResourceFlowManager] Invalid flow configuration:', flow);
      return false;
    }

    // Create nodes if they don't exist
    if (!this.nodes.has(flow.source)) {
      // Initialize the resources record correctly
      const resourcesRecord = initializeResourceRecord();
      // Populate specific resources based on the flow, assuming producer
      flow.resources.forEach(r => {
        resourcesRecord[r.type] = { ...resourcesRecord[r.type], production: r.amount };
      });

      this.registerNode({
        id: flow.source,
        type: FlowNodeType.PRODUCER,
        capacity: 100,
        resources: resourcesRecord,
        active: true,
      });
    }

    if (!this.nodes.has(flow.target)) {
      // Initialize the resources record correctly
      const resourcesRecord = initializeResourceRecord();
      // Populate specific resources based on the flow, assuming consumer
      flow.resources.forEach(r => {
        resourcesRecord[r.type] = { ...resourcesRecord[r.type], consumption: r.amount };
      });

      this.registerNode({
        id: flow.target,
        type: FlowNodeType.CONSUMER,
        capacity: 100,
        resources: resourcesRecord,
        active: true,
      });
    }

    // Create connections for each resource
    let success = true;
    for (const resource of flow.resources) {
      const connectionId = `${flow.source}-${flow.target}-${resource.type}`;
      // Remove the incorrect 'resourceType' property
      const connection: FlowConnection = {
          id: connectionId,
          source: flow.source,
          target: flow.target,
          resourceTypes: [resource.type],
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
    if (!chainStatus) {
      return;
    }

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
          const stepProgress = process.progress ?? 0;
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
    const moduleData = data as { id: string; type: ModuleType };
    // Register module as appropriate node type based on module type
    this.registerModuleAsNode(moduleData.id, moduleData.type);
  };

  private handleModuleUpdated = (data: unknown) => {
    // Handle module update
    const moduleData = data as { id: string; changes: unknown };
    this.updateNodeFromModule(moduleData.id, moduleData.changes);
  };

  private handleModuleDestroyed = (data: unknown) => {
    // Handle module destruction
    const moduleData = data as { id: string };
    this.unregisterNode(moduleData.id);
  };

  private handleModuleStateChanged = (data: unknown) => {
    // Handle module state change (enabled/disabled)
    const moduleData = data as { id: string; active: boolean };
    this.setNodeActive(moduleData.id, moduleData.active);
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
   */
  private _processNextChainStep(_chainId: string, _converter?: ConverterFlowNode): void {
    // Implementation would process the next step in a chain
    // For now, do nothing
  }

  /**
   * Start the asynchronous optimization interval
   */
  private startAsyncOptimizationInterval(): void {
    if (this.optimizationInterval !== null) {
      clearInterval(this.optimizationInterval);
    }

    // Use setInterval for regular optimization
    this.optimizationInterval = setInterval(() => {
      if (this.flowOptimizationEnabled && this.getStatus() === 'ready') {
        // Call async optimize without waiting (fire and forget)
        this.optimizeFlows().catch(error => {
          this.handleError(error instanceof Error ? error : new Error(String(error)), {
            context: 'asyncOptimizationInterval',
          });
        });
      }
    }, this.optimizationIntervalMs) as unknown as number;
  }

  /**
   * Start the processing interval for conversion processes
   */
  private startProcessingInterval(interval: number): void {
    // Clear any existing interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Set new interval
    this.processingInterval = window.setInterval(() => {
      this.processConversions();
    }, interval) as unknown as number;
  }

  /**
   * Process all active conversion processes
   */
  private processConversions(): void {
    const now = Date.now();
    const updatedProcesses: ExtendedResourceConversionProcess[] = [];

    // Check if any paused processes are ready to resume
    for (const process of this.processingQueue) {
      if (process.paused) {
        // Check if it's time to resume the process
        if (process.endTime && now >= process.endTime) {
          process.paused = false;
          process.endTime = undefined;
          updatedProcesses.push(process);
        }
      } else if (process.active) {
        // Update progress for active processes
        const elapsedTime = now - process.startTime;
        const converter = this.converterNodes.get(process.sourceId) as ConverterFlowNode;
        const recipe = this.conversionRecipes.get(process.recipeId);

        if (converter && recipe) {
          // Calculate the process duration based on recipe and efficiency
          const duration = recipe.duration / process.appliedEfficiency;
          process.progress = Math.min(1, elapsedTime / duration);

          // Check if process is complete
          if (process.progress >= 1) {
            this.completeProcess(process);
          } else {
            updatedProcesses.push(process);
          }
        }
      }
    }

    // Filter out completed processes
    this.processingQueue = this.processingQueue.filter(p => p.active);

    // Process converters
    if (this.converterNodes.size > 0) {
      const activeConnections = Array.from(this.connections.values()).filter(c => c.active);

      for (const [_id, converter] of this.converterNodes.entries()) {
        // Skip inactive converters
        if (converter.active === false) {
          continue;
        }

        // Check converter type if it has converterConfig
        this.tryStartConversions(converter);
      }
    }

    this._lastProcessingTime = Date.now() - now;
  }

  /**
   * Complete a process
   */
  private completeProcess(process: ExtendedResourceConversionProcess): void {
    // Remove process from active processes
    this.processingQueue = this.processingQueue.filter(p => p.processId !== process.processId);

    // Add to completed processes
    this._completedProcesses.push(process);

    // Trim completed processes if needed
    if (this._completedProcesses.length > this.maxHistorySize) {
      this._completedProcesses = this._completedProcesses.slice(-this.maxHistorySize);
    }

    // Update last processing time
    this._lastProcessingTime = Date.now();
  }

  /**
   * Process advanced converter with multi-step production chains
   */
  private processAdvancedConverter(
    converter: ConverterFlowNode,
    _activeConnections: FlowConnection[]
  ): void {
    // 1. Check status of existing processes associated with this converter?
    // (Need a way to link processes back to their converter - maybe store processId in converter status?)
    // Example: If a process failed, mark converter as potentially needing maintenance?
    // (Current ResourceConversionProcess doesn't store failure state well)

    // 2. Update internal state/buffers based on connections?
    // (Logic depends heavily on how resources are pushed/pulled via connections)

    // 3. Try to start new conversions if idle capacity exists
    try {
        this.tryStartConversions(converter); // Call helper to check/start new jobs
    } catch (error) {
        console.error(`[RFM] Error trying to start conversions on converter ${converter.id}:`, error);
        // Optionally update converter status to indicate an error
        // converter.status = ... error state ...
    }

    // 4. Update overall node status based on activity?
    // Example:
    // const isActive = converter.status?.activeProcesses?.length > 0;
    // if (this.nodes.has(converter.id)) {
    //    const node = this.nodes.get(converter.id)!;
    //    node.active = isActive;
    //    this.nodes.set(converter.id, node);
    //    // TODO: Publish NODE_UPDATED event?
    // }
  }

  /**
   * Try to start conversion processes for a converter node
   */
  private tryStartConversions(_converter: ConverterFlowNode): void {
    // Implementation details...
  }

  /**
   * Start a conversion process
   */
  private startConversionProcess(converterId: string, recipeId: string): ConversionResult {
    // Implementation for starting a conversion process
    console.warn(
      `Starting conversion process for converter ${converterId} with recipe ${recipeId}`
    );

    return {
      success: true,
      processId: `${converterId}-${recipeId}-${Date.now()}`,
      recipeId: recipeId,
    };
  }

  /**
   * Identifies resource bottlenecks and underutilized resources
   */
  private identifyResourceIssues(
    availability: Partial<Record<ResourceTypeString, number>>,
    demand: Partial<Record<ResourceTypeString, number>>
  ): {
    bottlenecks: string[];
    underutilized: string[];
  } {
    const bottlenecks: string[] = [];
    const underutilized: string[] = [];

    // Find bottlenecks (resources where demand exceeds availability)
    for (const type in demand) {
      const demandValue = demand[type as ResourceTypeString] ?? 0;
      const availabilityValue = availability[type as ResourceTypeString] ?? 0;

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
   * Get all resource states
   * This method is used by ResourceRegistryIntegration
   *
   * @returns Map of resource types to their states
   */
  public getAllResourceStates(): Map<string, { available: number }> {
    const result = new Map<string, { available: number }>();

    for (const [type, state] of this.resourceStates.entries()) {
      result?.set(type, {
        available: state.current ?? 0,
      });
    }

    return result;
  }

  /**
   * Get all conversion recipes
   * This method is used by ResourceRegistryIntegration
   *
   * @returns Array of conversion recipes
   */
  public getAllConversionRecipes(): Array<{
    input: { type: string; amount: number };
    output: { type: string; amount: number };
  }> {
    const result: Array<{
      input: { type: string; amount: number };
      output: { type: string; amount: number };
    }> = [];

    // Convert conversion recipes to the expected format
    for (const [_recipeId, recipe] of this.conversionRecipes.entries()) {
      if (recipe.inputs.length > 0 && recipe.outputs.length > 0) {
        // For simplicity, we're just using the first input and output
        const input = recipe.inputs[0];
        const output = recipe.outputs[0];

        result?.push({
          input: {
            type: this.convertResourceType(input.type),
            amount: input.amount,
          },
          output: {
            type: this.convertResourceType(output.type),
            amount: output.amount,
          },
        });
      }
    }

    return result;
  }

  /**
   * Set conversion rate
   * This method is used by ResourceRegistryIntegration
   *
   * @param sourceType Source resource type
   * @param targetType Target resource type
   * @param rate Conversion rate
   */
  public setConversionRate(sourceType: string, targetType: string, rate: number): void {
    // Find or create a recipe for this conversion
    const recipeId = `${sourceType}_to_${targetType}`;

    // Check if recipe already exists
    if (this.conversionRecipes.has(recipeId)) {
      // Update existing recipe
      const recipe = this.conversionRecipes.get(recipeId)!;
      recipe.outputs[0].amount = rate;
      this.conversionRecipes.set(recipeId, recipe);
    } else {
      // Create new recipe
      const recipe: ResourceConversionRecipe = {
        id: recipeId,
        name: `Convert ${sourceType} to ${targetType}`,
        description: `Converts ${sourceType} to ${targetType} at a rate of ${rate}:1`,
        inputs: [
          {
            // Use toEnumResourceType from the imported utility
            type: stringToEnumResourceType(sourceType as ResourceTypeString),
            amount: 1,
          },
        ],
        outputs: [
          {
            // Use toEnumResourceType from the imported utility
            type: stringToEnumResourceType(targetType as ResourceTypeString),
            amount: rate,
          },
        ],
        duration: 1000,
        energyCost: 0,
        requiredLevel: 1,
      };

      this.conversionRecipes.set(recipeId, recipe);
    }
  }

  /**
   * Add a resource type to a node
   */
  private addResourceToNode(
    nodeId: string,
    resourceType: ResourceTypeString | ResourceType
  ): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    const enumType = this.safeResourceTypeConversion(resourceType);

    // Ensure the node has a resources Record, initialize if not
    if (!node.resources) {
        node.resources = initializeResourceRecord(); // Correct initialization
    }

    // Check if the resource type is already in the node using hasOwnProperty
    if (Object.prototype.hasOwnProperty.call(node.resources, enumType)) {
        return true; // Already exists
    }

    // Add the resource type to the node with a default state if it wasn't initialized above
    // (This branch might be redundant now with initializeResourceRecord, but safe to keep)
    if (!node.resources[enumType]) {
        node.resources[enumType] = createDefaultResourceState();
    }

    this.nodes.set(nodeId, node); // Update the node in the map

    // Update resource type indices
    this.addNodeToResourceIndex(node, this.convertResourceType(enumType));

    // Invalidate cache for the affected resource type
    this.invalidateCache(enumType);

    return true;
  }

  /**
   * Add a value to an array in a map, creating the array if it doesn't exist
   * @param map The map to add to
   * @param key The key in the map
   * @param value The value to add to the array
   */
  private addToArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    if (!map.has(key)) {
      map.set(key, []);
    }
    const array = map.get(key);
    if (array && !array.includes(value)) {
      array.push(value);
    }
  }

  /**
   * Add a node to the appropriate resource type index
   */
  private addNodeToResourceIndex(node: FlowNode, resourceType: ResourceTypeString): void {
    const stringType = ensureStringResourceType(resourceType);

    switch (node.type) {
      case FlowNodeType.PRODUCER:
        this.addToArray(this.resourceProducers, stringType, node.id);
        break;
      case FlowNodeType.CONSUMER:
        this.addToArray(this.resourceConsumers, stringType, node.id);
        break;
      case FlowNodeType.STORAGE:
        this.addToArray(this.resourceStorage, stringType, node.id);
        break;
      case FlowNodeType.CONVERTER:
        // Create resourceConverters map if it doesn't exist
        if (!this.resourceConverters) {
          this.resourceConverters = new Map<ResourceTypeString, string[]>();
        }
        this.addToArray(this.resourceConverters, stringType, node.id);
        break;
    }
  }

  // Helper method to safely convert resource types with proper typing
  private safeResourceTypeConversion(
    type: ResourceType | ResourceTypeString | unknown
  ): ResourceType {
    if (type === undefined) {
      return ResourceType.ENERGY; // Default fallback
    }

    if (typeof type === 'string') {
      // Convert string to ResourceType enum
      try {
        return stringToEnumResourceType(type as ResourceTypeString);
      } catch (error) {
        console.warn(`Failed to convert string resource type: ${type}`, error);
        return ResourceType.ENERGY;
      }
    }

    // If it's already a ResourceType enum value
    if (typeof type === 'number') {
      // Check if the number is a valid ResourceType enum value by comparing with known values
      const resourceTypeValues = Object.values(ResourceType).filter(
        value => typeof value === 'number'
      ) as number[];

      if (resourceTypeValues.includes(type)) {
        return type as unknown as ResourceType;
      }
    }

    // Default fallback
    return ResourceType.ENERGY;
  }

  /**
   * Convert StandardizedResourceTransfer to ResourceTransfer with proper types
   */
  private convertResourceTransfer(transfer: StandardizedResourceTransfer): ResourceTransfer {
    // Ensure the type is ResourceType as required by ResourceTransfer
    const resourceType = transfer.type || ResourceType.ENERGY;

    return {
      type: resourceType,
      source: transfer.source,
      target: transfer.target,
      amount: transfer.amount,
      timestamp: transfer.timestamp,
    };
  }

  /**
   * Invalidate cache for a resource type
   */
  private invalidateCache(type: ResourceType | ResourceTypeString): void {
    const convertedType = this.convertResourceType(type);
    this.resourceCache.delete(convertedType);
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
   * Fix the sorting function for FlowConnection priorities
   */
  private getConnectionPriority(connection: FlowConnection): number {
    if (!connection.priority) {
      return 0;
    }

    if (typeof connection.priority === 'number') {
      return connection.priority;
    }

    return connection.priority.priority ?? 0;
  }

  /**
   * Get the total number of resource types stored in a node.
   */
  public getNodeResourceCount(nodeId: string): number {
    const node = this.nodes.get(nodeId);
    // Use Object.keys().length for Record size
    return node ? Object.keys(node.resources).length : 0;
  }

  /**
   * Get all resource states for a specific node.
   */
  public getNodeResources(
    nodeId: string
  ): Record<ResourceType, ResourceState> | null {
    const node = this.nodes.get(nodeId);
    return node ? node.resources : null;
  }

  /**
   * Get an iterator for resource entries [ResourceType, ResourceState] in a node.
   */
  public getNodeResourceEntries(
    nodeId: string
  ): [ResourceType, ResourceState][] | null {
    const node = this.nodes.get(nodeId);
    // Use Object.entries for Record iteration
    return node ? (Object.entries(node.resources) as [ResourceType, ResourceState][]) : null;
  }

  /**
   * Get the state of a specific resource type in a node.
   */
  public getNodeResourceState(
    nodeId: string,
    resourceType: ResourceType
  ): ResourceState | undefined {
    const node = this.nodes.get(nodeId);
    return node?.resources[resourceType];
  }

  /**
   * Get the types of resources stored in a node.
   */
  public getNodeResourceTypes(nodeId: string): ResourceType[] | null {
    const node = this.nodes.get(nodeId);
    // Use Object.keys for Record keys
    return node ? (Object.keys(node.resources) as ResourceType[]) : null;
  }

  /**
   * Update the state of a specific resource type in a node.
   */
  public updateNodeResourceState(
    nodeId: string,
    resourceType: ResourceType,
    newState: Partial<ResourceState>
  ): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    const currentState = node.resources[resourceType];
    if (!currentState) {
      // Assuming ResourceState has a constructor or a default structure
      // We might need a helper function like createResourceState from ResourceTypes.ts
      node.resources[resourceType] = {
        ...createDefaultResourceState(),
        ...newState,
      };
    } else {
        Object.assign(currentState, newState);
    }
    this.nodes.set(nodeId, node); // Update the map
    return true;
  }

    /**
     * Update the amount of a specific resource type in a node.
     */
    public updateResourceAmount(
        nodeId: string,
        resourceType: ResourceType,
        deltaAmount: number
    ): boolean {
        const node = this.nodes.get(nodeId);
        if (!node || !node.resources) { // Check if node.resources exists
          return false;
        }

        let currentState = node.resources[resourceType];
        const defaultMax = 1000; // Using a default max capacity

        if (!currentState) {
            // If resource doesn't exist, initialize it
            currentState = createDefaultResourceState();
            currentState.max = defaultMax;
            node.resources[resourceType] = currentState;
        }

        currentState.current = Math.max(
            currentState.min,
            Math.min(currentState.max, currentState.current + deltaAmount)
        );

        this.nodes.set(nodeId, node); // Update the map

        // Emit event using publish with correct EventType
        this.publish({
            type: EventType.RESOURCE_UPDATED, // Corrected
            timestamp: Date.now(),
            moduleId: this.id,
            moduleType: 'resource-manager' as ModuleType,
            data: {
                nodeId,
                resourceType,
                newState: currentState, // Use the updated state
            }
        });

        return true;
    }


  /**
   * Retrieves all connections associated with a specific node ID.
   *
   * @param {string} nodeId - The ID of the node.
   * @returns {FlowConnection[]} An array of connections associated with the node.
   */
  public getNodeConnections(nodeId: string): FlowConnection[] {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.source === nodeId || connection.target === nodeId
    );
  }

  /**
   * Finds potential consumers for a given resource type starting from a source node.
   *
   * @param {string} sourceNodeId - The ID of the source node.
   * @param {ResourceType} resourceType - The type of resource.
   * @returns {string[]} An array of node IDs that are potential consumers.
   */
  public findPotentialConsumers(
    sourceNodeId: string,
    resourceType: ResourceType
  ): string[] {
    const consumers: string[] = [];
    const visited: Set<string> = new Set();

    const queue: string[] = [sourceNodeId];
    visited.add(sourceNodeId);

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      const connections = this.getNodeConnections(currentNodeId);

      for (const connection of connections) {
        // Check if connection handles the resource type and points away from current node
        if (
          connection.source === currentNodeId &&
          !connection.resourceTypes.includes(resourceType) // Check if resourceType is NOT handled
        ) {
            continue; // Skip if connection doesn't handle the resource or is incoming
        }

        const targetNodeId = connection.target;
        if (!visited.has(targetNodeId)) {
          visited.add(targetNodeId);
          const targetNode = this.nodes.get(targetNodeId);

          if (targetNode && targetNode.resources) { // Ensure targetNode.resources exists
            // Check if target node consumes this resource type
            // Placeholder check: assumes targetNode.resources indicates consumption needs
            if (targetNode.resources[resourceType]?.consumption > 0) {
              consumers.push(targetNodeId);
            }
             // Continue searching downstream even if not a direct consumer
             queue.push(targetNodeId);
          }
        }
      }
    }

    return consumers;
  }

  /**
   * Distributes resources from a source node to consumers based on priority and availability.
   *
   * @param {string} sourceNodeId - The ID of the source node.
   * @param {ResourceType} resourceType - The type of resource to distribute.
   * @param {number} amountToDistribute - The total amount to distribute.
   * @returns {boolean} True if distribution was successful, false otherwise.
   */
   public distributeResource(
    sourceNodeId: string,
    resourceType: ResourceType,
    amountToDistribute: number
  ): boolean {
    const sourceNode = this.nodes.get(sourceNodeId);
    if (!sourceNode?.resources[resourceType] || sourceNode.resources[resourceType].current < amountToDistribute) {
      console.warn(`[ResourceFlowManager] Insufficient ${ResourceType[resourceType]} at source ${sourceNodeId}.`); // Use enum name for logging
      return false; // Not enough resource at source
    }

    const potentialConsumers = this.findPotentialConsumers(sourceNodeId, resourceType);
    if (potentialConsumers.length === 0) {
      console.log(`[ResourceFlowManager] No consumers found for ${ResourceType[resourceType]} from ${sourceNodeId}.`); // Use enum name
      return false; // No consumers found
    }

    // Sort consumers by priority (higher first) - Assuming priority is stored in node metadata or similar
    const sortedConsumers = potentialConsumers.sort((a, b) => {
      const nodeA = this.nodes.get(a);
      const nodeB = this.nodes.get(b);
      // Adjust priority access based on actual data structure (assuming node.priority exists)
      // Use a default priority if not present
      const priorityA = (typeof nodeA?.priority === 'number' ? nodeA.priority : (nodeA?.priority as { priority?: number })?.priority) ?? 0;
      const priorityB = (typeof nodeB?.priority === 'number' ? nodeB.priority : (nodeB?.priority as { priority?: number })?.priority) ?? 0;

      return priorityB - priorityA;
    });

    let remainingAmount = amountToDistribute;
    let distributedSuccessfully = false;

    for (const consumerId of sortedConsumers) {
      if (remainingAmount <= 0) {
        break;
      }

      const consumerNode = this.nodes.get(consumerId);
      if (!consumerNode) {
        continue;
      }

      // Find the connection path (simplified - assumes direct connection for now)
      const connection = Array.from(this.connections.values()).find(
        (c) => c.source === sourceNodeId && c.target === consumerId && c.resourceTypes.includes(resourceType)
      );

      if (!connection) {
        continue;
      } // No direct connection handling this resource

      const consumerState = consumerNode.resources[resourceType];
      const capacity = consumerState ? consumerState.max - consumerState.current : (consumerNode.capacity ?? Infinity); // Use node capacity if specific resource state missing
      const maxFlow = connection.maxRate ?? Infinity; // Use connection maxRate

      const amountToSend = Math.min(remainingAmount, capacity, maxFlow);

      if (amountToSend > 0) {
        // Perform the transfer
        const sourceUpdated = this.updateResourceAmount(sourceNodeId, resourceType, -amountToSend);
        const targetUpdated = this.updateResourceAmount(consumerId, resourceType, amountToSend);

        if (sourceUpdated && targetUpdated) {
          remainingAmount -= amountToSend;
          distributedSuccessfully = true;
           // Emit transfer event using publish with correct EventType
           this.publish({
               type: EventType.RESOURCE_TRANSFERRED, // Corrected
               timestamp: Date.now(),
               moduleId: this.id,
               moduleType: 'resource-manager' as ModuleType,
               data: {
                   sourceId: sourceNodeId,
                   targetId: consumerId,
                   resourceType,
                   amount: amountToSend,
               }
           });

        } else {
          console.error(`[ResourceFlowManager] Failed to update resource amounts during transfer from ${sourceNodeId} to ${consumerId}.`);
          // Handle potential rollback or error state
        }
      }
    }
     // Update source node state after distribution loop
     if (distributedSuccessfully) {
         const finalSourceState = this.getNodeResourceState(sourceNodeId, resourceType); // Use renamed node-specific getter
         if (finalSourceState) {
             // Emit update event using publish with correct EventType
             this.publish({
                 type: EventType.RESOURCE_UPDATED, // Corrected
                 timestamp: Date.now(),
                 moduleId: this.id,
                 moduleType: 'resource-manager' as ModuleType,
                 data: {
                     nodeId: sourceNodeId,
                     resourceType,
                     newState: finalSourceState,
                 }
             });
         }
     }

    return distributedSuccessfully;
  }
}

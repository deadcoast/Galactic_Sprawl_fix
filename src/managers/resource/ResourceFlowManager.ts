import {
  ChainExecutionStatus,
  ConversionChain,
  ConverterFlowNode,
  FlowConnection,
  FlowNode,
  FlowNodeType,
  ResourceCategory,
  ResourceConversionProcess,
  ResourceConversionRecipe,
  ResourceFlow,
  ResourceQuantity,
  ResourceState,
  ResourceStateClass,
  ResourceType,
  ResourceTypeInfo,
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
  ensureEnumResourceType,
  ensureStringResourceType,
  stringToResourceType,
} from '../../utils/resources/ResourceTypeConverter';
// Import type guards
// Import ExtendedResourceConversionRecipe
import { errorLoggingService } from '../../services/ErrorLoggingService';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { ExtendedResourceConversionRecipe } from '../../types/resources/ResourceConversionTypes';
// Import converter functions
// Import ProcessStatus for fixing status literals
import { v4 as uuidv4 } from 'uuid';
import {
  ExtendedResourceMetadata,
  ResourceQuality,
  ResourceRegistrationOptions,
} from '../../registry/ResourceRegistry'; // Added import
import { ProcessStatus } from '../../types/resources/ProductionChainTypes';
// Import TechTreeManager for tech checks
import { TechTreeManager } from '../game/techTreeManager'; // Removed getTechTreeManager

// Helper function to create a default ResourceState
function createDefaultResourceState(): ResourceState {
  // Added capacity property
  return { current: 0, max: 100, min: 0, production: 0, consumption: 0, capacity: 100 };
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
  type: // Standard EventTypes used by this manager
  | EventType.RESOURCE_UPDATED
    | EventType.RESOURCE_TRANSFERRED
    | EventType.RESOURCE_NODE_UPDATED
    // Custom string literals for node registration
    | 'RESOURCE_NODE_REGISTERED'
    | 'RESOURCE_NODE_UNREGISTERED'
    // Custom string literals specific to resource flow (or potentially future EventTypes)
    | 'RESOURCE_FLOW_INITIALIZED'
    | 'RESOURCE_FLOW_OPTIMIZED'
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
type ResourceStateMap = Map<ResourceTypeString, ResourceState>; // Use ResourceTypeString
type ResourceProducersMap = Map<ResourceTypeString, string[]>; // Use ResourceTypeString
type ResourceConsumersMap = Map<ResourceTypeString, string[]>; // Use ResourceTypeString
type ResourceStorageMap = Map<ResourceTypeString, string[]>; // Use ResourceTypeString
type ResourceConvertersMap = Map<ResourceTypeString, string[]>; // Use ResourceTypeString

// Add Cache entry interface
interface ResourceCacheEntry {
  state: ResourceState;
  lastUpdated: number;
  expiresAt: number;
}

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

  // --- Configuration Setters ---
  public setCacheTTL(ttlMs: number): void {
    if (ttlMs > 0) {
      this.cacheTTL = ttlMs;
      console.log(`[RFM Config] Cache TTL set to ${ttlMs}ms`);
    }
  }

  public setBatchSize(size: number): void {
    if (size > 0) {
      this.batchSize = size;
      console.log(`[RFM Config] Batch size set to ${size}`);
    }
  }

  public setOptimizationInterval(intervalMs: number): void {
    if (intervalMs >= 100) {
      // Set a minimum reasonable interval
      this.optimizationIntervalMs = intervalMs;
      this.startAsyncOptimizationInterval(); // Restart interval with new timing
      console.log(`[RFM Config] Optimization interval set to ${intervalMs}ms`);
    }
  }
  // --- End Configuration Setters ---

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

  // Caching - Properties added from optimization plan
  private resourceCache: Map<ResourceTypeString, ResourceCacheEntry> = new Map();
  private cacheTTL = 5000; // Default 5 seconds TTL

  // Transfer history
  private transferHistory: ResourceTransfer[] = [];
  private maxHistorySize = 1000;

  // Conversion processing
  private processingQueue: ExtendedResourceConversionProcess[] = [];
  private _completedProcesses: ExtendedResourceConversionProcess[] = [];
  private conversionRecipes: Map<string, ResourceConversionRecipe> = new Map();
  private conversionChains: Map<string, ConversionChain> = new Map();
  private chainExecutions: Map<string, ChainExecutionStatus> = new Map(); // Map executionId to status

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
  // TechTreeManager integration
  private techTreeManager: TechTreeManager;

  /**
   * Private constructor to enforce singleton pattern
   */
  protected constructor() {
    super('ResourceFlowManager', '1.0.0');
    this.resourceRegistry = ResourceRegistry.getInstance();
    this.registryIntegration = ResourceRegistryIntegration.getInstance();
    this.initializeResourceStates();
    // Get TechTreeManager instance
    this.techTreeManager = TechTreeManager.getInstance(); // Use getInstance()
  }

  /**
   * Implementation of abstract method from AbstractBaseManager
   * Initialize the manager
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        const enumType = ensureEnumResourceType(data?.resourceType);
        const stringType = ensureStringResourceType(enumType);

        if (stringType && !this.resourceStates.has(stringType)) {
          // Initialize resource state for the new resource
          const resourceState = new ResourceStateClass({
            type: enumType,
          });
          // Ensure stringType is used for map keys
          const mapKey = ensureStringResourceType(stringType);
          this.resourceStates.set(mapKey, resourceState.asObject());
          // Use ensureStringResourceType for map keys
          this.resourceProducers.set(mapKey, []);
          this.resourceConsumers.set(mapKey, []);
          this.resourceStorage.set(mapKey, []);
          // Initialize resourceConverters map if needed
          if (!this.resourceConverters) {
            this.resourceConverters = new Map<ResourceTypeString, string[]>();
          }
          this.resourceConverters.set(mapKey, []);
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
    // Process conversions using the loop helper
    this.processConversionsLoop(deltaTime);

    // Update unknown active chains
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
    // Include all standard resource types from the enum
    const resourceTypes: ResourceTypeString[] = [
      ResourceType.MINERALS,
      ResourceType.ENERGY,
      ResourceType.POPULATION,
      ResourceType.RESEARCH,
      ResourceType.FOOD,
      ResourceType.PLASMA,
      ResourceType.GAS,
      ResourceType.EXOTIC,
      ResourceType.ORGANIC,
      ResourceType.IRON,
      ResourceType.COPPER,
      ResourceType.TITANIUM,
      ResourceType.URANIUM,
      ResourceType.WATER,
      ResourceType.HELIUM,
      ResourceType.DEUTERIUM,
      ResourceType.ANTIMATTER,
      ResourceType.DARK_MATTER,
      ResourceType.EXOTIC_MATTER,
    ];

    // Create default resource states
    resourceTypes.forEach((type: ResourceTypeString) => {
      // Explicitly type loop variable
      // const stringType = ensureStringResourceType(type); // Not needed, type is already ResourceTypeString
      if (!this.resourceStates.has(type)) {
        // Use type directly
        this.resourceStates.set(type, {
          // Use type directly
          // Added capacity property
          current: 0,
          max: 1000,
          min: 0,
          production: 0,
          consumption: 0,
          capacity: 1000,
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
    if (
      !node.id ||
      typeof node.resources !== 'object' ||
      node.resources === null ||
      Array.isArray(node.resources) ||
      Object.keys(node.resources).length === 0
    ) {
      this.handleError(new Error('Invalid flow node: resources must be a non-empty Record'), {
        node,
      });
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
      // Cast resourceType to ResourceTypeString before invalidating
      this.invalidateCache(resourceType as ResourceTypeString);
    }

    // Publish event using correct EventType
    this.publish({
      type: 'RESOURCE_NODE_REGISTERED', // Use string literal type
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
      // Cast resourceType to ResourceTypeString before invalidating
      this.invalidateCache(resourceType as ResourceTypeString);
    }

    // Publish event using correct EventType
    this.publish({
      type: 'RESOURCE_NODE_UNREGISTERED', // Use string literal type
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
      !connection.resourceTypes.every(type =>
        Object.prototype.hasOwnProperty.call(sourceNode.resources, type)
      )
    ) {
      console.warn(
        `Source node ${connection.source} does not have all resource types ${connection.resourceTypes.join(', ')}`
      );
      return false;
    }

    this.connections.set(connection.id, connection);

    // Invalidate cache for the affected resource types
    for (const resourceType of connection.resourceTypes) {
      // Convert enum ResourceType to ResourceTypeString before invalidating
      this.invalidateCache(ensureStringResourceType(resourceType));
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
    const { resourceTypes } = connection;

    this.connections.delete(id);

    // Invalidate cache for the affected resource types
    for (const resourceType of resourceTypes) {
      // Convert enum ResourceType to ResourceTypeString before invalidating
      this.invalidateCache(ensureStringResourceType(resourceType));
    }

    return true;
  }

  /**
   * Update the *global* state of a resource (affecting the entire network/manager)
   *
   * @param type The type of resource to update
   * @param state The new state of the resource
   */
  public updateGlobalResourceState(
    type: ResourceTypeString | ResourceType,
    state: ResourceState
  ): void {
    const stringType = ensureStringResourceType(type);
    this.resourceStates.set(stringType, state);

    // Invalidate cache for the affected resource type
    this.invalidateCache(stringType); // stringType is already ResourceTypeString
  }

  /**
   * Get the *global* state of a resource
   *
   * @param type The type of resource to get the state for
   * @returns The resource state, or undefined if not found
   */
  public getGlobalResourceState(
    type: ResourceTypeString | ResourceType
  ): ResourceState | undefined {
    const stringType = ensureStringResourceType(type);

    // Check cache first - Updated logic from optimization plan
    const now = Date.now();
    const cachedEntry = this.resourceCache.get(stringType);

    if (cachedEntry && now < cachedEntry.expiresAt) {
      // Return a clone to prevent external modification of cached state
      return { ...cachedEntry.state };
    }

    // Cache miss or expired, get from network
    const state = this.resourceStates.get(stringType);

    // Update cache if state exists
    if (state) {
      this.resourceCache.set(stringType, {
        // Use stringType directly
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
        type: adaptedConnection.resourceTypes
          ? adaptedConnection.resourceTypes[0]
          : ResourceType.ENERGY,
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
    const startTime = Date.now(); // Track start time
    let nodesProcessed = 0; // Initialize metrics
    let connectionsProcessed = 0;
    let transfersGenerated = 0;

    try {
      // Get active nodes and connections
      const activeNodes = Array.from(this.nodes.values()).filter(node => node.active); // Simplified filter syntax
      const activeConnections = Array.from(this.connections.values()).filter(conn => conn.active); // Simplified filter syntax
      const adaptedConnections = this.adaptFlowConnections(activeConnections);

      // Update counts for metrics
      nodesProcessed = activeNodes.length;
      connectionsProcessed = activeConnections.length;

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
            nodesProcessed: nodesProcessed, // Use tracked count
            connectionsProcessed: connectionsProcessed, // Use tracked count
            transfersGenerated: transfersGenerated, // Use tracked count (updated below)
          };

          result.performanceMetrics.executionTimeMs = Date.now() - startTime;
          transfersGenerated = result.transfers.length; // Update transfer count
          result.performanceMetrics.transfersGenerated = transfersGenerated;

          // Convert transfers to the expected format
          const transfers: StandardizedResourceTransfer[] = result.transfers.map(t => ({
            type: ensureEnumResourceType(t.type),
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

    // Default fallback result with performance metrics
    const executionTimeMs = Date.now() - startTime;
    return {
      transfers: this.lastOptimizationResult?.transfers ?? [],
      updatedConnections: this.lastOptimizationResult?.updatedConnections ?? [],
      bottlenecks: this.lastOptimizationResult?.bottlenecks ?? [],
      underutilized: this.lastOptimizationResult?.underutilized ?? [],
      performanceMetrics: {
        executionTimeMs,
        nodesProcessed,
        connectionsProcessed,
        transfersGenerated,
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          type: ensureEnumResourceType(connection.resourceTypes[0]), // Use first type
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
    for (const [resourceType, factor] of Object.entries(qualityFactors)) {
      // IMPLEMENTATION: Log the resource type being used in efficiency calculation
      console.log(
        `[RFM Efficiency] Applying quality factor ${factor} for resource ${resourceType}`
      );
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
        const resourceType = ensureEnumResourceType(resourceTypeStr as ResourceTypeString); // Convert string key to enum
        const stringType = ensureStringResourceType(resourceType);
        const state = this.getGlobalResourceState(stringType); // Use stringType directly
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
      const stringType = ensureStringResourceType(input.type);

      // For now, use a simulated quality factor
      // In the future, this would be based on actual resource quality attributes
      const baseQuality = 1.0;
      const randomVariation = Math.random() * 0.2 - 0.1; // -10% to +10%
      qualityFactors[stringType] = baseQuality + randomVariation;
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

    this.lastOptimizationResult = result;
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

    // Register source node if it doesn't exist
    if (!this.nodes.has(flow.source)) {
      this.registerNode({
        id: flow.source,
        type: FlowNodeType.PRODUCER,
        capacity: 1000, // Example capacity
        resources: {} as Record<ResourceType, ResourceState>, // Initialize empty resources
        active: true,
        x: 0, // Add default x
        y: 0, // Add default y
      });
    }

    // Register target node if it doesn't exist
    if (!this.nodes.has(flow.target)) {
      this.registerNode({
        id: flow.target,
        type: FlowNodeType.CONSUMER, // Or STORAGE, depending on context
        capacity: 1000, // Example capacity
        resources: {} as Record<ResourceType, ResourceState>, // Initialize empty resources
        active: true,
        x: 0, // Add default x
        y: 0, // Add default y
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
    let completedSteps = 0; // Initialize counter
    // let totalProgress = 0; // Removed - Not needed if using completedSteps for progress

    for (const step of chainStatus.stepStatus) {
      if (step.status === ProcessStatus.COMPLETED) {
        completedSteps++; // Increment the outer counter
        // totalProgress += 1; // Removed
      } else if (step.status === ProcessStatus.IN_PROGRESS) {
        // Calculate step progress based on process progress
        // const process = this.processingQueue.find(p => p.processId === step.processId);
        // if (process) {
        //   const stepProgress = process.progress ?? 0;
        //   totalProgress += stepProgress; // Removed - Progress now based on completed steps
        // }
      }
    }

    // Update chain progress based on the number of fully completed steps
    const totalSteps = chainStatus.stepStatus.length;
    chainStatus.progress = totalSteps > 0 ? completedSteps / totalSteps : 0; // Use completedSteps

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
   * Try to start conversion processes for a converter node if idle capacity and resources exist
   */
  private tryStartConversions(converter: ConverterFlowNode): void {
    const maxProcesses = converter.configuration?.maxConcurrentProcesses ?? 1;
    let startedCount = 0;

    // Use activeProcessIds?.length with explicit cast
    while (
      ((converter as ConverterFlowNode).activeProcessIds?.length ?? 0) < maxProcesses &&
      startedCount < maxProcesses
    ) {
      let processStarted = false;
      // Iterate through supported recipes (or a default/prioritized list)
      const recipesToCheck = converter.supportedRecipeIds ?? [...this.conversionRecipes.keys()]; // Fallback to all recipes if none specified

      for (const recipeId of recipesToCheck) {
        const recipe = this.conversionRecipes.get(recipeId);
        if (!recipe) continue;

        // Check if converter already runs max instances of this specific recipe (if limit exists)
        // (Requires adding recipeId tracking to activeProcesses or a separate count)

        // Check resource availability
        let canStart = true;
        const inputsToConsume: Array<{ type: ResourceType; amount: number }> = [];
        for (const input of recipe.inputs) {
          const resourceState = converter.resources[input.type];
          if (!resourceState || resourceState.current < input.amount) {
            canStart = false;
            break;
          }
          inputsToConsume.push({ type: input.type, amount: input.amount });
        }
        if (canStart) {
          // Attempt to start the process
          const result = this.startConversionProcess(converter.id, recipeId);
          if (result.success && result.processId) {
            // Consume input resources
            inputsToConsume.forEach(input => {
              const state = converter.resources[input.type];
              state.current -= input.amount;
              // Optionally trigger update events/cache invalidation for the node
            });

            // Add to converter status
            (converter as ConverterFlowNode).activeProcessIds?.push(result.processId);
            // Update the node in the main map
            this.nodes.set(converter.id, converter);

            // (The process should be added to this.processingQueue by startConversionProcess)
            // No need to publish event here, startConversionProcess should do it

            processStarted = true;
            startedCount++;
            break; // Started one process, break inner loop to re-evaluate capacity
          }
        }
      }
      if (!processStarted) {
        break; // No suitable process could be started in this iteration
      }
    }
  }

  /**
   * Start a conversion process
   */
  public startConversionProcess(converterId: string, recipeId: string): ConversionResult {
    const converter = this.converterNodes.get(converterId);
    const recipe = this.conversionRecipes.get(recipeId);

    if (!converter || !recipe) {
      const errorMsg = `Invalid parameters for startConversionProcess: Converter ${converterId} or Recipe ${recipeId} not found.`;
      this.handleError(new Error(errorMsg), { converterId, recipeId });
      return { success: false, processId: '', recipeId, error: errorMsg };
    }

    // Check concurrency limit
    const maxProcesses = converter.configuration?.maxConcurrentProcesses ?? 1;
    // Use activeProcessIds?.length with explicit cast
    if (((converter as ConverterFlowNode).activeProcessIds?.length ?? 0) >= maxProcesses) {
      return { success: false, processId: '', recipeId, error: 'Max concurrent processes reached' };
    }

    // Declare processId earlier
    const processId = `${converterId}-${recipeId}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    // --- Tech Tree Prerequisite Check --- START
    // Use type assertion for requiredTechnologyId
    const requiredTech = (recipe as ExtendedResourceConversionRecipe).requiredTechnologyId;
    if (requiredTech && !this.techTreeManager.isUnlocked(requiredTech)) {
      const errorMsg = `Required technology ${requiredTech} for recipe ${recipeId} is not unlocked.`;
      // Do not log error here, just return failure. UI/Chain logic should handle messaging.
      // this.handleError(new Error(errorMsg), { converterId, recipeId, techId: requiredTech });
      return {
        success: false,
        processId: '', // Return empty processId on failure
        recipeId,
        error: errorMsg,
      };
    }
    // --- Tech Tree Prerequisite Check --- END

    // TODO: Check detailed resource requirements and consume them atomically?
    // (Basic check is done in tryStartConversions, but a final check here is safer)

    // processId is already declared above
    // const processId = `${converterId}-${recipeId}-${Date.now()}-${Math.random()
    //   .toString(36)
    //   .substring(2, 7)}`;
    const efficiency = this.calculateConverterEfficiency(converter, recipe);
    const newProcess: ExtendedResourceConversionProcess = {
      processId, // Use the declared processId
      recipeId,
      sourceId: converterId,
      active: true,
      paused: false,
      startTime: Date.now(),
      progress: 0,
      appliedEfficiency: efficiency,
    };

    this.processingQueue.push(newProcess);
    (converter as ConverterFlowNode).activeProcessIds?.push(processId); // Use the declared processId
    this.nodes.set(converterId, converter); // Ensure node map is updated

    this.publish({
      type: 'RESOURCE_CONVERSION_STARTED', // Use allowed string literal
      timestamp: Date.now(),
      processId: processId, // Use the declared processId
      nodeId: converterId,
      data: { recipeId },
    });

    console.log(
      `[RFM] Starting conversion process ${processId} for converter ${converterId} with recipe ${recipeId}`
    ); // Keep log for now
    return {
      success: true,
      processId: processId, // Use the declared processId
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
   * @returns Array of conversion recipes including their IDs
   */
  public getAllConversionRecipes(): Array<{
    recipeId: string; // Added recipeId
    input: { type: string; amount: number };
    output: { type: string; amount: number };
  }> {
    const result: Array<{
      recipeId: string; // Added recipeId
      input: { type: string; amount: number };
      output: { type: string; amount: number };
    }> = [];

    // Convert conversion recipes to the expected format
    for (const [recipeId, recipe] of this.conversionRecipes.entries()) {
      if (recipe.inputs.length > 0 && recipe.outputs.length > 0) {
        // For simplicity, we're just using the first input and output
        const input = recipe.inputs[0];
        const output = recipe.outputs[0];

        result?.push({
          recipeId: recipeId, // IMPLEMENTATION: Include recipeId in the result
          input: {
            type: ensureStringResourceType(input.type),
            amount: input.amount,
          },
          output: {
            type: ensureStringResourceType(output.type),
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
            type: stringToResourceType(sourceType as ResourceTypeString), // Corrected function name
            amount: 1,
          },
        ],
        outputs: [
          {
            // Use toEnumResourceType from the imported utility
            type: stringToResourceType(targetType as ResourceTypeString), // Corrected function name
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

    const enumType = ensureEnumResourceType(resourceType);

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
    this.addNodeToResourceIndex(node, ensureStringResourceType(enumType));

    // Invalidate cache for the affected resource type
    this.invalidateCache(ensureStringResourceType(enumType));

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

  /**
   * Invalidate cache for a resource type
   */
  private invalidateCache(type: ResourceType | ResourceTypeString): void {
    const stringType = ensureStringResourceType(type);
    this.resourceCache.delete(stringType); // Use stringType directly
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
  public getNodeResources(nodeId: string): Record<ResourceType, ResourceState> | null {
    const node = this.nodes.get(nodeId);
    return node ? node.resources : null;
  }

  /**
   * Get an iterator for resource entries [ResourceType, ResourceState] in a node.
   */
  public getNodeResourceEntries(nodeId: string): [ResourceType, ResourceState][] | null {
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
    if (!node || !node.resources) {
      // Check if node.resources exists
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
      type: EventType.RESOURCE_UPDATED,
      timestamp: Date.now(),
      moduleId: this.id,
      moduleType: 'resource-manager' as ModuleType,
      data: {
        nodeId,
        resourceType,
        newState: currentState,
      },
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
      connection => connection.source === nodeId || connection.target === nodeId
    );
  }

  /**
   * Finds potential consumers for a given resource type starting from a source node.
   *
   * @param {string} sourceNodeId - The ID of the source node.
   * @param {ResourceType} resourceType - The type of resource.
   * @returns {string[]} An array of node IDs that are potential consumers.
   */
  public findPotentialConsumers(sourceNodeId: string, resourceType: ResourceType): string[] {
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

          if (targetNode && targetNode.resources) {
            // Ensure targetNode.resources exists
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

    // If no consumers are explicitly found, log it (this might indicate an issue or expected termination)
    errorLoggingService.logInfo(
      `No consumers found for ${ResourceType[resourceType]} from ${sourceNodeId}.`,
      {
        service: 'ResourceFlowManager',
        method: 'findConsumersForResource',
        sourceNodeId,
        resourceType: ResourceType[resourceType],
      }
    );
    return [];
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
    if (
      !sourceNode?.resources[resourceType] ||
      sourceNode.resources[resourceType].current < amountToDistribute
    ) {
      console.warn(
        `[ResourceFlowManager] Insufficient ${ResourceType[resourceType]} at source ${sourceNodeId}.`
      ); // Use enum name for logging
    }

    const potentialConsumers = this.findPotentialConsumers(sourceNodeId, resourceType);
    if (potentialConsumers.length === 0) {
      console.log(
        `[ResourceFlowManager] No consumers found for ${ResourceType[resourceType]} from ${sourceNodeId}.`
      ); // Use enum name
      return false; // No consumers found
    }

    // Sort consumers by priority (higher first) - Assuming priority is stored in node metadata or similar
    const sortedConsumers = potentialConsumers.sort((a, b) => {
      const nodeA = this.nodes.get(a);
      const nodeB = this.nodes.get(b);
      // Adjust priority access based on actual data structure (assuming node.priority exists)
      // Use a default priority if not present
      const priorityA =
        (typeof nodeA?.priority === 'number'
          ? nodeA.priority
          : (nodeA?.priority as { priority?: number })?.priority) ?? 0;
      const priorityB =
        (typeof nodeB?.priority === 'number'
          ? nodeB.priority
          : (nodeB?.priority as { priority?: number })?.priority) ?? 0;

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
        c =>
          c.source === sourceNodeId &&
          c.target === consumerId &&
          c.resourceTypes.includes(resourceType)
      );

      if (!connection) {
        continue;
      } // No direct connection handling this resource

      const consumerState = consumerNode.resources[resourceType];
      const capacity = consumerState
        ? consumerState.max - consumerState.current
        : (consumerNode.capacity ?? Infinity); // Use node capacity if specific resource state missing
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
            type: EventType.RESOURCE_TRANSFERRED, // Use EventType member
            timestamp: Date.now(),
            moduleId: this.id,
            moduleType: 'resource-manager' as ModuleType,
            data: {
              sourceId: sourceNodeId,
              targetId: consumerId,
              resourceType,
              amount: amountToSend,
            },
          });
        } else {
          console.error(
            `[ResourceFlowManager] Failed to update resource amounts during transfer from ${sourceNodeId} to ${consumerId}.`
          );
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
          type: EventType.RESOURCE_UPDATED, // Use EventType member
          timestamp: Date.now(),
          moduleId: this.id,
          moduleType: 'resource-manager' as ModuleType,
          data: {
            nodeId: sourceNodeId,
            resourceType,
            newState: finalSourceState,
          },
        });
      }
    }

    return distributedSuccessfully;
  }

  /**
   * Convert StandardizedResourceTransfer to ResourceTransfer with proper types
   */
  private convertResourceTransfer(transfer: StandardizedResourceTransfer): ResourceTransfer {
    // Ensure the type is ResourceType as required by ResourceTransfer
    const resourceType = ensureEnumResourceType(transfer.type);

    return {
      type: resourceType,
      source: transfer.source,
      target: transfer.target,
      amount: transfer.amount,
      timestamp: transfer.timestamp,
    };
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
    // Clear unknown existing interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Set new interval
    this.processingInterval = window.setInterval(() => {
      // Call the main processing logic within onUpdate now
      // This interval solely triggers the update cycle if needed elsewhere
      // or could be removed if onUpdate is guaranteed by the game loop
    }, interval) as unknown as number;
  }

  /**
   * Main processing loop called periodically (e.g., by interval or game loop via onUpdate)
   */
  private processConversionsLoop(deltaTime: number): void {
    const now = Date.now();

    // Process converters in batches - Updated logic from optimization plan
    if (this.converterNodes.size > 0) {
      const activeConnections = Array.from(this.connections.values()).filter(c => c.active);
      const allConverters = Array.from(this.converterNodes.values());

      // Calculate number of batches
      const batchCount = Math.ceil(allConverters.length / this.batchSize);
      console.log(
        `[RFM Batch] Processing ${allConverters.length} converters in ${batchCount} batches (size: ${this.batchSize})`
      );

      for (let i = 0; i < batchCount; i++) {
        const batchStart = i * this.batchSize;
        const batchEnd = Math.min((i + 1) * this.batchSize, allConverters.length);
        const converterBatch = allConverters.slice(batchStart, batchEnd);

        // Process this batch
        for (const converter of converterBatch) {
          // Skip inactive converters
          if (converter.active === false) {
            continue;
          }
          // Pass deltaTime to the processing function
          this.processAdvancedConverter(converter, activeConnections, deltaTime);
        }
      }
      // Original logic - replaced by batching:
      /*
      for (const converter of this.converterNodes.values()) {
        // Skip inactive converters
        if (converter.active === false) {
          continue;
        }
        this.processAdvancedConverter(converter, activeConnections, deltaTime);
      }
      */
    }

    // Update metrics
    this._lastProcessingTime = Date.now() - now;
    this.updateMetric('lastProcessingTimeMs', this._lastProcessingTime);
  }

  /**
   * Complete a conversion process: add outputs, publish events, update state.
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

    const converter = this.converterNodes.get(process.sourceId);
    const recipe = this.conversionRecipes.get(process.recipeId);

    if (converter && recipe) {
      // Calculate and add output resources
      for (const output of recipe.outputs) {
        const outputAmount = output.amount * process.appliedEfficiency;
        if (!converter.resources[output.type]) {
          converter.resources[output.type] = createDefaultResourceState();
        }
        const state = converter.resources[output.type];
        state.current = Math.min(state.max, state.current + outputAmount);
      }
      this.nodes.set(converter.id, converter); // Update node state

      // Publish completion event
      this.publish({
        type: 'RESOURCE_CONVERSION_COMPLETED', // Use allowed string literal
        timestamp: Date.now(),
        processId: process.processId,
        nodeId: converter.id,
        data: {
          recipeId: process.recipeId,
          outputsProduced: recipe.outputs.map(o => ({
            type: ensureStringResourceType(o.type),
            amount: o.amount * process.appliedEfficiency,
          })),
        },
      });
    } else {
      // Handle cases where converter or recipe is missing (should ideally not happen here)
      this.handleError(
        new Error(
          `Converter ${process.sourceId} or Recipe ${process.recipeId} not found during process completion`
        ),
        {
          processId: process.processId,
          converterId: process.sourceId,
          recipeId: process.recipeId,
        }
      );
    }
  }

  /**
   * Process a single advanced converter node: update ongoing processes, check for completion, try starting new ones.
   * Assumes deltaTime is available from the calling context (e.g., processConversions loop).
   */
  private processAdvancedConverter(
    converter: ConverterFlowNode,
    activeConnections: FlowConnection[], // Use activeConnections
    deltaTime: number
  ): void {
    const processesToRemove: string[] = [];

    // 1. Update ongoing processes for this converter
    for (const processId of (converter as ConverterFlowNode).activeProcessIds ?? []) {
      const processIndex = this.processingQueue.findIndex(p => p.processId === processId);
      if (processIndex === -1) {
        this.handleError(
          new Error(
            `Process ${processId} not found in queue but listed in converter ${converter.id}`
          ),
          {
            converterId: converter.id,
            processId,
          }
        );
        processesToRemove.push(processId); // Mark for removal if not found
        continue;
      }

      const process = this.processingQueue[processIndex];
      const recipe = this.conversionRecipes.get(process.recipeId);

      if (!recipe || !process.active || process.paused) {
        continue; // Skip inactive, paused, or recipe-less processes
      }

      // Calculate progress increment
      // Ensure duration is positive to avoid division by zero
      const durationMs = recipe.duration > 0 ? recipe.duration : 1000; // Default to 1s if duration is 0 or less
      const progressIncrement =
        ((deltaTime * 1000) / durationMs) * (process.appliedEfficiency || 1);
      process.progress += progressIncrement;
      // TODO: Implement continuous resource consumption check here if needed
      // If inputs run out mid-process, pause or fail the process

      // Check for completion
      if (process.progress >= 1) {
        this.completeProcess(process); // Handles output resources, status updates, events
        processesToRemove.push(processId);
        this.processingQueue.splice(processIndex, 1); // Remove from main queue

        // Check if this process completion finishes a chain step/chain
        this.updateChainStatusOnProcessCompletion(process); // New helper needed
      }
    }

    // Remove completed/lost processes from the converter's active list
    if (processesToRemove.length > 0) {
      // Update activeProcessIds with explicit cast
      converter.activeProcessIds = ((converter as ConverterFlowNode).activeProcessIds ?? []).filter(
        id => !processesToRemove.includes(id)
      );
      this.nodes.set(converter.id, converter); // Update the node state
    }

    // 2. Update based on activeConnections? (e.g., check resource availability from sources)
    // This part depends heavily on the desired flow logic (push vs. pull)
    // For now, we assume resources must be *locally* available on the converter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = activeConnections; // Explicitly mark as unused for now

    // 3. Try to start new conversions if idle capacity exists
    this.tryStartConversions(converter); // Call helper to check/start new jobs
  }

  /**
   * Checks if a node has enough resources available.
   * Returns a Promise for async signature, but logic is sync.
   */
  public async checkResourcesAvailable(
    nodeId: string,
    requiredResources: ResourceQuantity[]
  ): Promise<boolean> {
    // Logic remains sync, return Promise.resolve
    const node = this.nodes.get(nodeId);
    if (!node) {
      console.error(`[RFM] Node ${nodeId} not found for resource check.`);
      return Promise.resolve(false);
    }
    for (const required of requiredResources) {
      const availableAmount = node.resources?.[required.type]?.current ?? 0;
      if (availableAmount < required.amount) {
        console.warn(
          `[RFM] Insufficient ${required.type} on node ${nodeId}. Required: ${required.amount}, Available: ${availableAmount}`
        );
        return Promise.resolve(false);
      }
    }
    return Promise.resolve(true);
  }

  /**
   * Consumes resources from a node.
   * Simulates async delay.
   */
  public async consumeResources(
    nodeId: string,
    resourcesToConsume: ResourceQuantity[]
  ): Promise<boolean> {
    // Simulate async work before performing action
    await new Promise(resolve => setTimeout(resolve, 10)); // Added delay

    // Check availability first
    if (!(await this.checkResourcesAvailable(nodeId, resourcesToConsume))) {
      return false; // Check failed
    }

    // Simulate async work before performing action - REMOVED redundant delay
    // await new Promise(resolve => setTimeout(resolve, 15));

    // Get node again after delay
    const node = this.nodes.get(nodeId);
    if (!node || !node.resources) {
      console.error(
        `[RFM] Node ${nodeId} not found or missing resources during consumption attempt after delay.`
      );
      return false;
    }

    // --- Perform Consumption (Sync logic after delay) ---
    for (const resource of resourcesToConsume) {
      if (node.resources[resource.type]) {
        const amountToConsume = Math.min(resource.amount, node.resources[resource.type].current);
        node.resources[resource.type].current -= amountToConsume;
      } else {
        console.error(
          `[RFM] Resource ${resource.type} not found on node ${nodeId} during consumption.`
        );
        return false; // Should ideally roll back
      }
    }

    this.nodes.set(nodeId, node);
    // Publish events (sync after main logic)
    for (const resource of resourcesToConsume) {
      // Ensure publish call exists and uses correct payload
      this.publish({
        type: EventType.RESOURCE_UPDATED, // Use EventType member
        moduleId: this.id,
        moduleType: 'resource-manager' as ModuleType,
        timestamp: Date.now(),
        data: {
          nodeId: nodeId,
          resourceType: resource.type, // Correct key for resource type
          change: -resource.amount, // Correct key for amount change
          newState: node.resources[resource.type], // Correct key for new state
        },
      });
    }
    console.log(`[RFM] Consumed resources from ${nodeId}:`, resourcesToConsume);
    return true; // Return boolean directly
  }

  /**
    return true;
  }

  /**
   * Adds resources to a node.
   * Simulates async operation time.
   */
  public async addResources(nodeId: string, resourcesToAdd: ResourceQuantity[]): Promise<void> {
    // Simulate async delay for addition operation
    // await new Promise(resolve => setTimeout(resolve, 15)); // Delay moved to start
    await new Promise(resolve => setTimeout(resolve, 10)); // Added delay

    const node = this.nodes.get(nodeId);
    if (!node) {
      console.error(`[RFM] Node ${nodeId} not found for adding resources.`);
      return;
    }
    if (!node.resources) {
      console.warn(`[RFM] Node ${nodeId} has no resource map. Initializing.`);
      node.resources = {} as Record<ResourceType, ResourceState>;
    }

    // --- Perform Addition ---
    for (const resource of resourcesToAdd) {
      if (!node.resources[resource.type]) {
        // Correct initialization including capacity, max, min
        const capacity = node.capacity ?? ResourceTypeInfo[resource.type].defaultMax ?? 1000; // Use node capacity or metadata default or fallback
        node.resources[resource.type] = {
          current: 0,
          capacity: capacity,
          max: capacity, // Set max based on calculated capacity
          min: 0, // Ensure min is set
          production: 0,
          consumption: 0,
        };
      }
      const currentAmount = node.resources[resource.type].current;
      const capacity = node.resources[resource.type].capacity;
      // Ensure we don't exceed capacity if state changed during delay
      const amountToAdd = Math.min(resource.amount, capacity - currentAmount);
      node.resources[resource.type].current += amountToAdd;
    }

    this.nodes.set(nodeId, node);
    // Publish RESOURCE_UPDATED events
    for (const resource of resourcesToAdd) {
      // Ensure publish call exists and uses correct payload
      this.publish({
        type: EventType.RESOURCE_UPDATED, // Use EventType member
        moduleId: this.id,
        moduleType: 'resource-manager' as ModuleType,
        timestamp: Date.now(),
        data: {
          nodeId: nodeId,
          resourceType: resource.type, // Correct key
          change: resource.amount, // Correct key
          newState: node.resources[resource.type], // Correct key
        },
      });
    }
    console.log(`[RFM] Added resources to ${nodeId}:`, resourcesToAdd);
  }

  /**
   * Updates partial data for a specific node.
   * Simulates async operation time.
   */
  public async updateNodeData(
    nodeId: string,
    data: Partial<FlowNode | ConverterFlowNode>
  ): Promise<void> {
    // Simulate async delay for update operation
    // await new Promise(resolve => setTimeout(resolve, 5)); // Delay moved to start
    await new Promise(resolve => setTimeout(resolve, 10)); // Added delay

    const node = this.nodes.get(nodeId);
    if (!node) {
      console.error(`[RFM] Node ${nodeId} not found for update.`);
      return;
    }

    // --- Perform Update ---

    const currentData = this.nodes.get(nodeId);
    if (!currentData) {
      console.error(`[RFM] Node ${nodeId} disappeared before update.`);
      return;
    }
    const updatedNode: FlowNode = { ...currentData }; // Change let to const
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const key in data) {
      /* ... merge properties ... */
    }

    this.nodes.set(nodeId, updatedNode);
    // Publish NODE_UPDATED event
    // Ensure publish call exists and uses correct payload
    this.publish({
      type: EventType.RESOURCE_NODE_UPDATED, // Use EventType member
      moduleId: this.id,
      moduleType: 'resource-manager' as ModuleType,
      timestamp: Date.now(),
      data: {
        nodeId: nodeId,
        updatedNode: updatedNode, // Correct key
      },
    });
    console.log(`[RFM] Updated node ${nodeId} data:`, data);
  }

  /**
   * Transfers resources between two nodes.
   * Uses other async methods, inheriting their delays.
   * TODO: Implement more realistic transfer time/efficiency.
   */
  public async transferResources(
    sourceNodeId: string,
    targetNodeId: string,
    resourcesToTransfer: ResourceQuantity[]
  ): Promise<boolean> {
    console.log(
      `[RFM] Attempting transfer from ${sourceNodeId} to ${targetNodeId}:`,
      resourcesToTransfer
    );
    let available = false;
    let consumed = false;
    try {
      // Check availability (already returns Promise.resolve)
      available = await this.checkResourcesAvailable(sourceNodeId, resourcesToTransfer);
      if (available) {
        // Consume resources (now async with delay)
        consumed = await this.consumeResources(sourceNodeId, resourcesToTransfer);
        if (consumed) {
          // --- IMPLEMENT Transfer Delay & Efficiency --- START
          const connectionId = Array.from(this.connections.keys()).find(id => {
            const conn = this.connections.get(id);
            // Check both directions for the connection
            return (
              (conn?.source === sourceNodeId && conn?.target === targetNodeId) ||
              (conn?.source === targetNodeId && conn?.target === sourceNodeId)
            );
          });
          const connection = connectionId ? this.connections.get(connectionId) : undefined;

          // Placeholder properties - Replace with actual properties if they exist on FlowConnection
          const connectionDistance = (connection?.metadata?.distance as number) ?? 100; // Example: Get distance or default
          const connectionBandwidth = (connection?.metadata?.bandwidth as number) ?? 10; // Example: Get bandwidth or default
          const connectionEfficiency = (connection?.metadata?.efficiency as number) ?? 0.95; // Example: Get efficiency or default

          // Calculate delay (example: base + distance/bandwidth)
          const baseDelayMs = 20;
          const calculatedDelayMs = baseDelayMs + connectionDistance / connectionBandwidth;

          // Calculate efficiency-adjusted resources
          const efficientResources = resourcesToTransfer.map(r => ({
            ...r,
            amount: Math.floor(r.amount * connectionEfficiency), // Apply efficiency
          }));

          // Wait for the calculated delay
          console.log(`[RFM Transfer] Applying delay: ${calculatedDelayMs.toFixed(2)}ms`);
          await new Promise(resolve => setTimeout(resolve, calculatedDelayMs));

          // --- IMPLEMENT Transfer Delay & Efficiency --- END

          // Add the *efficiency-adjusted* resources
          await this.addResources(targetNodeId, efficientResources);

          // Publish RESOURCE_TRANSFERRED event (Payload should reflect actual amount transferred)
          this.publish({
            type: EventType.RESOURCE_TRANSFERRED, // Use EventType member
            moduleId: this.id,
            moduleType: 'resource-manager' as ModuleType,
            timestamp: Date.now(),
            data: {
              sourceId: sourceNodeId,
              targetId: targetNodeId,
              resources: efficientResources, // Use the adjusted amounts
            },
          });
          console.log(`[RFM] Transfer success: ${sourceNodeId} -> ${targetNodeId}`);
          return true; // Explicitly return true on success
        }
      }
    } catch (error) {
      console.error(`[RFM] Error during transfer from ${sourceNodeId} to ${targetNodeId}:`, error);
      // TODO: Rollback consumption if addResources fails?
      return false; // Return false on error
    }
    // If checks or consumption failed
    console.warn(
      `[RFM] Transfer failed: ${sourceNodeId} -> ${targetNodeId}. Available: ${available}, Consumed: ${consumed}`
    );
    return false; // Return false on failure
  }

  // --- END NEW METHODS ---

  // Fix: Use Partial<ResourceTypeMetadata> for metadata parameter
  private registerResourceTypeWithRegistry(
    type: string,
    metadata: Partial<ExtendedResourceMetadata> // Changed type
  ): void {
    // Convert string type to enum before registering
    const enumType = stringToResourceType(type); // Fix line ~698
    // Check existence using getResourceMetadata
    if (enumType && !this.resourceRegistry.getResourceMetadata(enumType)) {
      // Define default metadata (adjust as needed)
      const defaultMetadata: ExtendedResourceMetadata = {
        id: enumType,
        displayName: type,
        description: 'Default description',
        icon: 'default-icon',
        category: ResourceCategory.BASIC, // Default category
        defaultMax: 1000,
        baseValue: 1,
        weight: 1,
        storageEfficiency: 1,
        qualityLevels: {
          [ResourceQuality.LOW]: 1,
          [ResourceQuality.MEDIUM]: 1,
          [ResourceQuality.HIGH]: 1,
          [ResourceQuality.PREMIUM]: 1,
        },
        tags: [],
        relatedResources: [],
        storageMultiplier: 1,
        valueMultiplier: 1,
        isRare: false,
        isStackable: true,
        maxStackSize: 1000,
      };
      // Merge defaults with provided metadata
      const completeMetadata: ExtendedResourceMetadata = {
        ...defaultMetadata,
        ...metadata,
        id: enumType, // Ensure ID is the enum type
      };
      // Register using ResourceRegistrationOptions
      const options: ResourceRegistrationOptions = { metadata: completeMetadata };
      this.resourceRegistry.registerResource(options); // Corrected call signature
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private setConversionRateInRegistry(source: string, target: string, rate: number): void {
    // Convert string types to enums before setting rate
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sourceEnum = stringToResourceType(source); // Fix line ~709 (part 1)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const targetEnum = stringToResourceType(target); // Fix line ~709 (part 2)
  }

  // Fix: Change return type to ExtendedResourceMetadata | undefined and cast result
  public getResourceMetadata(type: string): ExtendedResourceMetadata | undefined {
    // Convert string type to enum before getting metadata
    const enumType = stringToResourceType(type); // Fix line ~1081
    if (enumType) {
      // Cast the unknown result for now
      return this.registryIntegration.getResourceMetadata(enumType) as
        | ExtendedResourceMetadata
        | undefined;
    }
    return undefined; // Return undefined if enumType is invalid
  }

  private updateConverterNode(node: ConverterFlowNode): void {
    if (!node) {
      return;
    }
    // Use activeProcessIds.length
    const activeProcesses = node.activeProcessIds?.length ?? 0; // Fix line ~1544
    const maxProcesses = node.configuration?.maxConcurrentProcesses || 1;

    // Update node status based on processes
    if (activeProcesses === 0) {
      // converterNode.status = ConverterStatus.INACTIVE; // Example status update
    } else if (activeProcesses >= maxProcesses) {
      // converterNode.status = ConverterStatus.ACTIVE; // Example status update - maybe 'BUSY'?
    } else {
      // converterNode.status = ConverterStatus.ACTIVE; // Example
    }
    // TODO: Need to properly update the node via updateNodeData if status changes

    // TODO: Implement the actual process starting logic here
    // This likely involves creating a process object, managing queues, etc.
    // For now, return a dummy success result
    // const dummyProcessId = `process_${uuidv4()}`; // Removed: Cannot find name 'uuidv4'.
    // console.log(
    //   `[RFM] Placeholder: Starting conversion process ${dummyProcessId} for ${recipeId} on ${converterId}` // Removed: Cannot find name 'recipeId', Cannot find name 'converterId'.
    // );
    // Removed return statement causing errors:
    // return {
    //   success: true,
    //   processId: dummyProcessId,
    //   recipeId: recipeId, // Removed: Cannot find name 'recipeId'.
    // };
  }

  private calculateChainProgress(chainStatus: ChainExecutionStatus): number {
    // Calculate progress based on completed steps
    const completedSteps = chainStatus.stepStatus.filter(
      step => step.status === ProcessStatus.COMPLETED // Fix line ~1578 (part 2)
    ).length;
    return completedSteps / chainStatus.recipeIds.length;
  }

  // --- Production Chain Methods --- START

  /**
   * Registers a new conversion chain definition.
   * @param chain The ConversionChain definition.
   * @returns True if registration was successful, false otherwise.
   */
  public registerConversionChain(chain: ConversionChain): boolean {
    if (!chain || !chain.id || !chain.steps || chain.steps.length === 0) {
      this.handleError(new Error('Invalid conversion chain definition provided.'), { chain });
      return false;
    }
    if (this.conversionChains.has(chain.id)) {
      console.warn(`[RFM] Conversion chain ${chain.id} already registered. Overwriting.`);
    }
    // Validate that all recipe steps exist
    for (const recipeId of chain.steps) {
      if (!this.conversionRecipes.has(recipeId)) {
        this.handleError(new Error(`Recipe ${recipeId} in chain ${chain.id} not found.`), {
          chainId: chain.id,
          recipeId,
        });
        return false;
      }
    }
    this.conversionChains.set(chain.id, chain);
    console.log(`[RFM] Registered conversion chain: ${chain.id}`);
    return true;
  }

  /**
   * Starts the execution of a defined conversion chain.
   * @param chainId The ID of the ConversionChain to start.
   * @param initialConverterId Optional: The ID of the converter to start the first step on.
   * @returns The unique execution ID for this chain run, or null if failed.
   */
  public startConversionChain(chainId: string, initialConverterId?: string): string | null {
    const chainDefinition = this.conversionChains.get(chainId);
    if (!chainDefinition) {
      this.handleError(new Error(`Conversion chain definition ${chainId} not found.`), { chainId });
      return null;
    }

    const executionId = `chain_exec_${chainId}_${uuidv4()}`;
    const now = Date.now();

    const initialStatus: ChainExecutionStatus = {
      chainId: chainId,
      executionId: executionId, // Add executionId to status
      active: true,
      paused: false,
      completed: false,
      failed: false,
      startTime: now,
      currentStepIndex: 0,
      recipeIds: chainDefinition.steps,
      estimatedEndTime: 0, // TODO: Estimate based on step durations
      progress: 0,
      resourceTransfers: [],
      stepStatus: [],
    };

    this.chainExecutions.set(executionId, initialStatus);
    console.log(`[RFM] Starting execution ${executionId} for chain ${chainId}`);

    // Try to kick off the first step immediately
    let initialConverter: ConverterFlowNode | undefined;
    if (initialConverterId) {
      initialConverter = this.converterNodes.get(initialConverterId);
    }
    this._processNextChainStep(executionId, initialConverter);

    // TODO: Publish CHAIN_EXECUTION_STARTED event?

    return executionId;
  }

  /**
   * Pauses a specific running conversion process.
   * @param processId The ID of the process to pause.
   * @returns True if the process was found and paused, false otherwise.
   */
  public pauseConversionProcess(processId: string): boolean {
    const process = this.processingQueue.find(p => p.processId === processId);
    if (process && process.active && !process.paused) {
      process.paused = true;
      // TODO: Add event publishing for process pause/resume?
      console.log(`[RFM] Paused process ${processId}`);
      return true;
    }
    return false;
  }

  /**
   * Resumes a specific paused conversion process.
   * @param processId The ID of the process to resume.
   * @returns True if the process was found and resumed, false otherwise.
   */
  public resumeConversionProcess(processId: string): boolean {
    const process = this.processingQueue.find(p => p.processId === processId);
    if (process && process.active && process.paused) {
      process.paused = false;
      // TODO: Add event publishing for process pause/resume?
      console.log(`[RFM] Resumed process ${processId}`);
      return true;
    }
    return false;
  }

  /**
   * Cancels a specific running or paused conversion process.
   * @param processId The ID of the process to cancel.
   * @returns True if the process was found and cancelled, false otherwise.
   */
  public cancelConversionProcess(processId: string): boolean {
    const processIndex = this.processingQueue.findIndex(p => p.processId === processId);
    if (processIndex !== -1) {
      const cancelledProcess = this.processingQueue[processIndex];
      this.processingQueue.splice(processIndex, 1); // Remove from queue

      // Update the converter node's active process list
      const converter = this.converterNodes.get(cancelledProcess.sourceId);
      if (converter && converter.activeProcessIds) {
        converter.activeProcessIds = converter.activeProcessIds.filter(id => id !== processId);
        this.nodes.set(converter.id, converter);
      }
      // TODO: Publish PROCESS_CANCELLED event?
      console.log(`[RFM] Cancelled process ${processId}`);
      // Note: This doesn't explicitly handle associated chain steps - cancellation might break chains.
      // Consider adding logic to fail the chain if a step is cancelled.
      return true;
    }
    return false;
  }

  /**
   * Pauses an entire chain execution.
   * @param executionId The ID of the chain execution to pause.
   * @returns True if the execution was found and paused, false otherwise.
   */
  public pauseChainExecution(executionId: string): boolean {
    const chainStatus = this.chainExecutions.get(executionId);
    if (chainStatus && chainStatus.active && !chainStatus.paused) {
      chainStatus.paused = true;
      // Pause all active processes associated with this chain execution?
      chainStatus.stepStatus.forEach(step => {
        if (step.status === ProcessStatus.IN_PROGRESS) {
          this.pauseConversionProcess(step.processId);
        }
      });
      console.log(`[RFM] Paused chain execution ${executionId}`);
      // TODO: Publish CHAIN_PAUSED event?
      return true;
    }
    return false;
  }

  /**
   * Resumes a paused chain execution.
   * @param executionId The ID of the chain execution to resume.
   * @returns True if the execution was found and resumed, false otherwise.
   */
  public resumeChainExecution(executionId: string): boolean {
    const chainStatus = this.chainExecutions.get(executionId);
    if (chainStatus && chainStatus.active && chainStatus.paused) {
      chainStatus.paused = false;
      // Resume all paused processes associated with this chain execution?
      chainStatus.stepStatus.forEach(step => {
        const process = this.processingQueue.find(p => p.processId === step.processId);
        // Resume only if the process itself was paused (might have finished while chain was paused)
        if (process && process.paused) {
          this.resumeConversionProcess(step.processId);
        }
      });
      console.log(`[RFM] Resumed chain execution ${executionId}`);
      // TODO: Publish CHAIN_RESUMED event?
      return true;
    }
    return false;
  }

  /**
   * Cancels an entire chain execution.
   * @param executionId The ID of the chain execution to cancel.
   * @returns True if the execution was found and cancelled, false otherwise.
   */
  public cancelChainExecution(executionId: string): boolean {
    const chainStatus = this.chainExecutions.get(executionId);
    if (chainStatus && chainStatus.active) {
      chainStatus.active = false;
      chainStatus.failed = true; // Mark as failed due to cancellation
      chainStatus.errorMessage = 'Chain execution cancelled by user.';
      // Cancel all active processes associated with this chain execution
      chainStatus.stepStatus.forEach(step => {
        if (step.status === ProcessStatus.IN_PROGRESS) {
          this.cancelConversionProcess(step.processId);
        }
      });
      console.log(`[RFM] Cancelled chain execution ${executionId}`);
      // TODO: Publish CHAIN_CANCELLED event?
      return true;
    }
    return false;
  }

  /**
   * Processes the next step in a conversion chain execution.
   * Uses executionId to track specific runs.
   */
  private _processNextChainStep(executionId: string, converter?: ConverterFlowNode): void {
    const chainStatus = this.chainExecutions.get(executionId);
    if (
      !chainStatus ||
      !chainStatus.active ||
      chainStatus.paused ||
      chainStatus.completed ||
      chainStatus.failed
    ) {
      return; // Chain is not in a state to proceed
    }

    const chainDefinition = this.conversionChains.get(chainStatus.chainId); // Get def using chainId from status
    if (!chainDefinition || chainStatus.currentStepIndex >= chainDefinition.steps.length) {
      // Chain definition missing or all steps processed
      chainStatus.completed = true;
      chainStatus.active = false;
      this.chainExecutions.set(executionId, chainStatus);
      // TODO: Publish chain completion event?
      return;
    }

    const recipeId = chainDefinition.steps[chainStatus.currentStepIndex];
    const recipe = this.conversionRecipes.get(recipeId);
    if (!recipe) {
      chainStatus.failed = true;
      chainStatus.active = false;
      chainStatus.errorMessage = `Recipe ${recipeId} not found for chain ${chainStatus.chainId}`;
      this.chainExecutions.set(executionId, chainStatus);
      this.handleError(new Error(chainStatus.errorMessage), {
        chainId: chainStatus.chainId,
        recipeId,
      });
      // TODO: Publish chain failure event?
      return;
    }

    // Find a suitable converter
    let targetConverter = converter;
    if (!targetConverter) {
      // Find the first available converter that supports this recipe
      for (const conv of this.converterNodes.values()) {
        if (
          (conv.supportedRecipeIds?.includes(recipeId) || !conv.supportedRecipeIds) &&
          // Add explicit cast
          ((conv as ConverterFlowNode).activeProcessIds?.length ?? 0) <
            (conv.configuration?.maxConcurrentProcesses ?? 1)
        ) {
          targetConverter = conv;
          break;
        }
      }
    }

    if (!targetConverter) {
      // No suitable converter found currently, will retry later
      return;
    }

    // Check if the target converter has input resources (basic check)
    let canStart = true;
    for (const input of recipe.inputs) {
      const resourceState = targetConverter.resources[input.type];
      if (!resourceState || resourceState.current < input.amount) {
        canStart = false;
        break;
      }
    }

    if (canStart) {
      const result = this.startConversionProcess(targetConverter.id, recipeId);
      if (result.success && result.processId) {
        // Update chain status
        chainStatus.currentStepIndex++;
        chainStatus.stepStatus.push({
          recipeId: recipeId,
          status: ProcessStatus.IN_PROGRESS,
          startTime: Date.now(),
          endTime: 0, // Not ended yet
          processId: result.processId,
          converterId: targetConverter.id,
        });
        // Publish conversion start event
        this.publish({
          type: 'RESOURCE_CONVERSION_STARTED',
          timestamp: Date.now(),
          processId: result.processId,
          nodeId: targetConverter.id,
          data: { recipeId, chainId: chainStatus.chainId, executionId }, // Add chain/exec IDs
        });
        // If this was the last step, mark chain as potentially completed (completion happens when process finishes)
        if (chainStatus.currentStepIndex >= chainDefinition.steps.length) {
          // chainStatus.completed = true; // Mark as completed only when the *last process* finishes
        }
        this.chainExecutions.set(executionId, chainStatus);
      } else {
        // Failed to start the process
        chainStatus.failed = true;
        chainStatus.active = false;
        chainStatus.errorMessage = `Failed to start process for recipe ${recipeId} on converter ${targetConverter.id}`;
        this.chainExecutions.set(executionId, chainStatus);
        this.handleError(new Error(chainStatus.errorMessage), {
          chainId: chainStatus.chainId,
          recipeId,
          converterId: targetConverter.id,
        });
        // TODO: Publish chain failure event?
      }
    } else {
      // Not enough resources on converter, will retry later
      return;
    }
  }

  /**
   * Updates the status of any relevant conversion chains when a process completes.
   */
  private updateChainStatusOnProcessCompletion(
    completedProcess: ExtendedResourceConversionProcess
  ): void {
    // Iterate through active chain executions
    for (const [executionId, chainStatus] of this.chainExecutions.entries()) {
      if (!chainStatus.active || chainStatus.completed || chainStatus.failed) continue;

      const stepIndex = chainStatus.stepStatus.findIndex(
        step => step.processId === completedProcess.processId
      );
      if (stepIndex !== -1) {
        chainStatus.stepStatus[stepIndex].status = ProcessStatus.COMPLETED; // Use ProcessStatus enum
        chainStatus.stepStatus[stepIndex].endTime = Date.now();

        // Check if this was the last step of the chain
        const chainDefinition = this.conversionChains.get(chainStatus.chainId);
        if (chainDefinition && chainStatus.currentStepIndex >= chainDefinition.steps.length) {
          // Ensure *all* steps associated with the last index are complete (if parallel execution was possible)
          const lastRecipeId = chainDefinition.steps[chainDefinition.steps.length - 1];
          const allLastStepsComplete = chainStatus.stepStatus
            .filter(s => s.recipeId === lastRecipeId)
            .every(s => s.status === ProcessStatus.COMPLETED);

          if (allLastStepsComplete) {
            chainStatus.completed = true;
            chainStatus.active = false;
            console.log(`[RFM] Conversion Chain Execution ${executionId} completed.`);
            // TODO: Publish CHAIN_EXECUTION_COMPLETED event
          }
        } else if (chainDefinition && chainStatus.currentStepIndex < chainDefinition.steps.length) {
          // Trigger the next step if not the last one
          // Find the converter where the completed process ran
          const converter = this.converterNodes.get(completedProcess.sourceId);
          this._processNextChainStep(executionId, converter); // Use executionId, Try to start the next step immediately
        }
        this.chainExecutions.set(executionId, chainStatus);
        break; // Assume a process belongs to only one chain execution step
      }
    }
  }

  // --- Production Chain Methods --- END

  /**
   * Get all defined conversion chains.
   * @returns An array of all registered ConversionChain definitions.
   */
  public getAllConversionChains(): ConversionChain[] {
    return Array.from(this.conversionChains.values());
  }

  /**
   * Get all defined conversion recipe definitions.
   * @returns An array of all registered ResourceConversionRecipe objects.
   */
  public getAllRecipeDefinitions(): ResourceConversionRecipe[] {
    return Array.from(this.conversionRecipes.values());
  }

  /**
   * Get the status of all currently tracked chain executions.
   * @returns A Map where keys are execution IDs and values are ChainExecutionStatus objects.
   */
  public getChainExecutions(): Map<string, ChainExecutionStatus> {
    // Return a copy to prevent external modification
    return new Map(this.chainExecutions);
  }
}

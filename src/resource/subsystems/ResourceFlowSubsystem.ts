import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import { EventType } from '../../types/events/EventTypes';
import {
  ResourceState,
  ResourceTransfer,
  ResourceType as StringResourceType,
} from '../../types/resources/ResourceTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";
import {
  isStringResourceType,
  toStringResourceType,
} from '../../utils/resources/ResourceTypeConverter';
import { validateResourceTransfer } from '../../utils/resources/resourceValidation';
import { ResourceFlowWorkerUtil } from '../../utils/workers/ResourceFlowWorkerUtil';
import { ResourceSystem, ResourceSystemConfig } from '../ResourceSystem';

/**
 * Flow node types
 */
export type FlowNodeType = 'producer' | 'consumer' | 'storage' | 'converter';

/**
 * Flow priority configuration
 */
export interface FlowPriority {
  type: StringResourceType;
  priority: number;
  consumers: string[];
}

/**
 * Flow node
 */
export interface FlowNode {
  id: string;
  type: FlowNodeType;
  resources: StringResourceType[];
  priority: FlowPriority;
  active: boolean;
  efficiency?: number;
  converterConfig?: Record<string, unknown>; // Configuration for converters
  converterStatus?: Record<string, unknown>; // Status information for converters
  config?: Record<string, unknown>; // Generic config for additional properties
}

/**
 * Flow connection
 */
export interface FlowConnection {
  id: string;
  source: string;
  target: string;
  resourceType: StringResourceType;
  maxRate: number;
  currentRate: number;
  priority: FlowPriority;
  active: boolean;
}

/**
 * Resource flow
 */
export interface ResourceFlow {
  source: string;
  target: string;
  resourceType: StringResourceType;
  maxRate: number;
}

/**
 * Flow optimization result
 */
export interface FlowOptimizationResult {
  transfers: ResourceTransfer[];
  updatedConnections: FlowConnection[];
  bottlenecks: string[];
  underutilized: string[];
  performanceMetrics?: {
    executionTimeMs: number;
    nodesProcessed: number;
    connectionsProcessed: number;
    transfersGenerated: number;
  };
}

/**
 * ResourceFlowSubsystem
 *
 * Manages resource flow through the game systems
 * Responsible for:
 * - Tracking resource nodes (producers, consumers, storage, converters)
 * - Managing connections between nodes
 * - Optimizing resource distribution
 * - Processing resource conversions
 */
export class ResourceFlowSubsystem {
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
  private resourceStates: Map<StringResourceType, ResourceState> = new Map();
  private resourceProducers: Map<StringResourceType, string[]> = new Map();
  private resourceConsumers: Map<StringResourceType, string[]> = new Map();
  private resourceStorage: Map<StringResourceType, string[]> = new Map();

  // Processing state
  private transferHistory: ResourceTransfer[] = [];
  private lastOptimizationTime = 0;
  private isOptimizing = false;
  private lastOptimizationResult: FlowOptimizationResult | null = null;

  // Worker utility
  private workerUtil: ResourceFlowWorkerUtil | null = null;

  // Parent system reference
  private parentSystem: ResourceSystem;
  private config: ResourceSystemConfig;
  private isInitialized = false;

  constructor(parentSystem: ResourceSystem, config: ResourceSystemConfig) {
    this.parentSystem = parentSystem;
    this.config = config;

    // Initialize resource states
    this.initializeResourceStates();

    // Initialize Web Worker utility if enabled
    if (this.config.useWorkerOffloading) {
      try {
        this.workerUtil = new ResourceFlowWorkerUtil();
      } catch (error) {
        console.error('Failed to initialize ResourceFlowWorkerUtil:', error);
      }
    }
  }

  /**
   * Initialize the subsystem
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Subscribe to relevant events
      this.initializeEventSubscriptions();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ResourceFlowSubsystem:', error);
      throw error;
    }
  }

  /**
   * Dispose of the subsystem
   */
  public async dispose(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Clean up Web Worker
      if (this.workerUtil) {
        this.workerUtil.terminate();
        this.workerUtil = null;
      }

      // Clear data structures
      this.nodes.clear();
      this.connections.clear();
      this.sourceConnections.clear();
      this.targetConnections.clear();

      this.producerNodes.clear();
      this.consumerNodes.clear();
      this.storageNodes.clear();
      this.converterNodes.clear();

      this.resourceStates.clear();
      this.resourceProducers.clear();
      this.resourceConsumers.clear();
      this.resourceStorage.clear();

      this.transferHistory = [];

      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to dispose ResourceFlowSubsystem:', error);
      throw error;
    }
  }

  /**
   * Initialize event subscriptions
   */
  private initializeEventSubscriptions(): void {
    // Subscribe to relevant events
    eventSystem.subscribe('MODULE_CREATED', this.handleModuleCreated);
    eventSystem.subscribe('MODULE_UPDATED', this.handleModuleUpdated);
    eventSystem.subscribe('MODULE_DESTROYED', this.handleModuleDestroyed);
    eventSystem.subscribe('MODULE_ENABLED', this.handleModuleStateChanged);
    eventSystem.subscribe('MODULE_DISABLED', this.handleModuleStateChanged);
  }

  /**
   * Initialize with default states for all resource types
   */
  private initializeResourceStates(): void {
    const defaultResourceTypes: StringResourceType[] = [
      ResourceType.ENERGY,
      ResourceType.MINERALS,
      ResourceType.POPULATION,
      ResourceType.RESEARCH,
      ResourceType.PLASMA,
      ResourceType.GAS,
      ResourceType.EXOTIC,
    ];

    // Initialize resource states for all resource types
    for (const type of defaultResourceTypes) {
      const resourceState: ResourceState = {
        current: 0,
        max: 1000,
        min: 0,
        production: 0,
        consumption: 0,
      };

      this.resourceStates.set(type, resourceState);
      this.resourceProducers.set(type, []);
      this.resourceConsumers.set(type, []);
      this.resourceStorage.set(type, []);
    }
  }

  /**
   * Registers a node in the resource flow network
   */
  public registerNode(node: FlowNode): boolean {
    if (!node.id || !node.resources || node.resources.length === 0) {
      console.warn('Invalid flow node:', node);
      return false;
    }

    // Add to main nodes map
    this.nodes.set(node.id, node);

    // Add to type-specific map
    switch (node.type) {
      case 'producer':
        this.producerNodes.set(node.id, node);
        break;
      case 'consumer':
        this.consumerNodes.set(node.id, node);
        break;
      case 'storage':
        this.storageNodes.set(node.id, node);
        break;
      case 'converter':
        this.converterNodes.set(node.id, node);
        break;
    }

    // Add to resource-specific tracking
    for (const resourceType of node.resources) {
      // Invalidate parent system cache
      this.invalidateCache(resourceType);

      // Add to the appropriate resource tracking maps
      switch (node.type) {
        case 'producer':
          this.addToArray(this.resourceProducers, resourceType, node.id);
          break;
        case 'consumer':
          this.addToArray(this.resourceConsumers, resourceType, node.id);
          break;
        case 'storage':
          this.addToArray(this.resourceStorage, resourceType, node.id);
          break;
      }
    }

    return true;
  }

  /**
   * Unregisters a node from the resource flow network
   */
  public unregisterNode(id: string): boolean {
    if (!this.nodes.has(id)) {
      return false;
    }

    // Get node before removing it
    const node = this.nodes.get(id);
    if (!node) return false;

    // Remove from type-specific map
    switch (node.type) {
      case 'producer':
        this.producerNodes.delete(id);
        break;
      case 'consumer':
        this.consumerNodes.delete(id);
        break;
      case 'storage':
        this.storageNodes.delete(id);
        break;
      case 'converter':
        this.converterNodes.delete(id);
        break;
    }

    // Remove from resource-specific tracking
    for (const resourceType of node.resources) {
      // Invalidate parent system cache
      this.invalidateCache(resourceType);

      // Remove from the appropriate resource tracking maps
      switch (node.type) {
        case 'producer':
          this.removeFromArray(this.resourceProducers, resourceType, id);
          break;
        case 'consumer':
          this.removeFromArray(this.resourceConsumers, resourceType, id);
          break;
        case 'storage':
          this.removeFromArray(this.resourceStorage, resourceType, id);
          break;
      }
    }

    // Remove all connections to/from this node
    const connectionEntries = Array.from(this.connections.entries());
    for (const [connectionId, connection] of connectionEntries) {
      if (connection.source === id || connection.target === id) {
        this.unregisterConnection(connectionId);
      }
    }

    // Remove from main nodes map
    this.nodes.delete(id);

    return true;
  }

  /**
   * Registers a connection between nodes in the resource flow network
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

    // Add to connections map
    this.connections.set(connection.id, connection);

    // Update source and target connection maps
    this.addToArray(this.sourceConnections, connection.source, connection.id);
    this.addToArray(this.targetConnections, connection.target, connection.id);

    // Invalidate cache for affected resource
    this.invalidateCache(connection.resourceType);

    return true;
  }

  /**
   * Unregisters a connection from the resource flow network
   */
  public unregisterConnection(id: string): boolean {
    const connection = this.connections.get(id);
    if (!connection) {
      return false;
    }

    // Remove from source and target connection maps
    this.removeFromArray(this.sourceConnections, connection.source, id);
    this.removeFromArray(this.targetConnections, connection.target, id);

    // Remove from connections map
    this.connections.delete(id);

    // Invalidate cache for affected resource
    this.invalidateCache(connection.resourceType);

    return true;
  }

  /**
   * Registers a resource flow between nodes
   */
  public registerResourceFlow(
    sourceId: string,
    targetId: string,
    resourceType: StringResourceType | ResourceType,
    rate: number
  ): boolean {
    // Ensure we're using string resource type for internal storage
    const stringType = isStringResourceType(resourceType)
      ? (resourceType as StringResourceType)
      : toStringResourceType(resourceType as ResourceType);

    // Check if source and target nodes exist
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);

    if (!source || !target) {
      console.error(`Cannot register flow: source or target node not found`);
      return false;
    }

    // Check if source produces this resource
    if (!source.resources.includes(stringType)) {
      console.error(`Source node ${sourceId} does not produce ${stringType}`);
      return false;
    }

    // Check if target accepts this resource
    if (!target.resources.includes(stringType)) {
      console.error(`Target node ${targetId} does not accept ${stringType}`);
      return false;
    }

    // Create a unique ID for the connection
    const connectionId = `${sourceId}-${targetId}-${stringType}`;

    // Create the connection
    const connection: FlowConnection = {
      id: connectionId,
      source: sourceId,
      target: targetId,
      resourceType: ResourceTypeType,
      maxRate: rate,
      currentRate: 0,
      priority: {
        type: stringType,
        priority: 1,
        consumers: [targetId],
      },
      active: true,
    };

    // Register the connection
    return this.registerConnection(connection);
  }

  /**
   * Updates the state of a resource in the network
   */
  public updateResourceState(type: StringResourceType | ResourceType, state: ResourceState): void {
    // Ensure we're using string resource type for internal storage
    const stringType = isStringResourceType(type)
      ? (type as StringResourceType)
      : toStringResourceType(type as ResourceType);

    this.resourceStates.set(stringType, state);
    this.invalidateCache(stringType);
  }

  /**
   * Gets the current state of a resource in the network
   */
  public getResourceState(type: StringResourceType | ResourceType): ResourceState | undefined {
    // Ensure we're using string resource type for internal storage
    const stringType = isStringResourceType(type)
      ? (type as StringResourceType)
      : toStringResourceType(type as ResourceType);

    return this.resourceStates.get(stringType);
  }

  /**
   * Invalidate cache for a resource type
   */
  private invalidateCache(type: StringResourceType): void {
    // Publish event for resource state change
    eventSystem.publish({
      type: EventType.RESOURCE_UPDATED,
      timestamp: Date.now(),
      data: {
        resourceType: type,
      },
    });
  }

  /**
   * Optimize resource flows across the network
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
      if (
        this.config.useWorkerOffloading &&
        this.workerUtil &&
        activeNodes.length > this.config.batchSize
      ) {
        try {
          // Offload optimization to Web Worker
          const result = await this.workerUtil.optimizeFlows(
            activeNodes,
            activeConnections,
            Object.fromEntries(this.resourceStates)
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
          this.lastOptimizationTime = Date.now();
          return result;
        } catch (error) {
          console.warn('Web Worker optimization failed, falling back to main thread:', error);
          // Fall back to main thread optimization
        }
      }

      // Categorize nodes by type
      const producers = activeNodes.filter(node => node.type === 'producer');
      const consumers = activeNodes.filter(node => node.type === 'consumer');
      const storages = activeNodes.filter(node => node.type === 'storage');
      const converters = activeNodes.filter(node => node.type === 'converter');

      // Process converters
      this.processConverters(converters, activeConnections);

      // Calculate resource balance
      const { availability, demand } = this.calculateResourceBalance(
        producers,
        consumers,
        storages,
        activeConnections
      );

      // Identify resource issues
      const { bottlenecks, underutilized } = this.identifyResourceIssues(availability, demand);

      // Optimize flow rates
      const { updatedConnections, transfers } = this.optimizeFlowRates(
        activeConnections,
        availability,
        demand
      );

      // Update connections with optimized rates
      for (const connection of updatedConnections) {
        this.connections.set(connection.id, connection);
      }

      // Create and store result
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
      this.lastOptimizationTime = Date.now();
      return result;
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Apply optimization results
   */
  private applyOptimizationResults(result: FlowOptimizationResult): void {
    // Update connections with optimized rates
    for (const connection of result.updatedConnections) {
      if (this.connections.has(connection.id)) {
        this.connections.set(connection.id, connection);
      }
    }

    // Process transfers
    for (const transfer of result.transfers) {
      if (validateResourceTransfer(transfer)) {
        this.addToTransferHistory(transfer);
      }
    }
  }

  /**
   * Process converters
   */
  private processConverters(converters: FlowNode[], activeConnections: FlowConnection[]): void {
    // Process each converter
    for (const converter of converters) {
      if (converter.config?.type === 'advanced') {
        this.processAdvancedConverter(converter, activeConnections);
      } else {
        // Basic converter processing
      }
    }
  }

  /**
   * Process an advanced converter
   */
  private processAdvancedConverter(converter: FlowNode, activeConnections: FlowConnection[]): void {
    // This would implement advanced converter logic
    // For now, we'll leave it as a placeholder
  }

  /**
   * Calculate resource balance between producers, consumers, and storage
   */
  private calculateResourceBalance(
    producers: FlowNode[],
    consumers: FlowNode[],
    storages: FlowNode[],
    activeConnections: FlowConnection[]
  ): {
    availability: Partial<Record<StringResourceType, number>>;
    demand: Partial<Record<StringResourceType, number>>;
  } {
    const availability: Partial<Record<StringResourceType, number>> = {};
    const demand: Partial<Record<StringResourceType, number>> = {};

    // Initialize with zero values for all resource types
    for (const type of this.resourceStates.keys()) {
      availability[type] = 0;
      demand[type] = 0;
    }

    // Calculate production capacity
    for (const producer of producers) {
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

    // Calculate consumer demand
    for (const consumer of consumers) {
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

    // Factor in storage capacity
    for (const storage of storages) {
      for (const resourceType of storage.resources) {
        // Use resource state if available
        const resourceState = this.resourceStates.get(resourceType);
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

    return { availability, demand };
  }

  /**
   * Identify resource bottlenecks and underutilized resources
   */
  private identifyResourceIssues(
    availability: Partial<Record<StringResourceType, number>>,
    demand: Partial<Record<StringResourceType, number>>
  ): {
    bottlenecks: string[];
    underutilized: string[];
  } {
    const bottlenecks: string[] = [];
    const underutilized: string[] = [];

    for (const [type, availableAmount] of Object.entries(availability)) {
      const demandAmount = demand[type as StringResourceType] || 0;

      if (availableAmount < demandAmount * 0.9) {
        bottlenecks.push(type);
      } else if (availableAmount > demandAmount * 1.5) {
        underutilized.push(type);
      }
    }

    return { bottlenecks, underutilized };
  }

  /**
   * Optimize flow rates based on priorities
   */
  private optimizeFlowRates(
    activeConnections: FlowConnection[],
    availability: Partial<Record<StringResourceType, number>>,
    demand: Partial<Record<StringResourceType, number>>
  ): {
    updatedConnections: FlowConnection[];
    transfers: ResourceTransfer[];
  } {
    const updatedConnections: FlowConnection[] = [];
    const transfers: ResourceTransfer[] = [];
    const now = Date.now();

    // Sort connections by priority (high to low)
    const prioritizedConnections = [...activeConnections].sort(
      (a, b) => b.priority.priority - a.priority.priority
    );

    // Adjust flow rates
    for (const connection of prioritizedConnections) {
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
          this.addToTransferHistory(transfer);
        }
      }
    }

    return { updatedConnections, transfers };
  }

  /**
   * Add a transfer to the history
   */
  private addToTransferHistory(transfer: ResourceTransfer): void {
    this.transferHistory.push(transfer);

    // Trim history if needed
    if (this.transferHistory.length > this.config.maxHistorySize) {
      this.transferHistory = this.transferHistory.slice(-this.config.maxHistorySize);
    }
  }

  /**
   * Get the transfer history
   */
  public getTransferHistory(): ResourceTransfer[] {
    return [...this.transferHistory];
  }

  /**
   * Get a specific node
   */
  public getNode(id: string): FlowNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all nodes
   */
  public getNodes(): FlowNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get a specific connection
   */
  public getConnection(id: string): FlowConnection | undefined {
    return this.connections.get(id);
  }

  /**
   * Get all connections
   */
  public getConnections(): FlowConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Add an item to an array in a map
   */
  private addToArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    const array = map.get(key) || [];
    if (!array.includes(value)) {
      array.push(value);
      map.set(key, array);
    }
  }

  /**
   * Remove an item from an array in a map
   */
  private removeFromArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    const array = map.get(key);
    if (array) {
      const index = array.indexOf(value);
      if (index >= 0) {
        array.splice(index, 1);
        map.set(key, array);
      }
    }
  }

  // Module event handlers
  private handleModuleCreated = (event: any): void => {
    const { moduleId, moduleType, resources } = event;

    // Determine node type based on module type
    let nodeType: FlowNodeType = 'consumer';
    if (moduleType === 'producer' || moduleType === 'mining') {
      nodeType = 'producer';
    } else if (moduleType === 'storage') {
      nodeType = 'storage';
    } else if (moduleType === 'converter') {
      nodeType = 'converter';
    }

    // Create and register node
    const node: FlowNode = {
      id: moduleId,
      type: nodeType,
      resources: resources || [],
      priority: { type: resources?.[0] || ResourceType.ENERGY, priority: 1, consumers: [] },
      active: true,
    };

    this.registerNode(node);
  };

  private handleModuleUpdated = (event: any): void => {
    const { moduleId, changes } = event;

    // Get existing node
    const node = this.nodes.get(moduleId);
    if (!node) return;

    // Apply changes
    if (changes.resources) {
      node.resources = changes.resources;
    }

    if (changes.active !== undefined) {
      node.active = changes.active;
    }

    if (changes.efficiency !== undefined) {
      node.efficiency = changes.efficiency;
    }

    // Update node
    this.nodes.set(moduleId, node);

    // Invalidate cache for affected resources
    for (const resource of node.resources) {
      this.invalidateCache(resource);
    }
  };

  private handleModuleDestroyed = (event: any): void => {
    const { moduleId } = event;
    this.unregisterNode(moduleId);
  };

  private handleModuleStateChanged = (event: any): void => {
    const { moduleId, active } = event;

    // Get existing node
    const node = this.nodes.get(moduleId);
    if (!node) return;

    // Update active state
    node.active = active;

    // Update node
    this.nodes.set(moduleId, node);

    // Invalidate cache for affected resources
    for (const resource of node.resources) {
      this.invalidateCache(resource);
    }
  };
}

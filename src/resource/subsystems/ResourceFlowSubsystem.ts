import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import
  {
    errorLoggingService,
    ErrorSeverity,
    ErrorType
  } from '../../services/logging/ErrorLoggingService';
import { EventType } from '../../types/events/EventTypes';
import
  {
    FlowConnection,
    FlowNode,
    FlowNodeType,
    ResourcePriorityConfig,
    ResourceState,
    ResourceTransfer,
    ResourceType
  } from '../../types/resources/ResourceTypes';
import { validateResourceTransfer } from '../../utils/typeGuards/resourceTypeGuards';
import { ResourceFlowWorkerUtil } from '../../utils/workers/ResourceFlowWorkerUtil';
import { ResourceSystem, ResourceSystemConfig } from '../ResourceSystem';

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
 * Interface for worker connection results
 */
interface WorkerConnectionResult {
  id: string;
  source: string;
  target: string;
  resourceType?: ResourceType;
  resourceTypes?: ResourceType[];
  maxRate?: number;
  currentRate?: number;
  priority?: number | { priority: number };
  active?: boolean;
}

interface WorkerOptimizationResult {
  transfers: ResourceTransfer[];
  updatedConnections: WorkerConnectionResult[];
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
  private nodes = new Map<string, FlowNode>();
  private connections = new Map<string, FlowConnection>();
  private sourceConnections = new Map<string, string[]>();
  private targetConnections = new Map<string, string[]>();

  // Type-specific node registries
  private producerNodes = new Map<string, FlowNode>();
  private consumerNodes = new Map<string, FlowNode>();
  private storageNodes = new Map<string, FlowNode>();
  private converterNodes = new Map<string, FlowNode>();

  // Resource tracking
  private resourceStates = new Map<ResourceType, ResourceState>();
  private resourceProducers = new Map<ResourceType, string[]>();
  private resourceConsumers = new Map<ResourceType, string[]>();
  private resourceStorage = new Map<ResourceType, string[]>();

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
        errorLoggingService.logError(
          error instanceof Error ? error : new Error('Failed to initialize ResourceFlowWorkerUtil'),
          ErrorType.INITIALIZATION,
          ErrorSeverity.HIGH,
          { componentName: 'ResourceFlowSubsystem', action: 'constructor' }
        );
      }
    }
  }

  /**
   * Initialize the subsystem
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    try {
      // Subscribe to relevant events
      this.initializeEventSubscriptions();

      this.isInitialized = true;
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Failed to initialize ResourceFlowSubsystem'),
        ErrorType.INITIALIZATION,
        ErrorSeverity.CRITICAL,
        { componentName: 'ResourceFlowSubsystem', action: 'initialize' }
      );
      throw error;
    }
  }

  /**
   * Dispose of the subsystem
   */
  public dispose(): void {
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
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Failed to dispose ResourceFlowSubsystem'),
        ErrorType.RUNTIME,
        ErrorSeverity.HIGH,
        { componentName: 'ResourceFlowSubsystem', action: 'dispose' }
      );
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
    const defaultResourceTypes: ResourceType[] = [
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
   * Type guard to check if a string is a valid ResourceType enum key
   */
  private isValidResourceType(key: string): key is ResourceType {
    return Object.values(ResourceType).includes(key as ResourceType);
  }

  /**
   * Registers a node in the resource flow network
   */
  public registerNode(node: FlowNode): boolean {
    if (!node.id || !node.resources || Object.keys(node.resources).length === 0) {
      errorLoggingService.logError(
        new Error('Invalid flow node: ' + JSON.stringify(node)),
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        { componentName: 'ResourceFlowSubsystem', action: 'registerNode' }
      );
      return false;
    }

    // Add to main nodes map
    this.nodes.set(node.id, node);

    // Add to type-specific map
    switch (node.type) {
      case FlowNodeType.PRODUCER:
        this.producerNodes.set(node.id, node);
        break;
      case FlowNodeType.CONSUMER:
        this.consumerNodes.set(node.id, node);
        break;
      case FlowNodeType.STORAGE:
        this.storageNodes.set(node.id, node);
        break;
      case FlowNodeType.CONVERTER:
        this.converterNodes.set(node.id, node);
        break;
    }

    // Add to resource-specific tracking
    for (const resourceKey of Object.keys(node.resources)) {
      // Use type guard for validation
      if (this.isValidResourceType(resourceKey)) {
        // Now resourceKey is confirmed as ResourceType
        const resourceType = resourceKey;

        // Invalidate parent system cache
        this.invalidateCache(resourceType);

        // Add to the appropriate resource tracking maps
        switch (node.type) {
          case FlowNodeType.PRODUCER:
            this.addToArray(this.resourceProducers, resourceType, node.id);
            break;
          case FlowNodeType.CONSUMER:
            this.addToArray(this.resourceConsumers, resourceType, node.id);
            break;
          case FlowNodeType.STORAGE:
            this.addToArray(this.resourceStorage, resourceType, node.id);
            break;
        }
      } else {
        errorLoggingService.logError(
          new Error(`Invalid resource key "${resourceKey}" found in node ${node.id}`),
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          {
            componentName: 'ResourceFlowSubsystem',
            action: 'registerNode',
            nodeId: node.id,
            resourceKey,
          }
        );
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
    if (!node) {
      return false;
    }

    // Remove from type-specific map
    switch (node.type) {
      case FlowNodeType.PRODUCER:
        this.producerNodes.delete(id);
        break;
      case FlowNodeType.CONSUMER:
        this.consumerNodes.delete(id);
        break;
      case FlowNodeType.STORAGE:
        this.storageNodes.delete(id);
        break;
      case FlowNodeType.CONVERTER:
        this.converterNodes.delete(id);
        break;
    }

    // Remove from resource-specific tracking
    for (const resourceKey of Object.keys(node.resources)) {
      // Use type guard for validation
      if (this.isValidResourceType(resourceKey)) {
        // Now resourceKey is confirmed as ResourceType
        const resourceType = resourceKey;

        // Invalidate parent system cache
        this.invalidateCache(resourceType);

        // Remove from the appropriate resource tracking maps
        switch (node.type) {
          case FlowNodeType.PRODUCER:
            this.removeFromArray(this.resourceProducers, resourceType, id);
            break;
          case FlowNodeType.CONSUMER:
            this.removeFromArray(this.resourceConsumers, resourceType, id);
            break;
          case FlowNodeType.STORAGE:
            this.removeFromArray(this.resourceStorage, resourceType, id);
            break;
        }
      } else {
        // Log potential issue if key wasn't a valid ResourceType during removal
        errorLoggingService.logError(
          new Error(
            `Attempted to unregister node ${id} with potentially invalid resource key "${resourceKey}"`
          ),
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          {
            componentName: 'ResourceFlowSubsystem',
            action: 'unregisterNode',
            nodeId: id,
            resourceKey,
          }
        );
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
      !connection.resourceTypes ||
      connection.resourceTypes.length === 0 ||
      (connection.maxRate ?? 0) <= 0
    ) {
      errorLoggingService.logError(
        new Error('Invalid connection: ' + JSON.stringify(connection)),
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        { componentName: 'ResourceFlowSubsystem', action: 'registerConnection' }
      );
      return false;
    }

    // Ensure source and target nodes exist
    if (!this.nodes.has(connection.source)) {
      errorLoggingService.logError(
        new Error(`Source node ${connection.source} does not exist`),
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        { componentName: 'ResourceFlowSubsystem', action: 'registerConnection' }
      );
      return false;
    }

    if (!this.nodes.has(connection.target)) {
      errorLoggingService.logError(
        new Error(`Target node ${connection.target} does not exist`),
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        { componentName: 'ResourceFlowSubsystem', action: 'registerConnection' }
      );
      return false;
    }

    // Ensure source node has the resource type
    const sourceNode = this.nodes.get(connection.source);
    const hasRequiredResourceType = connection.resourceTypes.some(
      rt => sourceNode?.resources && Object.prototype.hasOwnProperty.call(sourceNode.resources, rt)
    );
    if (!sourceNode || !hasRequiredResourceType) {
      errorLoggingService.logError(
        new Error(
          `Source node ${connection.source} does not have required resource type(s): ${connection.resourceTypes.join(', ')}`
        ),
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        { componentName: 'ResourceFlowSubsystem', action: 'registerConnection' }
      );
      return false;
    }

    // Add to connections map
    this.connections.set(connection.id, connection);

    // Update source and target connection maps
    this.addToArray(this.sourceConnections, connection.source, connection.id);
    this.addToArray(this.targetConnections, connection.target, connection.id);

    // Invalidate cache for affected resources
    connection.resourceTypes.forEach(rt => this.invalidateCache(rt));

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

    // Invalidate cache for affected resources
    connection.resourceTypes.forEach(rt => this.invalidateCache(rt));

    return true;
  }

  /**
   * Registers a resource flow between nodes
   */
  public registerResourceFlow(
    sourceId: string,
    targetId: string,
    resourceType: ResourceType,
    rate: number
  ): boolean {
    // Check if source and target nodes exist
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);

    if (!source || !target) {
      errorLoggingService.logError(
        new Error(
          `Cannot register flow: source or target node not found (Source: ${sourceId}, Target: ${targetId})`
        ),
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        { componentName: 'ResourceFlowSubsystem', action: 'registerResourceFlow' }
      );
      return false;
    }

    // Check if source produces this resource
    if (
      !source.resources ||
      !Object.prototype.hasOwnProperty.call(source.resources, resourceType)
    ) {
      errorLoggingService.logError(
        new Error(`Source node ${sourceId} does not produce ${resourceType}`),
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        { componentName: 'ResourceFlowSubsystem', action: 'registerResourceFlow' }
      );
      return false;
    }

    // Check if target accepts this resource
    if (
      !target.resources ||
      !Object.prototype.hasOwnProperty.call(target.resources, resourceType)
    ) {
      errorLoggingService.logError(
        new Error(`Target node ${targetId} does not accept ${resourceType}`),
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        { componentName: 'ResourceFlowSubsystem', action: 'registerResourceFlow' }
      );
      return false;
    }

    // Create a unique ID for the connection
    const connectionId = `${sourceId}-${targetId}-${resourceType}`;

    // Create the connection
    const connection: FlowConnection = {
      id: connectionId,
      source: sourceId,
      target: targetId,
      resourceTypes: [resourceType],
      maxRate: rate,
      currentRate: 0,
      priority: {
        type: resourceType,
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
  public updateResourceState(type: ResourceType, state: ResourceState): void {
    this.resourceStates.set(type, state);
    this.invalidateCache(type);
  }

  /**
   * Gets the current state of a resource in the network
   */
  public getResourceState(type: ResourceType): ResourceState | undefined {
    return this.resourceStates.get(type);
  }

  /**
   * Invalidate cache for a resource type
   */
  private invalidateCache(type: ResourceType): void {
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
        this.lastOptimizationResult ?? {
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
            // Convert to the expected FlowNode type from StandardizedResourceTypes
            activeNodes.map(node => {
              // Keep resources as Record<ResourceType, ResourceState>
              return {
                id: node.id,
                type: node.type,
                name: node.id, // Use ID as name
                capacity: node.capacity ?? 100, // Use node capacity or default
                currentLoad: 0, // Placeholder
                // efficiency: node.efficiency || 1.0, // Remove efficiency
                status: node.active ? 'active' : 'inactive',
                resources: node.resources, // Pass the original Record
                active: node.active,
                x: node.x,
                y: node.y,
                maxConnections: node.maxConnections, // Include other relevant optional fields
                metadata: node.metadata,
                priority: node.priority,
              } as FlowNode; // Use the imported FlowNode type
            }),
            // Convert to the expected FlowConnection type
            activeConnections.map(conn => ({
              id: conn.id,
              source: conn.source,
              target: conn.target,
              resourceTypes: conn.resourceTypes,
              maxRate: conn.maxRate,
              currentRate: conn.currentRate,
              active: conn.active,
              priority: conn.priority,
            })),
            // Convert Map to expected parameter type
            new Map(
              Object.entries(Object.fromEntries(this.resourceStates)).map(([key, value]) => [
                key as ResourceType,
                value,
              ])
            )
          );

          // Apply the results from the worker
          this.applyOptimizationResults(this.convertWorkerResult(result));

          // Add execution time to performance metrics
          result.performanceMetrics ??= {
              executionTimeMs: 0,
              nodesProcessed: activeNodes.length,
              connectionsProcessed: activeConnections.length,
              transfersGenerated: result.transfers?.length ?? 0,
            };

          result.performanceMetrics.executionTimeMs = Date.now() - startTime;


          const convertedResult = this.convertWorkerResult(result);
          this.lastOptimizationResult = convertedResult;
          this.lastOptimizationTime = Date.now();
          return convertedResult;
        } catch (error) {
          errorLoggingService.logError(
            new Error(`Web Worker optimization failed, falling back to main thread: ${String(error)}`),
            ErrorType.WORKER,
            ErrorSeverity.MEDIUM,
            { componentName: 'ResourceFlowSubsystem', action: 'optimizeFlows' }
          );
          // Fall back to main thread optimization
        }
      }

      // Categorize nodes by type
      const producers = activeNodes.filter(node => node.type === FlowNodeType.PRODUCER);
      const consumers = activeNodes.filter(node => node.type === FlowNodeType.CONSUMER);
      const storages = activeNodes.filter(node => node.type === FlowNodeType.STORAGE);
      const converters = activeNodes.filter(node => node.type === FlowNodeType.CONVERTER);

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
    if (!result) {
      return;
    }

    // Update connections with optimized rates
    if (result.updatedConnections) {
      for (const connection of result.updatedConnections) {
        if (this.connections.has(connection.id)) {
          this.connections.set(connection.id, connection);
        }
      }
    }

    // Process transfers
    if (result.transfers) {
      for (const transfer of result.transfers) {
        if (validateResourceTransfer(transfer)) {
          this.addToTransferHistory(transfer);
        }
      }
    }
  }

  /**
   * Process converters
   */
  private processConverters(converters: FlowNode[], activeConnections: FlowConnection[]): void {
    // Process each converter node
    converters.forEach(converter => {
      this.processAdvancedConverter(converter, activeConnections);
    });
  }

  /**
   * Process an advanced converter
   */
  private processAdvancedConverter(
    converter: FlowNode,
     
    _activeConnections: FlowConnection[]
  ): void {
    // Implementation of advanced converter logic will go here
    errorLoggingService.logError(
      new Error(`Processing advanced converter: ${converter.id}`),
      ErrorType.RUNTIME,
      ErrorSeverity.MEDIUM,
      { componentName: 'ResourceFlowSubsystem', action: 'processAdvancedConverter' }
    );
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
    availability: Partial<Record<ResourceType, number>>;
    demand: Partial<Record<ResourceType, number>>;
  } {
    const availability: Partial<Record<ResourceType, number>> = {};
    const demand: Partial<Record<ResourceType, number>> = {};

    // Initialize with zero values for all resource types
    Object.values(ResourceType).forEach(type => {
      availability[type] = 0;
      demand[type] = 0;
    });

    // Calculate availability from producers and storage
    for (const producer of producers) {
      // Iterate over keys of the producer's resources
      for (const resourceType of Object.keys(producer.resources) as ResourceType[]) {
        const state = producer.resources[resourceType];
        if (state) {
          // Find outgoing connections for this resource
          const outgoingConnections = activeConnections.filter(
            conn => conn.source === producer.id && conn.resourceTypes.includes(resourceType)
          );
          const maxOutflow = outgoingConnections.reduce(
            (sum, conn) => sum + (conn.maxRate ?? 0),
            0
          ); // Add null check
          availability[resourceType] =
            (availability[resourceType] ?? 0) + Math.min(state.production, maxOutflow); // Use production rate
        }
      }
    }
    for (const storage of storages) {
      // Iterate over keys of the storage's resources
      for (const resourceType of Object.keys(storage.resources) as ResourceType[]) {
        const state = storage.resources[resourceType];
        if (state) {
          availability[resourceType] = (availability[resourceType] ?? 0) + state.current; // Add current stored amount
        }
      }
    }

    // Calculate demand from consumers
    for (const consumer of consumers) {
      // Iterate over keys of the consumer's resources
      for (const resourceType of Object.keys(consumer.resources) as ResourceType[]) {
        const state = consumer.resources[resourceType];
        if (state) {
          // Find incoming connections for this resource
          const incomingConnections = activeConnections.filter(
            conn => conn.target === consumer.id && conn.resourceTypes.includes(resourceType)
          );
          const maxInflow = incomingConnections.reduce((sum, conn) => sum + (conn.maxRate ?? 0), 0); // Add null check
          demand[resourceType] =
            (demand[resourceType] ?? 0) + Math.min(state.consumption, maxInflow); // Use consumption rate
        }
      }
    }

    return { availability, demand };
  }

  /**
   * Identify resource bottlenecks and underutilized resources
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

    for (const [type, availableAmount] of Object.entries(availability)) {
      const demandAmount = demand[type as ResourceType] ?? 0;

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
      (a, b) => (b.priority?.priority ?? 0) - (a.priority?.priority ?? 0) // Added null checks and default value
    );

    // Adjust flow rates
    for (const connection of prioritizedConnections) {
      // Use the first resource type for availability/demand checks
      if (connection.resourceTypes.length === 0) {
        connection.currentRate = 0;
        updatedConnections.push({ ...connection });
        continue; // Skip if no resource types are defined
      }
      const primaryResourceType = connection.resourceTypes[0];

      const availableForType = availability[primaryResourceType] ?? 0;
      const demandForType = demand[primaryResourceType] ?? 0;

      if (availableForType <= 0 || demandForType <= 0) {
        // No flow possible
        connection.currentRate = 0;
      } else if (availableForType >= demandForType) {
        // Full flow possible
        connection.currentRate = Math.min(connection.maxRate ?? Infinity, demandForType); // Default maxRate to Infinity
      } else {
        // Partial flow based on ratio
        const ratio = availableForType / demandForType;
        connection.currentRate = (connection.maxRate ?? Infinity) * ratio; // Default maxRate to Infinity
      }

      updatedConnections.push({ ...connection });

      // Generate transfer if flow is positive
      if (connection.currentRate > 0) {
        const transfer: ResourceTransfer = {
          type: primaryResourceType, // Use the first resource type
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
    const array = map.get(key) ?? [];
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
  private handleModuleCreated = (event: unknown): void => {
    // Type guard to ensure the event has the expected properties
    if (!event || typeof event !== 'object') {
      return;
    }

    const eventData = event as {
      moduleId?: string;
      moduleType?: string;
      resources?: ResourceType[];
    };

    if (!eventData.moduleId || !eventData.moduleType) {
      return;
    }

    // Determine node type based on module type
    let nodeType: FlowNodeType;
    // Use FlowNodeType enum values
    if (eventData.moduleType === 'producer' || eventData.moduleType === 'mining') {
      nodeType = FlowNodeType.PRODUCER;
    } else if (eventData.moduleType === 'storage') {
      nodeType = FlowNodeType.STORAGE;
    } else if (eventData.moduleType === 'converter') {
      nodeType = FlowNodeType.CONVERTER;
    } else {
      // Default to consumer if module type doesn't match others
      nodeType = FlowNodeType.CONSUMER;
    }

    // Prepare resources map - ensure all ResourceTypes are present
    const resourcesMap: Record<ResourceType, ResourceState> = {} as Record<
      ResourceType,
      ResourceState
    >; // Initialize with assertion
    for (const resTypeEnum of Object.values(ResourceType)) {
      // Assign a default state if not provided in the event
      // const providedState = eventData.resources?.includes(resTypeEnum); // Removed unused variable
      // TODO: Get default state more dynamically if possible
      resourcesMap[resTypeEnum] = { current: 0, max: 1000, min: 0, production: 0, consumption: 0 };
    }

    // Create and register node
    const node: FlowNode = {
      id: eventData.moduleId,
      type: nodeType,
      resources: resourcesMap, // Use the created map
      // TODO: Determine appropriate priority based on module/resources
      priority: {
        type: eventData.resources?.[0] ?? ResourceType.ENERGY, // Use first resource or default
        priority: 1,
        consumers: [],
      },
      active: true,
      // Initialize D3 properties as FlowNode requires them
      x: 0,
      y: 0,
    };

    this.registerNode(node);
  };

  private handleModuleUpdated = (event: unknown): void => {
    // Type guard to ensure the event has the expected properties
    if (!event || typeof event !== 'object') {
      return;
    }

    const eventData = event as {
      moduleId?: string;
      changes?: {
        resources?: ResourceType[];
        active?: boolean;
        efficiency?: number;
      };
    };

    if (!eventData.moduleId || !eventData.changes) {
      return;
    }

    // Get existing node
    const node = this.nodes.get(eventData.moduleId);
    if (!node) {
      return;
    }

    // Apply changes
    if (eventData.changes.resources) {
      // Update the existing resources map based on the incoming array
      const newResourceTypes = new Set(eventData.changes.resources);
      const currentResourceTypes = Object.keys(node.resources) as ResourceType[];

      // Add new resource types with default state
      for (const resType of newResourceTypes) {
        if (!node.resources[resType]) {
          // TODO: Get default state more dynamically
          node.resources[resType] = {
            current: 0,
            max: 1000,
            min: 0,
            production: 0,
            consumption: 0,
          };
        }
      }

      // Remove resource types no longer present
      for (const resType of currentResourceTypes) {
        if (!newResourceTypes.has(resType)) {
          delete node.resources[resType];
        }
      }
    }

    if (eventData.changes.active !== undefined) {
      node.active = eventData.changes.active;
    }

    if (eventData.changes.efficiency !== undefined) {
      node.efficiency = eventData.changes.efficiency;
    }

    // Update node
    this.nodes.set(eventData.moduleId, node);

    // Invalidate cache for affected resources
    for (const resourceKey of Object.keys(node.resources)) {
      if (this.isValidResourceType(resourceKey)) {
        // Use the type guard
        this.invalidateCache(resourceKey);
      }
    }
  };

  private handleModuleDestroyed = (event: unknown): void => {
    // Type guard to ensure the event has the expected properties
    if (!event || typeof event !== 'object') {
      return;
    }

    const eventData = event as { moduleId?: string };
    if (!eventData.moduleId) {
      return;
    }

    this.unregisterNode(eventData.moduleId);
  };

  private handleModuleStateChanged = (event: unknown): void => {
    // Type guard to ensure the event has the expected properties
    if (!event || typeof event !== 'object') {
      return;
    }

    const eventData = event as { moduleId?: string; active?: boolean };
    if (!eventData.moduleId || eventData.active === undefined) {
      return;
    }

    // Get existing node
    const node = this.nodes.get(eventData.moduleId);
    if (!node) {
      return;
    }

    // Update active state
    node.active = eventData.active;

    // Update node
    this.nodes.set(eventData.moduleId, node);

    // Invalidate cache for affected resources
    for (const resourceKey of Object.keys(node.resources)) {
      if (this.isValidResourceType(resourceKey)) {
        // Use the type guard
        this.invalidateCache(resourceKey);
      }
    }
  };

  /**
   * Convert worker result to the format expected by the subsystem
   */
  private convertWorkerResult(result: WorkerOptimizationResult): FlowOptimizationResult {
    return {
      ...result,
      updatedConnections: result.updatedConnections.map(wc => {
        const existingConn = this.connections.get(wc.id);
        return {
          id: wc.id,
          source: wc.source,
          target: wc.target,
          resourceTypes:
            wc.resourceTypes ?? (wc.resourceType ? [wc.resourceType] : []),
          maxRate: wc.maxRate ?? existingConn?.maxRate ?? 0,
          currentRate: wc.currentRate ?? existingConn?.currentRate ?? 0,
          priority:
            typeof wc.priority === 'number'
              ? existingConn?.priority
              : (wc.priority as ResourcePriorityConfig),
          active: wc.active ?? existingConn?.active ?? false,
        } as FlowConnection;
      }),
    };
  }
}

// Use export type for isolatedModules
export type { FlowConnection, FlowNode, FlowNodeType };

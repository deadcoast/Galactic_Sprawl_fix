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

/**
 * Manager for resource flow through the game systems
 * Responsible for:
 * - Tracking resource nodes (producers, consumers, storage, converters)
 * - Managing connections between nodes
 * - Optimizing resource distribution
 * - Processing resource conversions
 */
export class ResourceFlowManager {
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
  private processingQueue: ResourceConversionProcess[] = [];
  private completedProcesses: ResourceConversionProcess[] = [];
  private lastProcessingTime = 0;
  private processingInterval: number | null = null;
  private optimizationInterval: number | null = null;

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

  constructor() {
    this.initializeResourceStates();

    // Subscribe to module events that might affect resource flow
    moduleEventBus.subscribe('MODULE_CREATED', this.handleModuleCreated);
    moduleEventBus.subscribe('MODULE_UPDATED', this.handleModuleUpdated);
    moduleEventBus.subscribe('MODULE_DESTROYED', this.handleModuleDestroyed);
    moduleEventBus.subscribe('MODULE_ENABLED', this.handleModuleStateChanged);
    moduleEventBus.subscribe('MODULE_DISABLED', this.handleModuleStateChanged);
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
      console.warn('Invalid flow node:', node);
      return false;
    }

    this.nodes.set(node.id, node);

    // Invalidate cache for affected resource types
    for (const resourceType of node.resources) {
      this.invalidateCache(resourceType);
    }

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
    for (const [connectionId, connection] of connectionEntries) {
      if (connection.source === id || connection.target === id) {
        this.connections.delete(connectionId);
      }
    }

    this.nodes.delete(id);

    // Invalidate cache for affected resource types
    for (const resourceType of affectedResources) {
      this.invalidateCache(resourceType);
    }

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
   * Optimizes resource flows in the network
   *
   * This is the core method that balances resource distribution across the network
   * based on priorities, connection constraints, and node types.
   *
   * The optimization process:
   * 1. Processes converters to apply efficiency modifiers
   * 2. Calculates resource availability and demand
   * 3. Identifies bottlenecks and underutilized resources
   * 4. Optimizes flow rates based on priorities
   * 5. Generates transfer records for the optimized flows
   *
   * Performance metrics are included in the result to track optimization efficiency.
   *
   * @returns {FlowOptimizationResult} The result of the optimization process
   *
   * @example
   * // Optimize resource flows and handle bottlenecks
   * const result = flowManager.optimizeFlows();
   * if (result.bottlenecks.length > 0) {
   *   console.warn(`Resource bottlenecks detected: ${result.bottlenecks.join(', ')}`);
   * }
   */
  public optimizeFlows(): FlowOptimizationResult {
    const startTime = Date.now();

    // Skip optimization if not enough time has passed
    if (startTime - this.lastOptimization < this.optimizationIntervalMs) {
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

    this.lastOptimization = startTime;

    // Get active nodes and connections
    const activeNodes = Array.from(this.nodes.values()).filter(node => node.active);
    const activeConnections = Array.from(this.connections.values()).filter(conn => conn.active);

    // Performance tracking
    let nodesProcessed = 0;
    let connectionsProcessed = 0;
    let transfersGenerated = 0;

    // Group nodes by type
    const producers = activeNodes.filter(node => node.type === 'producer');
    const consumers = activeNodes.filter(node => node.type === 'consumer');
    const storages = activeNodes.filter(node => node.type === 'storage');
    const converters = activeNodes.filter(node => node.type === 'converter');

    nodesProcessed = activeNodes.length;

    // Process converters if any exist
    if (converters.length > 0) {
      this.processConverters(converters, activeConnections);
    }

    // Calculate resource availability and demand using batch processing for large networks
    const { availability, demand } = this.calculateResourceBalance(
      producers,
      consumers,
      storages,
      activeConnections
    );

    // Identify bottlenecks and underutilized resources
    const { bottlenecks, underutilized } = this.identifyResourceIssues(availability, demand);

    // Optimize flow rates based on priorities using batch processing
    const { updatedConnections, transfers } = this.optimizeFlowRates(
      activeConnections,
      availability,
      demand
    );

    connectionsProcessed = activeConnections.length;
    transfersGenerated = transfers.length;

    const endTime = Date.now();
    const executionTimeMs = endTime - startTime;

    return {
      transfers,
      updatedConnections,
      bottlenecks,
      underutilized,
      performanceMetrics: {
        executionTimeMs,
        nodesProcessed,
        connectionsProcessed,
        transfersGenerated,
      },
    };
  }

  /**
   * Process converter nodes
   */
  private processConverters(converters: FlowNode[], activeConnections: FlowConnection[]): void {
    if (converters.length === 0) {
      return;
    }

    console.warn(
      `[ResourceFlowManager] Processing ${converters.length} active converters in the network`
    );

    // Process converters in batches if there are many
    const batchCount = Math.ceil(converters.length / this.batchSize);

    for (let i = 0; i < batchCount; i++) {
      const batchStart = i * this.batchSize;
      const batchEnd = Math.min((i + 1) * this.batchSize, converters.length);
      const converterBatch = converters.slice(batchStart, batchEnd);

      for (const converter of converterBatch) {
        // Apply converter efficiency to resource production
        const efficiency = converter.efficiency || 1.0;

        // Check if this is an advanced converter with conversion configuration
        if (converter.converterConfig) {
          // Process advanced converter node with recipes and conversion chains
          this.processAdvancedConverter(converter, activeConnections);
        } else {
          // Simple efficiency-based converter (legacy support)
          // Find connections from this converter
          const converterConnections = activeConnections.filter(
            conn => conn.source === converter.id && conn.active
          );

          // Apply efficiency bonus to connection rates
          for (const connection of converterConnections) {
            // Adjust the connection rate based on converter efficiency
            const originalRate = connection.currentRate;
            connection.currentRate = originalRate * efficiency;

            // Update the connection in the network
            this.connections.set(connection.id, connection);
          }
        }
      }
    }
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
        error: 'Invalid converter or recipe',
        timestamp: Date.now(),
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
        error: 'Recipe not supported by this converter',
        timestamp: Date.now(),
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
        error: 'Maximum concurrent processes reached',
        timestamp: Date.now(),
      };
    }

    // Check if inputs are available
    const hasInputs = this.checkRecipeInputs(converterId, recipe);
    if (!hasInputs) {
      return {
        success: false,
        error: 'Insufficient inputs',
        timestamp: Date.now(),
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

    const process: ResourceConversionProcess = {
      recipeId,
      progress: 0,
      startTime: now,
      endTime: processEndTime,
      sourceId: converterId,
      active: true,
      paused: false,
      inputsProvided: true,
      appliedEfficiency: efficiency,
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
      converterId: converter.id,
      inputsConsumed,
      timestamp: now,
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
    const processesToComplete: string[] = [];

    // Check all active processes
    for (const [processId, process] of this.processingQueue.entries()) {
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
        processesToComplete.push(processId);
      }
    }

    // Complete processes
    for (const processId of processesToComplete) {
      // Get process
      const process = this.processingQueue.find(p => p.processId === processId);
      if (!process) {
        continue;
      }

      // Get converter
      const converter = this.nodes.get(process.sourceId);
      if (!converter) {
        // Converter not found, remove process from active processes
        this.processingQueue = this.processingQueue.filter(p => p.processId !== processId);
        continue;
      }

      // Get recipe
      const recipe = this.conversionRecipes.get(process.recipeId);
      if (!recipe) {
        // Recipe not found, remove process from active processes
        this.processingQueue = this.processingQueue.filter(p => p.processId !== processId);
        continue;
      }

      // Complete the process
      const result = this.completeConversionProcess(processId, process, converter, recipe);

      // Check if this process is part of an active chain
      for (const chainStatus of this.chainExecutions.values()) {
        // Find the step that contains this process
        const stepIndex = chainStatus.stepStatus.findIndex(step => step.processId === processId);
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
      converterId: converter.id,
      outputsProduced,
      byproductsProduced,
      timestamp: Date.now(),
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
   * Get converter status
   *
   * @param {string} converterId - The ID of the converter
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

    for (const [type, availableAmount] of Object.entries(availability)) {
      const demandAmount = demand[type as ResourceType] || 0;

      if (availableAmount < demandAmount * 0.9) {
        bottlenecks.push(type);
      } else if (availableAmount > demandAmount * 1.5) {
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
   * Cleans up resources and releases event handlers
   *
   * Call this method when the ResourceFlowManager is no longer needed
   * to prevent memory leaks and ensure proper resource cleanup.
   *
   * @example
   * // Clean up the flow manager when it's no longer needed
   * flowManager.cleanup();
   */
  public cleanup(): void {
    moduleEventBus.clearHistory();
    this.resourceCache.clear();
    this.connections.clear();
    this.nodes.clear();
    this.resourceStates.clear();
    this.transferHistory = [];
    this.conversionRecipes.clear();
    this.conversionChains.clear();
    this.processingQueue = [];
    this.chainExecutions.clear();

    // Clear process interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * Start a conversion chain
   *
   * @param {string} chainId - The ID of the chain to start
   * @param {string[]} converterIds - IDs of converters to use for each step (in order)
   * @returns {ChainExecutionStatus | null} The chain execution status, or null if failed
   */
  public startChain(chainId: string, converterIds: string[]): ChainExecutionStatus | null {
    // Check if chain exists
    const chain = this.conversionChains.get(chainId);
    if (!chain) {
      console.warn(`[ResourceFlowManager] Failed to start chain: Chain ${chainId} not found`);
      return null;
    }

    // Validate that we have the right number of converters
    if (converterIds.length !== chain.steps.length) {
      console.warn(
        `[ResourceFlowManager] Failed to start chain: ${converterIds.length} converters provided for ${chain.steps.length} steps`
      );
      return null;
    }

    // Check if all converters exist and can process the required recipes
    for (let i = 0; i < chain.steps.length; i++) {
      const recipeId = chain.steps[i];
      const converterId = converterIds[i];

      // Check if converter exists
      const converter = this.nodes.get(converterId);
      if (!converter || converter.type !== 'converter') {
        console.warn(
          `[ResourceFlowManager] Failed to start chain: Converter ${converterId} not found or not a converter`
        );
        return null;
      }

      // Check if converter can process this recipe
      if (!converter.converterConfig?.supportedRecipes.includes(recipeId)) {
        console.warn(
          `[ResourceFlowManager] Failed to start chain: Converter ${converterId} does not support recipe ${recipeId}`
        );
        return null;
      }

      // Check if recipe exists
      if (!this.conversionRecipes.has(recipeId)) {
        console.warn(`[ResourceFlowManager] Failed to start chain: Recipe ${recipeId} not found`);
        return null;
      }
    }

    // Create chain execution status
    const now = Date.now();

    // Calculate estimated time
    let totalProcessingTime = 0;
    for (const recipeId of chain.steps) {
      const recipe = this.conversionRecipes.get(recipeId);
      if (recipe) {
        totalProcessingTime += recipe.processingTime;
      }
    }

    // Initialize step status
    const stepStatus = chain.steps.map((recipeId, index) => ({
      recipeId,
      converterId: converterIds[index],
      status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'failed',
    }));

    // Create chain execution status
    const chainStatus: ChainExecutionStatus = {
      chainId,
      currentStepIndex: 0,
      recipeIds: [...chain.steps],
      startTime: now,
      estimatedEndTime: now + totalProcessingTime,
      progress: 0,
      stepStatus,
      resourceTransfers: [],
      active: true,
      paused: false,
      completed: false,
      failed: false,
    };

    // Store chain status
    this.chainExecutions.set(chainId, chainStatus);

    // Try to start the first step
    this.processNextChainStep(chainId);

    return chainStatus;
  }

  /**
   * Process the next step in a chain
   *
   * @param {string} chainId - The ID of the chain to process
   * @returns {boolean} True if the next step was started, false otherwise
   * @private
   */
  private processNextChainStep(chainId: string): boolean {
    // Get chain status
    const chainStatus = this.chainExecutions.get(chainId);
    if (
      !chainStatus ||
      !chainStatus.active ||
      chainStatus.paused ||
      chainStatus.completed ||
      chainStatus.failed
    ) {
      return false;
    }

    // Get current step
    const { currentStepIndex } = chainStatus;
    if (currentStepIndex >= chainStatus.recipeIds.length) {
      // Chain is complete
      chainStatus.completed = true;
      chainStatus.active = false;
      return false;
    }

    // Get step info
    const recipeId = chainStatus.recipeIds[currentStepIndex];
    const stepStatus = chainStatus.stepStatus[currentStepIndex];
    const { converterId } = stepStatus;

    // If the current step is already in progress or completed, move to the next step
    if (stepStatus.status === 'completed') {
      chainStatus.currentStepIndex++;
      return this.processNextChainStep(chainId);
    }

    // If the current step is in progress, just return
    if (stepStatus.status === 'in_progress' && stepStatus.processId) {
      return true;
    }

    // Check if we have enough resources for this step
    const recipe = this.conversionRecipes.get(recipeId);
    if (!recipe) {
      // Recipe not found, mark step as failed
      stepStatus.status = 'failed';
      chainStatus.failed = true;
      chainStatus.active = false;
      chainStatus.errorMessage = `Recipe ${recipeId} not found`;
      return false;
    }

    // If this is not the first step, check if we need to transfer output from previous step
    if (currentStepIndex > 0) {
      const previousStepIndex = currentStepIndex - 1;
      const previousStepStatus = chainStatus.stepStatus[previousStepIndex];

      // Make sure previous step is completed
      if (previousStepStatus.status !== 'completed') {
        // Previous step not completed yet, wait
        return false;
      }

      // Transfer outputs from previous step to current step inputs
      this.transferChainStepResources(chainId, previousStepIndex, currentStepIndex);
    }

    // Check if converter has enough inputs
    const canStart = this.checkRecipeInputs(converterId, recipe);
    if (!canStart) {
      // Not enough inputs, don't start yet
      return false;
    }

    // Start the conversion process
    const result = this.startConversionProcess(converterId, recipeId);
    if (!result.success || !result.processId) {
      // Failed to start process
      stepStatus.status = 'failed';
      chainStatus.failed = true;
      chainStatus.active = false;
      chainStatus.errorMessage = result.error || 'Failed to start conversion process';
      return false;
    }

    // Update step status
    stepStatus.status = 'in_progress';
    stepStatus.processId = result.processId;
    stepStatus.startTime = Date.now();

    // Update chain progress
    this.updateChainProgress(chainId);

    return true;
  }

  /**
   * Transfer resources between chain steps
   *
   * @param {string} chainId - The ID of the chain
   * @param {number} fromStepIndex - The index of the step to transfer from
   * @param {number} toStepIndex - The index of the step to transfer to
   * @returns {boolean} True if transfer was successful
   * @private
   */
  private transferChainStepResources(
    chainId: string,
    fromStepIndex: number,
    toStepIndex: number
  ): boolean {
    // Get chain status
    const chainStatus = this.chainExecutions.get(chainId);
    if (!chainStatus) {
      return false;
    }

    // Get step info
    const fromStepStatus = chainStatus.stepStatus[fromStepIndex];
    const toStepStatus = chainStatus.stepStatus[toStepIndex];

    // Get recipes
    const fromRecipeId = chainStatus.recipeIds[fromStepIndex];
    const toRecipeId = chainStatus.recipeIds[toStepIndex];
    const fromRecipe = this.conversionRecipes.get(fromRecipeId);
    const toRecipe = this.conversionRecipes.get(toRecipeId);

    if (!fromRecipe || !toRecipe) {
      return false;
    }

    // Get converters
    const fromConverterId = fromStepStatus.converterId;
    const toConverterId = toStepStatus.converterId;
    const fromConverter = this.nodes.get(fromConverterId);
    const toConverter = this.nodes.get(toConverterId);

    if (!fromConverter || !toConverter) {
      return false;
    }

    // Create transfers for each matching output-input
    const transfers: { type: ResourceType; amount: number }[] = [];

    // Check which outputs from the previous step match inputs for the current step
    for (const output of fromRecipe.outputs) {
      for (const input of toRecipe.inputs) {
        if (output.type === input.type) {
          // This output matches an input for the next step
          // Calculate the transfer amount (can be less than required if not enough available)
          const transferAmount = Math.min(output.amount, input.amount);

          if (transferAmount > 0) {
            transfers.push({ type: output.type, amount: transferAmount });

            // Add to resource transfers list for tracking
            chainStatus.resourceTransfers.push({
              type: output.type,
              amount: transferAmount,
              fromStep: fromStepIndex,
              toStep: toStepIndex,
              status: 'in_progress',
            });
          }
        }
      }
    }

    // Execute the transfers
    const now = Date.now();
    for (const transfer of transfers) {
      // Create a resource transfer
      const resourceTransfer: ResourceTransfer = {
        type: transfer.type,
        amount: transfer.amount,
        source: fromConverterId,
        target: toConverterId,
        timestamp: now,
      };

      // Validate and execute the transfer
      const isValid = validateResourceTransfer(resourceTransfer);
      if (isValid) {
        // Update resource states
        const _state = this.getResourceState(transfer.type) || {
          current: 0,
          max: 100,
          min: 0,
          production: 0,
          consumption: 0,
        };

        // Update the current amount in the resource state based on the transfer
        const updatedState = {
          ..._state,
          current: Math.max(
            _state.min,
            Math.min(_state.max, _state.current + resourceTransfer.amount)
          ),
        };

        // Update the resource state with the new values
        this.updateResourceState(transfer.type, updatedState);

        // Add to transfer history
        this.addToTransferHistory(resourceTransfer);

        // Mark the corresponding resource transfer as completed
        const resourceTransferIndex = chainStatus.resourceTransfers.findIndex(
          rt =>
            rt.type === transfer.type &&
            rt.fromStep === fromStepIndex &&
            rt.toStep === toStepIndex &&
            rt.status === 'in_progress'
        );
        if (resourceTransferIndex >= 0) {
          chainStatus.resourceTransfers[resourceTransferIndex].status = 'completed';
        }
      } else {
        // Invalid transfer
        console.warn(
          `[ResourceFlowManager] Invalid chain step resource transfer: ${JSON.stringify(resourceTransfer)}`
        );
      }
    }

    return true;
  }

  /**
   * Update the progress of a chain
   *
   * @param {string} chainId - The ID of the chain to update
   * @private
   */
  private updateChainProgress(chainId: string): void {
    const chainStatus = this.chainExecutions.get(chainId);
    if (!chainStatus) {
      return;
    }

    // Calculate overall progress
    let completedSteps = 0;
    let totalProgress = 0;

    for (const step of chainStatus.stepStatus) {
      if (step.status === 'completed') {
        completedSteps++;
        totalProgress += 1.0;
      } else if (step.status === 'in_progress' && step.processId) {
        // Get process progress
        const process = this.processingQueue.find(p => p.processId === step.processId);
        if (process) {
          totalProgress += process.progress;
        }
      }
    }

    // Update progress
    chainStatus.progress = totalProgress / chainStatus.stepStatus.length;

    // Check if all steps are completed
    if (completedSteps === chainStatus.stepStatus.length) {
      chainStatus.completed = true;
      chainStatus.active = false;
    }
  }

  /**
   * Pause a running chain
   *
   * @param {string} chainId - The ID of the chain to pause
   * @returns {boolean} True if the chain was successfully paused
   */
  public pauseChain(chainId: string): boolean {
    const chainStatus = this.chainExecutions.get(chainId);
    if (
      !chainStatus ||
      !chainStatus.active ||
      chainStatus.paused ||
      chainStatus.completed ||
      chainStatus.failed
    ) {
      return false;
    }

    // Pause the chain
    chainStatus.paused = true;

    // Pause any active conversion process
    const { currentStepIndex } = chainStatus;
    if (currentStepIndex < chainStatus.stepStatus.length) {
      const stepStatus = chainStatus.stepStatus[currentStepIndex];
      if (stepStatus.status === 'in_progress' && stepStatus.processId) {
        this.pauseConversion(stepStatus.processId);
      }
    }

    return true;
  }

  /**
   * Resume a paused chain
   *
   * @param {string} chainId - The ID of the chain to resume
   * @returns {boolean} True if the chain was successfully resumed
   */
  public resumeChain(chainId: string): boolean {
    const chainStatus = this.chainExecutions.get(chainId);
    if (
      !chainStatus ||
      !chainStatus.active ||
      !chainStatus.paused ||
      chainStatus.completed ||
      chainStatus.failed
    ) {
      return false;
    }

    // Resume the chain
    chainStatus.paused = false;

    // Resume any active conversion process
    const { currentStepIndex } = chainStatus;
    if (currentStepIndex < chainStatus.stepStatus.length) {
      const stepStatus = chainStatus.stepStatus[currentStepIndex];
      if (stepStatus.status === 'in_progress' && stepStatus.processId) {
        this.resumeConversion(stepStatus.processId);
      }
    }

    // Try to process the next step
    this.processNextChainStep(chainId);

    return true;
  }

  /**
   * Cancel a running chain
   *
   * @param {string} chainId - The ID of the chain to cancel
   * @returns {boolean} True if the chain was successfully cancelled
   */
  public cancelChain(chainId: string): boolean {
    const chainStatus = this.chainExecutions.get(chainId);
    if (!chainStatus || chainStatus.completed) {
      return false;
    }

    // Cancel any active conversion process
    for (const step of chainStatus.stepStatus) {
      if (step.status === 'in_progress' && step.processId) {
        this.cancelConversion(step.processId);
      }
    }

    // Mark chain as failed
    chainStatus.active = false;
    chainStatus.paused = false;
    chainStatus.failed = true;
    chainStatus.errorMessage = 'Chain cancelled by user';

    return true;
  }

  /**
   * Get all active chains
   *
   * @returns {ChainExecutionStatus[]} Array of all active chain execution statuses
   */
  public getActiveChains(): ChainExecutionStatus[] {
    return Array.from(this.chainExecutions.values());
  }

  /**
   * Get a specific chain execution status by ID
   *
   * @param {string} chainId - The ID of the chain to get
   * @returns {ChainExecutionStatus | undefined} The chain execution status, or undefined if not found
   */
  public getChainStatus(chainId: string): ChainExecutionStatus | undefined {
    return this.chainExecutions.get(chainId);
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

  // Module event handlers
  private handleModuleCreated = (data: any) => {
    // Handle module creation
    const { id, type } = data;
    // Register module as appropriate node type based on module type
    this.registerModuleAsNode(id, type as ModuleType);
  };

  private handleModuleUpdated = (data: any) => {
    // Handle module update
    const { id, changes } = data;
    this.updateNodeFromModule(id, changes);
  };

  private handleModuleDestroyed = (data: any) => {
    // Handle module destruction
    const { id } = data;
    this.unregisterNode(id);
  };

  private handleModuleStateChanged = (data: any) => {
    // Handle module state change (enabled/disabled)
    const { id, active } = data;
    this.setNodeActive(id, active);
  };

  // Register a module as a node based on its type
  private registerModuleAsNode(moduleId: string, moduleType: ModuleType): void {
    // Implementation will determine node type based on module type
    // This is a placeholder
    console.log(`Registering module ${moduleId} of type ${moduleType} as node`);
  }

  // Update a node based on module changes
  private updateNodeFromModule(moduleId: string, changes: any): void {
    // Implementation will update node properties based on module changes
    // This is a placeholder
    console.log(`Updating node for module ${moduleId} with changes`, changes);
  }

  // Set a node's active state
  private setNodeActive(nodeId: string, active: boolean): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.active = active;
      this.nodes.set(nodeId, node);
    }
  }
}

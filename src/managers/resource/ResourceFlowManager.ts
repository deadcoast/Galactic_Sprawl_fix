import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import {
  ResourceFlow,
  ResourcePriority,
  ResourceState,
  ResourceTransfer,
  ResourceType,
} from '../../types/resources/ResourceTypes';
import {
  validateResourceFlow,
  validateResourceTransfer,
} from '../../utils/resources/resourceValidation';

/**
 * Flow node type
 */
export type FlowNodeType = 'producer' | 'consumer' | 'storage' | 'converter';

/**
 * Flow node interface
 */
export interface FlowNode {
  id: string;
  type: FlowNodeType;
  resources: ResourceType[];
  priority: ResourcePriority;
  capacity?: number;
  efficiency?: number;
  active: boolean;
}

/**
 * Flow connection interface
 */
export interface FlowConnection {
  id: string;
  source: string;
  target: string;
  resourceType: ResourceType;
  maxRate: number;
  currentRate: number;
  priority: ResourcePriority;
  active: boolean;
}

/**
 * Flow network interface
 */
export interface FlowNetwork {
  nodes: Map<string, FlowNode>;
  connections: Map<string, FlowConnection>;
  resourceStates: Map<ResourceType, ResourceState>;
}

/**
 * Flow optimization result
 */
export interface FlowOptimizationResult {
  transfers: ResourceTransfer[];
  updatedConnections: FlowConnection[];
  bottlenecks: string[];
  underutilized: string[];
}

/**
 * Resource Flow Manager
 * Manages and optimizes resource flows between producers, consumers, and storage
 */
export class ResourceFlowManager {
  private network: FlowNetwork;
  private lastOptimization: number;
  private optimizationInterval: number;
  private transferHistory: ResourceTransfer[];
  private maxHistorySize: number;

  constructor(optimizationInterval = 5000) {
    this.network = {
      nodes: new Map<string, FlowNode>(),
      connections: new Map<string, FlowConnection>(),
      resourceStates: new Map<ResourceType, ResourceState>(),
    };
    this.lastOptimization = 0;
    this.optimizationInterval = optimizationInterval;
    this.transferHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Register a flow node
   */
  public registerNode(node: FlowNode): boolean {
    if (!node.id || !node.resources || node.resources.length === 0) {
      console.error('Invalid flow node:', node);
      return false;
    }

    this.network.nodes.set(node.id, node);
    return true;
  }

  /**
   * Unregister a flow node
   */
  public unregisterNode(id: string): boolean {
    if (!this.network.nodes.has(id)) {
      return false;
    }

    // Remove all connections to/from this node
    // Convert Map entries to array to avoid MapIterator error
    const connectionEntries = Array.from(this.network.connections.entries());
    for (const [connectionId, connection] of connectionEntries) {
      if (connection.source === id || connection.target === id) {
        this.network.connections.delete(connectionId);
      }
    }

    this.network.nodes.delete(id);
    return true;
  }

  /**
   * Register a flow connection
   */
  public registerConnection(connection: FlowConnection): boolean {
    if (!connection.id || !connection.source || !connection.target || !connection.resourceType) {
      console.error('Invalid flow connection:', connection);
      return false;
    }

    // Verify source and target nodes exist
    if (!this.network.nodes.has(connection.source) || !this.network.nodes.has(connection.target)) {
      console.error('Source or target node does not exist:', connection);
      return false;
    }

    // Verify source node can provide the resource
    const sourceNode = this.network.nodes.get(connection.source);
    if (!sourceNode?.resources.includes(connection.resourceType)) {
      console.error('Source node cannot provide resource:', connection);
      return false;
    }

    // Verify target node can accept the resource
    const targetNode = this.network.nodes.get(connection.target);
    if (!targetNode?.resources.includes(connection.resourceType)) {
      console.error('Target node cannot accept resource:', connection);
      return false;
    }

    this.network.connections.set(connection.id, connection);
    return true;
  }

  /**
   * Unregister a flow connection
   */
  public unregisterConnection(id: string): boolean {
    if (!this.network.connections.has(id)) {
      return false;
    }

    this.network.connections.delete(id);
    return true;
  }

  /**
   * Update resource state
   */
  public updateResourceState(type: ResourceType, state: ResourceState): void {
    this.network.resourceStates.set(type, state);
  }

  /**
   * Get resource state
   */
  public getResourceState(type: ResourceType): ResourceState | undefined {
    return this.network.resourceStates.get(type);
  }

  /**
   * Optimize resource flows
   */
  public optimizeFlows(): FlowOptimizationResult {
    const now = Date.now();

    // Skip optimization if not enough time has passed
    if (now - this.lastOptimization < this.optimizationInterval) {
      return {
        transfers: [],
        updatedConnections: [],
        bottlenecks: [],
        underutilized: [],
      };
    }

    this.lastOptimization = now;

    // Get active nodes and connections
    const activeNodes = Array.from(this.network.nodes.values()).filter(node => node.active);
    const activeConnections = Array.from(this.network.connections.values()).filter(
      conn => conn.active
    );

    // Group nodes by type
    const producers = activeNodes.filter(node => node.type === 'producer');
    const consumers = activeNodes.filter(node => node.type === 'consumer');
    const storages = activeNodes.filter(node => node.type === 'storage');

    /**
     * Converter nodes for resource transformation
     *
     * These nodes will be used in future implementations to:
     * 1. Transform basic resources into advanced materials
     * 2. Implement multi-step production chains
     * 3. Create resource conversion efficiency mechanics
     * 4. Support tech tree progression through resource refinement
     * 5. Enable specialized production facilities that convert between resource types
     *
     * Converters will be critical for the upcoming advanced manufacturing system
     * where players can establish complex production chains to create high-tier resources.
     */
    const _converters = activeNodes.filter(node => node.type === 'converter');

    // Log converter information for debugging
    if (_converters.length > 0) {
      console.warn(
        `[ResourceFlowManager] Found ${_converters.length} active converters in the network`
      );

      // Calculate and apply converter efficiency bonuses
      for (const converter of _converters) {
        // Apply converter efficiency to resource production
        const efficiency = converter.efficiency || 1.0;
        console.warn(
          `[ResourceFlowManager] Converter ${converter.id} operating at ${efficiency * 100}% efficiency`
        );

        // Find connections from this converter
        const converterConnections = Array.from(this.network.connections.values()).filter(
          conn => conn.source === converter.id && conn.active
        );

        // Apply efficiency bonus to connection rates
        for (const connection of converterConnections) {
          // Adjust the connection rate based on converter efficiency
          const originalRate = connection.currentRate;
          connection.currentRate = originalRate * efficiency;

          console.warn(
            `[ResourceFlowManager] Adjusted flow rate for ${connection.id} from ${originalRate} to ${connection.currentRate} based on converter efficiency`
          );

          // Update the connection in the network
          this.network.connections.set(connection.id, connection);
        }
      }
    }

    // Calculate resource availability and demand
    const availability: Partial<Record<ResourceType, number>> = {};
    const demand: Partial<Record<ResourceType, number>> = {};

    // Initialize with current resource states
    // Convert Map entries to array to avoid MapIterator error
    const resourceStateEntries = Array.from(this.network.resourceStates.entries());
    for (const [type, _state] of resourceStateEntries) {
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

    // Calculate consumption needs
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

    // Adjust for storage capacity
    for (const storage of storages) {
      for (const resourceType of storage.resources) {
        const resourceState = this.network.resourceStates.get(resourceType);
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

    // Identify bottlenecks and underutilized resources
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

    // Optimize flow rates based on priorities
    const updatedConnections: FlowConnection[] = [];

    // Sort connections by priority (high to low)
    const prioritizedConnections = [...activeConnections].sort(
      (a, b) => Number(b.priority) - Number(a.priority)
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

      // Update the actual connection in the network
      this.network.connections.set(connection.id, connection);
    }

    // Generate transfer instructions
    const transfers: ResourceTransfer[] = [];

    for (const connection of updatedConnections) {
      if (connection.currentRate <= 0) {
        continue;
      }

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

    return {
      transfers,
      updatedConnections,
      bottlenecks,
      underutilized,
    };
  }

  /**
   * Add a transfer to history
   */
  private addToTransferHistory(transfer: ResourceTransfer): void {
    this.transferHistory.push(transfer);

    // Trim history if needed
    if (this.transferHistory.length > this.maxHistorySize) {
      this.transferHistory = this.transferHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get transfer history
   */
  public getTransferHistory(): ResourceTransfer[] {
    return [...this.transferHistory];
  }

  /**
   * Get transfer history for a specific resource type
   */
  public getTransferHistoryByType(type: ResourceType): ResourceTransfer[] {
    return this.transferHistory.filter(transfer => transfer.type === type);
  }

  /**
   * Get all nodes
   */
  public getNodes(): FlowNode[] {
    return Array.from(this.network.nodes.values());
  }

  /**
   * Get all connections
   */
  public getConnections(): FlowConnection[] {
    return Array.from(this.network.connections.values());
  }

  /**
   * Get node by ID
   */
  public getNode(id: string): FlowNode | undefined {
    return this.network.nodes.get(id);
  }

  /**
   * Get connection by ID
   */
  public getConnection(id: string): FlowConnection | undefined {
    return this.network.connections.get(id);
  }

  /**
   * Create a resource flow
   */
  public createFlow(flow: ResourceFlow): boolean {
    if (!validateResourceFlow(flow)) {
      console.error('Invalid resource flow:', flow);
      return false;
    }

    // Extract resource type and other properties from flow
    const resourceType = flow.resources[0]?.type;
    const rate = flow.resources[0]?.amount || 0;

    /**
     * Resource flow interval in milliseconds
     *
     * This parameter will be used in future implementations to:
     * 1. Create pulsed resource flows instead of continuous streams
     * 2. Implement time-based resource delivery systems
     * 3. Support burst transfer mechanics for specialized modules
     * 4. Enable resource scheduling for optimized network utilization
     * 5. Create priority-based time-sharing for limited resource connections
     *
     * The interval system will allow for more complex resource management strategies,
     * particularly for high-value resources that should be delivered in discrete packages
     * rather than continuous flows.
     */
    const _interval = flow.resources[0]?.interval || 1000;

    // Implement interval-based flow control
    if (_interval !== 1000) {
      console.warn(
        `[ResourceFlowManager] Using custom interval of ${_interval}ms for flow control`
      );

      // Create a scheduled transfer based on the interval
      const scheduleTransfer = () => {
        // Find the connection for this flow
        const connection = Array.from(this.network.connections.values()).find(
          conn =>
            conn.resourceType === resourceType &&
            conn.source === flow.source &&
            conn.target === flow.target
        );

        if (connection && connection.active) {
          // Calculate batch size based on rate and interval
          const batchSize = (connection.currentRate / 1000) * _interval;

          // Create a transfer record
          const transfer: ResourceTransfer = {
            type: resourceType,
            amount: batchSize,
            source: flow.source,
            target: flow.target,
            timestamp: Date.now(),
          };

          // Add to history
          this.addToTransferHistory(transfer);

          console.warn(
            `[ResourceFlowManager] Scheduled transfer of ${batchSize.toFixed(2)} ${resourceType} from ${flow.source} to ${flow.target}`
          );

          // Emit event for the scheduled transfer
          moduleEventBus.emit({
            type: 'RESOURCE_TRANSFERRED',
            moduleId: 'resource-flow-manager',
            moduleType: 'resource-manager',
            timestamp: Date.now(),
            data: transfer as unknown as Record<string, unknown>,
          });
        }
      };

      // Set up the interval
      const intervalId = setInterval(scheduleTransfer, _interval);

      // Store the interval ID for cleanup
      // @ts-expect-error - Adding a property for cleanup
      flow.intervalId = intervalId;
    }

    // Create a proper ResourcePriority object
    const priority: ResourcePriority = {
      type: resourceType,
      priority: 1,
      consumers: [],
    };

    if (!resourceType) {
      console.error('Flow must have at least one resource');
      return false;
    }

    // Create nodes if they don't exist
    if (!this.network.nodes.has(flow.source)) {
      this.registerNode({
        id: flow.source,
        type: 'producer',
        resources: [resourceType],
        priority: priority,
        active: true,
      });
    }

    if (!this.network.nodes.has(flow.target)) {
      this.registerNode({
        id: flow.target,
        type: 'consumer',
        resources: [resourceType],
        priority: priority,
        active: true,
      });
    }

    // Create connection
    const connectionId = `${flow.source}-${flow.target}-${resourceType}`;

    return this.registerConnection({
      id: connectionId,
      source: flow.source,
      target: flow.target,
      resourceType: resourceType,
      maxRate: rate,
      currentRate: 0,
      priority: priority,
      active: true,
    });
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.network.nodes.clear();
    this.network.connections.clear();
    this.network.resourceStates.clear();
    this.transferHistory = [];
  }
}

import { ResourceType } from './../types/resources/ResourceTypes';
/**
 * ResourceFlowWorker.ts
 *
 * Web Worker implementation for offloading resource flow calculations
 * This worker handles heavy computational tasks from the ResourceFlowManager
 * to prevent UI thread blocking for large resource networks.
 */

import {
  FlowConnection,
  FlowNode,
  ResourceState,
  ResourceTransfer,
} from '../types/resources/ResourceTypes';

// Message types for communication with the main thread
type WorkerMessageType =
  | 'OPTIMIZE_FLOWS'
  | 'BATCH_PROCESS'
  | 'CALCULATE_RESOURCE_BALANCE'
  | 'OPTIMIZE_FLOW_RATES'
  | 'CALCULATE_EFFICIENCY';

// Input data structure for worker tasks
interface WorkerInput {
  type: WorkerMessageType;
  data: unknown;
  taskId: string;
}

// Output data structure for worker results
interface WorkerOutput {
  type: WorkerMessageType;
  result: unknown;
  taskId: string;
  executionTimeMs: number;
}

// Self reference for the worker context
const ctx: Worker = self as unknown as Worker;

// Handle messages from main thread
ctx.addEventListener('message', (event: MessageEvent<WorkerInput>) => {
  const { type, data, taskId } = event.data;
  const startTime = Date.now();

  let result: unknown;

  try {
    switch (type) {
      case 'OPTIMIZE_FLOWS':
        result = optimizeFlows(data.nodes, data.connections, data.resourceStates);
        break;

      case 'BATCH_PROCESS':
        result = processBatch(data.nodes, data.connections, data.batchSize);
        break;

      case 'CALCULATE_RESOURCE_BALANCE':
        result = calculateResourceBalance(
          data.producers,
          data.consumers,
          data.storages,
          data.connections
        );
        break;

      case 'OPTIMIZE_FLOW_RATES':
        result = optimizeFlowRates(data.connections, data.availability, data.demand);
        break;

      case 'CALCULATE_EFFICIENCY':
        result = calculateNetworkEfficiency(data.network);
        break;

      default:
        throw new Error(`Unknown task type: ${type}`);
    }

    // Send successful result back to main thread
    const endTime = Date.now();
    ctx.postMessage({
      type,
      result,
      taskId,
      executionTimeMs: endTime - startTime,
    } as WorkerOutput);
  } catch (error) {
    // Send error back to main thread
    ctx.postMessage({
      type,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      taskId,
      executionTimeMs: Date.now() - startTime,
    });
  }
});

/**
 * Main optimization function - handles the complete flow optimization process
 */
function optimizeFlows(
  nodes: FlowNode[],
  connections: FlowConnection[],
  resourceStates: Map<ResourceType, ResourceState>
) {
  // Filter active nodes and connections
  const activeNodes = nodes.filter(node => node.active);
  const activeConnections = connections.filter(conn => conn.active);

  // Categorize nodes by type
  const producers = activeNodes.filter(node => node.type === 'producer');
  const consumers = activeNodes.filter(node => node.type === 'consumer');
  const storages = activeNodes.filter(node => node.type === 'storage');

  // Calculate resource balance
  const { availability, demand } = calculateResourceBalance(
    producers,
    consumers,
    storages,
    activeConnections
  );

  // Identify resource issues
  const { bottlenecks, underutilized } = identifyResourceIssues(availability, demand);

  // Optimize flow rates
  const { updatedConnections, transfers } = optimizeFlowRates(
    activeConnections,
    availability,
    demand
  );

  // Return optimization results
  return {
    transfers,
    updatedConnections,
    bottlenecks,
    underutilized,
    performanceMetrics: {
      nodesProcessed: activeNodes.length,
      connectionsProcessed: activeConnections.length,
      transfersGenerated: transfers.length,
    },
  };
}

/**
 * Process a batch of nodes and connections
 */
function processBatch(nodes: FlowNode[], connections: FlowConnection[], batchSize: number) {
  const results = [];
  const batchCount = Math.ceil(nodes.length / batchSize);

  for (let i = 0; i < batchCount; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, nodes.length);
    const nodeBatch = nodes.slice(start, end);

    // Process each node in the batch
    for (const node of nodeBatch) {
      // Simplified processing logic for demonstration
      const nodeConnections = connections.filter(
        conn => conn.source === node.id || conn.target === node.id
      );

      results.push({
        nodeId: node.id,
        connectionCount: nodeConnections.length,
        processed: true,
      });
    }
  }

  return {
    batchResults: results,
    totalProcessed: results.length,
  };
}

/**
 * Calculate resource balance between producers, consumers, and storage
 */
function calculateResourceBalance(
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

  // Calculate production capacity
  for (const producer of producers) {
    for (const resourceType of producer.resources) {
      // This is a simplified version - the actual implementation would calculate
      // based on producer capacity, efficiency, etc.
      availability[resourceType] = (availability[resourceType] || 0) + 10;
    }
  }

  // Calculate consumer demand
  for (const consumer of consumers) {
    for (const resourceType of consumer.resources) {
      // Simplified demand calculation
      demand[resourceType] = (demand[resourceType] || 0) + 5;
    }
  }

  // Factor in storage capacity
  for (const storage of storages) {
    for (const resourceType of storage.resources) {
      // Simplified storage calculation
      availability[resourceType] = (availability[resourceType] || 0) + 2;
    }
  }

  return { availability, demand };
}

/**
 * Identify resource bottlenecks and underutilized resources
 */
function identifyResourceIssues(
  availability: Partial<Record<ResourceType, number>>,
  demand: Partial<Record<ResourceType, number>>
): {
  bottlenecks: string[];
  underutilized: string[];
} {
  const bottlenecks: string[] = [];
  const underutilized: string[] = [];

  // Compare availability and demand for each resource type
  for (const resourceType in demand) {
    if (Object.prototype.hasOwnProperty.call(demand, resourceType)) {
      const availableAmount = availability[resourceType as ResourceType] || 0;
      const demandAmount = demand[resourceType as ResourceType] || 0;

      // Check for bottlenecks (demand > availability)
      if (demandAmount > availableAmount) {
        bottlenecks.push(resourceType);
      }

      // Check for underutilized resources (availability > demand * 1.5)
      if (availableAmount > demandAmount * 1.5) {
        underutilized.push(resourceType);
      }
    }
  }

  return { bottlenecks, underutilized };
}

/**
 * Optimize flow rates based on resource availability and demand
 */
function optimizeFlowRates(
  activeConnections: FlowConnection[],
  availability: Partial<Record<ResourceType, number>>,
  demand: Partial<Record<ResourceType, number>>
): {
  updatedConnections: FlowConnection[];
  transfers: ResourceTransfer[];
} {
  const updatedConnections: FlowConnection[] = [];
  const transfers: ResourceTransfer[] = [];

  // Group connections by resource type
  const connectionsByResource: Record<string, FlowConnection[]> = {};

  for (const connection of activeConnections) {
    const resourceType = connection.resourceType as string;
    connectionsByResource[resourceType] = connectionsByResource[resourceType] || [];
    connectionsByResource[resourceType].push(connection);
  }

  // Process each resource type
  for (const resourceType in connectionsByResource) {
    if (Object.prototype.hasOwnProperty.call(connectionsByResource, resourceType)) {
      const connections = connectionsByResource[resourceType];
      const availableAmount = availability[resourceType as ResourceType] || 0;
      const demandAmount = demand[resourceType as ResourceType] || 0;

      // Skip if no demand or availability
      if (demandAmount === 0 || availableAmount === 0) {
        continue;
      }

      // Sort connections by priority
      connections.sort((a, b) => (b.priority?.priority || 0) - (a.priority?.priority || 0));

      // Distribute resources based on priority
      let remainingAvailability = availableAmount;

      for (const connection of connections) {
        if (remainingAvailability <= 0) break;

        // Calculate optimal flow rate based on availability and max rate
        const optimalRate = Math.min(connection.maxRate, remainingAvailability);

        // Update connection rate
        const updatedConnection = {
          ...connection,
          currentRate: optimalRate,
        };

        updatedConnections.push(updatedConnection);
        remainingAvailability -= optimalRate;

        // Create transfer record
        transfers.push({
          id: `transfer-${connection.id}-${Date.now()}`,
          source: connection.source,
          target: connection.target,
          resourceType: connection.resourceType,
          amount: optimalRate,
          timestamp: Date.now(),
        });
      }
    }
  }

  return { updatedConnections, transfers };
}

/**
 * Calculate network efficiency based on node placement and connections
 */
function calculateNetworkEfficiency(network: {
  nodes: FlowNode[];
  connections: FlowConnection[];
}): {
  overallEfficiency: number;
  nodeEfficiencies: Record<string, number>;
  bottlenecks: string[];
} {
  const { nodes, connections } = network;
  const nodeEfficiencies: Record<string, number> = {};
  const bottlenecks: string[] = [];

  // Calculate efficiency for each node
  for (const node of nodes) {
    // Count connections to/from this node
    const nodeConnections = connections.filter(
      conn => conn.source === node.id || conn.target === node.id
    );

    // Basic efficiency calculation - more connections = higher stress = lower efficiency
    const connectionStress = Math.min(1, nodeConnections.length / 10);
    const efficiency = 1 - connectionStress;

    nodeEfficiencies[node.id] = efficiency;

    if (efficiency < 0.6) {
      bottlenecks.push(node.id);
    }
  }

  // Calculate overall network efficiency
  const overallEfficiency =
    nodes.length > 0
      ? Object.values(nodeEfficiencies).reduce((sum, val) => sum + val, 0) / nodes.length
      : 0;

  return {
    overallEfficiency,
    nodeEfficiencies,
    bottlenecks,
  };
}

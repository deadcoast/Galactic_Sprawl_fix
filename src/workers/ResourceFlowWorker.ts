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

// Correct import for error logging service (if main thread context available, otherwise use postMessage)

// Message types for communication with the main thread
type WorkerMessageType =
  | 'OPTIMIZE_FLOWS'
  | 'BATCH_PROCESS'
  | 'CALCULATE_RESOURCE_BALANCE'
  | 'OPTIMIZE_FLOW_RATES'
  | 'CALCULATE_EFFICIENCY';

// Input data interfaces for each message type
interface OptimizeFlowsData {
  nodes: FlowNode[];
  connections: FlowConnection[];
  resourceStates: Map<ResourceType, ResourceState>;
}

interface BatchProcessData {
  nodes: FlowNode[];
  connections: FlowConnection[];
  batchSize: number;
}

interface CalculateResourceBalanceData {
  producers: FlowNode[];
  consumers: FlowNode[];
  storages: FlowNode[];
  connections: FlowConnection[];
}

interface OptimizeFlowRatesData {
  connections: FlowConnection[];
  availability: Partial<Record<ResourceType, number>>;
  demand: Partial<Record<ResourceType, number>>;
}

interface CalculateEfficiencyData {
  network: {
    nodes: FlowNode[];
    connections: FlowConnection[];
  };
}

// Type guard functions
function isOptimizeFlowsData(data: unknown): data is OptimizeFlowsData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'nodes' in data &&
    'connections' in data &&
    'resourceStates' in data &&
    Array.isArray((data as OptimizeFlowsData).nodes) &&
    Array.isArray((data as OptimizeFlowsData).connections)
  );
}

function isBatchProcessData(data: unknown): data is BatchProcessData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'nodes' in data &&
    'connections' in data &&
    'batchSize' in data &&
    Array.isArray((data as BatchProcessData).nodes) &&
    Array.isArray((data as BatchProcessData).connections) &&
    typeof (data as BatchProcessData).batchSize === 'number'
  );
}

function isCalculateResourceBalanceData(data: unknown): data is CalculateResourceBalanceData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'producers' in data &&
    'consumers' in data &&
    'storages' in data &&
    'connections' in data &&
    Array.isArray((data as CalculateResourceBalanceData).producers) &&
    Array.isArray((data as CalculateResourceBalanceData).consumers) &&
    Array.isArray((data as CalculateResourceBalanceData).storages) &&
    Array.isArray((data as CalculateResourceBalanceData).connections)
  );
}

function isOptimizeFlowRatesData(data: unknown): data is OptimizeFlowRatesData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'connections' in data &&
    'availability' in data &&
    'demand' in data &&
    Array.isArray((data as OptimizeFlowRatesData).connections)
  );
}

function isCalculateEfficiencyData(data: unknown): data is CalculateEfficiencyData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'network' in data &&
    typeof (data as CalculateEfficiencyData).network === 'object' &&
    (data as CalculateEfficiencyData).network !== null &&
    'nodes' in (data as CalculateEfficiencyData).network &&
    'connections' in (data as CalculateEfficiencyData).network
  );
}

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
  error?: string;
}

// Self reference for the worker context
const ctx: Worker = self as unknown as Worker;

// Handle messages from main thread
ctx.addEventListener('message', (event: MessageEvent<WorkerInput>) => {
  const rawData = event?.data;
  // Validate the basic structure of the incoming message
  if (
    !rawData ||
    typeof rawData !== 'object' ||
    typeof rawData.type !== 'string' || // Basic check for type
    !('data' in rawData) || // Check if data property exists
    typeof rawData.taskId !== 'string' // Basic check for taskId
  ) {
    // Attempt to use original type if available, otherwise use a placeholder
    // Cast via unknown because we know this is an error state not fully matching WorkerOutput type constraints
    const errorMsg = 'Received invalid message structure in ResourceFlowWorker';
    console.error(errorMsg, rawData); // Log within worker for debugging
    ctx.postMessage({
      type: typeof rawData?.type === 'string' ? rawData.type : 'OPTIMIZE_FLOWS', // Use original type or placeholder
      result: null,
      error: errorMsg,
      taskId: typeof rawData?.taskId === 'string' ? rawData.taskId : 'unknown', // Try to get taskId if possible
      executionTimeMs: 0,
    } as unknown as WorkerOutput); // Cast via unknown for error reporting
    return;
  }

  // Now we know rawData is an object with type, data, and taskId
  const { type, data, taskId } = event.data;
  const startTime = Date.now();

  let result;
  try {
    switch (type) {
      case 'OPTIMIZE_FLOWS': {
        if (!isOptimizeFlowsData(data)) {
          throw new Error('Invalid data for OPTIMIZE_FLOWS');
        }
        const { nodes, connections, resourceStates } = data;
        result = optimizeFlows(nodes, connections, resourceStates);
        break;
      }

      case 'BATCH_PROCESS':
        if (!isBatchProcessData(data)) {
          throw new Error('Invalid data format for BATCH_PROCESS');
        }
        result = processBatch(data.nodes, data.connections, data.batchSize);
        break;

      case 'CALCULATE_RESOURCE_BALANCE':
        if (!isCalculateResourceBalanceData(data)) {
          throw new Error('Invalid data format for CALCULATE_RESOURCE_BALANCE');
        }
        result = calculateResourceBalance(
          data.producers,
          data.consumers,
          data.storages,
          data.connections
        );
        break;

      case 'OPTIMIZE_FLOW_RATES':
        if (!isOptimizeFlowRatesData(data)) {
          throw new Error('Invalid data format for OPTIMIZE_FLOW_RATES');
        }
        result = optimizeFlowRates(data.connections, data.availability, data.demand);
        break;

      case 'CALCULATE_EFFICIENCY':
        if (!isCalculateEfficiencyData(data)) {
          throw new Error('Invalid data format for CALCULATE_EFFICIENCY');
        }
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
    } as WorkerOutput);
  }
});

/**
 * Main optimization function - handles the complete flow optimization process
 */
function optimizeFlows(
  nodes: FlowNode[],
  connections: FlowConnection[],
  resourceStates: Map<ResourceType, ResourceState>
): {
  transfers: ResourceTransfer[];
  updatedConnections: FlowConnection[];
  bottlenecks: string[];
  underutilized: string[];
  performanceMetrics: {
    nodesProcessed: number;
    connectionsProcessed: number;
    transfersGenerated: number;
  };
} {
  // Filter active nodes and connections
  const activeNodes = nodes.filter(node => node.active);
  const activeConnections = connections.filter(conn => conn.active);

  // Apply resource state information to node resources if applicable
  activeNodes.forEach(node => {
    Object.keys(node.resources).forEach(key => {
      const resourceType = key as ResourceType;
      if (resourceStates.has(resourceType)) {
        // Update node resource state with global resource state information
        const globalState = resourceStates.get(resourceType)!;
        node.resources[resourceType] = {
          ...node.resources[resourceType],
          production: node.resources[resourceType].production * (globalState.production / 100 || 1),
          consumption:
            node.resources[resourceType].consumption * (globalState.consumption / 100 || 1),
        };
      }
    });
  });

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
      connectionsProcessed: connections.length,
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
  connections: FlowConnection[]
): {
  availability: Partial<Record<ResourceType, number>>;
  demand: Partial<Record<ResourceType, number>>;
} {
  const availability: Partial<Record<ResourceType, number>> = {};
  const demand: Partial<Record<ResourceType, number>> = {};

  // Calculate production capacity
  for (const producer of producers) {
    const resourceTypes = Object.keys(producer.resources) as ResourceType[];
    for (const resourceType of resourceTypes) {
      availability[resourceType] = (availability[resourceType] ?? 0) + 10;
    }
  }

  // Calculate consumer demand
  for (const consumer of consumers) {
    const resourceTypes = Object.keys(consumer.resources) as ResourceType[];
    for (const resourceType of resourceTypes) {
      demand[resourceType] = (demand[resourceType] ?? 0) + 5;
    }
  }

  // Factor in connection capacity limitations
  for (const connection of connections) {
    // For each resource type in the connection
    connection.resourceTypes.forEach(resourceType => {
      if (connection.maxFlow && availability[resourceType]) {
        // If this connection has a bottleneck, adjust the available throughput
        availability[resourceType] = Math.min(availability[resourceType]!, connection.maxFlow);
      }
    });
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
  for (const resourceType of Object.keys(demand)) {
    const enumResourceType = resourceType as ResourceType;
    const availableAmount = availability[enumResourceType] ?? 0;
    const demandAmount = demand[enumResourceType] ?? 0;

    // Check for bottlenecks (demand > availability)
    if (demandAmount > availableAmount) {
      bottlenecks.push(resourceType);
    }

    // Check for underutilized resources (availability > demand * 1.5)
    if (availableAmount > demandAmount * 1.5) {
      underutilized.push(resourceType);
    }
  }

  return { bottlenecks, underutilized };
}

/**
 * Optimize flow rates between nodes
 */
function optimizeFlowRates(
  connections: FlowConnection[],
  availability: Partial<Record<ResourceType, number>>,
  demand: Partial<Record<ResourceType, number>>
): {
  updatedConnections: FlowConnection[];
  transfers: ResourceTransfer[];
} {
  const updatedConnections = [...connections];
  const transfers: ResourceTransfer[] = [];

  for (const connection of updatedConnections) {
    for (const resourceType of connection.resourceTypes) {
      const availableAmount = availability[resourceType] ?? 0;
      const demandAmount = demand[resourceType] ?? 0;
      const transferAmount = Math.min(availableAmount, demandAmount);

      if (transferAmount > 0) {
        const transfer: ResourceTransfer = {
          type: resourceType,
          amount: transferAmount,
          source: connection.source,
          target: connection.target,
          timestamp: Date.now(),
        };

        transfers.push(transfer);
      }
    }
  }

  return { updatedConnections, transfers };
}

/**
 * Calculate network efficiency metrics
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
    const nodeConnections = connections.filter(
      conn => conn.source === node.id || conn.target === node.id
    );
    nodeEfficiencies[node.id] = nodeConnections.length > 0 ? 0.8 : 0; // Simplified calculation
  }

  // Calculate overall efficiency (simplified)
  const overallEfficiency =
    Object.values(nodeEfficiencies).reduce((sum, eff) => sum + eff, 0) / nodes.length;

  return {
    overallEfficiency,
    nodeEfficiencies,
    bottlenecks,
  };
}

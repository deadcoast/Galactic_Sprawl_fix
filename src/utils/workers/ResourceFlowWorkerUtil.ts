/**
 * ResourceFlowWorkerUtil.ts
 *
 * Utility class for communicating with ResourceFlowWorker from the main thread.
 * Provides a clean API for offloading resource flow calculations to a Web Worker.
 */

import {
  FlowNode,
  ResourceState,
  ResourceTransfer,
} from '../../types/resources/StandardizedResourceTypes';

import { ResourceType } from '../../types/resources/ResourceTypes';

// We need to import FlowConnection from ResourceTypes since it's not in StandardizedResourceTypes
import { FlowConnection } from '../../types/resources/ResourceTypes';

// Input message types that can be sent to the worker
type WorkerMessageType =
  | 'OPTIMIZE_FLOWS'
  | 'BATCH_PROCESS'
  | 'CALCULATE_RESOURCE_BALANCE'
  | 'OPTIMIZE_FLOW_RATES'
  | 'CALCULATE_EFFICIENCY';

// Input structure for worker messages
interface WorkerInput {
  type: WorkerMessageType;
  data: unknown;
  taskId: string;
}

// Output structure from worker
interface WorkerOutput {
  type: WorkerMessageType;
  result: unknown;
  taskId: string;
  executionTimeMs: number;
  error?: string;
}

/**
 * Flow optimization result structure
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
 * ResourceFlowWorkerUtil provides utilities for using Web Workers
 * to optimize resource flow calculations in a separate thread
 */
export class ResourceFlowWorkerUtil {
  private worker: Worker | null = null;
  private tasks: Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (reason: unknown) => void;
      startTime: number;
    }
  > = new Map();
  private isSupported: boolean;
  private pendingTasks: Array<{
    type: WorkerMessageType;
    data: unknown;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];

  /**
   * Create a new ResourceFlowWorkerUtil instance
   */
  constructor() {
    // Check if Web Workers are supported
    this.isSupported = typeof Worker !== 'undefined';

    // Initialize worker if supported
    if (this.isSupported) {
      this.initWorker();
    } else {
      console.warn(
        'Web Workers are not supported in this environment. ResourceFlowWorkerUtil will run calculations in the main thread.'
      );
    }
  }

  /**
   * Initialize the Web Worker
   */
  private initWorker(): void {
    try {
      // Create new worker
      this.worker = new Worker(new URL('../../workers/ResourceFlowWorker.ts', import.meta.url), {
        type: 'module',
      });

      // Set up message handler
      this.worker.addEventListener('message', this.handleWorkerMessage);

      // Process any pending tasks
      this.processPendingTasks();
    } catch (error) {
      console.error('Failed to initialize ResourceFlowWorker:', error);
      this.isSupported = false;
    }
  }

  /**
   * Handle messages received from the worker
   */
  private handleWorkerMessage = (event: MessageEvent<WorkerOutput>): void => {
    const { taskId, result, error } = event?.data ?? {};

    // Find the task in our tracking map
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`Received response for unknown task ID: ${taskId}`);
      return;
    }

    // Remove task from tracking
    this.tasks.delete(taskId);

    // Handle error or success
    if (error) {
      task.reject(new Error(error));
    } else {
      task.resolve(result);
    }
  };

  /**
   * Process any tasks that were queued before the worker was ready
   */
  private processPendingTasks(): void {
    if (!this.worker || this.pendingTasks.length === 0) {
      return;
    }

    // Process all pending tasks
    for (const task of this.pendingTasks) {
      this.sendToWorker(task.type, task.data).then(task.resolve).catch(task.reject);
    }

    // Clear the queue
    this.pendingTasks = [];
  }

  /**
   * Send a task to the worker and return a promise for the result
   */
  private sendToWorker(type: WorkerMessageType, data: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      // If worker isn't supported or failed to initialize, reject
      if (!this.isSupported) {
        reject(new Error('Web Workers are not supported in this environment'));
        return;
      }

      // If worker isn't ready yet, queue the task
      if (!this.worker) {
        this.pendingTasks.push({ type, data, resolve, reject });
        return;
      }

      // Create a unique task ID
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Store task details for tracking
      this.tasks.set(taskId, {
        resolve,
        reject,
        startTime: Date.now(),
      });

      // Send message to worker
      this.worker.postMessage({ type, data, taskId } as WorkerInput);
    });
  }

  /**
   * Run flow optimization in the worker
   */
  public async optimizeFlows(
    nodes: FlowNode[],
    connections: FlowConnection[],
    resourceStates: Map<ResourceType, ResourceState>
  ): Promise<FlowOptimizationResult> {
    try {
      const result = await this.sendToWorker('OPTIMIZE_FLOWS', {
        nodes: Array.from(nodes.values()),
        connections: Array.from(connections.values()),
        resourceStates: Array.from(resourceStates.entries()),
      });

      return result as FlowOptimizationResult;
    } catch (error) {
      console.error('Error in worker flow optimization:', error);
      throw error;
    }
  }

  /**
   * Process a batch of nodes and connections in the worker
   */
  public async processBatch(
    nodes: FlowNode[],
    connections: FlowConnection[],
    batchSize: number
  ): Promise<{
    batchResults: Array<{ nodeId: string; connectionCount: number; processed: boolean }>;
    totalProcessed: number;
  }> {
    try {
      const result = await this.sendToWorker('BATCH_PROCESS', {
        nodes,
        connections,
        batchSize,
      });

      return result as {
        batchResults: Array<{ nodeId: string; connectionCount: number; processed: boolean }>;
        totalProcessed: number;
      };
    } catch (error) {
      console.error('Error in worker batch processing:', error);
      throw error;
    }
  }

  /**
   * Calculate resource balance in the worker
   */
  public async calculateResourceBalance(
    producers: FlowNode[],
    consumers: FlowNode[],
    storages: FlowNode[],
    connections: FlowConnection[]
  ): Promise<{
    availability: Partial<Record<ResourceType, number>>;
    demand: Partial<Record<ResourceType, number>>;
  }> {
    try {
      const result = await this.sendToWorker('CALCULATE_RESOURCE_BALANCE', {
        producers,
        consumers,
        storages,
        connections,
      });

      return result as {
        availability: Partial<Record<ResourceType, number>>;
        demand: Partial<Record<ResourceType, number>>;
      };
    } catch (error) {
      console.error('Error in worker resource balance calculation:', error);
      throw error;
    }
  }

  /**
   * Optimize flow rates in the worker
   */
  public async optimizeFlowRates(
    connections: FlowConnection[],
    availability: Partial<Record<ResourceType, number>>,
    demand: Partial<Record<ResourceType, number>>
  ): Promise<{
    updatedConnections: FlowConnection[];
    transfers: ResourceTransfer[];
  }> {
    try {
      const result = await this.sendToWorker('OPTIMIZE_FLOW_RATES', {
        connections,
        availability,
        demand,
      });

      return result as {
        updatedConnections: FlowConnection[];
        transfers: ResourceTransfer[];
      };
    } catch (error) {
      console.error('Error in worker flow rate optimization:', error);
      throw error;
    }
  }

  /**
   * Calculate network efficiency in the worker
   */
  public async calculateNetworkEfficiency(network: {
    nodes: FlowNode[];
    connections: FlowConnection[];
  }): Promise<{
    overallEfficiency: number;
    nodeEfficiencies: Record<string, number>;
    bottlenecks: string[];
  }> {
    try {
      const result = await this.sendToWorker('CALCULATE_EFFICIENCY', {
        network,
      });

      return result as {
        overallEfficiency: number;
        nodeEfficiencies: Record<string, number>;
        bottlenecks: string[];
      };
    } catch (error) {
      console.error('Error in worker network efficiency calculation:', error);
      throw error;
    }
  }

  /**
   * Terminate the worker
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject any pending tasks
    for (const [taskId, task] of this.tasks.entries()) {
      task.reject(new Error('Worker terminated'));
      this.tasks.delete(taskId);
    }
  }
}

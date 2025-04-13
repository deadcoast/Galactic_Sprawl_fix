import { ResourceFlowManager } from '../managers/resource/ResourceFlowManager';
import { errorLoggingService } from '../services/logging/ErrorLoggingService';
import { ResourceType } from '../types/resources/ResourceTypes';

interface WorkerMessage {
  type: string;
  payload: unknown;
  context?: Record<string, unknown>; // Add optional context for more details
}

// Define interface for resource flow payload
interface ResourceFlowPayload {
  // Define expected properties, e.g.:
  nodes: { id: string; type: string /* FlowNodeType enum? */ /* other node props */ }[];
  connections: { source: string; target: string; resourceTypes: ResourceType[] /* ... */ }[];
  // Add other necessary fields based on ResourceFlowManager.calculateFlow needs
}

// Define a type guard for WorkerMessage
const isWorkerMessage = (data: unknown): data is WorkerMessage => {
  return typeof data === 'object' && data !== null && 'type' in data && 'payload' in data;
};

// Removed isResourceFlowPayload as optimizeFlows doesn't seem to take payload

// Access the manager instance via getInstance()
const resourceFlowManager = ResourceFlowManager.getInstance();

// Make processMessage async again
const processMessage = async (message: WorkerMessage): Promise<void> => {
  try {
    switch (message.type) {
      case 'OPTIMIZE_RESOURCE_FLOW': {
        console.log('Worker starting OPTIMIZE_RESOURCE_FLOW...');
        const optimizationResult = await resourceFlowManager.optimizeFlows();
        console.log('Worker finished OPTIMIZE_RESOURCE_FLOW.');
        postMessage({ type: 'RESOURCE_FLOW_OPTIMIZED', success: true, result: optimizationResult });
        break;
      }
      case 'ANOTHER_TASK': {
        // Handle another task type
        console.log('Processing ANOTHER_TASK:', message.payload);
        postMessage({ type: 'ANOTHER_TASK_COMPLETE', success: true });
        break;
      }
      default: {
        console.warn(`Unknown message type received in worker: ${message.type}`);
        postMessage({
          type: 'UNKNOWN_MESSAGE_TYPE',
          success: false,
          error: `Unknown type: ${message.type}`,
        });
        break;
      }
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error processing message in worker:', error);

    const logContext = {
      workerMessageType: message.type,
      payloadType: typeof message.payload,
      ...(message.context ?? {}),
    };
    errorLoggingService.logError(error, 'WORKER_ERROR', 'HIGH', logContext);

    postMessage({ type: 'WORKER_ERROR', success: false, error: error.message });
  }
};

// self.onmessage remains the same, calling the now async processMessage
self.onmessage = (event: MessageEvent) => {
  if (isWorkerMessage(event.data)) {
    // Explicitly ignore the promise using void
    void processMessage(event.data);
  } else {
    console.error('Received invalid message structure in worker:', event.data);
    errorLoggingService.logError(
      new Error('Invalid message structure received'),
      'WORKER_SETUP',
      'MEDIUM',
      { receivedData: JSON.stringify(event.data).substring(0, 200) }
    );
    postMessage({ type: 'INVALID_MESSAGE', success: false, error: 'Invalid message structure' });
  }
};

console.log('Worker initialized');

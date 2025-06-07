import { ResourceFlowManager } from '../managers/resource/ResourceFlowManager';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../services/logging/ErrorLoggingService';

// Access the manager instance via getInstance() – kept outside of the main processor so
// there is only ever one ResourceFlowManager per worker thread.
const resourceFlowManager = ResourceFlowManager.getInstance();

// Redesigned worker implementation to align with WorkerService protocol.
// Accepts messages that include a `taskId`, `type`, and `data` field and responds
// with `{ taskId, type: 'result' | 'progress' | 'error', data: unknown }`.

// --------------------------------------------------------------------------------
// Message & type guards

interface WorkerTaskMessage {
  taskId: string;
  type: string;
  data?: unknown; // Alias for the payload that the task operates on
  payload?: unknown; // Retained for backward-compatibility
  context?: Record<string, unknown>;
}

// Determine if the incoming data matches the WorkerTaskMessage structure
const isWorkerTaskMessage = (data: unknown): data is WorkerTaskMessage => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'taskId' in data &&
    (/* Accept both `data` and legacy `payload` fields */ 'data' in data || 'payload' in data)
  );
};

// --------------------------------------------------------------------------------
// Internal helpers

// Store cancelled taskIds so long-running handlers can bail out early if needed
const cancelledTasks = new Set<string>();

const sendProgress = (taskId: string, progress: number): void => {
  // Clamp progress to 0-100 range
  const pct = Math.max(0, Math.min(100, progress));
  postMessage({ taskId, type: 'progress', data: pct });
};

const sendResult = (taskId: string, result: unknown): void => {
  postMessage({ taskId, type: 'result', data: result });
};

const sendError = (taskId: string, error: Error | string): void => {
  const errObj = typeof error === 'string' ? new Error(error) : error;
  postMessage({ taskId, type: 'error', data: errObj.message });
};

// --------------------------------------------------------------------------------
// Main task processor – kept async so heavy work can be awaited.

const processTask = async (message: WorkerTaskMessage): Promise<void> => {
  const { taskId, type } = message;

  // If the task has been marked as cancelled before it even started, bail out.
  if (cancelledTasks.has(taskId)) {
    sendError(taskId, 'Task cancelled');
    return;
  }

  try {
    switch (type) {
      // Example of a heavy task delegated to ResourceFlowManager
      case 'OPTIMIZE_RESOURCE_FLOW': {
        sendProgress(taskId, 5);
        const optimizationResult = await resourceFlowManager.optimizeFlows();
        // Task may have been cancelled while awaiting the result
        if (cancelledTasks.has(taskId)) {
          sendError(taskId, 'Task cancelled');
          break;
        }
        sendProgress(taskId, 100);
        sendResult(taskId, optimizationResult);
        break;
      }

      // Placeholder for additional generic tasks – extend as needed.
      case 'ANOTHER_TASK': {
        // Demonstration of how to periodically emit progress updates.
        for (let i = 1; i <= 5; i++) {
          if (cancelledTasks.has(taskId)) {
            sendError(taskId, 'Task cancelled');
            return;
          }
          // Simulate work
          await new Promise(res => setTimeout(res, 100));
          sendProgress(taskId, (i / 5) * 100);
        }
        sendResult(taskId, { success: true });
        break;
      }

      // Handle task cancellation requests
      case 'CANCEL_TASK': {
        const targetId = (message.data as { taskId?: string })?.taskId;
        if (typeof targetId === 'string') {
          cancelledTasks.add(targetId);
        }
        // Acknowledge receipt – no further action required here because
        // the running task checks the `cancelledTasks` set periodically.
        sendResult(taskId, { cancelled: true });
        break;
      }

      default: {
        const warning = `Unknown task type received in worker: ${type}`;
        errorLoggingService.logWarn(warning, {
          taskType: type,
          taskId: taskId,
        });
        sendError(taskId, warning);
        break;
      }
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    // Send to structured logger
    errorLoggingService.logError(error, ErrorType.WORKER, ErrorSeverity.HIGH, {
      message: 'Error processing task in worker',
    });

    const logContext = {
      workerMessageType: message.type,
      ...(message.context ?? {}),
    };
    errorLoggingService.logError(error, ErrorType.WORKER, ErrorSeverity.HIGH, logContext);

    sendError(taskId, error);
  }
};

// --------------------------------------------------------------------------------
// Wire up the message handler

self.onmessage = (event: MessageEvent) => {
  const incoming = event.data;

  if (isWorkerTaskMessage(incoming)) {
    // Fire-and-forget the async processing – the promise is intentionally not awaited here.
    void processTask(incoming);
  } else if (
    // Legacy handler – accept the old shape `{ type, payload }` without taskId
    typeof incoming === 'object' &&
    incoming !== null &&
    'type' in incoming &&
    'payload' in incoming
  ) {
    // Coerce into new structure with a synthetic taskId so downstream logic works.
    const syntheticMessage: WorkerTaskMessage = {
      taskId: `legacy-${Date.now()}`,
      type: incoming.type as string,
      data: incoming.payload,
    };
    void processTask(syntheticMessage);
  } else {
    errorLoggingService.logWarn('Received invalid message structure in worker', {
      receivedData: JSON.stringify(incoming).substring(0, 200),
    });
    errorLoggingService.logError(
      new Error('Invalid message structure received'),
      ErrorType.WORKER,
      ErrorSeverity.MEDIUM,
      { receivedData: JSON.stringify(incoming).substring(0, 200) }
    );
  }
};

errorLoggingService.logInfo('Generic worker initialized and ready to receive tasks');

interface WorkerMessage {
  taskId: string;
  type: string;
  data: unknown;
}

interface TaskHandler {
  (data: unknown, reportProgress: (progress: number) => void): Promise<unknown>;
}

const taskHandlers = new Map<string, TaskHandler>();

// Register task handlers
taskHandlers.set('heavyComputation', async (data: unknown, reportProgress) => {
  // Example heavy computation task
  // Validate data structure
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as Record<string, unknown>).iterations !== 'number'
  ) {
    throw new Error('Invalid data format for heavyComputation: Expected { iterations: number }');
  }
  // Safe access after validation
  const iterations = (data as { iterations: number }).iterations;
  let result = 0;

  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i);
    if (i % (iterations / 100) === 0) {
      reportProgress((i / iterations) * 100);
    }
  }

  return result;
});

// Handle messages from the main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const rawData = event?.data;
  // Validate the basic structure of the incoming message
  if (
    !rawData ||
    typeof rawData !== 'object' ||
    typeof rawData.type !== 'string' || // Basic check for type
    !('data' in rawData) || // Check if data property exists
    typeof rawData.taskId !== 'string' // Basic check for taskId
  ) {
    // Post error back to main thread for invalid message structure
    const errorMsg = 'Received invalid message structure in generic worker';
    console.error(errorMsg, rawData); // Log within worker for debugging
    self.postMessage({
      taskId: typeof rawData?.taskId === 'string' ? rawData.taskId : 'unknown',
      type: 'error', // Use the standard error type for this worker
      data: errorMsg,
    });
    return;
  }

  // Now we know rawData conforms to WorkerMessage structure
  const { taskId, type, data } = event.data;

  try {
    const handler = taskHandlers.get(type);
    if (!handler) {
      throw new Error(`Unknown task type: ${type}`);
    }

    // Execute task with progress reporting
    const result = await handler(data, (progress: number) => {
      self.postMessage({ taskId, type: 'progress', data: progress });
    });

    // Send result back to main thread
    self.postMessage({ taskId, type: 'result', data: result });
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      taskId,
      type: 'error',
      data: error instanceof Error ? error.message : String(error),
    });
  }
};

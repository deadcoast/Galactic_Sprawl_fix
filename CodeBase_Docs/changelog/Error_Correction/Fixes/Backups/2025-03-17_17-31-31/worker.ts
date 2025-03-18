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

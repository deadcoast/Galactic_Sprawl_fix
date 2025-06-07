/**
 * @context: service-system, worker-management
 * WorkerService - Provides web worker management for background task processing
 *
 * This service handles:
 * - Creating and managing a pool of workers
 * - Submitting tasks to workers
 * - Tracking task progress and completion
 * - Handling worker errors and timeouts
 */

import { AbstractBaseService } from '../lib/services/BaseService';
import {
    errorLoggingService,
    ErrorType
} from './logging/ErrorLoggingService';
export interface WorkerTask<T = unknown> {
  id: string;
  type: string;
  data: unknown;
  priority: number;
  cancelToken?: AbortController;
  progress?: number;
  result?: T;
  error?: Error;
  startTime?: number;
  endTime?: number;
}

export interface WorkerConfig {
  maxWorkers: number;
  taskTimeout: number;
  retryAttempts: number;
  priorityLevels: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
}

class WorkerServiceImpl extends AbstractBaseService<WorkerServiceImpl> {
  private workers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeTasks = new Map<string, WorkerTask>();
  private workerPool = new Map<Worker, WorkerTask | null>();

  private config: WorkerConfig = {
    maxWorkers: navigator.hardwareConcurrency || 4,
    taskTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    priorityLevels: {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    },
  };

  public constructor() {
    super('WorkerService', '1.0.0');
  }

  protected async onInitialize(): Promise<void> {
    // Initialize worker pool
    for (let i = 0; i < this.config.maxWorkers; i++) {
      const worker = new Worker(new URL('../workers/worker.ts', import.meta.url), {
        type: 'module',
      });
      this.setupWorker(worker);
      this.workers.push(worker);
      this.workerPool.set(worker, null);
    }

    // Initialize metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {
      total_tasks: 0,
      active_tasks: 0,
      completed_tasks: 0,
      failed_tasks: 0,
      average_task_time: 0,
    };
  }

  protected async onDispose(): Promise<void> {
    // Cancel all active tasks
    for (const task of this.activeTasks.values()) {
      this.cancelTask(task.id);
    }

    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate();
    }

    this.workers = [];
    this.taskQueue = [];
    this.activeTasks.clear();
    this.workerPool.clear();
  }

  private setupWorker(worker: Worker): void {
    worker.onmessage = (event: MessageEvent) => {
      const { taskId, type, data } = event.data;
      const task = this.activeTasks.get(taskId);

      if (!task) return;

      switch (type) {
        case 'progress':
          task.progress = data;
          break;
        case 'result':
          this.completeTask(taskId, data);
          break;
        case 'error':
          this.failTask(taskId, new Error(data));
          break;
      }
    };

    worker.onerror = (error: ErrorEvent) => {
      const task = Array.from(this.activeTasks.values()).find(
        task => this.workerPool.get(worker) === task
      );
      if (task) {
        this.failTask(task.id, error.error);
      }
    };
  }

  public async submitTask<T>(
    type: string,
    data: unknown,
    priority: keyof WorkerConfig['priorityLevels'] = 'MEDIUM'
  ): Promise<T> {
    const task: WorkerTask<T> = {
      id: crypto.randomUUID(),
      type,
      data,
      priority: this.config.priorityLevels[priority],
      cancelToken: new AbortController(),
    };

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.total_tasks = (metrics.total_tasks ?? 0) + 1;
    this.metadata.metrics = metrics;

    return new Promise<T>((resolve, reject) => {
      // Add task to queue
      this.taskQueue.push(task);
      this.taskQueue.sort((a, b) => b.priority - a.priority);

      // Setup task timeout
      const timeoutId = setTimeout(() => {
        this.cancelTask(task.id);
        reject(new Error(`Task ${task.id} timed out after ${this.config.taskTimeout}ms`));
      }, this.config.taskTimeout);

      // Setup completion handlers
      const cleanup = () => {
        clearTimeout(timeoutId);
        this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);
        this.activeTasks.delete(task.id);
      };

      const onComplete = (result: T) => {
        cleanup();
        resolve(result);
      };

      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };

      // Store handlers with task
      Object.assign(task, { onComplete, onError });

      // Try to process task immediately
      this.processNextTask();
    });
  }

  public cancelTask(taskId: string): void {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    // Attempt to locate the worker currently executing this task
    const workerEntry = Array.from(this.workerPool.entries()).find(([, t]) => t?.id === taskId);
    const worker = workerEntry?.[0];

    // Send cancellation request to the worker so long-running operations can attempt to abort.
    if (worker) {
      worker.postMessage({
        taskId: crypto.randomUUID(), // new message id for the cancel request itself
        type: 'CANCEL_TASK',
        data: { taskId },
      });
    }

    // Also abort the local cancel token for any side-effects in the main thread.
    task.cancelToken?.abort();

    // Mark the task as failed locally with a cancellation error.
    this.failTask(taskId, new Error('Task cancelled'));
  }

  private async processNextTask(): Promise<void> {
    // Find available worker
    const workerEntry = Array.from(this.workerPool.entries()).find(([, task]) => task === null);

    const availableWorker = workerEntry?.[0];

    if (!availableWorker || this.taskQueue.length === 0) return;

    // Get highest priority task
    const task = this.taskQueue.shift()!;
    task.startTime = Date.now();

    // Assign task to worker
    this.activeTasks.set(task.id, task);
    this.workerPool.set(availableWorker, task);

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.active_tasks = this.activeTasks.size;
    this.metadata.metrics = metrics;

    // Send task to worker
    availableWorker.postMessage({
      taskId: task.id,
      type: task.type,
      data: task.data,
    });
  }

  private completeTask(taskId: string, result: unknown): void {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    task.endTime = Date.now();
    task.result = result;

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.completed_tasks = (metrics.completed_tasks ?? 0) + 1;
    metrics.active_tasks = this.activeTasks.size - 1;

    const taskTime = task.endTime - (task.startTime ?? 0);
    metrics.average_task_time = metrics.average_task_time
      ? (metrics.average_task_time + taskTime) / 2
      : taskTime;

    this.metadata.metrics = metrics;

    // Release worker
    const workerEntry = Array.from(this.workerPool.entries()).find(([, t]) => t === task);
    const worker = workerEntry?.[0];
    if (worker) {
      this.workerPool.set(worker, null);
    }

    // Call completion handler
    const typedTask = task as WorkerTask<unknown> & { onComplete?: (result: unknown) => void };
    typedTask.onComplete?.(result);

    // Process next task
    this.processNextTask();
  }

  private failTask(taskId: string, error: Error): void {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.failed_tasks = (metrics.failed_tasks ?? 0) + 1;
    metrics.active_tasks = this.activeTasks.size - 1;
    this.metadata.metrics = metrics;

    // Release worker
    const workerEntry = Array.from(this.workerPool.entries()).find(([, t]) => t === task);
    const worker = workerEntry?.[0];
    if (worker) {
      this.workerPool.set(worker, null);
    }

    // Call error handler
    const typedTask = task as WorkerTask<unknown> & { onError?: (error: Error) => void };
    typedTask.onError?.(error);

    // Process next task
    this.processNextTask();
  }

  public override handleError(error: Error): void {
    errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
      service: 'WorkerService',
    });
  }
}

// Export singleton instance using direct instantiation
export const workerService = new WorkerServiceImpl();

// Export default for easier imports
export default workerService;

import { WorkerMessageType } from '../workers/DataProcessingWorker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from './logging/ErrorLoggingService';

/**
 * Service for interfacing with the DataProcessingWorker
 *
 * This service provides a promise-based API for offloading data processing
 * tasks to a web worker, keeping the UI thread responsive even during
 * computationally intensive operations.
 */
export class DataProcessingService {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (reason: unknown) => void;
    }
  >();
  private isWorkerInitialized = false;
  private workerInitPromise: Promise<void> | null = null;

  /**
   * Initialize the web worker
   */
  private initWorker(): Promise<void> {
    if (this.isWorkerInitialized) {
      return Promise.resolve();
    }

    if (this.workerInitPromise) {
      return this.workerInitPromise;
    }

    this.workerInitPromise = new Promise<void>((resolve, reject) => {
      try {
        // Create worker
        this.worker = new Worker(new URL('../workers/DataProcessingWorker.ts', import.meta.url), {
          type: 'module',
        });

        // Set up message handler
        this.worker.addEventListener('message', this.handleWorkerMessage);

        // Set up error handler
        this.worker.addEventListener('error', error => {
          errorLoggingService.logError(
            error instanceof Error ? error : new Error(`Web worker error: ${error}`),
            ErrorType.RUNTIME,
            ErrorSeverity.HIGH,
            { componentName: 'DataProcessingService', action: 'initWorker' }
          );
          this.pendingRequests.forEach(request => {
            request.reject(new Error('Web worker encountered an error.'));
          });
          this.pendingRequests.clear();
          reject(error);
        });

        this.isWorkerInitialized = true;
        resolve();
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(`Failed to initialize web worker: ${error}`),
          ErrorType.INITIALIZATION,
          ErrorSeverity.CRITICAL,
          { componentName: 'DataProcessingService', action: 'initWorker' }
        );
        reject(error);
      }
    });

    return this.workerInitPromise;
  }

  /**
   * Handle messages received from the web worker
   */
  private handleWorkerMessage = (event: MessageEvent): void => {
    const { id, error, data } = event.data;

    if (this.pendingRequests.has(id)) {
      const { resolve, reject } = this.pendingRequests.get(id)!;

      if (error) {
        // Ensure rejection is always an Error instance
        const errorToSend =
          error instanceof Error ? error : new Error(String(error ?? 'Worker Error'));
        reject(errorToSend);
      } else {
        // Resolves with whatever 'data' the worker sent
        resolve(data);
      }
    } else {
      errorLoggingService.logwarn(`Received response for unknown request ID: ${id}`);
    }
  };

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send a message to the web worker and return a promise
   */
  private sendToWorker<T>(type: WorkerMessageType, payload: unknown): Promise<T> {
    return this.initWorker().then(() => {
      return new Promise<T>((resolve, reject) => {
        const id = this.generateRequestId();

        // Store the promise's resolve and reject functions
        this.pendingRequests.set(id, {
          resolve: value => resolve(value as T),
          reject,
        });

        // Send the message to the worker
        this.worker?.postMessage({ type, id, payload });
      });
    });
  }

  /**
   * Sort data by a key
   */
  public sortData<T extends Record<string, unknown>>(
    data: T[],
    key: string,
    order: 'asc' | 'desc' = 'asc'
  ): Promise<T[]> {
    return this.sendToWorker<T[]>(WorkerMessageType.DATA_SORTING, {
      data,
      key,
      order,
    });
  }

  /**
   * Filter data based on conditions
   */
  public filterData<T extends Record<string, unknown>>(
    data: T[],
    conditions: {
      key: string;
      operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
      value: unknown;
    }[],
    matchAll: boolean = true
  ): Promise<T[]> {
    return this.sendToWorker<T[]>(WorkerMessageType.DATA_FILTERING, {
      data,
      conditions,
      matchAll,
    });
  }

  /**
   * Calculate statistics on numerical data
   */
  public calculateStatistics(
    data: number[],
    operations: ('mean' | 'median' | 'mode' | 'stdDev' | 'variance' | 'min' | 'max' | 'sum')[] = [
      'mean',
      'median',
      'stdDev',
      'min',
      'max',
    ]
  ): Promise<{
    mean?: number;
    median?: number;
    mode?: number[];
    stdDev?: number;
    variance?: number;
    min?: number;
    max?: number;
    sum?: number;
  }> {
    return this.sendToWorker(WorkerMessageType.CALCULATE_STATISTICS, {
      data,
      operations,
    });
  }

  /**
   * Process clustering data
   */
  public processClustering(payload: unknown): Promise<unknown> {
    return this.sendToWorker(WorkerMessageType.PROCESS_CLUSTERING, payload);
  }

  /**
   * Process prediction data
   */
  public processPrediction(payload: unknown): Promise<unknown> {
    return this.sendToWorker(WorkerMessageType.PROCESS_PREDICTION, payload);
  }

  /**
   * Process resource mapping data
   */
  public processResourceMapping(payload: unknown): Promise<unknown> {
    return this.sendToWorker(WorkerMessageType.PROCESS_RESOURCE_MAPPING, payload);
  }

  /**
   * Transform data
   */
  public transformData(payload: unknown): Promise<unknown> {
    return this.sendToWorker(WorkerMessageType.TRANSFORM_DATA, payload);
  }

  /**
   * Terminate the web worker
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isWorkerInitialized = false;
      this.workerInitPromise = null;
    }
  }

  /**
   * Singleton instance
   */
  private static instance: DataProcessingService | null = null;

  /**
   * Get the singleton instance
   */
  public static getInstance(): DataProcessingService {
    if (!DataProcessingService.instance) {
      DataProcessingService.instance = new DataProcessingService();
    }
    return DataProcessingService.instance;
  }
}

/**
 * @context: service-system, error-handling
 * RecoveryService - Provides mechanisms for recovering from critical application failures
 *
 * This service handles:
 * - Saving application state snapshots
 * - Restoring previous application states
 * - Implementing different recovery strategies based on error type
 * - Providing graceful degradation options
 */

import { AbstractBaseService } from '../lib/services/BaseService';
import { ErrorSeverity, ErrorType, errorLoggingService } from './ErrorLoggingService';

// Types of recovery strategies that can be applied
export enum RecoveryStrategy {
  RETRY = 'retry',
  ROLLBACK = 'rollback',
  RESET = 'reset',
  IGNORE = 'ignore',
}

// Structure for application state snapshot
export interface StateSnapshot {
  id: string;
  state: Record<string, unknown>;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Configuration for recovery actions
export interface RecoveryConfig {
  maxSnapshots: number;
  autoSaveInterval: number;
  enableAutoRecover: boolean;
  defaultStrategy: RecoveryStrategy;
  strategyByErrorType: Partial<Record<ErrorType, RecoveryStrategy>>;
}

class RecoveryServiceImpl extends AbstractBaseService<RecoveryServiceImpl> {
  private snapshots: StateSnapshot[] = [];
  private config: RecoveryConfig = {
    maxSnapshots: 100,
    autoSaveInterval: 60000, // Save every 60 seconds
    enableAutoRecover: false,
    defaultStrategy: RecoveryStrategy.RETRY,
    strategyByErrorType: {
      [ErrorType.VALIDATION]: RecoveryStrategy.IGNORE,
      [ErrorType.NETWORK]: RecoveryStrategy.RETRY,
      [ErrorType.RUNTIME]: RecoveryStrategy.RESET,
    },
  };

  public constructor() {
    super('RecoveryService', '1.0.0');
  }

  protected async onInitialize(): Promise<void> {
    // Initialize metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }

    // Load unknown existing snapshots from localStorage
    try {
      const savedSnapshots = localStorage.getItem('recovery_snapshots');
      if (savedSnapshots) {
        this.snapshots = JSON.parse(savedSnapshots);
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  protected async onDispose(): Promise<void> {
    // Save snapshots to localStorage
    try {
      localStorage.setItem('recovery_snapshots', JSON.stringify(this.snapshots));
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  public createSnapshot(
    state: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): string {
    const snapshot: StateSnapshot = {
      id: crypto.randomUUID(),
      state,
      timestamp: Date.now(),
      metadata,
    };

    this.snapshots.unshift(snapshot);

    // Trim snapshots if we exceed max size
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots = this.snapshots.slice(0, this.config.maxSnapshots);
    }

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics.total_snapshots = this.snapshots.length;
    metrics.latest_snapshot_timestamp = snapshot.timestamp;
    this.metadata.metrics = metrics;

    return snapshot.id;
  }

  public restoreSnapshot(snapshotId: string): Record<string, unknown> | null {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      return null;
    }

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics.total_restores = (metrics.total_restores ?? 0) + 1;
    metrics.last_restore_timestamp = Date.now();
    this.metadata.metrics = metrics;

    return snapshot.state;
  }

  public getSnapshots(): StateSnapshot[] {
    return [...this.snapshots];
  }

  public clearSnapshots(): void {
    this.snapshots = [];

    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {};
  }

  public getRecoveryStrategy(
    errorType: ErrorType = ErrorType.UNKNOWN,
    metadata?: Record<string, unknown>
  ): RecoveryStrategy {
    return this.config.strategyByErrorType[errorType] || this.config.defaultStrategy;
  }

  public override handleError(error: Error): void {
    // Update error metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics.total_errors = (metrics.total_errors ?? 0) + 1;
    metrics.last_error_timestamp = Date.now();
    this.metadata.metrics = metrics;

    // Log error using the imported singleton errorLoggingService
    errorLoggingService.logError(
      error,
      ErrorType.RUNTIME, // Defaulting to RUNTIME as this is a general handler
      ErrorSeverity.HIGH, // Defaulting to HIGH as it's a service-level error
      {
        service: 'RecoveryService', // Add service context
        action: 'handleError', // Indicate the action
      }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private logRecoveryAttempt(
    success: boolean,
    error?: Error,
    _metadata?: Record<string, unknown>
  ): void {
    const logEntry = {
      timestamp: Date.now(),
      success: success,
      error: error,
    };

    // Implementation of logRecoveryAttempt method
  }
}

// Export singleton instance using direct instantiation (no constructor args needed)
export const recoveryService = new RecoveryServiceImpl();

// Export default for easier imports
export default recoveryService;

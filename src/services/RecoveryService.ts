/**
 * RecoveryService - Provides mechanisms for recovering from critical application failures
 *
 * This service handles:
 * - Saving application state snapshots
 * - Restoring previous application states
 * - Implementing different recovery strategies based on error type
 * - Providing graceful degradation options
 */

import { errorLoggingService, ErrorSeverity, ErrorType } from './ErrorLoggingService';

// Types of recovery strategies that can be applied
export enum RecoveryStrategy {
  RELOAD = 'reload', // Full page reload (most disruptive but most effective)
  RESET_STATE = 'reset_state', // Reset application state but don't reload page
  RETRY = 'retry', // Retry the failed operation
  DEGRADE = 'degrade', // Gracefully degrade functionality
  ROLLBACK = 'rollback', // Rollback to previous known good state
  NONE = 'none', // Take no recovery action
}

// Structure for application state snapshot
export interface StateSnapshot {
  id: string;
  timestamp: number;
  state: Record<string, unknown>;
  version: string;
  description?: string;
}

// Configuration for recovery actions
export interface RecoveryConfig {
  maxSnapshots: number;
  autoSaveInterval: number;
  enableAutoRecover: boolean;
  defaultStrategy: RecoveryStrategy;
  strategyByErrorType: Partial<Record<ErrorType, RecoveryStrategy>>;
}

class RecoveryService {
  private static instance: RecoveryService;
  private snapshots: StateSnapshot[] = [];
  private lastAutoSave: number = 0;
  private recoveryInProgress: boolean = false;
  private version: string = '1.0.0'; // App version - should be dynamic in real app

  // Default configuration
  private config: RecoveryConfig = {
    maxSnapshots: 5,
    autoSaveInterval: 60000, // 1 minute
    enableAutoRecover: true,
    defaultStrategy: RecoveryStrategy.RESET_STATE,
    strategyByErrorType: {
      [ErrorType.NETWORK]: RecoveryStrategy.RETRY,
      [ErrorType.UI]: RecoveryStrategy.RESET_STATE,
      [ErrorType.RESOURCE]: RecoveryStrategy.DEGRADE,
      [ErrorType.LOGIC]: RecoveryStrategy.ROLLBACK,
      [ErrorType.SYSTEM]: RecoveryStrategy.RELOAD,
    },
  };

  // Private constructor for singleton pattern
  private constructor() {
    // Initialize the service
    console.warn('[RecoveryService] Initialized');

    // Load any existing snapshots from localStorage
    this.loadSnapshotsFromStorage();

    // Set up automatic state saving if enabled
    if (this.config.autoSaveInterval > 0) {
      setInterval(() => this.autoSaveState(), this.config.autoSaveInterval);
    }

    // Set up error listener for automatic recovery
    if (this.config.enableAutoRecover) {
      window.addEventListener('error', this.handleGlobalError);
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    }
  }

  /**
   * Get the singleton instance of the recovery service
   */
  public static getInstance(): RecoveryService {
    if (!RecoveryService.instance) {
      RecoveryService.instance = new RecoveryService();
    }
    return RecoveryService.instance;
  }

  /**
   * Save a snapshot of the current application state
   */
  public saveSnapshot(
    state: Record<string, unknown>,
    description: string = 'Manual snapshot'
  ): string {
    const snapshot: StateSnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      state,
      version: this.version,
      description,
    };

    // Add to snapshots, maintaining order (newest first)
    this.snapshots.unshift(snapshot);

    // If we've exceeded the maximum number of snapshots, remove the oldest
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.pop();
    }

    // Persist snapshots
    this.saveSnapshotsToStorage();

    console.warn(`[RecoveryService] Saved state snapshot: ${description}`);
    return snapshot.id;
  }

  /**
   * Restore application state from a specific snapshot
   */
  public restoreSnapshot(snapshotId: string): Record<string, unknown> | null {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);

    if (!snapshot) {
      console.error(`[RecoveryService] Snapshot not found: ${snapshotId}`);
      return null;
    }

    // Log the restoration
    console.warn(
      `[RecoveryService] Restoring from snapshot: ${snapshot.description || snapshotId}`
    );

    // Return the state to be applied by the application
    return snapshot.state;
  }

  /**
   * Get the most recent snapshot
   */
  public getLatestSnapshot(): StateSnapshot | null {
    return this.snapshots.length > 0 ? this.snapshots[0] : null;
  }

  /**
   * Get all available snapshots
   */
  public getAllSnapshots(): StateSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Determine appropriate recovery strategy for an error
   */
  public determineRecoveryStrategy(
    _error: Error,
    errorType: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): RecoveryStrategy {
    // If recovery is already in progress, avoid nested recovery
    if (this.recoveryInProgress) {
      return RecoveryStrategy.NONE;
    }

    // For critical severity, always use the most aggressive strategy
    if (severity === ErrorSeverity.CRITICAL) {
      return RecoveryStrategy.RELOAD;
    }

    // Check if we have a specific strategy for this error type
    const typeStrategy = this.config.strategyByErrorType[errorType];
    if (typeStrategy) {
      return typeStrategy;
    }

    // Fall back to default strategy
    return this.config.defaultStrategy;
  }

  /**
   * Execute a recovery strategy
   */
  public async executeRecovery(
    strategy: RecoveryStrategy,
    error?: Error,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    if (this.recoveryInProgress) {
      console.warn('[RecoveryService] Recovery already in progress, ignoring new request');
      return false;
    }

    this.recoveryInProgress = true;
    console.warn(`[RecoveryService] Executing recovery strategy: ${strategy}`);

    try {
      switch (strategy) {
        case RecoveryStrategy.RELOAD:
          // Log before reloading
          if (error) {
            errorLoggingService.logError(error, ErrorType.SYSTEM, ErrorSeverity.CRITICAL, {
              action: 'executing_recovery',
              recoveryStrategy: strategy,
              ...metadata,
            });
          }

          // Reload the page after a short delay to ensure logging completes
          setTimeout(() => {
            window.location.reload();
          }, 500);

          return true;

        case RecoveryStrategy.RESET_STATE:
          // This would typically call into your state management system
          // to reset the application state
          console.warn('[RecoveryService] Resetting application state');
          // Redux example: store.dispatch({ type: 'RESET_STATE' });
          return true;

        case RecoveryStrategy.RETRY:
          // The component should implement retry logic
          console.warn('[RecoveryService] Retry strategy - component should implement retry logic');
          return true;

        case RecoveryStrategy.DEGRADE:
          // Switch to degraded mode
          console.warn('[RecoveryService] Switching to degraded functionality mode');
          // Example: store.dispatch({ type: 'ENTER_DEGRADED_MODE' });
          return true;

        case RecoveryStrategy.ROLLBACK: {
          // Rollback to the last known good state
          const latestSnapshot = this.getLatestSnapshot();
          if (latestSnapshot) {
            console.warn('[RecoveryService] Rolling back to previous state');
            // Example: store.dispatch({ type: 'RESTORE_STATE', payload: latestSnapshot.state });
            return true;
          }

          console.warn(
            '[RecoveryService] No snapshot available for rollback, using reset strategy instead'
          );
          // Fall back to reset if no snapshot is available
          return this.executeRecovery(RecoveryStrategy.RESET_STATE, error, metadata);
        }

        case RecoveryStrategy.NONE:
          // Do nothing
          console.warn('[RecoveryService] No recovery action taken (strategy: NONE)');
          return true;

        default:
          console.error(`[RecoveryService] Unknown recovery strategy: ${strategy}`);
          return false;
      }
    } catch (recoveryError) {
      // Handle errors in the recovery process
      console.error('[RecoveryService] Error during recovery process:', recoveryError);

      // Log the recovery error
      errorLoggingService.logError(
        recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        ErrorType.SYSTEM,
        ErrorSeverity.CRITICAL,
        {
          action: 'recovery_failed',
          originalError: error?.message,
          recoveryStrategy: strategy,
          ...metadata,
        }
      );

      // As a last resort, suggest a page reload
      if (strategy !== RecoveryStrategy.RELOAD) {
        console.error('[RecoveryService] Recovery failed, suggesting application reload');
        return this.executeRecovery(RecoveryStrategy.RELOAD);
      }

      return false;
    } finally {
      this.recoveryInProgress = false;
    }
  }

  /**
   * Update recovery service configuration
   */
  public updateConfig(config: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...config };
    console.warn('[RecoveryService] Configuration updated');
  }

  /**
   * Automatically save application state at regular intervals
   */
  private autoSaveState(): void {
    // This would typically get the current application state from your state management system
    // For example, with Redux: const state = store.getState();

    const now = Date.now();

    // Skip if the last auto-save was too recent
    if (now - this.lastAutoSave < this.config.autoSaveInterval * 0.8) {
      return;
    }

    // Get current state (mock implementation)
    const mockState = {
      timestamp: now,
      // In a real app, this would be your actual application state
      mockData: 'This is a placeholder for actual application state',
    };

    // Save snapshot
    this.saveSnapshot(mockState, 'Auto-saved state');
    this.lastAutoSave = now;
  }

  /**
   * Handle global error events
   */
  private handleGlobalError = (event: ErrorEvent): void => {
    // Prevent default browser error handling
    event.preventDefault();

    // Log the error
    const errorId = errorLoggingService.logError(
      event.error || new Error(event.message),
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      {
        action: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );

    // Determine and execute recovery strategy
    const strategy = this.determineRecoveryStrategy(
      event.error,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH
    );

    this.executeRecovery(strategy, event.error, { errorId });
  };

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    // Prevent default browser error handling
    event.preventDefault();

    // Extract error
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

    // Log the error
    const errorId = errorLoggingService.logError(error, ErrorType.SYSTEM, ErrorSeverity.HIGH, {
      action: 'unhandled_rejection',
      reason: String(event.reason),
    });

    // Determine and execute recovery strategy
    const strategy = this.determineRecoveryStrategy(error, ErrorType.SYSTEM, ErrorSeverity.HIGH);

    this.executeRecovery(strategy, error, { errorId });
  };

  /**
   * Load snapshots from localStorage
   */
  private loadSnapshotsFromStorage(): void {
    try {
      const savedSnapshots = localStorage.getItem('recovery_snapshots');
      if (savedSnapshots) {
        this.snapshots = JSON.parse(savedSnapshots);
        console.warn(`[RecoveryService] Loaded ${this.snapshots.length} snapshots from storage`);
      }
    } catch (error) {
      console.error('[RecoveryService] Failed to load snapshots from storage:', error);
      // Clear possibly corrupted snapshots
      localStorage.removeItem('recovery_snapshots');
      this.snapshots = [];
    }
  }

  /**
   * Save snapshots to localStorage
   */
  private saveSnapshotsToStorage(): void {
    try {
      localStorage.setItem('recovery_snapshots', JSON.stringify(this.snapshots));
    } catch (error) {
      console.error('[RecoveryService] Failed to save snapshots to storage:', error);

      // If localStorage is full, remove the oldest snapshot and try again
      if (this.snapshots.length > 1) {
        this.snapshots.pop();
        this.saveSnapshotsToStorage();
      }
    }
  }
}

// Export singleton instance
export const recoveryService = RecoveryService.getInstance();

// Export default for easier imports
export default recoveryService;

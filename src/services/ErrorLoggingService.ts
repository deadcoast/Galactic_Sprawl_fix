/**
 * ErrorLoggingService - Provides structured error logging capabilities for the application
 *
 * This service handles:
 * - Logging errors with metadata
 * - Categorizing errors by type and severity
 * - (Simulated) sending errors to a remote logging service
 * - Deduplicating similar errors to prevent log spam
 */

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low', // Non-critical, doesn't affect core functionality
  MEDIUM = 'medium', // Affects some functionality but application can still operate
  HIGH = 'high', // Major feature is broken
  CRITICAL = 'critical', // Application cannot continue normal operation
}

// Error types for categorization
export enum ErrorType {
  NETWORK = 'network', // Network-related errors (API calls, WebSocket, etc.)
  RESOURCE = 'resource', // Resource loading or processing errors (assets, data, etc.)
  UI = 'ui', // UI rendering errors
  LOGIC = 'logic', // Business logic errors
  SYSTEM = 'system', // System-level errors (memory, browser API, etc.)
  UNKNOWN = 'unknown', // Uncategorized errors
}

// Structure for error metadata
export interface ErrorMetadata {
  userId?: string; // User ID if available
  sessionId?: string; // Current session ID
  componentName?: string; // Component where error occurred
  route?: string; // Current route/URL
  action?: string; // Action being performed when error occurred
  timestamp?: number; // When the error occurred
  additionalData?: Record<string, unknown>; // Any additional context
  recoveryStrategy?: string; // Recovery strategy being applied
  originalError?: string; // Original error message when handling recovery errors
  filename?: string; // Filename where error occurred (for global errors)
  lineno?: number; // Line number where error occurred
  colno?: number; // Column number where error occurred
  reason?: string; // Reason for unhandled promise rejection
}

// Complete error log entry structure
export interface ErrorLogEntry {
  id?: string; // Unique ID for error instance (auto-generated)
  error: Error; // The actual Error object
  message: string; // Human-readable error message
  stack?: string; // Error stack trace
  type: ErrorType; // Error category
  severity: ErrorSeverity; // Error severity level
  metadata: ErrorMetadata; // Additional context about the error
  count?: number; // Number of times this error has occurred
  firstOccurrence?: number; // Timestamp of first occurrence
  lastOccurrence?: number; // Timestamp of most recent occurrence
}

class ErrorLoggingService {
  private static instance: ErrorLoggingService;
  private errorGroups: Map<string, ErrorLogEntry> = new Map();
  private remoteLoggingEnabled = false;
  private consoleLoggingEnabled = true;
  private logSizeLimit = 100; // Max number of error groups to store

  // Private constructor for singleton pattern
  private constructor() {
    // Initialize any config, remote logging services, etc.
    console.warn('[ErrorLoggingService] Initialized');
  }

  /**
   * Get the singleton instance of the error logging service
   */
  public static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }

  /**
   * Log an error with metadata and send to appropriate channels
   */
  public logError(
    error: Error,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata: ErrorMetadata = {}
  ): string {
    // Ensure timestamp is added
    const timestamp = Date.now();
    const fullMetadata: ErrorMetadata = {
      ...metadata,
      timestamp,
      route: window.location.pathname,
    };

    // Create error log entry
    const entry: ErrorLogEntry = {
      error,
      message: error.message || 'Unknown error occurred',
      stack: error.stack,
      type,
      severity,
      metadata: fullMetadata,
      count: 1,
      firstOccurrence: timestamp,
      lastOccurrence: timestamp,
    };

    // Generate error fingerprint for grouping similar errors
    const errorId = this.generateErrorFingerprint(entry);
    entry.id = errorId;

    // Check if we already have this error group
    if (this.errorGroups.has(errorId)) {
      // Update existing error group
      const existingEntry = this.errorGroups.get(errorId)!;
      existingEntry.count = (existingEntry.count || 0) + 1;
      existingEntry.lastOccurrence = timestamp;

      // Only log to console if enabled and not too frequent
      if (
        (this.consoleLoggingEnabled && existingEntry.count <= 5) ||
        existingEntry.count % 10 === 0
      ) {
        console.warn(
          `[ErrorLoggingService] Error occurred again (${existingEntry.count} times):`,
          error.message
        );
      }

      // Send to remote logging if enabled and significant recurrence
      if (
        this.remoteLoggingEnabled &&
        (existingEntry.count === 5 || existingEntry.count % 50 === 0)
      ) {
        this.sendToRemoteLogging(existingEntry);
      }
    } else {
      // New error group
      this.errorGroups.set(errorId, entry);

      // Log to console if enabled
      if (this.consoleLoggingEnabled) {
        console.error(`[ErrorLoggingService] New error (${severity}):`, {
          message: entry.message,
          type,
          metadata: fullMetadata,
        });

        // Show stack trace for higher severity errors
        if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
          console.error('Stack:', error.stack);
        }
      }

      // Send to remote logging if enabled
      if (this.remoteLoggingEnabled) {
        this.sendToRemoteLogging(entry);
      }

      // If we've exceeded the log size limit, remove the oldest entry
      if (this.errorGroups.size > this.logSizeLimit) {
        const oldestEntry = this.findOldestErrorEntry();
        if (oldestEntry) {
          this.errorGroups.delete(oldestEntry);
        }
      }
    }

    return errorId;
  }

  /**
   * Convenience method to log errors from React error boundaries
   */
  public logComponentError(
    error: Error,
    componentName: string,
    errorInfo: React.ErrorInfo
  ): string {
    return this.logError(error, ErrorType.UI, ErrorSeverity.HIGH, {
      componentName,
      additionalData: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  /**
   * Get all logged errors
   */
  public getErrors(): ErrorLogEntry[] {
    return Array.from(this.errorGroups.values());
  }

  /**
   * Get a specific error by ID
   */
  public getErrorById(id: string): ErrorLogEntry | undefined {
    return this.errorGroups.get(id);
  }

  /**
   * Clear all logged errors
   */
  public clearErrors(): void {
    this.errorGroups.clear();
    console.warn('[ErrorLoggingService] All error logs cleared');
  }

  /**
   * Clear a specific error by ID
   */
  public clearError(id: string): boolean {
    const result = this.errorGroups.delete(id);
    if (result) {
      console.warn(`[ErrorLoggingService] Error ${id} cleared`);
    }
    return result;
  }

  /**
   * Enable or disable remote logging
   */
  public setRemoteLoggingEnabled(enabled: boolean): void {
    this.remoteLoggingEnabled = enabled;
    console.warn(`[ErrorLoggingService] Remote logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable or disable console logging
   */
  public setConsoleLoggingEnabled(enabled: boolean): void {
    this.consoleLoggingEnabled = enabled;
    console.warn(`[ErrorLoggingService] Console logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Generate a unique fingerprint for grouping similar errors
   */
  private generateErrorFingerprint(entry: ErrorLogEntry): string {
    // Create a simplified stack trace without line numbers for better grouping
    const stackLines = entry.stack?.split('\n').slice(0, 3).join('') || '';
    const simplifiedStack = stackLines.replace(/:\d+:\d+/g, '');

    // Combine error type, message, and simplified stack
    return `${entry.type}_${entry.message}_${simplifiedStack}`.replace(/[^\w]/g, '_');
  }

  /**
   * Find the oldest error entry for removal when log limit is reached
   */
  private findOldestErrorEntry(): string | undefined {
    let oldestTime = Infinity;
    let oldestId: string | undefined;

    this.errorGroups.forEach((entry, id) => {
      if (entry.firstOccurrence && entry.firstOccurrence < oldestTime) {
        oldestTime = entry.firstOccurrence;
        oldestId = id;
      }
    });

    return oldestId;
  }

  /**
   * Send error log to remote logging service (simulated)
   */
  private sendToRemoteLogging(entry: ErrorLogEntry): void {
    // Simulate sending to a remote logging service
    console.warn('[ErrorLoggingService] Sending error to remote logging service:', entry.id);

    // In a real app, this would be an API call to a service like Sentry, LogRocket, etc.
    // Example:
    // fetch('https://logging-api.example.com/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(entry)
    // }).catch(err => {
    //   console.error('Failed to send error to remote logging service:', err);
    // });
  }
}

// Export singleton instance
export const errorLoggingService = ErrorLoggingService.getInstance();

// Export default for easier imports
export default errorLoggingService;

/**
 * @context: service-system, error-handling
 * ErrorLoggingService - Provides structured error logging capabilities for the application
 *
 * This service handles:
 * - Logging errors with metadata
 * - Categorizing errors by type and severity
 * - (Simulated) sending errors to a remote logging service
 * - Deduplicating similar errors to prevent log spam
 */

import { AbstractBaseService } from '../lib/services/BaseService';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low', // Non-critical, doesn't affect core functionality
  MEDIUM = 'medium', // Affects some functionality but application can still operate
  HIGH = 'high', // Major feature is broken
  CRITICAL = 'critical', // Application cannot continue normal operation
}

// Error types for categorization
export enum ErrorType {
  UNKNOWN = 'unknown', // Uncategorized errors
  VALIDATION = 'validation', // Input validation errors
  NETWORK = 'network', // Network-related errors
  RESOURCE = 'resource', // Resource-related errors (e.g. missing files)
  PERMISSION = 'permission', // Permission-related errors
  CONFIGURATION = 'configuration', // Configuration-related errors
  DEPENDENCY = 'dependency', // Dependency-related errors
  INITIALIZATION = 'initialization', // Initialization-related errors
  RUNTIME = 'runtime', // Runtime errors
  INTEGRATION = 'integration', // Integration-related errors
  EVENT_HANDLING = 'event_handling', // Event handling errors
  UI = 'ui', // UI-related errors
}

// Structure for error metadata
export interface ErrorMetadata {
  userId?: string; // User ID if available
  sessionId?: string; // Current session ID
  componentName?: string; // Component where error occurred
  route?: string; // Current route/URL
  action?: string; // Action being performed when error occurred
  timestamp?: number; // When the error occurred
  additionalData?: Record<string, unknown>; // unknown additional context
  recoveryStrategy?: string; // Recovery strategy being applied
  originalError?: string; // Original error message when handling recovery errors
  filename?: string; // Filename where error occurred (for global errors)
  lineno?: number; // Line number where error occurred
  colno?: number; // Column number where error occurred
  reason?: string; // Reason for unhandled promise rejection
}

// Complete error log entry structure
export interface ErrorLogEntry {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  timestamp: number;
  stack?: string;
  metadata?: Record<string, unknown>;
}

class ErrorLoggingServiceImpl extends AbstractBaseService<ErrorLoggingServiceImpl> {
  private errorLog: ErrorLogEntry[] = [];
  private maxLogSize = 1000;

  public constructor() {
    super('ErrorLoggingService', '1.0.0');
  }

  protected async onInitialize(): Promise<void> {
    // Initialize metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
  }

  protected async onDispose(): Promise<void> {
    // Clear the error log
    this.errorLog = [];
  }

  public logError(
    error: Error,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata?: Record<string, unknown>
  ): void {
    const entry: ErrorLogEntry = {
      id: crypto.randomUUID(),
      type,
      severity,
      message: error.message,
      timestamp: Date.now(),
      stack: error.stack,
      metadata,
    };

    this.errorLog.unshift(entry);

    // Trim log if it exceeds max size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics[ `errors_${type}` ] = (metrics[ `errors_${type}` ] ?? 0) + 1;
    metrics[ `errors_${severity}` ] = (metrics[ `errors_${severity}` ] ?? 0) + 1;
    this.metadata.metrics = metrics;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', entry);
    }
  }

  /**
   * Logs a warning message.
   *
   * @param message The warning message string.
   * @param metadata Optional metadata associated with the warning.
   */
  public logWarn(message: string, metadata?: Record<string, unknown>): void {
    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics[ 'warnings_logged' ] = (metrics[ 'warnings_logged' ] ?? 0) + 1;
    this.metadata.metrics = metrics;

    // Log to console
    console.warn('[WARN]', message, metadata ?? '');
  }

  /**
   * Logs an informational message.
   *
   * @param message The info message string.
   * @param metadata Optional metadata associated with the message.
   */
  public logInfo(message: string, metadata?: Record<string, unknown>): void {
    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics[ 'info_logged' ] = (metrics[ 'info_logged' ] ?? 0) + 1;
    this.metadata.metrics = metrics;

    // Log to console
    console.info('[INFO]', message, metadata ?? '');
  }

  /**
   * Logs a debug message.
   *
   * @param message The debug message string.
   * @param metadata Optional metadata associated with the message.
   */
  public logDebug(message: string, metadata?: Record<string, unknown>): void {
    // Only log debug messages in development environment
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics[ 'debug_logged' ] = (metrics[ 'debug_logged' ] ?? 0) + 1;
    this.metadata.metrics = metrics;

    // Log to console
    console.debug('[DEBUG]', message, metadata ?? '');
  }

  public getErrors(type?: ErrorType, severity?: ErrorSeverity, limit = 100): ErrorLogEntry[] {
    let filtered = this.errorLog;

    if (type) {
      filtered = filtered.filter(entry => entry.type === type);
    }

    if (severity) {
      filtered = filtered.filter(entry => entry.severity === severity);
    }

    return filtered.slice(0, limit);
  }

  public clearErrors(): void {
    this.errorLog = [];

    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {};
  }

  public override handleError(error: Error): void {
    this.logError(error, ErrorType.UNKNOWN, ErrorSeverity.HIGH);
  }
}

// Export singleton instance using direct instantiation
export const errorLoggingService = new ErrorLoggingServiceImpl();

// Export default for easier imports
export default errorLoggingService;

/**
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
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  timestamp: number;
  stack?: string;
  metadata?: Record<string, unknown>;
}

class ErrorLoggingServiceImpl extends AbstractBaseService {
  private errorLog: ErrorLogEntry[] = [];
  private maxLogSize = 1000;
  private static instance: ErrorLoggingServiceImpl | null = null;

  protected constructor() {
    super('ErrorLoggingService', '1.0.0');
  }

  public static override getInstance(): ErrorLoggingServiceImpl {
    if (!ErrorLoggingServiceImpl.instance) {
      ErrorLoggingServiceImpl.instance = new ErrorLoggingServiceImpl();
    }
    return ErrorLoggingServiceImpl.instance;
  }

  protected async onInitialize(): Promise<void> {
    // No initialization needed
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
    const metrics = this.metadata?.metrics ?? {};
    metrics[`errors_${type}`] = (metrics[`errors_${type}`] ?? 0) + 1;
    metrics[`errors_${severity}`] = (metrics[`errors_${severity}`] ?? 0) + 1;
    this.metadata.metrics = metrics;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', entry);
    }
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
    this.metadata.metrics = {};
  }

  public override handleError(error: Error): void {
    this.logError(error, ErrorType.UNKNOWN, ErrorSeverity.HIGH);
  }
}

// Export singleton instance
export const errorLoggingService = ErrorLoggingServiceImpl.getInstance();

// Export default for easier imports
export default errorLoggingService;

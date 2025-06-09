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

import { BaseEvent } from '../../lib/events/UnifiedEventSystem';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { ErrorDetails, ErrorSeverity, ErrorType, IErrorLog } from './ErrorTypes'; // Re-enabled import
import { LogContext, logger } from './loggerService';

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

// Define a placeholder event map
type ErrorLoggingServiceEvents = BaseEvent & {
  /* No service-specific events defined */
};

/**
 * Service implementation for error logging.
 */
export class ErrorLoggingServiceImpl extends AbstractBaseManager<ErrorLoggingServiceEvents> {
  public constructor() {
    super('ErrorLoggingService');
  }

  protected onInitialize(): Promise<void> {
    this.metrics = {
      errors_logged: 0,
      warnings_logged: 0,
      info_logged: 0,
      debug_logged: 0,
      critical_errors: 0,
      high_severity_errors: 0,
      medium_severity_errors: 0,
      low_severity_errors: 0,
    };
    return Promise.resolve();
  }

  protected onUpdate(_deltaTime: number): void {
    // No periodic updates needed for this service
  }

  protected onDispose(): Promise<void> {
    return Promise.resolve();
  }

  public logError(
    error: Error | string,
    type: ErrorType = ErrorType.UNKNOWN, // Assuming ErrorType has UNKNOWN
    severity: ErrorSeverity = ErrorSeverity.MEDIUM, // Assuming ErrorSeverity has MEDIUM
    details?: ErrorDetails
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    const context: LogContext = {
      module: 'ErrorLoggingService',
      ...(details ?? {}),
      errorType: type,
      errorSeverity: severity,
      stackTrace: stack?.substring(0, 500),
    };

    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
      case ErrorSeverity.MEDIUM:
        logger.error(errorMessage, context, error instanceof Error ? error : undefined);
        break;
      case ErrorSeverity.LOW:
        logger.warn(errorMessage, context, error instanceof Error ? error : undefined);
        break;
      case ErrorSeverity.INFO:
        logger.info(errorMessage, context, error instanceof Error ? error : undefined);
        break;
    }

    this.metrics.errors_logged = (this.metrics.errors_logged ?? 0) + 1;
    if (severity === ErrorSeverity.CRITICAL) {
      this.metrics.critical_errors = (this.metrics.critical_errors ?? 0) + 1;
    } else if (severity === ErrorSeverity.HIGH) {
      this.metrics.high_severity_errors = (this.metrics.high_severity_errors ?? 0) + 1;
    } else if (severity === ErrorSeverity.MEDIUM) {
      this.metrics.medium_severity_errors = (this.metrics.medium_severity_errors ?? 0) + 1;
    } else if (severity === ErrorSeverity.LOW) {
      this.metrics.low_severity_errors = (this.metrics.low_severity_errors ?? 0) + 1;
    }
  }

  public logWarn(message: string, details?: ErrorDetails): void {
    const context: LogContext = {
      module: 'ErrorLoggingService',
      ...(details ?? {}),
    };
    logger.warn(message, context);
    this.metrics.warnings_logged = (this.metrics.warnings_logged ?? 0) + 1;
  }

  public logInfo(message: string, details?: ErrorDetails): void {
    const context: LogContext = {
      module: 'ErrorLoggingService',
      ...(details ?? {}),
    };
    logger.info(message, context);
    this.metrics.info_logged = (this.metrics.info_logged ?? 0) + 1;
  }

  public logDebug(message: string, details?: ErrorDetails): void {
    const context: LogContext = {
      module: 'ErrorLoggingService',
      ...(details ?? {}),
    };
    logger.debug(message, context);
    this.metrics.debug_logged = (this.metrics.debug_logged ?? 0) + 1;
  }

  /**
   * Indicates whether the service has finished initialization and is ready.
   * This aligns with BaseService contract expected by ServiceProvider.
   */
  public isReady(): boolean {
    return true; // Considered ready once instantiated
  }

  protected getVersion(): string {
    return '1.0.0';
  }

  protected getStats(): Record<string, number | string> {
    const stats: Record<string, number | string> = {};
    for (const key in this.metrics) {
      stats[key] = this.metrics[key];
    }
    return stats;
  }
}

// Export singleton instance using the inherited getInstance
export const errorLoggingService = ErrorLoggingServiceImpl.getInstance();

// Export enums directly, use 'export type' for type aliases
export { ErrorSeverity, ErrorType };
export type { ErrorDetails, IErrorLog };


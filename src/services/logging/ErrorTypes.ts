// Define standard error types used across the application

/**
 * Categorizes the area or type of error that occurred.
 */
export enum ErrorType {
  UNKNOWN = 'unknown',
  INITIALIZATION = 'initialization',
  CONFIGURATION = 'configuration',
  VALIDATION = 'validation',
  NETWORK = 'network',
  API_LIMIT = 'api_limit',
  TIMEOUT = 'timeout',
  STATE_CORRUPTION = 'state_corruption',
  RENDERING = 'rendering',
  PERFORMANCE = 'performance',
  USER_INPUT = 'user_input',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  FILE_SYSTEM = 'file_system',
  EXTERNAL_SERVICE = 'external_service',
  DATA_FETCH = 'data_fetch',
  RUNTIME = 'runtime',
  EVENT_HANDLING = 'event_handling',
  // Add more specific types as needed
}

/**
 * Defines the severity level of an error.
 */
export enum ErrorSeverity {
  CRITICAL = 'critical', // System stability compromised, immediate action required
  HIGH = 'high',         // Significant impact on functionality, user experience affected
  MEDIUM = 'medium',     // Moderate impact, workaround might exist
  LOW = 'low',           // Minor issue, minimal user impact
  INFO = 'info',         // Informational message, not necessarily an error but notable
  DEBUG = 'debug',       // For detailed debugging, usually disabled in production
}

/**
 * Represents additional details or context associated with an error.
 * Typically a flexible key-value store.
 */
export type ErrorDetails = Record<string, unknown>;

/**
 * Interface for a structured error log entry (if needed specifically).
 * Note: ErrorLoggingService uses ErrorLogEntry directly, this might be redundant.
 */
export interface IErrorLog {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  timestamp: number;
  stack?: string;
  details?: ErrorDetails;
}

// Ensures this file is treated as a module by TypeScript
export { };

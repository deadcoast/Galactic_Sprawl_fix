/**
 * Centralized logging service with structured error levels
 *
 * This service provides a consistent logging interface across the application
 * with support for different log levels and context information.
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  TRACE = 'TRACE',
}

export interface LogContext {
  module?: string;
  component?: string;
  [key: string]: unknown;
}

export interface LoggerOptions {
  minLevel: LogLevel;
  includeTimestamp: boolean;
  enableContextDisplay: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_OPTIONS: LoggerOptions = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  includeTimestamp: true,
  enableContextDisplay: true,
};

/**
 * Centralized logger service with structured error levels
 */
class LoggerService {
  private options: LoggerOptions;

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const parts: string[] = [];

    if (this.options.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(`[${level}]`);

    if (context?.module) {
      parts.push(`[${context.module}]`);
    }

    if (context?.component) {
      parts.push(`[${context.component}]`);
    }

    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Check if the log level should be displayed
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const configLevelIndex = levels.indexOf(this.options.minLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex <= configLevelIndex;
  }

  /**
   * Log an error message
   */
  error(message: string, context?: LogContext, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const formattedMessage = this.formatMessage(LogLevel.ERROR, message, context);
    console.error(formattedMessage, ...args);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const formattedMessage = this.formatMessage(LogLevel.WARN, message, context);
    console.warn(formattedMessage, ...args);
  }

  /**
   * Log an informational message
   */
  info(message: string, context?: LogContext, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, context);
    console.info(formattedMessage, ...args);
  }

  /**
   * Log a debug message (only in non-production)
   */
  debug(message: string, context?: LogContext, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, context);
    console.debug(formattedMessage, ...args);
  }

  /**
   * Log a trace message (lowest level, most verbose)
   */
  trace(message: string, context?: LogContext, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.TRACE)) return;
    const formattedMessage = this.formatMessage(LogLevel.TRACE, message, context);
    console.trace(formattedMessage, ...args);
  }
}

// Create and export a singleton instance for application-wide use
export const logger = new LoggerService();

// Also export the class for cases where custom configurations are needed
export default LoggerService;

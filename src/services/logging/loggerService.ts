/**
 * Centralized logging service with structured error levels and pluggable transports.
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', // Changed from combatN
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

export interface LogContext {
  module?: string;
  component?: string;
  [key: string]: unknown;
}

// --- Transport System ---

/**
 * Interface for log transports (e.g., Console, File, Remote API).
 */
export interface ILogTransport {
  log(level: LogLevel, message: string, context?: LogContext, ...args: unknown[]): void;
  close?(): void; // Optional method for cleanup
}

/**
 * Console transport implementation.
 */
export class ConsoleTransport implements ILogTransport {
  log(level: LogLevel, message: string, context?: LogContext, ...args: unknown[]): void {
    const formattedMessage = this.formatMessage(level, message, context);
    switch (level) {
      case LogLevel.ERROR:
        // eslint-disable-next-line no-console
        console.error(formattedMessage, ...args);
        break;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(formattedMessage, ...args);
        break;
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.info(formattedMessage, ...args);
        break;
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        console.debug(formattedMessage, ...args);
        break;
      case LogLevel.TRACE:
        // eslint-disable-next-line no-console
        console.trace(formattedMessage, ...args);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(formattedMessage, ...args); // Fallback
    }
  }

  // Keep formatting logic within the transport that uses it
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const parts: string[] = [];
    parts.push(`[${new Date().toISOString()}]`);
    parts.push(`[${level.toUpperCase()}]`);

    if (context?.module) {
      parts.push(`[${context.module}]`);
    }
    if (context?.component) {
      parts.push(`[${context.component}]`);
    }
    parts.push(message);
    return parts.join(' ');
  }
}

// --- Logger Service ---

export interface LoggerOptions {
  minLevel: LogLevel;
  // Timestamp/context options removed, handled by transports
}

const DEFAULT_OPTIONS: LoggerOptions = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
};

/**
 * Centralized logger service using transports.
 */
class LoggerService {
  private options: LoggerOptions;
  private transports: ILogTransport[];

  constructor(transports: ILogTransport[], options: Partial<LoggerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.transports = transports && transports.length > 0 ? transports : [new ConsoleTransport()]; // Default to console if none provided
  }

  // Removed formatMessage - handled by transports

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = [
      LogLevel.TRACE,
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
    ];
    const configLevelIndex = levels.indexOf(this.options.minLevel);
    const messageLevelIndex = levels.indexOf(level);
    // Ensure comparison is valid even if level not found (treat as most verbose)
    return messageLevelIndex >= 0 && messageLevelIndex >= configLevelIndex;
  }

  private log(level: LogLevel, message: string, context?: LogContext, ...args: unknown[]): void {
    if (!this.shouldLog(level)) {
      return;
    }
    this.transports.forEach(transport => {
      try {
        transport.log(level, message, context, ...args);
      } catch (e) {
        // Log transport errors directly to console is acceptable here
        // eslint-disable-next-line no-console
        console.error('Error in logger transport:', e);
      }
    });
  }

  error(message: string, context?: LogContext, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, context, ...args);
  }

  warn(message: string, context?: LogContext, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, context, ...args);
  }

  info(message: string, context?: LogContext, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, context, ...args);
  }

  debug(message: string, context?: LogContext, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, context, ...args);
  }

  trace(message: string, context?: LogContext, ...args: unknown[]): void {
    this.log(LogLevel.TRACE, message, context, ...args);
  }

  public closeTransports(): void {
    this.transports.forEach(transport => {
      if (transport.close) {
        try {
          transport.close();
        } catch (e) {
          // Log transport closing errors directly to console
          // eslint-disable-next-line no-console
          console.error('Error closing logger transport:', e);
        }
      }
    });
  }
}

// Create and export a singleton instance with ConsoleTransport by default
export const logger = new LoggerService([new ConsoleTransport()]);

// Also export the class for custom configurations
export { LoggerService };
export default LoggerService;

import { Singleton } from '../patterns/Singleton';
import { ErrorType } from '../../services/ErrorLoggingService';

/**
 * Interface for service metadata
 */
export interface ServiceMetadata {
  name: string;
  version: string;
  status: 'initializing' | 'ready' | 'error' | 'disposed';
  lastError?: {
    type: ErrorType;
    message: string;
    timestamp: number;
  };
  metrics?: Record<string, number>;
}

/**
 * Base interface that all services should implement
 */
export interface BaseService {
  /**
   * Initialize the service with optional dependencies
   */
  initialize(dependencies?: Record<string, unknown>): Promise<void>;

  /**
   * Dispose of any resources used by the service
   */
  dispose(): Promise<void>;

  /**
   * Get metadata about the service's current state
   */
  getMetadata(): ServiceMetadata;

  /**
   * Check if the service is ready to handle requests
   */
  isReady(): boolean;

  /**
   * Handle errors that occur within the service
   */
  handleError(error: Error, context?: Record<string, unknown>): void;
}

/**
 * Abstract base class that provides common service functionality
 * Extends the Singleton pattern to ensure only one instance exists
 */
export abstract class AbstractBaseService extends Singleton<AbstractBaseService> implements BaseService {
  protected metadata: ServiceMetadata;

  protected constructor(name: string, version: string) {
    super();
    this.metadata = {
      name,
      version,
      status: 'initializing',
    };
  }

  async initialize(dependencies?: Record<string, unknown>): Promise<void> {
    try {
      await this.onInitialize(dependencies);
      this.metadata.status = 'ready';
    } catch (error) {
      this.metadata.status = 'error';
      this.handleError(error as Error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    try {
      await this.onDispose();
      this.metadata.status = 'disposed';
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  getMetadata(): ServiceMetadata {
    return { ...this.metadata };
  }

  isReady(): boolean {
    return this.metadata.status === 'ready';
  }

  handleError(error: Error, context?: Record<string, unknown>): void {
    this.metadata.lastError = {
      type: ErrorType.UNKNOWN,
      message: error.message,
      timestamp: Date.now(),
    };
    // Subclasses should override this to provide custom error handling
  }

  protected abstract onInitialize(dependencies?: Record<string, unknown>): Promise<void>;
  protected abstract onDispose(): Promise<void>;
}
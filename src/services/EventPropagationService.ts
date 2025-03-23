import { AbstractBaseService } from '../lib/services/BaseService';
import { componentRegistryService } from './ComponentRegistryService';
import { ErrorType, errorLoggingService } from './ErrorLoggingService';

export interface EventSubscription {
  eventType: string;
  priority: number;
  callback: (eventData: unknown) => void;
}

/**
 * @context: service-system, event-system
 * Service for managing event propagation and subscription throughout the application
 */
class EventPropagationServiceImpl extends AbstractBaseService<EventPropagationServiceImpl> {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventQueue: Array<{ type: string; data: unknown }> = [];
  private isProcessing = false;
  private customErrorHandler?: (error: Error, context?: Record<string, unknown>) => void;

  public constructor() {
    super('EventPropagationService', '1.0.0');
  }

  protected async onInitialize(dependencies?: Record<string, unknown>): Promise<void> {
    // Initialize metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {
      total_subscriptions: 0,
      total_event_types: 0,
      total_events_emitted: 0,
      total_events_processed: 0,
      total_errors: 0,
    };
    
    // Check if we have access to the component registry service
    if (dependencies && 'componentRegistry' in dependencies) {
      const componentRegistry = dependencies.componentRegistry as typeof componentRegistryService;
      
      // Notify registry that this service is available (using existing method rather than non-existent registerService)
      if (componentRegistry) {
        // Register the service availability as an event
        componentRegistry.notifyComponentsOfEvent('SERVICE_INITIALIZED', {
          serviceId: 'eventPropagation',
          serviceName: 'EventPropagationService',
          timestamp: Date.now(),
        });
        console.warn('[EventPropagationService] Notified component registry of initialization');
      }
    } else {
      // Log that we're initializing without component registry
      console.warn('[EventPropagationService] Initializing without component registry dependency');
    }
    
    // Handle other dependencies that might be passed in
    if (dependencies) {
      // Log the dependencies we received
      const dependencyNames = Object.keys(dependencies).join(', ');
      console.warn(`[EventPropagationService] Initialized with dependencies: ${dependencyNames || 'none'}`);
      
      // Initialize with error logging service if provided
      if ('errorLogging' in dependencies) {
        const errorLogging = dependencies.errorLogging as typeof errorLoggingService;
        
        // Configure error handling with the error logging service
        if (errorLogging) {
          console.warn('[EventPropagationService] Error logging service available');
          
          // Set up a custom error handler using the provided error logging service
          this.customErrorHandler = (error: Error, context?: Record<string, unknown>) => {
            errorLogging.logError(error, ErrorType.RUNTIME, undefined, {
              service: 'EventPropagationService',
              ...context
            });
          };
        }
      }
    }
  }

  protected async onDispose(): Promise<void> {
    // Clear all subscriptions and queued events
    this.subscriptions.clear();
    this.eventQueue = [];
  }

  public subscribe(subscription: EventSubscription): () => void {
    const { eventType } = subscription;

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subscribers = this.subscriptions.get(eventType)!;
    subscribers.push(subscription);

    // Sort by priority (higher numbers first)
    subscribers.sort((a, b) => b.priority - a.priority);

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.total_subscriptions = Array.from(this.subscriptions.values()).reduce(
      (sum, subs) => sum + subs.length,
      0
    );
    metrics.total_event_types = this.subscriptions.size;
    this.metadata.metrics = metrics;

    // Return unsubscribe function
    return () => {
      const index = subscribers.indexOf(subscription);
      if (index !== -1) {
        subscribers.splice(index, 1);
        if (subscribers.length === 0) {
          this.subscriptions.delete(eventType);
        }

        // Update metrics
        if (!this.metadata.metrics) {
          this.metadata.metrics = {};
        }
        const metrics = this.metadata.metrics;
        metrics.total_subscriptions = Array.from(this.subscriptions.values()).reduce(
          (sum, subs) => sum + subs.length,
          0
        );
        metrics.total_event_types = this.subscriptions.size;
        this.metadata.metrics = metrics;
      }
    };
  }

  public emit(eventType: string, eventData: unknown): void {
    // Add event to queue
    this.eventQueue.push({ type: eventType, data: eventData });

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.total_events_emitted = (metrics.total_events_emitted ?? 0) + 1;
    metrics.last_event_timestamp = Date.now();
    this.metadata.metrics = metrics;

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processEventQueue();
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event?.type, event?.data);
      }
    } catch (error) {
      this.handleError(error as Error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(eventType: string, eventData: unknown): Promise<void> {
    // Get subscribers for this event type
    const subscribers = this.subscriptions.get(eventType) ?? [];

    // Notify component registry
    componentRegistryService.notifyComponentsOfEvent(eventType, eventData);

    // Call subscribers in priority order
    for (const subscriber of subscribers) {
      try {
        await subscriber.callback(eventData);
      } catch (error) {
        this.handleError(error as Error);
      }
    }

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.total_events_processed = (metrics.total_events_processed ?? 0) + 1;
    metrics.last_processed_timestamp = Date.now();
    this.metadata.metrics = metrics;
  }

  public override handleError(error: Error, context?: Record<string, unknown>): void {
    // Update error metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const metrics = this.metadata.metrics;
    metrics.total_errors = (metrics.total_errors ?? 0) + 1;
    metrics.last_error_timestamp = Date.now();
    this.metadata.metrics = metrics;

    // Use custom error handler if available
    if (this.customErrorHandler) {
      this.customErrorHandler(error, context);
      return;
    }

    // Forward to error logging service
    errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
      service: 'EventPropagationService',
      ...context,
    });

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[EventPropagationService] Error:', error);
    }
  }
}

// Export singleton instance
export const eventPropagationService = new EventPropagationServiceImpl();

// Export default for easier imports
export default eventPropagationService;

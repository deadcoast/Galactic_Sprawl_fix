import { AbstractBaseService } from '../lib/services/BaseService';
import { ErrorType, errorLoggingService } from './ErrorLoggingService';

/**
 * Metadata for a registered UI component
 *
 * Includes information about the component's identity, subscriptions, and performance metrics
 */
export interface ComponentMetadata {
  id: string;
  type: string;
  eventSubscriptions: string[]; // Event types this component is interested in
  updatePriority: 'high' | 'medium' | 'low';
  lastUpdated?: number;
  renderCount?: number;
  averageRenderTime?: number;
  totalRenderTime?: number;
}

export interface ComponentRegistration {
  id: string;
  type: string;
  eventSubscriptions: string[];
  updatePriority: 'high' | 'medium' | 'low';
  lastRenderTime?: number;
  renderCount?: number;
}

/**
 * @context: service-system
 * Service for registering and tracking UI components and their event subscriptions
 */
class ComponentRegistryServiceImpl extends AbstractBaseService<ComponentRegistryServiceImpl> {
  private components: Map<string, ComponentRegistration> = new Map();
  private typeIndex: Map<string, Set<string>> = new Map();
  private eventIndex: Map<string, Set<string>> = new Map();

  public constructor() {
    super('ComponentRegistryService', '1.0.0');
  }

  protected async onInitialize(dependencies?: Record<string, unknown>): Promise<void> {
    // Initialize metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    this.metadata.metrics = {
      total_components: 0,
      total_types: 0,
      total_event_types: 0,
      total_renders: 0,
      total_notifications: 0,
      total_errors: 0,
    };
  }

  protected async onDispose(): Promise<void> {
    // Clear all registrations
    this.components.clear();
    this.typeIndex.clear();
    this.eventIndex.clear();
  }

  public registerComponent(registration: Omit<ComponentRegistration, 'id'>): string {
    const id = crypto.randomUUID();
    const fullRegistration: ComponentRegistration = {
      ...registration,
      id,
      renderCount: 0,
    };

    // Store in main registry
    this.components.set(id, fullRegistration);

    // Update type index
    if (!this.typeIndex.has(registration.type)) {
      this.typeIndex.set(registration.type, new Set());
    }
    this.typeIndex.get(registration.type)!.add(id);

    // Update event index
    for (const event of registration.eventSubscriptions) {
      if (!this.eventIndex.has(event)) {
        this.eventIndex.set(event, new Set());
      }
      this.eventIndex.get(event)!.add(id);
    }

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics.total_components = this.components.size;
    metrics.total_types = this.typeIndex.size;
    metrics.total_event_types = this.eventIndex.size;
    this.metadata.metrics = metrics;

    return id;
  }

  public unregisterComponent(id: string): void {
    const registration = this.components.get(id);
    if (!registration) {
      return;
    }

    // Remove from type index
    this.typeIndex.get(registration.type)?.delete(id);
    if (this.typeIndex.get(registration.type)?.size === 0) {
      this.typeIndex.delete(registration.type);
    }

    // Remove from event index
    for (const event of registration.eventSubscriptions) {
      this.eventIndex.get(event)?.delete(id);
      if (this.eventIndex.get(event)?.size === 0) {
        this.eventIndex.delete(event);
      }
    }

    // Remove from main registry
    this.components.delete(id);

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics.total_components = this.components.size;
    metrics.total_types = this.typeIndex.size;
    metrics.total_event_types = this.eventIndex.size;
    this.metadata.metrics = metrics;
  }

  public getComponent(id: string): ComponentRegistration | undefined {
    return this.components.get(id);
  }

  public getComponentsByType(type: string): ComponentRegistration[] {
    const ids = this.typeIndex.get(type);
    if (!ids) {
      return [];
    }

    return Array.from(ids)
      .map(id => this.components.get(id)!)
      .filter(Boolean);
  }

  public getComponentsByEvent(event: string): ComponentRegistration[] {
    const ids = this.eventIndex.get(event);
    if (!ids) {
      return [];
    }

    return Array.from(ids)
      .map(id => this.components.get(id)!)
      .filter(Boolean);
  }

  public trackRender(id: string): void {
    const registration = this.components.get(id);
    if (!registration) {
      return;
    }

    registration.lastRenderTime = Date.now();
    registration.renderCount = (registration.renderCount ?? 0) + 1;

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics.total_renders = (metrics.total_renders ?? 0) + 1;
    metrics.last_render_timestamp = registration.lastRenderTime;
    this.metadata.metrics = metrics;
  }

  public notifyComponentsOfEvent(eventType: string, eventData: unknown): void {
    const components = this.getComponentsByEvent(eventType);

    // Update metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics.total_notifications = (metrics.total_notifications ?? 0) + 1;
    metrics.last_notification_timestamp = Date.now();
    metrics.components_notified = components.length;
    this.metadata.metrics = metrics;

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[ComponentRegistryService] Notifying ${components.length} components of event: ${eventType}`
      );
    }
  }

  public override handleError(error: Error, context?: Record<string, unknown>): void {
    // Update error metrics
    if (!this.metadata.metrics) {
      this.metadata.metrics = {};
    }
    const { metrics } = this.metadata;
    metrics.total_errors = (metrics.total_errors ?? 0) + 1;
    metrics.last_error_timestamp = Date.now();
    this.metadata.metrics = metrics;

    // Forward to error logging service
    errorLoggingService.logError(error, ErrorType.RUNTIME, undefined, {
      service: 'ComponentRegistryService',
      ...context,
    });
  }
}

// Export singleton instance using direct instantiation
export const componentRegistryService = new ComponentRegistryServiceImpl();

// Export default for easier imports
export default componentRegistryService;

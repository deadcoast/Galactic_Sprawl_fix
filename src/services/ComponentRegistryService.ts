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

/**
 * Service for registering UI components with the system
 *
 * This service enables components to:
 * - Register themselves in a centralized registry
 * - Subscribe to relevant events
 * - Track performance metrics
 * - Get notified of system changes
 */
export class ComponentRegistryService {
  /**
   * Component registry indexed by component ID
   * @private
   */
  private components: Map<string, ComponentMetadata> = new Map();

  /**
   * Event subscriptions map:
   * - Key: Event type
   * - Value: Set of component IDs interested in this event
   * @private
   */
  private eventSubscriptions: Map<string, Set<string>> = new Map();

  /**
   * Performance monitoring configuration
   * @private
   */
  private performanceThresholds = {
    renderTime: 16, // ms (targeting 60fps)
    renderCount: 10, // per minute
  };

  /**
   * Registers a UI component with the system
   *
   * @param metadata Component metadata
   * @returns Function to unregister the component (for cleanup)
   */
  public registerComponent(metadata: ComponentMetadata): () => void {
    console.warn(`[ComponentRegistry] Registering component: ${metadata.id} (${metadata.type})`);

    // Store component metadata
    this.components.set(metadata.id, {
      ...metadata,
      renderCount: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
      lastUpdated: Date.now(),
    });

    // Register event subscriptions
    metadata.eventSubscriptions.forEach(eventType => {
      if (!this.eventSubscriptions.has(eventType)) {
        this.eventSubscriptions.set(eventType, new Set());
      }

      this.eventSubscriptions.get(eventType)!.add(metadata.id);
    });

    // Return unregister function for cleanup
    return () => {
      this.unregisterComponent(metadata.id);
    };
  }

  /**
   * Unregisters a component
   *
   * @param componentId ID of the component to unregister
   */
  private unregisterComponent(componentId: string): void {
    console.warn(`[ComponentRegistry] Unregistering component: ${componentId}`);

    // Get component metadata
    const component = this.components.get(componentId);
    if (!component) {
      return;
    }

    // Remove from event subscriptions
    component.eventSubscriptions.forEach(eventType => {
      const subscribers = this.eventSubscriptions.get(eventType);
      if (subscribers) {
        subscribers.delete(componentId);

        // Clean up empty subscription sets
        if (subscribers.size === 0) {
          this.eventSubscriptions.delete(eventType);
        }
      }
    });

    // Remove from components map
    this.components.delete(componentId);
  }

  /**
   * Gets all components that have subscribed to a specific event type
   *
   * @param eventType The event type to check
   * @returns Array of component metadata for interested components
   */
  public getComponentsByEvent(eventType: string): ComponentMetadata[] {
    const componentIds = this.eventSubscriptions.get(eventType) || new Set();
    return Array.from(componentIds)
      .map(id => this.components.get(id))
      .filter((metadata): metadata is ComponentMetadata => metadata !== undefined);
  }

  /**
   * Updates component performance metrics
   *
   * @param id Component ID
   * @param renderTime Render time in milliseconds
   */
  public updateComponentMetrics(id: string, renderTime: number): void {
    const component = this.components.get(id);
    if (!component) {
      return;
    }

    // Update metrics
    const renderCount = (component.renderCount || 0) + 1;
    const totalRenderTime = (component.totalRenderTime || 0) + renderTime;
    const averageRenderTime = totalRenderTime / renderCount;

    // Save updated metrics
    this.components.set(id, {
      ...component,
      renderCount,
      totalRenderTime,
      averageRenderTime,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Gets all registered components
   *
   * @returns Array of all registered component metadata
   */
  public getAllComponents(): ComponentMetadata[] {
    return Array.from(this.components.values());
  }

  /**
   * Gets a component by ID
   *
   * @param id Component ID
   * @returns Component metadata or undefined if not found
   */
  public getComponentById(id: string): ComponentMetadata | undefined {
    return this.components.get(id);
  }

  /**
   * Gets all components of a specific type
   *
   * @param type Component type
   * @returns Array of component metadata matching the type
   */
  public getComponentsByType(type: string): ComponentMetadata[] {
    return Array.from(this.components.values()).filter(component => component.type === type);
  }

  /**
   * Generates a performance report for all registered components
   *
   * @returns Performance report object
   */
  public getPerformanceReport(): {
    componentsExceedingRenderTime: ComponentMetadata[];
    componentsExceedingRenderCount: ComponentMetadata[];
    totalComponents: number;
    averageRenderTime: number;
    slowestComponents: Array<{ id: string; type: string; averageRenderTime: number }>;
  } {
    const components = this.getAllComponents();

    // No components to report on
    if (components.length === 0) {
      return {
        componentsExceedingRenderTime: [],
        componentsExceedingRenderCount: [],
        totalComponents: 0,
        averageRenderTime: 0,
        slowestComponents: [],
      };
    }

    // Calculate the minute timeframe for render count threshold
    const oneMinuteAgo = Date.now() - 60000;

    // Identify components exceeding thresholds
    const componentsExceedingRenderTime = components.filter(
      component => (component.averageRenderTime || 0) > this.performanceThresholds.renderTime
    );

    const componentsExceedingRenderCount = components.filter(component => {
      // Skip components without render count
      if (!component.renderCount) return false;

      // Skip components that haven't been updated recently
      if (!component.lastUpdated || component.lastUpdated < oneMinuteAgo) return false;

      // Check if render count exceeds threshold
      return component.renderCount > this.performanceThresholds.renderCount;
    });

    // Calculate overall average render time
    const totalRenderTime = components.reduce(
      (sum, component) => sum + (component.totalRenderTime || 0),
      0
    );
    const totalRenderCount = components.reduce(
      (sum, component) => sum + (component.renderCount || 0),
      0
    );
    const averageRenderTime = totalRenderCount ? totalRenderTime / totalRenderCount : 0;

    // Get slowest components (top 5)
    const slowestComponents = [...components]
      .filter(component => component.averageRenderTime !== undefined)
      .sort((a, b) => {
        const aTime = a.averageRenderTime || 0;
        const bTime = b.averageRenderTime || 0;
        return bTime - aTime;
      })
      .slice(0, 5)
      .map(component => ({
        id: component.id,
        type: component.type,
        averageRenderTime: component.averageRenderTime || 0,
      }));

    return {
      componentsExceedingRenderTime,
      componentsExceedingRenderCount,
      totalComponents: components.length,
      averageRenderTime,
      slowestComponents,
    };
  }

  /**
   * Notifies components about an event
   *
   * This method is intended to be called by the EventPropagationService
   *
   * @param eventType Type of the event
   * @param eventData Event data
   */
  public notifyComponentsOfEvent(eventType: string, eventData: unknown): void {
    const components = this.getComponentsByEvent(eventType);

    // Skip if no components are interested in this event
    if (components.length === 0) {
      return;
    }

    console.warn(
      `[ComponentRegistry] Notifying ${components.length} components of event: ${eventType}`
    );

    // We would notify components here
    // The actual implementation depends on how components receive updates
    // For now, we just log the notification
  }
}

// Singleton instance
export const componentRegistry = new ComponentRegistryService();

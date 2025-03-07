import { ThresholdEvent, thresholdEvents } from '../contexts/ThresholdTypes';
import { ModuleEvent, moduleEventBus, ModuleEventType } from '../lib/modules/ModuleEvents';
import { componentRegistry } from './ComponentRegistryService';

/**
 * Central event hub for propagating events throughout the application
 * This service bridges different event systems and ensures consistent event flow
 */
export class EventPropagationService {
  // Track registered event transformations
  private moduleToThresholdMappings: Map<
    string,
    Array<{
      targetType: string;
      transform: (event: ModuleEvent) => Partial<ThresholdEvent>;
    }>
  > = new Map();

  private thresholdToModuleMappings: Map<
    string,
    Array<{
      targetType: ModuleEventType;
      transform: (event: ThresholdEvent) => Partial<ModuleEvent>;
    }>
  > = new Map();

  /**
   * Register a mapping from ModuleEvents to ThresholdEvents
   */
  public registerModuleToThresholdMapping(
    sourceType: string,
    targetType: string,
    transform: (event: ModuleEvent) => Partial<ThresholdEvent>
  ): void {
    if (!this.moduleToThresholdMappings.has(sourceType)) {
      this.moduleToThresholdMappings.set(sourceType, []);
    }

    const mappings = this.moduleToThresholdMappings.get(sourceType)!;
    mappings.push({ targetType, transform });
  }

  /**
   * Register a mapping from ThresholdEvents to ModuleEvents
   */
  public registerThresholdToModuleMapping(
    sourceType: string,
    targetType: ModuleEventType,
    transform: (event: ThresholdEvent) => Partial<ModuleEvent>
  ): void {
    if (!this.thresholdToModuleMappings.has(sourceType)) {
      this.thresholdToModuleMappings.set(sourceType, []);
    }

    const mappings = this.thresholdToModuleMappings.get(sourceType)!;
    mappings.push({ targetType, transform });
  }

  /**
   * Initialize event propagation by setting up event subscriptions
   */
  public initialize(): void {
    // Set up ModuleEvent subscriptions
    moduleEventBus.subscribe('*' as ModuleEventType, (event: ModuleEvent) => {
      this.propagateModuleEvent(event);

      // Notify registered UI components about this event
      componentRegistry.notifyComponentsOfEvent(event.type, event);
    });

    // Set up ThresholdEvent subscriptions
    thresholdEvents.subscribe((event: ThresholdEvent) => {
      this.propagateThresholdEvent(event);

      // Notify registered UI components about threshold events
      componentRegistry.notifyComponentsOfEvent(`THRESHOLD_${event.type}`, event);
    });

    console.warn('EventPropagationService initialized');
  }

  /**
   * Propagate a ModuleEvent to ThresholdEvents
   */
  private propagateModuleEvent(event: ModuleEvent): void {
    const mappings = this.moduleToThresholdMappings.get(event.type) || [];

    for (const mapping of mappings) {
      try {
        const transformedData = mapping.transform(event);
        thresholdEvents.next({
          ...transformedData,
          type: mapping.targetType,
        } as ThresholdEvent);
      } catch (error) {
        console.error(
          `Error propagating ModuleEvent to ThresholdEvent: ${event.type} -> ${mapping.targetType}`,
          error
        );
      }
    }
  }

  /**
   * Propagate a ThresholdEvent to ModuleEvents
   */
  private propagateThresholdEvent(event: ThresholdEvent): void {
    const mappings = this.thresholdToModuleMappings.get(event.type) || [];

    for (const mapping of mappings) {
      try {
        const transformedData = mapping.transform(event);
        moduleEventBus.emit({
          ...transformedData,
          type: mapping.targetType,
        } as ModuleEvent);
      } catch (error) {
        console.error(
          `Error propagating ThresholdEvent to ModuleEvent: ${event.type} -> ${mapping.targetType}`,
          error
        );
      }
    }
  }
}

// Singleton instance
export const eventPropagationService = new EventPropagationService();

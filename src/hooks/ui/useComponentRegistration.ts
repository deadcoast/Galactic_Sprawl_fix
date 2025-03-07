import { useEffect, useRef } from 'react';
import { componentRegistry } from '../../services/ComponentRegistryService';
import { useComponentProfiler } from './useComponentProfiler';

/**
 * Options for component registration
 */
export interface ComponentRegistrationOptions {
  /**
   * Type of the component (e.g., 'ResourceDisplay', 'ModuleCard')
   */
  type: string;

  /**
   * Event types this component is interested in receiving
   */
  eventSubscriptions: string[];

  /**
   * Update priority for this component
   * - high: Component updates are critical for game functionality
   * - medium: Component updates are important but not critical
   * - low: Component updates can be delayed if necessary
   */
  updatePriority?: 'high' | 'medium' | 'low';
}

/**
 * Hook that registers a React component with the ComponentRegistryService
 *
 * This hook:
 * 1. Generates a unique ID for the component
 * 2. Registers the component with the registry
 * 3. Sets up profiling to measure render times
 * 4. Automatically cleans up on unmount
 *
 * @param options Component registration options
 * @returns The generated component ID
 *
 * @example
 * function ResourceDisplay({ resourceType }) {
 *   // Register component with the system
 *   useComponentRegistration({
 *     type: 'ResourceDisplay',
 *     eventSubscriptions: ['RESOURCE_PRODUCED', 'RESOURCE_CONSUMED'],
 *     updatePriority: 'high'
 *   });
 *
 *   // Component implementation...
 * }
 */
export function useComponentRegistration(options: ComponentRegistrationOptions): string {
  // Generate a unique component ID that remains stable across renders
  const componentId = useRef<string>(
    `${options.type}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  ).current;

  // Set up component profiling
  const profiler = useComponentProfiler(componentId);

  // Register with the component registry
  useEffect(() => {
    // Register component with registry
    const unregister = componentRegistry.registerComponent({
      id: componentId,
      type: options.type,
      eventSubscriptions: options.eventSubscriptions,
      updatePriority: options.updatePriority || 'medium',
    });

    // Clean up on unmount
    return unregister;
  }, [componentId, options.type, options.eventSubscriptions, options.updatePriority]);

  // Update performance metrics after each render
  useEffect(() => {
    return () => {
      // This is called after the render is complete
      const renderTime = profiler.metrics.lastRenderTime;
      if (renderTime !== undefined) {
        componentRegistry.updateComponentMetrics(componentId, renderTime);
      }
    };
  });

  return componentId;
}

/**
 * Hook that registers a component and provides a method to manually update its metrics
 *
 * This is useful for components that need to manually control when metrics are updated,
 * such as those with complex rendering logic or conditional renders.
 *
 * @param options Component registration options
 * @returns An object containing the component ID and an update function
 */
export function useComponentRegistrationWithManualUpdates(options: ComponentRegistrationOptions): {
  componentId: string;
  updateMetrics: (renderTime: number) => void;
} {
  const componentId = useComponentRegistration(options);

  // Function to manually update metrics
  const updateMetrics = (renderTime: number) => {
    componentRegistry.updateComponentMetrics(componentId, renderTime);
  };

  return { componentId, updateMetrics };
}

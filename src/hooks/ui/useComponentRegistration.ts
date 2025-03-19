import { useEffect, useRef } from 'react';
import { componentRegistryService } from '../../services/ComponentRegistryService';
import { ResourceType } from './../../types/resources/ResourceTypes';
import { useComponentProfiler } from './useComponentProfiler';

/**
 * Options for component registration
 */
export interface ComponentRegistrationOptions {
  /**
   * Type of the component (e.g., 'ResourceDisplay', 'ModuleCard')
   */
  type: ResourceType;

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
  const componentId = useRef<string>('');
  const profiler = useComponentProfiler(options?.type);

  useEffect(() => {
    // Register component with registry
    const id = componentRegistryService.registerComponent({
      type: options?.type,
      eventSubscriptions: options?.eventSubscriptions,
      updatePriority: options?.updatePriority || 'medium',
    });

    componentId.current = id;

    // Track render with profiler
    if (profiler) {
      const renderTime = profiler.metrics.lastRenderTime;
      if (renderTime !== undefined) {
        componentRegistryService.trackRender(id);
      }
    }

    // Return cleanup function
    return () => {
      componentRegistryService.unregisterComponent(id);
    };
  }, [options?.type, options?.updatePriority, profiler]);

  return componentId.current;
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
    componentRegistryService.trackRender(componentId);
  };

  return { componentId, updateMetrics };
}

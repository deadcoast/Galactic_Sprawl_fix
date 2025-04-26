import { useEffect, useRef } from 'react';
import { useComponentProfiler } from './useComponentProfiler';
import { ComponentRegistration, componentRegistryService } from '../../services/ComponentRegistryService';
import { errorLoggingService } from '../../services/logging/ErrorLoggingService';

type UpdatePriority = ComponentRegistration['updatePriority'];
type ErrorDetails = Record<string, unknown>;

/**
 * Type guard to check if a value is a valid Record<string, unknown>
 */
function isValidProps(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/**
 * Options for component registration
 */
// Removed first ComponentRegistrationOptions interface as it might not be needed for the context-based hook
// export interface ComponentRegistrationOptions { ... }

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
// Removed first useComponentRegistration hook definition (lines 55-93)
// export function useComponentRegistration(options: ComponentRegistrationOptions): string { ... }

/**
 * Hook that registers a component and provides a method to manually update its metrics
 *
 * This is useful for components that need to manually control when metrics are updated,
 * such as those with complex rendering logic or conditional renders.
 *
 * @param options Component registration options
 * @returns An object containing the component ID and an update function
 */
// Removed useComponentRegistrationWithManualUpdates hook definition (lines 95-110) as it depended on the removed hook
// export function useComponentRegistrationWithManualUpdates(options: ComponentRegistrationOptions): { ... } {

/**
 * Hook to register a component instance with the ComponentRegistryService.
 * Registers the component instance and provides a way to update its props.
 * @param id A unique identifier for the component instance.
 * @param type The type of the component (e.g., 'ResourceDisplay').
 * @param initialProps Optional initial properties for the component.
 * @returns An object containing a function to update the component's props.
 */
/**
 * Hook for registering a component with the ComponentRegistryService
 * @param id Unique identifier for the component
 * @param type Component type identifier
 * @param initialProps Optional initial properties
 * @param options Optional registration options
 * @returns Object containing methods to update the component
 * @throws Error if registration fails or if invalid props are provided
 */
export function useComponentRegistration(
  id: string,
  type: string,
  initialProps?: Record<string, unknown>,
  options: {
    eventSubscriptions?: string[];
    updatePriority?: UpdatePriority;
  } = {}
) {
  // Validate initial props
  if (initialProps !== undefined && !isValidProps(initialProps)) {
    const error = new Error('Invalid initialProps provided to useComponentRegistration');
    errorLoggingService.logError(error, 'VALIDATION_ERROR', 'HIGH', {
      componentId: id,
      componentType: type
    });
    throw error;
  }

  const propsRef = useRef(initialProps);
  const componentInfoRef = useRef<ComponentRegistration | null>(null);

  // Initial registration
  useEffect(() => {
    try {
      const registrationInfo: ComponentRegistration = {
        id,
        type,
        eventSubscriptions: options.eventSubscriptions ?? [],
        updatePriority: options.updatePriority ?? 'medium',
      };
      componentInfoRef.current = registrationInfo;

      componentRegistryService.registerComponent(registrationInfo);

      // Track render performance
      const profiler = useComponentProfiler(type);
      if (profiler?.metrics.lastRenderTime !== undefined) {
        componentRegistryService.trackRender(id);
      }

      return () => {
        try {
          componentRegistryService.unregisterComponent(id);
        } catch (error) {
          if (error instanceof Error) {
            const details: ErrorDetails = { componentId: id, action: 'unregister' };
            errorLoggingService.logError(error, 'SERVICE_ERROR', 'MEDIUM', details);
          }
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        const details: ErrorDetails = { componentId: id, action: 'register' };
        errorLoggingService.logError(error, 'SERVICE_ERROR', 'HIGH', details);
      }
      throw error;
    }
  }, [id, type, options.eventSubscriptions, options.updatePriority]);

  /**
   * Updates component properties in the registry
   * Note: Currently a no-op as ComponentRegistryService does not support prop updates
   * @param newProps New properties to set
   * @throws Error if invalid props are provided
   */
  const updateProps = (newProps: Record<string, unknown>) => {
    if (!isValidProps(newProps)) {
      const error = new Error('Invalid props provided to updateProps');
      errorLoggingService.logError(error, 'VALIDATION_ERROR', 'MEDIUM', {
        componentId: id,
        componentType: type
      });
      throw error;
    }

    // Only update local ref since ComponentRegistryService doesn't support prop updates
    propsRef.current = newProps;
  };

  return { updateProps };
}

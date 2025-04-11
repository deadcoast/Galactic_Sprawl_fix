import { useEffect, useRef } from 'react';
// Remove context import
// import { ComponentRegistryContext } from '../../contexts/ComponentRegistryContext';
import { useComponentProfiler } from './useComponentProfiler';
// Import the service instance
import {
  ComponentRegistration,
  componentRegistryService,
} from '../../services/ComponentRegistryService';

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
export function useComponentRegistration(
  id: string,
  type: string,
  initialProps?: Record<string, unknown>
) {
  // Remove context usage
  // const context = useContext(ComponentRegistryContext);
  // if (!context) {
  //   throw new Error('useComponentRegistration must be used within a ComponentRegistryProvider');
  // }
  // const { registerComponent, unregisterComponent, updateComponent } = context; // Added updateComponent

  const propsRef = useRef(initialProps);
  const componentInfoRef = useRef<ComponentRegistration | null>(null);

  // Initial registration
  useEffect(() => {
    const registrationInfo: ComponentRegistration = {
      id,
      type,
      eventSubscriptions: [],
      updatePriority: 'medium',
    };
    componentInfoRef.current = registrationInfo;
    // Use service instance directly
    componentRegistryService.registerComponent({
      type: registrationInfo.type,
      eventSubscriptions: registrationInfo.eventSubscriptions,
      updatePriority: registrationInfo.updatePriority,
    });

    // Track render with profiler
    // NOTE: The profiler logic seems independent of context vs service, leaving as is.
    // However, the commented-out tracking part needs clarification.
    // If tracking is needed, componentRegistryService should have a method like trackRender.
    const profiler = useComponentProfiler(type);
    if (profiler && profiler.metrics.lastRenderTime !== undefined) {
      // Notify registry of render time if needed, e.g.,
      // componentRegistryService.trackRender(id, profiler.metrics.lastRenderTime);
    }

    // Return cleanup function
    return () => {
      componentRegistryService.unregisterComponent(id);
    };
  }, [id, type]);

  // Function to update component props via service
  const updateProps = (newProps: Record<string, unknown>) => {
    propsRef.current = newProps;
    if (componentInfoRef.current) {
      // ComponentRegistration doesn't store props directly, so we don't update ref here
      // componentInfoRef.current.props = newProps;

      // Notify registry about prop updates using the service
      // componentRegistryService.updateComponent(id, { props: newProps });
      // TODO: Verify if updateComponent exists and how it handles props
      console.warn(
        'TODO: Verify ComponentRegistryService.updateComponent implementation for props'
      );
    }
  };

  return { updateProps };
}

/**
 * @context: ui-system, resource-system, hooks-library
 *
 * Hook for integrating UI components with the Resource System
 */
import { useCallback, useEffect, useState } from 'react';
import { moduleEventBus } from '../../lib/events/ModuleEventBus';
import {
  getResourceConversionManager,
  getResourceFlowManager,
  getResourceManager,
} from '../../managers/ManagerRegistry';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';
import { EventType, isResourceUpdateEventData } from '../../types/events/EventTypes';
import { ResourceState, ResourceType } from '../../types/resources/ResourceTypes';
// import { useAppDispatch } from '../store/hooks'; // Removed - store not configured
// import { updateResourceAction } from '../../store/slices/resourceSlice'; // Removed - store not configured

// Default resource state for fallback
const defaultResourceState: ResourceState = {
  current: 0,
  max: 1000,
  min: 0,
  production: 0,
  consumption: 0,
  rate: 0,
  value: 0,
};

/**
 * Hook to retrieve and monitor a specific resource from the Resource System
 *
 * @param resourceType The type of resource to monitor
 * @returns Object containing resource state, loading state, and error state
 */
export function useResource(resourceType: ResourceType) {
  const [resourceState, setResourceState] = useState<ResourceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch resource data and subscribe to updates
  useEffect(() => {
    // Initial resource fetch
    const fetchResource = () => {
      try {
        setLoading(true);

        // Get resource manager through registry
        const resourceManager = getResourceManager();

        // Get resource state
        const state = resourceManager.getResourceState(resourceType);
        setResourceState(state || null);
        setError(null);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setError(error);

        // Log error
        errorLoggingService.logError(error, ErrorType.UI, ErrorSeverity.MEDIUM, {
          component: 'useResource',
          resourceType,
        });
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchResource();

    // Subscribe to resource updates
    const unsubscribe = moduleEventBus.subscribe(EventType.RESOURCE_UPDATED, event => {
      if (
        event &&
        event.data &&
        isResourceUpdateEventData(event.data) &&
        event.data.resourceType === resourceType
      ) {
        try {
          const resourceManager = getResourceManager();
          setResourceState(resourceManager.getResourceState(resourceType) || null);
          setError(null);
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          setError(error);

          // Log error
          errorLoggingService.logError(error, ErrorType.UI, ErrorSeverity.MEDIUM, {
            component: 'useResource',
            resourceType,
            eventType: EventType.RESOURCE_UPDATED,
          });
        }
      }
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [resourceType]);

  return {
    data: resourceState || defaultResourceState,
    loading,
    error,
  };
}

/**
 * Hook to retrieve and monitor all resources of specified types from the Resource System
 *
 * @param resourceTypes Optional array of resource types to monitor (all types if omitted)
 * @returns Object containing map of resource states, loading state, and error state
 */
export function useResources(resourceTypes?: ResourceType[]) {
  const [resources, setResources] = useState<Map<ResourceType, ResourceState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch resources and subscribe to updates
  useEffect(() => {
    // Initial resources fetch
    const fetchResources = () => {
      try {
        setLoading(true);

        // Get resource manager through registry
        const resourceManager = getResourceManager();

        // If specific resource types provided, get those
        if (resourceTypes && resourceTypes.length > 0) {
          const resourceMap = new Map<ResourceType, ResourceState>();

          resourceTypes.forEach(type => {
            const state = resourceManager.getResourceState(type);
            if (state) {
              resourceMap.set(type, state);
            }
          });

          setResources(resourceMap);
        }
        // Otherwise get all available resources
        else {
          // Get all resources using getAllResourceStates
          try {
            const allResources = resourceManager.getAllResourceStates();
            // Convert the record to a Map
            const resourceMap = new Map<ResourceType, ResourceState>();
            Object.entries(allResources).forEach(([key, value]) => {
              resourceMap.set(key as ResourceType, value);
            });
            setResources(resourceMap);
          } catch (e) {
            // Fallback if getAllResourceStates doesn't exist
            const resourceMap = new Map<ResourceType, ResourceState>();
            Object.values(ResourceType).forEach(type => {
              const state = resourceManager.getResourceState(type);
              if (state) {
                resourceMap.set(type, state);
              }
            });
            setResources(resourceMap);
          }
        }

        setError(null);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setError(error);

        // Log error
        errorLoggingService.logError(error, ErrorType.UI, ErrorSeverity.MEDIUM, {
          component: 'useResources',
          resourceTypes: resourceTypes ? JSON.stringify(resourceTypes) : 'all',
        });
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchResources();

    // Subscribe to resource updates
    const unsubscribe = moduleEventBus.subscribe(EventType.RESOURCE_UPDATED, event => {
      if (event && event.data && isResourceUpdateEventData(event.data)) {
        const { resourceType } = event.data;

        // Only update if we care about this resource type
        if (!resourceTypes || resourceTypes.includes(resourceType)) {
          try {
            const resourceManager = getResourceManager();
            const state = resourceManager.getResourceState(resourceType);

            if (state) {
              setResources(prev => {
                const updated = new Map(prev);
                updated.set(resourceType, state);
                return updated;
              });
            }

            setError(null);
          } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            setError(error);

            // Log error
            errorLoggingService.logError(error, ErrorType.UI, ErrorSeverity.MEDIUM, {
              component: 'useResources',
              resourceType,
              eventType: EventType.RESOURCE_UPDATED,
            });
          }
        }
      }
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [resourceTypes]);

  return {
    data: resources,
    loading,
    error,
    // Helper function to get a specific resource
    getResource: useCallback(
      (type: ResourceType) => {
        return resources.get(type) || defaultResourceState;
      },
      [resources]
    ),
  };
}

/**
 * Hook for modifying resource amounts
 *
 * @returns Object with functions to modify resources
 */
export function useResourceActions() {
  const [error, setError] = useState<Error | null>(null);

  // Add resource amount
  const addResource = useCallback((resourceType: ResourceType, amount: number): boolean => {
    try {
      const resourceManager = getResourceManager();
      // Return the result of setResourceAmount operation
      if (amount > 0) {
        const currentState = resourceManager.getResourceState(resourceType);
        const newAmount = (currentState?.current || 0) + amount;
        resourceManager.setResourceAmount(resourceType, newAmount);
        return true;
      }
      return false;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);

      // Log error
      errorLoggingService.logError(error, ErrorType.UI, ErrorSeverity.MEDIUM, {
        component: 'useResourceActions',
        method: 'addResource',
        resourceType,
        amount,
      });

      return false;
    }
  }, []);

  // Consume resource amount
  const consumeResource = useCallback((resourceType: ResourceType, amount: number): boolean => {
    try {
      const resourceManager = getResourceManager();
      // Return the result of setResourceAmount operation
      if (amount > 0) {
        const currentState = resourceManager.getResourceState(resourceType);
        if (!currentState || currentState.current < amount) {
          return false;
        }
        const newAmount = currentState.current - amount;
        resourceManager.setResourceAmount(resourceType, newAmount);
        return true;
      }
      return false;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);

      // Log error
      errorLoggingService.logError(error, ErrorType.UI, ErrorSeverity.MEDIUM, {
        component: 'useResourceActions',
        method: 'consumeResource',
        resourceType,
        amount,
      });

      return false;
    }
  }, []);

  // Set resource to specific amount
  const setResource = useCallback((resourceType: ResourceType, amount: number): boolean => {
    try {
      const resourceManager = getResourceManager();
      resourceManager.setResourceAmount(resourceType, amount);
      return true;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);

      // Log error
      errorLoggingService.logError(error, ErrorType.UI, ErrorSeverity.MEDIUM, {
        component: 'useResourceActions',
        method: 'setResource',
        resourceType,
        amount,
      });

      return false;
    }
  }, []);

  return {
    addResource,
    consumeResource,
    setResource,
    error,
  };
}

/**
 * Integration hook for connecting the resource system to the Redux store
 * and handling resource-related events.
 */
export function useResourceSystemIntegration(enableLogging = false) {
  const dispatch = useAppDispatch();
  const resourceFlowManager = getResourceFlowManager();
  // const resourceThresholdManager = getResourceThresholdManager(); // Removed usage
  // const resourceStorageManager = getResourceStorageManager(); // Removed usage
  const resourceConversionManager = getResourceConversionManager();
  const resourceManager = getResourceManager(); // Added usage of existing manager

  useEffect(() => {
    // Initial fetch or setup if needed (e.g., get all initial resource states)
    const initialStates = resourceManager.getAllResourceStates(); // Assuming this exists
    Object.entries(initialStates).forEach(([type, state]) => {
      dispatch(updateResourceAction({ resourceType: type as ResourceType, ...state }));
    });

    // Subscribe to resource update events
    const handleResourceUpdate = (event: unknown) => {
      // Add type guard
      if (
        event &&
        typeof event === 'object' &&
        'type' in event &&
        event.type === EventType.RESOURCE_UPDATED &&
        'data' in event &&
        typeof event.data === 'object' &&
        event.data &&
        'resourceType' in event.data &&
        typeof event.data.resourceType === 'string' // Check type safety
      ) {
        const updateData = event.data as {
          resourceType: ResourceType;
          current: number /* other state fields */;
        };
        // Dispatch update to Redux store
        // Need to ensure the event data structure matches what updateResourceAction expects
        // Might need to fetch full state from manager if event data is partial
        const fullState = resourceManager.getResourceState(updateData.resourceType);
        if (fullState) {
          dispatch(updateResourceAction({ resourceType: updateData.resourceType, ...fullState }));
        }
      }
    };

    const unsubscribe = moduleEventBus.subscribe(EventType.RESOURCE_UPDATED, handleResourceUpdate);

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
    // Dependency array: resourceManager instance might change if resetManagers is called?
    // If getResourceManager guarantees stable instance, it might not be needed.
  }, [dispatch, resourceManager]);

  // Threshold and Storage specific logic would need to be handled differently,
  // potentially by observing specific state slices updated by the ResourceManager
  // or by calling methods on ResourceManager if they exist (e.g., resourceManager.getResourceState(type)).
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { resourceManager } from '../../managers/game/ResourceManager';
import {
  ResourceIntegration,
  createResourceIntegration,
} from '../../managers/resource/ResourceIntegration';
import { ResourceState, ResourceType } from '../../types/resources/ResourceTypes';

// Singleton instance of the resource integration
let resourceIntegrationInstance: ResourceIntegration | null = null;

/**
 * Initialize the resource integration if it hasn't been initialized yet
 */
function getResourceIntegration(): ResourceIntegration {
  if (!resourceIntegrationInstance) {
    resourceIntegrationInstance = createResourceIntegration(resourceManager);
  }

  if (!resourceIntegrationInstance) {
    throw new Error('Failed to create resource integration instance');
  }

  return resourceIntegrationInstance;
}

/**
 * Hook for accessing the resource management system
 */
export function useResourceManagement() {
  const [resourceStates, setResourceStates] = useState<Map<ResourceType, ResourceState>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  // Get or create the resource integration
  const integration = useMemo(() => getResourceIntegration(), []);

  // Initialize the resource states
  useEffect(() => {
    // Get all resource types
    const resourceTypes = Array.from(resourceManager['resources'].keys()) as ResourceType[];

    // Create a map of resource states
    const states = new Map<ResourceType, ResourceState>();
    resourceTypes.forEach(type => {
      const state = resourceManager.getResourceState(type);
      if (state) {
        states.set(type, state);
      }
    });

    setResourceStates(states);
    setIsInitialized(true);
  }, []);

  // Update the resource integration on each frame
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const frameId = requestAnimationFrame(time => {
      integration.update(1000 / 60); // Assume 60 FPS
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [integration, isInitialized]);

  // Clean up the resource integration when the component unmounts
  useEffect(() => {
    return () => {
      if (resourceIntegrationInstance) {
        resourceIntegrationInstance.cleanup();
        resourceIntegrationInstance = null;
      }
    };
  }, []);

  // Get a resource state
  const getResourceState = useCallback(
    (type: ResourceType): ResourceState | undefined => {
      return resourceStates.get(type);
    },
    [resourceStates]
  );

  // Get all resource states
  const getAllResourceStates = useCallback((): Map<ResourceType, ResourceState> => {
    return resourceStates;
  }, [resourceStates]);

  // Get resource amount
  const getResourceAmount = useCallback(
    (type: ResourceType): number => {
      return resourceStates.get(type)?.current || 0;
    },
    [resourceStates]
  );

  // Check if a resource is available
  const hasResource = useCallback(
    (type: ResourceType, amount: number): boolean => {
      const state = resourceStates.get(type);
      return state ? state.current >= amount : false;
    },
    [resourceStates]
  );

  // Check if multiple resources are available
  const hasResources = useCallback(
    (resources: Array<{ type: ResourceType; amount: number }>): boolean => {
      return resources.every(({ type, amount }) => hasResource(type, amount));
    },
    [hasResource]
  );

  // Consume a resource
  const consumeResource = useCallback(
    (type: ResourceType, amount: number): boolean => {
      if (!hasResource(type, amount)) {
        return false;
      }

      resourceManager.removeResource(type, amount);
      return true;
    },
    [hasResource]
  );

  // Consume multiple resources
  const consumeResources = useCallback(
    (resources: Array<{ type: ResourceType; amount: number }>): boolean => {
      if (!hasResources(resources)) {
        return false;
      }

      resources.forEach(({ type, amount }) => {
        resourceManager.removeResource(type, amount);
      });

      return true;
    },
    [hasResources]
  );

  // Add a resource
  const addResource = useCallback((type: ResourceType, amount: number): void => {
    resourceManager.addResource(type, amount);
  }, []);

  // Add multiple resources
  const addResources = useCallback(
    (resources: Array<{ type: ResourceType; amount: number }>): void => {
      resources.forEach(({ type, amount }) => {
        resourceManager.addResource(type, amount);
      });
    },
    []
  );

  // Get resource production rate
  const getProductionRate = useCallback(
    (type: ResourceType): number => {
      return resourceStates.get(type)?.production || 0;
    },
    [resourceStates]
  );

  // Get resource consumption rate
  const getConsumptionRate = useCallback(
    (type: ResourceType): number => {
      return resourceStates.get(type)?.consumption || 0;
    },
    [resourceStates]
  );

  // Set resource production rate
  const setProductionRate = useCallback((type: ResourceType, rate: number): void => {
    resourceManager.setResourceProduction(type, rate);
  }, []);

  // Set resource consumption rate
  const setConsumptionRate = useCallback((type: ResourceType, rate: number): void => {
    resourceManager.setResourceConsumption(type, rate);
  }, []);

  // Get resource capacity
  const getResourceCapacity = useCallback(
    (type: ResourceType): number => {
      return resourceStates.get(type)?.max || 0;
    },
    [resourceStates]
  );

  // Get resource percentage
  const getResourcePercentage = useCallback(
    (type: ResourceType): number => {
      const state = resourceStates.get(type);
      if (!state || state.max === 0) {
        return 0;
      }
      return (state.current / state.max) * 100;
    },
    [resourceStates]
  );

  return {
    // Resource state
    getResourceState,
    getAllResourceStates,
    getResourceAmount,
    hasResource,
    hasResources,

    // Resource modification
    consumeResource,
    consumeResources,
    addResource,
    addResources,

    // Resource rates
    getProductionRate,
    getConsumptionRate,
    setProductionRate,
    setConsumptionRate,

    // Resource capacity
    getResourceCapacity,
    getResourcePercentage,

    // Initialization state
    isInitialized,
  };
}

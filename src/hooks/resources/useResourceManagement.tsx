import { useCallback, useEffect, useMemo, useState } from 'react';
import { getResourceManager, ResourceManager } from '../../managers/ManagerRegistry';
import
  {
    createResourceIntegration,
    ResourceIntegration
  } from '../../managers/resource/ResourceIntegration';
import
  {
    ResourceState,
    ResourceType, ResourceType as StringResourceType, ResourceTypeString
  } from '../../types/resources/ResourceTypes';
import { ensureEnumResourceType } from '../../utils/resources/ResourceTypeConverter';

// Create an instance of ResourceManager
const resourceManager = ResourceManager.getInstance();

// Singleton instance of the resource integration
let resourceIntegrationInstance: ResourceIntegration | null = null;

/**
 * Initialize the resource integration if it hasn't been initialized yet
 */
function getResourceIntegration(): ResourceIntegration {
  resourceIntegrationInstance ??= createResourceIntegration(resourceManager);

  if (!resourceIntegrationInstance) {
    throw new Error('Failed to create resource integration instance');
  }

  return resourceIntegrationInstance;
}

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
 * Hook for accessing the resource management system
 */
export function useResourceManagement() {
  const [resourceStates, setResourceStates] = useState<Map<ResourceType, ResourceState>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Replace direct instantiation with registry access
  const resourceManager = getResourceManager();

  // Get or create the resource integration
  const integration = useMemo(() => getResourceIntegration(), []);

  // Initialize the resource states
  useEffect(() => {
    // Get all resource states using public method instead of private property
    const allResourceStates = resourceManager.getAllResourceStates();
    
    // Convert to Map format expected by component
    const states = new Map<StringResourceType, ResourceState>();
    Object.entries(allResourceStates).forEach(([type, state]) => {
      states.set(type as StringResourceType, state);
    });

    setResourceStates(states);
    setIsInitialized(true);
  }, []);

  // Update the resource integration on each frame
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const frameId = requestAnimationFrame(_time => {
      void integration.update(1000 / 60); // Assume 60 FPS
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [integration, isInitialized]);

  // Clean up the resource integration when the component unmounts
  useEffect(() => {
    return () => {
      if (resourceIntegrationInstance) {
        void resourceIntegrationInstance.cleanup();
        resourceIntegrationInstance = null;
      }
    };
  }, []);

  // Get a resource state
  const getResourceState = (type: ResourceType | ResourceTypeString) => {
    const enumType = ensureEnumResourceType(type);
    return resourceStates.get(enumType) ?? defaultResourceState;
  };

  // Get all resource states
  const getAllResourceStates = () => {
    const result = new Map<ResourceType, ResourceState>();
    resourceStates.forEach((state, type) => {
      result?.set(type, state);
    });
    return result;
  };

  // Get resource amount
  const getResourceAmount = (type: ResourceType | ResourceTypeString) => {
    const enumType = ensureEnumResourceType(type);
    return resourceStates.get(enumType)?.current ?? 0;
  };

  // Check if a resource is available
  const hasResource = (type: ResourceType | ResourceTypeString, amount: number) => {
    const enumType = ensureEnumResourceType(type);
    return (resourceStates.get(enumType)?.current ?? 0) >= amount;
  };

  // Check if multiple resources are available
  const hasResources = (resources: Record<ResourceType | ResourceTypeString, number>) => {
    return Object.entries(resources).every(([type, amount]) => {
      const enumType = ensureEnumResourceType(type);
      return hasResource(enumType, amount);
    });
  };

  // Consume a resource
  const consumeResource = (type: ResourceType | ResourceTypeString, amount: number) => {
    const enumType = ensureEnumResourceType(type);
    const currentAmount = resourceStates.get(enumType)?.current ?? 0;
    if (currentAmount < amount) return false;

    setResourceStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(enumType) ?? { ...defaultResourceState };
      newStates.set(enumType, {
        ...currentState,
        current: currentAmount - amount,
      });
      return newStates;
    });
    return true;
  };

  // Consume multiple resources
  const consumeResources = (resources: Record<ResourceType | ResourceTypeString, number>) => {
    const canConsume = hasResources(resources);
    if (!canConsume) return false;

    setResourceStates(prev => {
      const newStates = new Map(prev);
      Object.entries(resources).forEach(([type, amount]) => {
        const enumType = ensureEnumResourceType(type);
        const currentState = newStates.get(enumType) ?? { ...defaultResourceState };
        const currentAmount = currentState.current;
        newStates.set(enumType, {
          ...currentState,
          current: currentAmount - amount,
        });
      });
      return newStates;
    });
    return true;
  };

  // Add a resource
  const addResource = (type: ResourceType | ResourceTypeString, amount: number) => {
    const enumType = ensureEnumResourceType(type);
    setResourceStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(enumType) ?? { ...defaultResourceState };
      newStates.set(enumType, {
        ...currentState,
        current: currentState.current + amount,
      });
      return newStates;
    });
  };

  // Add multiple resources
  const addResources = (resources: Record<ResourceType | ResourceTypeString, number>) => {
    setResourceStates(prev => {
      const newStates = new Map(prev);
      Object.entries(resources).forEach(([type, amount]) => {
        const enumType = ensureEnumResourceType(type);
        const currentState = newStates.get(enumType) ?? { ...defaultResourceState };
        newStates.set(enumType, {
          ...currentState,
          current: currentState.current + amount,
        });
      });
      return newStates;
    });
  };

  // Get resource production rate
  const getProductionRate = useCallback(
    (type: ResourceType | ResourceTypeString): number => {
      const enumType = ensureEnumResourceType(type);
      return resourceStates.get(enumType)?.production ?? 0;
    },
    [resourceStates]
  );

  // Get resource consumption rate
  const getConsumptionRate = useCallback(
    (type: ResourceType | ResourceTypeString): number => {
      const enumType = ensureEnumResourceType(type);
      return resourceStates.get(enumType)?.consumption ?? 0;
    },
    [resourceStates]
  );

  // Set resource production rate
  const setProductionRate = useCallback(
    (type: ResourceType | ResourceTypeString, rate: number): void => {
      const enumType = ensureEnumResourceType(type);
      resourceManager.setResourceProduction(enumType, rate);
    },
    []
  );

  // Set resource consumption rate
  const setConsumptionRate = useCallback(
    (type: ResourceType | ResourceTypeString, rate: number): void => {
      const enumType = ensureEnumResourceType(type);
      resourceManager.setResourceConsumption(enumType, rate);
    },
    []
  );

  // Get resource capacity
  const getResourceCapacity = useCallback(
    (type: ResourceType | ResourceTypeString): number => {
      const enumType = ensureEnumResourceType(type);
      return resourceStates.get(enumType)?.max ?? 0;
    },
    [resourceStates]
  );

  // Get resource percentage
  const getResourcePercentage = useCallback(
    (type: ResourceType | ResourceTypeString): number => {
      const enumType = ensureEnumResourceType(type);
      const state = resourceStates.get(enumType);
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

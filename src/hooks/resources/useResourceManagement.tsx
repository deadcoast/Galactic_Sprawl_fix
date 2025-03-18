import { useCallback, useEffect, useMemo, useState } from 'react';
import { ResourceManager } from '../../managers/game/ResourceManager';
import {
  ResourceIntegration,
  createResourceIntegration,
} from '../../managers/resource/ResourceIntegration';
import {
  ResourceState,
  ResourceType,
  ResourceTypeString,
  ResourceType as StringResourceType,
} from '../../types/resources/ResourceTypes';
import { ResourceTypeConverter } from '../../utils/ResourceTypeConverter';

// Create an instance of ResourceManager
const resourceManager = new ResourceManager();

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

  // Get or create the resource integration
  const integration = useMemo(() => getResourceIntegration(), []);

  // Initialize the resource states
  useEffect(() => {
    // Get all resource types
    const resourceTypes = Array.from(resourceManager['resources'].keys()) as StringResourceType[];

    // Create a map of resource states
    const states = new Map<StringResourceType, ResourceState>();
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

    const frameId = requestAnimationFrame(_time => {
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
  const getResourceState = (type: ResourceType | ResourceTypeString) => {
    const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
    return resourceStates.get(enumType) || defaultResourceState;
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
    const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
    return resourceStates.get(enumType)?.current ?? 0;
  };

  // Check if a resource is available
  const hasResource = (type: ResourceType | ResourceTypeString, amount: number) => {
    const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
    return (resourceStates.get(enumType)?.current ?? 0) >= amount;
  };

  // Check if multiple resources are available
  const hasResources = (resources: Record<ResourceType | ResourceTypeString, number>) => {
    return Object.entries(resources).every(([type, amount]) => {
      const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
      return hasResource(enumType, amount);
    });
  };

  // Consume a resource
  const consumeResource = (type: ResourceType | ResourceTypeString, amount: number) => {
    const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
    const currentAmount = resourceStates.get(enumType)?.current ?? 0;
    if (currentAmount < amount) return false;

    setResourceStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(enumType) || { ...defaultResourceState };
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
        const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
        const currentState = newStates.get(enumType) || { ...defaultResourceState };
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
    const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
    setResourceStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(enumType) || { ...defaultResourceState };
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
        const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
        const currentState = newStates.get(enumType) || { ...defaultResourceState };
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
      const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
      return resourceStates.get(enumType)?.production ?? 0;
    },
    [resourceStates]
  );

  // Get resource consumption rate
  const getConsumptionRate = useCallback(
    (type: ResourceType | ResourceTypeString): number => {
      const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
      return resourceStates.get(enumType)?.consumption ?? 0;
    },
    [resourceStates]
  );

  // Set resource production rate
  const setProductionRate = useCallback(
    (type: ResourceType | ResourceTypeString, rate: number): void => {
      const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
      resourceManager.setResourceProduction(enumType, rate);
    },
    []
  );

  // Set resource consumption rate
  const setConsumptionRate = useCallback(
    (type: ResourceType | ResourceTypeString, rate: number): void => {
      const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
      resourceManager.setResourceConsumption(enumType, rate);
    },
    []
  );

  // Get resource capacity
  const getResourceCapacity = useCallback(
    (type: ResourceType | ResourceTypeString): number => {
      const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
      return resourceStates.get(enumType)?.max ?? 0;
    },
    [resourceStates]
  );

  // Get resource percentage
  const getResourcePercentage = useCallback(
    (type: ResourceType | ResourceTypeString): number => {
      const enumType = ResourceTypeConverter.ensureEnumResourceType(type);
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

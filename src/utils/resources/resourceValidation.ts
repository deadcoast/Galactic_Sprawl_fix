import {
  AdvancedResource,
  BasicResource,
  ResourceConsumption,
  ResourceContainer,
  ResourceCost,
  ResourceFlow,
  ResourcePool,
  ResourceProduction,
  ResourceState,
  ResourceStorage,
  ResourceThreshold,
  ResourceTransfer,
  ResourceType,
  SpecialResource,
} from '../../types/resources/ResourceTypes';

/**
 * Type guard for ResourceType
 */
export function isResourceType(value: unknown): value is ResourceType {
  const validTypes: ResourceType[] = [
    'minerals',
    'energy',
    'population',
    'research',
    'plasma',
    'gas',
    'exotic',
  ];
  return typeof value === 'string' && validTypes.includes(value as ResourceType);
}

/**
 * Validates a ResourceState object
 */
export function validateResourceState(state: ResourceState): boolean {
  if (typeof state !== 'object' || state === null) {
    return false;
  }

  return (
    typeof state.current === 'number' &&
    typeof state.max === 'number' &&
    typeof state.min === 'number' &&
    typeof state.production === 'number' &&
    typeof state.consumption === 'number' &&
    state.min <= state.current &&
    state.current <= state.max
  );
}

/**
 * Validates a ResourceTransfer object
 */
export function validateResourceTransfer(transfer: ResourceTransfer): boolean {
  if (typeof transfer !== 'object' || transfer === null) {
    return false;
  }

  return (
    isResourceType(transfer.type) &&
    typeof transfer.amount === 'number' &&
    transfer.amount > 0 &&
    typeof transfer.source === 'string' &&
    typeof transfer.target === 'string' &&
    typeof transfer.timestamp === 'number'
  );
}

/**
 * Validates a ResourceThreshold object
 */
export function validateResourceThreshold(threshold: ResourceThreshold): boolean {
  if (typeof threshold !== 'object' || threshold === null) {
    return false;
  }

  // Type must be valid
  if (!isResourceType(threshold.type)) {
    return false;
  }

  // At least one threshold value must be defined
  if (
    threshold.min === undefined &&
    threshold.max === undefined &&
    threshold.target === undefined
  ) {
    return false;
  }

  // Validate threshold values if defined
  if (threshold.min !== undefined && typeof threshold.min !== 'number') {
    return false;
  }
  if (threshold.max !== undefined && typeof threshold.max !== 'number') {
    return false;
  }
  if (threshold.target !== undefined && typeof threshold.target !== 'number') {
    return false;
  }

  // Ensure min <= target <= max if all are defined
  if (
    threshold.min !== undefined &&
    threshold.max !== undefined &&
    threshold.target !== undefined &&
    !(threshold.min <= threshold.target && threshold.target <= threshold.max)
  ) {
    return false;
  }

  // Ensure min <= max if both are defined
  if (threshold.min !== undefined && threshold.max !== undefined && threshold.min > threshold.max) {
    return false;
  }

  return true;
}

/**
 * Validates a ResourceProduction object
 */
export function validateResourceProduction(production: ResourceProduction): boolean {
  if (typeof production !== 'object' || production === null) {
    return false;
  }

  // Basic properties validation
  const basicValid =
    isResourceType(production.type) &&
    typeof production.amount === 'number' &&
    production.amount >= 0 &&
    typeof production.interval === 'number' &&
    production.interval > 0;

  if (!basicValid) {
    return false;
  }

  // Validate conditions if defined
  if (production.conditions) {
    if (!Array.isArray(production.conditions)) {
      return false;
    }

    for (const condition of production.conditions) {
      if (!validateResourceThreshold(condition)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates a ResourceConsumption object
 */
export function validateResourceConsumption(consumption: ResourceConsumption): boolean {
  if (typeof consumption !== 'object' || consumption === null) {
    return false;
  }

  // Basic properties validation
  const basicValid =
    isResourceType(consumption.type) &&
    typeof consumption.amount === 'number' &&
    consumption.amount >= 0 &&
    typeof consumption.interval === 'number' &&
    consumption.interval > 0 &&
    typeof consumption.required === 'boolean';

  if (!basicValid) {
    return false;
  }

  // Validate conditions if defined
  if (consumption.conditions) {
    if (!Array.isArray(consumption.conditions)) {
      return false;
    }

    for (const condition of consumption.conditions) {
      if (!validateResourceThreshold(condition)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates a ResourceFlow object
 */
export function validateResourceFlow(flow: ResourceFlow): boolean {
  if (typeof flow !== 'object' || flow === null) {
    return false;
  }

  // Basic properties validation
  const basicValid =
    typeof flow.source === 'string' &&
    typeof flow.target === 'string' &&
    Array.isArray(flow.resources) &&
    flow.resources.length > 0;

  if (!basicValid) {
    return false;
  }

  // Validate resources
  for (const resource of flow.resources) {
    if (
      !isResourceType(resource.type) ||
      typeof resource.amount !== 'number' ||
      resource.amount <= 0 ||
      typeof resource.interval !== 'number' ||
      resource.interval <= 0
    ) {
      return false;
    }
  }

  // Validate conditions if defined
  if (flow.conditions) {
    if (!Array.isArray(flow.conditions)) {
      return false;
    }

    for (const condition of flow.conditions) {
      if (!validateResourceThreshold(condition)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates a ResourceCost object
 */
export function validateResourceCost(cost: ResourceCost): boolean {
  if (typeof cost !== 'object' || cost === null) {
    return false;
  }

  return isResourceType(cost.type) && typeof cost.amount === 'number' && cost.amount >= 0;
}

/**
 * Validates an array of ResourceCost objects
 */
export function validateResourceCosts(costs: ResourceCost[]): boolean {
  if (!Array.isArray(costs)) {
    return false;
  }

  for (const cost of costs) {
    if (!validateResourceCost(cost)) {
      return false;
    }
  }

  return true;
}

/**
 * Type guard for BasicResource
 */
export function isBasicResource(resource: unknown): resource is BasicResource {
  if (typeof resource !== 'object' || resource === null) {
    return false;
  }

  return (
    'id' in resource &&
    'name' in resource &&
    'type' in resource &&
    'category' in resource &&
    resource.category === 'basic'
  );
}

/**
 * Type guard for AdvancedResource
 */
export function isAdvancedResource(resource: unknown): resource is AdvancedResource {
  if (typeof resource !== 'object' || resource === null) {
    return false;
  }

  return (
    'id' in resource &&
    'name' in resource &&
    'type' in resource &&
    'category' in resource &&
    'components' in resource &&
    resource.category === 'advanced' &&
    Array.isArray(resource.components)
  );
}

/**
 * Type guard for SpecialResource
 */
export function isSpecialResource(resource: unknown): resource is SpecialResource {
  if (typeof resource !== 'object' || resource === null) {
    return false;
  }

  return (
    'id' in resource &&
    'name' in resource &&
    'type' in resource &&
    'category' in resource &&
    'rarity' in resource &&
    resource.category === 'special'
  );
}

/**
 * Type guard for ResourceContainer
 */
export function isResourceContainer(container: unknown): container is ResourceContainer {
  if (typeof container !== 'object' || container === null) {
    return false;
  }

  return (
    'id' in container &&
    'name' in container &&
    'capacity' in container &&
    typeof container.capacity === 'number' &&
    container.capacity > 0
  );
}

/**
 * Type guard for ResourcePool
 */
export function isResourcePool(pool: unknown): pool is ResourcePool {
  if (!isResourceContainer(pool)) {
    return false;
  }

  return (
    'type' in pool &&
    'poolType' in pool &&
    (pool.poolType === 'global' || pool.poolType === 'module')
  );
}

/**
 * Type guard for ResourceStorage
 */
export function isResourceStorage(storage: unknown): storage is ResourceStorage {
  if (!isResourceContainer(storage)) {
    return false;
  }

  return (
    'type' in storage &&
    'storageType' in storage &&
    (storage.storageType === 'basic' || storage.storageType === 'advanced') &&
    'efficiency' in storage &&
    typeof storage.efficiency === 'number' &&
    storage.efficiency > 0 &&
    storage.efficiency <= 1
  );
}

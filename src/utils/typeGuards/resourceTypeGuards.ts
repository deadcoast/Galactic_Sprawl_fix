import
  {
    ResourceConsumption,
    ResourceCost,
    ResourceFlow,
    ResourceProduction,
    ResourceState,
    ResourceThreshold,
    ResourceTransfer,
    ResourceType,
    ResourceTypeString,
  } from '../../types/resources/ResourceTypes';
import { ResourceTypeConverter } from '../ResourceTypeConverter';

// Re-export converter for use elsewhere
export { ResourceTypeConverter };

// Define interfaces for resource types that are missing from ResourceTypes.ts
export interface BasicResource {
  id: string;
  type: ResourceType;
  name: string;
  category: 'basic';
}

export interface AdvancedResource {
  id: string;
  type: ResourceType;
  name: string;
  category: 'advanced';
}

export interface SpecialResource {
  id: string;
  type: ResourceType;
  name: string;
  category: 'special';
}

export interface ResourceContainer {
  id: string;
  resources: Record<ResourceType, ResourceState>;
}

export interface ResourcePool {
  id: string;
  resources: Record<ResourceType, number>;
}

export interface ResourceStorage {
  id: string;
  capacity: Record<ResourceType, number>;
  stored: Record<ResourceType, number>;
}

/**
 * Check if a value is a valid string resource type representation (key of the enum)
 */
function isValidStringType(value: unknown): value is ResourceTypeString {
  return typeof value === 'string' && value in ResourceType;
}

/**
 * Check if a value is a valid enum resource type (value of the enum)
 */
function isValidEnumValue(value: unknown): value is ResourceType {
  return typeof value === 'string' && Object.values(ResourceType).includes(value as ResourceType);
}

/**
 * Type guard for enum ResourceType
 */
export function isEnumResourceType(value: unknown): value is ResourceType {
  return isValidEnumValue(value);
}

/**
 * Type guard for string ResourceType
 */
export function isStringResourceType(value: unknown): value is ResourceTypeString {
  return typeof value === 'string' && isValidStringType(value);
}

/**
 * Type guard for ResourceType (supports both string and enum types)
 */
export function isResourceType(value: unknown): value is ResourceTypeString | ResourceType {
  // Check if it's an enum ResourceType
  if (isEnumResourceType(value)) {
    return true;
  }

  // Check if it's a string ResourceType
  if (isStringResourceType(value)) {
    return true;
  }

  return false;
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
  if (!isResourceType(threshold.resourceId)) {
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

  return isResourceType(cost.type) && typeof cost.amount === 'number' && cost.amount > 0;
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

  const basicResource = resource as BasicResource;
  return (
    typeof basicResource.id === 'string' &&
    isResourceType(basicResource.type) &&
    typeof basicResource.name === 'string' &&
    basicResource.category === 'basic'
  );
}

/**
 * Type guard for AdvancedResource
 */
export function isAdvancedResource(resource: unknown): resource is AdvancedResource {
  if (typeof resource !== 'object' || resource === null) {
    return false;
  }

  const advancedResource = resource as AdvancedResource;
  return (
    typeof advancedResource.id === 'string' &&
    isResourceType(advancedResource.type) &&
    typeof advancedResource.name === 'string' &&
    advancedResource.category === 'advanced'
  );
}

/**
 * Type guard for SpecialResource
 */
export function isSpecialResource(resource: unknown): resource is SpecialResource {
  if (typeof resource !== 'object' || resource === null) {
    return false;
  }

  const specialResource = resource as SpecialResource;
  return (
    typeof specialResource.id === 'string' &&
    isResourceType(specialResource.type) &&
    typeof specialResource.name === 'string' &&
    specialResource.category === 'special'
  );
}

/**
 * Type guard for ResourceContainer
 */
export function isResourceContainer(container: unknown): container is ResourceContainer {
  if (typeof container !== 'object' || container === null) {
    return false;
  }

  const resourceContainer = container as ResourceContainer;
  if (typeof resourceContainer.id !== 'string' || typeof resourceContainer.resources !== 'object') {
    return false;
  }

  // Check that all resources are valid ResourceState objects
  for (const resourceType in resourceContainer.resources) {
    if (
      !validateResourceState(resourceContainer.resources[resourceType as unknown as ResourceType])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Type guard for ResourcePool
 */
export function isResourcePool(pool: unknown): pool is ResourcePool {
  if (typeof pool !== 'object' || pool === null) {
    return false;
  }

  const resourcePool = pool as ResourcePool;
  if (typeof resourcePool.id !== 'string' || typeof resourcePool.resources !== 'object') {
    return false;
  }

  // Check that all resources are numbers
  for (const resourceType in resourcePool.resources) {
    if (typeof resourcePool.resources[resourceType as unknown as ResourceType] !== 'number') {
      return false;
    }
  }

  return true;
}

/**
 * Type guard for ResourceStorage
 */
export function isResourceStorage(storage: unknown): storage is ResourceStorage {
  if (typeof storage !== 'object' || storage === null) {
    return false;
  }

  const resourceStorage = storage as ResourceStorage;
  if (
    typeof resourceStorage.id !== 'string' ||
    typeof resourceStorage.capacity !== 'object' ||
    typeof resourceStorage.stored !== 'object'
  ) {
    return false;
  }

  // Check that all capacity values are numbers
  for (const resourceType in resourceStorage.capacity) {
    if (typeof resourceStorage.capacity[resourceType as unknown as ResourceType] !== 'number') {
      return false;
    }
  }

  // Check that all stored values are numbers
  for (const resourceType in resourceStorage.stored) {
    if (typeof resourceStorage.stored[resourceType as unknown as ResourceType] !== 'number') {
      return false;
    }
  }

  return true;
}

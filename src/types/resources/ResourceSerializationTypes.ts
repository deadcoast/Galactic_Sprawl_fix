import { ResourceAlert, ResourceType } from './ResourceTypes';

/**
 * Interface for serialized resource data
 * Used for localStorage persistence
 */
export interface SerializedResource {
  current: number;
  capacity: number;
  production: number;
  consumption: number;
  history?: Array<{
    timestamp: number;
    amount: number;
    type: 'production' | 'consumption' | 'transfer';
  }>;
}

/**
 * Interface for serialized threshold data
 * Used for localStorage persistence
 */
export interface SerializedThreshold {
  min?: number;
  max?: number;
  target?: number;
  alert?: boolean;
}

/**
 * Interface for serialized resource state
 * Used for localStorage persistence
 */
export interface SerializedResourceState {
  resources: Record<ResourceType, SerializedResource>;
  thresholds: Record<string, SerializedThreshold[]>;
  alerts: ResourceAlert[];
  timestamp?: number;
}

/**
 * Interface for resource totals
 * Used for summary calculations
 */
export interface ResourceTotals {
  production: number;
  consumption: number;
  net: number;
  amounts?: Record<ResourceType, number>;
  capacities?: Record<ResourceType, number>;
  rates?: Record<ResourceType, number>;
}

/**
 * Type guard for SerializedResource
 */
export function isSerializedResource(obj: any): obj is SerializedResource {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'current' in obj &&
    'capacity' in obj &&
    'production' in obj &&
    'consumption' in obj
  );
}

/**
 * Type guard for SerializedResourceState
 */
export function isSerializedResourceState(obj: any): obj is SerializedResourceState {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'resources' in obj &&
    'thresholds' in obj &&
    'alerts' in obj
  );
}

/**
 * Helper function to convert Map to Record for serialization
 */
export function serializeResourceMap(map: Map<ResourceType, any>): Record<ResourceType, any> {
  const record: Record<ResourceType, any> = {} as Record<ResourceType, any>;

  // Convert Map entries to array to avoid MapIterator error
  Array.from(map.entries()).forEach(([key, value]) => {
    record[key] = value;
  });

  return record;
}

/**
 * Helper function to convert Record to Map for deserialization
 */
export function deserializeResourceMap<T>(record: Record<ResourceType, T>): Map<ResourceType, T> {
  const map = new Map<ResourceType, T>();

  Object.entries(record).forEach(([key, value]) => {
    map.set(key as ResourceType, value);
  });

  return map;
}

/**
 * Helper function to provide default values for a resource
 */
export function getResourceWithDefaults(resource: Partial<SerializedResource>): SerializedResource {
  return {
    current: resource.current ?? 0,
    capacity: resource.capacity ?? 100,
    production: resource.production ?? 0,
    consumption: resource.consumption ?? 0,
    history: resource.history ?? [],
  };
}

/**
 * Helper function to validate a serialized resource state
 */
export function validateResourceState(state: SerializedResourceState): boolean {
  if (!state.resources || typeof state.resources !== 'object') return false;
  if (!state.thresholds || typeof state.thresholds !== 'object') return false;
  if (!Array.isArray(state.alerts)) return false;

  // Check each resource
  for (const key in state.resources) {
    const resource = state.resources[key as ResourceType];
    if (!isSerializedResource(resource)) return false;
  }

  return true;
}

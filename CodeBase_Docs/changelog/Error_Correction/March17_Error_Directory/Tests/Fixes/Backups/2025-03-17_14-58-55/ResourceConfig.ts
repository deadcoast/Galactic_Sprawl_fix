import { ResourceType, ResourceTypeInfo } from '../../types/resources/ResourceTypes';

/**
 * Resource manager configuration type
 */
export interface ResourceManagerConfig {
  maxTransferHistory: number;
  defaultResourceLimits: { [key in ResourceType]: { min: number; max: number } };
}

/**
 * Default resource limits configuration using standardized enum
 */
const DEFAULT_RESOURCE_LIMITS: { [key in ResourceType]: { min: number; max: number } } = {
  [ResourceType.MINERALS]: { min: 0, max: 10000 },
  [ResourceType.ENERGY]: { min: 0, max: 5000 },
  [ResourceType.POPULATION]: { min: 0, max: 1000 },
  [ResourceType.RESEARCH]: { min: 0, max: 2000 },
  [ResourceType.PLASMA]: { min: 0, max: 1000 },
  [ResourceType.GAS]: { min: 0, max: 3000 },
  [ResourceType.EXOTIC]: { min: 0, max: 500 },
  [ResourceType.ORGANIC]: { min: 0, max: 2000 },
  // Add all other resource types with default values
  [ResourceType.IRON]: { min: 0, max: ResourceTypeInfo[ResourceType.IRON].defaultMax },
  [ResourceType.COPPER]: { min: 0, max: ResourceTypeInfo[ResourceType.COPPER].defaultMax },
  [ResourceType.TITANIUM]: { min: 0, max: ResourceTypeInfo[ResourceType.TITANIUM].defaultMax },
  [ResourceType.URANIUM]: { min: 0, max: ResourceTypeInfo[ResourceType.URANIUM].defaultMax },
  [ResourceType.WATER]: { min: 0, max: ResourceTypeInfo[ResourceType.WATER].defaultMax },
  [ResourceType.HELIUM]: { min: 0, max: ResourceTypeInfo[ResourceType.HELIUM].defaultMax },
  [ResourceType.DEUTERIUM]: { min: 0, max: ResourceTypeInfo[ResourceType.DEUTERIUM].defaultMax },
  [ResourceType.ANTIMATTER]: { min: 0, max: ResourceTypeInfo[ResourceType.ANTIMATTER].defaultMax },
  [ResourceType.DARK_MATTER]: {
    min: 0,
    max: ResourceTypeInfo[ResourceType.DARK_MATTER].defaultMax,
  },
  [ResourceType.EXOTIC_MATTER]: {
    min: 0,
    max: ResourceTypeInfo[ResourceType.EXOTIC_MATTER].defaultMax,
  },
};

/**
 * Resource manager configuration
 */
export const RESOURCE_MANAGER_CONFIG: ResourceManagerConfig = {
  maxTransferHistory: 1000,
  defaultResourceLimits: DEFAULT_RESOURCE_LIMITS,
};

/**
 * Production interval configuration (in milliseconds)
 */
export const PRODUCTION_INTERVALS = {
  FAST: 1000, // 1 second
  NORMAL: 5000, // 5 seconds
  SLOW: 15000, // 15 seconds
} as const;

/**
 * Resource thresholds for automation
 */
export const RESOURCE_THRESHOLDS = {
  LOW: 0.2, // 20% of max capacity
  MEDIUM: 0.5, // 50% of max capacity
  HIGH: 0.8, // 80% of max capacity
  CRITICAL: 0.95, // 95% of max capacity
} as const;

/**
 * Default resource production rates (units per interval)
 */
export const DEFAULT_PRODUCTION_RATES: { [key in ResourceType]: number } = {
  [ResourceType.MINERALS]: 10,
  [ResourceType.ENERGY]: 5,
  [ResourceType.POPULATION]: 1,
  [ResourceType.RESEARCH]: 2,
  [ResourceType.PLASMA]: 3,
  [ResourceType.GAS]: 4,
  [ResourceType.EXOTIC]: 1,
  [ResourceType.ORGANIC]: 3,
  // Add all other resource types with default values
  [ResourceType.IRON]: 8,
  [ResourceType.COPPER]: 7,
  [ResourceType.TITANIUM]: 5,
  [ResourceType.URANIUM]: 2,
  [ResourceType.WATER]: 6,
  [ResourceType.HELIUM]: 3,
  [ResourceType.DEUTERIUM]: 2,
  [ResourceType.ANTIMATTER]: 0.5,
  [ResourceType.DARK_MATTER]: 0.2,
  [ResourceType.EXOTIC_MATTER]: 0.1,
};

/**
 * Default resource consumption rates (units per interval)
 */
export const DEFAULT_CONSUMPTION_RATES: { [key in ResourceType]: number } = {
  [ResourceType.MINERALS]: 5,
  [ResourceType.ENERGY]: 3,
  [ResourceType.POPULATION]: 0.5,
  [ResourceType.RESEARCH]: 1,
  [ResourceType.PLASMA]: 2,
  [ResourceType.GAS]: 2,
  [ResourceType.EXOTIC]: 0.5,
  [ResourceType.ORGANIC]: 1.5,
  // Add all other resource types with default values
  [ResourceType.IRON]: 4,
  [ResourceType.COPPER]: 3,
  [ResourceType.TITANIUM]: 2,
  [ResourceType.URANIUM]: 1,
  [ResourceType.WATER]: 3,
  [ResourceType.HELIUM]: 1.5,
  [ResourceType.DEUTERIUM]: 1,
  [ResourceType.ANTIMATTER]: 0.2,
  [ResourceType.DARK_MATTER]: 0.1,
  [ResourceType.EXOTIC_MATTER]: 0.05,
};

/**
 * Resource transfer configuration
 */
export const TRANSFER_CONFIG = {
  MIN_AMOUNT: 1,
  MAX_BATCH_SIZE: 100,
  DEFAULT_INTERVAL: 2000, // 2 seconds
  TRANSFER_RATE_MULTIPLIER: 1.5, // 50% bonus for direct transfers
} as const;

/**
 * Resource storage efficiency multipliers
 */
export const STORAGE_EFFICIENCY = {
  BASE: 1.0,
  UPGRADED: 1.2,
  ADVANCED: 1.5,
  OPTIMAL: 2.0,
} as const;

/**
 * Resource type priorities (higher = more important)
 */
export const RESOURCE_PRIORITIES: { [key in ResourceType]: number } = {
  [ResourceType.ENERGY]: 100, // Critical resource
  [ResourceType.POPULATION]: 90,
  [ResourceType.MINERALS]: 80,
  [ResourceType.RESEARCH]: 70,
  [ResourceType.PLASMA]: 60,
  [ResourceType.GAS]: 50,
  [ResourceType.EXOTIC]: 40,
  [ResourceType.ORGANIC]: 45,
  // Add all other resource types with appropriate priorities
  [ResourceType.IRON]: 75,
  [ResourceType.COPPER]: 73,
  [ResourceType.TITANIUM]: 78,
  [ResourceType.URANIUM]: 65,
  [ResourceType.WATER]: 85,
  [ResourceType.HELIUM]: 55,
  [ResourceType.DEUTERIUM]: 58,
  [ResourceType.ANTIMATTER]: 45,
  [ResourceType.DARK_MATTER]: 42,
  [ResourceType.EXOTIC_MATTER]: 38,
};

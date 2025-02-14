import { ResourceManagerConfig, ResourceType } from '../../types/resources/ResourceTypes';

/**
 * Default resource limits configuration
 */
const DEFAULT_RESOURCE_LIMITS: { [key in ResourceType]: { min: number; max: number } } = {
  minerals: { min: 0, max: 10000 },
  energy: { min: 0, max: 5000 },
  population: { min: 0, max: 1000 },
  research: { min: 0, max: 2000 },
  plasma: { min: 0, max: 1000 },
  gas: { min: 0, max: 3000 },
  exotic: { min: 0, max: 500 },
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
  minerals: 10,
  energy: 5,
  population: 1,
  research: 2,
  plasma: 3,
  gas: 4,
  exotic: 1,
};

/**
 * Default resource consumption rates (units per interval)
 */
export const DEFAULT_CONSUMPTION_RATES: { [key in ResourceType]: number } = {
  minerals: 5,
  energy: 3,
  population: 0.5,
  research: 1,
  plasma: 2,
  gas: 2,
  exotic: 0.5,
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
  energy: 100, // Critical resource
  population: 90,
  minerals: 80,
  research: 70,
  plasma: 60,
  gas: 50,
  exotic: 40,
};

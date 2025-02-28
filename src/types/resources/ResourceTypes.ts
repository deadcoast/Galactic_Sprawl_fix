/**
 * Resource types
 */
export type ResourceType =
  | 'minerals'
  | 'energy'
  | 'population'
  | 'research'
  | 'plasma'
  | 'gas'
  | 'exotic';

/**
 * Resource categories
 */
export type ResourceCategory = 'basic' | 'advanced' | 'special';

/**
 * Resource rarity levels
 */
export type ResourceRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/**
 * Base Resource interface
 */
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  category: ResourceCategory;
  description?: string;
  icon?: string;
}

/**
 * Basic Resource (raw materials)
 */
export interface BasicResource extends Resource {
  category: 'basic';
  extractionRate?: number;
  baseValue?: number;
}

/**
 * Advanced Resource (processed materials)
 */
export interface AdvancedResource extends Resource {
  category: 'advanced';
  components: ResourceCost[];
  processingTime?: number;
  baseValue?: number;
}

/**
 * Special Resource (rare/unique materials)
 */
export interface SpecialResource extends Resource {
  category: 'special';
  rarity: ResourceRarity;
  discoveryChance?: number;
  baseValue?: number;
  specialProperties?: string[];
}

/**
 * Resource cost
 */
export interface ResourceCost {
  type: ResourceType;
  amount: number;
}

/**
 * Resource state
 */
export interface ResourceState {
  current: number;
  max: number;
  min: number;
  production: number;
  consumption: number;
}

/**
 * Resource transfer
 */
export interface ResourceTransfer {
  type: ResourceType;
  amount: number;
  source: string;
  target: string;
  timestamp: number;
}

/**
 * Resource threshold configuration
 */
export interface ResourceThreshold {
  type: ResourceType;
  min?: number;
  max?: number;
  target?: number;
}

/**
 * Resource production configuration
 */
export interface ResourceProduction {
  type: ResourceType;
  amount: number;
  interval: number;
  conditions?: ResourceThreshold[];
}

/**
 * Resource consumption configuration
 */
export interface ResourceConsumption {
  type: ResourceType;
  amount: number;
  interval: number;
  required: boolean;
  conditions?: ResourceThreshold[];
}

/**
 * Resource flow configuration
 */
export interface ResourceFlow {
  source: string;
  target: string;
  resources: {
    type: ResourceType;
    amount: number;
    interval: number;
  }[];
  conditions?: ResourceThreshold[];
}

/**
 * Resource manager configuration
 */
export interface ResourceManagerConfig {
  maxTransferHistory: number;
  defaultResourceLimits: {
    [key in ResourceType]: {
      min: number;
      max: number;
    };
  };
}

/**
 * Base Resource Container interface
 */
export interface ResourceContainer {
  id: string;
  name: string;
  capacity: number;
  description?: string;
  resources?: Map<ResourceType, number>;
}

/**
 * Resource Pool Types
 */
export type ResourcePoolType = 'global' | 'module';

/**
 * Resource Pool (for resource management)
 */
export interface ResourcePool extends ResourceContainer {
  type: ResourceType;
  poolType: ResourcePoolType;
  priority?: number;
  autoDistribute?: boolean;
}

/**
 * Resource Storage Types
 */
export type ResourceStorageType = 'basic' | 'advanced';

/**
 * Resource Storage (for resource storage)
 */
export interface ResourceStorage extends ResourceContainer {
  type: ResourceType;
  storageType: ResourceStorageType;
  efficiency: number;
  upgradeLevel?: number;
  maxUpgradeLevel?: number;
}

/**
 * Resource Exchange Rate
 */
export interface ResourceExchangeRate {
  fromType: ResourceType;
  toType: ResourceType;
  rate: number;
  minAmount?: number;
  maxAmount?: number;
  cooldown?: number;
}

/**
 * Resource Priority Configuration
 */
export interface ResourcePriority {
  type: ResourceType;
  priority: number;
  consumers: string[];
}

/**
 * Resource Extraction Configuration
 */
export interface ResourceExtraction {
  type: ResourceType;
  baseRate: number;
  efficiency: number;
  bonusFactors?: {
    [key: string]: number;
  };
}

/**
 * Resource Alert Configuration
 */
export interface ResourceAlert {
  id: string;
  type: ResourceType;
  threshold: ResourceThreshold;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResolve?: boolean;
  actions?: {
    type: 'production' | 'consumption' | 'transfer';
    target: string;
    amount: number;
  }[];
}

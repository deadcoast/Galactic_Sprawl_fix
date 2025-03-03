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

/**
 * Resource Conversion Recipe
 *
 * Defines how one set of resources is converted to another
 */
export interface ResourceConversionRecipe {
  id: string;
  name: string;
  description?: string;
  inputs: ResourceCost[];
  outputs: ResourceCost[];
  processingTime: number; // Time in milliseconds to complete one conversion cycle
  baseEfficiency: number; // Base efficiency (1.0 = 100%)
}

/**
 * Resource Conversion Process
 *
 * Represents an active conversion process
 */
export interface ResourceConversionProcess {
  recipeId: string;
  progress: number; // Progress from 0 to 1
  startTime: number; // Timestamp when the process started
  endTime: number; // Timestamp when the process will complete
  sourceId: string; // ID of the converter node
  active: boolean; // Whether the process is active
  paused: boolean; // Whether the process is paused
  inputsProvided: boolean; // Whether the required inputs have been provided
  appliedEfficiency?: number; // The efficiency applied to this process
}

/**
 * Multi-Step Conversion Chain
 *
 * Represents a sequence of conversion recipes that form a production chain
 */
export interface ConversionChain {
  id: string;
  name: string;
  description?: string;
  steps: string[]; // Array of recipe IDs in sequence
  active: boolean;
}

/**
 * Chain Execution Status
 *
 * Tracks the execution status of a multi-step conversion chain
 */
export interface ChainExecutionStatus {
  chainId: string;
  currentStepIndex: number;
  recipeIds: string[];
  startTime: number;
  estimatedEndTime: number;
  progress: number; // Overall progress from 0 to 1
  stepStatus: {
    recipeId: string;
    converterId: string;
    processId?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
  }[];
  resourceTransfers: {
    type: ResourceType;
    amount: number;
    fromStep: number;
    toStep: number;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  active: boolean;
  paused: boolean;
  completed: boolean;
  failed: boolean;
  errorMessage?: string;
}

/**
 * Converter Node Configuration
 *
 * Configuration for a converter node in the resource network
 */
export interface ConverterNodeConfig {
  supportedRecipes: string[]; // IDs of recipes this converter can process
  maxConcurrentProcesses: number; // Maximum number of concurrent conversion processes
  autoStart: boolean; // Whether to automatically start conversion when inputs are available
  queueBehavior: 'fifo' | 'priority'; // How to handle the process queue
  byproducts?: { [key in ResourceType]?: number }; // Chance to produce byproducts (0-1)
  efficiencyModifiers?: { [key: string]: number }; // Modifiers that affect efficiency
  tier?: 1 | 2 | 3; // Technology tier of the converter
  chainBonus?: number; // Bonus when used in a conversion chain
}

/**
 * Converter Process Status
 *
 * Detailed status information about a converter's processing
 */
export interface ConverterProcessStatus {
  activeProcesses: ResourceConversionProcess[];
  queuedProcesses: ResourceConversionProcess[];
  completedProcesses: number;
  failedProcesses: number;
  totalResourcesProduced: { [key in ResourceType]?: number };
  totalResourcesConsumed: { [key in ResourceType]?: number };
  averageEfficiency: number;
  uptime: number; // Total time the converter has been active
}

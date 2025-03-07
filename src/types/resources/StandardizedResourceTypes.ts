/**
 * Standardized resource type definitions to ensure consistency across the codebase.
 * This file addresses the type inconsistencies identified in the resource system analysis.
 */

/**
 * ResourceType as an enum for better type safety and intellisense support
 */
export enum ResourceType {
  MINERALS = 'minerals',
  ENERGY = 'energy',
  POPULATION = 'population',
  RESEARCH = 'research',
  PLASMA = 'plasma',
  GAS = 'gas',
  EXOTIC = 'exotic',
}

/**
 * For backward compatibility with string-based resource types
 */
export type ResourceTypeString =
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
export enum ResourceCategory {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  SPECIAL = 'special',
}

/**
 * Resource rarity levels
 */
export enum ResourceRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  LEGENDARY = 'legendary',
}

/**
 * Metadata for resource types
 */
export interface ResourceTypeMetadata {
  id: ResourceType;
  displayName: string;
  description: string;
  icon: string;
  category: ResourceCategory;
  defaultMax: number;
}

/**
 * Lookup object for resource metadata
 */
export const ResourceTypeInfo: Record<ResourceType, ResourceTypeMetadata> = {
  [ResourceType.MINERALS]: {
    id: ResourceType.MINERALS,
    displayName: 'Minerals',
    description: 'Basic building materials',
    icon: 'mineral-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 1000,
  },
  [ResourceType.ENERGY]: {
    id: ResourceType.ENERGY,
    displayName: 'Energy',
    description: 'Power for modules and systems',
    icon: 'energy-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 1000,
  },
  [ResourceType.POPULATION]: {
    id: ResourceType.POPULATION,
    displayName: 'Population',
    description: 'Workers for colonies and stations',
    icon: 'population-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 500,
  },
  [ResourceType.RESEARCH]: {
    id: ResourceType.RESEARCH,
    displayName: 'Research',
    description: 'Scientific progress',
    icon: 'research-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 1000,
  },
  [ResourceType.PLASMA]: {
    id: ResourceType.PLASMA,
    displayName: 'Plasma',
    description: 'High-energy resource',
    icon: 'plasma-icon',
    category: ResourceCategory.ADVANCED,
    defaultMax: 500,
  },
  [ResourceType.GAS]: {
    id: ResourceType.GAS,
    displayName: 'Gas',
    description: 'Volatile gases',
    icon: 'gas-icon',
    category: ResourceCategory.ADVANCED,
    defaultMax: 800,
  },
  [ResourceType.EXOTIC]: {
    id: ResourceType.EXOTIC,
    displayName: 'Exotic Materials',
    description: 'Rare, valuable resources',
    icon: 'exotic-icon',
    category: ResourceCategory.SPECIAL,
    defaultMax: 250,
  },
};

/**
 * Helper functions for resource type conversions
 */
export const ResourceTypeHelpers = {
  /**
   * Convert string to enum
   */
  stringToEnum(type: ResourceTypeString): ResourceType {
    return ResourceType[type.toUpperCase() as keyof typeof ResourceType] || ResourceType.MINERALS;
  },

  /**
   * Convert enum to string
   */
  enumToString(type: ResourceType): ResourceTypeString {
    return type.toString() as ResourceTypeString;
  },

  /**
   * Get metadata for a resource type
   */
  getMetadata(type: ResourceType | ResourceTypeString): ResourceTypeMetadata {
    if (typeof type === 'string') {
      return ResourceTypeInfo[this.stringToEnum(type as ResourceTypeString)];
    }
    return ResourceTypeInfo[type];
  },

  /**
   * Get display name for a resource type
   */
  getDisplayName(type: ResourceType | ResourceTypeString): string {
    return this.getMetadata(type).displayName;
  },
};

/**
 * Base Resource interface with consistent property naming
 */
export interface StandardResource {
  id: string;
  name: string;
  type: ResourceType;
  category: ResourceCategory;
  description?: string;
  icon?: string;
}

/**
 * Enhanced Resource State with consistent property naming and computed properties
 */
export class ResourceStateClass {
  // Core properties
  private _current: number;
  private _max: number;
  private _min: number;
  private _production: number;
  private _consumption: number;
  private _type: ResourceType;

  constructor(data: {
    type: ResourceType | ResourceTypeString;
    current?: number;
    max?: number;
    min?: number;
    production?: number;
    consumption?: number;
  }) {
    this._type =
      typeof data.type === 'string'
        ? ResourceTypeHelpers.stringToEnum(data.type as ResourceTypeString)
        : data.type;
    this._current = data.current ?? 0;
    this._max = data.max ?? ResourceTypeInfo[this._type].defaultMax;
    this._min = data.min ?? 0;
    this._production = data.production ?? 0;
    this._consumption = data.consumption ?? 0;
  }

  // Getters and setters for core properties
  get current(): number {
    return this._current;
  }
  set current(value: number) {
    this._current = Math.max(this._min, Math.min(this._max, value));
  }

  get max(): number {
    return this._max;
  }
  set max(value: number) {
    this._max = value;
    this._current = Math.min(this._current, this._max);
  }

  get min(): number {
    return this._min;
  }
  set min(value: number) {
    this._min = value;
    this._current = Math.max(this._current, this._min);
  }

  get production(): number {
    return this._production;
  }
  set production(value: number) {
    this._production = value;
  }

  get consumption(): number {
    return this._consumption;
  }
  set consumption(value: number) {
    this._consumption = value;
  }

  get type(): ResourceType {
    return this._type;
  }

  // Computed properties
  get rate(): number {
    return this._production - this._consumption;
  }

  // For backward compatibility
  get value(): number {
    return this._current;
  }
  set value(value: number) {
    this.current = value;
  }

  // Utility methods
  public asObject(): ResourceState {
    return {
      current: this._current,
      max: this._max,
      min: this._min,
      production: this._production,
      consumption: this._consumption,
      rate: this.rate,
      value: this._current,
    };
  }

  // Static creation methods
  public static fromResourceState(state: ResourceState, type: ResourceType): ResourceStateClass {
    return new ResourceStateClass({
      type,
      current: state.current ?? state.value,
      max: state.max,
      min: state.min,
      production: state.production,
      consumption: state.consumption,
    });
  }
}

/**
 * Standard ResourceState interface with additional properties for compatibility
 */
export interface ResourceState {
  current: number;
  max: number;
  min: number;
  production: number;
  consumption: number;
  rate?: number;
  value?: number;
}

/**
 * Resource cost with consistent typing
 */
export interface ResourceCost {
  type: ResourceType;
  amount: number;
}

/**
 * Resource threshold configuration with consistent typing
 */
export interface ResourceThreshold {
  resourceId: ResourceType;
  min?: number;
  max?: number;
  target?: number;
  critical?: number;
  low?: number;
  high?: number;
  maximum?: number;
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
 * Standard resource transfer
 */
export interface ResourceTransfer {
  type: ResourceType;
  amount: number;
  source: string;
  target: string;
  timestamp: number;
}

/**
 * Resource flow with consistent typing
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
 * Resource priority configuration with consistent typing
 */
export interface ResourcePriority {
  type: ResourceType;
  priority: number;
  consumers: string[];
}

/**
 * Types of nodes in the resource flow network
 */
export enum FlowNodeType {
  PRODUCER = 'producer',
  CONSUMER = 'consumer',
  STORAGE = 'storage',
  CONVERTER = 'converter',
}

/**
 * Flow Node with consistent typing
 */
export interface FlowNode {
  id: string;
  type: FlowNodeType;
  resources: ResourceType[];
  priority: ResourcePriority;
  capacity?: number;
  efficiency?: number;
  active: boolean;
  converterConfig?: ConverterNodeConfig;
  converterStatus?: ConverterProcessStatus;
}

/**
 * Flow Connection with consistent typing
 */
export interface FlowConnection {
  id: string;
  source: string;
  target: string;
  resourceType: ResourceType;
  maxRate: number;
  currentRate: number;
  priority: ResourcePriority;
  active: boolean;
}

/**
 * Resource Conversion Recipe with consistent typing
 */
export interface ResourceConversionRecipe {
  id: string;
  name: string;
  description?: string;
  inputs: ResourceCost[];
  outputs: ResourceCost[];
  processingTime: number;
  baseEfficiency: number;
}

/**
 * Resource Conversion Process with consistent typing
 */
export interface ResourceConversionProcess {
  recipeId: string;
  progress: number;
  startTime: number;
  endTime: number;
  sourceId: string;
  active: boolean;
  paused: boolean;
  inputsProvided: boolean;
  appliedEfficiency?: number;
}

/**
 * Converter Node Configuration with consistent typing
 */
export interface ConverterNodeConfig {
  supportedRecipes: string[];
  maxConcurrentProcesses: number;
  autoStart: boolean;
  queueBehavior: 'fifo' | 'priority';
  byproducts?: Partial<Record<ResourceType, number>>;
  efficiencyModifiers?: Record<string, number>;
  tier?: 1 | 2 | 3;
  chainBonus?: number;
}

/**
 * Converter Process Status with consistent typing
 */
export interface ConverterProcessStatus {
  activeProcesses: ResourceConversionProcess[];
  queuedProcesses: ResourceConversionProcess[];
  completedProcesses: number;
  failedProcesses: number;
  totalResourcesProduced: Partial<Record<ResourceType, number>>;
  totalResourcesConsumed: Partial<Record<ResourceType, number>>;
  averageEfficiency: number;
  uptime: number;
}

/**
 * Conversion Chain with consistent typing
 */
export interface ConversionChain {
  id: string;
  name: string;
  description?: string;
  steps: string[];
  active: boolean;
}

/**
 * Chain Execution Status with consistent typing
 */
export interface ChainExecutionStatus {
  chainId: string;
  currentStepIndex: number;
  recipeIds: string[];
  startTime: number;
  estimatedEndTime: number;
  progress: number;
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

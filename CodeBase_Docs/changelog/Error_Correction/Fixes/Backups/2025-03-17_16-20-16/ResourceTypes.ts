/**
 * Standardized resource type definitions to ensure consistency across the codebase.
 * This file addresses the type inconsistencies identified in the resource system analysis.
 */

/**
 * ResourceType as an enum for better type safety and intellisense support
 */
export enum ResourceType {
  MINERALS = 'MINERALS',
  ENERGY = 'ENERGY',
  POPULATION = 'POPULATION',
  RESEARCH = 'RESEARCH',
  PLASMA = 'PLASMA',
  GAS = 'GAS',
  EXOTIC = 'EXOTIC',
  ORGANIC = 'ORGANIC',
  // Additional resource types for future expansion
  IRON = 'IRON',
  COPPER = 'COPPER',
  TITANIUM = 'TITANIUM',
  URANIUM = 'URANIUM',
  WATER = 'WATER',
  HELIUM = 'HELIUM',
  DEUTERIUM = 'DEUTERIUM',
  ANTIMATTER = 'ANTIMATTER',
  DARK_MATTER = 'DARK_MATTER',
  EXOTIC_MATTER = 'EXOTIC_MATTER',
}

/**
 * For backward compatibility with string-based resource types
 * @deprecated Use ResourceType enum instead for better type safety and intellisense support
 */
export type ResourceTypeString = keyof typeof ResourceType;

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
  VERY_RARE = 'very_rare',
  EXOTIC = ResourceType.EXOTIC,
}

/**
 * Resource priority configuration
 */
export interface ResourcePriorityConfig {
  type: ResourceType;
  priority: number;
  consumers: string[];
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
 * Resource conversion recipe definition
 */
export interface ResourceConversionRecipe {
  id: string;
  name: string;
  description: string;
  inputs: Array<{
    type: ResourceType;
    amount: number;
  }>;
  outputs: Array<{
    type: ResourceType;
    amount: number;
  }>;
  duration: number;
  energyCost: number;
  requiredLevel: number;
}

/**
 * Lookup object for resource metadata
 */
export const ResourceTypeInfo: Record<ResourceType, ResourceTypeMetadata> = {
  [ResourceType.MINERALS]: {
    id: ResourceType.MINERALS,
    displayName: 'Minerals',
    description: 'Basic building materials',
    icon: 'minerals-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 1000,
  },
  [ResourceType.ENERGY]: {
    id: ResourceType.ENERGY,
    displayName: 'Energy',
    description: 'Essential resource for various systems',
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
  [ResourceType.ORGANIC]: {
    id: ResourceType.ORGANIC,
    displayName: 'Organic Materials',
    description: 'Biological resources and compounds',
    icon: 'organic-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 800,
  },
  [ResourceType.IRON]: {
    id: ResourceType.IRON,
    displayName: 'Iron',
    description: 'Basic building material',
    icon: 'iron-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 1000,
  },
  [ResourceType.COPPER]: {
    id: ResourceType.COPPER,
    displayName: 'Copper',
    description: 'Basic building material',
    icon: 'copper-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 1000,
  },
  [ResourceType.TITANIUM]: {
    id: ResourceType.TITANIUM,
    displayName: 'Titanium',
    description: 'Basic building material',
    icon: 'titanium-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 1000,
  },
  [ResourceType.URANIUM]: {
    id: ResourceType.URANIUM,
    displayName: 'Uranium',
    description: 'Basic building material',
    icon: 'uranium-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 1000,
  },
  [ResourceType.WATER]: {
    id: ResourceType.WATER,
    displayName: 'Water',
    description: 'Essential resource for life support',
    icon: 'water-icon',
    category: ResourceCategory.BASIC,
    defaultMax: 1000,
  },
  [ResourceType.HELIUM]: {
    id: ResourceType.HELIUM,
    displayName: 'Helium',
    description: 'Used for advanced propulsion',
    icon: 'helium-icon',
    category: ResourceCategory.ADVANCED,
    defaultMax: 500,
  },
  [ResourceType.DEUTERIUM]: {
    id: ResourceType.DEUTERIUM,
    displayName: 'Deuterium',
    description: 'Fuel for fusion reactors',
    icon: 'deuterium-icon',
    category: ResourceCategory.ADVANCED,
    defaultMax: 500,
  },
  [ResourceType.ANTIMATTER]: {
    id: ResourceType.ANTIMATTER,
    displayName: 'Antimatter',
    description: 'Extremely powerful energy source',
    icon: 'antimatter-icon',
    category: ResourceCategory.SPECIAL,
    defaultMax: 100,
  },
  [ResourceType.DARK_MATTER]: {
    id: ResourceType.DARK_MATTER,
    displayName: 'Dark Matter',
    description: 'Exotic material with unique properties',
    icon: 'dark-matter-icon',
    category: ResourceCategory.SPECIAL,
    defaultMax: 50,
  },
  [ResourceType.EXOTIC_MATTER]: {
    id: ResourceType.EXOTIC_MATTER,
    displayName: 'Exotic Matter',
    description: 'Rare material with extraordinary properties',
    icon: 'exotic-matter-icon',
    category: ResourceCategory.SPECIAL,
    defaultMax: 25,
  },
};

/**
 * Helper functions for resource type conversions
 */
export const ResourceTypeHelpers = {
  /**
   * Convert string to enum
   * @param type String representation of resource type
   * @returns ResourceType enum value
   */
  stringToEnum(type: ResourceTypeString): ResourceType {
    const mapping: Record<ResourceTypeString, ResourceType> = {
      MINERALS: ResourceType.MINERALS,
      ENERGY: ResourceType.ENERGY,
      POPULATION: ResourceType.POPULATION,
      RESEARCH: ResourceType.RESEARCH,
      PLASMA: ResourceType.PLASMA,
      GAS: ResourceType.GAS,
      EXOTIC: ResourceType.EXOTIC,
      ORGANIC: ResourceType.ORGANIC,
      IRON: ResourceType.IRON,
      COPPER: ResourceType.COPPER,
      TITANIUM: ResourceType.TITANIUM,
      URANIUM: ResourceType.URANIUM,
      WATER: ResourceType.WATER,
      HELIUM: ResourceType.HELIUM,
      DEUTERIUM: ResourceType.DEUTERIUM,
      ANTIMATTER: ResourceType.ANTIMATTER,
      DARK_MATTER: ResourceType.DARK_MATTER,
      EXOTIC_MATTER: ResourceType.EXOTIC_MATTER,
    };
    return mapping[type] || ResourceType.MINERALS;
  },

  /**
   * Convert enum to string
   * @param type ResourceType enum value
   * @returns String representation of resource type
   */
  enumToString(type: ResourceType): ResourceTypeString {
    const mapping: Record<ResourceType, ResourceTypeString> = {
      [ResourceType.MINERALS]: 'MINERALS',
      [ResourceType.ENERGY]: 'ENERGY',
      [ResourceType.POPULATION]: 'POPULATION',
      [ResourceType.RESEARCH]: 'RESEARCH',
      [ResourceType.PLASMA]: 'PLASMA',
      [ResourceType.GAS]: 'GAS',
      [ResourceType.EXOTIC]: 'EXOTIC',
      [ResourceType.ORGANIC]: 'ORGANIC',
      [ResourceType.IRON]: 'IRON',
      [ResourceType.COPPER]: 'COPPER',
      [ResourceType.TITANIUM]: 'TITANIUM',
      [ResourceType.URANIUM]: 'URANIUM',
      [ResourceType.WATER]: 'WATER',
      [ResourceType.HELIUM]: 'HELIUM',
      [ResourceType.DEUTERIUM]: 'DEUTERIUM',
      [ResourceType.ANTIMATTER]: 'ANTIMATTER',
      [ResourceType.DARK_MATTER]: 'DARK_MATTER',
      [ResourceType.EXOTIC_MATTER]: 'EXOTIC_MATTER',
    };
    return mapping[type];
  },

  /**
   * Get metadata for a resource type
   * @param type ResourceType enum or string
   * @returns Metadata for the resource type
   */
  getMetadata(type: ResourceType | ResourceTypeString): ResourceTypeMetadata {
    if (typeof type === 'string') {
      // Convert string to enum
      type = this.stringToEnum(type as ResourceTypeString);
    }
    return ResourceTypeInfo[type];
  },

  /**
   * Get display name for a resource type
   * @param type ResourceType enum or string
   * @returns Display name for the resource type
   */
  getDisplayName(type: ResourceType | ResourceTypeString): ResourceType {
    return this.getMetadata(type).displayName;
  },
};

/**
 * Standard resource interface
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
 * Resource state class for managing resource amounts
 */
export class ResourceStateClass {
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
    // Convert string type to enum if needed
    this._type =
      typeof data.type === 'string'
        ? ResourceTypeHelpers.stringToEnum(data.type as ResourceTypeString)
        : data.type;

    // Set default values from metadata
    const metadata = ResourceTypeInfo[this._type];
    this._current = data.current ?? 0;
    this._max = data.max ?? metadata.defaultMax;
    this._min = data.min ?? 0;
    this._production = data.production ?? 0;
    this._consumption = data.consumption ?? 0;
  }

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
    this._max = Math.max(this._min, value);
    this._current = Math.min(this._current, this._max);
  }

  get min(): number {
    return this._min;
  }

  set min(value: number) {
    this._min = Math.min(this._max, value);
    this._current = Math.max(this._current, this._min);
  }

  get production(): number {
    return this._production;
  }

  set production(value: number) {
    this._production = Math.max(0, value);
  }

  get consumption(): number {
    return this._consumption;
  }

  set consumption(value: number) {
    this._consumption = Math.max(0, value);
  }

  get type(): ResourceType {
    return this._type;
  }

  get rate(): number {
    return this._production - this._consumption;
  }

  get value(): number {
    return this._current;
  }

  set value(value: number) {
    this.current = value;
  }

  public asObject(): ResourceState {
    return {
      current: this._current,
      max: this._max,
      min: this._min,
      production: this._production,
      consumption: this._consumption,
      rate: this.rate,
      value: this.value,
    };
  }

  public static fromResourceState(state: ResourceState, type: ResourceType): ResourceStateClass {
    return new ResourceStateClass({
      type,
      current: state.current,
      max: state.max,
      min: state.min,
      production: state.production,
      consumption: state.consumption,
    });
  }
}

/**
 * Resource state interface
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
 * Resource cost interface
 */
export interface ResourceCost {
  type: ResourceType;
  amount: number;
}

/**
 * Resource threshold interface
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
 * Resource production interface
 */
export interface ResourceProduction {
  type: ResourceType;
  amount: number;
  interval: number;
  conditions?: ResourceThreshold[];
}

/**
 * Resource consumption interface
 */
export interface ResourceConsumption {
  type: ResourceType;
  amount: number;
  interval: number;
  required: boolean;
  conditions?: ResourceThreshold[];
}

/**
 * Helper function to create a resource state
 */
export function createResourceState(
  type: ResourceType | ResourceTypeString,
  current: number = 0,
  max: number = 100,
  min: number = 0,
  production: number = 0,
  consumption: number = 0
): ResourceState {
  const resourceState = new ResourceStateClass({
    type,
    current,
    max,
    min,
    production,
    consumption,
  });
  return resourceState.asObject();
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
 * Resource data interface
 */
export interface ResourceData {
  id: string;
  type: ResourceType;
  amount: number;
  capacity: number;
  production: number;
  consumption: number;
  lastUpdated: number;
}

/**
 * Flow node types for resource network
 */
export enum FlowNodeType {
  SOURCE = 'source',
  SINK = 'sink',
  CONVERTER = 'converter',
  PRODUCER = 'producer',
  CONSUMER = 'consumer',
  STORAGE = 'storage',
}

/**
 * Flow node interface for resource network
 */
export interface FlowNode {
  id: string;
  type: FlowNodeType;
  resources: Record<ResourceType, ResourceState>;
  maxConnections?: number;
  metadata?: Record<string, unknown>;
  priority?: ResourcePriorityConfig;
  capacity?: number;
  active?: boolean;
}

/**
 * Flow connection interface for resource network
 */
export interface FlowConnection {
  id: string;
  source: string;
  target: string;
  resourceTypes: ResourceType[];
  maxFlow?: number;
  metadata?: Record<string, unknown>;
  maxRate?: number;
  currentRate?: number;
  priority?: ResourcePriorityConfig;
  active?: boolean;
}

/**
 * Resource priority levels for resource allocation and distribution
 */
export enum ResourcePriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  OPTIONAL = 'optional',
}

/**
 * Convert a string resource type to enum resource type
 */
export function toEnumResourceType(type: ResourceTypeString): ResourceType {
  return ResourceType[type];
}

/**
 * Convert an enum resource type to string resource type
 */
export function toStringResourceType(type: ResourceType): ResourceTypeString {
  return ResourceType[type] as ResourceTypeString;
}

/**
 * Resource container interface
 */
export interface ResourceContainer {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  resources: Record<ResourceType, ResourceState>;
  maxResourceTypes?: number;
  allowedResourceTypes?: ResourceType[];
  efficiency?: number;
  lastUpdated: number;
}

/**
 * Resource pool interface
 */
export interface ResourcePool {
  id: string;
  name: string;
  description?: string;
  resources: Record<ResourceType, number>;
  containers: string[];
  maxCapacity?: number;
  lastUpdated: number;
}

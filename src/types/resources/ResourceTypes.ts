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

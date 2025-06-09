/**
 * ResourceConversionTypes.ts
 *
 * This file contains types and interfaces for resource conversion functionality.
 */

import { ProcessStatus } from './ProductionChainTypes';
import { FlowNode, ResourceState, ResourceType } from './ResourceTypes';

/**
 * Status of a conversion chain execution
 */
export interface ChainExecutionStatus {
  chainId: string;
  executionId: string;
  active: boolean;
  paused: boolean;
  completed: boolean;
  failed: boolean;
  startTime: number;
  currentStepIndex: number;
  recipeIds: string[];
  estimatedEndTime: number;
  progress: number;
  resourceTransfers: unknown[];
  errorMessage?: string;
  stepStatus: {
    recipeId: string;
    status: ProcessStatus;
    startTime: number;
    endTime: number;
    processId: string;
    converterId?: string;
  }[];
}

/**
 * A sequence of conversion recipes to be executed in order
 */
export interface ConversionChain {
  id: string;
  name: string;
  description?: string;
  steps: string[]; // Recipe IDs in execution order
}

/**
 * Configuration for a converter node
 */
export interface ConverterNodeConfig {
  maxConcurrentProcesses: number;
  efficiencyModifiers: Record<string, number>; // Recipe ID -> efficiency modifier
}

/**
 * Represents the possible operational statuses of a converter node.
 */
export enum ConverterStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  // Add other relevant statuses like 'constructing', 'upgrading'? For now, keep simple.
}

/**
 * Resource conversion process
 */
export interface ResourceConversionProcess {
  processId: string;
  recipeId: string;
  sourceId: string;
  active: boolean;
  paused: boolean;
  startTime: number;
  endTime?: number;
  progress: number;
  appliedEfficiency: number;
}

/**
 * Resource conversion recipe definition
 */
export interface ResourceConversionRecipe {
  id: string;
  name: string;
  description: string;
  inputs: {
    type: ResourceType;
    amount: number;
  }[];
  outputs: {
    type: ResourceType;
    amount: number;
  }[];
  duration: number;
  energyCost: number;
  requiredLevel: number;
  processingTime: number;
  baseEfficiency: number;
  requiredTechnologyId?: string;
}

/**
 * Extended resource conversion recipe with additional properties
 */
export interface ExtendedResourceConversionRecipe {
  id: string;
  name: string;
  description: string;
  inputs: {
    type: ResourceType;
    amount: number;
  }[];
  outputs: {
    type: ResourceType;
    amount: number;
  }[];
  duration: number;
  energyCost: number;
  requiredLevel: number;
  processingTime: number;
  baseEfficiency: number;
  requiredTechnologyId?: string;
}

/**
 * Extends FlowNode with converter-specific properties
 */
export interface ConverterFlowNode extends FlowNode {
  converterId: string;
  supportedRecipeIds?: string[];
  status: ConverterStatus;
  efficiency: number;
  resources: Record<ResourceType, ResourceState>; // Align with base FlowNode
  configuration?: ConverterNodeConfig;
  tags?: string[];
  activeProcessIds?: string[]; // Add array to track active processes
}

/**
 * Container for resources
 */
export interface ResourceContainer {
  id: string;
  name: string;
  description?: string;
  maxCapacity: number;
  currentCapacity: number;
  resources: Map<ResourceType, number>;
  location?: string;
  owner?: string;
  transferEfficiency?: number;
}

/**
 * Exchange rate between two resource types
 */
export interface ResourceExchangeRate {
  fromType: ResourceType;
  toType: ResourceType;
  baseRate: number;
  rate: number;
  minAmount?: number;
  maxAmount?: number;
  cooldown?: number;
  volatility?: number;
  lastUpdated?: number;
  expiresAt?: number;
}

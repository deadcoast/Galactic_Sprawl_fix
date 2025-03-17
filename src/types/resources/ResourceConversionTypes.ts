/**
 * ResourceConversionTypes.ts
 *
 * This file contains types and interfaces for resource conversion functionality.
 */

import { ResourceType } from './ResourceTypes';
import { FlowNode } from './StandardizedResourceTypes';

/**
 * Status of a conversion chain execution
 */
export interface ChainExecutionStatus {
  chainId: string;
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
  stepStatus: Array<{
    recipeId: string;
    status: 'pending' | 'in-progress' | 'in_progress' | 'completed' | 'failed';
    startTime: number;
    endTime: number;
    processId: string;
    converterId?: string;
  }>;
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
 * Status of a converter node
 */
export interface ConverterStatus {
  activeProcesses: string[]; // Process IDs
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
  processingTime: number;
  baseEfficiency: number;
}

/**
 * Extended resource conversion recipe with additional properties
 */
export interface ExtendedResourceConversionRecipe {
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
  processingTime: number;
  baseEfficiency: number;
}

/**
 * Extended FlowNode with converter properties
 */
export interface ConverterFlowNode extends FlowNode {
  resources?: Map<ResourceType, number>;
  converterStatus?: ConverterStatus;
  converterConfig?: ConverterNodeConfig;
  active?: boolean;
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

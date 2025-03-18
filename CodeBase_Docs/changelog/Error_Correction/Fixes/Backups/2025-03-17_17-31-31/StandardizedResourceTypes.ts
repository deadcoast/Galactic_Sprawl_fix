import { ResourceType } from './ResourceTypes';

/**
 * Type of node in a resource flow network
 */
export enum FlowNodeType {
  PRODUCER = 'producer',
  CONSUMER = 'consumer',
  STORAGE = 'storage',
  CONVERTER = 'converter',
  SOURCE = 'source',
  SINK = 'sink',
}

/**
 * Represents a node in a resource flow network
 */
export interface FlowNode {
  id: string;
  type: FlowNodeType;
  name: string;
  description?: string;
  capacity: number;
  currentLoad: number;
  efficiency: number;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  resources?: Map<ResourceType, number>;
  active?: boolean;
  inputs?: Array<{
    type: ResourceType;
    rate: number;
    maxCapacity: number;
  }>;
  outputs?: Array<{
    type: ResourceType;
    rate: number;
    maxCapacity: number;
  }>;
}

/**
 * StandardizedResourceTypes.ts
 *
 * This file re-exports the enum-based resource types from ResourceTypes.ts
 * to provide backward compatibility for components that import from this file.
 *
 * This is part of the resource type standardization effort to migrate from
 * string-based resource types to enum-based resource types.
 */

export {
  ResourceCategory,
  ResourceType,
  ResourceTypeHelpers,
  ResourceTypeInfo,
} from './ResourceTypes';

export type {
  ResourceConsumption,
  ResourceConversionRecipe,
  ResourceFlow,
  ResourcePriorityConfig,
  ResourceProduction,
  ResourceState,
  ResourceThreshold,
  ResourceTransfer,
  ResourceTypeMetadata,
  ResourceTypeString,
} from './ResourceTypes';

// Export the ResourceStateClass directly
export { ResourceStateClass } from './ResourceTypes';

// Export types from ResourceConversionTypes.ts
export type {
  ChainExecutionStatus,
  ConversionChain,
  ConverterFlowNode,
  ConverterNodeConfig,
  ConverterStatus,
  ExtendedResourceConversionRecipe,
  ResourceConversionProcess,
} from './ResourceConversionTypes';

// Add FlowConnection to exports
export type { FlowConnection } from './ResourceFlowTypes';

// Add a comment to indicate that this file is for backward compatibility
// and that new code should import directly from ResourceTypes.ts
/**
 * @deprecated Import directly from ResourceTypes.ts instead.
 * This file exists only for backward compatibility during the migration process.
 */

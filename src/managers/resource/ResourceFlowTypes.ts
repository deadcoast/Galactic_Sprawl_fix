/**
 * ResourceFlowTypes.ts
 *
 * This file contains common types and interfaces for the resource flow system.
 * It helps reduce the size of the ResourceFlowManager.ts file by extracting
 * type definitions into a separate module.
 */

import { BaseEvent } from '../../lib/events/UnifiedEventSystem';
import {
    FlowNode,
    ResourceConversionProcess,
    ResourceState,
} from '../../types/resources/ResourceTypes';
import { SpatialObject } from '../../utils/spatial/SpatialPartitioning';
import { ResourceType } from './../../types/resources/ResourceTypes';

/**
 * Extended FlowNode with spatial coordinates for geographical networks
 */
export interface GeoFlowNode extends FlowNode, SpatialObject {
  // Spatial coordinates
  x: number;
  y: number;
}

/**
 * Resource flow events
 */
export interface ResourceFlowEvent extends BaseEvent {
  type:
    | 'RESOURCE_FLOW_INITIALIZED'
    | 'RESOURCE_FLOW_OPTIMIZED'
    | 'RESOURCE_NODE_REGISTERED'
    | 'RESOURCE_NODE_UPDATED'
    | 'RESOURCE_NODE_UNREGISTERED'
    | 'RESOURCE_CONNECTION_REGISTERED'
    | 'RESOURCE_CONNECTION_UPDATED'
    | 'RESOURCE_CONNECTION_UNREGISTERED'
    | 'RESOURCE_CONVERSION_STARTED'
    | 'RESOURCE_CONVERSION_COMPLETED'
    | 'RESOURCE_CONVERSION_FAILED'
    | 'RESOURCE_TRANSFER_COMPLETED';
  nodeId?: string;
  connectionId?: string;
  resourceType?: ResourceType;
  processId?: string;
  data?: unknown;
}

/**
 * Result of a resource conversion process
 */
export interface ConversionResult {
  success: boolean;
  processId: string;
  recipeId: string;
  outputsProduced?: { type: ResourceType; amount: number }[];
  byproductsProduced?: { type: ResourceType; amount: number }[];
  error?: string;
}

/**
 * Extended ResourceConversionProcess to include processId
 */
export interface ExtendedResourceConversionProcess extends ResourceConversionProcess {
  processId: string;
}

/**
 * Cache entry for resource state
 */
export interface ResourceCacheEntry {
  state: ResourceState;
  lastUpdated: number;
  expiresAt: number;
}

/**
 * Configuration options for the ResourceFlowManager
 */
export interface ResourceFlowConfig {
  optimizationIntervalMs: number;
  processingIntervalMs: number;
  cacheTTL: number;
  batchSize: number;
  useWorkerOffloading: boolean;
  useSpatialPartitioning: boolean;
  maxHistorySize: number;
  resourceCapacityBuffer: number;
}

/**
 * Default configuration for the ResourceFlowManager
 */
export const DEFAULT_RESOURCE_FLOW_CONFIG: ResourceFlowConfig = {
  optimizationIntervalMs: 5000,
  processingIntervalMs: 1000,
  cacheTTL: 2000,
  batchSize: 100,
  useWorkerOffloading: true,
  useSpatialPartitioning: true,
  maxHistorySize: 1000,
  resourceCapacityBuffer: 0.05,
};

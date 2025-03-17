import { ResourcePriorityConfig, ResourceType } from './ResourceTypes';

/**
 * Flow connection between nodes
 */
export interface FlowConnection {
  id: string;
  source: string;
  target: string;
  resourceTypes: ResourceType[];
  resourceType?: ResourceType;
  maxFlow?: number;
  metadata?: Record<string, unknown>;
  maxRate?: number;
  currentRate?: number;
  priority?: number | ResourcePriorityConfig;
  active?: boolean;
}

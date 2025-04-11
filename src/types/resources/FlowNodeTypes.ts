/**
 * @context: resource-system, visualization-system
 *
 * Types for resource flow visualization nodes
 */

import { ResourceType } from './ResourceTypes';

/**
 * Types of nodes in a resource flow diagram
 */
export enum FlowNodeType {
  PRODUCER = 'PRODUCER',
  CONSUMER = 'CONSUMER',
  STORAGE = 'STORAGE',
  PROCESSOR = 'PROCESSOR',
  CONVERTER = 'CONVERTER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  COLLECTOR = 'COLLECTOR',
  TRANSPORTER = 'TRANSPORTER',
  SOURCE = 'SOURCE',
  SINK = 'SINK',
  MULTIPLEXER = 'MULTIPLEXER',
}

/**
 * Basic node in a resource flow
 */
export interface FlowNode {
  id: string;
  name: string;
  type: FlowNodeType;
  resources?: ResourceType[];
  capacity?: number;
  currentLoad?: number;
  efficiency?: number;
  status?: 'active' | 'inactive' | 'maintenance' | 'error';
  position?: { x: number; y: number };
  metadata?: Record<string, unknown>;
}

/**
 * Producer node that generates resources
 */
export interface ProducerNode extends FlowNode {
  type: FlowNodeType.PRODUCER;
  productionRate?: Record<ResourceType, number>;
  energyConsumption?: number;
}

/**
 * Consumer node that consumes resources
 */
export interface ConsumerNode extends FlowNode {
  type: FlowNodeType.CONSUMER;
  consumptionRate?: Record<ResourceType, number>;
  priority?: number;
}

/**
 * Storage node that stores resources
 */
export interface StorageNode extends FlowNode {
  type: FlowNodeType.STORAGE;
  maxCapacity?: Record<ResourceType, number>;
  currentStorage?: Record<ResourceType, number>;
}

/**
 * A node's connection status
 */
export enum FlowNodeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  OVERLOADED = 'overloaded',
  STANDBY = 'standby',
}

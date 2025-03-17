/**
 * Flow Types
 *
 * Type definitions for flow diagram visualizations.
 */

/**
 * Represents a node in the flow diagram
 */
export interface FlowDataNode {
  id: string;
  name: string;
  type: 'source' | 'process' | 'destination';
  value: number;
  description?: string;
  data?: unknown;
  index?: number;
  vx?: number;
  vy?: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

/**
 * Represents a connection between two nodes in the flow diagram
 */
export interface FlowDataLink {
  id: string;
  source: string;
  target: string;
  value: number;
  type?: string;
  data?: unknown;
  active: boolean;
}

/**
 * Represents the entire flow data structure
 */
export interface FlowData {
  nodes: FlowDataNode[];
  links: FlowDataLink[];
}

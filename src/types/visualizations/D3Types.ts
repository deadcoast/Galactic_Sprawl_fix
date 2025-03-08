/**
 * Type definitions for D3 data structures used in visualization components
 */

import * as d3 from 'd3';
import { DataPoint } from '../exploration/DataAnalysisTypes';

/**
 * Generic Node type for D3 force simulations
 */
export interface SimulationNodeDatum<T = unknown> extends d3.SimulationNodeDatum {
  id: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  // Additional fields for type safety
  data?: T; // The original data attached to this node
}

/**
 * Generic Link type for D3 force simulations
 * This extends the d3.SimulationLinkDatum interface with stricter typing
 */
export interface SimulationLinkDatum<N extends d3.SimulationNodeDatum>
  extends d3.SimulationLinkDatum<N> {
  source: string | N;
  target: string | N;
  value?: number;
  // Additional fields can be added here based on component needs
}

/**
 * Type for D3 Simulation - provides proper typing for simulation objects
 */
export type TypedSimulation<T extends d3.SimulationNodeDatum> = d3.Simulation<T, undefined>;

/**
 * The actual node and target types for D3 force simulations during runtime
 * D3 replaces string IDs with actual node references during simulation
 */
export interface RuntimeSimulationNode {
  x: number;
  y: number;
  [key: string]: unknown;
}

/**
 * Safe accessor functions for D3 simulation nodes and links
 */
export const d3Accessors = {
  /**
   * Safely access the x coordinate of a node or source/target in a D3 simulation
   */
  getX: (node: unknown): number => {
    if (
      node &&
      typeof node === 'object' &&
      'x' in node &&
      typeof (node as RuntimeSimulationNode).x === 'number'
    ) {
      return (node as RuntimeSimulationNode).x;
    }
    return 0;
  },

  /**
   * Safely access the y coordinate of a node or source/target in a D3 simulation
   */
  getY: (node: unknown): number => {
    if (
      node &&
      typeof node === 'object' &&
      'y' in node &&
      typeof (node as RuntimeSimulationNode).y === 'number'
    ) {
      return (node as RuntimeSimulationNode).y;
    }
    return 0;
  },
};

/**
 * Type-safe conversion functions for D3 data
 */
export const d3Converters = {
  /**
   * Convert DataPoint array to D3-compatible format safely
   */
  dataPointsToD3Format: <T extends Record<string, unknown>>(dataPoints: DataPoint[]): T[] => {
    return dataPoints.map(point => {
      // Flatten the structure to make it easier for D3 to process
      const result = {
        id: point.id,
        type: point.type,
        name: point.name,
        date: point.date,
        x: point.coordinates.x,
        y: point.coordinates.y,
        ...point.properties,
      } as unknown as T;

      // Add metadata fields if they exist
      if (point.metadata) {
        Object.entries(point.metadata).forEach(([key, value]) => {
          if (!(key in result)) {
            (result as Record<string, unknown>)[`meta_${key}`] = value;
          }
        });
      }

      return result;
    });
  },
};

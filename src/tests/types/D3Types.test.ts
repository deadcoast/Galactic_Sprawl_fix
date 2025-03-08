import { describe, expect, test } from 'vitest';
import { DataPoint } from '../../types/exploration/DataAnalysisTypes';
import {
  RuntimeSimulationNode,
  d3Accessors,
  d3Converters,
} from '../../types/visualizations/D3Types';

describe('D3 type-safe utilities', () => {
  // Test the accessor functions
  describe('d3Accessors', () => {
    test('getX should return x coordinate for valid objects', () => {
      const node: RuntimeSimulationNode = { x: 150, y: 200 };
      expect(d3Accessors.getX(node)).toBe(150);
    });

    test('getX should return 0 for undefined input', () => {
      expect(d3Accessors.getX(undefined)).toBe(0);
    });

    test('getX should return 0 for null input', () => {
      expect(d3Accessors.getX(null)).toBe(0);
    });

    test('getX should return 0 for objects without x property', () => {
      expect(d3Accessors.getX({ y: 100 })).toBe(0);
    });

    test('getY should return y coordinate for valid objects', () => {
      const node: RuntimeSimulationNode = { x: 150, y: 200 };
      expect(d3Accessors.getY(node)).toBe(200);
    });

    test('getY should return 0 for undefined input', () => {
      expect(d3Accessors.getY(undefined)).toBe(0);
    });

    test('getY should return 0 for null input', () => {
      expect(d3Accessors.getY(null)).toBe(0);
    });

    test('getY should return 0 for objects without y property', () => {
      expect(d3Accessors.getY({ x: 100 })).toBe(0);
    });
  });

  // Test the data conversion functions
  describe('d3Converters', () => {
    test('dataPointsToD3Format should convert DataPoint array to D3-compatible format', () => {
      // Create mock data points
      const dataPoints: DataPoint[] = [
        {
          id: 'dp1',
          type: 'resource',
          name: 'Iron Ore',
          date: 1625678901234,
          coordinates: { x: 25, y: 35 },
          properties: {
            type: 'iron',
            amount: 500,
            quality: 0.85,
          },
        },
        {
          id: 'dp2',
          type: 'resource',
          name: 'Copper Ore',
          date: 1625678902345,
          coordinates: { x: 45, y: 65 },
          properties: {
            type: 'copper',
            amount: 320,
            quality: 0.72,
          },
          metadata: {
            discovered: 'exploration_team_alpha',
            verified: true,
          },
        },
      ];

      // Convert to D3 format
      const result = d3Converters.dataPointsToD3Format<Record<string, unknown>>(dataPoints);

      // Verify the first data point's structure - property 'type' is overridden by properties.type
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'dp1',
          name: 'Iron Ore',
          date: 1625678901234,
          x: 25,
          y: 35,
          amount: 500,
          quality: 0.85,
        })
      );

      // Verify that the type property from properties takes precedence
      expect(result[0].type).toBe('iron');

      // Verify the second data point's structure, including metadata
      expect(result[1]).toEqual(
        expect.objectContaining({
          id: 'dp2',
          name: 'Copper Ore',
          date: 1625678902345,
          x: 45,
          y: 65,
          amount: 320,
          quality: 0.72,
          meta_discovered: 'exploration_team_alpha',
          meta_verified: true,
        })
      );

      // Verify that the type property from properties takes precedence
      expect(result[1].type).toBe('copper');
    });

    test('dataPointsToD3Format should handle empty arrays', () => {
      const result = d3Converters.dataPointsToD3Format<Record<string, unknown>>([]);
      expect(result).toEqual([]);
    });
  });
});

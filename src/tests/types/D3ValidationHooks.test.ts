/**
 * Tests for D3ValidationHooks
 */

import { SimulationLinkDatum, SimulationNodeDatum } from '../../types/visualizations/D3Types';
import {
  createD3ForceValidation,
  createD3SimulationSchemas,
  withLinkValidation,
  withNodeValidation,
  withSchemaValidation,
  withStepValidation,
} from '../../types/visualizations/D3ValidationHooks';
import { Schema, SchemaProperty } from '../../types/visualizations/D3Validators';

describe('D3ValidationHooks', () => {
  describe('withSchemaValidation', () => {
    it('should validate input and output data', () => {
      // Define test schemas
      const inputSchema: Schema = {
        name: 'Input',
        description: 'Test input schema',
        properties: {
          data: {
            type: 'array',
            required: true,
          },
        },
      };

      const outputSchema: Schema = {
        name: 'Output',
        description: 'Test output schema',
        properties: {
          transformed: {
            type: 'array',
            required: true,
          },
          count: {
            type: 'number',
            required: true,
          },
        },
      };

      // Define a transformation function
      const transformFn = (input: { data: number[] }) => {
        return {
          transformed: input.data.map(x => x * 2),
          count: input.data.length,
        };
      };

      // Create validated transform function
      const validatedTransform = withSchemaValidation(transformFn, inputSchema, outputSchema, {
        throwOnError: false,
        logErrors: false,
      });

      // Test with valid input
      const validInput = { data: [1, 2, 3] };
      const validResult = validatedTransform(validInput);

      expect(validResult.valid).toBe(true);
      expect(validResult.data).toEqual({
        transformed: [2, 4, 6],
        count: 3,
      });

      // Test with invalid input
      const invalidInput = { wrongField: 'test' } as unknown as { data: number[] };
      const invalidResult = validatedTransform(invalidInput);

      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('withNodeValidation', () => {
    it('should validate D3 nodes', () => {
      // Define a node transformation function
      const nodeTransformFn = (input: { names: string[] }): SimulationNodeDatum[] => {
        return input.names.map((name, index) => ({
          id: `node-${index}`,
          x: index * 10,
          y: index * 5,
        }));
      };

      // Create a custom node schema
      const customNodeSchema: Partial<Schema> = {
        properties: {
          id: {
            type: 'string',
            required: true,
            pattern: /^node-\d+$/,
          },
        },
      };

      // Create validated transform function
      const validatedNodeTransform = withNodeValidation(nodeTransformFn, customNodeSchema, {
        throwOnError: false,
        logErrors: false,
      });

      // Test with valid input
      const validInput = { names: ['A', 'B', 'C'] };
      const validResult = validatedNodeTransform(validInput);

      expect(validResult.valid).toBe(true);
      expect(validResult.data).toHaveLength(3);
      expect(validResult.data[0].id).toBe('node-0');

      // Test with transformation error
      const errorTransformFn = () => {
        throw new Error('Transformation error');
      };

      const errorNodeTransform = withNodeValidation(errorTransformFn, customNodeSchema, {
        throwOnError: false,
        logErrors: false,
      });

      const errorResult = errorNodeTransform({} as unknown as { names: string[] });
      expect(errorResult.valid).toBe(false);
      expect(errorResult.errors[0]).toContain('Transformation error');
    });
  });

  describe('withLinkValidation', () => {
    it('should validate D3 links', () => {
      // Define a link transformation function
      const linkTransformFn = (input: {
        connections: Array<[string, string]>;
      }): SimulationLinkDatum<SimulationNodeDatum>[] => {
        return input.connections.map(([source, target], index) => ({
          source,
          target,
          index,
        }));
      };

      // Create validated transform function
      const validatedLinkTransform = withLinkValidation(linkTransformFn, undefined, {
        throwOnError: false,
        logErrors: false,
      });

      // Test with valid input
      const validInput = {
        connections: [
          ['node1', 'node2'] as [string, string],
          ['node2', 'node3'] as [string, string],
        ],
      };
      const validResult = validatedLinkTransform(validInput);

      expect(validResult.valid).toBe(true);
      expect(validResult.data).toHaveLength(2);
      expect(validResult.data[0].source).toBe('node1');
      expect(validResult.data[0].target).toBe('node2');
    });
  });

  describe('withStepValidation', () => {
    it('should validate step-by-step transformations', () => {
      // Define steps with schemas and cast to the proper type
      const steps = [
        {
          name: 'Initial Data',
          schema: {
            name: 'InitialData',
            description: 'Initial data schema',
            properties: {
              input: {
                type: 'array' as const,
                required: true,
              },
            },
          },
        },
        {
          name: 'Filtered Data',
          schema: {
            name: 'FilteredData',
            description: 'Filtered data schema',
            properties: {
              filtered: {
                type: 'array' as const,
                required: true,
              },
              count: {
                type: 'number' as const,
                required: true,
              },
            },
          },
        },
        {
          name: 'Final Result',
          schema: {
            name: 'FinalResult',
            description: 'Final result schema',
            properties: {
              result: {
                type: 'array' as const,
                required: true,
              },
              sum: {
                type: 'number' as const,
                required: true,
              },
            },
          },
        },
      ] as Array<{ name: string; schema: Schema; required?: boolean }>;

      // Define a multi-step transformation function
      const multiStepTransformFn = (
        input: { input: number[] },
        onProgress: (step: number, data: unknown) => void
      ) => {
        // Step 0: Initial data
        onProgress(0, input);

        // Step 1: Filter data
        const filtered = {
          filtered: input.input.filter(x => x > 0),
          count: input.input.filter(x => x > 0).length,
        };
        onProgress(1, filtered);

        // Step 2: Final result
        const result = {
          result: filtered.filtered.map(x => x * 2),
          sum: filtered.filtered.reduce((a, b) => a + b, 0),
        };
        onProgress(2, result);

        return result;
      };

      // Create validated transform function
      const validatedStepTransform = withStepValidation(multiStepTransformFn, steps, {
        throwOnError: false,
        logErrors: false,
      });

      // Test with valid input
      const validInput = { input: [1, -2, 3, 4, -5] };
      const validResult = validatedStepTransform(validInput);

      expect(validResult.valid).toBe(true);
      expect(validResult.data).toEqual({
        result: [2, 6, 8],
        sum: 8,
      });

      // Test with error in a step
      const errorStepTransformFn = (
        input: { input: number[] },
        onProgress: (step: number, data: unknown) => void
      ) => {
        // Step 0: Initial data
        onProgress(0, input);

        // Step 1: Pass invalid data
        onProgress(1, { wrongField: 'test' });

        return { result: [], sum: 0 };
      };

      const errorStepTransform = withStepValidation(
        errorStepTransformFn,
        steps as Array<{ name: string; schema: Schema; required?: boolean }>,
        { throwOnError: false, logErrors: false }
      );

      const errorResult = errorStepTransform(validInput);
      expect(errorResult.valid).toBe(false);
      expect(errorResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('createD3SimulationSchemas', () => {
    it('should create extended schemas for D3 simulation data', () => {
      // Define custom properties
      const customNodeProps: Record<string, SchemaProperty> = {
        value: {
          type: 'number',
          required: true,
        },
        category: {
          type: 'string',
          required: false,
        },
      };

      const customLinkProps: Record<string, SchemaProperty> = {
        weight: {
          type: 'number',
          required: true,
        },
      };

      // Create extended schemas
      const schemas = createD3SimulationSchemas(customNodeProps, customLinkProps);

      // Check node schema
      expect(schemas.nodeSchema.properties.id).toBeDefined();
      expect(schemas.nodeSchema.properties.value).toBeDefined();
      expect(schemas.nodeSchema.properties.category).toBeDefined();

      // Check link schema
      expect(schemas.linkSchema.properties.source).toBeDefined();
      expect(schemas.linkSchema.properties.target).toBeDefined();
      expect(schemas.linkSchema.properties.weight).toBeDefined();
    });
  });

  describe('createD3ForceValidation', () => {
    it('should create validation functions for D3 force simulation', () => {
      // Define transformation functions
      const nodeTransformFn = (input: { names: string[] }) => {
        return input.names.map((name, index) => ({
          id: name,
          x: index * 10,
          y: index * 5,
        }));
      };

      const linkTransformFn = (input: { names: string[] }) => {
        const links = [];
        for (let i = 0; i < input.names.length - 1; i++) {
          links.push({
            source: input.names[i],
            target: input.names[i + 1],
            index: i,
          });
        }
        return links;
      };

      // Create validation functions
      const validation = createD3ForceValidation(
        nodeTransformFn,
        linkTransformFn,
        undefined,
        undefined,
        { throwOnError: false, logErrors: false }
      );

      // Test node validation
      const input = { names: ['A', 'B', 'C'] };
      const nodeResult = validation.validateNodes(input);

      expect(nodeResult.valid).toBe(true);
      expect(nodeResult.data).toHaveLength(3);

      // Test link validation
      const linkResult = validation.validateLinks(input);

      expect(linkResult.valid).toBe(true);
      expect(linkResult.data).toHaveLength(2);
      expect(linkResult.data[0].source).toBe('A');
      expect(linkResult.data[0].target).toBe('B');
    });
  });
});

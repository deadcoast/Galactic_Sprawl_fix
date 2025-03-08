/**
 * Tests for D3Validators
 */

import { SimulationLinkDatum, SimulationNodeDatum } from '../../types/visualizations/D3Types';
import {
  assertValid,
  extendSchema,
  Schema,
  validateLink,
  validateLinks,
  validateNode,
  validateNodes,
  validateSchema,
} from '../../types/visualizations/D3Validators';

describe('D3Validators', () => {
  describe('validateSchema', () => {
    it('should validate a simple object against a schema', () => {
      const schema: Schema = {
        name: 'TestSchema',
        description: 'Test schema',
        properties: {
          id: {
            type: 'string',
            required: true,
          },
          value: {
            type: 'number',
            required: true,
          },
        },
      };

      const validObject = { id: 'test', value: 42 };
      const result = validateSchema(validObject, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report missing required properties', () => {
      const schema: Schema = {
        name: 'TestSchema',
        description: 'Test schema',
        properties: {
          id: {
            type: 'string',
            required: true,
          },
          value: {
            type: 'number',
            required: true,
          },
        },
      };

      const invalidObject = { id: 'test' };
      const result = validateSchema(invalidObject, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Required property "value" is missing');
    });

    it('should validate property types', () => {
      const schema: Schema = {
        name: 'TestSchema',
        description: 'Test schema',
        properties: {
          id: {
            type: 'string',
            required: true,
          },
          value: {
            type: 'number',
            required: true,
          },
        },
      };

      const invalidObject = { id: 'test', value: 'not-a-number' };
      const result = validateSchema(invalidObject, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Expected type number');
    });

    it('should validate nested objects', () => {
      const schema: Schema = {
        name: 'TestSchema',
        description: 'Test schema',
        properties: {
          id: {
            type: 'string',
            required: true,
          },
          metadata: {
            type: 'object',
            required: true,
            properties: {
              created: {
                type: 'number',
                required: true,
              },
              author: {
                type: 'string',
                required: true,
              },
            },
          },
        },
      };

      const validObject = {
        id: 'test',
        metadata: {
          created: 1625097600000,
          author: 'Test User',
        },
      };

      const result = validateSchema(validObject, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate arrays', () => {
      const schema: Schema = {
        name: 'TestSchema',
        description: 'Test schema',
        properties: {
          id: {
            type: 'string',
            required: true,
          },
          tags: {
            type: 'array',
            required: true,
            items: {
              type: 'string',
            },
          },
        },
      };

      const validObject = { id: 'test', tags: ['tag1', 'tag2', 'tag3'] };
      const result = validateSchema(validObject, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate array item types', () => {
      const schema: Schema = {
        name: 'TestSchema',
        description: 'Test schema',
        properties: {
          id: {
            type: 'string',
            required: true,
          },
          tags: {
            type: 'array',
            required: true,
            items: {
              type: 'string',
            },
          },
        },
      };

      const invalidObject = { id: 'test', tags: ['tag1', 42, 'tag3'] };
      const result = validateSchema(invalidObject, schema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Expected array item of type string');
    });

    it('should validate min/max constraints for numbers', () => {
      const schema: Schema = {
        name: 'TestSchema',
        description: 'Test schema',
        properties: {
          id: {
            type: 'string',
            required: true,
          },
          value: {
            type: 'number',
            required: true,
            min: 0,
            max: 100,
          },
        },
      };

      const validObject = { id: 'test', value: 42 };
      expect(validateSchema(validObject, schema).valid).toBe(true);

      const tooSmall = { id: 'test', value: -10 };
      const tooSmallResult = validateSchema(tooSmall, schema);
      expect(tooSmallResult.valid).toBe(false);
      expect(tooSmallResult.errors[0].message).toContain('less than minimum');

      const tooLarge = { id: 'test', value: 200 };
      const tooLargeResult = validateSchema(tooLarge, schema);
      expect(tooLargeResult.valid).toBe(false);
      expect(tooLargeResult.errors[0].message).toContain('greater than maximum');
    });

    it('should validate custom validators', () => {
      const schema: Schema = {
        name: 'TestSchema',
        description: 'Test schema',
        properties: {
          id: {
            type: 'string',
            required: true,
            validate: value => (value as string).length >= 3 || 'ID must be at least 3 characters',
          },
        },
      };

      const validObject = { id: 'test' };
      expect(validateSchema(validObject, schema).valid).toBe(true);

      const invalidObject = { id: 'ab' };
      const result = validateSchema(invalidObject, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toBe('ID must be at least 3 characters');
    });
  });

  describe('validateNode', () => {
    it('should validate a valid D3 node', () => {
      const node: SimulationNodeDatum = {
        id: 'node1',
        x: 100,
        y: 200,
      };

      const result = validateNode(node);
      expect(result.valid).toBe(true);
    });

    it('should validate a node with custom schema', () => {
      const node = {
        id: 'node1',
        x: 100,
        y: 200,
        value: 42,
        type: 'source',
      };

      const customSchema: Partial<Schema> = {
        properties: {
          value: {
            type: 'number',
            required: true,
          },
          type: {
            type: 'string',
            required: true,
            enum: ['source', 'target', 'process'],
          },
        },
      };

      const result = validateNode(node, customSchema);
      expect(result.valid).toBe(true);
    });

    it('should fail validation for invalid node', () => {
      const node = {
        // Missing required id
        x: 100,
        y: 200,
      };

      const result = validateNode(node as SimulationNodeDatum);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Required property "id" is missing');
    });
  });

  describe('validateLink', () => {
    it('should validate a valid D3 link', () => {
      const link = {
        source: 'node1',
        target: 'node2',
      };

      const result = validateLink(link);
      expect(result.valid).toBe(true);
    });

    it('should validate a link with custom schema', () => {
      const link = {
        source: 'node1',
        target: 'node2',
        value: 10,
        type: 'flow',
      };

      const customSchema: Partial<Schema> = {
        properties: {
          value: {
            type: 'number',
            required: true,
          },
          type: {
            type: 'string',
            required: true,
          },
        },
      };

      const result = validateLink(link, customSchema);
      expect(result.valid).toBe(true);
    });

    it('should fail validation for invalid link', () => {
      const link = {
        // Missing required target
        source: 'node1',
      };

      const result = validateLink(link as SimulationLinkDatum<SimulationNodeDatum>);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Required property "target" is missing');
    });
  });

  describe('validateNodes', () => {
    it('should validate an array of valid nodes', () => {
      const nodes: SimulationNodeDatum[] = [
        { id: 'node1', x: 100, y: 200 },
        { id: 'node2', x: 300, y: 400 },
      ];

      const result = validateNodes(nodes);
      expect(result.valid).toBe(true);
    });

    it('should fail validation if any node is invalid', () => {
      const nodes = [
        { id: 'node1', x: 100, y: 200 },
        { x: 300, y: 400 }, // Missing id
      ];

      const result = validateNodes(nodes as SimulationNodeDatum[]);
      expect(result.valid).toBe(false);
      expect(result.errors[0].path).toContain('nodes[1]');
    });
  });

  describe('validateLinks', () => {
    it('should validate an array of valid links', () => {
      const links = [
        { source: 'node1', target: 'node2' },
        { source: 'node2', target: 'node3' },
      ];

      const result = validateLinks(links);
      expect(result.valid).toBe(true);
    });

    it('should fail validation if any link is invalid', () => {
      const links = [
        { source: 'node1', target: 'node2' },
        { source: 'node2' }, // Missing target
      ];

      const result = validateLinks(links as SimulationLinkDatum<SimulationNodeDatum>[]);
      expect(result.valid).toBe(false);
      expect(result.errors[0].path).toContain('links[1]');
    });
  });

  describe('extendSchema', () => {
    it('should merge base schema with extension', () => {
      const baseSchema: Schema = {
        name: 'Base',
        description: 'Base schema',
        properties: {
          id: {
            type: 'string',
            required: true,
          },
        },
      };

      const extension: Partial<Schema> = {
        name: 'Extended',
        properties: {
          value: {
            type: 'number',
            required: true,
          },
        },
      };

      const extended = extendSchema(baseSchema, extension);

      expect(extended.name).toBe('Extended');
      expect(extended.description).toBe('Base schema');
      expect(extended.properties.id).toBeDefined();
      expect(extended.properties.value).toBeDefined();
    });
  });

  describe('assertValid', () => {
    it('should not throw for valid data', () => {
      const schema: Schema = {
        name: 'TestSchema',
        description: 'Test schema',
        properties: {
          id: {
            type: 'string',
            required: true,
          },
        },
      };

      const validObject = { id: 'test' };

      expect(() => assertValid(validObject, schema)).not.toThrow();
    });

    it('should throw for invalid data', () => {
      const schema: Schema = {
        name: 'TestSchema',
        description: 'Test schema',
        properties: {
          id: {
            type: 'string',
            required: true,
          },
        },
      };

      const invalidObject = { name: 'test' }; // Missing id

      expect(() => assertValid(invalidObject, schema)).toThrow();
    });
  });
});

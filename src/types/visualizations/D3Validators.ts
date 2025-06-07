/**
 * @context: type-definitions, visualization-system
 *
 * D3 Data Validation Utilities
 *
 * This module provides schema-based validators for D3 data structures.
 * These validators perform runtime checks to ensure data integrity beyond static type checking.
 */

import { SimulationLinkDatum, SimulationNodeDatum } from './D3Types';

/**
 * Represents a validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Represents a validation error
 */
export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
}

/**
 * Represents a schema property definition
 */
export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function' | 'date' | 'unknown';
  required?: boolean;
  nullable?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: unknown[];
  validate?: (value: unknown) => boolean | string;
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
  additionalProperties?: boolean;
}

/**
 * Represents a schema for a D3 data structure
 */
export interface Schema {
  name: string;
  description: string;
  properties: Record<string, SchemaProperty>;
  additionalProperties?: boolean;
}

/**
 * Schema for D3 simulation node data
 */
export const nodeSchema: Schema = {
  name: 'Node',
  description: 'Schema for D3 simulation node data',
  properties: {
    id: {
      type: 'string',
      required: true,
      validate: value => value !== '',
    },
    x: {
      type: 'number',
      nullable: true,
    },
    y: {
      type: 'number',
      nullable: true,
    },
    fx: {
      type: 'number',
      nullable: true,
    },
    fy: {
      type: 'number',
      nullable: true,
    },
    vx: {
      type: 'number',
      nullable: true,
    },
    vy: {
      type: 'number',
      nullable: true,
    },
    index: {
      type: 'number',
      nullable: true,
    },
  },
  additionalProperties: true,
};

/**
 * Schema for D3 simulation link data
 */
export const linkSchema: Schema = {
  name: 'Link',
  description: 'Schema for D3 simulation link data',
  properties: {
    source: {
      type: 'unknown', // Can be string or object
      required: true,
      validate: value => value !== null && value !== undefined,
    },
    target: {
      type: 'unknown', // Can be string or object
      required: true,
      validate: value => value !== null && value !== undefined,
    },
    index: {
      type: 'number',
      nullable: true,
    },
  },
  additionalProperties: true,
};

/**
 * Validate an object against a schema
 *
 * @param data The object to validate
 * @param schema The schema to validate against
 * @param path The current path (for error reporting)
 * @returns A validation result
 */
export function validateSchema<T>(data: T, schema: Schema, path = ''): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [] };

  if (!data || typeof data !== 'object') {
    result.valid = false;
    result.errors.push({
      path,
      message: `Expected object but got ${data === null ? 'null' : typeof data}`,
      value: data,
    });
    return result;
  }

  // Check required properties
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    const propPath = path ? `${path}.${propName}` : propName;
    const value = (data as Record<string, unknown>)[propName];

    // Check if required property is missing
    if (propSchema.required && (value === undefined || value === null) && !propSchema.nullable) {
      result.valid = false;
      result.errors.push({
        path: propPath,
        message: `Required property "${propName}" is missing`,
      });
      continue;
    }

    // Skip validation if value is null/undefined and nullable
    if ((value === undefined || value === null) && (propSchema.nullable || !propSchema.required)) {
      continue;
    }

    // Validate type
    if (!validateType(value, propSchema.type)) {
      result.valid = false;
      result.errors.push({
        path: propPath,
        message: `Expected type ${propSchema.type} but got ${typeof value}`,
        value,
      });
      continue;
    }

    // Validate min/max for numbers
    if (propSchema.type === 'number' && typeof value === 'number') {
      if (propSchema.min !== undefined && value < propSchema.min) {
        result.valid = false;
        result.errors.push({
          path: propPath,
          message: `Value ${value} is less than minimum ${propSchema.min}`,
          value,
        });
      }

      if (propSchema.max !== undefined && value > propSchema.max) {
        result.valid = false;
        result.errors.push({
          path: propPath,
          message: `Value ${value} is greater than maximum ${propSchema.max}`,
          value,
        });
      }
    }

    // Validate min/max for strings (length)
    if (propSchema.type === 'string' && typeof value === 'string') {
      if (propSchema.min !== undefined && value.length < propSchema.min) {
        result.valid = false;
        result.errors.push({
          path: propPath,
          message: `String length ${value.length} is less than minimum ${propSchema.min}`,
          value,
        });
      }

      if (propSchema.max !== undefined && value.length > propSchema.max) {
        result.valid = false;
        result.errors.push({
          path: propPath,
          message: `String length ${value.length} is greater than maximum ${propSchema.max}`,
          value,
        });
      }

      // Validate pattern
      if (propSchema.pattern && !propSchema.pattern.test(value)) {
        result.valid = false;
        result.errors.push({
          path: propPath,
          message: `String does not match pattern ${propSchema.pattern}`,
          value,
        });
      }
    }

    // Validate enum
    if (propSchema.enum && !propSchema.enum.includes(value)) {
      result.valid = false;
      result.errors.push({
        path: propPath,
        message: `Value must be one of [${propSchema.enum.join(', ')}]`,
        value,
      });
    }

    // Validate custom validator
    if (propSchema.validate) {
      const validationResult = propSchema.validate(value);
      if (validationResult !== true) {
        result.valid = false;
        result.errors.push({
          path: propPath,
          message:
            typeof validationResult === 'string' ? validationResult : 'Failed custom validation',
          value,
        });
      }
    }

    // Validate nested objects
    if (
      propSchema.type === 'object' &&
      propSchema.properties &&
      typeof value === 'object' &&
      value !== null
    ) {
      const nestedSchema: Schema = {
        name: `${schema.name}.${propName}`,
        description: `Nested object schema for ${propPath}`,
        properties: propSchema.properties,
        additionalProperties: schema.additionalProperties,
      };

      const nestedResult = validateSchema(value, nestedSchema, propPath);
      if (!nestedResult.valid) {
        result.valid = false;
        result.errors.push(...nestedResult.errors);
      }
    }

    // Validate arrays
    if (propSchema.type === 'array' && propSchema.items && Array.isArray(value)) {
      // Validate each item in the array
      value.forEach((item, index) => {
        const itemPath = `${propPath}[${index}]`;

        // Validate type of each item
        if (!validateType(item, propSchema.items!.type)) {
          result.valid = false;
          result.errors.push({
            path: itemPath,
            message: `Expected array item to be of type ${propSchema.items!.type} but got ${typeof item}`,
            value: item,
          });
          return; // Skip further validation for this item
        }

        // Validate nested schema for object items
        if (
          propSchema.items!.type === 'object' &&
          propSchema.items!.properties &&
          typeof item === 'object' &&
          item !== null
        ) {
          const itemSchema: Schema = {
            name: `${schema.name}.${propName}[${index}]`,
            description: `Array item schema for ${itemPath}`,
            properties: propSchema.items!.properties,
            additionalProperties: schema.additionalProperties,
          };

          const nestedResult = validateSchema(item, itemSchema, itemPath);
          if (!nestedResult.valid) {
            result.valid = false;
            result.errors.push(...nestedResult.errors);
          }
        }
      });
    }
  }

  // Check additional properties (if not allowed)
  if (schema.additionalProperties === false) {
    const allowedProps = Object.keys(schema.properties);
    const actualProps = Object.keys(data as Record<string, unknown>);

    const unexpectedProps = actualProps.filter(prop => !allowedProps.includes(prop));

    if (unexpectedProps.length > 0) {
      result.valid = false;
      unexpectedProps.forEach(prop => {
        result.errors.push({
          path: path ? `${path}.${prop}` : prop,
          message: `Unexpected property "${prop}"`,
          value: (data as Record<string, unknown>)[prop],
        });
      });
    }
  }

  return result;
}

/**
 * Validate a D3 node
 *
 * @param node The node to validate
 * @param customSchema Optional custom schema to extend the base node schema
 * @returns A validation result
 */
export function validateNode<T extends SimulationNodeDatum>(
  node: T,
  customSchema?: Partial<Schema>
): ValidationResult {
  // Merge base schema with custom schema
  const schema: Schema = {
    ...nodeSchema,
    ...customSchema,
    properties: {
      ...nodeSchema.properties,
      ...(customSchema?.properties ?? {}),
    },
  };

  return validateSchema(node, schema);
}

/**
 * Validate a D3 link
 *
 * @param link The link to validate
 * @param customSchema Optional custom schema to extend the base link schema
 * @returns A validation result
 */
export function validateLink<N extends SimulationNodeDatum, L extends SimulationLinkDatum<N>>(
  link: L,
  customSchema?: Partial<Schema>
): ValidationResult {
  // Merge base schema with custom schema
  const schema: Schema = {
    ...linkSchema,
    ...customSchema,
    properties: {
      ...linkSchema.properties,
      ...(customSchema?.properties ?? {}),
    },
  };

  return validateSchema(link, schema);
}

/**
 * Validate an array of D3 nodes
 *
 * @param nodes The nodes to validate
 * @param customSchema Optional custom schema to extend the base node schema
 * @returns A validation result
 */
export function validateNodes<T extends SimulationNodeDatum>(
  nodes: T[],
  customSchema?: Partial<Schema>
): ValidationResult {
  if (!Array.isArray(nodes)) {
    return {
      valid: false,
      errors: [{ path: '', message: 'Expected an array of nodes', value: nodes }],
    };
  }

  const result: ValidationResult = { valid: true, errors: [] };

  nodes.forEach((node, index) => {
    const nodeResult = validateNode(node, customSchema);

    if (!nodeResult.valid) {
      result.valid = false;
      nodeResult.errors.forEach(error => {
        result.errors.push({
          path: `nodes[${index}]${error.path ? '.' + error.path : ''}`,
          message: error.message,
          value: error.value,
        });
      });
    }
  });

  return result;
}

/**
 * Validate an array of D3 links
 *
 * @param links The links to validate
 * @param customSchema Optional custom schema to extend the base link schema
 * @returns A validation result
 */
export function validateLinks<N extends SimulationNodeDatum, L extends SimulationLinkDatum<N>>(
  links: L[],
  customSchema?: Partial<Schema>
): ValidationResult {
  if (!Array.isArray(links)) {
    return {
      valid: false,
      errors: [{ path: '', message: 'Expected an array of links', value: links }],
    };
  }

  const result: ValidationResult = { valid: true, errors: [] };

  links.forEach((link, index) => {
    const linkResult = validateLink(link, customSchema);

    if (!linkResult.valid) {
      result.valid = false;
      linkResult.errors.forEach(error => {
        result.errors.push({
          path: `links[${index}]${error.path ? '.' + error.path : ''}`,
          message: error.message,
          value: error.value,
        });
      });
    }
  });

  return result;
}

/**
 * Create a custom schema for a specific visualization component
 *
 * @param baseSchema The base schema to extend
 * @param extension The schema extension
 * @returns A merged schema
 */
export function extendSchema(baseSchema: Schema, extension: Partial<Schema>): Schema {
  return {
    ...baseSchema,
    ...extension,
    properties: {
      ...baseSchema.properties,
      ...(extension.properties ?? {}),
    },
  };
}

/**
 * Helper function to validate type
 */
function validateType(value: unknown, type: SchemaProperty['type']): boolean {
  if (type === 'unknown') return true;

  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'function':
      return typeof value === 'function';
    case 'date':
      return value instanceof Date;
    default:
      return false;
  }
}

/**
 * Helper function to create error message with path
 */
export function formatValidationErrors(result: ValidationResult): string[] {
  return result.errors.map(error => `${error.path}: ${error.message}`);
}

/**
 * Throw error if validation fails
 */
export function assertValid<T>(
  data: T,
  schema: Schema,
  errorPrefix = 'Validation error'
): void {
  const result = validateSchema(data, schema);
  if (!result.valid) {
    const messages = formatValidationErrors(result);
    throw new Error(`${errorPrefix}: ${messages.join('; ')}`);
  }
}

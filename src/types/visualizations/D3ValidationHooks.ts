/**
 * D3 Validation Hooks
 *
 * This module provides hooks and utilities for validating data transformations
 * in D3 visualization components. These hooks integrate with the schema-based
 * validators to provide runtime validation at key transformation points.
 */

import { SimulationLinkDatum, SimulationNodeDatum } from './D3Types';
import {
  formatValidationErrors,
  linkSchema,
  nodeSchema,
  Schema,
  SchemaProperty,
  validateLinks,
  validateNodes,
  validateSchema,
  ValidationResult,
} from './D3Validators';

/**
 * Configuration options for validation hooks
 */
export interface ValidationHookOptions {
  /** Whether to throw an error when validation fails */
  throwOnError?: boolean;
  /** Whether to log validation errors to the console */
  logErrors?: boolean;
  /** Custom error prefix for better identification */
  errorPrefix?: string;
  /** Validation level (determines which validations to run) */
  validationLevel?: 'strict' | 'normal' | 'relaxed';
}

/**
 * Default validation hook options
 */
const defaultOptions: ValidationHookOptions = {
  throwOnError: false,
  logErrors: true,
  errorPrefix: 'D3 Validation Error',
  validationLevel: 'normal',
};

/**
 * Result of a data transformation with validation
 */
export interface ValidationTransformResult<T> {
  /** The transformed data */
  data: T;
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors (if any) */
  errors: string[];
  /** Original validation result */
  validationResult?: ValidationResult;
}

/**
 * Higher-order function that wraps a data transformation function with validation
 *
 * @param transformFn The data transformation function to wrap
 * @param inputSchema Schema for validating input data
 * @param outputSchema Schema for validating output data
 * @param options Validation options
 * @returns A function that performs the transformation with validation
 */
export function withSchemaValidation<InputType, OutputType>(
  transformFn: (data: InputType) => OutputType,
  inputSchema: Schema,
  outputSchema: Schema,
  options: ValidationHookOptions = {}
): (data: InputType) => ValidationTransformResult<OutputType> {
  const mergedOptions = { ...defaultOptions, ...options };

  return (data: InputType): ValidationTransformResult<OutputType> => {
    // Validate input data
    const inputValidation = validateSchema(data, inputSchema);

    if (!inputValidation.valid) {
      const errors = formatValidationErrors(inputValidation);

      if (mergedOptions.logErrors) {
        console.error(`${mergedOptions.errorPrefix} (Input): ${errors.join('; ')}`);
      }

      if (mergedOptions.throwOnError) {
        throw new Error(`${mergedOptions.errorPrefix} (Input): ${errors.join('; ')}`);
      }

      // Return early with errors if validation fails and we're in strict mode
      if (mergedOptions.validationLevel === 'strict') {
        return {
          data: {} as OutputType, // Return empty object as data
          valid: false,
          errors,
          validationResult: inputValidation,
        };
      }
    }

    // Perform transformation
    const transformedData = transformFn(data);

    // Validate output data
    const outputValidation = validateSchema(transformedData, outputSchema);

    if (!outputValidation.valid) {
      const errors = formatValidationErrors(outputValidation);

      if (mergedOptions.logErrors) {
        console.error(`${mergedOptions.errorPrefix} (Output): ${errors.join('; ')}`);
      }

      if (mergedOptions.throwOnError) {
        throw new Error(`${mergedOptions.errorPrefix} (Output): ${errors.join('; ')}`);
      }

      return {
        data: transformedData,
        valid: false,
        errors,
        validationResult: outputValidation,
      };
    }

    // All validations passed
    return {
      data: transformedData,
      valid: true,
      errors: [],
      validationResult: outputValidation,
    };
  };
}

/**
 * Higher-order function that validates D3 nodes during transformation
 *
 * @param transformFn The node transformation function to wrap
 * @param customNodeSchema Optional custom schema for nodes
 * @param options Validation options
 * @returns A function that performs node transformation with validation
 */
export function withNodeValidation<InputType, T extends SimulationNodeDatum>(
  transformFn: (data: InputType) => T[],
  customNodeSchema?: Partial<Schema>,
  options: ValidationHookOptions = {}
): (data: InputType) => ValidationTransformResult<T[]> {
  const mergedOptions = { ...defaultOptions, ...options };

  return (data: InputType): ValidationTransformResult<T[]> => {
    try {
      // Transform the data first
      const transformedNodes = transformFn(data);

      // Validate the nodes
      const nodeValidation = validateNodes(transformedNodes, customNodeSchema);

      if (!nodeValidation.valid) {
        const errors = formatValidationErrors(nodeValidation);

        if (mergedOptions.logErrors) {
          console.error(`${mergedOptions.errorPrefix} (Nodes): ${errors.join('; ')}`);
        }

        if (mergedOptions.throwOnError) {
          throw new Error(`${mergedOptions.errorPrefix} (Nodes): ${errors.join('; ')}`);
        }

        return {
          data: transformedNodes,
          valid: false,
          errors,
          validationResult: nodeValidation,
        };
      }

      // All validations passed
      return {
        data: transformedNodes,
        valid: true,
        errors: [],
        validationResult: nodeValidation,
      };
    } catch (error) {
      // Handle unexpected errors during transformation
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (mergedOptions.logErrors) {
        console.error(`${mergedOptions.errorPrefix} (Transform): ${errorMessage}`);
      }

      if (mergedOptions.throwOnError) {
        throw error;
      }

      return {
        data: [] as T[],
        valid: false,
        errors: [`Transformation error: ${errorMessage}`],
        validationResult: { valid: false, errors: [] },
      };
    }
  };
}

/**
 * Higher-order function that validates D3 links during transformation
 *
 * @param transformFn The link transformation function to wrap
 * @param customLinkSchema Optional custom schema for links
 * @param options Validation options
 * @returns A function that performs link transformation with validation
 */
export function withLinkValidation<
  InputType,
  N extends SimulationNodeDatum,
  L extends SimulationLinkDatum<N>,
>(
  transformFn: (data: InputType) => L[],
  customLinkSchema?: Partial<Schema>,
  options: ValidationHookOptions = {}
): (data: InputType) => ValidationTransformResult<L[]> {
  const mergedOptions = { ...defaultOptions, ...options };

  return (data: InputType): ValidationTransformResult<L[]> => {
    try {
      // Transform the data first
      const transformedLinks = transformFn(data);

      // Validate the links
      const linkValidation = validateLinks<N, L>(transformedLinks, customLinkSchema);

      if (!linkValidation.valid) {
        const errors = formatValidationErrors(linkValidation);

        if (mergedOptions.logErrors) {
          console.error(`${mergedOptions.errorPrefix} (Links): ${errors.join('; ')}`);
        }

        if (mergedOptions.throwOnError) {
          throw new Error(`${mergedOptions.errorPrefix} (Links): ${errors.join('; ')}`);
        }

        return {
          data: transformedLinks,
          valid: false,
          errors,
          validationResult: linkValidation,
        };
      }

      // All validations passed
      return {
        data: transformedLinks,
        valid: true,
        errors: [],
        validationResult: linkValidation,
      };
    } catch (error) {
      // Handle unexpected errors during transformation
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (mergedOptions.logErrors) {
        console.error(`${mergedOptions.errorPrefix} (Transform): ${errorMessage}`);
      }

      if (mergedOptions.throwOnError) {
        throw error;
      }

      return {
        data: [] as L[],
        valid: false,
        errors: [`Transformation error: ${errorMessage}`],
        validationResult: { valid: false, errors: [] },
      };
    }
  };
}

/**
 * Validates data transformation with progress updates
 * (useful for large data sets or multi-step transformations)
 *
 * @param transformFn The multi-step transformation function
 * @param steps Array of transformation steps with schemas
 * @param options Validation options
 * @returns A function that performs step-by-step transformation with validation
 */
export function withStepValidation<InputType, OutputType>(
  transformFn: (data: InputType, onProgress: (step: number, data: unknown) => void) => OutputType,
  steps: Array<{
    name: string;
    schema: Schema;
    required?: boolean;
  }>,
  options: ValidationHookOptions = {}
): (data: InputType) => ValidationTransformResult<OutputType> {
  const mergedOptions = { ...defaultOptions, ...options };

  return (data: InputType): ValidationTransformResult<OutputType> => {
    const errors: string[] = [];
    let transformedData: OutputType;
    let currentStep = 0;

    // Progress callback with validation
    const onProgress = (step: number, stepData: unknown) => {
      // Skip steps outside of defined range
      if (step < 0 || step >= steps.length) {
        return;
      }

      currentStep = step;
      const { name, schema, required = true } = steps[step];

      // Skip validation if data is null/undefined and not required
      if ((stepData === null || stepData === undefined) && !required) {
        return;
      }

      // Validate the step data
      const stepValidation = validateSchema(stepData, schema);

      if (!stepValidation.valid) {
        const stepErrors = formatValidationErrors(stepValidation);
        const errorPrefix = `${mergedOptions.errorPrefix} (Step ${step} - ${name})`;

        if (mergedOptions.logErrors) {
          console.error(`${errorPrefix}: ${stepErrors.join('; ')}`);
        }

        errors.push(...stepErrors.map(err => `Step ${step} (${name}): ${err}`));

        if (mergedOptions.throwOnError) {
          throw new Error(`${errorPrefix}: ${stepErrors.join('; ')}`);
        }
      }
    };

    try {
      // Run transformation with progress validation
      transformedData = transformFn(data, onProgress);

      // Return result with errors if any
      return {
        data: transformedData,
        valid: errors.length === 0,
        errors,
        validationResult: {
          valid: errors.length === 0,
          errors: errors.map(message => ({ path: `step-${currentStep}`, message })),
        },
      };
    } catch (error) {
      // Handle unexpected errors during transformation
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (
        mergedOptions.logErrors &&
        !(error instanceof Error && error.message.includes(mergedOptions.errorPrefix ?? ''))
      ) {
        console.error(`${mergedOptions.errorPrefix} (Transform): ${errorMessage}`);
      }

      return {
        data: {} as OutputType,
        valid: false,
        errors: [...errors, `Transformation error: ${errorMessage}`],
        validationResult: {
          valid: false,
          errors: [
            ...errors.map(message => ({ path: `step-${currentStep}`, message })),
            { path: 'transform', message: errorMessage },
          ],
        },
      };
    }
  };
}

/**
 * Creates a schema specific to D3 simulation data
 * (nodes + links) with custom extensions
 *
 * @param customNodeProps Custom schema properties for nodes
 * @param customLinkProps Custom schema properties for links
 * @returns A pair of schemas for nodes and links
 */
export function createD3SimulationSchemas(
  customNodeProps?: Record<string, SchemaProperty>,
  customLinkProps?: Record<string, SchemaProperty>
): { nodeSchema: Schema; linkSchema: Schema } {
  // Create extended node schema
  const extendedNodeSchema = customNodeProps
    ? {
        ...nodeSchema,
        properties: {
          ...nodeSchema.properties,
          ...customNodeProps,
        },
      }
    : nodeSchema;

  // Create extended link schema
  const extendedLinkSchema = customLinkProps
    ? {
        ...linkSchema,
        properties: {
          ...linkSchema.properties,
          ...customLinkProps,
        },
      }
    : linkSchema;

  return {
    nodeSchema: extendedNodeSchema,
    linkSchema: extendedLinkSchema,
  };
}

/**
 * Creates a validation wrapper specifically for D3 force simulation data
 *
 * @param nodeTransformFn (...args: unknown[]) => unknown to transform raw data into simulation nodes
 * @param linkTransformFn (...args: unknown[]) => unknown to transform raw data into simulation links
 * @param customNodeSchema Custom schema for nodes
 * @param customLinkSchema Custom schema for links
 * @param options Validation options
 * @returns (...args: unknown[]) => unknowns to transform and validate nodes and links
 */
export function createD3ForceValidation<
  InputType,
  N extends SimulationNodeDatum,
  L extends SimulationLinkDatum<N>,
>(
  nodeTransformFn: (data: InputType) => N[],
  linkTransformFn: (data: InputType) => L[],
  customNodeSchema?: Partial<Schema>,
  customLinkSchema?: Partial<Schema>,
  options: ValidationHookOptions = {}
): {
  validateNodes: (data: InputType) => ValidationTransformResult<N[]>;
  validateLinks: (data: InputType) => ValidationTransformResult<L[]>;
} {
  return {
    validateNodes: withNodeValidation<InputType, N>(nodeTransformFn, customNodeSchema, options),
    validateLinks: withLinkValidation<InputType, N, L>(linkTransformFn, customLinkSchema, options),
  };
}

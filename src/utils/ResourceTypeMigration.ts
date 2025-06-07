/**
 * ResourceTypeMigration.ts
 *
 * Utilities to help with migrating from string-based to enum-based resource types.
 * This file provides functions to assist with the transition and will eventually be removed
 * once the migration is complete.
 */

import { ResourceType, ResourceTypeString } from '../types/resources/ResourceTypes';
import { ResourceTypeConverter } from './ResourceTypeConverter';

/**
 * Type alias for string-based resource types (for backcombatd compatibility)
 */
export type StringResourceType = ResourceTypeString;

/**
 * Type alias for enum-based resource types
 */
export type EnumResourceType = ResourceType;

/**
 * @deprecated Use enum-based ResourceType from ResourceTypes.ts instead
 * This function logs a deprecation warning when string-based resource types are used.
 * It helps identify code that needs to be migrated to the enum-based system.
 *
 * @param resourceType The string-based resource type
 * @param context Additional context about where the resource type is being used
 * @returns The original string resource type for backcombatd compatibility
 */
export function deprecateStringResourceType(
  resourceType: StringResourceType,
  context = 'unknown'
): StringResourceType {
  // Only log in development to avoid console spam in production
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[DEPRECATED] String-based ResourceType "${resourceType}" used in ${context}. ` +
        `Use enum-based ResourceType.${resourceType} instead. ` +
        `This will be removed in a future version.`
    );
  }
  return resourceType;
}

/**
 * @deprecated Use ResourceTypeConverter.stringToEnum directly
 * Converts a string resource type to an enum resource type with deprecation warning.
 *
 * @param resourceType The string-based resource type
 * @param context Additional context about where the resource type is being used
 * @returns The corresponding enum resource type or undefined if not found
 */
export function migrateToEnumResourceType(
  resourceType: StringResourceType,
  context = 'unknown'
): EnumResourceType | undefined {
  deprecateStringResourceType(resourceType, context);
  return ResourceTypeConverter.stringToEnum(resourceType);
}

/**
 * Wraps a function that takes a string resource type to accept an enum resource type.
 * This helps with migrating APIs that currently expect string-based resource types.
 *
 * @param fn The function that takes a string resource type
 * @returns A new function that accepts either string or enum resource type
 */
export function wrapResourceTypeFunction<T, R>(
  fn: (resourceType: StringResourceType, ...args: T[]) => R
): (resourceType: StringResourceType | EnumResourceType, ...args: T[]) => R {
  return (resourceType: StringResourceType | EnumResourceType, ...args: T[]) => {
    if (typeof resourceType !== 'string') {
      const stringType = ResourceTypeConverter.enumToString(resourceType);
      if (!stringType) {
        throw new Error(`Cannot convert enum resource type ${resourceType} to string`);
      }
      return fn(stringType as StringResourceType, ...args);
    }

    deprecateStringResourceType(resourceType as StringResourceType, fn.name || 'function');
    return fn(resourceType as StringResourceType, ...args);
  };
}

/**
 * Wraps an object's methods that take string resource types to accept enum resource types.
 * This helps with migrating classes that currently expect string-based resource types.
 *
 * @param obj The object with methods that take string resource types
 * @param methodNames The names of the methods to wrap
 * @returns The same object with wrapped methods
 */
export function wrapResourceTypeMethods<T extends object>(obj: T, methodNames: (keyof T)[]): T {
  methodNames.forEach(methodName => {
    const originalMethod = obj[methodName];
    if (typeof originalMethod === 'function') {
      // @ts-expect-error - This is a complex type transformation that TypeScript can't fully type check
      obj[methodName] = wrapResourceTypeFunction(originalMethod.bind(obj));
    }
  });

  return obj;
}

/**
 * Creates a proxy for an object that automatically converts string resource types to enum resource types.
 * This helps with migrating objects that store string-based resource types.
 *
 * @param obj The object with string resource type keys
 * @returns A proxy that converts keys automatically
 */
export function createResourceTypeProxy<T>(
  obj: Record<StringResourceType, T>
): Record<StringResourceType | EnumResourceType, T> {
  return new Proxy(obj, {
    get(target, prop) {
      if (typeof prop === 'string' && prop in target) {
        return target[prop as StringResourceType];
      }

      if (typeof prop === 'symbol') {
        // For symbols, we need to use a type assertion to access the property
        return (target as Record<symbol, unknown>)[prop];
      }

      // Try to convert enum to string
      const stringType = ResourceTypeConverter.enumToString(prop as unknown as EnumResourceType);
      if (stringType && stringType in target) {
        // Cast stringType to StringResourceType to ensure type safety
        return target[stringType as unknown as StringResourceType];
      }

      return undefined;
    },
    set(target, prop, value) {
      if (typeof prop === 'string' && prop in target) {
        target[prop as StringResourceType] = value;
        return true;
      }

      // Try to convert enum to string
      const stringType = ResourceTypeConverter.enumToString(prop as unknown as EnumResourceType);
      if (stringType) {
        // Cast stringType to StringResourceType to ensure type safety
        target[stringType as unknown as StringResourceType] = value;
        return true;
      }

      // For new properties, just set them directly
      (target as unknown as Record<string, T>)[prop as string] = value;
      return true;
    },
    has(target, prop) {
      if (prop in target) {
        return true;
      }

      // Try to convert enum to string
      const stringType = ResourceTypeConverter.enumToString(prop as unknown as EnumResourceType);
      return stringType ? stringType in target : false;
    },
  }) as Record<StringResourceType | EnumResourceType, T>;
}

/**
 * Marks a class or method as using the new enum-based resource type system.
 * This is a TypeScript decorator that can be used to document code that has been migrated.
 *
 * @example
 * ```
 * @usesEnumResourceType
 * class ResourceProcessor {
 *   // This class uses enum-based resource types
 * }
 *
 * class ResourceManager {
 *   @usesEnumResourceType
 *   processResource(type: EnumResourceType) {
 *     // This method uses enum-based resource types
 *   }
 * }
 * ```
 */
export function usesEnumResourceType(
  target: unknown,
  propertyKey?: string,
  descriptor?: PropertyDescriptor
) {
  if (propertyKey && descriptor) {
    // Method decorator
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      return originalMethod.apply(this, args);
    };
    return descriptor;
  } else {
    // Class decorator
    return target;
  }
}

/**
 * Adds a deprecation notice to a class or method that uses string-based resource types.
 * This is a TypeScript decorator that can be used to document code that needs migration.
 *
 * @example
 * ```
 * @deprecatedStringResourceType
 * class LegacyResourceProcessor {
 *   // This class uses string-based resource types and should be migrated
 * }
 *
 * class ResourceManager {
 *   @deprecatedStringResourceType
 *   processResource(type: StringResourceType) {
 *     // This method uses string-based resource types and should be migrated
 *   }
 * }
 * ```
 */
export function deprecatedStringResourceType(
  target: unknown,
  propertyKey?: string,
  descriptor?: PropertyDescriptor
) {
  // Use type assertion to access constructor and name properties
  const context = propertyKey
    ? `${(target as { constructor: { name: string } }).constructor.name}.${propertyKey}`
    : (target as { name: string }).name;

  if (propertyKey && descriptor) {
    // Method decorator
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      console.warn(
        `[DEPRECATED] Method ${context} uses string-based ResourceType. ` +
          `Migrate to enum-based ResourceType from ResourceTypes.ts. ` +
          `This will be removed in a future version.`
      );
      return originalMethod.apply(this, args);
    };
    return descriptor;
  } else {
    // Class decorator
    console.warn(
      `[DEPRECATED] Class ${context} uses string-based ResourceType. ` +
        `Migrate to enum-based ResourceType from ResourceTypes.ts. ` +
        `This will be removed in a future version.`
    );
    return target;
  }
}

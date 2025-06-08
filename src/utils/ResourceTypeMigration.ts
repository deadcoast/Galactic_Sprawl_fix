/**
 * ResourceTypeMigration.ts
 *
 * Utilities to help with migrating from string-based to enum-based resource types.
 * This file provides functions to assist with the transition and will eventually be removed
 * once the migration is complete.
 */

import { errorLoggingService, ErrorSeverity, ErrorType } from '../services/logging/ErrorLoggingService';
import { ResourceType, ResourceTypeString } from '../types/resources/ResourceTypes';
import { ResourceTypeConverter } from './ResourceTypeConverter';

/**
 * Type alias for string-based resource types (for backward compatibility)
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
 * @returns The original string resource type for backward compatibility
 */
export function deprecateStringResourceType(
  resourceType: StringResourceType,
  context = 'unknown'
): StringResourceType {
  // Only log in development to avoid console spam in production
  if (process.env.NODE_ENV !== 'production') {
    errorLoggingService.logWarn(
      `String-based ResourceType "${resourceType}" used in ${context}. Use enum-based ResourceType instead.`,
      {
        resourceType,
        context,
        migrationStatus: 'deprecated'
      }
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
        const errorMsg = `Cannot convert enum resource type to string`;
        errorLoggingService.logError(
          new Error(errorMsg),
          ErrorType.VALIDATION,
          ErrorSeverity.HIGH,
          { resourceType, functionName: fn.name }
        );
        throw new Error(errorMsg);
      }
      // Type assertion for safety after validation
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
export function wrapResourceTypeMethods<T extends Record<string, unknown>>(obj: T, methodNames: (keyof T)[]): T {
  methodNames.forEach(methodName => {
    const originalMethod = obj[methodName];
    if (typeof originalMethod === 'function') {
      // Safe function wrapping with proper type handling
      const wrappedMethod = wrapResourceTypeFunction(originalMethod.bind(obj) as (resourceType: StringResourceType, ...args: unknown[]) => unknown);
      (obj as Record<string, unknown>)[methodName as string] = wrappedMethod;
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
      if (typeof prop === 'string' || typeof prop === 'number') {
        const stringType = ResourceTypeConverter.enumToString(prop as EnumResourceType);
        if (stringType && stringType in target) {
          return target[stringType as StringResourceType];
        }
      }

      return undefined;
    },
    set(target, prop, value) {
      if (typeof prop === 'string' && prop in target) {
        target[prop as StringResourceType] = value;
        return true;
      }

      // Try to convert enum to string
      if (typeof prop === 'string' || typeof prop === 'number') {
        const stringType = ResourceTypeConverter.enumToString(prop as EnumResourceType);
        if (stringType) {
          target[stringType as StringResourceType] = value;
          return true;
        }
      }

      // For new properties, just set them directly
      (target as Record<string, T>)[prop as string] = value;
      return true;
    },
    has(target, prop) {
      if (prop in target) {
        return true;
      }

      // Try to convert enum to string
      if (typeof prop === 'string' || typeof prop === 'number') {
        const stringType = ResourceTypeConverter.enumToString(prop as EnumResourceType);
        return stringType ? stringType in target : false;
      }

      return false;
    },
  }) as Record<StringResourceType | EnumResourceType, T>;
}

/**
 * Marks a class or method as using the new enum-based resource type system.
 * This is a TypeScript decorator that can be used to document code that has been migrated.
 */
export function usesEnumResourceType(
  target: unknown,
  propertyKey?: string,
  descriptor?: PropertyDescriptor
) {
  if (propertyKey && descriptor) {
    // Method decorator
    const originalMethod = descriptor.value;
    if (typeof originalMethod === 'function') {
      descriptor.value = function (...args: unknown[]) {
        return originalMethod.apply(this, args);
      };
    }
    return descriptor;
  } else {
    // Class decorator
    return target;
  }
}

/**
 * Adds a deprecation notice to a class or method that uses string-based resource types.
 * This is a TypeScript decorator that can be used to document code that needs migration.
 */
export function deprecatedStringResourceType(
  target: unknown,
  propertyKey?: string,
  descriptor?: PropertyDescriptor
) {
  // Safe context determination
  let context = 'unknown';
  try {
    if (propertyKey && target && typeof target === 'object' && 'constructor' in target) {
      const constructor = target.constructor as { name?: string };
      context = `${constructor.name || 'UnknownClass'}.${propertyKey}`;
    } else if (target && typeof target === 'object' && 'name' in target) {
      const namedTarget = target as { name?: string };
      context = namedTarget.name || 'UnknownTarget';
    }
  } catch (error) {
    errorLoggingService.logWarn('Failed to determine context for deprecation warning', { error });
  }

  if (propertyKey && descriptor) {
    // Method decorator
    const originalMethod = descriptor.value;
    if (typeof originalMethod === 'function') {
      descriptor.value = function (...args: unknown[]) {
        errorLoggingService.logWarn(
          `Method ${context} uses string-based ResourceType. Migrate to enum-based ResourceType.`,
          {
            context,
            migrationStatus: 'needs-migration'
          }
        );
        return originalMethod.apply(this, args);
      };
    }
    return descriptor;
  } else {
    // Class decorator
    errorLoggingService.logWarn(
      `Class ${context} uses string-based ResourceType. Migrate to enum-based ResourceType.`,
      {
        context,
        migrationStatus: 'needs-migration'
      }
    );
    return target;
  }
}

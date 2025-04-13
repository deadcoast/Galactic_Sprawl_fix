/**
 * Resource Type Migration Utility
 *
 * This utility provides functions to help migrate from string-based resource types
 * to enum-based resource types. It includes functions for converting string literals,
 * object keys, arrays, and more.
 */

// Remove unused import, resolving the linter error
// import { ResourceType as StringResourceType } from '../../types/resources/LegacyResourceTypes'; // Assuming legacy types are here
import { ResourceType } from '../../types/resources/ResourceTypes';
import {
  ensureEnumResourceType,
  ensureStringResourceType,
  isValidStringType,
  toEnumResourceType,
} from './ResourceTypeConverter'; // Import needed converters

// Keep migration-specific functions like getMigrationMapping, findEnumResourceType, generateMigrationGuide
// Keep data transformation helpers if deemed necessary for migration specifically

/**
 * Generate a mapping of string literals to EnumResourceType
 * Following the resource type conversion pattern from context documentation
 * @returns Record mapping string literals to EnumResourceType values
 */
export function getMigrationMapping(): Record<string, ResourceType> {
  const mapping: Record<string, ResourceType> = {};

  // Map string literals to enum values - consistent with resource system patterns
  Object.values(ResourceType).forEach(resourceType => {
    // Convert to lowercase for case-insensitive matching
    const lowerCaseKey = resourceType.toLowerCase();
    mapping[lowerCaseKey] = resourceType as ResourceType;

    // Add additional common variations - following the pattern for handling variations
    if (lowerCaseKey === ResourceType.DARK_MATTER.toLowerCase()) {
      mapping['darkmatter'] = ResourceType.DARK_MATTER;
      mapping['dark-matter'] = ResourceType.DARK_MATTER;
    } else if (lowerCaseKey === ResourceType.EXOTIC_MATTER.toLowerCase()) {
      mapping['exoticmatter'] = ResourceType.EXOTIC_MATTER;
      mapping['exotic-matter'] = ResourceType.EXOTIC_MATTER;
    }
  });

  return mapping;
}

/**
 * Find an EnumResourceType by a fuzzy string match
 * Implements the resource type lookup pattern from context docs
 * @param value A string that might represent a resource type
 * @returns The matching EnumResourceType or undefined if no match
 */
export function findEnumResourceType(value: string): ResourceType | undefined {
  // Get the mapping of string literals to enum values
  const mapping = getMigrationMapping();

  // Try exact match first - following lookup pattern in context
  if (value in mapping) {
    return mapping[value];
  }

  // Try lowercase match - consistent with case-insensitive patterns
  const lowerValue = value.toLowerCase();
  if (lowerValue in mapping) {
    return mapping[lowerValue];
  }

  // Try to find a partial match - following fuzzy matching pattern
  const keys = Object.keys(mapping);
  for (const key of keys) {
    if (key.includes(lowerValue) || lowerValue.includes(key)) {
      return mapping[key];
    }
  }

  return undefined;
}

/**
 * Generates a migration guide for resource types
 * @returns A markdown string with a migration guide
 */
export function generateMigrationGuide(): string {
  let guide = `# Resource Type Migration Guide\n\n`;
  guide += `This guide helps you migrate from string-based resource types to enum-based resource types.\n\n`;
  guide += `## Mapping Table\n\n`;
  guide += `| String Type | Enum Type |\n`;
  guide += `|------------|----------|\n`;

  // Manually create the mapping table to avoid type issues
  guide += `| ResourceType.MINERALS | ResourceType.MINERALS |\n`;
  guide += `| ResourceType.ENERGY | ResourceType.ENERGY |\n`;
  guide += `| ResourceType.POPULATION | ResourceType.POPULATION |\n`;
  guide += `| ResourceType.RESEARCH | ResourceType.RESEARCH |\n`;
  guide += `| ResourceType.PLASMA | ResourceType.PLASMA |\n`;
  guide += `| ResourceType.GAS | ResourceType.GAS |\n`;
  guide += `| ResourceType.EXOTIC | ResourceType.EXOTIC |\n`;

  guide += `\n## Migration Steps\n\n`;
  guide += `1. Update imports to use ResourceTypes instead of unknown other resource type definition\n`;
  guide += `2. Replace string literals with enum values using the mapping table above\n`;
  guide += `3. Update function signatures to use the enum type\n`;
  guide += `4. Use the migration utility functions for complex cases\n`;

  return guide;
}

// Remove duplicated mapping constants and conversion/validation functions
// STRING_TO_ENUM_MAP, ENUM_TO_STRING_MAP
// toEnumResourceType, toStringResourceType
// isStringResourceType, isEnumResourceType
// ensureEnumResourceType, ensureStringResourceType
// validateEnumResourceType

// Keep data transformation functions if they are migration-specific

/**
 * Converts an array of items with resource types from string to enum
 * @param array The array to convert
 * @param converter The conversion function
 * @returns The converted array
 */
export function convertArrayResourceTypes<T>(array: T[], converter: (item: T) => T): T[] {
  return array.map(converter);
}

/**
 * Converts a record with string resource type keys to enum resource type keys
 * @param record The record to convert
 * @returns The converted record
 */
export function convertRecordResourceTypes<T>(
  record: Record<string, T> // Use string for keys as they are coming from potentially non-enum sources
): Record<ResourceType, T> {
  const result: Partial<Record<ResourceType, T>> = {};
  for (const [key, value] of Object.entries(record)) {
    if (isValidStringType(key)) {
      // Use the imported guard
      result[toEnumResourceType(key)] = value; // Use the imported converter
    }
  }
  return result as Record<ResourceType, T>;
}

/**
 * Converts a map with string resource type keys to enum resource type keys
 * @param map The map to convert
 * @returns The converted map
 */
export function convertMapResourceTypes<T>(map: Map<string, T>): Map<ResourceType, T> {
  const result = new Map<ResourceType, T>();
  // Use Array.from to avoid iterator issues
  Array.from(map.entries()).forEach(([key, value]) => {
    if (isValidStringType(key)) {
      // Use the imported guard
      result?.set(toEnumResourceType(key), value); // Use the imported converter
    }
  });
  return result;
}

/**
 * Analyzes a file for resource type migration needs
 * @param fileContent The file content to analyze
 * @returns Analysis results
 */
export function analyzeMigrationNeeds(fileContent: string): {
  stringResourceTypes: number;
  enumResourceTypes: number;
  mixedUsage: boolean;
} {
  const stringMatches = (
    fileContent.match(
      /['"]minerals['"]|['"]energy['"]|['"]population['"]|['"]research['"]|['"]plasma['"]|['"]gas['"]|['"]exotic['"]/gi // Added 'i' flag for case-insensitivity
    ) ?? []
  ).length;
  const enumMatches = (
    fileContent.match(
      /ResourceType\.(MINERALS|ENERGY|POPULATION|RESEARCH|PLASMA|GAS|EXOTIC|ORGANIC|FOOD|IRON|COPPER|TITANIUM|URANIUM|WATER|HELIUM|DEUTERIUM|ANTIMATTER|DARK_MATTER|EXOTIC_MATTER)/g
    ) ?? []
  ).length;

  return {
    stringResourceTypes: stringMatches,
    enumResourceTypes: enumMatches,
    mixedUsage: stringMatches > 0 && enumMatches > 0,
  };
}

/**
 * Applies migration to a file content (Example implementation - might need refinement)
 * @param fileContent The file content to migrate
 * @returns The migrated file content
 */
export function applyMigration(fileContent: string): string {
  let result = fileContent;

  // Replace string literals with enum values
  const resourceMapping = getMigrationMapping();
  for (const [stringVal, enumVal] of Object.entries(resourceMapping)) {
    // Handle single quotes: 'stringVal'
    // Escape potential special regex characters in stringVal if necessary
    const escapedStringVal = stringVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const singleQuoteRegex = new RegExp(`'${escapedStringVal}'`, 'g');
    result = result.replace(singleQuoteRegex, `ResourceType.${enumVal}`);

    // Handle double quotes: "stringVal"
    const doubleQuoteRegex = new RegExp(`"${escapedStringVal}"`, 'g');
    result = result.replace(doubleQuoteRegex, `ResourceType.${enumVal}`);
  }

  return result;
}

/**
 * Checks if a file needs migration
 * @param fileContent The file content to check
 * @returns Whether the file needs migration
 */
export function needsMigration(fileContent: string): boolean {
  const { stringResourceTypes, enumResourceTypes } = analyzeMigrationNeeds(fileContent);
  return stringResourceTypes > 0 && enumResourceTypes === 0;
}

/**
 * Creates a compatibility layer for functions that need to work with both string and enum resource types
 * @param original The original function
 * @param parameterIndices The indices of parameters to convert
 * @param convertToEnum Whether to convert to enum (true) or string (false)
 * @returns The wrapped function
 */
export function createResourceTypeCompatibilityLayer<T extends (...args: unknown[]) => unknown>(
  original: T,
  parameterIndices: number[],
  convertToEnum: boolean
): T {
  return ((...args: unknown[]) => {
    const necombatgs = [...args];
    for (const index of parameterIndices) {
      if (index >= args.length) continue;

      if (convertToEnum) {
        necombatgs[index] = ensureEnumResourceType(args[index]); // Use imported converter
      } else {
        necombatgs[index] = ensureStringResourceType(args[index]); // Use imported converter
      }
    }
    return original(...necombatgs);
  }) as T;
}

/**
 * Migrates object keys from string resource types to enum resource types
 * @param obj The object to migrate
 * @returns The migrated object
 */
export function migrateObjectKeys<T>(obj: Record<string, T>): Record<ResourceType, T> {
  const result: Partial<Record<ResourceType, T>> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isValidStringType(key)) {
      // Use imported guard
      result[toEnumResourceType(key)] = value; // Use imported converter
    }
  }

  return result as Record<ResourceType, T>;
}

/**
 * Migrates resource types in an array of objects
 * @param arr The array to migrate
 * @param propertyName The property name containing the resource type
 * @returns The migrated array
 */
export function migrateArrayResourceTypes<T extends Record<string, unknown>>(
  arr: T[],
  propertyName: string = 'type'
): T[] {
  return arr.map(item => {
    if (
      propertyName in item &&
      typeof item[propertyName] === 'string' &&
      isValidStringType(item[propertyName] as string) // Use imported guard
    ) {
      return {
        ...item,
        [propertyName]: toEnumResourceType(item[propertyName] as string), // Use imported converter
      };
    }
    return item;
  });
}

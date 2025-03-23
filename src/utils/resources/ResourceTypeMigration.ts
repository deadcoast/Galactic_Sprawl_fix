/**
 * Resource Type Migration Utility
 *
 * This utility provides functions to help migrate from string-based resource types
 * to enum-based resource types. It includes functions for converting string literals,
 * object keys, arrays, and more.
 */

import { ResourceType, ResourceTypeString } from './../../types/resources/ResourceTypes';

// Define type aliases for clarity in migration functions
type EnumResourceType = ResourceType;
type StringResourceType = ResourceTypeString;

/**
 * Validate that a value is a valid EnumResourceType
 * Following the type guard pattern from context documentation
 * @param value The value to check
 * @returns True if the value is a valid EnumResourceType
 */
export function validateEnumResourceType(value: unknown): value is EnumResourceType {
  if (typeof value !== 'string') {
    return false;
  }
  
  // Check if the value is in the ResourceType enum - following the pattern in context
  return Object.values(ResourceType).includes(value as ResourceType);
}

/**
 * Generate a mapping of string literals to EnumResourceType
 * Following the resource type conversion pattern from context documentation
 * @returns Record mapping string literals to EnumResourceType values
 */
export function getMigrationMapping(): Record<string, EnumResourceType> {
  const mapping: Record<string, EnumResourceType> = {};
  
  // Map string literals to enum values - consistent with resource system patterns
  Object.values(ResourceType).forEach(resourceType => {
    // Convert to lowercase for case-insensitive matching
    const lowerCaseKey = resourceType.toLowerCase();
    mapping[lowerCaseKey] = resourceType as EnumResourceType;
    
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
export function findEnumResourceType(value: string): EnumResourceType | undefined {
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
  guide += `1. Update imports to use ResourceTypes instead of any other resource type definition\n`;
  guide += `2. Replace string literals with enum values using the mapping table above\n`;
  guide += `3. Update function signatures to use the enum type\n`;
  guide += `4. Use the migration utility functions for complex cases\n`;

  return guide;
}

/**
 * Maps string resource types to enum resource types
 */
const STRING_TO_ENUM_MAP: Record<string, ResourceType> = {
  MINERALS: ResourceType.MINERALS,
  ENERGY: ResourceType.ENERGY,
  POPULATION: ResourceType.POPULATION,
  RESEARCH: ResourceType.RESEARCH,
  PLASMA: ResourceType.PLASMA,
  GAS: ResourceType.GAS,
  EXOTIC: ResourceType.EXOTIC,
  ORGANIC: ResourceType.ORGANIC,
  FOOD: ResourceType.FOOD,
  IRON: ResourceType.IRON,
  COPPER: ResourceType.COPPER,
  TITANIUM: ResourceType.TITANIUM,
  URANIUM: ResourceType.URANIUM,
  WATER: ResourceType.WATER,
  HELIUM: ResourceType.HELIUM,
  DEUTERIUM: ResourceType.DEUTERIUM,
  ANTIMATTER: ResourceType.ANTIMATTER,
  DARK_MATTER: ResourceType.DARK_MATTER,
  EXOTIC_MATTER: ResourceType.EXOTIC_MATTER,
};

/**
 * Maps enum resource types to string resource types
 */
const ENUM_TO_STRING_MAP: Record<ResourceType, string> = {
  [ResourceType.MINERALS]: 'MINERALS',
  [ResourceType.ENERGY]: 'ENERGY',
  [ResourceType.POPULATION]: 'POPULATION',
  [ResourceType.RESEARCH]: 'RESEARCH',
  [ResourceType.PLASMA]: 'PLASMA',
  [ResourceType.GAS]: 'GAS',
  [ResourceType.EXOTIC]: 'EXOTIC',
  [ResourceType.ORGANIC]: 'ORGANIC',
  [ResourceType.FOOD]: 'FOOD',
  [ResourceType.IRON]: 'IRON',
  [ResourceType.COPPER]: 'COPPER',
  [ResourceType.TITANIUM]: 'TITANIUM',
  [ResourceType.URANIUM]: 'URANIUM',
  [ResourceType.WATER]: 'WATER',
  [ResourceType.HELIUM]: 'HELIUM',
  [ResourceType.DEUTERIUM]: 'DEUTERIUM',
  [ResourceType.ANTIMATTER]: 'ANTIMATTER',
  [ResourceType.DARK_MATTER]: 'DARK_MATTER',
  [ResourceType.EXOTIC_MATTER]: 'EXOTIC_MATTER',
};

/**
 * Converts a string resource type to an enum resource type
 * @param resourceType The string resource type
 * @returns The enum ResourceType
 */
export function toEnumResourceType(resourceType: StringResourceType): ResourceType {
  if (!(resourceType in STRING_TO_ENUM_MAP)) {
    console.warn(`Unknown resource type: ${resourceType}, defaulting to MINERALS`);
    return ResourceType.MINERALS;
  }
  return STRING_TO_ENUM_MAP[resourceType];
}

/**
 * Converts an enum resource type to a string resource type
 * @param resourceType The enum resource type
 * @returns The string resource type
 */
export function toStringResourceType(resourceType: ResourceType): StringResourceType | string {
  if (!(resourceType in ENUM_TO_STRING_MAP)) {
    console.warn(`Unknown resource type: ${resourceType}, defaulting to minerals`);
    return ResourceType.MINERALS;
  }
  return ENUM_TO_STRING_MAP[resourceType];
}

/**
 * Checks if a value is a valid string resource type
 * @param value The value to check
 * @returns Whether the value is a valid string resource type
 */
export function isStringResourceType(value: unknown): value is StringResourceType {
  return typeof value === 'string' && value in STRING_TO_ENUM_MAP;
}

/**
 * Checks if a value is a valid enum resource type
 * @param value The value to check
 * @returns Whether the value is a valid enum resource type
 */
export function isEnumResourceType(value: unknown): value is ResourceType {
  return typeof value === 'string' && Object.values(ResourceType).includes(value as ResourceType);
}

/**
 * Ensures a value is an enum resource type
 * @param resourceType Either a string resource type or an enum resource type
 * @returns The enum ResourceType
 */
export function ensureEnumResourceType(
  resourceType: StringResourceType | ResourceType
): ResourceType {
  // If it's already an enum type, return it
  if (Object.values(ResourceType).includes(resourceType as ResourceType)) {
    return resourceType as ResourceType;
  }

  // Otherwise, convert it
  return toEnumResourceType(resourceType as StringResourceType);
}

/**
 * Ensures a value is a string resource type
 * @param value The value to ensure is a string resource type
 * @returns The string resource type
 * @throws Error if the value cannot be converted to a string resource type
 */
export function ensureStringResourceType(value: unknown): StringResourceType | string {
  if (isStringResourceType(value)) {
    return value;
  }

  if (isEnumResourceType(value)) {
    return toStringResourceType(value);
  }

  console.warn(`Unknown resource type: ${value}, defaulting to minerals`);
  return ResourceType.MINERALS;
}

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
  record: Record<StringResourceType, T>
): Record<ResourceType, T> {
  const result: Record<ResourceType, T> = {} as Record<ResourceType, T>;
  for (const [key, value] of Object.entries(record)) {
    if (isStringResourceType(key)) {
      result[toEnumResourceType(key)] = value;
    }
  }
  return result;
}

/**
 * Converts a map with string resource type keys to enum resource type keys
 * @param map The map to convert
 * @returns The converted map
 */
export function convertMapResourceTypes<T>(map: Map<StringResourceType, T>): Map<ResourceType, T> {
  const result = new Map<ResourceType, T>();
  // Use Array.from to avoid iterator issues
  Array.from(map.entries()).forEach(([key, value]) => {
    result?.set(toEnumResourceType(key), value);
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
      /['"]minerals['"]|['"]energy['"]|['"]population['"]|['"]research['"]|['"]plasma['"]|['"]gas['"]|['"]exotic['"]/g
    ) ?? []
  ).length;
  const enumMatches = (
    fileContent.match(
      /ResourceType\.MINERALS|ResourceType\.ENERGY|ResourceType\.POPULATION|ResourceType\.RESEARCH|ResourceType\.PLASMA|ResourceType\.GAS|ResourceType\.EXOTIC/g
    ) ?? []
  ).length;

  return {
    stringResourceTypes: stringMatches,
    enumResourceTypes: enumMatches,
    mixedUsage: stringMatches > 0 && enumMatches > 0,
  };
}

/**
 * Applies migration to a file content
 * @param fileContent The file content to migrate
 * @returns The migrated file content
 */
export function applyMigration(fileContent: string): string {
  let result = fileContent;

  // Replace string literals with enum values
  result = result?.replace(/['"]minerals['"]/g, 'ResourceType.MINERALS');
  result = result?.replace(/['"]energy['"]/g, 'ResourceType.ENERGY');
  result = result?.replace(/['"]population['"]/g, 'ResourceType.POPULATION');
  result = result?.replace(/['"]research['"]/g, 'ResourceType.RESEARCH');
  result = result?.replace(/['"]plasma['"]/g, 'ResourceType.PLASMA');
  result = result?.replace(/['"]gas['"]/g, 'ResourceType.GAS');
  result = result?.replace(/['"]exotic['"]/g, 'ResourceType.EXOTIC');

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
    const newArgs = [...args];
    for (const index of parameterIndices) {
      if (index >= args.length) continue;

      if (convertToEnum) {
        newArgs[index] = ensureEnumResourceType(args[index] as StringResourceType | ResourceType);
      } else {
        newArgs[index] = ensureStringResourceType(args[index]);
      }
    }
    return original(...newArgs);
  }) as T;
}

/**
 * Migrates object keys from string resource types to enum resource types
 * @param obj The object to migrate
 * @returns The migrated object
 */
export function migrateObjectKeys<T>(obj: Record<StringResourceType, T>): Record<ResourceType, T> {
  const result: Partial<Record<ResourceType, T>> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isStringResourceType(key)) {
      result[toEnumResourceType(key as StringResourceType)] = value;
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
      isStringResourceType(item[propertyName] as string)
    ) {
      return {
        ...item,
        [propertyName]: toEnumResourceType(item[propertyName] as StringResourceType),
      };
    }
    return item;
  });
}

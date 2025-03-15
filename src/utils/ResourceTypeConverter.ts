/**
 * ResourceTypeConverter.ts
 *
 * Utility for converting between string-based and enum-based resource types.
 * This helps with the transition from the legacy string-based system to the new enum-based system.
 */

import { ResourceType } from '../types/resources/ResourceTypes';

/**
 * Convert a string resource type to an enum resource type
 * @param stringType The string resource type
 * @returns The enum resource type or MINERALS if not found
 */
export function stringToResourceType(stringType: string): ResourceType {
  return ResourceTypeConverter.ensureEnumResourceType(stringType);
}

/**
 * Convert an enum resource type to a string resource type
 * @param resourceType The enum resource type
 * @returns The string resource type or the enum value as string if not found
 */
export function resourceTypeToString(resourceType: ResourceType | string): string {
  if (typeof resourceType === 'string') {
    // If it's already a string, ensure it's a valid resource type string
    if (Object.values(ResourceType).includes(resourceType as ResourceType)) {
      // It's an enum value as string
      return resourceType;
    }
    // It's a string that might be a valid resource type
    return resourceType;
  }

  // It's an enum, convert to string
  const stringType = ResourceTypeConverter.enumToString(resourceType);
  return stringType !== undefined ? stringType : String(resourceType);
}

/**
 * ResourceTypeConverter class
 *
 * Provides static methods for converting between string-based and enum-based resource types.
 */
export class ResourceTypeConverter {
  // Mapping from string resource types to enum resource types
  private static stringToEnumMap: Record<string, ResourceType> = {
    MINERALS: ResourceType.MINERALS,
    ENERGY: ResourceType.ENERGY,
    POPULATION: ResourceType.POPULATION,
    RESEARCH: ResourceType.RESEARCH,
    PLASMA: ResourceType.PLASMA,
    GAS: ResourceType.GAS,
    EXOTIC: ResourceType.EXOTIC,
    // Legacy lowercase mappings for backward compatibility
    minerals: ResourceType.MINERALS,
    energy: ResourceType.ENERGY,
    population: ResourceType.POPULATION,
    research: ResourceType.RESEARCH,
    plasma: ResourceType.PLASMA,
    gas: ResourceType.GAS,
    exotic: ResourceType.EXOTIC,
  };

  // Mapping from enum resource types to string resource types
  private static enumToStringMap: Record<ResourceType, string> = {
    [ResourceType.MINERALS]: 'MINERALS',
    [ResourceType.ENERGY]: 'ENERGY',
    [ResourceType.POPULATION]: 'POPULATION',
    [ResourceType.RESEARCH]: 'RESEARCH',
    [ResourceType.PLASMA]: 'PLASMA',
    [ResourceType.GAS]: 'GAS',
    [ResourceType.EXOTIC]: 'EXOTIC',
    // Map the specialized resources to their general categories
    [ResourceType.IRON]: 'MINERALS',
    [ResourceType.COPPER]: 'MINERALS',
    [ResourceType.TITANIUM]: 'MINERALS',
    [ResourceType.URANIUM]: 'MINERALS',
    [ResourceType.WATER]: 'MINERALS',
    [ResourceType.HELIUM]: 'GAS',
    [ResourceType.DEUTERIUM]: 'GAS',
    [ResourceType.ANTIMATTER]: 'EXOTIC',
    [ResourceType.DARK_MATTER]: 'EXOTIC',
    [ResourceType.EXOTIC_MATTER]: 'EXOTIC',
  };

  /**
   * Convert a string resource type to an enum resource type
   *
   * @param stringType The string resource type
   * @returns The enum resource type or undefined if not found
   */
  public static stringToEnum(stringType: string): ResourceType | undefined {
    return this.stringToEnumMap[stringType];
  }

  /**
   * Convert an enum resource type to a string resource type
   *
   * @param enumType The enum resource type
   * @returns The string resource type or undefined if not found
   */
  public static enumToString(enumType: ResourceType): string | undefined {
    return this.enumToStringMap[enumType];
  }

  /**
   * Check if a string resource type is valid
   *
   * @param stringType The string resource type
   * @returns True if the string resource type is valid, false otherwise
   */
  public static isValidStringType(stringType: string): boolean {
    return stringType in this.stringToEnumMap;
  }

  /**
   * Check if an enum resource type is valid
   *
   * @param enumType The enum resource type
   * @returns True if the enum resource type is valid, false otherwise
   */
  public static isValidEnumType(enumType: ResourceType): boolean {
    return enumType in this.enumToStringMap;
  }

  /**
   * Get all valid string resource types
   *
   * @returns Array of all valid string resource types
   */
  public static getAllStringTypes(): string[] {
    return Object.keys(this.stringToEnumMap);
  }

  /**
   * Get all valid enum resource types
   *
   * @returns Array of all valid enum resource types
   */
  public static getAllEnumTypes(): ResourceType[] {
    return Object.values(this.stringToEnumMap);
  }

  /**
   * Convert a record with string keys to a record with enum keys
   *
   * @param record The record with string keys
   * @returns The record with enum keys
   */
  public static convertRecordKeysToEnum<T>(
    record: Record<string, T>
  ): Partial<Record<ResourceType, T>> {
    const result: Partial<Record<ResourceType, T>> = {};

    Object.entries(record).forEach(([key, value]) => {
      const enumKey = this.stringToEnum(key);
      if (enumKey !== undefined) {
        result[enumKey] = value;
      }
    });

    return result;
  }

  /**
   * Convert a record with enum keys to a record with string keys
   *
   * @param record The record with enum keys
   * @returns The record with string keys
   */
  public static convertRecordKeysToString<T>(
    record: Partial<Record<ResourceType, T>>
  ): Partial<Record<string, T>> {
    const result: Partial<Record<string, T>> = {};

    Object.entries(record).forEach(([key, value]) => {
      // Safe conversion from string key to enum
      const enumKey = key as unknown as ResourceType;
      const stringKey = this.enumToString(enumKey);
      if (stringKey !== undefined) {
        result[stringKey] = value;
      }
    });

    return result;
  }

  /**
   * Convert a map with string keys to a map with enum keys
   *
   * @param map The map with string keys
   * @returns The map with enum keys
   */
  public static convertMapKeysToEnum<T>(map: Map<string, T>): Map<ResourceType, T> {
    const result = new Map<ResourceType, T>();

    map.forEach((value, key) => {
      const enumKey = this.stringToEnum(key);
      if (enumKey !== undefined) {
        result.set(enumKey, value);
      }
    });

    return result;
  }

  /**
   * Convert a map with enum keys to a map with string keys
   *
   * @param map The map with enum keys
   * @returns The map with string keys
   */
  public static convertMapKeysToString<T>(map: Map<ResourceType, T>): Map<string, T> {
    const result = new Map<string, T>();

    map.forEach((value, key) => {
      const stringKey = this.enumToString(key);
      if (stringKey !== undefined) {
        result.set(stringKey, value);
      }
    });

    return result;
  }

  /**
   * Ensures that a resource type is in enum format
   * @param resourceType Either a string resource type or an enum resource type
   * @returns The enum ResourceType
   */
  public static ensureEnumResourceType(resourceType: ResourceType | string): ResourceType {
    // If it's already an enum type, return it
    if (Object.values(ResourceType).includes(resourceType as ResourceType)) {
      return resourceType as ResourceType;
    }

    // Otherwise, convert it
    const enumType = this.stringToEnum(resourceType as string);
    if (enumType !== undefined) {
      return enumType;
    }

    console.warn(`Unknown resource type: ${resourceType}, defaulting to MINERALS`);
    return ResourceType.MINERALS;
  }

  /**
   * Ensures a value is a string resource type
   * @param value The value to ensure is a string resource type
   * @returns The string resource type
   */
  public static ensureStringResourceType(value: unknown): string {
    if (typeof value === 'string' && this.isValidStringType(value)) {
      return value;
    }

    if (typeof value === 'string' && this.isValidEnumType(value as ResourceType)) {
      return this.enumToString(value as ResourceType) || ResourceType.MINERALS;
    }

    // Handle numeric enum values by first converting to ResourceType
    if (typeof value === 'number') {
      const enumValue = Object.values(ResourceType).find(rt => String(rt) === String(value));
      if (enumValue) {
        return this.enumToString(enumValue) || ResourceType.MINERALS;
      }
    }

    if (value && typeof value === 'object' && 'valueOf' in value) {
      const stringValue = String(value);
      if (this.isValidStringType(stringValue)) {
        return stringValue;
      }
    }

    console.warn(`Unknown resource type: ${String(value)}, defaulting to ${ResourceType.MINERALS}`);
    return ResourceType.MINERALS;
  }

  /**
   * Migrates an array of objects with a resource type property from string to enum
   * @param arr The array of objects to migrate
   * @param propertyName The name of the property that contains the resource type
   * @returns The migrated array
   */
  public static migrateArrayResourceTypes<T extends Record<string, unknown>>(
    arr: T[],
    propertyName: string = 'type'
  ): T[] {
    return arr.map(item => {
      const result = { ...item };
      const resourceType = item[propertyName];

      if (typeof resourceType === 'string') {
        const enumType = this.stringToEnum(resourceType);
        if (enumType !== undefined) {
          result[propertyName as keyof T] = enumType as unknown as T[keyof T];
        }
      }

      return result;
    });
  }
}

// Export convenience functions for easier usage
export const toEnumResourceType =
  ResourceTypeConverter.ensureEnumResourceType.bind(ResourceTypeConverter);
export const toStringResourceType =
  ResourceTypeConverter.ensureStringResourceType.bind(ResourceTypeConverter);
export const ensureEnumResourceType =
  ResourceTypeConverter.ensureEnumResourceType.bind(ResourceTypeConverter);
export const ensureStringResourceType =
  ResourceTypeConverter.ensureStringResourceType.bind(ResourceTypeConverter);
export const migrateObjectKeys =
  ResourceTypeConverter.convertRecordKeysToEnum.bind(ResourceTypeConverter);
export const migrateArrayResourceTypes =
  ResourceTypeConverter.migrateArrayResourceTypes.bind(ResourceTypeConverter);
export const convertRecordResourceTypes =
  ResourceTypeConverter.convertRecordKeysToEnum.bind(ResourceTypeConverter);
export const convertMapResourceTypes =
  ResourceTypeConverter.convertMapKeysToEnum.bind(ResourceTypeConverter);

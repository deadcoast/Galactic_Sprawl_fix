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
export function resourceTypeToString(resourceType: ResourceType | string): ResourceType {
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
    // Always use uppercase for consistency
    MINERALS: ResourceType.MINERALS,
    ENERGY: ResourceType.ENERGY,
    POPULATION: ResourceType.POPULATION,
    RESEARCH: ResourceType.RESEARCH,
    PLASMA: ResourceType.PLASMA,
    GAS: ResourceType.GAS,
    EXOTIC: ResourceType.EXOTIC,
    ORGANIC: ResourceType.ORGANIC,
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

  // Mapping from enum resource types to string resource types
  private static enumToStringMap: Record<ResourceType, string> = {
    [ResourceType.MINERALS]: 'MINERALS',
    [ResourceType.ENERGY]: 'ENERGY',
    [ResourceType.POPULATION]: 'POPULATION',
    [ResourceType.RESEARCH]: 'RESEARCH',
    [ResourceType.PLASMA]: 'PLASMA',
    [ResourceType.GAS]: 'GAS',
    [ResourceType.EXOTIC]: 'EXOTIC',
    [ResourceType.ORGANIC]: 'ORGANIC',
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
   * Convert a string resource type to an enum resource type
   *
   * @param stringType The string resource type
   * @returns The enum resource type or undefined if not found
   */
  public static stringToEnum(stringType: string): ResourceType | undefined {
    // Try uppercase first
    const upperType = stringType.toUpperCase();
    if (this.stringToEnumMap[upperType]) {
      return this.stringToEnumMap[upperType];
    }
    // Try as-is
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
        result?.set(enumKey, value);
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
        result?.set(stringKey, value);
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
    if (
      typeof resourceType === 'number' ||
      Object.values(ResourceType).includes(resourceType as ResourceType)
    ) {
      return resourceType as ResourceType;
    }

    // Try to convert string to enum
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
  public static ensureStringResourceType(value: unknown): ResourceType {
    // If it's already a ResourceType enum
    if (typeof value === 'number' || Object.values(ResourceType).includes(value as ResourceType)) {
      const stringValue = this.enumToString(value as ResourceType);
      if (stringValue) {
        return stringValue;
      }
    }

    // If it's a string, try to validate it
    if (typeof value === 'string') {
      const upperValue = value.toUpperCase();
      // Check if it's a valid string type
      if (this.isValidStringType(upperValue)) {
        return upperValue;
      }
      // Check if it's a valid enum value as string
      if (this.isValidEnumType(value as ResourceType)) {
        const stringValue = this.enumToString(value as ResourceType);
        if (stringValue) {
          return stringValue;
        }
      }
    }

    console.warn(`Unknown resource type: ${String(value)}, defaulting to MINERALS`);
    return 'MINERALS';
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

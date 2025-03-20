/**
 * ResourceTypeConverter.ts
 *
 * Utility for converting between different resource type representations.
 */

import { ResourceType, ResourceTypeString } from '../../types/resources/ResourceTypes';

/**
 * Convert a string resource type to enum ResourceType
 */
export function stringToEnumResourceType(type: ResourceTypeString): ResourceType {
  return ResourceType[type as keyof typeof ResourceType];
}

/**
 * Convert enum ResourceType to string resource type
 */
export function enumToStringResourceType(type: ResourceType): ResourceTypeString {
  return ResourceType[type] as ResourceTypeString;
}

/**
 * Alias for stringToEnumResourceType with correct parameter type
 */
export const toEnumResourceType = (type: ResourceTypeString): ResourceType => {
  return stringToEnumResourceType(type);
};

/**
 * Alias for enumToStringResourceType
 */
export const toStringResourceType = enumToStringResourceType;

/**
 * Ensure a resource type is represented as a string
 */
export function ensureStringResourceType(
  type: ResourceType | ResourceTypeString
): ResourceTypeString {
  if (typeof type === 'string') {
    return type as ResourceTypeString;
  }
  return enumToStringResourceType(type);
}

/**
 * Check if a value is a string resource type
 */
export function isStringResourceType(value: unknown): value is ResourceTypeString {
  if (typeof value !== 'string') {
    return false;
  }

  // Get all string values from the ResourceType enum
  const resourceTypeValues = Object.keys(ResourceType)
    .filter(key => isNaN(Number(key))) // Filter out numeric keys
    .map(key => key as ResourceTypeString);

  // Check if the string value is in the valid resource type strings
  return resourceTypeValues.includes(value as ResourceTypeString);
}

/**
 * Ensure a resource type is represented as an enum
 */
export function ensureEnumResourceType(type: ResourceType | ResourceTypeString): ResourceType {
  if (typeof type !== 'string') {
    return type as ResourceType;
  }
  return toEnumResourceType(type as ResourceTypeString);
}

/**
 * Default converter functions
 */
export default {
  stringToEnum: stringToEnumResourceType,
  enumToString: enumToStringResourceType,
  ensureString: ensureStringResourceType,
  toEnum: toEnumResourceType,
  toString: toStringResourceType,
};

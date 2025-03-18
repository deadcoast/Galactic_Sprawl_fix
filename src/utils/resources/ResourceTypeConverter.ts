/**
 * ResourceTypeConverter.ts
 *
 * Utility for converting between different resource type representations.
 */

import { ResourceType, ResourceTypeString } from '../../types/resources/ResourceTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';

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
 * Default converter functions
 */
export default {
  stringToEnum: stringToEnumResourceType,
  enumToString: enumToStringResourceType,
  ensureString: ensureStringResourceType,
  toEnum: toEnumResourceType,
  toString: toStringResourceType,
};

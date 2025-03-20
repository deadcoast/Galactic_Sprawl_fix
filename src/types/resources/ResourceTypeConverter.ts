import { ResourceType } from './ResourceTypes';

/**
 * Check if a value is a string resource type
 */
export function isStringResourceType(value: unknown): value is ResourceType {
  if (typeof value !== 'string') {
    return false;
  }

  // Check if the string is a key in the ResourceType enum
  return Object.keys(ResourceType).includes(value);
}

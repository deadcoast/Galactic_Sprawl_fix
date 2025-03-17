import { ResourceType } from '../../types/resources/ResourceTypes';

/**
 * Get a human-readable display name for a resource type
 * @param resourceType The resource type to get a display name for
 * @returns A formatted display name
 */
export function getResourceDisplayName(resourceType: ResourceType): string {
  return resourceType
    .toString()
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

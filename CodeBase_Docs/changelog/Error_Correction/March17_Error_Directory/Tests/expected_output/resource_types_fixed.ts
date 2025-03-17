/**
 * Test file for ResourceType errors
 * This file contains common patterns of ResourceType errors
 * that should be detected and fixed by the fix_resource_types.sh script
 */

// Import added by the fix script
import { ResourceType } from '../../../types/resources/ResourceTypes';

// String literals used instead of ResourceType enum
function processResourceString(resourceType: ResourceType): ResourceType {
  if (resourceType === ResourceType.MINERALS) {
    return ResourceType.MINERALS;
  } else if (resourceType === ResourceType.GAS) {
    return ResourceType.GAS;
  } else if (resourceType === ResourceType.ENERGY) {
    return ResourceType.ENERGY;
  } else {
    return 'unknown' as unknown as ResourceType; // This might not be fixed properly
  }
}

// String arrays used instead of ResourceType arrays
function getSupportedResources(): ResourceType[] {
  return [
    ResourceType.MINERALS,
    ResourceType.GAS,
    ResourceType.ENERGY,
    ResourceType.FOOD,
    ResourceType.WATER,
  ];
}

// Variable declarations with string literals
const defaultResource: ResourceType = ResourceType.MINERALS;
const secondaryResource: ResourceType = ResourceType.GAS;

// Class with resource string properties
class ResourceProcessor {
  private resourceType: ResourceType = ResourceType.MINERALS;

  constructor(resourceType: ResourceType) {
    this.resourceType = resourceType;
  }

  processResource(): void {
    console.log(`Processing resource: ${this.resourceType}`);
  }

  isGasResource(): boolean {
    return this.resourceType === ResourceType.GAS;
  }

  // Method with string parameter that should be ResourceType
  static convertResource(
    type: ResourceType,
    amount: number
  ): { type: ResourceType; processed: number } {
    return {
      type: type,
      processed: amount * 0.8,
    };
  }
}

// Function that returns different strings based on resource
function getResourceIcon(resource: ResourceType): string {
  switch (resource) {
    case ResourceType.MINERALS:
      return '🪨';
    case ResourceType.GAS:
      return '💨';
    case ResourceType.ENERGY:
      return '⚡';
    case ResourceType.FOOD:
      return '🍎';
    case ResourceType.WATER:
      return '💧';
    default:
      return '❓';
  }
}

// Object with string keys that should be ResourceType
// Note: This might not be fixed automatically as it's a complex case
const resourceValues = {
  [ResourceType.MINERALS]: 100,
  [ResourceType.GAS]: 150,
  [ResourceType.ENERGY]: 200,
  [ResourceType.FOOD]: 50,
  [ResourceType.WATER]: 30,
};

export {
  defaultResource,
  getResourceIcon,
  getSupportedResources,
  processResourceString,
  ResourceProcessor,
  resourceValues,
};

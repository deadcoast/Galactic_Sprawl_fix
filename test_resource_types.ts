/**
 * Test file for ResourceType errors
 * This file contains common patterns of ResourceType errors
 * that should be detected and fixed by the fix_resource_types.sh script
 */

// Missing import
// import { ResourceType } from '../../types/resources/ResourceTypes';

// String literals used instead of ResourceType enum
function processResourceString(resourceType: string): string {
  if (resourceType === ResourceType.MINERALS) {
    return ResourceType.MINERALS;
  } else if (resourceType === ResourceType.GAS) {
    return ResourceType.GAS;
  } else if (resourceType === ResourceType.ENERGY) {
    return ResourceType.ENERGY;
  } else {
    return 'unknown';
  }
}

// String arrays used instead of ResourceType arrays
function getSupportedResources(): string[] {
  return [ResourceType.MINERALS, ResourceType.GAS, ResourceType.ENERGY, 'food', 'water'];
}

// Variable declarations with string literals
const defaultResource: string = ResourceType.MINERALS;
const secondaryResource: string = ResourceType.GAS;

// Class with resource string properties
class ResourceProcessor {
  private resourceType: string = ResourceType.MINERALS;

  constructor(resourceType: string) {
    this.resourceType = resourceType;
  }

  processResource(): void {
    console.log(`Processing resource: ${this.resourceType}`);
  }

  isGasResource(): boolean {
    return this.resourceType === ResourceType.GAS;
  }

  // Method with string parameter that should be ResourceType
  static convertResource(type: string, amount: number): { type: string; processed: number } {
    return {
      type: type,
      processed: amount * 0.8,
    };
  }
}

// Function that returns different strings based on resource
function getResourceIcon(resource: string): string {
  switch (resource) {
    case ResourceType.MINERALS:
      return '🪨';
    case ResourceType.GAS:
      return '💨';
    case ResourceType.ENERGY:
      return '⚡';
    case 'food':
      return '🍎';
    case 'water':
      return '💧';
    default:
      return '❓';
  }
}

// Object with string keys that should be ResourceType
const resourceValues = {
  minerals: 100,
  gas: 150,
  energy: 200,
  food: 50,
  water: 30,
};

export {
  ResourceProcessor,
  defaultResource,
  getResourceIcon,
  getSupportedResources,
  processResourceString,
  resourceValues,
};

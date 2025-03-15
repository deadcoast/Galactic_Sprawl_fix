/**
 * ResourceTypeExample.test.ts
 *
 * This file demonstrates how to use standardized resource types in tests.
 * It serves as an example for updating existing tests to use the enum-based ResourceType.
 */

import { ResourceManager } from '../../managers/game/ResourceManager';
import { ResourceType } from "./../../types/resources/ResourceTypes";
import {
  ensureEnumResourceType,
  ensureStringResourceType,
  toEnumResourceType,
  toStringResourceType,
} from '../../utils/resources/ResourceTypeConverter';

describe('ResourceType Examples', () => {
  // Example 1: Basic usage of enum resource types
  test('should use enum resource types directly', () => {
    // Use enum values directly
    const mineralType = ResourceType.MINERALS;
    const energyType = ResourceType.ENERGY;

    // Compare enum values
    expect(mineralType).toBe(ResourceType.MINERALS);
    expect(mineralType).not.toBe(energyType);

    // Use in switch statements
    const getResourcePriority = (type: ResourceType): number => {
      switch (type) {
        case ResourceType.ENERGY:
          return 100;
        case ResourceType.MINERALS:
          return 80;
        default:
          return 50;
      }
    };

    expect(getResourcePriority(ResourceType.ENERGY)).toBe(100);
    expect(getResourcePriority(ResourceType.MINERALS)).toBe(80);
    expect(getResourcePriority(ResourceType.GAS)).toBe(50);
  });

  // Example 2: Using resource type metadata
  test('should access resource type metadata', () => {
    // Access metadata for a resource type
    const mineralInfo = ResourceTypeInfo[ResourceType.MINERALS];

    expect(mineralInfo.displayName).toBe('Minerals');
    expect(mineralInfo.category).toBeDefined();
    expect(mineralInfo.defaultMax).toBeGreaterThan(0);

    // Use metadata in functions
    const getResourceDisplayName = (type: ResourceType): string => {
      return ResourceTypeInfo[type].displayName;
    };

    expect(getResourceDisplayName(ResourceType.ENERGY)).toBe('Energy');
    expect(getResourceDisplayName(ResourceType.EXOTIC)).toBe('Exotic Materials');
  });

  // Example 3: Testing with ResourceManager
  test('should work with ResourceManager', () => {
    const resourceManager = new ResourceManager();

    // Add resources using enum types
    resourceManager.addResource(ResourceType.MINERALS, 100);
    resourceManager.addResource(ResourceType.ENERGY, 50);

    // Check resource amounts
    expect(resourceManager.getResourceAmount(ResourceType.MINERALS)).toBe(100);
    expect(resourceManager.getResourceAmount(ResourceType.ENERGY)).toBe(50);

    // Transfer resources
    resourceManager.transferResources(ResourceType.MINERALS, 30, 'source', 'target');
    expect(resourceManager.getResourceAmount(ResourceType.MINERALS)).toBe(70);
  });

  // Example 4: Using resource type conversion utilities
  test('should convert between string and enum resource types', () => {
    // Convert string to enum
    expect(toEnumResourceType(ResourceType.MINERALS)).toBe(ResourceType.MINERALS);
    expect(toEnumResourceType(ResourceType.ENERGY)).toBe(ResourceType.ENERGY);

    // Convert enum to string
    expect(toStringResourceType(ResourceType.MINERALS)).toBe(ResourceType.MINERALS);
    expect(toStringResourceType(ResourceType.ENERGY)).toBe(ResourceType.ENERGY);

    // Ensure type conversion (handles both formats)
    expect(ensureEnumResourceType(ResourceType.MINERALS)).toBe(ResourceType.MINERALS);
    expect(ensureEnumResourceType(ResourceType.MINERALS)).toBe(ResourceType.MINERALS);

    expect(ensureStringResourceType(ResourceType.MINERALS)).toBe(ResourceType.MINERALS);
    expect(ensureStringResourceType(ResourceType.MINERALS)).toBe(ResourceType.MINERALS);
  });

  // Example 5: Testing with record types
  test('should work with record types', () => {
    // Create a record with enum keys
    const resourceAmounts: Record<ResourceType, number> = {
      [ResourceType.MINERALS]: 100,
      [ResourceType.ENERGY]: 50,
      [ResourceType.POPULATION]: 25,
      [ResourceType.RESEARCH]: 75,
      [ResourceType.PLASMA]: 30,
      [ResourceType.GAS]: 60,
      [ResourceType.EXOTIC]: 10,
      [ResourceType.IRON]: 80,
      [ResourceType.COPPER]: 70,
      [ResourceType.TITANIUM]: 40,
      [ResourceType.URANIUM]: 20,
      [ResourceType.WATER]: 90,
      [ResourceType.HELIUM]: 15,
      [ResourceType.DEUTERIUM]: 5,
      [ResourceType.ANTIMATTER]: 2,
      [ResourceType.DARK_MATTER]: 1,
      [ResourceType.EXOTIC_MATTER]: 3,
    };

    // Access values using enum keys
    expect(resourceAmounts[ResourceType.MINERALS]).toBe(100);
    expect(resourceAmounts[ResourceType.ENERGY]).toBe(50);

    // Update values
    resourceAmounts[ResourceType.MINERALS] = 200;
    expect(resourceAmounts[ResourceType.MINERALS]).toBe(200);
  });

  // Example 6: Testing with arrays of resource types
  test('should work with arrays of resource types', () => {
    // Create an array of resource types
    const resourceTypes: ResourceType[] = [
      ResourceType.MINERALS,
      ResourceType.ENERGY,
      ResourceType.GAS,
    ];

    // Check array contents
    expect(resourceTypes).toContain(ResourceType.MINERALS);
    expect(resourceTypes).toContain(ResourceType.ENERGY);
    expect(resourceTypes).not.toContain(ResourceType.EXOTIC);

    // Filter array
    const filteredTypes = resourceTypes.filter(type => type !== ResourceType.GAS);
    expect(filteredTypes).toHaveLength(2);
    expect(filteredTypes).not.toContain(ResourceType.GAS);
  });
});

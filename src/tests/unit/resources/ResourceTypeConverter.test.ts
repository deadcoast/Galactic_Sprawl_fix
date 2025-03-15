/**
 * ResourceTypeConverter.test.ts
 *
 * Unit tests for the ResourceTypeConverter utility
 */

import { ResourceType } from "./../../../types/resources/ResourceTypes";
import { ResourceType } from "./../../../types/resources/ResourceTypes";
import {
  clearConversionCache,
  convertObjectResourceTypes,
  ensureEnumResourceType,
  ensureStringResourceType,
  getConversionCacheSize,
  isEnumResourceType,
  isStringResourceType,
  toEnumResourceMap,
  toEnumResourceRecord,
  toEnumResourceType,
  toStringResourceMap,
  toStringResourceRecord,
  toStringResourceType,
} from '../../../utils/resources/ResourceTypeConverter';

describe('ResourceTypeConverter', () => {
  beforeEach(() => {
    // Clear the cache before each test to ensure consistent results
    clearConversionCache();
  });

  describe('Type Guards', () => {
    test('isStringResourceType should correctly identify string resource types', () => {
      expect(isStringResourceType(ResourceType.MINERALS)).toBe(true);
      expect(isStringResourceType(ResourceType.ENERGY)).toBe(true);
      expect(isStringResourceType(ResourceType.POPULATION)).toBe(true);
      expect(isStringResourceType('invalid')).toBe(false);
      expect(isStringResourceType(123)).toBe(false);
      expect(isStringResourceType(null)).toBe(false);
      expect(isStringResourceType(undefined)).toBe(false);
      expect(isStringResourceType({})).toBe(false);
    });

    test('isEnumResourceType should correctly identify enum resource types', () => {
      expect(isEnumResourceType(ResourceType.MINERALS)).toBe(true);
      expect(isEnumResourceType(ResourceType.ENERGY)).toBe(true);
      expect(isEnumResourceType(ResourceType.POPULATION)).toBe(true);
      expect(isEnumResourceType('MINERALS')).toBe(false);
      expect(isEnumResourceType('invalid')).toBe(false);
      expect(isEnumResourceType(123)).toBe(false);
      expect(isEnumResourceType(null)).toBe(false);
      expect(isEnumResourceType(undefined)).toBe(false);
      expect(isEnumResourceType({})).toBe(false);
    });
  });

  describe('Conversion Functions', () => {
    test('toEnumResourceType should convert string types to enum types', () => {
      expect(toEnumResourceType(ResourceType.MINERALS)).toBe(ResourceType.MINERALS);
      expect(toEnumResourceType(ResourceType.ENERGY)).toBe(ResourceType.ENERGY);
      expect(toEnumResourceType(ResourceType.POPULATION)).toBe(ResourceType.POPULATION);
      expect(() => toEnumResourceType('invalid' as StringResourceType)).toThrow();
    });

    test('toStringResourceType should convert enum types to string types', () => {
      expect(toStringResourceType(ResourceType.MINERALS)).toBe(ResourceType.MINERALS);
      expect(toStringResourceType(ResourceType.ENERGY)).toBe(ResourceType.ENERGY);
      expect(toStringResourceType(ResourceType.POPULATION)).toBe(ResourceType.POPULATION);
      expect(() => toStringResourceType('MINERALS' as ResourceType)).toThrow();
    });

    test('ensureEnumResourceType should handle both string and enum types', () => {
      expect(ensureEnumResourceType(ResourceType.MINERALS)).toBe(ResourceType.MINERALS);
      expect(ensureEnumResourceType(ResourceType.MINERALS)).toBe(ResourceType.MINERALS);
      expect(() => ensureEnumResourceType('invalid' as StringResourceType)).toThrow();
    });

    test('ensureStringResourceType should handle both string and enum types', () => {
      expect(ensureStringResourceType(ResourceType.MINERALS)).toBe(ResourceType.MINERALS);
      expect(ensureStringResourceType(ResourceType.MINERALS)).toBe(ResourceType.MINERALS);
      expect(() => ensureStringResourceType('MINERALS' as ResourceType)).toThrow();
    });
  });

  describe('Collection Conversion', () => {
    test('Array conversion with map functions', () => {
      const stringArray: StringResourceType[] = [ResourceType.MINERALS, ResourceType.ENERGY, ResourceType.POPULATION];
      const enumArray = stringArray.map(toEnumResourceType);
      const backToString = enumArray.map(toStringResourceType);

      expect(enumArray).toEqual([
        ResourceType.MINERALS,
        ResourceType.ENERGY,
        ResourceType.POPULATION,
      ]);
      expect(backToString).toEqual(stringArray);
    });

    test('toEnumResourceRecord should convert records with resource type keys', () => {
      const stringRecord: Partial<Record<StringResourceType, number>> = {
        minerals: 100,
        energy: 200,
        population: 300,
      };

      const enumRecord = toEnumResourceRecord(stringRecord);

      expect(enumRecord[ResourceType.MINERALS]).toBe(100);
      expect(enumRecord[ResourceType.ENERGY]).toBe(200);
      expect(enumRecord[ResourceType.POPULATION]).toBe(300);

      const backToString = toStringResourceRecord(enumRecord);
      expect(backToString).toEqual(stringRecord);
    });

    test('toEnumResourceMap should convert maps with resource type keys', () => {
      const stringMap = new Map<StringResourceType, number>([
        [ResourceType.MINERALS, 100],
        [ResourceType.ENERGY, 200],
        [ResourceType.POPULATION, 300],
      ]);

      const enumMap = toEnumResourceMap(stringMap);

      expect(enumMap.get(ResourceType.MINERALS)).toBe(100);
      expect(enumMap.get(ResourceType.ENERGY)).toBe(200);
      expect(enumMap.get(ResourceType.POPULATION)).toBe(300);

      const backToString = toStringResourceMap(enumMap);
      expect([...backToString.entries()]).toEqual([...stringMap.entries()]);
    });

    test('convertObjectResourceTypes should convert resource type properties in objects', () => {
      const obj = {
        primaryResource: ResourceType.MINERALS as StringResourceType,
        secondaryResource: ResourceType.ENERGY as StringResourceType,
        amount: 100,
      };

      const expected = {
        primaryResource: ResourceType.MINERALS,
        secondaryResource: ResourceType.ENERGY,
        amount: 100,
      };

      expect(
        convertObjectResourceTypes(obj, ['primaryResource', 'secondaryResource'], true)
      ).toEqual(expected);
    });
  });

  describe('Cache Management', () => {
    test('Conversion functions should use cache for performance', () => {
      // First call should add to cache
      toEnumResourceType(ResourceType.MINERALS);
      expect(getConversionCacheSize().stringToEnum).toBe(1);

      // Second call should use cache
      toEnumResourceType(ResourceType.MINERALS);
      expect(getConversionCacheSize().stringToEnum).toBe(1);

      // Different value should add to cache
      toEnumResourceType(ResourceType.ENERGY);
      expect(getConversionCacheSize().stringToEnum).toBe(2);

      // Clear cache should reset
      clearConversionCache();
      expect(getConversionCacheSize().stringToEnum).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('Conversion functions should throw for invalid inputs', () => {
      expect(() => toEnumResourceType('invalid' as StringResourceType)).toThrow();
      expect(() => toStringResourceType('INVALID' as ResourceType)).toThrow();
    });
  });
});

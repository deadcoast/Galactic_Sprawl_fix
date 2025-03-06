import { beforeEach, describe, expect, it } from 'vitest';
import { BuildingType, ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { createTestModuleManager, TestModuleManager } from './createTestModuleManager';

describe('createTestModuleManager', () => {
  let testModuleManager: TestModuleManager;

  beforeEach(() => {
    testModuleManager = createTestModuleManager();
    // Reset before each test to ensure a clean state
    testModuleManager.reset();
  });

  describe('module configuration', () => {
    it('should register module configs', () => {
      // Arrange
      const config = {
        type: 'hangar' as ModuleType,
        name: 'Hangar Bay',
        description: 'Houses ships',
        requirements: {
          minLevel: 1,
          buildingType: ['mothership'] as BuildingType[],
          resourceCosts: [
            { type: 'minerals', amount: 200 },
            { type: 'energy', amount: 100 },
          ],
        },
        baseStats: {
          power: 10,
          crew: 5,
          upkeep: 2,
        },
      };

      // Act
      testModuleManager.registerModuleConfig(config);

      // Assert
      const configs = testModuleManager.getModuleConfigs();
      expect(configs.has('hangar')).toBe(true);
      expect(configs.get('hangar')).toEqual(config);
    });
  });

  describe('module lifecycle', () => {
    it('should create a module', () => {
      // Arrange
      const position: Position = { x: 10, y: 20 };

      // Act
      const module = testModuleManager.createModule('radar' as ModuleType, position);

      // Assert
      expect(module).toBeDefined();
      expect(module.type).toBe('radar');
      expect(module.position).toEqual(position);
      expect(module.isActive).toBe(false);
      expect(module.level).toBe(1);
      expect(module.status).toBe('constructing');
    });

    it('should activate a module', () => {
      // Arrange - Create a module with a specific ID
      const module = testModuleManager.createTestModule(
        'radar' as ModuleType,
        { x: 10, y: 20 },
        { id: 'radar-activate-test' }
      );

      // Act - Activate the module
      const result = testModuleManager.setModuleActive(module.id, true);

      // Assert - Check that activation was successful
      expect(result).toBe(true);

      // Get the updated module and check its active status
      const updatedModule = testModuleManager.getModule(module.id);
      expect(updatedModule?.isActive).toBe(true);
    });

    it('should create a test module with overrides', () => {
      // Arrange
      const position: Position = { x: 30, y: 40 };
      const overrides = {
        name: 'Custom Radar',
        isActive: true,
        level: 3,
        status: 'active' as const,
      };

      // Act
      const module = testModuleManager.createTestModule('radar' as ModuleType, position, overrides);

      // Assert
      expect(module).toBeDefined();
      expect(module.type).toBe('radar');
      expect(module.position).toEqual(position);
      expect(module.name).toBe('Custom Radar');
      expect(module.isActive).toBe(true);
      expect(module.level).toBe(3);
      expect(module.status).toBe('active');
    });
  });

  describe('building management', () => {
    it('should create a test building', () => {
      // Act
      const building = testModuleManager.createTestBuilding('colony');

      // Assert
      expect(building).toBeDefined();
      expect(building.type).toBe('colony');
      expect(building.level).toBe(1);
      expect(building.status).toBe('active');
      expect(building.modules).toEqual([]);
      expect(building.attachmentPoints).toEqual([]);
    });

    it('should create a test building with overrides', () => {
      // Arrange
      const overrides = {
        level: 3,
        status: 'constructing' as const,
      };

      // Act
      const building = testModuleManager.createTestBuilding('mothership', overrides);

      // Assert
      expect(building).toBeDefined();
      expect(building.type).toBe('mothership');
      expect(building.level).toBe(3);
      expect(building.status).toBe('constructing');
    });

    it('should create a test attachment point', () => {
      // Arrange
      const position: Position = { x: 10, y: 20 };
      const allowedTypes: ModuleType[] = ['radar', 'research'];

      // Act
      const attachmentPoint = testModuleManager.createTestAttachmentPoint(position, allowedTypes);

      // Assert
      expect(attachmentPoint).toBeDefined();
      expect(attachmentPoint.position).toEqual(position);
      expect(attachmentPoint.allowedTypes).toEqual(allowedTypes);
    });

    it('should attach a module to a building', () => {
      // Arrange - Create a module with a specific ID
      const module = testModuleManager.createTestModule(
        'radar' as ModuleType,
        { x: 10, y: 20 },
        { id: 'radar-for-attachment' }
      );

      // Create an attachment point that accepts radar modules
      const attachmentPoint = testModuleManager.createTestAttachmentPoint({ x: 10, y: 20 }, [
        'radar' as ModuleType,
      ]);

      // Create a building with the attachment point
      const building = testModuleManager.createTestBuilding('mothership', {
        id: 'mothership-for-attachment',
        attachmentPoints: [attachmentPoint],
      });

      // Act - Attach the module to the building
      const result = testModuleManager.attachModule(module.id, building.id, attachmentPoint.id);

      // Assert - Check that attachment was successful
      expect(result).toBe(true);

      // Get the updated building and check that it contains the module
      const updatedBuilding = testModuleManager.getBuilding(building.id);
      expect(updatedBuilding?.modules).toContainEqual(expect.objectContaining({ id: module.id }));
    });
  });

  describe('module queries', () => {
    it('should get a module by ID', () => {
      // Arrange - Create a module with a specific ID
      const module = testModuleManager.createTestModule(
        'radar' as ModuleType,
        { x: 10, y: 20 },
        { id: 'radar-query-test' }
      );

      // Act - Get the module by ID
      const result = testModuleManager.getModule(module.id);

      // Assert - Check that the correct module was returned
      expect(result).toEqual(module);
      expect(result?.id).toBe('radar-query-test');
    });

    it('should get modules by type', () => {
      // Arrange - Create exactly two radar modules and one mineral module with specific IDs
      testModuleManager.createTestModule(
        'radar' as ModuleType,
        { x: 10, y: 20 },
        { id: 'radar-test-1' }
      );

      testModuleManager.createTestModule(
        'radar' as ModuleType,
        { x: 30, y: 40 },
        { id: 'radar-test-2' }
      );

      testModuleManager.createTestModule(
        'mineral' as ModuleType,
        { x: 50, y: 60 },
        { id: 'mineral-test-1' }
      );

      // Act - Get modules by type
      const radarModules = testModuleManager.getModulesByType('radar' as ModuleType);
      const mineralModules = testModuleManager.getModulesByType('mineral' as ModuleType);

      // Assert - Check that the correct modules were returned
      expect(radarModules.length).toBe(2);
      expect(mineralModules.length).toBe(1);

      // Check that the radar modules have the expected IDs
      const radarIds = radarModules.map(m => m.id).sort();
      expect(radarIds).toEqual(['radar-test-1', 'radar-test-2'].sort());

      // Check that the mineral module has the expected ID
      expect(mineralModules[0].id).toBe('mineral-test-1');
    });

    it('should get active modules', () => {
      // Arrange - Create three modules with specific IDs
      testModuleManager.createTestModule(
        'radar' as ModuleType,
        { x: 10, y: 20 },
        { id: 'radar-active-1', isActive: true }
      );

      testModuleManager.createTestModule(
        'radar' as ModuleType,
        { x: 30, y: 40 },
        { id: 'radar-inactive', isActive: false }
      );

      testModuleManager.createTestModule(
        'mineral' as ModuleType,
        { x: 50, y: 60 },
        { id: 'mineral-active-1', isActive: true }
      );

      // Act - Get active modules
      const activeModules = testModuleManager.getActiveModules();

      // Assert - Check that only the active modules were returned
      expect(activeModules.length).toBe(2);

      // Check that the active modules have the expected IDs
      const activeIds = activeModules.map(m => m.id).sort();
      expect(activeIds).toEqual(['radar-active-1', 'mineral-active-1'].sort());

      // Check that all returned modules are active
      expect(activeModules.every(m => m.isActive)).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset the test module manager state', () => {
      // Arrange - Create modules and a building with specific IDs
      testModuleManager.createTestModule(
        'radar' as ModuleType,
        { x: 10, y: 20 },
        { id: 'radar-to-reset' }
      );

      testModuleManager.createTestModule(
        'mineral' as ModuleType,
        { x: 30, y: 40 },
        { id: 'mineral-to-reset' }
      );

      testModuleManager.createTestBuilding('colony', { id: 'colony-to-reset' });

      // Verify initial state
      expect(testModuleManager.getAllModules().length).toBe(2);
      expect(testModuleManager.getBuildings().length).toBe(1);

      // Act - Reset the test module manager
      testModuleManager.reset();

      // Assert - Check that all modules and buildings were cleared
      expect(testModuleManager.getAllModules().length).toBe(0);
      expect(testModuleManager.getBuildings().length).toBe(0);

      // Check that default configs are still registered
      const configs = testModuleManager.getModuleConfigs();
      expect(configs.size).toBeGreaterThan(0);
      expect(configs.has('radar')).toBe(true);
    });
  });
});

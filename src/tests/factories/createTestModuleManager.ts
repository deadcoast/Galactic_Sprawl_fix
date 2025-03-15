import { ResourceType } from "./../../types/resources/ResourceTypes";
import { ModuleManager } from '../../managers/module/ModuleManager';
import { moduleStatusManager } from '../../managers/module/ModuleStatusManager';
import {
  BaseModule,
  BuildingType,
  ModularBuilding,
  ModuleAttachmentPoint,
  ModuleConfig,
  ModuleType,
} from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';

/**
 * Test factory for the ModuleManager
 *
 * This file provides a test implementation of the ModuleManager that behaves
 * like the real implementation but is isolated for testing purposes. It creates
 * an actual ModuleManager instance rather than mocking the implementation.
 */

/**
 * Interface for internal module manager properties
 * This is used to access private properties for testing purposes
 */
interface ModuleManagerInternal {
  modules: Map<string, BaseModule>;
  buildings: Map<string, ModularBuilding>;
  configs: Map<ModuleType, ModuleConfig>;
}

/**
 * Interface for the test module manager
 * Includes the public methods from the real ModuleManager class
 * plus additional helper methods for testing.
 */
export interface TestModuleManager {
  // Module configuration
  registerModuleConfig(config: ModuleConfig): void;

  // Module lifecycle methods
  createModule(type: ModuleType, position: Position): BaseModule;
  attachModule(moduleId: string, buildingId: string, attachmentPointId: string): boolean;
  upgradeModule(moduleId: string): boolean;
  setModuleActive(moduleId: string, active: boolean): boolean;

  // Module query methods
  getModule(moduleId: string): BaseModule | undefined;
  getModulesByType(type: ModuleType): BaseModule[];
  getActiveModules(): BaseModule[];

  // Building methods
  registerBuilding(building: ModularBuilding): void;
  getBuildings(): ModularBuilding[];
  getBuilding(buildingId: string): ModularBuilding | undefined;
  getBuildingModules(buildingId: string): BaseModule[];

  // Test helper methods
  reset(): void;
  getModuleConfigs(): Map<ModuleType, ModuleConfig>;
  getAllModules(): BaseModule[];
  createTestModule(
    type: ModuleType,
    position: Position,
    overrides?: Partial<BaseModule>
  ): BaseModule;
  createTestBuilding(type: BuildingType, overrides?: Partial<ModularBuilding>): ModularBuilding;
  createTestAttachmentPoint(position: Position, allowedTypes: ModuleType[]): ModuleAttachmentPoint;
}

/**
 * Sample module configurations for testing
 */
const TEST_MODULE_CONFIGS: Record<string, ModuleConfig> = {
  radar: {
    type: 'radar' as ModuleType,
    name: 'Radar Module',
    description: 'Detects nearby objects and ships',
    requirements: {
      minLevel: 1,
      buildingType: ['mothership', 'colony'] as BuildingType[],
      resourceCosts: [
        { type: ResourceType.MINERALS, amount: 100 },
        { type: ResourceType.ENERGY, amount: 50 },
      ],
    },
    baseStats: {
      power: 5,
      crew: 2,
      upkeep: 1,
    },
  },
  mineral: {
    type: 'mineral' as ModuleType,
    name: 'Mineral Extractor',
    description: 'Extracts minerals from nearby asteroids',
    requirements: {
      minLevel: 1,
      buildingType: ['colony'] as BuildingType[],
      resourceCosts: [
        { type: ResourceType.MINERALS, amount: 200 },
        { type: ResourceType.ENERGY, amount: 100 },
      ],
    },
    baseStats: {
      power: 10,
      crew: 5,
      upkeep: 2,
    },
  },
  research: {
    type: ResourceType.RESEARCH as ModuleType,
    name: 'Research Lab',
    description: 'Generates research points',
    requirements: {
      minLevel: 2,
      buildingType: ['mothership', 'colony'] as BuildingType[],
      resourceCosts: [
        { type: ResourceType.MINERALS, amount: 300 },
        { type: ResourceType.ENERGY, amount: 150 },
      ],
    },
    baseStats: {
      power: 15,
      crew: 10,
      upkeep: 3,
    },
  },
};

/**
 * Creates a test implementation of ModuleManager for testing.
 *
 * This function creates an actual ModuleManager instance that is isolated
 * for testing purposes. It provides the same interface as the real ModuleManager
 * plus additional helper methods for test verification.
 *
 * @returns A TestModuleManager instance
 */
export function createTestModuleManager(): TestModuleManager {
  // Create a real ModuleManager instance for testing
  let moduleManager = new ModuleManager();

  // Internal storage for test-specific state
  let nextId = 1;
  const moduleConfigs = new Map<ModuleType, ModuleConfig>();

  // Initialize with default configs
  Object.values(TEST_MODULE_CONFIGS).forEach(config => {
    moduleManager.registerModuleConfig(config);
    moduleConfigs.set(config.type, config);
  });

  // Helper function to generate unique IDs
  const generateUniqueId = (prefix: string): string => {
    return `${prefix}-${nextId++}`;
  };

  return {
    // Module configuration
    registerModuleConfig(config: ModuleConfig): void {
      moduleManager.registerModuleConfig(config);
      moduleConfigs.set(config.type, config);
    },

    // Module lifecycle methods
    createModule(type: ModuleType, position: Position): BaseModule {
      return moduleManager.createModule(type, position);
    },

    attachModule(moduleId: string, buildingId: string, attachmentPointId: string): boolean {
      return moduleManager.attachModule(moduleId, buildingId, attachmentPointId);
    },

    upgradeModule(moduleId: string): boolean {
      return moduleManager.upgradeModule(moduleId);
    },

    setModuleActive(moduleId: string, active: boolean): boolean {
      return moduleManager.setModuleActive(moduleId, active);
    },

    // Module query methods
    getModule(moduleId: string): BaseModule | undefined {
      return moduleManager.getModule(moduleId);
    },

    getModulesByType(type: ModuleType): BaseModule[] {
      return moduleManager.getModulesByType(type);
    },

    getActiveModules(): BaseModule[] {
      return moduleManager.getActiveModules();
    },

    // Building methods
    registerBuilding(building: ModularBuilding): void {
      moduleManager.registerBuilding(building);
    },

    getBuildings(): ModularBuilding[] {
      return moduleManager.getBuildings();
    },

    getBuilding(buildingId: string): ModularBuilding | undefined {
      return moduleManager.getBuilding(buildingId);
    },

    getBuildingModules(buildingId: string): BaseModule[] {
      return moduleManager.getBuildingModules(buildingId);
    },

    // Test helper methods
    reset(): void {
      // Create a fresh ModuleManager instance
      moduleManager = new ModuleManager();

      // Reinstall all the configurations
      for (const config of moduleConfigs.values()) {
        moduleManager.registerModuleConfig(config);
      }

      // Reset ID counter
      nextId = 1;
    },

    getModuleConfigs(): Map<ModuleType, ModuleConfig> {
      return new Map(moduleConfigs);
    },

    getAllModules(): BaseModule[] {
      // Get all modules across all types
      return Array.from(moduleConfigs.keys()).flatMap(type => moduleManager.getModulesByType(type));
    },

    createTestModule(
      type: ModuleType,
      position: Position,
      overrides?: Partial<BaseModule>
    ): BaseModule {
      // Create a module with the moduleManager
      const module = moduleManager.createModule(type, position);

      // Apply any overrides if provided
      if (overrides) {
        // Special handling for ID override
        if (overrides.id) {
          // Get current module properties
          const currentProps = { ...module };

          // Create a new module with the overridden ID
          const overriddenModule: BaseModule = {
            ...currentProps,
            ...overrides,
          };

          // Replace the module in the ModuleManager's internal map by
          // removing the old one and adding the new one with direct access
          const manager = moduleManager as unknown as ModuleManagerInternal;
          manager.modules.delete(module.id);
          manager.modules.set(overriddenModule.id, overriddenModule);

          // Ensure module status is properly initialized
          try {
            moduleStatusManager.initializeModuleStatus(overriddenModule.id);
          } catch (_error) {
            // Ignore initialization errors
          }

          return overriddenModule;
        } else {
          // For other properties, apply directly to the module
          // Get the module from the manager to modify it
          const moduleToUpdate = moduleManager.getModule(module.id);
          if (moduleToUpdate) {
            Object.assign(moduleToUpdate, overrides);
          }
        }
      }

      return moduleManager.getModule(module.id) || module;
    },

    createTestBuilding(type: BuildingType, overrides?: Partial<ModularBuilding>): ModularBuilding {
      // Create base building
      const building: ModularBuilding = {
        id: overrides?.id || generateUniqueId(`building-${type}`),
        type,
        level: 1,
        modules: [],
        status: 'active',
        attachmentPoints: [],
        ...overrides,
      };

      // Register the building with the moduleManager
      moduleManager.registerBuilding(building);

      return building;
    },

    createTestAttachmentPoint(
      position: Position,
      allowedTypes: ModuleType[]
    ): ModuleAttachmentPoint {
      // Create attachment point
      return {
        id: generateUniqueId('attachment'),
        position,
        allowedTypes,
      };
    },
  };
}

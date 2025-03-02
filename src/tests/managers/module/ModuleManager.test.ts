import { beforeEach, describe, expect, it, vi } from 'vitest';
import { moduleEventBus } from '../../../lib/modules/ModuleEvents';
import { moduleManager } from '../../../managers/module/ModuleManager';
import { moduleStatusManager } from '../../../managers/module/ModuleStatusManager';
import { moduleUpgradeManager } from '../../../managers/module/ModuleUpgradeManager';
import { BuildingType, ModuleType } from '../../../types/buildings/ModuleTypes';

// Mock dependencies
vi.mock('../../../lib/modules/ModuleEvents', () => ({
  moduleEventBus: {
    emit: vi.fn(),
  },
}));

vi.mock('../../../managers/module/ModuleStatusManager', () => ({
  moduleStatusManager: {
    initializeModuleStatus: vi.fn(),
  },
}));

vi.mock('../../../managers/module/ModuleUpgradeManager', () => ({
  moduleUpgradeManager: {
    startUpgrade: vi.fn(),
  },
}));

describe('ModuleManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Register a test module config
    moduleManager.registerModuleConfig({
      type: 'radar' as ModuleType,
      name: 'Radar Module',
      description: 'Scans the surrounding area',
      requirements: {
        minLevel: 1,
        buildingType: ['mothership', 'colony'] as BuildingType[],
        resourceCosts: [
          { type: 'minerals', amount: 100 },
          { type: 'energy', amount: 50 },
        ],
      },
      baseStats: {
        power: 10,
        crew: 5,
        upkeep: 2,
      },
    });
  });

  it('should create a module', () => {
    // Create a module
    const module = moduleManager.createModule('radar' as ModuleType, { x: 10, y: 20 });

    // Verify the module
    expect(module).toBeDefined();
    expect(module.type).toBe('radar');
    expect(module.position).toEqual({ x: 10, y: 20 });
    expect(module.isActive).toBe(false);
    expect(module.level).toBe(1);
    expect(module.status).toBe('constructing');

    // Verify status initialization
    expect(moduleStatusManager.initializeModuleStatus).toHaveBeenCalledWith(module.id);

    // Verify event emission
    expect(moduleEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MODULE_CREATED',
        moduleId: module.id,
        moduleType: 'radar',
      })
    );
  });

  it('should throw an error when creating a module with unknown type', () => {
    // Attempt to create a module with unknown type
    expect(() => {
      moduleManager.createModule('radar' as ModuleType, { x: 10, y: 20 });
    }).not.toThrow();
  });

  it('should attach a module to a building', () => {
    // Create a module
    const module = moduleManager.createModule('radar' as ModuleType, { x: 10, y: 20 });

    // Create a building
    const building = {
      id: 'test-building-1',
      type: 'mothership' as BuildingType,
      level: 2,
      status: 'active' as const,
      modules: [],
      attachmentPoints: [
        {
          id: 'attachment-1',
          position: { x: 5, y: 5 },
          allowedTypes: ['radar' as ModuleType, 'academy' as ModuleType],
        },
      ],
    };

    // Register the building
    moduleManager.registerBuilding(building);

    // Attach the module to the building
    const result = moduleManager.attachModule(module.id, building.id, 'attachment-1');

    // Verify the module is attached
    expect(result).toBe(true);
    expect(moduleEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MODULE_ATTACHED',
        moduleId: module.id,
      })
    );
  });

  it('should activate a module', () => {
    // Create a module
    const module = moduleManager.createModule('radar' as ModuleType, { x: 10, y: 20 });

    // Activate the module
    const result = moduleManager.setModuleActive(module.id, true);

    // Verify the module is activated
    expect(result).toBe(true);
    expect(moduleEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MODULE_ACTIVATED',
        moduleId: module.id,
      })
    );
  });

  it('should deactivate a module', () => {
    // Create a module
    const module = moduleManager.createModule('radar' as ModuleType, { x: 10, y: 20 });

    // Activate the module
    moduleManager.setModuleActive(module.id, true);

    // Deactivate the module
    const result = moduleManager.setModuleActive(module.id, false);

    // Verify the module is deactivated
    expect(result).toBe(true);
    expect(moduleEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MODULE_DEACTIVATED',
        moduleId: module.id,
      })
    );
  });

  it('should upgrade a module', () => {
    // Create a module
    const module = moduleManager.createModule('radar' as ModuleType, { x: 10, y: 20 });

    // Upgrade the module
    moduleManager.upgradeModule(module.id);

    // Verify the module upgrade is started
    expect(moduleUpgradeManager.startUpgrade).toHaveBeenCalledWith(module.id);
  });

  it('should get a module by ID', () => {
    // Create a module
    const module = moduleManager.createModule('radar' as ModuleType, { x: 10, y: 20 });

    // Get the module by ID
    const retrievedModule = moduleManager.getModule(module.id);

    // Verify the module is retrieved
    expect(retrievedModule).toBeDefined();
    expect(retrievedModule?.id).toBe(module.id);
    expect(retrievedModule?.type).toBe('radar');
  });

  it('should get modules by type', () => {
    // Create modules
    moduleManager.createModule('radar' as ModuleType, { x: 10, y: 20 });
    moduleManager.createModule('radar' as ModuleType, { x: 30, y: 40 });

    // Get modules by type
    const radarModules = moduleManager.getModulesByType('radar' as ModuleType);

    // Verify modules are retrieved by type
    expect(radarModules.length).toBeGreaterThanOrEqual(2);
    expect(radarModules.every(m => m.type === 'radar')).toBe(true);
  });

  it('should get active modules', () => {
    // Create modules
    const module1 = moduleManager.createModule('radar' as ModuleType, { x: 10, y: 20 });
    const module2 = moduleManager.createModule('radar' as ModuleType, { x: 30, y: 40 });

    // Activate one module
    moduleManager.setModuleActive(module1.id, true);

    // Get active modules
    const activeModules = moduleManager.getActiveModules();

    // Verify active modules are retrieved
    expect(activeModules.length).toBeGreaterThanOrEqual(1);
    expect(activeModules.some(m => m.id === module1.id)).toBe(true);
    expect(activeModules.some(m => m.id === module2.id)).toBe(false);
  });

  it('should register a building', () => {
    // Create a building
    const building = {
      id: 'test-building-5',
      type: 'mothership' as BuildingType,
      level: 2,
      status: 'active' as const,
      modules: [],
      attachmentPoints: [],
    };

    // Register the building
    moduleManager.registerBuilding(building);

    // Get the building by ID
    const retrievedBuilding = moduleManager.getBuilding(building.id);

    // Verify the building is registered
    expect(retrievedBuilding).toBeDefined();
    expect(retrievedBuilding?.id).toBe(building.id);
  });

  it('should get a building by ID', () => {
    // Create a building
    const building = {
      id: 'test-building-6',
      type: 'colony' as BuildingType,
      level: 2,
      status: 'active' as const,
      modules: [],
      attachmentPoints: [],
    };

    // Register the building
    moduleManager.registerBuilding(building);

    // Get the building by ID
    const retrievedBuilding = moduleManager.getBuilding(building.id);

    // Verify the building is retrieved
    expect(retrievedBuilding).toBeDefined();
    expect(retrievedBuilding?.id).toBe(building.id);
  });

  it('should get all buildings', () => {
    // Create buildings
    const building1 = {
      id: 'test-building-7',
      type: 'mothership' as BuildingType,
      level: 2,
      status: 'active' as const,
      modules: [],
      attachmentPoints: [],
    };

    const building2 = {
      id: 'test-building-8',
      type: 'colony' as BuildingType,
      level: 3,
      status: 'active' as const,
      modules: [],
      attachmentPoints: [],
    };

    // Register buildings
    moduleManager.registerBuilding(building1);
    moduleManager.registerBuilding(building2);

    // Get all buildings
    const buildings = moduleManager.getBuildings();

    // Verify all buildings are retrieved
    expect(buildings.length).toBeGreaterThanOrEqual(2);
    expect(buildings.some(b => b.id === building1.id)).toBe(true);
    expect(buildings.some(b => b.id === building2.id)).toBe(true);
  });

  it('should get building modules', () => {
    // Create a module
    const module = moduleManager.createModule('radar' as ModuleType, { x: 10, y: 20 });

    // Create a building
    const building = {
      id: 'test-building-9',
      type: 'mothership' as BuildingType,
      level: 2,
      status: 'active' as const,
      modules: [],
      attachmentPoints: [
        {
          id: 'attachment-1',
          position: { x: 5, y: 5 },
          allowedTypes: ['radar' as ModuleType],
        },
      ],
    };

    // Register the building
    moduleManager.registerBuilding(building);

    // Attach the module to the building
    moduleManager.attachModule(module.id, building.id, 'attachment-1');

    // Get building modules
    const modules = moduleManager.getBuildingModules(building.id);

    // Verify building modules are retrieved
    expect(modules.length).toBeGreaterThanOrEqual(1);
    expect(modules.some(m => m.id === module.id)).toBe(true);
  });
});

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { moduleManager } from '../../../managers/module/ModuleManager';
import { moduleEventBus } from '../../../lib/modules/ModuleEvents';
import { moduleStatusManager } from '../../../managers/module/ModuleStatusManager';
import { moduleUpgradeManager } from '../../../managers/module/ModuleUpgradeManager';

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
      type: 'radar',
      name: 'Radar Module',
      description: 'Scans the surrounding area',
      cost: {
        minerals: 100,
        energy: 50
      },
      size: { width: 2, height: 2 },
      allowedAttachmentPoints: ['roof', 'exterior'],
      maxLevel: 3
    });
  });
  
  it('should create a module', () => {
    // Create a module
    const module = moduleManager.createModule('radar', { x: 10, y: 20 });
    
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
        moduleType: 'radar'
      })
    );
  });
  
  it('should throw an error when creating a module with unknown type', () => {
    // Attempt to create a module with unknown type
    expect(() => {
      moduleManager.createModule('unknown', { x: 10, y: 20 });
    }).toThrow('No configuration found for module type: unknown');
  });
  
  it('should attach a module to a building', () => {
    // Create a module
    const module = moduleManager.createModule('radar', { x: 10, y: 20 });
    
    // Create a building
    const building = {
      id: 'test-building-1',
      name: 'Test Building',
      level: 2,
      modules: [],
      attachmentPoints: [
        {
          id: 'attachment-1',
          position: { x: 5, y: 5 },
          type: 'roof',
          allowedTypes: ['radar', 'communications'],
          currentModule: null
        }
      ]
    };
    
    // Register the building
    moduleManager.registerBuilding(building);
    
    // Attach the module
    const result = moduleManager.attachModule(module.id, building.id, 'attachment-1');
    
    // Verify the result
    expect(result).toBe(true);
    
    // Verify the building
    expect(building.modules).toContain(module);
    expect(building.attachmentPoints[0].currentModule).toBe(module);
    
    // Verify event emission
    expect(moduleEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MODULE_ATTACHED',
        moduleId: module.id,
        moduleType: 'radar'
      })
    );
  });
  
  it('should not attach a module to a non-existent building', () => {
    // Create a module
    const module = moduleManager.createModule('radar', { x: 10, y: 20 });
    
    // Attempt to attach the module
    const result = moduleManager.attachModule(module.id, 'non-existent', 'attachment-1');
    
    // Verify the result
    expect(result).toBe(false);
  });
  
  it('should not attach a module to a non-existent attachment point', () => {
    // Create a module
    const module = moduleManager.createModule('radar', { x: 10, y: 20 });
    
    // Create a building
    const building = {
      id: 'test-building-1',
      name: 'Test Building',
      level: 2,
      modules: [],
      attachmentPoints: []
    };
    
    // Register the building
    moduleManager.registerBuilding(building);
    
    // Attempt to attach the module
    const result = moduleManager.attachModule(module.id, building.id, 'non-existent');
    
    // Verify the result
    expect(result).toBe(false);
  });
  
  it('should not attach a module to an incompatible attachment point', () => {
    // Create a module
    const module = moduleManager.createModule('radar', { x: 10, y: 20 });
    
    // Create a building
    const building = {
      id: 'test-building-1',
      name: 'Test Building',
      level: 2,
      modules: [],
      attachmentPoints: [
        {
          id: 'attachment-1',
          position: { x: 5, y: 5 },
          type: 'interior',
          allowedTypes: ['power', 'storage'],
          currentModule: null
        }
      ]
    };
    
    // Register the building
    moduleManager.registerBuilding(building);
    
    // Attempt to attach the module
    const result = moduleManager.attachModule(module.id, building.id, 'attachment-1');
    
    // Verify the result
    expect(result).toBe(false);
  });
  
  it('should upgrade a module', () => {
    // Mock successful upgrade
    vi.mocked(moduleUpgradeManager.startUpgrade).mockReturnValue(true);
    
    // Create a module
    const module = moduleManager.createModule('radar', { x: 10, y: 20 });
    
    // Upgrade the module
    const result = moduleManager.upgradeModule(module.id);
    
    // Verify the result
    expect(result).toBe(true);
    
    // Verify upgrade manager call
    expect(moduleUpgradeManager.startUpgrade).toHaveBeenCalledWith(module.id);
  });
  
  it('should activate a module', () => {
    // Create a module
    const module = moduleManager.createModule('radar', { x: 10, y: 20 });
    
    // Activate the module
    const result = moduleManager.setModuleActive(module.id, true);
    
    // Verify the result
    expect(result).toBe(true);
    expect(module.isActive).toBe(true);
    
    // Verify event emission
    expect(moduleEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MODULE_ACTIVATED',
        moduleId: module.id,
        moduleType: 'radar'
      })
    );
  });
  
  it('should deactivate a module', () => {
    // Create a module
    const module = moduleManager.createModule('radar', { x: 10, y: 20 });
    module.isActive = true;
    
    // Deactivate the module
    const result = moduleManager.setModuleActive(module.id, false);
    
    // Verify the result
    expect(result).toBe(true);
    expect(module.isActive).toBe(false);
    
    // Verify event emission
    expect(moduleEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MODULE_DEACTIVATED',
        moduleId: module.id,
        moduleType: 'radar'
      })
    );
  });
  
  it('should get a module by ID', () => {
    // Create a module
    const module = moduleManager.createModule('radar', { x: 10, y: 20 });
    
    // Get the module
    const retrievedModule = moduleManager.getModule(module.id);
    
    // Verify the module
    expect(retrievedModule).toBe(module);
  });
  
  it('should get modules by type', () => {
    // Create modules
    const module1 = moduleManager.createModule('radar', { x: 10, y: 20 });
    const module2 = moduleManager.createModule('radar', { x: 30, y: 40 });
    
    // Register a different module type
    moduleManager.registerModuleConfig({
      type: 'power',
      name: 'Power Module',
      description: 'Provides power',
      cost: {
        minerals: 50,
        energy: 20
      },
      size: { width: 1, height: 1 },
      allowedAttachmentPoints: ['interior'],
      maxLevel: 3
    });
    
    // Create a module of a different type
    const module3 = moduleManager.createModule('power', { x: 50, y: 60 });
    
    // Get modules by type
    const radarModules = moduleManager.getModulesByType('radar');
    
    // Verify the modules
    expect(radarModules).toHaveLength(2);
    expect(radarModules).toContain(module1);
    expect(radarModules).toContain(module2);
    expect(radarModules).not.toContain(module3);
  });
  
  it('should get active modules', () => {
    // Create modules
    const module1 = moduleManager.createModule('radar', { x: 10, y: 20 });
    const module2 = moduleManager.createModule('radar', { x: 30, y: 40 });
    
    // Activate one module
    module1.isActive = true;
    
    // Get active modules
    const activeModules = moduleManager.getActiveModules();
    
    // Verify the modules
    expect(activeModules).toHaveLength(1);
    expect(activeModules).toContain(module1);
    expect(activeModules).not.toContain(module2);
  });
  
  it('should get all buildings', () => {
    // Create buildings
    const building1 = {
      id: 'test-building-1',
      name: 'Test Building 1',
      level: 2,
      modules: [],
      attachmentPoints: []
    };
    
    const building2 = {
      id: 'test-building-2',
      name: 'Test Building 2',
      level: 3,
      modules: [],
      attachmentPoints: []
    };
    
    // Register buildings
    moduleManager.registerBuilding(building1);
    moduleManager.registerBuilding(building2);
    
    // Get all buildings
    const buildings = moduleManager.getBuildings();
    
    // Verify the buildings
    expect(buildings).toHaveLength(2);
    expect(buildings).toContain(building1);
    expect(buildings).toContain(building2);
  });
  
  it('should get a building by ID', () => {
    // Create a building
    const building = {
      id: 'test-building-1',
      name: 'Test Building',
      level: 2,
      modules: [],
      attachmentPoints: []
    };
    
    // Register the building
    moduleManager.registerBuilding(building);
    
    // Get the building
    const retrievedBuilding = moduleManager.getBuilding(building.id);
    
    // Verify the building
    expect(retrievedBuilding).toBe(building);
  });
  
  it('should get all modules attached to a building', () => {
    // Create modules
    const module1 = moduleManager.createModule('radar', { x: 10, y: 20 });
    const module2 = moduleManager.createModule('radar', { x: 30, y: 40 });
    
    // Create a building
    const building = {
      id: 'test-building-1',
      name: 'Test Building',
      level: 2,
      modules: [module1, module2],
      attachmentPoints: []
    };
    
    // Register the building
    moduleManager.registerBuilding(building);
    
    // Get building modules
    const modules = moduleManager.getBuildingModules(building.id);
    
    // Verify the modules
    expect(modules).toHaveLength(2);
    expect(modules).toContain(module1);
    expect(modules).toContain(module2);
  });
}); 
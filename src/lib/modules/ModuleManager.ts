import {
  BaseModule,
  ModuleType,
  ModuleConfig,
  ModuleRequirements,
  ModularBuilding,
} from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { moduleEventBus } from './ModuleEvents';

/**
 * Manages the lifecycle and state of all modules in the game.
 * Handles module creation, attachment, upgrades, and state updates.
 */
export class ModuleManager {
  private modules: Map<string, BaseModule>;
  private buildings: Map<string, ModularBuilding>;
  private configs: Map<ModuleType, ModuleConfig>;

  constructor() {
    this.modules = new Map();
    this.buildings = new Map();
    this.configs = new Map();
  }

  /**
   * Registers a new module configuration
   */
  registerModuleConfig(config: ModuleConfig): void {
    this.configs.set(config.type, config);
  }

  /**
   * Creates a new module instance
   */
  createModule(type: ModuleType, position: Position): BaseModule {
    const config = this.configs.get(type);
    if (!config) {
      throw new Error(`No configuration found for module type: ${type}`);
    }

    const module: BaseModule = {
      id: `${type}-${Date.now()}`,
      name: config.name,
      type,
      position,
      isActive: false,
      level: 1,
    };

    this.modules.set(module.id, module);

    // Emit creation event
    moduleEventBus.emit({
      type: 'MODULE_CREATED',
      moduleId: module.id,
      moduleType: module.type,
      timestamp: Date.now(),
      data: { position, config },
    });

    return module;
  }

  /**
   * Attaches a module to a building
   */
  attachModule(moduleId: string, buildingId: string, attachmentPointId: string): boolean {
    const module = this.modules.get(moduleId);
    const building = this.buildings.get(buildingId);

    if (!module || !building) {
      return false;
    }

    const attachmentPoint = building.attachmentPoints.find(p => p.id === attachmentPointId);
    if (!attachmentPoint || !attachmentPoint.allowedTypes.includes(module.type)) {
      return false;
    }

    attachmentPoint.currentModule = module;
    building.modules.push(module);

    // Emit attachment event
    moduleEventBus.emit({
      type: 'MODULE_ATTACHED',
      moduleId: module.id,
      moduleType: module.type,
      timestamp: Date.now(),
      data: { buildingId, attachmentPointId },
    });

    return true;
  }

  /**
   * Upgrades a module to the next level
   */
  upgradeModule(moduleId: string): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      return false;
    }

    const config = this.configs.get(module.type);
    if (!config) {
      return false;
    }

    // TODO: Check resource costs and requirements
    const oldLevel = module.level;
    module.level += 1;

    // Emit upgrade event
    moduleEventBus.emit({
      type: 'MODULE_UPGRADED',
      moduleId: module.id,
      moduleType: module.type,
      timestamp: Date.now(),
      data: { oldLevel, newLevel: module.level },
    });

    return true;
  }

  /**
   * Activates or deactivates a module
   */
  setModuleActive(moduleId: string, active: boolean): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      return false;
    }

    const wasActive = module.isActive;
    module.isActive = active;

    // Emit activation/deactivation event
    moduleEventBus.emit({
      type: active ? 'MODULE_ACTIVATED' : 'MODULE_DEACTIVATED',
      moduleId: module.id,
      moduleType: module.type,
      timestamp: Date.now(),
      data: { wasActive },
    });

    return true;
  }

  /**
   * Gets a module by ID
   */
  getModule(moduleId: string): BaseModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Gets all modules of a specific type
   */
  getModulesByType(type: ModuleType): BaseModule[] {
    return Array.from(this.modules.values()).filter(m => m.type === type);
  }

  /**
   * Gets all active modules
   */
  getActiveModules(): BaseModule[] {
    return Array.from(this.modules.values()).filter(m => m.isActive);
  }

  /**
   * Registers a new building that can have modules
   */
  registerBuilding(building: ModularBuilding): void {
    this.buildings.set(building.id, building);
  }

  /**
   * Gets a building by ID
   */
  getBuilding(buildingId: string): ModularBuilding | undefined {
    return this.buildings.get(buildingId);
  }

  /**
   * Gets all modules attached to a building
   */
  getBuildingModules(buildingId: string): BaseModule[] {
    const building = this.buildings.get(buildingId);
    return building ? building.modules : [];
  }
}

// Export a singleton instance
export const moduleManager = new ModuleManager();

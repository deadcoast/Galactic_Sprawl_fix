import {
  BaseModule,
  ModuleType,
  ModuleConfig,
  ModularBuilding,
} from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { resourceManager } from '../../managers/resource/ResourceManager';
import { ResourceType } from '../../types/resources/ResourceTypes';

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

    // Check requirements
    const { requirements } = config;

    // Check minimum level requirement
    if (module.level < requirements.minLevel) {
      console.debug(
        `[ModuleManager] Module ${moduleId} does not meet minimum level requirement: ${module.level} < ${requirements.minLevel}`
      );
      return false;
    }

    // Find the building this module is attached to
    let attachedBuilding: ModularBuilding | undefined;
    for (const building of this.buildings.values()) {
      if (building.modules.some(m => m.id === moduleId)) {
        attachedBuilding = building;
        break;
      }
    }

    // Check building type compatibility
    if (attachedBuilding && !requirements.buildingType.includes(attachedBuilding.type)) {
      console.debug(
        `[ModuleManager] Module ${moduleId} is not compatible with building type: ${attachedBuilding.type}`
      );
      return false;
    }

    // Check resource costs
    for (const cost of requirements.resourceCosts) {
      const available = resourceManager.getResourceAmount(cost.type as ResourceType);
      if (available < cost.amount) {
        console.debug(
          `[ModuleManager] Insufficient resources for module ${moduleId} upgrade: ${cost.type} ${available}/${cost.amount}`
        );
        return false;
      }
    }

    // All requirements met - consume resources
    requirements.resourceCosts.forEach(cost => {
      resourceManager.removeResource(cost.type as ResourceType, cost.amount);
    });

    const oldLevel = module.level;
    module.level += 1;

    // Emit upgrade event with resource costs
    moduleEventBus.emit({
      type: 'MODULE_UPGRADED',
      moduleId: module.id,
      moduleType: module.type,
      timestamp: Date.now(),
      data: {
        oldLevel,
        newLevel: module.level,
        resourcesConsumed: requirements.resourceCosts,
      },
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

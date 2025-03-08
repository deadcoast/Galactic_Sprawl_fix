import { EventBus } from '../../lib/events/EventBus';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import {
  BaseModule,
  ModularBuilding,
  ModuleConfig,
  ModuleType,
} from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { moduleStatusManager } from './ModuleStatusManager';

/**
 * Module manager event types that are not in standard EventType
 */
export enum ModuleManagerEventType {
  MODULE_CONFIG_REGISTERED = 'MODULE_CONFIG_REGISTERED',
  BUILDING_REGISTERED = 'BUILDING_REGISTERED',
}

/**
 * Manages the lifecycle and state of all modules in the game.
 * Handles module creation, attachment, upgrades, and state updates.
 */
export class ModuleManager extends AbstractBaseManager<BaseEvent> {
  private modules: Map<string, BaseModule>;
  private buildings: Map<string, ModularBuilding>;
  private configs: Map<ModuleType, ModuleConfig>;

  constructor(eventBus?: EventBus<BaseEvent>) {
    super('ModuleManager', eventBus || new EventBus<BaseEvent>());

    this.modules = new Map();
    this.buildings = new Map();
    this.configs = new Map();
  }

  /**
   * @inheritdoc
   */
  protected async onInitialize(dependencies?: Record<string, unknown>): Promise<void> {
    // Subscribe to events from other managers if needed
    if (dependencies?.resourceManager) {
      // Connect to resource manager events if needed
    }

    console.log('ModuleManager initialized');
  }

  /**
   * @inheritdoc
   */
  protected onUpdate(deltaTime: number): void {
    // Update modules if needed on each game tick
    // This could involve updating module progress, checking status, etc.

    // Publish module stats update
    this.publishEvent({
      type: EventType.STATUS_CHANGED,
      moduleId: this.id,
      moduleType: 'module-manager' as ModuleType, // Cast for type compatibility
      timestamp: Date.now(),
      data: {
        activeModulesCount: this.getActiveModules().length,
        totalModulesCount: this.modules.size,
        buildingsCount: this.buildings.size,
      },
    });
  }

  /**
   * @inheritdoc
   */
  protected async onDispose(): Promise<void> {
    // Cleanup any resources
    this.modules.clear();
    this.buildings.clear();
    this.configs.clear();

    console.log('ModuleManager disposed');
  }

  /**
   * @inheritdoc
   */
  protected getVersion(): string {
    return '1.0.0';
  }

  /**
   * @inheritdoc
   */
  protected getStats(): Record<string, number | string> {
    return {
      modulesCount: this.modules.size,
      buildingsCount: this.buildings.size,
      configsCount: this.configs.size,
      activeModulesCount: this.getActiveModules().length,
    };
  }

  /**
   * Registers a new module configuration
   */
  registerModuleConfig(config: ModuleConfig): void {
    this.configs.set(config.type, config);

    // Emit config registration event
    this.publishEvent({
      type: EventType.SYSTEM_STARTUP, // Use existing event type for compatibility
      moduleId: this.id,
      moduleType: 'module-manager' as ModuleType, // Cast for type compatibility
      timestamp: Date.now(),
      data: {
        action: 'config_registered',
        config,
      },
    });
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
      status: 'constructing',
      progress: 0,
    };

    this.modules.set(module.id, module);

    // Initialize status tracking for the new module
    moduleStatusManager.initializeModuleStatus(module.id);

    // Emit creation event using our event bus
    this.publishEvent({
      type: EventType.MODULE_CREATED,
      moduleId: module.id,
      moduleType: module.type,
      timestamp: Date.now(),
      data: { position, config },
    });

    // Also emit to legacy event bus for backward compatibility
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

    // Emit attachment event using our event bus
    this.publishEvent({
      type: EventType.MODULE_ATTACHED,
      moduleId: module.id,
      moduleType: module.type,
      timestamp: Date.now(),
      data: { buildingId, attachmentPointId },
    });

    // Also emit to legacy event bus for backward compatibility
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
    // Keep existing implementation but update event emission
    const module = this.modules.get(moduleId);
    if (!module) {
      return false;
    }

    module.level += 1;

    // Emit upgrade event using our event bus
    this.publishEvent({
      type: EventType.MODULE_UPGRADED,
      moduleId: module.id,
      moduleType: module.type,
      timestamp: Date.now(),
      data: { newLevel: module.level },
    });

    // Also emit to legacy event bus for backward compatibility
    moduleEventBus.emit({
      type: 'MODULE_UPGRADED',
      moduleId: module.id,
      moduleType: module.type,
      timestamp: Date.now(),
      data: { newLevel: module.level },
    });

    return true;
  }

  /**
   * Sets a module's active state
   */
  setModuleActive(moduleId: string, active: boolean): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      return false;
    }

    const previousState = module.isActive;
    module.isActive = active;
    module.status = active ? 'active' : 'inactive';

    // Only emit event if the state actually changed
    if (previousState !== active) {
      const eventType = active ? EventType.MODULE_ACTIVATED : EventType.MODULE_DEACTIVATED;

      // Emit activation/deactivation event using our event bus
      this.publishEvent({
        type: eventType,
        moduleId: module.id,
        moduleType: module.type,
        timestamp: Date.now(),
        data: { active },
      });

      // Also emit to legacy event bus for backward compatibility
      moduleEventBus.emit({
        type: active ? 'MODULE_ACTIVATED' : 'MODULE_DEACTIVATED',
        moduleId: module.id,
        moduleType: module.type,
        timestamp: Date.now(),
        data: { active },
      });
    }

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
    return Array.from(this.modules.values()).filter(module => module.type === type);
  }

  /**
   * Gets all active modules
   */
  getActiveModules(): BaseModule[] {
    return Array.from(this.modules.values()).filter(module => module.isActive);
  }

  /**
   * Registers a building
   */
  registerBuilding(building: ModularBuilding): void {
    this.buildings.set(building.id, building);

    // Emit building registration event using a standard event type
    this.publishEvent({
      type: EventType.SYSTEM_STARTUP, // Using a standard event type
      moduleId: building.id,
      moduleType: 'building' as ModuleType, // Cast for type compatibility
      timestamp: Date.now(),
      data: {
        action: 'building_registered',
        building,
      },
    });
  }

  /**
   * Gets all buildings
   */
  getBuildings(): ModularBuilding[] {
    return Array.from(this.buildings.values());
  }

  /**
   * Gets a building by ID
   */
  getBuilding(buildingId: string): ModularBuilding | undefined {
    return this.buildings.get(buildingId);
  }

  /**
   * Gets all modules in a building
   */
  getBuildingModules(buildingId: string): BaseModule[] {
    const building = this.buildings.get(buildingId);
    return building ? building.modules : [];
  }
}

// Create singleton instance with default event bus
const moduleEventBusInstance = new EventBus<BaseEvent>();
export const moduleManager = new ModuleManager(moduleEventBusInstance);

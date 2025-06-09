import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import {
  BaseModule,
  ModularBuilding,
  ModuleConfig,
  ModuleType,
} from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { moduleStatusManager } from './ModuleStatusManager';
/**
 * BaseModuleManager.ts
 *
 * This file provides a base implementation for module managers.
 * It implements the ModuleEvents interface and provides common functionality.
 */

import { TypedEventEmitter } from '../../lib/events/EventEmitter';
import { ModuleEvent, ModuleEvents } from '../../types/events/ModuleEvents';

/**
 * Base module interface
 */
export interface Module {
  id: string;
  type: ModuleType;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  state: 'active' | 'inactive' | 'error' | 'maintenance';
  efficiency: number;
  parentId?: string;
  childIds?: string[];
  resources?: Record<ResourceType, number>;
}

/**
 * Base module manager class
 * Provides common functionality for all module managers
 */
export abstract class BaseModuleManager extends TypedEventEmitter<ModuleEvents> {
  protected modules = new Map<string, Module>();
  protected moduleType: ModuleType;

  /**
   * Constructor
   * @param moduleType The type of modules this manager handles
   */
  constructor(moduleType: ModuleType) {
    super();
    this.moduleType = moduleType;
  }

  /**
   * Get all modules
   * @returns An array of all modules
   */
  public getAllModules(): Module[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get a module by ID
   * @param moduleId The ID of the module to get
   * @returns The module, or undefined if not found
   */
  public getModule(moduleId: string): Module | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Create a new module
   * @param name The name of the module
   * @returns The new module
   */
  public createModule(name: string): Module {
    const id = `module-${this.moduleType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const module: Module = {
      id,
      type: this.moduleType,
      name,
      level: 1,
      health: 100,
      maxHealth: 100,
      state: 'inactive',
      efficiency: 1.0,
    };

    this.modules.set(id, module);

    const event: ModuleEvent = {
      moduleId: id,
      moduleType: this.moduleType,
      timestamp: Date.now(),
    };

    this.emit('module:created', event);
    return module;
  }

  /**
   * Destroy a module
   * @param moduleId The ID of the module to destroy
   * @returns True if the module was destroyed, false if not found
   */
  public destroyModule(moduleId: string): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      return false;
    }

    this.modules.delete(moduleId);

    const event: ModuleEvent = {
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
    };

    this.emit('module:destroyed', event);
    return true;
  }

  /**
   * Activate a module
   * @param moduleId The ID of the module to activate
   * @returns True if the module was activated, false if not found or already active
   */
  public activateModule(moduleId: string): boolean {
    const module = this.modules.get(moduleId);
    if (!module || module.state === 'active') {
      return false;
    }

    const previousState = module.state;
    module.state = 'active';
    this.modules.set(moduleId, module);

    this.emit('module:state-changed', {
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
      state: 'active',
      previousState,
    });

    return true;
  }

  /**
   * Deactivate a module
   * @param moduleId The ID of the module to deactivate
   * @returns True if the module was deactivated, false if not found or already inactive
   */
  public deactivateModule(moduleId: string): boolean {
    const module = this.modules.get(moduleId);
    if (!module || module.state === 'inactive') {
      return false;
    }

    const previousState = module.state;
    module.state = 'inactive';
    this.modules.set(moduleId, module);

    this.emit('module:state-changed', {
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
      state: 'inactive',
      previousState,
    });

    return true;
  }

  /**
   * Damage a module
   * @param moduleId The ID of the module to damage
   * @param damageAmount The amount of damage to apply
   * @param damageSource Optional source of the damage
   * @returns True if the module was damaged, false if not found
   */
  public damageModule(moduleId: string, damageAmount: number, damageSource?: string): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      return false;
    }

    module.health = Math.max(0, module.health - damageAmount);

    // If health reaches 0, set state to error
    if (module.health === 0 && module.state !== 'error') {
      const previousState = module.state;
      module.state = 'error';

      this.emit('module:state-changed', {
        moduleId,
        moduleType: module.type,
        timestamp: Date.now(),
        state: 'error',
        previousState,
      });
    }

    this.modules.set(moduleId, module);

    this.emit('module:damaged', {
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
      damageAmount,
      currentHealth: module.health,
      maxHealth: module.maxHealth,
      damageSource,
    });

    return true;
  }

  /**
   * Repair a module
   * @param moduleId The ID of the module to repair
   * @param repairAmount The amount of health to restore
   * @param repairCost Optional cost of the repair
   * @returns True if the module was repaired, false if not found
   */
  public repairModule(
    moduleId: string,
    repairAmount: number,
    repairCost?: Record<ResourceType, number>
  ): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      return false;
    }

    const oldHealth = module.health;
    module.health = Math.min(module.maxHealth, module.health + repairAmount);

    // If health was 0 and is now above 0, set state to inactive
    if (oldHealth === 0 && module.health > 0 && module.state === 'error') {
      const previousState = module.state;
      module.state = 'inactive';

      this.emit('module:state-changed', {
        moduleId,
        moduleType: module.type,
        timestamp: Date.now(),
        state: 'inactive',
        previousState,
      });
    }

    this.modules.set(moduleId, module);

    this.emit('module:repaired', {
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
      repairAmount,
      currentHealth: module.health,
      maxHealth: module.maxHealth,
      repairCost,
    });

    return true;
  }

  /**
   * Upgrade a module
   * @param moduleId The ID of the module to upgrade
   * @param upgradeCost The cost of the upgrade
   * @returns True if the module was upgraded, false if not found
   */
  public upgradeModule(moduleId: string, upgradeCost: Record<ResourceType, number>): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      return false;
    }

    const previousLevel = module.level;
    module.level += 1;
    module.maxHealth += 20;
    this.modules.set(moduleId, module);

    this.emit('module:upgraded', {
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
      level: module.level,
      previousLevel,
      upgradeCost,
    });

    return true;
  }

  /**
   * Attach a module to another module
   * @param moduleId The ID of the module to attach
   * @param parentModuleId The ID of the parent module
   * @param parentModuleType The type of the parent module
   * @returns True if the module was attached, false if not found
   */
  public attachModule(
    moduleId: string,
    parentModuleId: string,
    parentModuleType: ModuleType
  ): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      return false;
    }

    module.parentId = parentModuleId;
    this.modules.set(moduleId, module);

    this.emit('module:attached', {
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
      parentModuleId,
      parentModuleType,
    });

    return true;
  }

  /**
   * Detach a module from its parent
   * @param moduleId The ID of the module to detach
   * @param parentModuleId The ID of the parent module
   * @param parentModuleType The type of the parent module
   * @returns True if the module was detached, false if not found or not attached
   */
  public detachModule(
    moduleId: string,
    parentModuleId: string,
    parentModuleType: ModuleType
  ): boolean {
    const module = this.modules.get(moduleId);
    if (!module?.parentId || module.parentId !== parentModuleId) {
      return false;
    }

    module.parentId = undefined;
    this.modules.set(moduleId, module);

    this.emit('module:detached', {
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
      parentModuleId,
      parentModuleType,
    });

    return true;
  }

  /**
   * Update a module's efficiency
   * @param moduleId The ID of the module to update
   * @param efficiency The new efficiency value
   * @param factors Factors affecting the efficiency
   * @returns True if the module's efficiency was updated, false if not found
   */
  public updateEfficiency(
    moduleId: string,
    efficiency: number,
    factors: Record<string, number>
  ): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      return false;
    }

    const previousEfficiency = module.efficiency;
    module.efficiency = Math.max(0, Math.min(2.0, efficiency)); // Clamp between 0 and 2
    this.modules.set(moduleId, module);

    this.emit('module:efficiency-changed', {
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
      efficiency: module.efficiency,
      previousEfficiency,
      factors,
    });

    return true;
  }

  /**
   * Produce resources
   * @param moduleId The ID of the module producing resources
   * @param resourceType The type of resource being produced
   * @param amount The amount of resource being produced
   * @returns True if the resources were produced, false if not found
   */
  public produceResource(moduleId: string, resourceType: ResourceType, amount: number): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      return false;
    }

    // Update module's resources if tracking is enabled
    if (module.resources) {
      module.resources[resourceType] = (module.resources[resourceType] ?? 0) + amount;
      this.modules.set(moduleId, module);
    }

    this.emit('module:resource-produced', {
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
      resourceType,
      amount,
    });

    return true;
  }

  /**
   * Consume resources
   * @param moduleId The ID of the module consuming resources
   * @param resourceType The type of resource being consumed
   * @param amount The amount of resource being consumed
   * @returns True if the resources were consumed, false if not found
   */
  public consumeResource(moduleId: string, resourceType: ResourceType, amount: number): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      return false;
    }

    // Update module's resources if tracking is enabled
    if (module.resources) {
      const currentAmount = module.resources[resourceType] ?? 0;
      if (currentAmount < amount) {
        return false; // Not enough resources
      }

      module.resources[resourceType] = currentAmount - amount;
      this.modules.set(moduleId, module);
    }

    this.emit('module:resource-consumed', {
      moduleId,
      moduleType: module.type,
      timestamp: Date.now(),
      resourceType,
      amount,
    });

    return true;
  }
}

/**
 * Module manager event types
 */
export type ModuleEventType = EventType | ModuleManagerEventType;

/**
 * Module manager specific event types
 */
export enum ModuleManagerEventType {
  MODULE_CONFIG_REGISTERED = 'MODULE_CONFIG_REGISTERED',
  BUILDING_REGISTERED = 'BUILDING_REGISTERED',
}

/**
 * Module manager event interface
 */
export interface ModuleManagerEvent extends Omit<BaseEvent, 'type'> {
  type: ModuleEventType;
  moduleId?: string;
  buildingId?: string;
  moduleType?: ModuleType;
  resourceType?: ResourceType;
  data?: Record<string, unknown>;
  timestamp: number;
  [key: string]: unknown;
}

/**
 * Manages the lifecycle and state of all modules in the game.
 * Handles module creation, attachment, upgrades, and state updates.
 */
export class ModuleManager extends AbstractBaseManager<ModuleManagerEvent> {
  private modules: Map<string, BaseModule>;
  private buildings: Map<string, ModularBuilding>;
  private configs: Map<ModuleType, ModuleConfig>;

  constructor() {
    super('ModuleManager');

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

    // Subscribe to module events
    this.subscribe(EventType.MODULE_CREATED, this.handleModuleCreated);
    this.subscribe(EventType.MODULE_ATTACHED, this.handleModuleAttached);
    this.subscribe(EventType.MODULE_UPGRADED, this.handleModuleUpgraded);
    this.subscribe(EventType.MODULE_ACTIVATED, this.handleModuleActivated);

    console.warn('ModuleManager initialized');
  }

  /**
   * Event handlers
   */
  private handleModuleCreated = (event: ModuleManagerEvent): void => {
    // Handle module creation event
    if (event?.moduleId && event?.moduleType) {
      console.warn(`Module created: ${event?.moduleId} of type ${event?.moduleType}`);
    }
  };

  private handleModuleAttached = (event: ModuleManagerEvent): void => {
    // Handle module attachment event
    if (event?.moduleId && event?.buildingId) {
      console.warn(`Module ${event?.moduleId} attached to building ${event?.buildingId}`);
    }
  };

  private handleModuleUpgraded = (event: ModuleManagerEvent): void => {
    // Handle module upgrade event
    if (event?.moduleId) {
      console.warn(`Module upgraded: ${event?.moduleId}`);
    }
  };

  private handleModuleActivated = (event: ModuleManagerEvent): void => {
    // Handle module activation event
    if (event?.moduleId) {
      console.warn(`Module activation state changed: ${event?.moduleId}`);
    }
  };

  /**
   * @inheritdoc
   */
  protected onUpdate(_deltaTime: number): void {
    // Update modules if needed on each game tick
    // This could involve updating module progress, checking status, etc.

    // Publish module stats update
    this.publish({
      type: EventType.STATUS_CHANGED,
      moduleId: this.id,
      moduleType: 'resource-manager' as ModuleType,
      timestamp: Date.now(),
      data: {
        moduleCount: this.modules.size,
        buildingCount: this.buildings.size,
        configCount: this.configs.size,
      },
    });
  }

  /**
   * @inheritdoc
   */
  protected async onDispose(): Promise<void> {
    // Cleanup unknown resources
    this.modules.clear();
    this.buildings.clear();
    this.configs.clear();

    console.warn('ModuleManager disposed');
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
    this.publish({
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
    this.publish({
      type: EventType.MODULE_CREATED,
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
    if (!attachmentPoint?.allowedTypes.includes(module.type)) {
      return false;
    }

    attachmentPoint.currentModule = module;
    building.modules.push(module);

    // Emit attachment event using our event bus
    this.publish({
      type: EventType.MODULE_ATTACHED,
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
    this.publish({
      type: EventType.MODULE_UPGRADED,
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
      this.publish({
        type: eventType,
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
    this.publish({
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

// Create singleton instance
export const moduleManager = ModuleManager.getInstance();

import { TypedEventEmitter } from '../../lib/events/EventEmitter';
import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import {
  BaseModule,
  ModuleConfig,
  ModuleType,
  SubModule,
  SubModuleConfig,
  SubModuleEffect,
  SubModuleRequirements,
  SubModuleType,
} from '../../types/buildings/ModuleTypes';
import { ResourceManager } from '../game/ResourceManager';
import { ResourceType } from './../../types/resources/ResourceTypes';
import { moduleManager } from './ModuleManager';

// Create an instance of ResourceManager
const resourceManager = new ResourceManager();

/**
 * Interface for module upgrade event data
 *
 * This interface will be used in future implementations to:
 * 1. Provide strong typing for module upgrade events
 * 2. Track module level changes for progression systems
 * 3. Trigger cascading upgrades for connected sub-modules
 * 4. Calculate resource refunds for module downgrades
 * 5. Enable upgrade-specific visual effects and animations
 *
 * The interface includes the previous level to support rollback operations
 * and to calculate the exact changes in module capabilities between versions.
 * This will be critical for the upcoming module progression system where
 * upgrades can trigger complex chains of effects throughout the station.
 */

/**
 * Interface for module activation event data
 *
 * This interface will be used in future implementations to:
 * 1. Provide strong typing for module activation events
 * 2. Track module activation timing for performance metrics
 * 3. Implement cooldown periods between activations
 * 4. Trigger power-up sequences and animations
 * 5. Coordinate activation of dependent modules
 *
 * The timestamp property allows for precise tracking of when modules
 * are activated, which will be essential for the upcoming module
 * synchronization system where timing between module activations
 * can create synergy effects.
 */

/**
 * Interface for module deactivation event data
 *
 * This interface will be used in future implementations to:
 * 1. Provide strong typing for module deactivation events
 * 2. Track reasons for deactivation (user action, damage, power loss, etc.)
 * 3. Implement graceful shutdown procedures for critical modules
 * 4. Trigger emergency backup systems when key modules go offline
 * 5. Log deactivation patterns for system diagnostics
 *
 * The reason property allows for categorizing different types of deactivations,
 * which will be important for the upcoming module reliability system where
 * frequent unexpected deactivations can lead to permanent damage.
 */

/**
 * Sub-module attachment result
 */
export interface SubModuleAttachmentResult {
  success: boolean;
  subModuleId?: string;
  parentModuleId?: string;
  error?: string;
}

/**
 * Sub-module effect application result
 */
export interface EffectApplicationResult {
  success: boolean;
  effectType: string;
  target: string;
  value: number;
  error?: string;
}

/**
 * Events emitted by the SubModuleManager
 */
export enum SubModuleManagerEventType {
  SUBMODULE_CREATED = 'SUBMODULE_CREATED',
  SUBMODULE_ATTACHED = 'SUBMODULE_ATTACHED',
  SUBMODULE_DETACHED = 'SUBMODULE_DETACHED',
  SUBMODULE_ACTIVATED = 'SUBMODULE_ACTIVATED',
  SUBMODULE_DEACTIVATED = 'SUBMODULE_DEACTIVATED',
  SUBMODULE_UPGRADED = 'SUBMODULE_UPGRADED',
}

/**
 * Event data interfaces for SubModuleManager events
 */
export interface SubModuleEventData {
  parentModuleId: string;
  parentModuleType: ModuleType;
  subModuleId: string;
  subModuleType: SubModuleType;
}

export interface SubModuleUpgradeEventData extends SubModuleEventData {
  newLevel: number;
}

/**
 * Event map for the SubModuleManager
 */
export interface SubModuleManagerEvents extends Record<string, unknown> {
  [SubModuleManagerEventType.SUBMODULE_CREATED]: SubModuleEventData;
  [SubModuleManagerEventType.SUBMODULE_ATTACHED]: SubModuleEventData;
  [SubModuleManagerEventType.SUBMODULE_DETACHED]: SubModuleEventData;
  [SubModuleManagerEventType.SUBMODULE_ACTIVATED]: SubModuleEventData;
  [SubModuleManagerEventType.SUBMODULE_DEACTIVATED]: SubModuleEventData;
  [SubModuleManagerEventType.SUBMODULE_UPGRADED]: SubModuleUpgradeEventData;
}

/**
 * SubModuleManager
 * Manages the creation, attachment, activation, and effects of sub-modules
 */
export class SubModuleManager extends TypedEventEmitter<SubModuleManagerEvents> {
  private static instance: SubModuleManager | null = null; // Add for singleton

  private subModules: Map<string, SubModule>;
  private configs: Map<SubModuleType, SubModuleConfig>;
  private effectHandlers: Map<
    string,
    (effect: SubModuleEffect, moduleId: string) => EffectApplicationResult
  >;
  private unsubscribeHandles: (() => void)[] = []; // Store unsubscribe handles

  private constructor() {
    // Make private for singleton
    super(); // Add super call
    this.subModules = new Map();
    this.configs = new Map();
    this.effectHandlers = new Map();

    // Register default effect handlers
    this.registerDefaultEffectHandlers();

    // Subscribe to module events
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe('MODULE_UPGRADED' as ModuleEventType, this.handleModuleUpgraded)
    );
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe('MODULE_ACTIVATED' as ModuleEventType, this.handleModuleActivated)
    );
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe(
        'MODULE_DEACTIVATED' as ModuleEventType,
        this.handleModuleDeactivated
      )
    );
  }

  /**
   * Register default effect handlers
   */
  private registerDefaultEffectHandlers(): void {
    // Stat boost effect handler
    this.registerEffectHandler('stat_boost', (effect, moduleId) => {
      const module = moduleManager.getModule(moduleId);
      if (!module) {
        return {
          success: false,
          effectType: effect.type,
          target: effect.target,
          value: effect.value,
          error: `Module ${moduleId} not found`,
        };
      }

      // Apply stat boost (this would be implemented in the actual module)
      console.warn(
        `[SubModuleManager] Applied stat boost to ${moduleId}: ${effect.target} ${effect.isPercentage ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`
      );

      return {
        success: true,
        effectType: effect.type,
        target: effect.target,
        value: effect.value,
      };
    });

    // Resource boost effect handler
    this.registerEffectHandler('resource_boost', (effect, moduleId) => {
      const module = moduleManager.getModule(moduleId);
      if (!module) {
        return {
          success: false,
          effectType: effect.type,
          target: effect.target,
          value: effect.value,
          error: `Module ${moduleId} not found`,
        };
      }

      // Apply resource boost
      console.warn(
        `[SubModuleManager] Applied resource boost to ${moduleId}: ${effect.target} ${effect.isPercentage ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`
      );

      return {
        success: true,
        effectType: effect.type,
        target: effect.target,
        value: effect.value,
      };
    });

    // Unlock ability effect handler
    this.registerEffectHandler('unlock_ability', (effect, moduleId) => {
      const module = moduleManager.getModule(moduleId);
      if (!module) {
        return {
          success: false,
          effectType: effect.type,
          target: effect.target,
          value: effect.value,
          error: `Module ${moduleId} not found`,
        };
      }

      // Unlock ability
      console.warn(`[SubModuleManager] Unlocked ability for ${moduleId}: ${effect.target}`);

      return {
        success: true,
        effectType: effect.type,
        target: effect.target,
        value: effect.value,
      };
    });

    // Reduce cost effect handler
    this.registerEffectHandler('reduce_cost', (effect, moduleId) => {
      const module = moduleManager.getModule(moduleId);
      if (!module) {
        return {
          success: false,
          effectType: effect.type,
          target: effect.target,
          value: effect.value,
          error: `Module ${moduleId} not found`,
        };
      }

      // Reduce cost
      console.warn(
        `[SubModuleManager] Applied cost reduction to ${moduleId}: ${effect.target} ${effect.isPercentage ? '-' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`
      );

      return {
        success: true,
        effectType: effect.type,
        target: effect.target,
        value: effect.value,
      };
    });

    // Automation effect handler
    this.registerEffectHandler('automation', (effect, moduleId) => {
      const module = moduleManager.getModule(moduleId);
      if (!module) {
        return {
          success: false,
          effectType: effect.type,
          target: effect.target,
          value: effect.value,
          error: `Module ${moduleId} not found`,
        };
      }

      // Apply automation
      console.warn(`[SubModuleManager] Applied automation to ${moduleId}: ${effect.target}`);

      return {
        success: true,
        effectType: effect.type,
        target: effect.target,
        value: effect.value,
      };
    });

    // Special effect handler
    this.registerEffectHandler('special', (effect, moduleId) => {
      const module = moduleManager.getModule(moduleId);
      if (!module) {
        return {
          success: false,
          effectType: effect.type,
          target: effect.target,
          value: effect.value,
          error: `Module ${moduleId} not found`,
        };
      }

      // Apply special effect
      console.warn(`[SubModuleManager] Applied special effect to ${moduleId}: ${effect.target}`);

      return {
        success: true,
        effectType: effect.type,
        target: effect.target,
        value: effect.value,
      };
    });
  }

  /**
   * Register a sub-module configuration
   */
  public registerSubModuleConfig(config: SubModuleConfig): void {
    this.configs.set(config.type, config);
  }

  /**
   * Register a custom effect handler
   */
  public registerEffectHandler(
    effectType: string,
    handler: (effect: SubModuleEffect, moduleId: string) => EffectApplicationResult
  ): void {
    this.effectHandlers.set(effectType, handler);
  }

  /**
   * Create a new sub-module
   */
  public createSubModule(type: SubModuleType, parentModuleId: string): SubModule | null {
    const config = this.configs.get(type);
    if (!config) {
      console.error(`[SubModuleManager] No configuration found for sub-module type: ${type}`);
      return null;
    }

    const parentModule = moduleManager.getModule(parentModuleId);
    if (!parentModule) {
      console.error(`[SubModuleManager] Parent module not found: ${parentModuleId}`);
      return null;
    }

    // Check if parent module supports sub-modules
    const parentModuleConfig = (
      moduleManager as unknown as { configs: Map<ModuleType, ModuleConfig> }
    ).configs.get(parentModule.type);
    if (!parentModuleConfig || !parentModuleConfig.subModuleSupport) {
      console.error(
        `[SubModuleManager] Parent module does not support sub-modules: ${parentModuleId}`
      );
      return null;
    }

    // Check if parent module allows this sub-module type
    if (!parentModuleConfig.subModuleSupport.allowedTypes.includes(type)) {
      console.error(
        `[SubModuleManager] Sub-module type ${type} not allowed for parent module ${parentModuleId}`
      );
      return null;
    }

    // Check if parent module has reached max sub-modules
    const currentSubModules = parentModule.subModules ?? [];
    if (currentSubModules.length >= parentModuleConfig.subModuleSupport.maxSubModules) {
      console.error(
        `[SubModuleManager] Parent module ${parentModuleId} has reached max sub-modules`
      );
      return null;
    }

    // Check requirements
    if (!this.checkRequirements(config.requirements, parentModule)) {
      console.error(
        `[SubModuleManager] Requirements not met for sub-module ${type} on parent module ${parentModuleId}`
      );
      return null;
    }

    // Create the sub-module
    const subModule: SubModule = {
      id: `${type}-${Date.now()}`,
      name: config.name,
      type,
      parentModuleId,
      isActive: false,
      level: 1,
      status: 'constructing',
      progress: 0,
      effects: [...config.effects],
      requirements: config.requirements,
    };

    // Store the sub-module
    this.subModules.set(subModule.id, subModule);

    // Add the sub-module to the parent module
    if (!parentModule.subModules) {
      parentModule.subModules = [];
    }
    parentModule.subModules.push(subModule);

    // Emit creation event
    moduleEventBus.emit({
      type: 'SUB_MODULE_CREATED' as ModuleEventType,
      moduleId: parentModuleId,
      moduleType: parentModule.type,
      timestamp: Date.now(),
      data: { subModuleId: subModule.id, subModuleType: subModule.type },
    });

    return subModule;
  }

  /**
   * Check if requirements are met for a sub-module
   */
  private checkRequirements(
    requirements: SubModuleRequirements,
    parentModule: BaseModule
  ): boolean {
    // Check parent module level
    if (parentModule.level < requirements.parentModuleLevel) {
      return false;
    }

    // Check parent module type
    if (!requirements.parentModuleTypes.includes(parentModule.type)) {
      return false;
    }

    // Check resource costs
    for (const cost of requirements.resourceCosts) {
      if (resourceManager.getResourceAmount(cost.type as ResourceType) < cost.amount) {
        return false;
      }
    }

    // Check incompatibilities
    if (requirements.incompatibleWith && parentModule.subModules) {
      for (const subModule of parentModule.subModules) {
        if (requirements.incompatibleWith.includes(subModule.type)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Attach a sub-module to a parent module
   */
  public attachSubModule(subModuleId: string, parentModuleId: string): SubModuleAttachmentResult {
    const subModule = this.subModules.get(subModuleId);
    if (!subModule) {
      return {
        success: false,
        error: `Sub-module ${subModuleId} not found`,
      };
    }

    const parentModule = moduleManager.getModule(parentModuleId);
    if (!parentModule) {
      return {
        success: false,
        error: `Parent module ${parentModuleId} not found`,
      };
    }

    // Check if parent module supports sub-modules
    const parentModuleConfig = (
      moduleManager as unknown as { configs: Map<ModuleType, ModuleConfig> }
    ).configs.get(parentModule.type);
    if (!parentModuleConfig || !parentModuleConfig.subModuleSupport) {
      return {
        success: false,
        error: `Parent module does not support sub-modules: ${parentModuleId}`,
      };
    }

    // Check if parent module allows this sub-module type
    if (!parentModuleConfig.subModuleSupport.allowedTypes.includes(subModule.type)) {
      return {
        success: false,
        error: `Sub-module type ${subModule.type} not allowed for parent module ${parentModuleId}`,
      };
    }

    // Check if parent module has reached max sub-modules
    const currentSubModules = parentModule.subModules ?? [];
    if (currentSubModules.length >= parentModuleConfig.subModuleSupport.maxSubModules) {
      return {
        success: false,
        error: `Parent module ${parentModuleId} has reached max sub-modules`,
      };
    }

    // Update sub-module parent
    subModule.parentModuleId = parentModuleId;

    // Add the sub-module to the parent module
    if (!parentModule.subModules) {
      parentModule.subModules = [];
    }
    parentModule.subModules.push(subModule);

    // Emit attachment event
    moduleEventBus.emit({
      type: 'SUB_MODULE_ATTACHED' as ModuleEventType,
      moduleId: parentModuleId,
      moduleType: parentModule.type,
      timestamp: Date.now(),
      data: { subModuleId, subModuleType: subModule.type },
    });

    return {
      success: true,
      subModuleId,
      parentModuleId,
    };
  }

  /**
   * Detach a sub-module from its parent module
   */
  public detachSubModule(subModuleId: string): SubModuleAttachmentResult {
    const subModule = this.subModules.get(subModuleId);
    if (!subModule) {
      return {
        success: false,
        error: `Sub-module ${subModuleId} not found`,
      };
    }

    const { parentModuleId } = subModule;
    const parentModule = moduleManager.getModule(parentModuleId);
    if (!parentModule) {
      return {
        success: false,
        error: `Parent module ${parentModuleId} not found`,
      };
    }

    // Remove the sub-module from the parent module
    if (parentModule.subModules) {
      parentModule.subModules = parentModule.subModules.filter(sm => sm.id !== subModuleId);
    }

    // Emit detachment event
    moduleEventBus.emit({
      type: 'SUB_MODULE_DETACHED' as ModuleEventType,
      moduleId: parentModuleId,
      moduleType: parentModule.type,
      timestamp: Date.now(),
      data: { subModuleId, subModuleType: subModule.type },
    });

    return {
      success: true,
      subModuleId,
      parentModuleId,
    };
  }

  /**
   * Activate a sub-module
   */
  public activateSubModule(subModuleId: string): boolean {
    const subModule = this.subModules.get(subModuleId);
    if (!subModule) {
      console.error(`[SubModuleManager] Sub-module ${subModuleId} not found`);
      return false;
    }

    // Check if parent module is active
    const parentModule = moduleManager.getModule(subModule.parentModuleId);
    if (!parentModule || !parentModule.isActive) {
      console.error(`[SubModuleManager] Parent module ${subModule.parentModuleId} is not active`);
      return false;
    }

    // Check if sub-module is already active
    if (subModule.isActive) {
      return true;
    }

    // Activate the sub-module
    subModule.isActive = true;
    subModule.status = 'active';

    // Apply effects
    this.applySubModuleEffects(subModule);

    // Emit activation event
    moduleEventBus.emit({
      type: 'SUB_MODULE_ACTIVATED' as ModuleEventType,
      moduleId: subModule.parentModuleId,
      moduleType: parentModule.type,
      timestamp: Date.now(),
      data: { subModuleId, subModuleType: subModule.type },
    });

    return true;
  }

  /**
   * Deactivate a sub-module
   */
  public deactivateSubModule(subModuleId: string): boolean {
    const subModule = this.subModules.get(subModuleId);
    if (!subModule) {
      console.error(`[SubModuleManager] Sub-module ${subModuleId} not found`);
      return false;
    }

    // Check if sub-module is already inactive
    if (!subModule.isActive) {
      return true;
    }

    // Deactivate the sub-module
    subModule.isActive = false;
    subModule.status = 'inactive';

    // Remove effects
    this.removeSubModuleEffects(subModule);

    // Emit deactivation event
    moduleEventBus.emit({
      type: 'SUB_MODULE_DEACTIVATED' as ModuleEventType,
      moduleId: subModule.parentModuleId,
      moduleType: moduleManager.getModule(subModule.parentModuleId)?.type as ModuleType,
      timestamp: Date.now(),
      data: { subModuleId, subModuleType: subModule.type },
    });

    return true;
  }

  /**
   * Apply sub-module effects
   */
  private applySubModuleEffects(subModule: SubModule): EffectApplicationResult[] {
    const results: EffectApplicationResult[] = [];

    for (const effect of subModule.effects) {
      const handler = this.effectHandlers.get(effect.type);
      if (handler) {
        const result = handler(effect, subModule.parentModuleId);
        results.push(result);
      } else {
        results.push({
          success: false,
          effectType: effect.type,
          target: effect.target,
          value: effect.value,
          error: `No handler found for effect type: ${effect.type}`,
        });
      }
    }

    return results;
  }

  /**
   * Remove sub-module effects
   */
  private removeSubModuleEffects(subModule: SubModule): void {
    // This would be implemented to reverse the effects
    // For now, we'll just log the removal
    console.warn(`[SubModuleManager] Removed effects for sub-module ${subModule.id}`);
  }

  /**
   * Upgrade a sub-module
   */
  public upgradeSubModule(subModuleId: string): boolean {
    const subModule = this.subModules.get(subModuleId);
    if (!subModule) {
      console.error(`[SubModuleManager] Sub-module ${subModuleId} not found`);
      return false;
    }

    // Check if sub-module is active
    if (!subModule.isActive) {
      console.error(`[SubModuleManager] Sub-module ${subModuleId} is not active`);
      return false;
    }

    // Get the config
    const config = this.configs.get(subModule.type);
    if (!config) {
      console.error(
        `[SubModuleManager] No configuration found for sub-module type: ${subModule.type}`
      );
      return false;
    }

    // Check resource costs (scaled by level)
    const levelMultiplier = Math.pow(1.5, subModule.level);
    for (const cost of config.requirements.resourceCosts) {
      const scaledAmount = Math.ceil(cost.amount * levelMultiplier);
      if (resourceManager.getResourceAmount(cost.type as ResourceType) < scaledAmount) {
        console.error(
          `[SubModuleManager] Insufficient resources for upgrade: ${cost.type} ${scaledAmount}`
        );
        return false;
      }

      // Consume resources
      resourceManager.removeResource(cost.type as ResourceType, scaledAmount);
    }

    // Remove current effects
    this.removeSubModuleEffects(subModule);

    // Upgrade the sub-module
    subModule.level++;

    // Scale effects based on level
    for (const effect of subModule.effects) {
      if (effect.isPercentage) {
        effect.value = Math.round(effect.value * (1 + 0.1 * (subModule.level - 1)));
      } else {
        effect.value = Math.round(effect.value * (1 + 0.2 * (subModule.level - 1)));
      }
    }

    // Apply new effects
    this.applySubModuleEffects(subModule);

    // Emit upgrade event
    moduleEventBus.emit({
      type: 'SUB_MODULE_UPGRADED' as ModuleEventType,
      moduleId: subModule.parentModuleId,
      moduleType: moduleManager.getModule(subModule.parentModuleId)?.type as ModuleType,
      timestamp: Date.now(),
      data: { subModuleId, subModuleType: subModule.type, newLevel: subModule.level },
    });

    return true;
  }

  /**
   * Get a sub-module by ID
   */
  public getSubModule(subModuleId: string): SubModule | undefined {
    return this.subModules.get(subModuleId);
  }

  /**
   * Get all sub-modules for a parent module
   */
  public getSubModulesForParent(parentModuleId: string): SubModule[] {
    return Array.from(this.subModules.values()).filter(sm => sm.parentModuleId === parentModuleId);
  }

  /**
   * Get all sub-modules of a specific type
   */
  public getSubModulesByType(type: SubModuleType): SubModule[] {
    return Array.from(this.subModules.values()).filter(sm => sm.type === type);
  }

  /**
   * Get all active sub-modules
   */
  public getActiveSubModules(): SubModule[] {
    return Array.from(this.subModules.values()).filter(sm => sm.isActive);
  }

  /**
   * Handle module upgraded event
   */
  private handleModuleUpgraded = (event: ModuleEvent): void => {
    // Type guard for event data
    if (!event?.data || typeof event?.data !== 'object') {
      return;
    }

    // Safely extract moduleId with type checking
    const moduleId = typeof event?.data?.moduleId === 'string' ? event?.data?.moduleId : undefined;
    if (!moduleId) {
      return;
    }

    // Check if module has sub-modules
    const module = moduleManager.getModule(moduleId);
    if (!module || !module.subModules || module.subModules.length === 0) {
      return;
    }

    // Update sub-modules based on parent module upgrade
    for (const subModule of module.subModules) {
      if (subModule.isActive) {
        // Reapply effects with potentially new values
        this.removeSubModuleEffects(subModule);
        this.applySubModuleEffects(subModule);
      }
    }
  };

  /**
   * Handle module activated event
   */
  private handleModuleActivated = (event: ModuleEvent): void => {
    // Type guard for event data
    if (!event?.data || typeof event?.data !== 'object') {
      return;
    }

    // Safely extract moduleId with type checking
    const moduleId = typeof event?.data?.moduleId === 'string' ? event?.data?.moduleId : undefined;
    if (!moduleId) {
      return;
    }

    // Check if module has sub-modules
    const module = moduleManager.getModule(moduleId);
    if (!module || !module.subModules || module.subModules.length === 0) {
      return;
    }

    // Activate sub-modules that should be active
    for (const subModule of module.subModules) {
      if (subModule.status === 'active' && !subModule.isActive) {
        this.activateSubModule(subModule.id);
      }
    }
  };

  /**
   * Handle module deactivated event
   */
  private handleModuleDeactivated = (event: ModuleEvent): void => {
    // Type guard for event data
    if (!event?.data || typeof event?.data !== 'object') {
      return;
    }

    // Safely extract moduleId with type checking
    const moduleId = typeof event?.data?.moduleId === 'string' ? event?.data?.moduleId : undefined;
    if (!moduleId) {
      return;
    }

    // Check if module has sub-modules
    const module = moduleManager.getModule(moduleId);
    if (!module || !module.subModules || module.subModules.length === 0) {
      return;
    }

    // Deactivate all sub-modules
    for (const subModule of module.subModules) {
      if (subModule.isActive) {
        this.deactivateSubModule(subModule.id);
      }
    }
  };

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Unsubscribe from events
    // Note: We need to unsubscribe by subscribing again and then calling the returned function
    // This is because we don't store the unsubscribe functions when initially subscribing
    const unsubscribeUpgraded = moduleEventBus.subscribe(
      'MODULE_UPGRADED' as ModuleEventType,
      this.handleModuleUpgraded
    );
    const unsubscribeActivated = moduleEventBus.subscribe(
      'MODULE_ACTIVATED' as ModuleEventType,
      this.handleModuleActivated
    );
    const unsubscribeDeactivated = moduleEventBus.subscribe(
      'MODULE_DEACTIVATED' as ModuleEventType,
      this.handleModuleDeactivated
    );

    // Call the unsubscribe functions if they are functions
    if (typeof unsubscribeUpgraded === 'function') {
      unsubscribeUpgraded();
    }
    if (typeof unsubscribeActivated === 'function') {
      unsubscribeActivated();
    }
    if (typeof unsubscribeDeactivated === 'function') {
      unsubscribeDeactivated();
    }

    // Clear data
    this.subModules.clear();
    this.configs.clear();
    this.effectHandlers.clear();
  }

  static getInstance(): SubModuleManager {
    if (!SubModuleManager.instance) {
      SubModuleManager.instance = new SubModuleManager();
    }
    return SubModuleManager.instance;
  }
}

// Export singleton instance
export const subModuleManager = SubModuleManager.getInstance(); // Use getInstance for singleton

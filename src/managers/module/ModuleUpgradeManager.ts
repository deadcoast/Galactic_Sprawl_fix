import { TypedEventEmitter } from '../../lib/events/EventEmitter';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { ResourceManager } from '../game/ResourceManager';
import { ResourceType } from './../../types/resources/ResourceTypes';
import { moduleManager } from './ModuleManager';
import { moduleStatusManager } from './ModuleStatusManager';

// Create an instance of ResourceManager
const resourceManager = ResourceManager.getInstance();

// Define the ModuleEvent interface
interface ModuleEvent {
  type: ModuleEventType;
  moduleId: string;
  moduleType: ModuleType;
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * Upgrade path for a module
 * Defines the progression of a module through levels
 */
export interface ModuleUpgradePath {
  moduleType: ModuleType;
  levels: ModuleUpgradeLevel[];
}

/**
 * Upgrade level definition
 * Contains requirements and effects for a specific level
 */
export interface ModuleUpgradeLevel {
  level: number;
  name: string;
  description: string;
  requirements: ModuleUpgradeRequirements;
  effects: ModuleUpgradeEffect[];
  visualChanges?: ModuleVisualChange[];
}

/**
 * Requirements for upgrading a module
 */
export interface ModuleUpgradeRequirements {
  minLevel: number;
  resourceCosts: {
    type: ResourceType;
    amount: number;
  }[];
  techRequirements?: string[];
  moduleRequirements?: {
    type: ModuleType;
    level: number;
  }[];
  buildingLevel?: number;
}

/**
 * Effect of upgrading a module
 */
export interface ModuleUpgradeEffect {
  type: 'stat' | 'resource' | 'ability' | 'special';
  target: string;
  value: number;
  isPercentage: boolean;
  description: string;
}

/**
 * Visual change for a module upgrade
 */
export interface ModuleVisualChange {
  type: 'color' | 'size' | 'shape' | 'texture' | 'effect';
  description: string;
  value: string;
}

/**
 * Upgrade status for a module
 */
export interface ModuleUpgradeStatus {
  moduleId: string;
  moduleType: ModuleType;
  currentLevel: number;
  maxLevel: number;
  nextLevel?: ModuleUpgradeLevel;
  upgradeAvailable: boolean;
  requirementsMet: boolean;
  missingRequirements: string[];
  upgradeProgress?: number;
  estimatedTimeRemaining?: number;
  effects: ModuleUpgradeEffect[];
}

/**
 * Events emitted by the ModuleUpgradeManager
 */
export enum ModuleUpgradeManagerEventType {
  UPGRADE_STARTED = 'UPGRADE_STARTED',
  UPGRADE_CANCELLED = 'UPGRADE_CANCELLED',
  UPGRADE_COMPLETED = 'UPGRADE_COMPLETED',
}

/**
 * Event data interfaces for ModuleUpgradeManager events
 */
export interface UpgradeStartedEventData {
  moduleId: string;
  moduleType: ModuleType;
  currentLevel: number;
  targetLevel: number;
  duration: number;
  requirements: ModuleUpgradeRequirements;
  effects: ModuleUpgradeEffect[];
}

export interface UpgradeCancelledEventData {
  moduleId: string;
  moduleType: ModuleType;
  currentLevel: number;
  targetLevel: number;
}

export interface UpgradeCompletedEventData {
  moduleId: string;
  moduleType: ModuleType;
  oldLevel: number;
  newLevel: number;
  effects: ModuleUpgradeEffect[];
  visualChanges?: ModuleVisualChange[];
}

/**
 * Event map for the ModuleUpgradeManager
 */
export interface ModuleUpgradeManagerEvents extends Record<string, unknown> {
  [ModuleUpgradeManagerEventType.UPGRADE_STARTED]: UpgradeStartedEventData;
  [ModuleUpgradeManagerEventType.UPGRADE_CANCELLED]: UpgradeCancelledEventData;
  [ModuleUpgradeManagerEventType.UPGRADE_COMPLETED]: UpgradeCompletedEventData;
}

/**
 * Module upgrade manager
 * Manages upgrade paths, requirements, and effects for modules
 */
export class ModuleUpgradeManager extends TypedEventEmitter<ModuleUpgradeManagerEvents> {
  private static instance: ModuleUpgradeManager | null = null; // Add for singleton

  private upgradePaths: Map<ModuleType, ModuleUpgradePath>;
  private activeUpgrades: Map<
    string,
    {
      startTime: number;
      duration: number;
      targetLevel: number;
      timer: NodeJS.Timeout;
    }
  >;
  private unsubscribeHandles: (() => void)[] = []; // Store unsubscribe handles

  private constructor() {
    // Make private for singleton
    super(); // Add super call
    this.upgradePaths = new Map();
    this.activeUpgrades = new Map();

    // Subscribe to events
    this.subscribeToEvents();
  }

  /**
   * Subscribe to module events
   */
  private subscribeToEvents(): void {
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe('MODULE_CREATED' as ModuleEventType, this.handleModuleCreated)
    );
    this.unsubscribeHandles.push(
      moduleEventBus.subscribe('MODULE_UPGRADED' as ModuleEventType, this.handleModuleUpgraded)
    );
  }

  /**
   * Register an upgrade path for a module type
   */
  public registerUpgradePath(path: ModuleUpgradePath): void {
    this.upgradePaths.set(path.moduleType, path);
  }

  /**
   * Get the upgrade path for a module type
   */
  public getUpgradePath(moduleType: ModuleType): ModuleUpgradePath | undefined {
    return this.upgradePaths.get(moduleType);
  }

  /**
   * Get the upgrade level for a module
   */
  public getUpgradeLevel(moduleType: ModuleType, level: number): ModuleUpgradeLevel | undefined {
    const path = this.upgradePaths.get(moduleType);
    if (!path) {
      return undefined;
    }

    return path.levels.find(l => l.level === level);
  }

  /**
   * Get the next upgrade level for a module
   */
  public getNextUpgradeLevel(moduleId: string): ModuleUpgradeLevel | undefined {
    const module = moduleManager.getModule(moduleId);
    if (!module) {
      return undefined;
    }

    const path = this.upgradePaths.get(module.type);
    if (!path) {
      return undefined;
    }

    return path.levels.find(l => l.level === module.level + 1);
  }

  /**
   * Check if a module can be upgraded
   */
  public canUpgrade(moduleId: string): boolean {
    const module = moduleManager.getModule(moduleId);
    if (!module) {
      return false;
    }

    // Check if module is already being upgraded
    if (this.activeUpgrades.has(moduleId)) {
      return false;
    }

    // Check if module is active
    if (!module.isActive) {
      return false;
    }

    // Get next upgrade level
    const nextLevel = this.getNextUpgradeLevel(moduleId);
    if (!nextLevel) {
      return false;
    }

    // Check requirements
    return this.checkUpgradeRequirements(moduleId, nextLevel);
  }

  /**
   * Check if a module meets the requirements for an upgrade
   */
  public checkUpgradeRequirements(moduleId: string, upgradeLevel: ModuleUpgradeLevel): boolean {
    const module = moduleManager.getModule(moduleId);
    if (!module) {
      return false;
    }

    const { requirements } = upgradeLevel;

    // Check minimum level requirement
    if (module.level < requirements.minLevel) {
      return false;
    }

    // Check resource costs
    for (const cost of requirements.resourceCosts) {
      const available = resourceManager.getResourceAmount(cost.type);
      if (available < cost.amount) {
        return false;
      }
    }

    // Check tech requirements - integrated with TechTreeManager
    if (requirements.techRequirements && requirements.techRequirements.length > 0) {
      const techRequirementsMet = this.checkTechRequirements(requirements.techRequirements);
      if (!techRequirementsMet) {
        return false;
      }
    }

    // Check module requirements
    if (requirements.moduleRequirements) {
      for (const req of requirements.moduleRequirements) {
        const modules = moduleManager.getModulesByType(req.type);
        const hasRequiredModule = modules.some(m => m.level >= req.level);
        if (!hasRequiredModule) {
          return false;
        }
      }
    }

    // Check building level
    if (requirements.buildingLevel) {
      // Find the building this module is attached to
      let attachedBuilding = undefined;
      for (const building of moduleManager.getBuildings()) {
        if (building.modules.some(m => m.id === moduleId)) {
          attachedBuilding = building;
          break;
        }
      }

      if (!attachedBuilding || attachedBuilding.level < requirements.buildingLevel) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get missing requirements for a module upgrade
   */
  public getMissingRequirements(moduleId: string): string[] {
    const module = moduleManager.getModule(moduleId);
    if (!module) {
      return ['Module not found'];
    }

    const nextLevel = this.getNextUpgradeLevel(moduleId);
    if (!nextLevel) {
      return ['No upgrade available'];
    }

    const { requirements } = nextLevel;
    const missingRequirements: string[] = [];

    // Check minimum level requirement
    if (module.level < requirements.minLevel) {
      missingRequirements.push(
        `Module level ${module.level} is below required level ${requirements.minLevel}`
      );
    }

    // Check resource costs
    for (const cost of requirements.resourceCosts) {
      const available = resourceManager.getResourceAmount(cost.type);
      if (available < cost.amount) {
        missingRequirements.push(`Insufficient ${cost.type}: ${available}/${cost.amount}`);
      }
    }

    // Check tech requirements - integrated with TechTreeManager
    if (requirements.techRequirements && requirements.techRequirements.length > 0) {
      const missingTech = this.getMissingTechRequirements(requirements.techRequirements);
      missingRequirements.push(...missingTech);
    }

    // Check module requirements
    if (requirements.moduleRequirements) {
      for (const req of requirements.moduleRequirements) {
        const modules = moduleManager.getModulesByType(req.type);
        const hasRequiredModule = modules.some(m => m.level >= req.level);
        if (!hasRequiredModule) {
          missingRequirements.push(`Requires ${req.type} module at level ${req.level}`);
        }
      }
    }

    // Check building level
    if (requirements.buildingLevel) {
      // Find the building this module is attached to
      let attachedBuilding = undefined;
      for (const building of moduleManager.getBuildings()) {
        if (building.modules.some(m => m.id === moduleId)) {
          attachedBuilding = building;
          break;
        }
      }

      if (!attachedBuilding) {
        missingRequirements.push(`Module not attached to a building`);
      } else if (attachedBuilding.level < requirements.buildingLevel) {
        missingRequirements.push(
          `Building level ${attachedBuilding.level} is below required level ${requirements.buildingLevel}`
        );
      }
    }

    return missingRequirements;
  }

  /**
   * Get upgrade status for a module
   */
  public getUpgradeStatus(moduleId: string): ModuleUpgradeStatus | undefined {
    const module = moduleManager.getModule(moduleId);
    if (!module) {
      return undefined;
    }

    const path = this.upgradePaths.get(module.type);
    if (!path) {
      return undefined;
    }

    const nextLevel = this.getNextUpgradeLevel(moduleId);
    const maxLevel =
      path.levels.length > 0 ? path.levels[path.levels.length - 1].level : module.level;

    // Get active upgrade info
    const activeUpgrade = this.activeUpgrades.get(moduleId);
    let upgradeProgress: number | undefined;
    let estimatedTimeRemaining: number | undefined;

    if (activeUpgrade) {
      const elapsed = Date.now() - activeUpgrade.startTime;
      upgradeProgress = Math.min(1, elapsed / activeUpgrade.duration);
      estimatedTimeRemaining = Math.max(0, activeUpgrade.duration - elapsed);
    }

    // Get upgrade effects
    const effects: ModuleUpgradeEffect[] = [];
    if (nextLevel) {
      effects.push(...nextLevel.effects);
    }

    // Check requirements
    const requirementsMet = nextLevel ? this.checkUpgradeRequirements(moduleId, nextLevel) : false;
    const missingRequirements = nextLevel
      ? this.getMissingRequirements(moduleId)
      : ['No upgrade available'];

    return {
      moduleId,
      moduleType: module.type,
      currentLevel: module.level,
      maxLevel,
      nextLevel,
      upgradeAvailable: !!nextLevel && module.level < maxLevel,
      requirementsMet,
      missingRequirements,
      upgradeProgress,
      estimatedTimeRemaining,
      effects,
    };
  }

  /**
   * Start upgrading a module
   */
  public startUpgrade(moduleId: string): boolean {
    // Check if module can be upgraded
    if (!this.canUpgrade(moduleId)) {
      return false;
    }

    const module = moduleManager.getModule(moduleId);
    if (!module) {
      return false;
    }

    const nextLevel = this.getNextUpgradeLevel(moduleId);
    if (!nextLevel) {
      return false;
    }

    // Consume resources
    for (const cost of nextLevel.requirements.resourceCosts) {
      resourceManager.removeResource(cost.type, cost.amount);
    }

    // Calculate upgrade time (1 minute per level)
    const baseUpgradeTime = 60000; // 1 minute
    const upgradeTime = baseUpgradeTime * nextLevel.level;

    // Update module status
    moduleStatusManager.updateModuleStatus(
      moduleId,
      'upgrading',
      `Upgrading to level ${nextLevel.level}`
    );

    // Start upgrade timer
    const timer = setTimeout(() => {
      this.completeUpgrade(moduleId, nextLevel.level);
    }, upgradeTime);

    // Store upgrade info
    this.activeUpgrades.set(moduleId, {
      startTime: Date.now(),
      duration: upgradeTime,
      targetLevel: nextLevel.level,
      timer,
    });

    // Emit upgrade started event using this.emit
    this.emit(ModuleUpgradeManagerEventType.UPGRADE_STARTED, {
      moduleId,
      moduleType: module.type,
      currentLevel: module.level,
      targetLevel: nextLevel.level,
      duration: upgradeTime,
      requirements: nextLevel.requirements,
      effects: nextLevel.effects,
    });

    return true;
  }

  /**
   * Cancel an active module upgrade
   */
  public cancelUpgrade(moduleId: string): boolean {
    const activeUpgrade = this.activeUpgrades.get(moduleId);
    if (!activeUpgrade) {
      return false;
    }

    // Clear timer
    clearTimeout(activeUpgrade.timer);

    // Remove from active upgrades
    this.activeUpgrades.delete(moduleId);

    // Update module status
    moduleStatusManager.updateModuleStatus(moduleId, 'active', 'Upgrade cancelled');

    // Emit upgrade cancelled event using this.emit
    const module = moduleManager.getModule(moduleId);
    if (module) {
      this.emit(ModuleUpgradeManagerEventType.UPGRADE_CANCELLED, {
        moduleId,
        moduleType: module.type,
        currentLevel: module.level,
        targetLevel: activeUpgrade.targetLevel,
      });
    }

    return true;
  }

  /**
   * Complete a module upgrade
   */
  private completeUpgrade(moduleId: string, targetLevel: number): void {
    const activeUpgrade = this.activeUpgrades.get(moduleId);
    if (!activeUpgrade) {
      return;
    }

    // Remove from active upgrades
    this.activeUpgrades.delete(moduleId);

    // Get module
    const module = moduleManager.getModule(moduleId);
    if (!module) {
      return;
    }

    // Get upgrade level
    const upgradeLevel = this.getUpgradeLevel(module.type, targetLevel);
    if (!upgradeLevel) {
      return;
    }

    // Update module level
    const oldLevel = module.level;
    module.level = targetLevel;

    // Update module status
    moduleStatusManager.updateModuleStatus(moduleId, 'active', `Upgraded to level ${targetLevel}`);

    // Apply upgrade effects
    this.applyUpgradeEffects(moduleId, upgradeLevel);

    // Emit upgrade completed event using this.emit
    this.emit(ModuleUpgradeManagerEventType.UPGRADE_COMPLETED, {
      moduleId,
      moduleType: module.type,
      oldLevel,
      newLevel: targetLevel,
      effects: upgradeLevel.effects,
      visualChanges: upgradeLevel.visualChanges,
    });
  }

  /**
   * Apply upgrade effects to a module
   */
  private applyUpgradeEffects(moduleId: string, upgradeLevel: ModuleUpgradeLevel): void {
    // This would apply the effects of the upgrade to the module
    // For now, we'll just log the effects
    console.warn(
      `[ModuleUpgradeManager] Applying effects to module ${moduleId}:`,
      upgradeLevel.effects
    );

    // In a real implementation, this would modify the module's stats, abilities, etc.
    // based on the effects defined in the upgrade level
  }

  /**
   * Handle module created event
   */
  private handleModuleCreated = (_event: ModuleEvent): void => {
    // Nothing to do here for now
  };

  /**
   * Handle module upgraded event
   */
  private handleModuleUpgraded = (_event: ModuleEvent): void => {
    // Nothing to do here for now
  };

  /**
   * Check if all tech requirements are met
   * Integrates with TechTreeManager to validate technology prerequisites
   * @param techIds Array of technology IDs that must be unlocked
   * @returns True if all tech requirements are met, false otherwise
   */
  private checkTechRequirements(techIds: string[]): boolean {
    try {
      // Use require to avoid circular dependencies at runtime
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TechTreeManager } = require('../../managers/game/techTreeManager');
      const techTree = TechTreeManager.getInstance();

      for (const techId of techIds) {
        if (!techTree.isUnlocked(techId)) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.warn('[ModuleUpgradeManager] TechTreeManager not available for requirement checking:', error);
      // Fail open for backward compatibility - if tech tree unavailable, assume requirements met
      return true;
    }
  }

  /**
   * Get list of missing tech requirements
   * Integrates with TechTreeManager to identify which technologies are not yet unlocked
   * @param techIds Array of technology IDs to check
   * @returns Array of human-readable strings describing missing tech requirements
   */
  private getMissingTechRequirements(techIds: string[]): string[] {
    const missing: string[] = [];

    try {
      // Use require to avoid circular dependencies at runtime
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TechTreeManager } = require('../../managers/game/techTreeManager');
      const techTree = TechTreeManager.getInstance();

      for (const techId of techIds) {
        if (!techTree.isUnlocked(techId)) {
          // Try to get tech node info for better error message
          const techNode = techTree.getNode(techId);
          if (techNode) {
            missing.push(`Requires technology: ${techNode.name}`);
          } else {
            missing.push(`Requires technology: ${techId}`);
          }
        }
      }
    } catch (error) {
      console.warn('[ModuleUpgradeManager] TechTreeManager not available for missing requirement check:', error);
      // If tech tree unavailable, report all as potentially missing for transparency
      for (const techId of techIds) {
        missing.push(`Technology requirement (unverified): ${techId}`);
      }
    }

    return missing;
  }

  /**
   * Clean up resources - Replace with dispose
   */
  public dispose(): void {
    // Clear all active upgrade timers
    for (const [moduleId, upgrade] of Array.from(this.activeUpgrades.entries())) {
      clearTimeout(upgrade.timer);
      // Optionally update status if needed
      // moduleStatusManager.updateModuleStatus(moduleId, 'active', 'Upgrade cancelled due to dispose');
    }
    this.activeUpgrades.clear();

    // Unsubscribe from all stored handles
    this.unsubscribeHandles.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.unsubscribeHandles = [];

    // TypedEventEmitter handles its own listener cleanup
    this.removeAllListeners();

    console.warn('[ModuleUpgradeManager] Disposed and cleaned up subscriptions/timers.');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ModuleUpgradeManager {
    if (!ModuleUpgradeManager.instance) {
      ModuleUpgradeManager.instance = new ModuleUpgradeManager();
    }
    return ModuleUpgradeManager.instance;
  }
}

// Export singleton instance
export const moduleUpgradeManager = ModuleUpgradeManager.getInstance(); // Use getInstance for singleton

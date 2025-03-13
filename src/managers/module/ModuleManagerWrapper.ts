/**
 * @file ModuleManagerWrapper.ts
 * Wrapper for ModuleManager that implements IModuleManager interface.
 * This provides type-safe access to the ModuleManager functionality
 * while ensuring compatibility with the new type system.
 */

import { EventBus } from '../../lib/events/EventBus';
import { BaseModule, ModularBuilding, ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent } from '../../types/events/EventTypes';
import {
  IModuleManager,
  LegacyModuleAction,
  Module,
  ModuleStatus,
} from '../../types/modules/ModuleTypes';
import { ModuleManager, moduleManager } from './ModuleManager';

/**
 * Convert a BaseModule to the Module interface
 * This function safely maps properties from the legacy BaseModule type
 * to the new Module interface.
 *
 * @param baseModule The legacy module object
 * @returns A properly typed Module object
 */
export function convertToModule(baseModule: BaseModule | undefined): Module | undefined {
  if (!baseModule) return undefined;

  // Extract optional properties with type safety
  // Some properties exist in the runtime but not in the type definition
  const buildingId = (baseModule as unknown).buildingId;
  const attachmentPointId = (baseModule as unknown).attachmentPointId;

  // Convert status from string to ModuleStatus enum if needed
  const status: ModuleStatus | 'active' | 'constructing' | 'inactive' = baseModule.status;

  return {
    id: baseModule.id,
    name: baseModule.name,
    type: baseModule.type,
    status,
    buildingId: buildingId, // May be undefined
    attachmentPointId: attachmentPointId, // May be undefined
    position: baseModule.position,
    isActive: baseModule.isActive || false,
    level: baseModule.level || 1,
    progress: baseModule.progress,
    subModules: baseModule.subModules as Array<unknown>,
    parentModuleId: baseModule.parentModuleId,
  };
}

/**
 * Convert an array of BaseModule objects to Module interface
 *
 * @param baseModules Array of legacy module objects
 * @returns Array of properly typed Module objects
 */
export function convertToModules(baseModules: BaseModule[]): Module[] {
  return baseModules.map(baseModule => convertToModule(baseModule)!).filter(Boolean);
}

/**
 * Wrapper for the ModuleManager that implements the IModuleManager interface.
 * This provides a bridge between the existing ModuleManager implementation
 * and the new type-safe IModuleManager interface used by ModuleContext.
 */
export class ModuleManagerWrapper implements IModuleManager {
  private manager: ModuleManager;

  constructor(manager: ModuleManager = moduleManager) {
    this.manager = manager;
  }

  // Implement IModuleManager methods

  /**
   * Get all modules
   */
  getModules(): Module[] {
    // Convert internal modules to Module type
    const internalModules = this.manager.getActiveModules() || [];
    return convertToModules(internalModules);
  }

  /**
   * Get module by ID
   */
  getModule(id: string): Module | undefined {
    const module = this.manager.getModule?.(id);
    return convertToModule(module);
  }

  /**
   * Get modules by type
   */
  getModulesByType(type: ModuleType): Module[] {
    const modules = this.manager.getModulesByType(type) || [];
    return convertToModules(modules);
  }

  /**
   * Get active modules
   */
  getActiveModules(): Module[] {
    const modules = this.manager.getActiveModules() || [];
    return convertToModules(modules);
  }

  /**
   * Get all buildings
   */
  getBuildings(): ModularBuilding[] {
    // Implementation depends on ModuleManager's methods
    // This is a compatibility layer
    return this.manager.getBuildings?.() || [];
  }

  /**
   * Get module categories
   */
  getModuleCategories(): string[] {
    // Since getModuleCategories doesn't exist on ModuleManager, provide default categories
    return ['production', 'utility', 'research', 'defense'];
  }

  /**
   * Get modules by building ID
   */
  getModulesByBuildingId(buildingId: string): Module[] {
    // Implementation depends on ModuleManager's methods
    // As a fallback, filter all modules by buildingId
    const modules = this.getModules();
    return modules.filter(module => module.buildingId === buildingId);
  }

  /**
   * Activate a module
   */
  activateModule(moduleId: string): void {
    if (this.manager.setModuleActive) {
      this.manager.setModuleActive(moduleId, true);
    }
  }

  /**
   * Deactivate a module
   */
  deactivateModule(moduleId: string): void {
    if (this.manager.setModuleActive) {
      this.manager.setModuleActive(moduleId, false);
    }
  }

  /**
   * Access to the event bus
   */
  get eventBus(): EventBus<BaseEvent> {
    return this.manager.eventBus;
  }

  /**
   * Dispatch legacy actions
   * Uses type guards instead of type assertions to safely handle different manager implementations
   */
  dispatch(action: LegacyModuleAction | { type: string }): void {
    // Check if manager has the needed dispatch methods using type guard
    if (this.hasDispatchAction(this.manager)) {
      this.manager.dispatchAction(action);
    } else if (this.hasDispatch(this.manager)) {
      this.manager.dispatch(action);
    } else {
      console.warn('ModuleManager does not support dispatch method:', action);
    }
  }

  /**
   * Type guard to check if manager has dispatchAction method
   */
  private hasDispatchAction(
    manager: unknown
  ): manager is { dispatchAction: (action: unknown) => void } {
    return manager && typeof manager.dispatchAction === 'function';
  }

  /**
   * Type guard to check if manager has dispatch method
   */
  private hasDispatch(manager: unknown): manager is { dispatch: (action: unknown) => void } {
    return manager && typeof manager.dispatch === 'function';
  }
}

// Export singleton instance
export const moduleManagerWrapper = new ModuleManagerWrapper(moduleManager);

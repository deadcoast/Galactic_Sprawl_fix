/**
 * @file ModuleManagerWrapper.ts
 * Wrapper for ModuleManager that implements IModuleManager interface.
 * This provides type-safe access to the ModuleManager functionality
 * while ensuring compatibility with the new type system.
 */

import { EventBus } from '../../lib/events/EventBus';
import { ModularBuilding, ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent } from '../../types/events/EventTypes';
import { IModuleManager, LegacyModuleAction, Module } from '../../types/modules/ModuleTypes';
import { ModuleManager, moduleManager } from './ModuleManager';

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
    return internalModules.map(module => module as unknown as Module);
  }

  /**
   * Get module by ID
   */
  getModule(id: string): Module | undefined {
    const module = this.manager.getModule?.(id);
    return module as unknown as Module | undefined;
  }

  /**
   * Get modules by type
   */
  getModulesByType(type: ModuleType): Module[] {
    const modules = this.manager.getModulesByType(type) || [];
    return modules.map(module => module as unknown as Module);
  }

  /**
   * Get active modules
   */
  getActiveModules(): Module[] {
    const modules = this.manager.getActiveModules() || [];
    return modules.map(module => module as unknown as Module);
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
   */
  dispatch(action: LegacyModuleAction | { type: string }): void {
    // Implementation depends on how the original ModuleManager handles dispatch
    // This is a compatibility wrapper
    if ('dispatchAction' in this.manager) {
      (this.manager as unknown as { dispatchAction: (action: unknown) => void }).dispatchAction(
        action
      );
    } else if ('dispatch' in this.manager) {
      (this.manager as unknown as { dispatch: (action: unknown) => void }).dispatch(action);
    } else {
      console.warn('ModuleManager does not support dispatch method:', action);
    }
  }
}

// Export singleton instance
export const moduleManagerWrapper = new ModuleManagerWrapper(moduleManager);

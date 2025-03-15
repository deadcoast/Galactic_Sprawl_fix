/**
 * ModuleEvents.ts
 *
 * This file defines the events related to modules.
 * These events are used by module managers and related components.
 */

import { ModuleType } from '../buildings/ModuleTypes';
import { ResourceType } from '../resources/ResourceTypes';

/**
 * Base module event interface
 */
export interface ModuleEvent {
  moduleId: string;
  moduleType: ModuleType;
  timestamp?: number;
}

/**
 * Module state event interface
 */
export interface ModuleStateEvent extends ModuleEvent {
  state: 'active' | 'inactive' | 'error' | 'maintenance';
  previousState?: 'active' | 'inactive' | 'error' | 'maintenance';
}

/**
 * Module resource event interface
 */
export interface ModuleResourceEvent extends ModuleEvent {
  resourceType: ResourceType;
  amount: number;
}

/**
 * Module upgrade event interface
 */
export interface ModuleUpgradeEvent extends ModuleEvent {
  level: number;
  previousLevel: number;
  upgradeCost: Record<ResourceType, number>;
}

/**
 * Module attachment event interface
 */
export interface ModuleAttachmentEvent extends ModuleEvent {
  parentModuleId: string;
  parentModuleType: ModuleType;
}

/**
 * Module damage event interface
 */
export interface ModuleDamageEvent extends ModuleEvent {
  damageAmount: number;
  currentHealth: number;
  maxHealth: number;
  damageSource?: string;
}

/**
 * Module repair event interface
 */
export interface ModuleRepairEvent extends ModuleEvent {
  repairAmount: number;
  currentHealth: number;
  maxHealth: number;
  repairCost?: Record<ResourceType, number>;
}

/**
 * Module efficiency event interface
 */
export interface ModuleEfficiencyEvent extends ModuleEvent {
  efficiency: number;
  previousEfficiency: number;
  factors: Record<string, number>;
}

/**
 * Interface defining all module-related events
 */
export interface ModuleEvents {
  /**
   * Emitted when a module is created
   */
  'module:created': ModuleEvent;

  /**
   * Emitted when a module is destroyed
   */
  'module:destroyed': ModuleEvent;

  /**
   * Emitted when a module's state changes
   */
  'module:state-changed': ModuleStateEvent;

  /**
   * Emitted when a module produces resources
   */
  'module:resource-produced': ModuleResourceEvent;

  /**
   * Emitted when a module consumes resources
   */
  'module:resource-consumed': ModuleResourceEvent;

  /**
   * Emitted when a module is upgraded
   */
  'module:upgraded': ModuleUpgradeEvent;

  /**
   * Emitted when a module is attached to another module
   */
  'module:attached': ModuleAttachmentEvent;

  /**
   * Emitted when a module is detached from another module
   */
  'module:detached': ModuleAttachmentEvent;

  /**
   * Emitted when a module is damaged
   */
  'module:damaged': ModuleDamageEvent;

  /**
   * Emitted when a module is repaired
   */
  'module:repaired': ModuleRepairEvent;

  /**
   * Emitted when a module's efficiency changes
   */
  'module:efficiency-changed': ModuleEfficiencyEvent;
}

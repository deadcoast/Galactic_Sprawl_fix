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
type ModuleEventMap = {
  'module:created': ModuleEvent;
  'module:destroyed': ModuleEvent;
  'module:state-changed': ModuleStateEvent;
  'module:resource-produced': ModuleResourceEvent;
  'module:resource-consumed': ModuleResourceEvent;
  'module:upgraded': ModuleUpgradeEvent;
  'module:attached': ModuleAttachmentEvent;
  'module:detached': ModuleAttachmentEvent;
  'module:damaged': ModuleDamageEvent;
  'module:repaired': ModuleRepairEvent;
  'module:efficiency-changed': ModuleEfficiencyEvent;
};

export type ModuleEvents = {
  [K in keyof ModuleEventMap]: ModuleEventMap[K];
};

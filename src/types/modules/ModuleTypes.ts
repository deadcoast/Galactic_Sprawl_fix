/**
 * @file ModuleTypes.ts
 * Consolidated module type definitions that unify and extend the building module types.
 * This file provides:
 * 1. Proper type definitions for Module structures
 * 2. Enums for module states and actions
 * 3. Integration with the event system
 */

import { EventBus } from '../../lib/events/EventBus';
import
  {
    BaseModule as BuildingBaseModule,
    ModularBuilding,
    ModuleType
  } from '../buildings/ModuleTypes';
import { Position } from '../core/GameTypes';
import { BaseEvent, EventType } from '../events/EventTypes';

/**
 * Module status enum to replace string literals
 */
export enum ModuleStatus {
  ACTIVE = 'active',
  CONSTRUCTING = 'constructing',
  INACTIVE = 'inactive',
  ERROR = 'error',
  UPGRADING = 'upgrading',
  DAMAGED = 'damaged',
}

/**
 * Extended Module interface that adds the properties needed by ModuleContext
 */
export interface Module {
  id: string;
  name: string;
  type: ModuleType;
  status: ModuleStatus | 'active' | 'constructing' | 'inactive'; // Support both enum and legacy string literals
  buildingId?: string;
  attachmentPointId?: string;
  position: Position;
  isActive: boolean;
  level: number;
  progress?: number;
  subModules?: unknown[]; // Retain compatibility with BuildingBaseModule
  parentModuleId?: string; // Retain compatibility with BuildingBaseModule
}

/**
 * ModuleEvent interface for type-safe event handling
 */
export interface ModuleEvent {
  type: string;
  moduleId: string;
  moduleType: ModuleType;
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * ModuleEventType enum for module-specific events
 * This ensures compatibility with the EventType enum
 */
export enum ModuleEventType {
  // Use the same values as EventType for direct compatibility
  MODULE_CREATED = 'MODULE_CREATED',
  MODULE_UPDATED = 'MODULE_UPDATED',
  MODULE_REMOVED = 'MODULE_REMOVED', // Special case not in EventType
  MODULE_STATUS_CHANGED = 'MODULE_STATUS_CHANGED',
  MODULE_ACTIVATED = 'MODULE_ACTIVATED',
  MODULE_DEACTIVATED = 'MODULE_DEACTIVATED',
}

/**
 * Helper function to convert ModuleEventType to EventType
 */
export function moduleEventToEventType(moduleEventType: ModuleEventType): EventType | string {
  switch (moduleEventType) {
    case ModuleEventType.MODULE_CREATED:
      return EventType.MODULE_CREATED;
    case ModuleEventType.MODULE_UPDATED:
      return EventType.MODULE_UPDATED;
    case ModuleEventType.MODULE_STATUS_CHANGED:
      return EventType.MODULE_STATUS_CHANGED;
    case ModuleEventType.MODULE_ACTIVATED:
      return EventType.MODULE_ACTIVATED;
    case ModuleEventType.MODULE_DEACTIVATED:
      return EventType.MODULE_DEACTIVATED;
    default:
      return moduleEventType.toString();
  }
}

/**
 * Legacy module action interface for compatibility with existing code
 */
export interface LegacyModuleAction {
  type: string;
  moduleId?: string;
  moduleType?: ModuleType;
  position?: { x: number; y: number };
  buildingId?: string;
  attachmentPointId?: string;
  active?: boolean;
}

/**
 * Extended ModuleManager interface to define methods used in ModuleContext
 */
export interface IModuleManager {
  // Core module operations
  getModules(): Module[];
  getModule(id: string): Module | undefined;
  getModulesByType(type: ModuleType): Module[];
  getActiveModules(): Module[];
  getBuildings(): ModularBuilding[];

  // Methods used but not defined in the original interface
  getModuleCategories?(): string[];
  getModulesByBuildingId?(buildingId: string): Module[];
  activateModule?(moduleId: string): void;
  deactivateModule?(moduleId: string): void;

  // Event system
  eventBus:
    | {
        subscribe(
          eventType: string | EventType | ModuleEventType,
          handler: (event: BaseEvent) => void
        ): () => void;
      }
    | EventBus<BaseEvent>;

  // Legacy dispatch method
  dispatch?(action: LegacyModuleAction | { type: string }): void;
}

// Export the original BaseModule for legacy compatibility
export type BaseModule = BuildingBaseModule;

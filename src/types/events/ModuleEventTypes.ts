/**
 * Module Event Types
 *
 * Types definitions for the module event system used across the application.
 * These types standardize the communication between different modules,
 * enabling consistent event handling and type safety.
 */

/**
 * Supported module types in the system
 */
export type ModuleType =
  | 'resource-manager'
  | 'game-loop-manager'
  | 'module-manager'
  | 'ship-manager'
  | 'combat-manager'
  | 'exploration-manager'
  | 'ui-manager'
  | 'automation-manager';

/**
 * Event types that can be emitted by modules
 */
export type ModuleEventType =
  | 'STATUS_CHANGED'
  | 'RESOURCE_UPDATED'
  | 'CONFIG_CHANGED'
  | 'ERROR'
  | 'PERFORMANCE_ALERT'
  | 'GAME_LOOP_STARTED'
  | 'GAME_LOOP_STOPPED'
  | 'GAME_LOOP_ADJUSTED'
  | 'GAME_LOOP_UPDATE_REGISTERED'
  | 'GAME_LOOP_UPDATE_UNREGISTERED'
  | 'GAME_LOOP_CONFIG_UPDATED';

/**
 * Base event data interface
 */
export interface BaseEventData {
  type: string;
  [key: string]: unknown;
}

/**
 * Generic module event interface
 */
export interface ModuleEvent {
  type: ModuleEventType;
  moduleId: string;
  moduleType: ModuleType;
  timestamp: number;
  data: BaseEventData;
}

/**
 * Performance-related event data
 */
export interface PerformanceEventData extends BaseEventData {
  type: 'performance_snapshot' | 'optimization_suggestions' | 'power_saving_mode';
  snapshot?: unknown;
  suggestions?: unknown;
  enabled?: boolean;
}

/**
 * Resource-related event data
 */
export interface ResourceEventData extends BaseEventData {
  type: 'resource_production' | 'resource_consumption' | 'resource_transfer';
  resourceType?: string;
  amount?: number;
  source?: string;
  target?: string;
}

/**
 * Event subscription options
 */
export interface EventSubscriptionOptions {
  topic: ModuleEventType;
  moduleId?: string;
  moduleType?: ModuleType;
  callback: (event: ModuleEvent) => void;
}

/**
 * @file EventTypes.ts
 * Defines standardized event types and interfaces for the entire system.
 *
 * This file provides:
 * 1. EventType enum for all event types (replacing string literals)
 * 2. Payload interfaces for each event type
 * 3. Type guards for runtime validation
 * 4. Event category groupings for organization
 */

import { ModuleType } from '../../types/buildings/ModuleTypes';
import { ResourceType } from '../resources/StandardizedResourceTypes';

/**
 * EventCategory enum organizes event types into logical groups
 */
export enum EventCategory {
  // Core system categories
  LIFECYCLE = 'lifecycle',
  RESOURCE = 'resource',
  ATTACHMENT = 'attachment',
  AUTOMATION = 'automation',
  STATUS = 'status',
  MISSION = 'mission',
  SUB_MODULE = 'sub-module',
  COMBAT = 'combat',
  TECH = 'tech',
  SYSTEM = 'system',
  THRESHOLD = 'threshold',
}

/**
 * EventType enum defines all possible event types in the system
 * Replaces string literal event types for type safety
 */
export enum EventType {
  // Lifecycle events
  MODULE_CREATED = 'MODULE_CREATED',
  MODULE_ATTACHED = 'MODULE_ATTACHED',
  MODULE_DETACHED = 'MODULE_DETACHED',
  MODULE_UPGRADED = 'MODULE_UPGRADED',
  MODULE_ACTIVATED = 'MODULE_ACTIVATED',
  MODULE_DEACTIVATED = 'MODULE_DEACTIVATED',
  MODULE_UPDATED = 'MODULE_UPDATED',
  MODULE_STATUS_CHANGED = 'MODULE_STATUS_CHANGED',
  MODULE_ALERT_ADDED = 'MODULE_ALERT_ADDED',
  MODULE_REMOVED = 'MODULE_REMOVED',

  // Attachment events
  ATTACHMENT_STARTED = 'ATTACHMENT_STARTED',
  ATTACHMENT_CANCELLED = 'ATTACHMENT_CANCELLED',
  ATTACHMENT_COMPLETED = 'ATTACHMENT_COMPLETED',
  ATTACHMENT_PREVIEW_SHOWN = 'ATTACHMENT_PREVIEW_SHOWN',

  // Resource events
  RESOURCE_PRODUCED = 'RESOURCE_PRODUCED',
  RESOURCE_CONSUMED = 'RESOURCE_CONSUMED',
  RESOURCE_TRANSFERRED = 'RESOURCE_TRANSFERRED',
  RESOURCE_PRODUCTION_REGISTERED = 'RESOURCE_PRODUCTION_REGISTERED',
  RESOURCE_PRODUCTION_UNREGISTERED = 'RESOURCE_PRODUCTION_UNREGISTERED',
  RESOURCE_CONSUMPTION_REGISTERED = 'RESOURCE_CONSUMPTION_REGISTERED',
  RESOURCE_CONSUMPTION_UNREGISTERED = 'RESOURCE_CONSUMPTION_UNREGISTERED',
  RESOURCE_FLOW_REGISTERED = 'RESOURCE_FLOW_REGISTERED',
  RESOURCE_FLOW_UNREGISTERED = 'RESOURCE_FLOW_UNREGISTERED',
  RESOURCE_SHORTAGE = 'RESOURCE_SHORTAGE',
  RESOURCE_UPDATED = 'RESOURCE_UPDATED',
  RESOURCE_DISCOVERED = 'RESOURCE_DISCOVERED',
  RESOURCE_FLOW_UPDATED = 'RESOURCE_FLOW_UPDATED',
  RESOURCE_NODE_ADDED = 'RESOURCE_NODE_ADDED',
  RESOURCE_NODE_REMOVED = 'RESOURCE_NODE_REMOVED',
  RESOURCE_CONNECTION_ADDED = 'RESOURCE_CONNECTION_ADDED',
  RESOURCE_CONNECTION_REMOVED = 'RESOURCE_CONNECTION_REMOVED',
  RESOURCE_FLOW_OPTIMIZATION_COMPLETED = 'RESOURCE_FLOW_OPTIMIZATION_COMPLETED',

  // Threshold events
  RESOURCE_THRESHOLD_CHANGED = 'RESOURCE_THRESHOLD_CHANGED',
  RESOURCE_THRESHOLD_TRIGGERED = 'RESOURCE_THRESHOLD_TRIGGERED',

  // Automation events
  AUTOMATION_STARTED = 'AUTOMATION_STARTED',
  AUTOMATION_STOPPED = 'AUTOMATION_STOPPED',
  AUTOMATION_CYCLE_COMPLETE = 'AUTOMATION_CYCLE_COMPLETE',

  // Status events
  STATUS_CHANGED = 'STATUS_CHANGED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',

  // Mission events
  MISSION_STARTED = 'MISSION_STARTED',
  MISSION_COMPLETED = 'MISSION_COMPLETED',
  MISSION_FAILED = 'MISSION_FAILED',
  MISSION_PROGRESS_UPDATED = 'MISSION_PROGRESS_UPDATED',
  MISSION_REWARD_CLAIMED = 'MISSION_REWARD_CLAIMED',

  // Sub-module events
  SUB_MODULE_CREATED = 'SUB_MODULE_CREATED',
  SUB_MODULE_ATTACHED = 'SUB_MODULE_ATTACHED',
  SUB_MODULE_DETACHED = 'SUB_MODULE_DETACHED',
  SUB_MODULE_UPGRADED = 'SUB_MODULE_UPGRADED',
  SUB_MODULE_ACTIVATED = 'SUB_MODULE_ACTIVATED',
  SUB_MODULE_DEACTIVATED = 'SUB_MODULE_DEACTIVATED',
  SUB_MODULE_EFFECT_APPLIED = 'SUB_MODULE_EFFECT_APPLIED',
  SUB_MODULE_EFFECT_REMOVED = 'SUB_MODULE_EFFECT_REMOVED',

  // Combat events
  COMBAT_UPDATED = 'COMBAT_UPDATED',

  // Tech events
  TECH_UNLOCKED = 'TECH_UNLOCKED',
  TECH_UPDATED = 'TECH_UPDATED',

  // System events
  REGISTRY_UPDATED = 'REGISTRY_UPDATED',
  SYSTEM_STARTUP = 'SYSTEM_STARTUP',
  SYSTEM_SHUTDOWN = 'SYSTEM_SHUTDOWN',
  SYSTEM_ALERT = 'SYSTEM_ALERT',

  // Game manager events
  GAME_STARTED = 'GAME_STARTED',
  GAME_PAUSED = 'GAME_PAUSED',
  GAME_RESUMED = 'GAME_RESUMED',
  GAME_STOPPED = 'GAME_STOPPED',
  TIME_UPDATED = 'TIME_UPDATED',
}

/**
 * Maps event types to their categories for organization and filtering
 */
export const EVENT_CATEGORY_MAP: Record<EventType, EventCategory> = {
  // Lifecycle events
  [EventType.MODULE_CREATED]: EventCategory.LIFECYCLE,
  [EventType.MODULE_ATTACHED]: EventCategory.LIFECYCLE,
  [EventType.MODULE_DETACHED]: EventCategory.LIFECYCLE,
  [EventType.MODULE_UPGRADED]: EventCategory.LIFECYCLE,
  [EventType.MODULE_ACTIVATED]: EventCategory.LIFECYCLE,
  [EventType.MODULE_DEACTIVATED]: EventCategory.LIFECYCLE,
  [EventType.MODULE_UPDATED]: EventCategory.LIFECYCLE,
  [EventType.MODULE_STATUS_CHANGED]: EventCategory.LIFECYCLE,
  [EventType.MODULE_ALERT_ADDED]: EventCategory.LIFECYCLE,
  [EventType.MODULE_REMOVED]: EventCategory.LIFECYCLE,

  // Attachment events
  [EventType.ATTACHMENT_STARTED]: EventCategory.ATTACHMENT,
  [EventType.ATTACHMENT_CANCELLED]: EventCategory.ATTACHMENT,
  [EventType.ATTACHMENT_COMPLETED]: EventCategory.ATTACHMENT,
  [EventType.ATTACHMENT_PREVIEW_SHOWN]: EventCategory.ATTACHMENT,

  // Resource events
  [EventType.RESOURCE_PRODUCED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_CONSUMED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_TRANSFERRED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_PRODUCTION_REGISTERED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_PRODUCTION_UNREGISTERED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_CONSUMPTION_REGISTERED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_CONSUMPTION_UNREGISTERED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_FLOW_REGISTERED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_FLOW_UNREGISTERED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_SHORTAGE]: EventCategory.RESOURCE,
  [EventType.RESOURCE_UPDATED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_DISCOVERED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_FLOW_UPDATED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_NODE_ADDED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_NODE_REMOVED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_CONNECTION_ADDED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_CONNECTION_REMOVED]: EventCategory.RESOURCE,
  [EventType.RESOURCE_FLOW_OPTIMIZATION_COMPLETED]: EventCategory.RESOURCE,

  // Threshold events
  [EventType.RESOURCE_THRESHOLD_CHANGED]: EventCategory.THRESHOLD,
  [EventType.RESOURCE_THRESHOLD_TRIGGERED]: EventCategory.THRESHOLD,

  // Automation events
  [EventType.AUTOMATION_STARTED]: EventCategory.AUTOMATION,
  [EventType.AUTOMATION_STOPPED]: EventCategory.AUTOMATION,
  [EventType.AUTOMATION_CYCLE_COMPLETE]: EventCategory.AUTOMATION,

  // Status events
  [EventType.STATUS_CHANGED]: EventCategory.STATUS,
  [EventType.ERROR_OCCURRED]: EventCategory.STATUS,

  // Mission events
  [EventType.MISSION_STARTED]: EventCategory.MISSION,
  [EventType.MISSION_COMPLETED]: EventCategory.MISSION,
  [EventType.MISSION_FAILED]: EventCategory.MISSION,
  [EventType.MISSION_PROGRESS_UPDATED]: EventCategory.MISSION,
  [EventType.MISSION_REWARD_CLAIMED]: EventCategory.MISSION,

  // Sub-module events
  [EventType.SUB_MODULE_CREATED]: EventCategory.SUB_MODULE,
  [EventType.SUB_MODULE_ATTACHED]: EventCategory.SUB_MODULE,
  [EventType.SUB_MODULE_DETACHED]: EventCategory.SUB_MODULE,
  [EventType.SUB_MODULE_UPGRADED]: EventCategory.SUB_MODULE,
  [EventType.SUB_MODULE_ACTIVATED]: EventCategory.SUB_MODULE,
  [EventType.SUB_MODULE_DEACTIVATED]: EventCategory.SUB_MODULE,
  [EventType.SUB_MODULE_EFFECT_APPLIED]: EventCategory.SUB_MODULE,
  [EventType.SUB_MODULE_EFFECT_REMOVED]: EventCategory.SUB_MODULE,

  // Combat events
  [EventType.COMBAT_UPDATED]: EventCategory.COMBAT,

  // Tech events
  [EventType.TECH_UNLOCKED]: EventCategory.TECH,
  [EventType.TECH_UPDATED]: EventCategory.TECH,

  // System events
  [EventType.REGISTRY_UPDATED]: EventCategory.SYSTEM,
  [EventType.SYSTEM_STARTUP]: EventCategory.SYSTEM,
  [EventType.SYSTEM_SHUTDOWN]: EventCategory.SYSTEM,
  [EventType.SYSTEM_ALERT]: EventCategory.SYSTEM,

  // Game manager events
  [EventType.GAME_STARTED]: EventCategory.SYSTEM,
  [EventType.GAME_PAUSED]: EventCategory.SYSTEM,
  [EventType.GAME_RESUMED]: EventCategory.SYSTEM,
  [EventType.GAME_STOPPED]: EventCategory.SYSTEM,
  [EventType.TIME_UPDATED]: EventCategory.SYSTEM,
};

/**
 * Base event interface that all events must implement
 */
export interface BaseEvent {
  type: EventType;
  timestamp: number;
  moduleId: string;
  moduleType: ModuleType;
  data?: Record<string, unknown>;
  [key: string]: unknown; // Add index signature for compatibility with UnifiedEventSystem.BaseEvent
}

/**
 * Resource event interfaces for strongly-typed payloads
 */

export interface ResourceProductionEventData {
  resourceType: ResourceType;
  amount: number;
  source?: string;
  target?: string;
  production?: number;
  oldAmount?: number;
  newAmount?: number;
  delta?: number;
}

export interface ResourceConsumptionEventData {
  resourceType: ResourceType;
  amount: number;
  consumer?: string;
  consumption?: number;
  oldAmount?: number;
  newAmount?: number;
  delta?: number;
}

export interface ResourceTransferEventData {
  resourceType: ResourceType;
  amount: number;
  sourceId: string;
  targetId: string;
  transferTime?: number;
}

export interface ResourceUpdateEventData {
  resourceType: ResourceType;
  amount?: number;
  production?: number;
  consumption?: number;
  rate?: number;
  max?: number;
  min?: number;
}

export interface ResourceShortageEventData {
  resourceType: ResourceType;
  requiredAmount: number;
  availableAmount: number;
  consumerId: string;
}

/**
 * Module event interfaces for strongly-typed payloads
 */

export interface ModuleCreatedEventData {
  location?: { x: number; y: number };
  createdBy?: string;
  moduleType: ModuleType;
  buildingId?: string;
}

export interface ModuleStatusEventData {
  status: string;
  previousStatus?: string;
  moduleType: ModuleType;
  timestamp: number;
}

export interface ModuleUpgradeEventData {
  moduleType: ModuleType;
  oldLevel: number;
  newLevel: number;
  upgradedBy?: string;
  cost?: Record<ResourceType, number>;
}

/**
 * Threshold event interfaces for strongly-typed payloads
 */

export interface ThresholdChangedEventData {
  resourceType: ResourceType;
  thresholdType: 'critical' | 'low' | 'normal' | 'high' | 'maximum';
  oldValue?: number;
  newValue: number;
}

export interface ThresholdTriggeredEventData {
  resourceType: ResourceType;
  resourceId: string;
  thresholdType: 'critical' | 'low' | 'normal' | 'high' | 'maximum';
  currentValue: number;
  thresholdValue: number;
  direction: 'increasing' | 'decreasing';
}

/**
 * Type guard functions to validate event data at runtime
 */

export function isResourceProductionEventData(data: unknown): data is ResourceProductionEventData {
  if (!data || typeof data !== 'object') return false;

  const castData = data as Partial<ResourceProductionEventData>;
  return 'resourceType' in castData && 'amount' in castData && typeof castData.amount === 'number';
}

export function isResourceConsumptionEventData(
  data: unknown
): data is ResourceConsumptionEventData {
  if (!data || typeof data !== 'object') return false;

  const castData = data as Partial<ResourceConsumptionEventData>;
  return 'resourceType' in castData && 'amount' in castData && typeof castData.amount === 'number';
}

export function isThresholdTriggeredEventData(data: unknown): data is ThresholdTriggeredEventData {
  if (!data || typeof data !== 'object') return false;

  const castData = data as Partial<ThresholdTriggeredEventData>;
  return (
    'resourceType' in castData &&
    'resourceId' in castData &&
    'thresholdType' in castData &&
    'currentValue' in castData &&
    'thresholdValue' in castData &&
    'direction' in castData
  );
}

/**
 * Helper to get all event types in a specific category
 */
export function getEventTypesByCategory(category: EventCategory): EventType[] {
  return Object.entries(EVENT_CATEGORY_MAP)
    .filter(([_, cat]) => cat === category)
    .map(([eventType, _]) => eventType as EventType);
}

/**
 * Legacy compatibility helpers
 */

/**
 * Convert legacy string event type to EventType enum
 */
export function stringToEventType(eventTypeString: string): EventType | undefined {
  return Object.values(EventType).find(enumValue => enumValue === eventTypeString);
}

/**
 * Check if a string is a valid EventType
 */
export function isValidEventType(eventTypeString: string): boolean {
  return stringToEventType(eventTypeString) !== undefined;
}

/**
 * Create a strongly-typed event object from potential string type and payload
 */
export function createEvent<T extends Record<string, unknown>>(
  type: EventType | string,
  moduleId: string,
  moduleType: ModuleType,
  data?: T
): BaseEvent {
  const eventType =
    typeof type === 'string' ? stringToEventType(type) || EventType.MODULE_UPDATED : type;

  return {
    type: eventType,
    moduleId,
    moduleType,
    timestamp: Date.now(),
    data,
  };
}

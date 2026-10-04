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
import { ResourceType } from './../resources/ResourceTypes';

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
  EXPLORATION = 'exploration',
  FACTION = 'faction',
  EFFECTS = 'effects',
  MINING = 'mining',
  AI = 'ai',
  OFFICER = 'officer',
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
  RESOURCE_NODE_UPDATED = 'RESOURCE_NODE_UPDATED',

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
  MISSION_REcombatD_CLAIMED = 'MISSION_REcombatD_CLAIMED',

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
  HAZARD_CREATED = 'HAZARD_CREATED',
  HAZARD_REMOVED = 'HAZARD_REMOVED',

  // Tech events
  TECH_UNLOCKED = 'TECH_UNLOCKED',
  TECH_UPDATED = 'TECH_UPDATED',

  // System events
  REGISTRY_UPDATED = 'REGISTRY_UPDATED',
  SYSTEM_STARTUP = 'SYSTEM_STARTUP',
  SYSTEM_SHUTDOWN = 'SYSTEM_SHUTDOWN',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  PARTICLE_SYSTEM_UPDATED = 'PARTICLE_SYSTEM_UPDATED',

  // Game manager events
  GAME_STARTED = 'GAME_STARTED',
  GAME_PAUSED = 'GAME_PAUSED',
  GAME_RESUMED = 'GAME_RESUMED',
  GAME_STOPPED = 'GAME_STOPPED',
  TIME_UPDATED = 'TIME_UPDATED',

  // Exploration events
  EXPLORATION_SECTOR_DISCOVERED = 'EXPLORATION_SECTOR_DISCOVERED',
  EXPLORATION_SECTOR_SCANNED = 'EXPLORATION_SECTOR_SCANNED',
  EXPLORATION_ANOMALY_DETECTED = 'EXPLORATION_ANOMALY_DETECTED',
  EXPLORATION_RESOURCE_DETECTED = 'EXPLORATION_RESOURCE_DETECTED',
  EXPLORATION_SCAN_STARTED = 'EXPLORATION_SCAN_STARTED',
  EXPLORATION_SCAN_COMPLETED = 'EXPLORATION_SCAN_COMPLETED',
  EXPLORATION_SCAN_FAILED = 'EXPLORATION_SCAN_FAILED',
  EXPLORATION_SHIP_ASSIGNED = 'EXPLORATION_SHIP_ASSIGNED',
  EXPLORATION_SHIP_UNASSIGNED = 'EXPLORATION_SHIP_UNASSIGNED',
  EXPLORATION_SHIP_REGISTERED = 'EXPLORATION_SHIP_REGISTERED',
  EXPLORATION_SHIP_UNREGISTERED = 'EXPLORATION_SHIP_UNREGISTERED',
  EXPLORATION_TASK_ASSIGNED = 'EXPLORATION_TASK_ASSIGNED',
  EXPLORATION_TASK_COMPLETED = 'EXPLORATION_TASK_COMPLETED',
  EXPLORATION_TASK_PROGRESS = 'EXPLORATION_TASK_PROGRESS',
  EXPLORATION_POSITION_UPDATED = 'EXPLORATION_POSITION_UPDATED',

  // Faction events
  FACTION_RELATIONSHIP_CHANGED = 'FACTION_RELATIONSHIP_CHANGED',
  FACTION_TREATY_STATUS_CHANGED = 'FACTION_TREATY_STATUS_CHANGED',
  FACTION_TRADE_ESTABLISHED = 'FACTION_TRADE_ESTABLISHED',
  FACTION_CONFLICT_RECORDED = 'FACTION_CONFLICT_RECORDED',

  // Asteroid Field Events (Added)
  ASTEROID_FIELD_GENERATED = 'ASTEROID_FIELD_GENERATED',
  ASTEROID_FIELD_DEPLETED = 'ASTEROID_FIELD_DEPLETED',
  ASTEROID_FIELD_RESOURCE_DISCOVERED = 'ASTEROID_FIELD_RESOURCE_DISCOVERED',
  ASTEROID_FIELD_HAZARD_CREATED = 'ASTEROID_FIELD_HAZARD_CREATED',
  ASTEROID_FIELD_HAZARD_REMOVED = 'ASTEROID_FIELD_HAZARD_REMOVED',
  ASTEROID_FIELD_RESOURCE_NODE_REGISTERED = 'ASTEROID_FIELD_RESOURCE_NODE_REGISTERED',
  ASTEROID_FIELD_RESOURCE_EXTRACTED = 'ASTEROID_FIELD_RESOURCE_EXTRACTED',
  ASTEROID_FIELD_SHIP_POSITION_UPDATED = 'ASTEROID_FIELD_SHIP_POSITION_UPDATED',
  ASTEROID_FIELD_SHIP_HAZARD_COLLISION = 'ASTEROID_FIELD_SHIP_HAZARD_COLLISION',

  // Effects events (Added)
  EFFECT_STARTED = 'EFFECT_STARTED',
  EFFECT_ENDED = 'EFFECT_ENDED',
  EFFECT_CLEANED = 'EFFECT_CLEANED',

  // Mining events (Added)
  MINING_TASK_COMPLETED = 'MINING_TASK_COMPLETED',
  MINING_TASK_ASSIGNED = 'MINING_TASK_ASSIGNED',
  MINING_TASK_FAILED = 'MINING_TASK_FAILED',
  MINING_SHIP_REGISTERED = 'MINING_SHIP_REGISTERED',
  MINING_SHIP_UNREGISTERED = 'MINING_SHIP_UNREGISTERED',
  MINING_SHIP_STATUS_CHANGED = 'MINING_SHIP_STATUS_CHANGED',
  MINING_RESOURCE_COLLECTED = 'MINING_RESOURCE_COLLECTED',

  // AI Behavior events (Added)
  BEHAVIOR_NODE_EXECUTED = 'BEHAVIOR_NODE_EXECUTED',
  BEHAVIOR_ACTION_STARTED = 'BEHAVIOR_ACTION_STARTED',
  BEHAVIOR_TREE_COMPLETED = 'BEHAVIOR_TREE_COMPLETED',
  BEHAVIOR_ACTION_COMPLETED = 'BEHAVIOR_ACTION_COMPLETED',

  // Officer & Squad events (Added)
  OFFICER_ACADEMY_ACTIVATED = 'OFFICER_ACADEMY_ACTIVATED',
  OFFICER_TIER_UPGRADED = 'OFFICER_TIER_UPGRADED',
  OFFICER_HIRED = 'OFFICER_HIRED',
  OFFICER_TRAINING_STARTED = 'OFFICER_TRAINING_STARTED',
  OFFICER_TRAINING_COMPLETED = 'OFFICER_TRAINING_COMPLETED',
  OFFICER_ASSIGNED = 'OFFICER_ASSIGNED',
  OFFICER_LEVELED_UP = 'OFFICER_LEVELED_UP',
  OFFICER_EXPERIENCE_GAINED = 'OFFICER_EXPERIENCE_GAINED',
  SQUAD_CREATED = 'SQUAD_CREATED',
  SQUAD_UPDATED = 'SQUAD_UPDATED',

  // Production Chain Events
  CHAIN_STARTED = 'CHAIN_STARTED',
  CHAIN_STEP_STARTED = 'CHAIN_STEP_STARTED',
  CHAIN_STEP_COMPLETED = 'CHAIN_STEP_COMPLETED',
  CHAIN_COMPLETED = 'CHAIN_COMPLETED',
  CHAIN_FAILED = 'CHAIN_FAILED',
  CHAIN_STATUS_UPDATED = 'CHAIN_STATUS_UPDATED',

  // Ship events (examples)
  SHIP_CREATED = 'SHIP_CREATED',
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
  [EventType.RESOURCE_NODE_UPDATED]: EventCategory.RESOURCE,

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
  [EventType.MISSION_REcombatD_CLAIMED]: EventCategory.MISSION,

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
  [EventType.HAZARD_CREATED]: EventCategory.COMBAT,
  [EventType.HAZARD_REMOVED]: EventCategory.COMBAT,

  // Tech events
  [EventType.TECH_UNLOCKED]: EventCategory.TECH,
  [EventType.TECH_UPDATED]: EventCategory.TECH,

  // System events
  [EventType.REGISTRY_UPDATED]: EventCategory.SYSTEM,
  [EventType.SYSTEM_STARTUP]: EventCategory.SYSTEM,
  [EventType.SYSTEM_SHUTDOWN]: EventCategory.SYSTEM,
  [EventType.SYSTEM_ALERT]: EventCategory.SYSTEM,
  [EventType.PARTICLE_SYSTEM_UPDATED]: EventCategory.SYSTEM,

  // Game manager events
  [EventType.GAME_STARTED]: EventCategory.SYSTEM,
  [EventType.GAME_PAUSED]: EventCategory.SYSTEM,
  [EventType.GAME_RESUMED]: EventCategory.SYSTEM,
  [EventType.GAME_STOPPED]: EventCategory.SYSTEM,
  [EventType.TIME_UPDATED]: EventCategory.SYSTEM,

  // Exploration events
  [EventType.EXPLORATION_SECTOR_DISCOVERED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_SECTOR_SCANNED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_ANOMALY_DETECTED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_RESOURCE_DETECTED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_SCAN_STARTED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_SCAN_COMPLETED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_SCAN_FAILED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_SHIP_ASSIGNED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_SHIP_UNASSIGNED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_SHIP_REGISTERED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_SHIP_UNREGISTERED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_TASK_ASSIGNED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_TASK_COMPLETED]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_TASK_PROGRESS]: EventCategory.EXPLORATION,
  [EventType.EXPLORATION_POSITION_UPDATED]: EventCategory.EXPLORATION,

  // Faction events
  [EventType.FACTION_RELATIONSHIP_CHANGED]: EventCategory.FACTION,
  [EventType.FACTION_TREATY_STATUS_CHANGED]: EventCategory.FACTION,
  [EventType.FACTION_TRADE_ESTABLISHED]: EventCategory.FACTION,
  [EventType.FACTION_CONFLICT_RECORDED]: EventCategory.FACTION,

  // Asteroid Field Events (Added)
  [EventType.ASTEROID_FIELD_GENERATED]: EventCategory.SYSTEM,
  [EventType.ASTEROID_FIELD_DEPLETED]: EventCategory.SYSTEM,
  [EventType.ASTEROID_FIELD_RESOURCE_DISCOVERED]: EventCategory.SYSTEM,
  [EventType.ASTEROID_FIELD_HAZARD_CREATED]: EventCategory.SYSTEM,
  [EventType.ASTEROID_FIELD_HAZARD_REMOVED]: EventCategory.SYSTEM,
  [EventType.ASTEROID_FIELD_RESOURCE_NODE_REGISTERED]: EventCategory.SYSTEM,
  [EventType.ASTEROID_FIELD_RESOURCE_EXTRACTED]: EventCategory.SYSTEM,
  [EventType.ASTEROID_FIELD_SHIP_POSITION_UPDATED]: EventCategory.SYSTEM,
  [EventType.ASTEROID_FIELD_SHIP_HAZARD_COLLISION]: EventCategory.SYSTEM,

  // Effects events (Added)
  [EventType.EFFECT_STARTED]: EventCategory.EFFECTS,
  [EventType.EFFECT_ENDED]: EventCategory.EFFECTS,
  [EventType.EFFECT_CLEANED]: EventCategory.EFFECTS,

  // Mining events (Added)
  [EventType.MINING_TASK_COMPLETED]: EventCategory.MINING,
  [EventType.MINING_TASK_ASSIGNED]: EventCategory.MINING,
  [EventType.MINING_TASK_FAILED]: EventCategory.MINING,
  [EventType.MINING_SHIP_REGISTERED]: EventCategory.MINING,
  [EventType.MINING_SHIP_UNREGISTERED]: EventCategory.MINING,
  [EventType.MINING_SHIP_STATUS_CHANGED]: EventCategory.MINING,
  [EventType.MINING_RESOURCE_COLLECTED]: EventCategory.MINING,

  // AI Behavior events (Added)
  [EventType.BEHAVIOR_NODE_EXECUTED]: EventCategory.AI,
  [EventType.BEHAVIOR_ACTION_STARTED]: EventCategory.AI,
  [EventType.BEHAVIOR_TREE_COMPLETED]: EventCategory.AI,
  [EventType.BEHAVIOR_ACTION_COMPLETED]: EventCategory.AI,

  // Officer & Squad events (Added)
  [EventType.OFFICER_ACADEMY_ACTIVATED]: EventCategory.OFFICER,
  [EventType.OFFICER_TIER_UPGRADED]: EventCategory.OFFICER,
  [EventType.OFFICER_HIRED]: EventCategory.OFFICER,
  [EventType.OFFICER_TRAINING_STARTED]: EventCategory.OFFICER,
  [EventType.OFFICER_TRAINING_COMPLETED]: EventCategory.OFFICER,
  [EventType.OFFICER_ASSIGNED]: EventCategory.OFFICER,
  [EventType.OFFICER_LEVELED_UP]: EventCategory.OFFICER,
  [EventType.OFFICER_EXPERIENCE_GAINED]: EventCategory.OFFICER,
  [EventType.SQUAD_CREATED]: EventCategory.OFFICER,
  [EventType.SQUAD_UPDATED]: EventCategory.OFFICER,

  // Production Chain Events
  [EventType.CHAIN_STARTED]: EventCategory.SYSTEM,
  [EventType.CHAIN_STEP_STARTED]: EventCategory.SYSTEM,
  [EventType.CHAIN_STEP_COMPLETED]: EventCategory.SYSTEM,
  [EventType.CHAIN_COMPLETED]: EventCategory.SYSTEM,
  [EventType.CHAIN_FAILED]: EventCategory.SYSTEM,
  [EventType.CHAIN_STATUS_UPDATED]: EventCategory.SYSTEM,

  // Ship events (examples)
  [EventType.SHIP_CREATED]: EventCategory.SYSTEM,
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
 * Type guard for checking if a value is a ResourceUpdateEventData
 */
export function isResourceUpdateEventData(data: unknown): data is ResourceUpdateEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const d = data as Partial<ResourceUpdateEventData>;
  return (
    typeof d.resourceType === 'string' &&
    (d.amount === undefined || typeof d.amount === 'number') &&
    (d.production === undefined || typeof d.production === 'number') &&
    (d.consumption === undefined || typeof d.consumption === 'number') &&
    (d.rate === undefined || typeof d.rate === 'number') &&
    (d.max === undefined || typeof d.max === 'number') &&
    (d.min === undefined || typeof d.min === 'number')
  );
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
  resourceId: ResourceType;
  thresholdType: 'critical' | 'low' | 'normal' | 'high' | 'maximum';
  currentValue: number;
  thresholdValue: number;
  direction: 'increasing' | 'decreasing';
}

/**
 * Type guard functions to validate event data at runtime
 */

export function isResourceProductionEventData(data: unknown): data is ResourceProductionEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const castData = data as Partial<ResourceProductionEventData>;
  return 'resourceType' in castData && 'amount' in castData && typeof castData.amount === 'number';
}

export function isResourceConsumptionEventData(
  data: unknown
): data is ResourceConsumptionEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const castData = data as Partial<ResourceConsumptionEventData>;
  return 'resourceType' in castData && 'amount' in castData && typeof castData.amount === 'number';
}

export function isThresholdTriggeredEventData(data: unknown): data is ThresholdTriggeredEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

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

/**
 * Payload for PARTICLE_SYSTEM_UPDATED event
 */
export interface ParticleSystemUpdateEventData {
  activeCount: number;
}

/**
 * Payload for HAZARD_CREATED event
 */
export interface HazardCreatedEventData {
  hazardId: string;
  hazardType: string; // Consider using a HazardType enum if available
  position: { x: number; y: number }; // Use Position type if available
}

/**
 * Payload for HAZARD_REMOVED event
 */
export interface HazardRemovedEventData {
  hazardId: string;
}

/**
 * Payload for FACTION_RELATIONSHIP_CHANGED event
 */
export interface FactionRelationshipChangedEventData {
  factionId: string; // Consider using FactionId type if globally available
  targetFactionId: string; // Consider using FactionId type
  oldValue: number;
  newValue: number;
  reason?: string;
}

/**
 * Payload for FACTION_TREATY_STATUS_CHANGED event
 */
export interface FactionTreatyStatusChangedEventData {
  factionId: string; // Consider using FactionId type
  targetFactionId: string; // Consider using FactionId type
  oldStatus: string; // Consider enum: 'none' | 'ceasefire' | 'trade' | 'alliance'
  newStatus: string; // Consider enum
}

/**
 * Payload for FACTION_TRADE_ESTABLISHED event
 */
export interface FactionTradeEstablishedEventData {
  factionId: string; // Consider using FactionId type
  targetFactionId: string; // Consider using FactionId type
  resourceType: ResourceType;
  amount: number;
}

/**
 * Payload for FACTION_CONFLICT_RECORDED event
 */
export interface FactionConflictRecordedEventData {
  factionId: string; // Consider using FactionId type
  targetFactionId: string; // Consider using FactionId type
  conflictType: string; // Consider enum: 'attack' | 'territory' | 'trade'
  severity: number;
}

// Define simplified interfaces for complex payloads used by AsteroidFieldManager
interface HazardEffectInfo {
  type: string; // 'damage' | 'slow' | 'shield' | 'weapon'
  value: number;
}
interface HazardInfo {
  id: string;
  type: string; // 'asteroids' | 'debris' | 'radiation' | 'anomaly'
  position: { x: number; y: number }; // Use Position type if available
  radius: number;
  severity: string; // 'low' | 'medium' | 'high'
  effect: HazardEffectInfo;
}

export interface AsteroidFieldGeneratedEventData {
  fieldId: string;
  position: { x: number; y: number }; // Use Position type if available
}

export interface AsteroidFieldDepletedEventData {
  fieldId: string;
}

export interface AsteroidFieldResourceDiscoveredEventData {
  fieldId: string;
  resourceType: ResourceType;
  amount: number;
}

export interface AsteroidFieldHazardCreatedEventData {
  fieldId: string;
  hazard: HazardInfo; // Using simplified HazardInfo
}

export interface AsteroidFieldHazardRemovedEventData {
  fieldId: string;
  hazardId: string;
}

export interface AsteroidFieldResourceNodeRegisteredEventData {
  nodeId: string;
  fieldId: string;
  type: ResourceType;
  position: { x: number; y: number }; // Use Position type if available
}

export interface AsteroidFieldResourceExtractedEventData {
  nodeId: string;
  type: ResourceType;
  amount: number;
  remaining: number;
}

export interface AsteroidFieldShipPositionUpdatedEventData {
  shipId: string;
  position: { x: number; y: number }; // Use Position type if available
  inField: boolean;
}

export interface AsteroidFieldShipHazardCollisionEventData {
  shipId: string;
  hazardId: string;
  effect: HazardEffectInfo; // Using simplified HazardEffectInfo
}

/**
 * Payload for EFFECT_STARTED event
 */
export interface EffectStartedEventData {
  effectId: string;
  effectType: string;
}

/**
 * Payload for EFFECT_ENDED event
 */
export interface EffectEndedEventData {
  effectId: string;
  effectType: string;
}

/**
 * Payload for EFFECT_CLEANED event
 */
export interface EffectCleanedEventData {
  effectId: string;
  effectType: string;
}

// Simplified interfaces for MiningTask and MiningShip for event payloads
// Replace with actual imports if these types are exported centrally
interface MiningTaskInfo {
  id: string;
  shipId: string;
  nodeId: string;
  resourceType: ResourceType;
  priority: number;
  status: string; // Consider enum: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}
interface MiningShipInfo {
  id: string;
  name: string;
  type: string; // 'rockBreaker' | 'voidDredger'
  status: string; // Consider enum
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
}

export interface MiningTaskCompletedEventData {
  task: MiningTaskInfo;
}
export interface MiningTaskAssignedEventData {
  task: MiningTaskInfo;
}
export interface MiningTaskFailedEventData {
  task: MiningTaskInfo;
  reason: string;
}
export interface MiningShipRegisteredEventData {
  ship: MiningShipInfo;
}
export interface MiningShipUnregisteredEventData {
  shipId: string;
}
export interface MiningShipStatusChangedEventData {
  shipId: string;
  oldStatus: string; // Consider enum
  newStatus: string; // Consider enum
}
export interface MiningResourceCollectedEventData {
  shipId: string;
  resourceType: ResourceType;
  amount: number;
}

/**
 * Payload for BEHAVIOR_NODE_EXECUTED event
 */
export interface BehaviorNodeExecutedEventData {
  nodeId: string;
  success: boolean;
  unitId?: string; // Optional context
}

/**
 * Payload for BEHAVIOR_ACTION_STARTED event
 */
export interface BehaviorActionStartedEventData {
  unitId: string;
  actionType: string;
}

/**
 * Payload for BEHAVIOR_TREE_COMPLETED event
 */
export interface BehaviorTreeCompletedEventData {
  unitId: string;
  treeId: string;
  success: boolean;
}

/**
 * Payload for BEHAVIOR_ACTION_COMPLETED event
 */
export interface BehaviorActionCompletedEventData {
  unitId: string;
  actionType: string;
  success: boolean;
}

// Simplified interfaces for Officer/Squad/Training for event payloads
interface OfficerSkillsInfo {
  combat: number;
  leadership: number;
  technical: number;
}
interface OfficerInfo {
  id: string;
  name: string;
  level: number;
  role: string;
  specialization: string;
  skills: OfficerSkillsInfo;
  stats: OfficerSkillsInfo;
  traits: string[];
  status: string;
  assignedTo?: string;
}
interface TrainingProgramInfo {
  id: string;
  officerId: string;
  specialization: string;
  progress: number;
  startTime: number;
  duration: number;
  bonuses: { xpMultiplier: number; skillGainRate: number };
}
interface SquadInfo {
  id: string;
  name: string;
  members: OfficerInfo[];
  specialization: string;
  leader?: OfficerInfo;
  bonuses: { combat: number; efficiency: number; survival: number };
}

export interface OfficerAcademyActivatedEventData {
  moduleId: string;
}
export interface OfficerTierUpgradedEventData {
  tier: number;
}
export interface OfficerHiredEventData {
  officer: OfficerInfo;
}
export interface OfficerTrainingStartedEventData {
  officerId: string;
  program: TrainingProgramInfo;
}
export interface OfficerTrainingCompletedEventData {
  officerId: string;
  specialization: string;
  skills: OfficerSkillsInfo;
}
export interface OfficerAssignedEventData {
  officerId: string;
  assignmentId: string;
}
export interface OfficerLeveledUpEventData {
  officerId: string;
  newLevel: number;
  skills: OfficerSkillsInfo;
}
export interface OfficerExperienceGainedEventData {
  officerId: string;
  amount: number;
  newTotal: number;
  nextLevel: number;
}
export interface SquadCreatedEventData {
  squad: SquadInfo;
}
export interface SquadUpdatedEventData {
  squadId: string;
  officerId?: string; // Optional: if update is due to officer assignment
}

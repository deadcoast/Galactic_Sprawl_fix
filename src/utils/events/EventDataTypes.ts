/**
 * @file EventDataTypes.ts
 * Comprehensive type definitions for event data payloads.
 * Provides type-safe interfaces for all event types and validation functions.
 */

import { EventType } from '../../types/events/EventTypes';
import { Module, ModuleStatus } from '../../types/modules/ModuleTypes';
import { ResourceType } from './../../types/resources/ResourceTypes';

/**
 * Base interface for all event data
 */
export interface BaseEventData {
  timestamp?: number;
  source?: string;
}

/**
 * Module Events
 */

export interface ModuleCreatedEventData extends BaseEventData {
  module: Module;
  createdBy?: string;
  buildingId?: string;
}

export interface ModuleUpdatedEventData extends BaseEventData {
  moduleId: string;
  updates: Partial<Module>;
}

export interface ModuleRemovedEventData extends BaseEventData {
  moduleId: string;
  reason?: string;
}

export interface ModuleStatusChangedEventData extends BaseEventData {
  moduleId: string;
  status: ModuleStatus;
  previousStatus?: ModuleStatus;
}

export interface ModuleActivatedEventData extends BaseEventData {
  moduleId: string;
  activatedBy?: string;
}

export interface ModuleDeactivatedEventData extends BaseEventData {
  moduleId: string;
  deactivatedBy?: string;
  reason?: string;
}

/**
 * Resource Events
 */

export interface ResourceProducedEventData extends BaseEventData {
  resourceType: ResourceType;
  amount: number;
  sourceId?: string;
  sourceName?: string;
}

export interface ResourceConsumedEventData extends BaseEventData {
  resourceType: ResourceType;
  amount: number;
  consumerId?: string;
  consumerName?: string;
  purpose?: string;
}

export interface ResourceTransferredEventData extends BaseEventData {
  resourceType: ResourceType;
  amount: number;
  sourceId: string;
  targetId: string;
  transferTime?: number;
}

export interface ResourceUpdatedEventData extends BaseEventData {
  resourceType: ResourceType;
  amount?: number;
  production?: number;
  consumption?: number;
  rate?: number;
  max?: number;
  min?: number;
}

export interface ResourceShortageEventData extends BaseEventData {
  resourceType: ResourceType;
  requiredAmount: number;
  availableAmount: number;
  consumerId: string;
}

/**
 * Game Events
 */

export interface GameStartedEventData extends BaseEventData {
  gameTime: number;
  difficulty?: string;
  scenario?: string;
}

export interface GamePausedEventData extends BaseEventData {
  gameTime: number;
  pausedBy?: string;
}

export interface GameResumedEventData extends BaseEventData {
  gameTime: number;
  totalPausedTime?: number;
}

export interface GameStoppedEventData extends BaseEventData {
  gameTime: number;
  reason?: string;
  score?: number;
}

/**
 * Type guards (validation functions)
 */

export function isModuleCreatedEventData(data: unknown): data is ModuleCreatedEventData {
  return (
    !!data &&
    typeof data === 'object' &&
    'module' in data &&
    typeof data?.module === 'object' &&
    data?.module !== null &&
    'id' in data?.module &&
    'type' in data?.module
  );
}

export function isModuleUpdatedEventData(data: unknown): data is ModuleUpdatedEventData {
  return (
    !!data &&
    typeof data === 'object' &&
    'moduleId' in data &&
    typeof data?.moduleId === 'string' &&
    'updates' in data &&
    typeof data?.updates === 'object' &&
    data?.updates !== null
  );
}

export function isModuleRemovedEventData(data: unknown): data is ModuleRemovedEventData {
  return (
    !!data && typeof data === 'object' && 'moduleId' in data && typeof data?.moduleId === 'string'
  );
}

export function isModuleStatusChangedEventData(
  data: unknown
): data is ModuleStatusChangedEventData {
  return (
    !!data &&
    typeof data === 'object' &&
    'moduleId' in data &&
    typeof data?.moduleId === 'string' &&
    'status' in data
  );
}

export function isResourceProducedEventData(data: unknown): data is ResourceProducedEventData {
  return (
    !!data &&
    typeof data === 'object' &&
    'resourceType' in data &&
    'amount' in data &&
    typeof data?.amount === 'number'
  );
}

export function isResourceConsumedEventData(data: unknown): data is ResourceConsumedEventData {
  return (
    !!data &&
    typeof data === 'object' &&
    'resourceType' in data &&
    'amount' in data &&
    typeof data?.amount === 'number'
  );
}

export function isResourceTransferredEventData(
  data: unknown
): data is ResourceTransferredEventData {
  return (
    !!data &&
    typeof data === 'object' &&
    'resourceType' in data &&
    'amount' in data &&
    typeof data?.amount === 'number' &&
    'sourceId' in data &&
    typeof data?.sourceId === 'string' &&
    'targetId' in data &&
    typeof data?.targetId === 'string'
  );
}

export function isResourceUpdatedEventData(data: unknown): data is ResourceUpdatedEventData {
  return !!data && typeof data === 'object' && 'resourceType' in data;
}

export function isGameStartedEventData(data: unknown): data is GameStartedEventData {
  return (
    !!data && typeof data === 'object' && 'gameTime' in data && typeof data?.gameTime === 'number'
  );
}

/**
 * Event data type mapping to EventType
 */
export interface EventDataTypeMap {
  [EventType.MODULE_CREATED]: ModuleCreatedEventData;
  [EventType.MODULE_UPDATED]: ModuleUpdatedEventData;
  [EventType.MODULE_REMOVED]: ModuleRemovedEventData;
  [EventType.MODULE_STATUS_CHANGED]: ModuleStatusChangedEventData;
  [EventType.MODULE_ACTIVATED]: ModuleActivatedEventData;
  [EventType.MODULE_DEACTIVATED]: ModuleDeactivatedEventData;
  [EventType.RESOURCE_PRODUCED]: ResourceProducedEventData;
  [EventType.RESOURCE_CONSUMED]: ResourceConsumedEventData;
  [EventType.RESOURCE_TRANSFERRED]: ResourceTransferredEventData;
  [EventType.RESOURCE_UPDATED]: ResourceUpdatedEventData;
  [EventType.RESOURCE_SHORTAGE]: ResourceShortageEventData;
  GAME_STARTED: GameStartedEventData;
  GAME_PAUSED: GamePausedEventData;
  GAME_RESUMED: GameResumedEventData;
  GAME_STOPPED: GameStoppedEventData;
  [key: string]: BaseEventData; // Allow unknown string key but require BaseEventData minimum structure
}

/**
 * Get the correct type guard for a specific event type
 */
export function getEventDataValidator(eventType: EventType | string): (data: unknown) => boolean {
  switch (eventType) {
    case EventType.MODULE_CREATED:
      return isModuleCreatedEventData;
    case EventType.MODULE_UPDATED:
      return isModuleUpdatedEventData;
    case EventType.MODULE_REMOVED:
      return isModuleRemovedEventData;
    case EventType.MODULE_STATUS_CHANGED:
      return isModuleStatusChangedEventData;
    case EventType.RESOURCE_PRODUCED:
      return isResourceProducedEventData;
    case EventType.RESOURCE_CONSUMED:
      return isResourceConsumedEventData;
    case EventType.RESOURCE_TRANSFERRED:
      return isResourceTransferredEventData;
    case EventType.RESOURCE_UPDATED:
      return isResourceUpdatedEventData;
    case 'GAME_STARTED':
      return isGameStartedEventData;
    default:
      // Default fallback for event types without specific validators
      return (_data: unknown): boolean => true;
  }
}

/**
 * Validate event data against its expected type
 */
export function validateEventData(eventType: EventType | string, data: unknown): boolean {
  const validator = getEventDataValidator(eventType);
  return validator(data);
}

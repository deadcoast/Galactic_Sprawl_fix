/**
 * @file StandardizedEvents.ts
 * Unified event type system with runtime validation.
 */

import { ModuleType } from '../buildings/ModuleTypes';
import { ResourceType } from '../resources/ResourceTypes';
import { EventType } from './EventTypes';

/**
 * Base event interface that all events must implement
 */
export interface StandardizedEvent {
  type: EventType;
  moduleId: string;
  moduleType: ModuleType;
  timestamp: number;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Resource event data interface
 */
export interface ResourceEventData {
  resourceType: ResourceType;
  amount: number;
  reason?: string;
  [key: string]: unknown;
}

/**
 * Population event data interface
 */
export interface PopulationEventData {
  stats: {
    [ResourceType.POPULATION]: number;
  };
  reason?: string;
  [key: string]: unknown;
}

/**
 * Module status event data interface
 */
export interface ModuleStatusEventData {
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  previousStatus?: 'active' | 'inactive' | 'error' | 'maintenance';
  reason?: string;
  [key: string]: unknown;
}

/**
 * Trade route event data interface
 */
export interface TradeRouteEventData {
  partnerId: string;
  tradeResources: Array<ResourceType>;
  efficiency?: number;
  [key: string]: unknown;
}

/**
 * Runtime validation functions
 */

export function isValidStandardizedEvent(event: unknown): event is StandardizedEvent {
  if (!event || typeof event !== 'object') {
    return false;
  }

  const e = event as StandardizedEvent;
  return (
    typeof e.type === 'string' &&
    typeof e.moduleId === 'string' &&
    typeof e.moduleType === 'string' &&
    typeof e.timestamp === 'number'
  );
}

export function isValidResourceEventData(data: unknown): data is ResourceEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const d = data as ResourceEventData;
  return (
    typeof d.resourceType === 'string' &&
    typeof d.amount === 'number' &&
    (d.reason === undefined || typeof d.reason === 'string')
  );
}

export function isValidPopulationEventData(data: unknown): data is PopulationEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const d = data as PopulationEventData;
  return (
    d.stats !== undefined &&
    typeof d.stats === 'object' &&
    typeof d.stats[ResourceType.POPULATION] === 'number' &&
    (d.reason === undefined || typeof d.reason === 'string')
  );
}

export function isValidModuleStatusEventData(data: unknown): data is ModuleStatusEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const d = data as ModuleStatusEventData;
  const validStatuses = ['active', 'inactive', 'error', 'maintenance'];
  return (
    validStatuses.includes(d.status) &&
    (d.previousStatus === undefined || validStatuses.includes(d.previousStatus)) &&
    (d.reason === undefined || typeof d.reason === 'string')
  );
}

export function isValidTradeRouteEventData(data: unknown): data is TradeRouteEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const d = data as TradeRouteEventData;
  return (
    typeof d.partnerId === 'string' &&
    Array.isArray(d.tradeResources) &&
    d.tradeResources.every(r => typeof r === 'string') &&
    (d.efficiency === undefined || typeof d.efficiency === 'number')
  );
}

/**
 * Event creation helper functions
 */

export function createResourceEvent(
  type: EventType,
  moduleId: string,
  moduleType: ModuleType,
  data: ResourceEventData
): StandardizedEvent {
  return {
    type,
    moduleId,
    moduleType,
    timestamp: Date.now(),
    data,
  };
}

export function createPopulationEvent(
  moduleId: string,
  moduleType: ModuleType,
  data: PopulationEventData
): StandardizedEvent {
  return {
    type: EventType.MODULE_UPDATED,
    moduleId,
    moduleType,
    timestamp: Date.now(),
    data,
  };
}

export function createModuleStatusEvent(
  moduleId: string,
  moduleType: ModuleType,
  data: ModuleStatusEventData
): StandardizedEvent {
  return {
    type: EventType.MODULE_STATUS_CHANGED,
    moduleId,
    moduleType,
    timestamp: Date.now(),
    data,
  };
}

export function createTradeRouteEvent(
  moduleId: string,
  moduleType: ModuleType,
  data: TradeRouteEventData
): StandardizedEvent {
  return {
    type: EventType.RESOURCE_TRANSFERRED,
    moduleId,
    moduleType,
    timestamp: Date.now(),
    data,
  };
}

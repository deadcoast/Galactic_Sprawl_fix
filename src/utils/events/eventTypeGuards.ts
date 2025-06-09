import { ModuleEvent } from '../../lib/events/ModuleEventBus';
import { ResourceType } from '../../types/resources/ResourceTypes';

/**
 * Type guard for resource update events
 */
export function isResourceUpdateEvent(
  event: ModuleEvent
): event is ModuleEvent & { data: { resourceAmounts: Partial<Record<ResourceType, number>> } } {
  return (
    event?.data !== undefined &&
    typeof event?.data === 'object' &&
    event?.data !== null &&
    'resourceAmounts' in event.data &&
    typeof event.data.resourceAmounts === 'object' &&
    event.data.resourceAmounts !== null
  );
}

/**
 * Type guard for resource production events
 */
export function isResourceProductionEvent(
  event: ModuleEvent
): event is ModuleEvent & { data: { resourceType: ResourceType; amount: number } } {
  return (
    event?.data !== undefined &&
    typeof event?.data === 'object' &&
    event?.data !== null &&
    'resourceType' in event.data &&
    'amount' in event.data &&
    typeof event.data.amount === 'number'
  );
}

/**
 * Type guard for resource consumption events
 */
export function isResourceConsumptionEvent(
  event: ModuleEvent
): event is ModuleEvent & { data: { resourceType: ResourceType; amount: number } } {
  return (
    event?.data !== undefined &&
    typeof event?.data === 'object' &&
    event?.data !== null &&
    'resourceType' in event.data &&
    'amount' in event.data &&
    typeof event.data.amount === 'number'
  );
}

import { useState } from 'react';
import { useComponentLifecycle } from '../../../hooks/ui/useComponentLifecycle';
import { ModuleEvent } from '../../../lib/events/ModuleEventBus';
import { EventType } from '../../../types/events/EventTypes';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { getResourceDisplayName } from '../../../utils/resources/resourceUtils';
import { ResourceIcon } from './ResourceIcon';

interface ResourceDisplayProps {
  /**
   * Type of resource to display
   */
  resourceType: ResourceType;

  /**
   * Initial resource amount
   */
  initialAmount?: number;

  /**
   * Class name for styling
   */
  className?: string;
}

interface ResourceEventData {
  resourceType: ResourceType;
  amount: number;
  source?: string;
  target?: string;
}

function isResourceEvent(event: ModuleEvent): event is ModuleEvent & { data: ResourceEventData } {
  return Boolean(
    event.data &&
      typeof event.data === 'object' &&
      'resourceType' in event.data &&
      'amount' in event.data
  );
}

/**
 * Component that displays a resource with real-time updates
 *
 * This component demonstrates the usage of the component registration system:
 * - It registers itself with ComponentRegistryService
 * - It subscribes to relevant resource events
 * - It updates its state based on those events
 */
export function ResourceDisplay({
  resourceType,
  initialAmount = 0,
  className = '',
}: ResourceDisplayProps) {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [productionRate, setProductionRate] = useState<number>(0);
  const [consumptionRate, setConsumptionRate] = useState<number>(0);

  useComponentLifecycle({
    eventSubscriptions: [
      {
        eventType: EventType.RESOURCE_PRODUCED,
        handler: (event: ModuleEvent) => {
          if (isResourceEvent(event) && event.data.resourceType === resourceType) {
            setAmount(prev => prev + event.data.amount);
            setProductionRate(prev => prev + event.data.amount);
          }
        },
      },
      {
        eventType: EventType.RESOURCE_CONSUMED,
        handler: (event: ModuleEvent) => {
          if (isResourceEvent(event) && event.data.resourceType === resourceType) {
            setAmount(prev => prev - event.data.amount);
            setConsumptionRate(prev => prev + event.data.amount);
          }
        },
      },
      {
        eventType: EventType.RESOURCE_UPDATED,
        handler: (event: ModuleEvent) => {
          if (isResourceEvent(event) && event.data.resourceType === resourceType) {
            setAmount(event.data.amount);
          }
        },
      },
    ],
  });

  const netRate = productionRate - consumptionRate;
  const rateColor = netRate > 0 ? 'text-green-500' : netRate < 0 ? 'text-red-500' : 'text-gray-500';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <ResourceIcon resourceType={resourceType} className="h-6 w-6" />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{getResourceDisplayName(resourceType)}</span>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold">{amount.toFixed(1)}</span>
          {netRate !== 0 && (
            <span className={`text-sm ${rateColor}`}>
              {netRate > 0 ? '+' : ''}
              {netRate.toFixed(1)}/s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

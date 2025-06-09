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
  if (!event?.data || typeof event.data !== 'object') {
    return false;
  }

  const data = event.data;
  return 'resourceType' in data && 'amount' in data;
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
  const [lastTransfer, setLastTransfer] = useState<{ source?: string; target?: string } | null>(
    null
  );
  const [showTransferInfo, setShowTransferInfo] = useState<boolean>(false);

  useComponentLifecycle({
    eventSubscriptions: [
      {
        eventType: EventType.RESOURCE_PRODUCED,
        handler: (event: ModuleEvent) => {
          if (isResourceEvent(event) && event.data.resourceType === resourceType) {
            setAmount(prev => prev + event.data.amount);
            setProductionRate(prev => prev + event.data.amount);

            // Track source information if available - following resource event pattern
            if (event.data.source) {
              setLastTransfer({
                source: event.data.source,
                target: event.data.target ?? 'current',
              });
              setShowTransferInfo(true);

              // Auto-hide transfer info after 3 seconds
              setTimeout(() => setShowTransferInfo(false), 3000);
            }
          }
        },
      },
      {
        eventType: EventType.RESOURCE_CONSUMED,
        handler: (event: ModuleEvent) => {
          if (isResourceEvent(event) && event.data.resourceType === resourceType) {
            setAmount(prev => prev - event.data.amount);
            setConsumptionRate(prev => prev + event.data.amount);

            // Track target information if available - following resource event pattern
            if (event.data.target) {
              setLastTransfer({
                source: event.data.source ?? 'current',
                target: event.data.target,
              });
              setShowTransferInfo(true);

              // Auto-hide transfer info after 3 seconds
              setTimeout(() => setShowTransferInfo(false), 3000);
            }
          }
        },
      },
      {
        eventType: EventType.RESOURCE_UPDATED,
        handler: (event: ModuleEvent) => {
          if (isResourceEvent(event) && event.data.resourceType === resourceType) {
            setAmount(event.data.amount);

            // Update transfer info if both source and target are available
            if (event.data.source && event.data.target) {
              setLastTransfer({
                source: event.data.source,
                target: event.data.target,
              });
              setShowTransferInfo(true);

              // Auto-hide transfer info after 3 seconds
              setTimeout(() => setShowTransferInfo(false), 3000);
            }
          }
        },
      },
      // New subscription for transfer events - following resource event pattern
      {
        eventType: EventType.RESOURCE_TRANSFERRED,
        handler: (event: ModuleEvent) => {
          if (isResourceEvent(event) && event.data.resourceType === resourceType) {
            // For transfer events, we don't modify the amount as that's handled by produced/consumed
            // But we do track the transfer information for display
            if (event.data.source && event.data.target) {
              setLastTransfer({
                source: event.data.source,
                target: event.data.target,
              });
              setShowTransferInfo(true);

              // Auto-hide transfer info after 5 seconds for transfers (longer display time)
              setTimeout(() => setShowTransferInfo(false), 5000);
            }
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
        {/* Display transfer information when available - following ResourceTransferEventData pattern */}
        {showTransferInfo && lastTransfer && (
          <div className="mt-1 text-xs text-slate-400">
            {lastTransfer.source && lastTransfer.target && (
              <>
                Transfer: {lastTransfer.source} → {lastTransfer.target}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

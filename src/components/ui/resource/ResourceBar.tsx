/**
 * @context: ui-system, resource-system, component-library
 * 
 * ResourceBar component for displaying resource levels with visual bars
 * Follows type safety patterns from GS-TYPE-DEFINITIONS
 */
import React from 'react';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { ResourceIcon } from './ResourceIcon';
import { getResourceDisplayName } from '../../../utils/resources/resourceUtils';
import { useComponentLifecycle } from '../../../hooks/ui/useComponentLifecycle';
import { ModuleEvent } from '../../../lib/events/ModuleEventBus';
import { EventType } from '../../../types/events/EventTypes';

interface ResourceBarProps {
  /**
   * Type of resource to display
   */
  resourceType: ResourceType;

  /**
   * Initial resource amount
   */
  initialAmount?: number;

  /**
   * Maximum resource capacity
   */
  maxCapacity?: number;

  /**
   * Whether to show the resource name
   */
  showLabel?: boolean;

  /**
   * Whether to show the amount as text
   */
  showAmount?: boolean;

  /**
   * Whether to show the percentage
   */
  showPercentage?: boolean;

  /**
   * Custom width for the bar
   */
  width?: string | number;

  /**
   * Custom height for the bar
   */
  height?: string | number;

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
  max?: number;
}

/**
 * Type guard for resource events as documented in GS-TYPE-DEFINITIONS
 */
function isResourceEvent(event: ModuleEvent): event is ModuleEvent & { data: ResourceEventData } {
  return Boolean(
    event &&
    event.data &&
    typeof event.data === 'object' &&
    'resourceType' in event.data &&
    'amount' in event.data &&
    typeof event.data.amount === 'number' &&
    Object.values(ResourceType).includes(event.data.resourceType as ResourceType)
  );
}

/**
 * Safely extract resource amount from event data
 */
function safelyExtractAmount(event: ModuleEvent): number {
  if (!event || !event.data) {
    return 0;
  }
  
  return typeof event.data.amount === 'number' ? event.data.amount : 0;
}

/**
 * Component that displays a resource with a visual bar indicating its current level
 * Implements proper type guards and safe data extraction
 */
export function ResourceBar({
  resourceType,
  initialAmount = 0,
  maxCapacity = 100,
  showLabel = true,
  showAmount = true,
  showPercentage = false,
  width = '100%',
  height = '16px',
  className = '',
}: ResourceBarProps) {
  const [amount, setAmount] = React.useState<number>(initialAmount);
  const [capacity, setCapacity] = React.useState<number>(maxCapacity);

  useComponentLifecycle({
    eventSubscriptions: [
      {
        eventType: EventType.RESOURCE_PRODUCED,
        handler: (event: ModuleEvent) => {
          if (isResourceEvent(event) && event.data.resourceType === resourceType) {
            const eventAmount = safelyExtractAmount(event);
            setAmount(prev => Math.min(prev + eventAmount, capacity));
          }
        },
      },
      {
        eventType: EventType.RESOURCE_CONSUMED,
        handler: (event: ModuleEvent) => {
          if (isResourceEvent(event) && event.data.resourceType === resourceType) {
            const eventAmount = safelyExtractAmount(event);
            setAmount(prev => Math.max(prev - eventAmount, 0));
          }
        },
      },
      {
        eventType: EventType.RESOURCE_UPDATED,
        handler: (event: ModuleEvent) => {
          if (isResourceEvent(event) && event.data.resourceType === resourceType) {
            setAmount(event.data.amount);
            if (event.data.max !== undefined) {
              setCapacity(event.data.max);
            }
          }
        },
      },
    ],
  });

  // Calculate percentage
  const percentage = Math.min(Math.max((amount / capacity) * 100, 0), 100);
  
  // Determine bar color based on percentage
  let barColor = 'bg-blue-500';
  if (percentage <= 25) {
    barColor = 'bg-red-500';
  } else if (percentage <= 50) {
    barColor = 'bg-yellow-500';
  } else if (percentage >= 90) {
    barColor = 'bg-green-500';
  }

  return (
    <div className={`resource-bar flex flex-col ${className}`} data-testid="resource-bar">
      {showLabel && (
        <div className="resource-bar-label flex items-center mb-1">
          <ResourceIcon resourceType={resourceType} className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{getResourceDisplayName(resourceType)}</span>
        </div>
      )}
      <div className="resource-bar-container flex items-center">
        <div 
          className="resource-bar-background bg-gray-200 rounded-full overflow-hidden"
          style={{ width: width, height: height }}
        >
          <div
            className={`resource-bar-fill ${barColor} h-full rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
            data-testid="resource-bar-fill"
          />
        </div>
        
        <div className="resource-bar-info ml-2 flex items-center">
          {showAmount && (
            <span className="resource-bar-amount text-sm font-medium">
              {Math.floor(amount).toLocaleString()}/{Math.floor(capacity).toLocaleString()}
            </span>
          )}
          {showPercentage && (
            <span className="resource-bar-percentage text-sm text-gray-500 ml-1">
              ({Math.floor(percentage)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 
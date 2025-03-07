import React, { useEffect, useState } from 'react';
import { useComponentLifecycle, useComponentRegistration } from '../../../hooks/ui';
import { ModuleEvent } from '../../../lib/modules/ModuleEvents';
import { ResourceType } from '../../../types/resources/ResourceTypes';

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

/**
 * Component that displays a resource with real-time updates
 *
 * This component demonstrates the usage of the component registration system:
 * - It registers itself with ComponentRegistryService
 * - It subscribes to relevant resource events
 * - It updates its state based on those events
 */
export const ResourceDisplay: React.FC<ResourceDisplayProps> = ({
  resourceType,
  initialAmount = 0,
  className = '',
}) => {
  // Local state
  const [amount, setAmount] = useState<number>(initialAmount);
  const [productionRate, setProductionRate] = useState<number>(0);
  const [consumptionRate, setConsumptionRate] = useState<number>(0);

  // Register component with the system
  useComponentRegistration({
    type: 'ResourceDisplay',
    eventSubscriptions: [
      'RESOURCE_PRODUCED',
      'RESOURCE_CONSUMED',
      'RESOURCE_TRANSFERRED',
      'RESOURCE_UPDATED',
    ],
    updatePriority: 'high', // Resource displays are critical UI components
  });

  // Set up lifecycle and event handling
  useComponentLifecycle({
    onMount: () => {
      console.warn(`ResourceDisplay mounted for ${resourceType}`);

      // Fetch initial data (in a real implementation, this would come from a hook or context)
      // This is just for demonstration
      fetch(`/api/resources/${resourceType}`)
        .catch(() => {
          // Fallback to mock data if fetch fails
          return {
            json: () =>
              Promise.resolve({ amount: initialAmount, production: 0.5, consumption: 0.2 }),
          };
        })
        .then(response => response.json())
        .then(data => {
          setAmount(data.amount);
          setProductionRate(data.production);
          setConsumptionRate(data.consumption);
        });
    },
    eventSubscriptions: [
      {
        eventType: 'RESOURCE_PRODUCED',
        handler: (event: ModuleEvent) => {
          // Check if this event is for our resource type
          if (event.data && event.data.resourceType === resourceType) {
            const amount = (event.data.amount as number) || 0;
            setAmount(prevAmount => prevAmount + amount);
          }
        },
      },
      {
        eventType: 'RESOURCE_CONSUMED',
        handler: (event: ModuleEvent) => {
          // Check if this event is for our resource type
          if (event.data && event.data.resourceType === resourceType) {
            const amount = (event.data.amount as number) || 0;
            setAmount(prevAmount => prevAmount - amount);
          }
        },
      },
      {
        eventType: 'RESOURCE_UPDATED',
        handler: (event: ModuleEvent) => {
          // Check if this event is for our resource type
          if (event.data && event.data.resourceType === resourceType) {
            // Update all resource stats
            if (event.data.amount !== undefined) {
              setAmount(event.data.amount as number);
            }
            if (event.data.production !== undefined) {
              setProductionRate(event.data.production as number);
            }
            if (event.data.consumption !== undefined) {
              setConsumptionRate(event.data.consumption as number);
            }
          }
        },
      },
    ],
  });

  // Calculate net rate
  const netRate = productionRate - consumptionRate;

  // Update simulation
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Apply production and consumption rates in a real-time simulation
      if (netRate !== 0) {
        setAmount(prevAmount => prevAmount + netRate / 10); // Simulating 10 updates per second
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [netRate]);

  // Determine rate color
  const getRateColor = () => {
    if (netRate > 0) return 'text-green-400';
    if (netRate < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  // Resource icons and colors
  const getResourceIcon = () => {
    switch (resourceType) {
      case 'minerals':
        return '⛏️';
      case 'energy':
        return '⚡';
      case 'population':
        return '👥';
      case 'research':
        return '🔬';
      default:
        return '📦';
    }
  };

  return (
    <div className={`rounded-lg border border-gray-700 bg-gray-800 p-3 ${className}`}>
      <div className="mb-2 flex items-center space-x-2">
        <span className="text-xl">{getResourceIcon()}</span>
        <span className="text-lg font-bold capitalize">{resourceType}</span>
      </div>

      <div className="mb-1 text-xl font-bold">{Math.floor(amount).toLocaleString()}</div>

      <div className={`text-sm font-medium ${getRateColor()}`}>
        {netRate > 0 ? '+' : ''}
        {netRate.toFixed(1)}/s
      </div>

      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <div>
          Production: <span className="text-green-400">{productionRate.toFixed(1)}</span>
        </div>
        <div>
          Consumption: <span className="text-red-400">{consumptionRate.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

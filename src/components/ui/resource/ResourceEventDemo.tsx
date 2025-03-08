/**
 * @file ResourceEventDemo.tsx
 * Demonstrates the usage of the standardized event system in a React component.
 *
 * This component showcases:
 * 1. Using useEventSubscription hook for clean event handling
 * 2. Using useEventCategorySubscription for subscribing to multiple events
 * 3. Automatic cleanup of event subscriptions on component unmount
 * 4. Using event filtering to only process relevant events
 * 5. Performance monitoring of event handling
 */

import React, { useEffect, useState } from 'react';
import {
  useEventCategorySubscription,
  useEventSubscription,
} from '../../../hooks/events/useEventSubscription';
import { moduleEventBus } from '../../../lib/events/ModuleEventBus';
import { ModuleType } from '../../../types/buildings/ModuleTypes';
import { EventCategory, EventType } from '../../../types/events/EventTypes';
import { ResourceType } from '../../../types/resources/StandardizedResourceTypes';

/**
 * Demonstrates using the standardized event system
 */
export const ResourceEventDemo: React.FC = () => {
  // State to hold received events
  const [lastResourceEvent, setLastResourceEvent] = useState<string | null>(null);
  const [resourceEventCount, setResourceEventCount] = useState<number>(0);
  const [categoryEventCounts, setCategoryEventCounts] = useState<Record<string, number>>({});

  // Subscribe to a specific event type using useEventSubscription
  const { latestEvent, subscribed, receivedCount } = useEventSubscription(
    moduleEventBus,
    EventType.RESOURCE_UPDATED,
    event => {
      setLastResourceEvent(
        `Resource Update at ${new Date(event.timestamp).toLocaleString()}: ` +
          `${event.data?.resourceType} ${event.data?.amount ?? 'N/A'}`
      );
      setResourceEventCount(prev => prev + 1);
    },
    {
      // Only process events for specific resources
      filter: event => {
        if (!event.data?.resourceType) return false;
        const resourceType = event.data.resourceType as ResourceType;
        return [ResourceType.MINERALS, ResourceType.ENERGY].includes(resourceType);
      },
      trackLatest: true, // Keep track of the latest event
    }
  );

  // Subscribe to all events in the RESOURCE category
  const { latestEvents, receivedCount: categoryCount } = useEventCategorySubscription(
    moduleEventBus,
    EventCategory.RESOURCE,
    event => {
      setCategoryEventCounts(prev => ({
        ...prev,
        [event.type]: (prev[event.type] || 0) + 1,
      }));
    },
    {
      trackLatest: true, // Keep track of latest events by type
    }
  );

  // Demo functions to emit events for testing
  const emitResourceUpdatedEvent = () => {
    moduleEventBus.emitEvent(EventType.RESOURCE_UPDATED, 'resource-demo', 'radar' as ModuleType, {
      resourceType: ResourceType.MINERALS,
      amount: Math.floor(Math.random() * 100),
      production: 5,
      consumption: 2,
    });
  };

  const emitResourceProducedEvent = () => {
    moduleEventBus.emitEvent(EventType.RESOURCE_PRODUCED, 'resource-demo', 'radar' as ModuleType, {
      resourceType: ResourceType.ENERGY,
      amount: Math.floor(Math.random() * 10),
      source: 'generator',
    });
  };

  // Display performance metrics
  const [metrics, setMetrics] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      const allMetrics = moduleEventBus.getPerformanceMetrics();
      setMetrics(
        `Events Processed: ${allMetrics.emitCount}, ` +
          `Avg Processing Time: ${allMetrics.averageProcessingTime.toFixed(2)}ms, ` +
          `Active Listeners: ${allMetrics.listenerCount}`
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg bg-gray-900 p-6 text-white shadow-lg">
      <h2 className="mb-4 text-2xl font-bold">Standardized Event System Demo</h2>

      <div className="mb-6">
        <h3 className="mb-2 text-xl font-bold">Event Subscription</h3>
        <div className="mb-4 rounded-lg bg-gray-800 p-4">
          <p>
            <span className="font-bold">Status:</span>{' '}
            {subscribed ? 'Subscribed' : 'Not Subscribed'}
          </p>
          <p>
            <span className="font-bold">Last Resource Event:</span> {lastResourceEvent || 'None'}
          </p>
          <p>
            <span className="font-bold">Events Received:</span> {receivedCount}
          </p>
        </div>

        <div className="mb-6 flex space-x-4">
          <button
            onClick={emitResourceUpdatedEvent}
            className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-700"
          >
            Emit Resource Updated
          </button>
          <button
            onClick={emitResourceProducedEvent}
            className="rounded bg-green-600 px-4 py-2 hover:bg-green-700"
          >
            Emit Resource Produced
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-xl font-bold">Category Subscription</h3>
        <div className="mb-4 rounded-lg bg-gray-800 p-4">
          <p>
            <span className="font-bold">Resource Category Events Received:</span> {categoryCount}
          </p>
          <div className="mt-2">
            <h4 className="font-bold">Event Counts by Type:</h4>
            <ul className="ml-4">
              {Object.entries(categoryEventCounts).map(([type, count]) => (
                <li key={type}>
                  {type}: {count}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-xl font-bold">Performance Metrics</h3>
        <div className="rounded-lg bg-gray-800 p-4">
          <p>{metrics}</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-gray-800 p-4">
        <h3 className="mb-2 text-xl font-bold">Implementation Notes</h3>
        <ul className="ml-6 list-disc space-y-2">
          <li>
            Uses <code>useEventSubscription</code> hook for type-safe event subscription
          </li>
          <li>
            Uses <code>useEventCategorySubscription</code> to listen to all RESOURCE events
          </li>
          <li>Event filtering applied to only process specific resource types</li>
          <li>Automatic cleanup of subscriptions on component unmount</li>
          <li>Performance monitoring through EventBus metrics</li>
        </ul>
      </div>
    </div>
  );
};

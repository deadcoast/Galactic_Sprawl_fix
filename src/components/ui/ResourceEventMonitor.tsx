import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useEventCategorySubscription } from '../../hooks/events/useEventSubscription';
import { EventBus } from '../../lib/events/EventBus';
import { ModuleEvent, moduleEventBus } from '../../lib/events/ModuleEventBus';
import { EventCategory, EventType } from '../../types/events/EventTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';

// Resource-related event types to monitor
const RESOURCE_EVENT_TYPES = [
  EventType.RESOURCE_PRODUCED,
  EventType.RESOURCE_CONSUMED,
  EventType.RESOURCE_TRANSFERRED,
  EventType.RESOURCE_PRODUCTION_REGISTERED,
  EventType.RESOURCE_CONSUMPTION_REGISTERED,
];

interface ResourceEventData {
  resourceType: ResourceType;
  amount: number;
  source?: string;
  target?: string;
}

// Type guard for resource events
function isResourceEvent(event: ModuleEvent): event is ModuleEvent & { data: ResourceEventData } {
  if (!event?.data) return false;
  const data = event?.data as Partial<ResourceEventData>;
  return (
    'resourceType' in data &&
    'amount' in data &&
    typeof data?.resourceType === 'string' &&
    typeof data?.amount === 'number'
  );
}

interface ResourceEventLog {
  id: string;
  type: EventType;
  moduleId: string;
  timestamp: number;
  resourceType: ResourceType;
  amount: number;
  source?: string;
  target?: string;
}

/**
 * Component that monitors and displays resource-related events in real-time.
 * Uses the standardized event system with proper type safety and event filtering.
 * Uses virtualization for efficient rendering of large event logs.
 */
export const ResourceEventMonitor: React.FC = () => {
  const [eventLogs, setEventLogs] = useState<ResourceEventLog[]>([]);
  const [filter, setFilter] = useState<string>('');
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Subscribe to all resource events using category subscription
  const { latestEvents, receivedCount } = useEventCategorySubscription(
    moduleEventBus as unknown as EventBus<ModuleEvent>,
    EventCategory.RESOURCE,
    (event: ModuleEvent) => {
      if (isResourceEvent(event)) {
        addEventToLog({
          id: `${event?.type}-${event?.moduleId}-${event?.timestamp}`,
          type: event?.type,
          moduleId: event?.moduleId,
          timestamp: event?.timestamp,
          resourceType: event?.data?.resourceType,
          amount: event?.data?.amount,
          source: event?.data?.source,
          target: event?.data?.target,
        });
      }
    },
    {
      trackLatest: true,
      filter: (event: ModuleEvent) => RESOURCE_EVENT_TYPES.includes(event?.type as EventType),
    }
  );

  // Find the most recent event from the latestEvents record
  const mostRecentEvent = React.useMemo(() => {
    if (
      !latestEvents ||
      typeof latestEvents !== 'object' ||
      Object.keys(latestEvents).length === 0
    ) {
      return null;
    }
    let latest: ModuleEvent | null = null;
    for (const eventType in latestEvents) {
      const event = latestEvents[eventType as EventType];
      if (event && (!latest || event.timestamp > latest.timestamp)) {
        latest = event;
      }
    }
    return latest;
  }, [latestEvents]);

  // Helper function to add events to the log
  const addEventToLog = (eventLog: ResourceEventLog) => {
    setEventLogs(prevLogs => {
      const newLogs = [eventLog, ...prevLogs];
      return newLogs.slice(0, 1000);
    });

    // Scroll to top when new events come in
    if (listRef.current) {
      listRef.current.scrollTo(0);
    }
  };

  // Clear logs
  const clearLogs = () => {
    setEventLogs([]);
  };

  // Filter logs based on user input
  const filteredLogs = filter
    ? eventLogs.filter(
        log =>
          log.type.toLowerCase().includes(filter.toLowerCase()) ||
          log.moduleId.toLowerCase().includes(filter.toLowerCase()) ||
          log.resourceType.toLowerCase().includes(filter.toLowerCase())
      )
    : eventLogs;

  // Measure container size for the virtualized list
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setContainerSize({ width, height });
        }
      });

      resizeObserver.observe(containerRef.current);

      // Initialize size
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Row renderer for the virtualized list
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const log = filteredLogs[index];
    return (
      <div style={style} className="flex border-b border-gray-700 hover:bg-gray-600">
        <div className="min-w-[100px] flex-1 px-4 py-2">
          {new Date(log.timestamp).toLocaleTimeString()}
        </div>
        <div className="min-w-[150px] flex-1 px-4 py-2">{log.type}</div>
        <div className="min-w-[120px] flex-1 px-4 py-2">{log.moduleId}</div>
        <div className="min-w-[100px] flex-1 px-4 py-2">{log.resourceType}</div>
        <div className="min-w-[80px] flex-1 px-4 py-2">{log.amount.toFixed(2)}</div>
      </div>
    );
  };

  // Table header for the virtualized list
  const TableHeader = () => (
    <div className="flex bg-gray-700 text-xs uppercase">
      <div className="min-w-[100px] flex-1 px-4 py-2">Time</div>
      <div className="min-w-[150px] flex-1 px-4 py-2">Event Type</div>
      <div className="min-w-[120px] flex-1 px-4 py-2">Module</div>
      <div className="min-w-[100px] flex-1 px-4 py-2">Resource</div>
      <div className="min-w-[80px] flex-1 px-4 py-2">Amount</div>
    </div>
  );

  return (
    <div className="rounded-lg bg-gray-800 p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Resource Event Monitor</h2>
        <div className="flex items-center space-x-4">
          <div className="text-right text-xs text-gray-400">
            <div>Total Received: {receivedCount}</div>
            {mostRecentEvent && (
              <div>
                Latest: {mostRecentEvent.type} @{' '}
                {new Date(mostRecentEvent.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Filter events..."
              className="rounded border border-gray-600 bg-gray-700 px-3 py-1 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <button
              onClick={clearLogs}
              className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="h-96 w-full">
        {filteredLogs.length === 0 ? (
          <div className="flex h-full items-center justify-center py-8 text-center text-gray-400">
            No resource events recorded yet
          </div>
        ) : (
          <div className="text-left text-sm text-gray-300">
            <TableHeader />
            <List
              ref={listRef}
              className="text-left text-sm text-gray-300"
              height={containerSize.height - 30} // Subtract header height
              width={containerSize.width}
              itemCount={filteredLogs.length}
              itemSize={40} // Height of each row
            >
              {Row}
            </List>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Displaying {filteredLogs.length} events (virtualized for performance)
      </div>
    </div>
  );
};

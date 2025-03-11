import React, { useEffect, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useModuleEvents, useMultipleModuleEvents } from '../../hooks/events/useSystemEvents';
import { ModuleEvent, ModuleEventType } from '../../lib/modules/ModuleEvents';

// Resource-related event types to monitor
const RESOURCE_EVENT_TYPES: ModuleEventType[] = [
  'RESOURCE_PRODUCED',
  'RESOURCE_CONSUMED',
  'RESOURCE_TRANSFERRED',
  'RESOURCE_PRODUCTION_REGISTERED',
  'RESOURCE_CONSUMPTION_REGISTERED',
];

interface ResourceEventLog {
  id: string;
  type: ModuleEventType;
  moduleId: string;
  timestamp: number;
  resourceName?: string;
  amount?: number;
}

/**
 * Component that monitors and displays resource-related events in real-time.
 * Demonstrates the use of the useModuleEvents hook for UI components.
 * Uses virtualization for efficient rendering of large event logs.
 */
export const ResourceEventMonitor: React.FC = () => {
  const [eventLogs, setEventLogs] = useState<ResourceEventLog[]>([]);
  const [filter, setFilter] = useState<string>('');
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Handle a single resource event type as an example
  useModuleEvents(
    'RESOURCE_PRODUCED',
    (event: ModuleEvent) => {
      const resourceName = event.data?.resourceName as string;
      const amount = event.data?.amount as number;

      // Add the event to our logs
      addEventToLog({
        id: `${event.type}-${event.moduleId}-${event.timestamp}`,
        type: event.type,
        moduleId: event.moduleId,
        timestamp: event.timestamp,
        resourceName,
        amount,
      });
    },
    [] // No dependencies
  );

  // Example of using the multiple events hook
  useMultipleModuleEvents([
    {
      eventType: 'RESOURCE_CONSUMED',
      handler: event => {
        const resourceName = event.data?.resourceName as string;
        const amount = event.data?.amount as number;

        addEventToLog({
          id: `${event.type}-${event.moduleId}-${event.timestamp}`,
          type: event.type,
          moduleId: event.moduleId,
          timestamp: event.timestamp,
          resourceName,
          amount,
        });
      },
    },
    {
      eventType: 'RESOURCE_TRANSFERRED',
      handler: event => {
        const resourceName = event.data?.resourceName as string;
        const amount = event.data?.amount as number;

        addEventToLog({
          id: `${event.type}-${event.moduleId}-${event.timestamp}`,
          type: event.type,
          moduleId: event.moduleId,
          timestamp: event.timestamp,
          resourceName,
          amount,
        });
      },
    },
  ]);

  // Helper function to add events to the log
  const addEventToLog = (eventLog: ResourceEventLog) => {
    setEventLogs(prevLogs => {
      // Instead of limiting to 50 events, now we'll keep up to 1000 since virtualization
      // efficiently renders only what's visible
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
          (log.resourceName && log.resourceName.toLowerCase().includes(filter.toLowerCase()))
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
        <div className="min-w-[100px] flex-1 px-4 py-2">{log.resourceName || 'N/A'}</div>
        <div className="min-w-[80px] flex-1 px-4 py-2">
          {log.amount !== undefined ? log.amount.toFixed(2) : 'N/A'}
        </div>
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
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Filter events..."
            className="rounded border border-gray-600 bg-gray-700 px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <button
            onClick={clearLogs}
            className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Clear
          </button>
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

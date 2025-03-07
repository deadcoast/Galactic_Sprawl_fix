import React, { useState } from 'react';
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
 */
export const ResourceEventMonitor: React.FC = () => {
  const [eventLogs, setEventLogs] = useState<ResourceEventLog[]>([]);
  const [filter, setFilter] = useState<string>('');

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
      // Keep only the most recent 50 events
      const newLogs = [eventLog, ...prevLogs];
      return newLogs.slice(0, 50);
    });
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

      <div className="max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-gray-400">No resource events recorded yet</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-700 text-xs uppercase">
              <tr>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Event Type</th>
                <th className="px-4 py-2">Module</th>
                <th className="px-4 py-2">Resource</th>
                <th className="px-4 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-600">
                  <td className="px-4 py-2">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="px-4 py-2">{log.type}</td>
                  <td className="px-4 py-2">{log.moduleId}</td>
                  <td className="px-4 py-2">{log.resourceName || 'N/A'}</td>
                  <td className="px-4 py-2">
                    {log.amount !== undefined ? log.amount.toFixed(2) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

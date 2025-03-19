import * as React from 'react';
import { useEffect, useState } from 'react';
import { selectActiveModules, useModules } from '../../contexts/ModuleContext';
import { useGameState } from '../../hooks/game/useGameState';
import { ModuleEvent } from '../../lib/modules/ModuleEvents';
import { BaseModule } from '../../types/buildings/ModuleTypes';
import { ModuleStatus } from '../../types/modules/ModuleTypes';
import { createBatchedEventStream } from '../../utils/events/EventBatcher';

type TabType = 'resources' | 'modules' | 'events' | 'system';

interface GameStateMonitorProps {
  initialTab?: TabType;
  maxEvents?: number;
  expanded?: boolean;
}

/**
 * GameStateMonitor component
 *
 * A debug component that shows the current state of the game in real-time,
 * including resources, modules, and recent events.
 *
 * Uses the existing event system to track and display updates.
 */
export function GameStateMonitor({
  initialTab = 'resources',
  maxEvents = 50,
  expanded = false,
}: GameStateMonitorProps) {
  const gameState = useGameState();
  const moduleState = useModules(state => ({
    ...state,
    activeModules: selectActiveModules(state).map(
      module =>
        ({
          ...module,
          status: module.status === ModuleStatus.ERROR ? 'inactive' : module.status,
        }) as BaseModule
    ),
  }));
  const [currentTab, setCurrentTab] = useState<TabType>(initialTab);
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [recentEvents, setRecentEvents] = useState<ModuleEvent[]>([]);
  const [systemInfo, setSystemInfo] = useState({
    fps: 0,
    memory: 'Browser API limited',
    lastUpdate: Date.now(),
  });

  // Subscribe to all module events to track recent events
  useEffect(() => {
    // Create a batched event stream for all events
    const eventStream$ = createBatchedEventStream(
      [
        'MODULE_ACTIVATED',
        'MODULE_DEACTIVATED',
        'RESOURCE_PRODUCED',
        'RESOURCE_CONSUMED',
        'RESOURCE_UPDATED',
        'MODULE_UPGRADED',
      ],
      { timeWindow: 500 }
    );

    // Subscribe to the event stream
    const subscription = eventStream$.subscribe(batch => {
      setRecentEvents(prev => {
        // Add new events and limit to maxEvents
        const allEvents = [...batch.events, ...prev];
        return allEvents.slice(0, maxEvents);
      });
    });

    // Update system info periodically
    const infoInterval = setInterval(() => {
      const now = Date.now();
      const fps = Math.round(1000 / (now - systemInfo.lastUpdate));

      // Just use a placeholder for memory since it's only available in Chrome
      // and causes TypeScript issues
      const memoryUsage = 'Browser API limited';

      setSystemInfo({
        fps,
        memory: memoryUsage,
        lastUpdate: now,
      });
    }, 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(infoInterval);
    };
  }, [maxEvents, systemInfo.lastUpdate]);

  // Don't render anything if collapsed
  if (!isExpanded) {
    return (
      <button
        className="fixed bottom-0 right-0 z-50 m-2 rounded bg-gray-800 p-2 text-white"
        onClick={() => setIsExpanded(true)}
      >
        Open State Monitor
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 m-2 max-h-[80vh] w-96 overflow-auto rounded bg-gray-900 p-2 text-white shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">Game State Monitor</h2>
        <button
          className="rounded bg-red-600 px-2 py-1 text-white"
          onClick={() => setIsExpanded(false)}
        >
          Close
        </button>
      </div>

      {/* Tab selector */}
      <div className="mb-2 flex space-x-1">
        <TabButton active={currentTab === 'resources'} onClick={() => setCurrentTab('resources')}>
          Resources
        </TabButton>
        <TabButton active={currentTab === 'modules'} onClick={() => setCurrentTab('modules')}>
          Modules
        </TabButton>
        <TabButton active={currentTab === 'events'} onClick={() => setCurrentTab('events')}>
          Events
        </TabButton>
        <TabButton active={currentTab === 'system'} onClick={() => setCurrentTab('system')}>
          System
        </TabButton>
      </div>

      {/* Tab content */}
      <div className="max-h-[60vh] overflow-auto rounded bg-gray-800 p-2">
        {currentTab === 'resources' && <ResourcesTab resources={gameState.resources} />}

        {currentTab === 'modules' && <ModulesTab modules={moduleState.activeModules} />}

        {currentTab === 'events' && <EventsTab events={recentEvents} />}

        {currentTab === 'system' && <SystemTab info={systemInfo} />}
      </div>
    </div>
  );
}

// Tab button component
function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded px-3 py-1 ${active ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Resources tab content
function ResourcesTab({ resources }: { resources: Record<string, number> }) {
  return (
    <div>
      <h3 className="mb-2 font-semibold">Resource Levels</h3>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 text-left">
            <th className="pb-1">Resource</th>
            <th className="pb-1">Value</th>
            {resources.mineralRate !== undefined && <th className="pb-1">Rate</th>}
          </tr>
        </thead>
        <tbody>
          {Object.entries(resources).map(([key, value]) => {
            // Skip rate properties in the main list
            if (key.endsWith('Rate')) return null;

            const rateKey = `${key}Rate`;
            const rate = resources[rateKey];

            return (
              <tr key={key} className="border-b border-gray-700">
                <td className="py-1 capitalize">{key}</td>
                <td className="py-1">{Math.round(value)}</td>
                {rate !== undefined && (
                  <td className={`py-1 ${rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {rate > 0 ? '+' : ''}
                    {Math.round(rate * 10) / 10}/s
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Modules tab content
function ModulesTab({ modules }: { modules: BaseModule[] }) {
  if (!modules || modules.length === 0) {
    return <div className="text-gray-400">No active modules found.</div>;
  }

  return (
    <div>
      <h3 className="mb-2 font-semibold">Active Modules ({modules.length})</h3>
      <div className="space-y-2">
        {modules.map(module => (
          <div key={module.id} className="rounded bg-gray-700 p-2">
            <div className="font-medium">{module.name || module.type}</div>
            <div className="text-xs text-gray-300">ID: {module.id}</div>
            <div className="text-xs text-gray-300">Type: {module.type}</div>
            <div className="text-xs text-gray-300">Level: {module.level || 1}</div>
            <div className="text-xs text-gray-300">Active: {module.isActive ? 'Yes' : 'No'}</div>
            <div className="text-xs text-gray-300">Status: {module.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Events tab content
function EventsTab({ events }: { events: ModuleEvent[] }) {
  if (!events || events.length === 0) {
    return <div className="text-gray-400">No events recorded yet.</div>;
  }

  // (...args: unknown[]) => unknown to get a color for different event types
  const getEventColor = (type: string): string => {
    if (type.includes('RESOURCE')) return 'text-green-400';
    if (type.includes('MODULE')) return 'text-blue-400';
    if (type.includes('ERROR')) return 'text-red-400';
    return 'text-white';
  };

  return (
    <div>
      <h3 className="mb-2 font-semibold">Recent Events ({events.length})</h3>
      <div className="space-y-1">
        {events.map((event, index) => (
          <div key={index} className="rounded bg-gray-700 p-1 text-xs">
            <div className={`font-medium ${getEventColor(event?.type)}`}>{event?.type}</div>
            <div className="text-gray-300">
              Module: {event?.moduleId} ({event?.moduleType})
            </div>
            <div className="text-gray-300">
              Time: {new Date(event?.timestamp).toLocaleTimeString()}
            </div>
            {event?.data && (
              <div className="mt-1">
                <details>
                  <summary className="cursor-pointer">Data</summary>
                  <pre className="mt-1 max-h-20 overflow-auto bg-gray-800 p-1 text-green-300">
                    {JSON.stringify(event?.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// System tab content
function SystemTab({ info }: { info: { fps: number; memory: string; lastUpdate: number } }) {
  return (
    <div>
      <h3 className="mb-2 font-semibold">System Information</h3>
      <table className="w-full">
        <tbody>
          <tr className="border-b border-gray-700">
            <td className="py-1 font-medium">FPS</td>
            <td className="py-1">{info.fps}</td>
          </tr>
          <tr className="border-b border-gray-700">
            <td className="py-1 font-medium">Memory</td>
            <td className="py-1">{info.memory}</td>
          </tr>
          <tr className="border-b border-gray-700">
            <td className="py-1 font-medium">Last Update</td>
            <td className="py-1">{new Date(info.lastUpdate).toLocaleTimeString()}</td>
          </tr>
          <tr className="border-b border-gray-700">
            <td className="py-1 font-medium">Module Count</td>
            <td className="py-1" id="module-count">
              Calculating...
            </td>
          </tr>
          <tr className="border-b border-gray-700">
            <td className="py-1 font-medium">Event Listeners</td>
            <td className="py-1" id="event-listeners">
              Calculating...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

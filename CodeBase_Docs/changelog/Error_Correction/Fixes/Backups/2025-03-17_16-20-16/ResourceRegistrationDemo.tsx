import * as React from "react";
import { useState } from 'react';
import { moduleEventBus, ModuleEventType } from '../../../lib/modules/ModuleEvents';
import {
  ComponentRegistration,
  componentRegistryService,
} from '../../../services/ComponentRegistryService';
import { ResourceType } from "./../../../types/resources/ResourceTypes";
import { ResourceDisplay } from './ResourceDisplay';

/**
 * Demo component showcasing the component registration system
 *
 * This component:
 * 1. Renders multiple ResourceDisplay components
 * 2. Provides controls to emit events that those components respond to
 * 3. Shows component registry information for debugging
 */
export const ResourceRegistrationDemo: React.FC = () => {
  // State for event emission controls
  const [resourceType, setResourceType] = useState<ResourceType>(ResourceType.MINERALS);
  const [amount, setAmount] = useState<number>(10);
  const [eventType, setEventType] = useState<string>('RESOURCE_PRODUCED');

  // State for component registry info
  const [registryInfo, setRegistryInfo] = useState<{
    totalComponents: number;
    componentTypes: string[];
    eventSubscriptions: Record<string, number>;
  }>({
    totalComponents: 0,
    componentTypes: [],
    eventSubscriptions: {},
  });

  // Function to emit a resource event
  const emitResourceEvent = () => {
    console.warn(`Emitting ${eventType} event for ${resourceType} with amount ${amount}`);

    moduleEventBus.emit({
      type: eventType as ModuleEventType,
      moduleId: 'demo-emitter',
      moduleType: 'infrastructure',
      timestamp: Date.now(),
      data: {
        resourceType,
        amount,
        source: 'ResourceRegistrationDemo',
      },
    });
  };

  // Function to update registry info
  const updateRegistryInfo = () => {
    // Get components of all types we're interested in
    const components = [
      ...componentRegistryService.getComponentsByType('ResourceDisplay'),
      ...componentRegistryService.getComponentsByType('ResourceThresholdVisualization'),
      ...componentRegistryService.getComponentsByType('ResourceFlowDiagram'),
      ...componentRegistryService.getComponentsByType('ResourceRegistrationDemo'),
    ];

    // Count event subscriptions
    const eventSubs: Record<string, number> = {};
    components.forEach((comp: ComponentRegistration) => {
      comp.eventSubscriptions.forEach((eventType: string) => {
        eventSubs[eventType] = (eventSubs[eventType] || 0) + 1;
      });
    });

    // Calculate component types
    const compTypes = Array.from(
      new Set(components.map((c: ComponentRegistration) => c.type))
    ) as string[];

    setRegistryInfo({
      totalComponents: components.length,
      componentTypes: compTypes,
      eventSubscriptions: eventSubs,
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold">Component Registration System Demo</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Demo components section */}
        <div>
          <h2 className="mb-4 text-xl font-bold">Resource Displays</h2>
          <p className="mb-4 text-gray-400">
            These components are registered with the ComponentRegistryService and respond to events
          </p>

          <div className="mb-8 grid grid-cols-2 gap-4">
            <ResourceDisplay resourceType={ResourceType.MINERALS} initialAmount={100} />
            <ResourceDisplay resourceType={ResourceType.ENERGY} initialAmount={200} />
            <ResourceDisplay resourceType={ResourceType.POPULATION} initialAmount={50} />
            <ResourceDisplay resourceType={ResourceType.RESEARCH} initialAmount={75} />
          </div>

          {/* Event controls */}
          <div className="mb-4 rounded-lg bg-gray-800 p-4">
            <h3 className="mb-3 text-lg font-bold">Event Controls</h3>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-gray-400">Resource Type</label>
                <select
                  className="w-full rounded bg-gray-700 p-2 text-white"
                  value={resourceType}
                  onChange={e => setResourceType(e.target.value as ResourceType)}
                >
                  <option value={ResourceType.MINERALS}>Minerals</option>
                  <option value={ResourceType.ENERGY}>Energy</option>
                  <option value={ResourceType.POPULATION}>Population</option>
                  <option value={ResourceType.RESEARCH}>Research</option>
                  <option value={ResourceType.PLASMA}>Plasma</option>
                  <option value={ResourceType.GAS}>Gas</option>
                  <option value={ResourceType.EXOTIC}>Exotic</option>
                  <option value={ResourceType.IRON}>Iron</option>
                  <option value={ResourceType.COPPER}>Copper</option>
                  <option value={ResourceType.TITANIUM}>Titanium</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-gray-400">Event Type</label>
                <select
                  className="w-full rounded bg-gray-700 p-2 text-white"
                  value={eventType}
                  onChange={e => setEventType(e.target.value)}
                >
                  <option value="RESOURCE_PRODUCED">RESOURCE_PRODUCED</option>
                  <option value="RESOURCE_CONSUMED">RESOURCE_CONSUMED</option>
                  <option value="RESOURCE_UPDATED">RESOURCE_UPDATED</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-gray-400">Amount</label>
              <input
                type="number"
                className="w-full rounded bg-gray-700 p-2 text-white"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
              />
            </div>

            <div className="flex space-x-4">
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={emitResourceEvent}
              >
                Emit Event
              </button>

              <button
                className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                onClick={updateRegistryInfo}
              >
                Update Registry Info
              </button>
            </div>
          </div>
        </div>

        {/* Component registry information */}
        <div>
          <h2 className="mb-4 text-xl font-bold">Component Registry</h2>
          <p className="mb-4 text-gray-400">
            This section shows the current state of the ComponentRegistryService
          </p>

          <div className="mb-4 rounded-lg bg-gray-800 p-4">
            <h3 className="mb-3 text-lg font-bold">Registry Statistics</h3>

            <div className="mb-4">
              <div className="flex justify-between border-b border-gray-700 py-2">
                <span className="text-gray-400">Total Registered Components:</span>
                <span className="font-bold">{registryInfo.totalComponents}</span>
              </div>

              <div className="border-b border-gray-700 py-2">
                <div className="mb-2 text-gray-400">Component Types:</div>
                <div className="flex flex-wrap gap-2">
                  {registryInfo.componentTypes.map(type => (
                    <span key={type} className="rounded bg-gray-700 px-2 py-1 text-sm">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="py-2">
                <div className="mb-2 text-gray-400">Event Subscriptions:</div>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(registryInfo.eventSubscriptions).map(([event, count]) => (
                    <div
                      key={event}
                      className="flex items-center justify-between rounded bg-gray-700 px-3 py-2"
                    >
                      <span className="text-sm">{event}</span>
                      <span className="rounded-full bg-blue-600 px-2 py-1 text-xs">
                        {count} components
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-800 p-4">
            <h3 className="mb-3 text-lg font-bold">How It Works</h3>

            <ol className="list-decimal space-y-2 pl-5 text-gray-300">
              <li>
                Each ResourceDisplay component registers with the ComponentRegistryService using the{' '}
                <code className="rounded bg-gray-700 px-1">useComponentRegistration</code> hook
              </li>
              <li>Components specify which events they're interested in during registration</li>
              <li>
                The <code className="rounded bg-gray-700 px-1">useComponentLifecycle</code> hook
                sets up event subscriptions and handles component lifecycle
              </li>
              <li>
                When an event is emitted, only components that registered for that event type are
                notified
              </li>
              <li>
                The system automatically tracks component performance metrics and cleans up on
                unmount
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

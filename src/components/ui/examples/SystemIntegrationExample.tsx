/**
 * @context: ui-system, component-library, resource-system, event-system, module-system, registry-system
 * 
 * Example component demonstrating integration with all core systems
 */
import * as React from 'react';
import { useState, useEffect } from 'react';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { EventType, BaseEvent } from '../../../types/events/EventTypes';
import { ModuleType } from '../../../types/buildings/ModuleTypes';
import { getCombatManager } from '../../../managers/ManagerRegistry';
import {
  useResource,
  useResources,
  useResourceActions,
  useEventSubscription,
  useEventMonitor,
  useModule,
  useModules,
  useManager
} from '../../../hooks/integration';
import { IBaseManager } from '../../../lib/managers/BaseManager';

/**
 * System Integration Example component
 * Demonstrates integration with all core systems (Resource, Event, Module, Manager Registry)
 */
export function SystemIntegrationExample() {
  // State for UI
  const [activeTab, setActiveTab] = useState<'resources' | 'events' | 'modules' | 'managers'>('resources');
  
  return (
    <div className="system-integration-example">
      <h2>System Integration Example</h2>
      
      {/* Tab Navigation */}
      <div className="tabs">
        <button 
          className={activeTab === 'resources' ? 'active' : ''} 
          onClick={() => setActiveTab('resources')}
        >
          Resources
        </button>
        <button 
          className={activeTab === 'events' ? 'active' : ''} 
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
        <button 
          className={activeTab === 'modules' ? 'active' : ''} 
          onClick={() => setActiveTab('modules')}
        >
          Modules
        </button>
        <button 
          className={activeTab === 'managers' ? 'active' : ''} 
          onClick={() => setActiveTab('managers')}
        >
          Managers
        </button>
      </div>
      
      {/* Content Based on Active Tab */}
      <div className="tab-content">
        {activeTab === 'resources' && <ResourceSystemExample />}
        {activeTab === 'events' && <EventSystemExample />}
        {activeTab === 'modules' && <ModuleSystemExample />}
        {activeTab === 'managers' && <ManagerRegistryExample />}
      </div>
    </div>
  );
}

/**
 * Resource System integration example
 */
function ResourceSystemExample() {
  // Get a specific resource
  const { data: energyResource, loading: energyLoading, error: energyError } = useResource(ResourceType.ENERGY);
  
  // Get multiple resources
  const { 
    data: resourceMap, 
    loading: resourcesLoading
  } = useResources([ResourceType.MINERALS, ResourceType.FOOD, ResourceType.WATER]);
  
  // Get resource action functions
  const { addResource, consumeResource, error: actionError } = useResourceActions();
  
  // Add energy
  const handleAddEnergy = () => {
    addResource(ResourceType.ENERGY, 100);
  };
  
  // Consume minerals
  const handleConsumeMinerals = () => {
    consumeResource(ResourceType.MINERALS, 50);
  };
  
  if (energyLoading || resourcesLoading) {
    return <div>Loading resources...</div>;
  }
  
  if (energyError) {
    return <div>Error loading energy: {energyError.message}</div>;
  }
  
  return (
    <div className="resource-system-example">
      <h3>Resource System Integration</h3>
      
      {/* Single Resource Display */}
      <div className="resource-display">
        <h4>Energy Resource</h4>
        <div>Current: {energyResource.current}</div>
        <div>Max: {energyResource.max}</div>
        <div>Production: {energyResource.production}</div>
        <div>Consumption: {energyResource.consumption}</div>
        <button onClick={handleAddEnergy}>Add 100 Energy</button>
      </div>
      
      {/* Multiple Resources Display */}
      <div className="resources-display">
        <h4>Other Resources</h4>
        <div className="resource-grid">
          {Array.from(resourceMap.entries()).map(([type, resource]) => (
            <div key={type} className="resource-item">
              <h5>{type}</h5>
              <div>Current: {resource.current}</div>
              <div>Max: {resource.max}</div>
            </div>
          ))}
        </div>
        <button onClick={handleConsumeMinerals}>Consume 50 Minerals</button>
      </div>
      
      {/* Error display */}
      {actionError && (
        <div className="error-message">
          Action Error: {actionError.message}
        </div>
      )}
    </div>
  );
}

/**
 * Event System integration example
 */
function EventSystemExample() {
  // State to store a specific event data
  const [resourceEvent, setResourceEvent] = useState<BaseEvent | null>(null);
  
  // Subscribe to a specific event type
  useEventSubscription(
    EventType.RESOURCE_PRODUCED,
    (event) => {
      setResourceEvent(event);
    }
  );
  
  // Monitor multiple events
  const { events, clearEvents, emitEvent } = useEventMonitor({
    maxEvents: 5,
    eventTypes: [
      EventType.RESOURCE_PRODUCED,
      EventType.RESOURCE_CONSUMED,
      EventType.MODULE_ACTIVATED,
      EventType.MODULE_DEACTIVATED
    ]
  });
  
  // Emit sample resource produced event
  const handleEmitEvent = () => {
    emitEvent({
      type: EventType.RESOURCE_PRODUCED,
      moduleId: 'test-module',
      moduleType: 'resource-manager' as ModuleType,
      timestamp: Date.now(),
      data: {
        resourceType: ResourceType.ENERGY,
        amount: 50
      }
    });
  };
  
  return (
    <div className="event-system-example">
      <h3>Event System Integration</h3>
      
      {/* Event Subscription */}
      <div className="event-subscription">
        <h4>Resource Production Event Subscription</h4>
        {resourceEvent ? (
          <div className="event-data">
            <div>Event Type: {resourceEvent.type}</div>
            <div>Timestamp: {new Date(resourceEvent.timestamp).toLocaleTimeString()}</div>
            <div>Module: {resourceEvent.moduleId}</div>
            <pre>{JSON.stringify(resourceEvent.data, null, 2)}</pre>
          </div>
        ) : (
          <div>No resource production events received yet.</div>
        )}
      </div>
      
      {/* Event Monitor */}
      <div className="event-monitor">
        <h4>Event Monitor</h4>
        {events.length > 0 ? (
          <div className="events-list">
            {events.map((event, index) => (
              <div key={index} className="event-item">
                <div>Type: {event.type}</div>
                <div>Time: {new Date(event.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
            <button onClick={clearEvents}>Clear Events</button>
          </div>
        ) : (
          <div>No events monitored yet.</div>
        )}
        <button onClick={handleEmitEvent}>Emit Test Event</button>
      </div>
    </div>
  );
}

/**
 * Module System integration example
 */
function ModuleSystemExample() {
  // Get a specific module
  const {
    module,
    loading: moduleLoading,
    error: moduleError,
    activateModule,
    deactivateModule
  } = useModule('resource-generator-1');
  
  // Get all modules
  const {
    modules,
    loading: modulesLoading,
    error: modulesError,
    createModule
  } = useModules();
  
  // Create a new module
  const handleCreateModule = () => {
    createModule({
      name: `Resource Generator ${Math.floor(Math.random() * 1000)}`,
      type: 'resource-manager' as ModuleType,
      position: { x: Math.random() * 100, y: Math.random() * 100 }
    });
  };
  
  if (moduleLoading || modulesLoading) {
    return <div>Loading modules...</div>;
  }
  
  if (moduleError) {
    return <div>Error loading module: {moduleError.message}</div>;
  }
  
  if (modulesError) {
    return <div>Error loading modules: {modulesError.message}</div>;
  }
  
  return (
    <div className="module-system-example">
      <h3>Module System Integration</h3>
      
      {/* Single Module Display */}
      {module ? (
        <div className="module-display">
          <h4>Selected Module: {module.name}</h4>
          <div>ID: {module.id}</div>
          <div>Type: {module.type}</div>
          <div>Status: {module.status}</div>
          <div className="module-actions">
            <button onClick={activateModule}>Activate</button>
            <button onClick={deactivateModule}>Deactivate</button>
          </div>
        </div>
      ) : (
        <div>Selected module not found</div>
      )}
      
      {/* All Modules Display */}
      <div className="modules-list">
        <h4>All Modules ({modules.length})</h4>
        <button onClick={handleCreateModule}>Create New Module</button>
        <div className="modules-grid">
          {modules.map(mod => (
            <div key={mod.id} className="module-item">
              <div>{mod.name}</div>
              <div>Type: {mod.type}</div>
              <div>Status: {mod.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Manager Registry integration example
 */
function ManagerRegistryExample() {
  // Use our fixed useManager hook to get a combat manager
  const { 
    manager, 
    loading, 
    error, 
    isInitialized 
  } = useManager(() => {
    // This function safely gets a manager instance
    try {
      return getCombatManager();
    } catch (err) {
      // If real manager fails, return a simple object that matches interface
      return { 
        id: 'combat-manager-fallback',
        getName: () => 'CombatManager',
        isInitialized: () => true
      };
    }
  });
  
  if (loading) {
    return <div>Loading manager...</div>;
  }
  
  if (error) {
    return <div>Error loading manager: {error.message}</div>;
  }
  
  // Safely extract manager ID using type checking
  const getManagerId = (): string => {
    if (!manager) return 'unknown';
    
    // Check if manager has an id property
    if ('id' in manager) {
      return (manager as {id: string}).id;
    }
    
    // Fallback to a default value
    return 'combat-manager';
  };
  
  // Safely get manager name
  const getManagerName = (): string => {
    if (!manager) return 'unknown';
    
    // Check if manager has a getName method
    if (hasGetNameMethod(manager)) {
      return manager.getName();
    }
    
    // Try different property access patterns
    if ('name' in manager) {
      return (manager as {name: string}).name;
    }
    
    return 'Combat Manager';
  };
  
  // Type guard for getName method
  function hasGetNameMethod(obj: unknown): obj is { getName: () => string } {
    return obj !== null && 
           typeof obj === 'object' && 
           'getName' in obj && 
           typeof (obj as { getName: unknown }).getName === 'function';
  }
  
  return (
    <div className="manager-registry-example">
      <h3>Manager Registry Integration</h3>
      
      {/* Combat Manager */}
      <div className="manager-display">
        <h4>Combat Manager</h4>
        <div>Initialized: {isInitialized ? 'Yes' : 'No'}</div>
        {manager && (
          <>
            <div>Manager ID: {getManagerId()}</div>
            <div>Manager Name: {getManagerName()}</div>
          </>
        )}
      </div>
    </div>
  );
} 
import { ModuleEvent, moduleEventBus, ModuleEventType } from '../lib/modules/ModuleEvents';
import { gameLoopManager, UpdatePriority } from '../managers/game/GameLoopManager';
import { getSystemCommunication } from '../utils/events/EventCommunication';
import { EventPriorityQueue } from '../utils/events/EventFiltering';
import { initializeRxJSIntegration } from '../utils/events/rxjsIntegration';
import { ResourceType } from './../types/resources/ResourceTypes';
import { initializeAutomationSystem } from './automationSystemInit';
import { integrateWithGameSystems } from './gameSystemsIntegration';

// Define an interface for our priority queue events
interface PriorityQueueEvent {
  type: string;
  priority: number;
  data: Record<string, unknown> | ModuleEvent;
}

/**
 * Initialize the event system
 */
export function initializeEventSystem(): () => void {
  console.warn('Initializing Event System...');

  // Initialize RxJS integration
  const rxjsCleanup = initializeRxJSIntegration();

  // Initialize system communications
  const eventSystemComm = getSystemCommunication('event-system');
  const _resourceSystemComm = getSystemCommunication('resource-system');
  const _moduleSystemComm = getSystemCommunication('module-system');

  // Register basic event handlers
  const unregisterSystemStartup = eventSystemComm.registerHandler('system-startup', message => {
    const payload = message.payload as { systemName: string };
    console.warn(`System startup message received: ${payload.systemName}`);
  });

  // Register resource system event handlers
  const unregisterResourceEvents = _resourceSystemComm.registerHandler(
    'resource-update',
    message => {
      const payload = message.payload as {
        resourceType: ResourceType;
        amount: number;
        operation: 'add' | 'subtract';
      };
      console.warn(
        `Resource update: ${payload.operation} ${payload.amount} of ${payload.resourceType}`
      );

      // Forcombatd important resource events to the module system
      if (payload.amount > 1000) {
        _moduleSystemComm.sendMessage('resource-system', 'resource-threshold-reached', {
          resourceType: payload.resourceType,
          amount: payload.amount,
          timestamp: Date.now(),
        });
      }
    }
  );

  // Register module system event handlers
  const unregisterModuleEvents = _moduleSystemComm.registerHandler(
    'module-status-change',
    message => {
      const payload = message.payload as { moduleId: string; status: string };
      console.warn(`Module status change: ${payload.moduleId} is now ${payload.status}`);

      // Notify the event system about important module status changes
      if (payload.status === 'critical' || payload.status === 'offline') {
        eventSystemComm.sendMessage('broadcast', 'system-alert', {
          level: payload.status === 'critical' ? 'warning' : 'error',
          message: `Module ${payload.moduleId} is ${payload.status}`,
          timestamp: Date.now(),
        });
      }
    }
  );

  // Start the game loop
  gameLoopManager.start();

  // Register a critical update with the game loop
  gameLoopManager.registerUpdate(
    'event-system-critical',
    (_deltaTime: number, _elapsedTime: number) => {
      // Process critical events
    },
    UpdatePriority.CRITICAL
  );

  // Register a normal update with the game loop
  gameLoopManager.registerUpdate(
    'event-system-normal',
    (_deltaTime: number, _elapsedTime: number) => {
      // Process normal events
    },
    UpdatePriority.NORMAL
  );

  // Create a test event to verify the system is working
  setTimeout(() => {
    moduleEventBus.emit({
      type: 'MODULE_CREATED' as ModuleEventType, // Use a valid ModuleEventType
      moduleId: 'event-system',
      moduleType: 'resource-manager', // Use a valid ModuleType
      timestamp: Date.now(),
      data: { system: 'event-system', status: 'initialized' },
    });

    // Send a test message through system communication
    eventSystemComm.sendMessage('resource-system', 'test-message', {
      message: 'Hello from Event System!',
    });
  }, 100);

  // Return cleanup function
  return () => {
    console.warn('Cleaning up Event System...');

    // Unregister game loop updates
    gameLoopManager.unregisterUpdate('event-system-critical');
    gameLoopManager.unregisterUpdate('event-system-normal');

    // Unregister event handlers
    unregisterSystemStartup();
    unregisterResourceEvents();
    unregisterModuleEvents();

    // Stop the game loop
    gameLoopManager.stop();

    // Clean up RxJS integration
    rxjsCleanup();
  };
}

/**
 * Initialize global event handlers
 */
export function initializeGlobalEventHandlers(): () => void {
  console.warn('Initializing Global Event Handlers...');

  // Create a priority queue for processing events
  const eventQueue = new EventPriorityQueue<PriorityQueueEvent>(event => {
    console.warn(`Processing event: ${event?.type}`);
    // Process the event based on its type
    return Promise.resolve();
  });

  // Subscribe to all module events
  const unsubscribe = subscribeToAllEvents(event => {
    // Enqueue the event for processing
    eventQueue.enqueue({
      type: event?.type,
      priority: getPriorityForEventType(event?.type),
      data: event,
    });
  });

  // Return cleanup function
  return () => {
    console.warn('Cleaning up Global Event Handlers...');

    // Unsubscribe from all events
    unsubscribe();

    // Clear the event queue
    eventQueue.clear();
  };
}

/**
 * Helper function to subscribe to all event types
 */
function subscribeToAllEvents(callback: (event: ModuleEvent) => void): () => void {
  // List of all event types we want to subscribe to
  const eventTypes: ModuleEventType[] = [
    'MODULE_CREATED',
    'MODULE_UPDATED',
    'MODULE_ATTACHED',
    'MODULE_DETACHED',
    'RESOURCE_PRODUCED',
    'RESOURCE_CONSUMED',
    'RESOURCE_TRANSFERRED',
    'STATUS_CHANGED',
    'ERROR_OCCURRED',
  ] as ModuleEventType[];

  // Subscribe to each event type
  const unsubscribers = eventTypes.map(type => moduleEventBus.subscribe(type, callback));

  // Return a function that unsubscribes from all
  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
}

/**
 * Get priority for an event type
 */
function getPriorityForEventType(type: string): number {
  // Define priorities for different event types
  switch (type) {
    case 'ERROR_OCCURRED':
      return 0; // CRITICAL

    case 'RESOURCE_SHORTAGE':
    case 'MODULE_DETACHED':
      return 1; // HIGH

    case 'MODULE_CREATED':
    case 'MODULE_ATTACHED':
    case 'RESOURCE_PRODUCED':
    case 'RESOURCE_CONSUMED':
      return 2; // NORMAL

    case 'STATUS_CHANGED':
    case 'AUTOMATION_CYCLE_COMPLETE':
      return 3; // LOW

    case 'MISSION_PROGRESS_UPDATED':
      return 4; // BACKGROUND

    default:
      return 2; // Default to NORMAL priority
  }
}

/**
 * Initialize the entire event system
 */
export function initializeCompleteEventSystem(): () => void {
  // Initialize all components
  const eventSystemCleanup = initializeEventSystem();
  const globalHandlersCleanup = initializeGlobalEventHandlers();
  const automationSystemCleanup = initializeAutomationSystem();
  const gameSystemsIntegrationCleanup = integrateWithGameSystems();

  // Return combined cleanup function
  return () => {
    gameSystemsIntegrationCleanup();
    automationSystemCleanup();
    globalHandlersCleanup();
    eventSystemCleanup();
  };
}

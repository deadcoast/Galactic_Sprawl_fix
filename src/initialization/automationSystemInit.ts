import { moduleEventBus, ModuleEventType } from '../lib/modules/ModuleEvents';
import { GlobalAutomationManager } from '../managers/automation/GlobalAutomationManager';
import { MessagePriority } from '../utils/events/EventCommunication';
import { ResourceType } from './../types/resources/ResourceTypes';

/**
 * Initialize the automation system
 */
export function initializeAutomationSystem(): () => void {
  console.warn('Initializing Automation System...');

  // The AutomationManager dependency is now injected via the registry when
  // GlobalAutomationManager is first instantiated in getGlobalAutomationManager().
  // globalAutomationManager.setAutomationManager(automationManager); // No longer needed

  // Initialize the global automation manager
  GlobalAutomationManager.getInstance().initialize().catch(error => {
    console.error('Failed to initialize automation system:', error);
  });

  // Register default routines
  registerDefaultRoutines();

  // Emit initialization event
  moduleEventBus.emit({
    type: 'AUTOMATION_STARTED' as ModuleEventType,
    moduleId: 'automation-system',
    moduleType: 'resource-manager',
    timestamp: Date.now(),
    data: {
      status: 'initialized',
      routineCount: GlobalAutomationManager.getInstance().getAllRoutines().length,
    },
  });

  // Return cleanup function
  return () => {
    console.warn('Cleaning up Automation System...');

    // Clean up global automation manager
    GlobalAutomationManager.getInstance().dispose().catch(error => {
      console.error('Failed to dispose automation system:', error);
    });
  };
}

/**
 * Register default automation routines
 */
function registerDefaultRoutines(): void {
  // Register resource balancing routine
  GlobalAutomationManager.getInstance().registerRoutine({
    id: 'default-resource-balancing',
    name: 'Resource Balancing',
    type: 'resource-balancing',
    description: 'Automatically balances resources between systems',
    enabled: true,
    priority: MessagePriority.NORMAL,
    interval: 300000, // 5 minutes
    conditions: [
      {
        type: 'RESOURCE_BELOW',
        target: ResourceType.ENERGY,
        value: 100,
      },
    ],
    actions: [
      {
        type: 'TRANSFER_RESOURCES',
        target: 'resource-system',
        value: {
          from: 'global-storage',
          to: 'energy-system',
          amount: 50,
          type: ResourceType.ENERGY,
        },
      },
    ],
    systems: ['resource-system', 'module-system'],
    tags: ['resource', 'balancing', ResourceType.ENERGY],
  });

  // Register performance optimization routine
  GlobalAutomationManager.getInstance().registerRoutine({
    id: 'default-performance-optimization',
    name: 'Performance Optimization',
    type: 'performance-optimization',
    description: 'Optimizes system performance periodically',
    enabled: true,
    priority: MessagePriority.LOW,
    interval: 1800000, // 30 minutes
    conditions: [],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'STATUS_CHANGED' as ModuleEventType,
        value: {
          eventType: 'STATUS_CHANGED',
          moduleId: 'performance-optimizer',
          moduleType: 'resource-manager',
          data: {
            status: 'optimizing',
            target: 'all',
          },
        },
      },
    ],
    systems: ['resource-system', 'module-system', 'game-loop'],
    tags: ['performance', 'optimization'],
  });

  // Register emergency response routine
  GlobalAutomationManager.getInstance().registerRoutine({
    id: 'default-emergency-response',
    name: 'Error Recovery',
    type: 'emergency-response',
    description: 'Responds to critical system errors',
    enabled: true,
    priority: MessagePriority.CRITICAL,
    interval: 0, // Event-based
    conditions: [],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'STATUS_CHANGED' as ModuleEventType,
        value: {
          eventType: 'STATUS_CHANGED',
          moduleId: 'error-recovery',
          moduleType: 'resource-manager',
          data: {
            status: 'recovering',
            target: 'all',
          },
        },
      },
    ],
    systems: ['resource-system', 'module-system', 'event-system'],
    tags: ['emergency', 'error', 'recovery'],
  });

  // Register system maintenance routine
  GlobalAutomationManager.getInstance().registerRoutine({
    id: 'default-system-maintenance',
    name: 'System Maintenance',
    type: 'system-maintenance',
    description: 'Performs regular system maintenance',
    enabled: true,
    priority: MessagePriority.LOW,
    interval: 3600000, // 1 hour
    conditions: [],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'STATUS_CHANGED' as ModuleEventType,
        value: {
          eventType: 'STATUS_CHANGED',
          moduleId: 'system-maintenance',
          moduleType: 'resource-manager',
          data: {
            status: 'maintaining',
            target: 'all',
          },
        },
      },
    ],
    systems: ['resource-system', 'module-system', 'game-loop'],
    tags: ['maintenance', 'system'],
  });

  console.warn('Registered default automation routines');
}

/**
 * Initialize the complete automation system
 */
export function initializeCompleteAutomationSystem(): () => void {
  return initializeAutomationSystem();
}

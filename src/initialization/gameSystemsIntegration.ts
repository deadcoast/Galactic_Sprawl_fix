import { moduleEventBus } from '../lib/modules/ModuleEvents';
import { CombatManager } from '../managers/ManagerRegistry';
import { gameLoopManager, UpdatePriority } from '../managers/game/GameLoopManager';
import { ResourceManager } from '../managers/game/ResourceManager';
import { isTechTreeNodeUnlockedEvent, TechTreeManager } from '../managers/game/techTreeManager';
import { MiningResourceIntegration } from '../managers/mining/MiningResourceIntegration';
import { MiningShipManagerImpl } from '../managers/mining/MiningShipManager';
import { ResourceCostManager } from '../managers/resource/ResourceCostManager';
import { ResourceExchangeManager } from '../managers/resource/ResourceExchangeManager';
import { ResourceFlowManager } from '../managers/resource/ResourceFlowManager';
import { ResourceIntegration } from '../managers/resource/ResourceIntegration';
import { ResourcePoolManager } from '../managers/resource/ResourcePoolManager';
import { ResourceStorageManager } from '../managers/resource/ResourceStorageManager';
import { ResourceThresholdManager } from '../managers/resource/ResourceThresholdManager';
import { errorLoggingService } from '../services/ErrorLoggingService';
import { EventType } from '../types/events/EventTypes';
import { getSystemCommunication, SystemMessage } from '../utils/events/EventCommunication';
import { EventPriorityQueue } from '../utils/events/EventFiltering';
import { getService } from '../utils/services/ServiceAccess';
import { ResourceType } from './../types/resources/ResourceTypes';

// Define types for message payloads
interface ResourceUpdatePayload {
  resourceType: ResourceType;
  [key: string]: unknown;
}

interface MiningUpdatePayload {
  shipId: string;
  [key: string]: unknown;
}

interface CombatUpdatePayload {
  type: string;
  [key: string]: unknown;
}

interface TechUpdatePayload {
  nodeId: string;
  node?: {
    category: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Type Guards
function isResourceUpdatePayload(payload: unknown): payload is ResourceUpdatePayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'resourceType' in payload &&
    typeof (payload as Record<string, unknown>).resourceType === 'string' &&
    Object.values(ResourceType).includes((payload as ResourceUpdatePayload).resourceType)
  );
}

function isMiningUpdatePayload(payload: unknown): payload is MiningUpdatePayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'shipId' in payload &&
    typeof (payload as Record<string, unknown>).shipId === 'string'
  );
}

function isCombatUpdatePayload(payload: unknown): payload is CombatUpdatePayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'type' in payload &&
    typeof (payload as Record<string, unknown>).type === 'string'
  );
}

function isTechUpdatePayload(payload: unknown): payload is TechUpdatePayload {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('nodeId' in payload) ||
    typeof (payload as Record<string, unknown>).nodeId !== 'string'
  ) {
    return false;
  }
  // Check 'node' structure only if it exists
  if ('node' in payload) {
    const { node } = payload as Record<string, unknown>;
    if (typeof node !== 'object' || node === null || !('category' in node)) {
      // Node exists but has wrong structure - treat as invalid for safety?
      // Or allow it if partial node updates are possible?
      // For now, let's be strict:
      // console.warn("Invalid node structure in TechUpdatePayload", node);
      // return false;
      // Or allow it if node is optional:
      return true;
    }
  }
  return true;
}

/**
 * Integrates the event system with existing game systems
 */
export function integrateWithGameSystems(): () => void {
  console.warn('Integrating Event System with Game Systems...');

  // Get system communications
  const resourceSystemComm = getSystemCommunication('resource-system');
  const miningSystemComm = getSystemCommunication('mining-system');
  const combatSystemComm = getSystemCommunication('combat-system');
  const techSystemComm = getSystemCommunication('tech-system');

  // Initialize cleanup functions array
  const cleanupFunctions: Array<() => void> = [];

  // ===== Resource System Integration =====

  // Get resource system instances using type-safe access pattern
  const resourceManager = getService<ResourceManager>('resourceManager');
  const thresholdManager = getService<ResourceThresholdManager>('thresholdManager');
  const flowManager = getService<ResourceFlowManager>('flowManager');
  const storageManager = getService<ResourceStorageManager>('storageManager');
  const costManager = getService<ResourceCostManager>('costManager');
  const exchangeManager = getService<ResourceExchangeManager>('exchangeManager');
  const poolManager = getService<ResourcePoolManager>('poolManager');

  if (resourceManager) {
    // Make sure all required managers are available
    if (
      thresholdManager &&
      flowManager &&
      storageManager &&
      costManager &&
      exchangeManager &&
      poolManager
    ) {
      // Create resource integration
      const resourceIntegration = new ResourceIntegration(
        resourceManager,
        thresholdManager,
        flowManager,
        storageManager,
        costManager,
        exchangeManager,
        poolManager
      );

      // Initialize resource integration
      resourceIntegration.initialize();

      // Register resource system event handlers
      const unregisterResourceHandler = resourceSystemComm.registerHandler(
        'resource-update',
        (message: SystemMessage) => {
          try {
            if (!isResourceUpdatePayload(message.payload)) {
              console.error('Invalid resource update payload:', message.payload);
              return;
            }
            const { payload } = message;

            console.warn(`Resource update message received: ${payload.resourceType}`);

            // Emit resource event
            moduleEventBus.emit({
              type: 'RESOURCE_UPDATED',
              moduleId: 'resource-system',
              moduleType: 'resource-manager',
              timestamp: Date.now(),
              data: payload,
            });
          } catch (error) {
            console.error(
              'Error handling resource update:',
              error instanceof Error ? error.message : error
            );
          }
        }
      );

      // Add cleanup function
      cleanupFunctions.push(() => {
        unregisterResourceHandler();
        // Additional resource system cleanup if needed
      });

      console.warn('Resource System integrated with Event System');
    } else {
      console.warn('Some resource managers are missing, skipping resource integration');
    }
  } else {
    console.warn('Resource Manager not available. Resource system integration skipped.');
  }

  // ===== Mining System Integration =====

  // Get mining system instance using type-safe access pattern
  const miningManager = getService<MiningShipManagerImpl>('miningManager');

  if (miningManager && thresholdManager && flowManager) {
    // Create mining resource integration
    const miningResourceIntegration = new MiningResourceIntegration(
      miningManager,
      thresholdManager,
      flowManager
    );

    // Initialize mining resource integration
    miningResourceIntegration.initialize();

    // Register mining system event handlers
    const unregisterMiningHandler = miningSystemComm.registerHandler(
      'mining-update',
      (message: SystemMessage) => {
        try {
          if (!isMiningUpdatePayload(message.payload)) {
            console.error('Invalid mining update payload:', message.payload);
            return;
          }
          const { payload } = message;

          console.warn(`Mining update message received: ${payload.shipId}`);

          // Emit mining event
          moduleEventBus.emit({
            type: 'MODULE_UPDATED',
            moduleId: payload.shipId,
            moduleType: 'mineral',
            timestamp: Date.now(),
            data: payload,
          });
        } catch (error) {
          console.error(
            'Error handling mining update:',
            error instanceof Error ? error.message : error
          );
        }
      }
    );

    // Add cleanup function
    cleanupFunctions.push(() => {
      unregisterMiningHandler();
      // Additional mining system cleanup if needed
    });

    console.warn('Mining System integrated with Event System');
  } else {
    console.warn('Mining Manager not available. Mining system integration skipped.');
  }

  // ===== Combat System Integration =====

  // Get combat system instance using type-safe access pattern
  const combatManager = getService<CombatManager>('combatManager');

  if (combatManager) {
    // Create a priority queue for combat events
    const combatEventQueue = new EventPriorityQueue<{
      type: string;
      priority: number;
      data: unknown;
    }>(event => {
      try {
        console.warn(`Processing combat event: ${event?.type}`);
        // Process the combat event
        return Promise.resolve();
      } catch (error) {
        console.error('Error processing combat event:', error);
        return Promise.resolve();
      }
    });

    // Register combat system event handlers
    const unregisterCombatHandler = combatSystemComm.registerHandler(
      'combat-update',
      (message: SystemMessage) => {
        try {
          if (!isCombatUpdatePayload(message.payload)) {
            console.error('Invalid combat update payload:', message.payload);
            return;
          }
          const { payload } = message;

          console.warn(`Combat update message received: ${payload.type}`);

          // Enqueue combat event with appropriate priority
          combatEventQueue.enqueue({
            type: payload.type,
            priority: getCombatEventPriority(payload.type),
            data: payload,
          });

          // Emit combat event
          moduleEventBus.emit({
            type: 'COMBAT_UPDATED',
            moduleId: 'combat-system',
            moduleType: 'defense',
            timestamp: Date.now(),
            data: payload,
          });
        } catch (error) {
          console.error(
            'Error handling combat update:',
            error instanceof Error ? error.message : error
          );
        }
      }
    );

    // Register game loop update for combat event processing
    gameLoopManager.registerUpdate(
      'combat-event-processing',
      (_: number) => {
        try {
          // Process combat events based on priority
          // We can't directly access the private methods, so we'll just let the queue
          // process events on its own (it does this automatically when events are enqueued)
          // The queue will use the processor function we provided in the constructor
        } catch (error) {
          console.error('Error in combat event processing:', error);
        }
      },
      UpdatePriority.HIGH
    );

    // Add cleanup function
    cleanupFunctions.push(() => {
      unregisterCombatHandler();
      gameLoopManager.unregisterUpdate('combat-event-processing');
      combatEventQueue.clear();
      // Additional combat system cleanup if needed
    });

    console.warn('Combat System integrated with Event System');
  } else {
    console.warn('Combat Manager not available. Combat system integration skipped.');
  }

  // ===== Tech Tree System Integration =====

  // Get the TechTreeManager instance
  const techTreeManager = TechTreeManager.getInstance();

  if (techTreeManager) {
    // Tech unlocked listener
    const techUnlockedListener = (data: unknown) => {
      try {
        if (!isTechUpdatePayload(data)) {
          console.error('Invalid tech unlocked data:', data);
          return;
        }
        const payload = data;

        if (!payload.node) {
          console.warn('Tech unlocked payload missing node details:', payload);
          // Decide if we should proceed without node details or return
          // return;
        }

        console.log('Tech unlocked:', payload.nodeId, payload.node?.category);

        // Notify the rest of the game that a tech was unlocked
        moduleEventBus.emit({
          type: 'TECH_UNLOCKED',
          moduleId: 'tech-tree',
          moduleType: 'resource-manager',
          timestamp: Date.now(),
          data: payload,
        });

        // Handle different tech categories
        switch (payload.node.category) {
          case 'mining':
          case 'miningFleet':
            // Notify mining systems of the new tech
            console.log('Mining tech unlocked:', payload.nodeId);
            break;

          case 'warFleet':
          case 'weapons':
          case 'defense':
            // Notify combat systems of the new tech
            console.log('Combat tech unlocked:', payload.nodeId);
            break;

          case 'infrastructure':
            // Notify resource and production systems
            console.log('Infrastructure tech unlocked:', payload.nodeId);
            break;

          case 'special':
            // Special techs might need custom handling
            console.log('Special tech unlocked:', payload.nodeId);
            break;

          default:
            // Unknown category
            console.log('Unknown tech category unlocked:', payload.node.category);
        }
      } catch (error) {
        console.error(
          'Error handling tech unlocked event:',
          error instanceof Error ? error.message : error
        );
      }
    };

    // Register the listener using subscribe
    techTreeManager.on('nodeUnlocked', techUnlockedListener);

    // Register tech system event handlers
    const unregisterTechHandler = techSystemComm.registerHandler(
      'tech-update',
      (message: SystemMessage) => {
        try {
          if (!isTechUpdatePayload(message.payload)) {
            console.error('Invalid tech update payload:', message.payload);
            return;
          }
          const { payload } = message;

          console.warn(`Tech update message received: ${payload.nodeId}`);

          // Emit tech event
          moduleEventBus.emit({
            type: 'TECH_UPDATED',
            moduleId: 'tech-system',
            moduleType: ResourceType.RESEARCH,
            timestamp: Date.now(),
            data: payload,
          });

          // Check if this is a tech unlock event
          if (payload.node?.category) {
            techUnlockedListener(payload);
          }
        } catch (error) {
          console.error(
            'Error handling tech update:',
            error instanceof Error ? error.message : error
          );
        }
      }
    );

    // Add cleanup function
    cleanupFunctions.push(() => {
      techTreeManager.off('nodeUnlocked', techUnlockedListener);
      unregisterTechHandler();
      // Additional tech system cleanup if needed
    });

    console.warn('Tech Tree System integrated with Event System');
  }

  // Return a cleanup function
  return () => {
    console.warn('Cleaning up Game Systems Integration...');

    // Execute all cleanup functions
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error during cleanup:', error instanceof Error ? error.message : error);
      }
    });
  };
}

/**
 * Get priority for a combat event type
 */
function getCombatEventPriority(type: string): number {
  // Define priorities for different combat event types
  switch (type) {
    case 'unit-destroyed':
    case 'critical-damage':
      return 0; // CRITICAL

    case 'unit-under-attack':
    case 'zone-under-attack':
      return 1; // HIGH

    case 'unit-moved':
    case 'weapon-fired':
      return 2; // NORMAL

    case 'unit-status-changed':
    case 'zone-status-changed':
      return 3; // LOW

    case 'combat-stats-updated':
      return 4; // BACKGROUND

    default:
      return 2; // Default to NORMAL priority
  }
}

function setupCrossManagerCommunication() {
  // Example: Technology unlocks affecting mining efficiency
  eventSystem.subscribe(EventType.TECH_NODE_UNLOCKED, (payload: unknown) => {
    // Tech Tree Updates
    if (isTechTreeNodeUnlockedEvent(payload)) {
      // Ensure node exists before proceeding
      if (!payload.node) {
        errorLoggingService.logWarn('Received TECH_NODE_UNLOCKED event without node data', {
          system: 'gameSystemsIntegration',
          event: EventType.TECH_NODE_UNLOCKED,
          nodeId: payload.nodeId,
          payload: payload,
        });
        return; // Exit if node is missing
      }

      const techManager = TechTreeManager.getInstance();
      techManager?.updateNodeStatus(payload.nodeId, true);
      errorLoggingService.logInfo(`Tech unlocked: ${payload.nodeId}`, {
        system: 'gameSystemsIntegration',
        event: EventType.TECH_NODE_UNLOCKED,
        nodeId: payload.nodeId,
        category: payload.node.category,
      });

      // Trigger downstream effects based on tech category
      switch (payload.node.category) {
        case 'mining':
        case 'miningFleet':
          errorLoggingService.logInfo(`Mining tech unlocked: ${payload.nodeId}`, {
            system: 'gameSystemsIntegration',
            event: EventType.TECH_NODE_UNLOCKED,
            nodeId: payload.nodeId,
            category: payload.node.category,
          });
          // Example: Unlock new mining modules or improve efficiency
          break;
        case 'combat':
          errorLoggingService.logInfo(`Combat tech unlocked: ${payload.nodeId}`, {
            system: 'gameSystemsIntegration',
            event: EventType.TECH_NODE_UNLOCKED,
            nodeId: payload.nodeId,
            category: 'combat',
          });
          // Example: Unlock new weapons or ship classes
          break;
        case 'infrastructure':
          errorLoggingService.logInfo(`Infrastructure tech unlocked: ${payload.nodeId}`, {
            system: 'gameSystemsIntegration',
            event: EventType.TECH_NODE_UNLOCKED,
            nodeId: payload.nodeId,
            category: 'infrastructure',
          });
          // Example: Improve building speed or resource storage
          break;
        case 'special':
          errorLoggingService.logInfo(`Special tech unlocked: ${payload.nodeId}`, {
            system: 'gameSystemsIntegration',
            event: EventType.TECH_NODE_UNLOCKED,
            nodeId: payload.nodeId,
            category: 'special',
          });
          // Example: Trigger unique game events or unlock powerful abilities
          break;
        default:
          errorLoggingService.logWarn(`Unknown tech category unlocked: ${payload.node.category}`, {
            system: 'gameSystemsIntegration',
            event: EventType.TECH_NODE_UNLOCKED,
            nodeId: payload.nodeId,
            category: payload.node.category,
          });
      }
    }
    // ... (rest of the event handlers)
  });

  // ... other event subscriptions
}

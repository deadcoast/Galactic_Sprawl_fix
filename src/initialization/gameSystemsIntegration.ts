import { moduleEventBus, ModuleEventType } from '../lib/modules/ModuleEvents';
import { CombatManager } from '../managers/combat/combatManager';
import { gameLoopManager, UpdatePriority } from '../managers/game/GameLoopManager';
import { ResourceManager } from '../managers/game/ResourceManager';
import { techTreeManager } from '../managers/game/techTreeManager';
import { MiningResourceIntegration } from '../managers/mining/MiningResourceIntegration';
import { MiningShipManagerImpl } from '../managers/mining/MiningShipManagerImpl';
import { ResourceCostManager } from '../managers/resource/ResourceCostManager';
import { ResourceExchangeManager } from '../managers/resource/ResourceExchangeManager';
import { ResourceFlowManager } from '../managers/resource/ResourceFlowManager';
import { ResourceIntegration } from '../managers/resource/ResourceIntegration';
import { ResourcePoolManager } from '../managers/resource/ResourcePoolManager';
import { ResourceStorageManager } from '../managers/resource/ResourceStorageManager';
import { ResourceThresholdManager } from '../managers/resource/ResourceThresholdManager';
import { ModuleType } from '../types/buildings/ModuleTypes';
import { getSystemCommunication, SystemMessage } from '../utils/events/EventCommunication';
import { EventPriorityQueue } from '../utils/events/EventFiltering';
import { getService } from '../utils/services/ServiceAccess';

// Define types for message payloads
interface ResourceUpdatePayload {
  resourceType: string;
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
            const payload = message.payload as ResourceUpdatePayload;
            if (!payload || typeof payload.resourceType !== 'string') {
              console.error('Invalid resource update payload:', payload);
              return;
            }

            console.warn(`Resource update message received: ${payload.resourceType}`);

            // Emit resource event
            moduleEventBus.emit({
              type: 'RESOURCE_UPDATED' as ModuleEventType,
              moduleId: 'resource-system',
              moduleType: 'resource-manager' as ModuleType,
              timestamp: Date.now(),
              data: payload,
            });
          } catch (error) {
            console.error('Error handling resource update:', error);
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
          const payload = message.payload as MiningUpdatePayload;
          if (!payload || typeof payload.shipId !== 'string') {
            console.error('Invalid mining update payload:', payload);
            return;
          }

          console.warn(`Mining update message received: ${payload.shipId}`);

          // Emit mining event
          moduleEventBus.emit({
            type: 'MODULE_UPDATED' as ModuleEventType,
            moduleId: payload.shipId,
            moduleType: 'mineral' as ModuleType, // Using a valid ModuleType for mining
            timestamp: Date.now(),
            data: payload,
          });
        } catch (error) {
          console.error('Error handling mining update:', error);
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
        console.warn(`Processing combat event: ${event.type}`);
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
          const payload = message.payload as CombatUpdatePayload;
          if (!payload || typeof payload.type !== 'string') {
            console.error('Invalid combat update payload:', payload);
            return;
          }

          console.warn(`Combat update message received: ${payload.type}`);

          // Enqueue combat event with appropriate priority
          combatEventQueue.enqueue({
            type: payload.type,
            priority: getCombatEventPriority(payload.type),
            data: payload,
          });

          // Emit combat event
          moduleEventBus.emit({
            type: 'COMBAT_UPDATED' as ModuleEventType,
            moduleId: 'combat-system',
            moduleType: 'defense' as ModuleType, // Using a valid ModuleType for combat
            timestamp: Date.now(),
            data: payload,
          });
        } catch (error) {
          console.error('Error handling combat update:', error);
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

  if (techTreeManager) {
    // Tech unlocked listener
    const techUnlockedListener = (data: unknown) => {
      try {
        const techData = data as TechUpdatePayload;
        if (!techData || !techData.nodeId || !techData.node || !techData.node.category) {
          return;
        }

        console.warn(`Tech node unlocked: ${techData.nodeId}`);

        // Emit tech unlocked event
        moduleEventBus.emit({
          type: 'TECH_UNLOCKED' as ModuleEventType,
          moduleId: 'tech-system',
          moduleType: 'research' as ModuleType, // Using a valid ModuleType for tech
          timestamp: Date.now(),
          data: {
            nodeId: techData.nodeId,
            node: techData.node,
          },
        });

        // Send message to other systems
        techSystemComm.sendMessage('resource-system', 'tech-unlocked', {
          nodeId: techData.nodeId,
          category: techData.node.category,
        });

        // If it's a combat tech, notify combat system
        if (
          techData.node.category &&
          ['warFleet', 'weapons', 'defense'].includes(techData.node.category)
        ) {
          techSystemComm.sendMessage('combat-system', 'tech-unlocked', {
            nodeId: techData.nodeId,
            category: techData.node.category,
          });
        }

        // If it's a mining tech, notify mining system
        if (techData.node.category && ['miningFleet'].includes(techData.node.category)) {
          techSystemComm.sendMessage('mining-system', 'tech-unlocked', {
            nodeId: techData.nodeId,
            category: techData.node.category,
          });
        }
      } catch (error) {
        console.error('Error in tech unlocked listener:', error);
      }
    };

    // Register the listener
    techTreeManager.on('nodeUnlocked', techUnlockedListener);

    // Register tech system event handlers
    const unregisterTechHandler = techSystemComm.registerHandler(
      'tech-update',
      (message: SystemMessage) => {
        try {
          const payload = message.payload as TechUpdatePayload;
          if (!payload || typeof payload.nodeId !== 'string') {
            console.error('Invalid tech update payload:', payload);
            return;
          }

          console.warn(`Tech update message received: ${payload.nodeId}`);

          // Emit tech event
          moduleEventBus.emit({
            type: 'TECH_UPDATED' as ModuleEventType,
            moduleId: 'tech-system',
            moduleType: 'research' as ModuleType, // Using a valid ModuleType for tech
            timestamp: Date.now(),
            data: payload,
          });

          // Check if this is a tech unlock event
          if (payload.node && payload.node.category) {
            techUnlockedListener(payload);
          }
        } catch (error) {
          console.error('Error handling tech update:', error);
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
        console.error('Error during cleanup:', error);
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

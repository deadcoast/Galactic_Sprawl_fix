import { moduleEventBus, ModuleEventType } from '../lib/modules/ModuleEvents';
import { getSystemCommunication, SystemId } from '../utils/events/EventCommunication';
import { gameLoopManager, UpdatePriority } from '../managers/game/GameLoopManager';
import { ResourceManager } from '../managers/game/ResourceManager';
import { ResourceThresholdManager } from '../managers/resource/ResourceThresholdManager';
import { ResourceFlowManager } from '../managers/resource/ResourceFlowManager';
import { ResourceStorageManager } from '../managers/resource/ResourceStorageManager';
import { ResourceCostManager } from '../managers/resource/ResourceCostManager';
import { ResourceExchangeManager } from '../managers/resource/ResourceExchangeManager';
import { ResourcePoolManager } from '../managers/resource/ResourcePoolManager';
import { ResourceIntegration } from '../managers/resource/ResourceIntegration';
import { MiningShipManagerImpl } from '../managers/mining/MiningShipManagerImpl';
import { MiningResourceIntegration } from '../managers/mining/MiningResourceIntegration';
import { CombatManager } from '../managers/combat/combatManager';
import { techTreeManager } from '../managers/game/techTreeManager';
import { EventPriorityQueue } from '../utils/events/EventFiltering';
import { ModuleType } from '../types/buildings/ModuleTypes';

/**
 * Integrates the event system with existing game systems
 */
export function integrateWithGameSystems(): () => void {
  console.log('Integrating Event System with Game Systems...');
  
  // Get system communications
  const eventSystemComm = getSystemCommunication('event-system');
  const resourceSystemComm = getSystemCommunication('resource-system');
  const miningSystemComm = getSystemCommunication('mining-system');
  const combatSystemComm = getSystemCommunication('combat-system');
  const techSystemComm = getSystemCommunication('tech-system');
  
  // Initialize cleanup functions array
  const cleanupFunctions: Array<() => void> = [];
  
  // ===== Resource System Integration =====
  
  // Get resource system instances
  const resourceManager = (window as any).resourceManager as ResourceManager;
  const thresholdManager = (window as any).thresholdManager as ResourceThresholdManager;
  const flowManager = (window as any).flowManager as ResourceFlowManager;
  const storageManager = (window as any).storageManager as ResourceStorageManager;
  const costManager = (window as any).costManager as ResourceCostManager;
  const exchangeManager = (window as any).exchangeManager as ResourceExchangeManager;
  const poolManager = (window as any).poolManager as ResourcePoolManager;
  
  if (resourceManager) {
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
    const unregisterResourceHandler = resourceSystemComm.registerHandler('resource-update', (message) => {
      try {
        console.log(`Resource update message received: ${message.payload.resourceType}`);
        
        // Emit resource event
        moduleEventBus.emit({
          type: 'RESOURCE_UPDATED' as ModuleEventType,
          moduleId: 'resource-system',
          moduleType: 'resource-manager' as ModuleType,
          timestamp: Date.now(),
          data: message.payload
        });
      } catch (error) {
        console.error('Error handling resource update:', error);
      }
    });
    
    // Add cleanup function
    cleanupFunctions.push(() => {
      unregisterResourceHandler();
      // Additional resource system cleanup if needed
    });
    
    console.log('Resource System integrated with Event System');
  }
  
  // ===== Mining System Integration =====
  
  // Get mining system instance
  const miningManager = (window as any).miningManager as MiningShipManagerImpl;
  
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
    const unregisterMiningHandler = miningSystemComm.registerHandler('mining-update', (message) => {
      try {
        console.log(`Mining update message received: ${message.payload.shipId}`);
        
        // Emit mining event
        moduleEventBus.emit({
          type: 'MODULE_UPDATED' as ModuleEventType,
          moduleId: message.payload.shipId,
          moduleType: 'mineral' as ModuleType, // Using a valid ModuleType for mining
          timestamp: Date.now(),
          data: message.payload
        });
      } catch (error) {
        console.error('Error handling mining update:', error);
      }
    });
    
    // Add cleanup function
    cleanupFunctions.push(() => {
      unregisterMiningHandler();
      // Additional mining system cleanup if needed
    });
    
    console.log('Mining System integrated with Event System');
  }
  
  // ===== Combat System Integration =====
  
  // Get combat system instance
  const combatManager = (window as any).combatManager as CombatManager;
  
  if (combatManager) {
    // Create a priority queue for combat events
    const combatEventQueue = new EventPriorityQueue<any>((event) => {
      try {
        console.log(`Processing combat event: ${event.type}`);
        // Process the combat event
        return Promise.resolve();
      } catch (error) {
        console.error('Error processing combat event:', error);
        return Promise.resolve();
      }
    });
    
    // Register combat system event handlers
    const unregisterCombatHandler = combatSystemComm.registerHandler('combat-update', (message) => {
      try {
        console.log(`Combat update message received: ${message.payload.type}`);
        
        // Enqueue combat event with appropriate priority
        combatEventQueue.enqueue({
          type: message.payload.type,
          priority: getCombatEventPriority(message.payload.type),
          data: message.payload
        });
        
        // Emit combat event
        moduleEventBus.emit({
          type: 'COMBAT_UPDATED' as ModuleEventType,
          moduleId: 'combat-system',
          moduleType: 'defense' as ModuleType, // Using a valid ModuleType for combat
          timestamp: Date.now(),
          data: message.payload
        });
      } catch (error) {
        console.error('Error handling combat update:', error);
      }
    });
    
    // Register game loop update for combat event processing
    gameLoopManager.registerUpdate(
      'combat-event-processing',
      (deltaTime: number) => {
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
    
    console.log('Combat System integrated with Event System');
  }
  
  // ===== Tech Tree System Integration =====
  
  if (techTreeManager) {
    // Subscribe to tech tree events
    const techUnlockedListener = (data: any) => {
      try {
        console.log(`Tech node unlocked: ${data.nodeId}`);
        
        // Emit tech unlocked event
        moduleEventBus.emit({
          type: 'TECH_UNLOCKED' as ModuleEventType,
          moduleId: 'tech-system',
          moduleType: 'research' as ModuleType, // Using a valid ModuleType for tech
          timestamp: Date.now(),
          data: {
            nodeId: data.nodeId,
            node: data.node
          }
        });
        
        // Send message to other systems
        techSystemComm.sendMessage('resource-system', 'tech-unlocked', {
          nodeId: data.nodeId,
          category: data.node.category
        });
        
        // If it's a combat tech, notify combat system
        if (['warFleet', 'weapons', 'defense'].includes(data.node.category)) {
          techSystemComm.sendMessage('combat-system', 'tech-unlocked', {
            nodeId: data.nodeId,
            category: data.node.category
          });
        }
        
        // If it's a mining tech, notify mining system
        if (['miningFleet'].includes(data.node.category)) {
          techSystemComm.sendMessage('mining-system', 'tech-unlocked', {
            nodeId: data.nodeId,
            category: data.node.category
          });
        }
      } catch (error) {
        console.error('Error handling tech unlocked event:', error);
      }
    };
    
    // Register the listener
    techTreeManager.on('nodeUnlocked', techUnlockedListener);
    
    // Register tech system event handlers
    const unregisterTechHandler = techSystemComm.registerHandler('tech-update', (message) => {
      try {
        console.log(`Tech update message received: ${message.payload.nodeId}`);
        
        // Emit tech event
        moduleEventBus.emit({
          type: 'TECH_UPDATED' as ModuleEventType,
          moduleId: 'tech-system',
          moduleType: 'research' as ModuleType, // Using a valid ModuleType for tech
          timestamp: Date.now(),
          data: message.payload
        });
      } catch (error) {
        console.error('Error handling tech update:', error);
      }
    });
    
    // Add cleanup function
    cleanupFunctions.push(() => {
      techTreeManager.off('nodeUnlocked', techUnlockedListener);
      unregisterTechHandler();
      // Additional tech system cleanup if needed
    });
    
    console.log('Tech Tree System integrated with Event System');
  }
  
  // Return combined cleanup function
  return () => {
    console.log('Cleaning up Game Systems Integration...');
    
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
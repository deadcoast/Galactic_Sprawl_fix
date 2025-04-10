/**
 * Global type definitions for the application
 *
 * This file extends built-in interfaces with application-specific properties
 * to provide type safety for global objects.
 */

import { CombatManager } from '../managers/ManagerRegistry';
import { ResourceManager } from '../managers/game/ResourceManager';
import { MiningShipManagerImpl } from '../managers/mining/MiningShipManagerImpl';
import { ResourceCostManager } from '../managers/resource/ResourceCostManager';
import { ResourceExchangeManager } from '../managers/resource/ResourceExchangeManager';
import { ResourceFlowManager } from '../managers/resource/ResourceFlowManager';
import { ResourcePoolManager } from '../managers/resource/ResourcePoolManager';
import { ResourceStorageManager } from '../managers/resource/ResourceStorageManager';
import { ResourceThresholdManager } from '../managers/resource/ResourceThresholdManager';

/**
 * Extend the Window interface to include our game managers
 * This provides type safety when accessing managers through the window object
 */
declare global {
  interface Window {
    // Resource system managers
    resourceManager?: ResourceManager;
    thresholdManager?: ResourceThresholdManager;
    flowManager?: ResourceFlowManager;
    storageManager?: ResourceStorageManager;
    costManager?: ResourceCostManager;
    exchangeManager?: ResourceExchangeManager;
    poolManager?: ResourcePoolManager;

    // Mining system managers
    miningManager?: MiningShipManagerImpl;

    // Combat system managers
    combatManager?: CombatManager;

    // Add unknown other global properties here as needed
  }
}

// This empty export is needed to make this file a module
export {};

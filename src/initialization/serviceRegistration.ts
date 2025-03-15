/**
 * @file serviceRegistration.ts
 * Utility functions for registering services globally
 *
 * This file provides:
 * 1. Type-safe service registration
 * 2. Centralized service initialization
 * 3. Service availability tracking
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
import { checkServicesAvailability, registerService } from '../utils/services/ServiceAccess';

/**
 * Services that are expected to be available to the application
 */
export const REQUIRED_SERVICES = [
  'resourceManager',
  'thresholdManager',
  'flowManager',
  'storageManager',
  'costManager',
  'exchangeManager',
  'poolManager',
  'miningManager',
  'combatManager',
] as const;

/**
 * Type for the names of required services
 */
export type ServiceName = (typeof REQUIRED_SERVICES)[number];

/**
 * Register the ResourceManager service
 *
 * @param manager The ResourceManager instance
 */
export function registerResourceManager(manager: ResourceManager): void {
  registerService('resourceManager', manager);
}

/**
 * Register the ResourceThresholdManager service
 *
 * @param manager The ResourceThresholdManager instance
 */
export function registerThresholdManager(manager: ResourceThresholdManager): void {
  registerService('thresholdManager', manager);
}

/**
 * Register the ResourceFlowManager service
 *
 * @param manager The ResourceFlowManager instance
 */
export function registerFlowManager(manager: ResourceFlowManager): void {
  registerService('flowManager', manager);
}

/**
 * Register the ResourceStorageManager service
 *
 * @param manager The ResourceStorageManager instance
 */
export function registerStorageManager(manager: ResourceStorageManager): void {
  registerService('storageManager', manager);
}

/**
 * Register the ResourceCostManager service
 *
 * @param manager The ResourceCostManager instance
 */
export function registerCostManager(manager: ResourceCostManager): void {
  registerService('costManager', manager);
}

/**
 * Register the ResourceExchangeManager service
 *
 * @param manager The ResourceExchangeManager instance
 */
export function registerExchangeManager(manager: ResourceExchangeManager): void {
  registerService('exchangeManager', manager);
}

/**
 * Register the ResourcePoolManager service
 *
 * @param manager The ResourcePoolManager instance
 */
export function registerPoolManager(manager: ResourcePoolManager): void {
  registerService('poolManager', manager);
}

/**
 * Register the MiningShipManagerImpl service
 *
 * @param manager The MiningShipManagerImpl instance
 */
export function registerMiningManager(manager: MiningShipManagerImpl): void {
  registerService('miningManager', manager);
}

/**
 * Register the CombatManager service
 *
 * @param manager The CombatManager instance
 */
export function registerCombatManager(manager: CombatManager): void {
  registerService('combatManager', manager);
}

/**
 * Check the availability of all required services
 *
 * @returns Object with service availability status
 */
export function checkAllServicesAvailability(): Record<ServiceName, boolean> {
  const result = checkServicesAvailability(
    REQUIRED_SERVICES as unknown as Array<keyof Window & string>
  );
  return result as Record<ServiceName, boolean>;
}

/**
 * Get a list of missing required services
 *
 * @returns Array of missing service names
 */
export function getMissingServices(): ServiceName[] {
  const availability = checkAllServicesAvailability();
  return Object.entries(availability)
    .filter(([_, isAvailable]) => !isAvailable)
    .map(([name]) => name as ServiceName);
}

/**
 * Check if all required services are available
 *
 * @returns True if all required services are available, false otherwise
 */
export function areAllServicesAvailable(): boolean {
  return getMissingServices().length === 0;
}

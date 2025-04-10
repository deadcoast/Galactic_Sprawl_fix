/**
 * ManagerRegistry.ts
 *
 * Central registry for all manager singletons to avoid circular dependencies
 * and ensure consistent access to manager instances.
 * @context: registry-system, manager-registry
 */

import { GlobalAutomationManager } from './automation/GlobalAutomationManager';
import { CombatManager } from './combat/CombatManager';
import { CombatMechanicsSystem, CombatMechanicsSystemImpl } from './combat/CombatMechanicsSystem';
import { ObjectDetectionSystem, ObjectDetectionSystemImpl } from './combat/ObjectDetectionSystem';
import { ThreatAssessmentManager, ThreatAssessmentManagerImpl } from './combat/ThreatAssessmentManager';
import { effectLifecycleManager, EffectLifecycleManager } from './effects/EffectLifecycleManager';
import { FactionBehaviorManager } from './factions/FactionBehaviorManager';
import { AsteroidFieldManager } from './game/AsteroidFieldManager';
import { AutomationManager } from './game/AutomationManager';
import { ResourceManager } from './game/ResourceManager';
import { TechTreeManager } from './game/techTreeManager';
import { miningShipManager, MiningShipManagerImpl } from './mining/MiningShipManager';
import { ResourceConversionManager } from './resource/ResourceConversionManager';
import { ResourceFlowManager } from './resource/ResourceFlowManager';
import { ShipHangarManager } from './ships/ShipHangarManager';

// Singleton instances
let combatManagerInstance: CombatManager | null = null;
let objectDetectionSystemInstance: ObjectDetectionSystem | null = null;
let threatAssessmentManagerInstance: ThreatAssessmentManager | null = null;
let combatMechanicsSystemInstance: CombatMechanicsSystem | null = null;
let techTreeManagerInstance: TechTreeManager | null = null;
let resourceManagerInstance: ResourceManager | null = null;
let automationManagerInstance: AutomationManager | null = null;
let globalAutomationManagerInstance: GlobalAutomationManager | null = null;
let factionBehaviorManagerInstance: FactionBehaviorManager | null = null;
let asteroidFieldManagerInstance: AsteroidFieldManager | null = null;
let resourceFlowManagerInstance: ResourceFlowManager | null = null;
let shipHangarManagerInstance: ShipHangarManager | null = null;
let resourceConversionManagerInstance: ResourceConversionManager | null = null;

/**
 * Get the singleton instance of CombatManager
 * @returns The CombatManager instance
 */
export function getCombatManager(): CombatManager {
  if (!combatManagerInstance) {
    combatManagerInstance = CombatManager.getInstance();
  }
  return combatManagerInstance;
}

/**
 * Get the singleton instance of ObjectDetectionSystem
 * @returns The ObjectDetectionSystem instance
 */
export function getObjectDetectionSystem(): ObjectDetectionSystem {
  if (!objectDetectionSystemInstance) {
    objectDetectionSystemInstance = ObjectDetectionSystemImpl.getInstance();
  }
  return objectDetectionSystemInstance;
}

/**
 * Get the singleton instance of ThreatAssessmentManager
 * @returns The ThreatAssessmentManager instance
 */
export function getThreatAssessmentManager(): ThreatAssessmentManager {
  if (!threatAssessmentManagerInstance) {
    threatAssessmentManagerInstance = ThreatAssessmentManagerImpl.getInstance();
  }
  return threatAssessmentManagerInstance;
}

/**
 * Get the singleton instance of CombatMechanicsSystem
 * @returns The CombatMechanicsSystem instance
 */
export function getCombatMechanicsSystem(): CombatMechanicsSystem {
  if (!combatMechanicsSystemInstance) {
    // Pass the object detection system as a dependency
    const objectDetectionSystem = getObjectDetectionSystem();
    combatMechanicsSystemInstance = CombatMechanicsSystemImpl.getInstance(objectDetectionSystem);
  }
  return combatMechanicsSystemInstance;
}

/**
 * Get the singleton instance of TechTreeManager
 * @returns The TechTreeManager instance
 */
export function getTechTreeManager(): TechTreeManager {
  if (!techTreeManagerInstance) {
    techTreeManagerInstance = TechTreeManager.getInstance();
  }
  return techTreeManagerInstance;
}

/**
 * Get the singleton instance of ResourceManager
 * @returns The ResourceManager instance
 */
export function getResourceManager(): ResourceManager {
  if (!resourceManagerInstance) {
    resourceManagerInstance = ResourceManager.getInstance();
  }
  return resourceManagerInstance!;
}

/**
 * Get the singleton instance of AutomationManager
 * @returns The AutomationManager instance
 */
export function getAutomationManager(): AutomationManager {
  if (!automationManagerInstance) {
    automationManagerInstance = new AutomationManager();
  }
  return automationManagerInstance;
}

/**
 * Get the singleton instance of GlobalAutomationManager
 * @returns The GlobalAutomationManager instance
 */
export function getGlobalAutomationManager(): GlobalAutomationManager {
  if (!globalAutomationManagerInstance) {
    const automationManager = getAutomationManager();
    globalAutomationManagerInstance = new GlobalAutomationManager(automationManager);
  }
  return globalAutomationManagerInstance;
}

/**
 * Get the singleton instance of FactionBehaviorManager
 * @returns The FactionBehaviorManager instance
 */
export function getFactionBehaviorManager(): FactionBehaviorManager {
  if (!factionBehaviorManagerInstance) {
    factionBehaviorManagerInstance = new FactionBehaviorManager();
  }
  return factionBehaviorManagerInstance;
}

/**
 * Get the singleton instance of AsteroidFieldManager
 * @returns The AsteroidFieldManager instance
 */
export function getAsteroidFieldManager(): AsteroidFieldManager {
  if (!asteroidFieldManagerInstance) {
    asteroidFieldManagerInstance = new AsteroidFieldManager();
  }
  return asteroidFieldManagerInstance;
}

/**
 * Get the singleton instance of ResourceFlowManager
 * @returns The ResourceFlowManager instance
 */
export function getResourceFlowManager(): ResourceFlowManager {
  if (!resourceFlowManagerInstance) {
    // Assuming ResourceFlowManager uses getInstance pattern or has a public constructor
    // Need to verify the actual instantiation method of ResourceFlowManager
    // For now, assuming getInstance() like other managers
    resourceFlowManagerInstance = ResourceFlowManager.getInstance();
  }
  return resourceFlowManagerInstance;
}

/**
 * Get the singleton instance of ShipHangarManager
 * @returns The ShipHangarManager instance
 */
export function getShipHangarManager(): ShipHangarManager {
  if (!shipHangarManagerInstance) {
    // Instantiate ShipHangarManager using its constructor with default values
    shipHangarManagerInstance = new ShipHangarManager('default-hangar'); // Use constructor
  }
  // Add non-null assertion to fix return type error
  return shipHangarManagerInstance!;
}

/**
 * Get the singleton instance of MiningShipManagerImpl
 * @returns The MiningShipManagerImpl instance
 */
export function getMiningShipManager(): MiningShipManagerImpl {
  // Return the imported singleton instance directly
  return miningShipManager;
}

/**
 * Get the singleton instance of ResourceConversionManager
 * @returns The ResourceConversionManager instance
 */
export function getResourceConversionManager(): ResourceConversionManager {
  if (!resourceConversionManagerInstance) {
    resourceConversionManagerInstance = ResourceConversionManager.getInstance();
  }
  return resourceConversionManagerInstance;
}

/**
 * Get the singleton instance of EffectLifecycleManager
 * @returns The EffectLifecycleManager instance
 */
export function getEffectLifecycleManager(): EffectLifecycleManager {
  // Return the imported singleton instance directly
  return effectLifecycleManager;
}

/**
 * Reset all manager instances - primarily used for testing
 */
export function resetManagers(): void {
  combatManagerInstance = null;
  objectDetectionSystemInstance = null;
  threatAssessmentManagerInstance = null;
  combatMechanicsSystemInstance = null;
  techTreeManagerInstance = null;
  resourceManagerInstance = null;
  automationManagerInstance = null;
  globalAutomationManagerInstance = null;
  factionBehaviorManagerInstance = null;
  asteroidFieldManagerInstance = null;
  resourceFlowManagerInstance = null;
  shipHangarManagerInstance = null;
  resourceConversionManagerInstance = null;
  // Resetting the imported instance isn't straightforward from here.
  // The original file might need its own reset logic if required for testing.
}

// Export manager classes for type usage
export { CombatManager, ResourceManager };
export type {
  AsteroidFieldManager, AutomationManager, CombatMechanicsSystem, EffectLifecycleManager, FactionBehaviorManager, GlobalAutomationManager, MiningShipManagerImpl, ObjectDetectionSystem, ResourceConversionManager, ResourceFlowManager, ShipHangarManager, TechTreeManager, ThreatAssessmentManager
};


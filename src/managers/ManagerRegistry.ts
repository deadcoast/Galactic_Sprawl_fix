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
import { FactionBehaviorManager } from './factions/FactionBehaviorManager';
import { AsteroidFieldManager } from './game/AsteroidFieldManager';
import { AutomationManager } from './game/AutomationManager';
import { ResourceManager } from './game/ResourceManager';
import { TechTreeManager } from './game/techTreeManager';

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
}

// Export manager classes for type usage
export { CombatManager };
export type {
    AsteroidFieldManager, AutomationManager, CombatMechanicsSystem, FactionBehaviorManager, GlobalAutomationManager, ObjectDetectionSystem, ResourceManager, TechTreeManager, ThreatAssessmentManager
};


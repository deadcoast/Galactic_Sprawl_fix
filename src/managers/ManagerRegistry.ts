/**
 * ManagerRegistry.ts
 *
 * Central registry for all manager singletons to avoid circular dependencies
 * and ensure consistent access to manager instances.
 * @context: registry-system, manager-registry
 */

import { CombatManager } from './combat/CombatManager';
import { ObjectDetectionSystemImpl, ObjectDetectionSystem } from './combat/ObjectDetectionSystem';
import { ThreatAssessmentManagerImpl, ThreatAssessmentManager } from './combat/ThreatAssessmentManager';
import { CombatMechanicsSystemImpl, CombatMechanicsSystem } from './combat/CombatMechanicsSystem';
import { TechTreeManager } from './game/techTreeManager';

// Singleton instances
let combatManagerInstance: CombatManager | null = null;
let objectDetectionSystemInstance: ObjectDetectionSystem | null = null;
let threatAssessmentManagerInstance: ThreatAssessmentManager | null = null;
let combatMechanicsSystemInstance: CombatMechanicsSystem | null = null;
let techTreeManagerInstance: TechTreeManager | null = null;

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
 * Reset all manager instances - primarily used for testing
 */
export function resetManagers(): void {
  combatManagerInstance = null;
  objectDetectionSystemInstance = null;
  threatAssessmentManagerInstance = null;
  combatMechanicsSystemInstance = null;
  techTreeManagerInstance = null;
}

// Export manager classes for type usage
export { CombatManager };
export type { 
  ObjectDetectionSystem, 
  ThreatAssessmentManager, 
  CombatMechanicsSystem,
  TechTreeManager
};

/**
 * ManagerRegistry.ts
 *
 * Central registry for all manager singletons to avoid circular dependencies
 * and ensure consistent access to manager instances.
 */

import { CombatManager } from './combat/CombatManager';

// Singleton instances
let combatManagerInstance: CombatManager | null = null;

/**
 * Get the singleton instance of CombatManager
 * @returns The CombatManager instance
 */
export function getCombatManager(): CombatManager {
  if (!combatManagerInstance) {
    combatManagerInstance = new CombatManager();
  }
  return combatManagerInstance;
}

/**
 * Reset all manager instances - primarily used for testing
 */
export function resetManagers(): void {
  combatManagerInstance = null;
}

// Export manager classes for type usage
export { CombatManager };

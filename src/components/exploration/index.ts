/**
 * Unified Exploration System
 *
 * This file exports all components of the unified exploration system.
 */

// Export core components
export * from './core';

// Export context
export { ExplorationProvider, useExploration } from './context/ExplorationContext';

// Export system components
export {
  default as GalaxyExplorationSystem,
  type GalaxyExplorationSystemProps,
} from './system/GalaxyExplorationSystem';

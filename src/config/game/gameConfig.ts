import type { GameConfig } from '../../types/config/GameConfigTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';

/**
 * Basic game configuration settings.
 * Placeholder values - adjust as needed.
 */
export const gameConfig: GameConfig = {
  // Initial game state settings
  initialResources: {
    [ResourceType.MINERALS]: 10000,
    [ResourceType.ENERGY]: 5000,
    [ResourceType.POPULATION]: 100,
    [ResourceType.RESEARCH]: 0,
    [ResourceType.FOOD]: 500,
    [ResourceType.WATER]: 1000,
    // Ensure all ResourceType members are covered or add default values
  },
  initialShips: [
    // Define initial player ships if any
    // { type: 'ReconShip', count: 1 }, // Example using potential ship type identifier
    // { type: 'MiningShip', count: 2 },
  ],

  // Game world settings
  worldSize: {
    width: 10000,
    height: 10000,
  },
  sectorCount: 100,
  asteroidDensity: 0.5, // 0 to 1, representing probability or density factor

  // Gameplay settings
  difficulty: 'normal', // Should ideally match the type definition
  gameSpeedMultiplier: 1,
  tickRate: 60, // Target ticks per second for game logic updates
  saveInterval: 300, // Seconds between automatic saves

  // Feature flags controlling major game systems
  features: {
    enableTrading: true,
    enableDiplomacy: true,
    enableCombatAI: true,
    enableStoryEvents: false,
  },

  // Default UI settings
  ui: {
    defaultZoomLevel: 1,
    showGrid: true,
  },
};

// Note: The previous inline interface definition has been moved to
// src/types/config/GameConfigTypes.ts and is now imported and applied.
// Further refinements may include using specific enums for ship types
// and ensuring all ResourceType keys are present in initialResources.

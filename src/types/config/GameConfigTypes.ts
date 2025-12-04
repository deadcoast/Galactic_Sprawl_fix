import { ResourceType } from '../resources/ResourceTypes';

/**
 * Standard difficulty levels
 */
export type StandardDifficulty = 'easy' | 'normal' | 'hard';

/**
 * Difficulty type that allows both standard and custom difficulty levels
 */
export type DifficultyLevel = StandardDifficulty | (string & {});

/**
 * Defines the structure for the main game configuration.
 */
export interface GameConfig {
  initialResources: Record<ResourceType | string, number>; // Allow string for now, ideally migrate to ResourceType
  initialShips: { type: string; count: number }[]; // Replace string with ShipType enum if available
  worldSize: {
    width: number;
    height: number;
  };
  sectorCount: number;
  asteroidDensity: number;
  difficulty: DifficultyLevel; // Allows standard difficulties and custom string values
  gameSpeedMultiplier: number;
  tickRate: number;
  saveInterval: number; // in seconds
  features: {
    enableTrading: boolean;
    enableDiplomacy: boolean;
    enableCombatAI: boolean;
    enableStoryEvents: boolean;
    // Add other feature flags as needed
  };
  ui: {
    defaultZoomLevel: number;
    showGrid: boolean;
    // Add other UI settings as needed
  };
  // Add other configuration sections as needed (e.g., AI behavior defaults, resource generation rates)
}

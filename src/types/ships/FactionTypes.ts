import { ShipType } from './ShipTypes';

export type FactionId = 'space-rats' | 'lost-nova' | 'equator-horizon';

export type FactionBehaviorType =
  | 'aggressive'
  | 'defensive'
  | 'hit-and-run'
  | 'stealth'
  | 'balance';

export interface FactionConfig {
  id: FactionId;
  name: string;
  banner: {
    primaryColor: string;
    secondaryColor: string;
    sigil: string;
  };
  defaultBehavior: FactionBehaviorType;
  spawnConditions: {
    minThreatLevel: number;
    maxShipsPerFleet: number;
    territoryPreference: string[];
  };
}

export interface FactionState {
  id: FactionId;
  fleetStrength: number;
  threatLevel: number;
  territory: string[];
  relationships: Record<FactionId, number>;
  activeShips: ShipType[];
  currentBehavior: FactionBehaviorType;
}

// Faction-specific configurations
export interface SpaceRatsConfig extends FactionConfig {
  id: 'space-rats';
  pirateFleetComposition: {
    flagshipType: string;
    supportShips: string[];
  };
}

export interface LostNovaConfig extends FactionConfig {
  id: 'lost-nova';
  forbiddenTech: {
    darkMatterLevel: number;
    geneticModifications: string[];
  };
}

export interface EquatorHorizonConfig extends FactionConfig {
  id: 'equator-horizon';
  balanceThresholds: {
    playerExpansion: number;
    resourceControl: number;
    techLevel: number;
  };
}

export type FactionId =
  | 'player'
  | 'enemy'
  | 'neutral'
  | 'ally'
  | 'space-rats'
  | 'lost-nova'
  | 'equator-horizon';

export type FactionBehaviorType = {
  formation: string;
  behavior: string;
  target?: string;
};

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
  name: string;
  color: string;
  relations: {
    [key in FactionId]: number;
  };
  resources: {
    [key: string]: number;
  };
  territory: {
    systems: string[];
    outposts: string[];
    colonies: string[];
  };
  fleets: {
    [key: string]: {
      ships: string[];
      position: {
        x: number;
        y: number;
      };
      status: string;
    };
  };
  tech: {
    [key: string]: {
      level: number;
      progress: number;
    };
  };
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

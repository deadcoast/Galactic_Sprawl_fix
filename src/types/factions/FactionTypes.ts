import { ShipType } from './ShipTypes';
import { WeaponType } from '../combat/CombatTypes';

export type FactionId = "space-rats" | "lost-nova" | "equator-horizon";

export type FactionBehaviorType = 'aggressive' | 'defensive' | 'hit-and-run' | 'stealth' | 'balance';

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

export interface AIBehavior {
  id: string;
  type: FactionBehaviorType;
  priority: 'attack' | 'defend' | 'support';
  conditions: {
    healthThreshold: number;
    shieldThreshold: number;
    targetDistance: number;
    allySupport: boolean;
  };
}

export interface FactionState {
  id: FactionId;
  fleetStrength: number;
  threatLevel: number;
  territory: string[];
  relationships: Record<FactionId, number>;
  activeShips: ShipType[];
  currentBehavior: AIBehavior;
}

export interface FactionManager {
  factions: Record<FactionId, FactionState>;
  updateBehavior: (factionId: FactionId, behavior: AIBehavior) => void;
  spawnFleet: (factionId: FactionId, systemId: string) => void;
  updateTerritory: (factionId: FactionId, territory: string[]) => void;
  updateRelationships: (factionId: FactionId, relationships: Record<FactionId, number>) => void;
}

// Faction-specific configurations
export interface SpaceRatsConfig extends FactionConfig {
  id: "space-rats";
  pirateFleetComposition: {
    flagshipType: 'ratKing';
    supportShips: string[];
  };
}

export interface LostNovaConfig extends FactionConfig {
  id: "lost-nova";
  forbiddenTech: {
    darkMatterLevel: number;
    geneticModifications: string[];
  };
}

export interface EquatorHorizonConfig extends FactionConfig {
  id: "equator-horizon";
  balanceThresholds: {
    playerExpansion: number;
    resourceControl: number;
    techLevel: number;
  };
} 
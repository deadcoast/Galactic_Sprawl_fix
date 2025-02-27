import { Position } from '../core/GameTypes';

// Base module interface that all modules share
export interface BaseModule {
  id: string;
  name: string;
  type: ModuleType;
  position: Position;
  isActive: boolean;
  level: number;
  status: 'active' | 'constructing' | 'inactive';
  progress?: number;
}

// All possible module types
export type ModuleType =
  // Core modules (available to both Mothership and Colony)
  | 'radar'
  | 'hangar'
  | 'academy'
  // Colony-only modules
  | 'exploration'
  | 'mineral'
  | 'trading'
  | 'population'
  | 'infrastructure'
  | 'research'
  | 'food'
  | 'defense'
  // System modules
  | 'resource-manager';

// Building types that can have modules
export type BuildingType = 'mothership' | 'colony';

// Module requirements for attachment
export interface ModuleRequirements {
  minLevel: number;
  buildingType: BuildingType[];
  resourceCosts: {
    type: string;
    amount: number;
  }[];
}

// Module configuration
export interface ModuleConfig {
  type: ModuleType;
  name: string;
  description: string;
  requirements: ModuleRequirements;
  baseStats: {
    power: number;
    crew: number;
    upkeep: number;
  };
}

// Module attachment point
export interface ModuleAttachmentPoint {
  id: string;
  position: Position;
  allowedTypes: ModuleType[];
  currentModule?: BaseModule;
}

// Building that can have modules
export interface ModularBuilding {
  id: string;
  type: BuildingType;
  level: number;
  modules: BaseModule[];
  status: 'active' | 'constructing' | 'inactive';
  attachmentPoints: ModuleAttachmentPoint[];
}

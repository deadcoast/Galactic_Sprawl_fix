import { Position } from '../core/GameTypes';
import { ResourceType } from "./../resources/ResourceTypes";
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
  subModules?: SubModule[]; // Add support for sub-modules
  parentModuleId?: string; // Reference to parent module if this is a sub-module
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
  | ResourceType.POPULATION
  | 'infrastructure'
  | ResourceType.RESEARCH
  | 'food'
  | 'defense'
  // System modules
  | 'resource-manager';

// Sub-module types
export type SubModuleType =
  | 'enhancer' // Enhances parent module capabilities
  | 'converter' // Converts resources or outputs
  | 'processor' // Processes inputs or outputs
  | 'storage' // Provides additional storage
  | 'efficiency' // Improves efficiency
  | 'automation' // Adds automation capabilities
  | 'specialized' // Specialized functionality
  | 'utility'; // General utility functions

// Sub-module interface
export interface SubModule {
  id: string;
  name: string;
  type: SubModuleType;
  parentModuleId: string;
  isActive: boolean;
  level: number;
  status: 'active' | 'constructing' | 'inactive';
  progress?: number;
  effects: SubModuleEffect[];
  requirements?: SubModuleRequirements;
}

// Sub-module effect types
export type SubModuleEffectType =
  | 'stat_boost' // Boosts a stat
  | 'resource_boost' // Boosts resource production/consumption
  | 'unlock_ability' // Unlocks a new ability
  | 'reduce_cost' // Reduces costs
  | 'automation' // Adds automation
  | 'special'; // Special effects

// Sub-module effect interface
export interface SubModuleEffect {
  type: SubModuleEffectType;
  target: string; // What the effect targets (stat name, resource type, etc.)
  value: number; // Effect value (percentage or absolute)
  isPercentage: boolean; // Whether the value is a percentage
  description: string;
}

// Sub-module requirements
export interface SubModuleRequirements {
  parentModuleLevel: number;
  parentModuleTypes: ModuleType[];
  resourceCosts: {
    type: string;
    amount: number;
  }[];
  incompatibleWith?: SubModuleType[]; // Sub-module types that cannot be installed together
}

// Sub-module configuration
export interface SubModuleConfig {
  type: SubModuleType;
  name: string;
  description: string;
  requirements: SubModuleRequirements;
  effects: SubModuleEffect[];
  baseStats: {
    power: number;
    space: number;
    complexity: number;
  };
}

// Sub-module attachment point
export interface SubModuleAttachmentPoint {
  id: string;
  parentModuleId: string;
  allowedTypes: SubModuleType[];
  currentSubModule?: SubModule;
  maxSubModules: number;
}

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
  subModuleSupport?: {
    maxSubModules: number;
    allowedTypes: SubModuleType[];
    attachmentPoints?: SubModuleAttachmentPoint[];
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

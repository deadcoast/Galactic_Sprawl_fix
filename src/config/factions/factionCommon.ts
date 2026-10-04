import { ResourceType } from 'src/types/resources/ResourceTypes';
import { FactionShipClass } from 'src/types/ships/FactionShipTypes';

export type FactionId =
  | 'player'
  | 'enemy'
  | 'neutral'
  | 'ally'
  | 'space-rats'
  | 'lost-nova'
  | 'equator-horizon';

export interface FactionConfig {
  id: FactionId;
  name: string;
  description: string;
  baseRelationship: number;
  shipClasses: FactionShipClass[];
  // behaviorConfig: FactionBehaviorConfig; // Temporarily remove due to import issue
  specialRules?: {
    alwaysHostile?: boolean;
    requiresProvocation?: boolean;
    powerThreshold?: number;
  };
  fleetComposition?: {
    maxFleets: number;
    maxShipsPerFleet: number;
  };
  territoryConfig?: {
    initialRadius: number;
    expansionRate: number;
  };
  resourcePriorities?: ResourceType[];
  pirateFleetComposition?: {
    flagshipType: FactionShipClass;
    supportShips: string[];
  };
}

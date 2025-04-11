import { HazardEffectType } from '../../effects/types_effects/EnvironmentalHazardEffects';
import { Position } from '../core/GameTypes';

/**
 * Defines the events emitted by the EnvironmentalHazardManager
 */
export interface EnvironmentalHazardManagerEvents {
  /** Emitted when a new hazard is created */
  hazardCreated: {
    hazardId: string;
    hazardType: HazardEffectType['type'];
    position: Position;
  };

  /** Emitted when a hazard is removed */
  hazardRemoved: {
    hazardId: string;
  };

  // Index signature for compatibility
  [key: string]: unknown;
}

// Optional corresponding enum
export enum EnvironmentalHazardEventType {
  HAZARD_CREATED = 'hazardCreated',
  HAZARD_REMOVED = 'hazardRemoved',
}

/**
 * FactionEvents.ts
 *
 * This file defines the events related to factions.
 * These events are used by faction managers and related components.
 */

import { ResourceType } from '../resources/ResourceTypes';
import { FactionBehaviorType, FactionId } from '../ships/FactionTypes';

/**
 * Base faction event interface
 */
export interface FactionEvent {
  factionId: FactionId;
  timestamp?: number;
}

/**
 * Faction behavior event interface
 */
export interface FactionBehaviorChangedEvent extends FactionEvent {
  oldBehavior: FactionBehaviorType;
  newBehavior: FactionBehaviorType;
}

/**
 * Faction fleet event interface
 */
export interface FactionFleetEvent extends FactionEvent {
  fleets: FactionFleet[];
}

/**
 * Faction territory event interface
 */
export interface FactionTerritoryEvent extends FactionEvent {
  territory: FactionTerritory;
}

/**
 * Faction relationship event interface
 */
export interface FactionRelationshipEvent extends FactionEvent {
  targetFaction: FactionId;
  oldValue: number;
  newValue: number;
}

/**
 * Faction resource event interface
 */
export interface FactionResourceEvent extends FactionEvent {
  resourceType: ResourceType;
  oldAmount: number;
  newAmount: number;
}

/**
 * Faction combat tactics event interface
 */
export interface FactionCombatTacticsEvent extends FactionEvent {
  oldTactics: FactionCombatTactics;
  newTactics: FactionCombatTactics;
}

/**
 * Faction fleet interface
 */
export interface FactionFleet {
  id: string;
  name: string;
  ships: FactionShip[];
  formation: {
    type: 'offensive' | 'defensive' | 'balanced';
    spacing: number;
    facing: number;
  };
  status: 'idle' | 'patrolling' | 'engaging' | 'retreating';
  position: {
    x: number;
    y: number;
  };
}

/**
 * Faction ship interface
 */
export interface FactionShip {
  id: string;
  name: string;
  type: FactionShipClass;
  level: number;
  status: 'idle' | 'engaging' | 'retreating' | 'damaged';
}

/**
 * Faction ship class type
 */
export type FactionShipClass = string;

/**
 * Faction territory interface
 */
export interface FactionTerritory {
  center: {
    x: number;
    y: number;
  };
  radius: number;
  controlPoints: {
    x: number;
    y: number;
  }[];
  resources: Record<ResourceType, number>;
  threatLevel: number;
}

/**
 * Faction combat tactics interface
 */
export interface FactionCombatTactics {
  preferredRange: 'close' | 'medium' | 'long';
  formationStyle: 'aggressive' | 'defensive' | 'balanced';
  targetPriority: 'ships' | 'stations' | 'resources';
  retreatThreshold: number;
  reinforcementThreshold: number;
}

/**
 * Interface defining all faction-related events
 */
export interface FactionEvents {
  /**
   * Emitted when a faction's behavior changes
   */
  'faction:behavior-changed': FactionBehaviorChangedEvent;

  /**
   * Emitted when a faction's fleet is updated
   */
  'faction:fleet-updated': FactionFleetEvent;

  /**
   * Emitted when a faction's territory changes
   */
  'faction:territory-changed': FactionTerritoryEvent;

  /**
   * Emitted when a faction's relationship with another faction changes
   */
  'faction:relationship-changed': FactionRelationshipEvent;

  /**
   * Emitted when a faction's resources are updated
   */
  'faction:resources-updated': FactionResourceEvent;

  /**
   * Emitted when a faction's combat tactics change
   */
  'faction:combat-tactics-changed': FactionCombatTacticsEvent;
}

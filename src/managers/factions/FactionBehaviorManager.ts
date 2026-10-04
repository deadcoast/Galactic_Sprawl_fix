/**
 * FactionBehaviorManager.ts
 *
 * This manager handles faction behavior using the standardized event system.
 */

import { TypedEventEmitter } from '../../lib/events/EventEmitter';
import {
  FactionCombatTactics,
  FactionEvents,
  FactionFleet,
  FactionTerritory,
} from '../../types/events/FactionEvents';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { FactionBehaviorType, FactionId } from '../../types/ships/FactionTypes';

/**
 * Faction behavior manager class that uses standardized types and events
 */
export class FactionBehaviorManager extends TypedEventEmitter<FactionEvents> {
  private factions = new Map<FactionId, FactionState>();

  /**
   * Constructor
   */
  constructor() {
    super();
  }

  /**
   * Get a faction's state
   * @param factionId The ID of the faction
   * @returns The faction state, or undefined if not found
   */
  public getFactionState(factionId: FactionId): FactionState | undefined {
    return this.factions.get(factionId);
  }

  /**
   * Set a faction's state
   * @param factionId The ID of the faction
   * @param state The faction state
   */
  public setFactionState(factionId: FactionId, state: FactionState): void {
    this.factions.set(factionId, state);
  }

  /**
   * Change a faction's behavior
   * @param factionId The ID of the faction
   * @param newBehavior The new behavior
   * @returns True if the behavior was changed, false if the faction was not found
   */
  public changeBehavior(factionId: FactionId, newBehavior: FactionBehaviorType): boolean {
    const faction = this.factions.get(factionId);
    if (!faction) {
      return false;
    }

    const oldBehavior = faction.behavior;
    faction.behavior = newBehavior;
    this.factions.set(factionId, faction);

    this.emit('faction:behavior-changed', {
      factionId,
      oldBehavior,
      newBehavior,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Update a faction's fleets
   * @param factionId The ID of the faction
   * @param fleets The new fleets
   * @returns True if the fleets were updated, false if the faction was not found
   */
  public updateFleets(factionId: FactionId, fleets: FactionFleet[]): boolean {
    const faction = this.factions.get(factionId);
    if (!faction) {
      return false;
    }

    faction.fleets = fleets;
    this.factions.set(factionId, faction);

    this.emit('faction:fleet-updated', {
      factionId,
      fleets,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Update a faction's territory
   * @param factionId The ID of the faction
   * @param territory The new territory
   * @returns True if the territory was updated, false if the faction was not found
   */
  public updateTerritory(factionId: FactionId, territory: FactionTerritory): boolean {
    const faction = this.factions.get(factionId);
    if (!faction) {
      return false;
    }

    faction.territory = territory;
    this.factions.set(factionId, faction);

    this.emit('faction:territory-changed', {
      factionId,
      territory,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Update a faction's relationship with another faction
   * @param factionId The ID of the faction
   * @param targetFaction The ID of the target faction
   * @param newValue The new relationship value
   * @returns True if the relationship was updated, false if the faction was not found
   */
  public updateRelationship(
    factionId: FactionId,
    targetFaction: FactionId,
    newValue: number
  ): boolean {
    const faction = this.factions.get(factionId);
    if (!faction) {
      return false;
    }

    const oldValue = faction.relationships[targetFaction] ?? 0;
    faction.relationships[targetFaction] = newValue;
    this.factions.set(factionId, faction);

    this.emit('faction:relationship-changed', {
      factionId,
      targetFaction,
      oldValue,
      newValue,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Update a faction's resources
   * @param factionId The ID of the faction
   * @param resourceType The type of resource
   * @param newAmount The new amount
   * @returns True if the resources were updated, false if the faction was not found
   */
  public updateResources(
    factionId: FactionId,
    resourceType: ResourceType,
    newAmount: number
  ): boolean {
    const faction = this.factions.get(factionId);
    if (!faction) {
      return false;
    }

    const oldAmount = faction.resources[resourceType] ?? 0;
    faction.resources[resourceType] = newAmount;
    this.factions.set(factionId, faction);

    this.emit('faction:resources-updated', {
      factionId,
      resourceType,
      oldAmount,
      newAmount,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Update a faction's combat tactics
   * @param factionId The ID of the faction
   * @param newTactics The new combat tactics
   * @returns True if the combat tactics were updated, false if the faction was not found
   */
  public updateCombatTactics(factionId: FactionId, newTactics: FactionCombatTactics): boolean {
    const faction = this.factions.get(factionId);
    if (!faction) {
      return false;
    }

    const oldTactics = faction.combatTactics;
    faction.combatTactics = newTactics;
    this.factions.set(factionId, faction);

    this.emit('faction:combat-tactics-changed', {
      factionId,
      oldTactics,
      newTactics,
      timestamp: Date.now(),
    });

    return true;
  }
}

/**
 * Faction state interface
 */
export interface FactionState {
  id: FactionId;
  name: string;
  behavior: FactionBehaviorType;
  fleets: FactionFleet[];
  territory: FactionTerritory;
  relationships: Record<FactionId, number>;
  resources: Record<ResourceType, number>;
  combatTactics: FactionCombatTactics;
}

/**
 * Example usage:
 *
 * ```typescript
 * // Create a new faction behavior manager
 * const factionBehaviorManager = new FactionBehaviorManager();
 *
 * // Subscribe to events
 * factionBehaviorManager.on('faction:behavior-changed', ({ factionId, oldBehavior, newBehavior }) => {
 *   console.warn(`Faction ${factionId} behavior changed from ${oldBehavior} to ${newBehavior}`);
 * });
 *
 * // Change a faction's behavior
 * factionBehaviorManager.changeBehavior('player', 'aggressive');
 * ```
 */

import { factionConfigs } from '../../config/factions/factions';
import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import {
  EventType,
  FactionConflictRecordedEventData,
  FactionRelationshipChangedEventData,
  FactionTradeEstablishedEventData,
  FactionTreatyStatusChangedEventData,
} from '../../types/events/EventTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { FactionId } from '../../types/ships/FactionTypes';

interface RelationshipState {
  value: number; // -1 to 1
  lastUpdate: number;
  tradeCount: number;
  conflictCount: number;
  treatyStatus: 'none' | 'ceasefire' | 'trade' | 'alliance';
}

export class FactionRelationshipManager {
  private relationships: Map<string, RelationshipState> = new Map();

  constructor() {
    this.initializeRelationships();
    this.setupEventListeners();
  }

  private initializeRelationships(): void {
    // Initialize relationships between all factions
    const factionIds = Object.keys(factionConfigs);

    factionIds.forEach(factionId => {
      factionIds.forEach(targetId => {
        if (
          factionId !== targetId &&
          this.isValidFactionId(factionId) &&
          this.isValidFactionId(targetId)
        ) {
          const key = this.getRelationshipKey(factionId, targetId);
          this.relationships.set(key, {
            value: this.getInitialRelationshipValue(factionId, targetId),
            lastUpdate: Date.now(),
            tradeCount: 0,
            conflictCount: 0,
            treatyStatus: 'none',
          });
        }
      });
    });
  }

  /**
   * Type guard to validate if a string is a valid FactionId
   */
  private isValidFactionId(id: string): id is FactionId {
    return id in factionConfigs;
  }

  /**
   * Type guard to validate resource transfer event data
   */
  private isResourceTransferEventData(data: unknown): data is {
    sourceFaction: FactionId;
    targetFaction: FactionId;
    resourceType: ResourceType;
    amount: number;
  } {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const obj = data as Record<string, unknown>;

    return (
      'sourceFaction' in obj &&
      'targetFaction' in obj &&
      'resourceType' in obj &&
      'amount' in obj &&
      this.isValidFactionId(String(obj.sourceFaction)) &&
      this.isValidFactionId(String(obj.targetFaction)) &&
      typeof obj.resourceType === 'string' &&
      (typeof obj.amount === 'number' || typeof obj.amount === 'string')
    );
  }

  /**
   * Type guard to validate combat event data
   */
  private isCombatEventData(data: unknown): data is {
    type: 'combat';
    attackerFaction: FactionId;
    defenderFaction: FactionId;
    damage?: number;
  } {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const obj = data as Record<string, unknown>;

    return (
      'type' in obj &&
      obj.type === 'combat' &&
      'attackerFaction' in obj &&
      'defenderFaction' in obj &&
      this.isValidFactionId(String(obj.attackerFaction)) &&
      this.isValidFactionId(String(obj.defenderFaction))
    );
  }

  private setupEventListeners(): void {
    moduleEventBus.subscribe('RESOURCE_TRANSFERRED', event => {
      if (this.isResourceTransferEventData(event?.data)) {
        this.recordTrade(
          event?.data?.sourceFaction,
          event?.data?.targetFaction,
          event?.data?.resourceType,
          Number(event?.data?.amount)
        );
      }
    });

    moduleEventBus.subscribe('STATUS_CHANGED', event => {
      if (this.isCombatEventData(event?.data)) {
        this.recordConflict(
          event?.data?.attackerFaction,
          event?.data?.defenderFaction,
          'attack',
          event?.data?.damage !== undefined ? Number(event?.data?.damage) : 1
        );
      }
    });
  }

  private getRelationshipKey(factionId: FactionId, targetId: FactionId): string {
    return [factionId, targetId].sort().join('-');
  }

  private getInitialRelationshipValue(factionId: FactionId, targetId: FactionId): number {
    const faction = factionConfigs[factionId];
    const target = factionConfigs[targetId];

    if (faction.specialRules.alwaysHostile || target.specialRules.alwaysHostile) {
      return -0.5; // Start hostile
    }

    // Calculate initial relationship based on behavior compatibility
    const aggressionDiff = Math.abs(
      faction.behavior.baseAggression - target.behavior.baseAggression
    );
    const tradingDiff = Math.abs(
      faction.behavior.tradingPreference - target.behavior.tradingPreference
    );

    return 0.5 - (aggressionDiff + tradingDiff) / 4; // Results in range -0.5 to 0.5
  }

  public getRelationship(factionId: FactionId, targetId: FactionId): number {
    const key = this.getRelationshipKey(factionId, targetId);
    return this.relationships.get(key)?.value ?? 0;
  }

  public getTreatyStatus(
    factionId: FactionId,
    targetId: FactionId
  ): RelationshipState['treatyStatus'] {
    const key = this.getRelationshipKey(factionId, targetId);
    return this.relationships.get(key)?.treatyStatus || 'none';
  }

  /**
   * Helper method to emit module events with proper typing
   * @param factionId - The ID of the faction related to the event
   * @param eventType - The type of event to emit (must be a valid ModuleEventType)
   * @param data - Additional data to include with the event
   */
  private emitModuleEvent(
    factionId: FactionId,
    eventType: string,
    data: Record<string, unknown>
  ): void {
    // Validate that eventType is a valid ModuleEventType
    // This is a runtime check since we can't enforce this at compile time
    const validEventTypes = [
      'STATUS_CHANGED',
      'RELATIONSHIP_UPDATED',
      'TREATY_ESTABLISHED',
      'TREATY_BROKEN',
      'DIPLOMATIC_ACTION',
    ];

    // Use the provided eventType or default to STATUS_CHANGED if invalid
    const finalEventType = validEventTypes.includes(eventType) ? eventType : 'STATUS_CHANGED';

    moduleEventBus.emit({
      type: finalEventType as ModuleEventType,
      moduleId: `faction-${factionId}`,
      moduleType: 'trading' as ModuleType,
      timestamp: Date.now(),
      data: {
        ...data,
      },
    });
  }

  public modifyRelationship(
    factionId: FactionId,
    targetId: FactionId,
    change: number,
    reason: string
  ): void {
    const key = this.getRelationshipKey(factionId, targetId);
    const state = this.relationships.get(key);

    if (state) {
      const oldValue = state.value;
      state.value = Math.max(-1, Math.min(1, state.value + change));
      state.lastUpdate = Date.now();

      const eventData: FactionRelationshipChangedEventData = {
        factionId,
        targetFactionId: targetId,
        oldValue,
        newValue: state.value,
        reason,
      };
      eventSystem.publish({
        type: EventType.FACTION_RELATIONSHIP_CHANGED,
        managerId: 'FactionRelationshipManager',
        timestamp: Date.now(),
        data: eventData,
      });

      this.updateTreatyStatus(factionId, targetId);

      this.emitModuleEvent(factionId, 'relationship', {
        type: 'relationship',
        targetFaction: targetId,
        oldValue,
        newValue: state.value,
        reason,
      });
    }
  }

  private updateTreatyStatus(factionId: FactionId, targetId: FactionId): void {
    const key = this.getRelationshipKey(factionId, targetId);
    const state = this.relationships.get(key);

    if (!state) {
      return;
    }

    const oldStatus = state.treatyStatus;
    let newStatus: RelationshipState['treatyStatus'] = 'none';

    // Determine new status based on relationship value
    if (state.value >= 0.8) {
      newStatus = 'alliance';
    } else if (state.value >= 0.5) {
      newStatus = 'trade';
    } else if (state.value >= 0) {
      newStatus = 'ceasefire';
    }

    if (newStatus !== oldStatus) {
      state.treatyStatus = newStatus;

      const eventData: FactionTreatyStatusChangedEventData = {
        factionId,
        targetFactionId: targetId,
        oldStatus,
        newStatus,
      };
      eventSystem.publish({
        type: EventType.FACTION_TREATY_STATUS_CHANGED,
        managerId: 'FactionRelationshipManager',
        timestamp: Date.now(),
        data: eventData,
      });

      this.emitModuleEvent(factionId, 'treaty', {
        type: 'treaty',
        targetFaction: targetId,
        oldStatus,
        newStatus,
      });
    }
  }

  public recordTrade(
    factionId: FactionId,
    targetId: FactionId,
    resourceType: ResourceType,
    amount: number
  ): void {
    const key = this.getRelationshipKey(factionId, targetId);
    const state = this.relationships.get(key);

    if (state) {
      state.tradeCount++;

      // Improve relationship based on trade
      const relationshipChange =
        (Math.min(0.1, amount / 1000) *
          (factionConfigs[factionId].behavior.tradingPreference +
            factionConfigs[targetId].behavior.tradingPreference)) /
        2;

      this.modifyRelationship(factionId, targetId, relationshipChange, 'trade');

      const eventData: FactionTradeEstablishedEventData = {
        factionId,
        targetFactionId: targetId,
        resourceType,
        amount,
      };
      eventSystem.publish({
        type: EventType.FACTION_TRADE_ESTABLISHED,
        managerId: 'FactionRelationshipManager',
        timestamp: Date.now(),
        data: eventData,
      });
    }
  }

  public recordConflict(
    factionId: FactionId,
    targetId: FactionId,
    type: 'attack' | 'territory' | 'trade',
    severity: number
  ): void {
    const key = this.getRelationshipKey(factionId, targetId);
    const state = this.relationships.get(key);

    if (state) {
      state.conflictCount++;

      // Worsen relationship based on conflict
      const relationshipChange =
        (-Math.min(0.2, severity / 100) *
          (factionConfigs[factionId].behavior.baseAggression +
            factionConfigs[targetId].behavior.baseAggression)) /
        2;

      this.modifyRelationship(factionId, targetId, relationshipChange, `conflict_${type}`);

      const eventData: FactionConflictRecordedEventData = {
        factionId,
        targetFactionId: targetId,
        conflictType: type,
        severity,
      };
      eventSystem.publish({
        type: EventType.FACTION_CONFLICT_RECORDED,
        managerId: 'FactionRelationshipManager',
        timestamp: Date.now(),
        data: eventData,
      });
    }
  }

  public canEstablishTreaty(
    factionId: FactionId,
    targetId: FactionId,
    type: RelationshipState['treatyStatus']
  ): boolean {
    const relationship = this.getRelationship(factionId, targetId);
    const faction = factionConfigs[factionId];
    const target = factionConfigs[targetId];

    // Check for special rules that prevent treaties
    if (faction.specialRules.alwaysHostile || target.specialRules.alwaysHostile) {
      return false;
    }

    // Check relationship requirements for different treaty types
    switch (type) {
      case 'alliance':
        return relationship >= 0.8;
      case 'trade':
        return relationship >= 0.5;
      case 'ceasefire':
        return relationship >= 0;
      default:
        return true;
    }
  }

  public cleanup(): void {
    this.relationships.clear();
  }

  /**
   * Handle diplomatic action
   */
  public handleDiplomaticAction(
    factionId: FactionId,
    targetId: FactionId,
    action: 'ceasefire' | 'tradeRoute' | 'alliance' | 'tribute',
    resources?: { type: string; amount: number }[]
  ): boolean {
    const key = this.getRelationshipKey(factionId, targetId);
    const state = this.relationships.get(key);

    if (!state) {
      return false;
    }

    const faction = factionConfigs[factionId];
    const target = factionConfigs[targetId];

    // Check if action is allowed based on special rules
    if (
      (faction.specialRules.alwaysHostile || target.specialRules.alwaysHostile) &&
      action !== 'tribute'
    ) {
      return false;
    }

    let success = false;
    let relationshipChange = 0;

    switch (action) {
      case 'ceasefire':
        if (state.value < 0 && !state.treatyStatus) {
          success = true;
          relationshipChange = 0.2;
          state.treatyStatus = 'ceasefire';
        }
        break;

      case 'tradeRoute':
        if (state.value >= 0 && state.treatyStatus !== 'alliance') {
          success = true;
          relationshipChange = 0.3;
          state.treatyStatus = 'trade';
        }
        break;

      case 'alliance':
        if (state.value >= 0.5 && state.treatyStatus === 'trade') {
          success = true;
          relationshipChange = 0.4;
          state.treatyStatus = 'alliance';
        }
        break;

      case 'tribute':
        if (resources && resources.length > 0) {
          success = true;
          // Calculate relationship improvement based on tribute value
          relationshipChange = Math.min(
            0.2,
            resources.reduce((total, r) => total + r.amount, 0) / 5000
          );
        }
        break;
    }

    if (success) {
      this.modifyRelationship(factionId, targetId, relationshipChange, `diplomatic_${action}`);

      // Emit module event for diplomatic action
      this.emitModuleEvent(factionId, 'diplomatic_action', {
        type: 'diplomatic_action',
        action,
        targetFaction: targetId,
        success: true,
        resources,
      });
    }

    return success;
  }

  /**
   * Get available diplomatic actions
   */
  public getAvailableDiplomaticActions(
    factionId: FactionId,
    targetId: FactionId
  ): {
    type: 'ceasefire' | 'tradeRoute' | 'alliance' | 'tribute';
    name: string;
    description: string;
    requirements: { type: string; value: number }[];
    available: boolean;
  }[] {
    const relationship = this.getRelationship(factionId, targetId);
    const treatyStatus = this.getTreatyStatus(factionId, targetId);
    const faction = factionConfigs[factionId];
    const target = factionConfigs[targetId];

    const actions: {
      type: 'ceasefire' | 'tradeRoute' | 'alliance' | 'tribute';
      name: string;
      description: string;
      requirements: { type: string; value: number }[];
      available: boolean;
    }[] = [];

    // Always allow tribute
    actions.push({
      type: 'tribute',
      name: 'Offer Tribute',
      description: 'Improve relations through resource offerings',
      requirements: [
        { type: 'Credits', value: 2500 },
        { type: 'Resources', value: 1000 },
      ],
      available: true,
    });

    // Don't allow other diplomatic actions with always hostile factions
    if (faction.specialRules.alwaysHostile || target.specialRules.alwaysHostile) {
      return actions;
    }

    // Ceasefire
    if (relationship < 0 && treatyStatus === 'none') {
      actions.push({
        type: 'ceasefire',
        name: 'Negotiate Ceasefire',
        description: 'Attempt to establish temporary peace',
        requirements: [
          { type: 'Credits', value: 5000 },
          { type: 'Reputation', value: -50 },
        ],
        available: true,
      });
    }

    // Trade Route
    if (relationship >= 0 && treatyStatus !== 'alliance') {
      actions.push({
        type: 'tradeRoute',
        name: 'Establish Trade Route',
        description: 'Create a trade route for resource exchange',
        requirements: [
          { type: 'Credits', value: 10000 },
          { type: 'Reputation', value: 0 },
        ],
        available: relationship >= 0,
      });
    }

    // Alliance
    if (relationship >= 0.5 && treatyStatus === 'trade') {
      actions.push({
        type: 'alliance',
        name: 'Form Alliance',
        description: 'Establish a formal alliance for mutual benefit',
        requirements: [
          { type: 'Credits', value: 25000 },
          { type: 'Reputation', value: 50 },
        ],
        available: relationship >= 0.5,
      });
    }

    return actions;
  }
}

// Export singleton instance
export const factionRelationshipManager = new FactionRelationshipManager();
